// Diagnostica non invasiva dei due boss segnalati dai benchmark:
// decisioni IA realmente sigillate, effetti delle carte possedute, scudi,
// vitali, esiti. Nessuna statistica o potere di gioco viene modificato.
import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';

const seeds=[17,171,2026,4096,8127,919,1337,251,101,517];
const starter=createSpecialCollection();
const scenarios=[
 {planet:'Plutone',sector:70,planetId:9,shipId:'E03'},
 {planet:'Io',sector:110,planetId:19,shipId:'L03'},
];
function runScenario(scenario,seed){
 let battle=officialBattleSetup({mode:'adventure',sectorNumber:scenario.sector,
  bossPlanetId:scenario.planetId,bossSectorLevel:10,
  shipCollection:{cards:[{instanceId:'owned',shipId:scenario.shipId,level:5}],
   loadout:['owned']},
  specialCollection:starter,selectedPilot:'pilot_com_1',
  pilotInventory:{pilot_com_1:{unlocked:true,level:1}},seed,nowMs:100}).battle;
 const actions=Object.fromEntries(['A','B'].map(side=>[side,{
  mathematical:0,precisionHits:0,attemptedTargets:{},specials:{},
  shieldMin:60,exposures:0
 }]));
 let cycles=0;
 while(battle.phase!=='finished'&&cycles<TACTICAL_TIMING.maxRounds){
  const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const orders=Object.fromEntries(['A','B'].map(side=>[side,planTacticalAi(battle,side)]));
  for(const side of ['A','B']){
   const out=actions[side],order=orders[side];
   if(order.numericIndices?.length>=2)out.mathematical++;
   if(order.vitalId)out.attemptedTargets[order.vitalId]=(out.attemptedTargets[order.vitalId]||0)+1;
   for(const i of order.specialIndices??[]){
    const type=battle.sides[side].special.hand[i]?.type;
    out.specials[type]=(out.specials[type]||0)+1;
   }
  }
  const a=sealTacticalOrder(battle,'A',orders.A,at);
  assert.equal(a.ok,true,a.reason);
  const b=sealTacticalOrder(a.battle,'B',orders.B,at+1);
  assert.equal(b.ok,true,b.reason);
  const resolving=advanceTacticalDuel(b.battle,at+1);
  const history=resolving.history.at(-1);
  for(const side of ['A','B']){
   const out=actions[side];
   out.precisionHits+=history.impacts.filter(i=>i.kind==='precision'&&i.by===side&&i.damage>0).length;
   const enemySide=side==='A'?'B':'A';
   out.shieldMin=Math.min(out.shieldMin,resolving.sides[enemySide].defense.shield.hp);
   out.exposures=Math.max(out.exposures,
    Object.values(resolving.sides[enemySide].defense.parts).filter(p=>p.exposed).length);
  }
  battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
  cycles++;
 }
 assert.equal(battle.phase,'finished');
 const parts=side=>Object.fromEntries(Object.entries(battle.sides[side].defense.parts).map(
  ([id,p])=>[id,p.hp]));
 return {seed,winner:battle.winner,cycles,shields:{
  A:battle.sides.A.defense.shield.hp,B:battle.sides.B.defense.shield.hp
 },parts:{A:parts('A'),B:parts('B')},actions};
}
test('Plutone e Io: diagnosi 10 semi di bersagli, formule, riparazioni e 4 vitali',()=>{
 const rows=[];
 for(const scenario of scenarios){
  const fights=seeds.map(seed=>runScenario(scenario,seed));
  const totals={w:0,l:0,d:0,cycles:0,mathA:0,mathB:0,hitsA:0,hitsB:0,
   finalBossKos:0,finalPlayerKos:0,scansA:0,repairsA:0,repairsB:0,
   bossShieldFinal:0,seenExposureA:0,priorityA:{}};
  for(const fight of fights){
   totals[fight.winner==='A'?'w':fight.winner==='B'?'l':'d']++;
   totals.cycles+=fight.cycles;
   totals.mathA+=fight.actions.A.mathematical;
   totals.mathB+=fight.actions.B.mathematical;
   totals.hitsA+=fight.actions.A.precisionHits;
   totals.hitsB+=fight.actions.B.precisionHits;
   totals.finalBossKos+=Object.values(fight.parts.B).filter(hp=>hp===0).length;
   totals.finalPlayerKos+=Object.values(fight.parts.A).filter(hp=>hp===0).length;
   totals.scansA+=fight.actions.A.specials['tactic-scan']||0;
   totals.repairsA+=fight.actions.A.specials['support-shield-repair']||0;
   totals.repairsB+=fight.actions.B.specials['support-shield-repair']||0;
   totals.bossShieldFinal+=fight.shields.B;
   totals.seenExposureA+=fight.actions.A.exposures;
   for(const [id,n] of Object.entries(fight.actions.A.attemptedTargets))
    totals.priorityA[id]=(totals.priorityA[id]||0)+n;
  }
  rows.push({...scenario,totals,perSeed:fights.map(f=>({seed:f.seed,winner:f.winner,
   cycles:f.cycles,partsA:f.parts.A,partsB:f.parts.B,
   mathA:f.actions.A.mathematical,hitsA:f.actions.A.precisionHits,
   mathB:f.actions.B.mathematical,hitsB:f.actions.B.precisionHits}))});
 }
 console.log('ECLISSI_BOSS_STALEMATE_DIAGNOSTIC '+JSON.stringify(rows));
});