import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage.js';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * useState yang persisten ke localStorage.
 * `merge: true` berguna untuk objek pengaturan supaya key baru dari
 * versi berikutnya otomatis memakai nilai default.
 */
export function useLocalStorage(key, initialValue, { merge = false } = {}) {
  const [value, setValue] = useState(() => {
    const stored = loadJSON(key, undefined);
    if (stored === undefined) return initialValue;
    if (merge && isPlainObject(initialValue) && isPlainObject(stored)) {
      return { ...initialValue, ...stored };
    }
    return stored;
  });

  useEffect(() => {
    saveJSON(key, value);
  }, [key, value]);

  return [value, setValue];
}
