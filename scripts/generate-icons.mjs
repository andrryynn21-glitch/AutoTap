#!/usr/bin/env node
/**
 * scripts/generate-icons.mjs
 * ------------------------------------------------------------------
 * Menghasilkan seluruh icon PWA sebagai PNG TANPA dependency native
 * (hanya memakai modul bawaan Node: zlib).
 *
 * Output:
 *   public/icons/pwa-192x192.png
 *   public/icons/pwa-512x512.png
 *   public/icons/maskable-192x192.png
 *   public/icons/maskable-512x512.png
 *   public/icons/favicon-48x48.png
 *   public/apple-touch-icon.png        (180x180, full-bleed untuk iOS)
 *
 * Jalankan: npm run icons
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

/* ----------------------- minimal PNG encoder ----------------------- */

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------------------- helpers ----------------------------- */

const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/* ---------------------------- artwork ------------------------------
 * Tema "tap target" (mengikuti target pointer di dalam aplikasi):
 *  - background gelap rounded-square (full-bleed saat maskable/apple)
 *  - cincin luar cyan  #25f4ee
 *  - cincin dalam pink #fe2c55
 *  - titik tengah putih
 * Digambar 4x (supersampling) lalu di-downsample agar anti-aliased.
 * ------------------------------------------------------------------ */

const ART = {
  bgTop: hexToRgb('#1d1d2c'),
  bgBottom: hexToRgb('#0a0a11'),
  cyan: hexToRgb('#25f4ee'),
  pink: hexToRgb('#fe2c55'),
  white: hexToRgb('#ffffff'),
};

function renderIcon(size, { maskable = false } = {}) {
  const SS = 4; // supersampling factor
  const n = size * SS;
  const out = Buffer.alloc(size * size * 4);

  // geometri (normalized 0..1). Maskable memakai safe-zone <= 0.4 dari center.
  const corner = maskable ? 0 : 0.235;
  const outerR = maskable ? 0.295 : 0.34;
  const outerW = maskable ? 0.055 : 0.062;
  const midR = maskable ? 0.18 : 0.205;
  const midW = maskable ? 0.048 : 0.054;
  const dotR = maskable ? 0.06 : 0.068;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const u = (x * SS + sx + 0.5) / n;
          const v = (y * SS + sy + 0.5) / n;

          // mask rounded-square
          if (corner > 0) {
            const dx = Math.max(corner - u, 0, u - (1 - corner));
            const dy = Math.max(corner - v, 0, v - (1 - corner));
            if (Math.hypot(dx, dy) > corner) continue; // transparan di luar
          }

          const d = Math.hypot(u - 0.5, v - 0.5);
          let color;

          if (d <= dotR) {
            color = ART.white;
          } else if (Math.abs(d - midR) <= midW / 2) {
            color = ART.pink;
          } else if (Math.abs(d - outerR) <= outerW / 2) {
            color = ART.cyan;
          } else {
            const t = Math.min(1, Math.max(0, (v - 0.08) / 0.84));
            color = mix(ART.bgTop, ART.bgBottom, t);
            // glow halus di tengah supaya cincin terlihat "menyala"
            const glow = Math.max(0, 1 - d * 2.2) * 0.07;
            color = mix(color, ART.white, glow);
          }

          r += color[0];
          g += color[1];
          b += color[2];
          a += 255;
        }
      }

      const samples = SS * SS;
      const i = (y * size + x) * 4;
      out[i] = Math.round(r / samples);
      out[i + 1] = Math.round(g / samples);
      out[i + 2] = Math.round(b / samples);
      out[i + 3] = Math.round(a / samples);
    }
  }

  return encodePng(size, size, out);
}

/* ------------------------------ main ------------------------------ */

const TARGETS = [
  { file: path.join(ICONS_DIR, 'favicon-48x48.png'), size: 48 },
  { file: path.join(ICONS_DIR, 'pwa-192x192.png'), size: 192 },
  { file: path.join(ICONS_DIR, 'pwa-512x512.png'), size: 512 },
  { file: path.join(ICONS_DIR, 'maskable-192x192.png'), size: 192, maskable: true },
  { file: path.join(ICONS_DIR, 'maskable-512x512.png'), size: 512, maskable: true },
  { file: path.join(PUBLIC_DIR, 'apple-touch-icon.png'), size: 180, maskable: true },
];

mkdirSync(ICONS_DIR, { recursive: true });

for (const target of TARGETS) {
  const png = renderIcon(target.size, { maskable: Boolean(target.maskable) });
  writeFileSync(target.file, png);
  const rel = path.relative(ROOT, target.file);
  console.log(`✔ ${rel} — ${target.size}x${target.size} (${(png.length / 1024).toFixed(1)} KB)`);
}

console.log('\nSemua icon berhasil dibuat.');

