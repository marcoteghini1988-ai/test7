// Adapt the battle-proven CommanderAbilities rules to the simultaneous duel
// without rewriting the historic trigger catalogue or granting pilot cards.
// The side shape differs: the old engine stores mother defense in fleet[0].
// This module translates public, authoritative combat state only.
import {commanderAbility,commanderAttackFactor,commanderDefenseFactor,
 rememberCommanderImpact} from './commanderAbilities.js';
import {tacticalSignatureMatches} from './tacticalShipSignatures.js';
import {tacticalCombatClock} from './tacticalTimedStatus.js';

export const TACTICAL_BOSS_COMMANDERS=Object.freeze([
 'pilot_boss_1','pilot_boss_2','pilot_boss_3','pilot_boss_6',
 'pilot_boss_7','pilot_boss_8','pilot_boss_9','pilot_boss_11',
 'pilot_epic_2','pilot_leg_1','pilot_boss_19','pilot_boss_20'
]);
const available=side=>!!side?.commander&&
 TACTICAL_BOSS_COMMANDERS.includes(side.commander.id);
const clock=round=>tacticalCombatClock(round);
const toLegacy=(side,round)=>({
 fleet:[{defense:side.defense}],
 commander:side.commander,
 escorts:(side.escorts||[]).map(e=>({defense:{destroyed:e.hp<=0}})),
 strategicStatuses:{
  ionizedUntil:side.statusUntil?.ionized??(side.ionized?clock(round)+8000:0),
  corrodedUntil:side.statusUntil?.corroded??(side.corroded?clock(round)+8000:0)
 }
});
const offenceCards=(side,order)=>{
 const indices=order?.numericIndices||[];
 if(![2,3].includes(indices.length)||new Set(indices).size!==indices.length)
  return null;
 return indices.map(i=>side.numeric?.hand?.[i]);
};
const validSignature=(attacker,defender,order)=>{
 const cards=offenceCards(attacker,order);
 const target=defender?.defense?.parts?.[order?.vitalId];
 return cards&&target&&target.hp>0&&
  cards.every(c=>c&&Number.isInteger(c.value))&&
  tacticalSignatureMatches(target.signature,order?.op,cards)?cards:null;
};
const context=(attacker,defender,order,types,round,validCards=null)=>({
 cards:validCards??[],
 op:order?.op??null,vitalId:order?.vitalId??null,
 strikeEffects:(types||[]).filter(type=>['shot-piercing','shot-ion',
  'shot-corrosion','tactic-kinetic','tactic-power-shift'].includes(type)),
 reshufflesAtLaunch:attacker.numericRecyclesTotal||0,
 nowMs:clock(round)
});
export function tacticalBossCommanderAttackBonus(attacker,defender,order,types,base,round){
 const empty={active:false,pilotId:null,percentage:0,extra:0,
  remainder:attacker?.commander?.bonusRemainder||0};
 if(!available(attacker)||!Number.isSafeInteger(base)||base<=0)return empty;
 const ability=commanderAbility(attacker.commander.id);
 if(ability?.role!=='Attacco')return empty;
 const cards=validSignature(attacker,defender,order);
 if(!cards)return empty;
 const factor=commanderAttackFactor(toLegacy(attacker,round),
  toLegacy(defender,round),context(attacker,defender,order,types,round,cards));
 if(!(factor>1))return empty;
 const percentage=Math.round((factor-1)*100);
 const remainder=Number.isSafeInteger(attacker.commander.bonusRemainder)?
  attacker.commander.bonusRemainder:0;
 const points=base*percentage+remainder;
 return {active:true,pilotId:attacker.commander.id,percentage,
  extra:Math.floor(points/100),remainder:points%100};
}
export function tacticalBossCommanderDefenseBonus(defender,attacker,round){
 if(!available(defender))return {active:false,pilotId:null,percentage:0,factor:1};
 const ability=commanderAbility(defender.commander.id);
 if(ability?.role!=='Difesa')return {active:false,pilotId:null,percentage:0,factor:1};
 const factor=commanderDefenseFactor(toLegacy(defender,round),
  toLegacy(attacker,round),{nowMs:clock(round)});
 return {active:factor<1,pilotId:defender.commander.id,
  percentage:Math.round((1-factor)*100),factor};
}
// Applied only AFTER a REAL damage event. This preserves the historic
// last vital/operation, first hit and 3rd-hit counters across combat cycles.
export function rememberTacticalBossCommanderImpact(attacker,defender,order,types,
 damage,round,{vitalId=null}={}){
 if(!(damage>0))return;
 if(!available(attacker)&&!available(defender))return;
 const cards=validSignature(attacker,defender,order);
 const ctx=context(attacker,defender,order,types,round,cards);
 ctx.vitalId=vitalId;
 if(!cards)ctx.op=null;
 const remembered=rememberCommanderImpact(toLegacy(attacker,round),
  toLegacy(defender,round),ctx,{damage,motherDamage:damage});
 if(available(attacker))attacker.commander=remembered.attacker.commander;
 if(available(defender))defender.commander=remembered.defender.commander;
}
