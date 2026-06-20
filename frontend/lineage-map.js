// Renders the full lineage map: nodes positioned by chronology (x) and family lane (y),
// with edges drawn from parent(s) to child based on LINEAGE.

function parseYear(yearStr){
  // "2019–2020" -> 2019, "1990s" -> 1990, "2021–2022" -> 2021
  const m = yearStr.match(/\d{4}/);
  return m ? parseInt(m[0]) : 2020;
}

function buildLineageMap(ALL, LINEAGE, onNodeClick){
  const FAMILIES = ["foundation","recurrent","vision","attention","generative","multimodal","efficiency","reasoning"];
  const FAM_LABELS = {
    foundation:"Foundation", recurrent:"Recurrent / Sequence", vision:"Vision / CNN",
    attention:"Attention / Transformer", generative:"Generative", multimodal:"Multimodal",
    efficiency:"Efficiency / Scaling", reasoning:"Reasoning"
  };

  const sorted = [...ALL].sort((a,b)=>parseYear(a.year)-parseYear(b.year));
  const minYear = parseYear(sorted[0].year);
  const maxYear = parseYear(sorted[sorted.length-1].year);
  const yearSpan = Math.max(1, maxYear - minYear);

  const laneH = 90;
  const padTop = 50;
  const padLeft = 70;
  const padRight = 60;
  const width = 1700;
  const innerWidth = width - padLeft - padRight;
  const height = padTop + FAMILIES.length * laneH + 60;

  // assign x by year, y by family lane; jitter x slightly within a lane if same year+family collide
  const positions = {};
  const occupied = {}; // key: fam|year -> count, to offset overlapping nodes
  ALL.forEach(m=>{
    const yr = parseYear(m.year);
    const xFrac = (yr - minYear) / yearSpan;
    const x = padLeft + xFrac * innerWidth;
    const laneIdx = FAMILIES.indexOf(m.family);
    const key = m.family + '|' + yr;
    const offset = occupied[key] || 0;
    occupied[key] = offset + 1;
    const y = padTop + laneIdx * laneH + laneH/2 + (offset % 2 === 0 ? -1 : 1) * Math.floor(offset/2) * 16;
    positions[m.id] = {x, y, m};
  });

  const famColorVar = fam => `var(--fam-${fam})`;

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="lineage-svg" id="lineageSvg">`;

  // lane backgrounds + labels
  FAMILIES.forEach((fam, i)=>{
    const y = padTop + i*laneH;
    svg += `<rect x="0" y="${y}" width="${width}" height="${laneH}" fill="${i%2===0?'rgba(0,0,0,0.015)':'transparent'}"/>`;
    svg += `<text x="14" y="${y+laneH/2+4}" font-size="11" font-family="Inter, sans-serif" font-weight="600" fill="${famColorVar(fam)}">${FAM_LABELS[fam]}</text>`;
  });

  // year gridlines (every 5ish years, adaptive)
  const yearTicks = [];
  for(let y=minYear; y<=maxYear; y++){
    if(y % 5 === 0 || y===minYear || y===maxYear) yearTicks.push(y);
  }
  yearTicks.forEach(yr=>{
    const x = padLeft + ((yr-minYear)/yearSpan)*innerWidth;
    svg += `<line x1="${x}" y1="${padTop-10}" x2="${x}" y2="${height-40}" stroke="var(--rule)" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${height-22}" font-size="10" font-family="JetBrains Mono, monospace" fill="var(--ink-soft)" text-anchor="middle">${yr}</text>`;
  });

  // edges first (so nodes draw on top)
  Object.keys(LINEAGE).forEach(childId=>{
    const childPos = positions[childId];
    if(!childPos) return;
    LINEAGE[childId].forEach(edge=>{
      const parentPos = positions[edge.id];
      if(!parentPos) return;
      const midX = (parentPos.x + childPos.x)/2;
      svg += `<path d="M${parentPos.x},${parentPos.y} C${midX},${parentPos.y} ${midX},${childPos.y} ${childPos.x},${childPos.y}"
        fill="none" stroke="${famColorVar(childPos.m.family)}" stroke-width="1.4" opacity="0.45"
        class="lineage-edge" data-child="${childId}" data-parent="${edge.id}"/>`;
    });
  });

  // nodes
  ALL.forEach(m=>{
    const pos = positions[m.id];
    const r = 7;
    svg += `<g class="lineage-node" data-id="${m.id}" style="cursor:pointer;">
      <circle cx="${pos.x}" cy="${pos.y}" r="${r+5}" fill="transparent"/>
      <circle cx="${pos.x}" cy="${pos.y}" r="${r}" fill="var(--paper)" stroke="${famColorVar(m.family)}" stroke-width="2.2"/>
    </g>`;
  });

  svg += `</svg>`;

  return { svg, positions, FAMILIES, FAM_LABELS };
}

function attachLineageMapInteractivity(container, ALL, positions, onNodeClick){
  const svgEl = container.querySelector('#lineageSvg');
  if(!svgEl) return;
  const tooltip = container.querySelector('#lineageTooltip');

  svgEl.querySelectorAll('.lineage-node').forEach(node=>{
    const id = node.dataset.id;
    const m = ALL.find(x=>x.id===id);
    const pos = positions[id];

    node.addEventListener('mouseenter', ()=>{
      svgEl.querySelectorAll('.lineage-edge').forEach(e=>{
        const isRelated = e.dataset.child===id || e.dataset.parent===id;
        e.style.opacity = isRelated ? '0.95' : '0.08';
        e.style.strokeWidth = isRelated ? '2.4' : '1.4';
      });
      svgEl.querySelectorAll('.lineage-node circle:nth-child(2)').forEach(c=>{
        c.setAttribute('r', '7');
      });
      node.querySelector('circle:nth-child(2)').setAttribute('r','10');

      if(tooltip){
        tooltip.style.display='block';
        tooltip.style.left = pos.x + 'px';
        tooltip.style.top = (pos.y - 14) + 'px';
        tooltip.innerHTML = `<strong>${m.year}</strong> · ${m.name}`;
      }
    });
    node.addEventListener('mouseleave', ()=>{
      svgEl.querySelectorAll('.lineage-edge').forEach(e=>{ e.style.opacity='0.45'; e.style.strokeWidth='1.4'; });
      node.querySelector('circle:nth-child(2)').setAttribute('r','7');
      if(tooltip) tooltip.style.display='none';
    });
    node.addEventListener('click', ()=> onNodeClick(id));
  });
}
