import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCampaignNpcDeck} from './fleetNext/npcDeck.js';
import {SHIP_RARITIES,combatLevelForRarity} from './fleetNext/shipRarity.js';
import {LEGENDARY_MOTHER_PROFILES} from './fleetNext/motherBalance.js';
import {nextGenericCapacity} from './fleetNext/nextDeckLoadout.js';
import {card,cardRole,cardCopyLimit,effectiveDeck} from './fleetNext/rules.js';
import {activeFleetElements} from './fleetNext/elementalAffinities.js';
import {createFleetNextBattle} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

test('12 madri x 4 rarita: mazzo CPU con 40 carte esistenti, nessun Personaggio base',()=>{
 const matrix={};
 for(const rarity of SHIP_RARITIES){
  const examples=[];
  for(const id of Object.keys(LEGENDARY_MOTHER_PROFILES)){
   const level=combatLevelForRarity(id,rarity);
   assert.ok(level,id+'/'+rarity);
   const base=buildCampaignNpcDeck(id,level,rarity,97);
   assert.equal(base.length,nextGenericCapacity(id,level),id+'/'+rarity);
   assert.equal(effectiveDeck(base,id,level).length,40,id+'/'+rarity);
   const counts=new Map();
   for(const cardId of base){
    const def=card(cardId);
    assert.ok(def&&def.playable!==false,id+'/'+rarity+'/'+cardId);
    assert.notEqual(cardRole(cardId),'character');
    counts.set(cardId,(counts.get(cardId)||0)+1);
    assert.ok(counts.get(cardId)<=cardCopyLimit(cardId),cardId);
   }
   const energies=base.filter(cardId=>card(cardId).effectSpec?.type==='energy');
   const weapons=base.filter(cardId=>card(cardId).effectSpec?.type==='deployMachine');
   assert.ok(energies.length>=4,id+'/'+rarity+' energie '+energies.length);
   assert.ok(weapons.length>=8,id+'/'+rarity+' armi '+weapons.length);
   assert.ok(activeFleetElements(id,level).every(el=>energies.some(
    key=>card(key).effectSpec.elementId===el)),id+'/'+rarity);
   examples.push({shipId:id,count:base.length,energies:energies.length,
    weapons:weapons.length});
  }
  matrix[rarity]=examples;
 }
 console.log('NPC_DECK_COMPOSITION='+JSON.stringify(matrix));
});
test('Mazzo CPU reale è deterministico e la plancia non usa piu gen-216 da sola',()=>{
 const first=buildCampaignNpcDeck('N00',1,'Comune',1988),
  same=buildCampaignNpcDeck('N00',1,'Comune',1988);
 assert.deepEqual(first,same);
 const ui=readFileSync(new URL('./OfficialFleetBattle3D.jsx',import.meta.url),'utf8');
 assert.match(ui,/deckB:rivalDeck/);
 assert.match(ui,/buildCampaignNpcDeck\(motherEnemy,levelEnemy,rivalRarity,battleSeed\)/);
 assert.doesNotMatch(ui,/deckB:\['gen-216'\]/);
});
test('La CPU ha un mazzo completo che alimenta realmente Armi e Generatore',()=>{
 const a='N00',b='R01',ra='Comune',rb='Rara';
 const bLevel=combatLevelForRarity(b,rb);
 const battle=createFleetNextBattle({shipA:a,shipB:b,raritaA:ra,raritaB:rb,
  supportRosterA:[],supportRosterB:[],deckA:[],
  deckB:buildCampaignNpcDeck(b,bLevel,rb,222),newGeneratorCombat:true,
  seed:222,nowMs:0,ruleset:HP_SYNC_RULESET});
 const side=battle.sides.B;
 assert.equal(side.hand.length+side.deck.length,40);
 assert.ok([...side.hand,...side.deck].some(id=>card(id)?.effectSpec?.type==='energy'));
 assert.ok([...side.hand,...side.deck].some(id=>card(id)?.effectSpec?.type==='deployMachine'));
});
