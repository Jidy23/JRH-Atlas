/**
 * JRH Atlas — sistem tema
 * mode   : terang | gelap | auto (mengikuti sistem)
 * palet  : Nusantara, Samudra, Senja, Zamrud, Koral
 * Tema diterapkan dengan atribut data-tema dan data-palet di <html>,
 * lalu CSS variabel menimpa viewer 3D maupun ruang belajar.
 */

export type ModeTema = 'terang' | 'gelap' | 'auto';

export type IdPalet = 'nusantara' | 'samudra' | 'senja' | 'zamrud' | 'koral';

export type Palet = {
  id: IdPalet;
  nama: string;
  asal: string;
  aksen: string;
  aksen2: string;
};

export const PALET: Palet[] = [
  { id: 'nusantara', nama: 'Nusantara', asal: 'Batik & wayang', aksen: '#22d3ee', aksen2: '#f59e0b' },
  { id: 'samudra', nama: 'Samudra', asal: 'Laut Banda', aksen: '#38bdf8', aksen2: '#818cf8' },
  { id: 'senja', nama: 'Senja', asal: 'Langit Bromo', aksen: '#fb7185', aksen2: '#fbbf24' },
  { id: 'zamrud', nama: 'Zamrud', asal: 'Hutan Kalimantan', aksen: '#34d399', aksen2: '#a3e635' },
  { id: 'koral', nama: 'Koral', asal: 'Raja Ampat', aksen: '#f472b6', aksen2: '#2dd4bf' },
];

export const MODE: { id: ModeTema; nama: string; ikon: string }[] = [
  { id: 'terang', nama: 'Terang', ikon: '☀️' },
  { id: 'gelap', nama: 'Gelap', ikon: '🌙' },
  { id: 'auto', nama: 'Auto', ikon: '🌗' },
];

const KUNCI = 'jrh-atlas-tema';
const KUNCI_PALET = 'jrh-atlas-palet';

export function bacaTema(): { mode: ModeTema; palet: IdPalet } {
  if (typeof localStorage === 'undefined') return { mode: 'auto', palet: 'nusantara' };
  const mode = (localStorage.getItem(KUNCI) as ModeTema) || 'auto';
  const palet = (localStorage.getItem(KUNCI_PALET) as IdPalet) || 'nusantara';
  const modeSah = MODE.some((m) => m.id === mode) ? mode : 'auto';
  const paletSah = PALET.some((p) => p.id === palet) ? palet : 'nusantara';
  return { mode: modeSah, palet: paletSah };
}

/** Apakah tema gelap sedang aktif (mode auto ikut preferensi sistem)? */
export function sedangGelap(mode: ModeTema) {
  if (mode === 'terang') return false;
  if (mode === 'gelap') return true;
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Terapkan tema ke <html>. */
export function terapkanTema(mode: ModeTema, palet: IdPalet) {
  const html = document.documentElement;
  html.dataset.palet = palet;
  html.dataset.tema = sedangGelap(mode) ? 'gelap' : 'terang';
  html.style.colorScheme = sedangGelap(mode) ? 'dark' : 'light';
  html.classList.toggle('dark', sedangGelap(mode));
}

export function simpanTema(mode: ModeTema, palet: IdPalet) {
  try {
    localStorage.setItem(KUNCI, mode);
    localStorage.setItem(KUNCI_PALET, palet);
  } catch {
    /* mode privat / kuota penuh — abaikan */
  }
  terapkanTema(mode, palet);
}

/** Ikuti perubahan preferensi sistem selama mode = auto. */
export function pantauSistem(mode: ModeTema, palet: IdPalet) {
  if (typeof matchMedia === 'undefined') return () => {};
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const on = () => {
    if (mode === 'auto') terapkanTema(mode, palet);
  };
  mq.addEventListener('change', on);
  return () => mq.removeEventListener('change', on);
}
