// Run this function in the site's browser context to check real Canvas output.
// It uses loadFishing, including the production guide wiring and image decoding.
async function checkFishingRod(){
  const {loadFishing}=await import('./fishing.js');
  const {distanceToMask}=await import('./edge-composite.js');
  const {carriedRodMask}=await import('./fishing-rod.js');
  const json=async path=>(await fetch(path)).json();
  const [walk,reference]=await Promise.all([json('./assets/fidelity/source.json'),json('./assets/fishing/rod-guides.json')]);
  const data=await loadFishing(walk),results=[];
  for(const group of data.manifest.groups.slice(0,5)){
    const image=new Image();image.src='./assets/fishing/'+group.file;await image.decode();
    for(const pose of data.source.poses.filter(p=>p.group===group.id&&p.id<26)){
      const actual=data.poses[pose.id].image,w=actual.width,h=actual.height;
      const crop=data.manifest.poses[pose.id].crop,sx=crop[2]/pose.w,sy=crop[3]/pose.h;
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';
      ctx.drawImage(image,crop[0]-4*sx,crop[1]-4*sy,crop[2]+8*sx,crop[3]+8*sy,0,0,w,h);
      const before=ctx.getImageData(0,0,w,h).data,after=actual.getContext('2d').getImageData(0,0,w,h).data;
      const distances=distanceToMask(carriedRodMask(pose,reference),pose.w,pose.h);
      const columns=[],lost=[];
      for(let x=4;x<(pose.w-1)*4;x++){
        let expected=0,visible=0;
        for(let y=4;y<(pose.h-1)*4;y++){
          if(distances[Math.floor(y/4)*pose.w+Math.floor(x/4)]>5)continue;
          const i=((y+16)*w+x+16)*4;
          // Opaque red/brown ink identifies the rod, independent of the ocean.
          if(before[i]>35&&before[i]>before[i+1]*1.5&&before[i]>before[i+2]*1.5&&before[i+3]>128){
            expected++;if(after[i+3]>96)visible++;
          }
        }
        if(expected>=2){columns.push(x);if(!visible)lost.push(x);}
      }
      if(lost.length)throw new Error(`Rod pose ${pose.id} loses painted columns: ${lost}`);
      if(data.poses[pose.id].variants.large.audit.alphaRaised)throw new Error('Generated transparency increased');
      results.push({pose:pose.id,checkedColumns:columns.length,lostColumns:lost.length});
    }
  }
  return {poses:results.length,checkedColumns:results.reduce((n,r)=>n+r.checkedColumns,0),results};
}
