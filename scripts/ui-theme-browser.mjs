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
// The five educational pages; jelajah (3D viewer) is covered by the lazy-loading workflow.
const TABS=[['belajar','Belajar'],['kuis','Kuis'],['flashcard','Flashcard'],['glosarium','Glosarium'],['panduan','Panduan']];
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
     assert.equal(await dialog.count(),0,'Escape closes the theme panel');
     assert.ok(await trigger.evaluate(e=>e===document.activeElement),'Escape restores focus');
     await page.waitForTimeout(200);
     const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
     const report={width,tab,mode,palette,violations:result.violations,errors:[...errors]};reports.push(report);
     assert.equal(result.violations.length,0,`${width}/${tab}/${mode}/${palette}: axe violations`);
     assert.equal(await pageHeading(label).count(),1,'Page survives theme changes');
     assert.equal(new URL(page.url()).searchParams.get('tab'),tab,'Theme change must not navigate');
     assert.deepEqual(errors,[],`${width}/${tab}/${mode}/${palette}: runtime errors`);
     console.log(JSON.stringify({width,tab,mode,palette,violations:0}));
    }
   }
  }
  // The palette is a single persisted choice, so persistence is verified once per width.
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
  assert.equal(await page.locator('html').getAttribute('data-tema'),'gelap','Explicit mode ignores system changes');
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(),0);
  assert.ok(await trigger.evaluate(e=>e===document.activeElement),'Escape restores focus');
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('data-tema'),'gelap');
  assert.equal(await page.locator('html').getAttribute('data-palet'),'koral');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`ui-evidence/${width}-theme-persistence.png`,fullPage:true});
  await context.close();
 }
 // 2 widths x 5 pages x 2 modes x 5 palettes.
 assert.equal(reports.length,100);
 assert.equal(reports.filter(r=>r.violations.length||r.errors.length).length,0,'Theme accessibility violations; see theme-report.json');
} finally {
 await writeFile('ui-evidence/theme-report.json',JSON.stringify(reports,null,2));
 await browser.close();
}
