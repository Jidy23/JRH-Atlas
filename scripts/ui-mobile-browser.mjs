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
  const report={browser:test.name,engine:test.engine.name(),version,touch:test.touch,pages:[],errors};reports.push(report);
  const activate=locator=>test.touch?locator.tap():locator.click();
  // Match the page heading, not a same-named section heading (e.g. Flashcard).
  const pageHeading=label=>page.getByRole('heading',{name:label,exact:true,level:1});
  try {
   await page.goto('http://localhost:3016/?tab=belajar&jenjang=smp',{waitUntil:'networkidle'});
   const nav=page.getByRole('navigation',{name:'Navigasi utama'});
   for(const [tab,label] of [['belajar','Belajar'],['kuis','Kuis'],['flashcard','Flashcard'],['glosarium','Glosarium'],['panduan','Panduan']]){
    if(tab!=='belajar')await activate(nav.getByRole('link',{name:label,exact:true}));
    const heading=pageHeading(label);await heading.waitFor();
    assert.equal(await heading.count(),1,'Exactly one matching page heading');
    assert.equal(new URL(page.url()).searchParams.get('tab'),tab);
    assert.equal(await nav.getByRole('link',{name:label,exact:true}).getAttribute('aria-current'),'page');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    if(tab!=='belajar')assert.ok(await heading.evaluate(e=>e===document.activeElement),'Navigation focuses heading');
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    report.pages.push({tab,violations:result.violations});
    assert.equal(result.violations.length,0,`${test.name}/${tab}: axe violations`);
   }
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
   assert.equal(new URL(page.url()).searchParams.get('tab'),'panduan','Outside dismissal must not navigate');
   assert.equal(models.length,0,'Educational routes must not fetch anatomy models');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`ui-evidence/${test.name}.png`,fullPage:true});
   // The 3D route is the one place where WebGL, pointer events and lazy chunks meet.
   // Record what each engine actually does instead of assuming parity with Chromium.
   const viewer={};
   try {
    await page.goto('http://localhost:3016/?tab=jelajah',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Cari struktur anatomi',exact:true}).waitFor({timeout:30000});
    viewer.reachedRoute=true;
    viewer.canvasCount=await page.locator('canvas').count();
    viewer.webgl=await page.evaluate(()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}});
    // Either the model loads (progress reaches 100) or a recoverable alert appears.
    const loaded=await page.waitForFunction(()=>{const el=document.querySelector('.loading');return !el;},{timeout:45000}).then(()=>true).catch(()=>false);
    viewer.loadedWithoutAlert=loaded;
    viewer.alertText=loaded?null:await page.getByRole('alert').innerText().catch(()=>null);
    if(viewer.webgl){
     assert.ok(viewer.canvasCount>0,'WebGL available but no canvas was created');
     assert.equal(viewer.loadedWithoutAlert,true,`${test.name}: viewer stayed on loading state with WebGL available`);
    }
    // Touch orbit must not throw even when WebGL falls back to software rendering.
    await page.mouse.move(200,400);await page.mouse.down();await page.mouse.move(260,430,{steps:5});await page.mouse.up();
    viewer.pointerGestureSurvived=true;
    assert.deepEqual(errors,[],`${test.name}: runtime errors on the 3D route`);
    await page.screenshot({path:`ui-evidence/${test.name}-jelajah.png`,fullPage:false});
   } catch(error) {
    viewer.failure=String(error);
    throw error;
   } finally {
    report.viewer=viewer;
   }
   report.passed=true;console.log(JSON.stringify(report));
  }catch(error){report.failure=String(error);await page.screenshot({path:`ui-evidence/${test.name}-failure.png`,fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();await browser.close();}
 }
 assert.equal(reports.length,3);assert.ok(reports.every(r=>r.passed));
 // Prove three distinct engines actually ran, instead of trusting configuration.
 assert.equal(new Set(reports.map(r=>r.engine)).size,3,'Three distinct browser engines must execute');
 assert.ok(reports.every(r=>r.version),'Each engine must report a version');
 assert.ok(reports.every(r=>r.viewer&&r.viewer.reachedRoute),'Every engine must reach the 3D route');
}finally{await writeFile('ui-evidence/mobile-report.json',JSON.stringify(reports,null,2));}
