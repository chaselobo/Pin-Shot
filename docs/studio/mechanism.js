import * as THREE from 'three';
import {mechanismPose} from './mechanism-motion.mjs?v=pin-gate-1';
export function addMechanism({group,cap,pin,liquid}) {
  const copper=new THREE.MeshStandardMaterial({color:'#c97b40',metalness:.4,roughness:.29});copper.name='One-piece gate paddle';
  const rubber=new THREE.MeshStandardMaterial({color:'#404a43',roughness:.85});rubber.name='Gate gaskets and exit seal';
  const gateY=2.768;
  const paddle=new THREE.Mesh(new THREE.BoxGeometry(.66,.029,.59),copper);paddle.position.set(0,gateY,0);paddle.name='Flat sealing paddle on pin';pin.add(paddle);
  const stem=new THREE.Mesh(new THREE.BoxGeometry(.40,.026,.05),copper);stem.position.set(.52,gateY,.085);stem.name='Internal pin stem';pin.add(stem);
  const mechanism=new THREE.Group();mechanism.name='A2 gate and gasket assembly';group.add(mechanism);
  for(const [y,name] of [[gateY+.035,'Upper shot-side gasket'],[gateY-.035,'Lower mixer-side gasket']]) {
    const shape=new THREE.Shape();shape.absarc(0,0,.345,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absarc(0,0,.222,0,Math.PI*2,true);shape.holes.push(hole);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.021,bevelEnabled:false,curveSegments:64});geometry.rotateX(-Math.PI/2);
    const gasket=new THREE.Mesh(geometry,rubber);gasket.position.y=y-.01;gasket.name=name;mechanism.add(gasket);
  }
  for(const y of [gateY+.04,gateY-.04]) {
    const seal=new THREE.Mesh(new THREE.BoxGeometry(.032,.028,.63),rubber);seal.position.set(.59,y,0);seal.name='Self-closing exit seal lip';mechanism.add(seal);
  }
  const flapHinge=new THREE.Group();flapHinge.position.set(.455,gateY+.052,0);mechanism.add(flapHinge);
  const flap=new THREE.Mesh(new THREE.BoxGeometry(.11,.012,.56),rubber);flap.position.x=.055;flap.name='Retained flap at pin exit';flapHinge.add(flap);
  const streamMat=new THREE.MeshPhysicalMaterial({color:'#a4def1',roughness:.1,transparent:true,opacity:.52,depthWrite:false,side:THREE.DoubleSide});streamMat.name='Illustrative draining shot';
  const stream=new THREE.Mesh(new THREE.CylinderGeometry(.135,.10,.47,32,8,true),streamMat);stream.position.set(-.055,2.515,0);stream.renderOrder=14;stream.name='Shot drains through open throat';stream.visible=false;group.add(stream);
  const shot=cap.getObjectByName('Sealed clear shot'),shotRest=shot.geometry.attributes.position.array.slice();
  const shotColor=shot.material.color.clone(),shotOpacity=shot.material.opacity;
  const soda=liquid.group.getObjectByName('Contained soda volume'),sodaColor=soda.material.color.clone();
  const cutPlane=new THREE.Plane(new THREE.Vector3(0,0,-1),.015),clipped=[];
  // Open the near half of the housing and cup; leave the paddle and gaskets whole.
  for(const object of [...cap.children,group.getObjectByName('Clear bottle wall')]) {
    if(!object?.isMesh || ['Lid hinge','Rear latch rail','Pull-pin latch'].includes(object.name))continue;
    object.material=object.material.clone();clipped.push(object);
  }
  const hidden=cap.children.filter(o=>['Transparent cap grip rib','Lid hinge','Rear latch rail','Pull-pin latch'].includes(o.name));
  const front=group.getObjectByName('Exact source-image front'),rear=group.getObjectByName('Continuous cylindrical rear artwork');
  let enabled=false,progress=0,playing=false,elapsed=0;
  function setCutaway(value) {
    enabled=value;
    clipped.forEach(o=>{o.material.clippingPlanes=value?[cutPlane]:null;o.material.needsUpdate=true;});
    hidden.forEach(o=>o.visible=!value);front.visible=rear.visible=!value;
    shot.material.color.copy(value?new THREE.Color('#94dcec'):shotColor);shot.material.opacity=value?.64:shotOpacity;
    // Internal gate highlighting belongs to the cutaway; the original exterior hides it behind the collar.
    paddle.visible=stem.visible=value;mechanism.visible=value;
  }
  function setProgress(value) {
    progress=THREE.MathUtils.clamp(value,0,1);const pose=mechanismPose(progress);
    pin.position.x=pose.pull*1.04;flapHinge.rotation.z=-pose.flap*Math.PI/2;
    const vertices=shot.geometry.attributes.position;
    for(let i=0;i<vertices.count;i++) {
      const x=shotRest[i*3],z=shotRest[i*3+2],y=2.809+(shotRest[i*3+1]-2.809)*(1-pose.drained);
      const section=[[2.809,.208],[2.92,.208],[3.11,.26],[3.2,.35],[3.34,.4],[3.57,.4]];
      let j=0;while(j<section.length-2&&y>section[j+1][0])j++;
      const [ay,ar]=section[j],[by,br]=section[j+1],radius=THREE.MathUtils.lerp(ar,br,THREE.MathUtils.clamp((y-ay)/(by-ay),0,1));
      const scale=Math.min(1,radius/(Math.hypot(x,z)||1));vertices.setXYZ(i,x*scale,y,z*scale);
    }
    vertices.needsUpdate=true;shot.geometry.computeVertexNormals();shot.visible=pose.drained<.999;
    stream.visible=enabled&&pose.flow;stream.position.x=-.222*(1-pose.opening);stream.scale.x=stream.scale.z=Math.min(.98,pose.opening*1.64);
    soda.material.color.copy(sodaColor).lerp(new THREE.Color('#dfebb1'),pose.drained*.35);
    return pose;
  }
  function update(delta) {
    if(playing){elapsed+=delta;setProgress(elapsed/5.5);if(progress>=1){playing=false;liquid.stir(.9,.5);}}
    if(stream.visible)stream.scale.z=Math.min(.98,mechanismPose(progress).opening*1.64)*(1+Math.sin(elapsed*19)*.015);
    return { ...mechanismPose(progress),playing,enabled };
  }
  setCutaway(false);setProgress(0);
  return {setCutaway,setProgress,update,play(){if(progress>=1)setProgress(0);elapsed=progress*5.5;playing=true;},pause(){playing=false;},reset(){playing=false;elapsed=0;setProgress(0);},get enabled(){return enabled;}};
}
