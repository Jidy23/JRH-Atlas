import { useEffect, useState } from 'react';
import Home from './page';
import { Akademi } from './akademi';
import { Glosarium, Panduan } from './halaman';

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

export default function Cangkang() {
  const [tab, setTab] = useState<Tab>('jelajah');

  useEffect(() => {
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
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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
      </nav>

      <main className="isi">
        {tab === 'jelajah' && (
          <>
            <div className="info-jelajah">
              <span>
                <b>Jelajah 3D</b> — ketuk bagian tubuh untuk melihat nama dan penjelasannya.
              </span>
              <button type="button" className="tautan" onClick={() => pilih('belajar')}>
                Baru pertama kali? Buka <b>Mode Belajar</b>
              </button>
            </div>
            <Home />
          </>
        )}

        {akademi && <Akademi awal={tab as 'belajar' | 'kuis' | 'flashcard'} />}
        {tab === 'glosarium' && <div className="akademi-wrap"><Glosarium /></div>}
        {tab === 'panduan' && <div className="akademi-wrap"><Panduan /></div>}
      </main>
    </div>
  );
}
