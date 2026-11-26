import React,{useEffect,useRef} from 'react';
import {Scene} from 'three';
import {createProjectileCamera,disposeProjectile} from './maglioProjectile3D.js';
import {weaponFlightFrame,applyWeaponFlightPose} from './weaponKinematics.js';
import {newProjectile} from './approvedProjectileEffects.js';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';

export default function IonicWeaponProjectileScene({paths,startedAt}){
 const host=useRef(null);
 useEffect(()=>{
  if(!host.current||!paths.length||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const canvas=document.createElement('canvas'),renderer=new MaglioSoftwareRenderer(canvas,{contactShadow:false});renderer.setPixelRatio(1.5);renderer.setSize(450,800);host.current.append(canvas);
  const camera=createProjectileCamera(),scene=new Scene(),entries=paths.map(p=>({...p,model:newProjectile('ionic-dart',p.profile.tier)}));
  let raf=0,last=-Infinity;
  const draw=now=>{
   if(now-last<1000/30){raf=requestAnimationFrame(draw);return;}last=now;scene.clear();let pending=false;
   for(const e of entries){const t=(now-startedAt-e.start)/e.profile.flightMs;if(t<0){pending=true;continue;}if(t>=1)continue;pending=true;
    applyWeaponFlightPose(e.model,weaponFlightFrame(e.from,e.to,t,camera,e.model.userData.frontZ,{shot:e.shot,kind:e.profile.kind}));scene.add(e.model);
   }
   renderer.render(scene,camera);if(pending)raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);entries.forEach(e=>disposeProjectile(e.model));renderer.dispose();canvas.remove();};
 },[paths,startedAt]);
 return <div ref={host} className="maglio-projectiles-3d ionic-projectiles-3d" data-camera="table-fixed"/>;
}
