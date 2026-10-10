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
    END_IF: 'END_IF', END_FOR: 'END_FOR', END_WHILE: 'END_WHILE', 
    END_PROCEDURE: 'END_PROCEDURE', END_FUNCTION: 'END_FUNCTION' 
};

const GREEK_KEYWORDS = {
    'ΑΛΓΟΡΙΘΜΟΣ': TokenType.ALGORITHM, 'ΣΤΑΘΕΡΕΣ': TokenType.CONSTANTS,
    'ΔΕΔΟΜΕΝΑ': TokenType.DATA, 'ΑΡΧΗ': TokenType.BEGIN, 'ΤΕΛΟΣ': TokenType.END,
    'ΕΑΝ': TokenType.IF, 'ΤΟΤΕ': TokenType.THEN, 'ΑΛΛΙΩΣ': TokenType.ELSE,
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
        
        throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
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
        const locationInfo = `[Line: ${token.line}, Col: ${token.column}]`;
        throw new Error(message ? `${message} ${locationInfo}` : `Error ${locationInfo}`);
    }
    
    consume(type, message) {
        if (this.check(type)) return this.advance();
        const token = this.peek();
        const locationInfo = `[Line: ${token.line}, Col: ${token.column}]`;
        throw new Error(message ? `${message} ${locationInfo}` : 
            `Expected token of type ${type} but got ${token.type} ('${token.value}') ${locationInfo}`);
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
        this.consume(TokenType.ALGORITHM, "A program must start with 'ΑΛΓΟΡΙΘΜΟΣ'.");
        const name = this.consume(TokenType.IDENTIFIER, "Expected algorithm name.").value;
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
                this.error("Parser stuck - couldn't parse subroutine");
            }
        }
        
        this.consume(TokenType.BEGIN, "Expected 'ΑΡΧΗ' for the main program body.");
        const body = this.parseBlock();
        this.consume(TokenType.END, "A program must end with 'ΤΕΛΟΣ'.");
        return { type: 'Program', name, declarations, body, loc: { line: startToken.line, column: startToken.column } };
    }
    
    parseProcedureDeclaration() {
        const startToken = this.peek();
        const name = this.consume(TokenType.IDENTIFIER, "Expected procedure name.").value;
        
        // Consume simple parameter list in header (if present)
        if (this.match(TokenType.LEFT_PAREN)) {
            while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
                if (this.match(TokenType.IDENTIFIER, TokenType.COMMA, TokenType.PERCENT)) {
                    // Valid token, continue
                } else {
                    this.error("Expected parameter name, comma or % in procedure header");
                }
            }
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after procedure parameters");
        }
        
        const params = this.parseInterface();
        const localDeclarations = this.parseDeclarations();
        
        this.consume(TokenType.BEGIN, `Expected 'ΑΡΧΗ' for procedure '${name}'.`);
        const body = this.parseBlock();
        this.consume(TokenType.END_PROCEDURE, `Expected 'ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ' for procedure '${name}'.`);
        
        return { type: 'ProcedureDeclaration', name, params, declarations: localDeclarations, body, 
                 loc: { line: startToken.line, column: startToken.column } };
    }
    
    parseFunctionDeclaration() {
        const startToken = this.peek();
        const name = this.consume(TokenType.IDENTIFIER, "Expected function name.").value;
        
        // Consume simple parameter list in header (if present)
        if (this.match(TokenType.LEFT_PAREN)) {
            while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
                if (this.match(TokenType.IDENTIFIER, TokenType.COMMA, TokenType.PERCENT)) {
                    // Valid token, continue
                } else {
                    this.error("Expected parameter name, comma or % in function header");
                }
            }
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after function parameters");
        }
        
        // Check if there's a return type (: TYPE)
        if (!this.check(TokenType.COLON)) {
            // Incomplete function declaration - skip until ΑΡΧΗ
            while (!this.isAtEnd() && !this.check(TokenType.BEGIN)) {
                this.advance();
            }
            return null; // Signal to skip this function
        }
        
        this.consume(TokenType.COLON, "Expected ':' for function return type.");
        const returnType = this.parseType();
        
        const params = this.parseInterface(name);
        const localDeclarations = this.parseDeclarations();
        
        this.consume(TokenType.BEGIN, `Expected 'ΑΡΧΗ' for function '${name}'.`);
        const body = this.parseBlock();
        this.consume(TokenType.END_FUNCTION, `Expected 'ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ' for function '${name}'.`);
        
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
                while(!this.check(TokenType.DATA) && !this.check(TokenType.BEGIN) && 
                      !this.isAtEnd() && !this.check(TokenType.PROCEDURE) && 
                      !this.check(TokenType.FUNCTION)) {
                    this.advance(); 
                }
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
            const name = this.consume(TokenType.IDENTIFIER, "Expected constant name.").value;
            this.consume(TokenType.EQUALS, "Expected '=' after constant name.");
            const value = this.parseExpression();
            if (this.match(TokenType.COMMA)) {
                // Allow comma separation (e.g. MAX_M=5, MAX_N=6;)
            } else {
                this.consume(TokenType.SEMICOLON, "Expected ';' or ',' after constant declaration.");
            }
            consts.push({ type: 'ConstantDeclaration', name, value });
        } 
        
        return consts; 
    }
    
    parseVariableDeclarations() { 
        const vars = []; 
        
        while (this.check(TokenType.IDENTIFIER)) { 
            const names = [this.consume(TokenType.IDENTIFIER, "Expected variable name.").value]; 
            
            while(this.match(TokenType.COMMA)) { 
                names.push(this.consume(TokenType.IDENTIFIER, "Expected variable name after comma.").value); 
            }
            
            this.consume(TokenType.COLON, "Expected ':' after variable name(s).");
            const varType = this.parseType();
            this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration.");
            
            for(const name of names) { 
                vars.push({ type: 'VariableDeclaration', name, varType }); 
            }
        } 
        
        return vars; 
    }
    
    parseType() {
        if (this.match(TokenType.INTEGER_TYPE, TokenType.REAL_TYPE, TokenType.BOOLEAN_TYPE, 
                       TokenType.CHAR_TYPE, TokenType.STRING_TYPE)) {
            return { type: 'DataType', name: this.previous().type };
        }
        
        if (this.match(TokenType.ARRAY)) {
            const dimensions = [];
            this.consume(TokenType.LEFT_BRACKET, "Expected '[' after ARRAY.");
            
            do {
                const from = this.parseExpression();
                this.consume(TokenType.DOT, "Expected '..' range separator in array declaration.");
                this.consume(TokenType.DOT, "Expected '..' range separator in array declaration.");
                const to = this.parseExpression();
                dimensions.push({ from, to });
            } while (this.match(TokenType.COMMA));
            
            this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array dimensions.");
            this.consume(TokenType.OF, "Expected 'OF' after array declaration.");
            const ofType = this.parseType();
            
            return { type: 'ArrayType', dimensions, ofType };
        }
        
        this.error(`Unexpected token '${this.peek().value}' while parsing a type.`);
    }
    
    parseBlock() {
        const statements = [];
        
        while (true) {
            if (this.isAtEnd()) break;
            
            const token = this.peek();
            if (token.type === TokenType.END || token.type === TokenType.ELSE || 
                token.type === TokenType.UNTIL || token.type === TokenType.END_IF || 
                token.type === TokenType.END_FOR || token.type === TokenType.END_WHILE ||
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
            if (nextToken && (nextToken.type === TokenType.ASSIGN || nextToken.type === TokenType.LEFT_BRACKET)) {
                stmt = this.parseAssignmentStatement();
            }
            else if (nextToken && nextToken.type === TokenType.LEFT_PAREN) {
                stmt = this.parseProcedureCall();
            }
        }
        
        if (stmt) {
            stmt.loc = { line: startToken.line, column: startToken.column };
            return stmt;
        }
        
        const token = this.peek();
        this.error(`Unexpected statement starting with '${token.value}'`, token);
    }
    
    parseProcedureCall() { 
        const name = this.consume(TokenType.IDENTIFIER, "Expected procedure name.").value; 
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after procedure name."); 
        
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
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after procedure arguments."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'ProcedureCall', name, args }; 
    }
    
    parseReadStatement() { 
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after ΔΙΑΒΑΣΕ."); 
        
        const args = []; 
        if (!this.check(TokenType.RIGHT_PAREN)) { 
            do { 
                args.push(this.parsePrimary()); 
            } while (this.match(TokenType.COMMA)); 
        } 
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'ReadStatement', args }; 
    }
    
    parseIfStatement(isChained = false) { 
        const condition = this.parseExpression(); 
        this.consume(TokenType.THEN, "Expected 'ΤΟΤΕ' after IF condition."); 
        
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
            this.consume(TokenType.END_IF, "Expected 'ΕΑΝ-ΤΕΛΟΣ' after IF statement."); 
            this.match(TokenType.SEMICOLON); 
        }
        
        return { type: 'IfStatement', condition, thenBranch, elseBranch }; 
    }
    
    parseForStatement() {
        const variable = this.consume(TokenType.IDENTIFIER, "Expected loop variable for FOR loop.").value;
        this.consume(TokenType.ASSIGN, "Expected ':=' after loop variable.");
        
        const start = this.parseExpression();
        this.consume(TokenType.TO, "Expected 'ΕΩΣ' in FOR loop.");
        
        const end = this.parseExpression();
        let step = { type: 'Literal', value: 1 };
        
        if (this.check(TokenType.STEP)) {
            this.consume(TokenType.STEP);
            if (this.check(TokenType.STEP)) {
                this.consume(TokenType.STEP);
            }
            step = this.parseExpression();
        }
        
        this.consume(TokenType.REPEAT, "Expected 'ΕΠΑΝΑΛΑΒΕ' in FOR loop.");
        const body = this.parseBlock();
        this.consume(TokenType.END_FOR, "Expected 'ΓΙΑ-ΤΕΛΟΣ' after FOR loop body.");
        this.match(TokenType.SEMICOLON);
        
        return { type: 'ForStatement', variable, start, end, step, body };
    }
    
    parseWhileStatement() { 
        const condition = this.parseExpression(); 
        this.consume(TokenType.REPEAT, "Expected 'ΕΠΑΝΑΛΑΒΕ' in WHILE loop."); 
        
        const body = this.parseBlock(); 
        this.consume(TokenType.END_WHILE, "Expected 'ΕΝΟΣΩ-ΤΕΛΟΣ' after WHILE loop body."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'WhileStatement', condition, body }; 
    }
    
    parseRepeatUntilStatement() { 
        const body = this.parseBlock(); 
        this.consume(TokenType.UNTIL, "Expected 'ΜΕΧΡΙ' after REPEAT loop body."); 
        
        const condition = this.parseExpression(); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'RepeatUntilStatement', condition, body }; 
    }
    
    parsePrintStatement() { 
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after ΤΥΠΩΣΕ."); 
        
        const expressions = []; 
        if (!this.check(TokenType.RIGHT_PAREN)) { 
            do { 
                expressions.push(this.parseExpression()); 
            } while (this.match(TokenType.COMMA)); 
        } 
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expressions in ΤΥΠΩΣΕ."); 
        this.match(TokenType.SEMICOLON); 
        
        return { type: 'PrintStatement', expressions }; 
    }
    
    parseAssignmentStatement() {
        const name = this.consume(TokenType.IDENTIFIER, "Expected identifier for assignment.").value;
        let indices = [];
        
        if (this.match(TokenType.LEFT_BRACKET)) {
            do {
                indices.push(this.parseExpression());
            } while (this.match(TokenType.COMMA));
            this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array index.");
        }
        
        this.consume(TokenType.ASSIGN, "Expected ':=' for assignment.");
        const value = this.parseExpression();
        this.match(TokenType.SEMICOLON);
        
        return { type: 'AssignmentStatement', identifier: name, indices, value };
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
            else if (this.check(TokenType.LEFT_BRACKET)) {
                this.consume(TokenType.LEFT_BRACKET);
                const indices = [];
                
                do { 
                    indices.push(this.parseExpression()); 
                } while(this.match(TokenType.COMMA));
                
                this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array indices.");
                expr = { type: 'ArrayAccess', name, indices };
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
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression."); 
            expr = { type: 'Grouping', expression: exprBody }; 
        }
        
        if (expr) {
            if (!expr.loc) expr.loc = { line: startToken.line, column: startToken.column };
            return expr;
        }
        
        const token = this.peek();
        this.error(`Unexpected token '${token.value}' when parsing primary expression`, token);
    }
    
    parseFunctionCall(name) { 
        this.consume(TokenType.LEFT_PAREN, "Expected '(' for function call.");
        
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
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after function arguments.");
        return { type: 'FunctionCall', name, args };
    }
}

