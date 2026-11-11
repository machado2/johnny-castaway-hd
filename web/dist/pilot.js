import {layoutPilot, samplePilot, cuesBetween, positiveMod, clamp, DURATION} from './pilot-motion.js';
import {OriginalAudio} from './audio.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {alpha:false});
const base = new URL('./assets/pilot/', import.meta.url);
const params = new URLSearchParams(location.search);
const still = params.has('t') && Number.isFinite(Number(params.get('t')));
const startAt = still ? Math.max(0, Number(params.get('t'))) : 0;
let sceneTime = startAt, lastTime = null, ready = false, layout, background;
let assets, audio, frameCount = 0, requestId = null, dpr = 0;
const frameTimes = [], drawTimes = [];

function gradient(context, x0,y0,x1,y1, stops) {
  const g = context.createLinearGradient(x0,y0,x1,y1);
  for (const [stop,color] of stops) g.addColorStop(stop,color);
  return g;
}
function ellipse(context,x,y,rx,ry,color) {
  context.fillStyle=color; context.beginPath();
  context.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);context.fill();
}
function curve(context, points, color, width=1) {
  context.beginPath(); context.moveTo(...points[0]);
  for (let i=1;i<points.length;i++) context.lineTo(...points[i]);
  context.strokeStyle=color;context.lineWidth=width;context.stroke();
}

function makeBackground() {
  const {width:w,height:h,horizon,centerX,baseline,islandWidth} = layout;
  const bg=document.createElement('canvas');bg.width=canvas.width;bg.height=canvas.height;
  const c=bg.getContext('2d',{alpha:false});c.scale(canvas.width/w,canvas.height/h);
  c.fillStyle=gradient(c,0,0,0,horizon,[[0,'#4bacc8'],[.58,'#9cd8db'],[1,'#f0ebcb']]);
  c.fillRect(0,0,w,horizon+1);
  const glow=c.createRadialGradient(w*.24,horizon*.30,1,w*.24,horizon*.30,h*.40);
  glow.addColorStop(0,'#fff3cb90');glow.addColorStop(.40,'#fff3cb28');glow.addColorStop(1,'#fff3cb00');
  c.fillStyle=glow;c.fillRect(0,0,w,horizon);
  c.fillStyle=gradient(c,0,horizon,0,h,[[0,'#55b8bc'],[.19,'#309db3'],[.62,'#187f9e'],[1,'#125572']]);
  c.fillRect(0,horizon,w,h-horizon);
  const lagoon=c.createRadialGradient(centerX,baseline,1,centerX,baseline,islandWidth*.69);
  lagoon.addColorStop(0,'#66d6bc95');lagoon.addColorStop(.5,'#45cab754');lagoon.addColorStop(1,'#45cab700');
  c.save();c.beginPath();c.rect(0,horizon,w,h-horizon);c.clip();
  c.translate(0,baseline*.61);c.scale(1,.39);c.fillStyle=lagoon;c.fillRect(0,0,w,h*3);c.restore();
  c.fillStyle=gradient(c,0,horizon-2,0,horizon+14,[[0,'#fff4d230'],[1,'#fff4d200']]);
  c.fillRect(0,horizon-2,w,16);
  return bg;
}

function resize() {
  dpr=window.devicePixelRatio||1;
  layout=layoutPilot(innerWidth,innerHeight,dpr);
  canvas.width=layout.pixelWidth;canvas.height=layout.pixelHeight;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  background=makeBackground();
  if(ready) render(sceneTime);
}

