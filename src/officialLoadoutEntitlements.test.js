import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_NUMERIC_DECK_IDS,numericBossDeck,activeNumericBossAbilities}
 from './bossNumericDecks.js';
import {officialSimultaneousEligibility,createOfficialSimultaneousDuel}
 from './officialSimultaneousBridge.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection,readSpecialCollection,updateSpecialCollection,
 equipSpecialDeck} from './specialDeckBuilder.js';
import {PHASE16F_MODULES} from './newCombat/phase16FModules.js';
import {MODULE_CARD_TYPES,MODULE_STORAGE_KEY,moduleCardType,readLegacyModuleLevels}
 from './tacticalEquipmentCards.js';

const ships={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],
 loadout:['ship:N00']};
const specials=createSpecialCollection();
const storage=()=>{const map=new Map();return {
 getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};};
const setup=extra=>officialBattleSetup({
 mode:'campaign',sectorNumber:1,shipCollection:ships,
 specialCollection:specials,selectedBossDeck:'neutral_starter',seed:171,nowMs:100,
 ...extra
});

test('12 mazzi numerici: solo inventario sbloccato e grado posseduto, mai passive gratis',()=>{
 assert.equal(BOSS_NUMERIC_DECK_IDS.length,12);
 for(const id of BOSS_NUMERIC_DECK_IDS){
  const definition=numericBossDeck(id);
  assert.ok([3,6,9].includes(definition.maxLevel));
  assert.throws(()=>setup({selectedBossDeck:id,bossDeckInventory:{}}),
   /Mazzo boss non sbloccato/,id);
  assert.throws(()=>setup({selectedBossDeck:id,
   bossDeckInventory:{[id]:{unlocked:false,level:9}}}),
   /Mazzo boss non sbloccato/,id);
  for(const level of [1,3,4,6,7,9]){
   const a=setup({selectedBossDeck:id,
    bossDeckInventory:{[id]:{unlocked:true,level}}}).battle.sides.A;
   const actual=Math.min(definition.maxLevel,level);
   assert.equal(a.bossNumericDeck.id,id);
   assert.equal(a.bossNumericDeck.level,actual);
   assert.equal(activeNumericBossAbilities(id,actual)
    .filter(passive=>passive.unlocked).length,Math.ceil(actual/3),
    'solo passive dei gradi effettivamente ottenuti: '+id+' L'+actual);
   assert.equal(a.bossExclusive,null,'poteri esclusivi nemici non sono regalati al giocatore');
   assert.equal(a.special.hand.length+a.special.deck.length,24);
   assert.equal(a.numeric.hand.length+a.numeric.deck.length,52);
  }
 }
 const neutral=setup({selectedBossDeck:'neutral_starter'}).battle.sides.A;
 assert.equal(neutral.bossNumericDeck??null,null);
});

test('35 moduli: acquisto storico necessario, una vera carta nel mazzo; nessuna abilitazione passiva',()=>{
 assert.equal(MODULE_CARD_TYPES.length,35);
 assert.equal(Object.keys(PHASE16F_MODULES).length,35);
 const chosen=moduleCardType('aries');
 const store=storage();
 let start=readSpecialCollection(store);
 assert.equal(start.owned[chosen],0);
 assert.equal(start.loadout.includes(chosen),false);
 assert.throws(()=>equipSpecialDeck(start,[chosen,...start.loadout.slice(1)]),
  /non possiedi|non possed|Non possiedi/);
 store.setItem(MODULE_STORAGE_KEY,JSON.stringify({aries:{unlocked:true,level:4}}));
 assert.deepEqual(readLegacyModuleLevels(store),{[chosen]:4});
 const unlocked=readSpecialCollection(store);
 assert.equal(unlocked.owned[chosen],1);
 assert.equal(unlocked.loadout.includes(chosen),false,
  'il modulo acquistato non si autoattiva');
 const before=store.getItem(MODULE_STORAGE_KEY);
 updateSpecialCollection(c=>equipSpecialDeck(c,[chosen,...c.loadout.slice(1)]),store);
 assert.equal(store.getItem(MODULE_STORAGE_KEY),before,'inventario legacy non riscritto');
 const game=createOfficialSimultaneousDuel({gameMode:'campaign',sectorNumber:1,
  },100,store);
 const a=game.battle.sides.A;
 assert.equal(a.equipmentLevels[chosen],4);
 assert.equal([...a.special.hand,...a.special.deck].filter(c=>c.type===chosen).length,1);
 assert.equal(a.special.hand.length+a.special.deck.length,24);
 assert.equal(game.battle.history.length,0,'equip non attiva effetti senza giocare carta');
 assert.throws(()=>officialBattleSetup({
  mode:'campaign',sectorNumber:1,shipCollection:ships,
  specialCollection:readSpecialCollection(store),moduleLevels:{},
 }),/Carta Modulo non autorizzata/);
});
