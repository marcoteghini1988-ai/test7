// Read-only fixtures for all six fronts. HP and resource changes are emitted
// by the real resolver; no draft visual is installed in the playable registry.
import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {card,SIPHON_ATTACKS} from '../../../src/fleetNext/rules.js';
import {previewCards} from './catalog.mjs';
const other=who=>who==='A'?'B':'A';
export function batchSequence({cardId,who='A',supportCount=0,mode='normal',charges=0,slot=0,discardedStrategies=0,turns}={}){
 const c=previewCards().find(c=>c.id===cardId);if(!c)throw Error('Not one of the six draft cards: '+cardId);
 let b=createMaglioReviewBattle({cardId,nowMs:0,supports:supportCount>0,supportCount,slot,shipA:'N00',shipB:'N00'});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(40).fill('energy-ionic');side.energyPile=[];side.elementalCharges={};
  for(const e of side.escorts){e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;}
 }
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1).battle;
 const side=b.sides[who];
 side.energyPile=Array(charges).fill('energy-plasma');side.elementalCharges=charges?{plasma:charges}:{};
 // Catalog Strategy fixture, never guessed from its name.
 const strategy=SIPHON_ATTACKS.find(c=>card(c.id)?.kind==='attack')?.id;
 if(discardedStrategies&&!strategy)throw Error('No valid Strategy fixture');
 side.discard=Array(discardedStrategies).fill(strategy);
 const initial=structuredClone(b),frames=[],maxTurns=turns??c.duration;
 for(let stage=1;stage<=maxTurns;stage++){
  const presentationInitial=structuredClone(b);let betweenEvents=[];
  if(stage>1){const r=resolvePreparedFleetTurn(b,other(who),{cards:[],pass:true},stage*1000-100);if(!r.ok)throw Error(r.reason);b=r.battle;betweenEvents=r.events;}
  const own=b.sides[who],enemy=b.sides[other(who)];
  if(mode==='disabled')own.fireDisabledUntil=99;
  if(mode==='defense'){
   const source='batch-shield-'+stage;enemy.defenses.push({id:'gen-227',source,hidden:false,untilPly:b.ply+2});
   enemy.protections.push({id:'gen-227',source,kind:'protect',target:supportCount?'escort':'part',partId:'weapons',escortSlot:0,remaining:1,untilPly:b.ply+2});
  }
  own.hand=stage===1?[cardId]:[];
  const before=structuredClone(b),disabledBefore=!!own.fireBlocked||own.fireDisabledUntil>b.ply;
  const living=enemy.escorts.find(e=>e.hp>0&&!e.destroyed),target=supportCount&&living?
   {targetKind:'escort',targetId:living.id}:{targetKind:'part',targetId:'weapons',partId:'weapons'};
  const r=resolvePreparedFleetTurn(b,who,{cards:stage===1?[0]:[],pass:true,...target},stage*1000);
  if(!r.ok)throw Error(r.reason);b=r.battle;
  const event=r.events.find(e=>e.cardId===cardId&&['weapon-designed-shot','weapon-provisional-shot'].includes(e.kind));
  frames.push({stage,initial:before,presentationInitial,battle:structuredClone(b),disabledBefore,event:event||null,events:r.events,betweenEvents,
   energyBefore:before.sides[who].energyPile,energyAfter:structuredClone(b.sides[who].energyPile)});
 }
 const r=resolvePreparedFleetTurn(b,other(who),{cards:[],pass:true},maxTurns*1000+500);
 const expiration=r.ok?{discarded:r.battle.sides[who].discard.includes(cardId),active:r.battle.sides[who].machines.some(m=>m.sourceCardId===cardId&&!m.destroyed&&m.untilPly>r.battle.ply),events:r.events}:null;
 return {cardId,kind:c.kind,rarity:c.rarity,who,supportCount,mode,slot,charges,initial,frames,expiration};
}
export function judgmentCases(){
 const cardId=previewCards().find(c=>c.kind==='judgment').id;
 return [batchSequence({cardId}),batchSequence({cardId,supportCount:2}),batchSequence({cardId,who:'B',slot:1}),batchSequence({cardId,mode:'defense'}),batchSequence({cardId,mode:'disabled'})];
}
export function batchCases(){return previewCards().flatMap(c=>c.kind==='judgment'?judgmentCases():c.kind==='mortar'?
 [...[0,1,2,3].map(charges=>batchSequence({cardId:c.id,charges})),batchSequence({cardId:c.id,charges:2,who:'B',supportCount:2,slot:1}),batchSequence({cardId:c.id,charges:2,mode:'defense'})]:
 [...[0,2,8].map(discardedStrategies=>batchSequence({cardId:c.id,discardedStrategies,turns:3})),batchSequence({cardId:c.id,discardedStrategies:2,who:'B',supportCount:1,slot:1,turns:3}),batchSequence({cardId:c.id,mode:'defense',turns:3})]);}
