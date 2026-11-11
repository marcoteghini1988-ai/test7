import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';
import {BOSS_CHARACTER_CATALOG} from './bossCharacterCards.js';
import {PVP_TERRAIN_CATALOG} from './pvpTerrainCards.js';
import {officialSpecialVisualMeta} from './officialSpecialVisualMeta.js';

test('Tutte le carte reali hanno ruolo riconoscibile senza creare carte',()=>{
 const ids=Object.keys(SPECIAL_CARD_CATALOG);
 assert.equal(ids.length,82);
 for(const type of ids){
  const face=officialSpecialVisualMeta(type);
  assert.ok(face&&face.role&&face.type===type,type);
  assert.equal(Object.isFrozen(face),true,type);
 }
 assert.equal(officialSpecialVisualMeta('non-esistente'),null);
 assert.equal(officialSpecialVisualMeta('tactic-counter').role,'REAZIONE');
 assert.equal(officialSpecialVisualMeta('tactic-kinetic').role,'ATTACCO');
 assert.equal(officialSpecialVisualMeta('tactic-reactive').role,'DIFESA');
 for(const type of Object.keys(BOSS_CHARACTER_CATALOG)){
  assert.equal(officialSpecialVisualMeta(type).role,'PERSONAGGIO');
  assert.equal(officialSpecialVisualMeta(type).limited,'BOSS');
 }
 for(const type of Object.keys(PVP_TERRAIN_CATALOG))
  assert.equal(officialSpecialVisualMeta(type).role,'TERRENO');
});
test('Rarita: segnala solo i sei epici e non inventa tier sulle altre',()=>{
 const ids=Object.keys(TACTICAL_EPIC_CARDS);
 assert.equal(ids.length,6);
 for(const type of ids)assert.equal(officialSpecialVisualMeta(type).rarity,'EPICA');
 for(const type of ['tactic-kinetic','tactic-counter','fusion-strike',
  ...Object.keys(BOSS_CHARACTER_CATALOG)]){
  assert.equal(officialSpecialVisualMeta(type).rarity,null,
   type+' senza rarita ufficialmente codificata');
 }
});
test('Arte e indicatori PNG integrati nelle 5 carte e nella schermata Mazzi',async()=>{
 const {readFileSync}=await import('node:fs');
 const live=readFileSync(new URL('./OfficialLiveBattle3D.jsx',import.meta.url),'utf8');
 const deck=readFileSync(new URL('./SpecialDeckPanel.jsx',import.meta.url),'utf8');
 assert.match(live,/officialSpecialVisualMeta\(card\.type\)/);
 assert.match(live,/live-card-rarity/);
 assert.match(deck,/officialSpecialVisualMeta\(type\)/);
 assert.match(deck,/special-deck-visual-tags/);
});
