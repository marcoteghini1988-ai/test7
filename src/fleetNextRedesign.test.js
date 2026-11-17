import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {EXCLUSIVE_DESIGNS_120,EXCLUSIVE_SHIP_IDS,GENERAL_CARDS,
 EXCLUSIVE_CARDS,BOSS_CARDS,card} from './fleetNext/rules.js';
import {NEW_EXCLUSIVE_BLUEPRINTS} from './fleetNext/exclusive120.js';
import retired from '../docs/ARCHIVIO_ID_CARTE_RITIRATE_2026-11-16.json' with {type:'json'};

test('Le 120 esclusive ufficiali sono eseguibili: dieci per ogni madre, sei al L1 e quattro evoluzioni',()=>{
 assert.equal(EXCLUSIVE_DESIGNS_120.length,120);
 assert.equal(EXCLUSIVE_SHIP_IDS.length,12);
 assert.equal(Object.keys(NEW_EXCLUSIVE_BLUEPRINTS).length,108);
 assert.equal(new Set(EXCLUSIVE_DESIGNS_120.map(c=>c.id)).size,120);
 for(const id of EXCLUSIVE_SHIP_IDS){
  const cards=EXCLUSIVE_DESIGNS_120.filter(c=>c.shipId===id);
  assert.equal(cards.length,10,id);
  assert.deepEqual([1,2,3,4,5].map(level=>cards.filter(c=>c.minShipLevel===level).length),
   [6,1,1,1,1],id);
  assert.equal(cards.filter(c=>c.isPreservedCharacter).length,1,id);
  for(const c of cards){
   assert.equal(c.executable,true,c.id);
   assert.ok(card(c.id),c.id);
  }
 }
});

test('Tutti i Personaggi e Boss conservati, le 350 carte obsolete non appartengono al catalogo',()=>{
 assert.equal(Object.keys(GENERAL_CARDS).length,12);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='character').length,17);
 const allOld=[...retired.generalIds,...retired.exclusiveIds];
 assert.equal(allOld.length,350);
 for(const id of allOld)assert.equal(card(id),null,id);
 for(const id of Object.keys(GENERAL_CARDS))assert.equal(GENERAL_CARDS[id].kind,'character');
});

test('Nessun modulo parallelo del precedente ridisegno resta sotto src',()=>{
 for(const file of [
  'src/fleetNext/cardCutover.js','src/fleetNext/cardResetProtection.js',
  'src/fleetNext/redesignRegistry.js','src/fleetNext/retiredLegacyCardsV2.json',
  'src/fleetNext/retiredCardIds.json',
  'src/fleetNext/redesignProposals/group01.json',
  'src/fleetNext/redesignProposals/group02.json',
  'src/fleetNext/redesignProposals/group03.json',
  'src/fleetNext/redesignProposals/group04.json'
 ])assert.equal(existsSync(file),false,file);
});
