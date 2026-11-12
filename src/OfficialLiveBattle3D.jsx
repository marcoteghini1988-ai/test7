import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ASSET_ROOT,CARD_SUIT_COLORS,MountedWeapons} from './ShipPresentation.jsx';
import {newVessel,rankLabel} from './mathDuelEngine.js';
import {boardPoint} from './mathFleetGeometry.js';
import ShipPhysicalVitals from './ShipPhysicalVitals.jsx';
import {VITAL_IDS,VITAL_LABELS,remainingExposureSlots} from './vitalDefense.js';
import {visibleTacticalSignature} from './tacticalIntelVisibility.js';
import {tacticalSignatureSlotCount,tacticalSignatureLabel} from './tacticalShipSignatures.js';
import {TACTICAL_SPECIALS} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,advanceOfficialLiveDuel,
 chooseOfficialLiveAiAction,supportedLiveSpecial,liveCompatibleShips,
 LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT} from './officialLiveDuelEngine.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {readShipCollection} from './shipCollection.js';
import {readSpecialCollection} from './specialDeckBuilder.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {readLegacyEpicProgress} from './officialEpicOwnership.js';
import {readLegacyModuleLevels,TACTICAL_MODULE_CARDS,isModuleCard} from './tacticalEquipmentCards.js';
import {bossCharacterDefinition,isBossCharacterCard} from './bossCharacterCards.js';
import {pvpTerrainDefinition,isPvpTerrain} from './pvpTerrainCards.js';
import {officialSpecialCardIdentity} from './officialSpecialCardIdentity.js';
import {officialSpecialVisualMeta} from './officialSpecialVisualMeta.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {officialNumericDeckStackPath,officialNumericDeckBackName,OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import BossCharacterPortrait from './BossCharacterPortrait.jsx';
import PvpTerrainPortrait from './PvpTerrainPortrait.jsx';
import {MALUS_CHOICES} from './tacticalLegacyEvents.js';
import OfficialLiveCombatFx from './OfficialLiveCombatFx.jsx';
import {LIVE_AMMO_FEED_MS,LIVE_FX_SPRITES,LIVE_VITAL_BLAST_MS,liveCombatCues,
 liveMountedWeaponEffect} from './officialLiveCombatVisuals.js';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';
import './OfficialLiveBattle3D.css';

const TARGETED_SPECIALS=new Set(['tactic-bomb','tactic-golden','tactic-malus',
 'tactic-signature-mutation','tactic-numeric-recycle','tactic-counter']);
