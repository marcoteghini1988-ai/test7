import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,TACTICAL_STARTER_TYPES,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {moduleCardType} from './tacticalEquipmentCards.js';
import {LEGACY_DICE_CARD,LEGACY_GOLD_CARD} from './tacticalLegacyEvents.js';
import {activateBossCharacter,bossCharacterApplyRegen} from './bossCharacterCards.js';
import {exclusiveNeurotoxinActive} from './tacticalExclusiveBosses.js';

const EMPTY={specialIndices:[],numericIndices:[]};
const deck=(...ids)=>[...ids,...TACTICAL_STARTER_TYPES.slice(ids.length)];
function hand(b,type,slot){
 const p=b.sides.A.special;let i=p.hand.findIndex(c=>c.type===type);
 if(i>=0){[p.hand[slot],p.hand[i]]=[p.hand[i],p.hand[slot]];return slot;}
 i=p.deck.findIndex(c=>c.type===type);
 assert.ok(i>=0,'carta autentica: '+type);
 [p.hand[slot],p.deck[i]]=[p.deck[i],p.hand[slot]];return slot;
}
function fight(b,a=EMPTY,z=EMPTY){
 const o1=sealTacticalOrder(b,'A',{...EMPTY,...a},100);
 assert.equal(o1.ok,true,o1.reason);
 const o2=sealTacticalOrder(o1.battle,'B',{...EMPTY,...z},101);
 assert.equal(o2.ok,true,o2.reason);
 return advanceTacticalDuel(o2.battle,101);
}
function poisoned(types=[],levels={},seed=18){
 const b=createTacticalDuel({mode:'campaign',shipA:'C01',shipB:'R04',
  levelA:1,levelB:1,bossPlanetB:3,seed,specialDeckA:deck(...types),
  equipmentLevelsA:levels});
 b.sides.A.defense.shield.hp=15;
 // Stato del ciclo successivo a un colpo matematico vero di Venere.
 b.sides.A.neurotoxinUntilRound=1;
 return b;
}
test('Venere: Carta Modulo di guarigione non aggira -10% sulla prima riparazione vera',()=>{
 const type=moduleCardType('taurus'),b=poisoned([type],{[type]:1});
 hand(b,type,0);
 const result=fight(b,{specialIndices:[0]});
 assert.equal(result.history[0].moduleActivations[0].actual,8);
 assert.equal(result.history[0].snapshots.prepared.A.defense.shield.hp,23);
 assert.equal(exclusiveNeurotoxinActive(result.sides.A,1),false);
 assert.equal(result.sides.A.special.discard.filter(c=>c.type===type).length,1);
});
test('Venere: una sola tossina, Riparazione autentica seguita da Modulo non paga due volte',()=>{
 const type=moduleCardType('taurus'),b=poisoned(['support-shield-repair',type],{[type]:1});
 hand(b,'support-shield-repair',0);hand(b,type,1);
 const result=fight(b,{specialIndices:[0,1]});
 assert.ok(result.lastEvents.some(x=>x.includes('barriera riparata +18')&&x.includes('Neurotossina')));
 assert.equal(result.history[0].moduleActivations[0].actual,9,'la seconda cura è normale');
 assert.equal(result.history[0].snapshots.prepared.A.defense.shield.hp,42);
 assert.equal(result.sides.A.special.discard.filter(c=>[type,'support-shield-repair'].includes(c.type)).length,2);
});
test('Venere: anche Dado autentico con faccia cura riceve -10%, mai bonus gratis',()=>{
 const b=poisoned([LEGACY_DICE_CARD],{},20);
 hand(b,LEGACY_DICE_CARD,0);
 b.sides.A.legacy.diceReady=true;
 b.sides.A.legacy.dicePatterns=['plus','minus','times'];
 const result=fight(b,{specialIndices:[0]});
 assert.equal(result.sides.A.legacy.lastDice.face,'heal');
 assert.equal(result.history[0].snapshots.prepared.A.defense.shield.hp,22,
  '8 cura nominale -> 7 reali con tossina');
 assert.equal(result.sides.A.special.discard.filter(c=>c.type===LEGACY_DICE_CARD).length,1);
});
test('Venere: Carta Dorata Cuori non aggira la Neurotossina',()=>{
 const b=poisoned([LEGACY_GOLD_CARD]);
 hand(b,LEGACY_GOLD_CARD,0);
 assert.equal(b.sides.A.numeric.hand[2].suit,'♥');
 assert.equal(b.sides.B.defense.parts.weapons.signature.op,'minus');
 const res=fight(b,{specialIndices:[0],goldenIndex:2,
  numericIndices:[3,2],vitalId:'weapons',op:'minus'});
 assert.ok(res.lastEvents.some(e=>e.includes('Carta Dorata ♥ attivata')&&e.includes(' · 7 barriera riparata')));
 assert.equal(res.sides.A.legacy.usedGoldenIds.length,1);
});
test('Venere contro Carta Personaggio Idra: la cura del turno successivo rispetta la tossina',()=>{
 const side=createTacticalDuel().sides.A;
 assert.equal(activateBossCharacter(side,'boss-character-11',1).ok,true);
 side.bossCharacter.regenDue=2;
 side.defense.shield.hp=40;
 side.neurotoxinUntilRound=2;
 assert.equal(bossCharacterApplyRegen(side,2),3);
 assert.equal(side.defense.shield.hp,43);
 assert.equal(side.neurotoxinUntilRound,0);
 assert.equal(bossCharacterApplyRegen(side,2),0);
});

test('Venere: nuova precisione nello stesso ciclo non cancella il veleno PRIMA della Dorata',()=>{
 const b=poisoned([LEGACY_GOLD_CARD]);
 hand(b,LEGACY_GOLD_CARD,0);
 const orderA={specialIndices:[0],goldenIndex:2,
  numericIndices:[3,2],vitalId:'weapons',op:'minus'};
 const orderB={numericIndices:[0,1],vitalId:'weapons',op:'minus'};
 const out=fight(b,orderA,orderB);
 assert.ok(out.lastEvents.some(x=>x.includes('Neurotossina inflitta')));
 assert.ok(out.lastEvents.some(x=>x.includes('Carta Dorata ♥ attivata')&&
  x.includes(' · 7 barriera riparata')),'il veleno gia attivo non e sostituito prima della cura');
 assert.equal(out.sides.A.neurotoxinUntilRound,2,
  'un nuovo colpo reale di Venere mantiene il veleno del ciclo seguente');
 assert.equal(out.sides.A.neurotoxinPendingRound??0,0);
});
