import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,finishOfficialLiveTurn,
 supportedLiveSpecial} from './officialLiveDuelEngine.js';
const game=(ship='N00')=>createOfficialLiveDuel(createTacticalDuel({
 shipA:ship,shipB:'N00',levelA:1,levelB:1,nowMs:0}),0);
const move=(b,key,action,t)=>{const r=applyOfficialLiveAction(b,key,action,t);
 assert.equal(r.ok,true,JSON.stringify({action,key,reason:r.reason}));return r.battle;};
const equip=(b,id)=>{b.sides.A.epic.entitlements=[id];b.sides.A.special.hand[0].type=id;return b;};
test('I sei Epici collezionabili sono giocabili nel LIVE solo con la carta autentica',()=>{
 for(const id of ['epic_item_1','epic_item_3','epic_item_6','epic_item_7','epic_item_8','epic_item_9'])
  assert.equal(supportedLiveSpecial(id),true);
});
test('Möbius richiede vitali critici e usa una numerica realmente presente nel mazzo',()=>{
 let b=equip(game(),'epic_item_1');
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,'mobius_not_critical');
 assert.equal(b.sides.A.special.hand.length,5);
 for(const part of Object.values(b.sides.A.defense.parts))part.hp=3;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 const desired=b.sides.A.numeric.deck[2].id;
 assert.equal(b.sides.A.epic.peek.length,10);
 b=move(b,'A',{type:'epic-choice',index:2},3);
 assert.equal(b.actionUsed.special,1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},4);
 b=finishOfficialLiveTurn(b,5);
 b=finishOfficialLiveTurn(b,6);
 assert.equal(b.sides.A.numeric.hand.at(-1).id,desired);
 assert.equal(b.sides.A.epic.liveChoiceCommitted,true);
 assert.equal(b.sides.A.epic.liveChoiceApplied,true);
 assert.equal(applyOfficialLiveAction(b,'A',{type:'epic-choice',index:0},7).reason,
  'epic_choice_unavailable');
});
test('Astrolabio: sceglie una delle prossime due numeriche senza duplicazioni',()=>{
 let b=equip(game(),'epic_item_3');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.epic.peek.length,2);
 const desired=b.sides.A.numeric.deck[1].id;
 b=move(b,'A',{type:'epic-choice',index:1},2);
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},3);
 b=finishOfficialLiveTurn(b,4);
 b=finishOfficialLiveTurn(b,5);
 assert.equal(b.sides.A.numeric.hand.at(-1).id,desired);
});
test('Pendolo: solo danno vero concede un ricambio dalla mano e non altera limiti numeriche',()=>{
 let b=equip(game(),'epic_item_6');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.epic.exchangeCredits,0);
 b=finishOfficialLiveTurn(b,2);
 b=move(b,'B',{type:'numeric',index:0,target:'ship'},3);
 assert.equal(b.sides.A.epic.exchangeCredits,1);
 const before=b.sides.A.numeric.hand[0].id;
 b=finishOfficialLiveTurn(b,4);
 b=move(b,'A',{type:'epic-recycle',index:0},5);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.actionUsed.special,0);
 assert.equal(b.sides.A.epic.exchangeCredits,0);
 assert.equal(b.sides.A.numeric.hand.length,7);
 assert.equal(b.sides.A.numeric.hand.some(c=>c.id===before),false);
});
test('Monolite: non si consuma senza surriscaldamento; ripulisce il calore reale',()=>{
 let b=equip(game(),'epic_item_7');
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,'monolith_not_needed');
 b.sides.A.heated=true;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},2);
 assert.equal(b.sides.A.heated,false);
 assert.equal(b.sides.A.special.hand.length,4);
});
test('Calice: converte soltanto danni autentici in Sincronia e anteprima, senza accreditare wallet',()=>{
 let b=equip(game('C01'),'epic_item_8');
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:2,target:'ship'},2); // 5♥ 10 HP
 assert.equal(b.sides.A.sync,22); // normale +20, Calice +2
 assert.equal(b.sides.A.epic.dustPreview,1);
 assert.ok(b.history.some(e=>e.kind==='epic_calice'));
});

