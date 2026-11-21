import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolvePreparedFleetTurn}
 from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {fleetResolutionFxMs,releaseFleetTurnAfterEffects}
 from './fleetNext/turnPresentation.js';
import {FLEET_TURN_SECONDS} from './fleetNext/rules.js';

function preparedBattle(){
 const b=createFleetNextBattle({shipA:'R01',shipB:'C01',levelA:5,levelB:5,
  deckA:[],deckB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,seed:725,nowMs:0});
 b.sides.A.hand=['energy-metallic','sys-weapons-plus-c','energy-metallic'];
 return b;
}

test('PASSA senza carte cambia turno immediatamente, senza attendere 30 secondi',()=>{
 const b=preparedBattle();
 const result=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.turn,'B');
 assert.equal(b.turn,'A');
});

test('PASSA con due carte risolve entrambe, anche prima della scadenza',()=>{
 const b=preparedBattle(),p=b.sides.B.ships[0].parts.find(x=>!x.destroyed);
 const result=resolvePreparedFleetTurn(b,'A',{
  cards:[0,1],pass:false,targetKind:'part',targetId:p.id,partId:p.id
 },1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.turn,'B');
 assert.equal(result.battle.sides.A.elementalCharges.metallic,1);
 assert.ok(result.battle.sides.A.systemCardEffects.some(x=>x.id==='sys-weapons-plus-c'));
});

test('La terza carta risolve tutte e tre le carte senza timer aggiuntivi',()=>{
 const b=preparedBattle(),p=b.sides.B.ships[0].parts.find(x=>!x.destroyed);
 const result=resolvePreparedFleetTurn(b,'A',{
  cards:[0,1,2],pass:false,targetKind:'part',targetId:p.id,partId:p.id
 },1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.turn,'B');
 assert.equal(result.battle.sides.A.elementalCharges.metallic,2);
});

test('Ordine preparato parzialmente invalido non blocca PASSA o la terza carta',()=>{
 const b=preparedBattle();
 const result=resolvePreparedFleetTurn(b,'A',{cards:[0,1,99],pass:true},1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.turn,'B');
 assert.equal(result.playedPreparedCards,2);
 assert.equal(result.droppedPreparedCards,1);
 assert.equal(result.battle.sides.A.elementalCharges.metallic,1);
});

test('Gli effetti visivi terminano prima del nuovo timer',()=>{
 assert.equal(fleetResolutionFxMs([]),650);
 assert.equal(fleetResolutionFxMs([{kind:'impact'}]),1600);
 assert.equal(fleetResolutionFxMs([{kind:'impact'},{kind:'trap-reveal'}]),4200);
 const b=preparedBattle();
 b.turn='B';b.turnStartedAtMs=1000;b.deadlineMs=31000;b.supportSecondsProcessed=3;
 const released=releaseFleetTurnAfterEffects(b,6000);
 assert.equal(released.deadlineMs,6000+FLEET_TURN_SECONDS*1000);
 assert.equal(released.turnStartedAtMs,6000);
 assert.equal(released.supportSecondsProcessed,0);
 assert.equal(b.deadlineMs,31000);
 b.phase='finished';
 assert.equal(releaseFleetTurnAfterEffects(b,8000),b);
});
