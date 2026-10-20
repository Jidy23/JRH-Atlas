/**
 * Audit kontras WCAG untuk semua palet JRH Atlas.
 * Jalankan: npm run audit:kontras
 *
 * Skrip ini MEMBACA app/tema.css dan app/globals.css, lalu menguji nilai token
 * yang benar-benar dipakai aplikasi. Versi lama memakai palet karangan sendiri,
 * jadi lolos 30/30 sementara token asli gagal (mis. aksen #22d3ee di atas latar
 * terang hanya 1,66:1).
 *
 * Empat bagian:
 * 1. Uji pasangan teks/latar (AA 4,5:1) untuk 5 palet x 2 mode.
 * 2. Uji pasangan NON-TEKS (WCAG 1.4.11, 3:1): cincin fokus, titik status, track
 *    switch, batas input, batas kartu, indikator tab aktif, isian progres, dan
 *    ibu jari scrollbar. Ini indikator yang wajib terlihat tanpa bergantung pada
 *    teks, dan sebelumnya tidak diuji sama sekali — token --v-status terbukti
 *    gagal 1,63:1 di mode terang sebelum diperbaiki.
 * 3. Aturan struktural: token teks viewer (--v-teks-*) tidak boleh berupa hex
 *    literal. Token itu wajib membaca --foreground / --muted-foreground /
 *    --jrh-aksen-teks supaya DESIGN.md aturan #4 (tidak ada abu literal) dan
 *    mode gelap otomatis berlaku. Hex literal di sana akan gagal.
 * 4. Aturan struktural: indikator non-teks tidak boleh membaca aksen mentah.
 *    --v-fokus dan --v-status wajib membaca --aksen-nonteks, bukan --aksen,
 *    karena aksen mentah gagal 3:1 di mode terang.
 *
 * Semua nilai DIKOMPOSIT: var() diselesaikan berantai (termasuk fallback
 * bersarang), color-mix(in srgb, ...) dihitung sesuai spesifikasi (premultiply
 * alpha), lalu warna transparan ditumpuk di atas latar efektifnya. Gradien juga
 * diurai per stop, jadi setiap ujung gradien ikut diuji dan tidak ada lagi
 * pasangan yang dilewati hanya karena nilainya berupa gradien.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rasioKontras, warnaKeRgb } from '../app/kontras.js';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEMA = readFileSync(join(AKAR, 'app', 'tema.css'), 'utf8');
const GLOBALS = readFileSync(join(AKAR, 'app', 'globals.css'), 'utf8');

type Deklarasi = Map<string, string>;
type Scope = { dasar: Deklarasi; palet: Map<string, Deklarasi>; mode: Map<string, Deklarasi> };
type RGBA = { r: number; g: number; b: number; a: number };
type Bagian = { nilai: string; persen: number | null };

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

/** Gabungkan lapisan token untuk satu (palet, mode). */
function gabungToken(palet: string, mode: string): Deklarasi {
  const gabung: Deklarasi = new Map();
  for (const [k, v] of TOKEN_VIEWER) gabung.set(k, v);
  for (const [k, v] of scope.dasar) gabung.set(k, v);
  for (const [k, v] of scope.palet.get(palet) ?? new Map<string, string>()) gabung.set(k, v);
  for (const [k, v] of scope.mode.get(mode) ?? new Map<string, string>()) gabung.set(k, v);
  return gabung;
}

/**
 * Selesaikan seluruh var() di dalam sebuah nilai, termasuk fallback bersarang
 * seperti var(--jrh-aksen-teks, var(--muted-foreground)).
 */
function selesaikanNilai(
  nama: string,
  gabung: Deklarasi,
  cache: Map<string, string | null>,
  jejak: Set<string>,
): string | null {
  if (cache.has(nama)) return cache.get(nama) ?? null;
  if (jejak.has(nama)) throw new Error(`Rujukan var() melingkar: ${[...jejak, nama].join(' -> ')}`);
  const mentah = gabung.get(nama);
  if (mentah === undefined) {
    cache.set(nama, null);
    return null;
  }
  jejak.add(nama);
  let hasil = mentah;
  let gagal = false;
  for (let putaran = 0; putaran < 40; putaran++) {
    // Hanya cocokkan var() terdalam (fallback tanpa tanda kurung) supaya
    // fallback bersarang diselesaikan dari dalam ke luar.
    const m = hasil.match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/);
    if (!m || m.index === undefined) break;
    const dalam = selesaikanNilai(m[1], gabung, cache, jejak);
    const pengganti = dalam ?? (m[2] !== undefined ? m[2].trim() : null);
    if (pengganti === null) {
      gagal = true;
      break;
    }
    hasil = hasil.slice(0, m.index) + pengganti + hasil.slice(m.index + m[0].length);
  }
  jejak.delete(nama);
  const akhir = gagal ? null : hasil;
  cache.set(nama, akhir);
  return akhir;
}

