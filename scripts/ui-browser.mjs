import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium}=require('playwright');
const {default:AxeBuilder}=require('@axe-core/playwright');
await mkdir('ui-evidence',{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[];
// Rute berupa path asli sejak batch SEO. Sebelumnya ?tab=, yang membuat keenam
// halaman berbagi satu URL dan satu judul dokumen.
const RUTE={belajar:'/belajar',kuis:'/kuis',flashcard:'/flashcard',glosarium:'/glosarium',panduan:'/panduan',jelajah:'/jelajah'};
// Bukti tangkapan layar bukan asersi: kanvas WebGL pada tab jelajah dapat
// menggantung screenshot full-page. Beri batas waktu, cadangan viewport, dan
// jangan biarkan kegagalan bukti menutupi hasil uji aksesibilitas.
async function tangkap(page,path,fullPage=true){
 const opsi={path,fullPage,timeout:15000,animations:'disabled',caret:'hide'};
 try{await page.screenshot(opsi);return true}
 catch(pertama){
  try{await page.screenshot({...opsi,fullPage:false});return true}
  catch(kedua){
   console.warn(JSON.stringify({screenshot:path,gagal:String(pertama),cadangan:String(kedua)}));
   return false;
  }
 }
}
try {
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const tab of ['belajar','kuis','flashcard','glosarium','panduan','jelajah']){
   try {
    await page.goto(`http://localhost:3016${RUTE[tab]}`,{waitUntil:'networkidle'});
    await page.getByRole('navigation',{name:'Navigasi utama'}).getByRole('link',{name:tab==='jelajah'?'Jelajah 3D':new RegExp(tab,'i')}).waitFor();
    assert.equal(await page.locator('main').count(),1,'Exactly one main landmark');
    assert.equal(new URL(page.url()).pathname,RUTE[tab],`${width}/${tab}: path harus ${RUTE[tab]}`);
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
     await page.getByRole('combobox').fill('jantung');
     await page.keyboard.press('Escape');
     await page.getByRole('button',{name:'Atur ulang tampilan',exact:true}).click();
    }
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    reports.push({width,tab,judul:await page.title(),violations:result.violations,errors:[...errors]});
    console.log(JSON.stringify({width,tab,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),errors}));
    await tangkap(page,`ui-evidence/${width}-${tab}.png`,tab!=='jelajah');
   } catch(error) {
    await tangkap(page,`ui-evidence/${width}-${tab}-failure.png`,false);
    const teks=await page.locator('body').innerText().catch(()=>'<tidak tersedia>');
    await writeFile(`ui-evidence/${width}-${tab}-failure.txt`,String(error)+'\n'+teks);
    throw error;
   }
  }
  assert.deepEqual(errors,[],`${width}: browser runtime errors`);
  // Keenam rute tidak boleh berbagi satu judul dokumen.
  const unik=new Set(reports.filter(r=>r.width===width).map(r=>r.judul));
  assert.equal(unik.size,6,`${width}: setiap rute harus punya judul dokumen sendiri`);
  await context.close();
 }
} finally {
 await writeFile('ui-evidence/report.json',JSON.stringify(reports,null,2));
 await browser.close();
}
