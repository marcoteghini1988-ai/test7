import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_RIFTS} from './newCombat/phase16ACatalog.js';
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';
import {LEGACY_EPIC_KEYS,resolveLegacyEpicProgress,readLegacyEpicProgress}
 from './officialEpicOwnership.js';
import {SPECIAL_CARD_CATALOG,specialCardMaxCopies} from './specialCards.js';
import {SPECIAL_PACK_TYPES,SPECIAL_COLLECTION_KEY,createSpecialCollection,
 readSpecialCollection,updateSpecialCollection,validateSpecialDeck,
 equipSpecialDeck,openSpecialPack} from './specialDeckBuilder.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

function storage(initial={}){
 const values=new Map(Object.entries(initial));
 const writes=[];
 return {getItem:key=>values.get(key)??null,setItem:(key,v)=>{writes.push(key);values.set(key,v);},
  values,writes};
}
function setJson(s,key,value){s.values.set(key,JSON.stringify(value));}
function saveForRift(rift){
 const relics=Object.fromEntries(rift.relicsRequired.map(key=>[key,true]));
 return storage({
  [LEGACY_EPIC_KEYS.relics]:JSON.stringify(relics),
  [LEGACY_EPIC_KEYS.rifts]:JSON.stringify({[rift.id]:true}),
  [LEGACY_EPIC_KEYS.inventory]:JSON.stringify({[rift.itemId]:{unlocked:true,level:2}}),
  [LEGACY_EPIC_KEYS.equipped]:JSON.stringify([rift.itemId,null]),
  [LEGACY_EPIC_KEYS.level]:'60'
 });
}
const ownedShip={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],loadout:['ship:N00']};
function equippedWith(owned,ids){
 const loadout=[...owned.loadout];
 ids.forEach((id,i)=>{loadout[i]=id;});
 return equipSpecialDeck(owned,loadout);
}

test('Le 12 reliquie storiche danno diritto ai SEI Epici solo dopo la fusione già registrata',()=>{
 assert.equal(PHASE16A_RIFTS.length,6);
 const allRelics=new Set();
 for(const rift of PHASE16A_RIFTS){
  assert.equal(rift.relicsRequired.length,2);
  rift.relicsRequired.forEach(id=>allRelics.add(id));
  const s=saveForRift(rift);
  const before=Object.fromEntries([...s.values]);
  const progress=readLegacyEpicProgress(s);
  assert.deepEqual(progress.unlocked,[rift.itemId]);
  assert.equal(progress.slotLimit,2);
  const collection=readSpecialCollection(s);
  assert.equal(collection.owned[rift.itemId],1);
  assert.equal(collection.loadout.filter(id=>id===rift.itemId).length,0,
   'Non equipaggiare la carta automaticamente');
  assert.deepEqual(Object.fromEntries(s.values),before,'La lettura non scrive salvataggi');
  assert.deepEqual(s.writes,[]);
 }
 assert.equal(allRelics.size,12);
});

test('Reliquie da sole, equipaggiamento storico o Varco senza reliquie non creano oggetti',()=>{
 const r=PHASE16A_RIFTS[0];
 const keys=LEGACY_EPIC_KEYS;
 const relics=Object.fromEntries(r.relicsRequired.map(id=>[id,true]));
 for(const payload of [
  {[keys.relics]:JSON.stringify(relics)},
  {[keys.equipped]:JSON.stringify([r.itemId,null])},
  {[keys.rifts]:JSON.stringify({[r.id]:true})}
 ]){
  const s=storage(payload);
  assert.deepEqual(readLegacyEpicProgress(s).unlocked,[]);
  assert.equal(readSpecialCollection(s).owned[r.itemId],0);
 }
 const restored=storage({
  [keys.relics]:JSON.stringify(relics),
  [keys.rifts]:JSON.stringify({[r.id]:true})
 });
 assert.deepEqual(readLegacyEpicProgress(restored).unlocked,[r.itemId],
  'Vecchi salvataggi con il Varco completato e reliquie autentiche restano riconosciuti');
 const oldOnly=storage({[keys.inventory]:JSON.stringify({[r.itemId]:{unlocked:true,level:3}})});
 assert.deepEqual(readLegacyEpicProgress(oldOnly).unlocked,[r.itemId],
  'Un inventario storico esplicitamente sbloccato non viene cancellato');
});

