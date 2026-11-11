import {buildTimeline,sampleTimeline,layoutFidelity,behindPalm} from './fidelity-motion.js';
import {cropOriginal,restoreSprite,silhouetteAudit,restoreOcean} from './restoration.js';

const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const params=new URLSearchParams(location.search),frozen=params.has('t');
const mode=params.get('art')||'restored',compare=params.get('view')==='compare';
const poses=params.get('view')==='poses';
const base=new URL('./assets/fidelity/',import.meta.url);
let elapsed=Number(params.get('t'))||0,last=null,request=null,ready=false;
let source,manifest,timeline,assets,layout,frameCount=0;
const intervals=[],drawTimes=[];
const image=async file=>{const im=new Image();im.src=new URL(file,base);await im.decode();return im;};

function resize(){layout=layoutFidelity(innerWidth,innerHeight,devicePixelRatio||1);canvas.width=layout.pixelWidth;canvas.height=layout.pixelHeight;if(ready)draw();}

function paintOcean(l,original,t) {
  const im=original?assets.oceanSource:assets.ocean;
  const horizon=l.y+149*l.scale;
  const sourceHorizon=im.height*149/480;
  // Match the horizon exactly. Extra sky/water comes from the background only.
  const s=Math.max(l.width/im.width,(l.height-horizon)/(im.height-sourceHorizon));
  const dw=im.width*s,x=(l.width-dw)/2,y=horizon-sourceHorizon*s;
  // Extend the actual top row so portrait sky has no color seam.
  if(horizon>0)ctx.drawImage(im,0,0,im.width,1,x,0,dw,horizon);
  ctx.drawImage(im,x,y,dw,im.height*s);
  if(!original&&!frozen){
    // Small displacements of the restored water; the skyline remains fixed.
    const sy=sourceHorizon;
    for(let dy=Math.max(horizon,0);dy<l.height;dy+=14){
      const sh=Math.min(15,l.height-dy),srcY=sy+(dy-horizon)/s;
      const offset=Math.sin(t*.6+dy*.018)*.65;
      ctx.drawImage(im,0,srcY,im.width,sh/s,x+offset,dy,dw,sh);
    }
  }
}

function paintSprite(item,box,l,original,flip=false) {
  const im=original?item.source:item.image;
  const x=l.x+box.x*l.scale,y=l.y+box.y*l.scale;
  ctx.save();ctx.translate(x+(flip?box.w*l.scale:0),y);ctx.scale(flip?-1:1,1);
  ctx.imageSmoothingEnabled=!original;ctx.imageSmoothingQuality='high';
  ctx.drawImage(im,0,0,box.w*l.scale,box.h*l.scale);ctx.restore();
}

function scene(l,original,t) {
  ctx.imageSmoothingEnabled=!original;paintOcean(l,original,t);
  paintSprite(assets.island,source.island,l,original);
  const f=sampleTimeline(timeline,t),shape=source.walkFrames[f.frame];
  if(!behindPalm(f,shape))paintSprite(assets.palm,source.palm,l,original);
  paintSprite(assets.walk[f.frame],{x:f.x,y:f.y,w:shape.w,h:shape.h},l,original,f.flip_x);
  if(behindPalm(f,shape))paintSprite(assets.palm,source.palm,l,original);
}

