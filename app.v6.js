// -----------------------------------------------------------------------------
// UI AND EXECUTION
// -----------------------------------------------------------------------------
const EXAMPLES = {
  HELLO: `ΑΛΓΟΡΙΘΜΟΣ Hello
ΑΡΧΗ
  ΤΥΠΩΣΕ("Hello World")
ΤΕΛΟΣ`,
  FIBONACCI: `ΑΛΓΟΡΙΘΜΟΣ Fibonacci
ΔΕΔΟΜΕΝΑ N, A, B, TEMP, I : ΑΚΕΡΑΙΟΣ;
ΑΡΧΗ
  ΤΥΠΩΣΕ("Δώσε αριθμό όρων:")
  ΔΙΑΒΑΣΕ(N)
  A := 0; B := 1;
  ΤΥΠΩΣΕ(A)
  ΤΥΠΩΣΕ(B)
  ΓΙΑ I := 3 ΕΩΣ N ΕΠΑΝΑΛΑΒΕ
    TEMP := A + B;
    ΤΥΠΩΣΕ(TEMP);
    A := B;
    B := TEMP
  ΓΙΑ-ΤΕΛΟΣ
ΤΕΛΟΣ`,
  BUBBLE_SORT: `ΑΛΓΟΡΙΘΜΟΣ BubbleSort
ΣΤΑΘΕΡΕΣ
  N = 5;
ΔΕΔΟΜΕΝΑ
  A: ARRAY[1..N] OF INTEGER;
  I, J, TEMP: INTEGER;
ΑΡΧΗ
  /* Είσοδος */
  ΓΙΑ I:=1 ΕΩΣ N ΕΠΑΝΑΛΑΒΕ
    A[I] := (N - I + 1) * 10
  ΓΙΑ-ΤΕΛΟΣ;
  /* Ταξινόμηση */
  ΓΙΑ I:=2 ΕΩΣ N ΕΠΑΝΑΛΑΒΕ
    ΓΙΑ J:=N ΕΩΣ I ΜΕ ΒΗΜΑ -1 ΕΠΑΝΑΛΑΒΕ
      ΕΑΝ A[J-1] > A[J] ΤΟΤΕ
        TEMP := A[J-1];
        A[J-1] := A[J];
        A[J] := TEMP
      ΕΑΝ-ΤΕΛΟΣ
    ΓΙΑ-ΤΕΛΟΣ
  ΓΙΑ-ΤΕΛΟΣ;
  /* Εκτύπωση */
  ΓΙΑ I:=1 ΕΩΣ N ΕΠΑΝΑΛΑΒΕ
    ΤΥΠΩΣΕ(A[I])
  ΓΙΑ-ΤΕΛΟΣ
ΤΕΛΟΣ`,
  AVERAGE: `ΑΛΓΟΡΙΘΜΟΣ Average
ΔΕΔΟΜΕΝΑ SUM, COUNT, NUM : ΠΡΑΓΜΑΤΙΚΟΣ;
ΑΡΧΗ
  SUM := 0; COUNT := 0;
  ΤΥΠΩΣΕ("Δώσε αριθμούς (0 για τέλος):")
  ΕΠΑΝΑΛΑΒΕ
    ΔΙΑΒΑΣΕ(NUM);
    ΕΑΝ NUM <> 0 ΤΟΤΕ
      SUM := SUM + NUM;
      COUNT := COUNT + 1
    ΕΑΝ-ΤΕΛΟΣ
  ΜΕΧΡΙ NUM = 0;
  ΕΑΝ COUNT > 0 ΤΟΤΕ
    ΤΥΠΩΣΕ("Μέσος Όρος:", SUM / COUNT)
  ΑΛΛΙΩΣ
    ΤΥΠΩΣΕ("Δεν δόθηκαν αριθμοί.")
  ΕΑΝ-ΤΕΛΟΣ
ΤΕΛΟΣ`
};