test('La migrazione è idempotente, una sola scrittura sul mazzo speciale e zero modifiche ai vecchi inventari',()=>{
 const s=saveForRift(PHASE16A_RIFTS[0]);
 const original=createSpecialCollection();
 const originalRaw=JSON.stringify(original);
 s.values.set(SPECIAL_COLLECTION_KEY,originalRaw);
 const legacyKeys=Object.values(LEGACY_EPIC_KEYS);
 const legacyBefore=Object.fromEntries(legacyKeys.map(k=>[k,s.getItem(k)]));
 const first=updateSpecialCollection(current=>current,s);
 assert.equal(first.owned[PHASE16A_RIFTS[0].itemId],1);
 assert.deepEqual(s.writes,[SPECIAL_COLLECTION_KEY]);
 const afterFirst=s.getItem(SPECIAL_COLLECTION_KEY);
 assert.notEqual(afterFirst,originalRaw);
 const second=updateSpecialCollection(current=>current,s);
 assert.equal(second.owned[PHASE16A_RIFTS[0].itemId],1);
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),afterFirst);
 assert.deepEqual(s.writes,[SPECIAL_COLLECTION_KEY]);
 for(const k of legacyKeys)assert.equal(s.getItem(k),legacyBefore[k],k);
 assert.deepEqual(second.loadout,original.loadout);
 assert.equal(second.packCredits,original.packCredits);
});

test('I sei Epici sono carte normali, non nei pacchetti e non duplicabili',()=>{
 const ids=Object.keys(TACTICAL_EPIC_CARDS);
 assert.equal(ids.length,6);
 for(const id of ids){
  assert.equal(SPECIAL_CARD_CATALOG[id]?.family,'epic');
  assert.equal(specialCardMaxCopies(id),1);
  assert.equal(SPECIAL_PACK_TYPES.includes(id),false);
 }
 const original=createSpecialCollection();
 assert.ok(ids.every(id=>original.owned[id]===0));
 const owned={...original,owned:{...original.owned,[ids[0]]:1,[ids[1]]:1,[ids[2]]:1}};
 const one=equippedWith(owned,[ids[0]]);
 assert.equal(validateSpecialDeck(one,one.loadout).valid,true);
 const two=equippedWith(owned,[ids[0],ids[1]]);
 assert.equal(validateSpecialDeck(two,two.loadout).valid,true);
 const triple=[...two.loadout];triple[2]=ids[2];
 assert.equal(validateSpecialDeck(owned,triple).reason,'epic_limit');
 const duplicate=[...two.loadout];duplicate[1]=ids[0];
 assert.equal(validateSpecialDeck(owned,duplicate).reason,'copy_limit');
 const pack=openSpecialPack({...owned,packCredits:1},()=>.99);
 assert.equal(pack.opened,true);
 assert.ok(pack.drawn.every(id=>!Object.hasOwn(TACTICAL_EPIC_CARDS,id)));
});

test('Slot originali: zero sotto L20, uno dopo Varco/L20, due a L60',()=>{
 const none=resolveLegacyEpicProgress({pilotLevel:19});
 assert.equal(none.slotLimit,0);
 assert.equal(resolveLegacyEpicProgress({pilotLevel:20}).slotLimit,1);
 assert.equal(resolveLegacyEpicProgress({pilotLevel:60}).slotLimit,2);
 const r=PHASE16A_RIFTS[0];
 assert.equal(resolveLegacyEpicProgress({pilotLevel:3,rifts:{[r.id]:true}}).slotLimit,1);
});

