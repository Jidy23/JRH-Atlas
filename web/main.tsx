// Urutan impor menentukan urutan lapisan CSS: modul dievaluasi mengikuti urutan
// sumber, jadi impor CSS di bawah dieksekusi berurutan. globals.css harus paling
// awal, lalu lapisan milik cangkang.tsx (ekstra, redesign, akademi, interaction,
// tema), lalu polish.css benar-benar paling akhir.
//
// Sebelumnya `Cangkang` diimpor lebih dulu, sehingga globals.css dan polish.css
// dievaluasi SETELAH tema.css. polish.css masih menang karena posisinya paling
// akhir, tetapi globals.css jatuh di tengah tumpukan — bertentangan dengan
// asumsi yang ditulis di kepala polish.css dan membuat tata letak viewer
// bergantung pada kebetulan spesifisitas, bukan urutan.
import '../app/globals.css';
import {createRoot} from 'react-dom/client';
import Cangkang from '../app/cangkang';
import {bacaTema,terapkanTema} from '../app/tema';
import '../app/polish.css';

// Terapkan tema sebelum render pertama supaya tidak ada kilatan warna.
const {mode,palet}=bacaTema();
terapkanTema(mode,palet);

createRoot(document.getElementById('root')!).render(<Cangkang/>);