// -----------------------------------------------------------------------------
// INTERPRETER
// -----------------------------------------------------------------------------

class Environment {
    constructor(parent = null) {
        this.values = new Map();
        this.subroutines = new Map();
        this.parent = parent;
    }
    
    define(name, value) {
        if (value && typeof value === 'object' && 'value' in value && Object.keys(value).length === 1) {
            this.values.set(name.toUpperCase(), value);
        } else {
            this.values.set(name.toUpperCase(), { value });
        }
    }
    
    defineBox(name, box) {
        this.values.set(name.toUpperCase(), box);
    }
    
    defineSubroutine(name, declaration) {
        this.subroutines.set(name.toUpperCase(), declaration);
    }
    
    assign(name, value) {
        const key = name.toUpperCase();
        if (this.values.has(key)) {
            this.values.get(key).value = value;
            return;
        }
        if (this.parent) {
            this.parent.assign(name, value);
            return;
        }
        throw new Error(`Undefined variable '${name}'.`);
    }
    
    get(name) {
        const key = name.toUpperCase();
        if (this.values.has(key)) {
            return this.values.get(key).value;
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new Error(`Undefined variable '${name}'.`);
    }
    
    getBox(name) {
        const key = name.toUpperCase();
        if (this.values.has(key)) {
            return this.values.get(key);
        }
        if (this.parent) {
            return this.parent.getBox(name);
        }
        throw new Error(`Undefined variable '${name}'.`);
    }
    
    getSubroutine(name) {
        const key = name.toUpperCase();
        if (this.subroutines.has(key)) {
            return this.subroutines.get(key);
        }
        if (this.parent) {
            return this.parent.getSubroutine(name);
        }
        throw new Error(`Undefined function or procedure '${name}'.`);
    }
    
    getAllVariables() {
        const result = {};
        if (this.parent) {
            Object.assign(result, this.parent.getAllVariables());
        }
        for (const [key, box] of this.values.entries()) {
            if (key === 'EOLN') continue;
            const val = box.value;
            if (val instanceof ArrayObject) {
                result[key] = {
                    type: 'array',
                    bounds: val.bounds,
                    data: { ...val.data }
                };
            } else {
                result[key] = {
                    type: typeof val,
                    value: val
                };
            }
        }
        return result;
    }
}

class ArrayObject {
    constructor(bounds) {
        this.data = {};
        this.bounds = bounds;
    }
    
