import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {inflateSync} from 'node:zlib';
import {BOSS_NUMERIC_DECKS} from './bossNumericDecks.js';
import {OFFICIAL_NUMERIC_BACK_IDS,OFFICIAL_SPECIAL_FIXED_BACK,
 officialNumericDeckBackPath,officialNumericDeckStackPath,
 officialNumericDeckBackName} from './officialDeckBackArt.js';

function checkedPng(path,{stack=false}={}){
 assert.ok(path.startsWith(stack?'/assets/deck-stacks/numeric/':'/assets/deck-backs/'));
 const disk=resolve('public',path.slice(1));
 assert.ok(existsSync(disk),'Asset PNG inesistente: '+path);
 const bytes=readFileSync(disk),sig=[137,80,78,71,13,10,26,10];
 assert.deepEqual([...bytes.subarray(0,8)],sig,'firma PNG: '+path);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(stack)assert.deepEqual([width,height],[768,768],'Risoluzione della pila: '+path);
 else assert.ok(width>=320&&height>=480,'Dorso troppo piccolo: '+path);
 assert.equal(bytes[24],8,'Palette 8bit');
 assert.equal(bytes[25],3,'Tipo PNG indicizzato');
 // Un file col solo header non basta: i pixel reali devono decomprimersi.
 let offset=8,payload=[],hasTransparency=false;
 while(offset<bytes.length){
  const size=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
  const value=bytes.subarray(offset+8,offset+8+size);
  if(type==='IDAT')payload.push(value);
  if(type==='tRNS')hasTransparency=value.includes(0);
  offset+=size+12;
  if(type==='IEND')break;
 }
 const pixels=inflateSync(Buffer.concat(payload));
 assert.equal(pixels.length,(width+1)*height);
 if(stack)assert.ok(hasTransparency,'Sfondo trasparente della pila: '+path);
 else assert.equal(pixels[0],0,'Scansione PNG non filtrata');
 return {width,height};
}
test('Dorsi veri: ogni mazzo boss possiede il proprio PNG e quello neutro esiste',()=>{
 const deckIds=Object.keys(BOSS_NUMERIC_DECKS);
 assert.equal(deckIds.length,12);
 assert.deepEqual(new Set(OFFICIAL_NUMERIC_BACK_IDS),new Set(['neutral_starter',...deckIds]));
 const paths=new Set();
 for(const id of OFFICIAL_NUMERIC_BACK_IDS){
  const path=officialNumericDeckBackPath(id);
  assert.equal(path,'/assets/deck-backs/'+id+'.png');
  assert.ok(!paths.has(path),'non riutilizzare il dorso generico');
  paths.add(path);
  checkedPng(path);
  assert.ok(officialNumericDeckBackName(id).length>0);
 }
 assert.equal(paths.size,13);
 assert.equal(officialNumericDeckBackPath('non-posseduto'),
  officialNumericDeckBackPath('neutral_starter'));
});
test('Pile 3D in alta risoluzione per tutti i mazzi numerici ufficiali',()=>{
 for(const id of OFFICIAL_NUMERIC_BACK_IDS){
  const path=officialNumericDeckStackPath(id);
  assert.equal(path,'/assets/deck-stacks/numeric/'+id+'.png');
  checkedPng(path,{stack:true});
 }
 assert.equal(officialNumericDeckStackPath('non-posseduto'),
  officialNumericDeckStackPath('neutral_starter'));
 const remoteAssets='https://raw.githubusercontent.com/marcoteghini1988-ai/test7/main/public/assets';
 assert.equal(officialNumericDeckStackPath('planet_char_1',remoteAssets),
  remoteAssets+'/deck-stacks/numeric/planet_char_1.png');
});
test('Mazzo speciale: uno ed un solo dorso PNG fisso',()=>{
 checkedPng(OFFICIAL_SPECIAL_FIXED_BACK);
 assert.ok(!OFFICIAL_NUMERIC_BACK_IDS.some(x=>
  officialNumericDeckBackPath(x)===OFFICIAL_SPECIAL_FIXED_BACK));
});
test('Le plance e la Home mostrano il mazzo equipaggiato',()=>{
 const live=readFileSync(resolve('src/OfficialLiveBattle3D.jsx'),'utf8');
 const fallback=readFileSync(resolve('src/BossBattle3D.jsx'),'utf8');
 const home=readFileSync(resolve('src/HomeScreen.jsx'),'utf8');
 const css=readFileSync(resolve('src/OfficialLiveBattle3D.css'),'utf8');
 assert.match(live,/player\.bossNumericDeck\?\.id/);
 assert.match(live,/officialNumericDeckStackPath\(numericBackId,ASSET_ROOT\)/);
 assert.match(live,/className="live-deck-stack deck-stack-art" src=\{numericStackPath\}/);
 assert.match(fallback,/game\.player\.bossNumericDeck\?\.id/);
 assert.match(fallback,/className="deck-stack-art" src=\{officialNumericDeckStackPath\(numericDeckId,ASSET_ROOT\)\}/);
 assert.match(live,/OFFICIAL_SPECIAL_FIXED_BACK/);
 assert.match(live,/data-special-back="fixed"/);
 assert.match(live,/--live-special-back/);
 assert.match(css,/\.live-slot--covered\{/);
 assert.match(css,/background-image:var\(--live-special-back\)/,
  'le carte speciali nascoste devono condividere il dorso unico');
 for(const [kind,tag] of [['character','personaggio'],['difesa','difesa'],['attacco','attacco-supporto']]){
  assert.ok(live.includes(tag),kind);
  assert.ok(css.includes('data-slot-role="'+tag+'"'),kind);
 }
 assert.match(home,/officialNumericDeckBackPath\(selectedDeck\)/);
 assert.match(home,/className="home-deck-hd"/);
 assert.ok(!home.includes("homePng('cards/es_common_medium_01_card')"),
  'La Home non deve riusare la vecchia Carta Arma come decorazione Shop');
});
