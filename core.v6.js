// -----------------------------------------------------------------------------
// TOKENIZER
// -----------------------------------------------------------------------------
const TokenType = { 
    ALGORITHM: 'ALGORITHM', CONSTANTS: 'CONSTANTS', DATA: 'DATA', BEGIN: 'BEGIN', END: 'END', 
    IF: 'IF', THEN: 'THEN', ELSE: 'ELSE', FOR: 'FOR', TO: 'TO', STEP: 'STEP', 
    REPEAT: 'REPEAT', WHILE: 'WHILE', UNTIL: 'UNTIL', ARRAY: 'ARRAY', OF: 'OF', 
    TYPES: 'TYPES', PRINT: 'PRINT', READ: 'READ', CALCULATE: 'CALCULATE', 
    PROCEDURE: 'PROCEDURE', FUNCTION: 'FUNCTION', INTERFACE: 'INTERFACE', 
    INPUT: 'INPUT', OUTPUT: 'OUTPUT', MOD: 'MOD', DIV: 'DIV', AND: 'AND', OR: 'OR', NOT: 'NOT', 
    EOLN: 'EOLN', POINTER: 'POINTER', LIST: 'LIST', 
    INTEGER_TYPE: 'INTEGER_TYPE', REAL_TYPE: 'REAL_TYPE', BOOLEAN_TYPE: 'BOOLEAN_TYPE', 
    CHAR_TYPE: 'CHAR_TYPE', STRING_TYPE: 'STRING_TYPE', 
    ASSIGN: 'ASSIGN', PLUS: 'PLUS', MINUS: 'MINUS', MULTIPLY: 'MULTIPLY', DIVIDE: 'DIVIDE', 
    EQUALS: 'EQUALS', LESS_THAN: 'LESS_THAN', GREATER_THAN: 'GREATER_THAN', 
    LESS_EQUALS: 'LESS_EQUALS', GREATER_EQUALS: 'GREATER_EQUALS', NOT_EQUALS: 'NOT_EQUALS', 
    LEFT_PAREN: 'LEFT_PAREN', RIGHT_PAREN: 'RIGHT_PAREN', 
    LEFT_BRACKET: 'LEFT_BRACKET', RIGHT_BRACKET: 'RIGHT_BRACKET', 
    COMMA: 'COMMA', COLON: 'COLON', SEMICOLON: 'SEMICOLON', DOT: 'DOT', 
    CARET: 'CARET', PERCENT: 'PERCENT', 
    NUMBER: 'NUMBER', STRING: 'STRING', IDENTIFIER: 'IDENTIFIER', 
    BOOLEAN_LITERAL: 'BOOLEAN_LITERAL', EOF: 'EOF',
    SELECT: 'SELECT', CASE: 'CASE', END_SELECT: 'END_SELECT',
    RECORD: 'RECORD', END_RECORD: 'END_RECORD',
    END_IF: 'END_IF', END_FOR: 'END_FOR', END_WHILE: 'END_WHILE', 
    END_PROCEDURE: 'END_PROCEDURE', END_FUNCTION: 'END_FUNCTION' 
};

const GREEK_KEYWORDS = {
    'ΑΛΓΟΡΙΘΜΟΣ': TokenType.ALGORITHM, 'ΣΤΑΘΕΡΕΣ': TokenType.CONSTANTS,
    'ΔΕΔΟΜΕΝΑ': TokenType.DATA, 'ΑΡΧΗ': TokenType.BEGIN, 'ΤΕΛΟΣ': TokenType.END,
    'ΕΑΝ': TokenType.IF, 'ΤΟΤΕ': TokenType.THEN, 'ΑΛΛΙΩΣ': TokenType.ELSE,
    'ΕΠΙΛΕΞΕ': TokenType.SELECT, 'ΠΕΡΙΠΤΩΣΗ': TokenType.CASE,
    'ΕΠΙΛΕΞΕ-ΤΕΛΟΣ': TokenType.END_SELECT, 'ΤΕΛΟΣ-ΕΠΙΛΟΓΩΝ': TokenType.END_SELECT,
    'ΕΓΓΡΑΦΗ': TokenType.RECORD, 'ΤΕΛΟΣ-ΕΓΓΡΑΦΗΣ': TokenType.END_RECORD,
    'ΓΙΑ': TokenType.FOR, 'ΕΩΣ': TokenType.TO, 'ΜΕ': TokenType.STEP, 'ΒΗΜΑ': TokenType.STEP,
    'ΕΠΑΝΑΛΑΒΕ': TokenType.REPEAT, 'ΕΝΟΣΩ': TokenType.WHILE, 'ΜΕΧΡΙ': TokenType.UNTIL,
    'ΤΥΠΟΙ': TokenType.TYPES, 'ΤΥΠΩΣΕ': TokenType.PRINT, 'ΔΙΑΒΑΣΕ': TokenType.READ,
    'ΥΠΟΛΟΓΙΣΕ': TokenType.CALCULATE,
    'ΔΙΑΔΙΚΑΣΙΑ': TokenType.PROCEDURE, 'ΔΙΑΔΙΚΑΣΙΑΣ': TokenType.PROCEDURE,
    'ΣΥΝΑΡΤΗΣΗ': TokenType.FUNCTION, 'ΣΥΝΑΡΤΗΣΗΣ': TokenType.FUNCTION,
    'ΔΙΕΠΑΦΗ': TokenType.INTERFACE,
    'ΕΙΣΟΔΟΣ': TokenType.INPUT, 'ΕΞΟΔΟΣ': TokenType.OUTPUT,
    'ΑΚΕΡΑΙΟΣ': TokenType.INTEGER_TYPE, 'ΠΡΑΓΜΑΤΙΚΟΣ': TokenType.REAL_TYPE,
    'ΛΟΓΙΚΟΣ': TokenType.BOOLEAN_TYPE, 'ΧΑΡΑΚΤΗΡΑΣ': TokenType.CHAR_TYPE,
    'ΣΥΜΒΟΛΟΣΕΙΡΑ': TokenType.STRING_TYPE,
    'ΚΑΙ': TokenType.AND, 'Ή': TokenType.OR, 'ΟΧΙ': TokenType.NOT,
    'ΑΛΗΘΗΣ': TokenType.BOOLEAN_LITERAL, 'ΨΕΥΔΗΣ': TokenType.BOOLEAN_LITERAL,
    'ΕΑΝ-ΤΕΛΟΣ': TokenType.END_IF, 'ΓΙΑ-ΤΕΛΟΣ': TokenType.END_FOR, 
    'ΕΝΟΣΩ-ΤΕΛΟΣ': TokenType.END_WHILE, 'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ': TokenType.END_PROCEDURE, 
    'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ': TokenType.END_FUNCTION
};

const ENGLISH_KEYWORDS = {
    'ARRAY': TokenType.ARRAY, 'OF': TokenType.OF, 'MOD': TokenType.MOD, 'DIV': TokenType.DIV,
    'AND': TokenType.AND, 'OR': TokenType.OR, 'NOT': TokenType.NOT, 'EOLN': TokenType.EOLN,
    'POINTER': TokenType.POINTER, 'LIST': TokenType.LIST,
    'IF': TokenType.IF, 'THEN': TokenType.THEN, 'ELSE': TokenType.ELSE,
    'SELECT': TokenType.SELECT, 'CASE': TokenType.CASE,
    'END_SELECT': TokenType.END_SELECT, 'END-SELECT': TokenType.END_SELECT, 'END_CASE': TokenType.END_SELECT,
    'RECORD': TokenType.RECORD, 'END_RECORD': TokenType.END_RECORD, 'END-RECORD': TokenType.END_RECORD,
    'FOR': TokenType.FOR, 'TO': TokenType.TO, 'STEP': TokenType.STEP,
    'REPEAT': TokenType.REPEAT, 'WHILE': TokenType.WHILE, 'UNTIL': TokenType.UNTIL,
    'INTEGER': TokenType.INTEGER_TYPE, 'REAL': TokenType.REAL_TYPE,
    'BOOLEAN': TokenType.BOOLEAN_TYPE, 'CHAR': TokenType.CHAR_TYPE,
    'STRING': TokenType.STRING_TYPE,
    'TRUE': TokenType.BOOLEAN_LITERAL, 'FALSE': TokenType.BOOLEAN_LITERAL
};

const KEYWORDS = { ...GREEK_KEYWORDS, ...ENGLISH_KEYWORDS };

const OPERATORS = {
    ':=': TokenType.ASSIGN, '+': TokenType.PLUS, '-': TokenType.MINUS,
    '*': TokenType.MULTIPLY, '/': TokenType.DIVIDE, '=': TokenType.EQUALS,
    '<': TokenType.LESS_THAN, '>': TokenType.GREATER_THAN,
    '<=': TokenType.LESS_EQUALS, '>=': TokenType.GREATER_EQUALS, '<>': TokenType.NOT_EQUALS,
    '(': TokenType.LEFT_PAREN, ')': TokenType.RIGHT_PAREN,
    '[': TokenType.LEFT_BRACKET, ']': TokenType.RIGHT_BRACKET,
    ',': TokenType.COMMA, ':': TokenType.COLON, ';': TokenType.SEMICOLON,
    '.': TokenType.DOT, '^': TokenType.CARET, '%': TokenType.PERCENT
};

const COMPOUND_KEYWORDS = {
    'ΕΑΝ-ΤΕΛΟΣ': TokenType.END_IF, 
    'ΕΠΙΛΕΞΕ-ΤΕΛΟΣ': TokenType.END_SELECT,
    'ΤΕΛΟΣ-ΕΠΙΛΟΓΩΝ': TokenType.END_SELECT,
    'ΤΕΛΟΣ-ΕΓΓΡΑΦΗΣ': TokenType.END_RECORD,
    'END-SELECT': TokenType.END_SELECT,
    'END-RECORD': TokenType.END_RECORD,
    'ΓΙΑ-ΤΕΛΟΣ': TokenType.END_FOR, 
    'ΕΝΟΣΩ-ΤΕΛΟΣ': TokenType.END_WHILE, 
    'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ': TokenType.END_FUNCTION, 
    'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ': TokenType.END_PROCEDURE,
    'ΜΕ-ΒΗΜΑ': TokenType.STEP
};

function isLetter(c) { 
    return (c >= '\u0386' && c <= '\u03ce') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'); 
}

function isDigit(c) { return c >= '0' && c <= '9'; }

function removeAccents(s) { 
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
}

const HOMOGLYPH_MAP = {
    '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u0396': 'Z',
    '\u0397': 'H', '\u0399': 'I', '\u039A': 'K', '\u039C': 'M',
    '\u039D': 'N', '\u039F': 'O', '\u03A1': 'P', '\u03A4': 'T',
    '\u03A5': 'Y', '\u03A7': 'X'
};

