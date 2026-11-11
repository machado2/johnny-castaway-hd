import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceToMask,boundedAlpha,paddedPlacement,EDGE_PROFILES} from '../web/dist/edge-composite.js';

test('distance envelope matches a direct nearest-pixel search, including holes and disconnected shapes',()=>{
  const w=11,h=9;
  for(const seeds of [[[0,0]],[[5,4]],[[1,1],[9,7],[5,4]],[[2,2],[3,2],[4,2],[2,3],[4,3],[2,4],[3,4],[4,4]]]){
    const mask=new Uint8Array(w*h);for(const [x,y]of seeds)mask[y*w+x]=1;
    const distances=distanceToMask(mask,w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const expected=Math.min(...seeds.map(([sx,sy])=>Math.hypot(x-sx,y-sy)));
      assert(Math.abs(distances[y*w+x]-expected)<1e-5);
    }
  }
});

test('compositing never increases opacity or revives transparent/very faint fringes',()=>{
  for(let a=0;a<=255;a++)for(const d of [0,.1,.3,.7,1,2,3])for(const radius of [.25,.5,1,2]){
    const result=boundedAlpha(a,d,radius);
    assert(result>=0&&result<=a);
    if(a<=12||d>=radius)assert.equal(result,0);
  }
  assert.equal(boundedAlpha(128,0,1),128);
  assert.equal(boundedAlpha(255,0,1),255);
});

test('small and large margins have an ordered, fading envelope and respect narrow protected gaps',()=>{
  for(const kind of ['island','palm','character']){
    let previous=255;
    for(let d=0;d<=3;d+=.01){
      const small=boundedAlpha(255,d,EDGE_PROFILES.small[kind]);
      const large=boundedAlpha(255,d,EDGE_PROFILES.large[kind]);
      assert(small<=large);assert(small<=previous);previous=small;
    }
  }
  assert.equal(boundedAlpha(255,.25,.25),0);
  assert.equal(boundedAlpha(255,1e6,1),0);
});

test('padding retains source anchors under scaling and horizontal reflection',()=>{
  for(const box of [{x:310,y:242,w:43,h:72},{x:289,y:279,w:280,h:52}]){
    for(const pad of [0,4])for(const scale of [1,1.0833333,3.6,5.333])for(const flip of [false,true]){
      const rect=paddedPlacement({x:0,y:0,w:box.w,h:box.h},pad);
      for(const localX of [0,box.w/2,box.w]){
        const pixelX=pad+localX,drawX=rect.x+pixelX;
        const actual=(box.x+(flip?box.w-drawX:drawX))*scale;
        const expected=(box.x+(flip?box.w-localX:localX))*scale;
        assert(Math.abs(actual-expected)<1e-8);
      }
      assert.equal(rect.y+pad,0);assert.equal(rect.h-pad*2,box.h);
    }
  }
});
