// Pilot only: image-space correspondence between the eight extracted poses.
// Each point is measured in the untrimmed original sprite coordinate system.
// No procedural stride, joint oscillator, or fixed torso is used.
export const LANDMARKS = {
  1:[[20,7],[35,1],[37,8],[29,14],[36,16],[28,25],[16,25],[11,38],[10,47],[25,39],[18,44],[18,50],[28,57],[29,66],[39,67],[14,51],[7,57],[3,63],[11,68]],
  2:[[20,7],[35,1],[37,8],[29,14],[36,16],[28,25],[16,25],[12,38],[12,48],[25,39],[18,44],[21,51],[24,57],[21,67],[31,70],[16,52],[13,55],[3,60],[8,65]],
  3:[[12,7],[27,1],[29,8],[21,14],[28,16],[21,25],[9,25],[8,39],[12,49],[18,40],[11,46],[12,54],[10,59],[8,70],[19,72],[15,53],[17,57],[5,65],[7,69]],
  4:[[20,7],[35,1],[37,8],[29,14],[36,16],[28,25],[16,25],[17,38],[22,47],[24,39],[18,45],[15,52],[11,60],[3,68],[13,72],[23,52],[25,56],[18,66],[27,70]],
  5:[[21,7],[36,1],[39,8],[32,14],[39,16],[30,25],[20,26],[21,37],[27,47],[27,39],[19,44],[16,51],[9,58],[3,65],[11,70],[25,52],[26,59],[28,66],[39,68]],
  6:[[21,7],[36,1],[39,8],[32,14],[39,16],[30,25],[20,26],[19,38],[25,47],[27,39],[19,44],[17,52],[14,59],[4,64],[6,70],[24,52],[24,59],[20,68],[30,71]],
  7:[[9,7],[25,1],[27,8],[20,14],[27,16],[19,25],[6,25],[5,38],[8,47],[16,39],[10,45],[10,53],[13,58],[4,67],[8,72],[12,54],[11,61],[11,69],[16,71]],
  8:[[17,7],[33,1],[35,8],[28,14],[35,16],[27,25],[14,25],[10,39],[9,49],[23,39],[18,45],[21,53],[24,60],[19,69],[27,73],[16,53],[11,60],[4,68],[11,71]],
};
// The inspection sheet was displayed at 1280 px; saved artwork is 1254 px.
// Undo that display scale before using the measurements in source coordinates.
for(const [id,points]of Object.entries(LANDMARKS)){
  const cell=(Number(id)-1)%4,ox=(cell%2)*96+24,oy=Math.floor(cell/2)*96+10;
  for(const p of points){p[0]=p[0]*1254/1280-ox*(1-1254/1280);p[1]=p[1]*1254/1280-oy*(1-1254/1280);}
}

const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// Bowyer-Watson triangulation; no dependency or implementation from another game.
export function triangulate(points) {
  const p=[...points,[-1000,-1000],[2000,-1000],[0,2000]],n=points.length;
  let triangles=[[n,n+1,n+2]];
  const inside=(t,q)=>{
    const [a,b,c]=t.map(i=>[p[i][0]-q[0],p[i][1]-q[1]]);
    const determinant=(a[0]*a[0]+a[1]*a[1])*(b[0]*c[1]-b[1]*c[0])
      -(b[0]*b[0]+b[1]*b[1])*(a[0]*c[1]-a[1]*c[0])
      +(c[0]*c[0]+c[1]*c[1])*(a[0]*b[1]-a[1]*b[0]);
    return determinant*area(...t.map(i=>p[i]))>1e-8;
  };
  for(let i=0;i<n;i++){
    const bad=triangles.filter(t=>inside(t,p[i])),edges=new Map();
    for(const t of bad)for(let j=0;j<3;j++){
      const edge=[t[j],t[(j+1)%3]],key=[...edge].sort((a,b)=>a-b).join(',');
      if(edges.has(key))edges.delete(key);else edges.set(key,edge);
    }
    triangles=triangles.filter(t=>!bad.includes(t));
    for(const edge of edges.values())if(Math.abs(area(p[edge[0]],p[edge[1]],p[i]))>1e-8)triangles.push([...edge,i]);
  }
  return triangles.filter(t=>t.every(i=>i<n));
}

