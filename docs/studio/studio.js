import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createBottle, SOURCE } from './model.js?v=pin-gate-1';
import { lightStudio } from './lighting.js?v=pin-gate-1';

const $=s=>document.querySelector(s),viewport=$('#viewport');
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-3,3,2.4,-2.4,.05,60);
const target=new THREE.Vector3(0,(SOURCE.height-SOURCE.centerY)/SOURCE.scale,0);
let renderer,controls,model,frame,last=0,comparing=false;
let liquidPlaying=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
liquidPlaying=!reduced;
function fail(error){
  console.error(error);$('#loading').textContent='';$('#fallback').hidden=false;viewport.hidden=true;
  document.querySelectorAll('.views button,.zoom button,#spin,#compare,.theme-row button,#liquid-motion,#swirl,#cutaway,#pull-pin,#reset-pin,#pin-progress,#quick-pull,#quick-progress,#quick-reset').forEach(b=>b.disabled=true);
}
function updateSourceSize(){
  const pixelsPerUnit=viewport.clientHeight/(camera.top-camera.bottom)*camera.zoom;
  $('#source-view img').style.width=`${SOURCE.width/SOURCE.scale*pixelsPerUnit}px`;
  $('#source-view img').style.height=`${SOURCE.height/SOURCE.scale*pixelsPerUnit}px`;
}
function compare(enabled){
  comparing=enabled;$('#source-view').hidden=!enabled;
  $('#compare').setAttribute('aria-pressed',String(enabled));
  $('#compare').textContent=enabled?'Return to 3D':'Compare original image';
  $('#view-status').textContent=enabled?'ORIGINAL IMAGE':'LIVE 3D';
  if(controls)controls.enabled=!enabled;
  updateSourceSize();
}
function stopSpin(){controls.autoRotate=false;$('#spin').setAttribute('aria-pressed','false');}
function view(name){
  if(model?.mechanism.enabled)toggleCutaway(false);
  stopSpin();compare(false);controls.reset();controls.target.copy(target);camera.zoom=1;camera.updateProjectionMatrix();
  const positions={front:[0,target.y,10],angle:[6.4,target.y+1.0,8],back:[0,target.y,-10],side:[10,target.y,0],left:[-10,target.y,0],top:[0,target.y+10,.001],base:[0,target.y-10,.001]};
  camera.position.set(...positions[name]);controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  updateSourceSize();
}
function toggleCutaway(enabled){
  if(!model)return;
  compare(false);stopSpin();model.mechanism.reset();model.mechanism.setCutaway(enabled);
  $('#cutaway').setAttribute('aria-pressed',String(enabled));$('#cutaway').textContent=enabled?'Return to whole bottle':'Show pin cutaway';
  $('#gate-controls').hidden=$('#gate-caption').hidden=$('#gate-labels').hidden=$('#gate-quick').hidden=!enabled;$('.stage').classList.toggle('cutaway-active',enabled);
  if(enabled){
    controls.reset();controls.target.set(.76,3.05,0);camera.position.set(2.1,5.4,10);
    camera.zoom=Math.min(1.7,(camera.right-camera.left)/3.5);camera.updateProjectionMatrix();controls.update();
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
  }else view('front');
  gateState(model.mechanism.update(0));
  if(enabled)$('.stage').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
}
let lastGatePhase='';
function gateState(state){
  $('#pin-progress').value=$('#quick-progress').value=Math.round(state.progress*100);$('#pin-value').textContent=Math.round(state.progress*100)+'%';
  $('#pull-pin').textContent=$('#quick-pull').textContent=state.playing?'Pause pull':state.progress>=1?'Replay pull':state.progress>0?'Resume pull':'Pull pin';
  viewport.dataset.gate=state.phase;
  if(lastGatePhase===state.phase)return;lastGatePhase=state.phase;
  const copy={sealed:['PIN IN · LIQUIDS SEPARATE',"The pin's flat paddle is clamped between two gaskets, sealing the shot above the soda."],withdrawing:['PADDLE WITHDRAWING','The ring and paddle slide out together. The gaskets seal against the flat paddle.'],draining:['THROAT OPEN · SHOT DRAINING','The paddle clears the opening. The shot drains down through the throat into the soda.'],mixed:['PIN OUT · SHOT RELEASED','The shot has drained into the soda. The small exit flap closes behind the withdrawn paddle.']};
  $('#gate-title').textContent=copy[state.phase][0];$('#gate-copy').textContent=copy[state.phase][1];
}
function gateLabels(){
  if(!model?.mechanism.enabled)return;
  const positions={shot:[-.43,3.55,.1],gate:[.20+model.pin.position.x,2.78,.34],gaskets:[-.53,2.80,.1],soda:[-.5,2.27,.2]};
  const rect=viewport.getBoundingClientRect(),stage=$('.stage').getBoundingClientRect();
  for(const [name,coords] of Object.entries(positions)){
    const point=new THREE.Vector3(...coords).project(camera),element=$(`[data-anchor="${name}"]`);
    element.style.left=Math.max(12,Math.min(stage.width-element.offsetWidth-12,(point.x+1)*rect.width/2))+'px';
    element.style.top=Math.max(45,Math.min(stage.height-190,(1-point.y)*rect.height/2+rect.top-stage.top-22))+'px';
  }
}
function zoom(factor){
  camera.zoom=THREE.MathUtils.clamp(camera.zoom/factor,controls.minZoom,controls.maxZoom);
  camera.updateProjectionMatrix();updateSourceSize();controls.update();
}
try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.localClippingEnabled=true;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  // Image colors already include the source lighting; tone mapping would change them.
  renderer.toneMapping=THREE.NoToneMapping;viewport.prepend(renderer.domElement);lightStudio(scene,renderer);
  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
  controls.minZoom=.6;controls.maxZoom=2.3;controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI-.001;controls.autoRotateSpeed=.55;
  view('front');
  const resize=()=>{
    const {width,height}=viewport.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height,visibleHeight=Math.max(4.65,3.55/aspect);
    camera.top=visibleHeight/2;camera.bottom=-visibleHeight/2;camera.left=-visibleHeight*aspect/2;camera.right=visibleHeight*aspect/2;
    camera.updateProjectionMatrix();updateSourceSize();
  };
  new ResizeObserver(resize).observe(viewport);resize();
  controls.addEventListener('start',()=>{stopSpin();compare(false);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));});
  controls.addEventListener('change',updateSourceSize);
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
  $('#zoom-in').addEventListener('click',()=>zoom(.85));$('#zoom-out').addEventListener('click',()=>zoom(1.18));$('#reset').addEventListener('click',()=>view('front'));
  $('#compare').addEventListener('click',()=>{if(comparing)compare(false);else{view('front');compare(true);}});
  $('#spin').addEventListener('click',()=>{compare(false);controls.autoRotate=!controls.autoRotate;$('#spin').setAttribute('aria-pressed',String(controls.autoRotate));document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));});
  document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{
    $('.stage').classList.toggle('light',b.dataset.theme==='light');
    document.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  }));
  viewport.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
    event.preventDefault();stopSpin();compare(false);
    if(event.key==='Home'){view('front');return;}
    if(['+','=','-'].includes(event.key)){zoom(event.key==='-'?1.12:.89);return;}
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta+=event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?-.12:0;
    spherical.phi=THREE.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.12:event.key==='ArrowDown'?.12:0),.001,Math.PI-.001);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);fail(new Error('WebGL context lost'));});
  model=await createBottle();scene.add(model.group);viewport.dataset.ready='vsl';$('#loading').textContent='';
  $('#cutaway').addEventListener('click',()=>toggleCutaway(!model.mechanism.enabled));
  for(const id of ['#pull-pin','#quick-pull'])$(id).addEventListener('click',()=>{const state=model.mechanism.update(0);if(state.playing)model.mechanism.pause();else model.mechanism.play();gateState(model.mechanism.update(0));});
  for(const id of ['#reset-pin','#quick-reset'])$(id).addEventListener('click',()=>{model.mechanism.reset();gateState(model.mechanism.update(0));});
  for(const id of ['#pin-progress','#quick-progress'])$(id).addEventListener('input',e=>{model.mechanism.pause();model.mechanism.setProgress(Number(e.target.value)/100);gateState(model.mechanism.update(0));});
  const liquidButton=$('#liquid-motion');
  function liquidState(){liquidButton.setAttribute('aria-pressed',String(liquidPlaying));liquidButton.textContent=liquidPlaying?'Pause liquid':'Play liquid';viewport.dataset.liquid=liquidPlaying?'playing':'paused';}
  liquidState();liquidButton.addEventListener('click',()=>{liquidPlaying=!liquidPlaying;liquidState();});
  $('#swirl').addEventListener('click',()=>{compare(false);liquidPlaying=true;liquidState();model.liquid.stir(1,.8);});
  let pointer=null;
  renderer.domElement.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};});
  renderer.domElement.addEventListener('pointermove',e=>{if(!pointer)return;if(liquidPlaying)model.liquid.stir((e.clientX-pointer.x)*.014,(e.clientY-pointer.y)*.014);pointer={x:e.clientX,y:e.clientY};});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,()=>{pointer=null;});
  const animate=time=>{
    frame=requestAnimationFrame(animate);
    if(time-last<(reduced&&!controls.autoRotate?1000/30:1000/60))return;
    const delta=Math.min((time-last)/1000,.1);last=time;controls.update(delta);if(liquidPlaying&&!comparing)model.liquid.update(delta);if(model.mechanism.enabled){gateState(model.mechanism.update(delta));gateLabels();}renderer.render(scene,camera);
  };
  frame=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else{last=0;frame=requestAnimationFrame(animate);}});
} catch(error){fail(error);}
$('#retry').addEventListener('click',()=>location.reload());
