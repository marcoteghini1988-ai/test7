import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel} from './officialLiveDuelEngine.js';
import {officialBattleResult} from './officialBattleSetup.js';

function ended(live,winner='A'){
 const tactical=createTacticalDuel({shipA:'C01',shipB:'N00',nowMs:0,mode:'campaign'});
 const battle=live?createOfficialLiveDuel(tactical,0):tactical;
 battle.phase='finished';battle.winner=winner;
 return battle;
}
test('La campagna LIVE è alternata: non viene più dichiarata simultanea al termine',()=>{
 const b=ended(true),r=officialBattleResult(b,'campaign',7);
 assert.equal(r.winner,'player');
 assert.equal(r.eligibleForRewards,true);
 assert.equal(r.meta.matchStats.liveDuel,true);
 assert.equal(r.meta.matchStats.simultaneousDuel,false);
 assert.equal(r.meta.matchStats.sectorNumber,7);
});
test('Il vecchio duello mantiene il proprio metadato simultaneo',()=>{
 const b=ended(false),r=officialBattleResult(b,'campaign',7);
 assert.equal(r.meta.matchStats.liveDuel,false);
 assert.equal(r.meta.matchStats.simultaneousDuel,true);
});
test('Il PvP resta simulato e non genera ricompense né nuove sessioni online',()=>{
 const b=ended(true),r=officialBattleResult(b,'pvp',1);
 assert.equal(r.winner,'player');
 assert.equal(r.eligibleForRewards,false);
 assert.equal(r.meta.matchStats.liveDuel,true);
 assert.equal(r.meta.matchStats.simultaneousDuel,false);
 assert.equal(r.meta.matchStats.bossPlanetId,null);
});
test('Pareggio e sconfitta della campagna non consegnano premi',()=>{
 for(const winner of ['draw','B']){
  const b=ended(true,winner);
  const r=officialBattleResult(b,'campaign',10);
  assert.equal(r.eligibleForRewards,false);
  assert.equal(r.winner,winner==='B'?'enemy':'draw');
  assert.equal(r.meta.starsEarned.some(Boolean),false);
 }
});
