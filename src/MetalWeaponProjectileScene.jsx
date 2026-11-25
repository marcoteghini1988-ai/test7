import React,{useEffect,useRef} from 'react';
import {Scene} from 'three';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {createMetalProjectile,metalProjectileFlightFrame,metalTrailPoint} from './metalWeaponProjectile3D.js';
import {thermalChargeForShot} from './metalWeaponBattleVisuals.js';
import {weaponTravelProgress} from './weaponCinematicStyle.js';

export default function MetalWeaponProjectileScene({paths,startedAt,cinematic=false}){
 const host=useRef(null);
 useEffect(()=>{
  const element=host.current;if(!element||!paths.length||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const trail=document.createElement('canvas'),canvas=document.createElement('canvas');
  trail.width=900;trail.height=1600;
  const ctx=trail.getContext('2d');ctx.scale(2,2);
  // Il rasterizzatore con depth buffer conserva volumi e occlusioni anche
  // quando WebGL non è disponibile sul dispositivo o nella prova StackBlitz.
  const renderer=new MaglioSoftwareRenderer(canvas,{contactShadow:false});
  renderer.setPixelRatio(1.5);renderer.setSize(450,800);
  element.append(trail,canvas);
  const camera=createProjectileCamera(),scene=new Scene();
  const entries=paths.map(path=>({...path,charge:thermalChargeForShot(path.shot),
   model:createMetalProjectile(path.profile.kind,path.profile.tier,thermalChargeForShot(path.shot).ratio)}));
  element.dataset.renderer='volume-depth-buffer';
  let raf=0,previous=-Infinity;
  const draw=now=>{
   const age=now-startedAt;
   if(now-previous<1000/30){raf=requestAnimationFrame(draw);return;}previous=now;
   ctx.clearRect(0,0,450,800);scene.clear();let pending=false;
   for(const entry of entries){
    const {from,to,start,profile,model,shot,charge}=entry;
    const t=(age-start)/profile.flightMs;
    if(t<0){pending=true;continue;}if(t>=1)continue;pending=true;
    const pose=metalProjectileFlightFrame(from,to,cinematic?weaponTravelProgress(profile.kind,t):t,camera,model.userData.frontZ);
    model.position.copy(pose.center);model.rotation.y=pose.yaw;scene.add(model);
    if(cinematic)model.rotation.z=profile.kind==='thermal-reclaimer'?Math.sin(age*.009)*.12:profile.tier>=1?age*.004:0;
    element.dataset.visibleEnd=pose.visibleEnd;element.dataset.shooter=shot.who;
    element.dataset.sequence=profile.sequence;element.dataset.progress=t.toFixed(3);
    element.dataset.nose=JSON.stringify(worldPointToBoard(pose.nose,camera));
    element.dataset.recoveredBonus=String(charge.extra);
    const thermal=profile.kind==='thermal-reclaimer',tier=profile.tier;
    ctx.globalAlpha=Math.min(1,t*22,(1-t)*28);
    // I nastri della Rara, gli anelli dell'Epica e i prismi restano
    // collegati alla stessa munizione reale, con un solo punto d'impatto.
    const streams=cinematic?0:thermal?3:tier===0?1:tier===1?2:3;
    for(let band=0;band<streams;band++){
     const colors=tier===3?[profile.core,profile.secondary,'#e0aaff']:[profile.glow,profile.secondary,profile.core];
     ctx.beginPath();
     const length=thermal?1.05+charge.ratio*.65:1.65+tier*.16;
     for(let i=0;i<=22;i++){
      const u=i/22,phase=u*(thermal?Math.PI*2:Math.PI*3)-age*.013+band*Math.PI*2/streams;
      const spread=(thermal?.12+charge.ratio*.07:tier===0?.012:.07+tier*.025)*(1+u*.8);
      const p=worldPointToBoard(metalTrailPoint(pose,model.userData.rearZ+u*length,
       Math.sin(phase)*spread,Math.cos(phase)*spread),camera);
      if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
     }
     ctx.strokeStyle=colors[band%3];ctx.lineWidth=thermal?1.7+charge.ratio:band===0?2:1.1;
     ctx.shadowColor=colors[band%3];ctx.shadowBlur=thermal?7:4;ctx.stroke();
    }
    ctx.shadowBlur=0;
    // I collari si chiudono nella profondità della camera del tavolo.
    if(!cinematic&&!thermal&&tier>=2){
     for(let ring=0;ring<tier;ring++){
      const phase=(age/270+ring/tier)%1,distance=.55+phase*1.2,radius=.09+phase*.08;
      ctx.beginPath();
      for(let i=0;i<=24;i++){
       const a=i/24*Math.PI*2,p=worldPointToBoard(metalTrailPoint(pose,distance,
        Math.sin(a)*radius,Math.cos(a)*radius),camera);
       if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
      }
      ctx.strokeStyle=tier===3?['#c8f2ff','#debaff','#f2efff'][ring]:profile.secondary;
      ctx.lineWidth=.8;ctx.stroke();
     }
    }
    ctx.globalAlpha=1;
   }
   renderer.render(scene,camera);
   if(pending)raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);entries.forEach(e=>disposeProjectile(e.model));renderer.dispose();trail.remove();canvas.remove();};
 },[paths,startedAt,cinematic]);
 return <div ref={host} className="maglio-projectiles-3d metal-projectiles-3d" data-camera="table-fixed"/>;
}
