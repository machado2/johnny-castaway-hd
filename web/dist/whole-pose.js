import {smoothstep} from './edge-composite.js';

// Remove only faint generated fringes. Never use a different silhouette to cut
// through an opaque head, limb, prop or fish in a complete restored drawing.
export function cleanPoseAlpha(alpha){return Math.round(alpha*smoothstep(12,64,alpha));}

export function restoreWholePose(source,generated,crop,factor=4){
  const pad=4,image=document.createElement('canvas');
  image.width=(source.width+pad*2)*factor;image.height=(source.height+pad*2)*factor;
  const ctx=image.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingQuality='high';
  const sx=crop[2]/source.width,sy=crop[3]/source.height;
  ctx.drawImage(generated,crop[0]-pad*sx,crop[1]-pad*sy,crop[2]+2*pad*sx,crop[3]+2*pad*sy,0,0,image.width,image.height);
  const pixels=ctx.getImageData(0,0,image.width,image.height);
  for(let i=3;i<pixels.data.length;i+=4){
    pixels.data[i]=cleanPoseAlpha(pixels.data[i]);
    if(!pixels.data[i])pixels.data[i-3]=pixels.data[i-2]=pixels.data[i-1]=0;
  }
  ctx.putImageData(pixels,0,0);
  return {source,image,pad,factor};
}
