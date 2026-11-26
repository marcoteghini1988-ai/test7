import React,{useEffect,useRef} from 'react';
import {Scene,Vector3} from 'three';
import {MaglioPerspectiveRenderer} from './maglioPerspectiveRenderer.js';
import {weaponFlightFrame,applyWeaponFlightPose} from './weaponKinematics.js';
import {createProjectileCamera,createMaglioProjectile,disposeProjectile,
 projectileFlightFrame,worldPointToBoard,MAGLIO_PROJECTILE_SCALE,MAGLIO_NOSE_Z} from './maglioProjectile3D.js';

export default function MaglioProjectileScene({paths,startedAt,cinematic=false}){
 const host=useRef(null);
 useEffect(()=>{
  const element=host.current;if(!element||!paths.length)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches)return;
  const canvas=document.createElement('canvas'),trail=document.createElement('canvas');
  trail.width=900;trail.height=1600;
  const ctx=trail.getContext('2d');ctx.scale(2,2);
  // Orbital salvos leave the narrow azimuth coverage of the old 24 views.
  // Render their actual geometry rather than stretching a clamped sprite.
  const renderer=new MaglioPerspectiveRenderer(canvas,{forceMesh:paths.some(p=>(p.shot.salvoCount||1)>1)});
  renderer.setPixelRatio(2);renderer.setSize(450,800);
  element.dataset.renderer='perspective-3d-views';
  element.append(trail,canvas);
  const scene=new Scene(),camera=createProjectileCamera();
  const entries=paths.map(path=>{
   const model=createMaglioProjectile(path.profile.tier);model.scale.setScalar(MAGLIO_PROJECTILE_SCALE*(path.shot.visualScale||1));
   return {...path,model};
  });
  element.dataset.physicalScale=String(MAGLIO_PROJECTILE_SCALE);
  let raf=0;
  const draw=now=>{
   const age=now-startedAt;ctx.clearRect(0,0,450,800);
   scene.children.filter(o=>o.isGroup).forEach(o=>scene.remove(o));
   let next=Infinity,active=0;
   for(const entry of entries){
    const {from,to,start,profile,model,shot}=entry;
    const progress=(age-start)/profile.flightMs;
    if(progress<0){next=Math.min(next,start);continue;}
    if(progress>=1)continue;
    const pose=cinematic?weaponFlightFrame(from,to,progress,camera,MAGLIO_NOSE_Z*model.scale.z,{shot,kind:profile.kind}):projectileFlightFrame(from,to,progress,camera);
    if(cinematic){applyWeaponFlightPose(model,pose);model.rotation.x+=progress*Math.PI*4;}else{model.position.copy(pose.center);model.rotation.y=pose.yaw;}
    scene.add(model);active++;
    element.dataset.visibleEnd=pose.visibleEnd;element.dataset.shooter=shot.who;
    element.dataset.progress=progress.toFixed(3);
    element.dataset.nose=JSON.stringify(worldPointToBoard(pose.nose,camera));
    // La scia nasce dall'ugello posteriore nello stesso spazio 3D del corpo.
    const rear=pose.center.clone().addScaledVector(pose.direction,-.96*MAGLIO_PROJECTILE_SCALE);
    const head=worldPointToBoard(rear,camera);
    const tail=worldPointToBoard(rear.clone().addScaledVector(pose.direction,-1.7*MAGLIO_PROJECTILE_SCALE),camera);
    const radius=Math.hypot(head.x-tail.x,head.y-tail.y)*.30;
    const glow=ctx.createRadialGradient(head.x,head.y,0,head.x,head.y,radius);
    glow.addColorStop(0,profile.glow+'aa');glow.addColorStop(1,profile.glow+'00');
    ctx.fillStyle=glow;ctx.fillRect(head.x-radius,head.y-radius,radius*2,radius*2);
    ctx.globalAlpha=Math.min(1,progress*18,(1-progress)*22);
    for(let i=0;i<(cinematic?0:5+profile.tier*2);i++){
     const a=i*2.39996,offset=new Vector3(Math.sin(a)*.12,Math.cos(a)*.12,0).multiplyScalar(MAGLIO_PROJECTILE_SCALE);
     const s=worldPointToBoard(rear.clone().add(offset),camera);
     const e=worldPointToBoard(rear.clone().addScaledVector(pose.direction,-(1+i%4*.24)*MAGLIO_PROJECTILE_SCALE).add(offset.multiplyScalar(.35)),camera);
     const g=ctx.createLinearGradient(s.x,s.y,e.x,e.y);
     g.addColorStop(0,i%2?profile.core:profile.glow);g.addColorStop(1,profile.glow+'00');
     ctx.strokeStyle=g;ctx.lineWidth=(i===0?4:1.1)*Math.sqrt(MAGLIO_PROJECTILE_SCALE);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(e.x,e.y);ctx.stroke();
    }
    ctx.globalAlpha=1;
   }
   renderer.render(scene,camera);
   element.dataset.renderer=renderer.lastMethod;element.dataset.views=JSON.stringify(renderer.lastSamples);
   if(active||Number.isFinite(next))raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{
   cancelAnimationFrame(raf);entries.forEach(e=>disposeProjectile(e.model));renderer.dispose();
   canvas.remove();trail.remove();
  };
 },[paths,startedAt,cinematic]);
 return <div ref={host} className="maglio-projectiles-3d" data-camera="table-fixed"/>;
}
