import {resolvePreparedFleetTurn} from '../src/fleetNext/combat.js';
import {commandLanceVariant} from '../src/commandLanceSpec.js';
export function configureCommandLanceReview(b,{cardId,lanceReviewMode='active',blocked=false,withDefense=false,nowMs=Date.now()}={}){
 if(!commandLanceVariant(cardId))return b;let state=b;
 for(const side of Object.values(state.sides)){
  side.hand=[];side.deck=Array(40).fill('energy-ionic');side.energyPile=[];side.elementalCharges={};side.fireDisabledUntil=0;
  side.defenses=[];side.protections=[];
  for(const escort of side.escorts){escort.skill={requires:[],action:'none'};escort.supportSkillIds=[];escort.supportSkillId=null;}
 }
 const play=(who,ids)=>{state.sides[who].hand=[...ids];const r=resolvePreparedFleetTurn(state,who,{cards:ids.map((_,i)=>i),pass:true},nowMs);if(!r.ok)throw Error('Preparazione Lancia: '+r.reason);state=r.battle;};
 if(!['missing','same-turn'].includes(lanceReviewMode)){
  play('A',['gen-216']);play('B',['gen-216']);
  if(lanceReviewMode==='expired'){play('A',[]);play('B',[]);}
 }
 for(const [who,side]of Object.entries(state.sides)){
  const ids=lanceReviewMode==='same-turn'?['gen-216',cardId]:[cardId];side.hand=[...ids,...Array(7-ids.length).fill('energy-ionic')];
  if(withDefense||lanceReviewMode==='defense'){
   const source='review-lance-shield-'+who;side.defenses.push({id:'gen-227',source,hidden:false,untilPly:99});
   side.protections.push({id:'gen-227',source,kind:'protect',target:side.escorts.length?'escort':'part',partId:'weapons',escortSlot:0,remaining:1,untilPly:99});
  }
 }
 if(blocked||lanceReviewMode==='disabled')state.sides.A.fireDisabledUntil=state.ply+20;
 return state;
}
