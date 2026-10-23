import { useState } from 'react';
import './dukungan.css';

/*
  Halaman dukungan.

  Nada sengaja dijaga datar. Ini halaman apresiasi, bukan kampanye
  penggalangan dana: tidak ada tier, tidak ada imbalan, tidak ada
  penghitung mundur, dan tidak ada satu pun fitur yang dikunci.

  Gambar QRIS dimuat dari public/qris.png. Kalau berkasnya belum ada,
  onError menampilkan instruksi singkat alih-alih kotak gambar rusak.
  Jadi halaman ini aman dipakai sebelum gambarnya diunggah.
*/
export function Dukungan() {
  const [qrisGagal, setQrisGagal] = useState(false);

  return (
    <section className="akademi">
      <h2>Dukung JRH Atlas</h2>
      <p className="leads">
        JRH Atlas gratis, tanpa iklan, tanpa akun, dan tanpa pelacakan. Tidak
        ada fitur yang dikunci di balik pembayaran, dan tidak akan ada.
      </p>
      <p className="leads">
        Halaman ini bukan permintaan. Ia hanya menjelaskan biaya yang sebenarnya
        dan membuka jalan bagi yang memang ingin ikut menjaga atlas ini
        berjalan.
      </p>

      <div className="dukungan-grid">
        <article className="dukungan-kartu">
          <h3>Yang tidak berubah</h3>
          <ul className="dukungan-list">
            <li>Seluruh rute tetap terbuka tanpa akun.</li>
            <li>Tidak ada iklan dan tidak ada pelacak pihak ketiga.</li>
            <li>Tidak ada tier, langganan, atau akses istimewa.</li>
            <li>Dukungan tidak memberi pengaruh atas isi kurikulum.</li>
          </ul>
        </article>

        <article className="dukungan-kartu">
          <h3>Biaya yang nyata</h3>
          <p>
            Yang perlu dibayar hanya dua hal: nama domain dan lalu lintas
            bandwidth. Model anatominya berat, satu pengunjung yang membuka
            penjelajah 3D mengunduh sekitar 35 MB aset terkompresi.
          </p>
          <p>
            Jadi biaya terbesar bukan penyimpanan, melainkan orang yang
            benar-benar memakainya.
          </p>
        </article>
      </div>

      <div className="qris">
        {qrisGagal ? (
          <p className="qris-catatan" role="status">
            Gambar QRIS belum tersedia. Taruh berkas <b>qris.png</b> di folder{' '}
            <b>public/</b> pada repositori, lalu muat ulang halaman ini.
          </p>
        ) : (
          <>
            <img
              className="qris-gambar"
              src="/qris.png"
              alt="Kode QRIS untuk mendukung operasional JRH Atlas"
              width={240}
              height={240}
              loading="lazy"
              decoding="async"
              onError={() => setQrisGagal(true)}
            />
            <p className="qris-catatan">
              Pindai dengan aplikasi bank atau dompet digital apa pun yang
              mendukung QRIS. Nominal diisi sendiri, tanpa minimum.
            </p>
          </>
        )}
      </div>

      <h3>Yang tidak dijual</h3>
      <ul className="dukungan-list">
        <li>Tidak ada penempatan logo atau nama pendukung di dalam aplikasi.</li>
        <li>Tidak ada akses awal ke fitur baru.</li>
        <li>Tidak ada data pengguna yang dibagikan, dijual, atau ditukar.</li>
      </ul>

      <h3>Cara lain membantu tanpa uang</h3>
      <ul className="dukungan-list">
        <li>Laporkan istilah yang salah terjemahan lewat halaman Glosarium.</li>
        <li>
          Tunjukkan atlas ini kepada guru biologi yang mungkin membutuhkannya.
        </li>
        <li>Sebutkan versi dan perangkat saat melaporkan masalah tampilan.</li>
      </ul>

      <p className="mitos dukungan-tutup">
        <b>Catatan:</b> JRH Atlas adalah alat belajar, bukan alat diagnosis.
        Untuk keluhan kesehatan, konsultasikan ke tenaga medis.
      </p>
    </section>
  );
}
