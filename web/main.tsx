import {createRoot} from 'react-dom/client';
import Cangkang from '../app/cangkang';
import {bacaTema,terapkanTema} from '../app/tema';
import '../app/globals.css';
import '../app/polish.css';

// Terapkan tema sebelum render pertama supya tidak ada kilatan warna.
const {mode,palet}=bacaTema();
terapkanTema(mode,palet);

createRoot(document.getElementById('root'!)).render(<Cangkang/>);
