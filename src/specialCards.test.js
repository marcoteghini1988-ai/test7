import test from 'node:test';
import assert from 'node:assert/strict';
import {newManeuverState} from './fleetManeuvers.js';
import {BOSS_CHARACTER_TYPES,isBossCharacterCard} from './bossCharacterCards.js';
import {SPECIAL_HAND_SIZE,SPECIAL_CARD_CATALOG,initializeSpecialDeck,refillSpecialHand,
 specialCardDefinition,findFusionCardIndex,playSpecialCard} from './specialCards.js';

function ship(level=5){
 return {fleet:[{id:'N00',level,defense:{kind:'mother',shield:{hp:100,max:100},parts:{
  engine:{hp:10},command:{hp:10},weapons:{hp:10},shieldGenerator:{hp:10}}}}],
 escorts:level>=3?[{id:'N00:escort:1',defense:{destroyed:false,shield:{hp:50,max:50}}}]:[],
 maneuvers:{...newManeuverState(),sync:100}};
}
const zero=()=>0;
test('every explicitly designed fusion and support card is registered',()=>{
 assert.deepEqual(Object.keys(SPECIAL_CARD_CATALOG).filter(x=>!isBossCharacterCard(x)).sort(),['fusion-barrier','fusion-strike','fusion-triad','fusion-twin','shot-corrosion','shot-ion','shot-piercing','support-escort-repair','support-shield-repair','support-status-purge','tactical-cover']);
 assert.equal(BOSS_CHARACTER_TYPES.length,12);
 assert.ok(BOSS_CHARACTER_TYPES.every(x=>SPECIAL_CARD_CATALOG[x]?.family==='boss-character'));
});
test('initial special hand is separate from numeric cards and has exactly five',()=>{
 const input={...ship(),hand:[{value:8,suit:'♥'}],deck:[{value:13,suit:'♠'}]};
 const s=initializeSpecialDeck(input,zero);
 assert.equal(s.specialHand.length,SPECIAL_HAND_SIZE);
 assert.equal(s.specialDeck.length,19);
 assert.equal(s.specialDiscard.length,0);
 assert.deepEqual(s.hand,input.hand);assert.deepEqual(s.deck,input.deck);
});
test('the special deck has intentional duplicates and unique instance IDs',()=>{
 const s=initializeSpecialDeck(ship(),zero),all=[...s.specialHand,...s.specialDeck];
 assert.equal(all.length,24);
 assert.equal(new Set(all.map(x=>x.id)).size,24);
 assert.equal(all.filter(x=>x.type==='fusion-barrier').length,4);
 assert.equal(all.filter(x=>x.type==='fusion-strike').length,4);
 assert.equal(all.filter(x=>x.type==='tactical-cover').length,4);
 for(const type of ['shot-piercing','shot-ion','shot-corrosion'])
  assert.equal(all.filter(x=>x.type===type).length,4,type);
});
test('fusion cannot be triggered with a nonexistent special card',()=>{
 const s=initializeSpecialDeck(ship(),zero);
 assert.equal(playSpecialCard(s,99,{escortSlot:0},0,zero).reason,'card_missing');
 assert.equal(s.maneuvers.fusion,null);
});
test('playing a barrier card immediately returns the special hand to five',()=>{
 const s=initializeSpecialDeck(ship(),zero);
 const i=findFusionCardIndex(s,'barrier');
 const result=playSpecialCard(s,i,{escortSlot:0},1000,zero);
 assert.equal(result.played,true);
 assert.equal(result.side.maneuvers.fusion.mode,'barrier');
 assert.equal(result.side.specialHand.length,5);
 assert.equal(result.side.specialDeck.length,18);
 assert.equal(result.side.specialDiscard.length,1);
 assert.equal(result.side.specialUses,1);
 assert.equal(s.specialUses,0);
});
test('playing strike consumes the strike card rather than any numerical card',()=>{
 const s=initializeSpecialDeck({...ship(),hand:[{value:4,suit:'♣'}]},()=>.9);
 const index=findFusionCardIndex(s,'strike');
 assert.ok(index>=0);
 const result=playSpecialCard(s,index,{escortSlot:0},1000,zero);
 assert.equal(result.played,true);
 assert.equal(result.side.maneuvers.fusion.mode,'strike');
 assert.deepEqual(result.side.hand,s.hand);
});
test('not enough sync leaves card and deck untouched',()=>{
 const s=initializeSpecialDeck(ship(),zero);s.maneuvers.sync=15;
 const i=findFusionCardIndex(s,'barrier'),result=playSpecialCard(s,i,{escortSlot:0},100,zero);
 assert.equal(result.played,false);assert.equal(result.reason,'not_enough_sync');
 assert.equal(result.side.specialHand.length,5);
 assert.equal(result.side.specialUses,0);
});
test('an unavailable escort prevents consuming the special card',()=>{
 const s=initializeSpecialDeck(ship(1),()=>.9);
 const i=findFusionCardIndex(s,'strike'),res=playSpecialCard(s,i,{escortSlot:0},1,zero);
 assert.equal(res.played,false);assert.equal(res.reason,'escort_unavailable');
 assert.equal(s.specialHand.length,5);
});
test('fusion cannot be stacked, even with several special cards',()=>{
 const s=initializeSpecialDeck(ship(),()=>.9);
 const first=playSpecialCard(s,findFusionCardIndex(s,'strike'),{escortSlot:0},1,zero);
 assert.equal(first.played,true);
 const second=playSpecialCard(first.side,findFusionCardIndex(first.side,'barrier'),{escortSlot:0},2,zero);
 assert.equal(second.played,false);
 assert.equal(second.reason,'fusion_active');
 assert.equal(second.side.specialUses,1);
});
test('discarded special cards are recycled, allowing no extra hand refill limit',()=>{
 const s=initializeSpecialDeck(ship(),zero);
 const cards=[...s.specialHand];
 const r=refillSpecialHand({...s,specialHand:[],specialDeck:[],
  specialDiscard:cards},zero);
 assert.equal(r.specialHand.length,5);
 assert.equal(r.specialDeck.length,0);
 assert.equal(r.specialDiscard.length,0);
 assert.deepEqual(r.specialHand.map(c=>c.id).sort(),cards.map(c=>c.id).sort());
});
test('unknown special type has no fallback effect',()=>{
 const s=initializeSpecialDeck(ship(),zero);
 const hand=[...s.specialHand];hand[0]={id:'invalid',type:'warp-reset'};
 const r=playSpecialCard({...s,specialHand:hand},0,{escortSlot:0},10,zero);
 assert.equal(r.played,false);assert.equal(r.reason,'unknown_card');
 assert.equal(specialCardDefinition(hand[0]),null);
});
test('initialization is idempotent and does not erase battle state',()=>{
 const s=initializeSpecialDeck(ship(),zero);
 assert.equal(initializeSpecialDeck(s,zero),s);
});

