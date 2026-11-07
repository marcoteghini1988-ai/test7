import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16D_BOSS_PROFILES} from './newCombat/phase16DBosses.js';
import {TACTICAL_STARTER_TYPES,validateTacticalLoadout,createTacticalDuel,sealTacticalOrder} from './simultaneousDuelEngine.js';
import {TACTICAL_PRESETS,TACTICAL_BOSS_PLANS,tacticalBossProfile,buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {planTacticalDemoAi} from './tacticalDuelDemoAi.js';

test('Tutti i preset del giocatore hanno 24 carte, 5 in mano e max 6 copie per tipo',()=>{
 assert.equal(TACTICAL_STARTER_TYPES.length,24);
 assert.equal(Object.keys(TACTICAL_PRESETS).length,5);
 for(const [name,preset] of Object.entries(TACTICAL_PRESETS)){
  assert.ok(validateTacticalLoadout(preset.types),name);
  const game=createTacticalDuel({specialDeckA:preset.types});
  assert.equal(game.sides.A.special.hand.length,5);
  assert.equal(game.sides.A.special.deck.length,19);
  assert.equal(game.sides.A.special.hand.length+game.sides.A.special.deck.length,24);
 }
});
test('I 12 boss storici hanno identita e mazzi 24/5/6 distinti e compatibili L1,L3,L5',()=>{
 const ids=Object.keys(PHASE16D_BOSS_PROFILES);
 assert.equal(ids.length,12);
 assert.equal(Object.keys(TACTICAL_BOSS_PLANS).length,12);
 const identities=new Set();
 for(const id of ids){
  const p=tacticalBossProfile(id);
  assert.ok(p?.name&&p?.style&&p?.ability);
  identities.add(p.style);
  for(const level of [1,3,5])for(const enemyLevel of [1,3,5]){
   const deck=buildTacticalBossDeck(id,level,enemyLevel);
   assert.ok(validateTacticalLoadout(deck),id+' L'+level);
   assert.ok(deck.filter(type=>type==='tactic-scan').length>=4,id+' deve poter scoprire le firme');
   if(level<3)assert.ok(deck.every(t=>!['fusion-barrier','fusion-strike','fusion-twin','fusion-triad','tactical-cover','support-escort-repair'].includes(t)),id);
   if(level<5)assert.ok(deck.every(t=>!['fusion-twin','fusion-triad'].includes(t)),id);
   if(enemyLevel<3)assert.ok(deck.every(t=>!['tactic-suppress','shot-piercing'].includes(t)),id);
   const game=createTacticalDuel({shipB:'L03',levelB:level,shipA:'C01',levelA:enemyLevel,specialDeckB:deck,bossPlanetB:Number(id)});
   assert.equal(game.sides.B.bossPlanetId,Number(id));
   assert.equal(game.sides.B.special.hand.length,5);
   assert.equal(game.sides.B.special.deck.length,19);
   assert.deepEqual([...game.sides.B.special.hand,...game.sides.B.special.deck].map(c=>c.type).sort(),[...deck].sort());
   const action=planTacticalDemoAi(game,'B');
   assert.equal(sealTacticalOrder(game,'B',action,1).ok,true,'IA '+id+' L'+level);
  }
 }
 assert.equal(identities.size,12);
});
test('Il boss senza scansione non legge le firme dei vitali ancora protetti',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'L03',levelB:5,
  specialDeckB:buildTacticalBossDeck(2,5,3),bossPlanetB:2});
 const original=planTacticalDemoAi(b,'B');
 const manipulated=structuredClone(b);
 manipulated.sides.A.defense.parts.shieldGenerator.signature={kind:'mathGate',op:'times',target:6,allowedCardCounts:[2,3]};
 manipulated.sides.A.defense.parts.weapons.signature={kind:'poker',pattern:'pair'};
 manipulated.orders.A={specialIndices:[],numericIndices:[0,1],op:'times',vitalId:'engine'};
 manipulated.sides.A.numeric.hand.reverse();
 assert.deepEqual(planTacticalDemoAi(manipulated,'B'),original);
});
test('Le tipologie non compatibili o con copie eccessive vengono respinte',()=>{
 const invalid=Array(24).fill('fusion-triad');
 assert.equal(validateTacticalLoadout(invalid),false);
 assert.equal(validateTacticalLoadout(Array(24).fill('invalid')),false);
 assert.equal(validateTacticalLoadout(['fusion-barrier']),false);
 assert.throws(()=>buildTacticalBossDeck(99,5,5));
 assert.throws(()=>createTacticalDuel({specialDeckA:invalid}));
});

test('Ogni boss prepara una scansione reale prima di usare firme ancora nascoste',()=>{
 const deck=buildTacticalBossDeck(2,5,3);
 const b=createTacticalDuel({specialDeckB:deck,bossPlanetB:2,shipB:'L03',levelB:5});
 const p=b.sides.B.special;
 let at=p.hand.findIndex(c=>c.type==='tactic-scan');
 if(at<0){
  const deckIndex=p.deck.findIndex(c=>c.type==='tactic-scan');
  assert.ok(deckIndex>=0);
  [p.hand[0],p.deck[deckIndex]]=[p.deck[deckIndex],p.hand[0]];
  at=0;
 }
 const action=planTacticalDemoAi(b,'B');
 assert.ok(action.specialIndices.includes(at));
 assert.equal(action.numericIndices.length,0,'non legge combinazioni di vitali segreti');
 assert.equal(sealTacticalOrder(b,'B',action,1).ok,true);
});
