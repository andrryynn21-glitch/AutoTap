import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolveTikTokUrl } from './server/resolveTikTokUrl.js';
import { checkLiveStatus } from './server/checkLiveStatus.js';

/**
 * Middleware dev & preview server untuk /api/resolve (link pendek TikTok).
 * Di production Vercel, endpoint yang sama ditangani oleh api/resolve.js —
 * sehingga perilaku dev dan deploy identik.
 */
function tiktokShortLinkResolver() {
  const handle = async (req, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    try {
      const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url');
      if (!urlParam) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Parameter "url" wajib diisi.' }));
        return;
      }
      const result = await resolveTikTokUrl(urlParam);
      res.statusCode = result.ok ? 200 : 422;
      res.end(JSON.stringify(result));
    } catch {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'Internal error saat resolve link.' }));
    }
  };

  return {
    name: 'tiktok-short-link-resolver',
    configureServer(server) {
      server.middlewares.use('/api/resolve', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/resolve', handle);
    },
  };
}

/**
 * Middleware dev & preview server untuk /api/live-status (status LIVE TikTok).
 * Di production Vercel, endpoint yang sama ditangani oleh api/live-status.js.
 */
function tiktokLiveStatusChecker() {
  const handle = async (req, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    try {
      const handleParam = new URL(req.url, 'http://localhost').searchParams.get('handle');
      if (!handleParam) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Parameter "handle" wajib diisi.' }));
        return;
      }
      const result = await checkLiveStatus(handleParam);
      res.statusCode = result.ok ? 200 : 422;
      res.end(JSON.stringify(result));
    } catch {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'Internal error saat cek status LIVE.' }));
    }
  };

  return {
    name: 'tiktok-live-status-checker',
    configureServer(server) {
      server.middlewares.use('/api/live-status', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/live-status', handle);
    },
  };
}

/**
 * TikTok Auto-Tap Web - Vite configuration
 *
 * The PWA engine (`vite-plugin-pwa`) generates:
 *  - public "manifest.json"  (name, icons 192/512 + maskable, theme color, standalone display)
 *  - "sw.js" service worker  (precache of the app shell -> installable + offline shell)
 */
export default defineConfig({
  // Parity dengan vercel.json: izinkan unload di dokumen induk agar bisa
  // didelegasikan ke iframe TikTok (lihat header Permissions-Policy di vercel.json).
  server: {
    headers: {
      'Permissions-Policy': 'unload=(self "https://www.tiktok.com")',
    },
  },
  preview: {
    headers: {
      'Permissions-Policy': 'unload=(self "https://www.tiktok.com")',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    tiktokShortLinkResolver(),
    tiktokLiveStatusChecker(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // The user-facing manifest literally lives at /manifest.json
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'TikTok Auto-Tap Web',
        short_name: 'Auto-Tap',
        description:
          'PWA auto-tap dengan target pointer yang bisa digeser, jitter acak dan micro-pause untuk ritme ketukan yang natural.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#07070b',
        theme_color: '#07070b',
        categories: ['utilities', 'entertainment'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
