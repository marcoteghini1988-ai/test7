import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORT_SLOT_CAMPAIGN_UNLOCKS,supportMilestoneForSector,
 npcSupportRoster,unlockedNpcSupportSlots} from './fleetNext/supportCampaign.js';
import {supportIdFor,supportModelIdFor} from './fleetNext/supportCatalog.js';
import {createSupportCollection,readSupportCollection,writeSupportCollection,
 grantSupportInstance,equipSupportInstance,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {claimCampaignSupportUnlock} from './shipCampaignRewards.js';
import {createFleetSide,createFleetNextBattle,protectingFleetUnits,
 fusionShipUnavailableReason,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {shipMaxLevel} from './fleetNext/progression.js';

function storage(){
 const data=new Map();
 return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),
  dump:()=>Object.fromEntries(data)};
}
test('I due slot sono milestone della campagna e non livelli navicella',()=>{
 assert.deepEqual(SUPPORT_SLOT_CAMPAIGN_UNLOCKS.map(m=>m.sector),[20,60]);
 assert.equal(supportMilestoneForSector('pvp',20),null);
 assert.equal(supportMilestoneForSector('campaign',20).slot,0);
 assert.equal(supportMilestoneForSector('adventure',60).slot,1);
 assert.equal(unlockedNpcSupportSlots('campaign',1),0);
 assert.equal(unlockedNpcSupportSlots('campaign',20),1);
 assert.equal(unlockedNpcSupportSlots('campaign',59),1);
 assert.equal(unlockedNpcSupportSlots('campaign',60),2);
 assert.equal(unlockedNpcSupportSlots('pvp',2,1),1);
 assert.equal(npcSupportRoster('L04','campaign',120).length,2);
});
test('Ricompense supporti: primo al settore 20, secondo al 60, mai duplicati',()=>{
 const store=storage();
 assert.equal(claimCampaignSupportUnlock('campaign',19,store).granted,false);
 assert.equal(store.getItem('eclissi_support_collection_v1'),null);
 const first=claimCampaignSupportUnlock('adventure',20,store);
 assert.equal(first.granted,true);assert.equal(first.slot,0);
 let owned=readSupportCollection(store);
 assert.equal(owned.unlockedSlots,1);
 assert.equal(owned.owned.length,1);
 assert.equal(owned.owned[0].supportId,supportModelIdFor('N00'));
 assert.equal(owned.equipped[0],owned.owned[0].instanceId);
 const again=claimCampaignSupportUnlock('campaign',20,store);
 assert.equal(again.granted,false);assert.equal(again.reason,'already_claimed');
 assert.equal(readSupportCollection(store).owned.length,1);
 const second=claimCampaignSupportUnlock('campaign',60,store);
 assert.equal(second.granted,true);assert.equal(second.slot,1);
 owned=readSupportCollection(store);
 assert.equal(owned.unlockedSlots,2);assert.equal(owned.owned.length,2);
 assert.equal(owned.owned[1].supportId,supportModelIdFor('C03'));
 assert.equal(owned.equipped[1],owned.owned[1].instanceId);
 assert.equal(claimCampaignSupportUnlock('adventure',60,store).granted,false);
 assert.equal(owned.claimedMilestones.length,2);
 for(const mode of ['training','pvp','classic',null])
  assert.equal(claimCampaignSupportUnlock(mode,20,store).granted,false);
});
test('Il passaggio tra madri mantiene la stessa coppia indipendente e le debolezze della nuova madre',()=>{
 let c=createSupportCollection();
 c={...c,unlockedSlots:2};
 c=grantSupportInstance(c,supportIdFor('C02',0));
 c=grantSupportInstance(c,supportIdFor('L03',1));
 c=equipSupportInstance(c,0,c.owned[0].instanceId);
 c=equipSupportInstance(c,1,c.owned[1].instanceId);
 const roster=equippedSupportRoster(c);
 const one=createFleetSide('C01',1,[],313,{},roster);
 const other=createFleetSide('N00',20,[],313,{},roster);
 assert.deepEqual(one.escorts.map(e=>e.catalogSupportId),roster.map(e=>e.id));
 assert.deepEqual(other.escorts.map(e=>e.catalogSupportId),roster.map(e=>e.id));
 assert.deepEqual(one.escorts.map(e=>e.element),['refrigerant','mineral']);
 assert.deepEqual(other.escorts.map(e=>e.element),['refrigerant','mineral']);
 assert.deepEqual(one.escorts.map(e=>e.parentShipId),[null,null]);
 assert.ok(one.escorts.every(e=>e.linked&&e.hp>0));
 assert.equal(one.ships[0].level,1,'i supporti non cambiano il livello della madre');
 assert.deepEqual(one.escorts.map(e=>e.sourceIndices),[[0],[1]]);
 assert.ok(one.escorts.every(e=>e.visual.includes('/assets/escorts/')));
});
test('Il motore ufficiale distingue la formazione vuota dalla formazione legacy',()=>{
 const modern=createFleetNextBattle({shipA:'L04',levelA:5,
  shipB:'N00',levelB:20,deckA:[],deckB:[],
  supportRosterA:[],supportRosterB:[],ruleset:HP_SYNC_RULESET,seed:1988});
 assert.equal(modern.sides.A.escorts.length,0);
 assert.equal(modern.sides.A.reserveEscorts.length,0);
 assert.equal(modern.sides.A.fusionLimit,0);
 assert.equal(modern.sides.B.escorts.length,0,'Aurora L20 non regala due supporti');
 assert.equal(protectingFleetUnits(modern.sides.A).length,0);
 const legacy=createFleetSide('L04',5,[],99);
 assert.equal(legacy.escorts.length,2);
 assert.equal(legacy.reserveEscorts.length,2,'le regressioni storiche restano isolate');
});
test('Due copie possedute dello stesso supporto usano entrambi gli slot, senza sparare autonomamente',()=>{
 let c={...createSupportCollection(),unlockedSlots:2};
 c=grantSupportInstance(c,supportIdFor('C03',1));
 c=grantSupportInstance(c,supportIdFor('C03',1));
 c=equipSupportInstance(c,0,c.owned[0].instanceId);
 c=equipSupportInstance(c,1,c.owned[1].instanceId);
 const chosen=equippedSupportRoster(c);
 const battle=createFleetNextBattle({shipA:'N00',levelA:1,shipB:'C01',levelB:1,
  deckA:[],deckB:[],supportRosterA:chosen,supportRosterB:[],
  ruleset:HP_SYNC_RULESET,seed:88});
 assert.deepEqual(battle.sides.A.escorts.map(e=>e.catalogSupportId),
  [supportIdFor('C03',1),supportIdFor('C03',1)]);
 assert.notEqual(battle.sides.A.escorts[0].id,battle.sides.A.escorts[1].id);
 assert.equal(battle.sides.A.ships[0].level,1);
 assert.equal(battle.sides.B.escorts.length,0);
 const all=[...battle.sides.A.hand,...battle.sides.A.deck];
 assert.equal(all.some(id=>id.startsWith('support-')),false,
  'le carte-unità non vanno nel mazzo da 40');
 const result=resolveFleetNextTurn(battle,'A',{cards:[],pass:true},100);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.sides.A.escorts.length,2);
});
test('Tutte le madri possono fondere due supporti indipendenti, ma solo a livello MAX',()=>{
 const low=[
  {id:supportModelIdFor('L01'),instanceId:'fusion:1',slot:0,level:1},
  {id:supportModelIdFor('N00'),instanceId:'fusion:2',slot:1,level:1}
 ];
 const denied=createFleetSide('C01',1,[],11,{},low);
 assert.equal(denied.fusionLimit,2);
 assert.match(fusionShipUnavailableReason(denied,'C03',0),/MAX/);
 assert.match(fusionShipUnavailableReason(denied,'C03',1),/MAX/);
 const chosen=low.map(unit=>({...unit,level:shipMaxLevel(unit.id==='support-model-l01'?'L01':'N00')}));
 const allowed=createFleetSide('C01',1,[],11,{},chosen);
 assert.equal(allowed.fusionLimit,2);
 assert.equal(fusionShipUnavailableReason(allowed,'C03',0),'');
 assert.equal(fusionShipUnavailableReason(allowed,'C03',1),'');
 const arca=createFleetSide('L04',5,[],11,{},chosen);
 assert.equal(arca.fusionLimit,2);
 assert.equal(arca.reserveEscorts.length,0);
});
test('Salvataggio illeggibile: i traguardi non cancellano niente',()=>{
 const store=storage();
 store.setItem('eclissi_support_collection_v1','{broken');
 assert.throws(()=>claimCampaignSupportUnlock('campaign',20,store));
 assert.equal(store.getItem('eclissi_support_collection_v1'),'{broken');
});
test('Hangar e battaglia ufficiali usano il nuovo equipaggiamento',()=>{
 const hangar=readFileSync(new URL('./ShipCollectionPanels.jsx',import.meta.url),'utf8');
 const game=readFileSync(new URL('./OfficialFleetBattle3D.jsx',import.meta.url),'utf8');
 const reward=readFileSync(new URL('./officialLiveRewardClaims.js',import.meta.url),'utf8');
 assert.match(hangar,/<SupportHangarPanel\/>/);
 assert.match(game,/readSupportCollection\(\)/);
 assert.match(game,/supportRosterA:/);
 assert.match(game,/supportRosterB:/);
 assert.match(reward,/claimCampaignSupportUnlock/);
});
