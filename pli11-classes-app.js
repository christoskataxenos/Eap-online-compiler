// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 Class Diagrams UI Controller
// Dual-Mode: CodeMirror DSL <-> Interactive Visual Builder (2-Way Sync)
// Drag & Drop Class Boxes, EAP Validator, Official OO-Pseudocode, Mermaid
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const Core = window.PLI11ClassesCore;
  const Renderer = window.PLI11ClassesRenderer;
  const Common = window.EAPCommon;
  const Viewport = window.EAPViewport;
  const { PLI11_CLASS_EXAMPLES, PLI11_CLASS_EXAMPLE_CATEGORIES } = window.PLI11ClassesExamples || {};
  const escapeHTML = Common.escapeHTML;
  const showToast = (msg, dur) => Common.showToast(msg, dur);
  const copyTextToClipboard = (txt, okMsg) => Common.copyTextToClipboard(txt, okMsg);

  // DOM References - Header & Nav
  const editorMount = document.getElementById('code-editor-mount');
  const clsSummaryBadge = document.getElementById('cls-summary-badge');
  const exampleSelector = document.getElementById('example-selector');
  const wrapButton = document.getElementById('wrap-button');
  const formatButton = document.getElementById('format-button');
  const shareButton = document.getElementById('share-button');

  // DOM References - Controls
  const compileButton = document.getElementById('compile-button');
  const quickAddClassBtn = document.getElementById('quick-add-class-btn');
  const quickAddRelBtn = document.getElementById('quick-add-rel-btn');
  const liveCompileToggle = document.getElementById('live-compile-toggle');
  const loadButton = document.getElementById('load-button');
  const saveButton = document.getElementById('save-button');
  const clearButton = document.getElementById('clear-button');
  const syntaxHelpButton = document.getElementById('syntax-help-button');
  const dragHandle = document.getElementById('drag-handle');
  const outputContainer = document.querySelector('.output-container');

  // DOM References - Tabs
  const copyPseudocodeBtn = document.getElementById('copy-pseudocode-btn');
  const copyMermaidBtn = document.getElementById('copy-mermaid-btn');

  // DOM References - Diagram Stats & Toolbar
  const cntClasses = document.getElementById('cnt-classes');
  const cntInh = document.getElementById('cnt-inh');
  const cntAgg = document.getElementById('cnt-agg');
  const cntAssoc = document.getElementById('cnt-assoc');
  const cntDep = document.getElementById('cnt-dep');

  const clsViewport = document.getElementById('cls-viewport');
  const clsCanvas = document.getElementById('cls-canvas');
  const clsZoomOut = document.getElementById('cls-zoom-out');
  const clsZoomIn = document.getElementById('cls-zoom-in');
  const clsZoomFit = document.getElementById('cls-zoom-fit');
  const clsAutoLayout = document.getElementById('cls-auto-layout');
  const clsZoomLabel = document.getElementById('cls-zoom-label');
  const optHideVis = document.getElementById('opt-hide-vis');
  const optHideMethods = document.getElementById('opt-hide-methods');
  const optHideTypes = document.getElementById('opt-hide-types');
  const clsCanvasSizeSelect = document.getElementById('cls-canvas-size');
  const clsPrintBtn = document.getElementById('cls-print-btn');
  const clsCopyPng = document.getElementById('cls-copy-png');
  const clsExportSvg = document.getElementById('cls-export-svg');
  const clsExportPng = document.getElementById('cls-export-png');

  // DOM References - Visual Builder
  const builderAddClassBtn = document.getElementById('builder-add-class-btn');
  const builderAddRelBtn = document.getElementById('builder-add-rel-btn');
  const builderClassesGrid = document.getElementById('builder-classes-grid');
  const builderRelsTbody = document.getElementById('builder-rels-tbody');

  // DOM References - Validator
  const valBadge = document.getElementById('val-badge');
  const valSummaryCard = document.getElementById('val-summary-card');
  const valSummaryTitle = document.getElementById('val-summary-title');
  const valSummarySub = document.getElementById('val-summary-sub');
  const valSummaryCounts = document.getElementById('val-summary-counts');
  const valChecklist = document.getElementById('val-checklist');
  const valDiagnosticsList = document.getElementById('val-diagnostics-list');

  // DOM References - Official Pseudocode
  const pseudoDefaultPrivate = document.getElementById('pseudo-default-private');
  const pseudoAddCtor = document.getElementById('pseudo-add-ctor');
  const pseudoCopyInlineBtn = document.getElementById('pseudo-copy-inline-btn');
  const officialPseudocodeView = document.getElementById('official-pseudocode-view');

  // DOM References - Mermaid
  const mermaidToggleCodeBtn = document.getElementById('mermaid-toggle-code-btn');
  const mermaidZoomOut = document.getElementById('mermaid-zoom-out');
  const mermaidZoomIn = document.getElementById('mermaid-zoom-in');
  const mermaidZoomFit = document.getElementById('mermaid-zoom-fit');
  const mermaidZoomLabel = document.getElementById('mermaid-zoom-label');
  const mermaidRerenderBtn = document.getElementById('mermaid-rerender-btn');
  const mermaidSplit = document.getElementById('mermaid-split');
  const mermaidEditorWrap = document.getElementById('mermaid-editor-wrap');
  const mermaidResizer = document.getElementById('mermaid-resizer');
  const mermaidViewport = document.getElementById('mermaid-viewport');
  const mermaidCodeView = document.getElementById('mermaid-code-view');
  const mermaidPreviewHost = document.getElementById('mermaid-preview-host');

  // ---------------------------------------------------------------------------
  // SETTINGS & TOAST
  // ---------------------------------------------------------------------------
  const SettingsManager = Common.SettingsManager;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  let currentCompiled = null;
  let clsPrintMode = false;
  let customPositions = {};
  let selectedClassId = null;
  let mermaidRenderCounter = 0;
  let errorLineHandles = [];

  let builderModel = { classes: [], relations: [] };
  let suppressEditorSync = false;
  let builderDirty = true;

  // ---------------------------------------------------------------------------
  // CODEMIRROR INITIALIZATION
  // ---------------------------------------------------------------------------
  let initialCode = (PLI11_CLASS_EXAMPLES && PLI11_CLASS_EXAMPLES.GE1_2025_2026_LOGISTICS)
    ? PLI11_CLASS_EXAMPLES.GE1_2025_2026_LOGISTICS
    : 'ΚΛΑΣΗ Πελάτης\n  ΚΑΤΗΓΟΡΗΜΑΤΑ\n    κωδικός;\nΤΕΛΟΣ';

  let sharedInitialClsLayout = null;
  const rawSharedCode = Common.loadCodeFromHash();
  if (rawSharedCode) {
    const decoded = Common.decodeSharePayload ? Common.decodeSharePayload(rawSharedCode) : { code: rawSharedCode, layout: null };
    initialCode = decoded.code;
    sharedInitialClsLayout = decoded.layout;
  }

  const isDarkInitial = Common.getTheme() === 'dark';
  let lineWrapEnabled = SettingsManager.get('pli11ClassesLineWrap', 'true') !== 'false';

  const editor = CodeMirror(editorMount, {
    value: initialCode,
    mode: 'eap-pli11-classes',
    theme: isDarkInitial ? 'dracula' : 'default',
    lineNumbers: true,
    gutters: ['CodeMirror-linenumbers', 'cm-pli11-diag'],
    lineWrapping: lineWrapEnabled,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'F5': () => runCompile({ switchToErrorsIfFailed: true }),
      'Ctrl-Shift-F': () => formatEditorCode(),
      'Tab': (cm) => {
        if (cm.somethingSelected()) cm.indentSelection('add');
        else cm.replaceSelection('  ', 'end');
      }
    },
    hintOptions: { completeSingle: false }
  });

  // Populate Example Selector
  if (PLI11_CLASS_EXAMPLE_CATEGORIES && exampleSelector) {
    Common.populateExampleSelector(exampleSelector, PLI11_CLASS_EXAMPLE_CATEGORIES, 'Παραδείγματα (Κλάσεις ΠΛΗ11)...', (id) => {
      if (PLI11_CLASS_EXAMPLES && PLI11_CLASS_EXAMPLES[id]) {
        customPositions = {};
        selectedClassId = null;
        builderDirty = true;
        editor.setValue(PLI11_CLASS_EXAMPLES[id]);
        runCompile({ fit: true });
        if (id === 'CLASS_TRAPS_DEMO') {
          switchTab('tab-validator');
        }
        showToast('Το παράδειγμα φορτώθηκε!');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // THEME SYNC
  // ---------------------------------------------------------------------------
  const getCurrentTheme = () => Common.getTheme();

  Common.wireCourseSubmenu();
  Common.wireThemeToggle({
    onChange: () => {
      if (editor) editor.setOption('theme', Common.getTheme() === 'dark' ? 'dracula' : 'default');
      if (currentCompiled) {
        renderDiagramView(false);
        renderMermaidPreview();
      }
    }
  });

  if (wrapButton) {
    wrapButton.classList.toggle('active', lineWrapEnabled);
    wrapButton.addEventListener('click', () => {
      lineWrapEnabled = !lineWrapEnabled;
      SettingsManager.set('pli11ClassesLineWrap', lineWrapEnabled ? 'true' : 'false');
      wrapButton.classList.toggle('active', lineWrapEnabled);
      editor.setOption('lineWrapping', lineWrapEnabled);
      editor.refresh();
      showToast(lineWrapEnabled ? 'Αναδίπλωση γραμμών: Ενεργή' : 'Αναδίπλωση γραμμών: Ανενεργή');
    });
  }

  if (typeof ResizeObserver === 'function' && editorMount && editorMount.parentElement) {
    let cmRaf = 0;
    const cmRo = new ResizeObserver(() => {
      if (cmRaf) cancelAnimationFrame(cmRaf);
      cmRaf = requestAnimationFrame(() => {
        cmRaf = 0;
        editor.refresh();
      });
    });
    cmRo.observe(editorMount.parentElement);
  }

  // ---------------------------------------------------------------------------
  // TABS LOGIC
  // ---------------------------------------------------------------------------
  const tabs = Common.wireTabs((tabId) => {
    if (copyPseudocodeBtn) copyPseudocodeBtn.hidden = tabId !== 'tab-pseudocode';
    if (copyMermaidBtn) copyMermaidBtn.hidden = tabId !== 'tab-mermaid';

    if (tabId === 'tab-diagram') requestAnimationFrame(() => panZoom.fit(false));
    if (tabId === 'tab-builder' && builderDirty) {
      loadCompiledIntoBuilder();
    }
    if (tabId === 'tab-mermaid') {
      renderMermaidPreview({ fit: false });
      requestAnimationFrame(() => mermaidPanZoom.fit(false));
    }
  });

  function switchTab(tabId) {
    tabs.switchTo(tabId);
  }

  // ---------------------------------------------------------------------------
  // PAN & ZOOM + INTERACTIVE CLASS BOX DRAG-AND-DROP ENGINE
  // ---------------------------------------------------------------------------
  // Shared pan/zoom engine (mouse + touch + wheel) — exposes .state for box drag
  const panZoom = Viewport.createPanZoom(clsViewport, clsCanvas, clsZoomLabel, {
    minScale: 0.05,
    maxScale: 4.0,
    fitMin: 0.05,
    fitMax: 1.25
  });
  const mermaidPanZoom = Viewport.createPanZoom(mermaidViewport, mermaidPreviewHost, mermaidZoomLabel);
  const clsUndoBtn = document.getElementById('cls-undo-btn');
  const clsRedoBtn = document.getElementById('cls-redo-btn');
  const clsUndoStack = [];
  const clsRedoStack = [];

  if (sharedInitialClsLayout && sharedInitialClsLayout.cls) {
    customPositions = sharedInitialClsLayout.cls;
  } else {
    try {
      const savedPos = SettingsManager.get('pli11ClsSavedPositionsV1', null);
      if (savedPos) customPositions = JSON.parse(savedPos) || {};
    } catch (e) { /* ignore */ }
  }

  function saveClsPositions() {
    try {
      SettingsManager.set('pli11ClsSavedPositionsV1', JSON.stringify(customPositions));
    } catch (e) { /* ignore */ }
    if (typeof clsWorkspaceMgr !== 'undefined' && clsWorkspaceMgr) clsWorkspaceMgr.onChange();
  }

  function syncClsUndoBtns() {
    if (clsUndoBtn) clsUndoBtn.disabled = clsUndoStack.length === 0;
    if (clsRedoBtn) clsRedoBtn.disabled = clsRedoStack.length === 0;
  }

  function pushClsUndo(snap) {
    clsUndoStack.push(snap);
    if (clsUndoStack.length > 50) clsUndoStack.shift();
    clsRedoStack.length = 0;
    syncClsUndoBtns();
  }

  function undoClsLayout() {
    if (!clsUndoStack.length) return;
    clsRedoStack.push(JSON.parse(JSON.stringify(customPositions)));
    customPositions = clsUndoStack.pop();
    syncClsUndoBtns();
    saveClsPositions();
    renderDiagramView(false);
  }

  function redoClsLayout() {
    if (!clsRedoStack.length) return;
    clsUndoStack.push(JSON.parse(JSON.stringify(customPositions)));
    customPositions = clsRedoStack.pop();
    syncClsUndoBtns();
    saveClsPositions();
    renderDiagramView(false);
  }

  if (clsUndoBtn) clsUndoBtn.addEventListener('click', undoClsLayout);
  if (clsRedoBtn) clsRedoBtn.addEventListener('click', redoClsLayout);

  document.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.closest('.CodeMirror'))) return;
    if (!document.getElementById('tab-diagram').classList.contains('active')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && clsUndoStack.length) {
      e.preventDefault();
      undoClsLayout();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) && clsRedoStack.length) {
      e.preventDefault();
      redoClsLayout();
    }
  });

  const boxDrag = { active: false, moved: false, preSnap: null, classId: null, startClientX: 0, startClientY: 0, startBoxX: 0, startBoxY: 0, rafPending: false };

  window.addEventListener('mousemove', (e) => {
    if (!boxDrag.active) return;
    const dx = (e.clientX - boxDrag.startClientX) / panZoom.state.scale;
    const dy = (e.clientY - boxDrag.startClientY) / panZoom.state.scale;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) boxDrag.moved = true;
    if (!boxDrag.moved) return;
    const snappedX = Math.round((boxDrag.startBoxX + dx) / 8) * 8;
    const snappedY = Math.round((boxDrag.startBoxY + dy) / 8) * 8;
    customPositions[boxDrag.classId] = { x: snappedX, y: snappedY };
    if (!boxDrag.rafPending) {
      boxDrag.rafPending = true;
      requestAnimationFrame(() => {
        boxDrag.rafPending = false;
        renderDiagramView(false);
      });
    }
  });

  window.addEventListener('mouseup', () => {
    if (boxDrag.active) {
      if (boxDrag.moved && boxDrag.preSnap) {
        pushClsUndo(boxDrag.preSnap);
        saveClsPositions();
      }
      boxDrag.active = false;
      boxDrag.moved = false;
      boxDrag.preSnap = null;
    }
  });

  clsZoomOut.addEventListener('click', () => panZoom.zoomBy(0.85));
  clsZoomIn.addEventListener('click', () => panZoom.zoomBy(1.18));
  clsZoomFit.addEventListener('click', () => panZoom.fit());
  clsAutoLayout.addEventListener('click', () => {
    if (Object.keys(customPositions).length > 0) {
      pushClsUndo(JSON.parse(JSON.stringify(customPositions)));
    }
    customPositions = {};
    saveClsPositions();
    selectedClassId = null;
    renderDiagramView(true);
    showToast('Η αυτόματη διάταξη επαναφέρθηκε.');
  });

  // ---------------------------------------------------------------------------
  // CANVAS DIMENSIONS & RENDERERS: DIAGRAM, STATS, VALIDATOR, PSEUDOCODE, MERMAID
  // ---------------------------------------------------------------------------
  const CANVAS_PRESETS = {
    'auto': null,
    'a4-landscape': { width: 1120, height: 790 },
    'a4-portrait': { width: 790, height: 1120 },
    '1280x720': { width: 1280, height: 720 },
    '1920x1080': { width: 1920, height: 1080 }
  };

  let clsCanvasSetting = SettingsManager.get('pli11ClsCanvasSetting', 'auto');
  let clsCustomCanvas = { width: 1400, height: 900 };
  try {
    const rawSaved = SettingsManager.get('pli11ClsCustomCanvas', null);
    if (rawSaved) clsCustomCanvas = JSON.parse(rawSaved);
  } catch (e) { /* ignore */ }

  function getClsCanvasDims() {
    if (clsCanvasSetting === 'auto') return null;
    if (clsCanvasSetting === 'custom') return clsCustomCanvas;
    return CANVAS_PRESETS[clsCanvasSetting] || null;
  }

  if (clsCanvasSizeSelect) {
    clsCanvasSizeSelect.value = clsCanvasSetting;
    clsCanvasSizeSelect.addEventListener('change', () => {
      const val = clsCanvasSizeSelect.value;
      if (val === 'custom') {
        const currentPrompt = `${clsCustomCanvas.width}x${clsCustomCanvas.height}`;
        clsCanvasSizeSelect.value = clsCanvasSetting;
        Common.showPrompt('Εισάγετε διαστάσεις καμβά Κλάσεων (Πλάτος x Ύψος σε px, π.χ. 1600x900):', {
          title: 'Προσαρμοσμένες Διαστάσεις Καμβά',
          defaultValue: currentPrompt,
          onSubmit: (input) => {
            if (!input) return;
            const parts = input.toLowerCase().replace(/[,x×]/g, ' ').trim().split(/\s+/).map(Number);
            if (parts.length >= 2 && parts[0] >= 300 && parts[1] >= 200) {
              clsCustomCanvas = { width: Math.round(parts[0]), height: Math.round(parts[1]) };
              SettingsManager.set('pli11ClsCustomCanvas', JSON.stringify(clsCustomCanvas));
              clsCanvasSetting = 'custom';
              clsCanvasSizeSelect.value = 'custom';
              SettingsManager.set('pli11ClsCanvasSetting', clsCanvasSetting);
              renderDiagramView(true);
              showToast(`Καμβάς Κλάσεων: ${clsCustomCanvas.width} × ${clsCustomCanvas.height} px`);
            } else {
              showToast('Μη έγκυρες διαστάσεις (π.χ. 1600x900).');
            }
          }
        });
        return;
      }
      clsCanvasSetting = val;
      SettingsManager.set('pli11ClsCanvasSetting', clsCanvasSetting);
      renderDiagramView(true);
      const dims = getClsCanvasDims();
      showToast(dims ? `Καμβάς Κλάσεων: ${dims.width} × ${dims.height} px` : 'Καμβάς Κλάσεων: Αυτόματο (Fit)');
    });
  }

  function getRenderOptions(extra = {}) {
    const dims = getClsCanvasDims();
    return {
      theme: getCurrentTheme(),
      printMode: clsPrintMode,
      hideVisibilities: optHideVis.checked,
      hideMethods: optHideMethods.checked,
      hideTypes: optHideTypes.checked,
      positions: customPositions,
      selectedClassId,
      canvasWidth: dims ? dims.width : null,
      canvasHeight: dims ? dims.height : null,
      ...extra
    };
  }

  function clearErrorLineMarks() {
    for (const h of errorLineHandles) {
      editor.removeLineClass(h, 'background', 'cm-pli11-error-line');
    }
    errorLineHandles = [];
    editor.clearGutter('cm-pli11-diag');
  }

  let activeClsPopover = null;
  function closeClsPopover() {
    if (activeClsPopover) {
      activeClsPopover.remove();
      activeClsPopover = null;
    }
  }
  document.addEventListener('mousedown', (e) => {
    if (activeClsPopover && !activeClsPopover.contains(e.target)) closeClsPopover();
  });

  function openClsDiagPopover(clientX, clientY, list) {
    closeClsPopover();
    const d = list[0];
    if (!d) return;
    const pop = Common.el('div', { class: 'eap-canvas-ctx-popover' });
    const canFix = Boolean(d.fixAction && Core.applyClassQuickFix);
    pop.innerHTML = `
      <div class="eap-canvas-ctx-head">
        <span>${d.severity === 'error' ? '❌' : '⚠️'} ${escapeHTML(d.code)} (Γρ. ${d.line})</span>
        <button type="button" class="tool-mini-btn" data-close>&times;</button>
      </div>
      <div style="line-height:1.42;">${escapeHTML(d.message)}</div>
      ${d.hint ? `<div style="font-size:0.73rem; opacity:0.8;">💡 ${escapeHTML(d.hint)}</div>` : ''}
      ${canFix ? `<button type="button" class="val-quickfix-btn" data-fix style="justify-content:center;">🔧 Αυτόματη Διόρθωση</button>` : ''}
    `;
    pop.style.left = Math.min(window.innerWidth - 320, Math.max(8, clientX + 8)) + 'px';
    pop.style.top = Math.min(window.innerHeight - 180, Math.max(8, clientY - 12)) + 'px';
    document.body.appendChild(pop);
    activeClsPopover = pop;
    pop.querySelector('[data-close]').addEventListener('click', closeClsPopover);
    const fixB = pop.querySelector('[data-fix]');
    if (fixB) {
      fixB.addEventListener('click', () => {
        const fixed = Core.applyClassQuickFix(editor.getValue(), d);
        if (fixed !== editor.getValue()) {
          const si = editor.getScrollInfo();
          editor.setValue(fixed);
          editor.scrollTo(si.left, si.top);
          builderDirty = true;
          runCompile({ fit: false });
          showToast('Εφαρμόστηκε αυτόματη διόρθωση!');
        }
        closeClsPopover();
      });
    }
  }

  function jumpToLine(lineNum) {
    if (!lineNum || lineNum < 1) return;
    if (document.body.classList.contains('output-fullscreen')) {
      setOutputFullscreen(false);
    }
    if (typeof setPaneFocus === 'function' && currentPaneFocus === 'output') {
      setPaneFocus('both');
    }
    const target = Math.min(lineNum - 1, editor.lineCount() - 1);
    editor.focus();
    editor.setCursor({ line: target, ch: 0 });
    editor.scrollIntoView({ line: target, ch: 0 }, 120);
  }

  function bindInteractiveClassNodes() {
    clsCanvas.querySelectorAll('.cls-node').forEach((g) => {
      g.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        const cid = g.getAttribute('data-class-id');
        const bx = parseFloat(g.getAttribute('data-x')) || 0;
        const by = parseFloat(g.getAttribute('data-y')) || 0;
        selectedClassId = cid;
        boxDrag.active = true;
        boxDrag.moved = false;
        boxDrag.preSnap = JSON.parse(JSON.stringify(customPositions));
        boxDrag.classId = cid;
        boxDrag.startClientX = e.clientX;
        boxDrag.startClientY = e.clientY;
        boxDrag.startBoxX = bx;
        boxDrag.startBoxY = by;
      });

      g.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const ln = parseInt(g.getAttribute('data-line'), 10);
        if (ln > 0) jumpToLine(ln);
      });

      g.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cid = g.getAttribute('data-class-id');
        const ln = parseInt(g.getAttribute('data-line'), 10) || 0;
        const clsObj = currentCompiled && currentCompiled.model && currentCompiled.model.classes.find((c) => c.id === cid);
        if (!clsObj) return;

        closeClsPopover();
        const pop = Common.el('div', { class: 'eap-canvas-ctx-popover' });
        pop.innerHTML = `
          <div class="eap-canvas-ctx-head">
            <span>🏛️ Κλάση «${escapeHTML(clsObj.name)}»</span>
            <button type="button" class="tool-mini-btn" data-close>&times;</button>
          </div>
          <div class="eap-canvas-ctx-row">
            <input type="text" data-attr-inp placeholder="Νέο κατηγόρημα (π.χ. όνομα)">
            <button type="button" class="tool-mini-btn" data-add-attr>+ Πεδίο</button>
          </div>
          <div class="eap-canvas-ctx-row">
            <input type="text" data-meth-inp placeholder="Νέα μέθοδος (π.χ. υπολόγισε)">
            <button type="button" class="tool-mini-btn" data-add-meth>+ Μέθ.</button>
          </div>
          ${ln > 0 ? `<button type="button" class="tool-mini-btn" data-jump style="width:100%;">↪ Μετάβαση στη Γραμμή ${ln}</button>` : ''}
        `;
        pop.style.left = Math.min(window.innerWidth - 320, Math.max(8, e.clientX)) + 'px';
        pop.style.top = Math.min(window.innerHeight - 200, Math.max(8, e.clientY)) + 'px';
        document.body.appendChild(pop);
        activeClsPopover = pop;

        pop.querySelector('[data-close]').addEventListener('click', closeClsPopover);
        const jumpB = pop.querySelector('[data-jump]');
        if (jumpB) jumpB.addEventListener('click', () => { closeClsPopover(); jumpToLine(ln); });

        pop.querySelector('[data-add-attr]').addEventListener('click', () => {
          const aName = pop.querySelector('[data-attr-inp]').value.trim();
          if (!aName) return;
          if (builderDirty) loadCompiledIntoBuilder();
          const target = builderModel.classes.find((c) => Core.canonicalKey(c.name) === Core.canonicalKey(clsObj.name));
          if (target) {
            target.isImplicit = false;
            target.attributes.push({ visibility: '-', name: aName, type: '' });
            syncBuilderToEditor();
            showToast(`Προστέθηκε το κατηγόρημα «${aName}» στην «${clsObj.name}»!`);
          }
          closeClsPopover();
        });

        pop.querySelector('[data-add-meth]').addEventListener('click', () => {
          const mName = pop.querySelector('[data-meth-inp]').value.trim().replace(/\(\)$/, '');
          if (!mName) return;
          if (builderDirty) loadCompiledIntoBuilder();
          const target = builderModel.classes.find((c) => Core.canonicalKey(c.name) === Core.canonicalKey(clsObj.name));
          if (target) {
            target.isImplicit = false;
            target.methods.push({ visibility: '+', name: mName, params: '', returnType: '' });
            syncBuilderToEditor();
            showToast(`Προστέθηκε η μέθοδος «${mName}()» στην «${clsObj.name}»!`);
          }
          closeClsPopover();
        });
      });
    });
  }

  function renderDiagramView(fitAfter = false) {
    if (!currentCompiled) return;
    clsCanvas.innerHTML = Renderer.renderClassDiagramSVG(currentCompiled.model, getRenderOptions());
    bindInteractiveClassNodes();
    if (fitAfter) {
      requestAnimationFrame(() => panZoom.fit());
    }
  }

  function renderStats() {
    if (!currentCompiled) return;
    const { stats, validation } = currentCompiled;
    cntClasses.textContent = stats.classes;
    cntInh.textContent = stats.inheritance;
    cntAgg.textContent = stats.aggregation + stats.composition;
    cntAssoc.textContent = stats.association;
    cntDep.textContent = stats.dependency;

    const totalRels = stats.inheritance + stats.aggregation + stats.composition + stats.association + stats.dependency;
    clsSummaryBadge.textContent = `${stats.classes} κλάσεις · ${totalRels} σχέσεις${validation.errorCount > 0 ? ' · Σφάλματα' : ''}`;
  }

  function renderValidatorView() {
    const { validation } = currentCompiled;
    const { errorCount, warningCount, infoCount } = validation;

    clearErrorLineMarks();
    const marked = new Set();
    const diagsByLine = new Map();
    for (const d of validation.diagnostics) {
      if (d.line > 0 && (d.severity === 'error' || d.severity === 'warning')) {
        if (!diagsByLine.has(d.line)) diagsByLine.set(d.line, []);
        diagsByLine.get(d.line).push(d);
      }
      if (d.severity === 'error' && d.line > 0 && !marked.has(d.line)) {
        marked.add(d.line);
        const h = editor.addLineClass(Math.min(d.line - 1, editor.lineCount() - 1), 'background', 'cm-pli11-error-line');
        errorLineHandles.push(h);
      }
    }
    for (const [ln, list] of diagsByLine.entries()) {
      const hasErr = list.some((x) => x.severity === 'error');
      const marker = document.createElement('div');
      marker.className = 'cm-pli11-gutter-marker';
      marker.textContent = hasErr ? '❌' : '⚠️';
      marker.title = list.map((x) => `[${x.code}] ${x.message}`).join('\n');
      marker.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openClsDiagPopover(ev.clientX, ev.clientY, list);
      });
      editor.setGutterMarker(Math.min(ln - 1, editor.lineCount() - 1), 'cm-pli11-diag', marker);
    }

    valBadge.classList.remove('has-errors', 'all-ok');
    valSummaryCard.classList.remove('has-errors', 'ok');

    if (errorCount === 0) {
      valBadge.textContent = 'OK';
      valBadge.classList.add('all-ok');
      valSummaryCard.classList.add('ok');
      valSummaryTitle.textContent = 'Έγκυρο Διάγραμμα Κλάσεων (ΕΑΠ ΠΛΗ11)';
      valSummarySub.textContent = warningCount === 0
        ? 'Το διάγραμμα πληροί όλους τους ελέγχους μεθοδολογίας και ΓΕ1.'
        : `Δεν υπάρχουν συντακτικά/δομικά σφάλματα (${warningCount} υποδείξεις βελτίωσης).`;
    } else {
      valBadge.textContent = String(errorCount);
      valBadge.classList.add('has-errors');
      valSummaryCard.classList.add('has-errors');
      valSummaryTitle.textContent = `Εντοπίστηκαν ${errorCount} σφάλματα στο Διάγραμμα Κλάσεων`;
      valSummarySub.textContent = 'Κάντε κλικ σε οποιαδήποτε παρατήρηση παρακάτω για μετάβαση στη γραμμή.';
    }
    valSummaryCounts.textContent = `${errorCount} σφάλματα · ${warningCount} προειδοπ. · ${infoCount} σημειώσεις`;

    valChecklist.innerHTML = validation.checklist.map((item) => {
      const clsMark = item.status || (item.ok ? 'pass' : 'fail');
      const labelMark = clsMark === 'pass' ? 'PASS' : (clsMark === 'warn' ? 'WARN' : 'FAIL');
      return `
        <div class="val-check-item" title="${escapeHTML(item.detail || '')}">
          <span class="val-check-mark ${clsMark}">${labelMark}</span>
          <span>${escapeHTML(item.label)}</span>
        </div>`;
    }).join('');

    if (validation.diagnostics.length === 0) {
      valDiagnosticsList.innerHTML = '<div class="val-diag-item info"><div class="val-diag-msg">Καμία παρατήρηση. Όλα τα στοιχεία είναι έγκυρα.</div></div>';
      return;
    }

    valDiagnosticsList.innerHTML = '';
    for (const d of validation.diagnostics) {
      const div = document.createElement('div');
      div.className = `val-diag-item ${d.severity}`;
      const canFix = Boolean(d.fixAction && Core.applyClassQuickFix);
      div.innerHTML = `
        <div class="val-diag-head">
          <span class="val-diag-code">${escapeHTML(d.code)}</span>
          <span class="val-diag-loc">Γραμμή ${d.line}</span>
        </div>
        <div class="val-diag-msg">${escapeHTML(d.message)}</div>
        ${d.hint ? `<div class="val-diag-hint">Υπόδειξη: ${escapeHTML(d.hint)}</div>` : ''}
        ${canFix ? `<button type="button" class="val-quickfix-btn">🔧 Αυτόματη Διόρθωση</button>` : ''}
      `;
      div.addEventListener('click', () => jumpToLine(d.line));
      const fixBtn = div.querySelector('.val-quickfix-btn');
      if (fixBtn) {
        fixBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const fixedCode = Core.applyClassQuickFix(editor.getValue(), d);
          if (fixedCode !== editor.getValue()) {
            const scrollInfo = editor.getScrollInfo();
            editor.setValue(fixedCode);
            editor.scrollTo(scrollInfo.left, scrollInfo.top);
            builderDirty = true;
            runCompile({ fit: false });
            showToast('Εφαρμόστηκε αυτόματη διόρθωση στο μοντέλο κλάσεων!');
          }
        });
      }
      valDiagnosticsList.appendChild(div);
    }
  }

  function renderOfficialPseudocodeView() {
    if (!currentCompiled) return;
    const text = Core.generateOfficialEAPPseudocode(currentCompiled.model, {
      defaultPrivateAttributes: pseudoDefaultPrivate.checked,
      includeConstructor: pseudoAddCtor.checked,
      includeRelationComments: true
    });
    officialPseudocodeView.textContent = text;
  }

  function getActiveMermaidCode() {
    if (!currentCompiled) return '';
    return Core.generateMermaidClassDiagram(currentCompiled.model, {
      hideVisibilities: optHideVis.checked,
      hideMethods: optHideMethods.checked,
      hideTypes: optHideTypes.checked
    });
  }

  // ---------------------------------------------------------------------------
  // MERMAID PREVIEW, LIVE EDITING & HIGH-RES EXPORTS (SVG / PNG)
  // ---------------------------------------------------------------------------
  let mermaidIsUserEdited = false;
  let mermaidDebounceTimer = null;
  let mermaidVisualEditsCount = 0;

  function updateMermaidStatusBadge() {
    const badge = document.getElementById('mermaid-edit-status');
    if (!badge) return;
    if (mermaidIsUserEdited) {
      badge.textContent = mermaidVisualEditsCount > 0 ? `Κώδικας + Οπτικό (${mermaidVisualEditsCount})` : 'Χειροκίνητο';
      badge.style.color = 'var(--token-string, #ffee00)';
      badge.title = 'Ο κώδικας Mermaid έχει τροποποιηθεί χειροκίνητα.';
    } else if (mermaidVisualEditsCount > 0) {
      badge.textContent = `Οπτικό (${mermaidVisualEditsCount})`;
      badge.style.color = 'var(--accent)';
      badge.title = `${mermaidVisualEditsCount} οπτικές προσαρμογές χωρίς αλλαγή κώδικα!`;
    } else {
      badge.textContent = 'Αυτόματο';
      badge.style.color = '';
      badge.title = 'Συγχρονισμένο αυτόματα με τον κύριο ψευδοκώδικα.';
    }
  }

  const mermaidVisualEditor = window.EAPMermaidEditor
    ? window.EAPMermaidEditor.createMermaidVisualEditor({
        storageKey: 'pli11ClsMermaidVisualV1',
        viewportEl: mermaidViewport,
        getScale: () => (mermaidPanZoom && mermaidPanZoom.state && mermaidPanZoom.state.scale) || 1,
        showToast,
        onConfigChange: () => renderMermaidPreview({ fit: false }),
        onStatusChange: ({ editCount, canUndo, canRedo, config }) => {
          mermaidVisualEditsCount = editCount;
          updateMermaidStatusBadge();
          const uBtn = document.getElementById('mermaid-undo-btn');
          const rBtn = document.getElementById('mermaid-redo-btn');
          const rstBtn = document.getElementById('mermaid-reset-visual-btn');
          const pBtn = document.getElementById('mermaid-print-btn');
          if (uBtn) uBtn.disabled = !canUndo;
          if (rBtn) rBtn.disabled = !canRedo;
          if (rstBtn) rstBtn.hidden = editCount === 0;
          if (pBtn) pBtn.classList.toggle('active', Boolean(config && config.printMode));
        }
      })
    : null;

  if (mermaidVisualEditor && window.EAPMermaidEditor.wireToolbar) {
    window.EAPMermaidEditor.wireToolbar(mermaidVisualEditor, {
      showToast,
      onReset: () => mermaidPanZoom.fit(false)
    });
  }

  async function renderMermaidPreview(opts = {}) {
    if (!mermaidCodeView) return;

    if (opts.forceRegenerate || !mermaidIsUserEdited) {
      const generated = getActiveMermaidCode();
      mermaidCodeView.value = generated;
      if (opts.forceRegenerate) {
        mermaidIsUserEdited = false;
        updateMermaidStatusBadge();
      }
    }

    const code = (mermaidCodeView.value || '').trim();
    if (!code) {
      if (mermaidPreviewHost) mermaidPreviewHost.innerHTML = '<div class="mermaid-offline-note">Κενός κώδικας Mermaid.</div>';
      mermaidPanZoom.reset();
      return;
    }

    if (!window.mermaid) {
      if (mermaidPreviewHost) {
        mermaidPreviewHost.innerHTML = `
          <div class="mermaid-offline-note">
            <strong>Offline Λειτουργία:</strong> Η βιβλιοθήκη προεπισκόπησης Mermaid δεν φορτώθηκε (π.χ. χωρίς σύνδεση).
            <br><br>
            Ο κώδικας <code>classDiagram</code> παραπάνω είναι πλήρως επεξεργάσιμος και έτοιμος για αντιγραφή, ενώ το <strong>Διάγραμμα Κλάσεων SVG</strong> και ο <strong>ΕΑΠ Ψευδοκώδικας</strong> λειτουργούν 100% offline.
          </div>`;
      }
      mermaidPanZoom.reset();
      return;
    }

    try {
      const isDark = getCurrentTheme() === 'dark';
      window.mermaid.initialize(
        mermaidVisualEditor
          ? mermaidVisualEditor.getMermaidInitConfig(isDark)
          : { startOnLoad: false, theme: isDark ? 'dark' : 'default', securityLevel: 'loose' }
      );
      mermaidRenderCounter++;
      const id = `pli11_cls_mmd_${mermaidRenderCounter}`;
      const { svg } = await window.mermaid.render(id, code);
      if (mermaidPreviewHost) {
        mermaidPreviewHost.innerHTML = svg;
        const svgEl = mermaidPreviewHost.querySelector('svg');
        if (svgEl) {
          const vb = svgEl.getAttribute('viewBox');
          if (vb) {
            const parts = vb.trim().split(/[\s,]+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              svgEl.setAttribute('width', String(Math.ceil(parts[2])));
              svgEl.setAttribute('height', String(Math.ceil(parts[3])));
            }
          }
          svgEl.style.maxWidth = 'none';
          svgEl.style.height = 'auto';
          if (mermaidVisualEditor) {
            mermaidVisualEditor.attachToSVG(svgEl, 'classes');
          }
        }
        if (opts.fit !== false || mermaidPanZoom.state.autoFitted || mermaidPanZoom.state.pendingFit) {
          requestAnimationFrame(() => mermaidPanZoom.fit(false));
        } else {
          mermaidPanZoom.applyTransform();
        }
      }
    } catch (err) {
      if (mermaidPreviewHost) {
        mermaidPreviewHost.innerHTML = `<div class="mermaid-offline-note" style="color:var(--term-error); border-color:var(--term-error);">
          <strong>Σφάλμα σύνταξης Mermaid:</strong><br>${escapeHTML(err.message || String(err))}
        </div>`;
      }
      mermaidPanZoom.reset();
    }
  }

  if (mermaidZoomIn) mermaidZoomIn.addEventListener('click', () => mermaidPanZoom.zoomIn());
  if (mermaidZoomOut) mermaidZoomOut.addEventListener('click', () => mermaidPanZoom.zoomOut());
  if (mermaidZoomFit) mermaidZoomFit.addEventListener('click', () => mermaidPanZoom.fit(false));

  let mermaidCodeCollapsed = SettingsManager.get('pli11ClsMermaidCodeCollapsed', 'false') === 'true';
  function applyMermaidCodeCollapse(collapsed) {
    mermaidCodeCollapsed = collapsed;
    SettingsManager.set('pli11ClsMermaidCodeCollapsed', collapsed ? 'true' : 'false');
    if (mermaidSplit) mermaidSplit.classList.toggle('code-collapsed', collapsed);
    if (mermaidToggleCodeBtn) {
      mermaidToggleCodeBtn.classList.toggle('active', !collapsed);
      mermaidToggleCodeBtn.textContent = collapsed ? 'Κώδικας ▸' : 'Κώδικας ▾';
    }
    requestAnimationFrame(() => mermaidPanZoom.fit(false));
  }
  if (mermaidToggleCodeBtn) {
    applyMermaidCodeCollapse(mermaidCodeCollapsed);
    mermaidToggleCodeBtn.addEventListener('click', () => applyMermaidCodeCollapse(!mermaidCodeCollapsed));
  }
  if (mermaidEditorWrap) {
    const savedMmdH = SettingsManager.get('pli11ClsMermaidEditorPct', '30%');
    mermaidEditorWrap.style.height = savedMmdH;
  }
  if (mermaidResizer && mermaidSplit && mermaidEditorWrap) {
    Viewport.attachDrag(mermaidResizer, {
      getCursor: () => 'row-resize',
      onMove: (e) => {
        const rect = mermaidSplit.getBoundingClientRect();
        const newH = e.clientY - rect.top;
        const minH = 68;
        const maxH = Math.max(minH + 20, rect.height - 120);
        if (newH >= minH && newH <= maxH) {
          const pct = ((newH / rect.height) * 100).toFixed(1) + '%';
          mermaidEditorWrap.style.height = pct;
        }
      },
      onEnd: () => {
        SettingsManager.set('pli11ClsMermaidEditorPct', mermaidEditorWrap.style.height);
        mermaidPanZoom.fit(false);
      },
      onDblClick: () => {
        mermaidEditorWrap.style.height = '30%';
        SettingsManager.set('pli11ClsMermaidEditorPct', '30%');
        mermaidPanZoom.fit(false);
      }
    });
  }

  if (mermaidCodeView) {
    mermaidCodeView.addEventListener('input', () => {
      mermaidIsUserEdited = true;
      updateMermaidStatusBadge();
      clearTimeout(mermaidDebounceTimer);
      mermaidDebounceTimer = setTimeout(() => {
        renderMermaidPreview({ fit: false });
      }, 350);
    });

    mermaidCodeView.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = mermaidCodeView.selectionStart;
        const end = mermaidCodeView.selectionEnd;
        mermaidCodeView.value = mermaidCodeView.value.substring(0, start) + '  ' + mermaidCodeView.value.substring(end);
        mermaidCodeView.selectionStart = mermaidCodeView.selectionEnd = start + 2;
        mermaidIsUserEdited = true;
        updateMermaidStatusBadge();
        clearTimeout(mermaidDebounceTimer);
        mermaidDebounceTimer = setTimeout(() => renderMermaidPreview({ fit: false }), 350);
      }
    });
  }

  function getPreparedMermaidSVG() {
    if (!mermaidPreviewHost) return null;
    const svgEl = mermaidPreviewHost.querySelector('svg');
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const vb = clone.getAttribute('viewBox');
    let vbW = 1200;
    let vbH = 600;
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        vbW = Math.ceil(parts[2]);
        vbH = Math.ceil(parts[3]);
      }
    }
    clone.setAttribute('width', String(vbW));
    clone.setAttribute('height', String(vbH));
    clone.style.maxWidth = '';

    // Convert foreignObject to native SVG <text> to prevent browser SecurityError (tainted canvas)
    clone.querySelectorAll('foreignObject').forEach((fo) => {
      const text = fo.textContent.trim();
      const fw = parseFloat(fo.getAttribute('width')) || 0;
      const fh = parseFloat(fo.getAttribute('height')) || 0;
      const fx = parseFloat(fo.getAttribute('x')) || 0;
      const fy = parseFloat(fo.getAttribute('y')) || 0;
      const child = fo.querySelector('span, div, p');
      const textColor = (child && window.getComputedStyle(child).color) || '#0f172a';
      const fontF = (child && window.getComputedStyle(child).fontFamily) || 'sans-serif';
      const fontS = (child && window.getComputedStyle(child).fontSize) || '13px';
      const fontW = (child && window.getComputedStyle(child).fontWeight) || '600';

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', (fx + fw / 2).toFixed(1));
      textEl.setAttribute('y', (fy + fh / 2).toFixed(1));
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'central');
      textEl.setAttribute('fill', textColor);
      textEl.setAttribute('stroke', 'none');
      textEl.style.stroke = 'none';
      textEl.setAttribute('font-size', fontS);
      textEl.setAttribute('font-weight', fontW);
      textEl.setAttribute('font-family', fontF);
      textEl.textContent = text;
      if (fo.parentNode) fo.parentNode.replaceChild(textEl, fo);
    });

    return clone;
  }

  const mermaidExportSvg = document.getElementById('mermaid-export-svg');
  if (mermaidExportSvg) {
    mermaidExportSvg.addEventListener('click', () => {
      const svgEl = getPreparedMermaidSVG();
      if (!svgEl) {
        showToast('Δεν υπάρχει διαθέσιμο διάγραμμα Mermaid προς εξαγωγή.');
        return;
      }
      Renderer.downloadSVG(svgEl, 'mermaid-class-diagram.svg');
      showToast('Έγινε λήψη Mermaid SVG!');
    });
  }

  const mermaidExportPng = document.getElementById('mermaid-export-png');
  if (mermaidExportPng) {
    mermaidExportPng.addEventListener('click', () => {
      const svgEl = getPreparedMermaidSVG();
      if (!svgEl) {
        showToast('Δεν υπάρχει διαθέσιμο διάγραμμα Mermaid προς εξαγωγή.');
        return;
      }
      Renderer.downloadPNG(svgEl, 'mermaid-class-diagram.png', 2)
        .then(() => showToast('Έγινε λήψη Mermaid PNG (HiDPI για MS Word)!'))
        .catch(() => showToast('Αποτυχία εξαγωγής Mermaid PNG.'));
    });
  }

  const mermaidCopyPng = document.getElementById('mermaid-copy-png');
  if (mermaidCopyPng) {
    mermaidCopyPng.addEventListener('click', () => {
      const svgEl = getPreparedMermaidSVG();
      if (!svgEl) {
        showToast('Δεν υπάρχει διαθέσιμο διάγραμμα Mermaid προς εξαγωγή.');
        return;
      }
      Renderer.copyPNGToClipboard(svgEl, 2)
        .then(() => showToast('Το διάγραμμα Mermaid αντιγράφηκε ως PNG! Πατήστε Ctrl+V στο Word.'))
        .catch(() => {
          Renderer.downloadPNG(svgEl, 'mermaid-class-diagram.png', 2)
            .then(() => showToast('Έγινε λήψη αρχείου PNG!'))
            .catch(() => showToast('Αποτυχία εξαγωγής Mermaid PNG.'));
        });
    });
  }

  const mermaidResetBtn = document.getElementById('mermaid-reset-btn');
  if (mermaidResetBtn) {
    mermaidResetBtn.addEventListener('click', () => {
      mermaidIsUserEdited = false;
      updateMermaidStatusBadge();
      renderMermaidPreview({ forceRegenerate: true });
      showToast('Επαναφορά κώδικα Mermaid από τον ψευδοκώδικα!');
    });
  }

  const mermaidCopyCodeBtn = document.getElementById('mermaid-copy-code-btn');
  if (mermaidCopyCodeBtn) {
    mermaidCopyCodeBtn.addEventListener('click', () => {
      const code = mermaidCodeView ? mermaidCodeView.value : getActiveMermaidCode();
      copyTextToClipboard(code, 'Ο κώδικας Mermaid αντιγράφηκε!');
    });
  }

  // Toolbar toggles
  [optHideVis, optHideMethods, optHideTypes].forEach((chk) => {
    chk.addEventListener('change', () => {
      renderDiagramView(false);
      renderMermaidPreview();
    });
  });

  [pseudoDefaultPrivate, pseudoAddCtor].forEach((chk) => {
    chk.addEventListener('change', () => renderOfficialPseudocodeView());
  });

  clsPrintBtn.addEventListener('click', () => {
    clsPrintMode = !clsPrintMode;
    clsPrintBtn.classList.toggle('active', clsPrintMode);
    renderDiagramView(false);
  });

  clsExportSvg.addEventListener('click', () => {
    if (!currentCompiled) return;
    const svg = Renderer.renderClassDiagramSVG(currentCompiled.model, getRenderOptions({ selectedClassId: null }));
    Renderer.downloadSVG(svg, 'pli11-class-diagram.svg');
    showToast('Έγινε λήψη SVG!');
  });

  clsExportPng.addEventListener('click', () => {
    if (!currentCompiled) return;
    const svg = Renderer.renderClassDiagramSVG(
      currentCompiled.model,
      getRenderOptions({ printMode: true, tightCrop: true, selectedClassId: null })
    );
    Renderer.downloadPNG(svg, 'pli11-class-diagram.png', 3)
      .then(() => showToast('Το Διάγραμμα Κλάσεων εξήχθη ως PNG (300+ DPI για Word)!'))
      .catch(() => showToast('Αποτυχία μετατροπής σε PNG.'));
  });

  if (clsCopyPng) {
    clsCopyPng.addEventListener('click', () => {
      if (!currentCompiled) return;
      const svg = Renderer.renderClassDiagramSVG(
        currentCompiled.model,
        getRenderOptions({ printMode: true, tightCrop: true, selectedClassId: null })
      );
      Renderer.copyPNGToClipboard(svg, 3)
        .then(() => showToast('Το Διάγραμμα Κλάσεων αντιγράφηκε ως PNG! Πατήστε Ctrl+V στο Word.'))
        .catch(() => {
          Renderer.downloadPNG(svg, 'pli11-class-diagram.png', 3)
            .then(() => showToast('Έγινε λήψη αρχείου PNG (έτοιμο για Word)!'))
            .catch(() => showToast('Αποτυχία αντιγραφής/λήψης PNG.'));
        });
    });
  }

  pseudoCopyInlineBtn.addEventListener('click', () => {
    copyTextToClipboard(officialPseudocodeView.textContent, 'Ο ΕΑΠ Ψευδοκώδικας αντιγράφηκε!');
  });
  copyPseudocodeBtn.addEventListener('click', () => {
    copyTextToClipboard(officialPseudocodeView.textContent, 'Ο ΕΑΠ Ψευδοκώδικας αντιγράφηκε!');
  });
  if (copyMermaidBtn) {
    copyMermaidBtn.addEventListener('click', () => {
      const code = mermaidCodeView && mermaidCodeView.value ? mermaidCodeView.value : getActiveMermaidCode();
      copyTextToClipboard(code, 'Ο κώδικας Mermaid αντιγράφηκε!');
    });
  }
  mermaidRerenderBtn.addEventListener('click', () => renderMermaidPreview());

  window.addEventListener('load', () => {
    if (currentCompiled) renderMermaidPreview();
  });

  // ---------------------------------------------------------------------------
  // VISUAL BUILDER (2-WAY SYNC WITHOUT FOCUS LOSS)
  // ---------------------------------------------------------------------------
  function loadCompiledIntoBuilder() {
    if (!currentCompiled || !currentCompiled.model) return;
    const src = currentCompiled.model;

    builderModel = {
      classes: src.classes.map((c) => ({
        id: c.id,
        name: c.name,
        isImplicit: Boolean(c.isImplicit),
        parent: (c.parents && c.parents[0]) || '',
        attributes: (c.attributes || []).map((a) => ({
          visibility: a.visibility || '',
          name: a.name || '',
          type: a.type || ''
        })),
        methods: (c.methods || []).map((m) => ({
          visibility: m.visibility || '',
          name: m.name || '',
          params: m.params || '',
          returnType: m.returnType || ''
        }))
      })),
      // Keep inheritance relationships represented on rels when not strictly implied by cls.parent or keep all non-ΕΠΕΚΤΕΙΝΕΙ relations + explicit ones cleanly
      relations: []
    };

    const classParentMap = new Map();
    for (const c of builderModel.classes) {
      if (c.parent) classParentMap.set(Core.canonicalKey(c.name), Core.canonicalKey(c.parent));
    }

    for (const r of src.relations || []) {
      const fk = Core.canonicalKey(r.from);
      const tk = Core.canonicalKey(r.to);
      if (r.kind === 'inheritance' && classParentMap.get(fk) === tk && !r.fromMult && !r.toMult) {
        continue; // already shown as class.parent dropdown
      }
      builderModel.relations.push({
        kind: r.kind,
        from: r.from,
        to: r.to,
        fromMult: r.fromMult || '',
        toMult: r.toMult || '',
        label: r.label || '',
        assocClass: r.assocClass || ''
      });
    }

    builderDirty = false;
    renderBuilderDOM();
  }

  function builderModelToCoreModel() {
    const classes = builderModel.classes.map((c, idx) => ({
      id: c.id || `cls_${idx + 1}`,
      name: Core.normalizeClassName(c.name) || `Κλάση_${idx + 1}`,
      parents: c.parent ? [Core.normalizeClassName(c.parent)] : [],
      attributes: c.attributes
        .filter((a) => a.name && a.name.trim())
        .map((a) => ({ visibility: a.visibility || '', name: a.name.trim(), type: (a.type || '').trim() })),
      methods: c.methods
        .filter((m) => m.name && m.name.trim())
        .map((m) => ({
          visibility: m.visibility || '',
          name: m.name.trim(),
          params: (m.params || '').trim(),
          returnType: (m.returnType || '').trim()
        })),
      isImplicit: false
    }));

    const relations = builderModel.relations
      .filter((r) => r.from && r.to)
      .map((r) => ({
        kind: r.kind || 'association',
        from: Core.normalizeClassName(r.from),
        to: Core.normalizeClassName(r.to),
        fromMult: (r.fromMult || '').trim(),
        toMult: (r.toMult || '').trim(),
        label: (r.label || '').trim(),
        assocClass: r.kind === 'association' ? Core.normalizeClassName(r.assocClass || '') : ''
      }));

    return { classes, relations };
  }

  function syncBuilderToEditor() {
    const dsl = Core.serializeToDSL(builderModelToCoreModel());
    suppressEditorSync = true;
    editor.setValue(dsl);
    suppressEditorSync = false;
    builderDirty = false;
    runCompile({ fit: false, skipBuilderSync: true });
  }

  function getClassOptionsHTML(selectedName, excludeName) {
    const selKey = Core.canonicalKey(selectedName);
    const exKey = excludeName ? Core.canonicalKey(excludeName) : '';
    const opts = ['<option value="">- Επιλογή -</option>'];
    for (const c of builderModel.classes) {
      if (exKey && Core.canonicalKey(c.name) === exKey) continue;
      const sel = Core.canonicalKey(c.name) === selKey ? 'selected' : '';
      opts.push(`<option value="${escapeHTML(c.name)}" ${sel}>${escapeHTML(c.name)}</option>`);
    }
    return opts.join('');
  }

  function renderBuilderDOM() {
    // Render Classes Grid
    builderClassesGrid.innerHTML = '';
    builderModel.classes.forEach((cls, cIdx) => {
      const card = document.createElement('div');
      card.className = `cls-card${cls.isImplicit ? ' is-implicit' : ''}`;

      const parentOpts = ['<option value="">(Καμία υπερκλάση)</option>'];
      for (const other of builderModel.classes) {
        if (other === cls) continue;
        const sel = Core.canonicalKey(other.name) === Core.canonicalKey(cls.parent) ? 'selected' : '';
        parentOpts.push(`<option value="${escapeHTML(other.name)}" ${sel}>${escapeHTML(other.name)}</option>`);
      }

      const attrsHtml = cls.attributes.map((a, aIdx) => `
        <div class="cls-member-row" data-member="attr" data-idx="${aIdx}">
          <select data-field="visibility" title="Ορατότητα">
            <option value="" ${a.visibility === '' ? 'selected' : ''}>(κενό)</option>
            <option value="-" ${a.visibility === '-' ? 'selected' : ''}>- priv</option>
            <option value="+" ${a.visibility === '+' ? 'selected' : ''}>+ pub</option>
            <option value="#" ${a.visibility === '#' ? 'selected' : ''}># prot</option>
          </select>
          <input type="text" data-field="name" value="${escapeHTML(a.name)}" placeholder="όνομα">
          <input type="text" class="cls-type-input" data-field="type" value="${escapeHTML(a.type)}" placeholder="Τύπος">
          <button type="button" class="cls-icon-btn danger" data-del-attr="${aIdx}" title="Διαγραφή κατηγορήματος">&times;</button>
        </div>
      `).join('');

      const methodsHtml = cls.methods.map((m, mIdx) => `
        <div class="cls-member-row" data-member="method" data-idx="${mIdx}">
          <select data-field="visibility" title="Ορατότητα">
            <option value="" ${m.visibility === '' ? 'selected' : ''}>(κενό)</option>
            <option value="+" ${m.visibility === '+' ? 'selected' : ''}>+ pub</option>
            <option value="-" ${m.visibility === '-' ? 'selected' : ''}>- priv</option>
            <option value="#" ${m.visibility === '#' ? 'selected' : ''}># prot</option>
          </select>
          <input type="text" data-field="name" value="${escapeHTML(m.name)}" placeholder="μέθοδος">
          <input type="text" class="cls-params-input" data-field="params" value="${escapeHTML(m.params)}" placeholder="παράμ.">
          <input type="text" class="cls-type-input" data-field="returnType" value="${escapeHTML(m.returnType)}" placeholder="Επιστρ.">
          <button type="button" class="cls-icon-btn danger" data-del-method="${mIdx}" title="Διαγραφή μεθόδου">&times;</button>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="cls-card-header">
          <input type="text" data-cls-field="name" value="${escapeHTML(cls.name)}" placeholder="Όνομα Κλάσης">
          <button type="button" class="cls-icon-btn danger" data-del-cls="${cIdx}" title="Διαγραφή κλάσης">Διαγρ.</button>
        </div>
        <div class="cls-card-parent-row">
          <label>ΕΠΕΚΤΕΙΝΕΙ:</label>
          <select data-cls-field="parent">${parentOpts.join('')}</select>
        </div>
        <div>
          <div class="cls-subblock-head">
            <span>Κατηγορήματα (${cls.attributes.length})</span>
            <button type="button" class="cls-icon-btn" data-add-attr="${cIdx}">+ Κατηγόρημα</button>
          </div>
          <div class="cls-members-list">${attrsHtml}</div>
        </div>
        <div>
          <div class="cls-subblock-head">
            <span>Μέθοδοι (${cls.methods.length})</span>
            <button type="button" class="cls-icon-btn" data-add-method="${cIdx}">+ Μέθοδος</button>
          </div>
          <div class="cls-members-list">${methodsHtml}</div>
        </div>
      `;

      // Wire Class Header & Parent without tearing down DOM on typing
      let prevClassName = cls.name;
      const nameInput = card.querySelector('input[data-cls-field="name"]');
      nameInput.addEventListener('input', () => {
        const nextName = Core.normalizeClassName(nameInput.value);
        if (!nextName) return;
        const oldKey = Core.canonicalKey(prevClassName);
        cls.name = nextName;
        // Propagate rename in memory across relations & parents
        builderModel.classes.forEach((other) => {
          if (Core.canonicalKey(other.parent) === oldKey) other.parent = nextName;
        });
        builderModel.relations.forEach((rel) => {
          if (Core.canonicalKey(rel.from) === oldKey) rel.from = nextName;
          if (Core.canonicalKey(rel.to) === oldKey) rel.to = nextName;
          if (Core.canonicalKey(rel.assocClass) === oldKey) rel.assocClass = nextName;
        });
        prevClassName = nextName;
        syncBuilderToEditor();
      });
      nameInput.addEventListener('change', () => {
        renderRelationsTableDOM(); // refresh dropdown option texts cleanly on blur
      });

      const parentSelect = card.querySelector('select[data-cls-field="parent"]');
      parentSelect.addEventListener('change', () => {
        cls.parent = parentSelect.value;
        syncBuilderToEditor();
      });

      // Attributes events (keep focus!)
      card.querySelectorAll('.cls-member-row[data-member="attr"]').forEach((row) => {
        const aIdx = parseInt(row.getAttribute('data-idx'), 10);
        row.querySelectorAll('select, input').forEach((el) => {
          const evName = el.tagName === 'SELECT' ? 'change' : 'input';
          el.addEventListener(evName, () => {
            cls.attributes[aIdx][el.getAttribute('data-field')] = el.value;
            syncBuilderToEditor();
          });
        });
      });

      // Methods events (keep focus!)
      card.querySelectorAll('.cls-member-row[data-member="method"]').forEach((row) => {
        const mIdx = parseInt(row.getAttribute('data-idx'), 10);
        row.querySelectorAll('select, input').forEach((el) => {
          const evName = el.tagName === 'SELECT' ? 'change' : 'input';
          el.addEventListener(evName, () => {
            cls.methods[mIdx][el.getAttribute('data-field')] = el.value;
            syncBuilderToEditor();
          });
        });
      });

      // Structural add/remove buttons
      card.querySelector('[data-add-attr]').addEventListener('click', () => {
        cls.attributes.push({ visibility: '', name: `πεδίο${cls.attributes.length + 1}`, type: '' });
        syncBuilderToEditor();
        renderBuilderDOM();
      });

      card.querySelector('[data-add-method]').addEventListener('click', () => {
        cls.methods.push({ visibility: '+', name: `μέθοδος${cls.methods.length + 1}`, params: '', returnType: '' });
        syncBuilderToEditor();
        renderBuilderDOM();
      });

      card.querySelectorAll('[data-del-attr]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-del-attr'), 10);
          cls.attributes.splice(i, 1);
          syncBuilderToEditor();
          renderBuilderDOM();
        });
      });

      card.querySelectorAll('[data-del-method]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-del-method'), 10);
          cls.methods.splice(i, 1);
          syncBuilderToEditor();
          renderBuilderDOM();
        });
      });

      card.querySelector('[data-del-cls]').addEventListener('click', () => {
        const delKey = Core.canonicalKey(cls.name);
        builderModel.classes.splice(cIdx, 1);
        builderModel.classes.forEach((other) => {
          if (Core.canonicalKey(other.parent) === delKey) other.parent = '';
        });
        builderModel.relations = builderModel.relations.filter(
          (r) => Core.canonicalKey(r.from) !== delKey && Core.canonicalKey(r.to) !== delKey
        );
        syncBuilderToEditor();
        renderBuilderDOM();
      });

      builderClassesGrid.appendChild(card);
    });

    renderRelationsTableDOM();
  }

  function renderRelationsTableDOM() {
    builderRelsTbody.innerHTML = '';
    builderModel.relations.forEach((rel, rIdx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select data-field="kind">
            <option value="association" ${rel.kind === 'association' ? 'selected' : ''}>Συσχέτιση (--)</option>
            <option value="aggregation" ${rel.kind === 'aggregation' ? 'selected' : ''}>Συναρμογή (&lt;&gt;--)</option>
            <option value="composition" ${rel.kind === 'composition' ? 'selected' : ''}>Σύνθεση (*--)</option>
            <option value="inheritance" ${rel.kind === 'inheritance' ? 'selected' : ''}>Κληρονομ. (--|&gt;)</option>
            <option value="dependency" ${rel.kind === 'dependency' ? 'selected' : ''}>Εξάρτηση (..&gt;)</option>
          </select>
        </td>
        <td><select data-field="from">${getClassOptionsHTML(rel.from)}</select></td>
        <td><input type="text" data-field="fromMult" value="${escapeHTML(rel.fromMult)}" placeholder="1"></td>
        <td><input type="text" data-field="label" value="${escapeHTML(rel.label)}" placeholder="όνομα σχέσης"></td>
        <td><input type="text" data-field="toMult" value="${escapeHTML(rel.toMult)}" placeholder="0..*"></td>
        <td><select data-field="to">${getClassOptionsHTML(rel.to)}</select></td>
        <td><select data-field="assocClass">${getClassOptionsHTML(rel.assocClass)}</select></td>
        <td style="white-space:nowrap;">
          <button type="button" class="cls-icon-btn" data-swap="${rIdx}" title="Αντιστροφή κατεύθυνσης">&harr;</button>
          <button type="button" class="cls-icon-btn danger" data-del="${rIdx}" title="Διαγραφή σχέσης">&times;</button>
        </td>
      `;

      tr.querySelectorAll('select, input').forEach((el) => {
        const evName = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(evName, () => {
          rel[el.getAttribute('data-field')] = el.value;
          syncBuilderToEditor();
        });
      });

      tr.querySelector('[data-swap]').addEventListener('click', () => {
        const tmpClass = rel.from;
        rel.from = rel.to;
        rel.to = tmpClass;
        const tmpMult = rel.fromMult;
        rel.fromMult = rel.toMult;
        rel.toMult = tmpMult;
        syncBuilderToEditor();
        renderRelationsTableDOM();
      });

      tr.querySelector('[data-del]').addEventListener('click', () => {
        builderModel.relations.splice(rIdx, 1);
        syncBuilderToEditor();
        renderRelationsTableDOM();
      });

      builderRelsTbody.appendChild(tr);
    });
  }

  function addNewClassInteractive() {
    if (builderDirty) loadCompiledIntoBuilder();
    let idx = builderModel.classes.length + 1;
    const existing = new Set(builderModel.classes.map((c) => Core.canonicalKey(c.name)));
    while (existing.has(Core.canonicalKey(`ΝέαΚλάση${idx}`))) idx++;
    builderModel.classes.push({
      id: `cls_${idx}`,
      name: `ΝέαΚλάση${idx}`,
      isImplicit: false,
      parent: '',
      attributes: [{ visibility: '', name: 'κωδικός', type: 'String' }],
      methods: []
    });
    syncBuilderToEditor();
    renderBuilderDOM();
    switchTab('tab-builder');
    showToast(`Προστέθηκε η κλάση ΝέαΚλάση${idx}.`);
  }

  function addNewRelationInteractive() {
    if (builderDirty) loadCompiledIntoBuilder();
    if (builderModel.classes.length === 0) {
      addNewClassInteractive();
      return;
    }
    const first = builderModel.classes[0].name;
    const second = builderModel.classes.length > 1 ? builderModel.classes[1].name : first;
    builderModel.relations.push({
      kind: 'association',
      from: first,
      to: second,
      fromMult: '1',
      toMult: '0..*',
      label: 'σχετίζεται',
      assocClass: ''
    });
    syncBuilderToEditor();
    renderBuilderDOM();
    switchTab('tab-builder');
    showToast('Προστέθηκε νέα σχέση.');
  }

  builderAddClassBtn.addEventListener('click', addNewClassInteractive);
  quickAddClassBtn.addEventListener('click', addNewClassInteractive);
  builderAddRelBtn.addEventListener('click', addNewRelationInteractive);
  quickAddRelBtn.addEventListener('click', addNewRelationInteractive);

  // ---------------------------------------------------------------------------
  // COMPILE ORCHESTRATOR
  // ---------------------------------------------------------------------------
  function runCompile(opts = {}) {
    currentCompiled = Core.compileClassDiagram(editor.getValue());
    renderStats();
    renderDiagramView(opts.fit !== false);
    renderValidatorView();
    renderOfficialPseudocodeView();
    renderMermaidPreview();

    if (!opts.skipBuilderSync) {
      const builderActive = document.getElementById('tab-builder').classList.contains('active');
      if (builderActive) {
        loadCompiledIntoBuilder();
      } else {
        builderDirty = true;
      }
    }

    if (opts.switchToErrorsIfFailed && currentCompiled.validation.errorCount > 0) {
      switchTab('tab-validator');
    } else if (opts.manualToast) {
      const errs = currentCompiled.validation.errorCount;
      showToast(errs === 0 ? 'Το διάγραμμα ενημερώθηκε (0 σφάλματα)!' : `Εντοπίστηκαν ${errs} σφάλματα ΕΑΠ.`);
    }
  }

  compileButton.addEventListener('click', () => {
    runCompile({ manualToast: true, switchToErrorsIfFailed: false });
  });

  // Autosave draft & Multi-File Workspace Manager («Οι Εργασίες μου»)
  const autosave = Common.createAutosave({
    key: 'pli11ClassesDraftCode',
    getValue: () => editor.getValue(),
    setValue: (code) => { editor.setValue(code); },
    onRestore: () => showToast('Επαναφέρθηκε το πρόχειρο από την προηγούμενη συνεδρία!')
  });

  const clsWorkspaceMgr = Common.createWorkspaceManager
    ? Common.createWorkspaceManager({
        courseKey: 'pli11-classes',
        defaultSlotTitle: 'Άσκηση 1 (Κλάσεις)',
        getCode: () => editor.getValue(),
        setCode: (code) => {
          selectedClassId = null;
          builderDirty = true;
          editor.setValue(code);
          runCompile({ fit: true });
          loadCompiledIntoBuilder();
        },
        getExtraState: () => ({ cls: customPositions }),
        setExtraState: (extra) => {
          customPositions = (extra && extra.cls) || {};
          saveClsPositions();
          if (currentCompiled) renderDiagramView(true);
        }
      })
    : null;

  let liveDebounceTimer = null;
  editor.on('change', () => {
    if (suppressEditorSync) return;
    autosave.onChange();
    if (clsWorkspaceMgr) clsWorkspaceMgr.onChange();
    builderDirty = true;
    if (!liveCompileToggle.checked) return;
    clearTimeout(liveDebounceTimer);
    liveDebounceTimer = setTimeout(() => {
      runCompile({ fit: false });
    }, 240);
  });

  // ---------------------------------------------------------------------------
  // FORMAT, SHARE, FILE I/O, CLEAR
  // ---------------------------------------------------------------------------
  function formatEditorCode() {
    const cursor = editor.getCursor();
    editor.setValue(Core.formatClassDSL(editor.getValue()));
    editor.setCursor(cursor);
    runCompile({ fit: false });
    showToast('Ο κώδικας μορφοποιήθηκε!');
  }

  formatButton.addEventListener('click', formatEditorCode);

  if (Common.attachTouchSymbolBar) {
    Common.attachTouchSymbolBar(editor, [';', ':', '--', '<>--', '*--', '--|>', '..>', '::', '(1)', '(0..*)', '(1..*)', '+', '-']);
  }

  const exportDocxBtn = document.getElementById('export-docx-btn');
  if (exportDocxBtn && window.EAPDocx) {
    exportDocxBtn.addEventListener('click', async () => {
      if (!currentCompiled) runCompile({ fit: false });
      showToast('Δημιουργία αρχείου Word (.docx)...');
      try {
        const slot = clsWorkspaceMgr ? clsWorkspaceMgr.getActiveSlot() : null;
        const svgStr = Renderer.renderClassDiagramSVG(
          currentCompiled.model,
          getRenderOptions({ printMode: true, tightCrop: true, selectedClassId: null })
        );
        const clsPng = await window.EAPDocx.svgToPngBytes(svgStr, 3);
        const ooPseudo = Core.generateOfficialEAPPseudocode(currentCompiled.model, {
          defaultPrivateAttributes: pseudoDefaultPrivate.checked,
          includeConstructor: pseudoAddCtor.checked,
          includeRelationComments: true
        });

        const sections = [];
        if (slot && slot.notes && slot.notes.trim()) {
          sections.push({ type: 'heading', text: 'Εκφώνηση / Σημειώσεις' });
          sections.push({ type: 'paragraph', text: slot.notes.trim() });
        }

        sections.push({
          type: 'image',
          title: '1. Διάγραμμα Κλάσεων (ΠΛΗ11)',
          pngBytes: clsPng,
          caption: `Διάγραμμα Κλάσεων (${currentCompiled.stats.classes} κλάσεις)`
        });

        const rels = (currentCompiled.model && currentCompiled.model.relations) || [];
        if (rels.length > 0) {
          const kindMap = {
            association: 'Συσχέτιση',
            aggregation: 'Συναρμογή (◇)',
            composition: 'Σύνθεση (◆)',
            inheritance: 'Κληρονομικότητα (◁)',
            dependency: 'Εξάρτηση (..>)'
          };
          sections.push({
            type: 'table',
            title: '2. Πίνακας Σχέσεων & Πληθικοτήτων',
            headers: ['Είδος Σχέσης', 'Κλάση Α', 'Πληθ. Α', 'Όνομα / Ρόλος', 'Πληθ. Β', 'Κλάση Β', 'Κλάση Συσχέτισης'],
            rows: rels.map((r) => [
              kindMap[r.kind] || r.kind,
              r.from,
              r.fromMult || '—',
              r.label || '—',
              r.toMult || '—',
              r.to,
              r.assocClass || '—'
            ])
          });
        }

        sections.push({
          type: 'code',
          title: '3. Αντικειμενοστρεφής Ψευδοκώδικας ΕΑΠ (ΟΣΣ2)',
          code: ooPseudo,
          lineNumbers: true
        });

        window.EAPDocx.downloadDocx({
          title: slot ? `${slot.title} — Διάγραμμα Κλάσεων` : 'Παραδοτέο ΠΛΗ11 — Διάγραμμα Κλάσεων',
          subtitle: `Ελληνικό Ανοικτό Πανεπιστήμιο (ΠΛΗ11) · ${currentCompiled.stats.classes} Κλάσεις · ${new Date().toLocaleDateString('el-GR')}`,
          sections
        }, 'pli11-class-diagram.docx');
        showToast('Το αρχείο Word (pli11-class-diagram.docx) εξήχθη επιτυχώς!');
      } catch (err) {
        showToast('Σφάλμα εξαγωγής .docx: ' + (err.message || 'Αποτυχία'));
      }
    });
  }

  shareButton.addEventListener('click', () => {
    Common.shareCode(editor.getValue(), { cls: customPositions });
  });

  loadButton.addEventListener('click', async () => {
    const file = await Common.pickFile('.txt,.pli11,.uml');
    if (!file) return;
    try {
      const text = await Common.readTextFile(file);
      customPositions = {};
      selectedClassId = null;
      builderDirty = true;
      editor.setValue(text);
      runCompile({ fit: true });
      showToast(`Φορτώθηκε το αρχείο ${file.name}`);
    } catch (e) {
      showToast('Αποτυχία ανάγνωσης αρχείου.');
    }
  });

  saveButton.addEventListener('click', () => {
    const safeName = 'pli11_class_diagram.txt';
    Common.saveTextAsFile(editor.getValue(), safeName);
    showToast(`Αποθηκεύτηκε ως ${safeName}`);
  });

  clearButton.addEventListener('click', () => {
    Common.showConfirm('Καθαρισμός όλου του διαγράμματος κλάσεων στον συντάκτη;', {
      danger: true,
      yesText: 'Καθαρισμός',
      onYes: () => {
        customPositions = {};
        selectedClassId = null;
        builderDirty = true;
        if (exampleSelector) exampleSelector.value = '';
        editor.setValue('');
        autosave.clear();
        runCompile({ fit: true });
        editor.focus();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // LAYOUT MANAGER, PANE FOCUS, FULLSCREEN & DUAL-AXIS RESIZER
  // ---------------------------------------------------------------------------
  const container = document.querySelector('.container');
  const paneLeft = document.getElementById('pane-left');
  const paneRight = document.getElementById('pane-right');
  const layoutToggle = document.getElementById('layout-toggle');
  const focusBothBtn = document.getElementById('focus-both-btn');
  const focusCodeBtn = document.getElementById('focus-code-btn');
  const focusOutputBtn = document.getElementById('focus-output-btn');
  const fullscreenOutputBtn = document.getElementById('fullscreen-output-btn');

  let currentLayout = SettingsManager.get('pli11ClassesLayout', 'split');
  let currentPaneFocus = 'both';

  function refreshAllViewports() {
    requestAnimationFrame(() => {
      editor.refresh();
      panZoom.fit(false);
      mermaidPanZoom.fit(false);
    });
  }

  function setPaneFocus(mode) {
    if (!container) return;
    currentPaneFocus = mode;
    container.classList.toggle('collapse-left', mode === 'output');
    container.classList.toggle('collapse-right', mode === 'code');
    if (focusBothBtn) focusBothBtn.classList.toggle('active', mode === 'both');
    if (focusCodeBtn) focusCodeBtn.classList.toggle('active', mode === 'code');
    if (focusOutputBtn) focusOutputBtn.classList.toggle('active', mode === 'output');
    refreshAllViewports();
  }

  if (focusBothBtn) focusBothBtn.addEventListener('click', () => setPaneFocus('both'));
  if (focusCodeBtn) focusCodeBtn.addEventListener('click', () => setPaneFocus('code'));
  if (focusOutputBtn) focusOutputBtn.addEventListener('click', () => setPaneFocus('output'));

  function setOutputFullscreen(active) {
    document.body.classList.toggle('output-fullscreen', active);
    if (fullscreenOutputBtn) {
      fullscreenOutputBtn.classList.toggle('active', active);
      fullscreenOutputBtn.textContent = active ? '✕ Έξοδος' : '⛶ Μεγιστοποίηση';
      fullscreenOutputBtn.title = active
        ? 'Έξοδος από πλήρη οθόνη (Esc)'
        : 'Μεγιστοποίηση διαγραμμάτων / Builder σε πλήρη οθόνη (Esc για έξοδο)';
    }
    refreshAllViewports();
  }

  if (fullscreenOutputBtn) {
    fullscreenOutputBtn.addEventListener('click', () => {
      setOutputFullscreen(!document.body.classList.contains('output-fullscreen'));
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('output-fullscreen')) {
      const openModal = document.querySelector('.modal-overlay[style*="flex"]');
      if (!openModal) setOutputFullscreen(false);
    }
  });

  function clampPercent(raw, fallbackPct, minPct = 20, maxPct = 80) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallbackPct + '%';
    return Math.min(maxPct, Math.max(minPct, n)).toFixed(1) + '%';
  }

  function applyLayout(mode) {
    if (!container) return;
    currentLayout = mode;
    SettingsManager.set('pli11ClassesLayout', mode);

    if (mode === 'stacked') {
      container.classList.add('layout-stacked');
      if (layoutToggle) {
        layoutToggle.innerHTML = '<span class="layout-icon">⬒</span> <span class="layout-text">Up/Down</span>';
        layoutToggle.title = 'Εναλλαγή σε Side-by-Side (Left/Right) διάταξη';
      }
      if (dragHandle) {
        dragHandle.classList.remove('resizer-col');
        dragHandle.title = 'Σύρετε για αλλαγή ύψους • Διπλό κλικ για επαναφορά (50/50)';
      }
      if (paneLeft) paneLeft.style.width = '';
      if (outputContainer) outputContainer.style.height = '';
      if (paneRight) {
        paneRight.style.height = clampPercent(SettingsManager.get('pli11ClassesPaneBottomPct', '54%'), 54, 22, 82);
      }
    } else {
      container.classList.remove('layout-stacked');
      if (layoutToggle) {
        layoutToggle.innerHTML = '<span class="layout-icon">◫</span> <span class="layout-text">Side-by-Side</span>';
        layoutToggle.title = 'Εναλλαγή σε Up/Down (Stacked) διάταξη';
      }
      if (dragHandle) {
        dragHandle.classList.add('resizer-col');
        dragHandle.title = 'Σύρετε για αλλαγή πλάτους • Διπλό κλικ για επαναφορά (45/55)';
      }
      if (outputContainer) outputContainer.style.height = '';
      if (paneRight) paneRight.style.height = '';
      if (paneLeft) {
        paneLeft.style.width = clampPercent(SettingsManager.get('pli11ClassesSplitWidth', '44%'), 44, 18, 80);
      }
    }

    if (currentPaneFocus !== 'both') setPaneFocus('both');
    else refreshAllViewports();
  }

  if (layoutToggle) {
    layoutToggle.addEventListener('click', () => {
      const nextMode = currentLayout === 'split' ? 'stacked' : 'split';
      applyLayout(nextMode);
      showToast(nextMode === 'split' ? 'Διάταξη: Side-by-Side (Left / Right)' : 'Διάταξη: Up / Down (Stacked)');
    });
  }

  if (dragHandle) {
    Viewport.attachDrag(dragHandle, {
      getCursor: () => (container && container.classList.contains('layout-stacked')) ? 'row-resize' : 'col-resize',
      onMove: (e) => {
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const isStacked = container.classList.contains('layout-stacked');

        if (isStacked) {
          const newHeight = containerRect.bottom - e.clientY;
          const minHeight = 140;
          const maxHeight = Math.max(minHeight + 20, containerRect.height - 120);
          if (newHeight >= minHeight && newHeight <= maxHeight && paneRight) {
            const pct = ((newHeight / containerRect.height) * 100).toFixed(1) + '%';
            paneRight.style.height = pct;
            editor.refresh();
          }
        } else {
          const newWidth = e.clientX - containerRect.left;
          const minWidth = 220;
          const maxWidth = Math.max(minWidth + 20, containerRect.width - 240);
          if (newWidth >= minWidth && newWidth <= maxWidth && paneLeft) {
            const pct = ((newWidth / containerRect.width) * 100).toFixed(1) + '%';
            paneLeft.style.width = pct;
            editor.refresh();
          }
        }
      },
      onEnd: () => {
        const isStacked = container && container.classList.contains('layout-stacked');
        if (isStacked && paneRight) {
          SettingsManager.set('pli11ClassesPaneBottomPct', paneRight.style.height);
        } else if (paneLeft) {
          SettingsManager.set('pli11ClassesSplitWidth', paneLeft.style.width);
        }
        refreshAllViewports();
      },
      // Double-click to reset split/stack
      onDblClick: () => {
        const isStacked = container && container.classList.contains('layout-stacked');
        if (isStacked && paneRight) {
          paneRight.style.height = '52%';
          SettingsManager.set('pli11ClassesPaneBottomPct', '52%');
        } else if (paneLeft) {
          paneLeft.style.width = '45%';
          SettingsManager.set('pli11ClassesSplitWidth', '45%');
        }
        refreshAllViewports();
        showToast('Επαναφορά μεγέθους διαχωριστικού');
      }
    });
  }

  // Initial layout application
  applyLayout(currentLayout);

  // ---------------------------------------------------------------------------
  // QUICK CODE SNIPPETS INSERTION
  // ---------------------------------------------------------------------------
  const snippetChips = document.querySelectorAll('.snippet-chip');
  snippetChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-snippet');
      insertCodeSnippet(type);
    });
  });

  function insertCodeSnippet(type) {
    const doc = editor.getDoc();
    const cursor = doc.getCursor();
    let snippet = '';

    switch (type) {
      case 'class':
        snippet = `\nΚΛΑΣΗ ΝέαΚλάση\n  ΚΑΤΗΓΟΡΗΜΑΤΑ\n    κωδικός: String;\n  ΜΕΘΟΔΟΙ\n    PUBLIC ΔΗΜΙΟΥΡΓΟΣ();\nΤΕΛΟΣ\n`;
        break;
      case 'attr':
        snippet = `    νέαΙδιότητα: String;\n`;
        break;
      case 'meth':
        snippet = `    PUBLIC νέαΜέθοδος();\n`;
        break;
      case 'assoc':
        snippet = `\n// Απλή Συσχέτιση (1 προς 0..*)\nΚλάση1 (1) -- (0..*) Κλάση2 : σχετίζεται\n`;
        break;
      case 'agg':
        snippet = `\n// Συναρμογή (Aggregation - λευκός ρόμβος)\nΌλον (1) <>-- (1..*) Μέρος\n`;
        break;
      case 'comp':
        snippet = `\n// Σύνθεση (Composition - μαύρος ρόμβος)\nΌλον (1) *-- (1..*) Μέρος\n`;
        break;
      case 'inh':
        snippet = `\n// Κληρονομικότητα (Γενίκευση)\nΥποκλάση --|> Υπερκλάση\n`;
        break;
      case 'assoc-class':
        snippet = `\n// Κλάση Συσχέτισης\nΚλάση1 (1..*) -- (0..*) Κλάση2 : συμμετέχει :: ΚλάσηΣυσχέτισης\n`;
        break;
    }

    if (snippet) {
      doc.replaceRange(snippet, cursor);
      editor.focus();
      if (liveCompileToggle && liveCompileToggle.checked) {
        runCompile({ fit: false });
      }
      showToast('Εισήχθη πρότυπο κώδικα!');
    }
  }

  // ---------------------------------------------------------------------------
  // SMART CONTEXT-AWARE HELP MODAL (ΔΙΑΓΡΑΜΜΑΤΑ ΚΛΑΣΕΩΝ ΠΛΗ11)
  // ---------------------------------------------------------------------------
  const SYNTAX_HELP_BODY = `
    <div class="help-context-banner" id="pli11-classes-help-banner">
      <span>💡 Εστίαση βάσει κέρσορα:</span>
      <span class="help-context-tag" id="pli11-classes-help-tag">Δήλωση Κλάσης &amp; Πεδία</span>
    </div>

    <div class="help-tabs" id="pli11-classes-help-tabs">
      <button type="button" class="help-tab-btn active" data-target="help-tab-class-decl">🏛️ 1. Δήλωση Κλάσης</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-class-rel">🔗 2. Σχέσεις &amp; Σύνθεση</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-class-mult">🔢 3. Πληθικότητες &amp; Συσχέτιση</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-class-rules">⚠️ 4. Κανόνες ΕΑΠ (C01-C06)</button>
    </div>

    <!-- TAB 1: Δήλωση Κλάσης -->
    <div class="help-tab-pane active" id="help-tab-class-decl">
      <p style="margin-top:0;"><strong>Δήλωση Κλάσης κατά ΕΑΠ (ΟΣΣ2 &amp; ΓΕ1):</strong></p>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Πλήρης Κλάση με Ορατότητες &amp; Τύπους (ΟΣΣ2)</span>
          <button type="button" class="help-insert-btn" data-snippet="ΚΛΑΣΗ Όχημα
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    PRIVATE ΑριθμόςΚυκλοφορίας: STRING;
    PROTECTED Ιδιοκτήτης: STRING;
  ΜΕΘΟΔΟΙ
    PUBLIC ΔΗΜΙΟΥΡΓΟΣ(ΑριθμόςΚυκλοφορίας);
    PUBLIC ΕκτύπωσεΣτοιχεία();
ΤΕΛΟΣ">+ Εισαγωγή</button>
        </div>
        <pre><code>ΚΛΑΣΗ Όχημα
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    PRIVATE ΑριθμόςΚυκλοφορίας: STRING;
    PROTECTED Ιδιοκτήτης: STRING;
  ΜΕΘΟΔΟΙ
    PUBLIC ΔΗΜΙΟΥΡΓΟΣ(ΑριθμόςΚυκλοφορίας);
    PUBLIC ΕκτύπωσεΣτοιχεία();
ΤΕΛΟΣ</code></pre>
      </div>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Υποκλάση με Κληρονομικότητα (ΕΠΕΚΤΕΙΝΕΙ)</span>
          <button type="button" class="help-insert-btn" data-snippet="ΚΛΑΣΗ Φορτηγό ΕΠΕΚΤΕΙΝΕΙ Όχημα
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    PRIVATE ΩφέλιμοΦορτίο: REAL;
  ΜΕΘΟΔΟΙ
    PUBLIC ΔΗΜΙΟΥΡΓΟΣ(ΑριθμόςΚυκλοφορίας, ΩφέλιμοΦορτίο);
ΤΕΛΟΣ">+ Εισαγωγή</button>
        </div>
        <pre><code>ΚΛΑΣΗ Φορτηγό ΕΠΕΚΤΕΙΝΕΙ Όχημα
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    PRIVATE ΩφέλιμοΦορτίο: REAL;
  ΜΕΘΟΔΟΙ
    PUBLIC ΔΗΜΙΟΥΡΓΟΣ(ΑριθμόςΚυκλοφορίας, ΩφέλιμοΦορτίο);
ΤΕΛΟΣ</code></pre>
      </div>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Απλοποιημένη Μορφή (ΓΕ1 2025-26)</span>
          <button type="button" class="help-insert-btn" data-snippet="ΚΛΑΣΗ Πελάτης
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    κωδικός;
    όνομα;
    τηλέφωνο;
ΤΕΛΟΣ">+ Εισαγωγή</button>
        </div>
        <pre><code>ΚΛΑΣΗ Πελάτης
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    κωδικός;
    όνομα;
    τηλέφωνο;
ΤΕΛΟΣ</code></pre>
      </div>
    </div>

    <!-- TAB 2: Σχέσεις Κλάσεων -->
    <div class="help-tab-pane" id="help-tab-class-rel">
      <p style="margin-top:0;">Όλες οι σχέσεις δηλώνονται κάτω από την επικεφαλίδα <code>ΣΧΕΣΕΙΣ</code>:</p>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Μπλοκ Σχέσεων (Συσχέτιση, Συναρμογή, Σύνθεση, Εξάρτηση)</span>
          <button type="button" class="help-insert-btn" data-snippet="ΣΧΕΣΕΙΣ
  /* Απλή Συσχέτιση */
  Πελάτης (1) -- (0..*) Παραγγελία : πραγματοποιεί

  /* Συναρμογή / Aggregation (λευκός ρόμβος) */
  Παραγγελία (1) <>-- (1..*) ΓραμμήΠαραγγελίας : περιλαμβάνει

  /* Σύνθεση / Composition (μαύρος ρόμβος) */
  Κτίριο (1) *-- (1..*) Δωμάτιο : αποτελείται_από

  /* Εξάρτηση / Dependency (διακεκομμένο βέλος) */
  Τιμολόγιο ..> Εκτυπωτής : χρησιμοποιεί">+ Εισαγωγή</button>
        </div>
        <pre><code>ΣΧΕΣΕΙΣ
  /* Απλή Συσχέτιση */
  Πελάτης (1) -- (0..*) Παραγγελία : πραγματοποιεί

  /* Συναρμογή / Aggregation (λευκός ρόμβος) */
  Παραγγελία (1) <>-- (1..*) ΓραμμήΠαραγγελίας : περιλαμβάνει

  /* Σύνθεση / Composition (μαύρος ρόμβος) */
  Κτίριο (1) *-- (1..*) Δωμάτιο : αποτελείται_από

  /* Εξάρτηση / Dependency (διακεκομμένο βέλος) */
  Τιμολόγιο ..> Εκτυπωτής : χρησιμοποιεί</code></pre>
      </div>
    </div>

    <!-- TAB 3: Πληθικότητες & Κλάσεις Συσχέτισης -->
    <div class="help-tab-pane" id="help-tab-class-mult">
      <p style="margin-top:0;"><strong>Επίσημες Πληθικότητες ΕΑΠ:</strong> <code>(1)</code>, <code>(0..1)</code>, <code>(1..*)</code>, <code>(0..*)</code>, <code>(*)</code> ή αριθμητικά εύρη όπως <code>(1..5)</code>.</p>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Συσχέτιση Πολλά-προς-Πολλά με Κλάση Συσχέτισης (::)</span>
          <button type="button" class="help-insert-btn" data-snippet="ΚΛΑΣΗ Φοιτητής
ΤΕΛΟΣ

ΚΛΑΣΗ Μάθημα
ΤΕΛΟΣ

ΚΛΑΣΗ Βαθμολογία
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    βαθμός;
    ημερομηνία;
ΤΕΛΟΣ

ΣΧΕΣΕΙΣ
  Φοιτητής (1..*) -- (0..*) Μάθημα : εγγράφεται :: Βαθμολογία">+ Εισαγωγή</button>
        </div>
        <pre><code>/* Η Κλάση Συσχέτισης συνδέεται με διακεκομμένη γραμμή στη σχέση */
Φοιτητής (1..*) -- (0..*) Μάθημα : εγγράφεται :: Βαθμολογία</code></pre>
      </div>
    </div>

    <!-- TAB 4: Κανόνες ΕΑΠ (C01-C06) -->
    <div class="help-tab-pane" id="help-tab-class-rules">
      <p style="margin-top:0;">Οι 6 επίσημοι έλεγχοι ποιότητας και μεθοδολογίας ΕΑΠ:</p>
      <ol style="padding-left:18px; margin-bottom:0; font-size:0.88rem; line-height:1.55;">
        <li><strong>C01:</strong> Αδήλωτες κλάσεις στις σχέσεις (κάθε κλάση πρέπει να ορίζεται με <code>ΚΛΑΣΗ ... ΤΕΛΟΣ</code>).</li>
        <li><strong>C02:</strong> Διπλοτυπίες ονομάτων κλάσεων.</li>
        <li><strong>C03:</strong> Ακυκλική κληρονομικότητα (απαγορεύεται κλάση να κληρονομεί από τον εαυτό της ή κυκλικά).</li>
        <li><strong>C04:</strong> Απαγόρευση επανάληψης κληρονομημένων κατηγορημάτων στην υποκλάση.</li>
        <li><strong>C05:</strong> Έγκυρες πληθικότητες σε όλα τα άκρα συσχετίσεων.</li>
        <li><strong>C06:</strong> Περιγραφικά ονόματα (ρήματα) στις απλές συσχετίσεις (π.χ. <code>: πραγματοποιεί</code>).</li>
      </ol>
    </div>
  `;

  const syntaxModal = Common.createModal({
    id: 'pli11-classes-syntax-modal',
    title: 'Οδηγός Ψευδοκώδικα Διαγραμμάτων Κλάσεων (ΠΛΗ11)',
    bodyHTML: SYNTAX_HELP_BODY
  });

  function detectClassContext() {
    const cur = editor.getCursor();
    const line = editor.getLine(cur.line) || '';

    if (/(--|<>--|\*--|<#>--|\.\.>|ΣΧΕΣΕΙΣ)/i.test(line)) {
      return { tab: 'help-tab-class-rel', label: 'Σχέσεις: Συσχέτιση, Συναρμογή, Σύνθεση' };
    }
    if (/(::|\(\s*1\s*\)|\(\s*0\.\.1\s*\)|\(\s*1\.\.\*\s*\)|\(\s*0\.\.\*\s*\))/i.test(line)) {
      return { tab: 'help-tab-class-mult', label: 'Πληθικότητες & Κλάσεις Συσχέτισης' };
    }
    if (currentCompiled && currentCompiled.validation && currentCompiled.validation.diagnostics.some((d) => d.severity === 'error')) {
      return { tab: 'help-tab-class-rules', label: 'Κανόνες ΕΑΠ (C01–C06) & Έλεγχος' };
    }
    return { tab: 'help-tab-class-decl', label: 'Δήλωση Κλάσης & Πεδία' };
  }

  function switchClassHelpTab(tabTarget) {
    if (!syntaxModal || !syntaxModal.body) return;
    syntaxModal.body.querySelectorAll('.help-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-target') === tabTarget);
    });
    syntaxModal.body.querySelectorAll('.help-tab-pane').forEach((p) => {
      p.classList.toggle('active', p.id === tabTarget);
    });
  }

  if (syntaxModal && syntaxModal.body) {
    syntaxModal.body.querySelectorAll('.help-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchClassHelpTab(btn.getAttribute('data-target')));
    });

    syntaxModal.body.querySelectorAll('.help-insert-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const snippet = btn.getAttribute('data-snippet');
        if (snippet && editor) {
          const doc = editor.getDoc();
          const cur = doc.getCursor();
          doc.replaceRange('\n' + snippet + '\n', cur);
          syntaxModal.close();
          editor.focus();
          runCompile({ fit: false });
          showToast('Το πρότυπο κλάσεων εισήχθη στον κώδικα!');
        }
      });
    });
  }

  syntaxHelpButton.addEventListener('click', () => {
    const ctx = detectClassContext();
    const tag = syntaxModal.body ? syntaxModal.body.querySelector('#pli11-classes-help-tag') : null;
    if (tag) tag.textContent = ctx.label;
    switchClassHelpTab(ctx.tab);
    syntaxModal.open();
  });

  // Initial Compile on Boot (+ async #z= deflate permalink support)
  runCompile({ fit: true });
  loadCompiledIntoBuilder();
  if (typeof Common.loadCodeFromHashAsync === 'function') {
    Common.loadCodeFromHashAsync((shared) => {
      const dec = Common.decodeSharePayload ? Common.decodeSharePayload(shared) : { code: shared, layout: null };
      if (dec.layout && dec.layout.cls) customPositions = dec.layout.cls;
      editor.setValue(dec.code);
      runCompile({ fit: true });
      loadCompiledIntoBuilder();
    });
  }
});
