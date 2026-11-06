import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {ESCORT_ARMORY,ALL_SEMES,escortArmamentFor,routedAmmo} from './escortArmory.js';
import {newVessel} from './mathDuelEngine.js';
test('34 armamenti con semi validi e senza carte collezionabili aggiuntive',()=>{
 assert.equal(Object.keys(ESCORT_ARMORY).length,17);
 for(const def of PHASE1_CATALOG.ships){
  const mother=newVessel(def.id,5);
  const guns=[escortArmamentFor(mother,0),escortArmamentFor(mother,1)];
  assert.equal(guns.length,2);
  assert.notEqual(guns[0].id,guns[1].id);
  for(const gun of guns){
   assert.ok(gun.suits.length>=1&&gun.suits.length<=4);
   assert.ok(gun.suits.every(s=>ALL_SEMES.includes(s)));
   assert.ok(gun.interceptShare>=0&&gun.interceptShare<=.3);
   assert.ok(gun.damage>=1&&gun.sourceWeaponId.startsWith('W'));
  }
 }
});
test('7 picche non può essere caricato in due armi nello stesso momento',()=>{
 const mother=newVessel('L04',5);
 const escorts=[0,1].map(slot=>({slot,defense:{destroyed:false},weapon:escortArmamentFor(mother,slot)}));
 const one=routedAmmo({fleet:[mother],escorts},[{value:7,suit:'♠'}]);
 assert.equal(one.routing.length,1);
 assert.equal(Object.values(one.ammo).reduce((a,b)=>a+b,0),7);
 const focus=escorts[1].weapon.id;
 const selected=routedAmmo({fleet:[mother],escorts},[{value:7,suit:'♠'}],focus);
 assert.equal(selected.ammo[focus],7);
 assert.equal(Object.values(selected.ammo).reduce((a,b)=>a+b,0),7);
});
test('semi diversi possono caricare due armi senza duplicare munizioni',()=>{
 const mother=newVessel('C01',3);
 const escort={slot:0,defense:{destroyed:false},weapon:escortArmamentFor(mother,0)};
 const one=routedAmmo({fleet:[mother],escorts:[escort]},[{value:8,suit:'♥'},{value:3,suit:'♠'}]);
 assert.equal(Object.values(one.ammo).reduce((a,b)=>a+b,0),11);
 assert.ok(one.routing.every(r=>r.weaponId));
});
test('scudiera distrutta non riceve più munizioni',()=>{
 const mother=newVessel('L01',5);
 const escort={slot:1,defense:{destroyed:true},weapon:escortArmamentFor(mother,1)};
 const shots=routedAmmo({fleet:[mother],escorts:[escort]},[{value:7,suit:'♠'}],escort.weapon.id);
 assert.equal(shots.ammo[escort.weapon.id],undefined);
});
