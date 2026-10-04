/**
 * tapScript.js
 * ------------------------------------------------------------------
 * Generator "Script Auto-Tap" — JavaScript mandiri yang dijalankan DI
 * DALAM halaman TikTok (DevTools Console di laptop, atau userscript).
 *
 * Kenapa begini? Halaman kita dan halaman TikTok adalah dua origin
 * berbeda; browser SELALU memblokir event tap sintetis menembus iframe
 * cross-origin. Satu-satunya cara auto-tap web yang benar-benar sampai
 * ke TikTok adalah script yang berjalan di halaman TikTok itu sendiri
 * (same-origin). CSP TikTok memblokir bookmarklet, tetapi Console
 * DevTools tetap bisa mengeksekusi kode yang di-paste.
 *
 * Script hasil generate sudah mencakup:
 *  - pencarian tombol like multi-selector (data-e2e + fallback atribut)
 *  - ritme natural (delay acak, humanize, micro-pause) mengikuti setelan
 *  - panel HUD kecil: jumlah tap, pace/menit, tombol Jeda & Stop
 *  - pencarian ulang otomatis saat DOM TikTok re-render
 *  - pengaman anti dobel-jalan (window.__TATW__)
 */

/** Normalisasi & pembatas nilai setelan agar script aman dijalankan. */
function sanitizeSettings(settings) {
  const int = (value, lo, hi, fallback) => {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(hi, Math.max(lo, n));
  };

  return {
    minDelayMs: int(settings?.minDelayMs, 30, 5000, 120),
    maxDelayMs: int(settings?.maxDelayMs, 30, 5000, 260),
    humanize: settings?.humanize !== false,
    microPauseEnabled: settings?.microPauseEnabled !== false,
    microPauseEvery: int(settings?.microPauseEvery, 2, 500, 25),
    microPauseMinMs: int(settings?.microPauseMinMs, 100, 15000, 900),
    microPauseMaxMs: int(settings?.microPauseMaxMs, 100, 15000, 2600),
  };
}

function sanitizeLabel(label, handle) {
  const raw = String(label || (handle ? `@${handle}` : '') || 'TikTok').trim();
  return raw.slice(0, 80) || 'TikTok';
}

/**
 * Bangun script auto-tap lengkap siap tempel di Console halaman TikTok.
 *
 * @param {{settings?: object, handle?: string|null, label?: string}} options
 * @returns {string} kode JavaScript mandiri
 */
