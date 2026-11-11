import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {samplePilot,layoutPilot,cuesBetween,DURATION} from '../web/dist/pilot-motion.js';

test('all action positions remain on screen in desktop, ultrawide and portrait layouts',()=>{
  for(const [w,h] of [[1920,1080],[2560,1080],[3440,1440],[5120,1440],[3840,2160],
    [1280,720],[1024,768],[1920,1200],[390,844],[320,568],[844,390],[768,1024]]){
    for(const dpr of [1,1.25,2,3]){
      const l=layoutPilot(w,h,dpr);
      assert(l.pixelWidth*l.pixelHeight<=8_520_000,`${w}x${h} exceeds raster budget`);
      for(let t=0;t<DURATION;t+=.1){
        const m=samplePilot(t),x=l.centerX+m.x*l.islandWidth;
        const halfWidth=l.characterHeight*.65;
        assert(x-halfWidth>=0&&x+halfWidth<=w,`Johnny clipped at ${w}x${h}, t=${t}`);
        assert(l.baseline-l.characterHeight-33*l.scale>=0);
        assert(l.baseline+120*l.scale<h,`island bottom clipped at ${w}x${h}`);
      }
    }
  }
});

test('animation position and events do not depend on refresh rate',()=>{
  for(const hz of [30,60,90,120,144]){
    let previous=0,count=0;
    for(let i=1;i<=hz*DURATION*2;i++){
      const time=i/hz;count+=cuesBetween(previous,time).length;previous=time;
    }
    assert.equal(count,4,`audio cue count at ${hz} Hz`);
    assert.deepEqual(samplePilot(previous),samplePilot(0));
  }
});

test('walking paths are position-continuous across action changes and loop seam',()=>{
  for(const boundary of [0,6,18,26,28,32]){
    const a=samplePilot(boundary-1e-6),b=samplePilot(boundary+1e-6);
    assert(Math.abs(a.x-b.x)<1e-5,`position jumps at ${boundary}`);
    assert(Math.abs(a.groundOffset-b.groundOffset)<1e-3,`depth jumps at ${boundary}`);
  }
});

test('redraws and paused time do not replay sounds',()=>{
  assert.deepEqual(cuesBetween(7.1,7.1),[]);
  assert.deepEqual(cuesBetween(7,7.2).map(c=>c.kind),['cast']);
  assert.deepEqual(cuesBetween(13.3,13.5).map(c=>c.kind),['bite']);
  assert.deepEqual(cuesBetween(1,1000),[]);
});

test('all generated sprite cells fit their real source images and retain provenance',()=>{
  const folder=new URL('../web/dist/assets/pilot/',import.meta.url);
  const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',folder)));
  assert.equal(manifest.assets.walk.frames.length,16);
  assert.equal(manifest.assets.fish.frames.length,8);
  for(const asset of Object.values(manifest.assets)){
    const buffer=fs.readFileSync(new URL(asset.file,folder));
    assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),asset.sha256);
    assert.equal(buffer.readUInt32BE(16),asset.width);
    assert.equal(buffer.readUInt32BE(20),asset.height);
    for(const f of asset.frames){
      assert(f.x>=0&&f.y>=0&&f.x+f.w<=asset.width&&f.y+f.h<=asset.height);
      assert(f.anchorX>=0&&f.anchorX<f.w&&f.anchorY>0&&f.anchorY<=f.h);
      assert(f.bodyHeight>0);
    }
  }
});

test('the pilot has only its canvas and never changes original story storage',()=>{
  const page=fs.readFileSync(new URL('../web/dist/index.html',import.meta.url),'utf8');
  const source=fs.readFileSync(new URL('../web/dist/pilot.js',import.meta.url),'utf8');
  assert.equal((page.match(/<canvas\b/g)||[]).length,1);
  assert(!/<(?:button|input|nav|video|iframe)\b/i.test(page));
  assert(!source.includes('localStorage'));
  assert(!source.includes('scrantic.web.original'));
});
