// Confronto Io: stessa mano, stessi seed e stesse Carte Speciali AUTENTICHE.
// Cambia SOLO la decisione pubblica del giocatore simulato di difendersi
// durante l'eruzione del ciclo; non cambia mai il potere del boss.
// L'esperimento con pacchetti assume prime vittorie dei settori precedenti.
import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection,readSpecialCollection,claimFirstWinSpecialPack,
 openSpecialPack,equipSpecialDeck} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';
import {exclusiveMagmaPhase} from './tacticalExclusiveBosses.js';
const seeds=[17,171,2026,4096,8127,919,1337,251,101,517,23,31,47,73,89,103];
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
function random(seed){let x=seed>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function realEarnedSpecialDeck(){
 const store=storage();
 for(let i=1;i<110;i++)assert.equal(claimFirstWinSpecialPack('adventure',i,store).granted,true);
 let c=readSpecialCollection(store);
 const rnd=random(37);
 for(let i=0;i<109;i++){
  const reward=openSpecialPack(c,rnd);assert.equal(reward.opened,true,reward.reason);c=reward.collection;
 }
 const chosen=[];
 for(const [type,limit] of [
  ['tactic-scan',5],['tactic-numeric-recycle',5],
  ['support-shield-repair',4],['tactic-reactive',3],['tactic-impact',3],
  ['tactic-counter',2]
 ]){
  for(let i=0;i<Math.min(limit,c.owned[type]||0);i++)chosen.push(type);
 }
 for(const type of c.loadout){if(chosen.length===24)break;chosen.push(type);}
 assert.equal(chosen.length,24);
 const equipped=equipSpecialDeck(c,chosen);
 assert.equal(equipped.openedPacks,109);
 return equipped;
}
function run(collection,seed,phaseAware){
 let battle=officialBattleSetup({mode:'adventure',sectorNumber:110,
  bossPlanetId:19,bossSectorLevel:10,
  shipCollection:{cards:[{instanceId:'owned',shipId:'L03',level:5}],
   loadout:['owned']},
  specialCollection:collection,selectedPilot:'pilot_com_1',
  pilotInventory:{pilot_com_1:{unlocked:true,level:1}},nowMs:100,seed}).battle;
 let guard=0,phaseGuards=0,cycles=0;
 while(battle.phase!=='finished'&&cycles<TACTICAL_TIMING.maxRounds){
  const planning=phaseAware?battle:structuredClone(battle);
  if(!phaseAware)planning.sides.B.bossPlanetId=null;
  const ours=planTacticalAi(planning,'A');
  assert.equal(validateTacticalOrder(battle,'A',ours).ok,true);
  const specials=ours.specialIndices.map(i=>battle.sides.A.special.hand[i].type);
  const guarded=specials.some(type=>[
   'tactic-reactive','tactic-impact','tactical-cover','support-shield-repair'
  ].includes(type));
  if(guarded)guard++;
  if(guarded&&exclusiveMagmaPhase(battle.sides.B,battle.round)==='eruzione')phaseGuards++;
  const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const a=sealTacticalOrder(battle,'A',ours,at);assert.equal(a.ok,true,a.reason);
  const b=sealTacticalOrder(a.battle,'B',planTacticalAi(battle,'B'),at+1);
  assert.equal(b.ok,true,b.reason);
  const resolved=advanceTacticalDuel(b.battle,at+1);
  battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
  cycles++;
 }
 assert.equal(battle.phase,'finished');
 return {winner:battle.winner,cycles,guard,phaseGuards};
}
test('Io: confronta stessa IA con/senza scelta difensiva sulla fase pubblica (64 duelli)',()=>{
 const output=[];
 for(const [deck,collection] of [
  ['starter',createSpecialCollection()],['real_109_packs',realEarnedSpecialDeck()]
 ]){
  for(const phaseAware of [false,true]){
   const stats={deck,phaseAware,w:0,l:0,d:0,totalCycles:0,guard:0,phaseGuards:0};
   for(const seed of seeds){
    const result=run(collection,seed,phaseAware);
    stats[result.winner==='A'?'w':result.winner==='B'?'l':'d']++;
    stats.totalCycles+=result.cycles;stats.guard+=result.guard;
    stats.phaseGuards+=result.phaseGuards;
   }
   output.push(stats);
  }
 }
 assert.equal(output.length,4);
 assert.ok(output.every(x=>x.w+x.l+x.d===seeds.length));
 console.log('ECLISSI_IO_PHASE_GUARD_AB '+JSON.stringify(output));
});