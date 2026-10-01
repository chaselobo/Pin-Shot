import assert from 'node:assert/strict';
import {mechanismPose} from '../mechanism-motion.mjs';
assert.equal(mechanismPose(0).drained,0);assert.equal(mechanismPose(0).flow,false);
let previous=mechanismPose(0);
for(let i=0;i<=1000;i++){
  const p=mechanismPose(i/1000);
  assert.ok(p.pull>=previous.pull&&p.drained>=previous.drained);
  if(p.pull*1.04<=.108){assert.equal(p.opening,0);assert.equal(p.drained,0);assert.equal(p.flow,false);}
  if(p.flow)assert.ok(p.opening>0&&p.drained<1,'Flow requires an open throat and remaining shot');
  previous=p;
}
assert.equal(previous.drained,1);assert.equal(previous.pull,1);assert.equal(previous.flow,false);assert.equal(previous.phase,'mixed');
assert.deepEqual(mechanismPose(-1),mechanismPose(0));assert.deepEqual(mechanismPose(2),mechanismPose(1));
console.log('PASS: pin blocks flow while sealed; withdrawal precedes drainage; flow stops when empty; scrub endpoints are bounded.');
