// Urutan impor menentukan urutan lapisan CSS: modul dievaluasi mengikuti urutan
// sumber, jadi impor CSS di bawah dieksekusi berurutan.
//
// skala.css WAJIB paling awal (DESIGN.md aturan #8). Berkas itu mendefinisikan
// --sp-*, --r-*, --t-*, --e-*, --z-*, --d-*, dan --font-sans. Lapisan mana pun
// yang dievaluasi sebelum skala.css akan membaca token yang belum ada, dan
// var() tanpa fallback jatuh ke nilai awal tanpa galat — bug yang tidak
// terlihat sampai tata letaknya aneh. scripts/audit-skala.mjs memeriksa urutan
// ini, jadi memindahkannya akan menggagalkan CI, bukan hanya terasa salah.
//
// Setelah skala: globals.css, lalu lapisan milik cangkang.tsx (ekstra,
// redesign, akademi, interaction, tema), lalu polish.css benar-benar paling
// akhir.
//
// Sebelumnya `Cangkang` diimpor lebih dulu, sehingga globals.css dan polish.css
// dievaluasi SETELAH tema.css. polish.css masih menang karena posisinya paling
// akhir, tetapi globals.css jatuh di tengah tumpukan — bertentangan dengan
// asumsi yang ditulis di kepala polish.css dan membuat tata letak viewer
// bergantung pada kebetulan spesifisitas, bukan urutan.
import '../app/skala.css';
import '../app/globals.css';
import {createRoot} from 'react-dom/client';
import Cangkang from '../app/cangkang';
import {bacaTema,terapkanTema} from '../app/tema';
import '../app/polish.css';

// Terapkan tema sebelum render pertama supaya tidak ada kilatan warna.
const {mode,palet}=bacaTema();
terapkanTema(mode,palet);

createRoot(document.getElementById('root')!).render(<Cangkang/>);
