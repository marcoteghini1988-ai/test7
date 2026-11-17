import test from 'node:test';
import assert from 'node:assert/strict';
import {
 RETAINED_GENERAL_CHARACTERS,RETAINED_EXCLUSIVE_CHARACTERS,RETAINED_BOSS_CARDS,
 RETAINED_CHARACTER_IDS,RETIRED_LEGACY_CARD_IDS,isProtectedCharacterCard,
 isOldCardToRetire,previewCardCutover
} from './fleetNext/cardCutover.js';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,PROGRESSION_CARDS} from './fleetNext/rules.js';

test('Rifacimento: nessuna carta Boss o Personaggio viene cancellata',()=>{
 assert.equal(RETAINED_GENERAL_CHARACTERS.length,12);
 assert.equal(RETAINED_EXCLUSIVE_CHARACTERS.length,17);
 assert.equal(RETAINED_BOSS_CARDS.length,12);
 assert.equal(RETAINED_CHARACTER_IDS.length,41);
 assert.equal(RETIRED_LEGACY_CARD_IDS.length,350);
 const all=new Set([
 ...Object.keys(GENERAL_CARDS),...Object.keys(EXCLUSIVE_CARDS),
 ...Object.keys(BOSS_CARDS),...Object.keys(PROGRESSION_CARDS)
 ]);
 assert.equal(all.size,155);
 for(const id of RETAINED_CHARACTER_IDS){
  assert.equal(isProtectedCharacterCard(id),true,id);
  assert.equal(isOldCardToRetire(id),false,id);
 }
 for(const id of RETIRED_LEGACY_CARD_IDS){
  assert.equal(isProtectedCharacterCard(id),false,id);
  assert.equal(isOldCardToRetire(id),true,id);
 }
});
test('L’archivio di passaggio non perde crediti, premi, mazzi o progressi',()=>{
 const inventory={credits:1780,owned:{'gen-001':3,'gen-216':2,'ex-n00-01':1,'boss-character-1':1,
  'prog-machine-guard':1,'nx-n00-03':1},
  deck:['gen-001','gen-216','nx-n00-03'],equippedMother:'L04',
  claimedRewards:['campagna-10'],exclusiveUpgrades:{'ex-n00-02':2}};
 const snapshot=JSON.stringify(inventory),preview=previewCardCutover(inventory);
 assert.deepEqual(preview.protectedOwned,{'gen-216':2,'ex-n00-01':1,'boss-character-1':1});
 assert.deepEqual(preview.cardsToArchive,{'gen-001':3});
 assert.deepEqual(preview.unknownOrNewOwned,{'prog-machine-guard':1,'nx-n00-03':1});
 assert.deepEqual(preview.unconvertedDeckIds,['gen-001','nx-n00-03']);
 assert.equal(preview.credits,1780);
 assert.equal(preview.equippedMother,'L04');
 assert.deepEqual(preview.claimedRewards,['campagna-10']);
 assert.deepEqual(preview.exclusiveUpgrades,{'ex-n00-02':2});
 assert.equal(JSON.stringify(inventory),snapshot);
});
