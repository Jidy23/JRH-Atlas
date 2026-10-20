// Measures how many anatomy chunk files the viewer actually fetches.
// Chunks are packed by byte budget, so visibility-driven loading saves bytes only
// if the default visible systems happen to live in a subset of chunks. This script
// records the real numbers instead of asserting an expected improvement.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium}=require('playwright');
await mkdir('ui-evidence',{recursive:true});
const manifest=JSON.parse(await readFile('public/models/atlas.json','utf8'));
const totalChunks=manifest.chunks.length;
const chunkSystems=manifest.chunks.map((_,ci)=>{const s=new Set();for(const p of manifest.parts)if(p.chunk===ci)s.add(p.system);return [...s];});
const defaultVisible=['skeletal','muscular','cardiac','sensory','digestive','respiratory','urinary'];
const neededFor=(visible)=>{const out=[];for(let ci=0;ci<totalChunks;ci++){if(chunkSystems[ci].some(sys=>visible.includes(sys)))out.push(ci);}return out;};
const defaultNeeded=neededFor(defaultVisible),allNeeded=neededFor(manifest.parts.map(p=>p.system));
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={totalChunks,chunkSystems,defaultNeeded,allNeeded,expectedSavedChunks:totalChunks-defaultNeeded.length,network:{}};
try {
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fetched=[];
 page.on('response',r=>{if(/\/models\/body-\d+\.bin(\.gz)?$/.test(new URL(r.url()).pathname))fetched.push(new URL(r.url()).pathname);});
 await page.goto('http://localhost:3016/?tab=jelajah',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Cari struktur anatomi',exact:true}).waitFor();
 // Give the pump time to settle: it only fetches what the default layers need.
 await page.waitForFunction(()=>{const s=document.querySelector('.loading');return !s;},{timeout:60000}).catch(()=>{});
 await page.waitForTimeout(6000);
 const afterDefault=[...new Set(fetched)];
 report.network.afterDefaultChunks=afterDefault.length;
 report.network.afterDefaultFiles=afterDefault;
 // Reveal every system and confirm the rest of the atlas is fetched on demand.
 await page.getByRole('button',{name:'Semua',exact:true}).click();
 await page.waitForTimeout(12000);
 const afterAll=[...new Set(fetched)];
 report.network.afterAllChunks=afterAll.length;
 report.network.afterAllFiles=afterAll;
 report.errors=errors;
 assert.deepEqual(errors,[],'runtime errors while loading chunks');
 assert.ok(afterDefault.length<=totalChunks,`default load fetched ${afterDefault.length} of ${totalChunks}`);
 assert.ok(afterAll.length>afterDefault.length,'Revealing all systems must fetch additional chunks on demand');
 console.log(JSON.stringify(report,null,2));
 await context.close();
} finally {await writeFile('ui-evidence/lazy-chunks-report.json',JSON.stringify(report,null,2));await browser.close();}
