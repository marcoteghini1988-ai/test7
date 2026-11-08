import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {TACTICAL_VITAL_EFFECTS,tacticalVitalTransition} from './tacticalVitalConsequences.js';
import {VITAL_IDS} from './vitalDefense.js';

function withHp(defense,id,hp){
 const d=structuredClone(defense);
 d.parts[id].hp=hp;
 return d;
}
test('Il registro descrive i quattro sistemi solo al vero attraversamento di una soglia',()=>{
 const defense=createTacticalDuel().sides.B.defense;
 for(const id of VITAL_IDS){
  const before=withHp(defense,id,10),six=withHp(defense,id,6);
  const damaged=withHp(defense,id,5),dead=withHp(defense,id,0);
  assert.equal(tacticalVitalTransition(before,six,id),null);
  assert.equal(tacticalVitalTransition(six,six,id),null);
  assert.equal(tacticalVitalTransition(damaged,withHp(defense,id,4),id),null);
  const intermediate=tacticalVitalTransition(six,damaged,id);
  assert.equal(intermediate.state,'damaged');
  assert.equal(intermediate.description,TACTICAL_VITAL_EFFECTS[id].damaged);
  const knockout=tacticalVitalTransition(damaged,dead,id);
  assert.equal(knockout.state,'destroyed');
  assert.equal(knockout.description,TACTICAL_VITAL_EFFECTS[id].destroyed);
  assert.equal(tacticalVitalTransition(before,dead,id)?.state,'destroyed');
 }
 assert.equal(tacticalVitalTransition(defense,defense,'not-a-vital'),null);
});

test('Un attacco di precisione valido registra davvero la funzione perduta, senza danno automatico agli altri vitali',()=>{
 const b=createTacticalDuel({shipA:'C01',levelA:1,shipB:'R04',levelB:1});
 b.sides.B.defense.shield.hp=40;
 const aa=sealTacticalOrder(b,'A',{specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'},100);
 assert.equal(aa.ok,true,aa.reason);
 const bb=sealTacticalOrder(aa.battle,'B',{specialIndices:[],numericIndices:[]},101);
 assert.equal(bb.ok,true,bb.reason);
 const result=advanceTacticalDuel(bb.battle,101);
 assert.equal(result.sides.B.defense.parts.weapons.hp,4);
 for(const id of VITAL_IDS.filter(id=>id!=='weapons'))
  assert.equal(result.sides.B.defense.parts[id].hp,10);
 assert.ok(result.lastEvents.some(e=>e.includes('Sistema armi DANNEGGIATO')&&e.includes('−20%')));
});
