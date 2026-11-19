import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_RARITIES,rarityUnlockedAtSector,nativeMotherRarity,
 rarityMayBeAcquired,combatLevelForRarity,motherCombatStatsForRarity,
 rarityFromLegacyLevel,RARITY_DUPLICATE_COPIES,LEGENDARY_MOTHER_PROFILES,
 MOTHER_BALANCE_LIMITS,motherBaselinePotential} from './fleetNext/shipRarity.js';
import {readRarityCampaign,claimRarityCampaignVictory,RARITY_CAMPAIGN_KEY}
 from './fleetNext/rarityCampaign.js';
import {CAMPAIGN_SHIP_ORDER,shipMaxLevel} from './fleetNext/progression.js';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};}
test('Quattro rarità, 12 madri e tutte le leggendarie al medesimo potenziale',()=>{
 assert.deepEqual(SHIP_RARITIES,['Comune','Rara','Epica','Leggendaria']);
 assert.equal(RARITY_DUPLICATE_COPIES,3);
 assert.equal(CAMPAIGN_SHIP_ORDER.length,12);
 for(const id of CAMPAIGN_SHIP_ORDER){
  assert.equal(combatLevelForRarity(id,'Leggendaria'),shipMaxLevel(id));
  const stats=motherCombatStatsForRarity('Leggendaria',id);
  assert.equal(stats.maxHp,LEGENDARY_MOTHER_PROFILES[id].maxHp);
  assert.equal(stats.attackPower,LEGENDARY_MOTHER_PROFILES[id].attackPower);
  assert.equal(stats.defensePercent,LEGENDARY_MOTHER_PROFILES[id].defensePercent);
  assert.ok(stats.maxHp>=MOTHER_BALANCE_LIMITS.minLegendaryHp);
  assert.ok(stats.maxHp<=MOTHER_BALANCE_LIMITS.maxLegendaryHp);
  assert.ok(stats.attackPower<=MOTHER_BALANCE_LIMITS.maxLegendaryAttack);
  assert.ok(stats.defensePercent<=MOTHER_BALANCE_LIMITS.maxDefensePercent);
  const rarities=SHIP_RARITIES.map(r=>motherCombatStatsForRarity(r,id));
  assert.ok(rarities.every((x,i)=>i===0||
   x.maxHp>rarities[i-1].maxHp&&x.attackPower>rarities[i-1].attackPower));
  assert.equal(rarityMayBeAcquired('Comune',nativeMotherRarity(id),120),
   ['N00','C01','C02','C03'].includes(id));
 }
 const baseline=CAMPAIGN_SHIP_ORDER.map(id=>motherBaselinePotential(LEGENDARY_MOTHER_PROFILES[id]));
 assert.ok(Math.max(...baseline)/Math.min(...baseline)<1.03,
  'la base matematica delle leggendarie deve restare comparabile');
 assert.equal(motherCombatStatsForRarity('Leggendaria','L04').maxHp,1000);
 assert.ok(motherCombatStatsForRarity('Leggendaria','L03').maxHp>
  motherCombatStatsForRarity('Leggendaria','C01').maxHp);
 assert.ok(motherCombatStatsForRarity('Leggendaria','C01').attackPower>
  motherCombatStatsForRarity('Leggendaria','L03').attackPower);
 assert.equal(rarityFromLegacyLevel('N00',20),'Leggendaria');
 assert.equal(nativeMotherRarity('L04'),'Leggendaria');
});
test('Le rarità si sbloccano solo con la progressione permanente',()=>{
 const store=storage();
 assert.equal(readRarityCampaign(store).rarity,'Comune');
 assert.equal(rarityUnlockedAtSector(24),'Comune');
 assert.equal(rarityUnlockedAtSector(25),'Rara');
 assert.equal(rarityUnlockedAtSector(55),'Epica');
 assert.equal(rarityUnlockedAtSector(85),'Leggendaria');
 assert.equal(claimRarityCampaignVictory('pvp',100,store).granted,false);
 assert.equal(store.getItem(RARITY_CAMPAIGN_KEY),null);
 assert.equal(claimRarityCampaignVictory('campaign',55,store).granted,true);
 assert.equal(readRarityCampaign(store).rarity,'Epica');
 assert.equal(claimRarityCampaignVictory('campaign',25,store).granted,false);
 assert.equal(readRarityCampaign(store).highestSector,55);
 assert.equal(rarityMayBeAcquired('Leggendaria','Comune',55),false);
 assert.equal(rarityMayBeAcquired('Epica','Rara',55),true);
});