function toHomoglyphKey(s) {
    const clean = removeAccents(String(s || '').toUpperCase());
    let out = '';
    for (let i = 0; i < clean.length; i++) {
        out += HOMOGLYPH_MAP[clean[i]] || clean[i];
    }
    return out;
}

const TOKEN_DISPLAY_NAMES = {
    [TokenType.ALGORITHM]: "'ΑΛΓΟΡΙΘΜΟΣ'",
    [TokenType.BEGIN]: "'ΑΡΧΗ'",
    [TokenType.END]: "'ΤΕΛΟΣ'",
    [TokenType.THEN]: "'ΤΟΤΕ'",
    [TokenType.ELSE]: "'ΑΛΛΙΩΣ'",
    [TokenType.END_IF]: "'ΕΑΝ-ΤΕΛΟΣ'",
    [TokenType.TO]: "'ΕΩΣ'",
    [TokenType.REPEAT]: "'ΕΠΑΝΑΛΑΒΕ'",
    [TokenType.END_FOR]: "'ΓΙΑ-ΤΕΛΟΣ'",
    [TokenType.END_WHILE]: "'ΕΝΟΣΩ-ΤΕΛΟΣ'",
    [TokenType.UNTIL]: "'ΜΕΧΡΙ'",
    [TokenType.END_PROCEDURE]: "'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ'",
    [TokenType.END_FUNCTION]: "'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ'",
    [TokenType.SEMICOLON]: "ερωτηματικό ';'",
    [TokenType.COLON]: "άνω-κάτω τελεία ':'",
    [TokenType.ASSIGN]: "τελεστής ανάθεσης ':='",
    [TokenType.LEFT_PAREN]: "αριστερή παρένθεση '('",
    [TokenType.RIGHT_PAREN]: "δεξιά παρένθεση ')'",
    [TokenType.LEFT_BRACKET]: "αγκύλη '['",
    [TokenType.RIGHT_BRACKET]: "αγκύλη ']'",
    [TokenType.IDENTIFIER]: "όνομα (αναγνωριστικό)",
    [TokenType.EOF]: "τέλος αρχείου"
};

function tokenize(code) {
    let tokens = [];
    let current = 0;
    let line = 1;
    let column = 1;
    
    while (current < code.length) {
        let char = code[current];
        
        if (/\s/.test(char)) {
            if (char === '\n') { line++; column = 1; } else { column++; }
            current++; 
            continue;
        }
        
        if (char === '/' && code[current + 1] === '/') {
            while (current < code.length && code[current] !== '\n') current++;
            continue;
        }
        
        if (char === '/' && code[current + 1] === '*') {
            current += 2;
            while (current < code.length && (code[current] !== '*' || code[current + 1] !== '/')) {
                if (code[current] === '\n') { line++; column = 1; } else { column++; }
                current++;
            }
            if(current < code.length) { current += 2; column += 2; } 
            continue;
        }
        
        // Check for compound keywords first
        let foundCompound = false;
        for (let [kw, type] of Object.entries(COMPOUND_KEYWORDS)) {
            const rawBlock = code.substring(current, current + kw.length);
            if (removeAccents(rawBlock.toUpperCase()) === removeAccents(kw)) {
                tokens.push({ type, value: rawBlock.toUpperCase(), line, column });
                current += kw.length;
                column += kw.length;
                foundCompound = true;
                break;
            }
        }
        if (foundCompound) continue;
        
        if (char === '"') {
            let value = ''; 
            current++;
            while (current < code.length && code[current] !== '"') { 
                value += code[current++]; 
            }
            current++;
            tokens.push({ type: TokenType.STRING, value, line, column });
            column += value.length + 2; 
            continue;
        }
        
        if (isDigit(char)) {
            let value = '';
            while (current < code.length && isDigit(code[current])) { 
                value += code[current++]; 
            }
            if (code[current] === '.' && isDigit(code[current + 1])) {
                value += code[current++];
                while (current < code.length && isDigit(code[current])) { 
                    value += code[current++]; 
                }
            }
            tokens.push({ type: TokenType.NUMBER, value: parseFloat(value), line, column });
            column += value.length; 
            continue;
        }
        
        let twoCharOp = code.substring(current, current + 2);
        if (OPERATORS[twoCharOp]) {
            tokens.push({ type: OPERATORS[twoCharOp], value: twoCharOp, line, column });
            current += 2; 
            column += 2; 
            continue;
        }
        
        if (OPERATORS[char]) {
            tokens.push({ type: OPERATORS[char], value: char, line, column });
            current++; 
            column++; 
            continue;
        }
        
        if (isLetter(char) || char === '_') {
            let value = '';
            let start = current;
            
            while (current < code.length && (isLetter(code[current]) || isDigit(code[current]) || code[current] === '_')) {
                value += code[current++];
            }

            const upperValue = removeAccents(value.toUpperCase());
            if (KEYWORDS[upperValue]) {
                tokens.push({ type: KEYWORDS[upperValue], value: value.toUpperCase(), line, column });
            } else {
                tokens.push({ type: TokenType.IDENTIFIER, value, line, column });
            }
            column += value.length; 
            continue;
        }
        
        throw new Error(`Μη αναγνωρίσιμος χαρακτήρας '${char}' [Γραμμή: ${line}, Στήλη: ${column}]`);
    }
    
    tokens.push({ type: TokenType.EOF, value: 'EOF', line, column });
    return tokens;
}

// -----------------------------------------------------------------------------
// PARSER
// -----------------------------------------------------------------------------

class Parser {
    constructor(tokens) { 
        this.tokens = tokens; 
        this.current = 0; 
    }
    
    isAtEnd() { return this.peek().type === TokenType.EOF; }
    peek() { return this.tokens[this.current]; }
    previous() { return this.tokens[this.current - 1]; }
    advance() { if (!this.isAtEnd()) this.current++; return this.previous(); }
    
    error(message, token) {
        token = token || this.peek();
        const locationInfo = `[Γραμμή: ${token.line}, Στήλη: ${token.column}]`;
        throw new Error(message ? `${message} ${locationInfo}` : `Συντακτικό σφάλμα ${locationInfo}`);
    }
    
    consume(type, message) {
        if (this.check(type)) return this.advance();
        const token = this.peek();
        const prev = this.current > 0 ? this.previous() : null;
        if (type === TokenType.SEMICOLON && prev && token.line > prev.line) {
            const prevLoc = `[Γραμμή: ${prev.line}, Στήλη: ${prev.column}]`;
            throw new Error(`${message || "Λείπει το ερωτηματικό ';' στο τέλος της δήλωσης."} (μετά το '${prev.value}') ${prevLoc}`);
        }
        const locationInfo = `[Γραμμή: ${token.line}, Στήλη: ${token.column}]`;
        const expName = TOKEN_DISPLAY_NAMES[type] || type;
        const gotDesc = token.type === TokenType.EOF ? 'το τέλος του προγράμματος' : `'${token.value}'`;
        throw new Error(message ? `${message} (βρέθηκε ${gotDesc}) ${locationInfo}` : 
            `Αναμενόταν ${expName}, αλλά βρέθηκε ${gotDesc} ${locationInfo}`);
    }
    
    check(type) { 
        if (this.isAtEnd()) return false; 
        return this.peek().type === type; 
    }
    
    match(...types) { 
        for (const type of types) { 
            if (this.check(type)) { 
                this.advance(); 
                return true; 
            } 
        } 
        return false; 
    }
    
    parse() { return this.parseProgram(); }
    
    parseProgram() {
        const startToken = this.peek();
        this.consume(TokenType.ALGORITHM, "Το πρόγραμμα πρέπει να ξεκινά με τη λέξη 'ΑΛΓΟΡΙΘΜΟΣ'.");
        const name = this.consume(TokenType.IDENTIFIER, "Αναμενόταν το όνομα του αλγορίθμου μετά το 'ΑΛΓΟΡΙΘΜΟΣ'.").value;
        const declarations = this.parseDeclarations();
        
        while(this.check(TokenType.PROCEDURE) || this.check(TokenType.FUNCTION)) {
            const beforePos = this.current;
            
            if (this.match(TokenType.PROCEDURE)) {
                declarations.push(this.parseProcedureDeclaration());
            } else if (this.match(TokenType.FUNCTION)){
                const funcDecl = this.parseFunctionDeclaration();
                // Only add if it's a complete function (has body or proper structure)
                if (funcDecl) {
                    declarations.push(funcDecl);
                }
            }
            
            // Safety check to prevent infinite loop
            if (this.current === beforePos) {
                this.error("Αδυναμία ανάλυσης υποπρογράμματος.");
            }
        }
        
        this.consume(TokenType.BEGIN, "Αναμενόταν η λέξη 'ΑΡΧΗ' για το κύριο σώμα του αλγορίθμου.");
        const body = this.parseBlock();
        this.consume(TokenType.END, "Το πρόγραμμα πρέπει να κλείνει με τη λέξη 'ΤΕΛΟΣ'.");
        this.match(TokenType.SEMICOLON);
        return { type: 'Program', name, declarations, body, loc: { line: startToken.line, column: startToken.column } };
    }
    
    parseProcedureDeclaration() {
        const startToken = this.peek();
        const name = this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα διαδικασίας.").value;
        
        // Consume simple parameter list in header (if present)
        if (this.match(TokenType.LEFT_PAREN)) {
            while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
                if (this.match(TokenType.IDENTIFIER, TokenType.COMMA, TokenType.PERCENT)) {
                    // Valid token, continue
                } else {
                    this.error("Αναμενόταν όνομα παραμέτρου, κόμμα ',' ή '%' στην επικεφαλίδα της διαδικασίας.");
                }
            }
            this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' μετά τις παραμέτρους της διαδικασίας.");
        }
        
        const params = this.parseInterface();
        const localDeclarations = this.parseDeclarations();
        
        this.consume(TokenType.BEGIN, `Αναμενόταν 'ΑΡΧΗ' στη διαδικασία '${name}'.`);
        const body = this.parseBlock();
        this.consume(TokenType.END_PROCEDURE, `Αναμενόταν 'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ' για τη διαδικασία '${name}'.`);
        this.match(TokenType.SEMICOLON);
        
