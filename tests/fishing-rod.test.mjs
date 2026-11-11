import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {carriedRodMask} from '../web/dist/fishing-rod.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../web/dist/assets/fishing/${name}`,import.meta.url)));
const reference=read('rod-guides.json'),source=read('source.json');

test('carried-rod guide follows original placements and both reflection flags',()=>{
  const guide={bank:'rod',guides:{22:{w:4,h:3,runs:[[0,0,2],[2,3,1]]}}};
  for(const flags of [0,1,2,3]){
    const pose={w:10,h:8,recipe:[{bank:'rod',index:22,x:2,y:3,flags}]};
    const mask=carriedRodMask(pose,guide);
    const pixels=[];
    for(let y=0;y<8;y++)for(let x=0;x<10;x++)if(mask[y*10+x])pixels.push([x,y]);
    const expected=[[0,0],[1,0],[3,2]].map(([x,y])=>[2+(flags&2?3-x:x),3+(flags&1?2-y:y)]);
    assert.deepEqual(pixels.sort(),expected.sort());
  }
});

test('hanging-line interior is a prop envelope, without filling unrelated columns',()=>{
  const guide={bank:'rod',guides:{22:{w:3,h:4,runs:[[0,1,1],[3,1,1]]}}};
  const mask=carriedRodMask({w:3,h:4,recipe:[{bank:'rod',index:22,x:0,y:0,flags:0}]},guide);
  assert.deepEqual([...mask],[0,1,0,0,1,0,0,1,0,0,1,0]);
  assert.equal(carriedRodMask({w:3,h:4,recipe:[{bank:'other',index:22}]},guide),null);
});

test('every outbound rod pose has a bounded guide, while other fishing poses are unchanged',()=>{
  for(const pose of source.poses){
    const mask=carriedRodMask(pose,reference);
    if(pose.id<26){assert(mask);assert(mask.some(Boolean));}
    if(pose.id>=26&&pose.id<62)assert.equal(mask,null);
    if(mask){
      assert.equal(mask.length,pose.w*pose.h);
      // The guide cannot relax the head, feet or gaps between the walking legs.
      const rods=pose.recipe.filter(o=>o.bank===reference.bank&&reference.guides[o.index]);
      const top=Math.min(...rods.map(o=>o.y)),bottom=Math.max(...rods.map(o=>o.y+reference.guides[o.index].h));
      for(let y=0;y<pose.h;y++)if(y<top||y>=bottom)assert(!mask.slice(y*pose.w,(y+1)*pose.w).some(Boolean));
    }
  }
});
