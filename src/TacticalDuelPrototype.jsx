import React,{useEffect,useRef,useState} from 'react';
import {ShipArtwork,MountedWeapons} from './ShipPresentation.jsx';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {dominantTacticalTechnology} from './tacticalArmamentBalance.js';
import {TACTICAL_EPIC_CARDS,isTacticalEpic} from './tacticalEpicCards.js';
import {TACTICAL_PRESETS,TACTICAL_BOSS_PLANS,tacticalBossProfile,buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {TACTICAL_SPECIALS,createTacticalDuel,
 sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket} from './simultaneousDuelEngine.js';
import {planTacticalDemoAi} from './tacticalDuelDemoAi.js';
import {projectedCombatSides,tacticalPlaybackElapsed} from './tacticalCombatTimeline.js';
import TacticalCombatPlayback from './TacticalCombatPlayback.jsx';
import './TacticalDuelPrototype.css';

const BLANK=()=>({specialIndices:[],numericIndices:[],weaponFocusId:null,epicChoice:null,vitalId:null,op:'plus',
 counterVitalId:'shieldGenerator',exchangeIndices:[]});
const OPS=[['plus','+'],['minus','−'],['times','×'],['divide','÷'],['pair','COPPIA'],['trips','TRIS']];
const format=sig=>{
 if(!sig)return '?';
 if(sig.kind==='any')return sig.options.map(format).join(' oppure ');
 if(sig.kind==='poker')return sig.pattern==='trips'?'Poker · tris':'Poker · coppia';
 return (OPS.find(([op])=>op===sig.op)?.[1]??'?')+' → '+sig.target;
};
const hpPct=(hp,max)=>max>0?Math.round(hp/max*100):0;
const clamp=n=>Math.max(0,Math.min(100,n));
function Meter({hp,max,label}){
 return <div className="tdp-meter">
  <div className="tdp-meter-label"><span>{label}</span><b>{hp}/{max}</b></div>
  <div className="tdp-meter-track"><span style={{width:clamp(hpPct(hp,max))+'%'}}/></div>
 </div>;
}
function Vessel({side,title,facing,hullRef}){
 const {defense,escorts}=side;
 const hardware=side.weapons.map(weapon=>{
  const catalog=PHASE1_CATALOG.weapons.find(item=>item.id===weapon.id);
  return {...catalog,id:weapon.id,damage:weapon.damage};
 });
 const originalVessel={id:side.shipId,level:side.level,weapons:hardware};
 return <article className={'tdp-vessel '+(facing==='enemy'?'tdp-enemy':'tdp-player')} data-ship={side.shipId} data-level={side.level}>
  <div className="tdp-vessel-heading"><strong>{title}</strong><small>{side.name} · L{side.level}</small></div>
  <div className="tdp-hull">
   <svg ref={hullRef} viewBox="0 0 1000 1000" role="img" aria-label={side.name}>
    <ShipArtwork side={facing} vessel={originalVessel}/>
   </svg>
   <MountedWeapons side={facing} vessel={originalVessel} index={0}/>
  </div>
  {escorts.map((escort,index)=><div key={escort.id}
    className={'tdp-escort-ship tdp-escort-ship-'+(index+1)+(escort.hp<=0?' is-destroyed':'')}
    title={'Scudiera '+(index+1)+' · '+escort.hp+'/'+escort.max+' HP'}>
    <img src={'/assets/escorts/'+side.shipId+'_escort_'+(index+1)+'.svg'}
      alt={'Scudiera '+(index+1)} loading="eager"/>
    <small>{escort.hp}/{escort.max}</small>
   </div>)}
  <Meter label="Barriera" hp={defense.shield.hp} max={defense.shield.max}/>
  <div className="tdp-tech">Armi: {side.weapons.map(w=>w.name).join(' · ')} · Potenza {nativeBarrierPacket(side)} · {dominantTacticalTechnology(side.weapons)}</div>
  <div className="tdp-escort">Scudiere: {escorts.length?escorts.map(e=>e.hp+'/'+e.max+' HP').join(' · '):'nessuna'}</div>
  <div className="tdp-parts" aria-label={'Sistemi vitali di '+side.name}>
   {VITAL_IDS.map(id=>{
    const part=defense.parts[id];
    const damaged=part.hp<part.max;
    return <span key={id} className={'tdp-part'+(part.hp===0?' tdp-part--ko':damaged?' tdp-part--damaged':'')}>
     <b>{VITAL_LABELS[id]}</b><small>{part.hp===0?'KO':part.hp+'/'+part.max}</small>
    </span>;
   })}
  </div>
 </article>;
}
function CurrentVitals({side,viewer,choose,selected}){
 return <div className="tdp-vitals">
  {VITAL_IDS.map(id=>{
   const p=side.defense.parts[id];
   const revealed=p.exposed||viewer.seen.includes(id)||p.hp===0;
   return <button type="button" key={id} className={'tdp-vital '+(selected===id?'is-selected ':'')+(p.hp===0?'is-dead':'')}
    onClick={()=>choose(id)}>
    <strong>{VITAL_LABELS[id]}</strong><span>{p.hp}/{p.max} HP {p.exposed?'· ESPOSTO':p.hp===0?'· KO':'· PROTETTO'}</span>
    <small>{revealed?format(p.signature):'Firma sconosciuta'}</small>
   </button>;
  })}
 </div>;
}
const toggle=(items,i,max)=>items.includes(i)?items.filter(x=>x!==i):items.length>=max?items:[...items,i];
const explainError={
 already_committed:'Ordini già confermati.',preparation_expired:'Preparazione scaduta.',
 numeric_selection:'Scelta numerica non valida.',numeric_count:'Seleziona 2 o 3 numeriche.',
 invalid_precision:'Seleziona un vitale e una formula.',
 special_selection:'Puoi preparare massimo 2 speciali.',duplicate_special:'Le due speciali devono essere diverse.',
 fusion_unavailable:'Fusione: 100 Sincronia, motore e centralina operativi; una o due scudiere in base alla carta.',
 fusion_conflict:'Puoi preparare una sola fusione per scontro.',
 cover_unavailable:'Copertura richiede una scudiera operativa e centralina attiva.',
 escort_repair_unavailable:'Non ci sono scudiere operative danneggiate da riparare.',
 purge_unavailable:'Pulizia Sistemi richiede uno stato negativo attivo.',
 counter_target:'La contromisura richiede un vitale da proteggere.',
 repair_unavailable:'Riparazione non possibile: barriera piena o generatore KO.',
 recycle_requires_card:'Serve la carta Ricambio Numerico.',card_double_spend:'Non puoi usare la stessa numerica due volte.',
 weapon_focus_invalid:'Scegli un’arma realmente equipaggiata sulla navicella.',
 epic_locked:'Oggetto Epico non ancora sbloccato.',epic_already_used:'Oggetto Epico già utilizzato in questa battaglia.',
 epic_already_active:'Un Oggetto Epico è già attivo.',epic_conflict:'Puoi attivare un solo Oggetto Epico per scontro.',
 epic_not_critical:'Questo Epico richiede che i vitali siano al 30% o meno.',
 epic_requires_heavy:'Serve una vera arma pesante integrata.',
 epic_choice_not_ready:'Le carte future si scelgono nel ciclo dopo l’attivazione.',
 epic_choice_invalid:'Scelta dell’Oggetto Epico non valida.'
};
export default function TacticalDuelPrototype(){
 const [battle,setBattle]=useState(()=>createTacticalDuel({nowMs:Date.now()}));
 const [draft,setDraft]=useState(BLANK);
 const [now,setNow]=useState(Date.now());
 const [error,setError]=useState('');
 const [shipChoiceA,setShipChoiceA]=useState('C01');
 const [shipChoiceB,setShipChoiceB]=useState('R04');
 const [shipLevelA,setShipLevelA]=useState(3);
 const [shipLevelB,setShipLevelB]=useState(3);
 const [presetA,setPresetA]=useState('starter');
 const [epicPreview,setEpicPreview]=useState('');
 const [bossPlanet,setBossPlanet]=useState(0);
 const hullA=useRef(null),hullB=useRef(null);
 useEffect(()=>{
  const tick=setInterval(()=>{
   const time=Date.now();
   setNow(time);
   setBattle(current=>advanceTacticalDuel(current,time));
  },200);
  return ()=>clearInterval(tick);
 },[]);
 useEffect(()=>{
  if(battle.phase!=='planning'||battle.orders.B)return;
  setBattle(current=>{
   if(current.phase!=='planning'||current.orders.B)return current;
   const choice=planTacticalDemoAi(current,'B');
   const sealed=sealTacticalOrder(current,'B',choice,Date.now());
   return sealed.ok?sealed.battle:current;
  });
 },[battle.round,battle.phase,battle.orders.B]);
 useEffect(()=>{setDraft(BLANK());setError('');},[battle.round]);
 const combatTime=tacticalPlaybackElapsed(battle,now);
 const visibleSides=projectedCombatSides(battle,combatTime);
 const a=battle.sides.A,b=battle.sides.B;
 const visibleA=visibleSides.A,visibleB=visibleSides.B;
 const planning=battle.phase==='planning';
 const locked=!planning||!!battle.orders.A;
 const specials=draft.specialIndices.map(i=>a.special.hand[i]?.type);
 const activeEpic=a.epic.active?.untilRound>=battle.round?a.epic.active:null;
 const epicChoiceReady=activeEpic&&activeEpic.startedRound<battle.round&&
  ['epic_item_1','epic_item_3'].includes(activeEpic.id);
 const selectedNumeric=draft.numericIndices.map(i=>a.numeric.hand[i]).filter(Boolean);
 const counterSpecial=specials.includes('tactic-counter');
 const recycler=specials.includes('tactic-numeric-recycle');
 const canExchange=recycler||draft.numericIndices.length===0;
 function commit(){
  const time=Date.now();
  const result=sealTacticalOrder(battle,'A',draft,time);
  if(!result.ok){setError(explainError[result.reason]||result.reason);return;}
  setBattle(advanceTacticalDuel(result.battle,time));
  setError('');
 }
 function restart(){
  const time=Date.now();
  const bossSpecials=bossPlanet?buildTacticalBossDeck(bossPlanet,shipLevelB,shipLevelA):null;
  const selected=presetA==='starter'?[...TACTICAL_PRESETS.starter.types]:[...TACTICAL_PRESETS[presetA].types];
  if(epicPreview)selected[0]=epicPreview;
  setBattle(createTacticalDuel({shipA:shipChoiceA,shipB:shipChoiceB,
   levelA:shipLevelA,levelB:shipLevelB,nowMs:time,
   specialDeckA:presetA==='starter'&&!epicPreview?null:selected,
   epicEntitlementsA:epicPreview?[epicPreview]:[],
   previewEpicOpeningA:epicPreview||null,
   specialDeckB:bossSpecials,bossPlanetB:bossPlanet||null}));
  setDraft(BLANK());setError('');setNow(time);
 }
 const seconds=planning?Math.ceil(Math.max(0,battle.deadlineMs-now)/1000):Math.ceil(Math.max(0,(battle.resolveUntilMs??now)-now)/1000);
 const status=battle.phase==='finished'?(battle.winner==='draw'?'PAREGGIO':battle.winner==='A'?'HAI VINTO':'VITTORIA IA'):
  battle.phase==='resolving'?'SCONTRO IN CORSO':'PREPARAZIONE';
 return <main className={"tdp"+(battle.phase==='resolving'?" is-resolving":"")}>
  <header className="tdp-top">
   <div><p>ESPERIMENTO · NON MODIFICA I SALVATAGGI</p><h1>DUELLO TATTICO</h1></div>
   <a href={window.location.pathname} className="tdp-exit">Torna al gioco</a>
  </header>
  <details className="tdp-setup" aria-label="Configurazione flotta di prova">
   <summary>CONFIGURA FLOTTA · NAVI, MAZZO E BOSS</summary>
   <p>PROVA LE 17 NAVICELLE · NESSUN SBLOCCO O SPESA</p>
   <div className="tdp-setup-grid">
    <label>Tua nave
     <select value={shipChoiceA} onChange={e=>setShipChoiceA(e.target.value)}>
      {PHASE1_CATALOG.ships.map(ship=><option key={ship.id} value={ship.id}>{ship.nome}</option>)}
     </select>
    </label>
    <label>Livello
     <select value={shipLevelA} onChange={e=>setShipLevelA(Number(e.target.value))}>
      {[1,2,3,4,5].map(n=><option key={n} value={n}>L{n}</option>)}
     </select>
    </label>
    <label>Nemico
     <select value={shipChoiceB} onChange={e=>setShipChoiceB(e.target.value)}>
      {PHASE1_CATALOG.ships.map(ship=><option key={ship.id} value={ship.id}>{ship.nome}</option>)}
     </select>
    </label>
    <label>Livello
     <select value={shipLevelB} onChange={e=>setShipLevelB(Number(e.target.value))}>
      {[1,2,3,4,5].map(n=><option key={n} value={n}>L{n}</option>)}
     </select>
    </label>
   </div>
   <div className="tdp-setup-extra">
    <label>Mazzo speciale giocatore
     <select value={presetA} onChange={e=>setPresetA(e.target.value)}>
      {Object.entries(TACTICAL_PRESETS).map(([id,plan])=><option key={id} value={id}>{plan.label} · 24 carte</option>)}
     </select>
    </label>
    <label>IA avversaria
     <select value={bossPlanet} onChange={e=>setBossPlanet(Number(e.target.value))}>
      <option value={0}>IA normale</option>
      {Object.keys(TACTICAL_BOSS_PLANS).map(id=><option key={id} value={id}>{tacticalBossProfile(id).name}</option>)}
     </select>
    </label>
   </div>
   <label className="tdp-epic-preview">Oggetto Epico da provare (solo sandbox, NON sbloccato nell'account)
    <select value={epicPreview} onChange={e=>setEpicPreview(e.target.value)}>
     <option value="">Nessun Oggetto Epico</option>
     {Object.values(TACTICAL_EPIC_CARDS).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
   </label>
   {bossPlanet>0&&<p className="tdp-boss-note">Piano IA: {tacticalBossProfile(bossPlanet).style}. Mazzo boss da 24 carte con scudiere compatibili.</p>}
   <button type="button" onClick={restart}>AVVIA PARTITA CON QUESTE NAVI</button>
  </details>
  <section className="tdp-cycle">
   <div><small>CICLO {battle.round}</small><strong>{status}</strong></div>
   <div className="tdp-clock"><strong>{seconds}s</strong><small>{planning?'30 s per preparare':'8 s di scontro'}</small></div>
  </section>
  <div className="tdp-arena" aria-label="Piattaforma di Titanio originale, Eclissi Stellare">
   <div className="tdp-arena-rim" aria-hidden="true"/>
   <Vessel side={visibleB} title={b.bossPlanetId?"BOSS · "+tacticalBossProfile(b.bossPlanetId)?.name:"AVVERSARIO · IA DI PROVA"} facing="enemy" hullRef={hullB}/>
   <div className="tdp-divider"><span>SCUDI · BRECCE · SISTEMI VITALI</span></div>
   <Vessel side={visibleA} title="LA TUA NAVE" facing="player" hullRef={hullA}/>
   <TacticalCombatPlayback battle={battle} nowMs={now} hulls={{A:hullA,B:hullB}}/>
  </div>
  <section className="tdp-section">
   <h2>Armi integrate · priorità tecnologica</h2>
   <label className="tdp-focus">Privilegia una delle tue armi nel prossimo scontro
    <select value={draft.weaponFocusId??a.weapons[0]?.id??''} disabled={locked}
     onChange={e=>setDraft(d=>({...d,weaponFocusId:e.target.value}))}>
     {a.weapons.map(w=><option key={w.id} value={w.id}>{w.name} · {dominantTacticalTechnology([w])}</option>)}
    </select>
   </label>
   <p className="tdp-help">Tutte le armi sparano sulla barriera. L’arma scelta determina il comportamento tecnologico: nessuna munizione speciale uguale per tutte.</p>
  </section>
  <section className="tdp-section">
   <h2>Seleziona il sistema vitale nemico</h2>
   <CurrentVitals side={visibleB} viewer={a} selected={draft.vitalId}
    choose={id=>{if(!locked)setDraft(d=>({...d,vitalId:id}));}}/>
   <p className="tdp-help">Le armi native attaccano sempre la barriera. Il calcolo colpisce un vitale soltanto se esposto e valido.</p>
  </section>
  <section className="tdp-section">
   <h2>Carte speciali <small>seleziona al massimo 2</small></h2>
   <div className="tdp-cards">
    {a.special.hand.map((card,i)=><button type="button" key={card.id} disabled={locked}
      aria-pressed={draft.specialIndices.includes(i)} className={'tdp-special '+(draft.specialIndices.includes(i)?'on':'')}
      onClick={()=>setDraft(d=>({...d,specialIndices:toggle(d.specialIndices,i,2)}))}>
      <span className="tdp-symbol">✦</span><strong>{TACTICAL_SPECIALS[card.type]?.name||card.type}</strong>
      <small>{TACTICAL_SPECIALS[card.type]?.help}</small>
     </button>)}
   </div>
   {activeEpic&&<p className="tdp-epic-status">EPICO ATTIVO: {TACTICAL_EPIC_CARDS[activeEpic.id]?.name} · fino al ciclo {activeEpic.untilRound}</p>}
   {a.epic.peek.length>0&&<p className="tdp-epic-peek">Pescate rivelate dal tuo Epico: {a.epic.peek.map(c=>String(c.value)+c.suit).join(' · ')}</p>}
   {epicChoiceReady&&<label className="tdp-epic-choice">Scegli la carta futura da anticipare
    <select disabled={locked} value={draft.epicChoice??''}
     onChange={e=>setDraft(d=>({...d,epicChoice:e.target.value===''?null:Number(e.target.value)}))}>
     <option value="">Nessuna scelta</option>
     {a.epic.peek.map((c,i)=><option key={i} value={i}>{i+1}. {c.value}{c.suit}</option>)}
    </select>
   </label>}
   {counterSpecial&&<label className="tdp-option">Difendi con contromisura:
    <select disabled={locked} value={draft.counterVitalId} onChange={e=>setDraft(d=>({...d,counterVitalId:e.target.value}))}>
     {VITAL_IDS.map(id=><option key={id} value={id}>{VITAL_LABELS[id]}</option>)}
    </select>
   </label>}
   {recycler&&<p className="tdp-help">Ricambio numerico: abilita la selezione delle carte da sostituire a fine ciclo.</p>}
  </section>
  <section className="tdp-section">
   <h2>Munizioni numeriche <small>2 o 3 per un vitale</small></h2>
   <div className="tdp-numbers">
    {a.numeric.hand.map((card,i)=><button type="button" key={card.id}
      disabled={locked} aria-pressed={draft.numericIndices.includes(i)}
      className={'tdp-number '+(draft.numericIndices.includes(i)?'on':'')}
      onClick={()=>setDraft(d=>{
       const numericIndices=toggle(d.numericIndices,i,3);
       return {...d,numericIndices,exchangeIndices:recycler||numericIndices.length===0?d.exchangeIndices:[]};
      })}>
      <strong>{card.value===1?'A':card.value===11?'J':card.value===12?'Q':card.value===13?'K':card.value}</strong>
      <span style={{color:['♥','♦'].includes(card.suit)?'#ff808c':'#c2e4ff'}}>{card.suit}</span>
     </button>)}
   </div>
   <div className="tdp-ops">
    {OPS.map(([op,label])=><button type="button" key={op} disabled={locked}
      aria-pressed={draft.op===op} className={draft.op===op?'on':''}
      onClick={()=>setDraft(d=>({...d,op}))}>{label}</button>)}
   </div>
   {selectedNumeric.length>0&&<p className="tdp-help">Numeriche scelte: {selectedNumeric.map(c=>c.value+c.suit).join(' · ')} · bersaglio: {VITAL_LABELS[draft.vitalId]||'non scelto'}</p>}
   {canExchange&&<div className="tdp-exchange">
    <strong>{recycler?'Ricambia fino a 2 numeriche':'Senza attacco di precisione puoi ricambiare 1 numerica per ciclo'}:</strong>
    <div className="tdp-exchange-list">{a.numeric.hand.map((card,i)=><button key={card.id} type="button"
      disabled={locked||draft.numericIndices.includes(i)} aria-pressed={draft.exchangeIndices.includes(i)}
      className={draft.exchangeIndices.includes(i)?'on':''}
      onClick={()=>setDraft(d=>({...d,exchangeIndices:toggle(d.exchangeIndices,i,recycler?2:1)}))}>
      {card.value}{card.suit} ↻
     </button>)}</div>
   </div>}
  </section>
  <section className="tdp-action">
   <div><strong>Sincronia: {a.sync}/100</strong><small>La fusione difensiva richiede una scudiera viva.</small></div>
   <button type="button" disabled={locked} onClick={commit}>
    {battle.orders.A?'ORDINI CONFERMATI':planning?'PRONTO · ESEGUI SCONTRO':'ATTENDI'}
   </button>
  </section>
  {error&&<p className="tdp-error" role="alert">{error}</p>}
  {(battle.phase!=='resolving'&&(battle.lastEvents.length>0||battle.phase==='finished'))&&<section className="tdp-section tdp-log">
   <h2>Registro dello scontro {battle.round===1?1:battle.phase==='planning'?battle.round-1:battle.round}</h2>
   <ol>{battle.lastEvents.map((event,i)=><li key={i}>{event}</li>)}</ol>
   {battle.phase==='finished'&&<button type="button" className="tdp-restart" onClick={restart}>NUOVA PARTITA</button>}
  </section>}
  <footer className="tdp-foot">Prototipo isolato · 24 speciali, 5 in mano, 7 numeriche · nessuna ricompensa · IA locale dimostrativa</footer>
 </main>;
}
