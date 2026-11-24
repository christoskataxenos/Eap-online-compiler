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
          const nodeRegex = new RegExp(`<g class="dfd-node"[^>]*>\\s*<circle\\s+cx="([^"]+)"\\s+cy="([^"]+)"\\s+r="([^"]+)"[^>]*/>\\s*<text[^>]*>${cp.label}<\\/text>`);
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
          const nodeRegex = new RegExp(`<g class="dfd-node"[^>]*>\\s*<circle\\s+cx="([^"]+)"\\s+cy="([^"]+)"\\s+r="([^"]+)"[^>]*/>\\s*<text[^>]*>${ncp.label}<\\/text>`);
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
        const entityRegex = /<g class="dfd-entity"[^>]*>\s*<rect\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"[^>]*\/>\s*<text[^>]*>([^<]+)<\/text>/g;
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

function testDirectivesAndDFDSync() {
  const code = `
/* @KM: M3 */
/* @ALIAS: Δ = "Αρχείο Πελατών" */
/* @MERGE_SOURCES: "Χρήστης" = * */
/* @MERGE_SINKS: "Οθόνη" = * */
/* @HIDE_FLOW: P */

${PLI11_EXAMPLES.GE1_2023_2024}
`;

  const res = Core.compilePLI11(code);
  const dfd = res.dfd;

  const centrals = dfd.processes.filter((p) => p.isCentral).map((p) => p.label);
  assert.deepStrictEqual(centrals, ['M3'], 'Expected only M3 to be central');
  assert.ok(dfd.entities.some((e) => e.label === 'Χρήστης'), 'Expected merged entity Χρήστης');
  assert.ok(dfd.entities.some((e) => e.label === 'Οθόνη'), 'Expected merged entity Οθόνη');

  const hasFlowP = dfd.flows.some((f) => f.data.includes('P') || f.data.includes('Ρ'));
  assert.strictEqual(hasFlowP, false, 'Expected flow P to be hidden');

  const dsl = Core.serializeDFDToDSL(dfd);
  assert.ok(dsl.includes('KM: M3'));
  assert.ok(dsl.includes('[Χρήστης]'));
  assert.ok(dsl.includes('[Οθόνη]'));

  const spec = Core.parseDFDText(dsl);
  assert.strictEqual(spec.mode, 'KM');
  assert.deepStrictEqual(spec.central, ['M3']);

  const reDFD = Core.dfdSpecToDFD(spec);
  assert.strictEqual(reDFD.processes.length, dfd.processes.length);
  assert.ok(reDFD.processes.some((p) => p.label === 'M3' && p.isCentral));
  assert.ok(reDFD.entities.some((e) => e.label === 'Χρήστης'));
  assert.ok(reDFD.entities.some((e) => e.label === 'Οθόνη'));

  const svg = Renderer.renderDFDSVG(reDFD);
  assert.ok(svg.includes('Χρήστης'));
  assert.ok(svg.includes('Οθόνη'));
  console.log('testDirectivesAndDFDSync passed');
}

function testDFDCustomPositionsAndDragSupport() {
  const code = PLI11_EXAMPLES.GE1_2023_2024;
  const compiled = Core.compilePLI11(code);
  const dfd = compiled.dfd;

  // Render with default layout
  const defaultSvg = Renderer.renderDFDSVG(dfd);
  assert.ok(defaultSvg.includes('data-node-id="P_M3"'));
  assert.ok(defaultSvg.includes('cursor: grab;'));

  // Now render with custom positions moving M3
  const customPositions = {
    P_M3: { x: 550, y: 320 }
  };
  const customSvg = Renderer.renderDFDSVG(dfd, { positions: customPositions });

  // Verify that M3 position has been updated exactly
  assert.ok(customSvg.includes('data-node-id="P_M3" data-x="550.0" data-y="320.0"'));

  // Verify that KM frame wrapped around M3's updated position (x: 550)
  const kmRegex = /<rect\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"[^>]*stroke-dasharray="6 4"/;
  const kmMatch = kmRegex.exec(customSvg);
  assert.ok(kmMatch, 'KM frame rect found with custom positions');
  const kmLeft = parseFloat(kmMatch[1]);
  const kmRight = kmLeft + parseFloat(kmMatch[3]);
  assert.ok(kmLeft <= 550 && kmRight >= 550, 'KM frame wraps around repositioned central process M3');

  console.log('testDFDCustomPositionsAndDragSupport passed');
}

