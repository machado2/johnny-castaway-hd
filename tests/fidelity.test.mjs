import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildTimeline,sampleTimeline,layoutFidelity,behindPalm} from '../web/dist/fidelity-motion.js';

const base=new URL('../web/dist/assets/fidelity/',import.meta.url);
const source=JSON.parse(fs.readFileSync(new URL('source.json',base)));
const timeline=buildTimeline(source);

test('all six walking routes preserve every extracted original frame, position and reflection',()=>{
  for(const id of [3,14,25,19,24,11]){
    const expected=source.walks.find(w=>w.id===id).frames;
    const actual=timeline.frames.filter(f=>f.kind==='walk'&&f.route===id)
      .map(({frame,x,y,flip_x})=>({frame,flip_x,x,y}));
    assert.deepEqual(actual,expected);
  }
});

test('turns use original direction-specific poses, not a flipped rigid body',()=>{
  const turns=timeline.frames.filter(f=>f.kind==='turn');
  assert.equal(turns.length,21);
  for(const f of turns){
    const expected=source.walks.find(w=>w.id===f.route).frames[f.direction];
    assert.deepEqual({frame:f.frame,flip_x:f.flip_x,x:f.x,y:f.y},expected);
  }
  assert(new Set(turns.map(f=>f.frame)).size>=4);
});

test('depth follows the original trunk ground line on both paths',()=>{
  assert.equal(behindPalm({y:230},{h:62}),true);
  assert.equal(behindPalm({y:231},{h:62}),false);
  const back=timeline.frames.filter(f=>f.route===25&&f.kind==='walk');
  assert(back.every(f=>behindPalm(f,source.walkFrames[f.frame])));
  assert(timeline.frames.some(f=>f.kind==='walk'&&!behindPalm(f,source.walkFrames[f.frame])));
});

test('every displayed pose has a generated restoration and all selected assets match their hashes',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('restored.json',base)));
  for(const f of timeline.frames)assert(manifest.restoredFrames.includes(f.frame),`missing frame ${f.frame}`);
  for(const [name,hash]of Object.entries(manifest.sha256)){
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(manifest.files[name],base))).digest('hex'),hash);
  }
});

test('refresh rate does not change original pose holds or route coordinates',()=>{
  for(const hz of [30,60,90,120,144])for(let i=0;i<Math.floor(timeline.duration*hz);i++){
    const t=i/hz,f=sampleTimeline(timeline,t);
    const expected=timeline.frames.findLast(x=>x.time<=t+1e-9);
    assert.equal(f.frame,expected.frame);assert.equal(f.x,expected.x);assert.equal(f.y,expected.y);
  }
  assert.deepEqual(sampleTimeline(timeline,0),sampleTimeline(timeline,timeline.duration));
});

test('all original sprites and complete silhouettes fit common screen shapes uniformly',()=>{
  const screens=[[320,568],[390,844],[844,390],[768,1024],[1024,768],[1920,1080],[2560,1080],[3440,1440],[5120,1440],[3840,2160]];
  for(const [w,h]of screens)for(const dpr of [1,1.25,2,3]){
    const l=layoutFidelity(w,h,dpr);
    assert(l.pixelWidth*l.pixelHeight<8_520_000);
    const boxes=[source.island,source.palm,...timeline.frames.map(f=>({...f,w:source.walkFrames[f.frame].w,h:source.walkFrames[f.frame].h}))];
    for(const b of boxes){
      assert(l.x+b.x*l.scale>=0,`${w}x${h} left`);
      assert(l.x+(b.x+b.w)*l.scale<=w,`${w}x${h} right`);
      assert(l.y+b.y*l.scale>=0,`${w}x${h} top`);
      assert(l.y+(b.y+b.h)*l.scale<=h,`${w}x${h} bottom`);
    }
  }
});

test('reference pixel planes retain their extraction hashes',()=>{
  for(const [file,hash]of Object.entries(source.sourceFiles)){
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(file,base))).digest('hex'),hash);
  }
  assert.equal(source.walkFrames.length,36);
});
