// Nuova regola di battaglia: HP della nave madre e danno filtrato dalle scudiere.
// I sistemi interni (Arsenale, Generatore, Centralina, Plancia) sono conservati
// per precondizioni, poteri e future carte sabotaggio; non sono la condizione di vittoria.
export const HP_SYNC_RULESET='hp-sync-v2';

export function motherIntegrityFromSystems(parts=[]){
 return Math.max(1,parts.reduce((total,part)=>total+Math.max(0,part.maxHp||0),0));
}

// Le percentuali di interferenza non si sommano: vale quella più forte.
export function activeSynchronizationPenalty(side,ply=0){
 const effects=side?.synchronizationEffects||[];
 return effects.filter(e=>e.untilPly>ply)
  .reduce((maximum,e)=>Math.max(maximum,Math.min(100,Math.max(0,e.penaltyPercent||0))),0);
}

// Prima si determina il danno effettivo dell'attacco, poi lo si ripartisce una
// sola volta: es. 20 punti al 25% -> 15 alla scudiera, 5 alla madre.
export function splitSynchronizedDamage(damage,penaltyPercent=0){
 const total=Math.max(0,Math.floor(Number(damage)||0));
 const penalty=Math.max(0,Math.min(100,Number(penaltyPercent)||0));
 const mother=Math.round(total*penalty/100);
 return {total,support:total-mother,mother};
}

export function registerSynchronizationInterference(side,penaltyPercent,durationOwnTurns,ply){
 if(!Number.isInteger(durationOwnTurns)||durationOwnTurns<1)throw new Error('Durata non valida');
 if(!Number.isFinite(penaltyPercent)||penaltyPercent<0||penaltyPercent>100)
  throw new Error('Percentuale di interferenza non valida');
 side.synchronizationEffects??=[];
 side.synchronizationEffects.push({penaltyPercent,untilPly:ply+2*durationOwnTurns});
 return activeSynchronizationPenalty(side,ply);
}
