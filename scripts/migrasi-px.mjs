// Migrasi nilai px langsung ke token skala — konservatif.
//
// Aturan main:
//   1. Hanya px yang PERSIS sama dengan nilai token yang diganti.
//   2. Hanya pada properti yang memang dikendalikan token itu:
//      spasi -> padding/margin/gap, radius -> border-radius, huruf -> font-size.
//   3. Nilai di dalam var()/calc()/clamp()/min()/max()/env() dilewati.
//   4. Kalau kurung kurawal berubah seimbang, berkas TIDAK ditulis.
//   5. Sisanya dilaporkan sebagai utang, bukan dipaksa.
//
// Pemakaian:
//   node scripts/migrasi-px.mjs --tahap=1
//   node scripts/migrasi-px.mjs --tulis-baseline

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirApp = join(akar, 'app');
const fileLaporan = join(akar, 'scripts', 'laporan-migrasi-px.json');

const TAHAP = {
  1: ['globals.css'],
  2: ['akademi.css', 'redesign.css'],
  3: ['tema.css', 'ekstra.css', 'interaction.css'],
};

const PX = /-?\d*\.?\d+px/g;
const ADA_PX = /-?\d*\.?\d+px/;
const LEWATI = /var\(|calc\(|clamp\(|min\(|max\(|env\(/i;

function hitungPx(teks) {
  const tanpaKomentar = teks.replace(/\/\*[\s\S]*?\*\//g, '');
  return (tanpaKomentar.match(PX) ?? []).length;
}

function seimbang(teks) {
  let d = 0;
  for (const c of teks) {
    if (c === '{') d++;
    else if (c === '}') d--;
    if (d < 0) return false;
  }
  return d === 0;
}

// Token dibaca dari skala.css, tidak ada nilai yang ditebak di sini.
const skala = readFileSync(join(dirApp, 'skala.css'), 'utf8');
function petaToken(prefix) {
  const map = new Map();
  const re = new RegExp(`--${prefix}-[a-z0-9-]+\\s*:\\s*([0-9.]+)px`, 'gi');
  for (const m of skala.matchAll(re)) {
    const nama = m[0].split(':')[0].trim();
    if (!map.has(m[1])) map.set(m[1], nama);
  }
  return map;
}

const SPASI = petaToken('sp');
const RADIUS = petaToken('r');
const HURUF = petaToken('t');

const PROP_SPASI = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap',
]);
const PROP_RADIUS = new Set([
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
]);
const PROP_HURUF = new Set(['font-size']);

function petaUntuk(prop) {
  if (PROP_SPASI.has(prop)) return SPASI;
  if (PROP_RADIUS.has(prop)) return RADIUS;
  if (PROP_HURUF.has(prop)) return HURUF;
  return null;
}

function migrasi(teks) {
  let diganti = 0;
  let dilewati = 0;
  const hasil = teks.replace(/([a-z-]+)\s*:\s*([^;{}]+)(;|$)/gi, (utuh, prop, nilai) => {
    const p = prop.toLowerCase();
    const peta = petaUntuk(p);
    if (!peta) return utuh;
    if (LEWATI.test(nilai)) {
      if (ADA_PX.test(nilai)) dilewati++;
      return utuh;
    }
    let berubah = false;
    const baru = nilai.replace(PX, (px) => {
      const angka = px.replace('px', '');
      const nama = peta.get(angka);
      if (!nama) return px;
      berubah = true;
      diganti++;
      return `var(${nama})`;
    });
    if (!berubah) return utuh;
    return `${prop}: ${baru.trim()};`;
  });
  return { hasil, diganti, dilewati };
}

if (process.argv.includes('--tulis-baseline')) {
  const semua = readdirSync(dirApp).filter((f) => f.endsWith('.css')).sort();
  const per = {};
  let total = 0;
  for (const f of semua) {
    const n = hitungPx(readFileSync(join(dirApp, f), 'utf8'));
    per[f] = n;
    total += n;
  }
  const jalur = join(akar, 'scripts', 'baseline-skala.json');
  const lama = JSON.parse(readFileSync(jalur, 'utf8'));
  const baru = {
    font_declarations: lama.font_declarations,
    generated_from: 'log CI setelah migrasi px bertahap',
    ...per,
    px_total: total,
  };
  writeFileSync(jalur, JSON.stringify(baru, null, 2) + '\n');
  console.log(`baseline: px_total ${lama.px_total} -> ${total}`);
  process.exit(0);
}

const arg = process.argv.find((a) => a.startsWith('--tahap='));
const tahap = arg ? Number(arg.split('=')[1]) : 1;
const berkas = TAHAP[tahap];
if (!berkas) {
  console.error(`Tahap ${tahap} tidak dikenal.`);
  process.exit(1);
}

const laporan = existsSync(fileLaporan)
  ? JSON.parse(readFileSync(fileLaporan, 'utf8'))
  : { catatan: 'Laporan migrasi px bertahap. Angka diukur, bukan ditebak.', tahap: {} };

const ringkas = [];
for (const nama of berkas) {
  const jalur = join(dirApp, nama);
  const asli = readFileSync(jalur, 'utf8');
  if (!seimbang(asli)) {
    console.error(`${nama}: kurung kurawal tidak seimbang SEBELUM migrasi. Dibatalkan.`);
    process.exit(1);
  }
  const sebelum = hitungPx(asli);
  const { hasil, diganti, dilewati } = migrasi(asli);
  if (!seimbang(hasil)) {
    console.error(`${nama}: kurung kurawal rusak SETELAH migrasi. Berkas tidak ditulis.`);
    process.exit(1);
  }
  const sesudah = hitungPx(hasil);
  writeFileSync(jalur, hasil);
  ringkas.push({
    berkas: nama,
    px_sebelum: sebelum,
    px_sesudah: sesudah,
    diganti,
    dilewati_karena_fungsi: dilewati,
  });
  console.log(`${nama}: ${sebelum} -> ${sesudah} px (${diganti} nilai diganti)`);
}

laporan.tahap[tahap] = ringkas;
writeFileSync(fileLaporan, JSON.stringify(laporan, null, 2) + '\n');
console.log('laporan ditulis ke scripts/laporan-migrasi-px.json');
