import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetInventory,writeFleetInventory,readFleetInventory,FLEET_INVENTORY_KEY}
 from './fleetNext/collection.js';
import {readShipCollection,SHIP_COLLECTION_KEY,equipShipCards,writeShipCollection}
 from './shipCollection.js';
import {purchaseMotherCopy,evolveMotherCopy} from './shipRarityShop.js';
import {readRarityCampaign,claimRarityCampaignVictory} from './fleetNext/rarityCampaign.js';
import {rarityIndex,SHIP_RARITIES,rarityPurchaseCost,
 rarityEvolutionCost,nativeMotherRarity} from './fleetNext/shipRarity.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {readSupportCollection,writeSupportCollection,equipSupportInstance,
 claimSupportSlotMilestone,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {purchaseSupportCopy,evolveSupportCopy} from './fleetNext/supportShop.js';
import {createFleetNextBattle,createFleetSide,fuseIndependentSupportWithShip,
 fusionShipUnavailableReason} from './fleetNext/combat.js';
import {CAMPAIGN_SHIP_ORDER} from './fleetNext/progression.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {elementalRelation} from './fleetNext/elementalAffinities.js';
import {LEGENDARY_MOTHER_PROFILES,motherBaselinePotential} from './fleetNext/motherBalance.js';
function store(credits=100000){
 const data=new Map(),failKey={key:null};
 const storage={
  getItem:k=>data.get(k)??null,
  setItem(k,v){if(k===failKey.key){failKey.key=null;throw Error('disco pieno');}data.set(k,String(v));},
  removeItem:k=>data.delete(k),
  failNext:key=>{failKey.key=key},
  snapshot:()=>Object.fromEntries(data)
 };
 writeFleetInventory({...createFleetInventory(),credits},storage);
 return storage;
}
test('Tre copie madre e Crediti: una resta Comune, una nuova diventa Rara',()=>{
 const storage=store(),initial=readShipCollection(storage);
 assert.equal(initial.cards[0].rarita,'Comune');
 assert.equal(purchaseMotherCopy('C04','Comune',storage).ok,false,'variante ritirata esclusa');
 assert.equal(purchaseMotherCopy('L04','Comune',storage).ok,false,'la madre finale non nasce Comune');
 assert.equal(purchaseMotherCopy('N00','Rara',storage).ok,false,'serve la progressione campagna');
 claimRarityCampaignVictory('campaign',85,storage);
 const first=purchaseMotherCopy('N00','Comune',storage);
 const second=purchaseMotherCopy('N00','Comune',storage);
 assert.equal(first.ok,true,first.reason);assert.equal(second.ok,true,second.reason);
 assert.equal(readShipCollection(storage).cards.filter(c=>c.shipId==='N00'&&c.rarita==='Comune').length,3);
 const price=rarityEvolutionCost('mother','Rara');
 const balance=readFleetInventory(storage).credits;
 const evolved=evolveMotherCopy('ship:N00',storage);
 assert.equal(evolved.ok,true,evolved.reason);
 assert.equal(readFleetInventory(storage).credits,balance-price);
 assert.equal(readShipCollection(storage).cards.filter(c=>c.shipId==='N00'&&c.rarita==='Comune').length,1);
 assert.equal(readShipCollection(storage).cards.filter(c=>c.shipId==='N00'&&c.rarita==='Rara').length,1);
 assert.equal(readShipCollection(storage).loadout[0],'ship:N00');
 assert.equal(evolveMotherCopy(evolved.instanceId,storage).ok,false,'due copie mancanti');
 const next=purchaseMotherCopy('N00','Leggendaria',storage);
 assert.equal(next.ok,true,next.reason);
 assert.equal(readShipCollection(storage).cards.some(c=>c.instanceId===next.instanceId&&c.rarita==='Leggendaria'),true);
});
test('Nessuna carta o Credito perso se manca il pagamento o fallisce una scrittura',()=>{
 const storage=store(1000);
 claimRarityCampaignVictory('campaign',85,storage);
 const before=storage.snapshot();
 assert.equal(purchaseMotherCopy('N00','Leggendaria',storage).ok,false);
 assert.deepEqual(storage.snapshot(),before);
 storage.failNext(FLEET_INVENTORY_KEY);
 assert.equal(purchaseMotherCopy('N00','Comune',storage).ok,false);
 assert.deepEqual(storage.snapshot(),before);
});
test('Supporti di ogni rarità: duplicati, copie conservate, due slot indipendenti',()=>{
 const storage=store(),model=SUPPORT_CATALOG[0];
 claimRarityCampaignVictory('campaign',85,storage);
 for(let i=0;i<3;i++){
  const bought=purchaseSupportCopy(model.id,'Comune',storage);
  assert.equal(bought.ok,true,bought.reason);
 }
 const copies=readSupportCollection(storage).owned.filter(x=>x.supportId===model.id);
 assert.equal(copies.length,3);
 const cost=rarityEvolutionCost('support','Rara');
 const balance=readFleetInventory(storage).credits;
 const rare=evolveSupportCopy(copies[0].instanceId,storage);
 assert.equal(rare.ok,true,rare.reason);
 assert.equal(readFleetInventory(storage).credits,balance-cost);
 let inventory=readSupportCollection(storage);
 assert.equal(inventory.owned.filter(x=>x.rarita==='Comune').length,1);
 assert.equal(inventory.owned.filter(x=>x.rarita==='Rara').length,1);
 const legendary=purchaseSupportCopy(model.id,'Leggendaria',storage);
 assert.equal(legendary.ok,true,legendary.reason);
 inventory=claimSupportSlotMilestone(readSupportCollection(storage),'campaign:independent');
 inventory=equipSupportInstance(inventory,0,inventory.owned.find(x=>x.instanceId===legendary.instanceId).instanceId);
 writeSupportCollection(inventory,storage);
 const side=createFleetSide('L04',1,[],31,{},equippedSupportRoster(readSupportCollection(storage)));
 assert.equal(side.ships[0].id,'L04');
 assert.equal(side.escorts[0].supportRarity,'Leggendaria');
 assert.equal(fusionShipUnavailableReason(side,'R01',0),'');
 const first=fuseIndependentSupportWithShip(side,'R01',0);
 assert.equal(first.ok,true,first.reason);
 assert.equal(side.escorts.length,1);assert.equal(side.reserveEscorts.length,0);
 assert.equal(first.fused.supportSkillIds.length,2);
});
test('Una Comune tecnica L5 non aggira il requisito della rarità Leggendaria',()=>{
 const storage=store(),model=SUPPORT_CATALOG[0];
 const bought=purchaseSupportCopy(model.id,'Comune',storage);
 assert.equal(bought.ok,true);
 let inv=claimSupportSlotMilestone(readSupportCollection(storage),'campaign:slot-guard');
 inv=equipSupportInstance(inv,0,bought.instanceId);
 inv.owned[0].level=5; // campo storico, non evoluzione di rarità
 writeSupportCollection(inv,storage);
 const side=createFleetSide('N00',20,[],1988,{},equippedSupportRoster(readSupportCollection(storage)));
 assert.equal(side.escorts[0].supportRarity,'Comune');
 assert.match(fusionShipUnavailableReason(side,'R01',0),/Leggendario/);
 assert.equal(fuseIndependentSupportWithShip(side,'R01',0).ok,false);
});
test('Le 12 madri Leggendarie hanno statistiche diverse e potenziale iniziale paragonabile',()=>{
 const actual=[];
 for(const id of CAMPAIGN_SHIP_ORDER){
  const b=createFleetNextBattle({
   shipA:id,shipB:'L04',raritaA:'Leggendaria',raritaB:'Leggendaria',
   ruleset:HP_SYNC_RULESET,supportRosterA:[],supportRosterB:[],mode:'pvp'
  });
  const unit=b.sides.A.ships[0];
  assert.equal(unit.rarita,'Leggendaria',id);
  assert.equal(unit.hp,unit.maxHp,id);
  assert.equal(unit.level,({N00:20,C01:19,C02:18,C03:17,R01:15,R02:14,R04:12,
   E01:11,E02:10,L01:7,L03:5,L04:5})[id]);
  actual.push([unit.hp,unit.attackPower,unit.defensePower]);
 }
 assert.equal(new Set(actual.map(x=>JSON.stringify(x))).size,12,'12 profili base distinti');
 const potential=CAMPAIGN_SHIP_ORDER.map(id=>motherBaselinePotential(LEGENDARY_MOTHER_PROFILES[id]));
 assert.ok(Math.max(...potential)/Math.min(...potential)<=1.03,
  'le madri leggendarie devono restare comparabili senza statistiche identiche');
 assert.equal(elementalRelation('plasma','mineral'),1);
 assert.equal(elementalRelation('mineral','plasma'),-1);
 assert.equal(nativeMotherRarity('L04'),'Leggendaria');
});
