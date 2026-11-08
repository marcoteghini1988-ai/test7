import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createTacticalDuel,nativeBarrierPacket,sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {restoreMotherShield} from './vitalDefense.js';
import {systemState,escortInterceptionEfficiency} from './fleetSystems.js';

const empty=()=>({specialIndices:[],numericIndices:[]});
function cycle(b,a=empty(),bb=empty()){
 const first=sealTacticalOrder(b,'A',a,100);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',bb,101);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,101);
}
function impact(b,kind,by='A'){
 const hit=b.history.at(-1).impacts.find(i=>i.kind===kind&&i.by===by);
 assert.ok(hit,'impatto '+kind+' '+by+' mancante');
 return hit;
}

test('Soglie dei 4 vitali: 6 HP integro, 5-1 penalita, 0 distrutto, senza stati fantasma',()=>{
 const d=createTacticalDuel().sides.A.defense;
 for(const id of ['engine','weapons','shieldGenerator','command']){
  for(const [hp,expected] of [[10,'healthy'],[6,'healthy'],[5,'damaged'],[1,'damaged'],[0,'destroyed']]){
   d.parts[id].hp=hp;
   assert.equal(systemState(d,id),expected,id+' '+hp);
  }
  d.parts[id].hp=10;
 }
});

test('Motore/Armi: le penalita intermedie e KO influiscono solo sul vero fuoco nativo delle 17 navi',()=>{
 for(const ship of PHASE1_CATALOG.ships){
  const side=createTacticalDuel({shipA:ship.id,levelA:5}).sides.A;
  const parts=side.defense.parts,original=structuredClone(side.numeric);
  const intact=nativeBarrierPacket(side);
  parts.engine.hp=6;assert.equal(nativeBarrierPacket(side),intact,ship.id+' motore 6');
  parts.engine.hp=5;assert.equal(nativeBarrierPacket(side),Math.floor(intact*.90+1e-9),ship.id+' motore 5');
  parts.engine.hp=0;assert.equal(nativeBarrierPacket(side),Math.floor(intact*.75+1e-9),ship.id+' motore KO');
  parts.engine.hp=10;
  parts.weapons.hp=6;assert.equal(nativeBarrierPacket(side),intact,ship.id+' armi 6');
  parts.weapons.hp=5;assert.equal(nativeBarrierPacket(side),Math.floor(intact*.80+1e-9),ship.id+' armi 5');
  parts.weapons.hp=0;assert.equal(nativeBarrierPacket(side),Math.floor(intact*.50+1e-9),ship.id+' armi KO');
  parts.weapons.hp=5;parts.engine.hp=5;
  assert.equal(nativeBarrierPacket(side),Math.floor(intact*.90*.80+1e-9),ship.id+' combinati');
  assert.deepEqual(side.numeric,original,'Le carte numeriche non subiscono modifiche');
 }
});

test('Generatore: riparazione 20 HP, 10 HP al 50% di integrita, zero al KO',()=>{
 const d=createTacticalDuel().sides.A.defense;
 d.shield.hp=10;
 for(const [hp,expected] of [[6,20],[5,10],[1,10],[0,0]]){
  d.parts.shieldGenerator.hp=hp;
  const repaired=restoreMotherShield(d,20);
  assert.equal(repaired.repaired,expected);
  assert.equal(repaired.defense.shield.hp,10+expected);
  assert.equal(d.shield.hp,10,'nessuna riparazione gratuita o mutazione dello stato');
 }
});

test('Centralina: scudiere intercettano il 15% in meno a 5 HP, niente intercettazione a 0',()=>{
 const base=createTacticalDuel({shipA:'L04',levelA:5,shipB:'C01',levelB:5});
 const variants=[];
 for(const hp of [6,5,0]){
  const duel=structuredClone(base);
  duel.sides.B.defense.parts.command.hp=hp;
  const factor=escortInterceptionEfficiency(duel.sides.B.defense);
  assert.equal(factor,hp===6?1:hp===5?.85:0);
  const result=cycle(duel);
  const hit=impact(result,'barrier');
  variants.push({intercepted:hit.intercepted,damage:hit.damage});
 }
 assert.ok(variants[0].intercepted>variants[1].intercepted,
  'Con centralina danneggiata la scudiera deve intercettare meno');
 assert.ok(variants[1].intercepted>variants[2].intercepted,
  'Con centralina KO la protezione deve sparire');
 assert.equal(variants[2].intercepted,0);
 assert.ok(variants[0].damage<variants[1].damage&&variants[1].damage<variants[2].damage,
  'La madre subisce progressivamente piu danno');
});

test('Centralina danneggiata limita la fusione: arrotondamento intero non aumenta intercettazione',()=>{
 const base=createTacticalDuel({shipA:'C01',levelA:3,shipB:'R04',levelB:3});
 base.sides.A.sync=100;
 base.sides.A.defense.shield.hp=40;
 const absorbed=[];
 for(const hp of [6,5]){
  const duel=structuredClone(base);
  duel.sides.A.defense.parts.command.hp=hp;
  const result=cycle(duel,{specialIndices:[3]},{
   numericIndices:[2,3],vitalId:'engine',op:'times'
  });
  const hit=impact(result,'precision','B');
  assert.ok(hit.damage>0,'il motore resta bersaglio reale');
  assert.ok(hit.absorbed>0,'fusione assorbe HP della scudiera');
  absorbed.push(hit.absorbed);
 }
 assert.ok(absorbed[1]<=absorbed[0],
  'Una centralina compromessa non puo aumentare la protezione arrotondata');
 assert.equal(escortInterceptionEfficiency({...base.sides.A.defense,
  parts:{...base.sides.A.defense.parts,command:{...base.sides.A.defense.parts.command,hp:5}}}),.85);
});

test('KO Motore o Centralina impedisce nuove fusioni, non le normali numeriche',()=>{
 const base=createTacticalDuel({shipA:'C01',levelA:3});
 base.sides.A.sync=100;
 assert.equal(validateTacticalOrder(base,'A',{specialIndices:[3],numericIndices:[]}).ok,true);
 for(const id of ['engine','command']){
  const duel=structuredClone(base);
  duel.sides.A.defense.parts[id].hp=0;
  assert.equal(validateTacticalOrder(duel,'A',{specialIndices:[3],numericIndices:[]}).reason,'fusion_unavailable',id);
  assert.equal(validateTacticalOrder(duel,'A',{specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'}).ok,true,
   'Una nave danneggiata conserva il diritto di provare un calcolo matematico');
 }
});
