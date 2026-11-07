// Capacita ESCLUSIVE dei boss nemici, distinte dalle 23 passive collezionabili.
// Gaia, Tharsis e Matriarca Tossica sono attualmente attive nel duello simultaneo.
// Il numero del pianeta viene dal catalogo boss ufficiale, non dalla carta mazzo.
// Nessun danno gratuito, nessuna lettura delle mani/ordini avversari.
export const READY_EXCLUSIVE_BOSS_IDS=Object.freeze([1,2,3]);
export const exclusiveBossReady=id=>READY_EXCLUSIVE_BOSS_IDS.includes(Number(id));

export function createExclusiveBossState(planetId){
 const id=Number(planetId);
 if(!exclusiveBossReady(id))return null;
 return {id,armorUsed:false,streak:0,bonusRemainder:0};
}
// Gaia: una corazza iniziale mitiga il primo pacchetto reale sulla barriera.
// Colpi assorbiti interamente dalle scudiere NON consumano la corazza.
export function exclusiveBossShieldFactor(defender){
 const state=defender?.bossExclusive;
 return state?.id===1&&!state.armorUsed?.8:1;
}
export function rememberExclusiveBossDefenseHit(defender,barrierDamage){
 const state=defender?.bossExclusive;
 if(state?.id===1&&!state.armorUsed&&barrierDamage>0)
  defender.bossExclusive={...state,armorUsed:true};
 return defender;
}
// Tharsis: guadagna pressione solo in seguito a danni effettivi consecutivi.
// Il bonus entra nel normale cap di +45% delle modifiche alle armi native.
export function exclusiveBossNativeBonus(attacker,base){
 const state=attacker?.bossExclusive;
 const inactive={active:false,percentage:0,extra:0,remainder:0};
 if(state?.id!==2||state.streak<1||!Number.isSafeInteger(base)||base<=0)return inactive;
 const percentage=Math.min(9,state.streak*3);
 const previous=Number.isInteger(state.bonusRemainder)&&state.bonusRemainder>=0&&state.bonusRemainder<100
  ?state.bonusRemainder:0;
 const points=base*percentage+previous;
 return {active:true,percentage,extra:Math.floor(points/100),remainder:points%100};
}
export function rememberExclusiveBossNativeHit(attacker,barrierDamage,bonus){
 const state=attacker?.bossExclusive;
 if(state?.id!==2)return attacker;
 if(!(barrierDamage>0)){
  attacker.bossExclusive={...state,streak:0,bonusRemainder:0};
  return attacker;
 }
 attacker.bossExclusive={...state,streak:Math.min(3,state.streak+1),
  bonusRemainder:bonus?.active?bonus.remainder:0};
 return attacker;
}

// Matriarca Tossica (Venere): un colpo di precisione deve FERIRE un vitale
// esposto con una firma valida. Nessun veleno su colpi bloccati o a danno zero.
// La penalita vale soltanto per la prima riparazione di barriera nel
// successivo ciclo di preparazione, e scade comunque al termine del ciclo.
// L'attacco e la riparazione non si retroagiscono nello scontro simultaneo.
export const NEUROTOXIN_REPAIR_FACTOR=.90;
export function rememberExclusiveVenusPrecisionHit(attacker,defender,damage,round){
 if(attacker?.bossExclusive?.id!==3||!(damage>0)||
    !Number.isSafeInteger(round)||round<1)return false;
 defender.neurotoxinUntilRound=round+1;
 return true;
}
export function exclusiveNeurotoxinActive(side,round){
 return Number.isSafeInteger(round)&&round>0&&side?.neurotoxinUntilRound===round;
}
export function exclusiveNeurotoxinRepairAmount(side,round,normal=20){
 const amount=Number.isFinite(normal)&&normal>0?Math.floor(normal):0;
 return exclusiveNeurotoxinActive(side,round)?
  Math.floor(amount*NEUROTOXIN_REPAIR_FACTOR+1e-9):amount;
}
export function clearExclusiveNeurotoxin(side,round){
 if(exclusiveNeurotoxinActive(side,round)){
  side.neurotoxinUntilRound=0;
  return true;
 }
 return false;
}
export function expireExclusiveNeurotoxin(side,round){
 if((side?.neurotoxinUntilRound||0)<=round)side.neurotoxinUntilRound=0;
 return side;
}
