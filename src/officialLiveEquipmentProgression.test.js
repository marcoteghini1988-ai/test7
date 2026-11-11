// Verifica il percorso VERO delle due collezioni preesistenti verso
// l'Hangar da 24 speciali e il duello LIVE. Inventari isolati nei test:
// nessuna carta regalata a un salvataggio utente o da un pacchetto.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_RIFTS} from './newCombat/phase16ACatalog.js';
import {PHASE16F_MODULES} from './newCombat/phase16FModules.js';
import {LEGACY_EPIC_KEYS,readLegacyEpicProgress} from './officialEpicOwnership.js';
import {MODULE_STORAGE_KEY,moduleCardType,readLegacyModuleLevels,
 MODULE_CARD_TYPES} from './tacticalEquipmentCards.js';
import {readSpecialCollection,updateSpecialCollection,equipSpecialDeck,
 validateSpecialDeck,SPECIAL_PACK_TYPES} from './specialDeckBuilder.js';
import {readShipCollection} from './shipCollection.js';
import {officialSpecialLoadoutAccess} from './officialSpecialLoadoutAccess.js';
import {officialBattleSetup} from './officialBattleSetup.js';

function storage(raw={}){
 const values=new Map(Object.entries(raw)),writes=[];
 return {getItem:k=>values.get(k)??null,
  setItem:(k,v)=>{writes.push(k);values.set(k,v);},values,writes};
}
const saveJson=(store,key,value)=>store.values.set(key,JSON.stringify(value));
function equip(store,card){
 const before=readSpecialCollection(store);
 const equipped=[card,...before.loadout.slice(1)];
 const updated=updateSpecialCollection(c=>equipSpecialDeck(c,equipped),store);
 assert.equal(validateSpecialDeck(updated,updated.loadout).valid,true);
 const reloaded=readSpecialCollection(store);
 assert.deepEqual(reloaded.loadout,updated.loadout);
 return reloaded;
}
const makeBattle=(collection,opts={})=>officialBattleSetup({
 mode:'adventure',sectorNumber:70,bossPlanetId:9,bossSectorLevel:10,
 shipCollection:readShipCollection(opts.storage),specialCollection:collection,
 pilotLevel:opts.pilotLevel??1,epicRiftOpened:opts.epicRiftOpened??false,
 moduleLevels:opts.moduleLevels??{},nowMs:100,seed:1049
}).battle;
const cards=side=>[...side.special.hand,...side.special.deck,...side.special.discard];

test('Tutti i 35 Moduli acquistati raggiungono davvero la battaglia tramite salvataggio, nessun bonus gratis',()=>{
 assert.equal(MODULE_CARD_TYPES.length,35);
 for(const id of Object.keys(PHASE16F_MODULES)){
  const card=moduleCardType(id),s=storage();
  const purchased={ [id]:{unlocked:true,level:3} };
  saveJson(s,MODULE_STORAGE_KEY,purchased);
  const rawBefore=s.getItem(MODULE_STORAGE_KEY);
  const levels=readLegacyModuleLevels(s);
  assert.equal(levels[card],3);
  assert.equal(SPECIAL_PACK_TYPES.includes(card),false,'Moduli esclusi dai pack');
  const collection=equip(s,card);
  assert.equal(collection.owned[card],1,'Una sola carta da acquisto');
  const access=officialSpecialLoadoutAccess(collection.loadout,{
   epicSlotLimit:0,moduleLevels:levels});
  assert.equal(access.valid,true,card);
  const b=makeBattle(collection,{storage:s,moduleLevels:levels});
  assert.equal(b.sides.A.equipmentLevels[card],3,card);
  assert.equal(cards(b.sides.A).length,24);
  assert.equal(cards(b.sides.A).filter(x=>x.type===card).length,1);
  assert.equal(b.sides.A.epic.active,null);
  assert.equal(s.getItem(MODULE_STORAGE_KEY),rawBefore,'Mantenere archivio Moduli');
  assert.ok(s.writes.every(key=>key!=='eclissi_abilities'));
 }
});

test('Modulo non sbloccato o con livello illegittimo non puo essere salvato come giocabile',()=>{
 const card=moduleCardType('aries');
 const initial=readSpecialCollection(storage());
 assert.equal(initial.owned[card],0);
 const falselyOwned={...initial,owned:{...initial.owned,[card]:1}};
 const equipped=equipSpecialDeck(falselyOwned,[card,...initial.loadout.slice(1)]);
 for(const level of [undefined,0,-2,1.5,10,NaN]){
  const levels=level===undefined?{}:{[card]:level};
  const check=officialSpecialLoadoutAccess(equipped.loadout,{
   epicSlotLimit:0,moduleLevels:levels});
  assert.equal(check.reason,'module_not_unlocked',String(level));
  assert.throws(()=>makeBattle(equipped,{storage:storage(),moduleLevels:levels}),
   /Carta Modulo non autorizzata/);
 }
 for(const level of [1,9]){
  assert.equal(officialSpecialLoadoutAccess(equipped.loadout,{
   epicSlotLimit:0,moduleLevels:{[card]:level}}).valid,true);
 }
 // Inventario legacy presente ma locked: non crea alcuna carta posseduta.
 const locked=storage();
 saveJson(locked,MODULE_STORAGE_KEY,{aries:{unlocked:false,level:3}});
 assert.equal(readSpecialCollection(locked).owned[card],0);
 assert.equal(readLegacyModuleLevels(locked)[card],undefined);
});

