import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {sampleFishing,buildFishingLoop,fishingBounds,layoutFishing,fishingSoundsBetween,smoothFishingLine} from '../web/dist/fishing-motion.js';
const base=new URL('../web/dist/assets/fishing/',import.meta.url);
const source=JSON.parse(fs.readFileSync(new URL('source.json',base)));
const walk=JSON.parse(fs.readFileSync(new URL('../fidelity/source.json',base)));
const restored=JSON.parse(fs.readFileSync(new URL('restored.json',base)));
const loop=buildFishingLoop(source,walk);
test('complete original fishing sequence retains every presentation and original sound event',()=>{
  assert.equal(source.provenance.record.ads_file,'FISHING.ADS');assert.equal(source.provenance.record.sequence,2);
  assert.equal(source.frames.length,352);assert.equal(source.duration,19.36);
  assert.deepEqual(loop.frames.slice(0,352),source.frames);
  assert.deepEqual(source.frames.flatMap(f=>f.sounds),[4,16,4,9]);
  assert.deepEqual(source.sounds,{'4':'4.wav','9':'9.wav','16':'14.wav'});
  for(const [i,f]of source.frames.entries())assert(Math.abs(f.time-i*.055)<1e-9);
});
test('fishing poses and source sheets are complete, registered and unmodified',()=>{
  assert.equal(source.poses.length,82);assert.equal(restored.poses.length,82);
  const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(new URL(name,base))).digest('hex');
  for(const [name,expected]of Object.entries(source.sourceFiles))assert.equal(hash(name),expected);
  for(const g of restored.groups)assert.equal(hash(g.file),g.sha256);
  assert.equal(hash(restored.water.file),restored.water.sha256);
  for(const p of source.poses){assert(p.recipe.length>0);assert(restored.poses[p.id].crop.every(Number.isFinite));}
  for(const f of source.frames)assert(Boolean(f.pose)!==Boolean(f.walk),'each presentation uses one complete character drawing');
});
test('line antialiasing preserves corners and endpoints instead of changing the cast',()=>{
  const points=Array.from({length:101},(_,x)=>[x,Math.round(x*.35),7]);
  const line=smoothFishingLine(points);assert.equal(line.length,2);
  assert.deepEqual(line[0],points[0]);assert.deepEqual(line.at(-1),points.at(-1));
  const corner=[[0,0],[1,0],[2,0],[2,1],[2,2],[2,3]];
  assert.deepEqual(smoothFishingLine(corner),[[0,0],[2,0],[2,3]]);
});
test('demo return uses only the extracted standing and turning poses at the same original position',()=>{
  for(const f of loop.frames.slice(352)){
    const id=f.bridge==='stand'?walk.standing[4]:walk.turning[4];
    const p=walk.walks.find(w=>w.id===id).frames[f.direction];
    assert.deepEqual(f.walk,{index:p.frame,x:p.x,y:p.y,flags:p.flip_x?2:0});
  }
  assert.equal(loop.frames.at(-1).direction,2);
});
test('30 to 144 Hz display rates cannot interpolate poses or alter the original cadence',()=>{
  for(const hz of [30,60,90,120,144])for(let i=0;i<loop.duration*hz;i++){
    const time=i/hz,actual=sampleFishing(loop,time),expected=loop.frames[Math.floor((time+1e-9)/.055)];
    assert.deepEqual(actual.pose,expected.pose);assert.deepEqual(actual.walk,expected.walk);
  }
  assert.equal(sampleFishing(loop,loop.duration).index,0);
});
test('fishing sounds play once when crossed, including loop boundaries, never on redraw',()=>{
  for(const hz of [30,60,144]){
    let actual=[];for(let t=0;t<loop.duration*2;t+=1/hz)actual.push(...fishingSoundsBetween(loop,t,Math.min(t+1/hz,loop.duration*2)));
    assert.deepEqual(actual,[4,16,4,9,4,16,4,9]);
  }
  assert.deepEqual(fishingSoundsBetween(loop,5,5),[]);assert.deepEqual(fishingSoundsBetween(loop,9,1),[]);
});
test('island, palm, full cast, fish and feet remain inside every supported screen shape',()=>{
  const b=fishingBounds(loop,walk);
  for(const [w,h]of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1920,1080],[2560,1080],[3440,1440],[5120,1440],[3840,2160]])for(const dpr of [1,1.25,2,3]){
    const l=layoutFishing(w,h,dpr,b);
    assert(l.x+b.left*l.scale>=0);assert(l.x+b.right*l.scale<=w);
    assert(l.y+b.top*l.scale>=0);assert(l.y+b.bottom*l.scale<=h);
    assert(l.pixelWidth*l.pixelHeight<8_520_000);
  }
});
