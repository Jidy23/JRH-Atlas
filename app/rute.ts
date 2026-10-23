/**
 * JRH Atlas — satu sumber kebenaran untuk rute, judul, dan deskripsi.
 *
 * Sebelumnya label dan deskripsi tab ditulis ulang di cangkang.tsx, sementara
 * judul dokumen tidak pernah berubah sehingga keenam rute tampil dengan judul
 * yang sama di tab browser, riwayat, dan hasil pencarian. Sekarang semuanya
 * membaca app/rute.json, yang juga dipakai scripts/prerender.mjs untuk membuat
 * HTML statis per rute.
 */
import data from './rute.json';

export type IdRute =
  | 'jelajah'
  | 'belajar'
  | 'kuis'
  | 'flashcard'
  | 'glosarium'
  | 'panduan'
  | 'dukungan';

export type Rute = {
  id: IdRute;
  path: string;
  label: string;
  judul: string;
  deskripsi: string;
  ringkas: string;
  /** Label kecil di atas judul halaman. Berbeda per rute supaya keenam
   *  halaman tidak lagi dibuka dengan kalimat yang sama. */
  kicker: string;
};

export const SITUS: string = data.situs;
export const RUTE = data.rute as unknown as Rute[];

/** Path yang sedang dibuka. '/' dan path tak dikenal sama-sama jatuh ke rute pertama. */
export function ruteDariPath(pathname: string): Rute {
  const bersih = pathname.replace(/\/+$/, '') || '/';
  return RUTE.find((r) => r.path === bersih) ?? RUTE[0];
}

export function pathUntuk(id: IdRute): string {
  return RUTE.find((r) => r.id === id)?.path ?? '/';
}

export function idRuteSah(nilai: string | null): nilai is IdRute {
  return nilai !== null && RUTE.some((r) => r.id === nilai);
}
