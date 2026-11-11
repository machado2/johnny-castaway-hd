import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildTimeline} from '../web/dist/fidelity-motion.js';
import {buildWalkStudy,sampleWalkStudy,correspondence,warpPixels} from '../web/dist/walk-morph.js';
const base=new URL('../web/dist/assets/fidelity/',import.meta.url);
const source=JSON.parse(fs.readFileSync(new URL('source.json',base)));
const timeline=buildTimeline(source),study=buildWalkStudy(timeline);

test('study preserves every original key timestamp, pose and world position, and loops at the repeated pose',()=>{
  const keys=timeline.frames.filter(f=>f.kind==='walk'&&f.route===3).slice(0,9);
  assert.equal(study.keys[0].frame,study.keys.at(-1).frame);
  assert.equal(study.keys.at(-1).x-study.keys[0].x,57);
  for(let i=0;i<8;i++){
    const actual=sampleWalkStudy(study,study.keys[i].time);
    assert.equal(actual.step,0);assert.equal(actual.a.frame,keys[i].frame);
    assert.equal(actual.x,keys[i].x);assert.equal(actual.y,keys[i].y);
    assert(Math.abs(study.keys[i].time-(keys[i].time-keys[0].time))<1e-9);
  }
  assert.equal(sampleWalkStudy(study,study.duration).a.frame,keys[0].frame);
  for(const hz of [30,60,120,144])for(let i=0;i<hz;i++){
    const s=sampleWalkStudy(study,i/hz);
    assert(s.step>=0&&s.step<8);assert(s.x>=s.a.x&&s.x<=s.b.x);
    assert(s.y>=Math.min(s.a.y,s.b.y)&&s.y<=Math.max(s.a.y,s.b.y));
  }
});

test('accepted meshes do not fold; the incompatible leg crossing is explicitly rejected',()=>{
  const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  assert.equal(correspondence(3,4).valid,false);
  for(const a of [1,2,4,5,6,7,8]){
    const mesh=correspondence(a,a%8+1);assert(mesh.valid);
    for(const tri of mesh.triangles){
      const sign=Math.sign(area(...tri.map(i=>mesh.left[i])));
      for(let n=0;n<=256;n++){
        const t=n/256,p=tri.map(i=>mesh.left[i].map((v,j)=>v+(mesh.right[i][j]-v)*t));
        assert(sign*area(...p)>0,`fold in ${a} at ${t}`);
      }
    }
  }
});

test('triangle rasterization keeps shared edges opaque and transports colors without dark alpha fringes',()=>{
  const w=12,h=10,input=new Uint8ClampedArray(w*h*4),corners=[[0,0],[w,0],[w,h],[0,h]],triangles=[[0,1,2],[0,2,3]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)input.set([x*16,y*20,87,(x+y)%2?128:255],(y*w+x)*4);
  assert.deepEqual(warpPixels(input,w,h,corners,corners,triangles),input);
  const shifted=warpPixels(input,w,h,corners,corners.map(([x,y])=>[x+1,y]),triangles);
  for(let y=0;y<h;y++){
    assert.equal(shifted[(y*w)*4+3],0);
    for(let x=1;x<w;x++)assert.deepEqual(shifted.slice((y*w+x)*4,(y*w+x+1)*4),input.slice((y*w+x-1)*4,(y*w+x)*4));
  }
  const colored=new Uint8ClampedArray(w*h*4);
  colored.set([240,120,60,255],(4*w+4)*4);
  const fractional=warpPixels(colored,w,h,corners,corners.map(([x,y])=>[x+.5,y+.5]),triangles);
  for(let p=0;p<w*h;p++)if(fractional[p*4+3])assert.deepEqual([...fractional.slice(p*4,p*4+3)],[240,120,60]);
});

test('the revised sprite sheet and its reference assets match the study provenance',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('walk-study.json',base)));
  for(const [file,hash]of Object.entries(manifest.sha256))assert.equal(
    crypto.createHash('sha256').update(fs.readFileSync(new URL(file,base))).digest('hex'),hash);
  assert.deepEqual(manifest.restoredKeys,[1,2,3,4,5,6,7,8]);
  assert.equal(manifest.defaultSceneChanged,false);
});
