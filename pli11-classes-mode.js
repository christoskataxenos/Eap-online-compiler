// -----------------------------------------------------------------------------
// CodeMirror 5 Mode & Autocomplete for EAP ΠΛΗ11 Class Diagrams DSL
// -----------------------------------------------------------------------------

(function (mod) {
  if (typeof exports === 'object' && typeof module === 'object') {
    mod(require('codemirror'));
  } else if (typeof define === 'function' && define.amd) {
    define(['codemirror'], mod);
  } else {
    mod(CodeMirror);
  }
}(function (CodeMirror) {
  'use strict';

  const HOMOGLYPHS = {
    '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u0396': 'Z',
    '\u0397': 'H', '\u0399': 'I', '\u039A': 'K', '\u039C': 'M',
    '\u039D': 'N', '\u039F': 'O', '\u03A1': 'P', '\u03A4': 'T',
    '\u03A5': 'Y', '\u03A7': 'X'
  };

  function normWord(s) {
    const plain = String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\u03C2/g, '\u03A3');
    let out = '';
    for (let i = 0; i < plain.length; i++) {
      out += HOMOGLYPHS[plain[i]] || plain[i];
    }
    return out;
  }

  const KEYWORDS = new Set([
    normWord('ΚΛΑΣΗ'), normWord('ΕΠΕΚΤΕΙΝΕΙ'), normWord('ΚΛΗΡΟΝΟΜΕΙ'),
    normWord('ΚΑΤΗΓΟΡΗΜΑΤΑ'), normWord('ΙΔΙΟΤΗΤΕΣ'),
    normWord('ΜΕΘΟΔΟΙ'), normWord('ΛΕΙΤΟΥΡΓΙΕΣ'),
    normWord('ΤΕΛΟΣ'), normWord('ΤΕΛΟΣ_ΚΛΑΣΗΣ'),
    normWord('ΣΧΕΣΕΙΣ'),
    normWord('ΣΥΣΧΕΤΙΣΗ'), normWord('ΣΥΝΑΡΜΟΓΗ'), normWord('ΣΥΝΘΕΣΗ'),
    normWord('ΚΛΗΡΟΝΟΜΙΚΟΤΗΤΑ'), normWord('ΚΛΗΡΟΝΟΜΗΣΗ'), normWord('ΕΞΑΡΤΗΣΗ'),
    'CLASS', 'EXTENDS', 'INHERITS', 'ATTRIBUTES', 'METHODS',
    'END', 'END_CLASS', 'RELATIONS', 'RELATIONSHIPS',
    'ASSOCIATION', 'AGGREGATION', 'COMPOSITION', 'INHERITANCE', 'DEPENDENCY'
  ]);

  const VISIBILITIES = new Set([
    'PUBLIC', 'PRIVATE', 'PROTECTED',
    normWord('ΔΗΜΟΣΙΟ'), normWord('ΙΔΙΩΤΙΚΟ'), normWord('ΠΡΟΣΤΑΤΕΥΜΕΝΟ')
  ]);

  const TYPES = new Set([
    'INTEGER', 'INT', 'REAL', 'FLOAT', 'DOUBLE', 'NUMBER', 'STRING', 'CHAR',
    'BOOLEAN', 'BOOL', 'DATE', 'DATETIME', 'VOID',
    normWord('ΑΚΕΡΑΙΟΣ'), normWord('ΠΡΑΓΜΑΤΙΚΟΣ'), normWord('ΧΑΡΑΚΤΗΡΑΣ'),
    normWord('ΣΥΜΒΟΛΟΣΕΙΡΑ'), normWord('ΛΟΓΙΚΗ'), normWord('ΗΜΕΡΟΜΗΝΙΑ')
  ]);

  const BUILTINS = new Set([normWord('ΔΗΜΙΟΥΡΓΟΣ')]);

  CodeMirror.defineMode('eap-pli11-classes', function () {
    return {
      startState: function () {
        return { tokenize: null };
      },

      token: function (stream, state) {
        if (state.tokenize) return state.tokenize(stream, state);
        if (stream.eatSpace()) return null;

        const ch = stream.peek();

        if (stream.match('//')) {
          stream.skipToEnd();
          return 'comment';
        }

        if (stream.match('/*')) {
          state.tokenize = function (s, st) {
            while (!s.eol()) {
              if (s.match('*/')) {
                st.tokenize = null;
                break;
              }
              s.next();
            }
            return 'comment';
          };
          return state.tokenize(stream, state);
        }

        // Quotes (strings or quoted multiplicities)
        if (ch === '"' || ch === "'") {
          const closeCh = ch;
          stream.next();
          state.tokenize = function (s, st) {
            while (!s.eol()) {
              if (s.next() === closeCh) {
                st.tokenize = null;
                break;
              }
            }
            return 'string';
          };
          return state.tokenize(stream, state);
        }

        // Inline label [...]
        if (ch === '[') {
          stream.next();
          while (!stream.eol()) {
            if (stream.next() === ']') break;
          }
          return 'string';
        }

        // Relationship operators (longest match first)
        if (
          stream.match('<*>--') || stream.match('--<*>') ||
          stream.match('<>--') || stream.match('--<>') ||
          stream.match('*--') || stream.match('--*') ||
          stream.match('o--') || stream.match('--o') ||
          stream.match('<|--') || stream.match('--|>') ||
          stream.match('..>') || stream.match('<..') ||
          stream.match('-->') || stream.match('--') || stream.match('->') ||
          stream.match('::')
        ) {
          return 'operator';
        }

        // Leading visibility symbols +, -, #
        if (stream.sol() || /\s/.test(stream.string.charAt(stream.pos - 1) || ' ')) {
          if (ch === '+' || ch === '-' || ch === '#') {
            stream.next();
            return 'variable-2';
          }
        }

        if (stream.match(/^[0-9]+(\.\.\*|\.\.[0-9NnMmKk]+)?/)) {
          return 'number';
        }

        if (/[:;,.(){}]/.test(ch)) {
          stream.next();
          return 'punctuation';
        }

        if (stream.match(/^[\u0370-\u03ff\u1f00-\u1fffA-Za-z_][\u0370-\u03ff\u1f00-\u1fffA-Za-z0-9_\-]*/)) {
          const w = normWord(stream.current());
          if (KEYWORDS.has(w)) return 'keyword';
          if (VISIBILITIES.has(w)) return 'variable-2';
          if (TYPES.has(w)) return 'atom';
          if (BUILTINS.has(w)) return 'builtin';
          return 'variable';
        }

        stream.next();
        return null;
      },

      lineComment: '//',
      blockCommentStart: '/*',
      blockCommentEnd: '*/'
    };
  });

  const STATIC_HINTS = [
    { text: 'ΚΛΑΣΗ Όνομα\n  ΚΑΤΗΓΟΡΗΜΑΤΑ\n    πεδίο;\nΤΕΛΟΣ', displayText: 'ΚΛΑΣΗ <Όνομα> ... ΤΕΛΟΣ' },
    { text: 'ΚΛΑΣΗ Υποκλάση ΕΠΕΚΤΕΙΝΕΙ Υπερκλάση\n  ΚΑΤΗΓΟΡΗΜΑΤΑ\n    πεδίο;\nΤΕΛΟΣ', displayText: 'ΚΛΑΣΗ ... ΕΠΕΚΤΕΙΝΕΙ ...' },
    { text: 'ΚΑΤΗΓΟΡΗΜΑΤΑ', displayText: 'ΚΑΤΗΓΟΡΗΜΑΤΑ' },
    { text: 'ΜΕΘΟΔΟΙ', displayText: 'ΜΕΘΟΔΟΙ' },
    { text: 'ΕΠΕΚΤΕΙΝΕΙ ', displayText: 'ΕΠΕΚΤΕΙΝΕΙ' },
    { text: 'ΤΕΛΟΣ', displayText: 'ΤΕΛΟΣ' },
    { text: 'ΣΧΕΣΕΙΣ\n  ', displayText: 'ΣΧΕΣΕΙΣ (ενότητα)' },
    { text: 'PRIVATE ', displayText: 'PRIVATE (Ορατότητα -)' },
    { text: 'PUBLIC ', displayText: 'PUBLIC (Ορατότητα +)' },
    { text: 'PROTECTED ', displayText: 'PROTECTED (Ορατότητα #)' },
    { text: 'PUBLIC ΔΗΜΙΟΥΡΓΟΣ();', displayText: 'PUBLIC ΔΗΜΙΟΥΡΓΟΣ()' },
    { text: 'String', displayText: 'String' },
    { text: 'Number', displayText: 'Number' },
    { text: 'INTEGER', displayText: 'INTEGER' },
    { text: 'Date', displayText: 'Date' },
    { text: 'Boolean', displayText: 'Boolean' },
    { text: '(1) -- (0..*)  : ', displayText: 'Συσχέτιση: (1) -- (0..*) : ετικέτα' },
    { text: '(1) <>-- (1..*) ', displayText: 'Συναρμογή: (1) <>-- (1..*)' },
    { text: '(1) *-- (1..*) ', displayText: 'Σύνθεση: (1) *-- (1..*)' },
    { text: ' --|> ', displayText: 'Κληρονομικότητα: Υποκλάση --|> Υπερκλάση' },
    { text: ' ..> ', displayText: 'Εξάρτηση: Πελάτης ..> Προμηθευτής' }
  ];

  CodeMirror.registerHelper('hint', 'eap-pli11-classes', function (editor) {
    const cursor = editor.getCursor();
    const token = editor.getTokenAt(cursor);
    const curWord = token.string.trim();
    const start = CodeMirror.Pos(cursor.line, token.start);
    const end = CodeMirror.Pos(cursor.line, cursor.ch);

    // Collect declared class names from the document
    const classHints = [];
    const seen = new Set();
    const lines = editor.getValue().split('\n');
    for (const ln of lines) {
      const m = ln.trim().match(/^(?:ΚΛΑΣΗ|CLASS)\s+([^\s{:(]+(?:\s+[^\s{:(]+)*?)(?:\s+(?:ΕΠΕΚΤΕΙΝΕΙ|ΚΛΗΡΟΝΟΜΕΙ|EXTENDS|INHERITS)\s+.*)?$/i);
      if (m && m[1]) {
        const clsName = m[1].trim();
        if (clsName && !seen.has(clsName)) {
          seen.add(clsName);
          classHints.push({ text: clsName, displayText: `${clsName} (Κλάση)` });
        }
      }
    }

    const needle = normWord(curWord);
    const list = [...classHints, ...STATIC_HINTS].filter((item) => {
      if (!needle) return true;
      return normWord(item.displayText).includes(needle) || normWord(item.text).includes(needle);
    });

    return {
      list,
      from: curWord ? start : cursor,
      to: end
    };
  });
}));
