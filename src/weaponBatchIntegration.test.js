import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BATCH_WEAPON_VARIANTS,batchWeaponVariant,batchVisualHit} from './weaponBatchSpec.js';
import {fleetWeaponProjectiles,weaponEffectProfile,weaponVisualCards,weaponResolutionMs,weaponShotStartMs,maglioPresentationBerths} from './maglioBattleVisuals.js';
import {card,cardDisplayFacePath} from './fleetNext/rules.js';
import {cardTextBasePath,cardTextFields,cardTextSvgContents,localizedCardText} from './cardTextPresentation.js';
import {cardTextSvg} from './weaponBatchCardText.js';
import {weaponHapticPattern} from './weaponHaptics.js';
import {batchWeaponSoundPlan,batchAudioCues} from './weaponBatchAudio.js';
import {weaponImpactHullFrame} from './weaponHullImpacts.js';
import {prepareCinematicEntry,drawCinematicWeapon} from './weaponCinematicRenderer.js';
import {createProjectileCamera} from './maglioProjectile3D.js';
import {weaponLaunchOrigin} from './weaponKinematics.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {batchSequence} from '../scripts/previews/lotto-giudizio-fuoco-20261127/sequence.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),other=w=>w==='A'?'B':'A';
function run(c,{who='A',slot=0,supports=false,ownStage=1,batchMode='normal',energyCards=c.kind==='mortar'?2:0}={}){
 let b=createMaglioReviewBattle({cardId:c.id,slot,supports,ownStage,batchMode,energyCards,discardedStrategies:2,nowMs:0});
 if(who==='B'){b.sides.A.energyPile=[];b.sides.A.elementalCharges={};b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},100).battle;}
 const r=resolvePreparedFleetTurn(b,who,{cards:ownStage===1?[0]:[],pass:true,targetKind:'part',targetId:'weapons',partId:'weapons'},1000);
 assert.ok(r.ok,r.reason);return {...r,before:b,shots:fleetWeaponProjectiles(r.events).filter(s=>s.cardId===c.id)};
}
test('Six approved fronts and six no-text bases are exact native RGBA originals with separate EN/IT SVGs',()=>{
 const m=JSON.parse(readFileSync('asset-sources/card-text/lotto-giudizio-fuoco/manifest.json'));assert.equal(m.cards.length,6);assert.equal(m.approvalQuote,'procedi');assert.equal(m.artworkRegenerated,false);
 for(const c of m.cards){const base=readFileSync(c.path),front=readFileSync('public/assets/fleet-weapon-fronts/'+c.id+'.png');assert.equal(hash(base),c.sha256);assert.equal(hash(front),c.approvedFrontSha256);assert.deepEqual([base.readUInt32BE(16),base.readUInt32BE(20),base[25]],[3072,4608,6]);assert.equal(cardDisplayFacePath(c.id),cardTextBasePath(c.id));
  for(const lang of ['en','it']){assert.equal(cardTextFields(c.id,lang).length,18);assert.equal(cardTextSvg(batchWeaponVariant(c.id),lang),readFileSync('asset-sources/card-text/lotto-giudizio-fuoco/'+lang+'/'+c.id+'.svg','utf8'));assert.match(cardTextSvgContents(c.id,lang,'unique'),/card-text-unique-material/);}
  assert.ok(localizedCardText(card(c.id),'en').description.length>50);
 }
});
test('All six variants resolve through the actual live profiles on both sides and both slots',()=>{
 for(const c of BATCH_WEAPON_VARIANTS)for(const who of ['A','B'])for(const slot of [0,1]){
  const r=run(c,{who,slot,supports:true}),hits=r.shots.filter(s=>!s.burnTick);assert.equal(hits.length,c.kind==='mortar'?3:1);
  for(const s of hits){const p=weaponEffectProfile(c.id,s);assert.equal(s.machineSlot,slot);assert.ok(p.approved);assert.notEqual(p.kind,'legacy-pulse');assert.ok(p.sound.fire&&p.sound.impact);const origin=weaponLaunchOrigin(s);assert.ok(who==='A'?origin.y>800:origin.y<0);}
  assert.ok(weaponResolutionMs(r.events)>=Math.max(...r.shots.map(s=>{const p=weaponEffectProfile(s.cardId,s);return weaponShotStartMs(weaponVisualCards(r.shots).length)+(s.delayMs||0)+p.flightMs+p.impactMs;})));
 }
});
test('Printed direct-hit nominal values apply once; Mortar pays exactly the real extra shots including multi-charge cards',()=>{
 for(const c of BATCH_WEAPON_VARIANTS.filter(c=>c.kind!=='judgment')){
  const r=run(c),e=r.events.find(e=>e.kind==='weapon-provisional-shot'&&e.cardId===c.id);assert.deepEqual(e.impacts.map(h=>h.nominalDamage),c.kind==='mortar'?[c.damage,c.extra,c.extra]:[c.damage]);
  if(c.kind==='mortar'){assert.equal(e.energySpent,2);assert.equal(e.energyContributions.reduce((n,c)=>n+c.consumed,0),2);}
  if(c.kind==='incinerator'){const s=batchSequence({cardId:c.id,turns:3});assert.deepEqual(s.frames.map(f=>f.event?.impacts[0]?.nominalDamage),[c.damage,c.second,undefined]);}
 }
 const c=BATCH_WEAPON_VARIANTS.find(c=>c.kind==='mortar'),b=createMaglioReviewBattle({cardId:c.id,nowMs:0});
 b.sides.A.energyPile=[{id:'energy-plasma-e',remaining:3},'energy-metallic'];b.sides.A.elementalCharges={plasma:1,metallic:1};
 const r=resolvePreparedFleetTurn(b,'A',{cards:[0],pass:true},1000),e=r.events.find(e=>e.kind==='weapon-provisional-shot'&&e.cardId===c.id);assert.ok(r.ok);assert.equal(e.impacts.length,2);assert.equal(e.energySpent,1);
 assert.deepEqual(e.energyContributions,[{cardId:'energy-plasma-e',pileIndex:0,beforeCharges:3,afterCharges:2,consumed:1,discarded:false}]);assert.ok(r.battle.sides.A.energyPile.includes('energy-metallic'));assert.equal(r.battle.sides.A.energyPile[0].remaining,2);
});
test('Judgment has one placement attack, no automatic repeat, real max HP percentage and real expiry',()=>{
 const c=BATCH_WEAPON_VARIANTS.find(c=>c.kind==='judgment');
 for(const who of ['A','B']){const r=run(c,{who}),e=r.events.find(e=>e.kind==='weapon-designed-shot'&&e.cardId===c.id);assert.equal(e.impacts[0].nominalDamage,Math.round(r.before.sides[other(who)].ships[0].maxHp*.2));assert.equal(e.energyConsumed,0);}
 assert.equal(run(c,{ownStage:2}).shots.length,0);assert.equal(run(c,{ownStage:3}).shots.length,0);const expired=run(c,{ownStage:4});assert.equal(expired.shots.length,0);assert.ok(expired.before.sides.A.discard.includes(c.id));
});
test('Defense blocks only the real contact; a blocked first Incinerator shot never applies burn',()=>{
 for(const c of BATCH_WEAPON_VARIANTS){const r=run(c,{batchMode:'defense'}),h=r.shots.find(s=>!s.burnTick);assert.ok(h.defenseBlocked);assert.equal(h.actualDamage,0);const p=weaponEffectProfile(c.id,h);assert.equal(weaponImpactHullFrame(p,h,80).y,0);assert.equal(weaponImpactHullFrame(p,h,80).light,0);assert.equal(batchWeaponSoundPlan(p.sound.block).phase,'block');if(c.kind==='incinerator')assert.equal(r.shots.filter(s=>s.burnTick).length,0);}
});
test('Five real burn events target the mother, survive the weapon, and never reveal or remount an expired weapon',()=>{
 for(const c of BATCH_WEAPON_VARIANTS.filter(c=>c.kind==='incinerator')){
  const s=batchSequence({cardId:c.id,discardedStrategies:2,turns:3}),events=s.frames.flatMap(f=>[...f.betweenEvents,...f.events]),burns=fleetWeaponProjectiles(events).filter(s=>s.burnTick);assert.equal(burns.length,5);assert.ok(burns.every(s=>s.targetKind==='part'&&s.targetId==='weapons'&&s.who==='A'&&s.damagedSide==='B'));
  assert.deepEqual(weaponVisualCards(burns),[]);const last=s.frames[2];assert.equal(last.event,null);const berths=maglioPresentationBerths(last.initial.sides.A,[],last.initial.ply,burns,last.battle.sides.A);assert.ok(berths.every(b=>b?.sourceCardId!==c.id));
 }
});
test('Independent actions finish in order, while one Mortar volley preserves its internal 480ms spacing',()=>{
 const a=BATCH_WEAPON_VARIANTS.find(c=>c.kind==='judgment'),z=BATCH_WEAPON_VARIANTS.find(c=>c.kind==='mortar'),b=createMaglioReviewBattle({cardId:a.id,shipA:'C01',nowMs:0});b.sides.A.hand=[a.id,z.id,'energy-plasma'];
 const r=resolvePreparedFleetTurn(b,'A',{cards:[0,1,2],pass:true},1000);assert.ok(r.ok);const all=fleetWeaponProjectiles(r.events),first=all.filter(s=>s.cardId===a.id),second=all.filter(s=>s.cardId===z.id);assert.equal(first.length,1);assert.equal(second.length,2);const end=Math.max(...second.map(s=>{const p=weaponEffectProfile(z.id,s);return s.delayMs+p.flightMs+p.impactMs;}));assert.ok(first[0].delayMs>=end);assert.equal(second[1].delayMs-second[0].delayMs,480);
});
test('Live sounds, haptics, hull reactions and Canvas visuals share the approved study with finite coordinates',()=>{
 let depth=0,commands=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},{get(o,k){return k in o?o[k]:(...args)=>{commands++;for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const c of BATCH_WEAPON_VARIANTS){const r=run(c),study=batchSequence({cardId:c.id,charges:c.kind==='mortar'?2:0}),cues=batchAudioCues(study);
  for(const s of r.shots){const p=weaponEffectProfile(c.id,s),entry=prepareCinematicEntry({shot:s,profile:p,from:weaponLaunchOrigin(s),to:{x:225,y:260},start:0},createProjectileCamera());assert.ok(entry);
   for(const age of [0,400,1200,p.flightMs,p.flightMs+80,p.flightMs+900])drawCinematicWeapon(ctx,ctx,entry,age);drawCinematicWeapon(ctx,ctx,entry,p.flightMs+80,{reduced:true});assert.equal(depth,0);
   for(const phase of s.burnTick?['impact']:['fire','impact','block']){const score=batchWeaponSoundPlan(p.sound[phase]);assert.ok(score);assert.deepEqual(weaponHapticPattern(p.kind,phase,p.tier),score.cue.haptic);if(phase==='fire')assert.deepEqual(score.layers,cues.find(c=>c.phase==='fire').voices);}
   assert.equal(weaponImpactHullFrame(p,s,p.impactMs+1).y,0);
  }
 }
 assert.ok(commands>1000);
});
