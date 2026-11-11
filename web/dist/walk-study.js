import {buildTimeline,layoutFidelity} from './fidelity-motion.js';
import {cropOriginal,edgeVariants} from './restoration.js';
import {FLOOR,POSES,makeContinuousStudy,poseAt} from './walk-continuous.js';
import {headCenter,layerFromSheet,footGeometry,createSkin} from './walk-skin.js';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const params=new URLSearchParams(location.search),frozen=params.has('t'),speed=params.get('speed')==='slow'?.25:1;
const base=new URL('./assets/fidelity/',import.meta.url);
let elapsed=frozen?(Number(params.get('t'))||0):1.1/speed,last=null,request=null,ready=false,layout,study,source,skin,foot;
const originals=[],intervals=[],drawTimes=[];
const image=async file=>{const im=new Image();im.src=new URL(file,base);await im.decode();return im;};
function resize(){layout=layoutFidelity(innerWidth,innerHeight,devicePixelRatio);canvas.width=layout.pixelWidth;canvas.height=layout.pixelHeight;if(ready)draw();}
const stripTime=()=>elapsed*speed%(study.period*225/study.travel);
function reference(t){const cycle=Math.floor(t/study.period),phase=t-cycle*study.period;let i=0;while(i+1<study.keys.length&&study.keys[i+1].time<=phase+1e-9)i++;return {...study.keys[i],x:study.keys[i].x+cycle*study.travel};}
function draw(){
  const started=performance.now(),density=canvas.width/innerWidth;
  ctx.setTransform(density,0,0,canvas.height/innerHeight,0,0);ctx.fillStyle='#e5edec';ctx.fillRect(0,0,innerWidth,innerHeight);
  if(params.get('view')==='phases'){
    const w=innerWidth/4,h=innerHeight/2,s=Math.min((w-20)/64,(h-45)/84);
    for(let i=0;i<8;i++){
      const pose=poseAt(study,study.period+study.times[i],foot),x=(i%4)*w,y=Math.floor(i/4)*h;
      const rect={x:pose.hip[0]-w/(2*s),y:FLOOR-(h-20)/s,w:w/s,h:h/s};
      ctx.drawImage(skin.render(pose,rect,Math.round(w*density),Math.round(h*density)),x,y,w,h);
      ctx.fillStyle='#173d3e';ctx.font='14px sans-serif';ctx.fillText(`Pose ${study.keys[i].frame}`,x+12,y+20);
      ctx.strokeStyle='#a5bbbb';ctx.beginPath();ctx.moveTo(x,y+h-20);ctx.lineTo(x+w,y+h-20);ctx.stroke();
    }
    return;
  }
  const t=stripTime(),pose=poseAt(study,t,foot),f=reference(t),portrait=innerHeight>innerWidth;
  const pw=portrait?innerWidth:innerWidth/2,ph=portrait?innerHeight/2:innerHeight;
  const s=Math.max(.1,Math.min((pw-24)/150,(ph*.76-90)/80)),ox=pw/2-75*s,oy=ph*.76-FLOOR*s;
  for(let panel=0;panel<2;panel++){
    ctx.save();ctx.translate(portrait?0:panel*pw,portrait?panel*ph:0);ctx.beginPath();ctx.rect(0,0,pw,ph);ctx.clip();
    ctx.fillStyle=panel?'#e5edec':'#dfe6e5';ctx.fillRect(0,0,pw,ph);
    ctx.strokeStyle='#bacccb';ctx.lineWidth=1;
    for(let x=0;x<=150;x+=15){ctx.beginPath();ctx.moveTo(ox+x*s,oy+(FLOOR-2)*s);ctx.lineTo(ox+x*s,oy+(FLOOR+6)*s);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(0,oy+FLOOR*s);ctx.lineTo(pw,oy+FLOOR*s);ctx.stroke();
    if(!panel){
      const im=originals[f.frame];ctx.imageSmoothingEnabled=false;ctx.drawImage(im,ox+(f.x-365)*s,oy+f.y*s,im.width*s,im.height*s);ctx.imageSmoothingEnabled=true;
    }else{
      for(const contact of Object.values(pose.feet)){
        const x=ox+(contact.ankle[0]+3-365)*s,y=oy+FLOOR*s;
        ctx.fillStyle=`rgba(39,57,57,${.16*(1-contact.lift/12)})`;ctx.beginPath();ctx.ellipse(x,y+1*s,10*s,1.6*s,0,0,Math.PI*2);ctx.fill();
      }
      const rect={x:365-ox/s,y:-oy/s,w:pw/s,h:ph/s};
      ctx.drawImage(skin.render(pose,rect,Math.max(1,Math.round(pw*density)),Math.max(1,Math.round(ph*density))),0,0,pw,ph);
      if(params.has('debug'))for(const leg of ['far','near']){
        ctx.strokeStyle=leg==='near'?'#ce4879':'#328cba';ctx.lineWidth=2;ctx.beginPath();
        pose.legs[leg].forEach((p,i)=>{const x=ox+(p[0]-365)*s,y=oy+p[1]*s;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
        const contact=pose.feet[leg];if(contact.stance){ctx.fillStyle='#197f55';ctx.beginPath();ctx.arc(ox+(contact.toeX-365)*s,oy+FLOOR*s,3,0,Math.PI*2);ctx.fill();}
      }
    }
    ctx.fillStyle='#173d3e';ctx.font=`${Math.min(22,pw/22)}px sans-serif`;ctx.fillText(panel?'B · Caminhada contínua':'A · Original extraído',16,32);
    ctx.font=`${Math.min(15,pw/29)}px sans-serif`;ctx.fillText(panel?'Pernas separadas · apoio dos pés fixo':'Imagens e cadência de referência',16,57);
    ctx.fillText(speed===1?'Velocidade normal':'Câmera lenta · ¼ da velocidade',16,ph-42);ctx.fillText('Câmera fixa · reinício fora da tela',16,ph-20);
    ctx.strokeStyle='#91acab';ctx.strokeRect(0,0,pw,ph);ctx.restore();
  }
  drawTimes.push(performance.now()-started);if(drawTimes.length>300)drawTimes.shift();
}
function loop(now){request=null;if(document.hidden||!ready)return;if(last!==null){const dt=now-last;intervals.push(dt);if(intervals.length>300)intervals.shift();elapsed+=Math.min(100,dt)/1000;}last=now;draw();request=requestAnimationFrame(loop);}
function resume(){last=null;if(request!==null)cancelAnimationFrame(request);request=ready&&!frozen&&!document.hidden?requestAnimationFrame(loop):null;}
addEventListener('resize',resize);document.addEventListener('visibilitychange',resume);addEventListener('pagehide',()=>cancelAnimationFrame(request));addEventListener('pageshow',resume);resize();
try{
  source=await(await fetch(new URL('source.json',base))).json();
  const [original,layers,walkA]=await Promise.all(['source-walk.png','walk-layers-v1.png','restored-walk-a.png'].map(image));
  for(let i=1;i<=8;i++)originals[i]=cropOriginal(original,source.walkFrames[i]);
  study=makeContinuousStudy(buildTimeline(source),Object.fromEntries(originals.flatMap((c,i)=>c?[[i,headCenter(c)]]:[])));
  const parts={},shape=source.walkFrames[1],ka=walkA.width/192;
  const ref= edgeVariants(originals[1],walkA,[24*ka,10*ka,shape.w*ka,shape.h*ka],'character').large;
  for(const [cell,name]of ['body','arm','near','far'].entries()){
    parts[name]=layerFromSheet(layers,cell,ref);
  }
  foot=Object.fromEntries(['near','far'].map(leg=>[leg,footGeometry(parts[leg],POSES[1][leg][2])]));
  skin=createSkin(study,parts);ready=true;canvas.dataset.ready='true';draw();resume();
  const p95=a=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*.95)]:0;
  Object.defineProperty(window,'castawayWalkStudy',{value:Object.freeze({get status(){
    const time=stripTime(),p=poseAt(study,time,foot);return {version:'continuous-limbs-v1',elapsed,time,speed,period:study.period,travel:study.travel,camera:'fixed',reference:'decoded-original',textureSwitches:0,feet:p.feet,body:p.hip,registrations:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,v.registration])),footGeometry:Object.fromEntries(Object.entries(foot).map(([k,v])=>[k,{ankle:v.ankle,toe:v.toe,restAngle:v.restAngle,supportPixels:v.support.length}])),
      fps:intervals.length?1000/(intervals.reduce((a,b)=>a+b)/intervals.length):0,p95DrawMs:p95(drawTimes),viewport:layout};
  },audit(seconds){return poseAt(study,seconds,foot);},get guides(){return structuredClone(study);},get foot(){return structuredClone(foot);}})});
}catch(error){canvas.dataset.error=String(error);console.error(error);}
