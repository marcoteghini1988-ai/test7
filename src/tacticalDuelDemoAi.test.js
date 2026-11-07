import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {planTacticalDemoAi} from './tacticalDuelDemoAi.js';

test('IA demo prepara ordini legali senza leggere mano numerica o ordine segreto avversario',()=>{
 const b=createTacticalDuel();
 const first=planTacticalDemoAi(b,'B');
 assert.equal(validateTacticalOrder(b,'B',first).ok,true);
 const x=structuredClone(b);
 x.sides.A.numeric.hand.reverse();
 x.sides.A.special.hand.reverse();
 x.orders.A={specialIndices:[],numericIndices:[0,1],vitalId:'weapons',op:'plus'};
 assert.deepEqual(planTacticalDemoAi(x,'B'),first);
});
test('IA demo può giocare una partita fino al risultato senza carte inventate né round infiniti',()=>{
 let battle=createTacticalDuel();
 let now=0;
 for(let i=0;i<20&&battle.phase!=='finished';i++){
  now+=100;
  const ai=planTacticalDemoAi(battle,'B');
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