/** Pisah argumen pada koma di kedalaman kurung 0. */
function pisahTopLevel(isi: string): string[] {
  const hasil: string[] = [];
  let dalam = 0;
  let mulai = 0;
  for (let i = 0; i < isi.length; i++) {
    const c = isi[i];
    if (c === '(') dalam++;
    else if (c === ')') dalam--;
    else if (c === ',' && dalam === 0) {
      hasil.push(isi.slice(mulai, i));
      mulai = i + 1;
    }
  }
  hasil.push(isi.slice(mulai));
  return hasil;
}

/**
 * Urai gradien linear jadi daftar stop warna. Arah/sudut dibuang, posisi stop
 * (mis. `#fff 50%`) juga dibuang. Tujuannya: setiap ujung gradien ikut diuji,
 * bukan dicetak SKIP. Mengembalikan null untuk gradien yang tak bisa diurai.
 */
function uraiGradien(nilai: string): string[] | null {
  const m = nilai.trim().match(/^(?:repeating-)?linear-gradient\((.*)\)$/i);
  if (!m) return null;
  const stop: string[] = [];
  for (const bagian of pisahTopLevel(m[1])) {
    const b = bagian.trim();
    if (!b) continue;
    // Arah atau sudut: `135deg`, `0.25turn`, `to right`, `in oklab`.
    if (/^(?:-?[\d.]+(?:deg|rad|turn|grad)|to\s|in\s)/i.test(b)) continue;
    stop.push(b.replace(/\s+[\d.]+%$/, '').trim());
  }
  return stop.length ? stop : null;
}

/** Urai satu warna jadi RGBA. Alpha dipertahankan supaya bisa dikomposit. */
function urai(nilai: string): RGBA | null {
  const s = nilai.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (s.startsWith('color-mix(')) return uraiCampuran(s);

  let heks = s;
  const pendek = heks.match(/^#([0-9a-f]{4})$/);
  if (pendek) heks = '#' + pendek[1].split('').map((c) => c + c).join('');

  let a = 1;
  if (/^#[0-9a-f]{8}$/.test(heks)) a = parseInt(heks.slice(-2), 16) / 255;
  const alfa = heks.match(/^(?:rgba|hsla)\(([^)]*)\)$/);
  if (alfa) {
    const bagian = alfa[1].split(/[,\s/]+/).filter(Boolean);
    if (bagian.length >= 4) {
      const v = bagian[bagian.length - 1];
      a = v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v);
    }
  }
  try {
    const { r, g, b } = warnaKeRgb(heks);
    return { r, g, b, a };
  } catch {
    return null;
  }
}

/** Persentase dua sisi color-mix(); yang kosong diisi dari sisi lainnya. */
function persenCampuran(kiri: number | null, kanan: number | null): [number, number] {
  if (kiri === null && kanan === null) return [50, 50];
  if (kiri === null) {
    const k = kanan as number;
    return [100 - k, k];
  }
  if (kanan === null) return [kiri, 100 - kiri];
  return [kiri, kanan];
}

/** color-mix(in srgb, A p%, B) sesuai spesifikasi: campur premultiplied alpha. */
function uraiCampuran(s: string): RGBA | null {
  const m = s.match(/^color-mix\(\s*in\s+srgb\s*,([\s\S]+)\)$/);
  if (!m) return null;
  const sisi = pisahTopLevel(m[1]).map((x) => x.trim());
  if (sisi.length !== 2) return null;
  const pecah = (x: string): Bagian => {
    const pm = x.match(/^(.*?)\s+([\d.]+)%$/);
    return pm ? { nilai: pm[1].trim(), persen: parseFloat(pm[2]) } : { nilai: x, persen: null };
  };
  const kiri = pecah(sisi[0]);
  const kanan = pecah(sisi[1]);
  const c1 = urai(kiri.nilai);
  const c2 = urai(kanan.nilai);
  if (!c1 || !c2) return null;
  const [p1, p2] = persenCampuran(kiri.persen, kanan.persen);
  const a = (c1.a * p1 + c2.a * p2) / 100;
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  const kanal = (x1: number, x2: number) => (x1 * c1.a * p1 + x2 * c2.a * p2) / (a * 100);
  return { r: kanal(c1.r, c2.r), g: kanal(c1.g, c2.g), b: kanal(c1.b, c2.b), a };
}