export function buildTapScript({ settings, handle, label } = {}) {
  const cfg = sanitizeSettings(settings);
  const labelText = sanitizeLabel(label, handle);

  return `(function () {
  'use strict';

  // ================================================================
  //  TikTok Auto-Tap Script (dibuat oleh TikTok Auto-Tap Web)
  //  Cara pakai: paste di Console halaman tiktok.com, lalu Enter.
  //  Klik "Jeda" / "Stop" pada panel kecil di kiri-bawah halaman.
  // ================================================================

  var CFG = ${JSON.stringify(cfg)};
  var LABEL = ${JSON.stringify(labelText)};
  var HUD_ID = 'tatw-autotap-hud';

  // Pengaman: hentikan instance lama bila script dijalankan dua kali.
  if (window.__TATW__ && typeof window.__TATW__.stop === 'function') {
    try { window.__TATW__.stop(); } catch (e) {}
  }

  if (!/(^|\\.)tiktok\\.com$/i.test(location.hostname)) {
    window.alert('Script Auto-Tap harus dijalankan di halaman TikTok (tiktok.com).');
    return;
  }

  var SELECTORS = [
    '[data-e2e="like-btn"]',
    '[data-e2e="like-button"]',
    '[data-e2e="like-icon"]',
    '[data-e2e="browse-like-icon"]',
    '[data-e2e="live-like"]',
    'button[aria-label*="like" i]',
    'button[aria-label*="suka" i]'
  ];

  var state = {
    running: true,
    paused: false,
    taps: 0,
    misses: 0,
    tapsSincePause: 0,
    startedAt: Date.now(),
    el: null,
    timer: null,
    ticker: null,
    status: 'Mencari tombol like...'
  };
  var hudRefs = null;

  function fmt(n) {
    return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function clickableFor(el) {
    if (!el) return null;
    var selfOrAncestor = el.closest ? el.closest('button') : null;
    if (selfOrAncestor) return selfOrAncestor;
    var inner = el.querySelector ? el.querySelector('button') : null;
    if (inner) return inner;
    return el;
  }

  function findButton() {
    var i, j, el, nodes;
    for (i = 0; i < SELECTORS.length; i++) {
      nodes = document.querySelectorAll(SELECTORS[i]);
      for (j = 0; j < nodes.length; j++) {
        el = clickableFor(nodes[j]);
        if (isVisible(el)) return el;
      }
    }
    // Fallback: elemen apa pun yang atribut data-e2e-nya mengandung "like".
    nodes = document.querySelectorAll('[data-e2e]');
    for (j = 0; j < nodes.length; j++) {
      var key = nodes[j].getAttribute('data-e2e') || '';
      if (/like|heart/i.test(key)) {
        el = clickableFor(nodes[j]);
        if (isVisible(el)) return el;
      }
    }
    return null;
  }

  function ensureButton() {
    if (state.el && state.el.isConnected && isVisible(state.el)) return state.el;
    state.el = findButton();
    return state.el;
  }

  function fire(el, Ctor, type, init) {
    if (typeof Ctor !== 'function') return false;
    try {
      el.dispatchEvent(new Ctor(type, init));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Satu ketukan = urutan event seperti klik tikus sungguhan.
  function tapOnce(el) {
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;

    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: cx,
      clientY: cy,
      screenX: cx,
      screenY: cy,
      button: 0,
      detail: 1
    };
    var down = Object.assign({}, base, { buttons: 1 });
    var up = Object.assign({}, base, { buttons: 0 });
    var pDown = Object.assign({}, down, {
      pointerId: 1, pointerType: 'mouse', isPrimary: true,
      width: 1, height: 1, pressure: 0.5
    });
    var pUp = Object.assign({}, pDown, { buttons: 0, pressure: 0 });

    var fired = 0;
    if (fire(el, window.PointerEvent, 'pointerdown', pDown)) fired++;
    if (fire(el, window.MouseEvent, 'mousedown', down)) fired++;
    if (fire(el, window.PointerEvent, 'pointerup', pUp)) fired++;
    if (fire(el, window.MouseEvent, 'mouseup', up)) fired++;
    if (fire(el, window.MouseEvent, 'click', up)) fired++;

    // Cadangan terakhir bila seluruh dispatch gagal.
    if (fired === 0) {
      try { el.click(); fired++; } catch (e) {}
    }
    return fired > 0;
  }

  function describe(el) {
    if (!el) return 'elemen';
    var e2e = el.getAttribute ? el.getAttribute('data-e2e') : null;
    if (e2e) return '[data-e2e="' + e2e + '"]';
    return el.tagName ? el.tagName.toLowerCase() : 'elemen';
  }

  // Delay natural: interval acak min-max + humanize (0.88x-1.18x + jeda ragu).
  // Sengaja diduplikasi di sini karena script harus mandiri (tanpa import).
  function computeDelay() {
    var lo = Math.min(CFG.minDelayMs, CFG.maxDelayMs);
    var hi = Math.max(CFG.minDelayMs, CFG.maxDelayMs);
    var delay = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (CFG.humanize) {
      delay = Math.round(delay * (0.88 + Math.random() * 0.3));
      if (Math.random() < 0.06) delay += 90 + Math.floor(Math.random() * 331);
    }
    return delay;
  }

  // ---- panel kecil (HUD) di kiri-bawah halaman ----
  function buildHud() {
    var old = document.getElementById(HUD_ID);
    if (old) old.remove();

    var hud = document.createElement('div');
    hud.id = HUD_ID;
    hud.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;min-width:216px;background:rgba(7,7,11,.95);color:#e9e9ef;border:1px solid rgba(37,244,238,.5);border-radius:12px;padding:10px 12px;font:12px/1.45 ui-sans-serif,system-ui,-apple-system,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.55);';
    hud.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;font-weight:700;">' +
        '<span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:#25f4ee;"></span>' +
        'Auto-Tap aktif' +
      '</div>' +
      '<div style="opacity:.75;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Target: ' + escapeHtml(LABEL) + '</div>' +
      '<div style="margin-top:6px;font-variant-numeric:tabular-nums;"><b id="' + HUD_ID + '-taps">0</b> tap &middot; <span id="' + HUD_ID + '-pace">-</span>/menit</div>' +
      '<div id="' + HUD_ID + '-status" style="margin-top:2px;opacity:.8;"></div>' +
      '<div style="display:flex;gap:6px;margin-top:8px;">' +
        '<button id="' + HUD_ID + '-pause" style="flex:1;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:transparent;color:#e9e9ef;border-radius:8px;padding:4px 8px;font:inherit;">Jeda</button>' +
        '<button id="' + HUD_ID + '-stop" style="flex:1;cursor:pointer;border:1px solid rgba(254,44,85,.6);background:rgba(254,44,85,.15);color:#fe2c55;border-radius:8px;padding:4px 8px;font:inherit;">Stop</button>' +
      '</div>';

    document.body.appendChild(hud);

    hudRefs = {
      taps: document.getElementById(HUD_ID + '-taps'),
      pace: document.getElementById(HUD_ID + '-pace'),
      status: document.getElementById(HUD_ID + '-status'),
      pause: document.getElementById(HUD_ID + '-pause'),
      stop: document.getElementById(HUD_ID + '-stop')
    };
    hudRefs.pause.addEventListener('click', function () {
      if (state.paused) resume(); else pause();
    });
    hudRefs.stop.addEventListener('click', function () { stop(true); });

    updateHud();
  }

  function updateHud() {
    if (!hudRefs) return;
    var elapsedMin = (Date.now() - state.startedAt) / 60000;
    var pace = elapsedMin > 0.05 && state.taps > 0 ? Math.round(state.taps / elapsedMin) : 0;
    hudRefs.taps.textContent = fmt(state.taps);
    hudRefs.pace.textContent = pace > 0 ? fmt(pace) : '-';
    hudRefs.status.textContent =
      state.status + (document.hidden ? ' (tab background - ritme melambat)' : '');
  }

  function schedule(delay) {
    state.timer = window.setTimeout(onTick, delay);
  }

  function onTick() {
    if (!state.running || state.paused) return;

    var el = ensureButton();
    if (!el) {
      state.misses += 1;
      if (state.misses >= 3) {
        state.status = 'Tombol like tidak ditemukan. Pastikan halaman LIVE sudah terbuka dan kamu sudah login.';
      }
      updateHud();
      schedule(900);
      return;
    }

    if (tapOnce(el)) {
      state.taps += 1;
      state.misses = 0;
      state.status = 'OK - tap ke ' + describe(el);
    } else {
      state.status = 'Tombol tidak merespons, mencari ulang...';
      state.el = null;
    }

    var next = computeDelay();
    if (CFG.microPauseEnabled) {
      state.tapsSincePause += 1;
      if (state.tapsSincePause >= CFG.microPauseEvery) {
        var lo = Math.min(CFG.microPauseMinMs, CFG.microPauseMaxMs);
        var hi = Math.max(CFG.microPauseMinMs, CFG.microPauseMaxMs);
        next += lo + Math.floor(Math.random() * (hi - lo + 1));
        state.tapsSincePause = 0;
        state.status = 'Micro-pause...';
      }
    }

    updateHud();
    schedule(next);
  }

  function pause() {
    if (!state.running) return;
    state.paused = true;
    if (state.timer) { window.clearTimeout(state.timer); state.timer = null; }
    state.status = 'Dijeda. Klik "Lanjut" untuk melanjutkan.';
    if (hudRefs) hudRefs.pause.textContent = 'Lanjut';
    updateHud();
  }

  function resume() {
    if (!state.running || !state.paused) return;
    state.paused = false;
    state.status = 'Berjalan...';
    if (hudRefs) hudRefs.pause.textContent = 'Jeda';
    updateHud();
    schedule(computeDelay());
  }

  function stop(announce) {
    state.running = false;
    state.paused = false;
    if (state.timer) { window.clearTimeout(state.timer); state.timer = null; }
    if (state.ticker) { window.clearInterval(state.ticker); state.ticker = null; }
    var hud = document.getElementById(HUD_ID);
    if (hud) hud.remove();
    hudRefs = null;
    try { delete window.__TATW__; } catch (e) { window.__TATW__ = undefined; }
    if (announce) {
      console.log('[Auto-Tap] Dihentikan. Total tap sesi ini: ' + fmt(state.taps));
    }
  }

  window.__TATW__ = {
    stop: function () { stop(true); },
    pause: pause,
    resume: resume,
    stats: function () {
      return {
        taps: state.taps,
        running: state.running,
        paused: state.paused,
        elapsedMs: Date.now() - state.startedAt
      };
    }
  };

  buildHud();
  state.status = 'Berjalan - mencari ketukan pertama...';
  state.ticker = window.setInterval(updateHud, 1000);
  console.log('[Auto-Tap] Aktif untuk ' + LABEL + '. Panel kontrol di kiri-bawah halaman (tombol Jeda / Stop).');
  schedule(400);
})();
`;
}
