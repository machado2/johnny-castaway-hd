import {layoutPilot, samplePilot, cuesBetween, positiveMod, clamp, DURATION} from './pilot-motion.js';
import {OriginalAudio} from './audio.js';
import {footAt,solveLeg,longestGroundRun} from './gait.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', {alpha:false});
const base = new URL('./assets/pilot/', import.meta.url);
const params = new URLSearchParams(location.search);
const still = params.has('t') && Number.isFinite(Number(params.get('t')));
const startAt = still ? Math.max(0, Number(params.get('t'))) : 0;
let sceneTime = startAt, lastTime = null, ready = false, layout, background;
let assets, audio, frameCount = 0, requestId = null, dpr = 0, terrain = null;
let lastFeet = [];
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
function makeBackground() {
  const {width:w,height:h,horizon,centerX,baseline,islandWidth} = layout;
  const bg=document.createElement('canvas');bg.width=canvas.width;bg.height=canvas.height;
  const c=bg.getContext('2d',{alpha:false});c.scale(canvas.width/w,canvas.height/h);
  if(assets?.ocean?.image) {
    const im=assets.ocean.image,sourceHorizon=im.height*.32;
    const scale=Math.max(w/im.width,horizon/sourceHorizon,(h-horizon)/(im.height-sourceHorizon));
    c.fillStyle='#30cedc';c.fillRect(0,0,w,h);
    c.drawImage(im,(w-im.width*scale)/2,horizon-sourceHorizon*scale,im.width*scale,im.height*scale);
    return bg;
  }
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

function drawWater(t) {
  const {width:w,height:h,horizon,scale:s,centerX:cx,baseline:cy,islandWidth:iw}=layout;
  if(assets?.ocean) {
    // The painted water is displaced very gently; no straight line pattern is
    // substituted for the original ocean's broad, irregular color patches.
    const dx=canvas.width/w,dy=canvas.height/h;
    const strip=12;
    ctx.save();ctx.beginPath();ctx.rect(0,horizon,w,h-horizon);ctx.clip();
    for(let y=Math.floor(horizon);y<h;y+=strip) {
      const hh=Math.min(strip+1,h-y);
      const depth=(y-horizon)/(h-horizon);
      const shift=Math.sin(t*.52+y*.014)*(.4+depth*1.2);
      ctx.drawImage(background,0,y*dy,canvas.width,hh*dy,shift,y,w,hh);
    }
    ctx.restore();
    // Small broken wavelets follow the actual shore, with varying lifetimes.
    // Their low contrast leaves the painted ocean as the main water texture.
    if(terrain)for(let n=0;n<13;n++) {
      const phase=positiveMod(t*.13+n*.381,1);
      const x=cx+iw*(-.43+n*.069),length=iw*(.025+.012*Math.sin(n*4));
      const offset=(3+phase*11)*s;
      ctx.beginPath();ctx.moveTo(x,groundAt(x,1)+offset);
      ctx.quadraticCurveTo(x+length*.5,groundAt(x+length*.5,1)+offset+2*s,
        x+length,groundAt(x+length,1)+offset);
      ctx.strokeStyle=`rgba(210,244,255,${Math.sin(phase*Math.PI)*.28})`;
      ctx.lineWidth=(1.1+(1-phase)*.6)*s;ctx.lineCap='round';ctx.stroke();
    }
    return;
  }
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
  ctx.drawImage(a.image,f.x,f.y,f.w,f.h,cx-iw/2,cy-height*.58,iw,height);
  // A quiet contact shadow links the palm to the newly painted sand.
  ctx.save();ctx.translate(layout.palmX,groundAt(layout.palmX,.78)+3*s);ctx.rotate(-.16);
  ellipse(ctx,-35*s,3*s,91*s,12*s,'#5f62212a');ctx.restore();
}

function drawPalm(t) {
  const {palmX,palmY,scale:s}=layout;
  drawAsset('palm',0,palmX,groundAt(palmX,.78),510*s,1,Math.sin(t*.65)*.008+Math.sin(t*.23)*.004);
}

function inspectGround() {
  const a=assets.island,f=a.frames[0];
  const c=document.createElement('canvas');c.width=f.w;c.height=f.h;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(a.image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
  const alpha=g.getImageData(0,0,f.w,f.h).data;
  terrain={width:f.w,height:f.h,alpha,bands:Array.from({length:f.w},(_,x)=>longestGroundRun(alpha,f.w,f.h,x))};
}

function groundAt(x,depth=.62) {
  if(!terrain)return layout.baseline;
  const k=layout.islandWidth/terrain.width;
  const column=clamp(Math.round((x-(layout.centerX-layout.islandWidth/2))/k),0,terrain.width-1);
  const band=terrain.bands[column];
  if(!band)throw new Error('Caminhada fora da área de areia.');
  return layout.baseline-terrain.height*k*.58+(band[0]+(band[1]-band[0])*depth)*k;
}

function characterPosition(sample) {
  const {centerX:cx,islandWidth:iw,baseline:cy,scale:s}=layout;
  const x=cx+sample.x*iw,y=groundAt(x);
  return {x,y,behind:true};
}

function rigFoot(x,y,pitch,facing) {
  const asset=assets.rig,f=asset.frames[5],s=layout.scale;
  const width=32*s,k=width/f.w,cut=f.h*.36;
  ctx.save();ctx.translate(x,y-6*s);ctx.scale(facing,1);ctx.rotate(pitch);
  ctx.drawImage(asset.image,f.x,f.y+cut,f.w,f.h-cut,-width*.25,-(f.h-cut)*k+6*s,width,(f.h-cut)*k);
  ctx.restore();
}

function skinChain(a,b,c,radii,back=false) {
  const s=layout.scale;
  const unit=(p,q)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);return {x:(q.y-p.y)/d,y:-(q.x-p.x)/d};};
  const n1=unit(a,b),n2=unit(b,c),nl=Math.hypot(n1.x+n2.x,n1.y+n2.y)||1;
  const n={x:(n1.x+n2.x)/nl,y:(n1.y+n2.y)/nl};
  const [r0,r1,r2]=radii.map(r=>r*s);
  ctx.beginPath();ctx.moveTo(a.x+n1.x*r0,a.y+n1.y*r0);
  ctx.quadraticCurveTo((a.x+b.x)*.5+n1.x*r0,(a.y+b.y)*.5+n1.y*r0,b.x+n1.x*r1,b.y+n1.y*r1);
  ctx.quadraticCurveTo(b.x+n.x*r1,b.y+n.y*r1,b.x+n2.x*r1,b.y+n2.y*r1);
  ctx.quadraticCurveTo((b.x+c.x)*.5+n2.x*r1,(b.y+c.y)*.5+n2.y*r1,c.x+n2.x*r2,c.y+n2.y*r2);
  ctx.quadraticCurveTo(c.x,c.y+2*s,c.x-n2.x*r2,c.y-n2.y*r2);
  ctx.quadraticCurveTo((b.x+c.x)*.5-n2.x*r1,(b.y+c.y)*.5-n2.y*r1,b.x-n2.x*r1,b.y-n2.y*r1);
  ctx.quadraticCurveTo(b.x-n.x*r1,b.y-n.y*r1,b.x-n1.x*r1,b.y-n1.y*r1);
  ctx.quadraticCurveTo((a.x+b.x)*.5-n1.x*r0,(a.y+b.y)*.5-n1.y*r0,a.x-n1.x*r0,a.y-n1.y*r0);
  ctx.quadraticCurveTo(a.x,a.y-r0*.6,a.x+n1.x*r0,a.y+n1.y*r0);ctx.closePath();
  ctx.fillStyle=gradient(ctx,a.x-r0,a.y,a.x+r0,a.y,back?[[0,'#a36337'],[.6,'#d59057'],[1,'#df9b60']]:[[0,'#d88b52'],[.55,'#f6b77d'],[1,'#b97845']]);
  ctx.fill();
  ctx.save();ctx.clip();ctx.globalAlpha=.22;
  const texture=assets.rig.frames[1];
  const left=Math.min(a.x,b.x,c.x)-r0,top=Math.min(a.y,b.y,c.y)-r0;
  ctx.drawImage(assets.rig.image,texture.x+texture.w*.32,texture.y+texture.h*.30,texture.w*.32,texture.h*.33,
    left,top,Math.max(a.x,b.x,c.x)-left+r0,Math.max(a.y,b.y,c.y)-top+r0);
  ctx.restore();
  ctx.strokeStyle='#4c2b1c';ctx.lineWidth=1.3*s;ctx.lineJoin='round';ctx.stroke();
}