document.addEventListener('DOMContentLoaded', () => {
  const codeEditor = document.getElementById('code-editor');
  const highlighting = document.getElementById('highlighting');
  const highlightingContent = document.getElementById('highlighting-content');
  const lineNumbers = document.getElementById('line-numbers');
  const runButton = document.getElementById('run-button');
  const saveButton = document.getElementById('save-button');
  const clearButton = document.getElementById('clear-button');
  const loadButton = document.getElementById('load-button');   // NEW
  const fileInput = document.getElementById('file-input');     // NEW
  const exampleSelector = document.getElementById('example-selector');
  const themeToggle = document.getElementById('theme-toggle');
  // Syntax help modal
    const triggerButton = document.getElementById('syntax-help-button');
    const modalId = 'my-dynamic-modal'; // Unique ID for the modal container


  // Terminal Elements
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInputLine = document.getElementById('terminal-input-line');
  const terminalInput = document.getElementById('terminal-input');
  const terminalPrompt = document.getElementById('terminal-prompt');
  const outputContainer = document.querySelector('.output-container');
  const dragHandle = document.getElementById('drag-handle');

  // -----------------------------------
  // SETTINGS MANAGER
  // -----------------------------------
  const SettingsManager = {
    get: (key, defaultValue) => {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : defaultValue;
      } catch (e) {
        console.warn('LocalStorage access failed:', e);
        return defaultValue;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('LocalStorage write failed:', e);
      }
    }
  };

  // -----------------------------------
  // AUTOCOMPLETE CONFIG
  // -----------------------------------
  const AUTOCOMPLETE_KEYWORDS = [
    'ΑΛΓΟΡΙΘΜΟΣ', 'ΣΤΑΘΕΡΕΣ', 'ΔΕΔΟΜΕΝΑ', 'ΑΡΧΗ', 'ΤΕΛΟΣ',
    'ΕΑΝ', 'ΤΟΤΕ', 'ΑΛΛΙΩΣ', 'ΕΑΝ-ΤΕΛΟΣ',
    'ΓΙΑ', 'ΕΩΣ', 'ΜΕ', 'ΒΗΜΑ', 'ΓΙΑ-ΤΕΛΟΣ',
    'ΕΝΟΣΩ', 'ΕΝΟΣΩ-ΤΕΛΟΣ', 'ΜΕΧΡΙ', 'ΕΠΑΝΑΛΑΒΕ', 
    'ΤΥΠΩΣΕ', 'ΔΙΑΒΑΣΕ',
    'ΔΙΑΔΙΚΑΣΙΑ', 'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ',
    'ΣΥΝΑΡΤΗΣΗ', 'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ',
    'ΑΚΕΡΑΙΟΣ', 'ΠΡΑΓΜΑΤΙΚΟΣ', 'ΛΟΓΙΚΟΣ', 'ΧΑΡΑΚΤΗΡΑΣ', 'ΣΥΜΒΟΛΟΣΕΙΡΑ',
    'ALGORITHM', 'CONSTANTS', 'DATA', 'BEGIN', 'END',
    'IF', 'THEN', 'ELSE', 'ENDIF',
    'FOR', 'TO', 'STEP', 'ENDFOR',
    'WHILE', 'ENDWHILE',
    'REPEAT', 'UNTIL',
    'PRINT', 'READ',
    'PROCEDURE', 'ENDPROCEDURE',
    'FUNCTION', 'ENDFUNCTION',
    'INTEGER', 'REAL', 'BOOLEAN', 'CHAR', 'STRING'
  ];

  const autocompleteBox = document.getElementById('autocomplete-box');
  const syntaxHelpButton = document.getElementById('syntax-help-button');

  function getCurrentWord(text, pos) {
    const left = text.slice(0, pos);
    const match = left.match(/([A-Za-zΑ-Ωα-ω]+)$/u);
    return match ? match[1] : '';
  }

  function showAutocomplete(prefix) {
    if (!prefix || prefix.length < 2) {
      autocompleteBox.style.display = 'none';
      return;
    }
    const upper = prefix.toUpperCase();
    const matches = AUTOCOMPLETE_KEYWORDS.filter(k => k.startsWith(upper));
    if (!matches.length) {
      autocompleteBox.style.display = 'none';
      return;
    }

    autocompleteBox.innerHTML = matches
      .map((m, i) =>
        `<div class="autocomplete-item${i === 0 ? ' selected' : ''}">${m}</div>`
      )
      .join('');

    const rect = codeEditor.getBoundingClientRect();
    const textUpToCursor = codeEditor.value.slice(0, codeEditor.selectionStart);
    const lineIndex = textUpToCursor.split('\n').length - 1;
    const lineHeight = 18;

    autocompleteBox.style.left = rect.left + window.scrollX + 60 + 'px';
    autocompleteBox.style.top =
      rect.top + window.scrollY + 10 + lineIndex * lineHeight + 'px';
    autocompleteBox.style.display = 'block';
  }

  function hideAutocomplete() {
    autocompleteBox.style.display = 'none';
  }

  function acceptAutocomplete() {
    if (autocompleteBox.style.display === 'none') return false;
    const selected = autocompleteBox.querySelector('.autocomplete-item.selected');
    if (!selected) return false;
    const word = getCurrentWord(codeEditor.value, codeEditor.selectionStart);
    if (!word) return false;

    const start = codeEditor.selectionStart - word.length;
    const end = codeEditor.selectionEnd;
    const insert = selected.textContent;

    codeEditor.value =
      codeEditor.value.slice(0, start) +
      insert +
      codeEditor.value.slice(end);

    const newPos = start + insert.length;
    codeEditor.selectionStart = codeEditor.selectionEnd = newPos;
    hideAutocomplete();
    onInput();
    return true;
  }

  // -----------------------------------
  // SYNTAX HIGHLIGHTING
  // -----------------------------------
  const escapeHTML = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const updateHighlighting = () => {
    const text = codeEditor.value;
    let html = '';
    try {
      // Regex-based highlighter for visual only.
      let i = 0;
      while (i < text.length) {
        let match = null;
        let matchType = '';
        let matchLength = 0;
        let matchText = '';

        const isBoundary = (idx) => {
          if (idx < 0 || idx >= text.length) return true;
          const c = text[idx];
          return /[^a-zA-Z\d\u0370-\u03ff_]/.test(c);
        };

        const keywords = [
          'ΑΛΓΟΡΙΘΜΟΣ', 'ΣΤΑΘΕΡΕΣ', 'ΔΕΔΟΜΕΝΑ', 'ΑΡΧΗ', 'ΤΕΛΟΣ',
          'ΕΑΝ', 'ΤΟΤΕ', 'ΑΛΛΙΩΣ', 'ΕΑΝ-ΤΕΛΟΣ',
          'ΓΙΑ', 'ΕΩΣ', 'ΜΕ', 'ΒΗΜΑ', 'ΕΠΑΝΑΛΑΒΕ', 'ΓΙΑ-ΤΕΛΟΣ',
          'ΕΝΟΣΩ', 'ΕΝΟΣΩ-ΤΕΛΟΣ', 'ΜΕΧΡΙ',
          'ΤΥΠΩΣΕ', 'ΔΙΑΒΑΣΕ', 'ΥΠΟΛΟΓΙΣΕ',
          'ΔΙΑΔΙΚΑΣΙΑ', 'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ',
          'ΣΥΝΑΡΤΗΣΗ', 'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ',
          'ΕΠΙΣΤΡΕΨΕ',
          'ΑΚΕΡΑΙΟΣ', 'ΠΡΑΓΜΑΤΙΚΟΣ', 'ΛΟΓΙΚΟΣ', 'ΧΑΡΑΚΤΗΡΑΣ', 'ΣΥΜΒΟΛΟΣΕΙΡΑ',
          'ALGORITHM', 'CONSTANTS', 'DATA', 'BEGIN', 'END',
          'IF', 'THEN', 'ELSE', 'END_IF',
          'FOR', 'TO', 'STEP', 'REPEAT', 'END_FOR',
          'WHILE', 'END_WHILE', 'UNTIL',
          'PRINT', 'READ', 'CALCULATE',
          'PROCEDURE', 'END_PROCEDURE',
          'FUNCTION', 'END_FUNCTION',
          'RETURN', 'INTEGER', 'REAL', 'BOOLEAN', 'CHAR', 'STRING'
        ];

        // 1. Keywords
        if (isBoundary(i - 1)) {
          for (const kw of keywords) {
            if (
              text.substr(i, kw.length).toUpperCase() === kw &&
              isBoundary(i + kw.length)
            ) {
              if (!match || kw.length > matchLength) {
                matchText = text.substr(i, kw.length);
                matchLength = kw.length;
                matchType = 'token-keyword';
                match = true;
              }
            }
          }
        }

        // 2. Comments
        const commentRegex = /\/\*[\s\S]*?\*\/|\/\/.*/y;
        commentRegex.lastIndex = i;
        let m = commentRegex.exec(text);
        if (m && (!match || m[0].length > matchLength)) {
          match = true;
          matchType = 'token-comment';
          matchText = m[0];
          matchLength = m[0].length;
        }

        // 3. Strings
        const stringRegex = /\"[^\"]*\"/y;
        stringRegex.lastIndex = i;
        m = stringRegex.exec(text);
        if (m && (!match || m[0].length > matchLength)) {
          match = true;
          matchType = 'token-string';
          matchText = m[0];
          matchLength = m[0].length;
        }

        // 4. Numbers
        const numberRegex = /\b\d+(\.\d+)?\b/y;
        numberRegex.lastIndex = i;
        m = numberRegex.exec(text);
        if (m && (!match || m[0].length > matchLength)) {
          match = true;
          matchType = 'token-number';
          matchText = m[0];
          matchLength = m[0].length;
        }

        // 5. Operators
        const operators = [
          ':=', '+', '-', '*', '/', '<>', '<=', '>=', '<', '>', '=',
          ':', ';', ',', '.', '[', ']', '(', ')'
        ];
        for (const op of operators) {
          if (text.startsWith(op, i)) {
            if (!match || op.length > matchLength) {
              match = true;
              matchType = 'token-operator';
              matchText = op;
              matchLength = op.length;
            }
          }
        }

        if (match) {
          html += `<span class="${matchType}">${escapeHTML(matchText)}</span>`;
          i += matchLength;
        } else {
          html += escapeHTML(text[i]);
          i++;
        }
      }
      if (text[text.length - 1] === '\n') {
        html += ' ';
      }
    } catch (e) {
      html = escapeHTML(text);
    }
    highlightingContent.innerHTML = html;
  };

  const updateLineNumbers = () => {
    const lines = codeEditor.value.split('\n').length;
    lineNumbers.innerHTML = Array(lines)
      .fill(0)
      .map((_, i) => i + 1)
      .map((n) => `<div class="line-num">${n}</div>`)
      .join('');
  };

  const updateProgramName = () => {
  const code = codeEditor.value;
  const panelHeader = document.querySelector('.editor-container .panel-header span');
  
  // Try to extract program name from ΑΛΓΟΡΙΘΜΟΣ declaration
  const greekMatch = code.match(/ΑΛΓΟΡΙΘΜΟΣ\s+([A-Za-zΑ-Ωα-ω_][A-Za-zΑ-Ωα-ω0-9_]*)/i);
  const englishMatch = code.match(/ALGORITHM\s+([A-Za-zΑ-Ωα-ω_][A-Za-zΑ-Ωα-ω0-9_]*)/i);
  
  const match = greekMatch || englishMatch;
  
  if (match && match[1]) {
    panelHeader.textContent = `Κώδικας Ψευδογλώσσας: ${match[1]}`;
  } else {
    panelHeader.textContent = 'Κώδικας Ψευδογλώσσας';
  }
};

  const syncScroll = () => {
    highlighting.scrollTop = codeEditor.scrollTop;
    highlighting.scrollLeft = codeEditor.scrollLeft;
    lineNumbers.scrollTop = codeEditor.scrollTop;
  };

  const onInput = () => {
    updateHighlighting();
    updateLineNumbers();
    updateProgramName();
  };

  codeEditor.addEventListener('scroll', syncScroll);

  // Initial
  updateLineNumbers();
  updateHighlighting();

  // -----------------------------------
  // KEYBOARD HANDLING: TAB + INDENT + AUTOCOMPLETE
  // -----------------------------------
 // AUTO-INDENTATION + AUTO-FORMAT HANDLER
// Replace the entire keydown event listener in app.v6.js

// Auto-format function
function autoFormatCode() {
  const code = codeEditor.value;
  const lines = code.split('\n');
  const formatted = [];
  let currentIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const trimmedUpper = trimmed.toUpperCase();

    // Skip empty lines
    if (trimmed === '') {
      formatted.push('');
      continue;
    }

    // Closing keywords: decrease indent BEFORE adding line
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

    // ΑΛΛΙΩΣ/ELSE: decrease then add line
    const isElse = 
      trimmedUpper.startsWith('ΑΛΛΙΩΣ') ||
      trimmedUpper.startsWith('ELSE');

    if (isClosing && currentIndent > 0) {
      currentIndent--;
    }

    if (isElse && currentIndent > 0) {
      currentIndent--;
    }

    // Add line with current indentation
    const indent = '  '.repeat(currentIndent);
    formatted.push(indent + trimmed);

    // Opening keywords: increase indent AFTER adding line
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

codeEditor.addEventListener('keydown', (e) => {
  const start = codeEditor.selectionStart;
  const end = codeEditor.selectionEnd;
  const value = codeEditor.value;

  // AUTO-FORMAT: Ctrl+Shift+F (or Cmd+Shift+F on Mac)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
    e.preventDefault();
    
    // Store cursor position
    const cursorPos = codeEditor.selectionStart;
    
    // Format code
    const formatted = autoFormatCode();
    codeEditor.value = formatted;
    
    // Restore cursor position (approximately)
    codeEditor.selectionStart = Math.min(cursorPos, formatted.length);
    codeEditor.selectionEnd = codeEditor.selectionStart;
    
    // Update UI
    onInput();
    
    // Show notification (optional)
    const notification = document.createElement('div');
    notification.textContent = '✓ Code formatted!';
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: var(--button-bg);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: bold;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
    
    return;
  }

  // Accept autocomplete with Enter or Tab if box visible
  if (
    (e.key === 'Enter' || e.key === 'Tab') &&
    autocompleteBox &&
    autocompleteBox.style.display === 'block'
  ) {
    const accepted = acceptAutocomplete();
    if (accepted) {
      e.preventDefault();
      return;
    }
  }

  // TAB: insert indentation
  if (e.key === 'Tab') {
    e.preventDefault();
    const insert = '  '; // 2 spaces
    codeEditor.value = value.slice(0, start) + insert + value.slice(end);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + insert.length;
    onInput();
    return;
  }

  // ENTER: auto indentation
  if (e.key === 'Enter') {
    e.preventDefault();

    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }

    // Get the current line up to cursor
    const currentLine = value.substring(lineStart, start);
    
    // Extract current indentation
    const indentMatch = currentLine.match(/^[ \t]*/);
    let indent = indentMatch ? indentMatch[0] : '';

    // Get the trimmed, uppercase version for keyword matching
    const trimmedLine = currentLine.trim().toUpperCase();

    // Check if line ends with keywords that increase indent
    const shouldIncreaseIndent = 
      trimmedLine.endsWith('ΑΡΧΗ') ||
      trimmedLine.endsWith('ΤΟΤΕ') ||
      trimmedLine.endsWith('ΑΛΛΙΩΣ') ||
      trimmedLine.endsWith('ΕΠΑΝΑΛΑΒΕ') ||
      trimmedLine.endsWith('BEGIN') ||
      trimmedLine.endsWith('THEN') ||
      trimmedLine.endsWith('ELSE') ||
      trimmedLine.endsWith('REPEAT');

    // Check if line starts with closing keywords
    const isClosingKeyword = 
      trimmedLine.startsWith('ΤΕΛΟΣ') ||
      trimmedLine.startsWith('ΕΑΝ-ΤΕΛΟΣ') ||
      trimmedLine.startsWith('ΓΙΑ-ΤΕΛΟΣ') ||
      trimmedLine.startsWith('ΕΝΟΣΩ-ΤΕΛΟΣ') ||
      trimmedLine.startsWith('ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ') ||
      trimmedLine.startsWith('ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ') ||
      trimmedLine.startsWith('END') ||
      trimmedLine.startsWith('ENDIF') ||
      trimmedLine.startsWith('ENDFOR') ||
      trimmedLine.startsWith('ENDWHILE') ||
      trimmedLine.startsWith('END_IF') ||
      trimmedLine.startsWith('END_FOR') ||
      trimmedLine.startsWith('END_WHILE') ||
      trimmedLine.startsWith('ENDPROCEDURE') ||
      trimmedLine.startsWith('ENDFUNCTION') ||
      trimmedLine.startsWith('END_PROCEDURE') ||
      trimmedLine.startsWith('END_FUNCTION');

    // Adjust indent for next line
    if (isClosingKeyword && indent.length >= 2) {
      indent = indent.substring(0, indent.length - 2);
    }

    if (shouldIncreaseIndent) {
      indent = indent + '  ';
    }

    // Insert newline with indentation
    const insertText = '\n' + indent;
    codeEditor.value = value.substring(0, start) + insertText + value.substring(end);
    
    // Position cursor
    const newPos = start + insertText.length;
    codeEditor.selectionStart = newPos;
    codeEditor.selectionEnd = newPos;

    onInput();
    return;
  }

  // Navigate autocomplete with arrows
  if (
    autocompleteBox &&
    autocompleteBox.style.display === 'block' &&
    (e.key === 'ArrowDown' || e.key === 'ArrowUp')
  ) {
    e.preventDefault();
    const items = Array.from(
      autocompleteBox.querySelectorAll('.autocomplete-item')
    );
    if (!items.length) return;
    let idx = items.findIndex((it) => it.classList.contains('selected'));
    if (idx === -1) idx = 0;
    items[idx].classList.remove('selected');
    if (e.key === 'ArrowDown') {
      idx = (idx + 1) % items.length;
    } else {
      idx = (idx - 1 + items.length) % items.length;
    }
    items[idx].classList.add('selected');
    return;
  }

  if (e.key === 'Escape') {
    hideAutocomplete();
  }
});

