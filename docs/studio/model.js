import * as THREE from 'three';
import { addMechanism } from './mechanism.js?v=pin-gate-1';
import { createMotion, stir, advance, waveAt } from './liquid-motion.mjs?v=clear-liquid-1';

// Camera projection is defined in the original photograph's pixel coordinates.
// The source JPEG is copied byte-for-byte; the central front label is never redrawn.
export const SOURCE = { width: 823, height: 1024, scale: 250, centerX: 411.5, centerY: 512 };
const X = px => (px - SOURCE.centerX) / SOURCE.scale;
const Y = py => (SOURCE.height - py) / SOURCE.scale;
const uv = (px, py) => [px / SOURCE.width, 1 - py / SOURCE.height];

// [image y, left silhouette, right silhouette], traced from the approved render.
const bodyOutline = [
  [355,271,551],[364,274,551],[377,277,552],[390,273,555],
  [397,257,570],[407,240,586],[419,225,604],[433,210,619],
  [451,194,635],[473,181,646],[498,170,654],[526,162,660],
  [558,158,664],[600,157,665],[650,157,667],[700,157,667],
  [751,157,666],[793,160,664],[824,165,660],[845,169,656],
  [861,166,657],[875,171,654],[892,175,651],[910,180,646],
  [927,186,639],[944,195,630],[959,206,619],[964,212,613]
];
const capOutline = [
  [36,369,455],[38,338,488],[41,311,514],[45,289,536],
  [50,276,549],[60,265,558],[75,262,561],[95,262,561],
  [116,262,560],[134,260,560],[172,260,559],[222,260,559],
  [269,260,558],[303,261,558],[316,263,557],[344,264,556],
  [356,266,554],[364,272,549],[370,290,540]
];
function interpolate(outline, y) {
  let i = 0;
  while (i < outline.length - 2 && y > outline[i + 1][0]) i++;
  const a = outline[i], b = outline[i + 1], t = THREE.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
  return [THREE.MathUtils.lerp(a[1], b[1], t), THREE.MathUtils.lerp(a[2], b[2], t)];
}
// Equal-angle UVs cover the complete circumference. The photograph is a feathered
// front decal, never an edge strip expanded over the rear or collapsed into a pole.
function shell(outline, start, end, project = false, alpha = () => 1) {
  const rows = Math.ceil((outline.at(-1)[0] - outline[0][0]) / 3), segments = 192;
  const positions = [], uvs = [], colors = [], indices = [];
  for (let row = 0; row <= rows; row++) {
    const y = THREE.MathUtils.lerp(outline[0][0], outline.at(-1)[0], row / rows);
    const [left, right] = interpolate(outline, y), center = (left + right) / 2, radius = (right - left) / 2;
    for (let col = 0; col <= segments; col++) {
      const theta = THREE.MathUtils.lerp(start, end, col / segments);
      const px = center + radius * Math.sin(theta);
      positions.push(X(px), Y(y), Math.cos(theta) * radius / SOURCE.scale);
      // The texture's seam is at the front center, completely under the source decal.
      uvs.push(...(project ? uv(px, y) : [theta / (2 * Math.PI), 1 - (y - 395) / 555]));
      colors.push(1, 1, 1, alpha(theta, y));
    }
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < segments; col++) {
    const a = row * (segments + 1) + col, b = a + segments + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}
const smooth = THREE.MathUtils.smoothstep;
function mesh(geometry, material, name) {
  const object = new THREE.Mesh(geometry, material); object.name = name; return object;
}
function layer(material, order) {
  const m = material.clone();
  m.transparent = true; m.depthWrite = false; m.vertexColors = true;
  m.side = THREE.FrontSide; m.polygonOffset = true;
  m.polygonOffsetFactor = -order; m.polygonOffsetUnits = -order;
  return m;
}
function lathe(points, material, name, centerX = 0) {
  const g = new THREE.LatheGeometry(points.map(([r,y]) => new THREE.Vector2(r,y)), 128);
  g.translate(centerX,0,0);
  return mesh(g, material, name);
}
function ring(radius, tube, y, material, name, centerX = 0) {
  const g = new THREE.TorusGeometry(radius, tube, 16, 128);
  g.rotateX(Math.PI / 2); g.translate(centerX,y,0);
  return mesh(g,material,name);
}
function projectGeometry(geometry, position, name, material) {
  geometry.translate(...position);
  const positions = geometry.getAttribute('position'), uvs = [];
  for (let i = 0; i < positions.count; i++) uvs.push(...uv(positions.getX(i) * SOURCE.scale + SOURCE.centerX, SOURCE.height - positions.getY(i) * SOURCE.scale));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  const object = new THREE.Mesh(geometry, material);object.name = name;return object;
}
function extrudedOutline(points, depth, z, name, material) {
  const shape = new THREE.Shape(points.map(([x,y]) => new THREE.Vector2(X(x),Y(y))));
  const geometry = new THREE.ExtrudeGeometry(shape, {depth,bevelEnabled:false,curveSegments:12,steps:1});
  const object=projectGeometry(geometry,[0,0,z-depth/2],name,material);
  const edge=new THREE.MeshStandardMaterial({color:'#66695e',roughness:.3,metalness:.25});
  object.material=[material,edge];
  return object;
}
// Derive a runtime print mask while retaining the reference's RGB pixels.
// Dark ink and saturated lime remain; pale photographed soda becomes transparent.
function printedArtwork(texture, front) {
  const image=texture.image, canvas=document.createElement('canvas');
  canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
  for(let i=0;i<data.length;i+=4) {
    const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
    const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width);
    const luminance=.2126*r+.7152*g+.0722*b;
    const ink=front && x>248 && x<571 && y>431 && y<933 ? 1-smooth(luminance,.21,.48) : 0;
    const lime=smooth(g-b,.13,.31)*smooth(g-r,-.05,.015)*(1-smooth(luminance,.81,.94));
    const vertical=front?smooth(y,446,482)*(1-smooth(y,854,917)):1;
    data[i+3]=Math.round(255*Math.max(ink,lime*vertical));
  }
  ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=16;
  map.name=front?'Original front ink and lime print':'Reconstructed rear lime print';
  return new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.FrontSide,toneMapped:false});
}
function makeLiquid() {
  const state=createMotion(),group=new THREE.Group();group.name='Animated lime soda';
  const level=2.29;
  const material=new THREE.MeshPhysicalMaterial({color:'#d7e898',roughness:.16,metalness:0,transparent:true,opacity:.48,depthWrite:false,side:THREE.DoubleSide,clearcoat:1,clearcoatRoughness:.08});
  material.name='Translucent lime soda';
  const points=[[0,.205],[.65,.205]];
  for(let py=962;py>=452;py-=6) {
    const [left,right]=interpolate(bodyOutline,py);points.push([(right-left)/500-.043,Y(py)]);
  }
  const [left,right]=interpolate(bodyOutline,1024-level*250),radius=(right-left)/500-.043;
  points.push([radius,level]);
  const volume=lathe(points,material,'Contained soda volume');volume.renderOrder=5;group.add(volume);
  const positions=[0,level,0],indices=[],rings=20,segments=96;
  for(let r=1;r<=rings;r++)for(let col=0;col<=segments;col++) {
    const angle=col/segments*Math.PI*2,rad=radius*r/rings;
    positions.push(Math.sin(angle)*rad,level,Math.cos(angle)*rad);
  }
  for(let col=0;col<segments;col++)indices.push(0,1+col,2+col);
  for(let r=1;r<rings;r++)for(let col=0;col<segments;col++) {
    const a=1+(r-1)*(segments+1)+col,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const surfaceMaterial=material.clone();surfaceMaterial.opacity=.62;surfaceMaterial.color.set('#e4efb7');surfaceMaterial.roughness=.11;surfaceMaterial.name='Moving soda meniscus';
  const surface=mesh(geometry,surfaceMaterial,'Dynamic liquid surface');surface.renderOrder=6;group.add(surface);
  const bubbleMaterial=new THREE.MeshPhysicalMaterial({color:'#f9ffe8',roughness:.08,metalness:.1,transparent:true,opacity:.65,depthWrite:false});bubbleMaterial.name='Carbonation bubbles';
  const bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),bubbleMaterial,100);bubbles.name='Rising carbonation';bubbles.renderOrder=8;group.add(bubbles);
  const dummy=new THREE.Object3D(),seeds=Array.from({length:100},(_,i)=>({phase:((i*61)%101)/101,angle:i*2.399963,rad:.15+((i*37)%97)/97*.77,size:.008+((i*17)%31)/31*.014,speed:.09+((i*13)%41)/41*.17}));
  const rest=volume.geometry.attributes.position.array.slice(),topRest=geometry.attributes.position.array.slice();
  const innerRadius=y=>{const [a,b]=interpolate(bodyOutline,1024-y*250);return (b-a)/500-.043;};
  function update(delta,playing=true) {
    advance(state,delta,playing);
    const top=geometry.attributes.position;
    for(let i=0;i<top.count;i++) {
      const x=topRest[i*3],z=topRest[i*3+2],y=level+waveAt(state,x,z);
      const scale=Math.min(1,innerRadius(y)/(Math.hypot(x,z)||1));top.setXYZ(i,x*scale,y,z*scale);
    }
    top.needsUpdate=true;geometry.computeVertexNormals();
    const side=volume.geometry.attributes.position;
    for(let i=0;i<side.count;i++) {
      const y=rest[i*3+1],weight=smooth(y,level-.45,level);
      const x=rest[i*3],z=rest[i*3+2],movedY=y+waveAt(state,x,z)*weight;
      const scale=weight?Math.min(1,innerRadius(movedY)/(Math.hypot(x,z)||1)):1;
      side.setXYZ(i,x*scale,movedY,z*scale);
    }
    side.needsUpdate=true;volume.geometry.computeVertexNormals();
    seeds.forEach((seed,i)=>{
      const progress=(seed.phase+state.time*seed.speed)%1,y=.26+progress*(level-.29);
      const [a,b]=interpolate(bodyOutline,1024-y*250),available=(b-a)/500-.095;
      const angle=seed.angle+Math.sin(state.time*.6+seed.phase*7)*(.025+state.energy*.14);
      const bx=Math.sin(angle)*available*seed.rad,bz=Math.cos(angle)*available*seed.rad;
      dummy.position.set(bx,y+waveAt(state,bx,bz)*Math.pow(progress,4),bz);
      const fade=Math.min(1,progress*12,(1-progress)*15);dummy.scale.setScalar(Math.max(.0001,seed.size*fade));dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix);
    });bubbles.instanceMatrix.needsUpdate=true;
  }
  update(0);
  return {group,state,update,stir:(x,z)=>stir(state,x,z),level};
}
export async function createBottle() {
  const loader=new THREE.TextureLoader();
  const [map,rearMap]=await Promise.all([loader.loadAsync(new URL('./vsl-source.jpeg',import.meta.url).href),loader.loadAsync(new URL('./vsl-rear-texture.png',import.meta.url).href)]);
  for(const texture of [map,rearMap]){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=16;}
  const material=new THREE.MeshBasicMaterial({map,side:THREE.FrontSide,toneMapped:false});material.name='Unchanged original VSL photograph';
  const frontPrint=printedArtwork(map,true),rearPrint=printedArtwork(rearMap,false);
  frontPrint.name='Original front printed ink and limes';rearPrint.name='Rear printed lime artwork';
  const glass=new THREE.MeshPhysicalMaterial({color:'#edf3ef',roughness:.09,metalness:.05,transparent:true,opacity:.17,depthWrite:false,side:THREE.FrontSide,clearcoat:1,clearcoatRoughness:.06,ior:1.46});glass.name='Clear bottle glass';
  const smoke=glass.clone();smoke.color.set('#cbd3cd');smoke.opacity=.23;smoke.roughness=.13;smoke.name='Transparent lid all around';
  const dark=new THREE.MeshStandardMaterial({color:'#555c52',roughness:.32,metalness:.1,transparent:true,opacity:.64,depthWrite:false});dark.name='Cap molded seals';
  const copper=new THREE.MeshStandardMaterial({color:'#a56536',metalness:.65,roughness:.3});copper.name='Copper edges and rear';
  const group=new THREE.Group();group.name='VSL clear bottle with animated soda';
  group.userData={source:'assets/pin-shot-vsl.jpeg',method:'Clear glass and lid, source-image printed artwork, separate lime soda volume and animated carbonation.',limitation:'Hidden geometry and print masks are inferred from one reference. Liquid motion is a visual wave simulation, not computational fluid dynamics. Export contains a static liquid pose.'};
  const body=new THREE.Group();body.name='Original-image bottle surface';
  const bodyGlass=mesh(shell(bodyOutline,0,Math.PI*2),glass,'Clear bottle wall');bodyGlass.renderOrder=20;body.add(bodyGlass);
  const rear=mesh(shell(bodyOutline,0,Math.PI*2,false,(_,y)=>smooth(y,396,460)*(1-smooth(y,875,975))),layer(rearPrint,1),'Continuous cylindrical rear artwork');rear.renderOrder=25;
  // Fade rear printing out under the front artwork; the beverage itself has no texture.
  const rearColor=rear.geometry.attributes.color;
  for(let i=0;i<rearColor.count;i++) {
    const u=rear.geometry.attributes.uv.getX(i),theta=Math.min(u,1-u)*Math.PI*2;
    rearColor.setW(i,rearColor.getW(i)*smooth(theta,.68,1.45));
  }
  body.add(rear);
  const front=mesh(shell(bodyOutline,-Math.PI/2,Math.PI/2,true,(theta,y)=>(1-smooth(Math.abs(theta),.78,1.53))*(1-smooth(y,926,982))),layer(frontPrint,2),'Exact source-image front');front.renderOrder=26;body.add(front);group.add(body);
  const liquid=makeLiquid();group.add(liquid.group);
  const cap=new THREE.Group();cap.name='Transparent cap and visible shot chamber';group.add(cap);
  const capWall=mesh(shell(capOutline,0,Math.PI*2),smoke,'Transparent cap wall');capWall.renderOrder=20;cap.add(capWall);
  const cx=X(412);
  const crown=lathe([[.578,Y(70)],[.54,Y(54)],[.45,Y(43)],[.32,Y(37)],[.16,Y(35)],[0,Y(35)]],smoke,'Smooth transparent lid crown',cx);crown.renderOrder=20;cap.add(crown);
  const chamberGlass=glass.clone();chamberGlass.opacity=.33;chamberGlass.side=THREE.DoubleSide;chamberGlass.name='Clear internal shot chamber';
  const chamber=lathe([[.222,2.803],[.222,2.92],[.29,3.07],[.39,3.17],[.445,3.34],[.445,3.74]],chamberGlass,'Visible internal shot cup',cx);chamber.renderOrder=12;cap.add(chamber);
  const shot=glass.clone();shot.color.set('#f1f3e8');shot.opacity=.24;shot.side=THREE.DoubleSide;shot.name='Clear spirit in shot chamber';
  const spirit=lathe([[0,2.809],[.208,2.809],[.208,2.92],[.26,3.11],[.35,3.2],[.4,3.34],[.4,3.57],[0,3.57]],shot,'Sealed clear shot',cx);spirit.renderOrder=11;cap.add(spirit);
  cap.add(ring(.449,.012,3.735,chamberGlass,'Shot chamber rim',cx));
  cap.add(ring(.574,.009,Y(94),dark,'Lid parting line',cx));
  cap.add(ring(.584,.01,Y(109),smoke,'Lid rolled rim',cx));
  const collar=lathe([[.565,Y(348)],[.579,Y(345)],[.583,Y(313)],[.57,Y(309)]],dark,'Cap lower seal collar',cx);collar.renderOrder=21;cap.add(collar);
  for(let i=0;i<64;i++) {
    const theta=i*Math.PI*2/64;
    const rib=new THREE.Mesh(new THREE.CapsuleGeometry(.006,.57,3,6),smoke);
    rib.position.set(cx+.596*Math.sin(theta),Y(215),.596*Math.cos(theta));rib.renderOrder=21;
    rib.name='Transparent cap grip rib';cap.add(rib);
  }
  cap.add(extrudedOutline([[266,96],[253,98],[246,105],[243,116],[247,127],[256,132],[268,130]],.12,.03,'Lid hinge',material));
  cap.add(extrudedOutline([[557,89],[575,92],[586,100],[591,111],[592,293],[590,305],[579,309],[569,302],[567,129],[558,128]],.13,.055,'Rear latch rail',material));
  cap.add(extrudedOutline([[556,126],[568,127],[574,136],[575,345],[579,351],[589,355],[596,365],[596,373],[591,382],[582,387],[567,387],[558,381],[552,368],[553,351]],.15,.15,'Pull-pin latch',material));
  const pin=new THREE.Group();pin.name='Original-image copper pull ring';group.add(pin);
  const stemGeometry=new THREE.CylinderGeometry(.046,.046,.138,32);stemGeometry.rotateZ(Math.PI/2);
  pin.add(projectGeometry(stemGeometry,[X(592),Y(332),.085],'Copper stem',material));
  const ringGeometry=new THREE.TorusGeometry(65/250,10.5/250,24,144);ringGeometry.scale(1,1.005,1);
  pin.add(projectGeometry(ringGeometry,[X(675.5),Y(332.5),.085],'Photographed copper ring',material));
  const foot=glass.clone();foot.opacity=.28;foot.name='Clear glass underside';
  const bottom=lathe([[0,Y(978)],[.4,Y(978)],[.53,Y(985)],[.59,Y(991)],[.69,Y(987)],[.76,Y(978)],[.802,Y(964)]],foot,'Recessed glass underside',X(417));bottom.renderOrder=20;group.add(bottom);
  group.add(ring(.63,.012,Y(989),glass,'Glass base contact ring',X(417)));
  const backs=[];
  for(const object of pin.children) {
    const back=object.clone();back.geometry=object.geometry.clone();back.material=copper;
    const normals=object.geometry.getAttribute('normal'),index=object.geometry.index,frontIndices=[],backIndices=[];
    for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);(normals.getZ(a)+normals.getZ(b)+normals.getZ(c)>1.2?frontIndices:backIndices).push(a,b,c);}
    object.geometry.setIndex(frontIndices);back.geometry.setIndex(backIndices);back.name=object.name+' copper rear';backs.push(back);
  }
  pin.add(...backs);
  const mechanism=addMechanism({group,cap,pin,liquid});
  return {group,cap,pin,liquid,mechanism};
}
