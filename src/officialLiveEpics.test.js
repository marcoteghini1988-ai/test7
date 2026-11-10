import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn,
 supportedLiveSpecial} from './officialLiveDuelEngine.js';
const game=(ship='N00')=>createOfficialLiveDuel(createTacticalDuel({
 shipA:ship,shipB:'N00',levelA:1,levelB:1,nowMs:0}),0);
const move=(b,key,action,t)=>{const r=applyOfficialLiveAction(b,key,action,t);
 assert.equal(r.ok,true,JSON.stringify({action,key,reason:r.reason}));return r.battle;};
const equip=(b,id)=>{b.sides.A.epic.entitlements=[id];b.sides.A.special.hand[0].type=id;return b;};
test('Cinque epici LIVE sono attivi, Matrice resta disabilitata finche non esiste colpo pesante di precisione',()=>{
 for(const id of ['epic_item_1','epic_item_3','epic_item_6','epic_item_7','epic_item_8'])
  assert.equal(supportedLiveSpecial(id),true);
 assert.equal(supportedLiveSpecial('epic_item_9'),false);
});
test('Möbius richiede vitali critici e usa una numerica realmente presente nel mazzo',()=>{
 let b=equip(game(),'epic_item_1');
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,'mobius_not_critical');
 assert.equal(b.sides.A.special.hand.length,5);
 for(const part of Object.values(b.sides.A.defense.parts))part.hp=3;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 const desired=b.sides.A.numeric.deck[2].id;
 assert.equal(b.sides.A.epic.peek.length,10);
 b=move(b,'A',{type:'epic-choice',index:2},3);
 assert.equal(b.actionUsed.special,1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},4);
 b=finishOfficialLiveTurn(b,5);
 b=finishOfficialLiveTurn(b,6);
 assert.equal(b.sides.A.numeric.hand.at(-1).id,desired);
 assert.equal(b.sides.A.epic.liveChoiceCommitted,false);
});
test('Astrolabio: sceglie una delle prossime due numeriche senza duplicazioni',()=>{
 let b=equip(game(),'epic_item_3');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.epic.peek.length,2);
 const desired=b.sides.A.numeric.deck[1].id;
 b=move(b,'A',{type:'epic-choice',index:1},2);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},3);
 b=finishOfficialLiveTurn(b,4);
 b=finishOfficialLiveTurn(b,5);
 assert.equal(b.sides.A.numeric.hand.at(-1).id,desired);
});
test('Pendolo: solo danno vero concede un ricambio dalla mano e non altera limiti numeriche',()=>{
 let b=equip(game(),'epic_item_6');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.epic.exchangeCredits,0);
 b=finishOfficialLiveTurn(b,2);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.A.epic.exchangeCredits,1);
 const before=b.sides.A.numeric.hand[0].id;
 b=finishOfficialLiveTurn(b,4);
 b=move(b,'A',{type:'epic-recycle',index:0},5);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.actionUsed.special,0);
 assert.equal(b.sides.A.epic.exchangeCredits,0);
 assert.equal(b.sides.A.numeric.hand.length,7);
 assert.equal(b.sides.A.numeric.hand.some(c=>c.id===before),false);
});
test('Monolite: non si consuma senza surriscaldamento; ripulisce il calore reale',()=>{
 let b=equip(game(),'epic_item_7');
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,'monolith_not_needed');
 b.sides.A.heated=true;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 assert.equal(b.sides.A.heated,false);
 assert.equal(b.sides.A.special.hand.length,4);
});
test('Calice: converte soltanto danni autentici in Sincronia e anteprima, senza accreditare wallet',()=>{
 let b=equip(game('C01'),'epic_item_8');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:2,target:'ship'},2); // 5♥ 10 HP
 assert.equal(b.sides.A.sync,22); // normale +20, Calice +2
 assert.equal(b.sides.A.epic.dustPreview,1);
 assert.ok(b.history.some(e=>e.kind==='epic_calice'));
});
