import * as THREE from 'three';

// Camera projection is defined in the original photograph's pixel coordinates.
// The source JPEG is copied byte-for-byte; no label, fruit, glass or colors are redrawn.
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
  [927,186,639],[944,195,630],[959,206,619],[970,219,608],
  [979,239,593],[985,263,574],[990,300,548],[994,352,498],
  [996,401,444],[997,422,423]
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
function surface(name, outline, material, depthScale = 1) {
  const group = new THREE.Group();group.name=name;
  const rows=Math.ceil((outline.at(-1)[0]-outline[0][0])/3),segments=128;
  const make = (part, start, finish, side=0) => {
    const positions=[],uvs=[],indices=[],colors=[];
    for(let row=0;row<=rows;row++) {
      const y=THREE.MathUtils.lerp(outline[0][0],outline.at(-1)[0],row/rows);
      const [left,right]=interpolate(outline,y),center=(left+right)/2,radius=(right-left)/2;
      for(let col=0;col<=segments;col++) {
        const theta=THREE.MathUtils.lerp(start,finish,col/segments),sine=Math.sin(theta),cosine=Math.cos(theta);
        const px=center+radius*sine;
        positions.push(X(px),Y(y),cosine*radius/SOURCE.scale*depthScale);
        let sampleX=px;
        if(side) {
          const edgeBand=name==='Original-image bottle surface'?.71:.84;
          sampleX=center+radius*side*(edgeBand+(1-edgeBand)*Math.abs(sine));
        }
        uvs.push(...uv(sampleX,y));
        if(side===-1)colors.push(1,1,1,1-THREE.MathUtils.smoothstep(sine,-.32,.32));
      }
    }
    for(let row=0;row<rows;row++)for(let col=0;col<segments;col++) {
      const a=row*(segments+1)+col,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    if(colors.length)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    let faceMaterial=material;
    if(side===-1){faceMaterial=material.clone();faceMaterial.name='Blended original edge artwork';faceMaterial.transparent=true;faceMaterial.depthWrite=false;faceMaterial.vertexColors=true;faceMaterial.polygonOffset=true;faceMaterial.polygonOffsetFactor=-1;faceMaterial.polygonOffsetUnits=-1;}
    const mesh=new THREE.Mesh(geometry,faceMaterial);mesh.name=part;group.add(mesh);
  };
  make('Exact source-image front',-Math.PI/2,Math.PI/2);
  make('Inferred rear using right image edge',Math.PI/2,Math.PI*1.5,1);
  make('Blended left image edge',Math.PI/2,Math.PI*1.5,-1);
  group.userData={appearance:'Original pixels on the entire front hemisphere; original side artwork blended across the inferred rear.'};
  return group;
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
  return projectGeometry(geometry,[0,0,z-depth/2],name,material);
}
export async function createBottle() {
  const map = await new THREE.TextureLoader().loadAsync(new URL('./vsl-source.jpeg',import.meta.url).href);
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=16;
  const material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false});
  material.name='Unchanged original VSL photograph';
  const group=new THREE.Group();group.name='VSL photo-textured 3D reconstruction';
  group.userData={source:'assets/pin-shot-vsl.jpeg',method:'Full-volume mesh with original-image projection. Label, lime artwork, liquid and glass appearance are source-image pixels, not redraws.',limitation:'Depth and hidden surfaces are inferred from one front image. Reflections and transparency are baked into the photograph. Not a scan or engineering model.'};
  group.add(surface('Original-image bottle surface',bodyOutline,material));
  const cap=new THREE.Group();cap.name='Original-image cap';
  cap.add(surface('Smoky cap and shot chamber',capOutline,material));
  group.add(cap);
  // The hinge and right latch are real extruded solids with their photographed faces.
  cap.add(extrudedOutline([[266,96],[253,98],[246,105],[243,116],[247,127],[256,132],[268,130]],.12,.03,'Lid hinge',material));
  cap.add(extrudedOutline([[557,89],[575,92],[586,100],[591,111],[592,293],[590,305],[579,309],[569,302],[567,129],[558,128]],.13,.055,'Rear latch rail',material));
  cap.add(extrudedOutline([[556,126],[568,127],[574,136],[575,345],[579,351],[589,355],[596,365],[596,373],[591,382],[582,387],[567,387],[558,381],[552,368],[553,351]],.15,.15,'Pull-pin latch',material));
  const pin=new THREE.Group();pin.name='Original-image copper pull ring';
  group.add(pin);
  const stemGeometry=new THREE.CylinderGeometry(.046,.046,.138,32);stemGeometry.rotateZ(Math.PI/2);
  pin.add(projectGeometry(stemGeometry,[X(592),Y(332),.085],'Copper stem',material));
  const ringGeometry=new THREE.TorusGeometry(65/250,10.5/250,24,144);
  ringGeometry.scale(1,1.005,1);
  pin.add(projectGeometry(ringGeometry,[X(675.5),Y(332.5),.085],'Photographed copper ring',material));
  // Close the inferred ends so rotation exposes a complete solid, never a flat billboard.
  const top=new THREE.CircleGeometry(43/250,96);top.rotateX(-Math.PI/2);
  cap.add(projectGeometry(top,[X(412),Y(36),0],'Closed lid crown',material));
  const base=new THREE.CircleGeometry(.045,48);base.rotateX(Math.PI/2);
  group.add(projectGeometry(base,[X(423),Y(997),0],'Closed bottle base',material));
  return {group,cap,pin};
}
