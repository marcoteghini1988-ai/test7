// Audit del primo boss con il percorso di ricompense e acquisto ufficiali.
// Non assegna carte navicella, Epici, mazzi boss o speciali che il giocatore
// non puo' avere ottenuto entro Terra/settore 9; eventuali capsule e replay
// sono ESCLUSI in questo scenario conservativo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readShipCollection,updateShipCollection,upgradeShipCard,equipShipCards} from './shipCollection.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {shipUpgradeDustCost,validateShipUpgradePurchase} from './shipUpgrades.js';
import {readSpecialCollection,claimFirstWinSpecialPack,STARTER_SPECIAL_COUNTS} from './specialDeckBuilder.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {phase17CampaignDustAward} from './newCombat/phase17Balance.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING} from './simultaneousDuelEngine.js';

const INITIAL_DUST=100;
const BEGINNER_PILOT_ID='pilot_com_1';
const BEGINNER_PILOT_INVENTORY=Object.freeze({pilot_com_1:{level:1,unlocked:true}});
const seeds=[17,171,2026,4096,8127];
function memoryStorage(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v)};
}
async function wonSectorsOneThroughNine(){
 const store=memoryStorage();
 let dust=INITIAL_DUST;
 const snapshots=[];
 for(let sector=1;sector<10;sector++){
  // Importi stabiliti nel controller App (prima vittoria, senza replay).
  dust+=phase17CampaignDustAward(1,sector,false);
  await claimCampaignShipUnlock('adventure',sector,store);
  assert.equal(claimFirstWinSpecialPack('adventure',sector,store).granted,true);
  snapshots.push({sector,dust,ships:readShipCollection(store).cards.map(x=>x.shipId)});
 }
 return {store,dust,snapshots};
}
async function shipAtLevelFromActualCollection(shipId,level){
 const {store,dust:earnedDust}=await wonSectorsOneThroughNine();
 const before=readShipCollection(store);
 const card=before.cards.find(x=>x.shipId===shipId);
 assert.ok(card,'la nave deve essere sbloccata PRIMA del boss Terra: '+shipId);
 let wallet=earnedDust;
 for(let next=2;next<=level;next++){
  const current=readShipCollection(store);
  const approval=validateShipUpgradePurchase(current,card.instanceId,next,wallet);
  assert.equal(approval.allowed,true,shipId+' L'+next+' budget '+wallet);
  await updateShipCollection(c=>upgradeShipCard(c,card.instanceId,next),store);
  wallet-=approval.cost;
 }
 const collection=await updateShipCollection(c=>equipShipCards(c,[card.instanceId]),store);
 return {collection,specialCollection:readSpecialCollection(store),earnedDust,dustRemaining:wallet};
}
function playBattle(battle){
 let rounds=0;
 while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const planA=planTacticalAi(battle,'A'),planB=planTacticalAi(battle,'B');
  assert.ok(planA&&planB);
  const a=sealTacticalOrder(battle,'A',planA,at);
  assert.equal(a.ok,true,'ordine A '+a.reason);
  const b=sealTacticalOrder(a.battle,'B',planB,at+1);
  assert.equal(b.ok,true,'ordine B '+b.reason);
  const resolved=advanceTacticalDuel(b.battle,at+1);
  assert.equal(resolved.phase,'resolving');
  battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
  rounds++;
 }
 assert.equal(battle.phase,'finished');
 assert.ok(rounds<=20);
 return {battle,rounds};
}

test('Prima di Terra 10: soltanto 4 madri, 1000 Polvere incluse 100 iniziali, 9 crediti pacchetto non aperti',async()=>{
 const {store,dust,snapshots}=await wonSectorsOneThroughNine();
 assert.equal(dust,1000,'900 ottenute nei settori 1-9, 100 iniziali');
 assert.deepEqual(snapshots[2].ships,['N00','C01']);
 assert.deepEqual(snapshots[5].ships,['N00','C01','C02']);
 assert.deepEqual(snapshots[8].ships,['N00','C01','C02','C03']);
 const owned=readShipCollection(store);
 assert.equal(owned.cards.every(x=>x.level===1),true,'le vittorie non regalano potenziamenti');
 assert.deepEqual(owned.loadout,['ship:N00'],'non equipaggiare gratis una nuova madre');
 const specials=readSpecialCollection(store);
 assert.equal(specials.packCredits,9,'crediti pacchetto, non carte scelte');
 assert.equal(specials.openedPacks,0);
 assert.equal(specials.loadout.length,24);
 assert.deepEqual(specials.owned,STARTER_SPECIAL_COUNTS);
 for(const shipId of ['N00','C01','C02','C03']){
  const c2=shipUpgradeDustCost(shipId,2),c3=shipUpgradeDustCost(shipId,3);
  const c4=shipUpgradeDustCost(shipId,4),c5=shipUpgradeDustCost(shipId,5);
  assert.equal(c2+c3+c4,580);
  assert.equal(c2+c3+c4+c5,1080);
  assert.ok(c2+c3+c4<=dust&&c2+c3+c4+c5>dust,
   'L4 ottenibile con prime 9 vittorie; L5 richiede fonti aggiuntive');
 }
});

