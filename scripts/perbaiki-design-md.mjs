// Perbaiki klaim ratchet di DESIGN.md yang sudah tidak akurat.
// Idempoten: kalau teks lama tidak ada dan teks baru sudah ada, keluar 0.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const jalur = join(akar, 'DESIGN.md');
let teks = readFileSync(jalur, 'utf8');

const lama = [
  'Angka itu belum menjadi ratchet; ratchet dipasang setelah migrasi Fase 2 selesai,',
  'karena baseline harus diukur, bukan ditebak.',
].join('\n');

const baru = [
  'Angka itu sekarang **menjadi ratchet**: CI gagal kalau total px langsung naik di atas',
  '`scripts/baseline-skala.json`, atau kalau jumlah deklarasi `font-family` literal naik di',
  'atas batasnya. Baseline diukur dari log CI, bukan ditebak. Ratchet hanya mencegah naik;',
  'sisa nilai px yang belum cocok dengan token tetap dicatat sebagai utang di',
  '`scripts/laporan-migrasi-px.json`.',
].join('\n');

if (teks.includes(baru)) {
  console.log('DESIGN.md sudah benar, tidak ada yang diubah.');
  process.exit(0);
}

if (!teks.includes(lama)) {
  console.error('Teks lama DESIGN.md tidak ditemukan. Dibatalkan, tidak menebak.');
  process.exit(1);
}

teks = teks.replace(lama, baru);
writeFileSync(jalur, teks);
console.log('DESIGN.md diperbaiki: klaim ratchet sekarang sesuai kenyataan.');
