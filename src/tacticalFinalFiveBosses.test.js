import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket}
 from './simultaneousDuelEngine.js';
import {
 createExclusiveBossState,exclusiveBossReady,prepareExclusiveIdraRegen,
 rememberExclusiveIdraBarrierHit,cancelExclusiveIdraByHeart,
 exclusiveChaosNativeBonus,rememberExclusiveChaosNativeHit,
 rememberExclusiveResonanceDiscards,collectExclusiveResonanceSync,
 exclusiveMagmaPhase,exclusiveMagmaNativeAdjustment,
 exclusiveVoidDominantSuit,exclusiveVoidPrecisionBonus,rememberExclusiveVoidCounter
} from './tacticalExclusiveBosses.js';

const EMPTY={numericIndices:[],specialIndices:[]};
const duel=(id,opts={})=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'C02',levelA:1,levelB:1,bossPlanetB:id});
 b.sides.A.defense.shield.max=opts.ahMax??500;
 b.sides.A.defense.shield.hp=opts.ah??500;
 b.sides.B.defense.shield.hp=opts.bh??40;
 return b;
};
const cycle=(b,a=EMPTY,c=EMPTY,at=100)=>{
 const x=sealTacticalOrder(b,'A',a,at);
 assert.equal(x.ok,true,x.reason);
 const y=sealTacticalOrder(x.battle,'B',c,at+1);
 assert.equal(y.ok,true,y.reason);
 return advanceTacticalDuel(y.battle,at+1);
};
const next=b=>advanceTacticalDuel(b,b.resolveUntilMs);
const gunB=b=>b.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='B');
const precision=b=>b.history.at(-1).impacts.filter(i=>i.kind==='precision');
const aHeartToB={numericIndices:[1,5],vitalId:'engine',op:'plus'};
const bSpadeToA={numericIndices:[2,3],vitalId:'engine',op:'times'};

test('I cinque boss esclusivi rimanenti sono separati dalle passive dei mazzi numerici',()=>{
 for(const id of [11,14,17,19,20]){
  assert.equal(exclusiveBossReady(id),true);
  const state=createExclusiveBossState(id);
  assert.equal(state.id,id);
  const b=duel(id);
  assert.equal(b.sides.B.bossExclusive.id,id);
  assert.equal(b.sides.B.bossNumericDeck??null,null);
 }
 assert.equal(createExclusiveBossState(0),null);
});

test('Idra: reale impatto alla barriera programma +4 HP nel ciclo successivo, senza riparare vitali',()=>{
 const first=cycle(duel(11));
 assert.ok(gunB(first).damage>0);
 assert.equal(first.sides.B.bossExclusive.regenPendingRound,2);
 assert.ok(first.lastEvents.some(e=>e.includes('Rigenerazione +4 HP programmata')));
 const before=next(first);
 const shield=before.sides.B.defense.shield.hp;
 const parts=structuredClone(before.sides.B.defense.parts);
 const second=cycle(before,EMPTY,EMPTY,8200);
 assert.equal(second.history.at(-1).snapshots.before.B.defense.shield.hp,shield);
 assert.equal(second.history.at(-1).snapshots.prepared.B.defense.shield.hp,shield+4);
 assert.equal(second.sides.B.bossExclusive.regenLastRound,2);
 assert.deepEqual(second.sides.B.defense.parts,parts);
 assert.ok(second.lastEvents.some(e=>e.includes('Rigenerazione +4 HP reali')));
});

test('Idra: una precisione valida con Cuori su vitale esposto blocca la rigenerazione',()=>{
 const b=duel(11,{bh:40});
 const first=cycle(b,aHeartToB);
 assert.ok(precision(first).some(x=>x.by==='A'&&x.damage>0));
 assert.ok(first.lastEvents.some(e=>e.includes('Rigenerazione annullata da Cuori')));
 assert.equal(first.sides.B.bossExclusive.regenPendingRound,0);
 const second=cycle(next(first),EMPTY,EMPTY,8200);
 assert.equal(second.lastEvents.some(e=>e.includes('Rigenerazione +4 HP reali')),false);
 const wrong=cycle(duel(11,{bh:40}),{numericIndices:[1,5],vitalId:'engine',op:'minus'});
 assert.ok(!wrong.lastEvents.some(e=>e.includes('Rigenerazione annullata da Cuori')));
 assert.equal(wrong.sides.B.bossExclusive.regenPendingRound,2);
});

