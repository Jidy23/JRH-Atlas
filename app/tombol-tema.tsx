import {useEffect,useRef,useState} from 'react';
import {MODE,PALET,bacaTema,pantauSistem,simpanTema,type IdPalet,type ModeTema} from './tema';
import './tema.css';
export default function Tema(){
 const [buka,setBuka]=useState(false);
 const [awal]=useState(bacaTema);
 const [mode,setMode]=useState<ModeTema>(awal.mode),[palet,setPalet]=useState<IdPalet>(awal.palet);
 const kotak=useRef<HTMLDivElement>(null),pemicu=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
 useEffect(()=>pantauSistem(mode,palet),[mode,palet]);
 useEffect(()=>{
  if(!buka)return;
  panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
  const klik=(e:PointerEvent)=>{if(kotak.current&&!kotak.current.contains(e.target as Node))setBuka(false);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setBuka(false);pemicu.current?.focus();}};
  document.addEventListener('pointerdown',klik);document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('pointerdown',klik);document.removeEventListener('keydown',key);};
 },[buka]);
 function gantiMode(m:ModeTema){setMode(m);simpanTema(m,palet);}
 function gantiPalet(p:IdPalet){setPalet(p);simpanTema(mode,p);}
 return <div className="tema" ref={kotak} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node))setBuka(false);}}>
  <button ref={pemicu} type="button" className="tema-tombol" aria-expanded={buka} aria-haspopup="dialog" aria-controls={buka?'pengaturan-tampilan':undefined} aria-label="Atur tampilan dan warna" onClick={()=>setBuka(b=>!b)}><span aria-hidden>🎨</span><span className="tema-label">Tampilan</span></button>
  {buka&&<div ref={panel} id="pengaturan-tampilan" className="tema-panel" role="dialog" aria-label="Pengaturan tampilan">
   <div className="tema-bagian"><span className="tema-judul">Mode</span><div className="tema-mode" role="group" aria-label="Mode tampilan">{MODE.map(m=><button key={m.id} type="button" aria-pressed={mode===m.id} className={mode===m.id?'mode aktif':'mode'} onClick={()=>gantiMode(m.id)}><span aria-hidden>{m.ikon}</span>{m.nama}</button>)}</div></div>
   <div className="tema-bagian"><span className="tema-judul">Palet warna</span><div className="tema-palet" role="group" aria-label="Palet warna">{PALET.map(p=><button key={p.id} type="button" aria-pressed={palet===p.id} className={palet===p.id?'palet aktif':'palet'} onClick={()=>gantiPalet(p.id)} title={p.asal}><span className="palet-warna" style={{background:`linear-gradient(135deg, ${p.aksen}, ${p.aksen2})`}} aria-hidden/><span className="palet-nama">{p.nama}</span><span className="palet-asal">{p.asal}</span></button>)}</div></div>
   <p className="tema-catatan">Pilihan disimpan di perangkat ini.</p>
  </div>}
 </div>;
}
