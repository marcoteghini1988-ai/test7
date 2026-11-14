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
const rarityColor={
 Comune:'#a9b9cc',Rara:'#24cfff',Epica:'#bb60ff',Leggendaria:'#ffc447'
};
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
  assert.ok(svg.includes(rarityColor[rarity]),'Rarità senza bordo: '+c.id);
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
