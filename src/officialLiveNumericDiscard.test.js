import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn,
 chooseOfficialLiveAiAction,LIVE_NUMERIC_LIMIT} from './officialLiveDuelEngine.js';
import {exposeMotherPart,VITAL_IDS} from './vitalDefense.js';
const create=(mode='campaign')=>createOfficialLiveDuel(createTacticalDuel({
 shipA:'R04',shipB:'C03',levelA:4,levelB:1,mode,nowMs:0
}),0);
const cards=(b,k)=>[
 ...b.sides[k].numeric.hand,...b.sides[k].numeric.deck,
 ...b.sides[k].numeric.discard,
 ...VITAL_IDS.flatMap(id=>b.vitalBuilds[k][id])
];
const discard=(b,key,index,time)=>{
 const r=applyOfficialLiveAction(b,key,{type:'numeric-discard',index},time);
 assert.equal(r.ok,true,r.reason);
 return r.battle;
};
test('Cestino: usa una delle tre numeriche, scarta una carta fisica e non pesca immediatamente',()=>{
 let b=create();
 const before=cards(b,'A').map(c=>c.id).sort();
 const removed=b.sides.A.numeric.hand[2];
 b=discard(b,'A',2,1);
 assert.equal(b.actionUsed.numeric,1);
 assert.equal(b.actionUsed.special,0);
 assert.equal(b.sides.A.numeric.hand.length,6);
 assert.equal(b.sides.A.numeric.discard.some(c=>c.id===removed.id),true);
 assert.equal(b.history.at(-1).kind,'numeric_discard');
 assert.equal(b.history.some(e=>e.kind==='shot'),false);
 assert.equal(b.sides.B.defense.shield.hp,60);
 assert.equal(b.sides.B.defense.parts.engine.hp,10);
 assert.deepEqual(cards(b,'A').map(c=>c.id).sort(),before);
 b=finishOfficialLiveTurn(b,2);
 b=finishOfficialLiveTurn(b,3);
 assert.equal(b.activeSide,'A');
 assert.equal(b.sides.A.numeric.hand.length,7,
  'la mano si ricostituisce solo all inizio del prossimo turno');
 assert.equal(new Set(cards(b,'A').map(c=>c.id)).size,52);
});
test('Cestino: massimo tre scarti, nessun quarto, nessuna selezione inventata',()=>{
 let b=create();
 assert.equal(applyOfficialLiveAction(b,'A',
  {type:'numeric-discard',index:-1},1).reason,'numeric_not_in_hand');
 assert.equal(applyOfficialLiveAction(b,'A',
  {type:'numeric-discard',index:7},1).reason,'numeric_not_in_hand');
 assert.equal(applyOfficialLiveAction(b,'A',
  {type:'numeric-discard',index:0.5},1).reason,'numeric_not_in_hand');
 for(let n=1;n<=LIVE_NUMERIC_LIMIT;n++)b=discard(b,'A',0,n);
 assert.equal(b.actionUsed.numeric,3);
 assert.equal(b.sides.A.numeric.hand.length,4);
 assert.equal(applyOfficialLiveAction(b,'A',
  {type:'numeric-discard',index:0},10).reason,'numeric_turn_limit');
 assert.equal(applyOfficialLiveAction(b,'A',
  {type:'numeric',index:0,target:'ship'},11).reason,'numeric_turn_limit');
 assert.equal(cards(b,'A').length,52);
});
test('IA Gaia: settima mano bloccata, un vitale mancante e partner nel deck -> scarta, non passa per sempre',()=>{
 let b=create();
 b.sides.B.defense.shield.hp=0;
 for(const id of ['engine','shieldGenerator','command'])
  b.sides.B.defense.parts[id].hp=0;
 const open=exposeMotherPart(b.sides.B.defense,'weapons');
 assert.equal(open.exposed,true);b.sides.B.defense=open.defense;
 b.sides.B.defense.parts.weapons.signature={
  kind:'mathGate',op:'plus',target:9,allowedCardCounts:[2,3]};
 const pile=b.sides.A.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const stored=all.find(c=>c.value===5&&c.suit==='♠');
 assert.ok(stored);
 const hand=all.filter(c=>c.id!==stored.id&&
  (c.suit==='♥'||c.suit==='♠')&&c.value!==4).slice(0,7);
 assert.equal(hand.length,7);
 const ids=new Set([stored.id,...hand.map(c=>c.id)]);
 pile.hand=hand;pile.deck=all.filter(c=>!ids.has(c.id));pile.discard=[];
 b.vitalBuilds.A.weapons=[stored];
 const partner=pile.deck.find(c=>c.value===4);
 assert.ok(partner,'la soluzione vera resta nel mazzo');
 assert.equal(cards(b,'A').length,52);
 b.actionUsed.special=2;
 const choice=chooseOfficialLiveAiAction(b,'A');
 assert.deepEqual(choice,{type:'numeric-discard',index:0});
 b=discard(b,'A',choice.index,1);
 assert.equal(b.vitalBuilds.A.weapons.length,1,'non elimina la firma già iniziata');
 assert.equal(b.actionUsed.numeric,1);
 assert.equal(b.sides.A.numeric.hand.length,6);
 assert.equal(cards(b,'A').length,52);
 assert.equal(new Set(cards(b,'A').map(c=>c.id)).size,52);
 b=finishOfficialLiveTurn(b,2);
 b=finishOfficialLiveTurn(b,3);
 assert.equal(b.sides.A.numeric.hand.length,7);
});
test('Il cestino funziona anche in PvP LOCALE simulato, senza alcun online',()=>{
 const b=create('pvp');
 const r=applyOfficialLiveAction(b,'A',{type:'numeric-discard',index:0},1);
 assert.equal(r.ok,true);
 assert.equal(r.battle.mode,'pvp');
 assert.equal(r.battle.actionUsed.numeric,1);
 assert.equal(r.battle.history.some(e=>e.kind==='shot'),false);
});