    validateIndices(indices) {
        if (indices.length !== this.bounds.length) {
            throw new Error(`Incorrect number of indices (${indices.length}). Expected ${this.bounds.length}.`);
        }
        
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            const bound = this.bounds[i];
            
            if (!Number.isInteger(index) || index < bound.from || index > bound.to) {
                throw new Error(`Array index ${index} is out of bounds for dimension ${i+1}. Expected range: [${bound.from}..${bound.to}].`);
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
        
        return 0;
    }
    
    set(indices, value) {
        this.validateIndices(indices);
        this.data[this.getKey(indices)] = value;
    }
    
    clone() {
        const newArr = new ArrayObject(this.bounds);
        newArr.data = { ...this.data };
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
        
        // Debugging & Stepping
        this.debugMode = options.debugMode || false;
        this.executionSpeed = options.speed || 0;
        this.stepCallback = options.onStep || null;
        this.stepResolver = null;
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
            if (this.currentNode && this.currentNode.loc && !msg.includes('[Line:')) {
                msg = `${msg} [Line: ${this.currentNode.loc.line}, Col: ${this.currentNode.loc.column}]`;
            }
            
            const output = this.outputBuffer.filter(line => line !== null).join('\n');
            
            return { output, error: msg };
        }
    }
    
    async processDeclarations(declarations, env) {
        // Phase 1: Constants and Subroutines
        for (const decl of declarations) {
            if (decl.type === 'ConstantDeclaration') {
                const val = await this.evaluate(decl.value, env);
                env.define(decl.name, val);
            } else if (decl.type === 'ProcedureDeclaration' || decl.type === 'FunctionDeclaration') {
                env.defineSubroutine(decl.name, decl);
            }
        }
        
        // Phase 2: Variables (including arrays that depend on constants)
        for (const decl of declarations) {
            if (decl.type === 'VariableDeclaration') {
                if (decl.varType.type === 'ArrayType') {
                    const evaluatedBounds = [];
                    
                    for (const dim of decl.varType.dimensions) {
                        try {
                            const start = Math.floor(await this.evaluate(dim.from, env));
                            const end = Math.floor(await this.evaluate(dim.to, env));
                            evaluatedBounds.push({ from: start, to: end });
                        } catch (e) {
                            throw new Error(`Array bounds must evaluate to integers. Error in '${decl.name}' array declaration: ${e.message}`);
                        }
                    }
                    
                    env.define(decl.name, new ArrayObject(evaluatedBounds));
                } else {
                    let defaultVal = 0;
                    if (decl.varType.name === TokenType.BOOLEAN_TYPE) defaultVal = false;
                    else if (decl.varType.name === TokenType.STRING_TYPE || decl.varType.name === TokenType.CHAR_TYPE) defaultVal = "";
                    
                    env.define(decl.name, defaultVal);
                }
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
        
        if (this.stepCallback && stmt.loc && stmt.loc.line) {
            await this.stepCallback({
                line: stmt.loc.line,
                column: stmt.loc.column,
                stmt,
                variables: env.getAllVariables()
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
                
                if (stmt.indices && stmt.indices.length > 0) {
                    const arr = env.get(stmt.identifier);
                    if (!(arr instanceof ArrayObject)) throw new Error(`'${stmt.identifier}' is not an array.`);
                    
                    const indices = [];
                    for(const idx of stmt.indices) indices.push(await this.evaluate(idx, env));
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
                    let targetName;
                    let targetIndices = [];
                    
                    if (arg.type === 'Identifier') {
                        targetName = arg.name;
                    } else if (arg.type === 'ArrayAccess') {
                        targetName = arg.name;
                        for(const idx of arg.indices) targetIndices.push(await this.evaluate(idx, env));
                    } else {
                        throw new Error("READ requires a variable.");
                    }
                    
                    let input;
                    if (this.inputProvider) {
                        input = await this.inputProvider();
                    } else if (typeof window !== 'undefined' && window.prompt) {
                        input = window.prompt('Enter value:');
                    } else {
                        throw new Error("Input not supported in this environment");
                    }
                    
                    if (input === null || input === '') {
                        input = '-1';
                    }
                    
                    // Don't add to output buffer or call outputCallback
                    // The input echo is handled by the terminal UI
                    
                    let value = input;
                    if (!isNaN(input) && input.trim() !== '') {
                        value = Number(input);
                    } else if (input.toLowerCase() === 'true') {
                        value = true;
                    } else if (input.toLowerCase() === 'false') {
                        value = false;
                    }
                    
                    if (targetIndices.length > 0) {
                        const arr = env.get(targetName);
                        if (!(arr instanceof ArrayObject)) throw new Error(`'${targetName}' is not an array.`);
                        arr.set(targetIndices, value);
                    } else {
                        env.assign(targetName, value);
                    }
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
                    throw new Error(`Procedure '${stmt.name}' expects ${proc.params.length} arguments but got ${stmt.args.length}.`);
                }
                
                const procEnv = new Environment(env);
                
                for(let i = 0; i < proc.params.length; i++) {
                    const param = proc.params[i];
                    const arg = stmt.args[i];
                    
                    if (param.passBy === 'reference') {
                        if (arg.value.type === 'Identifier') {
                            const argBox = env.getBox(arg.value.name);
                            procEnv.defineBox(param.name, argBox);
                        } else if (arg.value.type === 'ArrayAccess') {
                            const arrName = arg.value.name;
                            const arr = env.get(arrName);
                            if (!(arr instanceof ArrayObject)) throw new Error(`'${arrName}' is not an array.`);
                            
                            const indices = [];
                            for(const idx of arg.value.indices) indices.push(await this.evaluate(idx, env));
                            
                            const proxyBox = {
                                get value() { return arr.get(indices); },
                                set value(val) { arr.set(indices, val); }
                            };
                            procEnv.defineBox(param.name, proxyBox);
                        } else {
                            throw new Error(`Argument for reference parameter '${param.name}' must be a variable or array element.`);
                        }
                    } else {
                        let val = await this.evaluate(arg.value, env);
                        if (val instanceof ArrayObject) {
                            val = val.clone();
                        }
                        procEnv.define(param.name, val);
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
                if (op === '/') return left / right;
                if (op === 'DIV') return Math.floor(left / right);
                if (op === 'MOD') return left % right;
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
                if (expr.operator === 'NOT' || expr.operator === 'ΟΧΙ') return !val;
                break;
            }
            
            case 'Grouping':
                return await this.evaluate(expr.expression, env);
                
            case 'ArrayAccess': {
                const arr = env.get(expr.name);
                if (!(arr instanceof ArrayObject)) throw new Error(`'${expr.name}' is not an array.`);
                
                const indices = [];
                for(const i of expr.indices) indices.push(await this.evaluate(i, env));
                return arr.get(indices);
            }
            
            case 'FunctionCall': {
                const func = env.getSubroutine(expr.name);
                
                if (func.type !== 'FunctionDeclaration') {
                    throw new Error(`Procedure '${expr.name}' used as an expression (function).`);
                }
                
                if (func.params.length !== expr.args.length) {
                    throw new Error(`Function '${expr.name}' expects ${func.params.length} arguments but got ${expr.args.length}.`);
                }
                
                const funcEnv = new Environment(env);
                
                funcEnv.define(expr.name, 0);
                
                for(let i = 0; i < func.params.length; i++) {
                    const param = func.params[i];
                    const argExpr = expr.args[i];
                    
                    if (param.passBy === 'reference') {
                        if (argExpr.type === 'Identifier') {
                            const argBox = env.getBox(argExpr.name);
                            funcEnv.defineBox(param.name, argBox);
                        } else if (argExpr.type === 'ArrayAccess') {
                            const arrName = argExpr.name;
                            const arr = env.get(arrName);
                            if (!(arr instanceof ArrayObject)) throw new Error(`'${arrName}' is not an array.`);
                            
                            const indices = [];
                            for(const idx of argExpr.indices) indices.push(await this.evaluate(idx, env));
                            
                            const proxyBox = {
                                get value() { return arr.get(indices); },
                                set value(val) { arr.set(indices, val); }
                            };
                            funcEnv.defineBox(param.name, proxyBox);
                        } else {
                            throw new Error(`Argument for reference parameter '${param.name}' must be a variable or array element.`);
                        }
                    } else {
                        let val = await this.evaluate(argExpr, env);
                        if (val instanceof ArrayObject) {
                            val = val.clone();
                        }
                        funcEnv.define(param.name, val);
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
        
        throw new Error(`Unknown expression type: ${expr.type}`);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenize, Parser, Interpreter, Environment };
}