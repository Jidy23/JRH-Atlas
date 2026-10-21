import {createRequire} from 'node:module';
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium}=require('playwright');
await mkdir('ui-evidence',{recursive:true});
const assets=await readdir('dist/assets');
const sizes=[];
for(const name of assets.filter(n=>n.endsWith('.js'))){const bytes=await readFile('dist/assets/'+name);sizes.push({name,bytes:bytes.length,gzip:gzipSync(bytes).length});}
console.log('Production JavaScript chunks',JSON.stringify(sizes));
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={sizes,states:[]};
try {
 const context=await browser.newContext({viewport:{width:390,height:900}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const scripts=new Set();const models=[];
 page.on('request',r=>{if(r.resourceType()==='script')scripts.add(new URL(r.url()).pathname);if(r.url().includes('/models/'))models.push(r.url());});
 await page.goto('http://localhost:3016/belajar?jenjang=smp',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Belajar',exact:true}).waitFor();
 assert.equal(models.length,0,'Learning route must not fetch anatomy models');
 const initialScripts=[...scripts];
 const initialBytes=initialScripts.reduce((sum,p)=>sum+(sizes.find(s=>p.endsWith('/'+s.name))?.bytes??0),0);
 assert.ok(initialBytes>0&&initialBytes<500000,`Initial JavaScript exceeds 500 kB: ${initialBytes}`);
 const nav=page.getByRole('navigation',{name:'Navigasi utama'});
 await nav.getByRole('link',{name:'Glosarium',exact:true}).click();
 await page.getByRole('heading',{name:'Glosarium',exact:true}).waitFor();
 assert.equal(models.length,0);
 assert.equal(scripts.size,initialScripts.length,'Non-3D navigation must not load viewer');
 await page.goBack();
 await page.getByRole('heading',{name:'Belajar',exact:true}).waitFor();
 assert.equal(new URL(page.url()).searchParams.get('jenjang'),'smp');
 await nav.getByRole('link',{name:'Jelajah 3D',exact:true}).click();
 await page.getByRole('button',{name:'Cari struktur anatomi',exact:true}).waitFor();
 await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/models/atlas.json')));
 assert.ok(scripts.size>initialScripts.length,'Viewer chunk must load on demand');
 // three.js paints its own canvas, so CSS cannot reach the 3D background. If the
 // viewer hardcodes a light clear colour, dark mode leaves a bright rectangle in
 // the middle of the dark UI. Assert the canvas actually follows the theme.
 //
 // This test used to toggle `data-theme` / `data-palette` — English attribute
 // names that nothing in the app ever writes. app/tema.ts writes `data-tema`
 // and `data-palet`. So the test was driving an attribute the viewer ignored,
 // and it only passed because scene.tsx happened to read the same wrong name.
 // Both sides agreed on a name the product never used, which is why this
 // regression survived a green CI. The assertions now use the real names and
 // also check that the palette attribute survives a mode switch.
 await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.sceneTheme);
 const themeSync=async(expected)=>{
  await page.evaluate((mode)=>{document.documentElement.dataset.tema=mode;},expected);
  await page.waitForFunction((mode)=>document.querySelector('.scene')?.dataset.sceneTheme===mode,expected);
  assert.equal(await page.locator('html').getAttribute('data-tema'),expected);
  assert.ok(await page.locator('html').getAttribute('data-palet'),'palette attribute must stay present after a mode switch');
 };
 await themeSync('gelap');
 await themeSync('terang');
 report.canvasFollowsTheme=true;
 await page.goBack();
 await page.getByRole('heading',{name:'Belajar',exact:true}).waitFor();
 report.states.push({initialScripts,initialBytes,viewerScripts:[...scripts].filter(p=>!initialScripts.includes(p)),errors});
 assert.deepEqual(errors,[]);
 await context.close();
 // A failed chunk must show a recoverable alert, not erase navigation.
 const failed=await browser.newContext();const failurePage=await failed.newPage();
 await failurePage.route('**/assets/*.js',route=>new URL(route.request().url()).pathname.split('/').pop().startsWith('page-')?route.abort():route.continue());
 await failurePage.goto('http://localhost:3016/jelajah',{waitUntil:'networkidle'});
 await failurePage.getByRole('alert').filter({hasText:'Penjelajah 3D tidak dapat dimuat'}).waitFor();
 await failurePage.getByRole('navigation',{name:'Navigasi utama'}).getByRole('link',{name:'Belajar',exact:true}).click();
 await failurePage.getByRole('heading',{name:'Belajar',exact:true}).waitFor();
 report.chunkFailureRecovery=true;
 await failed.close();
} finally {
 await writeFile('ui-evidence/lazy-report.json',JSON.stringify(report,null,2));
 await browser.close();
}