        return { type: 'ProcedureDeclaration', name, params, declarations: localDeclarations, body, 
                 loc: { line: startToken.line, column: startToken.column } };
    }
    
    parseFunctionDeclaration() {
        const startToken = this.peek();
        const name = this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα συνάρτησης.").value;
        
        // Consume simple parameter list in header (if present)
        if (this.match(TokenType.LEFT_PAREN)) {
            while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
                if (this.match(TokenType.IDENTIFIER, TokenType.COMMA, TokenType.PERCENT)) {
                    // Valid token, continue
                } else {
                    this.error("Αναμενόταν όνομα παραμέτρου, κόμμα ',' ή '%' στην επικεφαλίδα της συνάρτησης.");
                }
            }
            this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' μετά τις παραμέτρους της συνάρτησης.");
        }
        
        // Check if there's a return type (: TYPE)
        if (!this.check(TokenType.COLON)) {
            // Incomplete function declaration - skip until ΑΡΧΗ
            while (!this.isAtEnd() && !this.check(TokenType.BEGIN)) {
                this.advance();
            }
            return null; // Signal to skip this function
        }
        
        this.consume(TokenType.COLON, "Αναμενόταν ':' για τον τύπο επιστροφής της συνάρτησης.");
        const returnType = this.parseType();
        
        const params = this.parseInterface(name);
        const localDeclarations = this.parseDeclarations();
        
        this.consume(TokenType.BEGIN, `Αναμενόταν 'ΑΡΧΗ' στη συνάρτηση '${name}'.`);
        const body = this.parseBlock();
        this.consume(TokenType.END_FUNCTION, `Αναμενόταν 'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ' για τη συνάρτηση '${name}'.`);
        this.match(TokenType.SEMICOLON);
        
        return { type: 'FunctionDeclaration', name, params, returnType, declarations: localDeclarations, body, 
                 loc: { line: startToken.line, column: startToken.column } };
    }
    
    parseInterface(functionName = null) {
        if (!this.match(TokenType.INTERFACE)) return [];
        
        let allParams = [];
        
        // INPUT parameters (by value)
        if (this.match(TokenType.INPUT)) {
            allParams = allParams.concat(this.parseParameterListBlock(false));
        }
        
        // OUTPUT parameters (by reference)
        if (this.match(TokenType.OUTPUT)) {
            const outputParams = this.parseParameterListBlock(true);
            
            for (const p of outputParams) {
                // Skip function's return variable
                if (functionName && p.name.toUpperCase() === functionName.toUpperCase()) {
                    continue;
                }
                
                // Check if already in INPUT (making it pass-by-reference)
                const existing = allParams.find(e => e.name.toUpperCase() === p.name.toUpperCase());
                if (existing) {
                    existing.passBy = 'reference';
                } else {
                    allParams.push(p);
                }
            }
        }
        
        return allParams;
    }
    
    parseParameterListBlock(isReference) {
        const params = [];
        
        while (this.check(TokenType.IDENTIFIER)) {
            const names = [this.consume(TokenType.IDENTIFIER).value];
            
            while (this.match(TokenType.COMMA)) {
                names.push(this.consume(TokenType.IDENTIFIER).value);
            }
            
            this.consume(TokenType.COLON);
            const paramType = this.parseType();
            this.consume(TokenType.SEMICOLON);
            
            for (const n of names) {
                params.push({ 
                    name: n, 
                    passBy: isReference ? 'reference' : 'value',
                    paramType 
                });
            }
        }
        
        return params;
    }
    
    parseDeclarations() { 
        const declarations = []; 
        
        while (true) { 
            if (this.match(TokenType.CONSTANTS)) { 
                declarations.push(...this.parseConstantDeclarations()); 
            } else if (this.match(TokenType.TYPES)) { 
                declarations.push(...this.parseTypeDeclarations());
            } else if (this.match(TokenType.DATA)) { 
                declarations.push(...this.parseVariableDeclarations()); 
            } else { 
                break; 
            } 
        } 
        
        return declarations; 
    }
    
    parseConstantDeclarations() { 
        const consts = []; 
        
        while (this.check(TokenType.IDENTIFIER)) { 
            const name = this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα σταθεράς.").value;
            if (this.check(TokenType.ASSIGN)) {
                this.error(`Στις ΣΤΑΘΕΡΕΣ χρησιμοποιείται το '=' και όχι το ':=' (π.χ. ${name} = 10;).`);
            }
            this.consume(TokenType.EQUALS, `Αναμενόταν '=' μετά το όνομα της σταθεράς '${name}'.`);
            const value = this.parseExpression();
            if (this.match(TokenType.COMMA)) {
                // Allow comma separation (e.g. MAX_M=5, MAX_N=6;)
            } else {
                this.consume(TokenType.SEMICOLON, "Λείπει το ';' ή ',' μετά τη δήλωση σταθεράς.");
            }
            consts.push({ type: 'ConstantDeclaration', name, value });
        } 
        
        return consts; 
    }
    
    parseVariableDeclarations() { 
        const vars = []; 
        
        while (this.check(TokenType.IDENTIFIER)) { 
            const names = [this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα μεταβλητής.").value]; 
            
            while(this.match(TokenType.COMMA)) { 
                names.push(this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα μεταβλητής μετά το κόμμα ','.").value); 
            }
            
            this.consume(TokenType.COLON, "Αναμενόταν ':' μετά το όνομα της μεταβλητής (π.χ. Χ : ΑΚΕΡΑΙΟΣ;).");
            const varType = this.parseType();
            this.consume(TokenType.SEMICOLON, "Λείπει το ερωτηματικό ';' στο τέλος της δήλωσης μεταβλητών.");
            
            for(const name of names) { 
                vars.push({ type: 'VariableDeclaration', name, varType }); 
            }
        } 
        
        return vars; 
    }
    
    parseTypeDeclarations() {
        const typeDecls = [];
        while (!this.check(TokenType.DATA) && !this.check(TokenType.CONSTANTS) &&
               !this.check(TokenType.BEGIN) && !this.check(TokenType.PROCEDURE) &&
               !this.check(TokenType.FUNCTION) && !this.isAtEnd()) {
            const nextTok = this.tokens[this.current + 1];
            if (this.check(TokenType.IDENTIFIER) && nextTok && nextTok.type === TokenType.EQUALS) {
                const typeName = this.advance().value;
                this.consume(TokenType.EQUALS);
                if (this.match(TokenType.RECORD)) {
                    const fields = [];
                    while (!this.check(TokenType.END_RECORD) && !this.isAtEnd()) {
                        if (this.check(TokenType.IDENTIFIER)) {
                            const fNames = [this.advance().value];
                            while (this.match(TokenType.COMMA)) {
                                fNames.push(this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα πεδίου εγγραφής.").value);
                            }
                            this.consume(TokenType.COLON, "Αναμενόταν ':' μετά το όνομα πεδίου εγγραφής.");
                            const fType = this.parseType();
                            this.match(TokenType.SEMICOLON);
                            for (const fn of fNames) {
                                fields.push({ name: fn, varType: fType });
                            }
                        } else {
                            this.advance();
                        }
                    }
                    this.consume(TokenType.END_RECORD, `Λείπει το 'ΤΕΛΟΣ-ΕΓΓΡΑΦΗΣ' στον τύπο '${typeName}'.`);
                    this.match(TokenType.SEMICOLON);
                    typeDecls.push({ type: 'TypeDeclaration', name: typeName, spec: { type: 'RecordType', fields } });
                } else if (this.check(TokenType.ARRAY) || this.check(TokenType.INTEGER_TYPE) ||
                           this.check(TokenType.REAL_TYPE) || this.check(TokenType.BOOLEAN_TYPE) ||
                           this.check(TokenType.CHAR_TYPE) || this.check(TokenType.STRING_TYPE)) {
                    const spec = this.parseType();
                    this.match(TokenType.SEMICOLON);
                    typeDecls.push({ type: 'TypeDeclaration', name: typeName, spec });
                } else {
                    // Pointer / List or custom exotic type in curriculum .eap files: skip until ';'
                    while (!this.isAtEnd() && !this.check(TokenType.SEMICOLON) &&
                           !this.check(TokenType.DATA) && !this.check(TokenType.BEGIN)) {
                        this.advance();
                    }
                    this.match(TokenType.SEMICOLON);
                }
            } else {
                this.advance();
            }
        }
        return typeDecls;
    }

    parseType() {
        if (this.match(TokenType.INTEGER_TYPE, TokenType.REAL_TYPE, TokenType.BOOLEAN_TYPE, 
                       TokenType.CHAR_TYPE, TokenType.STRING_TYPE)) {
            return { type: 'DataType', name: this.previous().type };
        }
        
        if (this.match(TokenType.ARRAY)) {
            const dimensions = [];
            this.consume(TokenType.LEFT_BRACKET, "Αναμενόταν '[' μετά το ARRAY (π.χ. ARRAY[1..10] OF INTEGER).");
            
            do {
                const from = this.parseExpression();
                this.consume(TokenType.DOT, "Αναμενόταν '..' στα όρια του πίνακα (π.χ. 1..N).");
                this.consume(TokenType.DOT, "Αναμενόταν '..' στα όρια του πίνακα (π.χ. 1..N).");
                const to = this.parseExpression();
                dimensions.push({ from, to });
            } while (this.match(TokenType.COMMA));
            
            this.consume(TokenType.RIGHT_BRACKET, "Αναμενόταν ']' μετά τις διαστάσεις του πίνακα.");
            this.consume(TokenType.OF, "Αναμενόταν 'OF' μετά τη δήλωση διαστάσεων του πίνακα.");
            const ofType = this.parseType();
            
            return { type: 'ArrayType', dimensions, ofType };
        }

        if (this.match(TokenType.CARET)) {
            const target = this.match(TokenType.IDENTIFIER) ? this.previous().value : 'ANY';
            return { type: 'PointerType', target };
        }

        if (this.match(TokenType.POINTER, TokenType.LIST)) {
            const kind = this.previous().type;
            if (this.match(TokenType.OF)) this.parseType();
            return { type: 'DataType', name: kind };
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return { type: 'CustomType', name: this.previous().value };
        }
        
        this.error(`Μη έγκυρος τύπος δεδομένων '${this.peek().value}'. Χρησιμοποιήστε ΑΚΕΡΑΙΟΣ, ΠΡΑΓΜΑΤΙΚΟΣ, ΛΟΓΙΚΟΣ, ΧΑΡΑΚΤΗΡΑΣ, ΣΥΜΒΟΛΟΣΕΙΡΑ, ARRAY ή όνομα ΕΓΓΡΑΦΗΣ.`);
    }
    
    parseBlock() {
        const statements = [];
        
        while (true) {
            if (this.isAtEnd()) break;
            
            const token = this.peek();
            if (token.type === TokenType.END || token.type === TokenType.ELSE || 
                token.type === TokenType.UNTIL || token.type === TokenType.END_IF || 
                token.type === TokenType.END_FOR || token.type === TokenType.END_WHILE ||
                token.type === TokenType.CASE || token.type === TokenType.END_SELECT ||
                token.type === TokenType.END_PROCEDURE || token.type === TokenType.END_FUNCTION) {
                break;
            }
            
            statements.push(this.parseStatement());
        }
        
        return statements.filter(s => s !== null);
    }
    
    parseStatement() {
        const startToken = this.peek();
        let stmt = null;
        
        if (this.match(TokenType.CALCULATE)) { 
            stmt = this.parseProcedureCall(); 
        }
        else if (this.match(TokenType.PRINT)) { 
            stmt = this.parsePrintStatement(); 
        }
        else if (this.match(TokenType.IF)) { 
            stmt = this.parseIfStatement(); 
        }
        else if (this.match(TokenType.SELECT)) {
            stmt = this.parseSelectStatement();
        }
        else if (this.match(TokenType.FOR)) { 
            stmt = this.parseForStatement(); 
        }
        else if (this.match(TokenType.WHILE)) { 
            stmt = this.parseWhileStatement(); 
        }
        else if (this.match(TokenType.REPEAT)) { 
            stmt = this.parseRepeatUntilStatement(); 
        }
        else if (this.match(TokenType.READ)) { 
            stmt = this.parseReadStatement(); 
        }
        else if (this.check(TokenType.IDENTIFIER)) {
            const nextToken = this.tokens[this.current + 1];
            if (nextToken && nextToken.type === TokenType.LEFT_PAREN) {
                stmt = this.parseProcedureCall();
            }
            else if (nextToken && nextToken.type === TokenType.EQUALS) {
                this.error(`Βρέθηκε '=' αντί για ':=' μετά το '${startToken.value}'. Στην Ψευδογλώσσα ΕΑΠ η ανάθεση τιμής γίνεται με ':=' (π.χ. ${startToken.value} := ...).`, nextToken);
            }
            else if (nextToken && (nextToken.type === TokenType.ASSIGN || nextToken.type === TokenType.LEFT_BRACKET || nextToken.type === TokenType.DOT)) {
                stmt = this.parseAssignmentStatement();
            }
        }
        
        if (stmt) {
            stmt.loc = { line: startToken.line, column: startToken.column };
            return stmt;
        }
        
        const token = this.peek();
        this.error(`Μη αναμενόμενη εντολή που ξεκινά με '${token.value}'. Ελέγξτε την ορθογραφία της εντολής ή αν λείπει ':='.`, token);
    }
    
    parseProcedureCall() { 
        const name = this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα διαδικασίας.").value; 
        this.consume(TokenType.LEFT_PAREN, "Αναμενόταν '(' μετά το όνομα της διαδικασίας."); 
        
        const args = []; 
        if (!this.check(TokenType.RIGHT_PAREN)) { 
            do { 
                if(this.match(TokenType.PERCENT)) { 
                    args.push({value: this.parseExpression(), passBy: 'reference'}); 
                } else { 
                    args.push({value: this.parseExpression(), passBy: 'value'}); 
                } 
            } while (this.match(TokenType.COMMA)); 
        } 
        
        this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' στην κλήση διαδικασίας."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'ProcedureCall', name, args }; 
    }
    
    parseReadStatement() { 
        this.consume(TokenType.LEFT_PAREN, "Αναμενόταν '(' μετά το ΔΙΑΒΑΣΕ (π.χ. ΔΙΑΒΑΣΕ(Χ))."); 
        
        const args = []; 
        if (!this.check(TokenType.RIGHT_PAREN)) { 
            do { 
                args.push(this.parsePrimary()); 
            } while (this.match(TokenType.COMMA)); 
        } 
        
        this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' στο ΔΙΑΒΑΣΕ."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'ReadStatement', args }; 
    }
    
    parseIfStatement(isChained = false) { 
        const condition = this.parseExpression(); 
        this.consume(TokenType.THEN, "Αναμενόταν 'ΤΟΤΕ' μετά τη συνθήκη του ΕΑΝ."); 
        
        const thenBranch = this.parseBlock(); 
        let elseBranch = null; 
        
        if (this.match(TokenType.ELSE)) { 
            const elseToken = this.previous();
            if (this.check(TokenType.IF) && this.peek().line === elseToken.line) {
                this.consume(TokenType.IF);
                elseBranch = [this.parseIfStatement(true)];
            } else {
                elseBranch = this.parseBlock(); 
            }
        } 
        
        if (!isChained) {
            this.consume(TokenType.END_IF, "Λείπει το 'ΕΑΝ-ΤΕΛΟΣ' για το κλείσιμο της δομής ΕΑΝ."); 
            this.match(TokenType.SEMICOLON); 
        }
        
        return { type: 'IfStatement', condition, thenBranch, elseBranch }; 
    }
    
    parseForStatement() {
        const variable = this.consume(TokenType.IDENTIFIER, "Αναμενόταν μεταβλητή μετρητή μετά το 'ΓΙΑ'.").value;
        if (this.check(TokenType.EQUALS)) {
            this.error(`Στο βρόχο ΓΙΑ χρησιμοποιείται ':=' και όχι '=' (π.χ. ΓΙΑ ${variable} := 1 ΕΩΣ N ΕΠΑΝΑΛΑΒΕ).`);
        }
        this.consume(TokenType.ASSIGN, `Αναμενόταν ':=' μετά τη μεταβλητή '${variable}' στον βρόχο ΓΙΑ.`);
        
        const start = this.parseExpression();
        this.consume(TokenType.TO, "Αναμενόταν 'ΕΩΣ' στον βρόχο ΓΙΑ.");
        
        const end = this.parseExpression();
        let step = { type: 'Literal', value: 1 };
        
        if (this.check(TokenType.STEP)) {
            this.consume(TokenType.STEP);
            if (this.check(TokenType.STEP)) {
                this.consume(TokenType.STEP);
            }
            step = this.parseExpression();
        }
        
        this.consume(TokenType.REPEAT, "Αναμενόταν 'ΕΠΑΝΑΛΑΒΕ' στην επικεφαλίδα του βρόχου ΓΙΑ.");
        const body = this.parseBlock();
        this.consume(TokenType.END_FOR, "Λείπει το 'ΓΙΑ-ΤΕΛΟΣ' μετά το σώμα του βρόχου ΓΙΑ.");
        this.match(TokenType.SEMICOLON);
        
        return { type: 'ForStatement', variable, start, end, step, body };
    }
    
    parseWhileStatement() { 
        const condition = this.parseExpression(); 
        this.consume(TokenType.REPEAT, "Αναμενόταν 'ΕΠΑΝΑΛΑΒΕ' μετά τη συνθήκη του ΕΝΟΣΩ."); 
        
        const body = this.parseBlock(); 
        this.consume(TokenType.END_WHILE, "Λείπει το 'ΕΝΟΣΩ-ΤΕΛΟΣ' μετά το σώμα του βρόχου ΕΝΟΣΩ."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'WhileStatement', condition, body }; 
    }
    
    parseRepeatUntilStatement() { 
        const body = this.parseBlock(); 
        this.consume(TokenType.UNTIL, "Λείπει το 'ΜΕΧΡΙ' μετά το σώμα του βρόχου ΕΠΑΝΑΛΑΒΕ."); 
        
        const condition = this.parseExpression(); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'RepeatUntilStatement', condition, body }; 
    }
    
    parsePrintStatement() { 
        this.consume(TokenType.LEFT_PAREN, "Αναμενόταν '(' μετά το ΤΥΠΩΣΕ (π.χ. ΤΥΠΩΣΕ(Χ))."); 
        
        const expressions = []; 
        if (!this.check(TokenType.RIGHT_PAREN)) { 
            do { 
                expressions.push(this.parseExpression()); 
            } while (this.match(TokenType.COMMA)); 
        } 
        
        this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' στο ΤΥΠΩΣΕ."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'PrintStatement', expressions }; 
    }
    
    parseSelectStatement() {
        const selector = this.parseExpression();
        this.match(TokenType.OF); // optional OF / ΑΠΟ
        if (this.check(TokenType.IDENTIFIER) && removeAccents(this.peek().value.toUpperCase()) === 'ΑΠΟ') {
            this.advance();
        }

        const cases = [];
        let elseBody = null;

        while (!this.check(TokenType.END_SELECT) && !this.isAtEnd()) {
            if (this.match(TokenType.ELSE)) {
                this.match(TokenType.COLON);
                elseBody = this.parseBlock();
                break;
            }
            this.consume(TokenType.CASE, "Αναμενόταν 'ΠΕΡΙΠΤΩΣΗ' ή 'ΕΠΙΛΕΞΕ-ΤΕΛΟΣ' στη δομή ΕΠΙΛΕΞΕ.");
            if (this.match(TokenType.ELSE)) {
                this.match(TokenType.COLON);
                elseBody = this.parseBlock();
                break;
            }

            const matchers = [];
            do {
                if (this.match(TokenType.LESS_THAN, TokenType.LESS_EQUALS, TokenType.GREATER_THAN, TokenType.GREATER_EQUALS, TokenType.EQUALS, TokenType.NOT_EQUALS)) {
                    const op = this.previous().value;
                    const rhs = this.parseExpression();
                    matchers.push({ kind: 'rel', op, expr: rhs });
                } else {
                    const first = this.parseExpression();
                    if (this.check(TokenType.DOT) && this.tokens[this.current + 1] && this.tokens[this.current + 1].type === TokenType.DOT) {
                        this.advance();
                        this.advance();
                        const second = this.parseExpression();
                        matchers.push({ kind: 'range', from: first, to: second });
                    } else {
                        matchers.push({ kind: 'exact', expr: first });
                    }
                }
            } while (this.match(TokenType.COMMA));

            this.match(TokenType.COLON); // optional ':' after ΠΕΡΙΠΤΩΣΗ values
            const body = this.parseBlock();
            cases.push({ matchers, body });
        }

        this.consume(TokenType.END_SELECT, "Λείπει το 'ΕΠΙΛΕΞΕ-ΤΕΛΟΣ' για το κλείσιμο της δομής ΕΠΙΛΕΞΕ.");
        this.match(TokenType.SEMICOLON);
        return { type: 'SelectStatement', selector, cases, elseBody };
    }

    parseAssignmentStatement() {
        const target = this.parsePrimary();
        if (this.check(TokenType.EQUALS)) {
            this.error("Βρέθηκε '=' αντί για ':='. Η ανάθεση τιμής γίνεται με ':='.");
        }
        this.consume(TokenType.ASSIGN, "Αναμενόταν ':=' για ανάθεση τιμής.");
        const value = this.parseExpression();
        this.match(TokenType.SEMICOLON);

        if (target.type === 'Identifier') {
            return { type: 'AssignmentStatement', identifier: target.name, indices: [], target, value };
        }
        if (target.type === 'ArrayAccess') {
            return { type: 'AssignmentStatement', identifier: target.name, indices: target.indices, target, value };
        }
        return { type: 'AssignmentStatement', identifier: null, indices: [], target, value };
    }
    
    parseExpression() { return this.parseLogicalOr(); }
    
    parseLogicalOr() { 
        let left = this.parseLogicalAnd(); 
        
        while (this.match(TokenType.OR)) { 
            const operator = this.previous().value; 
            const right = this.parseLogicalAnd(); 
            left = { type: 'BinaryExpression', operator, left, right }; 
        } 
        
        return left; 
    }
    
    parseLogicalAnd() { 
        let left = this.parseEquality(); 
        
        while (this.match(TokenType.AND)) { 
            const operator = this.previous().value; 
            const right = this.parseEquality(); 
            left = { type: 'BinaryExpression', operator, left, right }; 
        } 
        
        return left; 
    }
    
    parseEquality() { 
        let left = this.parseComparison(); 
        
        while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) { 
            const operator = this.previous().value; 
            const right = this.parseComparison(); 
            left = { type: 'BinaryExpression', operator, left, right }; 
        } 
        
        return left; 
    }
    
    parseComparison() { 
        let left = this.parseArithmetic(); 
        
        while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUALS, 
                          TokenType.LESS_THAN, TokenType.LESS_EQUALS)) { 
            const operator = this.previous().value; 
            const right = this.parseArithmetic(); 
            left = { type: 'BinaryExpression', operator, left, right }; 
        } 
        
        return left; 
    }
    
    parseArithmetic() { 
        let left = this.parseTerm(); 
        
        while (this.match(TokenType.PLUS, TokenType.MINUS)) { 
            const operator = this.previous().value; 
            const right = this.parseTerm(); 
            left = { type: 'BinaryExpression', operator, left, right }; 
        } 
        
        return left; 
    }
    
    parseTerm() { 
        let left = this.parseFactor(); 
        
        while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MOD, TokenType.DIV)) { 
            const operator = this.previous().value; 
            const right = this.parseFactor(); 
            left = { type: 'BinaryExpression', operator, left, right }; 
        } 
        
        return left; 
    }
    
    parseFactor() { 
        if (this.match(TokenType.NOT)) { 
            const operator = this.previous().value; 
            const right = this.parseFactor(); 
            return { type: 'UnaryExpression', operator, right }; 
        }
        
        if (this.match(TokenType.MINUS, TokenType.PLUS)) { 
            const operator = this.previous().value; 
            const right = this.parseFactor(); 
            return { type: 'UnaryExpression', operator, right }; 
        }
        
        return this.parsePrimary();
    }
    
    parsePrimary() {
        const startToken = this.peek();
        let expr = null;
        
        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            expr = { type: 'Literal', value: this.previous().value };
        }
        else if (this.match(TokenType.BOOLEAN_LITERAL)) {
            const valStr = this.previous().value.toUpperCase();
            const val = (valStr === 'ΑΛΗΘΗΣ' || valStr === 'TRUE');
            expr = { type: 'Literal', value: val };
        }
        else if (this.match(TokenType.IDENTIFIER)) {
            const name = this.previous().value;
            
            if (name.toUpperCase() === 'TRUE') {
                expr = { type: 'Literal', value: true };
            }
            else if (name.toUpperCase() === 'FALSE') {
                expr = { type: 'Literal', value: false };
            }
            else if (this.check(TokenType.LEFT_PAREN)) {
                expr = this.parseFunctionCall(name); 
            }
            else {
                expr = { type: 'Identifier', name };
            }
        }
        else if (this.match(TokenType.EOLN)) { 
            expr = { type: 'Identifier', name: 'EOLN' }; 
        }
        else if (this.match(TokenType.LEFT_PAREN)) { 
            const exprBody = this.parseExpression(); 
            this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' στην έκφραση."); 
            expr = { type: 'Grouping', expression: exprBody }; 
        }
        
        if (expr) {
            // Postfix chain: [i, j] subscripts and .field record member accesses
            while (true) {
                if (this.match(TokenType.LEFT_BRACKET)) {
                    const indices = [];
                    do {
                        indices.push(this.parseExpression());
                    } while (this.match(TokenType.COMMA));
                    this.consume(TokenType.RIGHT_BRACKET, "Λείπει η δεξιά αγκύλη ']' μετά τον δείκτη πίνακα.");
                    if (expr.type === 'Identifier') {
                        expr = { type: 'ArrayAccess', name: expr.name, indices };
                    } else {
                        expr = { type: 'SubscriptAccess', object: expr, indices };
                    }
                } else if (this.check(TokenType.DOT) && (!this.tokens[this.current + 1] || this.tokens[this.current + 1].type !== TokenType.DOT)) {
                    this.advance(); // consume single '.'
                    const fieldName = this.consume(TokenType.IDENTIFIER, "Αναμενόταν όνομα πεδίου εγγραφής μετά την τελεία '.'.").value;
                    expr = { type: 'MemberAccess', object: expr, field: fieldName };
                } else {
                    break;
                }
            }
            if (!expr.loc) expr.loc = { line: startToken.line, column: startToken.column };
            return expr;
        }
        
        const token = this.peek();
        this.error(`Μη αναμενόμενο σύμβολο '${token.value}' μέσα σε έκφραση.`, token);
    }
    
    parseFunctionCall(name) { 
        this.consume(TokenType.LEFT_PAREN, "Αναμενόταν '(' στην κλήση συνάρτησης.");
        
        const args = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do { 
                if (this.match(TokenType.PERCENT)) {
                    args.push(this.parsePrimary());
                } else {
                    args.push(this.parseExpression()); 
                }
            } while (this.match(TokenType.COMMA));
        }
        
        this.consume(TokenType.RIGHT_PAREN, "Λείπει η δεξιά παρένθεση ')' μετά τα ορίσματα της συνάρτησης.");
        return { type: 'FunctionCall', name, args };
    }
}

