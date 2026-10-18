import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium}=require('playwright');
const {default:AxeBuilder}=require('@axe-core/playwright');
await mkdir('ui-evidence',{recursive:true});
const browser=await chromium.launch();
const reports=[];
try {
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:'light'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3016/?tab=belajar',{waitUntil:'networkidle'});
  const trigger=page.getByRole('button',{name:'Atur tampilan dan warna',exact:true});
  const dialog=page.getByRole('dialog',{name:'Pengaturan tampilan'});
  await trigger.click();
  await page.waitForFunction(()=>document.activeElement===document.querySelector('.tema-mode button'));
  for(const mode of ['Terang','Gelap']){
   await dialog.getByRole('button',{name:mode,exact:true}).click();
   for(const palette of ['Nusantara','Samudra','Senja','Zamrud','Koral']){
    await dialog.getByRole('button',{name:new RegExp('^'+palette)}).click();
    assert.equal(await page.locator('html').getAttribute('data-tema'),mode.toLowerCase());
    assert.equal(await page.locator('html').getAttribute('data-palet'),palette.toLowerCase());
    await page.waitForTimeout(250);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    const report={width,mode,palette,violations:result.violations,errors:[...errors]};reports.push(report);
    console.log(JSON.stringify(report));
   }
  }
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
 assert.equal(reports.length,20);
 assert.equal(reports.filter(r=>r.violations.length||r.errors.length).length,0,'Theme accessibility violations; see theme-report.json');
} finally {
 await writeFile('ui-evidence/theme-report.json',JSON.stringify(reports,null,2));
 await browser.close();
}
