import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_PROGRESSION_IDS,shipMaxLevel} from './fleetNext/progression.js';
import {VARIANT_EXCLUSIVE_CARDS,VARIANT_EXCLUSIVE_IDS} from './fleetNext/variantExclusives.js';
import {EXCLUSIVE_CARDS,exclusiveUnlocked,effectiveDeck,card} from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {exclusiveRarityAtLevel,exclusiveRarityMilestones} from './fleetNext/exclusiveEvolution.js';
import {createFleetSide} from './fleetNext/combat.js';

test('170 esclusive reali: 10 per ognuna delle 17 famiglie, comprese cinque varianti complete',()=>{
 assert.equal(SHIP_PROGRESSION_IDS.length,17);
 assert.equal(Object.keys(EXCLUSIVE_CARDS).length,170);
 assert.equal(Object.keys(VARIANT_EXCLUSIVE_CARDS).length,45);
 assert.deepEqual([...VARIANT_EXCLUSIVE_IDS].sort(),['C04','R03','E03','E04','L02'].sort());
 for(const shipId of SHIP_PROGRESSION_IDS){
  const cards=Object.values(EXCLUSIVE_CARDS).filter(def=>def.shipId===shipId);
  assert.equal(cards.length,10,shipId);
  assert.equal(cards.filter(c=>c.kind==='character').length,1,shipId);
  assert.equal(cards.filter(c=>c.playable===false).length,0,shipId);
  assert.ok(cards.every(c=>exclusiveUnlocked(c.id,shipId,shipMaxLevel(shipId))),shipId);
  assert.ok(cards.every(c=>!c.effectSpec||!validateEffectSpec(c.effectSpec)),shipId);
  const actual=effectiveDeck([],shipId,shipMaxLevel(shipId));
  assert.ok(cards.every(c=>actual.includes(c.id)),shipId+' non ha le carte nel mazzo');
  const side=createFleetSide(shipId,shipMaxLevel(shipId),[],19);
  assert.equal(side.ships[0].id,shipId);
  assert.equal(side.escorts.length,2);
 }
});

test('45 varianti: ID nuovi, effetti giocabili e descrizioni coincidenti col motore',()=>{
 for(const c of Object.values(VARIANT_EXCLUSIVE_CARDS)){
  assert.match(c.id,/^nx-(c04|r03|e03|e04|l02)-(0[2-9]|10)$/);
  assert.equal(card(c.id)?.id,c.id);
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(describeEffect(c),c.effectProposed,c.id);
  assert.equal(c.nativeFace,true);
  assert.equal(c.playable,true);
  assert.notEqual(c.effectSpec.type,'blueprint',c.id);
  assert.notEqual(c.effectSpec.type,'fusion',c.id);
  assert.equal(exclusiveUnlocked(c.id,'N00',20),false,c.id);
 }
});

test('La rarità evolve automaticamente in quattro stadi fino al massimo di ogni madre',()=>{
 assert.deepEqual(exclusiveRarityMilestones('N00').map(x=>x.minLevel),[1,6,11,16]);
 assert.deepEqual(exclusiveRarityMilestones('L04').map(x=>x.minLevel),[1,3,4,5]);
 for(const shipId of SHIP_PROGRESSION_IDS){
  const c=Object.values(EXCLUSIVE_CARDS).find(def=>def.shipId===shipId);
  const max=shipMaxLevel(shipId);
  assert.equal(exclusiveRarityAtLevel(c,1),'Comune',shipId);
  assert.equal(exclusiveRarityAtLevel(c,max),'Leggendaria',shipId);
  const seen=new Set(Array.from({length:max},(_,i)=>exclusiveRarityAtLevel(c,i+1)));
  assert.deepEqual([...seen],['Comune','Rara','Epica','Leggendaria'],shipId);
  assert.equal(exclusiveRarityAtLevel(c,max+100),'Leggendaria',shipId);
 }
});
