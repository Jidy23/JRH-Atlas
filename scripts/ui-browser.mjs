import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium}=require('playwright');
const {default:AxeBuilder}=require('@axe-core/playwright');
await mkdir('ui-evidence',{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[];
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const tab of ['belajar','kuis','flashcard','glosarium','panduan','jelajah']){
   await page.goto(`http://localhost:3016/?tab=${tab}`,{waitUntil:'networkidle'});
   await page.getByRole('navigation',{name:'Navigasi utama'}).getByRole('link',{name:tab==='jelajah'?'Jelajah 3D':new RegExp(tab,'i')}).waitFor();
   assert.equal(await page.locator('main').count(),1,'Exactly one main landmark');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${tab}: horizontal overflow`);
   if(tab==='kuis'){
    await page.getByRole('button',{name:/Mulai kuis/}).click();
    await page.locator('.pilih').first().click();
    await page.getByRole('status').waitFor();
    assert.equal(await page.locator('.pilih:not(:disabled)').count(),0);
    await page.getByRole('button',{name:/Soal berikutnya|Lihat hasil/}).click();
   }
   if(tab==='flashcard'){
    const total=Number((await page.locator('.navigasi .chip').innerText()).split('/')[1]);
    for(let i=0;i<total+1;i++)await page.getByRole('button',{name:'Sudah hafal',exact:true}).click();
    assert.ok((await page.locator('.catatan-kecil').innerText()).startsWith(`${total} dari ${total} kartu unik`),'Flashcards must not double count');
    await page.getByRole('button',{name:'Belum hafal',exact:true}).click();
    assert.ok((await page.locator('.catatan-kecil').innerText()).startsWith(`${total-1} dari ${total}`),'Unmark must update count');
   }
   if(tab==='jelajah'){
    await page.waitForTimeout(5000);
    if(width<901){await page.getByRole('button',{name:'Buka lapisan sistem',exact:true}).click();await page.getByRole('button',{name:'Tutup sistem',exact:true}).click();}
    await page.getByRole('button',{name:'Cari struktur anatomi',exact:true}).click();
    await page.getByRole('textbox').fill('jantung');
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Atur ulang tampilan',exact:true}).click();
   }
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   reports.push({width,tab,violations:result.violations,errors:[...errors]});
   await page.screenshot({path:`ui-evidence/${width}-${tab}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[],`${width}: browser runtime errors`);
  await page.close();
 }
} finally {
 await writeFile('ui-evidence/report.json',JSON.stringify(reports,null,2));
 await browser.close();
}
console.log(JSON.stringify(reports.map(({width,tab,violations,errors})=>({width,tab,violations:violations.map(v=>({id:v.id,impact:v.impact,count:v.nodes.length})),errors})),null,2));
