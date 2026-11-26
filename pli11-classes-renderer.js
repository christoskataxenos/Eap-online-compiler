// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 Class Diagram SVG Renderer & Export (SVG / 2x PNG)
// Supports UML/EAP notation: 3-compartment & 2-compartment boxes,
// grouped inheritance triangle bus (◁), aggregation (◇), composition (◆),
// dependency (..>), association names & multiplicities, association classes,
// drag-override positions, Word print mode (Α/Μ), and HiDPI PNG export.
// UMD module: Browser window.PLI11ClassesRenderer / Node
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PLI11ClassesRenderer = factory();
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
        muted: '#374151',
        edge: '#111827',
        boxFill: '#ffffff',
        boxHeaderFill: '#f3f4f6',
        boxStroke: '#111827',
        implicitStroke: '#6b7280',
        labelBg: '#ffffff',
        labelBorder: '#d1d5db',
        selectedStroke: '#2563eb',
        font: '"Segoe UI", Arial, sans-serif'
      };
    }

    if (options.theme === 'dark') {
      return {
        bg: '#0b0c15',
        ink: '#e0e6ed',
        muted: '#94a3b8',
        edge: '#cbd5e1',
        boxFill: '#121524',
        boxHeaderFill: '#182438',
        boxStroke: '#38bdf8',
        implicitStroke: '#f59e0b',
        labelBg: '#121524',
        labelBorder: '#2d3148',
        selectedStroke: '#ffee00',
        font: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      };
    }

    // Light mode (Solarized-inspired palette)
    return {
      bg: '#fdf6e3',
      ink: '#073642',
      muted: '#586e75',
      edge: '#334155',
      boxFill: '#fffdf7',
      boxHeaderFill: '#eaf2f8',
      boxStroke: '#268bd2',
      implicitStroke: '#b58900',
      labelBg: '#fdf6e3',
      labelBorder: '#d3cbb7',
      selectedStroke: '#dc322f',
      font: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    };
  }

  function formatAttrDisplay(attr, options) {
    const vis = !options.hideVisibilities && attr.visibility ? `${attr.visibility} ` : '';
    const typ = !options.hideTypes && attr.type ? `: ${attr.type}` : '';
    return `${vis}${attr.name}${typ}`;
  }

  function formatMethodDisplay(m, options) {
    const vis = !options.hideVisibilities && m.visibility ? `${m.visibility} ` : '';
    const ret = !options.hideTypes && m.returnType ? `: ${m.returnType}` : '';
    return `${vis}${m.name}(${m.params || ''})${ret}`;
  }

  function measureClassBox(cls, options = {}) {
    const headerLines = [cls.name || 'Κλάση'];
    const attrLines = (cls.attributes || []).map((a) => formatAttrDisplay(a, options));
    const methodLines = options.hideMethods ? [] : (cls.methods || []).map((m) => formatMethodDisplay(m, options));

    const maxHeaderLen = headerLines.reduce((mx, s) => Math.max(mx, s.length), 0);
    const maxMemberLen = [...attrLines, ...methodLines].reduce((mx, s) => Math.max(mx, s.length), 0);

    const charWHeader = 8.4;
    const charWMember = 7.3;
    const w = Math.max(178, Math.min(340, Math.max(maxHeaderLen * charWHeader + 30, maxMemberLen * charWMember + 26)));

    const headerH = 34;
    const lineH = 18;
    const padY = 10;

    const attrH = attrLines.length > 0
      ? attrLines.length * lineH + padY * 2
      : (options.hideMethods && methodLines.length === 0 ? 16 : 20);

    let methodH = 0;
    if (!options.hideMethods) {
      methodH = methodLines.length > 0 ? methodLines.length * lineH + padY * 2 : 18;
    }

    return {
      cls,
      w: Math.round(w),
      h: Math.round(headerH + attrH + methodH),
      headerH,
      attrH,
      methodH,
      attrLines,
      methodLines
    };
  }

  function canonicalKey(name) {
    return String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u03C2/g, '\u03A3')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function computeClassLayout(model, options = {}) {
    const classes = (model && model.classes) || [];
    const relations = (model && model.relations) || [];
    const customPositions = options.positions || {};

    const metricsById = new Map();
    const idByKey = new Map();
    for (const cls of classes) {
      metricsById.set(cls.id, measureClassBox(cls, options));
      idByKey.set(canonicalKey(cls.name), cls.id);
    }

    if (classes.length === 0) {
      return { boxes: new Map(), width: 420, height: 220, minX: 0, minY: 0 };
    }

    // Build inheritance forest (parent -> children) without cycles
    const childrenOf = new Map();
    const parentOf = new Map();
    for (const c of classes) childrenOf.set(c.id, []);

    for (const rel of relations) {
      if (rel.kind !== 'inheritance') continue;
      const childId = rel.fromId || idByKey.get(canonicalKey(rel.from));
      const parId = rel.toId || idByKey.get(canonicalKey(rel.to));
      if (!childId || !parId || childId === parId) continue;
      if (!parentOf.has(childId)) {
        // Guard against cycles
        let ancestor = parId;
        let createsCycle = false;
        const seen = new Set([childId]);
        while (ancestor) {
          if (seen.has(ancestor)) {
            createsCycle = true;
            break;
          }
          seen.add(ancestor);
          ancestor = parentOf.get(ancestor);
        }
        if (!createsCycle) {
          parentOf.set(childId, parId);
          childrenOf.get(parId).push(childId);
        }
      }
    }

    // Identify association classes so we can anchor them neatly under their association
    const assocClassToRel = new Map();
    for (const rel of relations) {
      if (rel.assocClass) {
        const aid = rel.assocClassId || idByKey.get(canonicalKey(rel.assocClass));
        if (aid && aid !== rel.fromId && aid !== rel.toId && !parentOf.has(aid) && (childrenOf.get(aid) || []).length === 0) {
          assocClassToRel.set(aid, rel);
        }
      }
    }

    const H_GAP = 54;
    const V_GAP = 66;
    const CLUSTER_H_GAP = 105;
    const CLUSTER_V_GAP = 95;

    // Roots are top-level clusters (neither inheritance children nor standalone assocClasses)
    const rootIds = classes
      .map((c) => c.id)
      .filter((id) => !parentOf.has(id) && !assocClassToRel.has(id));

    // Compute subtree dimensions for each inheritance tree
    const subtreeDim = new Map();
    function calcSubtree(nodeId) {
      const m = metricsById.get(nodeId);
      const kids = childrenOf.get(nodeId) || [];
      if (kids.length === 0) {
        const d = { w: m.w, h: m.h };
        subtreeDim.set(nodeId, d);
        return d;
      }
      const kidDims = kids.map((k) => calcSubtree(k));
      const kidsTotalW = kidDims.reduce((s, d) => s + d.w, 0) + H_GAP * (kids.length - 1);
      const maxKidH = kidDims.reduce((mx, d) => Math.max(mx, d.h), 0);
      const d = {
        w: Math.max(m.w, kidsTotalW),
        h: m.h + V_GAP + maxKidH
      };
      subtreeDim.set(nodeId, d);
      return d;
    }
    for (const rid of rootIds) calcSubtree(rid);

    // Map any class id -> its top-level cluster root
    const clusterOf = new Map();
    function mapToCluster(nodeId, rootId) {
      clusterOf.set(nodeId, rootId);
      for (const kid of childrenOf.get(nodeId) || []) {
        mapToCluster(kid, rootId);
      }
    }
    for (const rid of rootIds) mapToCluster(rid, rid);

    // Build cluster graph for layering wholes above parts and ordering peers
    const rootSet = new Set(rootIds);
    const wholeEdges = new Map();
    const peerEdges = new Map();
    const inDeg = new Map();
    for (const rid of rootIds) {
      wholeEdges.set(rid, new Set());
      peerEdges.set(rid, new Set());
      inDeg.set(rid, 0);
    }

    for (const rel of relations) {
      if (rel.kind === 'inheritance') continue;
      const cA = clusterOf.get(rel.fromId || idByKey.get(canonicalKey(rel.from)));
      const cB = clusterOf.get(rel.toId || idByKey.get(canonicalKey(rel.to)));
      if (!cA || !cB || cA === cB) continue;

      if (rel.kind === 'aggregation' || rel.kind === 'composition') {
        if (!wholeEdges.get(cA).has(cB)) {
          wholeEdges.get(cA).add(cB);
          inDeg.set(cB, (inDeg.get(cB) || 0) + 1);
        }
      } else {
        peerEdges.get(cA).add(cB);
        peerEdges.get(cB).add(cA);
      }
    }

    // Assign layers via Kahn longest-path over whole->part edges
    const layerOf = new Map();
    const queue = [];
    for (const rid of rootIds) {
      layerOf.set(rid, 0);
      if ((inDeg.get(rid) || 0) === 0) queue.push(rid);
    }

    const remDeg = new Map(inDeg);
    const processed = new Set();
    while (queue.length > 0) {
      const u = queue.shift();
      processed.add(u);
      const uLayer = layerOf.get(u);
      for (const v of wholeEdges.get(u) || []) {
        layerOf.set(v, Math.max(layerOf.get(v) || 0, uLayer + 1));
        remDeg.set(v, (remDeg.get(v) || 1) - 1);
        if (remDeg.get(v) <= 0 && !processed.has(v)) {
          queue.push(v);
        }
      }
    }

    // If model has mostly associations (all at layer 0) and > 3 roots, wrap smoothly into 2-row balanced grid ordered by BFS
    const maxWholeLayer = Math.max(0, ...Array.from(layerOf.values()));
    let rows = [];

    if (maxWholeLayer === 0 && rootIds.length > 3) {
      // BFS order across peerEdges so connected clusters stay adjacent
      const visited = new Set();
      const ordered = [];
      for (const startId of rootIds) {
        if (visited.has(startId)) continue;
        const bfsQ = [startId];
        visited.add(startId);
        while (bfsQ.length > 0) {
          const cur = bfsQ.shift();
          ordered.push(cur);
          const neighbors = new Set([
            ...(peerEdges.get(cur) || []),
            ...(wholeEdges.get(cur) || [])
          ]);
          for (const nb of neighbors) {
            if (!visited.has(nb) && rootSet.has(nb)) {
              visited.add(nb);
              bfsQ.push(nb);
            }
          }
        }
      }
      const perRow = ordered.length <= 4 ? 2 : 3;
      for (let i = 0; i < ordered.length; i += perRow) {
        const chunk = ordered.slice(i, i + perRow);
        // Snake alternate row direction slightly only if beneficial; evaluate crossing count
        rows.push(chunk);
      }
    } else {
      const layerGroups = new Map();
      for (const rid of rootIds) {
        const l = layerOf.get(rid) || 0;
        if (!layerGroups.has(l)) layerGroups.set(l, []);
        layerGroups.get(l).push(rid);
      }
      const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b);
      for (const l of sortedLayers) {
        const items = layerGroups.get(l);
        // Break overly wide rows (> 4 clusters) into sub-rows
        for (let i = 0; i < items.length; i += 4) {
          rows.push(items.slice(i, i + 4));
        }
      }
    }

    // Optimize row ordering to minimize horizontal edge distance (simple sweep)
    const allClusterLinks = [];
    for (const rel of relations) {
      if (rel.kind === 'inheritance') continue;
      const cA = clusterOf.get(rel.fromId || idByKey.get(canonicalKey(rel.from)));
      const cB = clusterOf.get(rel.toId || idByKey.get(canonicalKey(rel.to)));
      if (cA && cB && cA !== cB) allClusterLinks.push([cA, cB]);
    }

    const posSlot = new Map();
    function indexSlots() {
      rows.forEach((row, rIdx) => {
        row.forEach((cid, cIdx) => {
          posSlot.set(cid, { r: rIdx, c: cIdx });
        });
      });
    }
    indexSlots();

    for (let pass = 0; pass < 6; pass++) {
      let improved = false;
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length - 1; c++) {
          const scoreBefore = linkCost();
          const tmp = rows[r][c];
          rows[r][c] = rows[r][c + 1];
          rows[r][c + 1] = tmp;
          indexSlots();
          const scoreAfter = linkCost();
          if (scoreAfter < scoreBefore) {
            improved = true;
          } else {
            rows[r][c + 1] = rows[r][c];
            rows[r][c] = tmp;
            indexSlots();
          }
        }
      }
      if (!improved) break;
    }

    function linkCost() {
      let cost = 0;
      for (const [a, b] of allClusterLinks) {
        const pa = posSlot.get(a);
        const pb = posSlot.get(b);
        if (!pa || !pb) continue;
        cost += Math.abs(pa.c - pb.c) + Math.abs(pa.r - pb.r) * 1.4;
      }
      return cost;
    }

    // Place each row centered and stamp inheritance subtrees recursively
    const boxes = new Map();

    function placeSubtree(nodeId, subtreeLeftX, topY) {
      const m = metricsById.get(nodeId);
      const sd = subtreeDim.get(nodeId);
      const kids = childrenOf.get(nodeId) || [];

      const boxX = Math.round(subtreeLeftX + (sd.w - m.w) / 2);
      const boxY = Math.round(topY);
      boxes.set(nodeId, { ...m, x: boxX, y: boxY });

      if (kids.length === 0) return;

      const kidsTotalW = kids.reduce((s, k) => s + subtreeDim.get(k).w, 0) + H_GAP * (kids.length - 1);
      let cursorX = subtreeLeftX + (sd.w - kidsTotalW) / 2;
      const childTopY = boxY + m.h + V_GAP;

      for (const kidId of kids) {
        const kd = subtreeDim.get(kidId);
        placeSubtree(kidId, cursorX, childTopY);
        cursorX += kd.w + H_GAP;
      }
    }

    const rowWidths = rows.map((row) =>
      row.reduce((s, cid) => s + subtreeDim.get(cid).w, 0) + CLUSTER_H_GAP * Math.max(0, row.length - 1)
    );
    const maxRowW = Math.max(400, ...rowWidths);

    let cursorY = 48;
    rows.forEach((row, rIdx) => {
      const rw = rowWidths[rIdx];
      let cursorX = 56 + (maxRowW - rw) / 2;
      let maxRowH = 0;
      for (const cid of row) {
        const sd = subtreeDim.get(cid);
        placeSubtree(cid, cursorX, cursorY);
        cursorX += sd.w + CLUSTER_H_GAP;
        maxRowH = Math.max(maxRowH, sd.h);
      }
      cursorY += maxRowH + CLUSTER_V_GAP;
    });

    // Place association classes directly below the midpoint of their parent association
    for (const [aid, rel] of assocClassToRel.entries()) {
      const m = metricsById.get(aid);
      const b1 = boxes.get(rel.fromId || idByKey.get(canonicalKey(rel.from)));
      const b2 = boxes.get(rel.toId || idByKey.get(canonicalKey(rel.to)));
      if (b1 && b2) {
        const midX = (b1.x + b1.w / 2 + b2.x + b2.w / 2) / 2;
        const baseY = Math.max(b1.y + b1.h, b2.y + b2.h) + 74;
        boxes.set(aid, { ...m, x: Math.round(midX - m.w / 2), y: Math.round(baseY) });
      } else {
        boxes.set(aid, { ...m, x: 56, y: Math.round(cursorY) });
        cursorY += m.h + 60;
      }
    }

    // Resolve any rare bounding-box overlaps (e.g. association class colliding with another row)
    const boxList = Array.from(boxes.values());
    for (let iter = 0; iter < 8; iter++) {
      let moved = false;
      for (let i = 0; i < boxList.length; i++) {
        for (let j = i + 1; j < boxList.length; j++) {
          const a = boxList[i];
          const b = boxList[j];
          const pad = 28;
          if (
            a.x < b.x + b.w + pad &&
            a.x + a.w + pad > b.x &&
            a.y < b.y + b.h + pad &&
            a.y + a.h + pad > b.y
          ) {
            b.y = a.y + a.h + pad + 12;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    // Apply user custom drag positions if present
    for (const [cid, box] of boxes.entries()) {
      const ov = customPositions[cid];
      if (ov && typeof ov.x === 'number' && typeof ov.y === 'number') {
        box.x = Math.round(ov.x);
        box.y = Math.round(ov.y);
      }
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const box of boxes.values()) {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.w);
      maxY = Math.max(maxY, box.y + box.h);
    }

    const padX = options.tightCrop ? 36 : 88;
    const padY = options.tightCrop ? 32 : 64;
    const tightMinX = options.tightCrop ? Math.floor(minX - padX) : Math.min(0, Math.floor(minX - padX));
    const tightMinY = options.tightCrop ? Math.floor(minY - padY) : Math.min(0, Math.floor(minY - padY));
    const tightW = Math.max(options.tightCrop ? 320 : 600, Math.ceil(maxX + padX - tightMinX));
    const tightH = Math.max(options.tightCrop ? 200 : 340, Math.ceil(maxY + padY - tightMinY));

    if (!options.tightCrop && (options.canvasWidth || options.canvasHeight)) {
      const targetW = options.canvasWidth || tightW;
      const targetH = options.canvasHeight || tightH;
      const targetAR = targetW / targetH;
      const tightAR = tightW / tightH;
      let viewW = tightW;
      let viewH = tightH;
      if (tightAR > targetAR) {
        viewH = Math.ceil(tightW / targetAR);
      } else {
        viewW = Math.ceil(tightH * targetAR);
      }
      const viewMinX = Math.floor(tightMinX - (viewW - tightW) / 2);
      const viewMinY = Math.floor(tightMinY - (viewH - tightH) / 2);
      return { boxes, minX: viewMinX, minY: viewMinY, width: viewW, height: viewH, svgW: targetW, svgH: targetH };
    }

    return { boxes, minX: tightMinX, minY: tightMinY, width: tightW, height: tightH, svgW: tightW, svgH: tightH };
  }

  function pairKey(idA, idB) {
    return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  }

  function getPortSide(boxA, boxB) {
    const cxA = boxA.x + boxA.w / 2;
    const cyA = boxA.y + boxA.h / 2;
    const cxB = boxB.x + boxB.w / 2;
    const cyB = boxB.y + boxB.h / 2;
    const dx = cxB - cxA;
    const dy = cyB - cyA;
    const avgW = (boxA.w + boxB.w) / 2;
    const avgH = (boxA.h + boxB.h) / 2;
    const horizontal = Math.abs(dx) / Math.max(1, avgW) >= Math.abs(dy) / Math.max(1, avgH);
    if (horizontal) {
      return { sideA: dx >= 0 ? "R" : "L", sideB: dx >= 0 ? "L" : "R" };
    } else {
      return { sideA: dy >= 0 ? "B" : "T", sideB: dy >= 0 ? "T" : "B" };
    }
  }

  function choosePorts(boxA, boxB, offsetA = 0, offsetB = 0) {
    const cxA = boxA.x + boxA.w / 2;
    const cyA = boxA.y + boxA.h / 2;
    const cxB = boxB.x + boxB.w / 2;
    const cyB = boxB.y + boxB.h / 2;

    const dx = cxB - cxA;
    const dy = cyB - cyA;

    const avgW = (boxA.w + boxB.w) / 2;
    const avgH = (boxA.h + boxB.h) / 2;

    const horizontal = Math.abs(dx) / Math.max(1, avgW) >= Math.abs(dy) / Math.max(1, avgH);

    if (horizontal) {
      const goingRight = dx >= 0;
      const yA = clampPort(cyA + offsetA, boxA.y + 16, boxA.y + boxA.h - 16);
      const yB = clampPort(cyB + (offsetB !== undefined ? offsetB : offsetA), boxB.y + 16, boxB.y + boxB.h - 16);
      return {
        p1: { x: goingRight ? boxA.x + boxA.w : boxA.x, y: yA },
        p2: { x: goingRight ? boxB.x : boxB.x + boxB.w, y: yB },
        u1: { x: goingRight ? 1 : -1, y: 0 },
        u2: { x: goingRight ? -1 : 1, y: 0 },
        axis: 'h'
      };
    }

    const goingDown = dy >= 0;
    const xA = clampPort(cxA + offsetA, boxA.x + 20, boxA.x + boxA.w - 20);
    const xB = clampPort(cxB + (offsetB !== undefined ? offsetB : offsetA), boxB.x + 20, boxB.x + boxB.w - 20);
    return {
      p1: { x: xA, y: goingDown ? boxA.y + boxA.h : boxA.y },
      p2: { x: xB, y: goingDown ? boxB.y : boxB.y + boxB.h },
      u1: { x: 0, y: goingDown ? 1 : -1 },
      u2: { x: 0, y: goingDown ? -1 : 1 },
      axis: 'v'
    };
  }

  function clampPort(val, minV, maxV) {
    if (minV >= maxV) return (minV + maxV) / 2;
    return Math.max(minV, Math.min(maxV, val));
  }

  function buildOrthogonalPolyline(p1, p2, axis, trimStart = 0, trimEnd = 0) {
    // Move p1 slightly away along start direction if trimmed by marker (diamond / arrow)
    const pts = [];
    if (axis === 'h') {
      const sx = p1.x + Math.sign(p2.x - p1.x || 1) * trimStart;
      const ex = p2.x - Math.sign(p2.x - p1.x || 1) * trimEnd;
      if (Math.abs(p1.y - p2.y) <= 6) {
        pts.push({ x: sx, y: p1.y }, { x: ex, y: p2.y });
      } else {
        const midX = (sx + ex) / 2;
        pts.push({ x: sx, y: p1.y }, { x: midX, y: p1.y }, { x: midX, y: p2.y }, { x: ex, y: p2.y });
      }
      return pts;
    }

    const sy = p1.y + Math.sign(p2.y - p1.y || 1) * trimStart;
    const ey = p2.y - Math.sign(p2.y - p1.y || 1) * trimEnd;
    if (Math.abs(p1.x - p2.x) <= 6) {
      pts.push({ x: p1.x, y: sy }, { x: p2.x, y: ey });
    } else {
      const midY = (sy + ey) / 2;
      pts.push({ x: p1.x, y: sy }, { x: p1.x, y: midY }, { x: p2.x, y: midY }, { x: p2.x, y: ey });
    }
    return pts;
  }

  function getPolylineMidpoint(pts) {
    let totalLen = 0;
    const segLens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segLens.push(len);
      totalLen += len;
    }
    if (totalLen === 0) return pts[0] || { x: 0, y: 0 };
    let target = totalLen / 2;
    for (let i = 0; i < segLens.length; i++) {
      if (target <= segLens[i] || i === segLens.length - 1) {
        const t = segLens[i] > 0 ? target / segLens[i] : 0;
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * t
        };
      }
      target -= segLens[i];
    }
    return pts[0];
  }

  function renderDiamondSVG(port, u, filled, pal) {
    // Diamond base touches port, extends 16px along u (direction away from box)
    const tipDist = 16;
    const midDist = 8;
    const halfW = 5.5;
    const px = -u.y;
    const py = u.x;

    const p0 = port;
    const p1 = { x: port.x + u.x * midDist + px * halfW, y: port.y + u.y * midDist + py * halfW };
    const p2 = { x: port.x + u.x * tipDist, y: port.y + u.y * tipDist };
    const p3 = { x: port.x + u.x * midDist - px * halfW, y: port.y + u.y * midDist - py * halfW };

    const ptsStr = [p0, p1, p2, p3].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const fill = filled ? pal.edge : pal.bg;
    return `<polygon points="${ptsStr}" fill="${fill}" stroke="${pal.edge}" stroke-width="1.6" stroke-linejoin="round" />`;
  }

  function renderHollowTriangleSVG(port, u, pal) {
    // Triangle tip touches parent's port; base is 13px away along u
    const len = 13;
    const halfW = 6.5;
    const px = -u.y;
    const py = u.x;

    const tip = port;
    const left = { x: port.x + u.x * len + px * halfW, y: port.y + u.y * len + py * halfW };
    const right = { x: port.x + u.x * len - px * halfW, y: port.y + u.y * len - py * halfW };
    const ptsStr = [tip, left, right].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return `<polygon points="${ptsStr}" fill="${pal.bg}" stroke="${pal.edge}" stroke-width="1.6" stroke-linejoin="round" />`;
  }

  function renderOpenArrowSVG(port, u, pal) {
    const len = 10;
    const halfW = 5.5;
    const px = -u.y;
    const py = u.x;

    const tip = port;
    const left = { x: port.x + u.x * len + px * halfW, y: port.y + u.y * len + py * halfW };
    const right = { x: port.x + u.x * len - px * halfW, y: port.y + u.y * len - py * halfW };
    return `<polyline points="${left.x.toFixed(1)},${left.y.toFixed(1)} ${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)}" fill="none" stroke="${pal.edge}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />`;
  }

  function renderMultiplicityText(port, u, text, extraDist, pal) {
    if (!text) return '';
    const dist = 15 + extraDist;
    let tx = port.x + u.x * dist;
    let ty = port.y + u.y * dist;
    let anchor = 'middle';

    if (Math.abs(u.x) > Math.abs(u.y)) {
      // Horizontal edge: place text slightly above the line
      ty -= 9;
      anchor = u.x > 0 ? 'start' : 'end';
      tx = port.x + u.x * (10 + extraDist);
    } else {
      // Vertical edge: place text slightly right of the line
      tx += 9;
      anchor = 'start';
      ty = port.y + u.y * (16 + extraDist) + 4;
    }

    return `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}" fill="${pal.ink}" font-family="${escXml(pal.font)}" font-size="11.5" font-weight="600">${escXml(text)}</text>`;
  }

  function renderEdgeLabelPill(mid, label, pal) {
    if (!label) return '';
    const w = Math.max(46, label.length * 7.4 + 16);
    const h = 21;
    return [
      `<g class="cls-rel-label" pointer-events="none">`,
      `  <rect x="${(mid.x - w / 2).toFixed(1)}" y="${(mid.y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="4" fill="${pal.labelBg}" fill-opacity="0.96" stroke="${pal.labelBorder}" stroke-width="0.8" />`,
      `  <text x="${mid.x.toFixed(1)}" y="${(mid.y + 4).toFixed(1)}" text-anchor="middle" fill="${pal.ink}" font-family="${escXml(pal.font)}" font-size="11.5" font-style="italic">${escXml(label)}</text>`,
      `</g>`
    ].join('\n');
  }

  function renderClassDiagramSVG(model, options = {}) {
    const pal = getPalette(options);
    const layout = computeClassLayout(model, options);
    const { boxes, minX, minY, width, height } = layout;
    const svgW = layout.svgW || width;
    const svgH = layout.svgH || height;
    const relations = (model && model.relations) || [];

    const idByKey = new Map();
    for (const [id, box] of boxes.entries()) {
      idByKey.set(canonicalKey(box.cls.name), id);
    }

    const parts = [];
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${svgW}" height="${svgH}" class="pli11-class-svg">`
    );
    parts.push(`<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${pal.bg}" />`);

    // Layer 1: Grouped Inheritance Relations (Visio tree bus when children sit below parent)
    const inhGroups = new Map();
    for (const rel of relations) {
      if (rel.kind !== 'inheritance') continue;
      const parId = rel.toId || idByKey.get(canonicalKey(rel.to));
      const childId = rel.fromId || idByKey.get(canonicalKey(rel.from));
      if (!parId || !childId || !boxes.has(parId) || !boxes.has(childId)) continue;
      if (!inhGroups.has(parId)) inhGroups.set(parId, []);
      inhGroups.get(parId).push({ rel, childId });
    }

    parts.push('<g class="cls-edges">');
    for (const [parId, items] of inhGroups.entries()) {
      const pBox = boxes.get(parId);
      const childBoxes = items.map((it) => boxes.get(it.childId)).filter((cb) => cb && cb.cls.id !== pBox.cls.id);
      if (childBoxes.length === 0) {
        // Self inheritance visual loop if error C03 occurred
        if (items.some((it) => it.childId === parId)) {
          const sx = pBox.x + pBox.w;
          const sy = pBox.y + 18;
          const ex = pBox.x + pBox.w;
          const ey = pBox.y + pBox.h - 14;
          parts.push(`<path d="M ${sx} ${ey} H ${sx + 34} V ${sy} H ${ex + 13}" fill="none" stroke="${pal.edge}" stroke-width="1.5" />`);
          parts.push(renderHollowTriangleSVG({ x: ex, y: sy }, { x: 1, y: 0 }, pal));
        }
        continue;
      }

      const allBelow = childBoxes.every((cb) => cb.y >= pBox.y + pBox.h + 18);
      if (allBelow) {
        const px = pBox.x + pBox.w / 2;
        const py = pBox.y + pBox.h;
        const minChildY = Math.min(...childBoxes.map((cb) => cb.y));
        const busY = Math.max(py + 22, Math.round((py + minChildY) / 2) + 4);
        const childCenters = childBoxes.map((cb) => cb.x + cb.w / 2);
        const leftX = Math.min(px, ...childCenters);
        const rightX = Math.max(px, ...childCenters);

        // Trunk from triangle base down to busY
        parts.push(`<line x1="${px.toFixed(1)}" y1="${(py + 13).toFixed(1)}" x2="${px.toFixed(1)}" y2="${busY.toFixed(1)}" stroke="${pal.edge}" stroke-width="1.5" />`);
        if (rightX - leftX > 1) {
          parts.push(`<line x1="${leftX.toFixed(1)}" y1="${busY.toFixed(1)}" x2="${rightX.toFixed(1)}" y2="${busY.toFixed(1)}" stroke="${pal.edge}" stroke-width="1.5" />`);
        }
        for (const cb of childBoxes) {
          const cx = cb.x + cb.w / 2;
          parts.push(`<line x1="${cx.toFixed(1)}" y1="${busY.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cb.y.toFixed(1)}" stroke="${pal.edge}" stroke-width="1.5" />`);
        }
        parts.push(renderHollowTriangleSVG({ x: px, y: py }, { x: 0, y: 1 }, pal));
      } else {
        for (const cb of childBoxes) {
          const ports = choosePorts(cb, pBox, 0);
          const poly = buildOrthogonalPolyline(ports.p1, ports.p2, ports.axis, 0, 13);
          const dStr = poly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
          parts.push(`<path d="${dStr}" fill="none" stroke="${pal.edge}" stroke-width="1.5" />`);
          parts.push(renderHollowTriangleSVG(ports.p2, ports.u2, pal));
        }
      }
    }

    // Layer 2: Non-inheritance relations (count port attachments per box side so ports separate cleanly)
    const nonInhRels = relations.filter((r) => r.kind !== 'inheritance');
    const sideTotals = new Map();
    const sideSeen = new Map();
    for (const rel of nonInhRels) {
      const fId = rel.fromId || idByKey.get(canonicalKey(rel.from));
      const tId = rel.toId || idByKey.get(canonicalKey(rel.to));
      if (!fId || !tId || fId === tId) continue;
      const b1 = boxes.get(fId);
      const b2 = boxes.get(tId);
      if (!b1 || !b2) continue;
      const sides = getPortSide(b1, b2);
      const k1 = `${fId}:${sides.sideA}`;
      const k2 = `${tId}:${sides.sideB}`;
      sideTotals.set(k1, (sideTotals.get(k1) || 0) + 1);
      sideTotals.set(k2, (sideTotals.get(k2) || 0) + 1);
    }

    for (const rel of nonInhRels) {
      const fId = rel.fromId || idByKey.get(canonicalKey(rel.from));
      const tId = rel.toId || idByKey.get(canonicalKey(rel.to));
      const b1 = fId && boxes.get(fId);
      const b2 = tId && boxes.get(tId);
      if (!b1 || !b2) continue;

      if (fId === tId) {
        // Self-association loop on top-right corner
        const sx = b1.x + b1.w;
        const sy = b1.y + 18;
        const ex = b1.x + b1.w - 28;
        const ey = b1.y;
        const trimX = (rel.kind === 'aggregation' || rel.kind === 'composition') ? sx + 16 : sx;
        parts.push(`<path d="M ${trimX} ${sy} H ${sx + 38} V ${ey - 28} H ${ex} V ${ey}" fill="none" stroke="${pal.edge}" stroke-width="1.5" ${rel.kind === 'dependency' ? 'stroke-dasharray="6,4"' : ''} />`);
        if (rel.kind === 'aggregation') parts.push(renderDiamondSVG({ x: sx, y: sy }, { x: 1, y: 0 }, false, pal));
        if (rel.kind === 'composition') parts.push(renderDiamondSVG({ x: sx, y: sy }, { x: 1, y: 0 }, true, pal));
        if (rel.kind === 'dependency') parts.push(renderOpenArrowSVG({ x: ex, y: ey }, { x: 0, y: -1 }, pal));
        parts.push(renderMultiplicityText({ x: sx, y: sy }, { x: 1, y: 0 }, rel.fromMult, (rel.kind === 'aggregation' || rel.kind === 'composition') ? 14 : 0, pal));
        parts.push(renderMultiplicityText({ x: ex, y: ey }, { x: 0, y: -1 }, rel.toMult, 0, pal));
        if (rel.label) parts.push(renderEdgeLabelPill({ x: sx + 38, y: ey - 28 }, rel.label, pal));
        continue;
      }

      const sides = getPortSide(b1, b2);
      const k1 = `${fId}:${sides.sideA}`;
      const k2 = `${tId}:${sides.sideB}`;
      const count1 = sideTotals.get(k1) || 1;
      const idx1 = sideSeen.get(k1) || 0;
      sideSeen.set(k1, idx1 + 1);
      const offsetA = count1 > 1 ? (idx1 - (count1 - 1) / 2) * 32 : 0;

      const count2 = sideTotals.get(k2) || 1;
      const idx2 = sideSeen.get(k2) || 0;
      sideSeen.set(k2, idx2 + 1);
      const offsetB = count2 > 1 ? (idx2 - (count2 - 1) / 2) * 32 : 0;

      const ports = choosePorts(b1, b2, offsetA, offsetB);
      const startTrim = (rel.kind === 'aggregation' || rel.kind === 'composition') ? 16 : 0;
      const endTrim = rel.kind === 'dependency' ? 3 : 0;
      const poly = buildOrthogonalPolyline(ports.p1, ports.p2, ports.axis, startTrim, endTrim);
      const dStr = poly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      const dash = rel.kind === 'dependency' ? ' stroke-dasharray="6,4"' : '';

      parts.push(`<path d="${dStr}" fill="none" stroke="${pal.edge}" stroke-width="1.5"${dash} />`);

      if (rel.kind === 'aggregation') {
        parts.push(renderDiamondSVG(ports.p1, ports.u1, false, pal));
      } else if (rel.kind === 'composition') {
        parts.push(renderDiamondSVG(ports.p1, ports.u1, true, pal));
      } else if (rel.kind === 'dependency') {
        parts.push(renderOpenArrowSVG(ports.p2, ports.u2, pal));
      }

      parts.push(renderMultiplicityText(ports.p1, ports.u1, rel.fromMult, startTrim ? 14 : 0, pal));
      parts.push(renderMultiplicityText(ports.p2, ports.u2, rel.toMult, 0, pal));

      const mid = getPolylineMidpoint(poly);
      if (rel.label) {
        parts.push(renderEdgeLabelPill(mid, rel.label, pal));
      }

      // Optional Association Class dashed connector
      if (rel.assocClass) {
        const aid = rel.assocClassId || idByKey.get(canonicalKey(rel.assocClass));
        const aBox = aid && boxes.get(aid);
        if (aBox) {
          const acx = aBox.x + aBox.w / 2;
          const acy = aBox.y + aBox.h / 2;
          let ax = acx;
          let ay = aBox.y;
          if (Math.abs(acy - mid.y) < aBox.h / 2) {
            ax = acx >= mid.x ? aBox.x : aBox.x + aBox.w;
            ay = acy;
          } else if (acy < mid.y) {
            ax = acx;
            ay = aBox.y + aBox.h;
          }
          parts.push(`<line x1="${mid.x.toFixed(1)}" y1="${mid.y.toFixed(1)}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${pal.edge}" stroke-width="1.4" stroke-dasharray="5,4" />`);
        }
      }
    }
    parts.push('</g>');

    // Layer 3: Class Boxes (interactive draggable .cls-node)
    parts.push('<g class="cls-nodes">');
    for (const box of boxes.values()) {
      const { cls, x, y, w, h, headerH, attrH, methodH, attrLines, methodLines } = box;
      const isSelected = options.selectedClassId === cls.id;
      const stroke = isSelected ? pal.selectedStroke : (cls.isImplicit ? pal.implicitStroke : pal.boxStroke);
      const strokeW = isSelected ? 2.4 : 1.5;
      const dashAttr = cls.isImplicit ? ' stroke-dasharray="5,3"' : '';

      parts.push(`<g class="cls-node" data-class-id="${escXml(cls.id)}" data-class-name="${escXml(cls.name)}" data-x="${x}" data-y="${y}" data-line="${cls.line || 1}" transform="translate(${x}, ${y})" style="cursor:move;">`);
      parts.push(`  <rect x="0" y="0" width="${w}" height="${h}" rx="2" fill="${pal.boxFill}" stroke="${stroke}" stroke-width="${strokeW}"${dashAttr} />`);
      parts.push(`  <rect x="0" y="0" width="${w}" height="${headerH}" rx="2" fill="${pal.boxHeaderFill}" stroke="${stroke}" stroke-width="${strokeW}"${dashAttr} />`);
      parts.push(`  <text x="${(w / 2).toFixed(1)}" y="${(headerH / 2 + 4.5).toFixed(1)}" text-anchor="middle" fill="${pal.ink}" font-family="${escXml(pal.font)}" font-size="13" font-weight="700">${escXml(cls.name)}</text>`);

      // Attributes compartment
      let curY = headerH + 18;
      for (const aLine of attrLines) {
        parts.push(`  <text x="10" y="${curY}" fill="${pal.ink}" font-family="${escXml(pal.font)}" font-size="12">${escXml(aLine)}</text>`);
        curY += 18;
      }

      // Methods compartment (if not hidden)
      if (!options.hideMethods && methodH > 0) {
        const divY = headerH + attrH;
        parts.push(`  <line x1="0" y1="${divY}" x2="${w}" y2="${divY}" stroke="${stroke}" stroke-width="1.2"${dashAttr} />`);
        let mY = divY + 18;
        for (const mLine of methodLines) {
          parts.push(`  <text x="10" y="${mY}" fill="${pal.ink}" font-family="${escXml(pal.font)}" font-size="12">${escXml(mLine)}</text>`);
          mY += 18;
        }
      }

      parts.push('</g>');
    }
    parts.push('</g>');

    parts.push('</svg>');
    return parts.join('\n');
  }

  // Standalone SVG & 3x HiDPI Word-Ready PNG export + Clipboard copy
  const CRC32_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function injectPngPhysDpi(pngBytes, dpi = 288) {
    if (!pngBytes || pngBytes.length < 33 || pngBytes[0] !== 0x89 || pngBytes[1] !== 0x50) {
      return pngBytes;
    }
    const ppm = Math.round(dpi * 39.37007874);
    const physChunk = new Uint8Array(21);
    const dv = new DataView(physChunk.buffer);
    dv.setUint32(0, 9, false);
    physChunk[4] = 0x70; physChunk[5] = 0x48; physChunk[6] = 0x59; physChunk[7] = 0x73;
    dv.setUint32(8, ppm, false);
    dv.setUint32(12, ppm, false);
    physChunk[16] = 1;
    dv.setUint32(17, crc32(physChunk.subarray(4, 17)), false);

    const ihdrLen = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength).getUint32(8, false);
    const ihdrEnd = 8 + 4 + 4 + ihdrLen + 4;
    if (ihdrEnd > pngBytes.length) return pngBytes;

    const out = new Uint8Array(pngBytes.length + 21);
    out.set(pngBytes.subarray(0, ihdrEnd), 0);
    out.set(physChunk, ihdrEnd);
    out.set(pngBytes.subarray(ihdrEnd), ihdrEnd + 21);
    return out;
  }

  function addDpiToPngBlob(blob, pixelWidth) {
    if (!blob || typeof blob.arrayBuffer !== 'function') return Promise.resolve(blob);
    const dpi = Math.max(220, Math.round(pixelWidth / 6.22));
    return blob.arrayBuffer().then((buf) => {
      const updated = injectPngPhysDpi(new Uint8Array(buf), dpi);
      return new Blob([updated], { type: 'image/png' });
    }).catch(() => blob);
  }

  function serializeStandaloneSVG(svgStringOrEl) {
    if (typeof svgStringOrEl === 'string') return svgStringOrEl;
    if (!svgStringOrEl) return '';
    return new XMLSerializer().serializeToString(svgStringOrEl);
  }

  function downloadSVG(svgStringOrEl, filename = 'class-diagram.svg') {
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
        let svgText = serializeStandaloneSVG(svgStringOrEl);
        if (!svgText) return reject(new Error('Invalid SVG input for PNG export'));

        if (!svgText.includes('xmlns="http://www.w3.org/2000/svg"')) {
          svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (svgText.includes('xlink:href') && !svgText.includes('xmlns:xlink=')) {
          svgText = svgText.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        let w = 900;
        let h = 560;
        const wMatch = svgText.match(/<svg[^>]*\bwidth=["']([0-9.]+)(?:px)?["']/i);
        const hMatch = svgText.match(/<svg[^>]*\bheight=["']([0-9.]+)(?:px)?["']/i);
        if (wMatch && parseFloat(wMatch[1]) > 0) w = parseFloat(wMatch[1]);
        if (hMatch && parseFloat(hMatch[1]) > 0) h = parseFloat(hMatch[1]);

        const encodedData = unescape(encodeURIComponent(svgText));
        const base64Uri = 'data:image/svg+xml;base64,' + btoa(encodedData);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const actualW = img.naturalWidth || w;
            const actualH = img.naturalHeight || h;
            const effectiveScale = Math.min(scale, 4800 / Math.max(1, Math.max(actualW, actualH)));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(actualW * effectiveScale);
            canvas.height = Math.round(actualH * effectiveScale);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(effectiveScale, effectiveScale);
            ctx.drawImage(img, 0, 0, actualW, actualH);
            resolve(canvas);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to rasterize SVG into image'));
        img.src = base64Uri;
      } catch (err) {
        reject(err);
      }
    });
  }

  function downloadPNG(svgStringOrEl, filename = 'class-diagram.png', scale = 3) {
    return renderSVGToCanvas(svgStringOrEl, scale).then((canvas) => {
      return new Promise((resolve, reject) => {
        try {
          const trigger = (downloadUrl) => {
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
          };
          if (canvas.toBlob) {
            canvas.toBlob((blob) => {
              if (blob) {
                addDpiToPngBlob(blob, canvas.width).then((hiDpiBlob) => trigger(URL.createObjectURL(hiDpiBlob)));
              } else {
                trigger(canvas.toDataURL('image/png'));
              }
            }, 'image/png');
          } else {
            trigger(canvas.toDataURL('image/png'));
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
        if (!canvas.toBlob) return reject(new Error('Canvas toBlob not supported'));
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Failed to create PNG blob'));
          addDpiToPngBlob(blob, canvas.width).then((hiDpiBlob) => {
            if (navigator.clipboard && window.ClipboardItem) {
              navigator.clipboard.write([new ClipboardItem({ 'image/png': hiDpiBlob })]).then(resolve).catch(reject);
            } else {
              reject(new Error('Clipboard API not available'));
            }
          });
        }, 'image/png');
      });
    });
  }

  return {
    computeClassLayout,
    renderClassDiagramSVG,
    injectPngPhysDpi,
    serializeStandaloneSVG,
    downloadSVG,
    downloadPNG,
    copyPNGToClipboard
  };
}));
