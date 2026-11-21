import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolvePreparedFleetTurn,advanceFleetCombatTime,
 validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {chargeElementalEnergy} from './fleetNext/elementalAbilities.js';
import {generatorCardCount,generatorCoolingOwnTurns,generatorAttackPreview}
 from './fleetNext/motherGeneratorBalance.js';
import {PACING_BALANCE_CANDIDATE} from './fleetNext/pacingBalanceCandidate.js';
import {componentDurations,advanceTimedComponents,strategicComponentDurations}
 from './fleetNext/componentTimerPacing.js';
import {STRATEGIC_NO_DRAIN_BALANCE} from './fleetNext/strategicNoDrainBalance.js';
import {ALL_WEAPON_CARDS,WEAPON_STRATEGIC_PRINT_CANDIDATES,
 WEAPON_STRATEGIC_PRINT_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
const create=()=>createFleetNextBattle({
 shipA:'N00',shipB:'C01',raritaA:'Comune',raritaB:'Comune',
 supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],
 ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,seed:1717,nowMs:0
});
const aim=(cards=[],special=false)=>({
 cards,pass:false,activateElemental:special,targetKind:'part',
 targetId:'weapons',partId:'weapons'
});
test('Nuova battaglia: 3 timer per nave e HP Comune calibrati; Generatore non si rompe',()=>{
 const b=create();
 assert.equal(b.newGeneratorCombat,true);
 for(const side of Object.values(b.sides)){
  assert.equal(side.newGeneratorCombat,true);
  assert.equal(side.componentTimers.generator,undefined);
  assert.equal(side.weaponBalanceFactor,.6);
  assert.equal(side.componentDeteriorationFraction,.009);
  assert.equal(side.ships[0].hp,side.ships[0].maxHp);
  assert.deepEqual(Object.keys(side.componentTimers).sort(),
   ['bridge','command','weapons']);
  assert.equal(generatorCoolingOwnTurns(side),0);
 }
 const before=b.sides.A.ships[0].hp;
 assert.equal(before,Math.round(1050*.36*1.15));
});
test('ESEGUI senza carte, senza prenotazione: nessun tiro base della madre',()=>{
 const b=create();
 const hp=b.sides.B.ships[0].hp;
 assert.equal(validateFleetTurn(b,'A',aim()),null);
 const r=resolvePreparedFleetTurn(b,'A',aim(),1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.turn,'B');
 assert.equal(r.battle.sides.B.ships[0].hp,hp);
 assert.equal(r.shot.damage,0);
});
test('2 Carte Energia fisiche + prenotazione: scatto rapido, consumo 2 e cooldown',()=>{
 const b=create(),side=b.sides.A;
 side.hand=['energy-ionic','energy-ionic'];
 const hp=b.sides.B.ships[0].hp;
 const r=resolvePreparedFleetTurn(b,'A',aim([0,1],true),1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.events.some(e=>e.kind==='generator-shot'&&e.generatorTier==='quick'),true);
 assert.ok(r.battle.sides.B.ships[0].hp<hp);
 assert.equal(generatorCardCount(r.battle.sides.A),0);
 assert.equal(generatorCoolingOwnTurns(r.battle.sides.A),1);
});
test('1 Energia esistente + 3 carte nuove: prenotazione passa da 2 a 4 senza altri click',()=>{
 const b=create(),side=b.sides.A;
 assert.equal(chargeElementalEnergy(side,'ionic','energy-ionic'),true);
 side.hand=['energy-ionic','energy-ionic','energy-ionic'];
 const r=resolvePreparedFleetTurn(b,'A',aim([0,1,2],true),1000);
 assert.equal(r.ok,true,r.reason);
 const fired=r.events.find(e=>e.kind==='generator-shot');
 assert.equal(fired?.generatorTier,'heavy');
 assert.equal(fired?.spentPhysicalCards,4);
 assert.equal(generatorCardCount(r.battle.sides.A),0);
});
test('Energia non prenotata rimane nello slot e una Leggendaria vale UNA carta',()=>{
 const b=create(),side=b.sides.A;
 side.hand=['energy-ionic-l'];
 const r=resolvePreparedFleetTurn(b,'A',aim([0],false),1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.sides.B.ships[0].hp,b.sides.B.ships[0].hp);
 assert.equal(generatorCardCount(r.battle.sides.A),1);
 assert.equal(r.battle.sides.A.elementalCharges.ionic,4);
 assert.equal(r.events.some(e=>e.kind==='generator-shot'),false);
});
test('Arma Sequenza: colpo autonomo senza scarica gratuita o prenotazione',()=>{
 const b=create(),side=b.sides.A;
 side.machines.push({id:'w-sequence-test',slot:0,hp:1,maxHp:1,
  untilPly:20,damageMode:'sequence',soloDamage:30,chainDamage:70,
  sequenceStage:1,power:0,weaponElementId:'ionic',
  sourceCardId:'weapon-sequence-test',name:'Test Sequenza'});
 const enemyHp=b.sides.B.ships[0].hp;
 const r=resolvePreparedFleetTurn(b,'A',aim(),1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.battle.sides.B.ships[0].hp<enemyHp);
 assert.ok(r.events.some(e=>e.kind==='impact'), 'Deve sparare senza attacco base');
 assert.equal(r.events.some(e=>e.kind==='generator-shot'),false);
});
test('L orologio di partita avanza anche tra le carte e consuma i 3 timer in parallelo',()=>{
 const b=create(),max=Math.max(...Object.values(componentDurations('N00','Comune')));
 const before=b.sides.A.ships[0].hp;
 const advanced=advanceFleetCombatTime(b,40000);
 assert.equal(advanced.battle.sides.A.componentTimers.weapons.remainingSeconds,210);
 assert.equal(advanced.battle.sides.A.ships[0].hp,before);
 assert.equal(advanced.battle.componentClockSeconds,40);
 const allEnds=Math.max(max,...Object.values(componentDurations('C01','Comune')));
 const all=advanceFleetCombatTime(advanced.battle,(allEnds+10)*1000);
 assert.ok(all.battle.sides.A.componentTimers.weapons.expired);
 assert.ok(all.battle.sides.A.componentTimers.command.expired);
 assert.ok(all.battle.sides.A.componentTimers.bridge.expired);
 assert.ok(all.battle.sides.A.ships[0].hp<before);
 assert.ok(all.battle.sides.B.ships[0].hp<create().sides.B.ships[0].hp);
});
test('Il deterioramento della nave puo terminare la partita senza quarto timer Generatore',()=>{
 const b=create();
 const after=advanceFleetCombatTime(b,600000);
 assert.equal(after.battle.phase,'finished');
 assert.equal(after.battle.sides.A.componentTimers.generator,undefined);
 assert.equal(after.battle.sides.B.componentTimers.generator,undefined);
 assert.ok(after.battle.finishedAtMs<600000);
});

