import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const empty=()=>({numericIndices:[],specialIndices:[],exchangeIndices:[]});
function cycle(battle,orderA=empty(),orderB=empty()){
 const first=sealTacticalOrder(battle,'A',orderA,battle.deadlineMs-100);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',orderB,battle.deadlineMs-90);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,battle.deadlineMs-90);
}
const battle=arenaId=>createTacticalDuel({shipA:'C01',shipB:'R04',levelA:3,levelB:3,
 seed:18,nowMs:100,arenaId});

test('Detriti riducono soltanto il danno vero dopo intercettazione scudiera',()=>{
 const titan=cycle(battle('titanium'));
 const debris=cycle(battle('debris'));
 const t=titan.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='A');
 const d=debris.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='A');
 assert.equal(t.packet,d.packet);
 assert.equal(t.intercepted,d.intercepted);
 assert.ok(d.damage<=t.damage);
 assert.ok(debris.sides.B.defense.shield.hp>=titan.sides.B.defense.shield.hp);
});

test('Risonanza aggiunge Sincronia solo dopo una formula valida consumata',()=>{
 // R04: Sistema armi ha firma meno tre. 8-5 = 3 nella mano A.
 const order={numericIndices:[2,3],specialIndices:[],vitalId:'weapons',op:'minus',exchangeIndices:[]};
 const baseline=cycle(battle('titanium'),order);
 const resonance=cycle(battle('resonance'),order);
 assert.equal(resonance.arenaValidCalculations,1);
 assert.equal(baseline.arenaValidCalculations,1);
 assert.equal(resonance.sides.A.sync,baseline.sides.A.sync+1);
 assert.equal(cycle(battle('resonance')).arenaValidCalculations,0);
});

test('Plasma potenzia soltanto la precisione valida con tre carte',()=>{
 const make=id=>{
  const b=battle(id);
  b.sides.A.numeric.hand=[...b.sides.A.numeric.hand];
  b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:1};
  b.sides.A.numeric.hand[1]={...b.sides.A.numeric.hand[1],value:3};
  b.sides.A.numeric.hand[2]={...b.sides.A.numeric.hand[2],value:5};
  b.sides.B.defense.shield.hp=0;
  return b;
 };
 // R04 possiede 9 come firma ADDIZIONE al generatore.
 const order={numericIndices:[0,1,2],specialIndices:[],vitalId:'shieldGenerator',op:'plus',exchangeIndices:[]};
 const standard=cycle(make('titanium'),order);
 const boosted=cycle(make('plasma'),order);
 const hp=b=>b.history.at(-1).impacts.find(i=>i.kind==='precision'&&i.by==='A');
 assert.equal(hp(standard).reason,'hit');
 assert.equal(hp(boosted).reason,'hit');
 assert.ok(hp(boosted).damage>=hp(standard).damage);
});
