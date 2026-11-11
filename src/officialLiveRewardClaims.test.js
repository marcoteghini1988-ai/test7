import test from 'node:test';
import assert from 'node:assert/strict';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {SHIP_COLLECTION_KEY,readShipCollection,updateShipCollection,
 equipShipCards} from './shipCollection.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {bossCharacterTypeForPlanet,BOSS_CHARACTER_TYPES} from './bossCharacterCards.js';
import {readSpecialCollection,updateSpecialCollection,openSpecialPack,
 validateSpecialDeck,equipSpecialDeck,SPECIAL_PACK_TYPES} from './specialDeckBuilder.js';
import {VULNERABILITY_RIFT_CARD_ID} from './tacticalVulnerabilityRift.js';
import {isModuleCard} from './tacticalEquipmentCards.js';
import {isTacticalEpic} from './tacticalEpicCards.js';
import {officialBattleSetup} from './officialBattleSetup.js';

function storage(){
 const values=new Map();
 return {getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,v),values};
}
function random(seed){
 let x=seed>>>0||1;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
function input(sector,mode='adventure'){
 const boss=sector%10===0?PHASE16A_CAMPAIGN_PLANETS[sector/10-1]:null;
 return {winner:'player',mode,sectorNumber:sector,
  bossPlanetId:boss?.id??null,bossSectorLevel:boss?10:sector%10};
}

test('Campagna 1..120: premi REALI idempotenti, 16 navi, 12 trofei e 120 pacchetti',async()=>{
 const store=storage(),rng=random(20261111),riftIndex=SPECIAL_PACK_TYPES.indexOf(VULNERABILITY_RIFT_CARD_ID);
 assert.ok(riftIndex>=0,'Faglia ottenibile dai veri pacchetti');
 const unlocked=[];
 for(let sector=1;sector<=120;sector++){
  if(sector===70){
   const ships=readShipCollection(store);
   assert.ok(ships.cards.some(card=>card.shipId==='E03'),
    'la Fenice si ottiene dopo il settore 60 e prima di Ombre');
   assert.equal(ships.cards.some(card=>card.shipId==='E04'),false,
    'Orizzonte non è gratuita prima della vittoria contro Ombre');
   const owned=readSpecialCollection(store);
   assert.ok(owned.owned[VULNERABILITY_RIFT_CARD_ID]>=1,
    'nell estrazione simulata la Faglia deve essere davvero uscita');
   const loadout=equipSpecialDeck(owned,
    [VULNERABILITY_RIFT_CARD_ID,...owned.loadout.slice(1)]);
   assert.equal(validateSpecialDeck(loadout,loadout.loadout).valid,true);
   const chosen=ships.cards.find(card=>card.shipId==='E03');
   const selected=await updateShipCollection(c=>equipShipCards(c,[chosen.instanceId]),store);
   const setup=officialBattleSetup({mode:'adventure',sectorNumber:70,
    bossPlanetId:PHASE16A_CAMPAIGN_PLANETS[6].id,bossSectorLevel:10,
    shipCollection:selected,specialCollection:loadout,
    nowMs:100,seed:70});
   const all=[...setup.battle.sides.A.special.hand,...setup.battle.sides.A.special.deck,
    ...setup.battle.sides.A.special.discard];
   assert.equal(all.length,24);
   assert.equal(all.filter(c=>c.type===VULNERABILITY_RIFT_CARD_ID).length,1);
   assert.equal(setup.battle.sides.A.numeric.hand.length,7);
   assert.equal(setup.battle.sides.A.special.hand.length,5);
  }
  const award=input(sector);
  const first=await claimOfficialLiveVictoryRewards(award,store);
  assert.equal(first.eligible,true);
  assert.equal(first.pack.granted,true,'credito premio al settore '+sector);
  const ship=SHIP_CAMPAIGN_UNLOCKS.find(x=>x.sector===sector);
  assert.equal(first.ship.granted,!!ship,'sblocco nave al settore '+sector);
  if(ship){assert.equal(first.ship.shipId,ship.shipId);unlocked.push(ship.shipId);}
  assert.equal(first.character.granted,sector%10===0,'trofeo al settore '+sector);
  const replay=await claimOfficialLiveVictoryRewards(input(sector,'campaign'),store);
  assert.equal(replay.pack.granted,false,'modalità alternate non duplicano crediti');
  assert.equal(replay.ship.granted,false,'modalità alternate non duplicano navi');
  assert.equal(replay.character.granted,false,'modalità alternate non duplicano trofei');
  // L'apertura di ogni pacchetto è una scelta distinta dalla vittoria.
  // Al settore 35 imponiamo una estrazione VALIDA ma favorevole alla Faglia:
  // il test dimostra che la carta proviene dai pack, non da un grant.
  let drawn;
  const roll=sector===35?()=> (riftIndex+.25)/SPECIAL_PACK_TYPES.length:rng;
  updateSpecialCollection(c=>{
   const opened=openSpecialPack(c,roll);
   assert.equal(opened.opened,true,'pacchetto ottenuto nel settore '+sector);
   drawn=opened.drawn;
   return opened.collection;
  },store);
  assert.equal(drawn.length,3);
  assert.ok(drawn.every(type=>SPECIAL_PACK_TYPES.includes(type)));
  assert.ok(drawn.every(type=>!isModuleCard(type)&&!isTacticalEpic(type)&&
   !BOSS_CHARACTER_TYPES.includes(type)),'nessun Modulo/Epico/Trofeo gratuito');
 }
 const ships=readShipCollection(store),specials=readSpecialCollection(store);
 assert.equal(ships.cards.length,17);
 assert.equal(new Set(ships.cards.map(x=>x.shipId)).size,17);
 assert.equal(unlocked.length,16);
 assert.equal(specials.openedPacks,120);
 assert.equal(specials.packCredits,0);
 assert.equal(specials.claimedRewards.filter(x=>x.startsWith('adventure:sector:')).length,120);
 assert.equal(specials.claimedRewards.filter(x=>x.startsWith('boss:character:')).length,12);
 assert.equal(new Set(specials.claimedRewards).size,132);
 assert.ok(PHASE16A_CAMPAIGN_PLANETS.every(p=>specials.owned[bossCharacterTypeForPlanet(p.id)]===1));
 assert.equal(validateSpecialDeck(specials,specials.loadout).valid,true);
 console.log('LIVE_CAMPAIGN_120_REWARDS '+JSON.stringify({
  sectors:120,ships:ships.cards.length,bossCharacters:12,
  packsOpened:specials.openedPacks,cardsDrawn:specials.openedPacks*3,
  riftOwned:specials.owned[VULNERABILITY_RIFT_CARD_ID],
  autoEquippedBossCharacters:specials.loadout.filter(x=>BOSS_CHARACTER_TYPES.includes(x)).length
 }));
});

test('Se fallisce il secondo salvataggio, il retry recupera senza duplicare premi',async()=>{
 const s=storage(),realSet=s.setItem.bind(s);
 let failShipOnce=true;
 s.setItem=(key,value)=>{
  if(key===SHIP_COLLECTION_KEY&&failShipOnce){
   failShipOnce=false;throw new Error('quota di salvataggio temporaneamente esaurita');
  }
  realSet(key,value);
 };
 const award=input(70);
 await assert.rejects(()=>claimOfficialLiveVictoryRewards(award,s),
  /temporaneamente esaurita/);
 let coll=readSpecialCollection(s);
 assert.equal(coll.packCredits,1,'credito già salvato deve sopravvivere');
 assert.equal(coll.owned[bossCharacterTypeForPlanet(award.bossPlanetId)],0,
  'il trofeo non è ancora assegnato dopo il fallimento');
 assert.equal(s.getItem(SHIP_COLLECTION_KEY),null,
  'la scrittura rifiutata non deve corrompere il salvataggio');
 const retry=await claimOfficialLiveVictoryRewards(award,s);
 assert.equal(retry.pack.granted,false,'il credito non raddoppia');
 assert.equal(retry.ship.granted,true,'la nave viene recuperata');
 assert.equal(retry.character.granted,true,'il trofeo viene recuperato');
 const next=await claimOfficialLiveVictoryRewards(input(70,'campaign'),s);
 assert.equal(next.pack.granted,false);
 assert.equal(next.ship.granted,false);
 assert.equal(next.character.granted,false);
 coll=readSpecialCollection(s);
 assert.equal(coll.packCredits,1);
 assert.equal(coll.owned[bossCharacterTypeForPlanet(award.bossPlanetId)],1);
 assert.equal(readShipCollection(s).cards.filter(c=>c.shipId==='E04').length,1);
 assert.equal(new Set(coll.claimedRewards).size,2);
});

test('Sconfitte, pareggi e PvP simulato non alterano mai i tre inventari',async()=>{
 const s=storage();
 const cases=[
  {...input(70),winner:'enemy'}, {...input(70),winner:'draw'},
  {...input(70),winner:null}, {...input(70),mode:'pvp'},
  {...input(70),mode:'practice'}
 ];
 for(const item of cases){
  const claim=await claimOfficialLiveVictoryRewards(item,s);
  assert.equal(claim.eligible,false);
 }
 assert.equal(s.values.size,0,'nessuna scrittura persistente senza vittoria campagna');
});
