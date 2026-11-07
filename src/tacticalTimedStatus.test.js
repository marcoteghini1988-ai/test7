import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOT_RULES} from './strategicShots.js';
import {tacticalCombatClock,tacticalStatusDuration,tacticalStatusActive,
 applyTacticalTimedStatus,clearTacticalTimedStatuses} from './tacticalTimedStatus.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {tacticalBossDeckReady} from './tacticalBossDecks.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const EMPTY={specialIndices:[],numericIndices:[]};
const CONTROL_DECK=[
 ...Array(6).fill('shot-ion'),...Array(6).fill('shot-corrosion'),
 ...Array(6).fill('tactic-scan'),...Array(6).fill('tactic-impact')
];
const side=(id,level)=>({bossNumericDeck:id?{id,level}:null});
const fight=(bossId=null,level=3,type='shot-ion',arenaId='titanium')=>{
 const b=createTacticalDuel({shipA:'R04',levelA:3,shipB:'C02',levelB:1,
  specialDeckB:CONTROL_DECK,bossNumericDeckA:bossId?{id:bossId,level}:null,arenaId});
 const hand=b.sides.B.special.hand,deck=b.sides.B.special.deck;
 if(hand[0].type!==type){
  const i=hand.findIndex(c=>c.type===type);
  if(i>=0)[hand[0],hand[i]]=[hand[i],hand[0]];
  else{
   const j=deck.findIndex(c=>c.type===type);
   assert.ok(j>=0);
   [hand[0],deck[j]]=[deck[j],hand[0]];
  }
 }
 const a=sealTacticalOrder(b,'A',EMPTY,100);assert.equal(a.ok,true);
 const c=sealTacticalOrder(a.battle,'B',{specialIndices:[0]},101);
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,101);
};

test('Durate storiche originali restano 12s e 15s; la preparazione da 30s non le consuma',()=>{
 assert.equal(SHOT_RULES.ionizedDurationMs,12000);
 assert.equal(SHOT_RULES.corrosionDurationMs,15000);
 assert.equal(tacticalStatusDuration(side(null),'ionized'),12000);
 assert.equal(tacticalStatusDuration(side(null),'corroded'),15000);
 assert.equal(tacticalCombatClock(1),0);
 assert.equal(tacticalCombatClock(2),8000);
 assert.equal(tacticalCombatClock(3),16000);
 assert.equal(tacticalStatusDuration(side(null),'heated'),0);
});

test('Isolamento ionico L1-L3 15/25/35% sulla durata, non su danno nativo',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_7'),true);
 assert.deepEqual([1,2,3].map(level=>tacticalStatusDuration(side('planet_char_7',level),'ionized')),
  [10200,9000,7800]);
 assert.equal(tacticalStatusDuration(side('planet_char_7',3),'corroded'),15000);
 assert.equal(tacticalStatusDuration(side('planet_char_7',3),'ionized',{ionDurationFactor:.75}),5850);
});

test('Schermatura instabile Generatore L1-L3 -15/25/35% su entrambi gli status',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_14'),true);
 assert.deepEqual([1,2,3].map(level=>tacticalStatusDuration(side('planet_char_14',level),'ionized')),
  [10200,9000,7800]);
 assert.deepEqual([1,2,3].map(level=>tacticalStatusDuration(side('planet_char_14',level),'corroded')),
  [12750,11250,9750]);
 assert.equal(tacticalStatusDuration(side('planet_char_14',3),'ionized',{ionDurationFactor:.75}),5850);
});

test('Status reali: un colpo nativo con Ion attiva 12s, una resistenza L3 lo spegne prima dello scontro seguente',()=>{
 const normal=fight(),resistant=fight('planet_char_7',3);
 assert.ok(normal.history[0].shieldB>0);
 assert.ok(resistant.history[0].shieldB>0);
 assert.equal(normal.sides.A.statusUntil.ionized,12000);
 assert.equal(resistant.sides.A.statusUntil.ionized,7800);
 assert.equal(normal.sides.A.ionized,true);
 assert.equal(resistant.sides.A.ionized,false);
 assert.equal(tacticalStatusActive(normal.sides.A,'ionized',2),true);
 assert.equal(tacticalStatusActive(resistant.sides.A,'ionized',2),false);
 assert.equal(normal.lastEvents.some(s=>s.includes('ionizzazione 12 s')),true);
 assert.equal(resistant.lastEvents.some(s=>s.includes('ionizzazione 7.8 s')),true);
});

test('Corrosione autentica dura 15s, Generatore L3 solo 9.75s, senza variare le firme',()=>{
 const normal=fight(null,3,'shot-corrosion');
 const reduced=fight('planet_char_14',3,'shot-corrosion');
 assert.ok(normal.history[0].shieldB>0);
 assert.equal(normal.sides.A.statusUntil.corroded,15000);
 assert.equal(reduced.sides.A.statusUntil.corroded,9750);
 assert.equal(normal.sides.A.corroded,true);
 assert.equal(reduced.sides.A.corroded,true);
 assert.equal(normal.sides.A.defense.parts.engine.signature.kind,
  reduced.sides.A.defense.parts.engine.signature.kind);
 assert.deepEqual(normal.sides.B.numeric,reduced.sides.B.numeric);
});

test('Arena Ionica e resistenza si moltiplicano, senza creare altri status',()=>{
 const normal=fight(null,3,'shot-ion','ionic');
 const reduced=fight('planet_char_7',3,'shot-ion','ionic');
 assert.equal(normal.sides.A.statusUntil.ionized,9000);
 assert.equal(reduced.sides.A.statusUntil.ionized,5850);
 assert.equal(tacticalStatusActive(normal.sides.A,'ionized',2),true);
 assert.equal(tacticalStatusActive(reduced.sides.A,'ionized',2),false);
});

test('Pulizia Sistemi cancella sia la durata sia il flag, impedendo la riattivazione fantasma',()=>{
 const s=side('planet_char_14',3);
 const first=applyTacticalTimedStatus(s,'ionized',1,{});
 assert.equal(first.untilMs,7800);
 assert.equal(tacticalStatusActive(s,'ionized',1),true);
 applyTacticalTimedStatus(s,'corroded',1,{});
 clearTacticalTimedStatuses(s);
 assert.equal(tacticalStatusActive(s,'ionized',1),false);
 assert.equal(tacticalStatusActive(s,'corroded',1),false);
 assert.deepEqual(s.statusUntil,{ionized:0,corroded:0});
});

test('Inventario originale: Ion e Generatore solo se posseduti',()=>{
 for(const id of ['planet_char_7','planet_char_14']){
  assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
   selectedBossDeck:id,bossDeckInventory:{}}).enabled,false);
  assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
   selectedBossDeck:id,bossDeckInventory:{[id]:{unlocked:true,level:3}}}).enabled,true);
 }
});
