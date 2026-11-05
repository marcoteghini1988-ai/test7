import {createEscortDefense,damageEscortShield,destroyExposedEscort} from './vitalDefense.js';
// Scudiere subordinate, non carte equipaggiabili. HP e firme provvisori per collaudo.
export const ESCORT_UNLOCK_LEVELS=Object.freeze([3,5]);
export const ESCORT_INTERCEPT_SHARE=0.20;
const dmg=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
export function buildLinkedEscorts(mother,targets){
 if(!mother?.id||!mother?.level||!targets)return [];
 const hp=mother.defense?.shield.max??Object.values(mother.engines||{}).reduce((sum,x)=>sum+(x.max||0),0);
 return ESCORT_UNLOCK_LEVELS.flatMap((level,slot)=>mother.level<level?[]:[{
  id:`${mother.id}:escort:${slot+1}`,parentShipId:mother.id,slot,unlockLevel:level,
  name:`Scudiera ${slot+1} · ${mother.name}`,
  defense:createEscortDefense({shieldMax:Math.max(12,Math.round(hp*(slot===0?.28:.24))),
   signature:{kind:'math',op:slot===0?'plus':'minus',target:targets[slot===0?'plus':'minus']}})
 }]);
}
export function escortAvailable(escort){return !!escort?.defense&&!escort.defense.destroyed;}
export function escortShieldsActive(escorts=[]){return escorts.filter(e=>escortAvailable(e)&&e.defense.shield.hp>0);}
export function impactLinkedEscort(escorts=[],index,raw,cards=[]){
 if(!Number.isInteger(index)||index<0||index>=escorts.length)return {escorts,damage:0,destroyed:false,reason:'escort_missing'};
 const escort=escorts[index];
 if(!escortAvailable(escort))return {escorts,damage:0,destroyed:false,reason:'escort_destroyed'};
 const hit=escort.defense.shield.hp>0?damageEscortShield(escort.defense,dmg(raw)):destroyExposedEscort(escort.defense,cards);
 const change=escorts.map((e,i)=>i===index?{...e,defense:hit.defense}:e);
 return {escorts:change,damage:hit.damage||0,destroyed:hit.destroyed||false,
  reason:escort.defense.shield.hp>0?'shield':hit.destroyed?'finisher':'wrong_combination'};
}
export function interceptMotherVolley(escorts=[],rawDamage){
 const raw=dmg(rawDamage),active=escortShieldsActive(escorts);
 if(!active.length||raw===0)return {escorts,remaining:raw,intercepted:0,details:[]};
 const requested=Math.min(raw,Math.floor(raw*ESCORT_INTERCEPT_SHARE*active.length));
 let left=requested,updated=escorts;
 const details=[];
 for(const escort of active){
  const slot=updated.findIndex(e=>e.id===escort.id);
  const portion=Math.ceil(left/(active.length-details.length));
  const hit=damageEscortShield(updated[slot].defense,portion);
  left-=hit.damage;
  updated=updated.map((e,i)=>i===slot?{...e,defense:hit.defense}:e);
  details.push({slot,intercepted:hit.damage});
 }
 const intercepted=requested-left;
 return {escorts:updated,remaining:raw-intercepted,intercepted,details};
}
