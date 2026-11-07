import {damageMotherShield} from './vitalDefense.js';
// Capacita ESCLUSIVE dei boss nemici, distinte dalle 23 passive collezionabili.
// Gaia, Tharsis, Matriarca Tossica, Crono, Sentinella Ionica, Leviatano e Signore delle Ombre sono attivi nel motore simultaneo.
// Il numero del pianeta viene dal catalogo boss ufficiale, non dalla carta mazzo.
// Nessun danno gratuito, nessuna lettura delle mani/ordini avversari.
export const READY_EXCLUSIVE_BOSS_IDS=Object.freeze([1,2,3,6,7,8,9]);
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

// Crono (Saturno): a real tactic-counter card must block a valid incoming
// precision strike. Only then charge one native +5% volley. The shot must
// hurt the barrier within the NEXT TWO cycles, otherwise charge expires.
// No extra projectiles or retaliation if the boss has no real gun hit.
export function rememberExclusiveChronoCounter(defender,round){
 const state=defender?.bossExclusive;
 if(state?.id!==6||!Number.isSafeInteger(round)||round<1)return false;
 defender.bossExclusive={...state,counterArmedAfterRound:round,counterExpiresRound:round+2};
 return true;
}
export function exclusiveChronoNativeBonus(attacker,base,round){
 const state=attacker?.bossExclusive;
 const inactive={active:false,percentage:0,extra:0};
 if(state?.id!==6||!Number.isSafeInteger(round)||!Number.isSafeInteger(base)||base<=0||
    !(state.counterArmedAfterRound>0)||
    round<=state.counterArmedAfterRound||round>state.counterExpiresRound)return inactive;
 return {active:true,percentage:5,extra:Math.ceil(base*.05-1e-9)};
}
export function rememberExclusiveChronoNativeHit(attacker,round,barrierDamage,bonus){
 const state=attacker?.bossExclusive;
 if(state?.id!==6)return attacker;
 if(bonus?.active&&barrierDamage>0){
  attacker.bossExclusive={...state,counterArmedAfterRound:0,counterExpiresRound:0};
 }else if(state.counterExpiresRound>0&&state.counterExpiresRound<=round){
  attacker.bossExclusive={...state,counterArmedAfterRound:0,counterExpiresRound:0};
 }
 return attacker;
}


// Sentinella Ionica (Urano, ID 7): Sifone Quantico.
// A native volley must actually damage the mother BARRIER, not merely an
// escort or a protected vital. Transfer REAL existing sync from the defender
// to the boss, after both native volleys and before the cycle's sync rewards.
// The transfer is limited by victim holdings AND boss free capacity; no
// resource is created, no overflow is discarded, and each round has one shot.
// This ability belongs to the ENEMY BOSS, not the numeric deck of Urano.
export const IONIC_SIPHON_MAX=8;
export function transferExclusiveIonicSync(attacker,defender,barrierDamage){
 const inactive={transferred:0,reason:'inactive'};
 if(attacker?.bossExclusive?.id!==7)return inactive;
 if(!Number.isFinite(barrierDamage)||barrierDamage<=0)
  return {...inactive,reason:'no_barrier_damage'};
 const ours=attacker.sync,theirs=defender?.sync;
 if(!Number.isSafeInteger(ours)||!Number.isSafeInteger(theirs)||
    ours<0||ours>100||theirs<0||theirs>100)
  return {...inactive,reason:'invalid_sync'};
 const transferred=Math.min(IONIC_SIPHON_MAX,theirs,100-ours);
 if(transferred<=0)return {...inactive,reason:theirs<=0?'defender_empty':'attacker_full'};
 attacker.sync=ours+transferred;
 defender.sync=theirs-transferred;
 return {transferred,reason:'transferred'};
}


