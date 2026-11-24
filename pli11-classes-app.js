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
  const clsPrintBtn = document.getElementById('cls-print-btn');
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
  const mermaidRerenderBtn = document.getElementById('mermaid-rerender-btn');
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

  const sharedCode = Common.loadCodeFromHash();
  if (sharedCode) initialCode = sharedCode;

  const isDarkInitial = Common.getTheme() === 'dark';

  const editor = CodeMirror(editorMount, {
    value: initialCode,
    mode: 'eap-pli11-classes',
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

  Common.wireThemeToggle({
    onChange: () => {
      if (editor) editor.setOption('theme', Common.getTheme() === 'dark' ? 'dracula' : 'default');
      if (currentCompiled) {
        renderDiagramView(false);
        renderMermaidPreview();
      }
    }
  });

  // ---------------------------------------------------------------------------
  // TABS LOGIC
  // ---------------------------------------------------------------------------
  const tabs = Common.wireTabs((tabId) => {
    if (copyPseudocodeBtn) copyPseudocodeBtn.hidden = tabId !== 'tab-pseudocode';
    if (copyMermaidBtn) copyMermaidBtn.hidden = tabId !== 'tab-mermaid';

    if (tabId === 'tab-diagram') panZoom.fit(false);
    if (tabId === 'tab-builder' && builderDirty) {
      loadCompiledIntoBuilder();
    }
    if (tabId === 'tab-mermaid') renderMermaidPreview();
  });

  function switchTab(tabId) {
    tabs.switchTo(tabId);
  }

  // ---------------------------------------------------------------------------
  // PAN & ZOOM + INTERACTIVE CLASS BOX DRAG-AND-DROP ENGINE
  // ---------------------------------------------------------------------------
  // Shared pan/zoom engine (mouse + touch + wheel) — exposes .state for box drag
  const panZoom = Viewport.createPanZoom(clsViewport, clsCanvas, clsZoomLabel, {
    minScale: 0.22,
    maxScale: 2.6,
    fitMin: 0.25,
    fitMax: 1.15
  });
  const boxDrag = { active: false, classId: null, startClientX: 0, startClientY: 0, startBoxX: 0, startBoxY: 0, rafPending: false };

  window.addEventListener('mousemove', (e) => {
    if (!boxDrag.active) return;
    const dx = (e.clientX - boxDrag.startClientX) / panZoom.state.scale;
    const dy = (e.clientY - boxDrag.startClientY) / panZoom.state.scale;
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
    if (boxDrag.active) boxDrag.active = false;
  });

  clsZoomOut.addEventListener('click', () => panZoom.zoomBy(0.85));
  clsZoomIn.addEventListener('click', () => panZoom.zoomBy(1.18));
  clsZoomFit.addEventListener('click', () => panZoom.fit());
  clsAutoLayout.addEventListener('click', () => {
    customPositions = {};
    selectedClassId = null;
    renderDiagramView(true);
    showToast('Η αυτόματη διάταξη επαναφέρθηκε.');
  });

  // ---------------------------------------------------------------------------
  // RENDERERS: DIAGRAM, STATS, VALIDATOR, PSEUDOCODE, MERMAID
  // ---------------------------------------------------------------------------
  function getRenderOptions() {
    return {
      theme: getCurrentTheme(),
      printMode: clsPrintMode,
      hideVisibilities: optHideVis.checked,
      hideMethods: optHideMethods.checked,
      hideTypes: optHideTypes.checked,
      positions: customPositions,
      selectedClassId
    };
  }

  function clearErrorLineMarks() {
    for (const h of errorLineHandles) {
      editor.removeLineClass(h, 'background', 'cm-pli11-error-line');
    }
    errorLineHandles = [];
  }

  function jumpToLine(lineNum) {
    if (!lineNum || lineNum < 1) return;
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
    for (const d of validation.diagnostics) {
      if (d.severity === 'error' && d.line > 0 && !marked.has(d.line)) {
        marked.add(d.line);
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
      div.innerHTML = `
        <div class="val-diag-head">
          <span class="val-diag-code">${escapeHTML(d.code)}</span>
          <span class="val-diag-loc">Γραμμή ${d.line}</span>
        </div>
        <div class="val-diag-msg">${escapeHTML(d.message)}</div>
        ${d.hint ? `<div class="val-diag-hint">Υπόδειξη: ${escapeHTML(d.hint)}</div>` : ''}
      `;
      div.addEventListener('click', () => jumpToLine(d.line));
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
            Ο κώδικας <code>classDiagram</code> παραπάνω είναι πλήρως επεξεργάσιμος και έτοιμος για αντιγραφή, ενώ το <strong>Διάγραμμα Κλάσεων SVG</strong> και ο <strong>ΕΑΠ Ψευδοκώδικας</strong> λειτουργούν 100% offline.
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
      const id = `pli11_cls_mmd_${mermaidRenderCounter}`;
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
    const svg = Renderer.renderClassDiagramSVG(currentCompiled.model, getRenderOptions());
    Renderer.downloadSVG(svg, 'pli11-class-diagram.svg');
    showToast('Έγινε λήψη SVG!');
  });

  clsExportPng.addEventListener('click', () => {
    const svg = Renderer.renderClassDiagramSVG(currentCompiled.model, getRenderOptions());
    Renderer.downloadPNG(svg, 'pli11-class-diagram.png', 2)
      .then(() => showToast('Έγινε λήψη HiDPI PNG για MS Word!'))
      .catch(() => showToast('Αποτυχία μετατροπής σε PNG.'));
  });

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

  // Autosave draft to localStorage — restores on next visit
  const autosave = Common.createAutosave({
    key: 'pli11ClassesDraftCode',
    getValue: () => editor.getValue(),
    setValue: (code) => { editor.setValue(code); },
    onRestore: () => showToast('Επαναφέρθηκε το πρόχειρο από την προηγούμενη συνεδρία!')
  });

  let liveDebounceTimer = null;
  editor.on('change', () => {
    if (suppressEditorSync) return;
    autosave.onChange();
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

  shareButton.addEventListener('click', () => {
    Common.shareCode(editor.getValue(), 'Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!');
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
    customPositions = {};
    selectedClassId = null;
    builderDirty = true;
    editor.setValue('');
    runCompile({ fit: true });
    editor.focus();
  });

  // ---------------------------------------------------------------------------
  // LAYOUT MANAGER & DUAL-AXIS RESIZER (Left/Right Split vs Up/Down Stacked)
  // ---------------------------------------------------------------------------
  const container = document.querySelector('.container');
  const paneLeft = document.getElementById('pane-left');
  const layoutToggle = document.getElementById('layout-toggle');

  let currentLayout = SettingsManager.get('pli11ClassesLayout', 'split');

  function applyLayout(mode, animate = false) {
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
        dragHandle.title = 'Σύρετε για αλλαγή ύψους • Διπλό κλικ για επαναφορά';
      }
      if (paneLeft) paneLeft.style.width = '';
      if (outputContainer) {
        const savedHeight = SettingsManager.get('pli11ClassesOutputHeight', '52vh');
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
      const savedWidth = SettingsManager.get('pli11ClassesSplitWidth', '46%');
      if (paneLeft) paneLeft.style.width = savedWidth;
    }

    setTimeout(() => {
      editor.refresh();
      panZoom.fit(false);
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
          SettingsManager.set('pli11ClassesOutputHeight', outputContainer.style.height);
        } else if (paneLeft) {
          SettingsManager.set('pli11ClassesSplitWidth', paneLeft.style.width);
        }
        editor.refresh();
        panZoom.fit(false);
      },
      // Double-click to reset split/stack
      onDblClick: () => {
        const isStacked = container && container.classList.contains('layout-stacked');
        if (isStacked && outputContainer) {
          outputContainer.style.height = '50vh';
          SettingsManager.set('pli11ClassesOutputHeight', '50vh');
        } else if (paneLeft) {
          paneLeft.style.width = '48%';
          SettingsManager.set('pli11ClassesSplitWidth', '48%');
        }
        editor.refresh();
        panZoom.fit(false);
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
      editor.setValue(shared);
      runCompile({ fit: true });
      loadCompiledIntoBuilder();
    });
  }
});
