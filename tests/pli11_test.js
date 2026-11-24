// -----------------------------------------------------------------------------
// Unit & Integration Tests for EAP ΠΛΗ11 Compiler, Validator, DFD & SVG Renderer
// -----------------------------------------------------------------------------

const assert = require('assert');
const Core = require('../pli11-core.js');
const Renderer = require('../pli11-renderer.js');
const { PLI11_EXAMPLES, PLI11_DFD_PRESETS } = require('../pli11-examples.js');

function testOfficialExamplesZeroErrors() {
  const validKeys = [
    'OSS2_SIMPLE_KM',
    'OSS2_TRANSACTION_CENTER',
    'EXAM_WHILE_IF',
    'GE1_2025_2026_PARTIAL',
    'GE1_2025_2026_FULL',
    'GE1_2024_2025',
    'GE1_2023_2024',
    'GE1_2022_2023'
  ];

  for (const key of validKeys) {
    const code = PLI11_EXAMPLES[key];
    assert.ok(code, `Missing example ${key}`);
    const res = Core.compilePLI11(code);
    const errors = res.validation.diagnostics.filter((d) => d.severity === 'error');
    assert.strictEqual(
      errors.length,
      0,
      `Expected 0 errors for ${key}, got: ${JSON.stringify(errors)}`
    );
    assert.ok(res.model.rootNode, `Expected rootNode for ${key}`);
    assert.ok(res.callTrace.length > 0, `Expected non-empty callTrace for ${key}`);
  }
  console.log('testOfficialExamplesZeroErrors passed');
}

function testHomoglyphNormalization() {
  // Uses Greek Μ, Α, Ε, ΙΝ/ΟUΤ mixed with Latin M, A, E, IN/OUT
  const code = `
PROCEDURE EXEC_Μ1
  LOCAL VAR Α, Μ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, M;
  CALL GET_A(Α);
  CALL CALC_Μ1(A, Μ);
  CALL PUT_Μ(M);
END_PROCEDURE;

PROCEDURE GET_A(Α: ΙΝ/ΟUΤ)
  Διάβασε Α από την Πηγή 1;
END_PROCEDURE;

PROCEDURE CALC_Μ1(A: ΙΝ, Μ: ΙΝ/ΟUΤ)
  Υπολόγισε το M από το A;
END_PROCEDURE;

PROCEDURE PUT_Μ(M: ΙΝ)
  ΕΜΦΑΝΙΣΕ M στον Αποδέκτη 1;
END_PROCEDURE;`;

  const res = Core.compilePLI11(code);
  const errors = res.validation.diagnostics.filter((d) => d.severity === 'error');
  assert.strictEqual(errors.length, 0, `Homoglyphs caused false errors: ${JSON.stringify(errors)}`);
  const infos = res.validation.diagnostics.filter((d) => d.code === 'I02_HOMOGLYPH_MIX');
  assert.ok(infos.length >= 1, 'Expected I02_HOMOGLYPH_MIX notice for mixed Greek/Latin identifiers');
  console.log('testHomoglyphNormalization passed');
}

