// These pixels guide the contour mask only. The rendered pose remains one image.
export function carriedRodMask(pose,reference){
  const rods=pose.recipe.filter(o=>o.bank===reference.bank&&reference.guides[o.index]);
  if(!rods.length)return null;
  const mask=new Uint8Array(pose.w*pose.h);
  for(const rod of rods){
    const guide=reference.guides[rod.index];
    for(const [row,start,length]of guide.runs)for(let column=start;column<start+length;column++){
      const x=rod.x+(rod.flags&2?guide.w-1-column:column);
      const y=rod.y+(rod.flags&1?guide.h-1-row:row);
      if(x>=0&&x<pose.w&&y>=0&&y<pose.h)mask[y*pose.w+x]=1;
    }
  }
  // The rod and its hanging line bound one prop. Its internal space must not
  // become a limb-gap stencil: the generated image already supplies that alpha.
  for(let x=0;x<pose.w;x++){
    let top=0,bottom=pose.h-1;
    while(top<pose.h&&!mask[top*pose.w+x])top++;
    while(bottom>=0&&!mask[bottom*pose.w+x])bottom--;
    for(let y=top;y<=bottom;y++)mask[y*pose.w+x]=1;
  }
  return mask;
}
