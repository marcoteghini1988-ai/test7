import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder,TACTICAL_STARTER_TYPES} from './simultaneousDuelEngine.js';
import {damageMotherShield,exposeMotherPart,VITAL_IDS} from './vitalDefense.js';
import {selectTacticalEscortForAmmo} from './tacticalEscortVolley.js';
import {planTacticalAi} from './tacticalDuelAi.js';

test('IA locale prepara ordini legali senza leggere mano numerica o ordine segreto avversario',()=>{
 const b=createTacticalDuel();
 const first=planTacticalAi(b,'B');
 assert.equal(validateTacticalOrder(b,'B',first).ok,true);
 const x=structuredClone(b);
 x.sides.A.numeric.hand.reverse();
 x.sides.A.special.hand.reverse();
 x.orders.A={specialIndices:[],numericIndices:[0,1],vitalId:'weapons',op:'plus'};
 assert.deepEqual(planTacticalAi(x,'B'),first);
});
test('IA locale può giocare una partita fino al risultato senza carte inventate né round infiniti',()=>{
 let battle=createTacticalDuel();
 let now=0;
 for(let i=0;i<20&&battle.phase!=='finished';i++){
  now+=100;
  const ai=planTacticalAi(battle,'B');
  const b=sealTacticalOrder(battle,'B',ai,now);
  assert.equal(b.ok,true,b.reason);
  const a=sealTacticalOrder(b.battle,'A',{specialIndices:[],numericIndices:[]},now);
  assert.equal(a.ok,true,a.reason);
  battle=advanceTacticalDuel(a.battle,now);
  assert.equal(battle.phase,'resolving');
  for(const key of ['A','B']){
   const side=battle.sides[key];
   assert.equal(side.numeric.hand.length+side.numeric.deck.length+side.numeric.discard.length,52);
   assert.equal(side.special.hand.length+side.special.deck.length+side.special.discard.length,24);
  }
  now+=8000;
  battle=advanceTacticalDuel(battle,now);
 }
 assert.equal(battle.phase,'finished');
 assert.ok(['A','B','draw'].includes(battle.winner));
 assert.ok(battle.history.length>=1&&battle.history.length<=20);
});

test('IA senza formula ruota il ricambio gratuito sui sette slot veri anziche bloccare la mano',()=>{
 const base=createTacticalDuel({shipA:'C01',shipB:'R04',seed:18});
 base.sides.B.defense.shield={hp:300,max:300};
 for(let round=1;round<=7;round++){
  const battle=structuredClone(base);
  battle.round=round;
  const plan=planTacticalAi(battle,'A');
  assert.equal(plan.numericIndices.length,0);
  assert.equal(plan.exchangeIndices[0],round-1,'Il ricambio non resta bloccato allo slot 0');
  assert.equal(validateTacticalOrder(battle,'A',plan).ok,true);
 }
 assert.equal(base.sides.A.numeric.hand.length,7);
 assert.equal(base.sides.A.numeric.hand.length+base.sides.A.numeric.deck.length+base.sides.A.numeric.discard.length,52);
});

test('IA sceglie 3 numeriche per chiudere 8 HP, ma ne risparmia una a 6 o 10 HP',()=>{
 const base=createTacticalDuel({shipA:'C01',shipB:'R04',seed:18});
 const pile=base.sides.A.numeric;
 const all=[...pile.hand,...pile.deck];
 const chosen=[];
 for(const value of [4,5,2,3,4]){
  const card=all.find(c=>c.value===value&&!chosen.some(s=>s.id===c.id));
  assert.ok(card,'carta autentica '+value);
  chosen.push(card);
 }
 const selectedIds=new Set(chosen.map(c=>c.id));
 const rest=all.filter(c=>!selectedIds.has(c.id));
 pile.hand=[...chosen,...rest.slice(0,2)];
 pile.deck=rest.slice(2);
 assert.equal(pile.hand.length+pile.deck.length,52);
 base.sides.B.defense.shield.hp=0;
 base.sides.B.defense.parts.shieldGenerator.exposed=true;
 for(const [hp,expected] of [[10,2],[8,3],[6,2]]){
  const b=structuredClone(base);
  b.sides.B.defense.parts.shieldGenerator.hp=hp;
  const order=planTacticalAi(b,'A');
  assert.equal(order.vitalId,'shieldGenerator');
  assert.equal(order.numericIndices.length,expected,'HP '+hp);
  assert.equal(validateTacticalOrder(b,'A',order).ok,true);
 }
});

