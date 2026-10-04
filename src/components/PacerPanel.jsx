import { Chip, SectionCard } from './ui.jsx';
import { formatDuration, formatNumber } from '../lib/format.js';

function PrefChipButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'border-tik-cyan/50 bg-tik-cyan/10 text-tik-cyan'
          : 'border-ink-600 text-ink-400 hover:border-ink-500 hover:text-ink-200'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * PacerPanel — pemandu irama ketukan untuk dipakai BERSAMA aplikasi
 * TikTok di HP (split-screen).
 *
 * Kenapa begini? Browser tidak mengizinkan event tap sintetis masuk ke
 * aplikasi/iframe lain (keamanan cross-origin). Jadi pendekatan yang
 * benar-benar bekerja di HP: aplikasi memandu irama (bunyi + getar +
 * visual), pengguna menekan tombol ❤️ di aplikasi TikTok mengikuti irama.
 * Ritmenya identik dengan setelan "Kecepatan & Anti-Deteksi".
 */
export function PacerPanel({ pacer, settings, prefs, onPrefsChange }) {
  const intervalLabel =
    settings.minDelayMs === settings.maxDelayMs
      ? `${settings.minDelayMs} ms (fix)`
      : `${settings.minDelayMs}–${settings.maxDelayMs} ms`;

  const togglePref = (patch) => onPrefsChange({ ...prefs, ...patch });

  return (
    <SectionCard
      title="Pacer Irama — Pemandu Tap di HP"
      subtitle="Bunyi + getar menandai waktu tap. Pakai berdampingan dengan aplikasi TikTok (split-screen)."
    >
      <ol className="space-y-1.5 text-[11px] leading-relaxed text-ink-300">
        <li>
          <b>1.</b> Di HP: buka aplikasi TikTok pada halaman LIVE, lalu aktifkan
          split-screen (Android: tekan lama tombol Recent → pilih split) — TikTok di
          bawah, browser ini di atas.
        </li>
        <li>
          <b>2.</b> Tekan <b>MULAI PACER</b>. Setiap bunyi/getar = waktunya menekan
          tombol ❤️ di TikTok.
        </li>
        <li>
          <b>3.</b> Perkecil jendela browser (bilah tipis di atas layar) supaya TikTok
          tetap lebar — bilah irama tetap menempel di bawah header.
        </li>
      </ol>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {pacer.running && (
            <span
              key={pacer.beatCount}
              className="pacer-beat absolute h-40 w-40 rounded-full border-2 border-tik-cyan"
              aria-hidden="true"
            />
          )}
          <div className="flex h-36 w-36 flex-col items-center justify-center gap-0.5 rounded-full border border-ink-600 bg-ink-950/80 shadow-lg shadow-black/40">
            <span className="text-3xl font-extrabold tabular-nums text-tik-cyan">
              {formatNumber(pacer.beatCount)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ink-400">
              ketukan irama
            </span>
            <span className="text-[10px] tabular-nums text-ink-500">
              {formatDuration(pacer.elapsedMs)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={pacer.toggle}
          aria-pressed={pacer.running}
          className={`w-full max-w-xs rounded-2xl px-4 py-3.5 text-sm font-extrabold tracking-wide shadow-lg transition-all active:scale-[0.98] ${
            pacer.running
              ? 'bg-tik-pink text-white shadow-tik-pink/30'
              : 'bg-gradient-to-r from-tik-cyan to-tik-pink text-ink-950 shadow-tik-cyan/20'
          }`}
        >
          {pacer.running ? '■ HENTIKAN PACER' : '▶ MULAI PACER'}
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <PrefChipButton
            active={prefs.soundOn}
            onClick={() => togglePref({ soundOn: !prefs.soundOn })}
          >
            🔊 Suara {prefs.soundOn ? 'on' : 'off'}
          </PrefChipButton>
          <PrefChipButton
            active={prefs.vibrationOn}
            onClick={() => togglePref({ vibrationOn: !prefs.vibrationOn })}
          >
            📳 Getar {prefs.vibrationOn ? 'on' : 'off'}
          </PrefChipButton>
          <button
            type="button"
            onClick={pacer.reset}
            className="rounded-full border border-ink-600 px-3 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:border-ink-500 hover:text-ink-200"
          >
            Reset hitungan
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-center text-[11px] text-ink-500">
          Bonus: area latihan — hitung tap manualmu sendiri:
        </p>
        <button
          type="button"
          onClick={pacer.tapManual}
          className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-tik-pink/50 bg-tik-pink/10 py-5 transition-transform active:scale-[0.98]"
        >
          <span className="text-2xl" aria-hidden="true">
            ❤️
          </span>
          <span className="text-sm font-bold text-ink-100">
            TAP DI SINI — {formatNumber(pacer.manualCount)} tap
          </span>
          <span className="text-[10px] text-ink-500">
            Setiap tap dihitung + getaran singkat sebagai latihan ritme.
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <Chip tone="neutral">Interval {intervalLabel}</Chip>
        <Chip tone={settings.microPauseEnabled ? 'pink' : 'neutral'}>
          {settings.microPauseEnabled
            ? `Micro-pause tiap ${settings.microPauseEvery} ketukan`
            : 'Micro-pause off'}
        </Chip>
        <Chip tone="amber">iOS Safari tidak mendukung getaran — andalkan suara.</Chip>
      </div>
    </SectionCard>
  );
}
