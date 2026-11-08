import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {officialCampaignRivalLevel,OFFICIAL_CAMPAIGN_RIVAL_PHASE_SIZE}
 from './officialCampaignRivalScaling.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';

const collection=(shipId,level)=>({
 cards:[{instanceId:'owned:'+shipId,shipId,level}],
 loadout:['owned:'+shipId]
});
const specials=createSpecialCollection();
test('120 settori distribuiscono 5 livelli rivali senza imitare upgrade giocatore',()=>{
 assert.equal(OFFICIAL_CAMPAIGN_RIVAL_PHASE_SIZE,24);
 const distribution=[0,0,0,0,0];
 for(let sector=1;sector<=120;sector++){
  const expected=Math.min(5,Math.floor((sector-1)/24)+1);
  distribution[expected-1]++;
  for(const level of [1,2,3,4,5]){
   for(const mode of ['adventure','campaign']){
    assert.equal(officialCampaignRivalLevel({mode,sectorNumber:sector,playerLevel:level}),expected);
   }
  }
 }
 assert.deepEqual(distribution,[24,24,24,24,24]);
 for(const sector of [0,-5,121,200,1.5]){
  assert.equal(officialCampaignRivalLevel({mode:'campaign',sectorNumber:sector,playerLevel:5}),5);
 }
 assert.equal(officialCampaignRivalLevel({mode:'pvp',sectorNumber:10,playerLevel:5}),5);
 assert.equal(officialCampaignRivalLevel({mode:'classic',sectorNumber:10,playerLevel:3}),3);
});

test('Il primo boss resta L1 sia contro N00 L1 sia dopo upgrade legittimo a L5',()=>{
 const planet=PHASE16A_CAMPAIGN_PLANETS[0];
 for(const [id,level] of [['N00',1],['C01',3],['L04',5]]){
  const setup=officialBattleSetup({
   mode:'campaign',sectorNumber:10,bossPlanetId:planet.id,bossSectorLevel:10,
   shipCollection:collection(id,level),specialCollection:specials,seed:171,nowMs:100
  });
  const duel=setup.battle;
  assert.equal(duel.sides.A.level,level);
  assert.equal(duel.sides.B.level,1);
  assert.equal(duel.sides.B.bossPlanetId,planet.id);
  assert.equal(duel.sides.B.bossNumericDeck.id,planet.deck);
  assert.equal(duel.sides.A.escorts.length,level>=5?2:level>=3?1:0);
  assert.equal(duel.sides.B.escorts.length,0,'L1 del boss non eredita le scudiere del giocatore');
 }
});
test('I dodici boss mantengono arene e pilotaggi, ma crescono per progressione e non acquisti',()=>{
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const sector=(i+1)*10;
  const expected=officialCampaignRivalLevel({mode:'campaign',sectorNumber:sector,playerLevel:1});
  const variants=[];
  for(const level of [1,5]){
   const setup=officialBattleSetup({
    mode:'campaign',sectorNumber:sector,bossPlanetId:planet.id,bossSectorLevel:10,
    shipCollection:collection('N00',level),specialCollection:specials,seed:171,nowMs:100
   });
   const b=setup.battle;
   assert.equal(b.sides.B.level,expected,planet.name);
   assert.equal(b.arenaId,'boss_'+planet.id);
   assert.equal(b.sides.B.bossExclusive.id,planet.id);
   variants.push({ship:b.sides.B.shipId,level:b.sides.B.level,
    pilot:b.sides.B.commander?.id,deck:b.sides.B.bossNumericDeck?.id});
  }
  assert.deepEqual(variants[0],variants[1],'Il nemico non deve potenziarsi quando potenzio N00');
 }
 assert.equal(PHASE1_CATALOG.ships.length,17);
});
