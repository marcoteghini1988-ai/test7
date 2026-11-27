import {batchWeaponVariant} from '../src/weaponBatchSpec.js';
import {SIPHON_ATTACKS} from '../src/fleetNext/rules.js';
import {resolvePreparedFleetTurn} from '../src/fleetNext/combat.js';
export function configureBatchWeaponReview(b,{cardId,ownStage=1,batchMode='normal',energyCards=0,discardedStrategies=0,blocked=false,withDefense=false,nowMs=Date.now()}={}){
 const c=batchWeaponVariant(cardId);if(!c)return b;let state=b;
 for(const side of Object.values(state.sides)){
  side.hand=[];side.deck=Array(40).fill('energy-ionic');side.energyPile=c.kind==='mortar'?Array(energyCards).fill('energy-plasma'):[];side.elementalCharges=side.energyPile.length?{plasma:energyCards}:{};
  side.discard=Array(discardedStrategies).fill(SIPHON_ATTACKS[0].id);side.defenses=[];side.protections=[];side.fireDisabledUntil=0;
  for(const e of side.escorts){e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;}
 }
 const prepare=(who,stage)=>{
  const side=state.sides[who];side.hand=[...(stage===1?[cardId]:[]),...Array(stage===1?6:7).fill(c.kind==='mortar'?'energy-plasma':'energy-ionic')];
  if(batchMode==='disabled'||blocked&&who==='A')side.fireDisabledUntil=state.ply+30;
  if(withDefense||batchMode==='defense'){
   const source='batch-live-defense-'+who+'-'+stage;
   side.defenses=[{id:'gen-227',source,hidden:false,untilPly:state.ply+4}];side.protections=[{id:'gen-227',source,kind:'protect',target:side.escorts.length?'escort':'part',partId:'weapons',escortSlot:0,remaining:1,untilPly:state.ply+4}];
  }
 };
 for(let stage=1;stage<Math.min(ownStage,5);stage++)for(const who of ['A','B']){
  prepare(who,stage);const r=resolvePreparedFleetTurn(state,who,{cards:stage===1?[0]:[],pass:true,targetKind:'part',targetId:'weapons',partId:'weapons'},nowMs);
  if(!r.ok)throw Error('Preparazione sei Armi: '+r.reason);state=r.battle;
 }
 for(const who of ['A','B'])prepare(who,ownStage);return state;
}
