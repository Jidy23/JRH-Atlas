/** JRH Atlas — Mode Belajar (guided tour) */
import { ORGAN, type Jenjang } from './kurikulum';

export type Langkah = {
  /** 'pengantar' = layar teks, 'organ' = arahkan ke organ */
  jenis: 'pengantar' | 'organ';
  judul: string;
  isi: string;
  organ?: string;
  /** preset kamera/tampilan: skeleton | organs | semua */
  tampilan?: 'skeleton' | 'organ' | 'semua';
  /** sistem yang disorot (kosong = semua) */
  sorot?: string[];
  /** pertanyaan pemantik sebelum lanjut */
  refleksi?: string;
};

export type Tur = {
  id: string;
  judul: string;
  jenjang: Jenjang;
  durasi: string;
  tujuan: string;
  langkah: Langkah[];
};

export const TUR: Tur[] = [
  {
    id: 'tubuh-sd',
    judul: 'Menjelajah Tubuh Manusia',
    jenjang: 'sd',
    durasi: '5 menit',
    tujuan: 'Murid SD mengenali organ utama dan fungsinya dengan bahasa sederhana.',
    langkah: [
      {
        jenis: 'pengantar',
        judul: 'Halo, penjelajah!',
        isi: 'Tubuh manusia tersusun dari banyak bagian yang bekerja sama. Kita akan melihat tiga organ paling penting: otak, jantung, dan paru-paru.',
        refleksi: 'Menurutmu, organ apa yang mengatur seluruh tubuh?',
      },
      {
        jenis: 'organ',
        judul: 'Otak — pusat kendali',
        isi: 'Otak adalah pusat kendali. Ia menerima kabar dari mata dan telinga, lalu memberi perintah supaya kamu bisa berjalan, berbicara, dan mengingat.',
        organ: 'brain',
        tampilan: 'organ',
        sorot: ['nervous'],
        refleksi: 'Coba pegang kepala kamu. Di dalamnya ada otak yang bekerja sejak kamu bangun.',
      },
      {
        jenis: 'organ',
        judul: 'Jantung — pompa darah',
        isi: 'Jantung berbunyi tuk-tuk karena ia memompa darah. Darah membawa makanan dan oksigen ke semua bagian tubuh.',
        organ: 'heart',
        tampilan: 'organ',
        sorot: ['cardiac'],
        refleksi: 'Letakkan tangan di dada. Rasakan denyutnya. Itu jantung sedang bekerja.',
      },
      {
        jenis: 'organ',
        judul: 'Paru-paru — balon udara',
        isi: 'Paru-paru seperti dua balon lembut. Saat menarik napas, udaranya masuk. Saat menghembuskan napas, udara kotor keluar.',
        organ: 'lungs',
        tampilan: 'organ',
        sorot: ['respiratory'],
        refleksi: 'Tarik napas panjang, lalu hembuskan. Itu kerja paru-paru!',
      },
      {
        jenis: 'pengantar',
        judul: 'Kerja bagus!',
        isi: 'Kamu sudah mengenal otak, jantung, dan paru-paru. Sekarang coba Kuis untuk menguji ingatanmu.',
      },
    ],
  },
  {
    id: 'sistem-smp',
    judul: 'Sistem Organ & Pertukaran Gas',
    jenjang: 'smp',
    durasi: '7 menit',
    tujuan: 'Murid SMP menjelaskan alur pernapasan dan peredaran darah.',
    langkah: [
      {
        jenis: 'pengantar',
        judul: 'Sistem = kumpulan organ sejenis',
        isi: 'Organ tidak bekerja sendiri. Jantung dan pembuluh darah membentuk sistem peredaran darah; paru-paru membentuk sistem pernapasan.',
        refleksi: 'Apa bedanya organ dan sistem organ?',
      },
      {
        jenis: 'organ',
        judul: 'Alur napas',
        isi: 'Hidung → laring → trakea → bronkus → bronkiolus → alveolus. Di alveolus, O₂ masuk ke darah dan CO₂ keluar.',
        organ: 'lungs',
        tampilan: 'organ',
        sorot: ['respiratory'],
        refleksi: 'Mengapa alveolus dibuat sangat tipis?',
      },
      {
        jenis: 'organ',
        judul: 'Alur darah',
        isi: 'Jantung → aorta → seluruh tubuh → vena cava → jantung → paru-paru → jantung. Ini disebut sirkulasi ganda.',
        organ: 'heart',
        tampilan: 'organ',
        sorot: ['cardiac', 'arterial', 'venous'],
        refleksi: 'Mengapa ventrikel kiri lebih tebal dari ventrikel kanan?',
      },
      {
        jenis: 'organ',
        judul: 'Pencernaan awal',
        isi: 'Makanan dicerna di lambung secara mekanis (diaduk) dan kimiawi (asam + pepsin). Setelah itu nutrisi diserap di usus halus.',
        organ: 'stomach',
        tampilan: 'organ',
        sorot: ['digestive'],
        refleksi: 'Apa fungsi asam lambung?',
      },
      {
        jenis: 'pengantar',
        judul: 'Siap kuis!',
        isi: 'Kamu sudah tahu dua sistem terbesar. Uji dengan Kuis tingkat SMP.',
      },
    ],
  },
  {
    id: 'sma-kesehatan',
    judul: 'Homeostasis & Kesehatan',
    jenjang: 'sma',
    durasi: '8 menit',
    tujuan: 'Murid SMA menghubungkan struktur organ dengan homeostasis dan kesehatan.',
    langkah: [
      {
        jenis: 'pengantar',
        judul: 'Homeostasis',
        isi: 'Tubuh menjaga kondisi stabil: suhu 36–37 °C, pH darah 7,35–7,45, gula darah terkendali. Banyak organ berperan menjaga ini.',
        refleksi: 'Apa yang terjadi jika pH darah turun di bawah 7,35?',
      },
      {
        jenis: 'organ',
        judul: 'Ginjal — penjaga cairan',
        isi: 'Nefron menyaring darah, menyerap ulang glukosa dan air, dan membuang urea. Ini menjaga volume dan komposisi darah.',
        organ: 'kidneys',
        tampilan: 'organ',
        sorot: ['urinary'],
        refleksi: 'Mengapa minum air cukup penting untuk ginjal?',
      },
      {
        jenis: 'organ',
        judul: 'Hati — pabrik & penyaring',
        isi: 'Hati mengolah nutrisi, menyimpan glikogen, memproduksi protein plasma, dan mendetoksifikasi zat asing.',
        organ: 'liver',
        tampilan: 'organ',
        sorot: ['digestive'],
        refleksi: 'Apa hubungan hati dan gula darah?',
      },
      {
        jenis: 'organ',
        judul: 'Jantung & kebugaran',
        isi: 'Olahraga aerobik menurunkan denyut istirahat, memperkuat otot jantung, dan meningkatkan volume sekuncup.',
        organ: 'heart',
        tampilan: 'organ',
        sorot: ['cardiac'],
        refleksi: 'Apa yang terjadi pada denyut jantung saat berolahraga?',
      },
      {
        jenis: 'pengantar',
        judul: 'Selesai',
        isi: 'Sekarang uji dengan Kuis tingkat SMA, lalu gunakan Flashcard untuk mengingat jangka panjang.',
      },
    ],
  },
];

export function turUntuk(j: Jenjang) {
  return TUR.find((t) => t.jenjang === j) ?? TUR[0];
}

export function organLangkah(l: Langkah) {
  if (!l.organ) return undefined;
  return ORGAN.find((o) => o.key === l.organ);
}