function placeRealSpecialsInHand(side,types){
 const pile=side.special;
 for(let i=0;i<types.length;i++){
  if(pile.hand[i]?.type===types[i])continue;
  const handIndex=pile.hand.findIndex((c,j)=>j>i&&c.type===types[i]);
  if(handIndex>=0)[pile.hand[i],pile.hand[handIndex]]=[pile.hand[handIndex],pile.hand[i]];
  else{
   const deckIndex=pile.deck.findIndex(c=>c.type===types[i]);
   assert.ok(deckIndex>=0,'carta '+types[i]+' esistente nel mazzo di 24');
   [pile.hand[i],pile.deck[deckIndex]]=[pile.deck[deckIndex],pile.hand[i]];
  }
 }
 assert.equal(pile.hand.length+pile.deck.length+pile.discard.length,24);
}
test('Contromisura IA contro Io: protegge la barriera nell eruzione pubblica usando speciali realmente pescate',()=>{
 const b=createTacticalDuel({shipA:'C03',levelA:3,shipB:'L03',levelB:3,
  seed:171,nowMs:100,bossPlanetB:19,specialDeckA:[...TACTICAL_STARTER_TYPES]});
 assert.equal(b.sides.B.bossExclusive?.id,19);
 b.round=2; // fase eruzione visibile a tutti; non un ordine segreto.
 b.sides.A.defense.shield.hp=30;
 placeRealSpecialsInHand(b.sides.A,[
  'tactic-scan','tactic-reactive','tactic-impact',
  'support-shield-repair','tactic-numeric-recycle'
 ]);
 const order=planTacticalAi(b,'A');
 const types=order.specialIndices.map(i=>b.sides.A.special.hand[i].type);
 assert.deepEqual(types,['support-shield-repair','tactic-reactive']);
 assert.equal(validateTacticalOrder(b,'A',order).ok,true);
 assert.equal(b.sides.A.special.hand.length+b.sides.A.special.deck.length,24,
  'nessun effetto gratuito e nessuna carta aggiunta');
});
test('IA non consuma Scansione se tutti i vitali ancora vivi sono già visibili',()=>{
 const b=createTacticalDuel({shipA:'C03',levelA:3,shipB:'E03',levelB:3,
  seed:171,nowMs:100,specialDeckA:[...TACTICAL_STARTER_TYPES]});
 placeRealSpecialsInHand(b.sides.A,[
  'tactic-scan','tactic-numeric-recycle','tactic-reactive',
  'tactic-impact','support-shield-repair'
 ]);
 let defense=damageMotherShield(b.sides.B.defense,60).defense;
 for(const id of VITAL_IDS)defense=exposeMotherPart(defense,id).defense;
 assert.equal(VITAL_IDS.every(id=>defense.parts[id].exposed),true);
 b.sides.B.defense=defense;
 assert.deepEqual(b.sides.A.seen,[]);
 const order=planTacticalAi(b,'A');
 assert.equal(order.specialIndices.some(i=>b.sides.A.special.hand[i].type==='tactic-scan'),false);
 assert.equal(validateTacticalOrder(b,'A',order).ok,true);
});

test('L IA non spreca una numerica scudiera quando barriera e generatore nemici sono entrambi a zero',()=>{
 const battle=createTacticalDuel({shipA:'E03',levelA:5,shipB:'E03',levelB:5,
  seed:171,nowMs:100});
 assert.equal(battle.sides.A.escorts.length,2);
 assert.ok(battle.sides.A.numeric.hand.some(c=>
  selectTacticalEscortForAmmo(battle.sides.A,c)),
  'deve esistere davvero una munizione compatibile');
 const beforeIds=[...battle.sides.A.numeric.hand,...battle.sides.A.numeric.deck].map(c=>c.id);
 battle.sides.B.defense.shield.hp=0;
 battle.sides.B.defense.parts.shieldGenerator.hp=0;
 const order=planTacticalAi(battle,'A');
 assert.equal(order.escortAmmoIndex,null,
  'barriera collassata e irreparabile: le numeriche si conservano per i vitali');
 assert.equal(validateTacticalOrder(battle,'A',order).ok,true);
 assert.deepEqual([...battle.sides.A.numeric.hand,...battle.sides.A.numeric.deck].map(c=>c.id),
  beforeIds,'la decisione IA non modifica il mazzo senza sigillare un ordine');
 const stillRepairable=structuredClone(battle);
 stillRepairable.sides.B.defense.parts.shieldGenerator.hp=10;
 stillRepairable.sides.B.defense.shield.hp=20;
 const validAmmo=planTacticalAi(stillRepairable,'A');
 assert.equal(validateTacticalOrder(stillRepairable,'A',validAmmo).ok,true,
  'il comportamento ordinario con barriera attiva rimane valido');
 assert.notEqual(validAmmo.escortAmmoIndex,null,
  'le scudiere restano armabili finche esiste una vera barriera avversaria');
});
