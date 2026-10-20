/**
 * Audit kontras WCAG untuk semua palet JRH Atlas.
 * Jalankan: npm run audit:kontras
 *
 * Skrip ini MEMBACA app/tema.css dan app/globals.css, lalu menguji nilai token
 * yang benar-benar dipakai aplikasi. Versi lama memakai palet karangan sendiri,
 * jadi lolos 30/30 sementara token asli gagal (mis. aksen #22d3ee di atas latar
 * terang hanya 1,66:1).
 *
 * Dua bagian:
 * 1. Uji pasangan teks/latar untuk 5 palet x 2 mode.
 * 2. Aturan struktural: token teks viewer (--v-teks-*) tidak boleh berupa hex
 *    literal. Token itu wajib membaca --foreground / --muted-foreground /
 *    --jrh-aksen-teks supaya DESIGN.md aturan #4 (tidak ada abu literal) dan
 *    mode gelap otomatis berlaku. Hex literal di sana akan gagal.
 *
 * Batas yang jujur: warna hasil color-mix() tidak dikomposit di sini. Pasangan
 * yang dilewati DICETAK, bukan diam-diam dianggap lolos.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { periksa, type StatusKontras } from '../app/kontras.js';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEMA = readFileSync(join(AKAR, 'app', 'tema.css'), 'utf8');
const GLOBALS = readFileSync(join(AKAR, 'app', 'globals.css'), 'utf8');

type Deklarasi = Map<string, string>;
type Scope = { dasar: Deklarasi; palet: Map<string, Deklarasi>; mode: Map<string, Deklarasi> };

function buangKomentar(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function deklarasi(isi: string): Deklarasi {
  const hasil: Deklarasi = new Map();
  for (const m of isi.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    hasil.set(m[1], m[2].trim());
  }
  return hasil;
}

const scope: Scope = {
  dasar: new Map<string, string>(),
  palet: new Map<string, Deklarasi>(),
  mode: new Map<string, Deklarasi>(),
};

for (const blok of buangKomentar(TEMA).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selektor = blok[1].trim().replace(/\s+/g, ' ');
  const isi = deklarasi(blok[2]);
  if (selektor === ':root') {
    for (const [k, v] of isi) scope.dasar.set(k, v);
    continue;
  }
  const palet = selektor.match(/^:root\[data-palet='([\w-]+)'\]$/);
  if (palet) {
    const lama = scope.palet.get(palet[1]) ?? new Map<string, string>();
    for (const [k, v] of isi) lama.set(k, v);
    scope.palet.set(palet[1], lama);
    continue;
  }
  const mode = selektor.match(/^:root\[data-tema='([\w-]+)'\]$/);
  if (mode) {
    const lama = scope.mode.get(mode[1]) ?? new Map<string, string>();
    for (const [k, v] of isi) lama.set(k, v);
    scope.mode.set(mode[1], lama);
  }
}

/** Token viewer (--v-*) hidup di blok :root globals.css, prioritas terendah. */
const TOKEN_VIEWER: Deklarasi = new Map();
for (const blok of buangKomentar(GLOBALS).matchAll(/:root\s*\{([^{}]*)\}/g)) {
  for (const [k, v] of deklarasi(blok[1])) TOKEN_VIEWER.set(k, v);
}

/** Susun token efektif untuk satu (palet, mode), lalu selesaikan rantai var(). */
function tokenEfektif(palet: string, mode: string): Deklarasi {
  const gabung: Deklarasi = new Map();
  for (const [k, v] of TOKEN_VIEWER) gabung.set(k, v);
  for (const [k, v] of scope.dasar) gabung.set(k, v);
  for (const [k, v] of scope.palet.get(palet) ?? new Map<string, string>()) gabung.set(k, v);
  for (const [k, v] of scope.mode.get(mode) ?? new Map<string, string>()) gabung.set(k, v);

  const selesai: Deklarasi = new Map();
  const selesaikan = (nama: string, jejak: Set<string>): string | null => {
    const sudah = selesai.get(nama);
    if (sudah !== undefined) return sudah;
    if (jejak.has(nama)) throw new Error(`Rujukan var() melingkar: ${[...jejak, nama].join(' -> ')}`);
    const nilai = gabung.get(nama);
    if (nilai === undefined) return null;
    // Selesaikan var() dengan fallback: var(--a, #b)
    const ref = nilai.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
    if (!ref) {
      selesai.set(nama, nilai);
      return nilai;
    }
    jejak.add(nama);
    let dalam = selesaikan(ref[1], jejak);
    if (dalam === null && ref[2]) dalam = ref[2].trim();
    jejak.delete(nama);
    if (dalam === null) return null;
    selesai.set(nama, dalam);
    return dalam;
  };

  for (const nama of [...gabung.keys()]) selesaikan(nama, new Set<string>());
  return selesai;
}

