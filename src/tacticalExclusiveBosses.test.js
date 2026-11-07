import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createExclusiveBossState,exclusiveBossReady,exclusiveBossShieldFactor,
 rememberExclusiveBossDefenseHit,exclusiveBossNativeBonus,rememberExclusiveBossNativeHit
} from './tacticalExclusiveBosses.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const empty=()=>({specialIndices:[],numericIndices:[]});
function cycle(start,at=101){
 const a=sealTacticalOrder(start,'A',empty(),at-1);
 assert.equal(a.ok,true,a.reason);
 const b=sealTacticalOrder(a.battle,'B',empty(),at);
 assert.equal(b.ok,true,b.reason);
 return advanceTacticalDuel(b.battle,at);
}
test('Tutte le dodici identità esclusive hanno un modulo nel motore',()=>{
 for(const id of [1,2,3,6,7,8,9,11,14,17,19,20])assert.equal(exclusiveBossReady(id),true);
 for(const id of [0,4,5,10,12,13,15,16,18,21])assert.equal(createExclusiveBossState(id),null);
 assert.equal(createExclusiveBossState(null),null);
});
test('Gaia: corazza non si consuma se non esiste un danno autentico alla barriera',()=>{
 const gaia={bossExclusive:createExclusiveBossState(1)};
 assert.equal(exclusiveBossShieldFactor(gaia),.8);
 rememberExclusiveBossDefenseHit(gaia,0);
 assert.equal(gaia.bossExclusive.armorUsed,false);
 rememberExclusiveBossDefenseHit(gaia,3);
 assert.equal(gaia.bossExclusive.armorUsed,true);
 assert.equal(exclusiveBossShieldFactor(gaia),1);
});
test('Gaia nel vero ciclo 30+8 mitiga una volta, senza regalare HP e senza modificare i vitali',()=>{
 const base=createTacticalDuel({shipA:'C01',levelA:1,shipB:'C02',levelB:1});
 const withGaia=createTacticalDuel({shipA:'C01',levelA:1,shipB:'C02',levelB:1,bossPlanetB:1});
 const normal=cycle(base),special=cycle(withGaia);
 const n=normal.history[0].impacts.find(i=>i.kind==='barrier'&&i.by==='A');
 const g=special.history[0].impacts.find(i=>i.kind==='barrier'&&i.by==='A');
 assert.ok(n.damage>0);
 assert.ok(g.damage<=n.damage);
 assert.equal(special.sides.B.bossExclusive.armorUsed,true);
 assert.deepEqual(special.sides.B.defense.parts,normal.sides.B.defense.parts);
 assert.ok(special.lastEvents.some(x=>x.includes('Corazza tellurica')));
});
test('Tharsis: bonus proporzionale 3/6/9%, resto intero, reset dopo pacchetto realmente nullo',()=>{
 const t={bossExclusive:createExclusiveBossState(2)};
 assert.equal(exclusiveBossNativeBonus(t,21).active,false);
 rememberExclusiveBossNativeHit(t,5,null);
 assert.equal(t.bossExclusive.streak,1);
 const b1=exclusiveBossNativeBonus(t,21);
 assert.deepEqual({pct:b1.percentage,extra:b1.extra,remainder:b1.remainder},{pct:3,extra:0,remainder:63});
 rememberExclusiveBossNativeHit(t,4,b1);
 const b2=exclusiveBossNativeBonus(t,21);
 assert.deepEqual({pct:b2.percentage,extra:b2.extra,remainder:b2.remainder},{pct:6,extra:1,remainder:89});
 rememberExclusiveBossNativeHit(t,3,b2);
 const b3=exclusiveBossNativeBonus(t,21);
 assert.equal(b3.percentage,9);
 assert.equal(b3.extra,2);
 rememberExclusiveBossNativeHit(t,0,b3);
 assert.equal(t.bossExclusive.streak,0);
 assert.equal(t.bossExclusive.bonusRemainder,0);
 assert.equal(exclusiveBossNativeBonus(t,21).active,false);
});
test('Tharsis nel motore reale aumenta la serie soltanto con colpi nativi che feriscono la barriera',()=>{
 const b=createTacticalDuel({shipA:'C01',levelA:1,shipB:'C02',levelB:1,bossPlanetB:2});
 b.sides.A.defense.shield.max=300;
 b.sides.A.defense.shield.hp=300;
 const first=cycle(b);
 assert.equal(first.sides.B.bossExclusive.streak,1);
 const next=advanceTacticalDuel(first,8101);
 const second=cycle(next,8201);
 assert.equal(second.sides.B.bossExclusive.streak,2);
 assert.ok(second.lastEvents.some(x=>x.includes('Tharsis · Assalto progressivo')));
 const blocked=createTacticalDuel({shipA:'C01',levelA:1,shipB:'C02',levelB:1,bossPlanetB:2});
 blocked.sides.A.defense.shield.hp=0;
 const ended=cycle(blocked);
 assert.equal(ended.sides.B.bossExclusive.streak,0);
});
