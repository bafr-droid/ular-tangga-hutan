# Panduan File Gambar — Petualangan Hutan

Taruh semua file di folder ini (`ular-tangga-hutan/assets/`). Nama file boleh diganti, tapi beri tahu saya kalau berbeda dari daftar di bawah.

## 1. Background menu → `bg-menu.webp` (atau .jpg / .png)
- Ukuran ideal: **1920×1080** (minimal 1280×720), landscape.
- Komposisi: area **tengah dibiarkan agak kosong** karena ada judul + tombol PLAY.
- Jangan menyertakan teks di dalam gambar (teks tetap dari HTML).
- Warna: hijau hutan, daun, pohon, sinar matahari. Hindari kontras terlalu tinggi.
- Ukuran file: usahakan **< 500 KB**. WebP paling disarankan.

## 2. Background game → `bg-game.webp`
- Ukuran ideal: **1920×1080**.
- Komposisi: papan ada di **kiri/tengah**, panel kontrol di **kanan**.
- Boleh sedikit lebih gelap dari `bg-menu` supaya kartu putih tetap menonjol.
- Saya akan menambah overlay transparan otomatis supaya tulisan tetap terbaca.

## 3. Tekstur belakang papan → `bg-board.png`
- Ukuran ideal: **1024×1024** (bisa juga 512×512 atau SVG pattern).
- Isi: tekstur kayu / anyaman daun / tanah, **tanpa objek besar**.
- Akan dipakai dengan opacity rendah di dalam papan, jadi pilih yang halus.
- Alternatif: kirim SVG pattern, lebih tajam di semua ukuran layar.

## 4. Ikon ular → `snake.svg` (atau .png)
- Latar **transparan** wajib.
- Ukuran kanvas: **256×256** (SVG lebih baik).
- Orientasi: kepala menghadap **kanan** atau **atas** (sebutkan saja).
- Jika bentuknya berliku, saya bisa pakai gambar ini langsung di kotak.

## 5. Ikon tangga → `ladder.svg` (atau .png)
- Latar **transparan** wajib.
- Ukuran kanvas: **256×256**, orientasi **vertikal**.

## 6. Supaya garis penghubung mengikuti referensi
Salah satu dari ini cukup:
- **SVG ular/tangga utuh** yang bisa saya putar dan regangkan antar kotak (paling akurat), **atau**
- Sebutkan **bentuk + warna**nya, misalnya: "ular berliku 3 kali, hijau `#4C9A68`, garis tebal 6px; tangga coklat `#C99A45`, anak tangga 5".

## Ringkasan yang saya butuhkan dari Anda
1. File gambar di folder ini (atau drag ke chat / kirim URL).
2. Format & ukuran sudah sesuai panduan di atas.
3. Kalau ada orientasi khusus (kepala ular menghadap ke mana), sebutkan.

Setelah file ada, saya yang mengubah CSS + JS: `background-size: cover`, overlay keterbacaan, responsif, ganti emoji 🐍/🪜 dengan gambar, dan menggambar ulang 22 garis penghubung mengikuti referensi Anda.
