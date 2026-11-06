import test from 'node:test';
import assert from 'node:assert/strict';
import {createShip,initialBattle,consumeAttack,deckExhausted,
 fillHand,inspectCalculationCards} from './mathDuelEngine.js';
import {chooseCombatMove} from './aiBattleTactics.js';
import {findDeadlock,recoverStalledHand,RECOVERY_COOLDOWN_MS} from './battlePacing.js';
import {damageMotherShield,exposeMotherPart,VITAL_IDS,matchesVitalSignature} from './vitalDefense.js';

const rng=()=>.5,zero=()=>0;
const start=()=>initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rng);
const cards=values=>values.map((value,i)=>({id:'test-'+i,value,suit:['♥','♠','♦','♣'][i%4]}));
const impossible={plus:100,minus:90,times:997,divide:55};
const allIds=s=>[...s.hand,...s.deck,...s.discard].map(c=>c.id);
function selectVital(defender,id,signature){
 const m=defender.fleet[0],base=m.defense;
 let d=damageMotherShield(base,base.shield.hp).defense;
 const opened=exposeMotherPart(d,id);
 assert.equal(opened.exposed,true);
 d=opened.defense;
 return {...defender,fleet:[{...m,defense:{...d,parts:{
  ...d.parts,[id]:{...d.parts[id],signature}
 }}}]};
}
test('29: new continuous battle may recycle numerics; legacy decks stay finite',()=>{
 const b=start(),legacy=createShip(1,false,{},rng);
 assert.equal(b.player.recycleNumericDeck,true);
 assert.equal(b.enemy.recycleNumericDeck,true);
 assert.equal(legacy.recycleNumericDeck,undefined);
 assert.equal(b.player.deck.length,45);
 assert.equal(allIds(b.player).length,52);
});
test('29: recycling cannot fabricate a new number or duplicate a card after 80 attacks',()=>{
 let s=start().player;
 const original=new Set(allIds(s));
 for(let i=0;i<80;i++){
  s=consumeAttack(s,[0,1]);
  assert.equal(s.hand.length,7);
  const ids=allIds(s);
  assert.equal(ids.length,52);
  assert.equal(new Set(ids).size,52);
  assert.deepEqual(new Set(ids),original);
 }
 assert.ok(s.reshuffles>=2);
 assert.equal(deckExhausted(s,start().enemy),false);
});
test('29: legacy finite deck remains exhausted when its draw pile is empty',()=>{
 const legacy=createShip(1,false,{},rng),other=createShip(1,true,{},rng);
 const empty={...legacy,deck:[],discard:legacy.deck};
 assert.equal(deckExhausted(empty,other),true);
 const attempted=fillHand({...empty,hand:legacy.hand.slice(0,5)});
 assert.equal(attempted.hand.length,5);
});
test('29: AI uses real fixed math signatures and rejects wrong operations',()=>{
 const b=start(),target=selectVital(b.player,'engine',
  {kind:'mathGate',op:'plus',target:10,allowedCardCounts:[2,3]});
 const hand=cards([4,6,2,5,8,11,13]);
 // All other vitals are unavailable, so we test the exact engine signature.
 const mother=target.fleet[0];
 const locked={...target,fleet:[{...mother,defense:{...mother.defense,parts:
  Object.fromEntries(Object.entries(mother.defense.parts).map(([id,part])=>
   [id,id==='engine'?part:{...part,hp:0}]))}}]};
 const s={...b.enemy,hand};
 const move=chooseCombatMove(s,locked,{...b.targets,plus:10});
 assert.ok(move,'an achievable plus proof exists');
 assert.equal(move.vitalId,'engine');
 assert.equal(move.op,'plus');
 assert.equal(inspectCalculationCards(move.op,
  (move.indices||[move.i,move.j]).map(i=>hand[i]),10).valid,true);
});
test('29: AI must not use a mathematically valid but wrongly signed vital shot',()=>{
 const b=start(),target=selectVital(b.player,'engine',
  {kind:'mathGate',op:'plus',target:2,allowedCardCounts:[2,3]});
 const s={...b.enemy,hand:cards([5,5,5,5,5,5,5])};
 assert.equal(chooseCombatMove(s,target,{...b.targets,plus:2}),null);
});
test('29: AI may choose the optional poker signature from its actual hand',()=>{
 const b=start(),target=selectVital(b.player,'engine',{kind:'any',options:[
  {kind:'mathGate',op:'times',target:997,allowedCardCounts:[2,3]},
  {kind:'poker',pattern:'pair'}
 ]});
 const s={...b.enemy,hand:cards([7,7,2,3,5,9,11])};
 const move=chooseCombatMove(s,target,{...impossible});
 assert.ok(move);
 assert.equal(move.vitalId,'engine');
 assert.equal(move.poker,true);
 assert.equal(matchesVitalSignature(target.fleet[0].defense.parts.engine.signature,
  (move.indices||[move.i,move.j]).map(i=>s.hand[i])),true);
});
test('29: if defender has a shield, AI can fire normal arithmetic instead of a vital',()=>{
 const b=start(),s={...b.enemy,hand:cards([4,6,2,5,8,11,13])};
 const move=chooseCombatMove(s,b.player,{...b.targets,plus:10});
 assert.ok(move);
 assert.equal(move.vitalId,undefined);
});
test('29: 15s recovery can be used only if there is no possible legal shot',()=>{
 const b=start(),s={...b.player,hand:cards([1,1,1,1,1,1,1])};
 assert.equal(findDeadlock(s,b.enemy,impossible).stalled,true);
 const x=recoverStalledHand(s,b.enemy,impossible,1000,zero);
 assert.equal(x.recovered,true);
 assert.equal(x.side.recoveryReadyAt,1000+RECOVERY_COOLDOWN_MS);
 assert.equal(x.side.recoveryCount,1);
 assert.equal(x.side.hand.length,7);
 assert.equal(x.side.deck.length,s.deck.length-1);
 assert.equal(x.side.discard.length,s.discard.length+1);
});
test('29: recovery conserves all original numeric card IDs and special cards',()=>{
 const b=start();
 // Reuse the seven true numeric cards, without constructing duplicate test IDs.
 const s=b.player;
 const first=recoverStalledHand(s,b.enemy,impossible,2000,zero);
 assert.equal(first.recovered,true);
 assert.deepEqual(new Set(allIds(first.side)),new Set(allIds(s)));
 assert.equal(new Set(allIds(first.side)).size,52);
 assert.deepEqual(first.side.specialHand,s.specialHand);
 assert.deepEqual(first.side.specialDeck,s.specialDeck);
 assert.deepEqual(first.side.fleet,s.fleet);
});
test('29: recovery is blocked before cooldown even if a deadlock continues',()=>{
 const b=start(),s=b.player;
 const first=recoverStalledHand(s,b.enemy,impossible,2000,zero);
 assert.equal(first.recovered,true);
 const second=recoverStalledHand(first.side,b.enemy,impossible,2001,zero);
 assert.equal(second.recovered,false);
 assert.equal(second.reason,'cooldown');
 assert.equal(second.remainingMs,RECOVERY_COOLDOWN_MS-1);
});
test('29: recovery is rejected whenever any ordinary or triple calculation exists',()=>{
 const b=start(),s={...b.player,hand:cards([4,6,2,3,5,8,9])};
 assert.equal(findDeadlock(s,b.enemy,{...b.targets,plus:10}).stalled,false);
 const result=recoverStalledHand(s,b.enemy,{...b.targets,plus:10},1000,zero);
 assert.equal(result.recovered,false);
 assert.equal(result.reason,'legal_move_available');
});
test('29: recovery is never available in legacy non-continuous matches',()=>{
 const legacy=createShip(1,false,{},rng),enemy=createShip(1,true,{},rng);
 assert.equal(findDeadlock(legacy,enemy,impossible).reason,'legacy_mode');
 const r=recoverStalledHand(legacy,enemy,impossible,1000,zero);
 assert.equal(r.recovered,false);
 assert.equal(r.side,legacy);
});
