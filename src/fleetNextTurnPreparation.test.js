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

test('Al timeout con bersaglio non scelto si risolvono le carte non offensive',()=>{
 const b=make(),beforeHp=b.sides.B.ships[0].hp;
 const r=timeoutFleetTurn(b,b.deadlineMs,{
  cards:[0,1,2],pass:false,awaitingTargetSelection:true,
  targetKind:'escort',targetId:'non-confermato'
 });
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.playedPreparedCards,3);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,2);
 assert.ok(r.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
 assert.equal(r.battle.sides.B.ships[0].hp,beforeHp);
});
test('Al timeout con una terza carta non valida le due valide non vengono perse',()=>{
 const b=make();
 const r=timeoutFleetTurn(b,b.deadlineMs,{cards:[0,1,99],pass:true});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.playedPreparedCards,2);
 assert.equal(r.droppedPreparedCards,1);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,1);
 assert.ok(r.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
});
test('Al timeout un sacrificio non idoneo non elimina le carte valide',()=>{
 const b=make();
 const r=timeoutFleetTurn(b,b.deadlineMs,{cards:[0,1],pass:true,
  sacrificeEscortId:'inesistente'});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.playedPreparedCards,2);
 assert.equal(r.skippedSacrifice,true);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,1);
});

test('Se il bersaglio non viene scelto il Tiro d’assedio si esclude, ma Energia e Sistema rimangono',()=>{
 const b=make();
 b.sides.A.hand=['energy-metallic','sys-weapons-plus-c','nx-r01-02'];
 const r=timeoutFleetTurn(b,b.deadlineMs,{
  cards:[0,1,2],pass:false,awaitingTargetSelection:true,
  targetKind:'escort',targetId:'non-confermato'
 });
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.playedPreparedCards,2);
 assert.equal(r.droppedPreparedCards,1);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,1);
 assert.ok(r.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
});
