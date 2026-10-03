import { resolveTikTokUrl } from '../server/resolveTikTokUrl.js';

/**
 * Vercel Serverless Function (Node runtime):
 *   GET /api/resolve?url=<link-pendek-tiktok>
 *
 * Mengikuti redirect server-side (browser tidak bisa karena CORS) dan
 * mengembalikan URL lengkap TikTok:
 *   { ok: true, url: "https://www.tiktok.com/@user/video/123...", via }
 * atau
 *   { ok: false, error: "..." }
 *
 * Di lokal, endpoint yang sama dilayani middleware Vite (lihat vite.config.js).
 */
export default async function handler(request, response) {
  let urlParam = request.query?.url ?? null;
  if (urlParam === null) {
    try {
      urlParam = new URL(request.url, 'http://localhost').searchParams.get('url');
    } catch {
      urlParam = null;
    }
  }

  if (Array.isArray(urlParam)) urlParam = urlParam[0];

  if (!urlParam || typeof urlParam !== 'string') {
    response.status(400).json({ ok: false, error: 'Parameter "url" wajib diisi.' });
    return;
  }

  const result = await resolveTikTokUrl(urlParam);

  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  response.status(result.ok ? 200 : 422).json(result);
}