function testKMToggleAndDirectives() {
  const codeWithNoKM = `/* @KM: NONE */
PROCEDURE MAIN
  LOCAL VAR A, B, C;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B, C;
  CALL GET_A(A);
  CALL CALC_COMPUTE(A, B);
  CALL PUT_C(B);
END_PROCEDURE;
PROCEDURE GET_A(x: IN/OUT) Διάβασε x; END_PROCEDURE;
PROCEDURE CALC_COMPUTE(x: IN, y: IN/OUT) y = x * 2; END_PROCEDURE;
PROCEDURE PUT_C(y: IN) Εμφάνισε y; END_PROCEDURE;`;

  const res = Core.compilePLI11(codeWithNoKM);
  assert.strictEqual(res.dfd.noKM, true, 'Expected noKM to be true');
  assert.strictEqual(res.dfd.showKMFrame, false, 'Expected showKMFrame to be false');
  assert.ok(res.dfd.processes.every((p) => !p.isCentral), 'Expected all processes to have isCentral = false');

  const svgNoKM = Renderer.renderDFDSVG(res.dfd);
  assert.ok(!svgNoKM.includes('stroke-dasharray="6 4"'), 'Should not render dashed KM frame when KM is disabled');
  assert.ok(!svgNoKM.includes('Περίγραμμα ΚΜ'), 'Legend should not contain KM label when KM is disabled');

  // Test toggling KM off on standard example
  const stdRes = Core.compilePLI11(PLI11_EXAMPLES.GE1_2023_2024);
  const svgToggledOff = Renderer.renderDFDSVG(stdRes.dfd, { showKMFrame: false });
  assert.ok(!svgToggledOff.includes('stroke-dasharray="6 4"'), 'Should omit KM box when showKMFrame is false');
  assert.ok(!svgToggledOff.includes('Περίγραμμα ΚΜ'), 'Should omit KM in legend when showKMFrame is false');

  console.log('testKMToggleAndDirectives passed');
}

function testLevel0ContextDiagramSynthesis() {
  const res = Core.compilePLI11(PLI11_EXAMPLES.GE1_2025_2026_FULL);
  const dfd0 = res.dfdLevel0;

  assert.ok(dfd0, 'Level 0 Context Diagram should exist');
  assert.strictEqual(dfd0.level, 0, 'Level should be 0');
  assert.strictEqual(dfd0.isContextDiagram, true, 'isContextDiagram should be true');
  assert.strictEqual(dfd0.processes.length, 1, 'Context Diagram must have exactly 1 system process');
  assert.strictEqual(dfd0.stores.length, 0, 'Context Diagram must not expose internal data stores');
  assert.ok(dfd0.entities.length >= 2, 'External sources and sinks must be preserved');
  assert.ok(dfd0.flows.length >= 2, 'External flows must connect entities to process 0');
  assert.ok(dfd0.flows.every((f) => f.from === 'P_SYSTEM_0' || f.to === 'P_SYSTEM_0'), 'All flows in Level 0 must touch process 0');

  const svg0 = Renderer.renderDFDSVG(dfd0);
  assert.ok(svg0.includes('P_SYSTEM_0'), 'SVG should contain system process');
  assert.ok(!svg0.includes('stroke-dasharray="6 4"'), 'Context Diagram must never have a KM boundary box');
  assert.ok(!svg0.includes('Περίγραμμα ΚΜ'), 'Context Diagram legend must not show KM');
  assert.ok(!svg0.includes('Αποθήκη Δεδομένων'), 'Context Diagram legend must not show stores when none exist');

  // Mermaid Level 0 test
  const mermaid0 = Core.generateDFDMermaid(dfd0);
  assert.ok(!mermaid0.includes('subgraph KM'), 'Mermaid for Level 0 must not contain subgraph KM');
  assert.ok(mermaid0.includes('P_SYSTEM_0'), 'Mermaid should contain system process node');

  console.log('testLevel0ContextDiagramSynthesis passed');
}

