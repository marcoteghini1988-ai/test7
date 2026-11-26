import test from 'node:test';
import assert from 'node:assert/strict';
import {coreReviewSequence,RARITIES} from './sequence.mjs';
import {coreCuePlan} from './audio.mjs';
import {coreOrigin,TIMING} from './visuals.mjs';
import {coreScenicPose} from './scenic-core.mjs';
import {createProjectileCamera,boardPointToWorld} from '../../../src/maglioProjectile3D.js';
test('Tre rarità: crescita reale, una carica per ricarica e scadenza negli scarti',()=>{
 for(const rarity of RARITIES){const s=coreReviewSequence({rarity});
  assert.deepEqual(s.frames.map(f=>f.currentStage),[1,2,3]);
  assert.deepEqual(s.frames.map(f=>f.energySpent),[0,1,1]);
  assert.ok(s.frames.every(f=>f.event.hitCount===1&&f.actualDamage===f.event.impacts[0].actualDamage));
  assert.ok(s.frames[2].actualDamage>s.frames[1].actualDamage&&s.frames[1].actualDamage>s.frames[0].actualDamage);
  assert.equal(s.expires,true);
 }
});
test('Senza Energia nuova la crescita si perde; una nuova Energia tardiva rimane in pila',()=>{
 const broken=coreReviewSequence({rarity:'Epica',mode:'broken'});
 assert.deepEqual(broken.frames.map(f=>f.currentStage),[1,1,1]);
 assert.deepEqual(broken.frames.map(f=>f.energySpent),[0,0,0]);
 assert.equal(broken.frames[2].freshEnergy,1);assert.equal(broken.frames[2].energyAfter,1);
 assert.equal(coreCuePlan(broken.frames[2]).some(c=>c.phase==='energy-spent'),false);
 const old=coreReviewSequence({mode:'old-only'});
 assert.deepEqual(old.frames.map(f=>f.energyAfter),[2,2,2]);
 assert.deepEqual(old.frames.map(f=>f.currentStage),[1,1,1]);
});
test('Difesa e lati: nessun danno fittizio e origini soltanto dal bordo pertinente',()=>{
 const blocked=coreReviewSequence({mode:'blocked',supports:true,turns:1}).frames[0];
 assert.equal(blocked.blocked,true);assert.equal(blocked.actualDamage,0);
 assert.equal(coreCuePlan(blocked).filter(c=>c.phase==='impact').length,0);
 assert.equal(coreCuePlan(blocked).filter(c=>c.phase==='block').length,1);
 const a=coreReviewSequence().frames,b=coreReviewSequence({who:'B',turns:1}).frames[0];
 assert.ok(a.every(f=>coreOrigin(f).y>800));assert.ok(coreOrigin(b).y<0);
 assert.equal(new Set(a.map(f=>coreOrigin(f).x)).size,3);
});
test('Audio e aptica hanno un solo contatto sincronizzato per colpo',()=>{
 for(const f of coreReviewSequence().frames){const cues=coreCuePlan(f),impact=cues.filter(c=>c.phase==='impact');
  assert.equal(impact.length,1);assert.equal(impact[0].at,(TIMING.charge+TIMING.flight)/1000);
  assert.ok(impact[0].haptic.length);assert.equal(cues.filter(c=>c.phase==='energy-spent').length,f.recharge?1:0);
 }
});
test('Nodo scenico: prospettiva A/B e arrivo esatto sul bersaglio, senza salto di quota',()=>{
 const camera=createProjectileCamera();
 for(const who of ['A','B'])for(const f of coreReviewSequence({who}).frames){
  const from=coreOrigin(f),to={x:225,y:who==='A'?263:570};
  const first=coreScenicPose(f,0,from,to,TIMING.flight),last=coreScenicPose(f,TIMING.flight,from,to,TIMING.flight);
  assert.ok(first.point.distanceTo(boardPointToWorld(from,camera))<1e-8);
  assert.ok(last.point.distanceTo(boardPointToWorld(to,camera))<1e-8);
  assert.equal(first.compression,0);assert.ok(Math.abs(last.compression-1)<1e-8);
  const before=coreScenicPose(f,TIMING.flight*.9,from,to,TIMING.flight);
  assert.ok(before.compression>0&&before.compression<1);
 }
});
