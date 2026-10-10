// -----------------------------------------------------------------------------
// EAP Online Pseudocode Interpreter & Debugger (ΠΛΗ10)
// Modern UI & Execution Controller (CodeMirror, Stepper, Memory & Trace Table)
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Editor & Toolbar
  const editorMount = document.getElementById('code-editor-mount');
  const editorTitle = document.getElementById('editor-title');
  const exampleSelector = document.getElementById('example-selector');
  const formatButton = document.getElementById('format-button');
  const shareButton = document.getElementById('share-button');
  const themeToggle = document.getElementById('theme-toggle');

  // DOM Elements - Primary Controls
  const runButton = document.getElementById('run-button');
  const stepButton = document.getElementById('step-button');
  const continueButton = document.getElementById('continue-button');
  const stopButton = document.getElementById('stop-button');
  const speedSelect = document.getElementById('speed-select');

  // DOM Elements - Secondary Controls
  const loadButton = document.getElementById('load-button');
  const saveButton = document.getElementById('save-button');
  const clearButton = document.getElementById('clear-button');
  const syntaxHelpButton = document.getElementById('syntax-help-button');
  const fileInput = document.getElementById('file-input');
  const dragHandle = document.getElementById('drag-handle');
  const outputContainer = document.querySelector('.output-container');

  // DOM Elements - Tabs & Content
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const varCountBadge = document.getElementById('var-count-badge');
  const traceStepBadge = document.getElementById('trace-step-badge');
  const clearTerminalBtn = document.getElementById('clear-terminal-btn');
  const copyTraceBtn = document.getElementById('copy-trace-btn');

  // DOM Elements - Terminal
  const terminalWindow = document.getElementById('terminal-window');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInputLine = document.getElementById('terminal-input-line');
  const terminalInput = document.getElementById('terminal-input');
  const terminalPrompt = document.getElementById('terminal-prompt');

  // DOM Elements - Memory & Variables Inspector
  const variablesEmpty = document.getElementById('variables-empty');
  const variablesContent = document.getElementById('variables-content');
  const primitivesGrid = document.getElementById('primitives-grid');
  const arraysContainer = document.getElementById('arrays-container');
  const sectionConstants = document.getElementById('section-constants');
  const constantsGrid = document.getElementById('constants-grid');
  const varViewToggle = document.getElementById('var-view-toggle');
  const varCardsBtn = document.getElementById('var-cards-btn');
  const varTableBtn = document.getElementById('var-table-btn');
  const varStatusBar = document.getElementById('var-status-bar');
  const varStatusText = document.getElementById('var-status-text');
  const varLastChangeBadge = document.getElementById('var-last-change-badge');
  const varSearchInput = document.getElementById('var-search-input');
  const variablesCardsView = document.getElementById('variables-cards-view');
  const variablesTableView = document.getElementById('variables-table-view');
  const variablesTableBody = document.getElementById('variables-table-body');

  // DOM Elements - Trace Table
  const traceEmpty = document.getElementById('trace-empty');
  const traceTableContainer = document.getElementById('trace-table-container');
  const traceTableBody = document.getElementById('trace-table-body');

  // ---------------------------------------------------------------------------
  // SETTINGS MANAGER
  // ---------------------------------------------------------------------------
  const SettingsManager = {
    get: (key, defaultValue) => {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : defaultValue;
      } catch (e) {
        console.warn('LocalStorage read error:', e);
        return defaultValue;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('LocalStorage write error:', e);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // ---------------------------------------------------------------------------
  function showToast(message, duration = 2500) {
    const existing = document.querySelector('.eap-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'eap-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // INITIALIZE CODEMIRROR
  // ---------------------------------------------------------------------------
  let initialCode = EXAMPLES && EXAMPLES.HELLO ? EXAMPLES.HELLO : 'ΑΛΓΟΡΙΘΜΟΣ Hello\nΑΡΧΗ\n  ΤΥΠΩΣΕ("Καλημέρα Κόσμε")\nΤΕΛΟΣ';

  // Check URL hash for shared code permalink
  try {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#code=')) {
      const compressed = hash.substring(6);
      if (window.LZString) {
        const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        if (decompressed && decompressed.trim().length > 0) {
          initialCode = decompressed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse code from URL hash:', e);
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || SettingsManager.get('theme', 'light');
  const isDarkMode = currentTheme === 'dark';

  const editor = CodeMirror(editorMount, {
    value: initialCode,
    mode: 'eap-pseudocode',
    theme: isDarkMode ? 'dracula' : 'default',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true,
    indentUnit: 2,
    tabSize: 2,
    lineWrapping: false,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'F5': () => runExecution(false),
      'F10': () => stepExecution(),
      'Ctrl-Shift-F': () => formatEditorCode(),
      'Cmd-Shift-F': () => formatEditorCode()
    }
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

  editor.on('change', () => {
    updateProgramName();
  });

  updateProgramName();

  // ---------------------------------------------------------------------------
  // POPULATE EXAMPLE SELECTOR
  // ---------------------------------------------------------------------------
  if (typeof EXAMPLE_CATEGORIES !== 'undefined' && Array.isArray(EXAMPLE_CATEGORIES)) {
    exampleSelector.innerHTML = '<option value="" disabled selected>📚 Παραδείγματα (ΠΛΗ10)...</option>';
    EXAMPLE_CATEGORIES.forEach(cat => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = cat.category;
      cat.items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.title;
        optgroup.appendChild(option);
      });
      exampleSelector.appendChild(optgroup);
    });
  }

  exampleSelector.addEventListener('change', (e) => {
    const key = e.target.value;
    if (EXAMPLES && EXAMPLES[key]) {
      if (isExecuting) stopExecution();
      editor.setValue(EXAMPLES[key]);
      editor.clearHistory();
      updateProgramName();
      clearTerminal();
      resetInspector();
      resetTraceTable();
      showToast('✓ Φορτώθηκε το παράδειγμα: ' + (e.target.options[e.target.selectedIndex]?.text || key));
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
    showToast('✓ Ο κώδικας μορφοποιήθηκε επιτυχώς!');
  }

  formatButton.addEventListener('click', formatEditorCode);

  // ---------------------------------------------------------------------------
  // SHARE / PERMALINK (LZ-STRING)
  // ---------------------------------------------------------------------------
  shareButton.addEventListener('click', () => {
    try {
      const code = editor.getValue();
      if (!window.LZString) {
        alert('Η βιβλιοθήκη συμπίεσης δεν είναι διαθέσιμη.');
        return;
      }
      const compressed = LZString.compressToEncodedURIComponent(code);
      const url = new URL(window.location.href);
      url.hash = `code=${compressed}`;
      window.history.replaceState(null, '', url.toString());

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url.toString()).then(() => {
          showToast('🔗 Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!');
        }).catch(() => {
          prompt('Αντιγράψτε τον σύνδεσμο:', url.toString());
        });
      } else {
        prompt('Αντιγράψτε τον σύνδεσμο:', url.toString());
      }
    } catch (e) {
      console.error('Error sharing code:', e);
      alert('Σφάλμα δημιουργίας συνδέσμου.');
    }
  });

  // ---------------------------------------------------------------------------
  // THEME MANAGEMENT
  // ---------------------------------------------------------------------------
  const applyTheme = (isDark) => {
    const themeName = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeName);
    document.body.setAttribute('data-theme', themeName);
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    SettingsManager.set('theme', themeName);

    // Update CodeMirror theme
    if (editor) {
      editor.setOption('theme', isDark ? 'dracula' : 'default');
    }

    const url = new URL(window.location);
    url.searchParams.set('theme', themeName);
    window.history.replaceState({}, '', url);

    const homeLink = document.querySelector('.home-link');
    if (homeLink) {
      homeLink.href = `index.html?theme=${themeName}`;
    }
  };

  applyTheme(isDarkMode);

  themeToggle.addEventListener('click', () => {
    const isNowDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(isNowDark);
  });

  // ---------------------------------------------------------------------------
  // TABS LOGIC
  // ---------------------------------------------------------------------------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      switchTab(targetId);
    });
  });

  function switchTab(tabId) {
    tabButtons.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Toggle contextual buttons
    if (tabId === 'tab-trace') {
      copyTraceBtn.style.display = 'inline-flex';
      clearTerminalBtn.style.display = 'none';
      if (varViewToggle) varViewToggle.style.display = 'none';
    } else if (tabId === 'tab-terminal') {
      copyTraceBtn.style.display = 'none';
      clearTerminalBtn.style.display = 'inline-flex';
      if (varViewToggle) varViewToggle.style.display = 'none';
    } else if (tabId === 'tab-variables') {
      copyTraceBtn.style.display = 'none';
      clearTerminalBtn.style.display = 'none';
      if (varViewToggle) varViewToggle.style.display = 'inline-flex';
    } else {
      copyTraceBtn.style.display = 'none';
      clearTerminalBtn.style.display = 'none';
      if (varViewToggle) varViewToggle.style.display = 'none';
    }
  }

  // Variable View Toggle (Cards vs Table)
  if (varCardsBtn && varTableBtn) {
    varCardsBtn.addEventListener('click', () => {
      varCardsBtn.classList.add('active');
      varTableBtn.classList.remove('active');
      if (variablesCardsView) variablesCardsView.style.display = 'block';
      if (variablesTableView) variablesTableView.style.display = 'none';
    });

    varTableBtn.addEventListener('click', () => {
      varTableBtn.classList.add('active');
      varCardsBtn.classList.remove('active');
      if (variablesCardsView) variablesCardsView.style.display = 'none';
      if (variablesTableView) variablesTableView.style.display = 'block';
    });
  }

  // Variable Filter / Search Input
  if (varSearchInput) {
    varSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toUpperCase();
      filterVariablesDisplay(q);
    });
  }

  function filterVariablesDisplay(query) {
    const cards = document.querySelectorAll('.memory-box-card');
    cards.forEach(card => {
      const name = (card.getAttribute('data-var-name') || '').toUpperCase();
      card.style.display = (!query || name.includes(query)) ? '' : 'none';
    });

    const arrayBoxes = document.querySelectorAll('.array-box');
    arrayBoxes.forEach(box => {
      const name = (box.getAttribute('data-var-name') || '').toUpperCase();
      box.style.display = (!query || name.includes(query)) ? '' : 'none';
    });

    const tableRows = document.querySelectorAll('#variables-table-body tr');
    tableRows.forEach(row => {
      const name = (row.getAttribute('data-var-name') || '').toUpperCase();
      row.style.display = (!query || name.includes(query)) ? '' : 'none';
    });
  }

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
    terminalInputLine.style.display = 'none';
  };

  const inputProvider = () =>
    new Promise((resolve) => {
      // Ensure Terminal tab is visible
      switchTab('tab-terminal');
      terminalInputLine.style.display = 'flex';
      scrollToBottom();
      terminalInput.value = '';
      terminalInput.focus();

      const handleEnter = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = terminalInput.value;
          terminalInputLine.style.display = 'none';
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

  function resetInspector() {
    previousVariableValues = {};
    if (varCountBadge) varCountBadge.textContent = '0';
    if (variablesEmpty) variablesEmpty.style.display = 'flex';
    if (variablesContent) variablesContent.style.display = 'none';
    if (primitivesGrid) primitivesGrid.innerHTML = '';
    if (arraysContainer) arraysContainer.innerHTML = '';
    if (constantsGrid) constantsGrid.innerHTML = '';
    if (sectionConstants) sectionConstants.style.display = 'none';
    if (variablesTableBody) variablesTableBody.innerHTML = '';
    if (varLastChangeBadge) varLastChangeBadge.style.display = 'none';
  }

  function updateVariableInspector(variables) {
    if (!variables || Object.keys(variables).length === 0) {
      resetInspector();
      return;
    }

    if (variablesEmpty) variablesEmpty.style.display = 'none';
    if (variablesContent) variablesContent.style.display = 'block';

    let totalVarCount = 0;
    const currentPrimitives = {};
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

      const prev = previousVariableValues[name];
      const hasChanged = prev !== undefined && prev !== val;
      if (hasChanged) {
        card.classList.add('just-changed');
        latestChangeText = `${name} = ${val} (από ${prev})`;
      }

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
          ? `<div class="val-boolean-chip is-true">🟢 TRUE / ΑΛΗΘΗΣ</div>`
          : `<div class="val-boolean-chip is-false">🔴 FALSE / ΨΕΥΔΗΣ</div>`;
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
        footerHtml = `<span class="mem-diff-text">⚡ Άλλαξε: ${prev} ➔ ${val}</span>`;
      } else if (prev === undefined) {
        footerHtml = `<span>✨ Αρχική τιμή: ${val}</span>`;
      } else {
        footerHtml = `<span>✓ Αμετάβλητη</span>`;
      }

      card.innerHTML = `
        <div class="mem-header">
          <div class="mem-title-group">
            <span class="mem-icon">📦</span>
            <span class="mem-name">${escapeHTML(name)}</span>
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

    // 2. Render Arrays (Memory Tapes & Matrices)
    arraysContainer.innerHTML = '';
    for (const [name, arrObj] of Object.entries(currentArrays)) {
      const box = document.createElement('div');
      box.className = 'array-box';
      box.setAttribute('data-var-name', name);

      const bounds = arrObj.bounds || [];
      const data = arrObj.data || {};
      const dimStr = bounds.map(b => `${b.from}..${b.to}`).join(', ');

      if (bounds.length === 1) {
        // 1D Array Tape
        const b = bounds[0];
        let cellsHtml = '';
        let changedInThisArray = 0;
        for (let idx = b.from; idx <= b.to; idx++) {
          const key = String(idx);
          const cellVal = data.hasOwnProperty(key) ? data[key] : 0;
          const prevKey = `${name}[${key}]`;
          const isChanged = previousVariableValues[prevKey] !== undefined && previousVariableValues[prevKey] !== cellVal;
          if (isChanged) {
            changedInThisArray++;
            latestChangeText = `${name}[${idx}] = ${cellVal}`;
          }

          cellsHtml += `
            <div class="array-cell ${isChanged ? 'just-changed' : ''}">
              <div class="array-cell-idx">${escapeHTML(name)}[${idx}]</div>
              <div class="array-cell-val">${escapeHTML(String(cellVal))}</div>
            </div>
          `;
        }

        const countTotal = (b.to - b.from + 1);
        box.innerHTML = `
          <div class="array-title">
            <span>📊 ${escapeHTML(name)}</span>
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
            const isChanged = previousVariableValues[prevKey] !== undefined && previousVariableValues[prevKey] !== cellVal;
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
            <span>📊 ${escapeHTML(name)}</span>
            <span class="array-dim-badge">ARRAY[${dimStr}] (2D Matrix: ${rowsCount}x${colsCount})</span>
          </div>
          ${tableHtml}
        `;
      }

      arraysContainer.appendChild(box);
    }

    // 3. Render Constants
    if (Object.keys(currentConstants).length > 0) {
      sectionConstants.style.display = 'block';
      constantsGrid.innerHTML = '';
      for (const [name, val] of Object.entries(currentConstants)) {
        const card = document.createElement('div');
        card.className = 'memory-box-card';
        card.setAttribute('data-var-name', name);
        card.innerHTML = `
          <div class="mem-header">
            <div class="mem-title-group">
              <span class="mem-icon">🔒</span>
              <span class="mem-name">${escapeHTML(name)}</span>
            </div>
            <span class="mem-type-badge type-constant">ΣΤΑΘΕΡΑ</span>
          </div>
          <div class="mem-value-section">
            <span class="mem-label">ΚΛΕΙΔΩΜΕΝΗ ΤΙΜΗ</span>
            <div class="mem-value-hero">${escapeHTML(String(val))}</div>
          </div>
          <div class="mem-footer">
            <span>🔒 Δεν τροποποιείται</span>
          </div>
        `;
        constantsGrid.appendChild(card);
      }
    } else {
      sectionConstants.style.display = 'none';
    }

    // 4. Render Table View
    if (variablesTableBody) {
      variablesTableBody.innerHTML = '';
      
      // Add Primitives to Table
      for (const [name, val] of Object.entries(currentPrimitives)) {
        const prev = previousVariableValues[name];
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
          <td><span class="status-pill ${isChanged ? 'updated' : 'initial'}">${isChanged ? '⚡ Ενημερώθηκε' : 'Αμετάβλητη'}</span></td>
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
          <td><span class="status-pill initial">🔒 Σταθερά</span></td>
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
          <td><span class="status-pill initial">📊 Πίνακας</span></td>
        `;
        variablesTableBody.appendChild(row);
      }
    }

    // 5. Update Status Bar Summary & Last Change Badge
    if (varStatusText) {
      const pCount = Object.keys(currentPrimitives).length;
      const aCount = Object.keys(currentArrays).length;
      const cCount = Object.keys(currentConstants).length;
      varStatusText.textContent = `📦 ${totalVarCount} Ενεργές (${pCount} Απλές, ${aCount} Πίνακες, ${cCount} Σταθερές)`;
    }

    if (varLastChangeBadge) {
      if (latestChangeText) {
        varLastChangeBadge.style.display = 'inline-block';
        varLastChangeBadge.textContent = `⚡ Τελευταία αλλαγή: ${latestChangeText}`;
      } else {
        varLastChangeBadge.style.display = 'none';
      }
    }

    // 6. Re-apply search filter if user already typed in search box
    if (varSearchInput && varSearchInput.value.trim()) {
      filterVariablesDisplay(varSearchInput.value.trim().toUpperCase());
    }

    // 7. Save previous values for next step diff
    for (const [name, val] of Object.entries(currentPrimitives)) {
      previousVariableValues[name] = val;
    }
    for (const [name, arrObj] of Object.entries(currentArrays)) {
      for (const [k, v] of Object.entries(arrObj.data || {})) {
        previousVariableValues[`${name}[${k}]`] = v;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // TRACE TABLE (ΠΙΝΑΚΑΣ ΤΙΜΩΝ)
  // ---------------------------------------------------------------------------
  let traceHistory = [];

  function resetTraceTable() {
    traceHistory = [];
    traceStepBadge.textContent = '0';
    traceEmpty.style.display = 'flex';
    traceTableContainer.style.display = 'none';
    traceTableBody.innerHTML = '';
  }

  function addTraceTableRow(stepNum, lineNum, stmtText, varChanges, outputText) {
    traceEmpty.style.display = 'none';
    traceTableContainer.style.display = 'block';
    traceStepBadge.textContent = stepNum;

    const row = document.createElement('tr');

    let varChangesHtml = '-';
    if (varChanges && varChanges.length > 0) {
      varChangesHtml = varChanges.map(vc =>
        `<span class="trace-var-item">${escapeHTML(vc.name)} = <strong>${escapeHTML(String(vc.val))}</strong></span>`
      ).join(' ');
    }

    row.innerHTML = `
      <td class="trace-step-num">${stepNum}</td>
      <td class="trace-line-num">Γρ. ${lineNum}</td>
      <td class="trace-stmt"><code>${escapeHTML(stmtText)}</code></td>
      <td>${varChangesHtml}</td>
      <td class="trace-output-text">${outputText ? escapeHTML(outputText) : '-'}</td>
    `;

    traceTableBody.appendChild(row);

    // Record data for Markdown export
    traceHistory.push({
      step: stepNum,
      line: lineNum,
      stmt: stmtText,
      vars: varChanges && varChanges.length > 0 ? varChanges.map(vc => `${vc.name}=${vc.val}`).join(', ') : '-',
      output: outputText || '-'
    });

    // Auto-scroll table to bottom
    const traceWin = document.getElementById('trace-window');
    if (traceWin) {
      traceWin.scrollTop = traceWin.scrollHeight;
    }
  }

  copyTraceBtn.addEventListener('click', () => {
    if (!traceHistory.length) {
      alert('Δεν υπάρχουν ακόμη δεδομένα στον Πίνακα Τιμών.');
      return;
    }

    let md = '| Βήμα | Γραμμή | Εντολή | Μεταβολή Μεταβλητών | Έξοδος |\n';
    md += '| :---: | :---: | :--- | :--- | :--- |\n';

    traceHistory.forEach(r => {
      md += `| ${r.step} | ${r.line} | \`${r.stmt.replace(/\|/g, '\\|')}\` | ${r.vars.replace(/\|/g, '\\|')} | ${r.output.replace(/\|/g, '\\|')} |\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).then(() => {
        showToast('📋 Ο Πίνακας Τιμών αντιγράφηκε σε Markdown!');
      }).catch(() => {
        prompt('Αντιγράψτε τον Πίνακα Τιμών (Markdown):', md);
      });
    } else {
      prompt('Αντιγράψτε τον Πίνακα Τιμών (Markdown):', md);
    }
  });

  // ---------------------------------------------------------------------------
  // INTERPRETER EXECUTION & DEBUGGING ENGINE
  // ---------------------------------------------------------------------------
  let currentInterpreter = null;
  let isExecuting = false;
  let isPausedInDebug = false;
  let stepCounter = 0;
  let lastOutputSnapshotLength = 0;
  let fullOutputBuffer = '';

  function setControlStates(executing, pausedInDebug) {
    isExecuting = executing;
    isPausedInDebug = pausedInDebug;

    if (!executing) {
      runButton.textContent = '▶ ΕΚΤΕΛΕΣΗ';
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
      runButton.textContent = '⏳ ΕΚΤΕΛΕΣΗ...';
      runButton.disabled = true;
      stepButton.disabled = true;
      continueButton.disabled = true;
      stopButton.disabled = false;
      speedSelect.disabled = false;
    }
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
      speed: speed
    });

    currentInterpreter.setInputProvider(inputProvider);

    currentInterpreter.setOutputCallback((text) => {
      fullOutputBuffer += text;
      printToTerminal(text, 'output');
    });

    currentInterpreter.setStepCallback(async ({ line, stmt, variables }) => {
      stepCounter++;

      // Highlight active line in CodeMirror
      highlightDebugLine(line);

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

      // Update Inspector & Trace Table
      updateVariableInspector(variables);
      addTraceTableRow(stepCounter, line, stmtPreview, changedList, stepOutput);

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

  // ---------------------------------------------------------------------------
  // FILE SAVE & LOAD (WINDOWS-1253 & UTF-8)
  // ---------------------------------------------------------------------------
  saveButton.addEventListener('click', () => {
    const code = editor.getValue();
    const greekMatch = code.match(/ΑΛΓΟΡΙΘΜΟΣ\s+([A-Za-zΑ-Ωα-ω0-9_]+)/i);
    const engMatch = code.match(/ALGORITHM\s+([A-Za-zΑ-Ωα-ω0-9_]+)/i);
    const progName = (greekMatch && greekMatch[1]) || (engMatch && engMatch[1]) || 'program';

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${progName}.eap`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`💾 Το αρχείο αποθηκεύτηκε ως ${progName}.eap`);
  });

  clearButton.addEventListener('click', () => {
    if (confirm('Καθαρισμός όλου του κώδικα στον συντάκτη;')) {
      if (isExecuting) stopExecution();
      editor.setValue('');
      exampleSelector.value = '';
      clearTerminal();
      resetInspector();
      resetTraceTable();
      updateProgramName();
    }
  });

  // Windows-1253 Map
  const WINDOWS_1253_MAP = {
    0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
    0x86: '\u2020', 0x87: '\u2021', 0x89: '\u2030', 0x8B: '\u2039', 0x8C: '\u0152',
    0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022',
    0x96: '\u2013', 0x97: '\u2014', 0x99: '\u2122', 0x9B: '\u203A', 0x9C: '\u0153',
    0xA0: '\u00A0', 0xA1: '\u0385', 0xA2: '\u0386', 0xA3: '\u00A3', 0xA4: '\u00A4',
    0xA5: '\u00A5', 0xA6: '\u00A6', 0xA7: '\u00A7', 0xA8: '\u00A8', 0xA9: '\u00A9',
    0xAA: '\u037A', 0xAB: '\u00AB', 0xAC: '\u00AC', 0xAD: '\u00AD', 0xAE: '\u00AE',
    0xAF: '\u2015', 0xB0: '\u00B0', 0xB1: '\u00B1', 0xB2: '\u00B2', 0xB3: '\u00B3',
    0xB4: '\u0384', 0xB5: '\u00B5', 0xB6: '\u00B6', 0xB7: '\u00B7', 0xB8: '\u0388',
    0xB9: '\u0389', 0xBA: '\u038A', 0xBB: '\u00BB', 0xBC: '\u038C', 0xBD: '\u00BD',
    0xBE: '\u038E', 0xBF: '\u038F', 0xC0: '\u0390', 0xC1: '\u0391', 0xC2: '\u0392',
    0xC3: '\u0393', 0xC4: '\u0394', 0xC5: '\u0395', 0xC6: '\u0396', 0xC7: '\u0397',
    0xC8: '\u0398', 0xC9: '\u0399', 0xCA: '\u039A', 0xCB: '\u039B', 0xCC: '\u039C',
    0xCD: '\u039D', 0xCE: '\u039E', 0xCF: '\u039F', 0xD0: '\u03A0', 0xD1: '\u03A1',
    0xD3: '\u03A3', 0xD4: '\u03A4', 0xD5: '\u03A5', 0xD6: '\u03A6', 0xD7: '\u03A7',
    0xD8: '\u03A8', 0xD9: '\u03A9', 0xDA: '\u03AA', 0xDB: '\u03AB', 0xDC: '\u03AC',
    0xDD: '\u03AD', 0xDE: '\u03AE', 0xDF: '\u03AF', 0xE0: '\u03B0', 0xE1: '\u03B1',
    0xE2: '\u03B2', 0xE3: '\u03B3', 0xE4: '\u03B4', 0xE5: '\u03B5', 0xE6: '\u03B6',
    0xE7: '\u03B7', 0xE8: '\u03B8', 0xE9: '\u03B9', 0xEA: '\u03BA', 0xEB: '\u03BB',
    0xEC: '\u03BC', 0xED: '\u03BD', 0xEE: '\u03BE', 0xEF: '\u03BF', 0xF0: '\u03C0',
    0xF1: '\u03C1', 0xF2: '\u03C2', 0xF3: '\u03C3', 0xF4: '\u03C4', 0xF5: '\u03C5',
    0xF6: '\u03C6', 0xF7: '\u03C7', 0xF8: '\u03C8', 0xF9: '\u03C9', 0xFA: '\u03CA',
    0xFB: '\u03CB', 0xFC: '\u03CC', 0xFD: '\u03CD', 0xFE: '\u03CE'
  };

  function decodeWindows1253(bytes) {
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte < 0x80) {
        result += String.fromCharCode(byte);
      } else if (WINDOWS_1253_MAP[byte]) {
        result += WINDOWS_1253_MAP[byte];
      } else {
        result += String.fromCharCode(byte);
      }
    }
    return result;
  }

  function tryDecodeUTF8(buffer) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      return decoder.decode(buffer);
    } catch (e) {
      return null;
    }
  }

  function containsGreekKeywords(text) {
    const upper = text.toUpperCase();
    return (upper.includes('ΑΛΓΟΡΙΘΜΟΣ') || upper.includes('ALGORITHM')) &&
           (upper.includes('ΑΡΧΗ') || upper.includes('BEGIN'));
  }

  loadButton.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target.result;
      const bytes = new Uint8Array(buffer);

      // Try UTF-8 first
      let decoded = tryDecodeUTF8(buffer);
      if (decoded && containsGreekKeywords(decoded)) {
        editor.setValue(decoded);
        exampleSelector.value = '';
        showToast(`✓ Φορτώθηκε (UTF-8): ${file.name}`);
        return;
      }

      // Try Windows-1253
      decoded = decodeWindows1253(bytes);
      if (decoded && containsGreekKeywords(decoded)) {
        editor.setValue(decoded);
        exampleSelector.value = '';
        showToast(`✓ Φορτώθηκε (Windows-1253): ${file.name}`);
        return;
      }

      // Fallback
      if (decoded) {
        editor.setValue(decoded);
        exampleSelector.value = '';
        showToast(`✓ Φορτώθηκε: ${file.name}`);
      } else {
        alert('Το αρχείο δεν περιέχει έγκυρο κώδικα ψευδογλώσσας.');
      }
    };

    reader.onerror = () => alert('Αποτυχία ανάγνωσης αρχείου.');
    reader.readAsArrayBuffer(file);
  });

  // ---------------------------------------------------------------------------
  // RESIZER & CONTAINER HEIGHT
  // ---------------------------------------------------------------------------
  const DEFAULT_EXPANDED_HEIGHT = '38vh';
  let preferredHeight = SettingsManager.get('terminalExpandedHeight', DEFAULT_EXPANDED_HEIGHT);
  outputContainer.style.height = preferredHeight;

  let isResizing = false;

  dragHandle.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const containerRect = document.querySelector('.container').getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    const maxHeight = containerRect.height * 0.85;
    if (newHeight > 120 && newHeight < maxHeight) {
      outputContainer.style.height = newHeight + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      preferredHeight = outputContainer.style.height;
      SettingsManager.set('terminalExpandedHeight', preferredHeight);
    }
  });

  // ---------------------------------------------------------------------------
  // SYNTAX HELP MODAL
  // ---------------------------------------------------------------------------
  function createSyntaxModal() {
    const modalId = 'syntax-help-modal';
    let modal = document.getElementById(modalId);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => { modal.style.display = 'none'; };

    const title = document.createElement('h2');
    title.textContent = 'Συνοπτική Βοήθεια Σύνταξης Ψευδογλώσσας (ΠΛΗ10)';

    const body = document.createElement('div');
    body.innerHTML = `
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

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    return modal;
  }

  const syntaxModal = createSyntaxModal();

  syntaxHelpButton.addEventListener('click', () => {
    syntaxModal.style.display = 'flex';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && syntaxModal.style.display === 'flex') {
      syntaxModal.style.display = 'none';
    }
  });

  // Utility to escape HTML
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
