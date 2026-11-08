import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,tacticalLeviatanoBonus,
 rememberTacticalLeviatanoHit,rememberTacticalLeviatanoRecycle} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const collection={cards:[{instanceId:'ship:N00',shipId:'N00',level:3}],loadout:['ship:N00']};
const special=createSpecialCollection();
const official=level=>officialBattleSetup({
 mode:'campaign',sectorNumber:1,shipCollection:collection,specialCollection:special,
 nowMs:0,seed:18,selectedBossDeck:'planet_char_8',
 bossDeckInventory:{planet_char_8:{unlocked:true,level}}
}).battle;
const fresh=(level=null)=>createTacticalDuel({shipA:'C01',shipB:'C02',levelA:3,levelB:3,
 nowMs:0,seed:18,...(level?{bossNumericDeckA:{id:'planet_char_8',level}}:{})});
const order=(p={})=>({specialIndices:[],numericIndices:[],exchangeIndices:[],...p});
const attack=order({numericIndices:[0,1,2],vitalId:'engine',op:'plus'});
function placeThreeRealCards(b){
 const pile=b.sides.A.numeric;
 const all=[...pile.hand,...pile.deck,...pile.discard];
 const ids=[2,4,5].map((value,i)=>all.find(card=>card.value===value&&
  card.suit===['♠','♥','♣'][i]));
 assert.ok(ids.every(Boolean));
 const taken=new Set(ids.map(card=>card.id));
 const remaining=all.filter(card=>!taken.has(card.id));
 pile.hand=[...ids,...remaining.slice(0,4)];
 pile.deck=remaining.slice(4);
 pile.discard=[];
 assert.equal(new Set([...pile.hand,...pile.deck].map(card=>card.id)).size,52);
 return b;
}
function exposed(b){
 b.sides.B.defense.shield.hp=0;
 b.sides.B.defense.parts.engine.max=20;
 b.sides.B.defense.parts.engine.hp=20;
 return b;
}
function commit(b,a=order(),enemy=order(),at=101){
 const first=sealTacticalOrder(b,'A',a,at);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',enemy,at+1);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,at+1);
}
const precision=r=>r.history.at(-1).impacts.find(x=>x.kind==='precision'&&x.by==='A');

test('Leviatano: due passive reali L1-L6; il mazzo non si crea se bloccato',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_8'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_8',
  bossDeckInventory:{planet_char_8:{unlocked:true,level:6}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_8',bossDeckInventory:{}}).enabled,false);
 for(let level=1;level<=6;level++){
  const b=official(level);
  assert.equal(b.sides.A.bossNumericDeck.level,level);
  assert.deepEqual(activeNumericBossAbilities('planet_char_8',level).map(x=>x.value),
   [[4,null],[6,null],[8,null],[8,3],[8,5],[8,7]][level-1]);
  assert.equal(b.sides.A.numeric.hand.length,7);
  assert.equal(b.sides.A.special.hand.length,5);
  assert.equal(b.sides.A.bossNumericDeck.recyclePending,false);
 }
 assert.throws(()=>officialBattleSetup({
  mode:'campaign',sectorNumber:1,shipCollection:collection,specialCollection:special,
  selectedBossDeck:'planet_char_8',
  bossDeckInventory:{planet_char_8:{unlocked:false,level:6}}
 }),/Mazzo boss non sbloccato/);
});

test('Profondita tattica si attiva solo da L4 con tre CARTE numeriche e formula esatta',()=>{
 for(const level of [1,2,3,4,5,6]){
  const b=placeThreeRealCards(fresh(level));
  const bonus=tacticalLeviatanoBonus(b.sides.A,b.sides.B,attack,50);
  const percentage=[0,0,0,3,5,7][level-1];
  assert.equal(bonus.percentage,percentage);
  assert.equal(bonus.active,level>=4);
  assert.equal(bonus.extra,Math.floor(50*percentage/100));
  assert.equal(tacticalLeviatanoBonus(b.sides.A,b.sides.B,
   {...attack,op:'times'},50).active,false);
  assert.equal(tacticalLeviatanoBonus(b.sides.A,b.sides.B,
   {...attack,numericIndices:[0,1]},50).active,false);
 }
});

test('Marea del riciclo non si attiva con uno scarto normale o con un danno nullo',()=>{
 const b=fresh(3),side=b.sides.A;
 rememberTacticalLeviatanoRecycle(side,side.numeric,1);
 assert.equal(side.bossNumericDeck.recyclePending,false);
 const before={...side.numeric,deck:[],discard:side.numeric.deck};
 rememberTacticalLeviatanoRecycle(side,before,1);
 assert.equal(side.bossNumericDeck.recyclePending,true);
 const bonus=tacticalLeviatanoBonus(side,b.sides.B,order(),30);
 assert.equal(bonus.active,false);
 rememberTacticalLeviatanoHit(side,0,{active:true,spendsRecycle:true,remainder:50});
 assert.equal(side.bossNumericDeck.recyclePending,true);
});

test('Riciclo di 52 carte: la protezione del bonus compare SOLO nel ciclo seguente',()=>{
 const b=placeThreeRealCards(fresh(3));
 b.sides.A.numeric.discard=b.sides.A.numeric.deck;
 b.sides.A.numeric.deck=[];
 const first=commit(b,order({exchangeIndices:[6]}));
 assert.equal(first.sides.A.bossNumericDeck.recyclePending,true);
 assert.equal(first.sides.A.numeric.hand.length,7);
 assert.equal(new Set([
  ...first.sides.A.numeric.hand,...first.sides.A.numeric.deck,
  ...first.sides.A.numeric.discard].map(c=>c.id)).size,52);
 const next=advanceTacticalDuel(first,first.resolveUntilMs);
 next.sides.B.defense.shield.hp=0;
 next.sides.B.defense.parts.engine.hp=20;
 next.sides.B.defense.parts.engine.max=20;
 const out=commit(next,attack,order(),next.deadlineMs-2000);
 assert.equal(precision(out).damage,8);
 assert.equal(out.sides.A.bossNumericDeck.recyclePending,false);
 assert.ok(out.lastEvents.some(x=>x.includes('Marea del riciclo')));
});

test('Riciclo e tripla L6 si sommano solo su un colpo reale (8% + 7%)',()=>{
 const boss=exposed(placeThreeRealCards(fresh(6)));
 boss.sides.A.bossNumericDeck.recyclePending=true;
 const normal=exposed(placeThreeRealCards(fresh()));
 const x=commit(boss,attack),y=commit(normal,attack);
 assert.equal(precision(y).damage,8);
 assert.equal(precision(x).damage,9);
 assert.equal(x.sides.A.bossNumericDeck.recyclePending,false);
 assert.equal(x.sides.A.bossNumericDeck.leviatanoRemainder,20);
 assert.ok(x.lastEvents.some(e=>e.includes('Marea del riciclo')&&e.includes('Profondità tattica')));
});

test('Contromisura reale non consuma il bonus del prossimo colpo',()=>{
 const boss=exposed(placeThreeRealCards(fresh(6)));
 boss.sides.A.bossNumericDeck.recyclePending=true;
 const counter=order({specialIndices:[3],counterVitalId:'engine'});
 const out=commit(boss,attack,counter);
 assert.equal(precision(out).reason,'countered');
 assert.equal(out.sides.A.bossNumericDeck.recyclePending,true);
 assert.equal(out.sides.A.bossNumericDeck.leviatanoRemainder,0);
});
