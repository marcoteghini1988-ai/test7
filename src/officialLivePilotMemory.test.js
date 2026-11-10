import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction} from './officialLiveDuelEngine.js';
import {liveCommanderRememberVital} from './officialLiveCommanderDefense.js';

function game(){
 return createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'C01',levelA:1,levelB:1,nowMs:0,
  commanderA:{id:'pilot_boss_2',level:5},
  commanderB:{id:'pilot_boss_1',level:5}
 }),0);
}
function play(b,action,t){
 const r=applyOfficialLiveAction(b,'A',action,t);
 assert.equal(r.ok,true,JSON.stringify({action,reason:r.reason}));
 return r.battle;
}
test('Memoria pilota non viene falsata da una formula invalida o danno zero',()=>{
 const b=game(),a=b.sides.A,def=b.sides.B;
 const fake=[{value:1,suit:'♥'},{value:1,suit:'♦'}];
 assert.equal(liveCommanderRememberVital(a,def,
  {vitalId:'engine',op:'times',cards:fake,damage:10}),false);
 assert.equal(liveCommanderRememberVital(a,def,
  {vitalId:'engine',op:'times',cards:[{value:3,suit:'♥'},{value:4,suit:'♦'}],damage:0}),false);
 assert.equal(a.commander.lastVitalHit,undefined);
 assert.equal(def.commander.receivedMotherHits,undefined);
});
test('LIVE registra operazione e vitale soltanto dopo formula di due carte autentiche',()=>{
 let b=game();
 const pile=b.sides.A.numeric;
 const all=[...pile.hand,...pile.deck,...pile.discard];
 const p3=all.find(c=>c.value===3&&c.suit==='♥');
 const p4=all.find(c=>c.value===4&&c.suit==='♦');
 assert.ok(p3&&p4);
 const rest=all.filter(c=>c.id!==p3.id&&c.id!==p4.id);
 pile.hand=[p3,p4,...rest.slice(0,5)];
 pile.deck=rest.slice(5);pile.discard=[];
 b.sides.B.defense.shield.hp=45;
 b=play(b,{type:'expose',vitalId:'engine'},1);
 b=play(b,{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 assert.equal(b.sides.A.commander.lastVitalHit,undefined,'slot incompleto non premia pilota');
 b=play(b,{type:'numeric',index:0,target:'vital',vitalId:'engine'},3);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.A.commander.successfulMotherHits,1);
 assert.equal(b.sides.A.commander.lastVitalHit,'engine');
 assert.equal(b.sides.A.commander.lastOp,'times');
 assert.deepEqual(b.sides.A.commander.visitedVitals,['engine']);
 assert.equal(b.sides.B.commander.receivedMotherHits,1);
 assert.equal(b.sides.A.numeric.hand.length,5);
 assert.equal(b.history.some(e=>e.kind==='vital_destroyed'),true);
});
