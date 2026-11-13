import React,{useState} from 'react';
import {readShipCollection} from './shipCollection.js';
import {readSpecialCollection,createSpecialCollection,validateSpecialDeck} from './specialDeckBuilder.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {readLegacyModuleLevels} from './tacticalEquipmentCards.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {fleetBossBrief} from './fleetBossPassives.js';
import {fleetShipPassive,activeFleetSynergies} from './fleetShipPassives.js';
import {fleetVolleyVisuals,fleetImpactVisual} from './fleetBattleVisuals.js';
import {
 createFleetCardBattle,resolveFleetCardRound,selectFleetAiOrder,fleetSlotCount,
 FLEET_PARTS,FLEET_ELEMENTS,fleetCardEffect,fleetShipDestroyed
} from './fleetCardEngine.js';
import './FleetCardBattle.css';

const LOADOUT_KEY='eclissi_card_fleet_v1';
const SLOT_PROGRESS_KEY='eclissi_card_fleet_max_sector_v1';
const SHIP_IMG_ROOT='/assets/mathfleet/views/';
const raritiesWithWebp=new Set(['Rara','Epica','Leggendaria']);
const SHIP_NAMES=new Map(PHASE1_CATALOG.ships.map(ship=>[ship.id,ship.nome]));
const glyphs={engine:'◉',weapons:'✦',generator:'⬡',command:'⌘'};
const textName=id=>FLEET_PARTS.find(p=>p.id===id)?.name||id;
function getAssets(){
 try{
  const ships=readShipCollection();
  const specials=readSpecialCollection();
  if(!validateSpecialDeck(specials,specials.loadout).valid)
   throw new Error('Configura prima un mazzo speciale valido da 24 carte.');
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem(LOADOUT_KEY)||'[]');}catch{saved=[];}
  const available=ships.cards.map(c=>c.shipId);
  const valid=Array.isArray(saved)?[...new Set(saved.filter(id=>available.includes(id)))]:[];
  const fallback=ships.loadout.map(id=>ships.cards.find(c=>c.instanceId===id)?.shipId)
   .filter(Boolean);
  const maxSeen=Math.max(1,Math.floor(Number(localStorage.getItem(SLOT_PROGRESS_KEY))||1));
  const moduleLevels=readLegacyModuleLevels();
  return {ships,specials,selected:[valid[0]||fallback[0]||'N00'],maxSeen,moduleLevels,error:''};
 }catch(error){return {ships:null,specials:null,selected:[],error:error?.message||'Inventario non leggibile'};}
}
function ShotShip({ship,enemy=false,selected=false,onClick,compact=false,slotIndex=0,impactEvent=null,impactNonce=0}){
 const sunk=fleetShipDestroyed(ship),element=FLEET_ELEMENTS[ship.element];
 const format=raritiesWithWebp.has(ship.rarity)?'webp':'png';
 const slotClass=slotIndex===0?'fc-slot-mother':slotIndex===1?'fc-slot-left':'fc-slot-right';
 const image=SHIP_IMG_ROOT+(enemy?'enemy_to_player/':'player_to_enemy/')+ship.id+'_complete.'+format;
 const impact=impactEvent?.shipIndex===slotIndex&&!impactEvent?.escortDamage?fleetImpactVisual(impactEvent):null;
 return <button type="button" className={'fc-ship '+slotClass+' '+(selected?'fc-selected ':'')+(sunk?'fc-sunk ':'')+
  (compact?'fc-compact ':'')+(enemy?'fc-hostile':'fc-friendly')}
  onClick={onClick} disabled={!onClick||sunk}
  title={ship.name+' · '+ship.role+' · '+element.name+' · '+(ship.passive?.description||'')}>
   <div className="fc-ship-top"><span className="fc-tier">{ship.rarity} · LV {ship.level}</span>
    <b>{ship.name}</b><small>ARMI {ship.weapons.length} · POTENZA {ship.weaponRating}</small>
     <small className="fc-passive-label">✦ {ship.passive?.name||'Nessuna passiva'}</small></div>
   <div className="fc-ship-picture">
    <img src={image} alt={'Navicella '+ship.name} draggable={false}/>
    <span className="fc-element" style={{color:element.color}}>{element.symbol} {element.name}</span>
   </div>
   <div className="fc-ship-vitals">
    {ship.parts.map(p=><span key={p.id} className={'fc-vital-tiny '+(p.damage===2?'dead':p.damage===1?'wound':'')}
      title={textName(p.id)+': '+(p.destroyed?'distrutto':p.damage?'fratturato':'integro')}>
      {glyphs[p.id]}</span>)}
   </div>
   {impact&&<span key={impactNonce} className={'fc-ship-impact fc-impact-'+impact.kind}
     aria-label={impact.label}>
     <img src={impact.image} alt="" draggable={false}/>
     <span>{impact.label}</span>
    </span>}
   {sunk&&<div className="fc-destroyed-mark">DISTRUTTA</div>}
  </button>;
}
// Le scudiere sono evoluzioni della madre, non altre carte-navicella.
function SupportShip({escort,mother,enemy=false,impactEvent=null}){
 const linked=escort.skill.requires.every(id=>mother.parts.some(p=>p.id===id&&p.damage<2));
 const active=!escort.destroyed&&escort.hp>0;
 const hit=impactEvent?.escortSlot===escort.slot&&impactEvent?.escortDamage>0;
 return <div className={'fc-escort '+(escort.slot===0?'fc-slot-left':'fc-slot-right')+
  (active?'':' fc-sunk')+(linked?'':' fc-escort-offline')+
  (enemy?' fc-escort-hostile':'')} title={escort.name+' · '+escort.skill.name}>
  <div className="fc-escort-heading"><b>{escort.name}</b><span>{escort.role}</span></div>
  <div className="fc-escort-image"><img src={escort.visual} alt={'Scudiera evoluta '+escort.name} draggable={false}/>
    {hit&&<strong className="fc-escort-hit">{impactEvent.escortDestroyed?'DISTRUTTA':'COLPITA'}</strong>}
  </div>
  <small className="fc-escort-ability">{escort.skill.name}</small>
  <div className="fc-escort-health"><span>RESISTENZA</span><b>{escort.hp}/{escort.maxHp}</b></div>
  <div className="fc-escort-meter"><i style={{width:(escort.maxHp?100*escort.hp/escort.maxHp:0)+'%'}}/></div>
  {!active&&<div className="fc-escort-status">DISTRUTTA</div>}
  {active&&!linked&&<div className="fc-escort-status">LINK INTERROTTO</div>}
 </div>;
}
function SpecialCard({type,selected,onClick,index,disabled=false,disabledReason=''}){
 const def=SPECIAL_CARD_CATALOG[type];
 const art=officialSpecialArtPath(type)||def?.imagePath||null;
 const effect=fleetCardEffect(type);
 return <button type="button" className={'fc-special '+(selected?'fc-special-active':'')}
  onClick={onClick} disabled={disabled}
  title={(disabledReason?disabledReason+' · ':'')+effect.description}
  aria-pressed={selected}>
   <span className="fc-special-index">{index+1}</span>
   <div className="fc-art">{art?<img src={art} alt="" draggable={false}/>:<span className="fc-fallback-symbol">✧</span>}</div>
   <span className="fc-special-name">{type==='tactic-numeric-recycle'?'RICAMBIO':
     type==='tactic-bomb'?'BOMBA EMP':def?.short||def?.name||type}</span>
   <span className="fc-special-kind">{effect.kind.toUpperCase()}</span>
  </button>;
}
function assembleEnemyShips({selected,mode,sectorNumber,bossPlanetId,bossSectorLevel}){
 const first=selected[0];
 const boss=officialBossEncounter({mode,sectorNumber,planetId:bossPlanetId,sectorLevel:bossSectorLevel});
 const early=officialEarlyCampaignRivalShip({mode,sectorNumber,planetId:bossPlanetId});
 const mother=boss?.motherShipId||early||
  chooseCampaignMotherRival(first.shipId,first.level,sectorNumber,bossPlanetId,bossSectorLevel).shipId;
 const level=officialCampaignRivalLevel({mode,sectorNumber,playerLevel:first.level});
 // Una sola madre avversaria; le sue scudiere nascono automaticamente a L3/L5.
 return {ships:[{shipId:mother,level}],boss};
}
export default function FleetCardBattle({
 nickname='Comandante',gameMode='campaign',sectorNumber=1,displaySector='',
 bossPlanetId=null,bossSectorLevel=null,onResult,onExit
}){
 const [assets]=useState(getAssets);
 const [selectedIds,setSelectedIds]=useState(()=>assets.selected.slice(0,1));
 const motherCard=assets.ships?.cards?.find(c=>c.shipId===selectedIds[0]);
 const allowed=fleetSlotCount(motherCard?.level||1);
 const [battle,setBattle]=useState(null);
 const [enemySelection,setEnemySelection]=useState(0);
 const [partSelection,setPartSelection]=useState('command');
 const [chosenCards,setChosenCards]=useState([]);
 const [message,setMessage]=useState('');
 const [submitting,setSubmitting]=useState(false);
 const [historyOpen,setHistoryOpen]=useState(false);
 const [rewardDone,setRewardDone]=useState(false);
 const [lastFx,setLastFx]=useState(null);
 const isPvP=gameMode==='pvp';
 function toggleShip(id){
  setMessage('');
  setSelectedIds([id]);
 }
 function begin(){
  try{
   if(!assets.ships||!assets.specials)throw new Error(assets.error||'Inventario mancante');
   const selected=selectedIds.map(id=>assets.ships.cards.find(c=>c.shipId===id));
   if(selected.length!==1||!selected[0])
    throw new Error('Seleziona una sola madre fra le navicelle possedute');
   const enemy=assembleEnemyShips({selected,mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel});
   const bossDeck=enemy.boss?buildTacticalBossDeck(enemy.boss.planetId,enemy.ships[0].level,selected[0].level):null;
   const fallback=createSpecialCollection().loadout;
   const deckB=Array.isArray(bossDeck)&&bossDeck.length===24&&
    bossDeck.every(t=>SPECIAL_CARD_CATALOG[t])?bossDeck:fallback;
   const next=createFleetCardBattle({
    shipsA:selected.map(c=>({shipId:c.shipId,level:c.level})),shipsB:enemy.ships,
    deckA:assets.specials.loadout,deckB,mode:gameMode,
    bossName:enemy.boss?.name??null,bossId:enemy.boss?.planetId??null,
    bossLockedTerrain:!!enemy.boss,moduleLevelsA:assets.moduleLevels||{},moduleLevelsB:{},
    seed:Math.floor(Math.random()*1e8)+1,nowMs:Date.now()
   });
   localStorage.setItem(LOADOUT_KEY,JSON.stringify(selectedIds));
   // Lo sblocco slot e permanente anche quando si rigioca un settore precedente.
   localStorage.setItem(SLOT_PROGRESS_KEY,String(Math.max(assets.maxSeen||1,Number(sectorNumber)||1)));
   setBattle(next);setEnemySelection(0);setPartSelection('command');setLastFx(null);
   setChosenCards([]);setRewardDone(false);setMessage('');
  }catch(error){setMessage(error?.message||'Impossibile schierare la flotta');}
 }
 function resolve(){
  if(!battle||battle.phase!=='playing')return;
  const enemy=battle.sides.B.ships;
  let index=enemySelection;
  if(fleetShipDestroyed(enemy[index]))index=enemy.findIndex(s=>!fleetShipDestroyed(s));
  const target=enemy[index];
  if(!target)return;
  const partId=target.parts.find(p=>p.id===partSelection&&!p.destroyed)?
   partSelection:target.parts.find(p=>!p.destroyed)?.id;
  const ai=selectFleetAiOrder(battle);
  const result=resolveFleetCardRound(battle,{
   shipIndex:index,partId,cards:chosenCards
  },ai,Date.now());
  if(!result.ok){setMessage(result.reason);return;}
  const next=result.battle;
  setBattle(next);setChosenCards([]);
  setLastFx({
   round:battle.round,nonce:Date.now(),
   events:result.events,
   volleys:{
    A:fleetVolleyVisuals(battle.sides.A.ships,result.events[0],battle.round),
    B:fleetVolleyVisuals(battle.sides.B.ships,result.events[1],battle.round)
   }
  });
  setMessage(result.events.map(e=>e.text).join(' · '));
  const nextEnemyIndex=next.sides.B.ships.findIndex(s=>!fleetShipDestroyed(s));
  if(nextEnemyIndex>=0&&fleetShipDestroyed(next.sides.B.ships[index])){
   setEnemySelection(nextEnemyIndex);setPartSelection('command');
  }else if(!next.sides.B.ships[index].parts.find(p=>p.id===partId&&!p.destroyed)){
   const remaining=next.sides.B.ships[index].parts.find(p=>!p.destroyed);
   if(remaining)setPartSelection(remaining.id);
  }
 }
 async function finishBattle(){
  if(submitting||!battle||battle.phase!=='finished'||rewardDone)return;
  setSubmitting(true);
  try{
   const won=battle.winner==='A',result=won?'player':battle.winner==='B'?'enemy':'draw';
   if(won&&!isPvP){
    await claimOfficialLiveVictoryRewards({
     winner:'player',mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel
    });
   }
   const player=battle.sides.A,enemy=battle.sides.B;
   const max=8+player.escorts.reduce((sum,e)=>sum+e.maxHp,0);
   const hp=player.ships[0].parts.reduce((a,p)=>a+(2-p.damage),0)+
    player.escorts.reduce((sum,e)=>sum+e.hp,0);
   const health=Math.max(0,Math.min(1,hp/Math.max(1,max)));
   const meta={
    turnsElapsed:battle.round,activeTimeElapsedMs:Math.max(0,Date.now()-battle.startedAtMs),
    remainingHpPct:health,isPvP,
    starsEarned:[won,won&&health>=.65,won&&health>=.9],
    matchStats:{
     turnsElapsed:battle.round,sectorNumber,damageDealt:
      enemy.ships.reduce((sum,s)=>sum+s.parts.reduce((a,p)=>a+p.damage,0),0),
     enemyVitalsDestroyed:enemy.ships.reduce((sum,s)=>sum+s.parts.filter(p=>p.destroyed).length,0),
     bossPlanetId:bossPlanetId??null,bossSectorLevel:bossSectorLevel??null
    }
   };
   setRewardDone(true);
   if(!isPvP)onResult?.(result,meta);
   onExit?.();
  }catch(e){setMessage('Ricompense non salvate: '+(e?.message||'Riprova')); }
  finally{setSubmitting(false);}
 }
 if(assets.error)return <main className="fc-error"><h2>Eclissi Stellare</h2>
  <p role="alert">{assets.error}</p><button onClick={()=>onExit?.()}>TORNA AL MENU</button></main>;
 if(!battle){
  return <div className="fc-screen fc-prepare">
   <header className="fc-header"><span>ECLISSI STELLARE</span><button onClick={()=>onExit?.()}>ESCI</button></header>
   <div className="fc-opening">
    <div className="fc-eyebrow">NUOVO DUELLO · CARTE DI FLOTTA</div>
    <h1>Schiera la tua flotta</h1>
    <p>Seleziona una navicella madre posseduta: solo lei attacca.
     Le scudiere sono evoluzioni automatiche del modello, sbloccate ai livelli 3 e 5.
     Ogni scudiera ha un effetto di supporto diverso.</p>
    <div className="fc-slot-status">{[0,1,2].map(i=><span key={i} className={
     i<allowed?'fc-unlocked':'fc-locked'}>{['MADRE','SCUDIERA L3','SCUDIERA L5'][i]+
      (i<allowed?' · ATTIVA':' · BLOCCATA')}</span>)}</div>
    <div className="fc-selection">
     {assets.ships.cards.map(card=>{
      const active=selectedIds.includes(card.shipId);
      const def={shipId:card.shipId,level:card.level};
      // Preview ottenuta dal catalogo effettivo, non una nave gratuita.
      return <div key={card.instanceId} className={'fc-picker '+(active?'chosen':'')}>
       <img src={SHIP_IMG_ROOT+'player_to_enemy/'+card.shipId+'_complete.'+
        (raritiesWithWebp.has(['R','E','L'].includes(card.shipId[0])?
         (card.shipId[0]==='R'?'Rara':card.shipId[0]==='E'?'Epica':'Leggendaria'):'Comune')?'webp':'png')}
        alt={'Carta '+card.shipId} draggable={false}/>
       <div><strong>{SHIP_NAMES.get(card.shipId)||card.shipId}</strong><small>Lv {def.level} · {fleetShipPassive(card.shipId)?.name}</small></div>
       <button onClick={()=>toggleShip(card.shipId)}>{active?'✓ NAVE MADRE':'SCEGLI MADRE'}</button>
      </div>;
     })}
    </div>
    <p className="fc-small-note">Le due scudiere non sono altre madri né nuove carte da possedere.
     Si sbloccano al livello 3 e al livello 5 della madre scelta.</p>
    {message&&<p role="alert" className="fc-message">{message}</p>}
    <button className="fc-primary" onClick={begin} disabled={!selectedIds.length}>INIZIA BATTAGLIA</button>
    <button className="fc-text-action" onClick={()=>onExit?.()}>Torna al menu</button>
   </div>
  </div>;
 }
 const enemy=battle.sides.B,player=battle.sides.A;
 const bossBrief=fleetBossBrief(battle);
 const characterActive=!!player.commander&&player.commander.until>=battle.round;
 const ongoingCards=[
  ...(characterActive?[{type:player.commander.type,remaining:player.commander.until-battle.round+1}]:[]),
  ...player.buffs.filter(x=>x.until>=battle.round).map(x=>({type:x.type,remaining:x.until-battle.round+1}))
 ];
 function specialBlockReason(type,index){
  const kind=fleetCardEffect(type).kind;
  if(finished)return 'Battaglia conclusa';
  if(battle.bossLockedTerrain&&kind==='terrain')return 'Il boss impone il suo terreno';
  if(kind==='character'&&!chosenCards.includes(index)){
   if(characterActive)return 'Un personaggio e gia attivo';
   if(chosenCards.some(i=>fleetCardEffect(player.hand[i]).kind==='character'))
    return 'Massimo un personaggio alla volta';
  }
  return '';
 }
 const chosenEnemy=enemy.ships[enemySelection]&&!fleetShipDestroyed(enemy.ships[enemySelection])?
  enemy.ships[enemySelection]:enemy.ships.find(s=>!fleetShipDestroyed(s));
 const targetIndex=chosenEnemy?enemy.ships.indexOf(chosenEnemy):-1;
 const advantage=!!chosenEnemy&&player.ships.some(ship=>
  !fleetShipDestroyed(ship)&&FLEET_ELEMENTS[ship.element].beats===chosenEnemy.element);
 const targetPart=chosenEnemy?.parts.find(p=>p.id===partSelection&&!p.destroyed)?.id||
  chosenEnemy?.parts.find(p=>!p.destroyed)?.id;
 const finished=battle.phase==='finished';
 return <main className="fc-screen fc-battle" style={{
  '--fc-terrain-tint':battle.terrain?
   FLEET_ELEMENTS[battle.terrain.element]?.color:'transparent'
 }}>
  <header className="fc-header">
   <div><b>ECLISSI STELLARE</b><small>{battle.bossName||'DUELLO DI FLOTTA'}
    {displaySector?' · '+displaySector:''}</small></div>
   <div className="fc-round"><span>ROUND {battle.round}</span>
    <button onClick={()=>setHistoryOpen(o=>!o)}>{historyOpen?'CHIUDI':'STORICO'}</button></div>
  </header>
  {historyOpen&&<div className="fc-log" aria-live="polite">{battle.log.slice(-12).map((entry,i)=>
   <p key={i}>{entry.text}</p>)}</div>}
  <div className="fc-board">
   <section className="fc-fleet fc-enemy-rack">
    <div className="fc-rack-head"><strong>FLOTTA NEMICA</strong><span>{enemy.escorts.filter(e=>!e.destroyed).length}/{enemy.escorts.length} scudiere attive</span></div>
    {bossBrief&&<div className="fc-boss-ability" role="status">
     <div className="fc-boss-ability-title"><strong>{bossBrief.name}</strong><span>PASSIVA DEL BOSS</span></div>
     <div className="fc-boss-ability-name">{bossBrief.ability}</div>
     <p>{bossBrief.description}</p>
     <small>{bossBrief.status}</small>
    </div>}
    {activeFleetSynergies(enemy).length>0&&<div className="fc-synergies">
      <b>SINERGIE NEMICHE</b> {activeFleetSynergies(enemy).map(x=>x.name).join(' · ')}
     </div>}
     <div className="fc-ship-row">{enemy.escorts.map(e=><SupportShip key={e.id} escort={e} mother={enemy.ships[0]}
      enemy impactEvent={lastFx?.events?.[0]}/>)}{enemy.ships.map((ship,i)=><ShotShip key={ship.id}
      ship={ship} slotIndex={i} enemy selected={targetIndex===i&&!finished}
      impactEvent={lastFx?.events?.[0]} impactNonce={lastFx?.nonce}
      onClick={!finished?()=>{setEnemySelection(i);setPartSelection(
       ship.parts.find(p=>!p.destroyed)?.id||'command');}:null}/>)}</div>
   </section>
   <section className="fc-target-panel" aria-label="Bersagli vitali">
    {lastFx&&<div key={lastFx.nonce} className="fc-volley-stage" aria-hidden="true">
     {lastFx.volleys.A.map((shot,i)=><span key={'a-'+shot.id}
      className={'fc-weapon-trace fc-trace-'+shot.style+' fc-trace-up'}
      style={{'--fc-trace-color':shot.color,left:(18+shot.shipIndex*32)+'%',
       animationDelay:(i*.11)+'s'}} title={shot.name}><i/></span>)}
     {lastFx.volleys.B.map((shot,i)=><span key={'b-'+shot.id}
      className={'fc-weapon-trace fc-trace-'+shot.style+' fc-trace-down'}
      style={{'--fc-trace-color':shot.color,left:(18+shot.shipIndex*32)+'%',
       animationDelay:(.18+i*.11)+'s'}} title={shot.name}><i/></span>)}
    </div>}
    <div className="fc-target-title"><span>BERSAGLIO</span>
     <strong>{chosenEnemy?.name||'Flotta eliminata'}</strong></div>
    <div className="fc-collapse-note">Madre sempre attaccabile · 2 vitali distrutti = sconfitta.
    Le scudiere difensive intercettano i colpi finché resistono.</div>
    <div className="fc-parts">{FLEET_PARTS.map(p=>{
     const vital=chosenEnemy?.parts.find(v=>v.id===p.id);
     return <button key={p.id} disabled={!vital||vital.destroyed||finished}
      className={'fc-part '+(targetPart===p.id?'is-target ':'')+
       (vital?.destroyed?'is-destroyed':'')}
      onClick={()=>setPartSelection(p.id)} aria-pressed={targetPart===p.id}>
      <span>{glyphs[p.id]}</span><b>{p.name}</b>
      <small>{vital?.destroyed?'DISTRUTTO':vital?.damage===1?'FRATTURATO':'INTEGRO'}</small>
     </button>;
    })}</div>
    <div className="fc-mechanic-note">
     {advantage?'✦ VANTAGGIO ELEMENTALE · ':''}
     {FLEET_PARTS.find(p=>p.id===targetPart)?.effect||'Scegli un sistema vitale'}
    </div>
   </section>
   <section className="fc-fleet fc-player-rack">
    <div className="fc-rack-head"><strong>LA TUA FLOTTA</strong><span>{player.escorts.filter(e=>!e.destroyed).length}/{player.escorts.length} scudiere attive</span></div>
    {activeFleetSynergies(player).length>0&&<div className="fc-synergies">
      <b>SINERGIE ATTIVE</b> {activeFleetSynergies(player).map(x=>x.name).join(' · ')}
     </div>}
     <div className="fc-ship-row">{player.escorts.map(e=><SupportShip key={e.id} escort={e} mother={player.ships[0]}
      impactEvent={lastFx?.events?.[1]}/>)}{player.ships.map((ship,i)=><ShotShip key={ship.id}
     ship={ship} slotIndex={i} impactEvent={lastFx?.events?.[1]}
     impactNonce={lastFx?.nonce}/>)}</div>
   </section>
  </div>
  <section className="fc-command">
   {lastFx?.volleys?.A?.length>0&&<div className="fc-weapons-fired" role="status">
     <strong>ARMI ATTIVATE</strong>
     <span>{lastFx.volleys.A.map(x=>x.shipName+' · '+x.name).join(' / ')}</span>
    </div>}
   <div className="fc-hand-header">
    <strong>CARTE SPECIALI</strong>
    <small>Seleziona fino a 2 · {chosenCards.length}/2</small>
   </div>
   {ongoingCards.length>0&&<div className="fc-ongoing" aria-live="polite">
     <b>EFFETTI ATTIVI</b>
     {ongoingCards.map(x=><span key={x.type}>{SPECIAL_CARD_CATALOG[x.type]?.short||x.type}
      {' · '+x.remaining+' '+(x.remaining===1?'round':'round')}</span>)}
    </div>}
   <div className="fc-hand">{player.hand.length?player.hand.map((type,i)=>{
    const reason=specialBlockReason(type,i);
    return <SpecialCard key={battle.round+'-'+i+'-'+type} type={type} index={i}
     selected={chosenCards.includes(i)} disabled={!!reason} disabledReason={reason}
     onClick={reason?undefined:()=>setChosenCards(old=>old.includes(i)?
      old.filter(n=>n!==i):old.length<2?[...old,i]:old)}/>;
   }):<p className="fc-empty">Mazzo esaurito: la flotta può ancora attaccare.</p>}</div>
   <div className="fc-hand-description">{chosenCards.length?
    chosenCards.map(i=>fleetCardEffect(player.hand[i]).description).join(' + '):
    'Le armi di ogni navicella funzionano anche senza carte speciali.'}</div>
   {message&&<p role="status" className="fc-message">{message}</p>}
   {finished?<div className="fc-finish">
     <h2>{battle.winner==='A'?'VITTORIA':battle.winner==='B'?'SCONFITTA':'PAREGGIO'}</h2>
     <p>{battle.winner==='A'?'Flotta nemica eliminata.':
      battle.winner==='B'?'La tua flotta è stata eliminata.':'Entrambe le flotte sono state distrutte.'}</p>
     <button className="fc-primary" onClick={finishBattle} disabled={submitting||rewardDone}>
      {submitting?'SALVATAGGIO...':'CONCLUDI E TORNA AL MENU'}</button>
     <button className="fc-text-action" onClick={()=>{setBattle(null);setMessage('');}}>
      Rigioca con la tua flotta</button>
    </div>:<button className="fc-primary fc-fire-button" onClick={resolve}
     disabled={!chosenEnemy||!targetPart}>
     <span>⚡</span> ATTACCO DI FLOTTA <small>CONFERMA ROUND</small>
    </button>}
   <div className="fc-footerline">
    <span>{battle.terrain?'Risonanza ambientale: '+FLEET_ELEMENTS[battle.terrain.element]?.name:
     '4 ELEMENTI · 4 SISTEMI VITALI'}</span>
    <button onClick={()=>{if(window.confirm('Abbandonare la battaglia senza ricompense?'))
     onExit?.();}}>ESCI</button>
   </div>
  </section>
 </main>;
}
