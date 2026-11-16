import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,card} from './fleetNext/rules.js';
const active=new Set([...Object.keys(GENERAL_CARDS),...Object.keys(EXCLUSIVE_CARDS)]);
test('Gli asset approvati restano intatti ma non riattivano le vecchie carte',()=>{
 const root=resolve('public/assets/fleet-approved-fronts');
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
 assert.ok(manifest.cards.length>=30);
 for(const m of manifest.cards){
  const path=resolve(root,m.id+'.webp');assert.ok(existsSync(path),m.id);
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),m.originalApprovedAssetSha256,m.id);
  if(!active.has(m.id))assert.equal(card(m.id),null,m.id+' non deve essere giocabile');
 }
});
