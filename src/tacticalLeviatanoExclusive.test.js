import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket}
 from './simultaneousDuelEngine.js';
import {
 exclusiveBossReady,createExclusiveBossState,exclusiveLeviatanoNativeBonus,
 rememberExclusiveLeviatanoNativeHit
} from './tacticalExclusiveBosses.js';

const EMPTY={numericIndices:[],specialIndices:[]};
const open=({boss=8,max=300,hp=120,levelA=1,levelB=1,bossNumericDeckA=null}={})=>{
 const duel=createTacticalDuel({shipA:'C01',shipB:'C02',levelA,levelB,
  bossPlanetB:boss,bossNumericDeckA});
 duel.sides.A.defense.shield.max=max;
 duel.sides.A.defense.shield.hp=hp;
 return duel;
};
const cycle=(b,orderA=EMPTY,orderB=EMPTY,now=100)=>{
 const aa=sealTacticalOrder(b,'A',orderA,now);
 assert.equal(aa.ok,true,aa.reason);
 const bb=sealTacticalOrder(aa.battle,'B',orderB,now+1);
 assert.equal(bb.ok,true,bb.reason);
 return advanceTacticalDuel(bb.battle,now+1);
};
const gunB=b=>b.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='B');
const precisionB=b=>b.history.at(-1).impacts.find(i=>i.kind==='precision'&&i.by==='B');
const next=b=>advanceTacticalDuel(b,b.resolveUntilMs);
function bringRealSpecialToHand(side,type,slot){
 const pile=side.special;
 if(pile.hand[slot].type===type)return;
 const i=pile.hand.findIndex(c=>c.type===type);
 if(i>=0){[pile.hand[i],pile.hand[slot]]=[pile.hand[slot],pile.hand[i]];return;}
 const j=pile.deck.findIndex(c=>c.type===type);
 assert.ok(j>=0,'Carta inesistente: '+type);
 [pile.hand[slot],pile.deck[j]]=[pile.deck[j],pile.hand[slot]];
}

test('Il Leviatano e il sesto potere ESCLUSIVO, distinto dal mazzo boss collezionabile',()=>{
 assert.equal(exclusiveBossReady(8),true);
 assert.equal(createExclusiveBossState(8)?.id,8);
 assert.equal(createExclusiveBossState(9),null);
 assert.equal(exclusiveLeviatanoNativeBonus({bossExclusive:null},40,{hp:20,max:60}).active,false);
 assert.equal(exclusiveLeviatanoNativeBonus({bossExclusive:{id:8}},40,null).active,false);
 for(const shield of [{hp:-1,max:60},{hp:61,max:60},{hp:20,max:0}]){
  assert.equal(exclusiveLeviatanoNativeBonus({bossExclusive:{id:8}},40,shield).active,false);
 }
 const equipped=open({boss:8,bossNumericDeckA:{id:'planet_char_8',level:6}});
 assert.equal(equipped.sides.B.bossExclusive.id,8);
 assert.equal(equipped.sides.A.bossNumericDeck.id,'planet_char_8');
 assert.equal(equipped.sides.A.bossNumericDeck.level,6);
 assert.equal(equipped.sides.B.bossNumericDeck,null);
});

test('Pressione degli abissi: soglia esatta del 40% all INIZIO, 41% no; 0 non crea danni',()=>{
 const exact=cycle(open({hp:120,max:300}));
 const high=cycle(open({hp:121,max:300}));
 const zero=cycle(open({hp:0,max:300}));
 const base=nativeBarrierPacket(open().sides.B);
 assert.ok(base>0);
 assert.ok(gunB(exact).damage>0);
 assert.ok(exact.lastEvents.some(e=>e.includes('Leviatano Abissale · Pressione degli abissi')));
 assert.equal(exact.sides.B.bossExclusive.pressureRemainder,(base*8)%100);
 assert.equal(high.sides.B.bossExclusive.pressureRemainder,undefined);
 assert.ok(!high.lastEvents.some(e=>e.includes('Pressione degli abissi')));
 assert.equal(gunB(zero).damage,0);
 assert.ok(!zero.lastEvents.some(e=>e.includes('Pressione degli abissi')));
 assert.equal(zero.sides.B.bossExclusive.pressureRemainder,undefined);
});

