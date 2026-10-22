// Audit skala desain — DESIGN.md aturan #8, #9, #10.
//
// Yang DITEGAKKAN (gagal = exit 1):
//   1. Kelengkapan token wajib di app/skala.css.
//   2. Setiap var(--sp-*/--r-*/--t-*/--e-*/--z-*/--d-*) yang dipakai di
//      app/*.css benar-benar terdefinisi. Token hantu adalah bug senyap:
//      var() yang tidak ada membuat deklarasi jatuh ke nilai awal tanpa galat.
//   3. app/skala.css adalah impor CSS pertama di web/main.tsx. Kalau tidak,
//      lapisan yang dimuat lebih dulu membaca token yang belum ada.
//   4. app/skala.css tidak memuat warna (DESIGN.md aturan #10). Rumah warna
//      tema.css, dan itu sudah dijaga scripts/audit-token.mjs.
//   5. Ratchet: jumlah px langsung dan deklarasi font-family literal tidak
//      boleh naik melewati scripts/baseline-skala.json.
//   6. Tidak ada aturan :focus / :focus-visible yang menggambar cincin memakai
//      aksen MENTAH. Ditambahkan Batch 4 — lihat catatan di bagian 6.
//
// Yang DICETAK sebagai utang (tidak menggagalkan CI):
//   - Jumlah nilai px ajaib per berkas.
//   - Deklarasi font-family yang belum membaca --font-sans.
//
// Kenapa utang tidak langsung menggagalkan: migrasi Fase 1 sengaja bertahap.
// Ratchet baru dipasang setelah baseline diukur dari angka yang dicetak di
// sini, bukan ditebak. Menegakkan lebih awal hanya akan memaksa satu commit
// raksasa yang tidak bisa di-review.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirApp = join(akar, 'app');

const WAJIB = [
  '--sp-1', '--sp-2', '--sp-3', '--sp-4', '--sp-5', '--sp-6',
  '--sp-7', '--sp-8', '--sp-9', '--sp-10', '--sp-11', '--sp-12',
  '--r-1', '--r-2', '--r-3', '--r-4', '--r-5', '--r-pil',
  '--t-1', '--t-2', '--t-3', '--t-4', '--t-5',
  '--t-6', '--t-7', '--t-8', '--t-9', '--t-10',
  '--lh-ketat', '--lh-judul', '--lh-isi', '--lh-longgar',
  '--tr-ketat', '--tr-normal', '--tr-lebar', '--tr-kaps',
  '--w-garis', '--w-garis-tebal',
  '--font-sans', '--font-mono',
  '--e-1', '--e-2', '--e-3', '--e-4',
  '--z-dasar', '--z-panel', '--z-lengket', '--z-sheet', '--z-nav',
  '--z-popover', '--z-lompat',
  '--d-instan', '--d-cepat', '--d-normal', '--d-lambat',
  '--ease-keluar', '--ease-masuk', '--ease-linear',
  '--header-h', '--nav-w', '--pad-konten', '--lebar-baca',
];

let gagal = 0;
const catat = (pesan) => { gagal++; console.error(`✗ ${pesan}`); };

// ---------- 1. skala.css ada dan lengkap ----------
let skala;
try {
  skala = readFileSync(join(dirApp, 'skala.css'), 'utf8');
} catch {
  console.error('✗ app/skala.css tidak ditemukan.');
  process.exit(1);
}

const terdefinisi = new Set(
  [...skala.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]),
);

const hilang = WAJIB.filter((t) => !terdefinisi.has(t));
if (hilang.length) {
  catat(`skala.css tidak mendefinisikan ${hilang.length} token wajib: ${hilang.join(', ')}`);
} else {
  console.log(`✓ skala.css lengkap: ${WAJIB.length} token wajib terdefinisi`);
}

// ---------- 2. Tidak ada token skala hantu ----------
// Hanya nama yang jelas milik skala. --v-*, --jrh-*, --aksen-* punya rumah lain
// dan sudah diperiksa audit lain, jadi tidak ikut di sini.
const POLA_SKALA = /^--(sp|r|t|lh|tr|e|z|d|ease|w)-/;
const semuaCss = readdirSync(dirApp).filter((f) => f.endsWith('.css')).sort();

let hantu = 0;
for (const file of semuaCss) {
  const isi = readFileSync(join(dirApp, file), 'utf8');
  const dipakai = new Set(
    [...isi.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]),
  );
  for (const nama of dipakai) {
    if (!POLA_SKALA.test(nama)) continue;
    if (!terdefinisi.has(nama)) {
      catat(`${file}: var(${nama}) dipakai tetapi tidak terdefinisi di skala.css`);
      hantu++;
    }
  }
}
if (!hantu) console.log('✓ Tidak ada token skala hantu');

// ---------- 3. skala.css dimuat paling awal ----------
const main = readFileSync(join(akar, 'web', 'main.tsx'), 'utf8');
const imporCss = [...main.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)].map((m) => m[1]);
if (!imporCss.length) {
  catat('web/main.tsx tidak mengimpor CSS apa pun.');
} else if (!imporCss[0].endsWith('app/skala.css')) {
  catat(`impor CSS pertama di web/main.tsx adalah ${imporCss[0]}, bukan app/skala.css`);
} else {
  console.log(`✓ skala.css dimuat pertama (${imporCss.length} impor CSS)`);
}

