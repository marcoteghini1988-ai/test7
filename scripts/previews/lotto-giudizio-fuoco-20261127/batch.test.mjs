import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewCards} from './catalog.mjs';
import {cardWords,textFields} from './card-text.mjs';
import {batchSequence,judgmentCases} from './sequence.mjs';
import {JUDGMENT_ID,judgmentFramePlan,judgmentHullPose} from './judgment-spec.mjs';
import {drawJudgmentFlight,drawJudgmentContact,judgmentOrbitSegments} from './judgment-renderer.mjs';
import {judgmentAudioCues,synthesizeJudgmentAudio} from './judgment-audio.mjs';
import {batchCases} from './sequence.mjs';
import {batchFramePlan} from './batch-spec.mjs';
import {batchAudioCues,synthesizeBatchAudio} from './batch-audio.mjs';
import {drawMagmaFlight,drawPlasmaFlight,drawFireContact,drawBurnTick,magmaFlight} from './fire-renderer.mjs';
const variants=previewCards();
test('Batch contains six real variants with independent text layers and approved playable promotion',()=>{
 assert.deepEqual(variants.map(c=>[c.kind,c.rarity]),[['judgment','Leggendaria'],['mortar','Rara'],['mortar','Epica'],['mortar','Leggendaria'],['incinerator','Epica'],['incinerator','Leggendaria']]);
 for(const c of variants)for(const lang of ['en','it']){const fields=textFields(c,lang);assert.equal(fields.length,18);assert.ok(fields.every(f=>f.size>30&&f.advance*f.size+f.spacing*(f.text.length-1)+f.stroke*2<=f.maxWidth+.001));}
 assert.equal(JSON.parse(readFileSync('src/fleetNext/approvedWeaponIntegration.json')).cards.length,58);
 assert.ok(variants.every(c=>c.frontApproved&&c.inGame));
});
test('Judgment uses target maximum HP, fires only on placement and leaves after three own turns',()=>{
 for(const s of judgmentCases().filter(s=>s.mode==='normal')){
  assert.deepEqual(s.frames.map(f=>f.event?.impacts.length||0),[1,0,0]);
  const h=s.frames[0].event.impacts[0],enemy=s.initial.sides[s.who==='A'?'B':'A'];
  const max=h.targetKind==='part'?enemy.ships[0].maxHp:enemy.escorts.find(e=>e.id===h.targetId).maxHp;
  assert.equal(h.nominalDamage,Math.round(max*.2));assert.ok(h.actualDamage>0);
  assert.equal(s.expiration.discarded,true);assert.equal(s.expiration.active,false);
  assert.ok(s.frames.every(f=>f.event?.energyConsumed===0||!f.event));
 }
});
test('Defense has one shield contact, no damage or recoil; disabled Judgment has no visible or audible shot',()=>{
 const blocked=judgmentCases().find(s=>s.mode==='defense'),h=judgmentFramePlan(blocked.frames[0],'A').hits[0];
 assert.equal(h.blocked,true);assert.equal(h.actualDamage,0);assert.deepEqual(judgmentHullPose(h,80),{dx:0,dy:0,roll:0,light:0});
 assert.deepEqual(judgmentAudioCues(blocked).map(c=>c.phase),['fire','block']);
 const disabled=judgmentCases().find(s=>s.mode==='disabled');assert.equal(judgmentFramePlan(disabled.frames[0],'A').hits.length,0);assert.equal(judgmentAudioCues(disabled).length,0);
});
test('Every Mortar rarity spends only actual Fire charges and keeps the paid-shot limit across turns',()=>{
 for(const c of variants.filter(c=>c.kind==='mortar'))for(const charges of [0,1,2,3]){
  const s=batchSequence({cardId:c.id,charges});assert.equal(s.frames[0].event.impacts.length,1+Math.min(2,charges));
  assert.equal(s.frames[1].event.impacts.length,charges===3?2:1);assert.equal(s.frames[2].event.impacts.length,1);
  assert.equal(s.frames.reduce((n,f)=>n+f.energyBefore.length-f.energyAfter.length,0),charges);
  assert.equal(s.expiration.discarded,true);
 }
});
test('Incinerator reads own discarded Strategies; five locked burn ticks survive the two-turn weapon',()=>{
 for(const c of variants.filter(c=>c.kind==='incinerator')){
  const s=batchSequence({cardId:c.id,discardedStrategies:2,turns:3});
  assert.deepEqual(s.frames.map(f=>f.event?.impacts.length||0),[1,1,0]);
  const burns=s.frames.flatMap(f=>[...f.betweenEvents,...f.events]).filter(e=>e.kind==='weapon-burn');
  assert.deepEqual(burns.map(e=>e.remainingTurns),[4,3,2,1,0]);assert.ok(burns.every(e=>e.actualDamage===burns[0].actualDamage));
  assert.equal(c.burn.burnPerDiscard,c.executedLegacyProfile.burnPerDiscard);
  assert.equal(c.burn.burnMaxDamage,c.executedLegacyProfile.burnMaxDamage);
  const shield=batchSequence({cardId:c.id,mode:'defense',turns:3});assert.equal(shield.frames.flatMap(f=>[...f.betweenEvents,...f.events]).filter(e=>e.kind==='weapon-burn').length,0);
  assert.equal(cardWords(c).values[10],c.damage+' / '+c.second+' HP');assert.ok(c.second<c.damage);
 }
});
test('Three 3D electrical rings remain decorative and render finite coordinates on both sides',()=>{
 const segments=judgmentOrbitSegments({x:225,y:250},40,1500,.4);assert.deepEqual([...new Set(segments.map(s=>s.ring))].sort(),[0,1,2]);
 let depth=0,count=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createRadialGradient(){return gradient;}},{get(o,k){return k in o?o[k]:(...args)=>{count++;for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const s of judgmentCases())for(const h of judgmentFramePlan(s.frames[0],s.who).hits)for(const age of [-5,0,400,1300,1800,1950,2100]){
  drawJudgmentFlight(ctx,h,age,{x:225,y:234});drawJudgmentContact(ctx,h,age/2,{x:225,y:234});
 }
 assert.equal(depth,0);assert.ok(count>10000);
});
test('One impact sound per real hit; the generated stereo waveform has no clipped or non-finite samples',()=>{
 const s=batchSequence({cardId:JUDGMENT_ID}),cues=judgmentAudioCues(s);assert.deepEqual(cues.map(c=>c.phase),['fire','alignment','impact']);
 const audio=synthesizeJudgmentAudio(cues,4.25,{sampleRate:16000});let peak=0;
 for(const channel of audio.channels)for(const v of channel){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));}
 assert.ok(peak>.05&&peak<1);assert.equal(audio.channels.length,2);
});
test('Fire effects follow all real hits, blocked contacts, paid charges and five burn ticks without adding any',()=>{
 for(const s of batchCases().filter(s=>s.kind!=='judgment')){
  const cues=batchAudioCues(s),plans=s.frames.map(f=>batchFramePlan(f,s));
  assert.equal(cues.filter(c=>['impact','block','contact'].includes(c.phase)).length,plans.reduce((n,p)=>n+p.hits.length,0));
  assert.equal(cues.filter(c=>c.phase==='burn').length,plans.reduce((n,p)=>n+p.burns.length,0));
  assert.ok(plans.every(p=>p.energySpent<=2));
  for(const p of plans)for(const h of p.hits)if(s.kind==='mortar'){
   const to={x:225,y:s.who==='A'?234:546},v=magmaFlight(h,h.flightMs,to);assert.equal(v.point.x,to.x);assert.ok(Math.abs(v.point.y-to.y)<.00001);
  }
 }
});
test('Fire rendering and every rarity sound are finite; three-dimensional magma texture uses balanced Canvas state',()=>{
 let depth=0,count=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createRadialGradient(){return gradient;}},{get(o,k){return k in o?o[k]:(...args)=>{count++;for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const c of variants.filter(c=>c.kind!=='judgment')){
  const s=batchSequence({cardId:c.id,charges:c.kind==='mortar'?2:0}),p=batchFramePlan(s.frames[0],s);
  for(const h of p.hits)for(const age of [-10,0,400,900,1400,1600,1850]){
   drawMagmaFlight(ctx,h,age,{x:225,y:234});drawMagmaFlight(ctx,h,age,{x:225,y:234},{texture:{}});drawPlasmaFlight(ctx,h,age,{x:225,y:234});drawFireContact(ctx,h,age/2,{x:225,y:234});drawBurnTick(ctx,{x:225,y:234},age/2,h.tier);
  }
  const audio=synthesizeBatchAudio(batchAudioCues({...s,frames:s.frames.slice(0,1)}),5.2,{sampleRate:8000});
  for(const channel of audio.channels)for(const v of channel)assert.ok(Number.isFinite(v)&&Math.abs(v)<1);
 }
 assert.equal(depth,0);assert.ok(count>10000);
});
