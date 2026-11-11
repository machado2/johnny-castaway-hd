import {buildTimeline,layoutFidelity} from './fidelity-motion.js';
import {cropOriginal,edgeVariants} from './restoration.js';
import {LANDMARKS,correspondence,prepareMorph,buildWalkStudy,sampleWalkStudy} from './walk-morph.js';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const params=new URLSearchParams(location.search),frozen=params.has('t'),speed=params.get('speed')==='slow'?.25:1;
const base=new URL('./assets/fidelity/',import.meta.url),steps=8;
let elapsed=Number(params.get('t'))||0,last=null,request=null,ready=false,layout,study,source;
const old=[],updated=[],morphs={},audits={},intervals=[],drawTimes=[];
const image=async file=>{const im=new Image();im.src=new URL(file,base);await im.decode();return im;};
function resize(){layout=layoutFidelity(innerWidth,innerHeight,devicePixelRatio);canvas.width=layout.pixelWidth;canvas.height=layout.pixelHeight;if(ready)draw();}
function sprite(item,x,y,scale){ctx.drawImage(item.image,x-item.pad*scale,y-item.pad*scale,item.image.width/item.factor*scale,item.image.height/item.factor*scale);}
function draw(){
  const start=performance.now();ctx.setTransform(canvas.width/innerWidth,0,0,canvas.height/innerHeight,0,0);
  ctx.fillStyle='#e5edec';ctx.fillRect(0,0,innerWidth,innerHeight);
  if(params.get('view')==='intermediates'){
    const first=Math.max(1,Math.min(7,Number(params.get('first'))||1)),cell=innerWidth/9,row=innerHeight/2;
    const s=Math.min((cell-10)/60,(row-60)/90);
    for(let r=0;r<2;r++){
      const a=first+r,b=a%8+1,key=`${a}-${b}`;
      for(let col=0;col<9;col++){
        const item=col===0?updated[a]:col===8?updated[b]:morphs[key]?.[col-1]||updated[a];
        const x=col*cell+8,y=r*row+55;
        ctx.fillStyle='#173d3e';ctx.font='14px sans-serif';ctx.fillText(`${a} → ${b} · ${col}/8`,x,r*row+25);
        sprite(item,x,y,s);
      }
    }
  }else if(params.get('view')==='poses'){
    const cell=innerWidth/8,row=innerHeight/2,s=Math.min((cell-16)/56,(row-70)/85);
    for(let r=0;r<2;r++)for(let i=1;i<=8;i++){
      const x=(i-1)*cell+8,y=r*row+55;ctx.fillStyle='#163b3b';ctx.font='14px sans-serif';ctx.fillText(`${r?'Revisto':'Atual'} · ${i}`,x,r*row+25);
      sprite((r?updated:old)[i],x,y,s);
      if(params.has('points'))for(const [id,p]of LANDMARKS[i].entries()){
        ctx.fillStyle='#ec1793';ctx.beginPath();ctx.arc(x+p[0]*s,y+p[1]*s,2,0,Math.PI*2);ctx.fill();ctx.font='10px sans-serif';ctx.fillText(id,x+p[0]*s+2,y+p[1]*s);
      }
    }
  }else{
    const f=sampleWalkStudy(study,elapsed*speed,steps),portrait=innerHeight>innerWidth;
    const pw=portrait?innerWidth:innerWidth/2,ph=portrait?innerHeight/2:innerHeight;
    for(let panel=0;panel<2;panel++){
      const ox=portrait?0:panel*pw,oy=portrait?panel*ph:0;
      ctx.save();ctx.translate(ox,oy);ctx.beginPath();ctx.rect(0,0,pw,ph);ctx.clip();
      const scale=Math.min((pw-40)/110,(ph-120)/95);
      const travel=study.keys.at(-1).x-study.keys[0].x,camera=f.time/study.duration*travel;
      const left=pw/2-(330+camera)*scale,top=ph*.54-277*scale;
      ctx.fillStyle=panel?'#e5edec':'#dfe6e5';ctx.fillRect(0,0,pw,ph);
      ctx.strokeStyle='#b8cbca';ctx.lineWidth=1;
      // Three grid cells per stride make the camera loop continuous too.
      for(let x=200;x<600;x+=travel/3){ctx.beginPath();ctx.moveTo(left+x*scale,top+310*scale);ctx.lineTo(left+x*scale,top+325*scale);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(0,top+316*scale);ctx.lineTo(pw,top+316*scale);ctx.stroke();
      const key=`${f.a.frame}-${f.b.frame}`,candidate=morphs[key]?.[f.step-1];
      const item=panel&&f.step&&candidate?candidate:(panel?updated:old)[f.a.frame];
      const x=panel&&candidate?f.x:f.a.x,y=panel&&candidate?f.y:f.a.y;
      sprite(item,left+x*scale,top+y*scale,scale);
      ctx.fillStyle='#173d3e';ctx.font=`${Math.min(23,pw/21)}px sans-serif`;ctx.fillText(panel?'B · Teste com intermediários':'A · Caminhada HD atual',20,36);
      ctx.font=`${Math.min(16,pw/28)}px sans-serif`;ctx.fillText(panel?'49 quadros extras · 1 transição original':'Oito poses, cadência original',20,63);
      ctx.fillText(speed===1?'Velocidade normal':'Câmera lenta · ¼ da velocidade',20,ph-50);
      ctx.fillText('Câmera acompanha o percurso original',20,ph-26);
      ctx.strokeStyle='#91acab';ctx.strokeRect(0,0,pw,ph);ctx.restore();
    }
  }
  drawTimes.push(performance.now()-start);if(drawTimes.length>300)drawTimes.shift();
}
function loop(now){request=null;if(document.hidden||!ready)return;if(last!==null){const dt=now-last;intervals.push(dt);if(intervals.length>300)intervals.shift();elapsed+=Math.min(100,dt)/1000;}last=now;draw();request=requestAnimationFrame(loop);}
function resume(){last=null;if(request!==null)cancelAnimationFrame(request);request=ready&&!frozen&&!document.hidden?requestAnimationFrame(loop):null;}
addEventListener('resize',resize);document.addEventListener('visibilitychange',resume);addEventListener('pagehide',()=>cancelAnimationFrame(request));addEventListener('pageshow',resume);resize();
try{
  source=await(await fetch(new URL('source.json',base))).json();study=buildWalkStudy(buildTimeline(source));
  const [original,a,b,b2]=await Promise.all(['source-walk.png','restored-walk-a.png','restored-walk-b.png','restored-walk-b-v2.png'].map(image));
  for(let i=1;i<=8;i++){
    const shape=source.walkFrames[i],cell=(i-1)%4,src=cropOriginal(original,shape);
    for(const [target,candidate]of [[old,i<=4?a:b],[updated,i<=4?a:b2]]){
      const factor=candidate.width/192,box=[((cell%2)*96+24)*factor,(Math.floor(cell/2)*96+10)*factor,shape.w*factor,shape.h*factor];
      target[i]=edgeVariants(src,candidate,box,'character').large;
    }
  }
  for(let i=1;i<=8;i++){
    const next=i%8+1,key=`${i}-${next}`,mesh=correspondence(i,next);audits[key]={valid:mesh.valid,removed:mesh.removed};
    if(mesh.valid)morphs[key]=prepareMorph(updated[i],updated[next],mesh,steps);
  }
  ready=true;canvas.dataset.ready='true';draw();resume();
  const p95=a=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*.95)]:0;
  Object.defineProperty(window,'castawayWalkStudy',{value:Object.freeze({get status(){return {elapsed,speed,duration:study.duration,keys:study.keys,steps,intermediates:Object.values(morphs).reduce((n,a)=>n+a.length,0),audits,fps:intervals.length?1000/(intervals.reduce((a,b)=>a+b)/intervals.length):0,p95DrawMs:p95(drawTimes),sample:sampleWalkStudy(study,elapsed*speed,steps),viewport:layout};}})});
}catch(error){canvas.dataset.error=String(error);console.error(error);}