test('Idra: limite del generatore e cooldown; scudo al massimo non produce vita gratuita',()=>{
 const side=duel(11).sides.B;
 side.defense.shield.hp=40;
 assert.equal(rememberExclusiveIdraBarrierHit(side,4,1),true);
 assert.equal(prepareExclusiveIdraRegen(side,2).repaired,4);
 assert.equal(side.defense.shield.hp,44);
 assert.equal(rememberExclusiveIdraBarrierHit(side,4,2),false);
 assert.equal(rememberExclusiveIdraBarrierHit(side,4,3),false);
 assert.equal(rememberExclusiveIdraBarrierHit(side,4,4),true);
 side.defense.parts.shieldGenerator.hp=0;
 assert.equal(prepareExclusiveIdraRegen(side,5).repaired,0);
 assert.equal(side.defense.shield.hp,44);
 const full=duel(11).sides.B;
 full.defense.shield.hp=full.defense.shield.max;
 rememberExclusiveIdraBarrierHit(full,3,1);
 assert.equal(prepareExclusiveIdraRegen(full,2).repaired,0);
 assert.equal(full.defense.shield.hp,full.defense.shield.max);
});

test('Generatore del Caos: tre veri colpi caricano, soltanto il quarto libera +10% e azzera',()=>{
 let b=duel(14);
 const control=duel(null);
 let base=control;
 const prior=[];
 for(let round=1;round<=5;round++){
  const result=cycle(b,EMPTY,EMPTY,100+(round-1)*8300);
  base=cycle(base,EMPTY,EMPTY,100+(round-1)*8300);
  assert.ok(gunB(result).damage>0);
  const expected=[1,2,3,0,1][round-1];
  assert.equal(result.sides.B.bossExclusive.chaosCharges,expected);
  if(round<=3)assert.equal(gunB(result).packet,gunB(base).packet);
  if(round===4){
   assert.ok(gunB(result).packet>gunB(base).packet);
   assert.ok(result.lastEvents.some(e=>e.includes('Scarica del reattore +10%')));
  }
  prior.push(expected);
  if(round<5){b=next(result);base=next(base);}
 }
 assert.deepEqual(prior,[1,2,3,0,1]);
});

test('Generatore del Caos: zero danni conserva la carica e non produce scarica gratuita',()=>{
 const b=duel(14,{ah:0});
 b.sides.B.bossExclusive.chaosCharges=3;
 const x=cycle(b);
 assert.equal(gunB(x).damage,0);
 assert.equal(x.sides.B.bossExclusive.chaosCharges,3);
 const helper=x.sides.B;
 assert.equal(exclusiveChaosNativeBonus(helper,10).active,true);
 assert.equal(rememberExclusiveChaosNativeHit(helper,0,{active:true}).released,false);
 assert.equal(helper.bossExclusive.chaosCharges,3);
});

test('Cristallo: 2 vere carte numeriche consumate nel ciclo N danno +5 Sincronia dopo un colpo in N+1',()=>{
 let a=duel(17,{ah:500}),b=duel(null,{ah:500});
 const numeric={numericIndices:[3,2],vitalId:'weapons',op:'minus'};
 a=cycle(a,numeric);
 b=cycle(b,numeric);
 assert.equal(a.sides.B.bossExclusive.resonanceReadyRound,2);
 assert.equal(a.lastEvents.some(e=>e.includes('Memoria degli scarti armata')),true);
 assert.equal(a.lastEvents.some(e=>e.includes('Memoria degli scarti +5')),false);
 a=cycle(next(a),EMPTY,EMPTY,8200);
 b=cycle(next(b),EMPTY,EMPTY,8200);
 assert.ok(gunB(a).damage>0);
 assert.equal(a.sides.B.sync,b.sides.B.sync+5);
 assert.ok(a.lastEvents.some(e=>e.includes('Memoria degli scarti +5')));
 assert.equal(a.sides.B.bossExclusive.resonanceReadyRound,0);
});

test('Cristallo: un solo scarto, barriera a zero o Sincronia piena non concedono risorse false',()=>{
 const side=duel(17).sides.B;
 assert.equal(rememberExclusiveResonanceDiscards(side,1,1),false);
 assert.equal(side.bossExclusive.resonanceReadyRound,0);
 assert.equal(rememberExclusiveResonanceDiscards(side,2,1),true);
 assert.equal(collectExclusiveResonanceSync(side,0,2),0);
 assert.equal(side.sync,0);
 assert.equal(collectExclusiveResonanceSync(side,4,2),5);
 assert.equal(side.sync,5);
 assert.equal(collectExclusiveResonanceSync(side,4,2),0);
 side.sync=99;
 rememberExclusiveResonanceDiscards(side,3,2);
 assert.equal(collectExclusiveResonanceSync(side,5,3),1);
 assert.equal(side.sync,100);
});

