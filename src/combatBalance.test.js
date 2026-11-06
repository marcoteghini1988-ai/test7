// Punto 45 — bilanciamento integrato, nessun adattamento arbitrario alle
// probabilità di gioco: i risultati reali restano da misurare nel playtest.
import test from 'node:test';
import assert from 'node:assert/strict';
import {balancedCombatImpact,COMBAT_BALANCE_LIMITS} from './combatBalance.js';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {BOSS_NUMERIC_DECK_IDS,BOSS_NUMERIC_DECKS,equipBossNumericDeck,bossNumericDamageFactor,bossNumericDefenseFactor} from './bossNumericDecks.js';
import {COMMANDER_ABILITY_IDS,commanderAttackFactor,commanderDefenseFactor} from './commanderAbilities.js';
import {equipFleetCommander} from './fleetCommander.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {arenaAttackFactor,arenaMotherDefenseFactor,arenaEnvironment,applyArenaIonResistance} from './battleArenas.js';
import {battlePacingReport} from './battlePacing.js';
import {SHOT_RULES} from './strategicShots.js';

const rng=()=>.5;
const battle=()=>initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rng,'campaign');
const cards=[
 {id:'c1',value:2,suit:'♥'},
 {id:'c2',value:3,suit:'♦'},
 {id:'c3',value:4,suit:'♣'}
];

test('45: la fusione mantiene il vantaggio ma non moltiplica tutte le passive oltre +45%',()=>{
 const balanced=balancedCombatImpact(125,{
  bossAttack:1.30,commanderAttack:1.12,arenaAttack:1.10,
  bossDefense:.8,commanderDefense:.86,arenaDefense:.89,
  unmodifiedVolleyDamage:100
 });
 assert.equal(balanced.passiveFactor,1.35);
 assert.equal(balanced.defenseFactor,.65);
 assert.equal(balanced.damage,145);
 assert.equal(balanced.passiveCapApplied,true);
 assert.equal(balanced.fusionStackCapApplied,true);
 assert.equal(balanced.motherDefenseCapApplied,true);
 const fusionOnly=balancedCombatImpact(125,{unmodifiedVolleyDamage:100});
 assert.equal(fusionOnly.damage,125);
 assert.equal(fusionOnly.fusionStackCapApplied,false);
 assert.equal(balancedCombatImpact(100,{bossAttack:1.35,unmodifiedVolleyDamage:100}).damage,135);
 const guard=balancedCombatImpact(85,{bossAttack:1.2,unmodifiedVolleyDamage:100});
 assert.equal(guard.damage,102);
 assert.equal(guard.fusionStackCapApplied,false);
});

test('45: nessun bonus inventa danni e input invalidi sono neutrali',()=>{
 for(const raw of [0,-10,NaN,Infinity,null,undefined]){
  const b=balancedCombatImpact(raw,{
   bossAttack:100,commanderAttack:10,arenaAttack:10,
   unmodifiedVolleyDamage:100
  });
  assert.equal(b.damage,0);
 }
 const invalid=balancedCombatImpact(20,{
  bossAttack:NaN,commanderAttack:-12,arenaAttack:Infinity,
  bossDefense:0,commanderDefense:NaN,arenaDefense:-1
 });
 assert.equal(invalid.damage,20);
 assert.equal(invalid.passiveFactor,1);
 assert.equal(invalid.defenseFactor,1);
 const r=balancedCombatImpact(100,{bossDefense:.62,commanderDefense:.62,arenaDefense:.62});
 assert.equal(r.defenseFactor,COMBAT_BALANCE_LIMITS.minMotherDefenseFactor);
});

