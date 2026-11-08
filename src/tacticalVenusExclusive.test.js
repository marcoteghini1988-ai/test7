import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder
} from './simultaneousDuelEngine.js';
import {exclusiveNeurotoxinActive,exclusiveNeurotoxinRepairAmount,
 rememberExclusiveVenusPrecisionHit} from './tacticalExclusiveBosses.js';

const EMPTY={numericIndices:[],specialIndices:[]};
const VENUS_SHIELD_DECK=[
 ...Array(6).fill('support-shield-repair'),
 ...Array(6).fill('support-status-purge'),
 ...Array(6).fill('tactic-reactive'),
 ...Array(6).fill('tactic-scan')
];
function start({shield=40,loadout=false}={}){
 const battle=createTacticalDuel({shipA:'C01',shipB:'C02',levelA:1,levelB:1,
  bossPlanetB:3,specialDeckA:loadout?VENUS_SHIELD_DECK:null});
 battle.sides.A.defense.shield.hp=shield;
 return battle;
}
function resolve(b,orderA=EMPTY,orderB=EMPTY,at=100){
 const first=sealTacticalOrder(b,'A',orderA,at);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',orderB,at+1);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,at+1);
}
function bringToHand(side,type,slot){
 const hand=side.special.hand,deck=side.special.deck;
 if(hand[slot].type===type)return slot;
 const from=hand.findIndex(c=>c.type===type);
 if(from>=0){[hand[slot],hand[from]]=[hand[from],hand[slot]];return slot;}
 const di=deck.findIndex(c=>c.type===type);
 assert.ok(di>=0,'Carta reale mancante dal mazzo: '+type);
 [hand[slot],deck[di]]=[deck[di],hand[slot]];
 return slot;
}
function hit(b,at=100){
 // The B opening contains 8 and 5, so 8 - 5 = 3:
 // C01's weapons signature is minus-3. Shield=40 opens a vital.
 return resolve(b,EMPTY,{specialIndices:[],numericIndices:[0,1],
  vitalId:'weapons',op:'minus'},at);
}
test('Venere avvelena SOLO dopo un vero danno da precisione, senza colpi gratuiti',()=>{
 const real=hit(start());
 assert.equal(real.sides.A.defense.parts.weapons.hp,4);
 assert.equal(real.sides.A.neurotoxinUntilRound,2);
 assert.ok(real.lastEvents.some(s=>s.includes('Neurotossina inflitta')));
 const miss=resolve(start(),EMPTY,{numericIndices:[0,1],vitalId:'weapons',op:'plus'});
 assert.equal(miss.sides.A.defense.parts.weapons.hp,10);
 assert.equal(miss.sides.A.neurotoxinUntilRound,0);
 const blocked=hit(start({shield:60}));
 assert.equal(blocked.sides.A.defense.parts.weapons.hp,10);
 assert.equal(blocked.sides.A.neurotoxinUntilRound,0);
 const counter=resolve(start(),{specialIndices:[4],counterVitalId:'weapons'},
  {numericIndices:[0,1],vitalId:'weapons',op:'minus'});
 assert.equal(counter.sides.A.defense.parts.weapons.hp,10);
 assert.equal(counter.sides.A.neurotoxinUntilRound,0);
});

test('Una riparazione vera perde il 10% nel successivo ciclo; il veleno scade anche senza riparare',()=>{
 const poisoned=hit(start({loadout:true}));
 assert.equal(exclusiveNeurotoxinActive(poisoned.sides.A,2),true);
 assert.equal(exclusiveNeurotoxinRepairAmount(poisoned.sides.A,2,20),18);
 const next=advanceTacticalDuel(poisoned,8102);
 assert.equal(next.round,2);
 bringToHand(next.sides.A,'support-shield-repair',0);
 const repaired=resolve(next,{specialIndices:[0]},EMPTY,8200);
 assert.ok(repaired.lastEvents.some(s=>s.includes('barriera riparata +18')&&s.includes('Neurotossina')));
 assert.equal(repaired.sides.A.neurotoxinUntilRound,0);
 const third=advanceTacticalDuel(repaired,16300);
 assert.equal(third.round,3);
 bringToHand(third.sides.A,'support-shield-repair',0);
 const clean=resolve(third,{specialIndices:[0]},EMPTY,16400);
 assert.ok(clean.lastEvents.some(s=>s.includes('barriera riparata +20')));
 assert.equal(clean.sides.A.neurotoxinUntilRound,0);
});

test('Pulizia Sistemi autentica neutralizza la Neurotossina prima della riparazione nella stessa preparazione',()=>{
 const first=hit(start({loadout:true}));
 const second=advanceTacticalDuel(first,8102);
 bringToHand(second.sides.A,'support-status-purge',0);
 bringToHand(second.sides.A,'support-shield-repair',1);
 assert.equal(validateTacticalOrder(second,'A',{specialIndices:[0,1]}).ok,true);
 const cured=resolve(second,{specialIndices:[0,1]},EMPTY,8200);
 assert.ok(cured.lastEvents.some(s=>s.includes('Neurotossina rimossa')));
 assert.ok(cured.lastEvents.some(s=>s.includes('barriera riparata +20')));
 assert.equal(cured.sides.A.neurotoxinUntilRound,0);
 assert.ok(cured.sides.A.special.discard.some(c=>c.type==='support-status-purge'));
 assert.ok(cured.sides.A.special.discard.some(c=>c.type==='support-shield-repair'));
});

test('Niente neurotossina gratuita, nessuna lettura nascosta, solo boss Venere',()=>{
 const normal={bossExclusive:null},enemy={neurotoxinUntilRound:0};
 assert.equal(rememberExclusiveVenusPrecisionHit(normal,enemy,10,1),false);
 assert.equal(enemy.neurotoxinUntilRound,0);
 normal.bossExclusive={id:3};
 assert.equal(rememberExclusiveVenusPrecisionHit(normal,enemy,0,1),false);
 assert.equal(rememberExclusiveVenusPrecisionHit(normal,enemy,10,1),true);
 assert.equal(enemy.neurotoxinUntilRound,2);
 assert.equal(exclusiveNeurotoxinRepairAmount(enemy,1,20),20);
});
