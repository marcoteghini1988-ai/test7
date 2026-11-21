import test from 'node:test';
import assert from 'node:assert/strict';
import {PENDING_ADVANCED_WEAPON_RULES,PENDING_ADVANCED_WEAPON_COUNT,pendingWeaponReason,card} from './fleetNext/rules.js';
import {weaponFiresOnOwnTurn,planIceNeedle,mortarAmmunition,consumeMortarEnergy,planMagmaMortar} from './fleetNext/confirmedAdvancedWeaponMechanics.js';
import {canSelectNewGeneric,buyNextCommonCard} from './fleetNext/nextDeckLoadout.js';
import {createFleetInventory} from './fleetNext/collection.js';
test('21 regole confermate conservate ma senza numeri inventati',()=>{
 assert.equal(PENDING_ADVANCED_WEAPON_COUNT,21);
 for(const r of Object.values(PENDING_ADVANCED_WEAPON_RULES)){
  const c=card(r.id);assert.ok(c,r.id);assert.equal(c.playable,false,r.id);
  assert.equal(c.designOnly,true);assert.equal(c.confirmedMechanic,r);
  assert.equal(canSelectNewGeneric(r.id),false);
  assert.equal(buyNextCommonCard(createFleetInventory(),r.id).ok,false);
  assert.match(pendingWeaponReason(r.id),/Parametro non ancora deciso/);
 }
});
test('Mortaio: massimo tre colpi propri, fuoco fisico consumato solo con profilo completo',()=>{
 assert.deepEqual([0,2,4,6].map(p=>weaponFiresOnOwnTurn(0,p,3)),[true,true,true,false]);
 const side={energyPile:['energy-plasma',{id:'energy-plasma-r',elementId:'plasma',remaining:2},
  'energy-ionic'],elementalCharges:{plasma:3,ionic:1},discard:[]};
 assert.throws(()=>planMagmaMortar(side,{baseDamage:9}),/approvare/);
 const p={baseDamage:9,extraDamage:4,maxExtraShots:2,ammoMode:'per-charge'};
 assert.deepEqual(planMagmaMortar(side,p).map(x=>x.base),[9,4,4]);
 assert.equal(mortarAmmunition(side,'per-charge'),3);
 assert.equal(mortarAmmunition(side,'per-card'),2);
 assert.deepEqual(consumeMortarEnergy(side,'per-charge'),{id:'energy-plasma',used:1,discarded:true});
 assert.deepEqual(consumeMortarEnergy(side,'per-charge'),{id:'energy-plasma-r',used:1,discarded:false});
 assert.equal(side.energyPile[0].remaining,1);
 assert.deepEqual(consumeMortarEnergy(side,'per-card'),{id:'energy-plasma-r',used:1,discarded:true});
 assert.deepEqual(side.energyPile,['energy-ionic']);
 assert.equal(side.elementalCharges.plasma,undefined);
 assert.deepEqual(side.discard,['energy-plasma','energy-plasma-r']);
});
test('Ago: con terreno ghiaccio 2 supporti e madre perforata con somma dei colpi',()=>{
 const supports=[{id:'s1',hp:90},{id:'s2',hp:80}],mom={id:'weapons',hp:400};
 assert.throws(()=>planIceNeedle(supports,mom,true,0,0),/non ancora determinati/);
 assert.deepEqual(planIceNeedle(supports,mom,false,7,10).map(x=>x.base),[7,7]);
 const plan=planIceNeedle(supports,mom,true,7,10);
 assert.deepEqual(plan.map(x=>x.base),[10,10,20]);
 assert.deepEqual(plan.map(x=>x.target.kind),['escort','escort','part']);
 assert.equal(plan[2].ignoreOrdinaryDefenses,true);
});
