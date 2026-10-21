/**
 * Audit rute — menjaga app/rute.json tetap sinkron dengan kenyataan.
 *
 * Kenapa perlu: rute, judul, dan sitemap kini berasal dari satu berkas JSON.
 * Berkas data yang tidak diperiksa akan menyimpang perlahan: rute baru lupa
 * didaftarkan, path ganda, atau id yang tidak dikenali komponen.
 *
 * Kenapa dua berkas sumber: 'jelajah', 'glosarium', dan 'panduan' dirender
 * langsung sebagai cabang di cangkang.tsx, sedangkan 'belajar', 'kuis', dan
 * 'flashcard' diteruskan sebagai prop awal ke Akademi di akademi.tsx. Memeriksa
 * cangkang saja akan melaporkan tiga rute sah sebagai yatim.
 *
 * Yang DITEGAKKAN (gagal = exit 1):
 *   1. Setiap id di JSON benar-benar dirujuk cangkang.tsx atau akademi.tsx.
 *   2. Path unik, diawali '/', tanpa garis miring di akhir, tanpa query.
 *   3. Tepat satu rute berpath '/', dan itu rute jelajah.
 *   4. Judul dan deskripsi tidak kosong serta berada di rentang panjang sehat
 *      untuk hasil pencarian (judul <= 60 karakter, deskripsi 50-160).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(akar, 'app', 'rute.json'), 'utf8'));
const sumber = [
  readFileSync(join(akar, 'app', 'cangkang.tsx'), 'utf8'),
  readFileSync(join(akar, 'app', 'akademi.tsx'), 'utf8'),
].join('\n');
const RUTE = data.rute;

let gagal = 0;
const catat = (pesan) => { gagal++; console.error(`✗ ${pesan}`); };

if (!Array.isArray(RUTE) || RUTE.length === 0) {
  console.error('✗ app/rute.json tidak memuat daftar rute.');
  process.exit(1);
}

// 1. Setiap rute harus benar-benar dirender salah satu komponen.
for (const r of RUTE) {
  const pola = new RegExp(`['\"]${r.id}['\"]`);
  if (!pola.test(sumber)) {
    catat(`rute '${r.id}' ada di rute.json tetapi tidak dirujuk cangkang.tsx maupun akademi.tsx`);
  }
}

// 2. Bentuk path.
const terlihat = new Set();
for (const r of RUTE) {
  if (typeof r.path !== 'string' || !r.path.startsWith('/')) {
    catat(`rute '${r.id}': path harus diawali '/' (dapat '${r.path}')`);
    continue;
  }
  if (r.path.length > 1 && r.path.endsWith('/')) {
    catat(`rute '${r.id}': path tidak boleh berakhir dengan '/'`);
  }
  if (r.path.includes('?') || r.path.includes('#')) {
    catat(`rute '${r.id}': path tidak boleh memuat query atau fragmen`);
  }
  if (terlihat.has(r.path)) catat(`path ganda: '${r.path}'`);
  terlihat.add(r.path);
}

// 3. Tepat satu rute beranda, dan itu jelajah.
const beranda = RUTE.filter((r) => r.path === '/');
if (beranda.length !== 1) {
  catat(`harus tepat satu rute berpath '/', ditemukan ${beranda.length}`);
} else if (beranda[0].id !== 'jelajah') {
  catat(`rute berpath '/' harus 'jelajah', bukan '${beranda[0].id}'`);
}

// 4. Panjang judul & deskripsi.
for (const r of RUTE) {
  const judul = String(r.judul ?? '').trim();
  const deskripsi = String(r.deskripsi ?? '').trim();
  if (!judul) catat(`rute '${r.id}': judul kosong`);
  else if (judul.length > 60) catat(`rute '${r.id}': judul ${judul.length} karakter (>60, terpotong di hasil pencarian)`);
  if (!deskripsi) catat(`rute '${r.id}': deskripsi kosong`);
  else if (deskripsi.length < 50) catat(`rute '${r.id}': deskripsi ${deskripsi.length} karakter (<50, terlalu tipis)`);
  else if (deskripsi.length > 160) catat(`rute '${r.id}': deskripsi ${deskripsi.length} karakter (>160, terpotong)`);
}

if (gagal) {
  console.error(`\n${gagal} pelanggaran rute.`);
  process.exit(1);
}
console.log(`✓ ${RUTE.length} rute sah: path unik, satu beranda, judul & deskripsi dalam rentang.`);
