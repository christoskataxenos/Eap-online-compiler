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
  const mermaidRerenderBtn = document.getElementById('mermaid-rerender-btn');
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

  const sharedCode = Common.loadCodeFromHash();
  if (sharedCode) initialCode = sharedCode;

  const isDarkInitial = Common.getTheme() === 'dark';

  const editor = CodeMirror(editorMount, {
    value: initialCode,
    mode: 'eap-pli11',
    theme: isDarkInitial ? 'dracula' : 'default',
    lineNumbers: true,
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

  // ---------------------------------------------------------------------------
  // TABS LOGIC
  // ---------------------------------------------------------------------------
  const tabs = Common.wireTabs((tabId) => {
    if (copyMermaidBtn) copyMermaidBtn.hidden = tabId !== 'tab-mermaid';
    if (tabId === 'tab-ddp') ddpPanZoom.fit(false);
    if (tabId === 'tab-dfd') dfdPanZoom.fit(false);
    if (tabId === 'tab-mermaid') renderMermaidPreview();
  });

  function switchTab(tabId) {
    tabs.switchTo(tabId);
  }

  // ---------------------------------------------------------------------------
  // PAN & ZOOM (shared engine from diagram-viewport.js)
  // ---------------------------------------------------------------------------
  const ddpPanZoom = Viewport.createPanZoom(ddpViewport, ddpCanvas, ddpZoomLabel);
  const dfdPanZoom = Viewport.createPanZoom(dfdViewport, dfdCanvas, dfdZoomLabel);

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
    nodeId: null,
    startClientX: 0,
    startClientY: 0,
    startBoxX: 0,
    startBoxY: 0,
    rafPending: false
  };

  const dfdBoxDrag = {
    active: false,
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
      setTimeout(() => { ddpBoxDrag.moved = false; }, 0);
      ddpBoxDrag.active = false;
    }
    if (dfdBoxDrag.active) dfdBoxDrag.active = false;
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
      customDDPPositions = {};
      renderDDPView(true);
      showToast('Η αυτόματη διάταξη του ΔΔΠ επαναφέρθηκε.');
    });
  }

  dfdZoomIn.addEventListener('click', () => dfdPanZoom.zoomIn());
  dfdZoomOut.addEventListener('click', () => dfdPanZoom.zoomOut());
  dfdZoomFit.addEventListener('click', () => dfdPanZoom.fit());
  if (dfdAutoLayout) {
    dfdAutoLayout.addEventListener('click', () => {
      if (dfdActiveLevel === 0) {
        customDFDPositionsLevel0 = {};
      } else {
        customDFDPositionsLevel1 = {};
      }
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

  let ddpCanvasSetting = SettingsManager.get('pli11DdpCanvasSetting', 'auto');
  let ddpCustomCanvas = SettingsManager.get('pli11DdpCustomCanvas', { width: 1400, height: 900 });

  let dfdCanvasSetting = SettingsManager.get('pli11DfdCanvasSetting', 'auto');
  let dfdCustomCanvas = SettingsManager.get('pli11DfdCustomCanvas', { width: 1400, height: 900 });

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
        const input = prompt('Εισάγετε διαστάσεις καμβά ΔΔΠ (Πλάτος x Ύψος σε px, π.χ. 1600x900):', currentPrompt);
        if (input) {
          const parts = input.toLowerCase().replace(/[,x]/g, ' ').trim().split(/\s+/).map(Number);
          if (parts.length >= 2 && parts[0] >= 300 && parts[1] >= 200) {
            ddpCustomCanvas = { width: Math.round(parts[0]), height: Math.round(parts[1]) };
            SettingsManager.set('pli11DdpCustomCanvas', ddpCustomCanvas);
            ddpCanvasSetting = 'custom';
          } else {
            showToast('Μη έγκυρες διαστάσεις (π.χ. 1600x900).');
            ddpCanvasSizeSelect.value = ddpCanvasSetting;
            return;
          }
        } else {
          ddpCanvasSizeSelect.value = ddpCanvasSetting;
          return;
        }
      } else {
        ddpCanvasSetting = val;
      }
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
        const input = prompt('Εισάγετε διαστάσεις καμβά ΔΡΔ (Πλάτος x Ύψος σε px, π.χ. 1600x900):', currentPrompt);
        if (input) {
          const parts = input.toLowerCase().replace(/[,x]/g, ' ').trim().split(/\s+/).map(Number);
          if (parts.length >= 2 && parts[0] >= 300 && parts[1] >= 200) {
            dfdCustomCanvas = { width: Math.round(parts[0]), height: Math.round(parts[1]) };
            SettingsManager.set('pli11DfdCustomCanvas', dfdCustomCanvas);
            dfdCanvasSetting = 'custom';
          } else {
            showToast('Μη έγκυρες διαστάσεις (π.χ. 1600x900).');
            dfdCanvasSizeSelect.value = dfdCanvasSetting;
            return;
          }
        } else {
          dfdCanvasSizeSelect.value = dfdCanvasSetting;
          return;
        }
      } else {
        dfdCanvasSetting = val;
      }
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
        dfdBoxDrag.nodeId = nid;
        dfdBoxDrag.startClientX = e.clientX;
        dfdBoxDrag.startClientY = e.clientY;
        dfdBoxDrag.startBoxX = bx;
        dfdBoxDrag.startBoxY = by;
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
    for (const d of validation.diagnostics) {
      if (d.severity === 'error' && d.line > 0 && !markedLines.has(d.line)) {
        markedLines.add(d.line);
        const h = editor.addLineClass(Math.min(d.line - 1, editor.lineCount() - 1), 'background', 'cm-pli11-error-line');
        errorLineHandles.push(h);
      }
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
      div.innerHTML = `
        <div class="val-diag-head">
          <span class="val-diag-code">${escapeHTML(d.code)}</span>
          <span class="val-diag-loc">${d.procName ? escapeHTML(d.procName) + ' · ' : ''}Γραμμή ${d.line}</span>
        </div>
        <div class="val-diag-msg">${escapeHTML(d.message)}</div>
        ${d.hint ? `<div class="val-diag-hint">Υπόδειξη: ${escapeHTML(d.hint)}</div>` : ''}
      `;
      div.addEventListener('click', () => jumpToLine(d.line));
      valDiagnosticsList.appendChild(div);
    }
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

  function updateMermaidStatusBadge() {
    const badge = document.getElementById('mermaid-edit-status');
    if (!badge) return;
    if (mermaidIsUserEdited) {
      badge.textContent = 'Χειροκίνητο';
      badge.style.color = 'var(--token-string, #ffee00)';
      badge.title = 'Έχει τροποποιηθεί χειροκίνητα. Κάντε κλικ στο "Επαναφορά από Κώδικα" για επανασυγχρονισμό.';
    } else {
      badge.textContent = 'Αυτόματο';
      badge.style.color = '';
      badge.title = 'Συγχρονισμένο αυτόματα με τον κύριο ψευδοκώδικα.';
    }
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
      return;
    }

    try {
      const isDark = getCurrentTheme() === 'dark';
      window.mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose'
      });
      mermaidRenderCounter++;
      const id = `pli11_mmd_${mermaidRenderCounter}`;
      const { svg } = await window.mermaid.render(id, code);
      if (mermaidPreviewHost) mermaidPreviewHost.innerHTML = svg;
    } catch (err) {
      if (mermaidPreviewHost) {
        mermaidPreviewHost.innerHTML = `<div class="mermaid-offline-note" style="color:var(--term-error); border-color:var(--term-error);">
          <strong>Σφάλμα σύνταξης Mermaid:</strong><br>${escapeHTML(err.message || String(err))}
        </div>`;
      }
    }
  }

  if (mermaidCodeView) {
    mermaidCodeView.addEventListener('input', () => {
      mermaidIsUserEdited = true;
      updateMermaidStatusBadge();
      clearTimeout(mermaidDebounceTimer);
      mermaidDebounceTimer = setTimeout(() => {
        renderMermaidPreview();
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
        mermaidDebounceTimer = setTimeout(() => renderMermaidPreview(), 350);
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
      const textColor = (child && window.getComputedStyle(child).color) || '#ffffff';
      const fontF = (child && window.getComputedStyle(child).fontFamily) || 'sans-serif';
      const fontS = (child && window.getComputedStyle(child).fontSize) || '14px';
      const fontW = (child && window.getComputedStyle(child).fontWeight) || '600';

      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', (fx + fw / 2).toFixed(1));
      textEl.setAttribute('y', (fy + fh / 2).toFixed(1));
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'central');
      textEl.setAttribute('fill', textColor);
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

  // Autosave draft to localStorage — restores on next visit
  const autosave = Common.createAutosave({
    key: 'pli11DraftCode',
    getValue: () => editor.getValue(),
    setValue: (code) => { editor.setValue(code); },
    onRestore: () => showToast('Επαναφέρθηκε το πρόχειρο από την προηγούμενη συνεδρία!')
  });

  let liveDebounceTimer = null;
  editor.on('change', () => {
    autosave.onChange();
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

  shareButton.addEventListener('click', () => {
    Common.shareCode(editor.getValue(), 'Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!');
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
    stopAutoTrace();
    resetTraceState();
    customDFDPositionsLevel1 = {};
    customDFDPositionsLevel0 = {};
    editor.setValue('');
    runCompile({ fit: true });
    editor.focus();
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
  // LAYOUT MANAGER & DUAL-AXIS RESIZER (Left/Right Split vs Up/Down Stacked)
  // ---------------------------------------------------------------------------
  const container = document.querySelector('.container');
  const paneLeft = document.getElementById('pane-left');
  const layoutToggle = document.getElementById('layout-toggle');

  let currentLayout = SettingsManager.get('pli11Layout', 'split');

  function applyLayout(mode, animate = false) {
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
        dragHandle.title = 'Σύρετε για αλλαγή ύψους • Διπλό κλικ για επαναφορά';
      }
      if (paneLeft) paneLeft.style.width = '';
      if (outputContainer) {
        const savedHeight = SettingsManager.get('pli11OutputHeight', '52vh');
        outputContainer.style.height = savedHeight;
      }
    } else {
      container.classList.remove('layout-stacked');
      if (layoutToggle) {
        layoutToggle.innerHTML = '<span class="layout-icon">◫</span> <span class="layout-text">Side-by-Side</span>';
        layoutToggle.title = 'Εναλλαγή σε Up/Down (Stacked) διάταξη';
      }
      if (dragHandle) {
        dragHandle.classList.add('resizer-col');
        dragHandle.title = 'Σύρετε για αλλαγή πλάτους • Διπλό κλικ για επαναφορά (50/50)';
      }
      if (outputContainer) outputContainer.style.height = '';
      const savedWidth = SettingsManager.get('pli11SplitWidth', '46%');
      if (paneLeft) paneLeft.style.width = savedWidth;
    }

    setTimeout(() => {
      editor.refresh();
      if (typeof ddpPanZoom !== 'undefined') ddpPanZoom.fit(false);
      if (typeof dfdPanZoom !== 'undefined') dfdPanZoom.fit(false);
    }, 60);
  }

  if (layoutToggle) {
    layoutToggle.addEventListener('click', () => {
      const nextMode = currentLayout === 'split' ? 'stacked' : 'split';
      applyLayout(nextMode, true);
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
          const maxHeight = containerRect.height * 0.85;
          if (newHeight > 140 && newHeight < maxHeight && outputContainer) {
            outputContainer.style.height = newHeight + 'px';
            editor.refresh();
          }
        } else {
          const newWidth = e.clientX - containerRect.left;
          const minWidth = 280;
          const maxWidth = containerRect.width - 340;
          if (newWidth >= minWidth && newWidth <= maxWidth && paneLeft) {
            const pct = ((newWidth / containerRect.width) * 100).toFixed(1) + '%';
            paneLeft.style.width = pct;
            editor.refresh();
          }
        }
      },
      onEnd: () => {
        const isStacked = container && container.classList.contains('layout-stacked');
        if (isStacked && outputContainer) {
          SettingsManager.set('pli11OutputHeight', outputContainer.style.height);
        } else if (paneLeft) {
          SettingsManager.set('pli11SplitWidth', paneLeft.style.width);
        }
        editor.refresh();
        ddpPanZoom.fit(false);
        dfdPanZoom.fit(false);
      },
      // Double-click to reset split/stack
      onDblClick: () => {
        const isStacked = container && container.classList.contains('layout-stacked');
        if (isStacked && outputContainer) {
          outputContainer.style.height = '50vh';
          SettingsManager.set('pli11OutputHeight', '50vh');
        } else if (paneLeft) {
          paneLeft.style.width = '48%';
          SettingsManager.set('pli11SplitWidth', '48%');
        }
        editor.refresh();
        ddpPanZoom.fit(false);
        dfdPanZoom.fit(false);
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
        snippet = `\nΠΡΟΓΡΑΜΜΑ Κύριο\nΜΕΤΑΒΛΗΤΕΣ\n  ΑΚΕΡΑΙΕΣ: χ, ψ;\nΑΡΧΗ\n  ΚΑΛΕΣΕ Είσοδος(χ);\n  ΚΑΛΕΣΕ Υπολογισμός(χ, ψ);\n  ΚΑΛΕΣΕ Έξοδος(ψ);\nΤΕΛΟΣ_ΠΡΟΓΡΑΜΜΑΤΟΣ\n`;
        break;
      case 'control':
        snippet = `\nΔΙΑΔΙΚΑΣΙΑ ΔιαχείρισηΡοής(χ)\nΑΡΧΗ\n  ΚΑΛΕΣΕ Βοηθητική1(χ);\n  ΚΑΛΕΣΕ Βοηθητική2(χ);\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ\n`;
        break;
      case 'calc':
        snippet = `\nΔΙΑΔΙΚΑΣΙΑ Υπολογισμός(είσοδος, έξοδος)\nΑΡΧΗ\n  έξοδος <- είσοδος * 2;\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ\n`;
        break;
      case 'io-in':
        snippet = `\nΔΙΑΔΙΚΑΣΙΑ Είσοδος(τιμή)\nΑΡΧΗ\n  ΔΙΑΒΑΣΕ τιμή;\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ\n`;
        break;
      case 'io-out':
        snippet = `\nΔΙΑΔΙΚΑΣΙΑ Έξοδος(αποτέλεσμα)\nΑΡΧΗ\n  ΓΡΑΨΕ αποτέλεσμα;\nΤΕΛΟΣ_ΔΙΑΔΙΚΑΣΙΑΣ\n`;
        break;
    }

    if (snippet) {
      doc.replaceRange(snippet, cursor);
      editor.focus();
      if (liveCompileToggle && liveCompileToggle.checked) {
        runCompile({ fit: false });
      }
      showToast('Εισήχθη πρότυπο διαδικασίας!');
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
      editor.setValue(shared);
      runCompile({ fit: true });
    });
  }
});
