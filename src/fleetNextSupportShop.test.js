import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFleetInventory,writeFleetInventory,readFleetInventory,
 claimFleetReward,FLEET_INVENTORY_KEY} from './fleetNext/collection.js';
import {SUPPORT_COLLECTION_KEY,readSupportCollection,
 equipSupportInstance,claimSupportSlotMilestone,writeSupportCollection,
 equippedSupportRoster} from './fleetNext/supportCollection.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {SUPPORT_MAX_LEVEL} from './fleetNext/supportProgression.js';
import {supportPurchaseCost,supportUpgradeCost,purchaseSupportModel,
 purchaseSupportUpgrade,purchaseSupportCopy,evolveSupportCopy} from './fleetNext/supportShop.js';
import {claimRarityCampaignVictory} from './fleetNext/rarityCampaign.js';
import {buyNextCommonCard,buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';
import {FUSION_SHIP_CARDS,cardCopyLimit} from './fleetNext/rules.js';
import {createFleetSide,fuseIndependentSupportWithShip} from './fleetNext/combat.js';

function memoryStore(){
 const data=new Map();let failKey=null;
 return {
  getItem:key=>data.has(key)?data.get(key):null,
  setItem(key,value){if(key===failKey){failKey=null;throw Error('Scrittura simulata fallita');}
   data.set(key,String(value));},
  removeItem:key=>data.delete(key),
  failNext:key=>{failKey=key;},
  snapshot:()=>Object.fromEntries(data)
 };
}
function prepared(credits=9000){
 const store=memoryStore();
 writeFleetInventory({...createFleetInventory(),credits},store);
 return store;
}
test('Tredici supporti comprabili con Crediti reali senza modificare slot e madre',()=>{
 const store=prepared();
 assert.equal(SUPPORT_CATALOG.length,13);
 for(const model of SUPPORT_CATALOG){
  assert.ok(supportPurchaseCost(model.id)>0,model.id);
  assert.equal(model.rarityDraft,undefined);
  const before=readFleetInventory(store).credits;
  const bought=purchaseSupportModel(model.id,store);
  assert.equal(bought.ok,true,bought.reason);
  assert.equal(readFleetInventory(store).credits,before-bought.price);
 }
 const inv=readSupportCollection(store);
 assert.equal(inv.owned.length,13);
 assert.equal(inv.unlockedSlots,0,'Lo Shop non sblocca gli slot campagna');
 assert.deepEqual(inv.equipped,[null,null]);
 assert.equal(readFleetInventory(store).equippedMother,'N00');
});
test('Livelli legacy restano migrabili, ma Fusione ufficiale richiede rarità Leggendaria',()=>{
 const store=prepared(),model=SUPPORT_CATALOG[0];
 const bought=purchaseSupportModel(model.id,store);
 assert.equal(bought.ok,true,bought.reason);
 const copy=bought.instanceId;
 const first=readSupportCollection(store);
 assert.equal(first.owned[0].level,1);
 const chosen=claimSupportSlotMilestone(first,'campaign:slot-test');
 writeSupportCollection(equipSupportInstance(chosen,0,copy),store);
 for(let lvl=2;lvl<=SUPPORT_MAX_LEVEL;lvl++){
  const balance=readFleetInventory(store).credits;
  const price=supportUpgradeCost(model.id,lvl);
  const result=purchaseSupportUpgrade(copy,store);
  assert.equal(result.ok,true,result.reason);
  assert.equal(result.level,lvl);
  assert.equal(readFleetInventory(store).credits,balance-price);
 }
 const upgraded=readSupportCollection(store);
 assert.equal(upgraded.owned[0].level,5);
 assert.equal(upgraded.equipped[0],copy);
 assert.equal(upgraded.unlockedSlots,1);
 assert.equal(purchaseSupportUpgrade(copy,store).ok,false,'Nessun upgrade oltre L5');
 const side=createFleetSide('C01',1,[],17,{},equippedSupportRoster(upgraded));
 const denied=fuseIndependentSupportWithShip(side,SUPPORT_CATALOG[1].shipModelId,0);
 assert.equal(denied.ok,false,'L5 tecnico non trasforma una carta Comune in Leggendaria');
 claimRarityCampaignVictory('campaign',85,store);
 const legendary=purchaseSupportCopy(model.id,'Leggendaria',store);
 assert.equal(legendary.ok,true,legendary.reason);
 const saved=readSupportCollection(store);
 writeSupportCollection(equipSupportInstance(saved,0,legendary.instanceId),store);
 const modern=createFleetSide('C01',1,[],17,{},equippedSupportRoster(readSupportCollection(store)));
 const result=fuseIndependentSupportWithShip(modern,SUPPORT_CATALOG[1].shipModelId,0);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.fused.hp,result.fused.maxHp);
 assert.equal(result.fused.supportSkillIds.length,2);
});
test('Crediti insufficienti, modelli legacy e upgrade non posseduti non mutano i dati',()=>{
 const store=prepared(0),before=store.snapshot();
 assert.equal(purchaseSupportModel(SUPPORT_CATALOG[0].id,store).ok,false);
 assert.equal(purchaseSupportModel('support-model-r03',store).ok,false);
 assert.equal(purchaseSupportUpgrade('unknown',store).ok,false);
 assert.deepEqual(store.snapshot(),before);
});
test('Errore seconda scrittura: rollback del supporto e dei Crediti',()=>{
 const store=prepared();
 const before=store.snapshot();
 store.failNext(FLEET_INVENTORY_KEY);
 assert.equal(purchaseSupportModel(SUPPORT_CATALOG[0].id,store).ok,false);
 assert.deepEqual(store.snapshot(),before);
});
test('Ricompense reali finanziano acquisto Fusione con massimo due copie e scelta nel mazzo',()=>{
 let inv=createFleetInventory();
 const reward=claimFleetReward(inv,'test:crediti-shop',1000);
 assert.equal(reward.ok,true);
 inv=reward.inventory;
 const card=FUSION_SHIP_CARDS[0];
 assert.equal(card.rarita,'Leggendaria');
 const first=buyNextCommonCard(inv,card.id);
 assert.equal(first.ok,true,first.reason);
 const second=buyNextCommonCard(first.inventory,card.id);
 assert.equal(second.ok,true,second.reason);
 const third=buyNextCommonCard(second.inventory,card.id);
 assert.equal(third.ok,false);
 assert.equal(cardCopyLimit(card.id),2);
 const deck=buildNextBaseDeck(second.inventory,'N00',1,[card.id,card.id]);
 assert.deepEqual(deck.baseDeck,[card.id,card.id]);
 assert.equal(deck.discarded.length,0);
});
test('Interfaccia Hangar e carte Shop hanno acquisto, potenziamento e saldo',()=>{
 const hangar=readFileSync(new URL('./SupportHangarPanel.jsx',import.meta.url),'utf8');
 const workshop=readFileSync(new URL('./FleetCollectionWorkshop.jsx',import.meta.url),'utf8');
 assert.match(hangar,/purchaseSupportCopy\(/);
 assert.match(hangar,/evolveSupportCopy\(/);
 assert.doesNotMatch(hangar,/POTENZIA L\{/);
 assert.match(workshop,/\.\.\.FUSION_SHIP_CARDS/);
});