test('Il bonus +8% mantiene il resto centesimale e usa SOLO colpi realmente efficaci',()=>{
 const base=nativeBarrierPacket(open().sides.B);
 const one=cycle(open());
 const normalOne=cycle(open({boss:null}));
 assert.equal(gunB(one).damage-gunB(normalOne).damage,Math.floor(base*.08));
 assert.equal(one.sides.B.bossExclusive.pressureRemainder,(base*8)%100);
 const two=cycle(next(one),EMPTY,EMPTY,8200);
 const normalTwo=cycle(next(normalOne),EMPTY,EMPTY,8200);
 const expectedExtra=Math.floor((base*8+(base*8)%100)/100);
 assert.equal(gunB(two).damage-gunB(normalTwo).damage,expectedExtra);
 assert.equal(two.sides.B.bossExclusive.pressureRemainder,(base*8+(base*8)%100)%100);
 assert.ok(two.lastEvents.some(e=>e.includes('Pressione degli abissi')));
});

test('Sotto soglia solo DOPO il primo colpo non attiva il bonus nello stesso ciclo',()=>{
 const first=cycle(open({hp:121,max:300}));
 assert.ok(gunB(first).damage>0);
 assert.ok(!first.lastEvents.some(e=>e.includes('Pressione degli abissi')));
 assert.ok(first.sides.A.defense.shield.hp<=120);
 const second=cycle(next(first),EMPTY,EMPTY,8200);
 assert.ok(second.lastEvents.some(e=>e.includes('Pressione degli abissi')));
});

test('Il bonus usa lo scudo di INIZIO ciclo anche se il giocatore ripara con una carta vera',()=>{
 const b=open({max:60,hp:24});
 bringRealSpecialToHand(b.sides.A,'support-shield-repair',0);
 const done=cycle(b,{specialIndices:[0],numericIndices:[]},EMPTY);
 assert.ok(done.lastEvents.some(e=>e.includes('barriera riparata +20')));
 assert.ok(done.history[0].snapshots.prepared.A.defense.shield.hp>24);
 assert.ok(done.lastEvents.some(e=>e.includes('Pressione degli abissi')));
 assert.equal(done.sides.A.special.discard.some(c=>c.type==='support-shield-repair'),true);
});

test('Il potere non cambia la precisione, la firma, la mano o il calcolo da 2 numeriche',()=>{
 const a=open(),b=open({boss:null});
 const precision={numericIndices:[0,1],specialIndices:[],vitalId:'weapons',op:'minus'};
 const withBoss=cycle(a,EMPTY,precision),normal=cycle(b,EMPTY,precision);
 assert.equal(precisionB(withBoss).damage,precisionB(normal).damage);
 assert.equal(precisionB(withBoss).reason,precisionB(normal).reason);
 assert.deepEqual(withBoss.sides.A.defense.parts,normal.sides.A.defense.parts);
 assert.deepEqual(withBoss.sides.B.numeric,normal.sides.B.numeric);
 assert.deepEqual(withBoss.sides.A.special,normal.sides.A.special);
 assert.ok(withBoss.lastEvents.some(e=>e.includes('Pressione degli abissi')));
});

test('Bonus reale subordinato al cap +45% dei potenziamenti e mai genera munizioni',()=>{
 const b=open({max:300,hp:120});
 bringRealSpecialToHand(b.sides.B,'tactic-power-shift',0);
 bringRealSpecialToHand(b.sides.B,'tactic-kinetic',1);
 const power=nativeBarrierPacket(b.sides.B);
 const result=cycle(b,EMPTY,{numericIndices:[],specialIndices:[0,1]});
 const volley=gunB(result);
 assert.ok(volley.damage>0);
 assert.ok(volley.packet<=power+Math.floor(power*.45));
 assert.ok(result.lastEvents.some(e=>e.includes('Pressione degli abissi')));
 assert.equal(result.sides.B.special.discard.filter(c=>
  ['tactic-power-shift','tactic-kinetic'].includes(c.type)).length,2);
});

test('L accumulatore resta invariato per impatti nulli, senza generare danno da solo',()=>{
 const side={bossExclusive:{id:8,pressureRemainder:67}};
 const active=exclusiveLeviatanoNativeBonus(side,11,{hp:12,max:60});
 assert.equal(active.active,true);
 assert.equal(active.extra,1);
 assert.equal(active.remainder,55);
 rememberExclusiveLeviatanoNativeHit(side,0,active);
 assert.equal(side.bossExclusive.pressureRemainder,67);
 rememberExclusiveLeviatanoNativeHit(side,3,active);
 assert.equal(side.bossExclusive.pressureRemainder,55);
 rememberExclusiveLeviatanoNativeHit(side,8,{active:false,remainder:1});
 assert.equal(side.bossExclusive.pressureRemainder,55);
});
