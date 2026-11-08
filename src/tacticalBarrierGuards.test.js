import test from 'node:test';
import assert from 'node:assert/strict';
import {REACTIVE_BARRIER_ABSORPTION,createTacticalBarrierGuard,consumeTacticalBarrierGuard}
 from './tacticalBarrierGuards.js';
import {TACTICAL_STARTER_TYPES,createTacticalDuel,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {moduleCardType} from './tacticalEquipmentCards.js';
import {bossCharacterActive,activateBossCharacter,bossCharacterApplyRegen}
 from './bossCharacterCards.js';
import {pvpTerrainDefinition,pvpTerrainEffects,pvpTerrainRepairAmount}
 from './pvpTerrainCards.js';

const idle={specialIndices:[],numericIndices:[]};
const deck=(...ids)=>[...ids,...TACTICAL_STARTER_TYPES.slice(ids.length)];
const all=p=>[...p.hand,...p.deck,...p.discard];
function reveal(b,key,type,slot=0){
 const pile=b.sides[key].special;
 const inHand=pile.hand.findIndex(c=>c.type===type);
 if(inHand>=0){
  [pile.hand[slot],pile.hand[inHand]]=[pile.hand[inHand],pile.hand[slot]];
  return slot;
 }
 const j=pile.deck.findIndex(c=>c.type===type);
 assert.ok(j>=0,'carta autentica nel mazzo');
 [pile.hand[slot],pile.deck[j]]=[pile.deck[j],pile.hand[slot]];
 return slot;
}
function play(b,a=idle,z=idle){
 const p=sealTacticalOrder(b,'A',{...idle,...a},100);
 assert.equal(p.ok,true,'A: '+p.reason);
 const q=sealTacticalOrder(p.battle,'B',{...idle,...z},101);
 assert.equal(q.ok,true,'B: '+q.reason);
 return advanceTacticalDuel(q.battle,101);
}
function impact(b,kind,by){return b.history.at(-1).impacts.find(x=>x.kind===kind&&x.by===by);}

test('Paratia e Modulo difensivo assorbono soltanto il totale della barriera, mai più di una carica',()=>{
 const g=createTacticalBarrierGuard({types:['tactic-reactive','tactic-impact'],moduleFx:{guard:6}});
 const first=consumeTacticalBarrierGuard(5,g);
 assert.deepEqual(first,{packet:0,absorbed:5,module:5,reactive:0,impact:0});
 const second=consumeTacticalBarrierGuard(14,g);
 assert.equal(second.module,1);
 assert.equal(second.reactive,REACTIVE_BARRIER_ABSORPTION);
 assert.equal(second.packet,3); // 14 - 1 - 9 = 4; 20% riduzione = 3
 const third=consumeTacticalBarrierGuard(10,g);
 assert.equal(third.module,0);
 assert.equal(third.reactive,0);
 assert.equal(third.packet,8);
 assert.equal(first.module+second.module+third.module,6);
 assert.equal(first.reactive+second.reactive+third.reactive,9);
 assert.equal(g.moduleGuardRemaining,0);
 assert.equal(g.reactiveRemaining,0);
 assert.equal(consumeTacticalBarrierGuard(10,null).packet,10);
});

test('Paratia Reattiva difende HP madre ma NON evita agli scudi delle scudiere di intercettare',()=>{
 const params={shipA:'R04',levelA:5,shipB:'R04',levelB:3,mode:'pvp',
  specialDeckB:deck('tactic-reactive'),seed:18};
 const original=createTacticalDuel(params);
 original.sides.B.defense.shield={hp:300,max:300};
 reveal(original,'B','tactic-reactive');
 const baseline=play(structuredClone(original),{escortAmmoIndex:3});
 const defended=play(original,{escortAmmoIndex:3},{specialIndices:[0]});
 const native=impact(defended,'barrier','A');
 const escort=impact(defended,'escort_barrier','A');
 assert.ok(native&&escort,'colpo nativo e colpo scudiera realmente presenti');
 assert.ok(native.packet>0&&escort.packet>0);
 assert.equal(native.intercepted,impact(baseline,'barrier','A').intercepted,
  'la protezione madre non modifica l’intercettazione delle scudiere');
 const guardUsed=native.guardAbsorbed+escort.guardAbsorbed;
 assert.equal(guardUsed,9,'un unico assorbimento tra salva madre e salva scudiera');
 assert.ok(defended.sides.B.defense.shield.hp>=baseline.sides.B.defense.shield.hp);
 assert.ok(defended.sides.B.special.discard.some(c=>c.type==='tactic-reactive'));
 assert.equal(all(defended.sides.B.special).length,24);
 assert.equal(all(defended.sides.A.numeric).length,52);
});

test('Terreno Plasma + Personaggio Gaia + Carta Modulo difensiva: tutte carte vere, protezioni su due salve',()=>{
 const module=moduleCardType('capricorn');
 const b=createTacticalDuel({shipA:'R04',levelA:5,shipB:'R04',levelB:5,seed:18,
  mode:'pvp',specialDeckA:deck('terrain-plasma'),
  specialDeckB:deck(module,'boss-character-1'),
  equipmentLevelsB:{[module]:5}});
 reveal(b,'A','terrain-plasma');
 reveal(b,'B',module,0);
 reveal(b,'B','boss-character-1',1);
 b.sides.B.defense.shield={hp:300,max:300};
 const result=play(b,{specialIndices:[0],escortAmmoIndex:3},{specialIndices:[0,1]});
 assert.equal(result.activeTerrain.id,'terrain-plasma');
 assert.equal(result.activeTerrain.untilRound,2);
 assert.equal(bossCharacterActive(result.sides.B,1)?.effect,'armor');
 const native=impact(result,'barrier','A'),escort=impact(result,'escort_barrier','A');
 assert.ok(native&&escort);
 assert.ok(native.intercepted>=0&&escort.intercepted>=0);
 const blocked=native.guardAbsorbed+escort.guardAbsorbed;
 assert.ok(blocked>0&&blocked<=11,'Capricorno L5 assorbe al massimo 11 HP complessivi');
 assert.ok(result.lastEvents.some(x=>x.includes('Carta Speciale assorbono')));
 for(const side of Object.values(result.sides)){
  assert.equal(all(side.special).length,24);
  assert.equal(all(side.numeric).length,52);
  assert.equal(side.special.hand.length,5);
  assert.equal(side.numeric.hand.length,7);
 }
 assert.equal(result.sides.B.special.discard.filter(c=>c.type===module).length,1);
 assert.equal(result.sides.B.special.discard.filter(c=>c.type==='boss-character-1').length,1);
 assert.equal(result.sides.A.special.discard.filter(c=>c.type==='terrain-plasma').length,1);
});

test('Terreno Plasma penalizza davvero la rigenerazione Idra e preserva la penalità del Generatore',()=>{
 const terrain=pvpTerrainDefinition('terrain-plasma').effects;
 assert.equal(pvpTerrainRepairAmount(20,terrain),18);
 assert.equal(pvpTerrainRepairAmount(4,terrain),3);
 const make=hp=>{
  const side=createTacticalDuel().sides.A;
  assert.equal(activateBossCharacter(side,'boss-character-11',1).ok,true);
  side.defense.shield.hp=40;
  side.defense.parts.shieldGenerator.hp=hp;
  side.bossCharacter.regenDue=2;
  return side;
 };
 const healthy=make(10),damaged=make(5),destroyed=make(0),neutral=make(10);
 assert.equal(bossCharacterApplyRegen(healthy,2,terrain),3);
 assert.equal(bossCharacterApplyRegen(damaged,2,terrain),1);
 assert.equal(bossCharacterApplyRegen(destroyed,2,terrain),0);
 assert.equal(bossCharacterApplyRegen(neutral,2,pvpTerrainEffects(null,2)),4);
 assert.equal(healthy.defense.shield.hp,43);
 assert.equal(damaged.defense.shield.hp,41);
 assert.equal(destroyed.defense.shield.hp,40);
 assert.equal(neutral.defense.shield.hp,44);
 assert.equal(bossCharacterApplyRegen(healthy,2,terrain),0);
});
