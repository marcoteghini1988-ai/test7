// Regressioni ufficiali: 10 Energie × 4 rarità, pila fisica e tre doppioni.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ENERGY_CARDS,ENERGY_CARD_COUNT,ENERGY_RARITIES,
 ENERGY_CHARGES_BY_RARITY,energyIdForRarity} from './fleetNext/energyCards.js';
import {card,cardCopyLimit,cardRole,ENERGY_COUNT} from './fleetNext/rules.js';
import {describeEffect,validateEffectSpec} from './fleetNext/simpleEffects.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {buildNextBaseDeck,canSelectNewGeneric,buyNextCommonCard,
 evolveNextEnergyWithDuplicates,NEXT_COMMON_AVAILABLE} from './fleetNext/nextDeckLoadout.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {chargedElementalEnergy,spendElementalEnergy,totalElementalEnergy}
 from './fleetNext/elementalAbilities.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {CARD_RARITY_EVOLUTION_RULE} from './fleetNext/rarityDuplicateEvolution.js';

function battle(shipA='C01'){
 const b=createFleetNextBattle({shipA,shipB:'C02',levelA:20,levelB:18,
  mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:1988,nowMs:0});
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(25).fill('gen-216');s.discard=[];
 }
 return b;
}
function play(b,who,cards=[],actions={}){
 b.sides[who].hand=[...cards];
 const order={cards:cards.map((_,i)=>i),pass:true,...actions};
 const r=resolveFleetNextTurn(b,who,order,b.turnStartedAtMs);
 assert.equal(r.ok,true,r.reason);
 return r;
}

test('40 Carte Energia: 10 elementi, quattro rarità e cariche 1-2-3-4',()=>{
 assert.equal(ENERGY_CARDS.length,40);
 assert.equal(ENERGY_CARD_COUNT,40);
 assert.equal(ENERGY_COUNT,40);
 assert.deepEqual(ENERGY_RARITIES,['Comune','Rara','Epica','Leggendaria']);
 assert.equal(new Set(ENERGY_CARDS.map(x=>x.id)).size,40);
 for(const id of new Set(ENERGY_CARDS.map(x=>x.elementId))){
  const family=ENERGY_CARDS.filter(x=>x.elementId===id);
  assert.equal(family.length,4);
  for(const c of family){
   assert.equal(c.id,energyIdForRarity(id,c.rarita));
   assert.equal(c.charges,ENERGY_CHARGES_BY_RARITY[c.rarita]);
   assert.equal(c.effectSpec.charges,c.charges);
   assert.equal(card(c.id),c);
   assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
   assert.equal(describeEffect(c),c.effectProposed,c.id);
   assert.equal(cardRole(c.id),'support');
   assert.equal(cardCopyLimit(c.id),4);
   assert.equal(canSelectNewGeneric(c.id),true);
   assert.ok(NEXT_COMMON_AVAILABLE.includes(c));
  }
 }
});

test('Rarità Energia evolvono solo con tre copie identiche, senza spendere Crediti',()=>{
 assert.equal(CARD_RARITY_EVOLUTION_RULE.requiredCopies,3);
 assert.equal(CARD_RARITY_EVOLUTION_RULE.consumedCopies,2);
 let inv={...createFleetInventory(),owned:{'energy-cryogenic':3,'energy-plasma':3},credits:123};
 for(const [from,to] of [
  ['energy-cryogenic','energy-cryogenic-r'],
  ['energy-cryogenic-r','energy-cryogenic-e'],
  ['energy-cryogenic-e','energy-cryogenic-l']]){
  const source={...inv,owned:{...inv.owned,[from]:3}};
  const evolved=evolveNextEnergyWithDuplicates(source,from);
  assert.equal(evolved.ok,true,evolved.reason);
  assert.equal(evolved.destinationId,to);
  assert.equal(evolved.inventory.owned[from],1);
  assert.equal(evolved.inventory.owned[to],1);
  assert.equal(evolved.inventory.credits,123);
  assert.equal(source.owned[from],3,'non mutare l inventario originale');
  inv=evolved.inventory;
 }
 assert.equal(evolveNextEnergyWithDuplicates(inv,'energy-cryogenic-l').ok,false);
 assert.equal(evolveNextEnergyWithDuplicates({...inv,owned:{'energy-plasma':2,
  'energy-cryogenic':1}},'energy-plasma').ok,false,
  'copie di elementi diversi non contano');
 assert.equal(evolveNextEnergyWithDuplicates(inv,'energy-ghost').ok,false);
});

