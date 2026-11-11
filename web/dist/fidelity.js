import {buildTimeline,sampleTimeline,layoutFidelity,behindPalm} from './fidelity-motion.js';
import {cropOriginal,restoreSprite,silhouetteAudit,restoreOcean,edgeVariants} from './restoration.js?v=whole-pose-1';
import {paddedPlacement} from './edge-composite.js';
import {loadFishing,paintFishing} from './fishing.js?v=whole-pose-1';
import {sampleFishing,layoutFishing,fishingSoundsBetween} from './fishing-motion.js';
import {OriginalAudio} from './audio.js';

const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const params=new URLSearchParams(location.search),frozen=params.has('t');
const mode=params.get('art')||'restored',compare=params.get('view')==='compare';
const poses=params.get('view')==='poses';
const edgeReview=params.get('view')==='edges',edgeScenes=params.get('view')==='edge-scenes';
const edgePoses=params.get('view')==='edge-poses';
const fishingMode=params.get('scene')!=='walk'&&!location.pathname.endsWith('walk-study.html')&&!poses&&!edgeReview&&!edgeScenes&&!edgePoses;
const audio=new OriginalAudio();
let fishing=null;
const edgeMode=['strict','small','large'].includes(params.get('edges'))?params.get('edges'):'large';
const needEdges=edgeMode!=='strict'||edgeReview||edgeScenes||edgePoses;
const base=new URL('./assets/fidelity/',import.meta.url);
let elapsed=Number(params.get('t'))||0,last=null,request=null,ready=false;
let source,manifest,timeline,assets,layout,frameCount=0;
const intervals=[],drawTimes=[];
const image=async file=>{const im=new Image();im.src=new URL(file,base);await im.decode();return im;};

function sceneLayout(w,h,dpr=1){return fishingMode&&fishing?layoutFishing(w,h,dpr,fishing.bounds):layoutFidelity(w,h,dpr);}
function resize(){layout=sceneLayout(innerWidth,innerHeight,devicePixelRatio||1);canvas.width=layout.pixelWidth;canvas.height=layout.pixelHeight;if(ready)draw();}

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

function paintSprite(item,box,l,original,flip=false,treatment=edgeMode) {
  const selected=original?item:(item.variants?.[treatment]||item);
  const im=original?item.source:selected.image,pad=original?0:(selected.pad||0);
  const x=l.x+box.x*l.scale,y=l.y+box.y*l.scale;
  ctx.save();ctx.translate(x+(flip?box.w*l.scale:0),y);ctx.scale(flip?-1:1,1);
  ctx.imageSmoothingEnabled=!original;ctx.imageSmoothingQuality='high';
  const rect=paddedPlacement({x:0,y:0,w:box.w,h:box.h},pad);
  ctx.drawImage(im,rect.x*l.scale,rect.y*l.scale,rect.w*l.scale,rect.h*l.scale);ctx.restore();
}

function scene(l,original,t,treatment=edgeMode) {
  ctx.imageSmoothingEnabled=!original;paintOcean(l,original,t);
  paintSprite(assets.island,source.island,l,original,false,treatment);
  if(fishingMode&&fishing){paintFishing(ctx,fishing,source,assets,l,original,t,paintSprite,treatment);return;}
  const f=sampleTimeline(timeline,t),shape=source.walkFrames[f.frame];
  if(!behindPalm(f,shape))paintSprite(assets.palm,source.palm,l,original,false,treatment);
  paintSprite(assets.walk[f.frame],{x:f.x,y:f.y,w:shape.w,h:shape.h},l,original,f.flip_x,treatment);
  if(behindPalm(f,shape))paintSprite(assets.palm,source.palm,l,original,false,treatment);
}

