/**
 * Audit kontras WCAG untuk semua palet JRH Atlas.
 * Jalankan: npm run audit:kontras
 *
 * Skrip ini MEMBACA app/tema.css dan menguji nilai token yang benar-benar
 * dipakai aplikasi. Versi sebelumnya memakai palet karangan sendiri, jadi
 * lolos 30/30 sementara token asli gagal (mis. aksen #22d3ee di atas latar
 * terang hanya 1,66:1).
 *
 * Batas yang jujur: warna yang dibuat lewat color-mix() atau rgba() transparan
 * tidak dihitung kompositnya di sini. Untuk itu dipakai token teks solid
 * (--jrh-aksen-teks) yang memang dirancang menggantikannya.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { periksa, type StatusKontras } from '../app/kontras.js';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEMA = readFileSync(join(AKAR, 'app', 'tema.css'), 'utf8');

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

const scope: Scope = { dasar: new Map(), palet: new Map(), mode: new Map() };

for (const blok of buangKomentar(TEMA).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selektor = blok[1].trim().replace(/\s+/g, ' ');
  const isi = deklarasi(blok[2]);
  if (selektor === ':root') {
    for (const [k, v] of isi) scope.dasar.set(k, v);
    continue;
  }
  const palet = selektor.match(/^:root\[data-palet='([\w-]+)'\]$/);
  if (palet) {
    const lama = scope.palet.get(palet[1]) ?? new Map();
    for (const [k, v] of isi) lama.set(k, v);
    scope.palet.set(palet[1], lama);
    continue;
  }
  const mode = selektor.match(/^:root\[data-tema='([\w-]+)'\]$/);
  if (mode) {
    const lama = scope.mode.get(mode[1]) ?? new Map();
    for (const [k, v] of isi) lama.set(k, v);
    scope.mode.set(mode[1], lama);
  }
}

/** Susun token efektif untuk satu (palet, mode), lalu selesaikan rantai var(). */
function tokenEfektif(palet: string, mode: string): Deklarasi {
  const gabung: Deklarasi = new Map();
  for (const [k, v] of scope.dasar) gabung.set(k, v);
  for (const [k, v] of scope.palet.get(palet) ?? []) gabung.set(k, v);
  for (const [k, v] of scope.mode.get(mode) ?? []) gabung.set(k, v);

  const selesai: Deklarasi = new Map();
  const selesaikan = (nama: string, jejak: Set<string>): string | null => {
    if (selesai.has(nama)) return selesai.get(nama)!;
    if (jejak.has(nama)) throw new Error(`Rujukan var() melingkar: ${[...jejak, nama].join(' -> ')}`);
    const nilai = gabung.get(nama);
    if (nilai === undefined) return null;
    const ref = nilai.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (!ref) { selesai.set(nama, nilai); return nilai; }
    jejak.add(nama);
    const dalam = selesaikan(ref[1], jejak);
    jejak.delete(nama);
    if (dalam === null) return null;
    selesai.set(nama, dalam);
    return dalam;
  };

  for (const nama of gabung.keys()) selesaikan(nama, new Set());
  return selesai;
}

/** [token teks, token latar, keterangan] — semuanya harus lolos AA. */
const UJI: Array<[string, string, string]> = [
  ['--jrh-teks', '--jrh-bg', 'teks utama di latar'],
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
  ['--primary-foreground', '--primary', 'teks tombol primer viewer'],
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
console.log(`\n${HASIL.length} pasangan diperiksa, ${gagal.length} gagal AA, ${HILANG.length} dilewati.`);
process.exit(gagal.length ? 1 : 0);
