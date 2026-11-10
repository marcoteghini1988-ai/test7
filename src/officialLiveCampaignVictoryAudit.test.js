import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn,
 LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT} from './officialLiveDuelEngine.js';
import {officialBattleResult} from './officialBattleSetup.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {READY_EXCLUSIVE_BOSS_IDS} from './tacticalExclusiveBosses.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS,damageMotherShield} from './vitalDefense.js';
import {tacticalShipSignatures,tacticalSignatureOperation} from './tacticalShipSignatures.js';

// Audit delle vittorie di campagna senza carte inventate. La barriera viene
// abbattuta all'inizio tramite il modello di difesa per isolare le 68 firme:
// gli spari nativi/barriera sono già verificati da test separati. Per ogni
// modello si usano esattamente 8 numeriche fisiche, 3 per turno al massimo.
function cardPlan(shipId,source){
 const used=new Set(),plan=[];
 for(const vitalId of VITAL_IDS){
  const signature=tacticalShipSignatures(shipId)[vitalId];
  let found=null;
  for(let i=0;i<source.length&&!found;i++){
   if(used.has(source[i].id))continue;
   for(let j=i+1;j<source.length;j++){
    if(used.has(source[j].id))continue;
    const cards=[source[i],source[j]];
    if(tacticalSignatureOperation(signature,cards)){
     found=cards;
     break;
    }
   }
  }
  assert.ok(found,'coppia fisica risolvibile per '+shipId+'/'+vitalId);
  for(const c of found){
   assert.equal(used.has(c.id),false);
   used.add(c.id);
   plan.push({vitalId,card:c});
  }
 }
 return plan;
}
function play(b,key,action,nowMs){
 const result=applyOfficialLiveAction(b,key,action,nowMs);
 assert.equal(result.ok,true,JSON.stringify({key,action,reason:result.reason}));
 return result.battle;
}
function run(shipId,{bossEncounter=null,sectorNumber=7}={}){
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'C01',shipB:shipId,levelA:1,levelB:1,nowMs:0,mode:'campaign',
  bossPlanetB:bossEncounter?.planetId??null,
  bossNumericDeckB:bossEncounter?{
   id:bossEncounter.numericDeckId,level:bossEncounter.numericDeckLevel
  }:null
 }),0);
 if(bossEncounter){
  assert.equal(b.sides.B.bossPlanetId,bossEncounter.planetId);
  assert.equal(b.sides.B.bossExclusive.id,bossEncounter.planetId);
  assert.equal(b.sides.B.bossNumericDeck.id,bossEncounter.numericDeckId);
 }
 const pile=b.sides.A.numeric;
 const source=[...pile.hand,...pile.deck,...pile.discard];
 assert.equal(new Set(source.map(c=>c.id)).size,52);
 const plan=cardPlan(shipId,source);
 assert.equal(plan.length,8);
 const ids=new Set(plan.map(x=>x.card.id));
 pile.hand=[...plan.slice(0,7).map(x=>x.card)];
 pile.deck=[plan[7].card,...source.filter(c=>!ids.has(c.id))];
 pile.discard=[];
 assert.equal(pile.hand.length+pile.deck.length,52);
 const shield=b.sides.B.defense.shield;
 b.sides.B.defense=damageMotherShield(b.sides.B.defense,shield.hp).defense;
 assert.equal(b.sides.B.defense.shield.hp,0);
 let nowMs=1;
 for(let i=0;i<plan.length;i++){
  const {vitalId,card}=plan[i];
  if(i>0&&i%LIVE_NUMERIC_LIMIT===0){
   b=finishOfficialLiveTurn(b,nowMs++);
   b=finishOfficialLiveTurn(b,nowMs++);
  }
  if(!b.sides.B.defense.parts[vitalId].exposed)
   b=play(b,'A',{type:'expose',vitalId},nowMs++);
  const index=b.sides.A.numeric.hand.findIndex(c=>c.id===card.id);
  assert.ok(index>=0,shipId+'/'+vitalId+': numerica realmente pescata');
  b=play(b,'A',{type:'numeric',index,target:'vital',vitalId},nowMs++);
  assert.ok(b.actionUsed.numeric<=LIVE_NUMERIC_LIMIT);
  assert.ok(b.actionUsed.special<=LIVE_SPECIAL_LIMIT);
  const all=[...b.sides.A.numeric.hand,...b.sides.A.numeric.deck,
   ...b.sides.A.numeric.discard,...VITAL_IDS.flatMap(id=>b.vitalBuilds.A[id])];
  assert.equal(all.length,52,shipId+': conservazione 52 numeriche');
  assert.equal(new Set(all.map(c=>c.id)).size,52,shipId+': nessun duplicato');
 }
 assert.equal(b.winner,'A',shipId);
 assert.equal(b.phase,'finished',shipId);
 assert.equal(VITAL_IDS.every(id=>b.sides.B.defense.parts[id].hp===0),true,shipId);
 assert.equal(b.history.filter(e=>e.kind==='vital_destroyed').length,4,shipId);
 assert.equal(b.history.filter(e=>e.kind==='shot').length,0,shipId);
 const report=officialBattleResult(b,'campaign',sectorNumber);
 assert.equal(report.eligibleForRewards,true,shipId);
 assert.equal(report.meta.matchStats.enemyVitalsDestroyed,4,shipId);
 assert.equal(report.meta.matchStats.ownVitalsDestroyed,0,shipId);
 assert.equal(report.meta.matchStats.enemyShieldDamagePct,100,shipId);
 assert.equal(report.meta.matchStats.simultaneousDuel,false,shipId);
 return b;
}
test('Campagna LIVE: le 68 firme delle 17 navicelle permettono 4 KO con 52 carte reali, 3+2 intatto',()=>{
 for(const ship of PHASE1_CATALOG.ships)run(ship.id);
});
test('Le statistiche distinguono danni barriera e distruzione vitale anche a parità di shield',()=>{
 const b=run('L04'),r=officialBattleResult(b,'campaign',7);
 assert.equal(r.meta.matchStats.damageDealt,100,'metrica legacy invariata');
 assert.equal(r.meta.matchStats.enemyVitalsDestroyed,4);
 assert.equal(r.meta.matchStats.ownVitalsDestroyed,0);
 const pvp=officialBattleResult(b,'pvp',7);
 assert.equal(pvp.eligibleForRewards,false,'PvP continua solo simulato, nessun premio');
});

test('Dodici boss canonici LIVE: tutti i quattro vitali restano distruttibili con firme vere',()=>{
 assert.equal(READY_EXCLUSIVE_BOSS_IDS.length,12);
 for(const [index,id] of READY_EXCLUSIVE_BOSS_IDS.entries()){
  const sectorNumber=(index+1)*10;
  const encounter=officialBossEncounter({
   mode:'campaign',sectorNumber,planetId:id,sectorLevel:10
  });
  assert.ok(encounter,'boss canonico '+id+' al settore '+sectorNumber);
  const b=run(encounter.motherShipId,{bossEncounter:encounter,sectorNumber});
  assert.equal(b.winner,'A',encounter.planetName);
  const result=officialBattleResult(b,'campaign',sectorNumber);
  assert.equal(result.eligibleForRewards,true);
  assert.equal(result.meta.matchStats.bossPlanetId,id);
  assert.equal(result.meta.matchStats.bossSectorLevel,10);
 }
});
