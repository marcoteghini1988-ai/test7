import React,{useEffect,useMemo,useRef,useState} from 'react';
import {newVessel,rankLabel} from './mathDuelEngine.js';
import {ASSET_ROOT,CARD_SUIT_COLORS,MountedWeapons,ShipCard} from './ShipPresentation.jsx';
import {readShipCollection,updateShipCollection,equipShipCards} from './shipCollection.js';
import {readSpecialCollection,claimFirstWinSpecialPack} from './specialDeckBuilder.js';
import SpecialDeckPanel from './SpecialDeckPanel.jsx';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {bossCharacterActive,isBossCharacterCard} from './bossCharacterCards.js';
import BossCharacterPortrait from './BossCharacterPortrait.jsx';
import PvpTerrainPortrait from './PvpTerrainPortrait.jsx';
import {isPvpTerrain,pvpTerrainAtRound,pvpTerrainDefinition} from './pvpTerrainCards.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {VULNERABILITY_RIFT_CARD_ID} from './tacticalVulnerabilityRift.js';
import {LEGACY_DICE_CARD,LEGACY_BOMB_CARD,LEGACY_MALUS_CARD,LEGACY_GOLD_CARD,MALUS_CHOICES}
 from './tacticalLegacyEvents.js';
import {TACTICAL_SPECIALS,TACTICAL_TIMING,advanceTacticalDuel,sealTacticalOrder,validateTacticalOrder,exchangeTacticalNumericDuringPlanning} from './simultaneousDuelEngine.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {visibleTacticalSignature,suggestedTacticalOperation} from './tacticalIntelVisibility.js';
import {tacticalPlaybackElapsed,projectedCombatSides} from './tacticalCombatTimeline.js';
import TacticalCombatPlayback from './TacticalCombatPlayback.jsx';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {TACTICAL_VITAL_EFFECTS} from './tacticalVitalConsequences.js';
import {commanderAbility} from './commanderAbilities.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalAfroditeRecycleCooldownMs} from './tacticalBossDecks.js';
import {officialBossThreatReadout} from './officialBossThreatReadout.js';
import {selectTacticalEscortForAmmo} from './tacticalEscortVolley.js';
import ShipPhysicalVitals,{physicalVitalCondition} from './ShipPhysicalVitals.jsx';
import {arenaForBattle} from './battleArenas.js';
import ArenaEnvironment from './ArenaEnvironment.jsx';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {readLegacyEpicProgress} from './officialEpicOwnership.js';
import {readLegacyModuleLevels} from './tacticalEquipmentCards.js';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';

const OPS=[['plus','+'],['minus','−'],['times','×'],['divide','÷'],['pair','COPPIA'],['trips','TRIS']];
const freshOrder=()=>({numericIndices:[],specialIndices:[],vitalId:null,exposureTarget:null,op:null,
 counterVitalId:'engine',mutationVitalId:null,exchangeIndices:[],weaponFocusId:null,epicChoice:null,
 quantumRoll:false,malusChoice:null,bombSlot:null,goldenIndex:null,escortAmmoIndex:null});
const toggle=(indices,i,limit)=>indices.includes(i)?indices.filter(x=>x!==i):
 indices.length>=limit?[...indices.slice(1),i]:[...indices,i];
