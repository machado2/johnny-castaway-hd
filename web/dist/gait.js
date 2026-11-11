// Distance-driven two-bone gait. A supporting foot is stationary in world space.
export const mod = (n,d) => ((n%d)+d)%d;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>t*t*(3-2*t);

export function footAt(distance, leg, stride=128) {
  const phase=mod(distance/stride+leg*.5,1);
  const support=phase<.6;
  const swing=clamp((phase-.6)/.4,0,1);
  return {
    phase,support,
    // During support, d(offset)/d(distance) === -1, cancelling body travel.
    forward:support?stride*(.3-phase):stride*(-.3+.6*smooth(swing)),
    lift:support?0:Math.sin(swing*Math.PI)*23,
    pitch:support?0:-Math.sin(swing*Math.PI*2)*.20,
  };
}

export function solveLeg(hip,ankle,upper=50,lower=48,bend=1) {
  const dx=ankle.x-hip.x,dy=ankle.y-hip.y;
  const actual=Math.hypot(dx,dy);
  const distance=clamp(actual,.001,upper+lower-.001);
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const across=Math.sqrt(Math.max(0,upper*upper-along*along));
  const ux=dx/(actual||1),uy=dy/(actual||1);
  return {x:hip.x+ux*along+uy*across*bend,y:hip.y+uy*along-ux*across*bend};
}

export function longestGroundRun(alpha,width,height,column) {
  const x=clamp(Math.round(column),0,width-1);
  let start=-1,best=[0,height-1];let bestLength=0;
  for(let y=0;y<=height;y++) {
    const solid=y<height&&alpha[(y*width+x)*4+3]>200;
    if(solid&&start<0)start=y;
    if(!solid&&start>=0) {
      if(y-start>bestLength){best=[start,y-1];bestLength=y-start;}
      start=-1;
    }
  }
  return bestLength>0?best:null;
}
