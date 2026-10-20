// Audit warna literal di app/*.css — DESIGN.md aturan #1.
//
// Aturannya struktural, bukan daftar warna: warna literal hanya boleh berada
// di dalam blok definisi token `:root { ... }`. Semua deklarasi komponen wajib
// membaca var(--token). Jadi menambah token baru tidak perlu mengubah skrip
// ini, sedangkan menulis `background:#123456` di selektor komponen akan gagal.
//
// Komentar dibuang lebih dulu: catatan seperti "globals.css memakai abu
// literal" menjelaskan sejarah, bukan mendeklarasikan warna, dan tidak boleh
// dihitung.
//
// Dikecualikan seluruhnya: tema.css saja. Itu rumah palet dan mode, dan
// sengaja memuat semua nilai warna mentah. globals.css kini ikut diperiksa:
// token viewer 3D (--v-*) tinggal di blok :root-nya, deklarasi komponennya
// hanya var(--token).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const Dikecualikan = new Set(['tema.css']);

const HEX = /#[0-9a-f]{3,8}\b/gi;
const FUNGSI_WARNA = /\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi;
const KEYWORD = /(?<![\w-])(?:white|black|red|green|blue|gray|grey|orange|yellow|pink|purple)(?![\w-])/gi;

// Buang komentar CSS supaya catatan tidak dihitung sebagai deklarasi.
const POLA_KOMENTAR = /\/\*[\s\S]*?\*\//g;
function buangKomentar(css) {
  return css.replace(POLA_KOMENTAR, '');
}

// Buang semua blok `:root { ... }` (termasuk varian :root[data-...]).
function buangBlokRoot(css) {
  let hasil = '';
  let i = 0;
  while (i < css.length) {
    const mulai = css.indexOf(':root', i);
    if (mulai === -1) { hasil += css.slice(i); break; }
    hasil += css.slice(i, mulai);
    const buka = css.indexOf('{', mulai);
    if (buka === -1) { hasil += css.slice(mulai); break; }
    let dalam = 1;
    let j = buka + 1;
    while (j < css.length && dalam > 0) {
      if (css[j] === '{') dalam++;
      else if (css[j] === '}') dalam--;
      j++;
    }
    i = j;
  }
  return hasil;
}

let pelanggaran = 0;

for (const file of readdirSync(root).filter(f => f.endsWith('.css')).sort()) {
  if (Dikecualikan.has(file)) {
    console.log(`– ${file} (rumah token, dikecualikan)`);
    continue;
  }
  const isi = buangBlokRoot(buangKomentar(readFileSync(join(root, file), 'utf8')));
  const temuan = [
    ...(isi.match(HEX) ?? []),
    ...(isi.match(FUNGSI_WARNA) ?? []),
    ...(isi.match(KEYWORD) ?? []),
  ];
  if (temuan.length) {
    pelanggaran += temuan.length;
    const unik = [...new Set(temuan.map(t => t.toLowerCase()))];
    console.error(`✗ ${file}: ${temuan.length} literal di luar :root → ${unik.join(', ')}`);
  } else {
    console.log(`✓ ${file}`);
  }
}

if (pelanggaran) {
  console.error(`\n${pelanggaran} pelanggaran DESIGN.md aturan #1.`);
  console.error('Pindahkan warna ke blok :root sebagai token, lalu pakai var(--token).');
  process.exit(1);
}
console.log('\nBersih: setiap komponen membaca token, bukan warna literal.');
