// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 Pseudocode Compiler, ΔΔΠ/ΔΡΔ Visualizer, Validator & DFD Builder UI
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const Core = window.PLI11Core;
  const Renderer = window.PLI11Renderer;
  const Common = window.EAPCommon;
  const Viewport = window.EAPViewport;
  const { PLI11_EXAMPLES, PLI11_EXAMPLE_CATEGORIES, PLI11_DFD_PRESETS } = window.PLI11Examples || {};
  const escapeHTML = Common.escapeHTML;
  const showToast = (msg, dur) => Common.showToast(msg, dur);
  const copyTextToClipboard = (txt, okMsg) => Common.copyTextToClipboard(txt, okMsg);

  // DOM References - Header & Editor
  const editorMount = document.getElementById('code-editor-mount');
  const editorTitle = document.getElementById('editor-title');
  const archBadge = document.getElementById('arch-badge');
  const exampleSelector = document.getElementById('example-selector');
  const wrapButton = document.getElementById('wrap-button');
  const formatButton = document.getElementById('format-button');
  const shareButton = document.getElementById('share-button');

  // DOM References - Controls
  const compileButton = document.getElementById('compile-button');
  const stepButton = document.getElementById('step-button');
  const autoStepButton = document.getElementById('auto-step-button');
  const stopStepButton = document.getElementById('stop-step-button');
  const speedSelect = document.getElementById('speed-select');
  const liveCompileToggle = document.getElementById('live-compile-toggle');
  const loadButton = document.getElementById('load-button');
  const saveButton = document.getElementById('save-button');
  const clearButton = document.getElementById('clear-button');
  const syntaxHelpButton = document.getElementById('syntax-help-button');
  const dragHandle = document.getElementById('drag-handle');
  const outputContainer = document.querySelector('.output-container');

  // DOM References - Tabs
  const copyMermaidBtn = document.getElementById('copy-mermaid-btn');

  // DOM References - ΔΔΠ & Trace
  const cntControl = document.getElementById('cnt-control');
  const cntCalc = document.getElementById('cnt-calc');
  const cntPres = document.getElementById('cnt-pres');
  const cntData = document.getElementById('cnt-data');
  const cntIOGenericWrap = document.getElementById('cnt-io-generic-wrap');
  const cntIOGeneric = document.getElementById('cnt-io-generic');
  const cntStubsWrap = document.getElementById('cnt-stubs-wrap');
  const cntStubs = document.getElementById('cnt-stubs');

  const ddpViewport = document.getElementById('ddp-viewport');
  const ddpCanvas = document.getElementById('ddp-canvas');
  const ddpZoomOut = document.getElementById('ddp-zoom-out');
  const ddpZoomIn = document.getElementById('ddp-zoom-in');
  const ddpZoomFit = document.getElementById('ddp-zoom-fit');
  const ddpAutoLayout = document.getElementById('ddp-auto-layout');
  const ddpZoomLabel = document.getElementById('ddp-zoom-label');
  const ddpPrintBtn = document.getElementById('ddp-print-btn');
  const ddpCanvasSizeSelect = document.getElementById('ddp-canvas-size');
  const ddpExportSvg = document.getElementById('ddp-export-svg');
  const ddpExportPng = document.getElementById('ddp-export-png');
  const ddpCopyPng = document.getElementById('ddp-copy-png');

  const traceStatusBar = document.getElementById('trace-status-bar');
  const traceStepPill = document.getElementById('trace-step-pill');
  const traceSummaryText = document.getElementById('trace-summary-text');
  const traceStackText = document.getElementById('trace-stack-text');
  const traceVarsStrip = document.getElementById('trace-vars-strip');

  // DOM References - ΔΡΔ
  const dfdInfoBar = document.getElementById('dfd-info-bar');
  const dfdViewport = document.getElementById('dfd-viewport');
  const dfdCanvas = document.getElementById('dfd-canvas');
  const dfdZoomOut = document.getElementById('dfd-zoom-out');
  const dfdZoomIn = document.getElementById('dfd-zoom-in');
  const dfdZoomFit = document.getElementById('dfd-zoom-fit');
  const dfdAutoLayout = document.getElementById('dfd-auto-layout');
  const dfdZoomLabel = document.getElementById('dfd-zoom-label');
  const dfdLevel1Btn = document.getElementById('dfd-level-1-btn');
  const dfdLevel0Btn = document.getElementById('dfd-level-0-btn');
  const dfdToggleKmBtn = document.getElementById('dfd-toggle-km-btn');
  const dfdLayoutModeSelect = document.getElementById('dfd-layout-mode');
  const dfdCloneToggleBtn = document.getElementById('dfd-clone-toggle');
  const dfdCanvasSizeSelect = document.getElementById('dfd-canvas-size');
  const dfdPrintBtn = document.getElementById('dfd-print-btn');
  const dfdExportSvg = document.getElementById('dfd-export-svg');
  const dfdExportPng = document.getElementById('dfd-export-png');
  const dfdCopyPng = document.getElementById('dfd-copy-png');

  // DOM References - Validator
  const valBadge = document.getElementById('val-badge');
  const valSummaryCard = document.getElementById('val-summary-card');
  const valSummaryTitle = document.getElementById('val-summary-title');
  const valSummarySub = document.getElementById('val-summary-sub');
  const valSummaryCounts = document.getElementById('val-summary-counts');
  const valChecklist = document.getElementById('val-checklist');
  const valDiagnosticsList = document.getElementById('val-diagnostics-list');

  // DOM References - Mermaid
  const mermaidModeDdpBtn = document.getElementById('mermaid-mode-ddp');
  const mermaidModeDfdBtn = document.getElementById('mermaid-mode-dfd');
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

  // DOM References - DFD Builder
  const dfdPresetSelect = document.getElementById('dfd-preset-select');
  const dfdModeSelect = document.getElementById('dfd-mode-select');
  const dfdCentralInput = document.getElementById('dfd-central-input');
  const dfdAddFlowBtn = document.getElementById('dfd-add-flow-btn');
  const dfdFlowsTbody = document.getElementById('dfd-flows-tbody');
  const dfdDslInput = document.getElementById('dfd-dsl-input');
  const dfdBuildBtn = document.getElementById('dfd-build-btn');
  const dfdEditInBuilderBtn = document.getElementById('dfd-edit-in-builder-btn');
  const dfdLoadFromCompilerBtn = document.getElementById('dfd-load-from-compiler-btn');
  const dfdPreviewBuilderBtn = document.getElementById('dfd-preview-builder-btn');

  // ---------------------------------------------------------------------------
  // SETTINGS (shared via EAPCommon)
  // ---------------------------------------------------------------------------
  const SettingsManager = Common.SettingsManager;

  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  let currentCompiled = null;
  let ddpPrintMode = false;
  let dfdPrintMode = false;
  let mermaidMode = 'ddp'; // 'ddp' | 'dfd'
  let mermaidRenderCounter = 0;

  let traceIndex = -1;
  let autoStepTimer = null;
  let errorLineHandles = [];
  let traceLineHandle = null;

  // ---------------------------------------------------------------------------
  // INITIALIZE CODEMIRROR
  // ---------------------------------------------------------------------------
  let initialCode = (PLI11_EXAMPLES && PLI11_EXAMPLES.GE1_2025_2026_FULL)
    ? PLI11_EXAMPLES.GE1_2025_2026_FULL
    : 'PROCEDURE Exec_M1\n  LOCAL VAR A;\n  ΑΡΧΙΚΟΠΟΙΗΣΕ A;\nEND_PROCEDURE;';

  let sharedInitialLayout = null;
  const rawSharedCode = Common.loadCodeFromHash();
  if (rawSharedCode) {
    const decoded = Common.decodeSharePayload ? Common.decodeSharePayload(rawSharedCode) : { code: rawSharedCode, layout: null };
    initialCode = decoded.code;
    sharedInitialLayout = decoded.layout;
  }

  const isDarkInitial = Common.getTheme() === 'dark';
  let lineWrapEnabled = SettingsManager.get('pli11LineWrap', 'true') !== 'false';

  const editor = CodeMirror(editorMount, {
    value: initialCode,
    mode: 'eap-pli11',
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
      'F10': () => stepTrace(),
      'Ctrl-Shift-F': () => formatEditorCode(),
      'Tab': (cm) => {
        if (cm.somethingSelected()) cm.indentSelection('add');
        else cm.replaceSelection('  ', 'end');
      }
    },
    hintOptions: { completeSingle: false }
  });

  // Populate Example Selector
  if (PLI11_EXAMPLE_CATEGORIES && exampleSelector) {
    Common.populateExampleSelector(exampleSelector, PLI11_EXAMPLE_CATEGORIES, 'Παραδείγματα (ΠΛΗ11)...', (id) => {
      if (PLI11_EXAMPLES && PLI11_EXAMPLES[id]) {
        stopAutoTrace();
        resetTraceState();
        customDDPPositions = {};
        customDFDPositionsLevel1 = {};
        customDFDPositionsLevel0 = {};
        userOverrodeKM = false;
        editor.setValue(PLI11_EXAMPLES[id]);
        runCompile();
        if (id === 'OE1_TRAPS_DEMO') {
          switchTab('tab-validator');
        } else if (id === 'KALLIPOS_SYSTEM_P1') {
          switchTab('tab-dfd');
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
        renderDDPView();
        renderDFDView();
        renderMermaidPreview();
      }
    }
  });

  if (wrapButton) {
    wrapButton.classList.toggle('active', lineWrapEnabled);
    wrapButton.addEventListener('click', () => {
      lineWrapEnabled = !lineWrapEnabled;
      SettingsManager.set('pli11LineWrap', lineWrapEnabled ? 'true' : 'false');
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
    if (copyMermaidBtn) copyMermaidBtn.hidden = tabId !== 'tab-mermaid';
    if (tabId === 'tab-ddp') requestAnimationFrame(() => ddpPanZoom.fit(false));
    if (tabId === 'tab-dfd') requestAnimationFrame(() => dfdPanZoom.fit(false));
    if (tabId === 'tab-mermaid') {
      renderMermaidPreview({ fit: false });
      requestAnimationFrame(() => mermaidPanZoom.fit(false));
    }
  });

  function switchTab(tabId) {
    tabs.switchTo(tabId);
  }

  // ---------------------------------------------------------------------------
  // PAN & ZOOM (shared engine from diagram-viewport.js)
  // ---------------------------------------------------------------------------
  const ddpPanZoom = Viewport.createPanZoom(ddpViewport, ddpCanvas, ddpZoomLabel);
  const dfdPanZoom = Viewport.createPanZoom(dfdViewport, dfdCanvas, dfdZoomLabel);
  const mermaidPanZoom = Viewport.createPanZoom(mermaidViewport, mermaidPreviewHost, mermaidZoomLabel);

  // Free interactive dragging for DDP & DFD nodes & Level/KM/Layout management
  let dfdActiveLevel = 1; // 0 (Context Diagram) | 1 (Detailed DFD)
  let dfdShowKMFrame = true; // boolean toggle for KM container frame
  let userOverrodeKM = false;
  let dfdLayoutMode = SettingsManager.get('pli11DfdLayoutMode', 'auto');
  const savedClonePref = SettingsManager.get('pli11DfdClonePeriphsV2', 'true');
  let dfdClonePeripherals = savedClonePref !== false && savedClonePref !== 'false';
  let customDDPPositions = {};
  let customDFDPositionsLevel1 = {};
  let customDFDPositionsLevel0 = {};
  let ddCustomOverrides = {};

  const ddpUndoBtn = document.getElementById('ddp-undo-btn');
  const ddpRedoBtn = document.getElementById('ddp-redo-btn');
  const dfdUndoBtn = document.getElementById('dfd-undo-btn');
  const dfdRedoBtn = document.getElementById('dfd-redo-btn');
  const ddpUndoStack = [];
  const ddpRedoStack = [];
  const dfdUndoStack = [];
  const dfdRedoStack = [];

  function loadPersistedPositions() {
    if (sharedInitialLayout) {
      customDDPPositions = sharedInitialLayout.ddp || {};
      customDFDPositionsLevel1 = sharedInitialLayout.dfd1 || {};
      customDFDPositionsLevel0 = sharedInitialLayout.dfd0 || {};
      return;
    }
    try {
      const raw = SettingsManager.get('pli11SavedPositionsV1', null);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          customDDPPositions = parsed.ddp || {};
          customDFDPositionsLevel1 = parsed.dfd1 || {};
          customDFDPositionsLevel0 = parsed.dfd0 || {};
        }
      }
      const rawDd = SettingsManager.get('pli11DataDictOverridesV1', null);
      if (rawDd) ddCustomOverrides = JSON.parse(rawDd) || {};
    } catch (e) { /* ignore */ }
  }
  loadPersistedPositions();

  function savePersistedPositions() {
    try {
      SettingsManager.set('pli11SavedPositionsV1', JSON.stringify({
        ddp: customDDPPositions,
        dfd1: customDFDPositionsLevel1,
        dfd0: customDFDPositionsLevel0
      }));
    } catch (e) { /* ignore */ }
    if (typeof workspaceMgr !== 'undefined' && workspaceMgr) workspaceMgr.onChange();
  }

  function saveDataDictOverrides() {
    try {
      SettingsManager.set('pli11DataDictOverridesV1', JSON.stringify(ddCustomOverrides));
    } catch (e) { /* ignore */ }
    if (typeof workspaceMgr !== 'undefined' && workspaceMgr) workspaceMgr.onChange();
  }

  function syncLayoutUndoButtons() {
    if (ddpUndoBtn) ddpUndoBtn.disabled = ddpUndoStack.length === 0;
    if (ddpRedoBtn) ddpRedoBtn.disabled = ddpRedoStack.length === 0;
    if (dfdUndoBtn) dfdUndoBtn.disabled = dfdUndoStack.length === 0;
    if (dfdRedoBtn) dfdRedoBtn.disabled = dfdRedoStack.length === 0;
  }

  function pushDDPUndo(snap) {
    ddpUndoStack.push(snap);
    if (ddpUndoStack.length > 50) ddpUndoStack.shift();
    ddpRedoStack.length = 0;
    syncLayoutUndoButtons();
  }

  function pushDFDUndo(snap) {
    dfdUndoStack.push(snap);
    if (dfdUndoStack.length > 50) dfdUndoStack.shift();
    dfdRedoStack.length = 0;
    syncLayoutUndoButtons();
  }

  function undoDDPLayout() {
    if (!ddpUndoStack.length) return;
    ddpRedoStack.push(JSON.parse(JSON.stringify(customDDPPositions)));
    customDDPPositions = ddpUndoStack.pop();
    syncLayoutUndoButtons();
    savePersistedPositions();
    renderDDPView(false);
  }

  function redoDDPLayout() {
    if (!ddpRedoStack.length) return;
    ddpUndoStack.push(JSON.parse(JSON.stringify(customDDPPositions)));
    customDDPPositions = ddpRedoStack.pop();
    syncLayoutUndoButtons();
    savePersistedPositions();
    renderDDPView(false);
  }

  function undoDFDLayout() {
    if (!dfdUndoStack.length) return;
    dfdRedoStack.push({
      l1: JSON.parse(JSON.stringify(customDFDPositionsLevel1)),
      l0: JSON.parse(JSON.stringify(customDFDPositionsLevel0))
    });
    const prev = dfdUndoStack.pop();
    customDFDPositionsLevel1 = prev.l1 || {};
    customDFDPositionsLevel0 = prev.l0 || {};
    syncLayoutUndoButtons();
    savePersistedPositions();
    renderDFDView(false);
  }

  function redoDFDLayout() {
    if (!dfdRedoStack.length) return;
    dfdUndoStack.push({
      l1: JSON.parse(JSON.stringify(customDFDPositionsLevel1)),
      l0: JSON.parse(JSON.stringify(customDFDPositionsLevel0))
    });
    const next = dfdRedoStack.pop();
    customDFDPositionsLevel1 = next.l1 || {};
    customDFDPositionsLevel0 = next.l0 || {};
    syncLayoutUndoButtons();
    savePersistedPositions();
    renderDFDView(false);
  }

  if (ddpUndoBtn) ddpUndoBtn.addEventListener('click', undoDDPLayout);
  if (ddpRedoBtn) ddpRedoBtn.addEventListener('click', redoDDPLayout);
  if (dfdUndoBtn) dfdUndoBtn.addEventListener('click', undoDFDLayout);
  if (dfdRedoBtn) dfdRedoBtn.addEventListener('click', redoDFDLayout);

  document.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.closest('.CodeMirror'))) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      if (document.getElementById('tab-ddp').classList.contains('active') && ddpUndoStack.length) {
        e.preventDefault();
        undoDDPLayout();
      } else if (document.getElementById('tab-dfd').classList.contains('active') && dfdUndoStack.length) {
        e.preventDefault();
        undoDFDLayout();
      }
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      if (document.getElementById('tab-ddp').classList.contains('active') && ddpRedoStack.length) {
        e.preventDefault();
        redoDDPLayout();
      } else if (document.getElementById('tab-dfd').classList.contains('active') && dfdRedoStack.length) {
        e.preventDefault();
        redoDFDLayout();
      }
    }
  });

  if (dfdLayoutModeSelect) {
    dfdLayoutModeSelect.value = dfdLayoutMode;
    dfdLayoutModeSelect.addEventListener('change', () => {
      dfdLayoutMode = dfdLayoutModeSelect.value || 'auto';
      SettingsManager.set('pli11DfdLayoutMode', dfdLayoutMode);
      customDFDPositionsLevel1 = {};
      customDFDPositionsLevel0 = {};
      renderDFDView(true);
      const modeNames = {
        auto: 'Αυτόματη (ΕΑΠ)',
        vertical: 'Κάθετη ΕΑΠ (P1.1↓)',
        horizontal: 'Οριζόντια (ΚΜ/ΚΔ)'
      };
      showToast(`Διάταξη ΔΡΔ: ${modeNames[dfdLayoutMode] || dfdLayoutMode}`);
    });
  }

  if (dfdCloneToggleBtn) {
    dfdCloneToggleBtn.addEventListener('click', () => {
      dfdClonePeripherals = !dfdClonePeripherals;
      SettingsManager.set('pli11DfdClonePeriphsV2', dfdClonePeripherals ? 'true' : 'false');
      customDFDPositionsLevel1 = {};
      renderDFDView(true);
      showToast(
        dfdClonePeripherals
          ? 'Τοπική επανάληψη Αποθηκών & Οντοτήτων: Ενεργή (μηδενικές διασταυρώσεις).'
          : 'Τοπική επανάληψη Αποθηκών & Οντοτήτων: Ανενεργή (1 κόμβος ανά αποθήκη).'
      );
    });
  }

  const getCustomPositions = () => (dfdActiveLevel === 0 ? customDFDPositionsLevel0 : customDFDPositionsLevel1);
  const getActiveDFD = () => {
    if (!currentCompiled) return null;
    return dfdActiveLevel === 0 ? (currentCompiled.dfdLevel0 || currentCompiled.dfd) : currentCompiled.dfd;
  };

  const ddpBoxDrag = {
    active: false,
    moved: false,
    preSnap: null,
    nodeId: null,
    startClientX: 0,
    startClientY: 0,
    startBoxX: 0,
    startBoxY: 0,
    rafPending: false
  };

  const dfdBoxDrag = {
    active: false,
    moved: false,
    preSnap: null,
    nodeId: null,
    startClientX: 0,
    startClientY: 0,
    startBoxX: 0,
    startBoxY: 0,
    rafPending: false
  };

  window.addEventListener('mousemove', (e) => {
    if (ddpBoxDrag.active) {
      const scale = (ddpPanZoom && ddpPanZoom.state && ddpPanZoom.state.scale) || 1;
      const dx = (e.clientX - ddpBoxDrag.startClientX) / scale;
      const dy = (e.clientY - ddpBoxDrag.startClientY) / scale;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) ddpBoxDrag.moved = true;
      if (ddpBoxDrag.moved) {
        customDDPPositions[ddpBoxDrag.nodeId] = {
          x: Math.round((ddpBoxDrag.startBoxX + dx) / 8) * 8,
          y: Math.round((ddpBoxDrag.startBoxY + dy) / 8) * 8
        };
        if (!ddpBoxDrag.rafPending) {
          ddpBoxDrag.rafPending = true;
          requestAnimationFrame(() => {
            ddpBoxDrag.rafPending = false;
            renderDDPView(false);
          });
        }
      }
      return;
    }
    if (!dfdBoxDrag.active) return;
    const scale = (dfdPanZoom && dfdPanZoom.state && dfdPanZoom.state.scale) || 1;
    const dx = (e.clientX - dfdBoxDrag.startClientX) / scale;
    const dy = (e.clientY - dfdBoxDrag.startClientY) / scale;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dfdBoxDrag.moved = true;
    if (!dfdBoxDrag.moved) return;
    const snappedX = Math.round((dfdBoxDrag.startBoxX + dx) / 8) * 8;
    const snappedY = Math.round((dfdBoxDrag.startBoxY + dy) / 8) * 8;
    const targetPositions = getCustomPositions();
    targetPositions[dfdBoxDrag.nodeId] = { x: snappedX, y: snappedY };
    if (!dfdBoxDrag.rafPending) {
      dfdBoxDrag.rafPending = true;
      requestAnimationFrame(() => {
        dfdBoxDrag.rafPending = false;
        renderDFDView(false);
      });
    }
  });

  window.addEventListener('mouseup', () => {
    if (ddpBoxDrag.active) {
      if (ddpBoxDrag.moved && ddpBoxDrag.preSnap) {
        pushDDPUndo(ddpBoxDrag.preSnap);
        savePersistedPositions();
      }
      setTimeout(() => { ddpBoxDrag.moved = false; }, 0);
      ddpBoxDrag.active = false;
      ddpBoxDrag.preSnap = null;
    }
    if (dfdBoxDrag.active) {
      if (dfdBoxDrag.moved && dfdBoxDrag.preSnap) {
        pushDFDUndo(dfdBoxDrag.preSnap);
        savePersistedPositions();
      }
      setTimeout(() => { dfdBoxDrag.moved = false; }, 0);
      dfdBoxDrag.active = false;
      dfdBoxDrag.preSnap = null;
    }
  });

  function updateDFDToolbarButtons() {
    if (dfdLevel1Btn && dfdLevel0Btn && dfdToggleKmBtn) {
      if (dfdActiveLevel === 0) {
        dfdLevel0Btn.classList.add('active');
        dfdLevel1Btn.classList.remove('active');
        dfdToggleKmBtn.classList.remove('active');
        dfdToggleKmBtn.disabled = true;
        dfdToggleKmBtn.textContent = 'Περίγραμμα ΚΜ: N/A';
        dfdToggleKmBtn.setAttribute('title', 'Το Περίγραμμα ΚΜ δεν εφαρμόζεται στο Διάγραμμα Πλαισίου (Επίπεδο 0)');
        dfdToggleKmBtn.style.opacity = '0.55';
        dfdToggleKmBtn.style.cursor = 'not-allowed';
      } else {
        dfdLevel1Btn.classList.add('active');
        dfdLevel0Btn.classList.remove('active');
        dfdToggleKmBtn.disabled = false;
        dfdToggleKmBtn.style.opacity = '1';
        dfdToggleKmBtn.style.cursor = 'pointer';
        if (dfdShowKMFrame) {
          dfdToggleKmBtn.classList.add('active');
          dfdToggleKmBtn.textContent = 'Περίγραμμα ΚΜ: ON';
          dfdToggleKmBtn.setAttribute('title', 'Κλικ για απόκρυψη του περιγράμματος Κεντρικού Μετασχηματισμού');
        } else {
          dfdToggleKmBtn.classList.remove('active');
          dfdToggleKmBtn.textContent = 'Περίγραμμα ΚΜ: OFF';
          dfdToggleKmBtn.setAttribute('title', 'Κλικ για εμφάνιση του περιγράμματος Κεντρικού Μετασχηματισμού');
        }
      }
    }
    if (dfdCloneToggleBtn) {
      dfdCloneToggleBtn.classList.toggle('active', dfdClonePeripherals);
      dfdCloneToggleBtn.textContent = dfdClonePeripherals
        ? 'Επανάληψη Αποθηκών: ON'
        : 'Επανάληψη Αποθηκών: OFF';
    }
  }

  if (dfdLevel1Btn) {
    dfdLevel1Btn.addEventListener('click', () => {
      if (dfdActiveLevel === 1) return;
      dfdActiveLevel = 1;
      updateDFDToolbarButtons();
      renderDFDView(true);
      showToast('Εμφάνιση ΔΡΔ Επιπέδου 1 (Αναλυτικό).');
    });
  }

  if (dfdLevel0Btn) {
    dfdLevel0Btn.addEventListener('click', () => {
      if (dfdActiveLevel === 0) return;
      dfdActiveLevel = 0;
      updateDFDToolbarButtons();
      renderDFDView(true);
      showToast('Εμφάνιση Διαγράμματος Πλαισίου (Επίπεδο 0).');
    });
  }

  if (dfdToggleKmBtn) {
    dfdToggleKmBtn.addEventListener('click', () => {
      if (dfdActiveLevel === 0) return;
      userOverrodeKM = true;
      dfdShowKMFrame = !dfdShowKMFrame;
      customDFDPositionsLevel1 = {};
      updateDFDToolbarButtons();
      renderDFDView(true);
      showToast(dfdShowKMFrame ? 'Περίγραμμα ΚΜ: Ενεργό.' : 'Περίγραμμα ΚΜ: Ανενεργό (Κάθετη Διάταξη ΕΑΠ).');
    });
  }

  ddpZoomIn.addEventListener('click', () => ddpPanZoom.zoomIn());
  ddpZoomOut.addEventListener('click', () => ddpPanZoom.zoomOut());
  ddpZoomFit.addEventListener('click', () => ddpPanZoom.fit());
  if (ddpAutoLayout) {
    ddpAutoLayout.addEventListener('click', () => {
      if (Object.keys(customDDPPositions).length > 0) {
        pushDDPUndo(JSON.parse(JSON.stringify(customDDPPositions)));
      }
      customDDPPositions = {};
      savePersistedPositions();
      renderDDPView(true);
      showToast('Η αυτόματη διάταξη του ΔΔΠ επαναφέρθηκε.');
    });
  }

  dfdZoomIn.addEventListener('click', () => dfdPanZoom.zoomIn());
  dfdZoomOut.addEventListener('click', () => dfdPanZoom.zoomOut());
  dfdZoomFit.addEventListener('click', () => dfdPanZoom.fit());
  if (dfdAutoLayout) {
    dfdAutoLayout.addEventListener('click', () => {
      pushDFDUndo({
        l1: JSON.parse(JSON.stringify(customDFDPositionsLevel1)),
        l0: JSON.parse(JSON.stringify(customDFDPositionsLevel0))
      });
      if (dfdActiveLevel === 0) {
        customDFDPositionsLevel0 = {};
      } else {
        customDFDPositionsLevel1 = {};
      }
      savePersistedPositions();
      renderDFDView(true);
      showToast('Η αυτόματη διάταξη του ΔΡΔ επαναφέρθηκε.');
    });
  }

  // ---------------------------------------------------------------------------
  // CANVAS DIMENSION MANAGEMENT (DDP & DFD)
  // ---------------------------------------------------------------------------
  const CANVAS_PRESETS = {
    'auto': null,
    'a4-landscape': { width: 1120, height: 790 },
    'a4-portrait': { width: 790, height: 1120 },
    '1280x720': { width: 1280, height: 720 },
    '1920x1080': { width: 1920, height: 1080 }
  };

  function parseSavedDims(key, fallback) {
    const raw = SettingsManager.get(key, null);
    if (!raw) return fallback;
    if (typeof raw === 'object' && raw.width && raw.height) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.width && parsed.height) return parsed;
    } catch (e) { /* ignore legacy value */ }
    return fallback;
  }

  let ddpCanvasSetting = SettingsManager.get('pli11DdpCanvasSetting', 'auto');
  let ddpCustomCanvas = parseSavedDims('pli11DdpCustomCanvas', { width: 1400, height: 900 });

  let dfdCanvasSetting = SettingsManager.get('pli11DfdCanvasSetting', 'auto');
  let dfdCustomCanvas = parseSavedDims('pli11DfdCustomCanvas', { width: 1400, height: 900 });

  function getCanvasDims(setting, custom) {
    if (setting === 'auto') return null;
    if (setting === 'custom') return custom && custom.width && custom.height ? custom : null;
    return CANVAS_PRESETS[setting] || null;
  }

  if (ddpCanvasSizeSelect) {
    ddpCanvasSizeSelect.value = ddpCanvasSetting;
    ddpCanvasSizeSelect.addEventListener('change', () => {
      const val = ddpCanvasSizeSelect.value;
      if (val === 'custom') {
        const currentPrompt = `${ddpCustomCanvas.width}x${ddpCustomCanvas.height}`;
        ddpCanvasSizeSelect.value = ddpCanvasSetting;
        Common.showPrompt('Εισάγετε διαστάσεις καμβά ΔΔΠ (Πλάτος x Ύψος σε px, π.χ. 1600x900):', {
          title: 'Προσαρμοσμένες Διαστάσεις ΔΔΠ',
          defaultValue: currentPrompt,
          onSubmit: (input) => {
            if (!input) return;
            const parts = input.toLowerCase().replace(/[,x×]/g, ' ').trim().split(/\s+/).map(Number);
            if (parts.length >= 2 && parts[0] >= 300 && parts[1] >= 200) {
              ddpCustomCanvas = { width: Math.round(parts[0]), height: Math.round(parts[1]) };
              SettingsManager.set('pli11DdpCustomCanvas', JSON.stringify(ddpCustomCanvas));
              ddpCanvasSetting = 'custom';
              ddpCanvasSizeSelect.value = 'custom';
              SettingsManager.set('pli11DdpCanvasSetting', ddpCanvasSetting);
              renderDDPView(true);
              showToast(`Καμβάς ΔΔΠ: ${ddpCustomCanvas.width} × ${ddpCustomCanvas.height} px`);
            } else {
              showToast('Μη έγκυρες διαστάσεις (π.χ. 1600x900).');
            }
          }
        });
        return;
      }
      ddpCanvasSetting = val;
      SettingsManager.set('pli11DdpCanvasSetting', ddpCanvasSetting);
      renderDDPView(true);
      const dims = getCanvasDims(ddpCanvasSetting, ddpCustomCanvas);
      showToast(dims ? `Καμβάς ΔΔΠ: ${dims.width} × ${dims.height} px` : 'Καμβάς ΔΔΠ: Αυτόματο (Fit)');
    });
  }

  if (dfdCanvasSizeSelect) {
    dfdCanvasSizeSelect.value = dfdCanvasSetting;
    dfdCanvasSizeSelect.addEventListener('change', () => {
      const val = dfdCanvasSizeSelect.value;
      if (val === 'custom') {
        const currentPrompt = `${dfdCustomCanvas.width}x${dfdCustomCanvas.height}`;
        dfdCanvasSizeSelect.value = dfdCanvasSetting;
        Common.showPrompt('Εισάγετε διαστάσεις καμβά ΔΡΔ (Πλάτος x Ύψος σε px, π.χ. 1600x900):', {
          title: 'Προσαρμοσμένες Διαστάσεις ΔΡΔ',
          defaultValue: currentPrompt,
          onSubmit: (input) => {
            if (!input) return;
            const parts = input.toLowerCase().replace(/[,x×]/g, ' ').trim().split(/\s+/).map(Number);
            if (parts.length >= 2 && parts[0] >= 300 && parts[1] >= 200) {
              dfdCustomCanvas = { width: Math.round(parts[0]), height: Math.round(parts[1]) };
              SettingsManager.set('pli11DfdCustomCanvas', JSON.stringify(dfdCustomCanvas));
              dfdCanvasSetting = 'custom';
              dfdCanvasSizeSelect.value = 'custom';
              SettingsManager.set('pli11DfdCanvasSetting', dfdCanvasSetting);
              renderDFDView(true);
              showToast(`Καμβάς ΔΡΔ: ${dfdCustomCanvas.width} × ${dfdCustomCanvas.height} px`);
            } else {
              showToast('Μη έγκυρες διαστάσεις (π.χ. 1600x900).');
            }
          }
        });
        return;
      }
      dfdCanvasSetting = val;
      SettingsManager.set('pli11DfdCanvasSetting', dfdCanvasSetting);
      renderDFDView(true);
      const dims = getCanvasDims(dfdCanvasSetting, dfdCustomCanvas);
      showToast(dims ? `Καμβάς ΔΡΔ: ${dims.width} × ${dims.height} px` : 'Καμβάς ΔΡΔ: Αυτόματο (Fit)');
    });
  }

  ddpPrintBtn.addEventListener('click', () => {
    ddpPrintMode = !ddpPrintMode;
    ddpPrintBtn.classList.toggle('active', ddpPrintMode);
    renderDDPView();
  });

  dfdPrintBtn.addEventListener('click', () => {
    dfdPrintMode = !dfdPrintMode;
    dfdPrintBtn.classList.toggle('active', dfdPrintMode);
    renderDFDView();
  });

  ddpExportSvg.addEventListener('click', () => {
    if (!currentCompiled) return;
    const dims = getCanvasDims(ddpCanvasSetting, ddpCustomCanvas);
    const svg = Renderer.renderDDPSVG(currentCompiled.model, {
      printMode: ddpPrintMode,
      theme: getCurrentTheme(),
      positions: customDDPPositions,
      canvasWidth: dims ? dims.width : null,
      canvasHeight: dims ? dims.height : null
    });
    Renderer.downloadSVG(svg, 'eap-pli11-ddp.svg');
    showToast('Το ΔΔΠ εξήχθη ως SVG!');
  });

  ddpExportPng.addEventListener('click', () => {
    if (!currentCompiled) return;
    const svg = Renderer.renderDDPSVG(currentCompiled.model, {
      printMode: true,
      theme: getCurrentTheme(),
      positions: customDDPPositions,
      tightCrop: true
    });
    Renderer.downloadPNG(svg, 'eap-pli11-ddp.png', 3)
      .then(() => showToast('Το ΔΔΠ εξήχθη ως PNG υψηλής ανάλυσης (300+ DPI για Word)!'))
      .catch((err) => showToast('Σφάλμα εξαγωγής PNG: ' + (err.message || 'Αποτυχία')));
  });

  if (ddpCopyPng) {
    ddpCopyPng.addEventListener('click', () => {
      if (!currentCompiled) return;
      const svg = Renderer.renderDDPSVG(currentCompiled.model, {
        printMode: true,
        theme: getCurrentTheme(),
        positions: customDDPPositions,
        tightCrop: true
      });
      Renderer.copyPNGToClipboard(svg, 3)
        .then(() => showToast('Το ΔΔΠ αντιγράφηκε ως PNG υψηλής ανάλυσης! Πατήστε Ctrl+V στο Word.'))
        .catch(() => {
          Renderer.downloadPNG(svg, 'eap-pli11-ddp.png', 3)
            .then(() => showToast('Έγινε λήψη αρχείου PNG (έτοιμο για Word)!'))
            .catch((err) => showToast('Σφάλμα: ' + (err.message || 'Αποτυχία')));
        });
    });
  }

  dfdExportSvg.addEventListener('click', () => {
    const activeDFD = getActiveDFD();
    if (!activeDFD) return;
    const dims = getCanvasDims(dfdCanvasSetting, dfdCustomCanvas);
    const svg = Renderer.renderDFDSVG(activeDFD, {
      printMode: dfdPrintMode,
      theme: getCurrentTheme(),
      positions: getCustomPositions(),
      showKMFrame: dfdActiveLevel === 0 ? false : dfdShowKMFrame,
      layoutMode: dfdLayoutMode,
      clonePeripherals: dfdClonePeripherals,
      canvasWidth: dims ? dims.width : null,
      canvasHeight: dims ? dims.height : null
    });
    const filename = dfdActiveLevel === 0 ? 'eap-pli11-context-diagram.svg' : 'eap-pli11-drd-level1.svg';
    Renderer.downloadSVG(svg, filename);
    showToast(`Το ${dfdActiveLevel === 0 ? 'Διάγραμμα Πλαισίου' : 'ΔΡΔ'} εξήχθη ως SVG!`);
  });

  dfdExportPng.addEventListener('click', () => {
    const activeDFD = getActiveDFD();
    if (!activeDFD) return;
    const svg = Renderer.renderDFDSVG(activeDFD, {
      printMode: true,
      theme: getCurrentTheme(),
      positions: getCustomPositions(),
      showKMFrame: dfdActiveLevel === 0 ? false : dfdShowKMFrame,
      layoutMode: dfdLayoutMode,
      clonePeripherals: dfdClonePeripherals,
      tightCrop: true
    });
    const filename = dfdActiveLevel === 0 ? 'eap-pli11-context-diagram.png' : 'eap-pli11-drd-level1.png';
    Renderer.downloadPNG(svg, filename, 3)
      .then(() => showToast(`Το ${dfdActiveLevel === 0 ? 'Διάγραμμα Πλαισίου' : 'ΔΡΔ'} εξήχθη ως PNG (300+ DPI για Word)!`))
      .catch((err) => showToast('Σφάλμα εξαγωγής PNG: ' + (err.message || 'Αποτυχία')));
  });

  if (dfdCopyPng) {
    dfdCopyPng.addEventListener('click', () => {
      const activeDFD = getActiveDFD();
      if (!activeDFD) return;
      const svg = Renderer.renderDFDSVG(activeDFD, {
        printMode: true,
        theme: getCurrentTheme(),
        positions: getCustomPositions(),
        showKMFrame: dfdActiveLevel === 0 ? false : dfdShowKMFrame,
        layoutMode: dfdLayoutMode,
        clonePeripherals: dfdClonePeripherals,
        tightCrop: true
      });
      Renderer.copyPNGToClipboard(svg, 3)
        .then(() => showToast('Το ΔΡΔ αντιγράφηκε ως PNG υψηλής ανάλυσης! Πατήστε Ctrl+V στο Word.'))
        .catch(() => {
          Renderer.downloadPNG(svg, 'eap-pli11-drd.png', 3)
            .then(() => showToast('Έγινε λήψη αρχείου PNG (έτοιμο για Word)!'))
            .catch((err) => showToast('Σφάλμα: ' + (err.message || 'Αποτυχία')));
        });
    });
  }

  // ---------------------------------------------------------------------------
  // JUMP TO LINE IN CODEMIRROR
  // ---------------------------------------------------------------------------
  function jumpToLine(lineNumber) {
    if (!lineNumber || lineNumber < 1) return;
    if (document.body.classList.contains('output-fullscreen')) {
      setOutputFullscreen(false);
    }
    if (typeof setPaneFocus === 'function' && currentPaneFocus === 'output') {
      setPaneFocus('both');
    }
    const ln = Math.min(lineNumber - 1, editor.lineCount() - 1);
    editor.setCursor({ line: ln, ch: 0 });
    editor.scrollIntoView({ line: ln, ch: 0 }, 120);
    editor.focus();
  }

  function clearErrorLineMarks() {
    for (const h of errorLineHandles) {
      editor.removeLineClass(h, 'background', 'cm-pli11-error-line');
    }
    errorLineHandles = [];
    editor.clearGutter('cm-pli11-diag');
  }

  let activeCtxPopover = null;
  function closeCtxPopover() {
    if (activeCtxPopover) {
      activeCtxPopover.remove();
      activeCtxPopover = null;
    }
  }
  document.addEventListener('mousedown', (e) => {
    if (activeCtxPopover && !activeCtxPopover.contains(e.target)) closeCtxPopover();
  });

  function openDiagnosticPopover(clientX, clientY, diagList) {
    closeCtxPopover();
    const d = diagList[0];
    if (!d) return;
    const pop = Common.el('div', { class: 'eap-canvas-ctx-popover' });
    const canFix = Boolean(d.fixAction && Core.applyQuickFix);
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
    activeCtxPopover = pop;
    pop.querySelector('[data-close]').addEventListener('click', closeCtxPopover);
    const fixB = pop.querySelector('[data-fix]');
    if (fixB) {
      fixB.addEventListener('click', () => {
        const fixed = Core.applyQuickFix(editor.getValue(), d);
        if (fixed !== editor.getValue()) {
          const si = editor.getScrollInfo();
          editor.setValue(fixed);
          editor.scrollTo(si.left, si.top);
          runCompile({ fit: false });
          showToast('Εφαρμόστηκε αυτόματη διόρθωση!');
        }
        closeCtxPopover();
      });
    }
  }

  function clearTraceLineMark() {
    if (traceLineHandle !== null) {
      editor.removeLineClass(traceLineHandle, 'background', 'cm-pli11-trace-line');
      traceLineHandle = null;
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER VIEWS
  // ---------------------------------------------------------------------------
  function archLabel(arch) {
    switch (arch) {
      case 'TRANSACTION_CENTER': return 'Κέντρο Δοσοληψιών (ΚΔ)';
      case 'COMPOSITE_CM': return 'Σύνθετος ΚΜ';
      case 'SIMPLE_CM': return 'Απλός ΚΜ';
      case 'CONTROL_HIERARCHY': return 'Ιεραρχία Ελέγχου';
      default: return 'Μονάδες Προγράμματος';
    }
  }

  function renderDDPView(fitAfter = false) {
    if (!currentCompiled) return;
    const activeStep = traceIndex >= 0 && currentCompiled.callTrace[traceIndex]
      ? currentCompiled.callTrace[traceIndex]
      : null;
    const dims = getCanvasDims(ddpCanvasSetting, ddpCustomCanvas);

    const svgStr = Renderer.renderDDPSVG(currentCompiled.model, {
      printMode: ddpPrintMode,
      theme: getCurrentTheme(),
      positions: customDDPPositions,
      activeNodeId: activeStep ? activeStep.activeNodeId : null,
      activeEdgeId: activeStep ? activeStep.activeEdgeId : null,
      canvasWidth: dims ? dims.width : null,
      canvasHeight: dims ? dims.height : null
    });
    ddpCanvas.innerHTML = svgStr;

    // Click node to jump to line in editor; drag node to reposition
    ddpCanvas.querySelectorAll('.ddp-node').forEach((g) => {
      g.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const nid = g.getAttribute('data-node-id');
        const bx = parseFloat(g.getAttribute('data-x')) || 0;
        const by = parseFloat(g.getAttribute('data-y')) || 0;
        ddpBoxDrag.active = true;
        ddpBoxDrag.moved = false;
        ddpBoxDrag.preSnap = JSON.parse(JSON.stringify(customDDPPositions));
        ddpBoxDrag.nodeId = nid;
        ddpBoxDrag.startClientX = e.clientX;
        ddpBoxDrag.startClientY = e.clientY;
        ddpBoxDrag.startBoxX = bx;
        ddpBoxDrag.startBoxY = by;
      });
      g.addEventListener('click', () => {
        if (ddpPanZoom.wasDragged() || ddpBoxDrag.moved) return;
        const ln = parseInt(g.getAttribute('data-line'), 10);
        if (ln > 0) jumpToLine(ln);
      });
    });

    if (fitAfter) {
      requestAnimationFrame(() => ddpPanZoom.fit());
    }
  }

  function bindInteractiveDFDNodes() {
    dfdCanvas.querySelectorAll('.dfd-node, .dfd-store, .dfd-entity').forEach((g) => {
      g.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        const nid = g.getAttribute('data-node-id');
        const bx = parseFloat(g.getAttribute('data-x')) || 0;
        const by = parseFloat(g.getAttribute('data-y')) || 0;
        dfdBoxDrag.active = true;
        dfdBoxDrag.moved = false;
        dfdBoxDrag.preSnap = {
          l1: JSON.parse(JSON.stringify(customDFDPositionsLevel1)),
          l0: JSON.parse(JSON.stringify(customDFDPositionsLevel0))
        };
        dfdBoxDrag.nodeId = nid;
        dfdBoxDrag.startClientX = e.clientX;
        dfdBoxDrag.startClientY = e.clientY;
        dfdBoxDrag.startBoxX = bx;
        dfdBoxDrag.startBoxY = by;
      });

      g.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const ln = parseInt(g.getAttribute('data-line'), 10);
        if (ln > 0) {
          jumpToLine(ln);
          showToast(`Μετάβαση στη γραμμή ${ln} του ψευδοκώδικα`);
        }
      });

      g.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rawId = g.getAttribute('data-node-id') || '';
        const baseId = rawId.replace(/__B\d+$/, '');
        const activeDFD = getActiveDFD();
        const nodeObj = activeDFD && (activeDFD.nodes || []).find((n) => n.id === baseId);
        if (!nodeObj) return;
        const ln = parseInt(g.getAttribute('data-line'), 10) || nodeObj.sourceLine || 0;
        const cleanLabel = String(nodeObj.label || nodeObj.key || '').replace(/\s+/g, ' ').trim();

        closeCtxPopover();
        const pop = Common.el('div', { class: 'eap-canvas-ctx-popover' });
        pop.innerHTML = `
          <div class="eap-canvas-ctx-head">
            <span>⚙️ ${escapeHTML(cleanLabel)}</span>
            <button type="button" class="tool-mini-btn" data-close>&times;</button>
          </div>
          ${nodeObj.type === 'process' && nodeObj.key ? `
            <div style="font-size:0.73rem; opacity:0.85;">Μετονομασία ετικέτας (<code>@ALIAS</code>):</div>
            <div class="eap-canvas-ctx-row">
              <input type="text" data-alias-inp value="${escapeHTML(cleanLabel)}" placeholder="Νέος τίτλος...">
              <button type="button" class="tool-mini-btn" data-save-alias>OK</button>
            </div>
            <button type="button" class="tool-mini-btn" data-toggle-km style="width:100%;">
              ${nodeObj.isCentral ? 'Αφαίρεση από Κεντρικό Μετασχηματισμό (ΚΜ)' : 'Ορισμός ως Κεντρικός Μετασχηματισμός (@KM)'}
            </button>
          ` : ''}
          ${ln > 0 ? `<button type="button" class="tool-mini-btn" data-jump style="width:100%;">↪ Μετάβαση στη Γραμμή ${ln}</button>` : ''}
        `;
        pop.style.left = Math.min(window.innerWidth - 320, Math.max(8, e.clientX)) + 'px';
        pop.style.top = Math.min(window.innerHeight - 200, Math.max(8, e.clientY)) + 'px';
        document.body.appendChild(pop);
        activeCtxPopover = pop;

        pop.querySelector('[data-close]').addEventListener('click', closeCtxPopover);
        const jumpB = pop.querySelector('[data-jump]');
        if (jumpB) {
          jumpB.addEventListener('click', () => {
            closeCtxPopover();
            jumpToLine(ln);
          });
        }
        const saveAliasB = pop.querySelector('[data-save-alias]');
        if (saveAliasB) {
          saveAliasB.addEventListener('click', () => {
            const val = pop.querySelector('[data-alias-inp]').value.trim().replace(/"/g, "'");
            if (!val) return;
            const directive = `/* @ALIAS: ${nodeObj.key} = "${val}" */`;
            editor.setValue(`${directive}\n${editor.getValue()}`);
            runCompile({ fit: false });
            closeCtxPopover();
            showToast(`Προστέθηκε οδηγία @ALIAS για «${nodeObj.key}»!`);
          });
        }
        const kmB = pop.querySelector('[data-toggle-km]');
        if (kmB) {
          kmB.addEventListener('click', () => {
            const curCentrals = (activeDFD.processes || []).filter((p) => p.isCentral).map((p) => p.key);
            const nextSet = nodeObj.isCentral
              ? curCentrals.filter((k) => k !== nodeObj.key)
              : [...curCentrals, nodeObj.key];
            const cleanSrc = editor.getValue().replace(/\/\*\s*@KM:[^*]*\*\/\s*\n?/gi, '');
            const kmDirective = nextSet.length > 0 ? `/* @KM: ${nextSet.join(', ')} */\n` : `/* @KM: NONE */\n`;
            editor.setValue(kmDirective + cleanSrc);
            runCompile({ fit: false });
            closeCtxPopover();
            showToast('Ενημερώθηκε ο Κεντρικός Μετασχηματισμός (@KM)!');
          });
        }
      });
    });
  }

  function renderDFDView(fitAfter = false) {
    if (!currentCompiled) return;
    const activeDFD = getActiveDFD();
    if (!activeDFD) return;
    const dims = getCanvasDims(dfdCanvasSetting, dfdCustomCanvas);

    dfdInfoBar.hidden = !activeDFD.hasGenericIO;
    dfdCanvas.innerHTML = Renderer.renderDFDSVG(activeDFD, {
      printMode: dfdPrintMode,
      theme: getCurrentTheme(),
      positions: getCustomPositions(),
      showKMFrame: dfdActiveLevel === 0 ? false : dfdShowKMFrame,
      layoutMode: dfdLayoutMode,
      clonePeripherals: dfdClonePeripherals,
      canvasWidth: dims ? dims.width : null,
      canvasHeight: dims ? dims.height : null
    });
    bindInteractiveDFDNodes();
    updateDFDToolbarButtons();
    if (fitAfter) {
      requestAnimationFrame(() => dfdPanZoom.fit());
    }
  }

  function renderStatsAndHeader() {
    const { model } = currentCompiled;
    const rootName = model.rootNode ? model.rootNode.name : 'Χωρίς Ρίζα';
    editorTitle.textContent = `Ψευδοκώδικας ΠΛΗ11 - ${rootName}`;
    archBadge.textContent = archLabel(model.architecture);
    archBadge.setAttribute('title', `Ανιχνευμένη αρχιτεκτονική δομή: ${archLabel(model.architecture)} (ενημερώνεται αυτόματα)`);

    cntControl.textContent = model.counts.control;
    cntCalc.textContent = model.counts.calc;
    cntPres.textContent = model.counts.presentation;
    cntData.textContent = model.counts.dataMgmt;
    cntIOGeneric.textContent = model.counts.ioGeneric;
    cntIOGenericWrap.hidden = model.counts.ioGeneric === 0;
    cntStubs.textContent = model.counts.stubs;
    cntStubsWrap.hidden = model.counts.stubs === 0;
  }

  function renderValidatorView() {
    const { validation } = currentCompiled;
    const { errorCount, warningCount, infoCount } = validation.summary;

    clearErrorLineMarks();
    const markedLines = new Set();
    const diagsByLine = new Map();
    for (const d of validation.diagnostics) {
      if (d.line > 0 && (d.severity === 'error' || d.severity === 'warning')) {
        if (!diagsByLine.has(d.line)) diagsByLine.set(d.line, []);
        diagsByLine.get(d.line).push(d);
      }
      if (d.severity === 'error' && d.line > 0 && !markedLines.has(d.line)) {
        markedLines.add(d.line);
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
        openDiagnosticPopover(ev.clientX, ev.clientY, list);
      });
      editor.setGutterMarker(Math.min(ln - 1, editor.lineCount() - 1), 'cm-pli11-diag', marker);
    }

    valBadge.classList.remove('has-errors', 'all-ok');
    valSummaryCard.classList.remove('has-errors', 'ok');

    if (errorCount === 0) {
      valBadge.textContent = 'OK';
      valBadge.classList.add('all-ok');
      valSummaryCard.classList.add('ok');
      valSummaryTitle.textContent = 'Επιτυχής Έλεγχος Μεθοδολογίας ΕΑΠ';
      valSummarySub.textContent = 'Ο ψευδοκώδικας τηρεί όλους τους κανόνες μετάβασης ΔΔΠ ↔ Ψευδοκώδικα.';
    } else {
      valBadge.textContent = String(errorCount);
      valBadge.classList.add('has-errors');
      valSummaryCard.classList.add('has-errors');
      valSummaryTitle.textContent = `Εντοπίστηκαν ${errorCount} σφάλματα μεθοδολογίας ΕΑΠ`;
      valSummarySub.textContent = 'Κάντε κλικ σε οποιαδήποτε παρατήρηση παρακάτω για να μεταβείτε στη γραμμή διόρθωσης.';
    }
    valSummaryCounts.textContent = `${errorCount} σφάλματα · ${warningCount} προειδοπ. · ${infoCount} σημειώσεις`;

    valChecklist.innerHTML = validation.checklist.map((item) => `
      <div class="val-check-item">
        <span class="val-check-mark ${item.ok ? 'pass' : 'fail'}">${item.ok ? 'PASS' : 'FAIL'}</span>
        <span>${escapeHTML(item.label)}</span>
      </div>
    `).join('');

    if (validation.diagnostics.length === 0) {
      valDiagnosticsList.innerHTML = '<div class="val-diag-item info"><div class="val-diag-msg">Καμία παρατήρηση. Όλα τα στοιχεία είναι έγκυρα.</div></div>';
      return;
    }

    valDiagnosticsList.innerHTML = '';
    for (const d of validation.diagnostics) {
      const div = document.createElement('div');
      div.className = `val-diag-item ${d.severity}`;
      const canFix = Boolean(d.fixAction && Core.applyQuickFix);
      div.innerHTML = `
        <div class="val-diag-head">
          <span class="val-diag-code">${escapeHTML(d.code)}</span>
          <span class="val-diag-loc">${d.procName ? escapeHTML(d.procName) + ' · ' : ''}Γραμμή ${d.line}</span>
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
          const fixedCode = Core.applyQuickFix(editor.getValue(), d);
          if (fixedCode !== editor.getValue()) {
            const scrollInfo = editor.getScrollInfo();
            editor.setValue(fixedCode);
            editor.scrollTo(scrollInfo.left, scrollInfo.top);
            runCompile({ fit: false });
            showToast('Εφαρμόστηκε αυτόματη διόρθωση στον ψευδοκώδικα!');
          }
        });
      }
      valDiagnosticsList.appendChild(div);
    }
  }

  // ---------------------------------------------------------------------------
  // EAP DATA DICTIONARY («ΛΕΞΙΚΟ ΔΕΔΟΜΕΝΩΝ ΔΡΔ») VIEW & EXPORTS
  // ---------------------------------------------------------------------------
  const ddBadge = document.getElementById('dd-badge');
  const ddTbody = document.getElementById('dd-tbody');
  const ddResetBtn = document.getElementById('dd-reset-btn');
  const ddCopyMdBtn = document.getElementById('dd-copy-md-btn');
  const ddCopyWordBtn = document.getElementById('dd-copy-word-btn');

  function getActiveDataDictionary() {
    if (!currentCompiled || !Core.generateDataDictionary) return [];
    const activeDFD = getActiveDFD();
    return Core.generateDataDictionary(activeDFD, ddCustomOverrides);
  }

  function renderDataDictionaryView() {
    const entries = getActiveDataDictionary();
    if (ddBadge) ddBadge.textContent = String(entries.length);
    if (!ddTbody) return;
    ddTbody.innerHTML = '';

    if (entries.length === 0) {
      ddTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem; opacity:0.75;">Δεν βρέθηκαν ροές ή αποθήκες δεδομένων στο τρέχον ΔΡΔ.</td></tr>';
      return;
    }

    for (const item of entries) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHTML(item.name)}</strong></td>
        <td><span class="dd-cat-pill">${escapeHTML(item.category)}</span></td>
        <td><input type="text" class="dd-def-input" value="${escapeHTML(item.eapSymbol)}" title="Συμβολισμός ΕΑΠ: = (ορίζεται ως), + (και), [Α|Β] (επιλογή), {Χ} (επανάληψη), (Ψ) (προαιρετικό)"></td>
        <td style="font-size:0.74rem;">${escapeHTML(item.routes)}</td>
        <td><input type="text" class="dd-notes-input" value="${escapeHTML(item.notes)}" placeholder="Σημείωση..."></td>
      `;
      const defInp = tr.querySelector('.dd-def-input');
      const notesInp = tr.querySelector('.dd-notes-input');
      defInp.addEventListener('change', () => {
        if (!ddCustomOverrides[item.key]) ddCustomOverrides[item.key] = {};
        ddCustomOverrides[item.key].definition = defInp.value.trim();
        saveDataDictOverrides();
      });
      notesInp.addEventListener('change', () => {
        if (!ddCustomOverrides[item.key]) ddCustomOverrides[item.key] = {};
        ddCustomOverrides[item.key].notes = notesInp.value.trim();
        saveDataDictOverrides();
      });
      ddTbody.appendChild(tr);
    }
  }

  if (ddResetBtn) {
    ddResetBtn.addEventListener('click', () => {
      ddCustomOverrides = {};
      saveDataDictOverrides();
      renderDataDictionaryView();
      showToast('Επαναφέρθηκαν οι αυτόματοι ορισμοί Λεξικού Δεδομένων.');
    });
  }

  if (ddCopyMdBtn) {
    ddCopyMdBtn.addEventListener('click', () => {
      const entries = getActiveDataDictionary();
      if (!entries.length) return;
      const lines = [
        '| Όνομα Στοιχείου | Κατηγορία | Ορισμός (Συμβολισμός ΕΑΠ) | Ροές / Κατεύθυνση | Σχόλια |',
        '| :--- | :--- | :--- | :--- | :--- |'
      ];
      for (const e of entries) {
        const esc = (s) => String(s || '').replace(/\|/g, '\\|');
        lines.push(`| **${esc(e.name)}** | ${esc(e.category)} | \`${esc(e.eapSymbol)}\` | ${esc(e.routes)} | ${esc(e.notes)} |`);
      }
      copyTextToClipboard(lines.join('\n'), 'Το Λεξικό Δεδομένων αντιγράφηκε σε Markdown!');
    });
  }

  if (ddCopyWordBtn) {
    ddCopyWordBtn.addEventListener('click', () => {
      const entries = getActiveDataDictionary();
      if (!entries.length) {
        showToast('Το Λεξικό Δεδομένων είναι κενό.');
        return;
      }
      const thStyle = 'border:1px solid #1e293b;padding:6px 10px;background:#e2e8f0;color:#0f172a;font-weight:bold;font-family:Calibri,Arial,sans-serif;font-size:10.5pt;text-align:left;';
      const tdStyle = 'border:1px solid #94a3b8;padding:5px 9px;color:#0f172a;font-family:Calibri,Arial,sans-serif;font-size:10pt;vertical-align:top;';
      const rowsHtml = entries.map((e) => `
        <tr>
          <td style="${tdStyle}font-weight:bold;">${escapeHTML(e.name)}</td>
          <td style="${tdStyle}">${escapeHTML(e.category)}</td>
          <td style="${tdStyle}font-family:Consolas,monospace;">${escapeHTML(e.eapSymbol)}</td>
          <td style="${tdStyle}">${escapeHTML(e.routes)}</td>
          <td style="${tdStyle}">${escapeHTML(e.notes)}</td>
        </tr>`).join('');
      const htmlTable = `<table style="border-collapse:collapse;width:100%;"><thead><tr>
        <th style="${thStyle}">Όνομα Στοιχείου</th>
        <th style="${thStyle}">Κατηγορία</th>
        <th style="${thStyle}">Ορισμός (Συμβολισμός ΕΑΠ)</th>
        <th style="${thStyle}">Ροές / Κατεύθυνση</th>
        <th style="${thStyle}">Σχόλια</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>`;
      const tsv = entries.map((e) => [e.name, e.category, e.eapSymbol, e.routes, e.notes].join('\t')).join('\n');
      Common.copyHtmlTableToClipboard(htmlTable, tsv, 'Το Λεξικό Δεδομένων αντιγράφηκε! Πατήστε Ctrl+V στο MS Word.');
    });
  }

  function getActiveMermaidCode() {
    if (!currentCompiled) return '';
    if (mermaidMode === 'ddp') return currentCompiled.ddpMermaid;
    const activeDFD = getActiveDFD();
    return activeDFD ? Core.generateDFDMermaid(activeDFD) : currentCompiled.dfdMermaid;
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
        storageKey: 'pli11MermaidVisualV1',
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
            Ο παραγόμενος κώδικας Mermaid παραπάνω είναι έτοιμος για επεξεργασία &amp; αντιγραφή, ενώ τα διαγράμματα <strong>ΔΔΠ</strong> και <strong>ΔΡΔ</strong> στα πρώτα 2 tabs λειτουργούν 100% offline.
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
      const id = `pli11_mmd_${mermaidRenderCounter}`;
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
            mermaidVisualEditor.attachToSVG(svgEl, mermaidMode);
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

  let mermaidCodeCollapsed = SettingsManager.get('pli11MermaidCodeCollapsed', 'false') === 'true';
  function applyMermaidCodeCollapse(collapsed) {
    mermaidCodeCollapsed = collapsed;
    SettingsManager.set('pli11MermaidCodeCollapsed', collapsed ? 'true' : 'false');
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
    const savedMmdH = SettingsManager.get('pli11MermaidEditorPct', '30%');
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
        SettingsManager.set('pli11MermaidEditorPct', mermaidEditorWrap.style.height);
        mermaidPanZoom.fit(false);
      },
      onDblClick: () => {
        mermaidEditorWrap.style.height = '30%';
        SettingsManager.set('pli11MermaidEditorPct', '30%');
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

    // Convert foreignObject to native SVG <text> elements to avoid browser SecurityError (tainted canvas)
    const fos = clone.querySelectorAll('foreignObject');
    fos.forEach((fo) => {
      const text = fo.textContent.trim();
      const fw = parseFloat(fo.getAttribute('width')) || 0;
      const fh = parseFloat(fo.getAttribute('height')) || 0;
      const fx = parseFloat(fo.getAttribute('x')) || 0;
      const fy = parseFloat(fo.getAttribute('y')) || 0;
      const child = fo.querySelector('span, div, p');
      const textColor = (child && window.getComputedStyle(child).color) || '#0f172a';
      const fontF = (child && window.getComputedStyle(child).fontFamily) || 'sans-serif';
      const fontS = (child && window.getComputedStyle(child).fontSize) || '14px';
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
      Renderer.downloadSVG(svgEl, `mermaid-${mermaidMode}.svg`);
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
      Renderer.downloadPNG(svgEl, `mermaid-${mermaidMode}.png`, 2)
        .then(() => showToast('Έγινε λήψη Mermaid PNG (HiDPI για MS Word)!'))
        .catch((err) => showToast('Αποτυχία εξαγωγής Mermaid σε PNG: ' + (err.message || 'Σφάλμα')));
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
          Renderer.downloadPNG(svgEl, `mermaid-${mermaidMode}.png`, 2)
            .then(() => showToast('Έγινε λήψη αρχείου PNG!'))
            .catch((err) => showToast('Σφάλμα: ' + (err.message || 'Αποτυχία')));
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

  mermaidModeDdpBtn.addEventListener('click', () => {
    mermaidMode = 'ddp';
    mermaidModeDdpBtn.classList.add('active');
    mermaidModeDfdBtn.classList.remove('active');
    mermaidIsUserEdited = false;
    updateMermaidStatusBadge();
    renderMermaidPreview({ forceRegenerate: true });
  });

  mermaidModeDfdBtn.addEventListener('click', () => {
    mermaidMode = 'dfd';
    mermaidModeDfdBtn.classList.add('active');
    mermaidModeDdpBtn.classList.remove('active');
    mermaidIsUserEdited = false;
    updateMermaidStatusBadge();
    renderMermaidPreview({ forceRegenerate: true });
  });

  mermaidRerenderBtn.addEventListener('click', () => renderMermaidPreview());

  if (copyMermaidBtn) {
    copyMermaidBtn.addEventListener('click', () => {
      const code = mermaidCodeView && mermaidCodeView.value ? mermaidCodeView.value : getActiveMermaidCode();
      if (!code) return;
      copyTextToClipboard(code, 'Ο κώδικας Mermaid αντιγράφηκε!');
    });
  }

  window.addEventListener('load', () => {
    if (currentCompiled) renderMermaidPreview();
  });

  // ---------------------------------------------------------------------------
  // COMPILE ORCHESTRATOR
  // ---------------------------------------------------------------------------
  function runCompile(opts = {}) {
    currentCompiled = Core.compilePLI11(editor.getValue());
    if (currentCompiled && currentCompiled.directives) {
      if (typeof currentCompiled.directives.level === 'number') {
        dfdActiveLevel = currentCompiled.directives.level;
      }
      if (currentCompiled.directives.noKM) {
        dfdShowKMFrame = false;
      } else if (currentCompiled.directives.central) {
        dfdShowKMFrame = true;
      } else if (!userOverrodeKM && currentCompiled.dfd) {
        dfdShowKMFrame = !currentCompiled.dfd.noKM;
      }
    }
    renderStatsAndHeader();
    renderDDPView(opts.fit !== false);
    renderDFDView(opts.fit !== false);
    renderDataDictionaryView();
    renderValidatorView();
    renderMermaidPreview();

    if (opts.switchToErrorsIfFailed && currentCompiled.validation.summary.errorCount > 0) {
      switchTab('tab-validator');
    } else if (opts.manualToast) {
      const errs = currentCompiled.validation.summary.errorCount;
      showToast(errs === 0 ? 'Μεταγλώττιση επιτυχής (0 σφάλματα)!' : `Εντοπίστηκαν ${errs} σφάλματα ΕΑΠ.`);
    }
  }

  compileButton.addEventListener('click', () => {
    stopAutoTrace();
    resetTraceState();
    runCompile({ manualToast: true, switchToErrorsIfFailed: false });
  });

  // Autosave draft & Multi-File Workspace Manager («Οι Εργασίες μου»)
  const autosave = Common.createAutosave({
    key: 'pli11DraftCode',
    getValue: () => editor.getValue(),
    setValue: (code) => { editor.setValue(code); },
    onRestore: () => showToast('Επαναφέρθηκε το πρόχειρο από την προηγούμενη συνεδρία!')
  });

  const workspaceMgr = Common.createWorkspaceManager
    ? Common.createWorkspaceManager({
        courseKey: 'pli11',
        defaultSlotTitle: 'Άσκηση 1 (ΠΛΗ11)',
        getCode: () => editor.getValue(),
        setCode: (code) => {
          stopAutoTrace();
          resetTraceState();
          editor.setValue(code);
          runCompile({ fit: true });
        },
        getExtraState: () => ({
          ddp: customDDPPositions,
          dfd1: customDFDPositionsLevel1,
          dfd0: customDFDPositionsLevel0,
          dd: ddCustomOverrides
        }),
        setExtraState: (extra) => {
          customDDPPositions = (extra && extra.ddp) || {};
          customDFDPositionsLevel1 = (extra && extra.dfd1) || {};
          customDFDPositionsLevel0 = (extra && extra.dfd0) || {};
          ddCustomOverrides = (extra && extra.dd) || {};
          savePersistedPositions();
          if (currentCompiled) {
            renderDDPView(true);
            renderDFDView(true);
            renderDataDictionaryView();
          }
        }
      })
    : null;

  let liveDebounceTimer = null;
  editor.on('change', () => {
    autosave.onChange();
    if (workspaceMgr) workspaceMgr.onChange();
    if (!liveCompileToggle.checked) return;
    clearTimeout(liveDebounceTimer);
    liveDebounceTimer = setTimeout(() => {
      if (traceIndex >= 0) {
        stopAutoTrace();
        resetTraceState();
      }
      runCompile({ fit: false });
    }, 240);
  });

  // ---------------------------------------------------------------------------
  // CALL-TRACE STEPPER
  // ---------------------------------------------------------------------------
  function resetTraceState() {
    traceIndex = -1;
    clearTraceLineMark();
    traceStatusBar.hidden = true;
    stopStepButton.disabled = true;
  }

  function stopAutoTrace() {
    if (autoStepTimer) {
      clearInterval(autoStepTimer);
      autoStepTimer = null;
    }
    stopStepButton.disabled = traceIndex < 0;
    autoStepButton.disabled = false;
  }

  function applyTraceStep(idx) {
    if (!currentCompiled || !currentCompiled.callTrace.length) {
      showToast('Δεν υπάρχουν βήματα εκτέλεσης.');
      return false;
    }
    if (idx >= currentCompiled.callTrace.length) {
      stopAutoTrace();
      showToast('Η ιχνηλάτηση ολοκληρώθηκε!');
      return false;
    }

    traceIndex = idx;
    const step = currentCompiled.callTrace[traceIndex];
    stopStepButton.disabled = false;

    // Ensure DDP tab is visible when tracing
    const ddpTabActive = document.getElementById('tab-ddp').classList.contains('active');
    if (!ddpTabActive) switchTab('tab-ddp');

    // Line highlight in CodeMirror
    clearTraceLineMark();
    if (step.line > 0) {
      const ln = Math.min(step.line - 1, editor.lineCount() - 1);
      traceLineHandle = editor.addLineClass(ln, 'background', 'cm-pli11-trace-line');
      editor.scrollIntoView({ line: ln, ch: 0 }, 100);
    }

    // Update status bar
    traceStatusBar.hidden = false;
    traceStepPill.textContent = `Βήμα ${step.step}/${currentCompiled.callTrace.length}`;
    traceSummaryText.textContent = step.summary;
    traceStackText.textContent = `Στοίβα κλήσεων: ${step.callStack.join(' → ')}`;

    const varEntries = Object.entries(step.varsSnapshot || {});
    traceVarsStrip.innerHTML = varEntries.map(([name, st]) => {
      const isReady = st.includes('τιμή') || st.includes('έξοδος') || st.includes('υπολογισμ') || st.includes('αναγνωσ');
      return `<span class="trace-var-chip ${isReady ? 'ready' : ''}">${escapeHTML(name)}: ${escapeHTML(st)}</span>`;
    }).join('');

    renderDDPView(false);
    return true;
  }

  function stepTrace() {
    if (!currentCompiled) runCompile();
    const nextIdx = traceIndex < 0 || traceIndex + 1 >= currentCompiled.callTrace.length ? 0 : traceIndex + 1;
    applyTraceStep(nextIdx);
  }

  stepButton.addEventListener('click', () => {
    stopAutoTrace();
    stepTrace();
  });

  autoStepButton.addEventListener('click', () => {
    if (!currentCompiled) runCompile();
    if (!currentCompiled.callTrace.length) {
      showToast('Δεν υπάρχουν βήματα εκτέλεσης.');
      return;
    }
    stopAutoTrace();
    autoStepButton.disabled = true;
    stopStepButton.disabled = false;
    if (traceIndex < 0 || traceIndex + 1 >= currentCompiled.callTrace.length) {
      applyTraceStep(0);
    } else {
      applyTraceStep(traceIndex + 1);
    }
    const delay = parseInt(speedSelect.value, 10) || 750;
    autoStepTimer = setInterval(() => {
      if (!applyTraceStep(traceIndex + 1)) {
        stopAutoTrace();
      }
    }, delay);
  });

  stopStepButton.addEventListener('click', () => {
    stopAutoTrace();
    resetTraceState();
    renderDDPView(false);
  });

  // ---------------------------------------------------------------------------
  // FORMAT, SHARE, FILE I/O, CLEAR
  // ---------------------------------------------------------------------------
  function formatEditorCode() {
    const cursor = editor.getCursor();
    editor.setValue(Core.formatPLI11(editor.getValue()));
    editor.setCursor(cursor);
    runCompile({ fit: false });
    showToast('Ο κώδικας μορφοποιήθηκε!');
  }

  formatButton.addEventListener('click', formatEditorCode);

  if (Common.attachTouchSymbolBar) {
    Common.attachTouchSymbolBar(editor, [';', ':', '(', ')', ',', 'IN', 'IN/OUT', ':=', '<>', '=', '"']);
  }

  const exportDocxBtn = document.getElementById('export-docx-btn');
  if (exportDocxBtn && window.EAPDocx) {
    exportDocxBtn.addEventListener('click', async () => {
      if (!currentCompiled) runCompile({ fit: false });
      showToast('Δημιουργία αρχείου Word (.docx)...');
      try {
        const slot = workspaceMgr ? workspaceMgr.getActiveSlot() : null;
        const rootName = (currentCompiled.model && currentCompiled.model.rootNode && currentCompiled.model.rootNode.name) || 'ΠΛΗ11';
        const ddpSvg = Renderer.renderDDPSVG(currentCompiled.model, {
          printMode: true,
          positions: customDDPPositions,
          tightCrop: true
        });
        const ddpPng = await window.EAPDocx.svgToPngBytes(ddpSvg, 3);

        const sections = [];
        if (slot && slot.notes && slot.notes.trim()) {
          sections.push({ type: 'heading', text: 'Εκφώνηση / Σημειώσεις' });
          sections.push({ type: 'paragraph', text: slot.notes.trim() });
        }

        sections.push({
          type: 'image',
          title: '1. Διάγραμμα Δομής Προγράμματος (ΔΔΠ)',
          pngBytes: ddpPng,
          caption: `Διάγραμμα Δομής Προγράμματος (${archLabel(currentCompiled.model.architecture)})`
        });

        if (currentCompiled.dfd && (currentCompiled.dfd.flows || []).length > 0) {
          const dfd1Svg = Renderer.renderDFDSVG(currentCompiled.dfd, {
            printMode: true,
            positions: customDFDPositionsLevel1,
            showKMFrame: dfdShowKMFrame,
            layoutMode: dfdLayoutMode,
            clonePeripherals: dfdClonePeripherals,
            tightCrop: true
          });
          const dfd1Png = await window.EAPDocx.svgToPngBytes(dfd1Svg, 3);
          sections.push({
            type: 'image',
            title: '2. Διάγραμμα Ροής Δεδομένων (ΔΡΔ Επιπέδου 1)',
            pngBytes: dfd1Png,
            caption: 'Διάγραμμα Ροής Δεδομένων Επιπέδου 1'
          });
        }

        if (currentCompiled.dfdLevel0 && (currentCompiled.dfdLevel0.flows || []).length > 0) {
          const dfd0Svg = Renderer.renderDFDSVG(currentCompiled.dfdLevel0, {
            printMode: true,
            positions: customDFDPositionsLevel0,
            showKMFrame: false,
            tightCrop: true
          });
          const dfd0Png = await window.EAPDocx.svgToPngBytes(dfd0Svg, 3);
          sections.push({
            type: 'image',
            title: '3. Διάγραμμα Πλαισίου (Επίπεδο 0)',
            pngBytes: dfd0Png,
            caption: 'Διάγραμμα Πλαισίου Συστήματος (Επίπεδο 0)'
          });
        }

        const ddEntries = getActiveDataDictionary();
        if (ddEntries.length > 0) {
          sections.push({
            type: 'table',
            title: '4. Λεξικό Δεδομένων ΔΡΔ (Συμβολισμός ΕΑΠ)',
            headers: ['Όνομα Στοιχείου', 'Κατηγορία', 'Ορισμός (Συμβολισμός ΕΑΠ)', 'Ροές / Κατεύθυνση', 'Σχόλια'],
            rows: ddEntries.map((e) => [e.name, e.category, e.eapSymbol, e.routes, e.notes]),
            monoColumns: [2]
          });
        }

        sections.push({
          type: 'code',
          title: '5. Ψευδοκώδικας ΠΛΗ11',
          code: editor.getValue(),
          lineNumbers: true
        });

        const safeFile = rootName.replace(/[^A-Za-zΑ-Ωα-ω0-9_\-]/g, '_') + '.docx';
        window.EAPDocx.downloadDocx({
          title: slot ? `${slot.title} — ${rootName}` : `Παραδοτέο ΠΛΗ11 — ${rootName}`,
          subtitle: `Ελληνικό Ανοικτό Πανεπιστήμιο (ΠΛΗ11) · Αρχιτεκτονική: ${archLabel(currentCompiled.model.architecture)} · ${new Date().toLocaleDateString('el-GR')}`,
          sections
        }, safeFile);
        showToast(`Το αρχείο Word (${safeFile}) εξήχθη επιτυχώς!`);
      } catch (err) {
        showToast('Σφάλμα εξαγωγής .docx: ' + (err.message || 'Αποτυχία'));
      }
    });
  }

  shareButton.addEventListener('click', () => {
    Common.shareCode(editor.getValue(), {
      ddp: customDDPPositions,
      dfd1: customDFDPositionsLevel1,
      dfd0: customDFDPositionsLevel0
    });
  });

  loadButton.addEventListener('click', async () => {
    const file = await Common.pickFile('.txt,.eap,.pli11');
    if (!file) return;
    try {
      const text = await Common.readTextFile(file);
      stopAutoTrace();
      resetTraceState();
      editor.setValue(text);
      runCompile({ fit: true });
      showToast(`Φορτώθηκε το αρχείο ${file.name}`);
    } catch (e) {
      showToast('Αποτυχία ανάγνωσης αρχείου.');
    }
  });

  saveButton.addEventListener('click', () => {
    const rootName = currentCompiled && currentCompiled.model.rootNode
      ? currentCompiled.model.rootNode.name
      : 'pli11_pseudocode';
    const safeName = rootName.replace(/[^A-Za-zΑ-Ωα-ω0-9_\-]/g, '_') + '.txt';
    Common.saveTextAsFile(editor.getValue(), safeName);
    showToast(`Αποθηκεύτηκε ως ${safeName}`);
  });

  clearButton.addEventListener('click', () => {
    Common.showConfirm('Καθαρισμός όλου του ψευδοκώδικα και των διατάξεων στον συντάκτη;', {
      danger: true,
      yesText: 'Καθαρισμός',
      onYes: () => {
        stopAutoTrace();
        resetTraceState();
        customDDPPositions = {};
        customDFDPositionsLevel1 = {};
        customDFDPositionsLevel0 = {};
        if (exampleSelector) exampleSelector.value = '';
        editor.setValue('');
        autosave.clear();
        runCompile({ fit: true });
        editor.focus();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // REVERSE DFD BUILDER (2-WAY SYNC TABLE <-> TEXT DSL)
  // ---------------------------------------------------------------------------
  let builderFlows = [];

  if (PLI11_DFD_PRESETS && dfdPresetSelect) {
    for (const [key, preset] of Object.entries(PLI11_DFD_PRESETS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = preset.name;
      dfdPresetSelect.appendChild(opt);
    }
    dfdPresetSelect.addEventListener('change', (e) => {
      const p = PLI11_DFD_PRESETS[e.target.value];
      if (p) loadDSLIntoBuilder(p.dsl);
    });
  }

  function renderBuilderTable() {
    dfdFlowsTbody.innerHTML = '';
    builderFlows.forEach((f, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select data-field="fromType">
            <option value="process" ${f.fromType === 'process' ? 'selected' : ''}>Μετασχηματισμός</option>
            <option value="entity" ${f.fromType === 'entity' ? 'selected' : ''}>Πηγή</option>
            <option value="store" ${f.fromType === 'store' ? 'selected' : ''}>Αποθήκη</option>
          </select>
        </td>
        <td><input type="text" data-field="from" value="${escapeHTML(f.from)}"></td>
        <td>
          <select data-field="toType">
            <option value="process" ${f.toType === 'process' ? 'selected' : ''}>Μετασχηματισμός</option>
            <option value="entity" ${f.toType === 'entity' ? 'selected' : ''}>Αποδέκτης</option>
            <option value="store" ${f.toType === 'store' ? 'selected' : ''}>Αποθήκη</option>
          </select>
        </td>
        <td><input type="text" data-field="to" value="${escapeHTML(f.to)}"></td>
        <td><input type="text" data-field="data" value="${escapeHTML((f.data || []).join(', '))}"></td>
        <td><button type="button" class="tool-mini-btn" title="Διαγραφή ροής">&times;</button></td>
      `;

      tr.querySelectorAll('select, input').forEach((el) => {
        el.addEventListener('change', () => {
          const field = el.getAttribute('data-field');
          if (field === 'data') {
            builderFlows[idx].data = el.value.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
          } else {
            builderFlows[idx][field] = el.value.trim();
          }
          syncBuilderTableToDSL();
        });
      });

      tr.querySelector('button').addEventListener('click', () => {
        builderFlows.splice(idx, 1);
        renderBuilderTable();
        syncBuilderTableToDSL();
      });

      dfdFlowsTbody.appendChild(tr);
    });
  }

  function formatEndpointDSL(name, type, isSource) {
    if (type === 'store') return /^Αποθ|^Αρχε/i.test(name) ? name : `ΑΠΟΘΗΚΗ ${name}`;
    if (type === 'entity') {
      if (/^Πηγ|^Αποδ/i.test(name)) return name;
      return `${isSource ? 'ΠΗΓΗ' : 'ΑΠΟΔΕΚΤΗΣ'} ${name}`;
    }
    return name;
  }

  function syncBuilderTableToDSL() {
    let centralLine = '';
    if (dfdModeSelect.value === 'NONE') {
      centralLine = '# Χωρίς περίγραμμα ΚΜ\nΧΩΡΙΣ_ΚΜ';
    } else {
      const modeTag = dfdModeSelect.value === 'KD' ? 'ΚΔ' : 'ΚΜ';
      const cVal = dfdCentralInput.value.trim();
      if (!cVal || /^(?:κανενας|none|οχι|0|-|χωρις)$/i.test(cVal)) {
        centralLine = '# Χωρίς περίγραμμα ΚΜ\nΧΩΡΙΣ_ΚΜ';
      } else {
        centralLine = `${modeTag}: ${cVal}`;
      }
    }
    const flowLines = builderFlows.map((f) => {
      const left = formatEndpointDSL(f.from, f.fromType, true);
      const right = formatEndpointDSL(f.to, f.toType, false);
      return `${left} -> ${right} : ${(f.data || []).join(', ')}`;
    });
    dfdDslInput.value = [centralLine, ...flowLines].join('\n');
  }

  function loadDSLIntoBuilder(dslText) {
    dfdDslInput.value = dslText;
    const spec = Core.parseDFDText(dslText);
    if (!spec.central || spec.central.length === 0) {
      dfdModeSelect.value = 'NONE';
      dfdCentralInput.value = '';
      dfdCentralInput.disabled = true;
      dfdCentralInput.placeholder = 'Χωρίς περίγραμμα (Απλό ΔΡΔ)';
    } else {
      dfdModeSelect.value = spec.mode === 'KD' ? 'KD' : 'KM';
      dfdCentralInput.value = spec.central.join(', ');
      dfdCentralInput.disabled = false;
      dfdCentralInput.placeholder = 'π.χ. M3, M4, M5';
    }
    builderFlows = spec.flows;
    renderBuilderTable();
  }

  dfdDslInput.addEventListener('input', () => {
    const spec = Core.parseDFDText(dfdDslInput.value);
    if (!spec.central || spec.central.length === 0) {
      dfdModeSelect.value = 'NONE';
      dfdCentralInput.value = '';
      dfdCentralInput.disabled = true;
      dfdCentralInput.placeholder = 'Χωρίς περίγραμμα (Απλό ΔΡΔ)';
    } else {
      dfdModeSelect.value = spec.mode === 'KD' ? 'KD' : 'KM';
      dfdCentralInput.value = spec.central.join(', ');
      dfdCentralInput.disabled = false;
      dfdCentralInput.placeholder = 'π.χ. M3, M4, M5';
    }
    builderFlows = spec.flows;
    renderBuilderTable();
  });

  dfdModeSelect.addEventListener('change', () => {
    if (dfdModeSelect.value === 'NONE') {
      dfdCentralInput.disabled = true;
      dfdCentralInput.placeholder = 'Χωρίς περίγραμμα (Απλό ΔΡΔ)';
    } else {
      dfdCentralInput.disabled = false;
      dfdCentralInput.placeholder = 'π.χ. M3, M4, M5';
      if (!dfdCentralInput.value.trim()) {
        dfdCentralInput.value = 'M1';
      }
    }
    syncBuilderTableToDSL();
  });
  dfdCentralInput.addEventListener('change', syncBuilderTableToDSL);

  dfdAddFlowBtn.addEventListener('click', () => {
    builderFlows.push({ fromType: 'process', from: 'M1', toType: 'process', to: 'M2', data: ['Χ'] });
    renderBuilderTable();
    syncBuilderTableToDSL();
  });

  dfdBuildBtn.addEventListener('click', () => {
    const spec = Core.parseDFDText(dfdDslInput.value);
    if (spec.parseErrors.length > 0) {
      showToast(spec.parseErrors[0], 3500);
      return;
    }
    if (spec.flows.length === 0) {
      showToast('Προσθέστε τουλάχιστον μία ροή δεδομένων στο ΔΡΔ.');
      return;
    }
    const generatedCode = Core.compileDFDToPLI11(spec);
    stopAutoTrace();
    resetTraceState();
    editor.setValue(generatedCode);
    runCompile({ fit: true });
    switchTab('tab-ddp');
    showToast('Ο ψευδοκώδικας και το ΔΔΠ παράχθηκαν επιτυχώς!');
  });

  if (dfdEditInBuilderBtn) {
    dfdEditInBuilderBtn.addEventListener('click', () => {
      const activeDFD = getActiveDFD();
      if (activeDFD) {
        const dsl = Core.serializeDFDToDSL(activeDFD);
        loadDSLIntoBuilder(dsl);
      }
      switchTab('tab-builder');
      showToast('Το ΔΡΔ φορτώθηκε στον Builder για παραμετροποίηση!');
    });
  }

  if (dfdLoadFromCompilerBtn) {
    dfdLoadFromCompilerBtn.addEventListener('click', () => {
      const activeDFD = getActiveDFD();
      if (activeDFD) {
        const dsl = Core.serializeDFDToDSL(activeDFD);
        loadDSLIntoBuilder(dsl);
        showToast('Το ΔΡΔ φορτώθηκε από τον κώδικα!');
      } else {
        showToast('Δεν υπάρχει μεταγλωττισμένο ΔΡΔ για φόρτωση.');
      }
    });
  }

  if (dfdPreviewBuilderBtn) {
    dfdPreviewBuilderBtn.addEventListener('click', () => {
      const spec = Core.parseDFDText(dfdDslInput.value);
      if (spec.parseErrors.length > 0) {
        showToast(spec.parseErrors[0], 3500);
        return;
      }
      if (spec.flows.length === 0) {
        showToast('Προσθέστε τουλάχιστον μία ροή δεδομένων στο ΔΡΔ.');
        return;
      }
      const customDFD = Core.dfdSpecToDFD(spec);
      if (!currentCompiled) currentCompiled = {};
      if (customDFD.level === 0) {
        currentCompiled.dfdLevel0 = customDFD;
        dfdActiveLevel = 0;
      } else {
        currentCompiled.dfd = customDFD;
        dfdActiveLevel = 1;
      }
      dfdShowKMFrame = customDFD.showKMFrame !== false && !customDFD.noKM;
      if (dfdActiveLevel === 0) customDFDPositionsLevel0 = {};
      else customDFDPositionsLevel1 = {};
      updateDFDToolbarButtons();
      switchTab('tab-dfd');
      renderDFDView(true);
      showToast('Προεπισκόπηση προσαρμοσμένου ΔΡΔ (έτοιμο για εξαγωγή)!');
    });
  }

  if (PLI11_DFD_PRESETS && PLI11_DFD_PRESETS.GE1_2025_26) {
    loadDSLIntoBuilder(PLI11_DFD_PRESETS.GE1_2025_26.dsl);
  }

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

  let currentLayout = SettingsManager.get('pli11Layout', 'split');
  let currentPaneFocus = 'both';

  function refreshAllViewports() {
    requestAnimationFrame(() => {
      editor.refresh();
      ddpPanZoom.fit(false);
      dfdPanZoom.fit(false);
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
    SettingsManager.set('pli11Layout', mode);

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
        paneRight.style.height = clampPercent(SettingsManager.get('pli11PaneBottomPct', '54%'), 54, 22, 82);
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
        paneLeft.style.width = clampPercent(SettingsManager.get('pli11SplitWidth', '44%'), 44, 18, 80);
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
          SettingsManager.set('pli11PaneBottomPct', paneRight.style.height);
        } else if (paneLeft) {
          SettingsManager.set('pli11SplitWidth', paneLeft.style.width);
        }
        refreshAllViewports();
      },
      // Double-click to reset split/stack
      onDblClick: () => {
        const isStacked = container && container.classList.contains('layout-stacked');
        if (isStacked && paneRight) {
          paneRight.style.height = '52%';
          SettingsManager.set('pli11PaneBottomPct', '52%');
        } else if (paneLeft) {
          paneLeft.style.width = '45%';
          SettingsManager.set('pli11SplitWidth', '45%');
        }
        refreshAllViewports();
        showToast('Επαναφορά μεγέθους διαχωριστικού');
      }
    });
  }

  // Initial layout application
  applyLayout(currentLayout);

  // ---------------------------------------------------------------------------
  // QUICK CODE SNIPPETS (DDP & DRD)
  // ---------------------------------------------------------------------------
  const snippetChips = document.querySelectorAll('.snippet-chip');
  snippetChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-snippet');
      insertDdpSnippet(type);
    });
  });

  function insertDdpSnippet(type) {
    const doc = editor.getDoc();
    const cursor = doc.getCursor();
    let snippet = '';

    switch (type) {
      case 'main':
        snippet = `\nPROCEDURE EXEC_ROOT\n  LOCAL VAR A, B;\n  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B;\n  CALL GET_A(A);\n  CALL CALC_M1(A, B);\n  CALL PUT_B(B);\nEND_PROCEDURE;\n`;
        break;
      case 'control':
        snippet = `\nPROCEDURE EXEC_SUB(A: IN, B: IN/OUT)\n  LOCAL VAR T;\n  ΑΡΧΙΚΟΠΟΙΗΣΕ T;\n  CALL CALC_STEP1(A, T);\n  CALL CALC_STEP2(T, B);\nEND_PROCEDURE;\n`;
        break;
      case 'calc':
        snippet = `\nPROCEDURE CALC_M1(A: IN, B: IN/OUT)\n  Υπολόγισε το B βάσει του A;\nEND_PROCEDURE;\n`;
        break;
      case 'io-in':
        snippet = `\nPROCEDURE GET_A(A: IN/OUT)\n  Διάβασε το A από την Πηγή 1;\nEND_PROCEDURE;\n`;
        break;
      case 'io-out':
        snippet = `\nPROCEDURE PUT_B(B: IN)\n  Εμφάνισε το B στον Αποδέκτη 1;\nEND_PROCEDURE;\n`;
        break;
    }

    if (snippet) {
      doc.replaceRange(snippet, cursor);
      editor.focus();
      if (liveCompileToggle && liveCompileToggle.checked) {
        runCompile({ fit: false });
      }
      showToast('Εισήχθη πρότυπο διαδικασίας ΠΛΗ11!');
    }
  }

  // ---------------------------------------------------------------------------
  // SMART CONTEXT-AWARE HELP MODAL (ΠΛΗ11)
  // ---------------------------------------------------------------------------
  const SYNTAX_HELP_BODY = `
    <div class="help-context-banner" id="pli11-help-banner">
      <span>💡 Εστίαση βάσει κέρσορα:</span>
      <span class="help-context-tag" id="pli11-help-tag">Βασική Δομή &amp; Μονάδες</span>
    </div>

    <div class="help-tabs" id="pli11-help-tabs">
      <button type="button" class="help-tab-btn active" data-target="help-tab-structure">📑 1. Δομή &amp; Μονάδες</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-flows">🔄 2. Ροές &amp; Παράμετροι</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-km-kd">🎯 3. ΚΜ &amp; ΚΔ (CASE)</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-directives">⚡ 4. Directives (@KM)</button>
      <button type="button" class="help-tab-btn" data-target="help-tab-rules">⚠️ 5. Κανόνες ΕΑΠ (E01-E11)</button>
    </div>

    <!-- TAB 1: Βασική Δομή & Υπομονάδες -->
    <div class="help-tab-pane active" id="help-tab-structure">
      <p style="margin-top:0;">Κάθε πρόγραμμα ΠΛΗ11 οργανώνεται σε διαδικασίες (<code>PROCEDURE ... END_PROCEDURE;</code>) με 1-προς-1 αντιστοιχία προς τα ορθογώνια του ΔΔΠ και τους κύκλους του ΔΡΔ.</p>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Κύρια Μονάδα / Ρίζα (Exec_*)</span>
          <button type="button" class="help-insert-btn" data-snippet="PROCEDURE EXEC_ROOT
  LOCAL VAR A, B, C;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B, C;
  CALL GET_A(A);
  CALL CALC_M1(A, B);
  CALL PUT_B(B);
END_PROCEDURE;">+ Εισαγωγή</button>
        </div>
        <pre><code>PROCEDURE EXEC_ROOT
  LOCAL VAR A, B, C;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B, C;
  CALL GET_A(A);
  CALL CALC_M1(A, B);
  CALL PUT_B(B);
END_PROCEDURE;</code></pre>
      </div>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Υπομονάδα Υπολογισμού (Calc_*)</span>
          <button type="button" class="help-insert-btn" data-snippet="PROCEDURE CALC_M1(A: IN, B: IN/OUT)
  Υπολόγισε το B βάσει του A;
END_PROCEDURE;">+ Εισαγωγή</button>
        </div>
        <pre><code>PROCEDURE CALC_M1(A: IN, B: IN/OUT)
  Υπολόγισε το B βάσει του A;
END_PROCEDURE;</code></pre>
      </div>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Υπομονάδα Εισόδου (Get_*) &amp; Εξόδου (Put_*)</span>
          <button type="button" class="help-insert-btn" data-snippet="PROCEDURE GET_A(A: IN/OUT)
  Διάβασε το A από την Πηγή 1;
END_PROCEDURE;

PROCEDURE PUT_B(B: IN)
  Εμφάνισε το B στον Αποδέκτη 1;
END_PROCEDURE;">+ Εισαγωγή</button>
        </div>
        <pre><code>PROCEDURE GET_A(A: IN/OUT)
  Διάβασε το A από την Πηγή 1;
END_PROCEDURE;

PROCEDURE PUT_B(B: IN)
  Εμφάνισε το B στον Αποδέκτη 1;
END_PROCEDURE;</code></pre>
      </div>
    </div>

    <!-- TAB 2: Ροές Δεδομένων & Παράμετροι -->
    <div class="help-tab-pane" id="help-tab-flows">
      <p style="margin-top:0;"><strong>Κατεύθυνση Παραμέτρων:</strong></p>
      <ul>
        <li><code>: IN</code> &rarr; Δεδομένα εισόδου (βέλος από καλούντα προς καλούμενο στο ΔΔΠ).</li>
        <li><code>: IN/OUT</code> &rarr; Δεδομένα εξόδου ή τροποποίησης (βέλος από καλούμενο προς καλούντα).</li>
        <li><strong>Κανόνας ΕΑΠ:</strong> Παράμετροι που δηλώνονται στην επικεφαλίδα <code>(...)</code> <strong>ΔΕΝ</strong> ξαναδηλώνονται στο <code>LOCAL VAR</code> και <strong>ΔΕΝ</strong> αρχικοποιούνται με <code>ΑΡΧΙΚΟΠΟΙΗΣΕ</code>.</li>
      </ul>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Ροή με Αποθήκη Δεδομένων (Data Store)</span>
          <button type="button" class="help-insert-btn" data-snippet="PROCEDURE GET_RECORD(R: IN/OUT)
  Διάβασε το R από την Αποθήκη Αρχείο_Πελατών;
END_PROCEDURE;">+ Εισαγωγή</button>
        </div>
        <pre><code>PROCEDURE GET_RECORD(R: IN/OUT)
  Διάβασε το R από την Αποθήκη Αρχείο_Πελατών;
END_PROCEDURE;</code></pre>
      </div>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Σημαία Ελέγχου (Control Flag) στο ΔΔΠ</span>
          <button type="button" class="help-insert-btn" data-snippet="PROCEDURE CALC_CHECK(A: IN, status: IN/OUT)
  LOCAL VAR temp;
  ΑΡΧΙΚΟΠΟΙΗΣΕ temp;
  Αν A > 0 τότε status = true αλλιώς status = false;
END_PROCEDURE;">+ Εισαγωγή</button>
        </div>
        <pre><code>PROCEDURE CALC_CHECK(A: IN, status: IN/OUT)
  /* Μεταβλητή τύπου flag / status σχεδιάζεται με μαύρο κύκλο (●) στο ΔΔΠ */
  Αν A > 0 τότε status = true αλλιώς status = false;
END_PROCEDURE;</code></pre>
      </div>
    </div>

    <!-- TAB 3: ΚΜ & ΚΔ (CASE) -->
    <div class="help-tab-pane" id="help-tab-km-kd">
      <p style="margin-top:0;"><strong>Κεντρικός Μετασχηματισμός (ΚΜ) vs Κέντρο Δοσοληψιών (ΚΔ):</strong></p>
      <ul>
        <li><strong>Κεντρικός Μετασχηματισμός (ΚΜ):</strong> Οι υπολογιστικές μονάδες (π.χ. <code>Calc_M3</code>, <code>Calc_M4</code>) που πραγματοποιούν τον ουσιαστικό μετασχηματισμό των εισερχόμενων δεδομένων σε εξερχόμενα. Περιβάλλονται από διακεκομμένο πλαίσιο στο ΔΡΔ.</li>
        <li><strong>Κέντρο Δοσοληψιών (ΚΔ):</strong> Μονάδα που λαμβάνει δοσοληψία (τύπο ενέργειας / flag) και δρομολογεί την εκτέλεση μέσω <code>CASE ... OF</code>.</li>
      </ul>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Πρότυπο Κέντρου Δοσοληψιών (CASE flag OF)</span>
          <button type="button" class="help-insert-btn" data-snippet="PROCEDURE EXEC_TRANSACTION
  LOCAL VAR εντολή, δεδομένα, flag, αποτέλεσμα;
  ΑΡΧΙΚΟΠΟΙΗΣΕ εντολή, δεδομένα, flag, αποτέλεσμα;
  CALL GET_TRANSACTION(εντολή, δεδομένα);
  CALL CALC_IDENTIFY(εντολή, flag);
  CASE flag OF
    (ΤΥΠΟΣ_Α): CALL EXEC_ACTION_A(δεδομένα, αποτέλεσμα);
    (ΤΥΠΟΣ_Β): CALL EXEC_ACTION_B(δεδομένα, αποτέλεσμα);
    (ΤΥΠΟΣ_Γ): CALL EXEC_ACTION_C(δεδομένα, αποτέλεσμα);
  END_CASE;
  CALL PUT_RESULT(αποτέλεσμα);
END_PROCEDURE;">+ Εισαγωγή</button>
        </div>
        <pre><code>PROCEDURE EXEC_TRANSACTION
  LOCAL VAR εντολή, δεδομένα, flag, αποτέλεσμα;
  ΑΡΧΙΚΟΠΟΙΗΣΕ εντολή, δεδομένα, flag, αποτέλεσμα;
  CALL GET_TRANSACTION(εντολή, δεδομένα);
  CALL CALC_IDENTIFY(εντολή, flag);
  CASE flag OF
    (ΤΥΠΟΣ_Α): CALL EXEC_ACTION_A(δεδομένα, αποτέλεσμα);
    (ΤΥΠΟΣ_Β): CALL EXEC_ACTION_B(δεδομένα, αποτέλεσμα);
    (ΤΥΠΟΣ_Γ): CALL EXEC_ACTION_C(δεδομένα, αποτέλεσμα);
  END_CASE;
  CALL PUT_RESULT(αποτέλεσμα);
END_PROCEDURE;</code></pre>
      </div>
    </div>

    <!-- TAB 4: In-Code Directives -->
    <div class="help-tab-pane" id="help-tab-directives">
      <p style="margin-top:0;">Μπορείτε να ρυθμίσετε τη συμπεριφορά του compiler και του ΔΡΔ renderer μέσω ειδικών σχολίων στην αρχή του ψευδοκώδικα:</p>

      <div class="help-snippet-container">
        <div class="help-snippet-header">
          <span class="help-snippet-title">Μπλοκ Directives ΕΑΠ</span>
          <button type="button" class="help-insert-btn" data-snippet="/* @KM: M3, M4 */
/* @MODE: KM */
/* @MERGE_SOURCES: false */
/* @MERGE_SINKS: false */">+ Εισαγωγή</button>
        </div>
        <pre><code>/* @KM: M3, M4 */          -> Ορίζει ρητά τις μονάδες του Κεντρικού Μετασχηματισμού
/* @KM: NONE */            -> Απενεργοποιεί το περίγραμμα ΚΜ (απλό ΔΡΔ)
/* @LEVEL: 0 */            -> Παράγει αυτόματα το Διάγραμμα Πλαισίου (Context Diagram)
/* @LEVEL: 1 */            -> Παράγει το αναλυτικό ΔΡΔ Επιπέδου 1 (Προεπιλογή)
/* @MODE: KM */            -> Επιλέγει λειτουργία ΚΜ (ή @MODE: TC για Κέντρο Δοσοληψιών)
/* @MERGE_SOURCES: false */ -> Διατηρεί ξεχωριστές τις πηγές εισόδου στο ΔΡΔ
/* @MERGE_SINKS: false */   -> Διατηρεί ξεχωριστούς τους αποδέκτες εξόδου στο ΔΡΔ
/* @HIDE_FLOW: flag */     -> Αποκρύπτει δευτερεύουσα ροή δεδομένων από το ΔΡΔ</code></pre>
      </div>
    </div>

    <!-- TAB 5: Κανόνες ΕΑΠ (E01-E11) -->
    <div class="help-tab-pane" id="help-tab-rules">
      <p style="margin-top:0;">Οι 11 επίσημοι κανόνες ελέγχου ορθότητας του ΕΑΠ (ΟΕ1 / ΓΕ1):</p>
      <ol style="padding-left:18px; margin-bottom:0; font-size:0.88rem; line-height:1.55;">
        <li><strong>E01:</strong> 1-προς-1 αντιστοιχία ΔΔΠ &harr; PROCEDURE (κάθε ορθογώνιο είναι ξεχωριστή διαδικασία).</li>
        <li><strong>E02:</strong> Απαγόρευση επαναδήλωσης παραμέτρων στο <code>LOCAL VAR</code>.</li>
        <li><strong>E03:</strong> Υποχρεωτική αρχικοποίηση (<code>ΑΡΧΙΚΟΠΟΙΗΣΕ</code>) όλων των τοπικών μεταβλητών στις <code>Exec_*</code>.</li>
        <li><strong>E04:</strong> Απαγόρευση αρχικοποίησης παραμέτρων εισόδου/εξόδου.</li>
        <li><strong>E05:</strong> Ιεραρχία Top-Down (η ρίζα δεν έχει παραμέτρους επικεφαλίδας).</li>
        <li><strong>E06:</strong> Ακυκλική ιεραρχία (καμία υπομονάδα δεν καλεί τον γονέα της).</li>
        <li><strong>E07:</strong> Σωστή κατεύθυνση παραμέτρων (<code>Get_*</code> με <code>IN/OUT</code>, <code>Put_*</code> με <code>IN</code>).</li>
        <li><strong>E08:</strong> Ταύτιση πλήθους &amp; σειράς παραμέτρων στους ορισμούς και στις κλήσεις <code>CALL</code>.</li>
        <li><strong>E09:</strong> Σειρά ροής δεδομένων: πρώτα είσοδοι <code>Get_*</code>, μετά υπολογισμοί <code>Calc_*</code>, τέλος έξοδοι <code>Put_*</code>.</li>
        <li><strong>E10:</strong> Καθαρά ονόματα υπομονάδων κατά σύμβαση ΕΑΠ (<code>Exec_*</code>, <code>Calc_*</code>, <code>Get_*</code>, <code>Put_*</code>).</li>
        <li><strong>E11:</strong> Συνέπεια ΔΡΔ: κάθε διαδικασία χωρίς κλήσεις αντιστοιχεί σε Μετασχηματισμό στο ΔΡΔ.</li>
      </ol>
    </div>
  `;

  const syntaxModal = Common.createModal({
    id: 'pli11-syntax-modal',
    title: 'Οδηγός Ψευδοκώδικα & Κανόνων ΕΑΠ (ΠΛΗ11)',
    bodyHTML: SYNTAX_HELP_BODY
  });

  function detectActiveContext() {
    const cur = editor.getCursor();
    const line = editor.getLine(cur.line) || '';
    const full = editor.getValue();

    if (/(@KM|@MODE|@ALIAS|@MERGE|@HIDE)/i.test(line) || /(@KM|@MODE|@ALIAS)/i.test(full.slice(0, 300))) {
      return { tab: 'help-tab-directives', label: 'In-Code Directives (@KM)' };
    }
    if (/(CASE|END_CASE|\bflag\b|δοσοληψ)/i.test(line)) {
      return { tab: 'help-tab-km-kd', label: 'ΚΜ & Κέντρο Δοσοληψιών (CASE)' };
    }
    if (/(GET_|PUT_|:\s*IN|:\s*IN\/OUT|Διάβασε|Εμφάνισε|Γράψε|Πηγή|Αποθήκη)/i.test(line)) {
      return { tab: 'help-tab-flows', label: 'Ροές Δεδομένων & Παράμετροι (IN, IN/OUT)' };
    }
    if (currentCompiled && currentCompiled.validation && currentCompiled.validation.diagnostics.some((d) => d.severity === 'error' && d.line === cur.line + 1)) {
      return { tab: 'help-tab-rules', label: 'Κανόνες ΕΑΠ (E01–E11) & Σφάλματα' };
    }
    return { tab: 'help-tab-structure', label: 'Βασική Δομή & Μονάδες (PROCEDURE)' };
  }

  function switchHelpTab(tabTarget) {
    if (!syntaxModal || !syntaxModal.body) return;
    syntaxModal.body.querySelectorAll('.help-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-target') === tabTarget);
    });
    syntaxModal.body.querySelectorAll('.help-tab-pane').forEach((p) => {
      p.classList.toggle('active', p.id === tabTarget);
    });
  }

  if (syntaxModal && syntaxModal.body) {
    // Bind Tab switching
    syntaxModal.body.querySelectorAll('.help-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchHelpTab(btn.getAttribute('data-target')));
    });

    // Bind Snippet insertion into CodeMirror
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
          showToast('Το πρότυπο εισήχθη στον ψευδοκώδικα!');
        }
      });
    });
  }

  syntaxHelpButton.addEventListener('click', () => {
    const ctx = detectActiveContext();
    const tag = syntaxModal.body ? syntaxModal.body.querySelector('#pli11-help-tag') : null;
    if (tag) tag.textContent = ctx.label;
    switchHelpTab(ctx.tab);
    syntaxModal.open();
  });

  // Initial Compile on Boot (+ async #z= deflate permalink support)
  runCompile({ fit: true });
  if (typeof Common.loadCodeFromHashAsync === 'function') {
    Common.loadCodeFromHashAsync((shared) => {
      const dec = Common.decodeSharePayload ? Common.decodeSharePayload(shared) : { code: shared, layout: null };
      if (dec.layout) {
        customDDPPositions = dec.layout.ddp || {};
        customDFDPositionsLevel1 = dec.layout.dfd1 || {};
        customDFDPositionsLevel0 = dec.layout.dfd0 || {};
      }
      editor.setValue(dec.code);
      runCompile({ fit: true });
    });
  }
});
