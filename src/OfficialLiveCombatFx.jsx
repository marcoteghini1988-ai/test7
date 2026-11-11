import React,{memo,useLayoutEffect,useState} from 'react';
import {RoundGlyph,ImpactGlyph} from './BossBattle3D.jsx';
import {ASSET_ROOT,CARD_SUIT_COLORS} from './ShipPresentation.jsx';
import {rankLabel} from './mathDuelEngine.js';
import {boardPoint} from './mathFleetGeometry.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {officialSpecialCardIdentity} from './officialSpecialCardIdentity.js';
import {TACTICAL_SPECIALS} from './simultaneousDuelEngine.js';
import {planWeaponSalvos,projectileFrame,projectileWidth,projectileSourceIndex} from './mathWeaponEffects.js';
import {LIVE_AMMO_FEED_MS,LIVE_VITAL_BLAST_MS,LIVE_VITAL_SPRITES,
 liveDefenseContact,liveShotContacts} from './officialLiveCombatVisuals.js';
import './OfficialLiveCombatFx.css';

const other=side=>side==='A'?'B':'A';
const at=([left,top])=>({left,top});
const wait=delay=>({'--fx-delay':delay+'ms'});
const VITAL_KO=Object.freeze({
 engine:'MOTORE KO',weapons:'ARMI KO',shieldGenerator:'GENERATORE KO',command:'CENTRALINA KO'
});

function measureFx(root,anchors,event,origin){
 const rootBox=root.getBoundingClientRect();
 const coords=node=>node?boardPoint(rootBox,node.getBoundingClientRect()):null;
 const defensePoint=({owner,escortIndex})=>{
  const unit=anchors[owner];
  if(escortIndex!=null)return coords(unit.escortBodies[escortIndex]);
  const box=unit.hull?.getBoundingClientRect();
  return box?boardPoint(rootBox,{left:box.left,width:box.width,height:0,
   top:box.top+box.height*(owner==='B'?.76:.24)}):null;
 };
 const placeContacts=contacts=>contacts.flatMap(contact=>{
  const target=defensePoint(contact);
  return target?[{...contact,target}]:[];
 });
 const measuredChanges=()=>placeContacts((event.defenseChanges??[]).map(liveDefenseContact));
 const localHand=()=>coords(root.querySelector('.live-number-hand'));
 if(event.slot){
  const key=event.slot==='terrain'?'terrain':(event.owner??event.by)+'-'+event.slot;
  const target=coords(root.querySelector('[data-live-slot="'+key+'"]'));
  return {target,contacts:measuredChanges()};
 }
 if(event.vitalId){
  return {target:coords(anchors[other(event.by)].vitals[event.vitalId]),contacts:measuredChanges()};
 }
 if(event.kind==='bomb_explosion'){
  return {target:defensePoint({owner:event.by,escortIndex:null})};
 }
 if(event.kind==='boss_regen'||event.kind==='character_regen'){
  return {contacts:measuredChanges()};
 }
 if(event.kind==='numeric_discard'){
  return {origin:origin??localHand(),target:coords(root.querySelector('[data-live-drop="discard"]'))};
 }
 const escortMatch=/^escort-(\d+)$/.exec(event.shipId||'');
 const escort=escortMatch?Number(escortMatch[1]):null;
 const side=anchors[event.by];
 const start=coords(escort==null?side.guns[event.weaponId]:side.escorts[escort]);
 if(!start)return null;
 const ammoOrigin=origin??(event.by==='A'?localHand():[start[0],Math.max(32,start[1]-64)]);
 if(event.kind==='weapon_charge')return {origin:ammoOrigin,start};

 const contacts=placeContacts(liveShotContacts(event));
 const [salvo]=planWeaponSalvos([{weaponId:event.weaponId,
  bullets:event.bullets??event.card?.value,escortSlot:escort}]);
 if(!salvo||!contacts.length)return {origin:ammoOrigin,start};
 const [primary,...alternates]=contacts;
 const secondMuzzle=coords(side.guns[event.weaponId+'/1']);
 const rounds=salvo.rounds.map(round=>{
  const contact=round.index<salvo.rounds.length-1?(alternates[round.index]??primary):primary;
  const muzzle=projectileSourceIndex(salvo.shot,round)===1?(secondMuzzle??start):start;
  const dx=contact.target[0]-muzzle[0],dy=contact.target[1]-muzzle[1];
  const frames=[0,.25,.5,.75,1].map(t=>projectileFrame(dx,dy,round.bend,t));
  const trajectory=Object.fromEntries(frames.flatMap((frame,i)=>[
   ['--x'+i,frame.x+'px'],['--y'+i,frame.y+'px'],['--a'+i,frame.angle+'deg']
  ]));
  return {...round,contact,muzzle,trajectory,angle:frames[0].angle,
   width:projectileWidth(salvo,Math.hypot(dx,dy)),
   launch:round.launchMs+LIVE_AMMO_FEED_MS,arrival:round.arrivalMs+LIVE_AMMO_FEED_MS};
 });
 const hits=contacts.map(contact=>{
  const arrivals=rounds.filter(round=>round.contact===contact);
  return {...contact,first:arrivals[0]?.arrival??rounds[0].arrival,
   last:arrivals.at(-1)?.arrival??rounds.at(-1).arrival};
 });
 return {origin:ammoOrigin,start,rounds,hits,fx:salvo.fx};
}