// Add CSS animation for notification
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

  codeEditor.addEventListener('input', () => {
    onInput();
    const word = getCurrentWord(codeEditor.value, codeEditor.selectionStart);
    showAutocomplete(word);
  });

  codeEditor.addEventListener('blur', hideAutocomplete);

  // -----------------------------------
  // EXAMPLE SELECTOR
  // -----------------------------------
  exampleSelector.addEventListener('change', (e) => {
    const key = e.target.value;
    if (EXAMPLES[key]) {
      codeEditor.value = EXAMPLES[key];
      onInput();
      updateProgramName();
    }
  });

  // -----------------------------------
  // TERMINAL EXECUTION
  // -----------------------------------
  const clearErrorHighlights = () => {
    const lineNumsEls = document.querySelectorAll('.line-num');
    lineNumsEls.forEach((el) => el.classList.remove('error-line'));
  };

  const highlightErrorLine = (errorMsg) => {
    const match =
      errorMsg.match(/Line\s+(\d+)/i) || errorMsg.match(/γραμμή\s+(\d+)/i);
    if (match) {
      const line = parseInt(match[1], 10);
      const lineElement = lineNumbers.children[line - 1];
      if (lineElement) {
        lineElement.classList.add('error-line');
      }
    }
  };

  const printToTerminal = (text, type = 'output') => {
  // Handle text with newlines
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    
    if (i > 0) {
      // This is a continuation after a newline, create new div
      const line = document.createElement('div');
      line.textContent = lineText;
      line.className = `term-${type}`;
      terminalOutput.appendChild(line);
    } else {
      // First line - check if we should append or create new
      const lastChild = terminalOutput.lastElementChild;
      if (lastChild && lastChild.className === `term-${type}` && !lastChild.dataset.complete) {
        // Append to existing line
        lastChild.textContent += lineText;
      } else {
        // Create new line
        const line = document.createElement('div');
        line.textContent = lineText;
        line.className = `term-${type}`;
        terminalOutput.appendChild(line);
      }
    }
    
    // Mark the last line as complete if text ends with newline
    if (i === lines.length - 1 && text.endsWith('\n')) {
      const lastChild = terminalOutput.lastElementChild;
      if (lastChild) {
        lastChild.dataset.complete = 'true';
      }
    }
  }
  
  scrollToBottom();
};

  const scrollToBottom = () => {
    const terminalWindow = document.getElementById('terminal-window');
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
        
        // Echo the input on its own line
        printToTerminal(val + '\n', 'input-echo');
        
        resolve(val);
      }
    };
    terminalInput.addEventListener('keydown', handleEnter);
  });

  let currentInterpreter = null;
  let isRunning = false;

  runButton.addEventListener('click', async () => {
    if (isRunning && currentInterpreter) {
      currentInterpreter.cancel();
      printToTerminal('Διακοπή εκτέλεσης από τον χρήστη...', 'info');
      return;
    }

    const pseudocode = codeEditor.value;
    clearTerminal();
    clearErrorHighlights();
    printToTerminal('Compiling...', 'info');

    isRunning = true;
    runButton.textContent = '⏹ ΔΙΑΚΟΠΗ';
    runButton.classList.add('running-stop');

    try {
      const tokens = tokenize(pseudocode);
      const parser = new Parser(tokens);
      const ast = parser.parse();
      printToTerminal('Running...', 'info');
      currentInterpreter = new Interpreter();
      currentInterpreter.setInputProvider(inputProvider);
      currentInterpreter.setOutputCallback((text) => {
        const hasNewline = text.endsWith('\n');
        const cleanText = hasNewline ? text.slice(0, -1) : text;
        printToTerminal(cleanText, 'output', hasNewline);
      });
      const result = await currentInterpreter.interpret(ast);
      if (result.error) {
        printToTerminal(`Error: ${result.error}`, 'error');
        highlightErrorLine(result.error);
      } else {
        printToTerminal('finished.', 'success');
      }
    } catch (error) {
      printToTerminal(`Error: ${error.message}`, 'error');
      highlightErrorLine(error.message);
      console.error(error);
    } finally {
      isRunning = false;
      currentInterpreter = null;
      runButton.textContent = '▶ ΕΚΤΕΛΕΣΗ';
      runButton.classList.remove('running-stop');
    }
  });

  // -----------------------------------
  // CONTROLS Save / Clear
  // -----------------------------------
  saveButton.addEventListener('click', () => {
    const code = codeEditor.value;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pseudocode.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  clearButton.addEventListener('click', () => {
    if (confirm('Καθαρισμός κώδικα;')) {
      codeEditor.value = '';
      onInput();
      exampleSelector.value = '';
    }
  });

  // --- FORMAT BUTTON: same behavior as Ctrl+Shift+F ---
const formatButton = document.getElementById('format-button');
if (formatButton) {
  formatButton.addEventListener('click', () => {
    try {
      // Save approximate cursor position
      const cursorPos = codeEditor.selectionStart;

      // Format code using the same function used by keyboard handler
      const formatted = autoFormatCode();
      codeEditor.value = formatted;

      // Restore cursor (approximate)
      const newPos = Math.min(cursorPos, formatted.length);
      codeEditor.selectionStart = codeEditor.selectionEnd = newPos;

      // Refresh highlighting / lines
      onInput();

      // Optional: show same notification used by keyboard handler
      const notification = document.createElement('div');
      notification.textContent = '✓ Code formatted!';
      notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: var(--button-bg);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.25s ease-out;
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 1600);
    } catch (err) {
      // Defensive: if something unexpectedly missing, log it
      console.error('Format button failed:', err);
      alert('Formatting failed — open console for details.');
    }
  });
}

    // -----------------------------------
    // LOAD (.eap) FILE
    // -----------------------------------
  // Complete Windows-1253 to Unicode mapping table
const WINDOWS_1253_MAP = {
  // Control characters 0x00-0x7F are standard ASCII (handled by default)
  
  // 0x80-0x9F: Windows-1253 special characters
  0x80: '\u20AC', // €
  0x82: '\u201A', // ‚
  0x83: '\u0192', // ƒ
  0x84: '\u201E', // „
  0x85: '\u2026', // …
  0x86: '\u2020', // †
  0x87: '\u2021', // ‡
  0x89: '\u2030', // ‰
  0x8B: '\u2039', // ‹
  0x8C: '\u0152', // Œ
  0x91: '\u2018', // '
  0x92: '\u2019', // '
  0x93: '\u201C', // "
  0x94: '\u201D', // "
  0x95: '\u2022', // •
  0x96: '\u2013', // –
  0x97: '\u2014', // —
  0x99: '\u2122', // ™
  0x9B: '\u203A', // ›
  0x9C: '\u0153', // œ
  
  // 0xA0-0xBF: Extended Latin and Greek diacritics
  0xA0: '\u00A0', // Non-breaking space
  0xA1: '\u0385', // ΅ (Greek Dialytika Tonos)
  0xA2: '\u0386', // Ά (Greek Capital Letter Alpha with Tonos)
  0xA3: '\u00A3', // £
  0xA4: '\u00A4', // ¤
  0xA5: '\u00A5', // ¥
  0xA6: '\u00A6', // ¦
  0xA7: '\u00A7', // §
  0xA8: '\u00A8', // ¨
  0xA9: '\u00A9', // ©
  0xAA: '\u037A', // ͺ
  0xAB: '\u00AB', // «
  0xAC: '\u00AC', // ¬
  0xAD: '\u00AD', // Soft hyphen
  0xAE: '\u00AE', // ®
  0xAF: '\u2015', // ― (Horizontal bar)
  
  0xB0: '\u00B0', // °
  0xB1: '\u00B1', // ±
  0xB2: '\u00B2', // ²
  0xB3: '\u00B3', // ³
  0xB4: '\u0384', // ΄ (Greek Tonos)
  0xB5: '\u00B5', // µ
  0xB6: '\u00B6', // ¶
  0xB7: '\u00B7', // ·
  0xB8: '\u0388', // Έ (Greek Capital Letter Epsilon with Tonos)
  0xB9: '\u0389', // Ή (Greek Capital Letter Eta with Tonos)
  0xBA: '\u038A', // Ί (Greek Capital Letter Iota with Tonos)
  0xBB: '\u00BB', // »
  0xBC: '\u038C', // Ό (Greek Capital Letter Omicron with Tonos)
  0xBD: '\u00BD', // ½
  0xBE: '\u038E', // Ύ (Greek Capital Letter Upsilon with Tonos)
  0xBF: '\u038F', // Ώ (Greek Capital Letter Omega with Tonos)
  
  // 0xC0-0xDF: Greek uppercase letters
  0xC0: '\u0390', // ΐ (Greek Small Letter Iota with Dialytika and Tonos)
  0xC1: '\u0391', // Α (Alpha)
  0xC2: '\u0392', // Β (Beta)
  0xC3: '\u0393', // Γ (Gamma)
  0xC4: '\u0394', // Δ (Delta)
  0xC5: '\u0395', // Ε (Epsilon)
  0xC6: '\u0396', // Ζ (Zeta)
  0xC7: '\u0397', // Η (Eta)
  0xC8: '\u0398', // Θ (Theta)
  0xC9: '\u0399', // Ι (Iota)
  0xCA: '\u039A', // Κ (Kappa)
  0xCB: '\u039B', // Λ (Lambda)
  0xCC: '\u039C', // Μ (Mu)
  0xCD: '\u039D', // Ν (Nu)
  0xCE: '\u039E', // Ξ (Xi)
  0xCF: '\u039F', // Ο (Omicron)
  
  0xD0: '\u03A0', // Π (Pi)
  0xD1: '\u03A1', // Ρ (Rho)
  0xD3: '\u03A3', // Σ (Sigma)
  0xD4: '\u03A4', // Τ (Tau)
  0xD5: '\u03A5', // Υ (Upsilon)
  0xD6: '\u03A6', // Φ (Phi)
  0xD7: '\u03A7', // Χ (Chi)
  0xD8: '\u03A8', // Ψ (Psi)
  0xD9: '\u03A9', // Ω (Omega)
  0xDA: '\u03AA', // Ϊ (Greek Capital Letter Iota with Dialytika)
  0xDB: '\u03AB', // Ϋ (Greek Capital Letter Upsilon with Dialytika)
  0xDC: '\u03AC', // ά (Greek Small Letter Alpha with Tonos)
  0xDD: '\u03AD', // έ (Greek Small Letter Epsilon with Tonos)
  0xDE: '\u03AE', // ή (Greek Small Letter Eta with Tonos)
  0xDF: '\u03AF', // ί (Greek Small Letter Iota with Tonos)
  
  // 0xE0-0xFF: Greek lowercase letters
  0xE0: '\u03B0', // ΰ (Greek Small Letter Upsilon with Dialytika and Tonos)
  0xE1: '\u03B1', // α (alpha)
  0xE2: '\u03B2', // β (beta)
  0xE3: '\u03B3', // γ (gamma)
  0xE4: '\u03B4', // δ (delta)
  0xE5: '\u03B5', // ε (epsilon)
  0xE6: '\u03B6', // ζ (zeta)
  0xE7: '\u03B7', // η (eta)
  0xE8: '\u03B8', // θ (theta)
  0xE9: '\u03B9', // ι (iota)
  0xEA: '\u03BA', // κ (kappa)
  0xEB: '\u03BB', // λ (lambda)
  0xEC: '\u03BC', // μ (mu)
  0xED: '\u03BD', // ν (nu)
  0xEE: '\u03BE', // ξ (xi)
  0xEF: '\u03BF', // ο (omicron)
  
  0xF0: '\u03C0', // π (pi)
  0xF1: '\u03C1', // ρ (rho)
  0xF2: '\u03C2', // ς (final sigma)
  0xF3: '\u03C3', // σ (sigma)
  0xF4: '\u03C4', // τ (tau)
  0xF5: '\u03C5', // υ (upsilon)
  0xF6: '\u03C6', // φ (phi)
  0xF7: '\u03C7', // χ (chi)
  0xF8: '\u03C8', // ψ (psi)
  0xF9: '\u03C9', // ω (omega)
  0xFA: '\u03CA', // ϊ (Greek Small Letter Iota with Dialytika)
  0xFB: '\u03CB', // ϋ (Greek Small Letter Upsilon with Dialytika)
  0xFC: '\u03CC', // ό (Greek Small Letter Omicron with Tonos)
  0xFD: '\u03CD', // ύ (Greek Small Letter Upsilon with Tonos)
  0xFE: '\u03CE', // ώ (Greek Small Letter Omega with Tonos)
};


function decodeWindows1253(bytes) {
 let result = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    
    // ASCII range (0x00-0x7F) - direct mapping
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
    }
    // Windows-1253 extended range (0x80-0xFF)
    else if (WINDOWS_1253_MAP[byte]) {
      result += WINDOWS_1253_MAP[byte];
    }
    // Undefined bytes - use replacement character or original
    else {
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
    
    // 1. Try UTF-8 first
    let decoded = tryDecodeUTF8(buffer);
    if (decoded && containsGreekKeywords(decoded)) {
      console.log('✓ Loaded as UTF-8');
      codeEditor.value = decoded;
      onInput();
      exampleSelector.value = '';
      return;
    }
    
    // 2. Try Windows-1253
    decoded = decodeWindows1253(bytes);
    if (decoded && containsGreekKeywords(decoded)) {
      console.log('✓ Loaded as Windows-1253');
      codeEditor.value = decoded;
      onInput();
      exampleSelector.value = '';
      return;
    }
    
    // 3. Failed
    alert('Το αρχείο δεν περιέχει έγκυρο πρόγραμμα.\nΔεν βρέθηκαν ΑΛΓΟΡΙΘΜΟΣ και ΑΡΧΗ.');
  };
  
  reader.onerror = () => alert('Αποτυχία ανάγνωσης αρχείου.');
  
  reader.readAsArrayBuffer(file);
});

  // -----------------------------------
  // DARK MODE
  // -----------------------------------
  const applyTheme = (isDark) => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    SettingsManager.set('theme', theme);

    const url = new URL(window.location);
    url.searchParams.set('theme', theme);
    window.history.replaceState({}, '', url);

    const homeLink = document.querySelector('.home-link');
    if (homeLink) {
      homeLink.href = `index.html?theme=${theme}`;
    }
  };

  const currentTheme =
    document.documentElement.getAttribute('data-theme') ||
    SettingsManager.get('theme', 'light');
  const isDarkMode = currentTheme === 'dark';
  applyTheme(isDarkMode);

  themeToggle.addEventListener('click', () => {
    const nowDark =
      document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(nowDark);
  });

  // -----------------------------------
  // TERMINAL RESIZING & FOCUS
  // -----------------------------------
  const MIN_TERMINAL_HEIGHT = 150; // px
  const DEFAULT_EXPANDED_HEIGHT = '40vh';
  let preferredHeight = SettingsManager.get(
    'terminalExpandedHeight',
    DEFAULT_EXPANDED_HEIGHT
  );

  const expandTerminal = () => {
    outputContainer.style.height = preferredHeight;
  };
  const collapseTerminal = () => {
    outputContainer.style.height = MIN_TERMINAL_HEIGHT + 'px';
  };

  outputContainer.style.height = preferredHeight;

  codeEditor.addEventListener('focus', collapseTerminal);
  document
    .querySelector('.editor-container')
    .addEventListener('click', collapseTerminal);
  outputContainer.addEventListener('click', expandTerminal);
  terminalInput.addEventListener('focus', expandTerminal);
  runButton.addEventListener('click', expandTerminal);

  let isResizing = false;

  dragHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const containerRect = document
      .querySelector('.container')
      .getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    const maxHeight = containerRect.height * 0.8;
    if (newHeight > 100 && newHeight < maxHeight) {
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

  // -----------------------------------
  // SYNTAX HELP
  // -----------------------------------


    // Function to create the modal structure
    function createModal(id, title, content) {
        // 1. Create the main modal container
        const modal = document.createElement('div');
        modal.setAttribute('id', id);
        modal.classList.add('modal-overlay'); // For background dimming and closing
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
            display: none; /* Hidden by default */
            justify-content: center;
            align-items: center;
            z-index: 1000; /* Ensure it's on top of other content */
        `;
        
        // 2. Create the modal content box
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');
        modalContent.style.cssText = `
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            position: relative;
        `;
        
        // 3. Create the close button
        const closeButton = document.createElement('span');
        closeButton.classList.add('modal-close');
        closeButton.innerHTML = '&times;'; // HTML entity for 'x'
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };

        // 4. Create the title
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = title;

        // 5. Create the body content
        const modalBody = document.createElement('p');
        modalBody.innerHTML = content; // Using innerHTML to allow for simple formatting

        // 6. Assemble the pieces
        modalContent.appendChild(closeButton);
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);

        // 7. Add to the document body
        document.body.appendChild(modal);
        
        return modal;
    }

    // Modal Configuration
    const modalTitle = 'Συνοπτική Βοήθεια Σύνταξης Ψευδοκώδικα';
    const modalContentHTML = `
      <h4>1. Δηλώσεις (ΔΕΔΟΜΕΝΑ / ΣΤΑΘΕΡΕΣ)</h4>
      <ul>
          <li><strong>Μεταβλητές (Απλές):</strong> <code>&lt;λίστα μεταβλητών&gt; : &lt;τύπος&gt; ;</code>
              <br>Π.χ. <code>I, J: INTEGER;</code>, <code>X : REAL;</code></li>
          <li><strong>Πίνακες (Arrays):</strong> <code>&lt;όνομα&gt; : ARRAY [&lt;αρχή&gt;..&lt;τέλος&gt;] OF &lt;τύπος&gt; ;</code>
              <br>Π.χ. <code>BATHMOS : ARRAY [1..20] OF REAL;</code></li>
          <li><strong>Σταθερές:</strong> <code>ΣΤΑΘΕΡΕΣ &lt;όνομα&gt; = &lt;τιμή&gt;</code>
              <br>Π.χ. <code>MAX_DAYS = 31</code></li>
      </ul>
      
      <h5 style="margin-top: 20px;">Επεξήγηση Τύπων Μεταβλητών:</h5>
      <table border="1" style="width: 100%; border-collapse: collapse; font-size: 0.9em; margin-bottom: 20px;">
          <thead>
              <tr style="background-color: #f2f2f2;">
                  <th style="padding: 8px;">Τύπος</th>
                  <th style="padding: 8px;">Περιγραφή</th>
                  <th style="padding: 8px;">Παράδειγμα</th>
              </tr>
          </thead>
          <tbody>
              <tr>
                  <td style="padding: 8px;"><strong>INTEGER</strong></td>
                  <td style="padding: 8px;">Ακέραιες τιμές.</td>
                  <td style="padding: 8px;"><code>I : INTEGER;</code></td>
              </tr>
              <tr>
                  <td style="padding: 8px;"><strong>REAL</strong></td>
                  <td style="padding: 8px;">Πραγματικές/Δεκαδικές τιμές.</td>
                  <td style="padding: 8px;"><code>ΒΑΘΜΟΣ : REAL;</code></td>
              </tr>
              <tr>
                  <td style="padding: 8px;"><strong>BOOLEAN</strong></td>
                  <td style="padding: 8px;">Λογικές τιμές (TRUE / FALSE).</td>
                  <td style="padding: 8px;"><code>FLAG : BOOLEAN;</code></td>
              </tr>
              <tr>
                  <td style="padding: 8px;"><strong>CHAR</strong></td>
                  <td style="padding: 8px;">Ένας μοναδικός χαρακτήρας.</td>
                  <td style="padding: 8px;"><code>KEY : CHAR;</code></td>
              </tr>
              <tr>
                  <td style="padding: 8px;"><strong>STRING</strong></td>
                  <td style="padding: 8px;">Ακολουθία χαρακτήρων (κειμένου).</td>
                  <td style="padding: 8px;"><code>ΟΝΟΜΑ : STRING;</code></td>
              </tr>
          </tbody>
      </table>
      
      <h4>2. Βασικές Εντολές</h4>
      <ul>
          <li><strong>Καταχώριση (Ανάθεση):</strong> <code>&lt;μεταβλητή&gt; := &lt;παράσταση&gt;</code>
              <br>Π.χ. <code>X := (Y + 10) / 4</code></li>
          <li><strong>Είσοδος (Input):</strong> <code>ΔΙΑΒΑΣΕ (&lt;λίστα μεταβλητών&gt;)</code>
              <br>Π.χ. <code>ΔΙΑΒΑΣΕ (ΟΝΟΜΑ, ΑΡΙΘΜΟΣ)</code></li>
          <li><strong>Έξοδος (Output):</strong> <code>ΤΥΠΩΣΕ (&lt;λίστα παραμέτρων&gt;)</code>
              <br>Π.χ. <code>ΤΥΠΩΣΕ ("ΤΟ ΑΠΟΤΕΛΕΣΜΑ ΕΙΝΑΙ: ", ΑΠ)</code></li>
      </ul>
      
      
      <h4>3. Τελεστές</h4>
      <table>
          <tr><td><strong>Αριθμητικοί</strong></td><td><code>+, -, *, /, DIV (Ακέραια), MOD (Υπόλοιπο)</code></td></tr>
          <tr><td><strong>Σύγκρισης</strong></td><td><code>=, >, >=, <, <=, <></code></td></tr>
          <tr><td><strong>Λογικοί</strong></td><td><code>NOT, OR, AND</code></td></tr>
      </table>
      
      <h4>4. Δομές Ελέγχου Ροής (Εντολές)</h4>
      
      <h5>Επιλογή (Selection)</h5>
      <pre><code><strong>ΕΑΝ</strong> &lt;συνθήκη&gt; <strong>ΤΟΤΕ</strong>
          &lt;εντολές1&gt;
      <strong>ΑΛΛΙΩΣ</strong>
          &lt;εντολές2&gt;
      <strong>ΕΑΝ-ΤΕΛΟΣ</strong></code></pre>
      
      <h5>Επανάληψη (Repetition)</h5>
      
      <h6>α) ΓΙΑ-ΕΠΑΝΑΛΑΒΕ (For Loop)</h6>
      <pre><code><strong>ΓΙΑ</strong> &lt;μτ&gt; := &lt;ατ&gt; <strong>ΕΩΣ</strong> &lt;ττ&gt; [<strong>ΜΕ ΒΗΜΑ</strong> &lt;βήμα&gt;] <strong>ΕΠΑΝΑΛΑΒΕ</strong>
          &lt;εντολές&gt;
      <strong>ΓΙΑ-ΤΕΛΟΣ</strong></code></pre>
      
      <h6>β) ΕΝΟΣΩ-ΕΠΑΝΑΛΑΒΕ (While Loop)</h6>
      <pre><code><strong>ΕΝΟΣΩ</strong> &lt;συνθήκη&gt; <strong>ΕΠΑΝΑΛΑΒΕ</strong>
          &lt;εντολές&gt;
      <strong>ΕΝΟΣΩ-ΤΕΛΟΣ</strong></code></pre>
      
      <h6>γ) ΕΠΑΝΑΛΑΒΕ-ΜΕΧΡΙ (Repeat-Until Loop)</h6>
      <pre><code><strong>ΕΠΑΝΑΛΑΒΕ</strong>
          &lt;εντολές&gt;
      <strong>ΜΕΧΡΙ</strong> &lt;συνθήκη&gt;</code></pre>
    `;
    
    // Create and insert the modal once when the script runs
    const myModal = createModal(modalId, modalTitle, modalContentHTML);

    // Event listener to show the modal when the button is clicked
    triggerButton.addEventListener('click', () => {
        myModal.style.display = 'flex'; // Change display to 'flex' to show it (centered)
    });

    // Event listener to close the modal when the user clicks anywhere outside of the content
    myModal.addEventListener('click', (event) => {
        // Check if the click occurred directly on the overlay (not on the content)
        if (event.target === myModal) {
            myModal.style.display = 'none';
        }
    });

    // Optional: Close modal with the Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && myModal.style.display === 'flex') {
            myModal.style.display = 'none';
        }
    });

});
