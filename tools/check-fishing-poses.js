// Run in the site's browser context. Checks the actual production Canvas output
// against all 82 complete generated drawings, not merely the rod's color.
async function checkFishingPoses({capture=false}={}){
  const {loadFishing}=await import('./fishing.js?v=whole-pose-1');
  const walk=await(await fetch('./assets/fidelity/source.json')).json();
  const data=await loadFishing(walk),results=[],sheets=[];
  for(const group of data.manifest.groups){
    const image=new Image();image.src='./assets/fishing/'+group.file;await image.decode();
    const sheet=document.createElement('canvas');sheet.width=1120;sheet.height=1260;
    const g=sheet.getContext('2d');g.fillStyle='#9fc1ce';g.fillRect(0,0,sheet.width,sheet.height);
    for(const [local,pose]of data.source.poses.filter(p=>p.group===group.id).entries()){
      const rendered=data.poses[pose.id],actual=rendered.image,w=actual.width,h=actual.height,pad=rendered.pad;
      const crop=data.manifest.poses[pose.id].crop,sx=crop[2]/pose.w,sy=crop[3]/pose.h;
      const candidate=document.createElement('canvas');candidate.width=w;candidate.height=h;
      const ctx=candidate.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingQuality='high';
      ctx.drawImage(image,crop[0]-pad*sx,crop[1]-pad*sy,crop[2]+2*pad*sx,crop[3]+2*pad*sy,0,0,w,h);
      const before=ctx.getImageData(0,0,w,h).data,after=actual.getContext('2d').getImageData(0,0,w,h).data;
      let checkedPixels=0,cutPixels=0,alphaRaised=0;
      for(let i=3;i<before.length;i+=4){
        if(before[i]>=64){checkedPixels++;if(after[i]!==before[i])cutPixels++;}
        if(after[i]>before[i])alphaRaised++;
      }
      results.push({pose:pose.id,checkedPixels,cutPixels,alphaRaised});
      if(capture){
        const scale=Math.min(520/w,365/h),x=(local%2)*560+(560-w*scale)/2,y=Math.floor(local/2)*420+45;
        g.drawImage(actual,x,y,w*scale,h*scale);
        g.font='20px sans-serif';g.fillStyle='#102b39';g.fillText(`Pose ${pose.id} · ${pose.firstTime.toFixed(3)} s`,(local%2)*560+20,Math.floor(local/2)*420+28);
      }
    }
    if(capture)sheets.push(sheet.toDataURL('image/png'));
  }
  return {poses:results.length,checkedPixels:results.reduce((n,r)=>n+r.checkedPixels,0),cutPixels:results.reduce((n,r)=>n+r.cutPixels,0),alphaRaised:results.reduce((n,r)=>n+r.alphaRaised,0),results,sheets};
}
