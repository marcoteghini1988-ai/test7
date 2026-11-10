import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction} from './officialLiveDuelEngine.js';
import {liveBossIncomingShieldFactor,liveBossOnShieldHit,liveBossNativeModifiers,
 liveBossAfterNativeShot,liveBossOnCounter,liveBossOnVitalImpact,
 liveBossStartTurn,liveBossOnNumericCardsSpent,liveBossDominantSuit} from './officialLiveBossPowers.js';

const game=(id,shipA='N00',shipB='N00')=>
 createOfficialLiveDuel(createTacticalDuel({shipA,shipB,levelA:1,levelB:1,
  bossPlanetB:id,nowMs:0}),0);
test('Gaia: la corazza smorza soltanto il primo colpo reale alla madre',()=>{
 let b=game(1);
 assert.equal(liveBossIncomingShieldFactor(b.sides.B),.8);
 liveBossOnShieldHit(b.sides.B,0,1);
 assert.equal(liveBossIncomingShieldFactor(b.sides.B),.8);
 liveBossOnShieldHit(b.sides.B,8,1);
 assert.equal(liveBossIncomingShieldFactor(b.sides.B),1);
});
test('Tharsis: la pressione cresce solo dopo veri colpi barriera',()=>{
 let b=game(2),a=b.sides.B,z=b.sides.A;
 const first=liveBossNativeModifiers(a,z,30,1);
 assert.equal(first.damage,30);
 liveBossAfterNativeShot(a,z,1,0,first);
 assert.equal(a.bossExclusive.streak,0);
 liveBossAfterNativeShot(a,z,1,8,first);
 assert.equal(a.bossExclusive.streak,1);
 const second=liveBossNativeModifiers(a,z,30,1);
 assert.equal(second.damage,30); // 3% di 30 conserva il resto, non inventa +1
 liveBossAfterNativeShot(a,z,1,6,second);
 assert.equal(a.bossExclusive.streak,2);
 const third=liveBossNativeModifiers(a,z,30,1);
 assert.equal(third.damage,32);
});
test('Saturno: Crono carica solo dopo vera Contromisura, non prima',()=>{
 let b=game(6),a=b.sides.B,z=b.sides.A;
 assert.equal(liveBossNativeModifiers(a,z,40,1).damage,40);
 assert.equal(liveBossOnCounter(a,1),true);
 assert.equal(liveBossNativeModifiers(a,z,40,1).damage,40);
 const next=liveBossNativeModifiers(a,z,40,2);
 assert.equal(next.damage,42);
 liveBossAfterNativeShot(a,z,2,9,next);
 assert.equal(a.bossExclusive.counterArmedAfterRound,0);
});
test('Urano: Sifone trasferisce solo Sincronia posseduta, mai valori fittizi',()=>{
 let b=game(7),a=b.sides.B,z=b.sides.A;a.sync=90;z.sync=12;
 liveBossAfterNativeShot(a,z,1,0,{});
 assert.equal(a.sync,90);
 liveBossAfterNativeShot(a,z,1,10,{});
 assert.equal(a.sync,98);assert.equal(z.sync,4);
});
test('Nettuno: pressione al 40% effettivo della barriera nemica',()=>{
 let b=game(8),a=b.sides.B,z=b.sides.A;
 assert.equal(liveBossNativeModifiers(a,z,50,1).damage,50);
 z.defense.shield.hp=24;
 let p=liveBossNativeModifiers(a,z,50,1);
 assert.equal(p.damage,54);
 liveBossAfterNativeShot(a,z,1,9,p);
 assert.equal(a.bossExclusive.pressureRemainder,0);
});
test('Plutone: Patto di sangue paga HP veri e rispetta cooldown',()=>{
 let b=game(9),a=b.sides.B,z=b.sides.A;
 let p=liveBossNativeModifiers(a,z,25,1);
 assert.equal(a.defense.shield.hp,56);
 assert.equal(p.damage,27);
 p=liveBossNativeModifiers(a,z,25,1);
 assert.equal(a.defense.shield.hp,56);
 p=liveBossNativeModifiers(a,z,25,4);
 assert.equal(a.defense.shield.hp,52);
});
test('Europa: l’Idra cura soltanto dopo attacco reale e nel ciclo seguente',()=>{
 let b=game(11),a=b.sides.B;a.defense.shield.hp=40;
 liveBossOnShieldHit(a,0,1);
 assert.equal(liveBossStartTurn(a,2).repaired,0);
 liveBossOnShieldHit(a,7,2);
 assert.equal(liveBossStartTurn(a,2).repaired,0);
 assert.equal(liveBossStartTurn(a,3).repaired,4);
 assert.equal(a.defense.shield.hp,44);
});
test('Proxima b: il Generatore del Caos non incrementa a danno zero',()=>{
 let b=game(14),a=b.sides.B,z=b.sides.A;
 for(let i=0;i<3;i++)liveBossAfterNativeShot(a,z,1,5,{chaos:{active:false}});
 assert.equal(a.bossExclusive.chaosCharges,3);
 const charged=liveBossNativeModifiers(a,z,30,2);
 assert.equal(charged.damage,33);
 liveBossAfterNativeShot(a,z,2,10,charged);
 assert.equal(a.bossExclusive.chaosCharges,0);
});
test('Haumea: Sincronia solo nel ciclo dopo due numeriche davvero spese',()=>{
 let b=game(17),a=b.sides.B,z=b.sides.A;
 liveBossOnNumericCardsSpent(b,'A',2,1);
 liveBossAfterNativeShot(a,z,1,6,{});
 assert.equal(a.sync,0);
 liveBossAfterNativeShot(a,z,2,6,{});
 assert.equal(a.sync,5);
});
test('Io: Eruzione +10%, Raffreddamento -10% in cicli fissi',()=>{
 let b=game(19),a=b.sides.B,z=b.sides.A;
 assert.equal(liveBossNativeModifiers(a,z,30,1).damage,30);
 assert.equal(liveBossNativeModifiers(a,z,30,2).damage,33);
 assert.equal(liveBossNativeModifiers(a,z,30,3).damage,27);
});
test('Venere: una vera formula vitale applica Neurotossina, non uno sparo nullo',()=>{
 let b=game(3),a=b.sides.B,z=b.sides.A;
 liveBossOnVitalImpact(a,z,0,[{suit:'♥'}],1);
 assert.equal(z.neurotoxinUntilRound,0);
 liveBossOnVitalImpact(a,z,10,[{suit:'♥'}],1);
 assert.equal(z.neurotoxinUntilRound,2);
});

