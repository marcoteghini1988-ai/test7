import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,PROGRESSION_CARDS,ENERGY_CARDS,ENERGY_COUNT,BASE_CATALOG_COUNT,TOTAL_CARD_COUNT,FUSION_SHIP_CARDS,card,cardFacePath,deckFromCounts,effectiveDeck} from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {createFleetInventory,normalizeFleetInventory,readFleetInventory,writeFleetInventory} from './fleetNext/collection.js';
import * as inventoryExports from './fleetNext/collection.js';
import {TEST_DECK} from './fleetNext/testDeckFixtures.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import retired from '../docs/ARCHIVIO_ID_CARTE_RITIRATE_2026-11-16.json' with {type:'json'};
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
test('120 esclusive ufficiali, Personaggi Boss e carte tecniche conservati',()=>{
 assert.equal(Object.keys(GENERAL_CARDS).length,12);
 assert.equal(Object.keys(EXCLUSIVE_CARDS).length,120);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.keys(PROGRESSION_CARDS).length,4);
 assert.equal(BASE_CATALOG_COUNT,144);assert.equal(ENERGY_COUNT,10);assert.equal(TOTAL_CARD_COUNT,158+FUSION_SHIP_CARDS.length+120);
 assert.equal(retired.generalIds.length,238);assert.equal(retired.exclusiveIds.length,112);
 const entries=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS),...Object.values(BOSS_CARDS),...Object.values(PROGRESSION_CARDS),...ENERGY_CARDS,...FUSION_SHIP_CARDS];
 assert.equal(new Set(entries.map(c=>c.id)).size,158+FUSION_SHIP_CARDS.length);
 for(const c of entries){assert.equal(card(c.id),c);assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(c.effetto||c.effectProposed,describeEffect(c),c.id);}
 for(const id of [...retired.generalIds,...retired.exclusiveIds]){assert.equal(card(id),null,id);assert.equal(cardFacePath(id),null,id);}
});
test('Mazzo storico disponibile solo per regressione, non per le nuove partite',()=>{
 assert.deepEqual(createFleetInventory().deck,[]);
 assert.equal(createFleetInventory().owned['gen-216'],1);
 const deck=deckFromCounts(TEST_DECK.carteGenerali);
 assert.equal(deck.length,40);
 const old=[...deck];old[0]=retired.generalIds[0];
 assert.equal(card(old[0]),null,'Le definizioni obsolete non possono essere riattivate');
 assert.ok(effectiveDeck(deck,'N00',1).includes('ex-n00-01'));
});
test('Nessuna API per il commercio o l’equipaggiamento dei mazzi ritirati',()=>{
 const inv=createFleetInventory();inv.credits=725;
 for(const method of ['buyFleetPack','buyGeneralCard','buyPrebuiltDeck','equipFleetBaseDeck'])
  assert.equal(Object.hasOwn(inventoryExports,method),false,method);
 assert.equal(inv.credits,725);
});
test('Migrazione schema 2 conserva vecchie proprietà in deposito, crediti, premi e nave',()=>{
 const prev={...createFleetInventory(),schema:2,credits:725,packsOpened:4,
  equippedMother:'L04',claimedRewards:['victory'],
  deck:['gen-001',...Array(39).fill('gen-002')],
  owned:{'gen-001':3,'gen-002':7,'gen-216':2,'boss-character-1':1},
  exclusiveUpgrades:{'ex-n00-02':2,'ex-n00-01':2}};
 const copy=JSON.stringify(prev),next=normalizeFleetInventory(prev);
 assert.equal(JSON.stringify(prev),copy);assert.equal(next.schema,4);
 assert.equal(next.credits,725);assert.equal(next.packsOpened,4);assert.equal(next.equippedMother,'L04');
 assert.deepEqual(next.claimedRewards,['victory']);
 assert.equal(next.retiredOwned['gen-001'],3);assert.equal(next.retiredOwned['gen-002'],7);
 assert.equal(next.owned['boss-character-1'],1);assert.ok(next.owned['gen-216']>=2);
 assert.equal(next.retiredExclusiveUpgrades['ex-n00-02'],2);assert.equal(next.exclusiveUpgrades['ex-n00-01'],2);
 assert.deepEqual(next.retiredDeck,prev.deck);
 assert.deepEqual(next.deck,[],'Il mazzo storico non torna giocabile');
 assert.deepEqual(normalizeFleetInventory(next),next,'La migrazione deve essere idempotente');
});
test('Il trofeo Boss si ottiene una sola volta e resta salvato',()=>{
 const s=storage();
 assert.equal(claimBossCharacterFromVictory({winner:'enemy',mode:'campaign',sectorNumber:10},s).granted,false);
 assert.equal(claimBossCharacterFromVictory({winner:'player',mode:'campaign',sectorNumber:10},s).granted,true);
 assert.equal(readFleetInventory(s).owned['boss-character-1'],1);
 assert.equal(claimBossCharacterFromVictory({winner:'player',mode:'campaign',sectorNumber:10},s).granted,false);
 const inv=readFleetInventory(s);inv.credits=222;writeFleetInventory(inv,s);
 assert.equal(readFleetInventory(s).credits,222);
});
