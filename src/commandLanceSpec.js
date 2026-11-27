// Approved fronts and direction, 27 November. Gameplay comes from combat events.
export const COMMAND_LANCE_FAMILY='weapon-designed-ionic-lancia-comando-ionico';
export const COMMAND_LANCE_KIND='ionic-command-lance';
export const COMMAND_LANCE_VARIANTS=Object.freeze([
 [COMMAND_LANCE_FAMILY,'Rara',1],
 [COMMAND_LANCE_FAMILY+'-rarity-e','Epica',2],
 [COMMAND_LANCE_FAMILY+'-rarity-l','Leggendaria',3]
].map(([id,rarity,tier])=>Object.freeze({id,rarity,tier,familyId:COMMAND_LANCE_FAMILY})));
export const COMMAND_LANCE_CARD_IDS=Object.freeze(COMMAND_LANCE_VARIANTS.map(v=>v.id));
export const commandLanceVariant=id=>COMMAND_LANCE_VARIANTS.find(v=>v.id===id)||null;
export const COMMAND_LANCE_TIMING=Object.freeze({signalAt:450,launchAt:1050,flightMs:1380,impactMs:1000});
export const commandLanceTier=rarity=>['Rara','Epica','Leggendaria'].indexOf(rarity);
export function commandLanceEffectProfile(id){
 const v=commandLanceVariant(id);if(!v)return null;
 const sound=phase=>'command-lance_'+phase+'_'+['common','rare','epic','legendary'][v.tier];
 return {...v,approved:true,kind:COMMAND_LANCE_KIND,chargeMs:600,flightMs:1380,impactMs:1000,
  sequence:'character-signal-single-volumetric-electric-lance',scale:1,impactScale:1,
  core:'#eefaff',glow:'#6ec7ff',secondary:'#cdbbff',impactCore:'#e8fcff',impactGlow:'#438aff',impactSecondary:'#d4b2ff',
  sound:{charge:sound('charge'),fire:sound('fire'),impact:sound('impact'),block:sound('block')}};
}
export function commandLanceVisualHit(profile,shot,from){
 return {rarity:profile.rarity,who:shot.who,flightMs:profile.flightMs,originX:from.x,originY:from.y,
  blocked:!!shot.defenseBlocked,actualDamage:shot.actualDamage,destroyed:!!shot.destroyed};
}
export function commandLanceBattleHullFrame(profile,shot,age,{reduced=false}={}){
 const p=commandLanceHullPose({...shot,rarity:profile.rarity,actualDamage:shot.fires?shot.actualDamage:0},age,reduced);
 return {x:p.dx,y:p.dy,roll:p.roll*180/Math.PI,pitch:0,lift:0,light:p.light,thrust:Math.abs(p.dy)/12};
}
export function commandLanceTimeline(sequence){
 const shots=sequence.frames.filter(frame=>!frame.disabledBefore).flatMap(frame=>(frame.event.impacts||[]).map((impact,index)=>({
  ...impact,index,cardId:frame.cardId,rarity:sequence.rarity,who:sequence.who,
  actualDamage:impact.actualDamage||0,blocked:!!impact.defenseBlocked,
  originX:[96,333,158][commandLanceTier(sequence.rarity)],originY:sequence.who==='A'?840:-40,
  launchAt:COMMAND_LANCE_TIMING.launchAt,flightMs:COMMAND_LANCE_TIMING.flightMs,
  impactAt:COMMAND_LANCE_TIMING.launchAt+COMMAND_LANCE_TIMING.flightMs
 })));
 return {hits:shots,signal:shots.length?{at:450,until:1050,characterId:sequence.characterId}:null,
  duration:4200,accepted:sequence.accepted,reason:sequence.reason||''};
}
export function commandLanceHullPose(hit,age,reduced=false){
 const zero={dx:0,dy:0,roll:0,light:0};
 if(age<0||age>=1000||hit.blocked||hit.actualDamage<=0)return zero;
 if(reduced)return {...zero,light:Math.exp(-age/135)*.16};
 const tier=commandLanceTier(hit.rarity),pulse=reduced?0:(1-Math.exp(-age/14))*Math.exp(-age/180);
 return {dx:pulse*(tier+1)*1.1,dy:pulse*(8+tier*2)*(hit.who==='A'?-1:1),
  roll:pulse*.045*(hit.who==='A'?-1:1),light:Math.exp(-age/135)*(reduced?.16:.5)};
}