function testValidatorRules() {
  // E02 & E03: Redeclared formal param in LOCAL VAR + initialized (OE1 trap)
  {
    const r = Core.compilePLI11(`
PROCEDURE Put_Δ(Δ: IN)
  LOCAL VAR Δ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ;
  ΕΜΦΑΝΙΣΕ Δ στον Αποδέκτη 1;
END_PROCEDURE;`);
    const codes = r.validation.diagnostics.map((d) => d.code);
    assert.ok(codes.includes('E02_PARAM_REDECLARED_LOCAL'), 'Missing E02');
    assert.ok(codes.includes('E03_PARAM_INITIALIZED'), 'Missing E03');
  }

  // E04: Root has params when multi-proc hierarchy exists
  {
    const r = Core.compilePLI11(`
PROCEDURE EXEC_P2_P3(D, B: IN)
  LOCAL VAR F;
  ΑΡΧΙΚΟΠΟΙΗΣΕ F;
  CALL CALC_P2(D, B, F);
  CALL EXEC_P4(F);
END_PROCEDURE;
PROCEDURE EXEC_P4(F: IN)
  CALL PUT_F(F);
END_PROCEDURE;`);
    assert.ok(r.validation.diagnostics.some((d) => d.code === 'E04_ROOT_HAS_PARAMS'), 'Missing E04');
  }

  // E05: Undeclared variable
  {
    const r = Core.compilePLI11(`
PROCEDURE Exec_P1
  LOCAL VAR G, D;
  ΑΡΧΙΚΟΠΟΙΗΣΕ G, D;
  CALL GET_A(A);
END_PROCEDURE;`);
    assert.ok(r.validation.diagnostics.some((d) => d.code === 'E05_UNDECLARED_VAR'), 'Missing E05');
  }

  // E06: Uninitialized LOCAL VAR in control module (OE1 rule)
  {
    const r = Core.compilePLI11(`
PROCEDURE Exec_M3
  LOCAL VAR Λ, Ν, Τ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Λ, Ν;
  CALL Get_Λ(Λ);
  CALL Calc_M3(Λ, Ν, Τ);
  CALL Put_Τ(Τ);
END_PROCEDURE;
PROCEDURE Get_Λ(Λ: IN/OUT)
  Διάβασε Λ από Πηγή 1;
END_PROCEDURE;
PROCEDURE Calc_M3(Λ: IN, Ν, Τ: IN/OUT)
  Υπολόγισε Ν, Τ;
END_PROCEDURE;
PROCEDURE Put_Τ(Τ: IN)
  ΕΜΦΑΝΙΣΕ Τ στον Αποδέκτη 1;
END_PROCEDURE;`);
    assert.ok(r.validation.diagnostics.some((d) => d.code === 'E06_UNINITIALIZED_LOCAL'), 'Missing E06');
  }

  // E07: Call arity mismatch
  {
    const r = Core.compilePLI11(`
PROCEDURE Exec_M1
  LOCAL VAR A, B, Γ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B, Γ;
  CALL Get_A(A);
  CALL Calc_M1(A, B);
END_PROCEDURE;
PROCEDURE Get_A(A: IN/OUT)
  Διάβασε A;
END_PROCEDURE;
PROCEDURE Calc_M1(A, B: IN, Γ: IN/OUT)
  Υπολόγισε Γ;
END_PROCEDURE;`);
    assert.ok(r.validation.diagnostics.some((d) => d.code === 'E07_CALL_ARITY_MISMATCH'), 'Missing E07');
  }

  // E08: Data-flow order violation (Calc called before Exec/Get produces inputs)
  {
    const r = Core.compilePLI11(`
PROCEDURE Exec_M2_M4
  LOCAL VAR Σ, Ρ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Σ, Ρ;
  CALL Calc_M2(Σ, Ρ);
  CALL Exec_M1(Σ);
END_PROCEDURE;
PROCEDURE Calc_M2(Σ: IN, Ρ: IN/OUT)
  Υπολόγισε Ρ;
END_PROCEDURE;
PROCEDURE Exec_M1(Σ: IN/OUT)
  LOCAL VAR A;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A;
  CALL Get_A(A);
  CALL Calc_M1(A, Σ);
END_PROCEDURE;`);
    assert.ok(r.validation.diagnostics.some((d) => d.code === 'E08_DATAFLOW_ORDER'), 'Missing E08');
  }

  // E09: Wrong direction on Get_* / Put_*
  {
    const r = Core.compilePLI11(`
PROCEDURE Exec_M1
  LOCAL VAR A, B;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B;
  CALL Get_A(A);
  CALL Calc_M1(A, B);
  CALL Put_B(B);
END_PROCEDURE;
PROCEDURE Get_A(A: IN)
  Διάβασε A;
END_PROCEDURE;
PROCEDURE Calc_M1(A: IN, B: IN/OUT)
  Υπολόγισε B;
END_PROCEDURE;
PROCEDURE Put_B(B: IN/OUT)
  ΕΜΦΑΝΙΣΕ B;
END_PROCEDURE;`);
    const e09 = r.validation.diagnostics.filter((d) => d.code === 'E09_WRONG_PARAM_DIRECTION');
    assert.strictEqual(e09.length, 2, 'Expected E09 on both Get_A(:IN) and Put_B(:IN/OUT)');
  }

  // E10: Hierarchy cycle (OE1 hierarchy cycle check)
  {
    const r = Core.compilePLI11(`
PROCEDURE EXEC_M4_M5
  LOCAL VAR M, Φ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ M, Φ;
  CALL GET_M(M);
  CALL GET_Φ(Φ);
  CALL Exec_M3(M, Φ);
END_PROCEDURE;
PROCEDURE Exec_M3(M, Φ: IN)
  LOCAL VAR Δ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ;
  CALL Calc_M3(M, Φ, Δ);
  CALL EXEC_M4_M5;
END_PROCEDURE;`);
    assert.ok(r.validation.diagnostics.some((d) => d.code === 'E10_HIERARCHY_CYCLE'), 'Missing E10');
  }

  // E11: Duplicate proc + E01 unclosed proc
  {
    const r = Core.compilePLI11(`
PROCEDURE A
  LOCAL VAR X;
  ΑΡΧΙΚΟΠΟΙΗΣΕ X;
END_PROCEDURE;
PROCEDURE A
  LOCAL VAR Y;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Y;`);
    const codes = r.validation.diagnostics.map((d) => d.code);
    assert.ok(codes.includes('E11_DUPLICATE_PROC'), 'Missing E11');
    assert.ok(codes.includes('E01_SYNTAX'), 'Missing E01 for unclosed procedure');
  }

  // OE1_TRAPS_DEMO triggers all expected rules
  {
    const r = Core.compilePLI11(PLI11_EXAMPLES.OE1_TRAPS_DEMO);
    const errCodes = new Set(r.validation.diagnostics.filter((d) => d.severity === 'error').map((d) => d.code));
    assert.ok(errCodes.has('E04_ROOT_HAS_PARAMS'));
    assert.ok(errCodes.has('E06_UNINITIALIZED_LOCAL'));
    assert.ok(errCodes.has('E08_DATAFLOW_ORDER'));
    assert.ok(errCodes.has('E09_WRONG_PARAM_DIRECTION'));
    assert.ok(errCodes.has('E02_PARAM_REDECLARED_LOCAL'));
    assert.ok(errCodes.has('E03_PARAM_INITIALIZED'));
    assert.ok(errCodes.has('E10_HIERARCHY_CYCLE'));
  }

  console.log('testValidatorRules passed');
}

