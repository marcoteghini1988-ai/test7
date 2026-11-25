import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAIN_WEAPON_VARIANTS,GRAPPLE_ID,COLLISION_ID,INDUCTION_ID,chainWeaponEffectProfile,
 collisionGroups,collisionFrame,collisionMotionPlan,activeGrappleLinks} from './chainWeaponBattleVisuals.js';
import {fleetWeaponShots,weaponEffectProfile,weaponResolutionMs,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn,autoFleetTurn} from './fleetNext/combat.js';
import {cardFacePath} from './fleetNext/rules.js';
import {metalWeaponSoundPlan} from './metalWeaponSounds.js';
import {createChainWeaponModel,articulateChainWeapon} from './chainWeaponProjectile3D.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {metalProjectileFlightFrame} from './metalWeaponProjectile3D.js';
import {requestWeaponHaptic,weaponHapticPattern,HAPTICS_KEY} from './weaponHaptics.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
for(const v of CHAIN_WEAPON_VARIANTS){
 test(v.id+' · fronte approvato HD, sequenza e suoni dedicati',()=>{
  const art=cardFacePath(v.id);assert.equal(art,'/assets/fleet-weapon-fronts/'+v.id+'.png');
  const png=readFileSync('public'+art);assert.equal(png.readUInt32BE(16),3072);assert.equal(png.readUInt32BE(20),4608);
  const p=weaponEffectProfile(v.id);assert.equal(p.kind,v.kind);assert.ok(p.approved);
  for(const phase of ['charge','fire','impact']){
   const plan=metalWeaponSoundPlan(p.sound[phase]);assert.ok(plan?.layers.length);
   assert.equal(plan.tier,v.tier);assert.equal(plan.phase,phase);
   assert.ok(weaponHapticPattern(v.kind,phase,v.tier).length);
  }
 });
 for(const who of ['A','B'])for(const slot of [0,1])
 test(v.id+' · '+who+' slot '+(slot+1)+' · stessi bersagli e HP del motore',()=>{
  let b=createMaglioReviewBattle({cardId:v.id,slot,supports:true,nowMs:0});
  if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000).battle;
  const snapshot=JSON.stringify(b),r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok,r.reason);
  const event=r.events.find(e=>e.cardId===v.id&&e.kind.endsWith('-shot'));assert.ok(event);
  const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===v.id);
  assert.equal(shots.length,v.kind==='induction'?1:2);
  assert.deepEqual(shots.map(s=>s.targetId),event.impacts.map(h=>h.targetId));
  assert.deepEqual(shots.map(s=>s.actualDamage),event.impacts.map(h=>h.actualDamage));
  assert.ok(shots.every(s=>s.machineSlot===slot));
  const start=weaponShotStartMs(weaponVisualCards(shots,[]).length),p=weaponEffectProfile(v.id);
  assert.ok(weaponResolutionMs(r.events)>=start+p.flightMs+p.impactMs);
  if(v.kind==='alloy-collision'){
   assert.equal(collisionGroups(shots).length,1);assert.equal(shots[0].delayMs,shots[1].delayMs);
   assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who===who).length,0);
  }
  assert.equal(JSON.stringify(b),snapshot,'La presentazione non altera il combattimento');
 });
 test(v.id+' · blocco non produce proiettili o collisioni fittizi',()=>{
  const b=createMaglioReviewBattle({cardId:v.id,supports:true,blocked:true,nowMs:0});
  const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok,r.reason);
  const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===v.id);
  assert.ok(shots.every(s=>!s.fires));assert.equal(collisionGroups(shots).length,0);
 });
}
test('Ganasce: catene persistenti, nessun nuovo colpo nel secondo turno, consumo della combo',()=>{
 let b=createMaglioReviewBattle({cardId:GRAPPLE_ID,supports:true,nowMs:0});
 let r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok);
 const ids=r.events.find(e=>e.pattern==='magnetic-grapple').impacts.map(h=>h.targetId);
 assert.deepEqual(activeGrappleLinks(r.battle).filter(l=>l.who==='A').map(l=>l.targetId),ids);
 r=resolvePreparedFleetTurn(r.battle,'B',autoFleetTurn(r.battle,'B'),2000);assert.ok(r.ok,r.reason);
 assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who==='A').length,2);
 r=resolvePreparedFleetTurn(r.battle,'A',order,3000);assert.ok(r.ok,r.reason);
 assert.equal(r.events.filter(e=>e.cardId===GRAPPLE_ID&&e.kind==='weapon-provisional-shot').length,0);
 assert.equal(collisionGroups(fleetWeaponShots(r.events)).length,1);
 assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who==='A').length,0);
});
test('Ganasce: non lascia catene su scafi morti e non rende valida la combo',()=>{
 const b=createMaglioReviewBattle({cardId:GRAPPLE_ID,supports:true,wounded:true,focus:1,nowMs:0});
 const first=resolvePreparedFleetTurn(b,'A',order,1000);
 assert.equal(activeGrappleLinks(first.battle).filter(l=>l.who==='A').length,1);
 const enemy=resolvePreparedFleetTurn(first.battle,'B',{cards:[],pass:true},2000);
 const attempt=resolvePreparedFleetTurn(enemy.battle,'A',order,3000);
 assert.match(attempt.invalidPrepared,/ancora vive/);assert.equal(fleetWeaponShots(attempt.events).filter(s=>s.fires).length,0);
});
test('Collassatore: combo scaduta rifiutata senza catene residue',()=>{
 const b=createMaglioReviewBattle({cardId:COLLISION_ID,supports:true,expiredCombo:true,nowMs:0});
 assert.equal(activeGrappleLinks(b).length,0);
 const r=resolvePreparedFleetTurn(b,'A',order,2000);assert.match(r.invalidPrepared,/turno precedente/);assert.equal(collisionGroups(fleetWeaponShots(r.events)).length,0);
});
test('Collassatore: supporto e madre, due scafi reali, una sola collisione e ripristino esatto',()=>{
 const b=createMaglioReviewBattle({cardId:COLLISION_ID,supports:true,supportCount:1,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,2000);assert.ok(r.ok,r.reason);
 const [g]=collisionGroups(fleetWeaponShots(r.events));assert.ok(g);assert.deepEqual(new Set(g.map(s=>s.targetKind)),new Set(['escort','part']));
 const p=chainWeaponEffectProfile(COLLISION_ID),plan=collisionMotionPlan({x:90,y:240,radius:27},{x:225,y:220,radius:55});
 assert.ok(plan.offsets[0].x>0&&plan.offsets[1].x<0);
 assert.equal(plan.offsets[0].x+plan.offsets[1].x,0);
 const clear=collisionMotionPlan({x:90,y:240,radius:27},{x:225,y:220,radius:55},{forward:78});
 assert.equal(clear.contact.y,plan.contact.y+78);
 assert.equal(clear.offsets[0].y+clear.offsets[1].y,156,'Entrambi gli scafi avanzano sul tavolo senza attraversare la madre ferma');
 assert.equal(collisionFrame(p.flightMs,p).phase,'contact');assert.equal(collisionFrame(p.flightMs,p).pull,1);
 assert.equal(collisionFrame(p.flightMs+p.impactMs,p).pull,0);
 assert.equal(collisionFrame(p.flightMs+p.impactMs,p).phase,'restored');
});
for(const count of [0,1,2])test('Induzione: '+count+' Energie fisiche, Difesa e nessun consumo',()=>{
 const b=createMaglioReviewBattle({cardId:INDUCTION_ID,supports:true,energyCards:count,withDefense:true,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok,r.reason);
 const e=r.events.find(e=>e.kind==='weapon-designed-shot');
 assert.equal(e.energyCardsSeen,count);assert.equal(e.energyConsumed,0);
 assert.equal(r.battle.sides.A.energyPile.length,count);
 assert.equal(r.events.filter(e=>e.kind==='weapon-break-defense').length,count>=2?1:0);
 if(count===0)assert.equal(e.actualDamage,0);else assert.ok(e.actualDamage>0);
 assert.equal(e.impacts[0].targetKind,'escort','Non oltrepassa il supporto per colpire la madre');
});
test('Induzione bloccata: smontaggio reale della Difesa anche senza colpo di danno',()=>{
 const b=createMaglioReviewBattle({cardId:INDUCTION_ID,supports:true,energyCards:2,withDefense:true,blocked:true,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok,r.reason);
 assert.equal(fleetWeaponShots(r.events).filter(s=>s.fires).length,0);
 assert.equal(r.events.filter(e=>e.kind==='weapon-break-defense').length,1);
 assert.ok(weaponResolutionMs(r.events)>=weaponShotStartMs(1)+1100);
});
test('Modello ganasce: articolazione, dettagli cumulativi e viste fisiche A/B',()=>{
 const camera=createProjectileCamera();let previous=0;
 for(const tier of [1,2,3]){
  const m=createChainWeaponModel('magnetic-grapple',tier);let count=0;m.traverse(o=>{if(o.isMesh)count++;});
  assert.ok(count>previous);previous=count;
  articulateChainWeapon(m,0);assert.ok(m.userData.jaws[0].rotation.y<-.5);
  articulateChainWeapon(m,1);assert.ok(Math.abs(m.userData.jaws[0].rotation.y)<.001);
  for(const [from,to,end] of [[{x:225,y:812},{x:100,y:230},'rear'],[{x:225,y:-12},{x:340,y:580},'front']]){
   const pose=metalProjectileFlightFrame(from,to,.5,camera,m.userData.frontZ);
   assert.equal(pose.visibleEnd,end);
   const final=metalProjectileFlightFrame(from,to,1,camera,m.userData.frontZ),nose=worldPointToBoard(final.nose,camera);
   assert.ok(Math.hypot(nose.x-to.x,nose.y-to.y)<.001);
  }
  disposeProjectile(m);
 }
});
test('Aptica: preferenza, visibilità, attivazione e richiesta distinta dalla verifica fisica',()=>{
 const calls=[],nav={vibrate:p=>{calls.push(p);return true;},userActivation:{hasBeenActive:true}};
 const env={nav,doc:{visibilityState:'visible'},storage:{getItem:()=>null}};
 assert.equal(requestWeaponHaptic('alloy-collision','impact',2,env).status,'requested');
 assert.equal(calls.length,1);assert.equal(requestWeaponHaptic('alloy-collision','impact',2,env).physicalVerified,false);
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,storage:{getItem:key=>key===HAPTICS_KEY?'false':null}}).status,'muted');
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,doc:{visibilityState:'hidden'}}).status,'hidden');
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,nav:{}}).status,'unsupported');
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,nav:{vibrate:()=>true,userActivation:{hasBeenActive:false}}}).status,'needs-activation');
 assert.equal(calls.length,2,'Le richieste mute/nascoste/incompatibili non toccano il dispositivo');
});
