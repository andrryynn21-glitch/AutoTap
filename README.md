# TikTok Auto-Tap Web 🎯

PWA berbasis **React + Vite + Tailwind CSS + vite-plugin-pwa** untuk auto-tap dengan
**target pointer yang bisa digeser**, **jitter koordinat acak**, **delay acak**, dan
**micro-pause** — ritme ketukan dibuat semirip mungkin dengan manusia. Siap deploy ke
**Vercel** dan bisa di-install ke layar utama **Android** maupun **iOS** langsung dari browser.

---

## ✨ Fitur

### PWA & Installability
- `manifest.json` lengkap: nama, icon **192x192 & 512x512** (plus versi **maskable**),
  `theme_color`, `display: standalone`, orientasi portrait.
- Service worker (Workbox `generateSW`) — app shell ter-precache, tetap terbuka saat offline.
- Tombol **Install App** interaktif di header & banner (`beforeinstallprompt` di Android/Chrome).
- Dukungan penuh iOS: `apple-touch-icon`, `apple-mobile-web-app-*` meta tags, panduan
  **Share → Add to Home Screen** untuk Safari.

### TikTok Web Player
- **Embed resmi TikTok Player v1** untuk link video: `tiktok.com/player/v1/{id}` (autoplay + loop).
- **LIVE / username** (`@user/live` atau `@user`) diperlakukan best-effort (TikTok tidak
  menyediakan embed LIVE resmi untuk pihak ketiga) dengan tombol fallback **Buka di TikTok**.
- **Demo Mode** internal: area live tiruan dengan tombol like asli untuk menguji engine
  end-to-end (counter naik = event simulasi benar-benar sampai ke elemen DOM).

### Target Pointer System
- Lingkaran target melayang (cincin cyan–pink) di atas area player.
- Bisa digeser dengan **mouse / sentuhan** (pointer events) maupun **tombol panah**
  (aksesibilitas; `Shift` = langkah besar).
- Posisi tersimpan sebagai persentase — otomatis menyesuaikan ukuran layar.

### Click Simulation Engine
- Urutan event DOM asli: **PointerEvent → TouchEvent → MouseEvent → click**
  (dengan `bubbles`, `cancelable`, `composed`, `pointerType: 'touch'`, `pressure` acak).
- Resolusi elemen presisi memakai `document.elementFromPoint()` di koordinat tap.
- Mode event dapat dipilih: **Semua / Pointer / Touch / Mouse**.

### Anti-Detection / Ritme Natural
- **Interval min–max** (ms) — delay berikutnya diacak di antara keduanya tiap ketukan.
- **Humanize**: delay dikali acak `0.88x–1.18x` + jeda "ragu" sesekali.
- **Random jitter** titik tap inom radius yang diatur (disarankan ±10–20px).
- **Micro-pause berkala**: berhenti sesaat tiap N ketukan (durasi juga diacak).
- **Auto-pause saat tab disembunyikan** (opsional) supaya timer tidak di-throttle browser.

### Dashboard & Kontrol
- Toggle **MULAI / BERHENTI** instan + tombol reset.
- Live **tap counter**, **timer durasi**, **tap/menit**, dan status pengiriman event terakhir.
- **Screen Wake Lock** — layar HP dijaga tetap menyala selama engine berjalan.
- Semua pengaturan & posisi target **tersimpan otomatis** di `localStorage`.

---

## 🧱 Tech Stack

| Bagian        | Teknologi                                    |
| ------------- | -------------------------------------------- |
| UI            | React 19 + Vite 8                            |
| Styling       | Tailwind CSS 4 (plugin `@tailwindcss/vite`) |
| PWA           | `vite-plugin-pwa` (Workbox 7, `generateSW`) |
| Deployment    | Vercel (static + `vercel.json`)              |
| Icons         | Generator PNG buatan sendiri (`scripts/generate-icons.mjs`, tanpa dependency native) |

---

## 📁 Struktur Proyek

