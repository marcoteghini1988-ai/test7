// Collaudo delle durate componenti a tempo (candidati, NON valori finali).
// Generatore escluso: si surriscalda, non si distrugge.
// I tre timer decrescono contemporaneamente per entrambi i giocatori.
// Questa versione e' isolata nei test: non avvia timer nella plancia ufficiale.
import {SHIP_RARITIES} from './shipRarity.js';

// Secondi iniziali per modello: piu Arsenale per le navi offensive,
// piu Centralina/Plancia per le navi difensive o tattiche.
export const COMPONENT_TIMER_BASE_SECONDS=Object.freeze({
 N00:Object.freeze({weapons:250,command:260,bridge:271}),
 C01:Object.freeze({weapons:282,command:238,bridge:259}),
 C02:Object.freeze({weapons:269,command:249,bridge:280}),
 C03:Object.freeze({weapons:234,command:285,bridge:269}),
 R01:Object.freeze({weapons:291,command:239,bridge:255}),
 R02:Object.freeze({weapons:230,command:275,bridge:273}),
 R04:Object.freeze({weapons:227,command:287,bridge:261}),
 E01:Object.freeze({weapons:230,command:279,bridge:274}),
 E02:Object.freeze({weapons:292,command:233,bridge:264}),
 L01:Object.freeze({weapons:264,command:272,bridge:269}),
 L03:Object.freeze({weapons:231,command:288,bridge:269}),
 L04:Object.freeze({weapons:263,command:263,bridge:267})
});
export const TIMED_COMPONENT_IDS=Object.freeze(['weapons','command','bridge']);
export const COMPONENT_TIMER_RARITY_BONUS=Object.freeze({
 Comune:0,Rara:7,Epica:14,Leggendaria:21
});
// La perdita dopo tutti e tre i timer e' una ipotesi numerica
// da confrontare con .006 e .012. Nessun danno gratuito da Generatore.
export const CANDIDATE_DRAIN_FRACTION_PER_SECOND=.009;
export const COMPONENT_TIMER_STATUS='ACTIVE_NEW_COMBAT_MODE_PENDING_FINAL_BALANCE';

export function componentDurations(shipId,rarity){
 const base=COMPONENT_TIMER_BASE_SECONDS[shipId],bonus=COMPONENT_TIMER_RARITY_BONUS[rarity];
 if(!base||!Number.isFinite(bonus))throw Error('Profilo timer mancante '+shipId+'/'+rarity);
 return Object.freeze(Object.fromEntries(TIMED_COMPONENT_IDS.map(id=>[id,base[id]+bonus])));
}

// Profili strategici ufficiali: i tre sistemi scadono in ordine diverso
// secondo il modello della nave; il piu' longevo raggiunge sempre 3:30.
export function strategicComponentDurations(shipId){
 const raw=COMPONENT_TIMER_BASE_SECONDS[shipId];
 if(!raw)throw Error('Profilo madre senza timer strategici: '+shipId);
 const sorted=[...TIMED_COMPONENT_IDS].sort((a,b)=>
  raw[a]-raw[b]||TIMED_COMPONENT_IDS.indexOf(a)-TIMED_COMPONENT_IDS.indexOf(b));
 const [short,middle,long]=sorted;
 const earliest=Math.max(150,Math.min(185,
  194-Math.round((raw[long]-raw[short])*.45)));
 const median=Math.max(earliest+10,Math.min(198,
  200-Math.round((raw[long]-raw[middle])*.55)));
 return Object.freeze({[short]:earliest,[middle]:median,[long]:210});
}

export function initializeStrategicComponentTimers(side){
 const durations=strategicComponentDurations(side?.ships?.[0]?.id);
 side.componentElapsedSeconds=0;
 side.componentTimers=Object.fromEntries(TIMED_COMPONENT_IDS.map(id=>[id,{
  running:true,initialSeconds:durations[id],remainingSeconds:durations[id],expired:false
 }]));
 return durations;
}

