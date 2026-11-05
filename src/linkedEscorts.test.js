import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {newVessel,initialBattle,isDestroyed,applyPendingHit} from './mathDuelEngine.js';
import {buildLinkedEscorts,impactLinkedEscort,interceptMotherVolley,ESCORT_INTERCEPT_SHARE} from './linkedEscorts.js';
const target={plus:10,minus:7,times:20,divide:2};
const cards=(a,b)=>[{value:a,suit:'♠'},{value:b,suit:'♥'}];
test('17 madri: nessuna scudiera L1-2; una L3-4; due L5',()=>{
 for(const ship of PHASE1_CATALOG.ships)for(let level=1;level<=5;level++){
  const escorts=buildLinkedEscorts(newVessel(ship.id,level),target);
  assert.equal(escorts.length,level<3?0:level<5?1:2,ship.id+' L'+level);
  assert.ok(escorts.every((e,i)=>e.id===ship.id+':escort:'+(i+1)&&e.parentShipId===ship.id));
 }
});
test('nessuna carta aggiuntiva e nessuna arma duplicata nelle scudiere',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:5},()=>.5);
 assert.equal(b.player.fleet.length,1);assert.equal(b.player.fleet[0].weapons.length,1);
 assert.equal(b.player.escorts.length,2);assert.equal(b.enemy.escorts.length,2);
 assert.notStrictEqual(b.player.escorts[0],b.enemy.escorts[0]);
});
test('intercettazione con due scudiere: 40% di 100, scudo madre salvo',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:5},()=>.5);
 const escorts=b.player.escorts;
 const hit=interceptMotherVolley(escorts,100);
 assert.equal(ESCORT_INTERCEPT_SHARE,.20);
 assert.equal(hit.intercepted,40);assert.equal(hit.remaining,60);
 assert.equal(hit.escorts[0].defense.shield.hp,escorts[0].defense.shield.hp-20);
 assert.equal(hit.escorts[1].defense.shield.hp,escorts[1].defense.shield.hp-20);
});
test('scudiera a scudo esaurito resta viva ma perde l intercettazione',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:3},()=>.5);
 const down=impactLinkedEscort(b.player.escorts,0,9999).escorts;
 assert.equal(down[0].defense.shield.hp,0);
 assert.equal(down[0].defense.destroyed,false);
 assert.equal(interceptMotherVolley(down,60).remaining,60);
});
test('colpire una scudiera non tocca lo scudo della madre',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:3},()=>.5);
 const hp=b.enemy.fleet[0].defense.shield.hp;
 const r=applyPendingHit(b.enemy,0,'plus',999,{escortIndex:0,cards:cards(4,6)});
 assert.equal(r.defender.fleet[0].defense.shield.hp,hp);
 assert.equal(r.defender.escorts[0].defense.shield.hp,0);
 const s=r.defender.escorts[0].defense.signature;
 const wrong=applyPendingHit(r.defender,0,s.op,0,{escortIndex:0,cards:cards(3,6)});
 assert.equal(wrong.destroyed,false);
 const right=applyPendingHit(r.defender,0,s.op,0,{escortIndex:0,cards:cards(s.target-4,4)});
 assert.equal(right.destroyed,true);
 assert.equal(right.defender.escorts[0].defense.destroyed,true);
});
test('morte madre termina il combattimento anche se scudiere vive',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:5},()=>.5);
 const fleet=b.enemy.fleet.map(v=>({...v,defense:{...v.defense,parts:Object.fromEntries(Object.entries(v.defense.parts).map(([key,p])=>[key,{...p,hp:0}]))}}));
 const x={...b.enemy,fleet};
 assert.equal(isDestroyed(x),true);
 assert.ok(x.escorts.every(e=>!e.defense.destroyed));
});
test('nessun effetto sulla flotta multipla legacy',()=>{
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00','C02','C03']},()=>.5);
 assert.equal(b.vitalPrototype,false);
 assert.equal(b.player.escorts,undefined);
});
test('impatti sovrapposti sottraggono danni cumulativi senza valori negativi',()=>{
 const b=initialBattle(1,{vitalPrototype:true,shipLevel:5},()=>.5);
 const x=applyPendingHit(b.enemy,0,'plus',60),y=applyPendingHit(x.defender,0,'plus',60);
 assert.equal(x.damage+y.damage,120);
 assert.equal(y.defender.escorts[0].defense.shield.hp,x.defender.escorts[0].defense.shield.hp-12);
});
