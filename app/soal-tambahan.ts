/** Bank soal JRH Atlas: 21 soal berjenjang, seimbang 7 SD / 7 SMP / 7 SMA.
 *
 * Aturan penulisan yang mengikat berkas ini:
 * 1. Posisi jawaban benar disebar merata. Versi sebelumnya menaruh jawaban di
 *    pilihan A pada 16 dari 21 soal (SD: 7 dari 7), sehingga murid bisa menjawab
 *    benar tanpa membaca soal. Sasaran sekarang 2 / 1 / 2 / 2 per jenjang.
 * 2. Teks yang dibaca murid tidak memakai em dash. Dipakai titik dua, koma, atau
 *    kalimat terpisah.
 */
import type { Jenjang } from './kurikulum';

export type Soal = { key: string; jenjang: Jenjang; sistem: string; organ: string; pertanyaan: string; pilihan: string[]; jawaban: number; alasan: string };

export const SOAL: Soal[] = [
  // ---------------- SD ----------------
  { key:'sd-jantung', jenjang:'sd', sistem:'cardiac', organ:'Jantung',
    pertanyaan:'Organ mana yang tugasnya memompa darah ke seluruh tubuh?',
    pilihan:['Lambung','Paru-paru','Jantung','Ginjal'], jawaban:2,
    alasan:'Jantung berdetak terus tanpa henti untuk mengedarkan darah yang membawa oksigen dan makanan ke seluruh tubuh.' },
  { key:'sd-paru', jenjang:'sd', sistem:'respiratory', organ:'Paru-paru',
    pertanyaan:'Saat kita bernapas, organ apa yang mengembang dan mengempis?',
    pilihan:['Paru-paru','Jantung','Hati','Otak'], jawaban:0,
    alasan:'Paru-paru mengembang saat menghirup udara berisi oksigen dan mengempis saat mengembuskan karbon dioksida.' },
  { key:'sd-otak', jenjang:'sd', sistem:'nervous', organ:'Otak',
    pertanyaan:'Organ apa yang menjadi pusat pengatur seluruh tubuh kita?',
    pilihan:['Jantung','Lambung','Kulit','Otak'], jawaban:3,
    alasan:'Otak mengatur pikiran, gerakan, ingatan, dan semua kerja organ lain melalui sinyal saraf.' },
  { key:'sd-tulang', jenjang:'sd', sistem:'skeletal', organ:'Tulang',
    pertanyaan:'Apa fungsi utama tulang pada tubuh manusia?',
    pilihan:['Mencerna makanan','Menopang tubuh dan melindungi organ','Mengalirkan darah','Menghasilkan suara'], jawaban:1,
    alasan:'Tulang membentuk rangka yang menopang tubuh, melindungi organ seperti otak dan jantung, serta menjadi tempat melekatnya otot.' },
  { key:'sd-lambung', jenjang:'sd', sistem:'digestive', organ:'Lambung',
    pertanyaan:'Organ apa yang menghancurkan dan mengaduk makanan setelah ditelan?',
    pilihan:['Ginjal','Paru-paru','Lambung','Jantung'], jawaban:2,
    alasan:'Lambung mengaduk makanan dengan gerakan otot dan cairan asam agar mudah dicerna lebih lanjut di usus.' },
  { key:'sd-kulit', jenjang:'sd', sistem:'integumentary', organ:'Kulit',
    pertanyaan:'Organ terluar yang melindungi tubuh dari kuman dan panas adalah…',
    pilihan:['Tulang','Ginjal','Hati','Kulit'], jawaban:3,
    alasan:'Kulit adalah pelindung pertama tubuh. Kulit juga tempat kita merasakan sentuhan, panas, dan dingin.' },
  { key:'sd-darah', jenjang:'sd', sistem:'arterial', organ:'Darah',
    pertanyaan:'Bagian tubuh mana yang bertugas mengedarkan oksigen ke seluruh tubuh?',
    pilihan:['Darah','Tulang','Kulit','Rambut'], jawaban:0,
    alasan:'Darah membawa oksigen dari paru-paru dan sari makanan dari usus ke seluruh sel tubuh.' },

  // ---------------- SMP ----------------
  { key:'smp-ventrikel', jenjang:'smp', sistem:'cardiac', organ:'Jantung',
    pertanyaan:'Bilik jantung mana yang memompa darah ke seluruh tubuh?',
    pilihan:['Atrium kanan','Ventrikel kanan','Atrium kiri','Ventrikel kiri'], jawaban:3,
    alasan:'Ventrikel kiri berdinding paling tebal karena mendorong darah ke aorta lalu ke seluruh tubuh.' },
  { key:'smp-alveolus', jenjang:'smp', sistem:'respiratory', organ:'Paru-paru',
    pertanyaan:'Di bagian mana pertukaran oksigen dan karbon dioksida terjadi?',
    pilihan:['Bronkus','Trakea','Alveolus','Laring'], jawaban:2,
    alasan:'Alveolus berdinding sangat tipis dan dikelilingi kapiler, sehingga gas mudah berdifusi.' },
  { key:'smp-usus', jenjang:'smp', sistem:'digestive', organ:'Usus halus',
    pertanyaan:'Bagian sistem pencernaan tempat penyerapan sari makanan terbanyak adalah…',
    pilihan:['Lambung','Usus halus','Usus besar','Kerongkongan'], jawaban:1,
    alasan:'Dinding usus halus penuh vili dan mikrovili yang memperluas permukaan penyerapan.' },
  { key:'smp-pepsin', jenjang:'smp', sistem:'digestive', organ:'Lambung',
    pertanyaan:'Enzim utama di lambung yang memecah protein adalah…',
    pilihan:['Pepsin','Amilase','Lipase','Tripsin'], jawaban:0,
    alasan:'Pepsin bekerja optimal pada suasana asam lambung (pH 1,5 sampai 3) untuk memecah protein menjadi peptida.' },
  { key:'smp-tulang-rawan', jenjang:'smp', sistem:'skeletal', organ:'Sendi',
    pertanyaan:'Bagian yang mencegah tulang saling bergesekan di persendian adalah…',
    pilihan:['Tendon','Ligamen','Tulang rawan','Sumsum tulang'], jawaban:2,
    alasan:'Tulang rawan melapisi ujung tulang di sendi sehingga gerakan menjadi halus dan tidak nyeri.' },
  { key:'smp-otot', jenjang:'smp', sistem:'muscular', organ:'Otot',
    pertanyaan:'Otot yang bekerja tanpa kita sadari, misalnya di lambung, disebut…',
    pilihan:['Otot polos (involunter)','Otot rangka','Otot lurik','Otot jantung'], jawaban:0,
    alasan:'Otot polos bekerja di luar kesadaran menggerakkan organ dalam seperti lambung dan usus.' },
  { key:'smp-saraf', jenjang:'smp', sistem:'nervous', organ:'Saraf',
    pertanyaan:'Sel saraf yang membawa pesan dari otak ke otot disebut…',
    pilihan:['Neuron sensorik','Sel darah merah','Trombosit','Neuron motorik'], jawaban:3,
    alasan:'Neuron motorik meneruskan perintah dari sistem saraf pusat ke otot agar tubuh bergerak.' },

  // ---------------- SMA ----------------
  { key:'sma-nefron', jenjang:'sma', sistem:'urinary', organ:'Ginjal',
    pertanyaan:'Unit penyaring terkecil di ginjal disebut…',
    pilihan:['Alveolus','Neuron','Nefron','Vili'], jawaban:2,
    alasan:'Nefron terdiri atas glomerulus dan tubulus. Satu ginjal memiliki sekitar satu juta nefron.' },
  { key:'sma-empedu', jenjang:'sma', sistem:'digestive', organ:'Hati',
    pertanyaan:'Cairan yang dihasilkan hati untuk mencerna lemak adalah…',
    pilihan:['Empedu','Insulin','Asam lambung','Lendir'], jawaban:0,
    alasan:'Empedu dihasilkan hati, disimpan di kandung empedu, lalu dilepas ke usus halus untuk mengemulsikan lemak.' },
  { key:'sma-insulin', jenjang:'sma', sistem:'endocrine', organ:'Pankreas',
    pertanyaan:'Hormon yang menurunkan kadar gula darah diproduksi oleh…',
    pilihan:['Glukagon dari hati','Adrenalin dari ginjal','Tiroksin dari tiroid','Insulin dari pankreas'], jawaban:3,
    alasan:'Sel beta pankreas menghasilkan insulin yang membantu glukosa masuk ke sel sehingga kadar gula darah turun.' },
  { key:'sma-tiroid', jenjang:'sma', sistem:'endocrine', organ:'Tiroid',
    pertanyaan:'Kelenjar yang menghasilkan tiroksin dan mengatur kecepatan metabolisme adalah…',
    pilihan:['Kelenjar adrenal','Kelenjar tiroid','Kelenjar hipofisis','Pankreas'], jawaban:1,
    alasan:'Tiroksin dari kelenjar tiroid mengatur laju metabolisme tubuh. Kekurangannya menyebabkan hipotiroidisme.' },
  { key:'sma-homeostasis', jenjang:'sma', sistem:'urinary', organ:'Ginjal',
    pertanyaan:'Proses menjaga kestabilan lingkungan dalam tubuh disebut…',
    pilihan:['Difusi','Osmosis','Fagositosis','Homeostasis'], jawaban:3,
    alasan:'Homeostasis adalah upaya tubuh mempertahankan suhu, pH, kadar air, dan gula darah tetap stabil.' },
  { key:'sma-ginjal-volume', jenjang:'sma', sistem:'urinary', organ:'Ginjal',
    pertanyaan:'Kira-kira berapa liter darah yang disaring ginjal setiap hari?',
    pilihan:['180 liter','18 liter','1.800 liter','18.000 liter'], jawaban:0,
    alasan:'Ginjal menyaring sekitar 180 liter darah per hari, tetapi hanya sekitar 1,5 liter yang keluar sebagai urine.' },
  { key:'sma-arteri', jenjang:'sma', sistem:'arterial', organ:'Arteri',
    pertanyaan:'Perbedaan utama arteri dan vena adalah…',
    pilihan:['Arteri selalu membawa darah beroksigen, vena tidak pernah','Arteri tidak punya dinding otot, vena punya','Arteri membawa darah menjauh dari jantung, vena kembali ke jantung','Arteri hanya ada di otak, vena di kaki'], jawaban:2,
    alasan:'Arah aliran yang membedakan keduanya. Arteri pulmonalis justru membawa darah miskin oksigen menuju paru-paru.' },
];

export function soalUntuk(jenjang?: Jenjang): Soal[] {
  return jenjang ? SOAL.filter((s) => s.jenjang === jenjang) : SOAL;
}
