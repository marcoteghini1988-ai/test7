import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import * as inventoryExports from './fleetNext/collection.js';
import {createFleetNextBattle} from './fleetNext/combat.js';
const src=file=>readFileSync(new URL(file,import.meta.url),'utf8');

test('Nuovo inventario senza mazzo manuale, acquisti dismessi e addebiti',()=>{
 const inv=createFleetInventory();
 assert.equal(inv.schema,4);
 assert.deepEqual(inv.deck,[]);
 assert.equal(inv.owned['gen-216'],1);
 for(const method of ['equipFleetBaseDeck','buyPrebuiltDeck','buyGeneralCard','buyFleetPack'])
  assert.equal(Object.hasOwn(inventoryExports,method),false,method);
 assert.equal(inv.credits,0);
});
test('Migrazione conserva il mazzo solo come archivio',()=>{
 const legacy={...createFleetInventory(),schema:3,deck:['gen-216','prog-bypass','prog-machine-guard'],credits:413};
 const next=normalizeFleetInventory(legacy);
 assert.equal(next.schema,4);assert.equal(next.credits,413);
 assert.deepEqual(next.deck,[]);assert.deepEqual(next.retiredDeck,legacy.deck);
 assert.deepEqual(normalizeFleetInventory(next),next);
});
test('La partita ufficiale usa solo il nuovo mazzo da 40, non l’archivio delle carte ritirate',()=>{
 const view=src('./OfficialFleetBattle3D.jsx'),shop=src('./FleetCollectionWorkshop.jsx');
 assert.match(view,/deckA:playerDeck\\.baseDeck,deckB:\\['gen-216'\\]/);
 assert.match(view,/ruleset:HP_SYNC_RULESET/);
 assert.doesNotMatch(view,/deckA:inventory\.deck|STARTER_DECK/);
 assert.doesNotMatch(shop,/Il mio mazzo|Mazzi pronti|buyGeneralCard|equipFleetBaseDeck|buyPrebuiltDeck/);
 assert.match(shop,/eligibleExclusives/);assert.match(shop,/BOSS_CARDS/);
});
test('Le carte in ingresso sono esclusive e Personaggi, mai Attacco Difesa Trappola generici',()=>{
 const b=createFleetNextBattle({shipA:'N00',levelA:1,shipB:'C01',levelB:1,
  deckA:['gen-216'],deckB:['gen-216'],seed:20261117});
 for(const side of Object.values(b.sides)){
  const ids=[...side.deck,...side.hand];
  assert.ok(ids.length>=7);
  assert.ok(ids.some(id=>id.startsWith('ex-')||id.startsWith('nx-')));
  assert.ok(ids.every(id=>id.startsWith('nx-')||id.startsWith('ex-')||id==='gen-216'));
 }
});