const pct=(value,max)=>max?Math.round(100*value/max):0;
function startSession(options){
 try{
  const shipCollection=readShipCollection();
  const specialCollection=readSpecialCollection();
  const oldEpics=readLegacyEpicProgress();
  const setup=officialBattleSetup({...options,shipCollection,specialCollection,
   pilotLevel:oldEpics.pilotLevel,epicRiftOpened:oldEpics.hasCollapsed,
   moduleLevels:readLegacyModuleLevels(),
   seed:Math.floor(Math.random()*0x7fffffff)+1,nowMs:Date.now()});
  return {battle:setup.battle,bossEncounter:setup.bossEncounter,error:'',shipCollection};
 }catch(e){return {battle:null,error:e?.message||'Impossibile caricare il duello',shipCollection:null};}
}
function Ship3D({
 side,snapshot,hullRef,escortRefs=null,phase,selectedVital,onSelectVital,
 canTarget=false,knownVitals=[],impactedVitals=[]
}){
 const player=side==='player';
 const ship=useMemo(()=>newVessel(snapshot.shipId,snapshot.level),[snapshot.shipId,snapshot.level]);
 const visual={...ship,defense:snapshot.defense};
 const alive=snapshot.escorts.filter(e=>e.hp>0).length;
 const visibleVitals=VITAL_IDS.filter(id=>snapshot.defense.parts[id].hp>0).length;
 return <div className={'ship-zone ship-'+side+(phase==='resolving'?' ship-in-combat':'')}
  data-fleet-size="1" data-formation="balanced" data-fusion="off">
  <div className="fleet-ships">
   <div className="fleet-ship-wrap complete-ship focused official-mother" data-fleet-role="mother"
    data-ship={visual.id} data-level={visual.level}
    data-vital-weapons={physicalVitalCondition(snapshot.defense.parts.weapons)}
    style={{left:'50%',top:0,width:316,height:206,zIndex:3}}>
    <ShipPhysicalVitals side={side} vessel={visual} defense={snapshot.defense}
     hullRef={hullRef} selectedVital={selectedVital} onSelectVital={onSelectVital}
     canTarget={canTarget} knownVitals={knownVitals} impactedVitals={impactedVitals}/>
    <MountedWeapons side={side} vessel={visual} index={0} effect={null}/>
   </div>
  </div>
  <div className="official-escorts" aria-label={alive+' scudiere attive'}>
   {snapshot.escorts.map((escort,i)=><div key={escort.id}
    ref={node=>{if(escortRefs)escortRefs.current[i]=node;}}
    className={'official-escort escort-slot-'+(i+1)+(escort.hp<=0?' destroyed':'')} data-fleet-role="lateral">
    <img src={ASSET_ROOT+'/escorts/'+snapshot.shipId+'_escort_'+(i+1)+'.svg'}
     alt={'Scudiera '+(i+1)} draggable={false}/>
    <div className="official-escort-hp"><i style={{width:pct(escort.hp,escort.max)+'%'}}/></div>
   </div>)}
  </div>
  <div className="official-mother-hud">
   <strong>{player?'LA TUA NAVE':'AVVERSARIO'} · {visual.name} · L{visual.level}</strong>
   <span>SCUDO {snapshot.defense.shield.hp}/{snapshot.defense.shield.max} · VITALI {visibleVitals}/4</span>
   <div className="official-shield-track"><i style={{width:pct(snapshot.defense.shield.hp,snapshot.defense.shield.max)+'%'}}/></div>
  </div>
 </div>;
}
function OfficialFleetPanel({collection,onClose,onEquip}){
 const [chosen,setChosen]=useState(collection?.loadout?.[0]||'');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(){
  if(!collection||!chosen)return;
  setBusy(true);
  try{await onEquip([chosen]);}catch(e){setError(e?.message||'Impossibile schierare la nave');setBusy(false);}
 }
 return <div className="modal-shade"><section className="help-card fleet-setup official-fleet-modal">
  <h2>HANGAR E MAZZO UFFICIALE</h2>
  <p>Le navicelle e le carte provengono dalla tua collezione permanente. Il cambio della madre riavvia il combattimento soltanto prima del primo ciclo.</p>
  <div className="fleet-setup-list">{(collection?.cards||[]).map(card=>
   <ShipCard key={card.instanceId} shipId={card.shipId} level={card.level}
    selected={chosen===card.instanceId} onSelect={()=>setChosen(card.instanceId)}/>)}</div>
  <SpecialDeckPanel compact/>
  {error&&<p role="alert">{error}</p>}
  <div className="fleet-setup-actions">
   <button className="es-button" disabled={busy} onClick={onClose}>CHIUDI</button>
   <button className="es-button primary" disabled={!chosen||busy} onClick={save}>SALVA E SCHIERA</button>
  </div>
 </section></div>;
}
function niceError(reason){
 return ({
  special_selection:'Puoi selezionare al massimo due speciali',
  duplicate_special:'Non puoi utilizzare due carte speciali identiche nello stesso ciclo',
  numeric_count:'Seleziona esattamente due o tre carte numeriche',
  invalid_precision:'Scegli un vitale e una operazione valida',
  invalid_exposure_target:'Scegli un vitale ancora integro da esporre alla soglia dello scudo',
  recycle_requires_card:'Per cambiare due numeriche serve Ricambio Numerico',
  card_double_spend:'Una carta numerica non può essere impegnata due volte',
  escort_selection:'Selezione della munizione scudiera non valida',
  escort_ammo_unavailable:'Nessuna scudiera operativa compatibile con il seme selezionato',
  escort_tactical_conflict:'Una scudiera non può sparare mentre è assegnata a copertura o fusione',
  fusion_unavailable:'Per la fusione servono 100 Sincronia e scudiere operative',
  fusion_conflict:'Una sola fusione alla volta',
  counter_target:'Seleziona un sistema da proteggere',
  cover_unavailable:'Per la copertura serve una scudiera operativa',
  repair_unavailable:'Lo scudo non richiede riparazione o il generatore è distrutto',
  escort_repair_unavailable:'Nessuna scudiera danneggiata e operativa da riparare',
  purge_unavailable:'Non ci sono effetti negativi da rimuovere',
  epic_locked:'Non possiedi questo Oggetto Epico',
  terrain_conflict:'Puoi giocare una sola Carta Terreno per ciclo',
  terrain_pvp_only:'Le Carte Terreno sono utilizzabili soltanto nel PvP',
  mutation_unavailable:'Mutazione disponibile solo su un tuo sistema vitale già esposto e integro',
  rift_requires_precision:'Per attivare la Faglia seleziona un vitale e 2–3 numeriche per il calcolo',
  rift_target_destroyed:'Il bersaglio della Faglia è già distrutto',
  rift_already_used:'La Carta Faglia è già stata attivata in questa battaglia',
  dice_not_ready:'Carta Dado non ancora pronta: servono tre formule differenti valide',
  dice_card_required:'Devi giocare una Carta Dado Quantico dalle cinque speciali, non basta la carica',
  equipment_conflict:'Puoi attivare un solo Modulo equipaggiamento per ciclo',
  malus_not_ready:'Per giocare il Malus servono tre attacchi efficaci ai vitali e un disturbo scelto',
  bomb_slot_invalid:'Numero Bomba: scegli uno slot numerico avversario da 1 a 7',
  golden_unavailable:'Carta Dorata: scegli una numerica della tua mano, senza una Dorata già attiva',
  character_conflict:'Un solo Personaggio Boss può essere attivato per ciclo',
  character_already_active:'Attendi che il Personaggio Boss attivo termini i suoi cicli',
  preparation_expired:'Il tempo di preparazione è scaduto'
 })[reason]||reason||'Ordine non valido';
}
export default function OfficialBattle3D({
 nickname,gameMode='campaign',sectorNumber=1,displaySector='',ether=0,
 selectedBossDeck,bossDeckInventory,selectedPilot,pilotInventory,commanderDisplayName,
 bossPlanetId=null,bossSectorLevel=null,onEtherConsumed,onResult,onExit
}){
 const options={mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel,
  selectedPilot,pilotInventory,selectedBossDeck,bossDeckInventory};
 const [session,setSession]=useState(()=>startSession(options));
 const [battle,setBattle]=useState(()=>session.battle);
 const [draft,setDraft]=useState(freshOrder);
 const [now,setNow]=useState(Date.now);
 const [message,setMessage]=useState(session.error);
 const [menu,setMenu]=useState('');
 const [busy,setBusy]=useState(false);
 const [roundLog,setRoundLog]=useState(false);
 const hullA=useRef(null),hullB=useRef(null);
 const escortA=useRef([]),escortB=useRef([]),resultClaimed=useRef(false);
 useEffect(()=>{
  const tick=setInterval(()=>{
   const at=Date.now();
   setNow(at);
   setBattle(b=>b?advanceTacticalDuel(b,at):b);
  },150);
  return ()=>clearInterval(tick);
 },[]);
 useEffect(()=>{
  if(!battle||battle.phase!=='planning'||battle.orders.B)return;
  setBattle(b=>{
   if(!b||b.phase!=='planning'||b.orders.B)return b;
   const plan=planTacticalAi(b,'B');
   if(!plan)return b;
   const ready=sealTacticalOrder(b,'B',plan,Date.now());
   return ready.ok?ready.battle:b;
  });
 },[battle?.phase,battle?.round,battle?.orders.B]);
 useEffect(()=>{setDraft(freshOrder());setMessage('');},[battle?.round]);
 const [scale,setScale]=useState(1);
 useEffect(()=>{
  const resize=()=>setScale(Math.max(.3,Math.min(window.innerWidth/450,window.innerHeight/800)));
  resize();window.addEventListener('resize',resize);
  return ()=>window.removeEventListener('resize',resize);
 },[]);
 function restart(){
  const next=startSession(options);
  setSession(next);setBattle(next.battle);setDraft(freshOrder());
  setMessage(next.error||'');setMenu('');resultClaimed.current=false;
 }
 async function equip(loadout){
  await updateShipCollection(c=>equipShipCards(c,loadout));
  restart();
 }
 function seal(){
  if(!battle||battle.phase!=='planning'||battle.orders.A)return;
  const result=sealTacticalOrder(battle,'A',draft,Date.now());
  if(!result.ok){setMessage(niceError(result.reason));return;}
  setBattle(advanceTacticalDuel(result.battle,Date.now()));
  setMessage('Ordini confermati. La flotta attende la risoluzione simultanea.');
 }
 async function leave(){
  if(busy||(battle?.phase==='finished'&&resultClaimed.current))return;
  if(battle?.phase!=='finished'){
   if(window.confirm('Abbandonare il combattimento senza ricompense?'))onExit?.();
   return;
  }
  resultClaimed.current=true;
  setBusy(true);
  try{
   const outcome=officialBattleResult(battle,gameMode,sectorNumber);
   let specialPackEarned=false,shipRewardEarned=null,bossCharacterEarned=null;
   if(outcome.eligibleForRewards){
    try{specialPackEarned=claimFirstWinSpecialPack(gameMode,sectorNumber).granted;}
    catch{/* Non sovrascrivere collezioni non leggibili. */}
    try{const reward=await claimCampaignShipUnlock(gameMode,sectorNumber);if(reward.granted)shipRewardEarned=reward.shipId;}
    catch{/* L'uscita dalla battaglia non modifica un salvataggio danneggiato. */}
    try{
     const trophy=claimBossCharacterFromVictory({winner:outcome.winner,
      mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel});
     if(trophy.granted)bossCharacterEarned=trophy.type;
    }catch{/* La collezione non leggibile non viene modificata. */}
   }
   resultClaimed.current=true;
   if(gameMode!=='pvp'){
    outcome.meta.matchStats.specialPackEarned=specialPackEarned;
    outcome.meta.matchStats.shipRewardEarned=shipRewardEarned;
    outcome.meta.matchStats.bossCharacterEarned=bossCharacterEarned;
    onResult?.(outcome.winner,outcome.meta);
   }
   onExit?.();
  }finally{setBusy(false);}
 }
 if(!battle)return <main className="es-math-scope official-start-error">
  <h2>ECLISSI STELLARE</h2><p role="alert">{session.error||message||'Impossibile iniziare la battaglia'}</p>
  <p>Non è stato creato un mazzo di prova e nessun salvataggio è stato sovrascritto.</p>
  <button type="button" onClick={restart}>RIPROVA CARICAMENTO</button>
  <button type="button" onClick={()=>onExit?.()}>TORNA AL MENU</button>
 </main>;
 const elapsed=tacticalPlaybackElapsed(battle,now);
 const displayed=projectedCombatSides(battle,elapsed);
 // Time-locked hull effects: do not show damage before the precision impact.
 const snap=battle.history?.at(-1)?.snapshots;
 const recentImpacts=Object.fromEntries(['A','B'].map(key=>[key,
  battle.phase==='resolving'&&elapsed>=6250&&snap?
   VITAL_IDS.filter(id=>snap.before[key].defense.parts[id].hp>
    snap.afterPrecision[key].defense.parts[id].hp):[]
 ]));
 const player=battle.sides.A,enemy=battle.sides.B;
 const bossReadout=officialBossThreatReadout(battle);
 const locked=battle.phase!=='planning'||!!battle.orders.A;
 const selected=(draft.numericIndices||[]).map(i=>player.numeric.hand[i]).filter(Boolean);
 const specials=(draft.specialIndices||[]).map(i=>player.special.hand[i]?.type);
 const exposedOwnVitals=VITAL_IDS.filter(id=>player.defense.parts[id]?.exposed&&player.defense.parts[id]?.hp>0);
 const legacy=player.legacy;
 const recycle=specials.includes('tactic-numeric-recycle');
 const afroditeCooldown=tacticalAfroditeRecycleCooldownMs(player);
 const afroditeReadyIn=afroditeCooldown?
  Math.max(0,Math.ceil(((player.numericExchangeReadyAt??0)-now)/1000)):0;
 const swapAfrodite=()=>{
  const index=draft.exchangeIndices?.[0];
  if(index==null){setMessage('Seleziona una carta numerica da ricambiare.');return;}
  const changed=exchangeTacticalNumericDuringPlanning(battle,'A',index,Date.now());
  if(!changed.ok){
   setMessage(changed.reason==='harmonic_recycle_cooldown'?
    'Ricambio armonico non ancora pronto.':'Ricambio non disponibile: '+changed.reason);
   return;
  }
  setBattle(changed.battle);
  setDraft(d=>({...d,numericIndices:[],op:null,exchangeIndices:[]}));
  setMessage('Afrodite: carta sostituita dal mazzo numerico reale.');
 };
 const nextSeconds=Math.max(0,Math.ceil((
  battle.phase==='planning'?battle.deadlineMs: battle.resolveUntilMs||now
 )-now)/1000);
 const targetPart=enemy.defense.parts[draft.vitalId];
 const suggested=suggestedTacticalOperation(player,enemy,draft.vitalId,selected);
 const hiddenRiftTarget=specials.includes(VULNERABILITY_RIFT_CARD_ID)&&
  !!draft.vitalId&&!visibleTacticalSignature(player,enemy,draft.vitalId);
 const counter=specials.includes('tactic-counter');
 const canExchange=recycle||draft.numericIndices.length===0;
 const arena=arenaForBattle(sectorNumber,gameMode,null,{
  planetId:bossPlanetId,sectorLevel:bossSectorLevel
 });
 const activeTerrain=pvpTerrainAtRound(battle.activeTerrain,battle.round);
 const terrain=activeTerrain?pvpTerrainDefinition(activeTerrain.id):null;
 const result=battle.phase==='finished'?officialBattleResult(battle,gameMode,sectorNumber):null;
 const changeNum=i=>setDraft(d=>{
  const next=toggle(d.numericIndices,i,3);
  const op=suggestedTacticalOperation(player,enemy,d.vitalId,
   next.map(index=>player.numeric.hand[index]));
  return {...d,numericIndices:next,op:op||d.op,exchangeIndices:[],
   escortAmmoIndex:next.includes(d.escortAmmoIndex)?null:d.escortAmmoIndex};
 });
 const showMenu=menu==='fleet'||menu==='rules'||menu==='cards'||menu==='exchange'||menu==='armaments';
 return <div className="es-math-scope game-viewport" role="region"
   aria-label="Duello tattico simultaneo Eclissi Stellare">
   <div className="es-root official-duel-3d" data-phase={battle.phase}
    style={{transform:'translate(-50%, -50%) scale('+scale+')'}}>
    <div className="space-back metal-arena" aria-hidden="true"
     style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
    {terrain&&<div className="pvp-terrain-scene" data-terrain={terrain.id}
     style={{backgroundImage:'url('+ASSET_ROOT+'/terrain-pvp/'+terrain.id+'.svg)'}} aria-hidden="true"/>}
    <ArenaEnvironment arenaId={terrain?.arenaId||battle.arenaId||arena.id}
     round={battle.arenaValidCalculations+1}/>
    <div className="top-brand">ECLISSI <b>STELLARE</b><small>
     {'ARENA · '+(terrain?terrain.short+' · '+(activeTerrain.untilRound-battle.round+1)+'C':(arena.shortLabel||'TITANIO'))}</small></div>
    <div className="toolbar">
     <button type="button" onClick={()=>setMenu('rules')} aria-label="Regole di combattimento">?</button>
     <button type="button" onClick={leave} aria-label="Torna al menu">⌂</button>
    </div>
    <div className="enemy-status">
     <div className="portrait">◆</div>
     <div><b>{gameMode==='pvp'?'AVVERSARIO · IA LOCALE':
      session.bossEncounter?'BOSS · '+session.bossEncounter.name:'AVVERSARIO'}
      {displaySector?' · '+displaySector:''}</b>
      <small>SCUDO {displayed.B.defense.shield.hp}/{displayed.B.defense.shield.max} ·
       SCUDIERE {displayed.B.escorts.filter(e=>e.hp>0).length}</small>
       {bossReadout&&<small className="official-boss-threat"
        title={bossReadout.label+' · '+bossReadout.detail}
        aria-label={bossReadout.label+' · '+bossReadout.detail}>
        {bossReadout.label+' · '+bossReadout.detail}</small>}
      </div>
    </div>
    <Ship3D side="enemy" snapshot={displayed.B} hullRef={hullB} escortRefs={escortB} phase={battle.phase}
     selectedVital={draft.vitalId} canTarget={!locked} knownVitals={player.seen}
     impactedVitals={recentImpacts.B} onSelectVital={id=>setDraft(d=>{
      const op=suggestedTacticalOperation(player,enemy,id,
       d.numericIndices.map(i=>player.numeric.hand[i]));
      // Al cambio di bersaglio una firma sconosciuta non eredita un suggerimento.
      return {...d,vitalId:id,exposureTarget:id,op:op??null};
     })}/>
    <section className="official-middle" aria-label="Fase e timer di combattimento">
     <div className="official-cycle">
      <strong>{'CICLO '+battle.round}</strong>
      <b>{battle.phase==='finished'?'TERMINATO':
       battle.phase==='resolving'?'SCONTRO · 8s':
       bossReadout?.urgent?'IO · ERUZIONE +10%':'PREPARAZIONE · 30s'}</b>
      <em>{battle.phase==='finished'?'✓':nextSeconds+'s'}</em>
     </div>
    </section>
    <Ship3D side="player" snapshot={displayed.A} hullRef={hullA} escortRefs={escortA} phase={battle.phase}
     impactedVitals={recentImpacts.A}/>
    <div className="deck left deck-special" aria-label="Mazzo delle carte speciali">
     <div className="deck-graphic">✧</div><small>SPECIALI</small><strong>{player.special.deck.length}</strong>
    </div>
    <div className="deck left deck-number" aria-label="Mazzo numerico">
     <div className="deck-graphic">✦</div><small>NUMERI</small><strong>{player.numeric.deck.length}</strong>
    </div>
    <div className="deck right" aria-label="Scarti numerici">
     <div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{player.numeric.discard.length}</strong>
    </div>
    <div className="special-board" role="group" aria-label="Cinque carte speciali reali">
     {[0,1,2,3,4].map(i=>{
      const card=player.special.hand[i];
      const data=card?TACTICAL_SPECIALS[card.type]:null;
      const family=data?.kind||'empty';
      const spentRift=card?.type===VULNERABILITY_RIFT_CARD_ID&&player.riftUsed;
      return <button key={card?.id||i} type="button" disabled={locked||!card||spentRift}
       title={spentRift?'Faglia già utilizzata in questa battaglia':data?.help||'Slot libero'}
       aria-pressed={draft.specialIndices.includes(i)}
       className={'special-board-card'+(isBossCharacterCard(card?.type)?' boss-character-card':'')+(isPvpTerrain(card?.type)?' terrain-card':'')+(card?.type?.startsWith('epic_item_')?' epic-card':'')+(card?.type===VULNERABILITY_RIFT_CARD_ID?' rift-card':'')+(draft.specialIndices.includes(i)?' active':'')}
       data-family={family} onClick={()=>setDraft(d=>{
        const chosen=toggle(d.specialIndices,i,2);
        const defending=chosen.some(index=>{
         const type=player.special.hand[index]?.type;
         return type?.startsWith('fusion-')||type==='tactical-cover';
        });
        const mutating=chosen.some(index=>player.special.hand[index]?.type===SIGNATURE_MUTATION_CARD_ID);
        const bomber=chosen.some(index=>player.special.hand[index]?.type===LEGACY_BOMB_CARD);
        const malus=chosen.some(index=>player.special.hand[index]?.type===LEGACY_MALUS_CARD);
        const gold=chosen.some(index=>player.special.hand[index]?.type===LEGACY_GOLD_CARD);
        return {...d,specialIndices:chosen,
         bombSlot:bomber?(d.bombSlot??0):null,
         malusChoice:malus?(d.malusChoice??MALUS_CHOICES[0].id):null,
         goldenIndex:gold?(d.goldenIndex??0):null,
         mutationVitalId:mutating?(d.mutationVitalId??exposedOwnVitals[0]??null):null,
         escortAmmoIndex:defending?null:d.escortAmmoIndex};
       })}>
       {isBossCharacterCard(card?.type)?
        <BossCharacterPortrait type={card.type} className="special-board-boss-portrait"/>:
        isPvpTerrain(card?.type)?
        <PvpTerrainPortrait type={card.type} className="special-board-boss-portrait"/>:
        <span className="special-board-glyph">{card?.type===SIGNATURE_MUTATION_CARD_ID?'⌘':card?.type===VULNERABILITY_RIFT_CARD_ID?'◇':card?.type?.startsWith('epic_item_')?'◆':'✦'}</span>}
       <strong>{spentRift?'FAGLIA USATA':data?.name||'VUOTO'}</strong><small>{'S'+(i+1)}</small>
      </button>;
     })}
     <button type="button" className="special-board-info" onClick={()=>setMenu('cards')}
      aria-label="Dettagli delle speciali">i</button>
    </div>
    <div className="hand" aria-label="Le tue sette carte numeriche">
     {player.numeric.hand.map((card,i)=><button type="button" key={card.id}
      disabled={locked} aria-pressed={draft.numericIndices.includes(i)}
      className={'number-card'+(draft.numericIndices.includes(i)?' active':'')+
       (legacy?.golden?.cardId===card.id?' is-golden':'')+
       (legacy?.bomb?.cardId===card.id?' is-bomb':'')}
      onClick={()=>changeNum(i)}
      style={{'--suit':CARD_SUIT_COLORS[card.suit],'--deal-index':i}}>
      <span className="card-suit">{card.suit}{legacy?.bomb?.cardId===card.id?' 💣':''}</span>
      <strong>{rankLabel(card.value)}{legacy?.golden?.cardId===card.id?' ★':''}</strong><span className="card-suit second">{card.suit}</span>
     </button>)}
    </div>
    <div className="play-controls">
     <div className="official-formula formula">
      <b className="formula-target">{'BERSAGLIO · '+(VITAL_LABELS[draft.vitalId]||'DA SCEGLIERE')}</b>
      <span>{selected.length?selected.map(c=>rankLabel(c.value)+c.suit).join(' · '):
       'SELEZIONA LE CARTE'}</span>
      <small>{hiddenRiftTarget?
       (draft.op?'FAGLIA · FORMULA SEGRETA, TENTATIVO '+draft.op:
        'FAGLIA · FORMULA IGNOTA: SCANSIONA O TENTA'):
       selected.length>=2?(suggested?'FIRMA VALIDA: '+suggested:
       draft.op?'OP '+draft.op+' · firma da verificare':'SCEGLI OPERAZIONE'):
       (draft.exposureTarget?'MIRA SELEZIONATA · ESPOSIZIONE ALLA SOGLIA DELLO SCUDO':'2 O 3 NUMERICHE · FINO A 2 SPECIALI')}</small>
     </div>
     <button className="es-button attack" type="button" disabled={locked} onClick={seal}>
      {battle.orders.A?'PRONTO ✓':'CONFERMA ➤'}
     </button>
    </div>
    <div className="official-operations" role="group" aria-label="Operazione matematica del colpo">
     {OPS.map(([op,label])=><button key={op} type="button" disabled={locked}
      aria-pressed={draft.op===op} className={draft.op===op?'active':''}
      onClick={()=>setDraft(d=>({...d,op}))}>{label}</button>)}
    </div>
    <div className="utility-bar">
     <button type="button" onClick={()=>setMenu('exchange')} disabled={locked}>RICAMBIO</button>
     <button type="button" onClick={()=>setMenu('armaments')} disabled={locked}>ARMI</button>
     <button type="button" onClick={()=>setMenu('fleet')} disabled={battle.round>1||battle.phase!=='planning'||!!battle.orders.A}>HANGAR</button>
     <button type="button" onClick={()=>setRoundLog(v=>!v)}>{roundLog?'CHIUDI LOG':'REGISTRO'}</button>
    </div>
    <div className="player-status">
     <b>{nickname||'TU'} · {player.name}</b>
     <span className="my-hp">{'SCUDO '+displayed.A.defense.shield.hp+'/'+displayed.A.defense.shield.max}</span>
     <small title={player.commander?commanderAbility(player.commander.id)?.description||'':undefined}>
      {'SINCRONIA '+player.sync+'/100'+(player.bossNumericDeck?' · '+player.bossNumericDeck.ability+' L'+player.bossNumericDeck.level:'')+(player.commander?' · '+
        (commanderAbility(player.commander.id)?.name||'PILOTA')+' L'+player.commander.level:'')}
     </small>
    </div>
    {message&&battle.phase==='planning'&&<div role="status" className="official-notice">{message}</div>}
    {battle.phase==='resolving'&&<TacticalCombatPlayback battle={battle} nowMs={now}
     hulls={{A:hullA,B:hullB}} escorts={{A:escortA,B:escortB}}/>}
    {roundLog&&<div className="official-log" role="region" aria-label="Registro della battaglia">
     <button type="button" onClick={()=>setRoundLog(false)}>CHIUDI</button>
     {battle.lastEvents.map((event,i)=><p key={i}>{event}</p>)}
    </div>}
    {menu==='cards'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>CARTE SPECIALI EQUIPAGGIATE</h2>
     {bossReadout&&<p><b>{bossReadout.label}</b>
      <span>{bossReadout.detail}</span></p>}
     {bossReadout?.phase==='eruzione'&&<p>
      <b>DIFESA CONTRO IO</b>
      <span>Riparazione, Paratia, Schermo e Copertura contrastano le armi native solo se realmente disponibili. La Contromisura protegge invece un vitale esposto: non riduce il bonus magmatico sulla barriera.</span>
     </p>}
     {terrain&&<p><b>{'TERRENO ATTIVO · '+terrain.name}</b>
      <span>{terrain.description+' · scade dopo il ciclo '+activeTerrain.untilRound}</span></p>}
     {bossCharacterActive(player,battle.round)&&<p>
      <b>{'PERSONAGGIO ATTIVO · '+bossCharacterActive(player,battle.round).name}</b>
      <span>{'Abilità: '+bossCharacterActive(player,battle.round).skill+
       '. Termina alla fine del ciclo '+player.bossCharacter.untilRound+'. Un solo personaggio alla volta.'}</span>
     </p>}
     {player.special.hand.map((card,i)=><p key={card.id}><b>{i+1}. {TACTICAL_SPECIALS[card.type]?.name}</b>
      <span>{TACTICAL_SPECIALS[card.type]?.help}</span></p>)}
     <button className="es-button primary" onClick={()=>setMenu('')}>CHIUDI</button>
    </section></div>}
    {menu==='exchange'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>RICAMBIO NUMERICO</h2>
     <p>Se non prepari un attacco di precisione puoi cambiare una carta; con Ricambio Numerico fino a due. Le carte sono realmente consumate nel ciclo.</p>
     {afroditeCooldown&&<p><strong>RICAMBIO ARMONICO — AFRODITE</strong>
      {' · una carta subito, ogni '+afroditeCooldown/1000+' secondi. '}
      {afroditeReadyIn>0?'Pronto tra '+afroditeReadyIn+' s.':'Pronto ora.'}
     </p>}
     <div className="official-exchange-cards">{player.numeric.hand.map((c,i)=><button key={c.id}
      disabled={draft.numericIndices.includes(i)||draft.escortAmmoIndex===i}
      aria-pressed={draft.exchangeIndices.includes(i)}
      onClick={()=>setDraft(d=>({...d,exchangeIndices:toggle(d.exchangeIndices,i,recycle?2:1)}))}>
      {rankLabel(c.value)+c.suit}</button>)}</div>
     {afroditeCooldown&&<button className="es-button primary" type="button"
      disabled={locked||afroditeReadyIn>0||draft.exchangeIndices.length!==1}
      onClick={swapAfrodite}>RICAMBIA ORA · AFRODITE</button>}
     <button className="es-button primary" onClick={()=>setMenu('')}>CONFERMA SCELTA</button>
    </section></div>}
    {menu==='armaments'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>ARMAMENTI E TATTICA</h2>
     <p>Le armi integrate sparano entrambe le barriere durante gli 8 secondi. La scelta indica la tecnologia privilegiata.</p>
     <div className="official-armament-list">{player.weapons.map(w=><button key={w.id}
      aria-pressed={draft.weaponFocusId===w.id} onClick={()=>setDraft(d=>({...d,weaponFocusId:w.id}))}>
      {w.name}</button>)}</div>
     {!!player.escorts.some(e=>e.hp>0)&&<section aria-label="Munizioni reali delle scudiere">
      <p><strong>FUOCO SCUDIERA · UNA NUMERICA</strong>
       {' · scegli una carta non usata nel calcolo. La scudiera carica o spara secondo il proprio arsenale, consumando quella carta.'}</p>
      <div className="official-exchange-cards">{player.numeric.hand.map((card,i)=>{
       const escort=selectTacticalEscortForAmmo(player,card);
       return <button key={card.id} type="button"
        disabled={locked||!escort||draft.numericIndices.includes(i)||draft.exchangeIndices.includes(i)||
         specials.some(type=>type?.startsWith('fusion-')||type==='tactical-cover')}
        aria-pressed={draft.escortAmmoIndex===i}
        onClick={()=>setDraft(d=>({...d,escortAmmoIndex:d.escortAmmoIndex===i?null:i}))}>
        {rankLabel(card.value)+card.suit}{escort?' · S'+(escort.slot+1):''}
       </button>;
      })}</div>
     </section>}
     <p><strong>DADO QUANTICO</strong>{' · '+(legacy?.diceReady?'PRONTO':(legacy?.dicePatterns?.length??0)+'/3 combinazioni diverse')+
      ' · MALUS '+(legacy?.malusCharge??0)+'/3'}</p>
     {specials.includes(LEGACY_DICE_CARD)&&<p><strong>DADO QUANTICO</strong>
      {legacy?.diceReady?' · Carta selezionata: lancio nella prossima risoluzione.':
       ' · Servono tre formule differenti valide prima di giocare questa carta.'}</p>}
     {specials.includes(LEGACY_BOMB_CARD)&&<label>Numero Bomba: slot numerico nemico
      <select value={draft.bombSlot??0} onChange={e=>setDraft(d=>({...d,bombSlot:Number(e.target.value)}))}>
       {Array.from({length:7},(_,i)=><option key={i} value={i}>{'Slot '+(i+1)}</option>)}
      </select></label>}
     {specials.includes(LEGACY_MALUS_CARD)&&<label>Barra Malus: disturbo di un ciclo
      <select value={draft.malusChoice??MALUS_CHOICES[0].id}
       onChange={e=>setDraft(d=>({...d,malusChoice:e.target.value}))}>
       {MALUS_CHOICES.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </select></label>}
     {specials.includes(LEGACY_GOLD_CARD)&&<label>Carta Dorata: trasforma una numerica tua
      <select value={draft.goldenIndex??0}
       onChange={e=>setDraft(d=>({...d,goldenIndex:Number(e.target.value)}))}>
       {player.numeric.hand.map((c,i)=><option key={c.id} value={i}>{'Carta '+(i+1)+' · '+rankLabel(c.value)+c.suit}</option>)}
      </select></label>}
     {specials.includes(VULNERABILITY_RIFT_CARD_ID)&&<p><strong>FAGLIA DI VULNERABILITÀ</strong> · Usa la formula selezionata sul vitale nemico anche se lo scudo è ancora chiuso. Fino a 5 HP quando è protetto; non altera lo scudo né rivela la formula. Una volta per partita.</p>}
     {specials.includes(SIGNATURE_MUTATION_CARD_ID)&&<label>Mutazione: scegli il TUO vitale già esposto
      <select value={draft.mutationVitalId??''} onChange={e=>setDraft(d=>({...d,mutationVitalId:e.target.value||null}))}>
       <option value="">Scegli un sistema</option>
       {exposedOwnVitals.map(id=><option key={id} value={id}>{VITAL_LABELS[id]}</option>)}
      </select></label>}
     {counter&&bossReadout?.phase==='eruzione'&&<p>Contromisura: protegge una precisione contro il vitale indicato, non il colpo nativo di Eruzione.</p>}
     {counter&&<label>Contromisura: difendi
      <select value={draft.counterVitalId} onChange={e=>setDraft(d=>({...d,counterVitalId:e.target.value}))}>
       {VITAL_IDS.map(id=><option key={id} value={id}>{VITAL_LABELS[id]}</option>)}
      </select></label>}
     <button className="es-button primary" onClick={()=>setMenu('')}>CHIUDI</button>
    </section></div>}
    {menu==='rules'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>REGOLE DEL DUELLO SIMULTANEO</h2>
     <p>Hai 30 secondi per preparare un ordine. Anche l'avversario prepara il proprio ordine senza leggere le tue carte. Conferma o lascia scadere il tempo: gli ordini si risolvono insieme in 8 secondi.</p>
     <p>Le 7 numeriche attaccano un sistema vitale solo con una firma matematica o Poker valida e se il sistema è esposto. Le 5 speciali provengono dal tuo mazzo da 24 carte e se ne possono impegnare al massimo 2 per ciclo.</p>
     <p>Le armi native della tua nave agiscono sulla barriera; scudiere, fusioni e riparazioni utilizzano HP e carte reali. Dopo lo scontro le mani vengono ripristinate pescando dal mazzo.</p>
     <p>Le Carte Terreno modificano l'ambiente per due cicli e hanno pro e contro uguali per entrambe le flotte. Sono giocabili soltanto nel PvP: le arene dei boss non si possono sostituire.</p>
     <p>Mutazione della Firma: una speciale difensiva modifica per un solo ciclo la combinazione richiesta da un tuo vitale già esposto. Il nuovo requisito appare nella risoluzione e poi ritorna quello originale; nessuna riparazione automatica.</p>
     <p>Faglia di Vulnerabilità: una Carta Speciale per partita permette di colpire direttamente un vitale protetto senza abbattere o aprire la barriera. Servono sempre 2–3 numeriche e una formula valida; fino a 5 HP su un vitale protetto, Contromisure e Mutazione della Firma possono difendere.</p>
     <p>Dado Quantico: dopo tre formule differenti devi giocare e consumare la sua Carta Speciale, pescata tra le cinque. Non esiste lancio gratuito con pulsante né premi di valuta automatici.</p>
     <p>Numero Bomba: la speciale marca una vera carta nemica visibile dal ciclo successivo; il nemico può disinnescarla con ricambio o formula valida, oppure subisce 8 danni alla barriera.</p>
     <p>Barra Malus: tre colpi reali ai vitali abilitano una carta sabotaggio. Durata un ciclo, senza saltare interi turni.</p>
     <p>Carta Dorata: una speciale trasforma una numerica vera per massimo due cicli; il bonus dipende dal seme ed è valido solo con un calcolo corretto.</p>
     <h3>I QUATTRO COMPONENTI DISTRUGGIBILI</h3>
     <p>I vitali partono con 10 HP: 10–6 integro, 5–1 danneggiato, 0 distrutto. Scegli quale colpire quando la barriera apre un bersaglio. Tutti e quattro distrutti = vittoria.</p>
     {VITAL_IDS.map(id=><p key={id}>
      <b>{VITAL_LABELS[id]}</b>
      <span>{'A 5 HP: '+TACTICAL_VITAL_EFFECTS[id].damaged+
       ' A 0 HP: '+TACTICAL_VITAL_EFFECTS[id].destroyed}</span>
     </p>)}
     <p>{'Arena: '+arena.name+'. '+arena.description}</p>
     {bossReadout&&<p><b>{'MINACCIA PUBBLICA · '+bossReadout.label}</b>
      <span>{bossReadout.detail}</span></p>}
     {session.bossEncounter&&<p><b>{'BOSS · '+session.bossEncounter.name}</b>
      <span>{'Potere esclusivo: '+session.bossEncounter.exclusiveAbility+
       '. Mazzo numerico: '+session.bossEncounter.numericDeckId+
       ' · livello '+session.bossEncounter.numericDeckLevel+
       '. Nave madre: '+enemy.name+' ('+session.bossEncounter.motherShipId+')'+
       '. Arena esclusiva: '+arena.name+'.'}</span></p>}
     {player.bossNumericDeck&&<>
      <h3>PASSIVE DEL MAZZO BOSS EQUIPAGGIATO</h3>
      {activeNumericBossAbilities(player.bossNumericDeck.id,player.bossNumericDeck.level)
       .filter(ability=>ability.unlocked).map(ability=>
       <p key={ability.name}><b>{ability.name+' · Grado '+ability.grade}</b>
        <span>{ability.description+' · '+ability.value+'%'}</span></p>)}
     </>}
     {player.commander&&<p><b>ABILITÀ PILOTA</b>
      <span>{(commanderAbility(player.commander.id)?.name||'Pilota')+
       ' · '+(commanderAbility(player.commander.id)?.description||'')+
       ' · Livello '+player.commander.level}</span></p>}
     <button className="es-button primary" onClick={()=>setMenu('')}>CHIUDI</button>
    </section></div>}
    {menu==='fleet'&&<OfficialFleetPanel collection={session.shipCollection}
     onClose={()=>setMenu('')} onEquip={equip}/>}
    {result&&<div className="modal-shade"><div className="result-card" data-outcome={result.winner}>
     <h1>{result.winner==='player'?'VITTORIA':result.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1>
     <p>{'CICLI '+battle.round+' · INTEGRITÀ '+pct(result.meta.remainingHpPct,1)+'%'}</p>
     <p>{result.winner==='player'?'Combattimento concluso. Ricompense calcolate solo in campagna.':
       'Combattimento concluso. Nessuna ricompensa di vittoria.'}</p>
     <button className="es-button primary" disabled={busy} onClick={leave}>CONFERMA E TORNA</button>
    </div></div>}
   </div>
  </div>;
}
