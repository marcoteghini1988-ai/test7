import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const shipCollection={cards:[{instanceId:'ship:N00',shipId:'N00',level:1}],
 loadout:['ship:N00']};
const setup={mode:'campaign',sectorNumber:1,shipCollection,
 specialCollection:createSpecialCollection(),seed:41,nowMs:0};
const chrono=level=>officialBattleSetup({...setup,
 selectedBossDeck:'planet_char_6',
 bossDeckInventory:{planet_char_6:{unlocked:true,level}}}).battle;
function cycle(b,time=101,byB={specialIndices:[],numericIndices:[]}){
 const a=sealTacticalOrder(b,'A',{specialIndices:[],numericIndices:[]},time);
 assert.equal(a.ok,true);
 const bb=sealTacticalOrder(a.battle,'B',byB,time+1);
 assert.equal(bb.ok,true);
 return advanceTacticalDuel(bb.battle,time+1);
}
const enemyHit=resolved=>resolved.history.at(-1).impacts.find(x=>
 x.kind==='barrier'&&x.by==='B');

test('Crono L1-L3 posseduto attiva la difesa sul primo colpo e non concede carte',()=>{
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_6',bossDeckInventory:{planet_char_6:{unlocked:true,level:1}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_6',bossDeckInventory:{}}).enabled,false);
 const plain=cycle(officialBattleSetup(setup).battle);
 const baseline=enemyHit(plain).damage;
 assert.ok(baseline>0);
 for(const level of [1,2,3]){
  const game=chrono(level);
  const start=game.sides.A.defense.shield;
  assert.equal(start.hp,60);
  assert.equal(start.max,60);
  const result=cycle(game);
  const pct=activeNumericBossAbilities('planet_char_6',level)[0].value;
  assert.equal(enemyHit(result).damage,Math.floor(baseline*(1-pct/100)));
  assert.equal(result.sides.A.bossNumericDeck.firstHitUsed,true);
  assert.ok(result.lastEvents.some(event=>event.includes('Primo anello')));
  assert.equal(result.sides.A.special.hand.length,5);
 }
});

test('Crono: riduzione consumata solo al primo danno reale alla madre',()=>{
 const original=chrono(3);
 const reduced=cycle(original);
 const plain=cycle(officialBattleSetup(setup).battle);
 const advance=r=>advanceTacticalDuel(r,r.resolveUntilMs);
 const reduced2=cycle(advance(reduced),reduced.resolveUntilMs+1);
 const plain2=cycle(advance(plain),plain.resolveUntilMs+1);
 assert.equal(enemyHit(reduced2).damage,enemyHit(plain2).damage);
 assert.equal(reduced2.sides.A.bossNumericDeck.firstHitUsed,true);
 assert.equal(original.sides.A.bossNumericDeck.firstHitUsed,false);
});

test('Crono: primo colpo può essere ai vitali se la barriera è già a zero',()=>{
 const plain=createTacticalDuel({shipA:'N00',shipB:'R04',levelA:1,levelB:1,
  nowMs:0,seed:18});
 const boss=createTacticalDuel({shipA:'N00',shipB:'R04',levelA:1,levelB:1,
  nowMs:0,seed:18,bossNumericDeckA:{id:'planet_char_6',level:3}});
 function exhaustedShield(x){
  return {...x,sides:{...x.sides,A:{...x.sides.A,
   defense:{...x.sides.A.defense,
    shield:{...x.sides.A.defense.shield,hp:0}}}}};
 }
 const attack={specialIndices:[],numericIndices:[1,3],vitalId:'engine',op:'plus'};
 const result=cycle(exhaustedShield(boss),101,attack);
 const baseline=cycle(exhaustedShield(plain),101,attack);
 const precision=r=>r.history.at(-1).impacts.find(x=>x.kind==='precision'&&x.by==='B');
 assert.equal(precision(baseline).damage,6);
 assert.equal(precision(result).damage,4);
 assert.equal(result.sides.A.bossNumericDeck.firstHitUsed,true);
});

test('Crono non consuma la passiva se il colpo non causa danno',()=>{
 const game=chrono(3);
 const muted={...game,sides:{...game.sides,B:{...game.sides.B,weapons:[]}}};
 const result=cycle(muted);
 assert.equal(enemyHit(result).damage,0);
 assert.equal(result.sides.A.bossNumericDeck.firstHitUsed,false);
});
