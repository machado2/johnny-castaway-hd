import {cropOriginal,edgeVariants} from './restoration.js';
import {carriedRodMask} from './fishing-rod.js';
import {sampleFishing,fishingBounds,buildFishingLoop,smoothFishingLine} from './fishing-motion.js';

export async function loadFishing(walkSource){
  const base=new URL('./assets/fishing/',import.meta.url);
  const json=async name=>{const r=await fetch(new URL(name,base));if(!r.ok)throw new Error(`Fishing: ${name} (${r.status})`);return r.json();};
  const image=async name=>{const im=new Image();im.src=new URL(name,base);await im.decode();return im;};
  const [source,manifest,rodGuides]=await Promise.all([json('source.json'),json('restored.json'),json('rod-guides.json')]);
  const [originals,generated,water,waterArt]=await Promise.all([
    Promise.all(source.groups.map(g=>image(g.source))),Promise.all(manifest.groups.map(g=>image(g.file))),image('source-water.png'),image(manifest.water.file)]);
  const poses=[];
  for(const p of source.poses){
    const raw=cropOriginal(originals[p.group],{x:p.sx,y:p.sy,w:p.w,h:p.h});
    const variants=edgeVariants(raw,generated[p.group],manifest.poses[p.id].crop,'character',4,carriedRodMask(p,rodGuides));
    poses.push({source:raw,image:variants.large.image,pad:variants.large.pad,variants});
    // Yield between whole poses so mobile browsers can paint during preparation.
    if(p.id%6===5)await new Promise(resolve=>setTimeout(resolve,0));
  }
  const ripples=[24,25,26].map((index,n)=>{
    const raw=cropOriginal(water,{x:n*64,y:0,w:[40,48,56][n],h:[9,14,17][n]});
    const variants=edgeVariants(raw,waterArt,manifest.water.crops[n],'palm',4);
    return {source:raw,image:variants.large.image,pad:4,variants};
  });
  const loop=buildFishingLoop(source,walkSource);
  for(const f of loop.frames)for(const line of f.lines){
    const runs=[];let run=[];
    for(const p of line.points){const previous=run.at(-1);if(previous&&(Math.abs(p[0]-previous[0])>2||Math.abs(p[1]-previous[1])>2)){runs.push(run);run=[];}run.push(p);}
    if(run.length)runs.push(run);line.paths=runs.map(smoothFishingLine);
  }
  return {source:loop,manifest,poses,ripples,bounds:fishingBounds(loop,walkSource)};
}

export function paintFishing(ctx,data,walkSource,assets,l,original,t,paintSprite,treatment){
  const f=sampleFishing(data.source,t);
  paintSprite(assets.palm,walkSource.palm,l,original,false,treatment);
  // Original procedural line segments retain their endpoints and presentation times.
  ctx.save();ctx.translate(l.x,l.y);ctx.scale(l.scale,l.scale);
  for(const line of f.lines){
    if(original){for(const [x,y,color]of line.points){ctx.fillStyle=`rgb(${data.source.palette.slice(color*3,color*3+3).join(',')})`;ctx.fillRect(x,y,1,1);}}
    else{
      ctx.strokeStyle='#dce1da';ctx.lineWidth=.7;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      for(const path of line.paths){
        const a=path[0],b=path[1]||a,length=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
        // A 1.5-source-pixel overlap joins the line to the restored rod's rounded tip.
        ctx.moveTo(a[0]+.5-(b[0]-a[0])/length*1.5,a[1]+.5-(b[1]-a[1])/length*1.5);
        for(const [x,y]of path)ctx.lineTo(x+.5,y+.5);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
  for(const w of f.water){const item=data.ripples[w.index-24];paintSprite(item,{...w,w:item.source.width,h:item.source.height},l,original,Boolean(w.flags&2),treatment);}
  if(f.pose){
    const p=data.source.poses[f.pose.id];ctx.save();
    if(f.pose.clip){const [x,y,r,b]=f.pose.clip;ctx.beginPath();ctx.rect(l.x+x*l.scale,l.y+y*l.scale,(r-x)*l.scale,(b-y)*l.scale);ctx.clip();}
    paintSprite(data.poses[p.id],{...f.pose,w:p.w,h:p.h},l,original,false,treatment);ctx.restore();
  }else if(f.walk){const shape=walkSource.walkFrames[f.walk.index];paintSprite(assets.walk[f.walk.index],{...f.walk,w:shape.w,h:shape.h},l,original,Boolean(f.walk.flags&2),treatment);}
  if(f.trunkFront)paintSprite(assets.palm,walkSource.palm,l,original,false,treatment);
}
