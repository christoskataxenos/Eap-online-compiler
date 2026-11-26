
const { tokenize, Parser, Interpreter, Environment } = require('../core.v6.js');
const assert = require('assert');

// Helper to run code and check output
async function runCode(code, inputs = []) {
    const tokens = tokenize(code);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter();

    let inputIndex = 0;
    interpreter.setInputProvider(async (promptMsg) => {
        if (inputIndex < inputs.length) {
            return inputs[inputIndex++];
        }
        return null;
    });

    return await interpreter.interpret(ast);
}

async function testHello() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ Hello
ΑΡΧΗ
    ΤΥΠΩΣΕ("Hello World")
ΤΕΛΟΣ`;
    const result = await runCode(code);
    assert.strictEqual(result.output.trim(), "Hello World");
    console.log("testHello passed");
}

async function testArithmetic() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ Arithmetic
    ΔΕΔΟΜΕΝΑ A, B : ΑΚΕΡΑΙΟΣ;
    ΑΡΧΗ
        A := 10;
        B := 3;
        ΤΥΠΩΣΕ(A + B, EOLN);
        ΤΥΠΩΣΕ(A - B, EOLN);
        ΤΥΠΩΣΕ(A * B, EOLN);
        ΤΥΠΩΣΕ(A DIV B, EOLN);
        ΤΥΠΩΣΕ(A MOD B, EOLN);
    ΤΕΛΟΣ`;
    const result = await runCode(code);
    const lines = result.output.trim().split('\n');
    assert.strictEqual(lines[0].trim(), "13");
    assert.strictEqual(lines[1].trim(), "7");
    assert.strictEqual(lines[2].trim(), "30");
    assert.strictEqual(lines[3].trim(), "3"); // 10 DIV 3 = 3
    assert.strictEqual(lines[4].trim(), "1"); // 10 MOD 3 = 1
    console.log("testArithmetic passed");
}

async function testIf() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ TestIf
    ΔΕΔΟΜΕΝΑ X : ΑΚΕΡΑΙΟΣ;
    ΑΡΧΗ
        X := 5;
        ΕΑΝ X > 3 ΤΟΤΕ
            ΤΥΠΩΣΕ("Greater")
        ΑΛΛΙΩΣ
            ΤΥΠΩΣΕ("Smaller")
        ΕΑΝ-ΤΕΛΟΣ
    ΤΕΛΟΣ`;
    const result = await runCode(code);
    assert.strictEqual(result.output.trim(), "Greater");
    console.log("testIf passed");
}

async function testLoop() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ TestLoop
    ΔΕΔΟΜΕΝΑ I : ΑΚΕΡΑΙΟΣ;
    ΑΡΧΗ
        ΓΙΑ I := 1 ΕΩΣ 5 ΕΠΑΝΑΛΑΒΕ
            ΤΥΠΩΣΕ(I, EOLN)
        ΓΙΑ-ΤΕΛΟΣ
    ΤΕΛΟΣ`;
    const result = await runCode(code);
    const lines = result.output.trim().split('\n');
    assert.strictEqual(lines.length, 5);
    assert.strictEqual(lines[0].trim(), "1");
    assert.strictEqual(lines[4].trim(), "5");
    console.log("testLoop passed");
}

async function testCaseInsensitive() {
    const code = `Αλγόριθμος TestCase
    Δεδομένα x : Ακέραιος;
    Αρχή
        x := 10;
        Τύπωσε(x)
    Τέλος`;
    const result = await runCode(code);
    assert.strictEqual(result.output.trim(), "10");
    console.log("testCaseInsensitive passed");
}

async function testRead() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ TestRead
    ΔΕΔΟΜΕΝΑ X : ΑΚΕΡΑΙΟΣ;
    ΑΡΧΗ
        ΔΙΑΒΑΣΕ(X);
        ΤΥΠΩΣΕ(X * 2);
    ΤΕΛΟΣ`;
    const result = await runCode(code, ["21"]);
    assert.strictEqual(result.output.trim(), "42");
    console.log("testRead passed");
}

async function testBubbleSort() {
    // Using the example code
    const code = `ΑΛΓΟΡΙΘΜΟΣ BubbleSort
