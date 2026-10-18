import { useEffect, useState } from 'react';
import Home, { type Sorotan } from './page';
import { Akademi } from './akademi';
import { Glosarium, Panduan } from './halaman';
import Tema from './tombol-tema';
import { terapkanTema, bacaTema } from './tema';
import { turUntuk, organLangkah } from './belajar';
import type { Jenjang } from './kurikulum';
import './ekstra.css';

type Tab = 'jelajah' | 'belajar' | 'kuis' | 'flashcard' | 'glosarium' | 'panduan';

const TAB: { id: Tab; label: string; ikon: string }[] = [
  { id: 'jelajah', label: 'Jelajah 3D', ikon: '🧭' },
  { id: 'belajar', label: 'Belajar', ikon: '📖' },
  { id: 'kuis', label: 'Kuis', ikon: '🎯' },
  { id: 'flashcard', label: 'Flashcard', ikon: '🃏' },
  { id: 'glosarium', label: 'Glosarium', ikon: '📚' },
  { id: 'panduan', label: 'Panduan', ikon: 'ℹ️' },
];

function tabDariUrl(): Tab {
  const p = new URLSearchParams(location.search).get('tab') as Tab | null;
  return p && TAB.some((t) => t.id === p) ? p : 'jelajah';
}

function jenjangDariUrl(): Jenjang {
  const p = new URLSearchParams(location.search).get('jenjang');
  return p === 'smp' || p === 'sma' ? p : 'sd';
}

function jenjangKeUrl(j: Jenjang) {
  const url = new URL(location.href);
  url.searchParams.set('jenjang', j);
  history.replaceState(null, '', url);
}

export default function Cangkang() {
  const [tab, setTab] = useState<Tab>('jelajah');
  const [sorotan, setSorotan] = useState<Sorotan | null>(null);

  useEffect(() => {
    // Tema diterapkan sedini mungkin supaya tidak ada kilatan warna.
    const t = bacaTema();
    terapkanTema(t.mode, t.palet);

    setTab(tabDariUrl());
    const onPop = () => setTab(tabDariUrl());
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  function pilih(t: Tab) {
    setTab(t);
    const url = new URL(location.href);
    url.searchParams.set('tab', t);
    history.pushState(null, '', url);
    window.scrollTo({ top: 0 });
  }

  /** Dari Mode Belajar ke viewer 3D. */
  function lihatDi3D(jenjang: Jenjang, indeksLangkah: number) {
    const tur = turUntuk(jenjang);
    const l = tur.langkah[indeksLangkah];
    const organ = organLangkah(l);
    if (!organ) return;
    setSorotan({ sistem: l.sorot, organ: organ.key });
    pilih('jelajah');
  }

  function keBelajar() {
    setSorotan(null);
    pilih('belajar');
  }

  const akademi = tab === 'belajar' || tab === 'kuis' || tab === 'flashcard';

  return (
    <div className="cangkang">
      <nav className="tabbar" role="tablist" aria-label="Bagian JRH Atlas">
        <span className="logo" aria-label="JRH Atlas">
          <b>JRH</b> Atlas
        </span>
        {TAB.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab aktif' : 'tab'}
            onClick={() => pilih(t.id)}
          >
            <span aria-hidden>{t.ikon}</span> {t.label}
          </button>
        ))}
        <Tema />
      </nav>

      <main className="isi">
        {tab === 'jelajah' && (
          <>
            <div className="info-jelajah">
              <span>
                <b>Jelajah 3D</b> — ketuk bagian tubuh untuk nama dan penjelasannya. Bisa dicari dengan kata Indonesia.
              </span>
              <button type="button" className="tautan" onClick={keBelajar}>
                Belum tahu mulai dari mana? Buka <b>Mode Belajar</b>
              </button>
            </div>
            <Home sorotan={sorotan} />
          </>
        )}

        {akademi && (
          <Akademi
            awal={tab as 'belajar' | 'kuis' | 'flashcard'}
            awalJenjang={jenjangDariUrl()}
            onJenjang={jenjangKeUrl}
            onLihat3D={lihatDi3D}
          />
        )}
        {tab === 'glosarium' && <div className="akademi-wrap"><Glosarium /></div>}
        {tab === 'panduan' && <div className="akademi-wrap"><Panduan /></div>}
      </main>
    </div>
  );
}
