// Nettuno/Plutone/Proxima b/Io: non trattare l'intera campagna come se il giocatore avesse
// ancora soltanto le sei famiglie speciali di partenza. Questo confronto
// apre SOLO i pacchetti realmente ottenibili con precedenti prime vittorie
// (presupposte, NON simulate), tramite il vero RNG del gioco.
// Il nuovo equipaggiamento è una scelta ESPLICITA tra carte effettivamente
// estratte, senza poteri boss, piloti, moduli o Epici gratuiti.
import test from 'node:test';
import assert from 'node:assert/strict';
import {claimFirstWinSpecialPack,readSpecialCollection,openSpecialPack,
 equipSpecialDeck,validateSpecialDeck} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';

function storage(){const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v)};}
function random(seed){
 let x=seed>>>0||1;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
const TARGETS=Object.freeze([
 ['tactic-scan',5],['tactic-numeric-recycle',5],
 ['support-shield-repair',4],['tactic-counter',3],
 ['tactic-reactive',3],['tactic-impact',2],['tactic-suppress',2]
]);
function selectOwnedDeck(collection){
 const selected=[];
 for(const [type,limit] of TARGETS){
  const copies=Math.min(limit,collection.owned[type]||0);
  for(let i=0;i<copies&&selected.length<24;i++)selected.push(type);
 }
 for(const type of collection.loadout){
  if(selected.length===24)break;
  selected.push(type);
 }
 assert.equal(selected.length,24);
 const test=validateSpecialDeck(collection,selected);
 assert.equal(test.valid,true,test.reason);
 return equipSpecialDeck(collection,selected);
}
function preparePacks(sector,seed){
 const store=storage();
 for(let i=1;i<sector;i++)
  assert.equal(claimFirstWinSpecialPack('adventure',i,store).granted,true);
 let c=readSpecialCollection(store);
 assert.equal(c.packCredits,sector-1);
 const rand=random(seed);
 for(let i=0;i<sector-1;i++){
  const draw=openSpecialPack(c,rand);
  assert.equal(draw.opened,true,draw.reason);
  c=draw.collection;
 }
 assert.equal(c.packCredits,0);
 assert.equal(c.openedPacks,sector-1);
 const equipped=selectOwnedDeck(c);
 return {equipped,drawn:c.openedPacks*3,
  scan:equipped.loadout.filter(c=>c==='tactic-scan').length,
  recycle:equipped.loadout.filter(c=>c==='tactic-numeric-recycle').length,
  repair:equipped.loadout.filter(c=>c==='support-shield-repair').length};
}
function fight(battle){
 let cycles=0;const played={};
 while(battle.phase!=='finished'&&cycles<TACTICAL_TIMING.maxRounds){
  const now=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const orderA=planTacticalAi(battle,'A');
  for(const i of orderA.specialIndices){
   const type=battle.sides.A.special.hand[i].type;
   played[type]=(played[type]||0)+1;
  }
  const a=sealTacticalOrder(battle,'A',orderA,now);
  assert.equal(a.ok,true,a.reason);
  const b=sealTacticalOrder(a.battle,'B',planTacticalAi(battle,'B'),now+1);
  assert.equal(b.ok,true,b.reason);
  const resolving=advanceTacticalDuel(b.battle,now+1);
  battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
  cycles++;
 }
 assert.equal(battle.phase,'finished');
 return {winner:battle.winner,cycles,played};
}
function playEncounter(scenario,specialCollection,seed){
 const b=officialBattleSetup({mode:'adventure',sectorNumber:scenario.sector,
  bossPlanetId:scenario.planetId,bossSectorLevel:10,
  shipCollection:{cards:[{instanceId:'owned',shipId:scenario.ship,level:5}],
   loadout:['owned']},
  specialCollection,selectedPilot:'pilot_com_1',
  pilotInventory:{pilot_com_1:{unlocked:true,level:1}},
  nowMs:100,seed
 });
 return fight(b.battle);
}
test('Mazzi speciali da pacchetti autentici prima di 4 boss critici: 100 duelli',()=>{
 const out=[];
 const starters=readSpecialCollection(storage());
 for(const scenario of [
  {planet:'Nettuno',sector:60,planetId:8,ship:'E02'},
  {planet:'Plutone',sector:70,planetId:9,ship:'E03'},
  {planet:'Proxima b',sector:90,planetId:14,ship:'L01'},
  {planet:'Io',sector:110,planetId:19,ship:'L03'}
 ]){
  const seeds=[17,171,2026,4096,8127];
  for(const packSeed of [null,11,37,171,2026]){
   const result=packSeed===null?{equipped:starters,drawn:0,
    scan:0,recycle:0,repair:0}:preparePacks(scenario.sector,packSeed);
   const stats={planet:scenario.planet,variant:packSeed===null?'starter':'packs',
    packSeed,drawn:result.drawn,scan:result.scan,recycle:result.recycle,
    repair:result.repair,wins:0,losses:0,draws:0,cycles:0,
    playedScan:0,playedRecycle:0,playedRepair:0};
   for(const seed of seeds){
    const battle=playEncounter(scenario,result.equipped,seed);
    if(battle.winner==='A')stats.wins++;
    else if(battle.winner==='B')stats.losses++;
    else stats.draws++;
    stats.cycles+=battle.cycles;
    stats.playedScan+=battle.played['tactic-scan']||0;
    stats.playedRecycle+=battle.played['tactic-numeric-recycle']||0;
    stats.playedRepair+=battle.played['support-shield-repair']||0;
   }
   stats.avgCycles=+(stats.cycles/seeds.length).toFixed(1);
   delete stats.cycles;
   out.push(stats);
  }
 }
 assert.equal(out.length,20);
 assert.ok(out.every(row=>row.wins+row.losses+row.draws===5));
 const sectors={'Nettuno':60,'Plutone':70,'Proxima b':90,'Io':110};
 assert.ok(out.filter(row=>row.variant==='packs').every(row=>
  row.drawn===(sectors[row.planet]-1)*3));
 console.log('ECLISSI_EARNED_SPECIAL_PACKS '+JSON.stringify(out));
});