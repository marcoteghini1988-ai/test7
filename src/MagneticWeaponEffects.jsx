import React,{useEffect,useRef} from 'react';
import {Scene} from 'three';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {metalProjectileFlightFrame} from './metalWeaponProjectile3D.js';
import {createChainWeaponModel,articulateChainWeapon} from './chainWeaponProjectile3D.js';
import {chainWeaponVariant,chainWeaponEffectProfile,collisionGroups,collisionMotionPlan,collisionFrame,activeGrappleLinks} from './chainWeaponBattleVisuals.js';
import {weaponPortalOrigin,weaponEffectProfile,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {combatTargetElement,boardHullPoint,createEffectCanvas,drawMagneticChain,drawLatch,drawMetalContact} from './chainWeaponCanvas.js';
import {drawCollisionExplosion} from './collisionExplosion.js';

const clamp=n=>Math.max(0,Math.min(1,n));
const aliveAfter=(sides,shot)=>{
 const side=sides?.[shot.who==='A'?'B':'A'];if(!side)return true;
 const unit=shot.targetKind==='part'?side.ships[0]:side.escorts.find(e=>e.id===shot.targetId);
 return unit&&unit.hp>0&&!unit.destroyed;
};
function drawInductionField(ctx,from,to,profile,age,energy){
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),nx=-dy/(length||1),ny=dx/(length||1);
 ctx.save();ctx.lineCap='round';
 for(let i=0;i<3;i++){
  ctx.beginPath();
  for(let n=0;n<=25;n++){
   const t=n/25,r=Math.sin(t*Math.PI)*(4+i*2)*Math.sin(t*Math.PI*5-age*.018+i*2.1);
   const x=from.x+dx*t+nx*r,y=from.y+dy*t+ny*r;
   n?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.strokeStyle=[profile.core,profile.glow,profile.secondary][i];ctx.lineWidth=i?1:2.2;
  ctx.globalAlpha=.75;ctx.stroke();
 }
 if(energy>=1){
  // Un varco nel campo di Difesa, mai un bypass della copertura dei supporti.
  ctx.translate(to.x,to.y);ctx.strokeStyle='#b9e5ff';ctx.lineWidth=1.5;
  for(const side of [-1,1]){
   ctx.beginPath();ctx.ellipse(side*9,0,19,13,0,side<0?Math.PI*.55:-Math.PI*.45,side<0?Math.PI*1.45:Math.PI*.45);ctx.stroke();
  }
 }
 ctx.restore();
}
function drawCollisionField(ctx,group,frame,elapsed,camera,reduced){
 const {profile,plan}=group,p=plan.contact,t=clamp(elapsed/profile.flightMs);
 if(elapsed<0||frame.phase==='restored')return;
 const impactAge=elapsed-profile.flightMs;
 ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=impactAge>=0?Math.max(0,1-impactAge/180):.45+t*.5;
 // Due poli curvi convergenti, coerenti con il giogo aperto della carta.
 const radius=54-t*23;
 for(const s of [-1,1]){
  ctx.beginPath();ctx.ellipse(s*(18-t*12),0,radius,25,0,s<0?Math.PI*.55:-Math.PI*.45,s<0?Math.PI*1.45:Math.PI*.45);
  ctx.strokeStyle=profile.secondary;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.ellipse(s*(18-t*12),0,radius-5,22,0,s<0?Math.PI*.55:-Math.PI*.45,s<0?Math.PI*1.45:Math.PI*.45);
  ctx.strokeStyle=profile.glow;ctx.lineWidth=.8;ctx.stroke();
 }
 if(profile.tier===3){
  // Le staffe prismatiche chiudono una gabbia segmentata; niente altri colpi.
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4+Math.sin(elapsed*.001)*.1,r=radius+12;
   ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r*.58);ctx.rotate(a);
   ctx.fillStyle=i%2?'#b4edff':'#d0bdff';
   ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(0,-2.7);ctx.lineTo(6,0);ctx.lineTo(0,2.7);ctx.closePath();ctx.fill();ctx.restore();
  }
 }
 ctx.restore();
 return drawCollisionExplosion(ctx,p,profile,impactAge,camera,{reduced});
}

