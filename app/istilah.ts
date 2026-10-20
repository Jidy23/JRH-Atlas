/**
 * JRH Atlas — lapisan istilah Indonesia untuk 2.234 mesh BodyParts3D.
 * Atlas memakai nama Inggris baku; modul ini memetakan istilah umum
 * ke padanan Indonesia + membantu pencarian dua bahasa.
 */

/** Kamus istilah anatomi Inggris -> Indonesia (kata utuh, case-insensitive). */
export const ISTILAH: Record<string, string> = {
  heart: 'jantung',
  lung: 'paru-paru',
  brain: 'otak',
  liver: 'hati',
  stomach: 'lambung',
  kidney: 'ginjal',
  spleen: 'limpa',
  pancreas: 'pankreas',
  bladder: 'kandung kemih',
  trachea: 'trakea (tenggorokan)',
  larynx: 'laring (kotak suara)',
  pharynx: 'faring',
  esophagus: 'kerongkongan',
  oesophagus: 'kerongkongan',
  diaphragm: 'diafragma',
  intestine: 'usus',
  'small intestine': 'usus halus',
  'large intestine': 'usus besar',
  colon: 'usus besar',
  rectum: 'rektum',
  bone: 'tulang',
  cartilage: 'tulang rawan',
  muscle: 'otot',
  tendon: 'tendon (urat otot)',
  ligament: 'ligamen',
  artery: 'arteri (pembuluh nadi)',
  vein: 'vena (pembuluh balik)',
  nerve: 'saraf',
  skin: 'kulit',
  gland: 'kelenjar',
  lymph: 'limfa',
  thyroid: 'kelenjar tiroid',
  adrenal: 'anak ginjal',
  pituitary: 'hipofisis',
  spine: 'tulang belakang',
  vertebra: 'tulang belakang',
  rib: 'tulang rusuk',
  skull: 'tengkorak',
  cranium: 'tengkorak',
  jaw: 'rahang',
  clavicle: 'tulang selangka',
  scapula: 'tulang belikat',
  sternum: 'tulang dada',
  humerus: 'tulang lengan atas',
  radius: 'tulang pengumpil',
  ulna: 'tulang hasta',
  femur: 'tulang paha',
  tibia: 'tulang kering',
  fibula: 'tulang betis',
  pelvis: 'tulang panggul',
  patella: 'tulang tempurung lutut',
  eye: 'mata',
  ear: 'telinga',
  nose: 'hidung',
  tongue: 'lidah',
  tooth: 'gigi',
  left: 'kiri',
  right: 'kanan',
  upper: 'atas',
  lower: 'bawah',
  anterior: 'depan',
  posterior: 'belakang',
  superior: 'atas',
  inferior: 'bawah',
  medial: 'tengah',
  lateral: 'sisi luar',
  deep: 'dalam',
  superficial: 'permukaan',
};

/* Kunci diurutkan dan regex-nya disusun SEKALI di tingkat modul.
   Sebelumnya `keIndonesia` mengurutkan ulang kamus pada setiap panggilan,
   sedangkan pencarian memanggilnya untuk 3.432 konsep pada setiap ketikan.
   Jadi pengurutan O(n log n) dan kompilasi ~70 RegExp itu terulang ribuan kali
   per huruf — pekerjaan yang hasilnya selalu sama. */
const KUNCI_URUT = Object.keys(ISTILAH).sort((a, b) => b.length - a.length);

const lolosRegex = (teks: string) => teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const POLA_GANTI = KUNCI_URUT.map((k) => [new RegExp(`\\b${lolosRegex(k)}\\b`, 'gi'), ISTILAH[k]] as const);
const POLA_KANDUNG = KUNCI_URUT.map((k) => [new RegExp(`\\b${lolosRegex(k)}\\b`, 'i'), ISTILAH[k]] as const);

/* Hasil terjemahan di-cache: atlas hanya punya beberapa ribu nama unik dan
   setiap nama dipanggil berkali-kali (judul panel, chip, pencarian, sorotan). */
const CACHE_MAKS = 4096;
const CACHE = new Map<string, string>();

/** Terjemahkan istilah dengan mengganti kata utuh, mempertahankan selebihnya. */
export function keIndonesia(nama: string): string {
  const kunci = nama.toLowerCase();
  const tersimpan = CACHE.get(kunci);
  if (tersimpan !== undefined) return tersimpan;

  let hasil = kunci;
  // Frasa lebih panjang didahulukan supaya 'small intestine' tidak dipecah dulu.
  for (const [re, ganti] of POLA_GANTI) hasil = hasil.replace(re, ganti);

  const akhir = hasil
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');

  if (CACHE.size >= CACHE_MAKS) CACHE.clear();
  CACHE.set(kunci, akhir);
  return akhir;
}

/** Kembalikan daftar istilah Indonesia unik yang terkandung dalam nama. */
export function istilahDalam(nama: string): string[] {
  const n = nama.toLowerCase();
  const out = new Set<string>();
  for (const [re, ganti] of POLA_KANDUNG) if (re.test(n)) out.add(ganti);
  return [...out];
}

/**
 * Cari mesh dengan dua bahasa: "jantung" menemukan "Heart",
 * "tulang paha" menemukan "Femur", dst.
 */
export function cocok(nama: string, kueri: string): boolean {
  const q = kueri.trim().toLowerCase();
  if (!q) return true;
  if (nama.toLowerCase().includes(q)) return true;
  const id = keIndonesia(nama).toLowerCase();
  if (id.includes(q)) return true;
  return istilahDalam(nama).some((t) => t.includes(q));
}
