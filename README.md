# EAP Online Compiler

Browser-based interpreter και debugger για την Ψευδογλώσσα του Ελληνικού Ανοικτού Πανεπιστημίου.

> **Γιατί το να γράψεις μια άσκηση ΠΛΗ10 δεν θα έπρεπε να απαιτεί να παλέψεις με το `plh10.exe`.**

[![Άδεια: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tests](https://img.shields.io/badge/tests-66%20αρχεία%20ΕΑΠ-brightgreen.svg)](#έλεγχοι)

<p align="center">
  <a href="https://eap-online-compiler.vercel.app/"><strong>Δοκίμασέ το live</strong></a>
</p>

---

## Τι είναι;

Το EAP Online Compiler είναι ένας interpreter και debugger για την ελληνική Ψευδογλώσσα της ΠΛΗ10. Τρέχει εξ ολοκλήρου στον browser, χωρίς εγκατάσταση, backend ή εξάρτηση από λειτουργικό σύστημα.

Με απλά λόγια: ανοίγεις τη σελίδα, γράφεις κώδικα, πατάς εκτέλεση και βλέπεις τι πραγματικά κάνει αυτό το έκτρωμα ψευδοκώδικα.

## Γιατί δημιουργήθηκε;

Το επίσημο εργαλείο του ΕΑΠ είναι ένα legacy Windows executable. Αυτό σημαίνει:

- περιορισμός σε Windows,
- εγκατάσταση και ρυθμίσεις PATH,
- προβλήματα σε σύγχρονα περιβάλλοντα ανάπτυξης,
- φτωχό error reporting,
- απουσία visual debugging,
- και πιθανότητα να χαλάσει το περιβάλλον GCC/MinGW ενώ προσπαθείς απλώς να κάνεις την εργασία σου.

Η λύση είναι ένας ελαφρύς, cross-platform interpreter που ανοίγει ακόμη και απευθείας από το filesystem.

## Χαρακτηριστικά

- **Editor CodeMirror:** syntax highlighting, αντιστοίχιση παρενθέσεων, αυτόματο κλείσιμο και autocomplete για την ελληνική Ψευδογλώσσα.
- **Βήμα-βήμα εκτέλεση:** εκτέλεση εντολή-προς-εντολή με επισήμανση της ενεργής γραμμής και ρύθμιση ταχύτητας.
- **Επιθεωρητής μεταβλητών και μνήμης (Visual Memory Inspector):** ζωντανή προβολή πραγματικών τιμών σε στυλ "Κουτιών Μνήμης" (Memory Boxes), οπτική αναπαράσταση μονοδιάστατων πινάκων (RAM tape με δείκτες) και 2D πινάκων, badges λογικών τιμών (ΑΛΗΘΗΣ / ΨΕΥΔΗΣ), δυναμική επισήμανση πρόσφατων αλλαγών (live diff glow) και εναλλαγή μεταξύ Καρτών (Cards) και αναλυτικού Πίνακα (Table).
- **Πίνακας τιμών:** καταγραφή των τιμών κατά την εκτέλεση και αντιγραφή σε Markdown.
- **Υποστήριξη `.eap`:** άνοιγμα και αποθήκευση αρχείων Windows-1253 και UTF-8.
- **Κοινοποίηση κώδικα:** δημιουργία shareable URL με συμπίεση LZ-String.
- **Παραδείγματα ύλης:** ταξινομήσεις, αναζητήσεις, πίνακες, αναδρομή και κλήση με αναφορά.
- **Client-side λειτουργία:** χωρίς backend και με δυνατότητα offline χρήσης.

## Live Demo

**[Άνοιξε τον EAP Online Compiler](https://eap-online-compiler.vercel.app/)**

## Εγκατάσταση και χρήση

Δεν χρειάζεται εγκατάσταση dependencies για να χρησιμοποιήσεις την εφαρμογή.

```bash
git clone https://github.com/christoskataxenos/Eap-online-compiler.git
cd Eap-online-compiler
```

Άνοιξε το `index.html` ή το `editor.html` σε οποιονδήποτε σύγχρονο browser.

## Έλεγχοι

Χρειάζεσαι Node.js για να τρέξεις το test suite:

```bash
npm test
```

Οι έλεγχοι επαληθεύουν τη λειτουργία του interpreter και κάνουν parse και στα 66 αρχεία `.eap` του φακέλου `tests/`.

## Δομή του project

```text
.
├── index.html       # Landing page
├── editor.html      # Κύριος editor και debugger
├── app.v6.js        # UI και application logic
├── core.v6.js       # Πυρήνας του interpreter
├── eap-mode.js      # CodeMirror grammar mode
├── examples.js      # Παραδείγματα ύλης
├── style.css        # Themes και layout
└── tests/            # Tests και αρχεία .eap
```

## Τεχνολογίες

- **JavaScript:** Vanilla JS / ES6+
- **Editor:** CodeMirror 5
- **Frontend:** HTML5 και CSS3
- **Tests:** Node.js test runner
- **Libraries:** LZ-String και CodeMirror vendor builds

## Συνεισφορά και Βελτιώσεις από labrouss

Στο κύριο αποθετήριο ενσωματώθηκαν οι παρακάτω βελτιώσεις από το fork του [labrouss](https://github.com/labrouss/Eap-online-compiler):

- **Υποστήριξη κωδικοποίησης Windows-1253:** Δυνατότητα ανοίγματος και ανάγνωσης των παλαιών αρχείων `.eap` του πανεπιστημίου χωρίς αλλοίωση των ελληνικών χαρακτήρων.
- **Αυτόματη συμπλήρωση επανάληψης:** Προσθήκη autocomplete για τη δομή `ΕΠΑΝΑΛΑΒΕ ... ΜΕΧΡΙΣ_ΟΤΟΥ`.
- **Βελτιωμένος οδηγός σύνταξης:** Μετατροπή της βοήθειας σύνταξης από browser alert σε modal παράθυρο διαλόγου για την προβολή αναλυτικού οδηγού.
- **Διόρθωση διπλής εκτύπωσης εισόδου:** Επίλυση του ζητήματος διπλής εκτύπωσης στο τερματικό κατά την ανάγνωση εισόδου (`ΔΙΑΒΑΣΕ`).
- **Προβολή ονόματος προγράμματος:** Αυτόματη αναγνώριση και εμφάνιση του ονόματος του προγράμματος στην κορυφή του παραθύρου επεξεργασίας.
- **Διατήρηση θέματος (Theme Persistence):** Αποθήκευση της επιλογής Light / Dark Mode στο `localStorage` ώστε να διατηρείται κατά την πλοήγηση και την επαναφόρτωση.
- **Άδεια χρήσης MIT:** Ενσωμάτωση επίσημης άδειας χρήσης MIT.

## Συνεισφορά

Αν είσαι φοιτητής του ΕΑΠ και θέλεις να βελτιώσεις το εργαλείο:

1. Κάνε fork το repository.
2. Δημιούργησε ένα feature branch.
3. Τρέξε `npm test`.
4. Άνοιξε Pull Request με σύντομη περιγραφή της αλλαγής.

## English Summary

EAP Online Compiler is a browser-based interpreter and debugger for the Hellenic Open University pseudocode language. It is a cross-platform alternative to the legacy `plh10.exe` workflow and includes step execution, variable inspection, trace tables, `.eap` file support, code sharing and curriculum examples.

## Άδεια χρήσης

Το project διατίθεται με την [MIT License](LICENSE).

---

Developed by **[Christos Kataxenos](https://www.linkedin.com/in/christoskataxenos/)**.
