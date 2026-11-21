import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolvePreparedFleetTurn,advanceFleetCombatTime,
 validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {chargeElementalEnergy} from './fleetNext/elementalAbilities.js';
import {generatorCardCount,generatorCoolingOwnTurns} from './fleetNext/motherGeneratorBalance.js';
import {PACING_BALANCE_CANDIDATE} from './fleetNext/pacingBalanceCandidate.js';
import {componentDurations,advanceTimedComponents} from './fleetNext/componentTimerPacing.js';
const create=()=>createFleetNextBattle({
 shipA:'N00',shipB:'C01',raritaA:'Comune',raritaB:'Comune',
 supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],
 ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,seed:1717,nowMs:0
});
const aim=(cards=[],special=false)=>({
 cards,pass:false,activateElemental:special,targetKind:'part',
 targetId:'weapons',partId:'weapons'
});
test('Nuova battaglia: 3 timer per nave e HP Comune calibrati; Generatore non si rompe',()=>{
 const b=create();
 assert.equal(b.newGeneratorCombat,true);
 for(const side of Object.values(b.sides)){
  assert.equal(side.newGeneratorCombat,true);
  assert.equal(side.componentTimers.generator,undefined);
  assert.equal(side.weaponBalanceFactor,.6);
  assert.equal(side.componentDeteriorationFraction,.009);
  assert.equal(side.ships[0].hp,side.ships[0].maxHp);
  assert.deepEqual(Object.keys(side.componentTimers).sort(),
   ['bridge','command','weapons']);
  assert.equal(generatorCoolingOwnTurns(side),0);
 }
 const before=b.sides.A.ships[0].hp;
 assert.equal(before,Math.round(1050*.36*1.15));
});
test('ESEGUI senza carte, senza prenotazione: nessun tiro base della madre',()=>{
 const b=create();
 const hp=b.sides.B.ships[0].hp;
 assert.equal(validateFleetTurn(b,'A',aim()),null);
 const r=resolvePreparedFleetTurn(b,'A',aim(),1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.battle.sides.B.ships[0].hp,hp);
 assert.equal(r.shot.damage,0);
});
test('2 Carte Energia fisiche + prenotazione: scatto rapido, consumo 2 e cooldown',()=>{
 const b=create(),side=b.sides.A;
 side.hand=['energy-ionic','energy-ionic'];
 const hp=b.sides.B.ships[0].hp;
 const r=resolvePreparedFleetTurn(b,'A',aim([0,1],true),1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.events.some(e=>e.kind==='generator-shot'&&e.generatorTier==='quick'),true);
 assert.ok(r.battle.sides.B.ships[0].hp<hp);
 assert.equal(generatorCardCount(r.battle.sides.A),0);
 assert.equal(generatorCoolingOwnTurns(r.battle.sides.A),1);
});
test('1 Energia esistente + 3 carte nuove: prenotazione passa da 2 a 4 senza altri click',()=>{
 const b=create(),side=b.sides.A;
 assert.equal(chargeElementalEnergy(side,'ionic','energy-ionic'),true);
 side.hand=['energy-ionic','energy-ionic','energy-ionic'];
 const r=resolvePreparedFleetTurn(b,'A',aim([0,1,2],true),1000);
 assert.equal(r.ok,true,r.reason);
 const fired=r.events.find(e=>e.kind==='generator-shot');
 assert.equal(fired?.generatorTier,'heavy');
 assert.equal(fired?.spentPhysicalCards,4);
 assert.equal(generatorCardCount(r.battle.sides.A),0);
});
test('Energia non prenotata rimane nello slot e una Leggendaria vale UNA carta',()=>{
 const b=create(),side=b.sides.A;
 side.hand=['energy-ionic-l'];
 const r=resolvePreparedFleetTurn(b,'A',aim([0],false),1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.sides.B.ships[0].hp,b.sides.B.ships[0].hp);
 assert.equal(generatorCardCount(r.battle.sides.A),1);
 assert.equal(r.battle.sides.A.elementalCharges.ionic,4);
 assert.equal(r.events.some(e=>e.kind==='generator-shot'),false);
});
test('Arma Sequenza: colpo autonomo senza scarica gratuita o prenotazione',()=>{
 const b=create(),side=b.sides.A;
 side.machines.push({id:'w-sequence-test',slot:0,hp:1,maxHp:1,
  untilPly:20,damageMode:'sequence',soloDamage:30,chainDamage:70,
  sequenceStage:1,power:0,weaponElementId:'ionic',
  sourceCardId:'weapon-sequence-test',name:'Test Sequenza'});
 const enemyHp=b.sides.B.ships[0].hp;
 const r=resolvePreparedFleetTurn(b,'A',aim(),1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.battle.sides.B.ships[0].hp<enemyHp);
 assert.ok(r.events.some(e=>e.kind==='impact'), 'Deve sparare senza attacco base');
 assert.equal(r.events.some(e=>e.kind==='generator-shot'),false);
});
test('L orologio di partita avanza anche tra le carte e consuma i 3 timer in parallelo',()=>{
 const b=create(),max=Math.max(...Object.values(componentDurations('N00','Comune')));
 const before=b.sides.A.ships[0].hp;
 const advanced=advanceFleetCombatTime(b,40000);
 assert.equal(advanced.battle.sides.A.componentTimers.weapons.remainingSeconds,210);
 assert.equal(advanced.battle.sides.A.ships[0].hp,before);
 assert.equal(advanced.battle.componentClockSeconds,40);
 const allEnds=Math.max(max,...Object.values(componentDurations('C01','Comune')));
 const all=advanceFleetCombatTime(advanced.battle,(allEnds+10)*1000);
 assert.ok(all.battle.sides.A.componentTimers.weapons.expired);
 assert.ok(all.battle.sides.A.componentTimers.command.expired);
 assert.ok(all.battle.sides.A.componentTimers.bridge.expired);
 assert.ok(all.battle.sides.A.ships[0].hp<before);
 assert.ok(all.battle.sides.B.ships[0].hp<create().sides.B.ships[0].hp);
});
test('Il deterioramento della nave puo terminare la partita senza quarto timer Generatore',()=>{
 const b=create();
 const after=advanceFleetCombatTime(b,600000);
 assert.equal(after.battle.phase,'finished');
 assert.equal(after.battle.sides.A.componentTimers.generator,undefined);
 assert.equal(after.battle.sides.B.componentTimers.generator,undefined);
 assert.ok(after.battle.finishedAtMs<600000);
});