test('Boss Terra: matrice verificabile con equip reale starter, pilota posseduto e upgrade acquistati',async()=>{
 const firstBoss=PHASE16A_CAMPAIGN_PLANETS[0];
 const rows=[];
 for(const shipId of ['N00','C01','C02','C03']){
  for(const level of [1,2,3,4]){
   const loadout=await shipAtLevelFromActualCollection(shipId,level);
   const {collection,specialCollection,earnedDust,dustRemaining}=loadout;
   const planned=([2,3,4].filter(x=>x<=level)
    .reduce((sum,x)=>sum+shipUpgradeDustCost(shipId,x),0));
   assert.equal(earnedDust-dustRemaining,planned);
   assert.equal(collection.loadout[0],collection.cards.find(x=>x.shipId===shipId).instanceId);
   const outcomes={wins:0,losses:0,draws:0,rounds:0,bossVitalKos:0};
   let rivalShipId=null;
   for(const seed of seeds){
    const setup=officialBattleSetup({
     mode:'adventure',sectorNumber:10,bossPlanetId:firstBoss.id,bossSectorLevel:10,
     shipCollection:collection,specialCollection,
     selectedPilot:BEGINNER_PILOT_ID,pilotInventory:BEGINNER_PILOT_INVENTORY,
     selectedBossDeck:'neutral_starter',bossDeckInventory:{},
     moduleLevels:{},epicRiftOpened:false,pilotLevel:1,nowMs:100,seed
    });
    assert.equal(setup.battle.sides.A.shipId,shipId);
    assert.equal(setup.battle.sides.A.level,level);
    assert.equal(setup.battle.sides.A.commander?.id,BEGINNER_PILOT_ID);
    assert.equal(setup.battle.sides.A.bossNumericDeck??null,null);
    assert.equal(setup.battle.sides.B.level,1,'boss non copia potenziamenti giocatore');
    if(rivalShipId===null)rivalShipId=setup.battle.sides.B.shipId;
    else assert.equal(setup.battle.sides.B.shipId,rivalShipId,
     'il modello boss non puo cambiare casualmente fra i seed');
    assert.equal(setup.battle.sides.B.bossNumericDeck.id,firstBoss.deck);
    assert.equal(setup.battle.arenaId,'boss_'+firstBoss.id);
    const {battle,rounds}=playBattle(setup.battle);
    outcomes.rounds+=rounds;
    outcomes.bossVitalKos+=Object.values(battle.sides.B.defense.parts).filter(x=>x.hp===0).length;
    const outcome=officialBattleResult(battle,'adventure',10);
    assert.equal(outcome.eligibleForRewards,battle.winner==='A');
    if(battle.winner==='A')outcomes.wins++;
    else if(battle.winner==='B')outcomes.losses++;
    else outcomes.draws++;
   }
   assert.equal(outcomes.wins+outcomes.losses+outcomes.draws,seeds.length);
   rows.push({shipId,level,rivalShipId,dustSpent:planned,
    wins:outcomes.wins,losses:outcomes.losses,draws:outcomes.draws,
    avgRounds:+(outcomes.rounds/seeds.length).toFixed(1),
    avgBossVitalKos:+(outcomes.bossVitalKos/seeds.length).toFixed(1)});
  }
 }
 // La prima prova di vincibilita resta condizionata all'IA: la C03 L3
 // deve poter vincere nel campione senza piloti o carte boss futuri.
 assert.ok(rows.find(row=>row.shipId==='C03'&&row.level===3)?.wins>=2,
  'Regression: con premi reali il primo boss non ha piu vittorie simulabili');
 // Telemetria IA/IA: non sostituisce la strategia umana e non cambia le regole.
 console.log('ECLISSI_TERRA_LEGAL_PROGRESSION '+JSON.stringify(rows));
});
