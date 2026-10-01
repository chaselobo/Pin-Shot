import * as THREE from 'three';
export function lightStudio(scene, renderer) {
  scene.add(new THREE.HemisphereLight(0xffffff,0xc7cdbd,1.6));
  for(const [position,intensity] of [[[4,7,6],2.2],[[-5,4,-3],1.5],[[2,-5,3],1.4]]) {
    const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.set(...position);scene.add(light);
  }
  // Broad softboxes make the clear glass edges visible from every view.
  const room=new THREE.Scene();room.background=new THREE.Color('#939b9d');
  for(const [x,y,z,w,h] of [[-4,3,2,2,7],[4,4,-2,2,8],[0,8,0,7,2],[0,2,-6,3,6]]) {
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
    panel.position.set(x,y,z);panel.lookAt(0,2,0);room.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.05);
  scene.environment=environment.texture;scene.environmentIntensity=.65;
  room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
  return environment;
}