// -----------------------------------------------------------------------------
// INTERPRETER
// -----------------------------------------------------------------------------

class Environment {
    constructor(parent = null, scopeName = 'Κύριο Πρόγραμμα') {
        this.values = new Map();
        this.subroutines = new Map();
        this.typeDefs = new Map();
        this.constants = new Set();
        this.varTypes = new Map();
        this.rawNames = new Map();
        this.refLabels = new Map();
        this.parent = parent;
        this.scopeName = scopeName;
    }

    defineType(name, spec) {
        this.typeDefs.set(removeAccents(name.toUpperCase()), { name, spec });
    }

    getTypeDef(name) {
        const k = removeAccents(name.toUpperCase());
        if (this.typeDefs.has(k)) return this.typeDefs.get(k);
        if (this.parent) return this.parent.getTypeDef(name);
        return null;
    }
    
    define(name, value, isConstant = false, declaredType = null) {
        const key = name.toUpperCase();
        this.rawNames.set(key, name);
        if (declaredType) {
            this.varTypes.set(key, declaredType);
        }
        if (value && typeof value === 'object' && 'value' in value && Object.keys(value).length === 1) {
            this.values.set(key, value);
        } else {
            this.values.set(key, { value });
        }
        if (isConstant) {
            this.constants.add(key);
        }
    }
    
