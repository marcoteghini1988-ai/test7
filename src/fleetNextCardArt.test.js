import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,cardFacePath} from './fleetNext/rules.js';
const active=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS).filter(c=>c.playable!==false)];
const pending=Object.values(EXCLUSIVE_CARDS).filter(c=>c.playable===false);
test('I 29 fronti Personaggio restano 2:3 e invariati; 108 progetti non cercano arte inesistente',()=>{
 assert.equal(active.length,29);assert.equal(pending.length,108);
 for(const c of pending)assert.equal(cardFacePath(c.id),null,c.id);
 for(const c of active){
  const f=resolve('public'+cardFacePath(c.id));assert.ok(existsSync(f),c.id);
  const svg=readFileSync(f,'utf8');
  assert.ok(svg.includes('width="512" height="768"'),c.id);
  assert.ok(svg.includes('viewBox="0 0 512 768"'),c.id);
  assert.ok(!svg.includes('ECLISSI STELLARE'),c.id);
 }
});
test('Restano i dodici fronti Boss con ritratti originali',()=>{
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 for(const boss of Object.values(BOSS_CARDS)){
  const f=resolve('public'+cardFacePath(boss.id));assert.ok(existsSync(f),boss.id);
  assert.ok(readFileSync(f,'utf8').includes('data-boss-portrait="'+boss.id+'"'));
 }
});
test('La plancia 3D e gli scenari ambientali non sono stati rimossi',()=>{
 const css=readFileSync(resolve('src/OfficialFleetBattle3D.css'),'utf8');
 assert.ok(css.includes('height:81px;aspect-ratio:2/3'));
 assert.ok(css.includes('--chrome-light:#f4fbff'));
 for(let i=1;i<=10;i++)assert.ok(existsSync(resolve('public/assets/fleet-terrain-scenes/T'+String(i).padStart(2,'0')+'.svg')));
});
