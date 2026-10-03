import { useCallback, useEffect, useState } from 'react';

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  const displayMode =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  return Boolean(displayMode || window.navigator.standalone === true);
}

/**
 * Mengelola prompt install PWA:
 *  - Android/Chrome : menangkap event `beforeinstallprompt` -> tombol prompt interaktif
 *  - iOS Safari     : tidak ada prompt API -> tampilkan panduan Share > Add to Home Screen
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [installed, setInstalled] = useState(detectStandalone);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;
    const onDisplayChange = (event) => {
      if (event.matches) setInstalled(true);
    };
    media?.addEventListener?.('change', onDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      media?.removeEventListener?.('change', onDisplayChange);
    };
  }, []);

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS =
    /iphone|ipad|ipod/i.test(userAgent) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(userAgent);

  const canPrompt = Boolean(deferredEvent);
  const canInstall = !installed && (canPrompt || isIOS);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return 'unavailable';
    try {
      deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      setDeferredEvent(null);
      return choice?.outcome ?? 'dismissed';
    } catch {
      setDeferredEvent(null);
      return 'error';
    }
  }, [deferredEvent]);

  return { canInstall, canPrompt, installed, isIOS, isAndroid, promptInstall };
}
