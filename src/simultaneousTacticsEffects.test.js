import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

function run(b,oa={specialIndices:[],numericIndices:[]},ob={specialIndices:[],numericIndices:[]},time=100){
 const a=sealTacticalOrder(b,'A',oa,time),c=a.ok?sealTacticalOrder(a.battle,'B',ob,time+1):{ok:false,reason:a.reason};
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,time+1);
}
function insertCard(b,key,type,slot=0){
 const n=structuredClone(b),side=n.sides[key],i=side.special.deck.findIndex(c=>c.type===type);
 assert.ok(i>=0,type+' not in deck');
 const v=side.special.hand[slot];side.special.hand[slot]=side.special.deck[i];side.special.deck[i]=v;
 return n;
}
test('Soppressione disattiva soltanto la prima delle due scudiere (L5), non tutte',()=>{
 const b=createTacticalDuel({shipA:'L03',levelA:5,shipB:'C01',levelB:5});
 const r=run(b,{specialIndices:[2],numericIndices:[]});
 assert.equal(r.sides.B.escorts.length,2);
 assert.equal(r.sides.B.escorts[0].hp,20,'la prima è soppressa');
 assert.ok(r.sides.B.escorts[1].hp<20,'la seconda difende ancora');
 assert.ok(r.history[0].impacts.some(x=>x.kind==='barrier'&&x.intercepted>0&&x.by==='A'));
});
test('Perforante aggira una parte delle scudiere ma MAI la barriera madre',()=>{
 const b=createTacticalDuel({shipA:'L03',levelA:5,shipB:'C01',levelB:3});
 const pierced=insertCard(b,'A','shot-piercing');
 const normal=run(b),drilled=run(pierced,{specialIndices:[0],numericIndices:[]});
 assert.ok(drilled.history[0].shieldA>=normal.history[0].shieldA);
 assert.ok(drilled.history[0].impacts.find(x=>x.by==='A'&&x.kind==='barrier').intercepted<=
  normal.history[0].impacts.find(x=>x.by==='A'&&x.kind==='barrier').intercepted);
 assert.ok(drilled.sides.B.defense.shield.hp<=normal.sides.B.defense.shield.hp);
 assert.equal(drilled.sides.B.defense.parts.engine.hp,10);
 assert.equal(drilled.sides.B.defense.parts.weapons.hp,10);
});
test('Ionico richiede colpo reale e indebolisce intercettazione esclusivamente al ciclo successivo',()=>{
 let b=createTacticalDuel({shipA:'C01',levelA:3,shipB:'C01',levelB:3});
 b=insertCard(b,'A','shot-ion');
 const ion=run(b,{specialIndices:[0],numericIndices:[]});
 assert.equal(ion.sides.B.ionized,true,'stato rimasto disponibile per il prossimo ciclo');
 const next=advanceTacticalDuel(ion,8101);
 assert.equal(next.phase,'planning');
 const base=structuredClone(next);base.sides.B.ionized=false;
 const x=run(next,undefined,undefined,8200),y=run(base,undefined,undefined,8200);
 assert.ok(x.sides.B.escorts[0].hp>=y.sides.B.escorts[0].hp);
 assert.ok(x.history[1].shieldA>=y.history[1].shieldA);
 assert.equal(x.sides.B.ionized,false,'nessuno status eterno');
});
test('Ionico non rimane attivo quando la barriera nemica è già a zero',()=>{
 const b=insertCard(createTacticalDuel(),'A','shot-ion');
 b.sides.B.defense.shield.hp=0;
 const r=run(b,{specialIndices:[0],numericIndices:[]});
 assert.equal(r.sides.B.ionized,false);
});