function testDFDBuilderNoKMAndLevel0() {
  const dslNoKM = `ΧΩΡΙΣ_ΚΜ
ΠΗΓΗ Χρήστης -> M1 : Είσοδος
M1 -> M2 : Επεξεργασία
M2 -> ΑΠΟΔΕΚΤΗΣ Οθόνη : Έξοδος`;

  const spec = Core.parseDFDText(dslNoKM);
  assert.deepStrictEqual(spec.central, [], 'Expected central to be empty');
  const dfd = Core.dfdSpecToDFD(spec);
  assert.strictEqual(dfd.noKM, true);
  assert.strictEqual(dfd.showKMFrame, false);

  const dslLevel0 = `ΕΠΙΠΕΔΟ: 0
ΧΩΡΙΣ_ΚΜ
ΠΗΓΗ Χρήστης -> 0. Σύστημα : Είσοδος
0. Σύστημα -> ΑΠΟΔΕΚΤΗΣ Οθόνη : Έξοδος`;
  const spec0 = Core.parseDFDText(dslLevel0);
  assert.strictEqual(spec0.level, 0);

  console.log('testDFDBuilderNoKMAndLevel0 passed');
}

function testTextWrappingAndNoOverflow() {
  // Test splitTextIntoLines
  const longEntity = 'Τραπεζικές πληρωμές με χρήση κάρτας';
  const lines = Renderer.splitTextIntoLines(longEntity, 20);
  assert.ok(lines.length >= 2, `Expected at least 2 lines for "${longEntity}", got ${lines.length}`);
  assert.ok(lines.every((l) => l.length <= 22), `All lines should be reasonably short: ${JSON.stringify(lines)}`);

  // Test SVG Multiline Text Generation
  const svgText = Renderer.renderMultilineText(lines, 150, 80, { fontSize: 12 });
  assert.ok(svgText.includes('<tspan'), 'Expected multiline <tspan> elements');
  assert.ok(svgText.includes('Τραπεζικές πληρωμές'), 'Expected first line in SVG');

  // Test DFD with long entity and process
  const dsl = `
ΧΩΡΙΣ_ΚΜ
ΠΗΓΗ Τραπεζικές πληρωμές με χρήση κάρτας -> 0. Σύστημα Ηλεκτρονικών Πληρωμών : Αίτημα_Πληρωμής
0. Σύστημα Ηλεκτρονικών Πληρωμών -> ΑΠΟΔΕΚΤΗΣ Αποτέλεσμα_Έγκρισης_Συναλλαγής : Απόδειξη
`;
  const spec = Core.parseDFDText(dsl);
  const dfd = Core.dfdSpecToDFD(spec);
  const svg = Renderer.renderDFDSVG(dfd, { showLegend: false });

  // Verify entity rectangle exists and has dynamic width without overflow
  assert.ok(svg.includes('class="dfd-entity"'), 'Expected dfd-entity group');
  assert.ok(svg.includes('<tspan'), 'Expected multiline tspans for long labels');

  // Verify DDP module box with long name
  const ddpCode = `
PROCEDURE EXEC_ROOT
  LOCAL VAR X;
  CALL ΔΙΑΧΕΙΡΙΣΗ_ΤΡΑΠΕΖΙΚΩΝ_ΣΥΝΑΛΛΑΓΩΝ(X);
END_PROCEDURE;

PROCEDURE ΔΙΑΧΕΙΡΙΣΗ_ΤΡΑΠΕΖΙΚΩΝ_ΣΥΝΑΛΛΑΓΩΝ(X: IN)
  Επεξεργασία;
END_PROCEDURE;
`;
  const res = Core.compilePLI11(ddpCode);
  const ddpSvg = Renderer.renderDDPSVG(res.model, { showLegend: false });
  assert.ok(ddpSvg.includes('class="ddp-node"'), 'Expected ddp-node group');
  assert.ok(ddpSvg.includes('<tspan'), 'Expected wrapped tspans in DDP node');

  console.log('testTextWrappingAndNoOverflow passed');
}

