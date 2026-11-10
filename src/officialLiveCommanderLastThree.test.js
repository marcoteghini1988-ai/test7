import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction} from './officialLiveDuelEngine.js';
import {liveCommanderRememberVitalDeposit,liveCommanderArmFormula,
 liveCommanderRememberEscortImpact,liveCommanderNativeBonus,
 liveCommanderAfterNativeShot} from './officialLiveCommanderAttack.js';

const create=(id,escortLevel=1)=>createOfficialLiveDuel(createTacticalDuel({
 shipA:'C01',shipB:'N00',levelA:1,levelB:escortLevel,
 commanderA:{id,level:5},nowMs:0}),0);
function arrange(b,desired){
 const pile=b.sides.A.numeric;
 const source=[...pile.hand,...pile.deck,...pile.discard];
 const picked=desired.map(({value,suit})=>{
  const c=source.find(x=>x.value===value&&x.suit===suit);
  assert.ok(c,'numerica presente nella dotazione reale '+value+suit);
  return c;
 });
 const chosenIds=new Set(picked.map(c=>c.id));
 assert.equal(chosenIds.size,picked.length);
 const newHand=[...picked,...source.filter(c=>!chosenIds.has(c.id)).slice(0,7-picked.length)];
 const handIds=new Set(newHand.map(c=>c.id));
 pile.hand=newHand;
 pile.deck=source.filter(c=>!handIds.has(c.id));
 pile.discard=[];
 assert.equal(pile.hand.length+pile.deck.length,52);
 return picked;
}
function move(b,side,action,time){
 const result=applyOfficialLiveAction(b,side,action,time);
 assert.equal(result.ok,true,JSON.stringify({side,action,reason:result.reason}));
 return result.battle;
}
const card=(value,suit)=>({value,suit});
test('Colosso di Tharsis: no bonus da due carte nello stesso turno o senza formula vera',()=>{
 const b=create('pilot_boss_2'),a=b.sides.A,z=b.sides.B;
 z.defense.parts.engine.signature={kind:'mathGate',op:'plus',target:9,allowedCardCounts:[2,3]};
 liveCommanderRememberVitalDeposit(a,{vitalId:'engine',turn:1});
 liveCommanderRememberVitalDeposit(a,{vitalId:'engine',turn:1});
 assert.equal(liveCommanderArmFormula(a,z,{vitalId:'engine',op:'plus',
  cards:[card(4,'♥'),card(5,'♣')],damage:10,turn:1}),false);
 liveCommanderRememberVitalDeposit(a,{vitalId:'engine',turn:3});
 assert.equal(liveCommanderArmFormula(a,z,{vitalId:'engine',op:'plus',
  cards:[card(4,'♥'),card(5,'♣')],damage:0,turn:3}),false);
 assert.equal(liveCommanderArmFormula(a,z,{vitalId:'engine',op:'plus',
  cards:[card(4,'♥'),card(5,'♣')],damage:10,turn:3}),true);
 assert.equal(a.commander.liveFormulaBonus.percentage,7);
});
test('Colosso di Tharsis: 2 turni consecutivi sullo stesso vitale, poi sparo nativo autentico',()=>{
 let b=create('pilot_boss_2');
 arrange(b,[card(4,'♥'),card(5,'♣'),card(13,'♥')]);
 b.sides.B.defense.shield.hp=45;
 b=move(b,'A',{type:'expose',vitalId:'engine'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 assert.equal(b.sides.A.commander.liveVitalDeposit.count,1);
 b=move(b,'A',{type:'end'},3);
 b=move(b,'B',{type:'end'},4);
 const second=b.sides.A.numeric.hand.findIndex(c=>c.value===5&&c.suit==='♣');
 b=move(b,'A',{type:'numeric',index:second,target:'vital',vitalId:'engine'},5);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.A.commander.liveFormulaBonus?.percentage,7);
 const shoot=b.sides.A.numeric.hand.findIndex(c=>c.value===13&&c.suit==='♥');
 b=move(b,'A',{type:'numeric',index:shoot,target:'ship',shipId:'mother'},6);
 assert.equal(b.history.findLast(e=>e.kind==='shot')?.damage,27);
 assert.equal(b.sides.A.commander.liveFormulaBonus,null);
 assert.equal(b.history.some(e=>e.kind==='pilot_bonus'&&e.trigger==='repeat_vital'),true);
});
test('Colosso di Tharsis: la sequenza si interrompe cambiando vitale o saltando un proprio turno',()=>{
 const a=create('pilot_boss_2').sides.A;
 liveCommanderRememberVitalDeposit(a,{vitalId:'engine',turn:1});
 assert.equal(liveCommanderRememberVitalDeposit(a,{vitalId:'weapons',turn:3}).consecutiveTurns,1);
 assert.equal(liveCommanderRememberVitalDeposit(a,{vitalId:'engine',turn:5}).consecutiveTurns,1);
 assert.equal(liveCommanderRememberVitalDeposit(a,{vitalId:'engine',turn:9}).consecutiveTurns,1);
});
test('Fissatore: la terza numerica vera sullo stesso vitale arma il bonus, non prima',()=>{
 let b=create('pilot_leg_3');
 arrange(b,[card(1,'♣'),card(3,'♥'),card(5,'♦'),card(13,'♥')]);
 b.sides.B.defense.shield.hp=45;
 b=move(b,'A',{type:'expose',vitalId:'engine'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},3);
 assert.equal(b.sides.A.commander.liveVitalDeposit.count,2);
 assert.equal(b.sides.A.commander.liveFormulaBonus,undefined);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},4);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.A.commander.liveFormulaBonus?.percentage,8);
 assert.equal(b.actionUsed.numeric,3);
 b=move(b,'A',{type:'end'},5);
 b=move(b,'B',{type:'end'},6);
 const shoot=b.sides.A.numeric.hand.findIndex(c=>c.value===13&&c.suit==='♥');
 b=move(b,'A',{type:'numeric',index:shoot,target:'ship',shipId:'mother'},7);
 assert.equal(b.history.findLast(e=>e.kind==='shot')?.damage,28);
 assert.equal(b.history.some(e=>e.kind==='pilot_bonus'&&e.trigger==='third_vital'),true);
});
test('Veggente: conta SOLO danni reali su scudiere diverse e non crea spari',()=>{
 const b=create('pilot_leg_2',5),a=b.sides.A,z=b.sides.B;
 assert.equal(liveCommanderRememberEscortImpact(a,{escortIndex:0,damage:0}),false);
 assert.equal(liveCommanderRememberEscortImpact(a,{escortIndex:0,damage:2}),false);
 assert.equal(liveCommanderRememberEscortImpact(a,{escortIndex:0,damage:2}),false);
 assert.equal(liveCommanderRememberEscortImpact(a,{escortIndex:1,damage:0}),false);
 assert.equal(liveCommanderRememberEscortImpact(a,{escortIndex:1,damage:2}),true);
 assert.equal(a.commander.liveFormulaBonus.percentage,8);
 const bonus=liveCommanderNativeBonus(a,z,50);
 assert.equal(bonus.active,true);
 assert.equal(bonus.damage,54);
 assert.equal(liveCommanderAfterNativeShot(a,0,bonus),false);
 assert.equal(a.commander.liveFormulaBonus.trigger,'alternate_escort');
 assert.equal(liveCommanderAfterNativeShot(a,10,bonus),true);
 assert.equal(a.commander.liveFormulaBonus,null);
});
test('Veggente: il soppressore permette di cambiare la scudiera realmente colpita',()=>{
 let b=create('pilot_leg_2',5);
 arrange(b,[card(5,'♥'),card(8,'♥'),card(9,'♥')]);
 b.sides.A.special.hand[0].type='tactic-suppress';
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},1);
 assert.ok(b.sides.B.escorts[0].hp<20);
 assert.equal(b.sides.A.commander.lastEscortIndex,0);
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},3);
 assert.equal(b.sides.A.commander.lastEscortIndex,1);
 assert.equal(b.sides.A.commander.liveFormulaBonus?.percentage,8);
 assert.equal(b.history.some(e=>e.kind==='pilot_escort_prepared'),true);
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},4);
 assert.equal(b.history.some(e=>e.kind==='pilot_bonus'&&e.trigger==='alternate_escort'),true);
 assert.equal(b.actionUsed.numeric,3);
 assert.equal(b.actionUsed.special,1);
});
