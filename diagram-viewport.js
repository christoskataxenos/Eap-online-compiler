// -----------------------------------------------------------------------------
// EAP Online Compiler — Shared diagram viewport engine (diagram-viewport.js)
// One pan/zoom implementation used by ΔΔΠ, ΔΡΔ, Mermaid and Class Diagram
// canvases, plus a generic drag helper for resizer handles.
// Exposes window.EAPViewport.
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
    if (!viewportEl || !canvasEl) {
      return {
        state: { scale: 1, tx: 0, ty: 0, autoFitted: true },
        fit: () => {},
        zoomBy: () => {},
        zoomIn: () => {},
        zoomOut: () => {},
        wasDragged: () => false,
        applyTransform: () => {},
        reset: () => {}
      };
    }

    const state = {
      scale: 1,
      tx: opts.initialTx !== undefined ? opts.initialTx : 16,
      ty: opts.initialTy !== undefined ? opts.initialTy : 16,
      dragging: false,
      startX: 0,
      startY: 0,
      moved: false,
      autoFitted: true,
      pendingFit: false
    };
    const minScale = opts.minScale !== undefined ? opts.minScale : 0.05;
    const maxScale = opts.maxScale !== undefined ? opts.maxScale : 4.0;
    const fitMin = opts.fitMin !== undefined ? opts.fitMin : 0.05;
    const fitMax = opts.fitMax !== undefined ? opts.fitMax : 1.35;

    function applyTransform() {
      canvasEl.style.transform =
        `translate(${state.tx.toFixed(1)}px, ${state.ty.toFixed(1)}px) scale(${state.scale.toFixed(3)})`;
      if (zoomLabelEl) zoomLabelEl.textContent = Math.round(state.scale * 100) + '%';
    }

    function svgSize() {
      const svg = canvasEl.querySelector('svg');
      if (!svg) return null;
      const wAttr = (svg.getAttribute('width') || '').trim();
      const hAttr = (svg.getAttribute('height') || '').trim();
      const vb = svg.viewBox && svg.viewBox.baseVal;

      let sw = (!wAttr.endsWith('%') ? parseFloat(wAttr) : 0) || (vb && vb.width) || 0;
      let sh = (!hAttr.endsWith('%') ? parseFloat(hAttr) : 0) || (vb && vb.height) || 0;

      if ((!sw || !sh) && typeof svg.getBBox === 'function') {
        try {
          const bb = svg.getBBox();
          if (!sw && bb.width > 0) sw = bb.width + Math.max(0, bb.x) * 2;
          if (!sh && bb.height > 0) sh = bb.height + Math.max(0, bb.y) * 2;
        } catch (e) {
          // Ignore getBBox errors on detached/hidden SVGs
        }
      }
      return { sw: sw || 800, sh: sh || 450 };
    }

    function fit(resetIfHidden = true) {
      const size = svgSize();
      if (!size) {
        state.pendingFit = true;
        return;
      }
      const vw = viewportEl.clientWidth;
      const vh = viewportEl.clientHeight;
      if (vw <= 10 || vh <= 10) {
        state.pendingFit = true;
        if (resetIfHidden) reset(true);
        return;
      }
      const pad = Math.round(Math.min(24, Math.max(10, Math.min(vw, vh) * 0.045)));
      const availW = Math.max(40, vw - pad * 2);
      const availH = Math.max(40, vh - pad * 2);
      const scaleX = availW / size.sw;
      const scaleY = availH / size.sh;
      state.scale = Math.max(fitMin, Math.min(fitMax, Math.min(scaleX, scaleY)));
      state.tx = (vw - size.sw * state.scale) / 2;
      state.ty = (vh - size.sh * state.scale) / 2;
      state.autoFitted = true;
      state.pendingFit = false;
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
      state.autoFitted = false;
      applyTransform();
    }

    function reset(keepPending = false) {
      state.scale = 1;
      state.tx = 12;
      state.ty = 12;
      state.autoFitted = true;
      if (!keepPending) state.pendingFit = false;
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
      if (Math.abs(nx - state.tx) > 4 || Math.abs(ny - state.ty) > 4) {
        state.moved = true;
        state.autoFitted = false;
      }
      state.tx = nx;
      state.ty = ny;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      state.dragging = false;
    });

    // Double-click background to Fit
    viewportEl.addEventListener('dblclick', (e) => {
      if (e.target && typeof e.target.closest === 'function' &&
          e.target.closest('.ddp-node, .dfd-node, .dfd-store, .dfd-entity, .cls-node, button, a, input, select')) {
        return;
      }
      fit(false);
    });

    // --- Touch pan (1 finger) & pinch zoom (2 fingers) ---
    let lastTouch = null;
    let lastPinchDist = null;
    viewportEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPinchDist = null;
        state.dragging = true;
        state.moved = false;
      } else if (e.touches.length === 2) {
        state.dragging = false;
        lastTouch = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.hypot(dx, dy);
      }
    }, { passive: true });

    viewportEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && lastTouch && state.dragging) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - lastTouch.x;
        const dy = t.clientY - lastTouch.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) {
          state.moved = true;
          state.autoFitted = false;
        }
        state.tx += dx;
        state.ty += dy;
        lastTouch = { x: t.clientX, y: t.clientY };
        applyTransform();
      } else if (e.touches.length === 2 && lastPinchDist) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (dist > 8 && lastPinchDist > 8) {
          const rect = viewportEl.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          zoomBy(dist / lastPinchDist, midX, midY);
          lastPinchDist = dist;
        }
      }
    }, { passive: false });

    viewportEl.addEventListener('touchend', () => {
      state.dragging = false;
      lastTouch = null;
      lastPinchDist = null;
    });

    // --- Wheel zoom (cursor-anchored) ---
    viewportEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewportEl.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    // --- Responsive auto-refit when window or splitter resizes ---
    if (typeof ResizeObserver === 'function' && opts.autoResize !== false) {
      let lastW = 0;
      let lastH = 0;
      let rafId = 0;
      const ro = new ResizeObserver((entries) => {
        const entry = entries && entries[0];
        const cr = entry ? entry.contentRect : null;
        const w = cr ? Math.round(cr.width) : viewportEl.clientWidth;
        const h = cr ? Math.round(cr.height) : viewportEl.clientHeight;
        if (w <= 10 || h <= 10) return;
        if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2 && !state.pendingFit) return;
        lastW = w;
        lastH = h;
        if (state.autoFitted || state.pendingFit) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            fit(false);
          });
        }
      });
      ro.observe(viewportEl);
    }

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
  // Generic drag helper for resizer handles (supports both mouse and touch).
  //   attachDrag(handleEl, {
  //     getCursor: () => 'row-resize' | 'col-resize' | ...,
  //     onStart(e), onMove(e), onEnd(e), onDblClick(e)
  //   })
  // ---------------------------------------------------------------------------
  function attachDrag(handleEl, handlers = {}) {
    if (!handleEl) {
      return { isActive: () => false, cancel: () => {} };
    }
    let active = false;

    function withTouchCoords(e) {
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return e;
      return {
        clientX: t.clientX,
        clientY: t.clientY,
        originalEvent: e
      };
    }

    const onMouseDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
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

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      active = true;
      document.body.style.userSelect = 'none';
      handleEl.classList.add('resizing');
      if (typeof handlers.onStart === 'function') handlers.onStart(withTouchCoords(e));
    };

    const onTouchMove = (e) => {
      if (!active) return;
      if (e.cancelable) e.preventDefault();
      if (typeof handlers.onMove === 'function') handlers.onMove(withTouchCoords(e));
    };

    const onTouchEnd = (e) => {
      if (!active) return;
      active = false;
      document.body.style.userSelect = '';
      handleEl.classList.remove('resizing');
      if (typeof handlers.onEnd === 'function') handlers.onEnd(withTouchCoords(e));
    };

    handleEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    handleEl.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);

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
