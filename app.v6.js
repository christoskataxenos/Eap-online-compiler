// -----------------------------------------------------------------------------
// EAP Online Pseudocode Interpreter & Debugger (ΠΛΗ10)
// Modern UI & Execution Controller (CodeMirror, Stepper, Memory & Trace Table)
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const Common = window.EAPCommon;
  const Viewport = window.EAPViewport;
  const escapeHTML = Common.escapeHTML;
  const showToast = (msg, dur) => Common.showToast(msg, dur);

  // DOM Elements - Editor & Toolbar
  const pli10Container = document.getElementById('pli10-container') || document.querySelector('.container');
  const pli10PaneLeft = document.getElementById('pli10-pane-left');
  const layoutToggleBtn = document.getElementById('layout-toggle');
  const wrapButton = document.getElementById('wrap-button');
  const editorMount = document.getElementById('code-editor-mount');
  const editorTitle = document.getElementById('editor-title');
  const exampleSelector = document.getElementById('example-selector');
  const formatButton = document.getElementById('format-button');
  const shareButton = document.getElementById('share-button');

  // DOM Elements - Primary Controls
  const runButton = document.getElementById('run-button');
  const stepBackButton = document.getElementById('step-back-button');
  const stepButton = document.getElementById('step-button');
  const continueButton = document.getElementById('continue-button');
  const stopButton = document.getElementById('stop-button');
  const speedSelect = document.getElementById('speed-select');

  // DOM Elements - Secondary Controls
  const loadButton = document.getElementById('load-button');
  const saveButton = document.getElementById('save-button');
  const clearButton = document.getElementById('clear-button');
  const syntaxHelpButton = document.getElementById('syntax-help-button');
  const dragHandle = document.getElementById('drag-handle');
  const outputContainer = document.querySelector('.output-container');

  // DOM Elements - Tabs & Content
  const varCountBadge = document.getElementById('var-count-badge');
  const traceStepBadge = document.getElementById('trace-step-badge');
  const toggleBatchInputBtn = document.getElementById('toggle-batch-input-btn');
  const batchCountPill = document.getElementById('batch-count-pill');
  const clearTerminalBtn = document.getElementById('clear-terminal-btn');
  const traceModeGroup = document.getElementById('trace-mode-group');
  const traceModeEapBtn = document.getElementById('trace-mode-eap-btn');
  const traceModeCompactBtn = document.getElementById('trace-mode-compact-btn');
  const copyTraceWordBtn = document.getElementById('copy-trace-word-btn');
  const copyTraceBtn = document.getElementById('copy-trace-btn');

  // DOM Elements - Terminal & Batch Input
  const batchInputDrawer = document.getElementById('batch-input-drawer');
  const batchInputEnabled = document.getElementById('batch-input-enabled');
  const batchInputBox = document.getElementById('batch-input-box');
  const batchRandomBtn = document.getElementById('batch-random-btn');
  const batchClearBtn = document.getElementById('batch-clear-btn');
  const terminalWindow = document.getElementById('terminal-window');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInputLine = document.getElementById('terminal-input-line');
  const terminalInput = document.getElementById('terminal-input');

  // DOM Elements - Memory & Variables Inspector
  const variablesEmpty = document.getElementById('variables-empty');
  const variablesContent = document.getElementById('variables-content');
  const sectionCallstack = document.getElementById('section-callstack');
  const callstackStrip = document.getElementById('callstack-strip');
  const primitivesGrid = document.getElementById('primitives-grid');
  const arraysContainer = document.getElementById('arrays-container');
  const sectionConstants = document.getElementById('section-constants');
  const constantsGrid = document.getElementById('constants-grid');
  const varViewToggle = document.getElementById('var-view-toggle');
  const varCardsBtn = document.getElementById('var-cards-btn');
  const varTableBtn = document.getElementById('var-table-btn');
  const varStatusText = document.getElementById('var-status-text');
  const varLastChangeBadge = document.getElementById('var-last-change-badge');
  const varSearchInput = document.getElementById('var-search-input');
  const variablesCardsView = document.getElementById('variables-cards-view');
  const variablesTableView = document.getElementById('variables-table-view');
  const variablesTableBody = document.getElementById('variables-table-body');

  // DOM Elements - Trace Table
  const traceFilterBar = document.getElementById('trace-filter-bar');
  const traceWatchInput = document.getElementById('trace-watch-input');
  const traceEmpty = document.getElementById('trace-empty');
  const traceTableContainer = document.getElementById('trace-table-container');
  const traceTableHead = document.getElementById('trace-table-head');
  const traceTableBody = document.getElementById('trace-table-body');

  // ---------------------------------------------------------------------------
  // SETTINGS (shared via EAPCommon)
  // ---------------------------------------------------------------------------
  const SettingsManager = Common.SettingsManager;

  // ---------------------------------------------------------------------------
  // INITIALIZE CODEMIRROR
  // ---------------------------------------------------------------------------
  let initialCode = EXAMPLES && EXAMPLES.HELLO ? EXAMPLES.HELLO : 'ΑΛΓΟΡΙΘΜΟΣ Hello\nΑΡΧΗ\n  ΤΥΠΩΣΕ("Καλημέρα Κόσμε")\nΤΕΛΟΣ';

  // Check URL hash for shared code permalink
  const sharedCode = Common.loadCodeFromHash();
  if (sharedCode) initialCode = sharedCode;

  const isDarkMode = Common.getTheme() === 'dark';
  let lineWrapEnabled = SettingsManager.get('pli10LineWrap', 'false') === 'true';

  const editor = CodeMirror(editorMount, {
    value: initialCode,
    mode: 'eap-pseudocode',
    theme: isDarkMode ? 'dracula' : 'default',
    lineNumbers: true,
    gutters: ['CodeMirror-linenumbers', 'cm-breakpoints'],
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    indentUnit: 2,
    tabSize: 2,
    lineWrapping: lineWrapEnabled,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'F5': () => runExecution(false),
      'F8': () => continueButton && !continueButton.disabled && continueButton.click(),
      'F10': () => stepExecution(),
      'Shift-F10': () => stepBackExecution(),
      'Ctrl-Shift-F': () => formatEditorCode(),
      'Cmd-Shift-F': () => formatEditorCode()
    }
  });

  // ---------------------------------------------------------------------------
  // BREAKPOINTS GUTTER (Click line number / gutter to toggle ●)
  // ---------------------------------------------------------------------------
  const breakpointLines = new Set(); // 1-based line numbers

  function makeBreakpointMarker() {
    const marker = document.createElement('div');
    marker.className = 'cm-breakpoint-dot';
    marker.title = 'Σημείο Διακοπής (Breakpoint) — κλικ για αφαίρεση';
    marker.textContent = '●';
    return marker;
  }

  function syncBreakpointsFromDoc() {
    breakpointLines.clear();
    const count = editor.lineCount();
    for (let i = 0; i < count; i++) {
      const info = editor.lineInfo(i);
      if (info && info.gutterMarkers && info.gutterMarkers['cm-breakpoints']) {
        breakpointLines.add(i + 1);
      }
    }
    if (currentInterpreter && typeof currentInterpreter.setBreakpoints === 'function') {
      currentInterpreter.setBreakpoints(breakpointLines);
    }
  }

  editor.on('gutterClick', (cm, lineIdx) => {
    const info = cm.lineInfo(lineIdx);
    const hasBp = Boolean(info.gutterMarkers && info.gutterMarkers['cm-breakpoints']);
    cm.setGutterMarker(lineIdx, 'cm-breakpoints', hasBp ? null : makeBreakpointMarker());
    syncBreakpointsFromDoc();
    showToast(hasBp
      ? `Αφαιρέθηκε το Breakpoint από τη γραμμή ${lineIdx + 1}`
      : `Προστέθηκε Breakpoint στη γραμμή ${lineIdx + 1} (πατήστε ΕΚΤΕΛΕΣΗ)`);
  });

  if (wrapButton) {
    wrapButton.classList.toggle('active', lineWrapEnabled);
    wrapButton.addEventListener('click', () => {
      lineWrapEnabled = !lineWrapEnabled;
      SettingsManager.set('pli10LineWrap', lineWrapEnabled ? 'true' : 'false');
      wrapButton.classList.toggle('active', lineWrapEnabled);
      editor.setOption('lineWrapping', lineWrapEnabled);
      editor.refresh();
      showToast(lineWrapEnabled ? 'Αναδίπλωση γραμμών: Ενεργή' : 'Αναδίπλωση γραμμών: Ανενεργή');
    });
  }

  // Quick Snippets Insertion (ΠΛΗ10)
  const PLI10_SNIPPETS = {
    algo: `ΑΛΓΟΡΙΘΜΟΣ ΌνομαΑλγορίθμου\nΔΕΔΟΜΕΝΑ\n  x, y : ΑΚΕΡΑΙΟΣ;\nΑΡΧΗ\n  ΤΥΠΩΣΕ("Δώσε το x: ");\n  ΔΙΑΒΑΣΕ(x);\n  y := x * 2;\n  ΤΥΠΩΣΕ("Αποτέλεσμα: ", y, EOLN);\nΤΕΛΟΣ\n`,
    if: `\n  ΕΑΝ (x > 0) ΤΟΤΕ\n    ΤΥΠΩΣΕ("Θετικός", EOLN);\n  ΑΛΛΙΩΣ\n    ΤΥΠΩΣΕ("Μη θετικός", EOLN);\n  ΕΑΝ-ΤΕΛΟΣ\n`,
    select: `\n  ΕΠΙΛΕΞΕ βαθμός\n    ΠΕΡΙΠΤΩΣΗ 9..10 :\n      ΤΥΠΩΣΕ("Άριστα", EOLN);\n    ΠΕΡΙΠΤΩΣΗ 7..8 :\n      ΤΥΠΩΣΕ("Λίαν Καλώς", EOLN);\n    ΠΕΡΙΠΤΩΣΗ 5..6 :\n      ΤΥΠΩΣΕ("Καλώς", EOLN);\n    ΠΕΡΙΠΤΩΣΗ ΑΛΛΙΩΣ :\n      ΤΥΠΩΣΕ("Αποτυχία", EOLN);\n  ΕΠΙΛΕΞΕ-ΤΕΛΟΣ\n`,
    for: `\n  ΓΙΑ i := 1 ΕΩΣ N ΕΠΑΝΑΛΑΒΕ\n    ΤΥΠΩΣΕ(i, EOLN);\n  ΓΙΑ-ΤΕΛΟΣ\n`,
    while: `\n  ΕΝΟΣΩ (i <= N) ΕΠΑΝΑΛΑΒΕ\n    i := i + 1;\n  ΕΝΟΣΩ-ΤΕΛΟΣ\n`,
    repeat: `\n  ΕΠΑΝΑΛΑΒΕ\n    ΤΥΠΩΣΕ("Δώσε θετικό αριθμό: ");\n    ΔΙΑΒΑΣΕ(x);\n  ΜΕΧΡΙ (x > 0)\n`,
    array1d: `  PIN : ARRAY[1..10] OF INTEGER;\n`,
    record: `ΤΥΠΟΙ\n  Φοιτητής = ΕΓΓΡΑΦΗ\n    όνομα : ΣΥΜΒΟΛΟΣΕΙΡΑ;\n    βαθμός : ΠΡΑΓΜΑΤΙΚΟΣ;\n  ΤΕΛΟΣ-ΕΓΓΡΑΦΗΣ;\n`,
    proc: `\nΔΙΑΔΙΚΑΣΙΑ swap(%a, %b)\nΔΙΕΠΑΦΗ\n  ΕΙΣΟΔΟΣ\n    a, b : INTEGER;\n  ΕΞΟΔΟΣ\n    a, b : INTEGER;\nΔΕΔΟΜΕΝΑ\n  temp : INTEGER;\nΑΡΧΗ\n  temp := a;\n  a := b;\n  b := temp;\nΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ\n`,
    func: `\nΣΥΝΑΡΤΗΣΗ τετράγωνο(x) : INTEGER\nΔΙΕΠΑΦΗ\n  ΕΙΣΟΔΟΣ\n    x : INTEGER;\n  ΕΞΟΔΟΣ\n    τετράγωνο : INTEGER;\nΑΡΧΗ\n  τετράγωνο := x * x;\nΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ\n`
  };

  document.querySelectorAll('.pli10-snippet-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-snippet');
      const text = PLI10_SNIPPETS[key];
      if (!text) return;
      const doc = editor.getDoc();
      if (key === 'algo' && !editor.getValue().trim()) {
        editor.setValue(text);
      } else {
        doc.replaceRange(text, doc.getCursor());
      }
      editor.focus();
      showToast('Εισήχθη πρότυπο Ψευδογλώσσας!');
    });
  });

  // Trigger autocomplete hints when typing identifiers or keywords
  editor.on('inputRead', (cm, change) => {
    if (change.text && change.text[0] && /[\u0370-\u03ffa-zA-Z_]/.test(change.text[0])) {
      if (!cm.state.completionActive) {
        CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
      }
    }
  });

  function updateProgramName() {
    const code = editor.getValue();
    const greekMatch = code.match(/ΑΛΓΟΡΙΘΜΟΣ\s+([A-Za-zΑ-Ωα-ω_][A-Za-zΑ-Ωα-ω0-9_]*)/i);
    const englishMatch = code.match(/ALGORITHM\s+([A-Za-zΑ-Ωα-ω_][A-Za-zΑ-Ωα-ω0-9_]*)/i);
    const match = greekMatch || englishMatch;

    if (match && match[1]) {
      editorTitle.textContent = `Κώδικας Ψευδογλώσσας: ${match[1]}`;
    } else {
      editorTitle.textContent = 'Κώδικας Ψευδογλώσσας';
    }
  }

  // Autosave draft & Multi-File Workspace Manager («Οι Εργασίες μου»)
  const autosave = Common.createAutosave({
    key: 'eapDraftCode',
    getValue: () => editor.getValue(),
    setValue: (code) => { editor.setValue(code); editor.clearHistory(); updateProgramName(); },
    onRestore: () => showToast('Επαναφέρθηκε το πρόχειρο από την προηγούμενη συνεδρία!')
  });

  const pli10WorkspaceMgr = Common.createWorkspaceManager
    ? Common.createWorkspaceManager({
        courseKey: 'pli10',
        defaultSlotTitle: 'Άσκηση 1 (ΠΛΗ10)',
        getCode: () => editor.getValue(),
        setCode: (code) => {
          if (typeof isExecuting !== 'undefined' && isExecuting && typeof stopExecution === 'function') {
            stopExecution();
          }
          editor.setValue(code);
          editor.clearHistory();
          updateProgramName();
        },
        getExtraState: () => ({
          batchInput: batchInputBox ? batchInputBox.value : ''
        }),
        setExtraState: (extra) => {
          if (batchInputBox && extra && typeof extra.batchInput === 'string') {
            batchInputBox.value = extra.batchInput;
            batchInputBox.dispatchEvent(new Event('input'));
          }
        }
      })
    : null;

  editor.on('change', () => {
    updateProgramName();
    autosave.onChange();
    if (pli10WorkspaceMgr) pli10WorkspaceMgr.onChange();
  });

  if (batchInputBox && pli10WorkspaceMgr) {
    batchInputBox.addEventListener('input', () => pli10WorkspaceMgr.onChange());
  }

  updateProgramName();

  // ---------------------------------------------------------------------------
  // POPULATE EXAMPLE SELECTOR
  // ---------------------------------------------------------------------------
  Common.populateExampleSelector(exampleSelector, EXAMPLE_CATEGORIES, 'Παραδείγματα (ΠΛΗ10)...', (key, label) => {
    if (EXAMPLES && EXAMPLES[key]) {
      if (isExecuting) stopExecution();
      editor.setValue(EXAMPLES[key]);
      editor.clearHistory();
      syncBreakpointsFromDoc();
      updateProgramName();
      clearTerminal();
      resetInspector();
      resetTraceTable();
      if (typeof EXAMPLE_INPUTS !== 'undefined' && EXAMPLE_INPUTS[key] && batchInputBox) {
        batchInputBox.value = EXAMPLE_INPUTS[key];
        updateBatchCountPill();
        if (batchInputDrawer) batchInputDrawer.hidden = false;
        if (toggleBatchInputBtn) toggleBatchInputBtn.classList.add('active');
        showToast(`Φορτώθηκε: ${label} (με έτοιμα δεδομένα εισόδου!)`);
      } else {
        if (batchInputBox) {
          batchInputBox.value = '';
          updateBatchCountPill();
        }
        showToast('Φορτώθηκε το παράδειγμα: ' + label);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // AUTO-FORMAT FUNCTION
  // ---------------------------------------------------------------------------
  function autoFormatCode(code) {
    const lines = code.split('\n');
    const formatted = [];
    let currentIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const trimmedUpper = trimmed.toUpperCase();

      if (trimmed === '') {
        formatted.push('');
        continue;
      }

      // Closing statements: decrease indent BEFORE adding line
      const isClosing =
        trimmedUpper.startsWith('ΤΕΛΟΣ') ||
        trimmedUpper.startsWith('ΕΑΝ-ΤΕΛΟΣ') ||
        trimmedUpper.startsWith('ΓΙΑ-ΤΕΛΟΣ') ||
        trimmedUpper.startsWith('ΕΝΟΣΩ-ΤΕΛΟΣ') ||
        trimmedUpper.startsWith('ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ') ||
        trimmedUpper.startsWith('ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ') ||
        trimmedUpper.startsWith('END') ||
        trimmedUpper.startsWith('ENDIF') ||
        trimmedUpper.startsWith('ENDFOR') ||
        trimmedUpper.startsWith('ENDWHILE') ||
        trimmedUpper.startsWith('END_IF') ||
        trimmedUpper.startsWith('END_FOR') ||
        trimmedUpper.startsWith('END_WHILE') ||
        trimmedUpper.startsWith('ENDPROCEDURE') ||
        trimmedUpper.startsWith('ENDFUNCTION') ||
        trimmedUpper.startsWith('END_PROCEDURE') ||
        trimmedUpper.startsWith('END_FUNCTION') ||
        trimmedUpper.startsWith('ΜΕΧΡΙ') ||
        trimmedUpper.startsWith('UNTIL');

      const isElse =
        trimmedUpper.startsWith('ΑΛΛΙΩΣ') ||
        trimmedUpper.startsWith('ELSE');

      if ((isClosing || isElse) && currentIndent > 0) {
        currentIndent--;
      }

      const indent = '  '.repeat(currentIndent);
      formatted.push(indent + trimmed);

      // Opening statements: increase indent AFTER adding line
      const shouldIncrease =
        trimmedUpper.endsWith('ΑΡΧΗ') ||
        trimmedUpper.endsWith('ΤΟΤΕ') ||
        trimmedUpper.endsWith('ΑΛΛΙΩΣ') ||
        trimmedUpper.endsWith('ΕΠΑΝΑΛΑΒΕ') ||
        trimmedUpper.endsWith('BEGIN') ||
        trimmedUpper.endsWith('THEN') ||
        trimmedUpper.endsWith('ELSE') ||
        trimmedUpper.endsWith('REPEAT');

      if (shouldIncrease) {
        currentIndent++;
      }
    }

    return formatted.join('\n');
  }

  function formatEditorCode() {
    const cursor = editor.getCursor();
    const formatted = autoFormatCode(editor.getValue());
    editor.setValue(formatted);
    editor.setCursor(cursor);
    showToast('Ο κώδικας μορφοποιήθηκε επιτυχώς!');
  }

  formatButton.addEventListener('click', formatEditorCode);

  // ---------------------------------------------------------------------------
  // SHARE / PERMALINK (LZ-STRING)
  // ---------------------------------------------------------------------------
  shareButton.addEventListener('click', () => {
    Common.shareCode(editor.getValue(), 'Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!');
  });

  // ---------------------------------------------------------------------------
  // THEME MANAGEMENT
  // ---------------------------------------------------------------------------
  Common.wireCourseSubmenu();
  Common.wireThemeToggle({
    onChange: (themeName) => {
      if (editor) editor.setOption('theme', themeName === 'dark' ? 'dracula' : 'default');
    }
  });

  // ---------------------------------------------------------------------------
  // TABS LOGIC
  // ---------------------------------------------------------------------------
  const tabs = Common.wireTabs((tabId) => {
    const isTrace = tabId === 'tab-trace';
    const isTerm = tabId === 'tab-terminal';
    const isVars = tabId === 'tab-variables';
    copyTraceBtn.hidden = !isTrace;
    if (copyTraceWordBtn) copyTraceWordBtn.hidden = !isTrace;
    if (traceModeGroup) traceModeGroup.hidden = !isTrace;
    clearTerminalBtn.hidden = !isTerm;
    if (toggleBatchInputBtn) toggleBatchInputBtn.hidden = !isTerm;
    if (varViewToggle) varViewToggle.hidden = !isVars;
  });

  function switchTab(tabId) {
    tabs.switchTo(tabId);
  }

  // Variable View Toggle (Cards vs Table)
  if (varCardsBtn && varTableBtn) {
    varCardsBtn.addEventListener('click', () => {
      varCardsBtn.classList.add('active');
      varTableBtn.classList.remove('active');
      if (variablesCardsView) variablesCardsView.hidden = false;
      if (variablesTableView) variablesTableView.hidden = true;
    });

    varTableBtn.addEventListener('click', () => {
      varTableBtn.classList.add('active');
      varCardsBtn.classList.remove('active');
      if (variablesCardsView) variablesCardsView.hidden = true;
      if (variablesTableView) variablesTableView.hidden = false;
    });
  }

  // Variable Filter / Search Input
  if (varSearchInput) {
    varSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toUpperCase();
      filterVariablesDisplay(q);
    });
  }

  const filterVariablesDisplay = Common.debounce((query) => {
    const q = query.toUpperCase();
    document.querySelectorAll('.memory-box-card, .array-box, #variables-table-body tr').forEach((node) => {
      const name = (node.getAttribute('data-var-name') || '').toUpperCase();
      node.hidden = Boolean(q) && !name.includes(q);
    });
  }, 120);

  clearTerminalBtn.addEventListener('click', () => {
    clearTerminal();
  });

  // ---------------------------------------------------------------------------
  // TERMINAL ENGINE
  // ---------------------------------------------------------------------------
  const printToTerminal = (text, type = 'output', isComplete = false) => {
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];

      if (i > 0) {
        const line = document.createElement('div');
        line.textContent = lineText;
        line.className = `term-${type}`;
        terminalOutput.appendChild(line);
      } else {
        const lastChild = terminalOutput.lastElementChild;
        if (lastChild && lastChild.className === `term-${type}` && !lastChild.dataset.complete) {
          lastChild.textContent += lineText;
        } else {
          const line = document.createElement('div');
          line.textContent = lineText;
          line.className = `term-${type}`;
          terminalOutput.appendChild(line);
        }
      }

      if (i === lines.length - 1 && (isComplete || text.endsWith('\n'))) {
        const lastChild = terminalOutput.lastElementChild;
        if (lastChild) lastChild.dataset.complete = 'true';
      }
    }

    scrollToBottom();
  };

  const scrollToBottom = () => {
    if (terminalWindow) {
      setTimeout(() => {
        terminalWindow.scrollTop = terminalWindow.scrollHeight;
      }, 0);
    }
  };

  const clearTerminal = () => {
    terminalOutput.innerHTML = '';
    terminalInputLine.hidden = true;
  };

  // ---------------------------------------------------------------------------
  // BATCH AUTO-INPUT QUEUE FOR ΔΙΑΒΑΣΕ
  // ---------------------------------------------------------------------------
  let activeBatchQueue = [];

  function parseBatchTokens(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return [];
    return text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  }

  function updateBatchCountPill() {
    if (!batchCountPill || !batchInputBox) return;
    const count = parseBatchTokens(batchInputBox.value).length;
    batchCountPill.hidden = count === 0;
    batchCountPill.textContent = String(count);
  }

  if (toggleBatchInputBtn && batchInputDrawer) {
    toggleBatchInputBtn.addEventListener('click', () => {
      batchInputDrawer.hidden = !batchInputDrawer.hidden;
      toggleBatchInputBtn.classList.toggle('active', !batchInputDrawer.hidden);
      if (!batchInputDrawer.hidden && batchInputBox) batchInputBox.focus();
    });
  }

  if (batchInputBox) {
    const savedBatch = SettingsManager.get('pli10BatchInput', '');
    if (savedBatch) {
      batchInputBox.value = savedBatch;
      updateBatchCountPill();
    }
    batchInputBox.addEventListener('input', () => {
      SettingsManager.set('pli10BatchInput', batchInputBox.value);
      updateBatchCountPill();
    });
  }

  if (batchRandomBtn && batchInputBox) {
    batchRandomBtn.addEventListener('click', () => {
      const nums = Array.from({ length: 10 }, () => Math.floor(Math.random() * 99) + 1);
      batchInputBox.value = nums.join(' ');
      SettingsManager.set('pli10BatchInput', batchInputBox.value);
      updateBatchCountPill();
      if (batchInputEnabled) batchInputEnabled.checked = true;
      showToast('Δημιουργήθηκαν 10 τυχαίες τιμές εισόδου!');
    });
  }

  if (batchClearBtn && batchInputBox) {
    batchClearBtn.addEventListener('click', () => {
      batchInputBox.value = '';
      SettingsManager.set('pli10BatchInput', '');
      updateBatchCountPill();
    });
  }

  const inputProvider = (targetLabel, expectedType) =>
    new Promise((resolve) => {
      // Consume from pre-configured Auto-Input queue first if enabled & non-empty
      if (batchInputEnabled && batchInputEnabled.checked && activeBatchQueue.length > 0) {
        const autoVal = activeBatchQueue.shift();
        printToTerminal(`${autoVal}  [auto → ${targetLabel || 'ΔΙΑΒΑΣΕ'}]\n`, 'input-echo', true);
        resolve(autoVal);
        return;
      }

      // Otherwise prompt interactively in Terminal
      switchTab('tab-terminal');
      terminalInputLine.hidden = false;
      terminalInput.placeholder = targetLabel
        ? `Δώστε τιμή για ${targetLabel} και πατήστε Enter...`
        : 'Δώστε είσοδο και πατήστε Enter...';
      scrollToBottom();
      terminalInput.value = '';
      terminalInput.focus();

      const handleEnter = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = terminalInput.value;
          terminalInputLine.hidden = true;
          terminalInput.removeEventListener('keydown', handleEnter);

          printToTerminal(val + '\n', 'input-echo', true);
          resolve(val);
        }
      };
      terminalInput.addEventListener('keydown', handleEnter);
    });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT ACTIVE & ERROR LINES
  // ---------------------------------------------------------------------------
  let activeDebugLineHandle = null;
  let activeErrorLineHandle = null;

  function clearDebugLineHighlight() {
    if (activeDebugLineHandle !== null) {
      editor.removeLineClass(activeDebugLineHandle, 'background', 'cm-debug-active-line');
      activeDebugLineHandle = null;
    }
  }

  function highlightDebugLine(line1Based) {
    clearDebugLineHighlight();
    const lineIndex = line1Based - 1;
    if (lineIndex >= 0 && lineIndex < editor.lineCount()) {
      activeDebugLineHandle = editor.addLineClass(lineIndex, 'background', 'cm-debug-active-line');
      editor.scrollIntoView({ line: lineIndex, ch: 0 }, 60);
    }
  }

  function clearErrorHighlight() {
    if (activeErrorLineHandle !== null) {
      editor.removeLineClass(activeErrorLineHandle, 'background', 'cm-error-line');
      activeErrorLineHandle = null;
    }
  }

  function highlightErrorLine(errorMsg) {
    clearErrorHighlight();
    const match = errorMsg.match(/Line[:\s]+(\d+)/i) || errorMsg.match(/γραμμή[:\s]+(\d+)/i);
    if (match) {
      const line1Based = parseInt(match[1], 10);
      const lineIndex = line1Based - 1;
      if (lineIndex >= 0 && lineIndex < editor.lineCount()) {
        activeErrorLineHandle = editor.addLineClass(lineIndex, 'background', 'cm-error-line');
        editor.scrollIntoView({ line: lineIndex, ch: 0 }, 60);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MEMORY & VARIABLES INSPECTOR
  // ---------------------------------------------------------------------------
  let previousVariableValues = {};

  const INDEX_POINTER_NAMES = new Set([
    'I', 'J', 'K', 'L', 'R', 'P', 'LEFT', 'RIGHT', 'START', 'FINISH',
    'MID', 'MIDDLE', 'POS', 'LOW', 'HIGH', 'PIVOT', 'INDEX', 'IDX',
    'ΘΕΣΗ', 'ΑΡΧΗ', 'ΤΕΛΟΣ', 'ΜΕΣΟ', 'ΔΕΙΚΤΗΣ'
  ]);

  function resetInspector() {
    previousVariableValues = {};
    if (varCountBadge) varCountBadge.textContent = '0';
    if (variablesEmpty) variablesEmpty.hidden = false;
    if (variablesContent) variablesContent.hidden = true;
    if (sectionCallstack) sectionCallstack.hidden = true;
    if (callstackStrip) callstackStrip.innerHTML = '';
    if (primitivesGrid) primitivesGrid.innerHTML = '';
    if (arraysContainer) arraysContainer.innerHTML = '';
    if (constantsGrid) constantsGrid.innerHTML = '';
    if (sectionConstants) sectionConstants.hidden = true;
    if (variablesTableBody) variablesTableBody.innerHTML = '';
    if (varLastChangeBadge) varLastChangeBadge.hidden = true;
  }

  function updateVariableInspector(variables, callStack = null, prevOverride = null) {
    if (!variables || Object.keys(variables).length === 0) {
      resetInspector();
      return;
    }

    const prevMap = prevOverride || previousVariableValues;

    if (variablesEmpty) variablesEmpty.hidden = true;
    if (variablesContent) variablesContent.hidden = false;

    // 0. Render Call Stack Strip when inside Procedures / Recursive Functions
    if (sectionCallstack && callstackStrip) {
      if (Array.isArray(callStack) && callStack.length > 1) {
        sectionCallstack.hidden = false;
        callstackStrip.innerHTML = callStack.map((frame, fIdx) => {
          const isTop = fIdx === callStack.length - 1;
          const entries = Object.entries(frame.variables || {});
          const varsSummary = entries.length > 0
            ? entries.slice(0, 6).map(([vName, vInfo]) => {
                const refPart = vInfo.refTarget ? ` ⇢ %${vInfo.refTarget}` : '';
                return `${escapeHTML(vName)}=${escapeHTML(vInfo.summary)}${escapeHTML(refPart)}`;
              }).join(', ')
            : '(χωρίς τοπικές)';
          const arrow = fIdx > 0 ? '<span class="callstack-arrow">&rarr;</span>' : '';
          return `${arrow}<div class="callstack-frame${isTop ? ' active-frame' : ''}">
            <span class="callstack-frame-title">${escapeHTML(frame.name)}</span>
            <span class="callstack-frame-vars">${varsSummary}</span>
          </div>`;
        }).join('');
      } else {
        sectionCallstack.hidden = true;
        callstackStrip.innerHTML = '';
      }
    }

    let totalVarCount = 0;
    const currentPrimitives = {};
    const currentPrimitiveMeta = {};
    const currentArrays = {};
    const currentConstants = {};

    for (const [name, rawInfo] of Object.entries(variables)) {
      if (name === 'EOLN') continue; // Skip internal marker
      totalVarCount++;

      const isConst = rawInfo && typeof rawInfo === 'object' && rawInfo.isConstant;

      if (rawInfo instanceof ArrayObject || (rawInfo && rawInfo.type === 'array')) {
        currentArrays[name] = rawInfo;
      } else if (isConst) {
        const val = (rawInfo && typeof rawInfo === 'object' && 'value' in rawInfo) ? rawInfo.value : rawInfo;
        currentConstants[name] = val;
      } else {
        const val = (rawInfo && typeof rawInfo === 'object' && 'value' in rawInfo) ? rawInfo.value : rawInfo;
        currentPrimitives[name] = val;
        currentPrimitiveMeta[name] = rawInfo && typeof rawInfo === 'object' ? rawInfo : {};
      }
    }

    if (varCountBadge) varCountBadge.textContent = totalVarCount;

    let latestChangeText = '';

    // 1. Render Primitives (Visual Memory Boxes)
    primitivesGrid.innerHTML = '';
    for (const [name, val] of Object.entries(currentPrimitives)) {
      const card = document.createElement('div');
      card.className = 'memory-box-card';
      card.setAttribute('data-var-name', name);

      const prev = prevMap[name];
      const hasChanged = prev !== undefined && prev !== val;
      if (hasChanged) {
        card.classList.add('just-changed');
        latestChangeText = `${name} = ${val} (από ${prev})`;
      }

      const meta = currentPrimitiveMeta[name] || {};
      const refBadgeHtml = meta.refTarget
        ? `<span class="mem-ref-badge" title="Πέρασμα με αναφορά (%) προς ${escapeHTML(meta.refTarget)}">% &rarr; ${escapeHTML(meta.refTarget)}</span>`
        : '';

      let typeName = 'ΑΚΕΡΑΙΟΣ';
      let typeClass = 'type-integer';
      if (typeof val === 'number') {
        if (Number.isInteger(val)) {
          typeName = 'ΑΚΕΡΑΙΟΣ';
          typeClass = 'type-integer';
        } else {
          typeName = 'ΠΡΑΓΜΑΤΙΚΟΣ';
          typeClass = 'type-real';
        }
      } else if (typeof val === 'boolean') {
        typeName = 'ΛΟΓΙΚΟΣ';
        typeClass = 'type-boolean';
      } else if (typeof val === 'string') {
        typeName = val.length === 1 ? 'ΧΑΡΑΚΤΗΡΑΣ' : 'ΣΥΜΒΟΛΟΣΕΙΡΑ';
        typeClass = 'type-string';
      }

      let heroValueHtml = '';
      if (typeof val === 'boolean') {
        heroValueHtml = val
          ? `<div class="val-boolean-chip is-true">TRUE / ΑΛΗΘΗΣ</div>`
          : `<div class="val-boolean-chip is-false">FALSE / ΨΕΥΔΗΣ</div>`;
      } else if (typeof val === 'string') {
        heroValueHtml = `
          <div class="mem-value-hero val-string-chip">"${escapeHTML(val)}"</div>
          <div class="mem-label">${val.length === 1 ? 'Χαρακτήρας' : 'Μήκος: ' + val.length + ' χαρ.'}</div>
        `;
      } else {
        heroValueHtml = `<div class="mem-value-hero">${val}</div>`;
      }

      let footerHtml = '';
      if (hasChanged) {
        footerHtml = `<span class="mem-diff-text">Αλλαγή: ${prev} &rarr; ${val}</span>`;
      } else if (prev === undefined) {
        footerHtml = `<span>Αρχική τιμή: ${val}</span>`;
      } else {
        footerHtml = `<span>Αμετάβλητη</span>`;
      }

      card.innerHTML = `
        <div class="mem-header">
          <div class="mem-title-group">
            <span class="mem-name">${escapeHTML(name)}</span>
            ${refBadgeHtml}
          </div>
          <span class="mem-type-badge ${typeClass}">${typeName}</span>
        </div>
        <div class="mem-value-section">
          <span class="mem-label">ΤΙΜΗ ΣΤΗ ΜΝΗΜΗ</span>
          ${heroValueHtml}
        </div>
        <div class="mem-footer">
          ${footerHtml}
        </div>
      `;
      primitivesGrid.appendChild(card);
    }

    // Collect integer index pointer candidates (i, j, mid, start, finish, pos...)
    const activeIndexPointers = [];
    for (const [pName, pVal] of Object.entries(currentPrimitives)) {
      if (Number.isInteger(pVal) && INDEX_POINTER_NAMES.has(pName.toUpperCase())) {
        activeIndexPointers.push({ name: pName.toLowerCase(), val: pVal });
      }
    }

    // 2. Render Arrays (Memory Tapes & Matrices + Index Pointers)
    arraysContainer.innerHTML = '';
    for (const [name, arrObj] of Object.entries(currentArrays)) {
      const box = document.createElement('div');
      box.className = 'array-box';
      box.setAttribute('data-var-name', name);

      const bounds = arrObj.bounds || [];
      const data = arrObj.data || {};
      const dimStr = bounds.map(b => `${b.from}..${b.to}`).join(', ');
      const arrRefBadge = arrObj.refTarget
        ? ` <span class="mem-ref-badge">% &rarr; ${escapeHTML(arrObj.refTarget)}</span>`
        : '';

      if (bounds.length === 1) {
        // 1D Array Tape with live index pointers underneath matching cells
        const b = bounds[0];
        let cellsHtml = '';
        for (let idx = b.from; idx <= b.to; idx++) {
          const key = String(idx);
          const cellVal = data.hasOwnProperty(key) ? data[key] : 0;
          const prevKey = `${name}[${key}]`;
          const isChanged = prevMap[prevKey] !== undefined && prevMap[prevKey] !== cellVal;
          if (isChanged) {
            latestChangeText = `${name}[${idx}] = ${cellVal}`;
          }

          const ptrsHere = activeIndexPointers
            .filter(p => p.val === idx)
            .map(p => `<span class="array-ptr-chip" title="Δείκτης ${escapeHTML(p.name)} = ${idx}">&#9650; ${escapeHTML(p.name)}</span>`)
            .join('');

          cellsHtml += `
            <div class="array-cell-wrap">
              <div class="array-cell ${isChanged ? 'just-changed' : ''}">
                <div class="array-cell-idx">${escapeHTML(name)}[${idx}]</div>
                <div class="array-cell-val">${escapeHTML(String(cellVal))}</div>
              </div>
              ${activeIndexPointers.length > 0 ? `<div class="array-ptr-list">${ptrsHere}</div>` : ''}
            </div>
          `;
        }

        const countTotal = (b.to - b.from + 1);
        box.innerHTML = `
          <div class="array-title">
            <span>${escapeHTML(name)}${arrRefBadge}</span>
            <span class="array-dim-badge">ARRAY[${dimStr}] &bull; ${countTotal} Θέσεις</span>
          </div>
          <div class="array-cells">${cellsHtml}</div>
        `;
      } else if (bounds.length === 2) {
        // 2D Matrix Array
        const rowB = bounds[0];
        const colB = bounds[1];

        let tableHtml = '<table class="matrix-2d-table"><thead><tr><th>[i\\j]</th>';
        for (let j = colB.from; j <= colB.to; j++) {
          tableHtml += `<th>j=${j}</th>`;
        }
        tableHtml += '</tr></thead><tbody>';

        for (let i = rowB.from; i <= rowB.to; i++) {
          tableHtml += `<tr><th>i=${i}</th>`;
          for (let j = colB.from; j <= colB.to; j++) {
            const key = `${i},${j}`;
            const cellVal = data.hasOwnProperty(key) ? data[key] : 0;
            const prevKey = `${name}[${key}]`;
            const isChanged = prevMap[prevKey] !== undefined && prevMap[prevKey] !== cellVal;
            if (isChanged) {
              latestChangeText = `${name}[${i},${j}] = ${cellVal}`;
            }

            tableHtml += `<td class="${isChanged ? 'just-changed' : ''}">${escapeHTML(String(cellVal))}</td>`;
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';

        const rowsCount = (rowB.to - rowB.from + 1);
        const colsCount = (colB.to - colB.from + 1);
        box.innerHTML = `
          <div class="array-title">
            <span>${escapeHTML(name)}${arrRefBadge}</span>
            <span class="array-dim-badge">ARRAY[${dimStr}] (2D Matrix: ${rowsCount}x${colsCount})</span>
          </div>
          ${tableHtml}
        `;
      }

      arraysContainer.appendChild(box);
    }

    // 3. Render Constants
    if (Object.keys(currentConstants).length > 0) {
      sectionConstants.hidden = false;
      constantsGrid.innerHTML = '';
      for (const [name, val] of Object.entries(currentConstants)) {
        const card = document.createElement('div');
        card.className = 'memory-box-card';
        card.setAttribute('data-var-name', name);
        card.innerHTML = `
          <div class="mem-header">
            <div class="mem-title-group">
              <span class="mem-name">${escapeHTML(name)}</span>
            </div>
            <span class="mem-type-badge type-constant">ΣΤΑΘΕΡΑ</span>
          </div>
          <div class="mem-value-section">
            <span class="mem-label">ΚΛΕΙΔΩΜΕΝΗ ΤΙΜΗ</span>
            <div class="mem-value-hero">${escapeHTML(String(val))}</div>
          </div>
          <div class="mem-footer">
            <span>Δεν τροποποιείται</span>
          </div>
        `;
        constantsGrid.appendChild(card);
      }
    } else {
      sectionConstants.hidden = true;
    }

    // 4. Render Table View
    if (variablesTableBody) {
      variablesTableBody.innerHTML = '';
      
      // Add Primitives to Table
      for (const [name, val] of Object.entries(currentPrimitives)) {
        const prev = prevMap[name];
        const isChanged = prev !== undefined && prev !== val;
        let typeStr = typeof val === 'number' ? (Number.isInteger(val) ? 'INTEGER' : 'REAL') :
                       typeof val === 'boolean' ? 'BOOLEAN' : 'STRING';
        
        const displayVal = typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') :
                           typeof val === 'string' ? `"${val}"` : val;

        const row = document.createElement('tr');
        row.setAttribute('data-var-name', name);
        if (isChanged) row.className = 'row-changed';
        row.innerHTML = `
          <td><strong>${escapeHTML(name)}</strong></td>
          <td><span class="mem-type-badge type-${typeStr.toLowerCase()}">${typeStr}</span></td>
          <td><strong style="color:var(--button-bg); font-size:1.1rem;">${escapeHTML(String(displayVal))}</strong></td>
          <td>${prev !== undefined ? escapeHTML(String(prev)) : '-'}</td>
          <td><span class="status-pill ${isChanged ? 'updated' : 'initial'}">${isChanged ? 'Ενημερώθηκε' : 'Αμετάβλητη'}</span></td>
        `;
        variablesTableBody.appendChild(row);
      }

      // Add Constants to Table
      for (const [name, val] of Object.entries(currentConstants)) {
        const row = document.createElement('tr');
        row.setAttribute('data-var-name', name);
        row.innerHTML = `
          <td><strong>${escapeHTML(name)}</strong></td>
          <td><span class="mem-type-badge type-constant">ΣΤΑΘΕΡΑ</span></td>
          <td><strong style="color:var(--button-bg); font-size:1.1rem;">${escapeHTML(String(val))}</strong></td>
          <td>-</td>
          <td><span class="status-pill initial">Σταθερά</span></td>
        `;
        variablesTableBody.appendChild(row);
      }

      // Add Arrays Summary to Table
      for (const [name, arrObj] of Object.entries(currentArrays)) {
        const bounds = arrObj.bounds || [];
        const dimStr = bounds.map(b => `${b.from}..${b.to}`).join(', ');
        const row = document.createElement('tr');
        row.setAttribute('data-var-name', name);
        row.innerHTML = `
          <td><strong>${escapeHTML(name)}</strong></td>
          <td><span class="mem-type-badge type-integer">ARRAY[${dimStr}]</span></td>
          <td colspan="2"><small>Δείτε αναλυτικά τα κελιά στην προβολή "Κάρτες"</small></td>
          <td><span class="status-pill initial">Πίνακας</span></td>
        `;
        variablesTableBody.appendChild(row);
      }
    }

    // 5. Update Status Bar Summary & Last Change Badge
    if (varStatusText) {
      const pCount = Object.keys(currentPrimitives).length;
      const aCount = Object.keys(currentArrays).length;
      const cCount = Object.keys(currentConstants).length;
      varStatusText.textContent = `${totalVarCount} Ενεργές (${pCount} Απλές, ${aCount} Πίνακες, ${cCount} Σταθερές)`;
    }

    if (varLastChangeBadge) {
      if (latestChangeText) {
        varLastChangeBadge.hidden = false;
        varLastChangeBadge.textContent = `Τελευταία αλλαγή: ${latestChangeText}`;
      } else {
        varLastChangeBadge.hidden = true;
      }
    }

    // 6. Re-apply search filter if user already typed in search box
    if (varSearchInput && varSearchInput.value.trim()) {
      filterVariablesDisplay(varSearchInput.value.trim().toUpperCase());
    }

    // 7. Save previous values for next step diff (only when advancing live)
    if (!prevOverride) {
      for (const [name, val] of Object.entries(currentPrimitives)) {
        previousVariableValues[name] = val;
      }
      for (const [name, arrObj] of Object.entries(currentArrays)) {
        for (const [k, v] of Object.entries(arrObj.data || {})) {
          previousVariableValues[`${name}[${k}]`] = v;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TRACE TABLE (ΠΙΝΑΚΑΣ ΤΙΜΩΝ: ΜΟΡΦΗ ΕΑΠ ΑΝΑ ΣΤΗΛΗ & ΣΥΝΟΠΤΙΚΟΣ + WORD COPY)
  // ---------------------------------------------------------------------------
  let traceHistory = [];
  let traceColumnOrder = []; // Ordered variable / array-cell names seen during run
  let traceMode = SettingsManager.get('pli10TraceMode', 'eap'); // 'eap' | 'compact'
  let stepSnapshots = []; // Up to 350 step snapshots for Step-Back time travel
  let replayIndex = -1;   // -1 = live tip; >= 0 = inspecting historical snapshot

  function flattenVarsForTrace(variables) {
    const flat = {};
    if (!variables) return flat;
    for (const [name, rawInfo] of Object.entries(variables)) {
      if (name === 'EOLN') continue;
      if (rawInfo && typeof rawInfo === 'object' && rawInfo.isConstant) continue;
      if (rawInfo instanceof ArrayObject || (rawInfo && rawInfo.type === 'array')) {
        const arrData = rawInfo.data || {};
        const keys = Object.keys(arrData).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        for (const k of keys) {
          const colKey = `${name}[${k}]`;
          flat[colKey] = arrData[k];
          if (!traceColumnOrder.includes(colKey) && traceColumnOrder.length < 24) {
            traceColumnOrder.push(colKey);
          }
        }
      } else {
        const val = (rawInfo && typeof rawInfo === 'object' && 'value' in rawInfo) ? rawInfo.value : rawInfo;
        flat[name] = val;
        if (!traceColumnOrder.includes(name) && traceColumnOrder.length < 24) {
          traceColumnOrder.push(name);
        }
      }
    }
    return flat;
  }

  function formatTraceVal(v) {
    if (v === undefined) return '-';
    if (typeof v === 'boolean') return v ? 'ΑΛΗΘΗΣ' : 'ΨΕΥΔΗΣ';
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'number' && !Number.isInteger(v)) return Number(v.toFixed(4));
    return String(v);
  }

  function getActiveTraceColumns() {
    const qRaw = traceWatchInput ? traceWatchInput.value.trim() : '';
    if (!qRaw) return traceColumnOrder.slice(0, 14);
    const wanted = qRaw.split(/[,;\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!wanted.length) return traceColumnOrder.slice(0, 14);
    return traceColumnOrder.filter((col) => {
      const cu = col.toUpperCase();
      return wanted.some(w => cu === w || cu.startsWith(w + '[') || cu.includes(w));
    });
  }

  function syncTraceModeButtons() {
    if (traceModeEapBtn) traceModeEapBtn.classList.toggle('active', traceMode === 'eap');
    if (traceModeCompactBtn) traceModeCompactBtn.classList.toggle('active', traceMode === 'compact');
    if (traceFilterBar) traceFilterBar.hidden = traceHistory.length === 0 || traceMode !== 'eap';
  }

  if (traceModeEapBtn && traceModeCompactBtn) {
    syncTraceModeButtons();
    traceModeEapBtn.addEventListener('click', () => {
      traceMode = 'eap';
      SettingsManager.set('pli10TraceMode', 'eap');
      syncTraceModeButtons();
      renderFullTraceTable();
    });
    traceModeCompactBtn.addEventListener('click', () => {
      traceMode = 'compact';
      SettingsManager.set('pli10TraceMode', 'compact');
      syncTraceModeButtons();
      renderFullTraceTable();
    });
  }

  if (traceWatchInput) {
    traceWatchInput.addEventListener('input', Common.debounce(() => {
      renderFullTraceTable();
    }, 150));
  }

  function resetTraceTable() {
    traceHistory = [];
    traceColumnOrder = [];
    stepSnapshots = [];
    replayIndex = -1;
    traceStepBadge.textContent = '0';
    traceEmpty.hidden = false;
    traceTableContainer.hidden = true;
    if (traceFilterBar) traceFilterBar.hidden = true;
    traceTableBody.innerHTML = '';
    if (stepBackButton) stepBackButton.disabled = true;
  }

  function renderFullTraceTable() {
    if (!traceHistory.length) {
      traceEmpty.hidden = false;
      traceTableContainer.hidden = true;
      if (traceFilterBar) traceFilterBar.hidden = true;
      return;
    }

    traceEmpty.hidden = true;
    traceTableContainer.hidden = false;
    syncTraceModeButtons();

    if (traceMode === 'eap') {
      const cols = getActiveTraceColumns();
      if (traceTableHead) {
        traceTableHead.innerHTML = `<tr>
          <th style="width:46px;">#</th>
          <th style="width:64px;">Γρ.</th>
          <th style="min-width:140px;">Εντολή</th>
          ${cols.map(c => `<th>${escapeHTML(c)}</th>`).join('')}
          <th style="min-width:110px;">Έξοδος</th>
        </tr>`;
      }
      traceTableBody.innerHTML = '';
      traceHistory.forEach((r, idx) => {
        const tr = document.createElement('tr');
        if (replayIndex === idx) tr.classList.add('trace-row-active');
        tr.style.cursor = 'pointer';
        tr.title = 'Κλικ για επιθεώρηση της μνήμης σε αυτό το βήμα';
        const changedSet = new Set(r.changedNames || []);
        const cells = cols.map((c) => {
          const valStr = formatTraceVal(r.flatVars ? r.flatVars[c] : undefined);
          const cls = changedSet.has(c) ? ' class="trace-cell-changed"' : '';
          return `<td${cls}>${escapeHTML(valStr)}</td>`;
        }).join('');
        tr.innerHTML = `
          <td class="trace-step-num">${r.step}</td>
          <td class="trace-line-num">Γρ. ${r.line}</td>
          <td class="trace-stmt"><code>${escapeHTML(r.stmt)}</code></td>
          ${cells}
          <td class="trace-output-text">${escapeHTML(r.output)}</td>
        `;
        tr.addEventListener('click', () => inspectStepSnapshot(idx));
        traceTableBody.appendChild(tr);
      });
    } else {
      if (traceTableHead) {
        traceTableHead.innerHTML = `<tr>
          <th style="width:50px;">#</th>
          <th style="width:70px;">Γραμμή</th>
          <th style="min-width:150px;">Εντολή</th>
          <th style="min-width:200px;">Μεταβολή Μεταβλητών</th>
          <th style="min-width:130px;">Έξοδος</th>
        </tr>`;
      }
      traceTableBody.innerHTML = '';
      traceHistory.forEach((r, idx) => {
        const tr = document.createElement('tr');
        if (replayIndex === idx) tr.classList.add('trace-row-active');
        tr.style.cursor = 'pointer';
        const varChangesHtml = r.changedItems && r.changedItems.length > 0
          ? r.changedItems.map(vc => `<span class="trace-var-item">${escapeHTML(vc.name)} = <strong>${escapeHTML(formatTraceVal(vc.val))}</strong></span>`).join(' ')
          : '-';
        tr.innerHTML = `
          <td class="trace-step-num">${r.step}</td>
          <td class="trace-line-num">Γρ. ${r.line}</td>
          <td class="trace-stmt"><code>${escapeHTML(r.stmt)}</code></td>
          <td>${varChangesHtml}</td>
          <td class="trace-output-text">${escapeHTML(r.output)}</td>
        `;
        tr.addEventListener('click', () => inspectStepSnapshot(idx));
        traceTableBody.appendChild(tr);
      });
    }
  }

  function addTraceTableRow(stepNum, lineNum, stmtText, varChanges, outputText, variablesSnapshot) {
    traceStepBadge.textContent = stepNum;
    const prevColsLen = traceColumnOrder.length;
    const flatVars = flattenVarsForTrace(variablesSnapshot);
    const changedNames = (varChanges || []).map(vc => vc.name);

    const entry = {
      step: stepNum,
      line: lineNum,
      stmt: stmtText,
      changedItems: varChanges || [],
      changedNames,
      flatVars,
      vars: varChanges && varChanges.length > 0 ? varChanges.map(vc => `${vc.name}=${formatTraceVal(vc.val)}`).join(', ') : '-',
      output: outputText || '-'
    };
    traceHistory.push(entry);

    // If new variable columns appeared in EAP mode, rebuild header+rows; else append fast
    if (traceHistory.length === 1 || (traceMode === 'eap' && traceColumnOrder.length !== prevColsLen)) {
      renderFullTraceTable();
    } else {
      const idx = traceHistory.length - 1;
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      if (traceMode === 'eap') {
        const cols = getActiveTraceColumns();
        const changedSet = new Set(changedNames);
        const cells = cols.map((c) => {
          const valStr = formatTraceVal(flatVars[c]);
          const cls = changedSet.has(c) ? ' class="trace-cell-changed"' : '';
          return `<td${cls}>${escapeHTML(valStr)}</td>`;
        }).join('');
        tr.innerHTML = `
          <td class="trace-step-num">${entry.step}</td>
          <td class="trace-line-num">Γρ. ${entry.line}</td>
          <td class="trace-stmt"><code>${escapeHTML(entry.stmt)}</code></td>
          ${cells}
          <td class="trace-output-text">${escapeHTML(entry.output)}</td>
        `;
      } else {
        const varChangesHtml = varChanges && varChanges.length > 0
          ? varChanges.map(vc => `<span class="trace-var-item">${escapeHTML(vc.name)} = <strong>${escapeHTML(formatTraceVal(vc.val))}</strong></span>`).join(' ')
          : '-';
        tr.innerHTML = `
          <td class="trace-step-num">${entry.step}</td>
          <td class="trace-line-num">Γρ. ${entry.line}</td>
          <td class="trace-stmt"><code>${escapeHTML(entry.stmt)}</code></td>
          <td>${varChangesHtml}</td>
          <td class="trace-output-text">${escapeHTML(entry.output)}</td>
        `;
      }
      tr.addEventListener('click', () => inspectStepSnapshot(idx));
      traceTableBody.appendChild(tr);
    }

    const traceWin = document.getElementById('trace-window');
    if (traceWin) {
      traceWin.scrollTop = traceWin.scrollHeight;
    }
  }

  function buildTraceMarkdown() {
    if (traceMode === 'eap') {
      const cols = getActiveTraceColumns();
      const headers = ['Βήμα', 'Γραμμή', 'Εντολή', ...cols, 'Έξοδος'];
      let md = '| ' + headers.join(' | ') + ' |\n';
      md += '| ' + headers.map((_, i) => (i <= 1 ? ':---:' : ':---')).join(' | ') + ' |\n';
      traceHistory.forEach((r) => {
        const vals = cols.map(c => formatTraceVal(r.flatVars ? r.flatVars[c] : undefined).replace(/\|/g, '\\|'));
        md += `| ${r.step} | ${r.line} | \`${r.stmt.replace(/\|/g, '\\|')}\` | ${vals.join(' | ')}${vals.length ? ' | ' : ''}${r.output.replace(/\|/g, '\\|')} |\n`;
      });
      return md;
    }
    let md = '| Βήμα | Γραμμή | Εντολή | Μεταβολή Μεταβλητών | Έξοδος |\n';
    md += '| :---: | :---: | :--- | :--- | :--- |\n';
    traceHistory.forEach(r => {
      md += `| ${r.step} | ${r.line} | \`${r.stmt.replace(/\|/g, '\\|')}\` | ${r.vars.replace(/\|/g, '\\|')} | ${r.output.replace(/\|/g, '\\|')} |\n`;
    });
    return md;
  }

  copyTraceBtn.addEventListener('click', () => {
    if (!traceHistory.length) {
      showToast('Δεν υπάρχουν ακόμη δεδομένα στον Πίνακα Τιμών.');
      return;
    }
    const md = buildTraceMarkdown();
    Common.copyTextToClipboard(md, 'Ο Πίνακας Τιμών αντιγράφηκε σε Markdown!')
      .then(ok => {
        if (!ok) Common.showPrompt('Αντιγράψτε τον Πίνακα Τιμών (Markdown):', { defaultValue: md, readonly: true });
      });
  });

  if (copyTraceWordBtn) {
    copyTraceWordBtn.addEventListener('click', () => {
      if (!traceHistory.length) {
        showToast('Δεν υπάρχουν ακόμη δεδομένα στον Πίνακα Τιμών.');
        return;
      }
      const cols = getActiveTraceColumns();
      const headers = traceMode === 'eap'
        ? ['Βήμα', 'Γραμμή', 'Εντολή', ...cols, 'Έξοδος']
        : ['Βήμα', 'Γραμμή', 'Εντολή', 'Μεταβολή Μεταβλητών', 'Έξοδος'];

      const thStyle = 'border:1px solid #1e293b; padding:5px 8px; background:#e2e8f0; color:#0f172a; font-weight:bold; text-align:center;';
      const tdStyle = 'border:1px solid #475569; padding:4px 8px; color:#0f172a;';
      const tdChangedStyle = 'border:1px solid #475569; padding:4px 8px; background:#fef3c7; color:#92400e; font-weight:bold; text-align:center;';

      let html = `<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse; font-family:Calibri, Arial, sans-serif; font-size:10pt; width:100%;">`;
      html += `<thead><tr>${headers.map(h => `<th style="${thStyle}">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>`;

      const tsvLines = [headers.join('\t')];

      traceHistory.forEach((r) => {
        if (traceMode === 'eap') {
          const changedSet = new Set(r.changedNames || []);
          const varCells = cols.map((c) => {
            const v = formatTraceVal(r.flatVars ? r.flatVars[c] : undefined);
            const st = changedSet.has(c) ? tdChangedStyle : `${tdStyle} text-align:center;`;
            return `<td style="${st}">${escapeHTML(v)}</td>`;
          }).join('');
          html += `<tr>
            <td style="${tdStyle} text-align:center;">${r.step}</td>
            <td style="${tdStyle} text-align:center;">${r.line}</td>
            <td style="${tdStyle} font-family:Consolas, monospace;">${escapeHTML(r.stmt)}</td>
            ${varCells}
            <td style="${tdStyle}">${escapeHTML(r.output)}</td>
          </tr>`;
          tsvLines.push([r.step, r.line, r.stmt, ...cols.map(c => formatTraceVal(r.flatVars ? r.flatVars[c] : undefined)), r.output].join('\t'));
        } else {
          html += `<tr>
            <td style="${tdStyle} text-align:center;">${r.step}</td>
            <td style="${tdStyle} text-align:center;">${r.line}</td>
            <td style="${tdStyle} font-family:Consolas, monospace;">${escapeHTML(r.stmt)}</td>
            <td style="${tdStyle}">${escapeHTML(r.vars)}</td>
            <td style="${tdStyle}">${escapeHTML(r.output)}</td>
          </tr>`;
          tsvLines.push([r.step, r.line, r.stmt, r.vars, r.output].join('\t'));
        }
      });
      html += '</tbody></table>';
      const plainTsv = tsvLines.join('\n');

      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainTsv], { type: 'text/plain' })
        });
        navigator.clipboard.write([item])
          .then(() => showToast('Ο Πίνακας Τιμών αντιγράφηκε! Πατήστε Ctrl+V απευθείας στο MS Word.'))
          .catch(() => Common.copyTextToClipboard(plainTsv, 'Ο Πίνακας Τιμών αντιγράφηκε (κείμενο στηλών για Word)!'));
      } else {
        Common.copyTextToClipboard(plainTsv, 'Ο Πίνακας Τιμών αντιγράφηκε (έτοιμος για επικόλληση σε Word)!');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // INTERPRETER EXECUTION & DEBUGGING ENGINE
  // ---------------------------------------------------------------------------
  let currentInterpreter = null;
  let isExecuting = false;
  let isPausedInDebug = false;
  let stepCounter = 0;
  let lastOutputSnapshotLength = 0;
  let fullOutputBuffer = '';

  function updateStepBackButtonState() {
    if (!stepBackButton) return;
    if (isExecuting && !isPausedInDebug) {
      stepBackButton.disabled = true;
      return;
    }
    const activeIdx = replayIndex >= 0 ? replayIndex : stepSnapshots.length - 1;
    stepBackButton.disabled = activeIdx <= 0;
  }

  function inspectStepSnapshot(idx) {
    if (idx < 0 || idx >= stepSnapshots.length) return;
    if (isExecuting && !isPausedInDebug) return;
    replayIndex = idx;
    const snap = stepSnapshots[idx];
    const prevSnap = idx > 0 ? stepSnapshots[idx - 1] : null;
    highlightDebugLine(snap.line);
    updateVariableInspector(snap.variables, snap.callStack, prevSnap ? prevSnap.flatPrev : {});
    renderFullTraceTable();
    updateStepBackButtonState();
    showToast(`Επιθεώρηση Βήματος #${snap.step} (Γραμμή ${snap.line})`);
  }

  function stepBackExecution() {
    if (stepSnapshots.length <= 1) return;
    if (isExecuting && !isPausedInDebug) return;
    const curIdx = replayIndex >= 0 ? replayIndex : stepSnapshots.length - 1;
    if (curIdx > 0) {
      inspectStepSnapshot(curIdx - 1);
    }
  }

  if (stepBackButton) {
    stepBackButton.addEventListener('click', stepBackExecution);
  }

  function setControlStates(executing, pausedInDebug) {
    isExecuting = executing;
    isPausedInDebug = pausedInDebug;

    if (!executing) {
      runButton.textContent = 'ΕΚΤΕΛΕΣΗ';
      runButton.disabled = false;
      stepButton.disabled = false;
      continueButton.disabled = true;
      stopButton.disabled = true;
      speedSelect.disabled = false;
    } else if (pausedInDebug) {
      runButton.disabled = true;
      stepButton.disabled = false;
      continueButton.disabled = false;
      stopButton.disabled = false;
      speedSelect.disabled = false;
    } else {
      // Running continuously
      runButton.textContent = 'ΕΚΤΕΛΕΣΗ...';
      runButton.disabled = true;
      stepButton.disabled = true;
      continueButton.disabled = true;
      stopButton.disabled = false;
      speedSelect.disabled = false;
    }
    updateStepBackButtonState();
  }

  function stopExecution() {
    if (currentInterpreter) {
      currentInterpreter.cancel();
      printToTerminal('Διακοπή εκτέλεσης από τον χρήστη.', 'info', true);
    }
    clearDebugLineHighlight();
    setControlStates(false, false);
    currentInterpreter = null;
  }

  stopButton.addEventListener('click', stopExecution);

  continueButton.addEventListener('click', () => {
    if (isExecuting && isPausedInDebug && currentInterpreter) {
      isPausedInDebug = false;
      const speed = parseInt(speedSelect.value, 10);
      currentInterpreter.setExecutionSpeed(speed);
      setControlStates(true, false);
      currentInterpreter.continueExecution();
    }
  });

  speedSelect.addEventListener('change', () => {
    const speed = parseInt(speedSelect.value, 10);
    if (currentInterpreter) {
      currentInterpreter.setExecutionSpeed(speed);
    }
  });

  async function stepExecution() {
    if (replayIndex >= 0 && replayIndex < stepSnapshots.length - 1) {
      inspectStepSnapshot(replayIndex + 1);
      if (replayIndex === stepSnapshots.length - 1 && isExecuting) {
        replayIndex = -1;
      }
      return;
    }
    replayIndex = -1;
    if (!isExecuting) {
      // Start in step debugging mode
      await runExecution(true);
    } else if (isPausedInDebug && currentInterpreter) {
      // Step to next instruction
      currentInterpreter.step();
    }
  }

  stepButton.addEventListener('click', stepExecution);
  runButton.addEventListener('click', () => runExecution(false));

  async function runExecution(startInDebugMode = false) {
    if (isExecuting) return;

    clearErrorHighlight();
    clearDebugLineHighlight();
    resetInspector();
    resetTraceTable();
    clearTerminal();
    syncBreakpointsFromDoc();

    // Prepare Batch Auto-Input queue if enabled
    activeBatchQueue = (batchInputEnabled && batchInputEnabled.checked && batchInputBox)
      ? parseBatchTokens(batchInputBox.value)
      : [];

    const pseudocode = editor.getValue();
    printToTerminal('Μεταγλώττιση (Compiling)...', 'info', true);

    let ast;
    try {
      const tokens = tokenize(pseudocode);
      const parser = new Parser(tokens);
      ast = parser.parse();
    } catch (err) {
      printToTerminal(`Σφάλμα Σύνταξης: ${err.message}`, 'error', true);
      highlightErrorLine(err.message);
      return;
    }

    printToTerminal('Εκκίνηση εκτέλεσης (Running)...', 'info', true);
    setControlStates(true, startInDebugMode);

    const speed = parseInt(speedSelect.value, 10);
    stepCounter = 0;
    lastOutputSnapshotLength = 0;
    fullOutputBuffer = '';

    currentInterpreter = new Interpreter({
      debugMode: startInDebugMode,
      breakpoints: breakpointLines,
      speed: speed
    });

    currentInterpreter.setInputProvider(inputProvider);

    currentInterpreter.setOutputCallback((text) => {
      fullOutputBuffer += text;
      printToTerminal(text, 'output');
    });

    currentInterpreter.setStepCallback(async ({ line, stmt, variables, callStack }) => {
      stepCounter++;
      replayIndex = -1;

      const isPausingNow = currentInterpreter.debugMode;
      if (isPausingNow || speed > 0) {
        highlightDebugLine(line);
      }

      // Extract statement text
      const rawLine = editor.getLine(line - 1) || '';
      const stmtPreview = rawLine.trim();

      // Find changed variables for trace table
      const changedList = [];
      for (const [name, rawInfo] of Object.entries(variables)) {
        if (name === 'EOLN') continue;
        if (rawInfo instanceof ArrayObject || (rawInfo && rawInfo.type === 'array')) {
          const arrData = rawInfo.data || {};
          for (const [idxKey, cellVal] of Object.entries(arrData)) {
            const compoundKey = `${name}[${idxKey}]`;
            if (previousVariableValues[compoundKey] === undefined || previousVariableValues[compoundKey] !== cellVal) {
              changedList.push({ name: compoundKey, val: cellVal });
            }
          }
        } else {
          const val = (rawInfo && typeof rawInfo === 'object' && 'value' in rawInfo) ? rawInfo.value : rawInfo;
          if (previousVariableValues[name] === undefined || previousVariableValues[name] !== val) {
            changedList.push({ name, val });
          }
        }
      }

      // Check newly printed output since last step
      let stepOutput = '';
      if (fullOutputBuffer.length > lastOutputSnapshotLength) {
        stepOutput = fullOutputBuffer.substring(lastOutputSnapshotLength).trim();
        lastOutputSnapshotLength = fullOutputBuffer.length;
      }

      // Update Inspector & Trace Table (cap trace rows at 500 to keep DOM fast on huge loops)
      updateVariableInspector(variables, callStack);
      if (traceHistory.length < 500) {
        addTraceTableRow(stepCounter, line, stmtPreview, changedList, stepOutput, variables);
      }

      // Save snapshot for Step-Back time travel (rolling window of 300 steps)
      const clonedVars = JSON.parse(JSON.stringify(variables));
      stepSnapshots.push({
        step: stepCounter,
        line,
        variables: clonedVars,
        callStack: callStack ? JSON.parse(JSON.stringify(callStack)) : [],
        flatPrev: { ...previousVariableValues }
      });
      if (stepSnapshots.length > 300) stepSnapshots.shift();

      if (currentInterpreter.debugMode) {
        setControlStates(true, true);
      }
    });

    try {
      const result = await currentInterpreter.interpret(ast);

      if (result.error) {
        printToTerminal(`Σφάλμα: ${result.error}`, 'error', true);
        highlightErrorLine(result.error);
      } else {
        printToTerminal('\nΗ εκτέλεση ολοκληρώθηκε επιτυχώς.', 'success', true);
      }

      // Final update of variables
      if (currentInterpreter && currentInterpreter.globalEnv) {
        updateVariableInspector(currentInterpreter.globalEnv.getAllVariables());
      }
    } catch (e) {
      printToTerminal(`Σφάλμα Εκτέλεσης: ${e.message}`, 'error', true);
      highlightErrorLine(e.message);
    } finally {
      clearDebugLineHighlight();
      setControlStates(false, false);
      currentInterpreter = null;
    }
  }

  if (Common.attachTouchSymbolBar) {
    Common.attachTouchSymbolBar(editor);
  }

  const exportDocxBtn = document.getElementById('export-docx-btn');
  if (exportDocxBtn && window.EAPDocx) {
    exportDocxBtn.addEventListener('click', () => {
      const code = editor.getValue();
      const greekMatch = code.match(/ΑΛΓΟΡΙΘΜΟΣ\s+([A-Za-zΑ-Ωα-ω0-9_]+)/i);
      const engMatch = code.match(/ALGORITHM\s+([A-Za-zΑ-Ωα-ω0-9_]+)/i);
      const progName = (greekMatch && greekMatch[1]) || (engMatch && engMatch[1]) || 'ergasia_pli10';
      const slot = pli10WorkspaceMgr ? pli10WorkspaceMgr.getActiveSlot() : null;

      const sections = [];
      if (slot && slot.notes && slot.notes.trim()) {
        sections.push({ type: 'heading', text: 'Εκφώνηση / Σημειώσεις' });
        sections.push({ type: 'paragraph', text: slot.notes.trim() });
      }

      sections.push({
        type: 'code',
        title: '1. Κώδικας Ψευδογλώσσας (ΠΛΗ10)',
        code,
        lineNumbers: true
      });

      const termText = terminalOutput ? terminalOutput.innerText.trim() : '';
      if (termText) {
        sections.push({
          type: 'code',
          title: '2. Έξοδος Εκτέλεσης (Τερματικό)',
          code: termText,
          lineNumbers: false
        });
      }

      if (traceHistory.length > 0) {
        const cols = getActiveTraceColumns();
        const headers = ['Βήμα', 'Γραμμή', 'Εντολή', ...cols, 'Έξοδος'];
        const rows = traceHistory.slice(0, 180).map((r) => [
          String(r.step),
          String(r.line),
          r.stmt,
          ...cols.map((c) => String(formatTraceVal(r.flatVars ? r.flatVars[c] : undefined))),
          r.output
        ]);
        sections.push({
          type: 'table',
          title: '3. Πίνακας Τιμών (Trace Table)',
          headers,
          rows,
          monoColumns: [2]
        });
      }

      window.EAPDocx.downloadDocx({
        title: slot ? `${slot.title} — ${progName}` : `Παραδοτέο ΠΛΗ10 — ${progName}`,
        subtitle: `Ελληνικό Ανοικτό Πανεπιστήμιο (ΠΛΗ10 - Εισαγωγή στην Πληροφορική) · ${new Date().toLocaleDateString('el-GR')}`,
        sections
      }, `${progName}.docx`);
      showToast(`Το αρχείο Word (${progName}.docx) εξήχθη επιτυχώς!`);
    });
  }

  // ---------------------------------------------------------------------------
  // FILE SAVE & LOAD (WINDOWS-1253 & UTF-8)
  // ---------------------------------------------------------------------------
  saveButton.addEventListener('click', () => {
    const code = editor.getValue();
    const greekMatch = code.match(/ΑΛΓΟΡΙΘΜΟΣ\s+([A-Za-zΑ-Ωα-ω0-9_]+)/i);
    const engMatch = code.match(/ALGORITHM\s+([A-Za-zΑ-Ωα-ω0-9_]+)/i);
    const progName = (greekMatch && greekMatch[1]) || (engMatch && engMatch[1]) || 'program';

    Common.saveTextAsFile(code, `${progName}.eap`);
    showToast(`Το αρχείο αποθηκεύτηκε ως ${progName}.eap`);
  });

  clearButton.addEventListener('click', () => {
    Common.showConfirm('Καθαρισμός όλου του κώδικα στον συντάκτη;', {
      danger: true,
      yesText: 'Καθαρισμός',
      onYes: () => {
        if (isExecuting) stopExecution();
        editor.setValue('');
        exampleSelector.value = '';
        clearTerminal();
        resetInspector();
        resetTraceTable();
        updateProgramName();
      }
    });
  });

  function containsGreekKeywords(text) {
    const upper = text.toUpperCase();
    return (upper.includes('ΑΛΓΟΡΙΘΜΟΣ') || upper.includes('ALGORITHM')) &&
           (upper.includes('ΑΡΧΗ') || upper.includes('BEGIN'));
  }

  loadButton.addEventListener('click', async () => {
    const file = await Common.pickFile('.eap,.txt');
    if (!file) return;
    try {
      const text = await Common.readTextFile(file);
      if (!containsGreekKeywords(text)) {
        Common.showToast('Το αρχείο δεν περιέχει έγκυρο κώδικα ψευδογλώσσας.');
        return;
      }
      editor.setValue(text);
      exampleSelector.value = '';
      showToast(`Φορτώθηκε: ${file.name}`);
    } catch (e) {
      Common.showToast('Αποτυχία ανάγνωσης αρχείου.');
    }
  });

  // ---------------------------------------------------------------------------
  // LAYOUT TOGGLE (STACKED vs SIDE-BY-SIDE) & DUAL-AXIS RESIZER
  // ---------------------------------------------------------------------------
  const DEFAULT_EXPANDED_HEIGHT = '38vh';
  let pli10Layout = SettingsManager.get('pli10LayoutMode', 'stacked'); // 'stacked' | 'split'

  function applyPli10Layout(mode) {
    pli10Layout = mode === 'split' ? 'split' : 'stacked';
    SettingsManager.set('pli10LayoutMode', pli10Layout);
    if (pli10Container) {
      pli10Container.classList.toggle('layout-split', pli10Layout === 'split');
    }
    if (layoutToggleBtn) {
      layoutToggleBtn.classList.toggle('active', pli10Layout === 'split');
      layoutToggleBtn.textContent = pli10Layout === 'split' ? '◫ Side-by-Side' : '⬒ Πάνω/Κάτω';
    }
    if (pli10Layout === 'split') {
      outputContainer.style.height = '';
      if (pli10PaneLeft) {
        pli10PaneLeft.style.width = SettingsManager.get('pli10SplitWidth', '50%');
      }
    } else {
      if (pli10PaneLeft) pli10PaneLeft.style.width = '';
      outputContainer.style.height = SettingsManager.get('terminalExpandedHeight', DEFAULT_EXPANDED_HEIGHT);
    }
    requestAnimationFrame(() => editor.refresh());
  }

  applyPli10Layout(pli10Layout);

  if (layoutToggleBtn) {
    layoutToggleBtn.addEventListener('click', () => {
      applyPli10Layout(pli10Layout === 'split' ? 'stacked' : 'split');
      showToast(pli10Layout === 'split' ? 'Διάταξη: Δίπλα-Δίπλα (Side-by-Side)' : 'Διάταξη: Πάνω/Κάτω');
    });
  }

  Viewport.attachDrag(dragHandle, {
    getCursor: () => (pli10Container && pli10Container.classList.contains('layout-split') && window.innerWidth > 860) ? 'col-resize' : 'row-resize',
    onMove: (e) => {
      const containerRect = pli10Container.getBoundingClientRect();
      const isSplit = pli10Container.classList.contains('layout-split') && window.innerWidth > 860;
      if (isSplit && pli10PaneLeft) {
        const newW = e.clientX - containerRect.left;
        if (newW > 260 && newW < containerRect.width - 260) {
          pli10PaneLeft.style.width = ((newW / containerRect.width) * 100).toFixed(1) + '%';
          editor.refresh();
        }
      } else {
        const newHeight = containerRect.bottom - e.clientY;
        const maxHeight = containerRect.height * 0.85;
        if (newHeight > 120 && newHeight < maxHeight) {
          outputContainer.style.height = newHeight + 'px';
        }
      }
    },
    onEnd: () => {
      const isSplit = pli10Container && pli10Container.classList.contains('layout-split') && window.innerWidth > 860;
      if (isSplit && pli10PaneLeft) {
        SettingsManager.set('pli10SplitWidth', pli10PaneLeft.style.width);
      } else {
        SettingsManager.set('terminalExpandedHeight', outputContainer.style.height);
      }
      editor.refresh();
    },
    onDblClick: () => {
      const isSplit = pli10Container && pli10Container.classList.contains('layout-split') && window.innerWidth > 860;
      if (isSplit && pli10PaneLeft) {
        pli10PaneLeft.style.width = '50%';
        SettingsManager.set('pli10SplitWidth', '50%');
      } else {
        outputContainer.style.height = DEFAULT_EXPANDED_HEIGHT;
        SettingsManager.set('terminalExpandedHeight', DEFAULT_EXPANDED_HEIGHT);
      }
      editor.refresh();
    }
  });

  // ---------------------------------------------------------------------------
  // SYNTAX HELP MODAL
  // ---------------------------------------------------------------------------
  const SYNTAX_HELP_BODY = `
      <h4>1. Δηλώσεις (ΔΕΔΟΜΕΝΑ / ΣΤΑΘΕΡΕΣ)</h4>
      <ul>
        <li><strong>Μεταβλητές:</strong> <code>&lt;λίστα&gt; : &lt;τύπος&gt; ;</code><br>Π.χ. <code>I, J: INTEGER;</code>, <code>X: REAL;</code></li>
        <li><strong>Πίνακες (Arrays):</strong> <code>&lt;όνομα&gt; : ARRAY [&lt;αρχή&gt;..&lt;τέλος&gt;] OF &lt;τύπος&gt; ;</code><br>Π.χ. <code>PIN : ARRAY [1..20] OF INTEGER;</code></li>
        <li><strong>Δισδιάστατοι Πίνακες:</strong> <code>P : ARRAY [1..3, 1..4] OF INTEGER;</code></li>
        <li><strong>Σταθερές:</strong> <code>ΣΤΑΘΕΡΕΣ N = 10, MAX = 100;</code></li>
      </ul>

      <h4>2. Τύποι Δεδομένων</h4>
      <table>
        <thead><tr><th>Τύπος</th><th>Περιγραφή</th><th>Παράδειγμα</th></tr></thead>
        <tbody>
          <tr><td><strong>INTEGER</strong></td><td>Ακέραιοι αριθμοί</td><td><code>I : INTEGER;</code></td></tr>
          <tr><td><strong>REAL</strong></td><td>Πραγματικοί αριθμοί</td><td><code>MO : REAL;</code></td></tr>
          <tr><td><strong>BOOLEAN</strong></td><td>Λογικές τιμές (TRUE / FALSE)</td><td><code>FLAG : BOOLEAN;</code></td></tr>
          <tr><td><strong>CHAR</strong></td><td>Ένας χαρακτήρας</td><td><code>CH : CHAR;</code></td></tr>
          <tr><td><strong>STRING</strong></td><td>Συμβολοσειρά κειμένου</td><td><code>NAME : STRING;</code></td></tr>
        </tbody>
      </table>

      <h4>3. Βασικές Εντολές &amp; Είσοδος / Έξοδος</h4>
      <ul>
        <li><strong>Ανάθεση:</strong> <code>X := (Y + 10) / 4</code></li>
        <li><strong>Είσοδος:</strong> <code>ΔΙΑΒΑΣΕ (X, Y)</code></li>
        <li><strong>Έξοδος:</strong> <code>ΤΥΠΩΣΕ ("Αποτέλεσμα: ", RES, EOLN)</code></li>
      </ul>

      <h4>4. Δομές Επιλογής &amp; Επανάληψης</h4>
      <pre><code>// Επιλογή:
ΕΑΝ &lt;συνθήκη&gt; ΤΟΤΕ
  &lt;εντολές&gt;
ΑΛΛΙΩΣ
  &lt;εντολές&gt;
ΕΑΝ-ΤΕΛΟΣ

// Βρόχος ΓΙΑ:
ΓΙΑ I := 1 ΕΩΣ N [ΜΕ ΒΗΜΑ 1] ΕΠΑΝΑΛΑΒΕ
  &lt;εντολές&gt;
ΓΙΑ-ΤΕΛΟΣ

// Βρόχος ΕΝΟΣΩ:
ΕΝΟΣΩ &lt;συνθήκη&gt; ΕΠΑΝΑΛΑΒΕ
  &lt;εντολές&gt;
ΕΝΟΣΩ-ΤΕΛΟΣ

// Βρόχος ΕΠΑΝΑΛΑΒΕ - ΜΕΧΡΙ:
ΕΠΑΝΑΛΑΒΕ
  &lt;εντολές&gt;
ΜΕΧΡΙ &lt;συνθήκη&gt;</code></pre>

      <h4>5. Διαδικασίες &amp; Συναρτήσεις</h4>
      <ul>
        <li><strong>Διαδικασία:</strong> <code>ΔΙΑΔΙΚΑΣΙΑ swap(%x, %y) ... ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ</code></li>
        <li><strong>Κλήση Διαδικασίας:</strong> <code>ΥΠΟΛΟΓΙΣΕ swap(%a, %b)</code></li>
        <li><strong>Πέρασμα με Αναφορά:</strong> Χρήση συμβόλου <code>%</code> (π.χ. <code>%PIN</code>, <code>%X</code>)</li>
      </ul>
  `;

  const syntaxModal = Common.createModal({
    id: 'syntax-help-modal',
    title: 'Συνοπτική Βοήθεια Σύνταξης Ψευδογλώσσας (ΠΛΗ10)',
    bodyHTML: SYNTAX_HELP_BODY
  });

  syntaxHelpButton.addEventListener('click', () => syntaxModal.open());

  if (typeof Common.loadCodeFromHashAsync === 'function') {
    Common.loadCodeFromHashAsync((shared) => {
      editor.setValue(shared);
      updateProgramName();
    });
  }
});
