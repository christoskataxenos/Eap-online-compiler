// -----------------------------------------------------------------------------
// CodeMirror Mode & Autocomplete for EAP ΠΛΗ11 Pseudocode (Τεχνολογία Λογισμικού)
// -----------------------------------------------------------------------------

(function (mod) {
  if (typeof exports === 'object' && typeof module === 'object') {
    mod(require('codemirror'));
  } else if (typeof define === 'function' && define.amd) {
    define(['codemirror'], mod);
  } else {
    mod(CodeMirror);
  }
})(function (CodeMirror) {
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
    'PROCEDURE', 'END_PROCEDURE', 'FUNCTION', 'END_FUNCTION', 'END',
    'LOCAL', 'GLOBAL', 'VAR', 'CALL',
    'IF', 'THEN', 'ELSE', 'END_IF', 'ENDIF',
    'CASE', 'OF', 'OTHERWISE', 'END_CASE', 'ENDCASE',
    'WHILE', 'DO', 'END_WHILE', 'ENDWHILE',
    'REPEAT', 'UNTIL',
    'FOR', 'FROM', 'TO', 'STEP', 'END_FOR', 'ENDFOR'
  ]);

  const DIRECTIONS = new Set(['IN', 'OUT', 'IN/OUT']);

  const BUILTINS = new Set([
    normWord('ΑΡΧΙΚΟΠΟΙΗΣΕ'),
    normWord('ΑΡΧΙΚΟΠΟΙΗΣΗ'),
    normWord('ΥΠΟΛΟΓΙΣΕ'),
    normWord('ΕΠΕΞΕΡΓΑΣΟΥ'),
    normWord('ΔΙΑΒΑΣΕ'),
    normWord('ΑΝΑΓΝΩΣΕ'),
    normWord('ΓΡΑΨΕ'),
    normWord('ΕΜΦΑΝΙΣΕ'),
    normWord('ΤΥΠΩΣΕ'),
    normWord('ΑΠΟΘΗΚΕΥΣΕ'),
    normWord('ΚΑΤΑΧΩΡΙΣΕ'),
    'INITIALIZE', 'INIT'
  ]);

  const ATOMS = new Set([
    normWord('ΚΕΝΟ'), 'NULL', 'TRUE', 'FALSE',
    normWord('ΑΛΗΘΗΣ'), normWord('ΨΕΥΔΗΣ')
  ]);

  const OPERATOR_WORDS = new Set([
    'AND', 'OR', 'NOT', 'DIV', 'MOD',
    normWord('ΚΑΙ'), normWord('Ή'), normWord('ΟΧΙ')
  ]);

  CodeMirror.defineMode('eap-pli11', function () {
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

        if (ch === '"' || ch === "'" || ch === '\u00AB') {
          const closeCh = ch === '\u00AB' ? '\u00BB' : ch;
          stream.next();
          state.tokenize = function (s, st) {
            while (!s.eol()) {
              const c = s.next();
              if (c === closeCh) {
                st.tokenize = null;
                break;
              }
            }
            return 'string';
          };
          return state.tokenize(stream, state);
        }

        if (stream.match(/^[0-9]+(\.[0-9]+)?/)) {
          return 'number';
        }

        if (stream.match(':=') || stream.match(':-') || stream.match('<=') || stream.match('>=') || stream.match('<>') || stream.match('IN/OUT') || stream.match('ΙΝ/ΟUΤ')) {
          if (stream.current().includes('/')) return 'variable-2';
          return 'operator';
        }

        if (/[+\-*\/=<>^]/.test(ch)) {
          stream.next();
          return 'operator';
        }

        if (/[:;,.()]/.test(ch)) {
          stream.next();
          return 'punctuation';
        }

        if (stream.match(/^[\u0370-\u03ff\u1f00-\u1fffA-Za-z_][\u0370-\u03ff\u1f00-\u1fffA-Za-z0-9_']*/)) {
          const w = normWord(stream.current());
          if (KEYWORDS.has(w)) return 'keyword';
          if (DIRECTIONS.has(w)) return 'variable-2';
          if (BUILTINS.has(w)) return 'builtin';
          if (ATOMS.has(w)) return 'atom';
          if (OPERATOR_WORDS.has(w)) return 'operator';
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

  const SNIPPETS = [
    { text: 'PROCEDURE Exec_M1\n  LOCAL VAR ;\n  ΑΡΧΙΚΟΠΟΙΗΣΕ ;\n  \nEND_PROCEDURE;', displayText: 'PROCEDURE <όνομα> ... END_PROCEDURE' },
    { text: 'LOCAL VAR ', displayText: 'LOCAL VAR <λίστα μεταβλητών>;' },
    { text: 'GLOBAL VAR ', displayText: 'GLOBAL VAR <λίστα μεταβλητών>;' },
    { text: 'ΑΡΧΙΚΟΠΟΙΗΣΕ ', displayText: 'ΑΡΧΙΚΟΠΟΙΗΣΕ <μεταβλητές>;' },
    { text: 'CALL ', displayText: 'CALL <μονάδα>(<παράμετροι>);' },
    { text: ': IN', displayText: ': IN (Είσοδος)' },
    { text: ': IN/OUT', displayText: ': IN/OUT (Έξοδος / Ενημέρωση)' },
    { text: 'CASE flag OF\n  (E1): CALL Exec_M4(E1);\n  (E2): CALL Exec_M5(E2);\nEND_CASE;', displayText: 'CASE <flag> OF ... END_CASE;' },
    { text: 'IF (A <> κενό) THEN\n  \nEND_IF;', displayText: 'IF <συνθήκη> THEN ... END_IF;' },
    { text: 'WHILE (A <> κενό) DO\n  \nEND_WHILE;', displayText: 'WHILE <συνθήκη> DO ... END_WHILE;' },
    { text: 'REPEAT\n  \nUNTIL ', displayText: 'REPEAT ... UNTIL <συνθήκη>' },
    { text: 'FOR i FROM 1 TO N STEP 1 DO\n  \nEND_FOR;', displayText: 'FOR i FROM 1 TO N STEP 1 DO ... END_FOR;' },
    { text: 'END_PROCEDURE;', displayText: 'END_PROCEDURE;' },
    { text: 'PROCEDURE Get_A(A: IN/OUT)\n  Διάβασε το δεδομένο Α από την Αποθήκη 1;\nEND_PROCEDURE;', displayText: 'PROCEDURE Get_A(A: IN/OUT) [Πρότυπο]' },
    { text: 'PROCEDURE Calc_M1(A: IN, B: IN/OUT)\n  Υπολόγισε το Β βάσει του Α;\nEND_PROCEDURE;', displayText: 'PROCEDURE Calc_M1(...) [Πρότυπο]' },
    { text: 'PROCEDURE Put_B(B: IN)\n  ΕΜΦΑΝΙΣΕ το δεδομένο Β στην εξωτερική οντότητα «Αποδέκτης 1»;\nEND_PROCEDURE;', displayText: 'PROCEDURE Put_B(B: IN) [Πρότυπο]' }
  ];

  CodeMirror.registerHelper('hint', 'eap-pli11', function (cm) {
    const cur = cm.getCursor();
    const token = cm.getTokenAt(cur);
    const prefix = token.string || '';
    const cleanPrefix = normWord(prefix);

    const docText = cm.getValue();
    const identRegex = /[\u0370-\u03ff\u1f00-\u1fffA-Za-z_][\u0370-\u03ff\u1f00-\u1fffA-Za-z0-9_]*/g;
    const localIdents = new Set();
    let m;
    while ((m = identRegex.exec(docText)) !== null) {
      const w = m[0];
      const cw = normWord(w);
      if (!KEYWORDS.has(cw) && !DIRECTIONS.has(cw) && !BUILTINS.has(cw) && !ATOMS.has(cw) && !OPERATOR_WORDS.has(cw)) {
        localIdents.add(w);
      }
    }

    const list = [];
    for (const item of SNIPPETS) {
      const key = normWord(item.text.trim());
      if (!cleanPrefix || key.startsWith(cleanPrefix)) {
        list.push(item);
      }
    }
    for (const id of localIdents) {
      if (normWord(id).startsWith(cleanPrefix)) {
        list.push({ text: id, displayText: id + ' (όνομα)' });
      }
    }

    if (list.length === 0) return null;
    return {
      list,
      from: CodeMirror.Pos(cur.line, token.start),
      to: CodeMirror.Pos(cur.line, token.end)
    };
  });
});
