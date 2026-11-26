import test from 'node:test';
import assert from 'node:assert/strict';
import {Euler,Quaternion,Vector3} from 'three';
import {APPROVED_WEAPON_SALVOS,allocateSalvoDamage,approvedWeaponSalvo,salvoSpan} from './fleetNext/approvedWeaponSalvos.js';
import {ALL_WEAPON_BY_ID,WEAPON_NEAR_FINAL_BY_ID,weaponAtRarity} from './fleetNext/weaponRarityEvolutions.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {fleetWeaponShots,fleetWeaponProjectiles,weaponEffectProfile,weaponResolutionMs,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {weaponLaunchOrigin,weaponContactPoint,weaponFlightFrame} from './weaponKinematics.js';
import {createProjectileCamera,worldPointToBoard} from './maglioProjectile3D.js';
import {collisionGroups,activeGrappleLinks} from './chainWeaponBattleVisuals.js';
import {requestWeaponHaptic} from './weaponHaptics.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'},pass={cards:[],pass:true};
const isChain=p=>/ganasce|collassatore/.test(p.cardId),isCascade=p=>p.cardId.includes('perforatore-cascata');
const other=who=>who==='A'?'B':'A';
test('37 explicit salvo designs, with total damage and one defense check per activation',()=>{
 assert.equal(APPROVED_WEAPON_SALVOS.length,37);
 for(const p of APPROVED_WEAPON_SALVOS){
  const c=ALL_WEAPON_BY_ID[p.cardId],print=WEAPON_NEAR_FINAL_BY_ID[p.cardId];
  assert.ok(c&&print);assert.equal(c.effectSpec.salvoCount,p.count);assert.equal(print.effectSpec.salvoCount,p.count);
  assert.equal(weaponAtRarity(p.familyId,c.rarita).effectSpec.salvoCount,p.count);
  if(p.count>1){assert.ok(print.effectProposed.includes(String(p.count))||p.style==='six-plus-lance');assert.ok(print.effectProposed.includes('HP totali'));}
  for(const total of [0,1,2,5,14,18,31,46,65,109,154,999]){
   const parts=allocateSalvoDamage(total,p);assert.equal(parts.reduce((n,x)=>n+x,0),total);
   assert.ok(parts.every(x=>Number.isInteger(x)&&x>=0));
  }
 }
 assert.deepEqual(APPROVED_WEAPON_SALVOS.slice(0,4).map(p=>p.count),[2,3,5,7]);
 assert.deepEqual(APPROVED_WEAPON_SALVOS.slice(4,8).map(p=>p.count),[1,1,1,1]);
});
for(const p of APPROVED_WEAPON_SALVOS)for(const who of ['A','B'])for(const slot of [0,1])
 test(`${p.cardId} · ${who} slot ${slot+1} · engine-issued projectiles preserve exact HP and targets`,()=>{
  let b=createMaglioReviewBattle({cardId:p.cardId,slot,supports:isChain(p)||isCascade(p),nowMs:0});
  if(who==='B')b=resolvePreparedFleetTurn(b,'A',pass,1000).battle;
  const before=JSON.stringify(b),r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok,r.reason);assert.equal(JSON.stringify(b),before);
  const activations=fleetWeaponShots(r.events).filter(s=>s.cardId===p.cardId),projectiles=fleetWeaponProjectiles(r.events).filter(s=>s.cardId===p.cardId);
  assert.ok(activations.some(s=>s.fires));assert.equal(projectiles.length,activations.length*Math.max(1,p.count));
  assert.equal(projectiles.reduce((n,s)=>n+s.actualDamage,0),activations.reduce((n,s)=>n+s.actualDamage,0));
  assert.deepEqual(new Set(projectiles.map(s=>s.targetKind+':'+s.targetId)),new Set(activations.map(s=>s.targetKind+':'+s.targetId)));
  assert.ok(projectiles.every(s=>s.machineSlot===slot));
  if(p.count===0){assert.equal(collisionGroups(projectiles).length,1);return;}
  assert.ok(projectiles.every(s=>s.salvoCount===p.count));
  for(const activation of activations){
   assert.equal(activation.projectileHits.length,p.count);
   assert.equal(activation.projectileHits.reduce((n,s)=>n+s.actualDamage,0),activation.actualDamage);
  }
  const start=weaponShotStartMs(weaponVisualCards(projectiles).length);
  assert.ok(weaponResolutionMs(r.events)>=Math.max(...projectiles.filter(s=>s.fires).map(s=>start+s.delayMs+weaponEffectProfile(s.cardId,s).flightMs+weaponEffectProfile(s.cardId,s).impactMs)));
 });
