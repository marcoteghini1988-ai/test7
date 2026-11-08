// Confronto controllato non invasivo: stesso boss Terra, stesse carte/piloti,
// variando SOLTANTO il modello fisico della nave rivale. NON cambia il gioco
// ufficiale, la compatibilita' legacy o la grafica.
import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {planTacticalAi} from './tacticalDuelAi.js';

const starter=createSpecialCollection();
const pilot={id:'pilot_com_1',level:1,scope:'fleet'};
const ownedPilot={pilot_com_1:{unlocked:true,level:1}};
const seeds=[17,171,2026,4096,8127];
function fixedOrOriginal(shipId,enemyShipId,seed,level=3){
 const shipCollection={cards:[{instanceId:'ship:'+shipId,shipId,level}],
  loadout:['ship:'+shipId]};
 const original=officialBattleSetup({mode:'adventure',sectorNumber:10,
  bossPlanetId:1,bossSectorLevel:10,shipCollection,specialCollection:starter,
  selectedPilot:'pilot_com_1',pilotInventory:ownedPilot,
  seed,nowMs:100}).battle;
 const rival=original.sides.B;
 const controlled=createTacticalDuel({
  shipA:shipId,levelA:level,shipB:enemyShipId,levelB:rival.level,
  seed,nowMs:100,mode:'adventure',arenaId:original.arenaId,
  shuffleNumericOpening:true,
  commanderA:pilot,commanderB:rival.commander,
  bossNumericDeckA:null,
  bossNumericDeckB:{id:rival.bossNumericDeck.id,level:rival.bossNumericDeck.level},
  specialDeckA:starter.loadout,specialDeckB:buildTacticalBossDeck(1,rival.level,level),
  equipmentLevelsA:{},epicEntitlementsA:[],bossPlanetB:1
 });
 // Controllo di integrita': se si usa il modello scelto dal gioco, il setup
 // controllato deve essere IDENTICO al vero incontro ufficiale.
 if(enemyShipId===rival.shipId)
  assert.deepEqual(controlled,original,'isolamento esperimento: nessuna altra variabile cambia');
 return {original,controlled};
}
function simulate(battle){
 let rounds=0;
 while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
  const now=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const a=sealTacticalOrder(battle,'A',planTacticalAi(battle,'A'),now);
  assert.equal(a.ok,true,a.reason);
  const b=sealTacticalOrder(a.battle,'B',planTacticalAi(battle,'B'),now+1);
  assert.equal(b.ok,true,b.reason);
  const resolving=advanceTacticalDuel(b.battle,now+1);
  battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
  rounds++;
 }
 assert.equal(battle.phase,'finished');
 return battle.winner;
}

test('Diagnostica Terra: modello rivale C02 e C03 a parita di boss, carte, pilota e seed',()=>{
 const results=[];
 for(const shipId of ['N00','C01','C02','C03']){
  for(const enemyShipId of ['C02','C03']){
   const stats={wins:0,losses:0,draws:0};
   let actualRival=null;
   for(const seed of seeds){
    const {original,controlled}=fixedOrOriginal(shipId,enemyShipId,seed);
    if(actualRival===null)actualRival=original.sides.B.shipId;
    else assert.equal(original.sides.B.shipId,actualRival);
    const winner=simulate(controlled);
    if(winner==='A')stats.wins++;
    else if(winner==='B')stats.losses++;
    else stats.draws++;
   }
   results.push({shipId,level:3,actualRival,controlledRival:enemyShipId,...stats});
  }
 }
 assert.equal(results.length,8);
 assert.equal(results.reduce((sum,x)=>sum+x.wins+x.losses+x.draws,0),40);
 console.log('ECLISSI_TERRA_SAME_BOSS_CONTROL '+JSON.stringify(results));
});
