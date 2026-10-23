import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('/tmp/ui-browser/package.json');
const {chromium,webkit,firefox,devices}=require('playwright');
const {default:AxeBuilder}=require('@axe-core/playwright');
await mkdir('ui-evidence',{recursive:true});
const reports=[];
const cases=[
 {name:'chromium-android',engine:chromium,options:{...devices['Pixel 7']},touch:true},
 {name:'webkit-iphone',engine:webkit,options:{...devices['iPhone 13']},touch:true},
 {name:'firefox-narrow',engine:firefox,options:{viewport:{width:390,height:844}},touch:false}
];
try {
 for(const test of cases){
  const browser=await test.engine.launch();
  const version=browser.version();
  const context=await browser.newContext({...test.options,colorScheme:'light',reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const errors=[],models=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/models/'))models.push(r.url());});
  const report={browser:test.name,engine:test.engine.name(),version,touch:test.touch,pages:[],errors,tangkapan:[]};reports.push(report);
  const activate=locator=>test.touch?locator.tap():locator.click();
  // Match the page heading, not a same-named section heading (e.g. Flashcard).
  const pageHeading=label=>page.getByRole('heading',{name:label,exact:true,level:1});
  // Tangkapan layar adalah bukti, bukan asersi. /panduan sangat tinggi dan
  // Chromium Android memakai DPR 2,75, jadi full-page bisa melewati batas 15
  // detik. Beri 60 detik, lalu jatuh ke tangkapan viewport saja, dan catat
  // hasilnya apa adanya alih-alih menggagalkan uji yang asersinya sudah lolos.
  const tangkapan=async(berkas,penuh=true)=>{
   const catatan=[];
   try{
    await page.screenshot({path:`ui-evidence/${berkas}.png`,fullPage:penuh,timeout:60000});
    report.tangkapan.push({berkas,penuh});
    return;
   }catch(error){catatan.push(String(error));}
   if(penuh){
    try{
     await page.screenshot({path:`ui-evidence/${berkas}.png`,fullPage:false,timeout:60000});
     report.tangkapan.push({berkas,penuh:false,catatan});
     return;
    }catch(error){catatan.push(String(error));}
   }
   report.tangkapan.push({berkas,penuh:null,catatan});
   console.log(`${test.name}: tangkapan ${berkas} gagal: ${catatan.join(' | ')}`);
  };
  try {
   // Rute sekarang berupa path asli, bukan query ?tab=. Tautan ?tab= lama tetap
   // diterima aplikasi, tetapi uji ini sengaja memakai bentuk path supaya
   // kontrak yang baru benar-benar diuji, bukan jalur kompatibilitas.
   await page.goto('http://localhost:3016/belajar?jenjang=smp',{waitUntil:'networkidle'});
   const nav=page.getByRole('navigation',{name:'Navigasi utama'});
   for(const [rute,label] of [['/belajar','Belajar'],['/kuis','Kuis'],['/flashcard','Flashcard'],['/glosarium','Glosarium'],['/panduan','Panduan']]){
    if(rute!=='/belajar')await activate(nav.getByRole('link',{name:label,exact:true}));
    const heading=pageHeading(label);await heading.waitFor();
    assert.equal(await heading.count(),1,'Exactly one matching page heading');
    assert.equal(new URL(page.url()).pathname,rute);
    const tautanNav=nav.getByRole('link',{name:label,exact:true});
    assert.equal(await tautanNav.getAttribute('aria-current'),'page');
    assert.equal(await tautanNav.getAttribute('href'),rute);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    if(rute!=='/belajar')assert.ok(await heading.evaluate(e=>e===document.activeElement),'Navigation focuses heading');
    // Judul dokumen harus ikut berubah: keenam rute sebelumnya berbagi satu judul.
    assert.ok((await page.title()).length>0,`${test.name}/${rute}: empty document title`);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    report.pages.push({rute,judul:await page.title(),violations:result.violations});
    assert.equal(result.violations.length,0,`${test.name}/${rute}: axe violations`);
   }
   // Judul per rute tidak boleh identik dengan rute lain.
   const judulUnik=new Set(report.pages.map(p=>p.judul));
   assert.equal(judulUnik.size,report.pages.length,'Setiap rute harus punya judul dokumen berbeda');
   await page.goBack();await pageHeading('Glosarium').waitFor();
   await page.goForward();await pageHeading('Panduan').waitFor();
   assert.equal(new URL(page.url()).searchParams.get('jenjang'),'smp');
   const trigger=page.getByRole('button',{name:'Atur tampilan dan warna',exact:true});
   const dialog=page.getByRole('dialog',{name:'Pengaturan tampilan'});
   await activate(trigger);
   await activate(dialog.getByRole('button',{name:'Gelap',exact:true}));
   await activate(dialog.getByRole('button',{name:/^Koral/}));
   await page.keyboard.press('Escape');
   assert.equal(await dialog.count(),0);
   assert.ok(await trigger.evaluate(e=>e===document.activeElement));
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('html').getAttribute('data-tema'),'gelap');
   assert.equal(await page.locator('html').getAttribute('data-palet'),'koral');
   await activate(trigger);
   // Dismiss via a point proven to sit outside the panel; the panel overlays the heading.
   const panelBox=await dialog.boundingBox();
   assert.ok(panelBox,'Theme panel must be measurable');
   const view=page.viewportSize();
   const point={x:6,y:view.height-6};
   const inside=point.x>=panelBox.x&&point.x<=panelBox.x+panelBox.width&&point.y>=panelBox.y&&point.y<=panelBox.y+panelBox.height;
   assert.equal(inside,false,'Dismissal point must be outside the theme panel');
   if(test.touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
   assert.equal(await dialog.count(),0,'Outside pointer closes theme panel');
   assert.equal(new URL(page.url()).pathname,'/panduan','Outside dismissal must not navigate');
   assert.equal(models.length,0,'Educational routes must not fetch anatomy models');
   assert.deepEqual(errors,[]);
   await tangkapan(test.name);
   // The 3D route is the one place where WebGL, pointer events and lazy chunks meet.
   // Record what each engine actually does instead of assuming parity with Chromium.
   const viewer={};
   try {
    await page.goto('http://localhost:3016/jelajah',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Cari struktur anatomi',exact:true}).waitFor({timeout:30000});
    viewer.reachedRoute=true;
    viewer.canvasCount=await page.locator('canvas').count();
    viewer.webgl=await page.evaluate(()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}});
    // Ready means the loading indicator is gone. The field name says exactly that:
    // it does not claim that no alert appeared.
    viewer.reachedReadyState=await page.waitForFunction(()=>!document.querySelector('.loading'),{timeout:45000}).then(()=>true).catch(()=>false);
    viewer.alertText=await page.getByRole('alert').innerText().catch(()=>null);
    if(viewer.webgl){
     // A WebGL-capable engine must actually render, with no failure alert.
     assert.ok(viewer.canvasCount>0,'WebGL available but no canvas was created');
     assert.equal(viewer.reachedReadyState,true,`${test.name}: viewer stayed on loading state with WebGL available`);
     assert.equal(viewer.alertText,null,`${test.name}: unexpected alert with WebGL available`);
     viewer.mode='rendered';
    }else{
     // Without WebGL the only acceptable outcome is the explicit fallback, never a
     // silent blank canvas. This branch used to be skipped entirely, which let a
     // headless engine with no WebGL report passed:true without testing anything.
     assert.equal(viewer.canvasCount,0,`${test.name}: no WebGL but a canvas was created`);
     assert.ok(viewer.alertText&&viewer.alertText.length>0,`${test.name}: no WebGL and no fallback alert shown`);
     viewer.mode='fallback';
    }
    // Orbit must not throw. Record the outcome instead of hardcoding success.
    const errorsBefore=errors.length;
    try{
     await page.mouse.move(200,400);await page.mouse.down();await page.mouse.move(260,430,{steps:5});await page.mouse.up();
     viewer.pointerGestureSurvived=errors.length===errorsBefore;
    }catch(error){viewer.pointerGestureSurvived=false;viewer.pointerGestureError=String(error);}
    assert.equal(viewer.pointerGestureSurvived,true,`${test.name}: pointer orbit threw`);
    assert.deepEqual(errors,[],`${test.name}: runtime errors on the 3D route`);
    await tangkapan(`${test.name}-jelajah`,false);
   } catch(error) {
    viewer.failure=String(error);
    throw error;
   } finally {
    report.viewer=viewer;
   }
   report.passed=true;console.log(JSON.stringify(report));
  }catch(error){report.failure=String(error);await tangkapan(`${test.name}-failure`);throw error;}
  finally{await context.close();await browser.close();}
 }
 assert.equal(reports.length,3);assert.ok(reports.every(r=>r.passed));
 // Prove three distinct engines actually ran, instead of trusting configuration.
 assert.equal(new Set(reports.map(r=>r.engine)).size,3,'Three distinct browser engines must execute');
 assert.ok(reports.every(r=>r.version),'Each engine must report a version');
 assert.ok(reports.every(r=>r.viewer&&r.viewer.reachedRoute),'Every engine must reach the 3D route');
 // Every engine must end in a defined state: either it rendered, or it showed the
 // explicit fallback. An engine that reaches neither can no longer pass.
 assert.ok(reports.every(r=>r.viewer.mode==='rendered'||r.viewer.mode==='fallback'),'Every engine must render or show the WebGL fallback');
 assert.ok(reports.some(r=>r.viewer.mode==='rendered'),'At least one engine must actually render the 3D scene');
 console.log(`rendered: ${reports.filter(r=>r.viewer.mode==='rendered').map(r=>r.engine).join(', ')||'none'}; fallback: ${reports.filter(r=>r.viewer.mode==='fallback').map(r=>r.engine).join(', ')||'none'}`);
}finally{await writeFile('ui-evidence/mobile-report.json',JSON.stringify(reports,null,2));}
