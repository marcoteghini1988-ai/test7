import React,{useLayoutEffect,useRef,useState} from 'react';
import {projectileFrame,weaponEffect} from './mathWeaponEffects.js';
import {tacticalWeaponTrajectory} from './tacticalVisualGeometry.js';
import {currentTacticalPlayback} from './tacticalCombatTimeline.js';
import {TACTICAL_TIMING} from './simultaneousDuelEngine.js';

function relativeBox(svg,root){
 if(!svg||!root)return null;
 const a=svg.getBoundingClientRect(),b=root.getBoundingClientRect();
 if(b.width<=0||b.height<=0||a.width<=0||a.height<=0)return null;
 return {
  left:(a.left-b.left)/b.width*100,top:(a.top-b.top)/b.height*100,
  width:a.width/b.width*100,height:a.height/b.height*100
 };
}

// Only replays authoritative events. Does not change combat logic or spend cards.
export default function TacticalCombatPlayback({battle,nowMs,hulls}){
 const root=useRef(null),[boxes,setBoxes]=useState(null);
 useLayoutEffect(()=>{
  if(battle.phase!=='resolving')return;
  const measure=()=>{
   const a=relativeBox(hulls?.A?.current,root.current);
   const b=relativeBox(hulls?.B?.current,root.current);
   if(a&&b)setBoxes({A:a,B:b});
  };
  measure();
  const obs=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  if(obs&&hulls?.A?.current)obs.observe(hulls.A.current);
  if(obs&&hulls?.B?.current)obs.observe(hulls.B.current);
  window.addEventListener('resize',measure);
  return ()=>{obs?.disconnect();window.removeEventListener('resize',measure);};
 },[battle.phase,battle.round,battle.sides.A.shipId,battle.sides.B.shipId,hulls?.A,hulls?.B]);
 if(battle.phase!=='resolving')return null;
 const frame=currentTacticalPlayback(battle,nowMs);
 const ships={A:battle.sides.A.shipId,B:battle.sides.B.shipId};
 return <div ref={root} className="tdp-playback" data-stage={frame.stage.id} aria-label="Risoluzione dello scontro">
  <div className="tdp-playback-stage">{frame.stage.label}
   <span className="tdp-playback-progress"><span style={{width:(frame.elapsedMs/TACTICAL_TIMING.resolveMs*100)+'%'}}/></span>
  </div>
  {frame.shots.map(shot=>{
   const fx=weaponEffect(shot.weaponId);
   const p=Math.max(0,Math.min(1,(frame.elapsedMs-shot.atMs)/shot.durationMs));
   const byA=shot.by==='A';
   const trajectory=tacticalWeaponTrajectory(shot,ships,boxes);
   const start=trajectory?.start??{x:30,y:byA?78:22};
   const end=trajectory?.end??{x:34,y:byA?23:77};
   const bend=(shot.profile.includes('arc')||shot.profile.includes('ion'))?9:
    shot.profile.includes('needle')?-5:shot.profile.includes('orbit')?7:0;
   const coords=projectileFrame(end.x-start.x,end.y-start.y,bend,p);
   const width=Math.max(10,Math.min(38,fx.width));
   const height=Math.max(5,Math.min(27,fx.height));
   return <span key={shot.id}
    className={'tdp-shot tdp-shot--'+shot.profile.replace(/[^a-zA-Z0-9-]/g,'')}
    data-weapon={shot.weaponId} title={shot.weaponName}
    data-mounted={trajectory?.mounted?'yes':'pending'}
    style={{
     left:(start.x+coords.x)+'%',top:(start.y+coords.y)+'%',
     '--shot-color':shot.color,'--shot-width':width+'px','--shot-height':height+'px',
     transform:`translate(-50%,-50%) rotate(${coords.angle}deg)`
    }}><i/></span>;
  })}
  {frame.notices.map(event=>{
   const targetSide=event.type==='special'?event.by:(event.by==='A'?'B':'A');
   const pos=targetSide==='B'?'tdp-notice--enemy':'tdp-notice--player';
   const precision=event.type==='precision';
   const blocked=precision&&event.reason!=='hit';
   return <div key={event.id}
    className={'tdp-playback-notice '+pos+(event.type==='special'?' tdp-notice--special':'')+(blocked?' tdp-notice--blocked':'')}>
    <strong>{event.label}</strong>
    {event.type==='barrier'&&event.intercepted>0&&<small>Scudiera: {event.intercepted} assorbiti</small>}
    {precision&&event.absorbed>0&&<small>Fusione: {event.absorbed} assorbiti</small>}
   </div>;
  })}
  {frame.outcome&&<div className="tdp-playback-outcome">{frame.outcome.label}</div>}
 </div>;
}
