// Riproduce realmente una sequenza di sfide Terra 1..10 con l'IA locale,
// usando soltanto il salvataggio ottenuto dalle VITTORIE del run e le ricompense
// autentiche di sconfitta. Nessuna vittoria presunta o carta gratuita.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readShipCollection,updateShipCollection,upgradeShipCard,equipShipCards} from './shipCollection.js';
import {readSpecialCollection,claimFirstWinSpecialPack} from './specialDeckBuilder.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {bossCharacterTypeForPlanet} from './bossCharacterCards.js';
import {shipsUnlockableBeforeSector} from './officialBossProgressionAudit.js';
import {validateShipUpgradePurchase} from './shipUpgrades.js';
import {phase17CampaignDustAward} from './newCombat/phase17Balance.js';
import {calculateTelemetryOnDefeat} from './progressionEngine.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING} from './simultaneousDuelEngine.js';
const seeds=[37,113,397];
const MAX_ATTEMPTS_PER_SECTOR=48;
const PILOT={pilot_com_1:{unlocked:true,level:1}};
function storage(){
 const entries=new Map();
 return {getItem:id=>entries.get(id)??null,setItem:(id,v)=>entries.set(id,v)};
}
function fight(start){
 let battle=start,rounds=0;
 while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const player=sealTacticalOrder(battle,'A',planTacticalAi(battle,'A'),at);
  assert.equal(player.ok,true,'A '+player.reason);
  const rival=sealTacticalOrder(player.battle,'B',planTacticalAi(battle,'B'),at+1);
  assert.equal(rival.ok,true,'B '+rival.reason);
  const resolved=advanceTacticalDuel(rival.battle,at+1);
  assert.equal(resolved.phase,'resolving');
  battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
  rounds++;
 }
 assert.equal(battle.phase,'finished');
 return {battle,rounds};
}
async function chooseAvailableShip(store,sector,resources){
 const owned=readShipCollection(store);
 const shipId=shipsUnlockableBeforeSector(sector).at(-1);
 const card=owned.cards.find(c=>c.shipId===shipId);
 assert.ok(card,'non e stata davvero vinta la nave '+shipId);
 await updateShipCollection(c=>equipShipCards(c,[card.instanceId]),store);
 // Politica trasparente: acquista al massimo L3 con la polvere guadagnata.
 // Mantiene almeno 100 unita' disponibili per evitare spese obbligate.
 while(true){
  const c=readShipCollection(store),equipped=c.cards.find(x=>x.instanceId===card.instanceId);
  if(equipped.level>=3)break;
  const purchase=validateShipUpgradePurchase(c,card.instanceId,equipped.level+1,resources.dust);
  if(!purchase.allowed||resources.dust-purchase.cost<100)break;
  await updateShipCollection(curr=>upgradeShipCard(curr,card.instanceId,equipped.level+1),store);
  resources.dust-=purchase.cost;
  resources.purchases+=purchase.cost;
 }
 return readShipCollection(store).cards.find(x=>x.instanceId===card.instanceId);
}
test('Terra: tre percorsi 1..10 con combattimenti, sblocchi e acquisti davvero consecutivi',async()=>{
 const trajectories=[];
 for(const initialSeed of seeds){
  const store=storage(),economy={dust:100,purchases:0};
  const rows=[];
  let totalFailures=0;
  for(let sector=1;sector<=10;sector++){
   const equipped=await chooseAvailableShip(store,sector,economy);
   const snapshot=readShipCollection(store);
   const specials=readSpecialCollection(store);
   assert.equal(specials.openedPacks,0,'non estrarre carte favorevoli');
   let success=false,losses=0,draws=0,lastRounds=0;
   for(let attempt=1;attempt<=MAX_ATTEMPTS_PER_SECTOR;attempt++){
    // Nuovo ingresso reale dopo ogni perdita, con la stessa carta posseduta.
    const seed=(initialSeed+sector*4109+attempt*7919)>>>0;
    const setup=officialBattleSetup({mode:'adventure',sectorNumber:sector,
     bossPlanetId:1,bossSectorLevel:sector,shipCollection:snapshot,
     specialCollection:specials,selectedPilot:'pilot_com_1',pilotInventory:PILOT,
     nowMs:100,seed});
    assert.equal(setup.battle.sides.A.shipId,equipped.shipId);
    assert.equal(setup.battle.sides.A.level,equipped.level);
    assert.equal(setup.battle.sides.B.bossPlanetId??null,sector===10?1:null);
    const result=fight(setup.battle);
    lastRounds=result.rounds;
    const outcome=officialBattleResult(result.battle,'adventure',sector);
    assert.equal(outcome.eligibleForRewards,result.battle.winner==='A');
    if(result.battle.winner==='A'){
     success=true;
     // Premio prima vittoria e prima soglia navicella: SOLO ora il settore
     // successivo potra' usare la carta appena ottenuta.
     assert.equal(claimFirstWinSpecialPack('adventure',sector,store).granted,true);
     const granted=await claimCampaignShipUnlock('adventure',sector,store);
     if([3,6,9].includes(sector))assert.equal(granted.granted,true);
     economy.dust=Math.min(1500,economy.dust+phase17CampaignDustAward(1,sector,false)+
      (sector===10?165:0));
     if(sector===10){
      const trophy=claimBossCharacterFromVictory({
       winner:'player',mode:'adventure',sectorNumber:sector,bossPlanetId:1,bossSectorLevel:10
      },store);
      assert.equal(trophy.granted,true,'Carta Boss Terra solo dopo la vittoria');
     }
     rows.push({sector,ship:equipped.shipId,level:equipped.level,attempt,
      losses,draws,lastRounds,dust:economy.dust});
     break;
    }
    if(result.battle.winner==='B'){
     losses++;totalFailures++;
     // L'app reale concede polvere di telemetria dopo sconfitta, non premi
     // settore, pacchetti o navicelle.
     const telemetry=calculateTelemetryOnDefeat(result.rounds,1500);
     economy.dust=Math.min(1500,economy.dust+telemetry.dustEarned);
    }else draws++;
    assert.equal(readSpecialCollection(store).packCredits,sector-1,
     'nessun pacchetto per perdita o pareggio');
   }
   assert.equal(success,true,'Percorso non concluso al settore '+sector+
    ' seed '+initialSeed+' entro '+MAX_ATTEMPTS_PER_SECTOR+' tentativi');
   assert.equal(rows.length,sector);
  }
  assert.equal(rows.at(-1).sector,10);
  assert.equal(readSpecialCollection(store).packCredits,10);
  const trophyType=bossCharacterTypeForPlanet(1);
  assert.equal(readSpecialCollection(store).owned[trophyType],1);
  assert.equal(readSpecialCollection(store).loadout.includes(trophyType),false,
   'Il personaggio boss non e equipaggiato gratis');
  trajectories.push({initialSeed,failures:totalFailures,dustAfter:economy.dust,
   dustSpent:economy.purchases,progress:rows});
 }
 console.log('ECLISSI_TERRA_REAL_1_TO_10 '+JSON.stringify(trajectories));
});