export default function MagneticWeaponEffects({paths=[],events=[],startedAt,shotStart,resolvedSides}){
 const host=useRef(null);
 useEffect(()=>{
  const element=host.current,root=element?.closest('.f3d-approved-layout');if(!root)return;
  const special=paths.filter(p=>chainWeaponVariant(p.shot.cardId));
  const breaks=events.filter(e=>e.kind==='weapon-break-defense'&&chainWeaponVariant(e.cardId)?.kind==='induction');
  if(!special.length&&!breaks.length)return;
  const {canvas,ctx}=createEffectCanvas(element),meshCanvas=document.createElement('canvas');element.append(meshCanvas);
  const renderer=new MaglioSoftwareRenderer(meshCanvas,{contactShadow:false});renderer.setPixelRatio(1.5);renderer.setSize(450,800);
  const camera=createProjectileCamera(),scene=new Scene();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entries=special.filter(p=>p.profile.kind!=='alloy-collision'&&(p.shot.fires||p.shot.defenseBlocked)).map(path=>
   ({...path,model:createChainWeaponModel(path.profile.kind,path.profile.tier)}));
  const collisions=collisionGroups(special.map(p=>p.shot)).flatMap(shots=>{
   const pairs=shots.map(s=>special.find(p=>p.shot===s));
   const board=root.getBoundingClientRect();
   const targets=shots.map(s=>combatTargetElement(root,s));if(targets.some(t=>!t))return [];
   const centers=targets.map(el=>boardHullPoint(el,board));
   const dx=centers[1].x-centers[0].x,dy=centers[1].y-centers[0].y,length=Math.hypot(dx,dy)||1;
   return [{shots,profile:pairs[0].profile,start:pairs[0].start,targets,
    axis:{x:dx/length,y:dy/length},
    previous:targets.map(t=>t.style.translate),
    // Porta l'urto davanti alla formazione: due supporti non attraversano
    // la madre ferma che occupa il centro del loro schieramento.
    plan:collisionMotionPlan(...centers,{forward:shots[0].who==='A'?78:-72})}];
  });
  element.dataset.renderer='volume-depth-buffer';element.dataset.camera='table-fixed';
  let raf=0,previous=-Infinity;
  const restore=group=>group.targets.forEach((target,i)=>{
   target.style.translate=group.previous[i];delete target.dataset.collisionMotion;
  });
  const draw=now=>{
   const age=now-startedAt;
   if(now-previous<1000/30){raf=requestAnimationFrame(draw);return;}previous=now;
   ctx.clearRect(0,0,450,800);scene.clear();let pending=false;
   for(const entry of entries){
    const {from,to,start,profile,model,shot}=entry,elapsed=age-start,t=elapsed/profile.flightMs;
    if(t<0){
     pending=true;
     if(elapsed>=-profile.chargeMs){
      const p=clamp(1+elapsed/profile.chargeMs),origin={x:225,y:shot.who==='A'?778:22};
      ctx.save();ctx.translate(origin.x,origin.y);ctx.globalAlpha=p*.85;
      if(profile.kind==='induction'){
       for(let i=0;i<3;i++){
        const x=(i-1)*(18-p*9);ctx.fillStyle=i%2?profile.secondary:'#778b9c';
        ctx.fillRect(x-3,-14+(i-1)*(7-p*5),6,28);
        ctx.fillStyle=profile.glow;ctx.fillRect(x-2,-11+(i-1)*(7-p*5),4,3);
       }
      }else{
       for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*12,0,8,5,p*Math.PI*3,0,Math.PI*2);
        ctx.strokeStyle=profile.secondary;ctx.lineWidth=2;ctx.stroke();}
      }
      ctx.restore();
     }
     continue;
    }
    if(elapsed>profile.flightMs+profile.impactMs)continue;pending=true;
    const pose=metalProjectileFlightFrame(from,to,clamp(t),camera,model.userData.frontZ);
    const progress=profile.kind==='magnetic-grapple'?clamp((t-.82)/.18):clamp(t*1.9);
    articulateChainWeapon(model,progress);model.position.copy(pose.center);model.rotation.y=pose.yaw;
    const after=t>=1,alive=aliveAfter(resolvedSides,shot);
    element.dataset.shooter=shot.who;element.dataset.visibleEnd=pose.visibleEnd;
    element.dataset.sequence=profile.sequence;element.dataset.progress=clamp(t).toFixed(3);
    element.dataset.phase=after?'latched':'flight';element.dataset.nose=JSON.stringify(worldPointToBoard(pose.nose,camera));
    if(profile.kind==='magnetic-grapple'){
     const fade=after&&!alive?clamp(1-(elapsed-profile.flightMs)/450):1;
     drawMagneticChain(ctx,from,worldPointToBoard(pose.center,camera),profile,camera,age,after?.65:0,fade);
     if(!after||alive)scene.add(model);
     if(after){drawLatch(ctx,to,profile,1,fade);drawMetalContact(ctx,to,profile,elapsed-profile.flightMs,520);}
    }else{
     if(!after){
      scene.add(model);
      const tail={x:from.x+(to.x-from.x)*Math.max(0,t-.16),y:from.y+(to.y-from.y)*Math.max(0,t-.16)};
      drawInductionField(ctx,tail,worldPointToBoard(pose.nose,camera),profile,age,0);
     }else{
      if(!shot.defenseBlocked)drawMetalContact(ctx,to,profile,elapsed-profile.flightMs);
      ctx.globalAlpha=clamp(1-(elapsed-profile.flightMs)/profile.impactMs);
      if(shot.defenseBlocked){
       ctx.strokeStyle='#9cdbff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(to.x,to.y,24,17,0,0,Math.PI*2);ctx.stroke();
       element.dataset.phase='defense-block';
      }else drawInductionField(ctx,{x:to.x-5,y:to.y+(shot.who==='A'?30:-30)},to,profile,age,shot.energyCardsSeen||0);
      ctx.globalAlpha=1;
     }
    }
   }
   for(const group of collisions){
    const elapsed=age-group.start,frame=collisionFrame(elapsed,group.profile);
    if(frame.phase!=='restored')pending=true;
    element.dataset.collisionPhase=frame.phase;element.dataset.shooter=group.shots[0].who;
    element.dataset.sequence=group.profile.sequence;
    element.dataset.collisionTargets=JSON.stringify(group.shots.map(s=>({kind:s.targetKind,id:s.targetId,damage:s.actualDamage})));
    const impactAge=elapsed-group.profile.flightMs;
    const recoil=impactAge>=0?(group.profile.tier===3?20:16)*(1-Math.exp(-impactAge/24))*Math.exp(-impactAge/230):0;
    group.targets.forEach((target,i)=>{
     const offset=group.plan.offsets[i],shake=impactAge>=0&&impactAge<310?Math.sin(impactAge*.095)*4*Math.exp(-impactAge/100):0;
     const kick=i===0?-recoil:recoil;
     const x=reduced?0:offset.x*frame.pull+group.axis.x*kick+shake,
      y=reduced?0:offset.y*frame.pull+group.axis.y*kick-shake*.45;
     target.style.translate=`${x}px ${y}px`;target.dataset.collisionMotion=frame.phase;
    });
    element.dataset.collisionBurst=drawCollisionField(ctx,group,frame,elapsed,camera,reduced)||'none';
    if(frame.phase==='restored')restore(group);
   }
   for(const event of breaks){
    const elapsed=age-(shotStart-180);if(elapsed<0){pending=true;continue;}if(elapsed>1000)continue;pending=true;
    const target=root.querySelector(`[data-fleet-card-slot="${event.who==='A'?'B':'A'}-1"]`);
    if(!target)continue;
    const p=boardHullPoint(target,root.getBoundingClientRect()),t=elapsed/1000;
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=1-t;
    for(let i=0;i<7;i++){
     const a=i*Math.PI*2/7,r=9+t*35;
     ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r*.6);ctx.rotate(a+t*2);
     ctx.fillStyle=i%2?'#b9dcec':'#ffd399';ctx.fillRect(-3,-5,6,10);ctx.restore();
    }
    ctx.restore();element.dataset.defenseBroken=event.defenseCardId;
   }
   renderer.render(scene,camera);
   if(pending)raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);collisions.forEach(restore);
   entries.forEach(e=>disposeProjectile(e.model));renderer.dispose();canvas.remove();meshCanvas.remove();};
 },[paths,events,startedAt,shotStart,resolvedSides]);
 return <div ref={host} className="maglio-projectiles-3d magnetic-weapon-effects"/>;
}

