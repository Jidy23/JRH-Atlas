# JRH Atlas

**Atlas anatomi 3D interaktif berbahasa Indonesia** — untuk pelajar SD, SMP, SMA, dan siapa saja yang ingin memahami tubuh manusia.

Dibangun di atas [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/) (CC BY 4.0) dan engine 3D dari proyek open-source [human-atlas](https://github.com/ashemag/human-atlas).

---

## Apa yang bisa dilakukan

| Tab | Fungsi |
|---|---|
| 🧭 **Jelajah 3D** | 2.234 mesh dapat dipilih, 15 sistem organ, pencarian, exploded view |
| 📖 **Belajar** | Tur terpandu 5–8 menit, terpisah per jenjang SD / SMP / SMA |
| 🎯 **Kuis** | Soal pilihan ganda dengan penjelasan di setiap jawaban |
| 🃏 **Flashcard** | Tiga mode: tebak nama, fungsi, atau fakta organ |
| 📚 **Glosarium** | Kamus istilah anatomi Inggris → Indonesia + pencarian dua bahasa |
| ℹ️ **Panduan** | Cara pakai, alur belajar, dan catatan penting |

Setiap tab punya URL sendiri, misal `?tab=kuis` atau `?tab=belajar`.

---

## Mengapa dibuat

Materi anatomi di sekolah memakai istilah ilmiah (bahasa Inggris/Latin), sedangkan aplikasi atlas populer juga berbahasa Inggris. JRH Atlas menutup celah itu:

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
  kurikulum.ts   data organ: istilah Indonesia, jenjang, fungsi, fakta, mitos, soal
  belajar.ts     3 tur terpandu (SD, SMP, SMA)
  kuis.ts        bank soal, penilaian, predikat, deck flashcard
  istilah.ts     kamus Inggris-Indonesia + pencarian dua bahasa
  akademi.tsx    UI Belajar / Kuis / Flashcard
  halaman.tsx    halaman Glosarium dan Panduan
  cangkang.tsx   tab bar dan routing ?tab=
  akademi.css    gaya ruang belajar
  ekstra.css     gaya glosarium, pencarian, panduan
```

Lapisan ini terpisah dari viewer 3D (`page.tsx`, `scene.tsx`), jadi update pembelajaran
 tidak menyentuh engine render.

---

## Menambah materi

1. Tambahkan entri di `app/kurikulum.ts` (satu objek per organ).
2. Soal kuis dan kartu flashcard dibuat otomatis dari entri tersebut.
3. Untuk tur baru, tambahkan objek di `app/belajar.ts`.
4. Untuk istilah baru, tambahkan pasangan di `app/istilah.ts`.

---

## Validasi

```sh
npm run check
npm run build
```

---

## Lisensi & atribusi

- **Kode aplikasi:** MIT (lihat [LICENSE](LICENSE)).
- **Data anatomi BodyParts3D:** CC BY 4.0 — atribusi wajib dipertahankan.
  Detail di [public/ATTRIBUTION.md](public/ATTRIBUTION.md).

---

## Catatan

JRH Atlas adalah **alat belajar**, bukan alat diagnosis. Untuk keluhan kesehatan,
konsultasikan ke tenaga medis.
