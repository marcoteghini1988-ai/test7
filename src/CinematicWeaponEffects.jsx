import React,{useEffect,useRef} from 'react';
import {createProjectileCamera} from './maglioProjectile3D.js';
import {combatTargetElement,boardHullPoint} from './chainWeaponCanvas.js';
import {prepareCinematicEntry,drawCinematicWeapon} from './weaponCinematicRenderer.js';
import {weaponHullFrame,weaponTravelProgress} from './weaponCinematicStyle.js';
import './CinematicWeaponEffects.css';

const properties={x:'px',y:'px',roll:'deg',pitch:'deg',lift:'px',light:'',thrust:'',color:''};
// Both canvases share the model camera: floor light / wake below the meshes,
// chips / vapor above them. No replacement of the approved 3D projectiles.
export default function CinematicWeaponEffects({paths,startedAt}){
 const host=useRef(null),floorRef=useRef(null),airRef=useRef(null);
 useEffect(()=>{
  const element=host.current,root=element?.closest('.f3d-approved-layout');if(!root)return;
  const camera=createProjectileCamera();
  const entries=paths.filter(p=>p.profile.approved&&p.profile.kind!=='alloy-collision')
   .map(p=>prepareCinematicEntry(p,camera)).filter(Boolean);
  if(!entries.length)return;
  const floor=floorRef.current.getContext('2d'),air=airRef.current.getContext('2d');
  floor.setTransform(2,0,0,2,0,0);air.setTransform(2,0,0,2,0,0);
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const board=root.getBoundingClientRect();
  const ships=[...root.querySelectorAll('.official-mother,.live-escort')].map(target=>({target,
   point:boardHullPoint(target,board),previous:Object.keys(properties).map(k=>
    [k,target.style.getPropertyValue('--weapon-'+k)]),
   motion:target.getAttribute('data-weapon-motion'),light:target.getAttribute('data-weapon-light')}));
  for(const entry of entries)entry.target=combatTargetElement(root,entry.shot);
  const restore=ship=>{
   for(const [key,value]of ship.previous)value?ship.target.style.setProperty('--weapon-'+key,value):
    ship.target.style.removeProperty('--weapon-'+key);
   for(const name of ['motion','light'])ship[name]===null?ship.target.removeAttribute('data-weapon-'+name):
    ship.target.setAttribute('data-weapon-'+name,ship[name]);
  };
  let raf=0,previous=-Infinity,frames=0,maxFrame=0;
  element.dataset.presentation='cinematic-v2';
  element.dataset.motifs=JSON.stringify(entries.map(e=>e.style.motif));
  const draw=now=>{
   if(now-previous<1000/30){raf=requestAnimationFrame(draw);return;}
   if(Number.isFinite(previous))maxFrame=Math.max(maxFrame,now-previous);
   previous=now;frames++;
   const age=now-startedAt,reduced=media.matches;let pending=false,active=0;
   floor.clearRect(0,0,450,800);air.clearRect(0,0,450,800);
   const reactions=new Map();
   for(const entry of entries){
    const {profile:p,start,shot}=entry,elapsed=age-start,hitAge=elapsed-p.flightMs;
    if(elapsed<p.flightMs+p.impactMs)pending=true;
    if(elapsed<-(p.chargeMs||420)||hitAge>=p.impactMs)continue;
    active++;drawCinematicWeapon(floor,air,entry,age,{reduced});
    element.dataset.phase=elapsed<0?'charge':hitAge<0?'flight':shot.defenseBlocked?'shield-contact':'contact';
    element.dataset.motif=entry.style.motif;element.dataset.targetId=shot.targetId;
    const progress=weaponTravelProgress(p.kind,elapsed/p.flightMs);
    // World-space travel is projected like the model, not interpolated on screen.
    const moving=entry.a.clone().lerp(entry.b,progress).project(camera);
    moving.x=(moving.x+1)*225;moving.y=(1-moving.y)*400;
    for(const ship of ships){
     if(ship.target.dataset.collisionMotion)continue;
     const hit=entry.target===ship.target&&shot.fires&&!shot.defenseBlocked;
     const pose=hit?weaponHullFrame(p.kind,hitAge,p.impactMs,{tier:p.tier,
      direction:shot.who==='A'?-1:1,reduced}):{x:0,y:0,roll:0,pitch:0,lift:0,light:0,thrust:0};
     // Passing light has no recoil: nearby undamaged hulls simply reflect it.
     if(!reduced&&elapsed>=0&&hitAge<0&&!shot.defenseBlocked){
      const distance=Math.hypot(ship.point.x-moving.x,ship.point.y-moving.y);
      pose.light=Math.max(pose.light,.32*(1-clamp01(distance/90))**2);
     }
     if(pose.light<.004&&!pose.thrust&&!pose.x&&!pose.y)continue;
     const current=reactions.get(ship.target);
     if(!current||pose.light>current.light)reactions.set(ship.target,{...pose,color:p.glow,kind:p.kind,
      motion:hit&&hitAge>=0});
    }
   }
   for(const ship of ships){
    const pose=reactions.get(ship.target);
    if(!pose){restore(ship);continue;}
    ship.target.dataset.weaponLight=pose.kind;
    if(pose.motion)ship.target.dataset.weaponMotion=pose.kind;
    else ship.target.removeAttribute('data-weapon-motion');
    for(const [key,unit]of Object.entries(properties))ship.target.style.setProperty('--weapon-'+key,
     typeof pose[key]==='number'?pose[key].toFixed(4)+unit:pose[key]);
   }
   element.dataset.active=String(active);element.dataset.frames=String(frames);
   element.dataset.maxFrameMs=maxFrame.toFixed(1);
   if(pending)raf=requestAnimationFrame(draw);
   else{ships.forEach(restore);element.dataset.restored='true';}
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);ships.forEach(restore);
   floor.clearRect(0,0,450,800);air.clearRect(0,0,450,800);};
 },[paths,startedAt]);
 return <div ref={host} className="weapon-cinema" aria-hidden="true">
  <canvas ref={floorRef} width="900" height="1600" className="weapon-cinema-floor"/>
  <canvas ref={airRef} width="900" height="1600" className="weapon-cinema-air"/>
 </div>;
}
