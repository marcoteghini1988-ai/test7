// Eclissi Stellare: nuovo motore tattico, PLANCIA 3D ORIGINALE invariata.
// Usa i medesimi pezzi, hardpoint, scudiere SVG, arena e geometria del
// renderer OfficialLiveBattle3D. NON usa FleetCardBattle.css né cards-site.
import React,{useEffect,useMemo,useState,useRef} from 'react';
import {ASSET_ROOT,MountedWeapons} from './ShipPresentation.jsx';
import {newVessel} from './mathDuelEngine.js';
import ShipPhysicalVitals from './ShipPhysicalVitals.jsx';
import {readShipCollection} from './shipCollection.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {STARTER_DECK,card,cardRole,cardFacePath,deckFromCounts} from './fleetNext/rules.js';
import {isAuroraModule,installedModule,liveModules,reconfigurationOptions} from './fleetNext/auroraEngine.js';
import {LINCE_BYPASS_ACTIONS,linceMarkedRouteReady} from './fleetNext/linceEngine.js';
import {PRISMA_ATTACK_ACTIONS,livePrismaUnits} from './fleetNext/prismaEngine.js';
import {describeEffect,describeEscortEffect,describeBossPassive,effectNeedsOwnTarget,SIMPLE_RULES} from './fleetNext/simpleEffects.js';
import {readFleetInventory,writeFleetInventory,claimFleetReward,fleetRewardForBattle} from './fleetNext/collection.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,timeoutFleetTurn,effectUnavailableReason,defenseCapacityReason,protectingFleetUnits,availableFleetTargets} from './fleetNext/combat.js';
import {projectFleetSlots,fleetEventText,fleetTurnNotice,projectFleetDefense,projectMachineBerths,FLEET_PHYSICAL_VITALS,campaignFleetShipId} from './fleetNext/battlePresentation.js';
import {TERRAIN_CATALOG} from './fleetNext/terrains.js';
import {fleetImpactVisual} from './fleetBattleVisuals.js';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';
import './OfficialLiveBattle3D.css';
import './OfficialFleetBattle3D.css';

