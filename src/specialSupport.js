// Point 30: tactical support effects are paid for by an actual SPECIAL card.
// They never create damage or become free effects of numeric suits.
import {restoreMotherShield} from './vitalDefense.js';
import {strategicStatus} from './strategicShots.js';

export const SUPPORT_RULES=Object.freeze({shieldRepair:20});
export function useSupportCard(side,type,nowMs=Date.now()){
 const mother=side?.fleet?.[0],defense=mother?.defense;
 if(defense?.kind!=='mother')return {activated:false,reason:'ability_unavailable',side};
 if(type==='support-shield-repair'){
  if(defense.parts?.shieldGenerator?.hp<=0)
   return {activated:false,reason:'generator_destroyed',side};
  if(defense.shield.hp>=defense.shield.max)
   return {activated:false,reason:'shield_full',side};
  const restored=restoreMotherShield(defense,SUPPORT_RULES.shieldRepair);
  if(!restored.repaired)return {activated:false,reason:'repair_unavailable',side};
  return {activated:true,reason:'ok',amount:restored.repaired,side:{
   ...side,fleet:[{...mother,defense:restored.defense},...side.fleet.slice(1)]}};
 }
 if(type==='support-status-purge'){
  const current=strategicStatus(side,nowMs);
  if(!current.ionizedUntil&&!current.corrodedUntil)
   return {activated:false,reason:'no_negative_status',side};
  return {activated:true,reason:'ok',side:{
   ...side,strategicStatuses:{...side.strategicStatuses,ionizedUntil:0,corrodedUntil:0}}};
 }
 return {activated:false,reason:'unknown_support',side};
}
