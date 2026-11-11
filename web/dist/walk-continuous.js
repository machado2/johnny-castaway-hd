// Original-pose guides in original decoded pixel coordinates, never sorted by x.
// Near and far refer to physical limbs, not to screen-left/screen-right.
export const POSES={
  1:{near:[[25,50],[26,56],[28,64]],far:[[16,51],[8,56],[4,63]],arm:[[17,26],[11,38],[11,47]]},
  2:{near:[[24,51],[24,56],[21,65]],far:[[17,51],[12,55],[4,60]],arm:[[17,26],[12,38],[12,49]]},
  3:{near:[[12,53],[11,58],[9,68]],far:[[16,53],[17,57],[6,65]],arm:[[9,26],[8,40],[12,50]]},
  4:{near:[[14,52],[10,58],[5,66]],far:[[23,52],[23,57],[18,65]],arm:[[17,26],[17,38],[22,48]]},
  5:{near:[[16,50],[9,56],[4,65]],far:[[25,50],[26,57],[28,64]],arm:[[20,26],[21,37],[27,47]]},
  6:{near:[[18,51],[15,57],[4,62]],far:[[24,51],[24,58],[20,67]],arm:[[20,26],[19,38],[25,47]]},
  7:{near:[[13,52],[12,56],[3,62]],far:[[8,53],[9,58],[10,67]],arm:[[6,26],[5,38],[8,48]]},
  8:{near:[[22,51],[19,57],[17,65]],far:[[13,52],[6,58],[4,65]],arm:[[14,26],[10,39],[9,50]]},
};
export const FLOOR=315;
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const hermite=(a,b,ma,mb,t,dt)=>(2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*dt*ma+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*dt*mb;

// C1 curve with periodic values and a forward stride offset. No frame bins.
export function periodicPoint(keys,points,time,period,travel=0){
  const cycle=Math.floor(time/period),t=time-cycle*period,n=keys.length;
  let i=n-1;for(let j=0;j<n-1;j++)if(t<keys[j+1]){i=j;break;}
  const point=j=>{const c=Math.floor(j/n),k=((j%n)+n)%n;return [points[k][0]+c*travel,points[k][1]];};
  const stamp=j=>keys[((j%n)+n)%n]+Math.floor(j/n)*period;
  const a=point(i),b=point(i+1),prev=point(i-1),next=point(i+2),dt=stamp(i+1)-stamp(i),u=(t-stamp(i))/dt;
  return a.map((v,k)=>hermite(v,b[k],(b[k]-prev[k])/(stamp(i+1)-stamp(i-1)),(next[k]-a[k])/(stamp(i+2)-stamp(i)),u,dt)+(k===0?cycle*travel:0));
}

// Monotone cubic: an airborne foot cannot reverse its progression because a
// generic spline overshot a guide. Zero endpoint slopes join stationary support.
export function swingValue(times,values,t){
  if(t<=times[0])return values[0];if(t>=times.at(-1))return values.at(-1);
  const n=times.length,s=values.slice(1).map((v,i)=>(v-values[i])/(times[i+1]-times[i]));
  const m=values.map((_,i)=>i===0||i===n-1?0:s[i-1]*s[i]<=0?0:2*s[i-1]*s[i]/(s[i-1]+s[i]));
  let i=0;while(times[i+1]<t)i++;
  const dt=times[i+1]-times[i],u=(t-times[i])/dt;return hermite(values[i],values[i+1],m[i],m[i+1],u,dt);
}

export function makeContinuousStudy(timeline,headCenters){
  const frames=timeline.frames.filter(f=>f.kind==='walk'&&f.route===3).slice(0,9);
  const start=frames[0].time,period=frames.at(-1).time-start,travel=frames.at(-1).x-frames[0].x;
  const keys=frames.slice(0,8).map(f=>({...f,time:f.time-start})),times=keys.map(f=>f.time);
  const guides={head:keys.map(f=>add([f.x,f.y],headCenters[f.frame]))};
  for(const part of ['near','far','arm'])for(let j=0;j<3;j++)guides[part+j]=keys.map(f=>add([f.x,f.y],POSES[f.frame][part][j]));
  guides.hip=keys.map(f=>add([f.x,f.y],POSES[f.frame].near[0].map((v,i)=>(v+POSES[f.frame].far[0][i])/2)));
  return {keys,times,period,travel,guides,headReference:headCenters[1],hipReference:[20.5,50.5]};
}

export function footPhase(study,leg,seconds){
  const {period,travel,times}=study;
  // Near support: pose 1 until pose 5 of the next stride. Far: pose 5 to pose 1.
  const land=leg==='near'?times[5]:times[1],release=leg==='near'?times[1]+period:times[5];
  const cycle=Math.floor((seconds-land)/period),local=seconds-cycle*period;
  const anchor=(leg==='near'?381:353)+cycle*travel;
  if(local<=release)return {leg,stance:true,toeX:anchor,lift:0,pitch:0,cycle};
  const swingTimes=leg==='near'?[times[1],times[2],times[3],times[4],times[5]].map(t=>t+period)
    :[times[5],times[6],times[7],period,period+times[1]];
  const positions=leg==='near'?[0,6,23,41,57]:[0,4,16,40,57];
  const lift=[0,4.5,6,3,0],pitch=[0,.65,.3,-.18,0];
  return {leg,stance:false,toeX:anchor+swingValue(swingTimes,positions,local),lift:swingValue(swingTimes,lift,local),pitch:swingValue(swingTimes,pitch,local),cycle};
}

export function poseAt(study,seconds,foot){
  const sample=name=>periodicPoint(study.times,study.guides[name],seconds,study.period,study.travel);
  const pose={head:sample('head'),hip:sample('hip'),feet:{},legs:{}};
  for(const leg of ['far','near']){
    const geometry=foot[leg],phase=footPhase(study,leg,seconds),angle=phase.pitch-geometry.restAngle,c=Math.cos(angle),s=Math.sin(angle);
    let bottom=-Infinity;for(const p of geometry.support)bottom=Math.max(bottom,s*(p[0]-geometry.ankle[0])+c*(p[1]-geometry.ankle[1]));
    const toe=[geometry.toe[0]-geometry.ankle[0],geometry.toe[1]-geometry.ankle[1]];
    const ankle=[phase.toeX-(c*toe[0]-s*toe[1]),FLOOR-phase.lift-bottom];
    const hip=sample(leg+'0'),guide=sample(leg+'1'),dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],length=Math.hypot(dx,dy);
    const normal=[dy/length,-dx/length],center=[lerp(hip[0],ankle[0],.48),lerp(hip[1],ankle[1],.48)];
    // A hidden joint's guide must not produce a backwards knee. Preserve its
    // bend magnitude, with a small positive bend through the passing pose.
    const bend=Math.max(1.1,Math.min(length*.55,Math.abs((guide[0]-center[0])*normal[0]+(guide[1]-center[1])*normal[1])));
    const knee=[center[0]+normal[0]*bend,center[1]+normal[1]*bend];
    pose.legs[leg]=[hip,knee,ankle];pose.feet[leg]={...phase,pitch:angle,ankle,bottom};
  }
  const shoulder=bodyPoint(study,pose,POSES[1].arm[0]),guidedShoulder=sample('arm0'),delta=[shoulder[0]-guidedShoulder[0],shoulder[1]-guidedShoulder[1]];
  pose.arm=[shoulder,add(sample('arm1'),delta),add(sample('arm2'),delta)];return pose;
}

