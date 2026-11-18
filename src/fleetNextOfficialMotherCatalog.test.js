import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {OFFICIAL_MOTHER_IDS} from './fleetNext/officialMotherIds.js';
import {SHIP_CONFIGS,EXCLUSIVE_CARDS,EXCLUSIVE_DESIGNS_120,
 SHIP_PROGRESSION_IDS,FUSION_SHIP_CARDS,card,effectiveDeck} from './fleetNext/rules.js';
import {FLEET_ELEMENT_IDENTITIES} from './fleetNext/elementalAffinities.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {createFleetMother,createFleetSide} from './fleetNext/combat.js';
import {shipMaxLevel} from './fleetNext/progression.js';

test('Solo 12 madri ufficiali e 120 carte esclusive eseguibili',()=>{
 assert.equal(OFFICIAL_MOTHER_IDS.length,12);
 assert.deepEqual(PHASE1_CATALOG.ships.map(s=>s.id),OFFICIAL_MOTHER_IDS);
 assert.equal(PHASE1_CATALOG.shipLevels.length,60);
 assert.ok(PHASE1_CATALOG.weapons.every(w=>OFFICIAL_MOTHER_IDS.includes(w.nave_id)));
 assert.deepEqual(SHIP_PROGRESSION_IDS.sort(),[...OFFICIAL_MOTHER_IDS].sort());
 assert.deepEqual(Object.keys(SHIP_CONFIGS).sort(),[...OFFICIAL_MOTHER_IDS].sort());
 assert.deepEqual(Object.keys(FLEET_ELEMENT_IDENTITIES).sort(),[...OFFICIAL_MOTHER_IDS].sort());
 assert.equal(Object.keys(EXCLUSIVE_CARDS).length,120);
 assert.equal(EXCLUSIVE_DESIGNS_120.length,120);
 for(const motherId of OFFICIAL_MOTHER_IDS){
  const all=Object.values(EXCLUSIVE_CARDS).filter(c=>c.shipId===motherId);
  assert.equal(all.length,10,motherId);
  assert.equal(all.filter(c=>c.kind==='character').length,1,motherId);
  assert.ok(all.every(c=>c.playable!==false),motherId);
  const deck=effectiveDeck([],motherId,shipMaxLevel(motherId),{independentSupports:true});
  assert.equal(deck.filter(id=>all.some(c=>c.id===id)).length,10,motherId);
  assert.equal(createFleetMother(motherId,shipMaxLevel(motherId)).id,motherId);
 }
});
test('Le cinque vecchie varianti non sono schierabili, né acquistabili, né pescabili',()=>{
 for(const motherId of ['C04','R03','E03','E04','L02']){
  assert.equal(SHIP_CONFIGS[motherId],undefined);
  assert.equal(PHASE1_CATALOG.ships.some(s=>s.id===motherId),false);
  assert.equal(OFFICIAL_MOTHER_IDS.includes(motherId),false);
  assert.equal(card('ex-'+motherId.toLowerCase()+'-01'),null);
  for(let n=2;n<=10;n++)assert.equal(card('nx-'+motherId.toLowerCase()+'-'+String(n).padStart(2,'0')),null);
  assert.throws(()=>createFleetMother(motherId,1),/Madre inesistente/);
 }
});
test('I 13 supporti indipendenti e le loro fusioni restano disponibili',()=>{
 assert.equal(SUPPORT_CATALOG.length,13);
 assert.equal(FUSION_SHIP_CARDS.length,13);
 const officialModels=new Set(SUPPORT_CATALOG.map(s=>s.shipModelId));
 assert.equal(officialModels.size,13);
 for(const f of FUSION_SHIP_CARDS)assert.ok(officialModels.has(f.fusionShipId));
 const side=createFleetSide('N00',1,[],11,{},[]);
 assert.equal(side.independentSupportRoster,true);
});
