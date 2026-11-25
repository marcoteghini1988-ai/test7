import React,{useEffect,useRef} from 'react';
import {Scene} from 'three';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {metalProjectileFlightFrame,metalTrailPoint} from './metalWeaponProjectile3D.js';
import {precisionWeaponVariant} from './precisionWeaponBattleVisuals.js';
import {createPrecisionProjectile,articulatePrecisionProjectile} from './precisionWeaponProjectile3D.js';
import {createEffectCanvas,boardHullPoint} from './chainWeaponCanvas.js';
import {weaponFlightFrame,applyWeaponFlightPose} from './weaponKinematics.js';

const clamp=n=>Math.max(0,Math.min(1,n));
function worldRing(ctx,pose,camera,z,r,angle,color,width=1){
 ctx.beginPath();
 for(let i=0;i<=32;i++){
  const a=i/32*Math.PI*2+angle,p=worldPointToBoard(metalTrailPoint(pose,z,
   Math.cos(a)*r,Math.sin(a)*r),camera);
  i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
 }
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function charge(ctx,entry,elapsed,camera,reduced){
 const {shot,profile,from,to}=entry,p=clamp(1+elapsed/profile.chargeMs);
 const origin=from;
 const pose=metalProjectileFlightFrame(origin,to,0,camera,0);
 ctx.save();ctx.globalAlpha=.25+p*.7;
 if(profile.kind==='cascade-piercer'){
  for(let i=0;i<3;i++){
   const z=-i*.34;
   worldRing(ctx,pose,camera,z,.43-p*.10,elapsed*.004+i*.7,profile.secondary,1.5);
   // Tre guide aperte in 3D e pattini rotanti dell’apparecchio.
   for(let j=0;j<3;j++){
    const a=j*Math.PI*2/3+(reduced?0:elapsed*.006)+i*.45;
    const point=worldPointToBoard(metalTrailPoint(pose,z,Math.cos(a)*.36,Math.sin(a)*.36),camera);
    ctx.fillStyle=profile.glow;ctx.fillRect(point.x-1.8,point.y-1.8,3.6,3.6);
   }
  }
  if(profile.tier===3)for(const s of [-1,1]){
   ctx.beginPath();
   for(let i=0;i<3;i++){
    const q=worldPointToBoard(metalTrailPoint(pose,-i*.34,s*.46,.22),camera);
    i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);
   }
   ctx.strokeStyle=s===1?'#b4efff':'#e0bcff';ctx.lineWidth=1.8;ctx.stroke();
  }
 }else{
  ctx.translate(origin.x,origin.y);
  // Una sola slitta si orienta; le cinque cassette sono il caricatore.
  const aim=Math.atan2(to.y-from.y,to.x-from.x)+Math.PI/2;
  ctx.rotate(aim*p);
  for(let i=0;i<5;i++){
   const a=(i-2)*.30,x=Math.sin(a)*27,y=-Math.cos(a)*22;
   ctx.save();ctx.translate(x,y);ctx.rotate(a);
   ctx.fillStyle=profile.tier>=2?'#a8bdcb':'#a2774f';ctx.fillRect(-3.7,-9,7.4,14);
   ctx.fillStyle=profile.glow;ctx.fillRect(-1.8,-6,3.6,5);ctx.restore();
  }
  const selected=((shot.stage||1)-1)%5,position=(selected-2)*.30*(1-p);
  ctx.rotate(position);
  ctx.strokeStyle=profile.secondary;ctx.lineWidth=2;ctx.beginPath();
  ctx.arc(0,0,30,Math.PI*1.15,Math.PI*1.85);ctx.stroke();
  ctx.fillStyle='#25333c';ctx.fillRect(-6,-22+5*(1-p),12,20);
  ctx.strokeStyle=profile.tier>=2?'#d8e7ee':'#d5a274';ctx.strokeRect(-6,-22+5*(1-p),12,20);
  if(profile.tier===3){ctx.strokeStyle='#d5c6ff';ctx.beginPath();ctx.arc(0,0,37,Math.PI*1.15,Math.PI*1.85);ctx.stroke();}
 }
 ctx.restore();
}
function trail(ctx,entry,pose,camera,age,t){
 const {profile,shot}=entry,cascade=profile.kind==='cascade-piercer',tier=profile.tier;
 ctx.save();ctx.globalAlpha=Math.min(1,t*20,(1-t)*20);
 // Il trasferimento è il residuo dell’ogiva: la scia si assottiglia.
 const residue=shot.cascadeTransfer?Math.max(.4,.82-shot.cascadeIndex*.16):1;
 const length=(cascade?1.55:1.0)*residue;
 for(let stream=0;stream<(cascade?2:tier===1?1:2);stream++){
  ctx.beginPath();
  for(let i=0;i<=26;i++){
   const u=i/26,phase=u*Math.PI*4-age*.014+stream*Math.PI;
   const radius=cascade?.045+u*.045:tier>=2?.035:.008;
   const p=worldPointToBoard(metalTrailPoint(pose,entry.model.userData.rearZ+u*length,
    Math.sin(phase)*radius,Math.cos(phase)*radius),camera);
   i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);
  }
  ctx.strokeStyle=stream?profile.secondary:profile.glow;ctx.lineWidth=stream?1:2;
  ctx.shadowColor=profile.glow;ctx.shadowBlur=4;ctx.stroke();
 }
 ctx.shadowBlur=0;
 if(tier===3)for(let i=0;i<5;i++){
  const d=.5+((age*.001+i*.19)%1)*length;
  const p=worldPointToBoard(metalTrailPoint(pose,d,Math.sin(age*.01+i)*.10,Math.cos(age*.01+i)*.10),camera);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(age*.004+i);ctx.fillStyle=i%2?'#debfff':'#c3f6ff';
  ctx.beginPath();ctx.moveTo(-2,0);ctx.lineTo(0,-1);ctx.lineTo(3,0);ctx.lineTo(0,1);ctx.closePath();ctx.fill();ctx.restore();
 }
 ctx.restore();
}
function contact(ctx,entry,age,reduced){
 const {profile,to,from}=entry;if(age<0||age>profile.impactMs)return;
 const cascade=profile.kind==='cascade-piercer',t=age/profile.impactMs,fade=1-t;
 ctx.save();ctx.translate(to.x,to.y);ctx.rotate(Math.atan2(to.y-from.y,to.x-from.x)+Math.PI/2);
 ctx.globalAlpha=fade*(reduced?.45:1);
 const glow=ctx.createRadialGradient(0,0,0,0,0,cascade?33:38);
 glow.addColorStop(0,profile.core);glow.addColorStop(.2,profile.glow+'b0');glow.addColorStop(1,profile.glow+'00');
 ctx.fillStyle=glow;ctx.fillRect(-40,-42,80,84);
 if(cascade){
  // Incisione e schegge nell’asse del penetratore.
  ctx.fillStyle='#0d1720';ctx.beginPath();ctx.ellipse(0,0,4+3*t,11+4*t,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=profile.core;ctx.lineWidth=1.7;
  ctx.beginPath();ctx.moveTo(-6,10);ctx.lineTo(-3,-9);ctx.lineTo(4,-17);ctx.stroke();
  for(let i=0;i<12;i++){
   const spread=(i%2?-1:1)*(5+(i%4)*4),distance=10+t*(35+i*2);
   ctx.beginPath();ctx.moveTo(spread*t,-distance);ctx.lineTo(spread*(t+.2),-distance-7*fade);
   ctx.strokeStyle=i%3?profile.secondary:profile.glow;ctx.lineWidth=i%3?1:1.8;ctx.stroke();
  }
 }else{
  // Frammenti superficiali decorativi: un solo impatto HP della scheggia.
  for(let i=0;i<8+profile.tier*2;i++){
   const a=i*2.399,r=8+t*(22+i%4*5),x=Math.cos(a)*r,y=Math.sin(a)*r*.65;
   ctx.save();ctx.translate(x,y);ctx.rotate(a+t*3);
   ctx.fillStyle=i%3?profile.secondary:profile.glow;ctx.fillRect(-2,-1.1,4+2*fade,2.2);ctx.restore();
  }
  if(profile.tier>=2){ctx.strokeStyle=profile.secondary;ctx.lineWidth=1.2;
   ctx.beginPath();ctx.ellipse(0,0,12+t*23,6+t*13,0,0,Math.PI*2);ctx.stroke();}
 }
 if(profile.tier===3)for(let i=0;i<4;i++){
  const a=i*Math.PI/2+.4,r=9+t*31;
  ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r*.65);ctx.rotate(a);
  ctx.strokeStyle=i%2?'#e4c5ff':'#b8efff';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3,0);ctx.lineTo(0,5);ctx.lineTo(-3,0);ctx.closePath();ctx.stroke();ctx.restore();
 }
 ctx.restore();
}
function energyTransfer(ctx,entry,elapsed){
 if(!entry.shot.cascadeTransfer||!entry.shot.transferEnergySpent||elapsed<0||elapsed>420||!entry.energyPoint)return;
 const t=elapsed/420,p=entry.energyPoint,q=entry.from;
 ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle=entry.profile.secondary;ctx.lineWidth=1.8;
 ctx.beginPath();ctx.ellipse(p.x,p.y,17+t*10,22+t*10,0,0,Math.PI*2);ctx.stroke();
 const x=p.x+(q.x-p.x)*t,y=p.y+(q.y-p.y)*t-Math.sin(t*Math.PI)*22;
 ctx.fillStyle=entry.profile.core;ctx.shadowColor=entry.profile.glow;ctx.shadowBlur=7;
 ctx.beginPath();ctx.arc(x,y,2.3,0,Math.PI*2);ctx.fill();ctx.restore();
}

