/* ===== JRH Atlas — gaya ruang belajar (terpisah dari viewer 3D) ===== */

:root {
  --jrh-bg: #0b1020;
  --jrh-kartu: #131a2e;
  --jrh-garis: #24304d;
  --jrh-teks: #e8eefc;
  --jrh-redup: #9aa9c7;
  --jrh-aksen: #22d3ee;
  --jrh-aksen2: #f59e0b;
  --jrh-benar: #22c55e;
  --jrh-salah: #ef4444;
  --jrh-radius: 16px;
}

.cangkang {
  min-height: 100dvh;
  background: var(--jrh-bg);
  color: var(--jrh-teks);
  display: flex;
  flex-direction: column;
}

/* ---------- Tab utama ---------- */
.tabbar {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(11, 16, 32, 0.92);
  border-bottom: 1px solid var(--jrh-garis);
  position: sticky;
  top: 0;
  z-index: 60;
  backdrop-filter: blur(12px);
  overflow-x: auto;
  scrollbar-width: none;
}
.tabbar::-webkit-scrollbar { display: none; }

.tab {
  flex: 1 0 auto;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--jrh-redup);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: 160ms ease;
}
.tab:hover { color: var(--jrh-teks); background: #1a2340; }
.tab.aktif {
  color: #04121c;
  background: linear-gradient(135deg, var(--jrh-aksen), #67e8f9);
  box-shadow: 0 6px 20px rgba(34, 211, 238, 0.28);
}

.isi { flex: 1; min-height: 0; }

/* ---------- Akademi ---------- */
.akademi-wrap {
  max-width: 880px;
  margin: 0 auto;
  padding: 18px 16px 64px;
}

.subtab {
  display: flex;
  gap: 4px;
  background: #101728;
  border: 1px solid var(--jrh-garis);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 22px;
}
.sub {
  flex: 1;
  padding: 9px 8px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--jrh-redup);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.sub.aktif { background: #1e2a45; color: var(--jrh-teks); }

.akademi h2 { font-size: 24px; line-height: 1.25; margin: 0 0 6px; letter-spacing: -0.02em; }
.akademi h3 { font-size: 19px; line-height: 1.35; margin: 0 0 10px; }
.leads { color: var(--jrh-redup); font-size: 14px; line-height: 1.6; margin: 0 0 18px; }

/* ---------- Pilih jenjang ---------- */
.jenjang { display: flex; gap: 8px; margin-bottom: 22px; }
.jbtn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--jrh-garis);
  background: var(--jrh-kartu);
  color: var(--jrh-redup);
  cursor: pointer;
  transition: 160ms ease;
}
.jbtn b { font-size: 15px; color: var(--jrh-teks); }
.jbtn small { font-size: 11px; }
.jbtn.aktif {
  border-color: var(--w);
  box-shadow: inset 0 0 0 1px var(--w), 0 8px 22px -12px var(--w);
}
.jbtn.aktif b { color: var(--w); }

/* ---------- Belajar ---------- */
.tur-kepala { margin-bottom: 16px; }
.tur-kepala p { color: var(--jrh-redup); font-size: 13px; margin: 8px 0 0; line-height: 1.55; }
.lencana {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--jrh-aksen);
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  padding: 4px 10px;
  border-radius: 999px;
}
.progres {
  height: 5px;
  background: #1b2540;
  border-radius: 99px;
  margin-top: 14px;
  overflow: hidden;
}
.progres-isi {
  height: 100%;
  background: linear-gradient(90deg, var(--jrh-aksen), var(--jrh-aksen2));
  transition: width 300ms ease;
}