ΣΤΑΘΕΡΕΣ N = 5;
ΔΕΔΟΜΕΝΑ A: ARRAY[1..N] OF INTEGER; I, J, TEMP: INTEGER;
ΑΡΧΗ
    /* Είσοδος - Reverse order */
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
        ΤΥΠΩΣΕ(A[I], EOLN)
    ΓΙΑ-ΤΕΛΟΣ
ΤΕΛΟΣ`;
    const result = await runCode(code);
    const lines = result.output.trim().split('\n');
    // Expected: 10, 20, 30, 40, 50
    assert.strictEqual(lines[0].trim(), "10");
    assert.strictEqual(lines[1].trim(), "20");
    assert.strictEqual(lines[2].trim(), "30");
    assert.strictEqual(lines[3].trim(), "40");
    assert.strictEqual(lines[4].trim(), "50");
    console.log("testBubbleSort passed");
}

async function testInfiniteLoopProtection() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ Infinite
    ΔΕΔΟΜΕΝΑ X: ΑΚΕΡΑΙΟΣ;
    ΑΡΧΗ
        X := 1;
        ΕΝΟΣΩ X > 0 ΕΠΑΝΑΛΑΒΕ
            X := X + 1;
        ΕΝΟΣΩ-ΤΕΛΟΣ
    ΤΕΛΟΣ`;
    const tokens = tokenize(code);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter({ maxSteps: 50 });
    const result = await interpreter.interpret(ast);
    assert(result.error !== null);
    assert(result.error.includes("Υπέρβαση μέγιστου ορίου εκτέλεσης"));
    console.log("testInfiniteLoopProtection passed");
}

async function testGreekErrorsAndBeginnerHints() {
    // 1. '=' instead of ':=' in assignment
    assert.throws(() => {
        const tokens = tokenize(`ΑΛΓΟΡΙΘΜΟΣ TestEq\nΔΕΔΟΜΕΝΑ x : ΑΚΕΡΑΙΟΣ;\nΑΡΧΗ\n  x = 5;\nΤΕΛΟΣ`);
        new Parser(tokens).parse();
    }, (err) => err.message.includes(':=') && err.message.toLowerCase().includes('ανάθεση'));

    // 2. Homoglyph hint (Latin A declared, Greek Α used)
    const homoglyphRes = await runCode(`ΑΛΓΟΡΙΘΜΟΣ Homoglyph\nΔΕΔΟΜΕΝΑ A : ΑΚΕΡΑΙΟΣ;\nΑΡΧΗ\n  A := 10;\n  ΤΥΠΩΣΕ(Α);\nΤΕΛΟΣ`);
    assert(homoglyphRes.error && homoglyphRes.error.includes('Ελληνικούς/Λατινικούς χαρακτήρες'), `Expected homoglyph hint, got: ${homoglyphRes.error}`);

    // 3. Constant immutability
    const constRes = await runCode(`ΑΛΓΟΡΙΘΜΟΣ ConstImmutable\nΣΤΑΘΕΡΕΣ N = 5;\nΑΡΧΗ\n  N := 10;\nΤΕΛΟΣ`);
    assert(constRes.error && constRes.error.includes('σταθερά'), `Expected constant immutability error, got: ${constRes.error}`);

    // 4. Division by zero
    const divZeroRes = await runCode(`ΑΛΓΟΡΙΘΜΟΣ DivZero\nΔΕΔΟΜΕΝΑ X, Y : ΑΚΕΡΑΙΟΣ;\nΑΡΧΗ\n  X := 10;\n  Y := 0;\n  ΤΥΠΩΣΕ(X DIV Y);\nΤΕΛΟΣ`);
    assert(divZeroRes.error && divZeroRes.error.toLowerCase().includes('μηδέν'), `Expected div-by-zero error, got: ${divZeroRes.error}`);

    console.log("testGreekErrorsAndBeginnerHints passed");
}

