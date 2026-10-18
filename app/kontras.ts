/**
 * JRH Atlas — pembaca jarak (kontras) WCAG untuk audit tema.
 *
 * Tidak ada dependensi. `periksaTema` menerima pasangan warna teks/latar
 * dan mengembalikan rasio kontras serta status AA / AAA untuk teks normal
 * dan teks besar. Dipakai oleh skrip audit dan saat pengembangan tema baru.
 */

export type RGB = { r: number; g: number; b: number };

/** Terima '#rgb', '#rrggbb', 'rgb(…)' atau 'hsl(…)' sederhana. */
export function warnaKeRgb(nilai: string): RGB {
  const s = nilai.trim().toLowerCase();
  const hex = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const rgb = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  const hsl = s.match(/hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/);
  if (hsl) {
    const h = +hsl[1] / 360, sa = +hsl[2] / 100, l = +hsl[3] / 100;
    const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa;
    const p = 2 * l - q;
    const f = (t: number) => {
      const x = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    return { r: Math.round(f(h + 1 / 3) * 255), g: Math.round(f(h) * 255), b: Math.round(f(h - 1 / 3) * 255) };
  }
  throw new Error(`Warna tidak dikenali: ${nilai}`);
}

/** Saluran warna ter-encode gamma sesuai spesifikasi WCAG. */
function kanal(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Luminans relatif 0–1. */
export function luminans(c: RGB): number {
  return 0.2126 * kanal(c.r) + 0.7152 * kanal(c.g) + 0.0722 * kanal(c.b);
}

/** Rasio kontras 1–21. Urutan tidak penting. */
export function rasioKontras(a: string, b: string): number {
  const la = luminans(warnaKeRgb(a)), lb = luminans(warnaKeRgb(b));
  const terang = Math.max(la, lb), gelap = Math.min(la, lb);
  return (terang + 0.05) / (gelap + 0.05);
}

export type StatusKontras = {
  pasangan: string;
  rasio: number;
  aaTeks: boolean; // ≥ 4.5 — teks normal
  aaaTeks: boolean; // ≥ 7
  aaBesar: boolean; // ≥ 3 — teks besar / grafik
};

/** Periksa satu pasangan dan tandai kelulusan WCAG. */
export function periksa(teks: string, latar: string, nama = ''): StatusKontras {
  const rasio = Math.round(rasioKontras(teks, latar) * 100) / 100;
  return {
    pasangan: nama || `${teks} di atas ${latar}`,
    rasio,
    aaTeks: rasio >= 4.5,
    aaaTeks: rasio >= 7,
    aaBesar: rasio >= 3,
  };
}

/**
 * Gelapkan atau terangkan warna sampai mencapai rasio minimum.
 * Dipakai untuk memperbaiki aksen palet yang gagal AA tanpa mengganti hue.
 */
export function perbaikiKontras(warna: string, latar: string, minimum = 4.5, maksLangkah = 40): string {
  const keGelap = luminans(warnaKeRgb(latar)) > 0.5;
  let terbaik = warnaKeRgb(warna);
  let rasio = rasioKontras(warna, latar);
  if (rasio >= minimum) return warna;
  for (let i = 1; i <= maksLangkah; i++) {
    const t = i / maksLangkah;
    const dasar = warnaKeRgb(warna);
    const kandidat: RGB = keGelap
      ? { r: Math.round(dasar.r * (1 - t)), g: Math.round(dasar.g * (1 - t)), b: Math.round(dasar.b * (1 - t)) }
      : { r: Math.round(dasar.r + (255 - dasar.r) * t), g: Math.round(dasar.g + (255 - dasar.g) * t), b: Math.round(dasar.b + (255 - dasar.b) * t) };
    const hex = '#' + [kandidat.r, kandidat.g, kandidat.b].map((c) => c.toString(16).padStart(2, '0')).join('');
    const r = rasioKontras(hex, latar);
    if (r > rasio) { rasio = r; terbaik = kandidat; }
    if (r >= minimum) return hex;
  }
  return '#' + [terbaik.r, terbaik.g, terbaik.b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Hilangkan tanda pagar, untuk konsumsi Skript. */
export function tanpaPagar(warna: string): string {
  return warna.replace('#', '');
}
