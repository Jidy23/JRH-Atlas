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
  const context=await browser.newContext({...test.options,colorScheme:'light',reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const errors=[],models=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/models/'))models.push(r.url());});
  const report={browser:test.name,touch:test.touch,pages:[],errors};reports.push(report);
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
   await activate(trigger);await activate(pageHeading('Panduan'));
   assert.equal(await dialog.count(),0,'Outside pointer closes theme panel');
   assert.equal(models.length,0,'Educational routes must not fetch anatomy models');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`ui-evidence/${test.name}.png`,fullPage:true});
   report.passed=true;console.log(JSON.stringify(report));
  }catch(error){report.failure=String(error);await page.screenshot({path:`ui-evidence/${test.name}-failure.png`,fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();await browser.close();}
 }
 assert.equal(reports.length,3);assert.ok(reports.every(r=>r.passed));
}finally{await writeFile('ui-evidence/mobile-report.json',JSON.stringify(reports,null,2));}