function testDDPCountsAndEdgeDirections() {
  // OSS2 Simple KM: 6 modules (1 control, 1 calc, 2 presentation, 2 dataMgmt)
  const simple = Core.compilePLI11(PLI11_EXAMPLES.OSS2_SIMPLE_KM);
  assert.deepStrictEqual(simple.model.counts, {
    control: 1, calc: 1, presentation: 2, dataMgmt: 2, ioGeneric: 0, stubs: 0, total: 6
  });
  const getDEdge = simple.model.edges.find((e) => e.toName === Core.normalizeId('GetΔ'));
  assert.strictEqual(getDEdge.inputs.length, 0, 'GetΔ must have 0 downward inputs');
  assert.strictEqual(getDEdge.outputs.length, 1, 'GetΔ must have 1 upward output (Δ)');
  const putZEdge = simple.model.edges.find((e) => e.toName === Core.normalizeId('PutΖ'));
  assert.strictEqual(putZEdge.inputs.length, 1, 'PutΖ must have 1 downward input (Ζ)');
  assert.strictEqual(putZEdge.outputs.length, 0, 'PutΖ must have 0 upward outputs');

  // GE1 2024-25 Transaction Center: Calc_M3 emits controlFlag "flag" (●→)
  const kd = Core.compilePLI11(PLI11_EXAMPLES.GE1_2024_2025);
  assert.strictEqual(kd.model.architecture, 'TRANSACTION_CENTER');
  const calcM3Edge = kd.model.edges.find((e) => e.toName === 'CALC_M3');
  assert.strictEqual(calcM3Edge.controlFlags.length, 1, 'Calc_M3 should produce 1 control flag');
  assert.strictEqual(calcM3Edge.controlFlags[0].canonical, 'FLAG');

  // GE1 2025-26 Full: 16 modules (4 control, 6 calc, 3 presentation, 3 dataMgmt)
  const full = Core.compilePLI11(PLI11_EXAMPLES.GE1_2025_2026_FULL);
  assert.deepStrictEqual(full.model.counts, {
    control: 4, calc: 6, presentation: 3, dataMgmt: 3, ioGeneric: 0, stubs: 0, total: 16
  });
  console.log('testDDPCountsAndEdgeDirections passed');
}

