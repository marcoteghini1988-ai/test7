import {resolvePreparedFleetTurn} from '../src/fleetNext/combat.js';
import {stormCapacitorVariant} from '../src/stormCapacitorSpec.js';
export function configureStormCapacitorReview(b,{cardId,stormMode='fed',ownStage=1,blocked=false,withDefense=false,nowMs=Date.now()}={}){
 if(!stormCapacitorVariant(cardId))return b;let state=b;
 for(const side of Object.values(state.sides)){
  side.hand=[];side.deck=Array(40).fill('energy-ionic');side.energyPile=[];side.elementalCharges={};
  side.defenses=[];side.protections=[];side.fireDisabledUntil=0;
  for(const e of side.escorts){e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;}
  if(stormMode==='old-only'){side.energyPile=['energy-ionic','energy-ionic'];side.elementalCharges={ionic:2};}
 }
 const prepare=(who,stage)=>{
  const side=state.sides[who],fresh=!['missing','old-only'].includes(stormMode)&&!(stormMode==='skip-middle'&&stage===2);
  const ids=[...(fresh?['energy-ionic']:[]),...(stage===1?[cardId]:[])];
  side.hand=[...ids,...Array(7-ids.length).fill('energy-ionic')];
  if(stormMode==='disabled'||blocked&&who==='A')side.fireDisabledUntil=state.ply+20;
  if(withDefense||stormMode==='defense'){
   const source='storm-live-shield-'+who+'-'+stage;
   side.defenses=[{id:'gen-227',source,hidden:false,untilPly:state.ply+4}];
   side.protections=[{id:'gen-227',source,kind:'protect',target:side.escorts.length?'escort':'part',partId:'weapons',escortSlot:0,remaining:1,untilPly:state.ply+4}];
  }
  return ids;
 };
 for(let stage=1;stage<Math.min(ownStage,4);stage++)for(const who of ['A','B']){
  const ids=prepare(who,stage),r=resolvePreparedFleetTurn(state,who,{cards:ids.map((_,i)=>i),pass:true,targetKind:'part',targetId:'weapons',partId:'weapons'},nowMs);
  if(!r.ok)throw Error('Preparazione Tempesta: '+r.reason);state=r.battle;
 }
 for(const who of ['A','B'])prepare(who,ownStage);
 return state;
}