function draw(){
  const start=performance.now();ctx.setTransform(canvas.width/innerWidth,0,0,canvas.height/innerHeight,0,0);
  if(poses){
    ctx.fillStyle='#b8c9cc';ctx.fillRect(0,0,innerWidth,innerHeight);
    const indices=source.references[params.get('group')]?.indices||[1,2,3,4,5,6,7,8];
    const cell=innerWidth/indices.length,rowHeight=innerHeight/2,s=Math.min(cell/57,(rowHeight-80)/80);
    for(let row=0;row<2;row++){
      ctx.fillStyle='#173033';ctx.font='18px sans-serif';ctx.fillText(row?'Restauração — mesmas poses':`Original — poses ${indices.join(', ')}`,18,row*rowHeight+28);
      for(const [column,i]of indices.entries()){
        const im=row?assets.walk[i].image:assets.walk[i].source,f=source.walkFrames[i];
        ctx.imageSmoothingEnabled=!!row;ctx.drawImage(im,column*cell+12,row*rowHeight+60,f.w*s,f.h*s);
      }
    }
  }else if(compare){
    const half=innerWidth/2,l=layoutFidelity(half,innerHeight,1);
    for(let i=0;i<2;i++){ctx.save();ctx.beginPath();ctx.rect(i*half,0,half,innerHeight);ctx.clip();ctx.translate(i*half,0);scene(l,i===0,elapsed);ctx.restore();}
    ctx.fillStyle='#0009';ctx.fillRect(half-1,0,2,innerHeight);
  }else scene(layout,mode==='original',elapsed);
  frameCount++;drawTimes.push(performance.now()-start);if(drawTimes.length>300)drawTimes.shift();
}

function loop(now){
  request=null;if(document.hidden||!ready)return;
  if(last!==null){const dt=now-last;intervals.push(dt);if(intervals.length>300)intervals.shift();elapsed+=Math.min(dt,100)/1000;}
  last=now;draw();request=requestAnimationFrame(loop);
}
function resume(){last=null;if(request!==null)cancelAnimationFrame(request);request=ready&&!frozen&&!document.hidden?requestAnimationFrame(loop):null;}
addEventListener('resize',resize);document.addEventListener('visibilitychange',resume);addEventListener('pagehide',()=>cancelAnimationFrame(request));addEventListener('pageshow',resume);
resize();

try{
  source=await(await fetch(new URL('source.json',base))).json();
  manifest=await(await fetch(new URL('restored.json',base))).json();timeline=buildTimeline(source);
  const loaded=Object.fromEntries(await Promise.all(Object.entries(manifest.files).map(async([key,file])=>[key,await image(file)])));
  const [islandSource,palmSource,walkSource,oceanSource]=await Promise.all(['source-island.png','source-palm.png','source-walk.png','source-ocean.png'].map(image));
  const crop=(name,box)=>{const ref=source.references[name],im=loaded[name];return box.map((v,i)=>v*(i%2?im.height/ref.canvas[1]:im.width/ref.canvas[0]));};
  assets={oceanSource,ocean:restoreOcean(oceanSource,loaded.ocean),
    island:restoreSprite(islandSource,loaded.island,crop('island',source.references.island.box),6,.65),
    palm:restoreSprite(palmSource,loaded.palm,crop('palm',source.references.palm.box),6,.4),walk:[]};
  for(const shape of source.walkFrames){
    const original=cropOriginal(walkSource,shape);
    const group=Object.keys(source.references).find(key=>source.references[key].indices?.includes(shape.index)&&loaded[key]);
    let candidate=null,box=null;
    if(group){const ref=source.references[group],cell=ref.indices.indexOf(shape.index),k=ref.factor;candidate=loaded[group];
      box=crop(group,[((cell%2)*96+24)*k,(Math.floor(cell/2)*96+10)*k,shape.w*k,shape.h*k]);}
    assets.walk.push(restoreSprite(original,candidate,box,6,.28,true));
  }
  const used=[...new Set(timeline.frames.map(f=>f.frame))];
  const audit={island:silhouetteAudit(assets.island),palm:silhouetteAudit(assets.palm),walk:used.map(index=>({index,...silhouetteAudit(assets.walk[index])}))};
  ready=true;canvas.dataset.ready='true';draw();resume();
  const p95=a=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*.95)]:0;
  Object.defineProperty(window,'castawayFidelity',{value:Object.freeze({get status(){return {
    time:elapsed,duration:timeline.duration,frameCount,fps:intervals.length?1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length):0,
    p95FrameMs:p95(intervals),p95DrawMs:p95(drawTimes),viewport:{...layout},sample:sampleTimeline(timeline,elapsed),
    art:mode,comparison:compare,silhouettes:audit,restoredFrames:manifest.restoredFrames,
  };}})});
}catch(error){canvas.dataset.error=String(error);console.error(error);}
