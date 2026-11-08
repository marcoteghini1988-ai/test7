// Collaudo integrato dei 12 boss, Campagna e Avventura, senza modificare
// inventari reali. Le vittorie nei settori precedenti sono l'ipotesi
// necessaria per costruire la nave piu' recente acquisibile: NON simulate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {shipsUnlockableBeforeSector,bossPreparationMilestone}
 from './officialBossProgressionAudit.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';
import {verifiedBossRelicReward} from './campaignBossRelics.js';
import {bossCharacterTypeForPlanet} from './bossCharacterCards.js';

const seeds=[17,171,2026];
const modes=['campaign','adventure'];
const starter=createSpecialCollection();
const pilotInventory={pilot_com_1:{unlocked:true,level:1}};

function assertBattleState(battle,encounter,label){
 assert.equal(battle.arenaId,encounter.arenaId,label+' arena del boss bloccata');
 assert.equal(battle.sides.B.bossPlanetId,encounter.planetId,label+' boss vero');
 assert.equal(battle.sides.B.bossExclusive?.id,encounter.planetId,label+' esclusivo originale');
 assert.equal(battle.sides.B.bossNumericDeck?.id,encounter.numericDeckId,label+' mazzo originale');
 assert.equal(battle.sides.B.bossNumericDeck?.level,encounter.numericDeckLevel,label+' grado del boss');
 for(const key of ['A','B']){
  const side=battle.sides[key];
  const numeric=[...side.numeric.hand,...side.numeric.deck,...side.numeric.discard];
  const special=[...side.special.hand,...side.special.deck,...side.special.discard];
  assert.equal(numeric.length,52,label+' 52 numeriche '+key);
  assert.equal(new Set(numeric.map(c=>c.id)).size,52,label+' numeriche non clonate '+key);
  assert.equal(special.length,24,label+' 24 speciali '+key);
  assert.equal(new Set(special.map(c=>c.id)).size,24,label+' speciali non clonate '+key);
  assert.equal(side.numeric.hand.length,7,label+' mano numerica '+key);
  assert.equal(side.special.hand.length,5,label+' mano speciale '+key);
  assert.ok(side.defense.shield.hp>=0&&side.defense.shield.hp<=side.defense.shield.max,
   label+' barriera '+key);
  assert.ok(side.sync>=0&&side.sync<=100,label+' sincronizzazione '+key);
  for(const part of Object.values(side.defense.parts))
   assert.ok(part.hp>=0&&part.hp<=part.max,label+' vitali '+key);
  for(const escort of side.escorts)
   assert.ok(escort.hp>=0&&escort.hp<=escort.max,label+' scudiere '+key);
 }
}

function play(battle,encounter,label){
 let rounds=0,precisionA=0,precisionB=0,specialA=0,specialB=0;
 while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const round=battle.round;
  assert.equal(battle.phase,'planning',label+' preparazione');
  assert.equal(battle.deadlineMs>0,true,label+' scadenza preparazione');
  assertBattleState(battle,encounter,label+' ciclo '+round);
  const moment=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const orderA=planTacticalAi(battle,'A'),orderB=planTacticalAi(battle,'B');
  assert.ok(orderA&&orderB,label+' ordini IA generati con dati di gioco');
  specialA+=orderA.specialIndices.length;
  specialB+=orderB.specialIndices.length;
  const a=sealTacticalOrder(battle,'A',orderA,moment);
  assert.equal(a.ok,true,label+' ordine A '+a.reason);
  const b=sealTacticalOrder(a.battle,'B',orderB,moment+1);
  assert.equal(b.ok,true,label+' ordine B '+b.reason);
  const resolving=advanceTacticalDuel(b.battle,moment+1);
  assert.equal(resolving.phase,'resolving',label+' fase di risoluzione');
  assert.equal(resolving.resolveUntilMs-(moment+1),TACTICAL_TIMING.resolveMs,
   label+' risoluzione 8 secondi');
  const report=resolving.history.at(-1);
  assert.ok(report?.impacts,label+' storico degli impatti');
  precisionA+=report.impacts.filter(hit=>hit.kind==='precision'&&hit.by==='A'&&hit.damage>0).length;
  precisionB+=report.impacts.filter(hit=>hit.kind==='precision'&&hit.by==='B'&&hit.damage>0).length;
  assertBattleState(resolving,encounter,label+' risoluzione '+round);
  battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
  rounds++;
 }
 assert.equal(battle.phase,'finished',label+' sempre terminata entro 20 cicli');
 assert.ok(['A','B','draw'].includes(battle.winner),label+' vincitore ammesso');
 assert.ok(rounds<=TACTICAL_TIMING.maxRounds,label+' limite cicli');
 const kos=key=>Object.values(battle.sides[key].defense.parts).filter(p=>p.hp===0).length;
 if(battle.winner==='A')assert.equal(kos('B'),4,label+' vittoria soltanto con i 4 vitali boss KO');
 if(battle.winner==='B')assert.equal(kos('A'),4,label+' sconfitta soltanto con i 4 vitali propri KO');
 assertBattleState(battle,encounter,label+' finale');
 return {battle,rounds,precisionA,precisionB,specialA,specialB,enemyKo:kos('B')};
}

