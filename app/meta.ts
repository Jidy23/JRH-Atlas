/**
 * JRH Atlas — metadata per rute.
 *
 * Keenam rute berbagi satu index.html, jadi judul, deskripsi, tautan kanonik,
 * dan data terstruktur harus dipasang setiap kali rute berpindah. Tanpa ini
 * semua rute tampil dengan judul yang sama di tab browser dan riwayat.
 *
 * og:image sengaja belum dipasang: gambar 1200x630 belum ada di repo, dan
 * menuliskan tautan ke berkas yang tidak ada lebih buruk daripada tidak ada
 * tag sama sekali. Kartu ringkas (twitter:card=summary) tetap sah tanpa gambar.
 */
import { SITUS, type Rute } from './rute';

/**
 * tsconfig memuat @cloudflare/workers-types, yang mendeklarasikan ulang
 * `document.head` dengan tipe Element milik HTMLRewriter. `append` pada tipe itu
 * hanya menerima string | ReadableStream | Response, sehingga menyisipkan node
 * ditolak typecheck walaupun sah di browser. Satu cast sempit di sini jauh lebih
 * kecil risikonya daripada mengubah `types` di tsconfig dan berpotensi
 * mengganggu berkas lain.
 */
const kepala = () => document.head as unknown as { append(...nodes: unknown[]): void };

function meta(jenis: 'name' | 'property', kunci: string, isi: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${jenis}="${kunci}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(jenis, kunci);
    kepala().append(el);
  }
  el.setAttribute('content', isi);
}

function tautan(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    kepala().append(el);
  }
  el.setAttribute('href', href);
}

function dataTerstruktur(rute: Rute, url: string) {
  const id = 'data-jsonld-rute';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    kepala().append(el);
  }
  el.textContent = JSON.stringify({
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
  });
}

export function terapkanMeta(rute: Rute) {
  const url = `${SITUS}${rute.path}`;
  document.title = rute.judul;
  meta('name', 'description', rute.deskripsi);
  meta('property', 'og:title', rute.judul);
  meta('property', 'og:description', rute.deskripsi);
  meta('property', 'og:type', 'website');
  meta('property', 'og:locale', 'id_ID');
  meta('property', 'og:url', url);
  meta('name', 'twitter:card', 'summary');
  meta('name', 'twitter:title', rute.judul);
  meta('name', 'twitter:description', rute.deskripsi);
  tautan('canonical', url);
  dataTerstruktur(rute, url);
}
