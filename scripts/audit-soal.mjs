/**
 * Audit bank soal: keseimbangan posisi jawaban dan larangan em dash.
 *
 * Alasan keberadaan skrip ini:
 * `app/kuis.ts` mengacak urutan soal, dan sejak perbaikan level 23 juga mengacak
 * urutan pilihan. Tetapi pengacakan hanya menyamarkan pola, tidak menghapusnya.
 * Sebelum perbaikan, 16 dari 21 soal di bank tambahan menjawab pilihan A, dan
 * seluruh 7 soal jenjang SD menjawab A. Murid bisa menang tanpa membaca soal.
 * Tanpa penjaga otomatis, pola itu akan kembali begitu ada yang menambah soal
 * dengan menyalin butir sebelumnya.
 *
 * Aturan yang ditegakkan:
 * 1. Setiap soal punya tepat 4 pilihan, tanpa duplikat teks.
 * 2. Indeks jawaban berada di rentang pilihan.
 * 3. Dalam satu jenjang, tidak ada satu posisi yang dipakai lebih dari separuh
 *    butir (dibulatkan ke atas). Untuk 7 butir, batasnya 4.
 * 4. Keempat posisi A, B, C, D terpakai minimal sekali di seluruh bank.
 * 5. Tidak ada em dash di teks soal. Teks yang dibaca murid memakai titik dua,
 *    koma, atau kalimat terpisah.
 */
import { readFile } from 'node:fs/promises';

const BERKAS = 'app/soal-tambahan.ts';
const EM_DASH = '\u2014';
const teks = await readFile(BERKAS, 'utf8');
const galat = [];

// Pisahkan berkas per butir soal. Setiap butir diawali `{ key:'...'`.
const butir = teks
  .split(/\{\s*key:\s*'/)
  .slice(1)
  .map((b) => ({
    key: (b.match(/^([^']+)'/) ?? [])[1] ?? '?',
    jenjang: (b.match(/jenjang:\s*'([^']+)'/) ?? [])[1] ?? '?',
    jawaban: Number((b.match(/jawaban:\s*(\d+)/) ?? [])[1]),
    pilihan: (() => {
      const m = b.match(/pilihan:\s*\[([\s\S]*?)\]/);
      if (!m) return [];
      return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
    })(),
  }));

if (!butir.length) galat.push(`${BERKAS}: tidak ada butir soal yang terbaca`);

for (const s of butir) {
  if (s.pilihan.length !== 4) {
    galat.push(`${s.key}: ${s.pilihan.length} pilihan, seharusnya 4`);
  }
  if (new Set(s.pilihan).size !== s.pilihan.length) {
    galat.push(`${s.key}: ada pilihan yang teksnya duplikat`);
  }
  if (!Number.isInteger(s.jawaban) || s.jawaban < 0 || s.jawaban >= s.pilihan.length) {
    galat.push(`${s.key}: indeks jawaban ${s.jawaban} di luar rentang pilihan`);
  }
}

const perJenjang = new Map();
for (const s of butir) {
  if (!perJenjang.has(s.jenjang)) perJenjang.set(s.jenjang, []);
  perJenjang.get(s.jenjang).push(s.jawaban);
}

const laporan = [];
for (const [jenjang, daftar] of [...perJenjang].sort()) {
  const hitung = [0, 0, 0, 0];
  for (const j of daftar) if (j >= 0 && j < 4) hitung[j] += 1;
  const batas = Math.ceil(daftar.length / 2);
  const terbanyak = Math.max(...hitung);
  laporan.push(`${jenjang.toUpperCase()}: ${daftar.length} butir, posisi A/B/C/D = ${hitung.join('/')}`);
  if (terbanyak > batas) {
    galat.push(
      `${jenjang}: satu posisi dipakai ${terbanyak} kali dari ${daftar.length} butir (batas ${batas}). Sebar ulang jawaban benar.`
    );
  }
}

const totalPosisi = [0, 0, 0, 0];
for (const s of butir) if (s.jawaban >= 0 && s.jawaban < 4) totalPosisi[s.jawaban] += 1;
if (totalPosisi.some((n) => n === 0)) {
  galat.push(`posisi jawaban tidak terpakai merata: A/B/C/D = ${totalPosisi.join('/')}`);
}

// Periksa em dash hanya pada baris yang bukan komentar.
const barisKotor = teks.split('\n');
barisKotor.forEach((baris, i) => {
  const tanpaKomentar = baris.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
  if (tanpaKomentar.includes(EM_DASH)) {
    galat.push(`${BERKAS}:${i + 1}: em dash pada teks soal`);
  }
});

console.log(`Audit bank soal: ${butir.length} butir dari ${BERKAS}`);
for (const baris of laporan) console.log(`  ${baris}`);
console.log(`  Total posisi A/B/C/D = ${totalPosisi.join('/')}`);

if (galat.length) {
  console.error('\nGAGAL:');
  for (const g of galat) console.error(`  - ${g}`);
  process.exit(1);
}
console.log('\nLULUS: posisi jawaban seimbang dan tidak ada em dash di teks soal.');
