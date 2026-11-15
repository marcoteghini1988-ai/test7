import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,TOTAL_CARD_COUNT,card,
 cardCopyLimit,cardRole,cardFacePath,validateBaseDeck,effectiveDeck} from './fleetNext/rules.js';
import {describeEffect,validateEffectSpec,canUpgradeEffect} from './fleetNext/simpleEffects.js';
import {createFleetInventory,readFleetInventory,writeFleetInventory,
 equipFleetBaseDeck,upgradeFleetExclusive,buyGeneralCard,buyFleetPack} from './fleetNext/collection.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';

const all=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS),...Object.values(BOSS_CARDS)];
function storage(){
 const data=new Map();
 return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
}

test('391 carte complete: un solo effetto esplicito, testo breve e ruolo riconosciuto',()=>{
 assert.equal(TOTAL_CARD_COUNT,391);
 assert.equal(new Set(all.map(c=>c.id)).size,391);
 for(const c of all){
  assert.equal(card(c.id),c);
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(c.effetto||c.effectProposed,describeEffect(c),c.id);
  assert.ok(describeEffect(c).split(/\s+/).length<=30,c.id+' testo troppo lungo');
  assert.doesNotMatch(describeEffect(c),/marca valida|frattura recuperabile|salva reale|sincronia effettiva|calcolo matematico/i,c.id);
  assert.ok(['attack','defense','support','character','terrain'].includes(cardRole(c.id)),c.id);
 }
});

test('I dodici Boss non si comprano e non vengono estratti dai pacchetti',()=>{
 const inv=createFleetInventory();inv.credits=10000;
 for(const c of Object.values(BOSS_CARDS)){
  assert.equal(cardCopyLimit(c.id),1);
  assert.equal(cardRole(c.id),'character');
  assert.equal(buyGeneralCard(inv,c.id).ok,false);
  assert.equal(cardFacePath(c.id),'/assets/fleet-next-boss-cards/'+c.id+'.svg');
 }
 for(const rng of [()=>0,()=>.7,()=>.95,()=>.99999]){
  const result=buyFleetPack(inv,rng);
  assert.ok(result.ok);assert.ok(result.cards.every(id=>GENERAL_CARDS[id]));
 }
});

test('Una vittoria boss reale importa il trofeo senza equipaggiarlo o modificare lo storico',()=>{
 const memory=storage(),id='boss-character-1';
 const initial=readFleetInventory(memory);
 assert.equal(initial.owned[id],undefined);
 const invalid=claimBossCharacterFromVictory({winner:'enemy',mode:'campaign',sectorNumber:10},memory);
 assert.equal(invalid.granted,false);
 assert.equal(readFleetInventory(memory).owned[id],undefined);
 const victory=claimBossCharacterFromVictory({winner:'player',mode:'campaign',sectorNumber:10},memory);
 assert.equal(victory.granted,true);
 const original=memory.getItem('eclissi_special_collection_v1');
 const earned=readFleetInventory(memory);
 assert.equal(earned.owned[id],1);
 assert.deepEqual(earned.deck,initial.deck,'Il trofeo non si equipaggia da solo');
 assert.equal(memory.getItem('eclissi_special_collection_v1'),original);
 const deck=[...earned.deck];deck[0]=id;
 assert.equal(validateBaseDeck(deck,initial).valid,false,'Un Boss non posseduto non può entrare nel mazzo');
 const equipped=equipFleetBaseDeck(earned,deck);
 assert.equal(equipped.ok,true);
 writeFleetInventory(equipped.inventory,memory);
 const loaded=readFleetInventory(memory);
 assert.deepEqual(loaded.deck,deck);
 assert.equal(loaded.owned[id],1);
 assert.equal(effectiveDeck(loaded.deck,'N00',1).filter(x=>x===id).length,1);
 const duplicate=[...deck];duplicate[1]=id;
 assert.equal(validateBaseDeck(duplicate,loaded).valid,false);
 assert.equal(claimBossCharacterFromVictory({winner:'player',mode:'campaign',sectorNumber:10},memory).granted,false);
});

test('Una collezione storica illeggibile non elimina trofei già trasferiti',()=>{
 const memory=storage(),inv=createFleetInventory();
 inv.owned['boss-character-1']=1;
 writeFleetInventory(inv,memory);
 memory.setItem('eclissi_special_collection_v1','{dati non leggibili');
 assert.equal(readFleetInventory(memory).owned['boss-character-1'],1);
 assert.equal(memory.getItem('eclissi_special_collection_v1'),'{dati non leggibili');
});

test('Un potenziamento senza beneficio non scala crediti né cambia il salvataggio',()=>{
 const inv=createFleetInventory();inv.credits=10000;
 const baseline=JSON.stringify(inv);
 for(const c of Object.values(EXCLUSIVE_CARDS).filter(c=>!canUpgradeEffect(c,1))){
  const result=upgradeFleetExclusive(inv,c.id,c.shipId,5);
  assert.equal(result.ok,false,c.id);
  assert.equal(JSON.stringify(result.inventory),baseline,c.id);
 }
 const useful=Object.values(EXCLUSIVE_CARDS).find(c=>c.effectSpec.type==='power'&&c.effectSpec.amount===1);
 const result=upgradeFleetExclusive(inv,useful.id,useful.shipId,5);
 assert.ok(result.ok);assert.equal(result.grade,2);
 assert.equal(result.inventory.credits,inv.credits-result.spent);
 assert.notEqual(describeEffect(useful,1),describeEffect(useful,2));
 assert.equal(cardFacePath(useful.id,2),'/assets/fleet-next-card-upgrades/'+useful.id+'-g2.svg');
 const locked=Object.values(EXCLUSIVE_CARDS).find(c=>c.minShipLevelDraft>1);
 assert.equal(upgradeFleetExclusive(inv,locked.id,locked.shipId,1).ok,false);
});
