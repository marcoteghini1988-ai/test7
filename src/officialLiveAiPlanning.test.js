import test from 'node:test';
import assert from 'node:assert/strict';
import {findOfficialLiveVitalCompletion,findOfficialLiveVitalProgress} from './officialLiveAiPlanning.js';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,chooseOfficialLiveAiAction,
 finishOfficialLiveTurn} from './officialLiveDuelEngine.js';
import {exposeMotherPart} from './vitalDefense.js';

const M={kind:'mathGate',op:'times',target:12,allowedCardCounts:[2,3]};
const P={kind:'poker',pattern:'fourKind'};
const sample=[
 {value:1,suit:'♣'}, {value:3,suit:'♥'}, {value:4,suit:'♦'},
 {value:7,suit:'♠'}, {value:9,suit:'♦'}, {value:11,suit:'♥'}, {value:13,suit:'♣'}
];
test('Pianificatore trova una soluzione matematica vera prima di depositare carte',()=>{
 assert.deepEqual(findOfficialLiveVitalCompletion(M,[],sample),[1,2]);
 assert.deepEqual(findOfficialLiveVitalCompletion(M,[sample[1]],sample.slice(2)),[0]);
 assert.equal(findOfficialLiveVitalCompletion(M,[],sample.filter(x=>![3,4].includes(x.value))),null);
});
test('Pianificatore trova un poker di quattro carte anche se richiede più turni',()=>{
 const hand=[{value:1,suit:'♣'},{value:4,suit:'♥'}, {value:7,suit:'♠'},
  {value:4,suit:'♠'},{value:4,suit:'♦'},{value:4,suit:'♣'},{value:13,suit:'♦'}];
 assert.deepEqual(findOfficialLiveVitalCompletion(P,[],hand),[1,3,4,5]);
 assert.deepEqual(findOfficialLiveVitalCompletion(P,
  [hand[1],hand[3],hand[4]],hand.slice(5)),[0]);
});
function setup(hand){
 const b=createOfficialLiveDuel(createTacticalDuel({shipA:'C01',shipB:'N00',
  levelA:1,levelB:1,nowMs:0}),0);
 b.turn=2;b.round=1;b.activeSide='B';
 b.sides.A.defense.shield.hp=45;
 const exposed=exposeMotherPart(b.sides.A.defense,'engine');
 assert.equal(exposed.exposed,true);
 b.sides.A.defense=exposed.defense;
 const pile=b.sides.B.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const picked=hand.map(({value,suit})=>{
  const card=all.find(x=>x.value===value&&x.suit===suit);
  assert.ok(card,'Carta numerica prelevata dal mazzo reale '+value+suit);
  return card;
 });
 const ids=new Set(picked.map(x=>x.id));
 assert.equal(ids.size,7);
 pile.hand=picked;pile.deck=all.filter(x=>!ids.has(x.id));pile.discard=[];
 return b;
}
function applyAi(b,t){
 const action=chooseOfficialLiveAiAction(b);
 const applied=applyOfficialLiveAction(b,'B',action,t);
 assert.equal(applied.ok,true,JSON.stringify({action,reason:applied.reason}));
 return {battle:applied.battle,action};
}
test('IA completa la formula motore di C01 con due carte autentiche, non spara a caso',()=>{
 let b=setup(sample);
 const one=applyAi(b,1);b=one.battle;
 assert.deepEqual({target:one.action.target,index:one.action.index,vitalId:one.action.vitalId},
  {target:'vital',index:1,vitalId:'engine'});
 const two=applyAi(b,2);b=two.battle;
 assert.equal(two.action.target,'vital');
 assert.equal(b.sides.A.defense.parts.engine.hp,0);
 assert.equal(b.history.some(e=>e.kind==='vital_destroyed'),true);
 assert.equal(b.actionUsed.numeric,2);
 assert.equal(b.sides.B.numeric.hand.length,5);
});
test('IA completa combinazione a quattro carte in due turni da 30s, senza sforare il 3+2',()=>{
 const hand=[{value:1,suit:'♣'},{value:4,suit:'♥'},{value:7,suit:'♠'},
  {value:4,suit:'♠'},{value:4,suit:'♦'},{value:4,suit:'♣'},{value:13,suit:'♦'}];
 let b=setup(hand);b.sides.A.defense.parts.engine.signature=P;
 for(let i=0;i<3;i++){
  const result=applyAi(b,1+i);b=result.battle;
  assert.equal(result.action.target,'vital');
 }
 assert.equal(b.vitalBuilds.B.engine.length,3);
 assert.equal(b.sides.A.defense.parts.engine.hp,10);
 assert.equal(b.actionUsed.numeric,3);
 b=finishOfficialLiveTurn(b,4);
 b=finishOfficialLiveTurn(b,5);
 assert.equal(b.activeSide,'B');
 const final=applyAi(b,6);
 assert.equal(final.action.target,'vital');
 assert.equal(final.battle.sides.A.defense.parts.engine.hp,0);
 assert.equal(final.battle.actionUsed.numeric,1);
 assert.equal(final.battle.vitalBuilds.B.engine.length,0);
});
test('IA non riempie uno slot senza soluzione: usa un proiettile compatibile',()=>{
 const b=setup([{value:1,suit:'♣'}, {value:5,suit:'♥'}, {value:7,suit:'♠'},
  {value:8,suit:'♣'}, {value:9,suit:'♦'}, {value:11,suit:'♥'}, {value:13,suit:'♣'}]);
 const action=chooseOfficialLiveAiAction(b);
 assert.equal(action.target,'ship');
 assert.equal(action.shipId,'mother');
 assert.equal(b.vitalBuilds.B.engine.length,0);
});

