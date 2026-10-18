/**
 * JRH Atlas — Kurikulum Indonesia
 * key         : nama yang dipakai atlas.json (Inggris)
 * id          : istilah Indonesia (baku)
 * jenjang     : kapan organ ini dibahas di sekolah
 */

export type Jenjang = 'sd' | 'smp' | 'sma';

export const JENJANG = [
  { id: 'sd', name: 'SD', umur: '6–12 tahun', warna: '#e07f35', tagline: 'Kenali organ tubuh dan fungsinya' },
  { id: 'smp', name: 'SMP', umur: '12–15 tahun', warna: '#0ea5e9', tagline: 'Sistem organ, pernapasan, pencernaan' },
  { id: 'sma', name: 'SMA', umur: '15–18 tahun', warna: '#7c3aed', tagline: 'Struktur, homeostasis, kesehatan' },
] as const;

export type OrganInfo = {
  key: string;
  id: string;
  sistem: string;
  jenjang: Jenjang;
  inti: string;
  fungsi: string;
  fakta: string[];
  mitos?: string;
  quiz: { pertanyaan: string; pilihan: string[]; jawaban: number; alasan: string };
};

export const ORGAN: OrganInfo[] = [
  {
    key: 'heart',
    id: 'Jantung',
    sistem: 'cardiac',
    jenjang: 'smp',
    inti: 'Pompa darah berotot yang mengalirkan darah ke seluruh tubuh.',
    fungsi:
      'Jantung punya 4 bilik: 2 atrium (atas) dan 2 ventrikel (bawah). Darah dari seluruh tubuh masuk ke atrium kanan, lalu dipompa ventrikel kanan ke paru-paru. Darah beroksigen kembali ke atrium kiri, lalu ventrikel kiri memompanya ke seluruh tubuh lewat aorta.',
    fakta: [
      'Denyut 60–100 kali per menit saat istirahat, bisa 150+ saat olahraga',
      'Memompa sekitar 5 liter darah per menit pada orang dewasa',
      'Otot jantung tidak butuh pasokan darah baru dari pembuluh koroner',
      'Ventrikel kiri punya dinding paling tebal karena tugasnya paling berat',
    ],
    mitos:
      'Bukan "perasaan" — rasa sayang diatur otak, bukan jantung.',
    quiz: {
      pertanyaan: 'Bilik jantung mana yang memompa darah ke seluruh tubuh?',
      pilihan: ['Atrium kanan', 'Ventrikel kanan', 'Atrium kiri', 'Ventrikel kiri'],
      jawaban: 3,
      alasan: 'Ventrikel kiri mendorong darah ke aorta, lalu ke seluruh tubuh.',
    },
  },
  {
    key: 'lungs',
    id: 'Paru-paru',
    sistem: 'respiratory',
    jenjang: 'smp',
    inti: 'Organ pernapasan utama: oksigen masuk, karbon dioksida keluar.',
    fungsi:
      'Udara masuk lewat hidung, melewati trakea, lalu bercabang ke bronkus di paru-paru dan berakhir di alveolus. Di sana oksigen berdifusi ke darah dan karbon dioksida dikeluarkan.',
    fakta: [
      'Luas permukaan alveolus ±70 m², seperti lapangan tenis',
      'Paru kanan 3 lobus, paru kiri 2 lobus',
      'Kapasitas paru sekitar 6 liter udara',
    ],
    quiz: {
      pertanyaan: 'Di bagian mana pertukaran oksigen dan karbon dioksida terjadi?',
      pilihan: ['Bronkus', 'Alveolus', 'Trakea', 'Laring'],
      jawaban: 1,
      alasan: 'Alveolus punya dinding sangat tipis dan dikelilingi kapiler darah.',
    },
  },
  {
    key: 'brain',
    id: 'Otak',
    sistem: 'nervous',
    jenjang: 'sd',
    inti: 'Pusat sistem saraf yang mengatur pikiran, gerak, dan seluruh fungsi tubuh.',
    fungsi:
      'Otak berisi sekitar 86 miliar sel saraf. Berdasarkan informasi dari indera, otak mengatur gerak, suhu tubuh, ingatan, emosi, dan keputusan.',
    fakta: [
      'Berat ±1,4 kg — sekitar 2% berat tubuh tapi memakai 20% energi',
      'Tebal korteks motorik bisa berubah karena latihan fisik',
      'Tidur cukup penting untuk memperkuat ingatan',
    ],
    quiz: {
      pertanyaan: 'Berapa persen energi tubuh yang dipakai otak?',
      pilihan: ['2%', '5%', '20%', '50%'],
      jawaban: 2,
      alasan: 'Otak ±2% berat tubuh, tetapi menyerap sekitar 20% energi dan oksigen.',
    },
  },
  {
    key: 'stomach',
    id: 'Lambung',
    sistem: 'digestive',
    jenjang: 'smp',
    inti: 'Kantong otot yang mencerna makanan secara mekanis dan kimiawi.',
    fungsi:
      'Lambung mengaduk makanan dan mensekresikan asam klorida (pH 1,5–3) serta enzim pepsin yang memecah protein.',
    fakta: [
      'Dinding lambung diperbarui tiap beberapa hari',
      'Asam lambung bisa melarutkan logam tipis, tapi dilindungi lendir',
    ],
    quiz: {
      pertanyaan: 'Enzim utama di lambung yang memecah protein adalah...',
      pilihan: ['Pepsin', 'Amilase', 'Lipase', 'Tripsin'],
      jawaban: 0,
      alasan: 'Pepsin bekerja optimal di suasana asam lambung untuk memecah protein.',
    },
  },
  {
    key: 'liver',
    id: 'Hati',
    sistem: 'digestive',
    jenjang: 'sma',
    inti: 'Kelenjar terbesar tubuh: menetralkan racun dan memproduksi empedu.',
    fungsi:
      'Hati mengolah nutrisi dari usus, menyimpan glikogen, memproduksi protein plasma, dan menghasilkan empedu untuk mencerna lemak.',
    fakta: [
      'Berat ±1,5 kg pada orang dewasa',
      'Hati bisa meregenerasi sebagian jaringan yang rusak',
      'Menerima ±1,4 liter darah per menit',
    ],
    quiz: {
      pertanyaan: 'Cairan yang dihasilkan hati untuk mencerna lemak adalah...',
      pilihan: ['Empedu', 'Insulin', 'Asam lambung', 'Lendir'],
      jawaban: 0,
      alasan: 'Empedu disimpan di kandung empedu lalu dilepas ke usus halus.',
    },
  },
  {
    key: 'kidneys',
    id: 'Ginjal',
    sistem: 'urinary',
    jenjang: 'sma',
    inti: 'Dua organ penyaring darah yang menjaga keseimbangan cairan tubuh.',
    fungsi:
      'Setiap ginjal berisi ±1 juta nefron. Nefron menyaring darah, menyerap kembali zat berguna, dan membuang sisa metabolisme sebagai urine.',
    fakta: [
      'Menyaring ±180 liter darah per hari',
      'Menghasilkan ±1,5 liter urine per hari',
      'Satu ginjal sehat sudah cukup untuk hidup normal',
    ],
    quiz: {
      pertanyaan: 'Unit penyaring terkecil di ginjal disebut...',
      pilihan: ['Alveolus', 'Nefron', 'Neuron', 'Vili'],
      jawaban: 1,
      alasan: 'Nefron terdiri atas glomerulus dan tubulus, bekerja menyaring darah.',
    },
  },
];

export function organByName(nama: string) {
  const n = nama.toLowerCase();
  return ORGAN.find((o) => o.key === n || o.id.toLowerCase() === n);
}

export function olehJenjang(j: Jenjang) {
  return ORGAN.filter((o) => o.jenjang === j);
}
