import test from 'node:test';
import assert from 'node:assert/strict';
import {createShip,dealHit,fleetCompatibility,initialBattle,newVessel,vesselDestroyed} from './mathDuelEngine.js';
import {
  SHIP_COLLECTION_KEY,collectionBattleOptions,equipShipCards,grantShipCard,
  readShipCollection,updateShipCollection,upgradeShipCard,
} from './shipCollection.js';

function makeStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('la prima apertura aggiunge Aurora senza riscrivere i progressi R12', async () => {
  const legacy = {eclissi_level: '12', eclissi_xp: '410', eclissi_stardust: '230',
    eclissi_campaign_stars: '{"1-1":3}', eclissi_weapons_levels: '{"laser":4}'};
  const storage = makeStorage(legacy);
  const first = await updateShipCollection(current => current, storage);
  assert.deepEqual(first, {schemaVersion: 1,
    cards: [{instanceId: 'ship:N00', shipId: 'N00', level: 1}], loadout: ['ship:N00']});
  assert.deepEqual(readShipCollection(storage), first);
  for (const [key, value] of Object.entries(legacy)) assert.equal(storage.getItem(key), value);
});

test('ricompensa e upgrade sono ripetibili e conservano identità, flotta e livelli al ricaricamento', async () => {
  const storage = makeStorage();
  const grant = current => grantShipCard(current, 'R04');
  await updateShipCollection(grant, storage);
  await updateShipCollection(grant, storage);
  const upgrade = current => upgradeShipCard(current, 'ship:R04', 2);
  await updateShipCollection(upgrade, storage);
  await updateShipCollection(upgrade, storage);
  const equipped = await updateShipCollection(current => equipShipCards(current, ['ship:R04', 'ship:N00']), storage);
  const reloaded = readShipCollection(storage);
  assert.deepEqual(equipped, reloaded);
  assert.equal(reloaded.cards.length, 2);
  assert.deepEqual(reloaded.cards[1], {instanceId: 'ship:R04', shipId: 'R04', level: 2});
  assert.throws(() => upgradeShipCard(reloaded, 'ship:R04', 4));
  const battle = initialBattle(1, collectionBattleOptions(reloaded));
  assert.deepEqual(battle.player.fleet, [newVessel('R04', 2), newVessel('N00', 1)]);
  assert.deepEqual(battle.enemy.fleet, battle.player.fleet);
});

test('il caricamento ripara la flotta ma conserva la proprietà delle carte escluse', async () => {
  const raw = {cards: [
    {instanceId: 'aurora', shipId: 'N00', level: 0},
    {instanceId: 'duplicate-aurora', shipId: 'N00', level: 3},
    {instanceId: 'falco', shipId: 'R01', level: 6},
    {instanceId: 'iride', shipId: 'R03', level: 2},
    {instanceId: 'lince', shipId: 'C01', level: 4},
    {instanceId: 'unknown', shipId: 'XX', level: 1},
  ], loadout: ['unknown', 'falco', 'iride', 'lince', 'aurora', 'aurora']};
  const storage = makeStorage({[SHIP_COLLECTION_KEY]: JSON.stringify(raw)});
  const loaded = readShipCollection(storage);
  assert.deepEqual(loaded.loadout, ['falco', 'iride', 'aurora']);
  assert.deepEqual(loaded.cards.map(c => [c.instanceId, c.level]), [
    ['aurora', 1], ['falco', 5], ['iride', 2], ['lince', 4],
  ]);
  assert.throws(() => equipShipCards(loaded, ['falco', 'iride', 'lince']));
  assert.throws(() => equipShipCards(loaded, ['unknown']));
  assert.throws(() => equipShipCards(loaded, ['aurora', 'aurora']));
  assert.throws(() => equipShipCards(loaded, []));
  assert.deepEqual(await updateShipCollection(current => current, storage), loaded);
  assert.equal(JSON.parse(storage.getItem(SHIP_COLLECTION_KEY)).schemaVersion, 1);
});

test('una scrittura fallita o uno schema futuro preservano il salvataggio precedente', async () => {
  const storage = makeStorage();
  await updateShipCollection(current => current, storage);
  const saved = storage.getItem(SHIP_COLLECTION_KEY);
  const failing = {...storage, setItem() {throw new Error('Spazio esaurito');}};
  await assert.rejects(updateShipCollection(current => grantShipCard(current, 'L01'), failing));
  assert.equal(storage.getItem(SHIP_COLLECTION_KEY), saved);
  for (const raw of ['{"schemaVersion":2}', '{']) {
    storage.setItem(SHIP_COLLECTION_KEY, raw);
    await assert.rejects(updateShipCollection(current => current, storage));
    assert.equal(storage.getItem(SHIP_COLLECTION_KEY), raw);
  }
});

test('la compatibilità usa i livelli effettivi e un KO resta nella singola partita', async () => {
  assert.equal(fleetCompatibility(['R01'], ['R04'], 1, {R01: 3}, {R04: 1}).compatible, true);
  assert.deepEqual(fleetCompatibility(['R01'], ['R04'], 1, {R01: 2}, {R04: 1}).playerMissing, ['times']);
  const storage = makeStorage();
  const saved = await updateShipCollection(current => upgradeShipCard(current, 'ship:N00', 2), storage);
  const battle = initialBattle(1, collectionBattleOptions(saved));
  const attacker = createShip(1, true, {fleetIds: ['L03'], shipLevel: 5});
  const cards = [{value: 13, suit: '♥'}, {value: 12, suit: '♥'}];
  const damaged = dealHit(battle.player, attacker, 'plus', 25, cards).defender;
  const destroyed = dealHit(damaged, attacker, 'minus', 1, cards).defender;
  assert.equal(vesselDestroyed(destroyed.fleet[0]), true);
  assert.deepEqual(readShipCollection(storage), saved);
  assert.deepEqual(initialBattle(1, collectionBattleOptions(saved)).player.fleet, [newVessel('N00', 2)]);
});
