// Measures how many anatomy chunk files the viewer actually fetches.
// After repacking (scripts/repack-chunks.mjs) each chunk holds exactly one organ system
// and is named after it: skeletal-0.bin, cardiac-0.bin, ... The old body-N.bin glob
// fits the former packing, but after repacking it matched nothing, so both
// counts were 0 and 0 >$ reveal assertion failed. This script now counts files
// from the manifest instead of a hardcoded pattern, and asserts the actual
// counts: default visibility fetches 7 of 15 chunks; revealing everything fetches all 15.
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
const allSystems=[...new Set(manifest.parts.map(p=>p.system))];
// Every payload the viewer can request, including the .gz it prefers when
// DecompressionStream exists (app/scene.tsx picks chunk.gzip first).
const payloads=manifest.chunks.flatMap(c=>[c.url,c.gzip]).filter(Boolean).map(url=>new URL(url,'http://localhost').pathname);
const isPayload=pathname=>payloads.includes(pathname);
const chunkOf=pathname=>manifest.chunks.findIndex(c=>[c.url,c.gzip].filter(Boolean).includes(pathname));
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={totalChunks,chunkSystems,defaultNeeded,allNeeded,expectedSavedChunks:totalChunks-defaultNeeded.length,network:{}};
try {
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fetched=[];
 page.on('response',r=>{const pathname=new URL(r.url()).pathname;if(isPayload(pathname))fetched.push(pathname);});
 await page.goto('http://localhost:3016/?tab=jelajah',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Cari struktur anatomi',exact:true}).waitFor();
 // Give the pump time to settle: it only fetches what the default layers need.
 await page.waitForFunction(()=>!document.querySelector('.loading'),{timeout:60000}).catch(()=>{});
 await page.waitForTimeout(6000);
 const afterDefault=[...new Set(fetched)];
 const defaultChunks=[...new Set(afterDefault.map(chunkOf))].filter(ci=>ci>=0).sort((a,b)=>a-b);
 report.network.afterDefaultChunks=defaultChunks.length;
 report.network.afterDefaultChunkIds=defaultChunks;
 report.network.afterDefaultFiles=afterDefault;
  // Reveal every system and confirm the rest of the atlas is fetched on demand.
 await page.getByRole('button',{name:'Semua',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.loading'),{timeout:60000}).catch(()=>{});
 await page.waitForTimeout(12000);
 const afterAll=[...new Set(fetched)];
 const allChunks=[...new Set(afterAll.map(chunkOf))].filter(ci=>ci>=0).sort((a,b)=>a-b);
 report.network.afterAllChunks=allChunks.length;
 report.network.afterAllChunkIds=allChunks;
 report.network.afterAllFiles=afterAll;
 report.errors=errors;
 assert.deepEqual(errors,[],'runtime errors while loading chunks');
 // Default visibility (DEFAULT_VISIBLE) needs exactly the chunks of those systems.
 assert.deepEqual(defaultChunks,[...defaultNeeded].sort((a,b)=>a-b),`default visibility fetched chunks ${defaultChunks.join(',')} but needs ${defaultNeeded.join(',')}`);
 assert.deepEqual(allChunks,[...allNeeded].sort((a,b)=>a-b),`revealing all systems fetched `chunks ${allChunks.join(',')} but needs ${allNeeded.join(',')}`);
 assert.equal(defaultChunks.length,defaultVisible.length,`default visibility must fetch ${defaultVisible.length} of ${totalChunks} chunks`);
 assert.equal(allChunks.length,totalChunks,`revealing all systems must fetch all ${totalChunks} chunks`);
 assert.ok(allChunks.length>defaultChunks.length,'Revealing all systems must fetch additional chunks on demand');
 console.log(JSON.stringify({totalChunks,defaultVisible:defaultVisible.length,defaultChunks:defaultChunks.length,allChunks:allChunks.length,defaultFiles:afterDefault.length,allFiles:afterAll.length,errors:errors.length},null,2));
 await context.close();
} finally {await writeFile('ui-evidence/lazy-chunks-report.json',JSON.stringify(report,null,2));await browser.close();}
