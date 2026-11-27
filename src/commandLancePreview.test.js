import test from 'node:test';
import assert from 'node:assert/strict';
import {lanceCases,lanceSequence} from '../scripts/previews/lancia-comando-20261127/sequence.mjs';
import {previewCards} from '../scripts/previews/lancia-comando-20261127/prepare-cards.mjs';
import {commandLanceTimeline,commandLanceHullPose} from './commandLanceSpec.js';
import {commandLanceFlight} from './commandLanceRenderer.js';
import {commandLanceCues,synthesizeCommandLanceAudio} from './commandLanceAudio.js';
import {textFields,cardWords} from './commandLanceCardText.js';
test('three catalog variants, complete totals and external EN/IT fields fit the original layout',()=>{
 const cards=previewCards();assert.deepEqual(cards.map(c=>c.damage+c.bonus),[38,92,127]);
 for(const c of cards)for(const locale of ['en','it']){
  assert.equal(textFields(c,locale).length,17);assert.ok(cardWords(c,locale).description.includes(String(c.damage+c.bonus)));
  for(const f of textFields(c,locale))assert.ok(f.advance*f.size+f.stroke*2+f.spacing*(f.text.length-1)<=f.maxWidth+.001);
 }
});
test('each rarity and both sides emit exactly the one real contact and preserve its damage',()=>{
 for(const s of lanceCases().filter(s=>s.mode==='active')){
  const p=commandLanceTimeline(s);assert.equal(p.hits.length,1);assert.equal(p.hits[0].actualDamage,s.frames[0].event.actualDamage);assert.ok(p.hits[0].actualDamage>0);
  assert.equal(p.hits[0].targetId,s.frames[0].event.impacts[0].targetId);
  assert.equal(s.initial.sides[s.who].energyPile.length,0);
 }
});
test('an absent or expired Character produces neither a projectile nor audio or haptics',()=>{
 for(const mode of ['missing','expired']){const s=lanceSequence({mode});assert.equal(s.played,false);assert.equal(commandLanceTimeline(s).hits.length,0);assert.deepEqual(commandLanceCues(s),[]);}
});
test('weapon disabled before resolution cannot turn zero-damage diagnostic records into a launch',()=>{
 const s=lanceSequence({mode:'disabled'});assert.equal(s.frames[0].event.actualDamage,0);assert.equal(commandLanceTimeline(s).hits.length,0);assert.deepEqual(commandLanceCues(s),[]);
});
test('a Character played in the same turn enables the real lance',()=>{
 const s=lanceSequence({mode:'same-turn'});assert.ok(s.accepted&&s.played);assert.equal(commandLanceTimeline(s).hits.length,1);
});
test('Defense blocks on both sides: one shield contact, zero hull recoil and no damage cue',()=>{
 for(const who of ['A','B']){
  const s=lanceSequence({mode:'defense',who,supports:who==='B'}),h=commandLanceTimeline(s).hits[0];
  assert.ok(h.blocked);assert.equal(h.actualDamage,0);assert.equal(commandLanceHullPose(h,80).dy,0);
  assert.equal(commandLanceCues(s).at(-1).phase,'block');
 }
});
test('the leading tip reaches the same measured target from either edge; near projectiles are larger',()=>{
 for(const who of ['A','B']){
  const h=commandLanceTimeline(lanceSequence({who})).hits[0],target={x:225,y:who==='A'?253:557};
  assert.deepEqual(commandLanceFlight(h,h.flightMs,target).point,target);
  assert.ok(commandLanceFlight({...h,originY:840},0,target).scale>commandLanceFlight({...h,originY:-40},0,target).scale);
 }
});
test('stereo audio and haptics share exact signal, launch and contact times; PCM is finite and unclipped',()=>{
 const s=lanceSequence({rarity:'Leggendaria'}),p=commandLanceTimeline(s),cues=commandLanceCues(s);
 assert.deepEqual(cues.map(c=>c.at),[p.signal.at/1000,p.hits[0].launchAt/1000,p.hits[0].impactAt/1000]);
 const audio=synthesizeCommandLanceAudio(cues,4.2,{sampleRate:12000});
 assert.equal(audio.channels.length,2);for(const ch of audio.channels)for(const x of ch)assert.ok(Number.isFinite(x)&&Math.abs(x)<1);
 assert.equal(commandLanceHullPose(p.hits[0],80,true).dy,0);assert.equal(commandLanceHullPose(p.hits[0],1001).dy,0);
});
