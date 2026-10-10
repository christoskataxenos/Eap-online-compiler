# 🟣 EAP Online Compiler (Pseudo-Language Interpreter)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Stack: Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![AI Assisted](https://img.shields.io/badge/Built%20With-GenAI%20%7C%20Gemini-8E75B2.svg)](https://deepmind.google/technologies/gemini/)
[![Context](https://img.shields.io/badge/University-Hellenic%20Open%20University-blue.svg)](https://www.eap.gr/)

<p align="center">
  <a href="#-english-version"><strong>[ 🇬🇧 English Version ]</strong></a> | 
  <a href="#-ελληνική-έκδοση"><strong>[ 🇬🇷 Ελληνική Έκδοση ]</strong></a>
</p>

---

<div id="english"></div>

## 🇬🇧 English Version

> **Human vs Machine:** This project was born out of frustration. The official university compiler was a legacy Windows-only executable that often failed on modern systems. I built this to give every student—regardless of OS—a working tool. To ship it fast, I used **AI-Orchestrated Engineering**.

### 🎯 The Motivation: Fixing the "Windows-Only" Bottleneck
Students at the Hellenic Open University (EAP) struggled with the official pseudo-code interpreter (`plh10.exe`).
* ❌ It was **Windows-only**, excluding macOS and Linux users.
* ❌ It required local installation and configuration.
* ❌ It was prone to crashes and lacked modern debugging features.

**The Solution:** I reverse-engineered the language specifications and built a **Web-Based Interpreter** that runs on any device, right in the browser.

### ⚙️ The "AI-First" Workflow
To solve this urgent problem quickly without mastering the nuances of JS parsers first, I leveraged AI:

#### 1. Data Ingestion (The "Dirty" Work) 🤖
* **Input:** Unstructured University PDF textbooks containing syntax rules.
* **Tool:** **Gemini CLI**.
* **Process:** I fed the PDFs to the LLM and prompted it to extract the formal grammar (BNF-style) and generate the core **Tokenizer** and **Parser** logic.

#### 2. The Human Touch (Architecture & UI) 👨‍💻
* **Role:** Product Engineer.
* **Task:** AI handled the parsing logic, but I designed the **Cyberpunk/Dark Mode** UI to make coding pleasant. I ensured the architecture supported specific memory features (Global vs Local scope) that the official tool often mishandled.

#### 3. Integration (The App Layer) 🚀
* **Tool:** **Google Jules / AI Assistants**.
* **Task:** Wiring the logic into a reactive Web App, ensuring 100% client-side execution for privacy and speed.

### ⚡ Features (v2.0)
* **CodeMirror Editor:** Syntax highlighting, matching brackets, auto-closing brackets, and context-aware autocomplete for Greek pseudocode.
* **Step-by-Step Visual Debugger:** Step through code line-by-line (⏭ ΒΗΜΑ) with active line highlighting and speed control (⏱️ Normal, 200ms, 500ms, 1s).
* **Live Memory & Variables Inspector:** Real-time scope inspection displaying primitive variables, 1D arrays, and 2D matrices with animated diff highlighting (`.just-changed`).
* **Trace Table (Πίνακας Τιμών):** Automatic generation of the execution trace table required in EAP exams and homework, with one-click export to Markdown (`📋 Copy Markdown`).
* **Cross-Platform & Offline:** 100% client-side, zero backend dependencies. Works in any browser even when opened directly from file system (`file://`).
* **Legacy Windows-1253 File Decoding:** Open and save official university `.eap` files in both Windows-1253 and UTF-8 formats.
* **Code Sharing via URL:** Share code snippets instantly using LZ-String permalinks.
* **Curated Curriculum Examples:** 17 official university examples across 8 categories (Sorts, Searches, 2D Matrices, Recursion, References).
* **Comprehensive Automated Test Suite:** 100% pass rate across all 66 official university curriculum `.eap` files (`npm test`).

### 🚀 Quick Start
1.  **Clone** this repository.
2.  Open `index.html` or `editor.html` in **any** browser.
3.  Or run tests with `npm test`.

---

<div id="greek"></div>

## 🇬🇷 Ελληνική Έκδοση

> **Human vs Machine:** Αυτό το project γεννήθηκε από ανάγκη. Ο επίσημος compiler του ΕΑΠ ήταν ένα παλιό εκτελέσιμο αρχείο (.exe) που απέκλειε χρήστες macOS/Linux και συχνά δυσλειτουργούσε. Έφτιαξα αυτό το εργαλείο για να δώσω λύση σε όλους τους φοιτητές, χρησιμοποιώντας **AI-Orchestrated Engineering** για ταχύτητα.

### 🎯 Το Κίνητρο: Πέρα από το plh10.exe
Πολλοί φοιτητές στην ενότητα ΠΛΗ10 αντιμετώπιζαν προβλήματα με το επίσημο λογισμικό:
* ❌ Λειτουργούσε **μόνο σε Windows**.
* ❌ Απαιτούσε εγκατάσταση.
* ❌ Είχε φτωχό error reporting και καθόλου δυνατότητες visual debugging.

**Η Λύση:** Ένας σύγχρονος **Web-Based Interpreter & Debugger** που τρέχει παντού (κινητά, tablet, Mac, PC, Linux) χωρίς καμία εγκατάσταση.

### ⚡ Χαρακτηριστικά (v2.0)
* **Σύγχρονος Συντάκτης CodeMirror:** Πλήρης υποστήριξη της ελληνικής ψευδογλώσσας, αυτόματη συμπλήρωση (autocomplete), ταίριασμα παρενθέσεων και αυτόματη στοίχιση (Format - Ctrl+Shift+F).
* **Βήμα-προς-Βήμα Αποσφαλμάτωση (Visual Stepper):** Εκτέλεση εντολή-προς-εντολή (⏭ ΒΗΜΑ) με οπτική επισήμανση της ενεργής γραμμής και ρύθμιση ταχύτητας (⏱️).
* **Επιθεωρητής Μνήμης & Μεταβλητών (Inspector):** Ζωντανή παρακολούθηση τιμών, οπτική αναπαράσταση μονοδιάστατων πινάκων και 2D πινάκων, με χρωματική επισήμανση των μεταβλητών που άλλαξαν τιμή.
* **Πίνακας Τιμών (Trace Table):** Αυτόματη καταγραφή του πίνακα τιμών (απαραίτητο στις εργασίες και εξετάσεις ΠΛΗ10) και αντιγραφή σε Markdown με 1 κλικ.
* **Υποστήριξη Αρχείων .eap (Windows-1253):** Άνοιγμα και αποκωδικοποίηση των επίσημων αρχείων του πανεπιστημίου χωρίς προβλήματα γραμματοσειράς.
* **Κοινοποίηση μέσω Συνδέσμου (Share):** Δημιουργία μοναδικού συνδέσμου (URL permalink) με ενσωματωμένο τον κώδικα (LZ-String).
* **17 Έτοιμα Παραδείγματα Ύλης:** Ταξινομήσεις (Bubble, Selection, Insertion, Quick, Merge Sort), Αναζητήσεις, 2D Πίνακες, Αναδρομή, Κλήση με Αναφορά (`%`).
* **Πλήρης Αυτοματοποιημένη Σουίτα Ελέγχων:** 100% επιτυχία και στα 66 επίσημα `.eap` αρχεία του πανεπιστημίου (`npm test`).

### 🚀 Οδηγίες Χρήσης
1.  Κατεβάστε τα αρχεία ή κάντε clone το repository.
2.  Ανοίξτε το αρχείο `index.html` ή `editor.html` με οποιονδήποτε browser (ακόμα και offline).
3.  Για εκτέλεση των tests: τρέξτε `npm test`.

---

### 🛠️ Tech Stack
* **Language:** Vanilla JavaScript (ES6+), Node.js (Test runner).
* **Editor:** CodeMirror 5 με custom EAP grammar mode.
* **Frontend:** HTML5, CSS3 (Light Solarized & Dark Cyberpunk Themes).
* **Tools:** Google Gemini CLI, Google Jules.

### 🤝 Contributing
Αν είσαι φοιτητής του ΕΑΠ και θέλεις να βελτιώσουμε κι άλλο το εργαλείο:
1.  Κάνε **Fork** το repo.
2.  Δημιούργησε Pull Request.

---
*Developed by **Christos Kataxenos** | [LinkedIn](https://www.linkedin.com/in/christoskataxenos/)*