for(const p of APPROVED_WEAPON_SALVOS)test(p.cardId+' · blocked volley creates no firing projectile or damage',()=>{
 const b=createMaglioReviewBattle({cardId:p.cardId,supports:isChain(p)||isCascade(p),nowMs:0});
 b.sides.A.fireDisabledUntil=b.ply+10;
 const r=resolvePreparedFleetTurn(b,'A',order,2000);assert.ok(r.ok);
 const shots=fleetWeaponProjectiles(r.events).filter(s=>s.cardId===p.cardId);
 assert.ok(shots.every(s=>!s.fires&&!s.actualDamage));
});
test('Variable launch bands are mirrored, deterministic and vary between activations',()=>{
 for(const p of APPROVED_WEAPON_SALVOS){
  const origins=new Set();
  for(let ply=0;ply<20;ply+=2)for(let i=0;i<Math.max(2,p.count);i++){
   const s={cardId:p.cardId,who:'A',machineSlot:0,ply,stage:1,salvoIndex:i,impactIndex:i};
   const a=weaponLaunchOrigin(s),b=weaponLaunchOrigin({...s,who:'B'});
   assert.deepEqual(a,weaponLaunchOrigin({...s}));assert.equal(a.x+b.x,450);assert.equal(a.y+b.y,800);
   assert.ok(a.x>=26&&a.x<=424);assert.equal(a.y,812);assert.equal(b.y,-12);
   origins.add(a.x+':'+a.y);
  }
  assert.ok(origins.size>=3,p.cardId+' must not use one fixed emitter');
 }
});
test('Curved and rotating flight keeps the 3D nose on the real target for all approved designs, A and B',()=>{
 const camera=createProjectileCamera();let curved=0,rotating=0;
 for(const p of APPROVED_WEAPON_SALVOS.filter(p=>p.count))for(const who of ['A','B']){
  const shot={cardId:p.cardId,who,ply:4,salvoIndex:Math.max(0,p.count-1),salvoCount:p.count,salvoStyle:p.style};
  const from=weaponLaunchOrigin(shot),to=weaponContactPoint({x:who==='A'?148:310,y:who==='A'?290:525,radius:23},shot);
  const profile=weaponEffectProfile(p.cardId,shot),end=weaponFlightFrame(from,to,1,camera,-.58,{shot,kind:profile.kind});
  const target=worldPointToBoard(end.nose,camera);assert.ok(Math.hypot(target.x-to.x,target.y-to.y)<1e-8);
  for(const t of [0,.12,.35,.6,.86,1]){
   const frame=weaponFlightFrame(from,to,t,camera,-.58,{shot,kind:profile.kind});
   assert.ok([...frame.center.toArray(),frame.pitch,frame.yaw,frame.roll].every(Number.isFinite));
   const q=new Quaternion().setFromEuler(new Euler(frame.pitch,frame.yaw,frame.roll,'YXZ'));
   const physical=frame.center.clone().add(new Vector3(0,0,-.58).applyQuaternion(q));
   assert.ok(physical.distanceTo(frame.nose)<1e-8,'The moving nose, not the sprite center, makes contact');
   if(frame.nose.y>.05)curved++;if(Math.abs(frame.roll)>.1)rotating++;
  }
 }
 assert.ok(curved>40);assert.ok(rotating>25);
});
for(const count of [0,1,2])test(`Cascade L: ${count} paid transfers wait for every prior projectile`,()=>{
 const id='weapon-designed-metallic-perforatore-cascata-rarity-l';
 const b=createMaglioReviewBattle({cardId:id,supports:true,cascadeMode:'two',energyCards:count,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,2000);assert.ok(r.ok);
 const shots=fleetWeaponProjectiles(r.events).filter(s=>s.cardId===id),groups=Map.groupBy(shots,s=>s.cascadeIndex||0);
 assert.equal(shots.length,3*(count+1));assert.equal(shots.reduce((n,s)=>n+s.transferEnergySpent,0),count);
 assert.equal(r.events.filter(e=>e.kind==='weapon-cascade'&&e.cardId===id).length,count);
 for(let i=1;i<=count;i++){
  const previous=groups.get(i-1),next=groups.get(i),end=Math.max(...previous.map(s=>s.delayMs+weaponEffectProfile(id,s).flightMs));
  assert.ok(Math.min(...next.map(s=>s.delayMs))>=end+90);
  assert.ok(next.every(s=>s.sourceTargetId===previous[0].targetId&&s.cascadeTransfer));
 }
});
test('Persistent chains keep the actual launch port after an unsuccessful first anchor',()=>{
 const id='weapon-designed-metallic-ganasce-magnetiche';
 for(const withDefense of [false,true]){
  const b=createMaglioReviewBattle({cardId:id,supports:true,withDefense,nowMs:0});
  const r=resolvePreparedFleetTurn(b,'A',order,2000),shots=fleetWeaponProjectiles(r.events).filter(s=>s.cardId===id&&s.fires);
  const links=activeGrappleLinks(r.battle).filter(l=>l.who==='A');
  for(const link of links){const s=shots.find(s=>s.targetId===link.targetId);assert.ok(s);assert.deepEqual(weaponLaunchOrigin(link),weaponLaunchOrigin(s));}
  assert.equal(shots.length,withDefense?1:2);
  if(!withDefense)assert.notEqual(weaponLaunchOrigin(shots[0]).x,weaponLaunchOrigin(shots[1]).x);
 }
});
test('Salvo haptics give short ticks and one stronger final contact, respecting preferences',()=>{
 const opts={nav:{vibrate:()=>true,userActivation:{hasBeenActive:true}},doc:{visibilityState:'visible'},storage:{getItem:()=>null},salvoCount:9};
 const tick=requestWeaponHaptic('gravity-maul','impact',3,opts),final=requestWeaponHaptic('gravity-maul','impact',3,{...opts,finisher:true});
 assert.equal(tick.status,'requested');assert.ok(tick.pattern[0]<final.pattern[0]);assert.equal(final.physicalVerified,false);
 assert.equal(requestWeaponHaptic('gravity-maul','impact',3,{...opts,storage:{getItem:()=> 'false'}}).status,'muted');
});