test('nuove carte Gemellare e Trina richiedono due scudiere, 100 Sincronia e consumano una copia reale',async()=>{
 const {initialBattle}=await import('./mathDuelEngine.js');
 const {SPECIAL_DEFAULT_TYPES}=await import('./specialCards.js');
 const types=[...SPECIAL_DEFAULT_TYPES];
 types[0]='fusion-twin';types[1]='fusion-triad';
 const bring=(side,type)=>{
  const inHand=side.specialHand.findIndex(c=>c.type===type);
  if(inHand>=0)return {...side,maneuvers:{...side.maneuvers,sync:100}};
  const index=side.specialDeck.findIndex(c=>c.type===type);
  assert.ok(index>=0);
  const hand=[...side.specialHand],deck=[...side.specialDeck];
  [hand[0],deck[index]]=[deck[index],hand[0]];
  return {...side,specialHand:hand,specialDeck:deck,
   maneuvers:{...side.maneuvers,sync:100}};
 };
 for(const [type,mode] of [['fusion-twin','twin'],['fusion-triad','triad']]){
  const game=initialBattle(1,{vitalPrototype:true,shipLevel:5,fleetIds:['N00'],
   specialDeckTypes:types},()=>.5);
  const ready=bring(game.player,type);
  const initialIds=[...ready.specialHand,...ready.specialDeck,...ready.specialDiscard]
   .map(c=>c.id).sort();
  const idx=ready.specialHand.findIndex(c=>c.type===type);
  const played=playSpecialCard(ready,idx,{escortSlot:1},1000,()=>0);
  assert.equal(played.played,true);
  assert.equal(played.card.type,type);
  assert.equal(played.side.maneuvers.fusion.mode,mode);
  assert.deepEqual(played.side.maneuvers.fusion.escortSlots,[0,1]);
  assert.equal(played.side.maneuvers.sync,0);
  assert.equal(played.side.specialUses,1);
  assert.equal(played.side.specialHand.length,5);
  assert.equal(played.side.specialDiscard.length,1);
  assert.deepEqual(
   [...played.side.specialHand,...played.side.specialDeck,...played.side.specialDiscard]
    .map(c=>c.id).sort(),initialIds);
  assert.deepEqual(ready.specialDiscard,[]);
  const noEscorts={...ready,escorts:[ready.escorts[0],
   {...ready.escorts[1],defense:{...ready.escorts[1].defense,
     shield:{...ready.escorts[1].defense.shield,hp:0}}}]};
  const denied=playSpecialCard(noEscorts,idx,{escortSlot:0},1000,()=>0);
  assert.equal(denied.played,false);
  assert.equal(denied.reason,'escort_unavailable');
  assert.deepEqual(denied.side,noEscorts);
 }
});
