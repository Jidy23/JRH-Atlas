import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { JENJANG, ORGAN, organByName, type Jenjang } from './kurikulum';
import { TUR, organLangkah, turUntuk } from './belajar';
import { acak, acakPilihan, bankSoal, deck, nilai, predikat, type Soal } from './kuis';
import { bacaProgres, jatuhTempo, jumlahHafal, kunciKartu, simpanProgres, tandaiKartu, type Progres } from './progres';
import './akademi.css';
import './interaction.css';

type Mode = 'belajar' | 'kuis' | 'flashcard';

/* --------------------------- Komponen kecil --------------------------- */

function PilihJenjang({ nilai: v, ubah }: { nilai: Jenjang; ubah: (j: Jenjang) => void }) {
  return (
    <div className="jenjang" role="group" aria-label="Pilih jenjang">
      {JENJANG.map((j) => (
        <button
          key={j.id}
          type="button"
          aria-pressed={v === j.id}
          className={v === j.id ? 'jbtn aktif' : 'jbtn'}
          style={{ '--w': j.warna } as CSSProperties}
          onClick={() => ubah(j.id)}
        >
          <b>{j.name}</b>
          <small>{j.umur}</small>
          <small className="jbtn-tagline">{j.tagline}</small>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ BELAJAR ------------------------------ */

export function Belajar({
  jenjang,
  setJenjang,
  onLihat3D,
}: {
  jenjang: Jenjang;
  setJenjang: (j: Jenjang) => void;
  onLihat3D?: (j: Jenjang, i: number) => void;
}) {
  const [i, setI] = useState(0);
  const tur = useMemo(() => turUntuk(jenjang), [jenjang]);

  const l = tur.langkah[i];
  const organ = organLangkah(l);
  const terakhir = i === tur.langkah.length - 1;

  function pindah(n: number) {
    setI(Math.max(0, Math.min(tur.langkah.length - 1, n)));
    window.scrollTo({ top: 0 });
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
        <div className="progres" role="progressbar" aria-valuemin={1} aria-valuemax={tur.langkah.length} aria-valuenow={i + 1} aria-label={`Langkah ${i + 1} dari ${tur.langkah.length}`}>
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
            {onLihat3D && (
              <button
                type="button"
                className="tombol lihat-3d"
                onClick={() => onLihat3D(jenjang, i)}
              >
                Lihat {organ.id} di model 3D
              </button>
            )}
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

/* Tiga hal yang diperbaiki di sini, semuanya hanya terasa oleh pengguna
   keyboard dan pembaca layar:

   1. Pertanyaan dan pilihan jawaban kini terhubung. Sebelumnya empat tombol
      jawaban berdiri sendiri tanpa nama kelompok, jadi pembaca layar tidak
      pernah tahu tombol-tombol itu milik pertanyaan mana. Sekarang pilihan
      dibungkus role="group" dengan aria-labelledby ke judul pertanyaan.

   2. Status benar/salah tidak lagi hanya dibawa warna dan border. Tiap tombol
      jawaban mendapat teks tersembunyi ("jawaban benar", "pilihanmu, belum
      tepat", "bukan pilihanmu"), sehingga informasinya tetap utuh tanpa
      melihat warna. Ini syarat WCAG 1.4.1.

   3. Fokus dipindahkan ke judul soal saat soal berganti. Sebelumnya menekan
      "Soal berikutnya" membuang fokus ke <body> karena tombolnya hilang dari
      DOM, dan pengguna keyboard harus menekan Tab dari awal halaman setiap
      soal. */

export function Kuis({
  jenjang,
  setJenjang,
}: {
  jenjang: Jenjang;
  setJenjang: (j: Jenjang) => void;
}) {
  const [mulai, setMulai] = useState(false);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [n, setN] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [benar, setBenar] = useState(0);
  const [selesai, setSelesai] = useState(false);

  // Fokus hanya dipindahkan setelah pengguna benar-benar berpindah soal, bukan
  // saat kuis pertama kali dirender — memindahkan fokus pada render awal akan
  // melompati navigasi halaman dan membingungkan pengguna pembaca layar.
  const judulSoal = useRef<HTMLHeadingElement>(null);
  const judulHasil = useRef<HTMLHeadingElement>(null);
  const sudahJalan = useRef(false);

  useEffect(() => {
    if (!sudahJalan.current) return;
    judulSoal.current?.focus();
  }, [n]);

  useEffect(() => {
    if (selesai) judulHasil.current?.focus();
  }, [selesai]);

  function mulaiKuis() {
    // Dua lapis pengacakan: urutan soal, lalu urutan pilihan tiap soal.
    // Tanpa lapis kedua, posisi jawaban benar tetap terbaca sebagai pola
    // (lihat catatan di app/kuis.ts fungsi acakPilihan).
    setSoal(acak(bankSoal(jenjang)).map((s) => acakPilihan(s)));
    setN(0);
    setBenar(0);
    setPilih(null);
    setSelesai(false);
    setMulai(true);
    sudahJalan.current = false;
  }

  function jawab(idx: number) {
    if (pilih !== null) return;
    setPilih(idx);
    if (idx === soal[n].jawaban) setBenar((b) => b + 1);
  }

  function lanjut() {
    if (n + 1 >= soal.length) setSelesai(true);
    else {
      sudahJalan.current = true;
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
          <h2 ref={judulHasil} tabIndex={-1}>{p.label}</h2>
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
  const sudahDijawab = pilih !== null;

  return (
    <section className="akademi">
      <div className="kuis-head">
        <span className="lencana">Soal {n + 1} dari {soal.length}</span>
        <span className="chip">{s.organ}</span>
      </div>

      <article className="kartu-besar" key={s.id}>
        <h3 id="soal-pertanyaan" ref={judulSoal} tabIndex={-1}>{s.pertanyaan}</h3>
        <div className="pilihan" role="group" aria-labelledby="soal-pertanyaan">
          {s.pilihan.map((p, idx) => {
            let kelas = 'pilih';
            if (sudahDijawab) {
              if (idx === s.jawaban) kelas += ' benar';
              else if (idx === pilih) kelas += ' salah';
            }
            return (
              <button key={p} type="button" className={kelas} onClick={() => jawab(idx)} disabled={sudahDijawab}>
                <span className="huruf">{String.fromCharCode(65 + idx)}</span>
                {p}
                {/* Status dibacakan sebagai bagian dari nama tombol, bukan hanya
                    diumumkan lewat live region: pengguna bisa menelusuri ulang
                    pilihan kapan saja dan tetap tahu mana yang benar. */}
                {sudahDijawab && idx === s.jawaban && (
                  <span className="sr-only"> — jawaban benar</span>
                )}
                {sudahDijawab && idx === pilih && idx !== s.jawaban && (
                  <span className="sr-only"> — pilihanmu, belum tepat</span>
                )}
              </button>
            );
          })}
        </div>

        {sudahDijawab && (
          <div className="umpan">
            {/* Satu-satunya role="status" di layar kuis. Tombol "Soal
                berikutnya" sengaja diletakkan DI LUAR live region: elemen
                interaktif di dalam live region membuat pembaca layar
                mengumumkan tombol itu setiap kali isi berubah. */}
            <p role="status" aria-live="polite">
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

/* Sebelumnya `dihafal` hanya useState<Set<string>>, jadi setiap centang hilang
   begitu pengguna menekan refresh atau berpindah tab — padahal seluruh gunanya
   pengulangan berjeda adalah bertahan lintas hari. Sekarang progres dibaca dari
   localStorage lewat app/progres.ts, dan setiap perubahan ditulis kembali.

   Membaca localStorage saat inisialisasi state aman di sini karena
   web/main.tsx memakai createRoot().render(), bukan hydrateRoot(): tidak ada
   HTML server yang bisa berbeda dari hasil render pertama. */

export function Flashcard() {
  const [jenjang, setJenjang] = useState<Jenjang | 'semua'>('semua');
  const [mode, setMode] = useState<ModeKartu>('nama');
  const [i, setI] = useState(0);
  const [balik, setBalik] = useState(false);
  const [progres, setProgres] = useState<Progres>(() => bacaProgres());

  const kartu = useMemo(
    () => deck(jenjang === 'semua' ? undefined : jenjang, mode),
    [jenjang, mode]
  );

  const total = kartu.length;
  const k = kartu[i % total];

  const kunciTerlihat = useMemo(
    () => kartu.map((c) => kunciKartu(mode, c.organ)),
    [kartu, mode]
  );
  const hafalTerlihat = jumlahHafal(progres, kunciTerlihat);
  const perluDiulang = jatuhTempo(progres).filter((x) => kunciTerlihat.includes(x)).length;

  // simpanProgres menelan galat penyimpanan (kuota penuh, mode privat), jadi
  // progres tetap berjalan di memori walau penulisan gagal.
  useEffect(() => {
    simpanProgres(progres);
  }, [progres]);

  function geser(arah: 1 | -1) {
    setBalik(false);
    setI((x) => (x + arah + total) % total);
  }

  function tandai(hafal: boolean) {
    // tandaiKartu memakai nextReview() di app/kuis.ts: hafal menjeda 3 sampai
    // 21 hari tergantung streak, belum hafal mengulang besok.
    setProgres((p) => tandaiKartu(p, kunciKartu(mode, k.organ), hafal));
    geser(1);
  }

  if (!k) return <section className="akademi"><h2>Flashcard</h2><p role="status">Belum ada kartu untuk filter ini.</p></section>;

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
        <span className="chip">{i % total + 1} / {total}</span>
        <button type="button" className="tombol" onClick={() => geser(1)} aria-label="Kartu berikutnya">Berikutnya</button>
      </div>

      <div className="navigasi">
        <button type="button" className="tombol" onClick={() => tandai(false)}>Belum hafal</button>
        <button type="button" className="tombol utama" onClick={() => tandai(true)}>Sudah hafal</button>
      </div>

      <p className="catatan-kecil">
        {`${hafalTerlihat} dari ${total} kartu unik ditandai hafal pada filter ini. `}
        {perluDiulang > 0
          ? `${perluDiulang} kartu sudah waktunya diulang hari ini. `
          : 'Ulangi besok untuk mengunci ingatan. '}
        Progres tersimpan di peramban ini, jadi tidak hilang saat halaman dimuat ulang.
      </p>
    </section>
  );
}

/* ------------------------------- WADAH ------------------------------- */

export function Akademi({
  awal,
  awalJenjang = 'sd',
  onJenjang,
  onLihat3D,
}: {
  awal: Mode;
  awalJenjang?: Jenjang;
  onJenjang?: (j: Jenjang) => void;
  onLihat3D?: (j: Jenjang, i: number) => void;
}) {
  const [mode, setMode] = useState<Mode>(awal);
  const [jenjang, setJenjang] = useState<Jenjang>(awalJenjang);

  function ganti(j: Jenjang) {
    setJenjang(j);
    onJenjang?.(j);
  }

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

      {mode === 'belajar' && <Belajar jenjang={jenjang} setJenjang={ganti} onLihat3D={onLihat3D} />}
      {mode === 'kuis' && <Kuis jenjang={jenjang} setJenjang={ganti} />}
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

/** Ringkasan jumlah organ per jenjang */
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
