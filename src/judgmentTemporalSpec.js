// Approved direction, isolated until the complete front is approved.
export const JUDGMENT_ID='weapon-designed-ionic-giudizio-temporale';
export const JUDGMENT_TIMING=Object.freeze({launchAt:650,flightMs:1950,impactMs:1000,turnMs:4250});
export function judgmentFramePlan(frame,who){
 const t=JUDGMENT_TIMING;
 const hits=frame.disabledBefore?[]:(frame.event?.impacts||[]).map((h,index)=>({...h,index,who,
  blocked:!!h.defenseBlocked,actualDamage:h.actualDamage||0,launchAt:t.launchAt,flightMs:t.flightMs,
  impactAt:t.launchAt+t.flightMs,originX:who==='A'?115:335,originY:who==='A'?850:-50}));
 return {hits,stage:frame.stage,duration:t.turnMs,disabled:frame.disabledBefore,noRepeat:frame.stage>1&&!hits.length};
}
export function judgmentHullPose(hit,age,reduced=false){
 const zero={dx:0,dy:0,roll:0,light:0};
 if(age<0||age>=JUDGMENT_TIMING.impactMs||hit.blocked||hit.actualDamage<=0)return zero;
 const k=(1-Math.exp(-age/14))*Math.exp(-age/190),sign=hit.who==='A'?-1:1;
 return {dx:reduced?0:k*1.5,dy:reduced?0:k*16*sign,roll:reduced?0:k*.06*sign,light:Math.exp(-age/135)*(reduced?.12:.7)};
}
export const judgmentDuration=s=>s.frames.length*JUDGMENT_TIMING.turnMs;
