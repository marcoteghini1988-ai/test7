import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateMathChain,inspectMathChain,mathChainText} from './mathChains.js';
import {prototypeModelSignatures,vitalSignatureLabel,primaryVitalMathGate} from './modelSignatures.js';
import {createMotherDefense,damageMotherShield,exposeMotherPart,hitMotherPart,matchesVitalSignature,VITAL_IDS} from './vitalDefense.js';
import {initialBattle,inspectCalculationCards,findThreeCardMoves,findMoves,
 consumeAttack,previewVolley} from './mathDuelEngine.js';

const ranks=values=>values.map((value,i)=>({id:'n'+i,value,suit:['♥','♦','♣','♠'][i%4]}));
const targets={plus:10,minus:3,times:12,divide:2};
const examples={
 plus:{pair:[4,6],triple:[2,3,5]},
 minus:{pair:[8,5],triple:[13,8,2]},
 times:{pair:[3,4],triple:[1,3,4]},
 divide:{pair:[8,4],triple:[12,3,2]}
};
const ops=Object.keys(targets);
test('28: 2 and 3 cards are separately evaluated against all four exact arithmetic targets',()=>{
 for(const op of ops){
  const {pair,triple}=examples[op];
  assert.equal(evaluateMathChain(op,pair,targets[op])?.result,targets[op],op+' pair');
  assert.equal(evaluateMathChain(op,triple,targets[op])?.result,targets[op],op+' triple');
  assert.equal(inspectCalculationCards(op,ranks(triple),targets[op]).valid,true,op+' game triple');
 }
});
test('28: mixed false calculations and fractional intermediate values are rejected',()=>{
 assert.equal(evaluateMathChain('plus',[1,2,3],100),null);
 assert.equal(evaluateMathChain('divide',[7,2,2],1),null);
 assert.equal(evaluateMathChain('minus',[2,8,9],-15),null);
 assert.equal(evaluateMathChain('times',[1,13,13,1],169),null);
 assert.equal(inspectMathChain('divide',[7,2,2],1).valid,false);
 assert.equal(inspectMathChain('plus',[1,2,3],100).reason,'target_mismatch');
});
test('28: invalid cards cannot be interpreted as a hidden special or joker',()=>{
 for(const values of [[],[1],[1,2,3,4],[0,2,3],[14,2,3],[1.5,2,3]])
  assert.equal(evaluateMathChain('plus',values,6),null);
 assert.equal(inspectCalculationCards('plus',[{value:4},{value:6}],10).valid,true);
 assert.equal(inspectCalculationCards('plus',[{value:4}],10).valid,false);
});
test('28: expression presents exact order chosen by the validator',()=>{
 const proof=evaluateMathChain('minus',[2,7,3],2);
 assert.equal(proof.valid,true);
 assert.equal(mathChainText(proof),'7 − 2 − 3 = 2');
});
test('28: valid pair results and legacy pair inspection are not redefined',()=>{
 assert.equal(inspectCalculationCards('plus',ranks([4,6]),10).valid,true);
 assert.equal(inspectCalculationCards('minus',ranks([5,8]),3).valid,true);
 assert.equal(inspectCalculationCards('divide',ranks([4,8]),2).valid,true);
 assert.equal(inspectCalculationCards('times',ranks([3,4]),12).valid,true);
});
test('28: mother signature map is complete, stable, restricted to available operations',()=>{
 const a=prototypeModelSignatures('C01',targets,ops);
 const b=prototypeModelSignatures('C01',targets,ops);
 assert.deepEqual(a,b);
 assert.deepEqual(Object.keys(a),VITAL_IDS);
 for(const id of VITAL_IDS){
  const gate=primaryVitalMathGate(a[id]);
  assert.equal(gate.kind,'mathGate');
  assert.equal(gate.target,targets[gate.op]);
  assert.deepEqual(gate.allowedCardCounts,[2,3]);
  assert.ok(vitalSignatureLabel(a[id]).includes('CARTE'));
 }
 const narrow=prototypeModelSignatures('C01',targets,['times']);
 assert.ok(VITAL_IDS.every(id=>primaryVitalMathGate(narrow[id]).op==='times'));
 assert.ok(VITAL_IDS.every(id=>prototypeModelSignatures('C01',targets,[])[id]===null));
});
test('28: two different mother models have different fixed prototype signatures',()=>{
 const a=prototypeModelSignatures('C01',targets,ops);
 const b=prototypeModelSignatures('C02',targets,ops);
 assert.notDeepEqual(a,b);
 assert.notEqual(primaryVitalMathGate(a.engine).op,primaryVitalMathGate(b.engine).op);
});
test('28: fixed prototype signature rejects the wrong operation, even with correct numbers',()=>{
 const signature={kind:'mathGate',op:'plus',target:10,allowedCardCounts:[2,3]};
 assert.equal(matchesVitalSignature(signature,ranks([4,6])),true);
 assert.equal(matchesVitalSignature(signature,ranks([2,3,5])),true);
 assert.equal(matchesVitalSignature(signature,ranks([3,4])),false);
 assert.equal(matchesVitalSignature({...signature,allowedCardCounts:[3]},ranks([4,6])),false);
});
test('28: exposed mother vital is damaged only by the fixed model signature, not a forged override',()=>{
 const signatures=prototypeModelSignatures('C01',targets,ops);
 const id='engine',signature=signatures[id];
 let d=createMotherDefense({shipId:'C01',shieldMax:100,signatures,partHp:25});
 d=exposeMotherPart(damageMotherShield(d,25).defense,id).defense;
 const wrong=hitMotherPart(d,id,10,ranks([4,6]),{kind:'math',op:'plus',target:10});
 if(signature.op!=='plus')assert.equal(wrong.reason,'wrong_combination');
 const valid=hitMotherPart(d,id,10,ranks(examples[signature.op].pair));
 assert.equal(valid.damage,10);
 assert.equal(valid.defense.parts[id].hp,15);
 const triple=hitMotherPart(d,id,10,ranks(examples[signature.op].triple));
 assert.equal(triple.damage,10);
});
test('28: poker signatures remain separately recognized and never auto-applied',()=>{
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'pair'},ranks([7,7])),true);
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'trips'},ranks([7,7,7])),true);
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'fullHouse'},ranks([7,7,7,9,9])),true);
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'fullHouse'},ranks([7,7,9])),false);
 const profiles=prototypeModelSignatures('R01',targets,ops);
 assert.equal(profiles.weapons.kind,'any');
 assert.equal(profiles.weapons.options.some(opt=>opt.kind==='poker'&&opt.pattern==='pair'),true);
});
test('28: live battle creates signatures once for all 4 vital targets on both sides',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['C01'],shipLevel:5},()=>.5);
 for(const side of [b.player,b.enemy]){
  const d=side.fleet[0].defense;
  for(const id of VITAL_IDS){
   const gate=primaryVitalMathGate(d.parts[id].signature);
   assert.equal(gate.kind,'mathGate');
   assert.equal(gate.target,b.targets[gate.op]);
  }
 }
});
test('28: a three-card salvo routes ammunition once per numeric card',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['C01'],shipLevel:5},()=>.5);
 const input=ranks([2,3,5]);
 const route=previewVolley(b.player,input,'auto',{targetKind:'motherShield'});
 assert.equal(route.routing.length,3);
 assert.equal(route.routing.reduce((n,r)=>n+r.value,0),10);
 const next=consumeAttack({...b.player,hand:input.concat(b.player.hand.slice(3))},[0,1,2]);
 assert.equal(next.hand.length,7);
 assert.equal(next.discard.length,b.player.discard.length+3);
});
test('28: AI can discover chained solutions that a two-card search misses',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},()=>.5);
 const side={...b.enemy,hand:ranks([1,2,4,9,11,12,13])};
 const all={...b.targets,plus:7};
 assert.equal(findMoves(side,b.player,all).some(m=>m.op==='plus'),false);
 const matches=findThreeCardMoves(side,b.player,all).filter(m=>m.op==='plus');
 assert.ok(matches.length>0);
 for(const move of matches)assert.equal(inspectCalculationCards('plus',move.indices.map(i=>side.hand[i]),7).valid,true);
});
test('28: three-card gate cannot be satisfied by a different poker hand',()=>{
 const math={kind:'mathGate',op:'plus',target:10,allowedCardCounts:[3]};
 assert.equal(matchesVitalSignature(math,ranks([4,6])),false);
 assert.equal(matchesVitalSignature(math,ranks([2,3,5])),true);
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'trips'},ranks([2,3,5])),false);
});

