// Approved direction; the two full fronts and this study await visual approval.
// Not bound to the playable renderer until the fronts are approved.
export const STORM_CAPACITOR_FAMILY='weapon-designed-ionic-condensatore-tempesta';
export const STORM_CAPACITOR_KIND='storm-capacitor-cloud';
export const STORM_CAPACITOR_VARIANTS=Object.freeze([
 {id:STORM_CAPACITOR_FAMILY,rarity:'Epica',tier:2},
 {id:STORM_CAPACITOR_FAMILY+'-rarity-l',rarity:'Leggendaria',tier:3}
].map(Object.freeze));
export const stormCapacitorVariant=id=>STORM_CAPACITOR_VARIANTS.find(v=>v.id===id)||null;
export const STORM_TIMING=Object.freeze({energyAt:260,supportAt:520,launchAt:1100,flightMs:1500,impactMs:1050,turnMs:4700});
export function stormHullPose(hit,age,reduced=false){
 const zero={dx:0,dy:0,roll:0,light:0};
 if(age<0||age>=STORM_TIMING.impactMs||hit.blocked||hit.actualDamage<=0)return zero;
 const pulse=(1-Math.exp(-age/16))*Math.exp(-age/190),sign=hit.who==='A'?-1:1;
 return {dx:reduced?0:pulse*1.5,dy:reduced?0:pulse*(hit.rarity==='Leggendaria'?14:11)*sign,
  roll:reduced?0:pulse*.055*sign,light:Math.exp(-age/160)*(reduced?.14:.62)};
}
export function stormFramePlan(frame,rarity,who){
 const e=frame.event,t=STORM_TIMING,spent=e?.energySpent||0;
 const hits=frame.disabledBefore?[]:(e?.impacts||[]).map((h,index)=>({...h,index,rarity,who,
  actualDamage:h.actualDamage||0,blocked:!!h.defenseBlocked,launchAt:t.launchAt,
  flightMs:t.flightMs,impactAt:t.launchAt+t.flightMs,
  originX:rarity==='Epica'?104:337,originY:who==='A'?842:-42}));
 return {hits,energySpent:spent,energyContributions:e?.energyContributions||[],
  supportIds:e?.contributingSupportIds||[],duration:t.turnMs,
  skipped:!hits.length,disabled:!!frame.disabledBefore,stage:frame.stage,
  noFreshEnergy:frame.events.some(x=>x.kind==='weapon-no-energy'),
  energyAt:t.energyAt,supportAt:t.supportAt};
}
export function stormTimeline(sequence){return {duration:sequence.frames.length*STORM_TIMING.turnMs,
 turns:sequence.frames.map(frame=>stormFramePlan(frame,sequence.rarity,sequence.who))};}
