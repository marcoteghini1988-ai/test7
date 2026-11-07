import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {chooseCampaignRivalCommander} from './motherDuelLoadout.js';
import {officialBattleSetup,officialBattleResult} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {sealTacticalOrder,advanceTacticalDuel,TACTICAL_TIMING}
 from './simultaneousDuelEngine.js';

const ownedShip={cards:[{instanceId:'owned:C01',shipId:'C01',level:5}],loadout:['owned:C01']};
const ownedSpecials=createSpecialCollection();
const setup=(index,mode='campaign')=>{
 const planet=PHASE16A_CAMPAIGN_PLANETS[index];
 return officialBattleSetup({mode,sectorNumber:index*10+10,bossPlanetId:planet.id,
  bossSectorLevel:10,shipCollection:ownedShip,specialCollection:ownedSpecials,
  nowMs:100,seed:171});
};
test('12/12 boss: stessa identità storica, stesso mazzo numerico, grado evolutivo e arena esclusiva',()=>{
 assert.equal(PHASE16A_CAMPAIGN_PLANETS.length,12);
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const global=i*10+10;
  for(const mode of ['campaign','adventure']){
   const encounter=officialBossEncounter({mode,sectorNumber:global,
    planetId:planet.id,sectorLevel:10});
   assert.ok(encounter,mode+' '+planet.name);
   assert.equal(encounter.planetId,planet.id);
   assert.equal(encounter.numericDeckId,planet.deck);
   assert.equal(encounter.numericDeckLevel,1+Math.floor((global-1)/20));
   assert.equal(encounter.arenaId,'boss_'+planet.id);
   const created=setup(i,mode);
   const b=created.battle;
   assert.equal(created.bossId,planet.id);
   assert.equal(b.arenaId,'boss_'+planet.id);
   assert.equal(b.sides.B.bossPlanetId,planet.id);
   assert.equal(b.sides.B.bossExclusive.id,planet.id);
   assert.equal(b.sides.B.bossNumericDeck.id,planet.deck);
   assert.equal(b.sides.B.bossNumericDeck.level,encounter.numericDeckLevel);
   const rivalPilot=chooseCampaignRivalCommander({mode,globalSector:global,
    planetId:planet.id,planetSector:10,shipId:created.shipB,shipLevel:b.sides.B.level});
   assert.equal(b.sides.B.commander?.id,rivalPilot.id,
    planet.name+' conserva il proprio pilota storico');
   assert.equal(b.sides.B.commander?.level,rivalPilot.level);
   assert.equal(b.sides.A.bossExclusive??null,null);
   assert.equal(b.sides.A.bossNumericDeck??null,null);
   assert.equal(b.sides.A.special.hand.length,5);
   assert.equal(b.sides.B.special.hand.length,5);
   assert.deepEqual([...b.sides.A.special.hand,...b.sides.A.special.deck]
    .map(c=>c.type).sort(),[...ownedSpecials.loadout].sort());
  }
 }
});
test('Esclusivo boss non compare in settori ordinari, Arena Titanio e PvP',()=>{
 for(const mode of ['campaign','adventure','pvp']){
  const encounter=officialBossEncounter({mode,sectorNumber:11,planetId:2,sectorLevel:1});
  assert.equal(encounter,null);
 }
 assert.equal(officialBossEncounter({mode:'pvp',sectorNumber:10,planetId:1,sectorLevel:10}),null);
 assert.equal(officialBossEncounter({mode:'campaign',sectorNumber:9,planetId:1}),null);
 assert.equal(officialBossEncounter({mode:'campaign',sectorNumber:0,planetId:1,sectorLevel:10}),null);
 const regular=officialBattleSetup({mode:'campaign',sectorNumber:9,bossPlanetId:1,
  bossSectorLevel:9,shipCollection:ownedShip,specialCollection:ownedSpecials});
 assert.equal(regular.battle.sides.B.bossExclusive??null,null);
 assert.equal(regular.battle.sides.B.bossNumericDeck??null,null);
});
test('12 boss conservano IA, due mazzi veri, livelli e HP attraverso risoluzioni simultanee',()=>{
 for(const [i,planet]of PHASE16A_CAMPAIGN_PLANETS.entries()){
  let b=setup(i).battle;
  for(let round=0;round<3;round++){
   for(const side of Object.values(b.sides)){
    const num=[...side.numeric.hand,...side.numeric.deck,...side.numeric.discard];
    const special=[...side.special.hand,...side.special.deck,...side.special.discard];
    assert.equal(num.length,52,planet.name+' numeriche');
    assert.equal(new Set(num.map(c=>c.id)).size,52,planet.name+' duplicati numerici');
    assert.equal(special.length,24,planet.name+' speciali');
    assert.equal(new Set(special.map(c=>c.id)).size,24,planet.name+' duplicati speciali');
    assert.ok(side.defense.shield.hp>=0&&side.defense.shield.hp<=side.defense.shield.max);
    assert.ok(side.sync>=0&&side.sync<=100);
   }
   if(b.phase==='finished')break;
   const at=b.deadlineMs-TACTICAL_TIMING.prepareMs+1;
   const planA=planTacticalAi(b,'A'),planB=planTacticalAi(b,'B');
   const a=sealTacticalOrder(b,'A',planA,at);
   assert.equal(a.ok,true,planet.name+' A '+a.reason);
   const c=sealTacticalOrder(a.battle,'B',planB,at+1);
   assert.equal(c.ok,true,planet.name+' B '+c.reason);
   const d=advanceTacticalDuel(c.battle,at+1);
   assert.equal(d.phase,'resolving',planet.name);
   assert.equal(d.sides.B.bossNumericDeck.id,planet.deck);
   assert.equal(d.sides.B.bossExclusive.id,planet.id);
   b=advanceTacticalDuel(d,d.resolveUntilMs);
  }
 }
});
test('Premi di campagna e avventura: mai doppio premio, niente premi per PvP, perdita o pareggio',()=>{
 const b=setup(0).battle;
 const won={...b,phase:'finished',winner:'A',round:5};
 const lost={...won,winner:'B'};
 const draw={...won,winner:'draw'};
 for(const mode of ['campaign','adventure']){
  const out=officialBattleResult(won,mode,10);
  assert.equal(out.eligibleForRewards,true);
  assert.equal(out.winner,'player');
  assert.deepEqual(out.meta.starsEarned[0],true);
  assert.equal(officialBattleResult(lost,mode,10).eligibleForRewards,false);
  assert.equal(officialBattleResult(draw,mode,10).eligibleForRewards,false);
 }
 assert.equal(officialBattleResult(won,'pvp',10).eligibleForRewards,false);
 assert.equal(officialBattleResult(won,'classic',10).eligibleForRewards,false);
});
