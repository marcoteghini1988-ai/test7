// Presentation only: hit quantities, HP, mark validity and targets come from combat.
export const PROBE_FAMILY='weapon-designed-ionic-sonda-ionica';
export const HAMMER_FAMILY='weapon-designed-ionic-martello-tuono';
// Keep asset and presentation imports independent of the complete rules catalog.
export const PROBE_HAMMER_VARIANTS=Object.freeze([
 [PROBE_FAMILY,'Comune','probe',0],
 [PROBE_FAMILY+'-rarity-r','Rara','probe',1],
 [PROBE_FAMILY+'-rarity-e','Epica','probe',2],
 [PROBE_FAMILY+'-rarity-l','Leggendaria','probe',3],
 [HAMMER_FAMILY,'Rara','hammer',1],
 [HAMMER_FAMILY+'-rarity-e','Epica','hammer',2],
 [HAMMER_FAMILY+'-rarity-l','Leggendaria','hammer',3]
].map(([id,rarity,kind,tier])=>Object.freeze({id,rarity,kind,tier,familyId:kind==='probe'?PROBE_FAMILY:HAMMER_FAMILY})));
export const PROBE_HAMMER_CARD_IDS=Object.freeze(PROBE_HAMMER_VARIANTS.map(v=>v.id));
export const isProbeHammerKind=kind=>kind==='ionic-probe'||kind==='thunder-hammer';
export const probeHammerVariant=id=>PROBE_HAMMER_VARIANTS.find(v=>v.id===id)||null;
export const PROBE_HAMMER_TIMING=Object.freeze({probeFlight:1080,hammerFlight:1220,impact:1000,betweenActivations:850,betweenSlashes:1420});
export function probeHammerEffectProfile(id,shot={}){
 const v=probeHammerVariant(id);if(!v)return null;
 const kind=v.kind==='probe'?'ionic-probe':'thunder-hammer',bonus=v.kind==='hammer'&&shot.impactIndex===1;
 const sound=phase=>'probe-hammer_'+phase+'_'+v.kind+'_'+['common','rare','epic','legendary'][v.tier]+(bonus?'_bonus':'');
 return {approved:true,kind,tier:v.tier,rarity:v.rarity,chargeMs:0,
  flightMs:v.kind==='probe'?1080:1220,impactMs:1000,
  sequence:v.kind==='probe'?'precision-impulse-persistent-electric-reticle':bonus?'second-crescent-electric-detonation':'rotating-electric-crescent',
  scale:1,impactScale:1,core:'#e9faff',glow:'#71b6ff',secondary:'#bfa4ff',
  impactCore:'#ffffff',impactGlow:'#2665ff',impactSecondary:'#bfa4ff',
  sound:{charge:null,fire:sound('fire'),impact:sound('impact'),block:sound('block'),mark:sound('mark'),release:sound('release')}};
}
export function probeHammerVisualHit(profile,shot,from){
 return {kind:profile.kind==='ionic-probe'?'probe':'hammer',rarity:profile.rarity,
  who:shot.who,index:shot.impactIndex||0,bonus:profile.kind==='thunder-hammer'&&shot.impactIndex===1,
  flightMs:profile.flightMs,originX:from.x,originY:from.y,
  blocked:!!shot.defenseBlocked,actualDamage:shot.actualDamage,destroyed:!!shot.destroyed};
}
export function probeHammerHullFrame(profile,shot,age,{reduced=false}={}){
 const zero={x:0,y:0,roll:0,pitch:0,lift:0,light:0,thrust:0};
 if(age<0||age>=profile.impactMs||shot.defenseBlocked||!shot.fires||shot.actualDamage<=0)return zero;
 const bonus=profile.kind==='thunder-hammer'&&shot.impactIndex===1;
 const impulse=reduced?0:(1-Math.exp(-age/12))*Math.exp(-age/165);
 const power=profile.kind==='ionic-probe'?2.5:bonus?14:8;
 return {...zero,x:(bonus?-1:1)*impulse*power*.3,y:(shot.who==='A'?-1:1)*impulse*power,
  roll:(bonus?-.14:.07)*impulse*180/Math.PI,light:Math.exp(-age/110)*(bonus?.65:.35)*(reduced?.3:1),thrust:impulse*.7};
}