function drawClouds(t) {
  const {width:w,horizon,scale:s}=layout;
  // Soft cloud banks, independent of screen aspect ratio and island scale.
  const unit=Math.max(60,Math.min(150,w*.12));
  const clouds=[[.08,.31,.90],[.43,.18,.6],[.78,.43,1.2],[.96,.13,.65]];
  for(let i=0;i<clouds.length;i++) {
    const [fraction,vertical,size]=clouds[i];
    const x=positiveMod(w*fraction+t*(2.4+i*.28)+unit*2,w+unit*4)-unit*2;
    const y=horizon*vertical, radius=unit*size;
    ctx.save();ctx.translate(x,y);
    ctx.globalAlpha=.53;
    const haze=ctx.createRadialGradient(0,0,2,0,0,radius);
    haze.addColorStop(0,'#fff8e7b0');haze.addColorStop(.7,'#fff8e760');haze.addColorStop(1,'#fff8e700');
    ctx.scale(1,.29);ctx.fillStyle=haze;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore();
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=.54;
    ctx.fillStyle='#fff9e6';ctx.beginPath();ctx.moveTo(-radius*.94,radius*.07);
    ctx.bezierCurveTo(-radius*.7,-radius*.02,-radius*.67,-radius*.05,-radius*.5,-radius*.03);
    ctx.bezierCurveTo(-radius*.4,-radius*.27,-radius*.11,-radius*.26,0,-radius*.1);
    ctx.bezierCurveTo(radius*.17,-radius*.16,radius*.37,-radius*.10,radius*.45,-radius*.03);
    ctx.bezierCurveTo(radius*.72,-radius*.02,radius*.72,radius*.04,radius*.95,radius*.07);
    ctx.bezierCurveTo(radius*.35,radius*.12,-radius*.38,radius*.13,-radius*.94,radius*.07);
    ctx.fill();ctx.restore();
  }
}

function drawWater(t) {
  const {width:w,height:h,horizon,scale:s,centerX:cx,baseline:cy,islandWidth:iw}=layout;
  ctx.save();ctx.beginPath();ctx.rect(0,horizon,w,h-horizon);ctx.clip();ctx.lineCap='round';
  for(let row=0;row<34;row++) {
    const depth=(row+.5)/34;
    const y=horizon+depth*depth*(h-horizon);
    const amplitude=(.8+depth*3.2)*Math.min(1.5,w/1200);
    // Broken, softly curved wavelets avoid ruler-straight bands across the sea.
    const span=110+depth*220;
    for(let segment=-1;segment<w/span+1;segment++) {
      const offset=Math.sin(row*19.73)*span;
      const start=segment*span+offset+Math.sin(t*.25+row)*12;
      const length=span*(.30+.28*(.5+.5*Math.sin(row+segment*1.27)));
      const bend=Math.sin(start*.008+row*1.81-t*.36)*amplitude;
      ctx.strokeStyle=row%3===0?'#c2f4dd27':'#075d8117';
      ctx.lineWidth=.6+depth*1.8;ctx.beginPath();ctx.moveTo(start,y+bend);
      ctx.bezierCurveTo(start+length*.32,y+bend-amplitude,start+length*.70,y+bend+amplitude,start+length,y+bend*.5);
      ctx.stroke();
    }
  }
  // Short glints travel continuously, with stable spatial noise (no flicker).
  for(let i=0;i<100;i++) {
    const seed=Math.sin(i*127.1+3.7)*43758.5453;
    const depth=.06+positiveMod(seed,1)*.93;
    const x=positiveMod(i*293.77+Math.sin(t*.25+i)*17,w+110)-55;
    const y=horizon+depth*depth*(h-horizon);
    const length=(6+positiveMod(seed*3.7,1)*24)*(.3+depth);
    const opacity=(.035+.065*(.5+.5*Math.sin(t*.7+i*2.3)));
    ctx.strokeStyle=`rgba(209,248,226,${opacity})`;ctx.lineWidth=.7+depth;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+length*.5,y+1.8,x+length,y);ctx.stroke();
  }
  // Shallow water and rolling foam surround the island before land is composed.
  ellipse(ctx,cx,cy+48*s,iw*.54,iw*.115,'#5ac9b347');
  for(let n=0;n<4;n++) {
    const phase=positiveMod(t*.21+n/4,1);
    const opacity=Math.sin(phase*Math.PI)*.36;
    const rx=iw*(.49+phase*.075),ry=iw*(.085+phase*.035);
    ctx.beginPath();
    for(let j=0;j<=180;j++) {
      const a=j/180*Math.PI*2;
      const ripple=1+.012*Math.sin(a*9+t*.8)+.006*Math.sin(a*17-t*.5);
      const x=cx+Math.cos(a)*rx*ripple,y=cy+40*s+Math.sin(a)*ry*ripple;
      j===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle=`rgba(219,255,233,${opacity})`;ctx.lineWidth=(1.4+(1-phase)*2)*s;ctx.stroke();
  }
  ctx.restore();
}

