import React,{useEffect,useRef} from 'react';
import {card,cardDisplayFacePath} from './fleetNext/rules.js';
import {isTrapCard} from './fleetNext/simpleEffects.js';
import {weaponEffectProfile} from './maglioBattleVisuals.js';
import './WeaponCardInteractions.css';
import {cardTextName} from './cardTextPresentation.js';
import {COMMAND_LANCE_KIND} from './commandLanceSpec.js';
import {STORM_CAPACITOR_KIND,STORM_TIMING,stormContributionPlan} from './stormCapacitorSpec.js';
import {BATCH_KINDS} from './weaponBatchSpec.js';

export default function WeaponCardInteractions({events,paths,startedAt}){
 const host=useRef(null);
 useEffect(()=>{
  const root=host.current?.closest('.f3d-approved-layout');if(!root)return;
  const timers=[],restore=new Map(),contributors=new Set();
  const schedule=(time,fn)=>timers.push(window.setTimeout(fn,Math.max(0,time-(performance.now()-startedAt))));
  const mark=(element,key,value)=>{if(!element)return;const attr='data-weapon-'+key;if(!restore.has(element))restore.set(element,new Map());const old=restore.get(element);if(!old.has(attr))old.set(attr,element.getAttribute(attr));element.setAttribute(attr,value);};
  const slots=[...root.querySelectorAll('[data-fleet-card-slot]')];
  for(const p of paths.filter(p=>p.profile.kind===STORM_CAPACITOR_KIND)){
   const fleet=root.querySelector('[data-fleet-side="'+p.shot.who+'"]');
   for(const step of stormContributionPlan(p.shot,p.start).filter(s=>s.phase==='support')){
    const support=[...(fleet?.querySelectorAll('.live-escort[data-combat-id]')||[])].find(el=>el.dataset.combatId===step.id);
    schedule(step.at,()=>mark(support,'support','storm-capacitor'));
    schedule(step.at+650,()=>mark(support,'support','idle'));
   }
  }
  for(const p of paths.filter(p=>p.profile.kind===COMMAND_LANCE_KIND)){
   const slot=slots.find(s=>s.dataset.fleetCardSlot===p.shot.who+'-0'&&s.dataset.cardId===p.shot.characterCardId);
   const at=Math.max(0,p.start-p.profile.chargeMs);
   schedule(at,()=>mark(slot,'character','command-lance'));
   schedule(at+600,()=>mark(slot,'character','idle'));
  }
  for(const event of events){
   const sourceId=event.sourceWeaponCardId||event.cardId,profile=weaponEffectProfile(sourceId);if(!profile?.approved)continue;
   const matching=paths.filter(p=>p.shot.cardId===sourceId&&p.shot.who===event.who);
   const first=matching[0];if(!first)continue;
   if(event.energyContributions?.length){
    const transfer=event.kind==='weapon-cascade',leg=transfer?matching.find(p=>p.shot.cascadeIndex===event.cascadeIndex):first;
    if(!leg)continue;const at=transfer?leg.start:Math.max(0,first.start-(profile.chargeMs||0)+(profile.kind===STORM_CAPACITOR_KIND?STORM_TIMING.energyAt:profile.kind===BATCH_KINDS.mortar?-300:0));
    const slot=slots.find(s=>s.dataset.fleetCardSlot===event.who+'-5');
    const participating=event.energyContributions.map(c=>c.pileIndex).join(','),cards=event.energyContributions.map(c=>c.cardId).join(',');
    const shown=[];
    const spent=event.energyContributions.some(c=>c.consumed>0),duration=profile.kind==='growing-thunder-core'?880:600;
    schedule(at,()=>{mark(slot,'energy',spent?'spent':'counted');mark(slot,'energy-indices',participating);mark(slot,'energy-cards',cards);mark(slot,'energy-amount',String(event.energyContributions.reduce((n,c)=>n+(c.consumed||1),0)));
     if(!slot)return;
     event.energyContributions.forEach((c,i)=>{
      const art=cardDisplayFacePath(c.cardId);
      const face=document.createElement('span');face.className='weapon-energy-contributor';
      face.dataset.cardId=c.cardId;face.dataset.pileIndex=String(c.pileIndex);face.dataset.discarded=String(c.discarded);
      face.dataset.chargesBefore=String(c.beforeCharges);face.dataset.chargesAfter=String(c.afterCharges);
      face.style.setProperty('--contributor-x',((i-(event.energyContributions.length-1)/2)*9)+'px');
      face.style.setProperty('--contributor-duration',duration+'ms');
      if(art){const image=document.createElement('img');image.src=art;image.alt='';image.draggable=false;face.append(image);}
      else{const label=document.createElement('span');label.className='weapon-energy-native';
       label.dataset.element=card(c.cardId)?.effectSpec?.elementId||'';
       const icon=document.createElement('b');icon.textContent=label.dataset.element==='ionic'?'ϟ':'◆';
       const name=document.createElement('small');name.textContent=cardTextName(card(c.cardId))||c.cardId;
       label.append(icon,name);face.append(label);}
      if(c.consumed&&c.afterCharges>0){const charges=document.createElement('span');charges.className='weapon-energy-charges';charges.textContent=String(c.afterCharges);face.append(charges);}
      slot.append(face);shown.push(face);contributors.add(face);
     });
    });
    schedule(at+duration,()=>{mark(slot,'energy','idle');for(const face of shown){face.remove();contributors.delete(face);}});
   }
   if(!['pierce','block','weapon-break-defense'].includes(event.kind))continue;
   const defender=event.who==='A'?'B':'A',source=event.defenseSource;
   const slot=slots.find(s=>s.dataset.fleetCardSlot.startsWith(defender+'-')&&source&&s.dataset.cardSource===source)||slots.find(s=>s.dataset.fleetCardSlot.startsWith(defender+'-')&&s.dataset.cardId===(event.defenseCardId||event.cardId))||(isTrapCard(card(event.defenseCardId||event.cardId))?slots.find(s=>s.dataset.fleetCardSlot===defender+'-2'):null);
   const phase=event.kind==='pierce'?'bypassed':event.kind==='block'?'protected':'removed';
   const at=event.kind==='weapon-break-defense'?first.start-180:first.start+first.profile.flightMs;
   schedule(at,()=>mark(slot,'defense',phase));schedule(at+800,()=>mark(slot,'defense','idle'));
  }
  return ()=>{timers.forEach(clearTimeout);contributors.forEach(face=>face.remove());for(const [el,attrs]of restore)for(const [key,old]of attrs)old===null?el.removeAttribute(key):el.setAttribute(key,old);};
 },[events,paths,startedAt]);
 return <span ref={host} className="weapon-card-interactions" aria-hidden="true"/>;
}
