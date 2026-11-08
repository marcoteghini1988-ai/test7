// Audit conservativo dei boss 2–12. LE VITTORIE PRECEDENTI SONO
// PRESUPPOSTE per ricostruire inventario e budget massimo, non simulate.
// Nessuna carta boss, epica o special futura assegnata al giocatore.
// Le prove contro i boss sono invece duelli REALI del motore simultaneo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {f17dSector,f17dCampaignReward,f17dWalletCap,F17D_START_RESOURCES}
 from './newCombat/phase17DEconomy.js';
import {phase17ExpectedPilotLevel} from './newCombat/phase17Balance.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {readShipCollection,updateShipCollection,upgradeShipCard,equipShipCards}
 from './shipCollection.js';
import {shipsUnlockableBeforeSector} from './officialBossProgressionAudit.js';
import {validateShipUpgradePurchase} from './shipUpgrades.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING} from './simultaneousDuelEngine.js';

const seeds=[17,171,2026,4096,8127];
const starter=createSpecialCollection();
const ownedPilot={pilot_com_1:{unlocked:true,level:1}};
function storage(){
 const data=new Map();
 return {getItem:key=>data.get(key)??null,setItem:(key,val)=>data.set(key,val)};
}
async function conditionalInventory(bossSector,level){
 const store=storage();
 let dust=F17D_START_RESOURCES.dust;
 for(let sector=1;sector<bossSector;sector++){
  const {planet,sector:local}=f17dSector(sector);
  const reward=f17dCampaignReward(planet,local);
  dust=Math.min(f17dWalletCap(phase17ExpectedPilotLevel(sector)),dust+reward.dust);
  await claimCampaignShipUnlock('adventure',sector,store);
 }
 const shipId=shipsUnlockableBeforeSector(bossSector).at(-1);
 const collection=readShipCollection(store);
 const card=collection.cards.find(c=>c.shipId===shipId);
 assert.ok(card,'nave non ottenibile prima di '+bossSector+': '+shipId);
 let ship=collection;
 let purchased=0,affordable=true;
 for(let next=2;next<=level;next++){
  const result=validateShipUpgradePurchase(ship,card.instanceId,next,dust);
  if(!result.allowed){affordable=false;break;}
  ship=upgradeShipCard(ship,card.instanceId,next);
  dust-=result.cost;
  purchased+=result.cost;
 }
 if(!affordable)return {affordable:false,shipId,dust,purchased};
 return {affordable:true,shipId,shipCollection:equipShipCards(ship,[card.instanceId]),
  dust,purchased};
}
function duel(battle){
 let rounds=0;
 while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const a=sealTacticalOrder(battle,'A',planTacticalAi(battle,'A'),at);
  assert.equal(a.ok,true,'A '+a.reason);
  const b=sealTacticalOrder(a.battle,'B',planTacticalAi(battle,'B'),at+1);
  assert.equal(b.ok,true,'B '+b.reason);
  const resolved=advanceTacticalDuel(b.battle,at+1);
  assert.equal(resolved.phase,'resolving');
  battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
  rounds++;
 }
 assert.equal(battle.phase,'finished');
 return {battle,rounds};
}
test('Boss Marte-Encelado: livelli L3/L5 finanziabili solo da premi precedenti, confronto 5 seed',async()=>{
 const report=[];
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  if(index===0)continue; // Terra 1..10 ha gia un test SEQUENZIALE reale.
  const sector=(index+1)*10;
  for(const level of [3,5]){
   const owned=await conditionalInventory(sector,level);
   if(!owned.affordable){
    report.push({planet:planet.name,sector,shipId:owned.shipId,level,
     affordable:false,dust:owned.dust,spent:owned.purchased});
    continue;
   }
   let wins=0,losses=0,draws=0,rounds=0,enemyDestroyed=0,playerDestroyed=0;
   for(const seed of seeds){
    const setup=officialBattleSetup({mode:'adventure',sectorNumber:sector,
     bossPlanetId:planet.id,bossSectorLevel:10,shipCollection:owned.shipCollection,
     specialCollection:starter,selectedPilot:'pilot_com_1',pilotInventory:ownedPilot,
     pilotLevel:1,selectedBossDeck:'neutral_starter',bossDeckInventory:{},
     nowMs:100,seed});
    assert.equal(setup.battle.sides.A.shipId,owned.shipId);
    assert.equal(setup.battle.sides.A.level,level);
    assert.equal(setup.battle.sides.A.bossNumericDeck??null,null,
     'non possiede gratis il mazzo del boss precedente');
    assert.equal(setup.battle.sides.B.bossPlanetId,planet.id);
    assert.equal(setup.battle.sides.B.bossNumericDeck.id,planet.deck);
    const result=duel(setup.battle);
    rounds+=result.rounds;
    enemyDestroyed+=Object.values(result.battle.sides.B.defense.parts).filter(x=>x.hp===0).length;
    playerDestroyed+=Object.values(result.battle.sides.A.defense.parts).filter(x=>x.hp===0).length;
    assert.equal(officialBattleResult(result.battle,'adventure',sector).eligibleForRewards,
     result.battle.winner==='A');
    if(result.battle.winner==='A')wins++;
    else if(result.battle.winner==='B')losses++;
    else draws++;
   }
   report.push({planet:planet.name,sector,shipId:owned.shipId,level,
    affordable:true,spent:owned.purchased,dustRemaining:owned.dust,
    wins,losses,draws,meanRounds:+(rounds/seeds.length).toFixed(1),
    meanBossKo:+(enemyDestroyed/seeds.length).toFixed(1),
    meanPlayerKo:+(playerDestroyed/seeds.length).toFixed(1)});
  }
 }
 console.log('ECLISSI_BOSS_POST_TERRA_BUDGET '+JSON.stringify(report));
 assert.equal(report.length,11*2);
 assert.ok(report.every(row=>!row.affordable||row.wins+row.losses+row.draws===5));
});
