// Audit ripetibile del ritmo LIVE: due IA con la STESSA strategia, usata
// dalla UI soltanto per B. Non crea PvP online, non concede carte gratuite,
// non cambia i parametri del combattimento e NON rappresenta due esseri umani.
// Misura il caso limite con 30 secondi a turno e 40 turni massimi.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,
 chooseOfficialLiveAiAction,LIVE_TURN_MS,LIVE_MAX_TURNS,
 LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT} from './officialLiveDuelEngine.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {VITAL_IDS} from './vitalDefense.js';

const ownCards=(b,k)=>[
 ...b.sides[k].numeric.hand,
 ...b.sides[k].numeric.deck,
 ...b.sides[k].numeric.discard,
 ...VITAL_IDS.flatMap(id=>b.vitalBuilds[k][id])
];
function audit({shipA='C01',shipB='N00',levelA=1,levelB=1,seed=18,boss=null}={}){
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA,shipB:boss?.motherShipId??shipB,levelA,levelB,
  nowMs:0,seed,mode:'campaign',shuffleNumericOpening:true,
  bossPlanetB:boss?.planetId??null,
  bossNumericDeckB:boss?{id:boss.numericDeckId,level:boss.numericDeckLevel}:null,
  specialDeckB:boss?buildTacticalBossDeck(boss.planetId,levelB,levelA):null
 }),0);
 let clock=1000,actions=0,turnChanges=0;
 const failures={},actionsBySide={A:{},B:{}};
 while(b.phase==='playing'&&actions<400){
  const key=b.activeSide,turn=b.turn;
  const action=chooseOfficialLiveAiAction(b,key);
  assert.ok(action,'nessuna azione calcolabile: '+key+' turno '+turn);
  const at=Math.max(clock,(b.aiReadyAtMs||0)+5);
  assert.ok(at<b.deadlineMs,'azione non simulabile entro 30 secondi');
  const result=applyOfficialLiveAction(b,key,action,at);
  if(!result.ok){
   failures[result.reason]=(failures[result.reason]||0)+1;
   assert.fail(key+' '+JSON.stringify(action)+' -> '+result.reason);
  }
  actionsBySide[key][action.type]=(actionsBySide[key][action.type]||0)+1;
  b=result.battle;
  assert.ok(b.actionUsed.numeric<=LIVE_NUMERIC_LIMIT&&b.actionUsed.special<=LIVE_SPECIAL_LIMIT);
  if(actions%11===0){
   for(const side of ['A','B']){
    const cards=ownCards(b,side);
    assert.equal(cards.length,52,'mazzo numerico ancora 52 carte per '+side);
    assert.equal(new Set(cards.map(c=>c.id)).size,52,'nessuna carta duplicata per '+side);
   }
  }
  if(b.turn!==turn)turnChanges++;
  clock=at+850;
  actions++;
 }
 assert.equal(b.phase,'finished','non deve restare sospesa una partita dopo '+actions+' azioni');
 assert.ok(['A','B','draw'].includes(b.winner),'vincitore codificato e valido');
 assert.ok(b.turn<=LIVE_MAX_TURNS+1);
 const result={
  seed,shipA,shipB:boss?.motherShipId??shipB,boss:boss?.planetId??null,
  winner:b.winner,turns:b.turn,minutesMax:+(b.turn*LIVE_TURN_MS/60000).toFixed(1),
  actions,turnChanges,shots:b.history.filter(e=>e.kind==='shot').length,
  destroyedA:VITAL_IDS.filter(id=>b.sides.A.defense.parts[id].hp<=0).length,
  destroyedB:VITAL_IDS.filter(id=>b.sides.B.defense.parts[id].hp<=0).length,
  shieldA:b.sides.A.defense.shield.hp,shieldB:b.sides.B.defense.shield.hp,
  actionsBySide,failures,
  stalled:b.winner==='draw'?Object.fromEntries(['A','B'].map(key=>[key,{
   aliveVitals:VITAL_IDS.filter(id=>b.sides[key].defense.parts[id].hp>0),
   builds:Object.fromEntries(VITAL_IDS.filter(id=>b.vitalBuilds[key][id].length)
    .map(id=>[id,b.vitalBuilds[key][id].map(c=>c.value+c.suit)])),
   hand:b.sides[key].numeric.hand.map(c=>c.value+c.suit),
   deckCount:b.sides[key].numeric.deck.length,
   discardCount:b.sides[key].numeric.discard.length,
   seen:b.sides[key].seen
  }])):null
 };
 console.log('LIVE_PACING_AUDIT '+JSON.stringify(result));
 return result;
}
test('Audit LIVE: sei seed e 3 modelli in campagna senza PvP e senza carte gratis',()=>{
 const results=[
  audit({shipA:'N00',shipB:'C01',seed:18}),
  audit({shipA:'C01',shipB:'C02',seed:29}),
  audit({shipA:'R04',shipB:'E01',levelA:3,levelB:3,seed:41}),
  audit({shipA:'L04',shipB:'L03',levelA:5,levelB:5,seed:77})
 ];
 assert.equal(results.length,4);
 assert.ok(results.every(r=>r.actions>0));
});
test('Audit LIVE: ritmi e carte su tre boss canonici (Terra, Crono, Vuoto)',()=>{
 const chosen=[1,6,20];
 const results=chosen.map((id,i)=>{
  // Pianeti da catalogo storico: l'ID non equivale al loro indice.
  const sector=Array.from({length:12},(_,j)=>10*(j+1))
   .find(n=>officialBossEncounter({mode:'campaign',sectorNumber:n})?.planetId===id);
  assert.ok(sector,'boss canonico '+id);
  const boss=officialBossEncounter({mode:'campaign',sectorNumber:sector});
  return audit({shipA:'R04',levelA:4,levelB:4,boss,seed:18+i*17});
 });
 assert.equal(results.length,3);
 assert.ok(results.every(r=>r.boss!=null));
});

test('Audit esteso dei 12 boss ufficiali: tutti raggiungono un esito, 52 numeriche e nessun PvP',()=>{
 const results=[];
 for(let i=0;i<12;i++){
  const sectorNumber=(i+1)*10;
  const boss=officialBossEncounter({mode:'campaign',sectorNumber});
  assert.ok(boss,'settore 10–120: boss canonico '+sectorNumber);
  const levelB=officialCampaignRivalLevel({mode:'campaign',sectorNumber,playerLevel:4});
  const result=audit({shipA:'R04',levelA:4,levelB,boss,seed:100+i*7});
  assert.equal(result.boss,boss.planetId);
  assert.ok(result.actions>0);
  assert.equal(Object.keys(result.failures).length,0);
  results.push({...result,sectorNumber,levelB});
 }
 const wins=results.filter(r=>r.winner==='A').length;
 const losses=results.filter(r=>r.winner==='B').length;
 const draws=results.filter(r=>r.winner==='draw').length;
 const turns=results.map(r=>r.turns).sort((a,b)=>a-b);
 const report={sampleSize:results.length,wins,losses,draws,
  minHalfTurns:turns[0],medianHalfTurns:(turns[5]+turns[6])/2,
  maxHalfTurns:turns[11],sectors:results.map(r=>({
   sector:r.sectorNumber,boss:r.boss,winner:r.winner,turns:r.turns,
   theoreticalMaxMin:r.minutesMax,levelB:r.levelB
  }))
 };
 console.log('LIVE_ALL_BOSSES_AUDIT '+JSON.stringify(report));
 assert.equal(wins+losses+draws,12);
});
