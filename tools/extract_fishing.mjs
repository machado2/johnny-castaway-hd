// Record the supplied original fishing script with our own original-derived
// scheduler. The faithful checkout is read-only; no external implementation.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {AdsPlayer} from '../../johnycastaway/web/dist/ads.js';
import {originalRandom} from '../../johnycastaway/web/dist/story.js';

const original=new URL('../../johnycastaway/',import.meta.url);
const root=new URL('../',import.meta.url);
const bytes=fs.readFileSync(new URL('web/dist/assets/original.json',original));
const assets=JSON.parse(bytes),story=JSON.parse(fs.readFileSync(new URL('web/dist/assets/story.json',original)));
const record=story.scenes.find(s=>s.ads_file==='FISHING.ADS'&&s.sequence===2);
let ops=[];
const gfx={clipRect:null,buffers:[null,new Proxy({}, {set(_,key,value){
  if(/^\d+$/.test(key)){
    let last=ops.at(-1);if(last?.type!=='pixels'){last={type:'pixels',points:[]};ops.push(last);}
    last.points.push([Number(key)%640,Math.floor(Number(key)/640),value]);
  }
  return true;
}}),null],sprite(bank,index,x,y,flags=0){ops.push({type:'sprite',bank,index,x,y,flags,clip:[...this.clipRect]});}};
for(const name of ['capture','circle','copyRect','rect','restore','screen'])gfx[name]=()=>{throw new Error('Unrecorded fishing operation: '+name);};
const env={assets,gfx,rng:originalRandom(story.random,0),now:0,offset:[1,0],sounds:[]};
const player=new AdsPlayer(assets,record.ads_file,record.sequence,env),frames=[];
for(let step=0;step<5000&&!player.done;step++){
  ops=[];env.sounds=[];env.now=Math.floor((step+1)*55/16);player.step(env);
  frames.push({time:step*.055,tick:env.now,ops,sounds:[...env.sounds]});
}
if(!player.done)throw new Error('The original fishing sequence did not complete');
const used=new Map();for(const f of frames)for(const op of f.ops)if(op.type==='sprite')used.set(`${op.bank}:${op.index}`,op);
const sprites=Object.fromEntries([...used].sort().map(([key,op])=>[key,{bank:op.bank,index:op.index,...assets.images[op.bank][op.index]}]));
const soundIds=[...new Set(frames.flatMap(f=>f.sounds))];
const provenance={record,randomSeed:0,stepMs:55,tickMs:16,offset:env.offset,originalSources:assets.sources,
  files:Object.fromEntries(['web/dist/assets/original.json','web/dist/assets/story.json','web/dist/ads.js','web/dist/ttm.js','web/dist/story.js'].map(file=>[file,createHash('sha256').update(fs.readFileSync(new URL(file,original))).digest('hex')]))};
const output={provenance,duration:frames.length*.055,sprites,sounds:Object.fromEntries(soundIds.map(id=>[id,assets.sounds[id]])),frames};
fs.mkdirSync(new URL('artifacts/',root),{recursive:true});
fs.writeFileSync(new URL('artifacts/fishing-trace.json',root),JSON.stringify(output));
console.log(JSON.stringify({frames:frames.length,duration:output.duration,sprites:used.size,sounds:output.sounds,
  spriteArrangements:new Set(frames.map(f=>JSON.stringify(f.ops.filter(op=>op.type==='sprite'&&op.bank!=='TRUNK.BMP')))).size}));
