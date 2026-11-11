// Audit ripetibile del ritmo LIVE: due IA con la STESSA strategia, usata
// dalla UI soltanto per B. Non crea PvP online, non concede carte gratuite,
// non cambia i parametri del combattimento e NON rappresenta due esseri umani.
// Misura il caso limite con 30 secondi a turno e 40 turni massimi.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,validateTacticalLoadout} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,
 chooseOfficialLiveAiAction,LIVE_TURN_MS,LIVE_MAX_TURNS,
 LIVE_NUMERIC_LIMIT,LIVE_SPECIAL_LIMIT} from './officialLiveDuelEngine.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {buildTacticalBossDeck,TACTICAL_PRESETS} from './tacticalSpecialPresets.js';
import {VITAL_IDS} from './vitalDefense.js';

const ownCards=(b,k)=>[
 ...b.sides[k].numeric.hand,
 ...b.sides[k].numeric.deck,
 ...b.sides[k].numeric.discard,
 ...VITAL_IDS.flatMap(id=>b.vitalBuilds[k][id])
];
// Audit con un giocatore simulated piu' attento: le numeriche sono
// decise dal pianificatore ufficiale, ma puo' piazzare vere difese
// o sostituire vere carte PRIMA di attaccare. E' SOLO un confronto
// tra politiche di IA, non una nuova regola del gioco o del PvP.
function preparedTestPlayerAction(b){
 if(b.activeSide!=='A'||b.actionUsed.special>=LIVE_SPECIAL_LIMIT)return null;
 const own=b.sides.A,enemy=b.sides.B;
 const available=(type,slot,extra={})=>{
  const index=own.special.hand.findIndex(c=>c.type===type);
  if(index<0)return null;
  const action={type:'special',index,slot,...extra};
  return applyOfficialLiveAction(b,'A',action,b.deadlineMs-1).ok?action:null;
 };
 const threatened=VITAL_IDS.filter(id=>own.defense.parts[id].hp>0&&
  own.defense.parts[id].exposed&&b.vitalBuilds.B[id]?.length>0)
  .sort((a,z)=>b.vitalBuilds.B[z].length-b.vitalBuilds.B[a].length);
 const trapSlot=b.zones.A.traps.findIndex(x=>!x);
 if(threatened.length&&trapSlot>=0&&
  !b.zones.A.traps.some(c=>c?.type==='tactic-counter')){
  const response=available('tactic-counter','trap-'+trapSlot,{vitalId:threatened[0]});
  if(response)return response;
 }
 const openSlot=b.zones.A.open.findIndex(x=>!x);
 if(openSlot>=0&&own.defense.parts.shieldGenerator.hp>0&&
    own.defense.shield.hp>0&&own.defense.shield.max-own.defense.shield.hp>=20){
  const repair=available('support-shield-repair','open-'+openSlot);
  if(repair)return repair;
 }
 if(trapSlot>=0&&own.defense.shield.hp>0&&
    enemy.defense.parts.weapons.hp>0){
  for(const type of ['tactic-reactive','tactic-impact']){
   if(b.zones.A.traps.some(x=>x?.type===type))continue;
   const defense=available(type,'trap-'+trapSlot);
   if(defense)return defense;
  }
 }
 if(openSlot>=0&&enemy.defense.shield.hp<=0&&own.numeric.hand.length&&
  own.numeric.deck.length+own.numeric.discard.length>0&&
  !b.zones.A.open.some(x=>x?.type==='tactic-numeric-recycle')){
  const ranked=own.numeric.hand.map((card,i)=>({i,value:card.value}))
   .sort((a,z)=>a.value-z.value);
  const recycle=available('tactic-numeric-recycle','open-'+openSlot,
   {recycleIndices:ranked.slice(0,2).map(x=>x.i)});
  if(recycle)return recycle;
 }
 return null;
}

