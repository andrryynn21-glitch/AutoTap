import { useEffect, useState } from 'react';
import { Chip, SectionCard, Segmented } from './ui.jsx';
import { DemoSurface } from './DemoSurface.jsx';
import { TapLayer } from './TapLayer.jsx';
import { checkLiveStatus, isShortTikTokLink, resolveShortTikTokLink } from '../lib/tiktok.js';
import { formatNumber } from '../lib/format.js';
import { copyText } from '../lib/clipboard.js';

/**
 * PlayerStage — wadah "web view" TikTok + overlay target pointer.
 *
 * Mode:
 *  - "embed": iframe TikTok (player resmi untuk video, best-effort untuk LIVE)
 *  - "demo" : DemoSurface internal untuk menguji engine end-to-end
 *
 * TapLayer selalu berada di atas konten, jadi target pointer & ripple tetap
 * tampil di kedua mode.
 */
export function PlayerStage({
  mode,
  onModeChange,
  input,
  onInputChange,
  resolved,
  stageRef,
  target,
  onTargetChange,
  tapLayerRef,
  running,
}) {
  const [draft, setDraft] = useState(input);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null); // null | {loading} | {data} | {error}
  const [statusNonce, setStatusNonce] = useState(0);
  const [fullPageMode, setFullPageMode] = useState(false);

  useEffect(() => {
    setDraft(input);
  }, [input]);

  // Target LIVE saat ini (null bila bukan LIVE) — dipakai untuk cek status otomatis.
  const liveHandle =
    mode === 'embed' && resolved.kind === 'live' && resolved.ok ? resolved.handle : null;

  // Saat target LIVE berubah: reset mode eksperimen & hasil cek status lama.
  useEffect(() => {
    setFullPageMode(false);
    setLiveStatus(null);
  }, [liveHandle]);

  // Cek status LIVE via /api/live-status (otomatis + tombol "Cek ulang").
  useEffect(() => {
    if (!liveHandle) return undefined;

    let cancelled = false;
    setLiveStatus({ loading: true });

    checkLiveStatus(liveHandle)
      .then((data) => {
        if (!cancelled) setLiveStatus({ loading: false, data });
      })
      .catch((error) => {
        if (!cancelled) {
          setLiveStatus({
            loading: false,
            error: error?.message || 'Tidak bisa memeriksa status LIVE.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [liveHandle, statusNonce]);

  const submit = async (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setResolveError(null);

    // Link pendek (vt./vm./t/) diperluas dulu via /api/resolve supaya menjadi URL lengkap.
    if (!isShortTikTokLink(value)) {
      onInputChange(value);
      onModeChange('embed');
      return;
    }

    setResolving(true);
    try {
      const expanded = await resolveShortTikTokLink(value);
      setDraft(expanded);
      onInputChange(expanded);
      onModeChange('embed');
    } catch (error) {
      setResolveError(error.message);
      onInputChange(value);
      onModeChange('embed');
    } finally {
      setResolving(false);
    }
  };

  const showFrame = mode === 'embed' && resolved.ok && resolved.embedUrl;
  const frameSrc = fullPageMode && resolved.livePageUrl ? resolved.livePageUrl : resolved.embedUrl;

  return (
    <SectionCard
      title="TikTok Web Player"
      subtitle="Tempel link/live atau @username, lalu geser target untuk menentukan titik tap"
      actions={
        <Segmented
          label="Mode player"
          value={mode === 'embed' ? 'embed' : 'demo'}
          onChange={(next) => onModeChange(next)}
          options={[
            { value: 'embed', label: 'TikTok' },
            { value: 'demo', label: 'Demo' },
          ]}
        />
      }
    >
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://www.tiktok.com/@user/live  atau  @username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-ink-600 bg-ink-950/70 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-tik-cyan/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={resolving}
          className="shrink-0 rounded-lg border border-tik-cyan/40 bg-tik-cyan/10 px-3.5 py-2 text-xs font-bold text-tik-cyan transition-colors hover:bg-tik-cyan/20 disabled:cursor-wait disabled:opacity-60"
        >
          {resolving ? 'Membuka…' : 'Muat'}
        </button>
        {resolved.sourceUrl && (
          <a
            href={resolved.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden shrink-0 items-center rounded-lg border border-ink-600 px-3.5 py-2 text-xs font-medium text-ink-300 transition-colors hover:border-ink-500 sm:flex"
          >
            Buka ↗
          </a>
        )}
      </form>

      {resolveError && (
        <p className="mt-2 rounded-xl border border-tik-pink/40 bg-tik-pink/10 px-3 py-2 text-[11px] leading-relaxed text-tik-pink">
          {resolveError}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {mode === 'embed' && resolved.ok && <Chip tone="green">Terhubung · {resolved.label}</Chip>}
        {mode === 'embed' && resolved.ok && (
          <button
            type="button"
            onClick={() => setReloadNonce((nonce) => nonce + 1)}
            className="inline-flex items-center gap-1 rounded-full border border-ink-600 px-2.5 py-1 text-[11px] font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
          >
            ⟳ Coba Lagi
          </button>
        )}
        {mode === 'embed' && resolved.ok && resolved.sourceUrl && (
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText(
                `${window.location.origin}/?u=${encodeURIComponent(resolved.sourceUrl)}`,
              );
              if (ok) {
                setShareCopied(true);
                window.setTimeout(() => setShareCopied(false), 2000);
              }
            }}
            className="inline-flex items-center gap-1 rounded-full border border-ink-600 px-2.5 py-1 text-[11px] font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
          >
            {shareCopied ? '✓ Link disalin' : '🔗 Salin link siap pakai'}
          </button>
        )}
        {mode === 'embed' && resolved.kind === 'short-link' && (
          <Chip tone="cyan">Link pendek terdeteksi — tekan Muat untuk membuka</Chip>
        )}
        {mode === 'embed' && !resolved.ok && resolved.kind !== 'short-link' && (
          <Chip tone="amber">Menunggu link valid</Chip>
        )}
        {mode === 'demo' && <Chip tone="cyan">Demo Mode — engine siap diuji</Chip>}
        {resolved.sourceUrl && (
          <a
            href={resolved.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11px] font-medium text-tik-cyan underline-offset-2 hover:underline sm:hidden"
          >
            Buka di TikTok ↗
          </a>
        )}
      </div>

      {mode === 'embed' && resolved.kind === 'live' && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {(!liveStatus || liveStatus.loading) && (
            <Chip tone="cyan" className="animate-pulse">
              Memeriksa status LIVE @{resolved.handle}…
            </Chip>
          )}
          {liveStatus?.data?.ok && !liveStatus.data.exists && (
            <Chip tone="pink">❌ Akun tidak ditemukan</Chip>
          )}
          {liveStatus?.data?.live && (
            <Chip tone="green">
              🔴 LIVE sekarang
              {liveStatus.data.viewers != null
                ? ` · ${formatNumber(liveStatus.data.viewers)} penonton`
                : ''}
            </Chip>
          )}
          {liveStatus?.data?.ok && liveStatus.data.exists && !liveStatus.data.live && (
            <Chip tone="amber">⚪ Tidak sedang LIVE</Chip>
          )}
          {liveStatus?.error && <Chip tone="amber">⚠ Status tidak bisa dicek</Chip>}
          <button
            type="button"
            onClick={() => setStatusNonce((nonce) => nonce + 1)}
            disabled={Boolean(liveStatus?.loading)}
            className="inline-flex items-center gap-1 rounded-full border border-ink-600 px-2.5 py-1 text-[11px] font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100 disabled:cursor-wait disabled:opacity-60"
          >
            ⟳ Cek ulang status
          </button>
        </div>
      )}

      {mode === 'embed' && resolved.kind === 'live' && liveStatus?.data?.ok && !liveStatus.data.exists && (
        <div className="mt-3 rounded-xl border border-tik-pink/40 bg-tik-pink/10 px-3 py-2.5 text-[11px] leading-relaxed text-tik-pink">
          <p className="font-bold">Akun TikTok tidak ditemukan.</p>
          <p className="mt-1">{liveStatus.data.message}</p>
          <p className="mt-1 text-tik-pink/80">
            Embed LIVE ke akun yang tidak ada akan tampil hitam/kosong walau halaman embed-nya
            termuat di browser. Perbaiki username di kolom atas lalu tekan <b>Muat</b>.
          </p>
        </div>
      )}

      {mode === 'embed' && resolved.kind === 'live' && liveStatus?.data?.live && (
        <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-300">
          <p className="font-bold text-emerald-400">
            🔴 LIVE sekarang{liveStatus.data.nickname ? ` — ${liveStatus.data.nickname}` : ''}
            {liveStatus.data.verified ? ' ✓' : ''}
          </p>
          {liveStatus.data.title && <p className="mt-1">“{liveStatus.data.title}”</p>}
          <p className="mt-1 tabular-nums">
            {liveStatus.data.viewers != null
              ? `${formatNumber(liveStatus.data.viewers)} penonton`
              : 'Sedang siaran'}
            {liveStatus.data.followers != null
              ? ` · ${formatNumber(liveStatus.data.followers)} followers`
              : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <a
              href="#pacer"
              className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
            >
              🥁 Pacer HP (pemandu irama)
            </a>
            <a
              href="#script"
              className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
            >
              💻 Script Auto-Tap (laptop)
            </a>
            {resolved.livePageUrl && (
              <a
                href={resolved.livePageUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
              >
                ↗ Buka di TikTok
              </a>
            )}
          </div>
        </div>
      )}

      {mode === 'embed' &&
        resolved.kind === 'live' &&
        liveStatus &&
        !liveStatus.loading &&
        liveStatus.data?.ok &&
        liveStatus.data.exists &&
        !liveStatus.data.live && (
          <p className="mt-3 rounded-xl border border-ink-600 bg-ink-950/60 px-3 py-2.5 text-[11px] leading-relaxed text-ink-300">
            ⚪ Akun ini tidak sedang LIVE. Embed LIVE umumnya hanya menampilkan splash/hitam sampai
            streamer mulai siaran — tekan <b>Cek ulang status</b> saat sudah mulai.
          </p>
        )}

      {mode === 'embed' && resolved.kind === 'live' && liveStatus?.error && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200">
          ⚠ {liveStatus.error}
        </p>
      )}

      {mode === 'embed' && resolved.kind === 'live' && liveStatus?.data?.live && (
        <details className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[11px] leading-relaxed text-amber-200">
          <summary className="cursor-pointer px-3 py-2.5 font-bold text-amber-300">
            ⓘ Kenapa video LIVE di embed tetap hitam? (buka untuk penjelasan & solusi)
          </summary>
          <div className="px-3 pb-3">
            <p>
              TikTok membatasi streaming LIVE di embed pihak ketiga: halaman embed memang
              termuat, tetapi server webcast TikTok menolak data video (error 403). Ini
              batasan dari pihak TikTok, bukan aplikasi.
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>
                <b>Cara yang benar-benar bekerja:</b> panel <b>🥁 Pacer Irama</b> (HP,
                split-screen dengan aplikasi TikTok) atau <b>💻 Script Auto-Tap</b> (laptop,
                berjalan di halaman TikTok langsung) di halaman ini.
              </li>
              <li>
                Eksperimen: tombol <b>Mode Halaman Penuh</b> kadang bisa memutar stream. Di
                Chrome desktop, klik ikon <b>cookie</b> di address bar → izinkan cookie pihak
                ketiga untuk situs ini, lalu tekan <b>Coba Lagi</b>.
              </li>
              <li>
                iOS Safari: Settings → Safari → matikan <b>Prevent Cross-Site Tracking</b>{' '}
                (pastikan Block All Cookies nonaktif), lalu reload.
              </li>
              <li>
                Paling simpel: tonton langsung via <b>Buka di TikTok</b> sambil memakai Pacer
                dari HP.
              </li>
            </ul>
          </div>
        </details>
      )}

      {mode === 'embed' && resolved.kind === 'live' && resolved.livePageUrl && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFullPageMode((value) => !value)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              fullPageMode
                ? 'border-tik-cyan/50 bg-tik-cyan/10 text-tik-cyan'
                : 'border-ink-600 text-ink-300 hover:border-ink-500 hover:text-ink-100'
            }`}
          >
            {fullPageMode ? '↩ Kembali ke Embed Ringkas' : '🖥 Mode Halaman Penuh (eksperimen)'}
          </button>
          {fullPageMode && (
            <span className="text-[10px] leading-snug text-ink-500">
              Halaman live TikTok penuh dimuat dalam frame dengan sandbox — jika blank/error,
              kembali ke embed ringkas.
            </span>
          )}
        </div>
      )}

      {/* stage: konten + overlay target */}
      <div className="mt-3 flex justify-center">
        <div
          ref={stageRef}
          className="relative h-[62dvh] max-h-[620px] min-h-[380px] w-auto max-w-full select-none overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 shadow-2xl shadow-black/60"
          style={{ aspectRatio: '9 / 16' }}
        >
          {showFrame ? (
            <iframe
              key={`${frameSrc}::${reloadNonce}`}
              title="TikTok Player"
              src={frameSrc}
              className="absolute inset-0 h-full w-full border-0 bg-black"
              allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; accelerometer; gyroscope; magnetometer; unload"
              allowFullScreen
              {...(fullPageMode
                ? {
                    sandbox:
                      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation',
                  }
                : {})}
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          ) : mode === 'embed' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-ink-900 to-ink-950 px-6 text-center">
              <span className="text-3xl">🔗</span>
              <p className="text-sm font-semibold text-ink-100">Belum ada embed aktif</p>
              <p className="max-w-[260px] text-[11px] leading-relaxed text-ink-400">
                Tempel link video TikTok, link LIVE (@user/live), atau username @akun pada
                kolom di atas, lalu tekan <b>Muat</b>. Ingin langsung mencoba engine? Pindah
                ke <b>Demo</b>.
              </p>
              <button
                type="button"
                onClick={() => onModeChange('demo')}
                className="rounded-full bg-gradient-to-r from-tik-cyan to-tik-pink px-4 py-2 text-xs font-bold text-ink-950 transition-transform active:scale-95"
              >
                Coba Demo Mode
              </button>
            </div>
          ) : (
            <DemoSurface />
          )}

          <TapLayer
            ref={tapLayerRef}
            stageRef={stageRef}
            target={target}
            onTargetChange={onTargetChange}
            running={running}
          />
        </div>
      </div>

      {mode === 'embed' && resolved.notes.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-xl border border-ink-700 bg-ink-950/60 px-3 py-2.5">
          {resolved.notes.map((note) => (
            <li key={note} className="flex gap-2 text-[11px] leading-relaxed text-ink-400">
              <span aria-hidden="true" className="text-tik-cyan">
                •
              </span>
              {note}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
        💡 Geser lingkaran cyan-pink untuk memindahkan titik tap. Catatan penting: browser
        memblokir event tap dari halaman ini agar tidak masuk ke embed TikTok (cross-origin),
        jadi tap overlay hanya tercatat di aplikasi. Untuk tap yang benar-benar sampai ke
        TikTok: pakai <b>🥁 Pacer</b> (HP, split-screen) atau <b>💻 Script Auto-Tap</b>{' '}
        (laptop — berjalan langsung di halaman TikTok).
      </p>

    </SectionCard>
  );
}
