import { useEffect, useRef, useState } from 'react';
import { MODE, PALET, bacaTema, pantauSistem, simpanTema, type IdPalet, type ModeTema } from './tema';
import './tema.css';

/** Tombol tema: buka panel kecil berisi mode + palet. */
export default function Tema() {
  const [buka, setBuka] = useState(false);
  const [mode, setMode] = useState<ModeTema>('auto');
  const [palet, setPalet] = useState<IdPalet>('nusantara');
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = bacaTema();
    setMode(t.mode);
    setPalet(t.palet);
    return pantauSistem(t.mode, t.palet);
  }, []);

  useEffect(() => {
    if (!buka) return;
    const onKlik = (e: MouseEvent) => {
      if (kotak.current && !kotak.current.contains(e.target as Node)) setBuka(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setBuka(false);
    document.addEventListener('mousedown', onKlik);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onKlik);
      document.removeEventListener('keydown', onEsc);
    };
  }, [buka]);

  function gantiMode(m: ModeTema) {
    setMode(m);
    simpanTema(m, palet);
  }

  function gantiPalet(p: IdPalet) {
    setPalet(p);
    simpanTema(mode, p);
  }

  return (
    <div className="tema" ref={kotak}>
      <button
        type="button"
        className="tema-tombol"
        aria-expanded={buka}
        aria-haspopup="dialog"
        aria-label="Atur tampilan dan warna"
        onClick={() => setBuka((b) => !b)}
      >
        <span aria-hidden>🎨</span>
        <span className="tema-label">Tampilan</span>
      </button>

      {buka && (
        <div className="tema-panel" role="dialog" aria-label="Pengaturan tampilan">
          <div className="tema-bagian">
            <span className="tema-judul">Mode</span>
            <div className="tema-mode" role="radiogroup" aria-label="Mode tampilan">
              {MODE.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.id}
                  className={mode === m.id ? 'mode aktif' : 'mode'}
                  onClick={() => gantiMode(m.id)}
                >
                  <span aria-hidden>{m.ikon}</span>
                  {m.nama}
                </button>
              ))}
            </div>
          </div>

          <div className="tema-bagian">
            <span className="tema-judul">Palet warna</span>
            <div className="tema-palet" role="radiogroup" aria-label="Palet warna">
              {PALET.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={palet === p.id}
                  className={palet === p.id ? 'palet aktif' : 'palet'}
                  onClick={() => gantiPalet(p.id)}
                  title={p.asal}
                >
                  <span
                    className="palet-warna"
                    style={{ background: `linear-gradient(135deg, ${p.aksen}, ${p.aksen2})` }}
                    aria-hidden
                  />
                  <span className="palet-nama">{p.nama}</span>
                  <span className="palet-asal">{p.asal}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="tema-catatan">Pilihan disimpan di perangkat ini.</p>
        </div>
      )}
    </div>
  );
}
