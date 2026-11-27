import {judgmentFramePlan,judgmentHullPose,JUDGMENT_TIMING} from './judgmentTemporalSpec.js';
import cards from './fleetNext/weaponBatchCards20261127.json' with {type:'json'};
export const BATCH_WEAPON_VARIANTS=Object.freeze(cards.map(Object.freeze));
export const BATCH_WEAPON_CARD_IDS=Object.freeze(cards.map(c=>c.id));
export const batchWeaponVariant=id=>BATCH_WEAPON_VARIANTS.find(c=>c.id===id)||null;
export const BATCH_KINDS=Object.freeze({judgment:'temporal-judgment',mortar:'magmatic-mortar',incinerator:'rotating-incinerator',burn:'plasma-burn'});
export const isBatchWeaponKind=kind=>Object.values(BATCH_KINDS).includes(kind);
export function batchWeaponEffectProfile(id,shot={}){
 const c=batchWeaponVariant(id);if(!c)return null;const kind=shot.burnTick?'burn':c.kind;
 const sound=phase=>'batch-'+kind+'_'+phase+'_'+c.tier;
 return {...c,approved:true,kind:BATCH_KINDS[kind],chargeMs:0,
  flightMs:kind==='burn'?0:kind==='judgment'?1950:kind==='mortar'?1450:1600,
  impactMs:kind==='burn'?680:kind==='judgment'?1000:1100,scale:1,impactScale:1,
  sequence:{judgment:'three-rotating-rings-one-discharge',mortar:'arcing-magma-paid-volley',incinerator:'single-helical-plasma-pulse',burn:'real-burn-tick'}[kind],
  core:kind==='judgment'?'#e8faff':'#ffe9b2',glow:kind==='judgment'?'#63baff':'#ff870d',secondary:kind==='judgment'?'#cebaff':'#ffd275',
  sound:kind==='burn'?{impact:sound('burn')}:
   Object.fromEntries(['fire','impact','block','contact',...(kind==='judgment'?['alignment']:[]),...(kind==='mortar'?['energy']:[])].map(p=>[p,sound(p)]))};
}
export function batchVisualHit(profile,shot,from){
 const c=batchWeaponVariant(shot.cardId)||profile;
 return {...shot,who:shot.who,kind:c.kind==='judgment'?undefined:c.kind,tier:c.tier,rarity:c.rarity,index:shot.impactIndex||0,
  flightMs:profile.flightMs,originX:from.x,originY:from.y,blocked:!!shot.defenseBlocked,actualDamage:shot.actualDamage||0};
}
export function batchBattleHullFrame(profile,shot,age,{reduced=false}={}){
 if(shot.burnTick)return {x:0,y:0,roll:0,pitch:0,lift:0,light:age>=0&&age<680?Math.sin(age/680*Math.PI)*.18:0,thrust:0};
 const p=batchHullPose(batchVisualHit(profile,shot,{x:0,y:0}),age,reduced);
 return {x:p.dx,y:p.dy,roll:p.roll*180/Math.PI,pitch:0,lift:0,light:p.light,thrust:Math.abs(p.dy)/14};
}
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