```
├── index.html                      # Meta PWA + iOS meta tags
├── vite.config.js                  # VitePWA: manifest, workbox, devOptions
├── vercel.json                     # Rewrite SPA + cache header sw.js/manifest
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png        # 180x180 (hasil generate)
│   └── icons/                      # pwa-192/512 + maskable-192/512
├── scripts/
│   ├── generate-icons.mjs          # npm run icons
│   └── smoke-render.mjs            # verifikasi render App (SSR)
└── src/
    ├── main.jsx / App.jsx
    ├── index.css                   # Tailwind v4 theme + animasi
    ├── config/defaults.js          # Konstanta & nilai default
    ├── lib/
    │   ├── tapSimulator.js         # Sintesis Pointer/Touch/Mouse event + hit-test
    │   ├── tiktok.js               # Resolver URL TikTok → embed URL
    │   ├── random.js / format.js / storage.js
    ├── hooks/
    │   ├── useAutoTap.js           # Engine penjadwalan (setTimeout berantai)
    │   ├── useInstallPrompt.js     # beforeinstallprompt + deteksi iOS
    │   ├── useLocalStorage.js / useWakeLock.js
    └── components/
        ├── AppHeader.jsx / InstallBanner.jsx
        ├── PlayerStage.jsx         # Iframe TikTok / Demo + toolbar
        ├── TapLayer.jsx            # Target pointer draggable + ripple
        ├── DemoSurface.jsx         # Area uji engine
        ├── ControlPanel.jsx / StatsPanel.jsx / SettingsPanel.jsx
        └── ui.jsx                  # Primitif UI (Toggle, RangeField, dll.)
```

## 🚀 Menjalankan Secara Lokal

**Prasyarat:** Node.js `>= 20.19` (disarankan 22+) dan npm.

```bash
# 1. Install dependency
npm install

# 2. Jalankan dev server (PWA aktif di dev, termasuk service worker)
npm run dev
# → buka http://localhost:5173

# 3. Build produksi
npm run build

# 4. Preview hasil build
npm run preview
```

Perintah tambahan:

```bash
npm run icons         # generate ulang semua icon PNG (script sendiri, tanpa dependency)
node scripts/smoke-render.mjs   # smoke test: render seluruh App via SSR Vite
```

> 💡 Untuk mengetes di HP via WiFi: `npm run dev -- --host` lalu buka
> `http://<IP-komputer>:5173`. Catatan: **prompt install PWA hanya muncul di
> `localhost` atau HTTPS** — untuk uji install di HP gunakan hasil deploy Vercel
> (atau tunnel seperti `npx localtunnel`/ngrok).

---

## ☁️ Deploy ke Vercel (Satu Klik)

### Opsi A — Deploy Button

1. Push proyek ini ke repository GitHub kamu.
2. Ganti `URL_REPO_KAMU` pada tombol di bawah, lalu klik:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FURL_REPO_KAMU%2Ftiktok-autotap-web)

### Opsi B — Dashboard Vercel

