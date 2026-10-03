import { useEffect, useState } from 'react';
import { APP_NAME, APP_TAGLINE } from '../config/defaults.js';
import { Chip } from './ui.jsx';

function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

function BullseyeLogo() {
  return (
    <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" role="img" aria-label="Logo">
      <rect width="64" height="64" rx="15" fill="#12121b" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="#25f4ee" strokeWidth="6" />
      <circle cx="32" cy="32" r="10" fill="none" stroke="#fe2c55" strokeWidth="6" />
      <circle cx="32" cy="32" r="3.4" fill="#ffffff" />
    </svg>
  );
}

export function AppHeader({ install, onInstallClick }) {
  const online = useOnlineStatus();
  const showInstall = install.canInstall && !install.installed;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <BullseyeLogo />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-ink-100">{APP_NAME}</h1>
          <p className="truncate text-[11px] text-ink-400">{APP_TAGLINE}</p>
        </div>

        <Chip tone={online ? 'green' : 'amber'}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-400'}`}
            aria-hidden="true"
          />
          {online ? 'Online' : 'Offline'}
        </Chip>

        {showInstall && (
          <button
            type="button"
            onClick={onInstallClick}
            className="rounded-full bg-gradient-to-r from-tik-cyan to-tik-pink px-3.5 py-1.5 text-xs font-bold text-ink-950 shadow-md transition-transform active:scale-95"
          >
            {install.canPrompt ? 'Install App' : 'Cara Install'}
          </button>
        )}
      </div>
    </header>
  );
}
