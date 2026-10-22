import { useMemo, useState } from 'react';
import { ISTILAH, cocok, keIndonesia } from './istilah';
import { ORGAN } from './kurikulum';
import './akademi.css';

/* ------------------------------ GLOSARIUM ------------------------------ */

/* Padanan istilah adalah data tabular, jadi dirender sebagai <table> asli.

   Sebelumnya seluruh daftar berupa <div class="glos"> berisi <div class="glos-head">
   dan ratusan <div class="glos-row">. Secara visual hasilnya dua kolom, tetapi bagi
   pembaca layar tidak ada tabel sama sekali: tanpa relasi baris-ke-kolom, tanpa nama
   kolom yang dibacakan, dan tanpa navigasi antar-sel. Glosarium adalah halaman yang
   paling bergantung pada struktur itu karena isinya ratusan pasangan istilah.

   <th scope="row"> dipakai untuk istilah Inggris, bukan <td>: tiap baris adalah SATU
   istilah, sehingga pembaca layar membacakan nama istilah itu lebih dulu saat
   pengguna berpindah sel. <caption> memberi tabel nama yang dibacakan saat tabel
   difokuskan, dan sekaligus menjelaskan isinya tanpa teks tambahan di layar. */

export function Glosarium() {
  const [q, setQ] = useState('');

  const baris = useMemo(() => {
    return Object.entries(ISTILAH)
      .map(([en, id]) => ({ en, id }))
      .filter((r) => cocok(r.en, q) || r.id.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.id.localeCompare(b.id, 'id'));
  }, [q]);

  return (
    <section className="akademi">
      <h2>Glosarium Istilah Anatomi</h2>
      <p className="leads">
        Nama ilmiah di atlas memakai bahasa Inggris. Tabel ini memadankan istilah tersebut
        dengan bahasa Indonesia supaya kamu bisa belajar dari buku sekolah tanpa bingung.
      </p>

      <input
        className="cari"
        type="search"
        placeholder="Cari istilah, misal: jantung, femur, otot…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Cari istilah"
      />

      {/* Hasil penyaringan diumumkan sendiri. Tanpa ini, mengetik di kolom cari hanya
          mengubah DOM secara senyap bagi pengguna pembaca layar. */}
      <p className="sr-only" role="status">
        {baris.length === 0
          ? 'Tidak ada istilah yang cocok'
          : `${baris.length} istilah cocok dengan pencarian`}
      </p>

      {baris.length === 0 ? (
        <p className="leads">Istilah tidak ditemukan. Coba kata lain, misal “jantung” atau “femur”.</p>
      ) : (
        <table className="glos">
          <caption className="sr-only">
            Padanan istilah anatomi dari bahasa Inggris ke bahasa Indonesia
          </caption>
          <thead>
            <tr>
              <th scope="col">Istilah Inggris</th>
              <th scope="col">Padanan Indonesia</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((r) => (
              <tr key={r.en}>
                <th scope="row">{r.en}</th>
                <td>{r.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 28 }}>Contoh penerjemahan nama mesh</h3>
      <p className="leads">
        Nama teknis di atlas diterjemahkan dengan mempertahankan kata yang belum punya padanan:
      </p>
      <ul className="fakta">
        <li><b>Left ventricle of heart</b> → {keIndonesia('Left ventricle of heart')}</li>
        <li><b>Head of femur</b> → {keIndonesia('Head of femur')}</li>
        <li><b>Superior lobe of right lung</b> → {keIndonesia('Superior lobe of right lung')}</li>
      </ul>
    </section>
  );
}

/* ------------------------------- PANDUAN ------------------------------- */

const LANGKAH = [
  {
    judul: '1. Mulai dari Mode Belajar',
    isi: 'Kalau baru pertama kali, jangan langsung jelajah. Mode Belajar menuntun kamu 5–8 menit per tur, dibagi per jenjang SD, SMP, SMA.',
  },
  {
    judul: '2. Kenali istilahnya',
    isi: 'Buka Glosarium untuk melihat padanan bahasa Indonesia dari nama ilmiah. Hafal 10 istilah dulu sudah cukup untuk memulai.',
  },
  {
    judul: '3. Jelajah 3D',
    isi: 'Klik bagian tubuh untuk tahu namanya. Gunakan kontrol sistem untuk menyembunyikan lapisan, dan exploded view untuk memisahkan bagian yang bertumpuk.',
  },
  {
    judul: '4. Uji dengan Kuis',
    isi: 'Kuis memberi penjelasan di setiap jawaban, benar maupun salah. Catat bagian yang sering keliru.',
  },
  {
    judul: '5. Kunci dengan Flashcard',
    /* Jeda di sini HARUS cocok dengan nextReview() di app/progres.ts. Dulu
       tertulis urutan 1, 3, 7 hari, padahal kode menjadwalkan 3, 6, 9, 12, 15,
       18, lalu mentok 21 hari. Angka yang salah membuat pengguna menunggu kartu
       yang sebenarnya baru muncul dua minggu kemudian. scripts/audit-teks.mjs
       menolak urutan lama itu muncul lagi dalam bentuk apa pun, termasuk di
       komentar — jadi jangan tulis angka itu lagi di sini. */
    isi: 'Ulangi kartu yang ditandai belum hafal besok hari. Kartu yang sudah hafal diberi jeda makin panjang, dari 3 hari sampai paling lama 21 hari. Pengulangan berjeda seperti ini adalah cara paling efektif mengingat jangka panjang.',
  },
];

export function Panduan() {
  return (
    <section className="akademi">
      <h2>Cara Menggunakan JRH Atlas</h2>
      <p className="leads">
        JRH Atlas dibuat untuk pelajar Indonesia. Gratis, tanpa akun, tanpa iklan, dan bisa
        dipakai di HP maupun komputer.
      </p>

      <div className="panduan">
        {LANGKAH.map((l) => (
          <article className="panduan-item" key={l.judul}>
            <h3>{l.judul}</h3>
            <p>{l.isi}</p>
          </article>
        ))}
      </div>

      <h3 style={{ marginTop: 28 }}>Cakupan kurikulum</h3>
      <ul className="fakta">
        {ORGAN.map((o) => (
          <li key={o.key}>
            <b>{o.id}</b> — jenjang {o.jenjang.toUpperCase()} · {o.inti}
          </li>
        ))}
      </ul>

      <p className="mitos" style={{ marginTop: 22 }}>
        <b>Catatan penting:</b> JRH Atlas adalah alat belajar, bukan alat diagnosis.
        Untuk keluhan kesehatan, konsultasikan ke tenaga medis.
      </p>
    </section>
  );
}
