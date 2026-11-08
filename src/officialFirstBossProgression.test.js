// Audit di progressione del primo boss: nessuna nave, polvere o carta gratuita.
// Il test costruisce gli inventari usando gli stessi premi e acquisti della UI.
// Le vittorie 1..9 e le stelle sono IPOTESI esplicite: non si simulano i combattimenti.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {phase17CampaignDustAward} from './newCombat/phase17Balance.js';
import {F17D_START_RESOURCES,f17dCapsuleReward} from './newCombat/phase17DEconomy.js';
import {readShipCollection,updateShipCollection,upgradeShipCard,equipShipCards}
 from './shipCollection.js';
import {claimCampaignShipUnlock,SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {validateShipUpgradePurchase,shipUpgradeDustCost} from './shipUpgrades.js';
import {claimFirstWinSpecialPack,readSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';
import {planTacticalAi} from './tacticalDuelAi.js';

function storage(){
 const entries=new Map();
 return {getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
}
const startingPilot={pilot_com_1:{level:1,unlocked:true}};
async function prepareFirstBoss({shipId='C03',starsPerSector=1,claimCapsule=false}={}){
 const store=storage();
 let dust=F17D_START_RESOURCES.dust;
 assert.equal(dust,100);
 let stars=0,capsules=0;
 for(let sector=1;sector<=9;sector++){
  // Ogni ricompensa richiede una vittoria effettiva del settore (premessa dello scenario).
  dust=Math.min(1500,dust+phase17CampaignDustAward(1,sector,false));
  stars+=starsPerSector;
  const pack=claimFirstWinSpecialPack('adventure',sector,store);
  assert.equal(pack.granted,true);
  await claimCampaignShipUnlock('adventure',sector,store);
  if(claimCapsule&&stars>=15&&capsules===0){
   dust=Math.min(1500,dust+f17dCapsuleReward(15).dust);
   capsules=1;
  }
 }
 const before=readShipCollection(store);
 assert.deepEqual(before.cards.map(c=>c.shipId),['N00','C01','C02','C03']);
 const card=before.cards.find(c=>c.shipId===shipId);
 assert.ok(card,'Solo navicelle sbloccate fino a Terra settore 9: '+shipId);
 let purchased=0;
 for(let next=2;next<=5;next++){
  const current=readShipCollection(store);
  const check=validateShipUpgradePurchase(current,card.instanceId,next,dust);
  if(!check.allowed)break;
  assert.equal(check.cost,shipUpgradeDustCost(shipId,next));
  await updateShipCollection(c=>upgradeShipCard(c,card.instanceId,next),store);
  dust-=check.cost;purchased+=check.cost;
 }
 await updateShipCollection(c=>equipShipCards(c,[card.instanceId]),store);
 const ships=readShipCollection(store),specials=readSpecialCollection(store);
 return {ships,specials,dust,stars,capsules,purchased,
  level:ships.cards.find(c=>c.shipId===shipId).level};
}

test('Terra 10: il catalogo non anticipa mai la quarta nave, la prima rara o una leggendaria',async()=>{
 const before=await prepareFirstBoss();
 assert.equal(before.stars,9);
 assert.equal(before.capsules,0);
 assert.equal(before.level,4,'Senza capsule 1000 polvere non pagano 1080 di upgrade L5');
 assert.equal(before.purchased,580);
 assert.equal(before.dust,420);
 assert.equal(before.specials.packCredits,9,'Crediti premio non equivalgono a carte estratte');
 assert.equal(before.specials.openedPacks,0,'Nessun pacchetto aperto automaticamente');
 assert.equal(before.specials.loadout.length,24);
 assert.equal(SHIP_CAMPAIGN_UNLOCKS.filter(r=>r.sector<10).length,3);
 for(const id of ['R01','R04','E01','L04']){
  assert.equal(before.ships.cards.some(c=>c.shipId===id),false,id+' impossibile prima di Terra10');
 }
 const withCapsule=await prepareFirstBoss({starsPerSector:2,claimCapsule:true});
 assert.equal(withCapsule.level,5,'Una capsula riscattata dopo 15 stelle rende accessibile il livello 5');
 assert.equal(withCapsule.stars,18);
 assert.equal(withCapsule.capsules,1);
 assert.equal(withCapsule.purchased,1080);
 assert.equal(withCapsule.dust,80);
 const withoutClaim=await prepareFirstBoss({starsPerSector:2,claimCapsule:false});
 assert.equal(withoutClaim.level,4,'Le stelle senza riscatto NON regalano polvere');
});

test('Boss Terra settore 10: prove con madri veramente ottenibili, pilota e 24 speciali reali',async()=>{
 const planet=PHASE16A_CAMPAIGN_PLANETS[0];
 const configs=[
  {shipId:'N00',starsPerSector:1,claimCapsule:false},
  {shipId:'C01',starsPerSector:1,claimCapsule:false},
  {shipId:'C02',starsPerSector:1,claimCapsule:false},
  {shipId:'C03',starsPerSector:1,claimCapsule:false},
  {shipId:'C03',starsPerSector:2,claimCapsule:true}
 ];
 const seeds=[17,18,171,919,1337,2026,777];
 const observed=[];
 for(const config of configs){
  const prepared=await prepareFirstBoss(config);
  let wins=0,losses=0,draws=0,cycles=0,damageOnBoss=0,exposedOnBoss=0;
  for(const seed of seeds){
   let battle=officialBattleSetup({mode:'adventure',sectorNumber:10,
    bossPlanetId:planet.id,bossSectorLevel:10,shipCollection:prepared.ships,
    specialCollection:prepared.specials,selectedPilot:'pilot_com_1',
    pilotInventory:startingPilot,nowMs:100,seed}).battle;
   assert.equal(battle.sides.A.shipId,config.shipId);
   assert.equal(battle.sides.A.level,prepared.level);
   assert.equal(battle.sides.A.commander?.id,'pilot_com_1');
   assert.equal(battle.sides.B.bossPlanetId,planet.id);
   assert.equal(battle.sides.B.bossNumericDeck.id,planet.deck);
   let rounds=0;
   while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
    const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
    const orderA=sealTacticalOrder(battle,'A',planTacticalAi(battle,'A'),at);
    assert.equal(orderA.ok,true,config.shipId+' A: '+orderA.reason);
    const orderB=sealTacticalOrder(orderA.battle,'B',planTacticalAi(battle,'B'),at+1);
    assert.equal(orderB.ok,true,config.shipId+' B: '+orderB.reason);
    const resolved=advanceTacticalDuel(orderB.battle,at+1);
    assert.equal(resolved.phase,'resolving');
    battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
    rounds++;
   }
   assert.equal(battle.phase,'finished');
   assert.ok(rounds<=20);
   const outcome=officialBattleResult(battle,'adventure',10);
   assert.equal(outcome.eligibleForRewards,battle.winner==='A');
   if(battle.winner==='A')wins++;
   else if(battle.winner==='B')losses++;
   else draws++;
   cycles+=rounds;
   damageOnBoss+=Object.values(battle.sides.B.defense.parts).reduce((sum,p)=>sum+(p.max-p.hp),0);
   exposedOnBoss+=Object.values(battle.sides.B.defense.parts).filter(p=>p.exposed).length;
  }
  assert.equal(wins+losses+draws,seeds.length);
  observed.push({shipId:config.shipId,level:prepared.level,
   capsule:prepared.capsules,remainingDust:prepared.dust,
   wins,losses,draws,meanCycles:Number((cycles/seeds.length).toFixed(2)),
   meanBossVitalDamage:Number((damageOnBoss/seeds.length).toFixed(2)),
   meanBossVitalsExposed:Number((exposedOnBoss/seeds.length).toFixed(2))});
 }
 console.log('ECLISSI_TERRA10_REACHABLE '+JSON.stringify(observed));
});
