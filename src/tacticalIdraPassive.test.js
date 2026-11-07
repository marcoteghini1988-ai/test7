import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,tacticalIdraBonus,rememberTacticalIdraHit} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const inventory={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],loadout:['ship:N00']};
const special=createSpecialCollection();
const official=level=>officialBattleSetup({
 mode:'campaign',sectorNumber:1,seed:18,nowMs:0,
 shipCollection:inventory,specialCollection:special,selectedBossDeck:'planet_char_11',
 bossDeckInventory:{planet_char_11:{unlocked:true,level}}
}).battle;
const fresh=(level=null)=>createTacticalDuel({shipA:'C01',shipB:'C02',levelA:3,levelB:3,
 seed:18,nowMs:0,...(level?{bossNumericDeckA:{id:'planet_char_11',level}}:{})});
const order=(p={})=>({specialIndices:[],numericIndices:[],exchangeIndices:[],...p});
const divide=order({numericIndices:[3,1],vitalId:'weapons',op:'divide'}); // 8/4 = 2 (C02)
const plus=order({numericIndices:[3,0],vitalId:'engine',op:'plus'}); // 8+3 = 11 (C02)
const empty=order();
function play(b,plan=empty,enemy=empty){
 const a=sealTacticalOrder(b,'A',plan,100);
 assert.equal(a.ok,true,a.reason);
 const bb=sealTacticalOrder(a.battle,'B',enemy,101);
 assert.equal(bb.ok,true,bb.reason);
 return advanceTacticalDuel(bb.battle,101);
}
const impact=(b,kind,by='A')=>b.history.at(-1).impacts.find(x=>x.kind===kind&&x.by===by);

test('Idra L1..L6: 2 passive, gradi da 3+3, inventario reale e nessuna carta gratuita',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_11'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_11',
  bossDeckInventory:{planet_char_11:{unlocked:true,level:4}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_11',bossDeckInventory:{}}).enabled,false);
 for(let level=1;level<=6;level++){
  const game=official(level);
  const selected=activeNumericBossAbilities('planet_char_11',level);
  assert.deepEqual(selected.map(x=>x.value),
   [[3,null],[5,null],[7,null],[7,4],[7,6],[7,8]][level-1]);
  assert.equal(game.sides.A.bossNumericDeck.level,level);
  assert.equal(game.sides.A.special.hand.length,5);
  assert.equal(game.sides.A.numeric.hand.length,7);
 }
 assert.throws(()=>officialBattleSetup({
  mode:'campaign',sectorNumber:1,shipCollection:inventory,specialCollection:special,
  selectedBossDeck:'planet_char_11',
  bossDeckInventory:{planet_char_11:{unlocked:false,level:6}}
 }),/Mazzo boss non sbloccato/);
});

test('Precisione criogenica: solo divisione 8/4=2 nella firma C02, non formule invalide',()=>{
 for(const level of [1,2,3,4,5,6]){
  const b=fresh(level);
  const bonus=tacticalIdraBonus(b.sides.A,b.sides.B,divide,50);
  assert.equal(bonus.active,true);
  assert.equal(bonus.percentage,[3,5,7,7,7,7][level-1]);
  assert.equal(bonus.extra,Math.floor(50*bonus.percentage/100));
  assert.equal(tacticalIdraBonus(b.sides.A,b.sides.B,
   {...divide,op:'minus'},50).active,false);
  assert.equal(tacticalIdraBonus(b.sides.A,b.sides.B,
   {...divide,numericIndices:[1,0]},50).active,false);
  assert.equal(tacticalIdraBonus(b.sides.A,b.sides.B,plus,50).active,false);
 }
});