function testCanvasDimensionsOptions() {
  const code = `
PROCEDURE EXEC_ROOT
  LOCAL VAR A, B;
  CALL CALC_M1(A, B);
END_PROCEDURE;

PROCEDURE CALC_M1(A: IN, B: OUT)
  B <- A;
END_PROCEDURE;
`;
  const compiled = Core.compilePLI11(code);

  // DDP with Full HD dimensions
  const ddpHD = Renderer.renderDDPSVG(compiled.model, {
    canvasWidth: 1920,
    canvasHeight: 1080
  });
  assert.ok(ddpHD.includes('width="1920"'), 'DDP should have width 1920');
  assert.ok(ddpHD.includes('height="1080"'), 'DDP should have height 1080');
  assert.ok(ddpHD.includes('viewBox="'), 'DDP should have viewBox');

  // DFD with A4 Landscape dimensions
  const dfdA4 = Renderer.renderDFDSVG(compiled.dfd, {
    canvasWidth: 1120,
    canvasHeight: 790
  });
  assert.ok(dfdA4.includes('width="1120"'), 'DFD should have width 1120');
  assert.ok(dfdA4.includes('height="790"'), 'DFD should have height 790');

  // Verify PNG export and clipboard methods
  assert.strictEqual(typeof Renderer.downloadPNG, 'function');
  assert.strictEqual(typeof Renderer.copyPNGToClipboard, 'function');

  console.log('testCanvasDimensionsOptions passed');
}

function testDFDFlowLabelOffsetBesideArrows() {
  const dsl = [
    'ΕΠΙΠΕΔΟ: 0',
    'ΧΩΡΙΣ_ΚΜ',
    '[Διαχειριστής] -> (P0) : Εντολή_Ελέγχου_και_Σχόλια',
    '(P0) -> [Διαχειριστής] : Αιτήσεις_και_Αποτελέσματα_Ελέγχου',
    '[Αιτών] -> (P0) : Στοιχεία Αίτησης και Δικαιολογητικά',
    '(P0) -> [Αιτών] : eMail_Επιβεβαίωσης και Σύνδεσμος Κάρτας'
  ].join('\n');

  const spec = Core.parseDFDText(dsl);
  const dfd = Core.dfdSpecToDFD(spec);

  const svg = Renderer.renderDFDSVG(dfd);

  // Extract curves
  const pathRegex = /<path d="M ([0-9.-]+) ([0-9.-]+) Q ([0-9.-]+) ([0-9.-]+), ([0-9.-]+) ([0-9.-]+)"/g;
  const curves = [];
  let m;
  while ((m = pathRegex.exec(svg)) !== null) {
    curves.push({
      pStart: { x: parseFloat(m[1]), y: parseFloat(m[2]) },
      ctrl: { x: parseFloat(m[3]), y: parseFloat(m[4]) },
      pEnd: { x: parseFloat(m[5]), y: parseFloat(m[6]) }
    });
  }

  // Extract pills
  const pillRegex = /<g pointer-events="none" class="ddp-pill-label"([^>]*)>\s*<rect x="([0-9.-]+)" y="([0-9.-]+)" width="([0-9.]+)" height="([0-9.]+)"/g;
  const pills = [];
  while ((m = pillRegex.exec(svg)) !== null) {
    const rawTransform = m[1];
    const transMatch = /translate\(([0-9.-]+),\s*([0-9.-]+)\)/.exec(rawTransform);
    const cx = transMatch ? parseFloat(transMatch[1]) : parseFloat(m[2]) + parseFloat(m[4]) / 2;
    const cy = transMatch ? parseFloat(transMatch[2]) : parseFloat(m[3]) + parseFloat(m[5]) / 2;
    pills.push({
      cx,
      cy,
      w: parseFloat(m[4]),
      h: parseFloat(m[5])
    });
  }

  assert.strictEqual(curves.length, 4, 'Should have 4 flow curves');
  assert.strictEqual(pills.length, 4, 'Should have 4 flow labels');

  // Verify pills are opaque
  assert.ok(svg.includes('fill-opacity="1"'), 'Pill labels should have opaque background');

  // Verify bidirectional flow labels are staggered and never superimposed
  for (let i = 0; i < pills.length; i++) {
    for (let j = i + 1; j < pills.length; j++) {
      const dist = Math.hypot(pills[i].cx - pills[j].cx, pills[i].cy - pills[j].cy);
      assert.ok(dist > 18, `Pills ${i} and ${j} should not be superimposed (dist: ${dist})`);
    }
  }

  console.log('testDFDFlowLabelOffsetBesideArrows passed');
}

