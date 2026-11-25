import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {MAGLIO_VARIANTS,weaponEffectProfile,weaponPortalOrigin,fleetWeaponShots} from './maglioBattleVisuals.js';
import {METAL_WEAPON_VARIANTS} from './metalWeaponBattleVisuals.js';
import {CHAIN_WEAPON_VARIANTS} from './chainWeaponBattleVisuals.js';
import {PRECISION_WEAPON_VARIANTS} from './precisionWeaponBattleVisuals.js';
import {cinematicStyle,weaponHullFrame,weaponVisualSeed,seededUnit,weaponTravelProgress} from './weaponCinematicStyle.js';
import {prepareCinematicEntry,drawCinematicWeapon,drawCollisionConvergence,drawDefenseDismantle} from './weaponCinematicRenderer.js';
import {createProjectileCamera,worldPointToBoard} from './maglioProjectile3D.js';
import {metalWeaponSoundPlan} from './metalWeaponSounds.js';
import {weaponHapticPattern} from './weaponHaptics.js';
import {weaponHullImpactProfile,weaponImpactHullFrame,weaponHullContactPoint,weaponHullImpactRadius} from './weaponHullImpacts.js';

const variants=[...MAGLIO_VARIANTS,...METAL_WEAPON_VARIANTS,...CHAIN_WEAPON_VARIANTS,...PRECISION_WEAPON_VARIANTS];
const profiles=variants.map(v=>weaponEffectProfile(v.id));
// A recording canvas catches NaN/out-of-range projection, canvas state leaks
// and accidental blank sequences. Pixel quality is separately reviewed.
function recordingCanvas(){
 const commands=[];let depth=0;
 const gradient={addColorStop(offset,color){assert.ok(offset>=0&&offset<=1);commands.push(['stop',offset,color]);}};
 const ctx=new Proxy({commands,globalAlpha:1,save(){depth++;},restore(){assert.ok(depth>0);depth--;},
  get depth(){return depth;},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},
  createLinearGradient(...args){args.forEach(n=>assert.ok(Number.isFinite(n)));return gradient;},
  createRadialGradient(...args){args.forEach(n=>assert.ok(Number.isFinite(n)));assert.ok(args[5]>=0);return gradient;}
 },{get(obj,key){if(key in obj)return obj[key];return (...args)=>{
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),key+' contains NaN');
   if(key==='ellipse'||key==='arc')assert.ok(args[2]>=0);
   commands.push([key,...args.map(n=>typeof n==='number'?Math.round(n*1e4)/1e4:n)]);
  };},set(obj,key,value){if(typeof value==='number')assert.ok(Number.isFinite(value));
   commands.push([key,value]);obj[key]=value;return true;}});
 return ctx;
}
globalThis.document={createElement:()=>({getContext:()=>recordingCanvas()})};
test('22 approved variants have distinct choreographies, audio and haptic contact',()=>{
 assert.equal(profiles.length,22);assert.equal(new Set(profiles.map(p=>cinematicStyle(p).motif)).size,22);
 for(const p of profiles)for(const phase of ['charge','fire','impact']){
  assert.ok(metalWeaponSoundPlan(p.sound[phase])?.layers.length,p.cardId+' '+phase);
  assert.ok(weaponHapticPattern(p.kind,phase,p.tier).length,p.kind+' '+phase);
 }
 assert.equal(cinematicStyle({approved:false,kind:'gravity-maul',tier:0}),null);
});
for(const who of ['A','B'])test('All variants: projected stages are finite and deterministic from '+who,()=>{
 const camera=createProjectileCamera(),signatures=[];
 for(const p of profiles){
  const shot={cardId:p.cardId,who,targetKind:'escort',targetId:'support-1',fires:true,actualDamage:18};
  const e=prepareCinematicEntry({shot,profile:p,from:weaponPortalOrigin(who),to:{x:152,y:who==='A'?255:538},start:900},camera);
  assert.ok(e);assert.deepEqual(e.shot,shot);
  const end=worldPointToBoard(e.b,camera);assert.ok(Math.hypot(end.x-e.to.x,end.y-e.to.y)<1e-8);
  const floor=recordingCanvas(),air=recordingCanvas();
  for(const delta of [-300,-1,0,p.flightMs*.42,p.flightMs*.9,p.flightMs,p.flightMs+95,p.flightMs+400,p.flightMs+p.impactMs]){
   if(p.kind==='alloy-collision')drawCollisionConvergence(floor,air,e,e.to,delta,false);
   else drawCinematicWeapon(floor,air,e,e.start+delta);
   assert.equal(floor.depth,0);assert.equal(air.depth,0);
  }
  assert.ok(floor.commands.length+air.commands.length>10,p.cardId);
  signatures.push(createHash('sha256').update(JSON.stringify([floor.commands,air.commands])).digest('hex'));
  assert.equal(weaponVisualSeed(shot),weaponVisualSeed({...shot}));
  assert.notEqual(weaponVisualSeed(shot),weaponVisualSeed({...shot,targetId:'support-2'}));
 }
 assert.equal(new Set(signatures).size,22);
});
test('No firing event means no cinematic projectile; shield contacts remain shield-only',()=>{
 const p=profiles.find(p=>p.kind==='induction'),camera=createProjectileCamera();
 const path={profile:p,start:500,from:weaponPortalOrigin('A'),to:{x:150,y:260},
  shot:{cardId:p.cardId,who:'A',fires:false,targetKind:'escort',targetId:'x',actualDamage:0}};
 assert.equal(prepareCinematicEntry(path,camera),null);
 const entry=prepareCinematicEntry({...path,shot:{...path.shot,defenseBlocked:true}},camera);
 const floor=recordingCanvas(),air=recordingCanvas();drawCinematicWeapon(floor,air,entry,500+p.flightMs+20);
 assert.equal(floor.commands.length,0);
 assert.ok(!air.commands.some(c=>c[0]==='drawImage'),'No smoke or hull damage on a shield');
 assert.deepEqual(weaponHullFrame(p.kind,20,p.impactMs,{blocked:true}),weaponHullFrame(p.kind,-1,p.impactMs));
});
test('Independent defense dismantling has volume, a bounded lifetime and reduced motion',()=>{
 const p=profiles.find(p=>p.kind==='induction'),camera=createProjectileCamera(),point={x:143,y:340};
 const idle=recordingCanvas();
 drawDefenseDismantle(idle,point,p,-1,camera);drawDefenseDismantle(idle,point,p,1000,camera);
 assert.equal(idle.commands.length,0);
 const full=recordingCanvas(),reduced=recordingCanvas();
 for(const ms of [0,50,200,500,999]){drawDefenseDismantle(full,point,p,ms,camera);
  drawDefenseDismantle(reduced,point,p,ms,camera,{reduced:true});}
 assert.equal(full.depth,0);assert.equal(reduced.depth,0);
 assert.ok(full.commands.filter(c=>c[0]==='lineTo').length>50);
 assert.equal(reduced.commands.filter(c=>c[0]==='lineTo').length,0);
});
test('Every hull reaction ends neutral, respects reduced motion and excludes the collision controller',()=>{
 const signatures=[];
 for(const p of profiles){
  const poses=[0,33,100,300,700,p.impactMs].map(age=>weaponHullFrame(p.kind,age,p.impactMs,{tier:p.tier}));
  for(const pose of poses)for(const [key,n]of Object.entries(pose)){
   assert.ok(Number.isFinite(n));assert.ok(Math.abs(n)<30,key+' stays local to the hull');
  }
  const final=poses.at(-1);assert.ok(Object.values(final).every(n=>n===0));
  const reduced=weaponHullFrame(p.kind,75,p.impactMs,{reduced:true});
  assert.ok(Object.entries(reduced).every(([k,n])=>k==='light'||n===0));
  signatures.push(JSON.stringify(poses));
 }
 assert.ok(new Set(signatures).size>=15);
 assert.ok(Object.values(weaponHullFrame('alloy-collision',120,1350)).every(n=>n===0));
 for(let i=0;i<200;i++)assert.ok(seededUnit(711,i)>=0&&seededUnit(711,i)<1);
});
test('Material-specific speeds stay monotonic and reach the same real contact time',()=>{
 for(const p of profiles){
  let previous=0;
  for(let i=0;i<=1000;i++){
   const t=weaponTravelProgress(p.kind,i/1000);assert.ok(t>=previous&&t<=1);previous=t;
  }
  assert.equal(weaponTravelProgress(p.kind,0),0);assert.equal(weaponTravelProgress(p.kind,1),1);
 }
});
test('Presentation preparation never mutates engine events, target IDs, HP or shot count',()=>{
 const events=variants.map((v,i)=>({kind:'weapon-base-shot',who:i%2?'A':'B',cardId:v.id,machineSlot:0,
  targetKind:'escort',targetId:'actual-'+i,actualDamage:i+1}));
 const before=JSON.stringify(events),shots=fleetWeaponShots(events),snapshot=JSON.stringify(shots),camera=createProjectileCamera();
 for(const shot of shots)prepareCinematicEntry({shot,profile:weaponEffectProfile(shot.cardId,shot),
  from:weaponPortalOrigin(shot.who),to:{x:150,y:260},start:1000},camera);
 assert.equal(JSON.stringify(events),before);assert.equal(JSON.stringify(shots),snapshot);
 assert.equal(shots.length,22);
});

