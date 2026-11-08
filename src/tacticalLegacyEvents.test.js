import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,TACTICAL_STARTER_TYPES,validateTacticalOrder,
 sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {LEGACY_BOMB_CARD,LEGACY_MALUS_CARD,LEGACY_GOLD_CARD,
 LEGACY_SPECIAL_TYPES,MALUS_CHOICES,QUANTUM_FACES,quantumFace,
 initialLegacyTactics,resolveLegacyTactics} from './tacticalLegacyEvents.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {createSpecialCollection,normalizeSpecialCollection,SPECIAL_PACK_TYPES}
 from './specialDeckBuilder.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {exposeMotherPart} from './vitalDefense.js';

const idle={specialIndices:[],numericIndices:[]};
const deck=type=>[type,...TACTICAL_STARTER_TYPES.slice(1)];
function duel(type=null,side='A',extra={}){
 return createTacticalDuel({shipA:'C01',shipB:'R04',levelA:3,levelB:3,seed:18,
  ...(type?{[side==='A'?'specialDeckA':'specialDeckB']:deck(type)}:{}),...extra});
}
function inHand(b,key,type){
 const pile=b.sides[key].special;
 let i=pile.hand.findIndex(c=>c.type===type);
 if(i>=0)return i;
 const j=pile.deck.findIndex(c=>c.type===type);
 assert.ok(j>=0,'speciale realmente inclusa nel mazzo');
 [pile.hand[0],pile.deck[j]]=[pile.deck[j],pile.hand[0]];
 return 0;
}
function play(b,a=idle,z=idle,now=100){
 const x=sealTacticalOrder(b,'A',{...idle,...a},now);
 assert.equal(x.ok,true,'A: '+x.reason);
 const y=sealTacticalOrder(x.battle,'B',{...idle,...z},now+1);
 assert.equal(y.ok,true,'B: '+y.reason);
 return advanceTacticalDuel(y.battle,now+1);
}
const next=b=>advanceTacticalDuel(b,b.resolveUntilMs+1);
const counts=side=>({
 numeric:side.numeric.hand.length+side.numeric.deck.length+side.numeric.discard.length,
 special:side.special.hand.length+side.special.deck.length+side.special.discard.length
});
test('Tre nuove speciali non regalate; Dado e Barra sono cariche, non nuovi mazzi',()=>{
 const c=createSpecialCollection();
 for(const id of LEGACY_SPECIAL_TYPES){
  assert.equal(c.owned[id],0);
  assert.ok(SPECIAL_PACK_TYPES.includes(id));
  assert.ok(SPECIAL_CARD_CATALOG[id]);
 }
 assert.equal(LEGACY_SPECIAL_TYPES.length,3);
 assert.equal(MALUS_CHOICES.length,3);
 assert.equal(QUANTUM_FACES.length,6);
 assert.deepEqual(counts(duel().sides.A),{numeric:52,special:24});
 const legacy=Object.fromEntries(Object.entries(c.owned).filter(([id])=>!LEGACY_SPECIAL_TYPES.includes(id)));
 const migrated=normalizeSpecialCollection({...c,owned:legacy});
 assert.ok(LEGACY_SPECIAL_TYPES.every(id=>migrated.owned[id]===0));
});
test('Le sei facce del Dado sono deterministiche, senza dipendere da dati segreti',()=>{
 const seen=new Set();
 for(let seed=0;seed<12;seed++)seen.add(quantumFace(seed,1,'A'));
 assert.deepEqual([...seen].sort(),[...QUANTUM_FACES].sort());
 assert.equal(quantumFace(18,1,'A'),quantumFace(18,1,'A'));
});
test('Dado: rifiutato se non carico, spende carica autentica, non produce carte o valuta',()=>{
 const battle=duel();
 assert.equal(validateTacticalOrder(battle,'A',{...idle,quantumRoll:true}).reason,
  'dice_not_ready');
 battle.sides.A.legacy.diceReady=true;
 battle.sides.A.legacy.dicePatterns=['plus','minus','times'];
 const rolled=play(battle,{quantumRoll:true});
 const simple=play(duel());
 assert.equal(rolled.sides.A.legacy.diceReady,false);
 assert.deepEqual(rolled.sides.A.legacy.dicePatterns,[]);
 assert.equal(rolled.sides.A.legacy.lastDice.face,'module');
 assert.equal(rolled.sides.A.sync,simple.sides.A.sync+10);
 assert.deepEqual(counts(rolled.sides.A),{numeric:52,special:24});
 assert.equal(Object.hasOwn(rolled,'wallet'),false);
});
test('Dado: 3 formule diverse vere, mai 3 ripetizioni della stessa',()=>{
 const b=duel();
 const a=b.sides.A,z=b.sides.B;
 const orders={A:{numericIndices:[],exchangeIndices:[],escortAmmoIndex:null,op:'plus'},
 B:{numericIndices:[],exchangeIndices:[],escortAmmoIndex:null,op:null}};
 const fake={A:{bombSlot:null},B:{bombSlot:null}};
 for(const op of ['plus','plus','minus','times']){
  orders.A.op=op;
  resolveLegacyTactics({A:a,B:z},orders,{A:[],B:[]},{A:true,B:false},
   {A:0,B:0},fake,1,[]);
 }
 assert.deepEqual(a.legacy.dicePatterns,['plus','minus','times']);
 assert.equal(a.legacy.diceReady,true);
});
test('Malus: occorrono 3 veri colpi ai vitali e una speciale, niente blocco completo del turno',()=>{
 const b=duel(LEGACY_MALUS_CARD,'B');
 const i=inHand(b,'B',LEGACY_MALUS_CARD);
 assert.equal(validateTacticalOrder(b,'B',{...idle,specialIndices:[i],malusChoice:'lock_weapon'}).reason,
  'malus_not_ready');
 b.sides.B.legacy.malusCharge=3;
 const a=play(structuredClone(b));
 const weakened=play(b,idle,{specialIndices:[i],malusChoice:'lock_weapon'});
 assert.ok(weakened.history[0].shieldA<a.history[0].shieldA,
  'la penalità si applica solo al colpo nativo del ciclo');
 assert.equal(weakened.sides.B.legacy.malusCharge,0);
 assert.equal(weakened.sides.B.special.discard.some(c=>c.type===LEGACY_MALUS_CARD),true);
 assert.equal(weakened.sides.A.numeric.hand.length,7);
 assert.ok(weakened.lastEvents.some(x=>x.includes('Barra Malus')));
});
test('Numero Bomba: marchio su numerica del rivale DOPO il ripescaggio, disinnesco con ricambio',()=>{
 const b=duel(LEGACY_BOMB_CARD,'A');
 const i=inHand(b,'A',LEGACY_BOMB_CARD);
 assert.equal(validateTacticalOrder(b,'A',{...idle,specialIndices:[i]}).reason,'bomb_slot_invalid');
 const placed=play(b,{specialIndices:[i],bombSlot:2});
 const mark=placed.sides.B.legacy.bomb;
 assert.equal(mark.cardId,placed.sides.B.numeric.hand[2].id);
 assert.equal(mark.armedRound,2);
 assert.equal(mark.untilRound,3);
 const planning=next(placed);
 const defused=play(planning,idle,{exchangeIndices:[2]},planning.deadlineMs-200);
 assert.equal(defused.sides.B.legacy.bomb,null);
 assert.ok(defused.lastEvents.some(x=>x.includes('disinnescata')));
 assert.deepEqual(counts(defused.sides.B),{numeric:52,special:24});
 assert.equal(mark.cardId!==defused.sides.B.numeric.hand[2].id,true);
});
test('Numero Bomba: scade dopo due cicli e danneggia SOLO la barriera reale',()=>{
 const b=duel(LEGACY_BOMB_CARD);
 const i=inHand(b,'A',LEGACY_BOMB_CARD);
 let x=play(b,{specialIndices:[i],bombSlot:1});
 const mark=x.sides.B.legacy.bomb;
 x=next(x);
 const sameNoBomb=structuredClone(x);
 sameNoBomb.sides.B.legacy.bomb=null;
 let held=play(x,idle,idle,x.deadlineMs-200);
 let reference=play(sameNoBomb,idle,idle,sameNoBomb.deadlineMs-200);
 held=next(held);reference=next(reference);
 const after=play(held,idle,idle,held.deadlineMs-200);
 const control=play(reference,idle,idle,reference.deadlineMs-200);
 assert.equal(after.sides.B.legacy.bomb,null);
 assert.ok(after.lastEvents.some(x=>x.includes('scadenza')));
 assert.ok(after.sides.B.defense.shield.hp<=control.sides.B.defense.shield.hp);
 assert.equal(mark.cardId,placedCardFrom(held,'B',mark.cardId)?.id);
 function placedCardFrom(duel,key,id){return duel.sides[key].numeric.hand.find(c=>c.id===id);}
});
test('Carta Dorata: usa una numerica vera e il suo seme, no bonus se manca formula valida',()=>{
 const b=duel(LEGACY_GOLD_CARD,'A');
 const i=inHand(b,'A',LEGACY_GOLD_CARD);
 assert.equal(validateTacticalOrder(b,'A',{...idle,specialIndices:[i]}).reason,
  'golden_unavailable');
 const a=play(structuredClone(b),{numericIndices:[3,2],vitalId:'weapons',op:'minus'});
 const buffed=play(b,{specialIndices:[i],goldenIndex:2,numericIndices:[3,2],
  vitalId:'weapons',op:'minus'});
 assert.equal(buffed.sides.A.legacy.golden,null);
 assert.equal(buffed.sides.A.legacy.usedGoldenIds.length,1);
 assert.ok(buffed.sides.A.defense.shield.hp>=a.sides.A.defense.shield.hp);
 assert.ok(buffed.lastEvents.some(x=>x.includes('Carta Dorata ♥ attivata')));
 assert.deepEqual(counts(buffed.sides.A),{numeric:52,special:24});
 assert.equal(Object.hasOwn(buffed,'wallet'),false);
});
test('Carta Dorata: un bonus non è garantito, persiste solo fino al secondo ciclo',()=>{
 const b=duel(LEGACY_GOLD_CARD);
 const i=inHand(b,'A',LEGACY_GOLD_CARD);
 const first=play(b,{specialIndices:[i],goldenIndex:0});
 assert.ok(first.sides.A.legacy.golden);
 const waiting=next(first);
 assert.equal(validateTacticalOrder(waiting,'A',{...idle,specialIndices:[]}).ok,true);
 const expires=play(waiting,idle,idle,waiting.deadlineMs-200);
 assert.equal(expires.sides.A.legacy.golden,null);
 assert.equal(expires.sides.A.legacy.usedGoldenIds.length,0);
 assert.deepEqual(counts(expires.sides.A),{numeric:52,special:24});
});
test('Compatibilità: il motore Poker storico non riceve Bomba/Malus/Dorata come carte morte',()=>{
 const first=createSpecialCollection();
 for(const id of LEGACY_SPECIAL_TYPES){
  const collection={...first,owned:{...first.owned,[id]:1},
   loadout:[id,...first.loadout.slice(1)]};
  const filtered=combatSpecialLoadout(collection,'legacy');
  assert.equal(filtered.length,24);
  assert.equal(filtered.includes(id),false);
  assert.equal(collection.loadout.includes(id),true);
 }
});
