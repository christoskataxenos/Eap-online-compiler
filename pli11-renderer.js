// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 SVG Renderer (ΔΔΠ & ΔΡΔ) + HiDPI Word-Ready PNG/SVG Export
// Renders ○→ (Data Couples), ●→ (Control Flags), ◇ (Selection), ↻ (Loops),
// and DFD Circles, Parallel-Line Data Stores, and External Entity Boxes.
// Supports both Textbook Vertical-Spine EAP Layout (with local store/entity
// cloning & horizontal halo labels) and Classic Horizontal KM/KD Layout.
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
        ink: '#0f172a',
        muted: '#475569',
        edge: '#2b4c7e',
        labelBg: '#ffffff',
        labelBorder: '#cbd5e1',
        rootFill: '#f8fafc',
        rootStroke: '#1e3a5f',
        ctrlFill: '#ffffff',
        ctrlStroke: '#2b4c7e',
        calcFill: '#ffffff',
        calcStroke: '#2b4c7e',
        ioFill: '#f8fafc',
        ioStroke: '#2b4c7e',
        storeFill: '#ffffff',
        storeStroke: '#2b4c7e',
        kmBg: 'rgba(30, 58, 95, 0.03)',
        kmStroke: '#334155',
        activeStroke: '#b45309',
        activeGlow: 'rgba(180, 83, 9, 0.25)',
        font: 'Calibri, "Segoe UI", Roboto, Arial, sans-serif'
      };
    }

    if (options.theme === 'dark') {
      return {
        bg: '#0b0c15',
        ink: '#e0e6ed',
        muted: '#94a3b8',
        edge: '#94a3b8',
        labelBg: '#0b0c15',
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

    // Light mode (clean warm paper / EAP academic blue-teal accents)
    return {
      bg: '#fdf6e3',
      ink: '#073642',
      muted: '#586e75',
      edge: '#3b5998',
      labelBg: '#fdf6e3',
      labelBorder: '#d3cbb7',
      rootFill: '#e6f4f1',
      rootStroke: '#166534',
      ctrlFill: '#eef4fb',
      ctrlStroke: '#2b579a',
      calcFill: '#f3effb',
      calcStroke: '#5b5fc7',
      ioFill: '#eef7f2',
      ioStroke: '#2b579a',
      storeFill: '#faf3e3',
      storeStroke: '#2b579a',
      kmBg: 'rgba(43, 87, 154, 0.05)',
      kmStroke: '#2b579a',
      activeStroke: '#dc322f',
      activeGlow: 'rgba(220, 50, 47, 0.25)',
      font: 'Calibri, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    };
  }

  function roleStyle(role, pal) {
    switch (role) {
      case 'ROOT_CONTROL':
        return { fill: pal.rootFill, stroke: pal.rootStroke, tag: 'Ρίζα / Έλεγχος', sw: 2.3 };
      case 'CONTROL':
        return { fill: pal.ctrlFill, stroke: pal.ctrlStroke, tag: 'Έλεγχος', sw: 1.8 };
      case 'CALC':
        return { fill: pal.calcFill, stroke: pal.calcStroke, tag: 'Υπολογισμός', sw: 1.8 };
      case 'DATA_MGMT':
        return { fill: pal.storeFill, stroke: pal.storeStroke, tag: 'Διαχ. Δεδομένων', sw: 1.8 };
      case 'PRESENTATION':
        return { fill: pal.ioFill, stroke: pal.ioStroke, tag: 'Παρουσίαση', sw: 1.8 };
      default:
        return { fill: pal.ioFill, stroke: pal.ioStroke, tag: 'Είσοδος/Έξοδος', sw: 1.7 };
    }
  }

  // ---------------------------------------------------------------------------
  // TEXT WRAPPING & MULTI-LINE SVG TEXT HELPERS
  // ---------------------------------------------------------------------------
  function splitTextIntoLines(text, maxCharsPerLine = 20) {
    if (!text) return [''];
    const str = String(text).trim();
    if (!str) return [''];

    if (str.includes('\n')) {
      return str.split('\n').flatMap((line) => splitTextIntoLines(line, maxCharsPerLine));
    }

    if (str.length <= maxCharsPerLine) return [str];

    // Normalize spacing after commas so comma-separated lists wrap cleanly
    const normalized = str.replace(/,\s*/g, ', ');
    const words = normalized.split(/\s+/);
    if (words.length === 1) {
      if (str.length > maxCharsPerLine && str.includes('_')) {
        const parts = str.split('_');
        const lines = [];
        let cur = '';
        for (const p of parts) {
          if (!cur) cur = p;
          else if ((cur + '_' + p).length <= maxCharsPerLine) cur += '_' + p;
          else {
            lines.push(cur);
            cur = p;
          }
        }
        if (cur) lines.push(cur);
        return lines.length > 0 ? lines : [str];
      }
      return [str];
    }

    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const token = word.length > maxCharsPerLine && word.includes('_')
        ? word.replace(/_/g, ' ')
        : word;
      if (token.includes(' ') && token !== word) {
        for (const sub of token.split(/\s+/)) {
          if (!currentLine) currentLine = sub;
          else if ((currentLine + ' ' + sub).length <= maxCharsPerLine) currentLine += ' ' + sub;
          else {
            lines.push(currentLine);
            currentLine = sub;
          }
        }
        continue;
      }
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [str];
  }

  function renderMultilineText(lines, cx, cy, options = {}) {
    const fontSize = options.fontSize || 13;
    const fontWeight = options.fontWeight || '700';
    const fill = options.fill || '#000';
    const anchor = options.anchor || 'middle';
    const haloStroke = options.haloStroke || '';
    const haloAttr = haloStroke
      ? ` stroke="${haloStroke}" stroke-width="${options.haloWidth || 4.5}" stroke-linejoin="round" paint-order="stroke"`
      : '';
    const n = lines.length;
    if (n === 0) return '';
    if (n === 1) {
      return `<text x="${cx.toFixed(1)}" y="${(cy + 1).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" fill="${fill}" font-size="${fontSize}" font-weight="${fontWeight}"${haloAttr}>${escXml(lines[0])}</text>`;
    }
    const lineHeight = options.lineHeight || options.lineSpacing || (fontSize + 4.5);
    const startY = cy - ((n - 1) * lineHeight) / 2;
    const tspans = lines.map((line, idx) => {
      const y = startY + idx * lineHeight;
      return `<tspan x="${cx.toFixed(1)}" y="${y.toFixed(1)}">${escXml(line)}</tspan>`;
    }).join('');

    return `<text text-anchor="${anchor}" dominant-baseline="middle" fill="${fill}" font-size="${fontSize}" font-weight="${fontWeight}"${haloAttr}>${tspans}</text>`;
  }

  function formatDFDFlowItem(raw) {
    return String(raw || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function computeCanvasViewport(minX, minY, maxX, maxY, padX, padY, extraBottom, options = {}) {
    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || maxX <= minX) {
      minX = 0;
      maxX = 640;
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || maxY <= minY) {
      minY = 0;
      maxY = 240;
    }

    const tightMinX = Math.floor(minX - padX);
    const tightMinY = Math.floor(minY - padY);
    const tightW = Math.max(320, Math.ceil((maxX - minX) + padX * 2));
    const tightH = Math.max(200, Math.ceil((maxY - minY) + extraBottom + padY * 2));

    // Word / tight export: never add letterbox whitespace around the diagram
    if (options.tightCrop || (!options.canvasWidth && !options.canvasHeight)) {
      return {
        viewMinX: tightMinX,
        viewMinY: tightMinY,
        viewW: tightW,
        viewH: tightH,
        svgW: tightW,
        svgH: tightH
      };
    }

    const targetW = options.canvasWidth || tightW;
    const targetH = options.canvasHeight || tightH;
    const targetAR = targetW / targetH;
    const tightAR = tightW / tightH;

    let viewW = tightW;
    let viewH = tightH;
    let viewMinX = tightMinX;
    let viewMinY = tightMinY;

    if (tightAR < targetAR) {
      viewW = Math.round(tightH * targetAR);
      viewMinX = Math.round(tightMinX - (viewW - tightW) / 2);
    } else if (tightAR > targetAR) {
      viewH = Math.round(tightW / targetAR);
      viewMinY = Math.round(tightMinY - (viewH - tightH) / 2);
    }

    return {
      viewMinX,
      viewMinY,
      viewW,
      viewH,
      svgW: targetW,
      svgH: targetH
    };
  }

  // ---------------------------------------------------------------------------
  // 1. ΔΔΠ (STRUCTURE CHART) SVG RENDERER — OFFICIAL EAP TEXTBOOK LAYOUT
  //    • Strict 1-row-per-depth hierarchy (zero staggered rows, zero crossings)
  //    • Wide spanning Root Header Bar so Level-1 call arrows drop 90° vertically
  //    • Sub-controllers (Exec_Mi) align vertically over their Calc_Mi module
  //    • Crisp call arrowheads (↓) and clean borderless couple labels (○→ / ●→)
  // ---------------------------------------------------------------------------
  function formatDDPCoupleLines(items) {
    if (!items || items.length === 0) return [];
    const names = items.map((x) => String(x.name || '').trim()).filter(Boolean);
    if (names.length === 0) return [];
    const allShort = names.every((n) => n.length <= 2);
    if (allShort) {
      if (names.length <= 5) return [names.join(',')];
      const chunks = [];
      for (let i = 0; i < names.length; i += 4) {
        chunks.push(names.slice(i, i + 4).join(','));
      }
      return chunks;
    }
    return splitTextIntoLines(names.join(', '), 16);
  }

  function estimateLinesWidth(lines, fontSize = 11.5) {
    if (!lines || lines.length === 0) return 0;
    const maxLen = Math.max(...lines.map((l) => l.length), 0);
    return Math.ceil(maxLen * (fontSize * 0.61) + 4);
  }

  function renderDDPSVG(model, options = {}) {
    const pal = getPalette(options);
    const isPrint = Boolean(options.printMode);
    const activeNodeId = options.activeNodeId || null;
    const activeEdgeId = options.activeEdgeId || null;
    const showLegend = options.showLegend !== false && !options.tightCrop && !isPrint;

    if (!model || !model.nodes || model.nodes.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 240" width="680" height="240" style="font-family:${escXml(pal.font)}">
        <rect width="680" height="240" fill="${pal.bg}" rx="4"/>
        <text x="340" y="115" text-anchor="middle" fill="${pal.muted}" font-size="14" font-weight="600">Γράψτε ψευδοκώδικα ΠΛΗ11 (PROCEDURE ... END_PROCEDURE) για να παραχθεί το ΔΔΠ.</text>
      </svg>`;
    }

    const baseBoxH = 52;
    const baseHGap = model.nodes.length >= 12 ? 20 : 26;
    const coupleFontSize = 11.5;

    const nodeById = new Map();
    const nodeDims = new Map();
    const nodeLines = new Map();
    for (const n of model.nodes) {
      nodeById.set(n.id, n);
      const lines = splitTextIntoLines(n.name || '', 18);
      nodeLines.set(n.id, lines);
      const maxLen = Math.max(...lines.map((l) => l.length), 1);
      const w = Math.max(90, Math.ceil(maxLen * 7.8 + 20));
      const h = Math.max(baseBoxH, lines.length * 16 + (n.isStub ? 22 : 18));
      nodeDims.set(n.id, { w, h });
    }

    // Build spanning forest from root (preserving exact left-to-right CALL order)
    const childrenByParent = new Map();
    for (const n of model.nodes) childrenByParent.set(n.id, []);
    for (const e of model.edges) {
      if (childrenByParent.has(e.from)) {
        childrenByParent.get(e.from).push(e);
      }
    }

    const placedInTree = new Set();
    const treeChildren = new Map();
    const treeParentEdge = new Map();
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
            treeParentEdge.set(e.to, e);
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
      if (!placedInTree.has(n.id) && n.inDegree === 0) {
        componentRoots.push(n.id);
        buildSpanningTree(n.id);
      }
    }
    for (const n of model.nodes) {
      if (!placedInTree.has(n.id)) {
        componentRoots.push(n.id);
        buildSpanningTree(n.id);
      }
    }

    // Pre-compute couple label extents per tree edge so sibling spacing never collides
    function getEdgeSideExtents(childId, leanHint = 0) {
      const e = treeParentEdge.get(childId);
      if (!e) return { leftW: 0, rightW: 0, maxLines: 0, hasDecor: false };
      const inLines = formatDDPCoupleLines(e.inputs);
      const outLines = formatDDPCoupleLines(e.outputs);
      const flagLines = formatDDPCoupleLines(e.controlFlags);
      const hasDown = inLines.length > 0;
      const hasUp = outLines.length > 0 || flagLines.length > 0;
      const inW = hasDown ? estimateLinesWidth(inLines, coupleFontSize) + 18 : 0;
      const upW = hasUp
        ? Math.max(estimateLinesWidth(outLines, coupleFontSize), estimateLinesWidth(flagLines, coupleFontSize)) + 18
        : 0;
      const maxLines = Math.max(
        inLines.length,
        outLines.length + (flagLines.length > 0 ? flagLines.length + 1 : 0),
        e.conditional && e.conditional.type === 'CASE' && e.conditional.label ? 1 : 0
      );
      const hasDecor = Boolean(e.conditional || e.loop);

      if (hasDown && hasUp) {
        return { leftW: inW, rightW: upW, maxLines, hasDecor };
      }
      const singleW = hasDown ? inW : upW;
      if (leanHint > 0) {
        return { leftW: 4, rightW: singleW, maxLines, hasDecor };
      }
      return { leftW: singleW, rightW: 4, maxLines, hasDecor };
    }

    // Track max box height & vertical call-gap needed at each depth level
    const depthMaxBoxH = new Map();
    const depthVGap = new Map();

    // Bottom-up tidy tree layout with EAP sub-controller alignment
    const relXMap = new Map(); // nodeId -> x offset relative to its parent's cx (for root: 0)
    function computeSubtree(id, depth, leanHint = 0) {
      const dim = nodeDims.get(id);
      depthMaxBoxH.set(depth, Math.max(depthMaxBoxH.get(depth) || baseBoxH, dim.h));

      const edgeExt = getEdgeSideExtents(id, leanHint);
      if (depth > 0) {
        const extraLines = Math.max(0, edgeExt.maxLines - 1) * 14;
        const extraDecor = edgeExt.hasDecor ? 16 : 0;
        const neededGap = 80 + extraLines + extraDecor;
        depthVGap.set(depth - 1, Math.max(depthVGap.get(depth - 1) || 80, neededGap));
      }

      const ch = treeChildren.get(id) || [];
      const selfLeft = -Math.max(dim.w / 2, edgeExt.leftW);
      const selfRight = Math.max(dim.w / 2, edgeExt.rightW);

      if (ch.length === 0) {
        return {
          leftBound: selfLeft,
          rightBound: selfRight,
          minBoxLeft: -dim.w / 2,
          maxBoxRight: dim.w / 2
        };
      }

      // Determine lean hints for children so diagonal outer couples reserve space on the correct side
      const childSubs = ch.map((cid, idx) => {
        let childLean = 0;
        if (depth >= 1 && ch.length >= 2) {
          if (idx === 0) childLean = -1;
          else if (idx === ch.length - 1) childLean = 1;
        }
        return computeSubtree(cid, depth + 1, childLean);
      });

      const centers = [0];
      for (let i = 1; i < ch.length; i++) {
        const prev = childSubs[i - 1];
        const cur = childSubs[i];
        centers.push(centers[i - 1] + prev.rightBound - cur.leftBound + baseHGap);
      }

      // EAP alignment of parent controller above its children:
      // • 2-child sub-controller [Get, Calc] or [Calc, Put]: align directly above Calc (vertical ↓ arrow on Calc!)
      // • 3-child sub-controller: align directly above middle child
      // • Otherwise: center above first..last child centers
      let anchorX = (centers[0] + centers[ch.length - 1]) / 2;
      if (depth >= 1 && ch.length === 2) {
        const n0 = nodeById.get(ch[0]);
        const n1 = nodeById.get(ch[1]);
        const c0Leaf = (treeChildren.get(ch[0]) || []).length === 0;
        const c1Leaf = (treeChildren.get(ch[1]) || []).length === 0;
        if (c0Leaf && c1Leaf && n0 && n1) {
          if (n1.role === 'CALC' && n0.role !== 'CALC') anchorX = centers[1];
          else if (n0.role === 'CALC' && n1.role !== 'CALC') anchorX = centers[0];
        }
      } else if (depth >= 1 && ch.length === 3) {
        const allKidsLeaves = ch.every((cid) => (treeChildren.get(cid) || []).length === 0);
        if (allKidsLeaves) anchorX = centers[1];
      }

      let minLeft = selfLeft;
      let maxRight = selfRight;
      let minBoxLeft = -dim.w / 2;
      let maxBoxRight = dim.w / 2;

      for (let i = 0; i < ch.length; i++) {
        const relCx = centers[i] - anchorX;
        relXMap.set(ch[i], relCx);
        minLeft = Math.min(minLeft, relCx + childSubs[i].leftBound);
        maxRight = Math.max(maxRight, relCx + childSubs[i].rightBound);
        minBoxLeft = Math.min(minBoxLeft, relCx + childSubs[i].minBoxLeft);
        maxBoxRight = Math.max(maxBoxRight, relCx + childSubs[i].maxBoxRight);
      }

      return {
        leftBound: minLeft,
        rightBound: maxRight,
        minBoxLeft,
        maxBoxRight
      };
    }

    const rootSubtrees = new Map();
    for (const rId of componentRoots) {
      relXMap.set(rId, 0);
      rootSubtrees.set(rId, computeSubtree(rId, 0, 0));
    }

    // Compute exact Y top coordinate for every depth level
    const maxDepth = Math.max(...Array.from(depthMaxBoxH.keys()), 0);
    const depthTopY = new Map();
    let runningY = 44;
    for (let d = 0; d <= maxDepth; d++) {
      depthTopY.set(d, runningY);
      const bh = depthMaxBoxH.get(d) || baseBoxH;
      const vg = depthVGap.get(d) || 80;
      runningY += bh + vg;
    }

    // Assign absolute coordinates top-down
    const coords = new Map();
    function materializeCoords(id, absCx, depth, compSub) {
      const dim = nodeDims.get(id);
      const levelH = depthMaxBoxH.get(depth) || dim.h;
      const topY = depthTopY.get(depth) || 44;
      const ch = treeChildren.get(id) || [];

      let boxX = absCx - dim.w / 2;
      let boxW = dim.w;

      // Official EAP Wide Header Bar for Root Control (depth 0 with >= 3 direct children,
      // or any dispatcher with >= 6 direct children)
      if (options.wideRootBar !== false && ((depth === 0 && ch.length >= 3) || ch.length >= 6)) {
        if (depth === 0 && compSub) {
          const spanLeft = absCx + compSub.minBoxLeft;
          const spanRight = absCx + compSub.maxBoxRight;
          if (spanRight - spanLeft > dim.w) {
            boxX = spanLeft;
            boxW = spanRight - spanLeft;
          }
        } else if (ch.length >= 6) {
          const firstCx = absCx + (relXMap.get(ch[0]) || 0);
          const lastCx = absCx + (relXMap.get(ch[ch.length - 1]) || 0);
          const firstW = nodeDims.get(ch[0]).w;
          const lastW = nodeDims.get(ch[ch.length - 1]).w;
          const spanLeft = firstCx - firstW / 2;
          const spanRight = lastCx + lastW / 2;
          if (spanRight - spanLeft > dim.w) {
            boxX = spanLeft;
            boxW = spanRight - spanLeft;
          }
        }
      }

      const boxCx = boxX + boxW / 2;
      const boxCy = topY + levelH / 2;

      coords.set(id, {
        cx: boxCx,
        anchorCx: absCx,
        cy: boxCy,
        x: boxX,
        y: topY,
        w: boxW,
        h: levelH,
        depth,
        isWideBar: boxW > dim.w + 8
      });

      for (const cid of ch) {
        const childCx = absCx + (relXMap.get(cid) || 0);
        materializeCoords(cid, childCx, depth + 1, null);
      }
    }

    let cursorX = 48;
    const compRanges = [];
    for (let i = 0; i < componentRoots.length; i++) {
      const rId = componentRoots[i];
      const sub = rootSubtrees.get(rId);
      const width = sub.rightBound - sub.leftBound;
      const rootAbsCx = cursorX - sub.leftBound;
      materializeCoords(rId, rootAbsCx, 0, sub);
      compRanges.push({ rootId: rId, startX: cursorX, width });
      cursorX += width + 84;
    }

    // Apply optional interactive custom positions on DDP nodes
    const customPositions = options.positions || {};
    for (const [id, c] of coords.entries()) {
      const ov = customPositions[id];
      if (ov && typeof ov.x === 'number' && typeof ov.y === 'number') {
        c.cx = Math.round(ov.x);
        c.cy = Math.round(ov.y);
        c.x = c.cx - c.w / 2;
        c.y = c.cy - c.h / 2;
      }
    }

    const edgeStrokeDefault = isPrint ? '#000000' : pal.edge;
    const inkColor = isPrint ? '#000000' : pal.ink;

    const edgeParts = [];
    const edgeLabelLayers = [];
    const labelBounds = [];

    function renderCleanCoupleLabel(x, y, lines, anchor, fontSize = coupleFontSize) {
      if (!lines || lines.length === 0) return;
      const w = estimateLinesWidth(lines, fontSize);
      const lineSpacing = fontSize + 3;
      const h = lines.length * lineSpacing;
      const left = anchor === 'end' ? x - w : (anchor === 'start' ? x : x - w / 2);
      const top = y - h / 2;

      const svg = renderMultilineText(lines, x, y, {
        fontSize,
        fontWeight: '600',
        fill: inkColor,
        anchor,
        lineHeight: lineSpacing,
        haloStroke: pal.bg,
        haloWidth: 4.2
      });
      edgeLabelLayers.push(`<g pointer-events="none" class="ddp-couple-label">${svg}</g>`);
      labelBounds.push({ left, right: left + w, top, bottom: top + h, w, h });
    }

    // Count parallel calls between identical (from, to) pairs
    const pairTotals = new Map();
    const pairSeen = new Map();
    for (const e of model.edges) {
      const k = `${e.from}->${e.to}`;
      pairTotals.set(k, (pairTotals.get(k) || 0) + 1);
    }

    // Draw Call Edges (with ↓ arrowheads) & EAP Couples (○→ / ●→)
    for (const parentNode of model.nodes) {
      const edges = childrenByParent.get(parentNode.id) || [];
      if (edges.length === 0) continue;
      const pPos = coords.get(parentNode.id);
      if (!pPos) continue;

      const sortedEdges = [...edges].sort((a, b) => {
        const ca = coords.get(a.to);
        const cb = coords.get(b.to);
        return (ca ? ca.cx : 0) - (cb ? cb.cx : 0);
      });

      for (let idx = 0; idx < sortedEdges.length; idx++) {
        const e = sortedEdges[idx];
        const cPos = coords.get(e.to);
        if (!cPos) continue;

        const pairKey = `${e.from}->${e.to}`;
        const pTotal = pairTotals.get(pairKey) || 1;
        const pIdx = pairSeen.get(pairKey) || 0;
        pairSeen.set(pairKey, pIdx + 1);
        const dupShift = pTotal > 1 ? (pIdx - (pTotal - 1) / 2) * 16 : 0;

        // Compute parent attachment X1:
        // • If child.cx sits inside parent's horizontal span (e.g. wide Root bar, or aligned Calc under Exec_Mi):
        //   drop 100% straight vertically (x1 === x2)!
        // • Otherwise: intersect ray from (pPos.cx, pPos.cy) -> (cPos.cx, cPos.y) with parent bottom border.
        const y1 = pPos.y + pPos.h;
        const y2 = cPos.y;
        const targetX = cPos.cx + dupShift;
        let x1;
        const innerPad = Math.min(14, pPos.w * 0.16);
        if (Math.abs(targetX - pPos.cx) <= 2) {
          x1 = targetX;
        } else if (pPos.isWideBar && targetX >= pPos.x + innerPad && targetX <= pPos.x + pPos.w - innerPad) {
          x1 = targetX;
        } else {
          const rayDy = Math.max(20, y2 - pPos.cy);
          const rayX = pPos.cx + (targetX - pPos.cx) * ((pPos.h / 2) / rayDy);
          x1 = Math.max(pPos.x + 8, Math.min(pPos.x + pPos.w - 8, rayX));
        }
        const x2 = targetX;

        const isEdgeActive = activeEdgeId === e.id;
        const strokeColor = isEdgeActive ? pal.activeStroke : edgeStrokeDefault;
        const strokeW = isEdgeActive ? 2.5 : 1.5;
        const callMarker = isEdgeActive ? 'url(#eap-call-arrow-active)' : 'url(#eap-call-arrow)';

        const isNormalDown = y2 > y1 + 12;
        let midX = (x1 + x2) / 2;
        let midY = (y1 + y2) / 2 + ((e.conditional || e.loop) ? 5 : 0);

        if (isNormalDown) {
          edgeParts.push(
            `<line class="ddp-edge" data-edge-id="${escXml(e.id)}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeW}" marker-end="${callMarker}" />`
          );
        } else {
          const detourX = Math.max(x1, x2) + 68;
          edgeParts.push(
            `<path class="ddp-edge" data-edge-id="${escXml(e.id)}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${detourX.toFixed(1)} ${(y1 + 38).toFixed(1)}, ${detourX.toFixed(1)} ${(y2 - 38).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="5 3" marker-end="${callMarker}" />`
          );
          midX = detourX - 16;
          midY = (y1 + y2) / 2;
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        // Left & right unit normals (for downward edges uy > 0, so leftN.x < 0 and rightN.x > 0)
        const leftNx = -uy;
        const leftNy = ux;
        const rightNx = uy;
        const rightNy = -ux;

        if (e.conditional && isNormalDown) {
          const dcx = x1 + ux * 7;
          const dcy = y1 + uy * 7;
          const rD = 5.5;
          const pts = [
            `${dcx.toFixed(1)},${(dcy - rD).toFixed(1)}`,
            `${(dcx + rD).toFixed(1)},${dcy.toFixed(1)}`,
            `${dcx.toFixed(1)},${(dcy + rD).toFixed(1)}`,
            `${(dcx - rD).toFixed(1)},${dcy.toFixed(1)}`
          ].join(' ');
          edgeParts.push(`<polygon points="${pts}" fill="${pal.bg}" stroke="${strokeColor}" stroke-width="1.5" />`);
          if (e.conditional.type === 'CASE' && e.conditional.label) {
            const bx = x1 + ux * 16 + rightNx * 8;
            const by = y1 + uy * 16 + rightNy * 8;
            renderCleanCoupleLabel(bx, by, [`(${e.conditional.label})`], 'start', 10.5);
          }
        }

        if (e.loop && isNormalDown) {
          const lcx = x1 + ux * 18;
          const lcy = y1 + uy * 18;
          edgeParts.push(
            `<path d="M ${(lcx - 12).toFixed(1)} ${(lcy + 3).toFixed(1)} A 12 7 0 1 1 ${(lcx + 11).toFixed(1)} ${(lcy + 3).toFixed(1)}" fill="none" stroke="${strokeColor}" stroke-width="1.5" marker-end="url(#eap-couple-arrow)" />`
          );
        }

        if (!isNormalDown) continue;

        const coupleColor = isEdgeActive ? pal.activeStroke : inkColor;
        const arrowMarker = isEdgeActive ? 'url(#eap-couple-arrow-active)' : 'url(#eap-couple-arrow)';
        const arrowHalf = Math.min(13, Math.max(9, (len - 22) * 0.24));
        const perpDist = 9.5;
        const lblGap = 6;

        const inLines = formatDDPCoupleLines(e.inputs);
        const outLines = formatDDPCoupleLines(e.outputs);
        const flagLines = formatDDPCoupleLines(e.controlFlags);
        const hasDown = inLines.length > 0;
        const hasUp = outLines.length > 0 || flagLines.length > 0;

        function drawCouple(cxBase, cyBase, side, dirDown, isFlag, lines) {
          const nx = side === 'left' ? leftNx : rightNx;
          const ny = side === 'left' ? leftNy : rightNy;
          const anchor = side === 'left' ? 'end' : 'start';
          const ax = cxBase + nx * perpDist;
          const ay = cyBase + ny * perpDist;
          const sx = dirDown ? ax - ux * arrowHalf : ax + ux * arrowHalf;
          const sy = dirDown ? ay - uy * arrowHalf : ay + uy * arrowHalf;
          const ex = dirDown ? ax + ux * arrowHalf : ax - ux * arrowHalf;
          const ey = dirDown ? ay + uy * arrowHalf : ay - uy * arrowHalf;

          edgeParts.push(
            `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${coupleColor}" stroke-width="1.35" marker-end="${arrowMarker}" />`,
            `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.1" fill="${isFlag ? coupleColor : pal.bg}" stroke="${coupleColor}" stroke-width="1.35" />`
          );

          const lx = ax + nx * lblGap + (side === 'left' ? -1.5 : 1.5);
          const ly = ay + ny * lblGap;
          renderCleanCoupleLabel(lx, ly, lines, anchor, coupleFontSize);
        }

        // Official EAP couple side rule:
        // • Dual couples (both input ↓ and output ↑): input on LEFT, output/flag on RIGHT.
        // • Single couple: on upper-RIGHT if edge leans right (dx > 6), else on LEFT.
        if (hasDown && hasUp) {
          drawCouple(midX, midY, 'left', true, false, inLines);
          if (outLines.length > 0 && flagLines.length > 0) {
            const topMidX = x1 + dx * 0.36;
            const topMidY = y1 + dy * 0.36;
            const botMidX = x1 + dx * 0.68;
            const botMidY = y1 + dy * 0.68;
            drawCouple(topMidX, topMidY, 'right', false, false, outLines);
            drawCouple(botMidX, botMidY, 'right', false, true, flagLines);
          } else if (outLines.length > 0) {
            drawCouple(midX, midY, 'right', false, false, outLines);
          } else {
            drawCouple(midX, midY, 'right', false, true, flagLines);
          }
        } else if (hasDown) {
          const side = dx > 6 ? 'right' : 'left';
          drawCouple(midX, midY, side, true, false, inLines);
        } else if (hasUp) {
          const side = dx > 6 ? 'right' : 'left';
          if (outLines.length > 0 && flagLines.length > 0) {
            const topMidX = x1 + dx * 0.36;
            const topMidY = y1 + dy * 0.36;
            const botMidX = x1 + dx * 0.68;
            const botMidY = y1 + dy * 0.68;
            drawCouple(topMidX, topMidY, side, false, false, outLines);
            drawCouple(botMidX, botMidY, side, false, true, flagLines);
          } else if (outLines.length > 0) {
            drawCouple(midX, midY, side, false, false, outLines);
          } else {
            drawCouple(midX, midY, side, false, true, flagLines);
          }
        }
      }
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const pos of coords.values()) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + pos.w);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y + pos.h);
    }
    for (const b of labelBounds) {
      minX = Math.min(minX, b.left);
      maxX = Math.max(maxX, b.right);
      minY = Math.min(minY, b.top);
      maxY = Math.max(maxY, b.bottom);
    }

    const padX = options.paddingX || options.padding || (options.tightCrop ? 18 : 28);
    const padY = options.paddingY || options.padding || (options.tightCrop ? 16 : 24);
    const legendH = showLegend ? 44 : 8;
    const vp = computeCanvasViewport(minX, minY, maxX, maxY, padX, padY, legendH, options);

    const svgParts = [];
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vp.viewMinX} ${vp.viewMinY} ${vp.viewW} ${vp.viewH}" width="${vp.svgW}" height="${vp.svgH}" style="font-family:${escXml(pal.font)}">`,
      `<defs>`,
      `  <marker id="eap-call-arrow" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">`,
      `    <path d="M 0 1.2 L 9.5 5 L 0 8.8 z" fill="${edgeStrokeDefault}" />`,
      `  </marker>`,
      `  <marker id="eap-call-arrow-active" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">`,
      `    <path d="M 0 1.2 L 9.5 5 L 0 8.8 z" fill="${pal.activeStroke}" />`,
      `  </marker>`,
      `  <marker id="eap-couple-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.2" markerHeight="6.2" orient="auto-start-reverse">`,
      `    <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="${inkColor}" />`,
      `  </marker>`,
      `  <marker id="eap-couple-arrow-active" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.2" markerHeight="6.2" orient="auto-start-reverse">`,
      `    <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="${pal.activeStroke}" />`,
      `  </marker>`,
      `</defs>`,
      `<rect x="${vp.viewMinX}" y="${vp.viewMinY}" width="${vp.viewW}" height="${vp.viewH}" fill="${pal.bg}" />`
    );

    if (compRanges.length > 1) {
      for (let i = 1; i < compRanges.length; i++) {
        const divX = compRanges[i].startX - 42;
        svgParts.push(
          `<line x1="${divX}" y1="${minY}" x2="${divX}" y2="${maxY + 8}" stroke="${pal.labelBorder}" stroke-width="1.5" stroke-dasharray="6 5" />`,
          `<text x="${divX + 10}" y="${minY + 10}" fill="${pal.muted}" font-size="11" font-weight="600">Ανεξάρτητη / Μερική Μονάδα</text>`
        );
      }
    }

    svgParts.push(...edgeParts);

    for (const n of model.nodes) {
      const pos = coords.get(n.id);
      if (!pos) continue;
      const st = roleStyle(n.role, pal);
      const isActive = activeNodeId === n.id;
      const dash = n.isStub ? ' stroke-dasharray="5 3"' : '';
      const boxFill = isPrint ? '#ffffff' : st.fill;
      const boxStroke = isActive ? pal.activeStroke : (isPrint ? '#000000' : st.stroke);
      const boxStrokeW = isActive ? 2.4 : (isPrint ? 1.5 : st.sw);
      const activeOutline = isActive
        ? `<rect x="${(pos.x - 4).toFixed(1)}" y="${(pos.y - 4).toFixed(1)}" width="${(pos.w + 8).toFixed(1)}" height="${(pos.h + 8).toFixed(1)}" rx="2" fill="none" stroke="${pal.activeStroke}" stroke-width="2.4" />`
        : '';

      const lines = nodeLines.get(n.id) || [n.name];
      const textCy = n.isStub ? pos.cy - 5 : pos.cy;
      const fSize = lines.length > 2 ? 11.5 : (lines.length === 2 ? 12.5 : 13);

      svgParts.push(
        `<g class="ddp-node" data-node-id="${escXml(n.id)}" data-line="${n.startLine}" data-x="${pos.cx.toFixed(1)}" data-y="${pos.cy.toFixed(1)}" style="cursor:pointer">`,
        activeOutline,
        `  <rect x="${pos.x.toFixed(1)}" y="${pos.y.toFixed(1)}" width="${pos.w.toFixed(1)}" height="${pos.h.toFixed(1)}" rx="0" fill="${boxFill}" stroke="${boxStroke}" stroke-width="${boxStrokeW}"${dash} />`,
        renderMultilineText(lines, pos.cx, textCy, { fontSize: fSize, fontWeight: '700', fill: inkColor }),
        n.isStub
          ? `  <text x="${pos.cx.toFixed(1)}" y="${(pos.y + pos.h - 6).toFixed(1)}" text-anchor="middle" fill="${pal.muted}" font-size="9.5">stub</text>`
          : '',
        `</g>`
      );
    }

    svgParts.push(...edgeLabelLayers);

    if (showLegend) {
      const ly = maxY + 30;
      const lx = minX;
      svgParts.push(
        `<g class="ddp-legend" font-size="11.5" fill="${pal.muted}">`,
        `  <line x1="${lx}" y1="${ly}" x2="${lx + 22}" y2="${ly}" stroke="${inkColor}" stroke-width="1.4" marker-end="url(#eap-couple-arrow)" />`,
        `  <circle cx="${lx}" cy="${ly}" r="3.1" fill="${pal.bg}" stroke="${inkColor}" stroke-width="1.4" />`,
        `  <text x="${lx + 30}" y="${ly + 4}">Ζεύγος δεδομένων (IN/OUT)</text>`,
        `  <line x1="${lx + 205}" y1="${ly}" x2="${lx + 227}" y2="${ly}" stroke="${inkColor}" stroke-width="1.4" marker-end="url(#eap-couple-arrow)" />`,
        `  <circle cx="${lx + 205}" cy="${ly}" r="3.1" fill="${inkColor}" />`,
        `  <text x="${lx + 235}" y="${ly + 4}">Σημαία ελέγχου (flag)</text>`,
        `  <polygon points="${lx + 385},${ly - 5} ${lx + 390},${ly} ${lx + 385},${ly + 5} ${lx + 380},${ly}" fill="${pal.bg}" stroke="${inkColor}" stroke-width="1.4" />`,
        `  <text x="${lx + 398}" y="${ly + 4}">Επιλογή (IF/CASE)</text>`,
        `  <path d="M ${lx + 515} ${ly + 3} A 9 6 0 1 1 ${lx + 533} ${ly + 3}" fill="none" stroke="${inkColor}" stroke-width="1.4" marker-end="url(#eap-couple-arrow)" />`,
        `  <text x="${lx + 541}" y="${ly + 4}">Επανάληψη (Loop)</text>`,
        `</g>`
      );
    }

    svgParts.push('</svg>');
    return svgParts.join('\n');
  }

  function renderPillLabelWithBounds(x, y, text, pal, anchor = 'middle', fontSize = 12, linesOverride = null, rotationDeg = 0, borderless = false) {
    const clean = String(text || '');
    const lines = linesOverride || (Array.isArray(text) ? text : [clean]);
    const maxLen = Math.max(...lines.map((l) => l.length), 1);
    const estW = Math.max(24, maxLen * (fontSize * 0.65) + 12);
    const lineSpacing = fontSize + 4;
    const estH = lines.length > 1 ? lines.length * lineSpacing + 6 : fontSize + 8;

    const isRotated = rotationDeg !== 0 && !isNaN(rotationDeg);
    const rotAttr = isRotated ? ` transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${rotationDeg.toFixed(1)})"` : '';
    let rx = isRotated ? -estW / 2 : x - estW / 2;
    if (anchor === 'start') rx = isRotated ? -4 : x - 4;
    else if (anchor === 'end') rx = isRotated ? -estW + 4 : x - estW + 4;
    const ry = isRotated ? -estH / 2 : y - estH / 2;

    const textBaseX = anchor === 'start'
      ? (isRotated ? estW / 2 - 4 : x + estW / 2 - 4)
      : anchor === 'end'
        ? (isRotated ? -estW / 2 + 4 : x - estW / 2 + 4)
        : (isRotated ? 0 : x);
    const textBaseY = isRotated ? 0 : y;

    const textSvg = lines.length === 1
      ? `<text x="${(isRotated ? 0 : x).toFixed(1)}" y="${(textBaseY + 1).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" fill="${pal.ink}" font-size="${fontSize}" font-weight="600" stroke="${pal.bg}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${escXml(lines[0])}</text>`
      : renderMultilineText(lines, textBaseX, textBaseY, {
          fontSize,
          fontWeight: '600',
          fill: pal.ink,
          lineSpacing,
          haloStroke: pal.bg,
          haloWidth: 4
        });

    const strokeAttr = borderless ? 'stroke="none"' : `stroke="${pal.labelBorder}" stroke-width="0.8"`;
    const svg = `<g pointer-events="none" class="ddp-pill-label"${rotAttr}>
      <rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${estW.toFixed(1)}" height="${estH.toFixed(1)}" rx="4" fill="${pal.labelBg}" fill-opacity="1" ${strokeAttr} />
      ${textSvg}
    </g>`;

    const absLeft = isRotated ? x - estW / 2 : rx;
    const absTop = isRotated ? y - estH / 2 : ry;
    return {
      svg,
      bounds: {
        left: absLeft,
        right: absLeft + estW,
        top: absTop,
        bottom: absTop + estH,
        w: estW,
        h: estH
      }
    };
  }

  function renderPillLabel(x, y, text, pal, anchor = 'middle', fontSize = 12, linesOverride = null, rotationDeg = 0, borderless = false) {
    return renderPillLabelWithBounds(x, y, text, pal, anchor, fontSize, linesOverride, rotationDeg, borderless).svg;
  }

  // ---------------------------------------------------------------------------
  // HELPER: NATURAL PROCESS ORDERING FOR VERTICAL EAP SPINE
  // ---------------------------------------------------------------------------
  function extractNumericTuple(proc) {
    const raw = String(proc.key || proc.label || '');
    const m = raw.match(/([0-9]+(?:[._][0-9]+)*)/);
    if (!m) return null;
    return m[1].split(/[._]/).map((n) => parseInt(n, 10));
  }

  function compareTuples(a, b) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const va = i < a.length ? a[i] : 0;
      const vb = i < b.length ? b[i] : 0;
      if (va !== vb) return va - vb;
    }
    return 0;
  }

  function sortProcessesForVerticalSpine(dfd) {
    const procs = [...(dfd.processes || [])];
    if (procs.length <= 1) return procs;

    // Check if processes carry distinct numeric codes (e.g. P1.1, P1.2, P1.3, P1.4 or M1, M2, M3)
    const tuples = new Map();
    let numericCount = 0;
    for (const p of procs) {
      const t = extractNumericTuple(p);
      if (t) {
        tuples.set(p.id, t);
        numericCount++;
      }
    }

    if (numericCount === procs.length) {
      return procs.sort((a, b) => compareTuples(tuples.get(a.id), tuples.get(b.id)));
    }

    // Topological order considering direct P->P flows and store-mediated P->Store->P flows
    const adj = new Map(procs.map((p) => [p.id, new Set()]));
    const indeg = new Map(procs.map((p) => [p.id, 0]));
    const procIds = new Set(procs.map((p) => p.id));

    for (const f of dfd.flows || []) {
      if (procIds.has(f.from) && procIds.has(f.to) && f.from !== f.to) {
        if (!adj.get(f.from).has(f.to)) {
          adj.get(f.from).add(f.to);
          indeg.set(f.to, indeg.get(f.to) + 1);
        }
      }
    }

    // Store-mediated ordering hint (only if it doesn't introduce cycles)
    for (const st of dfd.stores || []) {
      const writers = (dfd.flows || []).filter((f) => f.to === st.id && procIds.has(f.from)).map((f) => f.from);
      const readers = (dfd.flows || []).filter((f) => f.from === st.id && procIds.has(f.to)).map((f) => f.to);
      for (const w of writers) {
        for (const r of readers) {
          if (w !== r && !adj.get(r).has(w) && !adj.get(w).has(r)) {
            adj.get(w).add(r);
            indeg.set(r, indeg.get(r) + 1);
          }
        }
      }
    }

    const result = [];
    const ready = procs.filter((p) => indeg.get(p.id) === 0);
    const visited = new Set();
    while (result.length < procs.length) {
      const next = ready.shift() || procs.find((p) => !visited.has(p.id));
      if (!next || visited.has(next.id)) continue;
      visited.add(next.id);
      result.push(next);
      for (const v of adj.get(next.id) || []) {
        indeg.set(v, indeg.get(v) - 1);
        if (indeg.get(v) === 0 && !visited.has(v)) {
          ready.push(procs.find((x) => x.id === v));
        }
      }
    }
    return result;
  }

  function measureDFDNode(node) {
    if (node.type === 'process') {
      const lines = splitTextIntoLines(node.label || '', 15);
      const maxLen = Math.max(...lines.map((l) => l.length), 1);
      const r = Math.max(48, Math.max(maxLen * 4.8 + 16, lines.length * 11.5 + 22));
      return { shape: 'circle', r, w: r * 2, h: r * 2, lines };
    }
    if (node.type === 'store') {
      const lines = splitTextIntoLines(node.label || '', 20);
      const maxLen = Math.max(...lines.map((l) => l.length), 1);
      const w = Math.max(148, maxLen * 8.5 + 32);
      const h = Math.max(46, lines.length * 18 + 16);
      return { shape: 'store', w, h, lines };
    }
    const lines = splitTextIntoLines(node.label || '', 18);
    const maxLen = Math.max(...lines.map((l) => l.length), 1);
    const w = Math.max(140, maxLen * 8.6 + 30);
    const h = Math.max(52, lines.length * 18 + 18);
    return { shape: 'rect', w, h, lines };
  }

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

  // ---------------------------------------------------------------------------
  // 2A. TEXTBOOK EAP VERTICAL-SPINE DFD LAYOUT (Screenshot 2 Style!)
  // Processes flow top-to-bottom down the center spine; connected External
  // Entities & Data Stores sit locally on Left/Right of each process band
  // (with optional local cloning so shared stores/entities never create a web).
  // ---------------------------------------------------------------------------
  function buildVerticalSpineDFDLayout(dfd, options, showKM) {
    const clonePeripherals = options.clonePeripherals !== false;
    const orderedProcs = sortProcessesForVerticalSpine(dfd);
    const origNodeById = new Map(dfd.nodes.map((n) => [n.id, n]));
    const procIndexMap = new Map(orderedProcs.map((p, idx) => [p.id, idx]));

    const renderNodes = [...orderedProcs];
    const renderFlows = [];

    // Count how many distinct process bands touch each peripheral node
    const bandsByPeriph = new Map();
    for (const f of dfd.flows || []) {
      const fromNode = origNodeById.get(f.from);
      const toNode = origNodeById.get(f.to);
      if (!fromNode || !toNode) continue;
      if (fromNode.type === 'process' && toNode.type !== 'process') {
        if (!bandsByPeriph.has(toNode.id)) bandsByPeriph.set(toNode.id, new Set());
        bandsByPeriph.get(toNode.id).add(procIndexMap.get(fromNode.id));
      } else if (fromNode.type !== 'process' && toNode.type === 'process') {
        if (!bandsByPeriph.has(fromNode.id)) bandsByPeriph.set(fromNode.id, new Set());
        bandsByPeriph.get(fromNode.id).add(procIndexMap.get(toNode.id));
      }
    }

    // Track per-band peripheral entries: bandIdx -> Map<instId, { node, inFlows:[], outFlows:[] }>
    const bandPeriphs = orderedProcs.map(() => new Map());
    const firstSeenBandForPeriph = new Map();

    if (clonePeripherals) {
      for (let bIdx = 0; bIdx < orderedProcs.length; bIdx++) {
        const proc = orderedProcs[bIdx];
        for (const f of dfd.flows || []) {
          const isFromProc = f.from === proc.id;
          const isToProc = f.to === proc.id;
          if (!isFromProc && !isToProc) continue;
          const otherId = isFromProc ? f.to : f.from;
          const other = origNodeById.get(otherId);
          if (!other || other.type === 'process') continue;

          const totalBands = (bandsByPeriph.get(otherId) || new Set()).size;
          let instId = otherId;
          if (totalBands > 1) {
            if (!firstSeenBandForPeriph.has(otherId)) {
              firstSeenBandForPeriph.set(otherId, bIdx);
              instId = otherId;
            } else if (firstSeenBandForPeriph.get(otherId) !== bIdx) {
              instId = `${otherId}__B${bIdx}`;
            }
          }

          if (!bandPeriphs[bIdx].has(instId)) {
            const cloneNode = instId === otherId ? other : { ...other, id: instId, cloneOf: otherId };
            if (instId !== otherId || !renderNodes.some((rn) => rn.id === instId)) {
              renderNodes.push(cloneNode);
            }
            bandPeriphs[bIdx].set(instId, { node: cloneNode, inFlows: [], outFlows: [] });
          }

          const entry = bandPeriphs[bIdx].get(instId);
          const mappedFlow = {
            from: isFromProc ? proc.id : instId,
            to: isToProc ? proc.id : instId,
            data: f.data
          };
          renderFlows.push(mappedFlow);
          if (isToProc) entry.inFlows.push(mappedFlow);
          else entry.outFlows.push(mappedFlow);
        }
      }
    } else {
      // Single-instance mode: assign each peripheral to its average connected band
      const periphAssignedBand = new Map();
      for (const n of dfd.nodes) {
        if (n.type === 'process') continue;
        const bSet = Array.from(bandsByPeriph.get(n.id) || [0]);
        const avgBand = Math.min(
          orderedProcs.length - 1,
          Math.max(0, Math.round(bSet.reduce((a, b) => a + b, 0) / (bSet.length || 1)))
        );
        periphAssignedBand.set(n.id, avgBand);
        renderNodes.push(n);
        bandPeriphs[avgBand].set(n.id, { node: n, inFlows: [], outFlows: [] });
      }
      for (const f of dfd.flows || []) {
        const fromNode = origNodeById.get(f.from);
        const toNode = origNodeById.get(f.to);
        if (!fromNode || !toNode) continue;
        if (fromNode.type === 'process' && toNode.type === 'process') continue;
        renderFlows.push(f);
        const pId = fromNode.type === 'process' ? toNode.id : fromNode.id;
        const bIdx = periphAssignedBand.get(pId) || 0;
        const entry = bandPeriphs[bIdx].get(pId);
        if (entry) {
          if (toNode.type === 'process') entry.inFlows.push(f);
          else entry.outFlows.push(f);
        }
      }
    }

    // Add all process-to-process flows
    for (const f of dfd.flows || []) {
      const u = origNodeById.get(f.from);
      const v = origNodeById.get(f.to);
      if (u && v && u.type === 'process' && v.type === 'process') {
        renderFlows.push(f);
      }
    }

    // Measure all renderNodes
    const dimsMap = new Map();
    let maxLeftHalfW = 85;
    let maxRightHalfW = 85;
    let maxProcR = 52;
    for (const rn of renderNodes) {
      const m = measureDFDNode(rn);
      dimsMap.set(rn.id, m);
      if (rn.type === 'process') maxProcR = Math.max(maxProcR, m.r);
    }

    // Split each band's peripherals cleanly into Left vs Right columns
    const bandSides = orderedProcs.map((_, bIdx) => {
      const entries = Array.from(bandPeriphs[bIdx].values());
      // Score: pure source (-2), entity bidir (-1), store bidir (0), pure sink (+2)
      entries.sort((a, b) => {
        const scoreOf = (e) => {
          const hasIn = e.inFlows.length > 0;
          const hasOut = e.outFlows.length > 0;
          if (hasIn && !hasOut) return -2;
          if (hasIn && hasOut) return e.node.type === 'entity' ? -1 : 0;
          return 2;
        };
        return scoreOf(a) - scoreOf(b);
      });

      const left = [];
      const right = [];
      if (entries.length === 1) {
        const only = entries[0];
        if (only.inFlows.length >= only.outFlows.length) left.push(only);
        else right.push(only);
      } else {
        const leftTarget = Math.ceil(entries.length / 2);
        for (let i = 0; i < entries.length; i++) {
          if (i < leftTarget) left.push(entries[i]);
          else right.push(entries[i]);
        }
      }

      for (const item of left) maxLeftHalfW = Math.max(maxLeftHalfW, dimsMap.get(item.node.id).w / 2);
      for (const item of right) maxRightHalfW = Math.max(maxRightHalfW, dimsMap.get(item.node.id).w / 2);
      return { left, right };
    });

    const centerHalfReach = showKM ? Math.max(maxProcR + 28, 128) : maxProcR;
    const channelSpan = 285; // generous clear air for wrapped horizontal flow labels
    const xLeft = Math.ceil(maxLeftHalfW + 32);
    const xCenter = Math.ceil(xLeft + maxLeftHalfW + channelSpan + centerHalfReach);
    const xRight = Math.ceil(xCenter + centerHalfReach + channelSpan + maxRightHalfW);

    function estimateSlotHeight(entry) {
      const dim = dimsMap.get(entry.node.id);
      const inLines = entry.inFlows.reduce(
        (acc, f) => acc + splitTextIntoLines(f.data.map(formatDFDFlowItem).join(', '), 25).length,
        0
      );
      const outLines = entry.outFlows.reduce(
        (acc, f) => acc + splitTextIntoLines(f.data.map(formatDFDFlowItem).join(', '), 25).length,
        0
      );
      if (entry.inFlows.length > 0 && entry.outFlows.length > 0) {
        return Math.max(204, dim.h + 84 + (inLines + outLines) * 18);
      }
      return Math.max(122, dim.h + 48 + Math.max(inLines, outLines) * 18);
    }

    const coords = new Map();
    let cursorY = 56;

    for (let bIdx = 0; bIdx < orderedProcs.length; bIdx++) {
      const proc = orderedProcs[bIdx];
      const pDim = dimsMap.get(proc.id);
      const { left, right } = bandSides[bIdx];

      const leftHeights = left.map(estimateSlotHeight);
      const rightHeights = right.map(estimateSlotHeight);
      const leftTotalH = leftHeights.reduce((a, b) => a + b, 0);
      const rightTotalH = rightHeights.reduce((a, b) => a + b, 0);
      const bandH = Math.max(pDim.h + 44, leftTotalH, rightTotalH);
      const bandCenterY = cursorY + bandH / 2;

      coords.set(proc.id, {
        ...pDim,
        cx: xCenter,
        cy: bandCenterY
      });

      let curLeftY = bandCenterY - leftTotalH / 2;
      for (let i = 0; i < left.length; i++) {
        const entry = left[i];
        const hSlot = leftHeights[i];
        const d = dimsMap.get(entry.node.id);
        coords.set(entry.node.id, {
          ...d,
          cx: xLeft,
          cy: curLeftY + hSlot / 2
        });
        curLeftY += hSlot;
      }

      let curRightY = bandCenterY - rightTotalH / 2;
      for (let i = 0; i < right.length; i++) {
        const entry = right[i];
        const hSlot = rightHeights[i];
        const d = dimsMap.get(entry.node.id);
        coords.set(entry.node.id, {
          ...d,
          cx: xRight,
          cy: curRightY + hSlot / 2
        });
        curRightY += hSlot;
      }

      // Compute inter-band gap to next process (extra vertical space if P_i <-> P_{i+1} flow exists)
      if (bIdx < orderedProcs.length - 1) {
        const nextProc = orderedProcs[bIdx + 1];
        const directBetween = renderFlows.filter(
          (f) => (f.from === proc.id && f.to === nextProc.id) || (f.from === nextProc.id && f.to === proc.id)
        );
        if (directBetween.length > 0) {
          const linesCnt = directBetween.reduce(
            (acc, f) => acc + splitTextIntoLines(f.data.map(formatDFDFlowItem).join(', '), 24).length,
            0
          );
          cursorY += bandH + Math.max(96, 48 + linesCnt * 18);
        } else {
          cursorY += bandH + 42;
        }
      } else {
        cursorY += bandH;
      }
    }

    // Apply user interactive custom drag positions if provided
    const customPositions = options.positions || {};
    for (const [id, c] of coords.entries()) {
      const ov = customPositions[id];
      if (ov && typeof ov.x === 'number' && typeof ov.y === 'number') {
        c.cx = Math.round(ov.x);
        c.cy = Math.round(ov.y);
      }
    }

    return {
      renderNodes,
      renderFlows,
      coords,
      isVerticalSpine: true,
      showKM
    };
  }

  // ---------------------------------------------------------------------------
  // 2B. CLASSIC HORIZONTAL 3-STAGE DFD LAYOUT (KM / KD & Level 0 Context)
  // ---------------------------------------------------------------------------
  function buildHorizontalDFDLayout(dfd, options, showKM) {
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

    const centralIds = showKM
      ? new Set(dfd.processes.filter((p) => p.isCentral).map((p) => p.id))
      : new Set();
    const isUpstream = new Set();

    if (centralIds.size > 0) {
      const queue = [...centralIds];
      const visited = new Set(centralIds);
      while (queue.length > 0) {
        const curr = queue.shift();
        for (const f of dfd.flows) {
          if (f.to === curr) {
            const u = nodeById.get(f.from);
            if (u && u.type === 'process' && !centralIds.has(u.id) && !visited.has(u.id)) {
              visited.add(u.id);
              isUpstream.add(u.id);
              queue.push(u.id);
            }
          }
        }
      }
    }

    const procCol = new Map();
    if (centralIds.size === 0) {
      for (const p of dfd.processes) procCol.set(p.id, 1);
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
    } else {
      const upstreamProcs = dfd.processes.filter((p) => isUpstream.has(p.id));
      const centralProcs = dfd.processes.filter((p) => centralIds.has(p.id));
      const downstreamProcs = dfd.processes.filter((p) => !centralIds.has(p.id) && !isUpstream.has(p.id));

      for (const p of upstreamProcs) procCol.set(p.id, 1);
      for (let iter = 0; iter < upstreamProcs.length; iter++) {
        let changed = false;
        for (const f of dfd.flows) {
          if (isUpstream.has(f.from) && isUpstream.has(f.to)) {
            const nextCol = procCol.get(f.from) + 1;
            if (nextCol > procCol.get(f.to)) {
              procCol.set(f.to, nextCol);
              changed = true;
            }
          }
        }
        if (!changed) break;
      }
      const maxUpstreamCol = upstreamProcs.reduce((m, p) => Math.max(m, procCol.get(p.id) || 1), 0);

      const centralStartCol = maxUpstreamCol + 1;
      for (const p of centralProcs) procCol.set(p.id, centralStartCol);
      for (let iter = 0; iter < centralProcs.length; iter++) {
        let changed = false;
        for (const f of dfd.flows) {
          if (centralIds.has(f.from) && centralIds.has(f.to)) {
            const nextCol = procCol.get(f.from) + 1;
            if (nextCol > procCol.get(f.to)) {
              procCol.set(f.to, nextCol);
              changed = true;
            }
          }
        }
        if (!changed) break;
      }
      const maxCentralCol = centralProcs.reduce(
        (m, p) => Math.max(m, procCol.get(p.id) || centralStartCol),
        centralStartCol
      );

      const downstreamStartCol = maxCentralCol + 1;
      for (const p of downstreamProcs) procCol.set(p.id, downstreamStartCol);
      for (let iter = 0; iter < downstreamProcs.length; iter++) {
        let changed = false;
        for (const f of dfd.flows) {
          if (
            !centralIds.has(f.from) &&
            !isUpstream.has(f.from) &&
            !centralIds.has(f.to) &&
            !isUpstream.has(f.to)
          ) {
            const nextCol = procCol.get(f.from) + 1;
            if (nextCol > procCol.get(f.to)) {
              procCol.set(f.to, nextCol);
              changed = true;
            }
          }
        }
        if (!changed) break;
      }
    }

    const maxProcCol = dfd.processes.reduce((m, p) => Math.max(m, procCol.get(p.id) || 1), 1);

    // Balance bidirectional entities between Left and Right so col 0 never gets overcrowded
    const entityCol = new Map();
    const bidirEntities = [];
    for (const ent of dfd.entities) {
      const outs = outFlows.get(ent.id).length;
      const ins = inFlows.get(ent.id).length;
      if (outs > 0 && ins > 0) {
        bidirEntities.push(ent);
      } else {
        entityCol.set(ent.id, outs >= ins ? 0 : maxProcCol + 1);
      }
    }
    if (bidirEntities.length > 0) {
      let leftCnt = Array.from(entityCol.values()).filter((c) => c === 0).length;
      let rightCnt = Array.from(entityCol.values()).filter((c) => c === maxProcCol + 1).length;
      for (const ent of bidirEntities) {
        if (leftCnt <= rightCnt) {
          entityCol.set(ent.id, 0);
          leftCnt++;
        } else {
          entityCol.set(ent.id, maxProcCol + 1);
          rightCnt++;
        }
      }
    }

    const colBuckets = new Map();
    const pushBucket = (col, node) => {
      if (!colBuckets.has(col)) colBuckets.set(col, []);
      colBuckets.get(col).push(node);
    };
    for (const ent of dfd.entities) pushBucket(entityCol.get(ent.id), ent);
    for (const p of dfd.processes) pushBucket(procCol.get(p.id), p);

    const colKeys = Array.from(colBuckets.keys()).sort((a, b) => a - b);
    const dimsMap = new Map();
    for (const n of dfd.nodes) dimsMap.set(n.id, measureDFDNode(n));

    const colHalfW = new Map();
    for (const col of colKeys) {
      const list = colBuckets.get(col) || [];
      let maxHw = 48;
      for (const n of list) {
        const d = dimsMap.get(n.id);
        maxHw = Math.max(maxHw, d.shape === 'circle' ? d.r : d.w / 2);
      }
      colHalfW.set(col, maxHw);
    }

    const kmTitle = dfd.architecture === 'TRANSACTION_CENTER'
      ? 'Κέντρο Δοσοληψιών (ΚΔ)'
      : 'Κεντρικός Μετασχηματισμός (ΚΜ)';
    const kmTitleW = kmTitle.length * 7.4 + 22;
    const minKMW = kmTitleW + 40;

    const centralCols = centralIds.size > 0
      ? dfd.processes.filter((p) => centralIds.has(p.id)).map((p) => procCol.get(p.id))
      : [];
    const minCentralCol = centralCols.length > 0 ? Math.min(...centralCols) : -1;
    const maxCentralCol = centralCols.length > 0 ? Math.max(...centralCols) : -1;
    const isSingleColKM = minCentralCol === maxCentralCol && minCentralCol !== -1;

    const kmReachLeft = isSingleColKM ? minKMW / 2 : (colHalfW.get(minCentralCol) || 48) + 34;
    const kmReachRight = isSingleColKM ? minKMW / 2 : (colHalfW.get(maxCentralCol) || 48) + 34;

    const colToX = new Map();
    const col0Hw = colHalfW.get(colKeys[0]) || 70;
    colToX.set(colKeys[0], Math.max(128, Math.ceil(col0Hw + 36)));

    for (let i = 0; i < colKeys.length - 1; i++) {
      const c1 = colKeys[i];
      const c2 = colKeys[i + 1];
      const hw1 = colHalfW.get(c1);
      const hw2 = colHalfW.get(c2);

      let gap = hw1 + hw2 + 135;
      if (gap < 265) gap = 265;
      if (c2 === minCentralCol) gap = Math.max(gap, hw1 + 36 + kmReachLeft);
      if (c1 === maxCentralCol) gap = Math.max(gap, kmReachRight + 36 + hw2);
      colToX.set(c2, colToX.get(c1) + gap);
    }

    const rowSpacing = 152;
    const hasTopStores = dfd.stores.length > 0;
    const hasCentral = centralIds.size > 0;
    const topMargin = hasTopStores ? (hasCentral ? 190 : 146) : 64;

    let maxRows = 1;
    for (const [, list] of colBuckets.entries()) {
      maxRows = Math.max(maxRows, list.length);
    }
    const centerY = topMargin + ((maxRows - 1) * rowSpacing) / 2;

    const coords = new Map();
    for (const col of colKeys) {
      const list = colBuckets.get(col);
      const centrals = list.filter((n) => centralIds.has(n.id));
      const others = list.filter((n) => !centralIds.has(n.id));
      if (centrals.length > 0 && others.length > 0) {
        list.length = 0;
        list.push(...centrals, ...others);
      }
      const x = colToX.get(col);
      const startY = centerY - ((list.length - 1) * rowSpacing) / 2;
      list.forEach((node, idx) => {
        const y = startY + idx * rowSpacing;
        const d = dimsMap.get(node.id);
        coords.set(node.id, { ...d, cx: x, cy: y });
      });
    }

    if (dfd.stores.length > 0) {
      const storeInfos = dfd.stores.map((s) => {
        const connected = [
          ...inFlows.get(s.id).map((f) => coords.get(f.from)),
          ...outFlows.get(s.id).map((f) => coords.get(f.to))
        ].filter(Boolean);
        const avgX = connected.length > 0
          ? connected.reduce((acc, p) => acc + p.cx, 0) / connected.length
          : 260;
        return { store: s, desiredX: avgX, dim: dimsMap.get(s.id) };
      });
      storeInfos.sort((a, b) => a.desiredX - b.desiredX);

      let prevRight = 36;
      for (const info of storeInfos) {
        const cx = Math.max(prevRight + info.dim.w / 2 + 32, info.desiredX);
        coords.set(info.store.id, { ...info.dim, cx, cy: 52 });
        prevRight = cx + info.dim.w / 2;
      }
    }

    const customPositions = options.positions || {};
    for (const [id, c] of coords.entries()) {
      const ov = customPositions[id];
      if (ov && typeof ov.x === 'number' && typeof ov.y === 'number') {
        c.cx = Math.round(ov.x);
        c.cy = Math.round(ov.y);
      }
    }

    return {
      renderNodes: dfd.nodes,
      renderFlows: dfd.flows,
      coords,
      isVerticalSpine: false,
      showKM
    };
  }

  // ---------------------------------------------------------------------------
  // 2. ΔΡΔ (DATA FLOW DIAGRAM) SVG RENDERER
  // ---------------------------------------------------------------------------
  function renderDFDSVG(dfd, options = {}) {
    const pal = getPalette(options);
    const showLegend = options.showLegend !== false && !options.tightCrop;
    const showKM = options.showKMFrame !== false && !options.noKM && !dfd.noKM && dfd.showKMFrame !== false && dfd.level !== 0 && !dfd.isContextDiagram;

    if (!dfd || !dfd.nodes || dfd.nodes.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 240" width="680" height="240" style="font-family:${escXml(pal.font)}">
        <rect width="680" height="240" fill="${pal.bg}" rx="8"/>
        <text x="340" y="115" text-anchor="middle" fill="${pal.muted}" font-size="14" font-weight="600">Δεν εντοπίστηκαν ροές δεδομένων για δημιουργία ΔΡΔ.</text>
      </svg>`;
    }

    const layoutMode = options.layoutMode || 'auto';
    const procsList = dfd.processes || [];
    const allProcsCentral = procsList.length >= 2 && procsList.every((p) => p.isCentral);
    const useVertical = layoutMode === 'vertical'
      || (layoutMode === 'auto' && !dfd.isContextDiagram && dfd.level !== 0 && procsList.length >= 2 && (!showKM || allProcsCentral));

    const layout = useVertical
      ? buildVerticalSpineDFDLayout(dfd, options, showKM)
      : buildHorizontalDFDLayout(dfd, options, showKM);

    const { renderNodes, renderFlows, coords, isVerticalSpine } = layout;
    const nodeById = new Map(renderNodes.map((n) => [n.id, n]));

    // Compute KM bounding frame when showKM is active
    const kmTitle = dfd.architecture === 'TRANSACTION_CENTER'
      ? 'Κέντρο Δοσοληψιών (ΚΔ)'
      : 'Κεντρικός Μετασχηματισμός (ΚΜ)';
    const kmTitleW = kmTitle.length * 7.4 + 22;
    const kmTitleH = 22;
    const minKMW = kmTitleW + 36;

    const centralCoords = showKM
      ? renderNodes.filter((p) => p.type === 'process' && p.isCentral).map((p) => coords.get(p.id)).filter(Boolean)
      : [];
    let kmFrame = null;
    if (centralCoords.length > 0) {
      const cMinX = Math.min(...centralCoords.map((c) => c.cx - c.r));
      const cMaxX = Math.max(...centralCoords.map((c) => c.cx + c.r));
      const cMinY = Math.min(...centralCoords.map((c) => c.cy - c.r));
      const cMaxY = Math.max(...centralCoords.map((c) => c.cy + c.r));

      let minCX = cMinX - 32;
      let maxCX = cMaxX + 32;
      if (maxCX - minCX < minKMW) {
        const extra = minKMW - (maxCX - minCX);
        minCX -= extra / 2;
        maxCX += extra / 2;
      }

      for (const [id, c] of coords.entries()) {
        const node = nodeById.get(id);
        if (!node || node.isCentral || c.shape === 'store') continue;
        const halfW = c.shape === 'circle' ? c.r : c.w / 2;
        if (c.cx < cMinX) {
          const safeLeft = c.cx + halfW + 16;
          if (minCX < safeLeft) minCX = safeLeft;
        } else if (c.cx > cMaxX) {
          const safeRight = c.cx - halfW - 16;
          if (maxCX > safeRight) maxCX = safeRight;
        }
      }

      minCX = Math.min(minCX, cMinX - 16);
      maxCX = Math.max(maxCX, cMaxX + 16);

      const hasTopStores = !isVerticalSpine && (dfd.stores || []).length > 0;
      const storeLaneBottom = hasTopStores ? 52 + 23 + 22 : -Infinity;
      let minCY = cMinY - 48;
      if (minCY < storeLaneBottom) minCY = storeLaneBottom;
      const maxCY = cMaxY + 30;

      const badgeY = minCY - kmTitleH / 2;
      let badgeX = (minCX + maxCX) / 2 - kmTitleW / 2;
      if (maxCX - minCX >= kmTitleW + 64) {
        badgeX = minCX + 28;
      }

      kmFrame = {
        minCX,
        maxCX,
        minCY,
        maxCY,
        title: kmTitle,
        titleW: kmTitleW,
        titleH: kmTitleH,
        badgeX,
        badgeY
      };
    }

    // Build curved flow paths & horizontal textbook halo labels
    const pairSet = new Set(renderFlows.map((f) => `${f.from}->${f.to}`));
    const flowRenderData = [];

    for (const f of renderFlows) {
      const cFrom = coords.get(f.from);
      const cTo = coords.get(f.to);
      if (!cFrom || !cTo) continue;

      const isBidir = pairSet.has(`${f.to}->${f.from}`);
      const dx = cTo.cx - cFrom.cx;
      const dy = cTo.cy - cFrom.cy;
      const dist = Math.hypot(dx, dy) || 1;
      const rawText = (f.data || []).map(formatDFDFlowItem).join(', ');
      const lines = splitTextIntoLines(rawText, isVerticalSpine ? 25 : 22);

      let ctrlX = (cFrom.cx + cTo.cx) / 2;
      let ctrlY = (cFrom.cy + cTo.cy) / 2;
      let labelHintSide = -1; // -1 = above curve, +1 = below curve

      if (isVerticalSpine) {
        if (isBidir) {
          // Left->Right arches UPWARD (ctrlY < midY), Right->Left arches DOWNWARD (ctrlY > midY)
          // For vertical bidir (dx ~ 0), arch Left vs Right
          if (Math.abs(dx) < 40) {
            const bulgeX = dy > 0 ? 54 : -54;
            ctrlX += bulgeX;
          } else {
            const bulgeMag = Math.max(46, lines.length * 10 + 30);
            const archUp = dx > 0;
            ctrlY += archUp ? -bulgeMag : bulgeMag;
            labelHintSide = archUp ? -1 : 1;
          }
        } else if (Math.abs(dx) < 40) {
          // Vertical process-to-process flow along central spine
          const minCy = Math.min(cFrom.cy, cTo.cy);
          const maxCy = Math.max(cFrom.cy, cTo.cy);
          let hasIntervening = false;
          for (const [nid, node] of coords.entries()) {
            if (nid === f.from || nid === f.to) continue;
            if (Math.abs(node.cx - cFrom.cx) < 48 && node.cy > minCy + 20 && node.cy < maxCy - 20) {
              hasIntervening = true;
              break;
            }
          }
          if (hasIntervening) {
            ctrlX += dy > 0 ? 115 : -115;
          }
        } else {
          // Gentle natural arc away from vertical center of process band
          const gentle = dy < -20 ? -22 : (dy > 20 ? 22 : -14);
          ctrlY += gentle;
          labelHintSide = gentle <= 0 ? -1 : 1;
        }
      } else {
        // Horizontal layout curve computation
        let nx = -dy / dist;
        let ny = dx / dist;
        let curveOff = 0;

        if (isBidir) {
          curveOff = 38;
        } else if (Math.abs(dx) < 36) {
          const minCy = Math.min(cFrom.cy, cTo.cy);
          const maxCy = Math.max(cFrom.cy, cTo.cy);
          let hasIntervening = false;
          for (const [nid, node] of coords.entries()) {
            if (nid === f.from || nid === f.to) continue;
            if (Math.abs(node.cx - cFrom.cx) < 36 && node.cy > minCy + 20 && node.cy < maxCy - 20) {
              hasIntervening = true;
              break;
            }
          }
          nx = 1;
          ny = 0;
          if (hasIntervening) curveOff = 104;
          else if (cFrom.shape === 'store' || cTo.shape === 'store') curveOff = 48;
          else if (maxCy - minCy > 105) curveOff = 32;
        } else if (Math.abs(dx) > 260) {
          const minXSpan = Math.min(cFrom.cx, cTo.cx);
          const maxXSpan = Math.max(cFrom.cx, cTo.cx);
          const interNodes = [];
          for (const [nid, node] of coords.entries()) {
            if (nid === f.from || nid === f.to) continue;
            if (node.cx > minXSpan + 24 && node.cx < maxXSpan - 24) interNodes.push(node);
          }
          const candidateOffsets = [-32, 32, -80, 80, -125, 125, -165, 165];
          let chosenOff = -32;
          for (const off of candidateOffsets) {
            const testCtrlX = (cFrom.cx + cTo.cx) / 2 + nx * off;
            const testCtrlY = (cFrom.cy + cTo.cy) / 2 + ny * off;
            const pS = boundaryPoint(cFrom, testCtrlX, testCtrlY);
            const pE = boundaryPoint(cTo, testCtrlX, testCtrlY);
            let clean = true;
            for (const node of interNodes) {
              if (Math.abs(pE.x - pS.x) < 1) continue;
              const t = (node.cx - pS.x) / (pE.x - pS.x);
              if (t <= 0.05 || t >= 0.95) continue;
              const u = 1 - t;
              const cyAtNode = u * u * pS.y + 2 * u * t * testCtrlY + t * t * pE.y;
              const safeR = (node.shape === 'circle' ? node.r : node.h / 2) + 18;
              if (Math.abs(cyAtNode - node.cy) < safeR) {
                clean = false;
                break;
              }
            }
            if (clean) {
              chosenOff = off;
              break;
            }
          }
          curveOff = chosenOff;
        }

        ctrlX = (cFrom.cx + cTo.cx) / 2 + nx * curveOff;
        ctrlY = (cFrom.cy + cTo.cy) / 2 + ny * curveOff;
      }

      const pStart = boundaryPoint(cFrom, ctrlX, ctrlY);
      const pEnd = boundaryPoint(cTo, ctrlX, ctrlY);

      flowRenderData.push({
        flow: f,
        rawText,
        lines,
        cFrom,
        cTo,
        ctrlX,
        ctrlY,
        pStart,
        pEnd,
        isBidir,
        labelHintSide
      });
    }

    // Place ALL flow labels horizontally (0 deg rotation) with anti-overlap search
    const placedPills = [];
    const flowLabelParts = [];
    const fontSize = 12.5;
    const lineSpacing = fontSize + 4;

    function pillHitsObstacle(pt, pillW, pillH) {
      const pLeft = pt.x - pillW / 2;
      const pRight = pt.x + pillW / 2;
      const pTop = pt.y - pillH / 2;
      const pBottom = pt.y + pillH / 2;

      for (const c of coords.values()) {
        const nW = c.shape === 'circle' ? c.r * 2 : c.w;
        const nH = c.shape === 'circle' ? c.r * 2 : c.h;
        if (pRight > c.cx - nW / 2 - 5 && pLeft < c.cx + nW / 2 + 5 &&
            pBottom > c.cy - nH / 2 - 5 && pTop < c.cy + nH / 2 + 5) {
          return true;
        }
      }

      if (kmFrame) {
        const fm = 6;
        if (pRight > kmFrame.minCX - fm && pLeft < kmFrame.maxCX + fm &&
            Math.abs(pt.y - kmFrame.minCY) < pillH / 2 + fm) return true;
        if (pRight > kmFrame.minCX - fm && pLeft < kmFrame.maxCX + fm &&
            Math.abs(pt.y - kmFrame.maxCY) < pillH / 2 + fm) return true;
        if (pBottom > kmFrame.minCY - fm && pTop < kmFrame.maxCY + fm &&
            Math.abs(pt.x - kmFrame.minCX) < pillW / 2 + fm) return true;
        if (pBottom > kmFrame.minCY - fm && pTop < kmFrame.maxCY + fm &&
            Math.abs(pt.x - kmFrame.maxCX) < pillW / 2 + fm) return true;
        if (pRight > kmFrame.badgeX - 6 && pLeft < kmFrame.badgeX + kmFrame.titleW + 6 &&
            pBottom > kmFrame.badgeY - 6 && pTop < kmFrame.badgeY + kmFrame.titleH + 6) return true;
      }

      for (const placed of placedPills) {
        if (pRight > placed.left - 3 && pLeft < placed.right + 3 &&
            pBottom > placed.top - 3 && pTop < placed.bottom + 3) {
          return true;
        }
      }
      return false;
    }

    for (const fr of flowRenderData) {
      const lines = fr.lines;
      const maxLen = Math.max(...lines.map((l) => l.length), 1);
      const pillW = Math.max(24, maxLen * (fontSize * 0.65) + 12);
      const pillH = lines.length > 1 ? lines.length * lineSpacing + 6 : fontSize + 8;

      const isMostlyVertical = Math.abs(fr.pEnd.x - fr.pStart.x) < 42;

      const getCandidate = (t, side) => {
        const u = 1 - t;
        const curveX = u * u * fr.pStart.x + 2 * u * t * fr.ctrlX + t * t * fr.pEnd.x;
        const curveY = u * u * fr.pStart.y + 2 * u * t * fr.ctrlY + t * t * fr.pEnd.y;

        if (isVerticalSpine && isMostlyVertical && side === 0) {
          // Clean centered halo right over vertical inter-process arrow (like Screenshot 2 P1.3 -> P1.4)
          return { x: curveX, y: curveY };
        }

        const tx = 2 * (1 - t) * (fr.ctrlX - fr.pStart.x) + 2 * t * (fr.pEnd.x - fr.ctrlX);
        const ty = 2 * (1 - t) * (fr.ctrlY - fr.pStart.y) + 2 * t * (fr.pEnd.y - fr.ctrlY);
        const tDist = Math.hypot(tx, ty) || 1;
        let pnx = -ty / tDist;
        let pny = tx / tDist;

        // Orient normal toward convex/outer side of curve
        const midX = (fr.pStart.x + fr.pEnd.x) / 2;
        const midY = (fr.pStart.y + fr.pEnd.y) / 2;
        const bulgeX = fr.ctrlX - midX;
        const bulgeY = fr.ctrlY - midY;
        if (Math.hypot(bulgeX, bulgeY) > 3) {
          if (bulgeX * pnx + bulgeY * pny < 0) {
            pnx = -pnx;
            pny = -pny;
          }
        } else if (pny > 0) {
          pnx = -pnx;
          pny = -pny;
        }

        const offsetDist = (Math.abs(pny) * (pillH / 2) + Math.abs(pnx) * (pillW / 2) * 0.35 + 6) * side;
        return {
          x: curveX + pnx * offsetDist,
          y: curveY + pny * offsetDist
        };
      };

      const tSteps = fr.isBidir
        ? (isVerticalSpine ? [0.48, 0.42, 0.54, 0.36, 0.60] : [0.38, 0.44, 0.32, 0.50, 0.58])
        : [0.50, 0.44, 0.56, 0.38, 0.62];

      const sideOrder = (isVerticalSpine && isMostlyVertical && !fr.isBidir)
        ? [0, 1, -1]
        : [1, -1, 0];

      let bestPt = null;
      for (const side of sideOrder) {
        for (const t of tSteps) {
          const cand = getCandidate(t, side);
          if (!pillHitsObstacle(cand, pillW, pillH)) {
            bestPt = cand;
            break;
          }
        }
        if (bestPt) break;
      }

      if (!bestPt) {
        const baseCand = getCandidate(fr.isBidir && !isVerticalSpine ? 0.38 : 0.50, sideOrder[0]);
        for (const dyOff of [-16, 16, -32, 32, -48, 48, -64, 64]) {
          for (const dxOff of [0, -24, 24]) {
            const nudged = { x: baseCand.x + dxOff, y: baseCand.y + dyOff };
            if (!pillHitsObstacle(nudged, pillW, pillH)) {
              bestPt = nudged;
              break;
            }
          }
          if (bestPt) break;
        }
        if (!bestPt) bestPt = baseCand;
      }

      const rendered = renderPillLabelWithBounds(bestPt.x, bestPt.y, fr.rawText, pal, 'middle', fontSize, lines, 0, true);
      placedPills.push(rendered.bounds);
      flowLabelParts.push(rendered.svg);
    }

    // Tight, exact bounding box (fixes old minX=0 / maxX=680 whitespace bug!)
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const c of coords.values()) {
      const halfW = c.shape === 'circle' ? c.r : c.w / 2;
      const halfH = c.shape === 'circle' ? c.r : c.h / 2;
      minX = Math.min(minX, c.cx - halfW);
      minY = Math.min(minY, c.cy - halfH);
      maxX = Math.max(maxX, c.cx + halfW);
      maxY = Math.max(maxY, c.cy + halfH);
    }

    if (kmFrame) {
      minX = Math.min(minX, kmFrame.minCX, kmFrame.badgeX);
      minY = Math.min(minY, kmFrame.minCY, kmFrame.badgeY);
      maxX = Math.max(maxX, kmFrame.maxCX, kmFrame.badgeX + kmFrame.titleW);
      maxY = Math.max(maxY, kmFrame.maxCY);
    }

    for (const fr of flowRenderData) {
      // Quadratic bezier extrema lie within convex hull, tighter using t=0.5 apex
      const apexX = 0.25 * fr.pStart.x + 0.5 * fr.ctrlX + 0.25 * fr.pEnd.x;
      const apexY = 0.25 * fr.pStart.y + 0.5 * fr.ctrlY + 0.25 * fr.pEnd.y;
      minX = Math.min(minX, fr.pStart.x, fr.pEnd.x, apexX);
      minY = Math.min(minY, fr.pStart.y, fr.pEnd.y, apexY);
      maxX = Math.max(maxX, fr.pStart.x, fr.pEnd.x, apexX);
      maxY = Math.max(maxY, fr.pStart.y, fr.pEnd.y, apexY);
    }

    for (const pill of placedPills) {
      minX = Math.min(minX, pill.left);
      minY = Math.min(minY, pill.top);
      maxX = Math.max(maxX, pill.right);
      maxY = Math.max(maxY, pill.bottom);
    }

    const padX = options.paddingX || options.padding || (options.tightCrop ? 20 : 32);
    const padY = options.paddingY || options.padding || (options.tightCrop ? 18 : 26);
    const legendH = showLegend ? 48 : 8;
    const vp = computeCanvasViewport(minX, minY, maxX, maxY, padX, padY, legendH, options);

    const svgParts = [];
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vp.viewMinX} ${vp.viewMinY} ${vp.viewW} ${vp.viewH}" width="${vp.svgW}" height="${vp.svgH}" style="font-family:${escXml(pal.font)}">`,
      `<defs>`,
      `  <marker id="dfd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">`,
      `    <path d="M 0 1.5 L 8.8 5 L 0 8.5 z" fill="${pal.edge}" />`,
      `  </marker>`,
      `</defs>`,
      `<rect x="${vp.viewMinX}" y="${vp.viewMinY}" width="${vp.viewW}" height="${vp.viewH}" fill="${pal.bg}" />`
    );

    if (kmFrame) {
      svgParts.push(
        `<rect x="${kmFrame.minCX.toFixed(1)}" y="${kmFrame.minCY.toFixed(1)}" width="${(kmFrame.maxCX - kmFrame.minCX).toFixed(1)}" height="${(kmFrame.maxCY - kmFrame.minCY).toFixed(1)}" rx="12" fill="${pal.kmBg}" stroke="${pal.kmStroke}" stroke-width="1.4" stroke-dasharray="6 4" />`,
        `<rect x="${kmFrame.badgeX.toFixed(1)}" y="${kmFrame.badgeY.toFixed(1)}" width="${kmFrame.titleW.toFixed(1)}" height="${kmFrame.titleH.toFixed(1)}" rx="4" fill="${pal.labelBg}" fill-opacity="0.96" stroke="${pal.kmStroke}" stroke-width="0.8" />`,
        `<text x="${(kmFrame.badgeX + kmFrame.titleW / 2).toFixed(1)}" y="${(kmFrame.badgeY + kmFrame.titleH / 2 + 3.5).toFixed(1)}" text-anchor="middle" fill="${pal.kmStroke}" font-size="11.5" font-weight="700">${escXml(kmFrame.title)}</text>`
      );
    }

    for (const fr of flowRenderData) {
      svgParts.push(
        `<path d="M ${fr.pStart.x.toFixed(1)} ${fr.pStart.y.toFixed(1)} Q ${fr.ctrlX.toFixed(1)} ${fr.ctrlY.toFixed(1)}, ${fr.pEnd.x.toFixed(1)} ${fr.pEnd.y.toFixed(1)}" fill="none" stroke="${pal.edge}" stroke-width="1.75" marker-end="url(#dfd-arrow)" />`
      );
    }

    for (const n of renderNodes) {
      const c = coords.get(n.id);
      if (!c) continue;
      if (c.shape === 'circle') {
        const isC = showKM && n.isCentral;
        const stroke = isC ? pal.rootStroke : pal.ctrlStroke;
        const fill = isC ? pal.rootFill : pal.ctrlFill;
        const lines = c.lines || [n.label];
        const fSize = lines.length > 3 ? 12 : (lines.length >= 2 ? 13 : 14);
        svgParts.push(
          `<g class="dfd-node" data-node-id="${escXml(n.id)}" data-x="${c.cx.toFixed(1)}" data-y="${c.cy.toFixed(1)}" style="cursor: grab;">`,
          `  <circle cx="${c.cx.toFixed(1)}" cy="${c.cy.toFixed(1)}" r="${c.r}" fill="${fill}" stroke="${stroke}" stroke-width="${isC ? 2.4 : 1.9}" />`,
          renderMultilineText(lines, c.cx, c.cy, { fontSize: fSize, fontWeight: '700', fill: pal.ink }),
          `</g>`
        );
      } else if (c.shape === 'store') {
        const x1 = c.cx - c.w / 2;
        const x2 = c.cx + c.w / 2;
        const y1 = c.cy - c.h / 2;
        const y2 = c.cy + c.h / 2;
        const lines = c.lines || [n.label];
        const fSize = lines.length > 1 ? 12.5 : 13.5;
        svgParts.push(
          `<g class="dfd-store" data-node-id="${escXml(n.id)}" data-x="${c.cx.toFixed(1)}" data-y="${c.cy.toFixed(1)}" style="cursor: grab;">`,
          `  <rect x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${c.w.toFixed(1)}" height="${c.h.toFixed(1)}" fill="${pal.storeFill}" stroke="none" />`,
          `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${pal.storeStroke}" stroke-width="2" />`,
          `  <line x1="${x1.toFixed(1)}" y1="${y2.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${pal.storeStroke}" stroke-width="2" />`,
          renderMultilineText(lines, c.cx, c.cy, { fontSize: fSize, fontWeight: '600', fill: pal.ink }),
          `</g>`
        );
      } else {
        const x = c.cx - c.w / 2;
        const y = c.cy - c.h / 2;
        const dash = n.type === 'unknown_io' ? ' stroke-dasharray="5 3"' : '';
        const lines = c.lines || [n.label];
        const fSize = lines.length > 1 ? 12.5 : 13.5;
        svgParts.push(
          `<g class="dfd-entity" data-node-id="${escXml(n.id)}" data-x="${c.cx.toFixed(1)}" data-y="${c.cy.toFixed(1)}" style="cursor: grab;">`,
          `  <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${c.w.toFixed(1)}" height="${c.h.toFixed(1)}" rx="2" fill="${pal.ioFill}" stroke="${pal.ioStroke}" stroke-width="1.8"${dash} />`,
          renderMultilineText(lines, c.cx, c.cy, { fontSize: fSize, fontWeight: '600', fill: pal.ink }),
          `</g>`
        );
      }
    }

    svgParts.push(...flowLabelParts);

    if (showLegend) {
      const ly = maxY + 32;
      const startX = minX;
      const legendParts = [
        `  <circle cx="${startX + 8}" cy="${ly - 2}" r="9" fill="${pal.ctrlFill}" stroke="${pal.ctrlStroke}" stroke-width="1.6" />`,
        `  <text x="${startX + 24}" y="${ly + 2}">Μετασχηματισμός</text>`
      ];
      let curX = startX + 150;
      if (dfd.stores && dfd.stores.length > 0) {
        legendParts.push(
          `  <line x1="${curX}" y1="${ly - 9}" x2="${curX + 32}" y2="${ly - 9}" stroke="${pal.storeStroke}" stroke-width="1.8" />`,
          `  <line x1="${curX}" y1="${ly + 5}" x2="${curX + 32}" y2="${ly + 5}" stroke="${pal.storeStroke}" stroke-width="1.8" />`,
          `  <text x="${curX + 40}" y="${ly + 2}">Αποθήκη Δεδομένων</text>`
        );
        curX += 182;
      }
      legendParts.push(
        `  <rect x="${curX}" y="${ly - 10}" width="26" height="16" rx="2" fill="${pal.ioFill}" stroke="${pal.ioStroke}" stroke-width="1.6" />`,
        `  <text x="${curX + 34}" y="${ly + 2}">Πηγή / Αποδέκτης</text>`
      );
      curX += 140;
      if (kmFrame) {
        legendParts.push(
          `  <rect x="${curX}" y="${ly - 9}" width="26" height="14" rx="3" fill="none" stroke="${pal.kmStroke}" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `  <text x="${curX + 34}" y="${ly + 2}">Περίγραμμα ΚΜ</text>`
        );
      }
      svgParts.push(
        `<g class="dfd-legend" font-size="11.5" fill="${pal.muted}">`,
        ...legendParts,
        `</g>`
      );
    }

    svgParts.push('</svg>');
    return svgParts.join('\n');
  }

  // ---------------------------------------------------------------------------
  // 3. STANDALONE SVG & WORD-READY 300+ DPI PNG EXPORT HELPERS
  // ---------------------------------------------------------------------------
  const CRC32_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[i] = c >>> 0;
    }
    return t;
  }());

  function crc32Bytes(bytes, start, end) {
    let c = 0xFFFFFFFF;
    for (let i = start; i < end; i++) {
      c = CRC32_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // Injects PNG pHYs chunk so MS Word pastes/imports the PNG at full crisp A4 width (~15.8cm)
  function injectPngPhysDpi(pngBytes, dpi) {
    if (!pngBytes || pngBytes.length < 33) return pngBytes;
    // Verify PNG signature
    if (pngBytes[0] !== 0x89 || pngBytes[1] !== 0x50 || pngBytes[2] !== 0x4E || pngBytes[3] !== 0x47) {
      return pngBytes;
    }
    const ppm = Math.max(2835, Math.round(dpi / 0.0254)); // pixels per meter
    const physChunk = new Uint8Array(21);
    const dv = new DataView(physChunk.buffer);
    dv.setUint32(0, 9, false); // length = 9
    // 'pHYs'
    physChunk[4] = 0x70;
    physChunk[5] = 0x48;
    physChunk[6] = 0x59;
    physChunk[7] = 0x73;
    dv.setUint32(8, ppm, false);  // X pixels per unit
    dv.setUint32(12, ppm, false); // Y pixels per unit
    physChunk[16] = 1;            // unit = meter
    const crc = crc32Bytes(physChunk, 4, 17);
    dv.setUint32(17, crc, false);

    // Strip any existing pHYs chunk to avoid duplicates, insert right after IHDR (offset 33)
    const ihdrEnd = 8 + 4 + 4 + new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength).getUint32(8, false) + 4;
    const out = new Uint8Array(pngBytes.length + 21);
    out.set(pngBytes.subarray(0, ihdrEnd), 0);
    out.set(physChunk, ihdrEnd);
    out.set(pngBytes.subarray(ihdrEnd), ihdrEnd + 21);
    return out;
  }

  function computeWordTargetDpi(pixelWidth) {
    // Target ~15.8 cm (6.22 inches) physical width in MS Word A4 document
    const targetInches = 6.22;
    return Math.max(220, Math.round(pixelWidth / targetInches));
  }

  function addDpiToPngBlob(blob, pixelWidth) {
    if (!blob || typeof blob.arrayBuffer !== 'function') return Promise.resolve(blob);
    const dpi = computeWordTargetDpi(pixelWidth);
    return blob.arrayBuffer().then((buf) => {
      const updated = injectPngPhysDpi(new Uint8Array(buf), dpi);
      return new Blob([updated], { type: 'image/png' });
    }).catch(() => blob);
  }

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
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function renderSVGToCanvas(svgStringOrEl, scale = 3) {
    return new Promise((resolve, reject) => {
      try {
        let svgText = '';
        if (typeof svgStringOrEl === 'string') {
          svgText = svgStringOrEl;
        } else if (svgStringOrEl && svgStringOrEl.nodeType) {
          const serializer = new XMLSerializer();
          svgText = serializer.serializeToString(svgStringOrEl);
        } else {
          return reject(new Error('Invalid SVG input for PNG export'));
        }

        if (!svgText.includes('xmlns="http://www.w3.org/2000/svg"')) {
          svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (svgText.includes('xlink:href') && !svgText.includes('xmlns:xlink=')) {
          svgText = svgText.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        let w = 800;
        let h = 450;
        const wMatch = svgText.match(/<svg[^>]*\bwidth=["']([0-9.]+)(?:px)?["']/i);
        const hMatch = svgText.match(/<svg[^>]*\bheight=["']([0-9.]+)(?:px)?["']/i);
        if (wMatch && parseFloat(wMatch[1]) > 0) w = parseFloat(wMatch[1]);
        if (hMatch && parseFloat(hMatch[1]) > 0) h = parseFloat(hMatch[1]);

        if (w === 800 && h === 450) {
          const vbMatch = svgText.match(/<svg[^>]*\bviewBox=["']([0-9.\s,-]+)["']/i);
          if (vbMatch) {
            const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              w = parts[2];
              h = parts[3];
            }
          }
        }

        if (!wMatch || !hMatch) {
          svgText = svgText.replace(/<svg\b([^>]*?)(\bwidth=["'][^"']*["'])?([^>]*?)(\bheight=["'][^"']*["'])?([^>]*)>/i, (m, p1, p2, p3, p4, p5) => {
            const clean = (p1 + ' ' + (p3 || '') + ' ' + (p5 || '')).replace(/\s+/g, ' ').trim();
            return `<svg ${clean} width="${w}" height="${h}">`;
          });
        }

        const encodedData = unescape(encodeURIComponent(svgText));
        const base64Uri = 'data:image/svg+xml;base64,' + btoa(encodedData);

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            const actualW = img.naturalWidth || w;
            const actualH = img.naturalHeight || h;
            // Cap max canvas side at 4800px for universal browser safety while guaranteeing >=2400px HiDPI width
            const maxDim = Math.max(actualW, actualH);
            const effectiveScale = Math.min(scale, 4800 / Math.max(1, maxDim));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(actualW * effectiveScale);
            canvas.height = Math.round(actualH * effectiveScale);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              return reject(new Error('Canvas 2D context not available'));
            }

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.scale(effectiveScale, effectiveScale);
            ctx.drawImage(img, 0, 0, actualW, actualH);
            resolve(canvas);
          } catch (canvasErr) {
            reject(canvasErr);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to rasterize SVG into image'));
        };

        img.src = base64Uri;
      } catch (err) {
        reject(err);
      }
    });
  }

  function downloadPNG(svgStringOrEl, filename = 'diagram.png', scale = 3) {
    return renderSVGToCanvas(svgStringOrEl, scale).then((canvas) => {
      return new Promise((resolve, reject) => {
        try {
          function executeDownload(downloadUrl) {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              a.remove();
              if (downloadUrl.startsWith('blob:')) URL.revokeObjectURL(downloadUrl);
            }, 60000);
            resolve();
          }

          if (canvas.toBlob) {
            canvas.toBlob((blob) => {
              if (blob) {
                addDpiToPngBlob(blob, canvas.width).then((hiDpiBlob) => {
                  executeDownload(URL.createObjectURL(hiDpiBlob));
                });
              } else {
                executeDownload(canvas.toDataURL('image/png'));
              }
            }, 'image/png');
          } else {
            executeDownload(canvas.toDataURL('image/png'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  function copyPNGToClipboard(svgStringOrEl, scale = 3) {
    return renderSVGToCanvas(svgStringOrEl, scale).then((canvas) => {
      return new Promise((resolve, reject) => {
        try {
          if (!canvas.toBlob) {
            return reject(new Error('Canvas toBlob not supported'));
          }
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed to create PNG blob'));
            addDpiToPngBlob(blob, canvas.width).then((hiDpiBlob) => {
              if (navigator.clipboard && window.ClipboardItem) {
                navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': hiDpiBlob })
                ]).then(resolve).catch(reject);
              } else {
                reject(new Error('Clipboard API not available'));
              }
            });
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  return {
    renderDDPSVG,
    renderDFDSVG,
    splitTextIntoLines,
    renderMultilineText,
    injectPngPhysDpi,
    serializeStandaloneSVG,
    downloadSVG,
    downloadPNG,
    copyPNGToClipboard
  };
}));
