// Eclissi Stellare: nuovo motore tattico, PLANCIA 3D ORIGINALE invariata.
// Usa i medesimi pezzi, hardpoint, scudiere SVG, arena e geometria del
// renderer OfficialLiveBattle3D. NON usa FleetCardBattle.css né cards-site.
import React,{useEffect,useMemo,useState,useRef} from 'react';
import {ASSET_ROOT,MountedWeapons} from './ShipPresentation.jsx';
import {newVessel} from './mathDuelEngine.js';
import ShipPhysicalVitals from './ShipPhysicalVitals.jsx';
import {readShipCollection} from './shipCollection.js';
import {readLegacyModuleLevels} from './tacticalEquipmentCards.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {fleetEscortSkillDescription} from './fleetEscortSupports.js';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,STARTER_DECK,card,cardRole,deckFromCounts} from './fleetNext/rules.js';
import {readFleetInventory,writeFleetInventory,claimFleetReward,fleetRewardForBattle} from './fleetNext/collection.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,timeoutFleetTurn} from './fleetNext/combat.js';
import {TERRAIN_CATALOG} from './fleetNext/terrains.js';
import {fleetImpactVisual} from './fleetBattleVisuals.js';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';
import './OfficialLiveBattle3D.css';
import './OfficialFleetBattle3D.css';

