/**
 * Audit teks yang dilihat pengguna.
 *
 * Kenapa perlu: `scripts/audit-rute.mjs` sudah memeriksa panjang judul dan
 * deskripsi, tetapi tidak pernah memeriksa apakah isinya masih benar. Batch 5
 * mengubah jadwal ulang flashcard dari 1-3-7 hari menjadi 3 sampai 21 hari,
 * namun dua tempat tetap menjanjikan angka lama dan lolos CI:
 *   - app/rute.json, deskripsi rute flashcard (dipakai meta description,
 *     JSON-LD, dan HTML hasil prerender, jadi ikut terbaca mesin pencari);
 *   - app/halaman.tsx, langkah 5 di halaman Panduan.
 * Janji yang tidak cocok dengan perilaku lebih buruk daripada tidak menjanjikan
 * apa pun: pengguna menandai kartu hafal, mengharapkannya kembali dalam 7 hari,
 * dan tidak pernah melihatnya lagi sampai hari ke-21.
 *
 * Berkas ini sengaja memakai daftar frasa terlarang, bukan pencocokan pola
 * angka. Frasa yang salah harus ditambahkan secara sadar beserta alasannya,
 * sehingga audit ini tidak pernah "hijau" hanya karena polanya tidak cocok.
 *
 * Setiap temuan menyebut berkas dan barisnya, supaya perbaikan tidak menebak.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Berkas yang memuat teks untuk pengguna, dan karenanya harus jujur. */
const BERKAS = [
  'app/rute.json',
  'app/halaman.tsx',
  'app/akademi.tsx',
  'app/cangkang.tsx',
  'README.md',
];

/**
 * Frasa yang sudah terbukti tidak sesuai perilaku aplikasi.
 * `karena` wajib: frasa tanpa alasan akan dihapus orang berikutnya tanpa pikir.
 */
const TERLARANG = [
  {
    frasa: '1\u20133\u20137',
    karena:
      'Jadwal ulang sebenarnya 3, 6, 9, 12, 15, 18, lalu mentok 21 hari ' +
      '(nextReview di app/progres.ts). Sebut rentangnya, jangan urutan lama.',
  },
  {
    frasa: '1-3-7',
    karena:
      'Sama seperti di atas, hanya beda tanda hubung. Jangan dihidupkan lagi.',
  },
  {
    frasa: 'jeda 3 hari',
    karena:
      'Hanya benar untuk penandaan hafal pertama. Penandaan berikutnya 6 hari ' +
      'atau lebih, jadi kalimat yang menyebut 3 hari saja menyesatkan.',
  },
];

let gagal = 0;

function catat(pesan) {
  gagal++;
  console.error(`\u2717 ${pesan}`);
}

/** Nomor baris 1-based supaya bisa langsung dibuka di editor. */
function barisKe(teks, indeks) {
  let n = 1;
  for (let i = 0; i < indeks; i++) if (teks[i] === '\n') n++;
  return n;
}

let diperiksa = 0;
for (const nama of BERKAS) {
  let isi;
  try {
    isi = readFileSync(join(akar, nama), 'utf8');
  } catch {
    // Berkas yang hilang adalah temuan tersendiri: daftar di atas harus
    // mencerminkan repo, bukan kenangan penulisnya.
    catat(`${nama}: tidak bisa dibaca (berkas hilang atau dipindah?)`);
    continue;
  }
  diperiksa++;
  for (const { frasa, karena } of TERLARANG) {
    let dari = 0;
    for (;;) {
      const pos = isi.indexOf(frasa, dari);
      if (pos === -1) break;
      catat(`${nama}:${barisKe(isi, pos)} memuat "${frasa}". ${karena}`);
      dari = pos + frasa.length;
    }
  }
}

if (gagal) {
  console.error(`\n${gagal} teks pengguna tidak sesuai perilaku aplikasi.`);
  process.exit(1);
}
console.log(`\u2713 ${diperiksa} berkas teks: tidak ada janji usang.`);
