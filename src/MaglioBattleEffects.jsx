import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {card,cardFacePath,cardRole} from './fleetNext/rules.js';
import {projectFleetSlots,projectMachineBerths} from './fleetNext/battlePresentation.js';
import {weaponEffectProfile,weaponPortalOrigin} from './maglioBattleVisuals.js';
import {playSound} from './audio.js';
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
 const cards=[...selectedCards];
 for(const shot of shots){
  if(cards.some(c=>c.id===shot.cardId))continue;
  cards.push({id:shot.cardId,grade:1});
 }
 return cards.filter(c=>cardFacePath(c.id,c.grade));
};

function WeaponProjectile({profile}){
 switch(profile.kind){
  case 'gravity-maul':return <>
   <ellipse rx={15+profile.tier*3} ry={23+profile.tier*3} fill={profile.glow} opacity=".2"/>
   {Array.from({length:profile.tier+1},(_,i)=><ellipse key={i}
    rx={11+i*5} ry={17+i*5} fill="none" stroke={i%2?profile.secondary:profile.core}
    strokeWidth="1.3" opacity={.8-i*.12}/>)}
   <path d="M-8 10 L-11-10 L-6-21 L6-21 L11-10 L8 10 L0 19 Z"
    fill="#2a3542" stroke={profile.core} strokeWidth="2.4"/>
   <path d="M-8-8 H8 M-7 2 H7 M-5 10 H5" stroke={profile.secondary} strokeWidth="2"/>
   <circle cy="-17" r="4" fill={profile.core}/>
  </>;
  default:return <><ellipse rx="8" ry="18" fill="#8eeaff" opacity=".2"/>
   <path d="M0-18 L6 5 L0 15 L-6 5 Z" fill="#9deaff" stroke="#f1ffff" strokeWidth="1.2"/></>;
 }
}

export default function MaglioBattleEffects({shots=[],selectedCards=[],playerSide,ply,nonce}){
 const ref=useRef(null),[paths,setPaths]=useState([]),[placements,setPlacements]=useState([]);
 const reveals=visualCards(shots,selectedCards);
 const shotStart=980+reveals.length*520;
 // Il suono segue l'evento reale e gli stessi tempi della traiettoria visiva.
 // La chiave nonce rimonta il componente a ogni risoluzione: nessun doppio audio
 // durante i ricalcoli delle coordinate del ResizeObserver.
 useEffect(()=>{
  const timers=[];
  for(const shot of shots){
   if(!shot.fires)continue;
   const profile=weaponEffectProfile(shot.cardId);
   if(!profile?.sound)continue;
   const start=shotStart+(shot.delayMs||0);
   timers.push(window.setTimeout(()=>playSound(profile.sound.fire),start));
   timers.push(window.setTimeout(()=>playSound(profile.sound.impact),start+470));
  }
  return ()=>timers.forEach(id=>window.clearTimeout(id));
 },[nonce,shots,shotStart]);
 useLayoutEffect(()=>{
  const root=ref.current?.closest('.f3d-approved-layout');
  if(!root)return;
  const hitTargets=new Set();
  const measure=()=>{
   const board=root.getBoundingClientRect();
   if(!board.width||!board.height)return;
   setPlacements(measurePlacements(root,selectedCards,playerSide,ply,board));
   setPaths(shots.filter(s=>s.fires).flatMap(shot=>{
    const target=targetForShot(root,shot);
    if(!target)return [];
    const to=point(target.getBoundingClientRect(),board);
    const from=weaponPortalOrigin(shot.who);
    const profile=weaponEffectProfile(shot.cardId);
    if(!from||!profile)return [];
    const start=shotStart+(shot.delayMs||0);
    target.classList.add('f3d-ship-hit');
    target.style.setProperty('--ship-hit-delay',start+470+'ms');
    hitTargets.add(target);
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
  <svg className="maglio-battle-effects" viewBox="0 0 450 800" focusable="false">
   {paths.map(({shot,from,to,profile,start},index)=>{
    const impactDelay=start+470;
    const gradientId='weapon-impact-'+nonce+'-'+index;
    const flashY=shot.who==='A'?790:10;
    const angle=Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI+90;
    const impactCore=profile.impactCore||profile.core;
    const impactGlow=profile.impactGlow||profile.glow;
    const impactSecondary=profile.impactSecondary||profile.secondary;
    const style={'--shot-core':profile.core,'--shot-glow':profile.glow,
     '--shot-secondary':profile.secondary};
    return <g key={nonce+'-shot-'+index} className="maglio-shot"
     data-shooter={shot.who} data-target-kind={shot.targetKind}
     data-target-id={shot.targetId} data-actual-damage={shot.actualDamage}
     data-projectiles="1" data-origin-edge={from.edge}
     data-weapon-kind={profile.kind} data-rarity={profile.rarity} style={style}>
     <defs><radialGradient id={gradientId}>
      <stop offset="0" stopColor={impactCore} stopOpacity=".95"/>
      <stop offset=".42" stopColor={impactGlow} stopOpacity=".55"/>
      <stop offset="1" stopColor={impactGlow} stopOpacity="0"/>
     </radialGradient></defs>
     <g transform={'translate(225 '+flashY+')'} className="weapon-portal-flash"
      style={{'--maglio-flight-delay':start+'ms'}}>
      <ellipse rx="21" ry="9" fill={profile.glow} opacity=".8"/>
      <ellipse rx="9" ry="4" fill={profile.core}/>
     </g>
     <g className="maglio-pulse-travel"
      style={{'--maglio-from-x':from.x+'px','--maglio-from-y':from.y+'px',
       '--maglio-to-x':to.x+'px','--maglio-to-y':to.y+'px',
       '--maglio-flight-delay':start+'ms'}}>
      <g transform={'rotate('+angle+') scale('+profile.scale+')'}>
       {Array.from({length:profile.trailBands},(_,i)=><path key={i}
        d={'M'+(-4-i*3)+' '+(20+i*3)+' Q0 '+(35+i*8)+' '+(4+i*3)+' '+(20+i*3)}
        fill="none" stroke={i%2?profile.secondary:profile.glow}
        strokeWidth={Math.max(1,2-i*.25)} opacity={.78-i*.15}/>)}
       <WeaponProjectile profile={profile}/>
      </g>
     </g>
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
     </g>
    </g>;
   })}
  </svg>
 </div>;
}
