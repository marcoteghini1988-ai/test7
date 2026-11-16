import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,PROGRESSION_CARDS,STARTER_DECK,deckFromCounts,card} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn} from './fleetNext/combat.js';
import {validateEffectSpec,describeEffect,effectiveEffectSpec} from './fleetNext/simpleEffects.js';
import {campaignTerrain,TERRAIN_CATALOG} from './fleetNext/terrains.js';
const all=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS),...Object.values(BOSS_CARDS),...Object.values(PROGRESSION_CARDS)];
const deck=deckFromCounts(STARTER_DECK.carteGenerali);
function battle(options={}){return createFleetNextBattle({shipA:'N00',shipB:'N00',levelA:1,levelB:1,deckA:deck,deckB:deck,mode:'pvp',seed:25,...options});}
test('155 schede registrate distinguono 108 progetti non ancora eseguibili',()=>{
 assert.equal(all.length,155);
 assert.equal(all.filter(c=>c.playable===false).length,108);
 for(const c of all){
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(c.effetto||c.effectProposed,describeEffect(c),c.id);
  assert.ok(effectiveEffectSpec(c),c.id);
 }
});
test('Mazzo transitorio con personaggi e carte tecniche tutte valide',()=>{
 assert.equal(deck.length,40);
 for(const id of deck)assert.ok(card(id),id);
});
test('Due Macchine si schierano sui propri alloggiamenti senza coprire la nave',()=>{
 const b=battle();b.sides.A.hand=['prog-machine-striker','prog-machine-guard'];
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],partId:'weapons',pass:true},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.sides.A.machines.length,2);
 assert.deepEqual(r.battle.sides.A.machines.map(m=>m.slot),[0,1]);
});
test('Aggiramento: una carta attiva raggiunge la madre dietro i supporti',()=>{
 const b=battle({shipB:'C03'});b.sides.A.hand=['prog-bypass'];
 const hp=b.sides.B.ships[0].parts.find(p=>p.id==='weapons').hp;
 const r=resolveFleetNextTurn(b,'A',{cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.shot.damage,1);
 assert.equal(r.battle.sides.B.ships[0].parts.find(p=>p.id==='weapons').hp,hp-1);
});
test('I Terreni ambientali dei Boss restano, senza vecchie Carte Terreno',()=>{
 assert.equal(Object.keys(TERRAIN_CATALOG).length,10);
 assert.ok(campaignTerrain(12).id);
 assert.ok(Object.values(TERRAIN_CATALOG).every(t=>t.cardId===null));
});
test('L’intelligenza artificiale produce un ordine di turno senza usare carte inesistenti',()=>{
 const b=battle({shipB:'C03'});
 const order=autoFleetTurn(b,'A');
 assert.ok(order);
 for(const idx of order.cards||[])assert.ok(card(b.sides.A.hand[idx]));
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
});