test('45: 12 boss, 33 comandanti e tre fasi rispettano i limiti simultanei',()=>{
 const initial=battle();
 let scanned=0;
 for(const bossId of BOSS_NUMERIC_DECK_IDS){
  const boss=equipBossNumericDeck(initial.player,bossId,BOSS_NUMERIC_DECKS[bossId].maxLevel);
  const defender=equipBossNumericDeck(initial.enemy,'planet_char_20',9);
  for(const pilotId of COMMANDER_ABILITY_IDS){
   const attacker=equipFleetCommander(boss,pilotId,5);
   const defended=equipFleetCommander(defender,pilotId,5);
   for(const round of [1,4,7]){
    const planet=PHASE16A_CAMPAIGN_PLANETS.find(p=>p.deck===bossId);
    assert.ok(planet,'Boss without a corresponding planet');
    const arenaId='boss_'+planet.id,environmentStage=arenaEnvironment(arenaId,round).stage;
    const context={
     legalAttack:true,cards,op:'plus',environmentStage,
     escortIndex:null,vitalId:null,nowMs:1000,
     strikeEffects:['shot-ion'],motherShot:true,escortShot:false,
     reshufflesAtLaunch:0
    };
    const params={
     bossAttack:bossNumericDamageFactor(attacker,defended,context),
     commanderAttack:commanderAttackFactor(attacker,defended,context),
     arenaAttack:arenaAttackFactor(arenaId,context),
     bossDefense:bossNumericDefenseFactor(defended,context),
     commanderDefense:commanderDefenseFactor(defended,attacker,context),
     arenaDefense:arenaMotherDefenseFactor(arenaId,defended,context),
     unmodifiedVolleyDamage:100
    };
    const result=balancedCombatImpact(125,params);
    assert.ok(result.damage>=0&&result.damage<=145);
    assert.ok(result.passiveFactor>=1&&result.passiveFactor<=1.35);
    assert.ok(result.defenseFactor>=.65&&result.defenseFactor<=1);
    assert.ok(result.damage<=Math.floor(125*1.35+1e-9));
    scanned++;
   }
  }
 }
 assert.equal(scanned,12*33*3);
});

test('45: boss ionico + arena in PICCO non supera 50% riduzione cumulativa',()=>{
 const initial=battle();
 const defender=equipBossNumericDeck(initial.player,'planet_char_7',3);
 const now=1000;
 const hit=applyPendingHit(defender,0,'plus',20,{
  nowMs:now,strikeEffects:['shot-ion'],hitId:'balance-ionic'
 });
 assert.ok(hit.strategicApplied.includes('shot-ion'));
 const after=applyArenaIonResistance(hit.defender,'ionic',hit.strategicApplied,now,'surge');
 assert.equal(after.strategicStatuses.ionizedUntil,
  now+Math.ceil(SHOT_RULES.ionizedDurationMs*(1-COMBAT_BALANCE_LIMITS.maxCombinedIonResistance)));
 assert.ok(after.strategicStatuses.ionizedUntil<=hit.defender.strategicStatuses.ionizedUntil);
 assert.equal(after.fleet[0].defense.shield.hp,hit.defender.fleet[0].defense.shield.hp);
 const onlyBoss=applyArenaIonResistance(hit.defender,'titanium',hit.strategicApplied,now,'surge');
 assert.strictEqual(onlyBoss,hit.defender);
 const missing=applyArenaIonResistance(defender,'ionic',['shot-ion'],now,'surge');
 assert.strictEqual(missing,defender);
});

test('45: la resistenza ionica non allunga status esterni già più corti',()=>{
 const base=battle().player;
 const def={...base,strategicStatuses:{ionizedUntil:1100}};
 const got=applyArenaIonResistance(def,'ionic',['shot-ion'],1000,'surge');
 assert.ok(got.strategicStatuses.ionizedUntil<=1100);
});

test('45: report salva metriche di combattimento senza modificare la partita',()=>{
 const g={...battle(),combatStartedAt:1000,
  balanceMetrics:{resolvedImpacts:7,playerImpacts:4,enemyImpacts:3,
   passiveCaps:2,fusionStackCaps:1,defenseCaps:1,peakImpacts:2,specialImpacts:3}};
 const original=structuredClone(g);
 const report=battlePacingReport(g,61000);
 assert.equal(report.elapsedSeconds,60);
 assert.equal(report.balanceResolvedImpacts,7);
 assert.equal(report.balanceFusionStackCaps,1);
 assert.equal(report.balanceSpecialImpacts,3);
 assert.equal(report.balancePeakImpacts,2);
 assert.equal(report.playerSpecialCardsUsed,g.player.specialUses||0);
 assert.deepEqual(g,original);
});
