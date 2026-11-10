import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn,
 LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT} from './officialLiveDuelEngine.js';
import {exposeMotherPart} from './vitalDefense.js';
import {tacticalShipSignatures,tacticalSignatureSlotCount} from './tacticalShipSignatures.js';

function prepare(shipId,combo){
 const b=createOfficialLiveDuel(createTacticalDuel({shipA:'N00',shipB:shipId,
  levelA:1,levelB:1,nowMs:0}),0);
 const pile=b.sides.A.numeric,source=[...pile.hand,...pile.deck,...pile.discard];
 const chosen=combo.map(({value,suit})=>{
  const c=source.find(x=>x.value===value&&x.suit===suit);
  assert.ok(c,'numerica fisica presente '+value+suit);
  return c;
 });
 const ids=new Set(chosen.map(c=>c.id));
 assert.equal(ids.size,combo.length);
 pile.hand=[...chosen,...source.filter(c=>!ids.has(c.id)).slice(0,7-chosen.length)];
 const inHand=new Set(pile.hand.map(c=>c.id));
 pile.deck=source.filter(c=>!inHand.has(c.id));pile.discard=[];
 b.sides.B.defense.shield.hp=45;
 const exposed=exposeMotherPart(b.sides.B.defense,'command');
 assert.equal(exposed.exposed,true);
 b.sides.B.defense=exposed.defense;
 return b;
}
function insert(b,cards,fromTime){
 for(const {value,suit} of cards){
  const index=b.sides.A.numeric.hand.findIndex(c=>c.value===value&&c.suit===suit);
  assert.ok(index>=0,'manca numerica vera '+value+suit);
  const result=applyOfficialLiveAction(b,'A',
   {type:'numeric',target:'vital',vitalId:'command',index},fromTime++);
  assert.equal(result.ok,true,result.reason);
  b=result.battle;
 }
 return b;
}
function nextA(b,nowMs){
 b=finishOfficialLiveTurn(b,nowMs);
 b=finishOfficialLiveTurn(b,nowMs+1);
 assert.equal(b.activeSide,'A');
 return b;
}
test('Leggendaria L04: Scala Reale alternativa in 5 slot e in 2 turni 3+2',()=>{
 const combo=[{value:1,suit:'♠'},{value:10,suit:'♠'},{value:11,suit:'♠'},
  {value:12,suit:'♠'},{value:13,suit:'♠'}];
 let b=prepare('L04',combo);
 assert.equal(tacticalSignatureSlotCount(tacticalShipSignatures('L04').command),5);
 b=insert(b,combo.slice(0,3),1);
 assert.equal(b.actionUsed.numeric,LIVE_NUMERIC_LIMIT);
 assert.equal(b.sides.B.defense.parts.command.hp,10);
 assert.equal(b.vitalBuilds.A.command.length,3);
 assert.equal(b.history.filter(x=>x.kind==='vital_destroyed').length,0);
 b=nextA(b,5);
 b=insert(b,combo.slice(3),7);
 assert.equal(b.sides.B.defense.parts.command.hp,0);
 assert.equal(b.vitalBuilds.A.command.length,0);
 assert.equal(b.actionUsed.numeric,2);
 assert.equal(b.actionUsed.special,0);
 assert.equal(b.sides.B.defense.shield.hp,45);
 assert.ok(b.history.some(x=>x.kind==='vital_destroyed'&&x.op==='royalFlush'));
 const ids=[...b.sides.A.numeric.hand,...b.sides.A.numeric.deck,
  ...b.sides.A.numeric.discard].map(c=>c.id);
 assert.equal(new Set(ids).size,52);
 assert.equal(ids.length,52);
});
test('Epica E01: Doppia Coppia in quattro carte reali e 2 turni',()=>{
 const combo=[{value:7,suit:'♥'},{value:7,suit:'♠'},
  {value:3,suit:'♦'},{value:3,suit:'♣'}];
 let b=prepare('E01',combo);
 b=insert(b,combo.slice(0,3),1);
 assert.equal(b.sides.B.defense.parts.command.hp,10);
 b=nextA(b,5);
 b=insert(b,combo.slice(3),7);
 assert.equal(b.sides.B.defense.parts.command.hp,0);
 assert.ok(b.history.some(x=>x.kind==='vital_destroyed'&&x.op==='twoPair'));
 assert.equal(b.actionUsed.numeric,1);
 assert.equal(b.actionUsed.special,0);
 assert.equal(LIVE_SPECIAL_LIMIT,2);
});
test('Ogni alternativa Poker lunga preserva il percorso matematico e i 5 slot non sono obbligatori',()=>{
 for(const id of ['E01','E02','E03','E04','L01','L02','L03','L04']){
  const signature=tacticalShipSignatures(id).command;
  assert.equal(signature.kind,'any');
  assert.equal(signature.options[0].kind,'mathGate');
  assert.equal(signature.options[0].allowedCardCounts.includes(2),true);
  assert.ok(signature.options.some(o=>o.kind==='poker'&&
   tacticalSignatureSlotCount(o)>=4));
 }
});
