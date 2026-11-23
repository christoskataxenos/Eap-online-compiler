// -----------------------------------------------------------------------------
// EAP ΠΛΗ11 Examples (ΟΣΣ2, ΓΕ1 2020-2026, ΟΕ1 Traps, DFD Presets)
// UMD export for both browser and Node.js tests.
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PLI11Examples = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PLI11_EXAMPLES = {
    OSS2_SIMPLE_KM: `/* ΟΣΣ2 - Απλός Κεντρικός Μετασχηματισμός (ExecM5) */
/* Από τις διαφάνειες PLH11_OSS2_DDP_PseudoCode */

PROCEDURE ExecM5
  LOCAL VAR Δ, Ε, Ζ, Θ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ, Ε, Ζ, Θ;
  CALL GetΔ(Δ);
  CALL GetΕ(Ε);
  CALL CalcM5(Δ, Ε, Ζ, Θ);
  CALL PutΘ(Θ);
  CALL PutΖ(Ζ);
END_PROCEDURE;

PROCEDURE GetΔ(Δ: IN/OUT)
  Διάβασε το Δ από την εξωτερική οντότητα «Πηγή 1»;
END_PROCEDURE;

PROCEDURE GetΕ(Ε: IN/OUT)
  Διάβασε το Ε από την Αποθήκη 1;
END_PROCEDURE;

PROCEDURE CalcM5(Δ, Ε: IN, Ζ, Θ: IN/OUT)
  Υπολόγισε τα Ζ, Θ βάσει των Δ, Ε;
END_PROCEDURE;

PROCEDURE PutΘ(Θ: IN)
  ΕΜΦΑΝΙΣΕ το Θ στον Αποδέκτη 1;
END_PROCEDURE;

PROCEDURE PutΖ(Ζ: IN)
  Αποθήκευσε το Ζ στην Αποθήκη 2;
END_PROCEDURE;`,

    OSS2_TRANSACTION_CENTER: `/* ΟΣΣ2 - Κέντρο Δοσοληψιών (ExecM1 με CASE) */
/* Από τις διαφάνειες PLH11_OSS2_DDP_PseudoCode */

PROCEDURE ExecM1
  LOCAL VAR Α, Β, Γ, Γ1, Γ2, Γ3;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Α, Β, Γ, Γ1, Γ2, Γ3;
  CALL GetΑ(Α);
  CALL GetΒ(Β);
  CALL CalcM1(Α, Β, Γ);
  CASE Γ OF
    (Γ1): CALL ExecM2(Γ1);
    (Γ2): CALL ExecM3(Γ2);
    (Γ3): CALL ExecM4(Γ3);
  END_CASE;
END_PROCEDURE;

PROCEDURE GetΑ(Α: IN/OUT)
  Διάβασε το Α από την Πηγή 1;
END_PROCEDURE;

PROCEDURE GetΒ(Β: IN/OUT)
  Διάβασε το Β από την Αποθήκη 1;
END_PROCEDURE;

PROCEDURE CalcM1(Α, Β: IN, Γ: IN/OUT)
  Υπολόγισε την επιλογή Γ;
END_PROCEDURE;

PROCEDURE ExecM2(Γ1: IN)
  LOCAL VAR Απ1;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Απ1;
  CALL CalcM2(Γ1, Απ1);
  CALL PutΑπ1(Απ1);
END_PROCEDURE;

PROCEDURE ExecM3(Γ2: IN)
  LOCAL VAR Απ2;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Απ2;
  CALL CalcM3(Γ2, Απ2);
  CALL PutΑπ2(Απ2);
END_PROCEDURE;

PROCEDURE ExecM4(Γ3: IN)
  LOCAL VAR Απ3;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Απ3;
  CALL CalcM4(Γ3, Απ3);
  CALL PutΑπ3(Απ3);
END_PROCEDURE;

PROCEDURE CalcM2(Γ1: IN, Απ1: IN/OUT)
  Υπολόγισε Απ1 βάσει Γ1;
END_PROCEDURE;

PROCEDURE PutΑπ1(Απ1: IN)
  ΕΜΦΑΝΙΣΕ το Απ1 στον Αποδέκτη 1;
END_PROCEDURE;

PROCEDURE CalcM3(Γ2: IN, Απ2: IN/OUT)
  Υπολόγισε Απ2 βάσει Γ2;
END_PROCEDURE;

PROCEDURE PutΑπ2(Απ2: IN)
  ΕΜΦΑΝΙΣΕ το Απ2 στον Αποδέκτη 2;
END_PROCEDURE;

PROCEDURE CalcM4(Γ3: IN, Απ3: IN/OUT)
  Υπολόγισε Απ3 βάσει Γ3;
END_PROCEDURE;

PROCEDURE PutΑπ3(Απ3: IN)
  Αποθήκευσε το Απ3 στην Αποθήκη 2;
END_PROCEDURE;`,

    EXAM_WHILE_IF: `/* Παράδειγμα Εξετάσεων - WHILE & IF (Μετατροπή Ψευδοκώδικα σε ΔΔΠ & ΔΡΔ) */

PROCEDURE Exec_M1
  LOCAL VAR A, B, C;
  ΑΡΧΙΚΟΠΟΙΗΣΕ A, B, C;
  WHILE (A <> κενό) DO
    CALL Exec_M2(A);
    IF (A <> κενό) THEN
      CALL Get_B(B);
      CALL Calculate_M1(A, B, C);
      CALL Put_C(C);
    END_IF;
  END_WHILE;
END_PROCEDURE;

PROCEDURE Get_B(B: IN/OUT)
  /* Διάβασε από την αποθήκη AD1 το B */
END_PROCEDURE;

PROCEDURE Calculate_M1(A: IN, B: IN, C: IN/OUT)
  /* Επεξεργάσου τα A και B και υπολόγισε με βάση αυτά το C */
END_PROCEDURE;

PROCEDURE Put_C(C: IN)
  /* Εμφάνισε στο χρήστη το C */
END_PROCEDURE;

PROCEDURE Exec_M2(A: IN/OUT)
  LOCAL VAR D;
  ΑΡΧΙΚΟΠΟΙΗΣΕ D;
  CALL Get_D(D);
  CALL Calculate_M2(D, A);
END_PROCEDURE;

PROCEDURE Calculate_M2(D: IN, A: IN/OUT)
  /* Επεξεργάσου το D και υπολόγισε με βάση αυτό το A */
END_PROCEDURE;

PROCEDURE Get_D(D: IN/OUT)
  /* Διάβασε από την αποθήκη AD2 το D */
END_PROCEDURE;`,

    GE1_2025_2026_PARTIAL: `/* ΓΕ1 2025-26 (Επίσημη Ενδεικτική Λύση Θέματος 4Β - Ζητούμενες Μονάδες) */
/* Οι υπόλοιπες υπομονάδες (Exec_M1, Exec_M2, Calc_M3/M4/M5, Put_Π/Μ) συντίθενται αυτόματα ως stubs */

PROCEDURE EXEC_M3_M4_M5
  LOCAL VAR Γ, Κ, Τ, Δ, Ζ, Λ, Ε, Π, Μ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Γ, Κ, Τ, Δ, Ζ, Λ, Ε, Π, Μ;
  CALL EXEC_M1(Γ, Κ);
  CALL EXEC_M2(Τ);
  CALL GET_Δ(Δ);
  CALL CALC_M4(Γ, Ζ);
  CALL CALC_M3(Δ, Κ, Ζ, Τ, Λ, Ε);
  CALL CALC_M5(Λ, Π, Μ);
  CALL PUT_Π(Π);
  CALL PUT_Μ(Μ);
  CALL EXEC_M6(Ε);
END_PROCEDURE;

PROCEDURE EXEC_M6(Ε: IN)
  LOCAL VAR Ο;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Ο;
  CALL CALC_M6(Ε, Ο);
  CALL PUT_Ο(Ο);
END_PROCEDURE;

PROCEDURE CALC_M1(Α: IN, Γ, Κ: IN/OUT)
  Υπολόγισε τα Γ, Κ βάσει της τιμής του Α;
END_PROCEDURE;

PROCEDURE GET_Δ(Δ: IN/OUT)
  Διάβασε το δεδομένο Δ από την Αποθήκη 3;
END_PROCEDURE;`,

    GE1_2025_2026_FULL: `/* ΓΕ1 2025-26 - Πλήρης Ψευδοκώδικας (Σύνθετος ΚΜ: M3, M4, M5) */

PROCEDURE EXEC_M3_M4_M5
  LOCAL VAR Γ, Κ, Τ, Δ, Ζ, Λ, Ε, Π, Μ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Γ, Κ, Τ, Δ, Ζ, Λ, Ε, Π, Μ;
  CALL EXEC_M1(Γ, Κ);
  CALL EXEC_M2(Τ);
  CALL GET_Δ(Δ);
  CALL CALC_M4(Γ, Ζ);
  CALL CALC_M3(Δ, Κ, Ζ, Τ, Λ, Ε);
  CALL CALC_M5(Λ, Π, Μ);
  CALL PUT_Π(Π);
  CALL PUT_Μ(Μ);
  CALL EXEC_M6(Ε);
END_PROCEDURE;

PROCEDURE EXEC_M1(Γ, Κ: IN/OUT)
  LOCAL VAR Α;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Α;
  CALL GET_Α(Α);
  CALL CALC_M1(Α, Γ, Κ);
END_PROCEDURE;

PROCEDURE EXEC_M2(Τ: IN/OUT)
  LOCAL VAR Β;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Β;
  CALL GET_Β(Β);
  CALL CALC_M2(Β, Τ);
END_PROCEDURE;

PROCEDURE EXEC_M6(Ε: IN)
  LOCAL VAR Ο;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Ο;
  CALL CALC_M6(Ε, Ο);
  CALL PUT_Ο(Ο);
END_PROCEDURE;

PROCEDURE GET_Α(Α: IN/OUT)
  Διάβασε το δεδομένο Α από την Πηγή 1;
END_PROCEDURE;

PROCEDURE GET_Β(Β: IN/OUT)
  Διάβασε το δεδομένο Β από την Αποθήκη 1;
END_PROCEDURE;

PROCEDURE GET_Δ(Δ: IN/OUT)
  Διάβασε το δεδομένο Δ από την Αποθήκη 3;
END_PROCEDURE;

PROCEDURE CALC_M1(Α: IN, Γ, Κ: IN/OUT)
  Υπολόγισε τα Γ, Κ βάσει της τιμής του Α;
END_PROCEDURE;

PROCEDURE CALC_M2(Β: IN, Τ: IN/OUT)
  Υπολόγισε το Τ βάσει της τιμής του Β;
END_PROCEDURE;

PROCEDURE CALC_M4(Γ: IN, Ζ: IN/OUT)
  Υπολόγισε το Ζ βάσει του Γ;
END_PROCEDURE;

PROCEDURE CALC_M3(Δ, Κ, Ζ, Τ: IN, Λ, Ε: IN/OUT)
  Υπολόγισε τα Λ, Ε βάσει των Δ, Κ, Ζ, Τ;
END_PROCEDURE;

PROCEDURE CALC_M5(Λ: IN, Π, Μ: IN/OUT)
  Υπολόγισε τα Π, Μ βάσει του Λ;
END_PROCEDURE;

PROCEDURE CALC_M6(Ε: IN, Ο: IN/OUT)
  Υπολόγισε το Ο βάσει του Ε;
END_PROCEDURE;

PROCEDURE PUT_Π(Π: IN)
  ΕΜΦΑΝΙΣΕ το Π στον Αποδέκτη 1;
END_PROCEDURE;

PROCEDURE PUT_Μ(Μ: IN)
  Αποθήκευσε το Μ στην Αποθήκη 2;
END_PROCEDURE;

PROCEDURE PUT_Ο(Ο: IN)
  ΕΜΦΑΝΙΣΕ το Ο στον Αποδέκτη 2;
END_PROCEDURE;`,

    GE1_2024_2025: `/* ΓΕ1 2024-25 (Επίσημη Λύση Θέματος 4Β - Κέντρο Δοσοληψιών Μ3) */

PROCEDURE EXEC_M3
  LOCAL VAR Γ, Θ, flag, Ε1, Ε2, Ε3;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Γ, Θ, flag, Ε1, Ε2, Ε3;
  CALL EXEC_M1(Γ);
  CALL EXEC_M2(Θ);
  CALL CALC_M3(Γ, Θ, flag);
  CASE flag OF
    (Ε1): CALL EXEC_M4(Ε1);
    (Ε2): CALL EXEC_M6(Ε2);
    (Ε3): CALL EXEC_M5(Ε3);
  END_CASE;
END_PROCEDURE;

PROCEDURE EXEC_M5(Ε3: IN)
  LOCAL VAR Χ, Ζ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Χ, Ζ;
  CALL GET_Χ(Χ);
  CALL CALC_M5(Χ, Ε3, Ζ);
  CALL PUT_Ζ(Ζ);
END_PROCEDURE;`,

    GE1_2023_2024: `/* ΓΕ1 2023-24 (Επίσημη Λύση Θέματος 4Β - Σύνθετος ΚΜ M3, M4) */

PROCEDURE EXEC_M3_M4
  LOCAL VAR Δ, Κ, Ι, Ρ, Ε, Φ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ, Κ, Ι, Ρ, Ε, Φ;
  CALL GET_Δ(Δ);
  CALL EXEC_M1(Κ);
  CALL CALC_M3(Κ, Δ, Ι, Ρ);
  CALL CALC_M4(Ι, Ε, Φ);
  CALL EXEC_M2(Ρ);
  CALL EXEC_M5(Ε);
  CALL EXEC_M6(Φ);
END_PROCEDURE;

PROCEDURE EXEC_M5(Ε: IN)
  LOCAL VAR Τ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Τ;
  CALL CALC_M5(Ε, Τ);
  CALL PUT_Τ(Τ);
END_PROCEDURE;

PROCEDURE CALC_M2(Β, Ρ, Ζ: IN, Ξ: IN/OUT)
  ΥΠΟΛΟΓΙΣΕ ΤΟ ΔΕΔΟΜΕΝΟ Ξ ΒΑΣΕΙ ΤΩΝ ΔΕΔΟΜΕΝΩΝ Β, Ρ ΚΑΙ Ζ;
END_PROCEDURE;`,

    GE1_2022_2023: `/* ΓΕ1 2022-23 (Επίσημη Λύση Θέματος 4Β - Κέντρο Δοσοληψιών Μ3) */

PROCEDURE Exec_M3
  LOCAL VAR Δ, Κ, Κ1, Κ2, Κ3;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Δ, Κ, Κ1, Κ2, Κ3;
  CALL Exec_M2(Δ);
  CALL Calc_M3(Δ, Κ);
  CASE Κ OF
    (Κ1): CALL Exec_M4(Κ1);
    (Κ2): CALL Exec_M6(Κ2);
    (Κ3): CALL Exec_M5(Κ3);
  END_CASE;
END_PROCEDURE;

PROCEDURE Exec_M1(Γ: IN/OUT)
  LOCAL VAR Α;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Α;
  CALL GET_Α(Α);
  CALL CALC_M1(Α, Γ);
END_PROCEDURE;

PROCEDURE Put_Λ(Λ: IN)
  ΕΜΦΑΝΙΣΕ το δεδομένο Λ στην εξωτερική οντότητα «Αποδέκτης 2»;
END_PROCEDURE;

PROCEDURE Put_Ζ(Ζ: IN)
  ΕΜΦΑΝΙΣΕ το δεδομένο Ζ στην εξωτερική οντότητα «Αποδέκτης 2»;
END_PROCEDURE;`,

    OE1_TRAPS_DEMO: `/* Παγίδες ΟΕ1 (Πατήστε "Έλεγχος ΕΑΠ" για να δείτε τα σφάλματα!) */

PROCEDURE Exec_M3(Ρ: IN)
  LOCAL VAR Λ, Ν, Τ;
  /* Σφάλμα 1: Ρίζα με παράμετρο + Λείπει η αρχικοποίηση του Τ */
  ΑΡΧΙΚΟΠΟΙΗΣΕ Λ, Ν;
  CALL Calc_M3(Ρ, Λ, Ν, Τ);
  /* Σφάλμα 2: Η Get_Λ κλήθηκε ΜΕΤΑ τη Calc_M3 (λάθος σειρά ροής) */
  CALL Get_Λ(Λ);
  CALL Put_Τ(Τ);
  CALL Exec_M5(Ν);
END_PROCEDURE;

PROCEDURE Calc_M3(Ρ, Λ: IN, Ν, Τ: IN/OUT)
  Υπολόγισε τα Ν, Τ βάσει των Ρ, Λ;
END_PROCEDURE;

PROCEDURE Get_Λ(Λ: IN)
  /* Σφάλμα 3: Επαναδήλωση & αρχικοποίηση παραμέτρου + λάθος κατεύθυνση IN */
  LOCAL VAR Λ;
  ΑΡΧΙΚΟΠΟΙΗΣΕ Λ;
  Διάβασε το Λ από την Πηγή 1;
END_PROCEDURE;

PROCEDURE Exec_M5(Ν: IN)
  /* Σφάλμα 4: Υπομονάδα καλεί τη μητρική ρίζα Exec_M3 (κύκλος ιεραρχίας) */
  CALL Exec_M3(Ν);
END_PROCEDURE;`
  };

  const PLI11_EXAMPLE_CATEGORIES = [
    {
      category: '1. Βασικά Παραδείγματα (ΟΣΣ2 & Εξετάσεις)',
      items: [
        { id: 'OSS2_SIMPLE_KM', title: 'ΟΣΣ2: Απλός Κεντρικός Μετασχηματισμός (ExecM5)' },
        { id: 'OSS2_TRANSACTION_CENTER', title: 'ΟΣΣ2: Κέντρο Δοσοληψιών (CASE Γ OF)' },
        { id: 'EXAM_WHILE_IF', title: 'Εξετάσεις: Βρόχος WHILE & IF (Exec_M1 / Exec_M2)' }
      ]
    },
    {
      category: '2. Γραπτές Εργασίες ΓΕ1 (Επίσημες Λύσεις)',
      items: [
        { id: 'GE1_2025_2026_FULL', title: 'ΓΕ1 2025-26: Πλήρες ΔΔΠ/ΔΡΔ (Σύνθετος ΚΜ M3-M4-M5)' },
        { id: 'GE1_2025_2026_PARTIAL', title: 'ΓΕ1 2025-26: Ενδεικτική Λύση (Μερικές Μονάδες)' },
        { id: 'GE1_2024_2025', title: 'ΓΕ1 2024-25: Κέντρο Δοσοληψιών (CASE flag OF)' },
        { id: 'GE1_2023_2024', title: 'ΓΕ1 2023-24: Σύνθετος ΚΜ (EXEC_M3_M4)' },
        { id: 'GE1_2022_2023', title: 'ΓΕ1 2022-23: Κέντρο Δοσοληψιών (CASE Κ OF)' }
      ]
    },
    {
      category: '3. Έλεγχος Κανόνων & Παγίδες ΟΕ1',
      items: [
        { id: 'OE1_TRAPS_DEMO', title: 'Παγίδες ΟΕ1 (Demo Εντοπισμού Λαθών)' }
      ]
    }
  ];

  const PLI11_DFD_PRESETS = {
    GE1_2025_26: {
      name: 'ΓΕ1 2025-26 (Σύνθετος ΚΜ: M3, M4, M5)',
      dsl: `ΚΜ: M3, M4, M5
ΠΗΓΗ Πηγή1 -> M1 : Α
ΑΠΟΘΗΚΗ Αποθήκη1 -> M2 : Β
ΑΠΟΘΗΚΗ Αποθήκη3 -> M3 : Δ
M1 -> M4 : Γ
M1 -> M3 : Κ
M2 -> M3 : Τ
M4 -> M3 : Ζ
M3 -> M5 : Λ
M3 -> M6 : Ε
M5 -> ΑΠΟΔΕΚΤΗΣ Αποδέκτης1 : Π
M5 -> ΑΠΟΘΗΚΗ Αποθήκη2 : Μ
M6 -> ΑΠΟΔΕΚΤΗΣ Αποδέκτης2 : Ο`
    },
    SIMPLE_M5: {
      name: 'ΟΣΣ2 Απλός ΚΜ (M5)',
      dsl: `ΚΜ: M5
ΠΗΓΗ Πηγή1 -> M5 : Δ
ΑΠΟΘΗΚΗ Αποθήκη1 -> M5 : Ε
M5 -> ΑΠΟΔΕΚΤΗΣ Αποδέκτης1 : Θ
M5 -> ΑΠΟΘΗΚΗ Αποθήκη2 : Ζ`
    },
    GE1_2024_25_KD: {
      name: 'ΓΕ1 2024-25 (Κέντρο Δοσοληψιών: M3)',
      dsl: `ΚΔ: M3
ΠΗΓΗ Πηγή1 -> M1 : Α
ΠΗΓΗ Πηγή2 -> M2 : Β
M1 -> M3 : Γ
M2 -> M3 : Θ
M3 -> M4 : Ε1
M3 -> M6 : Ε2
M3 -> M5 : Ε3
ΑΠΟΘΗΚΗ Αποθήκη1 -> M5 : Χ
M5 -> ΑΠΟΔΕΚΤΗΣ Αποδέκτης1 : Ζ`
    },
    GE1_2023_24: {
      name: 'ΓΕ1 2023-24 (Σύνθετος ΚΜ: M3, M4)',
      dsl: `ΚΜ: M3, M4
ΠΗΓΗ Πηγή1 -> M1 : Α
ΑΠΟΘΗΚΗ Αποθήκη1 -> M3 : Δ
M1 -> M3 : Κ
M3 -> M4 : Ι
M3 -> M2 : Ρ
M4 -> M5 : Ε
M4 -> M6 : Φ
M5 -> ΑΠΟΔΕΚΤΗΣ Αποδέκτης1 : Τ`
    }
  };

  return {
    PLI11_EXAMPLES,
    PLI11_EXAMPLE_CATEGORIES,
    PLI11_DFD_PRESETS
  };
}));
