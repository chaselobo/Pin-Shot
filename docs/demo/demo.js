import * as THREE from 'three';
import {OrbitControls} from '../studio/vendor/OrbitControls.js';
import {createBottle} from '../studio/model.js?v=pin-gate-1';
import {lightStudio} from '../studio/lighting.js?v=pin-gate-1';

const $=s=>document.querySelector(s),viewport=$('#viewport'),stage=$('.stage');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(pointer:coarse)').matches;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2,2,2,-2,.05,60);
let renderer,controls,model,mode='inside',liquidPlaying=!reduced,raf,last=0,lastPhase='',lastPercent=-1,lastPlaying=null,pull=0,dirty=true;
let stageWidth=1,stageHeight=1,pointer=null;
const projected=new THREE.Vector3(),labels={shot:$('#labels [data-part=shot]'),gate:$('#labels [data-part=gate]'),soda:$('#labels [data-part=soda]')};
const copy={sealed:['PIN IN · LIQUIDS SEPARATE','The pin’s flat paddle seals the shot between two gaskets.'],withdrawing:['PADDLE SLIDING OUT','The ring and sealing paddle withdraw together.'],draining:['THROAT OPEN · SHOT DRAINING','The shot flows through the opening into the soda.'],mixed:['PIN OUT · SHOT RELEASED','The shot has drained. The exit flap closes behind the paddle.']};
function fit(){
  dirty=true;
  const aspect=stageWidth/stageHeight,width=mode==='inside'?2.65+pull:3.35;
  const height=Math.max(mode==='inside'?2.75:4.65,width/aspect);
  camera.top=height/2;camera.bottom=-height/2;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.updateProjectionMatrix();
}
function home(){
  camera.zoom=1;
  const target=mode==='inside'?new THREE.Vector3(.28+pull*.49,3.06,0):new THREE.Vector3(.10,2.05,0);
  // Clear residual orbit damping before setting a predictable starting camera.
  controls.enableDamping=false;controls.reset();controls.target.copy(target);
  camera.position.copy(target).add(mode==='inside'?new THREE.Vector3(1.25,2.2,10):new THREE.Vector3(0,0,10));
  fit();controls.update();controls.enableDamping=true;
}
function updateStatus(state){
  const percent=Math.round(state.progress*100);
  if(percent!==lastPercent){dirty=true;$('#progress').value=percent;$('#percent').textContent=percent+'%';lastPercent=percent;}
  if(state.phase!==lastPhase){$('#phase-title').textContent=copy[state.phase][0];$('#phase-copy').textContent=copy[state.phase][1];viewport.dataset.gate=state.phase;lastPhase=state.phase;}
  const button=state.playing?'Pause pull':state.progress>=1?'Replay pull':state.progress>0?'Resume pull':'Pull pin';
  if(button!==lastPlaying){$('#pull').textContent=button;lastPlaying=button;}
  if(Math.abs(pull-state.pull)>.0001){
    const dx=(state.pull-pull)*.49;pull=state.pull;
    if(mode==='inside'){controls.target.x+=dx;camera.position.x+=dx;fit();}
  }
}
function setMode(next){
  mode=next;model.mechanism.reset();model.mechanism.setCutaway(mode==='inside');pull=0;
  $('#bottle').setAttribute('aria-pressed',String(mode==='bottle'));$('#inside').setAttribute('aria-pressed',String(mode==='inside'));
  $('#pin-panel').hidden=mode!=='inside';$('#bottle-panel').hidden=mode!=='bottle';$('#labels').hidden=mode!=='inside';
  $('#mode-badge').textContent=mode==='inside'?'A2 CONCEPT · CUTAWAY':'VSL · LIVE 3D';
  $('#concept-note').textContent=mode==='inside'?'Concept demonstration · blue tint identifies the shot.':'Product concept · drag to rotate, pinch to zoom.';
  updateStatus(model.mechanism.update(0));home();viewport.dataset.mode=mode;
}
function setMotion(){
  $('#motion').setAttribute('aria-pressed',String(liquidPlaying));$('#motion').textContent=liquidPlaying?'Pause liquid':'Play liquid';viewport.dataset.liquid=liquidPlaying?'playing':'paused';
}
function zoom(factor){dirty=true;camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.7,2.4);camera.updateProjectionMatrix();}
function placeLabels(){
  if(mode!=='inside')return;
  const anchors={shot:[-.43,3.57,.1],gate:[.18+model.pin.position.x,2.78,.32],soda:[-.48,2.25,.2]};
  for(const [name,xyz] of Object.entries(anchors)){
    projected.set(...xyz).project(camera);const el=labels[name];
    const x=THREE.MathUtils.clamp((projected.x+1)*stageWidth/2,8,stageWidth-el.offsetWidth-8);
    const y=THREE.MathUtils.clamp((1-projected.y)*stageHeight/2-19,38,stageHeight-38);
    el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;
  }
}
function fail(error){
  console.error(error);cancelAnimationFrame(raf);$('#loading').textContent='';$('#fallback').hidden=false;viewport.hidden=true;$('#labels').hidden=true;
  document.querySelectorAll('.controls button,.camera-tools button,#progress').forEach(el=>el.disabled=true);
}
try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.localClippingEnabled=true;
  viewport.append(renderer.domElement);lightStudio(scene,renderer);
  controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.minZoom=.7;controls.maxZoom=2.4;controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI-.001;controls.addEventListener('change',()=>{dirty=true;});
  new ResizeObserver(()=>{const bounds=viewport.getBoundingClientRect();stageWidth=bounds.width;stageHeight=bounds.height;if(!stageWidth||!stageHeight)return;renderer.setSize(stageWidth,stageHeight,false);fit();}).observe(viewport);
  model=await createBottle();scene.add(model.group);
  document.querySelectorAll('.controls button,#progress').forEach(el=>el.disabled=false);$('#loading').textContent='';setMode('inside');setMotion();viewport.dataset.ready='vsl';
  $('#bottle').addEventListener('click',()=>setMode('bottle'));$('#inside').addEventListener('click',()=>setMode('inside'));
  $('#pull').addEventListener('click',()=>{const state=model.mechanism.update(0);state.playing?model.mechanism.pause():model.mechanism.play();updateStatus(model.mechanism.update(0));});
  $('#reset-pin').addEventListener('click',()=>{model.mechanism.reset();updateStatus(model.mechanism.update(0));});
  $('#progress').addEventListener('input',e=>{model.mechanism.pause();model.mechanism.setProgress(Number(e.target.value)/100);updateStatus(model.mechanism.update(0));});
  $('#swirl').addEventListener('click',()=>{liquidPlaying=true;setMotion();model.liquid.stir(1,.8);});$('#motion').addEventListener('click',()=>{liquidPlaying=!liquidPlaying;setMotion();});
  $('#home').addEventListener('click',home);$('#zoom-in').addEventListener('click',()=>zoom(1.18));$('#zoom-out').addEventListener('click',()=>zoom(1/1.18));
  viewport.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
    event.preventDefault();if(event.key==='Home'){home();return;}if(['+','=','-'].includes(event.key)){zoom(event.key==='-'?1/1.12:1.12);return;}
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta+=event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?-.12:0;spherical.phi=THREE.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.12:event.key==='ArrowDown'?.12:0),.001,Math.PI-.001);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();
  });
  renderer.domElement.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointermove',e=>{if(!pointer)return;if(liquidPlaying&&mode==='bottle')model.liquid.stir((e.clientX-pointer.x)*.014,(e.clientY-pointer.y)*.014);pointer={x:e.clientX,y:e.clientY};});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,()=>{pointer=null;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('WebGL context lost'));});
  const animate=time=>{
    raf=requestAnimationFrame(animate);if(time-last<1000/(mobile?30:60))return;
    const delta=Math.min((time-last)/1000,.1);last=time;
    if(liquidPlaying)model.liquid.update(delta);
    let mechanismPlaying=false;
    if(mode==='inside'){const state=model.mechanism.update(delta);mechanismPlaying=state.playing;updateStatus(state);}
    const changed=controls.update(delta);
    if(dirty||changed||liquidPlaying||mechanismPlaying){placeLabels();renderer.render(scene,camera);dirty=false;}
  };
  raf=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden){last=0;raf=requestAnimationFrame(animate);}});
}catch(error){fail(error);}
$('#retry').addEventListener('click',()=>location.reload());