async function testTypedReadAndGreekBooleans() {
    const okBool = await runCode(`ΑΛΓΟΡΙΘΜΟΣ BoolRead\nΔΕΔΟΜΕΝΑ flag : ΛΟΓΙΚΟΣ;\nΑΡΧΗ\n  ΔΙΑΒΑΣΕ(flag);\n  ΕΑΝ flag ΤΟΤΕ ΤΥΠΩΣΕ("ΝΑΙ") ΑΛΛΙΩΣ ΤΥΠΩΣΕ("ΟΧΙ") ΕΑΝ-ΤΕΛΟΣ\nΤΕΛΟΣ`, ['ΑΛΗΘΗΣ']);
    assert.strictEqual(okBool.error, null);
    assert.strictEqual(okBool.output.trim(), 'ΝΑΙ');

    const badInt = await runCode(`ΑΛΓΟΡΙΘΜΟΣ BadIntRead\nΔΕΔΟΜΕΝΑ k : ΑΚΕΡΑΙΟΣ;\nΑΡΧΗ\n  ΔΙΑΒΑΣΕ(k);\nΤΕΛΟΣ`, ['3.14']);
    assert(badInt.error && badInt.error.includes('ΑΚΕΡΑΙΟΣ'), `Expected integer validation error, got: ${badInt.error}`);

    console.log("testTypedReadAndGreekBooleans passed");
}

async function testBreakpointsAndCallStackRef() {
    const code = `ΑΛΓΟΡΙΘΜΟΣ RefAndBp
ΔΕΔΟΜΕΝΑ X : ΑΚΕΡΑΙΟΣ;
ΔΙΑΔΙΚΑΣΙΑ Διπλασίασε(%α)
ΔΙΕΠΑΦΗ
  ΕΙΣΟΔΟΣ α : ΑΚΕΡΑΙΟΣ;
  ΕΞΟΔΟΣ α : ΑΚΕΡΑΙΟΣ;
ΑΡΧΗ
  α := α * 2;
ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ;
ΑΡΧΗ
  X := 4;
  ΥΠΟΛΟΓΙΣΕ Διπλασίασε(%X);
  ΤΥΠΩΣΕ(X);
ΤΕΛΟΣ`;

    const tokens = tokenize(code);
    const ast = new Parser(tokens).parse();
    const interp = new Interpreter();
    interp.setBreakpoints([8]); // line inside Διπλασίασε

    let hitBreakpointInSubroutine = false;
    let sawRefTarget = false;

    interp.setStepCallback(async ({ line, callStack }) => {
        if (line === 8 && interp.debugMode) {
            hitBreakpointInSubroutine = true;
            if (Array.isArray(callStack) && callStack.length >= 2) {
                const topFrame = callStack[callStack.length - 1];
                if (topFrame.variables && topFrame.variables['α'] && topFrame.variables['α'].refTarget === 'X') {
                    sawRefTarget = true;
                }
            }
            // Resume continuous execution after verifying breakpoint pause
            interp.debugMode = false;
        }
    });

    const res = await interp.interpret(ast);
    assert.strictEqual(res.error, null);
    assert.strictEqual(res.output.trim(), '8');
    assert.ok(hitBreakpointInSubroutine, 'Expected breakpoint on line 8 to switch interpreter into debugMode');
    assert.ok(sawRefTarget, 'Expected callStack frame to expose refTarget="X" for % parameter');

    const { EXAMPLE_INPUTS } = require('../examples.js');
    assert.ok(EXAMPLE_INPUTS && EXAMPLE_INPUTS.AVERAGE && EXAMPLE_INPUTS.BINARY_SEARCH, 'Expected EXAMPLE_INPUTS presets');
    console.log("testBreakpointsAndCallStackRef passed");
}

