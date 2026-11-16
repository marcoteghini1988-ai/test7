import test from 'node:test';
import assert from 'node:assert/strict';
import {REDESIGN_CARD_SPECS,RETIRED_LEGACY_CARD_IDS,PRESERVED_CHARACTER_CARD_IDS,
 PRESERVED_BOSS_CARD_IDS,REDESIGN_SHIP_IDS,REDESIGN_NONCHARACTER_CARD_COUNT,
 RETIREMENT_MANIFEST,redesignedCardsForShip,validateRedesignSpecs}
 from './fleetNext/redesignRegistry.js';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS} from './fleetNext/rules.js';

test('Il nuovo progetto contiene 120 esclusive distinte, 10 per ciascuna nave principale',()=>{
 assert.equal(validateRedesignSpecs(),true);
 assert.equal(REDESIGN_SHIP_IDS.length,12);
 assert.equal(Object.keys(REDESIGN_CARD_SPECS).length,120);
 assert.equal(REDESIGN_NONCHARACTER_CARD_COUNT,108);
 for(const shipId of REDESIGN_SHIP_IDS){
  const cards=redesignedCardsForShip(shipId);
  assert.equal(cards.length,10,shipId);
  const byLevel=Array.from({length:5},(_,i)=>cards.filter(c=>c.minShipLevel===i+1).length);
  assert.deepEqual(byLevel,[6,1,1,1,1],shipId);
  assert.equal(cards.filter(c=>c.category==='Personaggio').length,1,shipId);
  for(const c of cards){
   assert.ok(c.name&&c.effectText,c.id);
   assert.equal(c.imageReady,false,c.id);
   assert.ok(c.status==='design_requires_logic'||c.status==='preserve_existing_character',c.id);
  }
 }
});

test('Ritiro: 350 vecchie carte non-Personaggio, Boss e Personaggi conservati',()=>{
 assert.equal(RETIREMENT_MANIFEST.retiredGenericIds.length,238);
 assert.equal(RETIREMENT_MANIFEST.retiredExclusiveIds.length,112);
 assert.equal(RETIRED_LEGACY_CARD_IDS.length,350);
 assert.equal(PRESERVED_CHARACTER_CARD_IDS.length,29);
 assert.equal(PRESERVED_BOSS_CARD_IDS.length,12);
 const protectedIds=new Set([...PRESERVED_CHARACTER_CARD_IDS,...PRESERVED_BOSS_CARD_IDS]);
 for(const id of RETIRED_LEGACY_CARD_IDS){
  assert.equal(protectedIds.has(id),false,id);
  assert.equal(Object.hasOwn(REDESIGN_CARD_SPECS,id),false,id);
 }
 for(const id of RETIREMENT_MANIFEST.keptGenericCharacters)assert.ok(GENERAL_CARDS[id],id);
 for(const id of RETIREMENT_MANIFEST.keptExclusiveCharacters)assert.ok(EXCLUSIVE_CARDS[id],id);
 for(const id of PRESERVED_BOSS_CARD_IDS)assert.ok(BOSS_CARDS[id],id);
});

test('Le 12 esclusive Personaggio continuano a usare le carte attuali, senza doppioni',()=>{
 for(const shipId of REDESIGN_SHIP_IDS){
  const proposed=redesignedCardsForShip(shipId).find(c=>c.category==='Personaggio');
  const current=EXCLUSIVE_CARDS[proposed.preservedCharacterId];
  assert.ok(current,shipId);
  assert.equal(current.name,proposed.name,shipId);
  assert.equal(proposed.status,'preserve_existing_character');
 }
});
