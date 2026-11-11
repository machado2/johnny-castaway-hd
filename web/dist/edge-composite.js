// Distances and limits use original source pixels, independent of viewport/DPR.
export const EDGE_PROFILES=Object.freeze({
  small:Object.freeze({island:1,palm:.65,character:.5}),
  large:Object.freeze({island:2,palm:1,character:2}),
});
export const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

// Exact squared Euclidean distance transform, separable lower envelopes.
export function distanceToMask(mask,width,height) {
  const size=Math.max(width,height),v=new Int32Array(size),z=new Float64Array(size+1);
  const f=new Float64Array(size),d=new Float64Array(size),temp=new Float64Array(width*height);
  const transform=n=>{
    let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
    for(let q=1;q<n;q++){
      let s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*(q-v[k]));
      while(s<=z[k]){k--;s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*(q-v[k]));}
      v[++k]=q;z[k]=s;z[k+1]=Infinity;
    }
    k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])**2+f[v[k]];}
  };
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++)f[x]=mask[y*width+x]?0:1e12;
    transform(width);for(let x=0;x<width;x++)temp[y*width+x]=d[x];
  }
  const out=new Float32Array(width*height);
  for(let x=0;x<width;x++){
    for(let y=0;y<height;y++)f[y]=temp[y*width+x];
    transform(height);for(let y=0;y<height;y++)out[y*width+x]=Math.sqrt(d[y]);
  }
  return out;
}

export function boundedAlpha(alpha,distance,radius,feather=.35) {
  // Only attenuate alpha: never turn a translucent generated fringe opaque.
  const clean=alpha*smoothstep(12,64,alpha);
  const guard=1-smoothstep(Math.max(0,radius-feather),radius,distance);
  return Math.round(clean*guard);
}

export function paddedPlacement(box,pad=0) {
  return {x:box.x-pad,y:box.y-pad,w:box.w+pad*2,h:box.h+pad*2};
}