export function bodyPoint(study,pose,p){
  const u=smooth((p[1]-23)/27),a=[pose.head[0]-study.headReference[0],pose.head[1]-study.headReference[1]],b=[pose.hip[0]-study.hipReference[0],pose.hip[1]-study.hipReference[1]];
  return [p[0]+lerp(a[0],b[0],u),p[1]+lerp(a[1],b[1],u)];
}

export function bonePoint(p,a,b,x,y){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),tx=y[0]-x[0],ty=y[1]-x[1],targetLength=Math.hypot(tx,ty);
  const along=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length),across=((p[0]-a[0])*-dy+(p[1]-a[1])*dx)/length;
  return [x[0]+along*tx-across*ty/targetLength,x[1]+along*ty+across*tx/targetLength];
}

export function limbPoint(p,rest,target){
  const a=bonePoint(p,rest[0],rest[1],target[0],target[1]),b=bonePoint(p,rest[1],rest[2],target[1],target[2]);
  const u=smooth((p[1]-(rest[1][1]-2))/4),base=[lerp(a[0],b[0],u),lerp(a[1],b[1],u)];
  return base;
}

export function rigidFootPoint(p,ankle,transform){
  const c=Math.cos(transform.pitch),s=Math.sin(transform.pitch),dx=p[0]-ankle[0],dy=p[1]-ankle[1];
  return [transform.ankle[0]+c*dx-s*dy,transform.ankle[1]+s*dx+c*dy];
}

export function legPoint(p,rest,target,foot){
  const upper=limbPoint(p,rest,target),lower=rigidFootPoint(p,rest[2],foot);
  const u=smooth((p[1]-(rest[2][1]-6))/5);
  return [lerp(upper[0],lower[0],u),lerp(upper[1],lower[1],u)];
}
