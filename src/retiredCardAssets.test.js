import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,card} from './fleetNext/rules.js';

const retired=JSON.parse(readFileSync(resolve('docs/ARCHIVIO_ID_CARTE_RITIRATE_2026-11-16.json'),'utf8'));
const ids=[...retired.generalIds,...retired.exclusiveIds];
test('Nessuna delle 350 vecchie carte e raggiungibile dal catalogo di gioco',()=>{
 assert.equal(retired.generalIds.length,238);
 assert.equal(retired.exclusiveIds.length,112);
 assert.equal(new Set(ids).size,350);
 for(const id of ids)assert.equal(card(id),null,id+' ritirata');
 assert.equal(Object.keys(GENERAL_CARDS).length,12);
 assert.equal(Object.keys(EXCLUSIVE_CARDS).length,120);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
});
test('I vecchi fronti approvati non restano nel repository operativo',()=>{
 assert.equal(existsSync(resolve('public/assets/fleet-approved-fronts')),false);
 for(const directory of ['public/assets/fleet-next-cards','public/assets/fleet-next-card-upgrades']){
  // Una cartella assente non contiene fronti ritirati.
  if(!existsSync(resolve(directory)))continue;
  const present=readdirSync(resolve(directory));
  for(const id of ids)assert.equal(present.some(f=>f===id+'.svg'||f.startsWith(id+'-g')),false,id+' asset ritirato');
 }
});
