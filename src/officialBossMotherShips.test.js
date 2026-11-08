// Convalida la nuova identita delle dodici madri boss soltanto nella plancia
// simultanea ufficiale: nessuna modifica al legacy, inventario o layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {shipsUnlockableBeforeSector} from './officialBossProgressionAudit.js';
import {OFFICIAL_BOSS_MOTHER_SHIPS,officialBossMotherShip} from './officialBossMotherShips.js';
import {FIRST_PLANET_RIVAL_SHIPS,officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {chooseCampaignMotherRival,prepareMotherDuelOptions} from './motherDuelLoadout.js';
import {fleetCompatibility} from './mathDuelEngine.js';
const specials=createSpecialCollection();
function ownedShip(shipId,level){
 return {cards:[{instanceId:'owned:'+shipId,shipId,level}],loadout:['owned:'+shipId]};
}

test('Dodici boss: una madre autentica diversa per pianeta e mai la nave in premio sullo stesso boss',()=>{
 assert.equal(PHASE16A_CAMPAIGN_PLANETS.length,12);
 assert.equal(Object.keys(OFFICIAL_BOSS_MOTHER_SHIPS).length,12);
 const distinct=new Set();
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const sector=(index+1)*10;
  const target=officialBossMotherShip(planet.id);
  const encounter=officialBossEncounter({mode:'adventure',sectorNumber:sector,
   planetId:planet.id,sectorLevel:10});
  assert.equal(encounter.motherShipId,target,'identita dell\'incontro deve dichiarare la nave');
  const available=shipsUnlockableBeforeSector(sector);
  assert.equal(target,available.at(-1),planet.name+' utilizza un modello progressivo');
  assert.ok(PHASE1_CATALOG.ships.some(ship=>ship.id===target),planet.name);
  assert.ok(!distinct.has(target),'ogni boss mantiene una nave diversa');
  distinct.add(target);
  const sameSector=SHIP_CAMPAIGN_UNLOCKS.find(item=>item.sector===sector);
  assert.notEqual(target,sameSector?.shipId,'la ricompensa non precede il KO boss');
 }
 assert.equal(distinct.size,12);
 for(const bad of [null,0,5,21,1000,'nonna',undefined])
  assert.equal(officialBossMotherShip(bad),null);
});
test('Modello boss, firme e armi indipendenti da scelta della madre, livello e seed giocatore',()=>{
 const owned=PHASE1_CATALOG.ships.map(ship=>ship.id);
 let setups=0;
 for(const [index,planet]of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const sector=(index+1)*10;
  const fixed=officialBossMotherShip(planet.id);
  let reference=null;
  for(const shipId of owned){
   for(const level of [1,5]){
    const created=officialBattleSetup({mode:'adventure',sectorNumber:sector,
     bossPlanetId:planet.id,bossSectorLevel:10,
     shipCollection:ownedShip(shipId,level),specialCollection:specials,
     nowMs:100,seed:171});
    const side=created.battle.sides.B;
    assert.equal(side.shipId,fixed,planet.name+' '+shipId+' L'+level);
    assert.equal(created.shipB,fixed);
    assert.equal(created.battle.arenaId,'boss_'+planet.id);
    assert.equal(side.bossPlanetId,planet.id);
    assert.equal(side.bossNumericDeck.id,planet.deck);
    const data={weapons:side.weapons.map(w=>w.id),signatures:Object.fromEntries(
     Object.entries(side.defense.parts).map(([id,part])=>[id,part.signature]))};
    if(reference===null)reference=data;
    else assert.deepEqual(data,reference,'identita tecnica del boss invariata');
    setups++;
   }
  }
 }
 assert.equal(setups,12*17*2);
});
test('La campagna Terra 1-9 non anticipa mai navi e usa copie starter NPC autentiche',()=>{
 assert.deepEqual(FIRST_PLANET_RIVAL_SHIPS,[
  'N00','N00','N00','C01','C01','C01','C02','C02','C02']);
 for(let sector=1;sector<=9;sector++){
  const expected=FIRST_PLANET_RIVAL_SHIPS[sector-1];
  assert.equal(officialEarlyCampaignRivalShip({mode:'adventure',sectorNumber:sector,planetId:1}),expected);
  const available=shipsUnlockableBeforeSector(sector);
  assert.ok(available.includes(expected));
  const setup=officialBattleSetup({mode:'adventure',sectorNumber:sector,
   bossPlanetId:1,bossSectorLevel:sector,shipCollection:ownedShip('N00',1),
   specialCollection:specials,nowMs:100,seed:171});
  assert.equal(setup.shipB,expected);
  assert.equal(setup.battle.sides.B.bossExclusive??null,null);
  const enemy=setup.battle.sides.B.special;
  assert.deepEqual([...enemy.hand,...enemy.deck].map(card=>card.type).sort(),
   [...specials.loadout].sort(),'il nemico non ha Scanner/contromisure gratis');
 }
 for(const args of [
  {mode:'pvp',sectorNumber:3,planetId:1},
  {mode:'adventure',sectorNumber:10,planetId:1},
  {mode:'adventure',sectorNumber:3,planetId:6},
  {mode:'adventure',sectorNumber:0,planetId:1},
  {mode:'adventure',sectorNumber:1.5,planetId:1}
 ])assert.equal(officialEarlyCampaignRivalShip(args),null);
});
test('La 3D legacy mantiene il proprio algoritmo di compatibilita e non riceve madri canoniche',()=>{
 const selected=chooseCampaignMotherRival('C03',1,10,1,10);
 const configured=prepareMotherDuelOptions({fleetIds:['C03'],shipLevel:1},{
  mode:'adventure',globalSector:10,planetId:1,planetSector:10});
 assert.equal(configured.enemyFleetIds[0],selected.shipId);
 assert.ok(fleetCompatibility(['C03'],configured.enemyFleetIds,1,
  configured.shipLevels,configured.enemyShipLevels).compatible);
 assert.notEqual(selected.shipId,officialBossMotherShip(1),
  'il legacy rimane compatibile, il nuovo boss ha una propria madre costante');
});
