import { useState } from 'react';
import './dukungan.css';

/*
  Halaman dukungan.
  Nada sengaja dijaga datar. Ini halaman apresiasi, bukan kampanye
  penggalangan dana: tidak ada tier, tidak ada imbalan, tidak ada
  penghitung mundur, dan tidak ada satu pun fitur yang dikunci.
  Tiga baris teks sudah cukup; sisanya biar QRIS yang bicara.
  Gambar QRIS dimuat dari public/qris.png. Kalau berkasnya belum ada,
  onError menampilkan instruksi singkat alih-alih kotak gambar rusak.
*/
export function Dukungan() {
  const [qrisGagal, setQrisGagal] = useState(false);

  return (
    <section className="akademi">
      <h2>Dukung JRH Atlas</h2>
      <p className="leads">
        JRH Atlas gratis: tanpa iklan, akun, atau pelacakan. Tidak ada fitur dikunci.
      </p>
      <p className="leads">
        Biaya nyata: domain + bandwidth (±35 MB per pengunjung 3D). QRIS di bawah,
        nominal bebas.
      </p>
      <p className="leads">
        Yang tidak dijual: logo, akses awal, data. Alat belajar, bukan alat diagnosis.
      </p>

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
              Pindai dengan aplikasi bank atau dompet digital apa pun yang mendukung
              QRIS. Nominal diisi sendiri, tanpa minimum.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
