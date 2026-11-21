// Diagnosi del ritmo del vero motore FleetNext, senza Personaggi e carte.
// E' una baseline a tempo simulato: non prova la durata reale del PvP.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {FLEET_PACING_WINDOWS} from './fleetNext/battlePacing.js';

function playBaseline(a,b,averageSeconds=20){
 let battle=createFleetNextBattle({shipA:a,shipB:b,
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  ruleset:HP_SYNC_RULESET,mode:'pvp',supportRosterA:[],supportRosterB:[],
  deckA:[],deckB:[],seed:120,nowMs:0});
 let attempts=0;
 while(battle.phase==='playing'&&attempts<55){
  const who=battle.turn,order={cards:[],pass:false,
   targetKind:'part',targetId:'weapons',partId:'weapons'};
  const timestamp=battle.turnStartedAtMs+averageSeconds*1000;
  const next=resolveFleetNextTurn(battle,who,order,timestamp);
  assert.equal(next.ok,true,a+'/'+b+' '+who+': '+next.reason);
  assert.ok(next.battle.sides.A.ships[0].hp>=0);
  assert.ok(next.battle.sides.B.ships[0].hp>=0);
  battle=next.battle;attempts++;
 }
 assert.equal(battle.phase,'finished',a+'/'+b+' non termina entro 55 turni');
 return {motherA:a,motherB:b,turns:battle.ply,
  estimatedSeconds:Math.round((battle.finishedAtMs||battle.turnStartedAtMs)/1000),
  winner:battle.winner};
}

test('Ritmo baseline di sei coppie Leggendarie, non un limite forzato in minuti',()=>{
 const samples=[['L04','L03'],['N00','R02'],['C01','L04'],
  ['C02','E02'],['R04','E01'],['C03','R01']]
  .map(([a,b])=>playBaseline(a,b));
 assert.equal(samples.length,6);
 assert.ok(samples.every(x=>x.turns>=2&&x.turns<=55));
 assert.equal(FLEET_PACING_WINDOWS.pvp.targetSeconds,330);
 console.log('BALANCE_PVP_20S_TURN='+JSON.stringify(samples));
});
