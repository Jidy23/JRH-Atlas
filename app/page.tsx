import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowUpRight,BookOpen,ChevronRight,Focus,Info,Layers3,Pause,RotateCcw,RotateCw,Search,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,SYSTEMS,EXPLANATIONS,explanation,type Atlas,type Concept,type SceneState,type SystemId,type View} from './anatomy';
import {keIndonesia,istilahDalam,cocok} from './istilah';
import {organByName} from './kurikulum';
const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,inspectorOpen:false};

/** Sorotan dari Mode Belajar: sistem yang ditampilkan + organ yang dipilih. */
export type Sorotan={sistem?:string[];organ?:string};

interface Props{sorotan?:Sorotan|null}

export default function Home({sorotan}:Props){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[panel,setPanel]=useState<'layers'|'search'|null>(null),[details,setDetails]=useState(false),[about,setAbout]=useState(false),[query,setQuery]=useState(''),[chosen,setChosen]=useState<Concept|null>(null);
 useEffect(()=>{const abort=new AbortController();setProgress(0);setError('');setAtlas(null);setChosen(null);setDetails(false);setState({...initial,visible:DEFAULT_VISIBLE});fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Katalog anatomi tidak dapat dimuat.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPanel(null);return;}if(e.key==='/'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){e.preventDefault();setPanel('search');setDetails(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>p.system===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const visibleCount=atlas?.parts.filter(p=>state.isolate?state.selected.includes(p.id):state.visible.includes(p.system)||state.selected.includes(p.id)).length??0;
 const results=useMemo(()=>{if(!atlas)return[];const term=query.toLowerCase().trim();if(!term)return ['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea'].map(name=>atlas.concepts.find(c=>c.name.toLowerCase()===name)).filter((x):x is Concept=>!!x);return atlas.concepts.filter(c=>c.name.toLowerCase().includes(term)||c.id.toLowerCase().includes(term)||cocok(c.name,term)).sort((a,b)=>a.name.length-b.name.length).slice(0,80);},[atlas,query]);
 const choose=(c:Concept)=>{setChosen(c);setState(s=>({...s,selected:c.elements,isolate:false,rotate:false}));setDetails(true);setPanel(null);};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p)return;setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(true);setPanel(null);};
 const toggle=(id:SystemId)=>{setDetails(false);setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setDetails(false);setPanel(null);};
 const openPanel=(next:'layers'|'search')=>{setDetails(false);setPanel(p=>p===next?null:next);};

 // Sorotan dari Mode Belajar: tampilkan hanya sistem terkait, lalu pilih organnya.
 useEffect(()=>{
  if(!atlas||!sorotan)return;
  if(sorotan.sistem){
   const sistem=sorotan.sistem as SystemId[];
   setState(s=>({...s,visible:sistem,selected:[],isolate:false,explode:0,rotate:false,reset:s.reset+1}));
  }
  if(sorotan.organ){
   const nama=sorotan.organ.toLowerCase();
   const c=atlas.concepts.find(x=>x.name.toLowerCase()===nama)
    ??atlas.concepts.find(x=>x.name.toLowerCase().startsWith(nama))
    ??atlas.concepts.find(x=>x.name.toLowerCase().includes(nama));
   if(c){setChosen(c);setState(s=>({...s,selected:c.elements}));setDetails(true);}
  }
 },[atlas,sorotan?.organ,sorotan?.sistem?.join(',')]);

 /** Terjemahan Indonesia untuk struktur terpilih. */
 const terjemahan=useMemo(()=>{
  if(!chosen)return null;
  const id=keIndonesia(chosen.name);
  return{id,kata:istilahDalam(chosen.name),organ:organByName(chosen.name),sama:id.trim().toLowerCase()===chosen.name.trim().toLowerCase()};
 },[chosen]);

 // Kanvas bisa kosong tanpa penjelasan: setiap sistem dimatikan, atau mode isolasi
 // aktif tanpa bagian terpilih. Keduanya dulu hanya menampilkan latar kosong.
 const nothingVisible=!!atlas&&!state.isolate&&state.visible.length===0;

 return <section className="studio" aria-label="Penjelajah anatomi 3D">
  {atlas&&<AnatomyScene atlas={atlas} state={{...state,inspectorOpen:details&&selectedParts.length>0}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError}/>}
  <div className="vignette"/>
  <header className="identity"><div className="eyebrow"><span className="status-dot"/> ATLAS ANATOMI INTERAKTIF</div><h1>JRH Atlas<Badge variant="outline" className="edition">3D</Badge></h1><div className="identity-meta">{atlas?atlas.parts.length.toLocaleString('id-ID'):'2.234'} bagian tubuh <span>·</span> BodyParts3D</div></header>
  <nav className="top-actions" aria-label="Panel penjelajah"><Button variant="ghost" className={panel==='search'?'active':''} onClick={()=>openPanel('search')} aria-label="Cari struktur anatomi"><Search size={18}/><span>Cari struktur</span><kbd>/</kbd></Button><Button variant="ghost" className="icon-button" aria-label="Tentang atlas ini" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}><Info size={18}/></Button></nav>
  <section className={`layers-panel glass ${panel==='layers'?'mobile-open':''}`} aria-label="Lapisan anatomi">
   <div className="panel-heading"><span>Sistem organ</span><Button variant="ghost" className="mobile-only icon-button" onClick={()=>setPanel(null)} aria-label="Tutup sistem"><X size={18}/></Button><Badge variant="secondary" className="desktop-only small-number">{activeSystems.length}</Badge></div>
   <div className="layer-presets"><Button variant="ghost" aria-pressed={activeSystems.every(x=>state.visible.includes(x.id))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:activeSystems.map(x=>x.id)}))}>Semua</Button><Button variant="ghost" aria-pressed={state.visible.length===1&&state.visible[0]==='skeletal'} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['skeletal']}))}>Tulang</Button><Button variant="ghost" aria-pressed={state.visible.length===6&&['cardiac','respiratory','digestive','urinary','endocrine','reproductive'].every(id=>state.visible.includes(id as SystemId))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']}))}>Organ</Button></div>
   <div className="system-list">{activeSystems.map(s=><div className={`system-row ${state.visible.includes(s.id)?'enabled':''}`} key={s.id}><Button variant="ghost" className="system-name" title={`Tampilkan hanya ${s.name.toLowerCase()}`} onClick={()=>setState(v=>({...v,visible:[s.id],isolate:false,selected:[]}))}><span className="system-dot" style={{background:s.color}}/>{s.name}<span className="system-count">{counts[s.id]}</span></Button><Switch checked={state.visible.includes(s.id)} onCheckedChange={()=>toggle(s.id)} aria-label={`Tampilkan ${s.name.toLowerCase()}`}/></div>)}</div>
   <div className="panel-foot"><span>{visibleCount.toLocaleString('id-ID')} bagian terlihat</span><Button variant="ghost" onClick={()=>setState(s=>({...s,visible:[],selected:[],isolate:false}))}>Sembunyikan semua</Button></div>
  </section>
  {panel==='search'&&<section className="search-panel glass" aria-label="Cari anatomi"><div className="panel-heading"><span>Cari struktur</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label="Tutup pencarian"><X size={18}/></Button></div><Combobox<Concept> items={results} value={null} onValueChange={value=>{if(value)choose(value);}} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={c=>c.name} filter={null} open onOpenChange={open=>{if(!open)setPanel(null);}}><ComboboxInput autoFocus placeholder="Jantung, tulang paha, saraf…" aria-label="Cari struktur anatomi berdasarkan nama" showTrigger={false}/><ComboboxContent className="anatomy-search-results"><ComboboxEmpty>Tidak ada struktur yang cocok.</ComboboxEmpty><ComboboxList>{(c:Concept)=><ComboboxItem key={c.id} value={c}><span className="search-result-name">{c.name}</span>{keIndonesia(c.name)!==c.name&&<small className="search-result-id">{keIndonesia(c.name)}</small>}<span className="small-number">{c.elements.length} bagian</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox><p className="search-note">{query?'Menampilkan maksimal 80 hasil. Persempit pencarian untuk struktur kecil.':'Coba kata Indonesia (jantung, ginjal) atau nama ilmiahnya.'}</p></section>}
  <nav className="view-controls glass" aria-label="Kontrol kamera">{(['three-quarter','front','side','back'] as View[]).map((v,i)=><Button variant="ghost" key={v} className={state.view===v?'active':''} aria-pressed={state.view===v} disabled={state.explode>.8&&v!=='front'} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))} title={['Tampak serong','Tampak depan','Tampak samping','Tampak belakang'][i]} aria-label={['Tampak serong','Tampak depan','Tampak samping','Tampak belakang'][i]}><span>{['¾','F','S','B'][i]}</span></Button>)}<i/><Button variant="ghost" disabled={state.explode>=.4} aria-label={state.rotate?'Hentikan rotasi':'Putar otomatis'} title="Putar otomatis" className={state.rotate?'active':''} onClick={()=>setState(s=>({...s,rotate:!s.rotate}))}>{state.rotate?<Pause size={17}/>:<RotateCw size={18}/>}</Button><Button variant="ghost" aria-label="Atur ulang tampilan" title="Atur ulang" onClick={reset}><RotateCcw size={17}/></Button></nav>
  <div className="scene-caption"><span className="caption-line"/><span>{state.isolate?(chosen?keIndonesia(chosen.name).toUpperCase():'STRUKTUR TERPILIH'):state.explode>.95?'INVENTARIS ANATOMI':state.explode>.05?'STRUKTUR TERPISAH':'MANUSIA DEWASA · LAKI-LAKI'}</span><span className="caption-line"/></div>
  <div className="bottom-dock glass"><Button variant="ghost" className="mobile-only dock-layers" onClick={()=>openPanel('layers')} aria-label="Buka lapisan sistem"><Layers3 size={20}/><span>Sistem</span></Button><div className="explode-control"><div className="explode-label"><label id="explode-label">Pisahkan anatomi</label><output>{Math.round(state.explode*100)}<span>%</span></output></div><Slider aria-labelledby="explode-label" min={0} max={100} step={1} value={[state.explode*100]} onValueChange={v=>setState(s=>({...s,explode:(Array.isArray(v)?v[0]:v)/100,view:(Array.isArray(v)?v[0]:v)>80?'front':s.view,rotate:false}))}/><div className="slider-endpoints"><span>Utuh</span><span>Semua bagian</span></div></div><Button variant="ghost" className="dock-reset" onClick={reset} aria-label="Satukan dan atur ulang"><RotateCcw size={18}/><span>Atur ulang</span></Button></div>
  <footer className="studio-footer"><span>Geser untuk memutar <b>·</b> Cubit untuk zoom <b>·</b> Ketuk untuk memeriksa</span><Button variant="ghost" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}>Sumber & kredit <ArrowUpRight size={12}/></Button></footer>
  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Menyiapkan anatomi</strong><span>{progress}% · Memuat {atlas?.parts.length.toLocaleString('id-ID')??'2.234'} bagian</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {nothingVisible&&<div className="loading glass empty-state" role="status"><div><strong>Tidak ada sistem yang ditampilkan</strong><span>Pilih minimal satu sistem organ di panel, atau tampilkan kembali susunan awal.</span></div><Button variant="ghost" onClick={()=>setState(s=>({...s,visible:DEFAULT_VISIBLE,selected:[],isolate:false}))}>Tampilkan susunan awal</Button></div>}
  {error&&<div className="loading glass error" role="alert"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Muat ulang</Button></div>}
  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}><div className="detail-header"><div className="detail-accent" style={{background:system?.color}}/><div className="eyebrow">{system?.name??'ANATOMI'}</div><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{(chosen&&keIndonesia(chosen.name))??''}</SheetTitle>{chosen&&terjemahan&&!terjemahan.sama&&<p className="structure-alias">Nama atlas: {chosen.name}</p>}</div><div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}><SheetDescription className="structure-description">{chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription>
   {terjemahan?.organ&&<div className="id-card"><div className="id-card-head"><BookOpen size={14}/><strong>{terjemahan.organ.id}</strong><span>jenjang {terjemahan.organ.jenjang.toUpperCase()}</span></div><p>{terjemahan.organ.inti}</p><p className="id-fungsi">{terjemahan.organ.fungsi}</p><ul>{terjemahan.organ.fakta.map(f=><li key={f}>{f}</li>)}</ul>{terjemahan.organ.mitos&&<p className="id-mitos"><b>Mitos vs Fakta:</b> {terjemahan.organ.mitos}</p>}</div>}
   {chosen&&!EXPLANATIONS[chosen.name.toLowerCase()]&&<span className="context-note">Ringkasan sistem · struktur dikenali dari data sumber</span>}
   {terjemahan&&terjemahan.kata.length>0&&!terjemahan.organ&&<div className="istilah-chips"><span className="eyebrow">Istilah Indonesia</span>{terjemahan.kata.slice(0,6).map(k=><span className="istilah-chip" key={k}>{k}</span>)}</div>}
   <div className="structure-meta"><span>Rujukan atlas<strong>{chosen?.id}</strong></span><span>Bagian terpilih<strong>{state.selected.length.toLocaleString('id-ID')}</strong></span></div>
   {selectedParts.length>1&&<div className="member-list"><h3>Struktur yang termasuk</h3>{selectedParts.slice(0,50).map(p=><Button variant="ghost" key={p.id} onClick={()=>choosePart(p.id)}><span>{keIndonesia(p.name)}</span><ChevronRight size={14}/></Button>)}{selectedParts.length>50&&<p>Dan {selectedParts.length-50} bagian lain.</p>}</div>}
   <a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">Lihat sumber anatomi <ArrowUpRight size={14}/></a></div><div className="detail-actions"><Button className={`primary-action ${state.isolate?'active':''}`} onClick={()=>setState(s=>({...s,isolate:!s.isolate,explode:0}))}><Focus size={18}/>{state.isolate?'Tampilkan anatomi sekitar':'Isolasi struktur'}<ChevronRight size={16}/></Button><Button variant="ghost" className="secondary-action" onClick={()=>{setState(s=>({...s,selected:[],isolate:false}));setDetails(false);}}>Hapus pilihan</Button></div></SheetContent></Sheet>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet glass"><div className="eyebrow">SUMBER & CAKUPAN</div><SheetTitle className="structure-title">Tentang JRH Atlas</SheetTitle><SheetDescription>Jelajahi anatomi rujukan laki-laki dewasa dari BodyParts3D.</SheetDescription><div className="about-copy"><p><strong>Laki-laki · BodyParts3D</strong><br/>2.234 mesh terpisah dan 3.432 konsep bernama dari anatomi rujukan laki-laki dewasa.</p><p>Rujukan ini tidak memuat semua struktur atau variasi tubuh manusia. Satu konsep bernama bisa terdiri dari beberapa bagian; setiap mesh sumber ditampilkan sekali.</p><p>Warna dan pengelompokan sistem dirancang untuk penjelajahan. Geometri disederhanakan untuk web, dan penjelasan singkat memberi konteks edukatif. Ini rujukan anatomi, bukan alat diagnosis atau bedah.</p><h3>Sumber</h3><p>BodyParts3D, © The Database Center for Life Science, lisensi CC Attribution 4.0 International.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Lisensi dataset <ArrowUpRight size={14}/></a><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Geometri & metadata asli <ArrowUpRight size={14}/></a><a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">Baca publikasi sumber <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
 </section>;
}