function drawEdgeReview(){
  const keys=['strict','small','large'],labels=['A · Recorte anterior','B · Tolerância pequena','C · Tolerância maior'];
  const portrait=innerHeight>innerWidth,pw=portrait?innerWidth:innerWidth/3,ph=portrait?innerHeight/3:innerHeight;
  const segment=timeline.frames.filter(f=>f.kind==='walk'&&f.route===3).slice(0,8);
  const duration=segment.at(-1).time-segment[0].time+.11;
  const t=((elapsed%duration)+duration)%duration;
  const f=segment.findLast(f=>f.time-segment[0].time<=t+1e-9)||segment[0];
  for(let i=0;i<3;i++){
    const ox=portrait?0:i*pw,oy=portrait?i*ph:0;
    ctx.save();ctx.translate(ox,oy);ctx.beginPath();ctx.rect(0,0,pw,ph);ctx.clip();
    ctx.fillStyle='#e1e8e8';ctx.fillRect(0,0,pw,ph);
    if(edgeScenes)scene(layoutFidelity(pw,ph,1),false,elapsed,keys[i]);
    else {
      const islandScale=Math.min((pw-36)/288,ph*.18/52),islandY=ph*.24;
      ctx.fillStyle='#244e87';ctx.fillRect(0,ph*.12,pw,ph*.36);
      paintSprite(assets.island,source.island,{scale:islandScale,x:pw/2-429*islandScale,y:islandY-279*islandScale},false,false,keys[i]);
      const scale=Math.min((pw-44)/132,ph*.42/80),shape=source.walkFrames[f.frame];
      const l={scale,x:pw/2-363*scale,y:ph*.56-234*scale};
      ctx.strokeStyle='#a5b8b6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,l.y+315*scale);ctx.lineTo(pw,l.y+315*scale);ctx.stroke();
      paintSprite(assets.walk[f.frame],{x:f.x,y:f.y,w:shape.w,h:shape.h},l,false,f.flip_x,keys[i]);
    }
    ctx.fillStyle='#fffffff0';ctx.fillRect(0,0,pw,Math.min(90,ph*.11));
    ctx.fillStyle='#173033';ctx.font=`${Math.max(12,Math.min(21,pw/25))}px sans-serif`;ctx.fillText(labels[i],16,28);
    if(ph>400){ctx.font='15px sans-serif';ctx.fillText(i===0?'Máscara original imposta':i===1?'Ilha: 1 px · Johnny: 0,5 px':'Ilha: 2 px · Johnny: 2 px',16,55);ctx.fillText('Mesmas imagens, posições e tempo',16,78);}
    ctx.strokeStyle='#5e777c';ctx.strokeRect(0,0,pw,ph);ctx.restore();
  }
}

function draw(){
  const start=performance.now();ctx.setTransform(canvas.width/innerWidth,0,0,canvas.height/innerHeight,0,0);
  if(edgePoses){
    ctx.fillStyle='#e1e8e8';ctx.fillRect(0,0,innerWidth,innerHeight);
    const cell=innerWidth/8,rowHeight=innerHeight/3,s=Math.min((cell-24)/57,(rowHeight-50)/80);
    for(const [row,key]of ['strict','small','large'].entries()){
      ctx.fillStyle='#173033';ctx.font='18px sans-serif';ctx.fillText(['A · Recorte anterior','B · Tolerância pequena','C · Tolerância maior'][row],16,row*rowHeight+25);
      for(let i=1;i<=8;i++){
        const f=source.walkFrames[i];
        paintSprite(assets.walk[i],{x:0,y:0,w:f.w,h:f.h},{x:(i-1)*cell+12,y:row*rowHeight+45,scale:s},false,false,key);
      }
    }
  }else if(edgeReview||edgeScenes)drawEdgeReview();
  else if(poses){
    ctx.fillStyle='#b8c9cc';ctx.fillRect(0,0,innerWidth,innerHeight);
    const indices=source.references[params.get('group')]?.indices||[1,2,3,4,5,6,7,8];
    const cell=innerWidth/indices.length,rowHeight=innerHeight/2,s=Math.min(cell/57,(rowHeight-80)/80);
    for(let row=0;row<2;row++){
      ctx.fillStyle='#173033';ctx.font='18px sans-serif';ctx.fillText(row?'Restauração — mesmas poses':`Original — poses ${indices.join(', ')}`,18,row*rowHeight+28);
      for(const [column,i]of indices.entries()){
        const f=source.walkFrames[i];
        paintSprite(assets.walk[i],{x:0,y:0,w:f.w,h:f.h},{x:column*cell+12,y:row*rowHeight+60,scale:s},!row);
      }
    }
  }else if(compare){
    const half=innerWidth/2,l=sceneLayout(half,innerHeight,1);
    for(let i=0;i<2;i++){ctx.save();ctx.beginPath();ctx.rect(i*half,0,half,innerHeight);ctx.clip();ctx.translate(i*half,0);scene(l,i===0,elapsed);ctx.restore();}
    ctx.fillStyle='#0009';ctx.fillRect(half-1,0,2,innerHeight);
  }else scene(layout,mode==='original',elapsed);
  frameCount++;drawTimes.push(performance.now()-start);if(drawTimes.length>300)drawTimes.shift();
}

