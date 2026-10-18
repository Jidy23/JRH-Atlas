/** JRH Atlas — Kuis & Flashcard (logika murni, mudah diuji) */
import { ORGAN, type Jenjang, type OrganInfo } from './kurikulum';

export type Soal = {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban: number;
  alasan: string;
  organ: string;
};

/** Ambil soal dari kurikulum; jenjang=undefined berarti semua jenjang. */
export function bankSoal(jenjang?: Jenjang): Soal[] {
  return ORGAN.filter((o) => !jenjang || o.jenjang === jenjang).map((o) => ({
    id: o.key,
    pertanyaan: o.quiz.pertanyaan,
    pilihan: o.quiz.pilihan,
    jawaban: o.quiz.jawaban,
    alasan: o.quiz.alasan,
    organ: o.id,
  }));
}

/** Fisher–Yates — acak tanpa bias. */
export function acak<T>(arr: T[], seed = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seed() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  if (mode === 'fungsi') return { depan: `${o.id} — apa fungsinya?`, belakang: o.fungsi, sistem: o.sistem, organ: o.key };
  return { depan: `Fakta tentang ${o.id}`, belakang: o.fakta.join(' • '), sistem: o.sistem, organ: o.key };
}

export function deck(jenjang?: Jenjang, mode: 'nama' | 'fungsi' | 'fakta' = 'nama'): Kartu[] {
  return ORGAN.filter((o) => !jenjang || o.jenjang === jenjang).map((o) => kartuDari(o, mode));
}

/** Interval pengulangan sederhana: hafal -> 3 hari, belum -> ulang besok. */
export function nextReview(hafal: boolean, streak: number) {
  const hari = hafal ? Math.min(3 * Math.max(1, streak + 1), 21) : 1;
  const kapan = Date.now() + hari * 86400000;
  return { hari, kapan, streak: hafal ? streak + 1 : 0 };
}
