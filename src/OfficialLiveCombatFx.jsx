import React,{useLayoutEffect,useState} from 'react';
import {RoundGlyph,ImpactGlyph} from './BossBattle3D.jsx';
import {boardPoint} from './mathFleetGeometry.js';
import {
 planWeaponSalvos,projectileFrame,projectileWidth,projectileSourceIndex
} from './mathWeaponEffects.js';

// Riproduzione esclusivamente visiva: danni, scarti e ricompense sono gia'
// stati risolti dal reducer LIVE. Nessun callback grafico modifica la partita.
export default function OfficialLiveCombatFx({event,rootRef,anchors}){
 const [geometry,setGeometry]=useState(null);
 useLayoutEffect(()=>{
  const root=rootRef.current,foe=event.by==='A'?'B':'A';
  if(!root)return;
  const rootBox=root.getBoundingClientRect();
  const coords=node=>node?boardPoint(rootBox,node.getBoundingClientRect()):null;
  if(event.kind==='vital_destroyed'||event.kind==='vital_hit'){
   const fallback=foe==='B'?[225,145]:[225,500];
   setGeometry({target:coords(anchors.current[foe].vitals[event.vitalId])||fallback,shots:[]});
   return;
  }
  const match=/^escort-(\d+)$/.exec(event.shipId||'');
  const escort=match?Number(match[1]):null;
  const sideAnchors=anchors.current[event.by];
  const source=escort==null?sideAnchors.guns[event.weaponId]:sideAnchors.escorts[escort];
  const fallbackStart=event.by==='A'?[225,475]:[225,180];
  const start=coords(source)||fallbackStart;
  if(event.kind==='weapon_charge'){
   setGeometry({start,target:null,shots:[]});
   return;
  }
  const hull=anchors.current[foe].hull;
  const box=hull?.getBoundingClientRect();
  const target=box?boardPoint(rootBox,{...box,left:box.left,width:box.width,
   top:box.top+box.height*(foe==='B'?.76:.24),height:0}):
   (foe==='B'?[225,150]:[225,500]);
  const salvos=planWeaponSalvos([{
   weaponId:event.weaponId,bullets:Math.max(1,Math.min(26,event.bullets||event.card?.value||1)),
   escortSlot:escort
  }]).map(salvo=>({...salvo,rounds:salvo.rounds.map(round=>{
   const second=projectileSourceIndex(salvo.shot,round)===1;
   const from=second?coords(sideAnchors.guns[event.weaponId+'/1'])||start:start;
   const [x,y]=from,dx=target[0]-x,dy=target[1]-y;
   return {...round,x,y,dx,dy,width:projectileWidth(salvo,Math.hypot(dx,dy))};
  })}));
  setGeometry({target,start,shots:salvos});
 },[event,rootRef,anchors]);
 if(!geometry)return null;
 if(event.kind==='weapon_charge')return <div className="live-combat-fx" aria-hidden="true">
  <span className="live-ammo-charge" style={{left:geometry.start[0],top:geometry.start[1]}}>
   <b>{event.card?event.card.value+event.card.suit:'+'}</b>
   <small>{event.charge!=null&&event.threshold?event.charge+'/'+event.threshold:'ARMA IN CARICA'}</small>
  </span>
 </div>;
 if(!geometry.target)return null;
 const [tx,ty]=geometry.target;
 return <div className="live-combat-fx" aria-hidden="true">
  {event.kind==='vital_destroyed'||event.kind==='vital_hit'?
   <div className={'live-vital-fx'+(event.kind==='vital_hit'?' live-vital-fx--partial':'')}
    data-vital={event.vitalId} style={{left:tx-38,top:ty-38}}>
    <i/><i/><i/><strong>{event.kind==='vital_destroyed'?'VITALE KO':'−'+event.damage+' HP'}</strong>
   </div>:
   geometry.shots.map(({fx,rounds,arrivalMs},salvoIndex)=><React.Fragment key={event.weaponId+'-'+salvoIndex}>
    {rounds.map(round=>{
     const frames=[0,.25,.5,.75,1].map(t=>projectileFrame(round.dx,round.dy,round.bend,t));
     const trajectory=Object.fromEntries(frames.flatMap((frame,i)=>[
      [`--x${i}`,frame.x+'px'],[`--y${i}`,frame.y+'px'],[`--a${i}`,frame.angle+'deg']
     ]));
     return <React.Fragment key={round.index}>
      <span className={'weapon-flight round-'+fx.profile} data-weapon={event.weaponId}
       data-round={round.index} style={{left:round.x,top:round.y,...trajectory,
        '--fx-color':fx.color,'--flight-time':fx.durationMs+'ms',
        '--launch-delay':round.launchMs+'ms','--round-width':round.width+'px',
        '--round-height':fx.height+'px'}}>
       <RoundGlyph profile={fx.profile} index={round.index}/>
      </span>
      <span className={'muzzle-flash muzzle-'+fx.profile}
       style={{left:round.x,top:round.y,color:fx.color,
        '--launch-delay':round.launchMs+'ms','--muzzle-angle':frames[0].angle+'deg'}}><i/></span>
     </React.Fragment>;
    })}
    <span className={'weapon-impact impact-'+fx.profile}
     style={{left:tx,top:ty,color:fx.color,'--contact-delay':arrivalMs+'ms'}}>
     <ImpactGlyph profile={fx.profile}/>
    </span>
    {event.damage>0&&<span className="live-fx-damage"
     style={{left:tx,top:ty-34,'--contact-delay':arrivalMs+'ms'}}>−{event.damage}</span>}
   </React.Fragment>)}
 </div>;
}