function audit({shipA='C01',shipB='N00',levelA=1,levelB=1,seed=18,boss=null,
 bossShieldMax=null,playerSpecialDeck=null,bossSpecialDeck=null,playerPolicy='basic',log=true}={}){
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA,shipB:boss?.motherShipId??shipB,levelA,levelB,
  nowMs:0,seed,mode:'campaign',shuffleNumericOpening:true,
  specialDeckA:playerSpecialDeck,
  bossPlanetB:boss?.planetId??null,
  bossNumericDeckB:boss?{id:boss.numericDeckId,level:boss.numericDeckLevel}:null,
  specialDeckB:boss?(bossSpecialDeck??buildTacticalBossDeck(boss.planetId,levelB,levelA)):null
 }),0);
 // ESPERIMENTO SOLO NEL TEST: nessun valore nel gioco pubblicato cambia.
 // Mantieni firme, quattro vitali, carte e poteri; confronta livelli
 // di sola barriera per capire se il bilanciamento e' proporzionale.
 if(bossShieldMax!=null){
  assert.ok(boss&&Number.isInteger(bossShieldMax)&&bossShieldMax>=60&&bossShieldMax<=200);
  b.sides.B.defense.shield.max=bossShieldMax;
  b.sides.B.defense.shield.hp=bossShieldMax;
 }
 let clock=1000,actions=0,turnChanges=0;
 const failures={},actionsBySide={A:{},B:{}},specialTypesBySide={A:{},B:{}};
 while(b.phase==='playing'&&actions<400){
  const key=b.activeSide,turn=b.turn;
  const action=(key==='A'&&playerPolicy==='prepared-defense'?
   preparedTestPlayerAction(b):null)??chooseOfficialLiveAiAction(b,key);
  assert.ok(action,'nessuna azione calcolabile: '+key+' turno '+turn);
  const selectedSpecial=action.type==='special'?b.sides[key].special.hand[action.index]?.type:null;
  const at=Math.max(clock,(b.aiReadyAtMs||0)+5);
  assert.ok(at<b.deadlineMs,'azione non simulabile entro 30 secondi');
  const result=applyOfficialLiveAction(b,key,action,at);
  if(!result.ok){
   failures[result.reason]=(failures[result.reason]||0)+1;
   assert.fail(key+' '+JSON.stringify(action)+' -> '+result.reason);
  }
  actionsBySide[key][action.type]=(actionsBySide[key][action.type]||0)+1;
  if(selectedSpecial)specialTypesBySide[key][selectedSpecial]=
   (specialTypesBySide[key][selectedSpecial]||0)+1;
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
  bossShieldMax:bossShieldMax??60,
  winner:b.winner,finishReason:b.liveFinishReason,turns:b.turn,minutesMax:+(b.turn*LIVE_TURN_MS/60000).toFixed(1),
  actions,turnChanges,shots:b.history.filter(e=>e.kind==='shot').length,
  destroyedA:VITAL_IDS.filter(id=>b.sides.A.defense.parts[id].hp<=0).length,
  destroyedB:VITAL_IDS.filter(id=>b.sides.B.defense.parts[id].hp<=0).length,
  shieldA:b.sides.A.defense.shield.hp,shieldB:b.sides.B.defense.shield.hp,
  actionsBySide,specialTypesBySide,failures,
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
 if(log)console.log('LIVE_PACING_AUDIT '+JSON.stringify(result));
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

// Un'unica seed non basta per stimare il comportamento di un boss.
// Le tre distribuzioni sono deterministiche e diverse per settore; ogni
// partita utilizza esclusivamente il mazzo reale e le due IA locali.
// Il campione e' ancora esplorativo: non equivale a tempo giocato da persone.
test('Audit multi-seed: 12 boss canonici, tre pescate ciascuno, nessuna carta inventata',()=>{
 const offsets=[0,101,307];
 const results=[];
 const sectors=[];
 for(let i=0;i<12;i++){
  const sectorNumber=(i+1)*10;
  const boss=officialBossEncounter({mode:'campaign',sectorNumber});
  assert.ok(boss,'boss canonico settore '+sectorNumber);
  const levelB=officialCampaignRivalLevel({mode:'campaign',sectorNumber,playerLevel:4});
  const cases=offsets.map(offset=>{
   const seed=100+i*7+offset;
   const result=audit({shipA:'R04',levelA:4,levelB,boss,seed,log:false});
   assert.equal(result.boss,boss.planetId);
   assert.ok(result.actions>0);
   assert.equal(Object.keys(result.failures).length,0);
   assert.ok(result.turns<=LIVE_MAX_TURNS+1);
   return {...result,sectorNumber,levelB};
  });
  assert.equal(new Set(cases.map(r=>r.seed)).size,offsets.length);
  const turns=cases.map(r=>r.turns).sort((a,b)=>a-b);
  sectors.push({
   sector:sectorNumber,boss:boss.planetId,name:boss.name,levelB,
   wins:cases.filter(r=>r.winner==='A').length,
   losses:cases.filter(r=>r.winner==='B').length,
   draws:cases.filter(r=>r.winner==='draw').length,
   minHalfTurns:turns[0],medianHalfTurns:turns[1],maxHalfTurns:turns[2],
   outcomes:cases.map(r=>({
    seed:r.seed,winner:r.winner,halfTurns:r.turns,
    theoreticalMaxMinutes:r.minutesMax,reason:r.finishReason||null,
    destroyedA:r.destroyedA,destroyedB:r.destroyedB,
    shots:r.shots,discardsA:r.actionsBySide.A['numeric-discard']||0,
    discardsB:r.actionsBySide.B['numeric-discard']||0
   }))
  });
  results.push(...cases);
 }
 const wins=results.filter(r=>r.winner==='A').length;
 const losses=results.filter(r=>r.winner==='B').length;
 const draws=results.filter(r=>r.winner==='draw').length;
 const turns=results.map(r=>r.turns).sort((a,b)=>a-b);
 const report={
  sampleSize:results.length,seedsPerBoss:offsets.length,wins,losses,draws,
  minHalfTurns:turns[0],medianHalfTurns:(turns[17]+turns[18])/2,
  maxHalfTurns:turns[turns.length-1],
  note:'IA vs IA, un mezzo turno dura al MASSIMO 30 s; non sono minuti reali. Nessun parametro LIVE modificato.',
  sectors
 };
 console.log('LIVE_ALL_BOSSES_MULTI_SEED '+JSON.stringify(report));
 assert.equal(results.length,12*offsets.length);
 assert.equal(wins+losses+draws,results.length);
 assert.ok(sectors.every(s=>s.outcomes.length===offsets.length));
});
test('Confronto parita livelli: 12 boss, tre seed per boss',()=>{
 const records=[];
 for(let i=0;i<12;i++){
  const n=(i+1)*10,boss=officialBossEncounter({mode:'campaign',sectorNumber:n});
  const level=officialCampaignRivalLevel({mode:'campaign',sectorNumber:n,playerLevel:4});
  for(const offset of [0,101,307]){
   const r=audit({shipA:'R04',levelA:level,levelB:level,boss,seed:100+i*7+offset,log:false});
   records.push({sector:n,level,boss:boss.name,winner:r.winner,turns:r.turns,seed:r.seed,discardsA:r.actionsBySide.A['numeric-discard']||0,discardsB:r.actionsBySide.B['numeric-discard']||0});
  }
 }
 assert.equal(records.length,36);
 console.log('LIVE_MATCHED_LEVEL_BOSSES '+JSON.stringify(records));
});
// Audit incrociato non utilizzato per dare carte ai giocatori:
// tre modelli con firme/armi differenti, livello identico a quello del boss,
// due distribuzioni fisiche per settore. Le durate sono MASSIMI teorici,
// non valutazioni di equilibrio statistico con campioni sufficienti.
test('Audit 12 boss contro tre navicelle a parita di livello e due seed',()=>{
 const ships=['C01','E01','L04'],offsets=[509,907];
 const rows=[];
 for(let i=0;i<12;i++){
  const sector=(i+1)*10;
  const boss=officialBossEncounter({mode:'campaign',sectorNumber:sector});
  assert.ok(boss,'boss mancante nel settore '+sector);
  const level=officialCampaignRivalLevel({mode:'campaign',sectorNumber:sector,playerLevel:4});
  for(const ship of ships)for(const offset of offsets){
   const result=audit({shipA:ship,levelA:level,levelB:level,boss,
    seed:100+i*7+offset,log:false});
   assert.equal(Object.keys(result.failures).length,0);
   assert.ok(result.turns<=LIVE_MAX_TURNS+1);
   rows.push({sector,boss:boss.name,ship,level,seed:result.seed,
    winner:result.winner,halfTurns:result.turns,
    theoreticalMaxMinutes:result.minutesMax,
    discardedA:result.actionsBySide.A['numeric-discard']||0,
    discardedB:result.actionsBySide.B['numeric-discard']||0,
    destroyedA:result.destroyedA,destroyedB:result.destroyedB,
    finishReason:result.finishReason});
  }
 }
 const report={sampleSize:rows.length,ships,seedsPerShipBoss:offsets.length,
  wins:rows.filter(x=>x.winner==='A').length,
  losses:rows.filter(x=>x.winner==='B').length,
  draws:rows.filter(x=>x.winner==='draw').length,
  note:'IA vs IA a livello uguale, navi di classi differenti. Nessuna modifica al gameplay. Minuti massimi teorici a 30s per mezzo turno, non durate osservate.',
  byShip:ships.map(ship=>{
   const results=rows.filter(x=>x.ship===ship);
   const turns=results.map(x=>x.halfTurns).sort((a,b)=>a-b);
   return {ship,wins:results.filter(x=>x.winner==='A').length,
    losses:results.filter(x=>x.winner==='B').length,
    draws:results.filter(x=>x.winner==='draw').length,
    medianHalfTurns:(turns[11]+turns[12])/2,
    minHalfTurns:turns[0],maxHalfTurns:turns[turns.length-1]};
  }),
  rows};
 assert.equal(rows.length,12*ships.length*offsets.length);
 assert.equal(report.wins+report.losses+report.draws,rows.length);
 console.log('LIVE_BOSSES_FLEET_VARIANTS '+JSON.stringify(report));
});

// Diagnostica delle QUATTRO identita' piu delicate, con carte fisiche e
// stesso motore usato in partita. Registra i tipi effettivamente giocati:
// non attribuisce a un boss una speciale che non ha pescato.
test('Diagnostica 4 boss critici: uso speciale reale su 48 duelli multi-seed',()=>{
 const cases=[
  {sector:60,bossId:8,name:'Leviatano Abissale'},
  {sector:70,bossId:9,name:'Signore delle Ombre'},
  {sector:80,bossId:11,name:'Idra Criogenica'},
  {sector:100,bossId:17,name:'Cristallo di Risonanza'}
 ];
 const ships=['C01','E01','L04'],offsets=[1301,1531,1777,2017];
 const results=[];
 for(const info of cases){
  const boss=officialBossEncounter({mode:'campaign',sectorNumber:info.sector});
  assert.ok(boss&&boss.planetId===info.bossId,'identita boss canonica');
  const level=officialCampaignRivalLevel({mode:'campaign',sectorNumber:info.sector,playerLevel:4});
  for(const ship of ships)for(const offset of offsets){
   const seed=info.sector+offset;
   const r=audit({shipA:ship,levelA:level,levelB:level,boss,seed,log:false});
   results.push({sector:info.sector,name:boss.name,ship,seed,winner:r.winner,
    halfTurns:r.turns,reason:r.finishReason,shots:r.shots,
    discardsA:r.actionsBySide.A['numeric-discard']||0,
    discardsB:r.actionsBySide.B['numeric-discard']||0,
    playedA:r.specialTypesBySide.A,playedB:r.specialTypesBySide.B,
    destroyedA:r.destroyedA,destroyedB:r.destroyedB});
  }
 }
 assert.equal(results.length,4*3*4);
 assert.ok(results.every(r=>['A','B','draw'].includes(r.winner)));
 const byBoss=cases.map(info=>{
  const rows=results.filter(r=>r.sector===info.sector);
  const turns=rows.map(r=>r.halfTurns).sort((a,b)=>a-b);
  const specials={};
  for(const row of rows)for(const [type,count]of Object.entries(row.playedB))
   specials[type]=(specials[type]||0)+count;
  return {boss:info.name,planetId:info.bossId,
   winsA:rows.filter(r=>r.winner==='A').length,
   winsBoss:rows.filter(r=>r.winner==='B').length,
   draws:rows.filter(r=>r.winner==='draw').length,
   minHalfTurns:turns[0],medianHalfTurns:(turns[5]+turns[6])/2,
   maxHalfTurns:turns[11],specials,discardsBoss:rows.reduce((n,r)=>n+r.discardsB,0)};
 });
 const report={sampleSize:results.length,ships,seedsPerMatchup:offsets.length,
  note:'IA vs IA; 30 s per mezzo turno e un limite massimo, NON durata osservata sul telefono. Nessuna modifica ai boss.',
  byBoss,rows:results};
 console.log('LIVE_CRITICAL_BOSS_SPECIAL_AUDIT '+JSON.stringify(report));
});

// Ombre e Idra sembrano molto forti con lo starter del giocatore.
// Testa vere configurazioni equipaggiabili da 24 speciali a parita' di
// pescata e livello, per non indebolire un boss solo perche' il test
// usa sistematicamente il mazzo starter. Nessun premio/carta inventato.
test('Audit Ombre e Idra: starter, assedio e difesa reali del giocatore',()=>{
 const sectors=[70,80],ships=['C01','E01','L04'];
 const presets=['starter','assault','defense'],offsets=[229,463,719,947];
 const rows=[];
 for(const sector of sectors){
  const boss=officialBossEncounter({mode:'campaign',sectorNumber:sector});
  assert.ok(boss&&[9,11].includes(boss.planetId));
  const level=officialCampaignRivalLevel({mode:'campaign',sectorNumber:sector,playerLevel:4});
  for(const ship of ships)for(const preset of presets)for(const offset of offsets){
   const seed=sector+offset;
   const r=audit({shipA:ship,levelA:level,levelB:level,
    boss,seed,playerSpecialDeck:TACTICAL_PRESETS[preset].types,log:false});
   assert.equal(Object.keys(r.failures).length,0);
   rows.push({sector,boss:boss.name,ship,preset,seed,
    winner:r.winner,turns:r.turns,reason:r.finishReason,
    actions:r.actions,discardsA:r.actionsBySide.A['numeric-discard']||0,
    discardsB:r.actionsBySide.B['numeric-discard']||0,
    playedA:r.specialTypesBySide.A,playedB:r.specialTypesBySide.B,
    destroyedA:r.destroyedA,destroyedB:r.destroyedB});
  }
 }
 assert.equal(rows.length,2*3*3*4);
 const byBoss=sectors.map(sector=>{
  const data=rows.filter(r=>r.sector===sector);
  const results=presets.map(preset=>{
   const games=data.filter(r=>r.preset===preset);
   const turns=games.map(r=>r.turns).sort((a,b)=>a-b);
   return {preset,winsPlayer:games.filter(r=>r.winner==='A').length,
    winsBoss:games.filter(r=>r.winner==='B').length,
    draws:games.filter(r=>r.winner==='draw').length,
    minHalfTurns:turns[0],medianHalfTurns:(turns[5]+turns[6])/2,
    maxHalfTurns:turns[11]};
  });
  return {sector,boss:data[0].boss,byPreset:results};
 });
 console.log('LIVE_BOSS_PRESET_COMPARISON '+JSON.stringify({
  sampleSize:rows.length,byBoss,
  note:'IA vs IA, 3 mazzi del giocatore realmente costruibili da 24 carte; 30 secondi per mezzo turno e solo un tetto teorico. Gameplay invariato.',
  rows}));
});

// PROVA SOLO TEST: varianti contenute dei mazzi reali di Ombre e Idra.
// Ogni variante sostituisce quattro carte identiche con quattro carte
// difensive/supporto gia' esistenti, senza cambiare abilita, danni o HP.
// I tre mazzi usano le STESSE distribuzioni numeriche per confronto.
test('Confronto boss Ombre e Idra: due varianti di 24 carte senza buff gratuiti',()=>{
 const bosses=[70,80],ships=['C01','E01','L04'],offsets=[229,463,719,947];
 const choices={
  70:[{id:'standard'},{id:'meno-perforanti',remove:'shot-piercing',add:'tactic-impact'},
      {id:'meno-deviazione',remove:'tactic-power-shift',add:'tactic-reactive'}],
  80:[{id:'standard'},{id:'cura-invece-potenza',remove:'tactic-power-shift',add:'support-shield-repair'},
      {id:'difesa-invece-corrosione',remove:'shot-corrosion',add:'tactic-reactive'}]
 };
 const rows=[];
 for(const sector of bosses){
  const boss=officialBossEncounter({mode:'campaign',sectorNumber:sector});
  const level=officialCampaignRivalLevel({mode:'campaign',sectorNumber:sector,playerLevel:4});
  const standard=buildTacticalBossDeck(boss.planetId,level,level);
  for(const choice of choices[sector]){
   const deck=choice.remove?standard.map(x=>x===choice.remove?choice.add:x):standard;
   assert.equal(deck.length,24);
   assert.ok(validateTacticalLoadout(deck),sector+':'+choice.id);
   if(choice.remove)assert.equal(standard.filter(x=>x===choice.remove).length,4);
   for(const ship of ships)for(const offset of offsets){
    const seed=sector+offset;
    const a=audit({shipA:ship,levelA:level,levelB:level,boss,
     seed,bossSpecialDeck:deck,log:false});
    rows.push({sector,boss:boss.name,variant:choice.id,ship,seed,
     winner:a.winner,halfTurns:a.turns,reason:a.finishReason,
     discardsBoss:a.actionsBySide.B['numeric-discard']||0,
     specialsBoss:a.specialTypesBySide.B});
   }
  }
 }
 assert.equal(rows.length,2*3*3*4);
 const byBoss=bosses.map(sector=>{
  const outcomes=choices[sector].map(choice=>{
   const cases=rows.filter(x=>x.sector===sector&&x.variant===choice.id);
   const turns=cases.map(x=>x.halfTurns).sort((a,b)=>a-b);
   return {variant:choice.id,playerWins:cases.filter(x=>x.winner==='A').length,
    bossWins:cases.filter(x=>x.winner==='B').length,
    draws:cases.filter(x=>x.winner==='draw').length,
    minHalfTurns:turns[0],medianHalfTurns:(turns[5]+turns[6])/2,
    maxHalfTurns:turns[11]};
  });
  return {sector,name:rows.find(x=>x.sector===sector).boss,outcomes};
 });
 console.log('LIVE_CRITICAL_BOSS_DECK_EXPERIMENT '+JSON.stringify({
  sampleSize:rows.length,byBoss,
  note:'Solo fixture di test. I mazzi ufficiali di Ombre e Idra NON vengono cambiati in questo commit. 30s a mezzo turno = massimo teorico.',rows}));
});

test('Audit Ombre e Idra contro difese preparate con carte vere del giocatore',()=>{
 const sectors=[70,80],ships=['C01','E01','L04'];
 const offsets=[229,463,719,947],policies=['basic','prepared-defense'];
 const rows=[];
 for(const sector of sectors){
  const boss=officialBossEncounter({mode:'campaign',sectorNumber:sector});
  assert.ok(boss&&[9,11].includes(boss.planetId));
  const level=officialCampaignRivalLevel({mode:'campaign',sectorNumber:sector,playerLevel:4});
  for(const ship of ships)for(const offset of offsets)for(const policy of policies){
   const seed=sector+offset;
   const result=audit({shipA:ship,levelA:level,levelB:level,boss,seed,
    playerPolicy:policy,log:false});
   assert.equal(Object.keys(result.failures).length,0);
   rows.push({sector,boss:boss.name,ship,seed,policy,
    winner:result.winner,halfTurns:result.turns,reason:result.finishReason,
    playerSpecials:result.specialTypesBySide.A,
    bossSpecials:result.specialTypesBySide.B,
    destroyedA:result.destroyedA,destroyedB:result.destroyedB});
  }
 }
 assert.equal(rows.length,2*3*4*2);
 const byBoss=sectors.map(sector=>({
  sector,name:rows.find(r=>r.sector===sector).boss,
  byPolicy:policies.map(policy=>{
   const cases=rows.filter(r=>r.sector===sector&&r.policy===policy);
   const turns=cases.map(r=>r.halfTurns).sort((a,b)=>a-b);
   const specials={};
   for(const r of cases)for(const [type,count]of Object.entries(r.playerSpecials))
    specials[type]=(specials[type]||0)+count;
   return {policy,winsPlayer:cases.filter(x=>x.winner==='A').length,
    winsBoss:cases.filter(x=>x.winner==='B').length,
    draws:cases.filter(x=>x.winner==='draw').length,
    minHalfTurns:turns[0],medianHalfTurns:(turns[5]+turns[6])/2,
    maxHalfTurns:turns[11],playedSpecialsA:specials};
  })
 }));
 console.log('LIVE_PREPARED_PLAYER_POLICY_AUDIT '+JSON.stringify({
  sampleSize:rows.length,byBoss,
  note:'Politica di test che usa soltanto carte realmente in mano, nessuna anticipazione; PvP e boss LIVE invariati. Tempo massimo 30 secondi per mezzo turno.',
  rows}));
});

test('Esperimento SOLO TEST: quattro boss troppo rapidi con barriera 60/90/120/150',()=>{
 const experiments=[];
 for(const index of [1,5,6,9]){
  const sectorNumber=(index+1)*10;
  const boss=officialBossEncounter({mode:'campaign',sectorNumber});
  assert.ok(boss);
  const levelB=officialCampaignRivalLevel({mode:'campaign',sectorNumber,playerLevel:4});
  const seed=100+index*7;
  const cases=[60,90,120,150].map(bossShieldMax=>
   audit({shipA:'R04',levelA:4,levelB,boss,seed,bossShieldMax}));
  experiments.push({sectorNumber,boss:boss.planetId,
   outcomes:cases.map(r=>({
    shield:r.bossShieldMax,winner:r.winner,halfTurns:r.turns,
    theoreticalMaxMinutes:r.minutesMax,shots:r.shots
   }))});
  assert.equal(cases.length,4);
  assert.ok(cases.every(c=>c.actions>0&&Object.keys(c.failures).length===0));
 }
 console.log('LIVE_BOSS_SHIELD_EXPERIMENT '+JSON.stringify({
  note:'Solo esperimento di test. I valori live rimangono 60 HP base.',
  experiments
 }));
 assert.equal(experiments.length,4);
});
