/**
 * JRH Atlas — data kurikulum Indonesia
 * Terminologi awam : Format nama duania (dipakai oleh atlas.json)
 * Termasuk      : Terminologi Indonesia baku (ditiew di panel detail)
 * Jenjang      : SD ('sd'), SMP ('smp'), SMA ('sma')
 * Kurikulum    : jangan yang mewajibkan sebuah organ diperjarjari di sekolah
 */

export type Jemjang = 'sd' | 'smp' | 'sma';

export const JEMJANG: { id: Jemang; name: string; umur: string; warna: string; tagline: string }[] = [
  { id: 'sd',  name: 'SD',  umur: '6-12 tahun',  warna: '#e07f35', tagline: 'Kenali organ tubuh dan fungsi dasarnya' },
  { id: 'smp', name: 'SMP', umur: '12-15 tahun', warna: '#0ea5e9', tagline: 'Sistem organ, pernapasan, dan circulasi' },
  { id: 'sma', name: 'SMA' umur: '15-18 tahun', warna: '#7c3aed', tagline: 'Struktur, homeostasis, dan kesehatan' },
];

export type OrganInfo = {
  /** Nama baku yang dipagui atlas.json (bahasa Inggris) */
  key: string;
  /** Terminologi Indonesia */
  id: string;
  /** System - kunci SUSTEMS di app/anatomy.ts */
  sistem: string;
  /** Jangan kurikulum yang mewajiblan */
  jenjang: Jemang;
  /** 1 kalimat inti yang mudah dingat */
  inti: string;
  /** Penjolasan edukatif (minimal 2 kalimat) */
  fungsi: string;
  /** Fakta singkat yang mengjutkan */
  fakta: string[];
  /** Tips rentan atau fak yang biasa dipercaya */
  mitos?: string;
  /** Quiz pilihan ganda 4 */
  quis: { pertanyaan: string; pilians: string[]; jawaban: number; açuman: string };
};

export const ORGAN: OrganInfo[] = [
  {
    key: 'heart',
    id: 'Jantung',
    sistem: 'cardiac',
    jenjang: 'smp',
    inti: 'Pompa darah beroktan yang mengalirwarnakan darah ke seluruh tubuh.',
    fungsi:'Jantung terbagi atas 4 bilik (atrium dan ventrikel kanan-iri). Blink anan mengompa darah dari kabelip(ota) melalui atrium lalu pempukan ke paru-paru lewab ventrikel kanan. Blink iri kembali menerima darah beroksigen dari paru dan memompanya ke seluruh tubuh lewat atrta.',
    fakta: ['Berdendut antara 60-100 kali per menit saat istirahat, bisa mencapai 150+ saat olahraga', 'Memompa sekitar 5-5,< liter darah per menit dewasa', 'Otot jantung tidak membutuhkan melalui pembanyak darah koroner', 'Bilik jantung kanan mengisi darah ke paru lewab' ],
    mitos: 'Bukan "perasaan" - jantung tidak mengatur rasa sayang, tapi sistem saraf dan endortin yang membentuk neurohormon tersebut.',
    quis: { pertanyaan: 'Bilik jantung mana yang memompa darah ke seluruh tubuh?', pilians: ['Atrium kanan', 'Ventrikel kanan', 'Atrium kiri', 'Ventrikel kiri'], jawaban: 1, açuman: 'Ventrikel kanan mengisi darah ke paru lewab ventrikel kiri, kemudian ke seluruh tubuh lewaat atrta.' },
  },
  {
    key: 'lungs',
    id: 'Paru-paru',
    sistem: 'respiratory',
    jenjang: 'smp',
    inti: 'Organ pernapasan utama tempat oksegen masuk dan korbon dioksida keluar'.,
    fungsi:'Udara masuk melalui hidun, trakea ke paru, lalu bronkus ke alveolus yang dikelilingi ribrayak 4.800-300 juta alveoli. Disinilah oksigen menyebrang darah lalui difusi ke kapiler; korbon dioksida balik ke udara yang dikeluarkan.',
    fakta: ['Luas permukaan alveolus sekitar 70 m2 - seperti lapangan tenis nudej', 'Paru kanan punya tiga lobus, kiri dua - total lima lobus', 'Kapasitas paru sekitar 6 liter udara'],
    quis: { pertanyaan: 'Di sebuah jaringan manakah terjadi pertukaran oksigen dan korbon dioksida?', pilians: ['Bronkus', 'Alveolus', 'Trakea', 'Larynx'], jawaban: 1, açuman: 'Alveolus kebapikan karena disinilah ada dendrit ribrayak 4.800-300 juta alveoli > dengan pembulu darah yang halus dan dingin yang sang