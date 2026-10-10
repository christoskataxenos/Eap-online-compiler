// -----------------------------------------------------------------------------
// CodeMirror Mode & Autocomplete for EAP Greek Pseudocode (ΠΛΗ10)
// -----------------------------------------------------------------------------

(function(mod) {
    if (typeof exports === "object" && typeof module === "object") {
        mod(require("codemirror"));
    } else if (typeof define === "function" && define.amd) {
        define(["codemirror"], mod);
    } else {
        mod(CodeMirror);
    }
})(function(CodeMirror) {
    "use strict";

    function removeAccents(s) {
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const KEYWORDS = new Set([
        "ΑΛΓΟΡΙΘΜΟΣ", "ΣΤΑΘΕΡΕΣ", "ΔΕΔΟΜΕΝΑ", "ΤΥΠΟΙ", "ΔΙΕΠΑΦΗ", "ΕΙΣΟΔΟΣ", "ΕΞΟΔΟΣ",
        "ΑΡΧΗ", "ΤΕΛΟΣ", "ΕΑΝ", "ΤΟΤΕ", "ΑΛΛΙΩΣ", "ΕΑΝ-ΤΕΛΟΣ",
        "ΓΙΑ", "ΕΩΣ", "ΜΕ", "ΒΗΜΑ", "ΜΕ-ΒΗΜΑ", "ΕΠΑΝΑΛΑΒΕ", "ΓΙΑ-ΤΕΛΟΣ",
        "ΕΝΟΣΩ", "ΕΝΟΣΩ-ΤΕΛΟΣ", "ΜΕΧΡΙ", "ΥΠΟΛΟΓΙΣΕ",
        "ΔΙΑΔΙΚΑΣΙΑ", "ΔΙΑΔΙΚΑΣΙΑΣ", "ΣΥΝΑΡΤΗΣΗ", "ΣΥΝΑΡΤΗΣΗΣ",
        "ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ", "ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ",
        "ALGORITHM", "CONSTANTS", "DATA", "TYPES", "INTERFACE", "INPUT", "OUTPUT",
        "BEGIN", "END", "IF", "THEN", "ELSE", "END_IF", "FOR", "TO", "STEP", "REPEAT",
        "END_FOR", "WHILE", "END_WHILE", "UNTIL", "CALCULATE", "PROCEDURE", "FUNCTION",
        "END_PROCEDURE", "END_FUNCTION"
    ]);

    const BUILTINS = new Set([
        "ΤΥΠΩΣΕ", "ΔΙΑΒΑΣΕ", "PRINT", "READ", "EOLN"
    ]);

    const TYPES = new Set([
        "ΑΚΕΡΑΙΟΣ", "ΠΡΑΓΜΑΤΙΚΟΣ", "ΛΟΓΙΚΟΣ", "ΧΑΡΑΚΤΗΡΑΣ", "ΣΥΜΒΟΛΟΣΕΙΡΑ",
        "INTEGER", "REAL", "BOOLEAN", "CHAR", "STRING", "ARRAY", "OF", "POINTER", "LIST"
    ]);

    const ATOMS = new Set([
        "ΑΛΗΘΗΣ", "ΨΕΥΔΗΣ", "TRUE", "FALSE"
    ]);

    const OPERATOR_WORDS = new Set([
        "ΚΑΙ", "Ή", "ΟΧΙ", "AND", "OR", "NOT", "DIV", "MOD"
    ]);

    CodeMirror.defineMode("eap-pseudocode", function() {
        return {
            startState: function() {
                return {
                    tokenize: null,
                    context: null
                };
            },

            token: function(stream, state) {
                if (state.tokenize) {
                    return state.tokenize(stream, state);
                }

                // Whitespace
                if (stream.eatSpace()) return null;

                const ch = stream.peek();

                // Line comments: //
                if (stream.match("//")) {
                    stream.skipToEnd();
                    return "comment";
                }

                // Block comments: /* ... */
                if (stream.match("/*")) {
                    state.tokenize = function(stream, state) {
                        while (!stream.eol()) {
                            if (stream.match("*/")) {
                                state.tokenize = null;
                                break;
                            }
                            stream.next();
                        }
                        return "comment";
                    };
                    return state.tokenize(stream, state);
                }

                // Pascal curly brace comments: { ... }
                if (ch === "{") {
                    stream.next();
                    state.tokenize = function(stream, state) {
                        while (!stream.eol()) {
                            if (stream.next() === "}") {
                                state.tokenize = null;
                                break;
                            }
                        }
                        return "comment";
                    };
                    return state.tokenize(stream, state);
                }

                // Strings: "..."
                if (ch === '"') {
                    stream.next();
                    state.tokenize = function(stream, state) {
                        let escaped = false;
                        while (!stream.eol()) {
                            const c = stream.next();
                            if (c === '"' && !escaped) {
                                state.tokenize = null;
                                break;
                            }
                            escaped = !escaped && c === "\\";
                        }
                        return "string";
                    };
                    return state.tokenize(stream, state);
                }

                // Numbers: integers and floats
                if (stream.match(/^[0-9]+(\.[0-9]+)?/)) {
                    return "number";
                }

                // Multi-character operators
                if (stream.match(":=") || stream.match("<=") || stream.match(">=") || stream.match("<>")) {
                    return "operator";
                }

                // Single-character operators / punctuation
                if (/[+\-*\/=<>%^]/.test(ch)) {
                    stream.next();
                    return "operator";
                }

                if (/[:;,\.()\[\]]/.test(ch)) {
                    stream.next();
                    return "punctuation";
                }

                // Compound keywords with dashes: e.g. ΕΑΝ-ΤΕΛΟΣ, ΓΙΑ-ΤΕΛΟΣ, ΕΝΟΣΩ-ΤΕΛΟΣ, ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ, ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ, ΜΕ-ΒΗΜΑ
                if (stream.match(/^[\u0370-\u03ff\u1f00-\u1fffa-zA-Z_][\u0370-\u03ff\u1f00-\u1fffa-zA-Z0-9_\-]*/)) {
                    const word = stream.current();
                    const cleanWord = removeAccents(word.toUpperCase());

                    if (KEYWORDS.has(cleanWord)) return "keyword";
                    if (BUILTINS.has(cleanWord)) return "builtin";
                    if (TYPES.has(cleanWord)) return "variable-2";
                    if (ATOMS.has(cleanWord)) return "atom";
                    if (OPERATOR_WORDS.has(cleanWord)) return "operator";

                    // Check if it's identifier with trailing dash that wasn't compound
                    if (word.includes("-") && !cleanWord.includes("-TEΛΟΣ")) {
                        // Handled
                    }

                    return "variable";
                }

                stream.next();
                return null;
            },

            lineComment: "//",
            blockCommentStart: "/*",
            blockCommentEnd: "*/",
            fold: "brace"
        };
    });

    // Autocomplete / IntelliSense
    const ALL_KEYWORDS_LIST = [
        // Keywords
        { text: "ΑΛΓΟΡΙΘΜΟΣ ", displayText: "ΑΛΓΟΡΙΘΜΟΣ <όνομα>" },
        { text: "ΣΤΑΘΕΡΕΣ\n  ", displayText: "ΣΤΑΘΕΡΕΣ" },
        { text: "ΔΕΔΟΜΕΝΑ\n  ", displayText: "ΔΕΔΟΜΕΝΑ" },
        { text: "ΑΡΧΗ\n  ", displayText: "ΑΡΧΗ" },
        { text: "ΤΕΛΟΣ", displayText: "ΤΕΛΟΣ" },
        { text: "ΕΑΝ ", displayText: "ΕΑΝ <συνθήκη> ΤΟΤΕ ... ΕΑΝ-ΤΕΛΟΣ" },
        { text: "ΤΟΤΕ\n  ", displayText: "ΤΟΤΕ" },
        { text: "ΑΛΛΙΩΣ\n  ", displayText: "ΑΛΛΙΩΣ" },
        { text: "ΕΑΝ-ΤΕΛΟΣ", displayText: "ΕΑΝ-ΤΕΛΟΣ" },
        { text: "ΓΙΑ ", displayText: "ΓΙΑ <i := 1 ΕΩΣ N> ΕΠΑΝΑΛΑΒΕ" },
        { text: "ΕΩΣ ", displayText: "ΕΩΣ" },
        { text: "ΜΕ-ΒΗΜΑ ", displayText: "ΜΕ-ΒΗΜΑ" },
        { text: "ΕΠΑΝΑΛΑΒΕ\n  ", displayText: "ΕΠΑΝΑΛΑΒΕ" },
        { text: "ΓΙΑ-ΤΕΛΟΣ", displayText: "ΓΙΑ-ΤΕΛΟΣ" },
        { text: "ΕΝΟΣΩ ", displayText: "ΕΝΟΣΩ <συνθήκη> ΕΠΑΝΑΛΑΒΕ" },
        { text: "ΕΝΟΣΩ-ΤΕΛΟΣ", displayText: "ΕΝΟΣΩ-ΤΕΛΟΣ" },
        { text: "ΕΠΑΝΑΛΑΒΕ\n  \nΜΕΧΡΙ ", displayText: "ΕΠΑΝΑΛΑΒΕ ... ΜΕΧΡΙ <συνθήκη>" },
        { text: "ΜΕΧΡΙ ", displayText: "ΜΕΧΡΙ" },
        { text: "ΤΥΠΩΣΕ(", displayText: "ΤΥΠΩΣΕ(...)" },
        { text: "ΔΙΑΒΑΣΕ(", displayText: "ΔΙΑΒΑΣΕ(...)" },
        { text: "EOLN", displayText: "EOLN (Αλλαγή Γραμμής)" },
        { text: "ΥΠΟΛΟΓΙΣΕ ", displayText: "ΥΠΟΛΟΓΙΣΕ <διαδικασία>" },
        { text: "ΔΙΑΔΙΚΑΣΙΑ ", displayText: "ΔΙΑΔΙΚΑΣΙΑ <όνομα>(<παράμετροι>)" },
        { text: "ΣΥΝΑΡΤΗΣΗ ", displayText: "ΣΥΝΑΡΤΗΣΗ <όνομα>(<παράμετροι>): <τύπος>" },
        { text: "ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ", displayText: "ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ" },
        { text: "ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ", displayText: "ΤΕΛΟΣ-ΣΥΝΑΡΤΗΣΗΣ" },
        // Types
        { text: "ΑΚΕΡΑΙΟΣ", displayText: "ΑΚΕΡΑΙΟΣ (Integer)" },
        { text: "ΠΡΑΓΜΑΤΙΚΟΣ", displayText: "ΠΡΑΓΜΑΤΙΚΟΣ (Real)" },
        { text: "ΛΟΓΙΚΟΣ", displayText: "ΛΟΓΙΚΟΣ (Boolean)" },
        { text: "ΧΑΡΑΚΤΗΡΑΣ", displayText: "ΧΑΡΑΚΤΗΡΑΣ (Char)" },
        { text: "ΣΥΜΒΟΛΟΣΕΙΡΑ", displayText: "ΣΥΜΒΟΛΟΣΕΙΡΑ (String)" },
        { text: "ARRAY[1..N] OF INTEGER;", displayText: "ARRAY[1..N] OF INTEGER" },
        // Operators & Booleans
        { text: "ΑΛΗΘΗΣ", displayText: "ΑΛΗΘΗΣ (TRUE)" },
        { text: "ΨΕΥΔΗΣ", displayText: "ΨΕΥΔΗΣ (FALSE)" },
        { text: "ΚΑΙ", displayText: "ΚΑΙ (AND)" },
        { text: "Ή", displayText: "Ή (OR)" },
        { text: "ΟΧΙ", displayText: "ΟΧΙ (NOT)" },
        { text: "DIV", displayText: "DIV (Ακέραια διαίρεση)" },
        { text: "MOD", displayText: "MOD (Υπόλοιπο διαίρεσης)" }
    ];

    CodeMirror.registerHelper("hint", "eap-pseudocode", function(cm) {
        const cur = cm.getCursor();
        const token = cm.getTokenAt(cur);
        const prefix = token.string;
        const cleanPrefix = removeAccents(prefix.toUpperCase());

        // Extract identifier names present in the current document
        const docText = cm.getValue();
        const identRegex = /[\u0370-\u03ff\u1f00-\u1fffa-zA-Z_][\u0370-\u03ff\u1f00-\u1fffa-zA-Z0-9_]*/g;
        const localIdents = new Set();
        let match;
        while ((match = identRegex.exec(docText)) !== null) {
            const w = match[0];
            const cleanW = removeAccents(w.toUpperCase());
            if (!KEYWORDS.has(cleanW) && !BUILTINS.has(cleanW) && !TYPES.has(cleanW) && !OPERATOR_WORDS.has(cleanW) && !ATOMS.has(cleanW)) {
                localIdents.add(w);
            }
        }

        const list = [];

        // Check keywords
        for (const item of ALL_KEYWORDS_LIST) {
            const cleanItem = removeAccents(item.text.trim().toUpperCase());
            if (cleanItem.startsWith(cleanPrefix) || cleanPrefix === "") {
                list.push(item);
            }
        }

        // Check local identifiers
        for (const id of localIdents) {
            if (removeAccents(id.toUpperCase()).startsWith(cleanPrefix)) {
                list.push({ text: id, displayText: id + " (μεταβλητή)" });
            }
        }

        if (!list.length) return null;

        return {
            list: list,
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)
        };
    });
});