function testSequentialProvenanceAndVerticalEAPLayout() {
  // 1. Verify KALLIPOS_SYSTEM_P1 has 0 errors, 4 processes (P1.1..P1.4), no phantom root bubble, and 0 IO->IO bypasses
  const res = Core.compilePLI11(PLI11_EXAMPLES.KALLIPOS_SYSTEM_P1);
  const errs = res.validation.diagnostics.filter((d) => d.severity === 'error');
  assert.strictEqual(errs.length, 0, `Expected 0 errors in KALLIPOS_SYSTEM_P1, got: ${JSON.stringify(errs)}`);

  const dfd = res.dfd;
  assert.strictEqual(dfd.noKM, true, 'Multi-process system coordinator should default to noKM = true');
  assert.strictEqual(dfd.processes.length, 4, `Expected exactly 4 processes (P1.1..P1.4), got: ${dfd.processes.map((p) => p.key).join(', ')}`);
  assert.deepStrictEqual(
    dfd.processes.map((p) => p.key),
    ['P1.1', 'P1.2', 'P1.3', 'P1.4']
  );
  assert.ok(dfd.processes[0].label.includes('Υποβολή Πρότασης'), 'Process P1.1 should preserve its descriptive Greek title');

  // Fundamental DFD invariant: every flow has at least one process endpoint
  const nodeTypeById = new Map(dfd.nodes.map((n) => [n.id, n.type]));
  for (const f of dfd.flows) {
    const tFrom = nodeTypeById.get(f.from);
    const tTo = nodeTypeById.get(f.to);
    assert.ok(
      tFrom === 'process' || tTo === 'process',
      `Illegal direct IO-to-IO flow detected: ${f.from} (${tFrom}) -> ${f.to} (${tTo})`
    );
  }

  // 2. Verify sequential overwrite prevents backward flows when a variable is reused across P1.1 -> P1.2 -> P1.4
  const ermisCode = `
PROCEDURE EXEC_ERMIS
  LOCAL VAR Αίτηση, Κατάσταση;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Αίτηση, Κατάσταση;
  CALL GET_Αίτηση(Αίτηση);
  CALL CALC_P1_1(Αίτηση, Κατάσταση);
  CALL PUT_Αρχείο_Αιτήσεων(Αίτηση, Κατάσταση);
  CALL CALC_P1_2(Αίτηση, Κατάσταση);
  CALL CALC_P1_4(Κατάσταση, Αίτηση);
  CALL PUT_Τράπεζα(Κατάσταση);
END_PROCEDURE;
PROCEDURE GET_Αίτηση(x: IN/OUT) Διάβασε από τον Αιτούντα; END_PROCEDURE;
PROCEDURE CALC_P1_1(a: IN, k: IN/OUT) Υπολόγισε; END_PROCEDURE;
PROCEDURE CALC_P1_2(a: IN, k: IN/OUT) Έλεγξε; END_PROCEDURE;
PROCEDURE CALC_P1_4(k: IN, a: IN/OUT) Έκδοση; END_PROCEDURE;
PROCEDURE PUT_Αρχείο_Αιτήσεων(a, k: IN) Αποθήκευσε στην αποθήκη «Αρχείο Αιτήσεων»; END_PROCEDURE;
PROCEDURE PUT_Τράπεζα(k: IN) ΕΜΦΑΝΙΣΕ στην «Τράπεζα»; END_PROCEDURE;`;

  const ermis = Core.compilePLI11(ermisCode);
  const ermisNodeMap = new Map(ermis.dfd.nodes.map((n) => [n.id, n]));
  // Ensure no doubled "Αρχείο Αρχείο Αιτήσεων"
  assert.ok(ermis.dfd.stores.some((s) => s.label === 'Αρχείο Αιτήσεων'), 'Store label should not double Αρχείο prefix');
  // Ensure Αιτών normalized from accusative Αιτούντα
  assert.ok(ermis.dfd.entities.some((e) => e.label === 'Αιτών'), 'Accusative Αιτούντα should normalize to Αιτών');
  // Ensure zero IO->IO flows and zero backward P1.4 -> P1.2 flows
  for (const f of ermis.dfd.flows) {
    const u = ermisNodeMap.get(f.from);
    const v = ermisNodeMap.get(f.to);
    assert.ok(u.type === 'process' || v.type === 'process', 'Zero IO->IO flows in EXEC_ERMIS');
    assert.ok(!(u.key === 'P1.4' && v.key === 'P1.2'), 'Must not emit backward P1.4 -> P1.2 flow');
    assert.ok(!(u.key === 'P1.1' && v.label === 'Τράπεζα'), 'P1.1 must not connect to PUT_Τράπεζα after P1.4 overwrote Κατάσταση');
  }

  // 3. Verify Vertical EAP Layout & Local Cloning + Word Tight-Crop SVG
  const verticalSvg = Renderer.renderDFDSVG(dfd, { printMode: true, tightCrop: true });
  assert.ok(!verticalSvg.includes('rotate('), 'All DFD flow labels must be horizontal (0 deg rotation)');

  // Extract process circle Y positions and check strict top-to-bottom spine order
  const procRe = /<g class="dfd-node" data-node-id="([^"]+)" data-x="([0-9.-]+)" data-y="([0-9.-]+)"/g;
  const procCoords = [];
  let pm;
  while ((pm = procRe.exec(verticalSvg)) !== null) {
    procCoords.push({ id: pm[1], x: parseFloat(pm[2]), y: parseFloat(pm[3]) });
  }
  assert.strictEqual(procCoords.length, 4, 'Should render 4 process circles');
  for (let i = 0; i < procCoords.length - 1; i++) {
    assert.strictEqual(procCoords[i].x, procCoords[i + 1].x, 'Processes should align on central vertical spine');
    assert.ok(procCoords[i].y < procCoords[i + 1].y, 'Processes should be ordered strictly top-to-bottom');
  }

  // Shared peripherals (e.g. Υποψήφιος, Αρχείο Υποβολών) should be cloned per band (__B)
  assert.ok(verticalSvg.includes('__B'), 'Shared stores/entities should have local band clones to prevent spiderweb crossings');

  // 4. Verify @KM with all processes central + preceding banner comments triggers vertical EAP layout cleanly
  const allKmCode = `/* @KM: P1_1, P1_2 */
PROCEDURE EXEC_ERMIS
  LOCAL VAR Δ1, Δ2;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ1, Δ2;
  CALL EXEC_P1_1(Δ1);
  CALL EXEC_P1_2(Δ2);
END_PROCEDURE;
/* 1. ΥΠΟΒΟΛΗ ΑΙΤΗΣΗΣ (P1.1) */
PROCEDURE EXEC_P1_1(Δ1: IN/OUT)
  LOCAL VAR Α, Β;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Α, Β;
  CALL GET_Α(Α);
  CALL CALC_P1_1(Α, Β);
  CALL PUT_Β(Β);
END_PROCEDURE;
/* 2. ΕΛΕΓΧΟΣ ΠΡΟΫΠΟΘΕΣΕΩΝ (P1.2) */
PROCEDURE EXEC_P1_2(Δ2: IN/OUT)
  LOCAL VAR Γ, Ε;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Γ, Ε;
  CALL GET_Γ(Γ);
  CALL CALC_P1_2(Γ, Ε);
  CALL PUT_Ε(Ε);
END_PROCEDURE;
PROCEDURE GET_Α(Α: IN/OUT) Διάβασε το Α από την εξωτερική οντότητα «Αιτών»; END_PROCEDURE;
PROCEDURE CALC_P1_1(Α: IN, Β: IN/OUT) Υπολόγισε Β; END_PROCEDURE;
PROCEDURE PUT_Β(Β: IN) Αποθήκευσε το Β στο αρχείο «Αιτήσεων»; END_PROCEDURE;
PROCEDURE GET_Γ(Γ: IN/OUT) Διάβασε το Γ από το αρχείο «Αιτήσεων»; END_PROCEDURE;
PROCEDURE CALC_P1_2(Γ: IN, Ε: IN/OUT) Υπολόγισε Ε; END_PROCEDURE;
PROCEDURE PUT_Ε(Ε: IN) ΕΜΦΑΝΙΣΕ το Ε στην εξωτερική οντότητα «Αιτών»; END_PROCEDURE;`;

  const allKmRes = Core.compilePLI11(allKmCode);
  assert.ok(allKmRes.dfd.processes[0].label.includes('ΥΠΟΒΟΛΗ ΑΙΤΗΣΗΣ'), 'Banner comment above EXEC_P1_1 should enrich P1.1 label');
  const allKmSvg = Renderer.renderDFDSVG(allKmRes.dfd, { layoutMode: 'auto', showKMFrame: true, clonePeripherals: true });
  assert.ok(allKmSvg.includes('__B1'), 'Auto layout must still use vertical spine + local cloning when @KM includes all processes');

  // 5. Verify PNG pHYs 300+ DPI metadata chunk injection
  const dummyPng = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x06, 0x00,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  const withDpi = Renderer.injectPngPhysDpi(dummyPng, 350);
  assert.strictEqual(withDpi.length, dummyPng.length + 21, 'pHYs chunk should add 21 bytes');
  const chunkTag = String.fromCharCode(withDpi[37], withDpi[38], withDpi[39], withDpi[40]);
  assert.strictEqual(chunkTag, 'pHYs', 'pHYs chunk should sit immediately after IHDR');

  console.log('testSequentialProvenanceAndVerticalEAPLayout passed');
}

testOfficialExamplesZeroErrors();
testHomoglyphNormalization();
testValidatorRules();
testDDPCountsAndEdgeDirections();
testDFDSynthesisAndMermaid();
testReverseDFDBuilderRoundTrip();
testSVGRenderingAndHelpers();
testUniversalKMFrameIsolationAndNoOverlaps();
testDirectivesAndDFDSync();
testDFDCustomPositionsAndDragSupport();
testKMToggleAndDirectives();
testLevel0ContextDiagramSynthesis();
testDFDBuilderNoKMAndLevel0();
testTextWrappingAndNoOverflow();
testCanvasDimensionsOptions();
testDFDFlowLabelOffsetBesideArrows();
testSequentialProvenanceAndVerticalEAPLayout();
console.log('All ΠΛΗ11 tests passed!');