export function correspondence(a,b) {
  const border=[[-5,-5],[54,-5],[54,83],[-5,83]];
  const left=[...LANDMARKS[a].map(p=>[...p]),...border],right=[...LANDMARKS[b].map(p=>[...p]),...border];
  // At a leg crossing, the screen contour changes ownership. Match visible
  // left/right boundaries there; do not twist a triangle through the other leg.
  for(const points of [left,right])for(const [i,j]of [[11,15],[12,16],[13,17],[14,18]])
    if(points[i][0]>points[j][0])[points[i],points[j]]=[points[j],points[i]];
  let ids=left.map((_,i)=>i),removed=[];
  // Keep the interpolated mesh orientation valid at both anchors. If redundant
  // torso points conflict, remove the least constrained point, never a foot.
  for(let pass=0;pass<12;pass++){
    const l=ids.map(i=>left[i]),r=ids.map(i=>right[i]),mid=l.map((p,i)=>mix(p,r[i],.5));
    const triangles=triangulate(mid);
    const bad=triangles.filter(tri=>{
      const sign=Math.sign(area(...tri.map(i=>l[i])));
      return Array.from({length:17},(_,i)=>i/16).some(t=>
        sign*area(...tri.map(i=>mix(l[i],r[i],t)))<=.001);
    });
    if(!bad.length)return {left:l,right:r,triangles,removed,valid:true};
    const candidates=bad.flat().map(i=>ids[i]).filter(i=>i<13||i===15||i===16);
    if(!candidates.length)return {left:l,right:r,triangles,removed,valid:false};
    const counts=new Map();for(const id of candidates)counts.set(id,(counts.get(id)||0)+1);
    const drop=[...counts].sort((a,b)=>b[1]-a[1])[0][0];removed.push(drop);ids=ids.filter(i=>i!==drop);
  }
  return {valid:false,removed};
}

const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function warpPixels(pixels,w,h,src,dst,triangles) {
  const out=new Uint8ClampedArray(w*h*4);
  // Pixel-center rasterization avoids the translucent seams produced by
  // antialiased Canvas clips along internal triangle edges.
  for(const tri of triangles){
    const [a,b,c]=tri.map(i=>dst[i]),[sa,sb,sc]=tri.map(i=>src[i]),det=area(a,b,c);
    if(Math.abs(det)<1e-8)continue;
    const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const px=x+.5-a[0],py=y+.5-a[1];
      const u=(px*(c[1]-a[1])-py*(c[0]-a[0]))/det,v=((b[0]-a[0])*py-(b[1]-a[1])*px)/det;
      if(u< -1e-9||v< -1e-9||u+v>1+1e-9)continue;
      const sx=sa[0]+u*(sb[0]-sa[0])+v*(sc[0]-sa[0])-.5,sy=sa[1]+u*(sb[1]-sa[1])+v*(sc[1]-sa[1])-.5;
      const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
      let alpha=0,red=0,green=0,blue=0;
      for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
        const xx=ix+dx,yy=iy+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
        const p=(yy*w+xx)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy),a=pixels[p+3]*weight;
        alpha+=a;red+=pixels[p]*a;green+=pixels[p+1]*a;blue+=pixels[p+2]*a;
      }
      const p=(y*w+x)*4;out[p+3]=alpha;
      if(alpha>0){out[p]=red/alpha;out[p+1]=green/alpha;out[p+2]=blue/alpha;}
    }
  }
  return out;
}

export function prepareMorph(a,b,mesh,steps=8,factor=6,pad=5) {
  const w=60*factor,h=90*factor;
  const canonical=item=>{const c=make(w,h);c.getContext('2d').drawImage(item.image,(pad-item.pad)*factor,(pad-item.pad)*factor);return c;};
  const images=[canonical(a),canonical(b)].map(c=>c.getContext('2d').getImageData(0,0,w,h).data),result=[];
  for(let step=1;step<steps;step++){
    const t=step/steps,destination=mesh.left.map((p,i)=>mix(p,mesh.right[i],t).map(v=>(v+pad)*factor));
    const out=make(w,h),g=out.getContext('2d');
    // Keep one complete painted body. Crossfading the warped textures produced
    // doubled contours at knees and hands, so it is deliberately excluded.
    const index=t<.5?0:1,points=(index?mesh.right:mesh.left).map(p=>p.map(v=>(v+pad)*factor));
    const data=g.createImageData(w,h);data.data.set(warpPixels(images[index],w,h,points,destination,mesh.triangles));g.putImageData(data,0,0);
    result.push({image:out,pad,factor});
  }
  return result;
}

export function buildWalkStudy(timeline) {
  const keys=timeline.frames.filter(f=>f.kind==='walk'&&f.route===3).slice(0,9);
  const start=keys[0].time,duration=keys.at(-1).time-start;
  return {keys:keys.map(f=>({...f,time:f.time-start})),duration};
}

export function sampleWalkStudy(study,seconds,steps=8) {
  const time=((seconds%study.duration)+study.duration)%study.duration;
  let index=0;while(index+1<study.keys.length-1&&study.keys[index+1].time<=time+1e-9)index++;
  const a=study.keys[index],b=study.keys[index+1],u=Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));
  // Floor leaves the original key at its timestamp. Substeps share the exact
  // anchor interval, rather than resampling the source at a fabricated cadence.
  const step=Math.min(steps-1,Math.floor((u+1e-9)*steps)),t=step/steps;
  return {a,b,index,step,t,time,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
