/** JRH Atlas: Kuis & Flashcard (logika murni, mudah diuji) */
import { ORGAN, type Jenjang, type OrganInfo } from './kurikulum';
import { soalUntuk, type Soal as SoalTambahan } from './soal-tambahan';

export type Soal = {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban: number;
  alasan: string;
  organ: string;
  /** Diisi untuk soal dari bank tambahan; kosong untuk soal turunan kurikulum. */
  jenjang?: Jenjang;
};

/** Soal turunan kurikulum, satu butir per organ. */
function soalKurikulum(jenjang?: Jenjang): Soal[] {
  return ORGAN.filter((o) => !jenjang || o.jenjang === jenjang).map((o) => ({
    id: o.key,
    pertanyaan: o.quiz.pertanyaan,
    pilihan: o.quiz.pilihan,
    jawaban: o.quiz.jawaban,
    alasan: o.quiz.alasan,
    organ: o.id,
    jenjang: o.jenjang,
  }));
}

function dariBank(b: SoalTambahan): Soal {
  return {
    id: b.key,
    pertanyaan: b.pertanyaan,
    pilihan: b.pilihan,
    jawaban: b.jawaban,
    alasan: b.alasan,
    organ: b.organ,
    jenjang: b.jenjang,
  };
}

/**
 * Bank soal gabungan: kurikulum + bank tambahan, tanpa duplikat id.
 * jenjang=undefined berarti semua jenjang.
 */
export function bankSoal(jenjang?: Jenjang): Soal[] {
  const gabung = [...soalKurikulum(jenjang), ...soalUntuk(jenjang).map(dariBank)];
  const terlihat = new Set<string>();
  return gabung.filter((s) => (terlihat.has(s.id) ? false : (terlihat.add(s.id), true)));
}

/** Ambil hanya soal dari bank tambahan, berguna untuk mode latihan baru. */
export function bankTambahan(jenjang?: Jenjang): Soal[] {
  return soalUntuk(jenjang).map(dariBank);
}

/** Fisher-Yates, acak tanpa bias. */
export function acak<T>(arr: T[], seed = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seed() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Acak urutan pilihan jawaban dan ikut memindahkan indeks jawaban benarnya.
 *
 * Sebelumnya hanya urutan soal yang diacak, sedangkan urutan pilihan dirender apa
 * adanya dari data. Akibatnya posisi jawaban benar tetap terbaca sebagai pola: pada
 * bank tambahan, 16 dari 21 soal menjawab A, dan seluruh jenjang SD menjawab A.
 * Murid bisa menang tanpa membaca soal. Fungsi ini menutup celah itu.
 */
export function acakPilihan(s: Soal, seed = Math.random): Soal {
  const urutan = acak(
    s.pilihan.map((_, i) => i),
    seed
  );
  return {
    ...s,
    pilihan: urutan.map((i) => s.pilihan[i]),
    jawaban: urutan.indexOf(s.jawaban),
  };
}

export function nilai(benar: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((benar / total) * 100);
}

export function predikat(n: number) {
  if (n >= 90) return { label: 'Luar biasa!', emoji: '🏆', pesan: 'Kamu sudah paham betul. Coba jenjang di atasnya.' };
  if (n >= 75) return { label: 'Bagus sekali', emoji: '🌟', pesan: 'Sedikit lagi. Ulangi bagian yang salah.' };
  if (n >= 60) return { label: 'Cukup', emoji: '📘', pesan: 'Baca ulang fungsi organ, lalu coba lagi.' };
  return { label: 'Belajar lagi', emoji: '🌱', pesan: 'Tidak apa-apa! Pakai mode Belajar dulu, lalu ulangi.' };
}

/* ---------- Flashcard ---------- */
export type Kartu = { depan: string; belakang: string; sistem: string; organ: string };

export function kartuDari(o: OrganInfo, mode: 'nama' | 'fungsi' | 'fakta'): Kartu {
  if (mode === 'nama') return { depan: o.inti, belakang: o.id, sistem: o.sistem, organ: o.key };
  if (mode === 'fungsi') return { depan: `${o.id}: apa fungsinya?`, belakang: o.fungsi, sistem: o.sistem, organ: o.key };
  return { depan: `Fakta tentang ${o.id}`, belakang: o.fakta.join(' • '), sistem: o.sistem, organ: o.key };
}

export function deck(jenjang?: Jenjang, mode: 'nama' | 'fungsi' | 'fakta' = 'nama'): Kartu[] {
  return ORGAN.filter((o) => !jenjang || o.jenjang === jenjang).map((o) => kartuDari(o, mode));
}

/** Interval pengulangan sederhana: hafal jadi 3 hari, belum hafal ulang besok. */
export function nextReview(hafal: boolean, streak: number) {
  const hari = hafal ? Math.min(3 * Math.max(1, streak + 1), 21) : 1;
  const kapan = Date.now() + hari * 86400000;
  return { hari, kapan, streak: hafal ? streak + 1 : 0 };
}
