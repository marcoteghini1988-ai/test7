import test from 'node:test';
import assert from 'node:assert/strict';
import {
 PRESERVED_GENERAL_CHARACTER_IDS,
 PRESERVED_EXCLUSIVE_CHARACTER_IDS,
 PRESERVED_BOSS_IDS,
 PRESERVED_CHARACTER_AND_BOSS_IDS,
 LEGACY_GENERAL_IDS_TO_REPLACE,
 LEGACY_EXCLUSIVE_IDS_TO_REPLACE,
 isProtectedCardDuringRedesign,
 CARD_RESET_POLICY
} from './fleetNext/cardResetProtection.js';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS} from './fleetNext/rules.js';

test('Il rifacimento conserva ogni Personaggio e ogni Boss',()=>{
 assert.equal(PRESERVED_GENERAL_CHARACTER_IDS.length,12);
 assert.equal(PRESERVED_EXCLUSIVE_CHARACTER_IDS.length,17);
 assert.equal(PRESERVED_BOSS_IDS.length,12);
 assert.equal(PRESERVED_CHARACTER_AND_BOSS_IDS.length,41);
 assert.equal(new Set(PRESERVED_CHARACTER_AND_BOSS_IDS).size,41);
 for(const id of PRESERVED_GENERAL_CHARACTER_IDS){
  assert.equal(GENERAL_CARDS[id].kind,'character',id);
  assert.equal(isProtectedCardDuringRedesign(id),true);
 }
 for(const id of PRESERVED_EXCLUSIVE_CHARACTER_IDS){
  assert.equal(EXCLUSIVE_CARDS[id].kind,'character',id);
  assert.equal(isProtectedCardDuringRedesign(id),true);
 }
 for(const id of PRESERVED_BOSS_IDS){
  assert.ok(BOSS_CARDS[id],id);
  assert.equal(isProtectedCardDuringRedesign(id),true);
 }
});
test('Le vecchie carte sostituibili non comprendono Personaggi o Boss',()=>{
 assert.equal(LEGACY_GENERAL_IDS_TO_REPLACE.length,238);
 assert.equal(LEGACY_EXCLUSIVE_IDS_TO_REPLACE.length,112);
 assert.equal(CARD_RESET_POLICY.legacyGeneralCount+CARD_RESET_POLICY.legacyExclusiveCount,350);
 for(const id of [...LEGACY_GENERAL_IDS_TO_REPLACE,...LEGACY_EXCLUSIVE_IDS_TO_REPLACE]){
  assert.equal(isProtectedCardDuringRedesign(id),false,id);
 }
});