function drawAsset(name,index,x,y,height,flip=1,angle=0) {
  const asset=assets[name];
  const f=asset.frames[index%asset.frames.length],k=height/f.bodyHeight;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flip,1);
  ctx.drawImage(asset.image,f.x,f.y,f.w,f.h,-f.anchorX*k,-f.anchorY*k,f.w*k,f.h*k);
  ctx.restore();
}

function drawLand() {
  const {centerX:cx,baseline:cy,islandWidth:iw,scale:s}=layout;
  const a=assets.island,f=a.frames[0],height=iw*f.h/f.w;
  ctx.drawImage(a.image,f.x,f.y,f.w,f.h,cx-iw/2,cy-101*s,iw,height);
  // A quiet contact shadow links the palm to the newly painted sand.
  ctx.save();ctx.translate(layout.palmX,layout.palmY+3*s);ctx.rotate(-.16);
  ellipse(ctx,-35*s,3*s,91*s,12*s,'#5f62212a');ctx.restore();
}

function drawPalm(t) {
  const {palmX,palmY,scale:s}=layout;
  drawAsset('palm',0,palmX,palmY,510*s,1,Math.sin(t*.65)*.008+Math.sin(t*.23)*.004);
}

function fishingFrame(phase) {
  const t=phase*12;
  if(t<.55)return 0;
  if(t<1.05)return 1;
  if(t<1.5)return 2;
  if(t<6.9)return (t%2.7>2.55)?4:3;
  if(t<7.55)return 5;
  if(t<8.2)return 6;
  if(t<9.0)return 7;
  return 3;
}

function characterPosition(sample) {
  const {centerX:cx,islandWidth:iw,baseline:cy,scale:s}=layout;
  const y=cy+sample.groundOffset*s;
  return {x:cx+sample.x*iw,y,behind:y<layout.palmY};
}