const LOADOUT_KEY='eclissi_card_fleet_v1';
const PHYSICAL_LABELS={engine:'Plancia',weapons:'Arsenale',shieldGenerator:'Generatore',command:'Centralina'};
const PHYSICAL_SHORT_LABELS={engine:'PLA',weapons:'ARS',shieldGenerator:'GEN',command:'CEN'};
const VITAL_LABELS={bridge:'Plancia',weapons:'Arsenale',generator:'Generatore',command:'Centralina'};
const pct=(n,d)=>d>0?Math.round(Math.max(0,Math.min(1,n/d))*100):0;
function activeEscort(e){return e.hp>0&&!e.destroyed;}
function findMother(ships){
 const available=new Map(ships.cards.map(card=>[card.shipId,card]));
 let selected=[];
 try{selected=JSON.parse(localStorage.getItem(LOADOUT_KEY)||'[]');}catch{selected=[];}
 const selectedId=Array.isArray(selected)?selected.find(id=>available.has(id)):null;
 const equipped=ships.loadout.map(id=>ships.cards.find(c=>c.instanceId===id)).find(Boolean);
 return equipped||available.get(selectedId)||ships.cards[0]||null;
}
function startSession({mode,sectorNumber,bossPlanetId,bossSectorLevel}){
 try{
  const ships=readShipCollection(),inventory=readFleetInventory();
  const owned=findMother(ships);
  if(!owned)throw new Error('Nessuna nave madre posseduta.');
  const boss=officialBossEncounter({mode,sectorNumber,planetId:bossPlanetId,
   sectorLevel:bossSectorLevel});
  const early=officialEarlyCampaignRivalShip({mode,sectorNumber,planetId:bossPlanetId});
  const campaignMother=['campaign','adventure'].includes(mode)?
   campaignFleetShipId({planetId:boss?.planetId??bossPlanetId,sectorNumber}):null;
  const motherEnemy=campaignMother||boss?.motherShipId||early||
   chooseCampaignMotherRival(owned.shipId,owned.level,sectorNumber,bossPlanetId,bossSectorLevel).shipId;
  const levelEnemy=boss?.planetId===20?5:officialCampaignRivalLevel({mode,sectorNumber,playerLevel:owned.level});
  return {battle:createFleetNextBattle({
   shipA:owned.shipId,levelA:owned.level,
   shipB:motherEnemy,levelB:levelEnemy,
   deckA:inventory.deck,deckB:deckFromCounts(STARTER_DECK.carteGenerali),
   upgradesA:inventory.exclusiveUpgrades,
   mode,bossName:boss?.name||null,bossId:boss?.planetId??null,planetId:bossPlanetId,
   sectorNumber,seed:Math.floor(Math.random()*0x7fffffff)+1,
   nowMs:Date.now()
  }),error:''};
 }catch(e){return {battle:null,error:e?.message||'Battaglia non disponibile'};}
}
// Questa è esattamente la formazione spaziale 3D precedente:
// nave centrale 316×206 con ShipPhysicalVitals/MountedWeapons,
// scudiere nelle posizioni originali left:45/right:45, stessa arena.
function OriginalFleetFighter({side,unit,selectedVital,onSelectVital,canSelectOwn=false,impact,inspectEscort,
 selectedTarget,onSelectTarget,canTarget=false,chosenCards=[],ply=0}){
 const player=side==='player';
 const mother=unit.ships[0];
 const vessel=useMemo(()=>newVessel(mother.id,mother.level),[mother.id,mother.level]);
 const defense=useMemo(()=>projectFleetDefense(mother),[mother]);
 const berths=projectMachineBerths(unit,chosenCards);
 const currentImpact=impact?.escortDamage>0||impact?.machineDamage>0?null:fleetImpactVisual(impact);
 return <div className={'live-fighter live-fighter--'+side} data-own-target={canSelectOwn||undefined}>
  <div className="fleet-ship-wrap complete-ship focused official-mother"
   data-vital-weapons={mother.parts.find(p=>p.id==='weapons')?.destroyed?'destroyed':'healthy'}
   style={{left:'50%',top:0,width:316,height:206,zIndex:3}}>
   <ShipPhysicalVitals side={side} vessel={{...vessel,defense}} defense={defense}
    selectedVital={selectedVital==='generator'?'shieldGenerator':selectedVital==='bridge'?'engine':selectedVital}
    canTarget={canTarget||canSelectOwn} allowOwnTarget={canSelectOwn}
    onSelectVital={id=>onSelectVital?.(FLEET_PHYSICAL_VITALS[id])}
    vitalLabels={PHYSICAL_LABELS} vitalShortLabels={PHYSICAL_SHORT_LABELS}
    knownVitals={['engine','weapons','shieldGenerator','command']}/>
   <MountedWeapons side={side} vessel={vessel} index={0}/>
   {currentImpact&&<img key={(impact?.round||0)+currentImpact.kind}
    className="f3d-impact f3d-impact--mother" src={currentImpact.image}
    alt="" aria-hidden="true"/>}
  </div>
  {unit.escorts.map((escort,i)=>{
   const slot=escort.slot??i;
   const tookHit=impact?.escortSlot===slot&&impact?.escortDamage>0;
   const linked=escort.linked!==false;
   return <div key={escort.id} className={'live-escort live-escort--'+slot+
    (escort.hp===0?' live-escort--lost':'')+(escort.fused?' f3d-escort--fused':'')+
    (selectedTarget?.kind==='escort'&&selectedTarget.id===escort.id?' f3d-unit--selected':'')}
    title={escort.name+' · '+describeEscortEffect(escort)}>
    <img src={escort.visual||ASSET_ROOT+'/escorts/'+mother.id+'_escort_'+(slot+1)+'.svg'}
     alt={escort.name} draggable={false}/>
    <span className="f3d-escort-health" aria-label={'Resistenza '+escort.hp+' di '+escort.maxHp}>
     <i style={{width:pct(escort.hp,escort.maxHp)+'%'}}/>
    </span>
    {tookHit&&<img key={impact.round+'-hit-'+i} className="f3d-impact f3d-impact--escort"
     src={ASSET_ROOT+'/battle-fx/shield-contact.png'} alt="" aria-hidden="true"/>}
    {!player&&<button type="button" className="f3d-unit-target"
     disabled={!canTarget||!activeEscort(escort)}
     aria-label={'Attacca '+escort.name+' · '+escort.hp+'/'+escort.maxHp+' punti'}
     aria-pressed={selectedTarget?.kind==='escort'&&selectedTarget.id===escort.id}
     onClick={()=>onSelectTarget?.({kind:'escort',id:escort.id,slot})}/> }
    <small className="f3d-escort-grade">{escort.fused?'FUSA · ':''}G{escort.grade||1}</small>
    <button type="button" className="f3d-escort-info"
     onClick={()=>inspectEscort({escort,mother,linked})}
     aria-label={'Abilità della scudiera '+escort.name}>i</button>
   </div>;
  })}
  <div className="f3d-mounted-modules" aria-label={player?'Moduli montati':'Moduli avversari'}>
   {liveModules(unit).map(module=><button type="button" key={module.id}
    className={'f3d-mounted-module'+(selectedTarget?.kind==='module'&&selectedTarget.id===module.id?' f3d-unit--selected':'')}
    disabled={!player&&!canTarget}
    title={module.name+' · Integrità '+module.hp+'/'+module.maxHp}
    aria-label={(player?'Consulta ':'Attacca ')+module.name+' · '+module.hp+'/'+module.maxHp}
    onClick={()=>player?inspectEscort?.({module}):onSelectTarget?.({kind:'module',id:module.id,slot:module.slot})}>
     <span>{module.slot==='weapon'?'ARMA':'UTILITÀ'}</span><b>{module.name}</b><small>{module.hp}/{module.maxHp}</small>
    </button>)}
  </div>
  <div className="f3d-machine-berths" aria-label={player?'Le tue due macchine d’assalto':'Le due macchine d’assalto avversarie'}>
   {berths.map((machine,slot)=>{
    const enabled=machine&&!machine.pending;
    const hit=impact?.machineSlot===slot&&impact?.machineDamage>0;
    const selected=selectedTarget?.kind==='machine'&&selectedTarget.id===machine?.id;
    return <button type="button" key={slot} className={'f3d-machine-berth f3d-machine-berth--'+slot+(selected?' f3d-unit--selected':'')+(hit?' f3d-machine--hit':'')}
     disabled={!machine||(!player&&(!canTarget||!enabled))}
     aria-label={machine?(player?'Consulta ':'Attacca ')+machine.name+' · '+machine.hp+'/'+machine.maxHp+' punti':'Macchina d’assalto '+(slot+1)+' · spazio libero'}
     aria-pressed={!player&&selected}
     onClick={()=>player?inspectEscort({machine}):onSelectTarget?.({kind:'machine',id:machine.id,slot})}>
     {machine?<><svg viewBox="0 0 70 56" aria-hidden="true">
      <path d="M8 45 14 18 26 13H44L56 18 62 45 50 52H20Z" fill="#546d7c" stroke="#b3c9d3" strokeWidth="2"/>
      <path d="M22 34V4H29V34M41 34V4H48V34" fill="#172839" stroke="#aac5d3" strokeWidth="3"/>
      <path d="M17 41H53M23 46H47" stroke="#87e9fb" strokeWidth="3"/>
      <circle cx="35" cy="28" r="8" fill="#173546" stroke="#89c8d8" strokeWidth="2"/>
     </svg><span>{machine.pending?'DA SCHIERARE':machine.hp+'/'+machine.maxHp}</span></>:<b>＋</b>}
     <small>MACCHINA {slot+1}</small>
    </button>;
   })}
  </div>
  <span className="live-fleet-caption">{mother.name+' · '+
   unit.escorts.filter(activeEscort).length+' supporti'+
   ((unit.reserveEscorts||[]).length?' · '+unit.reserveEscorts.length+' in riserva':'')}</span>
 </div>;
}
function OriginalFleetBar({side,unit,nickname}){
 const mother=unit.ships[0];
 const max=mother.parts.reduce((n,p)=>n+p.maxHp,0);
 const hp=mother.parts.reduce((n,p)=>n+p.hp,0);
 const units=[...unit.escorts.slice(0,1).map(e=>({kind:'escort',hp:e.hp,max:e.maxHp,link:e.linked})),
  {kind:'mother',hp,max,link:mother.parts.filter(p=>!p.destroyed).length/mother.parts.length},
  ...unit.escorts.slice(1,2).map(e=>({kind:'escort',hp:e.hp,max:e.maxHp,link:e.linked}))];
 return <div className={'live-fleet-bar live-fleet-bar--'+side}>
  <strong>{side==='A'?(nickname||'TU'):'AVVERSARIO'}</strong>
  <div className="live-units">{units.map((u,i)=><div key={i}
   className={'live-unit'+(u.kind==='mother'?' live-unit--mother':'')}
   title={u.kind==='mother'?'Integrità dei componenti vitali':'Resistenza scudiera e collegamento'}>
   <span>{u.kind==='mother'?'MADRE':'SCUDIERA'}</span>
   <i className="live-unit-health"><b style={{width:pct(u.hp,u.max)+'%'}}/></i>
   <i className="live-unit-shield"><b style={{
    width:(typeof u.link==='number'?u.link*100:u.link?100:0)+'%'}}/></i>
  </div>)}</div>
 </div>;
}
function OriginalSpecialSlots({side,contents,upgrades={},inspectTrap,unit}){
 const labels=['PERS.','DIF.','TRAPP.','ATT.','ATT.','ATT.'];
 return <div className={'live-slot-row live-slot-row--'+(side==='A'?'player':'enemy')}>
  {contents.map((entry,i)=>{
   const type=entry?.id,covered=!!entry?.hidden;
   const parts=unit?.ships?.[0]?.parts||[];
   const controller=i===0?(parts.some(p=>p.id==='bridge')?'bridge':'generator'):i<=2?'generator':'weapons';
   const offline=parts.some(p=>p.id===controller&&(p.hp<=0||p.destroyed));
   const face=!covered&&type?card(type):null;
   const art=covered?OFFICIAL_SPECIAL_FIXED_BACK:!type?null:card(type)?
     cardFacePath(type,upgrades[type]||1):officialSpecialArtPath(type);
   const title=covered?(side==='A'?'La tua trappola coperta · Tocca per consultarla':'Trappola avversaria coperta'):
    face?(face.nome||face.name||type)+' · '+describeEffect(face,upgrades[type]||1):labels[i];
   return <div key={i} className={'live-slot'+(side==='B'?' live-slot--enemy':'')+
    (entry?' live-slot--occupied':'')+(covered?' live-slot--covered':'')+(offline?' live-slot--offline':'')}
    title={title+(offline?' · Sistema distrutto':'')} data-offline={offline||undefined}
    data-slot-role={i===0?'personaggio':i===1?'difesa':i===2?'trappola':'attacco'}
     data-family={covered?'defense':type?cardRole(type):undefined}
     data-rarity={face?.rarita||face?.rarityDraft||undefined}>
    {art?<img className="f3d-slot-art" src={art} alt="" draggable={false}/>:
     <span className={face?'f3d-card-fallback':undefined}>{face?(face.nome||face.name):['♙','◇','◈','✧','✧','✧'][i]}</span>}
    {covered?<>
     <small className="live-slot-role">{entry.pending?'DA POSARE':'COPERTA'}</small>
     {side==='A'&&type&&<button type="button" className="f3d-trap-inspect"
      aria-label="Consulta la tua trappola coperta"
      onClick={()=>inspectTrap?.({trapId:type,pending:entry.pending})}/>}
    </>:!type&&<small className="live-slot-role">{labels[i]}</small>}
   </div>;
  })}
 </div>;
}
function TrapReveal({event}){
 const trap=card(event?.cardId),blocked=card(event?.blockedCardId);
 if(event?.kind!=='trap-reveal'||!trap)return null;
 return <div className="f3d-trap-reveal" role="status" aria-live="polite">
  {cardFacePath(trap.id)?<img src={cardFacePath(trap.id)} alt={trap.nome||trap.name}/>:
  <span className="f3d-trap-icon" aria-hidden="true">◈</span>}
  <div><strong>TRAPPOLA ATTIVATA</strong><b>{trap.nome||trap.name}</b>
   <span>{event.redirected||event.secondaryCancelled?event.text:(blocked?.nome||blocked?.name||'Terreno avversario')+': attivazione annullata.'}</span>
  </div>
 </div>;
}
function OriginalSpecialHandCard({type,index,selected,disabled,onClick,offset,grade=1,unavailableReason=''}){
 const def=card(type);
 const rarity=def?.rarita||def?.rarityDraft||'Comune';
 const description=def?describeEffect(def,grade):'Carta tattica';
  const role=cardRole(type)||'support';
  const familyGlyph={attack:'⚔',defense:'⬡',character:'♛',terrain:'◈',support:'✚',control:'◎'}[role]||'✦';
 const name=def?.nome||def?.name||type;
 const art=!type?null:card(type)?
     cardFacePath(type,grade):officialSpecialArtPath(type);
 return <button type="button" disabled={disabled}
  className={'live-hand-special'+(selected?' live-chosen':'')}
  style={{'--special-angle':offset*3+'deg','--special-drop':offset**2*1.4+'px'}}
  data-family={role} data-rarity={rarity}
  title={name+' · '+description+(unavailableReason?' · '+unavailableReason:'')}
  aria-label={name+' · '+description+(unavailableReason?' · '+unavailableReason:'')}
  aria-disabled={!!unavailableReason||disabled}
  aria-pressed={selected} onClick={onClick}>
  {art?<img src={art} alt="" draggable={false}/>:
   <span className="live-special-art f3d-mechanic-art">{familyGlyph}</span>}
  <span className="live-card-emblem">{familyGlyph}</span>
  <span className="live-card-rarity">{rarity}</span>
  <span className="live-card-caption"><b>{name}</b>
   <small>{description}</small></span>
 </button>;
}
export default function OfficialFleetBattle3D({
 nickname='Comandante',gameMode='campaign',sectorNumber=1,displaySector='',
 bossPlanetId=null,bossSectorLevel=null,onResult,onExit
}){
 const opts={mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel};
 const [session,setSession]=useState(()=>startSession(opts));
 const [battle,setBattle]=useState(session.battle);
 const [selectedVital,setSelectedVital]=useState('weapons');
 const [selectedTarget,setSelectedTarget]=useState(null);
 const [selectedOwnVital,setSelectedOwnVital]=useState('');
 const [chosenCards,setChosenCards]=useState([]);
 const [prismaOptions,setPrismaOptions]=useState({
  redirectMachineId:'',trapSelection:'',artisanSelection:'',enemySelection:'',
  secondSelection:'',thirdSelection:''
 });
 const setPrismaOption=(name,value)=>setPrismaOptions(prev=>({...prev,[name]:value}));
 const [corvoOptions,setCorvoOptions]=useState({exchangeCardId:'',bottomTop:false});
 const setCorvoOption=(name,value)=>setCorvoOptions(old=>({...old,[name]:value}));
 const [linceOptions,setLinceOptions]=useState({
  routePartId:'',sacrificeSlot:'',heliosTrade:false,heliosDiscardId:'',
  linceRecallWeapon:false,radentRecall:false,radentMachineId:''
 });
 const setLinceOption=(name,value)=>setLinceOptions(old=>({...old,[name]:value}));
 const [auroraOptions,setAuroraOptions]=useState({
  deckTopFlip:false,sacrificeSlot:'',exchangeCardId:'',peekPickId:'',
  cartographerPickId:'',reconfigureSelection:'',secondarySelection:''
 });
 const setAuroraOption=(name,value)=>setAuroraOptions(prev=>({...prev,[name]:value}));
 const [scale,setScale]=useState(1);
 const [message,setMessage]=useState('');
 const [help,setHelp]=useState(null);
 const [lastFx,setLastFx]=useState(null);
 const [trapReveal,setTrapReveal]=useState(null);
 const [busy,setBusy]=useState(false);
 const [showLog,setShowLog]=useState(false);
 const [rewardDone,setRewardDone]=useState(false);
 const [now,setNow]=useState(()=>Date.now());
 const submitting=useRef(false);
 useEffect(()=>{
  const resize=()=>setScale(Math.max(.3,Math.min(innerWidth/450,innerHeight/800)));
  resize();window.addEventListener('resize',resize);
  return ()=>window.removeEventListener('resize',resize);
 },[]);
 useEffect(()=>{
  const id=window.setInterval(()=>setNow(Date.now()),250);
  return ()=>window.clearInterval(id);
 },[]);
 useEffect(()=>{
  if(!trapReveal)return;
  const id=window.setTimeout(()=>setTrapReveal(null),4200);
  return ()=>window.clearTimeout(id);
 },[trapReveal]);
 function showResult(result){
  setBattle(result.battle);
  setLastFx({nonce:Date.now(),round:battle.round,events:result.events});
  setMessage(fleetTurnNotice(result.events));
  const revealed=result.events.find(event=>event.kind==='trap-reveal');
  if(revealed)setTrapReveal({...revealed,nonce:Date.now()});
 }
 // Anche il nemico segue l'alternanza dei turni. Nel PvP attuale resta IA simulata.
 useEffect(()=>{
  if(!battle||battle.phase!=='playing'||battle.turn!=='B')return;
  const id=window.setTimeout(()=>{
   const ai=autoFleetTurn(battle,'B');
   const result=resolveFleetNextTurn(battle,'B',ai,Date.now());
   if(result.ok){
    showResult(result);
   }else setMessage(result.reason);
  },680);
  return ()=>window.clearTimeout(id);
 },[battle?.ply,battle?.turn,battle?.phase]);
 useEffect(()=>{
  if(!battle||battle.phase!=='playing')return;
  const id=window.setTimeout(()=>{
   const result=timeoutFleetTurn(battle,Date.now());
   if(result.ok){
    setBattle(result.battle);setChosenCards([]);
    setLastFx({nonce:Date.now(),round:battle.round,events:result.events});
    setMessage('Tempo scaduto: turno passato');
   }
  },Math.max(50,battle.deadlineMs-Date.now()+60));
  return ()=>window.clearTimeout(id);
 },[battle?.ply,battle?.deadlineMs,battle?.phase]);
 function restart(){
  const next=startSession(opts);
  setSession(next);setBattle(next.battle);
  setSelectedVital('weapons');setSelectedTarget(null);setSelectedOwnVital('');setChosenCards([]);setMessage('');
  setAuroraOptions({deckTopFlip:false,sacrificeSlot:'',exchangeCardId:'',peekPickId:'',cartographerPickId:'',reconfigureSelection:'',secondarySelection:''});
  setLinceOptions({routePartId:'',sacrificeSlot:'',heliosTrade:false,heliosDiscardId:'',
   linceRecallWeapon:false,radentRecall:false,radentMachineId:''});
  setPrismaOptions({redirectMachineId:'',trapSelection:'',artisanSelection:'',
   enemySelection:'',secondSelection:'',thirdSelection:''});
  setCorvoOptions({exchangeCardId:'',bottomTop:false});
  setLastFx(null);setTrapReveal(null);setRewardDone(false);setHelp(null);
  submitting.current=false;
 }
 function unavailable(type,index){
  if(!battle||battle.phase!=='playing')return 'Partita terminata';
  if(battle.turn!=='A')return 'Attendi il turno avversario';
  const player=battle.sides.A;
  if(!type||!card(type))return 'Carta non riconosciuta';
  const role=cardRole(type);
  if(role==='character'&&!chosenCards.includes(index)&&
   player.commander?.untilPly>battle.ply)return 'Personaggio già attivo';
  const terrainCode=chosenCards.map(i=>card(player.hand[i])?.effectSpec).find(s=>s?.type==='terrain')?.code;
  const effectReason=effectUnavailableReason(card(type),player,battle,{terrainCode});
  if(effectReason)return effectReason;
  if(!chosenCards.includes(index)){
   const roles=chosenCards.map(i=>cardRole(player.hand[i]));
   if(chosenCards.length>=3)return 'Puoi giocare al massimo 3 carte per turno';
   if(role==='defense'&&roles.filter(x=>x==='defense').length>=2)return 'Puoi giocare al massimo 2 Difese per turno';
   if(role==='defense'){
    const selectedDefenses=chosenCards.map(i=>player.hand[i]).filter(id=>cardRole(id)==='defense');
    const capacity=defenseCapacityReason(player,[...selectedDefenses,type],battle.ply);
    if(capacity)return capacity;
   }
   if((role==='character'||role==='terrain')&&roles.includes(role))
    return role==='character'?'Puoi giocare 1 Personaggio per turno':'Puoi giocare 1 Terreno per turno';
  }
  return '';
 }
 function chooseCard(index){
  if(chosenCards.includes(index)){setChosenCards(old=>old.filter(i=>i!==index));setMessage('');return;}
  const type=battle.sides.A.hand[index];
  const reason=unavailable(type,index);
  if(reason){setMessage(reason);return;}
  setMessage('');
  if(!chosenCards.includes(index)&&card(type)?.effectSpec?.type==='repair'&&effectNeedsOwnTarget(card(type))){
   const parts=battle.sides.A.ships[0].parts.filter(p=>!p.destroyed&&p.hp>0&&p.hp<p.maxHp);
   if(!parts.some(p=>p.id===selectedOwnVital))setSelectedOwnVital([...parts].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]?.id||'');
  }
  setChosenCards(old=>old.includes(index)?old.filter(i=>i!==index):
   old.length<3?[...old,index]:old);
 }
 function fire(){
  if(!battle||battle.phase!=='playing'||battle.turn!=='A')return;
  const target=battle.sides.B.ships[0];
  const partId=target.parts.find(p=>p.id===selectedVital&&!p.destroyed)?
   selectedVital:target.parts.find(p=>!p.destroyed)?.id;
  if(!partId){setMessage('Nessun componente disponibile');return;}
  const reconfig=reconfigChoices.find(c=>c.slot+':'+c.cardId===auroraOptions.reconfigureSelection);
  const secondary=forkActive?targetChoices.find(t=>t.kind+':'+t.id===auroraOptions.secondarySelection):null;
  const prismaTrap=prismaTrapChoices.find(t=>t.kind+':'+t.id===prismaOptions.trapSelection);
  const prismaArtisan=prismaTrapChoices.find(t=>t.kind+':'+t.id===prismaOptions.artisanSelection);
  const prismaEnemy=prismaUnitTargets.find(t=>t.kind+':'+t.id===prismaOptions.enemySelection);
  const prismaSecond=prismaUnitTargets.find(t=>t.kind+':'+t.id===prismaOptions.secondSelection);
  const prismaThird=prismaUnitTargets.find(t=>t.kind+':'+t.id===prismaOptions.thirdSelection);
  const result=resolveFleetNextTurn(battle,'A',
   {partId,targetKind:actualTarget?.kind||'part',targetId:actualTarget?.id||partId,
    escortSlot:actualTarget?.kind==='escort'?actualTarget.slot:undefined,
    machineSlot:actualTarget?.kind==='machine'?actualTarget.slot:undefined,
    moduleSlot:actualTarget?.kind==='module'?actualTarget.slot:undefined,
    ownPartId:actualOwnVital,cards:chosenCards,
    deckTopFlip:auroraOptions.deckTopFlip,
    sacrificeSlot:selectedActions.includes('crimson-raid')?linceOptions.sacrificeSlot:auroraOptions.sacrificeSlot,
    exchangeCardId:auroraOptions.exchangeCardId,peekPickId:auroraOptions.peekPickId,
    cartographerPickId:auroraOptions.cartographerPickId,
    reconfigureSlot:reconfig?.slot,reconfigureCardId:reconfig?.cardId,
    secondaryTargetKind:secondary?.kind,secondaryTargetId:secondary?.id,
    routePartId:linceOptions.routePartId||partId,
    heliosTrade:linceOptions.heliosTrade,heliosDiscardId:linceOptions.heliosDiscardId,
    linceRecallWeapon:linceOptions.linceRecallWeapon,
    radentRecall:linceOptions.radentRecall,radentMachineId:linceOptions.radentMachineId,
    prismaRedirectMachineId:prismaOptions.redirectMachineId,
    prismaTrapKind:prismaTrap?.kind,prismaTrapTargetId:prismaTrap?.id,
    prismaArtisanTargetKind:prismaArtisan?.kind,prismaArtisanTargetId:prismaArtisan?.id,
    prismaEnemyKind:prismaEnemy?.kind,prismaEnemyId:prismaEnemy?.id,
    prismaSecondTargetKind:prismaSecond?.kind,prismaSecondTargetId:prismaSecond?.id,
    prismaThirdTargetKind:prismaThird?.kind,prismaThirdTargetId:prismaThird?.id,
    corvoExchangeCardId:corvoOptions.exchangeCardId,corvoBottomTop:corvoOptions.bottomTop
   },Date.now());
  if(!result.ok){setMessage(result.reason);return;}
  showResult(result);setChosenCards([]);
  setCorvoOptions({exchangeCardId:'',bottomTop:false});
  setLinceOptions({routePartId:'',sacrificeSlot:'',heliosTrade:false,heliosDiscardId:'',
   linceRecallWeapon:false,radentRecall:false,radentMachineId:''});
  const nextTarget=result.battle.sides.B.ships[0].parts.find(p=>!p.destroyed);
  if(!result.battle.sides.B.ships[0].parts.some(p=>p.id===partId&&!p.destroyed))
   if(nextTarget)setSelectedVital(nextTarget.id);
 }
 function passTurn(){
  if(!battle||battle.phase!=='playing'||battle.turn!=='A')return;
  const result=resolveFleetNextTurn(battle,'A',
   {cards:[],partId:null,pass:true},Date.now());
  if(!result.ok){setMessage(result.reason);return;}
  setBattle(result.battle);setChosenCards([]);
  setMessage('Turno concluso');
 }
 async function leave(){
  if(busy||submitting.current)return;
  if(!battle||battle.phase!=='finished'){
   if(window.confirm('Abbandonare la battaglia senza ricompense?'))onExit?.();
   return;
  }
  submitting.current=true;setBusy(true);
  try{
   const won=battle.winner==='A';
   if(won&&gameMode!=='pvp'){
    await claimOfficialLiveVictoryRewards({
     winner:'player',mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel});
    const inventory=readFleetInventory();
    const key='sector:'+gameMode+':'+sectorNumber+':'+(bossPlanetId||'none');
    const reward=claimFleetReward(inventory,key,fleetRewardForBattle({
     winner:'A',mode:gameMode,sector:sectorNumber,boss:!!bossPlanetId
    }));
    if(reward.ok)writeFleetInventory(reward.inventory);
   }
   const me=battle.sides.A,op=battle.sides.B;
   const max=me.ships[0].parts.reduce((sum,p)=>sum+p.maxHp,0)+
    me.escorts.reduce((sum,e)=>sum+e.maxHp,0);
   const hp=me.ships[0].parts.reduce((sum,p)=>sum+p.hp,0)+
    me.escorts.reduce((sum,e)=>sum+e.hp,0);
   const health=Math.max(0,Math.min(1,hp/Math.max(1,max)));
   const result=won?'player':battle.winner==='B'?'enemy':'draw';
   const meta={
    turnsElapsed:battle.round,
    activeTimeElapsedMs:Math.max(0,Date.now()-battle.startedAtMs),
    remainingHpPct:health,isPvP:gameMode==='pvp',
    starsEarned:[won,won&&health>=.65,won&&health>=.9],
    matchStats:{
     turnsElapsed:battle.round,sectorNumber,
     damageDealt:op.ships[0].parts.reduce((sum,p)=>sum+p.maxHp-p.hp,0),
     enemyVitalsDestroyed:op.ships[0].parts.filter(p=>p.destroyed).length,
     bossPlanetId:bossPlanetId??null,bossSectorLevel:bossSectorLevel??null
    }
   };
   setRewardDone(true);
   if(gameMode!=='pvp')onResult?.(result,meta);
   onExit?.();
  }catch(e){submitting.current=false;setMessage('Ricompense non salvate: '+(e.message||'Riprova'));}
  finally{setBusy(false);}
 }
 if(!battle)return <main className="es-math-scope official-start-error">
  <h2>ECLISSI STELLARE</h2><p role="alert">{session.error}</p>
  <button onClick={restart}>RIPROVA</button>
  <button onClick={()=>onExit?.()}>TORNA AL MENU</button>
 </main>;
 const player=battle.sides.A,enemy=battle.sides.B;
 const ended=battle.phase==='finished';
 const target=enemy.ships[0];
 const actualVital=target.parts.find(p=>p.id===selectedVital&&!p.destroyed)?.id||
  target.parts.find(p=>!p.destroyed)?.id;
 const chosenTypes=chosenCards.map(i=>player.hand[i]).filter(Boolean);
 const directBypass=chosenTypes.some(id=>{
  const spec=card(id)?.effectSpec;
  return spec?.type==='bypass'||spec?.type==='lince'&&LINCE_BYPASS_ACTIONS.includes(spec.action);
 });
 const routePartId=linceMarkedRouteReady(player,battle.ply,player.lince?.route?.partId)?player.lince.route.partId:null;
 const bypass=directBypass||!!routePartId;
 const protectors=protectingFleetUnits(enemy,battle.ply);
 const targetChoices=availableFleetTargets(enemy,battle.ply).filter(t=>!t.blocked||directBypass||
  t.kind==='part'&&t.id===routePartId);
 const actualTarget=targetChoices.find(t=>selectedTarget&&t.kind===selectedTarget.kind&&t.id===selectedTarget.id)||
  (bypass||!protectors.length?
   targetChoices.find(t=>t.kind==='part'&&t.id===(routePartId||actualVital)):null)||
  protectors[0]||targetChoices[0];
 function selectTarget(value){
  const choice=targetChoices.find(t=>t.kind+':'+t.id===value);
  if(choice){setSelectedTarget({kind:choice.kind,id:choice.id,slot:choice.slot});
   if(choice.kind==='part')setSelectedVital(choice.id);setMessage('');}
 }
 const ownTargets=player.ships[0].parts.filter(p=>!p.destroyed&&p.hp>0);
 const actualOwnVital=ownTargets.find(p=>p.id===selectedOwnVital)?.id||
  [...ownTargets].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]?.id;
 const needsOwnTarget=chosenTypes.some(type=>effectNeedsOwnTarget(card(type)));
 const playerSlots=projectFleetSlots(player,chosenTypes,'A');
 const enemySlots=projectFleetSlots(enemy,[],'B');
 const selectedType=chosenCards.length?player.hand[chosenCards.at(-1)]:null;
 const selectedActions=chosenTypes.map(id=>card(id)?.effectSpec?.action).filter(Boolean);
 const prismaUnitTargets=livePrismaUnits(enemy,battle.ply,false).map(({kind,unit})=>({
  kind,id:unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const prismaTrapChoices=availableFleetTargets(player,battle.ply);
 const prismaMachines=player.machines.filter(m=>m.hp>0&&!m.destroyed&&
  (m.disabledUntilPly||0)<=battle.ply&&(m.jammedUntilPly||0)<=battle.ply);
 const prismaAttack=selectedActions.find(a=>PRISMA_ATTACK_ACTIONS.includes(a));
 const prismaSecondChoices=prismaUnitTargets.filter(t=>t.id!==actualTarget?.id);
 const prismaSelectedSecond=prismaUnitTargets.find(t=>
  t.kind+':'+t.id===prismaOptions.secondSelection);
 const prismaThirdChoices=prismaSecondChoices.filter(t=>t.id!==prismaSelectedSecond?.id);
 const linceMachineChoices=player.machines.filter(m=>m.hp>0&&!m.destroyed&&m.sourceCardId);
 const heliosAvailable=(player.commander?.id==='ex-c01-01'||selectedActions.includes('helios'))&&
  directBypass;
 const heliosDiscardChoices=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const radentReady=installedModule(player,'utility')?.cardId==='nx-c01-01'&&
  linceMachineChoices.length>0&&(directBypass||!!routePartId);
 const linceExtra=heliosAvailable||radentReady;
 const reconfigChoices=reconfigurationOptions(player,card,player.ships[0].level);
 const sacrificeOptions=liveModules(player);
 const adaptationOptions=player.hand.filter((id,i)=>!chosenCards.includes(i)&&card(id)?.shipId==='N00');
 const topThree=player.deck.slice(0,3);
 const cartographerOptions=player.deck.slice(0,4).filter(id=>isAuroraModule(id));
 const opticsActive=selectedActions.some(a=>['optics','piercing-barrel','modular-armor','forked-cannon'].includes(a))&&
  (selectedActions.includes('optics')||installedModule(player,'utility')?.cardId==='nx-n00-01');
 const forkChoices=targetChoices.filter(t=>actualTarget&&t.id!==actualTarget.id);
 const forkActive=installedModule(player,'weapon')?.cardId==='nx-n00-09'&&
  !selectedActions.some(a=>['burst','dismantle'].includes(a));
 const terrain=battle.terrain?.id;
 const boss=battle.bossId?{name:battle.bossName||'BOSS',ability:'ABILITÀ',
  description:describeBossPassive(battle.bossId)}:null;
 const readableTerrain=terrain?TERRAIN_CATALOG[terrain]?.name||'TERRENO':'NEUTRO';
 const secondsLeft=Math.max(0,Math.ceil((battle.deadlineMs-now)/1000));
 const myTurn=battle.turn==='A';
 return <div className="es-math-scope live-viewport">
  <div className="es-root official-duel-3d live-root f3d-original-arena"
   style={{transform:'translate(-50%,-50%) scale('+scale+')',
    '--live-special-back':'url("'+OFFICIAL_SPECIAL_FIXED_BACK+'")'}}>
   <div className="space-back metal-arena live-background" aria-hidden="true"
    style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
   {terrain&&TERRAIN_CATALOG[terrain]&&<div className="f3d-terrain-environment"
    key={'terrain-'+terrain} data-terrain={terrain} aria-hidden="true"
    style={{'--f3d-terrain-image':'url("/assets/fleet-terrain-scenes/'+terrain+'.svg")'}}/>}
   <OriginalFleetBar side="B" unit={enemy}/>
   <OriginalFleetFighter side="enemy" unit={enemy} selectedVital={actualTarget?.kind==='part'?actualTarget.id:null}
    selectedTarget={actualTarget} onSelectTarget={setSelectedTarget} canTarget={!ended&&myTurn} ply={battle.ply}
    onSelectVital={id=>{if(!ended&&myTurn){
     if(protectors.length&&!directBypass&&id!==routePartId){setMessage('Prima elimina i supporti e le macchine, oppure gioca Aggiramento.');return;}
     setSelectedVital(id);setSelectedTarget({kind:'part',id});setMessage('');
    }}}
    impact={lastFx?.events?.find(e=>e.kind==='impact'&&e.who==='A')&&
     {...lastFx.events.find(e=>e.kind==='impact'&&e.who==='A'),round:lastFx.nonce}}
    inspectEscort={setHelp}/>
   <OriginalSpecialSlots side="B" contents={enemySlots} upgrades={enemy.exclusiveUpgrades} unit={enemy}/>
   <div className="live-midline">
    <span className="live-turn-indicator" data-active={battle.turn}>
     {ended?'FINE PARTITA':(myTurn?'TU':'AVVERSARIO')+' · '+secondsLeft+'s'} ·
     {' '}{actualTarget?.kind==='part'?(VITAL_LABELS[actualTarget.id]||'VITALI'):actualTarget?.kind==='machine'?'MACCHINA':actualTarget?.kind==='module'?'MODULO':'SUPPORTO'}
    </span>
    <button className="live-terrain-slot" type="button"
     title={'Terreno attivo: '+readableTerrain+' · Tocca per leggere le regole'}
     data-terrain={terrain||undefined} onClick={()=>setHelp({rules:true,terrain})}>
     {readableTerrain}
    </button>
   </div>
   <OriginalSpecialSlots side="A" contents={playerSlots} upgrades={player.exclusiveUpgrades} inspectTrap={setHelp} unit={player}/>
   <OriginalFleetFighter side="player" unit={player} chosenCards={chosenTypes} ply={battle.ply}
    selectedVital={needsOwnTarget?actualOwnVital:null} canSelectOwn={needsOwnTarget&&myTurn&&!ended}
    onSelectVital={id=>{if(ownTargets.some(p=>p.id===id)){setSelectedOwnVital(id);setMessage('');}}}
    impact={lastFx?.events?.find(e=>e.kind==='impact'&&e.who==='B')&&
     {...lastFx.events.find(e=>e.kind==='impact'&&e.who==='B'),round:lastFx.nonce}}
    inspectEscort={setHelp}/>
   <div className="live-deck live-deck--numeric f3d-discard"
    role="img" title="Scarti delle carte speciali"
    style={{'--live-deck-art':'url("'+OFFICIAL_SPECIAL_FIXED_BACK+'")'}}>
    <i/><i/><i/><span><b aria-hidden="true">✧</b><small>SCARTI</small></span>
    <em>{player.discard.length}</em>
   </div>
   <div className="live-deck live-deck--special" data-special-back="fixed"
    title="Mazzo speciale originale"
    style={{'--live-deck-art':'url("'+OFFICIAL_SPECIAL_FIXED_BACK+'")'}}>
    <i/><i/><i/><span><b aria-hidden="true">✧</b><small>SPECIALI</small></span>
    <em>{player.deck.length}</em>
   </div>
   <div className="live-special-hand" role="group" aria-label="Sette carte del mazzo">
    {player.hand.map((type,index,hand)=><OriginalSpecialHandCard
     key={battle.round+'-'+index+'-'+type} type={type} index={index}
     offset={index-(hand.length-1)/2}
     selected={chosenCards.includes(index)} disabled={ended||!myTurn}
     grade={player.exclusiveUpgrades?.[type]||1} unavailableReason={unavailable(type,index)}
     onClick={()=>chooseCard(index)}/>)}
   </div>
   {!ended&&<label className="f3d-target-status">
    <span>{protectors.length&&!bypass?'MADRE PROTETTA · ':'BERSAGLIO · '}</span>
    <select aria-label="Bersaglio dell’attacco" value={actualTarget?actualTarget.kind+':'+actualTarget.id:''}
     disabled={!myTurn} onChange={event=>selectTarget(event.target.value)}>
     {targetChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
      {t.kind==='part'?'Madre · '+VITAL_LABELS[t.id]:t.kind==='module'?'Modulo · '+t.name:t.name} · {t.hp}/{t.maxHp}
     </option>)}
    </select>
   </label>}
   {(selectedType||forkActive||linceExtra)&&!ended&&<div className="live-card-inspector" role="status">
    <div className="f3d-selected-effects">{chosenTypes.map((type,i)=><p key={type+'-'+i}>
     <b>{card(type)?.nome||card(type)?.name||type}</b>
     {' — '+describeEffect(card(type),player.exclusiveUpgrades?.[type]||1)}
    </p>)}</div>
    {needsOwnTarget&&<label className="f3d-own-target">Tuo componente:
     <select value={actualOwnVital||''} onChange={e=>setSelectedOwnVital(e.target.value)} aria-label="Componente da proteggere o riparare">
      {ownTargets.map(p=><option key={p.id} value={p.id}>{VITAL_LABELS[p.id]} · {p.hp}/{p.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('sacrificial-veil')&&<label>Modulo da sacrificare:
     <select value={auroraOptions.sacrificeSlot} onChange={e=>setAuroraOption('sacrificeSlot',e.target.value)}>
      <option value="">Primo modulo operativo</option>
      {sacrificeOptions.map(m=><option key={m.id} value={m.slot}>{m.name} · {m.hp}/2</option>)}
     </select>
    </label>}
    {opticsActive&&player.deck.length>1&&<label>Ottica — ordina le prime due carte:
     <select value={auroraOptions.deckTopFlip?'reverse':'keep'} onChange={e=>setAuroraOption('deckTopFlip',e.target.value==='reverse')}>
      <option value="keep">{player.deck.slice(0,2).map(id=>card(id)?.name||card(id)?.nome||id).join(' → ')}</option>
      <option value="reverse">{player.deck.slice(0,2).reverse().map(id=>card(id)?.name||card(id)?.nome||id).join(' → ')}</option>
     </select>
    </label>}
    {selectedActions.includes('adapt')&&<>
     <label>Esclusiva da mettere sotto il mazzo:
      <select value={auroraOptions.exchangeCardId} onChange={e=>setAuroraOption('exchangeCardId',e.target.value)}>
       <option value="">Prima esclusiva disponibile</option>
       {adaptationOptions.map((id,i)=><option key={id+i} value={id}>{card(id)?.name||card(id)?.nome||id}</option>)}
      </select>
     </label>
     <label>Scegli fra le prime tre:
      <select value={auroraOptions.peekPickId} onChange={e=>setAuroraOption('peekPickId',e.target.value)}>
       <option value="">Prima carta disponibile</option>
       {topThree.map((id,i)=><option key={id+i} value={id}>{card(id)?.name||card(id)?.nome||id}</option>)}
      </select>
     </label>
    </>}
    {selectedActions.includes('cartographer')&&<label>Cartografo — cerca tra quattro carte:
     <select value={auroraOptions.cartographerPickId} onChange={e=>setAuroraOption('cartographerPickId',e.target.value)}>
      <option value="">Primo modulo individuato</option>
      {cartographerOptions.map((id,i)=><option key={id+i} value={id}>{card(id)?.name||card(id)?.nome||id}</option>)}
     </select>
    </label>}
    {selectedActions.includes('reconfigure')&&<label>Riconfigurazione — modulo sostitutivo:
     <select value={auroraOptions.reconfigureSelection} onChange={e=>setAuroraOption('reconfigureSelection',e.target.value)}>
      <option value="">Primo modulo compatibile</option>
      {reconfigChoices.map(c=><option key={c.slot+c.cardId} value={c.slot+':'+c.cardId}>{c.name} · {c.slot}</option>)}
     </select>
    </label>}
    {forkActive&&forkChoices.length>0&&<label>Cannone biforcato — secondo bersaglio:
     <select value={auroraOptions.secondarySelection} onChange={e=>setAuroraOption('secondarySelection',e.target.value)}>
      <option value="">Non dividere il colpo</option>
      {forkChoices.map(t=><option key={t.kind+t.id} value={t.kind+':'+t.id}>{t.name} · {t.hp}/{t.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('machine-deflection')&&prismaMachines.length>=2&&
     <label>Prisma di deviazione — macchina che intercetta:
      <select value={prismaOptions.redirectMachineId}
       onChange={e=>setPrismaOption('redirectMachineId',e.target.value)}>
       <option value="">Prima macchina operativa</option>
       {prismaMachines.map(m=><option key={m.id} value={m.id}>{m.name} · {m.hp}/{m.maxHp}</option>)}
      </select></label>}
    {selectedActions.includes('false-reflection')&&<label>Riflesso falso — proteggi questo possibile bersaglio secondario:
     <select value={prismaOptions.trapSelection} onChange={e=>setPrismaOption('trapSelection',e.target.value)}>
      <option value="">Primo bersaglio valido</option>
      {prismaTrapChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {selectedActions.includes('prisma-artisan')&&<label>Artigiana Prisma — destinazione preferita delle cariche:
     <select value={prismaOptions.artisanSelection} onChange={e=>setPrismaOption('artisanSelection',e.target.value)}>
      <option value="">Primo bersaglio compatibile</option>
      {prismaTrapChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {selectedActions.includes('lens-cut')&&<label>Taglio della lente — unità con protezione:
     <select value={prismaOptions.enemySelection} onChange={e=>setPrismaOption('enemySelection',e.target.value)}>
      <option value="">Prima unità con Difesa scoperta</option>
      {prismaUnitTargets.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {prismaAttack&&prismaSecondChoices.length>0&&<label>
     {prismaAttack==='reflected-shard'?'Scheggia riflessa — unità di rimbalzo:':
      'Colpo secondario — altra unità:'}
     <select value={prismaOptions.secondSelection} onChange={e=>setPrismaOption('secondSelection',e.target.value)}>
      <option value="">Prima unità diversa disponibile</option>
      {prismaSecondChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {prismaAttack==='crystal-rose'&&prismaThirdChoices.length>0&&<label>Rosa di cristallo — terza unità:
     <select value={prismaOptions.thirdSelection} onChange={e=>setPrismaOption('thirdSelection',e.target.value)}>
      <option value="">Prima terza unità disponibile</option>
      {prismaThirdChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {selectedActions.includes('frequency-analysis')&&<label>Analisi di frequenza — carta da scartare:
     <select value={corvoOptions.exchangeCardId} onChange={e=>setCorvoOption('exchangeCardId',e.target.value)}>
      <option value="">Prima carta non giocata</option>
      {player.hand.filter((id,i)=>!chosenCards.includes(i)).map((id,i)=>
       <option key={id+':'+i} value={id}>{card(id)?.nome||card(id)?.name||id}</option>)}
     </select>
    </label>}
    {(player.commander?.id==='ex-c03-01'||selectedActions.includes('resonant-commander'))&&
     player.deck.length>0&&<label><input type="checkbox" checked={corvoOptions.bottomTop}
       onChange={e=>setCorvoOption('bottomTop',e.target.checked)}/>
      Comandante Risonante: dopo un silenzio riuscito, sposta la prima carta sotto il mazzo
     </label>}
    {selectedActions.includes('marked-route')&&<label>Rotta marcata — vitale da segnare:
     <select value={linceOptions.routePartId} onChange={e=>setLinceOption('routePartId',e.target.value)}>
      <option value="">Usa il vitale selezionato</option>
      {enemy.ships[0].parts.filter(p=>p.hp>0&&!p.destroyed).map(p=>
       <option key={p.id} value={p.id}>{VITAL_LABELS[p.id]} · {p.hp}/{p.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('crimson-raid')&&<label>Incursione cremisi — modulo da scartare:
     <select value={linceOptions.sacrificeSlot} onChange={e=>setLinceOption('sacrificeSlot',e.target.value)}>
      <option value="">Primo modulo operativo</option>
      {liveModules(player).map(m=><option key={m.id} value={m.slot}>{m.name} · {m.hp}/{m.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('armed-disengage')&&installedModule(player,'weapon')&&
     <label><input type="checkbox" checked={linceOptions.linceRecallWeapon}
       onChange={e=>setLinceOption('linceRecallWeapon',e.target.checked)}/>
      Riprendi il modulo d’arma dopo il colpo, conservando i danni
     </label>}
    {heliosAvailable&&heliosDiscardChoices.length>0&&<>
     <label><input type="checkbox" checked={linceOptions.heliosTrade}
       onChange={e=>setLinceOption('heliosTrade',e.target.checked)}/>
      Pilota Helios: scarta una carta e pescane una dopo Aggiramento
     </label>
     {linceOptions.heliosTrade&&<label>Carta da scartare:
      <select value={linceOptions.heliosDiscardId} onChange={e=>setLinceOption('heliosDiscardId',e.target.value)}>
       <option value="">Prima carta disponibile</option>
       {heliosDiscardChoices.map((id,i)=><option key={id+i} value={id}>{card(id)?.nome||card(id)?.name||id}</option>)}
      </select>
     </label>}
    </>}
    {radentReady&&<label><input type="checkbox" checked={linceOptions.radentRecall}
      onChange={e=>setLinceOption('radentRecall',e.target.checked)}/>
     Propulsori radenti: richiama una macchina dopo Aggiramento riuscito
    </label>}
    {radentReady&&linceOptions.radentRecall&&<label>Macchina da richiamare:
     <select value={linceOptions.radentMachineId} onChange={e=>setLinceOption('radentMachineId',e.target.value)}>
      <option value="">Prima macchina operativa</option>
      {linceMachineChoices.map(m=><option key={m.id} value={m.id}>{m.name} · {m.hp}/{m.maxHp}</option>)}
     </select>
    </label>}
   </div>}
   <div className="live-actions f3d-actions">
    <span>CARTE {chosenCards.length}/3</span>
    <button type="button" disabled={ended||!myTurn} onClick={fire}>ATTACCA · CONFERMA</button>
    <button type="button" disabled={ended||!myTurn} onClick={passTurn}>PASSA</button>
    <button type="button" onClick={()=>setShowLog(v=>!v)}>{showLog?'CHIUDI':'REGISTRO'}</button>
    <button type="button" onClick={()=>setHelp({rules:true,terrain})}>REGOLE</button>
   </div>
   {!ended&&<button type="button" className="live-abandon" onClick={leave}
    aria-label="Abbandona la battaglia"><span aria-hidden="true">←</span> ABBANDONA</button>}
   <OriginalFleetBar side="A" unit={player} nickname={nickname}/>
   {message&&<div className="live-action-notice f3d-notice" role="status"
    key={lastFx?.nonce||message}>{message}</div>}
   {trapReveal&&<TrapReveal key={'trap-'+trapReveal.nonce} event={trapReveal}/>}
   {boss&&<button type="button" className="f3d-boss-label" title={boss.description} onClick={()=>setHelp({boss:true})}>
    {boss.name+' · '+boss.ability}
   </button>}
   {showLog&&<div className="official-log f3d-log" role="dialog" aria-label="Registro battaglia">
    <button type="button" onClick={()=>setShowLog(false)}>CHIUDI</button>
    {battle.log.slice(-12).map((e,i)=><p key={i}>{fleetEventText(e)}</p>)}
   </div>}
   {help&&<div className="f3d-escort-overlay" role="dialog" aria-label={help.rules?'Regole delle carte':help.boss?'Abilità del boss':help.trapId?'La tua trappola coperta':help.machine?'Macchina d’assalto':help.module?'Modulo montato':'Abilità scudiera'}>
    <button type="button" onClick={()=>setHelp(null)} aria-label="Chiudi">×</button>
    {help.rules?<>
     <strong>Regole delle carte</strong>
     {terrain&&<p><b>{readableTerrain}</b><br/>{TERRAIN_CATALOG[terrain]?.description||TERRAIN_CATALOG[terrain]?.effectText}</p>}
     {SIMPLE_RULES.map(rule=><p key={rule}>{rule}</p>)}
    </>:help.trapId?<>
     <strong>{card(help.trapId)?.nome||card(help.trapId)?.name}</strong>
     <p>{describeEffect(card(help.trapId),player.exclusiveUpgrades?.[help.trapId]||1)}</p>
     <small>{help.pending?'Conferma il turno per prepararla coperta.':'Resta coperta fino all’attivazione. L’avversario non vede questa carta.'}</small>
    </>:help.boss?<>
     <strong>{boss?.name}</strong><p>{boss?.description}</p>
     {terrain&&<p><b>{readableTerrain}</b><br/>{TERRAIN_CATALOG[terrain]?.description}</p>}
    </>:help.machine?<>
     <strong>{help.machine.name}</strong>
     <p>Protegge la madre finché è operativa. Potenza di supporto: {help.machine.power||0}.</p>
     <small>{help.machine.hp}/{help.machine.maxHp} punti · alloggiamento {help.machine.slot+1}</small>
    </>:help.module?<>
     <strong>{help.module.name}</strong>
     <p>Modulo {help.module.slot==='weapon'?'d’arma':'di utilità'} installato sulla nave madre.</p>
     <small>Integrità: {help.module.hp}/{help.module.maxHp} · distruggibile durante il combattimento</small>
    </>:<>
     <strong>{help.escort.name}</strong><small>{help.escort.role} · Grado {help.escort.grade||1}{help.escort.fused?' · FUSA':''}</small>
     <p>{describeEscortEffect(help.escort)}</p>
     <small>{help.linked?'COLLEGAMENTO ATTIVO':'COLLEGAMENTO INTERROTTO'}
      {' · '+help.escort.hp+'/'+help.escort.maxHp+' punti'}</small>
    </>}
   </div>}
   {ended&&<div className="live-end">
    <h2>{battle.winner==='A'?'VITTORIA':battle.winner==='B'?'SCONFITTA':'PAREGGIO'}</h2>
    <p>Turni {battle.ply} · {battle.bossName||displaySector||'Duello'}</p>
    {battle.finishReason&&<p>{battle.finishReason}</p>}
    <button type="button" disabled={busy||rewardDone} onClick={leave}>
     {busy?'SALVATAGGIO...':'CONFERMA E TORNA'}</button>
    <button type="button" onClick={restart}>RIGIOCA</button>
   </div>}
  </div>
 </div>;
}
