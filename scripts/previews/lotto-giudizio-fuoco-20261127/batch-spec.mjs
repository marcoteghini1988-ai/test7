import {judgmentFramePlan,judgmentHullPose,JUDGMENT_TIMING} from './judgment-spec.mjs';
export const FIRE_TIMING=Object.freeze({launchAt:750,flightMs:1450,shotDelay:480,impactMs:1100,turnMs:5200});
export const batchTurnMs=s=>s.kind==='judgment'?JUDGMENT_TIMING.turnMs:FIRE_TIMING.turnMs;
export const batchDuration=s=>s.frames.length*batchTurnMs(s);
export function batchFramePlan(frame,s){
 if(s.kind==='judgment')return {...judgmentFramePlan(frame,s.who),burns:[],energySpent:0};
 const t=FIRE_TIMING,tier={Rara:1,Epica:2,Leggendaria:3}[s.rarity],flightMs=s.kind==='incinerator'?1600:t.flightMs;
 const hits=frame.disabledBefore?[]:(frame.event?.impacts||[]).map((h,index)=>({...h,index,tier,kind:s.kind,rarity:s.rarity,who:s.who,
  blocked:!!h.defenseBlocked,actualDamage:h.actualDamage||0,launchAt:t.launchAt+index*t.shotDelay,flightMs,
  impactAt:t.launchAt+index*t.shotDelay+flightMs,originX:(s.who==='A'?[98,248,342]:[352,202,108])[tier-1]+(index-1)*17,originY:s.who==='A'?850:-50}));
 const lastImpact=hits.length?Math.max(...hits.map(h=>h.impactAt)):1800;
 const burns=[...frame.betweenEvents.filter(e=>e.kind==='weapon-burn'&&e.cardId===s.cardId).map((e,i)=>({...e,at:250+i*180})),
  ...frame.events.filter(e=>e.kind==='weapon-burn'&&e.cardId===s.cardId).map((e,i)=>({...e,at:lastImpact+720+i*180}))];
 const before=frame.energyBefore.reduce((n,e)=>n+(typeof e==='string'?1:Number(e.remaining)||0),0),after=frame.energyAfter.reduce((n,e)=>n+(typeof e==='string'?1:Number(e.remaining)||0),0);
 return {hits,burns,stage:frame.stage,disabled:frame.disabledBefore,energySpent:s.kind==='mortar'?Math.max(0,before-after):0,energyAt:450,duration:t.turnMs};
}
export function batchHullPose(hit,age,reduced=false){
 if(hit.kind===undefined)return judgmentHullPose(hit,age,reduced);
 const zero={dx:0,dy:0,roll:0,light:0};if(age<0||age>=1100||hit.blocked||hit.actualDamage<=0)return zero;
 const k=(1-Math.exp(-age/14))*Math.exp(-age/(hit.kind==='mortar'?230:165)),sign=hit.who==='A'?-1:1;
 return {dx:reduced?0:k*(hit.index%2?-2:2),dy:reduced?0:k*(hit.kind==='mortar'?11+hit.tier*2:7+hit.tier)*sign,
  roll:reduced?0:k*(hit.kind==='mortar'?.065:.035)*sign,light:Math.exp(-age/170)*(reduced?.12:.55)};
}
