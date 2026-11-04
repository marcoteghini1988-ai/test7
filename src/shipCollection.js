import {getShipDefinition, validFleet} from './mathDuelEngine.js';

export const SHIP_COLLECTION_KEY = 'eclissi_ship_collection';
const SCHEMA_VERSION = 1;
const STARTER = 'N00';

function newCard(cards, shipId) {
  const baseId = `ship:${shipId}`;
  let instanceId = baseId;
  for (let n = 2; cards.some(card => card.instanceId === instanceId); n++) {
    instanceId = `${baseId}:${n}`;
  }
  return {instanceId, shipId, level: 1};
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
    if (!getShipDefinition(entry?.shipId) || cards.some(card => card.shipId === entry.shipId)) continue;
    const card = newCard(cards, entry.shipId);
    if (typeof entry.instanceId === 'string' && entry.instanceId.trim() &&
        !cards.some(c => c.instanceId === entry.instanceId)) {
      card.instanceId = entry.instanceId;
    }
    card.level = Number.isInteger(entry.level) ? Math.max(1, Math.min(5, entry.level)) : 1;
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

export function upgradeShipCard(collection, instanceId, level) {
  const card = collection.cards.find(entry => entry.instanceId === instanceId);
  if (!card || !Number.isInteger(level) || level < card.level || level > 5 || level > card.level + 1) {
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
