import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stormSequence,stormCases} from '../scripts/previews/condensatore-tempesta-20261127/sequence.mjs';
import {previewCards} from '../scripts/previews/condensatore-tempesta-20261127/prepare-cards.mjs';
import {stormFramePlan,stormHullPose,stormTimeline,STORM_CAPACITOR_FAMILY} from './stormCapacitorSpec.js';
import {drawStormCloud,drawStormContact,drawStormContributor} from './stormCapacitorRenderer.js';
import {stormAudioCues} from './stormCapacitorAudio.js';
import {textFields} from './stormCapacitorCardText.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {stormCapacitorNominal} from './fleetNext/stormCapacitorNominals.js';
import {stormFormation} from '../scripts/previews/condensatore-tempesta-20261127/visuals.mjs';
test('Storm: destroying the first support preserves the second support position and the arrival point',()=>{
 const side={ships:[{id:'mother',hp:100}],escorts:[{id:'first',hp:0,destroyed:true},{id:'second',hp:100,destroyed:false}]};
 for(const who of ['A','B']){const rows=stormFormation(side,who),r=rows.find(r=>r.unit.id==='second');
  assert.equal(r.i,1);assert.deepEqual(r.position,{x:325,y:who==='A'?474:316});assert.equal(rows.length,2);}
});
test('Storm: both actual rarities and sides fire once per own turn for three turns, then expire',()=>{
 for(const rarity of ['Epica','Leggendaria'])for(const who of ['A','B']){
  const s=stormSequence({rarity,who});assert.deepEqual(s.frames.map(f=>f.plan.hits.length),[1,1,1]);
  assert.deepEqual(s.frames.map(f=>f.plan.energySpent),[1,1,1]);assert.equal(s.expiration.discarded,true);assert.equal(s.expiration.active,false);
  assert.ok(s.frames.every(f=>f.plan.hits[0].who===who));
 }
});
test('Storm: only physically living allied supports contribute; no HP is sacrificed',()=>{
 for(const supportCount of [0,1,2]){
  const s=stormSequence({supportCount});for(const f of s.frames){
   assert.equal(f.event.supportCount,supportCount);assert.equal(f.event.contributingSupportIds.length,supportCount);
   for(const before of f.initial.sides.A.escorts)assert.equal(f.battle.sides.A.escorts.find(e=>e.id===before.id).hp,before.hp);
   assert.equal(f.battle.sides.A.ships[0].hp,f.initial.sides.A.ships[0].hp);
   const m=f.battle.sides.A.machines.find(m=>m.sourceCardId===s.cardId);
   assert.equal(f.event.impacts[0].nominalDamage,stormCapacitorNominal(f.battle.sides.A,m,supportCount));
  }
 }
});
test('Storm: old Energy cannot fire; skipping the middle charge allows the third shot without extending duration',()=>{
 for(const mode of ['old-only','missing']){
  const s=stormSequence({mode});assert.deepEqual(s.frames.map(f=>f.plan.hits.length),[0,0,0]);
  assert.equal(s.frames.reduce((n,f)=>n+f.plan.energySpent,0),0);assert.equal(s.expiration.discarded,true);
 }
 const s=stormSequence({mode:'skip-middle'});assert.deepEqual(s.frames.map(f=>f.plan.hits.length),[1,0,1]);assert.equal(stormTimeline(s).duration,14100);
});
test('Storm: one fresh charge cannot fund two weapons; metadata names the physical card that actually pays',()=>{
 const id=STORM_CAPACITOR_FAMILY,b=createMaglioReviewBattle({cardId:id,nowMs:0});
 b.sides.A.hand=['energy-ionic',id,id];b.sides.A.energyPile=['energy-ionic'];b.sides.A.elementalCharges={ionic:1};
 const r=resolvePreparedFleetTurn(b,'A',{cards:[0,1,2],pass:true},1000);assert.ok(r.ok,r.reason);
 const e=r.events.filter(e=>e.kind==='weapon-provisional-shot'&&e.cardId===id);assert.deepEqual(e.map(e=>e.hitCount),[1,0]);
 assert.deepEqual(e[0].energyContributions,[{cardId:'energy-ionic',pileIndex:0,beforeCharges:1,afterCharges:0,consumed:1,discarded:true}]);
 assert.equal(r.battle.sides.A.elementalCharges.ionic,1);assert.equal(e[1].energySpent,undefined);
});
test('Storm: Defense produces one shield contact, zero damage and zero damage recoil; disabled shots are not rendered',()=>{
 const s=stormSequence({mode:'defense'});for(const f of s.frames){const h=f.plan.hits[0];assert.ok(h.blocked);assert.equal(h.actualDamage,0);assert.deepEqual(stormHullPose(h,80),{dx:0,dy:0,roll:0,light:0});}
 const blocked=stormSequence({mode:'disabled'});assert.ok(blocked.frames.every(f=>stormFramePlan(f,blocked.rarity,blocked.who).hits.length===0));
 assert.ok(blocked.frames.every(f=>f.plan.energySpent===1),'Preserve the current engine: a disabled attempt still spends its charge.');
});
test('Storm: localized card fields use official print candidates; the two approved fronts are now promoted without changing the other 50',()=>{
 const cards=previewCards();assert.deepEqual(cards.map(c=>[c.rarity,c.damage,c.bonus]),[['Epica',31,14],['Leggendaria',43,19]]);
 for(const c of cards)for(const l of ['en','it']){const fields=textFields(c,l);assert.equal(fields.length,18);assert.ok(fields.every(f=>f.size>30&&f.advance*f.size+f.spacing*(f.text.length-1)+f.stroke*2<=f.maxWidth+.001));}
 const live=JSON.parse(readFileSync('src/fleetNext/approvedWeaponIntegration.json'));assert.equal(live.cards.length,52);assert.equal(live.cards.filter(c=>c.id.startsWith(STORM_CAPACITOR_FAMILY)).length,2);
});
test('Storm: finite cloud rendering balances Canvas state; audio and haptics contain exactly the actual contacts',()=>{
 let depth=0,count=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createRadialGradient(){return gradient;}},{get(o,k){return k in o?o[k]:(...args)=>{count++;for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const s of stormCases()){
  const cues=stormAudioCues(s),hits=s.frames.flatMap(f=>f.plan.hits);
  assert.equal(cues.filter(c=>['impact','block','contact'].includes(c.phase)).length,hits.length);
  for(const h of hits)for(const age of [0,400,900,1500]){drawStormCloud(ctx,h,age,{x:225,y:260});drawStormContact(ctx,h,age,{x:225,y:260});drawStormContributor(ctx,{x:100,y:400},age);}
 }
 assert.equal(depth,0);assert.ok(count>1000);
});
