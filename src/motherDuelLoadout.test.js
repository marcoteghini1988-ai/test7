// Regolamento unico, senza eliminare collezioni create con la vecchia flotta.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,PHASE1_SHIPS,fleetCompatibility} from './mathDuelEngine.js';
import {prepareMotherDuelOptions,chooseCampaignMotherRival,chooseCampaignRivalCommander} from './motherDuelLoadout.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {collectionBattleOptions,readShipCollection,grantShipCard,equipShipCards} from './shipCollection.js';

const rng=()=>.5;
const sources=()=>PHASE1_SHIPS.map(s=>s.id);
test('regolamento unico: 17 modelli × 5 livelli: sempre una madre, scudiere da livello',()=>{
 let examined=0;
 for(const id of sources())for(let level=1;level<=5;level++){
  const o=prepareMotherDuelOptions({fleetIds:[id],
   shipLevels:{[id]:level}},{
    mode:'adventure',globalSector:11,planetId:PHASE16A_CAMPAIGN_PLANETS[1].id,
    planetSector:1});
  assert.deepEqual(o.fleetIds,[id]);
  assert.deepEqual(o.shipLevels,{[id]:level});
  assert.equal(o.enemyFleetIds.length,1);
  assert.ok(fleetCompatibility([id],o.enemyFleetIds,1,o.shipLevels,o.enemyShipLevels).compatible);
  const g=initialBattle(11,o,rng,'adventure');
  assert.equal(g.vitalPrototype,true,id+' L'+level);
  assert.equal(g.player.fleet.length,1);
  assert.equal(g.enemy.fleet.length,1);
  assert.equal(g.player.fleet[0].id,id);
  assert.equal(g.enemy.fleet[0].id,o.enemyFleetIds[0]);
  assert.equal(g.player.escorts.length,level>=5?2:level>=3?1:0);
  assert.equal(g.enemy.escorts.length,level>=5?2:level>=3?1:0);
  assert.ok(g.player.fleet[0].defense.parts.command);
  assert.equal(g.player.hand.length,7);
  assert.equal(g.player.specialHand.length,5);
  examined++;
 }
 assert.equal(examined,17*5);
});

test('120 settori: il rivale varia usando soltanto modelli reali e operatori compatibili',()=>{
 const seen=new Set();
 for(const planet of PHASE16A_CAMPAIGN_PLANETS){
  for(let local=1;local<=10;local++){
   const options=prepareMotherDuelOptions({fleetIds:['N00'],shipLevel:5},{
    mode:'adventure',globalSector:1,planetId:planet.id,planetSector:local});
   const enemy=options.enemyFleetIds[0];
   seen.add(enemy);
   assert.ok(sources().includes(enemy));
   assert.equal(options.enemyShipLevels[enemy],5);
   assert.ok(fleetCompatibility(['N00'],[enemy],1,options.shipLevels,options.enemyShipLevels).compatible);
   const g=initialBattle(1,options,rng,'adventure');
   assert.equal(g.vitalPrototype,true);
  }
 }
 assert.ok(seen.size>=2,'La campagna non deve sempre copiare la madre del giocatore');
});

test('flotte salvate con 2/3 carte: la partita usa SOLO la prima madre senza cancellare le altre',()=>{
 const saved=readShipCollection({getItem:()=>null});
 const owned=grantShipCard(grantShipCard(saved,'C01'),'C02');
 const historical=equipShipCards(owned,['ship:C02','ship:C01','ship:N00']);
 const snapshot=structuredClone(historical);
 const options=prepareMotherDuelOptions(collectionBattleOptions(historical),{
  mode:'adventure',globalSector:3,planetId:PHASE16A_CAMPAIGN_PLANETS[0].id});
 assert.deepEqual(options.fleetIds,['C02']);
 assert.deepEqual(historical,snapshot);
 assert.equal(historical.cards.length,3);
 assert.equal(historical.loadout.length,3);
 const g=initialBattle(3,options,rng,'adventure');
 assert.equal(g.vitalPrototype,true);
 assert.equal(g.player.fleet[0].id,'C02');
 assert.equal(g.player.fleet.length,1);
 assert.equal(g.player.specialHand.length,5);
});

test('prova flotta: rispetta la scelta dell’avversaria quando compatibile',()=>{
 const o=prepareMotherDuelOptions({fleetIds:['N00','C01'],
  enemyFleetIds:['C02','C01'],shipLevel:2},{
  mode:'adventure',globalSector:20,practice:true});
 assert.deepEqual(o.fleetIds,['N00']);
 assert.deepEqual(o.enemyFleetIds,['C02']);
 assert.equal(o.vitalPrototype,true);
 const g=initialBattle(20,o,rng,'adventure');
 assert.equal(g.enemy.fleet[0].id,'C02');
 assert.equal(g.enemy.bossNumericDeck?.id??null,null);
});

test('prova flotta: modello incompatibile non sostituisce il motore avversario per errore',()=>{
 const o=prepareMotherDuelOptions({fleetIds:['N00'],enemyFleetIds:['L01'],shipLevel:1},{
  mode:'pvp',globalSector:5,practice:true});
 assert.deepEqual(o.fleetIds,['N00']);
 assert.deepEqual(o.enemyFleetIds,['N00']);
 assert.equal(o.vitalPrototype,true);
});


test('12 boss: ogni pianeta ha un comandante IA reale e differente',()=>{
 const names=new Set();
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const global=index*10+10;
  const options=prepareMotherDuelOptions({fleetIds:['N00'],shipLevel:5},{
   mode:'adventure',globalSector:global,planetId:planet.id,planetSector:10});
  const rival=chooseCampaignRivalCommander({
   mode:'adventure',globalSector:global,planetId:planet.id,
   planetSector:10,shipId:options.enemyFleetIds[0],
   shipLevel:options.enemyShipLevels[options.enemyFleetIds[0]]
  });
  assert.equal(rival.isBoss,true);
  assert.ok(!names.has(rival.id),'Ogni boss ha una propria identità comandante');
  names.add(rival.id);
  const encounter=initialBattle(global,{
   ...options,enemyBossDeckId:planet.deck,enemyBossDeckLevel:1,
   enemyCommanderId:rival.id,enemyCommanderLevel:rival.level
  },rng,'adventure');
  assert.equal(encounter.enemy.commander.id,rival.id);
  assert.equal(encounter.enemy.bossNumericDeck.id,planet.deck);
  assert.equal(encounter.vitalPrototype,true);
 }
 assert.equal(names.size,12);
});

test('120 settori: i comandanti IA rimangono del catalogo e la prova è neutra',()=>{
 const seen=new Set();
 for(const planet of PHASE16A_CAMPAIGN_PLANETS)
  for(let local=1;local<=10;local++){
   const global=(planet.order-1)*10+local;
   const rival=chooseCampaignRivalCommander({
    mode:'adventure',globalSector:global,planetId:planet.id,
    planetSector:local,shipId:'N00',shipLevel:1
   });
   assert.ok(rival.id.startsWith('pilot_'));
   assert.equal(rival.isBoss,local===10);
   assert.ok(rival.level>=1&&rival.level<=5);
   seen.add(rival.id);
  }
 assert.ok(seen.size>=12);
 const practice=chooseCampaignRivalCommander({
  mode:'adventure',globalSector:120,planetId:20,
  planetSector:10,practice:true,shipId:'N00'});
 assert.equal(practice.id,'pilot_com_1');
 assert.equal(practice.isBoss,false);
});