    isConstant(name) {
        const key = name.toUpperCase();
        if (this.constants.has(key)) return true;
        if (this.parent) return this.parent.isConstant(name);
        return false;
    }

    getDeclaredType(name) {
        const key = name.toUpperCase();
        if (this.varTypes.has(key)) return this.varTypes.get(key);
        if (this.parent) return this.parent.getDeclaredType(name);
        return null;
    }

    findHomoglyphMatch(name) {
        const targetH = toHomoglyphKey(name);
        let env = this;
        while (env) {
            for (const [k, raw] of env.rawNames.entries()) {
                if (k !== 'EOLN' && k !== name.toUpperCase() && toHomoglyphKey(k) === targetH) {
                    return raw;
                }
            }
            env = env.parent;
        }
        return null;
    }

    undefinedVarError(name) {
        const similar = this.findHomoglyphMatch(name);
        if (similar) {
            return new Error(`Η μεταβλητή '${name}' δεν έχει δηλωθεί. Μήπως εννοούσατε τη δηλωμένη μεταβλητή '${similar}' (προσοχή σε Ελληνικούς/Λατινικούς χαρακτήρες);`);
        }
        return new Error(`Η μεταβλητή '${name}' δεν έχει δηλωθεί στην ενότητα ΔΕΔΟΜΕΝΑ.`);
    }
    
    defineBox(name, box, refTargetLabel = null, declaredType = null) {
        const key = name.toUpperCase();
        this.rawNames.set(key, name);
        this.values.set(key, box);
        if (refTargetLabel) this.refLabels.set(key, refTargetLabel);
        if (declaredType) this.varTypes.set(key, declaredType);
    }
    
    defineSubroutine(name, declaration) {
        this.subroutines.set(name.toUpperCase(), declaration);
    }
    
    assign(name, value) {
        const key = name.toUpperCase();
        if (this.constants.has(key)) {
            throw new Error(`Δεν επιτρέπεται η αλλαγή τιμής της σταθεράς '${name}'.`);
        }
        if (this.values.has(key)) {
            this.values.get(key).value = value;
            return;
        }
        if (this.parent) {
            this.parent.assign(name, value);
            return;
        }
        throw this.undefinedVarError(name);
    }
    
    get(name) {
        const key = name.toUpperCase();
        if (this.values.has(key)) {
            return this.values.get(key).value;
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw this.undefinedVarError(name);
    }
    
    getBox(name) {
        const key = name.toUpperCase();
        if (this.constants.has(key)) {
            throw new Error(`Η σταθερά '${name}' δεν μπορεί να περαστεί με αναφορά (%).`);
        }
        if (this.values.has(key)) {
            return this.values.get(key);
        }
        if (this.parent) {
            return this.parent.getBox(name);
        }
        throw this.undefinedVarError(name);
    }
    
    getSubroutine(name) {
        const key = name.toUpperCase();
        if (this.subroutines.has(key)) {
            return this.subroutines.get(key);
        }
        if (this.parent) {
            return this.parent.getSubroutine(name);
        }
        throw new Error(`Άγνωστη διαδικασία ή συνάρτηση '${name}'. Ελέγξτε αν έχει δηλωθεί πριν το κύριο 'ΑΡΧΗ'.`);
    }
    
    getAllVariables() {
        const result = {};
        if (this.parent) {
            Object.assign(result, this.parent.getAllVariables());
        }
        for (const [key, box] of this.values.entries()) {
            if (key === 'EOLN') continue;
            const val = box.value;
            const isConst = this.isConstant(key);
            const refTo = this.refLabels.get(key) || null;
            if (val instanceof ArrayObject) {
                result[key] = {
                    type: 'array',
                    bounds: val.bounds,
                    data: { ...val.data },
                    elementType: val.elementType,
                    isConstant: isConst,
                    refTarget: refTo,
                    scope: this.scopeName
                };
            } else if (val instanceof RecordObject) {
                const flatFields = val.toFlatObject();
                for (const [fName, fVal] of Object.entries(flatFields)) {
                    result[`${key}.${fName}`] = {
                        type: typeof fVal,
                        value: fVal,
                        isConstant: false,
                        refTarget: refTo ? `${refTo}.${fName}` : null,
                        scope: this.scopeName
                    };
                }
            } else {
                result[key] = {
                    type: typeof val,
                    value: val,
                    isConstant: isConst,
                    refTarget: refTo,
                    scope: this.scopeName
                };
            }
        }
        return result;
    }

    getScopeFrames() {
        const frames = this.parent ? this.parent.getScopeFrames() : [];
        const vars = {};
        for (const [key, box] of this.values.entries()) {
            if (key === 'EOLN' || this.constants.has(key)) continue;
            const val = box.value;
            const displayName = this.rawNames.get(key) || key;
            const refTo = this.refLabels.get(key) || null;
            if (val instanceof ArrayObject) {
                const dimStr = (val.bounds || []).map(b => `${b.from}..${b.to}`).join(',');
                vars[displayName] = { summary: `ARRAY[${dimStr}]`, refTarget: refTo };
            } else {
                vars[displayName] = { summary: String(val), refTarget: refTo };
            }
        }
        frames.push({ name: this.scopeName, variables: vars });
        return frames;
    }
}

class RecordObject {
    constructor(typeName, fields, fieldTypes = {}) {
        this.typeName = typeName;
        this.fields = new Map();      // normKey -> value
        this.displayNames = new Map();// normKey -> originalName
        this.fieldTypes = new Map();  // normKey -> typeStr
        for (const [rawName, val] of Object.entries(fields || {})) {
            const k = removeAccents(rawName.toUpperCase());
            this.fields.set(k, val);
            this.displayNames.set(k, rawName);
            if (fieldTypes[rawName]) this.fieldTypes.set(k, fieldTypes[rawName]);
        }
    }