function loop(now){
  request=null;if(document.hidden||!ready)return;
  if(last!==null){const dt=now-last;intervals.push(dt);if(intervals.length>300)intervals.shift();const before=elapsed;elapsed+=Math.min(dt,100)/1000;
    if(fishing)for(const id of fishingSoundsBetween(fishing.source,before,elapsed))audio.play(id);}
  last=now;draw();request=requestAnimationFrame(loop);
}
function resume(){last=null;if(request!==null)cancelAnimationFrame(request);request=ready&&!frozen&&!document.hidden?requestAnimationFrame(loop):null;}
addEventListener('resize',resize);document.addEventListener('visibilitychange',resume);addEventListener('pagehide',()=>cancelAnimationFrame(request));addEventListener('pageshow',resume);
for(const event of ['pointerup','touchend','click','keydown'])canvas.addEventListener(event,()=>{if(fishingMode)audio.unlock().catch(error=>console.error('Audio:',error));},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stop();else audio.resume().catch(error=>console.error('Audio:',error));});
addEventListener('pagehide',()=>audio.stop());
resize();

try{
  source=await(await fetch(new URL('source.json',base))).json();
  manifest=await(await fetch(new URL('restored.json',base))).json();timeline=buildTimeline(source);
  const loaded=Object.fromEntries(await Promise.all(Object.entries(manifest.files).map(async([key,file])=>[key,await image(file)])));
  const [islandSource,palmSource,walkSource,oceanSource]=await Promise.all(['source-island.png','source-palm.png','source-walk.png','source-ocean.png'].map(image));
  const crop=(name,box)=>{const ref=source.references[name],im=loaded[name];return box.map((v,i)=>v*(i%2?im.height/ref.canvas[1]:im.width/ref.canvas[0]));};
  const restored=(original,candidate,box,kind,softness,includeEdges=true)=>{
    const item=restoreSprite(original,candidate,box,6,softness,kind==='character');
    item.variants=needEdges&&includeEdges?edgeVariants(original,candidate,box,kind):{};return item;
  };
  assets={oceanSource,ocean:restoreOcean(oceanSource,loaded.ocean),
    island:restored(islandSource,loaded.island,crop('island',source.references.island.box),'island',.65),
    palm:restored(palmSource,loaded.palm,crop('palm',source.references.palm.box),'palm',.4),walk:[]};
  for(const shape of source.walkFrames){
    const original=cropOriginal(walkSource,shape);
    const group=Object.keys(source.references).find(key=>source.references[key].indices?.includes(shape.index)&&loaded[key]);
    let candidate=null,box=null;
    if(group){const ref=source.references[group],cell=ref.indices.indexOf(shape.index),k=ref.factor;candidate=loaded[group];
      box=crop(group,[((cell%2)*96+24)*k,(Math.floor(cell/2)*96+10)*k,shape.w*k,shape.h*k]);}
    assets.walk.push(restored(original,candidate,box,'character',.28,
      !(edgeReview||edgePoses)||(shape.index>=1&&shape.index<=8)));
  }
  const used=[...new Set(timeline.frames.map(f=>f.frame))];
  const audit={island:silhouetteAudit(assets.island),palm:silhouetteAudit(assets.palm),walk:used.map(index=>({index,...silhouetteAudit(assets.walk[index])}))};
  const edgeAudit=needEdges?Object.fromEntries(['small','large'].map(key=>[key,{
    island:assets.island.variants[key].audit,palm:assets.palm.variants[key].audit,
    walk:used.filter(index=>assets.walk[index].variants[key]).map(index=>({index,...assets.walk[index].variants[key].audit})),
  }])):{};
  if(fishingMode){fishing=await loadFishing(source);await audio.load(fishing.source.sounds);resize();}
  ready=true;canvas.dataset.ready='true';canvas.dataset.scene=fishingMode?'fishing':'walk';draw();resume();
  const p95=a=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*.95)]:0;
  Object.defineProperty(window,'castawayFidelity',{value:Object.freeze({get status(){return {
    time:elapsed,duration:fishing?fishing.source.duration:timeline.duration,frameCount,fps:intervals.length?1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length):0,
    p95FrameMs:p95(intervals),p95DrawMs:p95(drawTimes),viewport:{...layout},sample:fishing?sampleFishing(fishing.source,elapsed):sampleTimeline(timeline,elapsed),
    scene:fishingMode?'fishing':'walk',fishingPoses:fishing?.poses.length,audio:audio.context?.state||'locked',
    art:mode,comparison:compare,strictBaselineSilhouettes:audit,restoredFrames:manifest.restoredFrames,edgeMode,edgeReview,edgeAudit,
  };}})});
}catch(error){canvas.dataset.error=String(error);console.error(error);}
