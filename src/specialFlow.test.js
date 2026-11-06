// Punti 32, 37, 38: verifica end-to-end dei due mazzi senza anticipare
// la dimensione definitiva, le rarità o il catalogo conclusivo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {playSpecialCard,makeSpecialInstances,SPECIAL_HAND_SIZE} from './specialCards.js';
import {armedShotEffects,shotCombinationName} from './strategicShots.js';
const rng=()=>.5;
const allCards=side=>[...(side.specialHand||[]),...(side.specialDeck||[]),...(side.specialDiscard||[])];
function orderedHand(side,types){
 const full=allCards(side),used=new Set();
 const hand=types.map(type=>{
  const found=full.find(card=>card.type===type&&!used.has(card.id));
  assert.ok(found,'Carta realmente presente nel mazzo: '+type);
  used.add(found.id);return found;
 });
 return {...side,specialHand:hand,specialDeck:full.filter(card=>!used.has(card.id)),specialDiscard:[]};
}
test('32/37/38: due speciali offensive diverse si armano nello stesso momento, senza sottrarre numeriche',()=>{
 const battle=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rng);
 const side=orderedHand(battle.player,['shot-piercing','shot-ion','shot-corrosion','fusion-barrier','tactical-cover']);
 const originalNumeric=side.hand.map(c=>c.id);
 const originalSpecialIds=allCards(side).map(c=>c.id).sort();
 assert.equal(side.hand.length,7);
 assert.equal(side.specialHand.length,SPECIAL_HAND_SIZE);
 assert.equal(allCards(side).length,24);
 let result=playSpecialCard(side,0,{escortSlot:0},1000,rng);
 assert.equal(result.played,true);
 assert.equal(result.side.specialHand.length,5);
 assert.equal(result.side.specialUses,1);
 let second=result.side;
 let index=second.specialHand.findIndex(c=>c.type==='shot-ion');
 assert.ok(index>=0);
 result=playSpecialCard(second,index,{escortSlot:0},1000,rng);
 assert.equal(result.played,true);
 second=result.side;
 assert.equal(second.specialHand.length,5);
 assert.equal(second.specialUses,2);
 assert.deepEqual(second.hand.map(c=>c.id),originalNumeric);
 assert.equal(shotCombinationName(armedShotEffects(second)),'Breccia Ionica');
 assert.deepEqual(allCards(second).map(c=>c.id).sort(),originalSpecialIds);
 const thirdIdx=second.specialHand.findIndex(c=>c.type==='shot-corrosion');
 assert.ok(thirdIdx>=0);
 const blocked=playSpecialCard(second,thirdIdx,{escortSlot:0},1000,rng);
 assert.equal(blocked.played,false);
 assert.equal(blocked.reason,'volley_slots_full');
 assert.equal(blocked.side,second);
 const impact=applyPendingHit(battle.enemy,0,'plus',80,{
  strikeEffects:armedShotEffects(second),nowMs:1000,hitId:'special-flow-test'
 });
 assert.ok(impact.motherDamage>0);
 assert.ok(impact.strategicApplied.includes('shot-ion'));
 assert.deepEqual(second.hand.map(c=>c.id),originalNumeric);
});
test('37/38: usare supporti diversi consuma solo le speciali possedute e ripristina subito la mano a cinque',()=>{
 const types=['support-shield-repair','support-status-purge','shot-piercing','shot-ion']
  .flatMap(type=>Array(6).fill(type));
 assert.equal(makeSpecialInstances(types).length,24);
 const battle=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  specialDeckTypes:types},rng);
 let side=orderedHand(battle.player,['support-shield-repair','support-status-purge',
  'shot-piercing','shot-ion','support-shield-repair']);
 const oldDefense=side.fleet[0].defense;
 side={...side,strategicStatuses:{ionizedUntil:25000,corrodedUntil:25000},
  fleet:[{...side.fleet[0],defense:{...oldDefense,shield:{...oldDefense.shield,hp:40}}}]};
 const numeric=side.hand.map(x=>x.id);
 const repair=playSpecialCard(side,0,{},1000,rng);
 assert.equal(repair.played,true);
 assert.equal(repair.side.specialHand.length,5);
 assert.equal(repair.side.fleet[0].defense.shield.hp,60);
 const purgeIndex=repair.side.specialHand.findIndex(card=>card.type==='support-status-purge');
 assert.ok(purgeIndex>=0);
 const purge=playSpecialCard(repair.side,purgeIndex,{},1000,rng);
 assert.equal(purge.played,true);
 assert.equal(purge.side.specialHand.length,5);
 assert.equal(purge.side.specialUses,2);
 assert.equal(purge.side.strategicStatuses.ionizedUntil,0);
 assert.equal(purge.side.strategicStatuses.corrodedUntil,0);
 assert.deepEqual(purge.side.hand.map(x=>x.id),numeric);
 const nextPurge=purge.side.specialHand.findIndex(card=>card.type==='support-status-purge');
 if(nextPurge>=0){
  const noEffect=playSpecialCard(purge.side,nextPurge,{},1000,rng);
  assert.equal(noEffect.played,false);
  assert.equal(noEffect.side,purge.side);
 }
});
