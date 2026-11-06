import {createEscortDefense,damageEscortShield,destroyExposedEscort} from './vitalDefense.js';
import {escortArmamentFor} from './escortArmory.js';
import {escortsCoordinated} from './fleetSystems.js';
import {defensiveEscortShare} from './escortTactics.js';
// Scudiere subordinate, non carte equipaggiabili. HP e firme provvisori per collaudo.
export const ESCORT_UNLOCK_LEVELS=Object.freeze([3,5]);
export const ESCORT_INTERCEPT_SHARE=0.20;
const dmg=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
export function buildLinkedEscorts(mother,targets){
 if(!mother?.id||!mother?.level||!targets)return [];
 const hp=mother.defense?.shield.max??Object.values(mother.engines||{}).reduce((sum,x)=>sum+(x.max||0),0);
 return ESCORT_UNLOCK_LEVELS.flatMap((level,slot)=>{
  if(mother.level<level)return [];
  const weapon=escortArmamentFor(mother,slot);
  const defense=createEscortDefense({
   shieldMax:Math.max(12,Math.round(hp*weapon.shieldFactor)),
   signature:{kind:'math',op:slot===0?'plus':'minus',target:targets[slot===0?'plus':'minus']}
  });
  return [{id:`${mother.id}:escort:${slot+1}`,parentShipId:mother.id,slot,unlockLevel:level,
   name:`Scudiera ${slot+1} · ${mother.name}`,weapon,defense}];
 });
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
export function interceptMotherVolley(escorts=[],rawDamage,motherDefense=null,options={}){
 const raw=dmg(rawDamage);
 if(!escortsCoordinated(motherDefense))
  return {escorts,remaining:raw,intercepted:0,details:[],disabledByCommand:true};
 const active=escortShieldsActive(escorts);
 if(!active.length||raw===0)return {escorts,remaining:raw,intercepted:0,details:[]};
 let updated=escorts,intercepted=0;
 const details=[];
 for(const escort of active){
  const slot=updated.findIndex(e=>e.id===escort.id);
  const share=escort.weapon?defensiveEscortShare(escort,motherDefense,options):ESCORT_INTERCEPT_SHARE;
  const budget=Math.min(raw-intercepted,Math.floor(raw*share));
  const hit=damageEscortShield(updated[slot].defense,budget);
  intercepted+=hit.damage;
  updated=updated.map((e,i)=>i===slot?{...e,defense:hit.defense}:e);
  details.push({slot,intercepted:hit.damage});
 }
 return {escorts:updated,remaining:raw-intercepted,intercepted,details};
}