async function testSelectRecordsAndMathBuiltins() {
    // 1. ΕΠΙΛΕΞΕ ... ΠΕΡΙΠΤΩΣΗ (exact, range, relational, ΑΛΛΙΩΣ)
    const selectCode = `ΑΛΓΟΡΙΘΜΟΣ TestSelect
ΔΕΔΟΜΕΝΑ Β : ΑΚΕΡΑΙΟΣ;
ΑΡΧΗ
  ΓΙΑ Β := 4 ΕΩΣ 10 ΜΕ ΒΗΜΑ 3 ΕΠΑΝΑΛΑΒΕ
    ΕΠΙΛΕΞΕ Β
      ΠΕΡΙΠΤΩΣΗ 9..10 :
        ΤΥΠΩΣΕ("ΑΡΙΣΤΑ", EOLN);
      ΠΕΡΙΠΤΩΣΗ 7, 8 :
        ΤΥΠΩΣΕ("ΛΙΑΝ ΚΑΛΩΣ", EOLN);
      ΠΕΡΙΠΤΩΣΗ ΑΛΛΙΩΣ :
        ΤΥΠΩΣΕ("ΑΠΟΤΥΧΙΑ", EOLN);
    ΕΠΙΛΕΞΕ-ΤΕΛΟΣ
  ΓΙΑ-ΤΕΛΟΣ
ΤΕΛΟΣ`;
    const selRes = await runCode(selectCode);
    assert.strictEqual(selRes.error, null, `Select error: ${selRes.error}`);
    assert.deepStrictEqual(selRes.output.trim().split('\n').map(s => s.trim()), ['ΑΠΟΤΥΧΙΑ', 'ΛΙΑΝ ΚΑΛΩΣ', 'ΑΡΙΣΤΑ']);

    // 2. ΤΥΠΟΙ ... ΕΓΓΡΑΦΗ + Array of Records + % pass-by-reference + Built-in Math (SQRT/Τ_Ρ, ABS/Α_Τ, Α_Μ, ROUND)
    const recCode = `ΑΛΓΟΡΙΘΜΟΣ TestRecordsAndMath
ΤΥΠΟΙ
  Φοιτητής = ΕΓΓΡΑΦΗ
    όνομα : ΣΥΜΒΟΛΟΣΕΙΡΑ;
    βαθμός : ΠΡΑΓΜΑΤΙΚΟΣ;
  ΤΕΛΟΣ-ΕΓΓΡΑΦΗΣ;
ΔΕΔΟΜΕΝΑ
  τάξη : ARRAY[1..2] OF Φοιτητής;
  ρίζα : ΠΡΑΓΜΑΤΙΚΟΣ;

ΔΙΑΔΙΚΑΣΙΑ Βαθμολόγησε(%φ, ν)
ΔΙΕΠΑΦΗ
  ΕΙΣΟΔΟΣ φ : Φοιτητής; ν : ΠΡΑΓΜΑΤΙΚΟΣ;
  ΕΞΟΔΟΣ φ : Φοιτητής;
ΑΡΧΗ
  φ.βαθμός := ν;
ΤΕΛΟΣ-ΔΙΑΔΙΚΑΣΙΑΣ

ΑΡΧΗ
  τάξη[1].όνομα := "Μαρία";
  ΥΠΟΛΟΓΙΣΕ Βαθμολόγησε(%τάξη[1], 9.6);
  τάξη[2].όνομα := "Νίκος";
  ΔΙΑΒΑΣΕ(τάξη[2].βαθμός);
  ρίζα := Τ_Ρ(Α_Τ(-16)) + Α_Μ(3.9) + ROUND(τάξη[1].βαθμός);
  ΤΥΠΩΣΕ(τάξη[1].όνομα, ":", τάξη[1].βαθμός, "|", τάξη[2].όνομα, ":", τάξη[2].βαθμός, "|", ρίζα);
ΤΕΛΟΣ`;
    const recRes = await runCode(recCode, ['8.5']);
    assert.strictEqual(recRes.error, null, `Record/Math error: ${recRes.error}`);
    // Τ_Ρ(16)=4 + Α_Μ(3.9)=3 + ROUND(9.6)=10 => 17
    assert.ok(recRes.output.includes('Μαρία') && recRes.output.includes('9.6') && recRes.output.includes('8.5') && recRes.output.includes('17'), `Unexpected output: ${recRes.output}`);
    console.log("testSelectRecordsAndMathBuiltins passed");
}

