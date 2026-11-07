import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {newVessel} from './mathDuelEngine.js';
import {enginePoint,engineSurface} from './mathFleetGeometry.js';
import {VITAL_IDS} from './vitalDefense.js';
import {
 VITAL_TO_ORIGINAL_MOTOR,ORIGINAL_MOTOR_VITALS,
 vesselWithPhysicalVitalDamage,originalPhysicalVitalLocation
} from './officialVitalMotorAdapter.js';

const defense=(hp={})=>({parts:Object.fromEntries(VITAL_IDS.map(id=>[id,{max:10,hp:hp[id]??10}]))});

test('quattro vitali uguali alle quattro superfici motore originali (17 navi, entrambe le viste)',()=>{
 assert.deepEqual([...ORIGINAL_MOTOR_VITALS].sort(),[...VITAL_IDS].sort());
 assert.deepEqual(Object.values(VITAL_TO_ORIGINAL_MOTOR),['plus','minus','times','divide']);
 assert.equal(PHASE1_CATALOG.ships.length,17);
 for(const ship of PHASE1_CATALOG.ships)for(const side of ['enemy','player']){
  const encountered=new Set();
  for(const vital of VITAL_IDS){
   const data=originalPhysicalVitalLocation(side,ship.id,vital);
   assert.deepEqual(data.point,enginePoint(side,ship.id,VITAL_TO_ORIGINAL_MOTOR[vital]));
   assert.deepEqual(data.surface,engineSurface(side,ship.id,VITAL_TO_ORIGINAL_MOTOR[vital]));
   assert.ok(data.point.every(n=>n>0&&n<1),ship.id+' '+side+' '+vital);
   const key=data.point.join(',');
   assert.equal(encountered.has(key),false,ship.id+' '+side+' has a shared point');
   encountered.add(key);
  }
 }
});
test('proietta gli HP reali sui quattro componenti, compresi i due ausiliari non equipaggiati a L1',()=>{
 for(const ship of PHASE1_CATALOG.ships){
  const original=newVessel(ship.id,1);
  const stored=structuredClone(original);
  const expected=defense({engine:0,weapons:5,shieldGenerator:2,command:9});
  const view=vesselWithPhysicalVitalDamage(original,expected);
  assert.equal(view.id,original.id);
  assert.equal(view.engines.plus.hp,0);
  assert.equal(view.engines.minus.hp,5);
  assert.equal(view.engines.times.hp,2);
  assert.equal(view.engines.divide.hp,9);
  assert.equal(view.engines.plus.max,10);
  assert.equal(view.engines.divide.max,10);
  assert.deepEqual(original,stored,'la sorgente non viene modificata: '+ship.id);
  assert.strictEqual(view.weapons,original.weapons);
 }
});
test('la proiezione dei danni non cura né genera HP e cambia solo il motore corrispondente',()=>{
 const ship=newVessel('N00',5);
 const first=defense();
 const a=vesselWithPhysicalVitalDamage(ship,first);
 const b=vesselWithPhysicalVitalDamage(ship,defense({weapons:0}));
 for(const op of ['plus','times','divide'])assert.deepEqual(a.engines[op],b.engines[op]);
 assert.equal(b.engines.minus.hp,0);
 assert.equal(a.engines.minus.hp,10);
 assert.equal(ship.engines.minus.hp>0,true);
 assert.throws(()=>originalPhysicalVitalLocation('enemy','N00','invalid'));
});
