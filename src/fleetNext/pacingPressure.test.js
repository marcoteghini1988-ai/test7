// Verifica del ritmo morbido, senza timer che termini la partita.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pacingAttackMultiplier,bossExtraDamageResistance,bossAttackMultiplier,FLEET_PACING_PRESSURE,
 matchPacingTarget} from './battlePacing.js';
import {limitedMotherDamage} from './motherBalance.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './combat.js';
import {HP_SYNC_RULESET} from './hpSynchronization.js';

const state=(mode='pvp',bossId=null)=>({mode,bossId,startedAtMs:0});
test('L accelerazione e simmetrica, progressiva, senza eliminazione forzata',()=>{
 const b=state();
 assert.equal(pacingAttackMultiplier(b,90000),1);
 assert.equal(pacingAttackMultiplier(b,180000),1);
 assert.equal(pacingAttackMultiplier(b,210000),1.4);
 assert.equal(pacingAttackMultiplier(b,300000),2.6);
 assert.equal(pacingAttackMultiplier(b,420000),FLEET_PACING_PRESSURE.pvp.maxMultiplier);
 assert.equal(matchPacingTarget('pvp').enforcedTimeLimit,false);
 assert.equal(matchPacingTarget('pvp').targetSeconds,300);
 assert.equal(pacingAttackMultiplier(state('campaign',17),300000),1);
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

test('Sovraccarico solo sul colpo reale e dopo la soglia temporale',()=>{
 const b=createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  ruleset:HP_SYNC_RULESET,mode:'pvp',
  supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],nowMs:0});
 b.sides.A.hand=[];b.sides.B.hand=[];
 const r=resolveFleetNextTurn(b,'A',{cards:[],pass:false,
  targetKind:'part',targetId:'weapons',partId:'weapons'},240000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.events.some(e=>e.kind==='pacing-pressure'));
 assert.ok(r.shot.damage>150,'attacco normale potenziato dopo 4 minuti');
});
