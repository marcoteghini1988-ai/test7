import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {numericBossDeck,activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,equipTacticalBossDeck} from './tacticalBossDecks.js';
import {createTacticalDuel} from './simultaneousDuelEngine.js';

const shipCollection={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],
 loadout:['ship:N00']};
const specialCollection=createSpecialCollection();
const options={mode:'campaign',sectorNumber:1,shipCollection,specialCollection,
 nowMs:1000,seed:39};

test('Gaia convertita: gli altri mazzi non autorizzati restano nel percorso precedente',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_1'),true);
 assert.equal(tacticalBossDeckReady('planet_char_2'),false);
 assert.equal(tacticalBossDeckReady('planet_char_20'),false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_1',bossDeckInventory:{planet_char_1:{unlocked:true,level:2}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_2',bossDeckInventory:{planet_char_2:{unlocked:true,level:1}}}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_1',bossDeckInventory:{}}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:10,
  selectedBossDeck:'planet_char_1',bossDeckInventory:{planet_char_1:{unlocked:true,level:3}}}).enabled,false);
});

test('Gaia L1-L3: Baluardo terrestre usa gli stessi incrementi dello scudo storico',()=>{
 const baseline=officialBattleSetup(options);
 const shield=baseline.battle.sides.A.defense.shield;
 for(const level of [1,2,3]){
  const owned=officialBattleSetup({...options,selectedBossDeck:'planet_char_1',
   bossDeckInventory:{planet_char_1:{unlocked:true,level}}});
  const actual=owned.battle.sides.A.defense.shield;
  const bonusPercent=activeNumericBossAbilities('planet_char_1',level)[0].value;
  const expected=Math.floor(shield.max*bonusPercent/100);
  assert.equal(actual.max,shield.max+expected);
  assert.equal(actual.hp,shield.hp+expected);
  assert.equal(owned.battle.sides.A.bossNumericDeck.shieldBonus,expected);
  assert.equal(owned.battle.sides.A.bossNumericDeck.level,level);
  assert.deepEqual(owned.battle.sides.B.defense.shield,
   baseline.battle.sides.B.defense.shield);
  assert.deepEqual(owned.battle.sides.A.special.hand.map(c=>c.type).sort(),
   baseline.battle.sides.A.special.hand.map(c=>c.type).sort());
 }
 assert.equal(numericBossDeck('planet_char_1').abilities[0].name,'Baluardo terrestre');
});

test('Gaia bloccata non regala HP e non modifica inventario',()=>{
 const inventory={planet_char_1:{unlocked:false,level:3}};
 const original=structuredClone(inventory);
 assert.throws(()=>officialBattleSetup({...options,selectedBossDeck:'planet_char_1',
  bossDeckInventory:inventory}),/Mazzo boss non sbloccato/);
 assert.deepEqual(inventory,original);
 assert.throws(()=>officialBattleSetup({...options,selectedBossDeck:'planet_char_2',
  bossDeckInventory:{planet_char_2:{unlocked:true,level:3}}}),/non sbloccato o ancora non convertito/);
});

test('equipaggiamento Gaia non muta lo stato di partenza del motore',()=>{
 const init=createTacticalDuel({shipA:'N00',shipB:'C01',nowMs:100});
 const original=structuredClone(init.sides.A);
 const boosted=equipTacticalBossDeck(init.sides.A,{id:'planet_char_1',level:3});
 assert.equal(boosted.defense.shield.max,original.defense.shield.max+4);
 assert.deepEqual(init.sides.A,original);
 assert.throws(()=>equipTacticalBossDeck(init.sides.A,{id:'planet_char_19',level:1}),/non ancora convertita/);
});
