import {Component,Suspense,lazy,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import type {Sorotan} from './page';
import {Akademi} from './akademi';
import {Glosarium,Panduan} from './halaman';
import Tema from './tombol-tema';
import {turUntuk,organLangkah} from './belajar';
import type {Jenjang} from './kurikulum';
import './ekstra.css';
import './redesign.css';
const Home=lazy(()=>import('./page'));
class ViewerBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="kartu-besar" role="alert"><p>Penjelajah 3D tidak dapat dimuat. Periksa koneksi lalu coba lagi.</p><button className="tombol" type="button" onClick={()=>location.reload()}>Muat ulang</button></div>:this.props.children;}
}
/* Ikon navigasi digambar sebagai SVG 24x24 dengan stroke seragam (1,7px).
   Sebelumnya tiap tab memakai glyph tipografi berbeda (◎ ▤ ✓ ▱ Aa ?) yang
   bobot visual dan baseline-nya tidak seragam, jadi bar navigasi terlihat
   berantakan. Satu viewBox, satu ketebalan, satu set sudut. */
const IKON:Record<string,ReactNode>={
 jelajah:<><circle cx="12" cy="12" r="8.2"/><ellipse cx="12" cy="12" rx="8.2" ry="3.4"/><path d="M12 3.8v16.4"/></>,
 belajar:<><path d="M4 5.6h6.2A2.2 2.2 0 0 1 12 7.8v10.6a1.8 1.8 0 0 0-1.8-1.8H4z"/><path d="M20 5.6h-6.2A2.2 2.2 0 0 0 12 7.8v10.6a1.8 1.8 0 0 1 1.8-1.8H20z"/></>,
 kuis:<><path d="m9.2 8.4 7.6 3.6-7.6 3.6z"/><circle cx="12" cy="12" r="8.4"/></>,
 flashcard:<><rect x="3.4" y="7.2" width="12.6" height="9.4" rx="2.2"/><path d="M8 4.4h9.4A2.2 2.2 0 0 1 19.6 6.6v7.2"/></>,
 glosarium:<><path d="M5 4.6h8.2A2.4 2.4 0 0 1 15.6 7v12.4H7.4A2.4 2.4 0 0 1 5 17z"/><path d="M15.6 9.4H18a1.6 1.6 0 0 1 1.6 1.6v8.4H15.6"/><path d="M8.2 9h4.2M8.2 12.4h4.2"/></>,
 panduan:<><circle cx="12" cy="12" r="8.4"/><path d="M9.7 9.4a2.4 2.4 0 1 1 3.3 2.2c-.6.3-1 .9-1 1.6v.5"/><path d="M12 16.9h.01"/></>,
};
const TABS=[{id:'jelajah',label:'Jelajah 3D',description:'Kenali tubuh melalui model tiga dimensi.'},{id:'belajar',label:'Belajar',description:'Pelajari organ, satu langkah setiap kali.'},{id:'kuis',label:'Kuis',description:'Uji pemahaman dan pelajari penjelasannya.'},{id:'flashcard',label:'Flashcard',description:'Latihan mengingat nama, fungsi, dan fakta.'},{id:'glosarium',label:'Glosarium',description:'Temukan arti istilah anatomi.'},{id:'panduan',label:'Panduan',description:'Panduan penggunaan dan sumber pembelajaran.'}] as const;
type Tab=typeof TABS[number]['id'];
function readTab():Tab{const value=new URLSearchParams(location.search).get('tab');return TABS.find(t=>t.id===value)?.id??'jelajah';}
function readLevel():Jenjang{const value=new URLSearchParams(location.search).get('jenjang');return value==='smp'||value==='sma'?value:'sd';}
export default function Cangkang(){
 const [tab,setTab]=useState<Tab>(readTab),[level,setLevel]=useState<Jenjang>(readLevel),[sorotan,setSorotan]=useState<Sorotan|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 const previousTab=useRef(tab);
 // Focus only after React commits a route change; also covers back/forward.
 useLayoutEffect(()=>{if(previousTab.current===tab)return;previousTab.current=tab;window.scrollTo({top:0});heading.current?.focus({preventScroll:true});},[tab]);
 useEffect(()=>{const pop=()=>{setTab(readTab());setLevel(readLevel());};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[]);
 function navigate(next:Tab){if(next===tab)return;const url=new URL(location.href);url.searchParams.set('tab',next);history.pushState(null,'',url);setTab(next);}
 function changeLevel(next:Jenjang){setLevel(next);const url=new URL(location.href);url.searchParams.set('jenjang',next);history.replaceState(null,'',url);}
 function show3D(j:Jenjang,index:number){const step=turUntuk(j).langkah[index];if(!step)return;const organ=organLangkah(step);if(!organ)return;setSorotan({sistem:step.sorot,organ:organ.key});navigate('jelajah');}
 const current=TABS.find(t=>t.id===tab)!;
 return <div className={`cangkang app-rebuild ${tab==='jelajah'?'is-explorer':''}`}>
  <a className="skip-link" href="#konten-utama">Lewati navigasi</a>
  <header className="app-header"><a className="brand" href="?tab=jelajah" onClick={e=>{e.preventDefault();navigate('jelajah');}}><span className="brand-mark" aria-hidden="true">J</span><span><strong>JRH Atlas</strong><small>Anatomi untuk dipahami</small></span></a><Tema/></header>
  <nav className="app-navigation" aria-label="Navigasi utama">{TABS.map(t=><a key={t.id} href={`?tab=${t.id}`} aria-current={tab===t.id?'page':undefined} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(t.id);}}><span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{IKON[t.id]}</svg></span><span className="nav-label">{t.label}</span></a>)}<p className="nav-note">Untuk belajar.<br/>Bukan alat diagnosis.</p></nav>
  <main id="konten-utama" className="app-content" tabIndex={-1}><div className="page-heading"><div><span className="page-kicker">RUANG EKSPLORASI & BELAJAR</span><h1 ref={heading} tabIndex={-1}>{current.label}</h1><p>{current.description}</p></div>{tab==='jelajah'&&<button className="tombol" type="button" onClick={()=>navigate('belajar')}>Mulai tur belajar →</button>}</div>
   {tab==='jelajah'?<div className="explorer-frame"><ViewerBoundary><Suspense fallback={<div className="kartu-besar" role="status">Menyiapkan penjelajah 3D…</div>}><Home sorotan={sorotan}/></Suspense></ViewerBoundary></div>:tab==='glosarium'?<div className="akademi-wrap"><Glosarium/></div>:tab==='panduan'?<div className="akademi-wrap"><Panduan/></div>:<Akademi key={`${tab}-${level}`} awal={tab} awalJenjang={level} onJenjang={changeLevel} onLihat3D={show3D}/>}
  </main>
 </div>;
}
