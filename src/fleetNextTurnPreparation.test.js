// Verifica della preparazione: nessun effetto prima del commit del turno.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolveFleetNextTurn,timeoutFleetTurn,validateFleetTurn}
 from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

function make(){
 const b=createFleetNextBattle({shipA:'R01',shipB:'C01',levelA:5,levelB:5,
  deckA:[],deckB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,seed:725,nowMs:0});
 b.sides.A.hand=['energy-metallic','sys-weapons-plus-c','energy-metallic'];
 return b;
}

test('Selezionare carte non modifica HP, Energie o Sistemi prima di risolvere',()=>{
 const b=make(),before=structuredClone(b);
 assert.equal(validateFleetTurn(b,'A',{cards:[0,1],pass:true}),null);
 assert.deepEqual(b,before);
 assert.equal(b.sides.A.elementalCharges.metallic,undefined);
});

test('PASSA con due carte risolve entrambe le giocate prima del turno B',()=>{
 const b=make();
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:true},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.battle.sides.A.elementalCharges.metallic,1);
 assert.ok(r.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
 assert.equal(b.sides.A.elementalCharges.metallic,undefined);
});

test('Alla terza carta il motore applica le tre giocate insieme',()=>{
 const b=make();
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1,2],pass:true},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.battle.sides.A.elementalCharges.metallic,2);
 assert.ok(r.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
});

test('Il timeout conserva le due carte preparate e apre il turno B',()=>{
 const b=make();
 const r=timeoutFleetTurn(b,b.deadlineMs,{cards:[0,1],pass:true});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.battle.sides.A.elementalCharges.metallic,1);
 assert.ok(r.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
});

test('Il timeout con un ordine invalido chiude comunque il turno senza applicarlo',()=>{
 const b=make();
 const r=timeoutFleetTurn(b,b.deadlineMs,{cards:[99],pass:true});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.ok(r.invalidPrepared);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,undefined);
});
