import test from 'node:test';
import assert from 'node:assert/strict';
import {PVP_TERRAIN_CATALOG,pvpTerrainRepairAmount} from './pvpTerrainCards.js';
import {createTacticalDuel,TACTICAL_STARTER_TYPES,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {moduleCardType} from './tacticalEquipmentCards.js';
import {LEGACY_DICE_CARD,LEGACY_GOLD_CARD,LEGACY_MALUS_CARD,quantumFace,
 prepareLegacyTactics,resolveLegacyTactics} from './tacticalLegacyEvents.js';
import {activateBossCharacter} from './bossCharacterCards.js';

const idle={numericIndices:[],specialIndices:[]};
const deck=(...ids)=>[...ids,...TACTICAL_STARTER_TYPES.slice(ids.length)];
const modifiers=PVP_TERRAIN_CATALOG['terrain-plasma'].effects;
function offer(b,key,type,slot=0){
 const pile=b.sides[key].special,handIndex=pile.hand.findIndex(c=>c.type===type);
 if(handIndex>=0){
  [pile.hand[slot],pile.hand[handIndex]]=[pile.hand[handIndex],pile.hand[slot]];
  return slot;
 }
 const at=pile.deck.findIndex(c=>c.type===type);
 assert.ok(at>=0,'carta vera assente dal mazzo: '+type);
 [pile.hand[slot],pile.deck[at]]=[pile.deck[at],pile.hand[slot]];
 return slot;
}
function commit(b,a=idle,z=idle,now=100){
 const one=sealTacticalOrder(b,'A',{...idle,...a},now);
 assert.equal(one.ok,true,'A: '+one.reason);
 const two=sealTacticalOrder(one.battle,'B',{...idle,...z},now+1);
 assert.equal(two.ok,true,'B: '+two.reason);
 return advanceTacticalDuel(two.battle,now+1);
}
test('Il Terreno Plasma riduce tutte le riparazioni autentiche; gli altri terreni non le riducono',()=>{
 assert.equal(pvpTerrainRepairAmount(20,modifiers),18);
 assert.equal(pvpTerrainRepairAmount(9,modifiers),8);
 assert.equal(pvpTerrainRepairAmount(8,modifiers),7);
 assert.equal(pvpTerrainRepairAmount(4,modifiers),3);
 assert.equal(pvpTerrainRepairAmount(20),20);
 for(const id of ['terrain-debris','terrain-ionic','terrain-resonance'])
  assert.equal(pvpTerrainRepairAmount(20,PVP_TERRAIN_CATALOG[id].effects),20);
});
test('Terreno Plasma e Carta Modulo Toro nello stesso turno: cura 8 anziché 9 senza carte gratuite',()=>{
 const taurus=moduleCardType('taurus');
 const b=createTacticalDuel({mode:'pvp',specialDeckA:deck('terrain-plasma',taurus),
  equipmentLevelsA:{[taurus]:1},seed:29});
 offer(b,'A','terrain-plasma',0);offer(b,'A',taurus,1);
 b.sides.A.defense.shield.hp=20;
 const baseline=structuredClone(b);
 const withTerrain=commit(b,{specialIndices:[0,1]});
 const withoutTerrain=commit(baseline,{specialIndices:[1]});
 assert.equal(withTerrain.activeTerrain.id,'terrain-plasma');
 assert.equal(withTerrain.history[0].moduleActivations.find(x=>x.effect==='healing').actual,8);
 assert.equal(withoutTerrain.history[0].moduleActivations.find(x=>x.effect==='healing').actual,9);
 assert.equal(withTerrain.sides.A.special.hand.length+withTerrain.sides.A.special.deck.length+
  withTerrain.sides.A.special.discard.length,24);
 assert.equal(withTerrain.sides.A.numeric.hand.length+withTerrain.sides.A.numeric.deck.length+
  withTerrain.sides.A.numeric.discard.length,52);
});
test('Terreno Plasma e Carta Supporto Riparazione: la penalità si applica già nello stesso ciclo',()=>{
 const b=createTacticalDuel({mode:'pvp',specialDeckA:deck('terrain-plasma'),
  specialDeckB:deck('support-shield-repair'),seed:31});
 offer(b,'A','terrain-plasma');offer(b,'B','support-shield-repair');
 b.sides.B.defense.shield.hp=20;
 const withTerrain=commit(b,{specialIndices:[0]},{specialIndices:[0]});
 assert.ok(withTerrain.lastEvents.some(s=>s.includes('B: barriera riparata +18')));
 assert.equal(withTerrain.activeTerrain.untilRound,2);
});
test('Personaggio Boss Idra: il Terreno Plasma limita anche la rigenerazione del ciclo successivo',()=>{
 const b=createTacticalDuel({mode:'pvp',specialDeckA:deck('boss-character-11'),
  specialDeckB:deck('terrain-plasma'),seed:41});
 offer(b,'A','boss-character-11');offer(b,'B','terrain-plasma');
 const first=commit(b,{specialIndices:[0]});
 assert.ok(first.sides.A.bossCharacter?.regenDue===2,'cura attivata da vero colpo allo scudo');
 const ready=advanceTacticalDuel(first,first.resolveUntilMs+1);
 const reference=structuredClone(ready);
 const plasma=commit(ready,idle,{specialIndices:[0]},ready.deadlineMs-100);
 const neutral=commit(reference,idle,idle,reference.deadlineMs-100);
 assert.ok(plasma.lastEvents.some(s=>s.includes('Carta Idra · rigenerazione reale +3')));
 assert.ok(neutral.lastEvents.some(s=>s.includes('Carta Idra · rigenerazione reale +4')));
 assert.equal(plasma.sides.A.bossCharacter.regenerated,true);
});
test('Dado Quantico Cura e Terreno Plasma: 8 HP nominali diventano 7, sempre una Carta Dado',()=>{
 const seed=Array.from({length:60},(_,i)=>i).find(i=>quantumFace(i,1,'A')==='heal');
 assert.ok(Number.isInteger(seed));
 const b=createTacticalDuel({seed});
 b.sides.A.defense.shield.hp=20;
 b.sides.A.legacy.diceReady=true;
 const same=structuredClone(b);
 const played={A:[LEGACY_DICE_CARD],B:[]};
 const orders={A:{},B:{}};
 prepareLegacyTactics(b.sides,orders,played,1,seed,[],{pvpTerrain:modifiers});
 prepareLegacyTactics(same.sides,orders,played,1,seed,[]);
 assert.equal(b.sides.A.defense.shield.hp,27);
 assert.equal(same.sides.A.defense.shield.hp,28);
 assert.equal(b.sides.A.legacy.diceReady,false);
});
test('Carta Dorata Cuori e Terreno Plasma: cura coerente con le altre carte',()=>{
 const b=createTacticalDuel(),c=structuredClone(b);
 for(const game of [b,c]){
  game.sides.A.defense.shield.hp=20;
  const selected=game.sides.A.numeric.hand[0];
  game.sides.A.legacy.golden={cardId:selected.id,suit:'♥',untilRound:1};
 }
 const orders={A:{numericIndices:[0],exchangeIndices:[],escortAmmoIndex:null,op:'plus'},
  B:{numericIndices:[],exchangeIndices:[],escortAmmoIndex:null,op:null}};
 const types={A:[],B:[]},valid={A:true,B:false},hits={A:0,B:0};
 const effects={A:{},B:{}};
 resolveLegacyTactics(b.sides,orders,types,valid,hits,effects,1,[],[],{pvpTerrain:modifiers});
 resolveLegacyTactics(c.sides,orders,types,valid,hits,effects,1,[]);
 assert.equal(b.sides.A.defense.shield.hp,27);
 assert.equal(c.sides.A.defense.shield.hp,28);
});
test('Purificazione blocca la Barra Malus energetica nel ciclo stesso senza cancellare la carica',()=>{
 const purify=moduleCardType('planet_char_14');
 const prepare=()=>{
  const b=createTacticalDuel({specialDeckA:deck(purify),
   specialDeckB:deck(LEGACY_MALUS_CARD),equipmentLevelsA:{[purify]:1},seed:47});
  offer(b,'A',purify);offer(b,'B',LEGACY_MALUS_CARD);
  b.sides.A.legacy.malusCharge=2;
  b.sides.B.legacy.malusCharge=3;
  return b;
 };
 const withPurification=commit(prepare(),{specialIndices:[0]},
  {specialIndices:[0],malusChoice:'boost_jam'});
 const withoutPurification=commit(prepare(),idle,
  {specialIndices:[0],malusChoice:'boost_jam'});
 assert.equal(withPurification.history[0].legacyEffects.A.debuff,'boost_jam',
  'l’avversario ha consumato realmente la sua carta malus');
 assert.equal(withPurification.sides.A.sync,25);
 assert.equal(withoutPurification.sides.A.sync,15);
 assert.equal(withPurification.sides.A.legacy.malusCharge,2);
 assert.equal(withPurification.sides.B.legacy.malusCharge,0);
});
