import test from 'node:test';
import assert from 'node:assert/strict';
import {tacticalBossDeckReady,tacticalAfroditeRepairAmount} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const EMPTY={numericIndices:[],specialIndices:[]};
function make(level=null){
 const b=createTacticalDuel({shipA:'C01',levelA:1,shipB:'C02',levelB:1});
 b.sides.A.defense.shield.hp=10;
 if(level)b.sides.A.bossNumericDeck={id:'planet_char_3',level};
 return b;
}
function realRepair(b){
 const pile=b.sides.A.special;
 const index=pile.hand.findIndex(c=>c.type==='support-shield-repair');
 if(index>=0){[pile.hand[0],pile.hand[index]]=[pile.hand[index],pile.hand[0]];return;}
 const j=pile.deck.findIndex(c=>c.type==='support-shield-repair');
 assert.ok(j>=0);
 [pile.hand[0],pile.deck[j]]=[pile.deck[j],pile.hand[0]];
}
function cycle(b,orderA=EMPTY,at=100){
 const a=sealTacticalOrder(b,'A',orderA,at);
 assert.equal(a.ok,true,a.reason);
 const x=sealTacticalOrder(a.battle,'B',EMPTY,at+1);
 assert.equal(x.ok,true,x.reason);
 return advanceTacticalDuel(x.battle,at+1);
}
test('Afrodite completa: mazzo equipaggiabile soltanto se realmente sbloccato',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_3'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_3',
  bossDeckInventory:{planet_char_3:{unlocked:true,level:6}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_3',bossDeckInventory:{}}).enabled,false);
});
test('Sintesi curativa usa i gradi originali 5%, 8%, 11%, solo dal livello 4',()=>{
 const a=make().sides.A;
 for(const [level,expected] of [[1,20],[2,20],[3,20],[4,21],[5,21],[6,22]]){
  a.bossNumericDeck={id:'planet_char_3',level};
  assert.equal(tacticalAfroditeRepairAmount(a,20),expected);
 }
 assert.equal(tacticalAfroditeRepairAmount(a,0),0);
 assert.equal(tacticalAfroditeRepairAmount(a,18),19);
 assert.equal(tacticalAfroditeRepairAmount(make().sides.A,20),20);
});
test('Riparazione reale +22 al livello 6, senza regalare carte o riparazioni al livello 3',()=>{
 const bonus=make(6),plain=make(),notUnlocked=make(3);
 for(const b of [bonus,plain,notUnlocked])realRepair(b);
 const a=cycle(bonus,{specialIndices:[0]});
 const x=cycle(plain,{specialIndices:[0]});
 const c=cycle(notUnlocked,{specialIndices:[0]});
 assert.equal(a.history[0].snapshots.prepared.A.defense.shield.hp,32);
 assert.equal(x.history[0].snapshots.prepared.A.defense.shield.hp,30);
 assert.equal(c.history[0].snapshots.prepared.A.defense.shield.hp,30);
 assert.ok(a.lastEvents.some(e=>e.includes('Sintesi curativa +2 HP effettivi')));
 assert.ok(a.sides.A.special.discard.some(c=>c.type==='support-shield-repair'));
 assert.deepEqual(a.sides.A.numeric,x.sides.A.numeric);
 const without=cycle(make(6));
 assert.equal(without.history[0].snapshots.prepared.A.defense.shield.hp,10);
});
test('Generatore danneggiato dimezza la vera riparazione, generatore KO la vieta',()=>{
 const damaged=make(6);
 damaged.sides.A.defense.parts.shieldGenerator.hp=5;
 realRepair(damaged);
 const a=cycle(damaged,{specialIndices:[0]});
 assert.equal(a.history[0].snapshots.prepared.A.defense.shield.hp,21);
 assert.ok(a.lastEvents.some(e=>e.includes('Sintesi curativa +1 HP effettivi')));
 const destroyed=make(6);
 destroyed.sides.A.defense.parts.shieldGenerator.hp=0;
 assert.equal(tacticalAfroditeRepairAmount(destroyed.sides.A,20),22);
 realRepair(destroyed);
 assert.equal(sealTacticalOrder(destroyed,'A',{specialIndices:[0]},100).reason,'repair_unavailable');
});
