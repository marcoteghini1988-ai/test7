// Points 30/39: tactical support effects are paid for by an actual SPECIAL card.
// They never create damage or become free effects of numeric suits.
import {restoreMotherShield} from './vitalDefense.js';
import {bossNumericRepairAmount} from './bossNumericDecks.js';
import {strategicStatus} from './strategicShots.js';

export const SUPPORT_RULES=Object.freeze({shieldRepair:20,escortShieldRepair:15});
export function useSupportCard(side,type,nowMs=Date.now(),escortSlot=null){
 const mother=side?.fleet?.[0],defense=mother?.defense;
 if(defense?.kind!=='mother')return {activated:false,reason:'ability_unavailable',side};
 if(type==='support-shield-repair'){
  if(defense.parts?.shieldGenerator?.hp<=0)
   return {activated:false,reason:'generator_destroyed',side};
  if(defense.shield.hp>=defense.shield.max)
   return {activated:false,reason:'shield_full',side};
  const restored=restoreMotherShield(defense,bossNumericRepairAmount(side,SUPPORT_RULES.shieldRepair));
  if(!restored.repaired)return {activated:false,reason:'repair_unavailable',side};
  return {activated:true,reason:'ok',amount:restored.repaired,side:{
   ...side,fleet:[{...mother,defense:restored.defense},...side.fleet.slice(1)]}};
 }
 if(type==='support-escort-repair'){
  if(!Number.isInteger(escortSlot)||escortSlot<0||!side?.escorts?.[escortSlot])
   return {activated:false,reason:'escort_missing',side};
  if(defense.parts?.command?.hp<=0)
   return {activated:false,reason:'command_offline',side};
  const escort=side.escorts[escortSlot],shield=escort.defense?.shield;
  if(escort.defense?.destroyed)return {activated:false,reason:'escort_destroyed',side};
  if(!shield||!Number.isFinite(shield.max)||!Number.isFinite(shield.hp))
   return {activated:false,reason:'escort_unavailable',side};
  if(side.maneuvers?.fusion?.escortSlot===escortSlot&&side.maneuvers.fusion.endsAt>nowMs)
   return {activated:false,reason:'escort_docked',side};
  if(shield.hp>=shield.max)return {activated:false,reason:'escort_shield_full',side};
  const repaired=Math.min(SUPPORT_RULES.escortShieldRepair,shield.max-shield.hp);
  if(repaired<=0)return {activated:false,reason:'escort_shield_full',side};
  const nextEscort={...escort,defense:{...escort.defense,
   shield:{...shield,hp:shield.hp+repaired}}};
  const escorts=side.escorts.map((e,i)=>i===escortSlot?nextEscort:e);
  return {activated:true,reason:'ok',amount:repaired,
   side:{...side,escorts}};
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
