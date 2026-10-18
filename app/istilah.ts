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

/** Terjemahkan istilah dengan mengganti kata utuh, mempertahankan selebihnya. */
export function keIndonesia(nama: string): string {
  let hasil = nama.toLowerCase();
  // frasa lebih panjang didahulukan
  const urut = Object.keys(ISTILAH).sort((a, b) => b.length - a.length);
  for (const k of urut) {
    const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    hasil = hasil.replace(re, ISTILAH[k]);
  }
  return hasil
    .split(/\s+/)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Kembalikan daftar istilah Indonesia unik yang terkandung dalam nama. */
export function istilahDalam(nama: string): string[] {
  const n = nama.toLowerCase();
  const out = new Set<string>();
  for (const k of Object.keys(ISTILAH)) {
    if (new RegExp(`\\b${k}\\b`, 'i').test(n)) out.add(ISTILAH[k]);
  }
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
