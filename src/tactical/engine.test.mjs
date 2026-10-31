import {test} from 'node:test';
import assert from 'node:assert/strict';
import E from './engine.js';
function newB(){return E.newBattle(E.freshProfile(),{sector:1});}
test('Motore: le quattro operazioni funzionano e richiedono 2-4 carte',()=>{
 const cards=(...ns)=>ns.map((n,i)=>({id:String(i),value:n}));
 assert.equal(E.evalCards(cards(5,4),'+'),9);
 assert.equal(E.evalCards(cards(7,2),'-'),5);
 assert.equal(E.evalCards(cards(5,4),'×'),20);
 assert.equal(E.evalCards(cards(8,2),'÷'),4);
 assert.equal(E.evalCards(cards(8,3),'÷'),null);
 assert.equal(E.evalCards(cards(1),'+'),null);
 assert.equal(E.evalCards(cards(1,1,1,1,1),'+'),null);
});
test('Ricerca: solo valori realmente raggiungibili',()=>{
 const hand=[{id:'a',value:5},{id:'b',value:4},{id:'c',value:10},{id:'d',value:7}];
 assert.equal(E.solve(hand,'×',20).length,2);
 assert.equal(E.solve(hand,'×',999),null);
});
test('Sacrifici cumulativi: nemico +3 HP, -3 sec, giocatore -3 HP',()=>{
 const p=E.freshProfile(),b=newB();b.enemy.hp=12;b.turnRemaining=54;const hp=b.player.hp;
 for(let i=0;i<3;i++){b.selected=[b.hand[0].id];assert.equal(E.exchange(b,p).ok,true);}
 assert.equal(b.enemy.hp,15);assert.equal(b.turnRemaining,51);assert.equal(b.player.hp,hp-3);assert.equal(b.exchangesTurn,3);
 b.selected=[b.hand[0].id];assert.equal(E.exchange(b,p).ok,false);
});
test('Bersagli indipendenti dalla mano: non sempre risolvibili',()=>{
 const fake=Array.from({length:7},(_,i)=>({id:String(i),value:1}));
 assert.equal(E.solve(fake,'×',50),null);
});
test('Un attacco non valido non passa il turno',()=>{
 const p=E.freshProfile(),b=newB();assert.equal(E.attack(b,p).ok,false);assert.equal(b.phase,'player');
});
test('Un attacco valido danneggia, scarta solo le carte usate e chiude il turno',()=>{
 const p=E.freshProfile(),b=newB();const ids=b.hand.slice(0,2).map(c=>c.id);b.targets[0]={...b.targets[0],op:'+',value:b.hand[0].value+b.hand[1].value,id:'x_core'};b.selected=ids;b.selectedTarget=0;
 const a=E.attack(b,p);assert.equal(a.ok,true);assert.ok(a.damage>=0);assert.ok(ids.every(id=>!b.hand.some(c=>c.id===id)));assert.equal(b.hand.length,7);assert.equal(b.phase,'enemy');
});
test('L’IA risolve il turno e riporta il controllo, o chiude la sconfitta',()=>{
 const p=E.freshProfile(),b=newB();b.phase='enemy';const a=E.enemyTurn(b,p);assert.equal(a.ok,true);assert.ok(['player','defeat'].includes(b.phase));
});
test('La vittoria sblocca la campagna e premia una sola volta',()=>{
 const p=E.freshProfile(),b=newB();b.phase='victory';b.over=true;b.result={win:true,damage:20};const r=E.reward(p,b);assert.ok(r.credits>0);assert.equal(p.unlocked,2);const credits=p.credits;assert.equal(E.reward(p,b),null);assert.equal(p.credits,credits);
});
test('120 settori, sblocchi e potenziamenti',()=>{
 const p=E.freshProfile();assert.equal(E.getSectorInfo(120).boss,true);assert.equal(E.getSectorInfo(120).system,12);const initial=p.credits;assert.equal(E.upgradeFamily(p,'nova').ok,true);assert.ok(p.credits<initial);assert.equal(p.upgrades.nova,2);
});
test('Simulazione di 80 turni casuali non rompe il mazzo né il motore',()=>{
 const p=E.freshProfile(),b=newB();b.enemy.maxHp=10000;b.enemy.hp=10000;
 for(let i=0;i<80&&!b.over;i++){
  b.turnRemaining=60;const choices=b.targets.map((t,k)=>({k,sol:E.solve(b.hand,t.op,t.value)})).filter(x=>x.sol);
  if(choices.length){b.selectedTarget=choices[0].k;b.selected=choices[0].sol;assert.equal(E.attack(b,p).ok,true);}
  else E.passTurn(b);
  if(b.phase==='enemy'){E.enemyTurn(b,p);}
  assert.ok(b.hand.length===7&&b.hand.every(c=>c&&c.id&&c.value));
 }
});
