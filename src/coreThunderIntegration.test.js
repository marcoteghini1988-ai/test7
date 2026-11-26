import test from 'node:test';
import assert from 'node:assert/strict';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {coreReviewSequence,RARITIES} from '../scripts/previews/nucleo-20261126/sequence.mjs';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {CORE_FAMILY,CORE_KIND,CORE_TIMING,coreFrame} from './coreThunderSpec.js';
import {weaponEffectProfile,fleetWeaponProjectiles,weaponResolutionMs,weaponShotStartMs} from './maglioBattleVisuals.js';
import {weaponLaunchOrigin} from './weaponKinematics.js';
import {weaponImpactHullFrame} from './weaponHullImpacts.js';
import {createProjectileCamera,boardPointToWorld} from './maglioProjectile3D.js';
import {coreScenicPose} from './coreThunderRenderer.js';
import {prepareCinematicEntry,drawCinematicWeapon} from './weaponCinematicRenderer.js';
import {coreCuePlan,coreThunderSoundPlan,synthesizeCoreAudio} from './coreThunderAudio.js';
import {weaponHapticPattern,requestWeaponHaptic} from './weaponHaptics.js';

const order={pass:true,cards:[],targetKind:'part',targetId:'weapons',partId:'weapons'};
const shotOf=r=>r.events.find(e=>e.kind==='weapon-provisional-shot'&&e.cardId===CORE_FAMILY);
test('Nucleo: event metadata matches real spending and the permanent charge break in all rarities',()=>{
 for(const rarity of RARITIES)for(const mode of ['charged','broken','old-only']){
  const s=coreReviewSequence({rarity,mode});
  for(const f of s.frames){const e=f.event;
   assert.equal(e.coreChargeStage,f.currentStage);assert.equal(e.coreChargeBroken,f.broken);
   assert.equal(e.energySpent,f.energySpent);assert.equal(e.hitCount,1);
   assert.equal(e.energyContributions.reduce((n,c)=>n+c.consumed,0),e.energySpent);
   assert.equal(e.coreChargeLost,mode!=='charged'&&f.stage===2);
   assert.equal(fleetWeaponProjectiles(f.events).filter(x=>x.cardId===f.cardId).length,1);
  }
 }
});
test('A physical Rare Energy loses one charge, remains in place, and cannot fuel growth next turn without new Energy',()=>{
 let b=createMaglioReviewBattle({cardId:CORE_FAMILY,nowMs:0,ownStage:2});
 b.sides.A.hand=['energy-ionic-r'];
 let r=resolvePreparedFleetTurn(b,'A',{...order,cards:[0]},1000);assert.ok(r.ok,r.reason);
 const e=shotOf(r);assert.equal(e.coreChargeStage,2);assert.equal(e.energySpent,1);
 assert.deepEqual(e.energyContributions,[{cardId:'energy-ionic-r',pileIndex:0,beforeCharges:2,afterCharges:1,consumed:1,discarded:false}]);
 assert.deepEqual(r.battle.sides.A.energyPile,[{id:'energy-ionic-r',elementId:'ionic',remaining:1}]);
 b=resolvePreparedFleetTurn(r.battle,'B',order,2000).battle;
 r=resolvePreparedFleetTurn(b,'A',order,3000);assert.ok(r.ok,r.reason);
 assert.equal(shotOf(r).coreChargeStage,1);assert.equal(shotOf(r).energySpent,0);
 assert.deepEqual(r.battle.sides.A.energyPile,[{id:'energy-ionic-r',elementId:'ionic',remaining:1}]);
});
test('Core expiry is emitted once at the real boundary and is included in presentation time',()=>{
 let b=createMaglioReviewBattle({cardId:CORE_FAMILY,nowMs:0,ownStage:3});
 let r=resolvePreparedFleetTurn(b,'A',{...order,cards:[0]},1000);assert.ok(r.ok,r.reason);
 assert.equal(r.events.filter(e=>e.kind==='weapon-core-expired').length,0);
 r=resolvePreparedFleetTurn(r.battle,'B',order,2000);assert.ok(r.ok,r.reason);
 const expired=r.events.filter(e=>e.kind==='weapon-core-expired'&&e.who==='A');assert.equal(expired.length,1);
 assert.equal(r.battle.sides.A.machines.some(m=>m.sourceCardId===CORE_FAMILY),false);
 assert.equal(r.battle.sides.A.discard.filter(id=>id===CORE_FAMILY).length,1);
 assert.ok(weaponResolutionMs(expired)>=880);
 r=resolvePreparedFleetTurn(r.battle,'A',order,3000);
 assert.equal(r.events.filter(e=>e.kind==='weapon-core-expired'&&e.who==='A').length,0);
});
test('Live profiles follow actual stage, use variable correct-side edges, exact endpoints and synchronized score/haptics',()=>{
 const camera=createProjectileCamera();
 for(const who of ['A','B'])for(const f of coreReviewSequence({rarity:'Leggendaria',who}).frames){
  const shot=fleetWeaponProjectiles(f.events).find(s=>s.cardId===f.cardId),p=weaponEffectProfile(shot.cardId,shot);
  assert.equal(p.kind,CORE_KIND);assert.equal(p.approved,true);assert.equal(p.flightMs,CORE_TIMING.flight);
  const from=weaponLaunchOrigin(shot),to={x:225,y:who==='A'?263:570};
  assert.ok(who==='A'?from.y>800:from.y<0);
  const frame=coreFrame(p,shot),pose=coreScenicPose(frame,p.flightMs,from,to,p.flightMs);
  assert.ok(pose.point.distanceTo(boardPointToWorld(to,camera))<1e-8);
  assert.ok(prepareCinematicEntry({shot,profile:p,from,to,start:1500},camera));
  const sound=coreThunderSoundPlan(p.sound.impact),cue=coreCuePlan(frame).find(c=>c.phase==='impact');
  assert.deepEqual(sound.layers,cue.voices);assert.deepEqual(weaponHapticPattern(p.kind,'impact',p.tier,frame.currentStage),cue.haptic);
  assert.equal(cue.at,(CORE_TIMING.charge+CORE_TIMING.flight)/1000);
  assert.ok(weaponImpactHullFrame(p,shot,40).thrust>0);
  assert.equal(weaponImpactHullFrame(p,shot,40,{reduced:true}).thrust,0);
  assert.equal(weaponImpactHullFrame(p,shot,p.impactMs).y,0);
 }
 const frames=coreReviewSequence().frames;
 assert.equal(new Set(frames.map(f=>weaponLaunchOrigin(fleetWeaponProjectiles(f.events)[0]).x)).size,3);
});
test('Blocked core makes only the shield contact; no hull recoil; reduced motion omits the full flight',()=>{
 const f=coreReviewSequence({mode:'blocked',supports:true,turns:1}).frames[0];
 const shot=fleetWeaponProjectiles(f.events)[0],profile=weaponEffectProfile(shot.cardId,shot);
 assert.equal(shot.actualDamage,0);assert.equal(shot.defenseBlocked,true);
 assert.equal(weaponImpactHullFrame(profile,shot,40).thrust,0);
 const cues=coreCuePlan(coreFrame(profile,shot));assert.ok(!cues.some(c=>['impact','compression'].includes(c.phase)));
 let painted=false;const context=new Proxy({},{get:()=>()=>{painted=true;}});
 const entry=prepareCinematicEntry({shot,profile,from:weaponLaunchOrigin(shot),to:{x:225,y:263},start:1500},createProjectileCamera());
 drawCinematicWeapon(context,context,entry,1800,{reduced:true});assert.equal(painted,false);
 assert.equal(weaponResolutionMs(f.events),weaponShotStartMs(1)+1250+1150+150);
});
test('Core score is deterministic, finite and unclipped; haptics honors mute and hidden preferences',()=>{
 for(const f of coreReviewSequence({rarity:'Leggendaria'}).frames){
  const cues=coreCuePlan(f),a=synthesizeCoreAudio(cues,4,{sampleRate:8000}),b=synthesizeCoreAudio(cues,4,{sampleRate:8000});
  assert.deepEqual(a.channels,b.channels);
  assert.ok(a.channels.every(ch=>ch.every(n=>Number.isFinite(n)&&Math.abs(n)<1)));
 }
 let requests=0;const nav={vibrate:()=>{requests++;return true;}};
 assert.equal(requestWeaponHaptic(CORE_KIND,'impact',3,{coreStage:3,nav,doc:{visibilityState:'hidden'}}).status,'hidden');
 assert.equal(requestWeaponHaptic(CORE_KIND,'impact',3,{coreStage:3,nav,doc:{visibilityState:'visible'},storage:{getItem:()=> 'false'}}).status,'muted');
 assert.equal(requests,0);
});