// Rimane montato fra i turni: gli arpioni non svaniscono a fine animazione.
// Legge gli scafi veri a ogni fotogramma, seguendo hovering, urto e distruzioni.
export function MagneticGrappleTethers({battle,resolving,fx}){
 const host=useRef(null);
 useEffect(()=>{
  const element=host.current,root=element?.closest('.f3d-approved-layout');
  const links=activeGrappleLinks(battle);if(!root||!links.length)return;
  const {canvas,ctx}=createEffectCanvas(element),camera=createProjectileCamera();
  const shots=fx?.weaponShots||[],groups=collisionGroups(shots);
  const reveals=weaponVisualCards(shots,fx?.selectedCards||[]);
  const start=weaponShotStartMs(reveals.length);
  let raf=0,previous=-Infinity;
  const draw=now=>{
   if(now-previous<1000/30){raf=requestAnimationFrame(draw);return;}previous=now;
   const age=resolving?now-fx.startedAt:0,board=root.getBoundingClientRect();
   ctx.clearRect(0,0,450,800);let visible=0;
   for(const link of links){
    const collision=groups.find(g=>g[0].who===link.who&&g.some(s=>s.targetId===link.targetId));
    const cs=collision?.[0],cp=cs&&weaponEffectProfile(cs.cardId);
    const collisionElapsed=cs?age-start-(cs.delayMs||0):0;
    if(cs&&collisionElapsed>cp.flightMs+230)continue;
    // Elimina un aggancio alla distruzione effettivamente risolta del bersaglio.
    if(resolving&&!aliveAfter(fx.resolvedSides,link)){
     const hit=shots.find(s=>s.who===link.who&&s.targetId===link.targetId&&s.fires);
     if(hit&&age>=start+(hit.delayMs||0)+weaponEffectProfile(hit.cardId).flightMs)continue;
    }
    const target=combatTargetElement(root,link);if(!target)continue;
    const p=boardHullPoint(target,board),profile=chainWeaponEffectProfile(link.cardId);
    const tension=cs?collisionFrame(collisionElapsed,cp).pull:.55;
    drawMagneticChain(ctx,weaponPortalOrigin(link.who),p,profile,camera,now,tension,.82);
    drawLatch(ctx,p,profile);visible++;
   }
   element.dataset.activeLinks=String(visible);
   element.dataset.targetIds=JSON.stringify(links.map(l=>l.targetId));
   raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);canvas.remove();};
 },[battle,resolving,fx]);
 return <div ref={host} className="magnetic-persistent-tethers" aria-hidden="true"/>;
}
