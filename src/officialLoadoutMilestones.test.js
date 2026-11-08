import test from 'node:test';
import assert from 'node:assert/strict';
import {initialSelectedPilot,missingPilotInventory,terraNineModuleVictory,
 TERRA_STARTER_MODULE_BY_PILOT} from './officialLoadoutMilestones.js';
import {PHASE16F_MODULES} from './newCombat/phase16FModules.js';
import {readSpecialCollection} from './specialDeckBuilder.js';
import {MODULE_STORAGE_KEY,readLegacyModuleLevels,moduleCardType}
 from './tacticalEquipmentCards.js';

test('Registrazione: una selezione di pilota salvata NON crea un inventario posseduto',()=>{
 assert.deepEqual(missingPilotInventory(),{pilot_com_1:{level:1,unlocked:true}});
 assert.equal(initialSelectedPilot('pilot_leg_1',null),'pilot_com_1');
 assert.equal(initialSelectedPilot('pilot_boss_19','{non-json'),'pilot_com_1');
 assert.equal(initialSelectedPilot('pilot_boss_1',JSON.stringify({
  pilot_com_1:{level:1,unlocked:true}
 })),'pilot_com_1');
 assert.equal(initialSelectedPilot('pilot_com_3',JSON.stringify({
  pilot_com_3:{level:1,unlocked:true}
 })),'pilot_com_3','licenza comune ottenuta davvero durante registrazione');
 assert.equal(initialSelectedPilot('pilot_boss_19',JSON.stringify({
  pilot_com_3:{unlocked:true,level:1},
  pilot_boss_19:{unlocked:false,level:1}
 })),'pilot_com_3','una carta bloccata non va equipaggiata');
 assert.equal(initialSelectedPilot('pilot_starter_1',JSON.stringify({
  pilot_starter_1:{unlocked:true,level:1}
 })),'pilot_com_1','migrazione della vecchia licenza starter');
});
test('Terra 9: Modulo si ottiene soltanto con VITTORIA, non all ingresso o col pareggio',()=>{
 assert.equal(Object.keys(TERRA_STARTER_MODULE_BY_PILOT).length,4);
 for(const [selectedPilot,expected] of Object.entries(TERRA_STARTER_MODULE_BY_PILOT)){
  assert.ok(Object.hasOwn(PHASE16F_MODULES,expected));
  for(const winner of ['enemy','draw',null,undefined])
   assert.equal(terraNineModuleVictory({winner,mode:'adventure',planetId:1,
    sectorLevel:9,selectedPilot,abilities:{}}),null,'nessuna carta senza vittoria');
  for(const sectorLevel of [8,10,20])
   assert.equal(terraNineModuleVictory({winner:'player',mode:'adventure',
    planetId:1,sectorLevel,selectedPilot,abilities:{}}),null);
  assert.equal(terraNineModuleVictory({winner:'player',mode:'pvp',
   planetId:1,sectorLevel:9,selectedPilot,abilities:{}}),null);
  assert.equal(terraNineModuleVictory({winner:'player',mode:'adventure',
   planetId:3,sectorLevel:9,selectedPilot,abilities:{}}),null);
  assert.equal(terraNineModuleVictory({winner:'player',mode:'adventure',
   planetId:1,sectorLevel:9,selectedPilot,abilities:{}}),expected);
  assert.equal(terraNineModuleVictory({winner:'player',mode:'adventure',
   planetId:1,sectorLevel:9,selectedPilot,
   abilities:{taurus:{unlocked:true,level:1}}}),null,
   'non duplicare premio con equipaggiamento gia acquistato');
 }
});
test('Premio modulo Terra S9: Carta Speciale autentica, non equipaggiata automaticamente',()=>{
 const moduleId=terraNineModuleVictory({winner:'player',mode:'adventure',planetId:1,
  sectorLevel:9,selectedPilot:'pilot_com_2',abilities:{}});
 const store=new Map([[MODULE_STORAGE_KEY,JSON.stringify({
  [moduleId]:{unlocked:true,level:1}
 })]]);
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const levels=readLegacyModuleLevels(storage);
 const card=moduleCardType(moduleId);
 assert.equal(levels[card],1);
 const collection=readSpecialCollection(storage);
 assert.equal(collection.owned[card],1);
 assert.equal(collection.loadout.includes(card),false,
  'bisogna inserire la carta nel mazzo fisico da 24: nessun potere passivo');
 assert.equal(collection.loadout.length,24);
 assert.equal(collection.openedPacks,0);
});
