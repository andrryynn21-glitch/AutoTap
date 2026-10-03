import { useEffect, useState } from 'react';

/**
 * Screen Wake Lock API — menjaga layar tetap menyala saat auto-tap berjalan
 * (penting untuk sesi live yang panjang). Aman bila tidak didukung.
 */
export function useWakeLock(active) {
  const [supported, setSupported] = useState(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  );

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);
    if (!('wakeLock' in navigator)) return undefined;

    let sentinel = null;
    let disposed = false;

    const request = async () => {
      try {
        if (disposed || !active) return;
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        /* baterai lemah / izin ditolak — abaikan */
      }
    };

    const release = async () => {
      try {
        await sentinel?.release();
      } catch {
        /* abaikan */
      }
      sentinel = null;
    };

    if (active) {
      request();
    } else {
      release();
    }

    const onVisibility = () => {
      if (active && document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [active]);

  return supported;
}
