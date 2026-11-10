import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,chooseOfficialLiveAiAction,applyOfficialLiveAction}
 from './officialLiveDuelEngine.js';
import {TACTICAL_BOSS_PLANS} from './tacticalSpecialPresets.js';
import {VITAL_IDS} from './vitalDefense.js';
const ids=[1,2,3,6,7,8,9,11,14,17,19,20];

test('12 boss LIVE: aprono prima il sistema vitale previsto dalla propria identità strategica',()=>{
 assert.equal(Object.keys(TACTICAL_BOSS_PLANS).length,12);
 for(const id of ids){
  const targetOrder=TACTICAL_BOSS_PLANS[id].targets;
  assert.equal(targetOrder.length,4,id);
  assert.deepEqual([...targetOrder].sort(),[...VITAL_IDS].sort(),id);
  let b=createOfficialLiveDuel(createTacticalDuel({
   shipA:'C01',shipB:'N00',levelA:1,levelB:1,bossPlanetB:id,nowMs:0
  }),0);
  b.turn=2;b.round=1;b.activeSide='B';
  b.sides.A.defense.shield.hp=45;
  const first=chooseOfficialLiveAiAction(b);
  assert.equal(first.type,'expose','boss '+id);
  assert.equal(first.vitalId,targetOrder[0],'priorità identitaria '+id);
  const result=applyOfficialLiveAction(b,'B',first,1);
  assert.equal(result.ok,true,'boss '+id+' ha esposizione lecita');
  assert.equal(result.battle.sides.A.defense.parts[targetOrder[0]].exposed,true);
  assert.equal(result.battle.sides.A.defense.shield.hp,45);
  assert.equal(result.battle.actionUsed.numeric,0);
 }
});
test('Avversario normale mantiene priorità base engine e non eredita i boss',()=>{
 const b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'C01',shipB:'N00',nowMs:0
 }),0);
 b.turn=2;b.activeSide='B';b.sides.A.defense.shield.hp=45;
 const choice=chooseOfficialLiveAiAction(b);
 assert.deepEqual(choice,{type:'expose',vitalId:'engine'});
 assert.equal(b.sides.B.bossPlanetId,null);
});