const LOADOUT_KEY='eclissi_card_fleet_v1';
const PART_IDS=['engine','weapons','generator','command'];
const VITAL_LABELS={engine:'Motori',weapons:'Armi',generator:'Generatore',command:'Centralina'};
const pct=(n,d)=>d>0?Math.round(Math.max(0,Math.min(1,n/d))*100):0;
function activeEscort(e){return e.hp>0&&!e.destroyed;}
function projectDefense(mother){
 const parts=Object.fromEntries(PART_IDS.map(id=>{
  const key=id==='generator'?'shieldGenerator':id;
  const part=mother.parts.find(p=>p.id===id);
  const hp=part?Math.max(0,Math.ceil(2*part.hp/part.maxHp)):2;
  return [key,{hp,max:2,unlocked:!!part,exposed:!!part,signature:null}];
 }));
 return {kind:'mother',shipId:mother.id,parts,shield:{hp:0,max:1},exposureOrder:[]};
}
function findMother(ships){
 const available=new Map(ships.cards.map(card=>[card.shipId,card]));
 let selected=[];
 try{selected=JSON.parse(localStorage.getItem(LOADOUT_KEY)||'[]');}catch{selected=[];}
 const selectedId=Array.isArray(selected)?selected.find(id=>available.has(id)):null;
 const equipped=ships.loadout.map(id=>ships.cards.find(c=>c.instanceId===id)).find(Boolean);
 return available.get(selectedId)||equipped||ships.cards[0]||null;
}
function startSession({mode,sectorNumber,bossPlanetId,bossSectorLevel}){
 try{
  const ships=readShipCollection(),inventory=readFleetInventory();
  const owned=findMother(ships);
  if(!owned)throw new Error('Nessuna nave madre posseduta.');
  const boss=officialBossEncounter({mode,sectorNumber,planetId:bossPlanetId,
   sectorLevel:bossSectorLevel});
  const early=officialEarlyCampaignRivalShip({mode,sectorNumber,planetId:bossPlanetId});
  const motherEnemy=boss?.motherShipId||early||
   chooseCampaignMotherRival(owned.shipId,owned.level,sectorNumber,bossPlanetId,bossSectorLevel).shipId;
  const levelEnemy=officialCampaignRivalLevel({mode,sectorNumber,playerLevel:owned.level});
  return {battle:createFleetNextBattle({
   shipA:owned.shipId,levelA:owned.level,
   shipB:motherEnemy,levelB:levelEnemy,
   deckA:inventory.deck,deckB:deckFromCounts(STARTER_DECK.carteGenerali),
   upgradesA:inventory.exclusiveUpgrades,
   mode,bossName:boss?.name||null,bossId:boss?.planetId??null,
   sectorNumber,seed:Math.floor(Math.random()*0x7fffffff)+1,
   nowMs:Date.now()
  }),error:''};
 }catch(e){return {battle:null,error:e?.message||'Battaglia non disponibile'};}
}
// Questa è esattamente la formazione spaziale 3D precedente:
// nave centrale 316×206 con ShipPhysicalVitals/MountedWeapons,
// scudiere nelle posizioni originali left:45/right:45, stessa arena.
function OriginalFleetFighter({side,unit,selectedVital,onSelectVital,impact,inspectEscort}){
 const player=side==='player';
 const mother=unit.ships[0];
 const vessel=useMemo(()=>newVessel(mother.id,mother.level),[mother.id,mother.level]);
 const defense=useMemo(()=>projectDefense(mother),[mother]);
 const currentImpact=impact?.escortDamage>0?null:fleetImpactVisual(impact);
 return <div className={'live-fighter live-fighter--'+side}>
  <div className="fleet-ship-wrap complete-ship focused official-mother"
   data-vital-weapons={mother.parts.find(p=>p.id==='weapons')?.destroyed?'destroyed':'healthy'}
   style={{left:'50%',top:0,width:316,height:206,zIndex:3}}>
   <ShipPhysicalVitals side={side} vessel={{...vessel,defense}} defense={defense}
    selectedVital={selectedVital==='generator'?'shieldGenerator':selectedVital}
    canTarget={!player} onSelectVital={id=>onSelectVital?.(id==='shieldGenerator'?'generator':id)}
    knownVitals={['engine','weapons','shieldGenerator','command']}/>
   <MountedWeapons side={side} vessel={vessel} index={0}/>
   {currentImpact&&<img key={(impact?.round||0)+currentImpact.kind}
    className="f3d-impact f3d-impact--mother" src={currentImpact.image}
    alt="" aria-hidden="true"/>}
  </div>
  {unit.escorts.map((escort,i)=>{
   const tookHit=impact?.escortSlot===i&&impact?.escortDamage>0;
   const linked=escort.skill.requires.every(id=>
    mother.parts.some(p=>p.id===id&&p.damage<2));
   return <div key={escort.id} className={'live-escort live-escort--'+i+
    (escort.hp===0?' live-escort--lost':'')}
    title={escort.name+' · '+fleetEscortSkillDescription(escort)}>
    <img src={ASSET_ROOT+'/escorts/'+mother.id+'_escort_'+(i+1)+'.svg'}
     alt={escort.name} draggable={false}/>
    <span className="f3d-escort-health" aria-label={'Resistenza '+escort.hp+' di '+escort.maxHp}>
     <i style={{width:pct(escort.hp,escort.maxHp)+'%'}}/>
    </span>
    {tookHit&&<img key={impact.round+'-hit-'+i} className="f3d-impact f3d-impact--escort"
     src={ASSET_ROOT+'/battle-fx/shield-contact.png'} alt="" aria-hidden="true"/>}
    <button type="button" className="f3d-escort-info"
     onClick={()=>inspectEscort({escort,mother,linked})}
     aria-label={'Abilità della scudiera '+escort.name}>i</button>
   </div>;
  })}
  <span className="live-fleet-caption">{mother.name+' · '+
   unit.escorts.filter(activeEscort).length+' scudiere'}</span>
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
function slotCards(side,chosenCards=[]){
 const slots=[side.commander?.id||null,
  ...(side.defenseSlots||[]).slice(0,2),
  ...(side.attackSlots||[]).slice(0,3)];
 while(slots.length<6)slots.push(null);
 for(const type of chosenCards){
  const role=cardRole(type),family=GENERAL_CARDS[type]?.famiglia||'';
  const target=role==='character'?[0]:role==='terrain'?[]:
   role==='defense'||(role==='support'&&/riparazione|guardia|recupero|scudiera/.test(family))?[1,2]:[3,4,5];
  if(target.length===1){slots[0]=type;continue;}
  const i=target.find(index=>!slots[index]);
  if(i!=null)slots[i]=type;
 }
 return slots.slice(0,6);
}
function OriginalSpecialSlots({side,contents}){
 const labels=['PERS.','DIF.','DIF.','ATT.','ATT.','ATT.'];
 return <div className={'live-slot-row live-slot-row--'+(side==='A'?'player':'enemy')}>
  {contents.map((type,i)=>{
   const face=type?card(type):null;
   const art=type&&!GENERAL_CARDS[type]&&!EXCLUSIVE_CARDS[type]?officialSpecialArtPath(type):null;
   return <div key={i} className={'live-slot'+(side==='B'?' live-slot--enemy':'')+
    (type?' live-slot--occupied':'')}
    title={face?(face.nome||face.name||type):labels[i]}
    data-slot-role={i===0?'personaggio':i<=2?'difesa':'attacco'}>
    {art?<img className="f3d-slot-art" src={art} alt="" draggable={false}/>:
     <span>{type?'✧':['♙','◇','◇','✧','✧','✧'][i]}</span>}
    {!type&&<small className="live-slot-role">{labels[i]}</small>}
   </div>;
  })}
 </div>;
}
function OriginalSpecialHandCard({type,index,selected,disabled,onClick,offset}){
 const def=card(type);
 const rarity=def?.rarita||def?.rarityDraft||'Comune';
 const description=def?.effetto||def?.effectProposed||'Carta tattica';
 const name=def?.nome||def?.name||type;
 const art=!GENERAL_CARDS[type]&&!EXCLUSIVE_CARDS[type]?officialSpecialArtPath(type):null;
 return <button type="button" disabled={disabled}
  className={'live-hand-special'+(selected?' live-chosen':'')}
  style={{'--special-angle':offset*3+'deg','--special-drop':offset**2*1.4+'px'}}
  data-family={cardRole(type)||'support'} data-rarity={rarity}
  title={name+' · '+description}
  aria-label={name+' · '+description}
  aria-pressed={selected} onClick={onClick}>
  {art?<img src={art} alt="" draggable={false}/>:
   <span className="live-special-art">✧</span>}
  <span className="live-card-emblem">✧</span>
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
 const [selectedVital,setSelectedVital]=useState('engine');
 const [chosenCards,setChosenCards]=useState([]);
 const [scale,setScale]=useState(1);
 const [message,setMessage]=useState('');
 const [help,setHelp]=useState(null);
 const [lastFx,setLastFx]=useState(null);
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
 // Anche il nemico segue l'alternanza dei turni. Nel PvP attuale resta IA simulata.
 useEffect(()=>{
  if(!battle||battle.phase!=='playing'||battle.turn!=='B')return;
  const id=window.setTimeout(()=>{
   const ai=autoFleetTurn(battle,'B');
   const result=resolveFleetNextTurn(battle,'B',ai,Date.now());
   if(result.ok){
    setBattle(result.battle);
    setLastFx({nonce:Date.now(),round:battle.round,events:result.events});
    setMessage(result.events.slice(-2).map(e=>e.text).join(' · '));
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
  setSelectedVital('engine');setChosenCards([]);setMessage('');
  setLastFx(null);setRewardDone(false);setHelp(null);
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
  return '';
 }
 function chooseCard(index){
  const type=battle.sides.A.hand[index];
  const reason=unavailable(type,index);
  if(reason){setMessage(reason);return;}
  setMessage('');
  setChosenCards(old=>old.includes(index)?old.filter(i=>i!==index):
   old.length<3?[...old,index]:old);
 }
 function fire(){
  if(!battle||battle.phase!=='playing'||battle.turn!=='A')return;
  const target=battle.sides.B.ships[0];
  const partId=target.parts.find(p=>p.id===selectedVital&&!p.destroyed)?
   selectedVital:target.parts.find(p=>!p.destroyed)?.id;
  if(!partId){setMessage('Nessun componente disponibile');return;}
  const result=resolveFleetNextTurn(battle,'A',
   {partId,cards:chosenCards},Date.now());
  if(!result.ok){setMessage(result.reason);return;}
  setBattle(result.battle);setChosenCards([]);
  setLastFx({nonce:Date.now(),round:battle.round,events:result.events});
  setMessage(result.events.slice(-2).map(e=>e.text).join(' · '));
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
   }
   const me=battle.sides.A,op=battle.sides.B;
   const max=8+me.escorts.reduce((sum,e)=>sum+e.maxHp,0);
   const hp=me.ships[0].parts.reduce((sum,p)=>sum+2-p.damage,0)+
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
     damageDealt:op.ships[0].parts.reduce((sum,p)=>sum+p.damage,0),
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
 const lastPlayer=lastFx?.events?.[0]?.played||[];
 const lastEnemy=lastFx?.events?.[1]?.played||[];
 const chosenTypes=chosenCards.map(i=>player.hand[i]).filter(Boolean);
 const playerSlots=slotCards(player,lastPlayer,chosenTypes);
 const enemySlots=slotCards(enemy,lastEnemy);
 const lastNote=chosenCards.map(i=>fleetCardEffect(player.hand[i]).description).join(' + ');
 const selectedType=chosenCards.length?player.hand[chosenCards.at(-1)]:null;
 const terrain=battle.terrain?.element;
 const boss=fleetBossBrief(battle);
 const readableTerrain=terrain?FLEET_ELEMENTS[terrain]?.name:'NEUTRO';
 return <div className="es-math-scope live-viewport">
  <div className="es-root official-duel-3d live-root f3d-original-arena"
   style={{transform:'translate(-50%,-50%) scale('+scale+')',
    '--live-special-back':'url("'+OFFICIAL_SPECIAL_FIXED_BACK+'")'}}>
   <div className="space-back metal-arena live-background" aria-hidden="true"
    style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
   <OriginalFleetBar side="B" unit={enemy}/>
   <OriginalFleetFighter side="enemy" unit={enemy} selectedVital={actualVital}
    onSelectVital={id=>{if(!ended){setSelectedVital(id);setMessage('');}}}
    impact={lastFx?.events?.[0]&&{...lastFx.events[0],round:lastFx.nonce}}
    inspectEscort={setHelp}/>
   <OriginalSpecialSlots side="B" contents={enemySlots}/>
   <div className="live-midline">
    <span className="live-turn-indicator" data-active="A">
     {ended?'FINE PARTITA':'ROUND '+battle.round} · {VITAL_LABELS[actualVital]||'VITALI'}
    </span>
    <button className="live-terrain-slot" type="button"
     title={'Risonanza del terreno: '+readableTerrain}
     data-terrain={terrain||undefined} disabled>
     {readableTerrain}
    </button>
   </div>
   <OriginalSpecialSlots side="A" contents={playerSlots}/>
   <OriginalFleetFighter side="player" unit={player}
    impact={lastFx?.events?.[1]&&{...lastFx.events[1],round:lastFx.nonce}}
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
   <div className="live-special-hand" role="group" aria-label="Cinque carte speciali">
    {player.hand.map((type,index,hand)=><OriginalSpecialHandCard
     key={battle.round+'-'+index+'-'+type} type={type} index={index}
     offset={index-(hand.length-1)/2}
     selected={chosenCards.includes(index)} disabled={ended}
     onClick={()=>chooseCard(index)}/>)}
   </div>
   {!ended&&<div className="f3d-target-status" role="status">
    BERSAGLIO: {VITAL_LABELS[actualVital]||'—'} · {target.name}
   </div>}
   {selectedType&&!ended&&<div className="live-card-inspector" role="status">
    <b>{SPECIAL_CARD_CATALOG[selectedType]?.name||selectedType}</b>
    <p>{lastNote}</p>
   </div>}
   <div className="live-actions f3d-actions">
    <span>SPECIALI {chosenCards.length}/2</span>
    <button type="button" disabled={ended} onClick={fire}>ATTACCO MADRE · CONFERMA</button>
    <button type="button" onClick={()=>setShowLog(v=>!v)}>{showLog?'CHIUDI':'REGISTRO'}</button>
   </div>
   {!ended&&<button type="button" className="live-abandon" onClick={leave}
    aria-label="Abbandona la battaglia"><span aria-hidden="true">←</span> ABBANDONA</button>}
   <OriginalFleetBar side="A" unit={player} nickname={nickname}/>
   {message&&<div className="live-action-notice f3d-notice" role="status"
    key={lastFx?.nonce||message}>{message}</div>}
   {boss&&<div className="f3d-boss-label" title={boss.description}>
    {boss.name+' · '+boss.ability}
   </div>}
   {showLog&&<div className="official-log f3d-log" role="dialog" aria-label="Registro battaglia">
    <button type="button" onClick={()=>setShowLog(false)}>CHIUDI</button>
    {battle.log.slice(-12).map((e,i)=><p key={i}>{e.text}</p>)}
   </div>}
   {help&&<div className="f3d-escort-overlay" role="dialog" aria-label="Abilità scudiera">
    <button type="button" onClick={()=>setHelp(null)} aria-label="Chiudi">×</button>
    <strong>{help.escort.name}</strong><small>{help.escort.role}</small>
    <p>{fleetEscortSkillDescription(help.escort)}</p>
    <small>{help.linked?'COLLEGAMENTO ATTIVO':'COLLEGAMENTO INTERROTTO'}
     {' · '+help.escort.hp+'/'+help.escort.maxHp+' HP'}</small>
   </div>}
   {ended&&<div className="live-end">
    <h2>{battle.winner==='A'?'VITTORIA':battle.winner==='B'?'SCONFITTA':'PAREGGIO'}</h2>
    <p>Round {battle.round} · {battle.bossName||displaySector||'Duello'}</p>
    <button type="button" disabled={busy||rewardDone} onClick={leave}>
     {busy?'SALVATAGGIO...':'CONFERMA E TORNA'}</button>
    <button type="button" onClick={restart}>RIGIOCA</button>
   </div>}
  </div>
 </div>;
}
