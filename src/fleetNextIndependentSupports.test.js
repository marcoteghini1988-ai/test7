import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {ESCORT_ARMORY} from './escortArmory.js';
import {buildFleetEscorts,FLEET_ESCORT_TRAITS} from './fleetEscortSupports.js';
import {SUPPORT_CATALOG,SUPPORT_CATALOG_BY_ID,
 supportDefinition,supportIdFor,supportModelIdFor,SUPPORT_FUSION_FAMILIES} from './fleetNext/supportCatalog.js';
import {createSupportCollection,normalizeSupportCollection,readSupportCollection,
 writeSupportCollection,grantSupportInstance,advanceSupportLevel,claimSupportSlotMilestone,
 equipSupportInstance,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {SUPPORT_MAX_LEVEL,supportLevelProfile} from './fleetNext/supportProgression.js';
import {SUPPORT_MODEL_IDS} from './fleetNext/supportModelRegistry.js';

test('Un modello di carta-navicella per ogni famiglia, con vecchi ID ancora riconosciuti',()=>{
 assert.equal(SUPPORT_CATALOG.length,13);
 assert.equal(new Set(SUPPORT_CATALOG.map(s=>s.shipModelId)).size,13);
 assert.deepEqual(SUPPORT_CATALOG.map(s=>s.shipModelId),SUPPORT_MODEL_IDS);
 assert.equal(Object.keys(SUPPORT_CATALOG_BY_ID).length,PHASE1_CATALOG.ships.length*3);
 for(const mother of PHASE1_CATALOG.ships){
  const own=supportDefinition(supportModelIdFor(mother.id));
  assert.ok(own.name); // I 13 modelli ufficiali prendono il nome dalla passiva
  assert.equal(own.inheritedElement,false);
  assert.equal(own.shipModelId,mother.id);
  for(let slot=0;slot<2;slot++){
   const id=supportIdFor(mother.id,slot),def=supportDefinition(id);
   assert.equal(def.originShipId,mother.id);
   assert.equal(def.name,ESCORT_ARMORY[mother.id][slot].name);
   assert.equal(def.visual,'/assets/escorts/'+mother.id+'_escort_'+(slot+1)+'.svg');
   assert.equal(def.freelyCombinable,true);
   assert.equal(def.duplicatesAllowed,true);
   assert.equal(def.inheritedElement,false);
   assert.equal(def.independentNormalAttack,false);
   assert.equal(FLEET_ESCORT_TRAITS[mother.id][slot].model,def.name);
   assert.equal(def.fusionFamily,SUPPORT_FUSION_FAMILIES.includes(mother.id)?mother.id:null);
  }
 }
 assert.equal(supportDefinition('unknown'),null);
 const old=buildFleetEscorts({id:'N00',level:5,element:'lightning'});
 assert.deepEqual(old.map(e=>e.catalogSupportId),
  [supportIdFor('N00',0),supportIdFor('N00',1)]);
 assert.deepEqual(old.map(e=>e.name),['Velo Aurora','Lancia Aurora']);
});

test('Nessun supporto regalato o schierato al livello iniziale; traguardi permanenti',()=>{
 let collection=createSupportCollection();
 assert.deepEqual(collection.owned,[]);
 assert.deepEqual(collection.equipped,[null,null]);
 assert.equal(collection.unlockedSlots,0);
 assert.throws(()=>equipSupportInstance(collection,0,null),/non ancora sbloccato/);
 collection=claimSupportSlotMilestone(collection,'campaign:first-slot');
 assert.equal(collection.unlockedSlots,1);
 collection=claimSupportSlotMilestone(collection,'campaign:first-slot');
 assert.equal(collection.unlockedSlots,1,'stessa ricompensa non ripetibile');
 collection=claimSupportSlotMilestone(collection,'campaign:second-slot');
 assert.equal(collection.unlockedSlots,2);
 collection=claimSupportSlotMilestone(collection,'campaign:third-check');
 assert.equal(collection.unlockedSlots,2);
 assert.throws(()=>claimSupportSlotMilestone(collection,'mother:L20'),/campagna/);
});

test('Supporti di ogni origine combinabili, duplicati consentiti solo come copie distinte',()=>{
 let inv=claimSupportSlotMilestone(createSupportCollection(),'campaign:slot-a');
 inv=claimSupportSlotMilestone(inv,'campaign:slot-b');
 inv=grantSupportInstance(inv,supportIdFor('C03',1));
 inv=grantSupportInstance(inv,supportIdFor('C03',1));
 inv=grantSupportInstance(inv,supportIdFor('L04',0));
 assert.equal(inv.owned.length,3);
 assert.notEqual(inv.owned[0].instanceId,inv.owned[1].instanceId);
 inv=equipSupportInstance(inv,0,inv.owned[0].instanceId);
 assert.throws(()=>equipSupportInstance(inv,1,inv.owned[0].instanceId),/stessa copia/);
 inv=equipSupportInstance(inv,1,inv.owned[1].instanceId);
 let lineup=equippedSupportRoster(inv);
 assert.deepEqual(lineup.map(s=>s.id),
  [supportIdFor('C03',1),supportIdFor('C03',1)]);
 assert.deepEqual(lineup.map(s=>s.slot),[0,1]);
 inv=equipSupportInstance(inv,1,inv.owned[2].instanceId);
 lineup=equippedSupportRoster(inv);
 assert.deepEqual(lineup.map(s=>s.originShipId),['C03','L04']);
 assert.throws(()=>equipSupportInstance(inv,2,null),/non ancora sbloccato/);
});

test('Il livello di ogni supporto è limitato al massimo della propria famiglia',()=>{
 let inv=grantSupportInstance(createSupportCollection(),supportModelIdFor('N00'));
 inv=grantSupportInstance(inv,supportModelIdFor('L04'));
 const overflow={...inv,owned:inv.owned.map(unit=>({...unit,level:99}))};
 const normalized=normalizeSupportCollection(overflow);
 assert.equal(normalized.owned[0].level,SUPPORT_MAX_LEVEL);
 assert.equal(normalized.owned[1].level,SUPPORT_MAX_LEVEL);
 assert.equal(SUPPORT_MAX_LEVEL,5);
});

test('Ogni copia di supporto cresce da L1 a L5 senza cambiare slot né madre',()=>{
 let inv=grantSupportInstance(createSupportCollection(),supportModelIdFor('N00'));
 inv=grantSupportInstance(inv,supportModelIdFor('L04'));
 const first=inv.owned[0].instanceId,second=inv.owned[1].instanceId;
 for(let level=2;level<=SUPPORT_MAX_LEVEL;level++){
  inv=advanceSupportLevel(inv,first);
  assert.equal(inv.owned[0].level,level);
  assert.equal(supportLevelProfile(level).passiveGrade,level);
  assert.equal(inv.owned[1].level,1,'Un upgrade non migliora altre copie');
 }
 assert.equal(supportLevelProfile(5).potential,100);
 assert.equal(supportLevelProfile(5).fullyEvolved,true);
 assert.throws(()=>advanceSupportLevel(inv,first),/MAX/);
 assert.throws(()=>advanceSupportLevel(inv,'inesistente'),/non posseduta/);
 assert.equal(inv.unlockedSlots,0,'L5 non sblocca gli slot della campagna');
 assert.equal(inv.owned.find(unit=>unit.instanceId===second).level,1);
});

test('Inventario supporti separato, persistente e protetto dai riferimenti non posseduti',()=>{
 const store=new Map(),storage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,v)
 };
 let inv=readSupportCollection(storage);
 inv=claimSupportSlotMilestone(inv,'campaign:sector:first');
 inv=grantSupportInstance(inv,supportIdFor('N00',0));
 inv=equipSupportInstance(inv,0,inv.owned[0].instanceId);
 const saved=writeSupportCollection(inv,storage);
 assert.deepEqual(readSupportCollection(storage),saved);
 assert.equal(store.size,1,'nessun altro salvataggio modificato');
 assert.throws(()=>equipSupportInstance(saved,0,'escort:missing'),/non posseduto/);
 const damaged=normalizeSupportCollection({...saved,
  equipped:['escort:unknown','escort:unknown'],unlockedSlots:1});
 assert.deepEqual(damaged.equipped,[null,null]);
 assert.equal(damaged.owned[0].level,1);
});
