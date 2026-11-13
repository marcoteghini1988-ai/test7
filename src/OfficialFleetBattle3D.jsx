// Eclissi Stellare: nuovo motore tattico, PLANCIA 3D ORIGINALE invariata.
// Usa i medesimi pezzi, hardpoint, scudiere SVG, arena e geometria del
// renderer OfficialLiveBattle3D. NON usa FleetCardBattle.css né cards-site.
import React,{useEffect,useMemo,useState,useRef} from 'react';
import {ASSET_ROOT,MountedWeapons} from './ShipPresentation.jsx';
import {newVessel} from './mathDuelEngine.js';
import ShipPhysicalVitals from './ShipPhysicalVitals.jsx';
import {readShipCollection} from './shipCollection.js';
import {readSpecialCollection,createSpecialCollection,validateSpecialDeck} from './specialDeckBuilder.js';
import {readLegacyModuleLevels} from './tacticalEquipmentCards.js';
import {readLegacyEpicProgress} from './officialEpicOwnership.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {officialSpecialVisualMeta} from './officialSpecialVisualMeta.js';
import {OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {fleetEscortSkillDescription,readyFleetEscorts} from './fleetEscortSupports.js';
import {fleetCardEffect,fleetShipDestroyed,FLEET_ELEMENTS,
 createFleetCardBattle,resolveFleetCardRound,selectFleetAiOrder} from './fleetCardEngine.js';
import {fleetBossBrief} from './fleetBossPassives.js';
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
  const hp=Math.max(0,2-(mother.parts.find(p=>p.id===id)?.damage||0));
  return [key,{hp,max:2,exposed:true,signature:null}];
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
  const ships=readShipCollection(),specials=readSpecialCollection();
  if(!validateSpecialDeck(specials,specials.loadout).valid)
   throw new Error('Il mazzo speciale deve contenere 24 carte reali.');
  const owned=findMother(ships);
  if(!owned)throw new Error('Nessuna nave madre posseduta.');
  const boss=officialBossEncounter({mode,sectorNumber,planetId:bossPlanetId,
   sectorLevel:bossSectorLevel});
  const early=officialEarlyCampaignRivalShip({mode,sectorNumber,planetId:bossPlanetId});
  const motherEnemy=boss?.motherShipId||early||
   chooseCampaignMotherRival(owned.shipId,owned.level,sectorNumber,bossPlanetId,bossSectorLevel).shipId;
  const levelEnemy=officialCampaignRivalLevel({mode,sectorNumber,playerLevel:owned.level});
  const bossDeck=boss?buildTacticalBossDeck(boss.planetId,levelEnemy,owned.level):null;
  const fallback=createSpecialCollection().loadout;
  const enemyDeck=Array.isArray(bossDeck)&&bossDeck.length===24&&
   bossDeck.every(t=>SPECIAL_CARD_CATALOG[t])?bossDeck:fallback;
  return {battle:createFleetCardBattle({
   shipsA:[{shipId:owned.shipId,level:owned.level}],
   shipsB:[{shipId:motherEnemy,level:levelEnemy}],
   deckA:specials.loadout,deckB:enemyDeck,mode,bossName:boss?.name||null,
   bossId:boss?.planetId??null,bossLockedTerrain:!!boss,
   moduleLevelsA:readLegacyModuleLevels(),moduleLevelsB:{},
   seed:Math.floor(Math.random()*0x7fffffff)+1,nowMs:Date.now()
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
    selectedVital={selectedVital} canTarget={!player}
    onSelectVital={onSelectVital} knownVitals={PART_IDS}/>
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
 const damage=mother.parts.reduce((sum,p)=>sum+p.damage,0);
 const units=[...unit.escorts.slice(0,1).map(e=>({kind:'escort',hp:e.hp,max:e.max,link:
  e.skill.requires.every(id=>mother.parts.some(p=>p.id===id&&p.damage<2))})),
  {kind:'mother',hp:8-damage,max:8,link:mother.parts.filter(p=>p.damage<2).length/4},
  ...unit.escorts.slice(1,2).map(e=>({kind:'escort',hp:e.hp,max:e.max,link:
   e.skill.requires.every(id=>mother.parts.some(p=>p.id===id&&p.damage<2))}))];
 return <div className={'live-fleet-bar live-fleet-bar--'+side}>
  <strong>{side==='A'?(nickname||'TU'):'AVVERSARIO'}</strong>
  <div className="live-units">{units.map((u,i)=><div key={i}
    className={'live-unit'+(u.kind==='mother'?' live-unit--mother':'')}
    title={u.kind==='mother'?'Integrità dei quattro sistemi vitali':'Resistenza scudiera e collegamento madre'}>
    <span>{u.kind==='mother'?'MADRE':'SCUDIERA'}</span>
    <i className="live-unit-health"><b style={{width:pct(u.hp,u.max)+'%'}}/></i>
    <i className="live-unit-shield"><b style={{
     width:(typeof u.link==='number'?u.link*100:u.link?100:0)+'%'}}/></i>
   </div>)}</div>
 </div>;
}
function slotCards(side,lastCards,chosenCards=[]){
 const commander=side.commander?.type;
 const slots=[commander||null,null,null,null,null];
 const types=[...lastCards,...chosenCards].filter(Boolean);
 for(const type of types){
  const kind=fleetCardEffect(type).kind;
  if(kind==='character'){slots[0]=type;continue;}
  const targets=['guard','jam','repair'].includes(kind)?[1,2]:[3,4];
  const i=targets.find(index=>!slots[index]);
  if(i!=null)slots[i]=type;
 }
 return slots;
}
function OriginalSpecialSlots({side,contents}){
 return <div className={'live-slot-row live-slot-row--'+(side==='A'?'player':'enemy')}>
  {contents.map((type,i)=>{
   const face=type?SPECIAL_CARD_CATALOG[type]:null;
   const art=type?officialSpecialArtPath(type):null;
   return <div key={i} className={'live-slot'+(side==='B'?' live-slot--enemy':'')+
    (type?' live-slot--occupied':'')}
    title={face?(face.name||face.short||type):['Personaggio','Difesa','Difesa','Attacco','Attacco'][i]}
    data-slot-role={i===0?'personaggio':i<=2?'difesa':'attacco-supporto'}>
    {art?<img className="f3d-slot-art" src={art} alt="" draggable={false}/>:
     <span>{type?'✧':['♙','◇','◇','✧','✧'][i]}</span>}
    {!type&&<small className="live-slot-role">
     {['PERS.','DIF.','DIF.','ATT.','ATT.'][i]}</small>}
   </div>;
  })}
 </div>;
}
function OriginalSpecialHandCard({type,index,selected,disabled,onClick,offset}){
 const def=SPECIAL_CARD_CATALOG[type];
 const visual=officialSpecialVisualMeta(type);
 const art=officialSpecialArtPath(type);
 return <button type="button" disabled={disabled}
  className={'live-hand-special'+(selected?' live-chosen':'')}
  style={{'--special-angle':offset*5+'deg','--special-drop':offset**2*2.5+'px'}}
  data-family={visual?.role||fleetCardEffect(type).kind}
  data-rarity={visual?.rarity||undefined}
  title={(def?.name||type)+' · '+fleetCardEffect(type).description}
  aria-label={(def?.name||type)+' · '+fleetCardEffect(type).description}
  aria-pressed={selected} onClick={onClick}>
  {art?<img src={art} alt="" draggable={false}/>:
   <span className="live-special-art">✧</span>}
  <span className="live-card-emblem">✧</span>
  {visual?.rarity&&<span className="live-card-rarity">{visual.rarity}</span>}
  <span className="live-card-caption"><b>{def?.name||def?.short||type}</b>
   <small>{fleetCardEffect(type).description}</small></span>
 </button>;
}
export default function OfficialFleetBattle3D({
 nickname='Comandante',gameMode='campaign',sectorNumber=1,displaySector='',
 bossPlanetId=null,bossSectorLevel=null,onResult,onExit
}){
 const opts={mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel};
 const [session,setSession]=useState(()=>startSession(opts));
 const [battle,setBattle]=useState(session.battle);
 const [selectedVital,setSelectedVital]=useState('command');
 const [chosenCards,setChosenCards]=useState([]);
 const [scale,setScale]=useState(1);
 const [message,setMessage]=useState('');
 const [help,setHelp]=useState(null);
 const [lastFx,setLastFx]=useState(null);
 const [busy,setBusy]=useState(false);
 const [showLog,setShowLog]=useState(false);
 const [rewardDone,setRewardDone]=useState(false);
 const submitting=useRef(false);
 useEffect(()=>{
  const resize=()=>setScale(Math.max(.3,Math.min(innerWidth/450,innerHeight/800)));
  resize();window.addEventListener('resize',resize);
  return ()=>window.removeEventListener('resize',resize);
 },[]);
 function restart(){
  const next=startSession(opts);
  setSession(next);setBattle(next.battle);
  setSelectedVital('command');setChosenCards([]);setMessage('');
  setLastFx(null);setRewardDone(false);setHelp(null);
  submitting.current=false;
 }
 function unavailable(type,index){
  if(battle?.phase!=='playing')return 'Partita terminata';
  const effect=fleetCardEffect(type).kind;
  const player=battle.sides.A;
  if(battle.bossLockedTerrain&&effect==='terrain')return 'Terreno imposto dal boss';
  const generatorDestroyed=player.ships[0].parts.some(p=>p.id==='generator'&&p.destroyed);
  if(effect==='repair'&&generatorDestroyed)return 'Generatore distrutto';
  if(['fusion-twin','fusion-triad'].includes(type)&&readyFleetEscorts(player).length<2)
   return 'Servono entrambe le scudiere collegate (livello 5)';
  if(effect==='character'&&!chosenCards.includes(index)){
   if(player.commander?.until>=battle.round)return 'Personaggio già attivo';
   if(chosenCards.some(i=>fleetCardEffect(player.hand[i]).kind==='character'))
    return 'Un solo personaggio alla volta';
  }
  return '';
 }
 function chooseCard(index){
  const type=battle.sides.A.hand[index];
  const reason=unavailable(type,index);
  if(reason){setMessage(reason);return;}
  setMessage('');
  setChosenCards(old=>old.includes(index)?old.filter(i=>i!==index):
   old.length<2?[...old,index]:old);
 }
 function fire(){
  if(!battle||battle.phase!=='playing')return;
  const target=battle.sides.B.ships[0];
  const partId=target.parts.find(p=>p.id===selectedVital&&!p.destroyed)?
   selectedVital:target.parts.find(p=>!p.destroyed)?.id;
  if(!partId){setMessage('Nessun componente disponibile');return;}
  const enemyOrder=selectFleetAiOrder(battle);
  const result=resolveFleetCardRound(battle,
   {shipIndex:0,partId,cards:chosenCards},enemyOrder,Date.now());
  if(!result.ok){setMessage(result.reason);return;}
  setBattle(result.battle);
  setChosenCards([]);
  setLastFx({nonce:Date.now(),round:battle.round,events:result.events});
  setMessage(result.events.map(e=>e.text).join(' · '));
  const nextTarget=result.battle.sides.B.ships[0].parts.find(p=>!p.destroyed);
  if(!result.battle.sides.B.ships[0].parts.find(p=>p.id===partId&&!p.destroyed))
   if(nextTarget)setSelectedVital(nextTarget.id);
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
