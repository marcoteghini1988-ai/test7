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

// Diagnostica per CICLO, non una nuova regola di combattimento.
// Per ogni ordine autentico sigillato esegue una controprova nello stesso
// stato togliendo SOLO il potere esclusivo magmatico di Io da una COPIA.
// La controprova non entra nella partita reale e non modifica le ricompense.
test('Io: telemetria di Carica/Eruzione/Raffreddamento e guardie vere, con controprova isolata',()=>{
 const sampleSeeds=[17,171,2026,4096,8127,919,1337,251,101,517];
 const summaries=[];
 const detail=[];
 for(const [deck,collection] of [
  ['starter',createSpecialCollection()],
  ['pacchetti_109_vinti_ipotetici',realEarnedSpecialDeck()]
 ]){
  let wins=0,losses=0,draws=0,cycles=0;
  const phases=Object.fromEntries(['carica','eruzione','raffreddamento'].map(p=>[p,{
   cycles:0,packet:0,deltaPacket:0,damage:0,deltaDamage:0,
   escortAbsorbed:0,guardAbsorbed:0,repairHP:0,defensiveInHand:0,
   defensivePlayed:0,guardEvents:0,guardCardBreakdown:{},precisionTaken:0,
   vitalKosAtEnd:0,enemyShieldAlreadyZero:0
  }]));
  for(const seed of sampleSeeds){
   let battle=officialBattleSetup({mode:'adventure',sectorNumber:110,
    bossPlanetId:19,bossSectorLevel:10,
    shipCollection:{cards:[{instanceId:'owned',shipId:'L03',level:5}],
     loadout:['owned']},specialCollection:collection,
    selectedPilot:'pilot_com_1',
    pilotInventory:{pilot_com_1:{unlocked:true,level:1}},
    nowMs:100,seed}).battle;
   while(battle.phase!=='finished'){
    assert.ok(battle.round<=TACTICAL_TIMING.maxRounds,'Io oltre 20 cicli');
    const round=battle.round;
    const phase=exclusiveMagmaPhase(battle.sides.B,round);
    assert.equal(phase,['carica','eruzione','raffreddamento'][(round-1)%3]);
    const stats=phases[phase];
    const handTypes=battle.sides.A.special.hand.map(c=>c.type);
    const beforeA=battle.sides.A.defense.shield.hp;
    const orderA=planTacticalAi(battle,'A'),orderB=planTacticalAi(battle,'B');
    const chosen=orderA.specialIndices.map(i=>handTypes[i]);
    const defenders=['tactic-reactive','tactic-impact','tactical-cover','support-shield-repair'];
    const available=handTypes.some(t=>defenders.includes(t));
    const played=chosen.filter(t=>defenders.includes(t));
    stats.cycles++;
    stats.defensiveInHand+=Number(available);
    stats.defensivePlayed+=Number(played.length>0);
    for(const type of played)stats.guardCardBreakdown[type]=(stats.guardCardBreakdown[type]??0)+1;
    const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
    const a=sealTacticalOrder(battle,'A',orderA,at);
    assert.equal(a.ok,true,'Io ordine A '+a.reason);
    const b=sealTacticalOrder(a.battle,'B',orderB,at+1);
    assert.equal(b.ok,true,'Io ordine B '+b.reason);
    const withoutMagma=structuredClone(b.battle);
    withoutMagma.sides.B.bossExclusive=null;
    const real=advanceTacticalDuel(b.battle,at+1);
    const control=advanceTacticalDuel(withoutMagma,at+1);
    assert.equal(real.phase,'resolving');
    assert.equal(control.phase,'resolving');
    const current=real.history.at(-1),baseline=control.history.at(-1);
    const native=history=>history.impacts.find(i=>i.kind==='barrier'&&i.by==='B');
    const hit=native(current),ordinary=native(baseline);
    assert.ok(hit&&ordinary,'Io armi native autentiche');
    const deltaPacket=hit.packet-ordinary.packet;
    const deltaDamage=hit.damage-ordinary.damage;
    if(phase==='carica')assert.equal(deltaPacket,0,'carica non deve avere bonus nativo');
    if(phase==='eruzione')assert.ok(deltaPacket>=0,'eruzione non puo essere una penalita');
    if(phase==='raffreddamento')assert.ok(deltaPacket<=0,'raffreddamento non puo potenziare');
    assert.equal(current.impacts.find(i=>i.kind==='barrier'&&i.by==='A').packet,
     baseline.impacts.find(i=>i.kind==='barrier'&&i.by==='A').packet,
     'la controprova non cambia il fuoco del giocatore');
    const escort=current.impacts.filter(i=>i.kind==='escort_barrier'&&i.by==='B');
    const precision=current.impacts.filter(i=>i.kind==='precision'&&i.by==='B');
    const realGuard=hit.guardAbsorbed+escort.reduce((sum,i)=>sum+(i.guardAbsorbed||0),0);
    const totalDamage=hit.damage+escort.reduce((sum,i)=>sum+i.damage,0);
    const preRepairA=current.snapshots.prepared.A.defense.shield.hp;
    stats.packet+=hit.packet;
    stats.deltaPacket+=deltaPacket;
    stats.damage+=totalDamage;
    stats.deltaDamage+=deltaDamage;
    stats.escortAbsorbed+=hit.intercepted;
    stats.guardAbsorbed+=realGuard;
    stats.guardEvents+=Number(realGuard>0);
    stats.repairHP+=Math.max(0,preRepairA-beforeA);
    stats.precisionTaken+=precision.reduce((sum,i)=>sum+i.damage,0);
    stats.vitalKosAtEnd+=Object.values(real.sides.A.defense.parts).filter(p=>p.hp===0).length;
    stats.enemyShieldAlreadyZero+=Number(beforeA===0);
    if(detail.length<0)detail.push({deck,seed,round,phase});
    if(seed===17)detail.push({deck,seed,round,phase,bossPacket:hit.packet,
     magmaDeltaPacket:deltaPacket,bossDamage:totalDamage,
     magmaDeltaDamage:deltaDamage,escortAbsorbed:hit.intercepted,
     guardAbsorbed:realGuard,repairHP:Math.max(0,preRepairA-beforeA),
     defensiveInHand:available,defensivesPlayed:played,
     shieldBefore:beforeA,shieldAfter:real.sides.A.defense.shield.hp,
     precisionTaken:precision.reduce((sum,i)=>sum+i.damage,0)});
    battle=advanceTacticalDuel(real,real.resolveUntilMs);
    cycles++;
   }
   if(battle.winner==='A')wins++;
   else if(battle.winner==='B')losses++;
   else draws++;
  }
  assert.equal(wins+losses+draws,sampleSeeds.length);
  summaries.push({deck,wins,losses,draws,cycles,phases});
 }
 for(const entry of summaries)assert.ok(Object.values(entry.phases).every(p=>p.cycles>0),
  'tutte le fasi del ciclo Io osservate in '+entry.deck);
 console.log('ECLISSI_IO_PHASE_TELEMETRY '+JSON.stringify(summaries));
 console.log('ECLISSI_IO_PHASE_SEED17 '+JSON.stringify(detail));
});
