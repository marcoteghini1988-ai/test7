import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {STORM_CAPACITOR_VARIANTS,stormFramePlan} from '../../../src/stormCapacitorSpec.js';
const other=who=>who==='A'?'B':'A';
export function stormSequence({rarity='Epica',who='A',supportCount=2,mode='fed',turns=3}={}){
 const c=STORM_CAPACITOR_VARIANTS.find(c=>c.rarity===rarity);
 let b=createMaglioReviewBattle({cardId:c.id,nowMs:0,supports:supportCount>0,supportCount,shipB:who==='B'?'N00':'C01'});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(40).fill('energy-ionic');side.energyPile=[];side.elementalCharges={};
  for(const e of side.escorts){e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;}
 }
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1).battle;
 if(mode==='old-only'){b.sides[who].energyPile=['energy-ionic','energy-ionic'];b.sides[who].elementalCharges={ionic:2};}
 const initial=structuredClone(b),frames=[];
 for(let stage=1;stage<=turns;stage++){
  if(stage>1)b=resolvePreparedFleetTurn(b,other(who),{cards:[],pass:true},stage*1000-100).battle;
  const side=b.sides[who],enemy=b.sides[other(who)],fresh=!['missing','old-only'].includes(mode)&&!(mode==='skip-middle'&&stage===2);
  if(mode==='disabled')side.fireDisabledUntil=99;
  if(mode==='defense'){
   const source='storm-review-shield-'+stage;
   enemy.defenses.push({id:'gen-227',source,hidden:false,untilPly:b.ply+2});
   enemy.protections.push({id:'gen-227',source,kind:'protect',target:supportCount?'escort':'part',partId:'weapons',escortSlot:0,remaining:1,untilPly:b.ply+2});
  }
  const ids=[...(fresh?['energy-ionic']:[]),...(stage===1?[c.id]:[])];side.hand=[...ids];
  const before=structuredClone(b),disabledBefore=!!side.fireBlocked||side.fireDisabledUntil>b.ply;
  const target=supportCount?{targetKind:'escort',targetId:enemy.escorts.find(e=>e.hp>0&&!e.destroyed)?.id}: {targetKind:'part',targetId:'weapons',partId:'weapons'};
  const r=resolvePreparedFleetTurn(b,who,{cards:ids.map((_,i)=>i),pass:true,...target},stage*1000);
  if(!r.ok)throw Error(r.reason);b=r.battle;
  const event=r.events.find(e=>e.cardId===c.id&&e.kind==='weapon-provisional-shot');
  const frame={stage,fresh,initial:before,battle:structuredClone(b),disabledBefore,accepted:r.ok,event,events:r.events,energyIdsPlayed:ids.filter(x=>x==='energy-ionic')};
  frame.plan=stormFramePlan(frame,rarity,who);frames.push(frame);
 }
 let expiration=null;
 if(turns===3){const r=resolvePreparedFleetTurn(b,other(who),{cards:[],pass:true},5000);
  if(r.ok)expiration={events:r.events,discarded:r.battle.sides[who].discard.includes(c.id),
   active:r.battle.sides[who].machines.some(m=>m.sourceCardId===c.id&&!m.destroyed&&m.untilPly>r.battle.ply)};}
 return {rarity,who,supportCount,mode,cardId:c.id,initial,frames,expiration,accepted:true};
}
export const stormCases=()=>[
 ...['Epica','Leggendaria'].flatMap(rarity=>[0,1,2].map(supportCount=>stormSequence({rarity,supportCount}))),
 stormSequence({rarity:'Leggendaria',who:'B',supportCount:1}),
 ...['skip-middle','missing','old-only','disabled','defense'].map(mode=>stormSequence({mode}))
];
