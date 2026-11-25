import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {card,cardFacePath,cardRole} from './fleetNext/rules.js';
import {projectFleetSlots,projectMachineBerths} from './fleetNext/battlePresentation.js';
import {weaponEffectProfile,weaponPortalOrigin,weaponVisualCards,weaponShotStartMs} from './maglioBattleVisuals.js';
import MaglioProjectileScene from './MaglioProjectileScene.jsx';
import MetalWeaponProjectileScene from './MetalWeaponProjectileScene.jsx';
import MetalWeaponShotAccents from './MetalWeaponShotAccents.jsx';
import {thermalChargeForShot} from './metalWeaponBattleVisuals.js';
import {playSound} from './audio.js';
import MagneticWeaponEffects from './MagneticWeaponEffects.jsx';
import PrecisionWeaponEffects from './PrecisionWeaponEffects.jsx';
import CinematicWeaponEffects from './CinematicWeaponEffects.jsx';
import {collisionGroups,chainWeaponVariant,COLLISION_RELEASE_AFTER_MS} from './chainWeaponBattleVisuals.js';
import {combatTargetElement,boardHullPoint} from './chainWeaponCanvas.js';
import {requestWeaponHaptic,cancelWeaponHaptics} from './weaponHaptics.js';
import './MaglioBattleEffects.css';

const point=(rect,board)=>({
 x:((rect.left+rect.width/2)-board.left)*450/board.width,
 y:((rect.top+rect.height/2)-board.top)*800/board.height
});

function targetForShot(root,shot){
 const fleet=root.querySelector(`[data-fleet-side="${shot.who==='A'?'B':'A'}"]`);
 if(shot.targetKind==='part')return fleet?.querySelector('.official-mother');
 return [...(fleet?.querySelectorAll('[data-combat-id]')||[])].find(el=>
  el.dataset.combatId===shot.targetId&&el.dataset.combatKind===shot.targetKind);
}

function placementTarget(root,side,ply,cardIds,id){
 const definition=card(id);
 if(definition?.effectSpec?.type==='deployMachine'){
  const berth=projectMachineBerths(side,cardIds,ply).findIndex(entry=>!entry);
  return root.querySelector(`[data-fleet-weapon-slot="${Math.max(0,berth)}"]`);
 }
 const current=projectFleetSlots(side,cardIds,'A');
 const next=projectFleetSlots(side,[...cardIds,id],'A');
 let index=next.findIndex((entry,i)=>entry?.id===id&&entry?.pending&&!current[i]);
 if(index<0){
  const role=cardRole(id);
  index=definition?.effectSpec?.type==='energy'?5:role==='character'?0:
   role==='defense'?(definition?.effectSpec?.type==='trap'?2:1):4;
 }
 return root.querySelector(`[data-fleet-card-slot="A-${index}"]`);
}

// Le tre carte percorrono la distanza reale fra mano e slot della plancia.
function measurePlacements(root,selectedCards,playerSide,ply,board){
 if(!playerSide)return [];
 const already=[];
 return selectedCards.flatMap((entry,index)=>{
  const source=root.querySelector(`[data-fleet-hand-index="${entry.index}"]`);
  const target=placementTarget(root,playerSide,ply,already,entry.id);
  already.push(entry.id);
  if(!source||!target)return [];
  const a=point(source.getBoundingClientRect(),board);
  const b=point(target.getBoundingClientRect(),board);
  return [{...entry,index,from:a,to:b,art:cardFacePath(entry.id,entry.grade)}];
 });
}

const visualCards=(shots,selectedCards)=>{
 return weaponVisualCards(shots,selectedCards).filter(c=>cardFacePath(c.id,c.grade));
};

function WeaponProjectile(){
 return <><ellipse rx="8" ry="18" fill="#8eeaff" opacity=".2"/>
   <path d="M0-18 L6 5 L0 15 L-6 5 Z" fill="#9deaff" stroke="#f1ffff" strokeWidth="1.2"/></>;
}

