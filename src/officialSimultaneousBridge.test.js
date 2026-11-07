import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_COLLECTION_KEY} from './shipCollection.js';
import {SPECIAL_COLLECTION_KEY,createSpecialCollection} from './specialDeckBuilder.js';
import {createOfficialSimultaneousDuel,officialSimultaneousEligibility,
  officialVisualFleet,officialMotherIntegrity} from './officialSimultaneousBridge.js';
import {advanceTacticalDuel,sealTacticalOrder,TACTICAL_TIMING} from './simultaneousDuelEngine.js';

const memoryStorage=()=>{const data=new Map();return {
 getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};

test('BOSS: tutti i dodici settori autentici migrati, salvataggi incoerenti rimangono su 3D legacy',()=>{
 const ids=[1,2,3,6,7,8,9,11,14,17,19,20];
 ids.forEach((planet,i)=>{
  const n=10+i*10;
  const campaign=officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:n,
   bossPlanetId:planet,bossSectorLevel:10});
  assert.equal(campaign.enabled,true,planet);
  assert.equal(campaign.bossId,planet);
  assert.equal(campaign.reason,'boss_simultaneous');
  const adventure=officialSimultaneousEligibility({gameMode:'adventure',sectorNumber:n,
   bossPlanetId:planet,bossSectorLevel:10});
  assert.equal(adventure.enabled,true,planet);
 });
 assert.equal(officialSimultaneousEligibility({gameMode:'adventure',bossSectorLevel:10}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,bossSectorLevel:10}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:20,
  bossPlanetId:1,bossSectorLevel:10}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'adventure',bossSectorLevel:1}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'classic',selectedBossDeck:'boss_a',
  bossDeckInventory:{boss_a:{unlocked:true}}}).enabled,false);
});
test('Arene ioniche convertite: valgono resistenze temporizzate e modificatori atmosferici',()=>{
 const arena=officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:23});
 assert.equal(arena.enabled,true);
 assert.equal(arena.reason,'official_simultaneous');
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1}).enabled,true);
});
test('mazzo ufficiale equipaggiato: 24 carte e 5 reali in mano, nessuna scrittura',()=>{
 const storage=memoryStorage();
 const special=createSpecialCollection();
 const altered=[...special.loadout].reverse();
 storage.setItem(SPECIAL_COLLECTION_KEY,JSON.stringify({...special,loadout:altered}));
 const before=storage.getItem(SPECIAL_COLLECTION_KEY);
 const setup=createOfficialSimultaneousDuel({gameMode:'classic'},100,storage);
 assert.equal(setup.battle.sides.A.special.hand.length,5);
 assert.equal(setup.battle.sides.A.special.deck.length,19);
 assert.deepEqual(setup.battle.sides.A.special.hand.concat(setup.battle.sides.A.special.deck)
  .map(c=>c.type).sort(),[...altered].sort());
 assert.equal(storage.getItem(SPECIAL_COLLECTION_KEY),before);
 assert.equal(storage.getItem(SHIP_COLLECTION_KEY),null);
});
test('nave posseduta: riproduce livello e scudiere nella grafica originale',()=>{
 const storage=memoryStorage();
 storage.setItem(SHIP_COLLECTION_KEY,JSON.stringify({schemaVersion:1,
  cards:[{instanceId:'ship:N00',shipId:'N00',level:4}],
  loadout:['ship:N00']}));
 const setup=createOfficialSimultaneousDuel({gameMode:'adventure',sectorNumber:2},1234,storage);
 assert.equal(setup.battle.sides.A.shipId,'N00');
 assert.equal(setup.battle.sides.A.level,4);
 assert.equal(setup.battle.sides.A.escorts.length,1);
 const shown=officialVisualFleet(setup.battle.sides.A);
 assert.equal(shown.fleet[0].id,'N00');
 assert.equal(shown.fleet[0].level,4);
 assert.equal(shown.escorts[0].parentShipId,'N00');
 assert.ok(officialMotherIntegrity(setup.battle.sides.A)>0);
});
test('30 s preparazione e 8 s risoluzione: motore autorevole, due giocatori',()=>{
 const storage=memoryStorage();
 const init=createOfficialSimultaneousDuel({gameMode:'classic'},100,storage).battle;
 assert.equal(init.deadlineMs,100+TACTICAL_TIMING.prepareMs);
 const a=sealTacticalOrder(init,'A',{numericIndices:[],specialIndices:[],exchangeIndices:[0]},101);
 assert.equal(a.ok,true);
 const b=sealTacticalOrder(a.battle,'B',{numericIndices:[],specialIndices:[],exchangeIndices:[0]},102);
 assert.equal(b.ok,true);
 const resolution=advanceTacticalDuel(b.battle,102);
 assert.equal(resolution.phase,'resolving');
 assert.equal(resolution.resolveUntilMs,102+TACTICAL_TIMING.resolveMs);
 assert.equal(advanceTacticalDuel(resolution,103).phase,'resolving');
 assert.equal(advanceTacticalDuel(resolution,resolution.resolveUntilMs).phase,'planning');
});
test('salvataggio speciale corrotto: non deve essere riscritto',()=>{
 const storage=memoryStorage();
 storage.setItem(SPECIAL_COLLECTION_KEY,'{invalid-json');
 assert.throws(()=>createOfficialSimultaneousDuel({gameMode:'classic'},100,storage));
 assert.equal(storage.getItem(SPECIAL_COLLECTION_KEY),'{invalid-json');
});
