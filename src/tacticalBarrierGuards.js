// Eclissi Stellare: protezioni della BARRIERA MADRE, applicate dopo
// l'intercettazione delle scudiere. Una carica reale non si duplica tra
// la salva nativa e quella della scudiera nello stesso ciclo.
export const REACTIVE_BARRIER_ABSORPTION=9;
export const IMPACT_BARRIER_FACTOR=.8;

export function createTacticalBarrierGuard(status){
 const types=status?.types??[];
 return {
  reactiveRemaining:types.includes('tactic-reactive')?REACTIVE_BARRIER_ABSORPTION:0,
  moduleGuardRemaining:Math.max(0,Math.floor(status?.moduleFx?.guard??0)),
  impactActive:types.includes('tactic-impact')
 };
}

// Mutates the per-cycle guard counters only; NEVER mutates HP, cards or
// permanent defense structures. All real HP changes use damageMotherShield.
export function consumeTacticalBarrierGuard(packet,guard){
 const raw=Math.max(0,Math.floor(Number.isFinite(packet)?packet:0));
 if(!guard)return {packet:raw,absorbed:0,reactive:0,module:0,impact:0};
 let result=raw;
 const module=Math.min(result,Math.max(0,guard.moduleGuardRemaining??0));
 result-=module;guard.moduleGuardRemaining-=module;
 const reactive=Math.min(result,Math.max(0,guard.reactiveRemaining??0));
 result-=reactive;guard.reactiveRemaining-=reactive;
 const afterFlat=result;
 if(guard.impactActive)result=Math.floor(result*IMPACT_BARRIER_FACTOR);
 const impact=afterFlat-result;
 return {packet:result,absorbed:raw-result,reactive,module,impact};
}
