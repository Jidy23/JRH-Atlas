import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium}=require('playwright');
const {default:AxeBuilder}=require('@axe-core/playwright');
await mkdir('ui-evidence',{recursive:true});
const browser=await chromium.launch();
const reports=[];
const MODES=['Terang','Gelap'];
const PALETTES=['Nusantara','Samudra','Senja','Zamrud','Koral'];
// Lima halaman edukasi; jelajah (viewer 3D) ditangani workflow lazy loading.
const TABS=[['belajar','Belajar'],['kuis','Kuis'],['flashcard','Flashcard'],['glosarium','Glosarium'],['panduan','Panduan']];
// Simpan detail pelanggaran supaya kegagalan bisa didiagnosis tanpa membuka log mentah.
const ringkas=violations=>violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}));
try {
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:'light'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const trigger=page.getByRole('button',{name:'Atur tampilan dan warna',exact:true});
  const dialog=page.getByRole('dialog',{name:'Pengaturan tampilan'});
  const pageHeading=label=>page.getByRole('heading',{name:label,exact:true,level:1});
  for(const [tab,label] of TABS){
   await page.goto(`http://localhost:3016/?tab=${tab}`,{waitUntil:'networkidle'});
   await pageHeading(label).waitFor();
   for(const mode of MODES){
    for(const palette of PALETTES){
     await trigger.click();
     await page.waitForFunction(()=>document.activeElement===document.querySelector('.tema-mode button'));
     await dialog.getByRole('button',{name:mode,exact:true}).click();
     await dialog.getByRole('button',{name:new RegExp('^'+palette)}).click();
     assert.equal(await page.locator('html').getAttribute('data-tema'),mode.toLowerCase());
     assert.equal(await page.locator('html').getAttribute('data-palet'),palette.toLowerCase());
     await page.keyboard.press('Escape');
     assert.equal(await dialog.count(),0,'Escape menutup panel tema');
     assert.ok(await trigger.evaluate(e=>e===document.activeElement),'Escape mengembalikan fokus');
     await page.waitForTimeout(200);
     const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
     const report={width,tab,mode,palette,violations:ringkas(result.violations),errors:[...errors]};
     reports.push(report);
     assert.equal(await pageHeading(label).count(),1,'Halaman tetap utuh setelah ganti tema');
     assert.equal(new URL(page.url()).searchParams.get('tab'),tab,'Ganti tema tidak boleh bernavigasi');
     assert.deepEqual(errors,[],`${width}/${tab}/${mode}/${palette}: galat runtime`);
     console.log(JSON.stringify({width,tab,mode,palette,violations:result.violations.length}));
     if(result.violations.length)console.error(JSON.stringify(ringkas(result.violations),null,2));
    }
   }
  }
  // Palet adalah satu pilihan tersimpan, jadi persistensi diverifikasi sekali per lebar.
  await page.goto('http://localhost:3016/?tab=belajar',{waitUntil:'networkidle'});
  await trigger.click();
  await dialog.getByRole('button',{name:'Auto',exact:true}).click();
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>document.documentElement.dataset.tema==='gelap');
  assert.equal(await page.locator('html').getAttribute('data-palet'),'koral');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>document.documentElement.dataset.tema==='terang');
  await dialog.getByRole('button',{name:'Gelap',exact:true}).click();
  await page.emulateMedia({colorScheme:'dark'});
  await page.emulateMedia({colorScheme:'light'});
  assert.equal(await page.locator('html').getAttribute('data-tema'),'gelap','Mode eksplisit mengabaikan perubahan sistem');
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(),0);
  assert.ok(await trigger.evaluate(e=>e===document.activeElement),'Escape mengembalikan fokus');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('data-tema'),'gelap');
  assert.equal(await page.locator('html').getAttribute('data-palet'),'koral');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`ui-evidence/${width}-theme-persistence.png`,fullPage:true});
  await context.close();
 }
 // 2 lebar x 5 halaman x 2 mode x 5 palet.
 assert.equal(reports.length,100,`Mengharapkan 100 state tema, mendapat ${reports.length}`);
 const gagal=reports.filter(r=>r.violations.length||r.errors.length);
 if(gagal.length)console.error(JSON.stringify(gagal,null,2));
 assert.equal(gagal.length,0,'Pelanggaran aksesibilitas tema; lihat theme-report.json');
 console.log('100 state tema: nol pelanggaran axe WCAG, nol galat runtime.');
} finally {
 await writeFile('ui-evidence/theme-report.json',JSON.stringify(reports,null,2));
 await browser.close();
}
