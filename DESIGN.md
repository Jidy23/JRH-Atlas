# DESIGN.md - JRH Atlas

Arah desain tertulis. Tanpa dokumen ini, audit anti-slop R-37 menandai seluruh UI
sebagai "draft without direction" dan memaksa dial ENERGY 1 / RHYTHM 1 / MOTION 1.

## Design Read

Reading this as: **penjelajah anatomi 3D** untuk **pelajar Indonesia SD sampai SMA**
(usia 9 sampai 18 tahun, banyak yang membuka dari ponsel kelas menengah), gaya
**studio ilmiah yang tenang dan rapi**, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

## Dial

| Dial | Nilai | Alasan |
|---|---|---|
| ENERGY | 2 (Balanced) | Objek utamanya model 3D yang rumit. UI harus tenang supaya mata fokus ke anatomi, tapi tidak boleh sekosong GOV.UK karena audiensnya pelajar. |
| RHYTHM | 2 (konsisten + sedikit break) | Panel kiri, kanvas tengah, kontrol kanan mengikuti ritme tetap. Satu break disengaja: viewer full-bleed tanpa padding supaya model terasa besar. |
| MOTION | 1 (hover saja) | Animasi pada aplikasi belajar berisiko mengalihkan perhatian dan memicu mabuk gerak. Hanya transisi 150ms pada hover dan fokus. `prefers-reduced-motion` mematikan semuanya. |

## Palet dan psikologi warna

Lima palet ada karena satu warna tidak bisa melayani lima mood belajar yang berbeda.
Semua aksen dipilih pada kecerahan cukup tinggi agar kontras terhadap latar gelap
maupun terang lolos WCAG AA (diverifikasi `scripts/audit-kontras.ts` di CI).

| Palet | Aksen | Alasan psikologis |
|---|---|---|
| Bawaan (sian) | `#22d3ee` | Sian diasosiasikan dengan teknologi, kebersihan, dan klinis. Cocok untuk aplikasi medis tanpa terasa dingin seperti biru murni. |
| Samudra | `#38bdf8` | Biru laut menurunkan arousal, membantu sesi belajar panjang dan membaca teks panjang. |
| Senja | `#fb7185` | Merah muda hangat memberi rasa akrab dan personal, untuk pengguna yang merasa sains itu jauh. |
| Zamrud | `#34d399` | Hijau menandakan pertumbuhan dan kesehatan, sejalan dengan tema tubuh manusia. |
| Koral | `#f472b6` | Kontras tinggi terhadap latar gelap, untuk pengguna yang butuh pembeda visual kuat. |

Latar tidak memakai hitam atau putih murni. Mode Gelap memakai `#0a0f1c` (biru malam
bertint) dan mode Terang memakai `#f7f5f0` (kertas hangat), karena hitam murni
menyebabkan halasi pada teks terang dan putih murni melelahkan mata saat membaca lama.

## Motif identitas

Satu motif: **garis tipis 1px sebagai pemisah struktur**. Dipakai di panel, footer,
dan kartu. Alasan: meniru garis anatomi pada atlas kedokteran, dan menggantikan
kebutuhan akan bayangan bertumpuk.

## Aturan yang mengikat

1. Setiap warna dibaca dari token `tema.css`, tidak pernah literal di komponen. Ini
yang membuat lima palet dan dua mode bekerja tanpa menduplikasi CSS.
2. Satu focal action per layar. Saat ini `.primary-action` dan `.tombol.utama`.
Gradien hanya diizinkan di sana.
3. Tidak ada glow, tidak ada bayangan dekoratif berlapis. Hierarki dibawa oleh
kontras, ukuran, dan spasi, bukan cahaya.
4. Teks sekunder selalu memakai `--muted-foreground`, token yang sudah diaudit
kontrasnya. Tidak ada abu literal di komponen.
5. Target sentuh minimum 44px, dan ini diuji otomatis di `scripts/ui-mobile-browser.mjs`.
6. Tiga state wajib untuk setiap tampilan berdata: kosong, memuat, gagal. Contoh
pola ada di `cangkang.tsx` (`ViewerBoundary` untuk gagal, `Suspense` untuk memuat).

## Yang sengaja tidak dipakai

- Inter, Arial, atau font sistem sebagai font utama tanpa alasan brand.
- Gradient ungu ke biru sebagai warna utama.
- Kartu di dalam kartu.
- Semua elemen berbentuk pil.
- Side-tab border berwarna di tepi kiri kartu.
- Bounce atau elastic easing.

## Berkas acuan

- `app/tema.css`: token palet dan mode.
- `app/globals.css`: tata letak viewer 3D.
- `app/akademi.css`: ruang belajar.
- `app/polish.css`: lapisan koreksi hasil audit, tiap baris punya alasan.
