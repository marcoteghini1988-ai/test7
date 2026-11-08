import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,tacticalBossConditionSnapshot,tacticalBossOutgoingBonus,
 rememberTacticalBossOutgoingHit} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const owned={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],loadout:['ship:N00']};
const special=createSpecialCollection();
const baseOpts={mode:'campaign',sectorNumber:1,shipCollection:owned,specialCollection:special,nowMs:0,seed:18};
const makeOrder=(other={})=>({specialIndices:[],numericIndices:[],exchangeIndices:[],...other});
function cycle(b,orderA=makeOrder(),orderB=makeOrder()){
 const a=sealTacticalOrder(b,'A',orderA,100);
 assert.equal(a.ok,true,a.reason);
 const bb=sealTacticalOrder(a.battle,'B',orderB,101);
 assert.equal(bb.ok,true,bb.reason);
 return advanceTacticalDuel(bb.battle,101);
}
const shot=(b,kind,by)=>b.history.at(-1).impacts.find(x=>x.kind===kind&&x.by===by);

test('Ombre: due passive su sei livelli, nessuna concessione senza possesso',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_9'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_9',
  bossDeckInventory:{planet_char_9:{unlocked:true,level:6}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_9',bossDeckInventory:{}}).enabled,false);
 for(const level of [1,2,3,4,5,6]){
  const b=officialBattleSetup({...baseOpts,
   selectedBossDeck:'planet_char_9',bossDeckInventory:{planet_char_9:{unlocked:true,level}}}).battle;
  assert.equal(b.sides.A.bossNumericDeck.level,level);
  assert.equal(b.sides.A.special.hand.length,5);
  assert.equal(b.sides.A.defense.shield.max,60);
  assert.deepEqual(activeNumericBossAbilities('planet_char_9',level).map(a=>a.value),
   [[5,null],[8,null],[11,null],[11,4],[11,6],[11,8]][level-1]);
 }
 assert.throws(()=>officialBattleSetup({...baseOpts,selectedBossDeck:'planet_char_9',
  bossDeckInventory:{planet_char_9:{unlocked:false,level:6}}}),/non sbloccato/);
});

test('Potenza disperata: solo scudo iniziale al 35% o meno, resto senza arrotondamenti gratuiti',()=>{
 for(const level of [1,2,3]){
  const s=createTacticalDuel({bossNumericDeckA:{id:'planet_char_9',level}}).sides.A;
  assert.equal(tacticalBossConditionSnapshot(s).lowShield,false);
  assert.equal(tacticalBossOutgoingBonus(s,30).active,false);
  s.defense.shield.hp=21;
  const fixed=tacticalBossConditionSnapshot(s);
  assert.equal(fixed.lowShield,true);
  const expected=[5,8,11][level-1];
  const bonus=tacticalBossOutgoingBonus(s,30,{snapshot:fixed});
  assert.equal(bonus.percentage,expected);
  assert.equal(bonus.extra,Math.floor(30*expected/100));
  const saved=s.bossNumericDeck.outgoingBonusRemainder;
  rememberTacticalBossOutgoingHit(s,0,bonus);
  assert.equal(s.bossNumericDeck.outgoingBonusRemainder,saved);
  rememberTacticalBossOutgoingHit(s,10,bonus);
  assert.equal(s.bossNumericDeck.outgoingBonusRemainder,30*expected%100);
  s.defense.shield.hp=22;
  assert.equal(tacticalBossOutgoingBonus(s,30).active,false);
 }
});

test('Oscurita terminale: due vitali KO, solo danni ai vitali, dopo sblocco L4',()=>{
 for(const level of [3,4,5,6]){
  const side=createTacticalDuel({bossNumericDeckA:{id:'planet_char_9',level}}).sides.A;
  side.defense.parts.engine.hp=0;
  side.defense.parts.weapons.hp=0;
  const snapshot=tacticalBossConditionSnapshot(side);
  assert.equal(snapshot.lowShield,false);
  assert.equal(snapshot.destroyedVitals,2);
  assert.equal(tacticalBossOutgoingBonus(side,10,{snapshot}).active,false);
  const bonus=tacticalBossOutgoingBonus(side,10,{vitalId:'weapons',snapshot});
  assert.equal(bonus.percentage,[0,4,6,8][level-3]);
  if(level===3)assert.equal(bonus.active,false);
  else assert.deepEqual(bonus.abilities,['Oscurità terminale']);
  side.defense.parts.weapons.hp=1;
  assert.equal(tacticalBossOutgoingBonus(side,10,{vitalId:'weapons'}).active,false);
 }
});

test('due passive si sommano soltanto con entrambi i requisiti reali',()=>{
 const side=createTacticalDuel({bossNumericDeckA:{id:'planet_char_9',level:6}}).sides.A;
 side.defense.shield.hp=20;
 side.defense.parts.engine.hp=0;
 side.defense.parts.weapons.hp=0;
 const snapshot=tacticalBossConditionSnapshot(side);
 const barrier=tacticalBossOutgoingBonus(side,40,{snapshot});
 const vital=tacticalBossOutgoingBonus(side,10,{vitalId:'weapons',snapshot});
 assert.equal(barrier.percentage,11);
 assert.equal(vital.percentage,19);
 assert.deepEqual(vital.abilities,['Potenza disperata','Oscurità terminale']);
 assert.equal(vital.extra,1);
});

test('la barriera del duello ufficiale riceve il bonus solo da scudo critico',()=>{
 function start(boss){
  const battle=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:3,levelB:3,
   nowMs:0,seed:18,...(boss?{bossNumericDeckA:{id:'planet_char_9',level:3}}:{})});
  battle.sides.A.defense.shield.hp=20;
  return cycle(battle);
 }
 const standard=start(false),boss=start(true);
 const a=shot(standard,'barrier','A'),b=shot(boss,'barrier','A');
 assert.ok(a.packet>0);
 assert.equal(b.packet-a.packet,Math.floor(a.packet*.11));
 assert.equal(boss.sides.A.bossNumericDeck.outgoingBonusRemainder,
  (a.packet*11)%100);
 assert.ok(boss.lastEvents.some(x=>x.includes('Potenza disperata')));
});

test('lo snapshot impedisce di attivare una passiva a meta di una stessa risoluzione',()=>{
 const battle=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:1,levelB:1,
  nowMs:0,seed:18,bossNumericDeckA:{id:'planet_char_9',level:6}});
 battle.sides.A.defense.shield.hp=30; // >35% prima del ciclo
 battle.sides.B.defense.shield.hp=0;
 battle.sides.B.defense.parts.weapons.hp=20;
 battle.sides.B.defense.parts.weapons.max=20;
 const out=cycle(battle,makeOrder({numericIndices:[3,2],vitalId:'weapons',op:'minus'}));
 assert.ok(out.sides.A.defense.shield.hp<=21);
 assert.equal(shot(out,'precision','A').damage,6);
 assert.equal(out.sides.A.bossNumericDeck.outgoingBonusRemainder,0);
 assert.ok(!out.lastEvents.some(line=>line.includes('Potenza disperata')));
});
