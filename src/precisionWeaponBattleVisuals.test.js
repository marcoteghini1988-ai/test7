import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {PRECISION_WEAPON_VARIANTS,CASCADE_ID,SHARD_ARTILLERY_ID,CASCADE_CONTACT_MS} from './precisionWeaponBattleVisuals.js';
import {INDUCTION_ID} from './chainWeaponBattleVisuals.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {fleetWeaponShots,weaponEffectProfile,weaponResolutionMs,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {cardFacePath} from './fleetNext/rules.js';
import {metalWeaponSoundPlan} from './metalWeaponSounds.js';
import {weaponHapticPattern} from './weaponHaptics.js';
import {salvoSpan} from './fleetNext/approvedWeaponSalvos.js';
import {createPrecisionProjectile} from './precisionWeaponProjectile3D.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {metalProjectileFlightFrame} from './metalWeaponProjectile3D.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
const pass={cards:[],pass:true};
const other=who=>who==='A'?'B':'A';
for(const v of PRECISION_WEAPON_VARIANTS){
 test(v.id+' · fronte esatto approvato e sequenza audiovisiva completa',()=>{
  const art=cardFacePath(v.id),png=readFileSync('public'+art);
  assert.equal(art,'/assets/fleet-weapon-fronts/'+v.id+'.png');
  assert.equal(png.readUInt32BE(16),3072);assert.equal(png.readUInt32BE(20),4608);assert.equal(png[25],6);
  const p=weaponEffectProfile(v.id);assert.equal(p.kind,v.kind);assert.ok(p.approved);
  for(const phase of ['charge','fire','impact']){
   const sound=metalWeaponSoundPlan(p.sound[phase]);assert.ok(sound?.layers.length);
   assert.equal(sound.tier,v.tier);assert.equal(sound.phase,phase);
   assert.ok(weaponHapticPattern(v.kind,phase,v.tier).length);
  }
 });
 for(const who of ['A','B'])for(const slot of [0,1])
 test(v.id+' · '+who+' slot '+(slot+1)+' · stessi ID e HP del resolver',()=>{
  let b=createMaglioReviewBattle({cardId:v.id,slot,supports:true,nowMs:0});
  if(who==='B')b=resolvePreparedFleetTurn(b,'A',pass,1000).battle;
  const before=JSON.stringify(b),r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok,r.reason);
  const event=r.events.find(e=>e.cardId===v.id&&e.kind==='weapon-provisional-shot');assert.ok(event);
  const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===v.id);assert.equal(shots.length,1);
  assert.deepEqual(shots.map(s=>s.targetId),event.impacts.map(h=>h.targetId));
  assert.equal(shots[0].machineSlot,slot);assert.ok(shots[0].fires);
  const id=shots[0].targetId,old=b.sides[other(who)].escorts.find(e=>e.id===id),next=r.battle.sides[other(who)].escorts.find(e=>e.id===id);
  assert.equal(old.hp-next.hp,shots[0].actualDamage);
  assert.equal(JSON.stringify(b),before,'La presentazione non scrive nel motore');
  const start=weaponShotStartMs(weaponVisualCards(shots,[]).length),p=weaponEffectProfile(v.id);
  assert.ok(weaponResolutionMs(r.events)>=start+p.flightMs+p.impactMs);
 });
 test(v.id+' · blocco senza sparo, trasferimento o consumo',()=>{
  const b=createMaglioReviewBattle({cardId:v.id,supports:true,blocked:true,energyCards:2,cascadeMode:'two',nowMs:0});
  const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok);
  assert.ok(fleetWeaponShots(r.events).filter(s=>s.cardId===v.id).every(s=>!s.fires));
  assert.equal(r.events.filter(e=>e.kind==='weapon-cascade').length,0);
  assert.equal(r.battle.sides.A.elementalCharges.metallic,2);
 });
}
for(const id of [CASCADE_ID,CASCADE_ID+'-rarity-l'])for(const who of ['A','B'])for(const energyCards of [0,1,2])
test(id+' · '+who+' · '+energyCards+' Energie: continuità, pagamenti e tempi reali',()=>{
 let b=createMaglioReviewBattle({cardId:id,supports:true,energyCards,cascadeMode:'two',nowMs:0});
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',pass,1000).battle;
 const r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok);
 const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===id);
 assert.equal(shots.length,1+energyCards);assert.ok(shots.every(s=>s.fires));
 const payments=r.events.filter(e=>e.cardId===id&&e.kind==='weapon-cascade');
 assert.equal(payments.length,energyCards);
 assert.equal(r.battle.sides[who].energyPile.length,0);
 assert.equal(r.battle.sides[who].elementalCharges.metallic||0,0);
 assert.equal(shots.reduce((n,s)=>n+(s.transferEnergySpent||0),0),energyCards);
 for(let i=1;i<shots.length;i++){
  const prior=shots[i-1],s=shots[i],priorProfile=weaponEffectProfile(id,prior),p=weaponEffectProfile(id,s);
  assert.equal(s.sourceTargetId,prior.targetId);assert.equal(s.sourceTargetKind,prior.targetKind);
  assert.ok(s.cascadeTransfer);assert.equal(s.transferEnergySpent,payments[i-1].energySpent);
  assert.equal(s.delayMs,prior.delayMs+priorProfile.flightMs+salvoSpan(id)+CASCADE_CONTACT_MS);
  assert.ok(p.flightMs<priorProfile.flightMs||i>1);
  assert.equal(prior.targetKind,'escort');
  assert.ok(r.battle.sides[other(who)].escorts.find(e=>e.id===prior.targetId).hp<=0);
 }
 const last=shots.at(-1),p=weaponEffectProfile(id,last),start=weaponShotStartMs(weaponVisualCards(shots,[]).length);
 assert.ok(weaponResolutionMs(r.events)>=start+last.delayMs+p.flightMs+p.impactMs);
});
for(const id of [CASCADE_ID,CASCADE_ID+'-rarity-l'])
test(id+' · nessuna eccedenza: Energia intatta e un solo bersaglio',()=>{
 const b=createMaglioReviewBattle({cardId:id,supports:true,energyCards:2,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,1000);const shots=fleetWeaponShots(r.events);
 assert.equal(shots.length,1);assert.equal(shots[0].cascadeTransfer,false);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,2);assert.equal(r.battle.sides.A.energyPile.length,2);
 assert.equal(r.events.filter(e=>e.kind==='weapon-cascade').length,0);
});
for(const id of [SHARD_ARTILLERY_ID,SHARD_ARTILLERY_ID+'-rarity-e',SHARD_ARTILLERY_ID+'-rarity-l'])
test(id+' · due veri turni propri: un colpo e cambio soltanto quando risolto',()=>{
 const b=createMaglioReviewBattle({cardId:id,supports:true,ownStage:2,nowMs:0});
 const previous=b.sides.A.machines.find(m=>m.sourceCardId===id).previousTargetId;
 const r=resolvePreparedFleetTurn(b,'A',{...order,cards:[]},1000);
 const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===id);
 assert.equal(shots.length,1);assert.ok(shots[0].fires);assert.equal(shots[0].stage,2);
 assert.notEqual(shots[0].targetId,previous);
 const noSupports=createMaglioReviewBattle({cardId:id,ownStage:2,nowMs:0});
 const next=resolvePreparedFleetTurn(noSupports,'A',{...order,cards:[]},1000);
 const single=fleetWeaponShots(next.events).filter(s=>s.cardId===id);
 assert.equal(single.length,1);assert.equal(single[0].targetKind,'part');assert.ok(single[0].fires);
});
for(const id of [CASCADE_ID,CASCADE_ID+'-rarity-l'])for(const stage of [2,3])
test(id+' · attivazione reale al turno proprio '+stage,()=>{
 const b=createMaglioReviewBattle({cardId:id,supports:true,ownStage:stage,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',{...order,cards:[]},1000);
 const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===id);
 assert.equal(shots.length,1);assert.equal(shots[0].stage,stage);assert.ok(shots[0].fires);
});
test('Volumi cumulativi e naso sullo scafo, anche nei trasferimenti laterali',()=>{
 const camera=createProjectileCamera(),counts={};
 for(const v of PRECISION_WEAPON_VARIANTS){
  const model=createPrecisionProjectile(v.kind,v.tier),names=[];model.traverse(o=>{if(o.isMesh)names.push(o.name);});
  if(counts[v.kind])assert.ok(names.length>counts[v.kind]);counts[v.kind]=names.length;
  if(v.tier===3)assert.ok(names.some(n=>n.includes('prismatic')));
  for(const [from,to,end] of [[{x:225,y:812},{x:120,y:230},'rear'],[{x:225,y:-12},{x:335,y:570},'front'],[{x:120,y:230},{x:330,y:230},null]]){
   const pose=metalProjectileFlightFrame(from,to,1,camera,model.userData.frontZ);
   if(end)assert.equal(pose.visibleEnd,end);
   const front=new Vector3(0,0,model.userData.frontZ).applyAxisAngle(new Vector3(0,1,0),pose.yaw).add(pose.center);
   const p=worldPointToBoard(front,camera);assert.ok(Math.hypot(p.x-to.x,p.y-to.y)<1e-8);
  }
  disposeProjectile(model);
 }
});
test('Le sei varianti approvate hanno sequenze e timbri distinti',()=>{
 const ids=[INDUCTION_ID+'-rarity-l',...PRECISION_WEAPON_VARIANTS.map(v=>v.id)];
 const profiles=ids.map(id=>weaponEffectProfile(id));assert.equal(new Set(profiles.map(p=>p.sequence)).size,6);
 for(const phase of ['charge','fire','impact'])assert.equal(new Set(profiles.map(p=>JSON.stringify(metalWeaponSoundPlan(p.sound[phase])))).size,6);
 const transfer=weaponEffectProfile(CASCADE_ID,{cascadeTransfer:true});
 assert.ok(metalWeaponSoundPlan(transfer.sound.transfer));assert.ok(weaponHapticPattern('cascade-piercer','transfer',2).length);
});
