export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Tulang',color:'#e2d9ba',description:'Tulang membentuk kerangka penopang tubuh, melindungi organ, dan menjadi tempat melekatnya otot. Jaringan di dalamnya juga menyimpan mineral dan memproduksi sel darah.'},
 {id:'muscular',name:'Otot',color:'#a85b50',description:'Otot rangka menghasilkan gerakan dengan menarik tulang tempat ia melekat. Bersama tendon, otot menggerakkan sendi, menjaga postur, dan menghasilkan panas.'},
 {id:'cardiac',name:'Jantung',color:'#b96760',description:'Jantung adalah pompa berotot dengan empat bilik. Katup-katupnya mengarahkan darah melewati sirkuit paru dan sirkuit sistemik.'},
 {id:'sensory',name:'Organ indera',color:'#b08cce',description:'Struktur ini menunjang indera khusus, termasuk penglihatan, pendengaran, dan keseimbangan. Jaringannya menangkap rangsangan lalu bekerja dengan sistem saraf untuk meneruskan informasi.'},
 {id:'arterial',name:'Arteri',color:'#c05245',description:'Jantung mendorong darah melalui sirkulasi. Arteri membawa darah menjauh dari jantung untuk memasok jaringan atau, pada sirkuit paru, menuju paru-paru.'},
 {id:'venous',name:'Vena',color:'#527c9f',description:'Vena mengembalikan darah ke jantung. Jaringan superfisial dan dalam mengumpulkan darah dari jaringan; vena pulmonalis membawa darah beroksigen kembali dari paru-paru.'},
 {id:'nervous',name:'Sistem saraf',color:'#d8b565',description:'Otak, sumsum tulang belakang, dan saraf tepi membawa serta mengolah sinyal. Sistem ini menopang sensasi, gerakan, dan fungsi otonom.'},
 {id:'digestive',name:'Pencernaan',color:'#c98a5b',description:'Saluran pencernaan memecah makanan menjadi molekul yang bisa diserap, mulai dari mulut hingga usus besar. Organ aksesori menambah enzim dan menyimpan nutrisi.'},
 {id:'respiratory',name:'Pernapasan',color:'#7fa8c9',description:'Saluran napas membawa udara masuk dan keluar paru-paru, tempat oksigen ditukar dengan karbon dioksida. Saluran ini juga terlibat dalam produksi suara.'},
 {id:'urinary',name:'Urinaria',color:'#7fb39c',description:'Ginjal menyaring darah untuk membentuk urine, lalu saluran kemih menampung dan mengeluarkannya. Sistem ini menjaga keseimbangan cairan dan elektrolit.'},
 {id:'reproductive',name:'Reproduksi',color:'#c4839f',description:'Organ reproduksi menghasilkan sel kelamin dan hormon yang mengatur perkembangan serta kesuburan.'},
 {id:'lymphatic',name:'Limfatik',color:'#9bb578',description:'Pembuluh limfa dan organ limfoid mengembalikan cairan jaringan, mengangkut sel darah putih, dan berperan dalam respons imun.'},
 {id:'endocrine',name:'Endokrin',color:'#c9a54e',description:'Kelenjar endokrin melepaskan hormon ke darah untuk mengatur pertumbuhan, metabolisme, dan keseimbangan tubuh.'},
 {id:'integumentary',name:'Kulit',color:'#d9b49a',description:'Kulit adalah lapisan pelindung terluar tubuh. Kulit membantu menahan patogen, mengatur suhu, dan menampung reseptor sentuhan.'},
 {id:'connective',name:'Jaringan ikat',color:'#b9b3c8',description:'Jaringan ikat menghubungkan, menopang, dan membungkus struktur lain. Termasuk di dalamnya tendon, ligamen, dan fasia.'},
];

/** Nama panel samping. Bedakan dengan `name` yang dipakai di kartu edukasi. */
export const PANEL_NAME: Record<SystemId,string> = {
 skeletal:'Kerangka', muscular:'Otot', cardiac:'Jantung', sensory:'Organ indera',
 arterial:'Arteri', venous:'Vena', nervous:'Sistem saraf', digestive:'Pencernaan',
 respiratory:'Pernapasan', urinary:'Urinaria', reproductive:'Reproduksi',
 lymphatic:'Limfatik', endocrine:'Endokrin', integumentary:'Kulit', connective:'Jaringan ikat',
};

const namaSistem = (id: SystemId) => SYSTEMS.find(s => s.id === id)?.name ?? id;

export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[[number,number,number],[number,number,number]];}
export interface Concept {id:string;name:string;elements:string[];}
export interface Chunk {url:string;gzip?:string;bytes:number;}
export interface Atlas {version:string;parts:Part[];concepts:Concept[];chunks:Chunk[];}

/**
 * Sudut pandang yang bisa dicapai. `back` sengaja tidak ada: kamera dibatasi
 * ±90° pada sumbu mendatar, jadi 180° (tampak belakang) mustahil dicapai tanpa
 * melanggar batas itu. Lihat catatan di scene.tsx.
 */
export type View = 'front'|'side'|'three-quarter';

/**
 * `rotate` sudah dihapus: model tidak lagi berputar sendiri. Rotasi otomatis
 * adalah sumber utama keluhan "diputer-putar", dan satu-satunya cara mematikannya
 * dengan jujur adalah menghapus kontrolnya, bukan menyembunyikannya.
 */
export interface SceneState {explode:number;visible:string[];selected:string[];isolate:boolean;view:View;reset:number;inspectorOpen:boolean;}
export const DEFAULT_VISIBLE = ['skeletal','muscular','cardiac','sensory','digestive','respiratory','urinary'];

/** Penjelasan singkat per struktur, untuk panel detail. */
export const EXPLANATIONS: Record<string,string> = {
 'heart':'Jantung adalah pompa berotot berbilik empat yang mendorong darah ke seluruh tubuh. Bilik kiri memompa darah beroksigen ke seluruh tubuh, sedangkan bilik kanan mengirim darah ke paru-paru.',
 'lung':'Paru-paru adalah organ berpasangan tempat pertukaran gas. Di dalam alveolus, oksigen masuk ke darah dan karbon dioksida dikeluarkan.',
 'brain':'Otak mengolah informasi dari indera, mengatur gerakan, menyimpan ingatan, dan mengendalikan fungsi tubuh yang tidak kita sadari.',
 'liver':'Hati menetralkan zat berbahaya, menyimpan glikogen dan vitamin, serta menghasilkan empedu untuk mencerna lemak.',
 'stomach':'Lambung adalah kantung berotot yang mengaduk makanan dengan asam lambung dan enzim untuk memulai pencernaan protein.',
 'kidney':'Ginjal menyaring darah, membuang sisa metabolisme lewat urine, dan menjaga keseimbangan air serta garam tubuh.',
 'spleen':'Limpa menyaring darah, membuang sel darah merah tua, dan berperan dalam pertahanan imun tubuh.',
 'pancreas':'Pankreas memiliki peran ganda: menghasilkan enzim pencernaan dan hormon insulin serta glukagon.',
 'bladder':'Kandung kemih adalah kantung berotot di panggul yang menampung urine dari ginjal melalui ureter.',
 'trachea':'Trakea adalah saluran udara utama dari laring menuju bronkus. Tulang rawannya menjaga saluran tetap terbuka saat bernapas.',
 'diaphragm':'Diafragma adalah otot lebar yang memisahkan rongga dada dan perut. Saat berkontraksi, ia memperbesar volume dada dan menarik udara ke paru-paru.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}