function drawRig(sample,position) {
  const s=layout.scale,dir=sample.facing;
  const total=sample.t<6?.34:sample.t<28?.46:.12;
  const cycles=sample.t<6?3:sample.t<28?4:1;
  const stride=total*940/cycles;
  const distance=sample.travel*940;
  const hip={x:position.x,y:position.y-97*s};
  const phase=(distance/stride+.05)*Math.PI*2;
  lastFeet=[];
  const legs=[0,1].map(i=>{
    let foot=footAt(distance+stride*.05,i,stride);
    if(sample.action==='fish') {
      const elapsed=sample.phase*12;
      const closing=clamp((elapsed-i*.3)/.3,0,1);
      const opening=clamp((elapsed-11.4-i*.3)/.3,0,1);
      const ease=p=>p*p*(3-2*p);
      const wide=(i===0?1:-1)*stride*.25;
      const narrow=(i===0?1:-1)*6;
      const forward=wide+(narrow-wide)*ease(closing)+(wide-narrow)*ease(opening);
      const lift=(Math.sin(closing*Math.PI)+Math.sin(opening*Math.PI))*8;
      foot={...foot,forward,lift,pitch:0,support:lift<.05};
    }
    const x=position.x+dir*foot.forward*s;
    const floor=groundAt(x);
    const ankle={x,y:floor-(foot.lift+6)*s};
    return {foot,ankle,floor};
  });
  // Let the pelvis rise over the supporting leg; do not crouch by bending both
  // knees while the feet pass under the body. Segment lengths stay constant.
  const limits=legs.filter(l=>l.foot.support).map(l=>l.ankle.y-Math.sqrt(Math.max(1,(96.5*s)**2-(l.ankle.x-hip.x)**2)));
  if(limits.length)hip.y=Math.max(...limits);
  for(const leg of legs)leg.knee=solveLeg(hip,leg.ankle,50*s,48*s,dir);
  const shoulder={x:position.x+dir*3*s,y:hip.y-51*s};
  const fishing=sample.action==='fish';
  const elapsed=fishing?sample.phase*12:0;
  const actionBlend=fishing?Math.min(clamp(elapsed/.6,0,1),clamp((12-elapsed)/.6,0,1)):0;
  const castLift=fishing?Math.exp(-(((elapsed-.75)/.32)**2))*.75:0;
  const biteLift=fishing?Math.exp(-(((elapsed-7.6)/.45)**2))*.35:0;
  const rodAngle=.20+castLift+biteLift+Math.sin(sceneTime*1.4)*.014;
  const handle={x:position.x+dir*24*s,y:hip.y-26*s};
  const tip={x:handle.x+dir*Math.cos(rodAngle)*128*s,y:handle.y-Math.sin(rodAngle)*128*s};
  if(fishing)drawFishingLine(sample,position,tip);
  function arm(back) {
    const swing=Math.cos(phase)*(back?-.38:.38);
    const elbow={x:shoulder.x+dir*Math.sin(swing)*30*s,y:shoulder.y+Math.cos(swing)*30*s};
    let wrist={x:elbow.x+dir*Math.sin(swing+.2)*28*s,y:elbow.y+Math.cos(swing+.2)*28*s};
    let joint=elbow;
    if(fishing) {
      const target={x:handle.x+(back?dir*6*s:0),y:handle.y+(back?-2*s:2*s)};
      wrist={x:wrist.x+(target.x-wrist.x)*actionBlend,y:wrist.y+(target.y-wrist.y)*actionBlend};
      joint=solveLeg(shoulder,wrist,30*s,28*s,-dir);
    }
    skinChain(shoulder,joint,wrist,[5,4,3],back);
    const hand=assets.rig.frames[2],handH=15*s,handW=hand.w*.78/(hand.h*.27)*handH;
    ctx.save();ctx.translate(wrist.x,wrist.y);ctx.scale(dir,1);
    ctx.rotate(swing*.6);ctx.drawImage(assets.rig.image,hand.x+hand.w*.22,hand.y+hand.h*.73,hand.w*.78,hand.h*.27,
      -handW*.38,-2*s,handW,handH);ctx.restore();
  }
  arm(true);
  for(const i of [0,1]) {
    const {foot,ankle,knee,floor}=legs[i];
    skinChain(hip,knee,ankle,[7,5,3.5],i===0);
    rigFoot(ankle.x,floor-foot.lift*s,foot.pitch,dir);
    lastFeet.push({x:ankle.x,y:floor-foot.lift*s,support:foot.support,floor});
  }
  // The same torso is reused at every instant. Limbs are articulated, not
  // unrelated whole-body generated frames played in arbitrary sequence.
  drawAsset('rig',0,position.x,hip.y+17*s,136*s,dir);
  arm(false);
  if(fishing&&actionBlend>0) {
    ctx.save();ctx.globalAlpha=actionBlend;ctx.lineCap='round';
    const root={x:handle.x-dir*12*s,y:handle.y+3*s};
    const control={x:(handle.x+tip.x)*.5,y:(handle.y+tip.y)*.5-3*s};
    ctx.beginPath();ctx.moveTo(root.x,root.y);ctx.quadraticCurveTo(control.x,control.y,tip.x,tip.y);
    ctx.strokeStyle='#492c17';ctx.lineWidth=4*s;ctx.stroke();ctx.strokeStyle='#d7a45a';ctx.lineWidth=2*s;ctx.stroke();
    ctx.restore();
  }
}

