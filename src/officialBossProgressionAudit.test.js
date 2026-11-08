import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {SHIP_CAMPAIGN_UNLOCKS,claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {readShipCollection,updateShipCollection,equipShipCards} from './shipCollection.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {shipsUnlockableBeforeSector,bossPreparationMilestone} from './officialBossProgressionAudit.js';

function store(){
 const records=new Map();
 return {getItem:key=>records.get(key)??null,
  setItem:(key,val)=>records.set(key,val)};
}

test('Tutti i 12 boss leggono soltanto le navi sbloccate prima della vittoria',async()=>{
 const collected=store();
 const specials=createSpecialCollection();
 const printed=[];
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const sector=(index+1)*10;
  for(const reward of SHIP_CAMPAIGN_UNLOCKS.filter(item=>item.sector<sector)){
   await claimCampaignShipUnlock('adventure',reward.sector,collected);
  }
  const milestone=bossPreparationMilestone(sector);
  assert.equal(milestone.globalSector,sector);
  assert.equal(milestone.planetId,planet.id);
  assert.equal(milestone.planetName,planet.name);
  assert.deepEqual(milestone.unlockableShips,shipsUnlockableBeforeSector(sector));
  assert.deepEqual(readShipCollection(collected).cards.map(c=>c.shipId),
   milestone.unlockableShips,'La simulazione non inventa navi al settore '+sector);
  const sameSectorReward=SHIP_CAMPAIGN_UNLOCKS.find(r=>r.sector===sector);
  assert.equal(milestone.shipRewardOnlyAfterVictory,sameSectorReward?.shipId??null);
  assert.equal(milestone.unlockableShips.includes(sameSectorReward?.shipId),false,
   'La nave del premio boss non può combattere il boss che la sblocca');
  const mother=readShipCollection(collected).cards.at(-1);
  await updateShipCollection(c=>equipShipCards(c,[mother.instanceId]),collected);
  const battle=officialBattleSetup({mode:'adventure',sectorNumber:sector,
   bossPlanetId:planet.id,bossSectorLevel:10,
   shipCollection:readShipCollection(collected),specialCollection:specials,
   selectedPilot:'pilot_com_1',pilotInventory:{pilot_com_1:{unlocked:true,level:1}},
   nowMs:100,seed:171}).battle;
  assert.equal(battle.sides.A.shipId,milestone.latestShip);
  assert.equal(battle.sides.B.level,milestone.enemyLevel);
  assert.equal(battle.sides.B.bossPlanetId,planet.id);
  assert.equal(battle.sides.A.special.hand.length,5);
  assert.equal(battle.sides.A.numeric.hand.length,7);
  printed.push({planet:planet.name,sector,
   latestPreBossShip:milestone.latestShip,
   rivalLevel:milestone.enemyLevel,
   rewardAfterVictory:milestone.shipRewardOnlyAfterVictory});
 }
 console.log('ECLISSI_12_BOSS_UNLOCK_GATES '+JSON.stringify(printed));
});
test('Gli sblocchi non vengono concessi sul medesimo settore e non si basano su ID planetari',()=>{
 for(const n of [0,-1,121,3.5,NaN])assert.throws(()=>shipsUnlockableBeforeSector(n));
 for(const n of [1,9,11,121,200,10.5])assert.throws(()=>bossPreparationMilestone(n));
 assert.deepEqual(shipsUnlockableBeforeSector(10),['N00','C01','C02','C03']);
 assert.equal(bossPreparationMilestone(40).planetId,6,'Saturno ID storico 6 e boss globale 40');
 assert.equal(bossPreparationMilestone(120).planetId,20,'Encelado ID storico 20 e boss globale 120');
 assert.equal(bossPreparationMilestone(10).shipRewardOnlyAfterVictory,null);
 assert.equal(bossPreparationMilestone(20).shipRewardOnlyAfterVictory,'R02');
 assert.equal(bossPreparationMilestone(120).shipRewardOnlyAfterVictory,null);
});
