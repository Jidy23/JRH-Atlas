import { useMemo, useState, type CSSProperties } from 'react';
import { JENJANG, ORGAN, organByName, type Jenjang } from './kurikulum';
import { TUR, organLangkah, turUntuk } from './belajar';
import { acak, bankSoal, deck, nilai, predikat, type Soal } from './kuis';
import './akademi.css';

type Mode = 'belajar' | 'kuis' | 'flashcard';

/* --------------------------- Komponen kecil --------------------------- */

function PilihJenjang({ nilai: v, ubah }: { nilai: Jenjang; ubah: (j: Jenjang) => void }) {
  return (
    <div className="jenjang" role="radiogroup" aria-label="Pilih jenjang">
      {JENJANG.map((j) => (
        <button
          key={j.id}
          type="button"
          role="radio"
          aria-checked={v === j.id}
          className={v === j.id ? 'jbtn aktif' : 'jbtn'}
          style={{ '--w': j.warna } as CSSProperties}
          onClick={() => ubah(j.id)}
        >
          <b>{j.name}</b>
          <small>{j.umur}</small>
          <small>{j.tagline}</small>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ BELAJAR ------------------------------ */

export function Belajar() {
  const [jenjang, setJenjang] = useState<Jenjang>('sd');
  const [i, setI] = useState(0);
  const tur = useMemo(() => turUntuk(jenjang), [jenjang]);

  const l = tur.langkah[i];
  const organ = organLangkah(l);
  const terakhir = i === tur.langkah.length - 1;

  function pindah(n: number) {
    setI(Math.max(0, Math.min(tur.langkah.length - 1, n)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function gantiJenjang(j: Jenjang) {
    setJenjang(j);
    setI(0);
  }

  return (
    <section className="akademi">
      <PilihJenjang nilai={jenjang} ubah={gantiJenjang} />

      <div className="tur-kepala">
        <span className="lencana">Mode Belajar · {tur.durasi}</span>
        <h2>{tur.judul}</h2>
        <p>{tur.tujuan}</p>
        <div className="progres" aria-label={`Langkah ${i + 1} dari ${tur.langkah.length}`}>
          <div className="progres-isi" style={{ width: `${((i + 1) / tur.langkah.length) * 100}%` }} />
        </div>
      </div>

      <article className="kartu-besar" key={`${tur.id}-${i}`}>
        <span className="langkah-ke">Langkah {i + 1} dari {tur.langkah.length}</span>
        <h3>{l.judul}</h3>
        <p className="isi">{l.isi}</p>

        {organ && (
          <div className="organ-ringkas">
            <div className="organ-nama">
              <span className="emoji" aria-hidden>{'🫀'}</span>
              <div>
                <strong>{organ.id}</strong>
                <small>{organ.inti}</small>
              </div>
              {l.tampilan && <span className="chip">Tampilan {l.tampilan}</span>}
            </div>
            <ul className="fakta">
              {organ.fakta.slice(0, 2).map((f) => <li key={f}>{f}</li>)}
            </ul>
            {organ.mitos && <p className="mitos"><b>Mitos vs Fakta:</b> {organ.mitos}</p>}
          </div>
        )}

        {l.refleksi && <p className="refleksi"><b>Pikirkan:</b> {l.refleksi}</p>}

        <div className="navigasi">
          <button type="button" className="tombol" onClick={() => pindah(i - 1)} disabled={i === 0}>
            Sebelumnya
          </button>
          <button
            type="button"
            className="tombol utama"
            onClick={() => (terakhir ? setI(0) : pindah(i + 1))}
          >
            {terakhir ? 'Ulangi tur' : 'Lanjut'}
          </button>
        </div>
      </article>

      <details className="daftar-tur">
        <summary>Daftar tur yang tersedia</summary>
        <ul>
          {TUR.map((t) => (
            <li key={t.id}>
              <b>{t.judul}</b> · {t.jenjang.toUpperCase()} · {t.durasi}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

/* -------------------------------- KUIS -------------------------------- */

export function Kuis() {
  const [jenjang, setJenjang] = useState<Jenjang>('smp');
  const [mulai, setMulai] = useState(false);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [n, setN] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [benar, setBenar] = useState(0);
  const [selesai, setSelesai] = useState(false);

  function mulaiKuis() {
    setSoal(acak(bankSoal(jenjang)));
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
        <p className="leads">
          Soal diambil langsung dari kurikulum, jadi setiap jenjang punya set pertanyaan berbeda.
          Jawaban salah tetap diberi penjelasan, supaya kamu belajar dari kesalahan.
        </p>
        <PilihJenjang nilai={jenjang} ubah={setJenjang} />
        <button type="button" className="tombol utama besar" onClick={mulaiKuis}>
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
            <button type="button" className="tombol" onClick={mulaiKuis}>Ulangi</button>
            <button type="button" className="tombol utama" onClick={() => setMulai(false)}>Ganti jenjang</button>
          </div>
        </div>
      </section>
    );
  }

  const s = soal[n];
  return (
    <section className="akademi">
      <div className="kuis-head">
        <span className="lencana">Soal {n + 1} dari {soal.length}</span>
        <span className="chip">{s.organ}</span>
      </div>

      <article className="kartu-besar" key={s.id}>
        <h3>{s.pertanyaan}</h3>
        <div className="pilihan">
          {s.pilihan.map((p, idx) => {
            let kelas = 'pilih';
            if (pilih !== null) {
              if (idx === s.jawaban) kelas += ' benar';
              else if (idx === pilih) kelas += ' salah';
            }
            return (
              <button key={p} type="button" className={kelas} onClick={() => jawab(idx)} disabled={pilih !== null}>
                <span className="huruf">{String.fromCharCode(65 + idx)}</span>
                {p}
              </button>
            );
          })}
        </div>

        {pilih !== null && (
          <div className="umpan">
            <p>
              <b>{pilih === s.jawaban ? 'Benar. ' : 'Belum tepat. '}</b>
              {s.alasan}
            </p>
            <button type="button" className="tombol utama" onClick={lanjut}>
              {n + 1 >= soal.length ? 'Lihat hasil' : 'Soal berikutnya'}
            </button>
          </div>
        )}
      </article>
    </section>
  );
}

/* ----------------------------- FLASHCARD ----------------------------- */

const MODE = [
  { id: 'nama', label: 'Tebak nama organ' },
  { id: 'fungsi', label: 'Tebak fungsi' },
  { id: 'fakta', label: 'Tebak fakta' },
] as const;

type ModeKartu = (typeof MODE)[number]['id'];

export function Flashcard() {
  const [jenjang, setJenjang] = useState<Jenjang | 'semua'>('semua');
  const [mode, setMode] = useState<ModeKartu>('nama');
  const [i, setI] = useState(0);
  const [balik, setBalik] = useState(false);
  const [dihafal, setDihafal] = useState(0);

  const kartu = useMemo(
    () => deck(jenjang === 'semua' ? undefined : jenjang, mode),
    [jenjang, mode]
  );

  const total = kartu.length;
  const k = kartu[i % total];

  function geser(arah: 1 | -1) {
    setBalik(false);
    setI((x) => (x + arah + total) % total);
  }

  function tandai(hafal: boolean) {
    if (hafal) setDihafal((h) => h + 1);
    geser(1);
  }

  return (
    <section className="akademi">
      <h2>Flashcard</h2>
      <p className="leads">
        Ketuk kartu untuk membuka jawaban. Tandai “sudah hafal” hanya jika kamu bisa menjawab
        tanpa membukanya. Pengulangan berjeda membuat ingatan bertahan lebih lama.
      </p>

      <div className="filter">
        <select
          aria-label="Pilih jenjang"
          value={jenjang}
          onChange={(e) => {
            setJenjang(e.target.value as Jenjang | 'semua');
            setI(0);
            setBalik(false);
          }}
        >
          <option value="semua">Semua jenjang</option>
          {JENJANG.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
        </select>

        <select
          aria-label="Pilih jenis kartu"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as ModeKartu);
            setI(0);
            setBalik(false);
          }}
        >
          {MODE.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <button
        type="button"
        className={balik ? 'kartu balik' : 'kartu'}
        onClick={() => setBalik((b) => !b)}
        aria-live="polite"
      >
        <span className="kartu-sisi">{balik ? 'JAWABAN' : 'PERTANYAAN'}</span>
        <strong>{balik ? k.belakang : k.depan}</strong>
        <small>{balik ? 'ketuk untuk menutup' : 'ketuk untuk membuka'}</small>
      </button>

      <div className="navigasi">
        <button type="button" className="tombol" onClick={() => geser(-1)} aria-label="Kartu sebelumnya">Sebelumnya</button>
        <span className="chip">{(i % total) + 1} / {total}</span>
        <button type="button" className="tombol" onClick={() => geser(1)} aria-label="Kartu berikutnya">Berikutnya</button>
      </div>

      <div className="navigasi">
        <button type="button" className="tombol" onClick={() => tandai(false)}>Belum hafal</button>
        <button type="button" className="tombol utama" onClick={() => tandai(true)}>Sudah hafal</button>
      </div>

      <p className="catatan-kecil">
        {dihafal > 0 ? `${dihafal} kartu ditandai hafal sesi ini. ` : ''}
        Ulangi besok untuk mengunci ingatan.
      </p>
    </section>
  );
}

/* ------------------------------- WADAH ------------------------------- */

export function Akademi({ awal }: { awal: Mode }) {
  const [mode, setMode] = useState<Mode>(awal);

  const JUDUL: Record<Mode, string> = {
    belajar: 'Belajar',
    kuis: 'Kuis',
    flashcard: 'Flashcard',
  };

  return (
    <div className="akademi-wrap">
      <nav className="subtab" aria-label="Mode belajar">
        {(Object.keys(JUDUL) as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={mode === m ? 'sub aktif' : 'sub'}
            onClick={() => setMode(m)}
            aria-current={mode === m ? 'page' : undefined}
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

/* ------------------- Panel detail organ (viewer 3D) ------------------- */

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

/** Ringkasan jumlah organ per jenjang — dipakai di beranda */
export function RingkasanJenjang() {
  return (
    <div className="ringkasan">
      {JENJANG.map((j) => {
        const n = ORGAN.filter((o) => o.jenjang === j.id).length;
        return (
          <div key={j.id} className="ringkas-kartu" style={{ '--w': j.warna } as CSSProperties}>
            <b>{j.name}</b>
            <span>{n} organ</span>
            <small>{j.tagline}</small>
          </div>
        );
      })}
    </div>
  );
}
