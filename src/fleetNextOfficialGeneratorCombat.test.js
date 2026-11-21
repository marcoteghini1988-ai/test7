import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolvePreparedFleetTurn,advanceFleetCombatTime,
 validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {chargeElementalEnergy} from './fleetNext/elementalAbilities.js';
import {generatorCardCount,generatorCoolingOwnTurns} from './fleetNext/motherGeneratorBalance.js';
import {PACING_BALANCE_CANDIDATE} from './fleetNext/pacingBalanceCandidate.js';
import {componentDurations} from './fleetNext/componentTimerPacing.js';
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