export default function PrecisionWeaponEffects({paths=[],startedAt,cinematic=false}){
 const host=useRef(null);
 useEffect(()=>{
  const element=host.current,root=element?.closest('.f3d-approved-layout');if(!root)return;
  const special=paths.filter(p=>precisionWeaponVariant(p.shot.cardId));if(!special.length)return;
  const {canvas,ctx}=createEffectCanvas(element),meshCanvas=document.createElement('canvas');element.append(meshCanvas);
  const renderer=new MaglioSoftwareRenderer(meshCanvas,{contactShadow:false});renderer.setPixelRatio(1.5);renderer.setSize(450,800);
  const camera=createProjectileCamera(),scene=new Scene(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const board=root.getBoundingClientRect();
  const entries=special.map(path=>{
   const energy=root.querySelector(`[data-fleet-card-slot="${path.shot.who}-5"]`);
   return {...path,model:createPrecisionProjectile(path.profile.kind,path.profile.tier),
    energyPoint:energy?boardHullPoint(energy,board):null};
  });
  for(const entry of entries)entry.model.scale.setScalar(entry.shot.visualScale||1);
  element.dataset.renderer='volume-depth-buffer';element.dataset.camera='table-fixed';
  let raf=0,previous=-Infinity;
  const draw=now=>{
   if(now-previous<1000/30){raf=requestAnimationFrame(draw);return;}previous=now;
   const age=now-startedAt;ctx.clearRect(0,0,450,800);scene.clear();let pending=false;
   for(const entry of entries){
    const {shot,profile,from,to,start,model}=entry,elapsed=age-start,t=elapsed/profile.flightMs;
    if(elapsed<0){pending=true;if(!shot.cascadeTransfer&&elapsed>=-profile.chargeMs)charge(ctx,entry,elapsed,camera,reduced);continue;}
    if(elapsed>profile.flightMs+profile.impactMs)continue;pending=true;
    element.dataset.sequence=profile.sequence;element.dataset.shooter=shot.who;
    element.dataset.targetId=shot.targetId;element.dataset.sourceTargetId=shot.sourceTargetId||'';
    element.dataset.cascadeIndex=String(shot.cascadeIndex||0);element.dataset.energySpent=String(shot.transferEnergySpent||0);
    element.dataset.phase=t<1?'flight':'impact';element.dataset.progress=clamp(t).toFixed(3);
    energyTransfer(ctx,entry,elapsed);
    if(t<1&&!reduced){
     const pose=cinematic?weaponFlightFrame(from,to,t,camera,model.userData.frontZ*model.scale.z,{shot,kind:profile.kind}):metalProjectileFlightFrame(from,to,t,camera,model.userData.frontZ);
     articulatePrecisionProjectile(model,elapsed);
     if(cinematic)applyWeaponFlightPose(model,pose);else{model.position.copy(pose.center);model.rotation.y=pose.yaw;}
     scene.add(model);
     element.dataset.visibleEnd=pose.visibleEnd;element.dataset.nose=JSON.stringify(worldPointToBoard(pose.nose,camera));
     if(!cinematic)trail(ctx,entry,pose,camera,age,t);
    }else if(t>=1&&!cinematic)contact(ctx,entry,elapsed-profile.flightMs,reduced);
   }
   renderer.render(scene,camera);if(pending)raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);entries.forEach(e=>disposeProjectile(e.model));renderer.dispose();canvas.remove();meshCanvas.remove();};
 },[paths,startedAt,cinematic]);
 return <div ref={host} className="maglio-projectiles-3d precision-weapon-effects"/>;
}
