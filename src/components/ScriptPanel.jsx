import { useMemo, useState } from 'react';
import { Chip, SectionCard } from './ui.jsx';
import { buildTapScript } from '../lib/tapScript.js';
import { copyText } from '../lib/clipboard.js';

function StepNumber({ n }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-700 text-[11px] font-bold text-ink-200">
      {n}
    </span>
  );
}

/**
 * ScriptPanel — solusi auto-tap yang BENAR-BENAR bekerja di laptop.
 *
 * Browser memblokir event sintetis menembus iframe cross-origin, jadi
 * aplikasi ini tidak bisa "menekan" tombol di dalam embed TikTok.
 * Solusinya: script yang di-paste ke Console DevTools pada halaman
 * TikTok itu sendiri (same-origin) — di sana event pasti diterima,
 * dengan ritme natural mengikuti setelan Kecepatan & Anti-Deteksi.
 */
export function ScriptPanel({ settings, resolved }) {
  const [copied, setCopied] = useState(null);

  const liveUrl =
    resolved?.livePageUrl ||
    (resolved?.handle ? `https://www.tiktok.com/@${resolved.handle}/live` : null);

  const script = useMemo(
    () =>
      buildTapScript({
        settings,
        handle: resolved?.handle || null,
        label: resolved?.label || '',
      }),
    [settings, resolved?.handle, resolved?.label],
  );

  const handleCopy = async (text, which) => {
    const ok = await copyText(text);
    setCopied(ok ? which : 'failed');
    window.setTimeout(() => setCopied(null), 2200);
  };

  return (
    <SectionCard
      title="Script Auto-Tap — untuk Laptop"
      subtitle="Ini cara auto-tap yang benar-benar bekerja: script berjalan di dalam halaman TikTok langsung (same-origin)."
    >
      <p className="rounded-xl border border-tik-cyan/30 bg-tik-cyan/5 px-3 py-2.5 text-[11px] leading-relaxed text-ink-300">
        Kenapa perlu begini? Browser memblokir event tap dari luar iframe cross-origin,
        sehingga panel di halaman ini <b>tidak bisa</b> menekan tombol di dalam embed
        TikTok — batasan keamanan browser, bukan bug. Script di bawah dijalankan{' '}
        <b>di dalam halaman TikTok itu sendiri</b> dengan ritme natural yang sama
        dengan setelan aplikasi ini.
      </p>

      <ol className="mt-3 space-y-2 text-[11px] leading-relaxed text-ink-300">
        <li className="flex gap-2">
          <StepNumber n={1} />
          <span>
            Buka Chrome/Edge di laptop, login TikTok, lalu buka halaman LIVE target
            {liveUrl ? (
              <>
                {' — '}
                <button
                  type="button"
                  onClick={() => handleCopy(liveUrl, 'url')}
                  className="font-semibold text-tik-cyan underline-offset-2 hover:underline"
                >
                  {copied === 'url' ? '✓ link disalin' : '🔗 salin link live'}
                </button>
              </>
            ) : (
              ' (isi username/link TikTok di panel atas agar link live muncul di sini)'
            )}
            .
          </span>
        </li>
        <li className="flex gap-2">
          <StepNumber n={2} />
          <span>
            Tekan <b>F12</b> (atau Ctrl+Shift+I) → pilih tab <b>Console</b>.
          </span>
        </li>
        <li className="flex gap-2">
          <StepNumber n={3} />
          <span>
            Chrome baru meminta konfirmasi sekali: ketik <b>allow pasting</b> lalu
            Enter, kemudian paste script ini dan tekan Enter.
          </span>
        </li>
        <li className="flex gap-2">
          <StepNumber n={4} />
          <span>
            Panel kecil muncul di kiri-bawah halaman TikTok: jumlah tap, pace/menit,
            tombol <b>Jeda</b> dan <b>Stop</b>. Selesai — biarkan tab tetap terbuka.
          </span>
        </li>
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleCopy(script, 'script')}
          className="rounded-full bg-gradient-to-r from-tik-cyan to-tik-pink px-4 py-2 text-xs font-bold text-ink-950 shadow-md transition-transform active:scale-95"
        >
          {copied === 'script' ? '✓ Script disalin!' : '📋 Salin Script Auto-Tap'}
        </button>
        {copied === 'failed' && (
          <span className="text-[11px] text-tik-pink">
            Gagal menyalin otomatis — salin manual dari kotak pratinjau di bawah.
          </span>
        )}
        <Chip tone="cyan">Ritme mengikuti setelan aktif</Chip>
      </div>

      <details className="mt-3 rounded-xl border border-ink-700 bg-ink-950/60">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-ink-300">
          Lihat isi script (klik untuk buka — bisa disalin manual)
        </summary>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words px-3 pb-3 text-[10px] leading-relaxed text-ink-400">
          {script}
        </pre>
      </details>

      <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-ink-500">
        <li>
          • Ubah <b>Kecepatan & Anti-Deteksi</b> di halaman ini lalu salin ulang —
          script berikutnya otomatis mengikuti setelan terbaru.
        </li>
        <li>
          • Biarkan tab TikTok tetap aktif — tab background membuat browser
          memperlambat timer (ritme melambat otomatis).
        </li>
        <li>
          • Di HP tanpa laptop? Gunakan <b>Pacer Irama</b> di panel atas — pemandu
          bunyi/getar, tanpa perlu Console.
        </li>
        <li>
          • Gunakan hanya pada konten/akun milikmu sendiri dan tetap patuhi Ketentuan
          Layanan TikTok.
        </li>
      </ul>

    </SectionCard>
  );
}