test('Teste alternate: dopo un VERO impatto si attiva su un vitale diverso, dal grado 4',()=>{
 for(const level of [3,4,5,6]){
  const b=fresh(level);
  const side=b.sides.A;
  const first=tacticalIdraBonus(side,b.sides.B,divide,10,{vitalId:'weapons'});
  rememberTacticalIdraHit(side,0,first,{vitalId:'weapons'});
  assert.equal(side.bossNumericDeck.lastVital,null);
  rememberTacticalIdraHit(side,10,first,{vitalId:'weapons'});
  assert.equal(side.bossNumericDeck.lastVital,'weapons');
  const alternating=tacticalIdraBonus(side,b.sides.B,plus,20,{vitalId:'engine'});
  assert.equal(alternating.percentage,[0,4,6,8][level-3]);
  assert.equal(alternating.active,level>=4);
  rememberTacticalIdraHit(side,10,alternating,{vitalId:'engine'});
  assert.equal(side.bossNumericDeck.lastVital,'engine');
  assert.equal(tacticalIdraBonus(side,b.sides.B,plus,20,{vitalId:'engine'}).active,false);
 }
});

test('I bonus Idra mantengono il resto centesimale e non consumano carte extra',()=>{
 const battle=fresh(6),side=battle.sides.A;
 side.bossNumericDeck.lastVital='engine';
 const all=[...side.special.hand,...side.special.deck].map(c=>c.id);
 let total=0;
 for(let i=0;i<10;i++){
  const b=tacticalIdraBonus(side,battle.sides.B,divide,10,{vitalId:'weapons'});
  total+=b.extra;
  rememberTacticalIdraHit(side,10,b,{vitalId:'weapons'});
 }
 assert.equal(total,Math.floor((15+7*9)*10/100));
 assert.equal(side.bossNumericDeck.idraVitalRemainder,(15+7*9)*10%100);
 assert.deepEqual([...side.special.hand,...side.special.deck].map(c=>c.id),all);
});

test('Il vero motore 30+8 applica il bonus al fuoco nativo solo con divisione valida',()=>{
 const baseline=play(fresh(),divide);
 const boosted=play(fresh(3),divide);
 const a=impact(baseline,'barrier'),b=impact(boosted,'barrier');
 const percent=7;
 assert.equal(b.packet-a.packet,Math.floor(a.packet*percent/100));
 assert.equal(boosted.phase,'resolving');
 assert.ok(boosted.lastEvents.some(event=>event.includes('Precisione criogenica')));
 const invalid=play(fresh(3),{...divide,op:'plus'});
 assert.equal(impact(invalid,'barrier').packet,a.packet);
 assert.equal(invalid.sides.A.bossNumericDeck.idraBarrierRemainder,0);
});

test('Il vero colpo a un vitale diverso riceve Teste alternate solo se valido',()=>{
 const b=fresh(6);
 const normal=fresh();
 for(const game of [b,normal]){
  game.sides.B.defense.shield.hp=0;
  game.sides.B.defense.parts.engine.hp=20;
  game.sides.B.defense.parts.engine.max=20;
 }
 b.sides.A.bossNumericDeck.lastVital='weapons';
 b.sides.A.bossNumericDeck.idraVitalRemainder=95;
 const boosted=play(b,plus),baseline=play(normal,plus);
 const a=impact(baseline,'precision'),v=impact(boosted,'precision');
 assert.equal(a.damage,10);
 assert.equal(v.damage,11);
 assert.equal(boosted.sides.A.bossNumericDeck.lastVital,'engine');
 assert.ok(boosted.lastEvents.some(event=>event.includes('Teste alternate')));
 assert.equal(b.sides.A.bossNumericDeck.lastVital,'weapons');
});

test('Su danno nullo o formula errata la memoria del vitali non avanza',()=>{
 const b=fresh(6);
 b.sides.A.bossNumericDeck.lastVital='engine';
 b.sides.A.bossNumericDeck.idraBarrierRemainder=79;
 b.sides.A.bossNumericDeck.idraVitalRemainder=89;
 const wrong=play(b,{...divide,op:'times'});
 assert.equal(wrong.sides.A.bossNumericDeck.lastVital,'engine');
 assert.equal(wrong.sides.A.bossNumericDeck.idraBarrierRemainder,79);
 assert.equal(wrong.sides.A.bossNumericDeck.idraVitalRemainder,89);
});
