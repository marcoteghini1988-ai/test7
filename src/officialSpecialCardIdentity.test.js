import test from 'node:test';
import assert from 'node:assert/strict';
import {TACTICAL_SPECIALS,TACTICAL_STARTER_TYPES} from './simultaneousDuelEngine.js';
import {officialSpecialCardIdentity} from './officialSpecialCardIdentity.js';

test('Tutte le carte speciali ufficiali hanno una propria identita leggibile',()=>{
 assert.ok(Object.keys(TACTICAL_SPECIALS).length>=25);
 for(const [type,definition] of Object.entries(TACTICAL_SPECIALS)){
  const face=officialSpecialCardIdentity(type,definition);
  assert.equal(face.name,definition.name,type);
  assert.ok(face.category&&face.symbol&&face.effect,type);
  assert.ok(face.effect.length<=21,'Testo eccessivo nel fronte '+type+' '+face.effect);
  assert.ok(!/undefined|null/i.test(face.effect),type);
  assert.ok(Object.isFrozen(face));
 }
 assert.deepEqual(officialSpecialCardIdentity(null,null),
  {category:'VUOTA',symbol:'✧',effect:'',name:'SLOT VUOTO'});
});
test('Carte simili ma con effetti distinti restano riconoscibili senza aprire i dettagli',()=>{
 const pairs=[
  ['tactic-reactive','tactic-impact'],
  ['fusion-strike','fusion-twin'],
  ['support-shield-repair','support-escort-repair'],
  ['tactic-scan','tactic-counter'],
  ['tactic-bomb','tactic-malus'],
  ['tactic-vulnerability-rift','tactic-signature-mutation'],
  ['shot-corrosion','shot-ion']
 ];
 for(const [a,b] of pairs){
  assert.ok(TACTICAL_SPECIALS[a]&&TACTICAL_SPECIALS[b],a+' / '+b);
  const x=officialSpecialCardIdentity(a,TACTICAL_SPECIALS[a]);
  const y=officialSpecialCardIdentity(b,TACTICAL_SPECIALS[b]);
  assert.notEqual(x.effect,y.effect);
 }
});
test('Il profilo non crea carte, non modifica il loro tipo o la descrizione autentica',()=>{
 const starter=[...TACTICAL_STARTER_TYPES];
 assert.equal(starter.length,24);
 assert.equal(new Set(starter).size,12);
 for(const type of starter){
  const definition=TACTICAL_SPECIALS[type];
  const before=structuredClone(definition);
  const p=officialSpecialCardIdentity(type,definition);
  assert.equal(p.name,definition.name);
  assert.deepEqual(definition,before);
 }
 assert.deepEqual(starter,TACTICAL_STARTER_TYPES);
});