.kartu-besar {
  background: var(--jrh-kartu);
  border: 1px solid var(--jrh-garis);
  border-radius: var(--jrh-radius);
  padding: 22px;
  animation: masuk 260ms ease both;
}
@keyframes masuk {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.langkah-ke { font-size: 11px; color: var(--jrh-redup); letter-spacing: 0.05em; text-transform: uppercase; }
.kartu-besar .isi { font-size: 15px; line-height: 1.7; color: #cfdbf3; margin: 0 0 16px; }

.organ-ringkas {
  background: #0f172a;
  border: 1px solid var(--jrh-garis);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}
.organ-nama { display: flex; align-items: center; gap: 12px; }
.organ-nama .emoji { font-size: 24px; }
.organ-nama strong { display: block; font-size: 16px; }
.organ-nama small { display: block; color: var(--jrh-redup); font-size: 12.5px; line-height: 1.5; margin-top: 2px; }

.chip {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: #1e2a45;
  color: #b9c8e4;
  border: 1px solid var(--jrh-garis);
  margin-left: auto;
  white-space: nowrap;
}

.fakta { margin: 12px 0 0; padding-left: 18px; color: #c3d1ea; font-size: 13.5px; line-height: 1.65; }
.fakta li { margin-bottom: 5px; }

.mitos {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-left: 3px solid var(--jrh-aksen2);
  background: rgba(245, 158, 11, 0.08);
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  line-height: 1.6;
  color: #f2d9a8;
}
.refleksi {
  margin: 16px 0 0;
  padding: 12px 14px;
  background: rgba(34, 211, 238, 0.07);
  border: 1px dashed rgba(34, 211, 238, 0.35);
  border-radius: 10px;
  font-size: 13.5px;
  line-height: 1.6;
  color: #bfeaf5;
}

.navigasi { display: flex; gap: 10px; margin-top: 18px; }
.tombol {
  flex: 1;
  padding: 12px 16px;
  border-radius: 11px;
  border: 1px solid var(--jrh-garis);
  background: #16203a;
  color: var(--jrh-teks);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 150ms ease;
}
.tombol:hover:not(:disabled) { background: #1e2a45; }
.tombol:disabled { opacity: 0.4; cursor: not-allowed; }
.tombol.utama {
  background: linear-gradient(135deg, var(--jrh-aksen), #67e8f9);
  color: #04121c;
  border-color: transparent;
}
.tombol.besar { width: 100%; padding: 15px; font-size: 15px; margin-top: 8px; }

.daftar-tur { margin-top: 22px; font-size: 13px; color: var(--jrh-redup); }
.daftar-tur summary { cursor: pointer; padding: 8px 0; }
.daftar-tur ul { padding-left: 18px; line-height: 1.8; }

/* ---------- Kuis ---------- */
.kuis-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.kuis-head .chip { margin-left: auto; }
.pilihan { display: grid; gap: 9px; margin-top: 14px; }
.pilih {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  border-radius: 11px;
  border: 1px solid var(--jrh-garis);
  background: #0f172a;
  color: var(--jrh-teks);
  font-size: 14.5px;
  text-align: left;
  cursor: pointer;
  transition: 150ms ease;
}
.pilih:hover:not(:disabled) { border-color: var(--jrh-aksen); background: #16203a; }
.pilih .huruf {
  flex: 0 0 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #1e2a45;
  font-size: 12px;
  font-weight: 700;
  color: var(--jrh-redup);
}
.pilih.benar { border-color: var(--jrh-benar); background: rgba(34, 197, 94, 0.12); }
.pilih.benar .huruf { background: var(--jrh-benar); color: #04120a; }
.pilih.salah { border-color: var(--jrh-salah); background: rgba(239, 68, 68, 0.12); }
.pilih.salah .huruf { background: var(--jrh-salah); color: #fff; }

.umpan { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--jrh-garis); }
.umpan p { font-size: 13.5px; line-height: 1.65; color: #c9d6ee; margin: 0 0 14px; }

.hasil { text-align: center; padding: 26px 20px; }
.emoji-besar { font-size: 52px; display: block; margin-bottom: 8px; }
.skor { font-size: 52px; font-weight: 800; letter-spacing: -0.03em; margin: 6px 0; color: var(--jrh-aksen); }
.skor small { font-size: 16px; color: var(--jrh-redup); font-weight: 600; }

/* ---------- Flashcard ---------- */
.filter { display: flex; gap: 8px; margin-bottom: 16px; }
.filter select {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--jrh-garis);
  background: #0f172a;
  color: var(--jrh-teks);
  font-size: 13.5px;
}
.kartu, .kartu.balik {
  width: 100%;
  min-height: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 26px;
  border-radius: var(--jrh-radius);
  border: 1px solid var(--jrh-garis);
  background: linear-gradient(160deg, #131a2e, #0e1526);
  color: var(--jrh-teks);
  cursor: pointer;
  text-align: center;
  transition: 220ms ease;
}
.kartu:hover { border-color: var(--jrh-aksen); transform: translateY(-2px); }
.kartu.balik { background: linear-gradient(160deg, #0d2233, #0e1a2a); border-color: rgba(34, 211, 238, 0.45); }
.kartu-sisi { font-size: 10.5px; letter-spacing: 0.12em; color: var(--jrh-redup); font-weight: 700; }
.kartu strong { font-size: 18px; line-height: 1.5; font-weight: 600; }
.kartu small { font-size: 11.5px; color: var(--jrh-redup); }

.catatan-kecil { font-size: 11.5px; color: var(--jrh-redup); line-height: 1.6; margin-top: 14px; text-align: center; }

/* ---------- Detail organ di viewer ---------- */
.detail-organ { font-size: 13.5px; line-height: 1.65; color: #c9d6ee; }
.detail-organ .inti { font-size: 15px; font-weight: 600; color: var(--jrh-teks); margin: 10px 0; }

/* ---------- Mobile ---------- */
@media (max-width: 640px) {
  .akademi-wrap { padding: 14px 12px 72px; }
  .akademi h2 { font-size: 20px; }
  .kartu-besar { padding: 16px; }
  .jenjang { gap: 6px; }
  .jbtn { padding: 10px; }
  .jbtn small { display: none; }
  .tab { padding: 9px 12px; font-size: 13px; }
  .kartu { min-height: 180px; padding: 20px; }
  .kartu strong { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
