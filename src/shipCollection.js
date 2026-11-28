import {getShipDefinition, validFleet} from './fleetNext/shipCore.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import {nativeMotherRarity,rarityFromLegacyLevel,isShipRarity,
 rarityIndex,nextShipRarity,RARITY_DUPLICATE_COPIES} from './fleetNext/shipRarity.js';

export const SHIP_COLLECTION_KEY = 'eclissi_ship_collection';
const SCHEMA_VERSION = 1;
const STARTER = 'N00';

function newCard(cards, shipId, rarita = nativeMotherRarity(shipId)) {
  const baseId = `ship:${shipId}`;
  let instanceId = baseId;
  for (let n = 2; cards.some(card => card.instanceId === instanceId); n++) {
    instanceId = `${baseId}:${n}`;
  }
  return {instanceId, shipId, level: 1, rarita};
}

function resolveLoadout(cards, loadout) {
  return loadout.map(id => cards.find(card => card.instanceId === id));
}

function normalizeCollection(saved) {
  if (saved !== null && (typeof saved !== 'object' || Array.isArray(saved) ||
      (saved.schemaVersion !== undefined && saved.schemaVersion !== SCHEMA_VERSION))) {
    throw new Error('Formato della collezione non supportato');
  }
  const cards = [];
  for (const entry of Array.isArray(saved?.cards) ? saved.cards : []) {
    if (!getShipDefinition(entry?.shipId)) continue;
    const minimum = nativeMotherRarity(entry.shipId);
    const migrated = isShipRarity(entry.rarita) ? entry.rarita :
      rarityFromLegacyLevel(entry.shipId,entry.level);
    const rarita=rarityIndex(migrated)>=rarityIndex(minimum)?migrated:minimum;
    const card = newCard(cards, entry.shipId,rarita);
    if (typeof entry.instanceId === 'string' && entry.instanceId.trim() &&
        !cards.some(c => c.instanceId === entry.instanceId)) {
      card.instanceId = entry.instanceId;
    }
    card.level = Number.isInteger(entry.level) ? Math.max(1, Math.min(shipMaxLevel(entry.shipId), entry.level)) : 1;
    cards.push(card);
  }
  if (!cards.some(card => card.shipId === STARTER)) cards.unshift(newCard(cards, STARTER));

  const fleet = [];
  for (const card of resolveLoadout(cards, Array.isArray(saved?.loadout) ? saved.loadout : [])) {
    if (card && validFleet([...fleet, card].map(c => c.shipId))) fleet.push(card);
  }
  if (!fleet.length) fleet.push(cards.find(card => card.shipId === STARTER));
  return {schemaVersion: SCHEMA_VERSION, cards, loadout: fleet.map(card => card.instanceId)};
}

export function writeShipCollection(collection,storage=globalThis.localStorage){
  const value=normalizeCollection(collection);
  storage.setItem(SHIP_COLLECTION_KEY,JSON.stringify(value));
  return value;
}

export function readShipCollection(storage = globalThis.localStorage) {
  return normalizeCollection(JSON.parse(storage.getItem(SHIP_COLLECTION_KEY)));
}

// Read the current snapshot at each write. Inventory, levels and equipment
// share one storage entry, so a failed write cannot save only part of a change.
export async function updateShipCollection(change, storage = globalThis.localStorage) {
  function commit() {
    const raw = storage.getItem(SHIP_COLLECTION_KEY);
    const next = normalizeCollection(change(normalizeCollection(JSON.parse(raw))));
    const payload = JSON.stringify(next);
    if (payload !== raw) storage.setItem(SHIP_COLLECTION_KEY, payload);
    return next;
  }
  const locks = typeof window === 'undefined' ? null : window.navigator.locks;
  return locks ? locks.request(SHIP_COLLECTION_KEY, commit) : commit();
}

export function grantShipCard(collection, shipId) {
  if (!getShipDefinition(shipId)) throw new Error('Modello di nave sconosciuto');
  if (collection.cards.some(card => card.shipId === shipId)) return collection;
  return {...collection, cards: [...collection.cards, newCard(collection.cards, shipId)]};
}

// Le copie sono fisiche: due duplicate della STESSA rarità vengono
// consumate, una copia rimane nell'album e nasce una carta superiore.
export function grantShipCopy(collection,shipId,rarita=nativeMotherRarity(shipId)){
  const minimum=nativeMotherRarity(shipId);
  if(!getShipDefinition(shipId)||!isShipRarity(rarita)||
    rarityIndex(rarita)<rarityIndex(minimum))
    throw Error('Modello o rarità della madre non validi');
  return {...collection,cards:[...collection.cards,newCard(collection.cards,shipId,rarita)]};
}
export function evolveMotherWithDuplicates(collection,instanceId){
  const chosen=collection.cards.find(c=>c.instanceId===instanceId);
  if(!chosen)throw Error('Carta madre da evolvere non posseduta');
  const next=nextShipRarity(chosen.rarita);
  if(!next)throw Error('La madre è già Leggendaria');
  const same=collection.cards.filter(c=>c.shipId===chosen.shipId&&c.rarita===chosen.rarita);
  if(same.length<RARITY_DUPLICATE_COPIES)
    throw Error('Servono tre copie della stessa madre e rarità');
  const materials=same.filter(c=>c.instanceId!==chosen.instanceId).slice(0,RARITY_DUPLICATE_COPIES-1);
  const consumed=new Set(materials.map(c=>c.instanceId));
  let result={...collection,cards:collection.cards.filter(c=>!consumed.has(c.instanceId)),
    loadout:collection.loadout.map(id=>consumed.has(id)?chosen.instanceId:id)};
  result=grantShipCopy(result,chosen.shipId,next);
  return result;
}
export function upgradeShipCard(collection, instanceId, level) {
  const card = collection.cards.find(entry => entry.instanceId === instanceId);
  if (!card || !Number.isInteger(level) || level < card.level || level > shipMaxLevel(card.shipId) || level > card.level + 1) {
    throw new Error('Potenziamento della navicella non valido');
  }
  if (level === card.level) return collection;
  return {...collection, cards: collection.cards.map(entry =>
    entry === card ? {...entry, level} : entry)};
}

export function equipShipCards(collection, loadout) {
  const fleet = resolveLoadout(collection.cards, loadout);
  if (fleet.some(card => !card) || !validFleet(fleet.map(card => card.shipId))) {
    throw new Error('La flotta deve contenere da una a tre carte possedute e al massimo due navi specializzate per seme.');
  }
  return {...collection, loadout: [...loadout]};
}

export function collectionBattleOptions(collection) {
  const fleet = resolveLoadout(collection.cards, collection.loadout);
  return {
    fleetIds: fleet.map(card => card.shipId),
    shipLevels: Object.fromEntries(fleet.map(card => [card.shipId, card.level])),
  };
}
