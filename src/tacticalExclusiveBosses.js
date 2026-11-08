import {damageMotherShield,restoreMotherShield} from './vitalDefense.js';
// Capacita ESCLUSIVE dei boss nemici, distinte dalle 23 passive collezionabili.
// Le dodici abilita esclusive dei boss hanno moduli nel motore simultaneo; la campagna boss usa ancora il percorso compatibile.
// Il numero del pianeta viene dal catalogo boss ufficiale, non dalla carta mazzo.
// Nessun danno gratuito, nessuna lettura delle mani/ordini avversari.
export const READY_EXCLUSIVE_BOSS_IDS=Object.freeze([1,2,3,6,7,8,9,11,14,17,19,20]);
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
 // Se una Neurotossina e' ancora attiva in QUESTO round, una nuova
 // precisione non deve cancellarla prima delle cure tardive (es. Dorata).
 // La nuova carica resta separata e matura soltanto nel round successivo.
 if(defender.neurotoxinUntilRound===round)
  defender.neurotoxinPendingRound=round+1;
 else defender.neurotoxinUntilRound=round+1;
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
 if(!side)return side;
 if(side.neurotoxinPendingRound===round+1){
  // Il nuovo colpo di Venere e' stato reale: promuovilo alla preparazione
  // seguente, anche se la tossina precedente e' stata curata nel frattempo.
  side.neurotoxinUntilRound=round+1;
  side.neurotoxinPendingRound=0;
 }else if((side.neurotoxinUntilRound||0)<=round){
  side.neurotoxinUntilRound=0;
 }
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


// IDRA CRIOGENICA — Europa (11): true native barrier hits schedule a
// single 4-HP barrier regeneration for the NEXT cycle. A valid HEART
// precision hit on an exposed boss vital counters that pending regeneration.
// Generator KO or a destroyed shield must never grant a free repair.
export const IDRA_REGEN_HP=4;
export const IDRA_REGEN_COOLDOWN=3;
export function prepareExclusiveIdraRegen(side,round){
 const state=side?.bossExclusive;
 if(state?.id!==11||state.regenPendingRound!==round)return {repaired:0,reason:'inactive'};
 const last=state.regenLastRound??-100;
 const cleared={...state,regenPendingRound:0};
 side.bossExclusive=cleared;
 if(round-last<IDRA_REGEN_COOLDOWN)return {repaired:0,reason:'cooldown'};
 if(side.defense?.parts?.shieldGenerator?.hp<=0)return {repaired:0,reason:'generator_offline'};
 if(side.defense.shield.hp>=side.defense.shield.max)return {repaired:0,reason:'shield_full'};
 const outcome=restoreMotherShield(side.defense,IDRA_REGEN_HP);
 if(outcome.repaired>0){
  side.defense=outcome.defense;
  side.bossExclusive={...cleared,regenLastRound:round};
 }
 return {repaired:outcome.repaired,reason:outcome.repaired>0?'regenerated':'no_repair'};
}
export function rememberExclusiveIdraBarrierHit(side,damage,round){
 const state=side?.bossExclusive;
 if(state?.id!==11||!(damage>0)||!Number.isSafeInteger(round)||
   side.defense?.parts?.shieldGenerator?.hp<=0||
   round-(state.regenLastRound??-100)+1<IDRA_REGEN_COOLDOWN)return false;
 side.bossExclusive={...state,regenPendingRound:round+1};
 return true;
}
export function cancelExclusiveIdraByHeart(side,damage,cards,round){
 const state=side?.bossExclusive;
 if(state?.id!==11||!(damage>0)||!Array.isArray(cards)||
   !cards.some(card=>card?.suit==='♥')||
   state.regenPendingRound!==round+1)return false;
 side.bossExclusive={...state,regenPendingRound:0};
 return true;
}

