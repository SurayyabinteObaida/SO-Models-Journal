// "Solve the Problem" — drag-and-drop pipeline builder.
// Self-contained module: exposes window.SOLVE.open(problemId) as the entry point.
// Depends on globals: BLOCKS, BLOCK_CATEGORIES, PROBLEMS (problems.js),
// runHeuristicCheck (heuristic.js), and window.BACKEND_URL.

(function () {
  let state = null; // current builder session state, reset on open()

  function freshState(problem) {
    return {
      problem,
      nodes: [],      // {nodeId, blockId, x, y}
      edges: [],      // {from, to}
      nextNodeId: 1,
      connectFrom: null, // nodeId currently being dragged from, for connection mode
      selectedNodeId: null,
    };
  }

  function blockById(id) {
    return BLOCKS.find((b) => b.id === id) || null;
  }

  function genNodeId() {
    return "n" + state.nextNodeId++;
  }

  // ---------- Rendering ----------

  function render() {
    renderPalette();
    renderCanvas();
    renderInspector();
  }

  function renderPalette() {
    const el = document.getElementById('solvePalette');
    const validIds = new Set(state.problem.validBlockIds);
    const byCategory = {};
    BLOCKS.forEach((b) => {
      if (!validIds.has(b.id)) return;
      (byCategory[b.category] = byCategory[b.category] || []).push(b);
    });

    let html = '';
    Object.keys(BLOCK_CATEGORIES).forEach((cat) => {
      if (!byCategory[cat]) return;
      const catInfo = BLOCK_CATEGORIES[cat];
      html += `<div class="solve-cat-label" style="color:${catInfo.color}">${catInfo.label}</div>`;
      byCategory[cat].forEach((b) => {
        html += `<div class="solve-block-chip" draggable="true" data-block-id="${b.id}" style="border-color:${catInfo.color}">
          <span class="chip-dot" style="background:${catInfo.color}"></span>${b.label}
        </div>`;
      });
    });
    el.innerHTML = html;

    el.querySelectorAll('.solve-block-chip').forEach((chip) => {
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/block-id', chip.dataset.blockId);
      });
      // tap-to-add fallback for touch/no-drag environments
      chip.addEventListener('click', () => {
        addNode(chip.dataset.blockId, 60 + Math.random() * 40, 60 + Math.random() * 40);
      });
    });
  }

  function renderCanvas() {
    const svgLayer = document.getElementById('solveEdgesSvg');
    const nodesLayer = document.getElementById('solveNodesLayer');

    // edges as SVG lines with arrowheads
    let svgHtml = `<defs><marker id="solveArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="var(--ink)"/></marker></defs>`;
    state.edges.forEach((e, i) => {
      const fromN = state.nodes.find((n) => n.nodeId === e.from);
      const toN = state.nodes.find((n) => n.nodeId === e.to);
      if (!fromN || !toN) return;
      const x1 = fromN.x + 70, y1 = fromN.y + 24;
      const x2 = toN.x, y2 = toN.y + 24;
      const midX = (x1 + x2) / 2;
      svgHtml += `<path d="M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}"
        fill="none" stroke="var(--ink)" stroke-width="1.8" marker-end="url(#solveArrow)" opacity="0.55"
        class="solve-edge" data-edge-idx="${i}"/>`;
    });
    svgLayer.innerHTML = svgHtml;
    svgLayer.querySelectorAll('.solve-edge').forEach((path) => {
      path.style.cursor = 'pointer';
      path.style.pointerEvents = 'stroke';
      path.addEventListener('click', () => {
        const idx = parseInt(path.dataset.edgeIdx);
        state.edges.splice(idx, 1);
        render();
      });
    });

    // nodes as absolutely-positioned chips
    nodesLayer.innerHTML = state.nodes.map((n) => {
      const block = blockById(n.blockId);
      const cat = BLOCK_CATEGORIES[block.category];
      const isConnecting = state.connectFrom === n.nodeId;
      const isSelected = state.selectedNodeId === n.nodeId;
      return `<div class="solve-node ${isConnecting ? 'connecting' : ''} ${isSelected ? 'selected' : ''}"
        data-node-id="${n.nodeId}" style="left:${n.x}px; top:${n.y}px; border-color:${cat.color};">
        <span class="node-dot" style="background:${cat.color}"></span>
        <span class="node-label">${block.label}</span>
        <button class="node-connect-handle" data-connect="${n.nodeId}" title="Drag to connect">→</button>
        <button class="node-delete" data-delete="${n.nodeId}" title="Remove">✕</button>
      </div>`;
    }).join('');

    // node dragging (repositioning)
    nodesLayer.querySelectorAll('.solve-node').forEach((nodeEl) => {
      let dragging = false, offsetX = 0, offsetY = 0;
      nodeEl.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        dragging = true;
        const rect = nodeEl.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        state.selectedNodeId = nodeEl.dataset.nodeId;
        e.preventDefault();
      });
      document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const canvasRect = document.getElementById('solveCanvas').getBoundingClientRect();
        const n = state.nodes.find((x) => x.nodeId === nodeEl.dataset.nodeId);
        n.x = Math.max(0, e.clientX - canvasRect.left - offsetX);
        n.y = Math.max(0, e.clientY - canvasRect.top - offsetY);
        renderCanvas();
      });
      document.addEventListener('mouseup', () => {
        if (dragging) { dragging = false; renderInspector(); }
      });
    });

    nodesLayer.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.delete;
        state.nodes = state.nodes.filter((n) => n.nodeId !== id);
        state.edges = state.edges.filter((ed) => ed.from !== id && ed.to !== id);
        render();
      });
    });

    nodesLayer.querySelectorAll('[data-connect]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.connect;
        if (state.connectFrom === null) {
          state.connectFrom = id;
        } else if (state.connectFrom === id) {
          state.connectFrom = null; // cancel
        } else {
          state.edges.push({ from: state.connectFrom, to: id });
          state.connectFrom = null;
        }
        render();
      });
    });
  }

  function renderInspector() {
    const el = document.getElementById('solveInspector');
    const nodeCount = state.nodes.length;
    const edgeCount = state.edges.length;
    el.querySelector('#solveStats').textContent = `${nodeCount} block(s) · ${edgeCount} connection(s)`;
  }

  function addNode(blockId, x, y) {
    if (!blockById(blockId)) return;
    state.nodes.push({ nodeId: genNodeId(), blockId, x, y });
    render();
  }

  // ---------- Drag-from-palette onto canvas ----------
  function wireCanvasDropZone() {
    const canvas = document.getElementById('solveCanvas');
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const blockId = e.dataTransfer.getData('text/block-id');
      if (!blockId) return;
      const rect = canvas.getBoundingClientRect();
      addNode(blockId, e.clientX - rect.left - 35, e.clientY - rect.top - 24);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.target === canvas) state.selectedNodeId = null;
    });
  }

  // ---------- Assessment ----------

  function currentGraph() {
    return {
      nodes: state.nodes.map((n) => ({ nodeId: n.nodeId, blockId: n.blockId })),
      edges: state.edges.map((e) => ({ from: e.from, to: e.to })),
    };
  }

  function runHeuristic() {
    const result = runHeuristicCheck(currentGraph(), state.problem);
    const el = document.getElementById('solveHeuristicOut');
    el.innerHTML = `
      <div class="solve-score">${result.score} / ${result.maxScore}</div>
      ${result.passes.map((p) => `<div class="solve-pass">✓ ${p}</div>`).join('')}
      ${result.issues.map((i) => `<div class="solve-issue">⚠ ${i}</div>`).join('')}
    `;
    return result;
  }

  async function runCritique() {
    const btn = document.getElementById('solveCritiqueBtn');
    const out = document.getElementById('solveCritiqueOut');
    if (state.nodes.length === 0) {
      out.innerHTML = `<p style="color:var(--ink-soft)">Add some blocks first.</p>`;
      return;
    }
    btn.disabled = true;
    out.innerHTML = `<span class="loading-dots">Reviewing your pipeline</span>`;

    const heuristicResult = runHeuristicCheck(currentGraph(), state.problem);
    const nodesWithLabels = state.nodes.map((n) => ({
      nodeId: n.nodeId, blockId: n.blockId, label: blockById(n.blockId).label,
    }));

    try {
      const resp = await fetch(`${window.BACKEND_URL}/api/critique-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_title: state.problem.title,
          problem_blurb: state.problem.blurb,
          nodes: nodesWithLabels,
          edges: state.edges,
          heuristic_issues: heuristicResult.issues,
          max_tokens: 600,
        }),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errBody.detail || `Request failed (${resp.status})`);
      }
      const data = await resp.json();
      out.innerHTML = data.critique.split(/\n\n+/).map((p) => `<p>${p}</p>`).join('');
    } catch (e) {
      out.innerHTML = `<p style="color:var(--fam-generative)">Couldn't reach the backend. ${e.message || ''}</p>`;
    }
    btn.disabled = false;
  }

  // ---------- Public entry point ----------

  function open(problemId) {
    const problem = PROBLEMS.find((p) => p.id === problemId);
    if (!problem) return;
    state = freshState(problem);
    document.getElementById('solveTitle').textContent = problem.title;
    document.getElementById('solveBlurb').textContent = problem.blurb;
    document.getElementById('solveHeuristicOut').innerHTML = '';
    document.getElementById('solveCritiqueOut').innerHTML = '<p style="color:var(--ink-soft)">Run the structural check first, then ask for a written critique.</p>';
    document.getElementById('solveOverlay').classList.add('open');
    render();
  }

  function close() {
    document.getElementById('solveOverlay').classList.remove('open');
  }

  function init() {
    wireCanvasDropZone();
    document.getElementById('solveCloseBtn').addEventListener('click', close);
    document.getElementById('solveOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'solveOverlay') close();
    });
    document.getElementById('solveHeuristicBtn').addEventListener('click', runHeuristic);
    document.getElementById('solveCritiqueBtn').addEventListener('click', runCritique);
    document.getElementById('solveClearBtn').addEventListener('click', () => {
      if (!state) return;
      state.nodes = [];
      state.edges = [];
      state.connectFrom = null;
      render();
    });
  }

  window.SOLVE = { open, close, init };
})();
