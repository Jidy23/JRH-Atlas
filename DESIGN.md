# DESIGN.md - JRH Atlas

Arah desain tertulis. Tanpa dokumen ini, audit anti-slop R-37 menandai seluruh UI
sebagai "draft without direction" dan memaksa dial ENERGY 1 / RHYTHM 1 / MOTION 1.

## Design Read

Reading this as: **penjelajah anatomi 3D** untuk **pelajar Indonesia SD sampai SMA**
(usia 9 sampai 18 tahun, banyak yang membuka dari ponsel kelas menengah), gaya
**studio ilmiah yang berani secara visual dan tenang secara gerak**, dial
**ENERGY 3 / RHYTHM 3 / MOTION 1**.

## Dial

| Dial | Nilai | Alasan |
|---|---|---|
| ENERGY | 3 (Bold) | Objeknya model 3D yang rumit, jadi UI harus tegas memisahkan diri dari kanvas: kontras tinggi, garis jujur, tipografi berani. Energi tidak boleh datang dari gerak atau cahaya. |
| RHYTHM | 3 (tetap dengan satu break tegas) | Panel kiri, kanvas tengah, kontrol kanan mengikuti ritme tetap, dengan satu break yang disengaja: viewer full-bleed tanpa padding supaya model terasa besar. |
| MOTION | 1 (hover saja) | Gerak adalah sumber utama rasa tidak stabil dan tidak nyaman. Hanya transisi 150ms pada hover dan fokus. `prefers-reduced-motion` mematikan semuanya. |

### Kenapa ENERGY naik tetapi MOTION tidak

Permintaan terakhir meminta dua hal yang menarik ke arah berlawanan: "premium,
playful, warna tebal jelas, detail" di satu sisi, dan "nyaman, smooth, stabil" di
sisi lain. Penyelesaiannya bukan kompromi di tengah, tetapi memisahkan sumbu:

- **Keberanian dipindahkan ke bentuk statis** — kontras, ukuran huruf, ketebalan
garis, kepadatan informasi. Ini yang membuat antarmuka terasa premium dan playful
tanpa bergerak.
- **Gerak tetap di MOTION 1.** Animasi masuk, auto-rotate, dan parallax adalah
tiga hal yang paling cepat membuat aplikasi terasa murah sekaligus memicu mabuk
gerak pada pengguna muda.

Konsekuensi yang harus diterima: aplikasi ini tidak akan terasa "hidup" karena
animasi. Kalau suatu saat gerak dibutuhkan, naikkan MOTION ke 2 secara sadar dan
perbarui tabel ini — jangan menambah animasi diam-diam di satu komponen.

## Palet dan psikologi warna

Lima palet ada karena satu warna tidak bisa melayani lima mood belajar yang berbeda.
Semua aksen dipilih pada kecerahan cukup tinggi agar kontras terhadap latar gelap
maupun terang lolos WCAG AA (diverifikasi `scripts/audit-kontras.ts` di CI).

| Palet | Aksen dekoratif | Aksen non-teks | Alasan psikologis |
|---|---|---|---|
| Bawaan (sian) | `#22d3ee` | `#0891b2` | Sian diasosiasikan dengan teknologi, kebersihan, dan klinis. Cocok untuk aplikasi medis tanpa terasa dingin seperti biru murni. |
| Samudra | `#38bdf8` | `#0284c7` | Biru laut menurunkan arousal, membantu sesi belajar panjang dan membaca teks panjang. |
| Senja | `#fb7185` | `#e11d48` | Merah muda hangat memberi rasa akrab dan personal, untuk pengguna yang merasa sains itu jauh. |
| Zamrud | `#34d399` | `#059669` | Hijau menandakan pertumbuhan dan kesehatan, sejalan dengan tema tubuh manusia. |
| Koral | `#f472b6` | `#db2777` | Kontras tinggi terhadap latar gelap, untuk pengguna yang butuh pembeda visual kuat. |

Aksen dekoratif boleh terang karena hanya dipakai untuk isian lembut dan gradien.
Aksen non-teks dipakai untuk indikator yang harus terlihat sebagai bentuk, jadi
wajib lolos WCAG 1.4.11 (3:1) dan dipilih lebih gelap di mode terang.

Latar tidak memakai hitam atau putih murni. Mode Gelap memakai `#0a0f1c` (biru malam
bertint) dan mode Terang memakai `#f7f5f0` (kertas hangat), karena hitam murni
menyebabkan halasi pada teks terang dan putih murni melelahkan mata saat membaca lama.

## Motif identitas

Satu motif: **garis tipis 1px sebagai pemisah struktur**. Dipakai di panel, footer,
dan kartu. Alasan: meniru garis anatomi pada atlas kedokteran, dan menggantikan
kebutuhan akan bayangan bertumpuk.

Ikon navigasi digambar sebagai SVG satu keluarga: viewBox 24, stroke 1,7px,
`stroke-linecap: round`, tanpa isian. Alasan: glyph tipografi (◎ ▤ ✓ ▱ Aa ?)
punya bobot dan baseline berbeda-beda, sehingga bar navigasi terbaca tidak sejajar
walaupun ukurannya sama.

## Skala

Satu sumber untuk spasi, radius, ukuran huruf, elevasi, z-index, dan gerak:
`app/skala.css`. Dimuat paling awal dari `web/main.tsx`.

