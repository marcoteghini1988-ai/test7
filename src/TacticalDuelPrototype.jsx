import React,{useEffect,useRef,useState} from 'react';
import {ShipArtwork} from './ShipPresentation.jsx';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {TACTICAL_SPECIALS,createTacticalDuel,
 sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket} from './simultaneousDuelEngine.js';
import {planTacticalDemoAi} from './tacticalDuelDemoAi.js';
import {projectedCombatSides,tacticalPlaybackElapsed} from './tacticalCombatTimeline.js';
import TacticalCombatPlayback from './TacticalCombatPlayback.jsx';
import './TacticalDuelPrototype.css';

const BLANK=()=>({specialIndices:[],numericIndices:[],vitalId:null,op:'plus',
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
 return <article className={'tdp-vessel '+(facing==='enemy'?'tdp-enemy':'')}>
  <div className="tdp-vessel-heading"><strong>{title}</strong><small>{side.name} · L{side.level}</small></div>
  <div className="tdp-hull">
   <svg ref={hullRef} viewBox="0 0 1000 1000" role="img" aria-label={side.name}>
    <ShipArtwork side={facing} vessel={{id:side.shipId,level:side.level}}/>
   </svg>
  </div>
  <Meter label="Barriera" hp={defense.shield.hp} max={defense.shield.max}/>
  <div className="tdp-tech">Armi: {side.weapons.map(w=>w.name).join(' · ')} · Potenza base {nativeBarrierPacket(side)}</div>
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
 fusion_unavailable:'Fusione: servono una scudiera, 100 Sincronia, motore e centralina operativi.',
 counter_target:'La contromisura richiede un vitale da proteggere.',
 repair_unavailable:'Riparazione non possibile: barriera piena o generatore KO.',
 recycle_requires_card:'Serve la carta Ricambio Numerico.',card_double_spend:'Non puoi usare la stessa numerica due volte.'
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
 const selectedNumeric=draft.numericIndices.map(i=>a.numeric.hand[i]).filter(Boolean);
 const counterSpecial=specials.includes('tactic-counter');
 const recycler=specials.includes('tactic-numeric-recycle');
 function commit(){
  const time=Date.now();
  const result=sealTacticalOrder(battle,'A',draft,time);
  if(!result.ok){setError(explainError[result.reason]||result.reason);return;}
  setBattle(advanceTacticalDuel(result.battle,time));
  setError('');
 }
 function restart(){
  const time=Date.now();
  setBattle(createTacticalDuel({shipA:shipChoiceA,shipB:shipChoiceB,
   levelA:shipLevelA,levelB:shipLevelB,nowMs:time}));
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
  <section className="tdp-setup" aria-label="Configurazione flotta di prova">
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
   <button type="button" onClick={restart}>AVVIA PARTITA CON QUESTE NAVI</button>
  </section>
  <section className="tdp-cycle">
   <div><small>CICLO {battle.round}</small><strong>{status}</strong></div>
   <div className="tdp-clock"><strong>{seconds}s</strong><small>{planning?'30 s per preparare':'8 s di scontro'}</small></div>
  </section>
  <div className="tdp-arena">
   <Vessel side={visibleB} title="AVVERSARIO · IA DI PROVA" facing="enemy" hullRef={hullB}/>
   <div className="tdp-divider"><span>SCUDI · BRECCE · SISTEMI VITALI</span></div>
   <Vessel side={visibleA} title="LA TUA NAVE" facing="player" hullRef={hullA}/>
   <TacticalCombatPlayback battle={battle} nowMs={now} hulls={{A:hullA,B:hullB}}/>
  </div>
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
      onClick={()=>setDraft(d=>({...d,numericIndices:toggle(d.numericIndices,i,3)}))}>
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
   {recycler&&<div className="tdp-exchange">
    <strong>Seleziona fino a 2 numeriche da ricambiare al termine dello scontro:</strong>
    <div className="tdp-exchange-list">{a.numeric.hand.map((card,i)=><button key={card.id} type="button"
      disabled={locked||draft.numericIndices.includes(i)} aria-pressed={draft.exchangeIndices.includes(i)}
      className={draft.exchangeIndices.includes(i)?'on':''}
      onClick={()=>setDraft(d=>({...d,exchangeIndices:toggle(d.exchangeIndices,i,2)}))}>
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