test('Regressione completa 12 boss x due percorsi x tre seed: 72 duelli ufficiali',()=>{
 assert.equal(PHASE16A_CAMPAIGN_PLANETS.length,12);
 assert.equal(TACTICAL_TIMING.prepareMs,30000);
 assert.equal(TACTICAL_TIMING.resolveMs,8000);
 assert.equal(TACTICAL_TIMING.maxRounds,20);
 const observations=[];
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const sector=(index+1)*10;
  const milestone=bossPreparationMilestone(sector);
  const owned=shipsUnlockableBeforeSector(sector);
  assert.equal(milestone.latestShip,owned.at(-1),'sblocchi anteriori a '+sector);
  assert.ok(!milestone.shipRewardOnlyAfterVictory||
   !owned.includes(milestone.shipRewardOnlyAfterVictory),
   planet.name+' nessuna nave del boss prima del KO');
  // Fixture di possesso esplicito, nessun grant a utenti o simulazione
  // ingannevole degli scontri precedenti.
  const shipCollection={cards:[{instanceId:'earned:'+milestone.latestShip,
   shipId:milestone.latestShip,level:5}],
   loadout:['earned:'+milestone.latestShip]};
  for(const mode of modes)for(const seed of seeds){
   const label=planet.name+' settore '+sector+' '+mode+' seed '+seed;
   const eligibility=officialSimultaneousEligibility({gameMode:mode,
    sectorNumber:sector,bossPlanetId:planet.id,bossSectorLevel:10,
    selectedPilot:'pilot_com_1'});
   assert.equal(eligibility.enabled,true,label+' percorso simultaneo');
   const setup=officialBattleSetup({mode,sectorNumber:sector,bossPlanetId:planet.id,
    bossSectorLevel:10,shipCollection,specialCollection:starter,
    selectedPilot:'pilot_com_1',pilotInventory,seed,nowMs:100});
   const encounter=setup.bossEncounter;
   assert.ok(encounter,label+' boss individuato');
   assert.equal(encounter.globalSector,sector);
   assert.equal(encounter.motherShipId,setup.shipB,label+' madre fissa');
   assert.equal(setup.battle.sides.A.shipId,milestone.latestShip,label+' nave antecedente');
   assert.equal(setup.battle.sides.B.level,milestone.enemyLevel,label+' livello boss non regalato');
   assert.equal(setup.battle.sides.A.commander?.id,'pilot_com_1',label+' pilota posseduto');
   assert.equal(setup.battle.sides.A.bossNumericDeck??null,null,label+' mazzo boss non regalato');
   const result=play(setup.battle,encounter,label);
   const verdict=officialBattleResult(result.battle,mode,sector);
   assert.equal(verdict.eligibleForRewards,result.battle.winner==='A',
    label+' premi esclusivamente a vittoria');
   assert.equal(verdict.meta.matchStats.bossPlanetId,planet.id);
   const trophy=bossCharacterTypeForPlanet(planet.id);
   assert.ok(trophy,label+' carta personaggio prevista nel catalogo, non assegnata');
   assert.equal(verifiedBossRelicReward({winner:verdict.winner,mode,
    sectorNumber:sector,bossPlanetId:planet.id,bossSectorLevel:10})!==null,
    result.battle.winner==='A',label+' reliquia solo dopo vittoria reale');
   observations.push({planet:planet.name,sector,mode,seed,
    ship:milestone.latestShip,winner:verdict.winner,
    rounds:result.rounds,precisionA:result.precisionA,precisionB:result.precisionB,
    specialsPlayedA:result.specialA,specialsPlayedB:result.specialB,
    bossVitalsKo:result.enemyKo});
  }
 }
 assert.equal(observations.length,72);
 assert.ok(observations.some(x=>x.precisionA>0),'colpi di precisione realmente possibili');
 assert.ok(observations.some(x=>x.specialsPlayedA>0),'carte speciali realmente usate');
 console.log('ECLISSI_BOSS_E2E_72 '+JSON.stringify(observations));
});

test('12 boss: settori e pianeti incoerenti non generano boss fittizi',()=>{
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const sector=(index+1)*10;
  const wrong=PHASE16A_CAMPAIGN_PLANETS[(index+1)%12];
  assert.equal(officialSimultaneousEligibility({gameMode:'campaign',
   sectorNumber:sector,bossPlanetId:wrong.id,bossSectorLevel:10,
   selectedPilot:'pilot_com_1'}).enabled,false);
  assert.equal(officialSimultaneousEligibility({gameMode:'adventure',
   sectorNumber:sector,bossPlanetId:wrong.id,bossSectorLevel:10,
   selectedPilot:'pilot_com_1'}).enabled,false);
  assert.equal(verifiedBossRelicReward({winner:'player',mode:'adventure',
   sectorNumber:sector,bossPlanetId:wrong.id,bossSectorLevel:10}),null);
  assert.equal(verifiedBossRelicReward({winner:'enemy',mode:'campaign',
   sectorNumber:sector,bossPlanetId:planet.id,bossSectorLevel:10}),null);
 }
});
