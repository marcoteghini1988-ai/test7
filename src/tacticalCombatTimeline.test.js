import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {weaponEffect} from './mathWeaponEffects.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {tacticalCombatTimeline,tacticalPlaybackStage,tacticalPlaybackElapsed,
 projectedCombatSides,currentTacticalPlayback,TACTICAL_STAGES} from './tacticalCombatTimeline.js';
const silent={specialIndices:[],numericIndices:[]};
function cycle(b,aa=silent,bb=silent,time=100){
 const a=sealTacticalOrder(b,'A',aa,time);
 assert.equal(a.ok,true,a.reason);
 const c=sealTacticalOrder(a.battle,'B',bb,time+1);
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,time+1);
}
function withShields(b,hp=40){const x=structuredClone(b);x.sides.A.defense.shield.hp=hp;x.sides.B.defense.shield.hp=hp;return x;}

test('Timeline follows 30s/8s rhythm with stable, deterministic positions for every event',()=>{
 const b=cycle(createTacticalDuel());
 const events=tacticalCombatTimeline(b);
 assert.deepEqual(events,tacticalCombatTimeline(b));
 assert.ok(events.length>3);
 assert.ok(events.every(e=>e.atMs>=0&&e.atMs+e.durationMs<=8000));
 assert.ok(events.every((e,i)=>!i||events[i-1].atMs<=e.atMs));
 assert.equal(tacticalPlaybackStage(0).id,'tactical');
 assert.equal(tacticalPlaybackStage(2500).id,'gunfire');
 assert.equal(tacticalPlaybackStage(4500).id,'barrier');
 assert.equal(tacticalPlaybackStage(6100).id,'precision');
 assert.equal(tacticalPlaybackStage(7500).id,'finished');
 assert.equal(TACTICAL_STAGES.finished,8000);
 const start=b.resolveUntilMs-8000;
 assert.equal(tacticalPlaybackElapsed(b,start),0);
 assert.equal(tacticalPlaybackElapsed(b,start+4800),4800);
 assert.equal(tacticalPlaybackElapsed(b,start+10000),8000);
});
test('Every real weapon of all 17 mother ships has one native profile; no generic projectile is invented',()=>{
 const weaponIds=new Set();
 for(const ship of PHASE1_CATALOG.ships){
  const b=cycle(createTacticalDuel({shipA:ship.id,shipB:'N00',levelA:5}));
  const events=tacticalCombatTimeline(b);
  const native=b.sides.A.weapons;
  const own=events.filter(e=>e.type==='gun'&&e.by==='A');
  assert.equal(new Set(own.map(e=>e.weaponId)).size,native.length,ship.id);
  for(const w of native){
   weaponIds.add(w.id);
   const shots=own.filter(e=>e.weaponId===w.id);
   assert.ok(shots.length>0);
   assert.equal(shots[0].profile,weaponEffect(w.id).profile);
   assert.equal(shots[0].color,weaponEffect(w.id).color);
   assert.ok(shots.every(s=>s.atMs+s.durationMs<=4500));
  }
 }
 assert.equal(weaponIds.size,42);
});
test('Shield and vital HP change visually only after their impact stage, without changing final engine state',()=>{
 const b=cycle(withShields(createTacticalDuel()),{
  specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'
 });
 const initial=b.history.at(-1).snapshots.before;
 const early=projectedCombatSides(b,1100);
 const middle=projectedCombatSides(b,3000);
 const barrier=projectedCombatSides(b,4650);
 const late=projectedCombatSides(b,6750);
 assert.equal(early.B.defense.shield.hp,initial.B.defense.shield.hp);
 assert.equal(middle.B.defense.shield.hp,initial.B.defense.shield.hp);
 assert.ok(barrier.B.defense.shield.hp<initial.B.defense.shield.hp);
 assert.equal(barrier.B.defense.parts.weapons.hp,10);
 assert.equal(late.B.defense.parts.weapons.hp,0);
 assert.equal(late.B.defense.shield.hp,b.sides.B.defense.shield.hp);
 assert.equal(late.B.defense.parts.weapons.hp,b.sides.B.defense.parts.weapons.hp);
});
test('Only played special types are shown, not freshly drawn replacement cards',()=>{
 const b=cycle(createTacticalDuel(),
  {specialIndices:[0,1],numericIndices:[]},
  {specialIndices:[0],numericIndices:[]});
 const t=tacticalCombatTimeline(b);
 const specials=t.filter(e=>e.type==='special');
 assert.equal(specials.length,3);
 assert.deepEqual(specials.map(e=>e.cardType).sort(),
  ['tactic-power-shift','tactic-reactive','tactic-scan'].sort());
});
test('Countered, invalid and protected precision never display successful hits',()=>{
 const b=cycle(withShields(createTacticalDuel()),
  {specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'},
  {specialIndices:[3],numericIndices:[],counterVitalId:'weapons'});
 const e=tacticalCombatTimeline(b).find(x=>x.type==='precision'&&x.by==='A');
 assert.equal(e.reason,'countered');
 assert.equal(e.damage,0);
 assert.ok(e.label.includes('CONTROMISURA'));
 const invalid=cycle(withShields(createTacticalDuel()),
  {specialIndices:[],numericIndices:[0,1],vitalId:'weapons',op:'minus'});
 const inv=tacticalCombatTimeline(invalid).find(x=>x.type==='precision'&&x.by==='A');
 assert.equal(inv.damage,0);
 assert.equal(inv.reason,'invalid_signature');
 const protectedAttack=cycle(createTacticalDuel(),
  {specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'});
 const pro=tacticalCombatTimeline(protectedAttack).find(x=>x.type==='precision'&&x.by==='A');
 assert.equal(pro.reason,'protected');
});
test('The game winner and barrier impacts are read from the result, never recalculated by animation',()=>{
 const b=cycle(createTacticalDuel());
 const t=tacticalCombatTimeline(b);
 const impacts=t.filter(e=>e.type==='barrier');
 assert.equal(impacts.length,2);
 assert.equal(impacts.find(e=>e.by==='A').damage,b.history[0].shieldA);
 assert.equal(impacts.find(e=>e.by==='B').damage,b.history[0].shieldB);
 const start=b.resolveUntilMs-8000;
 const frame=currentTacticalPlayback(b,start+2600);
 assert.ok(frame.shots.some(e=>e.type==='gun'));
 assert.equal(frame.stage.id,'gunfire');
 assert.equal(frame.outcome,undefined);
 assert.equal(currentTacticalPlayback(b,start+7800).outcome.label,'NUOVO CICLO');
});