function testDFDSynthesisAndMermaid() {
  const full = Core.compilePLI11(PLI11_EXAMPLES.GE1_2025_2026_FULL);
  assert.strictEqual(full.dfd.processes.length, 6);
  assert.strictEqual(full.dfd.stores.length, 3);
  assert.strictEqual(full.dfd.entities.length, 3);
  assert.strictEqual(full.dfd.hasGenericIO, false);

  // Check M4 -> M3 flow with data Ζ
  const m4Node = full.dfd.processes.find((p) => p.key === 'M4');
  const m3Node = full.dfd.processes.find((p) => p.key === 'M3');
  const m4ToM3 = full.dfd.flows.find((f) => f.from === m4Node.id && f.to === m3Node.id);
  assert.ok(m4ToM3, 'Expected DFD flow M4 -> M3');
  assert.ok(m4ToM3.data.some((d) => Core.normalizeId(d) === 'Z'));

  // Mermaid checks
  assert.ok(full.ddpMermaid.startsWith('flowchart TD'), 'Expected flowchart TD for DDP Mermaid');
  assert.ok(full.dfdMermaid.startsWith('flowchart LR'), 'Expected flowchart LR for DFD Mermaid');
  assert.ok(full.dfdMermaid.includes('subgraph KM['), 'Expected central subgraph in DFD Mermaid');
  console.log('testDFDSynthesisAndMermaid passed');
}

function testReverseDFDBuilderRoundTrip() {
  for (const [key, preset] of Object.entries(PLI11_DFD_PRESETS)) {
    const spec = Core.parseDFDText(preset.dsl);
    assert.strictEqual(spec.parseErrors.length, 0, `DSL parse errors in ${key}`);
    const generated = Core.compileDFDToPLI11(spec);
    const compiled = Core.compilePLI11(generated);
    const errs = compiled.validation.diagnostics.filter((d) => d.severity === 'error');
    assert.strictEqual(errs.length, 0, `Generated code errors in ${key}: ${JSON.stringify(errs)}`);
    assert.ok(compiled.model.rootNode, `Missing root in generated ${key}`);
    assert.ok(compiled.dfd.flows.length >= spec.flows.length - 1, `Missing flows in roundtrip ${key}`);
  }
  console.log('testReverseDFDBuilderRoundTrip passed');
}

function testSVGRenderingAndHelpers() {
  const full = Core.compilePLI11(PLI11_EXAMPLES.GE1_2025_2026_FULL);
  const ddpColor = Renderer.renderDDPSVG(full.model, { theme: 'light', printMode: false });
  const ddpPrint = Renderer.renderDDPSVG(full.model, { printMode: true, activeNodeId: full.model.rootNode.id });
  const dfdSvg = Renderer.renderDFDSVG(full.dfd, { theme: 'dark' });

  assert.ok(ddpColor.startsWith('<svg ') && ddpColor.includes('</svg>'));
  assert.ok(ddpPrint.includes('EXEC_M3_M4_M5') && ddpPrint.includes('#ffffff'));
  assert.ok(dfdSvg.startsWith('<svg ') && dfdSvg.includes('Αποθήκη 3'));

  // Trace & Format
  assert.ok(full.callTrace.length > 10);
  assert.strictEqual(full.callTrace[0].action, 'ENTER');
  const formatted = Core.formatPLI11('PROCEDURE X\nLOCAL VAR A;\nEND_PROCEDURE;');
  assert.ok(formatted.includes('  LOCAL VAR A;'));

  console.log('testSVGRenderingAndHelpers passed');
}

