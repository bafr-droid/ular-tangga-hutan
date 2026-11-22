# Folder Sketsa Buatan Anda

Di folder ini Anda menyimpan **gambar tebak gambar versi Anda sendiri**.
Semua 26 gambar sudah terdaftar di `custom-sketches.js`, jadi gambar Anda yang tampil di game.

## Cara ganti / tambah gambar

### 1. Siapkan gambar
- Format: **PNG / JPG / SVG / WEBP**
- Rasio disarankan **12 : 7** (contoh: `960 × 560 px`)
- **Nama file = kolom "Isi gambar"** pada tabel di bawah, diikuti ekstensi.
  - Contoh: `petani sedang menanam padi.png`
  - Spasi di akhir atau spasi ganda **tidak masalah** (otomatis dikenali).

### 2. Simpan di folder ini
```
ular-tangga-hutan/assets/sketches/
```

### 3. Jalankan pendaftaran otomatis
Dari folder `ular-tangga-hutan`, jalankan:

```bash
node generate-custom-sketches.js
```

Perintah ini mencocokkan nama file dengan teks soal, lalu menulis ulang
`assets/sketches/custom-sketches.js`. Setelah itu cukup **refresh browser**.

> Kalau ada gambar yang belum cocok, pesan di terminal akan memberi tahu.
> Soal yang belum punya gambar otomatis memakai sketsa SVG bawaan.

---

## Daftar 26 slot sketsa

Kunci di `custom-sketches.js` = **`nomorKotak-nomorSoal`**, misalnya `2-2` = Kotak 2 Soal 2.

| Kotak | Soal | Kunci | Isi gambar (nama file) |
|---:|---:|---|---|
| 2 | 2 | `2-2` | petani sedang menanam padi |
| 5 | 2 | `5-2` | sopir truk sedang mengirim barang |
| 7 | 2 | `7-2` | anak sedang makan roti |
| 9 | 2 | `9-2` | ikan hasil tangkapan nelayan |
| 10 | 2 | `10-2` | tukang cukur sedang memotong rambut |
| 12 | 2 | `12-2` | nelayan sedang menangkap ikan |
| 14 | 2 | `14-2` | kurir mengantarkan paket |
| 15 | 2 | `15-2` | siswa sedang menggunakan pensil untuk menulis |
| 17 | 2 | `17-2` | pekerja pabrik sedang membuat sepatu |
| 19 | 2 | `19-2` | pedagang sedang menjual sayuran di pasar |
| 21 | 2 | `21-2` | dokter sedang memeriksa pasien |
| 23 | 2 | `23-2` | sepiring nasi putih |
| 24 | 2 | `24-2` | seseorang sedang minum air |
| 26 | 2 | `26-2` | truk mengangkut barang ke toko |
| 28 | 2 | `28-2` | buku tulis |
| 30 | 2 | `30-2` | tukang ojek sedang mengantar penumpang |
| 32 | 2 | `32-2` | pekerja sedang membuat roti di pabrik |
| 34 | 2 | `34-2` | siswa sedang membeli makanan di kantin |
| 36 | 2 | `36-2` | pakaian |
| 38 | 2 | `38-2` | peternak sedang memerah susu sapi |
| 40 | 2 | `40-2` | ibu sedang memasak sayur untuk keluarga |
| 42 | 2 | `42-2` | tukang kayu sedang membuat kursi |
| 43 | 2 | `43-2` | penumpang sedang naik bus |
| 45 | 2 | `45-2` | pengrajin sedang membuat anyaman bambu |
| 47 | 2 | `47-2` | seseorang sedang membeli obat di apotek |
| 50 | 2 | `50-2` | petani, pedagang, dan pembeli |

---

## Templat
`contoh-sketsa.svg` bisa dibuka sebagai contoh rasio dan gaya warna.

Kalau bank soal berubah, jalankan juga:

```bash
node generate-questions.js
node generate-custom-sketches.js
```
