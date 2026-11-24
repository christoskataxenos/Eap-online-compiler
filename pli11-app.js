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
  const ddpZoomLabel = document.getElementById('ddp-zoom-label');
  const ddpPrintBtn = document.getElementById('ddp-print-btn');
  const ddpExportSvg = document.getElementById('ddp-export-svg');
  const ddpExportPng = document.getElementById('ddp-export-png');

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
  const dfdZoomLabel = document.getElementById('dfd-zoom-label');
  const dfdPrintBtn = document.getElementById('dfd-print-btn');
  const dfdExportSvg = document.getElementById('dfd-export-svg');
  const dfdExportPng = document.getElementById('dfd-export-png');

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
        editor.setValue(PLI11_EXAMPLES[id]);
        runCompile();
        if (id === 'OE1_TRAPS_DEMO') {
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

  ddpZoomIn.addEventListener('click', () => ddpPanZoom.zoomIn());
  ddpZoomOut.addEventListener('click', () => ddpPanZoom.zoomOut());
  ddpZoomFit.addEventListener('click', () => ddpPanZoom.fit());

  dfdZoomIn.addEventListener('click', () => dfdPanZoom.zoomIn());
  dfdZoomOut.addEventListener('click', () => dfdPanZoom.zoomOut());
  dfdZoomFit.addEventListener('click', () => dfdPanZoom.fit());

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
    const svg = Renderer.renderDDPSVG(currentCompiled.model, {
      printMode: ddpPrintMode,
      theme: getCurrentTheme()
    });
    Renderer.downloadSVG(svg, 'eap-pli11-ddp.svg');
    showToast('Το ΔΔΠ εξήχθη ως SVG!');
  });

  ddpExportPng.addEventListener('click', () => {
    if (!currentCompiled) return;
    const svg = Renderer.renderDDPSVG(currentCompiled.model, {
      printMode: ddpPrintMode,
      theme: getCurrentTheme()
    });
    Renderer.downloadPNG(svg, 'eap-pli11-ddp.png', 2)
      .then(() => showToast('Το ΔΔΠ εξήχθη ως PNG (2x)!'))
      .catch(() => showToast('Σφάλμα εξαγωγής PNG.'));
  });

  dfdExportSvg.addEventListener('click', () => {
    if (!currentCompiled) return;
    const svg = Renderer.renderDFDSVG(currentCompiled.dfd, {
      printMode: dfdPrintMode,
      theme: getCurrentTheme()
    });
    Renderer.downloadSVG(svg, 'eap-pli11-drd.svg');
    showToast('Το ΔΡΔ εξήχθη ως SVG!');
  });

  dfdExportPng.addEventListener('click', () => {
    if (!currentCompiled) return;
    const svg = Renderer.renderDFDSVG(currentCompiled.dfd, {
      printMode: dfdPrintMode,
      theme: getCurrentTheme()
    });
    Renderer.downloadPNG(svg, 'eap-pli11-drd.png', 2)
      .then(() => showToast('Το ΔΡΔ εξήχθη ως PNG (2x)!'))
      .catch(() => showToast('Σφάλμα εξαγωγής PNG.'));
  });

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

    const svgStr = Renderer.renderDDPSVG(currentCompiled.model, {
      printMode: ddpPrintMode,
      theme: getCurrentTheme(),
      activeNodeId: activeStep ? activeStep.activeNodeId : null,
      activeEdgeId: activeStep ? activeStep.activeEdgeId : null
    });
    ddpCanvas.innerHTML = svgStr;

    // Click node to jump to line in editor
    ddpCanvas.querySelectorAll('.ddp-node').forEach((g) => {
      g.addEventListener('click', (e) => {
        if (ddpPanZoom.wasDragged()) return;
        const ln = parseInt(g.getAttribute('data-line'), 10);
        if (ln > 0) jumpToLine(ln);
      });
    });

    if (fitAfter) {
      requestAnimationFrame(() => ddpPanZoom.fit());
    }
  }

  function renderDFDView(fitAfter = false) {
    if (!currentCompiled) return;
    dfdInfoBar.hidden = !currentCompiled.dfd.hasGenericIO;
    dfdCanvas.innerHTML = Renderer.renderDFDSVG(currentCompiled.dfd, {
      printMode: dfdPrintMode,
      theme: getCurrentTheme()
    });
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
    return mermaidMode === 'ddp' ? currentCompiled.ddpMermaid : currentCompiled.dfdMermaid;
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
    const vb = clone.getAttribute('viewBox');
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        if (!clone.getAttribute('width') || clone.getAttribute('width').includes('%')) {
          clone.setAttribute('width', parts[2]);
        }
        if (!clone.getAttribute('height') || clone.getAttribute('height').includes('%')) {
          clone.setAttribute('height', parts[3]);
        }
      }
    }
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
        .catch(() => showToast('Αποτυχία μετατροπής Mermaid σε PNG.'));
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
    const modeTag = dfdModeSelect.value === 'KD' ? 'ΚΔ' : 'ΚΜ';
    const centralLine = `${modeTag}: ${dfdCentralInput.value.trim() || 'M1'}`;
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
    dfdModeSelect.value = spec.mode === 'KD' ? 'KD' : 'KM';
    dfdCentralInput.value = (spec.central || []).join(', ');
    builderFlows = spec.flows;
    renderBuilderTable();
  }

  dfdDslInput.addEventListener('input', () => {
    const spec = Core.parseDFDText(dfdDslInput.value);
    dfdModeSelect.value = spec.mode === 'KD' ? 'KD' : 'KM';
    if (spec.central.length > 0) dfdCentralInput.value = spec.central.join(', ');
    builderFlows = spec.flows;
    renderBuilderTable();
  });

  dfdModeSelect.addEventListener('change', syncBuilderTableToDSL);
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
      if (currentCompiled && currentCompiled.dfd) {
        const dsl = Core.serializeDFDToDSL(currentCompiled.dfd);
        loadDSLIntoBuilder(dsl);
      }
      switchTab('tab-builder');
      showToast('Το ΔΡΔ φορτώθηκε στον Builder για παραμετροποίηση!');
    });
  }

  if (dfdLoadFromCompilerBtn) {
    dfdLoadFromCompilerBtn.addEventListener('click', () => {
      if (currentCompiled && currentCompiled.dfd) {
        const dsl = Core.serializeDFDToDSL(currentCompiled.dfd);
        loadDSLIntoBuilder(dsl);
        showToast('Το ΔΡΔ φορτώθηκε από τον ψευδοκώδικα!');
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
      currentCompiled.dfd = customDFD;
      renderDFDView(true);
      switchTab('tab-dfd');
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
  // SYNTAX HELP MODAL (ΠΛΗ11)
  // ---------------------------------------------------------------------------
  const SYNTAX_HELP_BODY = `
      <h4>1. Δομή Διαδικασίας (PROCEDURE) &amp; Παράμετροι</h4>
      <ul>
        <li><strong>Ρίζα (Κεντρικός Μετασχηματισμός / ΚΔ):</strong> Χωρίς παραμέτρους επικεφαλίδας.<br><code>PROCEDURE EXEC_M3_M4_M5 ... END_PROCEDURE;</code></li>
        <li><strong>Παράμετροι Υπομονάδων:</strong> Χρήση <code>: IN</code> για είσοδο και <code>: IN/OUT</code> για έξοδο (ή παλαιότερα <code>: OUT</code>).<br><code>PROCEDURE CALC_M1(A: IN, Γ, Κ: IN/OUT)</code></li>
        <li><strong>Μονάδες Λήψης / Εξόδου:</strong><br>
          <code>PROCEDURE GET_Δ(Δ: IN/OUT)</code> &rarr; <code>Διάβασε το Δ από την Αποθήκη 3;</code><br>
          <code>PROCEDURE PUT_Π(Π: IN)</code> &rarr; <code>ΕΜΦΑΝΙΣΕ το Π στον Αποδέκτη 1;</code>
        </li>
      </ul>

      <h4>2. Οι 6 Χρυσοί Κανόνες Ελέγχου (ΟΕ1 &amp; ΓΕ1)</h4>
      <ol>
        <li><strong>1-προς-1 αντιστοιχία ΔΔΠ &harr; PROCEDURE:</strong> Κάθε μονάδα του ΔΔΠ αντιστοιχεί σε μία PROCEDURE.</li>
        <li><strong>Ποτέ επαναδήλωση παραμέτρου:</strong> Ό,τι δηλώνεται στην επικεφαλίδα <code>(...)</code> ΑΠΑΓΟΡΕΥΕΤΑΙ να ξαναδηλωθεί στο <code>LOCAL VAR</code> ή να αρχικοποιηθεί με <code>ΑΡΧΙΚΟΠΟΙΗΣΕ</code>.</li>
        <li><strong>Αρχικοποίηση όλων των LOCAL VAR:</strong> Σε κάθε μονάδα ελέγχου (<code>Exec_*</code>), όλες οι τοπικές μεταβλητές αρχικοποιούνται με <code>ΑΡΧΙΚΟΠΟΙΗΣΕ</code>, ακόμη κι αν γεμίζουν από κλήσεις <code>CALL</code>.</li>
        <li><strong>Ιεραρχία Top-Down:</strong> Η ρίζα δεν έχει παραμέτρους και καμία υπομονάδα δεν καλεί τον γονέα της.</li>
        <li><strong>Σωστή κατεύθυνση &amp; πλήθος παραμέτρων:</strong> Οι <code>Get_*</code> έχουν <code>IN/OUT</code>, οι <code>Put_*</code> έχουν <code>IN</code>, και τα <code>CALL</code> ταιριάζουν σε πλήθος και σειρά.</li>
        <li><strong>Σειρά εξάρτησης δεδομένων:</strong> Πρώτα <code>Get_*</code> / ανάντη <code>Exec_*</code>, μετά <code>Calc_*</code>, τέλος <code>Put_*</code> / κατάντη <code>Exec_*</code>.</li>
      </ol>

      <h4>3. Κέντρο Δοσοληψιών (CASE) &amp; Δομές Ελέγχου</h4>
      <pre><code>PROCEDURE EXEC_M3
  LOCAL VAR Γ, Θ, flag, Ε1, Ε2, Ε3;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Γ, Θ, flag, Ε1, Ε2, Ε3;
  CALL EXEC_M1(Γ);
  CALL EXEC_M2(Θ);
  CALL CALC_M3(Γ, Θ, flag);
  CASE flag OF
    (Ε1): CALL EXEC_M4(Ε1);
    (Ε2): CALL EXEC_M6(Ε2);
    (Ε3): CALL EXEC_M5(Ε3);
  END_CASE;
END_PROCEDURE;</code></pre>
      <p>Επιπλέον υποστηρίζονται <code>IF ... THEN ... [ELSE ...] END_IF</code>, <code>WHILE ... DO ... END_WHILE</code>, <code>REPEAT ... UNTIL ...</code> και <code>FOR ... FROM ... TO ... STEP ... DO ... END_FOR</code>.</p>
  `;

  const syntaxModal = Common.createModal({
    id: 'pli11-syntax-modal',
    title: 'Οδηγός Σύνταξης & Κανόνων ΕΑΠ (ΠΛΗ11)',
    bodyHTML: SYNTAX_HELP_BODY
  });
  syntaxHelpButton.addEventListener('click', () => syntaxModal.open());

  // Initial Compile on Boot
  runCompile({ fit: true });
});
