/**
 * Self-test untuk generator script auto-tap (src/lib/tapScript.js).
 * Memastikan script hasil generate:
 *  1. bisa di-parse tanpa SyntaxError (new Function),
 *  2. tidak ada kebocoran penanda template literal,
 *  3. masih memuat selector utama & kontrol window.__TATW__.
 *
 * Jalankan: npm run check:script
 */
import assert from 'node:assert/strict';
import { buildTapScript } from '../src/lib/tapScript.js';

const settings = {
  minDelayMs: 120,
  maxDelayMs: 260,
  humanize: true,
  microPauseEnabled: true,
  microPauseEvery: 25,
  microPauseMinMs: 900,
  microPauseMaxMs: 2600,
};

const script = buildTapScript({
  settings,
  handle: 'demo.user',
  label: 'LIVE · @demo.user',
});

assert.ok(script.length > 1000, 'script terlalu pendek — generator bermasalah');
assert.ok(!script.includes('${'), 'kebocoran template literal (${ ditemukan)');
assert.ok(!script.includes('\\n`'), 'template literal tidak tertutup dengan benar');

// Placeholder dari template literal yang sengaja ditinggalkan.
assert.ok(!script.includes('__NEXT__'), 'marker __NEXT__ masih tersisa');
assert.ok(!script.includes('__PART2__'), 'marker __PART2__ masih tersisa');

new Function(script); // melempar SyntaxError bila script tidak valid

assert.ok(script.includes('data-e2e="like-btn"'), 'selector utama like-btn hilang');
assert.ok(script.includes('window.__TATW__'), 'kontrol window.__TATW__ hilang');
assert.ok(script.includes('\\B'), 'regex pemisah ribuan rusak (backslash hilang)');
assert.ok(script.includes('tiktok\\.com'), 'regex domain tiktok.com rusak');

console.log('✔ tapScript OK —', script.length, 'karakter, sintaks valid');
