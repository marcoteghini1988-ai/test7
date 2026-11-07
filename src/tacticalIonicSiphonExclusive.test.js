import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {IONIC_SIPHON_MAX,transferExclusiveIonicSync} from './tacticalExclusiveBosses.js';

const EMPTY={specialIndices:[],numericIndices:[]};
function fixture({bossPlanetB=7,syncA=31,syncB=4,shieldA=60,levelA=1}={}){
 const b=createTacticalDuel({shipA:'C01',shipB:'C02',levelA,levelB:1,bossPlanetB});
 b.sides.A.sync=syncA;
 b.sides.B.sync=syncB;
 b.sides.A.defense.shield.hp=shieldA;
 return b;
}
function cycle(b,orderA=EMPTY,orderB=EMPTY,at=100){
 const aa=sealTacticalOrder(b,'A',orderA,at);
 assert.equal(aa.ok,true,aa.reason);
 const bb=sealTacticalOrder(aa.battle,'B',orderB,at+1);
 assert.equal(bb.ok,true,bb.reason);
 return advanceTacticalDuel(bb.battle,at+1);
}
const gunB=r=>r.history.at(-1).impacts.find(hit=>hit.kind==='barrier'&&hit.by==='B');

test('Sentinella Ionica: solo un colpo che ferisce la barriera trasferisce 8 Sincronia esistente, prima dei premi',()=>{
 const original=fixture(),normal=fixture({bossPlanetB:null});
 const poisoned=cycle(original),plain=cycle(normal);
 assert.ok(gunB(poisoned).damage>0,'Il pacchetto nativo del boss deve davvero ferire la barriera');
 assert.equal(gunB(poisoned).damage,gunB(plain).damage,'Il Sifone non modifica le armi');
 assert.deepEqual(poisoned.sides.A.defense,plain.sides.A.defense,'Non tocca i vitali');
 assert.deepEqual(poisoned.sides.B.defense,plain.sides.B.defense,'Non tocca lo scudo del boss');
 assert.equal(poisoned.sides.A.sync,plain.sides.A.sync-IONIC_SIPHON_MAX);
 assert.equal(poisoned.sides.B.sync,plain.sides.B.sync+IONIC_SIPHON_MAX);
 assert.equal(poisoned.sides.A.sync+poisoned.sides.B.sync,
  plain.sides.A.sync+plain.sides.B.sync,'La Sincronia viene trasferita, mai creata');
 assert.ok(poisoned.lastEvents.some(e=>e.includes('Sifone Quantico trasferisce 8')));
 assert.equal(plain.lastEvents.some(e=>e.includes('Sifone Quantico')),false);
 // Same actual draws, no free special or numeric cards:
 assert.deepEqual(poisoned.sides.A.numeric,plain.sides.A.numeric);
 assert.deepEqual(poisoned.sides.B.special,plain.sides.B.special);
});

test('Sifone: la Sincronia appena guadagnata a fine ciclo non puo essere rubata nello stesso ciclo',()=>{
 const done=cycle(fixture({syncA:0,syncB:0}));
 assert.ok(gunB(done).damage>0);
 assert.equal(done.sides.A.sync,25);
 assert.equal(done.sides.B.sync,25);
 assert.equal(done.lastEvents.some(e=>e.includes('Sifone Quantico')),false);
});

test('Sifone: cap a 100 e quantita del giocatore determinano il trasferimento senza perdite',()=>{
 const cases=[
  {a:5,b:95,steal:5,afterA:25,afterB:100},
  {a:20,b:98,steal:2,afterA:43,afterB:100},
  {a:20,b:100,steal:0,afterA:45,afterB:100},
  {a:7,b:0,steal:7,afterA:25,afterB:32}
 ];
 for(const {a,b,steal,afterA,afterB} of cases){
  const done=cycle(fixture({syncA:a,syncB:b}));
  assert.ok(gunB(done).damage>0);
  assert.equal(done.sides.A.sync,afterA,JSON.stringify({a,b,steal}));
  assert.equal(done.sides.B.sync,afterB,JSON.stringify({a,b,steal}));
  assert.equal(done.lastEvents.some(e=>e.includes('Sifone Quantico')),steal>0);
 }
});

test('Sifone: non si attiva con barriera gia a zero (anche se un colpo colpisce scudiere)',()=>{
 const done=cycle(fixture({syncA:48,syncB:12,shieldA:0,levelA:5}));
 assert.equal(gunB(done).damage,0);
 assert.equal(done.sides.A.sync,73);
 assert.equal(done.sides.B.sync,37);
 assert.equal(done.lastEvents.some(e=>e.includes('Sifone Quantico')),false);
});

test('Sifone: la Sincronia spesa davvero per Fusione prima dello scontro non e piu disponibile',()=>{
 const b=fixture({syncA:100,syncB:0,levelA:3});
 const done=cycle(b,{specialIndices:[3],numericIndices:[]},EMPTY);
 assert.ok(done.lastEvents.some(e=>e.includes('costo 100 Sincronia')));
 assert.ok(gunB(done).damage>0);
 assert.equal(done.sides.A.sync,25);
 assert.equal(done.sides.B.sync,25);
 assert.equal(done.lastEvents.some(e=>e.includes('Sifone Quantico')),false);
});

test('Sifone: aiutante isolato non agisce su un giocatore normale, attacco nullo o valori invalidi',()=>{
 const valid={bossExclusive:{id:7},sync:97};
 const victim={sync:25};
 const inactive={bossExclusive:null,sync:97};
 assert.deepEqual(transferExclusiveIonicSync(inactive,victim,12),
  {transferred:0,reason:'inactive'});
 assert.deepEqual(transferExclusiveIonicSync(valid,victim,0),
  {transferred:0,reason:'no_barrier_damage'});
 assert.equal(victim.sync,25);
 const siphon=transferExclusiveIonicSync(valid,victim,9);
 assert.equal(siphon.transferred,3);
 assert.equal(victim.sync,22);
 assert.equal(valid.sync,100);
 assert.equal(transferExclusiveIonicSync(valid,victim,9).transferred,0);
 const corrupted={bossExclusive:{id:7},sync:101};
 assert.equal(transferExclusiveIonicSync(corrupted,victim,9).reason,'invalid_sync');
 assert.equal(corrupted.sync,101);
 assert.equal(victim.sync,22);
});
