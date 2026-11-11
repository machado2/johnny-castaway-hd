import {mod,layoutFidelity} from './fidelity-motion.js';

export function buildFishingLoop(source,walkSource){
  const frames=[...source.frames],standing=walkSource.walks.find(w=>w.id===walkSource.standing[4]);
  const turning=walkSource.walks.find(w=>w.id===walkSource.turning[4]);
  let nextTick=Math.floor(source.duration/.016)+1,delay=0;
  const append=(pose,kind,direction)=>{
    do{
      const time=frames.length*.055;
      while(nextTick*.016<=(time+.055)+1e-9){if(delay)delay--;nextTick++;}
      frames.push({time,tick:nextTick-1,sounds:[],water:[],lines:[],trunkFront:true,
        bridge:kind,direction,walk:{index:pose.frame,x:pose.x,y:pose.y,flags:pose.flip_x?2:0}});
    }while(delay);
    delay=4;
  };
  // A demo-loop pause and the original position-4 turn connect the end to the start.
  for(let i=0;i<12;i++)append(standing.frames[6],'stand',6);
  for(const d of [7,0,1,2])append(turning.frames[d],'turn',d);
  for(let i=0;i<12;i++)append(standing.frames[2],'stand',2);
  return {...source,originalDuration:source.duration,originalFrameCount:source.frames.length,frames,duration:frames.length*.055};
}

// The source has one entry for each original 55 ms presentation, including holds.
export function sampleFishing(source,seconds){
  const time=mod(seconds,source.duration);
  const index=Math.min(source.frames.length-1,Math.floor((time+1e-9)/.055));
  return {...source.frames[index],index,time};
}

export function fishingBounds(source,walkSource){
  const boxes=[walkSource.island,walkSource.palm];
  for(const frame of source.frames){
    if(frame.pose){const p=source.poses[frame.pose.id];boxes.push({...frame.pose,w:p.w,h:p.h});}
    if(frame.walk){const p=walkSource.walkFrames[frame.walk.index];boxes.push({...frame.walk,w:p.w,h:p.h});}
    for(const w of frame.water)boxes.push({...w,w:[40,48,56][w.index-24],h:[9,14,17][w.index-24]});
    for(const line of frame.lines)for(const [x,y]of line.points)boxes.push({x,y,w:1,h:1});
  }
  return {left:Math.min(...boxes.map(b=>b.x))-8,right:Math.max(...boxes.map(b=>b.x+b.w))+8,
    top:Math.min(...boxes.map(b=>b.y))-8,bottom:Math.max(...boxes.map(b=>b.y+b.h))+8};
}

export function layoutFishing(width,height,dpr,bounds){
  const l=layoutFidelity(width,height,dpr),margin=16;
  const scale=Math.min((width-2*margin)/(bounds.right-bounds.left),height/300);
  const baseline=height*(height>width?.65:.79);
  const y=Math.max(margin-bounds.top*scale,Math.min(baseline-320*scale,height-margin-bounds.bottom*scale));
  return {...l,scale,x:width/2-(bounds.left+bounds.right)/2*scale,y};
}

// Crossed events, rather than current-frame events: redraws cannot replay sounds.
export function fishingSoundsBetween(source,from,to){
  if(to<=from)return [];
  const events=[];
  for(let cycle=Math.floor(from/source.duration);cycle<=Math.floor(to/source.duration);cycle++){
    for(const f of source.frames){
      const at=cycle*source.duration+f.time;
      if(at>from+1e-9&&at<=to+1e-9)events.push(...f.sounds);
    }
  }
  return events;
}

// Remove the raster staircase, retaining the original line geometry within 0.65 px.
export function smoothFishingLine(points){
  if(points.length<3)return points;
  const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  let farthest=0,split=0;
  for(let i=1;i<points.length-1;i++){
    const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
    const d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
    if(d>farthest){farthest=d;split=i;}
  }
  if(farthest<=.65)return [a,b];
  return [...smoothFishingLine(points.slice(0,split+1)).slice(0,-1),...smoothFishingLine(points.slice(split))];
}
