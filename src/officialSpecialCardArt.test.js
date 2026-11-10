import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {BOSS_CHARACTER_CATALOG,isBossCharacterCard} from './bossCharacterCards.js';
import {PVP_TERRAIN_CATALOG,isPvpTerrain} from './pvpTerrainCards.js';
import {OFFICIAL_SPECIAL_ART_TYPES,officialSpecialArtPath} from './officialSpecialCardArt.js';

test('Ogni Carta Speciale collezionabile ha un file immagine effettivo sul disco',()=>{
 const all=Object.keys(SPECIAL_CARD_CATALOG);
 assert.ok(all.length>=80);
 const found=new Set();
 for(const type of all){
  const path=isBossCharacterCard(type)?BOSS_CHARACTER_CATALOG[type].imagePath:
   isPvpTerrain(type)?PVP_TERRAIN_CATALOG[type].imagePath:officialSpecialArtPath(type);
  assert.ok(path,'Illustrazione assente per '+type);
  assert.ok(path.startsWith('/assets/'),'Percorso non autorizzato '+type);
  assert.ok(existsSync(resolve('public',path.slice(1))),'File inesistente: '+path);
  found.add(type);
 }
 assert.equal(found.size,all.length);
 assert.equal(OFFICIAL_SPECIAL_ART_TYPES.length,66);
});
