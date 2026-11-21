import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SHIP_RARITIES} from './fleetNext/shipRarity.js';
import {COMPONENT_TIMER_BASE_SECONDS,COMPONENT_TIMER_RARITY_BONUS,
 TIMED_COMPONENT_IDS,CANDIDATE_DRAIN_FRACTION_PER_SECOND,componentDurations,
 initializeComponentTimers,advanceTimedComponents,advanceBattleComponentClock}
 from './fleetNext/componentTimerPacing.js';

const make=(shipId='N00',rarita='Comune')=>{
 const b=createFleetNextBattle({shipA:shipId,shipB:shipId,raritaA:rarita,raritaB:rarita,
  supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],
  ruleset:HP_SYNC_RULESET,mode:'pvp',seed:321,nowMs:0});
 for(const side of Object.values(b.sides))initializeComponentTimers(side,rarita);
 b.componentClockSeconds=0;
 return b;
};
test('12 modelli x 4 rarita: i tre timer sono diversi e crescono con evoluzione',()=>{
 assert.equal(Object.keys(COMPONENT_TIMER_BASE_SECONDS).length,12);
 assert.equal(Object.keys(COMPONENT_TIMER_RARITY_BONUS).length,4);
 for(const shipId of Object.keys(COMPONENT_TIMER_BASE_SECONDS)){
  let previous=null;
  for(const rarity of SHIP_RARITIES){
   const durations=componentDurations(shipId,rarity);
   assert.equal(Object.keys(durations).length,3);
   assert.ok(Object.values(durations).every(n=>Number.isInteger(n)&&n>200));
   if(previous)for(const id of TIMED_COMPONENT_IDS)
    assert.ok(durations[id]>previous[id],shipId+'/'+id);
   previous=durations;
  }
 }
 for(const id of ['C01','R01','E02']){
  const d=componentDurations(id,'Leggendaria');
  assert.ok(d.weapons>d.command&&d.weapons>d.bridge,id);
 }
 for(const id of ['C03','R04','L03']){
  const d=componentDurations(id,'Leggendaria');
  assert.ok(d.command>d.weapons,id);
 }
});
test('Scorrono contemporaneamente su entrambe le flotte e il Generatore non ha timer',()=>{
 const b=make('C03','Epica');
 const startingHp=b.sides.A.ships[0].hp;
 const s=advanceBattleComponentClock(b,200);
 assert.equal(s.events.length,0);
 for(const side of Object.values(b.sides)){
  assert.equal(side.componentElapsedSeconds,200);
  assert.equal(side.componentTimers.generator,undefined);
  assert.equal(side.ships[0].hp,startingHp);
  for(const id of TIMED_COMPONENT_IDS)
   assert.equal(side.componentTimers[id].remainingSeconds,
    componentDurations('C03','Epica')[id]-200);
 }
});
test('Deterioramento SOLO dopo il terzo timer; anche con un componente guasto non perde HP',()=>{
 const b=make('N00','Comune');
 const before=b.sides.A.ships[0].hp;
 const deadlines=componentDurations('N00','Comune');
 assert.equal(deadlines.bridge,Math.max(...Object.values(deadlines)));
 const r1=advanceBattleComponentClock(b,deadlines.weapons+1);
 assert.ok(r1.events.some(e=>e.component==='weapons'));
 assert.equal(b.sides.A.ships[0].hp,before);
 assert.equal(b.sides.B.ships[0].hp,before);
 const r2=advanceBattleComponentClock(b,deadlines.bridge);
 assert.ok(r2.events.some(e=>e.component==='bridge'));
 assert.equal(b.sides.A.ships[0].hp,before);
 const r3=advanceBattleComponentClock(b,deadlines.bridge+10);
 const loss=Math.round(before*CANDIDATE_DRAIN_FRACTION_PER_SECOND*10*100)/100;
 assert.equal(b.sides.A.ships[0].hp,Math.round((before-loss)*100)/100);
 assert.equal(b.sides.B.ships[0].hp,b.sides.A.ships[0].hp);
 assert.equal(r3.events.filter(e=>e.kind==='mother-deterioration').length,2);
});
test('Nessun doppio consumo del tempo; perdita proporzionale alla rarita e supporti intatti',()=>{
 const sideA=make('C03','Comune').sides.A;
 const sideB=make('C03','Leggendaria').sides.B;
 for(const [side,rarity] of [[sideA,'Comune'],[sideB,'Leggendaria']]){
  const d=componentDurations('C03',rarity);
  const m=Math.max(...Object.values(d));
  side.escorts=[{hp:113,maxHp:113,destroyed:false}];
  const before=side.ships[0].hp;
  advanceTimedComponents(side,m);
  advanceTimedComponents(side,m+20);
  const after=side.ships[0].hp;
  advanceTimedComponents(side,m+20);
  assert.equal(side.ships[0].hp,after);
  assert.equal(side.escorts[0].hp,113);
  assert.equal(Math.round(100*(before-after)/before),18);
 }
});
test('Dopo i timer la partita prosegue, ma puo terminare per HP nave madre zero',()=>{
 const b=make('L04','Comune');
 const max=Math.max(...Object.values(componentDurations('L04','Comune')));
 const start=advanceBattleComponentClock(b,max);
 assert.equal(b.phase,'playing');
 assert.equal(start.events.filter(e=>e.kind==='mother-deterioration').length,0);
 const r=advanceBattleComponentClock(b,max+200);
 assert.equal(b.phase,'finished');
 assert.equal(b.winner,'draw');
 assert.equal(b.sides.A.ships[0].hp,0);
 assert.equal(b.sides.B.ships[0].hp,0);
 assert.equal(r.events.filter(e=>e.kind==='mother-deterioration').length,2);
});
