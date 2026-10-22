/**
 * Tes progres belajar (app/progres.ts).
 *
 * Dijalankan di Cek lewat `npm run audit:progres`. Tidak memakai kerangka tes:
 * repo ini belum punya satu pun, dan menambah dependensi baru untuk belasan
 * asersi tidak sepadan. Dikompilasi lewat scripts/tsconfig.audit.json, jalur
 * yang sama dengan audit:kontras.
 *
 * Yang diuji bukan "apakah fungsinya ada", melainkan perilaku yang sebelumnya
 * tidak pernah dijalankan siapa pun: jadwal ulang dari nextReview(), dan
 * penyimpanan yang harus tetap aman saat localStorage rusak atau penuh.
 */
import assert from 'node:assert/strict';
import {
  bacaProgres,
  jatuhTempo,
  jumlahHafal,
  kunciKartu,
  parseProgres,
  serializeProgres,
  simpanProgres,
  tandaiKartu,
  VERSI_PROGRES,
  type Gudang,
} from '../app/progres.js';

const HARI = 86_400_000;
let lulus = 0;

function uji(nama: string, fn: () => void) {
  fn();
  lulus++;
  console.log(`✓ ${nama}`);
}

function gudangPalsu(awal: Record<string, string> = {}) {
  const isi = new Map(Object.entries(awal));
  const g: Gudang = {
    getItem: (k) => isi.get(k) ?? null,
    setItem: (k, v) => {
      isi.set(k, v);
    },
  };
  return { g, isi };
}

uji('kunci kartu memisahkan mode dan organ', () => {
  assert.equal(kunciKartu('name', 'heart'), 'name:heart');
  assert.notEqual(kunciKartu('name', 'heart'), kunciKartu('fungsi', 'heart'));
});

uji('hafal menjadwalkan ulang 3 hari, streak naik', () => {
  const p = tandaiKartu({}, 'name:heart', true, 0);
  assert.deepEqual(p['name:heart'], { hafal: true, streak: 1, hari: 3, kapan: 3 * HARI });
});

uji('hafal berulang memperpanjang jeda sampai batas 21 hari', () => {
  let p = {};
  const jeda: number[] = [];
  for (let i = 0; i < 10; i++) {
    p = tandaiKartu(p, 'name:heart', true, 0);
    jeda.push(p['name:heart'].hari);
  }
  assert.deepEqual(jeda, [3, 6, 9, 12, 15, 18, 21, 21, 21, 21]);
  assert.equal(p['name:heart'].streak, 10);
  // Batas atas ini yang mencegah kartu hilang dari jadwal selamanya.
  assert.ok(Math.max(...jeda) <= 21);
});

uji('belum hafal mereset streak dan mengulang besok', () => {
  const sudah = tandaiKartu(tandaiKartu({}, 'name:heart', true, 0), 'name:heart', true, 0);
  assert.equal(sudah['name:heart'].streak, 2);
  const reset = tandaiKartu(sudah, 'name:heart', false, 0);
  assert.deepEqual(reset['name:heart'], { hafal: false, streak: 0, hari: 1, kapan: HARI });
});

uji('tandaiKartu tidak mengubah catatan kartu lain', () => {
  const awal = tandaiKartu({}, 'name:heart', true, 0);
  const akhir = tandaiKartu(awal, 'fungsi:lungs', true, 0);
  assert.deepEqual(akhir['name:heart'], awal['name:heart']);
  assert.equal(Object.keys(akhir).length, 2);
});

uji('jumlahHafal hanya menghitung kunci yang diminta', () => {
  const p = tandaiKartu(
    tandaiKartu({}, 'name:heart', true, 0),
    'name:lungs',
    false,
    0,
  );
  assert.equal(jumlahHafal(p, ['name:heart', 'name:lungs']), 1);
  assert.equal(jumlahHafal(p, ['name:heart']), 1);
  assert.equal(jumlahHafal(p, ['name:brain']), 0);
  assert.equal(jumlahHafal(p, []), 0);
});

uji('jatuhTempo melewati kartu yang belum hafal', () => {
  const p = tandaiKartu(tandaiKartu({}, 'name:heart', true, 0), 'name:lungs', false, 0);
  assert.deepEqual(jatuhTempo(p, 0), []);
  assert.deepEqual(jatuhTempo(p, 3 * HARI), ['name:heart']);
  assert.deepEqual(jatuhTempo(p, 3 * HARI - 1), []);
});

uji('parseProgres menolak data yang tidak bisa dipercaya', () => {
  assert.deepEqual(parseProgres(null), {});
  assert.deepEqual(parseProgres(''), {});
  assert.deepEqual(parseProgres('bukan json'), {});
  assert.deepEqual(parseProgres('null'), {});
  assert.deepEqual(parseProgres('[]'), {});
  // Versi skema lain: lebih baik pengguna kehilangan centang daripada
  // aplikasi membaca bentuk data yang tidak ia kenal.
  assert.deepEqual(parseProgres(JSON.stringify({ versi: 99, kartu: {} })), {});
  assert.deepEqual(parseProgres(JSON.stringify({ versi: VERSI_PROGRES })), {});
});

uji('parseProgres membuang catatan cacat, menyisakan yang sah', () => {
  const mentah = JSON.stringify({
    versi: VERSI_PROGRES,
    kartu: {
      'name:heart': { hafal: true, streak: 1, hari: 3, kapan: 3 * HARI },
      'name:lungs': { hafal: 'ya', streak: 1, hari: 3, kapan: 0 },
      'name:brain': null,
      'name:liver': { hafal: false },
    },
  });
  const p = parseProgres(mentah);
  assert.deepEqual(Object.keys(p), ['name:heart']);
});

uji('simpan lalu baca mengembalikan progres yang sama', () => {
  const { g } = gudangPalsu();
  const p = tandaiKartu({}, 'name:heart', true, 0);
  simpanProgres(p, g);
  assert.deepEqual(bacaProgres(g), p);
});

uji('penyimpanan rusak tidak pernah melempar', () => {
  const rusak: Gudang = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
  };
  assert.deepEqual(bacaProgres(rusak), {});
  simpanProgres({ 'name:heart': { hafal: true, streak: 1, hari: 3, kapan: 0 } }, rusak);
  // Tanpa gudang sama sekali (lingkungan tanpa DOM).
  assert.deepEqual(bacaProgres(null), {});
  simpanProgres({}, null);
});

uji('serializeProgres menulis versi skema', () => {
  const data = JSON.parse(serializeProgres({}));
  assert.equal(data.versi, VERSI_PROGRES);
  assert.deepEqual(data.kartu, {});
});

console.log(`\n${lulus} tes progres belajar lulus.`);