test('Una Energia Leggendaria ottenuta direttamente è equipaggiabile ma senza Shop provvisorio',()=>{
 const inv=createFleetInventory();
 inv.owned['energy-plasma-l']=1;
 const normalized=normalizeFleetInventory(inv);
 assert.equal(normalized.owned['energy-plasma-l'],1);
 assert.deepEqual(buildNextBaseDeck(normalized,'C01',19,['energy-plasma-l']).baseDeck,['energy-plasma-l']);
 assert.equal(buyNextCommonCard({...normalized,credits:999999},'energy-plasma-l').ok,false);
 assert.equal(buyNextCommonCard({...normalized,credits:999999},'energy-plasma-r').ok,false);
 assert.equal(normalized.owned['energy-ionic'],2,'dotazione storica Comune preservata');
});

test('Giocando Rara, Epica e Leggendaria la pila ospita 3 carte fisiche e 9 cariche',()=>{
 const b=battle('C01'),r=play(b,'A',['energy-plasma-r','energy-plasma-e','energy-plasma-l']);
 assert.equal(r.events.filter(e=>e.kind==='energy-charge').length,3);
 assert.deepEqual(r.events.filter(e=>e.kind==='energy-charge').map(e=>e.cardCharges),[2,3,4]);
 const side=r.battle.sides.A;
 assert.equal(chargedElementalEnergy(side,'plasma'),9);
 assert.equal(totalElementalEnergy(side),9);
 assert.equal(side.energyPile.length,3);
 assert.deepEqual(side.energyPile.map(x=>x.remaining),[2,3,4]);
 assert.equal(side.discard.filter(id=>id.startsWith('energy-')).length,0);
});

test('Spendere metà di una Rara non scarta la carta prima della seconda carica',()=>{
 const b=battle(),r=play(b,'A',['energy-plasma-r']);
 const side=r.battle.sides.A;
 assert.equal(chargedElementalEnergy(side,'plasma'),2);
 assert.equal(spendElementalEnergy(side,'plasma',1),true);
 assert.equal(chargedElementalEnergy(side,'plasma'),1);
 assert.deepEqual(side.energyPile,[{id:'energy-plasma-r',elementId:'plasma',remaining:1}]);
 assert.equal(side.discard.includes('energy-plasma-r'),false);
 assert.equal(spendElementalEnergy(side,'plasma',1),true);
 assert.deepEqual(side.energyPile,[]);
 assert.equal(side.discard.filter(id=>id==='energy-plasma-r').length,1);
});

test('Una Rara finanzia la Speciale da 2 Energia nella stessa giocata e va negli scarti',()=>{
 const b=battle('N00');
 b.sides.A.hand=['energy-ionic-r'];
 const order={cards:[0],activateElemental:true,elementalElement:'ionic',pass:true};
 assert.equal(validateFleetTurn(b,'A',order),null);
 const r=resolveFleetNextTurn(b,'A',order,b.turnStartedAtMs);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.events.some(e=>e.kind==='elemental-special'),true);
 const side=r.battle.sides.A;
 assert.equal(totalElementalEnergy(side),0);
 assert.deepEqual(side.energyPile,[]);
 assert.equal(side.discard.filter(id=>id==='energy-ionic-r').length,1);
});

test('Una Leggendaria dura quattro Speciali da una carica e si scarta soltanto all ultima',()=>{
 let b=battle('C02'),r=play(b,'A',['energy-refrigerant-l']);b=r.battle;
 assert.equal(chargedElementalEnergy(b.sides.A,'refrigerant'),4);
 assert.equal(b.sides.A.discard.includes('energy-refrigerant-l'),false);
 for(let used=1;used<=4;used++){
  b=play(b,'B').battle;
  r=play(b,'A',[],{activateElemental:true,elementalElement:'refrigerant'});
  b=r.battle;
  assert.equal(chargedElementalEnergy(b.sides.A,'refrigerant'),4-used);
  const spent=[...b.sides.A.discard,...b.sides.A.deck,...b.sides.A.hand]
   .filter(id=>id==='energy-refrigerant-l');
  assert.equal(spent.length,used===4?1:0,
   'dopo il consumo la carta può essere rimescolata e ripescata');
  if(used<4)assert.equal(b.sides.A.energyPile[0].remaining,4-used);
 }
 assert.equal(b.sides.A.energyPile.length,0);
 assert.equal([...b.sides.A.discard,...b.sides.A.deck,...b.sides.A.hand]
  .filter(id=>id==='energy-refrigerant-l').length,1);
});

test('Le energie di altri elementi non si consumano con una Speciale di un altro tipo',()=>{
 const b=battle('C03'),side=b.sides.A;
 side.elementalCharges={void:3,ionic:2};
 side.energyPile=[
  {id:'energy-void-e',elementId:'void',remaining:3},
  {id:'energy-ionic-r',elementId:'ionic',remaining:2}
 ];
 assert.equal(spendElementalEnergy(side,'ionic',2),true);
 assert.equal(chargedElementalEnergy(side,'void'),3);
 assert.deepEqual(side.energyPile,[{id:'energy-void-e',elementId:'void',remaining:3}]);
 assert.equal(side.discard.includes('energy-ionic-r'),true);
 assert.equal(side.discard.includes('energy-void-e'),false);
});
