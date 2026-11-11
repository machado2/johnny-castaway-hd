import test from 'node:test';
import assert from 'node:assert/strict';
import {footAt,solveLeg,longestGroundRun} from '../web/dist/gait.js';

test('a planted foot does not slide as the character advances in either direction',()=>{
  for(const direction of [-1,1])for(const leg of [0,1]){
    for(let start=0;start<400;start+=.37){
      const a=footAt(start,leg),b=footAt(start+.01,leg);
      if(a.support&&b.support&&b.phase>a.phase){
        assert(Math.abs(direction*(start+a.forward)-direction*(start+.01+b.forward))<1e-9);
        assert.equal(a.lift,0);assert.equal(b.lift,0);
      }
    }
  }
});

test('feet alternate swing and support without teleporting at phase boundaries',()=>{
  for(let d=0;d<256;d+=.1){
    const a=footAt(d,0),b=footAt(d,1);
    assert(a.support||b.support,'At least one foot must support the body');
    assert(a.lift>=0&&b.lift>=0);
  }
  for(const d of [0,76.8,128,204.8,256]){
    const a=footAt(d-1e-7,0),b=footAt(d+1e-7,0);
    assert(Math.abs(a.forward-b.forward)<1e-5);
    assert(Math.abs(a.lift-b.lift)<1e-5);
  }
});

test('inverse kinematics preserves thigh and calf lengths, bending towards travel',()=>{
  for(const direction of [-1,1])for(const x of [-35,0,35]){
    const hip={x:0,y:0},ankle={x,y:80};
    const knee=solveLeg(hip,ankle,50,48,direction);
    assert(Math.abs(Math.hypot(knee.x,knee.y)-50)<1e-8);
    assert(Math.abs(Math.hypot(ankle.x-knee.x,ankle.y-knee.y)-48)<1e-8);
    const cross=ankle.y*knee.x-ankle.x*knee.y;
    assert(cross*direction>0);
  }
});

test('ground detection uses the contiguous opaque island, excluding transparency and stray pixels',()=>{
  const width=3,height=10,rgba=new Uint8Array(width*height*4);
  for(const y of [0,3,4,5,6])rgba[(y*width+1)*4+3]=255;
  assert.deepEqual(longestGroundRun(rgba,width,height,1),[3,6]);
  assert.equal(longestGroundRun(rgba,width,height,2),null);
});
