import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {officialCampaignSectorNumber,officialCampaignBattleProps} from './officialCampaignRouting.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {claimFirstWinSpecialPack,readSpecialCollection} from './specialDeckBuilder.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {bossCharacterTypeForPlanet} from './bossCharacterCards.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {readShipCollection} from './shipCollection.js';

function storage(){
 const values=new Map(),writes=[];
 return {getItem:key=>values.get(key)??null,
  setItem:(key,val)=>{writes.push(key);values.set(key,val);},
  values,writes};
}
function route(planet,localLevel,mode='adventure'){
 return officialCampaignBattleProps({
  gameMode:mode,bossPlanetId:planet.id,bossSectorLevel:localLevel,
  sectorNumber:(planet.id-1)*10+localLevel
 });
}
test('Dodici pianeti storici occupano esattamente 120 settori, senza spostare le identita',()=>{
 assert.equal(PHASE16A_CAMPAIGN_PLANETS.length,12);
 const sectors=new Set();
 for(const [index,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  for(let local=1;local<=10;local++){
   const props=route(planet,local);
   const expected=index*10+local;
   assert.equal(props.sectorNumber,expected,planet.name+' / '+local);
   assert.equal(props.bossPlanetId,planet.id);
   assert.equal(props.bossSectorLevel,local);
   assert.equal(officialCampaignSectorNumber({...props,sectorNumber:999}),expected);
   sectors.add(expected);
  }
  const boss=route(planet,10);
  for(const mode of ['adventure','campaign']){
   const encounter=officialBossEncounter({mode,sectorNumber:boss.sectorNumber,
    planetId:planet.id,sectorLevel:10});
   assert.ok(encounter,mode+' '+planet.name);
   assert.equal(encounter.planetId,planet.id);
   assert.equal(encounter.globalSector,(index+1)*10);
   assert.equal(officialSimultaneousEligibility({
    gameMode:mode,sectorNumber:boss.sectorNumber,bossPlanetId:planet.id,
    bossSectorLevel:10
   }).enabled,true);
  }
 }
 assert.equal(sectors.size,120);
 assert.deepEqual([...sectors].sort((a,b)=>a-b),
  Array.from({length:120},(_,i)=>i+1));
 assert.equal(route(PHASE16A_CAMPAIGN_PLANETS[3],10).sectorNumber,40,
  'Saturno ID 6 NON e settore 60');
 assert.equal(route(PHASE16A_CAMPAIGN_PLANETS[11],10).sectorNumber,120,
  'Encelado ID 20 e settore 120, non 200');
});
test('Modalita estranee, pianeti non catalogati e livelli invalidi rimangono immutati',()=>{
 const values=[
  {gameMode:'pvp',sectorNumber:77,bossPlanetId:6,bossSectorLevel:10},
  {gameMode:'adventure',sectorNumber:77,bossPlanetId:5,bossSectorLevel:10},
  {gameMode:'adventure',sectorNumber:77,bossPlanetId:6,bossSectorLevel:11},
  {gameMode:'adventure',sectorNumber:77,bossPlanetId:6,bossSectorLevel:null},
  {gameMode:'campaign',sectorNumber:77,bossPlanetId:null,bossSectorLevel:10}
 ];
 for(const x of values){
  assert.equal(officialCampaignSectorNumber(x),x.sectorNumber);
  assert.equal(officialCampaignBattleProps(x),x,'nessuna modifica ai dati storici');
 }
 const fixed={gameMode:'adventure',sectorNumber:60,bossPlanetId:6,bossSectorLevel:10};
 assert.equal(officialCampaignBattleProps(fixed).sectorNumber,40);
 assert.equal(fixed.sectorNumber,60,'input originale immutato');
});
test('Tutti i boss: vincita, premio prima volta, Carta Personaggio e ricompensa nave restano dopo riapertura',async()=>{
 const s=storage();
 const collected=[];
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const props=route(planet,10);
  const sector=props.sectorNumber;
  const award={winner:'player',mode:'adventure',sectorNumber:sector,
   bossPlanetId:planet.id,bossSectorLevel:10};
  assert.equal(claimFirstWinSpecialPack('adventure',sector,s).granted,true,planet.name);
  const trophy=claimBossCharacterFromVictory(award,s);
  assert.equal(trophy.granted,true,planet.name);
  assert.equal(trophy.type,bossCharacterTypeForPlanet(planet.id));
  const ship=await claimCampaignShipUnlock('adventure',sector,s);
  collected.push({sector,ship:ship.granted?ship.shipId:null});
  const afterReload=readSpecialCollection(s);
  assert.equal(afterReload.owned[trophy.type],1,planet.name);
  assert.equal(afterReload.loadout.includes(trophy.type),false,
   'Il personaggio non deve equipaggiarsi senza scelta');
  assert.equal(claimFirstWinSpecialPack('adventure',sector,s).granted,false,
   'Nessun altro pacchetto sul replay');
  assert.equal(claimBossCharacterFromVictory(award,s).granted,false,
   'Nessuna seconda Carta Personaggio');
  assert.equal((await claimCampaignShipUnlock('adventure',sector,s)).granted,false,
   'Nessuna seconda navicella');
 }
 const next=readSpecialCollection(s),ships=readShipCollection(s);
 assert.equal(next.packCredits,12,'Un credito per ogni boss distinto');
 assert.equal(next.claimedRewards.filter(x=>x.startsWith('adventure:sector:')).length,12);
 assert.equal(next.claimedRewards.filter(x=>x.startsWith('boss:character:')).length,12);
 assert.equal(PHASE16A_CAMPAIGN_PLANETS.filter(p=>
  next.owned[bossCharacterTypeForPlanet(p.id)]===1).length,12);
 assert.equal(new Set(ships.cards.map(x=>x.shipId)).size,ships.cards.length);
 assert.equal(ships.loadout.length,1,'Non cambia la nave equipaggiata');
 assert.ok(collected.some(x=>x.sector===40&&x.ship),
  'La ricompensa del settore 40 va al quarto boss, Saturno');
 assert.equal(s.getItem('eclissi_unlocked_relics'),null,
  'Le reliquie restano un premio distinto, gestito da App e non concesso dal routing');
});