| Kelompok | Token | Nilai |
|---|---|---|
| Spasi | `--sp-1` … `--sp-12` | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px |
| Radius | `--r-1` … `--r-5`, `--r-pil` | 8, 12, 16, 20, 28px, 999px |
| Huruf | `--t-1` … `--t-10` | 10, 11, 12, 13, 14, 16, 20, 26, 32, 40px |
| Line-height | `--lh-ketat` … `--lh-longgar` | 1.15, 1.3, 1.6, 1.75 |
| Tracking | `--tr-ketat` … `--tr-kaps` | -0.02em, 0, 0.08em, 0.14em |
| Elevasi | `--e-1` … `--e-4` | empat tingkat, tanpa glow |
| Z-index | `--z-dasar` … `--z-lompat` | 0, 10, 30, 40, 100, 950, 2000 |
| Gerak | `--d-instan` … `--d-lambat` | 80, 150, 200, 300ms |
| Tata letak | `--header-h`, `--nav-w`, `--pad-konten`, `--lebar-baca` | 64px, clamp, clamp, 68ch |

`--r-pil` hanya untuk chip dan status. DESIGN.md melarang "semua elemen berbentuk
pil", jadi tombol dan kartu tidak memakainya.

`scripts/audit-skala.mjs` memeriksa tiga hal di CI: kelengkapan token, bahwa setiap
`var(--sp-*)`/`var(--r-*)`/`--t-*`/`--e-*`/`--z-*`/`--d-*` yang dipakai benar-benar
terdefinisi, dan bahwa `skala.css` adalah impor CSS pertama di `web/main.tsx`.
Skrip itu juga **mencetak** jumlah nilai px ajaib per berkas sebagai utang migrasi.
Angka itu belum menjadi ratchet; ratchet dipasang setelah migrasi Fase 2 selesai,
karena baseline harus diukur, bukan ditebak.

## Premium dan compact

Dua kata ini sering bertengkar: "premium" mendorong padding 32px, "compact"
mendorong 12px. Penyelesaiannya memisahkan **level**:

- **Kepadatan antar-kelompok tetap lega** — 24px atau 32px antar blok. Ini yang
membuat halaman terasa mahal.
- **Kepadatan di dalam kelompok dinaikkan** — baris data 36px (bukan 44px), label
11px, ikon 16px. Ini yang membuat informasi terasa banyak tanpa sesak.
- **Premium dibawa detail mikro**, bukan hiasan: tracking negatif konsisten pada
judul, `tabular-nums` pada setiap angka yang berubah, garis 1px yang jujur,
radius yang konsisten, dan font yang di-host sendiri.

Yang tidak boleh: memotong padding antar-kelompok demi "compact", atau menambah
glow dan bayangan berlapis demi "premium".

## Aturan yang mengikat

1. Setiap warna dibaca dari token `tema.css`, tidak pernah literal di komponen. Ini
yang membuat lima palet dan dua mode bekerja tanpa menduplikasi CSS.
2. Satu focal action per layar. Saat ini `.primary-action` dan `.tombol.utama`.
Gradien hanya diizinkan di sana, dan hanya lewat token `--gradien-fokus` supaya
setiap ujungnya bisa diaudit.
3. Tidak ada glow, tidak ada bayangan dekoratif berlapis. Hierarki dibawa oleh
kontras, ukuran, dan spasi, bukan cahaya. ENERGY 3 dicapai lewat ketebalan garis
dan kontras, bukan lewat pendaran.
4. Teks sekunder selalu memakai `--muted-foreground`, token yang sudah diaudit
kontrasnya. Tidak ada abu literal di komponen.
5. Target sentuh minimum 44px, dan ini diuji otomatis di `scripts/ui-mobile-browser.mjs`.
6. Tiga state wajib untuk setiap tampilan berdata: kosong, memuat, gagal. Contoh
pola ada di `cangkang.tsx` (`ViewerBoundary` untuk gagal, `Suspense` untuk memuat).
7. Indikator non-teks (cincin fokus, titik status, indikator tab aktif, isian
progres, ibu jari scrollbar, batas bidang input) memakai `--aksen-nonteks` atau
`--v-kontrol-garis`, **tidak pernah** `--aksen` mentah. Aksen mentah `#22d3ee`
hanya 1,63:1 di latar terang dan gagal ambang 3:1. Audit menegakkan ini.
8. Setiap nilai spasi, radius, ukuran huruf, elevasi, z-index, dan durasi dibaca
dari `app/skala.css`. Nilai px baru yang ditulis langsung di komponen adalah
utang, bukan pilihan.
9. Tidak ada berkas CSS yang mendeklarasikan `font-family` sendiri. Semua membaca
`--font-sans`. Ditegakkan `scripts/audit-skala.mjs`.
10. `app/skala.css` tidak boleh memuat warna. Rumah warna adalah `tema.css`.

## Yang sengaja tidak dipakai

- Inter, Arial, atau font sistem sebagai font utama tanpa alasan brand.
- Gradient ungu ke biru sebagai warna utama.
- Kartu di dalam kartu.
- Semua elemen berbentuk pil.
- Side-tab border berwarna di tepi kiri kartu.
- Bounce atau elastic easing.
- Animasi masuk, auto-rotate sebagai default, dan parallax.

## Berkas acuan

- `app/skala.css`: spasi, radius, tipografi, elevasi, z-index, gerak.
- `app/tema.css`: token palet dan mode.
- `app/globals.css`: tata letak viewer 3D.
- `app/akademi.css`: ruang belajar.
- `app/redesign.css`: tata letak aplikasi, bar navigasi, dan ikon.
- `app/polish.css`: lapisan koreksi hasil audit, tiap baris punya alasan.