1. Buka [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Pilih repo. Vercel otomatis mendeteksi **Vite** dengan setelan:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Klik **Deploy** — selesai. Setiap `git push` akan otomatis re-deploy.

### Opsi C — Vercel CLI

```bash
npm i -g vercel
vercel          # deploy preview
vercel --prod   # deploy production
```

`vercel.json` sudah disiapkan: rewrite SPA ke `index.html` plus cache header khusus
untuk `sw.js` dan `manifest.json` agar update PWA selalu segar.

---

## 📲 Install ke Layar Utama

### Android (Chrome / Edge)
1. Buka URL aplikasi hasil deploy.
2. Tap tombol **Install App** pada banner/header **atau** menu ⋮ → **Add to Home screen**.
3. Konfirmasi **Install** — aplikasi muncul sebagai icon standalone.

### iOS (Safari)
1. Buka URL aplikasi di **Safari** (bukan in-app browser).
2. Tap ikon **Share** → **Add to Home Screen** → **Add**.
3. Buka dari icon — tampil tanpa address bar dengan status bar `black-translucent`.

> Syarat installability: HTTPS + `manifest.json` + service worker + icon 192/512 —
> semuanya sudah terpenuhi setelah deploy ke Vercel.

---

## 🎮 Cara Pakai

1. **Pilih mode player** (segmented kanan atas):
   - **TikTok** — tempel link video (`tiktok.com/@user/video/123...`) atau link/username
     LIVE (`@user`), tekan **Muat**.
   - **Demo** — area uji internal; paling pas untuk membuktikan engine bekerja.
2. **Geser target pointer** ke titik yang ingin diketuk (mis. tombol ❤️).
   Bisa juga pakai tombol panah keyboard.
3. **Atur kecepatan & anti-deteksi** di panel *Kecepatan & Anti-Deteksi*:
   interval min–max, jitter px, humanize, micro-pause, jenis event.
4. Tekan **MULAI AUTO-TAP** — pantau `tap counter`, `durasi`, `tap/menit`, dan status
   pengiriman di dashboard. Tekan **BERHENTI** untuk berhenti seketika, atau
   **Reset Counter & Timer** untuk memulai sesi baru.
5. Setelan & posisi target otomatis tersimpan; membuka ulang aplikasi akan memulihkannya.

---

## ⚠️ Batasan Penting (wajib dibaca)

1. **Iframe cross-origin tidak bisa di-tap otomatis.** Ini kebijakan keamanan browser
   (same-origin policy), bukan bug: event sintetis tidak dapat menembus dokumen
   `tiktok.com` yang di-embed. Konsekuensinya, saat target berada di atas area iframe:
   - tap tetap **dihitung**, ripple tetap tampil (warna **amber** = terblokir),
   - dashboard menampilkan status `Diblokir iframe (IFRAME)`.
   Engine akan **benar-benar menerima tap** ketika elemen target berada di DOM aplikasi
   sendiri (Demo Mode, tombol-tombol UI) atau pada iframe **same-origin** (mis. konten
   milikmu yang kamu host sendiri lalu di-embed).
2. **LIVE embed bersifat best-effort.** TikTok tidak menyediakan embed LIVE resmi untuk
   pihak ketiga; jika format `tiktok.com/embed/@user/live` tidak memuat apa pun, gunakan
   tombol **Buka di TikTok**. Embed **video** memakai player resmi sehingga stabil.
3. **Tab background di-throttle browser.** Karena itu ada opsi *auto-pause saat tab
   disembunyikan* (default aktif) agar ritme tidak rusak.
4. **Gunakan secara bertanggung jawab.** Alat ini untuk eksperimen pribadi dan pengujian
   UI/interaksi — bukan untuk memanipulasi engagement secara masif. Memakai automation
   pada platform pihak ketiga berpotensi melanggar Ketentuan Layanan mereka dan dapat
   berujung pada pembatasan akun. Semua risiko ada di tangan pengguna. Proyek ini tidak
   berafiliasi dengan TikTok.

---

## ❓ Troubleshooting

| Masalah | Solusi |
| --- | --- |
| Tombol *Install App* tidak muncul di Android | Pastikan https:// + buka dengan Chrome; reload 1x. Prompt muncul hanya jika PWA belum ter-install dan kriteria installability terpenuhi. |
| Tidak ada tombol install di iOS | Normal — iOS tidak punya prompt API. Gunakan **Share → Add to Home Screen**. |
| Iframe LIVE kosong / error | Live mungkin belum aktif atau embed diblokir TikTok. Tekan **Buka di TikTok**, atau uji dengan link video. |
| Perubahan kode tidak muncul di HP | Service worker cenderung cache agresif — aplikasi memakai `registerType: 'autoUpdate'`. Tutup semua instance PWA, buka ulang; atau uninstall lalu install ulang. |
| Icon ingin diganti | Edit `scripts/generate-icons.mjs` lalu `npm run icons`, kemudian rebuild/deploy. |
| `npm run dev` jalan tapi manifest 404 | Manifest di dev dilayani `vite-plugin-pwa` (`/manifest.json`) — pastikan plugin aktif (default). |

---

## 📄 Lisensi

MIT — bebas dipakai dan dimodifikasi untuk keperluan pribadi/pembelajaran.

**Disclaimer:** Proyek demonstrasi. Tidak berafiliasi dengan TikTok/ByteDance. Pengguna
bertanggung jawab penuh atas penggunaan dan kepatuhan terhadap ketentuan platform.


