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
export const COMPONENT_TIMER_STATUS='SIMULATION_ONLY';

export function componentDurations(shipId,rarity){
 const base=COMPONENT_TIMER_BASE_SECONDS[shipId],bonus=COMPONENT_TIMER_RARITY_BONUS[rarity];
 if(!base||!Number.isFinite(bonus))throw Error('Profilo timer mancante '+shipId+'/'+rarity);
 return Object.freeze(Object.fromEntries(TIMED_COMPONENT_IDS.map(id=>[id,base[id]+bonus])));
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
 if(!(drainFraction>0&&drainFraction<.03))throw Error('Tasso deterioramento fuori collaudo');
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
 const hpLost=Math.min(mother.hp,Math.max(0,Math.round(
  mother.maxHp*drainFraction*deteriorationSeconds*100)/100));
 mother.hp=Math.max(0,Math.round((mother.hp-hpLost)*100)/100);
 side.componentElapsedSeconds=now;
 return Object.freeze({elapsedSeconds:now,allExpiredAt,
  expired:TIMED_COMPONENT_IDS.filter(id=>side.componentTimers[id].expired),
  newlyExpired:TIMED_COMPONENT_IDS.filter(id=>side.componentTimers[id].expired&&
   !previouslyExpired.includes(id)),
  deteriorationSeconds,hpLost,allExpired:TIMED_COMPONENT_IDS.every(id=>
   side.componentTimers[id].expired),motherHp:mother.hp});
}

export function advanceBattleComponentClock(battle,elapsedSeconds,options){
 const previous=Number(battle?.componentClockSeconds)||0;
 const seconds=Math.max(previous,Math.floor(Number(elapsedSeconds)||0));
 if(battle.phase!=='playing')return {battle,elapsedSeconds:previous,events:[]};
 const events=[];
 for(const [who,side] of Object.entries(battle.sides)){
  const result=advanceTimedComponents(side,seconds,options);
  for(const id of result.newlyExpired)events.push({who,kind:'component-expired',component:id,atSecond:seconds});
  if(result.deteriorationSeconds)events.push({who,kind:'mother-deterioration',
   hpLost:result.hpLost,seconds:result.deteriorationSeconds});
 }
 battle.componentClockSeconds=seconds;
 const a=battle.sides.A.ships[0].hp<=0,b=battle.sides.B.ships[0].hp<=0;
 if(a||b){battle.phase='finished';battle.winner=a&&b?'draw':a?'B':'A';
  battle.finishReason='Deterioramento nave madre dopo esaurimento Arsenale, Centralina e Plancia';
  battle.finishedAtMs=battle.startedAtMs+seconds*1000;}
 return {battle,elapsedSeconds:seconds,events};
}
