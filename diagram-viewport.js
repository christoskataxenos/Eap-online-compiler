// -----------------------------------------------------------------------------
// EAP Online Compiler — Shared diagram viewport engine (diagram-viewport.js)
// One pan/zoom implementation used by ΔΔΠ, ΔΡΔ and Class Diagram canvases,
// plus a generic drag helper for resizer handles. Exposes window.EAPViewport.
// -----------------------------------------------------------------------------

(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Pan & Zoom for an SVG canvas inside a viewport.
  //   viewportEl : the scrollable/clipped container (receives mouse/touch/wheel)
  //   canvasEl   : the absolutely-positioned element that gets the transform
  //   zoomLabelEl: optional element showing the zoom percentage
  // Returns { state, fit, zoomBy, zoomIn, zoomOut, wasDragged, applyTransform, reset }
  // ---------------------------------------------------------------------------
  function createPanZoom(viewportEl, canvasEl, zoomLabelEl, opts = {}) {
    const state = {
      scale: 1,
      tx: opts.initialTx !== undefined ? opts.initialTx : 16,
      ty: opts.initialTy !== undefined ? opts.initialTy : 16,
      dragging: false,
      startX: 0,
      startY: 0,
      moved: false
    };
    const minScale = opts.minScale !== undefined ? opts.minScale : 0.2;
    const maxScale = opts.maxScale !== undefined ? opts.maxScale : 2.6;
    const fitMin = opts.fitMin !== undefined ? opts.fitMin : 0.25;
    const fitMax = opts.fitMax !== undefined ? opts.fitMax : 1.25;

    function applyTransform() {
      canvasEl.style.transform =
        `translate(${state.tx.toFixed(1)}px, ${state.ty.toFixed(1)}px) scale(${state.scale.toFixed(3)})`;
      if (zoomLabelEl) zoomLabelEl.textContent = Math.round(state.scale * 100) + '%';
    }

    function svgSize() {
      const svg = canvasEl.querySelector('svg');
      if (!svg) return null;
      const sw = parseFloat(svg.getAttribute('width')) || (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width) || 800;
      const sh = parseFloat(svg.getAttribute('height')) || (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height) || 450;
      return { sw, sh };
    }

    function fit(resetIfHidden = true) {
      const size = svgSize();
      if (!size) return;
      const vw = viewportEl.clientWidth;
      const vh = viewportEl.clientHeight;
      if (vw <= 10 || vh <= 10) {
        if (resetIfHidden) reset();
        return;
      }
      const pad = 32;
      const scaleX = (vw - pad * 2) / size.sw;
      const scaleY = (vh - pad * 2) / size.sh;
      state.scale = Math.max(fitMin, Math.min(fitMax, Math.min(scaleX, scaleY)));
      state.tx = Math.max(pad, (vw - size.sw * state.scale) / 2);
      state.ty = Math.max(pad, (vh - size.sh * state.scale) / 2);
      applyTransform();
    }

    function zoomBy(factor, cx = null, cy = null) {
      const vw = viewportEl.clientWidth || 400;
      const vh = viewportEl.clientHeight || 300;
      const pivotX = cx !== null ? cx : vw / 2;
      const pivotY = cy !== null ? cy : vh / 2;
      const newScale = Math.max(minScale, Math.min(maxScale, state.scale * factor));
      const ratio = newScale / state.scale;
      state.tx = pivotX - (pivotX - state.tx) * ratio;
      state.ty = pivotY - (pivotY - state.ty) * ratio;
      state.scale = newScale;
      applyTransform();
    }

    function reset() {
      state.scale = 1;
      state.tx = 12;
      state.ty = 12;
      applyTransform();
    }

    // --- Mouse pan ---
    viewportEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      state.dragging = true;
      state.moved = false;
      state.startX = e.clientX - state.tx;
      state.startY = e.clientY - state.ty;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.dragging) return;
      const nx = e.clientX - state.startX;
      const ny = e.clientY - state.startY;
      if (Math.abs(nx - state.tx) > 4 || Math.abs(ny - state.ty) > 4) state.moved = true;
      state.tx = nx;
      state.ty = ny;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      state.dragging = false;
    });

    // --- Touch pan (single finger) ---
    let lastTouch = null;
    viewportEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        state.dragging = true;
        state.moved = false;
      }
    }, { passive: true });

    viewportEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && lastTouch && state.dragging) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - lastTouch.x;
        const dy = t.clientY - lastTouch.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) state.moved = true;
        state.tx += dx;
        state.ty += dy;
        lastTouch = { x: t.clientX, y: t.clientY };
        applyTransform();
      }
    }, { passive: false });

    viewportEl.addEventListener('touchend', () => {
      state.dragging = false;
      lastTouch = null;
    });

    // --- Wheel zoom (cursor-anchored) ---
    viewportEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewportEl.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    applyTransform();

    return {
      state,
      fit,
      zoomBy,
      zoomIn: () => zoomBy(1.18),
      zoomOut: () => zoomBy(0.84),
      wasDragged: () => state.moved,
      applyTransform,
      reset
    };
  }

  // ---------------------------------------------------------------------------
  // Generic drag helper for resizer handles.
  //   attachDrag(handleEl, {
  //     getCursor: () => 'row-resize' | 'col-resize' | ...,
  //     onStart(e), onMove(e), onEnd(e), onDblClick(e)
  //   })
  // Handles mousedown/mousemove/mouseup, body cursor + userSelect cleanup.
  // ---------------------------------------------------------------------------
  function attachDrag(handleEl, handlers = {}) {
    let active = false;

    const onMouseDown = (e) => {
      active = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = typeof handlers.getCursor === 'function' ? handlers.getCursor() : 'default';
      handleEl.classList.add('resizing');
      if (typeof handlers.onStart === 'function') handlers.onStart(e);
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!active) return;
      if (typeof handlers.onMove === 'function') handlers.onMove(e);
    };

    const onMouseUp = (e) => {
      if (!active) return;
      active = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      handleEl.classList.remove('resizing');
      if (typeof handlers.onEnd === 'function') handlers.onEnd(e);
    };

    handleEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    if (typeof handlers.onDblClick === 'function') {
      handleEl.addEventListener('dblclick', handlers.onDblClick);
    }

    return {
      isActive: () => active,
      cancel: () => {
        active = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        handleEl.classList.remove('resizing');
      }
    };
  }

  global.EAPViewport = { createPanZoom, attachDrag };
})(typeof window !== 'undefined' ? window : globalThis);
