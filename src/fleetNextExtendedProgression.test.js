import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHIP_PROGRESSION_IDS,SHIP_MAX_LEVELS,shipMaxLevel,shipEscortUnlockLevels,
 getShipProgression,getShipProgressionLevels} from './fleetNext/progression.js';
import {FLEET_ESCORT_TRAITS} from './fleetEscortSupports.js';
import {createFleetSide,createFleetNextBattle,protectingFleetUnits} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {readShipCollection,grantShipCard,upgradeShipCard,updateShipCollection} from './shipCollection.js';
import {shipUpgradeDustCost,validateShipUpgradePurchase} from './shipUpgrades.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('Parametri definiti per le 12 madri ufficiali: prima L20, ultima L5, potenziale finale 100',()=>{
 assert.equal(SHIP_PROGRESSION_IDS.length,12);
 assert.equal(Object.keys(SHIP_MAX_LEVELS).length,12);
 assert.equal(shipMaxLevel('N00'),20);
 assert.equal(shipMaxLevel('L04'),5);
 for(const id of SHIP_PROGRESSION_IDS){
  const cap=shipMaxLevel(id),levels=getShipProgressionLevels(id);
  assert.equal(levels.length,cap,id);
  assert.equal(levels[0].level,1);
  assert.equal(levels.at(-1).level,cap);
  assert.equal(levels.at(-1).potential,100,id);
  assert.ok(levels.every((r,i)=>i===0||r.masteryPoints>levels[i-1].masteryPoints),id);
  assert.equal(getShipProgression(id,999).level,cap);
  assert.equal(getShipProgression(id,0).level,1);
  assert.ok(FLEET_ESCORT_TRAITS[id]?.length===2,id);
 }
});
test('Aurora sblocca Velo al livello 10 e Lancia al 18, con supporti reali in battaglia',()=>{
 assert.deepEqual(shipEscortUnlockLevels('N00'),[10,18]);
 for(const [level,expected] of [[1,0],[5,0],[9,0],[10,1],[17,1],[18,2],[20,2]]){
  const side=createFleetSide('N00',level,[],123);
  assert.equal(side.ships[0].level,level);
  assert.equal(side.escorts.length,expected,'Aurora L'+level);
  assert.equal(protectingFleetUnits(side).length,expected);
  assert.equal(side.fusionLimit,0);
  if(expected){
   assert.ok(side.ships[0].parts.some(p=>p.id==='command'));
   assert.deepEqual(side.escorts.map(e=>e.name),['Velo Aurora','Lancia Aurora'].slice(0,expected));
   assert.ok(side.escorts.every(e=>e.visual?.includes('/assets/escorts/N00_escort_')));
  }
 }
 assert.deepEqual(createFleetSide('N00',20,[],44).escorts.map(e=>e.grade),[2,2]);
});
test('Lince sblocca Sentinella al 9 e Lama al 17, poi perfeziona entrambi i supporti',()=>{
 assert.deepEqual(shipEscortUnlockLevels('C01'),[9,17]);
 for(const [level,expected] of [[5,0],[8,0],[9,1],[16,1],[17,2],[19,2]]){
  const side=createFleetSide('C01',level,[],22);
  assert.equal(side.escorts.length,expected);
  assert.equal(protectingFleetUnits(side).length,expected);
  if(expected)assert.ok(side.ships[0].parts.some(p=>p.id==='command'));
 }
 assert.deepEqual(createFleetSide('C01',19,[],44).escorts.map(e=>e.grade),[2,2]);
});
test('Le tre famiglie con Fusione restano le sole ad averla anche al livello massimo',()=>{
 const special=new Map([['L01',1],['L03',1],['L04',2]]);
 for(const id of SHIP_PROGRESSION_IDS){
  const row=getShipProgression(id,shipMaxLevel(id));
  assert.equal(row.escortCount,2,id+' ha due supporti al massimo');
  assert.equal(row.fusionLimit,special.get(id)||0,id);
 }
 const arca=createFleetSide('L04',5,[],123);
 assert.equal(arca.reserveEscorts.length,2);
 assert.equal(arca.escorts.length,2);
});
test('Potenziamento L6–L20 persistente, senza salti e senza perdita dei salvataggi',async()=>{
 const store=memory();
 let ship=readShipCollection(store);
 assert.equal(ship.cards[0].level,1);
 for(let level=2;level<=20;level++){
  const cost=shipUpgradeDustCost('N00',level);
  assert.ok(cost>0);
  const access=validateShipUpgradePurchase(ship,'ship:N00',level,cost);
  assert.equal(access.allowed,true,'N00 L'+level);
  ship=await updateShipCollection(c=>upgradeShipCard(c,'ship:N00',level),store);
  assert.equal(readShipCollection(store).cards[0].level,level);
 }
 assert.equal(validateShipUpgradePurchase(ship,'ship:N00',21,1e9).allowed,false);
 assert.equal(shipUpgradeDustCost('N00',21),null);
 assert.throws(()=>upgradeShipCard(ship,'ship:N00',22));
 const l04=grantShipCard(ship,'L04');
 assert.equal(shipUpgradeDustCost('L04',6),null);
 assert.throws(()=>upgradeShipCard(l04,'ship:L04',6));
});
test('L20 reale del giocatore mantiene due supporti e la barra HP madre nella modalità HP',()=>{
 const b=createFleetNextBattle({shipA:'N00',levelA:20,shipB:'L04',levelB:5,
  deckA:[],deckB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,seed:61});
 assert.equal(b.sides.A.ships[0].level,20);
 assert.equal(b.sides.A.escorts.length,2);
 assert.equal(b.sides.B.ships[0].level,5);
 assert.equal(b.sides.B.escorts.length,2);
 assert.equal(b.sides.A.ships[0].hp,b.sides.A.ships[0].maxHp);
});
test('Hangar usa il livello reale e non il preset grafico legacy L5',()=>{
 const card=readFileSync(new URL('./ShipPresentation.jsx',import.meta.url),'utf8');
 const panel=readFileSync(new URL('./ShipCollectionPanels.jsx',import.meta.url),'utf8');
 assert.match(card,/data-level=\{effectiveLevel\}/);
 assert.match(card,/<b className="ship-card-level">L\{effectiveLevel\}<\/b>/);
 assert.match(panel,/getShipProgressionLevels\(shipId\)/);
 assert.match(panel,/card\.level<maxLevel/);
 assert.match(panel,/shipMaxLevel\(ship\.id\)/);
 const row=getShipProgression('N00',20);
 assert.equal(row.level,20);
 assert.equal(row.escortCount,2);
});
test('I rivali della campagna raggiungono il tetto della loro famiglia a parità di fascia',()=>{
 assert.equal(officialCampaignRivalLevel({mode:'campaign',shipId:'N00',sectorNumber:120}),20);
 assert.equal(officialCampaignRivalLevel({mode:'campaign',shipId:'L04',sectorNumber:120}),5);
 assert.equal(officialCampaignRivalLevel({mode:'campaign',sectorNumber:120}),5);
 assert.equal(officialCampaignRivalLevel({mode:'campaign',shipId:'N00',sectorNumber:1}),1);
});