test('28: rare ship has an optional poker pair signature without removing arithmetic',()=>{
 const signatures=prototypeModelSignatures('C01',targets,ops);
 const sig=signatures.weapons;
 assert.equal(sig.kind,'any');
 assert.equal(matchesVitalSignature(sig,ranks([7,7])),true);
 assert.equal(matchesVitalSignature(sig,ranks(examples[primaryVitalMathGate(sig).op].pair)),true);
 let d=createMotherDefense({shipId:'C01',signatures,shieldMax:100,partHp:25});
 d=exposeMotherPart(damageMotherShield(d,25).defense,'weapons').defense;
 const hit=hitMotherPart(d,'weapons',7,ranks([7,7]));
 assert.equal(hit.damage,7);
 assert.equal(hit.defense.parts.weapons.hp,18);
 const wrong=hitMotherPart(d,'weapons',7,ranks([2,9]));
 assert.equal(wrong.damage,0);
});
test('28: epic/legendary command vital accepts optional tris while math remains valid',()=>{
 for(const modelId of ['E01','L01']){
  const signature=prototypeModelSignatures(modelId,targets,ops).command;
  assert.equal(signature.kind,'any');
  assert.equal(matchesVitalSignature(signature,ranks([7,7,7])),true);
  const gate=primaryVitalMathGate(signature);
  assert.equal(matchesVitalSignature(signature,ranks(examples[gate.op].triple)),true);
 }
});
test('28: starter mother never requires a poker combination to finish',()=>{
 const signatures=prototypeModelSignatures('N00',targets,ops);
 for(const id of VITAL_IDS)assert.equal(signatures[id].kind,'mathGate');
});