test('Sovrano del Vuoto LIVE: seme dominante pubblico ruota a blocchi di 3 cicli',()=>{
 const b=game(20);
 assert.equal(liveBossDominantSuit(b.sides.B,1),'♠');
 assert.equal(liveBossDominantSuit(b.sides.B,3),'♠');
 assert.equal(liveBossDominantSuit(b.sides.B,4),'♥');
 assert.equal(liveBossDominantSuit(b.sides.B,7),'♦');
 assert.equal(liveBossDominantSuit(b.sides.B,10),'♣');
 assert.ok(b.lastEvents.some(x=>x.includes('seme dominante')&&x.includes('♠')));
 assert.equal(liveBossDominantSuit(b.sides.A,1),null);
});
test('Sovrano: solo vera formula vitale con seme dominante arma +7% su sparo successivo',()=>{
 const b=game(20),a=b.sides.B,z=b.sides.A;
 const dominated=[{value:4,suit:'♠'},{value:5,suit:'♥'}];
 liveBossOnVitalImpact(a,z,0,dominated,1);
 assert.equal(a.bossExclusive.voidLiveArmedUntilRound,undefined);
 liveBossOnVitalImpact(a,z,10,[{value:4,suit:'♦'},{value:5,suit:'♥'}],1);
 assert.equal(a.bossExclusive.voidLiveArmedUntilRound,undefined);
 liveBossOnVitalImpact(a,z,10,dominated,1);
 assert.equal(a.bossExclusive.voidLiveArmedUntilRound,2);
 const power=liveBossNativeModifiers(a,z,40,1);
 assert.equal(power.damage,43);
 assert.equal(power.voidBonus.active,true);
 liveBossAfterNativeShot(a,z,1,0,power);
 assert.equal(a.bossExclusive.voidLiveArmedUntilRound,2);
 liveBossAfterNativeShot(a,z,1,8,power);
 assert.equal(a.bossExclusive.voidLiveArmedUntilRound,0);
 assert.equal(liveBossNativeModifiers(a,z,40,1).damage,40);
});
test('Sovrano: formula avversaria con dominante neutralizza solo il ciclo successivo',()=>{
 const b=game(20),a=b.sides.A,z=b.sides.B;
 const valid=[{value:4,suit:'♠'},{value:5,suit:'♥'}];
 liveBossOnVitalImpact(a,z,10,valid,1);
 assert.equal(z.bossExclusive.voidBlockedRound,2);
 liveBossOnVitalImpact(z,a,10,valid,2);
 assert.equal(z.bossExclusive.voidLiveArmedUntilRound,undefined);
 z.bossExclusive.voidLiveArmedUntilRound=3;
 assert.equal(liveBossNativeModifiers(z,a,50,2).damage,50);
 assert.equal(liveBossNativeModifiers(z,a,50,3).damage,54);
});
test('Sovrano LIVE end-to-end: 2 numeriche vere distruggono il vitale, terza arma riceve +7%',()=>{
 let b=game(20);
 b.sides.A.defense.shield.hp=45;
 // Stato di battaglia reale successivo a pressione sulla barriera: il
 // bersaglio è già stato esposto dalla soglia, senza riprogettare le arene.
 const part=b.sides.A.defense.parts.engine;
 part.exposed=true;
 b.sides.A.defense.exposureOrder=['engine'];
 const pile=b.sides.B.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const chosen=[{value:4,suit:'♠'},{value:5,suit:'♥'},{value:13,suit:'♠'}]
  .map(x=>all.find(c=>c.value===x.value&&c.suit===x.suit));
 assert.ok(chosen.every(Boolean));
 const ids=new Set(chosen.map(c=>c.id));
 pile.hand=[...chosen,...all.filter(c=>!ids.has(c.id)).slice(0,4)];
 const inHand=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!inHand.has(c.id));pile.discard=[];
 const end=applyOfficialLiveAction(b,'A',{type:'end'},1);
 assert.equal(end.ok,true);
 b=end.battle;
 const put=(index,target,time)=>{
  const r=applyOfficialLiveAction(b,'B',
   {type:'numeric',index,target,vitalId:'engine',shipId:'mother'},time);
  assert.equal(r.ok,true,r.reason);b=r.battle;
 };
 put(0,'vital',2);
 put(0,'vital',3);
 assert.equal(b.sides.A.defense.parts.engine.hp,0);
 assert.equal(b.sides.A.defense.shield.hp,45);
 assert.equal(b.sides.B.bossExclusive.voidLiveArmedUntilRound,2);
 put(0,'ship',4);
 assert.equal(b.history.findLast(e=>e.kind==='shot')?.damage,14);
 assert.equal(b.sides.B.bossExclusive.voidLiveArmedUntilRound,0);
 assert.equal(b.actionUsed.numeric,3);
 assert.equal(b.sides.B.numeric.hand.length,4);
});
