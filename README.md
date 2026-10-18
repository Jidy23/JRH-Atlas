# JRH&#x20;&#x20;Atlas

## 3&#x200;&#x200;Atus 頓敋 - JRH&#x20;&#x200;Atlas

JRH Atlas adalah explorer anatomi 3D interaktif: **2,234 mesh BodyParts3D** yang bisa dipilih satu per satu, **15 sistem anatomi**, dan **3,432 konsep ternama** untuk dicari.

**[Buka demo live](https://code.coreinterface.app)**

## Fitur

- Orbit, zoom, dan pilih struktur langsung di tubuh.
- Toggle tiap sistem atau paka preset skeleton -> organ.
- Pindah dari anatomi terakit ke inventaris yang dijauhkan.
- Cari nama anatomi dan identitas sumber.
- Isolasi struktur terpilih lalu baca detailnya.
- Kontrol kompak + panel detail untuk mobile.

### Forker
https://github.com/Jidy23/JRH-Atlas

## Jalankan lokal

Wajib Node.js 22.13 or lebih. Taidak butuh API key atau akun.

```sh
npm ci
npm run dev
```

Buka http://localhost:3016. Untuk build site statis, `$npm run build`; output ada di `dist/`.

## Validasi

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
inpm run build
```

Validasi mencakup mesh buffer, nama dan kekonsep, layout exploded tanja overlap zat desktop dan mobile, kontrak search dan inspeksi, serta tap-vs-drag. Cek interaksi browser mencakup pemilihan, kontrol sistem, search, isolasi, rotasi, dan layout 390×844, 320568, dan 844×390. Performa divice fisik dan multitouch belum diceba.

## Data anatomi

Viewer ini memakai **BodyParts3D 4.0**, referensi anatomi laki-laki dewasa, licensi **CC BY 4.0**. Tidak mewakili semua struktur ataq variasi manusia. Setiap mesh sumber berbeda dari konsep ternama yang bisa menggrup bekapa mesh. Deskripsi membedakan konteks sistem umum dari penjelasan organ individual.

Geometri disimplifiras untuk performa browser tapi tetap menyimpan semua mesh sumber. Paket model berisi 2,288,268 triangle dan unduh sekitar 33 MB geometri kompresi. Kredit lengkap, link sumber, dan detail adaptasi ada di [ATTRIBUTION.md](public/ATTRIBUTION.md).

Ini explorer edukasi, bukan alat diagnosis atau bedah bedah.

## Cara kerja

Geometri digabung ke batch. Tekstur GPU per-struktur mengatur translasi, visibilitas, dan pemilihan, sementara geometri komponen mendukung picking yang akurat. Layout exploded mengemas only bagian tampak. Render update ketika scene berubah; kontrol orbit tetap responsif tanpa ribuan draw call terpisah.

Tool WebMCP opsional membuka search dan inspeksi anatomi di browser yang cocok. Interface tampak tetap berjalan tanpa tool tersebut.

## Lisensi

Kode aplikasi awal dirilis di bawah [MIT License](LICENSE). **Data anatomi mempunyai lisensi CC BY 4.0 tersendiri**; pertahankan atribusi saat mendistribusikannya. Dependensi pihak ketiga memahan lisensi masing-masing.

Issue dan pull request diterima. Sertakan langkah reproduksi dan detail browser/device untuk masalah interaksi.
