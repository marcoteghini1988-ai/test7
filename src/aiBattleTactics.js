// Point 29: target-aware AI. Only public cards, installed operations and
// actual visible ship state are used. No forced turn clock for the player.
import {aiChoose,findMoves,findThreeCardMoves,previewVolley,supportedOperators} from './mathDuelEngine.js';
import {VITAL_IDS,matchesVitalSignature,remainingExposureSlots} from './vitalDefense.js';

const indicesFor=move=>Array.isArray(move.indices)?move.indices:[move.i,move.j];
const cardsFor=(side,move)=>indicesFor(move).map(i=>side.hand[i]);
function potentialPokerMoves(side,defender,targetIndex,part){
 const options=part.signature?.kind==='any'?part.signature.options.filter(s=>s.kind==='poker'):[];
 if(!options.length)return [];
 const available=supportedOperators(side).filter(op=>(defender.fleet[targetIndex]?.engines?.[op]?.hp||0)>0);
 const candidates=[];
 for(const count of [2,3]){
  for(let i=0;i<side.hand.length;i++)for(let j=i+1;j<side.hand.length;j++){
   const picks=count===2?[[i,j]]:Array.from({length:side.hand.length-j-1},(_,offset)=>[i,j,j+offset+1]);
   for(const indices of picks){
    const cards=indices.map(k=>side.hand[k]);
    if(options.some(sig=>matchesVitalSignature(sig,cards)))
     for(const op of available)candidates.push({op,indices,targetShip:targetIndex,vitalId:part.id,poker:true});
   }
  }
 }
 return candidates;
}
function scoreMove(side,move,defender,targetKind){
 const cards=cardsFor(side,move);
 if(cards.some(c=>!c))return -Infinity;
 const salvo=previewVolley(side,cards,'auto',{targetKind});
 const damage=salvo.totalDamage||0;
 // A two-card calculation conserves more of the numeric hand when comparably useful.
 const bonus=cards.length===2?4:0;
 return Math.min(100,damage)+bonus+(move.poker?1:0);
}
export function chooseCombatMove(side,defender,targets,rng=Math.random){
 const candidates=[...findMoves(side,defender,targets),...findThreeCardMoves(side,defender,targets)];
 const mother=defender?.fleet?.[0]?.defense;
 if(mother?.kind!=='mother'){
  return aiChoose(side,defender,targets,rng)??candidates[0]??null;
 }
 if(mother.shield.hp>0){
  const choices=candidates.map(move=>({...move,score:scoreMove(side,move,defender,'motherShield')}));
  choices.sort((a,b)=>b.score-a.score);
  return choices[0]??null;
 }
 // Once the mother shield is depleted only signatures that REALLY match an
 // exposed (or now exposable) vital may be fired. Don't waste a salvo.
 const freeSlots=remainingExposureSlots(mother);
 const parts=VITAL_IDS.map(id=>({...mother.parts[id],id})).filter(part=>
  part.hp>0&&(part.exposed||freeSlots>0));
 let result=null,best=-Infinity;
 for(const part of parts){
  const tactical=candidates.filter(move=>matchesVitalSignature(part.signature,cardsFor(side,move)));
  const poker=potentialPokerMoves(side,defender,0,part);
  for(const move of [...tactical,...poker]){
   if(move.targetShip!==0)continue;
   const score=scoreMove(side,move,defender,'motherVital')+
    (part.exposed?15:0)+(part.id==='command'?2:0);
   if(score>best){best=score;result={...move,vitalId:part.id,score};}
  }
 }
 return result;
}
