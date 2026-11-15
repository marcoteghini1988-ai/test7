import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describeEffect} from './fleetNext/simpleEffects.js';
import {BOSS_CARDS} from './fleetNext/bossCards.js';
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
  assert.ok(!svg.includes('ECLISSI STELLARE'),'Il marchio non deve apparire nella carta: '+c.id);
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

test('117 Attacchi: fronti HD e vettoriali verificati dinamicamente, formato 2:3',()=>{
 const cards=[...generalData.carte.filter(c=>c.categoria==='Attacco'),...exclusiveData.cards.filter(c=>c.category==='Attacco'||/Combo|Fusione/.test(c.category)||c.category==='Reazione')];
 assert.equal(cards.length,117);
 const hd=new Set(cards.filter(c=>existsSync(resolve('public/assets/fleet-card-illustrations',c.id+'.webp'))).map(c=>c.id));
 const motifs=new Set(),signatures=new Set();
 for(const card of cards){
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',card.id+'.svg'),'utf8');
  assert.ok(svg.includes('width="512" height="768"'),card.id);
  assert.ok(svg.includes('stroke="#ff594c"'),'Colore Attacco non rosso: '+card.id);
  if(hd.has(card.id)){
   const asset=readFileSync(resolve('public/assets/fleet-card-illustrations',card.id+'.webp'));
   assert.ok(svg.includes('data-hd-art="'+card.id+'"'),'Opera HD non collegata: '+card.id);
   const match=svg.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
   assert.ok(match,'WebP non incorporata: '+card.id);
   assert.ok(Buffer.from(match[1],'base64').equals(asset),'Opera HD differente dalla sorgente: '+card.id);
  }else{
   assert.ok(svg.includes('data-attack-id="'+card.id+'"'),'Manca scena Attacco: '+card.id);
   const motif=svg.match(/data-attack-scene="([^"]+)"/),sign=svg.match(/data-attack-signature="([^"]+)"/);
   assert.ok(motif&&sign,card.id);
   motifs.add(motif[1]);signatures.add(sign[1]);
  }
 }
 assert.equal(signatures.size,cards.length-hd.size,'Illustrazioni vettoriali duplicate');
 assert.ok(motifs.size>=9,'Motivi insufficienti');
});


test('Quattro difese reali hanno illustrazioni HD sincronizzate con la sorgente',()=>{
 const ids=['gen-071','gen-092','gen-106','gen-116'];
 for(const id of ids){
  const card=generalData.carte.find(c=>c.id===id);
  assert.equal(card?.sottotipo,'Difesa',id);
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',id+'.svg'),'utf8');
  const webp=readFileSync(resolve('public/assets/fleet-card-illustrations',id+'.webp'));
  const encoded=svg.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  assert.ok(encoded,'Illustrazione non incorporata '+id);
  assert.ok(Buffer.from(encoded[1],'base64').equals(webp),'Immagine non aggiornata '+id);
  assert.ok(svg.includes('data-hd-art="'+id+'"'));
  assert.ok(svg.includes('width="512" height="768"'));
  assert.ok(svg.includes('stroke="#37ceff"'),'Colore ruolo non blu '+id);
 }
});
test('Le nuove carte illustrate sono sempre 2:3, con testo e colore della funzione',()=>{
 const ids=['gen-072','gen-073','gen-074','gen-075','gen-076','gen-077','gen-078','gen-080','gen-081','gen-003','gen-015','gen-017'];
 for(const id of ids){
  const card=generalData.carte.find(c=>c.id===id);
  assert.ok(card,id);
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',id+'.svg'),'utf8');
  const img=readFileSync(resolve('public/assets/fleet-card-illustrations',id+'.webp'));
  const key='href="data:image/webp;base64,';
  const start=svg.indexOf(key);
  assert.ok(start>0,id);
  const end=svg.indexOf('"',start+key.length);
  const b64=svg.slice(start+key.length,end);
  assert.ok(Buffer.from(b64,'base64').equals(img),id+' immagine differente');
  assert.ok(svg.includes('data-hd-art="'+id+'"'),id);
  assert.ok(svg.includes('width="512" height="768"'),id);
  const expected=card.sottotipo==='Difesa'?'#37ceff':'#ff594c';
  assert.ok(svg.includes(expected),'Colore funzione mancante '+id);
 }
});