async function testDocxExporterArchive() {
    const EAPDocx = require('../docx-exporter.js');
    const samplePng = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0, 0, 0x04, 0xB0, // width = 1200
        0, 0, 0x03, 0x20, // height = 800
        8, 6, 0, 0, 0, 0, 0, 0, 0,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    const dims = EAPDocx.readPngDimensions(samplePng);
    assert.strictEqual(dims.width, 1200);
    assert.strictEqual(dims.height, 800);

    const docxBytes = EAPDocx.buildDocxBytes({
        title: 'ΓΕ1 — Θέμα 3 (ΕΑΠ)',
        subtitle: 'Αυτόματη Αναφορά ΠΛΗ10/ΠΛΗ11',
        sections: [
            { type: 'paragraph', text: 'Εκφώνηση άσκησης με ελληνικούς χαρακτήρες.' },
            { type: 'code', title: 'Ψευδοκώδικας', code: 'ΑΛΓΟΡΙΘΜΟΣ Test\nΑΡΧΗ\n  ΤΥΠΩΣΕ("OK");\nΤΕΛΟΣ' },
            { type: 'table', title: 'Πίνακας Τιμών', headers: ['Βήμα', 'Χ', 'Έξοδος'], rows: [['1', '10', 'OK']] },
            { type: 'image', title: 'Διάγραμμα ΔΔΠ', pngBytes: samplePng, caption: 'Σχήμα 1' }
        ]
    });

    // Verify valid PK\x03\x04 ZIP header & EOCD PK\x05\x06 trailer + OpenXML parts inside
    assert.strictEqual(docxBytes[0], 0x50); // 'P'
    assert.strictEqual(docxBytes[1], 0x4B); // 'K'
    assert.strictEqual(docxBytes[2], 0x03);
    assert.strictEqual(docxBytes[3], 0x04);
    const eocdOffset = docxBytes.length - 22;
    assert.strictEqual(docxBytes[eocdOffset], 0x50);
    assert.strictEqual(docxBytes[eocdOffset + 1], 0x4B);
    assert.strictEqual(docxBytes[eocdOffset + 2], 0x05);
    assert.strictEqual(docxBytes[eocdOffset + 3], 0x06);

    const asciiText = Buffer.from(docxBytes).toString('utf8');
    assert.ok(asciiText.includes('[Content_Types].xml'));
    assert.ok(asciiText.includes('word/document.xml'));
    assert.ok(asciiText.includes('word/media/image1.png'));
    assert.ok(asciiText.includes('ΓΕ1 — Θέμα 3 (ΕΑΠ)'));
    assert.ok(asciiText.includes('<w:tbl>'));
    assert.ok(asciiText.includes('<wp:inline'));
    console.log("testDocxExporterArchive passed");
}

(async () => {
    try {
        await testHello();
        await testArithmetic();
        await testIf();
        await testLoop();
        await testCaseInsensitive();
        await testRead();
        await testBubbleSort();
        await testInfiniteLoopProtection();
        await testGreekErrorsAndBeginnerHints();
        await testTypedReadAndGreekBooleans();
        await testBreakpointsAndCallStackRef();
        await testSelectRecordsAndMathBuiltins();
        await testDocxExporterArchive();
        console.log("All tests passed!");
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
})();
