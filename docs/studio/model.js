import * as THREE from 'three';

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
function surface(name, outline, photo, baseMaterial, wrap = null) {
  const group = new THREE.Group(); group.name = name;
  group.add(mesh(shell(outline, 0, 2 * Math.PI), baseMaterial, name + ' solid'));
  if (wrap) {
    const artwork = mesh(shell(outline, 0, 2 * Math.PI, false,
      (_, y) => smooth(y, 396, 460) * (1 - smooth(y, 875, 975))), layer(wrap, 1), 'Continuous cylindrical rear artwork');
    artwork.renderOrder = 1; group.add(artwork);
  }
  const isBody = !!wrap;
  const front = mesh(shell(outline, -Math.PI / 2, Math.PI / 2, true,
    (theta, y) => (1 - smooth(Math.abs(theta), .78, 1.53)) *
      (isBody ? 1 - smooth(y, 926, 982) : smooth(y, 54, 105))), layer(photo, 2), 'Exact source-image front');
  front.renderOrder = 2; group.add(front);
  return group;
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
export async function createBottle() {
  const map = await new THREE.TextureLoader().loadAsync(new URL('./vsl-source.jpeg',import.meta.url).href);
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=16;
  const material=new THREE.MeshBasicMaterial({map,side:THREE.FrontSide,toneMapped:false});
  const rearMap=await new THREE.TextureLoader().loadAsync(new URL('./vsl-rear-texture.png',import.meta.url).href);
  rearMap.colorSpace=THREE.SRGBColorSpace;rearMap.anisotropy=16;
  const rear=new THREE.MeshBasicMaterial({map:rearMap,toneMapped:false});rear.name='Reconstructed lime soda wrap';
  const glass=new THREE.MeshPhysicalMaterial({color:'#e7ecd9',roughness:.22,metalness:0,clearcoat:1,clearcoatRoughness:.12});glass.name='Pale glass rounded foot and shoulder';
  const smoke=new THREE.MeshPhysicalMaterial({color:'#626459',roughness:.3,metalness:.18,clearcoat:.6});smoke.name='Smoky molded cap';
  const dark=smoke.clone();dark.color.set('#34382f');dark.name='Cap molded seams';
  const copper=new THREE.MeshStandardMaterial({color:'#a56536',metalness:.65,roughness:.3});copper.name='Copper edges and rear';
  material.name='Unchanged original VSL photograph';
  const group=new THREE.Group();group.name='VSL photo-textured 3D reconstruction';
  group.userData={source:'assets/pin-shot-vsl.jpeg',method:'Original front artwork with feathered projection, continuous generated lime-soda rear texture, and independent molded cap and glass base surfaces.',limitation:'Depth and hidden surfaces are inferred from one front image. Reflections and transparency are baked into the photograph. Not a scan or engineering model.'};
  group.add(surface('Original-image bottle surface',bodyOutline,material,glass,rear));
  const cap=new THREE.Group();cap.name='Original-image cap';
  cap.add(surface('Smoky cap and shot chamber',capOutline,material,smoke));
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
  // Independent molded crown: no photograph reaches its pole.
  const cx=X(412);
  cap.add(lathe([[.578,Y(70)],[.54,Y(54)],[.45,Y(43)],[.32,Y(37)],[.16,Y(35)],[0,Y(35)]],smoke,'Smooth molded lid crown',cx));
  cap.add(ring(.574,.013,Y(94),dark,'Lid parting line',cx));
  cap.add(ring(.584,.008,Y(109),smoke,'Lid rolled rim',cx));
  cap.add(ring(.575,.014,Y(310),dark,'Cap lower collar',cx));
  // Restrict added ribs to the reconstructed half so the original front stays intact.
  for(let i=0;i<35;i++) {
    const theta=1.48+i*(2*Math.PI-2*1.48)/34;
    const rib=new THREE.Mesh(new THREE.CapsuleGeometry(.008,.57,4,8),dark);
    rib.position.set(cx+.596*Math.sin(theta),Y(215),.596*Math.cos(theta));
    rib.name='Molded cap grip rib';cap.add(rib);
  }
  // A recessed underside and circular contact ring replace the image-textured pole.
  const foot=glass.clone();foot.color.set('#e2e8cf');foot.roughness=.24;foot.name='Glass underside';
  group.add(lathe([[0,Y(978)],[.4,Y(978)],[.53,Y(985)],[.59,Y(991)],[.69,Y(987)],[.76,Y(978)],[.802,Y(964)]],foot,'Recessed glass underside',X(417)));
  group.add(ring(.63,.012,Y(989),glass,'Glass base contact ring',X(417)));
  // The back of the photographed torus has its own copper finish.
  for(const object of pin.children) {
    const back=object.clone();back.geometry=object.geometry.clone();back.material=copper;
    // Keep the photograph only on forward-facing triangles of this solid.
    const normals=object.geometry.getAttribute('normal'),index=object.geometry.index;
    const frontIndices=[],backIndices=[];
    for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
      (normals.getZ(a)+normals.getZ(b)+normals.getZ(c)>1.2?frontIndices:backIndices).push(a,b,c);}
    object.geometry.setIndex(frontIndices);back.geometry.setIndex(backIndices);back.name=object.name+' copper rear';
    // Append after the traversal below to avoid revisiting the new meshes.
    object.userData.rear=back;
  }
  const backs=pin.children.map(o=>o.userData.rear);
  pin.children.forEach(o=>delete o.userData.rear);pin.add(...backs);
  return {group,cap,pin};
}