test('Il cronometro individuale avanza SOLO nel turno del proprietario',()=>{
 const b=create();
 b.componentClockMode='active-player-only';
 for(const side of Object.values(b.sides)){
  side.componentDeteriorationFraction=.01;
  for(const [key,at] of Object.entries({weapons:165,command:190,bridge:210})){
   side.componentTimers[key].initialSeconds=at;
   side.componentTimers[key].remainingSeconds=at;
  }
 }
 const once=advanceFleetCombatTime(b,10000);
 assert.equal(once.battle.sides.A.componentElapsedSeconds,10);
 assert.equal(once.battle.sides.B.componentElapsedSeconds,0);
 assert.equal(once.battle.sides.B.componentTimers.weapons.remainingSeconds,165);
 const twice=advanceFleetCombatTime(once.battle,10000);
 assert.equal(twice.battle.sides.A.componentElapsedSeconds,10,'Nessun doppio conteggio');
 const a=resolvePreparedFleetTurn(twice.battle,'A',aim(),10000);
 assert.equal(a.ok,true,a.reason);
 assert.equal(a.battle.turn,'B');
 const duringB=advanceFleetCombatTime(a.battle,22000);
 assert.equal(duringB.battle.sides.A.componentElapsedSeconds,10);
 assert.equal(duringB.battle.sides.B.componentElapsedSeconds,12);
 assert.equal(duringB.battle.sides.A.componentTimers.bridge.remainingSeconds,200);
 assert.equal(duringB.battle.sides.B.componentTimers.bridge.remainingSeconds,198);
 const bTurn=resolvePreparedFleetTurn(duringB.battle,'B',aim(),22000);
 assert.equal(bTurn.ok,true,bTurn.reason);
 const nextA=advanceFleetCombatTime(bTurn.battle,28000);
 assert.equal(nextA.battle.sides.A.componentElapsedSeconds,16);
 assert.equal(nextA.battle.sides.B.componentElapsedSeconds,12);
});
test('Deterioramento individuale: 1% HP massimi dopo 210 secondi PROPRI, pausa fuori turno',()=>{
 const b=create(),side=b.sides.A;
 b.componentClockMode='active-player-only';
 side.componentDeteriorationFraction=.01;
 for(const [key,at] of Object.entries({weapons:169,command:191,bridge:210})){
  side.componentTimers[key].initialSeconds=at;
  side.componentTimers[key].remainingSeconds=at;
 }
 advanceTimedComponents(side,209,{drainFraction:.01});
 const full=side.ships[0].hp;
 // Il giocatore ha gia' consumato 209 secondi nei suoi turni precedenti:
 // l'ultimo componente scade al suo secondo 210, senza danno nello stesso secondo.
 const t210=advanceFleetCombatTime(b,1000);
 assert.equal(t210.battle.sides.A.componentElapsedSeconds,210);
 assert.equal(t210.battle.sides.A.componentTimers.bridge.expired,true);
 assert.equal(t210.battle.sides.A.ships[0].hp,full);
 const t211=advanceFleetCombatTime(t210.battle,2000);
 assert.equal(t211.battle.sides.A.componentElapsedSeconds,211);
 assert.ok(Math.abs((full-t211.battle.sides.A.ships[0].hp)-full*.01)<.02);
 const repeated=advanceFleetCombatTime(t211.battle,2000);
 assert.equal(repeated.battle.sides.A.ships[0].hp,t211.battle.sides.A.ships[0].hp);
 const passed=resolvePreparedFleetTurn(repeated.battle,'A',aim(),2000);
 assert.equal(passed.ok,true,passed.reason);
 const idle=advanceFleetCombatTime(passed.battle,21000);
 assert.equal(idle.battle.sides.A.componentElapsedSeconds,211);
 assert.equal(idle.battle.sides.A.ships[0].hp,t211.battle.sides.A.ships[0].hp);
 assert.equal(idle.battle.sides.B.componentElapsedSeconds,19);
});

