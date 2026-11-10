import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn} from './officialLiveDuelEngine.js';
const game=(levelB=3)=>createOfficialLiveDuel(createTacticalDuel({
 shipA:'N00',shipB:'N00',levelA:1,levelB,nowMs:0}),0);
const move=(b,key,action,nowMs)=>{const r=applyOfficialLiveAction(b,key,action,nowMs);
 assert.equal(r.ok,true,JSON.stringify({key,action,reason:r.reason}));return r.battle;};
test('Perforante passa per il 20% oltre la scudiera, non bypassa il 100%',()=>{
 let b=game(3),base=game(3);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:10};
 base.sides.A.numeric.hand[0]={...base.sides.A.numeric.hand[0],value:10};
 base=move(base,'A',{type:'numeric',index:0,target:'ship'},1);
 assert.equal(base.sides.B.escorts[0].hp,18);
 assert.equal(base.sides.B.defense.shield.hp,52);
 b.sides.A.special.hand[0].type='shot-piercing';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.B.escorts[0].hp,19);
 assert.equal(b.sides.B.defense.shield.hp,51);
});
test('Soppressione evita soltanto la prima scudiera, la seconda continua a proteggere',()=>{
 let b=game(5);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:10};
 b.sides.A.special.hand[0].type='tactic-suppress';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.B.escorts[0].hp,20);
 assert.equal(b.sides.B.escorts[1].hp,18);
 assert.equal(b.sides.B.defense.shield.hp,52);
});
test('Ionico si applica soltanto dopo colpo dannoso e dimezza la prossima intercettazione',()=>{
 let b=game(3);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:10};
 b.sides.A.special.hand[0].type='shot-ion';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.B.escorts[0].hp,18);
 assert.equal(b.sides.B.ionized,true);
 b=finishOfficialLiveTurn(b,3);
 b=finishOfficialLiveTurn(b,4);
 b.sides.A.numeric.hand[0]={...b.sides.A.numeric.hand[0],value:10};
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},5);
 assert.equal(b.sides.B.escorts[0].hp,17);
 assert.equal(b.sides.B.ionized,false);
});
