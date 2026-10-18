/**
 * Audit kontras WCAG untuk semua palet JRH Atlas.
 * Jalankan: npm run audit:kontras
 * Keluar dengan kode 1 bila ada pasangan yang gagal AA (4.5:1).
 */
import { periksa, type StatusKontras } from '../app/kontras.ts';

type Palet = { id: string; nama: string; terang: Pasangan; gelap: Pasangan };
type Pasangan = { latar: string; teks: string; redup: string; aksen: string; garis: string };

const PALET: Palet[] = [
  { id: 'nusantara', nama: 'Nusantara',
    terang: { latar: '#f7f5f0', teks: '#1c1a17', redup: '#5c574e', aksen: '#0e7490', garis: '#d8d2c6' },
    gelap:  { latar: '#14161a', teks: '#eceff3', redup: '#a7afba', aksen: '#4cc9e0', garis: '#2b313a' } },
  { id: 'samudra', nama: 'Samudra',
    terang: { latar: '#f2f7fb', teks: '#0d1b26', redup: '#4d6472', aksen: '#0369a1', garis: '#c9dae6' },
    gelap:  { latar: '#0b1219', teks: '#e6eef5', redup: '#9fb3c2', aksen: '#5ab0e6', garis: '#1e2c38' } },
  { id: 'senja', nama: 'Senja',
    terang: { latar: '#fdf6f1', teks: '#241512', redup: '#6b5750', aksen: '#b4441f', garis: '#e8d7cc' },
    gelap:  { latar: '#17110f', teks: '#f4eae4', redup: '#c0a99f', aksen: '#f08a5d', garis: '#33241e' } },
  { id: 'zamrud', nama: 'Zamrud',
    terang: { latar: '#f3f8f3', teks: '#0f1f15', redup: '#4e6152', aksen: '#047857', garis: '#cbdccd' },
    gelap:  { latar: '#0c1510', teks: '#e7f1e9', redup: '#9db5a2', aksen: '#4ade80', garis: '#1e2e23' } },
  { id: 'koral', nama: 'Koral',
    terang: { latar: '#fdf4f7', teks: '#241318', redup: '#6d5058', aksen: '#a8205a', garis: '#e6cdd6' },
    gelap:  { latar: '#161013', teks: '#f4e8ec', redup: '#c2a5ae', aksen: '#f472b6', garis: '#312128' } },
];

const HASIL: StatusKontras[] = [];
for (const p of PALET) {
  for (const [mode, c] of [['terang', p.terang], ['gelap', p.gelap]] as const) {
    const tag = `${p.nama} · ${mode}`;
    HASIL.push(periksa(c.teks, c.latar, `${tag} — teks utama`));
    HASIL.push(periksa(c.redup, c.latar, `${tag} — teks redup`));
    HASIL.push(periksa(c.aksen, c.latar, `${tag} — aksen`));
  }
}

const gagal = HASIL.filter((h) => !h.aaTeks);
for (const h of HASIL) {
  const tanda = h.aaaTeks ? 'AAA' : h.aaTeks ? ' AA' : 'GAGAL';
  console.log(`${tanda.padStart(5)}  ${h.rasio.toFixed(2).padStart(5)}:1  ${h.pasangan}`);
}
console.log(`\n${HASIL.length} pasangan diperiksa, ${gagal.length} gagal AA.`);
process.exit(gagal.length ? 1 : 0);
