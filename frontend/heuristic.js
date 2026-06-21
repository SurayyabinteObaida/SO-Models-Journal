// Heuristic (rule-based, no API call) assessment of a user-built pipeline graph.
//
// Graph shape expected: { nodes: [{nodeId, blockId}], edges: [{from, to}] }
// where `from`/`to` are nodeId references (a node is a placed instance of a block;
// multiple nodes can reference the same blockId).

function blockById(blockId) {
  return BLOCKS.find((b) => b.id === blockId) || null;
}

function runHeuristicCheck(graph, problem) {
  const issues = [];
  const passes = [];

  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  if (nodes.length === 0) {
    return {
      score: 0,
      maxScore: 1,
      issues: ["The canvas is empty — drag in at least a data block, a model block, and an output block."],
      passes: [],
    };
  }

  const nodeMap = {};
  nodes.forEach((n) => (nodeMap[n.nodeId] = n));

  // adjacency for reachability checks
  const outgoing = {};
  const incoming = {};
  edges.forEach((e) => {
    (outgoing[e.from] = outgoing[e.from] || []).push(e.to);
    (incoming[e.to] = incoming[e.to] || []).push(e.from);
  });

  // 1. required categories present
  const presentCategories = new Set(
    nodes.map((n) => blockById(n.blockId)).filter(Boolean).map((b) => b.category)
  );
  const missingCategories = (problem.heuristic.requiredCategories || []).filter(
    (c) => !presentCategories.has(c)
  );
  if (missingCategories.length > 0) {
    issues.push(`Missing required stage(s): ${missingCategories.join(", ")}.`);
  } else {
    passes.push("All required pipeline stages are represented.");
  }

  // 2. forbidden blocks (wrong input type for this problem)
  const forbidden = (problem.heuristic.forbiddenCategories || []);
  const usedForbidden = nodes
    .map((n) => n.blockId)
    .filter((id) => forbidden.includes(id));
  if (usedForbidden.length > 0) {
    issues.push(`These blocks don't fit this problem's input type: ${usedForbidden.join(", ")}.`);
  }

  // 3. must-start-with: at least one node using one of these block ids must have no incoming edges
  const startCandidates = (problem.heuristic.mustStartWith || []);
  const rootNodes = nodes.filter((n) => !incoming[n.nodeId] || incoming[n.nodeId].length === 0);
  const hasValidStart = rootNodes.some((n) => startCandidates.includes(n.blockId));
  if (startCandidates.length > 0) {
    if (hasValidStart) passes.push("Pipeline starts from a valid data source.");
    else issues.push(`The pipeline should start from one of: ${startCandidates.map((id) => blockById(id)?.label || id).join(", ")}.`);
  }

  // 4. must-end-with: at least one leaf node (no outgoing edges) must be one of these
  const endCandidates = (problem.heuristic.mustEndWith || []);
  const leafNodes = nodes.filter((n) => !outgoing[n.nodeId] || outgoing[n.nodeId].length === 0);
  const hasValidEnd = leafNodes.some((n) => endCandidates.includes(n.blockId));
  if (endCandidates.length > 0) {
    if (hasValidEnd) passes.push("Pipeline ends in a usable output.");
    else issues.push(`The pipeline should end with one of: ${endCandidates.map((id) => blockById(id)?.label || id).join(", ")}.`);
  }

  // 5. type-compatibility along every edge: does the downstream block accept what the upstream produces?
  let typeErrors = 0;
  edges.forEach((e) => {
    const fromNode = nodeMap[e.from];
    const toNode = nodeMap[e.to];
    if (!fromNode || !toNode) return;
    const fromBlock = blockById(fromNode.blockId);
    const toBlock = blockById(toNode.blockId);
    if (!fromBlock || !toBlock) return;
    if (!toBlock.accepts.includes(fromBlock.produces)) {
      issues.push(`"${fromBlock.label}" produces ${fromBlock.produces}, but "${toBlock.label}" expects ${toBlock.accepts.join("/")} — these can't connect.`);
      typeErrors++;
    }
  });
  if (typeErrors === 0 && edges.length > 0) {
    passes.push("Every connection is type-compatible — no block is fed data it can't actually use.");
  }

  // 6. combiner blocks need at least minInputs incoming edges
  nodes.forEach((n) => {
    const block = blockById(n.blockId);
    if (block && block.minInputs) {
      const inCount = (incoming[n.nodeId] || []).length;
      if (inCount < block.minInputs) {
        issues.push(`"${block.label}" needs at least ${block.minInputs} incoming connections, but has ${inCount}.`);
      }
    }
  });

  // 7. orphan nodes — placed but not connected to anything (only flag if more than 1 node total)
  if (nodes.length > 1) {
    const orphans = nodes.filter(
      (n) => (!incoming[n.nodeId] || incoming[n.nodeId].length === 0) &&
             (!outgoing[n.nodeId] || outgoing[n.nodeId].length === 0)
    );
    if (orphans.length > 0) {
      issues.push(`${orphans.length} block(s) are placed but not connected to anything: ${orphans.map((n) => blockById(n.blockId)?.label || n.blockId).join(", ")}.`);
    }
  }

  // 8. mustInclude — specific block id(s) the solution is required to contain
  // (distinct from requiredCategories: this targets one exact block, e.g. a
  // mandatory human-review step, not just "any postprocessing block will do")
  let checkedMustInclude = false;
  const mustInclude = (problem.heuristic.mustInclude || []);
  if (mustInclude.length > 0) {
    checkedMustInclude = true;
    const presentBlockIds = new Set(nodes.map((n) => n.blockId));
    const missingRequired = mustInclude.filter((id) => !presentBlockIds.has(id));
    if (missingRequired.length > 0) {
      issues.push(`This solution must include: ${missingRequired.map((id) => blockById(id)?.label || id).join(", ")}.`);
    } else {
      passes.push("Includes every block this problem specifically requires.");
    }
  }

  // 9. preferredPattern: "branching" — at least one combiner node is present
  // and actually satisfies its own minInputs requirement. A combiner with
  // enough incoming edges necessarily means ≥2 separate upstream chains
  // converge on it, which is what "branching" means structurally here.
  // This is advisory, not required — it only ever adds a bonus pass, never
  // counts against the score, since a clean linear solution is still valid.
  if (problem.heuristic.preferredPattern === "branching") {
    const combinerNodes = nodes.filter((n) => {
      const block = blockById(n.blockId);
      return block && block.category === "combiner";
    });
    const hasSatisfiedCombiner = combinerNodes.some((n) => {
      const block = blockById(n.blockId);
      const inCount = (incoming[n.nodeId] || []).length;
      return inCount >= (block.minInputs || 2);
    });
    if (hasSatisfiedCombiner) {
      passes.push("Bonus: uses a genuine branching/ensemble structure, as this problem invites.");
    }
  }

  // totalChecks is dynamic: only mustInclude (when declared) adds to the
  // denominator. Branching is bonus-only and never affects maxScore.
  const totalChecks = 7 + (checkedMustInclude ? 1 : 0);
  const passedChecks = totalChecks - issues.length > 0 ? totalChecks - Math.min(issues.length, totalChecks) : 0;

  return {
    score: Math.max(0, passedChecks),
    maxScore: totalChecks,
    issues,
    passes,
  };
}