/** [token teks, token latar, keterangan] — semuanya harus lolos AA. */
const UJI: Array<[string, string, string]> = [
  ['--jrh-teks', '--jrh-bg', 'teks utama di latar'],
  ['--jrh-teks', '--jrh-kartu', 'teks utama di kartu'],
  ['--jrh-redup', '--jrh-bg', 'teks redup di latar'],
  ['--jrh-redup', '--jrh-kartu', 'teks redup di kartu'],
  ['--jrh-aksen-teks', '--jrh-bg', 'aksen sebagai teks di latar'],
  ['--jrh-aksen-teks', '--jrh-kartu', 'aksen sebagai teks di kartu'],
  ['--jrh-aksen-di', '--jrh-aksen-latar', 'teks di elemen berisi aksen (tab aktif)'],
  ['--jrh-di-aksen', '--aksen', 'teks aksi fokus di ujung gradien 1'],
  ['--jrh-di-aksen', '--aksen-2', 'teks aksi fokus di ujung gradien 2'],
  ['--jrh-di-benar', '--jrh-benar', 'lencana jawaban benar'],
  ['--jrh-di-salah', '--jrh-salah', 'lencana jawaban salah'],
  ['--muted-foreground', '--background', 'teks redup viewer di latar'],
  ['--muted-foreground', '--card', 'teks redup viewer di kartu'],
  ['--muted-foreground', '--muted', 'teks redup viewer di permukaan redup'],
  ['--foreground', '--muted', 'teks viewer di permukaan redup'],
  ['--foreground', '--card', 'teks viewer di kartu'],
  ['--primary-foreground', '--primary', 'teks tombol primer viewer'],
  ['--jrh-aksen-teks', '--card', 'tautan viewer di kartu'],
  ['--v-tooltip-teks', '--v-tooltip', 'teks tooltip bagian anatomi'],
];

const PALET = ['bawaan', 'samudra', 'senja', 'zamrud', 'koral'];
const MODE = ['terang', 'gelap'];
const HASIL: StatusKontras[] = [];
const HILANG: string[] = [];

for (const palet of PALET) {
  for (const mode of MODE) {
    const token = tokenEfektif(palet, mode);
    for (const [teks, latar, ket] of UJI) {
      const t = token.get(teks);
      const l = token.get(latar);
      const nama = `${palet} · ${mode} — ${ket}`;
      if (t === undefined || l === undefined) {
        HILANG.push(`${nama} (${t === undefined ? teks : latar} tidak didefinisikan)`);
        continue;
      }
      if (/^(rgba?|color-mix)/.test(t) || /^(rgba?|color-mix)/.test(l)) {
        HILANG.push(`${nama} (warna transparan/campuran tidak bisa diuji langsung)`);
        continue;
      }
      HASIL.push(periksa(t, l, nama));
    }
  }
}

const gagal = HASIL.filter((h) => !h.aaTeks);
for (const h of HASIL) {
  const tanda = h.aaaTeks ? 'AAA' : h.aaTeks ? ' AA' : 'GAGAL';
  console.log(`${tanda.padStart(5)}  ${h.rasio.toFixed(2).padStart(5)}:1  ${h.pasangan}`);
}
for (const h of HILANG) console.log(`  SKIP  ${h}`);

/* ---------- Aturan struktural: tidak ada abu literal di token viewer ---------- */
const LITERAL = /^#|^(rgba?|hsla?)\(/;
const PELANGGARAN: string[] = [];
for (const [nama, nilai] of TOKEN_VIEWER) {
  if (!/^--v-teks-/.test(nama)) continue;
  if (LITERAL.test(nilai)) {
    PELANGGARAN.push(`${nama}: ${nilai} — token teks viewer harus membaca --foreground / --muted-foreground / --jrh-aksen-teks`);
  }
}
if (PELANGGARAN.length) {
  console.error('\n✗ Abu literal di token teks viewer (DESIGN.md aturan #4):');
  for (const p of PELANGGARAN) console.error(`  ${p}`);
} else {
  console.log(`\n✓ ${[...TOKEN_VIEWER.keys()].filter((n) => /^--v-teks-/.test(n)).length} token teks viewer membaca token semantik, bukan hex literal.`);
}

console.log(`\n${HASIL.length} pasangan diperiksa, ${gagal.length} gagal AA, ${HILANG.length} dilewati.`);
process.exit(gagal.length || PELANGGARAN.length ? 1 : 0);
