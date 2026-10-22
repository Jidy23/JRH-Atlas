/**
 * JRH Atlas — progres belajar yang bertahan setelah halaman dimuat ulang.
 *
 * Sebelumnya `dihafal` di akademi.tsx hanya `useState<Set<string>>`, jadi
 * setiap kartu yang ditandai hafal hilang begitu pengguna menekan refresh
 * atau berpindah tab. Di sini progres disimpan di localStorage dengan versi
 * skema, karena kunci kartu (`mode:organ`) dan bentuk catatannya bisa berubah.
 *
 * Penyimpanan diakses lewat tipe struktural, bukan `Storage`, supaya berkas
 * ini bisa dikompilasi dan diuji tanpa `lib: DOM`.
 *
 * Berkas ini sengaja tidak mengimpor apa pun dari app/kuis.ts. Jadwal ulang
 * dulu dipinjam dari sana, tetapi tsc menulis impor tanpa ekstensi dan Node
 * menolak itu saat `npm run audit:progres` menjalankan hasil build di
 * `.audit-build/` (ERR_MODULE_NOT_FOUND). Kuis juga menarik kurikulum dan bank
 * soal yang tidak perlu ikut dikompilasi hanya untuk satu fungsi aritmetika.
 */

export type Gudang = {
  getItem(kunci: string): string | null;
  setItem(kunci: string, nilai: string): void;
};

/** Satu kartu yang sudah pernah dinilai. */
export type CatatanKartu = {
  hafal: boolean;
  /** Berapa kali berturut-turut ditandai hafal. Direset saat "belum hafal". */
  streak: number;
  /** Jeda berikutnya dalam hari, dari nextReview(). */
  hari: number;
  /** Epoch ms kapan kartu ini layak diulang. */
  kapan: number;
};

export type Progres = Record<string, CatatanKartu>;

export const KUNCI_PROGRES = 'jrh-atlas-progres';
export const VERSI_PROGRES = 1;

/** Kunci stabil per kartu: satu organ punya tiga jenis kartu. */
export function kunciKartu(mode: string, organ: string) {
  return `${mode}:${organ}`;
}

/**
 * localStorage bisa melempar galat (mode privat, kuota penuh), dan di
 * lingkungan tanpa DOM (`node`) ia tidak ada sama sekali.
 */
export function gudangBawaan(): Gudang | null {
  try {
    const g = globalThis as unknown as { localStorage?: Gudang };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

function catatanSah(nilai: unknown): nilai is CatatanKartu {
  if (typeof nilai !== 'object' || nilai === null) return false;
  const c = nilai as Partial<CatatanKartu>;
  return (
    typeof c.hafal === 'boolean' &&
    typeof c.streak === 'number' &&
    typeof c.hari === 'number' &&
    typeof c.kapan === 'number'
  );
}

/**
 * Membaca apa pun yang ada di penyimpanan tanpa pernah melempar.
 * Data rusak atau dari versi skema lain dianggap kosong: lebih baik pengguna
 * kehilangan centang daripada aplikasi gagal dirender.
 */
export function parseProgres(mentah: string | null): Progres {
  if (!mentah) return {};
  try {
    const data = JSON.parse(mentah) as { versi?: unknown; kartu?: unknown };
    if (data?.versi !== VERSI_PROGRES) return {};
    if (typeof data.kartu !== 'object' || data.kartu === null) return {};
    const hasil: Progres = {};
    for (const [kunci, nilai] of Object.entries(data.kartu as Record<string, unknown>)) {
      if (catatanSah(nilai)) hasil[kunci] = nilai;
    }
    return hasil;
  } catch {
    return {};
  }
}

export function serializeProgres(p: Progres) {
  return JSON.stringify({ versi: VERSI_PROGRES, kartu: p });
}

export function bacaProgres(g: Gudang | null = gudangBawaan()): Progres {
  if (!g) return {};
  try {
    return parseProgres(g.getItem(KUNCI_PROGRES));
  } catch {
    return {};
  }
}

export function simpanProgres(p: Progres, g: Gudang | null = gudangBawaan()) {
  if (!g) return;
  try {
    g.setItem(KUNCI_PROGRES, serializeProgres(p));
  } catch {
    /* kuota penuh atau mode privat: progres tetap jalan di memori */
  }
}

/**
 * Interval pengulangan sederhana: hafal menjeda 3 hari, belum hafal ulang
 * besok. Jeda memanjang 3/6/9/12/15/18 lalu mentok di 21 hari, supaya kartu
 * yang sudah lama hafal tidak menghilang dari jadwal berbulan-bulan.
 */
export function nextReview(hafal: boolean, streak: number) {
  const hari = hafal ? Math.min(3 * Math.max(1, streak + 1), 21) : 1;
  const kapan = Date.now() + hari * 86400000;
  return { hari, kapan, streak: hafal ? streak + 1 : 0 };
}

/**
 * Menilai satu kartu. Jeda berikutnya diambil dari `nextReview()` di berkas
 * ini, satu-satunya pemakainya.
 */
export function tandaiKartu(
  p: Progres,
  kunci: string,
  hafal: boolean,
  sekarang = Date.now(),
): Progres {
  const streak = hafal ? (p[kunci]?.streak ?? 0) : 0;
  const jadwal = nextReview(hafal, streak);
  return {
    ...p,
    [kunci]: {
      hafal,
      streak: jadwal.streak,
      hari: jadwal.hari,
      kapan: sekarang + jadwal.hari * 86_400_000,
    },
  };
}

export function jumlahHafal(p: Progres, kunci: string[]) {
  return kunci.filter((k) => p[k]?.hafal).length;
}

/** Kunci yang sudah jatuh tempo, untuk pengingat "ulangi hari ini". */
export function jatuhTempo(p: Progres, sekarang = Date.now()) {
  return Object.entries(p)
    .filter(([, c]) => c.hafal && c.kapan <= sekarang)
    .map(([kunci]) => kunci);
}