const pct=(a,b)=>b>0?Math.max(0,Math.min(100,Math.round(a/b*100))):0;
const other=k=>k==='A'?'B':'A';
function startSession(options){
 try{
  const ships=readShipCollection(),specials=readSpecialCollection();
  const old=readLegacyEpicProgress();
  const setup=officialBattleSetup({...options,shipCollection:ships,specialCollection:specials,
   pilotLevel:old.pilotLevel,epicRiftOpened:old.hasCollapsed,
   moduleLevels:readLegacyModuleLevels(),seed:Math.floor(Math.random()*0x7fffffff)+1,nowMs:Date.now()});
  return {battle:createOfficialLiveDuel(setup.battle,Date.now()),bossEncounter:setup.bossEncounter,error:''};
 }catch(e){return {battle:null,bossEncounter:null,error:e?.message||'Duello non disponibile'};}
}
function Fighter({side,snapshot,onVital,onShip,anchors,weaponEffect}){
 const player=side==='player';
 const key=player?'A':'B';
 const anchorSide=()=>anchors?.current?.[key];
 const vessel=useMemo(()=>newVessel(snapshot.shipId,snapshot.level),[snapshot.shipId,snapshot.level]);
 const active=snapshot.escorts.filter(e=>e.hp>0);
 const visual={...vessel,defense:snapshot.defense,weapons:vessel.weapons.map(weapon=>{
  const stored=snapshot.liveWeaponCharges?.[weapon.id]?.values;
  return stored?{...weapon,charge:stored.reduce((sum,value)=>sum+value,0)}:weapon;
 })};
 return <div className={'live-fighter live-fighter--'+side} data-live-drop={player?'ship':''}
  onClick={player?e=>onShip?.(e.target.closest('[data-live-drop]')?.dataset.liveDrop??'ship'):undefined}
  role={player?'button':undefined}
  tabIndex={player?0:undefined} aria-label={player?'Carica la navicella selezionata':undefined}
  onKeyDown={player?e=>{
   if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){
    e.preventDefault();onShip?.('ship');
   }
  }:undefined}>
  <div className="fleet-ship-wrap complete-ship focused official-mother"
   data-vital-weapons={snapshot.defense.parts.weapons.hp<=0?'destroyed':'healthy'}
   style={{left:'50%',top:0,width:316,height:206,zIndex:3}}>
   <ShipPhysicalVitals side={side} vessel={visual} defense={snapshot.defense}
    canTarget={!player} onSelectVital={onVital} knownVitals={[]}
    hullRef={node=>{const refs=anchorSide();if(refs)refs.hull=node;}}
    registerVitalRef={(id,node)=>{const refs=anchorSide()?.vitals;if(!refs)return;
     if(node)refs[id]=node;else delete refs[id];}}/>
   <MountedWeapons side={side} vessel={visual} index={0} effect={weaponEffect}
    registerGunRef={(_,__,id,node)=>{const refs=anchorSide()?.guns;if(!refs)return;
     if(node)refs[id]=node;else delete refs[id];}}/>
  </div>
  {snapshot.escorts.map((escort,i)=><div key={escort.id}
   className={'live-escort live-escort--'+i+(escort.hp===0?' live-escort--lost':'')}
   data-live-drop={player?'escort-'+i:undefined}
   ref={node=>{const refs=anchorSide()?.escortBodies;if(!refs)return;
    if(node)refs[i]=node;else delete refs[i];}}
   aria-label={'Scudiera '+(i+1)+' · '+escort.hp+' HP'}>
   <i className={'live-escort-muzzle live-escort-muzzle--'+side}
    ref={node=>{const refs=anchorSide()?.escorts;if(!refs)return;
     if(node)refs[i]=node;else delete refs[i];}}/>
   <img src={ASSET_ROOT+'/escorts/'+snapshot.shipId+'_escort_'+(i+1)+'.svg'}
    alt={'Scudiera '+(i+1)} draggable={false}/>
  </div>)}
  <span className="live-fleet-caption">{snapshot.name+' · '+active.length+' scudiere'}</span>
 </div>;
}
function FleetBar({keySide,side,nickname}){
 const motherVital=VITAL_IDS.filter(id=>side.defense.parts[id].hp>0).length;
 const statuses=[
  side.ionized&&['ion','ϟ','IONICO'],side.corroded&&['corrosion','☣','CORROSIONE'],
  side.heated&&['heat','♨','USTIONE'],side.liveRift&&['rift','◇','FAGLIA']
 ].filter(Boolean);
 const units=[...side.escorts.slice(0,1).map(e=>({kind:'escort',hp:e.hp,max:e.max})),
  {kind:'mother',hp:motherVital,max:4,shield:side.defense.shield},
  ...side.escorts.slice(1,2).map(e=>({kind:'escort',hp:e.hp,max:e.max}))];
 return <div className={'live-fleet-bar live-fleet-bar--'+keySide}>
  <strong>{keySide==='A'?(nickname||'TU'):'AVVERSARIO'}</strong>
  <div className="live-units">{units.map((unit,i)=><div key={unit.kind+'-'+i}
   className={'live-unit '+(unit.kind==='mother'?'live-unit--mother':'')}>
   <span>{unit.kind==='mother'?'MADRE':'SCORTA'}</span>
   <i className="live-unit-health"><b style={{width:pct(unit.hp,unit.max)+'%'}}/></i>
   <i className="live-unit-shield"><b style={{width:unit.shield?pct(unit.shield.hp,unit.shield.max)+'%':pct(unit.hp,unit.max)+'%'}}/></i>
  </div>)}</div>
  {!!statuses.length&&<div className={'live-status-strip live-status-strip--'+keySide}
   aria-label={'Effetti attivi: '+statuses.map(x=>x[2]).join(', ')}>
   {statuses.map(([tone,symbol,label])=><span key={tone} data-tone={tone} title={label}>
    <b>{symbol}</b>{label}</span>)}
  </div>}
 </div>;
}
function Slot({kind,index,side,card,onActivate,selected}){
 const isTrap=kind==='trap';
 const visible=!!card&&(side==='A'||!isTrap);
 const symbol=kind==='character'?'♙':kind==='trap'?'◇':'✧';
 // Sono gli slot EFFETTIVI del motore, non quattro nuovi slot fissi:
 // la Trappola ospita reazioni/difese, l'Aperto anche supporti e attacchi.
 const label=kind==='character'?'Personaggio':
  isTrap?'Difesa / Reazione (Trappola)':'Attacco / Supporto (Speciale aperta)';
 const slotBadge=kind==='character'?'PERSONAGGIO':isTrap?'DIFESA':'ATT./SUP.';
 const slot=kind==='character'?'character':kind+'-'+index;
 const face=visible?officialSpecialCardIdentity(card.type,TACTICAL_SPECIALS[card.type]):null;
 const visual=visible?officialSpecialVisualMeta(card.type):null;
 return <button type="button" className={'live-slot'+(side==='B'?' live-slot--enemy':'')+
   (card?' live-slot--occupied':'')+(card&&!visible?' live-slot--covered':'')+
   (selected?' live-slot--chosen':'')}
  data-live-slot={side+'-'+slot} data-live-drop={side==='A'?slot:undefined}
  data-slot-role={kind==='character'?'personaggio':isTrap?'difesa':'attacco-supporto'}
  data-family={visual?.role??face?.category}
  data-rarity={visual?.rarity??undefined}
  title={face?face.name+' · '+(visual?.role??face.category)+
   (visual?.rarity?' · '+visual.rarity:'')+' · '+face.effect:label}
  aria-label={label+(card?' · '+(face?.name??'coperta'):' · vuoto')}
  onClick={onActivate}>
  {visible&&(officialSpecialArtPath(card?.type)||
    (isBossCharacterCard(card?.type)?bossCharacterDefinition(card.type)?.imagePath:null)||
    (isPvpTerrain(card?.type)?pvpTerrainDefinition(card.type)?.imagePath:null))?
    <img className="live-slot-art" src={officialSpecialArtPath(card?.type)||
     (isBossCharacterCard(card?.type)?bossCharacterDefinition(card.type)?.imagePath:
      pvpTerrainDefinition(card.type)?.imagePath)} alt="" draggable={false}/>:
    <span>{face?.symbol??(card?'?':symbol)}</span>}
  {!card&&<small className="live-slot-role" aria-hidden="true">{slotBadge}</small>}
  {face&&<small className="live-slot-caption" aria-hidden="true">{visual?.role??face.category}</small>}
  {face&&visual?.rarity&&<small className="live-slot-tier" aria-hidden="true">{visual.rarity}</small>}
 </button>;
}
function LiveSpecialArt({card}){
 const identity=officialSpecialCardIdentity(card?.type,TACTICAL_SPECIALS[card?.type]);
 return <>{isBossCharacterCard(card?.type)?<BossCharacterPortrait type={card.type}/>:
  isPvpTerrain(card?.type)?<PvpTerrainPortrait type={card.type}/>:
  officialSpecialArtPath(card?.type)?<img src={officialSpecialArtPath(card.type)} alt="" draggable={false}/>:
  <span className="live-special-art">{identity.symbol}</span>}</>;
}
export default function OfficialLiveBattle3D({
 nickname,gameMode='campaign',sectorNumber=1,displaySector='',
 bossPlanetId=null,bossSectorLevel=null,selectedBossDeck,bossDeckInventory,
 selectedPilot,pilotInventory,onResult,onExit
}){
 const options={mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel,
  selectedBossDeck,bossDeckInventory,selectedPilot,pilotInventory};
 const [session,setSession]=useState(()=>startSession(options));
 const [battle,setBattle]=useState(session.battle);
 const [now,setNow]=useState(Date.now);
 const [selection,setSelection]=useState(null),[vital,setVital]=useState(null);
 const [specialChoice,setSpecialChoice]=useState(null);
 const [recycleChoice,setRecycleChoice]=useState([]);
 const [message,setMessage]=useState(''),[details,setDetails]=useState(false);
 const [busy,setBusy]=useState(false);
 const rootRef=useRef(null);
 const numericCards=useRef(new Map()),numericOrigins=useRef(new Map());
 const anchors=useRef({
  A:{hull:null,guns:{},vitals:{},escorts:{},escortBodies:{}},
  B:{hull:null,guns:{},vitals:{},escorts:{},escortBodies:{}}
 });
 const claimed=useRef(false);
 const [scale,setScale]=useState(1);
 const myTurn=battle?.phase==='playing'&&battle.activeSide==='A';
 const chosen=myTurn&&selection?.turn===battle.turn?selection:null;
 useEffect(()=>{
  if(battle?.phase!=='playing'||battle?.activeSide!=='A'){
   setSpecialChoice(null);setRecycleChoice([]);
  }
 },[battle?.activeSide,battle?.phase]);
 useEffect(()=>{
  const resize=()=>setScale(Math.max(.3,Math.min(innerWidth/450,innerHeight/800)));
  resize();window.addEventListener('resize',resize);
  return ()=>window.removeEventListener('resize',resize);
 },[]);
 useEffect(()=>{
  for(const sprite of LIVE_FX_SPRITES)new Image().src=ASSET_ROOT+'/battle-fx/'+sprite+'.png';
 },[]);
 useEffect(()=>{
  const t=setInterval(()=>{
   const time=Date.now();setNow(time);
   setBattle(old=>{
    if(!old)return old;
    let next=advanceOfficialLiveDuel(old,time);
    if(next.phase==='playing'&&next.activeSide==='B'&&time>=next.aiReadyAtMs){
     const act=chooseOfficialLiveAiAction(next);
     if(act){
      const result=applyOfficialLiveAction(next,'B',act,Math.min(time,next.deadlineMs-1));
      if(result.ok)next={...result.battle,aiReadyAtMs:time+800};
      else next={...next,aiReadyAtMs:time+800};
     }
    }
    return next;
   });
  },150);
  return ()=>clearInterval(t);
 },[]);
 function restart(){
  const next=startSession(options);
  numericOrigins.current.clear();
  claimed.current=false;setSession(next);setBattle(next.battle);
  setSelection(null);setVital(null);setSpecialChoice(null);setRecycleChoice([]);setMessage('');setDetails(false);
 }
 function action(intent){
  if(!battle)return;
  const result=applyOfficialLiveAction(battle,'A',intent,Date.now());
  if(!result.ok){setMessage('Azione non valida: '+result.reason.replaceAll('_',' '));return false;}
  if((intent.type==='numeric'&&intent.target==='ship')||intent.type==='numeric-discard'){
   const card=battle.sides.A.numeric.hand[intent.index];
   const node=numericCards.current.get(card?.id);
   const index=result.battle.history.findLastIndex(event=>event.card?.id===card?.id&&
    ['shot','weapon_charge','numeric_discard'].includes(event.kind));
   if(node&&rootRef.current&&index>=battle.history.length){
    const origin=boardPoint(rootRef.current.getBoundingClientRect(),node.getBoundingClientRect());
    numericOrigins.current.set(index,origin);
    if(numericOrigins.current.size>16)
     numericOrigins.current.delete(numericOrigins.current.keys().next().value);
   }
  }
  setBattle(result.battle);setMessage('');
  setSelection(null);
  return true;
 }
 function selectCard(kind,id,canPlay=true){
  const turn=canPlay?battle.turn:null;
  setSelection(old=>old?.kind===kind&&old.id===id&&old.turn===turn?null:{kind,id,turn});
 }
 function playSpecialAt(index,slot){
  if(!myTurn||battle.actionUsed.special>=LIVE_SPECIAL_LIMIT)return;
  const card=battle?.sides.A.special.hand[index];
  if(!card||!supportedLiveSpecial(card.type))return;
  const moduleEffect=isModuleCard(card.type)?TACTICAL_MODULE_CARDS[card.type].effect:null;
  if(TARGETED_SPECIALS.has(card.type)||moduleEffect==='free_swap'||moduleEffect==='refill'){
   setSpecialChoice({type:card.type,cardId:card.id,slot});
   setRecycleChoice([]);setMessage('');
   return;
  }
  action({type:'special',index,slot});
 }
 function completeSpecialChoice(choice){
  if(!specialChoice||!battle)return;
  if(specialChoice.type==='boss-recycle'){
   const ok=action({type:'boss-recycle',...choice});
   if(ok){setSpecialChoice(null);setRecycleChoice([]);}
   return;
  }
  const index=battle.sides.A.special.hand.findIndex(c=>c.id===specialChoice.cardId);
  if(index<0){setSpecialChoice(null);return;}
  const ok=action({type:'special',index,slot:specialChoice.slot,...choice});
  if(ok){setSpecialChoice(null);setRecycleChoice([]);}
 }
 function useSelected(target,extra={}){
  if(!chosen||!battle||battle.activeSide!=='A')return;
  const me=battle.sides.A;
  const cards=chosen.kind==='numeric'?me.numeric.hand:me.special.hand;
  const index=cards.findIndex(c=>c.id===chosen.id);
  if(index<0)return setSelection(null);
  if(chosen.kind==='numeric'){
   if(target==='discard')action({type:'numeric-discard',index});
   else if(target==='ship'||target.startsWith('escort-'))
    action({type:'numeric',index,target:'ship',shipId:target==='ship'?'mother':target});
   else if(target==='vital'&&vital)
    action({type:'numeric',index,target:'vital',vitalId:vital});
  }else{
   playSpecialAt(index,target);
  }
 }
 function touchRelease(e,kind,id){
  const touch=e.changedTouches?.[0];if(!touch)return;
  const element=document.elementFromPoint(touch.clientX,touch.clientY);
  const target=element?.closest('[data-live-drop]')?.getAttribute('data-live-drop');
  if(!target)return;
  const hand=kind==='numeric'?battle?.sides.A.numeric.hand:battle?.sides.A.special.hand;
  const index=hand?.findIndex(c=>c.id===id);
  if(index==null||index<0)return;
  if(kind==='numeric'){
   if(target==='discard')action({type:'numeric-discard',index});
   else if(target==='ship'||target.startsWith('escort-'))
    action({type:'numeric',index,target:'ship',shipId:target==='ship'?'mother':target});
   else if(target==='vital'&&vital)action({type:'numeric',index,target:'vital',vitalId:vital});
  }else playSpecialAt(index,target);
 }
 async function leave(){
  if(busy)return;
  if(battle?.phase!=='finished'){
   if(window.confirm('Abbandonare la battaglia senza ricompense?'))onExit?.();
   return;
  }
  if(claimed.current)return;claimed.current=true;setBusy(true);
  try{
   const result=officialBattleResult(battle,gameMode,sectorNumber);
   if(result.eligibleForRewards){
    try{
     await claimOfficialLiveVictoryRewards({
      winner:result.winner,mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel
     });
    }catch(error){
     // Non abbandonare la battaglia dichiarando un premio salvato quando
     // il dispositivo ha rifiutato una scrittura. Premi gia' registrati
     // non saranno duplicati: il pulsante consente di riprovare.
     claimed.current=false;
     setMessage('Premi non salvati completamente: '+
      (error?.message||'errore del dispositivo')+
      '. Controlla lo spazio disponibile e riprova con il pulsante di uscita.');
     return;
    }
   }
   if(gameMode!=='pvp')onResult?.(result.winner,result.meta);
   onExit?.();
  }finally{setBusy(false);}
 }
 if(!battle)return <main className="official-start-error">
  <h2>ECLISSI STELLARE</h2><p role="alert">{session.error}</p>
  <button onClick={restart}>RIPROVA</button><button onClick={()=>onExit?.()}>TORNA AL MENU</button>
 </main>;
 const player=battle.sides.A,enemy=battle.sides.B;
 const seconds=Math.max(0,Math.ceil((battle.deadlineMs-now)/1000));
 const terrain=battle.activeTerrain?pvpTerrainDefinition(battle.activeTerrain.id):null;
 const targeted=vital&&enemy.defense.parts[vital];
 const exposed=targeted?.exposed||!!player.liveRift;
 const activeSlots=VITAL_IDS.filter(id=>enemy.defense.parts[id].hp>0&&enemy.defense.parts[id].exposed);
 const canExpose=remainingExposureSlots(enemy.defense)>0;
 const cannotAct=!myTurn||battle.phase==='finished';
 const last=battle.history.at(-1);
 const visualEvents=liveCombatCues(battle.history,now);
 const choiceCard=specialChoice?.type==='boss-recycle'?{type:'boss-recycle'}:
  specialChoice?player.special.hand.find(c=>c.id===specialChoice.cardId):null;
 const epicChoiceReady=myTurn&&['epic_item_1','epic_item_3'].includes(player.epic?.active?.id)&&
  !player.epic.liveChoiceCommitted&&player.epic.peek?.length>0;
 const epicRecycleReady=myTurn&&(player.epic?.exchangeCredits||0)>0&&
  battle.round<=(player.epic.exchangeUntilRound||0);
 const moduleChoiceEffect=isModuleCard(specialChoice?.type)?
  TACTICAL_MODULE_CARDS[specialChoice.type].effect:null;
 const recycleMax=moduleChoiceEffect==='free_swap'?1:2;
 const hiddenMutation=vital&&battle.liveLegacy?.mutations?.B?.vitalId===vital;
 const selectedSpecial=selection?.kind==='special'?
  player.special.hand.find(card=>card.id===selection.id):null;
 const selectedSpecialFace=selectedSpecial?
  officialSpecialCardIdentity(selectedSpecial.type,TACTICAL_SPECIALS[selectedSpecial.type]):null;
 const selectedSpecialVisual=selectedSpecial?officialSpecialVisualMeta(selectedSpecial.type):null;
 // E' l'ID DAVVERO equipaggiato e validato dal setup: nessun mazzo finto.
 const numericBackId=player.bossNumericDeck?.id??'neutral_starter';
 const numericStackPath=officialNumericDeckStackPath(numericBackId);
 const numericBackName=officialNumericDeckBackName(numericBackId);
 const result=battle.phase==='finished'?officialBattleResult(battle,gameMode,sectorNumber):null;
 const finalImpactVisible=result&&visualEvents.some(({event})=>
  event.kind==='vital_destroyed'&&now-event.atMs<LIVE_VITAL_BLAST_MS+50);
 const specialPreviewNote=selectedSpecial&&!supportedLiveSpecial(selectedSpecial.type)?
  'Questa carta non è ancora giocabile nel duello LIVE.':!myTurn?
  'Puoi giocarla al tuo turno.':battle.actionUsed.special>=LIVE_SPECIAL_LIMIT?
  'Hai già usato le speciali di questo turno.':null;
 return <div className="es-math-scope live-viewport">
  <div ref={rootRef} className="es-root official-duel-3d live-root"
   onDragOver={e=>{if(e.target.closest('[data-live-drop]'))e.preventDefault();}}
   onDrop={e=>{
    const slot=e.target.closest('[data-live-drop]')?.getAttribute('data-live-drop');
    if(!slot)return;
    e.preventDefault();
    const [kind,id]=e.dataTransfer.getData('text/plain').split(':');
    const pile=kind==='numeric'?battle.sides.A.numeric.hand:
     kind==='special'?battle.sides.A.special.hand:[];
    const index=pile.findIndex(c=>c.id===id);
    if(index<0)return;
    if(kind==='numeric'&&slot==='discard')
     action({type:'numeric-discard',index});
    else if(kind==='numeric'&&(slot==='ship'||slot.startsWith('escort-')))
     action({type:'numeric',index,target:'ship',shipId:slot==='ship'?'mother':slot});
    else if(kind==='numeric'&&slot==='vital'&&vital)
     action({type:'numeric',index,target:'vital',vitalId:vital});
    else if(kind==='special')playSpecialAt(index,slot);
   }}
   style={{transform:'translate(-50%,-50%) scale('+scale+')',
    '--live-feed-delay':LIVE_AMMO_FEED_MS+'ms',
    '--live-special-back':`url("${OFFICIAL_SPECIAL_FIXED_BACK}")`}}>
   <div className="space-back metal-arena live-background" aria-hidden="true"
    style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
   {terrain&&<div key={terrain.id} className="live-terrain-scene" data-terrain={terrain.id}
    aria-hidden="true" style={{backgroundImage:'url('+terrain.imagePath+')'}}/>}
   <FleetBar keySide="B" side={enemy}/>
   <Fighter side="enemy" snapshot={enemy} anchors={anchors}
    weaponEffect={liveMountedWeaponEffect(visualEvents,'B')} onVital={id=>{
    if(!myTurn)return;
    setVital(id);
    const part=enemy.defense.parts[id];
    if(part.hp>0&&!part.exposed&&!player.liveRift)action({type:'expose',vitalId:id});
   }}/>
   <div className="live-slot-row live-slot-row--enemy">
    <Slot side="B" kind="character" card={battle.zones.B.character}/>
    {battle.zones.B.traps.map((c,i)=><Slot key={i} side="B" kind="trap" index={i} card={c}/>)}
    {battle.zones.B.open.map((c,i)=><Slot key={i} side="B" kind="open" index={i} card={c}/>)}
   </div>
   <div className="live-midline">
    <span className="live-turn-indicator" data-active={battle.activeSide}>
     {battle.phase==='finished'?'FINE PARTITA':battle.activeSide==='A'?'TUO TURNO':'TURNO AVVERSARIO'} · {seconds}s
    </span>
    <button className="live-terrain-slot" type="button" disabled={cannotAct}
     data-live-slot="terrain" data-live-drop="terrain" data-terrain={terrain?.id} onClick={()=>useSelected('terrain')}
     style={terrain?{'--live-terrain-art':'url('+terrain.imagePath+')'}:undefined}
     aria-label={'Terreno centrale'+(terrain?' · '+terrain.name:' · neutro')}>
     {terrain?terrain.short:'TERRENO'}
    </button>
   </div>
   <div className="live-slot-row live-slot-row--player">
    <Slot side="A" kind="character" card={battle.zones.A.character}
     onActivate={()=>useSelected('character')}/>
    {battle.zones.A.traps.map((c,i)=><Slot key={i} side="A" kind="trap" index={i}
     card={c} onActivate={()=>useSelected('trap-'+i)}/>)}
    {battle.zones.A.open.map((c,i)=><Slot key={i} side="A" kind="open" index={i}
     card={c} onActivate={()=>useSelected('open-'+i)}/>)}
   </div>
   <Fighter side="player" snapshot={player} anchors={anchors} onShip={useSelected}
    weaponEffect={liveMountedWeaponEffect(visualEvents,'A')}/>
   <div className="live-deck live-deck--numeric" data-equipped-deck={numericBackId}
    role="img" title={'Mazzo numerico equipaggiato · '+numericBackName}
    aria-label={'Mazzo numerico '+numericBackName+' · '+player.numeric.deck.length+' carte'}>
    <img className="live-deck-stack deck-stack-art" src={numericStackPath} width={768} height={1024}
     alt="" draggable={false}/>
    <small className="live-deck-label" aria-hidden="true">NUMERICHE</small>
    <em>{player.numeric.deck.length}</em>
   </div>
   <div className="live-deck live-deck--special" data-special-back="fixed"
    title="Dorso speciale unico, invariabile"
    style={{'--live-deck-art':`url("${OFFICIAL_SPECIAL_FIXED_BACK}")`}}
    aria-label={'Mazzo speciale, dorso unico · '+player.special.deck.length+' carte'}>
    <i/><i/><i/><span><b aria-hidden="true">✧</b><small>SPECIALI</small></span><em>{player.special.deck.length}</em>
   </div>
   <div className="live-special-hand" role="group" aria-label="Cinque carte speciali">
    {player.special.hand.map(card=>{
     const face=officialSpecialCardIdentity(card.type,TACTICAL_SPECIALS[card.type]);
     const visual=officialSpecialVisualMeta(card.type);
     const canPlay=myTurn&&battle.actionUsed.special<LIVE_SPECIAL_LIMIT&&supportedLiveSpecial(card.type);
     const inspected=selectedSpecial?.id===card.id;
     return <button type="button" key={card.id} disabled={!!result}
      className={'live-hand-special'+(inspected?' live-chosen':'')}
      data-family={visual?.role??face.category} data-rarity={visual?.rarity??undefined}
      title={face.name+' · '+face.category+
       (visual?.rarity?' · '+visual.rarity:'')+' · '+face.effect}
      aria-label={face.name+' · '+face.effect}
      aria-pressed={inspected}
      onClick={()=>selectCard('special',card.id,canPlay)}
      onTouchEnd={canPlay?e=>touchRelease(e,'special',card.id):undefined}
      draggable={canPlay}
      onDragStart={e=>e.dataTransfer.setData('text/plain','special:'+card.id)}>
      <LiveSpecialArt card={card}/>
      <span className="live-card-emblem" aria-hidden="true">{face.symbol}</span>
      {visual?.rarity&&<span className="live-card-rarity" aria-hidden="true">{visual.rarity}</span>}
      {!visual?.rarity&&visual?.limited==='BOSS'&&
       <span className="live-card-rarity live-card-rarity--boss" aria-hidden="true">BOSS</span>}
      <span className="live-card-caption"><b>{face.name}</b><small>{face.effect}</small></span>
     </button>;
    })}
   </div>
   <div className="live-number-hand" role="group" aria-label="Sette carte numeriche">
    {player.numeric.hand.map(card=><button key={card.id} type="button" disabled={cannotAct}
     ref={node=>{if(node)numericCards.current.set(card.id,node);else numericCards.current.delete(card.id);}}
     className={'live-number-card'+(chosen?.id===card.id?' live-chosen':'')+
      (player.legacy?.golden?.cardId===card.id?' live-number-golden':'')+
      (player.legacy?.bomb?.cardId===card.id?' live-number-bomb':'')}
     style={{'--live-suit':CARD_SUIT_COLORS[card.suit]}}
     aria-pressed={chosen?.id===card.id} aria-label={rankLabel(card.value)+card.suit}
     onClick={()=>selectCard('numeric',card.id)}
     onTouchEnd={e=>touchRelease(e,'numeric',card.id)}
     draggable={!cannotAct}
     onDragStart={e=>e.dataTransfer.setData('text/plain','numeric:'+card.id)}>
     <small>{card.suit}</small><b>{rankLabel(card.value)}</b><small>{card.suit}</small>
     {player.legacy?.bomb?.cardId===card.id&&<span className="live-number-mark live-number-mark--bomb">BOMBA</span>}
     {player.legacy?.golden?.cardId===card.id&&<span className="live-number-mark live-number-mark--gold">DORATA</span>}
    </button>)}
   </div>
   {selectedSpecialFace&&!result&&<div className="live-card-inspector" data-family={selectedSpecialFace.category}
    role="status" aria-live="polite">
    <b><span>{selectedSpecialFace.symbol}</span>{selectedSpecialFace.name}</b>
    <strong>{selectedSpecialVisual?.role??selectedSpecialFace.category}
      {selectedSpecialVisual?.rarity?' · '+selectedSpecialVisual.rarity:''}</strong>
    <p>{TACTICAL_SPECIALS[selectedSpecial.type]?.help||selectedSpecialFace.effect}</p>
    {specialPreviewNote&&<small>{specialPreviewNote}</small>}
   </div>}
   <div className="live-actions">
    <span>{'NUMERICHE '+battle.actionUsed.numeric+'/'+LIVE_NUMERIC_LIMIT+
     ' · SPECIALI '+battle.actionUsed.special+'/'+LIVE_SPECIAL_LIMIT}</span>
    {player.bossNumericDeck?.id==='planet_char_3'&&<button type="button"
      disabled={cannotAct||now<(player.bossNumericDeck.liveNextRecycleAtMs||0)}
      title="Ricambio armonico: sostituisci fino a 2 carte vere; ricarica 13/11/9 secondi"
      onClick={()=>{setRecycleChoice([]);setSpecialChoice({type:'boss-recycle'});}}>
      {now<(player.bossNumericDeck.liveNextRecycleAtMs||0)?
       'RICAMBIO '+Math.ceil((player.bossNumericDeck.liveNextRecycleAtMs-now)/1000)+'s':
       'RICAMBIO ARMONICO'}
     </button>}
     <button type="button" data-live-drop="discard"
      disabled={cannotAct||chosen?.kind!=='numeric'||battle.actionUsed.numeric>=LIVE_NUMERIC_LIMIT}
      title="Cestino: scarta la numerica selezionata; usa 1 delle 3 azioni, senza pesca immediata."
      aria-label="Cestino: scarta la carta numerica selezionata"
      onClick={()=>useSelected('discard')}>CESTINO</button>
     <button type="button" disabled={cannotAct} onClick={()=>action({type:'end'})}>PASSA TURNO</button>
    <button type="button" onClick={()=>setDetails(v=>!v)} aria-label="Regole e registro">?</button>
   </div>
   {!result&&<button type="button" className="live-abandon" disabled={busy}
    onClick={leave} aria-label="Abbandona la battaglia">
    <span aria-hidden="true">←</span> ABBANDONA
   </button>}
   <FleetBar keySide="A" side={player} nickname={nickname}/>
   {visualEvents.map(({event,index,delay})=><OfficialLiveCombatFx key={'combat-'+index}
    event={event} delay={delay} origin={numericOrigins.current.get(index)}
    rootRef={rootRef} anchors={anchors}/>)}
   {last&&last.kind!=='turn_start'&&now-last.atMs<3300&&<div className="live-action-notice" key={battle.history.length}
    role="status" data-event={last.kind}>{last.message}</div>}
   {message&&<div className="live-validation" role="alert">{message}</div>}
   {vital&&targeted&&targeted.hp>0&&<div className="live-vital-panel" role="dialog"
    aria-label={'Combinazione del '+VITAL_LABELS[vital]}>
    <div className="live-vital-panel-head">
     <b>{VITAL_LABELS[vital]}</b><span>{targeted.exposed?'ESPOSTO':player.liveRift?'FAGLIA ATTIVA':'PROTETTO'}</span>
     <button type="button" onClick={()=>setVital(null)}>×</button>
    </div>
    <div className="live-vital-slots">
     {Array.from({length:tacticalSignatureSlotCount(targeted.signature)},(_,i)=>{
      const c=battle.vitalBuilds.A[vital][i];
      return <button key={i} type="button" disabled={!myTurn||!exposed}
       data-live-drop="vital" onClick={()=>useSelected('vital')}>
       {c?rankLabel(c.value)+c.suit:'+'}
      </button>;
     })}
    </div>
    <small>{hiddenMutation?'FIRMA MUTATA · nuovo requisito nascosto':visibleTacticalSignature(player,enemy,vital)?
     tacticalSignatureLabel(targeted.signature)+' · '+tacticalSignatureSlotCount(targeted.signature)+' slot massimi. Le carte restano tra i turni.':
     'Firma non ancora scoperta'}</small>
    <button type="button" disabled={!myTurn||!battle.vitalBuilds.A[vital].length}
     onClick={()=>action({type:'clearVital',vitalId:vital})}>SCARTA COMBINAZIONE</button>
   </div>}
   {specialChoice&&choiceCard&&<div className="live-choice-overlay" role="dialog"
     aria-modal="true" aria-label={'Scegli bersaglio '+(TACTICAL_SPECIALS[choiceCard.type]?.name||'')}>
     <div className="live-choice-panel">
      <div className="live-choice-head">
       <strong>{choiceCard.type==='boss-recycle'?'RICAMBIO ARMONICO · AFRODITE':
          TACTICAL_SPECIALS[choiceCard.type]?.name||'CARTA SPECIALE'}</strong>
       <button type="button" onClick={()=>setSpecialChoice(null)} aria-label="Annulla scelta">×</button>
      </div>
      {specialChoice.type==='tactic-bomb'&&<>
       <p>Seleziona uno slot avversario: la Bomba si lega alla carta reale dopo la prossima pesca, senza rivelare la mano.</p>
       <div className="live-choice-grid">{Array.from({length:7},(_,i)=>
        <button type="button" key={i} onClick={()=>completeSpecialChoice({bombSlot:i})}>SLOT {i+1}</button>)}</div>
      </>}
      {specialChoice.type==='tactic-golden'&&<>
       <p>Scegli una tua numerica. Il bonus si attiva soltanto completando una vera combinazione su un vitale.</p>
       <div className="live-choice-grid">{player.numeric.hand.map((card,i)=>
        <button type="button" key={card.id} onClick={()=>completeSpecialChoice({goldenIndex:i})}>
         {rankLabel(card.value)}{card.suit}</button>)}</div>
      </>}
      {specialChoice.type==='tactic-malus'&&<>
       <p>Carica: {player.legacy?.malusCharge||0}/3 colpi validi ai vitali.</p>
       <div className="live-choice-grid">{MALUS_CHOICES.map(c=>
        <button type="button" key={c.id} disabled={(player.legacy?.malusCharge||0)<3}
         title={c.help} onClick={()=>completeSpecialChoice({malusChoice:c.id})}>{c.name}</button>)}</div>
      </>}
      {(specialChoice.type==='tactic-signature-mutation'||specialChoice.type==='tactic-counter')&&<>
       <p>{specialChoice.type==='tactic-signature-mutation'?
        'Scegli un tuo componente già esposto per cambiarne temporaneamente la firma.':
        'Scegli quale tuo componente sarà protetto dalla Contromisura.'}</p>
       <div className="live-choice-grid">{VITAL_IDS.map(id=>
        <button type="button" key={id}
         disabled={player.defense.parts[id].hp<=0||
          (specialChoice.type==='tactic-signature-mutation'&&!player.defense.parts[id].exposed)}
         onClick={()=>completeSpecialChoice({vitalId:id})}>{VITAL_LABELS[id]}</button>)}</div>
      </>}
      {(specialChoice.type==='boss-recycle'||specialChoice.type==='tactic-numeric-recycle'||moduleChoiceEffect==='free_swap'||moduleChoiceEffect==='refill')&&<>
       <p>Seleziona una o due numeriche da scartare e ripescare dal mazzo autentico. Disinnesca le Bombe su quelle carte.</p>
       <div className="live-choice-grid">{player.numeric.hand.map((card,i)=>
        <button type="button" key={card.id}
         className={recycleChoice.includes(i)?'live-choice-selected':''}
         onClick={()=>setRecycleChoice(old=>old.includes(i)?old.filter(n=>n!==i):
          old.length<recycleMax?[...old,i]:old)}>{rankLabel(card.value)}{card.suit}</button>)}</div>
       <button type="button" className="live-choice-confirm" disabled={!recycleChoice.length}
        onClick={()=>completeSpecialChoice({recycleIndices:recycleChoice})}>
        CONFERMA RICAMBIO ({recycleChoice.length}/{recycleMax})</button>
      </>}
      <button type="button" className="live-choice-cancel"
       onClick={()=>setSpecialChoice(null)}>ANNULLA</button>
     </div>
    </div>}
   {(epicChoiceReady||epicRecycleReady)&&!specialChoice&&<div className="live-choice-overlay"
    role="dialog" aria-modal="true" aria-label="Scelta Oggetto Epico">
     <div className="live-choice-panel">
      <div className="live-choice-head">
       <strong>{epicChoiceReady?'OGGETTO EPICO · SCEGLI LA PESCATA':'PENDOLO · RICAMBIO EXTRA'}</strong>
      </div>
      {epicChoiceReady&&<>
       <p>Una carta vera del tuo mazzo sarà anticipata alla prossima pesca. La mano non riceve numeriche gratuite.</p>
       <div className="live-choice-grid">
        {player.epic.peek.map((card,i)=>
         <button key={i} type="button" onClick={()=>action({type:'epic-choice',index:i})}>
          {rankLabel(card.value)}{card.suit}
         </button>)}
       </div>
       <button type="button" className="live-choice-cancel"
        onClick={()=>action({type:'epic-choice',index:0})}>PRIMA CARTA</button>
      </>}
      {epicRecycleReady&&!epicChoiceReady&&<>
       <p>Scarta una numerica e pescane una vera dal mazzo. Il ricambio non conta nel limite delle 3 carte numeriche.</p>
       <div className="live-choice-grid">
        {player.numeric.hand.map((card,i)=>
         <button key={card.id} type="button" onClick={()=>action({type:'epic-recycle',index:i})}>
          {rankLabel(card.value)}{card.suit}
         </button>)}
       </div>
       <button type="button" className="live-choice-cancel"
        onClick={()=>setDetails(v=>!v)}>LASCIA PER DOPO</button>
      </>}
     </div>
    </div>}
   {details&&<div className="live-info">
    <h3>DUELLO LIVE · REGOLE</h3>
    <p>Turni alternati da 30s. Le armi sparano solo caricando numeriche del seme compatibile.
     Massimo tre numeriche e due speciali per turno. Lo scarto dal cestino usa una delle tre azioni numeriche: la mano si reintegra solo al prossimo turno. Le azioni sono immediate.</p>
    <p>Clicca un vitale esposto, inserisci le numeriche nei suoi slot. Le carte restano
     fra i turni: completando la combinazione valida il componente esplode.</p>
    <p>Le trappole coperte reagiscono durante il turno nemico se serve; due effetti
     diversi possono attivarsi sullo stesso attacco. Terreno PvP persistente fino a sostituzione.</p>
    <p>Trascina una carta sulla nave, uno slot o sul terreno. Su smartphone puoi
     anche toccare la carta e poi il bersaglio. Gli effetti speciali non ancora
     migrati sono bloccati: non si consumano senza effetto.</p>
    <h4>REGISTRO</h4>
    {battle.lastEvents.slice(-12).map((l,i)=><p key={i}>{l}</p>)}
    <button type="button" onClick={()=>setDetails(false)}>CHIUDI</button>
   </div>}
   {result&&!finalImpactVisible&&<div className="live-end">
    <h2>{result.winner==='player'?'VITTORIA':result.winner==='enemy'?'SCONFITTA':'PAREGGIO'}</h2>
    <p>{'Turni '+battle.turn+' · '+(session.bossEncounter?.name||displaySector||'Duello')}</p>
    <button type="button" disabled={busy} onClick={leave}>CONFERMA E TORNA</button>
   </div>}
  </div>
 </div>;
}
