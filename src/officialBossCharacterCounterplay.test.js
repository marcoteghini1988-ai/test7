// Confronto dei veri trofei Carta Personaggio, ottenibili da boss PRECEDENTI.
// Le vittorie sui pianeti precedenti sono una premessa ESPLICITA di questo
// scenario, non incontri realmente simulati. La collezione e comunque
// costruita solo dai veri reward handlers e dallo shop con budget verificato.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {f17dSector,f17dCampaignReward,f17dWalletCap,F17D_START_RESOURCES}
 from './newCombat/phase17DEconomy.js';
import {phase17ExpectedPilotLevel} from './newCombat/phase17Balance.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {readShipCollection,updateShipCollection,upgradeShipCard,equipShipCards} from './shipCollection.js';
import {validateShipUpgradePurchase} from './shipUpgrades.js';
import {readSpecialCollection,createSpecialCollection,equipSpecialDeck} from './specialDeckBuilder.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {bossCharacterTypeForPlanet} from './bossCharacterCards.js';
import {shipsUnlockableBeforeSector} from './officialBossProgressionAudit.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING} from './simultaneousDuelEngine.js';
const seeds=[17,171,2026,4096,8127,919,1337,251,101,517];
function storage(){
 const data=new Map();
 return {getItem:key=>data.get(key)??null,setItem:(key,v)=>data.set(key,v)};
}
async function earnedBeforeBoss(bossIndex){
 const sector=(bossIndex+1)*10,store=storage();
 let dust=F17D_START_RESOURCES.dust;
 for(let n=1;n<sector;n++){
  const {planet,sector:local}=f17dSector(n);
  dust=Math.min(f17dWalletCap(phase17ExpectedPilotLevel(n)),
   dust+f17dCampaignReward(planet,local).dust);
  await claimCampaignShipUnlock('adventure',n,store);
 }
 for(let i=0;i<bossIndex;i++){
  const planet=PHASE16A_CAMPAIGN_PLANETS[i];
  const reward=claimBossCharacterFromVictory({winner:'player',mode:'adventure',
   sectorNumber:(i+1)*10,bossPlanetId:planet.id,bossSectorLevel:10},store);
  assert.equal(reward.granted,true,'trofeo condizionale di boss precedente '+planet.name);
 }
 const shipId=shipsUnlockableBeforeSector(sector).at(-1);
 let ships=readShipCollection(store);
 const instanceId=ships.cards.find(c=>c.shipId===shipId)?.instanceId;
 assert.ok(instanceId);
 for(let target=2;target<=5;target++){
  const permission=validateShipUpgradePurchase(ships,instanceId,target,dust);
  assert.equal(permission.allowed,true,'potenziamento non finanziabile '+shipId+' L'+target);
  ships=upgradeShipCard(ships,instanceId,target);
  dust-=permission.cost;
 }
 ships=equipShipCards(ships,[instanceId]);
 const trophies=readSpecialCollection(store);
 assert.ok(trophies.claimedRewards.length>=bossIndex);
 return {sector,shipId,ships,trophies,dust};
}
function simulate(setup,trophies){
 let b=setup.battle,rounds=0,played=0;
 while(b.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const now=b.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const action=planTacticalAi(b,'A');
  played+=action.specialIndices.filter(i=>trophies.includes(b.sides.A.special.hand[i]?.type)).length;
  const a=sealTacticalOrder(b,'A',action,now);
  assert.equal(a.ok,true,'A '+a.reason);
  const d=sealTacticalOrder(a.battle,'B',planTacticalAi(b,'B'),now+1);
  assert.equal(d.ok,true,'B '+d.reason);
  const resolved=advanceTacticalDuel(d.battle,now+1);
  b=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
  rounds++;
 }
 assert.equal(b.phase,'finished');
 return {winner:b.winner,rounds,played};
}
test('Plutone e Io: starter contro 3 Carte Personaggio VERE ottenute da boss precedenti',async()=>{
 const results=[];
 for(const {index,previous} of [
  {index:6,previous:[1,2,8]}, // Plutone: protezione, assalto, scudiera
  {index:10,previous:[1,2,11]} // Io: protezione, assalto, rigenerazione
 ]){
  const planet=PHASE16A_CAMPAIGN_PLANETS[index],earned=await earnedBeforeBoss(index);
  const types=previous.map(bossCharacterTypeForPlanet);
  assert.ok(types.every(type=>earned.trophies.owned[type]===1));
  const starter=createSpecialCollection();
  const equipped=equipSpecialDeck(earned.trophies,[
   ...types,...earned.trophies.loadout.slice(types.length)]);
  assert.ok(types.every(type=>equipped.loadout.includes(type)));
  assert.ok(types.every(type=>!starter.loadout.includes(type)));
  for(const [variant,specialCollection] of [
   ['starter',starter],['trofei_precedenti',equipped]
  ]){
   let w=0,l=0,d=0,charactersPlayed=0;
   for(const seed of seeds){
    const setup=officialBattleSetup({mode:'adventure',sectorNumber:earned.sector,
     bossPlanetId:planet.id,bossSectorLevel:10,
     shipCollection:earned.ships,specialCollection,seed,nowMs:100,
     selectedPilot:'pilot_com_1',pilotInventory:{pilot_com_1:{unlocked:true,level:1}},
     selectedBossDeck:'neutral_starter',bossDeckInventory:{},pilotLevel:1});
    assert.equal(setup.battle.sides.A.shipId,earned.shipId);
    assert.equal(setup.battle.sides.A.level,5);
    assert.equal(setup.battle.sides.B.bossPlanetId,planet.id);
    const result=simulate(setup,types);
    charactersPlayed+=result.played;
    if(result.winner==='A')w++;
    else if(result.winner==='B')l++;
    else d++;
   }
   results.push({planet:planet.name,ship:earned.shipId,variant,
    previousBossTrophies:variant==='starter'?[]:previous,
    dustAfterUpgrade:earned.dust,w,l,d,charactersPlayed});
  }
 }
 console.log('ECLISSI_BOSS_TROPHY_COUNTERPLAY '+JSON.stringify(results));
 assert.equal(results.length,4);
 assert.ok(results.filter(x=>x.variant==='starter').every(x=>x.charactersPlayed===0));
 assert.ok(results.filter(x=>x.variant==='trofei_precedenti').some(x=>x.charactersPlayed>0),
  'IA deve davvero giocare una Carta Personaggio posseduta');
});
