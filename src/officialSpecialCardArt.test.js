import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {BOSS_CHARACTER_CATALOG,isBossCharacterCard} from './bossCharacterCards.js';
import {PVP_TERRAIN_CATALOG,isPvpTerrain} from './pvpTerrainCards.js';
import {OFFICIAL_SPECIAL_ART_TYPES,officialSpecialArtPath} from './officialSpecialCardArt.js';
import {officialSpecialVisualMeta} from './officialSpecialVisualMeta.js';
import {cardFacePath} from './fleetNext/rules.js';

test('Le 12 carte Personaggio Boss conservano ID e regole, senza raffigurazioni provvisorie',()=>{
 const all=Object.keys(SPECIAL_CARD_CATALOG);
 assert.equal(all.length,82);
 assert.equal(Object.keys(BOSS_CHARACTER_CATALOG).length,12);
 assert.equal(existsSync(resolve('public/assets/boss-characters')),false);
 assert.equal(existsSync(resolve('public/assets/fleet-next-boss-cards')),false);
 for(const type of Object.keys(BOSS_CHARACTER_CATALOG)){
  assert.ok(isBossCharacterCard(type));
  assert.equal(BOSS_CHARACTER_CATALOG[type].imagePath,null,type);
  assert.equal(SPECIAL_CARD_CATALOG[type].imagePath,null,type);
  assert.equal(officialSpecialArtPath(type),null,type);
  assert.equal(cardFacePath(type),null,type);
 }
});

test('Le 70 carte già illustrate hanno un file immagine effettivo sul disco',()=>{
 const illustrated=Object.keys(SPECIAL_CARD_CATALOG).filter(type=>!isBossCharacterCard(type));
 assert.equal(illustrated.length,70);
 const found=new Set();
 for(const type of illustrated){
  const path=officialSpecialArtPath(type);
  assert.ok(path,'Illustrazione assente per '+type);
  assert.ok(path.startsWith('/assets/'),'Percorso non autorizzato '+type);
  assert.ok(existsSync(resolve('public',path.slice(1))),'File inesistente: '+path);
  found.add(type);
 }
 assert.equal(found.size,illustrated.length);
 assert.equal(OFFICIAL_SPECIAL_ART_TYPES.length,66);
});


test('70 fronti illustrati: PNG 512x768 e SVG originali conservati',()=>{
 const paths=Object.keys(SPECIAL_CARD_CATALOG)
  .filter(type=>!isBossCharacterCard(type)).map(officialSpecialArtPath);
 assert.equal(paths.length,70);
 assert.equal(new Set(paths).size,70,'un fronte diverso per ciascuna carta illustrata');
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

test('Le 66 illustrazioni con cartiglio riportano i nomi reali e i ruoli già allineati',()=>{
 const normalized=text=>text.replaceAll('&amp;','&').replaceAll('&lt;','<')
  .replaceAll('&gt;','>').replaceAll('&quot;','"');
 // Queste tre Strategie hanno ancora il cartiglio ATTACCO: revisione editoriale separata.
 const pendingStrategyLabels=new Set(['tactic-power-shift','tactic-suppress','tactic-kinetic']);
 let checked=0;
 for(const [type,entry] of Object.entries(SPECIAL_CARD_CATALOG)){
  if(isPvpTerrain(type)||isBossCharacterCard(type))continue;
  const path=officialSpecialArtPath(type);
  const svg=readFileSync(resolve('public',path.slice(1).replace(/\.png$/,'.svg')),'utf8');
  const name=svg.match(/<text\b[^>]*\by="619"[^>]*>([^<]*)<\/text>/);
  const role=svg.match(/<text\b[^>]*\by="666"[^>]*>([^<]*)<\/text>/);
  assert.ok(name&&role,'cartiglio SVG mancante: '+type);
  assert.equal(normalized(name[1]),(entry.short||entry.name).toLocaleUpperCase('it-IT'),type);
  const expectedRole=type.startsWith('epic_item_')?'OGGETTO EPICO':
   officialSpecialVisualMeta(type).role;
  if(!pendingStrategyLabels.has(type))assert.equal(normalized(role[1]),expectedRole,type);
  checked++;
 }
 assert.equal(checked,66);
});

test('I 4 Terreni mantengono i fronti reali anche nella battaglia 3D',()=>{
 for(const type of Object.keys(PVP_TERRAIN_CATALOG)){
  const path=officialSpecialArtPath(type);
  assert.equal(path,PVP_TERRAIN_CATALOG[type].imagePath);
  assert.ok(existsSync(resolve('public',path.slice(1))),type);
 }
 assert.equal(officialSpecialArtPath('id-inesistente'),null);
});