function Sprite({name}){
 return <img className="live-fx-sprite" data-sprite={name}
  src={ASSET_ROOT+'/battle-fx/'+name+'.png'} alt="" draggable={false} decoding="async"/>;
}
function AmmoFeed({card,origin,target,discard=false}){
 if(!card||!origin||!target)return null;
 const dx=target[0]-origin[0],dy=target[1]-origin[1];
 const mid=projectileFrame(dx,dy,discard?8:24,.55);
 return <span className="live-ammo-feed" data-discard={discard||undefined}
  style={{...at(origin),'--ammo-tone':CARD_SUIT_COLORS[card.suit]??'#bcf5ff',
   '--feed-time':LIVE_AMMO_FEED_MS+'ms','--dx':dx+'px','--dy':dy+'px',
   '--mx':mid.x+'px','--my':mid.y+'px'}}>
  {!discard&&<Sprite name="charge"/>}
  <b>{rankLabel(card.value)}<i>{card.suit}</i></b>
 </span>;
}
function ChargeFx({event,geometry}){
 const pending=event.kind==='weapon_charge';
 const count=event.threshold!=null?event.charge+'/'+event.threshold:
  event.needed?.length?event.suits.length+'/'+event.needed.length:null;
 return <>
  <AmmoFeed card={event.card} origin={geometry.origin} target={geometry.start}/>
  <div className="live-charge-burst" style={{...at(geometry.start),...wait(LIVE_AMMO_FEED_MS-45),
   '--ammo-tone':CARD_SUIT_COLORS[event.card?.suit]??'#9beaff'}}>
   <Sprite name="charge"/>
  </div>
  {pending&&<span className="live-charge-meter"
   style={{...at(geometry.start),...wait(LIVE_AMMO_FEED_MS)}}>{count?'CARICA '+count:'IN CARICA'}</span>}
 </>;
}
function ContactFx({contact,fx}){
 const {kind,delta,target,first=0,last=first}=contact;
 const broken=kind.endsWith('-break'),repaired=delta>0;
 const sprite=kind==='shield-break'?'shield-fracture':kind==='escort-break'?'vital-engine':
  kind==='shield-empty'||repaired?'charge':'shield-contact';
 const label=delta>0?'+'+delta:delta<0?'−'+Math.abs(delta):
  kind==='shield-guard'?'ASSORBITO':null;
 return <>
  {fx&&kind!=='shield-empty'&&<span className={'weapon-impact impact-'+fx.profile}
   style={{...at(target),color:fx.color,'--contact-delay':first+'ms'}}>
   <ImpactGlyph profile={fx.profile}/>
  </span>}
  <div className="live-contact-sprite" data-contact={kind} data-owner={contact.owner}
   style={{...at(target),...wait(broken?last:first)}}>
   <Sprite name={sprite}/>
  </div>
  {label&&<span className="live-fx-tag" data-tone={repaired?'repair':broken?'break':'hit'}
   style={{left:target[0],top:target[1]-22,...wait(last+40)}}>
   {label}{broken&&<small>{kind==='shield-break'?'BARRIERA KO':'SCUDIERA KO'}</small>}
  </span>}
 </>;
}
function ShotFx({event,geometry}){
 const {fx,rounds=[],hits=[]}=geometry;
 return <>
  <ChargeFx event={event} geometry={geometry}/>
  {rounds.map(round=><React.Fragment key={round.index}>
   <span className={'weapon-flight round-'+fx.profile} data-weapon={event.weaponId} data-round={round.index}
    style={{...at(round.muzzle),...round.trajectory,
     '--fx-color':fx.color,'--flight-time':fx.durationMs+'ms','--launch-delay':round.launch+'ms',
     '--round-width':round.width+'px','--round-height':fx.height+'px'}}>
    <RoundGlyph profile={fx.profile} index={round.index}/>
   </span>
   <span className={'muzzle-flash muzzle-'+fx.profile}
    style={{...at(round.muzzle),color:fx.color,'--launch-delay':round.launch+'ms',
     '--muzzle-angle':round.angle+'deg'}}><i/></span>
  </React.Fragment>)}
  {hits.map(hit=><ContactFx key={hit.escortIndex??'shield'} contact={hit} fx={fx}/>)}
 </>;
}
function VitalFx({event,target}){
 const {kind,vitalId}=event;
 if(kind==='vital_exposed'||kind==='vital_card'){
  const progress=kind==='vital_card';
  return <div className="live-vital-marker" style={at(target)} data-vital={vitalId}>
   <span>{progress?rankLabel(event.card.value)+event.card.suit+' · '+event.count+'/'+event.slotCount:'ESPOSTO'}</span>
  </div>;
 }
 const broken=kind==='vital_destroyed';
 return <>
  <div className="live-vital-blast" data-vital={vitalId} data-destroyed={broken}
   style={{...at(target),'--blast-time':LIVE_VITAL_BLAST_MS+'ms'}}>
   {event.shieldCollapsed&&<Sprite name="shield-fracture"/>}
   <Sprite name={broken?LIVE_VITAL_SPRITES[vitalId]:'shield-contact'}/>
  </div>
  <span className="live-fx-tag" data-tone={broken?'break':'hit'}
   style={{left:target[0],top:target[1]-21,...wait(110)}}>
   {broken?VITAL_KO[vitalId]:'−'+event.damage+' HP'}
  </span>
 </>;
}
function BombFx({event,target}){
 return <>
  <div className="live-vital-blast" style={{...at(target),'--blast-time':'790ms'}}>
   {event.shieldBefore>0&&event.shieldAfter===0&&<Sprite name="shield-fracture"/>}
   <Sprite name="vital-engine"/>
  </div>
  <span className="live-fx-tag" data-tone="break"
   style={{left:target[0],top:target[1]-20,...wait(110)}}>
   NUMERO BOMBA{event.damage>0&&<small>−{event.damage} BARRIERA</small>}
  </span>
 </>;
}
function SlotFx({event,target,delay}){
 const placed=event.kind==='trap_placed',revealed=event.kind==='trap';
 const face=placed?{category:'REAZIONE'}:officialSpecialCardIdentity(event.type,TACTICAL_SPECIALS[event.type]);
 const art=revealed?officialSpecialArtPath(event.type):null;
 return <div className="live-slot-pulse" data-family={face.category} data-event={event.kind}
   style={{...at(target),...wait(delay)}}>
   {(revealed||event.kind==='terrain')&&<Sprite name="trap-wave"/>}
   {revealed&&<span className="live-trap-flip">
    <span className="live-trap-back">◇</span>
    <span className="live-trap-front">{art?<img src={art} alt="" draggable={false}/>:face.symbol}</span>
   </span>}
   {!placed&&!revealed&&<b className="live-slot-signal">{face.symbol}</b>}
  </div>;
}

