// Collaudo integrato del percorso ufficiale 18/11/2026.
// Esegue le vere API di campagna, inventario, negozio, Hangar e combattimento.
// Nessun valore di bilanciamento viene cambiato; nessun salvataggio utente toccato.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetInventory,readFleetInventory,writeFleetInventory} from './fleetNext/collection.js';
import {readShipCollection,writeShipCollection,equipShipCards} from './shipCollection.js';
import {purchaseMotherCopy,evolveMotherCopy} from './shipRarityShop.js';
import {readSupportCollection,writeSupportCollection,equipSupportInstance,
 equippedSupportRoster} from './fleetNext/supportCollection.js';
import {supportModelIdFor,SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {purchaseSupportCopy,evolveSupportCopy} from './fleetNext/supportShop.js';
import {claimCampaignShipUnlock,claimCampaignSupportUnlock} from './shipCampaignRewards.js';
import {claimRarityCampaignVictory} from './fleetNext/rarityCampaign.js';
import {combatLevelForRarity,motherCombatStatsForRarity} from './fleetNext/shipRarity.js';
import {buyNextCommonCard,buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';
import {createFleetNextBattle,resolveFleetNextTurn,fuseIndependentSupportWithShip,
 fusionShipUnavailableReason} from './fleetNext/combat.js';
import {OFFICIAL_MOTHER_IDS} from './fleetNext/officialMotherIds.js';
import {FUSION_SHIP_CARDS} from './fleetNext/fusionShipCards.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';

function storage(credits=30000) {
 const saved=new Map();
 const store={
  getItem:key=>saved.get(key)??null,
  setItem:(key,value)=>saved.set(key,String(value)),
  removeItem:key=>saved.delete(key),
  snapshot:()=>Object.fromEntries(saved)
 };
 writeFleetInventory({...createFleetInventory(),credits},store);
 return store;
}
const alive=(side,slot)=>side.escorts.find(e=>e.slot===slot&&e.hp>0&&!e.destroyed);

test('COLLAUDO integrato: vittoria, rarità, doppioni, Hangar, mazzo, turno e due fusioni',async()=>{
 const store=storage(),startingCredits=readFleetInventory(store).credits;
 assert.equal(readShipCollection(store).cards[0].rarita,'Comune');
 assert.equal(purchaseMotherCopy('N00','Rara',store).ok,false,
  'rarità superiore non acquistabile prima dello sblocco');
 const unlocked=await claimCampaignShipUnlock('campaign',3,store);
 assert.equal(unlocked.granted,true,'la vittoria assegna il modello madre');
 assert.ok(readShipCollection(store).cards.some(c=>c.shipId==='C01'));
 const milestone1=claimCampaignSupportUnlock('campaign',20,store);
 const milestone2=claimCampaignSupportUnlock('campaign',60,store);
 assert.equal(milestone1.granted,true);
 assert.equal(milestone2.granted,true);
 assert.equal(readSupportCollection(store).unlockedSlots,2);
 assert.equal(claimCampaignSupportUnlock('campaign',20,store).granted,false);
 assert.equal(claimCampaignSupportUnlock('campaign',60,store).granted,false);
 assert.equal(readSupportCollection(store).owned.length,2,
  'le vittorie ripetute non danno supporti duplicati');
 assert.equal(claimRarityCampaignVictory('campaign',85,store).rarity,'Leggendaria');

 for(let i=0;i<2;i++){
  const bought=purchaseMotherCopy('N00','Comune',store);
  assert.equal(bought.ok,true,bought.reason);
 }
 const mother=evolveMotherCopy('ship:N00',store);
 assert.equal(mother.ok,true,mother.reason);
 assert.equal(mother.rarita,'Rara');
 assert.equal(readShipCollection(store).cards.filter(c=>c.shipId==='N00'&&c.rarita==='Comune').length,1);
 assert.equal(readShipCollection(store).cards.filter(c=>c.shipId==='N00'&&c.rarita==='Rara').length,1);
 writeShipCollection(equipShipCards(readShipCollection(store),[mother.instanceId]),store);
 assert.equal(readShipCollection(store).loadout[0],mother.instanceId);

 const n00=supportModelIdFor('N00'),c03=supportModelIdFor('C03');
 for(let i=0;i<2;i++){
  const bought=purchaseSupportCopy(n00,'Comune',store);
  assert.equal(bought.ok,true,bought.reason);
 }
 const initialN00=readSupportCollection(store).owned.find(c=>c.supportId===n00);
 const supportUpgrade=evolveSupportCopy(initialN00.instanceId,store);
 assert.equal(supportUpgrade.ok,true,supportUpgrade.reason);
 assert.equal(supportUpgrade.rarita,'Rara');
 const legendary1=purchaseSupportCopy(n00,'Leggendaria',store);
 const legendary2=purchaseSupportCopy(c03,'Leggendaria',store);
 assert.equal(legendary1.ok,true,legendary1.reason);
 assert.equal(legendary2.ok,true,legendary2.reason);
 let chosen=readSupportCollection(store);
 chosen=equipSupportInstance(chosen,0,legendary1.instanceId);
 chosen=equipSupportInstance(chosen,1,legendary2.instanceId);
 writeSupportCollection(chosen,store);
 const roster=equippedSupportRoster(readSupportCollection(store));
 assert.deepEqual(roster.map(c=>c.rarita),['Leggendaria','Leggendaria']);
 assert.equal(new Set(roster.map(c=>c.instanceId)).size,2);

 let inv=readFleetInventory(store);
 for(const id of ['fusion-ship-r01','fusion-ship-l04']){
  const purchased=buyNextCommonCard(inv,id);
  assert.equal(purchased.ok,true,purchased.reason);
  inv=purchased.inventory;
 }
 writeFleetInventory(inv,store);
 const prepared=buildNextBaseDeck(readFleetInventory(store),'N00',
  combatLevelForRarity('N00','Rara'),['fusion-ship-r01','fusion-ship-l04']);
 assert.deepEqual(prepared.baseDeck,['fusion-ship-r01','fusion-ship-l04']);
 assert.equal(prepared.discarded.length,0);
 assert.ok(prepared.total<=40,'il mazzo non supera il limite');

 const battle=createFleetNextBattle({
  shipA:'N00',shipB:'C01',raritaA:'Rara',raritaB:'Rara',
  deckA:prepared.baseDeck,deckB:[],supportRosterA:roster,supportRosterB:[],
  seed:20261118,nowMs:0,mode:'campaign',sectorNumber:85,ruleset:HP_SYNC_RULESET
 });
 assert.equal(battle.sides.A.ships[0].maxHp,motherCombatStatsForRarity('Rara','N00').maxHp);
 assert.equal(battle.sides.A.escorts.length,2);
 assert.equal(battle.sides.A.fusionLimit,2);
 assert.equal(battle.deadlineMs,30000);
 assert.equal(fusionShipUnavailableReason(battle.sides.A,'R01',0),'');
 const before=battle.sides.A.escorts.map(e=>({hp:e.hp,maxHp:e.maxHp,element:e.element}));
 const walletBeforeCombat=readFleetInventory(store).credits;
 battle.sides.A.hand=['fusion-ship-r01'];battle.sides.A.deck=[];
 const one=resolveFleetNextTurn(battle,'A',{cards:[0],fusionSlot:0,pass:true},100);
 assert.equal(one.ok,true,one.reason);
 assert.equal(one.battle.sides.A.escorts[0].hp,before[0].hp);
 assert.equal(one.battle.sides.A.escorts[0].maxHp,before[0].maxHp);
 assert.equal(one.battle.sides.A.escorts[0].element,before[0].element);
 assert.equal(one.battle.sides.A.escorts[0].supportSkillIds.length,2);
 assert.ok(one.events.some(e=>e.kind==='fusion'));
 const enemyTurn=resolveFleetNextTurn(one.battle,'B',{cards:[],pass:true},200);
 assert.equal(enemyTurn.ok,true,enemyTurn.reason);
 enemyTurn.battle.sides.A.hand=['fusion-ship-l04'];enemyTurn.battle.sides.A.deck=[];
 const two=resolveFleetNextTurn(enemyTurn.battle,'A',{cards:[0],fusionSlot:1,pass:true},300);
 assert.equal(two.ok,true,two.reason);
 const after=two.battle.sides.A;
 assert.equal(after.fusionsUsed,2);
 assert.equal(after.escorts.length,2);
 assert.deepEqual(after.escorts.map(e=>e.slot),[0,1]);
 assert.equal(after.escorts[1].hp,before[1].hp);
 assert.equal(after.escorts[1].maxHp,before[1].maxHp);
 assert.equal(after.escorts[1].element,before[1].element);
 assert.equal(after.escorts[1].supportSkillIds.length,2);
 assert.ok(fusionShipUnavailableReason(after,'C02',null));
 assert.equal(readFleetInventory(store).credits,walletBeforeCombat,
  'il duello non modifica il portafoglio senza una ricompensa esplicita');
 assert.ok(walletBeforeCombat<startingCredits);
});

test('COLLAUDO incrociato: 12 madri Leggendarie x 13 supporti Leggendari',()=>{
 assert.equal(OFFICIAL_MOTHER_IDS.length,12);
 assert.equal(SUPPORT_CATALOG.length,13);
 assert.equal(FUSION_SHIP_CARDS.length,13);
 let total=0;
 for(const motherId of OFFICIAL_MOTHER_IDS){
  const motherStats=motherCombatStatsForRarity('Leggendaria',motherId);
  for(const support of SUPPORT_CATALOG){
   const roster=[{id:support.id,instanceId:'matrix:'+motherId+':'+support.shipModelId,
    slot:0,rarita:'Leggendaria',level:1}];
   const b=createFleetNextBattle({shipA:motherId,shipB:'N00',
    raritaA:'Leggendaria',raritaB:'Comune',deckA:[],deckB:[],
    supportRosterA:roster,supportRosterB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,
    seed:1988,nowMs:0});
   const a=b.sides.A,escort=alive(a,0);
   assert.ok(escort,motherId+' + '+support.shipModelId);
   assert.equal(a.ships[0].maxHp,motherStats.maxHp,motherId);
   assert.equal(a.ships[0].attackPower,motherStats.attackPower,motherId);
   assert.equal(a.ships[0].defensePower,motherStats.defensePower,motherId);
   assert.equal(escort.element,support.elementId,motherId+' + '+support.shipModelId);
   assert.equal(escort.supportSkillId,support.skillId,motherId+' + '+support.shipModelId);
   assert.equal(escort.supportRarity,'Leggendaria');
   assert.equal(fusionShipUnavailableReason(a,'R01',0),'');
   const hp=escort.hp,maxHp=escort.maxHp;
   const fused=fuseIndependentSupportWithShip(a,'R01',0);
   assert.equal(fused.ok,true,motherId+' + '+support.shipModelId+': '+fused.reason);
   assert.equal(fused.fused.hp,hp);
   assert.equal(fused.fused.maxHp,maxHp);
   assert.equal(fused.fused.supportSkillIds.length,2);
   assert.equal(a.escorts.length,1);
   total++;
  }
 }
 assert.equal(total,156);
});

test('COLLAUDO vittorie ufficiali: ricompense idempotenti, sblocco e nessun premio alla sconfitta',async()=>{
 const store=storage(0);
 const defeat=await claimOfficialLiveVictoryRewards({
  winner:'enemy',mode:'campaign',sectorNumber:20},store);
 assert.equal(defeat.eligible,false);
 assert.equal(readSupportCollection(store).unlockedSlots,0);
 const first=await claimOfficialLiveVictoryRewards({
  winner:'player',mode:'campaign',sectorNumber:20},store);
 assert.equal(first.eligible,true);
 assert.equal(first.support.granted,true);
 assert.equal(first.ship.granted,true);
 assert.equal(first.rarity.rarity,'Comune');
 const snapshot=store.snapshot();
 const repeat=await claimOfficialLiveVictoryRewards({
  winner:'player',mode:'campaign',sectorNumber:20},store);
 assert.equal(repeat.support.granted,false);
 assert.equal(repeat.ship.granted,false);
 assert.deepEqual(store.snapshot(),snapshot,'la vittoria ripetuta non duplica i premi');
 const second=await claimOfficialLiveVictoryRewards({
  winner:'player',mode:'campaign',sectorNumber:60},store);
 assert.equal(second.support.granted,true);
 assert.equal(readSupportCollection(store).unlockedSlots,2);
 const advanced=await claimOfficialLiveVictoryRewards({
  winner:'player',mode:'campaign',sectorNumber:85},store);
 assert.equal(advanced.rarity.rarity,'Leggendaria');
 assert.equal(readSupportCollection(store).owned.length,2);
 assert.equal(readSupportCollection(store).equipped.filter(Boolean).length,2);
});
