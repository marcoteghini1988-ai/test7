// Esperimento diagnostico: primi nove settori, accessibilita delle navi NPC
// e mazzo speciale starter. Non cambia il gioco ufficiale o i salvataggi.
import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup} from './officialBattleSetup.js';
import {shipsUnlockableBeforeSector} from './officialBossProgressionAudit.js';
import {chooseCampaignRivalCommander} from './motherDuelLoadout.js';
import {normalizeFleetCommander} from './fleetCommander.js';
import {readShipCollection,grantShipCard,equipShipCards} from './shipCollection.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {createTacticalDuel,TACTICAL_STARTER_TYPES,TACTICAL_TIMING,advanceTacticalDuel,sealTacticalOrder}
 from './simultaneousDuelEngine.js';
import {planTacticalAi} from './tacticalDuelAi.js';
const specials=createSpecialCollection();
const ownedPilot={pilot_com_1:{unlocked:true,level:1}};
const seeds=[17,171,2026,4096,8127];
function shipCollection(shipId,sector){
 let c=readShipCollection({getItem:()=>null});
 for(const name of shipsUnlockableBeforeSector(sector).slice(1))c=grantShipCard(c,name);
 return equipShipCards(c,[c.cards.find(card=>card.shipId===shipId).instanceId]);
}
function battle(sector,shipId,seed,variant){
 const official=officialBattleSetup({mode:'adventure',sectorNumber:sector,
  bossPlanetId:1,bossSectorLevel:sector,shipCollection:shipCollection(shipId,sector),
  specialCollection:specials,selectedPilot:'pilot_com_1',pilotInventory:ownedPilot,
  seed,nowMs:100}).battle;
 const enemyShip=variant==='same'||variant==='same_owned'?official.sides.B.shipId:
  shipsUnlockableBeforeSector(sector).at(-1);
 const enemyDeck=variant==='same'||variant==='accessible'?TACTICAL_STARTER_TYPES:specials.loadout;
 const pilot=chooseCampaignRivalCommander({mode:'adventure',globalSector:sector,
  planetId:1,planetSector:sector,shipId:enemyShip,shipLevel:1});
 const controlled=createTacticalDuel({shipA:shipId,levelA:1,
  shipB:enemyShip,levelB:1,seed,nowMs:100,mode:'adventure',arenaId:official.arenaId,
  shuffleNumericOpening:true,commanderA:official.sides.A.commander,
  commanderB:normalizeFleetCommander(pilot.id,pilot.level),
  specialDeckA:specials.loadout,specialDeckB:enemyDeck,
  equipmentLevelsA:{},epicEntitlementsA:[],
  bossNumericDeckA:null,bossNumericDeckB:null,bossPlanetB:null});
 if(variant==='same')assert.deepEqual(controlled,official,'controllo senza modifica deve equivalere al motore');
 return {controlled,rival:enemyShip};
}
function run(current){
 for(let i=0;i<TACTICAL_TIMING.maxRounds&&current.phase!=='finished';i++){
  const now=current.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const a=sealTacticalOrder(current,'A',planTacticalAi(current,'A'),now);
  assert.equal(a.ok,true,'A '+a.reason);
  const b=sealTacticalOrder(a.battle,'B',planTacticalAi(current,'B'),now+1);
  assert.equal(b.ok,true,'B '+b.reason);
  const resolving=advanceTacticalDuel(b.battle,now+1);
  current=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
 }
 assert.equal(current.phase,'finished');
 return current.winner;
}
test('Terra 1-9: confronto controllato navi e speciali NPC, senza carte o vittorie regalate',()=>{
 const results=[];
 for(let sector=1;sector<=9;sector++){
  const player=shipsUnlockableBeforeSector(sector).at(-1);
  for(const variant of ['same','same_owned','accessible','accessible_owned']){
   const r={sector,player,variant,enemy:null,w:0,l:0,d:0};
   for(const seed of seeds){
    const setup=battle(sector,player,seed,variant);
    if(r.enemy===null)r.enemy=setup.rival;
    else assert.equal(r.enemy,setup.rival);
    const outcome=run(setup.controlled);
    if(outcome==='A')r.w++;
    else if(outcome==='B')r.l++;
    else r.d++;
   }
   results.push(r);
  }
 }
 console.log('ECLISSI_TERRA_EARLY_FAIRNESS '+JSON.stringify(results));
});