export function initializeComponentTimers(side,rarity){
 const durations=componentDurations(side?.ships?.[0]?.id,rarity);
 side.componentElapsedSeconds=0;
 side.componentTimers=Object.fromEntries(TIMED_COMPONENT_IDS.map(id=>[id,{
  running:true,initialSeconds:durations[id],remainingSeconds:durations[id],expired:false
 }]));
 return durations;
}
export function advanceTimedComponents(side,elapsedSeconds,{drainFraction=CANDIDATE_DRAIN_FRACTION_PER_SECOND}={}){
 if(!side?.componentTimers||!side?.ships?.[0]||!Number.isFinite(elapsedSeconds))
  throw Error('Timer non inizializzati');
 // 0 e' consentito per il collaudo SENZA deterioramento: i timer
 // continuano a scadere e ad applicare le penalita' dei sistemi.
 if(!(drainFraction>=0&&drainFraction<.03))throw Error('Tasso deterioramento fuori collaudo');
 const now=Math.max(0,Math.floor(elapsedSeconds));
 const before=Math.min(now,Math.max(0,Math.floor(side.componentElapsedSeconds||0)));
 const previouslyExpired=TIMED_COMPONENT_IDS.filter(id=>side.componentTimers[id]?.expired);
 const expiries=TIMED_COMPONENT_IDS.map(id=>side.componentTimers[id].initialSeconds);
 const allExpiredAt=Math.max(...expiries);
 for(const id of TIMED_COMPONENT_IDS){
  const timer=side.componentTimers[id];
  timer.remainingSeconds=Math.max(0,timer.initialSeconds-now);
  timer.expired=timer.remainingSeconds===0;
 }
 // Si conta ogni secondo una sola volta dopo l'esaurimento del terzo componente.
 const deteriorationSeconds=Math.max(0,now-allExpiredAt)-
  Math.max(0,before-allExpiredAt);
 const mother=side.ships[0];
 // La quantita' e' cumulativa, con centesimi conservati: iterare secondo
 // per secondo produce lo stesso totale che avanzare direttamente 10 secondi.
 const endTotal=Math.round(mother.maxHp*drainFraction*Math.max(0,now-allExpiredAt)*100)/100;
 const startTotal=Math.round(mother.maxHp*drainFraction*Math.max(0,before-allExpiredAt)*100)/100;
 const hpLost=Math.min(mother.hp,Math.max(0,Math.round((endTotal-startTotal)*100)/100));
 mother.hp=Math.max(0,Math.round((mother.hp-hpLost)*100)/100);
 side.componentElapsedSeconds=now;
 return Object.freeze({elapsedSeconds:now,allExpiredAt,
  expired:TIMED_COMPONENT_IDS.filter(id=>side.componentTimers[id].expired),
  newlyExpired:TIMED_COMPONENT_IDS.filter(id=>side.componentTimers[id].expired&&
   !previouslyExpired.includes(id)),
  deteriorationSeconds,hpLost,allExpired:TIMED_COMPONENT_IDS.every(id=>
   side.componentTimers[id].expired),motherHp:mother.hp});
}

