// Original source geometry is authoritative. Generated art contributes finish.
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
