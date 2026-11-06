import test from 'node:test';
import assert from 'node:assert/strict';
import {previewVolley,initialBattle,dealHit,createShip} from './mathDuelEngine.js';
const card=(value,suit)=>({value,suit,id:suit+value});
const battle=(id='N00',level=5)=>initialBattle(1,{vitalPrototype:true,fleetIds:[id],shipLevel:level},()=>.5);
test('7 picche rimangono sette colpi su una sola arma',()=>{
 const b=battle('L02');
 const guns=previewVolley(b.player,[card(7,'♠')]);
 assert.equal(guns.routing.length,1);
 assert.equal(guns.routing[0].value,7);
 assert.equal(guns.shots.reduce((n,g)=>n+g.bullets,0),7);
});
test('preferenza di un cannone della scudiera indirizza le munizioni compatibili',()=>{
 const b=battle('L02'),focus=b.player.escorts[1].weapon.id;
 const v=previewVolley(b.player,[card(7,'♠')],focus);
 assert.equal(v.shots.length,1);
 assert.equal(v.shots[0].escortSlot,1);
 assert.equal(v.shots[0].bullets,7);
 assert.equal(v.shots[0].damage,7*b.player.escorts[1].weapon.damage);
});
test('le due carte 8 cuori e 3 quadri sono 11 munizioni totali',()=>{
 const b=battle('C01');
 const v=previewVolley(b.player,[card(8,'♥'),card(3,'♦')]);
 assert.equal(v.shots.reduce((n,shot)=>n+shot.bullets,0),11);
 assert.equal(v.routing.reduce((n,r)=>n+r.value,0),11);
});
test('cannone ad accumulo conserva munizioni fino alla soglia',()=>{
 const b=battle('C02'),focus=b.player.escorts[1].weapon.id;
 const a=previewVolley(b.player,[card(7,'♣')],focus);
 assert.equal(a.shots[0].bullets,0);
 assert.equal(a.escorts[1].weapon.charge,7);
 const next={...b.player,fleet:a.fleet,escorts:a.escorts};
 const c=previewVolley(next,[card(7,'♣')],focus);
 assert.equal(c.shots[0].bullets,12);
 assert.equal(c.escorts[1].weapon.charge,2);
});
test('gli HP non si rigenerano in base al seme di caricamento',()=>{
 const side=battle('N00').player;
 for(const suit of ['♥','♦','♣','♠']){
  const shot=previewVolley(side,[card(7,suit)]);
  assert.equal(shot.fleet[0].defense.shield.hp,side.fleet[0].defense.shield.hp);
  assert.equal(shot.escorts[0].defense.shield.hp,side.escorts[0].defense.shield.hp);
  assert.equal(shot.escorts[1].defense.shield.hp,side.escorts[1].defense.shield.hp);
 }
});
test('le scudiere mantengono lo stato di carica dopo un colpo valido',()=>{
 const b=battle('C02'),focus=b.player.escorts[1].weapon.id;
 const strike=dealHit(b.enemy,b.player,'plus',10,[card(7,'♣')],0,{},focus);
 assert.equal(strike.attacker.escorts[1].weapon.charge,7);
 assert.equal(strike.rawDamage,0);
});
test('duelli di flotte legacy non cambiano formula di distribuzione',()=>{
 const side=createShip(1,false,{fleetIds:['N00','C02','C03']},()=>.5);
 const v=previewVolley(side,[card(8,'♣'),card(3,'♦')]);
 assert.equal(v.shots.find(g=>g.shipId==='N00').bullets,11);
});
