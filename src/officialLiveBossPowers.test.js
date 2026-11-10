import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction} from './officialLiveDuelEngine.js';
import {liveBossIncomingShieldFactor,liveBossOnShieldHit,liveBossNativeModifiers,
 liveBossAfterNativeShot,liveBossOnCounter,liveBossOnVitalImpact,
 liveBossStartTurn,liveBossOnNumericCardsSpent} from './officialLiveBossPowers.js';

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
