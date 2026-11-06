import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_SHIPS} from './mathDuelEngine.js';
import {SHIP_COLLECTION_KEY,readShipCollection,updateShipCollection,
 equipShipCards} from './shipCollection.js';
import {SHIP_CAMPAIGN_UNLOCKS,shipUnlockForSector,claimCampaignShipUnlock} from './shipCampaignRewards.js';

function storage(initial={}){
 const data=new Map(Object.entries(initial));
 return {getItem:key=>data.get(key)??null,
  setItem:(key,value)=>{data.set(key,value);},
  dump:()=>Object.fromEntries(data)};
}

test('tutti i 16 modelli dopo Aurora hanno una sola soglia di campagna',()=>{
 const all=PHASE1_SHIPS.map(x=>x.id);
 assert.equal(all.length,17);
 assert.equal(SHIP_CAMPAIGN_UNLOCKS.length,16);
 assert.equal(new Set(SHIP_CAMPAIGN_UNLOCKS.map(m=>m.shipId)).size,16);
 assert.equal(new Set(SHIP_CAMPAIGN_UNLOCKS.map(m=>m.sector)).size,16);
 assert.deepEqual(
  SHIP_CAMPAIGN_UNLOCKS.map(m=>m.shipId).sort(),
  all.filter(id=>id!=='N00').sort());
 let prev=0;
 for(const milestone of SHIP_CAMPAIGN_UNLOCKS){
  assert.ok(milestone.sector>prev&&milestone.sector<=120);
  assert.deepEqual(shipUnlockForSector('adventure',milestone.sector),milestone);
  assert.deepEqual(shipUnlockForSector('campaign',milestone.sector),milestone);
  assert.equal(shipUnlockForSector('pvp',milestone.sector),null);
  prev=milestone.sector;
 }
 assert.equal(shipUnlockForSector('adventure',1),null);
 assert.equal(shipUnlockForSector('adventure',NaN),null);
 assert.equal(shipUnlockForSector('adventure',3.5),null);
 assert.equal(shipUnlockForSector('adventure','3'),null);
});

test('una vittoria a soglia assegna esattamente una navicella senza duplicati',async()=>{
 const store=storage({eclissi_legacy_level:'17',eclissi_stardust:'985'});
 for(const {sector,shipId} of SHIP_CAMPAIGN_UNLOCKS){
  const granted=await claimCampaignShipUnlock('adventure',sector,store);
  assert.equal(granted.granted,true);
  assert.equal(granted.shipId,shipId);
  const replay=await claimCampaignShipUnlock('adventure',sector,store);
  assert.equal(replay.granted,false);
  assert.equal(replay.reason,'already_owned');
 }
 const collection=readShipCollection(store);
 assert.equal(collection.cards.length,17);
 assert.equal(new Set(collection.cards.map(x=>x.shipId)).size,17);
 assert.deepEqual(collection.loadout,['ship:N00']);
 assert.equal(store.getItem('eclissi_legacy_level'),'17');
 assert.equal(store.getItem('eclissi_stardust'),'985');
 assert.equal(collection.schemaVersion,1);
});

test('nessuna ricompensa navicella in Prova o PvP, nemmeno dopo una vittoria',async()=>{
 const store=storage();
 for(const mode of ['pvp','training','classic',null]){
  const x=await claimCampaignShipUnlock(mode,3,store);
  assert.equal(x.granted,false);
 }
 const skip=await claimCampaignShipUnlock('adventure',4,store);
 assert.equal(skip.granted,false);
 assert.equal(store.getItem(SHIP_COLLECTION_KEY),null);
});

test('equipaggiare una nuova madre non rimuove le altre carte già possedute',async()=>{
 const store=storage();
 await claimCampaignShipUnlock('adventure',3,store);
 await claimCampaignShipUnlock('adventure',6,store);
 const saved=await updateShipCollection(current=>
  equipShipCards(current,['ship:C02']),store);
 assert.deepEqual(saved.loadout,['ship:C02']);
 assert.deepEqual(saved.cards.map(x=>x.shipId),['N00','C01','C02']);
 const replay=await claimCampaignShipUnlock('adventure',6,store);
 assert.equal(replay.granted,false);
 assert.deepEqual(readShipCollection(store),saved);
});

test('salvataggi illeggibili non vengono sostituiti da un nuovo premio',async()=>{
 const previous='{broken json';
 const store=storage({[SHIP_COLLECTION_KEY]:previous});
 await assert.rejects(()=>claimCampaignShipUnlock('adventure',3,store));
 assert.equal(store.getItem(SHIP_COLLECTION_KEY),previous);
 const incompatible=storage({[SHIP_COLLECTION_KEY]:'{"schemaVersion":99}'});
 await assert.rejects(()=>claimCampaignShipUnlock('adventure',3,incompatible));
 assert.equal(incompatible.getItem(SHIP_COLLECTION_KEY),'{"schemaVersion":99}');
});
