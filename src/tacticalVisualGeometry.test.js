import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {weaponMuzzleCount} from './mathFleetGeometry.js';
import {tacticalWeaponTrajectory} from './tacticalVisualGeometry.js';
const boxes={A:{left:10,top:60,width:35,height:36},B:{left:10,top:5,width:35,height:36}};
test('All 42 native weapons start at existing integrated hull muzzle coordinates on BOTH sides',()=>{
 let count=0;
 for(const ship of PHASE1_CATALOG.ships){
  const guns=PHASE1_CATALOG.weapons.filter(x=>x.nave_id===ship.id);
  for(const gun of guns){
   for(const by of ['A','B']){
    const ships=by==='A'?{A:ship.id,B:'N00'}:{A:'N00',B:ship.id};
    const source=boxes[by],target=boxes[by==='A'?'B':'A'];
    for(let muzzleIndex=0;muzzleIndex<weaponMuzzleCount(gun.id);muzzleIndex++){
     const t=tacticalWeaponTrajectory({by,weaponId:gun.id,muzzleIndex},ships,boxes);
     assert.ok(t?.mounted,ship.id+'/'+gun.id+'/'+by+'/'+muzzleIndex);
     assert.ok(t.start.x>=source.left&&t.start.x<=source.left+source.width);
     assert.ok(t.start.y>=source.top&&t.start.y<=source.top+source.height);
     assert.equal(t.end.x,target.left+target.width*.5);
     assert.equal(t.end.y,target.top+target.height*.5);
    }
   }
   count++;
  }
 }
 assert.equal(count,42);
});
test('No shot can be positioned from missing or corrupt geometry, without affecting combat outcome',()=>{
 assert.equal(tacticalWeaponTrajectory({by:'A',weaponId:'W01'},{A:'N00',B:'C01'},null),null);
 assert.equal(tacticalWeaponTrajectory({by:'A',weaponId:'W01'},{A:'N00',B:'C01'},{
  A:{left:0,top:0,width:0,height:0},B:boxes.B}),null);
});
test('Real muzzle mapping changes with different weapons, not one generic firing position',()=>{
 const ships={A:'C03',B:'N00'};
 const a=tacticalWeaponTrajectory({by:'A',weaponId:'W04'},ships,boxes);
 const b=tacticalWeaponTrajectory({by:'A',weaponId:'W05'},ships,boxes);
 assert.ok(a.mounted&&b.mounted);
 assert.notDeepEqual(a.start,b.start);
});


test('I proiettili delle scudiere partono dalla loro vera immagine laterale nel DOM',()=>{
 const escortBoxes={
  A:[{left:3,top:74,width:8,height:7},{left:50,top:73,width:9,height:8}],
  B:[{left:3,top:17,width:8,height:7},{left:51,top:17,width:9,height:8}]
 };
 for(const by of ['A','B'])for(const escortSlot of [0,1]){
  const shot={by,type:'escort_gun',weaponId:'W01',escortSlot};
  const computed=tacticalWeaponTrajectory(shot,{A:'R04',B:'C01'},boxes,escortBoxes);
  assert.ok(computed?.mounted);
  assert.equal(computed.source,'actual_escort_dom');
  assert.equal(computed.escortSlot,escortSlot);
  const actual=escortBoxes[by][escortSlot];
  assert.equal(computed.start.x,actual.left+actual.width*.5);
  assert.equal(computed.start.y,actual.top+actual.height*.5);
  assert.equal(computed.end.y,boxes[by==='A'?'B':'A'].top+
   boxes[by==='A'?'B':'A'].height*.5);
  // Without measured sprite, do not put a misleading projectile on the mother.
  assert.equal(tacticalWeaponTrajectory(shot,{A:'R04',B:'C01'},boxes,null),null);
 }
});
