import test from 'node:test';
import assert from 'node:assert/strict';
import {card} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {applySystemCard,commandPassiveSuspensions} from './fleetNext/newCardEffects.js';

const battle=()=>createFleetNextBattle({
 shipA:'L01',levelA:5,shipB:'L01',levelB:5,seed:2121,mode:'pvp',
 deckA:[],deckB:[],ruleset:HP_SYNC_RULESET
});
test('Centralina Epica/Leggendaria sospendono una/due passive nel primo turno nemico',()=>{
 const b=battle();
 applySystemCard(b.sides.B,card('sys-command-minus-e'),0,'A');
 assert.equal(commandPassiveSuspensions(b.sides.B,1),1);
 assert.equal(commandPassiveSuspensions(b.sides.B,3),0);
 applySystemCard(b.sides.B,card('sys-command-minus-l'),0,'A');
 assert.equal(commandPassiveSuspensions(b.sides.B,1),2);
 applySystemCard(b.sides.B,card('sys-command-plus-l'),1,'B');
 assert.equal(commandPassiveSuspensions(b.sides.B,1),1,'una sospensione neutralizzata');
});
test('In battaglia il sabotaggio Centralina sopprime davvero i bonus dei supporti',()=>{
 let b=battle();
 applySystemCard(b.sides.B,card('sys-command-minus-l'),0,'A');
 const first=resolveFleetNextTurn(b,'A',{pass:true,cards:[]},1000);
 assert.equal(first.ok,true,first.reason);
 b=first.battle;
 const second=resolveFleetNextTurn(b,'B',{pass:true,cards:[]},31000);
 assert.equal(second.ok,true,second.reason);
 assert.ok(second.events.filter(e=>e.kind==='escort'&&/sospesa/.test(e.text)).length>=1);
});
