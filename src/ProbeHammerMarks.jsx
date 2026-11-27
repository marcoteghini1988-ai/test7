import React,{useEffect,useRef} from 'react';
import {activeProbeMarks,probeMarkTimeline,probeMarkFade} from './probeHammerMarks.js';
import {weaponEffectProfile,weaponVisualCards,weaponShotStartMs} from './maglioBattleVisuals.js';
import {drawProbeHammerReticle} from './probeHammerRenderer.js';
import {combatTargetElement,boardHullPoint,createEffectCanvas} from './chainWeaponCanvas.js';
import {playSound} from './audio.js';
import {requestWeaponHaptic} from './weaponHaptics.js';
import './ProbeHammerMarks.css';

// Public signal state only: no hidden hand/defense information is rendered.
export default function ProbeHammerMarks({battle,resolving,fx}){
 const host=useRef(null),previous=useRef(battle);
 useEffect(()=>{
  const old=previous.current;previous.current=battle;
  if(resolving||old===battle)return;
  for(const mark of activeProbeMarks(old))if(mark.expiresPly<=battle.ply&&
   battle.sides[mark.who].provisionalWeaponStatus?.ionProbe?.id===mark.targetId){
   if(document.visibilityState!=='visible')continue;
   playSound(weaponEffectProfile(mark.cardId).sound.release);
   requestWeaponHaptic('ionic-probe','release',0);
  }
 },[battle,resolving]);
 useEffect(()=>{
  const element=host.current,root=element?.closest('.f3d-approved-layout');if(!root)return;
  const shots=resolving?fx?.weaponShots||[]:[];
  const start=weaponShotStartMs(weaponVisualCards(shots,fx?.selectedCards||[]).length);
  const marks=resolving?probeMarkTimeline(battle,shots,start,weaponEffectProfile):activeProbeMarks(battle);
  if(!marks.length){element.dataset.activeMarks='0';return;}
  const {canvas,ctx}=createEffectCanvas(element),media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,previousFrame=-Infinity;
  const draw=now=>{
   if(now-previousFrame<1000/30){raf=requestAnimationFrame(draw);return;}previousFrame=now;
   ctx.clearRect(0,0,450,800);const age=resolving?now-fx.startedAt:300,board=root.getBoundingClientRect();let visible=0;
   if(document.visibilityState==='visible')for(const mark of marks){
    const opacity=probeMarkFade(mark,age);if(!opacity)continue;
    const target=combatTargetElement(root,mark);if(!target)continue;
    const p=boardHullPoint(target,board),scale=age>=mark.until?opacity:1;
    drawProbeHammerReticle(ctx,p,media.matches?140:resolving&&!mark.persisted?age-mark.at:now,mark.rarity,{opacity,scale});visible++;
   }
   element.dataset.activeMarks=String(visible);
   element.dataset.targetIds=JSON.stringify(marks.filter(m=>probeMarkFade(m,age)>0).map(m=>m.targetId));
   raf=requestAnimationFrame(draw);
  };
  raf=requestAnimationFrame(draw);
  return ()=>{cancelAnimationFrame(raf);canvas.remove();element.dataset.activeMarks='0';};
 },[battle,resolving,fx]);
 return <div ref={host} className="probe-hammer-marks" aria-hidden="true"/>;
}
