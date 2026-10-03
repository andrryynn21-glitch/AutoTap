/**
 * Cek status LIVE TikTok untuk sebuah username.
 *
 * Memakai endpoint JSON publik yang sama dengan player web TikTok:
 *   GET https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=<handle>
 *
 * Dipakai oleh:
 *  - api/live-status.js -> Vercel Serverless Function (production)
 *  - vite.config.js     -> middleware dev & preview server (localhost)
 *
 * Hasil yang mungkin:
 *  - akun tidak ditemukan -> { ok: true,  exists: false, live: false }
 *  - akun ada & LIVE      -> { ok: true,  exists: true,  live: true, viewers, title, ... }
 *  - akun ada & offline   -> { ok: true,  exists: true,  live: false, ... }
 *  - gagal jaringan/limit -> { ok: false, error: "..." }
 *
 * Catatan lapangan (penting untuk UI):
 *  - status room 2 = sedang siaran, 4 = tidak siaran;
 *  - user_not_found / statusCode 19881007 = akun tidak ada. Embed LIVE ke akun
 *    yang tidak ada akan tampil hitam/kosong walau halaman embed-nya termuat,
 *    jadi hasil cek ini dipakai aplikasi untuk menjelaskan kondisi ke pengguna.
 */

const HANDLE_RE = /^@?([A-Za-z0-9._]{2,24})$/;
const URL_HANDLE_RE = /tiktok\.com\/@([A-Za-z0-9._]{2,24})/i;
const API_URL = 'https://www.tiktok.com/api-live/user/room/?aid=1988&sourceType=54&uniqueId=';
const USER_NOT_FOUND_CODE = 19881007;
const LIVE_ROOM_STATUS_ON = 2;

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * Terima "@user", "user", URL profil, atau URL /live -> kembalikan handle bersih.
 * @returns {string|null}
 */
export function extractHandle(rawInput) {
  const raw = String(rawInput ?? '').trim();
  if (!raw) return null;

  const fromUrl = raw.match(URL_HANDLE_RE);
  if (fromUrl) return fromUrl[1];

  const direct = raw.match(HANDLE_RE);
  return direct ? direct[1] : null;
}

export async function checkLiveStatus(rawInput) {
  const handle = extractHandle(rawInput);
  if (!handle) {
    return { ok: false, error: 'Username TikTok tidak valid. Contoh: @mpl.id.official' };
  }

  let response;
  try {
    response = await fetch(`${API_URL}${encodeURIComponent(handle)}`, {
      headers: {
        'user-agent': BROWSER_UA,
        accept: 'application/json, text/plain, */*',
        referer: 'https://www.tiktok.com/',
      },
      signal: AbortSignal.timeout(9000),
    });
  } catch (error) {
    const reason =
      error?.name === 'TimeoutError'
        ? 'timeout saat menghubungi TikTok'
        : error?.message || 'gagal terhubung';
    return { ok: false, error: `Tidak bisa memeriksa status LIVE (${reason}). Coba lagi.` };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `TikTok menolak permintaan (HTTP ${response.status}). Coba lagi sebentar lagi.`,
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: 'Respons TikTok tidak bisa dibaca. Coba lagi.' };
  }

  const user = data?.data?.user ?? null;

  if (!user) {
    if (data?.message === 'user_not_found' || data?.statusCode === USER_NOT_FOUND_CODE) {
      return {
        ok: true,
        handle,
        exists: false,
        live: false,
        message: `Akun @${handle} tidak ditemukan di TikTok. Periksa ejaan username — titik, underscore, dan angka sangat berpengaruh.`,
      };
    }
    return { ok: false, error: 'Status akun tidak dikenali oleh TikTok. Coba lagi.' };
  }

  const room = data?.data?.liveRoom ?? null;
  const live = room?.status === LIVE_ROOM_STATUS_ON;

  return {
    ok: true,
    handle: user.uniqueId || handle,
    exists: true,
    live,
    nickname: user.nickname || '',
    verified: Boolean(user.verified),
    followers: data?.data?.stats?.followerCount ?? null,
    viewers: live ? room?.liveRoomStats?.userCount ?? null : null,
    title: live ? room?.title || '' : '',
    startedAt: live ? room?.startTime ?? null : null,
  };
}
