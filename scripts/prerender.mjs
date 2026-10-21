/**
 * Prerender ringan untuk JRH Atlas.
 *
 * Masalah yang diselesaikan: keenam rute sebelumnya hanya hidup di query string
 * (?tab=kuis) dan seluruh HTML-nya berasal dari satu index.html kosong. Crawler
 * dan pratinjau tautan hanya melihat satu halaman tanpa judul berbeda.
 *
 * Skrip ini TIDAK merender React. Ia hanya menyalin dist/index.html ke
 * dist/<path>/index.html dan mengganti blok metadata di antara penanda
 * SEO:MULAI / SEO:SELESAI dengan metadata rute tersebut. Hasilnya: setiap rute
 * punya judul, deskripsi, kanonik, dan JSON-LD yang benar sejak byte pertama,
 * tanpa menambah dependensi prerender dan tanpa risiko hidrasi.
 *
 * Selain itu skrip ini menulis dist/sitemap.xml dari daftar rute yang sama,
 * supaya sitemap tidak pernah menyimpang dari aplikasi.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(akar, 'dist');
const data = JSON.parse(readFileSync(join(akar, 'app', 'rute.json'), 'utf8'));
const SITUS = data.situs;
const RUTE = data.rute;

const MULAI = '<!-- SEO:MULAI -->';
const SELESAI = '<!-- SEO:SELESAI -->';

const lompat = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function blokMeta(rute) {
  const url = `${SITUS}${rute.path}`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITUS}/#situs`,
        name: 'JRH Atlas',
        url: `${SITUS}/`,
        inLanguage: 'id',
        description:
          'Atlas anatomi 3D interaktif berbahasa Indonesia untuk pelajar SD, SMP, dan SMA.',
      },
      {
        '@type': 'LearningResource',
        '@id': `${url}#sumber`,
        name: rute.judul,
        description: rute.deskripsi,
        url,
        inLanguage: 'id',
        isAccessibleForFree: true,
        learningResourceType: 'Atlas anatomi interaktif',
        educationalLevel: ['SD', 'SMP', 'SMA'],
        audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
        isPartOf: { '@id': `${SITUS}/#situs` },
      },
    ],
  };

  return [
    MULAI,
    `    <title>${lompat(rute.judul)}</title>`,
    `    <meta name="description" content="${lompat(rute.deskripsi)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:title" content="${lompat(rute.judul)}" />`,
    `    <meta property="og:description" content="${lompat(rute.deskripsi)}" />`,
    '    <meta property="og:type" content="website" />',
    '    <meta property="og:locale" content="id_ID" />',
    `    <meta property="og:url" content="${url}" />`,
    '    <meta name="twitter:card" content="summary" />',
    `    <meta name="twitter:title" content="${lompat(rute.judul)}" />`,
    `    <meta name="twitter:description" content="${lompat(rute.deskripsi)}" />`,
    `    <script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
    SELESAI,
  ].join('\n');
}

let kerangka;
try {
  kerangka = readFileSync(join(dist, 'index.html'), 'utf8');
} catch {
  console.error('✗ dist/index.html tidak ditemukan. Jalankan vite build lebih dulu.');
  process.exit(1);
}

if (!kerangka.includes(MULAI) || !kerangka.includes(SELESAI)) {
  console.error(
    `✗ web/index.html tidak memuat penanda ${MULAI} … ${SELESAI}. Tanpa penanda, metadata per rute tidak bisa disuntikkan.`,
  );
  process.exit(1);
}

const pola = new RegExp(`${MULAI}[\\s\\S]*?${SELESAI}`);

for (const rute of RUTE) {
  const html = kerangka.replace(pola, blokMeta(rute));
  const tujuan =
    rute.path === '/' ? join(dist, 'index.html') : join(dist, rute.path, 'index.html');
  mkdirSync(dirname(tujuan), { recursive: true });
  writeFileSync(tujuan, html, 'utf8');
  console.log(`✓ ${rute.path.padEnd(12)} → ${tujuan.replace(akar + '/', '')}`);
}

const tanggal = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...RUTE.map(
    (r) =>
      `  <url><loc>${SITUS}${r.path}</loc><lastmod>${tanggal}</lastmod><changefreq>monthly</changefreq></url>`,
  ),
  '</urlset>',
  '',
].join('\n');
writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8');
console.log(`✓ sitemap.xml (${RUTE.length} URL)`);
