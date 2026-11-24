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
  const editorMount = document.getElementById('code-editor-mount');
  const editorTitle = document.getElementById('editor-title');
  const exampleSelector = document.getElementById('example-selector');
  const formatButton = document.getElementById('format-button');
  const shareButton = document.getElementById('share-button');

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
  const dragHandle = document.getElementById('drag-handle');
  const outputContainer = document.querySelector('.output-container');

  // DOM Elements - Tabs & Content
  const varCountBadge = document.getElementById('var-count-badge');
  const traceStepBadge = document.getElementById('trace-step-badge');
  const clearTerminalBtn = document.getElementById('clear-terminal-btn');
  const copyTraceBtn = document.getElementById('copy-trace-btn');

  // DOM Elements - Terminal
  const terminalWindow = document.getElementById('terminal-window');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInputLine = document.getElementById('terminal-input-line');
  const terminalInput = document.getElementById('terminal-input');

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

  // Autosave draft to localStorage — restores on next visit (crash/tab-close safe)
  const autosave = Common.createAutosave({
    key: 'eapDraftCode',
    getValue: () => editor.getValue(),
    setValue: (code) => { editor.setValue(code); editor.clearHistory(); updateProgramName(); },
    onRestore: () => showToast('Επαναφέρθηκε το πρόχειρο από την προηγούμενη συνεδρία!')
  });

  editor.on('change', () => {
    updateProgramName();
    autosave.onChange();
  });

  updateProgramName();

  // ---------------------------------------------------------------------------
  // POPULATE EXAMPLE SELECTOR
  // ---------------------------------------------------------------------------
  Common.populateExampleSelector(exampleSelector, EXAMPLE_CATEGORIES, 'Παραδείγματα (ΠΛΗ10)...', (key, label) => {
    if (EXAMPLES && EXAMPLES[key]) {
      if (isExecuting) stopExecution();
      editor.setValue(EXAMPLES[key]);
      editor.clearHistory();
      updateProgramName();
      clearTerminal();
      resetInspector();
      resetTraceTable();
      showToast('Φορτώθηκε το παράδειγμα: ' + label);
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
  Common.wireThemeToggle({
    onChange: (themeName) => {
      if (editor) editor.setOption('theme', themeName === 'dark' ? 'dracula' : 'default');
    }
  });

  // ---------------------------------------------------------------------------
  // TABS LOGIC
  // ---------------------------------------------------------------------------
  const tabs = Common.wireTabs((tabId) => {
    copyTraceBtn.hidden = tabId !== 'tab-trace';
    clearTerminalBtn.hidden = tabId !== 'tab-terminal';
    if (varViewToggle) varViewToggle.hidden = tabId !== 'tab-variables';
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

  const inputProvider = () =>
    new Promise((resolve) => {
      // Ensure Terminal tab is visible
      switchTab('tab-terminal');
      terminalInputLine.hidden = false;
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

  function resetInspector() {
    previousVariableValues = {};
    if (varCountBadge) varCountBadge.textContent = '0';
    if (variablesEmpty) variablesEmpty.hidden = false;
    if (variablesContent) variablesContent.hidden = true;
    if (primitivesGrid) primitivesGrid.innerHTML = '';
    if (arraysContainer) arraysContainer.innerHTML = '';
    if (constantsGrid) constantsGrid.innerHTML = '';
    if (sectionConstants) sectionConstants.hidden = true;
    if (variablesTableBody) variablesTableBody.innerHTML = '';
    if (varLastChangeBadge) varLastChangeBadge.hidden = true;
  }

  function updateVariableInspector(variables) {
    if (!variables || Object.keys(variables).length === 0) {
      resetInspector();
      return;
    }

    if (variablesEmpty) variablesEmpty.hidden = true;
    if (variablesContent) variablesContent.hidden = false;

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
            <span>${escapeHTML(name)}</span>
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
            <span>${escapeHTML(name)}</span>
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
    traceEmpty.hidden = false;
    traceTableContainer.hidden = true;
    traceTableBody.innerHTML = '';
  }

  function addTraceTableRow(stepNum, lineNum, stmtText, varChanges, outputText) {
    traceEmpty.hidden = true;
    traceTableContainer.hidden = false;
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
      showToast('Δεν υπάρχουν ακόμη δεδομένα στον Πίνακα Τιμών.');
      return;
    }

    let md = '| Βήμα | Γραμμή | Εντολή | Μεταβολή Μεταβλητών | Έξοδος |\n';
    md += '| :---: | :---: | :--- | :--- | :--- |\n';

    traceHistory.forEach(r => {
      md += `| ${r.step} | ${r.line} | \`${r.stmt.replace(/\|/g, '\\|')}\` | ${r.vars.replace(/\|/g, '\\|')} | ${r.output.replace(/\|/g, '\\|')} |\n`;
    });

    Common.copyTextToClipboard(md, 'Ο Πίνακας Τιμών αντιγράφηκε σε Markdown!')
      .then(ok => {
        if (!ok) Common.showPrompt('Αντιγράψτε τον Πίνακα Τιμών (Markdown):', { defaultValue: md, readonly: true });
      });
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
  // RESIZER & CONTAINER HEIGHT
  // ---------------------------------------------------------------------------
  const DEFAULT_EXPANDED_HEIGHT = '38vh';
  outputContainer.style.height = SettingsManager.get('terminalExpandedHeight', DEFAULT_EXPANDED_HEIGHT);

  Viewport.attachDrag(dragHandle, {
    getCursor: () => 'row-resize',
    onMove: (e) => {
      const containerRect = document.querySelector('.container').getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      const maxHeight = containerRect.height * 0.85;
      if (newHeight > 120 && newHeight < maxHeight) {
        outputContainer.style.height = newHeight + 'px';
      }
    },
    onEnd: () => {
      SettingsManager.set('terminalExpandedHeight', outputContainer.style.height);
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
