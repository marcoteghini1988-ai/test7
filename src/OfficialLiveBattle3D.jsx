import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ASSET_ROOT,CARD_SUIT_COLORS,MountedWeapons} from './ShipPresentation.jsx';
import {newVessel,rankLabel} from './mathDuelEngine.js';
import ShipPhysicalVitals from './ShipPhysicalVitals.jsx';
import {VITAL_IDS,VITAL_LABELS,remainingExposureSlots} from './vitalDefense.js';
import {visibleTacticalSignature} from './tacticalIntelVisibility.js';
import {TACTICAL_SPECIALS} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,advanceOfficialLiveDuel,
 chooseOfficialLiveAiAction,supportedLiveSpecial,liveCompatibleShips,
 LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT} from './officialLiveDuelEngine.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {readShipCollection} from './shipCollection.js';
import {readSpecialCollection,claimFirstWinSpecialPack} from './specialDeckBuilder.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {readLegacyEpicProgress} from './officialEpicOwnership.js';
import {readLegacyModuleLevels} from './tacticalEquipmentCards.js';
import {bossCharacterDefinition,isBossCharacterCard} from './bossCharacterCards.js';
import {pvpTerrainDefinition,isPvpTerrain} from './pvpTerrainCards.js';
import {officialSpecialCardIdentity} from './officialSpecialCardIdentity.js';
import BossCharacterPortrait from './BossCharacterPortrait.jsx';
import PvpTerrainPortrait from './PvpTerrainPortrait.jsx';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';
import './OfficialLiveBattle3D.css';

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
function Fighter({side,snapshot,onVital,onShip}){
 const player=side==='player';
 const vessel=useMemo(()=>newVessel(snapshot.shipId,snapshot.level),[snapshot.shipId,snapshot.level]);
 const active=snapshot.escorts.filter(e=>e.hp>0);
 const visual={...vessel,defense:snapshot.defense};
 return <div className={'live-fighter live-fighter--'+side} data-live-drop={player?'ship':''}
  onClick={player?onShip:undefined} role={player?'button':undefined}
  tabIndex={player?0:undefined} aria-label={player?'Carica la navicella selezionata':undefined}
  onKeyDown={player?e=>{if(e.key==='Enter'||e.key===' ')onShip?.();}:undefined}>
  <div className="fleet-ship-wrap complete-ship focused official-mother"
   data-vital-weapons={snapshot.defense.parts.weapons.hp<=0?'destroyed':'healthy'}
   style={{left:'50%',top:0,width:316,height:206,zIndex:3}}>
   <ShipPhysicalVitals side={side} vessel={visual} defense={snapshot.defense}
    canTarget={!player} onSelectVital={onVital} knownVitals={[]}/>
   <MountedWeapons side={side} vessel={visual} index={0} effect={null}/>
  </div>
  {snapshot.escorts.map((escort,i)=><div key={escort.id}
   className={'live-escort live-escort--'+i+(escort.hp===0?' live-escort--lost':'')}
   data-live-drop={player?'escort-'+i:undefined}
   aria-label={'Scudiera '+(i+1)+' · '+escort.hp+' HP'}>
   <img src={ASSET_ROOT+'/escorts/'+snapshot.shipId+'_escort_'+(i+1)+'.svg'}
    alt={'Scudiera '+(i+1)} draggable={false}/>
  </div>)}
  <span className="live-fleet-caption">{snapshot.name+' · '+active.length+' scudiere'}</span>
 </div>;
}
function FleetBar({keySide,side,nickname}){
 const motherVital=VITAL_IDS.filter(id=>side.defense.parts[id].hp>0).length;
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
 </div>;
}
function Slot({kind,index,side,card,onActivate,selected}){
 const isTrap=kind==='trap';
 const visible=!!card&&(side==='A'||!isTrap);
 const symbol=kind==='character'?'♙':kind==='trap'?'◇':'✧';
 const label=kind==='character'?'Personaggio':isTrap?'Trappola':'Speciale';
 return <button type="button" className={'live-slot'+(side==='B'?' live-slot--enemy':'')+
   (card?' live-slot--occupied':'')+(selected?' live-slot--chosen':'')}
  data-live-drop={side==='A'?(kind==='character'?'character':kind+'-'+index):undefined}
  title={visible?TACTICAL_SPECIALS[card?.type]?.name||label:label}
  aria-label={label+(card?' · '+(visible?TACTICAL_SPECIALS[card.type]?.name:'coperta'):' · vuoto')}
  onClick={onActivate}>
  <span>{visible?(card?officialSpecialCardIdentity(card.type,TACTICAL_SPECIALS[card.type]).symbol:symbol):
   card?'?':symbol}</span>
 </button>;
}
function LiveSpecialArt({card}){
 const identity=officialSpecialCardIdentity(card?.type,TACTICAL_SPECIALS[card?.type]);
 return <>{isBossCharacterCard(card?.type)?<BossCharacterPortrait type={card.type}/>:
  isPvpTerrain(card?.type)?<PvpTerrainPortrait type={card.type}/>:
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
 const [chosen,setChosen]=useState(null),[vital,setVital]=useState(null);
 const [message,setMessage]=useState(''),[details,setDetails]=useState(false);
 const [busy,setBusy]=useState(false);
 const claimed=useRef(false);
 const [scale,setScale]=useState(1);
 useEffect(()=>{
  const resize=()=>setScale(Math.max(.3,Math.min(innerWidth/450,innerHeight/800)));
  resize();window.addEventListener('resize',resize);
  return ()=>window.removeEventListener('resize',resize);
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
  claimed.current=false;setSession(next);setBattle(next.battle);
  setChosen(null);setVital(null);setMessage('');setDetails(false);
 }
 function action(intent){
  if(!battle)return;
  const result=applyOfficialLiveAction(battle,'A',intent,Date.now());
  if(!result.ok){setMessage('Azione non valida: '+result.reason.replaceAll('_',' '));return false;}
  setBattle(result.battle);setMessage('');
  setChosen(null);
  return true;
 }
 function selectCard(kind,id){setChosen(old=>old?.kind===kind&&old?.id===id?null:{kind,id});}
 function useSelected(target,extra={}){
  if(!chosen||!battle||battle.activeSide!=='A')return;
  const me=battle.sides.A;
  const cards=chosen.kind==='numeric'?me.numeric.hand:me.special.hand;
  const index=cards.findIndex(c=>c.id===chosen.id);
  if(index<0)return setChosen(null);
  if(chosen.kind==='numeric'){
   if(target==='ship'||target.startsWith('escort-'))
    action({type:'numeric',index,target:'ship',shipId:target==='ship'?'mother':target});
   else if(target==='vital'&&vital)
    action({type:'numeric',index,target:'vital',vitalId:vital});
  }else{
   action({type:'special',index,slot:target,...extra});
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
   if(target==='ship'||target.startsWith('escort-'))
    action({type:'numeric',index,target:'ship',shipId:target==='ship'?'mother':target});
   else if(target==='vital'&&vital)action({type:'numeric',index,target:'vital',vitalId:vital});
  }else action({type:'special',index,slot:target});
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
    try{claimFirstWinSpecialPack(gameMode,sectorNumber);}catch{}
    try{await claimCampaignShipUnlock(gameMode,sectorNumber);}catch{}
    try{claimBossCharacterFromVictory({winner:result.winner,mode:gameMode,
     sectorNumber,bossPlanetId,bossSectorLevel});}catch{}
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
 const myTurn=battle.phase==='playing'&&battle.activeSide==='A';
 const seconds=Math.max(0,Math.ceil((battle.deadlineMs-now)/1000));
 const terrain=battle.activeTerrain?pvpTerrainDefinition(battle.activeTerrain.id):null;
 const targeted=vital&&enemy.defense.parts[vital];
 const exposed=targeted?.exposed;
 const activeSlots=VITAL_IDS.filter(id=>enemy.defense.parts[id].hp>0&&enemy.defense.parts[id].exposed);
 const canExpose=remainingExposureSlots(enemy.defense)>0;
 const cannotAct=!myTurn||battle.phase==='finished';
 const last=battle.history.at(-1);
 const result=battle.phase==='finished'?officialBattleResult(battle,gameMode,sectorNumber):null;
 return <div className="es-math-scope live-viewport">
  <div className="es-root official-duel-3d live-root"
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
    if(kind==='numeric'&&(slot==='ship'||slot.startsWith('escort-')))
     action({type:'numeric',index,target:'ship',shipId:slot==='ship'?'mother':slot});
    else if(kind==='numeric'&&slot==='vital'&&vital)
     action({type:'numeric',index,target:'vital',vitalId:vital});
    else if(kind==='special')action({type:'special',index,slot});
   }}
   style={{transform:'translate(-50%,-50%) scale('+scale+')'}}>
   <div className="space-back metal-arena live-background" aria-hidden="true"
    style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
   {terrain&&<div className="live-terrain-scene" data-terrain={terrain.id}
    style={{backgroundImage:'url('+ASSET_ROOT+'/terrain-pvp/'+terrain.id+'.svg)'}}/>}
   <FleetBar keySide="B" side={enemy}/>
   <Fighter side="enemy" snapshot={enemy} onVital={id=>{
    if(!myTurn)return;
    setVital(id);
    const part=enemy.defense.parts[id];
    if(part.hp>0&&!part.exposed)action({type:'expose',vitalId:id});
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
     data-live-drop="terrain" onClick={()=>useSelected('terrain')}
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
   <Fighter side="player" snapshot={player} onShip={()=>useSelected('ship')}/>
   <div className="live-deck live-deck--numeric" aria-label="Mazzo numerico"><span>ϟ</span></div>
   <div className="live-deck live-deck--special" aria-label="Mazzo speciale"><span>✧</span></div>
   <div className="live-special-hand" role="group" aria-label="Cinque carte speciali">
    {player.special.hand.map(card=>{
     const face=officialSpecialCardIdentity(card.type,TACTICAL_SPECIALS[card.type]);
     return <button type="button" key={card.id} disabled={cannotAct}
      className={'live-hand-special'+(chosen?.id===card.id?' live-chosen':'')}
      title={face.name+' · '+face.effect}
      aria-label={face.name+' · '+(supportedLiveSpecial(card.type)?face.effect:'effetto in migrazione')}
      aria-pressed={chosen?.id===card.id}
      onClick={()=>selectCard('special',card.id)}
      onTouchEnd={e=>touchRelease(e,'special',card.id)}
      draggable={!cannotAct}
      onDragStart={e=>e.dataTransfer.setData('text/plain','special:'+card.id)}>
      <LiveSpecialArt card={card}/>
     </button>;
    })}
   </div>
   <div className="live-number-hand" role="group" aria-label="Sette carte numeriche">
    {player.numeric.hand.map(card=><button key={card.id} type="button" disabled={cannotAct}
     className={'live-number-card'+(chosen?.id===card.id?' live-chosen':'')}
     style={{'--live-suit':CARD_SUIT_COLORS[card.suit]}}
     aria-pressed={chosen?.id===card.id} aria-label={rankLabel(card.value)+card.suit}
     onClick={()=>selectCard('numeric',card.id)}
     onTouchEnd={e=>touchRelease(e,'numeric',card.id)}
     draggable={!cannotAct}
     onDragStart={e=>e.dataTransfer.setData('text/plain','numeric:'+card.id)}>
     <small>{card.suit}</small><b>{rankLabel(card.value)}</b><small>{card.suit}</small>
    </button>)}
   </div>
   <div className="live-actions">
    <span>{'NUMERICHE '+battle.actionUsed.numeric+'/'+LIVE_NUMERIC_LIMIT+
     ' · SPECIALI '+battle.actionUsed.special+'/'+LIVE_SPECIAL_LIMIT}</span>
    <button type="button" disabled={cannotAct} onClick={()=>action({type:'end'})}>PASSA TURNO</button>
    <button type="button" onClick={()=>setDetails(v=>!v)} aria-label="Regole e registro">?</button>
   </div>
   <FleetBar keySide="A" side={player} nickname={nickname}/>
   {last&&<div className="live-action-notice" key={battle.history.length}
    role="status" data-event={last.kind}>{last.message}</div>}
   {message&&<div className="live-validation" role="alert">{message}</div>}
   {vital&&targeted&&targeted.hp>0&&<div className="live-vital-panel" role="dialog"
    aria-label={'Combinazione del '+VITAL_LABELS[vital]}>
    <div className="live-vital-panel-head">
     <b>{VITAL_LABELS[vital]}</b><span>{exposed?'ESPOSTO':'PROTETTO'}</span>
     <button type="button" onClick={()=>setVital(null)}>×</button>
    </div>
    <div className="live-vital-slots">
     {Array.from({length:Math.max(3,battle.vitalBuilds.A[vital].length+1)},(_,i)=>{
      const c=battle.vitalBuilds.A[vital][i];
      return <button key={i} type="button" disabled={!myTurn||!exposed}
       data-live-drop="vital" onClick={()=>useSelected('vital')}>
       {c?rankLabel(c.value)+c.suit:'+'}
      </button>;
     })}
    </div>
    <small>{visibleTacticalSignature(player,enemy,vital)?
     'Deposita le numeriche: la combinazione valida distrugge il pezzo immediatamente':
     'Firma non ancora scoperta'}</small>
    <button type="button" disabled={!myTurn||!battle.vitalBuilds.A[vital].length}
     onClick={()=>action({type:'clearVital',vitalId:vital})}>SCARTA COMBINAZIONE</button>
   </div>}
   {details&&<div className="live-info">
    <h3>DUELLO LIVE · REGOLE</h3>
    <p>Turni alternati da 30s. Le armi sparano solo caricando numeriche del seme compatibile.
     Massimo tre numeriche e due speciali per turno. Le azioni sono immediate.</p>
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
   {result&&<div className="live-end">
    <h2>{result.winner==='player'?'VITTORIA':result.winner==='enemy'?'SCONFITTA':'PAREGGIO'}</h2>
    <p>{'Turni '+battle.turn+' · '+(session.bossEncounter?.name||displaySector||'Duello')}</p>
    <button type="button" disabled={busy} onClick={leave}>CONFERMA E TORNA</button>
   </div>}
  </div>
 </div>;
}
