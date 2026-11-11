import {distanceToMask,boundedAlpha,EDGE_PROFILES} from './edge-composite.js';
// Strict baseline is retained for comparison with bounded generated transparency.
const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const read=(c)=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height);

export function cropOriginal(image,box) {
  const c=make(box.w,box.h);c.getContext('2d').drawImage(image,box.x||0,box.y||0,box.w,box.h,0,0,box.w,box.h);return c;
}

export function geometryMask(source,factor=6,softness=.28) {
  const c=make(source.width*factor,source.height*factor),g=c.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.filter=`blur(${factor*softness}px)`;g.drawImage(source,0,0,c.width,c.height);g.filter='none';
  const im=read(c);
  for(let i=0;i<im.data.length;i+=4){
    // A narrow antialias band around the original alpha boundary, not a new contour.
    im.data[i]=im.data[i+1]=im.data[i+2]=255;
    im.data[i+3]=Math.max(0,Math.min(255,(im.data[i+3]-112)*8));
  }
  g.putImageData(im,0,0);return c;
}

function skinGuide(source) {
  const c=make(source.width,source.height),g=c.getContext('2d');g.drawImage(source,0,0);
  const original=read(c),out=new Uint8ClampedArray(original.data),w=c.width,h=c.height;
  const red=(x,y)=>{if(x<0||x>=w||y<0||y>=h)return false;const p=(y*w+x)*4;
    return original.data[p]>180&&original.data[p+1]<60&&original.data[p+2]<60&&original.data[p+3]>0;};
  // Decode the red/white skin dither in the conservative underpainting only.
  // This fills small uncovered generated edges without leaving red checkerboard patches.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,white=original.data[i]>210&&original.data[i+1]>210&&original.data[i+2]>210;
    if(red(x,y)||(white&&(red(x-1,y)||red(x+1,y)||red(x,y-1)||red(x,y+1)))){
      out[i]=239;out[i+1]=176;out[i+2]=124;
    }
  }
  original.data.set(out);g.putImageData(original,0,0);return c;
}

export function restoreSprite(source,generated,crop,factor=6,softness=.28,character=false) {
  const mask=geometryMask(source,factor,softness),c=make(mask.width,mask.height),g=c.getContext('2d');
  // Source colors fill any uncovered candidate pixels. All drawing keeps source coordinates.
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.filter=`blur(${factor*.45}px)`;g.drawImage(character?skinGuide(source):source,0,0,c.width,c.height);g.filter='none';
  if(generated)g.drawImage(generated,...crop,0,0,c.width,c.height);
  const painted=read(c),geometry=read(mask);
  // Replace alpha, rather than multiplying by the generator's altered edges.
  // The mask also removes generated glows and preserves the original cutouts.
  for(let i=3;i<painted.data.length;i+=4)painted.data[i]=geometry.data[i];
  g.putImageData(painted,0,0);
  return {image:c,mask,source,factor};
}

