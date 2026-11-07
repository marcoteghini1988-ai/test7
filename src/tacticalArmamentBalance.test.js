import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createTacticalDuel,nativeBarrierPacket} from './simultaneousDuelEngine.js';
import {tacticalArmamentProfile,tacticalBarrierPower,tacticalWeaponTechnology} from './tacticalArmamentBalance.js';
import {weaponEffect} from './mathWeaponEffects.js';

test('Tutte le 42 armi native hanno un contributo fisico e un profilo visivo, non un proiettile globale',()=>{
 assert.equal(PHASE1_CATALOG.weapons.length,42);
 const tech=new Set(),seen=new Set();
 for(const ship of PHASE1_CATALOG.ships){
  const b=createTacticalDuel({shipA:ship.id,levelA:1});
  const profile=tacticalArmamentProfile(b.sides.A.weapons);
  assert.equal(profile.contributions.length,b.sides.A.weapons.length);
  assert.equal(profile.raw,profile.contributions.reduce((sum,w)=>sum+w.raw,0));
  assert.ok(profile.raw>0&&profile.scaled>0,ship.id);
  for(const w of profile.contributions){
   tech.add(w.technology);seen.add(w.weaponId);
   assert.ok(w.raw>0&&w.weight>=3);
   assert.equal(w.visual,weaponEffect(w.weaponId).profile);
   assert.ok(['laser','plasma','ionico','cinetico','esplosivo'].includes(w.technology));
   assert.equal(w.technology,tacticalWeaponTechnology(b.sides.A.weapons.find(x=>x.id===w.weaponId)));
  }
 }
 assert.equal(seen.size,42);
 assert.equal(tech.size,5,'I cinque tipi tecnologici sono rappresentati nei modelli nativi');
});
test('Ogni modello progredisce L1->L5 e nessuna nave azzera da sola lo scudo da 60 al primo ciclo',()=>{
 const result=new Map();
 for(const ship of PHASE1_CATALOG.ships){
  const powers=[];
  for(let level=1;level<=5;level++){
   const b=createTacticalDuel({shipA:ship.id,levelA:level});
   const side=b.sides.A,power=nativeBarrierPacket(side);
   powers.push(power);
   assert.equal(power,tacticalBarrierPower(side).amount);
   assert.ok(power>0&&power<60,ship.id+' L'+level+' => '+power);
   assert.ok(power<=45,'Cap soft: '+ship.id+' L'+level);
  }
  for(let level=1;level<5;level++)assert.ok(powers[level]>powers[level-1],ship.id+': '+powers);
  result.set(ship.id,powers[0]);
 }
 assert.ok(result.get('L04')>result.get('E04'));
 assert.ok(result.get('E04')>result.get('R04'));
 assert.ok(result.get('R04')>result.get('N00'));
});
test('I sistemi vitali armi e motore influenzano davvero la potenza senza alterare le carte in mano',()=>{
 const b=createTacticalDuel({shipA:'L04',levelA:5});
 const base=nativeBarrierPacket(b.sides.A);
 b.sides.A.defense.parts.weapons.hp=0;
 const noWeapons=nativeBarrierPacket(b.sides.A);
 assert.ok(noWeapons<base);
 b.sides.A.defense.parts.engine.hp=0;
 const noEngine=nativeBarrierPacket(b.sides.A);
 assert.ok(noEngine<noWeapons);
 assert.equal(b.sides.A.weapons.length,4,'Le armi rimangono native ma danneggiate');
 assert.equal(b.sides.A.numeric.hand.length,7);
});
