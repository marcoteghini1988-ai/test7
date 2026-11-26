import React,{useEffect,useRef} from 'react';
import {cardDisplayFacePath} from './fleetNext/rules.js';
import './CoreThunderCardState.css';
import {appendCardTextLayer} from './cardTextDom.js';

// Le sole copie transitorie sono carte pubbliche già presenti nella partita.
export default function CoreThunderCardState({events,paths,startedAt,expiryAt}){
 const host=useRef(null);
 useEffect(()=>{
  const root=host.current?.closest('.f3d-approved-layout');if(!root)return;
  const timers=[],nodes=new Set(),original=new Map(),textCleanups=new Map();
  const schedule=(at,fn)=>timers.push(setTimeout(fn,Math.max(0,at-(performance.now()-startedAt))));
  for(const event of events){
   const expiry=event.kind==='weapon-core-expired';
   if(!expiry&&!event.coreChargeLost)continue;
   const path=paths.find(p=>p.shot.machineId===event.machineId),at=expiry?expiryAt:Math.max(0,(path?.start||0)-(path?.profile.chargeMs||0));
   schedule(at,()=>{
    const slot=event.who==='A'?root.querySelector(`[data-fleet-weapon-slot="${event.machineSlot}"]`):null;
    if(slot){if(!original.has(slot))original.set(slot,slot.getAttribute('data-core-state'));
     slot.setAttribute('data-core-state',expiry?'expired':'charge-lost');}
    const face=document.createElement('span');face.className='core-card-state '+(expiry?'core-card-expired':'core-card-charge-lost');
    const image=document.createElement('img');image.src=cardDisplayFacePath(event.cardId);image.alt='';image.draggable=false;face.append(image);
    textCleanups.set(face,appendCardTextLayer(face,event.cardId,document));
    face.dataset.owner=event.who;face.dataset.coreEvent=event.kind;face.dataset.cardId=event.cardId;
    if(slot){const a=slot.getBoundingClientRect(),b=root.getBoundingClientRect();
     face.style.left=((a.left-b.left)*450/b.width)+'px';face.style.top=((a.top-b.top)*800/b.height)+'px';}
    else{face.style.left='365px';face.style.top=event.who==='B'?'98px':'660px';}
    root.append(face);nodes.add(face);
    schedule(at+700,()=>{textCleanups.get(face)?.();textCleanups.delete(face);face.remove();nodes.delete(face);if(slot){const old=original.get(slot);old===null?slot.removeAttribute('data-core-state'):slot.setAttribute('data-core-state',old);}});
   });
  }
  return ()=>{timers.forEach(clearTimeout);textCleanups.forEach(cleanup=>cleanup());nodes.forEach(n=>n.remove());for(const [slot,old]of original)old===null?slot.removeAttribute('data-core-state'):slot.setAttribute('data-core-state',old);};
 },[events,paths,startedAt,expiryAt]);
 return <span ref={host} hidden aria-hidden="true"/>;
}
