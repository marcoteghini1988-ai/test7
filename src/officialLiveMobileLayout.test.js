// Verifiche strutturali della plancia LIVE effettivamente montata da MathDuelBattle.
// Non sostituiscono un test browser/mobile: impediscono regressioni delle geometrie
// e dei controlli nel renderer che i giocatori aprono realmente.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIVE_TURN_MS,LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT}
 from './officialLiveDuelEngine.js';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const ui=read('./OfficialLiveBattle3D.jsx');
const css=read('./OfficialLiveBattle3D.css');
const base=read('./MathDuelBattle.css');
const entry=read('./MathDuelBattle.jsx');

test('ingresso ufficiale: plancia LIVE oppure fallback Boss, mai vecchio simultaneo',()=>{
 assert.match(entry,/from '\.\/OfficialLiveBattle3D\.jsx'/);
 assert.match(entry,/from '\.\/BossBattle3D\.jsx'/);
 assert.doesNotMatch(entry,/from '\.\/OfficialBattle3D\.jsx'/);
 assert.match(entry,/officialSimultaneousEligibility\(battleProps\)/);
 assert.match(entry,/<OfficialLiveBattle3D \{\.\.\.battleProps\}\/>/);
});

test('arena LIVE 450×800: la scala conserva il 9:16 su telefoni',()=>{
 assert.match(css,/\.live-root\{[^}]*width:450px;height:800px;/);
 assert.match(ui,/Math\.max\(\.3,Math\.min\(innerWidth\/450,innerHeight\/800\)\)/);
 assert.ok(ui.includes("transform:'translate(-50%,-50%) scale('+scale+')"));
 assert.match(ui,/arena_titanio_9x16\.webp/);
 assert.match(base,/\.es-root\{[^}]*width:450px;height:800px;/);
 for(const [width,height] of [[320,640],[360,780],[393,852],[432,920],[450,800]]){
  const scale=Math.max(.3,Math.min(width/450,height/800));
  assert.ok(450*scale<=width+.001,width+' larghezza');
  assert.ok(800*scale<=height+.001,height+' altezza');
 }
});

test('madre centrale e due scudiere laterali restano agganciate alla stessa nave',()=>{
 assert.match(ui,/className="fleet-ship-wrap complete-ship focused official-mother"/);
 assert.match(ui,/style=\{\{left:'50%',top:0,width:316,height:206,zIndex:3\}\}/);
 assert.match(css,/\.live-fighter \.fleet-ship-wrap\{[^}]*transform:translateX\(-50%\)/);
 assert.match(css,/\.live-escort--0\{left:45px\}/);
 assert.match(css,/\.live-escort--1\{right:45px\}/);
 assert.match(css,/\.live-escort\{[^}]*width:60px;height:65px;/);
 assert.match(ui,/snapshot\.escorts\.map\(\(escort,i\)=>/);
 assert.match(ui,/<ShipPhysicalVitals side=\{side\}/);
 assert.match(ui,/<MountedWeapons side=\{side\}/);
 assert.match(ui,/ASSET_ROOT\+'\/escorts\/'\+snapshot\.shipId/);
 assert.equal(45+60,450-(45+60));
});

test('campo LIVE: cinque slot per ciascun lato con ruoli reali e terreno centrale',()=>{
 assert.match(read('./officialLiveDuelEngine.js'),/const initialZones=\(\)=>\(\{character:null,traps:\[null,null\],open:\[null,null\]\}\)/);
 for(const side of ['A','B']){
  assert.ok(ui.includes('battle.zones.'+side+'.character'));
  assert.ok(ui.includes('battle.zones.'+side+'.traps.map'));
  assert.ok(ui.includes('battle.zones.'+side+'.open.map'));
 }
 assert.match(ui,/data-slot-role=\{kind==='character'\?'personaggio':isTrap\?'difesa':'attacco-supporto'\}/);
 assert.match(css,/\.live-slot-row--enemy\{top:233px\}/);
 assert.match(css,/\.live-slot-row--player\{top:353px\}/);
 assert.match(css,/\.live-slot\{[^}]*width:42px;height:59px;/);
 assert.match(ui,/data-live-slot="terrain" data-live-drop="terrain"/);
 assert.match(ui,/terrain\.imagePath/);
 assert.equal(1+2+2,5);
});

test('sette numeriche e cinque speciali non si sovrappongono nell area di mano',()=>{
 assert.match(ui,/aria-label="Cinque carte speciali"/);
 assert.match(ui,/aria-label="Sette carte numeriche"/);
 assert.match(ui,/player\.special\.hand\.map\(card=>/);
 assert.match(ui,/player\.numeric\.hand\.map\(card=>/);
 assert.match(css,/\.live-special-hand\{position:absolute;top:582px;left:76px;right:76px;/);
 assert.match(css,/\.live-number-hand\{position:absolute;top:648px;left:32px;right:32px;/);
 assert.match(css,/\.live-hand-special\{width:55px;height:63px;/);
 assert.match(css,/\.live-number-card\{position:relative;flex:0 0 54px;width:54px;height:86px;/);
 assert.ok(5*55+4*4<=450-2*76,'le cinque speciali entrano nella mano');
 assert.ok(7*54<=450-2*32,'le sette numeriche entrano nella mano');
 assert.ok(582+64<=648,'mano speciale sopra la numerica senza sovrapposizione dei contenitori');
});

test('dorsi PNG: numerico equipaggiato e speciale unico e fisso',()=>{
 assert.match(ui,/officialNumericDeckBackPath/);
 assert.match(ui,/OFFICIAL_SPECIAL_FIXED_BACK/);
 assert.match(ui,/data-equipped-deck=\{numericBackId\}/);
 assert.match(ui,/data-special-back="fixed"/);
 assert.match(ui,/--live-deck-art/);
 assert.match(css,/background-image:var\(--live-deck-art\)/);
 assert.match(css,/\.live-deck--numeric\{left:15px;/);
 assert.match(css,/\.live-deck--special\{right:15px;/);
});

test('controlli touch LIVE e limiti reali 30s, tre numeriche, due speciali',()=>{
 assert.equal(LIVE_TURN_MS,30_000);
 assert.equal(LIVE_NUMERIC_LIMIT,3);
 assert.equal(LIVE_SPECIAL_LIMIT,2);
 assert.match(ui,/onTouchEnd=\{e=>touchRelease\(e,'numeric',card\.id\)\}/);
 assert.match(ui,/onTouchEnd=\{canPlay\?e=>touchRelease\(e,'special',card\.id\):undefined\}/);
 assert.match(ui,/data-live-drop="discard"/);
 assert.match(ui,/aria-label="Cestino: scarta la carta numerica selezionata"/);
 assert.match(ui,/aria-label="Abbandona la battaglia"/);
 assert.match(ui,/data-live-drop="vital"/);
 assert.match(ui,/action\(\{type:'end'\}\)/);
 assert.match(css,/\.live-number-hand\{[^}]*z-index:12\}/);
});

test('trappola nemica coperta: nessuna illustrazione, rarita o descrizione privata',()=>{
 assert.match(ui,/const visible=!!card&&\(side==='A'\|\|!isTrap\)/);
 assert.match(ui,/const face=visible\?officialSpecialCardIdentity/);
 assert.match(ui,/const visual=visible\?officialSpecialVisualMeta/);
 assert.match(ui,/data-rarity=\{visual\?\.rarity\?\?undefined\}/);
 assert.match(ui,/data-family=\{visual\?\.role\?\?face\?\.category\}/);
 assert.match(css,/\.live-slot--covered\{[^}]*background-image:var\(--live-special-back\)/);
});
