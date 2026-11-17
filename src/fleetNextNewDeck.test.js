import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetInventory,writeFleetInventory,readFleetInventory} from './fleetNext/collection.js';
import {NEXT_COMMON_CARDS,card,cardCopyLimit,effectiveDeck} from './fleetNext/rules.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetNextBattle} from './fleetNext/combat.js';
import {NEXT_CARD_COSTS,buyNextCommonCard,buildNextBaseDeck,nextGenericCapacity,
 nextExclusiveCount,readNextDeckSelection,saveNextDeckSelection,NEXT_DECK_STORAGE_KEY}
 from './fleetNext/nextDeckLoadout.js';

function storage(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,val)=>map.set(key,String(val))};
}
test('Nuovo mazzo separato dall’archivio storico, conserva la scelta in modo esplicito',()=>{
 const st=storage(),inv=createFleetInventory();
 assert.equal(readNextDeckSelection(st),null);
 inv.owned['sys-command-minus-c']=2;
 const ids=['gen-216','sys-command-minus-c','sys-command-minus-c'];
 assert.equal(saveNextDeckSelection(inv,'N00',1,ids,st).ok,true);
 assert.deepEqual(readNextDeckSelection(st),ids);
 assert.ok(st.getItem(NEXT_DECK_STORAGE_KEY));
 assert.deepEqual(inv.deck,[],'Il vecchio mazzo archiviato non viene riutilizzato');
 const deck=buildNextBaseDeck(inv,'N00',1,readNextDeckSelection(st));
 assert.deepEqual(deck.baseDeck,ids);
});
test('Limiti di 40 carte totali e limite di tre copie per Buco Nero',()=>{
 const inv=createFleetInventory();
 inv.owned=Object.fromEntries(NEXT_COMMON_CARDS.map(c=>[c.id,3]));
 const max=nextGenericCapacity('L01',5);
 assert.equal(max+nextExclusiveCount('L01',5),40);
 const choice=NEXT_COMMON_CARDS.map(c=>c.id).slice(0,max);
 const built=buildNextBaseDeck(inv,'L01',5,choice);
 assert.equal(built.discarded.length,0);
 assert.equal(built.total,40);
 assert.equal(effectiveDeck(built.baseDeck,'L01',5).length,40);
 const black=Array(4).fill('sys-black-hole');
 const excessive=buildNextBaseDeck(inv,'L01',5,black);
 assert.equal(cardCopyLimit('sys-black-hole'),3);
 assert.equal(excessive.baseDeck.length,3);
 assert.equal(excessive.discarded.length,1);
 assert.equal(saveNextDeckSelection(inv,'L01',5,black,storage()).ok,false);
});
test('Un acquisto conserva il possesso e il pescaggio è reale nel ruleset HP',()=>{
 const st=storage(),inv=createFleetInventory();
 inv.credits=1000;
 const bought=buyNextCommonCard(inv,'sys-bridge-minus-c');
 assert.equal(bought.ok,true);
 assert.equal(bought.cost,NEXT_CARD_COSTS.Comune);
 const saved=writeFleetInventory(bought.inventory,st);
 assert.equal(readFleetInventory(st).owned['sys-bridge-minus-c'],1);
 const deck=buildNextBaseDeck(saved,'L01',5,['sys-bridge-minus-c']);
 const battle=createFleetNextBattle({shipA:'L01',levelA:5,shipB:'L01',levelB:5,
  deckA:deck.baseDeck,deckB:['gen-216'],ruleset:HP_SYNC_RULESET,
  seed:195,mode:'pvp'});
 assert.ok([...battle.sides.A.deck,...battle.sides.A.hand].includes('sys-bridge-minus-c'));
 assert.ok(battle.sides.A.hand.length<=7);
 assert.equal(card('sys-bridge-minus-c')?.effectSpec?.system,'bridge');
});
test('I vecchi identificativi generici ritirati non tornano disponibili',()=>{
 const inv=createFleetInventory();
 inv.owned['gen-001']=99;
 const base=buildNextBaseDeck(inv,'N00',1,['gen-001']);
 assert.deepEqual(base.baseDeck,[]);
 assert.equal(base.discarded.length,1);
 assert.equal(buyNextCommonCard(inv,'gen-001').ok,false);
});
test('Gli acquisti non superano le copie per rarità e non concedono carte gratuite',()=>{
 const inv=createFleetInventory();
 assert.equal(buyNextCommonCard(inv,'sys-black-hole').ok,false);
 inv.credits=10000;
 for(let i=0;i<3;i++){
  const result=buyNextCommonCard(inv,'sys-black-hole');
  assert.equal(result.ok,true);
  inv.credits=result.inventory.credits;inv.owned=result.inventory.owned;
 }
 assert.equal(buyNextCommonCard(inv,'sys-black-hole').ok,false);
 assert.equal(inv.owned['sys-black-hole'],3);
});
