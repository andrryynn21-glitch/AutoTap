/**
 * Resolver URL TikTok -> URL embed.
 *
 * - Video  : memakai TikTok Player resmi  https://www.tiktok.com/player/v1/{post_id}
 * - LIVE   : TikTok TIDAK menyediakan embed LIVE resmi untuk pihak ketiga.
 *            Kita memakai format best-effort `tiktok.com/embed/@user/live`
 *            dan menampilkan catatan + fallback "Buka di TikTok".
 * - Embed  : URL /player/ atau /embed/ yang sudah jadi dipakai langsung.
 */

const VIDEO_RE = /\/video\/(\d{5,})/;
const URL_HANDLE_RE = /tiktok\.com\/@([A-Za-z0-9._]{2,24})/i;
const HANDLE_RE = /^@?([A-Za-z0-9._]{2,24})$/;
const EMBED_RE = /tiktok\.com\/(player|embed)\//i;
const LIVE_RE = /\/live\b/i;

function ensureProtocol(input) {
  return /^https?:\/\//i.test(input) ? input : `https://${input.replace(/^\/+/, '')}`;
}

function videoResult(postId, sourceUrl) {
  return {
    ok: true,
    kind: 'video',
    input: sourceUrl,
    embedUrl: `https://www.tiktok.com/player/v1/${postId}?autoplay=1&loop=1&music_info=1&description=1`,
    sourceUrl,
    label: `Video TikTok · ${postId}`,
    notes: ['Embed resmi TikTok Player v1 (autoplay + loop aktif).'],
  };
}

function liveResult(handle, sourceUrl) {
  return {
    ok: true,
    kind: 'live',
    input: sourceUrl,
    embedUrl: `https://www.tiktok.com/embed/@${handle}/live`,
    sourceUrl,
    label: `LIVE · @${handle}`,
    notes: [
      'TikTok tidak menyediakan embed LIVE resmi untuk pihak ketiga — format ini best-effort. Jika live sedang tidak aktif, iframe bisa menampilkan halaman kosong.',
      'Browser TIDAK mengizinkan event tap sintetis menembus iframe cross-origin. Gunakan Demo Mode untuk mengetes engine penuh, atau biarkan tap count berjalan di overlay.',
    ],
  };
}

/**
 * @param {string} rawInput — link TikTok, username (@user), atau URL embed langsung
 * @returns {{ok: boolean, kind: string, input: string, embedUrl: string|null,
 *            sourceUrl: string|null, label: string, notes: string[]}}
 */
export function resolveTikTokEmbed(rawInput) {
  const input = String(rawInput ?? '').trim();

  if (!input) {
    return {
      ok: false,
      kind: 'empty',
      input,
      embedUrl: null,
      sourceUrl: null,
      label: '',
      notes: ['Tempel link TikTok Live / video, atau username @akun untuk mulai.'],
    };
  }

  // URL embed/player yang sudah jadi
  if (EMBED_RE.test(input)) {
    const url = ensureProtocol(input);
    return {
      ok: true,
      kind: 'embed',
      input,
      embedUrl: url,
      sourceUrl: url,
      label: 'Custom embed URL',
      notes: ['URL embed/player dipakai langsung.'],
    };
  }

  const looksLikeUrl = /^https?:\/\//i.test(input) || /tiktok\.com/i.test(input);

  if (looksLikeUrl) {
    const url = ensureProtocol(input);

    const videoMatch = url.match(VIDEO_RE);
    if (videoMatch) return videoResult(videoMatch[1], url);

    const handleMatch = url.match(URL_HANDLE_RE);
    if (handleMatch) return liveResult(handleMatch[1], url);

    return {
      ok: false,
      kind: 'unsupported',
      input,
      embedUrl: null,
      sourceUrl: url,
      label: '',
      notes: [
        'Link TikTok tidak dikenali. Contoh yang didukung: link /video/123..., link /@user/live, atau username @user.',
      ],
    };
  }

  // Username polos: @user atau user
  const handleMatch = input.match(HANDLE_RE);
  if (handleMatch) {
    return liveResult(handleMatch[1], `https://www.tiktok.com/@${handleMatch[1]}/live`);
  }

  return {
    ok: false,
    kind: 'invalid',
    input,
    embedUrl: null,
    sourceUrl: null,
    label: '',
    notes: ['Format tidak dikenali. Tempel link TikTok atau username @akun.'],
  };
}
