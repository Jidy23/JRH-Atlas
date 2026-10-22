// Anggaran aset JRH Atlas.
//
// Repo ini menyimpan setiap chunk dua kali: `body-N.bin` (mentah) dan
// `body-N.bin.gz`. Itu memang perlu — penampil memilih `.gz` bila browser
// punya DecompressionStream dan jatuh ke `.bin` bila tidak, jadi keduanya
// harus ada atau sistem yang mula-mula disembunyikan lalu ditampilkan akan
// 404. Implikasinya: tiap chunk yang bertambah membebani repo dua kali.
//
// Skrip ini mengukur ukuran NYATA dari berkas yang ada, menandai chunk yang
// melewati batas, dan gagal bila ada yang melewatinya. Tanpa langkah ini,
// anggaran hanya niat; dengan langkah ini, pertumbuhan tak sengaja tertangkap.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const akar = new URL('../', import.meta.url);
const dir = new URL('public/models/', akar);
const anggaran = JSON.parse(
  fs.readFileSync(new URL('scripts/anggaran.json', akar), 'utf8'),
);
const berkas = (name) => new URL(name, dir);
const ada = (name) => fs.existsSync(berkas(name));
const ukuran = (name) => (ada(name) ? fs.statSync(berkas(name)).size : 0);

// Sistem yang tampil pada kunjungan pertama; meniru DEFAULT_VISIBLE di
// app/anatomy.ts. Disalin sebagai literal supaya skrip ini tidak perlu
// mengompilasi TypeScript hanya untuk membaca satu array.
const DEFAULT_VISIBLE = [
  'skeletal',
  'muscular',
  'cardiac',
  'sensory',
  'digestive',
  'respiratory',
  'urinary',
];

const atlas = JSON.parse(fs.readFileSync(berkas('atlas.json'), 'utf8'));
const atlasBytes = ukuran('atlas.json');

let totalGzip = 0;
let totalRaw = 0;
const bad = [];
const chunkReports = [];

for (const chunk of atlas.chunks) {
  const raw = String(chunk.url).split('/').pop();
  const gz = chunk.gzip ? String(chunk.gzip).split('/').pop() : null;
  const rawBytes = ukuran(raw);
  const gzBytes = gz ? ukuran(gz) : 0;

  if (!ada(raw)) bad.push({ chunk: chunk.url, masalah: 'berkas mentah tidak ada' });
  if (gz && !ada(gz)) bad.push({ chunk: chunk.url, masalah: 'berkas .gz tidak ada' });
  if (rawBytes && rawBytes !== chunk.bytes) {
    bad.push({ chunk: chunk.url, masalah: `ukuran mentah ${rawBytes} != manifes ${chunk.bytes}` });
  }
  if (gzBytes && chunk.gzBytes && gzBytes !== chunk.gzBytes) {
    bad.push({ chunk: chunk.url, masalah: `ukuran .gz ${gzBytes} != manifes ${chunk.gzBytes}` });
  }
  if (rawBytes > anggaran.chunkRawBytes) {
    bad.push({ chunk: chunk.url, masalah: `mentah ${rawBytes} > anggaran ${anggaran.chunkRawBytes}` });
  }
  if (gzBytes > anggaran.chunkGzipBytes) {
    bad.push({ chunk: chunk.url, masalah: `.gz ${gzBytes} > anggaran ${anggaran.chunkGzipBytes}` });
  }

  totalGzip += gzBytes || rawBytes;
  totalRaw += rawBytes;
  chunkReports.push({ chunk: raw, rawBytes, gzBytes });
}

const systemsByChunk = atlas.chunks.map(() => new Set());
for (const part of atlas.parts) systemsByChunk[part.chunk]?.add(part.system);
const defaultChunks = new Set();
systemsByChunk.forEach((systems, index) => {
  for (const system of systems) if (DEFAULT_VISIBLE.includes(system)) defaultChunks.add(index);
});
const defaultGzip = chunkReports
  .filter((_, index) => defaultChunks.has(index))
  .reduce((sum, c) => sum + (c.gzBytes || c.rawBytes), 0);

const laporan = {
  chunks: atlas.chunks.length,
  parts: atlas.parts.length,
  atlasBytes,
  totalRawBytes: totalRaw,
  totalGzipBytes: totalGzip,
  defaultVisibleChunks: defaultChunks.size,
  defaultVisibleGzipBytes: defaultGzip,
  anggaran,
  pelanggaran: bad,
};
console.log(JSON.stringify(laporan, null, 2));

assert.equal(bad.length, 0, 'Anggaran aset dilanggar, lihat daftar pelanggaran di atas.');
assert.ok(totalGzip <= anggaran.totalGzipBytes, `Total .gz ${totalGzip} melebihi anggaran ${anggaran.totalGzipBytes}`);
assert.ok(defaultGzip <= anggaran.defaultVisibleGzipBytes, `.gz tampilan awal ${defaultGzip} melebihi anggaran ${anggaran.defaultVisibleGzipBytes}`);
assert.ok(atlasBytes <= anggaran.atlasJsonBytes, `atlas.json ${atlasBytes} melebihi anggaran ${anggaran.atlasJsonBytes}`);
assert.ok(
  defaultGzip > 0 && defaultGzip < totalGzip,
  'Tampilan awal harus mengunduh sebagian chunk, bukan semuanya',
);
console.log(`✓ Anggaran aset dipatuhi: ${atlas.chunks.length} chunk, .gz total ${(totalGzip / 1e6).toFixed(1)} MB, tampilan awal ${(defaultGzip / 1e6).toFixed(1)} MB.`);