test('Nucleo Magmatico: CARICA, ERUZIONE, RAFFREDDAMENTO in successione pubblica deterministica',()=>{
 let a=duel(19),b=duel(null);
 assert.ok(a.lastEvents.some(e=>e.includes('fase CARICA per il ciclo 1')));
 let baseline=nativeBarrierPacket(a.sides.B);
 const labels=['carica','eruzione','raffreddamento','carica'];
 for(let round=1;round<=4;round++){
  assert.equal(exclusiveMagmaPhase(a.sides.B,round),labels[round-1]);
  const result=cycle(a,EMPTY,EMPTY,100+(round-1)*8300);
  const normal=cycle(b,EMPTY,EMPTY,100+(round-1)*8300);
  assert.equal(result.lastEvents.some(e=>e.includes('fase '+labels[round-1].toUpperCase())),true);
  const differential=gunB(result).packet-gunB(normal).packet;
  if(round===1||round===4)assert.equal(differential,0);
  if(round===2){
   assert.equal(differential,Math.min(Math.floor(baseline*.45),Math.ceil(baseline*.10-1e-9)));
   assert.ok(result.lastEvents.some(e=>e.includes('Eruzione +10%')&&
    e.includes('prima di intercettazione e difese; non danno garantito')),
    'il registro non chiama HP reali il bonus prima delle difese');
  }
  if(round===3)assert.equal(differential,-Math.ceil(baseline*.10-1e-9));
  if(round<4){
   a=next(result);b=next(normal);
   assert.ok(a.lastEvents.some(e=>e.includes('fase '+labels[round].toUpperCase()+' per il ciclo '+(round+1))));
  }
 }
});

test('Sovrano del Vuoto: seme dominante ruota ogni tre cicli ed è comunicato in preparazione',()=>{
 const expected=['♠','♠','♠','♥','♥','♥','♦','♦','♦','♣','♣','♣','♠'];
 expected.forEach((suit,i)=>assert.equal(exclusiveVoidDominantSuit(i+1),suit));
 const b=duel(20);
 assert.ok(b.lastEvents.some(x=>x.includes('seme dominante ♠')));
 const r=cycle(b);
 const nextPlanning=next(r);
 assert.ok(nextPlanning.lastEvents.some(x=>x.includes('seme dominante ♠ per il ciclo 2')));
});

test('Sovrano: precisione valida con seme dominante +7%, Cuori o Picche avversari contrasta il ciclo SUCCESSIVO',()=>{
 const b=duel(20,{ah:40,bh:40});
 b.sides.A.defense.parts.engine.hp=30;
 b.sides.A.defense.parts.engine.max=30;
 b.sides.B.defense.parts.engine.hp=30;
 b.sides.B.defense.parts.engine.max=30;
 const r=cycle(b,aHeartToB,bSpadeToA);
 assert.ok(precision(r).some(i=>i.by==='B'&&i.damage===7));
 assert.equal(r.sides.B.bossExclusive.voidBlockedRound??0,0);
 const c=duel(20,{ah:40,bh:40});
 c.sides.A.defense.parts.engine.max=30;c.sides.A.defense.parts.engine.hp=30;
 c.sides.B.defense.parts.engine.max=30;c.sides.B.defense.parts.engine.hp=30;
 const spadeCounter={numericIndices:[1,4],vitalId:'engine',op:'plus'};
 const blocked=cycle(c,spadeCounter,bSpadeToA);
 assert.ok(precision(blocked).some(i=>i.by==='A'&&i.damage>0));
 assert.equal(blocked.sides.B.bossExclusive.voidBlockedRound,2);
 assert.ok(precision(blocked).some(i=>i.by==='B'&&i.damage===7),
  'Both simultaneous actions are resolved with the current cycle status');
 const nextBlocked=next(blocked);
 const bonus=exclusiveVoidPrecisionBonus(nextBlocked.sides.B,
  [{suit:'♠',value:3},{suit:'♦',value:4}],10,2);
 assert.equal(bonus.active,false);
 const other=exclusiveVoidPrecisionBonus(r.sides.B,
  [{suit:'♠',value:3},{suit:'♦',value:4}],10,2);
 assert.equal(other.active,true);
 assert.equal(other.extra,1);
});

test('Poteri esclusivi non leggono mani nascoste e non si attivano su identita diverse',()=>{
 const d=duel(null).sides.B;
 assert.equal(prepareExclusiveIdraRegen(d,2).repaired,0);
 assert.equal(rememberExclusiveIdraBarrierHit(d,5,1),false);
 assert.equal(cancelExclusiveIdraByHeart(d,5,[{suit:'♥'}],1),false);
 assert.equal(exclusiveChaosNativeBonus(d,10).active,false);
 assert.equal(rememberExclusiveChaosNativeHit(d,5,null).released,false);
 assert.equal(rememberExclusiveResonanceDiscards(d,2,1),false);
 assert.equal(collectExclusiveResonanceSync(d,5,2),0);
 assert.equal(exclusiveMagmaPhase(d,2),null);
 assert.equal(exclusiveMagmaNativeAdjustment(d,11,3).penalty,0);
 assert.equal(exclusiveVoidPrecisionBonus(d,[{suit:'♠'}],10,1).active,false);
 assert.equal(rememberExclusiveVoidCounter(d,10,[{suit:'♠'}],1),false);
});
