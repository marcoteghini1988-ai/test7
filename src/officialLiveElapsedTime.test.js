import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,
 finishOfficialLiveTurn,LIVE_MAX_TURNS,LIVE_TURN_MS}
 from './officialLiveDuelEngine.js';
import {exposeMotherPart} from './vitalDefense.js';
import {officialBattleResult} from './officialBattleSetup.js';

test('Report LIVE: durata REALE fra avvio e distruzione ultimo vitale, non turni teorici',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'C01',levelA:1,levelB:1,nowMs:1000
 }),1000);
 assert.equal(b.startedAtMs,1000);
 assert.equal(b.finishedAtMs,null);
 // Stato di gara autentico a un solo vitale mancante: il motore deve
 // ricevere due vere numeriche per la Coppia di comando del C01.
 b.sides.B.defense.shield.hp=0;
 for(const id of ['engine','weapons','shieldGenerator'])
  b.sides.B.defense.parts[id].hp=0;
 const ex=exposeMotherPart(b.sides.B.defense,'command');
 assert.equal(ex.exposed,true);
 b.sides.B.defense=ex.defense;
 const first=b.sides.A.numeric.hand.findIndex(c=>c.value===7&&c.suit==='♠');
 assert.ok(first>=0);
 const a=applyOfficialLiveAction(b,'A',
  {type:'numeric',index:first,target:'vital',vitalId:'command'},2000);
 assert.equal(a.ok,true,a.reason);b=a.battle;
 assert.equal(b.phase,'playing');
 const second=b.sides.A.numeric.hand.findIndex(c=>c.value===7&&c.suit==='♥');
 assert.ok(second>=0);
 const z=applyOfficialLiveAction(b,'A',
  {type:'numeric',index:second,target:'vital',vitalId:'command'},9000);
 assert.equal(z.ok,true,z.reason);b=z.battle;
 assert.equal(b.phase,'finished');assert.equal(b.winner,'A');
 assert.equal(b.finishedAtMs,9000);
 assert.equal(b.liveFinishReason,'four_vitals');
 const report=officialBattleResult(b,'campaign',1);
 assert.equal(report.meta.matchStats.elapsedSeconds,8);
 assert.equal(report.meta.matchStats.elapsedMinutes,0.1);
 assert.equal(report.meta.matchStats.finishReason,'four_vitals');
 assert.equal(report.meta.matchStats.enemyVitalsDestroyed,4);
 assert.equal(report.eligibleForRewards,true);
});
test('Pareggio LIVE per raggiunto limite: tempo dichiarato e nessuna ricompensa',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'C01',levelA:1,levelB:1,nowMs:0
 }),0);
 for(let i=1;i<=LIVE_MAX_TURNS;i++)
  b=finishOfficialLiveTurn(b,i*1000);
 assert.equal(b.phase,'finished');
 assert.equal(b.winner,'draw');
 assert.equal(b.turn,LIVE_MAX_TURNS+1);
 assert.equal(b.finishedAtMs,LIVE_MAX_TURNS*1000);
 assert.equal(b.liveFinishReason,'turn_cap');
 assert.equal(LIVE_TURN_MS,30000,'turno regolare invariato');
 const report=officialBattleResult(b,'campaign',1);
 assert.equal(report.meta.matchStats.elapsedSeconds,LIVE_MAX_TURNS);
 assert.equal(report.meta.matchStats.finishReason,'turn_cap');
 assert.equal(report.eligibleForRewards,false);
 assert.equal(finishOfficialLiveTurn(b,50000),b,'nessun turno fantasma dopo il pareggio');
});
test('Report legacy e salvataggi manuali non inventano una durata LIVE',()=>{
 const old=createTacticalDuel({nowMs:0});
 old.phase='finished';old.winner='A';
 const legacy=officialBattleResult(old,'campaign',1);
 assert.equal(legacy.meta.matchStats.elapsedSeconds,null);
 assert.equal(legacy.meta.matchStats.elapsedMinutes,null);
 assert.equal(legacy.meta.matchStats.finishReason,null);
 const live=createOfficialLiveDuel(createTacticalDuel({nowMs:0}),0);
 live.phase='finished';live.winner='B';
 const restored=officialBattleResult(live,'campaign',1);
 assert.equal(restored.meta.matchStats.elapsedSeconds,null);
 assert.equal(restored.meta.matchStats.finishReason,null);
 assert.equal(restored.eligibleForRewards,false);
});
test('Comando non valido non sposta l’orologio del duello',()=>{
 const b=createOfficialLiveDuel(createTacticalDuel({nowMs:1000}),1000);
 const r=applyOfficialLiveAction(b,'A',{type:'numeric',index:999,target:'ship'},2000);
 assert.equal(r.ok,false);
 assert.equal(r.battle,b);
 assert.equal(b.lastActionAtMs,undefined);
 assert.equal(b.finishedAtMs,null);
});