test('IA Poker lungo: solo una carta fisica che può essere completata dal proprio mazzo',()=>{
 const cards=[{value:4,suit:'♥'},{value:4,suit:'♣'},{value:4,suit:'♠'},
  {value:7,suit:'♦'},{value:9,suit:'♥'}];
 const stock=[{value:4,suit:'♦'}];
 const next=findOfficialLiveVitalProgress(P,[],cards,stock);
 assert.ok([0,1,2].includes(next));
 assert.equal(findOfficialLiveVitalProgress(P,[cards[0],cards[1]],cards.slice(2),stock),0);
 assert.equal(findOfficialLiveVitalProgress(P,[],cards.slice(0,3),[]),null,
  'non inventa la quarta carta che non esiste nel proprio mazzo');
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'pair'},[],cards,stock),null,
  'il pianificatore parziale vale soltanto per Poker 4–5');
});
test('IA Poker lungo: supporta Full, Doppia Coppia, Scala, Colore e Scala Reale',()=>{
 const c=(value,suit)=>({value,suit});
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'fullHouse'},
  [c(7,'♥'),c(7,'♠')],[c(7,'♣'),c(3,'♦')],[c(3,'♥')]),0);
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'twoPair'},
  [c(7,'♥')],[c(7,'♠'),c(3,'♦')],[c(3,'♥')]),0);
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'straight'},
  [c(1,'♥'),c(2,'♠'),c(3,'♦')],[c(4,'♣')],[c(5,'♦')]),0);
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'flush'},
  [c(1,'♥'),c(2,'♥')],[c(7,'♥')],[c(9,'♥'),c(13,'♥')]),0);
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'royalFlush'},
  [c(1,'♠'),c(10,'♠')],[c(11,'♠')],[c(12,'♠'),c(13,'♠')]),0);
 assert.equal(findOfficialLiveVitalProgress({kind:'poker',pattern:'straightFlush'},
  [c(2,'♥'),c(3,'♥')],[c(4,'♥')],[c(5,'♥'),c(6,'♥')]),0);
});
test('IA Poker 4 carte: deposita 3 numeriche nei primi 30 secondi, pesca la quarta nel turno seguente',()=>{
 let b=setup([{value:4,suit:'♥'},{value:4,suit:'♠'},{value:4,suit:'♣'},
  {value:1,suit:'♣'},{value:7,suit:'♠'},{value:9,suit:'♦'},{value:13,suit:'♣'}]);
 b.sides.A.defense.parts.engine.signature=P;
 const pile=b.sides.B.numeric;
 const missing=pile.deck.find(c=>c.value===4&&c.suit==='♦');
 assert.ok(missing);
 pile.deck=[missing,...pile.deck.filter(c=>c.id!==missing.id)];
 assert.equal(findOfficialLiveVitalCompletion(P,[],pile.hand),null,
  'la mano non contiene ancora la combinazione completa');
 for(let i=0;i<3;i++){
  const action=chooseOfficialLiveAiAction(b);
  assert.equal(action.type,'numeric');
  assert.equal(action.target,'vital');
  assert.equal(action.vitalId,'engine');
  assert.equal(b.sides.B.numeric.hand[action.index].value,4);
  const result=applyOfficialLiveAction(b,'B',action,i+1);
  assert.equal(result.ok,true,result.reason);
  b=result.battle;
 }
 assert.equal(b.vitalBuilds.B.engine.length,3);
 assert.equal(b.actionUsed.numeric,3);
 assert.equal(b.sides.A.defense.parts.engine.hp,10);
 b=finishOfficialLiveTurn(b,4);
 b=finishOfficialLiveTurn(b,5);
 assert.equal(b.activeSide,'B');
 assert.equal(b.sides.B.numeric.hand.some(c=>c.id===missing.id),true);
 const final=chooseOfficialLiveAiAction(b);
 assert.equal(final.type,'numeric');
 assert.equal(final.target,'vital');
 assert.equal(b.sides.B.numeric.hand[final.index].id,missing.id);
 const done=applyOfficialLiveAction(b,'B',final,6);
 assert.equal(done.ok,true,done.reason);
 assert.equal(done.battle.sides.A.defense.parts.engine.hp,0);
 assert.equal(done.battle.actionUsed.numeric,1);
 assert.equal(done.battle.vitalBuilds.B.engine.length,0);
});
