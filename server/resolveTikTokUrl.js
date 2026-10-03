/**
 * Resolver link pendek TikTok (vt.tiktok.com / vm.tiktok.com / tiktok.com/t/...).
 *
 * Dipakai oleh:
 *  - api/resolve.js  -> Vercel Serverless Function (production)
 *  - vite.config.js  -> middleware dev & preview server (localhost)
 *
 * Alur: validasi domain -> ikuti redirect HTTP -> jika hasil akhir dikenali
 * sebagai URL konten TikTok, kembalikan; jika TikTok mengembalikan halaman
 * HTML (JS redirect), coba salvage dari HTML; jika bouncing ke homepage,
 * laporkan sebagai link kedaluwarsa / tidak tersedia.
 */

const ALLOWED_HOST_RE = /(^|\.)tiktok\.com$/i;
const SHORT_HOST_RE = /^(vt|vm)\.tiktok\.com$/i;

const CONTENT_URL_RE =
  /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._]+\/(?:video|photo)\/\d{5,}[^\s"'\\]*|https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._]+\/live[^\s"'\\]*/i;
const HOME_BOUNCE_RE = /^https?:\/\/(?:www\.)?tiktok\.com\/?\?([^#\s]*&)?_r=1/i;
const ITEM_ID_RE = /"itemId"\s*:\s*"(\d{15,})"/;

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export function validateTikTokUrl(rawUrl) {
  const raw = String(rawUrl ?? '').trim();
  if (!raw) return { ok: false, error: 'Parameter url wajib diisi.' };

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withProto);
  } catch {
    return { ok: false, error: 'URL tidak valid.' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Protokol tidak didukung.' };
  }
  if (!ALLOWED_HOST_RE.test(url.hostname)) {
    return { ok: false, error: 'Hanya link domain tiktok.com yang bisa di-resolve.' };
  }
  return { ok: true, url };
}

/** Cari URL konten di dalam HTML (halaman JS-redirect TikTok). */
function salvageFromHtml(html) {
  const normalized = html.replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
  const content = normalized.match(CONTENT_URL_RE);
  if (content) return content[0];
  const item = normalized.match(ITEM_ID_RE);
  if (item) return `https://www.tiktok.com/video/${item[1]}`;
  return null;
}

export async function resolveTikTokUrl(rawUrl) {
  const validated = validateTikTokUrl(rawUrl);
  if (!validated.ok) return validated;

  const inputUrl = validated.url;
  let response;
  try {
    response = await fetch(inputUrl.toString(), {
      redirect: 'follow',
      headers: {
        'user-agent': BROWSER_UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(9000),
    });
  } catch (error) {
    const reason =
      error?.name === 'TimeoutError' ? 'timeout saat membuka link' : error?.message || 'gagal terhubung';
    return { ok: false, error: `Tidak bisa membuka link (${reason}). Coba lagi.` };
  }

  const finalUrl = response.url || inputUrl.toString();

  // 1) Redirect HTTP langsung ke URL konten (kasus ideal).
  if (CONTENT_URL_RE.test(finalUrl)) {
    return { ok: true, url: finalUrl, status: response.status, via: 'redirect' };
  }

  // 2) Bouncing ke homepage = link kedaluwarsa / video dihapus / dibatasi wilayah.
  let pathname = '/';
  try {
    pathname = new URL(finalUrl).pathname;
  } catch {
    /* abaikan */
  }
  if (HOME_BOUNCE_RE.test(finalUrl) || pathname === '/') {
    return {
      ok: false,
      error:
        'Link pendek ini tidak bisa dibuka — kemungkinan kedaluwarsa, video dihapus, atau dibatasi wilayah. Buka di TikTok lalu salin URL lengkap dari address bar.',
    };
  }

  // 3) Halaman HTML dengan JS redirect — coba salvage dari HTML.
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 200 && contentType.includes('html')) {
    try {
      const html = await response.text();
      const salvaged = salvageFromHtml(html);
      if (salvaged) return { ok: true, url: salvaged, status: response.status, via: 'html' };
    } catch {
      /* abaikan */
    }
  }

  // 4) URL akhir bukan konten yang dikenali.
  return {
    ok: false,
    error: `Link tidak mengarah ke video/LIVE TikTok yang dikenali (${finalUrl}). Salin URL lengkap dari TikTok lalu tempel manual.`,
  };
}

export { SHORT_HOST_RE };
