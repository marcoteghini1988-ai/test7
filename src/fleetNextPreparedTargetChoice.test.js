import test from 'node:test';
import assert from 'node:assert/strict';
import {choosableSupportTargets,shouldChooseSupportTarget}
 from './fleetNext/preparedTargetChoice.js';
const guards=[
 {kind:'escort',id:'first',name:'Primo supporto',slot:0,hp:22},
 {kind:'escort',id:'second',name:'Secondo supporto',slot:1,hp:35}
];
test('Il giocatore sceglie se i due supporti proteggono la madre',()=>{
 assert.equal(shouldChooseSupportTarget(guards),true);
 assert.deepEqual(choosableSupportTargets([...guards].reverse()).map(t=>t.id),['first','second']);
});
test('Con un solo supporto il bersaglio si determina automaticamente',()=>{
 assert.equal(shouldChooseSupportTarget(guards.slice(0,1)),false);
 assert.equal(shouldChooseSupportTarget([]),false);
 assert.equal(shouldChooseSupportTarget([{...guards[0],hp:0},guards[1]]),false);
});
test('Aggiramento e turno senza sparo escludono la scelta del supporto',()=>{
 assert.equal(shouldChooseSupportTarget(guards,{bypass:true}),false);
 assert.equal(shouldChooseSupportTarget(guards,{skipShot:true}),false);
});
