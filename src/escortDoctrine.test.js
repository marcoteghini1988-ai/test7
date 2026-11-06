import test from 'node:test';
import assert from 'node:assert/strict';
import {ESCORT_DOCTRINES,tacticalEscortDamage,defensiveEscortShare} from './escortTactics.js';
import {ESCORT_ARMORY} from './escortArmory.js';
import {initialBattle,previewVolley,dealHit} from './mathDuelEngine.js';

const battle=id=>initialBattle(1,{vitalPrototype:true,fleetIds:[id],shipLevel:5},()=>.5);
const escort=(game,slot)=>game.player.escorts[slot];
const card=(value,suit)=>({value,suit,id:suit+value});

test('17 mother families have 17 distinct doctrines',()=>{
 assert.equal(Object.keys(ESCORT_DOCTRINES).length,17);
 assert.equal(new Set(Object.values(ESCORT_DOCTRINES).map(x=>x.name)).size,17);
 for(const id of Object.keys(ESCORT_ARMORY))assert.ok(ESCORT_DOCTRINES[id],id);
});
test('family target bonus adds to the existing role, but only on preferred target',()=>{
 const b=battle('C01'),e=escort(b,1),d=b.player.fleet[0].defense;
 const target={targetKind:'motherShield'};
 const base=tacticalEscortDamage(e.weapon.role,100,target);
 const boosted=tacticalEscortDamage(e.weapon.role,100,target,e,d);
 assert.equal(boosted.damage-base.damage,6);
 assert.equal(boosted.doctrine,'Fuoco Solare');
 assert.equal(tacticalEscortDamage(e.weapon.role,100,{targetKind:'motherVital'},e,d).doctrine,null);
});
test('destroyed command center disables family bonus without erasing role ability',()=>{
 const b=battle('C01'),e=escort(b,1),d=b.player.fleet[0].defense;
 const down={...d,parts:{...d.parts,command:{...d.parts.command,hp:0}}};
 const target={targetKind:'motherShield'};
 assert.equal(tacticalEscortDamage(e.weapon.role,100,target,e,down).doctrine,null);
 assert.equal(tacticalEscortDamage(e.weapon.role,100,target,e,down).damage,
  tacticalEscortDamage(e.weapon.role,100,target).damage);
});
test('family defense bonus activates under 50 percent mother shield',()=>{
 const b=battle('C01'),e=escort(b,0),d=b.player.fleet[0].defense;
 const low={...d,shield:{...d.shield,hp:Math.floor(d.shield.max*.4)}};
 assert.ok(defensiveEscortShare(e,low)>defensiveEscortShare(e,d));
 assert.ok(defensiveEscortShare(e,low)<=.45);
});
test('family bonus never modifies an escort finisher without damage',()=>{
 const b=battle('C01'),e=escort(b,1),d=b.player.fleet[0].defense;
 assert.equal(tacticalEscortDamage(e.weapon.role,100,{targetKind:'escortFinisher'},e,d).doctrine,null);
 assert.equal(tacticalEscortDamage(e.weapon.role,0,{targetKind:'motherShield'},e,d).damage,0);
});
test('live weapon preview and fired damage include the same family doctrine',()=>{
 const b=battle('C01'),gun=escort(b,1).weapon,cards=[card(10,'♦')];
 const context={targetKind:'motherShield'};
 const expected=previewVolley(b.player,cards,gun.id,context);
 const actual=dealHit(b.enemy,b.player,'plus',b.targets.plus,cards,0,{},gun.id);
 assert.equal(actual.rawDamage,expected.totalDamage);
 assert.ok(expected.shots.some(x=>x.tacticalDoctrine==='Fuoco Solare'));
 assert.equal(expected.routing.reduce((sum,x)=>sum+x.value,0),10);
});
test('different families gain different bonuses on otherwise equivalent target',()=>{
 const a=battle('C01'),b=battle('R01'),cards=[card(10,'♦')];
 const da=ESCORT_DOCTRINES.C01,db=ESCORT_DOCTRINES.R01;
 assert.notEqual(da.attack,db.attack);
 assert.ok(a.player.escorts.length===2&&b.player.escorts.length===2);
});