function matriceRun(enabled=true){
 let b=game('C02');
 const pile=b.sides.A.numeric;
 const all=[...pile.hand,...pile.deck,...pile.discard];
 const chosen=[{value:7,suit:'♥'},{value:7,suit:'♣'}, {value:13,suit:'♦'}]
  .map(x=>all.find(c=>c.value===x.value&&c.suit===x.suit));
 assert.ok(chosen.every(Boolean),'Tre carte autentiche, senza duplicati');
 const consumed=new Set(chosen.map(c=>c.id));
 pile.hand=[...chosen,...all.filter(c=>!consumed.has(c.id)).slice(0,4)];
 const nowInHand=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!nowInHand.has(c.id));pile.discard=[];
 for(const p of Object.values(b.sides.A.defense.parts))p.hp=3;
 b.sides.B.defense.shield.hp=45;
 if(enabled){
  b=equip(b,'epic_item_9');
  b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 }
 b=move(b,'A',{type:'expose',vitalId:'command'},2);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'command'},3);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'command'},4);
 assert.equal(b.sides.B.defense.parts.command.hp,0,'Coppia valida distrugge solo vitale');
 assert.equal(b.sides.B.defense.shield.hp,45,'Matrice non modifica la barriera sulla firma');
 if(enabled){
  assert.equal(b.sides.A.epic.matriceArmed,true);
  assert.equal(b.sides.A.epic.matriceSpent,false);
 }
 b=move(b,'A',{type:'numeric',index:0,target:'ship'},5);
 return b;
}
test('Matrice: richiede HP critici e vera madre con arma pesante Accumulo',()=>{
 let b=equip(game('C02'),'epic_item_9');
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,
  'matrice_not_critical');
 assert.equal(b.sides.A.special.hand.length,5);
 b=equip(game('N00'),'epic_item_9');
 for(const part of Object.values(b.sides.A.defense.parts))part.hp=3;
 assert.equal(applyOfficialLiveAction(b,'A',{type:'special',index:0,slot:'open-0'},1).reason,
  'epic_requires_heavy');
 assert.equal(b.sides.A.special.hand.length,5);
});
test('Matrice: +2 esatti soltanto alla successiva salva Accumulo vera dopo Coppia reale',()=>{
 const base=matriceRun(false);
 const boosted=matriceRun(true);
 const hitBase=base.history.find(e=>e.kind==='shot');
 const hitBoosted=boosted.history.find(e=>e.kind==='shot');
 assert.ok(hitBase&&hitBoosted);
 assert.equal(hitBoosted.weaponId,'W03');
 assert.equal(hitBoosted.damage-hitBase.damage,2);
 assert.equal(boosted.sides.A.epic.matriceArmed,false);
 assert.equal(boosted.sides.A.epic.matriceSpent,true);
 assert.equal(boosted.actionUsed.numeric,3);
 assert.equal(boosted.actionUsed.special,1);
 assert.equal(boosted.sides.A.epic.used.includes('epic_item_9'),true);
 assert.equal(boosted.history.some(e=>e.kind==='epic_matrice_hit'),true);
});
test('Matrice senza Coppia/Tris valido non concede bonus ad Accumulo',()=>{
 let b=equip(game('C02'),'epic_item_9');
 for(const part of Object.values(b.sides.A.defense.parts))part.hp=3;
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 assert.equal(b.sides.A.epic.matriceArmed,false);
 assert.equal(b.sides.A.epic.matriceSpent,false);
 b=move(b,'A',{type:'numeric',index:3,target:'ship'},2);
 assert.equal(b.history.some(e=>e.kind==='epic_matrice_hit'),false);
});
