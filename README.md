# JRH Atlas

**Atlas anatomi 3D interaktif berbahasa Indonesia** untuk pelajar SD, SMP, SMA, dan siapa saja yang ingin memahami tubuh manusia.

Dibangun di atas [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/) (CC BY 4.0) dan engine 3D dari proyek open-source [human-atlas](https://github.com/ashemag/human-atlas).

---

## Apa yang bisa dilakukan

| Tab | Fungsi |
|---|---|
| 🧭 **Jelajah 3D** | 2.234 mesh dapat dipilih, 15 sistem organ, pencarian, exploded view |
| 📖 **Belajar** | Tur terpandu 5 sampai 8 menit, terpisah per jenjang SD / SMP / SMA |
| 🎯 **Kuis** | Soal pilihan ganda dengan penjelasan di setiap jawaban |
| 🗂️ **Flashcard** | Tiga mode: tebak nama, fungsi, atau fakta organ. Progres tersimpan |
| 📚 **Glosarium** | Kamus istilah anatomi Inggris ke Indonesia, pencarian dua bahasa |
| ℹ️ **Panduan** | Cara pakai, alur belajar, dan catatan penting |

Setiap tab punya path sendiri (`/belajar`, `/kuis`, `/flashcard`, `/glosarium`,
`/panduan`, `/`). Tautan lama berbentuk `?tab=kuis` tetap dihormati dan
dipindahkan ke path aslinya tanpa menambah riwayat.

Satu organ juga bisa ditautkan langsung: `/jelajah?organ=heart`. Nilainya
diperiksa ke kurikulum, jadi nama yang tidak dikenal diabaikan alih-alih
membuka struktur lain secara diam-diam.

---

## Mengapa dibuat

Materi anatomi di sekolah memakai istilah ilmiah (bahasa Inggris/Latin),
sedangkan aplikasi atlas populer juga berbahasa Inggris. JRH Atlas menutup
celah itu:

- **Bahasa Indonesia baku** di seluruh antarmuka dan penjelasan.
- **Disusun per jenjang**, mengikuti kapan materi itu muncul di sekolah.
- **Menggunakan satuan dan contoh lokal** (liter, °C, m²).
- **Gratis, tanpa akun, tanpa iklan, tanpa pelacakan.**

---

## Menjalankan lokal

Butuh Node.js 22.13 atau lebih baru.

```sh
npm ci
npm run dev
```

Buka http://localhost:3016.

Build statis:

```sh
npm run build   # output di dist/
```

---

## Struktur lapisan belajar

```
app/
  kurikulum.ts      data organ: istilah Indonesia, jenjang, fungsi, fakta, mitos, soal
  soal-tambahan.ts  bank soal tambahan, 21 butir, 7 per jenjang
  belajar.ts        3 tur terpandu (SD, SMP, SMA)
  kuis.ts           bank soal, penilaian, predikat, deck flashcard, jadwal ulang
  progres.ts        progres belajar di localStorage: skema berversi, jadwal ulang
  istilah.ts        kamus Inggris-Indonesia + pencarian dua bahasa
  akademi.tsx       UI Belajar / Kuis / Flashcard
  halaman.tsx       halaman Glosarium dan Panduan
  rute.json         satu sumber path, judul, deskripsi, dan sitemap
  meta.ts           metadata per rute (title, kanonik, og, twitter, JSON-LD)
  cangkang.tsx      tab bar dan routing berbasis path
  akademi.css       gaya ruang belajar
  ekstra.css        gaya glosarium, pencarian, panduan
```

Lapisan ini terpisah dari viewer 3D (`page.tsx`, `scene.tsx`), jadi update
pembelajaran tidak menyentuh engine render.

---

## Aset model dan cache

Setiap chunk disimpan **dua kali** di `public/models/`: `body-N.bin` (mentah)
dan `body-N.bin.gz`. Keduanya wajib ada, karena penampil memakai `.gz` bila
browser punya `DecompressionStream` dan jatuh ke `.bin` bila tidak. Konsekuensinya
repo ini menyimpan sekitar 93 MB dari total 111 MB, dan setiap chunk baru
membebani dua kali. `npm run audit:aset` mengukur ukuran nyata dan gagal bila
melewati `scripts/anggaran.json`.

Header cache ada di dua tempat karena formatnya berbeda per host:

- `public/_headers` untuk Cloudflare Pages.
- `vercel.json` bagian `headers` untuk Vercel.

Keduanya memberi `immutable` hanya pada `/assets/*` dan `/models/body-*` (nama
berkas berisi hash isi), sementara `atlas.json` dan HTML sengaja tidak di-cache
lama supaya metadata per rute tidak basi.

---

## Menambah materi

1. Tambahkan entri di `app/kurikulum.ts` (satu objek per organ).
2. Soal kuis dan kartu flashcard dibuat otomatis dari entri tersebut.
3. Untuk soal tambahan di luar kurikulum, tambahkan butir di `app/soal-tambahan.ts` dan sebar posisi jawaban benarnya. Kuis mengacak urutan soal dan urutan pilihan, tetapi posisi di data tetap harus seimbang supaya tidak ada pola yang bisa ditebak.
4. Untuk tur baru, tambahkan objek di `app/belajar.ts`.
5. Untuk istilah baru, tambahkan pasangan di `app/istilah.ts`.

---

## Validasi

```sh
npm run check           # typecheck TypeScript
npm run build           # build produksi + prerender per rute
npm run audit:rute      # path, judul, deskripsi tiap rute
npm run audit:aset      # anggaran ukuran chunk dan katalog model
npm run audit:kontras   # kontras WCAG AA tiap pasangan warna
npm run audit:token     # warna komponen harus dari token, bukan literal
npm run audit:skala     # token spasi/radius/huruf/gerak, ratchet px ajaib
npm run audit:soal      # sebaran kunci jawaban bank soal
npm run audit:progres   # jadwal ulang dan penyimpanan progres belajar
```

Semua perintah audit di atas dijalankan di CI (`.github/workflows/cek.yml`) pada
setiap push ke `main` dan setiap pull request.

---

## Lisensi & atribusi

- **Kode aplikasi:** MIT (lihat [LICENSE](LICENSE)).
- **Data anatomi BodyParts3D:** CC BY 4.0, atribusi wajib dipertahankan.
  Detail di [public/ATTRIBUTION.md](public/ATTRIBUTION.md).

---

## Catatan

JRH Atlas adalah **alat belajar**, bukan alat diagnosis. Untuk keluhan kesehatan,
konsultasikan ke tenaga medis.