test('Nel duello ufficiale si attiva SOLO se realmente equipaggiato; la madre non riceve un passivo gratuito',()=>{
 const r=PHASE16A_RIFTS.find(x=>x.itemId==='epic_item_7');
 const s=saveForRift(r);
 const collection=readSpecialCollection(s);
 const equipped=equippedWith(collection,[r.itemId]);
 assert.throws(()=>officialBattleSetup({mode:'campaign',shipCollection:ownedShip,
  specialCollection:equipped,pilotLevel:19,seed:9}),/Slot Epici/);
 const session=officialBattleSetup({mode:'campaign',shipCollection:ownedShip,
  specialCollection:equipped,pilotLevel:20,seed:9});
 const b=session.battle;
 assert.deepEqual(b.sides.A.epic.entitlements,[r.itemId]);
 assert.equal(b.sides.A.epic.active,null,'Nessun bonus da oggetto solo equipaggiato');
 const all=[...b.sides.A.special.hand,...b.sides.A.special.deck];
 assert.equal(all.length,24);
 assert.equal(all.filter(c=>c.type===r.itemId).length,1);
 const hand=b.sides.A.special.hand,deck=b.sides.A.special.deck;
 let index=hand.findIndex(c=>c.type===r.itemId);
 if(index<0){const di=deck.findIndex(c=>c.type===r.itemId);assert.ok(di>=0);
  [hand[0],deck[di]]=[deck[di],hand[0]];index=0;}
 const first=sealTacticalOrder(b,'A',{specialIndices:[index],numericIndices:[]},100);
 assert.equal(first.ok,true,first.reason);
 const rival=sealTacticalOrder(first.battle,'B',{specialIndices:[],numericIndices:[]},101);
 assert.equal(rival.ok,true,rival.reason);
 const result=advanceTacticalDuel(rival.battle,101);
 assert.equal(result.sides.A.epic.active.id,r.itemId);
 assert.equal(result.sides.A.epic.used.filter(id=>id===r.itemId).length,1);
 assert.equal(result.sides.A.special.hand.length+result.sides.A.special.deck.length+
  result.sides.A.special.discard.length,24);
 const legacy=combatSpecialLoadout(equipped,'legacy');
 assert.equal(legacy.includes(r.itemId),false,'Nel motore storico la speciale non è una carta morta');
 assert.equal(equipped.loadout.includes(r.itemId),true,'Il filtro legacy non cambia la collezione');
});

test('Un Epic nel mazzo non equipaggiato storicamente è ammesso se il Varco è fuso e il limite lo permette',()=>{
 const r=PHASE16A_RIFTS[0];
 const saved=saveForRift(r);
 const owned=readSpecialCollection(saved);
 const equipped=equippedWith(owned,[r.itemId]);
 const battle=officialBattleSetup({mode:'pvp',shipCollection:ownedShip,specialCollection:equipped,
  pilotLevel:1,epicRiftOpened:true,seed:101}).battle;
 assert.equal(battle.mode,'pvp');
 assert.ok(battle.sides.A.epic.entitlements.includes(r.itemId));
 const without=officialBattleSetup({mode:'pvp',shipCollection:ownedShip,
  specialCollection:owned,seed:101}).battle;
 assert.equal(without.sides.A.epic.active,null);
});

test('Un salvataggio Epico storico corrotto non viene sovrascritto',()=>{
 const s=storage({
  [LEGACY_EPIC_KEYS.inventory]:'{not-json}',
  [SPECIAL_COLLECTION_KEY]:JSON.stringify(createSpecialCollection())
 });
 const before=new Map(s.values);
 assert.throws(()=>readSpecialCollection(s));
 assert.throws(()=>updateSpecialCollection(current=>current,s));
 assert.deepEqual([...s.values],[...before]);
 assert.deepEqual(s.writes,[]);
});
