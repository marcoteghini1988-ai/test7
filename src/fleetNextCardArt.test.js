import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,cardFacePath} from './fleetNext/rules.js';
const active=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS)].filter(c=>cardFacePath(c.id));
const pending=Object.values(EXCLUSIVE_CARDS).filter(c=>c.playable===false);
test('I fronti storici restano 2:3; nuove carte e Cartografo usano layout senza immagine falsa',()=>{
 assert.equal(active.length,12);assert.equal(pending.length,0);
 for(const id of ['ex-n00-01','ex-c01-01','nx-n00-01','nx-n00-02','nx-n00-09','nx-c01-04','ex-c02-01','nx-c02-01','nx-c02-04','nx-c02-10','ex-c03-01','ex-r02-01','ex-r04-01','ex-e01-01','ex-e02-01','ex-l01-01','ex-l03-01','nx-c03-01','nx-c03-04','nx-c03-10'])assert.equal(cardFacePath(id),null);
 for(const c of pending)assert.equal(cardFacePath(c.id),null,c.id);
 for(const c of active){
  const f=resolve('public'+cardFacePath(c.id));assert.ok(existsSync(f),c.id);
  const svg=readFileSync(f,'utf8');
  assert.ok(svg.includes('width="512" height="768"'),c.id);
  assert.ok(svg.includes('viewBox="0 0 512 768"'),c.id);
  assert.ok(!svg.includes('ECLISSI STELLARE'),c.id);
 }
});
test('I dodici Personaggi Boss attendono fronti originali approvati',()=>{
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 for(const boss of Object.values(BOSS_CARDS)){
  assert.equal(cardFacePath(boss.id),null,boss.id);
  assert.equal(existsSync(resolve('public/assets/boss-characters/'+boss.id+'.png')),false,boss.id);
 }
 const fallback=readFileSync(resolve('src/BossCharacterPortrait.jsx'),'utf8');
 assert.ok(fallback.includes('CARTA IN PREPARAZIONE'));
});
test('La plancia 3D e gli scenari ambientali non sono stati rimossi',()=>{
 const css=readFileSync(resolve('src/OfficialFleetBattle3D.css'),'utf8');
 assert.ok(css.includes('height:81px;aspect-ratio:2/3'));
 assert.ok(css.includes('--chrome-light:#f4fbff'));
 for(let i=1;i<=10;i++)assert.ok(existsSync(resolve('public/assets/fleet-terrain-scenes/T'+String(i).padStart(2,'0')+'.svg')));
});
