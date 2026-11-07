import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,exchangeTacticalNumericDuringPlanning,
 sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {tacticalAfroditeRecycleCooldownMs} from './tacticalBossDecks.js';
const EMPTY={numericIndices:[],specialIndices:[]};
const build=(level=1)=>createTacticalDuel({shipA:'C01',levelA:1,shipB:'C02',levelB:1,
 nowMs:1000,bossNumericDeckA:level?{id:'planet_char_3',level}:null});
const ids=p=>[...p.hand,...p.deck,...p.discard].map(c=>c.id);
test('Afrodite: gradi originali 13 / 11 / 9 secondi L1–3, poi 9 fino a L6',()=>{
 for(const [level,ms]of [[1,13000],[2,11000],[3,9000],[4,9000],[5,9000],[6,9000]]){
  const b=build(level);
  assert.equal(tacticalAfroditeRecycleCooldownMs(b.sides.A),ms);
  assert.equal(b.sides.A.numericExchangeReadyAt,1000+ms);
 }
 assert.equal(tacticalAfroditeRecycleCooldownMs(build(null).sides.A),null);
});
test('Ricambio vero: niente movimento prima della scadenza, una carta scartata e una pescata, mai duplicate',()=>{
 const b=build(1),prev=structuredClone(b.sides.A.numeric);
 const early=exchangeTacticalNumericDuringPlanning(b,'A',2,13999);
 assert.equal(early.ok,false);assert.equal(early.reason,'harmonic_recycle_cooldown');
 assert.deepEqual(b.sides.A.numeric,prev);
 const change=exchangeTacticalNumericDuringPlanning(b,'A',2,14000);
 assert.equal(change.ok,true,change.reason);
 const after=change.battle.sides.A.numeric;
 assert.equal(after.hand.length,7);assert.equal(after.deck.length,44);assert.equal(after.discard.length,1);
 assert.equal(after.hand[2].id,prev.deck[0].id,'Il nuovo valore arriva dal mazzo reale');
 assert.equal(after.discard[0].id,prev.hand[2].id);
 assert.deepEqual(after.hand.filter((_,i)=>i!==2),prev.hand.filter((_,i)=>i!==2));
 assert.equal(new Set(ids(after)).size,52);
 assert.deepEqual(new Set(ids(after)),new Set(ids(prev)));
 assert.equal(change.battle.sides.A.numericExchangeReadyAt,27000);
 assert.deepEqual(b.sides.A.numeric,prev,'Il duello originale non viene mutato');
 const blocked=exchangeTacticalNumericDuringPlanning(change.battle,'A',3,26999);
 assert.equal(blocked.reason,'harmonic_recycle_cooldown');
 const second=exchangeTacticalNumericDuringPlanning(change.battle,'A',3,27000);
 assert.equal(second.ok,true);
 assert.equal(new Set(ids(second.battle.sides.A.numeric)).size,52);
});
test('Tempo reale: al grado 3 si possono fare tre cambi durante 30s, nessuno dopo la scadenza',()=>{
 let b=build(3);
 for(const t of [10000,19000,28000]){
  const r=exchangeTacticalNumericDuringPlanning(b,'A',0,t);
  assert.equal(r.ok,true,r.reason+' '+t);
  b=r.battle;
 }
 assert.equal(b.sides.A.numericInstantExchanges,3);
 assert.equal(exchangeTacticalNumericDuringPlanning(b,'A',0,31000).reason,'preparation_expired');
 assert.equal(new Set(ids(b.sides.A.numeric)).size,52);
});
test('Ricambio non permette cambiare la mano dopo Pronto, né a mazzo non ottenuto',()=>{
 const b=build(2);
 assert.equal(exchangeTacticalNumericDuringPlanning(b,'B',0,20000).reason,'harmonic_recycle_unavailable');
 assert.equal(exchangeTacticalNumericDuringPlanning(build(null),'A',0,20000).reason,'harmonic_recycle_unavailable');
 assert.equal(exchangeTacticalNumericDuringPlanning(b,'A',-1,20000).reason,'numeric_selection');
 assert.equal(exchangeTacticalNumericDuringPlanning(b,'A',7,20000).reason,'numeric_selection');
 const committed=sealTacticalOrder(b,'A',EMPTY,2000);
 assert.equal(committed.ok,true);
 assert.equal(exchangeTacticalNumericDuringPlanning(committed.battle,'A',0,23000).reason,'already_committed');
});
test('Il cooldown sopravvive al passaggio di turno, non crea risorse o carte fuori dal mazzo',()=>{
 let b=build(1);
 b=exchangeTacticalNumericDuringPlanning(b,'A',0,14000).battle;
 const first=sealTacticalOrder(b,'A',EMPTY,14001);
 assert.equal(first.ok,true);
 const second=sealTacticalOrder(first.battle,'B',EMPTY,14002);
 assert.equal(second.ok,true);
 const fight=advanceTacticalDuel(second.battle,14002);
 assert.equal(fight.phase,'resolving');
 const later=advanceTacticalDuel(fight,fight.resolveUntilMs);
 assert.equal(later.phase,'planning');
 assert.equal(later.sides.A.numericExchangeReadyAt,27000);
 assert.equal(exchangeTacticalNumericDuringPlanning(later,'A',2,26999).ok,false);
 assert.equal(exchangeTacticalNumericDuringPlanning(later,'A',2,27000).ok,true);
});
