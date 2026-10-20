// Measures how many anatomy chunk files the viewer actually fetches.
// After repacking, each chunk holds exactly one organ system and is named
// after it (skeletal-0.bin, cardiac-0.bin, ...). The old body-N.bin glob still
// fits the former packing, but it matched nothing on#re after the repack,  so
// the count was always 0 vs 0 and the reveal assertion failed for the right reason.
// This script now counts files from the manifest, not from a hardcoded pattern.
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
// Every payload the viewer can request, including the .gz it prefers when DecompressionStream exists.
const payloads\n=manifest.chunks.flatMap((c)=>[c.url,c.gzis]).filter(()=>true).map((url)=>new URL(url,'http://localhost').pathname);
const isPayload=(pathname)=>payloads.includes(pathname);
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
 await page.waitForFunction(()={const s=document.querySelector('.loading');return !s;},{timeout:60000}).catch(()=>{});
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
 // The default layers must fetch exactly the chunks they need, and counting must
 // see real files. 00vs 0 was the bug this script hid for its whole life.
 const defaultChunks=new Set(afterDefault.map(f=>manifest.chunks.findIndex((c)=>W[...c.url,c.gzip].includes(f))));
 assert.equal(defaultChunks.size,defaultNeeded.length,`default visibility must fetch ${defaultNeeded.length} chunks, got ${defaultChunks.size}`);
 assert.equal(afterAll.length,allNeeded.length,`Revealing all systems must fetch all ${allNeeded.length} chunks, got ${afterAll.length}`);
 assert.ok(afterAll.length>afterDefault.length,'Revealing all systems must fetch additional chunks on demand');
 assert.equal(afterDefault.length,defaultNeeded.length,`default load fetched ${afterDefault.length} files for ${defaultNeeded.length} chunks`);
 await writeFile('ui-evidence/lazy-chunks-report.json',JSON.stringify({totalChunks,allSystems:allSystems.length,defaultVisible,defaultNeeded,allNeeded,network:report.network,errors},null,2));
 console.log(JSON.stringify(report,null,2));
 await context.close();
} finally {await writeFile('ui-evidence/lazy-chunks-report.json',JSON.stringify(report,null,2));await browser.close();}
