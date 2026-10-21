// Token garis sekali-jalan: --w-garis (1px) dan --w-garis-tebal (2px).
//
// Kenapa ada: DESIGN.md menyebut "garis tipis 1px sebagai pemisah struktur"
// sebagai motif identitas, tapi ketebalan itu ditulis sebagai px lepas di
// puluhan tempat. scripts/audit-skala.mjs menghitungnya sebagai utang migrasi
// dan ratchet hanya mencegah angkanya NAIK. Skrip ini menurunkan angkanya
// dengan cara yang bisa direview: ketebalan garis jadi token, sisanya tetap.
//
// Yang DIKERJAKAN:
//   1. Sisipkan --w-garis / --w-garis-tebal ke :root di app/skala.css.
//   2. Ganti 1px/2px HANYA pada properti yang mengatur ketebalan garis
//      (border*, outline*, column-rule*). 1px di box-shadow, radius, atau
//      elevasi TIDAK disentuh - itu bayangan, bukan garis.
//   3. Daftarkan kedua token ke daftar WAJIB di scripts/audit-skala.mjs supaya
//      CI menolak kalau tokennya hilang.
//
// Kalau ada penanda yang tidak ketemu, skrip BERHENTI dengan exit 1 daripada
// diam-diam melewatkan bagian penting. Idempoten: jalan kedua tidak mengubah
// apa pun, jadi workflow berhenti sendiri setelah satu putaran.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirApp = join(akar, 'app');

const TOKEN = [
  '  /* ---------- Garis: ketebalan pemisah ---------- */',
  '  /* DESIGN.md: garis tipis 1px sebagai pemisah struktur. Token ini',
  '     memisahkan garis struktural dari px lepas supaya ketebalan bisa',
  '     diubah di satu tempat. 2px hanya untuk garis yang wajib terbaca',
  '     sebagai bentuk: indikator fokus dan skip-link. */',
  '  --w-garis: 1px;',
  '  --w-garis-tebal: 2px;',
  '',
].join('\n');

const PROP = new Set([
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-block', 'border-block-start', 'border-block-end',
  'border-inline', 'border-inline-start', 'border-inline-end',
  'border-width', 'border-top-width', 'border-right-width',
  'border-bottom-width', 'border-left-width',
  'border-block-width', 'border-inline-width',
  'outline', 'outline-width', 'column-rule', 'column-rule-width',
]);

const GANTI = new Map([
  ['1px', 'var(--w-garis)'],
  ['2px', 'var(--w-garis-tebal)'],
]);

function seimbang(teks) {
  let d = 0;
  for (const c of teks) {
    if (c === '{') d++;
    else if (c === '}') d--;
    if (d < 0) return false;
  }
  return d === 0;
}

// Transformasi hanya di luar komentar, supaya contoh di komentar tidak ikut
// berubah dan tidak mengacaukan hitungan.
function luarKomentar(teks, ubah) {
  const bagian = teks.split(/(\/\*[\s\S]*?\*\/)/);
  return bagian.map((b, i) => (i % 2 === 1 ? b : ubah(b))).join('');
}

// --- 1. Token masuk ke skala.css -------------------------------------------
const jalurSkala = join(dirApp, 'skala.css');
let skala = readFileSync(jalurSkala, 'utf8');
if (skala.includes('--w-garis:')) {
  console.log('skala.css: token sudah ada, dilewati');
} else {
  // Penanda dicocokkan longgar: yang penting kata "Tipografi" di dalam
  // komentar bergaris, bukan jumlah persis tanda hubungnya.
  const cocok = skala.match(/[ \t]*\/\*[ *-]*Tipografi[ *-]*\*\//);
  if (!cocok) {
    console.error('skala.css: komentar bagian Tipografi tidak ketemu. Batal.');
    process.exit(1);
  }
  skala = skala.replace(cocok[0], TOKEN + cocok[0]);
  if (!seimbang(skala)) {
    console.error('skala.css: kurung kurawal rusak setelah sisip token. Batal.');
    process.exit(1);
  }
  writeFileSync(jalurSkala, skala);
  console.log('skala.css: --w-garis + --w-garis-tebal disisipkan sebelum Tipografi');
}

// --- 2. Migrasi ketebalan garis --------------------------------------------
const berkas = readdirSync(dirApp)
  .filter((f) => f.endsWith('.css') && f !== 'skala.css')
  .sort();

let totalGanti = 0;
for (const nama of berkas) {
  const jalur = join(dirApp, nama);
  const asli = readFileSync(jalur, 'utf8');
  if (!seimbang(asli)) {
    console.error(`${nama}: kurung kurawal tidak seimbang SEBELUM migrasi. Batal.`);
    process.exit(1);
  }

  let ganti = 0;
  const hasil = luarKomentar(asli, (teks) =>
    teks.replace(/([a-zA-Z-]+)\s*:\s*([^;{}]+)(;|(?=\}))/g, (utuh, prop, nilai, akhir) => {
      if (!PROP.has(prop.toLowerCase())) return utuh;
      let berubah = false;
      const baru = nilai.replace(/(?<![\w.-])([12])px(?![\w-])/g, (px) => {
        const g = GANTI.get(px);
        if (!g) return px;
        berubah = true;
        ganti++;
        return g;
      });
      if (!berubah) return utuh;
      return `${prop}: ${baru.trim()}${akhir}`;
    }),
  );

  if (!seimbang(hasil)) {
    console.error(`${nama}: kurung kurawal rusak SETELAH migrasi. Berkas tidak ditulis.`);
    process.exit(1);
  }
  if (ganti) writeFileSync(jalur, hasil);
  console.log(`${nama}: ${ganti} ketebalan garis jadi token`);
  totalGanti += ganti;
}

// --- 3. Token didaftarkan sebagai WAJIB di audit ---------------------------
const jalurAudit = join(akar, 'scripts', 'audit-skala.mjs');
let audit = readFileSync(jalurAudit, 'utf8');

if (audit.includes("'--w-garis'")) {
  console.log('audit-skala.mjs: token sudah terdaftar, dilewati');
} else {
  const jangkar = "  '--font-sans', '--font-mono',";
  if (!audit.includes(jangkar)) {
    console.error('audit-skala.mjs: baris jangkar font tidak ketemu. Batal.');
    process.exit(1);
  }
  audit = audit.replace(jangkar, "  '--w-garis', '--w-garis-tebal',\n" + jangkar);

  // var(--w-*) yang dipakai tapi tidak terdefinisi juga harus ketahuan.
  // Di berkas aslinya ini regex literal (tanpa tanda kutip), bukan string.
  const polaAsli = '/^--(sp|r|t|lh|tr|e|z|d|ease)-/';
  const polaBaru = '/^--(sp|r|t|lh|tr|e|z|d|ease|w)-/';
  if (audit.includes(polaAsli)) {
    audit = audit.replace(polaAsli, polaBaru);
    console.log('audit-skala.mjs: pola token skala mencakup --w-*');
  } else {
    console.warn('audit-skala.mjs: pola POLA_SKALA tidak ketemu, dilewati (token tetap wajib)');
  }

  writeFileSync(jalurAudit, audit);
  console.log('audit-skala.mjs: --w-garis + --w-garis-tebal masuk daftar WAJIB');
}

console.log(`\nSelesai: ${totalGanti} ketebalan garis jadi token.`);
