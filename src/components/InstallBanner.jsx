import { useState } from 'react';
import { Chip } from './ui.jsx';

function Step({ n, children }) {
  return (
    <li className="flex gap-2">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-700 text-[11px] font-bold text-ink-200">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

/**
 * Banner "Install App / Tambahkan ke Layar Utama".
 * - Android/Chrome: tombol memanggil prompt install native (beforeinstallprompt).
 * - iOS Safari   : tidak ada prompt API -> panduan Share > Add to Home Screen.
 */
export function InstallBanner({ install, dismissed, onDismiss }) {
  const { canInstall, canPrompt, isIOS, isAndroid, promptInstall } = install;
  const [guideOpen, setGuideOpen] = useState(false);
  const [outcome, setOutcome] = useState(null);

  if (!canInstall || dismissed) return null;

  const handleInstall = async () => {
    const result = await promptInstall();
    setOutcome(result);
    if (result === 'unavailable') setGuideOpen(true);
  };

  return (
    <section
      id="install-banner"
      className="relative overflow-hidden rounded-2xl border border-tik-cyan/30 bg-gradient-to-br from-ink-900 via-ink-850 to-ink-900 p-4 shadow-lg shadow-black/40"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-tik-cyan/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-tik-pink/10 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-ink-100">Install ke Layar Utama</h2>
            {isIOS && <Chip tone="cyan">iPhone / iPad</Chip>}
            {isAndroid && <Chip tone="green">Android</Chip>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">
            Jalankan TikTok Auto-Tap sebagai aplikasi standalone (tanpa address bar), bisa
            dibuka offline setelah terpasang, dan tetap mendapat tombol kontrol yang besar.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canPrompt ? (
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-full bg-gradient-to-r from-tik-cyan to-tik-pink px-4 py-2 text-xs font-bold text-ink-950 shadow-md transition-transform active:scale-95"
              >
                Install App
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setGuideOpen((open) => !open)}
                className="rounded-full bg-gradient-to-r from-tik-cyan to-tik-pink px-4 py-2 text-xs font-bold text-ink-950 shadow-md transition-transform active:scale-95"
              >
                Lihat Cara Install
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-ink-600 px-3.5 py-2 text-xs font-medium text-ink-300 transition-colors hover:border-ink-500"
            >
              Nanti saja
            </button>
          </div>

          {outcome === 'accepted' && (
            <p className="mt-2 text-[11px] text-emerald-400">
              Mantap! Aplikasi dipasang — buka dari icon di layar utama.
            </p>
          )}
          {outcome === 'dismissed' && (
            <p className="mt-2 text-[11px] text-amber-400">
              Instalasi dibatalkan. Kamu bisa coba lagi lewat panduan di bawah.
            </p>
          )}
        </div>

        <button
          type="button"
          aria-label="Tutup banner install"
          onClick={onDismiss}
          className="rounded-full p-1 text-ink-500 transition-colors hover:text-ink-200"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {guideOpen && (
        <div className="relative mt-4 grid gap-4 rounded-xl border border-ink-700 bg-ink-950/70 p-3 text-xs text-ink-300 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-bold text-ink-100">Android (Chrome)</p>
            <ol className="space-y-1.5">
              <Step n={1}>Buka menu titik-tiga di kanan atas browser.</Step>
              <Step n={2}>
                Pilih <b>Add to Home screen</b> / <b>Tambahkan ke layar utama</b>.
              </Step>
              <Step n={3}>Konfirmasi <b>Install</b>, lalu buka dari icon Auto-Tap.</Step>
            </ol>
          </div>
          <div>
            <p className="mb-2 font-bold text-ink-100">iOS (Safari)</p>
            <ol className="space-y-1.5">
              <Step n={1}>
                Tap ikon <b>Share</b> (kotak dengan panah ke atas) di bawah Safari.
              </Step>
              <Step n={2}>
                Scroll dan pilih <b>Add to Home Screen</b>.
              </Step>
              <Step n={3}>
                Tap <b>Add</b> — aplikasi muncul sebagai icon standalone.
              </Step>
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
