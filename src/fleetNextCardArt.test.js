import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import generalData from './fleetNext/catalogGeneral.json' with {type:'json'};
import exclusiveData from './fleetNext/catalogExclusive.json' with {type:'json'};

const entries=[...generalData.carte,...exclusiveData.cards];
const color={
 attack:'#ff594c',defense:'#37ceff',character:'#eb64e1',
 terrain:'#2be3a2',support:'#ffb24d',control:'#9e8fff'
};
const rarityGlow={Comune:'0.12',Rara:'0.36',Epica:'0.66',Leggendaria:'0.98'};
function kind(card){
 const subtype=card.sottotipo||'';
 const category=card.categoria||card.category||'';
 return subtype==='Terreno'?'terrain':
  subtype==='Personaggio'||/Personaggio/i.test(category)?'character':
  subtype==='Difesa'||/Difesa/i.test(category)?'defense':
  category==='Attacco'||/Combo|Fusione/i.test(category)?'attack':
  /Controllo/i.test(category)?'control':
  /Supporto|Scudiera|Tattica|Strategia/i.test(category)?'support':'attack';
}
test('I 379 fronti nuovi esistono, distinti e di dimensioni coerenti',()=>{
 assert.equal(generalData.carte.length,250);
 assert.equal(exclusiveData.cards.length,129);
 assert.equal(new Set(entries.map(c=>c.id)).size,379);
 for(const c of entries){
  const path=resolve('public/assets/fleet-next-cards',c.id+'.svg');
  assert.ok(existsSync(path),'Manca '+c.id);
  const svg=readFileSync(path,'utf8');
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.trimEnd().endsWith('</svg>'),c.id);
  assert.match(svg,/width="512" height="768"/,c.id);
  const rarity=c.rarita||c.rarityDraft;
  assert.ok(svg.includes('opacity="'+rarityGlow[rarity]+'" filter="url(#rimGlow)"'),'Rarità senza livello luminoso: '+c.id);
  assert.ok(!svg.includes('#ffc447')&&!svg.includes('#bb60ff'),'Colori rarità non ammessi: '+c.id);
  assert.ok(svg.includes(color[kind(c)]),'Funzione senza tinta: '+c.id);
  assert.ok(svg.includes(c.id+'</text>'),'ID incoerente: '+c.id);
 }
});
test('Il generatore resta riproducibile e non tocca le immagini precedenti',()=>{
 const script=readFileSync(resolve('scripts/generate-fleet-card-art.mjs'),'utf8');
 assert.ok(script.includes('catalogGeneral.json'));
 assert.ok(script.includes('catalogExclusive.json'));
 assert.ok(existsSync(resolve('public/assets/special-cards/fusion-barrier.png')));
});

test('Mano, slot e Shop: rapporto 2:3 e rarita cromata, non dorata',()=>{
 const css=readFileSync(resolve('src/OfficialFleetBattle3D.css'),'utf8');
 const shop=readFileSync(resolve('src/FleetCollectionWorkshop.jsx'),'utf8');
 assert.ok(css.includes('height:81px;aspect-ratio:2/3'));
 assert.ok(css.includes('height:60px;aspect-ratio:2/3'));
 assert.ok(css.includes('--chrome-light:#f4fbff'));
 assert.ok(!css.includes('--tier:#ffd36b'));
 assert.ok(shop.includes("aspectRatio:'2 / 3'"));
});
test('Dieci Terreni con illustrazioni HD diverse e tutte le regole del catalogo',()=>{
 const terrains=generalData.carte.filter(c=>c.sottotipo==='Terreno');
 assert.equal(terrains.length,10);
 const unique=new Set();
 for(const c of terrains){
  const source=resolve('public/assets/fleet-card-illustrations',c.id+'.webp');
  assert.ok(existsSync(source),'Arte HD mancante: '+c.id);
  const binary=readFileSync(source);
  assert.ok(binary.length>50000,'WEBP troppo piccolo: '+c.id);
  assert.equal(binary.toString('ascii',0,4),'RIFF',c.id);
  assert.equal(binary.toString('ascii',8,12),'WEBP',c.id);
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',c.id+'.svg'),'utf8');
  assert.ok(svg.includes('width="512" height="768"'),c.id);
  assert.ok(svg.includes('data-hd-art="'+c.id+'"'),c.id);
  assert.ok(svg.includes(c.nome),'Titolo ufficiale mancante: '+c.id);
  const m=svg.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  assert.ok(m,'Immagine non incorporata: '+c.id);
  assert.ok(Buffer.from(m[1],'base64').equals(binary),'Fonte HD differente: '+c.id);
  unique.add(m[1].slice(0,400));
 }
 assert.equal(unique.size,10,'Scene duplicate');
});


test('Dieci scenari grafici Terreno in arena 9:16 senza spostamenti',()=>{
 const bridge=readFileSync(resolve('src/OfficialFleetBattle3D.jsx'),'utf8');
 const css=readFileSync(resolve('src/OfficialFleetBattle3D.css'),'utf8');
 for(let i=1;i<=10;i++){
  const code='T'+String(i).padStart(2,'0');
  const filename=resolve('public/assets/fleet-terrain-scenes',code+'.svg');
  assert.ok(existsSync(filename),'Scenario mancante: '+code);
  assert.ok(readFileSync(filename,'utf8').includes('viewBox="0 0 512 768"'));
 }
 assert.ok(bridge.includes('className="f3d-terrain-environment"'));
 assert.ok(bridge.includes('arena_titanio_9x16.webp'));
 assert.ok(css.includes('mix-blend-mode:screen;opacity:.18'));
 assert.ok(css.includes('pointer-events:none'));
});

test('Il generatore accetta illustrazioni HD per tutte le funzioni',()=>{
 const script=readFileSync(resolve('scripts/generate-fleet-card-art.mjs'),'utf8');
 assert.ok(script.includes("const source=resolve(ROOT,'public/assets/fleet-card-illustrations',c.id+'.webp')"));
 assert.ok(script.includes('if(existsSync(source))'));
 assert.ok(script.includes('function artScene(c,seed)'));
 assert.ok(script.includes('const rand=rng(seed^0x894ec321)'),'Fallback vettoriale ancora disponibile');
});