function testUniversalKMFrameIsolationAndNoOverlaps() {
  for (const [key, code] of Object.entries(PLI11_EXAMPLES)) {
    const res = Core.compilePLI11(code);
    const dfd = res.dfd;
    for (const mode of [{ theme: 'light' }, { theme: 'dark' }, { printMode: true }]) {
      const svg = Renderer.renderDFDSVG(dfd, mode);
      assert.ok(svg.startsWith('<svg ') && svg.endsWith('</svg>'), `Invalid SVG for ${key}`);

      const kmMatch = svg.match(/<rect\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"[^>]+stroke-dasharray="6 4"/);
      const hasCentral = dfd.processes.some((p) => p.isCentral);
      if (hasCentral && kmMatch) {
        const km = {
          left: parseFloat(kmMatch[1]),
          top: parseFloat(kmMatch[2]),
          width: parseFloat(kmMatch[3]),
          height: parseFloat(kmMatch[4]),
          right: parseFloat(kmMatch[1]) + parseFloat(kmMatch[3]),
          bottom: parseFloat(kmMatch[2]) + parseFloat(kmMatch[4])
        };

        // Check central processes are inside KM
        const centralProcs = dfd.processes.filter((p) => p.isCentral);
        for (const cp of centralProcs) {
          const nodeRegex = new RegExp(`<g class="dfd-node">\\s*<circle\\s+cx="([^"]+)"\\s+cy="([^"]+)"\\s+r="([^"]+)"[^>]*/>\\s*<text[^>]*>${cp.label}<\\/text>`);
          const nodeMatch = nodeRegex.exec(svg);
          assert.ok(nodeMatch, `Process circle ${cp.label} not found in ${key}`);
          const cx = parseFloat(nodeMatch[1]);
          const cy = parseFloat(nodeMatch[2]);
          const r = parseFloat(nodeMatch[3]);
          assert.ok(cx - r >= km.left - 1 && cx + r <= km.right + 1, `Central process ${cp.label} not inside KM X bounds in ${key}`);
          assert.ok(cy - r >= km.top - 1 && cy + r <= km.bottom + 1, `Central process ${cp.label} not inside KM Y bounds in ${key}`);
        }

        // Check non-central processes are strictly OUTSIDE KM
        const nonCentralProcs = dfd.processes.filter((p) => !p.isCentral);
        for (const ncp of nonCentralProcs) {
          const nodeRegex = new RegExp(`<g class="dfd-node">\\s*<circle\\s+cx="([^"]+)"\\s+cy="([^"]+)"\\s+r="([^"]+)"[^>]*/>\\s*<text[^>]*>${ncp.label}<\\/text>`);
          const nodeMatch = nodeRegex.exec(svg);
          assert.ok(nodeMatch, `Non-central process circle ${ncp.label} not found in ${key}`);
          const cx = parseFloat(nodeMatch[1]);
          const cy = parseFloat(nodeMatch[2]);
          const r = parseFloat(nodeMatch[3]);
          const left = cx - r;
          const right = cx + r;
          const top = cy - r;
          const bottom = cy + r;
          const overlapsKM = right > km.left && left < km.right && bottom > km.top && top < km.bottom;
          assert.ok(!overlapsKM, `Non-central process ${ncp.label} OVERLAPS KM frame in ${key}!`);
        }

        // Check entities are strictly OUTSIDE KM
        const entityRegex = /<g class="dfd-entity">\s*<rect\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"[^>]*\/>\s*<text[^>]*>([^<]+)<\/text>/g;
        let em;
        while ((em = entityRegex.exec(svg)) !== null) {
          const ex = parseFloat(em[1]);
          const ey = parseFloat(em[2]);
          const ew = parseFloat(em[3]);
          const eh = parseFloat(em[4]);
          const overlapsKM = ex + ew > km.left && ex < km.right && ey + eh > km.top && ey < km.bottom;
          assert.ok(!overlapsKM, `Entity ${em[5]} OVERLAPS KM frame in ${key}!`);
        }
      }
    }
  }
  console.log('testUniversalKMFrameIsolationAndNoOverlaps passed');
}

testOfficialExamplesZeroErrors();
testHomoglyphNormalization();
testValidatorRules();
testDDPCountsAndEdgeDirections();
testDFDSynthesisAndMermaid();
testReverseDFDBuilderRoundTrip();
testSVGRenderingAndHelpers();
testUniversalKMFrameIsolationAndNoOverlaps();
console.log('All ΠΛΗ11 tests passed!');
