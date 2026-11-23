// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 SVG Renderer (ΔΔΠ & ΔΡΔ) + PNG/SVG Export
// Renders ○→ (Data Couples), ●→ (Control Flags), ◇ (Selection), ↻ (Loops),
// and DFD Circles, Parallel-Line Data Stores, and External Entity Boxes.
// UMD module: Browser window.PLI11Renderer / Node exports
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PLI11Renderer = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function escXml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getPalette(options = {}) {
    if (options.printMode) {
      return {
        bg: '#ffffff',
        ink: '#111827',
        muted: '#4b5563',
        edge: '#1f2937',
        labelBg: '#ffffff',
        labelBorder: '#d1d5db',
        rootFill: '#f3f4f6',
        rootStroke: '#111827',
        ctrlFill: '#ffffff',
        ctrlStroke: '#111827',
        calcFill: '#ffffff',
        calcStroke: '#111827',
        ioFill: '#ffffff',
        ioStroke: '#374151',
        storeFill: '#f9fafb',
        storeStroke: '#111827',
        kmBg: 'rgba(17, 24, 39, 0.03)',
        kmStroke: '#4b5563',
        activeStroke: '#b45309',
        activeGlow: 'rgba(180, 83, 9, 0.25)',
        font: 'Segoe UI, Roboto, Arial, sans-serif'
      };
    }

    if (options.theme === 'dark') {
      return {
        bg: '#0b0c15',
        ink: '#e0e6ed',
        muted: '#94a3b8',
        edge: '#94a3b8',
        labelBg: '#12141d',
        labelBorder: '#2d3148',
        rootFill: '#112a38',
        rootStroke: '#00f3ff',
        ctrlFill: '#171c2e',
        ctrlStroke: '#38bdf8',
        calcFill: '#1f162e',
        calcStroke: '#c084fc',
        ioFill: '#102822',
        ioStroke: '#00ff9f',
        storeFill: '#291e14',
        storeStroke: '#f59e0b',
        kmBg: 'rgba(0, 243, 255, 0.05)',
        kmStroke: '#00f3ff',
        activeStroke: '#ffee00',
        activeGlow: 'rgba(255, 238, 0, 0.35)',
        font: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      };
    }

    // Light mode (Solarized-inspired palette matching style.css)
    return {
      bg: '#fdf6e3',
      ink: '#073642',
      muted: '#586e75',
      edge: '#586e75',
      labelBg: '#fdf6e3',
      labelBorder: '#d3cbb7',
      rootFill: '#e6f4f1',
      rootStroke: '#166534',
      ctrlFill: '#e8f1f8',
      ctrlStroke: '#268bd2',
      calcFill: '#f3effb',
      calcStroke: '#6c71c4',
      ioFill: '#eef7ea',
      ioStroke: '#2aa198',
      storeFill: '#faf0db',
      storeStroke: '#b58900',
      kmBg: 'rgba(38, 139, 210, 0.06)',
      kmStroke: '#268bd2',
      activeStroke: '#dc322f',
      activeGlow: 'rgba(220, 50, 47, 0.25)',
      font: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    };
  }

  function roleStyle(role, pal) {
    switch (role) {
      case 'ROOT_CONTROL':
        return { fill: pal.rootFill, stroke: pal.rootStroke, tag: 'Ρίζα / Έλεγχος', sw: 2.2 };
      case 'CONTROL':
        return { fill: pal.ctrlFill, stroke: pal.ctrlStroke, tag: 'Έλεγχος', sw: 1.7 };
      case 'CALC':
        return { fill: pal.calcFill, stroke: pal.calcStroke, tag: 'Υπολογισμός', sw: 1.7 };
      case 'DATA_MGMT':
        return { fill: pal.storeFill, stroke: pal.storeStroke, tag: 'Διαχ. Δεδομένων', sw: 1.7 };
      case 'PRESENTATION':
        return { fill: pal.ioFill, stroke: pal.ioStroke, tag: 'Παρουσίαση', sw: 1.7 };
      default:
        return { fill: pal.ioFill, stroke: pal.ioStroke, tag: 'Είσοδος/Έξοδος', sw: 1.6 };
    }
  }

  // ---------------------------------------------------------------------------
  // 1. ΔΔΠ (STRUCTURE CHART) SVG RENDERER
  // ---------------------------------------------------------------------------
  function renderDDPSVG(model, options = {}) {
    const pal = getPalette(options);
    const activeNodeId = options.activeNodeId || null;
    const activeEdgeId = options.activeEdgeId || null;
    const showLegend = options.showLegend !== false;

    if (!model || !model.nodes || model.nodes.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 240" width="680" height="240" style="font-family:${escXml(pal.font)}">
        <rect width="680" height="240" fill="${pal.bg}" rx="8"/>
        <text x="340" y="115" text-anchor="middle" fill="${pal.muted}" font-size="14" font-weight="600">Γράψτε ψευδοκώδικα ΠΛΗ11 (PROCEDURE ... END_PROCEDURE) για να παραχθεί το ΔΔΠ.</text>
      </svg>`;
    }

    const boxH = 46;
    const hGap = 54;
    const vGap = 128;

    const nodeDims = new Map();
    for (const n of model.nodes) {
      const labelLen = (n.name || '').length;
      const w = Math.max(122, Math.min(260, labelLen * 8.4 + 28));
      nodeDims.set(n.id, { w, h: boxH });
    }

    // Build spanning forest from root (plus any orphan component roots)
    const childrenByParent = new Map();
    for (const n of model.nodes) childrenByParent.set(n.id, []);
    for (const e of model.edges) {
      if (childrenByParent.has(e.from)) {
        childrenByParent.get(e.from).push(e);
      }
    }

    const placedInTree = new Set();
    const treeChildren = new Map();
    for (const n of model.nodes) treeChildren.set(n.id, []);

    function buildSpanningTree(rootId) {
      const q = [rootId];
      placedInTree.add(rootId);
      while (q.length > 0) {
        const cur = q.shift();
        const edges = childrenByParent.get(cur) || [];
        for (const e of edges) {
          if (!placedInTree.has(e.to)) {
            placedInTree.add(e.to);
            treeChildren.get(cur).push(e.to);
            q.push(e.to);
          }
        }
      }
    }

    const componentRoots = [];
    if (model.rootNode) {
      componentRoots.push(model.rootNode.id);
      buildSpanningTree(model.rootNode.id);
    }
    for (const n of model.nodes) {
      if (!placedInTree.has(n.id)) {
        // Pick nodes with inDegree 0 first
        if (n.inDegree === 0) {
          componentRoots.push(n.id);
          buildSpanningTree(n.id);
        }
      }
    }
    for (const n of model.nodes) {
      if (!placedInTree.has(n.id)) {
        componentRoots.push(n.id);
        buildSpanningTree(n.id);
      }
    }

    // Compute subtree widths bottom-up
    const subtreeWidths = new Map();
    function calcWidth(id) {
      const ch = treeChildren.get(id) || [];
      const selfW = nodeDims.get(id).w;
      if (ch.length === 0) {
        subtreeWidths.set(id, selfW);
        return selfW;
      }
      let sum = 0;
      for (let i = 0; i < ch.length; i++) {
        sum += calcWidth(ch[i]);
        if (i > 0) sum += hGap;
      }
      const total = Math.max(selfW, sum);
      subtreeWidths.set(id, total);
      return total;
    }
    for (const r of componentRoots) calcWidth(r);

    // Assign coordinates
    const coords = new Map(); // id -> { cx, cy, x, y, w, h, depth }
    let maxDepth = 0;
    function assignCoords(id, leftX, depth) {
      maxDepth = Math.max(maxDepth, depth);
      const subW = subtreeWidths.get(id);
      const dim = nodeDims.get(id);
      const cx = leftX + subW / 2;
      const cy = 48 + depth * vGap + dim.h / 2;
      coords.set(id, {
        cx,
        cy,
        x: cx - dim.w / 2,
        y: cy - dim.h / 2,
        w: dim.w,
        h: dim.h,
        depth
      });

      const ch = treeChildren.get(id) || [];
      if (ch.length === 0) return;

      let childrenTotalW = 0;
      for (let i = 0; i < ch.length; i++) {
        childrenTotalW += subtreeWidths.get(ch[i]);
        if (i > 0) childrenTotalW += hGap;
      }
      let curX = cx - childrenTotalW / 2;
      for (const childId of ch) {
        assignCoords(childId, curX, depth + 1);
        curX += subtreeWidths.get(childId) + hGap;
      }
    }

    let cursorX = 48;
    const compRanges = [];
    for (let i = 0; i < componentRoots.length; i++) {
      const rId = componentRoots[i];
      const w = subtreeWidths.get(rId);
      assignCoords(rId, cursorX, 0);
      compRanges.push({ rootId: rId, startX: cursorX, width: w });
      cursorX += w + 84;
    }

    const totalWidth = Math.max(660, cursorX - 36);
    const legendH = showLegend ? 46 : 14;
    const totalHeight = 48 + (maxDepth + 1) * vGap - (vGap - boxH) + 52 + legendH;

    const svgParts = [];
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" style="font-family:${escXml(pal.font)}">`,
      `<defs>`,
      `  <marker id="eap-couple-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">`,
      `    <path d="M 0 1 L 9 5 L 0 9 z" fill="${pal.ink}" />`,
      `  </marker>`,
      `  <marker id="eap-couple-arrow-active" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">`,
      `    <path d="M 0 1 L 9 5 L 0 9 z" fill="${pal.activeStroke}" />`,
      `  </marker>`,
      `</defs>`,
      `<rect width="${totalWidth}" height="${totalHeight}" fill="${pal.bg}" />`
    );

    // Divider if orphan components exist next to main root
    if (compRanges.length > 1) {
      for (let i = 1; i < compRanges.length; i++) {
        const divX = compRanges[i].startX - 42;
        svgParts.push(
          `<line x1="${divX}" y1="24" x2="${divX}" y2="${totalHeight - legendH - 12}" stroke="${pal.labelBorder}" stroke-width="1.5" stroke-dasharray="6 5" />`,
          `<text x="${divX + 10}" y="28" fill="${pal.muted}" font-size="11" font-weight="600">Ανεξάρτητη / Μερική Μονάδα</text>`
        );
      }
    }

    // Draw Edges first (behind boxes, labels on top of edges)
    const edgeLabelLayers = [];

    // Spread attachment points on parent bottom border cleanly
    for (const parentNode of model.nodes) {
      const edges = childrenByParent.get(parentNode.id) || [];
      if (edges.length === 0) continue;
      const pPos = coords.get(parentNode.id);

      // Sort outgoing edges by child cx so lines don't cross unnecessarily
      const sortedEdges = [...edges].sort((a, b) => {
        const ca = coords.get(a.to);
        const cb = coords.get(b.to);
        return (ca ? ca.cx : 0) - (cb ? cb.cx : 0);
      });

      const attachSpan = Math.min(pPos.w * 0.72, (sortedEdges.length - 1) * 18);
      for (let idx = 0; idx < sortedEdges.length; idx++) {
        const e = sortedEdges[idx];
        const cPos = coords.get(e.to);
        if (!cPos) continue;

        const frac = sortedEdges.length === 1 ? 0 : (idx / (sortedEdges.length - 1)) - 0.5;
        const x1 = pPos.cx + frac * attachSpan;
        const y1 = pPos.y + pPos.h;
        const x2 = cPos.cx;
        const y2 = cPos.y;

        const isEdgeActive = activeEdgeId === e.id;
        const strokeColor = isEdgeActive ? pal.activeStroke : pal.edge;
        const strokeW = isEdgeActive ? 2.8 : 1.65;

        // If shared node with same depth or upward jump, draw clean bezier detour
        const isNormalDown = y2 > y1 + 12;
        let midX = (x1 + x2) / 2;
        let midY = (y1 + y2) / 2;
        if (isNormalDown) {
          svgParts.push(
            `<line class="ddp-edge" data-edge-id="${escXml(e.id)}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeW}" />`
          );
        } else {
          const detourX = Math.max(x1, x2) + 70;
          svgParts.push(
            `<path class="ddp-edge" data-edge-id="${escXml(e.id)}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${detourX.toFixed(1)} ${(y1 + 40).toFixed(1)}, ${detourX.toFixed(1)} ${(y2 - 40).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="5 3" />`
          );
          midX = detourX - 18;
          midY = (y1 + y2) / 2;
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        // Normal pointing rightward (nx >= 0)
        let nx = -uy;
        let ny = ux;
        if (nx < 0) { nx = -nx; ny = -ny; }

        // Conditional Diamond ◇ near parent attachment
        if (e.conditional && isNormalDown) {
          const dcx = x1 + ux * 9;
          const dcy = y1 + uy * 9;
          const rD = 5.5;
          const pts = [
            `${(dcx).toFixed(1)},${(dcy - rD).toFixed(1)}`,
            `${(dcx + rD).toFixed(1)},${(dcy).toFixed(1)}`,
            `${(dcx).toFixed(1)},${(dcy + rD).toFixed(1)}`,
            `${(dcx - rD).toFixed(1)},${(dcy).toFixed(1)}`
          ].join(' ');
          svgParts.push(`<polygon points="${pts}" fill="${pal.bg}" stroke="${strokeColor}" stroke-width="1.5" />`);
          if (e.conditional.type === 'CASE' && e.conditional.label) {
            const bx = x1 + ux * 22 + nx * 12;
            const by = y1 + uy * 22 + ny * 12;
            edgeLabelLayers.push(renderPillLabel(bx, by, e.conditional.label, pal, 'start', 10));
          }
        }

        // Loop Arc ↻
        if (e.loop && isNormalDown) {
          const lcx = x1 + ux * 24;
          const lcy = y1 + uy * 24;
          svgParts.push(
            `<path d="M ${(lcx - 13).toFixed(1)} ${(lcy + 3).toFixed(1)} A 13 8 0 1 1 ${(lcx + 12).toFixed(1)} ${(lcy + 3).toFixed(1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" marker-end="url(#eap-couple-arrow)" />`
          );
        }

        // Data Couple ○→ and Control Couple ●→ arrows
        const coupleColor = isEdgeActive ? pal.activeStroke : pal.ink;
        const arrowMarker = isEdgeActive ? 'url(#eap-couple-arrow-active)' : 'url(#eap-couple-arrow)';
        const arrowHalf = 14;

        // Downward IN data couple (offset left)
        if (e.inputs.length > 0 && isNormalDown) {
          const off = -11;
          const ax = midX + nx * off;
          const ay = midY + ny * off;
          const sx = ax - ux * arrowHalf;
          const sy = ay - uy * arrowHalf;
          const ex = ax + ux * arrowHalf;
          const ey = ay + uy * arrowHalf;
          svgParts.push(
            `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${coupleColor}" stroke-width="1.4" marker-end="${arrowMarker}" />`,
            `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.4" fill="${pal.bg}" stroke="${coupleColor}" stroke-width="1.4" />`
          );
          const lblText = e.inputs.map((x) => x.name).join(',');
          edgeLabelLayers.push(renderPillLabel(ax + nx * -10, ay + ny * -10, lblText, pal, 'end', 11));
        }

        // Upward OUT data couple (offset right)
        if (e.outputs.length > 0 && isNormalDown) {
          const off = 11;
          const ax = midX + nx * off;
          const ay = midY + ny * off;
          const sx = ax + ux * arrowHalf; // starts lower (closer to child)
          const sy = ay + uy * arrowHalf;
          const ex = ax - ux * arrowHalf; // points upward toward parent
          const ey = ay - uy * arrowHalf;
          svgParts.push(
            `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${coupleColor}" stroke-width="1.4" marker-end="${arrowMarker}" />`,
            `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.4" fill="${pal.bg}" stroke="${coupleColor}" stroke-width="1.4" />`
          );
          const lblText = e.outputs.map((x) => x.name).join(',');
          edgeLabelLayers.push(renderPillLabel(ax + nx * 10, ay + ny * 10, lblText, pal, 'start', 11));
        }

        // Control flag ●→ (filled circle, pointing upward toward parent)
        if (e.controlFlags.length > 0 && isNormalDown) {
          const off = e.outputs.length > 0 ? 24 : 11;
          const ax = midX + nx * off;
          const ay = midY + ny * off;
          const sx = ax + ux * arrowHalf;
          const sy = ay + uy * arrowHalf;
          const ex = ax - ux * arrowHalf;
          const ey = ay - uy * arrowHalf;
          svgParts.push(
            `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${coupleColor}" stroke-width="1.4" marker-end="${arrowMarker}" />`,
            `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.6" fill="${coupleColor}" stroke="${coupleColor}" stroke-width="1.2" />`
          );
          const lblText = e.controlFlags.map((x) => x.name).join(',');
          edgeLabelLayers.push(renderPillLabel(ax + nx * 10, ay + ny * 10, lblText, pal, 'start', 11));
        }
      }
    }

    // Draw Module Boxes
    for (const n of model.nodes) {
      const pos = coords.get(n.id);
      if (!pos) continue;
      const st = roleStyle(n.role, pal);
      const isActive = activeNodeId === n.id;
      const dash = n.isStub ? ' stroke-dasharray="5 3"' : '';
      const activeOutline = isActive
        ? `<rect x="${(pos.x - 4).toFixed(1)}" y="${(pos.y - 4).toFixed(1)}" width="${(pos.w + 8).toFixed(1)}" height="${(pos.h + 8).toFixed(1)}" rx="7" fill="none" stroke="${pal.activeStroke}" stroke-width="2.5" />`
        : '';

      svgParts.push(
        `<g class="ddp-node" data-node-id="${escXml(n.id)}" data-line="${n.startLine}" style="cursor:pointer">`,
        activeOutline,
        `  <rect x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" width="${pos.w.toFixed(1)}" height="${pos.h.toFixed(1)}" rx="4" fill="${st.fill}" stroke="${isActive ? pal.activeStroke : st.stroke}" stroke-width="${isActive ? 2.5 : st.sw}"${dash} />`,
        `  <text x="${pos.cx.toFixed(1)}" y="${(pos.cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${pal.ink}" font-size="13" font-weight="700">${escXml(n.name)}</text>`,
        n.isStub
          ? `  <text x="${pos.cx.toFixed(1)}" y="${(pos.y + pos.h - 6).toFixed(1)}" text-anchor="middle" fill="${pal.muted}" font-size="9">stub</text>`
          : '',
        `</g>`
      );
    }

    // Draw Edge Couple Labels on top
    svgParts.push(...edgeLabelLayers);

    // Legend
    if (showLegend) {
      const ly = totalHeight - 20;
      svgParts.push(
        `<g class="ddp-legend" font-size="11" fill="${pal.muted}">`,
        `  <line x1="20" y1="${ly}" x2="42" y2="${ly}" stroke="${pal.ink}" stroke-width="1.3" marker-end="url(#eap-couple-arrow)" />`,
        `  <circle cx="20" cy="${ly}" r="3" fill="${pal.bg}" stroke="${pal.ink}" stroke-width="1.3" />`,
        `  <text x="50" y="${ly + 4}">Ζεύγος δεδομένων (IN/OUT)</text>`,
        `  <line x1="220" y1="${ly}" x2="242" y2="${ly}" stroke="${pal.ink}" stroke-width="1.3" marker-end="url(#eap-couple-arrow)" />`,
        `  <circle cx="220" cy="${ly}" r="3" fill="${pal.ink}" />`,
        `  <text x="250" y="${ly + 4}">Σημαία ελέγχου (flag)</text>`,
        `  <polygon points="395,${ly - 5} 400,${ly} 395,${ly + 5} 390,${ly}" fill="${pal.bg}" stroke="${pal.ink}" stroke-width="1.3" />`,
        `  <text x="408" y="${ly + 4}">Επιλογή (IF/CASE)</text>`,
        `  <path d="M 522 ${ly + 3} A 9 6 0 1 1 540 ${ly + 3}" fill="none" stroke="${pal.ink}" stroke-width="1.3" marker-end="url(#eap-couple-arrow)" />`,
        `  <text x="548" y="${ly + 4}">Επανάληψη (Loop)</text>`,
        `</g>`
      );
    }

    svgParts.push('</svg>');
    return svgParts.join('\n');
  }

  function renderPillLabel(x, y, text, pal, anchor = 'middle', fontSize = 11) {
    const clean = String(text || '');
    const estW = Math.max(22, clean.length * (fontSize * 0.68) + 14);
    const estH = fontSize + 8;
    let rx = x - estW / 2;
    if (anchor === 'start') rx = x - 4;
    else if (anchor === 'end') rx = x - estW + 4;
    const ry = y - estH / 2;

    return `<g pointer-events="none" class="ddp-pill-label">
      <rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${estW.toFixed(1)}" height="${estH.toFixed(1)}" rx="4" fill="${pal.labelBg}" fill-opacity="0.96" stroke="${pal.labelBorder}" stroke-width="0.8" />
      <text x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" fill="${pal.ink}" font-size="${fontSize}" font-weight="600">${escXml(clean)}</text>
    </g>`;
  }

  // ---------------------------------------------------------------------------
  // 2. ΔΡΔ (DATA FLOW DIAGRAM) SVG RENDERER
  // ---------------------------------------------------------------------------
  function renderDFDSVG(dfd, options = {}) {
    const pal = getPalette(options);
    const showLegend = options.showLegend !== false;

    if (!dfd || !dfd.nodes || dfd.nodes.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 240" width="680" height="240" style="font-family:${escXml(pal.font)}">
        <rect width="680" height="240" fill="${pal.bg}" rx="8"/>
        <text x="340" y="115" text-anchor="middle" fill="${pal.muted}" font-size="14" font-weight="600">Δεν εντοπίστηκαν ροές δεδομένων για δημιουργία ΔΡΔ.</text>
      </svg>`;
    }

    const nodeById = new Map(dfd.nodes.map((n) => [n.id, n]));
    const inFlows = new Map();
    const outFlows = new Map();
    for (const n of dfd.nodes) {
      inFlows.set(n.id, []);
      outFlows.set(n.id, []);
    }
    for (const f of dfd.flows) {
      if (outFlows.has(f.from)) outFlows.get(f.from).push(f);
      if (inFlows.has(f.to)) inFlows.get(f.to).push(f);
    }

    // Topological column assignment for processes
    const procCol = new Map();
    for (const p of dfd.processes) procCol.set(p.id, 1);

    // Relax edges between processes (up to N iterations to handle cycles cleanly)
    for (let iter = 0; iter < dfd.processes.length; iter++) {
      let changed = false;
      for (const f of dfd.flows) {
        const u = nodeById.get(f.from);
        const v = nodeById.get(f.to);
        if (u && v && u.type === 'process' && v.type === 'process') {
          const nextCol = procCol.get(u.id) + 1;
          if (nextCol > procCol.get(v.id) && nextCol <= dfd.processes.length + 1) {
            procCol.set(v.id, nextCol);
            changed = true;
          }
        }
      }
      if (!changed) break;
    }

    const maxProcCol = dfd.processes.reduce((m, p) => Math.max(m, procCol.get(p.id) || 1), 1);

    // Classify Entities into Source (col 0) vs Sink (col maxProcCol + 1)
    const entityCol = new Map();
    for (const ent of dfd.entities) {
      const outs = outFlows.get(ent.id).length;
      const ins = inFlows.get(ent.id).length;
      entityCol.set(ent.id, outs >= ins ? 0 : maxProcCol + 1);
    }

    // Group column nodes
    const colBuckets = new Map(); // colIdx -> nodes[]
    const pushBucket = (col, node) => {
      if (!colBuckets.has(col)) colBuckets.set(col, []);
      colBuckets.get(col).push(node);
    };
    for (const ent of dfd.entities) pushBucket(entityCol.get(ent.id), ent);
    for (const p of dfd.processes) pushBucket(procCol.get(p.id), p);

    const colSpacing = 225;
    const rowSpacing = 125;
    const hasTopStores = dfd.stores.length > 0;
    const topMargin = hasTopStores ? 128 : 56;

    // Determine max rows in process/entity columns
    let maxRows = 1;
    for (const [, list] of colBuckets.entries()) {
      maxRows = Math.max(maxRows, list.length);
    }
    const centerY = topMargin + ((maxRows - 1) * rowSpacing) / 2;

    const coords = new Map(); // id -> { cx, cy, w, h, shape }
    const colKeys = Array.from(colBuckets.keys()).sort((a, b) => a - b);
    const colToX = new Map();
    colKeys.forEach((col, i) => {
      colToX.set(col, 110 + i * colSpacing);
    });

    for (const col of colKeys) {
      const list = colBuckets.get(col);
      // Sort central processes nicely together
      list.sort((a, b) => (b.isCentral ? 1 : 0) - (a.isCentral ? 1 : 0));
      const x = colToX.get(col);
      const startY = centerY - ((list.length - 1) * rowSpacing) / 2;
      list.forEach((node, idx) => {
        const y = startY + idx * rowSpacing;
        if (node.type === 'process') {
          const r = Math.max(32, Math.min(46, (node.label || '').length * 4.5 + 18));
          coords.set(node.id, { cx: x, cy: y, r, w: r * 2, h: r * 2, shape: 'circle' });
        } else {
          const w = Math.max(120, Math.min(210, (node.label || '').length * 7.8 + 24));
          coords.set(node.id, { cx: x, cy: y, w, h: 46, shape: 'rect' });
        }
      });
    }

    // Place Data Stores along top lane aligned over average X of connected processes
    if (dfd.stores.length > 0) {
      const storeInfos = dfd.stores.map((s) => {
        const connected = [
          ...inFlows.get(s.id).map((f) => coords.get(f.from)),
          ...outFlows.get(s.id).map((f) => coords.get(f.to))
        ].filter(Boolean);
        const avgX = connected.length > 0
          ? connected.reduce((acc, p) => acc + p.cx, 0) / connected.length
          : 260;
        const w = Math.max(125, Math.min(200, (s.label || '').length * 8 + 26));
        return { store: s, desiredX: avgX, w };
      });
      storeInfos.sort((a, b) => a.desiredX - b.desiredX);

      let prevRight = 30;
      for (const info of storeInfos) {
        const cx = Math.max(prevRight + info.w / 2 + 24, info.desiredX);
        coords.set(info.store.id, { cx, cy: 52, w: info.w, h: 38, shape: 'store' });
        prevRight = cx + info.w / 2;
      }
    }

    let maxX = 680;
    let maxY = 260;
    for (const c of coords.values()) {
      maxX = Math.max(maxX, c.cx + c.w / 2 + 80);
      maxY = Math.max(maxY, c.cy + c.h / 2 + 60);
    }
    const legendH = showLegend ? 44 : 10;
    const totalW = Math.ceil(maxX);
    const totalH = Math.ceil(maxY + legendH);

    const svgParts = [];
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" style="font-family:${escXml(pal.font)}">`,
      `<defs>`,
      `  <marker id="dfd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">`,
      `    <path d="M 0 1 L 9 5 L 0 9 z" fill="${pal.edge}" />`,
      `  </marker>`,
      `</defs>`,
      `<rect width="${totalW}" height="${totalH}" fill="${pal.bg}" />`
    );

    // Subtle Central Transformation / Transaction Center container box
    const centralCoords = dfd.processes.filter((p) => p.isCentral).map((p) => coords.get(p.id)).filter(Boolean);
    if (centralCoords.length > 0) {
      const minCX = Math.min(...centralCoords.map((c) => c.cx - c.r)) - 22;
      const maxCX = Math.max(...centralCoords.map((c) => c.cx + c.r)) + 22;
      const minCY = Math.min(...centralCoords.map((c) => c.cy - c.r)) - 28;
      const maxCY = Math.max(...centralCoords.map((c) => c.cy + c.r)) + 20;
      const kmTitle = dfd.architecture === 'TRANSACTION_CENTER'
        ? 'Κέντρο Δοσοληψιών (ΚΔ)'
        : 'Κεντρικός Μετασχηματισμός (ΚΜ)';
      svgParts.push(
        `<rect x="${minCX.toFixed(1)}" y="${minCY.toFixed(1)}" width="${(maxCX - minCX).toFixed(1)}" height="${(maxCY - minCY).toFixed(1)}" rx="12" fill="${pal.kmBg}" stroke="${pal.kmStroke}" stroke-width="1.3" stroke-dasharray="6 4" />`,
        `<text x="${((minCX + maxCX) / 2).toFixed(1)}" y="${(minCY + 14).toFixed(1)}" text-anchor="middle" fill="${pal.kmStroke}" font-size="11" font-weight="700">${escXml(kmTitle)}</text>`
      );
    }

    // Track bidirectional pairs to offset curves cleanly
    const pairSet = new Set(dfd.flows.map((f) => `${f.from}->${f.to}`));
    const flowLabelParts = [];

    function boundaryPoint(c, targetX, targetY) {
      const dx = targetX - c.cx;
      const dy = targetY - c.cy;
      const dist = Math.hypot(dx, dy) || 1;
      if (c.shape === 'circle') {
        return { x: c.cx + (dx / dist) * (c.r + 2), y: c.cy + (dy / dist) * (c.r + 2) };
      }
      const hw = c.w / 2 + 2;
      const hh = c.h / 2 + 2;
      const sx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
      const sy = dy !== 0 ? hh / Math.abs(dy) : Infinity;
      const s = Math.min(sx, sy);
      return { x: c.cx + dx * s, y: c.cy + dy * s };
    }

    for (const f of dfd.flows) {
      const cFrom = coords.get(f.from);
      const cTo = coords.get(f.to);
      if (!cFrom || !cTo) continue;

      const isBidir = pairSet.has(`${f.to}->${f.from}`);
      const dx = cTo.cx - cFrom.cx;
      const dy = cTo.cy - cFrom.cy;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;

      // Slight arc offset even on unidirectional horizontal edges if crossing multiple columns
      const colDiff = Math.abs(cTo.cx - cFrom.cx) > colSpacing * 1.3 ? -26 : 0;
      const curveOff = isBidir ? 26 : colDiff;
      const ctrlX = (cFrom.cx + cTo.cx) / 2 + nx * curveOff;
      const ctrlY = (cFrom.cy + cTo.cy) / 2 + ny * curveOff;

      const pStart = boundaryPoint(cFrom, ctrlX, ctrlY);
      const pEnd = boundaryPoint(cTo, ctrlX, ctrlY);

      svgParts.push(
        `<path d="M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)}, ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}" fill="none" stroke="${pal.edge}" stroke-width="1.65" marker-end="url(#dfd-arrow)" />`
      );

      // Midpoint of quadratic bezier at t=0.5: 0.25*P0 + 0.5*Ctrl + 0.25*P1
      const mx = 0.25 * pStart.x + 0.5 * ctrlX + 0.25 * pEnd.x;
      const my = 0.25 * pStart.y + 0.5 * ctrlY + 0.25 * pEnd.y;
      flowLabelParts.push(renderPillLabel(mx, my, f.data.join(', '), pal, 'middle', 11));
    }

    // Draw Nodes
    for (const n of dfd.nodes) {
      const c = coords.get(n.id);
      if (!c) continue;
      if (c.shape === 'circle') {
        const stroke = n.isCentral ? pal.rootStroke : pal.ctrlStroke;
        const fill = n.isCentral ? pal.rootFill : pal.ctrlFill;
        svgParts.push(
          `<g class="dfd-node">`,
          `  <circle cx="${c.cx.toFixed(1)}" cy="${c.cy.toFixed(1)}" r="${c.r}" fill="${fill}" stroke="${stroke}" stroke-width="${n.isCentral ? 2.4 : 1.8}" />`,
          `  <text x="${c.cx.toFixed(1)}" y="${(c.cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${pal.ink}" font-size="13" font-weight="700">${escXml(n.label)}</text>`,
          `</g>`
        );
      } else if (c.shape === 'store') {
        const x1 = c.cx - c.w / 2;
        const x2 = c.cx + c.w / 2;
        const y1 = c.cy - c.h / 2;
        const y2 = c.cy + c.h / 2;
        svgParts.push(
          `<g class="dfd-store">`,
          `  <rect x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${c.w.toFixed(1)}" height="${c.h.toFixed(1)}" fill="${pal.storeFill}" stroke="none" />`,
          `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${pal.storeStroke}" stroke-width="2" />`,
          `  <line x1="${x1.toFixed(1)}" y1="${y2.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${pal.storeStroke}" stroke-width="2" />`,
          `  <text x="${c.cx.toFixed(1)}" y="${(c.cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${pal.ink}" font-size="12" font-weight="700">${escXml(n.label)}</text>`,
          `</g>`
        );
      } else {
        const x = c.cx - c.w / 2;
        const y = c.cy - c.h / 2;
        const dash = n.type === 'unknown_io' ? ' stroke-dasharray="5 3"' : '';
        svgParts.push(
          `<g class="dfd-entity">`,
          `  <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${c.w.toFixed(1)}" height="${c.h.toFixed(1)}" rx="3" fill="${pal.ioFill}" stroke="${pal.ioStroke}" stroke-width="1.7"${dash} />`,
          `  <text x="${c.cx.toFixed(1)}" y="${(c.cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${pal.ink}" font-size="12" font-weight="700">${escXml(n.label)}</text>`,
          `</g>`
        );
      }
    }

    svgParts.push(...flowLabelParts);

    if (showLegend) {
      const ly = totalH - 18;
      svgParts.push(
        `<g class="dfd-legend" font-size="11" fill="${pal.muted}">`,
        `  <circle cx="28" cy="${ly - 2}" r="9" fill="${pal.ctrlFill}" stroke="${pal.ctrlStroke}" stroke-width="1.5" />`,
        `  <text x="44" y="${ly + 2}">Μετασχηματισμός</text>`,
        `  <line x1="168" y1="${ly - 9}" x2="200" y2="${ly - 9}" stroke="${pal.storeStroke}" stroke-width="1.8" />`,
        `  <line x1="168" y1="${ly + 5}" x2="200" y2="${ly + 5}" stroke="${pal.storeStroke}" stroke-width="1.8" />`,
        `  <text x="208" y="${ly + 2}">Αποθήκη Δεδομένων</text>`,
        `  <rect x="348" y="${ly - 10}" width="26" height="16" rx="2" fill="${pal.ioFill}" stroke="${pal.ioStroke}" stroke-width="1.5" />`,
        `  <text x="382" y="${ly + 2}">Πηγή / Αποδέκτης</text>`,
        `</g>`
      );
    }

    svgParts.push('</svg>');
    return svgParts.join('\n');
  }

  // ---------------------------------------------------------------------------
  // 3. STANDALONE SVG & PNG EXPORT HELPERS
  // ---------------------------------------------------------------------------
  function serializeStandaloneSVG(svgStringOrEl) {
    if (typeof svgStringOrEl === 'string') return svgStringOrEl;
    if (!svgStringOrEl) return '';
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgStringOrEl);
  }

  function downloadSVG(svgStringOrEl, filename = 'diagram.svg') {
    const svgText = serializeStandaloneSVG(svgStringOrEl);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadPNG(svgStringOrEl, filename = 'diagram.png', scale = 2) {
    return new Promise((resolve, reject) => {
      const svgText = serializeStandaloneSVG(svgStringOrEl);
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth || 900;
          const h = img.naturalHeight || 500;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              reject(new Error('PNG conversion failed'));
              return;
            }
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
            resolve();
          }, 'image/png');
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  return {
    renderDDPSVG,
    renderDFDSVG,
    serializeStandaloneSVG,
    downloadSVG,
    downloadPNG
  };
}));
