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
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
function simulation(withSupports=false){
 const supports=withSupports?SUPPORT_CATALOG.slice(0,2).map((s,i)=>({
  supportId:s.id,instanceId:'confirmed-weapon-'+i,slot:i,rarita:'Leggendaria'
 })):[];
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',
  raritaA:'Leggendaria',raritaB:'Leggendaria',mode:'pvp',
  supportRosterA:[],supportRosterB:supports,ruleset:HP_SYNC_RULESET,
  deckA:[],deckB:[],seed:20411,nowMs:0});
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(25).fill('gen-216');s.discard=[];
 }
 b.sides.B.ships[0].hp=5000;b.sides.B.ships[0].maxHp=5000;
 return b;
}
function mockProfile(b,id,element,profile,turns=1){
 // HP sintetici usati esclusivamente dal test, MAI assegnati alle vere carte.
 b.sides.A.machines=[{id:'machine:test-confirmed',name:id,slot:0,
  sourceCardId:id,source:'test',hp:1,maxHp:1,power:1,
  damageMode:'designed-shot',weaponElementId:element,
  weaponProfile:profile,deployedPly:b.ply,untilPly:b.ply+2*turns,
  destroyed:false,disabledUntilPly:0,jammedUntilPly:0}];
}
function pass(b,who){
 assert.equal(b.turn,who);
 b.sides[who].hand=[];
 const r=resolveFleetNextTurn(b,who,{pass:true,cards:[]},b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
test('Motore HP: profilo Mortaio completo spara 1 base + 2 aggiuntivi indipendenti',()=>{
 const b=simulation();
 b.sides.A.energyPile=['energy-plasma','energy-plasma',
  {id:'energy-plasma-r',elementId:'plasma',remaining:2},'energy-ionic'];
 b.sides.A.elementalCharges={plasma:4,ionic:1};
 mockProfile(b,'weapon-designed-plasma-mortaio-magmatico','plasma',
  {pattern:'magma-mortar',baseDamage:9,extraDamage:4,maxExtraShots:2,ammoMode:'per-charge'},3);
 const r=pass(b,'A');
 const e=r.events.find(e=>e.kind==='weapon-designed-shot'&&
  e.cardId==='weapon-designed-plasma-mortaio-magmatico');
 assert.ok(e);assert.equal(e.hitCount,3);
 assert.deepEqual(e.impacts.map(x=>x.nominalDamage),[9,4,4]);
 assert.ok(e.actualDamage>0);
 assert.deepEqual(r.battle.sides.A.energyPile,
  [{id:'energy-plasma-r',elementId:'plasma',remaining:2},'energy-ionic']);
 assert.equal(r.battle.sides.A.elementalCharges.plasma,2);
 assert.equal(r.shot.damage>0,true);
});
test('Motore HP: Ago sintetico colpisce 2 supporti; con Terreno Ghiaccio anche la madre',()=>{
 for(const ice of [false,true]){
  const b=simulation(true);
  if(ice)b.terrain={id:'ET-CRYOGENIC-ATT-C',cardId:'ET-CRYOGENIC-ATT-C',
   owner:'A',source:'player',startedPly:0,expiresPly:null};
  mockProfile(b,'weapon-designed-cryogenic-ago-inverno-nero','cryogenic',
   {pattern:'ice-needle',supportDamage:7,terrainSupportDamage:10});
  const r=pass(b,'A');
  const e=r.events.find(e=>e.kind==='weapon-designed-shot'&&
   e.cardId==='weapon-designed-cryogenic-ago-inverno-nero');
  assert.ok(e);
  assert.deepEqual(e.impacts.map(x=>x.nominalDamage),ice?[10,10,20]:[7,7]);
  assert.equal(e.impacts.filter(x=>x.targetKind==='part').length,ice?1:0);
  assert.ok(e.actualDamage>0);
 }
});
