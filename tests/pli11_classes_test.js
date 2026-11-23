// -----------------------------------------------------------------------------
// Unit & Integration Tests for EAP ΠΛΗ11 Class Diagrams Core & SVG Renderer
// -----------------------------------------------------------------------------

const assert = require('assert');
const Core = require('../pli11-classes-core.js');
const Renderer = require('../pli11-classes-renderer.js');
const { PLI11_CLASS_EXAMPLES } = require('../pli11-classes-examples.js');

function testOfficialOSS2PseudocodeParsing() {
  const res = Core.compileClassDiagram(PLI11_CLASS_EXAMPLES.OSS2_GEOMETRIC_SHAPES);
  assert.strictEqual(res.validation.errorCount, 0, 'OSS2 shapes should have 0 errors');
  assert.strictEqual(res.stats.classes, 4, 'OSS2 shapes should have 4 classes');
  assert.strictEqual(res.stats.inheritance, 3, 'OSS2 shapes should have 3 inheritance relations');

  const base = res.model.classes.find((c) => c.name === 'Γεωμετρικό Σχήμα');
  assert.ok(base, 'Multi-word Greek superclass must parse cleanly');
  assert.ok(base.attributes.some((a) => a.name === 'Σημείο-Χ' && a.visibility === '-' && a.type === 'INTEGER'));
  assert.ok(base.attributes.some((a) => a.name === 'Σημείο-Υ' && a.visibility === '-' && a.type === 'INTEGER'));
  assert.strictEqual(base.methods.length, 2, 'Should parse 2 PUBLIC methods');

  const sq = res.model.classes.find((c) => c.name === 'Τετράγωνο');
  assert.ok(sq && sq.parents.includes('Γεωμετρικό Σχήμα'), 'Child class should extend Γεωμετρικό Σχήμα');
  assert.ok(sq.methods.some((m) => m.name === 'ΔΗΜΙΟΥΡΓΟΣ' && m.params.includes('Πλευρά')));

  console.log('testOfficialOSS2PseudocodeParsing passed');
}

function testAllRelationshipSyntaxes() {
  const code = `
ΚΛΑΣΗ Εταιρεία
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    επωνυμία;
ΤΕΛΟΣ
ΚΛΑΣΗ Τμήμα
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    τίτλος;
ΤΕΛΟΣ
ΚΛΑΣΗ Κτίριο
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    διεύθυνση;
ΤΕΛΟΣ
ΚΛΑΣΗ Γραφείο
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    αριθμός;
ΤΕΛΟΣ
ΚΛΑΣΗ Υπάλληλος
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    όνομα;
ΤΕΛΟΣ
ΚΛΑΣΗ Διευθυντής
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    βαθμίδα;
ΤΕΛΟΣ
ΚΛΑΣΗ Έργο
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    τίτλοςΈργου;
ΤΕΛΟΣ
ΚΛΑΣΗ Συμμετοχή
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    ρόλος;
ΤΕΛΟΣ
ΚΛΑΣΗ Εκτυπωτής
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    μοντέλο;
ΤΕΛΟΣ

ΣΧΕΣΕΙΣ
  // Forward aggregation, reversed composition, inheritance arrow, Greek keyword, AssocClass, self-association, dependency
  Τμήμα (1..*) --<> (1) Εταιρεία : υπάγεται
  ΣΥΝΘΕΣΗ Κτίριο (1) -- (1..*) Γραφείο
  Διευθυντής --|> Υπάλληλος
  Υπάλληλος (1..*) -- (0..*) Έργο : συμμετέχει :: Συμμετοχή
  Υπάλληλος (0..1) -- (0..*) Υπάλληλος : επιβλέπει
  Υπάλληλος ..> Εκτυπωτής : χρησιμοποιεί`;

  const res = Core.compileClassDiagram(code);
  assert.strictEqual(res.validation.errorCount, 0, `Unexpected errors: ${JSON.stringify(res.validation.diagnostics)}`);

  const agg = res.model.relations.find((r) => r.kind === 'aggregation');
  assert.ok(agg, 'Should parse reversed aggregation --<>');
  assert.strictEqual(agg.from, 'Εταιρεία', 'Whole should normalize to from=Εταιρεία');
  assert.strictEqual(agg.to, 'Τμήμα', 'Part should normalize to to=Τμήμα');
  assert.strictEqual(agg.fromMult, '1');
  assert.strictEqual(agg.toMult, '1..*');

  const comp = res.model.relations.find((r) => r.kind === 'composition');
  assert.ok(comp && comp.from === 'Κτίριο' && comp.to === 'Γραφείο', 'Greek keyword ΣΥΝΘΕΣΗ should parse');

  const inh = res.model.relations.find((r) => r.kind === 'inheritance');
  assert.ok(inh && inh.from === 'Διευθυντής' && inh.to === 'Υπάλληλος');

  const assocWithClass = res.model.relations.find((r) => r.assocClass === 'Συμμετοχή');
  assert.ok(assocWithClass && assocWithClass.label === 'συμμετέχει');

  const selfAssoc = res.model.relations.find((r) => r.from === 'Υπάλληλος' && r.to === 'Υπάλληλος');
  assert.ok(selfAssoc && selfAssoc.label === 'επιβλέπει');

  const dep = res.model.relations.find((r) => r.kind === 'dependency');
  assert.ok(dep && dep.from === 'Υπάλληλος' && dep.to === 'Εκτυπωτής');

  console.log('testAllRelationshipSyntaxes passed');
}