// ---------- 4. skala.css tidak memuat warna ----------
const HEX = /#[0-9a-f]{3,8}\b/gi;
const FUNGSI = /\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi;
const tanpaKomentar = skala.replace(/\/\*[\s\S]*?\*\//g, '');
const warnaDiSkala = [...(tanpaKomentar.match(HEX) ?? []), ...(tanpaKomentar.match(FUNGSI) ?? [])];
if (warnaDiSkala.length) {
  catat(`skala.css memuat ${warnaDiSkala.length} warna literal: ${[...new Set(warnaDiSkala)].join(', ')}`);
} else {
  console.log('✓ skala.css bebas warna literal (rumah warna: tema.css)');
}

// ---------- Utang migrasi: px ajaib & font-family ----------
const PX = /(?<![\w-])-?\d*\.?\d+px\b/g;
console.log('\nUtang migrasi (belum menggagalkan CI):');
let totalPx = 0;
for (const file of semuaCss) {
  const isi = readFileSync(join(dirApp, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const px = isi.match(PX)?.length ?? 0;
  totalPx += px;
  console.log(`  ${file}: ${px} nilai px langsung`);
}
console.log(`  total: ${totalPx} nilai px langsung`);

const fontBermasalah = [];
for (const file of semuaCss) {
  if (file === 'skala.css') continue;
  const isi = readFileSync(join(dirApp, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of isi.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const nilai = m[1].trim();
    if (nilai.startsWith('var(--font-')) continue;
    if (nilai === 'inherit') continue;
    fontBermasalah.push(`${file}: ${nilai}`);
  }
}
if (fontBermasalah.length) {
  console.log(`\n  font-family belum membaca --font-sans (${fontBermasalah.length} deklarasi):`);
  for (const f of fontBermasalah) console.log(`    ${f}`);
} else {
  console.log('  font-family: semua membaca --font-sans');
}

// ---------- 5. Ratchet: utang migrasi tidak boleh naik ----------
const baseline = JSON.parse(
  readFileSync(join(akar, 'scripts', 'baseline-skala.json'), 'utf8'),
);
if (totalPx > baseline.px_total) {
  catat(`px langsung naik: ${totalPx} > baseline ${baseline.px_total}. Pakai token skala.`);
} else {
  console.log(`✓ ratchet px: ${totalPx} <= ${baseline.px_total}`);
}
if (fontBermasalah.length > baseline.font_declarations) {
  catat(`font-family literal naik: ${fontBermasalah.length} > baseline ${baseline.font_declarations}`);
} else {
  console.log(`✓ ratchet font: ${fontBermasalah.length} <= ${baseline.font_declarations}`);
}

// ---------- 6. Cincin fokus tidak boleh memakai aksen mentah ----------
// DESIGN.md aturan #7: cincin fokus adalah indikator NON-TEKS, wajib 3:1.
//
// Kenapa aturan ini perlu ada padahal sudah ada ratchet px dan audit kontras:
// keduanya tidak bisa menangkapnya. Audit kontras menguji TOKEN (--v-fokus,
// --aksen-nonteks), bukan aturan outline yang ditulis di komponen. Ratchet px
// tidak menangkapnya karena nilainya berupa var(), bukan angka. Jadi aturan
// fokus yang salah bisa hidup lama tanpa satu pun tes berbunyi — persis yang
// terjadi pada akademi.css sebelum Batch 4:
//
//   :where(button, select):focus-visible {
//     outline: var(--w-garis-tebal) solid var(--jrh-aksen);
//   }
//
// --jrh-aksen adalah aksen mentah (#22d3ee) = 1,63:1 di latar terang. Aturan
// itu kebetulan kalah cascade (spesifisitas 0,1,0 sama dengan ekstra.css yang
// dimuat belakangan), jadi tidak terlihat di layar. Tetapi ia hidup sebagai
// ranjau: satu perubahan urutan impor cukup untuk menjatuhkan cincin fokus
// seluruh aplikasi ke 1,63:1.
//
// Pola di bawah menuntut ") " tepat setelah nama token, sehingga varian yang
// BENAR tidak ikut tertangkap:
//   var(--aksen-nonteks)   → tidak cocok (ada akhiran)
//   var(--jrh-aksen-teks)  → tidak cocok (ada akhiran)
//   var(--aksen)           → cocok  ✗
//   var(--jrh-aksen)       → cocok  ✗
const AKSEN_MENTAH = /var\(\s*--(?:jrh-)?aksen\s*\)/;
let fokusSalah = 0;
for (const file of semuaCss) {
  const isi = readFileSync(join(dirApp, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const blok of isi.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/:focus(?:-visible)?\b/.test(blok[1])) continue;
    for (const m of blok[2].matchAll(/outline(?:-color)?\s*:\s*([^;}]+)/gi)) {
      if (AKSEN_MENTAH.test(m[1])) {
        catat(
          `${file}: outline fokus memakai aksen mentah (${m[1].trim()}) pada "${blok[1].trim().replace(/\s+/g, ' ').slice(0, 70)}" — pakai --aksen-nonteks`,
        );
        fokusSalah++;
      }
    }
  }
}
if (!fokusSalah) console.log('✓ Cincin fokus tidak ada yang memakai aksen mentah');

if (gagal) {
  console.error(`\n${gagal} pelanggaran skala desain.`);
  process.exit(1);
}
console.log('\nBersih: skala utuh, token terdefinisi, urutan impor benar.');
