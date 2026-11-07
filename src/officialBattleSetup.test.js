import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {TACTICAL_TIMING} from './simultaneousDuelEngine.js';

const owned={cards:[{instanceId:'ship:N00',shipId:'N00',level:1}],loadout:['ship:N00']};
const special=createSpecialCollection();
test('la campagna usa la navicella equipaggiata e le 24 speciali possedute',()=>{
 const result=officialBattleSetup({mode:'campaign',sectorNumber:1,shipCollection:owned,
  specialCollection:special,nowMs:1000});
 assert.equal(result.shipA,'N00');
 assert.deepEqual(result.battle.sides.A.special.hand.concat(result.battle.sides.A.special.deck)
  .map(c=>c.type).sort(),[...special.loadout].sort());
 assert.equal(result.battle.sides.A.numeric.hand.length,7);
 assert.equal(result.battle.sides.A.special.hand.length,5);
 assert.equal(result.battle.phase,'planning');
 assert.equal(result.battle.deadlineMs,1000+TACTICAL_TIMING.prepareMs);
});
test('una collezione danneggiata non viene sostituita da una nave o mazzo di prova',()=>{
 assert.throws(()=>officialBattleSetup({shipCollection:{cards:[],loadout:['missing']},
  specialCollection:special}),/madre equipaggiata/);
 assert.throws(()=>officialBattleSetup({shipCollection:owned,
  specialCollection:{...special,loadout:special.loadout.slice(1)}}),/Mazzo speciale/);
});
test('un boss della campagna riceve il piano proprio, senza dare carte al giocatore',()=>{
 const result=officialBattleSetup({mode:'campaign',sectorNumber:10,bossPlanetId:1,
  bossSectorLevel:10,shipCollection:owned,specialCollection:special,nowMs:2000});
 assert.equal(result.bossId,1);
 assert.equal(result.battle.sides.B.bossPlanetId,1);
 assert.deepEqual(result.battle.sides.A.special.hand.concat(result.battle.sides.A.special.deck)
  .map(c=>c.type).sort(),[...special.loadout].sort());
});
test('le ricompense si abilitano solo a vittoria conclusa non PvP',()=>{
 const result=officialBattleSetup({shipCollection:owned,specialCollection:special,nowMs:100});
 assert.throws(()=>officialBattleResult(result.battle,'campaign',1),/non ancora concluso/);
 const won={...result.battle,phase:'finished',round:3,winner:'A'};
 const lost={...won,winner:'B'};
 assert.equal(officialBattleResult(won,'campaign',1).eligibleForRewards,true);
 assert.equal(officialBattleResult(lost,'campaign',1).eligibleForRewards,false);
 assert.equal(officialBattleResult(won,'pvp',1).eligibleForRewards,false);
 assert.equal(officialBattleResult(won,'classic',1).eligibleForRewards,false);
 assert.equal(officialBattleResult(won,'daily_challenge',1).eligibleForRewards,false);
 assert.equal(officialBattleResult(won,'adventure',1).eligibleForRewards,true);
});

test('pescata numerica iniziale davvero casuale: 52 carte distinte, 7 in mano',()=>{
 const start=seed=>officialBattleSetup({mode:'campaign',sectorNumber:1,
  shipCollection:owned,specialCollection:special,seed,nowMs:100});
 const a=start(173),b=start(9876);
 for(const game of [a,b]){
  for(const side of [game.battle.sides.A,game.battle.sides.B]){
   const cards=[...side.numeric.hand,...side.numeric.deck,...side.numeric.discard];
   assert.equal(cards.length,52);
   assert.equal(new Set(cards.map(c=>c.id)).size,52);
   assert.equal(side.numeric.hand.length,7);
  }
 }
 assert.notDeepEqual(a.battle.sides.A.numeric.hand.map(c=>c.id),
  b.battle.sides.A.numeric.hand.map(c=>c.id));
});