    hasField(name) {
        return this.fields.has(removeAccents(String(name).toUpperCase()));
    }

    getField(name) {
        const k = removeAccents(String(name).toUpperCase());
        if (!this.fields.has(k)) {
            throw new Error(`Η εγγραφή τύπου '${this.typeName}' δεν έχει πεδίο '${name}'.`);
        }
        return this.fields.get(k);
    }

    setField(name, val) {
        const k = removeAccents(String(name).toUpperCase());
        if (!this.fields.has(k)) {
            throw new Error(`Η εγγραφή τύπου '${this.typeName}' δεν έχει πεδίο '${name}'.`);
        }
        this.fields.set(k, val);
    }

    getFieldType(name) {
        const k = removeAccents(String(name).toUpperCase());
        return this.fieldTypes.get(k) || null;
    }

    toFlatObject() {
        const out = {};
        for (const [k, v] of this.fields.entries()) {
            const disp = this.displayNames.get(k) || k;
            if (v instanceof RecordObject) {
                const sub = v.toFlatObject();
                for (const [sk, sv] of Object.entries(sub)) out[`${disp}.${sk}`] = sv;
            } else {
                out[disp] = v;
            }
        }
        return out;
    }

    clone() {
        const clonedFields = {};
        const clonedTypes = {};
        for (const [k, v] of this.fields.entries()) {
            const disp = this.displayNames.get(k) || k;
            clonedFields[disp] = (v && typeof v.clone === 'function') ? v.clone() : v;
            if (this.fieldTypes.has(k)) clonedTypes[disp] = this.fieldTypes.get(k);
        }
        return new RecordObject(this.typeName, clonedFields, clonedTypes);
    }

    toString() {
        const parts = [];
        for (const [k, v] of this.fields.entries()) {
            parts.push(`${this.displayNames.get(k) || k}=${v}`);
        }
        return `{${parts.join(', ')}}`;
    }
}

class ArrayObject {
    constructor(bounds, elementType = null, prototypeFactory = null) {
        this.data = {};
        this.bounds = bounds;
        this.elementType = elementType;
        this.prototypeFactory = prototypeFactory;
    }
    
    validateIndices(indices) {
        if (indices.length !== this.bounds.length) {
            throw new Error(`Λάθος πλήθος δεικτών πίνακα (${indices.length}). Ο πίνακας έχει ${this.bounds.length} διάσταση/εις.`);
        }
        
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            const bound = this.bounds[i];
            
            if (!Number.isInteger(index) || index < bound.from || index > bound.to) {
                throw new Error(`Ο δείκτης πίνακα [${index}] είναι εκτός ορίων στη διάσταση ${i+1}. Επιτρεπτό εύρος: [${bound.from}..${bound.to}].`);
            }
        }
    }
    
    getKey(indices) {
        return indices.join(',');
    }
    
    get(indices) {
        this.validateIndices(indices);
        const key = this.getKey(indices);
        
        if (this.data.hasOwnProperty(key)) {
            return this.data[key];
        }

        if (typeof this.prototypeFactory === 'function') {
            this.data[key] = this.prototypeFactory();
            return this.data[key];
        }
        
        if (this.elementType === TokenType.BOOLEAN_TYPE) return false;
        if (this.elementType === TokenType.STRING_TYPE || this.elementType === TokenType.CHAR_TYPE) return "";
        return 0;
    }
    
    set(indices, value) {
        this.validateIndices(indices);
        this.data[this.getKey(indices)] = (value && typeof value.clone === 'function') ? value.clone() : value;
    }
    
    clone() {
        const newArr = new ArrayObject(this.bounds, this.elementType, this.prototypeFactory);
        for (const [k, v] of Object.entries(this.data)) {
            newArr.data[k] = (v && typeof v.clone === 'function') ? v.clone() : v;
        }
        return newArr;
    }
}

class Interpreter {
    constructor(options = {}) {
        this.globalEnv = new Environment();
        this.outputBuffer = [];
        this.inputProvider = null;
        this.outputCallback = null;
        this.currentNode = null;
        this.stepCount = 0;
        this.maxSteps = options.maxSteps || 500000;
        this.isCancelled = false;
        
        // Debugging, Breakpoints & Stepping
        this.debugMode = options.debugMode || false;
        this.breakpoints = new Set(options.breakpoints || []);
        this.executionSpeed = options.speed || 0;
        this.stepCallback = options.onStep || null;
        this.stepResolver = null;
    }

    setBreakpoints(lines) {
        this.breakpoints = new Set(lines || []);
    }
    
    cancel() {
        this.isCancelled = true;
        if (this.stepResolver) {
            const r = this.stepResolver;
            this.stepResolver = null;
            r();
        }
    }
    
    setStepCallback(callback) {
        this.stepCallback = callback;
    }
    