export function edgeVariants(source,generated,crop,kind,factor=6) {
  if(!generated)return {};
  const pad=4,w=(source.width+pad*2)*factor,h=(source.height+pad*2)*factor;
  const reference=make(w,h),r=reference.getContext('2d');r.imageSmoothingEnabled=false;
  r.drawImage(source,pad*factor,pad*factor,source.width*factor,source.height*factor);
  const ref=read(reference),occupied=new Uint8Array(w*h),gaps=new Uint8Array(w*h);
  for(let p=0;p<occupied.length;p++)occupied[p]=ref.data[p*4+3]>127?1:0;
  // Preserve gaps between limbs/leaves instead of allowing opposing edges to join.
  for(let y=0;y<h;y++){
    let left=0,right=w-1;while(left<w&&!occupied[y*w+left])left++;while(right>=0&&!occupied[y*w+right])right--;
    for(let x=left;x<=right;x++)if(!occupied[y*w+x])gaps[y*w+x]=1;
  }
  const distances=distanceToMask(occupied,w,h);
  const candidate=make(w,h),g=candidate.getContext('2d');g.imageSmoothingQuality='high';
  const sx=crop[2]/source.width,sy=crop[3]/source.height;
  g.drawImage(generated,crop[0]-pad*sx,crop[1]-pad*sy,crop[2]+2*pad*sx,crop[3]+2*pad*sy,0,0,w,h);
  const paint=read(candidate),variants={};
  for(const [name,profile]of Object.entries(EDGE_PROFILES)){
    const c=make(w,h),ctx=c.getContext('2d'),out=ctx.createImageData(w,h);out.data.set(paint.data);
    let trimmed=0,alphaRaised=0,maxOutside=0,protectedGapLeak=0;
    for(let p=0;p<occupied.length;p++){
      const y=Math.floor(p/w),padY=(y-pad*factor)/factor;
      // The lower character area includes the soles and ground shadow; keep a tighter envelope.
      const red=paint.data[p*4],green=paint.data[p*4+1],blue=paint.data[p*4+2];
      const neutralShadow=Math.max(red,green,blue)-Math.min(red,green,blue)<18&&red>45&&red<190;
      const contact=kind==='character'&&padY>=source.height-6&&!neutralShadow;
      const protectedGap=kind!=='island'&&gaps[p];
      const radius=Math.min(profile[kind],protectedGap ? .25 : Infinity,contact ? .25 : Infinity);
      const distance=occupied[p]?0:Math.max(0,(distances[p]-.5)/factor);
      const before=paint.data[p*4+3],after=boundedAlpha(before,distance,radius);
      out.data[p*4+3]=after;if(!after)out.data[p*4]=out.data[p*4+1]=out.data[p*4+2]=0;
      if(after<before)trimmed++;if(after>before)alphaRaised++;
      if(after>0&&!occupied[p])maxOutside=Math.max(maxOutside,distance);
      if(after>0&&protectedGap&&distance>=.25)protectedGapLeak++;
    }
    ctx.putImageData(out,0,0);
    variants[name]={image:c,source,factor,pad,audit:{radius:profile[kind],maxOutside,alphaRaised,protectedGapLeak,trimmed}};
  }
  return variants;
}

export function silhouetteAudit(restored) {
  const actual=read(restored.image),expected=read(restored.mask);
  const source=make(restored.source.width,restored.source.height);
  source.getContext('2d').drawImage(restored.source,0,0);const raw=read(source);
  let missing=0,extra=0,count=0,outsideSourceBand=0,lostSourceInterior=0;
  for(let i=3;i<actual.data.length;i+=4){
    const a=actual.data[i]>127,b=expected.data[i]>127;
    if(a&&!b)extra++;if(b&&!a)missing++;if(b)count++;
    const p=(i-3)/4,x=Math.floor((p%actual.width)/restored.factor),y=Math.floor(Math.floor(p/actual.width)/restored.factor);
    let any=false,all=true;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const sx=x+dx,sy=y+dy,on=sx>=0&&sx<raw.width&&sy>=0&&sy<raw.height&&raw.data[(sy*raw.width+sx)*4+3]>127;
      any||=on;all&&=on;
    }
    if(a&&!any)outsideSourceBand++;if(!a&&all)lostSourceInterior++;
  }
  return {extra,missing,pixels:count,coverage:count?1-missing/count:1,outsideSourceBand,lostSourceInterior,sourceBandPixels:1};
}

export function restoreOcean(source,generated,factor=3) {
  const c=make(source.width*factor,source.height*factor),g=c.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.filter=`blur(${factor*.8}px)`;g.drawImage(source,0,0,c.width,c.height);g.filter='none';
  const guide=read(c),detail=make(c.width,c.height),d=detail.getContext('2d');
  d.drawImage(generated,0,0,c.width,c.height);const paint=read(detail);
  d.filter=`blur(${factor*5}px)`;d.drawImage(generated,0,0,c.width,c.height);d.filter='none';const smooth=read(detail);
  for(let i=0;i<guide.data.length;i+=4){
    for(let channel=0;channel<3;channel++){
      const texture=paint.data[i+channel]-smooth.data[i+channel];
      guide.data[i+channel]=Math.max(0,Math.min(255,guide.data[i+channel]*.88+paint.data[i+channel]*.12+texture*.45));
    }
    guide.data[i+3]=255;
  }
  g.putImageData(guide,0,0);return c;
}
