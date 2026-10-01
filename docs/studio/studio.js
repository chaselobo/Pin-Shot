import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createBottle } from './model.js';

const $=s=>document.querySelector(s), viewport=$('#viewport');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.05,60);
let renderer,controls,model,frame,last=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function fail(error) {
  console.error(error); $('#loading').textContent='';$('#fallback').hidden=false;
  viewport.hidden=true;
  document.querySelectorAll('.views button,.zoom button,#spin,.theme-row button').forEach(b=>b.disabled=true);
}
function stopSpin(){controls.autoRotate=false;$('#spin').setAttribute('aria-pressed','false');}
function view(name){
  stopSpin();controls.reset();controls.target.set(0,1.98,0);
  const distance=innerWidth<681?8.65:9.0;
  const positions={front:[0,2.64,distance],back:[0,2.64,-distance],side:[distance,2.85,.15],top:[0,1.98+distance,.001],base:[0,1.98-distance,.001]};
  camera.position.set(...positions[name]);controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
}
function zoom(factor){
  const offset=camera.position.clone().sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));
  camera.position.copy(controls.target).add(offset);controls.update();
}
try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  viewport.append(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
  controls.minDistance=4.4;controls.maxDistance=14;controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI-.001;controls.autoRotateSpeed=.55;
  // A photographic light tent gives the glass and copper real reflections.
  const envScene=new THREE.Scene();envScene.background=new THREE.Color(0x44443d);
  const panel=(position,scale,intensity)=>{
    const p=new THREE.Mesh(new THREE.PlaneGeometry(...scale),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity,intensity),side:THREE.DoubleSide}));
    p.position.set(...position);p.lookAt(0,2,0);envScene.add(p);
  };
  panel([-4,3,3],[2.3,6],5);panel([4,4,1],[1.6,6],3);panel([0,7,0],[4,4],3);panel([0,3,-5],[5,5],2);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.06);scene.environment=environment.texture;pmrem.dispose();
  envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  scene.add(new THREE.HemisphereLight(0xffffff,0x4f5334,2));
  for(const [position,color,intensity] of [[[-3,6,5],0xffffff,3],[[4,4,-2],0xe9ffc0,2],[[0,2,6],0xffffff,1]]) {
    const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);
  }
  view('front');
  const resize=()=>{const rect=viewport.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();};
  new ResizeObserver(resize).observe(viewport);resize();
  controls.addEventListener('start',()=>{
    stopSpin();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
  });
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
  $('#zoom-in').addEventListener('click',()=>zoom(.85));$('#zoom-out').addEventListener('click',()=>zoom(1.18));$('#reset').addEventListener('click',()=>view('front'));
  $('#spin').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('#spin').setAttribute('aria-pressed',String(controls.autoRotate));document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));});
  document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{
    $('.stage').classList.toggle('light',b.dataset.theme==='light');
    document.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  }));
  viewport.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
    event.preventDefault();stopSpin();
    const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(event.key==='Home'){view('front');return;}
    if(['+','=','-'].includes(event.key)){zoom(event.key==='-'?1.12:.89);return;}
    spherical.theta+=event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?-.12:0;
    spherical.phi=THREE.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.12:event.key==='ArrowDown'?.12:0),.001,Math.PI-.001);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);fail(new Error('WebGL context lost'));});
  model=await createBottle();scene.add(model.group);viewport.dataset.ready='vsl';$('#loading').textContent='';
  // Expose model creation through its module for reproducible GLB export.
  const animate=time=>{
    frame=requestAnimationFrame(animate);
    if(time-last<(reduced&&!controls.autoRotate?1000/30:1000/60))return;
    const delta=Math.min((time-last)/1000,.1);last=time;controls.update(delta);renderer.render(scene,camera);
  };
  frame=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else{last=0;frame=requestAnimationFrame(animate);}});
} catch(error){fail(error);}
$('#retry').addEventListener('click',()=>location.reload());
