// Confronto A/B sullo STESSO seed e sullo STESSO boss: ricambio numerico
// tradizionale a rotazione oppure IA che conserva le carte utili alle firme
// gia' visibili. Non altera l'inventario o l'ordine segreto dei mazzi.
import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING,validateTacticalOrder}
 from './simultaneousDuelEngine.js';
const seeds=[17,171,2026,4096,8127,919,1337,251,101,517,23,31,47,73,89,103];
const starter=createSpecialCollection();
function orderFor(battle,key,variant){
 const planned=planTacticalAi(battle,key);
 if(variant==='smart')return planned;
 if(planned.numericIndices.length>0||!planned.exchangeIndices.length)return planned;
 const side=battle.sides[key];
 const rot=(battle.round-1)%side.numeric.hand.length;
 const specialTypes=planned.specialIndices.map(i=>side.special.hand[i]?.type);
 const count=specialTypes.includes('tactic-numeric-recycle')?2:1;
 const attempt={...planned,exchangeIndices:count===2?[rot,(rot+1)%7]:[rot]};
 return validateTacticalOrder(battle,key,attempt).ok?attempt:planned;
}
function play(battle,style){
 let rounds=0;
 while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const now=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const a=sealTacticalOrder(battle,'A',orderFor(battle,'A',style.A),now);
  assert.equal(a.ok,true,a.reason);
  const b=sealTacticalOrder(a.battle,'B',orderFor(battle,'B',style.B),now+1);
  assert.equal(b.ok,true,b.reason);
  const resolving=advanceTacticalDuel(b.battle,now+1);
  battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
  rounds++;
 }
 assert.equal(battle.phase,'finished');
 return {winner:battle.winner,rounds};
}
test('Ricambio intelligente confrontato a rotazione su stessi 16 semi contro Plutone e Io',()=>{
 const report=[];
 for(const scenario of [
  {planet:'Plutone',sector:70,planetId:9,ship:'E03'},
  {planet:'Io',sector:110,planetId:19,ship:'L03'}
 ]){
  for(const variant of [
   {id:'rotazione_entrambi',A:'rot',B:'rot'},
   {id:'intelligente_entrambi',A:'smart',B:'smart'},
   {id:'intelligente_giocatore',A:'smart',B:'rot'}
  ]){
   let wins=0,losses=0,draws=0,cycles=0;
   for(const seed of seeds){
    const setup=officialBattleSetup({
     mode:'adventure',sectorNumber:scenario.sector,
     bossPlanetId:scenario.planetId,bossSectorLevel:10,
     shipCollection:{cards:[{instanceId:'owned',shipId:scenario.ship,level:5}],
      loadout:['owned']},
     specialCollection:starter,selectedPilot:'pilot_com_1',
     pilotInventory:{pilot_com_1:{unlocked:true,level:1}},
     nowMs:100,seed
    });
    const played=play(setup.battle,variant);
    if(played.winner==='A')wins++;
    else if(played.winner==='B')losses++;
    else draws++;
    cycles+=played.rounds;
   }
   report.push({planet:scenario.planet,variant:variant.id,wins,losses,draws,
    avgCycles:Number((cycles/seeds.length).toFixed(2))});
  }
 }
 console.log('ECLISSI_EXCHANGE_AB '+JSON.stringify(report));
 assert.equal(report.length,6);
 assert.ok(report.every(r=>r.wins+r.losses+r.draws===seeds.length));
});
