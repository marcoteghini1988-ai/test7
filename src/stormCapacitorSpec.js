// Two exact fronts and the cloud direction approved on 27 November 2026.
export const STORM_CAPACITOR_FAMILY='weapon-designed-ionic-condensatore-tempesta';
export const STORM_CAPACITOR_KIND='storm-capacitor-cloud';
export const STORM_CAPACITOR_VARIANTS=Object.freeze([
 {id:STORM_CAPACITOR_FAMILY,rarity:'Epica',tier:2},
 {id:STORM_CAPACITOR_FAMILY+'-rarity-l',rarity:'Leggendaria',tier:3}
].map(Object.freeze));
export const STORM_CAPACITOR_CARD_IDS=Object.freeze(STORM_CAPACITOR_VARIANTS.map(v=>v.id));
export const stormCapacitorVariant=id=>STORM_CAPACITOR_VARIANTS.find(v=>v.id===id)||null;
export const STORM_TIMING=Object.freeze({energyAt:260,supportAt:520,launchAt:1100,flightMs:1500,impactMs:1050,turnMs:4700});
export function stormCapacitorEffectProfile(id){
 const v=stormCapacitorVariant(id);if(!v)return null;
 const sound=phase=>'storm-capacitor_'+phase+'_'+(v.tier===3?'legendary':'epic');
 return {...v,familyId:STORM_CAPACITOR_FAMILY,approved:true,kind:STORM_CAPACITOR_KIND,
  chargeMs:STORM_TIMING.launchAt,flightMs:STORM_TIMING.flightMs,impactMs:STORM_TIMING.impactMs,
  sequence:v.tier===3?'three-interwoven-currents-one-thundercloud':'single-volumetric-thundercloud',
  scale:1,impactScale:1,core:'#eafaff',glow:'#5bb9ff',secondary:'#b7baff',
  impactCore:'#effaff',impactGlow:'#2678ef',impactSecondary:'#d1bcff',
  sound:Object.fromEntries(['charge','energy','support','fire','impact','block','contact'].map(phase=>[phase,sound(phase)]))};
}
export function stormVisualHit(profile,shot,from){return {rarity:profile.rarity,who:shot.who,
 flightMs:profile.flightMs,originX:from.x,originY:from.y,blocked:!!shot.defenseBlocked,
 actualDamage:shot.actualDamage||0,destroyed:!!shot.destroyed};}
export function stormContributionPlan(shot,start){
 const at=start-STORM_TIMING.launchAt,launch=shot.fires||shot.defenseBlocked;
 return [...(shot.energySpent>0?[{phase:'energy',at:at+STORM_TIMING.energyAt}]:[]),
  ...(launch?(shot.contributingSupportIds||[]).map((id,i)=>({phase:'support',id,at:at+STORM_TIMING.supportAt+i*80})):[])];
}
export function stormBattleHullFrame(profile,shot,age,{reduced=false}={}){
 const p=stormHullPose(stormVisualHit(profile,shot,{x:0,y:0}),age,reduced);
 return {x:p.dx,y:p.dy,roll:p.roll*180/Math.PI,pitch:0,lift:0,light:p.light,thrust:Math.abs(p.dy)/14};
}
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