function drawFishingLine(sample,position,tipPoint) {
  const {scale:s,islandWidth:iw,centerX:cx,baseline:cy}=layout;
  const elapsed=sample.phase*12;
  const fade=clamp((elapsed-1.05)/.3,0,1)*clamp((12-elapsed)/.4,0,1);
  if(!fade)return;
  // End point is a world coordinate, not a sprite coordinate, so line and bobber
  // stay connected through screen resizes. The tip shares the rod's geometry.
  const tx=tipPoint.x,ty=tipPoint.y;
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
  const s=layout.scale;
  ellipse(ctx,position.x+2*s,position.y+s,25*s,5*s,"#63542e35");
  drawRig(sample,position);
}

function render(t) {
  if(!ready)return;
  const begin=performance.now();
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(background,0,0);
  ctx.setTransform(canvas.width/layout.width,0,0,canvas.height/layout.height,0,0);
  drawWater(t);drawLand();
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
  inspectGround();background=makeBackground();
  ready=true;canvas.dataset.ready='true';render(sceneTime);resume();
  const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)]:0;
  Object.defineProperty(window,'castawayPilot',{value:Object.freeze({
    get status(){return {
      time:sceneTime,duration:DURATION,frameCount,
      fps:frameTimes.length?1000/(frameTimes.reduce((a,b)=>a+b,0)/frameTimes.length):0,
      p95FrameMs:percentile(frameTimes,.95),p95DrawMs:percentile(drawTimes,.95),
      viewport:{...layout},motion:samplePilot(sceneTime),
      position:characterPosition(samplePilot(sceneTime)),
      animation:'distance-driven articulated gait',
      feet:lastFeet.map(f=>({...f})),
      audio:audio.context?.state||'locked',
    };}
  })});
}catch(error) {
  console.error(error);canvas.dataset.error=String(error);
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#124e62';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#fff5df';ctx.font=`${18*(devicePixelRatio||1)}px sans-serif`;
  ctx.fillText('Não foi possível carregar a cena piloto.',24,50);
}
