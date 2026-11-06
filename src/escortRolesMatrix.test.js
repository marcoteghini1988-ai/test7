import test from 'node:test';
import assert from 'node:assert/strict';
import {ESCORT_ARMORY,escortArmamentFor} from './escortArmory.js';
import {ESCORT_DOCTRINES,ESCORT_ROLE_HELP,tacticalEscortDamage,defensiveEscortShare} from './escortTactics.js';
import {initialBattle} from './mathDuelEngine.js';
const defensive=new Set(['Guardia','Intercettore','Baluardo']);
const offensive=new Set(['Assalto','Incursore','Assedio','Artiglieria']);
test('punto24: all 17 mother families have a defensive escort #1 and offensive escort #2',()=>{
 assert.equal(Object.keys(ESCORT_ARMORY).length,17);
 for(const [id,slots] of Object.entries(ESCORT_ARMORY)){
  assert.equal(slots.length,2,id);
  assert.ok(defensive.has(slots[0].role),id+' escort 1');
  assert.ok(offensive.has(slots[1].role),id+' escort 2');
  assert.ok(ESCORT_DOCTRINES[id],id);
 }
});
test('punto24: seven unique roles have usable in-game descriptions',()=>{
 assert.equal(defensive.size+offensive.size,7);
 for(const role of [...defensive,...offensive])
  assert.equal(typeof ESCORT_ROLE_HELP[role],'string',role);
});
test('punto24: a role stays attached to its escort and never adds separate mother cards',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:5,fleetIds:['E04']},()=>.5);
 assert.equal(b.player.fleet.length,1);
 assert.equal(b.player.escorts.length,2);
 const mother=b.player.fleet[0];
 assert.equal(b.player.escorts[0].weapon.role,escortArmamentFor(mother,0).role);
 assert.equal(b.player.escorts[1].weapon.role,escortArmamentFor(mother,1).role);
});
test('punto24: defensive and offensive role effects remain target-dependent',()=>{
 assert.ok(tacticalEscortDamage('Assalto',100,{targetKind:'escortShield'}).damage>100);
 assert.equal(tacticalEscortDamage('Assalto',100,{targetKind:'motherVital'}).damage,100);
 assert.ok(tacticalEscortDamage('Incursore',100,{targetKind:'motherVital'}).damage>100);
 assert.equal(tacticalEscortDamage('Incursore',100,{targetKind:'motherShield'}).damage,100);
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:5,fleetIds:['E04']},()=>.5);
 const e=b.player.escorts[0],d=b.player.fleet[0].defense;
 const low={...d,shield:{...d.shield,hp:0}};
 assert.ok(defensiveEscortShare(e,low)>=defensiveEscortShare(e,d));
});
