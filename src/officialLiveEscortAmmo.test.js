import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,liveCompatibleShips,chooseOfficialLiveAiAction}
 from './officialLiveDuelEngine.js';
const game=(ship='N00',level=3)=>createOfficialLiveDuel(createTacticalDuel({
 shipA:ship,shipB:'N00',levelA:level,levelB:1,nowMs:0}),0);
test('Scudiera usa semi del proprio armamento, non i quattro semi universali della madre',()=>{
 const b=game('N00',5);
 const clubs={id:'fixture-club',value:9,suit:'♣'};
 const hearts={id:'fixture-heart',value:9,suit:'♥'};
 const c=liveCompatibleShips(b.sides.A,clubs);
 assert.equal(c.find(x=>x.id==='mother').compatible,true);
 assert.equal(c.find(x=>x.id==='escort-0').compatible,false);
 assert.equal(c.find(x=>x.id==='escort-1').compatible,true);
 const h=liveCompatibleShips(b.sides.A,hearts);
 assert.equal(h.find(x=>x.id==='escort-0').compatible,true);
 assert.equal(h.find(x=>x.id==='escort-1').compatible,false);
});
test('Fuoco scudiera autentica consuma una numerica e usa la fonte grafica W del catalogo',()=>{
 const b=game('N00',3);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],suit:'♥',value:8};
 const gun=b.sides.A.escorts[0].weapon;
 const result=applyOfficialLiveAction(b,'A',{type:'numeric',index:0,target:'ship',shipId:'escort-0'},1);
 assert.equal(result.ok,true,result.reason);
 const fired=result.battle.history.findLast(e=>e.kind==='shot');
 assert.equal(fired.escortWeaponId,gun.id);
 assert.equal(fired.weaponId,gun.sourceWeaponId);
 assert.equal(result.battle.sides.A.numeric.hand.length,6);
 assert.ok(fired.damage>0);
 assert.ok(fired.damage<=12);
});
test('Scudiera distrutta non può sparare e una carta non viene consumata',()=>{
 const b=game('N00',3);
 b.sides.A.escorts[0].hp=0;
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],suit:'♥',value:8};
 const r=applyOfficialLiveAction(b,'A',{type:'numeric',index:0,target:'ship',shipId:'escort-0'},1);
 assert.equal(r.ok,false);
 assert.equal(b.sides.A.numeric.hand.length,7);
});
test('IA usa vera scudiera quando la madre non ha un seme compatibile',()=>{
 const b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'C01',levelA:1,levelB:3,nowMs:0}),0);
 b.activeSide='B';
 b.sides.B.numeric.hand=b.sides.B.numeric.hand.map(card=>({...card,suit:'♠'}));
 const action=chooseOfficialLiveAiAction(b);
 assert.deepEqual(action,{type:'numeric',index:0,target:'ship',shipId:'escort-0'});
 const result=applyOfficialLiveAction(b,'B',action,1);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.actionUsed.numeric,1);
});
test('Scudiera con arma ad accumulo conserva carica e non spara prima della soglia',()=>{
 const b=game('C02',5);
 const escort=b.sides.A.escorts[1];
 assert.equal(escort.weapon.tipo,'Accumulo');
 assert.equal(escort.weapon.threshold,12);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],suit:'♠',value:7};
 b.sides.A.numeric.hand[1]={...b.sides.A.numeric.hand[1],suit:'♠',value:6};
 const initial=b.sides.B.defense.shield.hp;
 const first=applyOfficialLiveAction(b,'A',{type:'numeric',index:0,target:'ship',shipId:'escort-1'},1);
 assert.equal(first.ok,true,first.reason);
 assert.equal(first.battle.sides.B.defense.shield.hp,initial);
 assert.equal(first.battle.sides.A.escorts[1].weapon.charge,7);
 const second=applyOfficialLiveAction(first.battle,'A',
  {type:'numeric',index:0,target:'ship',shipId:'escort-1'},2);
 assert.equal(second.ok,true,second.reason);
 assert.ok(second.battle.history.some(e=>e.kind==='shot'&&e.escortWeaponId===escort.weapon.id));
});