function filledAreas(ctx){
 let points=[];const areas=[];
 for(const [command,...args]of ctx.commands){
  if(command==='beginPath')points=[];
  if(command==='moveTo'||command==='lineTo')points.push(args);
  if(command==='fill'&&points.length>2){
   const sum=points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p[0]*q[1]-q[0]*p[1];},0);
   areas.push(Math.abs(sum)/2);
  }
 }
 return areas;
}
test('Early real hits paint a readable explosion body, not only a hull jolt',()=>{
 for(const who of ['A','B'])for(const kind of ['gravity-maul','thermal-reclaimer','wandering-shrapnel']){
  const base=profiles.find(p=>p.kind===kind&&p.tier===3);
  const shot={cardId:base.cardId,who,fires:true,actualDamage:8,salvoCount:6,salvoIndex:0,salvoLast:false};
  const profile=weaponEffectProfile(base.cardId,shot),camera=createProjectileCamera();
  const entry=prepareCinematicEntry({shot,profile,start:500,from:weaponPortalOrigin(who),
   to:{x:225,y:who==='A'?268:540,radius:28}},camera);
  const floor=recordingCanvas(),air=recordingCanvas();
  drawCinematicWeapon(floor,air,entry,500+profile.flightMs+60);
  assert.ok(Math.max(0,...filledAreas(air))>200,kind+' needs a substantial visible contact');
  assert.equal(air.depth,0);assert.equal(floor.depth,0);
 }
});
test('Zero-HP allocations in a real salvo make armor pings without smoke or invented recoil',()=>{
 const base=profiles.find(p=>p.kind==='thermal-reclaimer'&&p.tier===3),camera=createProjectileCamera();
 const shot={cardId:base.cardId,who:'A',fires:true,actualDamage:0,activationDamage:1,
  salvoCount:6,salvoIndex:5,salvoLast:true};
 const profile=weaponEffectProfile(base.cardId,shot),contact=weaponHullImpactProfile(profile,shot);
 assert.equal(contact.damaging,false);assert.equal(contact.smoke,false);
 const pose=weaponImpactHullFrame(profile,shot,60);
 assert.ok(Object.entries(pose).every(([k,n])=>k==='light'||n===0));
 const entry=prepareCinematicEntry({shot,profile,start:0,from:weaponPortalOrigin('A'),to:{x:225,y:268,radius:28}},camera);
 const floor=recordingCanvas(),air=recordingCanvas();
 drawCinematicWeapon(floor,air,entry,profile.flightMs+60);
 assert.ok(!air.commands.some(c=>c[0]==='drawImage'));
 assert.ok(Math.max(0,...filledAreas(air))<40,'No explosive body for a zero damage allocation');
});
test('Missing shots, blocks, legacy placeholders and the separate collision controller do not get hull explosions',()=>{
 for(const p of profiles){
  const shot={who:'A',fires:true,actualDamage:18};
  assert.equal(weaponHullImpactProfile(p,{...shot,fires:false}),null);
  assert.equal(weaponHullImpactProfile(p,{...shot,defenseBlocked:true}),null);
  assert.equal(weaponHullImpactProfile({...p,approved:false},shot),null);
  if(p.kind==='alloy-collision')assert.equal(weaponHullImpactProfile(p,shot),null);
 }
});
test('Contacts follow the common moving hull during overlapping salvos and remain local',()=>{
 const point={x:225,y:268,radius:28},pose={x:7,y:-11,lift:-3};
 assert.deepEqual(weaponHullContactPoint(point,pose),{x:232,y:254,radius:28});
 for(const p of profiles.filter(p=>p.kind!=='alloy-collision')){
  const shot={who:'A',fires:true,actualDamage:18,salvoCount:9};
  const early=weaponHullImpactProfile(p,{...shot,salvoLast:false}),last=weaponHullImpactProfile(p,{...shot,salvoLast:true,finisher:true});
  assert.ok(weaponHullImpactRadius(point,last)>weaponHullImpactRadius(point,early));
  for(const radius of [0,12,28,70,1000])assert.ok(weaponHullImpactRadius({...point,radius},last)<=52);
  const neutral=weaponImpactHullFrame(p,shot,p.impactMs);
  assert.ok(Object.values(neutral).every(n=>n===0));
 }
});
test('Visible hull contacts end on time and reduced motion keeps only a subdued indication',()=>{
 const p=profiles.find(p=>p.kind==='gravity-maul'&&p.tier===3),camera=createProjectileCamera();
 const shot={who:'A',cardId:p.cardId,fires:true,actualDamage:18};
 const entry=prepareCinematicEntry({shot,profile:p,start:500,from:weaponPortalOrigin('A'),to:{x:225,y:268,radius:28}},camera);
 const floor=recordingCanvas(),air=recordingCanvas();
 drawCinematicWeapon(floor,air,entry,500+p.flightMs+p.impactMs);
 assert.equal(floor.commands.length+air.commands.length,0);
 drawCinematicWeapon(floor,air,entry,500+p.flightMs+60,{reduced:true});
 assert.ok(!air.commands.some(c=>['lineTo','drawImage'].includes(c[0])));
 assert.equal(air.depth,0);
});
