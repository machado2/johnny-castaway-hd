import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {FLOOR,POSES,poseAt,legPoint} from '../web/dist/walk-continuous.js';
const {study,foot}=JSON.parse(fs.readFileSync(new URL('../art/walk-contact-reference.json',import.meta.url)));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const footPoint=(p,f,g)=>{const c=Math.cos(f.pitch),s=Math.sin(f.pitch),x=p[0]-g.ankle[0],y=p[1]-g.ankle[1];return [f.ankle[0]+c*x-s*y,f.ankle[1]+s*x+c*y];};

test('the approved source references and measured contact fixture match the recorded asset hashes',()=>{
  const root=new URL('../',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('web/dist/assets/fidelity/walk-study.json',root)));
  for(const [file,expected] of Object.entries(manifest.sha256)){
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex'),expected,file);
  }
});

test('each planted foot has an invariant world transform while the torso moves forward',()=>{
  for(const leg of ['near','far'])for(let cycle=-1;cycle<=3;cycle++){
    const land=(leg==='near'?study.times[5]:study.times[1])+cycle*study.period;
    const release=(leg==='near'?study.times[1]+study.period:study.times[5])+cycle*study.period;
    const first=poseAt(study,land+1e-7,foot),last=poseAt(study,release-1e-7,foot);
    assert(last.hip[0]>first.hip[0]+20);
    for(let j=0;j<100;j++){
      const p=poseAt(study,land+(release-land)*(j+.5)/100,foot),f=p.feet[leg];
      assert(f.stance);assert(distance(f.ankle,first.feet[leg].ankle)<1e-9);assert.equal(f.pitch,first.feet[leg].pitch);
      for(const point of foot[leg].support)assert(distance(footPoint(point,f,foot[leg]),footPoint(point,first.feet[leg],foot[leg]))<1e-9);
    }
  }
});

test('the measured painted sole stays on the floor in support and clears it during swing',()=>{
  for(let i=0;i<2000;i++){
    const pose=poseAt(study,i/600,foot);
    assert(pose.feet.near.stance||pose.feet.far.stance,'unsupported flying stride');
    for(const leg of ['near','far']){
      const f=pose.feet[leg],bottom=Math.max(...foot[leg].support.map(p=>footPoint(p,f,foot[leg])[1]));
      assert(Math.abs(bottom-(FLOOR-f.lift))<1e-9);
      assert(bottom<=FLOOR+1e-9);
    }
  }
});

test('every original key, old midpoint switch, and support boundary is position continuous',()=>{
  const times=[...study.times,...study.times.map((t,i)=>(t+(study.times[i+1]??study.period))/2),study.period];
  const eps=1e-7;
  for(let cycle=0;cycle<3;cycle++)for(const t of times){
    const a=poseAt(study,t+cycle*study.period-eps,foot),b=poseAt(study,t+cycle*study.period+eps,foot);
    for(const part of ['head','hip'])assert(distance(a[part],b[part])<.001,part);
    for(const part of ['near','far'])for(let j=0;j<3;j++)assert(distance(a.legs[part][j],b.legs[part][j])<.001,`${part} ${j}`);
    for(let j=0;j<3;j++)assert(distance(a.arm[j],b.arm[j])<.001,'arm');
  }
});

test('body progression never goes backwards and physical legs retain their own contacts across the crossing',()=>{
  let previous=poseAt(study,0,foot);
  for(let i=1;i<=2000;i++){
    const t=i*study.period/1000,p=poseAt(study,t,foot);
    assert(p.head[0]>previous.head[0]);assert(p.hip[0]>previous.hip[0]);
    for(const leg of ['near','far']){
      assert.equal(p.feet[leg].leg,leg);
      const other=poseAt(study,t+study.period,foot).feet[leg];
      assert(Math.abs(other.toeX-p.feet[leg].toeX-study.travel)<1e-8);
      const [h,k,a]=p.legs[leg],dx=a[0]-h[0],dy=a[1]-h[1];
      assert((k[0]-h[0])*dy-(k[1]-h[1])*dx>0,'backwards knee');
    }
    previous=p;
  }
});

test('the renderer moves every foot vertex as one rigid painted surface independent of knee bending',()=>{
  for(const leg of ['near','far']){
    const land=leg==='near'?study.times[5]:study.times[1],end=leg==='near'?study.period:study.times[5];
    const a=poseAt(study,land+.02,foot),b=poseAt(study,end-.02,foot),rest=POSES[1][leg];
    for(const p of foot[leg].support){
      assert(distance(legPoint(p,rest,a.legs[leg],a.feet[leg]),footPoint(p,a.feet[leg],foot[leg]))<1e-8);
      assert(distance(legPoint(p,rest,a.legs[leg],a.feet[leg]),legPoint(p,rest,b.legs[leg],b.feet[leg]))<1e-8);
    }
  }
});
