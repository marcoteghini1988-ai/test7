import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16F_MODULES} from './newCombat/phase16FModules.js';
import {MODULE_CARD_TYPES,MODULE_STORAGE_KEY,TACTICAL_MODULE_CARDS,
 legacyModuleLevels,readLegacyModuleLevels,moduleCardType,isModuleCard}
 from './tacticalEquipmentCards.js';
import {LEGACY_DICE_CARD,LEGACY_MALUS_CARD} from './tacticalLegacyEvents.js';
import {SPECIAL_CARD_CATALOG,specialCardMaxCopies} from './specialCards.js';
import {createSpecialCollection,readSpecialCollection,updateSpecialCollection,
 SPECIAL_PACK_TYPES,SPECIAL_COLLECTION_KEY,validateSpecialDeck,equipSpecialDeck}
 from './specialDeckBuilder.js';
import {createTacticalDuel,TACTICAL_SPECIALS,TACTICAL_STARTER_TYPES,
 validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {officialBattleSetup} from './officialBattleSetup.js';

const deck=(...types)=>[...types,...TACTICAL_STARTER_TYPES.slice(types.length)];
const inactive={numericIndices:[],specialIndices:[]};
function fakeStore(initial={}){
 const data=new Map(Object.entries(initial));const writes=[];
 return {getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);writes.push(k);},data,writes};
}
function offer(b,key,type,slot=0){
 const pile=b.sides[key].special,hi=pile.hand.findIndex(c=>c.type===type);
 if(hi>=0){[pile.hand[slot],pile.hand[hi]]=[pile.hand[hi],pile.hand[slot]];return slot;}
 const di=pile.deck.findIndex(c=>c.type===type);
 assert.ok(di>=0,'La carta deve essere inclusa nel mazzo autentico');
 [pile.hand[slot],pile.deck[di]]=[pile.deck[di],pile.hand[slot]];
 return slot;
}
function duel(types,levels,shipA='C01'){
 const game=createTacticalDuel({shipA,shipB:'R04',levelA:3,levelB:3,
  specialDeckA:deck(...types),equipmentLevelsA:levels,seed:28});
 types.forEach((type,i)=>offer(game,'A',type,i));
 return game;
}
function resolve(b,a=inactive,z=inactive,now=100){
 const x=sealTacticalOrder(b,'A',{...inactive,...a},now);
 assert.equal(x.ok,true,x.reason);
 const y=sealTacticalOrder(x.battle,'B',{...inactive,...z},now+1);
 assert.equal(y.ok,true,y.reason);
 return advanceTacticalDuel(y.battle,now+1);
}
function allCards(p){return [...p.hand,...p.deck,...p.discard];}