const createNoDrain=(shipA='N00',shipB='C01',rarity='Comune')=>
 createFleetNextBattle({shipA,shipB,raritaA:rarity,raritaB:rarity,
  supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],
  ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,
  strategicNoDeterioration:true,seed:1717,nowMs:0});
test('Nuova partita ufficiale: tre timer misti, ultimo a 210s propri, deterioramento zero',()=>{
 for(const id of ['N00','C01','C02','C03','R01','R02','R04','E01','E02','L01','L03','L04']){
  const profile=strategicComponentDurations(id);
  assert.equal(Math.max(...Object.values(profile)),210,id);
  assert.equal(new Set(Object.values(profile)).size,3,id);
 }
 const b=createNoDrain();
 assert.equal(b.strategicNoDeterioration,true);
 assert.equal(b.componentClockMode,'strategy-per-turn');
 assert.equal(b.strategicSecondsPerTurn,20);
 assert.equal(b.sides.A.componentDeteriorationFraction,0);
 assert.equal(b.sides.B.componentDeteriorationFraction,0);
 assert.equal(b.sides.A.weaponBalanceFactor,.6);
 const hpA=b.sides.A.ships[0].hp,hpB=b.sides.B.ships[0].hp;
 const pre=advanceFleetCombatTime(b,29000);
 assert.equal(pre.battle.sides.A.componentElapsedSeconds,0);
 assert.equal(pre.battle.sides.B.componentElapsedSeconds,0);
 const first=resolvePreparedFleetTurn(pre.battle,'A',aim(),1000);
 assert.equal(first.ok,true,first.reason);
 assert.equal(first.battle.sides.A.componentElapsedSeconds,20);
 assert.equal(first.battle.sides.B.componentElapsedSeconds,0);
 const second=resolvePreparedFleetTurn(first.battle,'B',aim(),24000);
 assert.equal(second.ok,true,second.reason);
 assert.equal(second.battle.sides.A.componentElapsedSeconds,20);
 assert.equal(second.battle.sides.B.componentElapsedSeconds,20);
 let current=second.battle;
 for(let n=2;n<24;n++){
  const who=current.turn;
  const value=resolvePreparedFleetTurn(current,who,aim(),current.turnStartedAtMs+1000);
  assert.equal(value.ok,true,value.reason);
  current=value.battle;
 }
 assert.equal(current.phase,'playing');
 assert.equal(current.sides.A.ships[0].hp,hpA);
 assert.equal(current.sides.B.ships[0].hp,hpB);
 assert.equal(Object.values(current.sides.A.componentTimers).every(t=>t.expired),true);
 assert.equal(Object.values(current.sides.B.componentTimers).every(t=>t.expired),true);
});
test('Tutti i valori Arma e madre coincidono con la taratura attiva, senza costi gratuiti',()=>{
 assert.equal(ALL_WEAPON_CARDS.length,235);
 assert.equal(WEAPON_STRATEGIC_PRINT_CANDIDATES.length,235);
 assert.equal(Object.keys(WEAPON_STRATEGIC_PRINT_BY_ID).length,235);
 for(const raw of ALL_WEAPON_CARDS){
  const shown=WEAPON_STRATEGIC_PRINT_BY_ID[raw.id];
  assert.equal(shown.id,raw.id);
  assert.equal(shown.rarita,raw.rarita);
  assert.equal(shown.effectSpec.durationTurns,raw.effectSpec.durationTurns);
  assert.equal(shown.effectSpec.type,raw.effectSpec.type);
  assert.equal(shown.balanceRevision,STRATEGIC_NO_DRAIN_BALANCE.id);
 }
 const example=WEAPON_STRATEGIC_PRINT_BY_ID['weapon-confirmed-metallic-maglio'];
 assert.equal(example.effectSpec.baseDamage,18,'Comune: 30 HP nominali x0,60');
 const epic=createNoDrain('E01','E02','Epica');
 const mother=epic.sides.A.ships[0],side=epic.sides.A;
 assert.equal(side.weaponBalanceFactor,1.7);
 assert.equal(side.motherGeneratorDamageFactor,1.25);
 side.energyPile=['energy-ionic','energy-ionic'];
 const expected=Math.round(mother.maxHp*.10*1.25);
 assert.equal(generatorAttackPreview(side,true).nominalDamage,expected);
 const legendary=createNoDrain('L01','L03','Leggendaria');
 assert.equal(legendary.sides.A.weaponBalanceFactor,1.85);
 assert.equal(legendary.sides.A.motherGeneratorDamageFactor,1.30);
});
test('Recupero mano fisico: consuma il turno, scarta la carta scelta, nessuna copia regalata',()=>{
 const b=createNoDrain(),side=b.sides.A;
 const old=['energy-ionic','energy-ionic-r','energy-ionic-e','energy-ionic-l',
  'sys-weapons-plus-c','sys-weapons-minus-c','sys-generator-plus-c'];
 side.hand=[...old];side.deck=['energy-ionic'];side.discard=[];
 const result=resolvePreparedFleetTurn(b,'A',{...aim(),recoverHandCardIndex:1},1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.turn,'B');
 assert.equal(result.battle.sides.A.handRecoveries,1);
 assert.equal(result.battle.sides.A.hand.length,7);
 assert.equal(result.battle.sides.A.hand.includes('energy-ionic-r'),false);
 assert.equal(result.battle.sides.A.discard.includes('energy-ionic-r'),true);
 assert.equal(result.battle.sides.A.componentElapsedSeconds,20);
 assert.equal(result.events.some(e=>e.kind==='hand-recovery'),true);
 assert.equal(result.events.some(e=>e.kind==='generator-shot'),false);
});
test('Cronometro strategico: con le stesse mosse 6s o 26s producono lo stesso esito',()=>{
 const run=ms=>{
  let b=createNoDrain();
  for(let n=0;n<22;n++){
   const r=resolvePreparedFleetTurn(b,b.turn,aim(),b.turnStartedAtMs+ms);
   assert.equal(r.ok,true,r.reason);b=r.battle;
  }
  return ['A','B'].map(w=>({
   own:b.sides[w].componentElapsedSeconds,life:b.sides[w].ships[0].hp,
   expired:Object.values(b.sides[w].componentTimers).map(t=>t.expired)
  }));
 };
 assert.deepEqual(run(6000),run(26000));
});
