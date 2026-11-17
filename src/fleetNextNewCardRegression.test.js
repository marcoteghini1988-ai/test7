import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {card} from './fleetNext/rules.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {applySystemCard,resetFieldWithBlackHole} from './fleetNext/newCardEffects.js';

const battle=(ship='L01')=>createFleetNextBattle({
 shipA:ship,shipB:ship,levelA:5,levelB:5,mode:'pvp',
 deckA:[],deckB:[],seed:1234,ruleset:HP_SYNC_RULESET
});
const play=(b,who,cards=[],options={})=>{
 const side=b.sides[who];
 for(let i=0;i<cards.length;i++)side.hand[i]=cards[i];
 const result=resolveFleetNextTurn(b,who,{
  pass:!options.targetId,
  ...(options.targetId?{targetKind:'escort',targetId:options.targetId}:{}),
  cards:cards.map((_,i)=>i)
 },b.ply*30000+1000);
 assert.equal(result.ok,true,result.reason);
 return result;
};

test('Una carta sistema rimane sul campo e va negli scarti solo alla scadenza',()=>{
 let b=battle();
 b=play(b,'A',['sys-command-minus-c']).battle;
 assert.equal(b.sides.A.discard.filter(id=>id==='sys-command-minus-c').length,0);
 b=play(b,'B').battle;
 assert.equal(b.sides.A.discard.filter(id=>id==='sys-command-minus-c').length,1);
 assert.ok(!b.sides.B.systemCardEffects.some(e=>e.id==='sys-command-minus-c'));
});

test('Buco Nero rimuove anche gli attacchi preparati e non cambia HP',()=>{
 const b=battle(),motherA=b.sides.A.ships[0].hp,motherB=b.sides.B.ships[0].hp;
 b.sides.A.falco={pending:{cardId:'nx-r01-02',releasePly:2}};
 b.sides.B.obsidian={pending:{cardId:'nx-l03-05',releasePly:3}};
 applySystemCard(b.sides.B,card('sys-command-minus-c'),0,'A');
 const removed=resetFieldWithBlackHole(b);
 assert.equal(b.sides.A.falco.pending,null);
 assert.equal(b.sides.B.obsidian.pending,null);
 assert.ok(b.sides.A.discard.includes('nx-r01-02'));
 assert.ok(b.sides.B.discard.includes('nx-l03-05'));
 assert.equal(b.sides.A.discard.filter(id=>id==='sys-command-minus-c').length,1);
 assert.ok(removed.A.includes('sys-command-minus-c'));
 assert.equal(b.sides.A.ships[0].hp,motherA);
 assert.equal(b.sides.B.ships[0].hp,motherB);
});

test('Buco Nero annulla gli altri comandi già preparati nello stesso turno',()=>{
 const b=createFleetNextBattle({
  shipA:'N00',levelA:5,shipB:'C02',levelB:5,mode:'pvp',
  seed:35,deckA:[],deckB:[],ruleset:HP_SYNC_RULESET
 });
 const targetId=b.sides.B.escorts[0].id;
 const r=play(b,'A',['nx-n00-02','sys-black-hole'],{targetId});
 assert.equal(r.battle.sides.A.attackSlots.length,0);
 assert.ok(r.events.some(e=>e.kind==='field-reset'));
 assert.ok(!r.events.some(e=>e.kind==='impact'&&e.cardId==='nx-n00-02'));
});

test('Sabotaggio Plancia limita anche i colpi multipli delle carte esclusive',()=>{
 const base=battle('C02');
 const targetId=base.sides.B.escorts[0].id;
 const ordinary=play(structuredClone(base),'A',['nx-c02-10'],{targetId});
 assert.ok(ordinary.shot.targets.length>=2,'attacco multiplo prima del sabotaggio');
 const interfered=structuredClone(base);
 applySystemCard(interfered.sides.B,card('sys-bridge-minus-c'),0,'B');
 const reduced=play(interfered,'A',['nx-c02-10'],{targetId});
 assert.equal(reduced.shot.targets.length,1);
});
