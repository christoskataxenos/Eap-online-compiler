// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 Class Diagrams Core Engine (Parser, Validator, OO-Pseudocode, Mermaid)
// Official EAP Object-Oriented Notation (ΟΣΣ2 Slide 8 + ΓΕ1 Thema 5)
// UMD module: Browser window.PLI11ClassesCore / Node
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PLI11ClassesCore = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HOMOGLYPHS = {
    '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u0396': 'Z',
    '\u0397': 'H', '\u0399': 'I', '\u039A': 'K', '\u039C': 'M',
    '\u039D': 'N', '\u039F': 'O', '\u03A1': 'P', '\u03A4': 'T',
    '\u03A5': 'Y', '\u03A7': 'X'
  };

  function normalizeClassName(name) {
    return String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
  }

  function stripGreekAccentsUpper(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u03C2/g, '\u03A3')
      .toUpperCase();
  }

  function normKeyword(str) {
    const plain = stripGreekAccentsUpper(str).trim();
    let out = '';
    for (let i = 0; i < plain.length; i++) {
      out += HOMOGLYPHS[plain[i]] || plain[i];
    }
    return out;
  }

  function canonicalKey(name) {
    return stripGreekAccentsUpper(normalizeClassName(name));
  }

  function slugId(name) {
    return canonicalKey(name).replace(/[^A-Z\u0391-\u03A90-9_]+/g, '_');
  }

  // Strip // line comments and /* ... */ block comments while preserving line count.
  // Never strips '#' because '#' represents UML PROTECTED visibility.
  function stripCommentsPreserveLines(source) {
    const src = String(source || '').replace(/\r\n?/g, '\n');
    let out = '';
    let i = 0;
    let inBlock = false;
    let quote = '';

    while (i < src.length) {
      const ch = src[i];
      const next = src[i + 1];

      if (inBlock) {
        if (ch === '*' && next === '/') {
          inBlock = false;
          out += '  ';
          i += 2;
        } else {
          out += ch === '\n' ? '\n' : ' ';
          i += 1;
        }
        continue;
      }

      if (quote) {
        out += ch;
        if (ch === quote) quote = '';
        i += 1;
        continue;
      }

      if (ch === '"' || ch === "'") {
        quote = ch;
        out += ch;
        i += 1;
        continue;
      }

      if (ch === '/' && next === '*') {
        inBlock = true;
        out += '  ';
        i += 2;
        continue;
      }

      if (ch === '/' && next === '/') {
        while (i < src.length && src[i] !== '\n') {
          i += 1;
        }
        continue;
      }

      out += ch;
      i += 1;
    }

    return out;
  }

  function normalizeVisibilityToken(rawVis) {
    if (!rawVis) return '';
    const v = normKeyword(rawVis);
    if (v === '+' || v === 'PUBLIC' || v === normKeyword('ΔΗΜΟΣΙΟ')) return '+';
    if (v === '-' || v === 'PRIVATE' || v === normKeyword('ΙΔΙΩΤΙΚΟ')) return '-';
    if (v === '#' || v === 'PROTECTED' || v === normKeyword('ΠΡΟΣΤΑΤΕΥΜΕΝΟ')) return '#';
    return '';
  }

  function visWordEAP(vis, fallbackVis) {
    const eff = vis || fallbackVis || '';
    if (eff === '+') return 'PUBLIC';
    if (eff === '-') return 'PRIVATE';
    if (eff === '#') return 'PROTECTED';
    return '';
  }

  function isClassStartWord(w) {
    const kw = normKeyword(w);
    return kw === normKeyword('ΚΛΑΣΗ') || kw === 'CLASS';
  }

  function isClassEndLine(trimmed) {
    const kw = normKeyword(trimmed.replace(/;+$/, '').trim());
    return (
      kw === '}' ||
      kw === normKeyword('ΤΕΛΟΣ') ||
      kw === normKeyword('ΤΕΛΟΣ ΚΛΑΣΗΣ') ||
      kw === normKeyword('ΤΕΛΟΣ_ΚΛΑΣΗΣ') ||
      kw === 'END' ||
      kw === 'END_CLASS' ||
      kw === 'END CLASS'
    );
  }

  function parseSectionHeader(trimmed) {
    const cleaned = normKeyword(trimmed.replace(/[:;]+$/, '').trim());
    if (
      cleaned === normKeyword('ΚΑΤΗΓΟΡΗΜΑΤΑ') ||
      cleaned === normKeyword('ΙΔΙΟΤΗΤΕΣ') ||
      cleaned === 'ATTRIBUTES'
    ) {
      return 'attributes';
    }
    if (
      cleaned === normKeyword('ΜΕΘΟΔΟΙ') ||
      cleaned === normKeyword('ΛΕΙΤΟΥΡΓΙΕΣ') ||
      cleaned === 'METHODS'
    ) {
      return 'methods';
    }
    return null;
  }

  function isRelationsHeaderLine(trimmed) {
    const cleaned = normKeyword(trimmed.replace(/[:;{]+$/, '').trim());
    return cleaned === normKeyword('ΣΧΕΣΕΙΣ') || cleaned === 'RELATIONS' || cleaned === 'RELATIONSHIPS';
  }

  function parseClassHeader(trimmed) {
    // Strip trailing '{' or ':'
    let line = trimmed.replace(/\s*[\{:]\s*$/, '').trim();
    const parts = line.split(/\s+/);
    if (parts.length < 2 || !isClassStartWord(parts[0])) return null;

    const rest = line.slice(parts[0].length).trim();
    if (!rest) return { name: '', parents: [] };

    // Split optional ΕΠΕΚΤΕΙΝΕΙ / ΚΛΗΡΟΝΟΜΕΙ / EXTENDS / INHERITS
    const tokens = rest.split(/\s+/);
    let extendsIdx = -1;
    for (let i = 1; i < tokens.length; i++) {
      const k = normKeyword(tokens[i]);
      if (
        k === normKeyword('ΕΠΕΚΤΕΙΝΕΙ') ||
        k === normKeyword('ΚΛΗΡΟΝΟΜΕΙ') ||
        k === 'EXTENDS' ||
        k === 'INHERITS'
      ) {
        extendsIdx = i;
        break;
      }
    }

    if (extendsIdx === -1) {
      return { name: normalizeClassName(rest), parents: [] };
    }

    const name = normalizeClassName(tokens.slice(0, extendsIdx).join(' '));
    const parentsRaw = tokens.slice(extendsIdx + 1).join(' ');
    const parents = parentsRaw
      .split(',')
      .map((p) => normalizeClassName(p))
      .filter(Boolean);

    return { name, parents };
  }

  function extractLeadingVisibility(line) {
    let s = line.trim();
    let visibility = '';

    const symMatch = s.match(/^([+\-#])\s*(.+)$/);
    if (symMatch) {
      visibility = symMatch[1];
      s = symMatch[2].trim();
      return { visibility, rest: s };
    }

    const wordMatch = s.match(/^([^\s:()]+)\s+(.+)$/);
    if (wordMatch) {
      const v = normalizeVisibilityToken(wordMatch[1]);
      if (v) {
        visibility = v;
        s = wordMatch[2].trim();
      }
    }

    return { visibility, rest: s };
  }

  function parseMemberLine(rawLine, section, lineNum) {
    let s = rawLine.trim().replace(/;+\s*$/, '').trim();
    if (!s) return { items: [] };

    const { visibility, rest } = extractLeadingVisibility(s);
    if (!rest) {
      return { error: `Ελλιπής δήλωση μέλους στη γραμμή ${lineNum}.` };
    }

    const hasParens = /\([^)]*\)/.test(rest);
    const isMethod = section === 'methods' || (section === null && hasParens);

    if (isMethod) {
      let name = rest;
      let params = '';
      let returnType = '';

      if (hasParens) {
        const openIdx = rest.indexOf('(');
        const closeIdx = rest.lastIndexOf(')');
        if (closeIdx > openIdx) {
          name = normalizeClassName(rest.slice(0, openIdx));
          params = rest.slice(openIdx + 1, closeIdx).trim();
          const tail = rest.slice(closeIdx + 1).trim();
          if (tail.startsWith(':')) {
            returnType = normalizeClassName(tail.slice(1));
          }
        }
      } else {
        const colonIdx = rest.indexOf(':');
        if (colonIdx !== -1) {
          name = normalizeClassName(rest.slice(0, colonIdx));
          returnType = normalizeClassName(rest.slice(colonIdx + 1));
        } else {
          name = normalizeClassName(rest);
        }
      }

      if (!name) {
        return { error: `Μη έγκυρο όνομα μεθόδου στη γραμμή ${lineNum}.` };
      }

      return {
        kind: 'method',
        items: [{
          visibility,
          name,
          params,
          returnType,
          line: lineNum
        }]
      };
    }

    // Attribute(s): [name1, name2 ...] [: Type]
    let leftPart = rest;
    let type = '';
    const colonIdx = rest.indexOf(':');
    if (colonIdx !== -1) {
      leftPart = rest.slice(0, colonIdx).trim();
      type = normalizeClassName(rest.slice(colonIdx + 1));
    }

    const names = leftPart
      .split(',')
      .map((n) => normalizeClassName(n))
      .filter(Boolean);

    if (names.length === 0) {
      return { error: `Μη έγκυρο όνομα κατηγορήματος στη γραμμή ${lineNum}.` };
    }

    return {
      kind: 'attribute',
      items: names.map((name) => ({
        visibility,
        name,
        type,
        line: lineNum
      }))
    };
  }

  function unquoteMult(m) {
    if (!m) return '';
    return String(m).trim().replace(/^["']|["']$/g, '').trim();
  }

  function extractLeftNameAndMult(raw) {
    let s = raw.trim();
    let mult = '';
    const parenMatch = s.match(/^(.*?)\(([^()]+)\)\s*$/);
    if (parenMatch) {
      s = parenMatch[1].trim();
      mult = parenMatch[2].trim();
    } else {
      const quoteMatch = s.match(/^(.*?)"([^"]+)"\s*$/);
      if (quoteMatch) {
        s = quoteMatch[1].trim();
        mult = quoteMatch[2].trim();
      }
    }
    return { name: normalizeClassName(s), mult: unquoteMult(mult) };
  }

  function extractRightNameMultLabel(raw) {
    let s = raw.trim();
    let colonLabel = '';

    const colonIdx = s.indexOf(':');
    if (colonIdx !== -1) {
      colonLabel = normalizeClassName(s.slice(colonIdx + 1));
      s = s.slice(0, colonIdx).trim();
    }

    let mult = '';
    const parenMatch = s.match(/^\(([^()]+)\)\s*(.+)$/);
    if (parenMatch) {
      mult = parenMatch[1].trim();
      s = parenMatch[2].trim();
    } else {
      const quoteMatch = s.match(/^"([^"]+)"\s*(.+)$/);
      if (quoteMatch) {
        mult = quoteMatch[1].trim();
        s = quoteMatch[2].trim();
      }
    }

    return {
      name: normalizeClassName(s),
      mult: unquoteMult(mult),
      colonLabel
    };
  }

  const SYMBOL_OPERATORS = [
    { token: '<*>--', kind: 'composition', dir: 'forward' },
    { token: '--<*>', kind: 'composition', dir: 'reverse' },
    { token: '<>--', kind: 'aggregation', dir: 'forward' },
    { token: '--<>', kind: 'aggregation', dir: 'reverse' },
    { token: '*--', kind: 'composition', dir: 'forward' },
    { token: '--*', kind: 'composition', dir: 'reverse' },
    { token: 'o--', kind: 'aggregation', dir: 'forward' },
    { token: '--o', kind: 'aggregation', dir: 'reverse' },
    { token: '--|>', kind: 'inheritance', dir: 'forward' }, // Child --|> Parent
    { token: '<|--', kind: 'inheritance', dir: 'reverse' }, // Parent <|-- Child
    { token: '..>', kind: 'dependency', dir: 'forward' },
    { token: '<..', kind: 'dependency', dir: 'reverse' },
    { token: '-->', kind: 'association', dir: 'forward' },
    { token: '--', kind: 'association', dir: 'forward' },
    { token: '->', kind: 'keyword_arrow', dir: 'forward' }
  ];

  function findSymbolicOperator(line) {
    for (let i = 0; i < line.length; i++) {
      for (const op of SYMBOL_OPERATORS) {
        if (line.startsWith(op.token, i)) {
          return { op, index: i };
        }
      }
    }
    return null;
  }

  function parseRelationLine(rawLine, lineNum) {
    let s = rawLine.trim().replace(/;+\s*$/, '').trim();
    if (!s) return null;

    // 1. Extract optional association class ":: AssocClass" from the end
    let assocClass = '';
    const assocIdx = s.lastIndexOf('::');
    if (assocIdx !== -1) {
      assocClass = normalizeClassName(s.slice(assocIdx + 2));
      s = s.slice(0, assocIdx).trim();
    }

    // 2. Check optional Greek/English prefix keyword
    let kwKind = null;
    const kwMatch = s.match(/^([^\s:]+)\s+(.+)$/);
    if (kwMatch) {
      const kw = normKeyword(kwMatch[1]);
      if (kw === normKeyword('ΣΥΣΧΕΤΙΣΗ') || kw === 'ASSOCIATION') kwKind = 'association';
      else if (kw === normKeyword('ΣΥΝΑΡΜΟΓΗ') || kw === 'AGGREGATION') kwKind = 'aggregation';
      else if (kw === normKeyword('ΣΥΝΘΕΣΗ') || kw === 'COMPOSITION') kwKind = 'composition';
      else if (kw === normKeyword('ΚΛΗΡΟΝΟΜΙΚΟΤΗΤΑ') || kw === normKeyword('ΚΛΗΡΟΝΟΜΗΣΗ') || kw === 'INHERITANCE') kwKind = 'inheritance';
      else if (kw === normKeyword('ΕΞΑΡΤΗΣΗ') || kw === 'DEPENDENCY') kwKind = 'dependency';
      if (kwKind) {
        s = kwMatch[2].trim();
        // Support "ΣΥΣΧΕΤΙΣΗ Σύμβαση (Εταιρεία, Υπάλληλος)" syntax
        if (kwKind === 'association' && !findSymbolicOperator(s)) {
          const fnStyle = s.match(/^(.+?)\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)(?:\s*:\s*(.+))?$/);
          if (fnStyle) {
            const acName = normalizeClassName(fnStyle[1]);
            const fName = normalizeClassName(fnStyle[2]);
            const tName = normalizeClassName(fnStyle[3]);
            const lbl = fnStyle[4] ? normalizeClassName(fnStyle[4]) : acName;
            if (acName && fName && tName) {
              return {
                relations: [{
                  kind: 'association',
                  from: fName,
                  to: tName,
                  fromMult: '1..*',
                  toMult: '1..*',
                  label: lbl,
                  assocClass: acName,
                  line: lineNum
                }]
              };
            }
          }
        }
      }
    }

    // Support standalone "<Child> ΚΛΗΡΟΝΟΜΕΙ <Parent>" or "<Child> ΕΠΕΚΤΕΙΝΕΙ <Parent>"
    if (!kwKind) {
      const inhWords = s.match(/^(.+?)\s+(ΚΛΗΡΟΝΟΜΕΙ|ΕΠΕΚΤΕΙΝΕΙ|EXTENDS|INHERITS)\s+(.+)$/i);
      if (inhWords) {
        const leftName = normalizeClassName(inhWords[1]);
        const rightName = normalizeClassName(inhWords[3]);
        if (leftName && rightName) {
          return {
            relations: [{
              kind: 'inheritance',
              from: leftName,
              to: rightName,
              fromMult: '',
              toMult: '',
              label: '',
              assocClass: '',
              line: lineNum
            }]
          };
        }
      }
    }

    // 3. Handle inline bracket label right after operator: e.g. "-- [έχει] --" or "<>-- [απαρτίζεται] --"
    let inlineLabel = '';
    const inlineBracketRegex = /(<\*>--|--<\*>|<>--|--<>|\*--|--\*|o--|--o|--\|>|<\|--|\.\.>|\<\.\.|-->|--|->)\s*\[([^\]]+)\]\s*(?:--|->)?/;
    const inlineMatch = s.match(inlineBracketRegex);
    if (inlineMatch) {
      inlineLabel = normalizeClassName(inlineMatch[2]);
      s = s.replace(inlineMatch[0], ` ${inlineMatch[1]} `);
    }

    // 4. Find operator token
    const found = findSymbolicOperator(s);
    if (!found) {
      return { error: `Αναμένεται τελεστής σχέσης (--, <>--, *--, --|>, <|--, ..>) στη γραμμή ${lineNum}.` };
    }

    const leftRaw = s.slice(0, found.index).trim();
    const rightRaw = s.slice(found.index + found.op.token.length).trim();

    const leftParsed = extractLeftNameAndMult(leftRaw);
    const rightParsed = extractRightNameMultLabel(rightRaw);

    if (!leftParsed.name || !rightParsed.name) {
      return { error: `Λείπει όνομα κλάσης στη σχέση της γραμμής ${lineNum}.` };
    }

    // Determine effective kind and direction
    let kind = found.op.kind;
    let dir = found.op.dir;

    if (kind === 'keyword_arrow') {
      kind = kwKind || 'dependency';
      dir = 'forward';
    } else if (kwKind && found.op.token === '--') {
      kind = kwKind;
      dir = 'forward';
    } else if (kwKind && kind !== kwKind) {
      // Prefix keyword overrides generic association; keep arrow direction if explicit
      kind = kwKind;
    }

    const label = inlineLabel || rightParsed.colonLabel || '';

    // Support comma-separated targets on <|-- e.g. "Πελάτης <|-- Ιδιώτης, Επιχείρηση"
    if (kind === 'inheritance' && dir === 'reverse' && rightParsed.name.includes(',')) {
      const children = rightParsed.name.split(',').map((c) => normalizeClassName(c)).filter(Boolean);
      return {
        relations: children.map((child) => ({
          kind: 'inheritance',
          from: child,
          to: leftParsed.name,
          fromMult: rightParsed.mult,
          toMult: leftParsed.mult,
          label,
          assocClass: '',
          line: lineNum
        }))
      };
    }

    let from = leftParsed.name;
    let to = rightParsed.name;
    let fromMult = leftParsed.mult;
    let toMult = rightParsed.mult;

    if (dir === 'reverse') {
      from = rightParsed.name;
      to = leftParsed.name;
      fromMult = rightParsed.mult;
      toMult = leftParsed.mult;
    }

    return {
      relations: [{
        kind,
        from,
        to,
        fromMult,
        toMult,
        label,
        assocClass: kind === 'association' ? assocClass : '',
        line: lineNum
      }]
    };
  }

  function parseClassDSL(source) {
    const clean = stripCommentsPreserveLines(source);
    const lines = clean.split('\n');

    const classes = [];
    const relations = [];
    const parseErrors = [];

    let currentClass = null;
    let currentSection = null;
    let inRelationsSection = false;

    for (let idx = 0; idx < lines.length; idx++) {
      const lineNum = idx + 1;
      const trimmed = lines[idx].trim();
      if (!trimmed) continue;

      if (currentClass) {
        if (isClassEndLine(trimmed)) {
          classes.push(currentClass);
          currentClass = null;
          currentSection = null;
          continue;
        }

        const headerCheck = parseClassHeader(trimmed);
        if (headerCheck) {
          parseErrors.push({
            code: 'C01',
            severity: 'error',
            line: currentClass.line,
            message: `Η κλάση «${currentClass.name}» δεν έκλεισε με ΤΕΛΟΣ πριν ξεκινήσει η «${headerCheck.name}».`,
            hint: 'Προσθέστε ΤΕΛΟΣ στο τέλος κάθε κλάσης.'
          });
          classes.push(currentClass);
          currentClass = {
            id: `cls_${classes.length + 1}`,
            name: headerCheck.name,
            parents: headerCheck.parents,
            attributes: [],
            methods: [],
            line: lineNum,
            isImplicit: false
          };
          currentSection = null;
          continue;
        }

        const sec = parseSectionHeader(trimmed);
        if (sec) {
          currentSection = sec;
          continue;
        }

        const memberRes = parseMemberLine(trimmed, currentSection, lineNum);
        if (memberRes.error) {
          parseErrors.push({
            code: 'C01',
            severity: 'error',
            line: lineNum,
            message: memberRes.error,
            hint: 'Χρησιμοποιήστε π.χ. PRIVATE όνομα: Τύπος; ή PUBLIC μέθοδος();'
          });
        } else if (memberRes.kind === 'method') {
          currentClass.methods.push(...memberRes.items);
        } else if (memberRes.kind === 'attribute') {
          currentClass.attributes.push(...memberRes.items);
        }
        continue;
      }

      // Top-level (outside ΚΛΑΣΗ ... ΤΕΛΟΣ)
      if (isRelationsHeaderLine(trimmed)) {
        inRelationsSection = true;
        continue;
      }

      const clsHeader = parseClassHeader(trimmed);
      if (clsHeader) {
        inRelationsSection = false;
        if (!clsHeader.name) {
          parseErrors.push({
            code: 'C01',
            severity: 'error',
            line: lineNum,
            message: `Λείπει το όνομα της κλάσης μετά το ΚΛΑΣΗ στη γραμμή ${lineNum}.`,
            hint: 'Παράδειγμα: ΚΛΑΣΗ Πελάτης'
          });
        }
        currentClass = {
          id: `cls_${classes.length + 1}`,
          name: clsHeader.name || `ΑνώνυμηΚλάση_${lineNum}`,
          parents: clsHeader.parents,
          attributes: [],
          methods: [],
          line: lineNum,
          isImplicit: false
        };
        currentSection = null;
        continue;
      }

      const relRes = parseRelationLine(trimmed, lineNum);
      if (relRes && relRes.relations) {
        relations.push(...relRes.relations);
      } else {
        parseErrors.push({
          code: 'C01',
          severity: 'error',
          line: lineNum,
          message: (relRes && relRes.error) || `Μη αναγνωρίσιμη γραμμή ${lineNum}: «${trimmed}».`,
          hint: inRelationsSection
            ? 'Παράδειγμα σχέσης: Πελάτης (1) -- (0..*) Αποστολή : πραγματοποιεί'
            : 'Ξεκινήστε κλάση με «ΚΛΑΣΗ Όνομα» ή προσθέστε σχέση στην ενότητα «ΣΧΕΣΕΙΣ».'
        });
      }
    }

    if (currentClass) {
      parseErrors.push({
        code: 'C01',
        severity: 'error',
        line: currentClass.line,
        message: `Η κλάση «${currentClass.name}» δεν έκλεισε με ΤΕΛΟΣ στο τέλος του αρχείου.`,
        hint: 'Προσθέστε ΤΕΛΟΣ μετά τα κατηγορήματα και τις μεθόδους.'
      });
      classes.push(currentClass);
    }

    // Build canonical name map so canonical references resolve consistently
    const classByKey = new Map();
    for (const cls of classes) {
      const k = canonicalKey(cls.name);
      if (!classByKey.has(k)) {
        classByKey.set(k, cls);
      }
    }

    function ensureClassExists(name, refLine) {
      const norm = normalizeClassName(name);
      if (!norm) return null;
      const k = canonicalKey(norm);
      if (classByKey.has(k)) {
        return classByKey.get(k);
      }
      const imp = {
        id: `cls_${classes.length + 1}`,
        name: norm,
        parents: [],
        attributes: [],
        methods: [],
        line: refLine || 1,
        isImplicit: true
      };
      classes.push(imp);
      classByKey.set(k, imp);
      return imp;
    }

    // Add deduplicated inheritance relations from ΕΠΕΚΤΕΙΝΕΙ headers
    const relKeySet = new Set();
    const normalizedRelations = [];

    function pushRelation(rel, relIndexHint) {
      const fromCls = ensureClassExists(rel.from, rel.line);
      const toCls = ensureClassExists(rel.to, rel.line);
      if (!fromCls || !toCls) return;
      if (rel.assocClass) ensureClassExists(rel.assocClass, rel.line);

      const canonFrom = fromCls.name;
      const canonTo = toCls.name;
      const assocName = rel.assocClass ? ensureClassExists(rel.assocClass, rel.line).name : '';

      const dedupKey = [
        rel.kind,
        canonicalKey(canonFrom),
        canonicalKey(canonTo),
        rel.kind === 'inheritance' ? '' : canonicalKey(rel.label || ''),
        rel.fromMult || '',
        rel.toMult || '',
        canonicalKey(assocName)
      ].join('|');

      if (relKeySet.has(dedupKey)) return;
      relKeySet.add(dedupKey);

      normalizedRelations.push({
        id: `rel_${normalizedRelations.length + 1}`,
        kind: rel.kind,
        from: canonFrom,
        to: canonTo,
        fromId: fromCls.id,
        toId: toCls.id,
        fromMult: rel.fromMult || '',
        toMult: rel.toMult || '',
        label: rel.label || '',
        assocClass: assocName,
        assocClassId: assocName ? ensureClassExists(assocName, rel.line).id : '',
        fromExtends: Boolean(rel.fromExtends),
        line: rel.line || relIndexHint || 1
      });
    }

    // First explicit relations (keeping their line numbers and multiplicities if any)
    for (let i = 0; i < relations.length; i++) {
      pushRelation(relations[i], i + 1);
    }

    // Then ΕΠΕΚΤΕΙΝΕΙ parent links if not already explicitly listed in ΣΧΕΣΕΙΣ
    for (const cls of [...classes]) {
      if (cls.isImplicit) continue;
      for (const pName of cls.parents) {
        const parentCls = ensureClassExists(pName, cls.line);
        const inhKeyPrefix = `inheritance|${canonicalKey(cls.name)}|${canonicalKey(parentCls.name)}|`;
        let alreadyPresent = false;
        for (const existing of normalizedRelations) {
          if (
            existing.kind === 'inheritance' &&
            canonicalKey(existing.from) === canonicalKey(cls.name) &&
            canonicalKey(existing.to) === canonicalKey(parentCls.name)
          ) {
            alreadyPresent = true;
            existing.fromExtends = true;
            break;
          }
        }
        if (!alreadyPresent && !relKeySet.has(inhKeyPrefix)) {
          pushRelation({
            kind: 'inheritance',
            from: cls.name,
            to: parentCls.name,
            fromMult: '',
            toMult: '',
            label: '',
            assocClass: '',
            fromExtends: true,
            line: cls.line
          }, cls.line);
        }
      }
    }

    return {
      classes,
      relations: normalizedRelations,
      parseErrors,
      lineCount: lines.length
    };
  }

  // Multiplicity validator supporting UML & EAP textbook notation:
  // 0, 1, *, N, n, M, k, 0..*, 1..*, 0..1, 7..15, 0...N, or comma list e.g. "1, 3..5"
  function isValidSingleMultPart(part) {
    const p = part.trim();
    if (!p) return false;
    if (/^(\*|[0-9]+|[NnMmKk])$/.test(p)) return true;
    const rangeMatch = p.match(/^([0-9]+)\.{2,3}(\*|[0-9]+|[NnMmKk])$/);
    if (!rangeMatch) return false;
    const low = parseInt(rangeMatch[1], 10);
    const highToken = rangeMatch[2];
    if (/^[0-9]+$/.test(highToken)) {
      const high = parseInt(highToken, 10);
      return low <= high;
    }
    return true;
  }

  function isValidMultiplicity(mult) {
    const raw = String(mult || '').trim();
    if (!raw) return true; // optional (handled separately by W04)
    const parts = raw.split(',');
    return parts.every((p) => isValidSingleMultPart(p));
  }

  function validateClassModel(parsed) {
    const classes = parsed.classes || [];
    const relations = parsed.relations || [];
    const parseErrors = parsed.parseErrors || [];

    const diagnostics = [];

    // C01: Syntax errors
    for (const err of parseErrors) {
      diagnostics.push({
        severity: 'error',
        code: err.code || 'C01',
        line: err.line || 1,
        message: err.message,
        hint: err.hint || ''
      });
    }

    // C02: Duplicate class declarations
    const declaredByKey = new Map();
    for (const cls of classes) {
      if (cls.isImplicit) continue;
      const k = canonicalKey(cls.name);
      if (declaredByKey.has(k)) {
        const first = declaredByKey.get(k);
        diagnostics.push({
          severity: 'error',
          code: 'C02',
          line: cls.line || 1,
          message: `Διπλή δήλωση της κλάσης «${cls.name}» (ορίστηκε ήδη στη γραμμή ${first.line}).`,
          hint: 'Ενοποιήστε τα κατηγορήματα και τις μεθόδους σε έναν ορισμό κλάσης.'
        });
      } else {
        declaredByKey.set(k, cls);
      }
    }

    // C04 & W05 & I01: Class internals
    for (const cls of classes) {
      if (cls.isImplicit) {
        diagnostics.push({
          severity: 'warning',
          code: 'W03',
          line: cls.line || 1,
          fixAction: 'DECLARE_MISSING_CLASS',
          fixClass: cls.name,
          message: `Η κλάση «${cls.name}» αναφέρεται στις σχέσεις χωρίς να έχει δηλωθεί με ΚΛΑΣΗ.`,
          hint: `Προσθέστε μπλοκ «ΚΛΑΣΗ ${cls.name} ... ΤΕΛΟΣ» για να ορίσετε τα κατηγορήματά της.`
        });
        continue;
      }

      const seenAttrs = new Map();
      for (const attr of cls.attributes) {
        const ak = canonicalKey(attr.name);
        if (seenAttrs.has(ak)) {
          diagnostics.push({
            severity: 'error',
            code: 'C04',
            line: attr.line || cls.line,
            fixAction: 'REMOVE_LINE',
            message: `Διπλό κατηγόρημα «${attr.name}» στην κλάση «${cls.name}» (πρώτη δήλωση στη γραμμή ${seenAttrs.get(ak).line}).`,
            hint: 'Αφαιρέστε τη διπλή καταχώριση του κατηγορήματος.'
          });
        } else {
          seenAttrs.set(ak, attr);
        }

        if (attr.visibility === '+') {
          diagnostics.push({
            severity: 'warning',
            code: 'W05',
            line: attr.line || cls.line,
            fixAction: 'MAKE_ATTR_PRIVATE',
            message: `Το κατηγόρημα «${attr.name}» στην κλάση «${cls.name}» έχει ορατότητα PUBLIC (+).`,
            hint: 'Κατά την ΟΣΣ2 (ενθυλάκωση), τα κατηγορήματα είναι συνήθως PRIVATE (-).'
          });
        }
      }

      const seenMethods = new Map();
      for (const m of cls.methods) {
        const mk = `${canonicalKey(m.name)}(${normalizeClassName(m.params)})`;
        if (seenMethods.has(mk)) {
          diagnostics.push({
            severity: 'error',
            code: 'C04',
            line: m.line || cls.line,
            message: `Διπλή μέθοδος «${m.name}(${m.params})» στην κλάση «${cls.name}».`,
            hint: 'Μετονομάστε ή αφαιρέστε τη διπλή μέθοδο.'
          });
        } else {
          seenMethods.set(mk, m);
        }
      }

      if (cls.attributes.length === 0 && cls.methods.length === 0) {
        diagnostics.push({
          severity: 'info',
          code: 'I01',
          line: cls.line || 1,
          message: `Η κλάση «${cls.name}» δεν περιέχει κατηγορήματα ή μεθόδους.`,
          hint: 'Αν η εκφώνηση αναφέρει ιδιότητες για αυτή την κλάση, προσθέστε τες στην ενότητα ΚΑΤΗΓΟΡΗΜΑΤΑ.'
        });
      }
    }

    // Build inheritance graph for cycle detection (C03), duplicate inherited attrs (W01), multiple inheritance (W07)
    const inhParentsMap = new Map(); // childKey -> [{ parentKey, parentName, line }]
    for (const rel of relations) {
      if (rel.kind !== 'inheritance') continue;
      const ck = canonicalKey(rel.from);
      const pk = canonicalKey(rel.to);
      if (!inhParentsMap.has(ck)) inhParentsMap.set(ck, []);
      inhParentsMap.get(ck).push({ parentKey: pk, parentName: rel.to, line: rel.line });
    }

    // W07: Multiple inheritance
    for (const [ck, plist] of inhParentsMap.entries()) {
      const uniqueParents = new Set(plist.map((p) => p.parentKey));
      if (uniqueParents.size > 1) {
        const cls = declaredByKey.get(ck);
        diagnostics.push({
          severity: 'warning',
          code: 'W07',
          line: plist[0].line || (cls && cls.line) || 1,
          message: `Η κλάση «${(cls && cls.name) || ck}» κληρονομεί από πολλαπλές υπερκλάσεις (${plist.map((p) => p.parentName).join(', ')}).`,
          hint: 'Στα διαγράμματα ΠΛΗ11 προτιμάται απλή ιεραρχία κληρονομικότητας.'
        });
      }
    }

    // C03: Inheritance cycle detection
    const visitState = new Map(); // 0=unvisited, 1=visiting, 2=done
    const reportedCycleKeys = new Set();

    function dfsCycle(nodeKey, pathKeys) {
      visitState.set(nodeKey, 1);
      const parents = inhParentsMap.get(nodeKey) || [];
      for (const edge of parents) {
        const pKey = edge.parentKey;
        if (pKey === nodeKey) {
          if (!reportedCycleKeys.has(nodeKey)) {
            reportedCycleKeys.add(nodeKey);
            diagnostics.push({
              severity: 'error',
              code: 'C03',
              line: edge.line || 1,
              message: `Αυτο-κληρονομικότητα στην κλάση «${edge.parentName}».`,
              hint: 'Μια κλάση δεν μπορεί να επεκτείνει τον εαυτό της.'
            });
          }
          continue;
        }
        const st = visitState.get(pKey) || 0;
        if (st === 1) {
          const cycleStart = pathKeys.indexOf(pKey);
          const cycleNodes = pathKeys.slice(cycleStart >= 0 ? cycleStart : 0).concat(pKey);
          const sig = [...cycleNodes].sort().join('|');
          if (!reportedCycleKeys.has(sig)) {
            reportedCycleKeys.add(sig);
            const names = cycleNodes.map((k) => (declaredByKey.get(k) && declaredByKey.get(k).name) || k);
            diagnostics.push({
              severity: 'error',
              code: 'C03',
              line: edge.line || 1,
              message: `Κύκλος κληρονομικότητας: ${names.join(' -> ')}.`,
              hint: 'Η σχέση κληρονομικότητας («είναι-ένα-είδος») πρέπει να σχηματίζει ακυκλικό δέντρο.'
            });
          }
        } else if (st === 0) {
          dfsCycle(pKey, pathKeys.concat(pKey));
        }
      }
      visitState.set(nodeKey, 2);
    }

    for (const ck of inhParentsMap.keys()) {
      if ((visitState.get(ck) || 0) === 0) {
        dfsCycle(ck, [ck]);
      }
    }

    // W01: Duplicate attribute in subclass already present in ancestor
    for (const cls of classes) {
      if (cls.isImplicit) continue;
      const ck = canonicalKey(cls.name);
      const ancestors = [];
      const visitedAnc = new Set([ck]);
      const queue = [...(inhParentsMap.get(ck) || [])];
      while (queue.length > 0) {
        const item = queue.shift();
        if (visitedAnc.has(item.parentKey)) continue;
        visitedAnc.add(item.parentKey);
        const pCls = declaredByKey.get(item.parentKey);
        if (pCls) ancestors.push(pCls);
        const nextParents = inhParentsMap.get(item.parentKey) || [];
        for (const np of nextParents) queue.push(np);
      }

      if (ancestors.length === 0) continue;
      const ancAttrMap = new Map();
      for (const anc of ancestors) {
        for (const a of anc.attributes) {
          ancAttrMap.set(canonicalKey(a.name), anc.name);
        }
      }

      for (const a of cls.attributes) {
        const ak = canonicalKey(a.name);
        if (ancAttrMap.has(ak)) {
          diagnostics.push({
            severity: 'warning',
            code: 'W01',
            line: a.line || cls.line,
            fixAction: 'REMOVE_LINE',
            message: `Το κατηγόρημα «${a.name}» επαναλαμβάνεται στην υποκλάση «${cls.name}», ενώ κληρονομείται ήδη από την «${ancAttrMap.get(ak)}».`,
            hint: 'Σύμφωνα με το ΕΑΠ, στην υποκλάση δηλώνουμε μόνο τα επιπρόσθετα (τοπικά) κατηγορήματα.'
          });
        }
      }
    }

    // Relations checks: C05, W04, W06 & connected tracking for W02
    const connectedKeys = new Set();
    let missingMultCount = 0;
    let missingLabelCount = 0;

    for (const rel of relations) {
      connectedKeys.add(canonicalKey(rel.from));
      connectedKeys.add(canonicalKey(rel.to));
      if (rel.assocClass) connectedKeys.add(canonicalKey(rel.assocClass));

      if (rel.fromMult && !isValidMultiplicity(rel.fromMult)) {
        diagnostics.push({
          severity: 'error',
          code: 'C05',
          line: rel.line || 1,
          message: `Μη έγκυρη πληθικότητα «${rel.fromMult}» στη σχέση «${rel.from}» - «${rel.to}».`,
          hint: 'Χρησιμοποιήστε τιμές όπως 1, 0..1, 1..*, 0..*, *, ή εύρος (π.χ. 7..15).'
        });
      }
      if (rel.toMult && !isValidMultiplicity(rel.toMult)) {
        diagnostics.push({
          severity: 'error',
          code: 'C05',
          line: rel.line || 1,
          message: `Μη έγκυρη πληθικότητα «${rel.toMult}» στη σχέση «${rel.from}» - «${rel.to}».`,
          hint: 'Χρησιμοποιήστε τιμές όπως 1, 0..1, 1..*, 0..*, *, ή εύρος (π.χ. 7..15).'
        });
      }

      if (rel.kind === 'inheritance' && (rel.fromMult || rel.toMult)) {
        diagnostics.push({
          severity: 'warning',
          code: 'W06',
          line: rel.line || 1,
          message: `Δεν σημειώνονται πληθικότητες στη σχέση κληρονομικότητας «${rel.from}» -> «${rel.to}».`,
          hint: 'Αφαιρέστε τις πληθικότητες από τη γενίκευση/κληρονομικότητα.'
        });
      }

      if (rel.kind === 'association') {
        if (!rel.fromMult || !rel.toMult) {
          missingMultCount++;
          diagnostics.push({
            severity: 'warning',
            code: 'W04',
            line: rel.line || 1,
            message: `Η συσχέτιση «${rel.from}» - «${rel.to}» δεν έχει πλήρεις πληθικότητες και στα δύο άκρα.`,
            hint: 'Στις ΓΕ1 ζητούνται οι πληθικότητες και στα δύο άκρα κάθε συσχέτισης (π.χ. (1) και (0..*)).'
          });
        }
        if (!rel.label) {
          missingLabelCount++;
          diagnostics.push({
            severity: 'warning',
            code: 'W04',
            line: rel.line || 1,
            message: `Η συσχέτιση «${rel.from}» - «${rel.to}» δεν έχει όνομα (ετικέτα ρήματος).`,
            hint: 'Προσθέστε περιγραφικό όνομα συσχέτισης, π.χ. «: πραγματοποιεί».'
          });
        }
      }
    }

    // W02: Orphan / disconnected classes when total >= 2
    if (classes.length >= 2) {
      for (const cls of classes) {
        if (!connectedKeys.has(canonicalKey(cls.name))) {
          diagnostics.push({
            severity: 'warning',
            code: 'W02',
            line: cls.line || 1,
            message: `Η κλάση «${cls.name}» είναι απομονωμένη (δεν συνδέεται με καμία σχέση).`,
            hint: 'Συνδέστε την κλάση με συσχέτιση, συναρμογή ή κληρονομικότητα.'
          });
        }
      }
    }

    const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
    const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
    const infoCount = diagnostics.filter((d) => d.severity === 'info').length;

    const hasCode = (c) => diagnostics.some((d) => d.code === c);
    const checklist = [
      {
        id: 'classes',
        label: 'Ορισμοί Κλάσεων',
        ok: !hasCode('C01') && !hasCode('C02') && !hasCode('C04') && !hasCode('W03'),
        status: (hasCode('C01') || hasCode('C02') || hasCode('C04')) ? 'fail' : (hasCode('W03') ? 'warn' : 'pass'),
        detail: (hasCode('C01') || hasCode('C02') || hasCode('C04'))
          ? 'Υπάρχουν συντακτικά σφάλματα ή διπλές δηλώσεις.'
          : (hasCode('W03') ? 'Υπάρχουν άρρητα δηλωμένες κλάσεις στις σχέσεις.' : 'Όλες οι κλάσεις είναι ορθά δηλωμένες.')
      },
      {
        id: 'inheritance',
        label: 'Ιεραρχία Κληρονομικότητας',
        ok: !hasCode('C03') && !hasCode('W01') && !hasCode('W06') && !hasCode('W07'),
        status: hasCode('C03') ? 'fail' : ((hasCode('W01') || hasCode('W06') || hasCode('W07')) ? 'warn' : 'pass'),
        detail: hasCode('C03') ? 'Εντοπίστηκε κύκλος κληρονομικότητας.' : ((hasCode('W01') || hasCode('W06') || hasCode('W07')) ? 'Ελέγξτε επαναλαμβανόμενα πεδία ή πολλαπλή κληρονομικότητα.' : 'Καθαρή ιεραρχία κληρονομικότητας.')
      },
      {
        id: 'multiplicities',
        label: 'Πληθικότητες Συσχετίσεων',
        ok: !hasCode('C05') && missingMultCount === 0,
        status: hasCode('C05') ? 'fail' : (missingMultCount > 0 ? 'warn' : 'pass'),
        detail: hasCode('C05') ? 'Μη έγκυρη μορφή πληθικότητας.' : (missingMultCount > 0 ? 'Λείπουν πληθικότητες σε συσχετίσεις.' : 'Όλες οι συσχετίσεις έχουν έγκυρες πληθικότητες.')
      },
      {
        id: 'labels',
        label: 'Ονόματα Συσχετίσεων',
        ok: missingLabelCount === 0,
        status: missingLabelCount > 0 ? 'warn' : 'pass',
        detail: missingLabelCount > 0 ? 'Προσθέστε ονόματα στις απλές συσχετίσεις.' : 'Όλες οι απλές συσχετίσεις έχουν ονόματα.'
      },
      {
        id: 'cohesion',
        label: 'Συνεκτικότητα Μοντέλου',
        ok: !hasCode('W02'),
        status: hasCode('W02') ? 'warn' : 'pass',
        detail: hasCode('W02') ? 'Υπάρχουν απομονωμένες κλάσεις χωρίς σχέσεις.' : 'Όλες οι κλάσεις συμμετέχουν στο διάγραμμα.'
      },
      {
        id: 'encapsulation',
        label: 'Ενθυλάκωση (ΟΣΣ2)',
        ok: !hasCode('W05'),
        status: hasCode('W05') ? 'warn' : 'pass',
        detail: hasCode('W05') ? 'Υπάρχουν PUBLIC κατηγορήματα.' : 'Συμβατό με αρχές ενθυλάκωσης ΟΣΣ2.'
      }
    ];

    return {
      valid: errorCount === 0,
      summary: { errorCount, warningCount, infoCount },
      errorCount,
      warningCount,
      infoCount,
      diagnostics,
      checklist
    };
  }

  function formatMemberVisibility(vis) {
    if (vis === '-') return 'PRIVATE ';
    if (vis === '+') return 'PUBLIC ';
    if (vis === '#') return 'PROTECTED ';
    return '';
  }

  function formatAttributeLine(attr, visOverride) {
    const visText = visOverride !== undefined ? visOverride : formatMemberVisibility(attr.visibility);
    const typeText = attr.type ? `: ${attr.type}` : '';
    return `    ${visText}${attr.name}${typeText};`;
  }

  function formatMethodLine(m, visOverride) {
    const visText = visOverride !== undefined ? visOverride : formatMemberVisibility(m.visibility);
    const retText = m.returnType ? `: ${m.returnType}` : '';
    return `    ${visText}${m.name}(${m.params || ''})${retText};`;
  }

  function serializeToDSL(model) {
    const classes = (model && model.classes) || [];
    const relations = (model && model.relations) || [];

    // Group inheritance parents declared per child key
    const parentsByChild = new Map();
    const standaloneRelations = [];

    // Preserve parents from class.parents and inheritance relations
    const declaredKeys = new Set(classes.filter((c) => !c.isImplicit).map((c) => canonicalKey(c.name)));

    for (const cls of classes) {
      if (cls.isImplicit) continue;
      const ck = canonicalKey(cls.name);
      if (!parentsByChild.has(ck)) parentsByChild.set(ck, []);
      for (const p of cls.parents || []) {
        if (!parentsByChild.get(ck).some((x) => canonicalKey(x) === canonicalKey(p))) {
          parentsByChild.get(ck).push(p);
        }
      }
    }

    for (const rel of relations) {
      if (rel.kind === 'inheritance' && declaredKeys.has(canonicalKey(rel.from)) && !rel.fromMult && !rel.toMult) {
        const ck = canonicalKey(rel.from);
        if (!parentsByChild.has(ck)) parentsByChild.set(ck, []);
        if (!parentsByChild.get(ck).some((x) => canonicalKey(x) === canonicalKey(rel.to))) {
          parentsByChild.get(ck).push(rel.to);
        }
      } else {
        standaloneRelations.push(rel);
      }
    }

    const blocks = [];
    for (const cls of classes) {
      if (cls.isImplicit) continue;
      const ck = canonicalKey(cls.name);
      const parents = parentsByChild.get(ck) || [];
      const header = parents.length > 0
        ? `ΚΛΑΣΗ ${cls.name} ΕΠΕΚΤΕΙΝΕΙ ${parents.join(', ')}`
        : `ΚΛΑΣΗ ${cls.name}`;

      const lines = [header];
      if (cls.attributes && cls.attributes.length > 0) {
        lines.push('  ΚΑΤΗΓΟΡΗΜΑΤΑ');
        for (const a of cls.attributes) {
          lines.push(formatAttributeLine(a));
        }
      }
      if (cls.methods && cls.methods.length > 0) {
        lines.push('  ΜΕΘΟΔΟΙ');
        for (const m of cls.methods) {
          lines.push(formatMethodLine(m));
        }
      }
      lines.push('ΤΕΛΟΣ');
      blocks.push(lines.join('\n'));
    }

    if (standaloneRelations.length > 0) {
      const relLines = ['ΣΧΕΣΕΙΣ'];
      for (const rel of standaloneRelations) {
        const op =
          rel.kind === 'aggregation' ? '<>--' :
          rel.kind === 'composition' ? '*--' :
          rel.kind === 'inheritance' ? '--|>' :
          rel.kind === 'dependency' ? '..>' :
          '--';
        const leftMult = rel.fromMult ? ` (${rel.fromMult})` : '';
        const rightMult = rel.toMult ? `(${rel.toMult}) ` : '';
        const label = rel.label ? ` : ${rel.label}` : '';
        const assoc = rel.assocClass ? ` :: ${rel.assocClass}` : '';
        relLines.push(`  ${rel.from}${leftMult} ${op} ${rightMult}${rel.to}${label}${assoc}`);
      }
      blocks.push(relLines.join('\n'));
    }

    return blocks.join('\n\n');
  }

  // Generate Official EAP OO-Pseudocode per PLH11_OSS2_Intro_Object_Oriented.pdf (Slide 8)
  function generateOfficialEAPPseudocode(model, options = {}) {
    const defaultPrivate = options.defaultPrivateAttributes !== false;
    const includeConstructor = Boolean(options.includeConstructor);
    const includeRelationComments = options.includeRelationComments !== false;

    const classes = ((model && model.classes) || []).filter((c) => !c.isImplicit);
    const relations = (model && model.relations) || [];

    if (classes.length === 0) {
      return '// Δεν υπάρχουν δηλωμένες κλάσεις για εξαγωγή ψευδοκώδικα.';
    }

    // Map inheritance parents
    const parentsMap = new Map();
    const relNotesMap = new Map();
    for (const rel of relations) {
      const fk = canonicalKey(rel.from);
      const tk = canonicalKey(rel.to);
      if (rel.kind === 'inheritance') {
        if (!parentsMap.has(fk)) parentsMap.set(fk, []);
        if (!parentsMap.get(fk).includes(rel.to)) parentsMap.get(fk).push(rel.to);
      } else if (includeRelationComments) {
        if (!relNotesMap.has(fk)) relNotesMap.set(fk, []);
        if (rel.kind === 'aggregation' || rel.kind === 'composition') {
          relNotesMap.get(fk).push(`// Απαρτίζεται από: ${rel.to}${rel.toMult ? ` (${rel.toMult})` : ''}`);
        } else if (rel.kind === 'association') {
          relNotesMap.get(fk).push(`// Συσχετίζεται με: ${rel.to}${rel.label ? ` [${rel.label}]` : ''}${rel.toMult ? ` (${rel.toMult})` : ''}`);
        } else if (rel.kind === 'dependency') {
          relNotesMap.get(fk).push(`// Εξαρτάται από: ${rel.to}`);
        }
      }
    }

    const outBlocks = [];
    for (const cls of classes) {
      const ck = canonicalKey(cls.name);
      const parents = parentsMap.get(ck) || cls.parents || [];
      const header = parents.length > 0
        ? `ΚΛΑΣΗ ${cls.name} ΕΠΕΚΤΕΙΝΕΙ ${parents.join(', ')}`
        : `ΚΛΑΣΗ ${cls.name}`;

      const lines = [header];
      const notes = relNotesMap.get(ck) || [];
      for (const n of notes) lines.push(n);

      lines.push('ΚΑΤΗΓΟΡΗΜΑΤΑ');
      if (cls.attributes.length === 0) {
        lines.push('    // Δεν έχουν οριστεί τοπικά κατηγορήματα');
      } else {
        for (const a of cls.attributes) {
          const effVis = a.visibility || (defaultPrivate ? '-' : '');
          const visWord = visWordEAP(effVis, '');
          const prefix = visWord ? `${visWord} ` : '';
          const typeSuffix = a.type ? `: ${a.type.toUpperCase()}` : '';
          lines.push(`    ${prefix}${a.name}${typeSuffix};`);
        }
      }

      const hasExplicitCtor = cls.methods.some((m) => normKeyword(m.name) === normKeyword('ΔΗΜΙΟΥΡΓΟΣ'));
      if (cls.methods.length > 0 || includeConstructor) {
        lines.push('ΜΕΘΟΔΟΙ');
        if (includeConstructor && !hasExplicitCtor) {
          const ctorParams = cls.attributes.map((a) => a.name).join(', ');
          lines.push(`    PUBLIC ΔΗΜΙΟΥΡΓΟΣ (${ctorParams});`);
        }
        for (const m of cls.methods) {
          const effVis = m.visibility || '+';
          const visWord = visWordEAP(effVis, '+');
          const prefix = visWord ? `${visWord} ` : '';
          const ret = m.returnType ? `: ${m.returnType.toUpperCase()}` : '';
          lines.push(`    ${prefix}${m.name} (${m.params || ''})${ret};`);
        }
      }

      lines.push('ΤΕΛΟΣ');
      outBlocks.push(lines.join('\n'));
    }

    return outBlocks.join('\n\n');
  }

  function escapeMermaidLabel(str) {
    return String(str || '').replace(/"/g, "'").replace(/[\r\n]+/g, ' ').trim();
  }

  function generateMermaidClassDiagram(model, options = {}) {
    const hideVis = Boolean(options.hideVisibilities);
    const hideMethods = Boolean(options.hideMethods);
    const hideTypes = Boolean(options.hideTypes);

    const classes = (model && model.classes) || [];
    const relations = (model && model.relations) || [];

    if (classes.length === 0) {
      return 'classDiagram\n  class Empty["Κενό Διάγραμμα"]';
    }

    const idByKey = new Map();
    const usedIds = new Set();
    classes.forEach((cls, idx) => {
      let baseId = 'C_' + slugId(cls.name);
      if (!baseId || baseId === 'C_') baseId = `C_${idx + 1}`;
      let finalId = baseId;
      let n = 2;
      while (usedIds.has(finalId)) {
        finalId = `${baseId}_${n++}`;
      }
      usedIds.add(finalId);
      idByKey.set(canonicalKey(cls.name), finalId);
    });

    const lines = ['classDiagram'];

    for (const cls of classes) {
      const mid = idByKey.get(canonicalKey(cls.name));
      const label = escapeMermaidLabel(cls.name);
      const attrs = cls.attributes || [];
      const methods = hideMethods ? [] : (cls.methods || []);

      if (attrs.length === 0 && methods.length === 0) {
        lines.push(`  class ${mid}["${label}"]`);
      } else {
        lines.push(`  class ${mid}["${label}"] {`);
        for (const a of attrs) {
          const vis = hideVis ? '' : (a.visibility || '');
          const typeStr = !hideTypes && a.type ? `${a.type} ` : '';
          lines.push(`    ${vis}${typeStr}${a.name}`);
        }
        for (const m of methods) {
          const vis = hideVis ? '' : (m.visibility || '');
          const ret = !hideTypes && m.returnType ? ` ${m.returnType}` : '';
          lines.push(`    ${vis}${m.name}(${m.params || ''})${ret}`);
        }
        lines.push('  }');
      }
    }

    for (const rel of relations) {
      const fId = idByKey.get(canonicalKey(rel.from));
      const tId = idByKey.get(canonicalKey(rel.to));
      if (!fId || !tId) continue;

      if (rel.kind === 'inheritance') {
        lines.push(`  ${tId} <|-- ${fId}`);
        continue;
      }

      const op =
        rel.kind === 'aggregation' ? 'o--' :
        rel.kind === 'composition' ? '*--' :
        rel.kind === 'dependency' ? '..>' :
        '--';

      const m1 = rel.fromMult ? ` "${escapeMermaidLabel(rel.fromMult)}"` : '';
      const m2 = rel.toMult ? `"${escapeMermaidLabel(rel.toMult)}" ` : '';
      const lbl = rel.label ? ` : ${escapeMermaidLabel(rel.label)}` : '';
      lines.push(`  ${fId}${m1} ${op} ${m2}${tId}${lbl}`);

      if (rel.assocClass) {
        const aId = idByKey.get(canonicalKey(rel.assocClass));
        if (aId) {
          lines.push(`  ${fId} .. ${aId}`);
          lines.push(`  ${tId} .. ${aId}`);
        }
      }
    }

    return lines.join('\n');
  }

  function computeStats(model) {
    const classes = model.classes || [];
    const relations = model.relations || [];
    let attributes = 0;
    let methods = 0;
    for (const c of classes) {
      attributes += (c.attributes || []).length;
      methods += (c.methods || []).length;
    }
    return {
      classes: classes.length,
      inheritance: relations.filter((r) => r.kind === 'inheritance').length,
      aggregation: relations.filter((r) => r.kind === 'aggregation').length,
      composition: relations.filter((r) => r.kind === 'composition').length,
      association: relations.filter((r) => r.kind === 'association').length,
      dependency: relations.filter((r) => r.kind === 'dependency').length,
      attributes,
      methods
    };
  }

  function formatClassDSL(source) {
    const parsed = parseClassDSL(source);
    if (parsed.parseErrors && parsed.parseErrors.length > 0 && parsed.classes.length === 0) {
      return source;
    }
    return serializeToDSL(parsed);
  }

  function applyClassQuickFix(source, diag) {
    if (!diag || !diag.fixAction) return source;
    const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
    const idx = Math.max(0, Math.min(lines.length - 1, (diag.line || 1) - 1));

    if (diag.fixAction === 'DECLARE_MISSING_CLASS' && diag.fixClass) {
      const block = `ΚΛΑΣΗ ${diag.fixClass}\n  ΚΑΤΗΓΟΡΗΜΑΤΑ\n    κωδικός;\nΤΕΛΟΣ\n`;
      // Insert right before ΣΧΕΣΕΙΣ if present, else at top
      let relHeaderIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*(?:ΣΧΕΣΕΙΣ|RELATIONS)\s*$/i.test(lines[i])) {
          relHeaderIdx = i;
          break;
        }
      }
      if (relHeaderIdx >= 0) {
        lines.splice(relHeaderIdx, 0, block);
      } else {
        lines.unshift(block);
      }
    } else if (diag.fixAction === 'MAKE_ATTR_PRIVATE') {
      lines[idx] = (lines[idx] || '').replace(/^(\s*)(?:\+|PUBLIC\s+)/i, '$1PRIVATE ');
    } else if (diag.fixAction === 'REMOVE_LINE') {
      lines.splice(idx, 1);
    }
    return lines.join('\n');
  }

  function compileClassDiagram(source, options = {}) {
    const model = parseClassDSL(source);
    const validation = validateClassModel(model);
    const stats = computeStats(model);
    const officialPseudocode = generateOfficialEAPPseudocode(model, options.pseudocodeOptions);
    const mermaid = generateMermaidClassDiagram(model, options.mermaidOptions);

    return {
      model,
      validation,
      stats,
      officialPseudocode,
      mermaid
    };
  }

  return {
    normalizeClassName,
    canonicalKey,
    slugId,
    parseClassDSL,
    validateClassModel,
    applyClassQuickFix,
    serializeToDSL,
    formatClassDSL,
    generateOfficialEAPPseudocode,
    generateMermaidClassDiagram,
    compileClassDiagram,
    isValidMultiplicity
  };
}));