test('Dieci nuovi fronti HD con nome ufficiale, rarita e colori separati',()=>{
 const ids=['gen-055','gen-067','gen-079','gen-117','gen-085','gen-087','gen-089','gen-093','gen-099','gen-118'];
 for(const id of ids){
  const card=generalData.carte.find(c=>c.id===id);
  assert.ok(card&&['Attacco','Difesa'].includes(card.sottotipo),id);
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',id+'.svg'),'utf8');
  const src=readFileSync(resolve('public/assets/fleet-card-illustrations',id+'.webp'));
  const encoded=svg.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  assert.ok(encoded&&Buffer.from(encoded[1],'base64').equals(src),'Art HD non sincronizzata '+id);
  assert.ok(svg.includes('data-hd-art="'+id+'"'));
  assert.ok(!svg.includes('ECLISSI STELLARE'),'Marchio vietato '+id);
  assert.ok(svg.includes('width="512" height="768"'),'Formato non verticale '+id);
  assert.ok(svg.includes(card.sottotipo==='Difesa'?'stroke="#37ceff"':'stroke="#ff594c"'),id);
 }
});


const decodeRuleText=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function visibleRule(svg,id){
 const group=svg.match(new RegExp('<g data-current-effect="'+id+'"[^>]*>([\\s\\S]*?)<\\/g>'));
 assert.ok(group,'Pannello regole visibile assente: '+id);
 return {group:group[0],text:[...group[1].matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(m=>decodeRuleText(m[1])).join(' ')};
}
test('Tutte le 379 carte mostrano il testo completo del motore senza troncamenti',()=>{
 for(const card of entries){
  const svg=readFileSync(resolve('public/assets/fleet-next-cards',card.id+'.svg'),'utf8');
  const visible=visibleRule(svg,card.id);
  assert.equal(visible.text,describeEffect(card),card.id);
  assert.equal(visible.text,card.effetto||card.effectProposed,card.id);
  assert.ok(visible.group.includes('data-effect-grade="1"'),card.id);
  assert.ok(!visible.text.includes('…'),'Effetto troncato: '+card.id);
 }
});
test('Le 258 varianti esclusive mostrano gli effetti effettivi dei gradi 2 e 3',()=>{
 for(const card of exclusiveData.cards)for(const grade of [2,3]){
  const path=resolve('public/assets/fleet-next-card-upgrades',card.id+'-g'+grade+'.svg');
  assert.ok(existsSync(path),'Variante mancante: '+card.id+' grado '+grade);
  const svg=readFileSync(path,'utf8'),visible=visibleRule(svg,card.id);
  assert.equal(visible.text,describeEffect(card,grade),card.id+' grado '+grade);
  assert.ok(visible.group.includes('data-effect-grade="'+grade+'"'));
  assert.ok(svg.includes('GRADO '+grade),'Grado non visibile: '+card.id);
  assert.ok(svg.includes('width="512" height="768"'));
  const base=readFileSync(resolve('public/assets/fleet-next-cards',card.id+'.svg'),'utf8');
  const embedded=svg.match(/data-hd-art="[^"]+"[\s\S]*?href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  if(embedded)assert.ok(base.includes(embedded[1]),'Illustrazione cambiata con il grado '+card.id);
 }
});

test('I 12 Personaggi Boss conservano il ritratto originale e mostrano le regole correnti',()=>{
 const cards=Object.values(BOSS_CARDS);assert.equal(cards.length,12);
 for(const card of cards){
  const svg=readFileSync(resolve('public/assets/fleet-next-boss-cards',card.id+'.svg'),'utf8');
  assert.equal(visibleRule(svg,card.id).text,describeEffect(card),card.id);
  assert.ok(svg.includes('>PERSONAGGIO</text>'));
  assert.ok(svg.includes('>BOSS</text>'));
  assert.ok(svg.includes('stroke="#eb64e1"'),'Tinta Personaggio mancante '+card.id);
  assert.ok(!svg.includes('ECLISSI STELLARE'),'Marchio non consentito '+card.id);
  const embedded=svg.match(/href="data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)"/);
  assert.ok(embedded,'Ritratto vettoriale originale non incorporato '+card.id);
  const source=readFileSync(resolve('public/assets/boss-characters',card.id+'.svg'),'utf8');
  const portrait=Buffer.from(embedded[1],'base64').toString('utf8');
  assert.ok(portrait.includes('viewBox="35 127 442 435"'),'Ritaglio ritratto sbagliato '+card.id);
  assert.equal(portrait.replace(/<svg\b[^>]*>/,''),source.replace(/<svg\b[^>]*>/,''),'Ritratto originale modificato '+card.id);
 }
});
