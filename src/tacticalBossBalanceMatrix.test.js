// Benchmark riproducibile: NON e' un playtest umano e non regala carte nel gioco.
// I fixture possiedono esplicitamente nave, livello, speciali ottenute con
// pacchetti autentici e (ove indicato) il mazzo Gaia sbloccato dopo la Terra.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection,specialPackReward,openSpecialPack,equipSpecialDeck,
 SPECIAL_PACK_TYPES,validateSpecialDeck} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {TACTICAL_TIMING,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const seeds=[18,171,407];
const ship=(id,level)=>({
 schemaVersion:1,
 cards:[{instanceId:'owned:'+id,shipId:id,level}],
 loadout:['owned:'+id]
});
function postTerraCollection(){
 let collection=createSpecialCollection();
 const index=SPECIAL_PACK_TYPES.indexOf('tactic-scan');
 assert.ok(index>=0,'La Scansione appartiene ai pacchetti ottenibili');
 for(const sector of [1,2]){
  const reward=specialPackReward(collection,'campaign:sector:'+sector);
  assert.equal(reward.granted,true);
  const pack=openSpecialPack(reward.collection,()=>(index+.15)/SPECIAL_PACK_TYPES.length);
  assert.equal(pack.opened,true);
  assert.equal(pack.drawn.length,3);
  collection=pack.collection;
 }
 const loadout=collection.loadout.map(type=>type==='shot-ion'?'tactic-scan':type);
 const equipped=equipSpecialDeck(collection,loadout);
 assert.equal(validateSpecialDeck(equipped,equipped.loadout).valid,true);
 assert.equal(equipped.loadout.filter(t=>t==='tactic-scan').length,4);
 return equipped;
}
const starter=createSpecialCollection();
const upgraded=postTerraCollection();
const scenarios=[
 {name:'N00-L1-starter',ship:'N00',level:1,specials:starter},
 {name:'C01-L3-starter',ship:'C01',level:3,specials:starter},
 {name:'L04-L5-starter',ship:'L04',level:5,specials:starter},
 {name:'L04-L5-scan-Gaia-L1',ship:'L04',level:5,specials:upgraded,bossDeck:'planet_char_1',bossInventory:{planet_char_1:{unlocked:true,level:1}}}
];
function simulate(planet,index,config,seed){
 const setup=officialBattleSetup({
  mode:'campaign',sectorNumber:(index+1)*10,bossPlanetId:planet.id,
  bossSectorLevel:10,shipCollection:ship(config.ship,config.level),
  specialCollection:config.specials,
  selectedBossDeck:config.bossDeck??'neutral_starter',
  bossDeckInventory:config.bossInventory??{},
  seed,nowMs:100
 });
 let b=setup.battle;
 let scans=0,aims=0,valid=0;
 while(b.phase!=='finished'){
  assert.ok(b.round<=TACTICAL_TIMING.maxRounds,planet.name+' fuori limite');
  const t=b.deadlineMs-TACTICAL_TIMING.prepareMs+1;
  const aOrder=planTacticalAi(b,'A');
  const bOrder=planTacticalAi(b,'B');
  if(aOrder.exposureTarget)aims++;
  if(aOrder.specialIndices.some(i=>b.sides.A.special.hand[i].type==='tactic-scan'))scans++;
  if(aOrder.numericIndices.length>=2)valid++;
  const a=sealTacticalOrder(b,'A',aOrder,t);
  assert.equal(a.ok,true,'A '+planet.name+' '+a.reason);
  const c=sealTacticalOrder(a.battle,'B',bOrder,t+1);
  assert.equal(c.ok,true,'B '+planet.name+' '+c.reason);
  const resolved=advanceTacticalDuel(c.battle,t+1);
  b=advanceTacticalDuel(resolved,resolved.resolveUntilMs);
 }
 const check=side=>{
  const p=b.sides[side];
  const parts=Object.values(p.defense.parts);
  return {ko:parts.filter(x=>x.hp===0).length,
   damaged:parts.filter(x=>x.hp>0&&x.hp<=x.max/2).length,
   shield:p.defense.shield.hp};
 };
 return {
  planet:planet.name,seed,scenario:config.name,winner:b.winner,rounds:b.round,
  aHits:b.history.reduce((n,h)=>n+(h.hitsA||0),0),
  bHits:b.history.reduce((n,h)=>n+(h.hitsB||0),0),
  aKOs:check('A').ko,bKOs:check('B').ko,
  aDamaged:check('A').damaged,bDamaged:check('B').damaged,
  aShield:check('A').shield,bShield:check('B').shield,
  scans,aims,valid
 };
}
test('Matrice boss: piu seed, navi e upgrade solo con copie possedute; nessun KO fuori limite',()=>{
 const records=[];
 for(const config of scenarios)for(const [i,planet]of PHASE16A_CAMPAIGN_PLANETS.entries()){
  // Gaia puo' essere usato soltanto DOPO il boss della Terra.
  if(config.bossDeck&&i===0)continue;
  for(const seed of seeds)records.push(simulate(planet,i,config,seed));
 }
 assert.equal(records.length,141);
 const summary=scenarios.map(config=>{
  const rows=records.filter(r=>r.scenario===config.name);
  const wins=rows.filter(r=>r.winner==='A').length,
   losses=rows.filter(r=>r.winner==='B').length,
   draws=rows.filter(r=>r.winner==='draw').length;
  return {scenario:config.name,n:rows.length,wins,losses,draws,
   meanRounds:Math.round(rows.reduce((a,r)=>a+r.rounds,0)/rows.length*10)/10,
   meanAhits:Math.round(rows.reduce((a,r)=>a+r.aHits,0)/rows.length*10)/10,
   meanBko:Math.round(rows.reduce((a,r)=>a+r.bKOs,0)/rows.length*100)/100,
   meanScans:Math.round(rows.reduce((a,r)=>a+r.scans,0)/rows.length*10)/10};
 });
 const bossTotals=PHASE16A_CAMPAIGN_PLANETS.map(planet=>{
  const rows=records.filter(r=>r.planet===planet.name);
  return {planet:planet.name,n:rows.length,wins:rows.filter(r=>r.winner==='A').length,
   draws:rows.filter(r=>r.winner==='draw').length,
   avgRounds:Math.round(rows.reduce((a,r)=>a+r.rounds,0)/rows.length*10)/10,
   avgBko:Math.round(rows.reduce((a,r)=>a+r.bKOs,0)/rows.length*10)/10};
 });
 console.log('ECLISSI_MULTI_CONFIG_SUMMARY '+JSON.stringify(summary));
 console.log('ECLISSI_MULTI_BOSS_SUMMARY '+JSON.stringify(bossTotals));
 assert.ok(records.every(r=>r.rounds<=20&&r.aKOs<=4&&r.bKOs<=4));
 assert.ok(records.some(r=>r.valid>0&&r.aHits>0),'Il giocatore deve poter colpire dopo la rivelazione delle firme');
});
