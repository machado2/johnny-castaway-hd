// Presentation of extracted original walks. No invented limb motion or easing.
export const LOGIC_TICK=.016, PRESENT_STEP=.055;
export const mod=(n,d)=>((n%d)+d)%d;

export function buildTimeline(source) {
  const walks=new Map(source.walks.map(w=>[w.id,w]));
  const timeline=[];
  let logicalTime=0,nextTick=LOGIC_TICK,delay=0;
  const append=(f,kind,route,direction)=>{
    // Original Walk.advance sets delay=4; ticks and presentation have separate clocks.
    do {logicalTime+=PRESENT_STEP;while(nextTick<=logicalTime+1e-9){if(delay)delay--;nextTick+=LOGIC_TICK;}}while(delay);
    timeline.push({...f,time:logicalTime,kind,route,direction});delay=4;
  };
  const stand=(position,direction,count=1)=>{
    const f=walks.get(source.standing[position]).frames[direction];
    for(let i=0;i<count;i++)append(f,'stand',source.standing[position],direction);
  };
  const turn=(position,directions)=>{
    for(const d of directions)append(walks.get(source.turning[position]).frames[d],'turn',source.turning[position],d);
  };
  const route=id=>{const w=walks.get(id);for(const f of w.frames)append(f,'walk',id,w.start_direction);};
  // Full routes and turns come from SCRANTIC's tables, including the path behind the trunk.
  stand(1,6,10);route(3);stand(3,5,6);turn(3,[4,3,2]);stand(3,2,3);
  route(14);stand(5,3,6);turn(5,[4,5,6]);route(25);
  stand(4,6,6);turn(4,[7,0,1,2]);route(19);
  stand(5,2,6);turn(5,[1,0,7]);route(24);
  stand(3,6,6);turn(3,[7,0,1,2]);route(11);
  stand(1,2,9);turn(1,[1,0,7,6]);stand(1,6,3);
  const offset=timeline[0].time;
  for(const f of timeline)f.time-=offset;
  return {frames:timeline,duration:logicalTime-offset+.11};
}

// The original foreground repair redraws the trunk only above this ground line.
export const behindPalm=(frame,shape)=>frame.y+shape.h<293;

export function sampleTimeline(timeline,seconds) {
  const time=mod(seconds,timeline.duration);
  let index=0;
  while(index+1<timeline.frames.length&&timeline.frames[index+1].time<=time+1e-9)index++;
  return {...timeline.frames[index],index,time};
}

export function layoutFidelity(width,height,dpr=1) {
  const scale=Math.min(width/360,height/300);
  const baseline=height*(height>width?.65:.79);
  const density=Math.min(Math.max(1,dpr),2,Math.sqrt(8_500_000/(width*height)));
  return {width,height,scale,x:width/2-429*scale,y:baseline-320*scale,
    pixelWidth:Math.max(1,Math.round(width*density)),pixelHeight:Math.max(1,Math.round(height*density))};
}
