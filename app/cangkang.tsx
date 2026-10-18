import {useEffect,useRef,useState} from 'react';
import Home,{type Sorotan} from './page';
import {Akademi} from './akademi';
import {Glosarium,Panduan} from './halaman';
import Tema from './tombol-tema';
import {turUntuk,organLangkah} from './belajar';
import type {Jenjang} from './kurikulum';
import './ekstra.css';
import './redesign.css';
const TABS=[{id:'jelajah',label:'Jelajah 3D',icon:'◎',description:'Kenali tubuh melalui model tiga dimensi.'},{id:'belajar',label:'Belajar',icon:'▤',description:'Pelajari organ, satu langkah setiap kali.'},{id:'kuis',label:'Kuis',icon:'✓',description:'Uji pemahaman dan pelajari penjelasannya.'},{id:'flashcard',label:'Flashcard',icon:'▱',description:'Latihan mengingat nama, fungsi, dan fakta.'},{id:'glosarium',label:'Glosarium',icon:'Aa',description:'Temukan arti istilah anatomi.'},{id:'panduan',label:'Panduan',icon:'?',description:'Panduan penggunaan dan sumber pembelajaran.'}] as const;
type Tab=typeof TABS[number]['id'];
function readTab():Tab{const value=new URLSearchParams(location.search).get('tab');return TABS.find(t=>t.id===value)?.id??'jelajah';}
function readLevel():Jenjang{const value=new URLSearchParams(location.search).get('jenjang');return value==='smp'||value==='sma'?value:'sd';}
export default function Cangkang(){
 const [tab,setTab]=useState<Tab>(readTab),[level,setLevel]=useState<Jenjang>(readLevel),[sorotan,setSorotan]=useState<Sorotan|null>(null);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{const pop=()=>{setTab(readTab());setLevel(readLevel());};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[]);
 function navigate(next:Tab){if(next===tab)return;const url=new URL(location.href);url.searchParams.set('tab',next);history.pushState(null,'',url);setTab(next);window.scrollTo({top:0});requestAnimationFrame(()=>heading.current?.focus());}
 function changeLevel(next:Jenjang){setLevel(next);const url=new URL(location.href);url.searchParams.set('jenjang',next);history.replaceState(null,'',url);}
 function show3D(j:Jenjang,index:number){const step=turUntuk(j).langkah[index];if(!step)return;const organ=organLangkah(step);if(!organ)return;setSorotan({sistem:step.sorot,organ:organ.key});navigate('jelajah');}
 const current=TABS.find(t=>t.id===tab)!;
 return <div className={`cangkang app-rebuild ${tab==='jelajah'?'is-explorer':''}`}>
  <a className="skip-link" href="#konten-utama">Lewati navigasi</a>
  <header className="app-header"><a className="brand" href="?tab=jelajah" onClick={e=>{e.preventDefault();navigate('jelajah');}}><span className="brand-mark" aria-hidden="true">J</span><span><strong>JRH Atlas</strong><small>Anatomi untuk dipahami</small></span></a><Tema/></header>
  <nav className="app-navigation" aria-label="Navigasi utama">{TABS.map(t=><a key={t.id} href={`?tab=${t.id}`} aria-current={tab===t.id?'page':undefined} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(t.id);}}><span className="nav-icon" aria-hidden="true">{t.icon}</span><span>{t.label}</span></a>)}<p className="nav-note">Untuk belajar.<br/>Bukan alat diagnosis.</p></nav>
  <main id="konten-utama" className="app-content" tabIndex={-1}><div className="page-heading"><div><span className="page-kicker">RUANG EKSPLORASI & BELAJAR</span><h1 ref={heading} tabIndex={-1}>{current.label}</h1><p>{current.description}</p></div>{tab==='jelajah'&&<button className="tombol" type="button" onClick={()=>navigate('belajar')}>Mulai tur belajar →</button>}</div>
   {tab==='jelajah'?<div className="explorer-frame"><Home sorotan={sorotan}/></div>:tab==='glosarium'?<div className="akademi-wrap"><Glosarium/></div>:tab==='panduan'?<div className="akademi-wrap"><Panduan/></div>:<Akademi key={`${tab}-${level}`} awal={tab} awalJenjang={level} onJenjang={changeLevel} onLihat3D={show3D}/>}
  </main>
 </div>;
}
