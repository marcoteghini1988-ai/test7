import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,tacticalBossVitalBonus,
 rememberTacticalBossVitalHit} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const owned={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],loadout:['ship:N00']};
const special=createSpecialCollection();
const tharsis=level=>officialBattleSetup({mode:'campaign',sectorNumber:1,
 shipCollection:owned,specialCollection:special,seed:18,nowMs:0,
 selectedBossDeck:'planet_char_2',
 bossDeckInventory:{planet_char_2:{unlocked:true,level}}}).battle;
const makeOrder=(a={})=>({numericIndices:[],specialIndices:[],exchangeIndices:[],...a});
function play(b,attack,enemy=makeOrder()){
 const first=sealTacticalOrder(b,'A',attack,100);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',enemy,101);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,101);
}
const precision=b=>b.history.at(-1).impacts.find(x=>x.kind==='precision'&&x.by==='A');
function exposed(b){
 const next=structuredClone(b);
 next.sides.B.defense.shield.hp=0;
 next.sides.B.defense.parts.weapons.max=20;
 next.sides.B.defense.parts.weapons.hp=20;
 return next;
}

test('Tharsis L1-3: 3/5/7% senza carte extra e con inventario verificato',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_2'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_2',
  bossDeckInventory:{planet_char_2:{unlocked:true,level:2}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_2',bossDeckInventory:{}}).enabled,false);
 const plain=officialBattleSetup({mode:'campaign',sectorNumber:1,
  shipCollection:owned,specialCollection:special,seed:18,nowMs:0}).battle;
 for(const level of [1,2,3]){
  const b=tharsis(level);
  assert.equal(activeNumericBossAbilities('planet_char_2',level)[0].value,
   [3,5,7][level-1]);
  assert.equal(b.sides.A.bossNumericDeck.level,level);
  assert.deepEqual(b.sides.A.defense,plain.sides.A.defense);
  assert.deepEqual(b.sides.A.special,plain.sides.A.special);
 }
});

test('solo colpo reale al medesimo vitale alimenta il bonus e conserva i centesimi',()=>{
 for(const level of [1,2,3]){
  const side=tharsis(level).sides.A;
  const noHistory=tacticalBossVitalBonus(side,'weapons',10);
  assert.equal(noHistory.active,false);
  rememberTacticalBossVitalHit(side,'weapons',0,noHistory);
  assert.equal(side.bossNumericDeck.lastVital,null);
  rememberTacticalBossVitalHit(side,'weapons',10,noHistory);
  assert.equal(side.bossNumericDeck.lastVital,'weapons');
  let aggregate=0;
  const percentage=[3,5,7][level-1];
  for(let i=0;i<8;i++){
   const bonus=tacticalBossVitalBonus(side,'weapons',10);
   assert.equal(bonus.active,true);
   aggregate+=bonus.extra;
   rememberTacticalBossVitalHit(side,'weapons',10,bonus);
  }
  assert.equal(aggregate,Math.floor(8*10*percentage/100));
  assert.equal(side.bossNumericDeck.vitalBonusRemainder,8*10*percentage%100);
  const newTarget=tacticalBossVitalBonus(side,'engine',10);
  assert.equal(newTarget.active,false);
  rememberTacticalBossVitalHit(side,'engine',10,newTarget);
  assert.equal(side.bossNumericDeck.lastVital,'engine');
  assert.equal(side.bossNumericDeck.vitalBonusRemainder,0);
 }
});

test('nella risoluzione 30+8 Tharsis aggiunge HP solo al vitale colpito',()=>{
 const plain=exposed(createTacticalDuel({shipA:'C01',shipB:'R04',nowMs:0,seed:18}));
 const boss=exposed(createTacticalDuel({shipA:'C01',shipB:'R04',
  nowMs:0,seed:18,bossNumericDeckA:{id:'planet_char_2',level:3}}));
 boss.sides.A.bossNumericDeck.lastVital='weapons';
 boss.sides.A.bossNumericDeck.vitalBonusRemainder=95;
 const order=makeOrder({numericIndices:[3,2],vitalId:'weapons',op:'minus'});
 const normal=play(plain,order),boosted=play(boss,order);
 assert.equal(precision(normal).reason,'hit');
 assert.equal(precision(normal).damage,6);
 assert.equal(precision(boosted).damage,7);
 assert.equal(boosted.sides.A.bossNumericDeck.vitalBonusRemainder,37);
 assert.ok(boosted.lastEvents.some(e=>e.includes('Pressione marziana')));
 assert.equal(boosted.phase,'resolving');
 assert.deepEqual(plain.sides.B.defense.parts.weapons.hp,20);
});

test('formula errata e contromisura non consumano bonus né memoria',()=>{
 const init=exposed(createTacticalDuel({shipA:'C01',shipB:'R04',
  nowMs:0,seed:18,bossNumericDeckA:{id:'planet_char_2',level:3}}));
 init.sides.A.bossNumericDeck.lastVital='weapons';
 init.sides.A.bossNumericDeck.vitalBonusRemainder=95;
 const wrong=play(init,makeOrder({numericIndices:[0,1],vitalId:'weapons',op:'minus'}));
 assert.equal(precision(wrong).reason,'invalid_signature');
 assert.equal(wrong.sides.A.bossNumericDeck.vitalBonusRemainder,95);
 const counter=play(init,makeOrder({numericIndices:[3,2],vitalId:'weapons',op:'minus'}),
  makeOrder({specialIndices:[3],counterVitalId:'weapons'}));
 assert.equal(precision(counter).reason,'countered');
 assert.equal(counter.sides.A.bossNumericDeck.vitalBonusRemainder,95);
});
