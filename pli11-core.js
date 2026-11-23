// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 Pseudocode Compiler, EAP Validator, ΔΔΠ/ΔΡΔ Analyzer & DFD Builder
// Supports Σχήμα 4.28, PLH11_OSS2_DDP_PseudoCode, and GE1/OE1 conventions.
// UMD module: Browser window.PLI11Core / Node module.exports
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PLI11Core = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. UNICODE & GREEK/LATIN HOMOGLYPH NORMALIZATION
  // ---------------------------------------------------------------------------
  const HOMOGLYPH_TO_LATIN = {
    '\u0391': 'A', // Α -> A
    '\u0392': 'B', // Β -> B
    '\u0395': 'E', // Ε -> E
    '\u0396': 'Z', // Ζ -> Z
    '\u0397': 'H', // Η -> H
    '\u0399': 'I', // Ι -> I
    '\u039A': 'K', // Κ -> K
    '\u039C': 'M', // Μ -> M
    '\u039D': 'N', // Ν -> N
    '\u039F': 'O', // Ο -> O
    '\u03A1': 'P', // Ρ -> P
    '\u03A4': 'T', // Τ -> T
    '\u03A5': 'Y', // Υ -> Y
    '\u03A7': 'X'  // Χ -> X
  };

  function stripAccents(str) {
    return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function toUpperPlain(str) {
    return stripAccents(str).toUpperCase().replace(/\u03C2/g, '\u03A3');
  }

  function normalizeId(str) {
    const upper = toUpperPlain(str).trim();
    let out = '';
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i];
      out += HOMOGLYPH_TO_LATIN[ch] || ch;
    }
    return out;
  }

  function sanitizeMermaidId(str, prefix = 'N') {
    const norm = normalizeId(str).replace(/[^A-Z0-9_]/g, (m) => '_' + m.charCodeAt(0).toString(16));
    return prefix + '_' + (norm || 'X');
  }

  // Known canonical keywords (normalized via normalizeId so Greek/Latin homoglyphs match too)
  const KW = {
    PROCEDURE: 'PROCEDURE',
    END_PROCEDURE: 'END_PROCEDURE',
    FUNCTION: 'FUNCTION',
    END_FUNCTION: 'END_FUNCTION',
    LOCAL: 'LOCAL',
    GLOBAL: 'GLOBAL',
    VAR: 'VAR',
    CALL: 'CALL',
    IF: 'IF',
    THEN: 'THEN',
    ELSE: 'ELSE',
    END_IF: 'END_IF',
    ENDIF: 'ENDIF',
    CASE: 'CASE',
    OF: 'OF',
    OTHERWISE: 'OTHERWISE',
    END_CASE: 'END_CASE',
    ENDCASE: 'ENDCASE',
    WHILE: 'WHILE',
    DO: 'DO',
    END_WHILE: 'END_WHILE',
    ENDWHILE: 'ENDWHILE',
    REPEAT: 'REPEAT',
    UNTIL: 'UNTIL',
    FOR: 'FOR',
    FROM: 'FROM',
    TO: 'TO',
    STEP: 'STEP',
    END_FOR: 'END_FOR',
    ENDFOR: 'ENDFOR',
    END: 'END',
    IN: 'IN',
    OUT: 'OUT',
    INIT1: 'ΑΡΧΙΚΟΠΟΙΗΣΕ',
    INIT2: 'ΑΡΧΙΚΟΠΟΙΗΣΗ',
    INIT3: 'INITIALIZE',
    INIT4: 'INIT'
  };

  const KW_INIT_SET = new Set([
    normalizeId('ΑΡΧΙΚΟΠΟΙΗΣΕ'),
    normalizeId('ΑΡΧΙΚΟΠΟΙΗΣΗ'),
    'INITIALIZE',
    'INIT'
  ]);

  const LOGICAL_NOISE_WORDS = new Set([
    'AND', 'OR', 'NOT', 'DIV', 'MOD', 'TRUE', 'FALSE', 'NULL',
    'KAI', 'H', 'OXI', 'KENO', 'ΑΛΗΘΗΣ', 'ΨΕΥΔΗΣ', 'ΚΕΝΟ',
    normalizeId('ΚΑΙ'), normalizeId('Ή'), normalizeId('ΟΧΙ'), normalizeId('ΚΕΝΟ'),
    normalizeId('ΑΛΗΘΗΣ'), normalizeId('ΨΕΥΔΗΣ')
  ]);

  const VERBAL_STARTERS = new Set([
    normalizeId('ΥΠΟΛΟΓΙΣΕ'),
    normalizeId('ΕΠΕΞΕΡΓΑΣΟΥ'),
    normalizeId('ΔΙΑΒΑΣΕ'),
    normalizeId('ΑΝΑΓΝΩΣΕ'),
    normalizeId('ΓΡΑΨΕ'),
    normalizeId('ΕΜΦΑΝΙΣΕ'),
    normalizeId('ΤΥΠΩΣΕ'),
    normalizeId('ΑΠΟΘΗΚΕΥΣΕ'),
    normalizeId('ΚΑΤΑΧΩΡΙΣΕ'),
    normalizeId('ΚΑΤΑΧΩΡΗΣΕ'),
    normalizeId('ΠΗΓΑΙΝΕ'),
    normalizeId('ΑΛΛΑΞΕ'),
    normalizeId('ΠΑΡΕ'),
    normalizeId('ΕΠΕΣΤΡΕΨΕ'),
    normalizeId('ΣΤΕΙΛΕ'),
    'READ', 'WRITE', 'PRINT', 'DISPLAY', 'COMPUTE', 'CALCULATE', 'PROCESS', 'STORE'
  ]);

  // ---------------------------------------------------------------------------
  // 2. LEXER
  // ---------------------------------------------------------------------------
  function isIdentStart(ch) {
    return /[A-Za-z_\u0370-\u03ff\u1f00-\u1fff]/.test(ch);
  }

  function isIdentPart(ch) {
    return /[A-Za-z0-9_\u0370-\u03ff\u1f00-\u1fff]/.test(ch);
  }

  function tokenizePLI11(source) {
    const src = String(source || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const tokens = [];
    const comments = [];
    const lexErrors = [];

    let i = 0;
    let line = 1;
    let col = 1;

    while (i < src.length) {
      const ch = src[i];

      if (ch === ' ' || ch === '\t' || ch === '\u00A0') {
        i++;
        col++;
        continue;
      }

      if (ch === '\n') {
        tokens.push({ type: 'NEWLINE', value: '\n', line, col });
        i++;
        line++;
        col = 1;
        continue;
      }

      // Block comments /* ... */
      if (ch === '/' && src[i + 1] === '*') {
        const startLine = line;
        i += 2;
        col += 2;
        let text = '';
        let closed = false;
        while (i < src.length) {
          if (src[i] === '*' && src[i + 1] === '/') {
            i += 2;
            col += 2;
            closed = true;
            break;
          }
          if (src[i] === '\n') {
            text += '\n';
            line++;
            col = 1;
          } else {
            text += src[i];
            col++;
          }
          i++;
        }
        comments.push({ text: text.trim(), startLine, endLine: line });
        if (!closed) {
          lexErrors.push({ line: startLine, message: 'Μη κλεισμένο σχόλιο μπλοκ (/* ... */).' });
        }
        continue;
      }

      // Line comments // ...
      if (ch === '/' && src[i + 1] === '/') {
        const startLine = line;
        i += 2;
        col += 2;
        let text = '';
        while (i < src.length && src[i] !== '\n') {
          text += src[i++];
          col++;
        }
        comments.push({ text: text.trim(), startLine, endLine: startLine });
        continue;
      }

      // Quoted strings: "...", '...', «...»
      if (ch === '"' || ch === "'" || ch === '\u00AB') {
        const startLine = line;
        const startCol = col;
        const closeCh = ch === '\u00AB' ? '\u00BB' : ch;
        i++;
        col++;
        let val = '';
        while (i < src.length && src[i] !== closeCh && src[i] !== '\n') {
          if (src[i] === '\\' && i + 1 < src.length) {
            val += src[i + 1];
            i += 2;
            col += 2;
          } else {
            val += src[i++];
            col++;
          }
        }
        if (i < src.length && src[i] === closeCh) {
          i++;
          col++;
        }
        tokens.push({ type: 'STRING', value: val, raw: ch + val + closeCh, line: startLine, col: startCol });
        continue;
      }

      // Two-char operators
      const two = src.slice(i, i + 2);
      if (two === ':=' || two === ':-' || two === '<>' || two === '<=' || two === '>=' || two === '!=') {
        tokens.push({ type: 'OP', value: two, line, col });
        i += 2;
        col += 2;
        continue;
      }

      // Single punctuation & operators
      if (ch === '(') { tokens.push({ type: 'LPAREN', value: '(', line, col }); i++; col++; continue; }
      if (ch === ')') { tokens.push({ type: 'RPAREN', value: ')', line, col }); i++; col++; continue; }
      if (ch === ':') { tokens.push({ type: 'COLON', value: ':', line, col }); i++; col++; continue; }
      if (ch === ';') { tokens.push({ type: 'SEMI', value: ';', line, col }); i++; col++; continue; }
      if (ch === ',') { tokens.push({ type: 'COMMA', value: ',', line, col }); i++; col++; continue; }
      if (ch === '/') { tokens.push({ type: 'SLASH', value: '/', line, col }); i++; col++; continue; }
      if (ch === '.') { tokens.push({ type: 'DOT', value: '.', line, col }); i++; col++; continue; }
      if ('=<>+-*^'.includes(ch)) {
        tokens.push({ type: 'OP', value: ch, line, col });
        i++;
        col++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(ch)) {
        const startCol = col;
        let num = '';
        while (i < src.length && /[0-9]/.test(src[i])) {
          num += src[i++];
          col++;
        }
        if (src[i] === '.' && /[0-9]/.test(src[i + 1] || '')) {
          num += src[i++];
          col++;
          while (i < src.length && /[0-9]/.test(src[i])) {
            num += src[i++];
            col++;
          }
        }
        tokens.push({ type: 'NUMBER', value: num, line, col: startCol });
        continue;
      }

      // Identifiers & Keywords (Greek/Latin letters, digits, _, plus optional apostrophe like A')
      if (isIdentStart(ch)) {
        const startCol = col;
        let word = '';
        while (i < src.length && isIdentPart(src[i])) {
          word += src[i++];
          col++;
        }
        if (src[i] === "'" || src[i] === '\u2019') {
          word += "'";
          i++;
          col++;
        }
        tokens.push({
          type: 'WORD',
          value: word,
          norm: normalizeId(word),
          plain: toUpperPlain(word),
          line,
          col: startCol
        });
        continue;
      }

      // Any other symbol (e.g., bullets, brackets) - preserve as SYMBOL
      tokens.push({ type: 'SYMBOL', value: ch, line, col });
      i++;
      col++;
    }

    tokens.push({ type: 'EOF', value: '', line, col });
    return { tokens, comments, lexErrors };
  }

  // ---------------------------------------------------------------------------
  // 3. PARSER
  // ---------------------------------------------------------------------------
  function extractIOMetaFromTexts(texts) {
    const joined = texts.filter(Boolean).join(' \n ');
    if (!joined.trim()) return { ioKind: 'UNKNOWN', ioTarget: null, directionHint: null };

    const plainLower = stripAccents(joined).toLowerCase();
    let directionHint = null;
    if (/(?:διαβασε|αναγνωσε|ληψη|read\b|get\b|ανακτησε)/.test(plainLower)) {
      directionHint = 'read';
    } else if (/(?:γραψε|εμφανισε|τυπωσε|αποθηκευσε|καταχωρισε|καταχωρησε|εκτυπωσε|write|print|display|store|put)/.test(plainLower)) {
      directionHint = 'write';
    }

    // Check Data Store keywords first
    const storePatterns = [
      /(?:αποθ[ηή]κη\s*(?:δεδομ[εέ]νων)?\s*[:«"]?\s*([A-Za-zΑ-Ωα-ωάέήίόύώΐΰ0-9_\-]+(?:\s+[A-Za-zΑ-Ωα-ωάέήίόύώΐΰ0-9_\-]+){0,2}))/i,
      /(?:αρχε[ιί]ο\s*[:«"]?\s*([A-Za-zΑ-Ωα-ωάέήίόύώΐΰ0-9_\-]+(?:\s+[A-Za-zΑ-Ωα-ωάέήίόύώΐΰ0-9_\-]+){0,2}))/i,
      /\b((?:ΑΔ|AD|DB)\s*[0-9]+)\b/i
    ];
    for (const pat of storePatterns) {
      const m = joined.match(pat);
      if (m && m[1]) {
        const cleanName = m[1].replace(/[»".,;:\s]+$/, '').trim();
        // Rebuild clean label
        if (/^(?:ΑΔ|AD|DB)/i.test(cleanName)) {
          return { ioKind: 'DATA_STORE', ioTarget: cleanName.replace(/\s+/g, ''), directionHint };
        }
        const prefix = /αρχε/i.test(m[0]) ? 'Αρχείο ' : 'Αποθήκη ';
        // Remove trailing clause words like "το A"
        const trimmedTarget = cleanName.replace(/\s+(?:το|τα|τη|την|τον|του|της|με|από|στην|στο)$/i, '').trim();
        return {
          ioKind: 'DATA_STORE',
          ioTarget: (prefix + trimmedTarget).trim(),
          directionHint
        };
      }
    }

    // Check External Entity / Source / Sink keywords
    const extPatterns = [
      /εξωτερικ[ηή]\s+οντ[οό]τητα\s*(?:\((?:πηγ[ηή]|αποδ[εέ]κτης)\))?\s*[«"]?([^»"\n.;]+)/i,
      /(?:πηγ[ηή]|αποδ[εέ]κτ[ηή]ς?)\s*(?:δεδομ[εέ]νων)?\s*[«":]?\s*([A-Za-zΑ-Ωα-ωάέήίόύώΐΰ0-9_\-]+(?:\s+[A-Za-zΑ-Ωα-ωάέήίόύώΐΰ0-9_\-]+){0,2})/i,
      /(?:στον|στο|απ[οό]\s+τ(?:ον|ο))\s+(χρ[ηή]στη(?:\s+[A-Za-zΑ-Ωα-ω0-9_\-]+)?|οθ[οό]νη|εκτυπωτ[ηή]|τερματικ[οό])/i
    ];
    for (const pat of extPatterns) {
      const m = joined.match(pat);
      if (m && m[1]) {
        let name = m[1].replace(/[»".,;:\s]+$/, '').trim();
        name = name.replace(/\s+(?:το|τα|τη|την|τον|του|της)$/i, '').trim();
        if (/^(?:πηγ|αποδ)/i.test(stripAccents(m[0])) && !/πηγ|αποδ/i.test(stripAccents(name))) {
          const isSrc = /^πηγ/i.test(stripAccents(m[0]));
          name = (isSrc ? 'Πηγή ' : 'Αποδέκτης ') + name;
        }
        return { ioKind: 'EXTERNAL_ENTITY', ioTarget: name, directionHint };
      }
    }

    if (/(?:χρηστ|οθον|εκτυπωτ|τερματικ|εμφανισ|τυπωσ|user|screen|printer)/.test(plainLower)) {
      const target = /οθον/.test(plainLower) ? 'Οθόνη'
        : /εκτυπωτ/.test(plainLower) ? 'Εκτυπωτής'
        : 'Χρήστης';
      return { ioKind: 'EXTERNAL_ENTITY', ioTarget: target, directionHint };
    }

    if (/(?:βασ[ηε]|file|αρχει|αποθηκ)/.test(plainLower)) {
      return { ioKind: 'DATA_STORE', ioTarget: 'Αποθήκη', directionHint };
    }

    return { ioKind: 'UNKNOWN', ioTarget: null, directionHint };
  }

  function parsePLI11(source) {
    const { tokens, comments, lexErrors } = tokenizePLI11(source);
    const errors = lexErrors.map((e) => ({
      severity: 'error',
      code: 'E01_SYNTAX',
      line: e.line,
      procName: null,
      message: e.message
    }));

    // Track identifier spellings for homoglyph normalization notice
    const spellingVariants = new Map(); // canonical -> Set of plain uppercase spellings
    const displayNames = new Map();     // canonical -> first raw spelling

    function recordIdent(raw, plain) {
      if (!raw) return;
      const canon = normalizeId(raw);
      if (!displayNames.has(canon)) displayNames.set(canon, raw);
      if (!spellingVariants.has(canon)) spellingVariants.set(canon, new Set());
      spellingVariants.get(canon).add(plain || toUpperPlain(raw));
    }

    let pos = 0;

    function peek(offset = 0) {
      const idx = pos + offset;
      return idx < tokens.length ? tokens[idx] : tokens[tokens.length - 1];
    }

    function skipNewlines() {
      while (peek().type === 'NEWLINE') pos++;
    }

    function skipNewlinesAndSemis() {
      while (peek().type === 'NEWLINE' || peek().type === 'SEMI') pos++;
    }

    function consumeSemicolonIfPresent() {
      if (peek().type === 'SEMI') {
        pos++;
        return true;
      }
      return false;
    }

    function consumeStatementEnd() {
      let hadSemi = false;
      while (peek().type === 'SEMI') {
        hadSemi = true;
        pos++;
      }
      if (peek().type === 'NEWLINE') {
        pos++;
      }
      return hadSemi;
    }

    function isKeyword(tok, normKw) {
      return tok && tok.type === 'WORD' && tok.norm === normKw;
    }

    function matchCompoundEnd(targetSuffix) {
      // Matches END_IF / END IF / ENDIF etc.
      const t0 = peek(0);
      if (t0.type !== 'WORD') return false;
      if (t0.norm === 'END_' + targetSuffix || t0.norm === 'END' + targetSuffix) return true;
      if (t0.norm === 'END' && peek(1).type === 'WORD' && peek(1).norm === targetSuffix) return true;
      return false;
    }

    function consumeCompoundEnd(targetSuffix) {
      const t0 = peek(0);
      if (t0.norm === 'END' && peek(1).type === 'WORD' && peek(1).norm === targetSuffix) {
        pos += 2;
      } else {
        pos += 1;
      }
      return consumeStatementEnd();
    }

    function readDottedName() {
      const first = peek();
      if (first.type !== 'WORD') return null;
      let raw = first.value;
      let plain = first.plain;
      const line = first.line;
      pos++;
      while (peek().type === 'DOT' && (peek(1).type === 'WORD' || peek(1).type === 'NUMBER')) {
        pos++; // dot
        const nxt = peek();
        raw += '.' + nxt.value;
        plain += '.' + (nxt.plain || nxt.value);
        pos++;
      }
      recordIdent(raw, plain);
      return { raw, canonical: normalizeId(raw), plain, line };
    }

    // Parse parameter list inside ( ... )
    function parseParamList() {
      const params = [];
      if (peek().type !== 'LPAREN') return params;
      const openLine = peek().line;
      pos++; // (
      skipNewlines();

      let currentGroup = [];
      while (peek().type !== 'RPAREN' && peek().type !== 'EOF') {
        skipNewlines();
        if (peek().type === 'RPAREN') break;

        if (peek().type === 'WORD') {
          const tok = peek();
          recordIdent(tok.value, tok.plain);
          currentGroup.push({
            name: tok.value,
            canonical: tok.norm,
            line: tok.line
          });
          pos++;
          skipNewlines();

          if (peek().type === 'COMMA') {
            pos++;
            continue;
          }
          if (peek().type === 'COLON') {
            pos++;
            skipNewlines();
            // Expect IN, OUT, or IN/OUT
            let dir = null;
            if (peek().type === 'WORD') {
              const d1 = peek().norm;
              pos++;
              if (d1 === 'IN' && peek().type === 'SLASH' && peek(1).type === 'WORD' && peek(1).norm === 'OUT') {
                pos += 2;
                dir = 'IN/OUT';
              } else if (d1 === 'IN/OUT') {
                dir = 'IN/OUT';
              } else if (d1 === 'IN' || d1 === 'OUT') {
                dir = d1;
              } else {
                dir = 'UNKNOWN';
                errors.push({
                  severity: 'error',
                  code: 'E01_SYNTAX',
                  line: peek(-1).line,
                  procName: null,
                  message: `Μη έγκυρη κατεύθυνση παραμέτρου ": ${peek(-1).value}". Αναμενόταν IN, OUT ή IN/OUT.`
                });
              }
            }
            for (const item of currentGroup) {
              params.push({ name: item.name, canonical: item.canonical, direction: dir || 'IN', line: item.line });
            }
            currentGroup = [];
            skipNewlines();
            if (peek().type === 'COMMA' || peek().type === 'SEMI') {
              pos++;
            }
            continue;
          }
        } else if (peek().type === 'COMMA' || peek().type === 'SEMI') {
          // Flush any bare parameter group (e.g. FUNCTION f(a, b))
          for (const item of currentGroup) {
            params.push({ name: item.name, canonical: item.canonical, direction: 'IN', line: item.line });
          }
          currentGroup = [];
          pos++;
        } else {
          // Unexpected token in parameter list
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: peek().line,
            procName: null,
            message: `Μη αναμενόμενο σύμβολο "${peek().value}" στη λίστα παραμέτρων.`
          });
          pos++;
        }
      }

      if (currentGroup.length > 0) {
        for (const item of currentGroup) {
          params.push({ name: item.name, canonical: item.canonical, direction: 'IN', line: item.line });
        }
      }

      if (peek().type === 'RPAREN') {
        pos++;
      } else {
        errors.push({
          severity: 'error',
          code: 'E01_SYNTAX',
          line: openLine,
          procName: null,
          message: 'Λείπει η δεξιά παρένθεση ")" στην επικεφαλίδα διαδικασίας.'
        });
      }
      return params;
    }

    function parseVarListStatement(kind, startTok) {
      const vars = [];
      while (peek().type !== 'NEWLINE' && peek().type !== 'SEMI' && peek().type !== 'EOF') {
        if (peek().type === 'WORD') {
          const tok = peek();
          recordIdent(tok.value, tok.plain);
          vars.push({ name: tok.value, canonical: tok.norm, line: tok.line });
          pos++;
        } else if (peek().type === 'COMMA') {
          pos++;
        } else {
          // Tolerate extra words/colon if someone typed something unusual, stop if next keyword
          pos++;
        }
      }
      const hadSemicolon = consumeStatementEnd();
      return { type: kind, vars, line: startTok.line, hadSemicolon };
    }

    function extractVarsFromTokenRange(tokList) {
      const vars = [];
      for (let k = 0; k < tokList.length; k++) {
        const t = tokList[k];
        if (t.type !== 'WORD') continue;
        if (LOGICAL_NOISE_WORDS.has(t.norm)) continue;
        // Skip method calls after DOT like LIST.eof
        if (k > 0 && tokList[k - 1].type === 'DOT') continue;
        recordIdent(t.value, t.plain);
        vars.push({ name: t.value, canonical: t.norm, line: t.line });
      }
      return vars;
    }

    function isAtCaseBranchBoundary() {
      // Checks if current position begins `(label):` or `label:` or `OTHERWISE` or `END_CASE`
      if (matchCompoundEnd('CASE') || isKeyword(peek(0), KW.OTHERWISE)) return true;
      if (peek(0).type === 'LPAREN') {
        let k = 1;
        while (peek(k).type !== 'RPAREN' && peek(k).type !== 'NEWLINE' && peek(k).type !== 'EOF' && k < 10) {
          k++;
        }
        if (peek(k).type === 'RPAREN' && peek(k + 1).type === 'COLON') {
          return true;
        }
      }
      if ((peek(0).type === 'WORD' || peek(0).type === 'NUMBER' || peek(0).type === 'STRING') && peek(1).type === 'COLON') {
        if (peek(0).type === 'WORD' && (VERBAL_STARTERS.has(peek(0).norm) || peek(0).norm === KW.CALL || peek(0).norm === KW.IF || peek(0).norm === KW.WHILE)) {
          return false;
        }
        return true;
      }
      return false;
    }

    function parseBlock(stopPredicate, procName) {
      const body = [];
      while (peek().type !== 'EOF') {
        skipNewlinesAndSemis();
        if (peek().type === 'EOF') break;
        if (stopPredicate()) break;

        // Recovery if a new PROCEDURE/FUNCTION starts before closing current one
        if (isKeyword(peek(0), KW.PROCEDURE) || isKeyword(peek(0), KW.FUNCTION)) {
          break;
        }

        const stmt = parseStatement(procName);
        if (stmt) body.push(stmt);
      }
      return body;
    }

    function parseStatement(procName) {
      skipNewlinesAndSemis();
      const tok = peek();
      if (tok.type === 'EOF') return null;

      // LOCAL VAR / GLOBAL VAR
      if ((tok.norm === KW.LOCAL || tok.norm === KW.GLOBAL) && peek(1).type === 'WORD' && peek(1).norm === KW.VAR) {
        const scope = tok.norm === KW.LOCAL ? 'LocalVar' : 'GlobalVar';
        pos += 2;
        return parseVarListStatement(scope, tok);
      }

      // ΑΡΧΙΚΟΠΟΙΗΣΕ / ΑΡΧΙΚΟΠΟΙΗΣΗ / INITIALIZE
      if (tok.type === 'WORD' && KW_INIT_SET.has(tok.norm)) {
        pos++;
        return parseVarListStatement('Initialize', tok);
      }

      // CALL proc(args)
      if (tok.type === 'WORD' && tok.norm === KW.CALL) {
        pos++;
        const targetInfo = readDottedName();
        if (!targetInfo) {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: tok.line,
            procName,
            message: 'Αναμενόταν όνομα διαδικασίας μετά την εντολή CALL.'
          });
          consumeStatementEnd();
          return null;
        }
        const args = [];
        if (peek().type === 'LPAREN') {
          pos++;
          while (peek().type !== 'RPAREN' && peek().type !== 'NEWLINE' && peek().type !== 'EOF') {
            if (peek().type === 'COMMA') {
              pos++;
              continue;
            }
            // Collect argument token(s) up to comma or rparen
            const argToks = [];
            let depth = 0;
            while (peek().type !== 'EOF' && peek().type !== 'NEWLINE') {
              if (peek().type === 'LPAREN') depth++;
              else if (peek().type === 'RPAREN') {
                if (depth === 0) break;
                depth--;
              } else if (peek().type === 'COMMA' && depth === 0) {
                break;
              }
              argToks.push(peek());
              pos++;
            }
            if (argToks.length > 0) {
              const rawArg = argToks.map((t) => t.raw || t.value).join(' ').trim();
              const isSimpleVar = argToks.length === 1 && argToks[0].type === 'WORD';
              if (isSimpleVar) {
                recordIdent(argToks[0].value, argToks[0].plain);
              }
              args.push({
                name: rawArg,
                canonical: isSimpleVar ? argToks[0].norm : normalizeId(rawArg),
                isSimpleVar,
                vars: extractVarsFromTokenRange(argToks),
                line: argToks[0].line
              });
            }
          }
          if (peek().type === 'RPAREN') pos++;
        }
        const hadSemicolon = consumeStatementEnd();
        return {
          type: 'Call',
          target: targetInfo.raw,
          canonicalTarget: targetInfo.canonical,
          args,
          line: tok.line,
          hadSemicolon
        };
      }

      // IF <cond> THEN ... [ELSE ...] END_IF
      if (tok.type === 'WORD' && tok.norm === KW.IF) {
        pos++;
        const condToks = [];
        while (peek().type !== 'EOF' && !isKeyword(peek(), KW.THEN)) {
          if (peek().type === 'NEWLINE') { pos++; continue; }
          condToks.push(peek());
          pos++;
        }
        if (isKeyword(peek(), KW.THEN)) pos++;
        consumeStatementEnd();
        const condText = condToks.map((t) => t.raw || t.value).join(' ').trim();
        const condVars = extractVarsFromTokenRange(condToks);

        const thenBody = parseBlock(
          () => isKeyword(peek(), KW.ELSE) || matchCompoundEnd('IF'),
          procName
        );
        let elseBody = [];
        if (isKeyword(peek(), KW.ELSE)) {
          pos++;
          consumeStatementEnd();
          elseBody = parseBlock(() => matchCompoundEnd('IF'), procName);
        }
        if (matchCompoundEnd('IF')) {
          consumeCompoundEnd('IF');
        } else {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: tok.line,
            procName,
            message: `Λείπει το END_IF για τη συνθήκη IF της γραμμής ${tok.line}.`
          });
        }
        return { type: 'If', condText, condVars, thenBody, elseBody, line: tok.line, hadSemicolon: true };
      }

      // CASE <expr> OF ... END_CASE
      if (tok.type === 'WORD' && tok.norm === KW.CASE) {
        pos++;
        const exprToks = [];
        while (peek().type !== 'EOF' && !isKeyword(peek(), KW.OF)) {
          if (peek().type === 'NEWLINE') { pos++; continue; }
          exprToks.push(peek());
          pos++;
        }
        if (isKeyword(peek(), KW.OF)) pos++;
        if (peek().type === 'COLON') pos++; // tolerate CASE flag OF:
        consumeStatementEnd();

        const selectorVars = extractVarsFromTokenRange(exprToks);
        const selectorText = exprToks.map((t) => t.raw || t.value).join(' ').trim();
        const branches = [];
        let otherwiseBody = [];

        while (peek().type !== 'EOF' && !matchCompoundEnd('CASE') && !isKeyword(peek(), KW.PROCEDURE) && !isKeyword(peek(), KW.FUNCTION)) {
          skipNewlinesAndSemis();
          if (matchCompoundEnd('CASE') || peek().type === 'EOF') break;

          if (isKeyword(peek(), KW.OTHERWISE)) {
            pos++;
            if (peek().type === 'COLON') pos++;
            otherwiseBody = parseBlock(() => matchCompoundEnd('CASE'), procName);
            break;
          }

          if (isAtCaseBranchBoundary()) {
            const branchLine = peek().line;
            let labelToks = [];
            if (peek().type === 'LPAREN') {
              pos++;
              while (peek().type !== 'RPAREN' && peek().type !== 'EOF') {
                labelToks.push(peek());
                pos++;
              }
              if (peek().type === 'RPAREN') pos++;
            } else {
              labelToks.push(peek());
              pos++;
            }
            if (peek().type === 'COLON') pos++;
            const label = labelToks.map((t) => t.raw || t.value).join(' ').trim();
            const labelCanonical = normalizeId(label);
            const branchBody = parseBlock(() => isAtCaseBranchBoundary(), procName);
            branches.push({ label, labelCanonical, body: branchBody, line: branchLine });
          } else {
            // Unexpected line inside CASE before any branch label - consume to avoid infinite loop
            const stray = parseStatement(procName);
            if (stray) {
              branches.push({ label: '?', labelCanonical: '?', body: [stray], line: stray.line });
            }
          }
        }

        if (matchCompoundEnd('CASE')) {
          consumeCompoundEnd('CASE');
        } else {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: tok.line,
            procName,
            message: `Λείπει το END_CASE για την εντολή CASE της γραμμής ${tok.line}.`
          });
        }

        return {
          type: 'Case',
          selectorText,
          selectorCanonical: selectorVars.length === 1 ? selectorVars[0].canonical : normalizeId(selectorText),
          selectorVars,
          branches,
          otherwiseBody,
          line: tok.line,
          hadSemicolon: true
        };
      }

      // WHILE <cond> DO ... END_WHILE
      if (tok.type === 'WORD' && tok.norm === KW.WHILE) {
        pos++;
        const condToks = [];
        while (peek().type !== 'EOF' && !isKeyword(peek(), KW.DO)) {
          if (peek().type === 'NEWLINE') { pos++; continue; }
          condToks.push(peek());
          pos++;
        }
        if (isKeyword(peek(), KW.DO)) pos++;
        consumeStatementEnd();
        const condText = condToks.map((t) => t.raw || t.value).join(' ').trim();
        const condVars = extractVarsFromTokenRange(condToks);
        const body = parseBlock(() => matchCompoundEnd('WHILE'), procName);
        if (matchCompoundEnd('WHILE')) {
          consumeCompoundEnd('WHILE');
        } else {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: tok.line,
            procName,
            message: `Λείπει το END_WHILE για τον βρόχο WHILE της γραμμής ${tok.line}.`
          });
        }
        return { type: 'While', condText, condVars, body, line: tok.line, hadSemicolon: true };
      }

      // REPEAT ... UNTIL <cond>
      if (tok.type === 'WORD' && tok.norm === KW.REPEAT) {
        pos++;
        consumeStatementEnd();
        const body = parseBlock(() => isKeyword(peek(), KW.UNTIL), procName);
        let condText = '';
        let condVars = [];
        if (isKeyword(peek(), KW.UNTIL)) {
          pos++;
          const condToks = [];
          while (peek().type !== 'NEWLINE' && peek().type !== 'SEMI' && peek().type !== 'EOF') {
            condToks.push(peek());
            pos++;
          }
          condText = condToks.map((t) => t.raw || t.value).join(' ').trim();
          condVars = extractVarsFromTokenRange(condToks);
          consumeStatementEnd();
        } else {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: tok.line,
            procName,
            message: `Λείπει το UNTIL για τον βρόχο REPEAT της γραμμής ${tok.line}.`
          });
        }
        return { type: 'Repeat', condText, condVars, body, line: tok.line, hadSemicolon: true };
      }

      // FOR var FROM e1 TO e2 [STEP e3] DO ... END_FOR
      if (tok.type === 'WORD' && tok.norm === KW.FOR) {
        pos++;
        const headerToks = [];
        while (peek().type !== 'EOF' && !isKeyword(peek(), KW.DO)) {
          if (peek().type === 'NEWLINE') { pos++; continue; }
          headerToks.push(peek());
          pos++;
        }
        if (isKeyword(peek(), KW.DO)) pos++;
        consumeStatementEnd();
        let loopVar = null;
        if (headerToks.length > 0 && headerToks[0].type === 'WORD') {
          recordIdent(headerToks[0].value, headerToks[0].plain);
          loopVar = { name: headerToks[0].value, canonical: headerToks[0].norm, line: headerToks[0].line };
        }
        const condText = headerToks.map((t) => t.raw || t.value).join(' ').trim();
        const condVars = extractVarsFromTokenRange(
          headerToks.filter((t) => t.norm !== KW.FROM && t.norm !== KW.TO && t.norm !== KW.STEP)
        );
        const body = parseBlock(() => matchCompoundEnd('FOR'), procName);
        if (matchCompoundEnd('FOR')) {
          consumeCompoundEnd('FOR');
        } else {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: tok.line,
            procName,
            message: `Λείπει το END_FOR για τον βρόχο FOR της γραμμής ${tok.line}.`
          });
        }
        return { type: 'For', loopVar, condText, condVars, body, line: tok.line, hadSemicolon: true };
      }

      // Assignment or verbal statement until SEMI or NEWLINE
      const stmtToks = [];
      while (peek().type !== 'NEWLINE' && peek().type !== 'SEMI' && peek().type !== 'EOF') {
        stmtToks.push(peek());
        pos++;
      }
      const hadSemicolon = consumeStatementEnd();
      if (stmtToks.length === 0) return null;

      const rawText = stmtToks.map((t) => t.raw || t.value).join(' ').trim();

      // Check assignment: <WORD> (:= | :- | =) <rhs...>
      if (
        stmtToks.length >= 3 &&
        stmtToks[0].type === 'WORD' &&
        !VERBAL_STARTERS.has(stmtToks[0].norm) &&
        stmtToks[1].type === 'OP' &&
        (stmtToks[1].value === ':=' || stmtToks[1].value === ':-' || stmtToks[1].value === '=')
      ) {
        recordIdent(stmtToks[0].value, stmtToks[0].plain);
        return {
          type: 'Assign',
          target: stmtToks[0].value,
          canonicalTarget: stmtToks[0].norm,
          rhsVars: extractVarsFromTokenRange(stmtToks.slice(2)),
          rawText,
          line: tok.line,
          hadSemicolon
        };
      }

      return {
        type: 'Verbal',
        rawText,
        line: tok.line,
        hadSemicolon
      };
    }

    // Top-level procedure/function parser
    const procedures = [];
    const globalVars = [];
    const topStray = [];

    while (peek().type !== 'EOF') {
      skipNewlinesAndSemis();
      if (peek().type === 'EOF') break;

      const tok = peek();
      if (tok.type === 'WORD' && (tok.norm === KW.PROCEDURE || tok.norm === KW.FUNCTION)) {
        const kind = tok.norm === KW.FUNCTION ? 'FUNCTION' : 'PROCEDURE';
        const startLine = tok.line;
        pos++;
        const nameInfo = readDottedName();
        if (!nameInfo) {
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: startLine,
            procName: null,
            message: `Αναμενόταν όνομα μετά το ${kind}.`
          });
          while (peek().type !== 'NEWLINE' && peek().type !== 'EOF') pos++;
          continue;
        }

        skipNewlines();
        const params = parseParamList();
        consumeStatementEnd();

        const endSuffix = kind === 'FUNCTION' ? 'FUNCTION' : 'PROCEDURE';
        const body = parseBlock(() => matchCompoundEnd(endSuffix), nameInfo.raw);

        let endLine = startLine;
        if (matchCompoundEnd(endSuffix)) {
          endLine = peek().line;
          consumeCompoundEnd(endSuffix);
        } else {
          // Determine last line in body
          endLine = body.length > 0 ? body[body.length - 1].line : startLine;
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: startLine,
            procName: nameInfo.raw,
            message: `Η ${kind} "${nameInfo.raw}" (γραμμή ${startLine}) δεν κλείνει με END_${endSuffix}.`
          });
        }

        // Gather comments located inside [startLine, endLine] and verbal lines
        const innerComments = comments
          .filter((c) => c.startLine >= startLine && c.endLine <= endLine)
          .map((c) => c.text);
        const verbalTexts = [];
        (function collectVerbal(stmts) {
          for (const s of stmts) {
            if (s.type === 'Verbal') verbalTexts.push(s.rawText);
            else if (s.type === 'If') { collectVerbal(s.thenBody); collectVerbal(s.elseBody); }
            else if (s.type === 'Case') {
              for (const b of s.branches) collectVerbal(b.body);
              collectVerbal(s.otherwiseBody);
            } else if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') {
              collectVerbal(s.body);
            }
          }
        })(body);

        const ioMeta = extractIOMetaFromTexts([...verbalTexts, ...innerComments]);

        procedures.push({
          kind,
          name: nameInfo.raw,
          canonicalName: nameInfo.canonical,
          params,
          body,
          startLine,
          endLine,
          comments: innerComments,
          verbalTexts,
          ioMeta
        });
      } else if (tok.type === 'WORD' && tok.norm === KW.GLOBAL && peek(1).type === 'WORD' && peek(1).norm === KW.VAR) {
        pos += 2;
        const gStmt = parseVarListStatement('GlobalVar', tok);
        globalVars.push(...gStmt.vars);
      } else {
        const stray = parseStatement(null);
        if (stray) {
          topStray.push(stray);
          errors.push({
            severity: 'error',
            code: 'E01_SYNTAX',
            line: stray.line,
            procName: null,
            message: `Εντολή εκτός PROCEDURE/FUNCTION ("${stray.rawText || stray.type}"). Κάθε μονάδα ΠΛΗ11 πρέπει να ορίζεται μέσα σε PROCEDURE ... END_PROCEDURE.`
          });
        }
      }
    }

    // Collect homoglyph mixes
    const homoglyphMixes = [];
    for (const [canon, variants] of spellingVariants.entries()) {
      if (variants.size > 1) {
        homoglyphMixes.push({ canonical: canon, variants: Array.from(variants) });
      }
    }

    return {
      procedures,
      globalVars,
      topStray,
      comments,
      parseErrors: errors,
      homoglyphMixes,
      displayNames
    };
  }

  // ---------------------------------------------------------------------------
  // 4. SEMANTIC ANALYZER & ΔΔΠ MODEL BUILDER
  // ---------------------------------------------------------------------------
  function classifyProcByNameAndBody(proc) {
    const cname = proc.canonicalName;
    const hasCalls = procContainsCalls(proc.body);

    if (/^(GET|READ|FETCH|DIABASE|ΑΝΑΓΝΩΣΕ)/.test(cname) || /^GET/.test(cname)) {
      if (proc.ioMeta.ioKind === 'DATA_STORE') return 'DATA_MGMT';
      if (proc.ioMeta.ioKind === 'EXTERNAL_ENTITY') return 'PRESENTATION';
      return 'IO_GENERIC';
    }
    if (/^(PUT|WRITE|PRINT|DISPLAY|SHOW|EMFANISE|GRAPSE|TYPOSE|SAVE|STORE)/.test(cname) || /^PUT/.test(cname)) {
      if (proc.ioMeta.ioKind === 'DATA_STORE') return 'DATA_MGMT';
      if (proc.ioMeta.ioKind === 'EXTERNAL_ENTITY') return 'PRESENTATION';
      return 'IO_GENERIC';
    }
    if (/^(CALC|COMPUTE|PREPARE|DO|PROCESS|VERIFY|YPOLOGISE)/.test(cname)) {
      return 'CALC';
    }
    if (/^(EXEC|MAIN|RUN|DISPATCH|ZEROLIST|INSERTNUM|DISPLAYLIST|CALCSUM)/.test(cname) || hasCalls) {
      return 'CONTROL';
    }
    // Check body hints
    if (proc.ioMeta.directionHint === 'read' || proc.ioMeta.directionHint === 'write') {
      if (proc.ioMeta.ioKind === 'DATA_STORE') return 'DATA_MGMT';
      if (proc.ioMeta.ioKind === 'EXTERNAL_ENTITY') return 'PRESENTATION';
      return 'IO_GENERIC';
    }
    return 'CALC';
  }

  function inferStubRole(canonicalName) {
    if (/^(GET|READ|FETCH)/.test(canonicalName)) return { role: 'IO_GENERIC', ioDirection: 'read' };
    if (/^(PUT|WRITE|PRINT|DISPLAY|SHOW|SAVE|STORE)/.test(canonicalName)) return { role: 'IO_GENERIC', ioDirection: 'write' };
    if (/^(CALC|COMPUTE|PREPARE|DO|PROCESS|VERIFY)/.test(canonicalName)) return { role: 'CALC', ioDirection: null };
    if (/^(EXEC|MAIN|RUN|DISPATCH)/.test(canonicalName)) return { role: 'CONTROL', ioDirection: null };
    return { role: 'CONTROL', ioDirection: null };
  }

  function procContainsCalls(stmts) {
    for (const s of stmts || []) {
      if (s.type === 'Call') return true;
      if (s.type === 'If' && (procContainsCalls(s.thenBody) || procContainsCalls(s.elseBody))) return true;
      if (s.type === 'Case') {
        if (procContainsCalls(s.otherwiseBody)) return true;
        for (const b of s.branches) if (procContainsCalls(b.body)) return true;
      }
      if ((s.type === 'While' || s.type === 'Repeat' || s.type === 'For') && procContainsCalls(s.body)) return true;
    }
    return false;
  }

  function extractCallList(stmts, context = { cond: null, loop: null }) {
    const calls = [];
    for (const s of stmts || []) {
      if (s.type === 'Call') {
        calls.push({
          stmt: s,
          conditional: context.cond,
          loop: context.loop
        });
      } else if (s.type === 'If') {
        calls.push(...extractCallList(s.thenBody, {
          cond: { type: 'IF', label: s.condText || 'IF' },
          loop: context.loop
        }));
        calls.push(...extractCallList(s.elseBody, {
          cond: { type: 'IF_ELSE', label: s.condText ? `NOT (${s.condText})` : 'ELSE' },
          loop: context.loop
        }));
      } else if (s.type === 'Case') {
        for (const b of s.branches) {
          calls.push(...extractCallList(b.body, {
            cond: { type: 'CASE', label: b.label, selectorCanonical: s.selectorCanonical },
            loop: context.loop
          }));
        }
        calls.push(...extractCallList(s.otherwiseBody, {
          cond: { type: 'CASE', label: 'OTHERWISE', selectorCanonical: s.selectorCanonical },
          loop: context.loop
        }));
      } else if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') {
        calls.push(...extractCallList(s.body, {
          cond: context.cond,
          loop: { type: s.type.toUpperCase(), label: s.condText || s.type }
        }));
      }
    }
    return calls;
  }

  function analyzePLI11(ast) {
    const nodeMap = new Map(); // canonicalName -> node
    const nodes = [];
    const duplicateProcs = [];

    // 1. Register defined procedures
    for (const proc of ast.procedures) {
      if (nodeMap.has(proc.canonicalName)) {
        duplicateProcs.push(proc);
        continue;
      }
      const baseRole = classifyProcByNameAndBody(proc);
      const node = {
        id: sanitizeMermaidId(proc.canonicalName, 'M'),
        name: proc.name,
        canonicalName: proc.canonicalName,
        kind: proc.kind,
        role: baseRole, // may promote root to ROOT_CONTROL later
        isStub: false,
        params: proc.params,
        startLine: proc.startLine,
        endLine: proc.endLine,
        ioMeta: proc.ioMeta,
        proc,
        inDegree: 0,
        outDegree: 0,
        orderHint: nodes.length
      };
      nodeMap.set(proc.canonicalName, node);
      nodes.push(node);
    }

    // 2. Collect all calls and create implicit stubs when callee is missing
    const rawEdges = [];
    const definedNodes = [...nodes];
    for (const node of definedNodes) {
      if (node.isStub || !node.proc) continue;
      const calls = extractCallList(node.proc.body);
      // Track simple data-flow inside this parent to infer stub parameter directions
      const producedHere = new Set();
      for (const p of node.params) {
        if (p.direction === 'IN' || p.direction === 'IN/OUT') {
          producedHere.add(p.canonical);
        }
      }

      // Track case selectors in this proc to mark controlFlags
      const caseSelectors = new Set();
      (function findCaseSelectors(stmts) {
        for (const s of stmts) {
          if (s.type === 'Case' && s.selectorCanonical) caseSelectors.add(s.selectorCanonical);
          if (s.type === 'If') { findCaseSelectors(s.thenBody); findCaseSelectors(s.elseBody); }
          if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') findCaseSelectors(s.body);
        }
      })(node.proc.body);

      let callIdx = 0;
      for (const callInfo of calls) {
        const c = callInfo.stmt;
        let callee = nodeMap.get(c.canonicalTarget);
        if (!callee) {
          const stubInfo = inferStubRole(c.canonicalTarget);
          callee = {
            id: sanitizeMermaidId(c.canonicalTarget, 'M'),
            name: c.target,
            canonicalName: c.canonicalTarget,
            kind: 'PROCEDURE',
            role: stubInfo.role,
            ioDirection: stubInfo.ioDirection,
            isStub: true,
            params: [],
            startLine: c.line,
            endLine: c.line,
            ioMeta: {
              ioKind: 'UNKNOWN',
              ioTarget: null,
              directionHint: stubInfo.ioDirection
            },
            proc: null,
            inDegree: 0,
            outDegree: 0,
            orderHint: nodes.length
          };
          nodeMap.set(c.canonicalTarget, callee);
          nodes.push(callee);
        }

        // Determine inputs (downward) & outputs (upward) & controlFlags (●→)
        const inputs = [];
        const outputs = [];
        const controlFlags = [];

        if (!callee.isStub) {
          // Use defined formal parameter directions
          const formalParams = callee.params;
          for (let i = 0; i < c.args.length; i++) {
            const arg = c.args[i];
            const fp = formalParams[i];
            if (!fp) {
              // Extra arg beyond arity
              inputs.push({ name: arg.name, canonical: arg.canonical });
              continue;
            }
            if (fp.direction === 'IN') {
              inputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
            } else if (fp.direction === 'OUT') {
              outputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
              producedHere.add(arg.canonical);
            } else {
              // IN/OUT: in EAP ΠΛΗ11, Get/Calc/Upstream Exec outputs use : IN/OUT and mean upward ↑,
              // UNLESS this variable was already produced before AND callee isn't Get_* and caller isn't simply receiving it.
              const isGet = callee.role === 'DATA_MGMT' || callee.role === 'PRESENTATION' || callee.role === 'IO_GENERIC'
                ? /^(GET|READ|FETCH)/.test(callee.canonicalName) : false;
              const isCalc = callee.role === 'CALC';
              if (isGet) {
                outputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
                producedHere.add(arg.canonical);
              } else if (isCalc) {
                // In EAP Calc_M(A: IN, B: IN/OUT), IN/OUT is exclusively the output parameters!
                outputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
                producedHere.add(arg.canonical);
              } else {
                // Sub-Exec_Mi(Γ: IN/OUT): if already produced in parent AND parent isn't just passing an unproduced var up
                if (producedHere.has(arg.canonical) && !callInfo.conditional) {
                  // Bidirectional update if already computed before
                  inputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
                  outputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
                } else {
                  outputs.push({ name: arg.name, canonical: arg.canonical, formal: fp.canonical });
                  producedHere.add(arg.canonical);
                }
              }
            }
          }
        } else {
          // Infer directions for stub callee
          const cname = callee.canonicalName;
          const isGet = /^(GET|READ|FETCH)/.test(cname);
          const isPut = /^(PUT|WRITE|PRINT|DISPLAY|SHOW|SAVE|STORE)/.test(cname);
          const isCaseDispatch = callInfo.conditional && callInfo.conditional.type === 'CASE';
          for (const arg of c.args) {
            if (isGet) {
              outputs.push({ name: arg.name, canonical: arg.canonical });
              producedHere.add(arg.canonical);
            } else if (isPut || isCaseDispatch || producedHere.has(arg.canonical)) {
              inputs.push({ name: arg.name, canonical: arg.canonical });
            } else {
              outputs.push({ name: arg.name, canonical: arg.canonical });
              producedHere.add(arg.canonical);
            }
          }
        }

        // Identify control flags (selector of CASE or named flag)
        const remainingOutputs = [];
        for (const outItem of outputs) {
          if (caseSelectors.has(outItem.canonical) || /^FLAG/.test(outItem.canonical)) {
            controlFlags.push(outItem);
          } else {
            remainingOutputs.push(outItem);
          }
        }

        // Avoid incrementing inDegree on self-recursive or duplicate calls, still track edges
        node.outDegree++;
        callee.inDegree++;

        rawEdges.push({
          id: `E_${node.id}_${callee.id}_${callIdx}`,
          from: node.id,
          to: callee.id,
          fromName: node.canonicalName,
          toName: callee.canonicalName,
          inputs,
          outputs: remainingOutputs,
          allOutputs: outputs,
          controlFlags,
          conditional: callInfo.conditional,
          loop: callInfo.loop,
          line: c.line,
          orderIndex: callIdx,
          args: c.args
        });
        callIdx++;
      }
    }

    // 3. Identify Root Control node(s)
    const rootCandidates = nodes.filter((n) => !n.isStub && n.inDegree === 0 && (n.role === 'CONTROL' || n.outDegree > 0));
    let rootNode = null;
    if (rootCandidates.length > 0) {
      // Prefer node with no params and highest outDegree / CALLs
      rootCandidates.sort((a, b) => {
        const aNoParams = a.params.length === 0 ? 1 : 0;
        const bNoParams = b.params.length === 0 ? 1 : 0;
        if (bNoParams !== aNoParams) return bNoParams - aNoParams;
        return b.outDegree - a.outDegree;
      });
      rootNode = rootCandidates[0];
      rootNode.role = 'ROOT_CONTROL';
    } else if (nodes.length > 0) {
      const anyNoIn = nodes.find((n) => !n.isStub && n.inDegree === 0) || nodes[0];
      if (anyNoIn && anyNoIn.role === 'CONTROL') {
        anyNoIn.role = 'ROOT_CONTROL';
        rootNode = anyNoIn;
      }
    }

    // 4. Detect architecture pattern
    let architecture = 'MODULE_SET';
    if (rootNode && rootNode.proc) {
      const rootCalls = rawEdges.filter((e) => e.from === rootNode.id);
      const hasCase = (function checkCase(stmts) {
        return stmts.some((s) => s.type === 'Case' || (s.type === 'If' && (checkCase(s.thenBody) || checkCase(s.elseBody))));
      })(rootNode.proc.body);

      const calcChildren = rootCalls.filter((e) => {
        const t = nodeMap.get(e.toName);
        return t && t.role === 'CALC';
      });
      const uniqueCalcTargets = new Set(calcChildren.map((e) => e.toName));

      if (hasCase) {
        architecture = 'TRANSACTION_CENTER';
      } else if (uniqueCalcTargets.size >= 2) {
        architecture = 'COMPOSITE_CM';
      } else if (uniqueCalcTargets.size === 1) {
        architecture = 'SIMPLE_CM';
      } else if (rootCalls.length > 0) {
        architecture = 'CONTROL_HIERARCHY';
      }
    }

    // 5. Compute module counts (reachable from root if root exists, else all nodes)
    const counts = {
      control: 0,
      calc: 0,
      presentation: 0,
      dataMgmt: 0,
      ioGeneric: 0,
      stubs: 0,
      total: nodes.length
    };
    for (const n of nodes) {
      if (n.isStub) counts.stubs++;
      if (n.role === 'ROOT_CONTROL' || n.role === 'CONTROL') counts.control++;
      else if (n.role === 'CALC') counts.calc++;
      else if (n.role === 'PRESENTATION') counts.presentation++;
      else if (n.role === 'DATA_MGMT') counts.dataMgmt++;
      else counts.ioGeneric++;
    }

    return {
      nodes,
      nodeMap,
      edges: rawEdges,
      rootNode,
      architecture,
      counts,
      duplicateProcs
    };
  }

  // ---------------------------------------------------------------------------
  // 5. EAP RULES VALIDATOR
  // ---------------------------------------------------------------------------
  function validatePLI11(ast, model) {
    const diagnostics = [...ast.parseErrors];
    const globalSet = new Set(ast.globalVars.map((g) => g.canonical));

    // Track rules pass/fail for 6-item checklist
    const ruleHits = {
      syntax: ast.parseErrors.length === 0,
      noParamLocalOverlap: true,
      allLocalsInitialized: true,
      hierarchyValid: true,
      paramConsistency: true,
      dataFlowOrder: true
    };

    for (const dup of model.duplicateProcs) {
      diagnostics.push({
        severity: 'error',
        code: 'E11_DUPLICATE_PROC',
        line: dup.startLine,
        procName: dup.name,
        message: `Διπλός ορισμός διαδικασίας "${dup.name}".`,
        hint: 'Κάθε μονάδα του ΔΔΠ πρέπει να αντιστοιχεί σε μία μοναδική PROCEDURE.'
      });
    }

    // Check Root has no params (only when there are >= 2 procedures OR root calls another Exec / multiple Calcs / CASE)
    if (model.rootNode && model.rootNode.params.length > 0) {
      const rootCallsExecOrCase = model.edges.some((e) => {
        if (e.from !== model.rootNode.id) return false;
        const t = model.nodeMap.get(e.toName);
        return (t && (t.role === 'CONTROL')) || (e.conditional && e.conditional.type === 'CASE');
      });
      if (ast.procedures.length > 1 || rootCallsExecOrCase) {
        ruleHits.hierarchyValid = false;
        diagnostics.push({
          severity: 'error',
          code: 'E04_ROOT_HAS_PARAMS',
          line: model.rootNode.startLine,
          procName: model.rootNode.name,
          message: `Η κεντρική μονάδα ελέγχου "${model.rootNode.name}" δεν πρέπει να έχει παραμέτρους επικεφαλίδας (IN / IN/OUT).`,
          hint: 'Αφαιρέστε τις παραμέτρους από τη ρίζα και δηλώστε τις μεταβλητές με LOCAL VAR.'
        });
      }
    }

    // Detect hierarchy cycles (recursion / child calling parent)
    const adj = new Map();
    for (const e of model.edges) {
      if (!adj.has(e.fromName)) adj.set(e.fromName, []);
      adj.get(e.fromName).push({ toName: e.toName, line: e.line });
    }
    const visitState = new Map(); // 0=unvisited, 1=visiting, 2=done
    const reportedCycles = new Set();
    function dfsCycle(u, stack) {
      visitState.set(u, 1);
      for (const edge of adj.get(u) || []) {
        const v = edge.toName;
        if (visitState.get(v) === 1) {
          const cycleKey = `${u}->${v}`;
          if (!reportedCycles.has(cycleKey)) {
            reportedCycles.add(cycleKey);
            ruleHits.hierarchyValid = false;
            const callerNode = model.nodeMap.get(u);
            diagnostics.push({
              severity: 'error',
              code: 'E10_HIERARCHY_CYCLE',
              line: edge.line,
              procName: callerNode ? callerNode.name : u,
              message: `Παραβίαση ιεραρχίας top-down: η "${callerNode ? callerNode.name : u}" καλεί την "${v}", δημιουργώντας κύκλο/κλήση προς γονέα.`,
              hint: 'Μια υπομονάδα στο ΔΔΠ δεν επιτρέπεται να καλεί τον γονέα της, τη ρίζα ή τον εαυτό της.'
            });
          }
        } else if (!visitState.get(v)) {
          dfsCycle(v, [...stack, v]);
        }
      }
      visitState.set(u, 2);
    }
    for (const n of model.nodes) {
      if (!visitState.get(n.canonicalName)) dfsCycle(n.canonicalName, [n.canonicalName]);
    }

    // Per-procedure checks
    let missingSemiLines = [];
    for (const node of model.nodes) {
      if (node.isStub || !node.proc) continue;
      const proc = node.proc;
      const paramMap = new Map();
      for (const p of proc.params) {
        paramMap.set(p.canonical, p);
      }

      // E09: Wrong param direction on GET_* / PUT_*
      if (/^(GET|READ|FETCH)/.test(node.canonicalName)) {
        for (const p of proc.params) {
          if (p.direction === 'IN') {
            ruleHits.paramConsistency = false;
            diagnostics.push({
              severity: 'error',
              code: 'E09_WRONG_PARAM_DIRECTION',
              line: p.line,
              procName: proc.name,
              message: `Στη μονάδα λήψης "${proc.name}", η παράμετρος "${p.name}" δηλώθηκε ως IN αντί για IN/OUT (ή OUT).`,
              hint: 'Οι μονάδες Get_* εξάγουν δεδομένα στον καλούντα, άρα απαιτούν IN/OUT.'
            });
          }
        }
      } else if (/^(PUT|WRITE|PRINT|DISPLAY|SHOW|SAVE|STORE)/.test(node.canonicalName)) {
        for (const p of proc.params) {
          if (p.direction === 'IN/OUT' || p.direction === 'OUT') {
            ruleHits.paramConsistency = false;
            diagnostics.push({
              severity: 'error',
              code: 'E09_WRONG_PARAM_DIRECTION',
              line: p.line,
              procName: proc.name,
              message: `Στη μονάδα εξόδου "${proc.name}", η παράμετρος "${p.name}" δηλώθηκε ως ${p.direction} αντί για IN.`,
              hint: 'Οι μονάδες Put_* δέχονται δεδομένα μόνο ως είσοδο (IN).'
            });
          }
        }
      }

      // W02: : OUT convention hint
      for (const p of proc.params) {
        if (p.direction === 'OUT') {
          diagnostics.push({
            severity: 'warning',
            code: 'W02_OUT_CONVENTION',
            line: p.line,
            procName: proc.name,
            message: `Χρήση ": OUT" για την παράμετρο "${p.name}" στη "${proc.name}".`,
            hint: 'Στις νεότερες λύσεις ΓΕ1/ΟΕ1 του ΕΑΠ προτιμάται ": IN/OUT" για τις παραμέτρους εξόδου.'
          });
        }
      }

      // Collect LocalVar, GlobalVar, Initialize, and variable usages
      const localVars = new Map(); // canonical -> { name, line }
      const initVars = new Map();  // canonical -> { name, line }
      const usedVars = new Set();

      function walkDeclarationsAndUses(stmts, inInitPass = true) {
        for (const s of stmts) {
          if (!s.hadSemicolon && s.type !== 'If' && s.type !== 'Case' && s.type !== 'While' && s.type !== 'Repeat' && s.type !== 'For') {
            missingSemiLines.push({ line: s.line, procName: proc.name });
          }

          if (s.type === 'LocalVar') {
            for (const v of s.vars) {
              if (paramMap.has(v.canonical)) {
                ruleHits.noParamLocalOverlap = false;
                diagnostics.push({
                  severity: 'error',
                  code: 'E02_PARAM_REDECLARED_LOCAL',
                  line: v.line,
                  procName: proc.name,
                  message: `Η παράμετρος επικεφαλίδας "${v.name}" επαναδηλώνεται στο LOCAL VAR της "${proc.name}".`,
                  hint: 'Απαγορεύεται να δηλώνονται ξανά ως τοπικές μεταβλητές οι παράμετροι της επικεφαλίδας (IN / IN/OUT).'
                });
              } else if (!localVars.has(v.canonical)) {
                localVars.set(v.canonical, v);
              }
            }
          } else if (s.type === 'GlobalVar') {
            for (const v of s.vars) {
              globalSet.add(v.canonical);
            }
          } else if (s.type === 'Initialize') {
            for (const v of s.vars) {
              if (paramMap.has(v.canonical)) {
                ruleHits.noParamLocalOverlap = false;
                diagnostics.push({
                  severity: 'error',
                  code: 'E03_PARAM_INITIALIZED',
                  line: v.line,
                  procName: proc.name,
                  message: `Η παράμετρος επικεφαλίδας "${v.name}" αρχικοποιείται στη "${proc.name}", διαγράφοντας την τιμή κλήσης της.`,
                  hint: 'Μην συμπεριλαμβάνετε παραμέτρους επικεφαλίδας στην εντολή ΑΡΧΙΚΟΠΟΙΗΣΕ.'
                });
              } else if (!localVars.has(v.canonical) && !globalSet.has(v.canonical)) {
                diagnostics.push({
                  severity: 'error',
                  code: 'E05_UNDECLARED_VAR',
                  line: v.line,
                  procName: proc.name,
                  message: `Η μεταβλητή "${v.name}" αρχικοποιείται χωρίς να έχει δηλωθεί στο LOCAL VAR της "${proc.name}".`,
                  hint: `Προσθέστε το "${v.name}" στη δήλωση LOCAL VAR.`
                });
              } else {
                initVars.set(v.canonical, v);
              }
            }
          } else if (s.type === 'Call') {
            for (const arg of s.args) {
              for (const v of arg.vars) {
                usedVars.add(v.canonical);
                if (!paramMap.has(v.canonical) && !localVars.has(v.canonical) && !globalSet.has(v.canonical)) {
                  diagnostics.push({
                    severity: 'error',
                    code: 'E05_UNDECLARED_VAR',
                    line: v.line,
                    procName: proc.name,
                    message: `Η μεταβλητή "${v.name}" χρησιμοποιείται στο CALL ${s.target} χωρίς να έχει δηλωθεί (LOCAL VAR ή παράμετρος).`,
                    hint: `Δηλώστε το "${v.name}" στο LOCAL VAR της "${proc.name}".`
                  });
                }
              }
            }
          } else if (s.type === 'Assign') {
            usedVars.add(s.canonicalTarget);
            for (const v of s.rhsVars) usedVars.add(v.canonical);
          } else if (s.type === 'If') {
            for (const v of s.condVars) usedVars.add(v.canonical);
            walkDeclarationsAndUses(s.thenBody, inInitPass);
            walkDeclarationsAndUses(s.elseBody, inInitPass);
          } else if (s.type === 'Case') {
            for (const v of s.selectorVars) {
              usedVars.add(v.canonical);
              if (!paramMap.has(v.canonical) && !localVars.has(v.canonical) && !globalSet.has(v.canonical)) {
                diagnostics.push({
                  severity: 'error',
                  code: 'E05_UNDECLARED_VAR',
                  line: s.line,
                  procName: proc.name,
                  message: `Η μεταβλητή επιλογής "${v.name}" στο CASE δεν έχει δηλωθεί στη "${proc.name}".`
                });
              }
            }
            for (const b of s.branches) walkDeclarationsAndUses(b.body, inInitPass);
            walkDeclarationsAndUses(s.otherwiseBody, inInitPass);
          } else if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') {
            if (s.loopVar) {
              usedVars.add(s.loopVar.canonical);
              initVars.set(s.loopVar.canonical, s.loopVar);
            }
            for (const v of s.condVars) usedVars.add(v.canonical);
            walkDeclarationsAndUses(s.body, inInitPass);
          }
        }
      }
      walkDeclarationsAndUses(proc.body);

      // E06: Every LOCAL VAR in control procedures must be initialized with ΑΡΧΙΚΟΠΟΙΗΣΕ
      if (node.role === 'ROOT_CONTROL' || node.role === 'CONTROL') {
        for (const [canon, vInfo] of localVars.entries()) {
          if (!initVars.has(canon)) {
            ruleHits.allLocalsInitialized = false;
            diagnostics.push({
              severity: 'error',
              code: 'E06_UNINITIALIZED_LOCAL',
              line: vInfo.line,
              procName: proc.name,
              message: `Η τοπική μεταβλητή "${vInfo.name}" δηλώθηκε στο LOCAL VAR αλλά δεν αρχικοποιήθηκε με ΑΡΧΙΚΟΠΟΙΗΣΕ.`,
              hint: 'Σύμφωνα με τη μεθοδολογία ΠΛΗ11 (ΟΕ1/ΓΕ1), όλες οι LOCAL VAR μιας μονάδας ελέγχου πρέπει να αρχικοποιούνται.'
            });
          }
        }
      }

      // W03: Unused local var
      for (const [canon, vInfo] of localVars.entries()) {
        if (!usedVars.has(canon)) {
          diagnostics.push({
            severity: 'warning',
            code: 'W03_UNUSED_LOCAL',
            line: vInfo.line,
            procName: proc.name,
            message: `Η τοπική μεταβλητή "${vInfo.name}" δηλώθηκε στη "${proc.name}" αλλά δεν χρησιμοποιείται σε καμία εντολή.`
          });
        }
      }

      // E07 & E08: Call arity check + Data-flow order check inside procedure body
      const producedVars = new Set();
      for (const p of proc.params) {
        if (p.direction === 'IN') producedVars.add(p.canonical);
      }

      function walkDataFlow(stmts, activeCaseContext = null) {
        for (const s of stmts) {
          if (s.type === 'Call') {
            const callee = model.nodeMap.get(s.canonicalTarget);
            if (callee && !callee.isStub) {
              if (s.args.length !== callee.params.length) {
                ruleHits.paramConsistency = false;
                diagnostics.push({
                  severity: 'error',
                  code: 'E07_CALL_ARITY_MISMATCH',
                  line: s.line,
                  procName: proc.name,
                  message: `Ασυμφωνία πλήθους παραμέτρων στην κλήση CALL ${s.target}(...): δίνονται ${s.args.length} ορίσματα, ενώ η ${callee.name} ορίζει ${callee.params.length}.`,
                  hint: `Ελέγξτε τη δήλωση PROCEDURE ${callee.name}(...) στη γραμμή ${callee.startLine}.`
                });
              }

              // Check IN params are produced before this CALL
              for (let idx = 0; idx < s.args.length && idx < callee.params.length; idx++) {
                const arg = s.args[idx];
                const fp = callee.params[idx];
                if (fp.direction === 'IN' && arg.isSimpleVar) {
                  const branchTokens = String(activeCaseContext ? activeCaseContext.branchCanonical : '').split(/[^A-Z0-9_]+/);
                  const isCaseBranchPayload = activeCaseContext &&
                    activeCaseContext.selectorProduced &&
                    (arg.canonical === activeCaseContext.branchCanonical || branchTokens.includes(arg.canonical) || /^([A-Z]+[0-9]+)$/.test(arg.canonical));
                  if (!producedVars.has(arg.canonical) && !isCaseBranchPayload) {
                    ruleHits.dataFlowOrder = false;
                    diagnostics.push({
                      severity: 'error',
                      code: 'E08_DATAFLOW_ORDER',
                      line: s.line,
                      procName: proc.name,
                      message: `Η μεταβλητή "${arg.name}" περνά ως είσοδος (IN) στην "${s.target}" πριν παραχθεί η τιμή της από προηγούμενη Get_/Exec_/Calc_.`,
                      hint: 'Τηρήστε τη σειρά εξάρτησης: πρώτα Get_*/ανάντη Exec_*, μετά Calc_*, τέλος Put_*/κατάντη Exec_*.'
                    });
                  }
                }
              }
              // Mark outputs produced
              for (let idx = 0; idx < s.args.length && idx < callee.params.length; idx++) {
                const arg = s.args[idx];
                const fp = callee.params[idx];
                if (fp.direction === 'OUT' || fp.direction === 'IN/OUT') {
                  if (arg.isSimpleVar) producedVars.add(arg.canonical);
                }
              }
            } else if (callee && callee.isStub) {
              // For stub Put_* or Calc_*, check if it's Put_* whose input has NOT been produced yet
              const isPut = /^(PUT|WRITE|PRINT|DISPLAY|SHOW|SAVE|STORE)/.test(callee.canonicalName);
              const isGet = /^(GET|READ|FETCH)/.test(callee.canonicalName);
              if (isPut) {
                for (const arg of s.args) {
                  if (arg.isSimpleVar) {
                    const isCaseBranchPayload = activeCaseContext && activeCaseContext.selectorProduced;
                    if (!producedVars.has(arg.canonical) && !isCaseBranchPayload) {
                      ruleHits.dataFlowOrder = false;
                      diagnostics.push({
                        severity: 'error',
                        code: 'E08_DATAFLOW_ORDER',
                        line: s.line,
                        procName: proc.name,
                        message: `Η μονάδα εξόδου "${s.target}" καλείται για το "${arg.name}" πριν παραχθεί η τιμή του.`,
                        hint: 'Μετακινήστε την κλήση Put_* μετά τη μονάδα Calc_* ή Exec_* που παράγει το δεδομένο.'
                      });
                    }
                  }
                }
              } else if (!isGet) {
                // Find the edge created for this call to know its inferred outputs
                const edge = model.edges.find((e) => e.from === node.id && e.line === s.line && e.toName === s.canonicalTarget);
                if (edge) {
                  for (const outItem of edge.allOutputs) producedVars.add(outItem.canonical);
                }
              } else {
                for (const arg of s.args) {
                  if (arg.isSimpleVar) producedVars.add(arg.canonical);
                }
              }
            }
          } else if (s.type === 'Assign') {
            producedVars.add(s.canonicalTarget);
          } else if (s.type === 'If') {
            walkDataFlow(s.thenBody, activeCaseContext);
            walkDataFlow(s.elseBody, activeCaseContext);
          } else if (s.type === 'Case') {
            const selectorProduced = s.selectorVars.some((v) => producedVars.has(v.canonical));
            for (const b of s.branches) {
              walkDataFlow(b.body, { selectorProduced, branchCanonical: b.labelCanonical });
            }
            walkDataFlow(s.otherwiseBody, { selectorProduced, branchCanonical: null });
          } else if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') {
            if (s.loopVar) producedVars.add(s.loopVar.canonical);
            walkDataFlow(s.body, activeCaseContext);
          }
        }
      }
      walkDataFlow(proc.body);
    }

    // Aggregate missing semicolon warnings cleanly
    if (missingSemiLines.length > 0) {
      const sampleLines = missingSemiLines.slice(0, 5).map((x) => x.line).join(', ');
      const extra = missingSemiLines.length > 5 ? ` (+${missingSemiLines.length - 5} ακόμη)` : '';
      diagnostics.push({
        severity: 'warning',
        code: 'W01_MISSING_SEMICOLON',
        line: missingSemiLines[0].line,
        procName: missingSemiLines[0].procName,
        message: `Απουσιάζει ";" στο τέλος ${missingSemiLines.length} εντολών (γραμμές: ${sampleLines}${extra}).`,
        hint: 'Συνιστάται κάθε εντολή στον ψευδοκώδικα ΠΛΗ11 να τελειώνει με ερωτηματικό ";".'
      });
    }

    // Orphan defined procedures (when there is a root and defined procs aren't called from it)
    if (model.rootNode) {
      const reachable = new Set([model.rootNode.id]);
      const queue = [model.rootNode.id];
      while (queue.length > 0) {
        const cur = queue.shift();
        for (const e of model.edges) {
          if (e.from === cur && !reachable.has(e.to)) {
            reachable.add(e.to);
            queue.push(e.to);
          }
        }
      }
      for (const n of model.nodes) {
        if (!n.isStub && !reachable.has(n.id)) {
          diagnostics.push({
            severity: 'info',
            code: 'W04_ORPHAN_PROC',
            line: n.startLine,
            procName: n.name,
            message: `Η διαδικασία "${n.name}" δεν καλείται από την κεντρική μονάδα "${model.rootNode.name}".`,
            hint: 'Αυτό είναι φυσιολογικό σε μερικές απαντήσεις Θέματος 4 (ΓΕ1) όπου δίνονται μόνο επιλεγμένες υπομονάδες.'
          });
        }
      }
    }

    // Info: Implicit stubs
    const stubNodes = model.nodes.filter((n) => n.isStub);
    if (stubNodes.length > 0) {
      diagnostics.push({
        severity: 'info',
        code: 'I01_IMPLICIT_STUBS',
        line: stubNodes[0].startLine,
        procName: null,
        message: `Συντέθηκαν αυτόματα ${stubNodes.length} ελλείπουσες υπο-μονάδες (stubs) από τις κλήσεις CALL: ${stubNodes.map((s) => s.name).join(', ')}.`,
        hint: 'Προσθέστε τον ορισμό τους (PROCEDURE ...) αν θέλετε πλήρη έλεγχο παραμέτρων και προέλευσης ΔΡΔ.'
      });
    }

    // Info: Homoglyph mixing
    for (const hm of ast.homoglyphMixes) {
      diagnostics.push({
        severity: 'info',
        code: 'I02_HOMOGLYPH_MIX',
        line: 1,
        procName: null,
        message: `Το αναγνωριστικό "${hm.canonical}" εμφανίζεται με μεικτούς ελληνικούς και λατινικούς χαρακτήρες (${hm.variants.join(' / ')}). Ο μεταγλωττιστής τα ενοποίησε αυτόματα.`
      });
    }

    if (ast.parseErrors.length > 0) ruleHits.syntax = false;

    const checklist = [
      { id: 'syntax', label: 'Συντακτική Ορθότητα (PROCEDURE / END_PROCEDURE)', ok: ruleHits.syntax },
      { id: 'noOverlap', label: 'Χωρίς επαναδήλωση/αρχικοποίηση παραμέτρων (IN / IN/OUT)', ok: ruleHits.noParamLocalOverlap },
      { id: 'allInit', label: 'Όλες οι τοπικές μεταβλητές (LOCAL VAR) αρχικοποιούνται', ok: ruleHits.allLocalsInitialized },
      { id: 'hierarchy', label: 'Ιεραρχία Top-Down (ρίζα χωρίς παραμέτρους, χωρίς κύκλους)', ok: ruleHits.hierarchyValid },
      { id: 'params', label: 'Συμφωνία πλήθους και κατεύθυνσης παραμέτρων (Get/Calc/Put)', ok: ruleHits.paramConsistency },
      { id: 'dataFlow', label: 'Σωστή σειρά κλήσεων βάσει ροής δεδομένων (Get → Calc → Put)', ok: ruleHits.dataFlowOrder }
    ];

    const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
    const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
    const infoCount = diagnostics.filter((d) => d.severity === 'info').length;

    return {
      diagnostics,
      checklist,
      summary: { errorCount, warningCount, infoCount }
    };
  }

  // ---------------------------------------------------------------------------
  // 6. AUTOMATIC ΔΡΔ (DATA FLOW DIAGRAM) REVERSE SYNTHESIS
  // ---------------------------------------------------------------------------
  function extractProcessTag(canonicalName) {
    // Converts EXEC_M3 / CALC_M3 / EXEC_M3_M4 / EXEC111 -> M3, M3_M4, 111
    let stripped = canonicalName
      .replace(/^(EXEC|CALC|PREPARE|DO|PROCESS)_?/, '');
    if (!stripped) stripped = canonicalName;
    // Handle single process tags like M1, P1, 1_1, etc.
    return stripped;
  }

  function splitCompositeTags(tag) {
    // Splits M3_M4_M5 -> ['M3','M4','M5'], P2_P3 -> ['P2','P3'], M2_5 -> ['M2','M5']
    const parts = tag.split('_').filter(Boolean);
    if (parts.length <= 1) return parts;
    // Handle shorthand like M2_5 -> M2, M5
    const prefixMatch = parts[0].match(/^([A-Z]+)[0-9]+$/);
    if (prefixMatch) {
      const letter = prefixMatch[1];
      return parts.map((p) => (/^[0-9]+$/.test(p) ? letter + p : p));
    }
    return parts;
  }

  function synthesizeDFD(model) {
    const processes = new Map(); // procKey -> { id, key, label, isCentral, isTransactionCenter }
    const endpoints = new Map(); // endpointKey -> { id, label, type: 'process'|'store'|'entity'|'unknown_io', isCentral }
    const rawFlows = [];         // { fromKey, toKey, dataSet: Set, dataList: [] }

    function ensureProcess(key, displayLabel, isCentral = false, isTC = false) {
      if (!processes.has(key)) {
        const ep = {
          id: sanitizeMermaidId(key, 'P'),
          key,
          label: displayLabel || key,
          type: 'process',
          isCentral,
          isTransactionCenter: isTC
        };
        processes.set(key, ep);
        endpoints.set(ep.id, ep);
      } else {
        const existing = processes.get(key);
        if (isCentral) existing.isCentral = true;
        if (isTC) existing.isTransactionCenter = true;
      }
      return processes.get(key);
    }

    function ensureIOEndpoint(ioKind, ioTarget, fallbackHint, varName) {
      let type = 'unknown_io';
      let label = '';
      if (ioKind === 'DATA_STORE') {
        type = 'store';
        label = ioTarget || 'Αποθήκη Δεδομένων';
      } else if (ioKind === 'EXTERNAL_ENTITY') {
        type = 'entity';
        label = ioTarget || (fallbackHint === 'read' ? 'Πηγή' : 'Αποδέκτης');
      } else {
        type = 'unknown_io';
        label = fallbackHint === 'read' ? `Πηγή / Αποθήκη (${varName})` : `Αποδέκτης / Αποθήκη (${varName})`;
      }
      const key = `${type}:${normalizeId(label)}`;
      const id = sanitizeMermaidId(key, 'IO');
      if (!endpoints.has(id)) {
        endpoints.set(id, { id, key, label, type, isCentral: false });
      }
      return endpoints.get(id);
    }

    // Track central processes from ROOT_CONTROL
    const centralKeys = new Set();
    const isTC = model.architecture === 'TRANSACTION_CENTER';
    if (model.rootNode) {
      // Any Calc_* directly called by root corresponds to central transformation(s)
      const rootEdges = model.edges.filter((e) => e.from === model.rootNode.id);
      const directCalcs = rootEdges.filter((e) => {
        const t = model.nodeMap.get(e.toName);
        return t && t.role === 'CALC';
      });
      if (directCalcs.length > 0) {
        for (const e of directCalcs) {
          const pTag = extractProcessTag(e.toName);
          centralKeys.add(pTag);
          ensureProcess(pTag, pTag, true, isTC);
        }
      } else {
        const rootTag = extractProcessTag(model.rootNode.canonicalName);
        for (const part of splitCompositeTags(rootTag)) {
          centralKeys.add(part);
          ensureProcess(part, part, true, isTC);
        }
      }
    }

    // Variable provenance across the whole system: varCanon -> { producers: Set<endpointId>, consumers: Set<endpointId>, display }
    // For hierarchical calls, map each caller variable to canonical root/local trace keys.
    const varFlows = new Map(); // uniqueKey -> { display, producers: Set<epId>, consumers: Set<epId> }

    function ensureVarSlot(slotKey, display) {
      if (!varFlows.has(slotKey)) {
        varFlows.set(slotKey, { display, producers: new Set(), consumers: new Set() });
      }
      return varFlows.get(slotKey);
    }

    // Build bindings per procedure invocation starting from root, or standalone defined procs
    function traceSubtree(node, argBindings, scopeId, activeStack = new Set()) {
      if (!node || activeStack.has(node.id)) return;
      activeStack.add(node.id);
      try {
      const localSlotMap = new Map(); // varCanonical in this proc -> global flow slotKey
      for (const p of node.params) {
        if (argBindings.has(p.canonical)) {
          localSlotMap.set(p.canonical, argBindings.get(p.canonical));
        } else {
          const slotKey = `${scopeId}::${p.canonical}`;
          ensureVarSlot(slotKey, p.name);
          localSlotMap.set(p.canonical, slotKey);
        }
      }

      if (node.isStub || !node.proc) return;

      // Also track local variables in this proc
      function registerVars(stmts) {
        for (const s of stmts) {
          if (s.type === 'LocalVar') {
            for (const v of s.vars) {
              if (!localSlotMap.has(v.canonical)) {
                const slotKey = `${scopeId}::${v.canonical}`;
                ensureVarSlot(slotKey, v.name);
                localSlotMap.set(v.canonical, slotKey);
              }
            }
          } else if (s.type === 'If') { registerVars(s.thenBody); registerVars(s.elseBody); }
          else if (s.type === 'Case') {
            for (const b of s.branches) registerVars(b.body);
            registerVars(s.otherwiseBody);
          } else if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') {
            registerVars(s.body);
          }
        }
      }
      registerVars(node.proc.body);

      function getSlot(canon, displayName) {
        if (localSlotMap.has(canon)) return localSlotMap.get(canon);
        const slotKey = `${scopeId}::${canon}`;
        ensureVarSlot(slotKey, displayName || canon);
        localSlotMap.set(canon, slotKey);
        return slotKey;
      }

      const outgoingEdges = model.edges.filter((e) => e.from === node.id);

      // Process this node's own role if it is a leaf (CALC / IO)
      if (outgoingEdges.length === 0) {
        if (node.role === 'CALC') {
          const pTag = extractProcessTag(node.canonicalName);
          const procEp = ensureProcess(pTag, pTag, centralKeys.has(pTag), isTC && centralKeys.has(pTag));
          for (const p of node.params) {
            const slotKey = getSlot(p.canonical, p.name);
            const slot = varFlows.get(slotKey);
            if (p.direction === 'IN') slot.consumers.add(procEp.id);
            else slot.producers.add(procEp.id);
          }
        } else if (node.role === 'DATA_MGMT' || node.role === 'PRESENTATION' || node.role === 'IO_GENERIC') {
          const isRead = /^(GET|READ|FETCH)/.test(node.canonicalName) || node.ioMeta.directionHint === 'read';
          for (const p of node.params) {
            const slotKey = getSlot(p.canonical, p.name);
            const slot = varFlows.get(slotKey);
            const ioEp = ensureIOEndpoint(node.ioMeta.ioKind, node.ioMeta.ioTarget, isRead ? 'read' : 'write', slot.display);
            if (isRead) slot.producers.add(ioEp.id);
            else slot.consumers.add(ioEp.id);
          }
        }
        return;
      }

      // Control module: iterate outgoing calls
      const ownProcessTag = extractProcessTag(node.canonicalName);
      for (const edge of outgoingEdges) {
        const child = model.nodeMap.get(edge.toName);
        if (!child) continue;

        if (!child.isStub) {
          const childBindings = new Map();
          for (let i = 0; i < edge.args.length && i < child.params.length; i++) {
            const arg = edge.args[i];
            const fp = child.params[i];
            childBindings.set(fp.canonical, getSlot(arg.canonical, arg.name));
          }
          // Avoid infinite loop on self-call or multi-hop cycles
          if (!activeStack.has(child.id)) {
            traceSubtree(child, childBindings, `${scopeId}/${child.canonicalName}`, activeStack);
          }
        } else {
          // Handle stub child directly
          if (child.role === 'CALC') {
            const pTag = extractProcessTag(child.canonicalName);
            const procEp = ensureProcess(pTag, pTag, centralKeys.has(pTag), isTC && centralKeys.has(pTag));
            for (const inp of edge.inputs) {
              const slot = varFlows.get(getSlot(inp.canonical, inp.name));
              slot.consumers.add(procEp.id);
            }
            for (const outp of edge.allOutputs) {
              const slot = varFlows.get(getSlot(outp.canonical, outp.name));
              slot.producers.add(procEp.id);
            }
          } else if (child.role === 'IO_GENERIC' || child.role === 'DATA_MGMT' || child.role === 'PRESENTATION') {
            const isRead = child.ioDirection === 'read' || /^(GET|READ|FETCH)/.test(child.canonicalName);
            for (const inp of edge.inputs) {
              const slot = varFlows.get(getSlot(inp.canonical, inp.name));
              const ioEp = ensureIOEndpoint('UNKNOWN', null, 'write', slot.display);
              slot.consumers.add(ioEp.id);
            }
            for (const outp of edge.allOutputs) {
              const slot = varFlows.get(getSlot(outp.canonical, outp.name));
              const ioEp = ensureIOEndpoint('UNKNOWN', null, isRead ? 'read' : 'write', slot.display);
              if (isRead) slot.producers.add(ioEp.id);
              else slot.consumers.add(ioEp.id);
            }
          } else {
            // Stub Exec_* (e.g. EXEC_M1, EXEC_M2, EXEC_M4): treat as DFD Process
            const pTag = extractProcessTag(child.canonicalName);
            const procEp = ensureProcess(pTag, pTag, centralKeys.has(pTag), false);
            for (const inp of edge.inputs) {
              const slot = varFlows.get(getSlot(inp.canonical, inp.name));
              slot.consumers.add(procEp.id);
            }
            for (const outp of edge.allOutputs) {
              const slot = varFlows.get(getSlot(outp.canonical, outp.name));
              slot.producers.add(procEp.id);
            }
          }
        }

        // If edge comes from CASE branch (Transaction Center), attach the branch flow from KD to target child process
        if (edge.conditional && edge.conditional.type === 'CASE' && edge.conditional.label !== 'OTHERWISE') {
          const kdKey = splitCompositeTags(ownProcessTag)[0];
          const kdEp = processes.get(kdKey);
          const targetTag = splitCompositeTags(extractProcessTag(child.canonicalName))[0];
          const targetEp = processes.get(targetTag);
          if (kdEp) {
            for (const item of [...edge.args, ...edge.inputs]) {
              const slot = varFlows.get(getSlot(item.canonical, item.name));
              if (slot) slot.producers.add(kdEp.id);
            }
          }
          if (kdEp && targetEp) {
            const flowLabels = edge.inputs.length > 0 ? edge.inputs.map((x) => x.name) : [edge.conditional.label];
            for (const lbl of flowLabels) {
              const slotKey = `${scopeId}::CASE_${normalizeId(lbl)}`;
              const slot = ensureVarSlot(slotKey, lbl);
              slot.producers.add(kdEp.id);
              slot.consumers.add(targetEp.id);
            }
          }
        }
      }
      } finally {
        activeStack.delete(node.id);
      }
    }

    if (model.rootNode) {
      traceSubtree(model.rootNode, new Map(), 'ROOT');
    }

    // Also inspect any orphan defined Calc_* / Get_* / Put_* procedures (useful for partial GE1 solutions!)
    for (const n of model.nodes) {
      if (!n.isStub && n.inDegree === 0 && n !== model.rootNode) {
        traceSubtree(n, new Map(), `ORPHAN_${n.canonicalName}`);
      }
    }

    // Reconcile variables across separate orphan/root scopes when a CALC_M1 matches a stub EXEC_M1 process
    // Specifically: if a var slot has ONLY producers and no consumers (or vice versa), link by matching process key if same name exists
    const flowEdgeMap = new Map(); // "fromId->toId" -> { from, to, data: [] }

    function addFlowEdge(fromId, toId, dataLabel) {
      if (fromId === toId) return;
      const key = `${fromId}->${toId}`;
      if (!flowEdgeMap.has(key)) {
        flowEdgeMap.set(key, { from: fromId, to: toId, data: [] });
      }
      const edge = flowEdgeMap.get(key);
      const norm = normalizeId(dataLabel);
      if (!edge.data.some((d) => normalizeId(d) === norm)) {
        edge.data.push(dataLabel);
      }
    }

    // Group unlinked consumer/producer slots by canonical variable name to bridge partial definitions (e.g. EXEC_M1 stub + CALC_M1 orphan)
    const orphanProducersByVar = new Map();
    const orphanConsumersByVar = new Map();
    for (const [, slot] of varFlows.entries()) {
      const vNorm = normalizeId(slot.display);
      if (slot.producers.size > 0 && slot.consumers.size > 0) {
        for (const pId of slot.producers) {
          for (const cId of slot.consumers) {
            addFlowEdge(pId, cId, slot.display);
          }
        }
      } else if (slot.producers.size > 0 && slot.consumers.size === 0) {
        if (!orphanProducersByVar.has(vNorm)) orphanProducersByVar.set(vNorm, { display: slot.display, eps: new Set() });
        slot.producers.forEach((id) => orphanProducersByVar.get(vNorm).eps.add(id));
      } else if (slot.consumers.size > 0 && slot.producers.size === 0) {
        if (!orphanConsumersByVar.has(vNorm)) orphanConsumersByVar.set(vNorm, { display: slot.display, eps: new Set() });
        slot.consumers.forEach((id) => orphanConsumersByVar.get(vNorm).eps.add(id));
      }
    }

    const controlFlagSet = new Set();
    for (const e of model.edges) {
      for (const cf of e.controlFlags) controlFlagSet.add(cf.canonical);
    }

    // Bridge matching orphan producer/consumer pairs unless they belong to the exact same process
    for (const [vNorm, prodInfo] of orphanProducersByVar.entries()) {
      const consInfo = orphanConsumersByVar.get(vNorm);
      if (consInfo) {
        for (const pId of prodInfo.eps) {
          for (const cId of consInfo.eps) {
            if (pId !== cId) {
              addFlowEdge(pId, cId, prodInfo.display);
            }
          }
        }
        orphanConsumersByVar.delete(vNorm);
      } else if (!controlFlagSet.has(vNorm)) {
        // Still dangling output (not a CASE control flag) -> synthesize external
        for (const pId of prodInfo.eps) {
          const srcEp = endpoints.get(pId);
          if (srcEp && srcEp.type === 'process') {
            const sink = ensureIOEndpoint('UNKNOWN', null, 'write', prodInfo.display);
            addFlowEdge(pId, sink.id, prodInfo.display);
          }
        }
      }
    }

    for (const [, consInfo] of orphanConsumersByVar.entries()) {
      for (const cId of consInfo.eps) {
        const dstEp = endpoints.get(cId);
        if (dstEp && dstEp.type === 'process') {
          const src = ensureIOEndpoint('UNKNOWN', null, 'read', consInfo.display);
          addFlowEdge(src.id, cId, consInfo.display);
        }
      }
    }

    // Filter out any endpoints that have 0 incident edges
    const usedEndpointIds = new Set();
    const flows = Array.from(flowEdgeMap.values());
    for (const f of flows) {
      usedEndpointIds.add(f.from);
      usedEndpointIds.add(f.to);
    }

    const activeEndpoints = Array.from(endpoints.values()).filter((ep) => usedEndpointIds.has(ep.id) || ep.type === 'process');

    return {
      nodes: activeEndpoints,
      processes: activeEndpoints.filter((n) => n.type === 'process'),
      stores: activeEndpoints.filter((n) => n.type === 'store'),
      entities: activeEndpoints.filter((n) => n.type === 'entity' || n.type === 'unknown_io'),
      flows,
      hasGenericIO: activeEndpoints.some((n) => n.type === 'unknown_io'),
      architecture: model.architecture
    };
  }

  // ---------------------------------------------------------------------------
  // 7. MERMAID GENERATORS (ΔΔΠ & ΔΡΔ)
  // ---------------------------------------------------------------------------
  function escapeMermaidLabel(str) {
    return String(str || '').replace(/"/g, "'").replace(/[\r\n]+/g, ' ');
  }

  function generateDDPMermaid(model) {
    if (!model || model.nodes.length === 0) {
      return 'flowchart TD\n  Empty["Εισαγάγετε κώδικα ΠΛΗ11 για παραγωγή ΔΔΠ"]';
    }
    const lines = ['flowchart TD'];

    const roleClasses = {
      ROOT_CONTROL: 'rootMod',
      CONTROL: 'ctrlMod',
      CALC: 'calcMod',
      PRESENTATION: 'ioMod',
      DATA_MGMT: 'storeMod',
      IO_GENERIC: 'ioMod'
    };

    for (const n of model.nodes) {
      const label = escapeMermaidLabel(n.name);
      if (n.isStub) {
        lines.push(`  ${n.id}["${label} (stub)"]`);
      } else {
        lines.push(`  ${n.id}["${label}"]`);
      }
    }

    for (const e of model.edges) {
      const parts = [];
      if (e.conditional) {
        parts.push(e.conditional.type === 'CASE' ? `◆ ${e.conditional.label}` : `◇ IF`);
      }
      if (e.loop) {
        parts.push(`↻ ${e.loop.type}`);
      }
      if (e.inputs.length > 0) {
        parts.push(`↓ ${e.inputs.map((x) => x.name).join(',')}`);
      }
      if (e.outputs.length > 0) {
        parts.push(`↑ ${e.outputs.map((x) => x.name).join(',')}`);
      }
      if (e.controlFlags.length > 0) {
        parts.push(`● ${e.controlFlags.map((x) => x.name).join(',')}`);
      }
      const arrow = e.conditional || e.loop ? '-.->' : '-->';
      if (parts.length > 0) {
        lines.push(`  ${e.from} ${arrow}|"${escapeMermaidLabel(parts.join(' · '))}"| ${e.to}`);
      } else {
        lines.push(`  ${e.from} ${arrow} ${e.to}`);
      }
    }

    lines.push('');
    lines.push('  classDef rootMod fill:#1b4332,stroke:#40916c,color:#ffffff,stroke-width:2px');
    lines.push('  classDef ctrlMod fill:#264653,stroke:#2a9d8f,color:#ffffff,stroke-width:1.5px');
    lines.push('  classDef calcMod fill:#2b2d42,stroke:#8d99ae,color:#ffffff');
    lines.push('  classDef ioMod fill:#3d405b,stroke:#e07a5f,color:#ffffff');
    lines.push('  classDef storeMod fill:#4a3f35,stroke:#d4a373,color:#ffffff');
    lines.push('  classDef stubMod stroke-dasharray: 5 4');

    for (const n of model.nodes) {
      const cls = roleClasses[n.role] || 'ctrlMod';
      lines.push(`  class ${n.id} ${cls}${n.isStub ? ',stubMod' : ''}`);
    }

    return lines.join('\n');
  }

  function generateDFDMermaid(dfd) {
    if (!dfd || dfd.nodes.length === 0) {
      return 'flowchart LR\n  Empty["Δεν υπάρχουν ροές δεδομένων για ΔΡΔ"]';
    }
    const lines = ['flowchart LR'];

    const centralProcs = dfd.processes.filter((p) => p.isCentral);
    const otherProcs = dfd.processes.filter((p) => !p.isCentral);

    if (centralProcs.length > 0) {
      const sgTitle = 'Κεντρικός Μετασχηματισμός (ΚΜ)';
      lines.push(`  subgraph KM["${sgTitle}"]`);
      for (const p of centralProcs) {
        lines.push(`    ${p.id}(("${escapeMermaidLabel(p.label)}"))`);
      }
      lines.push('  end');
    }

    for (const p of otherProcs) {
      lines.push(`  ${p.id}(("${escapeMermaidLabel(p.label)}"))`);
    }

    for (const s of dfd.stores) {
      lines.push(`  ${s.id}[("${escapeMermaidLabel(s.label)}")]`);
    }

    for (const ent of dfd.entities) {
      lines.push(`  ${ent.id}["${escapeMermaidLabel(ent.label)}"]`);
    }

    for (const f of dfd.flows) {
      const label = escapeMermaidLabel(f.data.join(', '));
      lines.push(`  ${f.from} -->|"${label}"| ${f.to}`);
    }

    lines.push('');
    lines.push('  classDef procNode fill:#264653,stroke:#2aa198,color:#ffffff,stroke-width:2px');
    lines.push('  classDef centralNode fill:#1d3557,stroke:#e9c46a,color:#ffffff,stroke-width:2.5px');
    lines.push('  classDef storeNode fill:#4a3f35,stroke:#e9c46a,color:#ffffff');
    lines.push('  classDef entityNode fill:#2b2d42,stroke:#8d99ae,color:#ffffff');
    lines.push('  classDef unknownIO fill:#2b2d42,stroke:#8d99ae,color:#ffffff,stroke-dasharray: 5 4');

    for (const p of dfd.processes) {
      lines.push(`  class ${p.id} ${p.isCentral ? 'centralNode' : 'procNode'}`);
    }
    for (const s of dfd.stores) lines.push(`  class ${s.id} storeNode`);
    for (const ent of dfd.entities) {
      lines.push(`  class ${ent.id} ${ent.type === 'unknown_io' ? 'unknownIO' : 'entityNode'}`);
    }

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // 8. REVERSE COMPILER: DFD TEXT / MODEL -> ΔΔΠ + ΠΛΗ11 PSEUDOCODE
  // ---------------------------------------------------------------------------
  function parseDFDEndpoint(rawToken) {
    const t = String(rawToken || '').trim();
    const norm = stripAccents(t).toUpperCase();
    const mSrc = t.match(/^(?:ΠΗΓΗ|SOURCE)\s+(.+)$/i);
    if (mSrc) return { type: 'entity', name: mSrc[1].trim(), roleHint: 'source' };
    const mSink = t.match(/^(?:ΑΠΟΔΕΚΤΗΣ|SINK|DEST)\s+(.+)$/i);
    if (mSink) return { type: 'entity', name: mSink[1].trim(), roleHint: 'sink' };
    const mStore = t.match(/^(?:ΑΠΟΘΗΚΗ|STORE|ΑΡΧΕΙΟ)\s+(.+)$/i);
    if (mStore) return { type: 'store', name: mStore[1].trim(), roleHint: 'store' };

    if (/^(?:ΠΗΓΗ|ΑΠΟΔΕΚΤΗΣ|ΧΡΗΣΤΗΣ|SOURCE|SINK)/i.test(norm)) {
      return { type: 'entity', name: t, roleHint: 'entity' };
    }
    if (/^(?:ΑΠΟΘΗΚΗ|ΑΡΧΕΙΟ|ΑΔ|AD|DB)/i.test(norm)) {
      return { type: 'store', name: t, roleHint: 'store' };
    }
    return { type: 'process', name: t, roleHint: 'process' };
  }

  function parseDFDText(text) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    let mode = 'KM';
    let central = [];
    const flows = [];
    const parseErrors = [];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw || raw.startsWith('#') || raw.startsWith('//')) continue;

      const kmMatch = raw.match(/^(ΚΜ|KM|CM|ΚΔ|KD|TD|TC)\s*:\s*(.+)$/i);
      if (kmMatch) {
        const tag = stripAccents(kmMatch[1]).toUpperCase();
        mode = (tag === 'ΚΔ' || tag === 'KD' || tag === 'TD' || tag === 'TC') ? 'KD' : 'KM';
        central = kmMatch[2].split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
        continue;
      }

      const flowMatch = raw.match(/^(.+?)(?:->|→)(.+?)\s*:\s*(.+)$/);
      if (flowMatch) {
        const from = parseDFDEndpoint(flowMatch[1]);
        const to = parseDFDEndpoint(flowMatch[2]);
        const data = flowMatch[3].split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
        if (data.length === 0) {
          parseErrors.push(`Γραμμή ${i + 1}: Λείπει όνομα δεδομένου μετά το ":".`);
          continue;
        }
        flows.push({
          from: from.name,
          fromType: from.type,
          to: to.name,
          toType: to.type,
          data
        });
      } else {
        parseErrors.push(`Γραμμή ${i + 1}: Μη αναγνωρίσιμη μορφή ροής ("${raw}"). Αναμενόταν "Α -> Β : Δεδομένα".`);
      }
    }

    return { mode, central, flows, parseErrors };
  }

  function compileDFDToPLI11(dfdSpec) {
    const mode = dfdSpec.mode === 'KD' ? 'KD' : 'KM';
    const flows = Array.isArray(dfdSpec.flows) ? dfdSpec.flows : [];
    const procs = new Set();

    for (const f of flows) {
      if (f.fromType === 'process') procs.add(f.from);
      if (f.toType === 'process') procs.add(f.to);
    }

    let central = (dfdSpec.central || []).filter((c) => procs.has(c) || procs.size === 0);
    if (central.length === 0 && procs.size > 0) {
      central = [Array.from(procs)[0]];
    }
    const centralSet = new Set(central.map(normalizeId));
    const isCentral = (pName) => centralSet.has(normalizeId(pName));

    // Build incoming/outgoing maps for processes
    const procInFromProc = new Map();  // proc -> [{ from, data[] }]
    const procOutToProc = new Map();   // proc -> [{ to, data[] }]
    const procInFromIO = new Map();    // proc -> [{ source, type, data[] }]
    const procOutToIO = new Map();     // proc -> [{ sink, type, data[] }]

    for (const p of procs) {
      procInFromProc.set(p, []);
      procOutToProc.set(p, []);
      procInFromIO.set(p, []);
      procOutToIO.set(p, []);
    }

    for (const f of flows) {
      if (f.fromType === 'process' && f.toType === 'process') {
        procOutToProc.get(f.from).push({ to: f.to, data: f.data });
        procInFromProc.get(f.to).push({ from: f.from, data: f.data });
      } else if (f.fromType !== 'process' && f.toType === 'process') {
        procInFromIO.get(f.to).push({ source: f.from, type: f.fromType, data: f.data });
      } else if (f.fromType === 'process' && f.toType !== 'process') {
        procOutToIO.get(f.from).push({ sink: f.to, type: f.toType, data: f.data });
      }
    }

    // Reachability for upstream vs downstream classification
    function getReachableFrom(seeds, adjFn, skipCentral = true) {
      const visited = new Set();
      const q = [...seeds];
      while (q.length > 0) {
        const cur = q.shift();
        for (const nxt of adjFn(cur)) {
          if (skipCentral && isCentral(nxt)) continue;
          if (!visited.has(nxt)) {
            visited.add(nxt);
            q.push(nxt);
          }
        }
      }
      return visited;
    }

    const upstreamSet = getReachableFrom(central, (p) => (procInFromProc.get(p) || []).map((e) => e.from));
    const downstreamSet = getReachableFrom(central, (p) => (procOutToProc.get(p) || []).map((e) => e.to));

    // Order central processes topologically according to internal flows
    const orderedCentral = [];
    {
      const rem = new Set(central);
      while (rem.size > 0) {
        let picked = null;
        for (const c of rem) {
          const deps = (procInFromProc.get(c) || []).filter((e) => rem.has(e.from));
          if (deps.length === 0) {
            picked = c;
            break;
          }
        }
        if (!picked) picked = Array.from(rem)[0];
        orderedCentral.push(picked);
        rem.delete(picked);
      }
    }

    const generatedProcs = [];
    const generatedLeaves = new Map(); // name -> code

    function addGetLeaf(dVar, sourceName, sourceType) {
      const procName = `GET_${dVar}`;
      if (!generatedLeaves.has(procName)) {
        const targetLabel = sourceType === 'store'
          ? `την αποθήκη ${sourceName}`
          : `την εξωτερική οντότητα «${sourceName}»`;
        generatedLeaves.set(procName,
          `PROCEDURE ${procName}(${dVar}: IN/OUT)\n` +
          `  Διάβασε το δεδομένο ${dVar} από ${targetLabel};\n` +
          `END_PROCEDURE;`
        );
      }
      return procName;
    }

    function addPutLeaf(dVar, sinkName, sinkType) {
      const procName = `PUT_${dVar}`;
      if (!generatedLeaves.has(procName)) {
        const verb = sinkType === 'store'
          ? `Αποθήκευσε το δεδομένο ${dVar} στην αποθήκη ${sinkName}`
          : `ΕΜΦΑΝΙΣΕ το δεδομένο ${dVar} στην εξωτερική οντότητα «${sinkName}»`;
        generatedLeaves.set(procName,
          `PROCEDURE ${procName}(${dVar}: IN)\n` +
          `  ${verb};\n` +
          `END_PROCEDURE;`
        );
      }
      return procName;
    }

    function addCalcLeaf(pName, ins, outs, extraComment = '') {
      const procName = `CALC_${pName}`;
      if (!generatedLeaves.has(procName)) {
        const sigParts = [];
        if (ins.length > 0) sigParts.push(`${ins.join(',')}: IN`);
        if (outs.length > 0) sigParts.push(`${outs.join(',')}: IN/OUT`);
        const bodyDesc = extraComment || (
          outs.length > 0 && ins.length > 0
            ? `Υπολόγισε τα ${outs.join(',')} βάσει των ${ins.join(',')}`
            : outs.length > 0
              ? `Υπολόγισε τα ${outs.join(',')}`
              : `Επεξεργάσου τα ${ins.join(',')}`
        );
        generatedLeaves.set(procName,
          `PROCEDURE ${procName}(${sigParts.join(', ')})\n` +
          `  ${bodyDesc};\n` +
          `END_PROCEDURE;`
        );
      }
      return procName;
    }

    const visitedUp = new Set();
    function emitUpstreamProc(pName, parentTargetSet) {
      const execName = `EXEC_${pName}`;
      // Data returned to central/parent
      const outToParent = [];
      for (const e of procOutToProc.get(pName) || []) {
        if (parentTargetSet.has(e.to)) {
          for (const d of e.data) if (!outToParent.includes(d)) outToParent.push(d);
        }
      }
      if (visitedUp.has(execName)) return { execName, outVars: outToParent };
      visitedUp.add(execName);

      const localVars = [];
      const calls = [];
      const calcIns = [];

      // Local Gets from IO
      for (const io of procInFromIO.get(pName) || []) {
        for (const d of io.data) {
          if (!localVars.includes(d) && !outToParent.includes(d)) localVars.push(d);
          if (!calcIns.includes(d)) calcIns.push(d);
          const g = addGetLeaf(d, io.source, io.type);
          calls.push(`CALL ${g}(${d});`);
        }
      }

      // Further upstream processes feeding this proc
      for (const inc of procInFromProc.get(pName) || []) {
        if (!isCentral(inc.from)) {
          const sub = emitUpstreamProc(inc.from, new Set([pName]));
          for (const d of inc.data) {
            if (!localVars.includes(d) && !outToParent.includes(d)) localVars.push(d);
            if (!calcIns.includes(d)) calcIns.push(d);
          }
          calls.push(`CALL ${sub.execName}(${sub.outVars.join(',')});`);
        }
      }

      // Local Puts to IO (if an upstream proc also writes to an archive/entity)
      const calcOuts = [...outToParent];
      for (const io of procOutToIO.get(pName) || []) {
        for (const d of io.data) {
          if (!localVars.includes(d) && !outToParent.includes(d)) localVars.push(d);
          if (!calcOuts.includes(d)) calcOuts.push(d);
        }
      }

      const calcName = addCalcLeaf(pName, calcIns, calcOuts);
      calls.push(`CALL ${calcName}(${[...calcIns, ...calcOuts].join(',')});`);

      for (const io of procOutToIO.get(pName) || []) {
        for (const d of io.data) {
          const pLeaf = addPutLeaf(d, io.sink, io.type);
          calls.push(`CALL ${pLeaf}(${d});`);
        }
      }

      const lines = [`PROCEDURE ${execName}(${outToParent.join(',')}: IN/OUT)`];
      if (localVars.length > 0) {
        lines.push(`  LOCAL VAR ${localVars.join(',')};`);
        lines.push(`  ΑΡΧΙΚΟΠΟΙΗΣΕ ${localVars.join(',')};`);
      }
      for (const c of calls) lines.push(`  ${c}`);
      lines.push('END_PROCEDURE;');
      generatedProcs.push(lines.join('\n'));

      return { execName, outVars: outToParent };
    }

    const visitedDown = new Set();
    function emitDownstreamProc(pName, inFromParent) {
      const execName = `EXEC_${pName}`;
      if (visitedDown.has(execName)) return execName;
      visitedDown.add(execName);

      const localVars = [];
      const calls = [];
      const calcIns = [...inFromParent];

      // Local Gets from IO
      for (const io of procInFromIO.get(pName) || []) {
        for (const d of io.data) {
          if (!localVars.includes(d) && !inFromParent.includes(d)) localVars.push(d);
          if (!calcIns.includes(d)) calcIns.push(d);
          const g = addGetLeaf(d, io.source, io.type);
          calls.push(`CALL ${g}(${d});`);
        }
      }

      const calcOuts = [];
      for (const io of procOutToIO.get(pName) || []) {
        for (const d of io.data) {
          if (!localVars.includes(d) && !inFromParent.includes(d)) localVars.push(d);
          if (!calcOuts.includes(d)) calcOuts.push(d);
        }
      }
      const nextDowns = [];
      for (const outEdge of procOutToProc.get(pName) || []) {
        if (!isCentral(outEdge.to) && downstreamSet.has(outEdge.to)) {
          for (const d of outEdge.data) {
            if (!localVars.includes(d) && !inFromParent.includes(d)) localVars.push(d);
            if (!calcOuts.includes(d)) calcOuts.push(d);
          }
          nextDowns.push(outEdge);
        }
      }

      const calcName = addCalcLeaf(pName, calcIns, calcOuts);
      calls.push(`CALL ${calcName}(${[...calcIns, ...calcOuts].join(',')});`);

      for (const io of procOutToIO.get(pName) || []) {
        for (const d of io.data) {
          const pLeaf = addPutLeaf(d, io.sink, io.type);
          calls.push(`CALL ${pLeaf}(${d});`);
        }
      }
      for (const nxt of nextDowns) {
        const subExec = emitDownstreamProc(nxt.to, nxt.data);
        calls.push(`CALL ${subExec}(${nxt.data.join(',')});`);
      }

      const lines = [`PROCEDURE ${execName}(${inFromParent.join(',')}: IN)`];
      if (localVars.length > 0) {
        lines.push(`  LOCAL VAR ${localVars.join(',')};`);
        lines.push(`  ΑΡΧΙΚΟΠΟΙΗΣΕ ${localVars.join(',')};`);
      }
      for (const c of calls) lines.push(`  ${c}`);
      lines.push('END_PROCEDURE;');
      generatedProcs.push(lines.join('\n'));
      return execName;
    }

    // Build Root Control Unit
    const rootName = `EXEC_${orderedCentral.join('_')}`;
    const rootLocals = [];
    const rootCalls = [];
    const addRootLocal = (v) => { if (!rootLocals.includes(v)) rootLocals.push(v); };

    // 1. Upstream calls (processes feeding central)
    const upstreamFedIntoCentral = new Set();
    for (const c of orderedCentral) {
      for (const inc of procInFromProc.get(c) || []) {
        if (!isCentral(inc.from)) upstreamFedIntoCentral.add(inc.from);
      }
    }
    for (const upProc of upstreamFedIntoCentral) {
      const res = emitUpstreamProc(upProc, centralSet);
      res.outVars.forEach(addRootLocal);
      rootCalls.push(`CALL ${res.execName}(${res.outVars.join(',')});`);
    }

    // 2. Direct Gets on central processes
    for (const c of orderedCentral) {
      for (const io of procInFromIO.get(c) || []) {
        for (const d of io.data) {
          addRootLocal(d);
          const g = addGetLeaf(d, io.source, io.type);
          rootCalls.push(`CALL ${g}(${d});`);
        }
      }
    }

    // 3. Central calculations & downstream / transaction dispatch
    if (mode === 'KD') {
      const kdProc = orderedCentral[0];
      const kdIns = [];
      for (const inc of procInFromProc.get(kdProc) || []) {
        inc.data.forEach((d) => { if (!kdIns.includes(d)) kdIns.push(d); });
      }
      for (const io of procInFromIO.get(kdProc) || []) {
        io.data.forEach((d) => { if (!kdIns.includes(d)) kdIns.push(d); });
      }

      addRootLocal('flag');
      const downTargets = procOutToProc.get(kdProc) || [];
      const caseBranches = [];
      for (const dt of downTargets) {
        for (const d of dt.data) addRootLocal(d);
        const subExec = emitDownstreamProc(dt.to, dt.data);
        caseBranches.push(`    (${dt.data.join(',')}): CALL ${subExec}(${dt.data.join(',')});`);
      }

      const directPuts = procOutToIO.get(kdProc) || [];
      for (const io of directPuts) {
        for (const d of io.data) {
          addRootLocal(d);
          const pLeaf = addPutLeaf(d, io.sink, io.type);
          caseBranches.push(`    (${d}): CALL ${pLeaf}(${d});`);
        }
      }

      const calcKd = addCalcLeaf(kdProc, kdIns, ['flag'], `Υπολόγισε το flag επιλογής βάσει των ${kdIns.join(',') || 'εισόδων'}`);
      rootCalls.push(`CALL ${calcKd}(${[...kdIns, 'flag'].join(',')});`);
      rootCalls.push('CASE flag OF');
      rootCalls.push(...caseBranches);
      rootCalls.push('  END_CASE;');
    } else {
      // Composite or Simple KM
      for (const c of orderedCentral) {
        const ins = [];
        for (const io of procInFromIO.get(c) || []) io.data.forEach((d) => { if (!ins.includes(d)) ins.push(d); });
        for (const inc of procInFromProc.get(c) || []) inc.data.forEach((d) => { if (!ins.includes(d)) ins.push(d); });

        const outs = [];
        for (const io of procOutToIO.get(c) || []) io.data.forEach((d) => { addRootLocal(d); if (!outs.includes(d)) outs.push(d); });
        for (const outE of procOutToProc.get(c) || []) outE.data.forEach((d) => { addRootLocal(d); if (!outs.includes(d)) outs.push(d); });

        const calcName = addCalcLeaf(c, ins, outs);
        rootCalls.push(`CALL ${calcName}(${[...ins, ...outs].join(',')});`);
      }

      // Direct Puts on central processes
      for (const c of orderedCentral) {
        for (const io of procOutToIO.get(c) || []) {
          for (const d of io.data) {
            const pLeaf = addPutLeaf(d, io.sink, io.type);
            rootCalls.push(`CALL ${pLeaf}(${d});`);
          }
        }
      }

      // Downstream Exec_* calls
      for (const c of orderedCentral) {
        for (const outE of procOutToProc.get(c) || []) {
          if (!isCentral(outE.to)) {
            const subExec = emitDownstreamProc(outE.to, outE.data);
            rootCalls.push(`CALL ${subExec}(${outE.data.join(',')});`);
          }
        }
      }
    }

    const rootLines = [`PROCEDURE ${rootName}`];
    if (rootLocals.length > 0) {
      rootLines.push(`  LOCAL VAR ${rootLocals.join(',')};`);
      rootLines.push(`  ΑΡΧΙΚΟΠΟΙΗΣΕ ${rootLocals.join(',')};`);
    }
    for (const c of rootCalls) rootLines.push(`  ${c}`);
    rootLines.push('END_PROCEDURE;');

    const allBlocks = [
      `/* Αυτόματη παραγωγή ψευδοκώδικα ΠΛΗ11 (${mode === 'KD' ? 'Κέντρο Δοσοληψιών' : 'Κεντρικός Μετασχηματισμός'}: ${orderedCentral.join(', ')}) */`,
      rootLines.join('\n'),
      ...generatedProcs,
      ...Array.from(generatedLeaves.values())
    ];

    return allBlocks.join('\n\n');
  }

  // ---------------------------------------------------------------------------
  // 9. SYMBOLIC CALL-TRACE STEPPER
  // ---------------------------------------------------------------------------
  function buildCallTrace(ast, model, options = {}) {
    const caseChoiceIdx = options.caseBranchIndex || 0;
    const steps = [];
    if (!model.rootNode || !model.rootNode.proc) return steps;

    const callStack = [];
    const activeIds = new Set();
    let stepNum = 0;

    function snapshotVars(varStates) {
      const obj = {};
      for (const [k, v] of varStates.entries()) {
        obj[v.display] = v.state;
      }
      return obj;
    }

    function walkProc(node, passedArgs, incomingEdgeId) {
      if (steps.length > 300 || !node || activeIds.has(node.id)) return;
      activeIds.add(node.id);
      callStack.push(node.name);
      try {
      const varStates = new Map(); // canonical -> { display, state }

      for (let i = 0; i < node.params.length; i++) {
        const fp = node.params[i];
        const passedState = passedArgs[i] ? passedArgs[i].state : (fp.direction === 'IN' ? 'τιμή εισόδου' : 'αρχική');
        varStates.set(fp.canonical, { display: fp.name, state: passedState });
      }

      stepNum++;
      steps.push({
        step: stepNum,
        line: node.startLine,
        procName: node.name,
        action: 'ENTER',
        activeNodeId: node.id,
        activeEdgeId: incomingEdgeId || null,
        callStack: [...callStack],
        varsSnapshot: snapshotVars(varStates),
        summary: `Είσοδος στη μονάδα ${node.name}`
      });

      if (node.isStub || !node.proc) {
        if (node.role === 'CALC' || /^(GET|READ)/.test(node.canonicalName)) {
          for (const fp of node.params) {
            if (fp.direction !== 'IN') {
              varStates.set(fp.canonical, { display: fp.name, state: 'υπολογισμένη/αναγνωσμένη' });
            }
          }
        }
        callStack.pop();
        return;
      }

      function execStmts(stmts) {
        for (const s of stmts) {
          if (steps.length > 300) return;
          if (s.type === 'LocalVar') {
            for (const v of s.vars) {
              varStates.set(v.canonical, { display: v.name, state: 'αδήλωτη τιμή' });
            }
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: 'LOCAL_VAR',
              activeNodeId: node.id,
              activeEdgeId: null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: `Δήλωση τοπικών μεταβλητών: ${s.vars.map((v) => v.name).join(', ')}`
            });
          } else if (s.type === 'Initialize') {
            for (const v of s.vars) {
              varStates.set(v.canonical, { display: v.name, state: 'αρχικοποιημένη' });
            }
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: 'INIT',
              activeNodeId: node.id,
              activeEdgeId: null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: `Αρχικοποίηση: ${s.vars.map((v) => v.name).join(', ')}`
            });
          } else if (s.type === 'Call') {
            const callee = model.nodeMap.get(s.canonicalTarget);
            const edge = model.edges.find((e) => e.from === node.id && e.line === s.line && e.toName === s.canonicalTarget);
            const argListText = s.args.map((a) => a.name).join(', ');
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: 'CALL',
              activeNodeId: callee ? callee.id : node.id,
              activeEdgeId: edge ? edge.id : null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: `Κλήση ${s.target}(${argListText})`
            });

            if (callee && !callee.isStub && !activeIds.has(callee.id)) {
              const childArgs = s.args.map((a) => ({
                canonical: a.canonical,
                name: a.name,
                state: (varStates.get(a.canonical) || { state: 'τιμή' }).state
              }));
              walkProc(callee, childArgs, edge ? edge.id : null);
            }

            // Update caller's output variables after return
            if (edge) {
              for (const o of edge.allOutputs) {
                varStates.set(o.canonical, { display: o.name, state: 'έχει τιμή (έξοδος)' });
              }
              if (edge.allOutputs.length > 0) {
                stepNum++;
                steps.push({
                  step: stepNum,
                  line: s.line,
                  procName: node.name,
                  action: 'RETURN_DATA',
                  activeNodeId: node.id,
                  activeEdgeId: edge.id,
                  callStack: [...callStack],
                  varsSnapshot: snapshotVars(varStates),
                  summary: `Επιστροφή από ${s.target} με δεδομένα: ${edge.allOutputs.map((x) => x.name).join(', ')}`
                });
              }
            }
          } else if (s.type === 'If') {
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: 'IF',
              activeNodeId: node.id,
              activeEdgeId: null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: `Έλεγχος συνθήκης: IF ${s.condText}`
            });
            execStmts(s.thenBody);
          } else if (s.type === 'Case') {
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: 'CASE',
              activeNodeId: node.id,
              activeEdgeId: null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: `Επιλογή περίπτωσης: CASE ${s.selectorText}`
            });
            if (s.branches.length > 0) {
              const chosen = s.branches[Math.min(caseChoiceIdx, s.branches.length - 1)];
              execStmts(chosen.body);
            }
          } else if (s.type === 'While' || s.type === 'Repeat' || s.type === 'For') {
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: 'LOOP',
              activeNodeId: node.id,
              activeEdgeId: null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: `Επανάληψη (${s.type}): ${s.condText}`
            });
            execStmts(s.body);
          } else if (s.type === 'Verbal' || s.type === 'Assign') {
            stepNum++;
            steps.push({
              step: stepNum,
              line: s.line,
              procName: node.name,
              action: s.type.toUpperCase(),
              activeNodeId: node.id,
              activeEdgeId: null,
              callStack: [...callStack],
              varsSnapshot: snapshotVars(varStates),
              summary: s.rawText
            });
          }
        }
      }

      execStmts(node.proc.body);

      stepNum++;
      steps.push({
        step: stepNum,
        line: node.endLine,
        procName: node.name,
        action: 'EXIT',
        activeNodeId: node.id,
        activeEdgeId: null,
        callStack: [...callStack],
        varsSnapshot: snapshotVars(varStates),
        summary: `Ολοκλήρωση μονάδας ${node.name}`
      });
      } finally {
        callStack.pop();
        activeIds.delete(node.id);
      }
    }

    walkProc(model.rootNode, [], null);
    return steps;
  }

  // ---------------------------------------------------------------------------
  // 10. CODE FORMATTER
  // ---------------------------------------------------------------------------
  function formatPLI11(source) {
    const lines = String(source || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const out = [];
    let indent = 0;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        if (out.length > 0 && out[out.length - 1] !== '') out.push('');
        continue;
      }

      const norm = normalizeId(trimmed.replace(/;+$/, ''));
      const isClosing = /^(END_?(?:PROCEDURE|FUNCTION|IF|CASE|WHILE|FOR)|ENDIF|ENDCASE|ENDWHILE|ENDFOR|UNTIL\b)/.test(norm);
      const isMiddle = /^(ELSE\b|OTHERWISE\b)/.test(norm);
      const isCaseBranch = /^(\([^)]+\)|[A-Za-zΑ-Ωα-ω0-9_'"]+)\s*:(?!=|-)/.test(trimmed);

      if ((isClosing || isMiddle) && indent > 0) {
        indent--;
      }

      const effectiveIndent = isCaseBranch ? Math.max(0, indent) : indent;
      out.push('  '.repeat(effectiveIndent) + trimmed);

      const isOpening = /^(PROCEDURE\b|FUNCTION\b|IF\b|CASE\b|WHILE\b|REPEAT\b|FOR\b)/.test(norm) || isMiddle;
      if (isOpening && !isClosing) {
        indent++;
      }
    }

    return out.join('\n').trim() + '\n';
  }

  // ---------------------------------------------------------------------------
  // 11. PUBLIC COMPILER PIPELINE
  // ---------------------------------------------------------------------------
  function compilePLI11(source) {
    const ast = parsePLI11(source);
    const model = analyzePLI11(ast);
    const validation = validatePLI11(ast, model);
    const dfd = synthesizeDFD(model);
    const ddpMermaid = generateDDPMermaid(model);
    const dfdMermaid = generateDFDMermaid(dfd);
    const callTrace = buildCallTrace(ast, model);
    return {
      ast,
      model,
      validation,
      dfd,
      ddpMermaid,
      dfdMermaid,
      callTrace
    };
  }

  return {
    stripAccents,
    normalizeId,
    tokenizePLI11,
    parsePLI11,
    analyzePLI11,
    validatePLI11,
    synthesizeDFD,
    generateDDPMermaid,
    generateDFDMermaid,
    parseDFDText,
    compileDFDToPLI11,
    buildCallTrace,
    formatPLI11,
    compilePLI11
  };
}));
