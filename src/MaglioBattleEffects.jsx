import React,{useLayoutEffect,useRef,useState} from 'react';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS,maglioArtwork,maglioVariant,maglioAttackMotion} from './maglioBattleVisuals.js';
import './MaglioBattleEffects.css';

export function MaglioArtPreload(){
 return <>{MAGLIO_VARIANTS.flatMap(v=>['player','enemy'].map(side=><link key={v.id+side} rel="preload" as="image"
  href={maglioArtwork(v.id,side)}/>))}</>;
}

export function MaglioWeaponModel({side,shot,pending,cardId=MAGLIO_CARD_ID,slot=0}){
 const variant=maglioVariant(cardId),head=side==='enemy'?variant.enemyHead:variant.playerHead;
 return <span className="maglio-device" data-side={side} data-slot={slot} data-rarity={variant.rarity}
  data-state={pending?'pending':shot?.fires?'firing':shot?'deploying':'idle'}
  style={{'--maglio-delay':(shot?.delayMs||0)+'ms','--maglio-head-x':head[0]+'%','--maglio-head-y':head[1]+'%'}}>
  <span className="maglio-motion"><span className="maglio-orientation">
  <img className="maglio-device-art" src={maglioArtwork(cardId,side)}
   alt={'Maglio Ferrogravitazionale '+variant.rarity+' 3D'} draggable={false}/>
  <i className="maglio-muzzle-anchor" aria-hidden="true"/>
  {shot?.fires&&<span className="maglio-charge" aria-hidden="true"><i/><b/></span>}
  </span></span>
 </span>;
}

// Gli estremi vengono misurati sui pezzi reali della plancia: supporti,
// moduli, armi o madre. Nessuna coordinata fittizia del bersaglio.
function shotGeometry(root,shot){
 const source=root.querySelector(`[data-weapon-actor="${shot.who}"][data-weapon-slot="${shot.machineSlot}"] .maglio-muzzle-anchor`);
 const fleet=root.querySelector(`[data-fleet-side="${shot.who==='A'?'B':'A'}"]`);
 const target=shot.targetKind==='part'?fleet?.querySelector('.official-mother'):
  [...(fleet?.querySelectorAll('[data-combat-id]')||[])].find(el=>
   el.dataset.combatId===shot.targetId&&el.dataset.combatKind===shot.targetKind);
 if(!source||!target)return null;
 const board=root.getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
 if(!board.width||!board.height)return null;
 const point=r=>({x:((r.left+r.width/2)-board.left)*450/board.width,
  y:((r.top+r.height/2)-board.top)*800/board.height});
 const device=source.closest('.maglio-device'),moving=source.closest('.maglio-motion');
 const fromRest=point(a),to=point(b);
 // Una misura durante l'affondo o un resize deve ritrovare l'origine a riposo.
 if(device&&moving){
  const fixed=device.getBoundingClientRect(),shifted=moving.getBoundingClientRect();
  fromRest.x-=(shifted.left-fixed.left)*450/board.width;
  fromRest.y-=(shifted.top-fixed.top)*800/board.height;
 }
 const motion=maglioAttackMotion(fromRest,to),from=motion.fireFrom;
 return {from,to,device,motion,angle:Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI};
}
export default function MaglioBattleEffects({shots,nonce}){
 const ref=useRef(null),[paths,setPaths]=useState([]);
 useLayoutEffect(()=>{
  const root=ref.current?.closest('.f3d-approved-layout');
  if(!root)return;
  const movingDevices=new Set();
  const measure=()=>setPaths(shots.filter(s=>s.fires).flatMap(shot=>{
   const geometry=shotGeometry(root,shot);
   if(!geometry)return [];
   const {device,motion,...path}=geometry;
   if(device){
    for(const axis of ['x','y']){
     device.style.setProperty('--maglio-step-'+axis,motion.step[axis]+'px');
     device.style.setProperty('--maglio-recoil-'+axis,motion.recoil[axis]+'px');
    }
    movingDevices.add(device);
   }
   return [{shot,...path}];
  }));
  measure();
  // Misura nuovamente dopo l'appoggio sul tavolo: il punto di emissione
  // non deve restare quello transitorio della comparsa (scala .86).
  const settled=window.setTimeout(measure,460+Math.max(0,...shots.map(s=>s.delayMs||0)));
  const observer=new ResizeObserver(measure);observer.observe(root);
  return ()=>{window.clearTimeout(settled);observer.disconnect();
   for(const device of movingDevices)for(const kind of ['step','recoil'])
    for(const axis of ['x','y'])device.style.removeProperty('--maglio-'+kind+'-'+axis);
  };
 },[shots,nonce]);
 return <svg ref={ref} className="maglio-battle-effects" viewBox="0 0 450 800"
  aria-hidden="true" focusable="false" data-maglio-effects={paths.length}>
  <defs>
   <radialGradient id={'maglio-impact-'+nonce}>
    <stop offset="0" stopColor="#fff9dc"/>
    <stop offset=".2" stopColor="#ffe3a4" stopOpacity=".9"/>
    <stop offset=".5" stopColor="#ffab4b" stopOpacity=".4"/>
    <stop offset="1" stopColor="#c15d1d" stopOpacity="0"/>
   </radialGradient>
  </defs>
  {paths.map(({shot,from,to,angle})=><g key={nonce+'-'+shot.machineId}
   className="maglio-shot" data-shooter={shot.who} data-target-kind={shot.targetKind}
   data-target-id={shot.targetId} data-actual-damage={shot.actualDamage}
   style={{'--maglio-delay':shot.delayMs+'ms'}}>
   <g className="maglio-pulse-travel" style={{'--maglio-from-x':from.x+'px',
    '--maglio-from-y':from.y+'px','--maglio-to-x':to.x+'px','--maglio-to-y':to.y+'px'}}>
    <g transform={'rotate('+angle+')'}>
     <ellipse rx="14" ry="5" fill="#ffb34b" opacity=".25"/>
     <path d="M-22 0H9" stroke="#ffb554" strokeWidth="3" strokeLinecap="round"/>
     <path d="M-12 0H10" stroke="#fff6cf" strokeWidth="1.5"/>
     <ellipse rx="3" ry="9" fill="none" stroke="#ffe8ad" strokeWidth="1.8"/>
     <ellipse cx="-7" rx="2" ry="6" fill="none" stroke="#ffb76b"/>
    </g>
   </g>
   <g transform={'translate('+to.x+' '+to.y+') scale('+maglioVariant(shot.cardId).impactScale+')'}>
    <g className="maglio-gravity-impact">
     <ellipse rx="48" ry="32" fill={'url(#maglio-impact-'+nonce+')'}/>
     <ellipse className="maglio-impact-ring" rx="25" ry="15" fill="none" stroke="#fff0c3" strokeWidth="2"/>
     <ellipse className="maglio-impact-ring maglio-impact-ring--outer" rx="32" ry="19" fill="none" stroke="#ffad48" strokeWidth="1.2"/>
     <path d="M-30-9L-12-3M11 4L32 10M-9 22L-3 8M3-9L8-23M-24 14L-9 5M10-4L27-14"
      stroke="#ffe6b1" strokeWidth="1.4" strokeLinecap="round"/>
    </g>
   </g>
  </g>)}
 </svg>;
}
