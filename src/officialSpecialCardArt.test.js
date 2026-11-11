import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
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


test('82 carte ufficiali: PNG 512x768 autentici e SVG originali conservati',()=>{
 const paths=Object.keys(SPECIAL_CARD_CATALOG).map(type=>
  isBossCharacterCard(type)?BOSS_CHARACTER_CATALOG[type].imagePath:
  isPvpTerrain(type)?PVP_TERRAIN_CATALOG[type].imagePath:officialSpecialArtPath(type));
 assert.equal(paths.length,82);
 assert.equal(new Set(paths).size,82,'un fronte diverso per ciascun ID esistente');
 for(const png of paths){
  assert.match(png,/\.png$/,'non usare il vecchio SVG nella UI: '+png);
  const original=png.replace(/\.png$/,'.svg');
  const raster=readFileSync(resolve('public',png.slice(1)));
  assert.deepEqual([...raster.subarray(0,8)],[137,80,78,71,13,10,26,10],png);
  assert.equal(raster.readUInt32BE(16),512,png);
  assert.equal(raster.readUInt32BE(20),768,png);
  assert.ok(existsSync(resolve('public',original.slice(1))),
    'Il PNG non deve distruggere l SVG ufficiale: '+original);
 }
});
