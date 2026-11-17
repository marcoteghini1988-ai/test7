import test from 'node:test';
import assert from 'node:assert/strict';
import {
 NEXT_COMMON_CARDS,NEXT_COMMON_CARD_BY_ID,
 NEXT_COMMON_CARD_COUNT,nextCommonCard
} from './fleetNext/newCardRegistry.js';

test('Il registro nuovo contiene esattamente 32 carte sistemi e Buco Nero',()=>{
 assert.equal(NEXT_COMMON_CARD_COUNT,33);
 assert.equal(new Set(NEXT_COMMON_CARDS.map(c=>c.id)).size,33);
 assert.equal(NEXT_COMMON_CARDS.filter(c=>c.effectSpec.type==='systemModifier').length,32);
 for(const component of ['command','weapons','generator','bridge']){
  const group=NEXT_COMMON_CARDS.filter(c=>c.systemId===component);
  assert.equal(group.length,8,component);
  assert.equal(group.filter(c=>c.effectSpec.operation==='disable').length,4);
  assert.equal(group.filter(c=>c.effectSpec.operation==='amplify').length,4);
  assert.deepEqual(new Set(group.map(c=>c.rarita)),new Set(['Comune','Rara','Epica','Leggendaria']));
 }
});

test('Il Buco Nero consente tre copie e non cancella le navicelle',()=>{
 const blackHole=nextCommonCard('sys-black-hole');
 assert.ok(blackHole);
 assert.equal(blackHole.maxCopiesPerDeck,3);
 assert.equal(blackHole.effectSpec.scope,'both');
 assert.ok(blackHole.effectSpec.includes.includes('temporaryWeapons'));
 assert.ok(blackHole.effectSpec.includes.includes('terrain'));
 assert.ok(blackHole.effectSpec.excludes.includes('mother'));
 assert.ok(blackHole.effectSpec.excludes.includes('escorts'));
 assert.ok(blackHole.effectSpec.excludes.includes('hp'));
});

test('Le 33 schede sono riconosciute e disponibili per il ruleset HP',()=>{
 for(const c of NEXT_COMMON_CARDS){
  assert.equal(c.playable,true,c.id);
  assert.ok(['systemModifier','fieldReset'].includes(c.effectSpec.type),c.id);
  assert.equal(NEXT_COMMON_CARD_BY_ID[c.id],c);
  assert.ok(c.name.length>0);
  assert.ok(c.effectProposed.length>0);
 }
});
