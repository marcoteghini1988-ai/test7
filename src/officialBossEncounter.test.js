import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {verifiedBossRelicReward} from './campaignBossRelics.js';
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

test('Percorso completo: tutti i 12 boss arrivano a un esito entro 20 cicli, senza carte inventate',()=>{
 const balanceObservations=[];
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  let battle=setup(i).battle;
  let resolutions=0;
  while(battle.phase!=='finished'&&resolutions<TACTICAL_TIMING.maxRounds){
   const context=planet.name+' ciclo '+battle.round;
   assert.equal(battle.phase,'planning',context+' preparazione');
   assert.equal(battle.arenaId,'boss_'+planet.id,context+' arena fissa');
   assert.equal(battle.sides.B.bossExclusive.id,planet.id,context+' esclusivo');
   assert.equal(battle.sides.B.bossNumericDeck.id,planet.deck,context+' mazzo boss');
   for(const side of Object.values(battle.sides)){
    const nums=[...side.numeric.hand,...side.numeric.deck,...side.numeric.discard];
    const specials=[...side.special.hand,...side.special.deck,...side.special.discard];
    assert.equal(nums.length,52,context+' numeriche reali');
    assert.equal(new Set(nums.map(c=>c.id)).size,52,context+' numeriche distinte');
    assert.equal(specials.length,24,context+' speciali reali');
    assert.equal(new Set(specials.map(c=>c.id)).size,24,context+' speciali distinte');
    assert.equal(side.numeric.hand.length,7,context+' mano numerica');
    assert.equal(side.special.hand.length,5,context+' mano speciale');
   }
   const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
   const firstPlan=planTacticalAi(battle,'A');
   const secondPlan=planTacticalAi(battle,'B');
   const first=sealTacticalOrder(battle,'A',firstPlan,at);
   assert.equal(first.ok,true,context+' piano A: '+first.reason);
   const second=sealTacticalOrder(first.battle,'B',secondPlan,at+1);
   assert.equal(second.ok,true,context+' piano B: '+second.reason);
   const resolving=advanceTacticalDuel(second.battle,at+1);
   assert.equal(resolving.phase,'resolving',context+' risoluzione');
   battle=advanceTacticalDuel(resolving,resolving.resolveUntilMs);
   resolutions++;
  }
  assert.equal(battle.phase,'finished',planet.name+' deve terminare entro 20 cicli');
  assert.ok(['A','B','draw'].includes(battle.winner),planet.name+' esito');
  assert.ok(resolutions<=TACTICAL_TIMING.maxRounds,planet.name+' limite');
  const result=officialBattleResult(battle,'campaign',i*10+10);
  assert.equal(result.eligibleForRewards,battle.winner==='A',planet.name+' premi solo per vittoria');
  assert.equal(battle.arenaId,'boss_'+planet.id,planet.name+' arena finale');
  balanceObservations.push({
   planet:planet.name,rounds:resolutions,winner:battle.winner,
   hitsA:battle.history.reduce((sum,round)=>sum+(round.hitsA||0),0),
   hitsB:battle.history.reduce((sum,round)=>sum+(round.hitsB||0),0),
   damagedA:Object.values(battle.sides.A.defense.parts).filter(p=>p.hp>0&&p.hp<=p.max/2).length,
   damagedB:Object.values(battle.sides.B.defense.parts).filter(p=>p.hp>0&&p.hp<=p.max/2).length,
   destroyedA:Object.values(battle.sides.A.defense.parts).filter(p=>p.hp===0).length,
   destroyedB:Object.values(battle.sides.B.defense.parts).filter(p=>p.hp===0).length
  });
 }
 // Osservatorio deterministico, non e' un playtest umano o prova di equilibrio PvP.
 console.log('ECLISSI_BOSS_AI_20_ROUNDS '+JSON.stringify(balanceObservations));
});

test('Benchmark comparativo: navicella leggendaria L5 con starter contro 12 boss reali',()=>{
 const ownedLegendary={cards:[{instanceId:'owned:L04',shipId:'L04',level:5}],
  loadout:['owned:L04']};
 const observed=[];
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  let battle=officialBattleSetup({mode:'campaign',sectorNumber:i*10+10,bossPlanetId:planet.id,
   bossSectorLevel:10,shipCollection:ownedLegendary,specialCollection:ownedSpecials,
   nowMs:100,seed:171}).battle;
  while(battle.phase!=='finished'){
   const now=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
   const a=sealTacticalOrder(battle,'A',planTacticalAi(battle,'A'),now);
   assert.equal(a.ok,true,planet.name+' A: '+a.reason);
   const b=sealTacticalOrder(a.battle,'B',planTacticalAi(battle,'B'),now+1);
   assert.equal(b.ok,true,planet.name+' B: '+b.reason);
   const resolved=advanceTacticalDuel(b.battle,now+1);
   battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
   assert.ok(battle.round<=TACTICAL_TIMING.maxRounds);
  }
  observed.push({planet:planet.name,rounds:battle.round,winner:battle.winner,
   hitsA:battle.history.reduce((sum,x)=>sum+(x.hitsA||0),0),
   hitsB:battle.history.reduce((sum,x)=>sum+(x.hitsB||0),0),
   destroyedB:Object.values(battle.sides.B.defense.parts).filter(p=>p.hp===0).length});
 }
 // IA locale contro IA locale con mazzo iniziale; non misura una strategia umana.
 console.log('ECLISSI_LEGENDARY_AI_20_ROUNDS '+JSON.stringify(observed));
});

