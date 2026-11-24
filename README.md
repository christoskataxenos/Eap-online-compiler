# EAP Online Compiler

Εργαλεία στον browser για την Ψευδογλώσσα της ΠΛΗ10 και τα διαγράμματα/ψευδοκώδικα της ΠΛΗ11 του Ελληνικού Ανοικτού Πανεπιστημίου.

> **Γιατί το να γράψεις μια άσκηση ΠΛΗ10 ή ΠΛΗ11 δεν θα έπρεπε να απαιτεί να παλέψεις με το `plh10.exe` ή να ζωγραφίζεις διαγράμματα στο χέρι.**

[![Άδεια: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tests](https://img.shields.io/badge/tests-ΠΛΗ10%20%2B%20ΠΛΗ11-brightgreen.svg)](#έλεγχοι)

<p align="center">
  <a href="https://eap-online-compiler.vercel.app/"><strong>Δοκίμασέ το live</strong></a>
</p>

---

## Τι είναι;

Το EAP Online Compiler συγκεντρώνει σε ένα μέρος τον interpreter και debugger της ΠΛΗ10 μαζί με μεταγλωττιστές και σχεδιαστές διαγραμμάτων για την ΠΛΗ11. Τρέχει εξ ολοκλήρου στον browser, χωρίς εγκατάσταση, backend ή εξάρτηση από λειτουργικό σύστημα.

Με απλά λόγια για την ΠΛΗ10: ανοίγεις τη σελίδα, γράφεις κώδικα, πατάς εκτέλεση και βλέπεις τι πραγματικά κάνει αυτό το έκτρωμα ψευδοκώδικα. Για την ΠΛΗ11, γράφεις τον ψευδοκώδικα που έμαθες στο Κεφ. 4 ή  δημιουργείς διαγράμματα κλάσεων και παίρνεις έτοιμα ΔΔΠ, ΔΡΔ και Κλάσεις για τις γραπτές εργασίες.

## Γιατί δημιουργήθηκε;

Το επίσημο εργαλείο της ΠΛΗ10 είναι ένα legacy Windows executable. Αυτό σημαίνει:

- περιορισμός σε Windows,
- εγκατάσταση και ρυθμίσεις PATH,
- προβλήματα σε σύγχρονα περιβάλλοντα ανάπτυξης,
- φτωχό error reporting,
- απουσία visual debugging,
- και πιθανότητα να χαλάσει το περιβάλλον GCC/MinGW ενώ προσπαθείς απλώς να κάνεις την εργασία σου.

Αντίστοιχα, στην ΠΛΗ11 η σχεδίαση ΔΔΠ, ΔΡΔ και Διαγραμμάτων Κλάσεων σε Word ή Visio παίρνει δυσανάλογα πολύ χρόνο και τα λάθη στους κανόνες (όπως επαναδήλωση παραμέτρων `IN/OUT` ή λάθος ροές) φαίνονται μόνο αφού χάσεις μονάδες. Η λύση είναι εργαλεία στον browser που ανοίγουν ακόμη και απευθείας από το filesystem.

## Τι περιλαμβάνει

Μέσα από την αρχική σελίδα ([index.html](index.html)) και το μενού επιλογής μαθήματος έχεις πρόσβαση σε τρεις χώρους εργασίας.

### ΠΛΗ10 - Ψευδογλώσσα Interpreter (`editor.html`)

- Editor CodeMirror με syntax highlighting, αντιστοίχιση παρενθέσεων, αυτόματο κλείσιμο και autocomplete για την ελληνική Ψευδογλώσσα.
- Βήμα-βήμα εκτέλεση εντολή-προς-εντολή με επισήμανση της ενεργής γραμμής και ρύθμιση ταχύτητας.
- Visual Memory Inspector με ζωντανή προβολή τιμών, 1D RAM tapes, 2D πίνακες, badges (`ΑΛΗΘΗΣ` / `ΨΕΥΔΗΣ`), πρόσφατες αλλαγές και προβολή καρτών ή πίνακα.
- Αυτόματος Πίνακας τιμών (trace table) με αντιγραφή σε Markdown.
- Άνοιγμα και αποθήκευση αρχείων `.eap` (Windows-1253 και UTF-8), παραδείγματα ύλης και shareable URLs με LZ-String.

### ΠΛΗ11 - Ψευδοκώδικας σε ΔΔΠ και ΔΡΔ (`pli11.html`)

- Μεταγλώττιση ψευδοκώδικα Κεφ. 4 (Σχήμα 4.28) σε ΔΔΠ SVG με ζεύγη δεδομένων (`○→`), σημαίες ελέγχου (`●→`), ρόμβους επιλογής (`◇`), βρόχους (`↻`) και ανίχνευση ΚΜ / ΚΔ.
- Αντίστροφη σύνθεση ΔΡΔ από τον ψευδοκώδικα (μετασχηματισμοί, αποθήκες δεδομένων με παράλληλες γραμμές, εξωτερικές οντότητες και ροές).
- Έλεγχος κανόνων ΕΑΠ (`E01`-`E11`) με αριθμό γραμμής για παγίδες ΟΕ1/ΓΕ1 όπως επαναδήλωση παραμέτρων `IN`/`IN/OUT`, ελλιπή `ΑΡΧΙΚΟΠΟΙΗΣΕ`, σειρά κλήσεων, κατεύθυνση `Get_*`/`Put_*` και κύκλους top-down.
- Αντίστροφος ΔΡΔ Builder (φόρμες και DSL) που παράγει αυτόματα ΔΔΠ και έτοιμο ψευδοκώδικα, call-trace βήμα-βήμα, Mermaid (`flowchart TD`/`LR`) και εξαγωγή ασπρόμαυρων SVG / PNG για MS Word.
- Υποστήριξη in-code Directives (`/* @KM: M3 */`, `/* @MERGE_SOURCES: ... */`, `/* @ALIAS: ... */`) και αμφίδρομος συγχρονισμός με τον ΔΡΔ Builder για παραμετροποίηση χωρίς απώλεια κώδικα.
- 📘 Αναλυτικός οδηγός χρήσης: [PLI11_GUIDE.md](PLI11_GUIDE.md).

### ΠΛΗ11 - Διαγράμματα κλάσεων (`pli11-classes.html`)

- Υβριδικός σχεδιαστής με αμφίδρομο συγχρονισμό ανάμεσα σε DSL κειμένου (CodeMirror) και οπτικό builder με κάρτες κλάσεων και πίνακα σχέσεων.
- Υποστήριξη κληρονομικότητας (`◁`), συναρμογής (`◇`), σύνθεσης (`◆`), συσχετίσεων με πληθικότητες (`1`, `0..1`, `1..*`, `0..*`, `*`, `7..15`), εξαρτήσεων (`..>`) και κλάσεων συσχέτισης, με ελεύθερη μετακίνηση κλάσεων (drag & drop) στον SVG καμβά.
- Διακόπτες απόκρυψης ορατοτήτων, μεθόδων και τύπων (όπως ζητείται σε ΓΕ1), ασπρόμαυρη λειτουργία για Word και εξαγωγή SVG / 2x PNG.
- Αυτόματη παραγωγή ΕΑΠ OO-ψευδοκώδικα (ΟΣΣ2 Διαφ. 8), Mermaid `classDiagram`, έλεγχος λαθών (κύκλοι, διπλά κληρονομημένα πεδία, πληθικότητες) και έτοιμα παραδείγματα ΟΣΣ2 και ΓΕ1 (2022-2026).

## Παραδείγματα σύνταξης (ΠΛΗ11)

Ψευδοκώδικας Κεφ. 4 που παράγει ΔΔΠ και ΔΡΔ στο `pli11.html`:

```text
PROCEDURE EXEC_M3_M4
  LOCAL VAR Δ, Κ, Ι, Ρ, Ε, Φ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ, Κ, Ι, Ρ, Ε, Φ;
  CALL GET_Δ(Δ);
  CALL EXEC_M1(Κ);
  CALL CALC_M3(Κ, Δ, Ι, Ρ);
  CALL CALC_M4(Ι, Ε, Φ);
END_PROCEDURE;
```

Ορισμός κλάσεων και σχέσεων που συγχρονίζεται αμφίδρομα με τον οπτικό builder στο `pli11-classes.html`:

```text
ΚΛΑΣΗ Φορτηγό ΕΠΕΚΤΕΙΝΕΙ Όχημα
  ΚΑΤΗΓΟΡΗΜΑΤΑ
    ΑριθμόςΑξόνων: Number;
ΤΕΛΟΣ

ΣΧΕΣΕΙΣ
  Όχημα (1) -- (1..*) Αποστολή : Διεκπεραιώνει
  Αποστολή (1) <>-- (1..*) Πακέτο
```

## Συντομεύσεις

| Συντόμευση | Δράση |
| :--- | :--- |
| `Ctrl+Space` | Αυτόματη συμπλήρωση (Autocomplete) σε όλους τους editors |
| `F5` | Εκτέλεση (ΠΛΗ10), Μεταγλώττιση (ΔΔΠ/ΔΡΔ) ή Σχεδίαση (Κλάσεις) |
| `F10` | Βήμα-βήμα εκτέλεση / ιχνηλάτηση (ΠΛΗ10 και ΠΛΗ11 ΔΔΠ/ΔΡΔ) |
| `Ctrl+Shift+F` | Μορφοποίηση κώδικα σε όλους τους editors |

## Live demo

**[Άνοιξε τον EAP Online Compiler](https://eap-online-compiler.vercel.app/)**

## Εγκατάσταση και χρήση

Δεν χρειάζεται εγκατάσταση dependencies ή build step για να χρησιμοποιήσεις την εφαρμογή.

```bash
git clone https://github.com/christoskataxenos/Eap-online-compiler.git
cd Eap-online-compiler
```

Άνοιξε το `index.html`, το `editor.html`, το `pli11.html` ή το `pli11-classes.html` σε οποιονδήποτε σύγχρονο browser.

## Έλεγχοι

Χρειάζεσαι Node.js για να τρέξεις όλο το test suite:

```bash
npm test
```

Οι έλεγχοι καλύπτουν τον ΠΛΗ10 interpreter και 66 `.eap` αρχεία από την ύλη, τον ΠΛΗ11 ΔΔΠ/ΔΡΔ compiler/validator/reverse builder και τον ΠΛΗ11 parser, validator, serializer και SVG renderer για διαγράμματα κλάσεων.

## Δομή του project

```text
.
├── index.html                  # Landing page με επιλογή ΠΛΗ10 / ΠΛΗ11
├── landing.css                 # Styles του landing page (index.html)
├── common.js                   # Shared UI utilities: theme/FOUC, toast, modals (confirm/prompt),
│                               #   share permalinks (LZ-String), save/load (UTF-8 + Windows-1253),
│                               #   tabs, example selector, autosave drafts, clipboard — window.EAPCommon
├── diagram-viewport.js         # Shared pan/zoom engine για τα SVG διαγράμματα + drag helper
│                               #   για resizers — window.EAPViewport
├── editor.html                 # ΠΛΗ10 Editor και Debugger
├── app.v6.js                   # ΠΛΗ10 UI controller
├── core.v6.js                  # ΠΛΗ10 Interpreter core
├── eap-mode.js                 # ΠΛΗ10 CodeMirror grammar mode
├── examples.js                 # ΠΛΗ10 Παραδείγματα ύλης
├── pli11.html                  # ΠΛΗ11 Ψευδοκώδικας -> ΔΔΠ/ΔΡΔ Workspace
├── pli11.css                   # ΠΛΗ11 Scoped styles & subnav
├── pli11-app.js                # ΠΛΗ11 ΔΔΠ/ΔΡΔ UI controller & ΔΡΔ Builder
├── pli11-core.js               # ΠΛΗ11 ΔΔΠ/ΔΡΔ Parser, Validator & Reverse Builder
├── pli11-renderer.js           # ΠΛΗ11 SVG renderers (ΔΔΠ & ΔΡΔ) + PNG/SVG export
├── pli11-mode.js               # ΠΛΗ11 CodeMirror grammar mode & autocomplete
├── pli11-examples.js           # ΠΛΗ11 Παραδείγματα ΟΣΣ2, ΓΕ1 & ΟΕ1
├── pli11-classes.html          # ΠΛΗ11 Διαγράμματα Κλάσεων Studio
├── pli11-classes-app.js        # ΠΛΗ11 Κλάσεις UI controller, Builder & Drag-Drop
├── pli11-classes-core.js       # ΠΛΗ11 Κλάσεις Parser, Validator, OO-Ψευδοκώδικας & Mermaid
├── pli11-classes-renderer.js   # ΠΛΗ11 Κλάσεις SVG engine + auto-layout + PNG/SVG export
├── pli11-classes-mode.js       # ΠΛΗ11 Κλάσεις CodeMirror grammar mode & autocomplete
├── pli11-classes-examples.js   # ΠΛΗ11 Κλάσεις Παραδείγματα ΓΕ1 2022-2026 & ΟΣΣ2
├── style.css                   # Κοινά θέματα (Light / Dark), layout, shared components & a11y
└── tests/                      # Tests ΠΛΗ10 (.eap + unit) & ΠΛΗ11
```

## Τεχνολογίες

- JavaScript: Vanilla JS / ES6+ (χωρίς build step)
- Editor: CodeMirror 5
- Diagrams: Custom SVG Engine (ΕΑΠ ΔΔΠ, ΔΡΔ, Κλάσεις) + Mermaid.js preview
- Frontend: HTML5 και CSS3
- Tests: Node.js test runner
- Libraries: LZ-String και CodeMirror vendor builds

## Συνεισφορά και βελτιώσεις από labrouss

Στο κύριο αποθετήριο ενσωματώθηκαν οι παρακάτω βελτιώσεις από το fork του [labrouss](https://github.com/labrouss/Eap-online-compiler):

- Υποστήριξη κωδικοποίησης Windows-1253 για παλαιότερα `.eap` αρχεία χωρίς αλλοίωση ελληνικών χαρακτήρων.
- Αυτόματη συμπλήρωση autocomplete για τη δομή `ΕΠΑΝΑΛΑΒΕ ... ΜΕΧΡΙΣ_ΟΤΟΥ`.
- Μετατροπή της βοήθειας σύνταξης από browser alert σε modal παράθυρο διαλόγου.
- Επίλυση διπλής εκτύπωσης στο τερματικό κατά την ανάγνωση εισόδου (`ΔΙΑΒΑΣΕ`).
- Αυτόματη εμφάνιση του ονόματος προγράμματος στην κορυφή του editor.
- Διατήρηση επιλογής Light / Dark Mode στο `localStorage`.
- Ενσωμάτωση άδειας χρήσης MIT.

## Συνεισφορά

Αν είσαι φοιτητής του ΕΑΠ και θέλεις να βελτιώσεις το εργαλείο:

1. Κάνε fork το repository.
2. Δημιούργησε ένα feature branch.
3. Τρέξε `npm test`.
4. Άνοιξε Pull Request με σύντομη περιγραφή της αλλαγής.

## English summary

EAP Online Compiler is a browser-based workspace for the Hellenic Open University's PLH10 and PLH11 courses. It gives students a cross-platform alternative to `plh10.exe` (step execution, memory inspector, trace tables, `.eap` support) alongside PLH11 tools that turn Chapter 4 pseudocode into DDP/DFD diagrams, check EAP rules, and build UML/EAP Class Diagrams with OO-pseudocode export.

## Άδεια χρήσης

Το project διατίθεται με την [MIT License](LICENSE).

---

Developed by **[Christos Kataxenos](https://www.linkedin.com/in/christoskataxenos/)**.
