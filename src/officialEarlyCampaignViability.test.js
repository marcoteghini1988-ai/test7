// Collaudo dei settori Terra 1–9 senza vittorie fittizie o navi anticipate.
// Questo campione NON pretende di simulare la progressione completa di un
// singolo giocatore: ogni settore parte da uno stato possedibile PRIMA del settore.
import test from 'node:test';
import assert from 'node:assert/strict';
import {shipsUnlockableBeforeSector} from './officialBossProgressionAudit.js';
import {readShipCollection,grantShipCard,upgradeShipCard,equipShipCards} from './shipCollection.js';
import {shipUpgradeDustCost,validateShipUpgradePurchase} from './shipUpgrades.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING} from './simultaneousDuelEngine.js';
import {phase17CampaignDustAward} from './newCombat/phase17Balance.js';
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';

const seeds=[17,171,2026,4096,8127];
const pilotInventory={pilot_com_1:{level:1,unlocked:true}};
const initialSpecials=createSpecialCollection();
function makeInventory(sector,shipId,level){
 const available=shipsUnlockableBeforeSector(sector);
 assert.ok(available.includes(shipId),'sblocco non disponibile '+shipId+'/'+sector);
 let dust=100;
 for(let local=1;local<sector;local++)dust+=phase17CampaignDustAward(1,local,false);
 let collection=readShipCollection({getItem:()=>null});
 for(const id of available.slice(1))collection=grantShipCard(collection,id);
 const instanceId=collection.cards.find(c=>c.shipId===shipId).instanceId;
 for(let next=2;next<=level;next++){
  const result=validateShipUpgradePurchase(collection,instanceId,next,dust);
  assert.equal(result.allowed,true,shipId+' L'+next+' settore '+sector);
  assert.equal(result.cost,shipUpgradeDustCost(shipId,next));
  dust-=result.cost;
  collection=upgradeShipCard(collection,instanceId,next);
 }
 collection=equipShipCards(collection,[instanceId]);
 assert.equal(collection.cards.length,available.length);
 return {collection,dust,available};
}
function duel(battle){
 let turns=0;
 while(battle.phase!=='finished'&&turns<TACTICAL_TIMING.maxRounds){
  const now=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const planA=planTacticalAi(battle,'A'),planB=planTacticalAi(battle,'B');
  const a=sealTacticalOrder(battle,'A',planA,now);
  assert.equal(a.ok,true,a.reason);
  const b=sealTacticalOrder(a.battle,'B',planB,now+1);
  assert.equal(b.ok,true,b.reason);
  const resolving=advanceTacticalDuel(b.battle,now+1);
  assert.equal(resolving.phase,'resolving');
  battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
  turns++;
 }
 assert.equal(battle.phase,'finished');
 return {outcome:battle.winner,turns,
  destroyedEnemy:Object.values(battle.sides.B.defense.parts).filter(p=>p.hp===0).length};
}
test('Terra 1–9: osservatorio 5 seed con inventari e budget realmente precedenti al settore',()=>{
 const results=[];
 for(let sector=1;sector<=9;sector++){
  const available=shipsUnlockableBeforeSector(sector);
  const latest=available.at(-1);
  const configs=[{shipId:'N00',level:1},{shipId:'N00',level:2},
   {shipId:latest,level:1},{shipId:latest,level:2}].filter((row,index,all)=>
    all.findIndex(r=>r.shipId===row.shipId&&r.level===row.level)===index);
  for(const {shipId,level} of configs){
   const {collection,dust}=makeInventory(sector,shipId,level);
   let victories=0,defeats=0,draws=0,rounds=0,rivalShip=null;
   for(const seed of seeds){
    const setup=officialBattleSetup({mode:'adventure',sectorNumber:sector,
     bossPlanetId:1,bossSectorLevel:sector,shipCollection:collection,
     specialCollection:initialSpecials,selectedPilot:'pilot_com_1',pilotInventory,
     selectedBossDeck:'neutral_starter',bossDeckInventory:{},nowMs:100,seed});
    assert.equal(setup.bossId,null,'settori 1–9 NON ricevono poteri boss');
    assert.equal(setup.battle.sides.A.shipId,shipId);
    assert.equal(setup.battle.sides.A.level,level);
    if(rivalShip===null)rivalShip=setup.shipB;
    else assert.equal(setup.shipB,rivalShip);
    const result=duel(setup.battle);
    rounds+=result.turns;
    if(result.outcome==='A')victories++;
    else if(result.outcome==='B')defeats++;
    else draws++;
   }
   assert.equal(victories+defeats+draws,seeds.length);
   results.push({sector,shipId,level,rivalShip,dustLeft:dust,victories,defeats,draws,
    avgRounds:Number((rounds/seeds.length).toFixed(1))});
  }
 }
 // Diagnostica riproducibile, non una concessione di vittorie o drop.
 console.log('ECLISSI_TERRA_SECTORS_1_TO_9 '+JSON.stringify(results));
});