test('TUTTI i 35 equipaggiamenti Modulo originali sono carte uniche, non abilita gratuite',()=>{
 assert.equal(MODULE_CARD_TYPES.length,35);
 assert.equal(Object.keys(PHASE16F_MODULES).length,35);
 assert.equal(new Set(MODULE_CARD_TYPES).size,35);
 const supported=new Set(['pure_hit','healing','execution','guard','module_lock',
  'life_drain','hand_jam','prevent_skip','shield_and_ether','ether_gain',
  'boost_focus','boost_siphon','ammo_refill','refill','free_swap',
  'clear_malus','dice_charge','burn','singularity']);
 for(const [id,module] of Object.entries(PHASE16F_MODULES)){
  const card=moduleCardType(id);
  assert.equal(isModuleCard(card),true);
  assert.equal(TACTICAL_MODULE_CARDS[card].name,module.name);
  assert.equal(TACTICAL_MODULE_CARDS[card].effect,module.effect);
  assert.equal(SPECIAL_CARD_CATALOG[card].family,'equipment');
  assert.equal(TACTICAL_SPECIALS[card].kind,'equipment');
  assert.equal(specialCardMaxCopies(card),1);
  assert.equal(SPECIAL_PACK_TYPES.includes(card),false,'modulo acquistato: mai premio casuale');
  assert.ok(supported.has(module.effect),module.effect);
 }
 assert.equal(SPECIAL_CARD_CATALOG[LEGACY_DICE_CARD].family,'quantum');
 assert.equal(SPECIAL_CARD_CATALOG[LEGACY_MALUS_CARD].family,'sabotage');
});
test('Importa SOLO i moduli sbloccati a L1–9 e non modifica il vecchio salvataggio',()=>{
 const r={aries:{unlocked:true,level:5},taurus:{unlocked:false,level:3},
  gemini:{unlocked:true,level:1},unknown:{unlocked:true,level:6}};
 const s=fakeStore({[MODULE_STORAGE_KEY]:JSON.stringify(r)});
 const old=s.getItem(MODULE_STORAGE_KEY);
 assert.deepEqual(readLegacyModuleLevels(s),{
  [moduleCardType('aries')]:5,[moduleCardType('gemini')]:1
 });
 const collection=readSpecialCollection(s);
 assert.equal(collection.owned[moduleCardType('aries')],1);
 assert.equal(collection.owned[moduleCardType('gemini')],1);
 assert.equal(collection.owned[moduleCardType('taurus')],0);
 assert.equal(collection.loadout.includes(moduleCardType('aries')),false);
 assert.equal(s.getItem(MODULE_STORAGE_KEY),old);
 assert.equal(s.writes.length,0,'letture senza scritture');
 const result=updateSpecialCollection(c=>c,s);
 assert.equal(result.owned[moduleCardType('aries')],1);
 assert.deepEqual(s.writes,[SPECIAL_COLLECTION_KEY]);
 const first=s.getItem(SPECIAL_COLLECTION_KEY);
 updateSpecialCollection(c=>c,s);
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),first);
 assert.deepEqual(s.writes,[SPECIAL_COLLECTION_KEY]);
 assert.equal(s.getItem(MODULE_STORAGE_KEY),old);
 assert.equal(legacyModuleLevels({})[moduleCardType('aries')],undefined);
 assert.throws(()=>legacyModuleLevels({aries:{unlocked:true,level:10}}));
});
test('Nessun modulo regalato nello starter; il mazzo legacy non perde la carta equipaggiata',()=>{
 const c=createSpecialCollection();
 for(const id of MODULE_CARD_TYPES){
  assert.equal(c.owned[id],0);
  assert.equal(c.loadout.includes(id),false);
 }
 const type=moduleCardType('aries');
 const owned={...c,owned:{...c.owned,[type]:1}};
 const equipped=equipSpecialDeck(owned,[type,...c.loadout.slice(1)]);
 assert.equal(validateSpecialDeck(equipped,equipped.loadout).valid,true);
 const duplicate=[type,type,...c.loadout.slice(2)];
 assert.equal(validateSpecialDeck({...owned,owned:{...owned.owned,[type]:2}},duplicate).reason,'copy_limit');
 assert.throws(()=>createTacticalDuel({specialDeckA:deck(type)}),/Modulo non posseduta|Modulo non posseduto/);
 const filtered=combatSpecialLoadout(equipped,'legacy');
 assert.equal(filtered.length,24);
 assert.equal(filtered.includes(type),false);
 assert.equal(equipped.loadout.includes(type),true);
});
test('Il Modulo NON produce effetti se equipaggiato ma NON giocato; la carta spende una delle 24 speciali',()=>{
 const type=moduleCardType('aries'),levels={[type]:1};
 const bare=duel([type],levels),playing=structuredClone(bare);
 const original=resolve(bare);
 const active=resolve(playing,{specialIndices:[0]});
 assert.equal(original.sides.B.defense.shield.hp,
  resolve(duel([type],levels)).sides.B.defense.shield.hp);
 assert.ok(active.sides.B.defense.shield.hp<original.sides.B.defense.shield.hp,
  'Ariete: danno aggiuntivo solo dopo consumo della carta Modulo');
 assert.equal(active.history[0].moduleActivations.length,1);
 assert.equal(active.history[0].moduleActivations[0].type,type);
 assert.equal(active.sides.A.special.discard.filter(c=>c.type===type).length,1);
 assert.equal(allCards(active.sides.A.special).length,24);
 assert.equal(new Set(allCards(active.sides.A.special).map(c=>c.id)).size,24);
 assert.equal(allCards(active.sides.A.numeric).length,52);
});
test('Le 35 abilità acquistate possono tutte essere giocate senza creare carte o valuta',()=>{
 for(const type of MODULE_CARD_TYPES){
  const b=duel([type],{[type]:5});
  const result=resolve(b,{specialIndices:[0]});
  assert.equal(result.history[0].moduleActivations.length,1,type);
  assert.equal(result.history[0].moduleActivations[0].type,type);
  assert.equal(allCards(result.sides.A.special).length,24,type);
  assert.equal(allCards(result.sides.A.numeric).length,52,type);
  assert.equal(result.sides.A.numeric.hand.length,7,type);
  assert.equal(result.sides.A.special.hand.length,5,type);
  assert.ok(result.lastEvents.some(line=>line.includes('CARTA MODULO')),type);
  assert.equal(Object.hasOwn(result,'wallet'),false);
 }
});
test('Al massimo UN Modulo per ciclo; non si possono usare due carte identiche',()=>{
 const a=moduleCardType('aries'),b=moduleCardType('taurus');
 const d=duel([a,b],{[a]:1,[b]:1});
 assert.equal(validateTacticalOrder(d,'A',{...inactive,specialIndices:[0,1]}).reason,
  'equipment_conflict');
 const valid=validateTacticalOrder(d,'A',{...inactive,specialIndices:[0]});
 assert.equal(valid.ok,true,valid.reason);
 assert.equal(validateTacticalOrder(d,'A',{...inactive,specialIndices:[0,0]}).reason,
  'special_selection');
});
test('Il duello ufficiale rispetta i moduli acquistati e i loro livelli',()=>{
 const card=moduleCardType('taurus');
 const c=createSpecialCollection();
 const equipped=equipSpecialDeck({...c,owned:{...c.owned,[card]:1}},[card,...c.loadout.slice(1)]);
 const ships={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],loadout:['ship:N00']};
 assert.throws(()=>officialBattleSetup({mode:'campaign',shipCollection:ships,specialCollection:equipped}),
  /Carta Modulo non autorizzata/);
 const setup=officialBattleSetup({mode:'campaign',shipCollection:ships,
  specialCollection:equipped,moduleLevels:{[card]:7}});
 assert.equal(setup.battle.sides.A.equipmentLevels[card],7);
 assert.equal(allCards(setup.battle.sides.A.special).filter(x=>x.type===card).length,1);
});
test('Il vecchio archivio Moduli JSON corrotto blocca la migrazione senza modificare file',()=>{
 const s=fakeStore({[MODULE_STORAGE_KEY]:'{invalid', [SPECIAL_COLLECTION_KEY]:JSON.stringify(createSpecialCollection())});
 const before=[...s.data];
 assert.throws(()=>readSpecialCollection(s));
 assert.throws(()=>updateSpecialCollection(c=>c,s));
 assert.deepEqual([...s.data],before);
 assert.deepEqual(s.writes,[]);
});
