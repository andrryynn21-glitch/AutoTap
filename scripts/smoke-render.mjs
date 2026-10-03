/**
 * Smoke test SSR: render seluruh pohon React App lewat Vite ssrLoadModule.
 * Memastikan semua import, JSX, dan komponen utama valid saat runtime.
 * Jalankan: node scripts/smoke-render.mjs
 */
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));

const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');

  const html = renderToString(React.createElement(App));

  const expected = [
    'TikTok Auto-Tap Web',
    'TikTok Web Player',
    'MULAI AUTO-TAP',
    'Dashboard Real-time',
    'Kecepatan &amp; Anti-Deteksi',
    'Micro-pause berkala',
    '1,2K menonton',
    'demo-like-button',
    'data-tap-handle',
    'Reset Counter &amp; Timer',
  ];

  let failed = 0;
  for (const needle of expected) {
    if (html.includes(needle)) {
      console.log(`PASS  SSR mengandung: ${needle}`);
    } else {
      failed += 1;
      console.error(`FAIL  SSR TIDAK mengandung: ${needle}`);
    }
  }

  console.log(`\nPanjang HTML SSR: ${html.length} karakter`);
  console.log(failed === 0 ? 'SMOKE RENDER LULUS ✔' : `${failed} PENGECEKAN GAGAL ✘`);
  process.exitCode = failed === 0 ? 0 : 1;
} finally {
  await server.close();
}
