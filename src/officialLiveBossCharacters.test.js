import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn} from './officialLiveDuelEngine.js';
const game=(level=1,enemy='N00')=>createOfficialLiveDuel(createTacticalDuel({
 shipA:'N00',shipB:enemy,levelA:level,levelB:1,nowMs:0}),0);
const move=(b,key,action,at)=>{const r=applyOfficialLiveAction(b,key,action,at);
 assert.equal(r.ok,true,JSON.stringify({key,action,reason:r.reason}));return r.battle;};
test('Personaggio Matriarca applica Corrosione soltanto su reale danno barriera',()=>{
 let b=game();
 b.sides.A.special.hand[0].type='boss-character-3';
 b=move(b,'A',{type:'special',index:0,slot:'character'},1);
 assert.equal(b.sides.B.corroded,false);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},2);
 assert.equal(b.sides.B.corroded,true);
});
test('Personaggio Idra: rigenera 4 veri HP nel turno successivo al colpo subito',()=>{
 let b=game();
 b.sides.A.special.hand[0].type='boss-character-11';
 b=move(b,'A',{type:'special',index:0,slot:'character'},1);
 b=finishOfficialLiveTurn(b,2);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.A.defense.shield.hp,52);
 b=finishOfficialLiveTurn(b,4);
 assert.equal(b.sides.A.defense.shield.hp,56);
 assert.equal(b.sides.A.bossCharacter.regenerated,true);
});
test('Personaggio Generatore: +5 Sincronia soltanto dopo una firma vitale vera',()=>{
 let b=game(1,'C01');b.sides.B.defense.shield.hp=45;
 b.sides.A.special.hand[0].type='boss-character-14';
 b=move(b,'A',{type:'special',index:0,slot:'character'},1);
 b=move(b,'A',{type:'expose',vitalId:'engine'},2);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},3);
 assert.equal(b.sides.A.sync,0);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},4);
 assert.equal(b.sides.A.sync,30);
});
test('Personaggio Risonanza: scudiera potenziata solo dopo colpo reale della madre',()=>{
 let b=game(3);
 b.sides.A.special.hand[0].type='boss-character-17';
 b.sides.A.numeric.hand[1]={...b.sides.A.numeric.hand[1],value:13};
 b=move(b,'A',{type:'special',index:0,slot:'character'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},2);
 const before=b.sides.B.defense.shield.hp;
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'escort-0'},3);
 assert.equal(before-b.sides.B.defense.shield.hp,14);
});
test('Personaggio Crono: la carta Contromisura deve davvero bloccare un vitale',()=>{
 let b=game(1,'C01');b.sides.B.defense.shield.hp=45;
 b=finishOfficialLiveTurn(b,1);
 b.sides.B.special.hand[0].type='boss-character-6';
 b.sides.B.special.hand[1].type='tactic-counter';
 b=move(b,'B',{type:'special',index:0,slot:'character'},2);
 b=move(b,'B',{type:'special',index:0,slot:'trap-0'},3);
 b=finishOfficialLiveTurn(b,4);
 b=move(b,'A',{type:'expose',vitalId:'engine'},5);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},6);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},7);
 assert.equal(b.sides.B.sync,8);
 assert.ok(b.history.some(e=>e.kind==='counter'));
});
