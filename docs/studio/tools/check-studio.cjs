// Start: python3 -m http.server 8140 --directory docs
// Run with Playwright available: node docs/studio/tools/check-studio.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const url = process.env.STUDIO_URL || 'http://127.0.0.1:8140/studio/';
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  try {
    await page.goto(url);await page.waitForSelector('[data-ready="vsl"]');
    await page.waitForTimeout(800);
    await page.screenshot({path:'/private/tmp/pin-shot-studio-front.png'});
    const frame=async()=>{await page.waitForTimeout(350);return page.locator('canvas').evaluate(c=>c.toDataURL());};
    const front=await frame(),views=new Set([front]);
    for(const name of ['angle','side','left','back','top','base']) {
      await page.locator(`[data-view="${name}"]`).click();views.add(await frame());
      assert.equal(await page.locator(`[data-view="${name}"]`).getAttribute('aria-pressed'),'true');
      await page.screenshot({path:`/private/tmp/pin-shot-studio-${name}.png`});
    }
    assert.equal(views.size,7,'Seven presets must render different surfaces');
    await page.locator('#compare').click();
    assert.equal(await page.locator('#source-view').isVisible(),true);
    assert.equal(await page.locator('#compare').getAttribute('aria-pressed'),'true');
    await page.locator('#compare').click();
    assert.equal(await page.locator('#source-view').isVisible(),false);
    await page.locator('#reset').click();const reset=await frame();
    await page.locator('#zoom-in').click();assert.notEqual(await frame(),reset,'Zoom should change the rendered view');
    await page.locator('#reset').click();await frame();
    const canvas=await page.locator('canvas').boundingBox();
    await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
    await page.mouse.down();await page.mouse.move(canvas.x+canvas.width/2+170,canvas.y+canvas.height/2-25,{steps:15});await page.mouse.up();
    assert.notEqual(await frame(),reset,'Dragging should rotate the actual model');
    await page.locator('#reset').click();await frame();
    await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');
    assert.notEqual(await frame(),reset,'Keyboard rotation should change the rendered view');
    await page.locator('#spin').click();assert.equal(await page.locator('#spin').getAttribute('aria-pressed'),'true');
    const spinning=await frame();await page.waitForTimeout(800);assert.notEqual(await frame(),spinning,'Auto rotation should animate');
    await page.locator('#spin').click();await page.locator('[data-theme="light"]').click();
    assert.equal(await page.locator('.stage').evaluate(e=>e.classList.contains('light')),true);
    await page.locator('#reset').click();await frame();await page.screenshot({path:'/private/tmp/pin-shot-studio-light.png'});
    const base64=await page.evaluate(async()=>{
      const {createBottle}=await import('./model.js');const {GLTFExporter}=await import('./vendor/GLTFExporter.js');
      const {group}=await createBottle();const glb=await new GLTFExporter().parseAsync(group,{binary:true});
      const bytes=new Uint8Array(glb);let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);
    });
    const glb=Buffer.from(base64,'base64');
    assert.equal(glb.toString('ascii',0,4),'glTF');assert.equal(glb.readUInt32LE(8),glb.length);
    const data=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
    for(const name of ['Original-image bottle surface','Exact source-image front','Original-image copper pull ring','Original-image cap','Photographed copper ring'])assert.ok(data.nodes.some(n=>n.name===name),name);
    assert.ok(data.images.length===2&&data.images.every(i=>i.bufferView!==undefined),'The original photograph must be embedded');
    assert.ok(data.materials.filter(m=>m.name==='Unchanged original VSL photograph').every(m=>m.extensions?.KHR_materials_unlit),'Lighting must not alter the photographed colors');
    assert.deepEqual(await fs.readFile(path.resolve(__dirname,'../vsl-source.jpeg')),await fs.readFile(path.resolve(__dirname,'../../..','assets/pin-shot-vsl.jpeg')),'The source photograph must remain byte-identical');
    await fs.writeFile(path.resolve(__dirname,'../models/pin-shot-vsl.glb'),glb);
    assert.equal((await page.request.get(new URL('models/pin-shot-vsl.glb',url).href)).status(),200);
    await page.setViewportSize({width:390,height:844});await page.locator('[data-theme="dark"]').click();await page.locator('#reset').click();await frame();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile layout should not overflow');
    await page.screenshot({path:'/private/tmp/pin-shot-studio-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);console.log(`PASS: drag, keyboard, 7 views, source comparison, zoom, spin, backgrounds, mobile layout; GLB ${glb.length} bytes, ${data.meshes.length} meshes.`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
