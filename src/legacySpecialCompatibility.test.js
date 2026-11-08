import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection, SPECIAL_COLLECTION_KEY, validateSpecialDeck}
 from './specialDeckBuilder.js';
import {SPECIAL_DECK_SIZE,specialCardMaxCopies} from './specialCards.js';
import {moduleCardType,MODULE_CARD_TYPES} from './tacticalEquipmentCards.js';
import {VULNERABILITY_RIFT_CARD_ID} from './tacticalVulnerabilityRift.js';
import {LEGACY_SPECIAL_TYPES} from './tacticalLegacyEvents.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {PVP_TERRAIN_TYPES} from './pvpTerrainCards.js';
import {BOSS_CHARACTER_TYPES} from './bossCharacterCards.js';
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';
import {legacyUnsupportedSpecial,legacyBattleDeckFromCollection,legacyBattleDeckFromStorage}
 from './legacySpecialCompatibility.js';

function storage(data={}){
 const map=new Map(Object.entries(data)),writes=[];
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>{map.set(k,v);writes.push([k,v]);},map,writes};
}
const counts=list=>list.reduce((o,id)=>(o[id]=(o[id]??0)+1,o),{});
const equipped=(type,base=createSpecialCollection())=>({
 ...base,owned:{...base.owned,[type]:1},
 loadout:[type,...base.loadout.slice(1)]
});

test('Fallback 3D: primo mazzo storico legittimo conserva 24 speciali possedute',()=>{
 const c=createSpecialCollection();
 const received=legacyBattleDeckFromCollection(c);
 assert.deepEqual(received,c.loadout);
 assert.equal(received.length,SPECIAL_DECK_SIZE);
 assert.notEqual(received,c.loadout,'nessuna mutazione della lista salvata');
});
test('Filtro legacy: nessun nuovo Dado/Malus, Modulo, Faglia, Epico o Terreno si esegue come carta morta',()=>{
 const unsupported=[
  ...LEGACY_SPECIAL_TYPES,...MODULE_CARD_TYPES,VULNERABILITY_RIFT_CARD_ID,
  SIGNATURE_MUTATION_CARD_ID,...PVP_TERRAIN_TYPES,
  ...Object.keys(TACTICAL_EPIC_CARDS),...BOSS_CHARACTER_TYPES
 ];
 assert.ok(unsupported.length>40);
 assert.ok(unsupported.every(legacyUnsupportedSpecial));
 assert.ok(BOSS_CHARACTER_TYPES.every(legacyUnsupportedSpecial),
  'le Carte Boss sono attive nel duello simultaneo, non si lasciano morte nel fallback');
 for(const type of [LEGACY_SPECIAL_TYPES[0],LEGACY_SPECIAL_TYPES[1],
  VULNERABILITY_RIFT_CARD_ID,moduleCardType('aries'),PVP_TERRAIN_TYPES[0],
  Object.keys(TACTICAL_EPIC_CARDS)[0],BOSS_CHARACTER_TYPES[0]]){
  const c=equipped(type);
  assert.equal(validateSpecialDeck(c,c.loadout).valid,true,type);
  const copy=JSON.stringify(c);
  const safe=legacyBattleDeckFromCollection(c);
  const after=counts(safe);
  assert.equal(safe.length,24);
  assert.equal(after[type]??0,0);
  for(const [id,n] of Object.entries(after)){
   assert.ok(n<=c.owned[id],id+' copie reali');
   assert.ok(n<=specialCardMaxCopies(id),id+' limite');
  }
  assert.equal(JSON.stringify(c),copy,'collezione immutata');
 }
});
test('Se manca un mazzo giocabile di copie possedute, non concedere lo starter gratuito',()=>{
 const c=createSpecialCollection();
 const ids=MODULE_CARD_TYPES.slice(0,24);
 const unusable={...c,
  owned:{...Object.fromEntries(Object.keys(c.owned).map(id=>[id,0])),
   ...Object.fromEntries(ids.map(id=>[id,1]))},
  loadout:ids};
 assert.equal(validateSpecialDeck(unusable,unusable.loadout).valid,true);
 assert.throws(()=>legacyBattleDeckFromCollection(unusable),
  /24 speciali possedute giocabili|non supporta/);
 assert.deepEqual(unusable.loadout,ids);
});
test('I salvataggi con mazzo incompleto e i salvataggi corrotti non sono sostituiti',()=>{
 const c=createSpecialCollection();
 for(const bad of [
  {...c,loadout:c.loadout.slice(1)},
  {...c,loadout:[...c.loadout.slice(0,-1),'not-a-special']},
  {...c,loadout:[...c.loadout.slice(0,-1),VULNERABILITY_RIFT_CARD_ID]}
 ])assert.throws(()=>legacyBattleDeckFromCollection(bad),/Mazzo speciale non valido/);
 const broken='{invalid json';
 const store=storage({[SPECIAL_COLLECTION_KEY]:broken});
 assert.throws(()=>legacyBattleDeckFromStorage(store));
 assert.equal(store.getItem(SPECIAL_COLLECTION_KEY),broken);
 assert.deepEqual(store.writes,[]);
});
test('Conserva il mazzo attrezzato e i salvataggi, filtro solo nel combattimento',()=>{
 const c=equipped(moduleCardType('aries'));
 const store=storage({[SPECIAL_COLLECTION_KEY]:JSON.stringify(c)});
 const before=store.getItem(SPECIAL_COLLECTION_KEY);
 const inBattle=legacyBattleDeckFromStorage(store);
 assert.equal(inBattle.length,24);
 assert.ok(!inBattle.includes(moduleCardType('aries')));
 assert.ok(c.loadout.includes(moduleCardType('aries')));
 assert.equal(store.getItem(SPECIAL_COLLECTION_KEY),before);
 assert.deepEqual(store.writes,[]);
});
