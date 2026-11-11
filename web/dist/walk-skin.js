import {POSES,bodyPoint,limbPoint,legPoint} from './walk-continuous.js';
const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const hull=points=>{
  const sorted=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=list=>{const out=[];for(const p of list){while(out.length>=2&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
  return [...half(sorted).slice(0,-1),...half(sorted.reverse()).slice(0,-1)];
};

export function headCenter(source){
  const {width:w}=source,d=source.getContext('2d').getImageData(0,0,w,source.height).data;
  let left=w,right=0,top=30,bottom=0;
  for(let y=0;y<22;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>127){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  return [(left+right)/2,(top+bottom)/2];
}

export function layerFromSheet(sheet,cell,reference){
  const factor=6,pad=4,c=make(56*factor,80*factor),g=c.getContext('2d'),k=sheet.width/192;
  g.drawImage(sheet,((cell%2)*96+20)*k,(Math.floor(cell/2)*96+6)*k,56*k,80*k,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height);
  for(let p=3;p<d.data.length;p+=4){const a=d.data[p],t=Math.max(0,Math.min(1,(a-12)/52));d.data[p]=a*t*t*(3-2*t);}
  g.putImageData(d,0,0);
  const ref=reference.image.getContext('2d').getImageData(0,0,reference.image.width,reference.image.height);
  const samples=[];
  for(let y=0;y<c.height;y+=3)for(let x=0;x<c.width;x+=3){const p=(y*c.width+x)*4;if(d.data[p+3]>220)samples.push([x,y,p]);}
  let best=Infinity,offset=[0,0];
  for(let dy=-18;dy<=18;dy+=3)for(let dx=-18;dx<=18;dx+=3){
    let cost=0;for(const [x,y,p]of samples){const xx=x+dx,yy=y+dy;
      if(xx<0||xx>=ref.width||yy<0||yy>=ref.height){cost+=500;continue;}
      const q=(yy*ref.width+xx)*4;
      cost+=(255-ref.data[q+3])*1.5+(Math.abs(d.data[p]-ref.data[q])+Math.abs(d.data[p+1]-ref.data[q+1])+Math.abs(d.data[p+2]-ref.data[q+2]))/3;
    }
    if(cost<best){best=cost;offset=[dx,dy];}
  }
  const aligned=make(c.width,c.height);aligned.getContext('2d').drawImage(c,...offset);
  return {image:aligned,factor,pad,registration:offset.map(v=>v/factor)};
}

export function footGeometry(item,ankle){
  const factor=item.factor,pad=item.pad,c=make(item.image.width,item.image.height),g=c.getContext('2d');g.drawImage(item.image,0,0);
  const d=g.getImageData(0,0,c.width,c.height),support=[];let right=-Infinity,sole=-Infinity,left=Infinity;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const sx=(x+.5)/factor-pad,sy=(y+.5)/factor-pad,p=(y*c.width+x)*4;
    if(sy<ankle[1]-1)continue;
    if(d.data[p+3]>127){support.push([sx,sy]);right=Math.max(right,sx);left=Math.min(left,sx);sole=Math.max(sole,sy);}
  }
  const heel=support.filter(p=>p[0]<left+(right-left)*.4).reduce((a,p)=>p[1]>a[1]?p:a,[0,-Infinity]);
  const ball=support.filter(p=>p[0]>left+(right-left)*.7&&p[0]<left+(right-left)*.92).reduce((a,p)=>p[1]>a[1]?p:a,[0,-Infinity]);
  const restAngle=Math.atan2(ball[1]-heel[1],ball[0]-heel[0]);
  return {ankle,toe:[right,ball[1]],support:hull(support),restAngle,measuredPixels:support.length};
}

export function createSkin(study,parts){
  const canvas=make(2,2),gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,preserveDrawingBuffer:true});
  if(!gl)throw new Error('WebGL indisponível para a animação contínua');
  const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;attribute vec2 uv;uniform vec4 camera;varying vec2 v;void main(){vec2 q=(p-camera.xy)/camera.zw;gl_Position=vec4(q.x*2.-1.,1.-q.y*2.,0.,1.);v=uv;}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D paint;uniform float shade;varying vec2 v;void main(){vec4 c=texture2D(paint,v);gl_FragColor=vec4(c.rgb*shade,c.a);}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const position=gl.getAttribLocation(program,'p'),uv=gl.getAttribLocation(program,'uv'),camera=gl.getUniformLocation(program,'camera'),shade=gl.getUniformLocation(program,'shade');
  gl.enableVertexAttribArray(position);gl.enableVertexAttribArray(uv);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  const prepare=item=>{
    const factor=item.factor,pad=item.pad,w=item.image.width/factor,h=item.image.height/factor;
    const nx=Math.ceil(w/1.5),ny=Math.ceil(h/1.5),points=[],uvs=[],indices=[];
    for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){points.push([x/nx*w-pad,y/ny*h-pad]);uvs.push(x/nx,y/ny);}
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,item.image);
    const vertices=gl.createBuffer(),texcoords=gl.createBuffer(),elements=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,texcoords);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uvs),gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    return {points,output:new Float32Array(points.length*2),vertices,texcoords,elements,texture,count:indices.length};
  };
  const meshes=Object.fromEntries(Object.entries(parts).map(([name,item])=>[name,prepare(item)]));
  const draw=(mesh,transform,darkness=1)=>{
    for(let i=0;i<mesh.points.length;i++){const p=transform(mesh.points[i]);mesh.output[i*2]=p[0];mesh.output[i*2+1]=p[1];}
    gl.bindTexture(gl.TEXTURE_2D,mesh.texture);gl.uniform1f(shade,darkness);
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertices);gl.bufferData(gl.ARRAY_BUFFER,mesh.output,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.texcoords);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.elements);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  };
  return {canvas,render(pose,rect,pixelWidth,pixelHeight){
    if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform4f(camera,rect.x,rect.y,rect.w,rect.h);
    for(const leg of ['far','near']){
      draw(meshes[leg],p=>legPoint(p,POSES[1][leg],pose.legs[leg],pose.feet[leg]),leg==='far'?.93:1);
    }
    draw(meshes.body,p=>bodyPoint(study,pose,p));draw(meshes.arm,p=>limbPoint(p,POSES[1].arm,pose.arm));return canvas;
  }};
}