function testCleanExamplesAndTwoWayRoundTrip() {
  const cleanKeys = [
    'GE1_2025_2026_LOGISTICS',
    'GE1_2024_2025_FLIGHTS',
    'GE1_2023_2024_TELCO',
    'GE1_2022_2023_COURIER',
    'OSS2_GEOMETRIC_SHAPES',
    'OSS2_CINEMA',
    'OSS2_LIBRARY_CORRECT',
    'OOD1_ASSOCIATION_CLASS'
  ];

  for (const key of cleanKeys) {
    const code = PLI11_CLASS_EXAMPLES[key];
    assert.ok(code, `Missing example ${key}`);
    const first = Core.compileClassDiagram(code);
    assert.strictEqual(
      first.validation.errorCount,
      0,
      `Expected 0 errors in ${key}, got: ${JSON.stringify(first.validation.diagnostics)}`
    );

    const serialized = Core.serializeToDSL(first.model);
    const second = Core.compileClassDiagram(serialized);
    assert.strictEqual(second.validation.errorCount, 0, `Round-trip introduced errors for ${key}`);
    assert.deepStrictEqual(second.stats, first.stats, `Round-trip stats mismatch for ${key}`);
  }

  console.log('testCleanExamplesAndTwoWayRoundTrip passed');
}

function testValidatorRules() {
  // 1. Traps Demo checks C03, W01, W02, W03, W04, W05
  const traps = Core.compileClassDiagram(PLI11_CLASS_EXAMPLES.CLASS_TRAPS_DEMO);
  const trapCodes = new Set(traps.validation.diagnostics.map((d) => d.code));
  for (const expected of ['C03', 'W01', 'W02', 'W03', 'W04', 'W05']) {
    assert.ok(trapCodes.has(expected), `Expected trap code ${expected}, got: ${Array.from(trapCodes).join(',')}`);
  }

  // 2. C01, C02, C04, C05, W06, W07, I01
  const edgeCasesCode = `
ΚΛΑΣΗ ΓονέαςΑ
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    χ;
    χ;
  ΜΕΘΟΔΟΙ
    φ(α);
    φ(α);
ΤΕΛΟΣ

ΚΛΑΣΗ ΓονέαςΑ
ΤΕΛΟΣ

ΚΛΑΣΗ ΓονέαςΒ
ΤΕΛΟΣ

ΚΛΑΣΗ Παιδί ΕΠΕΚΤΕΙΝΕΙ ΓονέαςΑ, ΓονέαςΒ
ΤΕΛΟΣ

ΚΛΑΣΗ Κενή
ΤΕΛΟΣ

ΣΧΕΣΕΙΣ
  ΓονέαςΑ (5..2) -- (invalid) ΓονέαςΒ : χαλασμένη
  Κενή (1) --|> (1) ΓονέαςΑ
  ΑνοικτήΚλάση`;

  const edgeRes = Core.compileClassDiagram(edgeCasesCode);
  const edgeCodes = new Set(edgeRes.validation.diagnostics.map((d) => d.code));
  for (const expected of ['C01', 'C02', 'C04', 'C05', 'W06', 'W07', 'I01']) {
    assert.ok(edgeCodes.has(expected), `Expected validation code ${expected}, got: ${Array.from(edgeCodes).join(',')}`);
  }
  assert.strictEqual(edgeRes.validation.valid, false);
  assert.strictEqual(edgeRes.validation.checklist.length, 6);

  console.log('testValidatorRules passed');
}

