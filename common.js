// -----------------------------------------------------------------------------
// EAP Online Compiler — Shared UI utilities (common.js)
// Single source of truth for: settings, theme, toast, modals, clipboard,
// share permalinks, file save/load (UTF-8 + Windows-1253), tabs, autosave.
// Plain script (no modules) so it works from file:// — exposes window.EAPCommon.
// -----------------------------------------------------------------------------

(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Settings (localStorage with safe fallback for file:// / restricted envs)
  // ---------------------------------------------------------------------------
  const SettingsManager = {
    get(key, defaultValue) {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? v : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Ignore on restricted environments
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(fn, ms) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Tiny DOM builder: el('div', { class: 'x', 'data-id': 3 }, [child])
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else node.setAttribute(k, v);
      }
    }
    if (children) {
      for (const c of [].concat(children)) {
        if (c == null) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function showToast(message, duration = 2500) {
    const existing = document.querySelector('.eap-toast');
    if (existing) existing.remove();
    const toast = el('div', { class: 'eap-toast', role: 'status', 'aria-live': 'polite' });
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, duration);
  }

  function copyTextToClipboard(text, okMessage) {
    if (!text) return Promise.resolve(false);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(() => { showToast(okMessage || 'Αντιγράφηκε στο πρόχειρο!'); return true; })
        .catch(() => { showToast('Αποτυχία αντιγραφής στο πρόχειρο.'); return false; });
    }
    showToast('Το πρόχειρο δεν είναι διαθέσιμο σε αυτό το περιβάλλον.');
    return Promise.resolve(false);
  }

  function copyHtmlTableToClipboard(htmlString, plainFallback, okMessage) {
    if (!htmlString) return Promise.resolve(false);
    if (navigator.clipboard && typeof window !== 'undefined' && window.ClipboardItem) {
      const htmlBlob = new Blob([htmlString], { type: 'text/html' });
      const textBlob = new Blob([plainFallback || htmlString], { type: 'text/plain' });
      return navigator.clipboard.write([
        new window.ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]).then(() => {
        showToast(okMessage || 'Ο πίνακας αντιγράφηκε! Πατήστε Ctrl+V στο MS Word.');
        return true;
      }).catch(() => copyTextToClipboard(plainFallback || htmlString, okMessage));
    }
    return copyTextToClipboard(plainFallback || htmlString, okMessage);
  }

  // ---------------------------------------------------------------------------
  // Theme management (FOUC-safe: initTheme() runs immediately on script load)
  // ---------------------------------------------------------------------------
  function normalizeTheme(t) {
    return t === 'dark' ? 'dark' : 'light';
  }

  function syncMetaThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0c15' : '#fdf6e3');
  }

  function initTheme() {
    let theme = 'light';
    try {
      const params = new URLSearchParams(window.location.search);
      theme = normalizeTheme(params.get('theme') || localStorage.getItem('theme') || 'light');
    } catch (e) {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    syncMetaThemeColor(theme);

    // BFCache: re-apply on pageshow
    window.addEventListener('pageshow', () => {
      try {
        const t = normalizeTheme(localStorage.getItem('theme') || 'light');
        document.documentElement.setAttribute('data-theme', t);
        syncMetaThemeColor(t);
      } catch (e) { /* ignore */ }
    });
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  // Rewrite every internal link that carries data-base with ?theme=<theme>
  function updateThemeLinks(theme) {
    document.querySelectorAll('a[data-base]').forEach((link) => {
      const base = link.getAttribute('data-base');
      if (base) link.href = `${base}?theme=${theme}`;
    });
    const home = document.querySelector('.home-link');
    if (home && !home.hasAttribute('data-base')) home.href = `index.html?theme=${theme}`;
  }

  // applyTheme(true|false, { onChange(themeName) })
  // onChange is used by each page to sync CodeMirror theme and re-render diagrams.
  function applyTheme(isDark, opts = {}) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    SettingsManager.set('theme', theme);

    const toggle = document.getElementById('theme-toggle') || document.getElementById('theme-toggle-landing');
    if (toggle) toggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';

    try {
      const url = new URL(window.location);
      url.searchParams.set('theme', theme);
      window.history.replaceState({}, '', url);
    } catch (e) { /* file:// fallback */ }

    updateThemeLinks(theme);
    syncMetaThemeColor(theme);
    if (typeof opts.onChange === 'function') opts.onChange(theme);
  }

  function wireThemeToggle(opts = {}) {
    const toggle = document.getElementById('theme-toggle') || document.getElementById('theme-toggle-landing');
    if (!toggle) return;
    if (!toggle.hasAttribute('aria-label')) {
      toggle.setAttribute('aria-label', 'Εναλλαγή θέματος (φωτεινό / σκοτεινό)');
    }
    const syncPressed = () => toggle.setAttribute('aria-pressed', getTheme() === 'dark' ? 'true' : 'false');
    syncPressed();
    applyTheme(getTheme() === 'dark', opts);
    syncPressed();
    toggle.addEventListener('click', () => {
      applyTheme(getTheme() !== 'dark', opts);
      syncPressed();
    });
  }

  // ---------------------------------------------------------------------------
  // Unified Tools / Course Submenu Dropdown (shared across all pages)
  // ---------------------------------------------------------------------------
  function wireCourseSubmenu() {
    const submenu = document.getElementById('course-submenu');
    const submenuBtn = document.getElementById('tools-submenu-btn');
    if (!submenu || !submenuBtn || submenu.dataset.wired === 'true') return;
    submenu.dataset.wired = 'true';

    let isPinnedByClick = false;
    let closeTimeout = null;

    function setSubmenuOpen(open, pinned = false) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      if (!open) {
        isPinnedByClick = false;
      } else if (pinned) {
        isPinnedByClick = true;
      }
      submenu.classList.toggle('open', open);
      submenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    submenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (submenu.classList.contains('open') && isPinnedByClick) {
        setSubmenuOpen(false);
      } else {
        setSubmenuOpen(true, true);
      }
    });

    submenu.addEventListener('mouseenter', () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
        setSubmenuOpen(true, isPinnedByClick);
      }
    });

    submenu.addEventListener('mouseleave', () => {
      if (isPinnedByClick) return;
      closeTimeout = setTimeout(() => {
        setSubmenuOpen(false);
      }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!submenu.contains(e.target)) {
        setSubmenuOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && submenu.classList.contains('open')) {
        setSubmenuOpen(false);
        submenuBtn.focus();
      }
    });

    submenu.querySelectorAll('.submenu-item').forEach((item) => {
      item.addEventListener('click', () => {
        setSubmenuOpen(false);
      });
    });

    updateThemeLinks(getTheme());
  }

  // ---------------------------------------------------------------------------
  // Share permalink (Deflate-Raw #z= + LZ-String #code= fallback)
  // Deflate-Raw shrinks large Greek pseudocode by ~56-65% vs LZ-String so URLs
  // stay well within the 5,000-char limit of is.gd / v.gd shorteners.
  // ---------------------------------------------------------------------------
  function bytesToBase64Url(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBytes(b64url) {
    let b64 = String(b64url || '').replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deflateStringToBase64Url(text) {
    if (typeof CompressionStream !== 'function' || typeof Response !== 'function') return null;
    const rawBytes = new TextEncoder().encode(text);
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(rawBytes);
    writer.close();
    const compressedBuf = await new Response(cs.readable).arrayBuffer();
    return bytesToBase64Url(new Uint8Array(compressedBuf));
  }

  async function inflateBase64UrlToString(b64url) {
    if (typeof DecompressionStream !== 'function' || typeof Response !== 'function') return null;
    const compBytes = base64UrlToBytes(b64url);
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compBytes);
    writer.close();
    const plainBuf = await new Response(ds.readable).arrayBuffer();
    return new TextDecoder('utf-8').decode(plainBuf);
  }

  function hasSharedHash() {
    const hash = typeof window !== 'undefined' && window.location ? window.location.hash : '';
    return Boolean(hash && (hash.startsWith('#code=') || hash.startsWith('#z=')));
  }

  function loadCodeFromHash() {
    try {
      const lz = typeof LZString !== 'undefined' ? LZString : (typeof window !== 'undefined' ? window.LZString : null);
      const hash = typeof window !== 'undefined' && window.location ? window.location.hash : '';
      if (hash && hash.startsWith('#code=') && lz) {
        const dec = lz.decompressFromEncodedURIComponent(hash.substring(6));
        if (dec && dec.trim()) return dec;
      }
    } catch (e) {
      console.warn('Permalink decode error:', e);
    }
    return null;
  }

  function loadCodeFromHashAsync(onLoaded) {
    try {
      const hash = typeof window !== 'undefined' && window.location ? window.location.hash : '';
      if (hash && hash.startsWith('#z=')) {
        inflateBase64UrlToString(hash.substring(3))
          .then((dec) => {
            if (dec && dec.trim() && typeof onLoaded === 'function') {
              onLoaded(dec);
            }
          })
          .catch((e) => console.warn('Deflate permalink decode error:', e));
      }
    } catch (e) {
      console.warn('Async permalink decode error:', e);
    }
  }

  function buildShareURL(code) {
    const lz = typeof LZString !== 'undefined' ? LZString : (typeof window !== 'undefined' ? window.LZString : null);
    if (!lz || typeof window === 'undefined' || !window.location) return null;
    const compressed = lz.compressToEncodedURIComponent(code);
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = `code=${compressed}`;
    try {
      window.history.replaceState(null, '', url.toString());
    } catch (e) { /* file:// fallback */ }
    return url.toString();
  }

  async function buildShareURLAsync(code) {
    if (typeof window === 'undefined' || !window.location) return null;
    const fallbackUrl = buildShareURL(code);
    try {
      const deflated = await deflateStringToBase64Url(code);
      if (deflated) {
        const zUrl = new URL(window.location.href);
        zUrl.search = '';
        zUrl.hash = `z=${deflated}`;
        const zStr = zUrl.toString();
        if (!fallbackUrl || zStr.length < fallbackUrl.length) {
          try {
            window.history.replaceState(null, '', zStr);
          } catch (e) { /* file:// fallback */ }
          return zStr;
        }
      }
    } catch (e) {
      // Fallback to LZString URL
    }
    return fallbackUrl;
  }

  async function requestShortUrl(longUrl) {
    if (typeof window === 'undefined' || !window.location) {
      return { ok: false, reason: 'unsupported' };
    }
    const proto = window.location.protocol;
    const host = window.location.hostname;
    if (proto === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return { ok: false, reason: 'local' };
    }

    // is.gd / v.gd enforce a strict 5,000-character ceiling on target URLs
    if (longUrl && longUrl.length > 5000) {
      return { ok: false, reason: 'too_long' };
    }

    const postBody = new URLSearchParams({ format: 'json', url: longUrl }).toString();

    for (const endpoint of ['https://is.gd/create.php', 'https://v.gd/create.php']) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: postBody,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data && data.shorturl) {
            return { ok: true, shortUrl: data.shorturl };
          }
          if (data && data.errorcode === 1) {
            return { ok: false, reason: 'too_long' };
          }
        }
      } catch (err) {
        // Try next endpoint
      }
    }

    return { ok: false, reason: 'network' };
  }

  function showShareModal(code, fullUrl) {
    if (typeof document === 'undefined') return Promise.resolve(fullUrl);

    const existing = document.getElementById('eap-share-modal');
    if (existing) existing.remove();

    const charCount = fullUrl ? fullUrl.length.toLocaleString('el-GR') : '0';

    const modal = createModal({
      id: 'eap-share-modal',
      title: 'Κοινοποίηση Κώδικα',
      bodyHTML: `
        <div class="eap-share-modal-body">
          <p class="eap-share-intro">Επιλέξτε τη μορφή συνδέσμου που θέλετε να μοιραστείτε:</p>

          <div class="eap-share-card">
            <div class="eap-share-card-header">
              <div class="eap-share-title-group">
                <span class="eap-share-tag eap-tag-short">⚡ Σύντομος Σύνδεσμος</span>
                <span class="eap-share-tag-desc">Προτεινόμενο για chat, forum, emails</span>
              </div>
            </div>
            <div class="eap-share-row">
              <input type="text" id="eap-share-short-input" class="eap-share-input" readonly placeholder="Δημιουργία σύντομου συνδέσμου..." />
              <button type="button" id="eap-share-short-btn" class="btn-run eap-share-btn" disabled>Αντιγραφή</button>
            </div>
            <div id="eap-share-short-status" class="eap-share-status">⏳ Δημιουργία σύντομου συνδέσμου...</div>
          </div>

          <div class="eap-share-card">
            <div class="eap-share-card-header">
              <div class="eap-share-title-group">
                <span class="eap-share-tag eap-tag-perm">🔒 Μόνιμος Σύνδεσμος</span>
                <span class="eap-share-length-info">(${charCount} χαρακτήρες)</span>
              </div>
            </div>
            <div class="eap-share-row">
              <input type="text" id="eap-share-perm-input" class="eap-share-input" readonly />
              <button type="button" id="eap-share-perm-btn" class="tab-action-btn eap-share-btn">Αντιγραφή</button>
            </div>
            <p class="eap-share-desc">
              Περιέχει ολόκληρο τον κώδικα απευθείας στο URL (LZ-String). Λειτουργεί αυτόνομα χωρίς εξωτερικές υπηρεσίες και δεν λήγει ποτέ.
            </p>
          </div>
        </div>
      `
    });

    const shortInput = modal.body.querySelector('#eap-share-short-input');
    const shortBtn = modal.body.querySelector('#eap-share-short-btn');
    const shortStatus = modal.body.querySelector('#eap-share-short-status');
    const permInput = modal.body.querySelector('#eap-share-perm-input');
    const permBtn = modal.body.querySelector('#eap-share-perm-btn');

    permInput.value = fullUrl || '';

    const setupCopyAction = (btn, input, successMsg) => {
      btn.addEventListener('click', () => {
        const text = input.value;
        if (!text) return;
        copyTextToClipboard(text, successMsg).then((ok) => {
          if (ok) {
            const originalText = btn.textContent;
            btn.textContent = '✓ Αντιγράφηκε!';
            btn.classList.add('eap-copied-success');
            setTimeout(() => {
              btn.textContent = originalText;
              btn.classList.remove('eap-copied-success');
            }, 2000);
          }
        });
      });
    };

    setupCopyAction(shortBtn, shortInput, 'Ο σύντομος σύνδεσμος αντιγράφηκε στο πρόχειρο!');
    setupCopyAction(permBtn, permInput, 'Ο μόνιμος σύνδεσμος αντιγράφηκε στο πρόχειρο!');

    [shortInput, permInput].forEach((inp) => {
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('click', () => inp.select());
    });

    modal.open();

    // Asynchronously fetch the short URL
    requestShortUrl(fullUrl).then((result) => {
      if (!modal.isOpen()) return;
      if (result.ok && result.shortUrl) {
        shortInput.value = result.shortUrl;
        shortBtn.removeAttribute('disabled');
        shortStatus.textContent = '✓ Ο σύντομος σύνδεσμος είναι έτοιμος!';
        shortStatus.className = 'eap-share-status success';
        shortBtn.focus();
      } else {
        shortInput.value = '';
        shortInput.placeholder = 'Μη διαθέσιμος';
        shortBtn.setAttribute('disabled', 'disabled');
        if (result.reason === 'local') {
          shortStatus.textContent = 'ℹ️ Η συντόμευση λειτουργεί online (μη διαθέσιμη σε localhost / τοπικό αρχείο).';
        } else if (result.reason === 'too_long') {
          shortStatus.textContent = 'ℹ️ Ο κώδικας υπερβαίνει το όριο των 5.000 χαρακτήρων των εξωτερικών υπηρεσιών συντόμευσης. Αντιγράψτε τον Μόνιμο Σύνδεσμο παρακάτω (λειτουργεί κανονικά)!';
        } else {
          shortStatus.textContent = '⚠️ Αποτυχία σύνδεσης με την υπηρεσία συντόμευσης. Χρησιμοποιήστε τον μόνιμο σύνδεσμο.';
        }
        shortStatus.className = 'eap-share-status warn';
        permBtn.focus();
      }
    });

    return Promise.resolve(fullUrl);
  }

  function encodeSharePayload(code, layoutObj) {
    const cleanCode = String(code || '').replace(/\n?\/\*\s*@EAP_LAYOUT:\s*\{[\s\S]*?\}\s*\*\/\s*$/, '');
    if (!layoutObj || typeof layoutObj !== 'object') return cleanCode;
    const hasEntries = Object.values(layoutObj).some((v) => v && typeof v === 'object' && Object.keys(v).length > 0);
    if (!hasEntries) return cleanCode;
    try {
      return `${cleanCode}\n/* @EAP_LAYOUT: ${JSON.stringify(layoutObj)} */`;
    } catch (e) {
      return cleanCode;
    }
  }

  function decodeSharePayload(rawText) {
    const str = String(rawText || '');
    const m = str.match(/\n?\/\*\s*@EAP_LAYOUT:\s*(\{[\s\S]*?\})\s*\*\/\s*$/);
    if (!m) return { code: str, layout: null };
    let layout = null;
    try {
      layout = JSON.parse(m[1]);
    } catch (e) {
      layout = null;
    }
    const cleanCode = str.slice(0, m.index);
    return { code: cleanCode, layout };
  }

  function shareCode(code, extraOrMsg) {
    if (!code || !code.trim()) {
      showToast('Δεν υπάρχει κώδικας για κοινοποίηση.');
      return Promise.resolve(null);
    }
    const layoutObj = (extraOrMsg && typeof extraOrMsg === 'object') ? extraOrMsg : null;
    const payload = encodeSharePayload(code, layoutObj);
    return buildShareURLAsync(payload).then((fullUrl) => {
      if (!fullUrl) {
        showToast('Η βιβλιοθήκη συμπίεσης δεν είναι διαθέσιμη.');
        return null;
      }
      return showShareModal(payload, fullUrl);
    });
  }

  // ---------------------------------------------------------------------------
  // File save / load (UTF-8 with Windows-1253 fallback)
  // ---------------------------------------------------------------------------
  function saveTextAsFile(text, filename, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Manual Windows-1253 decoder (fallback when TextDecoder lacks the encoding)
  const WINDOWS_1253_MAP = {
    0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
    0x86: '\u2020', 0x87: '\u2021', 0x89: '\u2030', 0x8B: '\u2039', 0x8C: '\u0152',
    0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022',
    0x96: '\u2013', 0x97: '\u2014', 0x99: '\u2122', 0x9B: '\u203A', 0x9C: '\u0153',
    0xA0: '\u00A0', 0xA1: '\u0385', 0xA2: '\u0386', 0xA3: '\u00A3', 0xA4: '\u00A4',
    0xA5: '\u00A5', 0xA6: '\u00A6', 0xA7: '\u00A7', 0xA8: '\u00A8', 0xA9: '\u00A9',
    0xAA: '\u037A', 0xAB: '\u00AB', 0xAC: '\u00AC', 0xAD: '\u00AD', 0xAE: '\u00AE',
    0xAF: '\u2015', 0xB0: '\u00B0', 0xB1: '\u00B1', 0xB2: '\u00B2', 0xB3: '\u00B3',
    0xB4: '\u0384', 0xB5: '\u00B5', 0xB6: '\u00B6', 0xB7: '\u00B7', 0xB8: '\u0388',
    0xB9: '\u0389', 0xBA: '\u038A', 0xBB: '\u00BB', 0xBC: '\u038C', 0xBD: '\u00BD',
    0xBE: '\u038E', 0xBF: '\u038F', 0xC0: '\u0390', 0xC1: '\u0391', 0xC2: '\u0392',
    0xC3: '\u0393', 0xC4: '\u0394', 0xC5: '\u0395', 0xC6: '\u0396', 0xC7: '\u0397',
    0xC8: '\u0398', 0xC9: '\u0399', 0xCA: '\u039A', 0xCB: '\u039B', 0xCC: '\u039C',
    0xCD: '\u039D', 0xCE: '\u039E', 0xCF: '\u039F', 0xD0: '\u03A0', 0xD1: '\u03A1',
    0xD3: '\u03A3', 0xD4: '\u03A4', 0xD5: '\u03A5', 0xD6: '\u03A6', 0xD7: '\u03A7',
    0xD8: '\u03A8', 0xD9: '\u03A9', 0xDA: '\u03AA', 0xDB: '\u03AB', 0xDC: '\u03AC',
    0xDD: '\u03AD', 0xDE: '\u03AE', 0xDF: '\u03AF', 0xE0: '\u03B0', 0xE1: '\u03B1',
    0xE2: '\u03B2', 0xE3: '\u03B3', 0xE4: '\u03B4', 0xE5: '\u03B5', 0xE6: '\u03B6',
    0xE7: '\u03B7', 0xE8: '\u03B8', 0xE9: '\u03B9', 0xEA: '\u03BA', 0xEB: '\u03BB',
    0xEC: '\u03BC', 0xED: '\u03BD', 0xEE: '\u03BE', 0xEF: '\u03BF', 0xF0: '\u03C0',
    0xF1: '\u03C1', 0xF2: '\u03C2', 0xF3: '\u03C3', 0xF4: '\u03C4', 0xF5: '\u03C5',
    0xF6: '\u03C6', 0xF7: '\u03C7', 0xF8: '\u03C8', 0xF9: '\u03C9', 0xFA: '\u03CA',
    0xFB: '\u03CB', 0xFC: '\u03CC', 0xFD: '\u03CD', 0xFE: '\u03CE'
  };

  function decodeWindows1253(bytes) {
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b < 0x80) result += String.fromCharCode(b);
      else if (WINDOWS_1253_MAP[b]) result += WINDOWS_1253_MAP[b];
      else result += String.fromCharCode(b);
    }
    return result;
  }

  // Read a text file as UTF-8; if invalid, retry as Windows-1253.
  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buf = new Uint8Array(reader.result);
        try {
          resolve(new TextDecoder('utf-8', { fatal: true }).decode(buf));
          return;
        } catch (e) { /* not valid UTF-8, fall through */ }
        try {
          resolve(new TextDecoder('windows-1253').decode(buf));
          return;
        } catch (e) { /* encoding unsupported, fall through */ }
        resolve(decodeWindows1253(buf));
      };
      reader.onerror = () => reject(new Error('Αποτυχία ανάγνωσης αρχείου.'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Open a file picker without needing a hidden input in the HTML.
  function pickFile(accept) {
    return new Promise((resolve) => {
      const input = el('input', { type: 'file', style: 'display:none' });
      if (accept) input.accept = accept;
      input.addEventListener('change', () => {
        const f = input.files && input.files[0];
        input.remove();
        resolve(f || null);
      });
      document.body.appendChild(input);
      input.click();
    });
  }

  // ---------------------------------------------------------------------------
  // Generic modal system (replaces alert/confirm/prompt)
  // ---------------------------------------------------------------------------
  function createModal({ id, title, bodyHTML } = {}) {
    let modal = id ? document.getElementById(id) : null;
    if (modal) {
      return {
        el: modal,
        body: modal.querySelector('.modal-body'),
        open: () => { modal.style.display = 'flex'; },
        close: () => { modal.style.display = 'none'; },
        isOpen: () => modal.style.display === 'flex'
      };
    }

    modal = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
    if (id) modal.id = id;
    const content = el('div', { class: 'modal-content' });
    const closeBtn = el('button', { type: 'button', class: 'modal-close', 'aria-label': 'Κλείσιμο' });
    closeBtn.innerHTML = '&times;';
    const h2 = el('h2', { text: title || '' });
    const body = el('div', { class: 'modal-body' });
    body.innerHTML = bodyHTML || '';
    content.appendChild(closeBtn);
    content.appendChild(h2);
    content.appendChild(body);
    modal.appendChild(content);
    document.body.appendChild(modal);

    const api = {
      el: modal,
      body,
      open: () => { modal.style.display = 'flex'; },
      close: () => { modal.style.display = 'none'; },
      isOpen: () => modal.style.display === 'flex'
    };
    closeBtn.addEventListener('click', () => api.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) api.close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && api.isOpen()) api.close();
    });
    return api;
  }

  // showConfirm(message, { title, yesText, noText, danger, onYes }) -> modal api
  function showConfirm(message, opts = {}) {
    const modal = createModal({
      title: opts.title || 'Επιβεβαίωση',
      bodyHTML: `<p class="eap-dialog-msg"></p>
        <div class="eap-dialog-actions">
          <button type="button" class="tab-action-btn eap-dialog-cancel"></button>
          <button type="button" class="btn-run eap-dialog-ok" style="text-transform:none;"></button>
        </div>`
    });
    modal.body.querySelector('.eap-dialog-msg').textContent = message;
    const cancelBtn = modal.body.querySelector('.eap-dialog-cancel');
    const okBtn = modal.body.querySelector('.eap-dialog-ok');
    cancelBtn.textContent = opts.noText || 'Άκυρο';
    okBtn.textContent = opts.yesText || 'Ναι';
    if (opts.danger) okBtn.classList.add('btn-stop');
    cancelBtn.addEventListener('click', () => modal.close());
    okBtn.addEventListener('click', () => {
      modal.close();
      if (typeof opts.onYes === 'function') opts.onYes();
    });
    modal.open();
    okBtn.focus();
    return modal;
  }

  // showPrompt(message, { title, defaultValue, readonly, onSubmit }) -> modal api
  function showPrompt(message, opts = {}) {
    const modal = createModal({
      title: opts.title || 'Εισαγωγή',
      bodyHTML: `<p class="eap-dialog-msg"></p>
        <input type="text" class="eap-dialog-input" style="width:100%; box-sizing:border-box;">
        <div class="eap-dialog-actions">
          <button type="button" class="tab-action-btn eap-dialog-cancel"></button>
          <button type="button" class="btn-run eap-dialog-ok" style="text-transform:none;"></button>
        </div>`
    });
    modal.body.querySelector('.eap-dialog-msg').textContent = message;
    const input = modal.body.querySelector('.eap-dialog-input');
    const cancelBtn = modal.body.querySelector('.eap-dialog-cancel');
    const okBtn = modal.body.querySelector('.eap-dialog-ok');
    input.value = opts.defaultValue || '';
    if (opts.readonly) input.setAttribute('readonly', 'readonly');
    cancelBtn.textContent = 'Άκυρο';
    okBtn.textContent = 'OK';
    const submit = () => {
      const val = input.value;
      modal.close();
      if (typeof opts.onSubmit === 'function') opts.onSubmit(val);
    };
    okBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    cancelBtn.addEventListener('click', () => modal.close());
    modal.open();
    input.focus();
    if (opts.defaultValue) input.select();
    return modal;
  }

  // ---------------------------------------------------------------------------
  // Tabs helper
  // ---------------------------------------------------------------------------
  function switchTabs(buttons, panes, tabId, onSwitch) {
    buttons.forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
    panes.forEach((p) => p.classList.toggle('active', p.id === tabId));
    if (typeof onSwitch === 'function') onSwitch(tabId);
  }

  function wireTabs(onSwitch) {
    const buttons = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => switchTabs(buttons, panes, btn.getAttribute('data-tab'), onSwitch));
    });
    return { buttons, panes, switchTo: (id) => switchTabs(buttons, panes, id, onSwitch) };
  }

  // ---------------------------------------------------------------------------
  // Example selector helper
  // ---------------------------------------------------------------------------
  function populateExampleSelector(select, categories, placeholder, onPick) {
    if (!select || !Array.isArray(categories)) return;
    select.innerHTML = `<option value="" disabled selected>${escapeHTML(placeholder)}</option>`;
    for (const cat of categories) {
      const og = document.createElement('optgroup');
      og.label = cat.category;
      for (const item of cat.items) {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.title;
        og.appendChild(opt);
      }
      select.appendChild(og);
    }
    select.addEventListener('change', (e) => {
      const id = e.target.value;
      const label = e.target.options[e.target.selectedIndex] ? e.target.options[e.target.selectedIndex].text : id;
      if (id) onPick(id, label);
    });
  }

  // ---------------------------------------------------------------------------
  // Autosave draft (localStorage) — protects against tab close / crash
  // ---------------------------------------------------------------------------
  function createAutosave({ key, getValue, setValue, onRestore, debounceMs = 400 }) {
    let timer = null;

    function saveNow() {
      const v = typeof getValue === 'function' ? getValue() : '';
      if (v && v.trim()) SettingsManager.set(key, v);
    }

    // Restore on creation ONLY when no shared permalink (#code= / #z=) is in URL
    const saved = hasSharedHash() ? null : SettingsManager.get(key, null);
    const restored = Boolean(saved && saved.trim());
    if (restored && typeof setValue === 'function') {
      setValue(saved);
      if (typeof onRestore === 'function') onRestore(saved);
    }

    return {
      restored,
      onChange() {
        clearTimeout(timer);
        timer = setTimeout(saveNow, debounceMs);
      },
      saveNow,
      clear() { SettingsManager.remove(key); }
    };
  }

  // ---------------------------------------------------------------------------
  // Multi-File Student Workspace Manager («Οι Εργασίες μου») + Assignment Notes
  // ---------------------------------------------------------------------------
  function createWorkspaceManager(opts = {}) {
    const courseKey = opts.courseKey || 'default';
    const storageKey = `eapWorkspaces_${courseKey}_v1`;
    const defaultTitle = opts.defaultSlotTitle || 'Άσκηση 1';
    const getCode = opts.getCode || (() => '');
    const setCode = opts.setCode || (() => {});
    const getExtraState = opts.getExtraState || (() => ({}));
    const setExtraState = opts.setExtraState || (() => {});

    let state = { activeId: null, items: [] };
    try {
      const raw = SettingsManager.get(storageKey, null);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          state = parsed;
        }
      }
    } catch (e) { /* ignore corrupt JSON */ }

    function makeId() {
      return 'ws_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    }

    if (state.items.length === 0) {
      const firstId = makeId();
      state.items.push({
        id: firstId,
        title: defaultTitle,
        updatedAt: Date.now(),
        code: getCode(),
        notes: '',
        extra: getExtraState()
      });
      state.activeId = firstId;
    } else if (!state.items.some((x) => x.id === state.activeId)) {
      state.activeId = state.items[0].id;
    }

    function persist() {
      try {
        SettingsManager.set(storageKey, JSON.stringify(state));
      } catch (e) { /* quota fallback */ }
    }

    function getActiveSlot() {
      return state.items.find((x) => x.id === state.activeId) || state.items[0];
    }

    function saveActiveNow() {
      const slot = getActiveSlot();
      if (!slot) return;
      slot.code = getCode();
      slot.extra = getExtraState();
      slot.updatedAt = Date.now();
      persist();
      syncHeaderUI();
    }

    const saveDebounced = debounce(saveActiveNow, 450);

    // Wire Notes Drawer UI
    const notesBtn = document.getElementById('notes-toggle-btn');
    const wsBtn = document.getElementById('workspaces-btn');
    let notesDrawer = document.getElementById('eap-notes-drawer');
    const hostEl = opts.notesHostEl || document.querySelector('.editor-container');

    if (!notesDrawer && hostEl) {
      notesDrawer = el('div', { id: 'eap-notes-drawer', class: 'eap-notes-drawer', hidden: 'hidden' });
      notesDrawer.innerHTML = `
        <div class="eap-notes-header">
          <div>
            <strong>📝 Εκφώνηση &amp; Προσωπικές Σημειώσεις</strong>
            <span class="eap-notes-sub" id="eap-notes-slot-label"></span>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button type="button" class="tab-action-btn" id="eap-notes-clear-btn" title="Καθαρισμός σημειώσεων αυτής της άσκησης">Καθαρισμός</button>
            <button type="button" class="tab-action-btn" id="eap-notes-close-btn" title="Απόκρυψη πλαισίου εκφώνησης">Κλείσιμο ▲</button>
          </div>
        </div>
        <textarea id="eap-notes-textarea" rows="4" spellcheck="false" placeholder="Επικολλήστε εδώ την εκφώνηση του θέματος (π.χ. ΓΕ1 / ΓΕ2 - Θέμα 3) ή τις σημειώσεις σας ώστε να τις βλέπετε δίπλα στον κώδικα..."></textarea>
      `;
      const editorWrap = hostEl.querySelector('.editor-wrapper');
      if (editorWrap) hostEl.insertBefore(notesDrawer, editorWrap);
      else hostEl.appendChild(notesDrawer);
    }

    const notesTextarea = notesDrawer ? notesDrawer.querySelector('#eap-notes-textarea') : null;
    const notesSlotLabel = notesDrawer ? notesDrawer.querySelector('#eap-notes-slot-label') : null;

    function syncHeaderUI() {
      const slot = getActiveSlot();
      if (wsBtn && slot) {
        wsBtn.textContent = `📁 ${slot.title} (${state.items.length})`;
        wsBtn.title = `Οι Εργασίες μου — Ενεργή: ${slot.title} (${state.items.length} αποθηκευμένες ασκήσεις)`;
      }
      if (notesSlotLabel && slot) {
        notesSlotLabel.textContent = `— ${slot.title}`;
      }
      if (notesBtn && slot) {
        const hasNotes = Boolean(slot.notes && slot.notes.trim());
        notesBtn.classList.toggle('has-notes', hasNotes);
        notesBtn.textContent = hasNotes ? '📝 Εκφώνηση ●' : '📝 Εκφώνηση';
      }
    }

    if (notesTextarea) {
      const curSlot = getActiveSlot();
      notesTextarea.value = (curSlot && curSlot.notes) || '';
      notesTextarea.addEventListener('input', () => {
        const slot = getActiveSlot();
        if (slot) {
          slot.notes = notesTextarea.value;
          slot.updatedAt = Date.now();
          persist();
          syncHeaderUI();
        }
      });
    }

    if (notesDrawer) {
      const closeN = notesDrawer.querySelector('#eap-notes-close-btn');
      const clearN = notesDrawer.querySelector('#eap-notes-clear-btn');
      if (closeN) {
        closeN.addEventListener('click', () => {
          notesDrawer.hidden = true;
          if (notesBtn) notesBtn.classList.remove('active');
        });
      }
      if (clearN && notesTextarea) {
        clearN.addEventListener('click', () => {
          notesTextarea.value = '';
          const slot = getActiveSlot();
          if (slot) {
            slot.notes = '';
            persist();
            syncHeaderUI();
          }
        });
      }
    }

    if (notesBtn && notesDrawer) {
      notesBtn.addEventListener('click', () => {
        notesDrawer.hidden = !notesDrawer.hidden;
        notesBtn.classList.toggle('active', !notesDrawer.hidden);
        if (!notesDrawer.hidden && notesTextarea) notesTextarea.focus();
      });
    }

    function activateSlot(slotId, silent) {
      saveActiveNow();
      const next = state.items.find((x) => x.id === slotId);
      if (!next) return;
      state.activeId = next.id;
      persist();
      setCode(next.code || '');
      setExtraState(next.extra || {});
      if (notesTextarea) notesTextarea.value = next.notes || '';
      syncHeaderUI();
      if (!silent) showToast(`Φορτώθηκε η εργασία «${next.title}»!`);
    }

    // Restore active slot extra state on boot if no shared hash is present
    if (!hasSharedHash()) {
      const bootSlot = getActiveSlot();
      if (bootSlot && bootSlot.extra && Object.keys(bootSlot.extra).length > 0) {
        setExtraState(bootSlot.extra);
      }
    }
    syncHeaderUI();

    function openWorkspacesModal() {
      saveActiveNow();
      const existing = document.getElementById('eap-workspaces-modal');
      if (existing) existing.remove();

      const modal = createModal({
        id: 'eap-workspaces-modal',
        title: '📁 Οι Εργασίες μου (Αποθηκευμένες Ασκήσεις)',
        bodyHTML: `
          <p style="margin-top:0; font-size:0.84rem; opacity:0.88;">
            Κάθε άσκηση αποθηκεύει αυτόματα τον κώδικα, την εκφώνηση/σημειώσεις και τη χειροκίνητη διάταξη των διαγραμμάτων σας στον browser.
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
            <button type="button" class="btn-run" id="ws-new-btn" style="text-transform:none; padding:5px 12px; font-size:0.8rem;">+ Νέα Άσκηση</button>
            <button type="button" class="tab-action-btn" id="ws-dup-btn">Διπλότυπο Τρέχουσας</button>
            <button type="button" class="tab-action-btn" id="ws-export-btn">⬇ Εξαγωγή Όλων (.json)</button>
            <button type="button" class="tab-action-btn" id="ws-import-btn">⬆ Εισαγωγή (.json)</button>
          </div>
          <div id="ws-items-list" class="eap-ws-list"></div>
        `
      });

      function renderList() {
        const listEl = modal.body.querySelector('#ws-items-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        state.items.forEach((item) => {
          const isAct = item.id === state.activeId;
          const dateStr = new Date(item.updatedAt || Date.now()).toLocaleString('el-GR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          });
          const linesCount = String(item.code || '').split('\n').length;
          const row = el('div', { class: `eap-ws-row${isAct ? ' active' : ''}` });
          row.innerHTML = `
            <div class="eap-ws-info">
              <div class="eap-ws-title-line">
                <strong>${escapeHTML(item.title)}</strong>
                ${isAct ? '<span class="eap-ws-active-pill">Ενεργή</span>' : ''}
                ${item.notes && item.notes.trim() ? '<span class="eap-ws-notes-pill" title="Περιέχει σημειώσεις εκφώνησης">📝 Εκφώνηση</span>' : ''}
              </div>
              <div class="eap-ws-meta">${linesCount} γραμμές &bull; Ενημερώθηκε: ${escapeHTML(dateStr)}</div>
            </div>
            <div class="eap-ws-actions">
              ${!isAct ? '<button type="button" class="btn-run ws-open-item" style="text-transform:none; padding:3px 9px; font-size:0.76rem;">Άνοιγμα</button>' : ''}
              <button type="button" class="tab-action-btn ws-rename-item" title="Μετονομασία">✎</button>
              ${state.items.length > 1 ? '<button type="button" class="tab-action-btn ws-del-item" title="Διαγραφή">&times;</button>' : ''}
            </div>
          `;
          const openB = row.querySelector('.ws-open-item');
          if (openB) {
            openB.addEventListener('click', () => {
              activateSlot(item.id, false);
              modal.close();
            });
          }
          row.querySelector('.ws-rename-item').addEventListener('click', () => {
            showPrompt('Νέο όνομα για την εργασία:', {
              title: 'Μετονομασία Εργασίας',
              defaultValue: item.title,
              onSubmit: (val) => {
                if (val && val.trim()) {
                  item.title = val.trim();
                  persist();
                  syncHeaderUI();
                  renderList();
                }
              }
            });
          });
          const delB = row.querySelector('.ws-del-item');
          if (delB) {
            delB.addEventListener('click', () => {
              showConfirm(`Οριστική διαγραφή της εργασίας «${item.title}»;`, {
                danger: true,
                yesText: 'Διαγραφή',
                onYes: () => {
                  state.items = state.items.filter((x) => x.id !== item.id);
                  if (state.activeId === item.id) {
                    const fallback = state.items[0];
                    state.activeId = fallback.id;
                    setCode(fallback.code || '');
                    setExtraState(fallback.extra || {});
                    if (notesTextarea) notesTextarea.value = fallback.notes || '';
                  }
                  persist();
                  syncHeaderUI();
                  renderList();
                }
              });
            });
          }
          listEl.appendChild(row);
        });
      }

      modal.body.querySelector('#ws-new-btn').addEventListener('click', () => {
        const nextNum = state.items.length + 1;
        showPrompt('Όνομα νέας άσκησης (π.χ. ΓΕ1 - Θέμα 3):', {
          title: 'Νέα Άσκηση',
          defaultValue: `Άσκηση ${nextNum}`,
          onSubmit: (name) => {
            if (!name || !name.trim()) return;
            saveActiveNow();
            const newId = makeId();
            state.items.push({
              id: newId,
              title: name.trim(),
              updatedAt: Date.now(),
              code: '',
              notes: '',
              extra: {}
            });
            state.activeId = newId;
            persist();
            setCode('');
            setExtraState({});
            if (notesTextarea) notesTextarea.value = '';
            syncHeaderUI();
            modal.close();
            showToast(`Δημιουργήθηκε η «${name.trim()}»!`);
          }
        });
      });

      modal.body.querySelector('#ws-dup-btn').addEventListener('click', () => {
        saveActiveNow();
        const cur = getActiveSlot();
        if (!cur) return;
        const newId = makeId();
        state.items.push({
          id: newId,
          title: `${cur.title} (Αντίγραφο)`,
          updatedAt: Date.now(),
          code: cur.code,
          notes: cur.notes || '',
          extra: JSON.parse(JSON.stringify(cur.extra || {}))
        });
        state.activeId = newId;
        persist();
        syncHeaderUI();
        renderList();
        showToast('Δημιουργήθηκε αντίγραφο της τρέχουσας άσκησης!');
      });

      modal.body.querySelector('#ws-export-btn').addEventListener('click', () => {
        saveActiveNow();
        const payload = JSON.stringify({ courseKey, exportedAt: new Date().toISOString(), items: state.items }, null, 2);
        saveTextAsFile(payload, `eap-ergasies-${courseKey}.json`, 'application/json;charset=utf-8');
        showToast('Εξήχθησαν όλες οι εργασίες σε αρχείο .json!');
      });

      modal.body.querySelector('#ws-import-btn').addEventListener('click', async () => {
        const file = await pickFile('.json');
        if (!file) return;
        try {
          const txt = await readTextFile(file);
          const parsed = JSON.parse(txt);
          if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
            showToast('Μη έγκυρο αρχείο εργασιών JSON.');
            return;
          }
          for (const imp of parsed.items) {
            state.items.push({
              id: makeId(),
              title: imp.title || 'Εισαγόμενη Άσκηση',
              updatedAt: imp.updatedAt || Date.now(),
              code: imp.code || '',
              notes: imp.notes || '',
              extra: imp.extra || {}
            });
          }
          persist();
          syncHeaderUI();
          renderList();
          showToast(`Εισήχθησαν ${parsed.items.length} εργασίες!`);
        } catch (e) {
          showToast('Σφάλμα κατά την ανάγνωση του αρχείου JSON.');
        }
      });

      renderList();
      modal.open();
    }

    if (wsBtn) {
      wsBtn.addEventListener('click', openWorkspacesModal);
    }

    return {
      onChange: saveDebounced,
      saveNow: saveActiveNow,
      getActiveSlot,
      openModal: openWorkspacesModal
    };
  }

  // ---------------------------------------------------------------------------
  // Mobile / Tablet Touch Symbol Bar (avoids Greek <-> English keyboard switching)
  // ---------------------------------------------------------------------------
  function attachTouchSymbolBar(cmEditor, customSymbols) {
    if (!cmEditor || typeof document === 'undefined') return null;
    const wrapper = cmEditor.getWrapperElement && cmEditor.getWrapperElement();
    const editorContainer = wrapper && wrapper.closest('.editor-container');
    if (!editorContainer) return null;

    const symbols = Array.isArray(customSymbols) && customSymbols.length > 0
      ? customSymbols
      : [':=', ';', ':', '(', ')', '[', ']', '..', '%', '<>', '<=', '>=', '=', ',', '.', '"'];

    const bar = el('div', {
      class: 'eap-touch-symbol-bar',
      role: 'toolbar',
      'aria-label': 'Γρήγορη εισαγωγή συμβόλων κώδικα'
    });

    const label = el('span', { class: 'eap-touch-sym-label', text: '⌨' });
    bar.appendChild(label);

    symbols.forEach((sym) => {
      const btn = el('button', {
        type: 'button',
        class: 'eap-touch-sym-btn',
        text: sym,
        title: `Εισαγωγή ${sym}`
      });
      btn.addEventListener('mousedown', (e) => {
        // Keep focus inside CodeMirror on touch/mouse click
        e.preventDefault();
      });
      btn.addEventListener('click', () => {
        const doc = cmEditor.getDoc();
        const cur = doc.getCursor();
        if (sym === '()') {
          doc.replaceRange('()', cur);
          doc.setCursor({ line: cur.line, ch: cur.ch + 1 });
        } else {
          doc.replaceRange(sym, cur);
        }
        cmEditor.focus();
      });
      bar.appendChild(btn);
    });

    const editorWrap = editorContainer.querySelector('.editor-wrapper');
    if (editorWrap && editorWrap.nextSibling) {
      editorContainer.insertBefore(bar, editorWrap.nextSibling);
    } else {
      editorContainer.appendChild(bar);
    }

    // Add a compact toggle chip inside the snippets bar so desktop users can also show/hide it
    const snippetsBar = editorContainer.querySelector('.editor-quick-snippets, .pli10-snippets-bar');
    const savedDesktopShow = SettingsManager.get('eapShowSymbolBar', 'false') === 'true';
    if (savedDesktopShow) bar.classList.add('force-visible');

    if (snippetsBar) {
      const toggleChip = el('button', {
        type: 'button',
        class: (snippetsBar.classList.contains('pli10-snippets-bar') ? 'pli10-snippet-chip' : 'snippet-chip') + (savedDesktopShow ? ' active' : ''),
        text: '⌨ Σύμβολα',
        title: 'Εμφάνιση/απόκρυψη μπάρας γρήγορων συμβόλων (:=  ;  [ ]  <>  %) χωρίς εναλλαγή Ελληνικού/Αγγλικού πληκτρολογίου'
      });
      toggleChip.style.marginLeft = 'auto';
      toggleChip.addEventListener('click', () => {
        const next = !bar.classList.contains('force-visible');
        bar.classList.toggle('force-visible', next);
        toggleChip.classList.toggle('active', next);
        SettingsManager.set('eapShowSymbolBar', next ? 'true' : 'false');
        cmEditor.refresh();
      });
      snippetsBar.appendChild(toggleChip);
    }

    return bar;
  }

  // ---------------------------------------------------------------------------
  // Offline PWA Service Worker Registration (safe no-op on file://)
  // ---------------------------------------------------------------------------
  function registerOfflineServiceWorker() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const proto = window.location && window.location.protocol;
    if (proto !== 'https:' && proto !== 'http:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* ignore in restricted contexts */ });
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  const EAPCommon = {
    SettingsManager,
    escapeHTML,
    debounce,
    el,
    showToast,
    copyTextToClipboard,
    copyHtmlTableToClipboard,
    initTheme,
    getTheme,
    applyTheme,
    wireThemeToggle,
    wireCourseSubmenu,
    updateThemeLinks,
    hasSharedHash,
    loadCodeFromHash,
    loadCodeFromHashAsync,
    encodeSharePayload,
    decodeSharePayload,
    buildShareURL,
    buildShareURLAsync,
    shareCode,
    showShareModal,
    saveTextAsFile,
    readTextFile,
    pickFile,
    decodeWindows1253,
    createModal,
    showConfirm,
    showPrompt,
    switchTabs,
    wireTabs,
    populateExampleSelector,
    createAutosave,
    createWorkspaceManager,
    attachTouchSymbolBar,
    registerOfflineServiceWorker
  };

  global.EAPCommon = EAPCommon;

  // Auto-init theme as early as possible to prevent FOUC (safe to call again).
  if (typeof document !== 'undefined' && document.documentElement) {
    initTheme();
    registerOfflineServiceWorker();
  }
})(typeof window !== 'undefined' ? window : globalThis);