test('Il cronometro individuale avanza SOLO nel turno del proprietario',()=>{
 const b=create();
 b.componentClockMode='active-player-only';
 for(const side of Object.values(b.sides)){
  side.componentDeteriorationFraction=.01;
  for(const [key,at] of Object.entries({weapons:165,command:190,bridge:210})){
   side.componentTimers[key].initialSeconds=at;
   side.componentTimers[key].remainingSeconds=at;
  }
 }
 const once=advanceFleetCombatTime(b,10000);
 assert.equal(once.battle.sides.A.componentElapsedSeconds,10);
 assert.equal(once.battle.sides.B.componentElapsedSeconds,0);
 assert.equal(once.battle.sides.B.componentTimers.weapons.remainingSeconds,165);
 const twice=advanceFleetCombatTime(once.battle,10000);
 assert.equal(twice.battle.sides.A.componentElapsedSeconds,10,'Nessun doppio conteggio');
 const a=resolvePreparedFleetTurn(twice.battle,'A',aim(),10000);
 assert.equal(a.ok,true,a.reason);
 assert.equal(a.battle.turn,'B');
 const duringB=advanceFleetCombatTime(a.battle,22000);
 assert.equal(duringB.battle.sides.A.componentElapsedSeconds,10);
 assert.equal(duringB.battle.sides.B.componentElapsedSeconds,12);
 assert.equal(duringB.battle.sides.A.componentTimers.bridge.remainingSeconds,200);
 assert.equal(duringB.battle.sides.B.componentTimers.bridge.remainingSeconds,198);
 const bTurn=resolvePreparedFleetTurn(duringB.battle,'B',aim(),22000);
 assert.equal(bTurn.ok,true,bTurn.reason);
 const nextA=advanceFleetCombatTime(bTurn.battle,28000);
 assert.equal(nextA.battle.sides.A.componentElapsedSeconds,16);
 assert.equal(nextA.battle.sides.B.componentElapsedSeconds,12);
});
test('Deterioramento individuale: 1% HP massimi dopo 210 secondi PROPRI, pausa fuori turno',()=>{
 const b=create(),side=b.sides.A;
 b.componentClockMode='active-player-only';
 side.componentDeteriorationFraction=.01;
 for(const [key,at] of Object.entries({weapons:169,command:191,bridge:210})){
  side.componentTimers[key].initialSeconds=at;
  side.componentTimers[key].remainingSeconds=at;
 }
 advanceTimedComponents(side,209,{drainFraction:.01});
 const full=side.ships[0].hp;
 // Il giocatore ha gia' consumato 209 secondi nei suoi turni precedenti:
 // l'ultimo componente scade al suo secondo 210, senza danno nello stesso secondo.
 const t210=advanceFleetCombatTime(b,1000);
 assert.equal(t210.battle.sides.A.componentElapsedSeconds,210);
 assert.equal(t210.battle.sides.A.componentTimers.bridge.expired,true);
 assert.equal(t210.battle.sides.A.ships[0].hp,full);
 const t211=advanceFleetCombatTime(t210.battle,2000);
 assert.equal(t211.battle.sides.A.componentElapsedSeconds,211);
 assert.ok(Math.abs((full-t211.battle.sides.A.ships[0].hp)-full*.01)<.02);
 const repeated=advanceFleetCombatTime(t211.battle,2000);
 assert.equal(repeated.battle.sides.A.ships[0].hp,t211.battle.sides.A.ships[0].hp);
 const passed=resolvePreparedFleetTurn(repeated.battle,'A',aim(),2000);
 assert.equal(passed.ok,true,passed.reason);
 const idle=advanceFleetCombatTime(passed.battle,21000);
 assert.equal(idle.battle.sides.A.componentElapsedSeconds,211);
 assert.equal(idle.battle.sides.A.ships[0].hp,t211.battle.sides.A.ships[0].hp);
 assert.equal(idle.battle.sides.B.componentElapsedSeconds,19);
});
