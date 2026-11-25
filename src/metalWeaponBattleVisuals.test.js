import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3,Box3} from 'three';
import {METAL_WEAPON_VARIANTS,RECLAIMER_CARD_ID,thermalChargeForShot} from './metalWeaponBattleVisuals.js';
import {weaponEffectProfile,fleetWeaponShots,weaponResolutionMs,weaponShotStartMs,weaponVisualCards,
 maglioPresentationBerths} from './maglioBattleVisuals.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn,autoFleetTurn} from './fleetNext/combat.js';
import {cardFacePath} from './fleetNext/rules.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {createMetalProjectile,metalProjectileFlightFrame} from './metalWeaponProjectile3D.js';
import {metalWeaponSoundPlan} from './metalWeaponSounds.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
const other=who=>who==='A'?'B':'A';
for(const v of METAL_WEAPON_VARIANTS){
 test(v.id+' · fronte HD RGBA e sequenza sonora propria',()=>{
  const path=cardFacePath(v.id);assert.equal(path,'/assets/fleet-weapon-fronts/'+v.id+'.png');
  const png=readFileSync('public'+path);assert.equal(png.readUInt32BE(16),3072);
  assert.equal(png.readUInt32BE(20),4608);assert.equal(png[25],6);
  const p=weaponEffectProfile(v.id);assert.ok(p.approved);assert.equal(p.kind,v.kind);
  assert.equal(p.flightMs,v.kind==='steel-rail'?720:1250);assert.ok(p.impactMs>=850);
  for(const phase of ['charge','fire','impact']){
   const sound=metalWeaponSoundPlan(p.sound[phase]);assert.ok(sound);
   assert.equal(sound.tier,v.tier);assert.equal(sound.phase,phase);
   assert.ok(sound.layers.every(l=>l.duration>0&&l.gain>0&&l.gain<.3));
  }
 });
 for(const who of ['A','B'])for(const slot of [0,1])
 test(v.rarity+' '+v.kind+' · '+who+' · slot '+(slot+1)+' · un solo evento HP',()=>{
  let b=createMaglioReviewBattle({cardId:v.id,slot,nowMs:0});
  if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000).battle;
  const before=JSON.stringify(b),hp=b.sides[other(who)].ships[0].hp;
  const r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok,r.reason);
  const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===v.id);
  assert.equal(shots.length,1);assert.ok(shots[0].fires);
  assert.equal(shots[0].machineSlot,slot);
  assert.equal(shots[0].actualDamage,hp-r.battle.sides[other(who)].ships[0].hp);
  const shown=maglioPresentationBerths(b.sides[who],[],b.ply,shots,r.battle.sides[who]);
  assert.equal(shown[slot].sourceCardId,v.id,'La carta resta mostrata fino alla fine del colpo');
  const p=weaponEffectProfile(v.id),start=weaponShotStartMs(weaponVisualCards(shots,[]).length);
  assert.ok(weaponResolutionMs(r.events)>=start+p.flightMs+p.impactMs);
  assert.equal(JSON.stringify(b),before,'La presentazione non modifica il motore');
 });
 test(v.rarity+' '+v.kind+' · blocco e supporto effettivo',()=>{
  const b=createMaglioReviewBattle({cardId:v.id,supports:true,nowMs:0});
  const victim=b.sides.B.escorts[1];
  const r=resolvePreparedFleetTurn(b,'A',{...order,targetKind:'escort',targetId:victim.id,escortSlot:1},1000);
  const [s]=fleetWeaponShots(r.events);assert.ok(s.fires);assert.equal(s.targetId,victim.id);
  assert.equal(s.actualDamage,victim.hp-r.battle.sides.B.escorts[1].hp);
  const blocked=createMaglioReviewBattle({cardId:v.id,blocked:true,nowMs:0});
  const failed=resolvePreparedFleetTurn(blocked,'A',order,1000);
  assert.ok(fleetWeaponShots(failed.events).every(s=>!s.fires));
 });
}
test('Sei rarità: sei sequenze complete e sei timbri diversi per fase',()=>{
 const profiles=METAL_WEAPON_VARIANTS.map(v=>weaponEffectProfile(v.id));
 assert.equal(new Set(profiles.map(p=>p.sequence)).size,6);
 for(const phase of ['charge','fire','impact'])
  assert.equal(new Set(profiles.map(p=>JSON.stringify(metalWeaponSoundPlan(p.sound[phase])))).size,6);
});
for(const id of [RECLAIMER_CARD_ID,RECLAIMER_CARD_ID+'-rarity-l'])
test(id+' · due turni reali, conversione osservata e saturazione senza danni fittizi',()=>{
 const initial=createMaglioReviewBattle({cardId:id,nowMs:0});
 let r=resolvePreparedFleetTurn(initial,'A',order,1000);
 const first=fleetWeaponShots(r.events)[0];assert.deepEqual(thermalChargeForShot(first),{extra:0,ratio:0});
 const enemy=resolvePreparedFleetTurn(r.battle,'B',autoFleetTurn(r.battle,'B'),4000);
 assert.ok(enemy.battle.sides.A.weaponObservedHpLoss>0);
 r=resolvePreparedFleetTurn(enemy.battle,'A',{...order,cards:[]},7000);
 const shots=fleetWeaponShots(r.events);assert.equal(shots.length,1);
 const charged=thermalChargeForShot(shots[0]);assert.ok(charged.extra>0&&charged.ratio>0&&charged.ratio<=1);
 assert.ok(shots[0].actualDamage>first.actualDamage);
 assert.equal(thermalChargeForShot({...shots[0],nominalDamage:100000}).ratio,1);
 assert.deepEqual(thermalChargeForShot({...shots[0],nominalDamage:undefined}),{extra:0,ratio:0});
});
test('Due geometrie distinte, componenti cumulativi e facce corrette dai due bordi',()=>{
 const camera=createProjectileCamera();
 for(const v of METAL_WEAPON_VARIANTS){
  const model=createMetalProjectile(v.kind,v.tier),names=[];model.traverse(o=>names.push(o.name));
  assert.equal(names.includes('Ogiva acciaio'),v.kind==='steel-rail');
  assert.equal(names.includes('Nucleo di conversione'),v.kind==='thermal-reclaimer');
  if(v.kind==='steel-rail'){
   assert.equal(names.includes('Pinna stabilizzatrice bronzo'),v.tier>=1);
   assert.equal(names.includes('Collare di compressione argento'),v.tier>=2);
   assert.equal(names.includes('Costa prismatica'),v.tier===3);
  }
  const box=new Box3().setFromObject(model);assert.ok(box.max.z>0&&box.min.z<0);
  for(const who of ['A','B'])for(const x of [110,225,340]){
   const from={x:225,y:who==='A'?812:-12},to={x,y:who==='A'?230:570};
   for(const t of [0,.5,1]){
    const pose=metalProjectileFlightFrame(from,to,t,camera,model.userData.frontZ);
    assert.equal(pose.visibleEnd,who==='A'?'rear':'front');
    const forward=new Vector3(0,0,-1).applyAxisAngle(new Vector3(0,1,0),pose.yaw);
    const nose=pose.center.clone().addScaledVector(forward,-model.userData.frontZ);
    const projected=worldPointToBoard(nose,camera);
    if(t===1)assert.ok(Math.hypot(projected.x-to.x,projected.y-to.y)<1e-8);
   }
  }
  disposeProjectile(model);
 }
});
