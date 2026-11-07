import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16D_BOSS_PROFILES} from './newCombat/phase16DBosses.js';
import {BOSS_NUMERIC_DECKS,activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady} from './tacticalBossDecks.js';
import {exclusiveBossReady} from './tacticalExclusiveBosses.js';
import {buildTacticalBossDeck} from './tacticalSpecialPresets.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const keys=Object.keys(PHASE16D_BOSS_PROFILES).map(Number).sort((a,b)=>a-b);
const NUMERIC_IDS=Object.keys(BOSS_NUMERIC_DECKS);
function assertConsistent(b,context){
 for(const side of Object.values(b.sides)){
  assert.ok(side.sync>=0&&side.sync<=100,context+' sync');
  assert.ok(side.defense.shield.hp>=0&&side.defense.shield.hp<=side.defense.shield.max,context+' shield');
  assert.ok(Object.values(side.defense.parts).every(p=>p.hp>=0&&p.hp<=p.max),context+' vitals');
  assert.ok(side.escorts.every(e=>e.hp>=0&&e.hp<=e.max),context+' escorts');
  const num=[...side.numeric.hand,...side.numeric.deck,...side.numeric.discard];
  assert.equal(num.length,52,context+' 52 authentic numerics');
  assert.equal(new Set(num.map(c=>c.id)).size,52,context+' no numeric duplication');
  assert.equal(side.numeric.hand.length,7,context+' 7 numeric hand');
  const special=[...side.special.hand,...side.special.deck,...side.special.discard];
  assert.equal(special.length,24,context+' 24 authentic specials');
  assert.equal(new Set(special.map(c=>c.id)).size,24,context+' no special duplication');
  assert.equal(side.special.hand.length,5,context+' 5 special hand');
 }
}
test('Completamento cataloghi: dodici boss, dodici mazzi e tutte 23 passive ai tre gradi originali',()=>{
 assert.equal(keys.length,12);
 assert.equal(NUMERIC_IDS.length,12);
 let total=0;
 for(const [id,deck] of Object.entries(BOSS_NUMERIC_DECKS)){
  total+=deck.abilities.length;
  assert.equal(tacticalBossDeckReady(id),true,id);
  for(const lv of [1,Math.min(3,deck.maxLevel),deck.maxLevel]){
   const abilities=activeNumericBossAbilities(id,lv);
   assert.equal(abilities.length,deck.abilities.length,id);
   assert.ok(abilities.every(a=>a.grade>=0&&a.grade<=3),id);
  }
 }
 assert.equal(total,23);
 assert.ok(keys.every(exclusiveBossReady));
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:10,bossSectorLevel:10}).enabled,true,
  'The real Terra boss sector now uses the validated simultaneous engine with its original numeric deck');
});

test('Stress: ogni boss combatte realmente 5 cicli contro navi L1/L3/L5 e tutte le risorse restano coerenti',()=>{
 for(const id of keys)for(const [shipA,shipB,level] of [['C01','C02',1],['R04','E01',3],['L03','R03',5]]){
  const b=createTacticalDuel({shipA,shipB,levelA:level,levelB:level,
   seed:183+id,nowMs:0,bossPlanetB:id,
   specialDeckB:buildTacticalBossDeck(id,level,level)});
  assert.equal(b.sides.B.bossExclusive.id,id);
  let state=b;
  for(let n=0;n<5;n++){
   assertConsistent(state,id+' '+shipA+' pre round '+state.round);
   if(state.phase==='finished')break;
   const at=state.deadlineMs-30000+1;
   const a=planTacticalAi(state,'A'),enemy=planTacticalAi(state,'B');
   assert.ok(a&&enemy,id+' AI orders');
   const aa=sealTacticalOrder(state,'A',a,at);
   assert.equal(aa.ok,true,id+' player '+aa.reason);
   const bb=sealTacticalOrder(aa.battle,'B',enemy,at+1);
   assert.equal(bb.ok,true,id+' boss '+bb.reason);
   const battle=advanceTacticalDuel(bb.battle,at+1);
   assert.equal(battle.phase,'resolving');
   assertConsistent(battle,id+' '+shipA+' after '+battle.round);
   state=advanceTacticalDuel(battle,battle.resolveUntilMs);
  }
 }
});

test('Con mazzi numerici a livello massimo ogni abilita sbloccata convive con le 7 numeriche/5 speciali',()=>{
 for(const [id,deck] of Object.entries(BOSS_NUMERIC_DECKS)){
  const game=createTacticalDuel({shipA:'R04',levelA:5,shipB:'C02',levelB:3,
   bossNumericDeckA:{id,level:deck.maxLevel},seed:44});
  assert.equal(game.sides.A.bossNumericDeck.id,id);
  assert.equal(game.sides.A.bossNumericDeck.level,deck.maxLevel);
  assert.ok(activeNumericBossAbilities(id,deck.maxLevel).every(a=>a.grade===3));
  assertConsistent(game,id+' equipped');
  const order=planTacticalAi(game,'A');
  const committed=sealTacticalOrder(game,'A',order,1);
  assert.equal(committed.ok,true,id+' valid with inventory and real escort armory');
 }
});