/** Tumpuk warna (boleh transparan) di atas latar padat. */
function padat(nilai: string, dasar: RGBA): RGBA | null {
  const c = urai(nilai);
  if (!c) return null;
  const a = c.a + dasar.a * (1 - c.a);
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (c.r * c.a + dasar.r * dasar.a * (1 - c.a)) / a,
    g: (c.g * c.a + dasar.g * dasar.a * (1 - c.a)) / a,
    b: (c.b * c.a + dasar.b * dasar.a * (1 - c.a)) / a,
    a,
  };
}

function keHex(c: RGBA): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** [token teks, token latar, keterangan] — semuanya harus lolos AA. */
const UJI_TEKS: Array<[string, string, string]> = [
  ['--jrh-teks', '--jrh-bg', 'teks utama di latar'],
  ['--jrh-teks', '--jrh-kartu', 'teks utama di kartu'],
  ['--jrh-redup', '--jrh-bg', 'teks redup di latar'],
  ['--jrh-redup', '--jrh-kartu', 'teks redup di kartu'],
  ['--jrh-aksen-teks', '--jrh-bg', 'aksen sebagai teks di latar'],
  ['--jrh-aksen-teks', '--jrh-kartu', 'aksen sebagai teks di kartu'],
  ['--jrh-aksen-di', '--jrh-aksen-latar', 'teks di elemen berisi aksen (tab aktif)'],
  // Gradien diurai per stop: dulu pasangan ini dilewati sebagai SKIP.
  ['--jrh-di-aksen', '--gradien-fokus', 'teks aksi fokus di setiap ujung gradien'],
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

/** [token indikator, token latar, keterangan] — WCAG 1.4.11, minimal 3:1. */
const UJI_NONTEKS: Array<[string, string, string]> = [
  // Cincin fokus & titik status: indikator wajib terlihat di semua permukaan.
  ['--v-fokus', '--background', 'cincin fokus di latar'],
  ['--v-fokus', '--card', 'cincin fokus di kartu'],
  ['--v-fokus', '--jrh-kartu', 'cincin fokus di kartu ruang belajar'],
  ['--v-status', '--background', 'titik status di latar'],
  ['--v-status', '--card', 'titik status di kartu'],
  ['--v-status', '--kaca-bg', 'titik status di panel kaca'],
  // Kontrol: track switch dan batas bidang input harus bisa dibedakan.
  ['--v-switch', '--card', 'track switch di kartu'],
  ['--v-switch', '--background', 'track switch di latar'],
  ['--v-kontrol-garis', '--card', 'batas bidang input di kartu'],
  ['--v-kontrol-garis', '--background', 'batas bidang input di latar'],
  // Indikator navigasi & progres di ruang belajar.
  ['--aksen-nonteks', '--jrh-bg', 'indikator tab aktif di latar'],
  ['--aksen-nonteks', '--jrh-kartu', 'indikator tab aktif di kartu'],
  ['--aksen-nonteks', '--background', 'isian progres di latar'],
  ['--aksen-nonteks', '--card', 'isian progres di kartu'],
  // Scrollbar ikut 1.4.11: ibu jari harus terlihat terhadap track-nya.
  ['--v-scroll', '--card', 'ibu jari scrollbar di kartu'],
  ['--v-scroll', '--background', 'ibu jari scrollbar di latar'],
];

const PALET = ['bawaan', 'samudra', 'senja', 'zamrud', 'koral'];
const MODE = ['terang', 'gelap'];
const HASIL: Array<{ nama: string; rasio: number; teks: boolean; aaa: boolean; lulus: boolean }> = [];
const HILANG: string[] = [];

for (const palet of PALET) {
  for (const mode of MODE) {
    const gabung = gabungToken(palet, mode);
    const cache = new Map<string, string | null>();
    const nilai = (nama: string) => selesaikanNilai(nama, gabung, cache, new Set<string>());

    const latarMentah = nilai('--background');
    const dasar = latarMentah === null ? null : padat(latarMentah, { r: 255, g: 255, b: 255, a: 1 });
    if (dasar === null) {
      HILANG.push(`${palet} · ${mode} — --background tidak didefinisikan`);
      continue;
    }

    const uji = (daftar: Array<[string, string, string]>, jenis: 'teks' | 'nonteks', ambang: number) => {
      for (const [tokenIndikator, tokenLatar, ket] of daftar) {
        const nama = `${palet} · ${mode} — ${ket}`;
        const t = nilai(tokenIndikator);
        const l = nilai(tokenLatar);
        if (t === null || l === null) {
          HILANG.push(`${nama} (${t === null ? tokenIndikator : tokenLatar} tidak didefinisikan)`);
          continue;
        }

        // Gradien diurai per stop. Latar gradien tidak masuk akal untuk uji
        // kontras, jadi hanya stop pertama yang dipakai sebagai latar.
        const depanDaftar = /gradient\(/i.test(t) ? uraiGradien(t) : [t];
        const latarDaftar = /gradient\(/i.test(l) ? uraiGradien(l) : [l];
        if (!depanDaftar || !latarDaftar) {
          HILANG.push(`${nama} (nilai tidak bisa diurai: ${!depanDaftar ? t : l})`);
          continue;
        }

        const latar = padat(latarDaftar[0], dasar);
        if (latar === null) {
          HILANG.push(`${nama} (${tokenLatar} tidak bisa diurai: ${latarDaftar[0]})`);
          continue;
        }

        for (const [i, depanMentah] of depanDaftar.entries()) {
          const depan = padat(depanMentah, latar);
          if (depan === null) {
            HILANG.push(`${nama} (${tokenIndikator} tidak bisa diurai: ${depanMentah})`);
            continue;
          }
          const rasio = Math.round(rasioKontras(keHex(depan), keHex(latar)) * 100) / 100;
          const labelStop = depanDaftar.length > 1 ? `${nama} (ujung gradien ${i + 1}/${depanDaftar.length})` : nama;
          HASIL.push({
            nama: labelStop,
            rasio,
            teks: jenis === 'teks',
            aaa: jenis === 'teks' && rasio >= 7,
            lulus: rasio >= ambang,
          });
        }
      }
    };

    uji(UJI_TEKS, 'teks', 4.5);
    uji(UJI_NONTEKS, 'nonteks', 3);
  }
}

const gagal = HASIL.filter((h) => !h.lulus);
for (const h of HASIL) {
  const tanda = !h.lulus ? 'GAGAL' : h.teks ? (h.aaa ? 'AAA' : ' AA') : ' OK ';
  console.log(`${tanda.padStart(5)}  ${h.rasio.toFixed(2).padStart(5)}:1  ${h.nama}`);
}
for (const h of HILANG) console.log(`  SKIP  ${h}`);

/* ---------- Aturan struktural 1: tidak ada abu literal di token viewer ---------- */
const LITERAL = /^#|^(rgba?|hsla?)\(/;
const PELANGGARAN: string[] = [];
for (const [nama, nilaiToken] of TOKEN_VIEWER) {
  if (!/^--v-teks-/.test(nama)) continue;
  if (LITERAL.test(nilaiToken)) {
    PELANGGARAN.push(`${nama}: ${nilaiToken} — token teks viewer harus membaca --foreground / --muted-foreground / --jrh-aksen-teks`);
  }
}

/* ---------- Aturan struktural 2: indikator non-teks bukan aksen mentah ---------- */
const INDIKATOR = ['--v-fokus', '--v-status'];
for (const mode of MODE) {
  const gabung = gabungToken('bawaan', mode);
  const cache = new Map<string, string | null>();
  const nilai = (nama: string) => selesaikanNilai(nama, gabung, cache, new Set<string>());
  const aksen = nilai('--aksen');
  for (const nama of INDIKATOR) {
    const mentah = gabung.get(nama) ?? '';
    if (/^var\(\s*--aksen\s*\)$/.test(mentah.trim())) {
      PELANGGARAN.push(`${nama} (${mode}): ${mentah} — indikator non-teks wajib membaca --aksen-nonteks, bukan aksen mentah (gagal 3:1 di mode terang)`);
    }
    if (mode === 'terang' && aksen !== null && nilai(nama) === aksen) {
      PELANGGARAN.push(`${nama} (${mode}): resolve ke aksen mentah ${aksen} — gagal ambang 3:1`);
    }
  }
}

if (PELANGGARAN.length) {
  console.error('\n✗ Pelanggaran aturan struktural (DESIGN.md aturan #1 dan #4):');
  for (const p of PELANGGARAN) console.error(`  ${p}`);
} else {
  const tokenTeks = [...TOKEN_VIEWER.keys()].filter((n) => /^--v-teks-/.test(n)).length;
  console.log(`\n✓ ${tokenTeks} token teks viewer membaca token semantik, bukan hex literal.`);
  console.log('✓ indikator non-teks (--v-fokus, --v-status) membaca --aksen-nonteks, bukan aksen mentah.');
}

const teksDiuji = HASIL.filter((h) => h.teks).length;
const nonteksDiuji = HASIL.length - teksDiuji;
console.log(`\n${teksDiuji} pasangan teks (AA) + ${nonteksDiuji} pasangan non-teks (1.4.11), ${gagal.length} gagal, ${HILANG.length} dilewati.`);
process.exit(gagal.length || PELANGGARAN.length ? 1 : 0);
