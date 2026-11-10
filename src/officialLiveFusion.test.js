import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn} from './officialLiveDuelEngine.js';
const duel=(level=3)=>createOfficialLiveDuel(createTacticalDuel({
 shipA:'N00',shipB:'N00',levelA:level,levelB:1,nowMs:0}),0);
const play=(b,key,action,at)=>{const r=applyOfficialLiveAction(b,key,action,at);
 assert.equal(r.ok,true,JSON.stringify({key,action,reason:r.reason}));return r.battle;};
test('Fusione Barriera: 100 Sincronia, primo scudo scudiera assorbe 60% del colpo reale',()=>{
 let b=duel(3);
 b.sides.A.sync=100;b.sides.A.special.hand[0].type='fusion-barrier';
 b=play(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.sync,0);
 assert.equal(b.sides.A.liveFusion.defense,.60);
 assert.equal(applyOfficialLiveAction(b,'A',{type:'numeric',index:0,target:'ship',shipId:'escort-0'},2).reason,'escort_fused');
 b=finishOfficialLiveTurn(b,3);
 b=play(b,'B',{type:'numeric',index:0,target:'ship'},4);
 assert.equal(b.sides.A.escorts[0].hp,16);
 assert.equal(b.sides.A.defense.shield.hp,56);
});
test('Fusione Gemellare: 2 scudiere devono proteggere usando entrambe i loro veri HP',()=>{
 let b=duel(5);b.sides.A.sync=100;
 b.sides.A.special.hand[0].type='fusion-twin';
 b=play(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=finishOfficialLiveTurn(b,2);
 b=play(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.A.escorts[0].hp,18);
 assert.equal(b.sides.A.escorts[1].hp,18);
 assert.equal(b.sides.A.defense.shield.hp,56);
});
test('Fusione Assalto e Trina: potenziano solo tiri caricati, la Trina conserva difesa reale',()=>{
 let b=duel(5);b.sides.A.sync=100;
 b.sides.A.special.hand[0].type='fusion-triad';
 b=play(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.B.defense.shield.hp,60); // attivare la carta non spara
 b=play(b,'A',{type:'numeric',index:0,target:'ship'},2); // Nave L5: W01=2, 3♣ -> floor(6*1.35)=8
 assert.equal(b.sides.B.defense.shield.hp,52);
 b=finishOfficialLiveTurn(b,3);
 b=play(b,'B',{type:'numeric',index:0,target:'ship'},4); // 8♥, 40% inter
 assert.equal(b.sides.A.defense.shield.hp,55);
 assert.equal(b.sides.A.escorts[0].hp,18);
 assert.equal(b.sides.A.escorts[1].hp,19);
});
test('Fusioni respinte non consumano Speciale o Sincronia se mancano scudiere vere',()=>{
 let b=duel(1);b.sides.A.sync=100;
 b.sides.A.special.hand[0].type='fusion-barrier';
 const r=applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(r.reason,'fusion_unavailable');
 assert.equal(b.sides.A.special.hand.length,5);
 assert.equal(b.sides.A.sync,100);
});
