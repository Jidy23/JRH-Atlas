import { useMemo, useState } from 'react';
import { JENJANG, ORGAN, organByName, type Jenjang } from './kurikulum';
import { TUR, organLangkah, turUntuk } from './belajar';
import { acak, bankSoal, deck, nilai, predikat, type Soal } from './kuis';
import './akademi.css';

type Mode = 'belajar' | 'kuis' | 'flashcard';

/** Kartu label jenjang — reusable */
function PilihJenjang({ nilai: v, ubah }: { nilai: Jenjang; ubah: (j: Jenjang) => void }) {
  return (
    <div className="jenjang" role="radiogroup" aria-label="Pilih jenjang">
      {JENJANG.map((j) => (
        <button
          key={j.id}
          role="radio"
          aria-checked={v === j.id}
          className={v === j.id ? 'jbtn aktif' : 'jbtn'}
          style={{ '--w': j.warna } as React.CSSProperties}
          onClick={() => ubah(j.id)}
        >
          <b>{j.name}</b>
          <small>{j.umur}</small>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- BELAJAR ---------------------------- */
export function Belajar() {
  const [jenjang, setJenjang] = useState<Jenjang>('sd');
  const tur = useMemo(() => turUntuk(jenjang), [jenjang]);
  const [i, setI] = useState(0);

  const l = tur.langkah[i];
  const organ = organLangkah(l);
  const terakhir = i === tur.langkah.length - 1;

  function pindah(n: number) {
    setI(Math.max(0, Math.min(tur.langkah.length - 1, n)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="akademi">
      <PilihJenjang
        nilai={jenjang}
        ubah={(j) => {
          setJenjang(j);
          setI(0);
        }}
      />

      <div className="tur-kepala">
        <div>
          <span className="lencana">Mode Belajar · {tur.durasi}</span>
          <h2>{tur.judul}</h2>
          <p>{tur.tujuan}</p>
        </div>
        <div className="progres" aria-label={`Langkah ${i + 1} dari ${tur.langkah.length}`}>
          <div className="progres-isi" style={{ width: `${((i + 1) / tur.langkah.length) * 100}%` }} />
        </div>
      </div>

      <article className="kartu-besar" key={i}>
        <span className="langkah-ke">Langkah {i + 1} / {tur.langkah.length}</span>
        <h3>{l.judul}</h3>
        <p className="isi">{l.isi}</p>

        {organ && (
          <div className="organ-ringkas">
            <div className="organ-nama">
              <span className="emoji" aria-hidden>🫀</span>
              <div>
                <strong>{organ.id}</strong>
                <small>{organ.inti}</small>
              </div>
              {l.tampilan && <span className="chip">Tampilan: {l.tampilan}</span>}
            </div>
            <ul className="fakta">
              {organ.fakta.slice(0, 2).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {organ.mitos && (
              <p className="mitos">
                <b>Mitos vs Fakta:</b> {organ.mitos}
              </p>
            )}
          </div>
        )}

        {l.refleksi && (
          <p className="refleksi">
            <b>Pikirkan:</b> {l.refleksi}
          </p>
        )}

        <div className="navigasi">
          <button className="tombol" onClick={() => pindah(i - 1)} disabled={i === 0}>
            ← Sebelumnya
          </button>
          <button
            className="tombol utama"
            onClick={() => (terakhir ? setI(0) : pindah(i + 1))}
          >
            {terakhir ? 'Ulangi tur' : 'Lanjut →'}
          </button>
        </div>
      </article>

      <details className="daftar-tur">
        <summary>Tur lain</summary>
        <ul>
          {TUR.map((t) => (
            <li key={t.id}>
              <b>{t.judul}</b> — {t.jenjang.toUpperCase()} · {t.durasi}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

/* ------------------------------ KUIS ------------------------------ */
export function Kuis() {
  const [jenjang, setJenjang] = useState<Jenjang>('smp');
  const [mulai, setMulai] = useState(false);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [n, setN] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [benar, setBenar] = useState(0);
  const [selesai, setSelesai] = useState(false);

  function mulaiKuis() {
    const bank = acak(bankSoal(jenjang));
    setSoal(bank);
    setN(0);
    setBenar(0);
    setPilih(null);
    setSelesai(false);
    setMulai(true);
  }

  function jawab(idx: number) {
    if (pilih !== null) return;
    setPilih(idx);
    if (idx === soal[n].jawaban) setBenar((b) => b + 1);
  }

  function lanjut() {
    if (n + 1 >= soal.length) setSelesai(true);
    else {
      setN(n + 1);
      setPilih(null);
    }
  }

  if (!mulai) {
    return (
      <section className="akademi">
        <h2>Kuis Anatomi</h2>
        <p className="leads">Pilih jenjang. Soal dibuat langsung dari kurikulum, jadi jumlahnya mengikuti jumlah organ.</p>
        <PilihJenjang nilai={jenjang} ubah={setJenjang} />
        <button className="tombol utama besar" onClick={mulaiKuis}>
          Mulai kuis · {bankSoal(jenjang).length} soal
        </button>
      </section>
    );
  }

  if (selesai) {
    const skor = nilai(benar, soal.length);
    const p = predikat(skor);
    return (
      <section className="akademi">
        <div className="hasil">
          <span className="emoji-besar" aria-hidden>{p.emoji}</span>
          <h2>{p.label}</h2>
          <p className="skor">{skor}<small>/100</small></p>
          <p>{benar} benar dari {soal.length} soal</p>
          <p className="leads">{p.pesan}</p>
          <div className="navigasi">
            <button className="tombol" onClick={mulaiKuis}>Ulangi</button>
            <button className="tombol utama" onClick={() => setMulai(false)}>Ganti jenjang</button>
          </div>
        </div>
      </section>
    );
  }

  const s = soal[n];
  return (
    <section className="akademi">
      <div className="kuis-head">
        <span className="lencana">Soal {n + 1} / {soal.length}</span>
        <span className="chip">{s.organ}</span>
      </div>

      <article className="kartu-besar">
        <h3>{s.pertanyaan}</h3>
        <div className="pilihan">
          {s.pilihan.map((p, idx) => {
            let kelas = 'pilih';
            if (pilih !== null) {
              if (idx === s.jawaban) kelas += ' benar';
              else if (idx === pilih) kelas += ' salah';
            }
            return (
              <button key={p} className={kelas} onClick={() => jawab(idx)} disabled={pilih !== null}>
                <span className="huruf">{String.fromCharCode(65 + idx)}</span>
                {p}
              </button>
            );
          })}
        </div>

        {pilih !== null && (
          <div className="umpan">
            <p><b>{pilih === s.jawaban ? 'Benar! ' : 'Belum tepat. '}</b>{s.alasan}</p>
            <button className="tombol utama" onClick={lanjut}>
              {n + 1 >= soal.length ? 'Lihat hasil' : 'Soal berikutnya →'}
            </button>
          </div>
        )}
      </article>
    </section>
  );
}

/* --------------------------- FLASHCARD --------------------------- */
const MODE = [
  { id: 'nama', label: 'Tebak nama organ' },
  { id: 'fungsi', label: 'Tebak fungsi' },
  { id: 'fakta', label: 'Tebak fakta' },
] as const;

export function Flashcard() {
  const [jenjang, setJenjang] = useState<Jenjang | 'semua'>('semua');
  const [mode, setMode] = useState<(typeof MODE)[number]['id']>('nama');
  const [i, setI] = useState(0);
  const [balik, setBalik] = useState(false);
  const [hafal, setHafal] = useState(0);

  const kartu = useMemo(
    () => deck(jenjang === 'semua' ? undefined : jenjang, mode),
    [jenjang, mode]
  );
  const k = kartu[i % kartu.length];

  function geser(arah: 1 | -1) {
    setBalik(false);
    setI((x) => (x + arah + kartu.length) % kartu.length);
  }

  return (
    <section className="akademi">
      <h2>Flashcard</h2>
      <p className="leads">Tap kartu untuk melihat jawaban. Tandai "hafal" bila sudah bisa menjawab tanpa membuka.</p>

      <div className="filter">
        <select value={jenjang} onChange={(e) => { setJenjang(e.target.value as Jenjang | 'semua'); setI(0); setBalik(false); }}>
          <option value="semua">Semua jenjang</option>
          {JENJANG.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>
        <select value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); setI(0); setBalik(false); }}>
          {MODE.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <button className={balik ? 'kartu balik' : 'kartu'} onClick={() => setBalik((b) => !b)} aria-live="polite">
        <span className="kartu-sisi">{balik ? 'JAWABAN' : 'PERTANYAAN'}</span>
        <strong>{balik ? k.belakang : k.depan}</strong>
        <small>{balik ? 'tap untuk menutup' : 'tap untuk membuka'}</small>
      </button>

      <div className="navigasi">
        <button className="tombol" onClick={() => geser(-1)}>←</button>
        <span className="chip">{(i % kartu.length) + 1} / {kartu.length}</span>
        <button className="tombol" onClick={() => geser(1)}>→</button>
      </div>

      <div className="navigasi">
        <button className="tombol" onClick={() => { setHafal((h) => h + 1); geser(1); }}>Belum hafal</button>
        <button className="tombol utama" onClick={() => { setHafal((h) => h + 1); geser(1); }}>Sudah hafal</button>
      </div>
      <p className="catatan-kecil">Kartu ditandai hafal bisa diulang besok lagi — pengulangan berjeda membantu ingatan jangka panjang.</p>
    </section>
  );
}

/* --------------------------- WADAH --------------------------- */
export function Akademi({ awal }: { awal: Mode }) {
  const [mode, setMode] = useState<Mode>(awal);

  const JUDUL: Record<Mode, string> = {
    belajar: 'Belajar terpandu',
    kuis: 'Kuis',
    flashcard: 'Flashcard',
  };

  return (
    <div className="akademi-wrap">
      <nav className="subtab" aria-label="Mode belajar">
        {(Object.keys(JUDUL) as Mode[]).map((m) => (
          <button
            key={m}
            className={mode === m ? 'sub aktif' : 'sub'}
            onClick={() => setMode(m)}
            aria-current={mode === m}
          >
            {JUDUL[m]}
          </button>
        ))}
      </nav>

      {mode === 'belajar' && <Belajar />}
      {mode === 'kuis' && <Kuis />}
      {mode === 'flashcard' && <Flashcard />}
    </div>
  );
}

/** Panel detail organ (dipakai viewer 3D) */
export function DetailOrgan({ nama }: { nama: string }) {
  const o = organByName(nama);
  if (!o) return null;
  return (
    <div className="detail-organ">
      <span className="chip">{o.id}</span>
      <p className="inti">{o.inti}</p>
      <p>{o.fungsi}</p>
      <ul className="fakta">
        {o.fakta.map((f) => <li key={f}>{f}</li>)}
      </ul>
      {o.mitos && <p className="mitos"><b>Mitos vs Fakta:</b> {o.mitos}</p>}
      <p className="catatan-kecil">Dibahas di jenjang {o.jenjang.toUpperCase()}.</p>
    </div>
  );
}
