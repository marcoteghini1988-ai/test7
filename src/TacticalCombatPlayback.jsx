import React from 'react';
import {projectileFrame,weaponEffect} from './mathWeaponEffects.js';
import {currentTacticalPlayback} from './tacticalCombatTimeline.js';
import {TACTICAL_TIMING} from './simultaneousDuelEngine.js';

// Only plays a replay of the authoritative result. NO game state changes here.
export default function TacticalCombatPlayback({battle,nowMs}){
 if(battle.phase!=='resolving')return null;
 const frame=currentTacticalPlayback(battle,nowMs);
 return <div className="tdp-playback" data-stage={frame.stage.id} aria-label="Risoluzione dello scontro">
  <div className="tdp-playback-stage">{frame.stage.label}
   <span className="tdp-playback-progress"><span style={{width:(frame.elapsedMs/TACTICAL_TIMING.resolveMs*100)+'%'}}/></span>
  </div>
  {frame.shots.map(shot=>{
   const fx=weaponEffect(shot.weaponId);
   const p=(frame.elapsedMs-shot.atMs)/shot.durationMs;
   const byA=shot.by==='A',fromY=byA?78:22,toY=byA?23:77;
   const xBase=31+(shot.weaponIndex%4)*4+(shot.muzzleIndex?2:-2);
   const toX=36+(shot.weaponIndex%3)*4;
   const startX=xBase,startY=fromY;
   const bend=(shot.profile.includes('arc')||shot.profile.includes('ion'))?9:
    shot.profile.includes('needle')?-5:shot.profile.includes('orbit')?7:0;
   const coords=projectileFrame(toX-startX,toY-startY,bend,p);
   const width=Math.max(10,Math.min(38,fx.width));
   const height=Math.max(5,Math.min(27,fx.height));
   return <span key={shot.id}
    className={'tdp-shot tdp-shot--'+shot.profile.replace(/[^a-zA-Z0-9-]/g,'')}
    data-weapon={shot.weaponId} title={shot.weaponName}
    style={{
     left:(startX+coords.x)+'%',top:(startY+coords.y)+'%',
     '--shot-color':shot.color,'--shot-width':width+'px','--shot-height':height+'px',
     transform:`translate(-50%,-50%) rotate(${coords.angle}deg)`
    }}>
     <i/>
    </span>;
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