    setExecutionSpeed(ms) {
        this.executionSpeed = ms;
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    step() {
        if (this.stepResolver) {
            const r = this.stepResolver;
            this.stepResolver = null;
            r();
        }
    }
    
    continueExecution() {
        this.debugMode = false;
        if (this.stepResolver) {
            const r = this.stepResolver;
            this.stepResolver = null;
            r();
        }
    }
    
    checkExecutionHealth() {
        if (this.isCancelled) {
            throw new Error("Η εκτέλεση διακόπηκε από τον χρήστη. [Execution cancelled by user]");
        }
        this.stepCount++;
        if (this.stepCount > this.maxSteps) {
            throw new Error(`Υπέρβαση μέγιστου ορίου εκτέλεσης (${this.maxSteps} βήματα). Πιθανός ατέρμονος βρόχος! [Execution limit exceeded - infinite loop detected]`);
        }
    }
    
    setInputProvider(provider) {
        this.inputProvider = provider;
    }
    
    setOutputCallback(callback) {
        this.outputCallback = callback;
    }
    
    async interpret(ast) {
        this.outputBuffer = [];
        this.globalEnv = new Environment();
        this.stepCount = 0;
        this.isCancelled = false;
        if (this.stepResolver) {
            this.stepResolver = null;
        }
        
        this.globalEnv.define('EOLN', '__EOLN__');
        
        try {
            if (ast.type !== 'Program') throw new Error("Expected Program node");
            
            await this.processDeclarations(ast.declarations, this.globalEnv);
            await this.executeBlock(ast.body, this.globalEnv);
            
            // Join output buffer - filter out null markers
            const output = this.outputBuffer.filter(line => line !== null).join('\n');
            
            return { output, error: null };
        } catch (e) {
            let msg = e.message;
            if (this.currentNode && this.currentNode.loc && !msg.includes('[Line:') && !msg.includes('[Γραμμή:')) {
                msg = `${msg} [Γραμμή: ${this.currentNode.loc.line}, Στήλη: ${this.currentNode.loc.column}]`;
            }
            
            const output = this.outputBuffer.filter(line => line !== null).join('\n');
            
            return { output, error: msg };
        }
    }
    
    async instantiateTypeSpec(typeSpec, env, ownerName = '') {
        if (!typeSpec) return { val: 0, tag: null };
        if (typeSpec.type === 'DataType') {
            let def = 0;
            if (typeSpec.name === TokenType.BOOLEAN_TYPE) def = false;
            else if (typeSpec.name === TokenType.STRING_TYPE || typeSpec.name === TokenType.CHAR_TYPE) def = '';
            return { val: def, tag: typeSpec.name };
        }
        if (typeSpec.type === 'ArrayType') {
            const evaluatedBounds = [];
            for (const dim of typeSpec.dimensions) {
                try {
                    const start = Math.floor(await this.evaluate(dim.from, env));
                    const end = Math.floor(await this.evaluate(dim.to, env));
                    evaluatedBounds.push({ from: start, to: end });
                } catch (e) {
                    throw new Error(`Τα όρια του πίνακα '${ownerName}' πρέπει να είναι ακέραιες τιμές: ${e.message}`);
                }
            }
            const elemSpec = typeSpec.ofType;
            let elemTag = elemSpec && elemSpec.name ? elemSpec.name : null;
            let protoFactory = null;
            if (elemSpec && (elemSpec.type === 'CustomType' || elemSpec.type === 'RecordType')) {
                const sample = await this.instantiateTypeSpec(elemSpec, env, ownerName);
                elemTag = sample.tag;
                if (sample.val && typeof sample.val.clone === 'function') {
                    protoFactory = () => sample.val.clone();
                }
            }
            return { val: new ArrayObject(evaluatedBounds, elemTag, protoFactory), tag: 'ARRAY' };
        }
        if (typeSpec.type === 'RecordType') {
            const fields = {};
            const fieldTypes = {};
            for (const f of typeSpec.fields || []) {
                const inst = await this.instantiateTypeSpec(f.varType, env, f.name);
                fields[f.name] = inst.val;
                if (inst.tag) fieldTypes[f.name] = inst.tag;
            }
            return { val: new RecordObject(ownerName || 'ΕΓΓΡΑΦΗ', fields, fieldTypes), tag: 'RECORD' };
        }
        if (typeSpec.type === 'CustomType') {
            const tDef = env.getTypeDef(typeSpec.name);
            if (!tDef) {
                throw new Error(`Άγνωστος τύπος δεδομένων '${typeSpec.name}'. Δηλώστε τον στην ενότητα ΤΥΠΟΙ.`);
            }
            const res = await this.instantiateTypeSpec(tDef.spec, env, tDef.name);
            if (res.val instanceof RecordObject) res.val.typeName = tDef.name;
            return res;
        }
        return { val: 0, tag: null };
    }

    async resolveLValue(targetExpr, env) {
        if (targetExpr.type === 'Identifier') {
            if (env.isConstant(targetExpr.name)) {
                throw new Error(`Δεν επιτρέπεται η αλλαγή τιμής της σταθεράς '${targetExpr.name}'.`);
            }
            return {
                box: env.getBox(targetExpr.name),
                label: targetExpr.name,
                declaredType: env.getDeclaredType(targetExpr.name)
            };
        }
        if (targetExpr.type === 'ArrayAccess' || targetExpr.type === 'SubscriptAccess') {
            const arr = targetExpr.type === 'ArrayAccess'
                ? env.get(targetExpr.name)
                : await this.evaluate(targetExpr.object, env);
            const arrLabel = targetExpr.type === 'ArrayAccess' ? targetExpr.name : 'πίνακας';
            if (!(arr instanceof ArrayObject)) throw new Error(`Η μεταβλητή '${arrLabel}' δεν είναι πίνακας.`);
            const indices = [];
            for (const idx of targetExpr.indices) indices.push(await this.evaluate(idx, env));
            arr.validateIndices(indices);
            return {
                box: {
                    get value() { return arr.get(indices); },
                    set value(v) { arr.set(indices, v); }
                },
                label: `${arrLabel}[${indices.join(',')}]`,
                declaredType: arr.elementType
            };
        }
        if (targetExpr.type === 'MemberAccess') {
            const rec = await this.evaluate(targetExpr.object, env);
            if (!(rec instanceof RecordObject)) {
                throw new Error(`Η πρόσβαση '.${targetExpr.field}' απαιτεί μεταβλητή τύπου ΕΓΓΡΑΦΗ.`);
            }
            if (!rec.hasField(targetExpr.field)) {
                throw new Error(`Η εγγραφή '${rec.typeName}' δεν περιέχει πεδίο '${targetExpr.field}'.`);
            }
            const baseLabel = targetExpr.object.type === 'Identifier' ? targetExpr.object.name : rec.typeName;
            return {
                box: {
                    get value() { return rec.getField(targetExpr.field); },
                    set value(v) { rec.setField(targetExpr.field, v); }
                },
                label: `${baseLabel}.${targetExpr.field}`,
                declaredType: rec.getFieldType(targetExpr.field)
            };
        }
        throw new Error('Μη έγκυρος στόχος ανάθεσης ή αναφοράς.');
    }

    async processDeclarations(declarations, env) {
        // Phase 1: Constants, Types and Subroutines
        for (const decl of declarations) {
            if (decl.type === 'ConstantDeclaration') {
                const val = await this.evaluate(decl.value, env);
                env.define(decl.name, val, true);
            } else if (decl.type === 'TypeDeclaration') {
                env.defineType(decl.name, decl.spec);
            } else if (decl.type === 'ProcedureDeclaration' || decl.type === 'FunctionDeclaration') {
                env.defineSubroutine(decl.name, decl);
            }
        }
        
        // Phase 2: Variables (including arrays and records that depend on constants/types)
        for (const decl of declarations) {
            if (decl.type === 'VariableDeclaration') {
                const inst = await this.instantiateTypeSpec(decl.varType, env, decl.name);
                env.define(decl.name, inst.val, false, inst.tag);
            }
        }
    }
    
    async executeBlock(statements, env) {
        for (const stmt of statements) {
            await this.execute(stmt, env);
        }
    }
    
    async execute(stmt, env) {
        this.checkExecutionHealth();
        this.currentNode = stmt;
        
        if (stmt.loc && stmt.loc.line && this.breakpoints.has(stmt.loc.line)) {
            this.debugMode = true;
        }

        if (this.stepCallback && stmt.loc && stmt.loc.line) {
            await this.stepCallback({
                line: stmt.loc.line,
                column: stmt.loc.column,
                stmt,
                variables: env.getAllVariables(),
                callStack: env.getScopeFrames()
            });
            
            if (this.executionSpeed > 0) {
                await new Promise(r => setTimeout(r, this.executionSpeed));
            }
            
            if (this.debugMode) {
                await new Promise(resolve => {
                    this.stepResolver = resolve;
                });
            }
            
            this.checkExecutionHealth();
        }
        
        switch (stmt.type) {
            case 'AssignmentStatement': {
                const val = await this.evaluate(stmt.value, env);
                if (stmt.target) {
                    const lv = await this.resolveLValue(stmt.target, env);
                    lv.box.value = (val && typeof val.clone === 'function') ? val.clone() : val;
                } else if (stmt.indices && stmt.indices.length > 0) {
                    const arr = env.get(stmt.identifier);
                    if (!(arr instanceof ArrayObject)) throw new Error(`Η μεταβλητή '${stmt.identifier}' δεν είναι πίνακας.`);
                    const indices = [];
                    for (const idx of stmt.indices) indices.push(await this.evaluate(idx, env));
                    arr.set(indices, val);
                } else {
                    env.assign(stmt.identifier, val);
                }
                break;
            }
            
            case 'PrintStatement': {
                let outputParts = [];
                let eolnPositions = []; // Track where EOLNs appear
                
                for (let i = 0; i < stmt.expressions.length; i++) {
                    const value = await this.evaluate(stmt.expressions[i], env);
                    
                    if (value === '__EOLN__') {
                        eolnPositions.push(outputParts.length);
                    } else {
                        outputParts.push(String(value));
                    }
                }
                
                // Build output with proper spacing and newlines
                let outputText = '';
                let callbackText = '';
                
                for (let i = 0; i < outputParts.length; i++) {
                    // Add space between parts (but not if EOLN was between them)
                    if (i > 0 && !eolnPositions.includes(i)) {
                        outputText += ' ';
                        callbackText += ' ';
                    }
                    outputText += outputParts[i];
                    callbackText += outputParts[i];
                    
                    // Check if EOLN comes after this part
                    if (eolnPositions.includes(i + 1)) {
                        callbackText += '\n';
                    }
                }
                
                // Handle leading EOLN
                const hasLeadingEoln = eolnPositions.includes(0);
                // Handle trailing EOLN
                const hasTrailingEoln = eolnPositions.includes(outputParts.length);
                
                if (hasLeadingEoln) {
                    callbackText = '\n' + callbackText;
                }
                if (hasTrailingEoln) {
                    callbackText += '\n';
                }
                
                // Handle output buffer
                if (hasLeadingEoln || this.outputBuffer.length === 0 || this.outputBuffer[this.outputBuffer.length - 1] === null) {
                    this.outputBuffer.push(outputText);
                } else {
                    const lastIdx = this.outputBuffer.length - 1;
                    const currentLine = this.outputBuffer[lastIdx];
                    this.outputBuffer[lastIdx] = currentLine + (currentLine && outputText ? ' ' : '') + outputText;
                }
                
                if (hasTrailingEoln) {
                    this.outputBuffer.push(null);
                }
                
                // Output callback
                if (this.outputCallback) {
                    this.outputCallback(callbackText);
                }
                break;
            }
            
            case 'ReadStatement': {
                for(const arg of stmt.args) {
                    const lv = await this.resolveLValue(arg, env);
                    const expectedType = lv.declaredType;
                    const targetLabel = lv.label;

                    let input;
                    if (this.inputProvider) {
                        input = await this.inputProvider(targetLabel, expectedType);
                    } else {
                        throw new Error("Η ανάγνωση εισόδου (ΔΙΑΒΑΣΕ) δεν υποστηρίζεται σε αυτό το περιβάλλον.");
                    }
                    
                    let value;
                    if (input === null || input === undefined) {
                        if (expectedType === TokenType.BOOLEAN_TYPE) value = false;
                        else if (expectedType === TokenType.STRING_TYPE || expectedType === TokenType.CHAR_TYPE) value = '';
                        else value = 0;
                    } else {
                        const rawStr = String(input);
                        const trimmed = rawStr.trim();
                        const normBool = removeAccents(trimmed.toUpperCase());

                        if (expectedType === TokenType.STRING_TYPE) {
                            value = rawStr;
                        } else if (expectedType === TokenType.CHAR_TYPE) {
                            value = rawStr.length > 0 ? rawStr[0] : '';
                        } else if (expectedType === TokenType.BOOLEAN_TYPE) {
                            if (normBool === 'TRUE' || normBool === 'ΑΛΗΘΗΣ' || normBool === '1') value = true;
                            else if (normBool === 'FALSE' || normBool === 'ΨΕΥΔΗΣ' || normBool === '0') value = false;
                            else throw new Error(`Μη έγκυρη λογική τιμή '${rawStr}' για τη μεταβλητή '${targetLabel}'. Δώστε ΑΛΗΘΗΣ/ΨΕΥΔΗΣ ή TRUE/FALSE.`);
                        } else if (expectedType === TokenType.INTEGER_TYPE || expectedType === TokenType.REAL_TYPE) {
                            if (trimmed === '' || isNaN(Number(trimmed))) {
                                throw new Error(`Μη έγκυρη αριθμητική είσοδος '${rawStr}' για τη μεταβλητή '${targetLabel}'.`);
                            }
                            const numVal = Number(trimmed);
                            if (expectedType === TokenType.INTEGER_TYPE && !Number.isInteger(numVal)) {
                                throw new Error(`Η μεταβλητή '${targetLabel}' είναι ΑΚΕΡΑΙΟΣ, αλλά δόθηκε δεκαδικός αριθμός (${rawStr}).`);
                            }
                            value = numVal;
                        } else {
                            if (trimmed !== '' && !isNaN(Number(trimmed))) {
                                value = Number(trimmed);
                            } else if (normBool === 'TRUE' || normBool === 'ΑΛΗΘΗΣ') {
                                value = true;
                            } else if (normBool === 'FALSE' || normBool === 'ΨΕΥΔΗΣ') {
                                value = false;
                            } else {
                                value = rawStr;
                            }
                        }
                    }

                    lv.box.value = value;
                }
                break;
            }
            
            case 'SelectStatement': {
                const selVal = await this.evaluate(stmt.selector, env);
                let matched = false;
                for (const branch of stmt.cases) {
                    for (const m of branch.matchers) {
                        if (m.kind === 'exact') {
                            const v = await this.evaluate(m.expr, env);
                            if (selVal === v) { matched = true; break; }
                        } else if (m.kind === 'range') {
                            const lo = await this.evaluate(m.from, env);
                            const hi = await this.evaluate(m.to, env);
                            if (selVal >= lo && selVal <= hi) { matched = true; break; }
                        } else if (m.kind === 'rel') {
                            const rhs = await this.evaluate(m.expr, env);
                            if ((m.op === '<' && selVal < rhs) ||
                                (m.op === '<=' && selVal <= rhs) ||
                                (m.op === '>' && selVal > rhs) ||
                                (m.op === '>=' && selVal >= rhs) ||
                                (m.op === '=' && selVal === rhs) ||
                                (m.op === '<>' && selVal !== rhs)) {
                                matched = true;
                                break;
                            }
                        }
                    }
                    if (matched) {
                        await this.executeBlock(branch.body, env);
                        break;
                    }
                }
                if (!matched && stmt.elseBody) {
                    await this.executeBlock(stmt.elseBody, env);
                }
                break;
            }
            
            case 'IfStatement': {
                if (await this.evaluate(stmt.condition, env)) {
                    await this.executeBlock(stmt.thenBranch, env);
                } else if (stmt.elseBranch) {
                    await this.executeBlock(stmt.elseBranch, env);
                }
                break;
            }
            
            case 'WhileStatement': {
                while(await this.evaluate(stmt.condition, env)) {
                    this.checkExecutionHealth();
                    await this.executeBlock(stmt.body, env);
                }
                break;
            }
            
            case 'RepeatUntilStatement': {
                do {
                    this.checkExecutionHealth();
                    await this.executeBlock(stmt.body, env);
                } while (!(await this.evaluate(stmt.condition, env)));
                break;
            }
            
            case 'ForStatement': {
                const start = await this.evaluate(stmt.start, env);
                const end = await this.evaluate(stmt.end, env);
                const step = await this.evaluate(stmt.step, env);
                const varName = stmt.variable;
                
                try {
                    env.get(varName);
                } catch(e) {
                    env.define(varName, start);
                }
                env.assign(varName, start);
                
                let current = start;
                if (step > 0) {
                    while (current <= end) {
                        this.checkExecutionHealth();
                        await this.executeBlock(stmt.body, env);
                        current = env.get(varName) + step;
                        env.assign(varName, current);
                    }
                } else {
                    while (current >= end) {
                        this.checkExecutionHealth();
                        await this.executeBlock(stmt.body, env);
                        current = env.get(varName) + step;
                        env.assign(varName, current);
                    }
                }
                break;
            }
            
            case 'ProcedureCall': {
                const proc = env.getSubroutine(stmt.name);
                
                if (proc.params.length !== stmt.args.length) {
                    throw new Error(`Η διαδικασία '${stmt.name}' αναμένει ${proc.params.length} ορίσματα, αλλά δόθηκαν ${stmt.args.length}.`);
                }
                
                const procEnv = new Environment(env, `${stmt.name}()`);
                
                for(let i = 0; i < proc.params.length; i++) {
                    const param = proc.params[i];
                    const arg = stmt.args[i];
                    const pType = param.paramType && param.paramType.name ? param.paramType.name : null;
                    
                    if (param.passBy === 'reference') {
                        const lv = await this.resolveLValue(arg.value, env);
                        procEnv.defineBox(param.name, lv.box, lv.label, lv.declaredType || pType);
                    } else {
                        let val = await this.evaluate(arg.value, env);
                        if (val && typeof val.clone === 'function') {
                            val = val.clone();
                        }
                        procEnv.define(param.name, val, false, pType);
                    }
                }
                
                await this.processDeclarations(proc.declarations, procEnv);
                
                const oldEnv = this.globalEnv;
                this.globalEnv = procEnv;
                try {
                    await this.executeBlock(proc.body, procEnv);
                } finally {
                    this.globalEnv = oldEnv;
                }
                break;
            }
        }
    }
    
    async evaluate(expr, env) {
        switch(expr.type) {
            case 'Literal': 
                return expr.value;
                
            case 'Identifier': 
                return env.get(expr.name);
                
            case 'BinaryExpression': {
                const left = await this.evaluate(expr.left, env);
                const right = await this.evaluate(expr.right, env);
                const op = expr.operator;
                
                if (op === '+') return left + right;
                if (op === '-') return left - right;
                if (op === '*') return left * right;
                if (op === '/') {
                    if (right === 0) throw new Error('Διαίρεση με το μηδέν (0)!');
                    return left / right;
                }
                if (op === 'DIV') {
                    if (right === 0) throw new Error('Ακέραια διαίρεση (DIV) με το μηδέν (0)!');
                    return Math.trunc(left / right);
                }
                if (op === 'MOD') {
                    if (right === 0) throw new Error('Υπόλοιπο διαίρεσης (MOD) με το μηδέν (0)!');
                    return left % right;
                }
                if (op === '>') return left > right;
                if (op === '<') return left < right;
                if (op === '>=') return left >= right;
                if (op === '<=') return left <= right;
                if (op === '=' || op === 'EQUALS') return left === right;
                if (op === '<>' || op === 'NOT_EQUALS') return left !== right;
                if (op === 'AND' || op === 'ΚΑΙ') return left && right;
                if (op === 'OR' || op === 'Ή') return left || right;
                break;
            }
            
            case 'UnaryExpression': {
                const val = await this.evaluate(expr.right, env);
                if (expr.operator === '-') return -val;
                if (expr.operator === '+') return +val;
                if (expr.operator === 'NOT' || expr.operator === 'ΟΧΙ') return !val;
                break;
            }
            
            case 'Grouping':
                return await this.evaluate(expr.expression, env);
                
            case 'ArrayAccess': {
                const arr = env.get(expr.name);
                if (!(arr instanceof ArrayObject)) throw new Error(`Η μεταβλητή '${expr.name}' δεν είναι πίνακας.`);
                
                const indices = [];
                for(const i of expr.indices) indices.push(await this.evaluate(i, env));
                return arr.get(indices);
            }

            case 'SubscriptAccess': {
                const arr = await this.evaluate(expr.object, env);
                if (!(arr instanceof ArrayObject)) throw new Error("Η πρόσβαση '[...]' απαιτεί πίνακα.");
                const indices = [];
                for (const i of expr.indices) indices.push(await this.evaluate(i, env));
                return arr.get(indices);
            }

            case 'MemberAccess': {
                const rec = await this.evaluate(expr.object, env);
                if (!(rec instanceof RecordObject)) {
                    throw new Error(`Η πρόσβαση '.${expr.field}' απαιτεί μεταβλητή τύπου ΕΓΓΡΑΦΗ.`);
                }
                return rec.getField(expr.field);
            }
            
            case 'FunctionCall': {
                let func = null;
                try {
                    func = env.getSubroutine(expr.name);
                } catch (subErr) {
                    // Check standard EAP built-in math & string functions
                    const fnKey = removeAccents(expr.name.toUpperCase());
                    const BUILTIN_FNS = {
                        SQRT: { arity: 1, fn: (x) => { if (x < 0) throw new Error(`Τετραγωνική ρίζα (${expr.name}) αρνητικού αριθμού (${x})!`); return Math.sqrt(x); } },
                        'Τ_Ρ': { arity: 1, fn: (x) => { if (x < 0) throw new Error(`Τετραγωνική ρίζα (${expr.name}) αρνητικού αριθμού (${x})!`); return Math.sqrt(x); } },
                        ABS: { arity: 1, fn: (x) => Math.abs(x) },
                        'Α_Τ': { arity: 1, fn: (x) => Math.abs(x) },
                        TRUNC: { arity: 1, fn: (x) => Math.trunc(x) },
                        INT: { arity: 1, fn: (x) => Math.trunc(x) },
                        'Α_Μ': { arity: 1, fn: (x) => Math.trunc(x) },
                        ROUND: { arity: 1, fn: (x) => Math.round(x) },
                        SIN: { arity: 1, fn: (x) => Math.sin(x) },
                        'ΗΜ': { arity: 1, fn: (x) => Math.sin(x) },
                        COS: { arity: 1, fn: (x) => Math.cos(x) },
                        'ΣΥΝ': { arity: 1, fn: (x) => Math.cos(x) },
                        TAN: { arity: 1, fn: (x) => Math.tan(x) },
                        'ΕΦ': { arity: 1, fn: (x) => Math.tan(x) },
                        LN: { arity: 1, fn: (x) => { if (x <= 0) throw new Error(`Λογάριθμος (${expr.name}) μη θετικού αριθμού (${x})!`); return Math.log(x); } },
                        LOG: { arity: 1, fn: (x) => { if (x <= 0) throw new Error(`Λογάριθμος (${expr.name}) μη θετικού αριθμού (${x})!`); return Math.log(x); } },
                        EXP: { arity: 1, fn: (x) => Math.exp(x) },
                        POW: { arity: 2, fn: (a, b) => Math.pow(a, b) },
                        LENGTH: { arity: 1, fn: (s) => String(s).length },
                        'ΜΗΚΟΣ': { arity: 1, fn: (s) => String(s).length }
                    };
                    const builtin = BUILTIN_FNS[fnKey];
                    if (builtin) {
                        if (expr.args.length !== builtin.arity) {
                            throw new Error(`Η ενσωματωμένη συνάρτηση '${expr.name}' αναμένει ${builtin.arity} όρισμα/ορίσματα, αλλά δόθηκαν ${expr.args.length}.`);
                        }
                        const evaledArgs = [];
                        for (const a of expr.args) evaledArgs.push(await this.evaluate(a, env));
                        return builtin.fn(...evaledArgs);
                    }
                    throw subErr;
                }
                
                if (func.type !== 'FunctionDeclaration') {
                    throw new Error(`Η διαδικασία '${expr.name}' χρησιμοποιήθηκε μέσα σε έκφραση αντί να κληθεί με 'ΥΠΟΛΟΓΙΣΕ ${expr.name}(...)'.`);
                }
                
                if (func.params.length !== expr.args.length) {
                    throw new Error(`Η συνάρτηση '${expr.name}' αναμένει ${func.params.length} ορίσματα, αλλά δόθηκαν ${expr.args.length}.`);
                }
                
                const funcEnv = new Environment(env, `${expr.name}()`);
                const retInst = await this.instantiateTypeSpec(func.returnType, env, expr.name);
                funcEnv.define(expr.name, retInst.val, false, retInst.tag);
                
                for(let i = 0; i < func.params.length; i++) {
                    const param = func.params[i];
                    const argExpr = expr.args[i];
                    const pType = param.paramType && param.paramType.name ? param.paramType.name : null;
                    
                    if (param.passBy === 'reference') {
                        const lv = await this.resolveLValue(argExpr, env);
                        funcEnv.defineBox(param.name, lv.box, lv.label, lv.declaredType || pType);
                    } else {
                        let val = await this.evaluate(argExpr, env);
                        if (val && typeof val.clone === 'function') {
                            val = val.clone();
                        }
                        funcEnv.define(param.name, val, false, pType);
                    }
                }
                
                await this.processDeclarations(func.declarations, funcEnv);
                
                const oldEnv = this.globalEnv;
                this.globalEnv = funcEnv;
                try {
                    await this.executeBlock(func.body, funcEnv);
                } finally {
                    this.globalEnv = oldEnv;
                }
                
                return funcEnv.get(expr.name);
            }
        }
        
        throw new Error(`Άγνωστος τύπος έκφρασης: ${expr.type}`);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenize, Parser, Interpreter, Environment, ArrayObject, RecordObject };
}