test('Matrice multi-seed dei 12 boss: C01/R04/L04 a livelli realistici, nessun premio fittizio',()=>{
 const seeds=[17,171,2026];
 const fleets=[{shipId:'C01',level:1},{shipId:'R04',level:3},{shipId:'L04',level:5}];
 const stats=[];
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  for(const {shipId,level} of fleets){
   let wins=0,losses=0,draws=0,cycles=0,precisionA=0,precisionB=0,validFormulaA=0;
   for(const seed of seeds){
    const owned={cards:[{instanceId:'owned:'+shipId,shipId,level}],loadout:['owned:'+shipId]};
    let battle=officialBattleSetup({mode:'campaign',sectorNumber:i*10+10,
     bossPlanetId:planet.id,bossSectorLevel:10,shipCollection:owned,
     specialCollection:ownedSpecials,nowMs:100,seed}).battle;
    let rounds=0;
    while(battle.phase!=='finished'&&rounds<TACTICAL_TIMING.maxRounds){
     const at=battle.deadlineMs-TACTICAL_TIMING.prepareMs+1;
     const planA=planTacticalAi(battle,'A'),planB=planTacticalAi(battle,'B');
     const a=sealTacticalOrder(battle,'A',planA,at);
     assert.equal(a.ok,true,planet.name+' '+shipId+' A '+a.reason);
     const b=sealTacticalOrder(a.battle,'B',planB,at+1);
     assert.equal(b.ok,true,planet.name+' '+shipId+' B '+b.reason);
     const resolved=advanceTacticalDuel(b.battle,at+1);
     assert.equal(resolved.phase,'resolving');
     const record=resolved.history.at(-1);
     validFormulaA+=record?.impacts?.filter(x=>x.kind==='precision'&&x.by==='A').length||0;
     precisionA+=record?.hitsA||0;
     precisionB+=record?.hitsB||0;
     battle=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
     rounds++;
    }
    assert.equal(battle.phase,'finished');
    assert.ok(rounds<=20);
    cycles+=rounds;
    if(battle.winner==='A')wins++;
    else if(battle.winner==='B')losses++;
    else draws++;
    const outcome=officialBattleResult(battle,'campaign',i*10+10);
    assert.equal(outcome.eligibleForRewards,battle.winner==='A');
    assert.equal(battle.sides.B.bossNumericDeck.id,planet.deck);
    assert.equal(battle.arenaId,'boss_'+planet.id);
   }
   assert.equal(wins+losses+draws,seeds.length);
   stats.push({planet:planet.name,shipId,level,wins,losses,draws,
    meanCycles:Number((cycles/seeds.length).toFixed(1)),
    precisionA,precisionB,validFormulaA});
  }
 }
 console.log('ECLISSI_BOSS_MATRIX '+JSON.stringify(stats));
});

test('Telemetria della vittoria conserva il vero boss e sblocca la sua reliquia, non quelle degli altri',()=>{
 for(const [i,planet] of PHASE16A_CAMPAIGN_PLANETS.entries()){
  const b=setup(i).battle;
  const finished={...b,phase:'finished',winner:'A'};
  const result=officialBattleResult(finished,'adventure',(i+1)*10);
  const data={winner:result.winner,mode:'adventure',...result.meta.matchStats};
  assert.equal(data.sectorNumber,(i+1)*10);
  assert.equal(data.bossPlanetId,planet.id);
  assert.equal(data.bossSectorLevel,10);
  assert.equal(verifiedBossRelicReward(data),planet.relic);
  const lost=officialBattleResult({...finished,winner:'B'},'adventure',(i+1)*10);
  assert.equal(verifiedBossRelicReward({winner:lost.winner,mode:'adventure',
   ...lost.meta.matchStats}),null,'Sconfitta non assegna reliquie');
  assert.equal(verifiedBossRelicReward({...data,mode:'pvp'}),null,'PvP non assegna reliquie');
 }
 const normal=officialBattleSetup({mode:'adventure',sectorNumber:9,
  bossPlanetId:1,bossSectorLevel:9,shipCollection:ownedShip,
  specialCollection:ownedSpecials,nowMs:100,seed:171});
 const result=officialBattleResult({...normal.battle,phase:'finished',winner:'A'},'adventure',9);
 assert.equal(result.meta.matchStats.bossPlanetId,null);
 assert.equal(verifiedBossRelicReward({winner:result.winner,mode:'adventure',
  ...result.meta.matchStats}),null,'Nessuna reliquia sul settore normale');
});
