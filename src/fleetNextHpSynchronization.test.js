import test from 'node:test';
import assert from 'node:assert/strict';
import {deckFromCounts} from './fleetNext/rules.js';
import {TEST_DECK} from './fleetNext/testDeckFixtures.js';
import {createFleetNextBattle,resolveFleetNextTurn,protectingFleetUnits,availableFleetTargets} from './fleetNext/combat.js';
import {HP_SYNC_RULESET,motherIntegrityFromSystems,activeSynchronizationPenalty,
 splitSynchronizedDamage,registerSynchronizationInterference} from './fleetNext/hpSynchronization.js';

const deck=deckFromCounts(TEST_DECK.carteGenerali);
const battle=(options={})=>createFleetNextBattle({
 shipA:'N00',levelA:1,shipB:'N00',levelB:1,
 deckA:deck,deckB:deck,mode:'pvp',seed:41,ruleset:HP_SYNC_RULESET,...options
});

test('La madre conserva i sistemi interni ma ha una sua barra HP',()=>{
 const b=battle();
 for(const {ships:[mother],ruleset} of Object.values(b.sides)){
  assert.equal(ruleset,HP_SYNC_RULESET);
  assert.ok(mother.parts.length>=2);
  assert.equal(mother.maxHp,motherIntegrityFromSystems(mother.parts));
  assert.equal(mother.hp,mother.maxHp);
 }
});

test('La sincronizzazione al 25% spartisce 20 HP: 15 al supporto e 5 alla madre',()=>{
 assert.deepEqual(splitSynchronizedDamage(20,25),{total:20,support:15,mother:5});
 assert.deepEqual(splitSynchronizedDamage(20,0),{total:20,support:20,mother:0});
 assert.deepEqual(splitSynchronizedDamage(20,50),{total:20,support:10,mother:10});
});

test('Tre turni con interferenza; non si sommano due carte, prevale la maggiore',()=>{
 const s={synchronizationEffects:[]};
 registerSynchronizationInterference(s,25,3,0);
 registerSynchronizationInterference(s,15,3,0);
 assert.equal(activeSynchronizationPenalty(s,0),25);
 assert.equal(activeSynchronizationPenalty(s,5),25);
 assert.equal(activeSynchronizationPenalty(s,6),0);
});

test('In modalita nuova le Armi schierate non bloccano né diventano bersagli',()=>{
 const b=battle(),s=b.sides.B;
 s.machines.push({id:'arma-prova',slot:0,name:'Arma',hp:3,maxHp:3,power:1});
 assert.equal(protectingFleetUnits(s,b.ply).length,0);
 const options=availableFleetTargets(s,b.ply);
 assert.ok(!options.some(t=>t.kind==='machine'));
 assert.deepEqual(options.filter(t=>t.kind==='part').map(t=>t.name),['Nave madre']);
 assert.equal(options.find(t=>t.kind==='part').blocked,false);
});

test('Il colpo riduce gli HP madre senza distruggere alcun componente e assegna la vittoria',()=>{
 const b=battle();
 const before=structuredClone(b.sides.B.ships[0].parts);
 b.sides.B.ships[0].hp=1;
 const r=resolveFleetNextTurn(b,'A',{targetKind:'part',targetId:'weapons',partId:'weapons',cards:[]},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.sides.B.ships[0].hp,0);
 assert.deepEqual(r.battle.sides.B.ships[0].parts,before);
 assert.equal(r.battle.winner,'A');
 assert.equal(r.battle.phase,'finished');
});

test('L’interferenza trasferisce una quota del danno alle scudiere direttamente alla madre',()=>{
 const b=battle({shipB:'C03'});
 const enemy=b.sides.B;
 const originalHp=enemy.ships[0].hp;
 const partsBefore=structuredClone(enemy.ships[0].parts);
 registerSynchronizationInterference(enemy,50,3,b.ply);
 const guard=protectingFleetUnits(enemy,b.ply)[0];
 assert.ok(guard);
 const r=resolveFleetNextTurn(b,'A',{targetKind:'escort',targetId:guard.id,escortSlot:guard.slot,cards:[]},1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.battle.sides.B.ships[0].hp<originalHp,'deve passare danno alla madre');
 assert.deepEqual(r.battle.sides.B.ships[0].parts,partsBefore);
 assert.ok(r.battle.sides.B.escorts.some(e=>e.id===guard.id&&e.hp<guard.hp));
});

test('Il ruleset storico resta disponibile ai test di compatibilita',()=>{
 const b=createFleetNextBattle({shipA:'N00',shipB:'N00',deckA:deck,deckB:deck,mode:'pvp',seed:41});
 assert.equal(b.ruleset,'legacy');
 assert.equal(availableFleetTargets(b.sides.B).filter(t=>t.kind==='part').length,2);
});