function testOfficialPseudocodeAndMermaid() {
  const compiled = Core.compileClassDiagram(PLI11_CLASS_EXAMPLES.GE1_2024_2025_FLIGHTS);
  const pseudo = Core.generateOfficialEAPPseudocode(compiled.model, {
    defaultPrivateAttributes: true,
    includeConstructor: true,
    includeRelationComments: true
  });
  assert.ok(pseudo.includes('ΚΛΑΣΗ Πελάτης'));
  assert.ok(pseudo.includes('PRIVATE όνομα;'));
  assert.ok(/PUBLIC ΔΗΜΙΟΥΡΓΟΣ\s*\(/.test(pseudo));
  assert.ok(pseudo.includes('ΚΛΑΣΗ Ταξιδιωτικό Πρακτορείο ΕΠΕΚΤΕΙΝΕΙ Πελάτης'));
  assert.ok(pseudo.includes('ΤΕΛΟΣ'));

  const mmd = Core.generateMermaidClassDiagram(compiled.model, {
    hideVisibilities: false,
    hideMethods: true,
    hideTypes: false
  });
  assert.ok(mmd.startsWith('classDiagram\n'));
  assert.ok(mmd.includes('["Ταξιδιωτικό Πρακτορείο"]'));
  assert.ok(mmd.includes('o--'));
  assert.ok(mmd.includes('<|--'));

  // Hash '#' PROTECTED visibility must NOT be stripped as comment
  const protRes = Core.compileClassDiagram(`ΚΛΑΣΗ Τράπεζα\n  ΚΑΤΗΓΟΡΗΜΑΤΑ\n    # υπόλοιπο: Number;\nΤΕΛΟΣ`);
  assert.strictEqual(protRes.model.classes[0].attributes[0].visibility, '#', '# should parse as PROTECTED, not comment');

  console.log('testOfficialPseudocodeAndMermaid passed');
}

function testSVGRendererAndDragOverrides() {
  const compiled = Core.compileClassDiagram(PLI11_CLASS_EXAMPLES.GE1_2024_2025_FLIGHTS);
  const svgDefault = Renderer.renderClassDiagramSVG(compiled.model, { theme: 'light' });
  assert.ok(svgDefault.startsWith('<svg '), 'Should output SVG root');
  assert.ok(svgDefault.includes('class="cls-node"'), 'Should render draggable class nodes');
  assert.ok(svgDefault.includes('Ταξιδιωτικό Πρακτορείο'), 'Should contain Greek class name');
  assert.ok(svgDefault.includes('<polygon '), 'Should draw triangle/diamond polygons');

  // Hide methods & print mode
  const courier = Core.compileClassDiagram(PLI11_CLASS_EXAMPLES.GE1_2022_2023_COURIER);
  const svgHidden = Renderer.renderClassDiagramSVG(courier.model, {
    hideMethods: true,
    hideVisibilities: true,
    hideTypes: true,
    printMode: true
  });
  assert.ok(!svgHidden.includes('ΥπολογισμόςΣυνολικούΒάρους()'), 'hideMethods should omit method lines');
  assert.ok(svgHidden.includes('#ffffff'), 'printMode should render white background');

  // Association class dashed connector
  const ood = Core.compileClassDiagram(PLI11_CLASS_EXAMPLES.OOD1_ASSOCIATION_CLASS);
  const svgAssoc = Renderer.renderClassDiagramSVG(ood.model, { theme: 'dark' });
  assert.ok(svgAssoc.includes('stroke-dasharray="5,4"'), 'Association class should render dashed connector');

  // Custom dragged position override
  const firstId = compiled.model.classes[0].id;
  const svgDragged = Renderer.renderClassDiagramSVG(compiled.model, {
    positions: { [firstId]: { x: 424, y: 176 } }
  });
  assert.ok(svgDragged.includes('transform="translate(424, 176)"'), 'Drag position override should update transform');

  console.log('testSVGRendererAndDragOverrides passed');
}

function runAll() {
  testOfficialOSS2PseudocodeParsing();
  testAllRelationshipSyntaxes();
  testCleanExamplesAndTwoWayRoundTrip();
  testValidatorRules();
  testOfficialPseudocodeAndMermaid();
  testSVGRendererAndDragOverrides();
  console.log('All PLI11 Class Diagram tests passed successfully!');
}

runAll();
