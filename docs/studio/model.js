import * as THREE from 'three';

// Visual reconstruction of assets/pin-shot-vsl.jpeg. Units are illustrative.
// Unseen surfaces are approximated; no manufacturing dimensions are implied.
const physical = (options) => new THREE.MeshPhysicalMaterial(options);
function mesh(group, name, geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  group.add(object);
  return object;
}
function lathe(group, name, profile, material) {
  return mesh(group, name, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 96), material);
}
function band(group, name, radius, tube, y, material) {
  const object = mesh(group, name, new THREE.TorusGeometry(radius, tube, 12, 96), material, [0, y, 0]);
  object.rotation.x = Math.PI / 2;
  return object;
}
function texture(canvas) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
function random(seed = 17) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}
function labelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1536;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#080a05';
  ctx.textAlign = 'center';
  ctx.font = '50px Anton, Impact, sans-serif';
  ctx.fillText('PULL · SWIRL · SIP', 512, 90);
  ctx.save();
  ctx.transform(1, -.095, 0, 1, 0, 50);
  ctx.font = '590px Anton, Impact, sans-serif';
  ctx.fillText('PIN', 512, 635, 960);
  ctx.font = '530px Anton, Impact, sans-serif';
  ctx.fillText('SHOT', 512, 1160, 980);
  ctx.restore();
  ctx.font = '180px Anton, Impact, sans-serif';
  ctx.fillText('VSL', 512, 1375);
  ctx.font = '46px Anton, Impact, sans-serif';
  ctx.fillText('ALCOHOLIC COCKTAIL · 21+', 512, 1500);
  return texture(canvas);
}
function limeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d'), rnd = random(123);
  const center = 256;
  ctx.fillStyle = '#285919'; ctx.beginPath();ctx.arc(center,center,253,0,Math.PI*2);ctx.fill();
  ctx.fillStyle = '#a9be51'; ctx.beginPath();ctx.arc(center,center,240,0,Math.PI*2);ctx.fill();
  ctx.fillStyle = '#e9edb0'; ctx.beginPath();ctx.arc(center,center,228,0,Math.PI*2);ctx.fill();
  for(let wedge = 0; wedge < 10; wedge++) {
    const start = wedge * Math.PI / 5 + .02, end = (wedge + 1) * Math.PI / 5 - .025;
    const gradient = ctx.createRadialGradient(256,256,10,256,256,223);
    gradient.addColorStop(0,'#dae899');gradient.addColorStop(.35,'#c1d94c');gradient.addColorStop(1,'#80a127');
    ctx.fillStyle = gradient;ctx.beginPath();ctx.moveTo(256+Math.cos(start)*15,256+Math.sin(start)*15);ctx.arc(256,256,222,start,end);ctx.closePath();ctx.fill();
    for(let cell = 0; cell < 110; cell++) {
      const angle=start+rnd()*(end-start),radius=25+rnd()*190;
      ctx.save();ctx.translate(256+Math.cos(angle)*radius,256+Math.sin(angle)*radius);ctx.rotate(angle);
      ctx.fillStyle = rnd()>.4?'#ecf3a54d':'#648b2538';ctx.beginPath();ctx.ellipse(0,0,3+rnd()*7,1+rnd()*3,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  ctx.fillStyle='#edf0c0';ctx.beginPath();ctx.arc(256,256,16,0,Math.PI*2);ctx.fill();
  return texture(canvas);
}
function lime(group, name, position, rotation, scale, map) {
  const slice = new THREE.Group(); slice.name = name; slice.position.set(...position);slice.rotation.set(...rotation);slice.scale.setScalar(scale);group.add(slice);
  const skin = physical({color:0x416e18,roughness:.48,metalness:0,clearcoat:.35});
  const rim = mesh(slice,'Textured lime rind',new THREE.CylinderGeometry(.39,.39,.072,64),skin);rim.rotation.x=Math.PI/2;
  const flesh = new THREE.MeshStandardMaterial({map,roughness:.48,side:THREE.DoubleSide});
  mesh(slice,'Lime pulp front',new THREE.CircleGeometry(.39,64),flesh,[0,0,.037]);
  const back = mesh(slice,'Lime pulp back',new THREE.CircleGeometry(.39,64),flesh,[0,0,-.037]);back.rotation.y=Math.PI;
  const rnd = random(32);
  const pores=new THREE.InstancedMesh(new THREE.SphereGeometry(.006,4,3),skin,75);pores.name='Rind pores';slice.add(pores);
  const pose=new THREE.Object3D();
  for(let i=0;i<75;i++) {const a=rnd()*Math.PI*2;pose.position.set(.391*Math.cos(a),.391*Math.sin(a),(rnd()-.5)*.065);pose.updateMatrix();pores.setMatrixAt(i,pose.matrix);}
}
export async function createBottle() {
  // Load before rasterizing so the exported label matches the website typography.
  await Promise.allSettled([document.fonts.load('100px Anton')]);
  const group = new THREE.Group();group.name='Pin Shot VSL bottle';
  group.userData={source:'assets/pin-shot-vsl.jpeg',note:'Visual concept reconstructed from a single front render. Back, top, base and internal geometry are approximations. Not an engineering model.'};
  const glass = physical({color:0xd8eebb,roughness:.075,metalness:0,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.4});
  const edge = physical({color:0xdde7d2,roughness:.12,metalness:.08,transparent:true,opacity:.32,depthWrite:false,clearcoat:1});
  lathe(group,'Rounded clear glass bottle',[[0,.03],[.73,.03],[.88,.055],[.96,.14],[1.0,.3],[1.015,.55],[1.015,1.86],[1.0,2.03],[.96,2.17],[.88,2.3],[.75,2.39],[.61,2.46],[.59,2.62],[.59,2.73],[.54,2.74],[.54,2.59],[.55,2.48],[.71,2.34],[.84,2.25],[.92,2.11],[.958,1.94],[.969,.4],[.94,.24],[.83,.17],[0,.17]],glass);
  const fluid = physical({color:0xbdde50,roughness:.25,metalness:0,transparent:true,opacity:.73,depthWrite:false,clearcoat:.25,envMapIntensity:.3});
  lathe(group,'Pale lime soda mixer',[[0,.18],[.8,.18],[.91,.24],[.962,.42],[.969,1.9],[.95,2.06],[.92,2.12],[0,2.12]],fluid);
  band(group,'Liquid meniscus',.919,.012,2.12,edge);
  for(const y of [.16,.24,.34,.46]) band(group,'Molded glass base rib',y<.3?.94:.99,.016,y,edge);
  band(group,'Glass neck lip',.598,.026,2.58,edge);
  band(group,'Shoulder seam',.607,.014,2.48,edge);
  mesh(group,'Black printed front label',new THREE.CylinderGeometry(1.021,1.021,1.79,64,1,true,-.69,1.38),new THREE.MeshStandardMaterial({map:labelTexture(),transparent:true,alphaTest:.1,roughness:.7,metalness:0,side:THREE.FrontSide}),[0,1.29,0]);
  const limeMap = limeTexture();
  lime(group,'Left lime slice',[-.61,1.23,.23],[.05,.8,-.34],.99,limeMap);
  lime(group,'Upper right lime slice',[.62,1.62,.23],[-.1,-.8,.36],.94,limeMap);
  lime(group,'Lower right lime slice',[.64,.72,.29],[.14,-.7,-.18],.74,limeMap);
  lime(group,'Rear lime slice',[-.24,1.23,-.59],[.12,Math.PI+.24,.25],.96,limeMap);
  lime(group,'Rear lower lime slice',[.48,.52,-.46],[.1,Math.PI-.52,-.22],.7,limeMap);
  const bubbleMat=physical({color:0xe7f7c9,roughness:.02,transparent:true,opacity:.42,metalness:.08,depthWrite:false,clearcoat:1});
  const bubbleGeo=new THREE.SphereGeometry(1,10,8),rnd=random(91);
  const bubbles=new THREE.InstancedMesh(bubbleGeo,bubbleMat,115);bubbles.name='Soda bubbles';group.add(bubbles);
  const bubblePose=new THREE.Object3D();
  for(let i=0;i<115;i++) {
    const angle=rnd()*Math.PI*2,radius=.72+rnd()*.2,y=.3+rnd()*1.79;
    bubblePose.position.set(Math.sin(angle)*radius,y,Math.cos(angle)*radius);bubblePose.scale.setScalar(.008+rnd()*.022);bubblePose.updateMatrix();bubbles.setMatrixAt(i,bubblePose.matrix);
  }
  const dark=physical({color:0x292d24,roughness:.28,metalness:.2,clearcoat:.6});
  const smoke=physical({color:0x555c4a,roughness:.13,metalness:.12,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide,clearcoat:1});
  const cap = new THREE.Group();cap.name='Smoky ribbed shot chamber';group.add(cap);
  lathe(cap,'Transparent chamber shell',[[.57,2.69],[.615,2.73],[.63,2.79],[.63,3.61],[.61,3.7],[.56,3.74],[0,3.74],[0,3.69],[.55,3.69],[.575,3.6],[.575,2.78],[.57,2.69]],smoke);
  mesh(cap,'Lower locking collar',new THREE.CylinderGeometry(.635,.615,.17,96),dark,[0,2.72,0]);
  band(cap,'Lower chamber bead',.617,.019,2.84,dark);
  const shotMat=physical({color:0xf0f1e6,roughness:.11,transparent:true,opacity:.32,depthWrite:false,clearcoat:.9});
  lathe(cap,'Sealed shot reservoir',[[0,2.87],[.31,2.87],[.45,2.95],[.51,3.07],[.52,3.48],[0,3.48]],shotMat);
  band(cap,'Shot fill surface',.51,.012,3.48,edge);
  const ribGeo=new THREE.CapsuleGeometry(.011,.58,3,6);
  for(let i=0;i<38;i++) {const a=i*Math.PI*2/38;mesh(cap,'Vertical chamber grip rib',ribGeo,smoke,[.633*Math.sin(a),3.19,.633*Math.cos(a)]);}
  lathe(cap,'Rounded smoky lid',[[0,3.65],[.61,3.65],[.64,3.72],[.64,3.84],[.62,3.9],[.57,3.94],[0,3.94]],smoke);
  band(cap,'Lid perimeter seam',.625,.018,3.72,dark);
  band(cap,'Lid rim highlight',.577,.012,3.931,edge);
  mesh(cap,'Pull-pin retaining spine',new THREE.BoxGeometry(.105,1.08,.16),dark,[.655,3.19,0]);
  mesh(cap,'Latch hinge',new THREE.SphereGeometry(.081,16,12),dark,[.654,2.67,0]);
  const hinge=mesh(cap,'Upper lid hinge',new THREE.CylinderGeometry(.066,.066,.15,20),dark,[-.633,3.62,0]);hinge.rotation.x=Math.PI/2;
  const copper=physical({color:0xd0703a,roughness:.25,metalness:.83,clearcoat:.25});
  const pin = new THREE.Group();pin.name='Copper pull ring';group.add(pin);
  const stem=mesh(pin,'Copper pin stem',new THREE.CylinderGeometry(.047,.047,.23,24),copper,[.759,2.83,0]);stem.rotation.z=Math.PI/2;
  mesh(pin,'Copper ring',new THREE.TorusGeometry(.272,.041,16,96),copper,[1.12,2.83,0]);
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return {group,cap,pin};
}
