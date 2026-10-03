import { checkLiveStatus } from '../server/checkLiveStatus.js';

/**
 * Vercel Serverless Function (Node runtime):
 *   GET /api/live-status?handle=<@username | url profil | url /live>
 *
 * Mengembalikan status LIVE akun TikTok:
 *   { ok: true, handle, exists: true, live: true, viewers, title, nickname, ... }
 * atau
 *   { ok: false, error: "..." }
 *
 * Di lokal, endpoint yang sama dilayani middleware Vite (lihat vite.config.js).
 * Sengaja tanpa cache (no-store) karena status LIVE berubah cepat.
 */
export default async function handler(request, response) {
  let handleParam = request.query?.handle ?? null;
  if (handleParam === null) {
    try {
      handleParam = new URL(request.url, 'http://localhost').searchParams.get('handle');
    } catch {
      handleParam = null;
    }
  }

  if (Array.isArray(handleParam)) handleParam = handleParam[0];

  if (!handleParam || typeof handleParam !== 'string') {
    response.status(400).json({ ok: false, error: 'Parameter "handle" wajib diisi.' });
    return;
  }

  const result = await checkLiveStatus(handleParam);

  response.setHeader('Cache-Control', 'no-store');
  response.status(result.ok ? 200 : 422).json(result);
}
