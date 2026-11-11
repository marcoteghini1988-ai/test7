import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {inflateSync} from 'node:zlib';
import {BOSS_NUMERIC_DECKS} from './bossNumericDecks.js';
import {OFFICIAL_NUMERIC_BACK_IDS,OFFICIAL_SPECIAL_FIXED_BACK,
 officialNumericDeckBackPath,officialNumericDeckBackName} from './officialDeckBackArt.js';

function checkedPng(path){
 assert.ok(path.startsWith('/assets/deck-backs/'));
 const disk=resolve('public',path.slice(1));
 assert.ok(existsSync(disk),'Asset PNG inesistente: '+path);
 const bytes=readFileSync(disk),sig=[137,80,78,71,13,10,26,10];
 assert.deepEqual([...bytes.subarray(0,8)],sig,'firma PNG: '+path);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 assert.ok(width>=320&&height>=480,'Dorso troppo piccolo: '+path);
 assert.equal(bytes[24],8,'Palette 8bit');
 assert.equal(bytes[25],3,'Tipo PNG indicizzato');
 // Un file col solo header non basta: i pixel reali devono decomprimersi.
 let offset=8,payload=[];
 while(offset<bytes.length){
  const size=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
  const value=bytes.subarray(offset+8,offset+8+size);
  if(type==='IDAT')payload.push(value);
  offset+=size+12;
  if(type==='IEND')break;
 }
 const pixels=inflateSync(Buffer.concat(payload));
 assert.equal(pixels.length,(width+1)*height);
 assert.equal(pixels[0],0,'Scansione PNG non filtrata');
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
test('Mazzo speciale: uno ed un solo dorso PNG fisso',()=>{
 checkedPng(OFFICIAL_SPECIAL_FIXED_BACK);
 assert.ok(!OFFICIAL_NUMERIC_BACK_IDS.some(x=>
  officialNumericDeckBackPath(x)===OFFICIAL_SPECIAL_FIXED_BACK));
});
test('Schermata LIVE e Home mostrano l equipaggiamento senza inventare slot',()=>{
 const live=readFileSync(resolve('src/OfficialLiveBattle3D.jsx'),'utf8');
 const home=readFileSync(resolve('src/HomeScreen.jsx'),'utf8');
 const css=readFileSync(resolve('src/OfficialLiveBattle3D.css'),'utf8');
 assert.match(live,/player\.bossNumericDeck\?\.id/);
 assert.match(live,/officialNumericDeckBackPath\(numericBackId\)/);
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
