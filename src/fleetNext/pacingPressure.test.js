// Verifica del ritmo morbido, senza timer che termini la partita.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pacingAttackMultiplier,bossExtraDamageResistance,bossAttackMultiplier,FLEET_PACING_PRESSURE,
 matchPacingTarget} from './battlePacing.js';
import {limitedMotherDamage} from './motherBalance.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './combat.js';
import {HP_SYNC_RULESET} from './hpSynchronization.js';

const state=(mode='pvp',bossId=null)=>({mode,bossId,startedAtMs:0});
test('La durata resta indicativa: nessuna accelerazione automatica del danno',()=>{
 const b=state();
 assert.equal(FLEET_PACING_PRESSURE.enabled,false);
 assert.equal(pacingAttackMultiplier(b,90000),1);
 assert.equal(pacingAttackMultiplier(b,420000),1);
 assert.equal(pacingAttackMultiplier(state('campaign',17),900000),1);
 assert.equal(matchPacingTarget('pvp').enforcedTimeLimit,false);
 assert.equal(matchPacingTarget('pvp').targetSeconds,300);
 assert.equal(matchPacingTarget('boss',17).targetSeconds,540);
});

test('Resistenza boss lascia invariati HP visibili e incrementa con il boss',()=>{
 assert.equal(bossExtraDamageResistance(8),20);
 assert.equal(bossExtraDamageResistance(17),24);
 assert.equal(bossAttackMultiplier(8),1);
 assert.equal(bossAttackMultiplier(17),.85);
 const m={hp:1000,maxHp:1000,defensePercent:10,bossGuardPercent:20};
 assert.equal(limitedMotherDamage(m,100,0),72);
 assert.equal(m.maxHp,1000);
 const b=createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  ruleset:HP_SYNC_RULESET,mode:'campaign',bossId:8,
  supportRosterA:[],supportRosterB:[],deckA:[],deckB:[]});
 assert.equal(b.sides.B.ships[0].maxHp,1000);
 assert.equal(b.sides.B.ships[0].bossGuardPercent,20);
 assert.equal(b.sides.A.ships[0].bossGuardPercent,undefined);
 assert.ok(b.log.some(e=>e.kind==='boss-guard'));
});

test('Attacco identico a prescindere dai minuti trascorsi',()=>{
 const b=createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  ruleset:HP_SYNC_RULESET,mode:'pvp',
  supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],nowMs:0});
 b.sides.A.hand=[];b.sides.B.hand=[];
 const order={cards:[],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
 const early=resolveFleetNextTurn(b,'A',order,1000);
 const late=resolveFleetNextTurn(b,'A',order,240000);
 assert.equal(early.ok,true,early.reason);
 assert.equal(late.ok,true,late.reason);
 assert.equal(late.shot.damage,early.shot.damage);
 assert.ok(!late.events.some(e=>e.kind==='pacing-pressure'));
});
