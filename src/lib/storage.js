/**
 * Wrapper aman untuk localStorage (private mode / storage penuh tidak
 * boleh membuat aplikasi crash).
 */

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* diamkan: storage bisa penuh atau diblokir */
  }
}
