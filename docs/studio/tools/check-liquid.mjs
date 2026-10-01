import assert from 'node:assert/strict';
import {createMotion,stir,advance,waveAt} from '../liquid-motion.mjs';
const run=hz=>{const s=createMotion();stir(s);for(let i=0;i<hz*3;i++)advance(s,1/hz);return s;};
const slow=run(30),fast=run(120);
for(const key of ['x','z','vx','vz','energy','time'])assert.ok(Math.abs(slow[key]-fast[key])<1e-8,`Frame-rate dependence: ${key}`);
const s=createMotion();stir(s);advance(s,.1);const paused={...s};advance(s,1,false);assert.deepEqual(s,paused);
for(let i=0;i<3000;i++){
  if(i%9===0)stir(s,10,-10);
  advance(s,1/60);
  for(const [x,z] of [[0,0],[.85,0],[-.85,0],[0,.85]])assert.ok(Math.abs(waveAt(s,x,z))<=.11,'Waves must remain bounded after repeated input');
  assert.ok(Object.values(s).every(Number.isFinite));
}
for(let i=0;i<1200;i++)advance(s,1/60);
assert.ok(Math.abs(s.x)<1e-8&&Math.abs(s.z)<1e-8&&s.energy<1e-8,'Slosh must settle');
console.log('PASS: consistent at 30/120 fps, pause freezes motion, repeated impulses remain bounded, slosh settles.');