// L'evento e la posizione si fissano al primo frame, anche se un'altra
// azione clona il registro mentre i proiettili sono ancora in volo.
export default memo(function OfficialLiveCombatFx({event:resolvedEvent,delay,origin,rootRef,anchors}){
 const [event]=useState(()=>resolvedEvent);
 const [initialOrigin]=useState(()=>origin);
 const [geometry,setGeometry]=useState(null);
 useLayoutEffect(()=>{
  if(rootRef.current)setGeometry(measureFx(rootRef.current,anchors.current,event,initialOrigin));
 },[event,initialOrigin,rootRef,anchors]);
 if(!geometry)return null;
 return <div className="live-combat-fx" data-live-fx={event.kind} aria-hidden="true">
  {event.kind==='shot'&&<ShotFx event={event} geometry={geometry}/>}
  {event.kind==='weapon_charge'&&<ChargeFx event={event} geometry={geometry}/>}
  {geometry.target&&<>
   {event.slot&&<SlotFx event={event} target={geometry.target} delay={delay}/>}
   {event.vitalId&&<VitalFx event={event} target={geometry.target}/>}
   {event.kind==='bomb_explosion'&&<BombFx event={event} target={geometry.target}/>}
   {event.kind==='numeric_discard'&&<AmmoFeed card={event.card}
    origin={geometry.origin} target={geometry.target} discard/>}
  </>}
  {geometry.contacts?.map(contact=><ContactFx key={contact.owner+'/'+contact.escortIndex}
   contact={{...contact,first:220}}/>)}
 </div>;
});