export default function MaglioBattleEffects({shots=[],events=[],selectedCards=[],playerSide,ply,nonce,resolvedSides,startedAt:effectStartedAt}){
 const ref=useRef(null),[paths,setPaths]=useState([]),[placements,setPlacements]=useState([]);
 const startedAt=useRef(effectStartedAt??performance.now()).current;
 const projectilePaths=useMemo(()=>paths.filter(p=>p.profile.kind==='gravity-maul'),[paths]);
 const metalPaths=useMemo(()=>paths.filter(p=>['steel-rail','thermal-reclaimer'].includes(p.profile.kind)),[paths]);
 const reveals=visualCards(shots,selectedCards);
 const shotStart=weaponShotStartMs(reveals.length);
 // Il suono segue l'evento reale e gli stessi tempi della traiettoria visiva.
 // La chiave nonce rimonta il componente a ogni risoluzione: nessun doppio audio
 // durante i ricalcoli delle coordinate del ResizeObserver.
 useEffect(()=>{
  const timers=[],collisionKeys=new Set();let requested=false;
  const schedule=(delay,callback)=>timers.push(window.setTimeout(callback,
   Math.max(0,delay-(performance.now()-startedAt))));
  const cue=(profile,phase,time,shot)=>schedule(time,()=>{
   const root=ref.current?.closest('.f3d-approved-layout'),target=root&&combatTargetElement(root,shot);
   const pan=target&&['impact','block'].includes(phase)?(boardHullPoint(target,root.getBoundingClientRect()).x-225)/225:0;
   playSound(profile.sound[phase],phase==='charge'?thermalChargeForShot(shot).ratio*3:0,pan);
   const result=requestWeaponHaptic(profile.kind,phase,profile.tier);
   if(result.status==='requested')requested=true;
   if(ref.current){ref.current.dataset.hapticStatus=result.status;
    ref.current.dataset.hapticPhase=phase;ref.current.dataset.hapticPattern=JSON.stringify(result.pattern);}
  });
  for(const shot of shots){
   if(!shot.fires&&!shot.defenseBlocked)continue;
   const profile=weaponEffectProfile(shot.cardId,shot);
   if(!profile?.sound)continue;
   if(profile.kind==='alloy-collision'){
    if(collisionKeys.has(shot.visualGroupId))continue;
    collisionKeys.add(shot.visualGroupId);
   }
   const start=shotStart+(shot.delayMs||0);
   if(profile.sound.charge)cue(profile,'charge',Math.max(0,start-profile.chargeMs),shot);
   cue(profile,shot.cascadeTransfer?'transfer':'fire',start,shot);
   cue(profile,shot.defenseBlocked?'block':'impact',start+profile.flightMs,shot);
   if(profile.kind==='alloy-collision')cue(profile,'release',start+profile.flightMs+COLLISION_RELEASE_AFTER_MS,shot);
  }
  for(const event of events.filter(e=>e.kind==='weapon-break-defense'&&chainWeaponVariant(e.cardId))){
   cue(weaponEffectProfile(event.cardId),'defense',shotStart-180,event);
  }
  return ()=>{timers.forEach(id=>window.clearTimeout(id));if(requested)cancelWeaponHaptics();};
 },[nonce,shots,shotStart]);
 useLayoutEffect(()=>{
  const root=ref.current?.closest('.f3d-approved-layout');
  if(!root)return;
  const hitTargets=new Set();
  const measure=()=>{
   const board=root.getBoundingClientRect();
   if(!board.width||!board.height)return;
   setPlacements(measurePlacements(root,selectedCards,playerSide,ply,board));
   const collisionShots=collisionGroups(shots).flat();
   setPaths(shots.filter(s=>s.fires||s.defenseBlocked||collisionShots.includes(s)).flatMap(shot=>{
    const profile=weaponEffectProfile(shot.cardId,shot);
    const special=!!profile?.approved;
    const target=special?combatTargetElement(root,shot):targetForShot(root,shot);
    if(!target)return [];
    const to=special?boardHullPoint(target,board):point(target.getBoundingClientRect(),board);
    const source=shot.cascadeTransfer?combatTargetElement(root,{...shot,
     targetKind:shot.sourceTargetKind,targetId:shot.sourceTargetId}):null;
    if(shot.cascadeTransfer&&!source)return [];
    const from=source?{...boardHullPoint(source,board),edge:'previous-hull'}:weaponPortalOrigin(shot.who);
    if(!from||!profile)return [];
    const start=shotStart+(shot.delayMs||0);
    if(!profile.approved&&!shot.defenseBlocked){
     target.classList.add('f3d-ship-hit');
     target.style.setProperty('--ship-hit-delay',start+profile.flightMs+'ms');
     hitTargets.add(target);
    }
    return [{shot,from,to,profile,start}];
   }));
  };
  measure();
  const observer=new ResizeObserver(measure);observer.observe(root);
  return ()=>{
   observer.disconnect();
   for(const target of hitTargets){
    target.classList.remove('f3d-ship-hit');
    target.style.removeProperty('--ship-hit-delay');
   }
  };
 },[shots,selectedCards,playerSide,ply,nonce,shotStart]);

 return <div ref={ref} className="maglio-battle-stage" aria-hidden="true"
  data-weapon-effects={paths.length} data-card-flights={placements.length}>
  {placements.map(({id,index,from,to,art})=>art&&<img key={nonce+'-place-'+index}
   className="maglio-card-flight" src={art} alt="" draggable={false}
   style={{left:from.x-29,top:from.y-43,'--card-dx':to.x-from.x+'px',
    '--card-dy':to.y-from.y+'px','--card-delay':index*110+'ms'}}/>)}
  {reveals.map(({id,grade},index)=>{
   const destination=index<selectedCards.length?placements[index]?.to:null;
   return <img key={nonce+'-reveal-'+index+'-'+id}
    className="maglio-card-reveal" src={cardFacePath(id,grade)} alt="" draggable={false}
    style={{'--reveal-delay':650+index*520+'ms',
     '--reveal-x':(destination?.x??225)-225+'px',
     '--reveal-y':(destination?.y??379.5)-379.5+'px'}}/>;
  })}
  <CinematicWeaponEffects paths={paths} startedAt={startedAt}/>
  <MaglioProjectileScene paths={projectilePaths} startedAt={startedAt} cinematic/>
  <MetalWeaponProjectileScene paths={metalPaths} startedAt={startedAt} cinematic/>
  <MagneticWeaponEffects paths={paths} events={events} startedAt={startedAt}
   shotStart={shotStart} resolvedSides={resolvedSides} cinematic/>
  <PrecisionWeaponEffects paths={paths} startedAt={startedAt} cinematic/>
  <svg className="maglio-battle-effects" viewBox="0 0 450 800" focusable="false">
   {paths.map(({shot,from,to,profile,start},index)=>{
    if(profile.approved)return <g key={nonce+'-shot-'+index}
     className="maglio-shot magnetic-shot" data-shooter={shot.who}
     data-target-kind={shot.targetKind} data-target-id={shot.targetId}
     data-actual-damage={shot.actualDamage} data-projectiles={profile.kind==='alloy-collision'?0:1}
     data-origin-edge={from.edge} data-flight-ms={profile.flightMs}
     data-impact-at-ms={start+profile.flightMs} data-projection="perspective-3d"
     data-visible-end={shot.who==='A'?'rear':'front'} data-weapon-kind={profile.kind}
     data-rarity={profile.rarity} data-sequence={profile.sequence}
     data-cascade-index={shot.cascadeIndex||0} data-source-target-id={shot.sourceTargetId||''}
     data-transfer-energy={shot.transferEnergySpent||0} data-stage={shot.stage||1}/>;
    const impactDelay=start+profile.flightMs;
    const gradientId='weapon-impact-'+nonce+'-'+index;
    const flashY=shot.who==='A'?790:10;
    const angle=Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI+90;
    const impactCore=profile.impactCore||profile.core;
    const impactGlow=profile.impactGlow||profile.glow;
    const impactSecondary=profile.impactSecondary||profile.secondary;
    const metal=['steel-rail','thermal-reclaimer'].includes(profile.kind);
    const volumetric=metal||profile.kind==='gravity-maul';
    const style={'--shot-core':profile.core,'--shot-glow':profile.glow,
     '--shot-secondary':profile.secondary,'--maglio-flight-ms':profile.flightMs+'ms',
     '--maglio-impact-ms':profile.impactMs+'ms'};
    return <g key={nonce+'-shot-'+index} className="maglio-shot"
     data-shooter={shot.who} data-target-kind={shot.targetKind}
     data-target-id={shot.targetId} data-actual-damage={shot.actualDamage}
     data-projectiles="1" data-origin-edge={from.edge}
     data-flight-ms={profile.flightMs} data-impact-at-ms={impactDelay}
     data-projection={volumetric?'perspective-3d':'legacy'}
     data-visible-end={volumetric?(shot.who==='A'?'rear':'front'):undefined}
     data-weapon-kind={profile.kind} data-rarity={profile.rarity} style={style}>
     <defs><radialGradient id={gradientId}>
      <stop offset="0" stopColor={impactCore} stopOpacity=".95"/>
      <stop offset=".42" stopColor={impactGlow} stopOpacity=".55"/>
      <stop offset="1" stopColor={impactGlow} stopOpacity="0"/>
     </radialGradient></defs>
     {!metal&&<g transform={'translate(225 '+flashY+')'} className="weapon-portal-flash"
      style={{'--maglio-flight-delay':start+'ms'}}>
      <ellipse rx="21" ry="9" fill={profile.glow} opacity=".8"/>
      <ellipse rx="9" ry="4" fill={profile.core}/>
     </g>}
     {!volumetric&&<g className="maglio-pulse-travel"
      style={{'--maglio-from-x':from.x+'px','--maglio-from-y':from.y+'px',
       '--maglio-to-x':to.x+'px','--maglio-to-y':to.y+'px',
       '--maglio-from-scale':shot.who==='A'?1.18:.68,
       '--maglio-to-scale':.68+Math.max(0,Math.min(1,to.y/800))*.5,
       '--maglio-flight-delay':start+'ms'}}>
      <g transform={'rotate('+angle+') scale('+profile.scale+')'}>
       {profile.kind!=='gravity-maul'&&Array.from({length:profile.trailBands},(_,i)=><path key={i}
        d={'M'+(-4-i*3)+' '+(20+i*3)+' Q0 '+(35+i*8)+' '+(4+i*3)+' '+(20+i*3)}
        fill="none" stroke={i%2?profile.secondary:profile.glow}
        strokeWidth={Math.max(1,2-i*.25)} opacity={.78-i*.15}/>)}
       <WeaponProjectile profile={profile}/>
      </g>
     </g>}
     {metal?<MetalWeaponShotAccents shot={shot} profile={profile} start={start} to={to} gradientId={gradientId}/>:
     <g transform={'translate('+to.x+' '+to.y+') scale('+profile.impactScale+')'}
      style={{'--maglio-impact-delay':impactDelay+'ms'}}>
      <g className="maglio-gravity-impact">
       <ellipse rx="48" ry="34" fill={'url(#'+gradientId+')'}/>
       {Array.from({length:profile.impactRings},(_,i)=><ellipse key={i}
        className="maglio-impact-ring" rx={22+i*8} ry={13+i*5}
        fill="none" stroke={i%2?impactSecondary:impactCore}
        strokeWidth={Math.max(1,2.1-i*.25)}
        style={{'--ring-delay':impactDelay+i*65+'ms'}}/>)}
       {Array.from({length:4+profile.tier*2},(_,i)=>{
        const a=i*Math.PI*2/(4+profile.tier*2);
        const x=Math.cos(a),y=Math.sin(a);
        return <path key={i} d={'M'+(x*14)+' '+(y*9)+' L'+(x*(29+profile.tier*4))+' '+(y*(20+profile.tier*3))}
         stroke={i%2?impactSecondary:impactCore} strokeWidth="1.4" strokeLinecap="round"/>;
       })}
      </g>
     </g>}
    </g>;
   })}
  </svg>
 </div>;
}
