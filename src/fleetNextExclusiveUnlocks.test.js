import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_PROGRESSION_IDS,shipMaxLevel} from './fleetNext/progression.js';
import {EXCLUSIVE_STARTER_CARDS,EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {EXCLUSIVE_CARDS,EXCLUSIVE_UNLOCK_LEVELS,exclusiveUnlocked,
 exclusiveUnlockLevel,eligibleExclusives,effectiveDeck} from './fleetNext/rules.js';
import {createFleetNextBattle,effectUnavailableReason} from './fleetNext/combat.js';

const only=(shipId,level)=>eligibleExclusives(shipId,level).filter(c=>c.shipId===shipId&&
 Object.hasOwn(EXCLUSIVE_CARDS,c.id));
test('Ogni nave parte con quattro esclusive e sblocca le altre sei fino al proprio massimo',()=>{
 assert.equal(Object.keys(EXCLUSIVE_UNLOCK_LEVELS).length,170);
 for(const shipId of SHIP_PROGRESSION_IDS){
  const max=shipMaxLevel(shipId),milestones=EXCLUSIVE_UNLOCK_MILESTONES[shipId];
  const cards=Object.values(EXCLUSIVE_CARDS).filter(c=>c.shipId===shipId);
  assert.equal(cards.length,10,shipId);
  assert.equal(milestones.length,6,shipId);
  assert.equal(only(shipId,1).length,4,shipId);
  assert.equal(only(shipId,max).length,10,shipId);
  assert.equal(cards.filter(c=>c.minShipLevelDraft===1).length,4,shipId);
  assert.equal(cards.filter(c=>c.minShipLevelDraft===max).length>=1,true,shipId);
  assert.equal(cards.filter(c=>c.kind==='character'&&c.minShipLevelDraft===1).length,1,shipId);
  assert.deepEqual(cards.map(c=>c.minShipLevelDraft).sort((a,b)=>a-b),
   [1,1,1,1,...milestones].sort((a,b)=>a-b),shipId);
  for(let lvl=1;lvl<=max;lvl++){
   const actual=only(shipId,lvl),expected=4+milestones.filter(x=>x<=lvl).length;
   assert.equal(actual.length,expected,shipId+' L'+lvl);
   assert.equal(new Set(actual.map(c=>c.id)).size,expected,shipId);
   const deck=effectiveDeck([],shipId,lvl);
   assert.ok(actual.every(c=>deck.includes(c.id)),shipId+' L'+lvl);
  }
  for(const c of cards){
   assert.equal(c.minShipLevelDraft,exclusiveUnlockLevel(c.id),c.id);
   assert.equal(c.minShipLevelDraft,EXCLUSIVE_UNLOCK_LEVELS[c.id],c.id);
   assert.equal(exclusiveUnlocked(c.id,shipId,c.minShipLevelDraft),true,c.id);
   if(c.minShipLevelDraft>1)assert.equal(exclusiveUnlocked(c.id,shipId,c.minShipLevelDraft-1),false,c.id);
   assert.equal(exclusiveUnlocked(c.id,SHIP_PROGRESSION_IDS.find(id=>id!==shipId),max),false,c.id);
  }
  assert.equal(EXCLUSIVE_STARTER_CARDS[shipId].length,4,shipId);
 }
});

test('Le fusioni restano esclusiva di tre navi ai livelli originali',()=>{
 assert.equal(exclusiveUnlockLevel('nx-l01-10'),5);
 assert.equal(exclusiveUnlockLevel('nx-l03-08'),3);
 assert.equal(exclusiveUnlockLevel('nx-l04-05'),1);
 assert.equal(exclusiveUnlockLevel('prog-fusion-l01'),5);
 assert.equal(exclusiveUnlockLevel('prog-fusion-l03'),3);
 assert.equal(exclusiveUnlockLevel('prog-fusion-l04'),1);
 for(const shipId of SHIP_PROGRESSION_IDS.filter(id=>!['L01','L03','L04'].includes(id)))
  assert.ok(!Object.values(EXCLUSIVE_CARDS).some(c=>c.shipId===shipId&&c.effectSpec.type==='fusion'),shipId);
});

test('Le carte nuove non si possono giocare prima dello sblocco anche se forzate nella mano',()=>{
 const id='nx-n00-10',battle=createFleetNextBattle({shipA:'N00',levelA:19,
  shipB:'C03',levelB:17,deckA:[],deckB:[],seed:181});
 battle.sides.A.hand=[id];
 const reason=effectUnavailableReason(EXCLUSIVE_CARDS[id],battle.sides.A,battle);
 assert.match(reason,/Nave o componenti richiesti non disponibili/);
 const advanced=createFleetNextBattle({shipA:'N00',levelA:20,
  shipB:'C03',levelB:17,deckA:[],deckB:[],seed:181});
 assert.equal(effectUnavailableReason(EXCLUSIVE_CARDS[id],advanced.sides.A,advanced),'');
});