function drawFishingLine(sample,position) {
  const {scale:s,islandWidth:iw,centerX:cx,baseline:cy}=layout;
  const elapsed=sample.phase*12;
  const fade=clamp((elapsed-1.05)/.3,0,1)*clamp((12-elapsed)/.4,0,1);
  if(!fade)return;
  // End point is a world coordinate, not a sprite coordinate, so line and bobber
  // stay connected through screen resizes. Tip positions come from the atlas.
  const f=assets.fish.frames[fishingFrame(sample.phase)];
  const k=layout.characterHeight/f.bodyHeight;
  const tip=f.rodTip||[f.w*.03,f.h*.2];
  const tx=position.x+(tip[0]-f.anchorX)*k;
  const ty=position.y+(tip[1]-f.anchorY)*k;
  const bx=cx-iw*.48,by=cy+113*s+Math.sin(sceneTime*2.4)*2*s;
  ctx.save();ctx.globalAlpha=fade;
  ctx.strokeStyle='#e6f0d8bb';ctx.lineWidth=Math.max(.6,.9*s);ctx.beginPath();
  ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx-26*s,(ty+by)*.52,bx,by);ctx.stroke();
  ellipse(ctx,bx,by+2*s,11*s,3*s,'#d5f9e751');
  ellipse(ctx,bx,by,2.6*s,4*s,'#d7653e');
  ellipse(ctx,bx,by-2*s,2.3*s,1.6*s,'#ffe8b4');
  // A short bite ripple is synchronized with the cue instead of frame count.
  const bite=elapsed-7.4;
  if(bite>0&&bite<1.8) {
    ctx.globalAlpha=fade*(1-bite/1.8);ctx.strokeStyle='#effee7';ctx.lineWidth=s;
    ctx.beginPath();ctx.ellipse(bx,by,4*s+bite*27*s,2*s+bite*6*s,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

function drawJohnny(sample,position) {
  const {scale:s,characterHeight:height}=layout;
  ellipse(ctx,position.x+2*s,position.y+1*s,25*s,5*s,'#63542e35');
  if(sample.action==='fish'&&assets.fish) {
    drawFishingLine(sample,position);
    const breathing=Math.sin(sceneTime*1.6)*.35*s;
    drawAsset('fish',fishingFrame(sample.phase),position.x,position.y+breathing,height);
  } else {
    const index=sample.action==='walk'&&sample.stride>.12?Math.floor(positiveMod(sample.phase,1)*16):0;
    drawAsset('walk',index,position.x,position.y,height,sample.facing);
  }
}

function render(t) {
  if(!ready)return;
  const begin=performance.now();
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(background,0,0);
  ctx.setTransform(canvas.width/layout.width,0,0,canvas.height/layout.height,0,0);
  drawClouds(t);drawWater(t);drawLand();
  const sample=samplePilot(t),position=characterPosition(sample);
  if(position.behind){drawJohnny(sample,position);drawPalm(t);}
  else{drawPalm(t);drawJohnny(sample,position);}
  frameCount++;
  drawTimes.push(performance.now()-begin);if(drawTimes.length>300)drawTimes.shift();
}

function loop(time) {
  requestId=null;
  if(document.hidden||!ready)return;
  if(lastTime!==null) {
    const raw=(time-lastTime)/1000;
    frameTimes.push(raw*1000);if(frameTimes.length>300)frameTimes.shift();
    const previous=sceneTime;sceneTime+=Math.min(raw,.1);
    for(const cue of cuesBetween(previous,sceneTime))audio?.play(cue.kind==='cast'?1:2);
  }
  lastTime=time;
  if(dpr!==(window.devicePixelRatio||1))resize();
  render(sceneTime);
  requestId=requestAnimationFrame(loop);
}

function resume() {
  lastTime=null;
  if(requestId!==null)cancelAnimationFrame(requestId);
  requestId=!document.hidden&&!still&&ready?requestAnimationFrame(loop):null;
}
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{audio?.stop();resume();});
addEventListener('pagehide',()=>{audio?.stop();if(requestId!==null)cancelAnimationFrame(requestId);});
addEventListener('pageshow',resume);
canvas.addEventListener('pointerdown',()=>audio?.unlock().catch(console.error));
canvas.addEventListener('keydown',()=>audio?.unlock().catch(console.error));

resize();
try {
  const response=await fetch(new URL('manifest.json',base));
  if(!response.ok)throw new Error('Não foi possível carregar a arte do piloto.');
  const manifest=await response.json();assets=manifest.assets;
  await Promise.all(Object.values(assets).map(async asset=>{
    const image=new Image();image.src=new URL(asset.file,base).href;await image.decode();asset.image=image;
  }));
  // The original effects are locally served; playback still requires a gesture.
  audio=new OriginalAudio({1:'4.wav',2:'14.wav'});
  ready=true;canvas.dataset.ready='true';render(sceneTime);resume();
  const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)]:0;
  Object.defineProperty(window,'castawayPilot',{value:Object.freeze({
    get status(){return {
      time:sceneTime,duration:DURATION,frameCount,
      fps:frameTimes.length?1000/(frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length):0,
      p95FrameMs:percentile(frameTimes,.95),p95DrawMs:percentile(drawTimes,.95),
      viewport:{...layout},motion:samplePilot(sceneTime),
      position:characterPosition(samplePilot(sceneTime)),
      frames:{walk:assets.walk.frames.length,fish:assets.fish?.frames.length||0},
      audio:audio.context?.state||'locked',
    };}
  })});
}catch(error) {
  console.error(error);canvas.dataset.error=String(error);
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#124e62';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#fff5df';ctx.font=`${18*(devicePixelRatio||1)}px sans-serif`;
  ctx.fillText('Não foi possível carregar a cena piloto.',24,50);
}