// GENERATORE DEL CAOS — Proxima b (14): build up to three charges from
// TRUE native barrier hits. After the third successful hit, the NEXT
// successful native volley gets +10%; failed volleys do not consume charge.
// The third charge itself NEVER deals bonus damage.
export const CHAOS_MAX_CHARGES=3;
export function exclusiveChaosNativeBonus(side,base){
 const state=side?.bossExclusive;
 const inactive={active:false,percentage:0,extra:0};
 if(state?.id!==14||!(state.chaosCharges>=CHAOS_MAX_CHARGES)||
    !Number.isSafeInteger(base)||base<=0)return inactive;
 return {active:true,percentage:10,extra:Math.ceil(base*.10-1e-9)};
}
export function rememberExclusiveChaosNativeHit(side,damage,bonus){
 const state=side?.bossExclusive;
 if(state?.id!==14||!(damage>0))return {charges:state?.chaosCharges??0,released:false};
 const charges=bonus?.active?0:Math.min(CHAOS_MAX_CHARGES,(state.chaosCharges??0)+1);
 side.bossExclusive={...state,chaosCharges:charges};
 return {charges,released:!!bonus?.active};
}

// CRISTALLO DI RISONANZA — Haumea (17): only two or more numeric
// cards ACTUALLY discarded by the opponent in the previous cycle can
// arm a future reward. The boss receives up to five REAL Sync, only on
// an effective native hit in exactly the next cycle. Never reads hidden hand.
export const RESONANCE_SYNC_REWARD=5;
export function rememberExclusiveResonanceDiscards(side,opponentSpentCount,round){
 const state=side?.bossExclusive;
 if(state?.id!==17||!Number.isSafeInteger(round)||round<1||
   !Number.isSafeInteger(opponentSpentCount))return false;
 const active=opponentSpentCount>=2;
 side.bossExclusive={...state,resonanceReadyRound:active?round+1:0};
 return active;
}
export function collectExclusiveResonanceSync(side,damage,round){
 const state=side?.bossExclusive;
 if(state?.id!==17||state.resonanceReadyRound!==round||
   !(damage>0))return 0;
 const gained=Math.min(RESONANCE_SYNC_REWARD,Math.max(0,100-side.sync));
 if(gained>0)side.sync+=gained;
 side.bossExclusive={...state,resonanceReadyRound:0};
 return gained;
}

// NUCLEO MAGMATICO — Io (19): visible 3-cycle phase, fixed by round,
// NOT by random rolls or the opponent's secret cards.
export const MAGMA_PHASES=Object.freeze(['carica','eruzione','raffreddamento']);
export function exclusiveMagmaPhase(side,round){
 if(side?.bossExclusive?.id!==19||!Number.isSafeInteger(round)||round<1)
  return null;
 return MAGMA_PHASES[(round-1)%3];
}
export function exclusiveMagmaNativeAdjustment(side,base,round){
 const phase=exclusiveMagmaPhase(side,round);
 if(!phase||!Number.isSafeInteger(base)||base<=0)
  return {phase,extra:0,penalty:0};
 return {phase,extra:phase==='eruzione'?Math.ceil(base*.10-1e-9):0,
  penalty:phase==='raffreddamento'?Math.ceil(base*.10-1e-9):0};
}

// SOVRANO DEL VUOTO — Encelado (20): public dominant suit changes every
// three cycles in a fixed four-suit sequence. A valid precision on the
// boss using that suit DISABLES its precision boost the NEXT round only.
// Boss precision remains subject to normal signature/exposure/escorts.
export const VOID_SUIT_CYCLE=Object.freeze(['♠','♥','♦','♣']);
export function exclusiveVoidDominantSuit(round){
 return Number.isSafeInteger(round)&&round>0?
  VOID_SUIT_CYCLE[Math.floor((round-1)/3)%VOID_SUIT_CYCLE.length]:null;
}
export function exclusiveVoidPrecisionBonus(side,cards,damage,round){
 const inactive={active:false,extra:0,suit:exclusiveVoidDominantSuit(round)};
 if(side?.bossExclusive?.id!==20||!inactive.suit||!Array.isArray(cards)||
   !cards.some(card=>card?.suit===inactive.suit)||
   side.bossExclusive.voidBlockedRound===round||!(damage>0))
   return inactive;
 return {active:true,extra:Math.ceil(damage*.07-1e-9),suit:inactive.suit};
}
export function rememberExclusiveVoidCounter(boss,damage,cards,round){
 if(boss?.bossExclusive?.id!==20||!(damage>0)||
   !Array.isArray(cards)||!cards.some(card=>card?.suit===exclusiveVoidDominantSuit(round)))
  return false;
 boss.bossExclusive={...boss.bossExclusive,voidBlockedRound:round+1};
 return true;
}
