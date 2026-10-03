/**
 * tapSimulator.js
 * ------------------------------------------------------------------
 * Mensimulasikan satu ketukan presisi memakai DOM Event asli:
 *   PointerEvent -> TouchEvent -> MouseEvent -> click
 *
 * `performTap` juga otomatis mencari elemen yang benar-benar berada di
 * koordinat tap (mis. tombol/area "like" di dalam stage) dan melaporkan
 * apakah ketukan berhasil "masuk" (delivered) atau terhalang iframe
 * cross-origin (TikTok embed).
 */
import { clamp, randFloat, randomJitter } from './random.js';

let touchSupportCache = null;

/** Cek sekali apakah browser mendukung `new Touch(...)` (Chrome/Android). */
export function supportsTouchConstructor() {
  if (touchSupportCache !== null) return touchSupportCache;
  try {
    touchSupportCache =
      typeof window !== 'undefined' &&
      typeof TouchEvent !== 'undefined' &&
      typeof Touch !== 'undefined' &&
      Boolean(new Touch({ identifier: 1, target: document.body, clientX: 0, clientY: 0 }));
  } catch {
    touchSupportCache = false;
  }
  return touchSupportCache;
}

function baseOptions(clientX, clientY) {
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    detail: 1,
    button: 0,
    buttons: 1,
    clientX,
    clientY,
    screenX: clientX + (window.screenX || 0),
    screenY: clientY + (window.screenY || 0),
  };
}

function makeTouchList(target, clientX, clientY) {
  return [
    new Touch({
      identifier: Math.floor(randFloat(2, 100000)),
      target,
      clientX,
      clientY,
      pageX: clientX + window.scrollX,
      pageY: clientY + window.scrollY,
      screenX: clientX + (window.screenX || 0),
      screenY: clientY + (window.screenY || 0),
      radiusX: randFloat(8, 15),
      radiusY: randFloat(8, 15),
      rotationAngle: 0,
      force: randFloat(0.35, 0.9),
    }),
  ];
}

/**
 * Kirim urutan event ketukan lengkap ke satu elemen.
 * @returns {string[]} daftar event yang berhasil dikirim
 */
export function dispatchTapSequence(target, { clientX, clientY, mode = 'both' }) {
  if (!target) return [];

  const usePointer = mode === 'both' || mode === 'pointer';
  const useTouch = (mode === 'both' || mode === 'touch') && supportsTouchConstructor();
  const useMouse = mode === 'both' || mode === 'pointer' || mode === 'mouse';

  const down = baseOptions(clientX, clientY);
  const pointerDown = {
    ...down,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    width: 12,
    height: 12,
    pressure: randFloat(0.3, 0.8),
  };
  const pointerUp = { ...pointerDown, buttons: 0, pressure: 0 };
  const mouseUp = { ...down, buttons: 0 };

  const fired = [];
  const fire = (type, Ctor, options) => {
    try {
      if (typeof Ctor === 'undefined') return;
      target.dispatchEvent(new Ctor(type, options));
      fired.push(type);
    } catch {
      /* event family ini tidak didukung browser — lanjut ke berikutnya */
    }
  };

  const makeTouchInit = () => {
    try {
      const touches = makeTouchList(target, clientX, clientY);
      return { touches, targetTouches: touches, changedTouches: touches };
    } catch {
      return null;
    }
  };

  // ---- fase turun ----
  if (usePointer) fire('pointerdown', PointerEvent, pointerDown);
  if (useTouch) {
    const init = makeTouchInit();
    if (init) fire('touchstart', TouchEvent, { ...down, ...init });
  }
  if (useMouse) fire('mousedown', MouseEvent, down);

  // ---- fase naik + click ----
  if (usePointer) fire('pointerup', PointerEvent, pointerUp);
  if (useTouch) {
    const init = makeTouchInit();
    if (init) {
      fire('touchend', TouchEvent, {
        ...down,
        touches: [],
        targetTouches: [],
        changedTouches: init.changedTouches,
      });
    }
  }
  if (useMouse) fire('mouseup', MouseEvent, mouseUp);
  fire('click', MouseEvent, mouseUp);

  return fired;
}

/**
 * Cari elemen asli pada titik clientX/clientY.
 * Jika yang ditemukan adalah IFRAME (embed TikTok):
 *  - same-origin  -> telusuri ke dalam dokumen iframe
 *  - cross-origin -> laporkan `crossOrigin: true` (browser memblokir event masuk)
 */
export function resolveTapTarget(container, clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY) || container;

  if (element && element.tagName === 'IFRAME') {
    try {
      const doc = element.contentDocument;
      if (doc) {
        const rect = element.getBoundingClientRect();
        const inner = doc.elementFromPoint(clientX - rect.left, clientY - rect.top);
        if (inner) return { element: inner, crossOrigin: false, insideFrame: true };
      }
    } catch {
      /* SecurityError = cross-origin (kasus normal untuk embed TikTok) */
    }
    return { element, crossOrigin: true, insideFrame: true };
  }

  return { element, crossOrigin: false, insideFrame: false };
}

function describeElement(element) {
  if (!element) return 'unknown';
  const tag = element.tagName ? element.tagName.toLowerCase() : 'unknown';
  if (element.id) return `${tag}#${element.id}`;
  if (typeof element.className === 'string' && element.className.trim()) {
    const first = element.className.trim().split(/\s+/)[0];
    if (first) return `${tag}.${first}`;
  }
  return tag;
}

/**
 * Eksekusi satu ketukan pada koordinat (x, y) relatif terhadap `container`,
 * lengkap dengan jitter acak + clamping ke dalam area.
 *
 * @returns {object|null} laporan lengkap ketukan untuk dashboard
 */
export function performTap({ container, x, y, jitterPx = 0, mode = 'both' }) {
  if (!container) return null;

  const rect = container.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const { dx, dy } = randomJitter(jitterPx);
  const localX = clamp(x + dx, 1, rect.width - 1);
  const localY = clamp(y + dy, 1, rect.height - 1);
  const clientX = rect.left + localX;
  const clientY = rect.top + localY;

  // Sembunyikan handle target overlay sesaat (sinkron, tanpa flicker) supaya
  // elementFromPoint menemukan elemen ASLI di bawahnya — handle hanya untuk drag.
  const handle = container.querySelector?.('[data-tap-handle]');
  const previousPointerEvents = handle ? handle.style.pointerEvents : null;
  if (handle) handle.style.pointerEvents = 'none';

  let resolvedTarget;
  try {
    resolvedTarget = resolveTapTarget(container, clientX, clientY);
  } finally {
    if (handle) handle.style.pointerEvents = previousPointerEvents || '';
  }

  const { element, crossOrigin, insideFrame } = resolvedTarget;
  const events = dispatchTapSequence(element, { clientX, clientY, mode });

  return {
    x: localX,
    y: localY,
    clientX,
    clientY,
    delivered: !crossOrigin,
    crossOrigin,
    insideFrame,
    targetLabel: describeElement(element),
    events,
    at: Date.now(),
  };
}