// Sondaggio bilanciamento: un orologio indipendente per ciascun giocatore.
// Modalita' OPT-IN, non e' il cronometro live finche' non viene approvata.
// Solo il turno del proprietario fa avanzare i suoi tre componenti e il
// deterioramento: secondi avversari e tempo fuori turno NON si sommano.
export function advanceBattleActivePlayerComponentClock(battle,nowMs){
 if(battle?.phase!=='playing'||!['A','B'].includes(battle?.turn))
  return {battle,events:[],changed:false};
 const who=battle.turn,side=battle.sides[who];
 if(!side?.componentTimers)throw Error('Timer del giocatore assenti');
 const start=Number(battle.turnStartedAtMs);
 if(!Number.isFinite(start)||!Number.isFinite(nowMs))
  throw Error('Turno privo di orologio valido');
 const maxTurnSeconds=Math.min(30,Math.max(0,Math.floor(
  (Number(battle.deadlineMs)-start)/1000)||30));
 const elapsed=Math.max(0,Math.min(maxTurnSeconds,
  Math.floor((Math.min(nowMs,battle.deadlineMs)-start)/1000)));
 const processed=battle.componentClockProcessedPly===battle.ply?
  Math.max(0,Math.floor(battle.componentTurnSecondsProcessed||0)):0;
 if(elapsed<=processed)return {battle,events:[],changed:false};
 const events=[];
 let hpLost=0,drainSeconds=0;
 const drainFraction=side.componentDeteriorationFraction??CANDIDATE_DRAIN_FRACTION_PER_SECOND;
 battle.componentClockProcessedPly=battle.ply;
 for(let second=processed+1;second<=elapsed;second++){
  const ownSecond=Math.max(0,Math.floor(side.componentElapsedSeconds||0))+1;
  const state=advanceTimedComponents(side,ownSecond,{drainFraction});
  for(const id of state.newlyExpired)
   events.push({who,kind:'component-expired',component:id,
    atOwnSecond:ownSecond,atSecond:ownSecond});
  hpLost=Math.round((hpLost+state.hpLost)*100)/100;
  drainSeconds+=state.deteriorationSeconds;
  battle.componentTurnSecondsProcessed=second;
  if(side.ships[0].hp<=0){
   battle.phase='finished';battle.winner=who==='A'?'B':'A';
   battle.finishReason='Deterioramento nave madre dopo esaurimento Arsenale, Centralina e Plancia';
   battle.finishedAtMs=start+second*1000;
   break;
  }
 }
 if(drainSeconds)events.push({who,kind:'mother-deterioration',
  hpLost,seconds:drainSeconds,ownClock:true});
 return {battle,events,changed:true};
}

// I secondi reali devono essere valutati nell'ordine: se una madre muore
// al secondo 312, NON si devono applicare i successivi 16 secondi del turno
// e trasformare artificialmente la vittoria in pareggio.
export function advanceBattleComponentClock(battle,elapsedSeconds,options){
 const previous=Math.max(0,Math.floor(Number(battle?.componentClockSeconds)||0));
 const target=Math.max(previous,Math.floor(Number(elapsedSeconds)||0));
 if(battle.phase!=='playing')return {battle,elapsedSeconds:previous,events:[]};
 const events=[],totalDamage={A:0,B:0},drainTime={A:0,B:0};
 for(let second=previous+1;second<=target;second++){
  for(const [who,side] of Object.entries(battle.sides)){
   // Il tasso e' specifico della rarita' nella partita aggiornata;
  // i vecchi test senza questa proprieta' conservano il valore esplicito.
  const settings=side.componentDeteriorationFraction!=null?
   {...options,drainFraction:side.componentDeteriorationFraction}:options;
  const result=advanceTimedComponents(side,second,settings);
   for(const id of result.newlyExpired)events.push({
    who,kind:'component-expired',component:id,atSecond:second
   });
   totalDamage[who]=Math.round((totalDamage[who]+result.hpLost)*100)/100;
   drainTime[who]+=result.deteriorationSeconds;
  }
  battle.componentClockSeconds=second;
  const deadA=battle.sides.A.ships[0].hp<=0,
   deadB=battle.sides.B.ships[0].hp<=0;
  if(deadA||deadB){
   battle.phase='finished';
   battle.winner=deadA&&deadB?'draw':deadA?'B':'A';
   battle.finishReason='Deterioramento nave madre dopo esaurimento Arsenale, Centralina e Plancia';
   battle.finishedAtMs=battle.startedAtMs+second*1000;
   break;
  }
 }
 for(const who of ['A','B'])if(drainTime[who])events.push({
  who,kind:'mother-deterioration',hpLost:totalDamage[who],seconds:drainTime[who]
 });
 return {battle,elapsedSeconds:battle.componentClockSeconds||previous,events};
}