test('Tutti i sei Epici richiedono Varco/reliquie o acquisto storico, slot pilota e una carta fisica',()=>{
 assert.equal(PHASE16A_RIFTS.length,6);
 for(const rift of PHASE16A_RIFTS){
  const s=storage(),relics=Object.fromEntries(rift.relicsRequired.map(id=>[id,true]));
  saveJson(s,LEGACY_EPIC_KEYS.relics,relics);
  assert.deepEqual(readLegacyEpicProgress(s).unlocked,[],
   'Le due reliquie da sole non creano un Epico');
  assert.equal(readSpecialCollection(s).owned[rift.itemId],0);
  assert.equal(SPECIAL_PACK_TYPES.includes(rift.itemId),false);
  // Un Varco veramente completato cambia il possesso, non equipaggia.
  saveJson(s,LEGACY_EPIC_KEYS.rifts,{[rift.id]:true});
  const progress=readLegacyEpicProgress(s);
  assert.deepEqual(progress.unlocked,[rift.itemId]);
  assert.equal(progress.slotLimit,1);
  const before={relics:s.getItem(LEGACY_EPIC_KEYS.relics),
   rifts:s.getItem(LEGACY_EPIC_KEYS.rifts)};
  const col=equip(s,rift.itemId);
  assert.equal(col.owned[rift.itemId],1);
  assert.equal(officialSpecialLoadoutAccess(col.loadout,{
   epicSlotLimit:progress.slotLimit,moduleLevels:{}}).valid,true);
  const b=makeBattle(col,{storage:s,pilotLevel:1,epicRiftOpened:progress.hasCollapsed});
  assert.deepEqual(b.sides.A.epic.entitlements,[rift.itemId]);
  assert.equal(b.sides.A.epic.active,null);
  assert.equal(cards(b.sides.A).filter(x=>x.type===rift.itemId).length,1);
  assert.equal(s.getItem(LEGACY_EPIC_KEYS.relics),before.relics);
  assert.equal(s.getItem(LEGACY_EPIC_KEYS.rifts),before.rifts);
 }
});

test('Slot Epici: senza L20/Varco sono zero, a L20 uno, a L60 due, mai tre',()=>{
 const rifts=PHASE16A_RIFTS;
 const s=storage();
 saveJson(s,LEGACY_EPIC_KEYS.inventory,
  Object.fromEntries(rifts.slice(0,3).map(r=>[r.itemId,{unlocked:true,level:1}])));
 saveJson(s,LEGACY_EPIC_KEYS.level,19);
 const owned=readSpecialCollection(s);
 const one=equipSpecialDeck(owned,[rifts[0].itemId,...owned.loadout.slice(1)]);
 assert.equal(readLegacyEpicProgress(s).slotLimit,0);
 assert.equal(officialSpecialLoadoutAccess(one.loadout,{epicSlotLimit:0}).reason,'epic_slots');
 assert.throws(()=>makeBattle(one,{storage:s,pilotLevel:19}),/Slot Epici/);
 const oneL20=makeBattle(one,{storage:s,pilotLevel:20});
 assert.ok(oneL20.sides.A.epic.entitlements.includes(rifts[0].itemId));
 const two=equipSpecialDeck(owned,[rifts[0].itemId,rifts[1].itemId,...owned.loadout.slice(2)]);
 assert.equal(officialSpecialLoadoutAccess(two.loadout,{epicSlotLimit:1}).reason,'epic_slots');
 assert.throws(()=>makeBattle(two,{storage:s,pilotLevel:20}),/Slot Epici/);
 assert.equal(officialSpecialLoadoutAccess(two.loadout,{epicSlotLimit:2}).valid,true);
 const battle=makeBattle(two,{storage:s,pilotLevel:60});
 assert.equal(cards(battle.sides.A).filter(c=>c.type.startsWith('epic_item_')).length,2);
 assert.deepEqual(new Set(battle.sides.A.epic.entitlements),
  new Set(rifts.slice(0,3).map(r=>r.itemId)));
 const three=[rifts[0].itemId,rifts[1].itemId,rifts[2].itemId,
  ...owned.loadout.slice(3)];
 assert.equal(validateSpecialDeck(owned,three).reason,'epic_limit');
});

test('Salvataggi Epici/Moduli illeggibili bloccano la conversione senza scrivere sui dati storici',()=>{
 for(const key of [LEGACY_EPIC_KEYS.inventory,MODULE_STORAGE_KEY]){
  const s=storage({[key]:'{not-json'});
  const before=new Map(s.values);
  assert.throws(()=>readSpecialCollection(s));
  assert.deepEqual([...s.values],[...before]);
  assert.equal(s.writes.length,0);
 }
});
