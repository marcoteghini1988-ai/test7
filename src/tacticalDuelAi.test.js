import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {planTacticalAi} from './tacticalDuelAi.js';

test('IA locale prepara ordini legali senza leggere mano numerica o ordine segreto avversario',()=>{
 const b=createTacticalDuel();
 const first=planTacticalAi(b,'B');
 assert.equal(validateTacticalOrder(b,'B',first).ok,true);
 const x=structuredClone(b);
 x.sides.A.numeric.hand.reverse();
 x.sides.A.special.hand.reverse();
 x.orders.A={specialIndices:[],numericIndices:[0,1],vitalId:'weapons',op:'plus'};
 assert.deepEqual(planTacticalAi(x,'B'),first);
});
test('IA locale può giocare una partita fino al risultato senza carte inventate né round infiniti',()=>{
 let battle=createTacticalDuel();
 let now=0;
 for(let i=0;i<20&&battle.phase!=='finished';i++){
  now+=100;
  const ai=planTacticalAi(battle,'B');
  const b=sealTacticalOrder(battle,'B',ai,now);
  assert.equal(b.ok,true,b.reason);
  const a=sealTacticalOrder(b.battle,'A',{specialIndices:[],numericIndices:[]},now);
  assert.equal(a.ok,true,a.reason);
  battle=advanceTacticalDuel(a.battle,now);
  assert.equal(battle.phase,'resolving');
  for(const key of ['A','B']){
   const side=battle.sides[key];
   assert.equal(side.numeric.hand.length+side.numeric.deck.length+side.numeric.discard.length,52);
   assert.equal(side.special.hand.length+side.special.deck.length+side.special.discard.length,24);
  }
  now+=8000;
  battle=advanceTacticalDuel(battle,now);
 }
 assert.equal(battle.phase,'finished');
 assert.ok(['A','B','draw'].includes(battle.winner));
 assert.ok(battle.history.length>=1&&battle.history.length<=20);
});

test('IA senza formula ruota il ricambio gratuito sui sette slot veri anziche bloccare la mano',()=>{
 const base=createTacticalDuel({shipA:'C01',shipB:'R04',seed:18});
 base.sides.B.defense.shield={hp:300,max:300};
 for(let round=1;round<=7;round++){
  const battle=structuredClone(base);
  battle.round=round;
  const plan=planTacticalAi(battle,'A');
  assert.equal(plan.numericIndices.length,0);
  assert.equal(plan.exchangeIndices[0],round-1,'Il ricambio non resta bloccato allo slot 0');
  assert.equal(validateTacticalOrder(battle,'A',plan).ok,true);
 }
 assert.equal(base.sides.A.numeric.hand.length,7);
 assert.equal(base.sides.A.numeric.hand.length+base.sides.A.numeric.deck.length+base.sides.A.numeric.discard.length,52);
});

test('IA sceglie 3 numeriche per chiudere 8 HP, ma ne risparmia una a 6 o 10 HP',()=>{
 const base=createTacticalDuel({shipA:'C01',shipB:'R04',seed:18});
 const pile=base.sides.A.numeric;
 const all=[...pile.hand,...pile.deck];
 const chosen=[];
 for(const value of [4,5,2,3,4]){
  const card=all.find(c=>c.value===value&&!chosen.some(s=>s.id===c.id));
  assert.ok(card,'carta autentica '+value);
  chosen.push(card);
 }
 const selectedIds=new Set(chosen.map(c=>c.id));
 const rest=all.filter(c=>!selectedIds.has(c.id));
 pile.hand=[...chosen,...rest.slice(0,2)];
 pile.deck=rest.slice(2);
 assert.equal(pile.hand.length+pile.deck.length,52);
 base.sides.B.defense.shield.hp=0;
 base.sides.B.defense.parts.shieldGenerator.exposed=true;
 for(const [hp,expected] of [[10,2],[8,3],[6,2]]){
  const b=structuredClone(base);
  b.sides.B.defense.parts.shieldGenerator.hp=hp;
  const order=planTacticalAi(b,'A');
  assert.equal(order.vitalId,'shieldGenerator');
  assert.equal(order.numericIndices.length,expected,'HP '+hp);
  assert.equal(validateTacticalOrder(b,'A',order).ok,true);
 }
});
