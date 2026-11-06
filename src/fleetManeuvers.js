// Eclissi Stellare — Punto 22: manovre e fusioni. Bilanciamento provvisorio.
export const MANEUVER_RULES=Object.freeze({
 syncGoal:100,syncPerCalculation:15,syncPerInterception:10,syncPerEscortHit:12,
 formationCooldownMs:10000,fusionDurationMs:12000,fusionCooldownMs:28000,
 guardInterceptBonus:.08,guardOutgoingMultiplier:.85,
 assaultInterceptPenalty:.08,assaultOutgoingMultiplier:1.10,
 barrierFusionInterceptShare:.60,strikeFusionShieldMultiplier:1.25,
 maxSharePerEscort:.45,
 tacticalCoverDurationMs:15000,tacticalCoverInterceptShare:.75
});
export const FORMATIONS=Object.freeze(['balanced','guard','assault']);
export const FUSION_MODES=Object.freeze(['barrier','strike']);
const bounded=(n,a,b)=>Math.min(b,Math.max(a,n));
const whole=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
const mother=side=>side?.fleet?.[0]?.defense?.kind==='mother'?side.fleet[0].defense:null;
const command=side=>!!mother(side)?.parts?.command?.hp;
const readyEscort=e=>!!e&&!e.defense?.destroyed&&e.defense?.shield?.hp>0;
export function newManeuverState(){return {formation:'balanced',sync:0,formationReadyAt:0,fusion:null,fusionReadyAt:0,cover:null,processedEventIds:[]};}
export function advanceManeuvers(state,side,nowMs){
 let n=state||newManeuverState();
 const cover=n.cover;
 if(cover){
  const protector=side?.escorts?.[cover.escortSlot];
  if(nowMs>=cover.expiresAt||!readyEscort(protector)||protector.id!==cover.escortId||!command(side))
   n={...n,cover:null};
 }
 const f=n.fusion;
 if(!f)return n;
 const e=side?.escorts?.[f.escortSlot];
 const expired=nowMs>=f.endsAt,broken=!readyEscort(e)||e.id!==f.escortId||!command(side)||!(mother(side)?.parts?.engine?.hp);
 if(!expired&&!broken)return n;
 return {...n,fusion:null,fusionReadyAt:Math.max(n.fusionReadyAt,(expired?f.endsAt:nowMs)+MANEUVER_RULES.fusionCooldownMs)};
}
// Point 25 — active cover is a special-card command, not free shield regeneration.
// It protects the mother against ONE subsequent hit using escort #1 real HP.
export function activateTacticalCover(state,side,escortSlot,nowMs){
 const n=advanceManeuvers(state,side,nowMs);
 if(!mother(side)||!command(side))return {state:n,activated:false,reason:'command_offline'};
 if(n.cover)return {state:n,activated:false,reason:'cover_active'};
 if(n.fusion)return {state:n,activated:false,reason:'fusion_active'};
 if(escortSlot!==0)return {state:n,activated:false,reason:'defensive_escort_required'};
 const escort=side?.escorts?.[escortSlot];
 if(!readyEscort(escort))return {state:n,activated:false,reason:'escort_unavailable'};
 return {state:{...n,cover:{
  escortSlot,escortId:escort.id,startedAt:nowMs,
  expiresAt:nowMs+MANEUVER_RULES.tacticalCoverDurationMs
 }},activated:true,reason:'ok'};
}
export function cancelTacticalCover(state,side,nowMs){
 const n=advanceManeuvers(state,side,nowMs);
 return n.cover?{state:{...n,cover:null},cancelled:true}:{state:n,cancelled:false};
}
export function recordManeuverEvent(state,{id,type,amount=1}={}){
 const n=state||newManeuverState();
 if(typeof id!=='string'||!id||n.processedEventIds.includes(id))return {state:n,credited:0};
 const gain=type==='valid_calculation'?MANEUVER_RULES.syncPerCalculation:
  type==='escort_interception'&&whole(amount)>0?MANEUVER_RULES.syncPerInterception:
  type==='escort_hit'&&whole(amount)>0?MANEUVER_RULES.syncPerEscortHit:0;
 if(!gain)return {state:n,credited:0};
 const sync=bounded(n.sync+gain,0,100);
 return {state:{...n,sync,processedEventIds:[...n.processedEventIds,id].slice(-64)},credited:sync-n.sync};
}
export function changeFormation(state,side,formation,nowMs){
 const n=advanceManeuvers(state,side,nowMs);
 if(!FORMATIONS.includes(formation))return {state:n,changed:false,reason:'invalid_formation'};
 if(!command(side))return {state:n,changed:false,reason:'command_offline'};
 if(n.fusion)return {state:n,changed:false,reason:'fusion_active'};
 if(nowMs<n.formationReadyAt)return {state:n,changed:false,reason:'formation_cooldown'};
 if(n.formation===formation)return {state:n,changed:false,reason:'already_selected'};
 return {state:{...n,formation,formationReadyAt:nowMs+MANEUVER_RULES.formationCooldownMs},changed:true,reason:'ok'};
}
export function startFusion(state,side,escortSlot,mode,nowMs){
 const n=advanceManeuvers(state,side,nowMs);
 if(!FUSION_MODES.includes(mode))return {state:n,started:false,reason:'invalid_mode'};
 if(!command(side)||!mother(side)?.parts?.engine?.hp)return {state:n,started:false,reason:'mother_not_ready'};
 if(n.fusion)return {state:n,started:false,reason:'fusion_active'};
 if(n.cover)return {state:n,started:false,reason:'cover_active'};
 if(nowMs<n.fusionReadyAt)return {state:n,started:false,reason:'fusion_cooldown'};
 if(n.sync<100)return {state:n,started:false,reason:'not_enough_sync'};
 const e=side?.escorts?.[escortSlot];
 if(!Number.isInteger(escortSlot)||!readyEscort(e))return {state:n,started:false,reason:'escort_unavailable'};
 return {state:{...n,sync:n.sync-100,fusion:{escortSlot,escortId:e.id,mode,startedAt:nowMs,endsAt:nowMs+MANEUVER_RULES.fusionDurationMs}},started:true,reason:'ok'};
}
export function cancelFusion(state,side,nowMs){
 const n=advanceManeuvers(state,side,nowMs);
 if(!n.fusion)return {state:n,cancelled:false,reason:'not_active'};
 return {state:{...n,fusion:null,fusionReadyAt:nowMs+MANEUVER_RULES.fusionCooldownMs},cancelled:true,reason:'ok'};
}
export function maneuverStatus(state,side,nowMs){
 const n=advanceManeuvers(state,side,nowMs);
 return {state:n,formation:n.formation,sync:n.sync,fusion:n.fusion,cover:n.cover,
 coverRemainingMs:n.cover?Math.max(0,n.cover.expiresAt-nowMs):0,
 fusionRemainingMs:n.fusion?Math.max(0,n.fusion.endsAt-nowMs):0,
 fusionCooldownRemainingMs:Math.max(0,n.fusionReadyAt-nowMs),
 formationCooldownRemainingMs:Math.max(0,n.formationReadyAt-nowMs),
 availableEscorts:(side?.escorts||[]).map((e,slot)=>({slot,available:readyEscort(e)}))};
}
// Keep the complete formation; remove a docked escort ONLY while routing ammunition.
// It cannot consume ammunition or fire as an independent unit during docking.
export function prepareSideForAmmoRouting(side,nowMs){
 const n=advanceManeuvers(side?.maneuvers,side,nowMs);
 const f=n.fusion;
 return {side:f?{...side,escorts:(side.escorts||[]).filter((_,i)=>i!==f.escortSlot)}:side,maneuvers:n};
}
export function mergeRoutedEscorts(originalSide,routedEscorts){
 const map=new Map((routedEscorts||[]).map(e=>[e.id,e]));
 return (originalSide.escorts||[]).map(e=>map.get(e.id)||e);
}
export function adjustOutgoingVolley(volley,side,nowMs,context={}){
 const n=advanceManeuvers(side?.maneuvers,side,nowMs);
 const f=n.fusion;
 const shots=(volley.shots||[]).map(shot=>{
  const isEscort=shot.escortSlot!==undefined&&shot.escortSlot!==null;
  const disabled=isEscort&&f?.escortSlot===shot.escortSlot;
  let factor=1;
  if(isEscort&&n.formation==='guard')factor=MANEUVER_RULES.guardOutgoingMultiplier;
  if(isEscort&&n.formation==='assault')factor=MANEUVER_RULES.assaultOutgoingMultiplier;
  if(!isEscort&&f?.mode==='strike'&&context.targetKind==='motherShield')factor=MANEUVER_RULES.strikeFusionShieldMultiplier;
  const damage=disabled?0:Math.floor(whole(shot.damage)*factor);
  return {...shot,damage,bullets:disabled?0:shot.bullets,maneuverBonus:damage-whole(shot.damage),suppressedByFusion:!!disabled};
 });
 return {...volley,shots,totalDamage:shots.reduce((s,x)=>s+x.damage,0)};
}
// Apply at projectile impact against CURRENT escort shield totals; never invent HP.
export function interceptManeuverVolley(side,rawDamage,nowMs,calculateShare,options={}){
 let n=advanceManeuvers(side?.maneuvers,side,nowMs),raw=whole(rawDamage);
 const escorts=[...(side?.escorts||[])],f=n.fusion,cover=n.cover,details=[];
 if(!mother(side)||!command(side)||!raw)return {maneuvers:n,escorts,remaining:raw,intercepted:0,details};
 let remaining=raw;
 function absorb(slot,limit,mode){
  const e=escorts[slot];
  if(!readyEscort(e)||remaining<=0||limit<=0)return;
  const damage=Math.min(whole(limit),remaining,e.defense.shield.hp);
  if(!damage)return;
  escorts[slot]={...e,defense:{...e.defense,shield:{...e.defense.shield,hp:e.defense.shield.hp-damage}}};
  remaining-=damage;details.push({escortSlot:slot,damage,mode});
 }
 if(cover){
  absorb(cover.escortSlot,Math.floor(raw*MANEUVER_RULES.tacticalCoverInterceptShare),'tactical-cover');
  if(details.some(d=>d.mode==='tactical-cover'))n={...n,cover:null};
 }
 if(f?.mode==='barrier')absorb(f.escortSlot,Math.floor(raw*MANEUVER_RULES.barrierFusionInterceptShare),'barrier');
 escorts.forEach((e,slot)=>{
  if(f?.escortSlot===slot||cover?.escortSlot===slot||!readyEscort(e))return;
  let share=typeof calculateShare==='function'?calculateShare(e,mother(side),options):.20;
  if(n.formation==='guard')share+=MANEUVER_RULES.guardInterceptBonus;
  if(n.formation==='assault')share-=MANEUVER_RULES.assaultInterceptPenalty;
  absorb(slot,Math.floor(raw*bounded(share,0,MANEUVER_RULES.maxSharePerEscort)),'escort');
 });
 return {maneuvers:n,escorts,remaining,intercepted:raw-remaining,details};
}