// Leviatano Abissale (Nettuno, ID 8) - Pressione degli abissi.
// The enemy barrier is sampled at the START of the simultaneous cycle,
// before repair, native fire, precision or other resolution-phase changes.
// No access to the opponent's hidden order, draw or numeric signature.
// Native weapons only; the modifier shares the normal +45% volley bonus cap.
export const ABYSSAL_PRESSURE_THRESHOLD_PERCENT=40;
export const ABYSSAL_PRESSURE_BONUS_PERCENT=8;
export function exclusiveLeviatanoNativeBonus(attacker,base,enemyShieldAtCycleStart){
 const inactive={active:false,percentage:0,extra:0,remainder:0};
 if(attacker?.bossExclusive?.id!==8||!Number.isSafeInteger(base)||base<=0)
  return inactive;
 const shield=enemyShieldAtCycleStart;
 if(!shield||!Number.isFinite(shield.hp)||!Number.isFinite(shield.max)||
    shield.max<=0||shield.hp<0||shield.hp>shield.max||
    shield.hp*100>shield.max*ABYSSAL_PRESSURE_THRESHOLD_PERCENT)
  return inactive;
 const stored=attacker.bossExclusive.pressureRemainder;
 const previous=Number.isInteger(stored)&&stored>=0&&stored<100?stored:0;
 const points=base*ABYSSAL_PRESSURE_BONUS_PERCENT+previous;
 return {active:true,percentage:ABYSSAL_PRESSURE_BONUS_PERCENT,
  extra:Math.floor(points/100),remainder:points%100};
}
// Carry fractional damage ONLY after a volley truly damages the mother
// barrier. Fully intercepted shots cannot grow future boss power.
export function rememberExclusiveLeviatanoNativeHit(attacker,barrierDamage,bonus){
 const state=attacker?.bossExclusive;
 if(state?.id!==8||!bonus?.active||!(barrierDamage>0))return attacker;
 attacker.bossExclusive={...state,pressureRemainder:bonus.remainder};
 return attacker;
}


// Signore delle Ombre (Plutone, boss ID 9) — Patto di sangue.
// A voluntary trade: 4 REAL shield HP for +8% to this cycle's REAL
// native-weapon packet. The shield debit happens BEFORE preparations and
// opposing volleys, so the price remains paid even if the shot is intercepted.
// No debit with shield <=12 HP, destroyed generator, or on cooldown.
// The last activation round is held in the boss-only exclusive state.
// First eligible round: 1; next eligible rounds: 4, 7, 10, ...
export const BLOOD_PACT_COST=4;
export const BLOOD_PACT_MIN_SHIELD_EXCLUSIVE=12;
export const BLOOD_PACT_COOLDOWN_ROUNDS=3;
export const BLOOD_PACT_BONUS_PERCENT=8;
export function prepareExclusiveBloodPact(side,round,realNativePacket){
 const inactive={armed:false,paid:0,reason:'inactive'};
 if(side?.bossExclusive?.id!==9)return inactive;
 if(!Number.isSafeInteger(round)||round<1)return {...inactive,reason:'invalid_round'};
 if(!Number.isSafeInteger(realNativePacket)||realNativePacket<=0)
  return {...inactive,reason:'no_native_guns'};
 const last=side.bossExclusive.bloodPactLastRound;
 if(Number.isSafeInteger(last)&&round-last<BLOOD_PACT_COOLDOWN_ROUNDS)
  return {...inactive,reason:'cooldown'};
 const defense=side.defense;
 if(!defense||defense.kind!=='mother'||defense.parts?.shieldGenerator?.hp<=0)
  return {...inactive,reason:'generator_offline'};
 if(!Number.isSafeInteger(defense.shield?.hp)||defense.shield.hp<=BLOOD_PACT_MIN_SHIELD_EXCLUSIVE)
  return {...inactive,reason:'insufficient_shield'};
 const paid=damageMotherShield(defense,BLOOD_PACT_COST);
 if(paid.damage!==BLOOD_PACT_COST)throw new Error('Patto di sangue: costo reale non pagato');
 side.defense=paid.defense;
 side.bossExclusive={...side.bossExclusive,bloodPactLastRound:round,bloodPactArmedRound:round};
 return {armed:true,paid:paid.damage,round,percentage:BLOOD_PACT_BONUS_PERCENT};
}
export function exclusiveBloodPactNativeBonus(side,base,round){
 const inactive={active:false,percentage:0,extra:0};
 if(side?.bossExclusive?.id!==9||side.bossExclusive.bloodPactArmedRound!==round||
    !Number.isSafeInteger(base)||base<=0)return inactive;
 // Small authentic guns must not pay four shield HP for an 8% bonus
 // rounded all the way to zero; the global +45% cap still applies.
 return {active:true,percentage:BLOOD_PACT_BONUS_PERCENT,
  extra:Math.ceil(base*BLOOD_PACT_BONUS_PERCENT/100-1e-9)};
}
