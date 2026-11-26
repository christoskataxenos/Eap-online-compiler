// -----------------------------------------------------------------------------
// EAP Online Compiler — Zero-Code Mermaid Visual Editor (mermaid-visual-editor.js)
// Post-render interactive SVG manipulation layer for Mermaid flowcharts &
// classDiagrams: node drag-and-drop with live edge/marker/subgraph rerouting,
// independent edge-label & multiplicity dragging, click-to-style popover,
// Word print mode, undo/redo, and deterministic override persistence — all
// WITHOUT modifying a single character of Mermaid code or EAP pseudocode.
// UMD module: Browser window.EAPMermaidEditor / Node module.exports
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EAPMermaidEditor = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  const STYLE_PRESETS = {
    '': { label: 'Προεπιλογή', fill: '', stroke: '', text: '' },
    blue: { label: 'Μπλε ΕΑΠ', fill: '#e0f2fe', stroke: '#0369a1', text: '#0c4a6e' },
    green: { label: 'Πράσινο', fill: '#dcfce7', stroke: '#15803d', text: '#14532d' },
    amber: { label: 'Κίτρινο / ΚΜ', fill: '#fef3c7', stroke: '#b45309', text: '#78350f' },
    purple: { label: 'Μωβ', fill: '#f3e8ff', stroke: '#7e22ce', text: '#4c1d95' },
    red: { label: 'Έμφαση', fill: '#fee2e2', stroke: '#b91c1c', text: '#7f1d1d' },
    bw: { label: 'Λευκό / Α/Μ', fill: '#ffffff', stroke: '#0f172a', text: '#0f172a' }
  };

  // ---------------------------------------------------------------------------
  // Pure Geometry & Parsing Helpers (exported for Node unit tests)
  // ---------------------------------------------------------------------------
  function normalizeKeyText(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_\u0370-\u03ff-]/g, '')
      .toUpperCase()
      .slice(0, 64);
  }

  function extractNodeKey(idAttr, labelText, fallbackIndex = 0) {
    const rawId = String(idAttr || '').trim();
    if (rawId) {
      // Mermaid v10/v11 patterns:
      //   flowchart-M_EXEC_M1-0  -> M_EXEC_M1
      //   classId-C_ΠΕΛΑΤΗΣ-2    -> C_ΠΕΛΑΤΗΣ
      //   node-A-1               -> A
      const flowMatch = rawId.match(/^(?:flowchart|classId|classid|state|node)-(.+?)-\d+$/i);
      if (flowMatch && flowMatch[1]) {
        return flowMatch[1];
      }
      const stripped = rawId.replace(/-\d+$/, '');
      if (stripped) return stripped;
    }
    const cleanLbl = normalizeKeyText(labelText);
    if (cleanLbl) return 'LBL_' + cleanLbl;
    return 'NODE_' + fallbackIndex;
  }

  function parseTransformTranslate(transformStr) {
    if (!transformStr) return { x: 0, y: 0 };
    const m = String(transformStr).match(/translate\(\s*([+-]?\d*\.?\d+)(?:[\s,]+([+-]?\d*\.?\d+))?\s*\)/i);
    if (!m) return { x: 0, y: 0 };
    return {
      x: parseFloat(m[1]) || 0,
      y: m[2] !== undefined ? (parseFloat(m[2]) || 0) : 0
    };
  }

  function parsePathEndpoints(dStr) {
    const d = String(dStr || '').trim();
    if (!d) return null;
    const tokens = d.match(/[a-zA-Z]|[+-]?\d*\.?\d+(?:e[+-]?\d+)?/g);
    if (!tokens || tokens.length < 3) return null;

    let cx = 0;
    let cy = 0;
    let startX = null;
    let startY = null;
    let subStartX = 0;
    let subStartY = 0;
    let cmd = '';
    let i = 0;

    const isNum = (idx) => idx < tokens.length && /^[+-]?\d|\./.test(tokens[idx]);
    const nextNum = () => parseFloat(tokens[i++]) || 0;

    while (i < tokens.length) {
      if (/^[a-zA-Z]$/.test(tokens[i])) {
        cmd = tokens[i++];
      }
      if (!cmd) break;

      const upper = cmd.toUpperCase();
      const rel = cmd !== upper;

      if (upper === 'Z') {
        cx = subStartX;
        cy = subStartY;
        continue;
      }

      if (!isNum(i)) continue;

      if (upper === 'M') {
        const x = nextNum();
        const y = nextNum();
        cx = rel ? cx + x : x;
        cy = rel ? cy + y : y;
        subStartX = cx;
        subStartY = cy;
        if (startX === null) {
          startX = cx;
          startY = cy;
        }
        cmd = rel ? 'l' : 'L';
      } else if (upper === 'L' || upper === 'T') {
        const x = nextNum();
        const y = nextNum();
        cx = rel ? cx + x : x;
        cy = rel ? cy + y : y;
      } else if (upper === 'H') {
        const x = nextNum();
        cx = rel ? cx + x : x;
      } else if (upper === 'V') {
        const y = nextNum();
        cy = rel ? cy + y : y;
      } else if (upper === 'C') {
        i += 4; // skip c1x, c1y, c2x, c2y
        const x = nextNum();
        const y = nextNum();
        cx = rel ? cx + x : x;
        cy = rel ? cy + y : y;
      } else if (upper === 'S' || upper === 'Q') {
        i += 2; // skip control point
        const x = nextNum();
        const y = nextNum();
        cx = rel ? cx + x : x;
        cy = rel ? cy + y : y;
      } else if (upper === 'A') {
        i += 5; // rx, ry, rot, largeArc, sweep
        const x = nextNum();
        const y = nextNum();
        cx = rel ? cx + x : x;
        cy = rel ? cy + y : y;
      } else {
        i++;
      }
    }

    if (startX === null) return null;
    return {
      start: { x: startX, y: startY },
      end: { x: cx, y: cy }
    };
  }

  function translateSvgPathD(dStr, dx, dy) {
    if (!dStr || (dx === 0 && dy === 0)) return dStr;
    const tokens = String(dStr).match(/[a-zA-Z]|[+-]?\d*\.?\d+(?:e[+-]?\d+)?/g);
    if (!tokens) return dStr;

    const out = [];
    let cmd = '';
    let i = 0;
    const isNum = (idx) => idx < tokens.length && /^[+-]?\d|\./.test(tokens[idx]);
    const rd = () => parseFloat(tokens[i++]) || 0;
    const fmt = (n) => Number(n.toFixed(2));

    while (i < tokens.length) {
      if (/^[a-zA-Z]$/.test(tokens[i])) {
        cmd = tokens[i++];
        out.push(cmd);
      }
      if (!cmd) break;
      if (cmd.toUpperCase() === 'Z') continue;
      if (!isNum(i)) continue;

      const upper = cmd.toUpperCase();
      const rel = cmd !== upper;

      if (rel) {
        // Relative coordinates do not shift except the very first 'm' at start of path
        if (cmd === 'm' && out.length === 1) {
          out.push(fmt(rd() + dx), fmt(rd() + dy));
          // Subsequent implicit pairs after 'm' are relative 'l'
          while (isNum(i)) {
            out.push(rd(), rd());
          }
        } else {
          while (isNum(i)) out.push(rd());
        }
        continue;
      }

      if (upper === 'M' || upper === 'L' || upper === 'T') {
        out.push(fmt(rd() + dx), fmt(rd() + dy));
      } else if (upper === 'H') {
        out.push(fmt(rd() + dx));
      } else if (upper === 'V') {
        out.push(fmt(rd() + dy));
      } else if (upper === 'C') {
        out.push(
          fmt(rd() + dx), fmt(rd() + dy),
          fmt(rd() + dx), fmt(rd() + dy),
          fmt(rd() + dx), fmt(rd() + dy)
        );
      } else if (upper === 'S' || upper === 'Q') {
        out.push(fmt(rd() + dx), fmt(rd() + dy), fmt(rd() + dx), fmt(rd() + dy));
      } else if (upper === 'A') {
        out.push(rd(), rd(), rd(), rd(), rd(), fmt(rd() + dx), fmt(rd() + dy));
      } else {
        out.push(tokens[i++]);
      }
    }
    return out.join(' ');
  }

  function distancePointToBox(pt, box) {
    const dx = Math.max(box.x - pt.x, 0, pt.x - (box.x + box.w));
    const dy = Math.max(box.y - pt.y, 0, pt.y - (box.y + box.h));
    return Math.hypot(dx, dy);
  }

  function computePortPair(boxA, boxB, standoffStart = 0, standoffEnd = 0) {
    const cxA = boxA.x + boxA.w / 2;
    const cyA = boxA.y + boxA.h / 2;
    const cxB = boxB.x + boxB.w / 2;
    const cyB = boxB.y + boxB.h / 2;
    const dx = cxB - cxA;
    const dy = cyB - cyA;

    const normX = Math.abs(dx) / Math.max(40, (boxA.w + boxB.w) / 2);
    const normY = Math.abs(dy) / Math.max(30, (boxA.h + boxB.h) / 2);

    if (normX > normY * 1.05) {
      const right = dx >= 0;
      const dir = right ? 1 : -1;
      const p1 = {
        x: (right ? boxA.x + boxA.w : boxA.x) + dir * standoffStart,
        y: cyA
      };
      const p2 = {
        x: (right ? boxB.x : boxB.x + boxB.w) - dir * standoffEnd,
        y: cyB
      };
      return { p1, p2, axis: 'h' };
    }

    const down = dy >= 0;
    const dir = down ? 1 : -1;
    const p1 = {
      x: cxA,
      y: (down ? boxA.y + boxA.h : boxA.y) + dir * standoffStart
    };
    const p2 = {
      x: cxB,
      y: (down ? boxB.y : boxB.y + boxB.h) - dir * standoffEnd
    };
    return { p1, p2, axis: 'v' };
  }

  function buildEdgePathD(p1, p2, axis, curveMode = 'basis') {
    const x1 = Number(p1.x.toFixed(1));
    const y1 = Number(p1.y.toFixed(1));
    const x2 = Number(p2.x.toFixed(1));
    const y2 = Number(p2.y.toFixed(1));

    if (curveMode === 'linear') {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    if (curveMode === 'orthogonal' || curveMode === 'step' || curveMode === 'stepAfter') {
      if (axis === 'h') {
        if (Math.abs(y2 - y1) < 4) return `M ${x1} ${y1} L ${x2} ${y2}`;
        const mx = Number(((x1 + x2) / 2).toFixed(1));
        return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
      }
      if (Math.abs(x2 - x1) < 4) return `M ${x1} ${y1} L ${x2} ${y2}`;
      const my = Number(((y1 + y2) / 2).toFixed(1));
      return `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`;
    }

    // Smooth cubic Bezier ('basis')
    if (axis === 'h') {
      const span = Math.max(28, Math.abs(x2 - x1) * 0.48);
      const dir = x2 >= x1 ? 1 : -1;
      const c1x = Number((x1 + dir * span).toFixed(1));
      const c2x = Number((x2 - dir * span).toFixed(1));
      return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
    }
    const span = Math.max(28, Math.abs(y2 - y1) * 0.48);
    const dir = y2 >= y1 ? 1 : -1;
    const c1y = Number((y1 + dir * span).toFixed(1));
    const c2y = Number((y2 - dir * span).toFixed(1));
    return `M ${x1} ${y1} C ${x1} ${c1y}, ${x2} ${c2y}, ${x2} ${y2}`;
  }

  // ---------------------------------------------------------------------------
  // Interactive Visual Editor Controller
  // ---------------------------------------------------------------------------
  function createMermaidVisualEditor(opts = {}) {
    const storageKey = opts.storageKey || 'eapMermaidVisualState';
    const viewportEl = opts.viewportEl || null;
    const getScale = typeof opts.getScale === 'function' ? opts.getScale : () => 1;
    const onConfigChange = typeof opts.onConfigChange === 'function' ? opts.onConfigChange : () => {};
    const onStatusChange = typeof opts.onStatusChange === 'function' ? opts.onStatusChange : () => {};
    const showToast = typeof opts.showToast === 'function' ? opts.showToast : () => {};

    let state = {
      config: {
        curve: 'basis',       // 'basis' | 'stepAfter' | 'linear'
        spacing: 'normal',    // 'compact' | 'normal' | 'wide'
        printMode: false
      },
      scopes: {}
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            state.config = { ...state.config, ...(parsed.config || {}) };
            state.scopes = parsed.scopes || {};
          }
        }
      }
    } catch (e) { /* ignore storage errors */ }

    const undoStacks = {};
    const redoStacks = {};
    let activeScope = 'default';
    let currentSvg = null;
    let topology = null;
    let popoverEl = null;
    let selectedNodeKey = null;

    function ensureScope(scope) {
      const s = scope || 'default';
      if (!state.scopes[s]) {
        state.scopes[s] = {
          nodeOffsets: {},
          labelOffsets: {},
          nodeStyles: {}
        };
      }
      if (!undoStacks[s]) undoStacks[s] = [];
      if (!redoStacks[s]) redoStacks[s] = [];
      return state.scopes[s];
    }

    function saveState() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(state));
        }
      } catch (e) { /* ignore */ }
      notifyStatus();
    }

    function cloneScopeData(scopeData) {
      return JSON.parse(JSON.stringify(scopeData));
    }

    function pushUndoSnapshot(scope) {
      const s = scope || activeScope;
      const cur = ensureScope(s);
      undoStacks[s].push(cloneScopeData(cur));
      if (undoStacks[s].length > 40) undoStacks[s].shift();
      redoStacks[s] = [];
    }

    function countEdits(scope) {
      const d = ensureScope(scope || activeScope);
      let n = 0;
      for (const v of Object.values(d.nodeOffsets || {})) {
        if (v && (Math.abs(v.dx || 0) > 0.5 || Math.abs(v.dy || 0) > 0.5)) n++;
      }
      for (const v of Object.values(d.labelOffsets || {})) {
        if (v && (Math.abs(v.dx || 0) > 0.5 || Math.abs(v.dy || 0) > 0.5)) n++;
      }
      for (const v of Object.values(d.nodeStyles || {})) {
        if (v && (v.preset || v.bold || v.dashed || v.hidden)) n++;
      }
      return n;
    }

    function notifyStatus() {
      const s = activeScope;
      ensureScope(s);
      onStatusChange({
        editCount: countEdits(s),
        canUndo: (undoStacks[s] && undoStacks[s].length > 0) || false,
        canRedo: (redoStacks[s] && redoStacks[s].length > 0) || false,
        config: { ...state.config }
      });
    }

    function getMermaidInitConfig(isDark = false) {
      const sp = state.config.spacing === 'compact'
        ? { nodeSpacing: 28, rankSpacing: 34 }
        : state.config.spacing === 'wide'
          ? { nodeSpacing: 85, rankSpacing: 88 }
          : { nodeSpacing: 50, rankSpacing: 55 };

      const curve = state.config.curve || 'basis';
      const theme = state.config.printMode ? 'neutral' : (isDark ? 'dark' : 'default');

      return {
        startOnLoad: false,
        theme,
        securityLevel: 'loose',
        flowchart: {
          curve,
          nodeSpacing: sp.nodeSpacing,
          rankSpacing: sp.rankSpacing,
          padding: 14
        },
        class: {
          nodeSpacing: sp.nodeSpacing,
          rankSpacing: sp.rankSpacing,
          diagramPadding: 14
        }
      };
    }

    // -------------------------------------------------------------------------
    // Topology Capture on Freshly Rendered Mermaid SVG
    // -------------------------------------------------------------------------
    function getCumulativeTranslateUpTo(el, stopAt) {
      let tx = 0;
      let ty = 0;
      let cur = el;
      while (cur && cur !== stopAt && cur.nodeType === 1) {
        const t = parseTransformTranslate(cur.getAttribute('transform'));
        tx += t.x;
        ty += t.y;
        cur = cur.parentNode;
      }
      return { x: tx, y: ty };
    }

    function captureTopology(svgEl) {
      const vbAttr = (svgEl.getAttribute('viewBox') || '').trim();
      let initialVB = { x: 0, y: 0, w: 800, h: 450 };
      if (vbAttr) {
        const p = vbAttr.split(/[\s,]+/).map(Number);
        if (p.length === 4 && p[2] > 0 && p[3] > 0) {
          initialVB = { x: p[0], y: p[1], w: p[2], h: p[3] };
        }
      }

      // 1. Collect draggable nodes
      const nodeEls = Array.from(svgEl.querySelectorAll('g.node, g.classGroup'));
      const nodes = new Map();
      const usedKeys = new Set();

      nodeEls.forEach((el, idx) => {
        let bb = { x: -60, y: -22, width: 120, height: 44 };
        try {
          const rawBB = el.getBBox();
          if (rawBB && rawBB.width > 1 && rawBB.height > 1) bb = rawBB;
        } catch (e) { /* detached fallback */ }

        const ownT = parseTransformTranslate(el.getAttribute('transform'));
        const parentT = el.parentNode ? getCumulativeTranslateUpTo(el.parentNode, svgEl) : { x: 0, y: 0 };
        const worldX = parentT.x + ownT.x + bb.x;
        const worldY = parentT.y + ownT.y + bb.y;

        const titleEl = el.querySelector('.nodeLabel, .classTitle, text');
        const labelText = titleEl ? titleEl.textContent.trim() : el.textContent.trim().split('\n')[0];
        let key = extractNodeKey(el.getAttribute('id'), labelText, idx);
        let suffix = 2;
        while (usedKeys.has(key)) {
          key = `${extractNodeKey(el.getAttribute('id'), labelText, idx)}_${suffix++}`;
        }
        usedKeys.add(key);

        el.setAttribute('data-mmd-node-key', key);
        el.classList.add('mmd-ve-node');

        nodes.set(key, {
          key,
          el,
          label: labelText || key,
          baseTranslate: ownT,
          parentOffset: parentT,
          localBBox: { x: bb.x, y: bb.y, w: bb.width, h: bb.height },
          initialWorldBox: { x: worldX, y: worldY, w: bb.width, h: bb.height }
        });
      });

      // 2. Collect edges (<path>) and match endpoints to nodes
      const pathSelectors = 'g.edgePaths path, path.flowchart-link, path.relation, g.edges path, g.relations path';
      const rawPaths = Array.from(svgEl.querySelectorAll(pathSelectors))
        .filter((p) => !p.closest('defs') && !p.closest('marker') && !p.closest('g.node'));

      const edges = [];
      const nodeList = Array.from(nodes.values());

      function matchEndpointToNode(pt) {
        let best = null;
        let bestDist = 42; // Max marker standoff tolerance in px
        for (const nd of nodeList) {
          const dist = distancePointToBox(pt, nd.initialWorldBox);
          if (dist < bestDist) {
            bestDist = dist;
            best = { nodeKey: nd.key, standoff: Math.min(22, Math.max(0, dist)) };
          }
        }
        return best;
      }

      rawPaths.forEach((pathEl, idx) => {
        const origD = pathEl.getAttribute('d') || '';
        const parentT = pathEl.parentNode ? getCumulativeTranslateUpTo(pathEl.parentNode, svgEl) : { x: 0, y: 0 };
        const ep = parsePathEndpoints(origD);
        if (!ep) return;

        const worldStart = { x: ep.start.x + parentT.x, y: ep.start.y + parentT.y };
        const worldEnd = { x: ep.end.x + parentT.x, y: ep.end.y + parentT.y };
        const srcMatch = matchEndpointToNode(worldStart);
        const tgtMatch = matchEndpointToNode(worldEnd);

        edges.push({
          idx,
          el: pathEl,
          origD,
          parentOffset: parentT,
          initialStart: worldStart,
          initialEnd: worldEnd,
          initialMid: {
            x: (worldStart.x + worldEnd.x) / 2,
            y: (worldStart.y + worldEnd.y) / 2
          },
          sourceKey: srcMatch ? srcMatch.nodeKey : null,
          targetKey: tgtMatch ? tgtMatch.nodeKey : null,
          standoffStart: srcMatch ? srcMatch.standoff : 0,
          standoffEnd: tgtMatch ? tgtMatch.standoff : 0
        });
      });

      // 3. Collect draggable edge labels & UML multiplicities
      const labelEls = Array.from(svgEl.querySelectorAll('g.edgeLabel, g.edgeTerminals'));
      const labels = new Map();
      const usedLabelKeys = new Set();

      labelEls.forEach((el, idx) => {
        const txt = (el.textContent || '').trim();
        if (!txt) return;

        const ownT = parseTransformTranslate(el.getAttribute('transform'));
        const parentT = el.parentNode ? getCumulativeTranslateUpTo(el.parentNode, svgEl) : { x: 0, y: 0 };
        let bb = { x: -16, y: -10, width: 32, height: 20 };
        try {
          const r = el.getBBox();
          if (r && (r.width > 0 || r.height > 0)) bb = r;
        } catch (e) { /* ignore */ }

        const worldCx = parentT.x + ownT.x + bb.x + bb.width / 2;
        const worldCy = parentT.y + ownT.y + bb.y + bb.height / 2;
        const isTerminal = el.classList.contains('edgeTerminals');

        // Match to closest edge (start, end, or midpoint)
        let linkedEdge = null;
        let anchorKind = 'mid'; // 'start' | 'end' | 'mid'
        let bestD = 95;

        for (const ed of edges) {
          if (isTerminal) {
            const ds = Math.hypot(worldCx - ed.initialStart.x, worldCy - ed.initialStart.y);
            const de = Math.hypot(worldCx - ed.initialEnd.x, worldCy - ed.initialEnd.y);
            if (ds < bestD) { bestD = ds; linkedEdge = ed; anchorKind = 'start'; }
            if (de < bestD) { bestD = de; linkedEdge = ed; anchorKind = 'end'; }
          } else {
            const dm = Math.hypot(worldCx - ed.initialMid.x, worldCy - ed.initialMid.y);
            if (dm < bestD) { bestD = dm; linkedEdge = ed; anchorKind = 'mid'; }
          }
        }

        const edgeSig = linkedEdge
          ? `${linkedEdge.sourceKey || 'X'}_${linkedEdge.targetKey || 'Y'}_${anchorKind}`
          : `FREE_${idx}`;
        let lKey = `L_${edgeSig}_${normalizeKeyText(txt) || idx}`;
        let n = 2;
        while (usedLabelKeys.has(lKey)) {
          lKey = `L_${edgeSig}_${normalizeKeyText(txt) || idx}_${n++}`;
        }
        usedLabelKeys.add(lKey);

        el.setAttribute('data-mmd-label-key', lKey);
        el.classList.add('mmd-ve-label');

        labels.set(lKey, {
          key: lKey,
          el,
          text: txt,
          baseTranslate: ownT,
          parentOffset: parentT,
          localBBox: { x: bb.x, y: bb.y, w: bb.width, h: bb.height },
          linkedEdge,
          anchorKind
        });
      });

      // 4. Collect subgraphs / clusters (e.g. KM dashed frames)
      const clusterEls = Array.from(svgEl.querySelectorAll('g.cluster'));
      const clusters = [];
      clusterEls.forEach((el) => {
        const rect = el.querySelector('rect');
        if (!rect) return;
        const ownT = parseTransformTranslate(el.getAttribute('transform'));
        const parentT = el.parentNode ? getCumulativeTranslateUpTo(el.parentNode, svgEl) : { x: 0, y: 0 };
        const rx = parseFloat(rect.getAttribute('x')) || 0;
        const ry = parseFloat(rect.getAttribute('y')) || 0;
        const rw = parseFloat(rect.getAttribute('width')) || 0;
        const rh = parseFloat(rect.getAttribute('height')) || 0;
        if (rw <= 0 || rh <= 0) return;

        const worldRect = {
          x: parentT.x + ownT.x + rx,
          y: parentT.y + ownT.y + ry,
          w: rw,
          h: rh
        };

        const memberKeys = [];
        for (const nd of nodeList) {
          const ncx = nd.initialWorldBox.x + nd.initialWorldBox.w / 2;
          const ncy = nd.initialWorldBox.y + nd.initialWorldBox.h / 2;
          if (
            ncx >= worldRect.x && ncx <= worldRect.x + worldRect.w &&
            ncy >= worldRect.y && ncy <= worldRect.y + worldRect.h
          ) {
            memberKeys.push(nd.key);
          }
        }

        const labelG = el.querySelector('g.cluster-label');
        const labelOrigT = labelG ? parseTransformTranslate(labelG.getAttribute('transform')) : null;

        clusters.push({
          el,
          rect,
          labelG,
          labelOrigT,
          totalOffset: { x: parentT.x + ownT.x, y: parentT.y + ownT.y },
          origLocalRect: { x: rx, y: ry, w: rw, h: rh },
          memberKeys
        });
      });

      return { initialVB, nodes, edges, labels, clusters };
    }

    // -------------------------------------------------------------------------
    // Apply Visual Overrides to Captured SVG Topology
    // -------------------------------------------------------------------------
    function applyPrintModeStyles(svgEl, enable) {
      if (!svgEl) return;
      let bgRect = svgEl.querySelector('rect.mmd-ve-print-bg');
      if (enable) {
        svgEl.classList.add('mmd-ve-print-mode');
        if (!bgRect) {
          bgRect = document.createElementNS(SVG_NS, 'rect');
          bgRect.setAttribute('class', 'mmd-ve-print-bg');
          bgRect.setAttribute('fill', '#ffffff');
          svgEl.insertBefore(bgRect, svgEl.firstChild);
        }
        // Apply high-contrast black/white academic styling inline so PNG export preserves it
        svgEl.querySelectorAll('g.node rect, g.node polygon, g.node circle, g.node path, g.classGroup rect, g.classGroup path').forEach((sh) => {
          if (!sh.closest('[data-mmd-styled="true"]')) {
            const fill = sh.getAttribute('fill') || '';
            if (fill !== 'none') {
              sh.style.fill = '#ffffff';
            }
            sh.style.stroke = '#0f172a';
          }
        });
        svgEl.querySelectorAll('g.cluster rect').forEach((r) => {
          r.style.fill = 'rgba(15, 23, 42, 0.02)';
          r.style.stroke = '#1e293b';
        });
        svgEl.querySelectorAll('g.edgePaths path, path.flowchart-link, path.relation').forEach((p) => {
          p.style.stroke = '#0f172a';
        });
        svgEl.querySelectorAll('marker path, marker polygon, marker circle').forEach((m) => {
          const f = m.getAttribute('fill') || '';
          m.style.stroke = '#0f172a';
          if (f && f !== 'none' && f !== '#ffffff' && f !== 'white') {
            m.style.fill = '#0f172a';
          }
        });
        svgEl.querySelectorAll('text, span, div, p').forEach((t) => {
          if (!t.closest('[data-mmd-styled="true"]')) {
            t.style.fill = '#0f172a';
            t.style.color = '#0f172a';
          }
        });
      } else {
        svgEl.classList.remove('mmd-ve-print-mode');
        if (bgRect) bgRect.remove();
      }
    }

    function applyNodeVisualStyle(nd, styleObj) {
      const shapes = nd.el.querySelectorAll('rect, polygon, circle, ellipse, path.node-bkg, g.basic > path');
      const texts = nd.el.querySelectorAll('text, span, div, p');
      const st = styleObj || {};
      const preset = STYLE_PRESETS[st.preset || ''] || STYLE_PRESETS[''];

      nd.el.style.display = st.hidden ? 'none' : '';
      if (st.preset || st.bold || st.dashed) {
        nd.el.setAttribute('data-mmd-styled', 'true');
      } else {
        nd.el.removeAttribute('data-mmd-styled');
      }

      shapes.forEach((sh) => {
        if (preset.fill) {
          sh.style.fill = preset.fill;
          sh.style.stroke = preset.stroke;
        } else if (!state.config.printMode) {
          sh.style.fill = '';
          sh.style.stroke = '';
        }
        sh.style.strokeWidth = st.bold ? '2.8px' : '';
        sh.style.strokeDasharray = st.dashed ? '6, 4' : '';
      });

      texts.forEach((t) => {
        if (preset.text) {
          t.style.fill = preset.text;
          t.style.color = preset.text;
        } else if (!state.config.printMode) {
          t.style.fill = '';
          t.style.color = '';
        }
      });
    }

    function refreshGeometry() {
      if (!currentSvg || !topology) return;
      const scopeData = ensureScope(activeScope);
      const nodeOffsets = scopeData.nodeOffsets || {};
      const labelOffsets = scopeData.labelOffsets || {};
      const nodeStyles = scopeData.nodeStyles || {};

      // 1. Update node transforms & styles
      const currentWorldBoxes = new Map();
      for (const [key, nd] of topology.nodes.entries()) {
        const off = nodeOffsets[key] || { dx: 0, dy: 0 };
        const nx = nd.baseTranslate.x + (off.dx || 0);
        const ny = nd.baseTranslate.y + (off.dy || 0);
        nd.el.setAttribute('transform', `translate(${nx.toFixed(1)}, ${ny.toFixed(1)})`);
        nd.el.classList.toggle('mmd-ve-selected', selectedNodeKey === key);

        const st = nodeStyles[key] || null;
        applyNodeVisualStyle(nd, st);

        currentWorldBoxes.set(key, {
          x: nd.initialWorldBox.x + (off.dx || 0),
          y: nd.initialWorldBox.y + (off.dy || 0),
          w: nd.initialWorldBox.w,
          h: nd.initialWorldBox.h,
          dx: off.dx || 0,
          dy: off.dy || 0,
          hidden: Boolean(st && st.hidden)
        });
      }

      // 2. Update connected edges
      const edgeDeltas = new Map();
      for (const ed of topology.edges) {
        const srcBox = ed.sourceKey ? currentWorldBoxes.get(ed.sourceKey) : null;
        const tgtBox = ed.targetKey ? currentWorldBoxes.get(ed.targetKey) : null;

        if ((srcBox && srcBox.hidden) || (tgtBox && tgtBox.hidden)) {
          ed.el.style.display = 'none';
          continue;
        }
        ed.el.style.display = '';

        const srcMoved = srcBox && (Math.abs(srcBox.dx) > 0.4 || Math.abs(srcBox.dy) > 0.4);
        const tgtMoved = tgtBox && (Math.abs(tgtBox.dx) > 0.4 || Math.abs(tgtBox.dy) > 0.4);

        if (!srcMoved && !tgtMoved) {
          ed.el.setAttribute('d', ed.origD);
          edgeDeltas.set(ed, {
            startDx: 0, startDy: 0,
            endDx: 0, endDy: 0,
            midDx: 0, midDy: 0
          });
          continue;
        }

        if (ed.sourceKey && ed.sourceKey === ed.targetKey && srcBox) {
          // Self-loop: translate entire original curve smoothly
          ed.el.setAttribute('d', translateSvgPathD(ed.origD, srcBox.dx, srcBox.dy));
          edgeDeltas.set(ed, {
            startDx: srcBox.dx, startDy: srcBox.dy,
            endDx: srcBox.dx, endDy: srcBox.dy,
            midDx: srcBox.dx, midDy: srcBox.dy
          });
          continue;
        }

        if (srcBox && tgtBox) {
          const ports = computePortPair(srcBox, tgtBox, ed.standoffStart, ed.standoffEnd);
          const localP1 = { x: ports.p1.x - ed.parentOffset.x, y: ports.p1.y - ed.parentOffset.y };
          const localP2 = { x: ports.p2.x - ed.parentOffset.x, y: ports.p2.y - ed.parentOffset.y };
          ed.el.setAttribute('d', buildEdgePathD(localP1, localP2, ports.axis, state.config.curve));

          const sDx = ports.p1.x - ed.initialStart.x;
          const sDy = ports.p1.y - ed.initialStart.y;
          const eDx = ports.p2.x - ed.initialEnd.x;
          const eDy = ports.p2.y - ed.initialEnd.y;
          edgeDeltas.set(ed, {
            startDx: sDx, startDy: sDy,
            endDx: eDx, endDy: eDy,
            midDx: (sDx + eDx) / 2,
            midDy: (sDy + eDy) / 2
          });
        } else {
          // Only one end matched a node -> shift whole path by that node's delta
          const dNode = srcBox || tgtBox;
          ed.el.setAttribute('d', translateSvgPathD(ed.origD, dNode.dx, dNode.dy));
          edgeDeltas.set(ed, {
            startDx: dNode.dx, startDy: dNode.dy,
            endDx: dNode.dx, endDy: dNode.dy,
            midDx: dNode.dx, midDy: dNode.dy
          });
        }
      }

      // 3. Update edge labels & UML multiplicities (auto-follow edge + manual user offset)
      for (const [lKey, lbl] of topology.labels.entries()) {
        const userOff = labelOffsets[lKey] || { dx: 0, dy: 0 };
        let autoDx = 0;
        let autoDy = 0;
        let edgeHidden = false;

        if (lbl.linkedEdge) {
          if (lbl.linkedEdge.el.style.display === 'none') edgeHidden = true;
          const delta = edgeDeltas.get(lbl.linkedEdge);
          if (delta) {
            if (lbl.anchorKind === 'start') { autoDx = delta.startDx; autoDy = delta.startDy; }
            else if (lbl.anchorKind === 'end') { autoDx = delta.endDx; autoDy = delta.endDy; }
            else { autoDx = delta.midDx; autoDy = delta.midDy; }
          }
        }

        lbl.el.style.display = edgeHidden ? 'none' : '';
        const lx = lbl.baseTranslate.x + autoDx + (userOff.dx || 0);
        const ly = lbl.baseTranslate.y + autoDy + (userOff.dy || 0);
        lbl.el.setAttribute('transform', `translate(${lx.toFixed(1)}, ${ly.toFixed(1)})`);
      }

      // 4. Update subgraph / cluster bounding frames if member nodes moved
      for (const cl of topology.clusters) {
        if (!cl.memberKeys.length) continue;
        let anyMoved = false;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const mk of cl.memberKeys) {
          const wb = currentWorldBoxes.get(mk);
          if (!wb || wb.hidden) continue;
          if (Math.abs(wb.dx) > 0.5 || Math.abs(wb.dy) > 0.5) anyMoved = true;
          minX = Math.min(minX, wb.x);
          minY = Math.min(minY, wb.y);
          maxX = Math.max(maxX, wb.x + wb.w);
          maxY = Math.max(maxY, wb.y + wb.h);
        }

        if (!anyMoved || !Number.isFinite(minX)) {
          cl.rect.setAttribute('x', cl.origLocalRect.x);
          cl.rect.setAttribute('y', cl.origLocalRect.y);
          cl.rect.setAttribute('width', cl.origLocalRect.w);
          cl.rect.setAttribute('height', cl.origLocalRect.h);
          if (cl.labelG && cl.labelOrigT) {
            cl.labelG.setAttribute('transform', `translate(${cl.labelOrigT.x}, ${cl.labelOrigT.y})`);
          }
          continue;
        }

        const padX = 28;
        const padTop = 38;
        const padBottom = 24;
        const lx = (minX - padX) - cl.totalOffset.x;
        const ly = (minY - padTop) - cl.totalOffset.y;
        const lw = Math.max(120, (maxX - minX) + padX * 2);
        const lh = Math.max(80, (maxY - minY) + padTop + padBottom);

        cl.rect.setAttribute('x', lx.toFixed(1));
        cl.rect.setAttribute('y', ly.toFixed(1));
        cl.rect.setAttribute('width', lw.toFixed(1));
        cl.rect.setAttribute('height', lh.toFixed(1));

        if (cl.labelG && cl.labelOrigT) {
          cl.labelG.setAttribute('transform', `translate(${(lx + lw / 2).toFixed(1)}, ${(ly + 14).toFixed(1)})`);
        }
      }

      // 5. Expand viewBox dynamically so dragged nodes/labels never clip on PNG/SVG export
      let vMinX = topology.initialVB.x;
      let vMinY = topology.initialVB.y;
      let vMaxX = topology.initialVB.x + topology.initialVB.w;
      let vMaxY = topology.initialVB.y + topology.initialVB.h;

      const margin = 28;
      for (const wb of currentWorldBoxes.values()) {
        if (wb.hidden) continue;
        vMinX = Math.min(vMinX, wb.x - margin);
        vMinY = Math.min(vMinY, wb.y - margin);
        vMaxX = Math.max(vMaxX, wb.x + wb.w + margin);
        vMaxY = Math.max(vMaxY, wb.y + wb.h + margin);
      }
      for (const [lKey, lbl] of topology.labels.entries()) {
        if (lbl.el.style.display === 'none') continue;
        const t = parseTransformTranslate(lbl.el.getAttribute('transform'));
        const wx = lbl.parentOffset.x + t.x + lbl.localBBox.x;
        const wy = lbl.parentOffset.y + t.y + lbl.localBBox.y;
        vMinX = Math.min(vMinX, wx - 16);
        vMinY = Math.min(vMinY, wy - 16);
        vMaxX = Math.max(vMaxX, wx + lbl.localBBox.w + 16);
        vMaxY = Math.max(vMaxY, wy + lbl.localBBox.h + 16);
      }

      const finalW = Math.ceil(Math.max(180, vMaxX - vMinX));
      const finalH = Math.ceil(Math.max(120, vMaxY - vMinY));
      currentSvg.setAttribute('viewBox', `${Math.floor(vMinX)} ${Math.floor(vMinY)} ${finalW} ${finalH}`);
      currentSvg.setAttribute('width', String(finalW));
      currentSvg.setAttribute('height', String(finalH));

      const bgRect = currentSvg.querySelector('rect.mmd-ve-print-bg');
      if (bgRect) {
        bgRect.setAttribute('x', String(Math.floor(vMinX)));
        bgRect.setAttribute('y', String(Math.floor(vMinY)));
        bgRect.setAttribute('width', String(finalW));
        bgRect.setAttribute('height', String(finalH));
      }
    }

    // -------------------------------------------------------------------------
    // Floating Node Style Popover
    // -------------------------------------------------------------------------
    function closePopover() {
      selectedNodeKey = null;
      if (popoverEl) {
        popoverEl.hidden = true;
      }
      if (currentSvg) {
        currentSvg.querySelectorAll('.mmd-ve-selected').forEach((n) => n.classList.remove('mmd-ve-selected'));
      }
    }

    function ensurePopoverDOM() {
      if (popoverEl || !viewportEl) return popoverEl;
      popoverEl = document.createElement('div');
      popoverEl.className = 'mmd-ve-popover';
      popoverEl.hidden = true;
      popoverEl.addEventListener('mousedown', (e) => e.stopPropagation());
      popoverEl.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      viewportEl.appendChild(popoverEl);
      return popoverEl;
    }

    function openNodePopover(nodeKey, anchorClientX, anchorClientY) {
      if (!viewportEl || !topology || !topology.nodes.has(nodeKey)) return;
      const pop = ensurePopoverDOM();
      if (!pop) return;

      selectedNodeKey = nodeKey;
      const nd = topology.nodes.get(nodeKey);
      const scopeData = ensureScope(activeScope);
      const curStyle = scopeData.nodeStyles[nodeKey] || {};
      const curOff = scopeData.nodeOffsets[nodeKey] || { dx: 0, dy: 0 };

      const swatchesHtml = Object.entries(STYLE_PRESETS).map(([pKey, pInfo]) => {
        const isAct = (curStyle.preset || '') === pKey;
        const swatchBg = pInfo.fill || 'var(--card-bg)';
        const swatchBd = pInfo.stroke || 'var(--panel-header-border)';
        return `<button type="button" class="mmd-ve-swatch${isAct ? ' active' : ''}" data-preset="${pKey}" title="${pInfo.label}" style="background:${swatchBg}; border-color:${swatchBd};">${pKey === '' ? '↺' : ''}</button>`;
      }).join('');

      const hasNodeMove = Math.abs(curOff.dx || 0) > 0.5 || Math.abs(curOff.dy || 0) > 0.5;

      pop.innerHTML = `
        <div class="mmd-ve-pop-head">
          <span class="mmd-ve-pop-title" title="${nd.label}">${nd.label}</span>
          <button type="button" class="mmd-ve-pop-close" aria-label="Κλείσιμο">&times;</button>
        </div>
        <div class="mmd-ve-swatches">${swatchesHtml}</div>
        <div class="mmd-ve-pop-actions">
          <button type="button" class="tool-mini-btn${curStyle.bold ? ' active' : ''}" data-toggle="bold" title="Έντονο περίγραμμα">Bold</button>
          <button type="button" class="tool-mini-btn${curStyle.dashed ? ' active' : ''}" data-toggle="dashed" title="Διακεκομμένο περίγραμμα">Dashed</button>
          ${hasNodeMove ? '<button type="button" class="tool-mini-btn" data-act="reset-pos" title="Επαναφορά θέσης αυτού του κόμβου">Θέση ↺</button>' : ''}
          <button type="button" class="tool-mini-btn" data-act="hide" title="Προσωρινή απόκρυψη κόμβου (χωρίς αλλαγή κώδικα)">Απόκρυψη</button>
        </div>
      `;

      pop.hidden = false;

      // Position neatly inside viewport bounds
      const vRect = viewportEl.getBoundingClientRect();
      const relX = Math.max(8, Math.min(vRect.width - 236, anchorClientX - vRect.left + 10));
      const relY = Math.max(8, Math.min(vRect.height - 124, anchorClientY - vRect.top - 16));
      pop.style.left = `${relX}px`;
      pop.style.top = `${relY}px`;

      pop.querySelector('.mmd-ve-pop-close').addEventListener('click', closePopover);

      pop.querySelectorAll('.mmd-ve-swatch').forEach((btn) => {
        btn.addEventListener('click', () => {
          pushUndoSnapshot(activeScope);
          const p = btn.getAttribute('data-preset') || '';
          const d = ensureScope(activeScope);
          d.nodeStyles[nodeKey] = { ...(d.nodeStyles[nodeKey] || {}), preset: p };
          refreshGeometry();
          saveState();
          openNodePopover(nodeKey, anchorClientX, anchorClientY);
        });
      });

      pop.querySelectorAll('[data-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          pushUndoSnapshot(activeScope);
          const prop = btn.getAttribute('data-toggle');
          const d = ensureScope(activeScope);
          const prev = d.nodeStyles[nodeKey] || {};
          d.nodeStyles[nodeKey] = { ...prev, [prop]: !prev[prop] };
          refreshGeometry();
          saveState();
          openNodePopover(nodeKey, anchorClientX, anchorClientY);
        });
      });

      const resetPosBtn = pop.querySelector('[data-act="reset-pos"]');
      if (resetPosBtn) {
        resetPosBtn.addEventListener('click', () => {
          pushUndoSnapshot(activeScope);
          const d = ensureScope(activeScope);
          delete d.nodeOffsets[nodeKey];
          refreshGeometry();
          saveState();
          openNodePopover(nodeKey, anchorClientX, anchorClientY);
        });
      }

      const hideBtn = pop.querySelector('[data-act="hide"]');
      if (hideBtn) {
        hideBtn.addEventListener('click', () => {
          pushUndoSnapshot(activeScope);
          const d = ensureScope(activeScope);
          d.nodeStyles[nodeKey] = { ...(d.nodeStyles[nodeKey] || {}), hidden: true };
          closePopover();
          refreshGeometry();
          saveState();
          showToast('Ο κόμβος αποκρύφθηκε οπτικά (πατήστε «↺ Διάταξη» ή Αναίρεση για επαναφορά).');
        });
      }

      refreshGeometry();
    }

    // -------------------------------------------------------------------------
    // Drag Interaction Engine (Mouse & Touch)
    // -------------------------------------------------------------------------
    const drag = {
      active: false,
      kind: null, // 'node' | 'label'
      key: null,
      moved: false,
      startClientX: 0,
      startClientY: 0,
      origDx: 0,
      origDy: 0,
      rafId: 0
    };

    function getClientCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.changedTouches && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function onGlobalMove(e) {
      if (!drag.active) return;
      const pt = getClientCoords(e);
      const scale = Math.max(0.05, getScale() || 1);
      const rawDx = (pt.x - drag.startClientX) / scale;
      const rawDy = (pt.y - drag.startClientY) / scale;

      if (!drag.moved && Math.hypot(pt.x - drag.startClientX, pt.y - drag.startClientY) > 4) {
        drag.moved = true;
        pushUndoSnapshot(activeScope);
        closePopover();
      }
      if (!drag.moved) return;
      if (e.cancelable) e.preventDefault();

      const scopeData = ensureScope(activeScope);
      if (drag.kind === 'node') {
        const snap = 4;
        scopeData.nodeOffsets[drag.key] = {
          dx: Math.round((drag.origDx + rawDx) / snap) * snap,
          dy: Math.round((drag.origDy + rawDy) / snap) * snap
        };
      } else if (drag.kind === 'label') {
        scopeData.labelOffsets[drag.key] = {
          dx: Math.round(drag.origDx + rawDx),
          dy: Math.round(drag.origDy + rawDy)
        };
      }

      if (!drag.rafId) {
        drag.rafId = requestAnimationFrame(() => {
          drag.rafId = 0;
          refreshGeometry();
        });
      }
    }

    function onGlobalUp(e) {
      if (!drag.active) return;
      const wasMoved = drag.moved;
      const kind = drag.kind;
      const key = drag.key;
      const pt = getClientCoords(e);
      drag.active = false;
      drag.kind = null;
      drag.key = null;

      if (wasMoved) {
        refreshGeometry();
        saveState();
      } else if (kind === 'node' && key) {
        openNodePopover(key, pt.x, pt.y);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', onGlobalMove);
      window.addEventListener('mouseup', onGlobalUp);
      window.addEventListener('touchmove', onGlobalMove, { passive: false });
      window.addEventListener('touchend', onGlobalUp);
    }

    if (viewportEl) {
      viewportEl.addEventListener('mousedown', (e) => {
        if (popoverEl && !popoverEl.hidden && !popoverEl.contains(e.target)) {
          if (!e.target.closest || !e.target.closest('.mmd-ve-node')) {
            closePopover();
          }
        }
      });
    }

    function bindInteractiveElements() {
      if (!topology) return;

      for (const [nKey, nd] of topology.nodes.entries()) {
        const startDragNode = (e) => {
          if (e.type === 'mousedown' && e.button !== 0) return;
          e.stopPropagation();
          if (e.type === 'mousedown') e.preventDefault();
          const pt = getClientCoords(e);
          const cur = (ensureScope(activeScope).nodeOffsets || {})[nKey] || { dx: 0, dy: 0 };
          drag.active = true;
          drag.kind = 'node';
          drag.key = nKey;
          drag.moved = false;
          drag.startClientX = pt.x;
          drag.startClientY = pt.y;
          drag.origDx = cur.dx || 0;
          drag.origDy = cur.dy || 0;
        };
        nd.el.addEventListener('mousedown', startDragNode);
        nd.el.addEventListener('touchstart', startDragNode, { passive: true });
      }

      for (const [lKey, lbl] of topology.labels.entries()) {
        const startDragLabel = (e) => {
          if (e.type === 'mousedown' && e.button !== 0) return;
          e.stopPropagation();
          if (e.type === 'mousedown') e.preventDefault();
          const pt = getClientCoords(e);
          const cur = (ensureScope(activeScope).labelOffsets || {})[lKey] || { dx: 0, dy: 0 };
          drag.active = true;
          drag.kind = 'label';
          drag.key = lKey;
          drag.moved = false;
          drag.startClientX = pt.x;
          drag.startClientY = pt.y;
          drag.origDx = cur.dx || 0;
          drag.origDy = cur.dy || 0;
        };
        lbl.el.addEventListener('mousedown', startDragLabel);
        lbl.el.addEventListener('touchstart', startDragLabel, { passive: true });
      }
    }

    // -------------------------------------------------------------------------
    // Public Controller Methods
    // -------------------------------------------------------------------------
    function attachToSVG(svgEl, scopeName = 'default') {
      activeScope = scopeName || 'default';
      ensureScope(activeScope);
      closePopover();
      currentSvg = svgEl;
      if (!svgEl) {
        topology = null;
        notifyStatus();
        return;
      }

      topology = captureTopology(svgEl);
      applyPrintModeStyles(svgEl, state.config.printMode);
      refreshGeometry();
      bindInteractiveElements();
      notifyStatus();
    }

    function setConfig(patch = {}) {
      state.config = { ...state.config, ...patch };
      saveState();
      onConfigChange(state.config);
    }

    function undo() {
      const stack = undoStacks[activeScope];
      if (!stack || stack.length === 0) return false;
      redoStacks[activeScope].push(cloneScopeData(ensureScope(activeScope)));
      state.scopes[activeScope] = stack.pop();
      closePopover();
      refreshGeometry();
      saveState();
      return true;
    }

    function redo() {
      const stack = redoStacks[activeScope];
      if (!stack || stack.length === 0) return false;
      undoStacks[activeScope].push(cloneScopeData(ensureScope(activeScope)));
      state.scopes[activeScope] = stack.pop();
      closePopover();
      refreshGeometry();
      saveState();
      return true;
    }

    function resetVisualEdits(scopeName) {
      const s = scopeName || activeScope;
      if (countEdits(s) === 0) return false;
      pushUndoSnapshot(s);
      state.scopes[s] = { nodeOffsets: {}, labelOffsets: {}, nodeStyles: {} };
      closePopover();
      refreshGeometry();
      saveState();
      return true;
    }

    return {
      attachToSVG,
      getMermaidInitConfig,
      getConfig: () => ({ ...state.config }),
      setConfig,
      undo,
      redo,
      resetVisualEdits,
      countEdits,
      closePopover
    };
  }

  // Shared helper to wire standard toolbar buttons/selects in pli11 & pli11-classes
  function wireToolbar(visualEditor, opts = {}) {
    if (!visualEditor || typeof document === 'undefined') return;
    const doc = opts.root || document;
    const curveSel = doc.getElementById('mermaid-curve-select');
    const spacingSel = doc.getElementById('mermaid-spacing-select');
    const printBtn = doc.getElementById('mermaid-print-btn');
    const undoBtn = doc.getElementById('mermaid-undo-btn');
    const redoBtn = doc.getElementById('mermaid-redo-btn');
    const resetVisBtn = doc.getElementById('mermaid-reset-visual-btn');
    const tabPane = doc.getElementById('tab-mermaid');
    const codeEditor = doc.getElementById('mermaid-code-view');
    const showToast = typeof opts.showToast === 'function' ? opts.showToast : () => {};

    const cfg = visualEditor.getConfig();
    if (curveSel) {
      curveSel.value = cfg.curve || 'basis';
      curveSel.addEventListener('change', () => {
        visualEditor.setConfig({ curve: curveSel.value });
      });
    }
    if (spacingSel) {
      spacingSel.value = cfg.spacing || 'normal';
      spacingSel.addEventListener('change', () => {
        visualEditor.setConfig({ spacing: spacingSel.value });
      });
    }
    if (printBtn) {
      printBtn.classList.toggle('active', Boolean(cfg.printMode));
      printBtn.addEventListener('click', () => {
        const next = !visualEditor.getConfig().printMode;
        printBtn.classList.toggle('active', next);
        visualEditor.setConfig({ printMode: next });
        showToast(next ? 'Mermaid: Ασπρόμαυρη μορφή (Word) ενεργή.' : 'Mermaid: Έγχρωμη μορφή.');
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        visualEditor.undo();
      });
    }
    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        visualEditor.redo();
      });
    }
    if (resetVisBtn) {
      resetVisBtn.addEventListener('click', () => {
        if (visualEditor.resetVisualEdits()) {
          if (typeof opts.onReset === 'function') opts.onReset();
          showToast('Οι οπτικές μετακινήσεις/χρώματα επαναφέρθηκαν!');
        }
      });
    }

    doc.addEventListener('keydown', (e) => {
      if (!tabPane || !tabPane.classList.contains('active')) return;
      if (doc.activeElement === codeEditor) return;
      if (doc.activeElement && (doc.activeElement.tagName === 'INPUT' || doc.activeElement.tagName === 'TEXTAREA')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (visualEditor.undo()) e.preventDefault();
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        if (visualEditor.redo()) e.preventDefault();
      }
    });
  }

  return {
    STYLE_PRESETS,
    extractNodeKey,
    parseTransformTranslate,
    parsePathEndpoints,
    translateSvgPathD,
    computePortPair,
    buildEdgePathD,
    createMermaidVisualEditor,
    wireToolbar
  };
}));
