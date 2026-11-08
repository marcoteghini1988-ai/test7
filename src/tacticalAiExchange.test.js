// Ricambio intelligente senza precognizione del mazzo o firme nascoste.
import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseTacticalAiExchangeIndex} from './tacticalAiExchange.js';
import {tacticalShipSignatures} from './tacticalShipSignatures.js';
import {createTacticalDuel,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {damageMotherShield,exposeMotherPart} from './vitalDefense.js';
import {planTacticalAi} from './tacticalDuelAi.js';

const card=(value,suit='♣')=>({id:suit+value,value,suit});
const hand=[3,1,2,4,6,7,8].map((n,i)=>card(n,['♣','♦','♥','♠'][i%4]));
test('Lo scarto conserva una numerica che puo completare una coppia con un futuro pescato',()=>{
 const visible=[{signature:tacticalShipSignatures('E03').engine,hp:10}];
 assert.equal(chooseTacticalAiExchangeIndex(hand,visible,0),1,
  'tiene il 3 utile per 3×5=15, scarta il primo valore senza prospettive');
 assert.equal(chooseTacticalAiExchangeIndex(hand,[],0),0,'firma ignota: rotazione originale');
 assert.equal(chooseTacticalAiExchangeIndex(hand,[{signature:null,hp:10}],3),3,
  'nessun potere di conoscere firme coperte');
 assert.equal(chooseTacticalAiExchangeIndex([],visible,0),0);
});
test('IA con vera mano da 52 carte non butta una 3 utile sul bersaglio engine E03 esposto',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'E03',seed:18,nowMs:100});
 const oldPile=b.sides.A.numeric;
 const all=[...oldPile.hand,...oldPile.deck];
 const wanted=[3,1,2,4,6,7,8],selected=[];
 for(const value of wanted){
  const c=all.find(card=>card.value===value&&!selected.some(x=>x.id===card.id));
  assert.ok(c);
  selected.push(c);
 }
 const retained=new Set(selected.map(c=>c.id));
 oldPile.hand=selected;
 oldPile.deck=all.filter(c=>!retained.has(c.id));
 const enemy=b.sides.B;
 enemy.defense=damageMotherShield(enemy.defense,enemy.defense.shield.hp).defense;
 enemy.defense=exposeMotherPart(enemy.defense,'engine').defense;
 assert.equal(enemy.defense.parts.engine.exposed,true);
 const order=planTacticalAi(b,'A');
 assert.equal(order.numericIndices.length,0,'nessuna formula pronta con la mano scelta');
 assert.ok(order.exchangeIndices.length>=1);
 assert.notEqual(order.exchangeIndices[0],0,'il 3 ha una possibile coppia, da non buttare');
 assert.equal(validateTacticalOrder(b,'A',order).ok,true);
 assert.equal([...oldPile.hand,...oldPile.deck].length,52,'nessuna numerica nuova');
});
