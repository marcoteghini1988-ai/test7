import React,{useEffect,useMemo,useRef,useState} from 'react';
import {newVessel,rankLabel} from './mathDuelEngine.js';
import {ASSET_ROOT,CARD_SUIT_COLORS,ShipArtwork,MountedWeapons,ShipCard} from './ShipPresentation.jsx';
import {readShipCollection,updateShipCollection,equipShipCards} from './shipCollection.js';
import {readSpecialCollection,claimFirstWinSpecialPack} from './specialDeckBuilder.js';
import SpecialDeckPanel from './SpecialDeckPanel.jsx';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {TACTICAL_SPECIALS,TACTICAL_TIMING,advanceTacticalDuel,sealTacticalOrder,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {planTacticalDemoAi} from './tacticalDuelDemoAi.js';
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';
import {tacticalPlaybackElapsed,projectedCombatSides} from './tacticalCombatTimeline.js';
import TacticalCombatPlayback from './TacticalCombatPlayback.jsx';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {commanderAbility} from './commanderAbilities.js';
import {arenaForBattle} from './battleArenas.js';
import ArenaEnvironment from './ArenaEnvironment.jsx';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';

const OPS=[['plus','+'],['minus','−'],['times','×'],['divide','÷'],['pair','COPPIA'],['trips','TRIS']];
const freshOrder=()=>({numericIndices:[],specialIndices:[],vitalId:null,op:null,
 counterVitalId:'engine',exchangeIndices:[],weaponFocusId:null,epicChoice:null});
const toggle=(indices,i,limit)=>indices.includes(i)?indices.filter(x=>x!==i):
 indices.length>=limit?[...indices.slice(1),i]:[...indices,i];
const pct=(value,max)=>max?Math.round(100*value/max):0;
function startSession(options){
 try{
  const shipCollection=readShipCollection();
  const specialCollection=readSpecialCollection();
  const setup=officialBattleSetup({...options,shipCollection,specialCollection,
   seed:Math.floor(Math.random()*0x7fffffff)+1,nowMs:Date.now()});
  return {battle:setup.battle,error:'',shipCollection};
 }catch(e){return {battle:null,error:e?.message||'Impossibile caricare il duello',shipCollection:null};}
}
function Ship3D({side,snapshot,hullRef,phase}){
 const player=side==='player';
 const ship=useMemo(()=>newVessel(snapshot.shipId,snapshot.level),[snapshot.shipId,snapshot.level]);
 const visual={...ship,defense:snapshot.defense};
 const alive=snapshot.escorts.filter(e=>e.hp>0).length;
 const visibleVitals=VITAL_IDS.filter(id=>snapshot.defense.parts[id].hp>0).length;
 return <div className={'ship-zone ship-'+side+(phase==='resolving'?' ship-in-combat':'')}
  data-fleet-size="1" data-formation="balanced" data-fusion="off">
  <div className="fleet-ships">
   <div className="fleet-ship-wrap complete-ship focused official-mother" data-ship={visual.id}
    data-level={visual.level} style={{left:'50%',top:0,width:316,height:206,zIndex:3}}>
    <svg ref={hullRef} className="fleet-ship-img" viewBox="0 0 1000 1000" role="img"
     aria-label={visual.name+' navicella 3D originale, livello '+visual.level}>
     <g opacity=".3"><ShipArtwork side={side} vessel={visual}/></g>
     <image href={ASSET_ROOT+'/ship-shells/'+visual.id+'.svg'} x="0" y="0"
      width="1000" height="1000" preserveAspectRatio="xMidYMid meet"/>
    </svg>
    <MountedWeapons side={side} vessel={visual} index={0} effect={null}/>
   </div>
  </div>
  <div className="official-escorts" aria-label={alive+' scudiere attive'}>
   {snapshot.escorts.map((escort,i)=><div key={escort.id}
    className={'official-escort escort-slot-'+(i+1)+(escort.hp<=0?' destroyed':'')}>
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
  recycle_requires_card:'Per cambiare due numeriche serve Ricambio Numerico',
  card_double_spend:'Una carta numerica non può essere impegnata due volte',
  fusion_unavailable:'Per la fusione servono 100 Sincronia e scudiere operative',
  fusion_conflict:'Una sola fusione alla volta',
  counter_target:'Seleziona un sistema da proteggere',
  cover_unavailable:'Per la copertura serve una scudiera operativa',
  repair_unavailable:'Lo scudo non richiede riparazione o il generatore è distrutto',
  escort_repair_unavailable:'Nessuna scudiera danneggiata e operativa da riparare',
  purge_unavailable:'Non ci sono effetti negativi da rimuovere',
  epic_locked:'Non possiedi questo Oggetto Epico',
  preparation_expired:'Il tempo di preparazione è scaduto'
 })[reason]||reason||'Ordine non valido';
}
export default function OfficialBattle3D({
 nickname,gameMode='campaign',sectorNumber=1,displaySector='',ether=0,
 selectedBossDeck,bossDeckInventory,selectedPilot,pilotInventory,commanderDisplayName,
 bossPlanetId=null,bossSectorLevel=null,onEtherConsumed,onResult,onExit
}){
 const options={mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel,
  selectedPilot,pilotInventory};
 const [session,setSession]=useState(()=>startSession(options));
 const [battle,setBattle]=useState(()=>session.battle);
 const [draft,setDraft]=useState(freshOrder);
 const [now,setNow]=useState(Date.now);
 const [message,setMessage]=useState(session.error);
 const [menu,setMenu]=useState('');
 const [busy,setBusy]=useState(false);
 const [roundLog,setRoundLog]=useState(false);
 const hullA=useRef(null),hullB=useRef(null),resultClaimed=useRef(false);
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
   const plan=planTacticalDemoAi(b,'B');
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
   let specialPackEarned=false,shipRewardEarned=null;
   if(outcome.eligibleForRewards){
    try{specialPackEarned=claimFirstWinSpecialPack(gameMode,sectorNumber).granted;}
    catch{/* Non sovrascrivere collezioni non leggibili. */}
    try{const reward=await claimCampaignShipUnlock(gameMode,sectorNumber);if(reward.granted)shipRewardEarned=reward.shipId;}
    catch{/* L'uscita dalla battaglia non modifica un salvataggio danneggiato. */}
   }
   resultClaimed.current=true;
   if(gameMode!=='pvp'){
    outcome.meta.matchStats.specialPackEarned=specialPackEarned;
    outcome.meta.matchStats.shipRewardEarned=shipRewardEarned;
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
 const player=battle.sides.A,enemy=battle.sides.B;
 const locked=battle.phase!=='planning'||!!battle.orders.A;
 const selected=(draft.numericIndices||[]).map(i=>player.numeric.hand[i]).filter(Boolean);
 const specials=(draft.specialIndices||[]).map(i=>player.special.hand[i]?.type);
 const recycle=specials.includes('tactic-numeric-recycle');
 const nextSeconds=Math.max(0,Math.ceil((
  battle.phase==='planning'?battle.deadlineMs: battle.resolveUntilMs||now
 )-now)/1000);
 const targetPart=enemy.defense.parts[draft.vitalId];
 const visibleSignature=targetPart&&(targetPart.exposed||player.seen.includes(draft.vitalId));
 const suggested=targetPart&&selected.length>=2?tacticalSignatureOperation(targetPart.signature,selected):null;
 const counter=specials.includes('tactic-counter');
 const canExchange=recycle||draft.numericIndices.length===0;
 const arena=arenaForBattle(sectorNumber,gameMode,null,{
  planetId:bossPlanetId,sectorLevel:bossSectorLevel
 });
 const result=battle.phase==='finished'?officialBattleResult(battle,gameMode,sectorNumber):null;
 const changeNum=i=>setDraft(d=>{
  const next=toggle(d.numericIndices,i,3);
  const signature=battle.sides.B.defense.parts[d.vitalId]?.signature;
  const op=signature&&next.length>=2?tacticalSignatureOperation(
   signature,next.map(index=>player.numeric.hand[index])):null;
  return {...d,numericIndices:next,op:op||d.op,exchangeIndices:[]};
 });
 const showMenu=menu==='fleet'||menu==='rules'||menu==='cards'||menu==='exchange'||menu==='armaments';
 return <div className="es-math-scope game-viewport" role="region"
   aria-label="Duello tattico simultaneo Eclissi Stellare">
   <div className="es-root official-duel-3d" data-phase={battle.phase}
    style={{transform:'translate(-50%, -50%) scale('+scale+')'}}>
    <div className="space-back metal-arena" aria-hidden="true"
     style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
    <ArenaEnvironment arenaId={battle.arenaId||arena.id} round={battle.arenaValidCalculations+1}/>
    <div className="top-brand">ECLISSI <b>STELLARE</b><small>
     {'ARENA · '+(arena.shortLabel||'TITANIO')}</small></div>
    <div className="toolbar">
     <button type="button" onClick={()=>setMenu('rules')} aria-label="Regole di combattimento">?</button>
     <button type="button" onClick={leave} aria-label="Torna al menu">⌂</button>
    </div>
    <div className="enemy-status">
     <div className="portrait">◆</div>
     <div><b>{gameMode==='pvp'?'AVVERSARIO · IA LOCALE':
      bossPlanetId&&bossSectorLevel===10?'BOSS DEL PIANETA':'AVVERSARIO'}
      {displaySector?' · '+displaySector:''}</b>
      <small>SCUDO {displayed.B.defense.shield.hp}/{displayed.B.defense.shield.max} ·
       SCUDIERE {displayed.B.escorts.filter(e=>e.hp>0).length}</small></div>
    </div>
    <Ship3D side="enemy" snapshot={displayed.B} hullRef={hullB} phase={battle.phase}/>
    <section className="official-middle">
     <div className="official-cycle">
      <strong>{'CICLO '+battle.round}</strong>
      <b>{battle.phase==='finished'?'TERMINATO':battle.phase==='resolving'?'SCONTRO · 8s':'PREPARAZIONE · 30s'}</b>
      <em>{battle.phase==='finished'?'✓':nextSeconds+'s'}</em>
     </div>
     <div className="official-targets" role="group" aria-label="Selezione bersaglio vitale avversario">
      {VITAL_IDS.map(id=>{
       const part=enemy.defense.parts[id];
       const selectedTarget=draft.vitalId===id;
       const shown=part.exposed||player.seen.includes(id);
       return <button type="button" key={id} className={'official-vital'+(selectedTarget?' chosen':'')}
        disabled={locked||part.hp<=0} aria-pressed={selectedTarget}
        onClick={()=>setDraft(d=>{
         const op=tacticalSignatureOperation(part.signature,d.numericIndices.map(i=>player.numeric.hand[i]));
         return {...d,vitalId:id,op:op||d.op};
        })} title={shown?JSON.stringify(part.signature):'Firma non rivelata'}>
        <b>{({engine:'MOTORE',weapons:'ARMI',shieldGenerator:'SCUDI',command:'CENTRALINA'})[id]}</b>
        <small>{part.hp<=0?'KO':part.exposed?'ESPOSTO':shown?'SCANSIONATO':'PROTETTO'} · {part.hp}HP</small>
       </button>;
      })}
     </div>
    </section>
    <Ship3D side="player" snapshot={displayed.A} hullRef={hullA} phase={battle.phase}/>
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
      return <button key={card?.id||i} type="button" disabled={locked||!card}
       title={data?.help||'Slot libero'} aria-pressed={draft.specialIndices.includes(i)}
       className={'special-board-card'+(draft.specialIndices.includes(i)?' active':'')}
       data-family={family} onClick={()=>setDraft(d=>({...d,specialIndices:toggle(d.specialIndices,i,2)}))}>
       <span className="special-board-glyph">✦</span>
       <strong>{data?.name||'VUOTO'}</strong><small>{'S'+(i+1)}</small>
      </button>;
     })}
     <button type="button" className="special-board-info" onClick={()=>setMenu('cards')}
      aria-label="Dettagli delle speciali">i</button>
    </div>
    <div className="hand" aria-label="Le tue sette carte numeriche">
     {player.numeric.hand.map((card,i)=><button type="button" key={card.id}
      disabled={locked} aria-pressed={draft.numericIndices.includes(i)}
      className={'number-card'+(draft.numericIndices.includes(i)?' active':'')}
      onClick={()=>changeNum(i)}
      style={{'--suit':CARD_SUIT_COLORS[card.suit],'--deal-index':i}}>
      <span className="card-suit">{card.suit}</span>
      <strong>{rankLabel(card.value)}</strong><span className="card-suit second">{card.suit}</span>
     </button>)}
    </div>
    <div className="play-controls">
     <div className="official-formula formula">
      <b className="formula-target">{'BERSAGLIO · '+(VITAL_LABELS[draft.vitalId]||'DA SCEGLIERE')}</b>
      <span>{selected.length?selected.map(c=>rankLabel(c.value)+c.suit).join(' · '):
       'SELEZIONA LE CARTE'}</span>
      <small>{selected.length>=2?(suggested?'FIRMA VALIDA: '+suggested:
       draft.op?'OP '+draft.op+' · firma da verificare':'SCEGLI OPERAZIONE'):
       '2 O 3 NUMERICHE · FINO A 2 SPECIALI'}</small>
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
      {'SINCRONIA '+player.sync+'/100'+(player.commander?' · '+
        (commanderAbility(player.commander.id)?.name||'PILOTA')+' L'+player.commander.level:'')}
     </small>
    </div>
    {message&&battle.phase==='planning'&&<div role="status" className="official-notice">{message}</div>}
    {battle.phase==='resolving'&&<TacticalCombatPlayback battle={battle} nowMs={now}
     hulls={{A:hullA,B:hullB}}/>}
    {roundLog&&<div className="official-log" role="region" aria-label="Registro della battaglia">
     <button type="button" onClick={()=>setRoundLog(false)}>CHIUDI</button>
     {battle.lastEvents.map((event,i)=><p key={i}>{event}</p>)}
    </div>}
    {menu==='cards'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>CARTE SPECIALI EQUIPAGGIATE</h2>
     {player.special.hand.map((card,i)=><p key={card.id}><b>{i+1}. {TACTICAL_SPECIALS[card.type]?.name}</b>
      <span>{TACTICAL_SPECIALS[card.type]?.help}</span></p>)}
     <button className="es-button primary" onClick={()=>setMenu('')}>CHIUDI</button>
    </section></div>}
    {menu==='exchange'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>RICAMBIO NUMERICO</h2>
     <p>Se non prepari un attacco di precisione puoi cambiare una carta; con Ricambio Numerico fino a due. Le carte sono realmente consumate nel ciclo.</p>
     <div className="official-exchange-cards">{player.numeric.hand.map((c,i)=><button key={c.id}
      disabled={draft.numericIndices.includes(i)}
      aria-pressed={draft.exchangeIndices.includes(i)}
      onClick={()=>setDraft(d=>({...d,exchangeIndices:toggle(d.exchangeIndices,i,recycle?2:1)}))}>
      {rankLabel(c.value)+c.suit}</button>)}</div>
     <button className="es-button primary" onClick={()=>setMenu('')}>CONFERMA SCELTA</button>
    </section></div>}
    {menu==='armaments'&&<div className="modal-shade"><section className="help-card official-details">
     <h2>ARMAMENTI E TATTICA</h2>
     <p>Le armi integrate sparano entrambe le barriere durante gli 8 secondi. La scelta indica la tecnologia privilegiata.</p>
     <div className="official-armament-list">{player.weapons.map(w=><button key={w.id}
      aria-pressed={draft.weaponFocusId===w.id} onClick={()=>setDraft(d=>({...d,weaponFocusId:w.id}))}>
      {w.name}</button>)}</div>
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
     <p>{'Arena: '+arena.name+'. '+arena.description}</p>
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
