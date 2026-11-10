import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,TACTICAL_STARTER_TYPES} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,
 chooseOfficialLiveAiAction} from './officialLiveDuelEngine.js';

function ready({ship='C01',boss=2,levelA=1,mode='campaign'}={}){
 const tactical=createTacticalDuel({
  shipA:'N00',shipB:ship,levelA,levelB:1,nowMs:0,mode,
  bossPlanetB:boss,specialDeckB:[...TACTICAL_STARTER_TYPES]
 });
 const b=createOfficialLiveDuel(tactical,0);
 b.activeSide='B';b.turn=2;b.round=1;
 return b;
}
function equipSpecial(b,type){
 const pile=b.sides.B.special;
 const all=[...pile.hand,...pile.deck,...pile.discard];
 const chosen=all.find(c=>c.type===type);
 assert.ok(chosen,'speciale autentica nel mazzo da 24: '+type);
 const without=all.filter(c=>c.id!==chosen.id);
 pile.hand=[chosen,...without.slice(0,4)];
 const selected=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!selected.has(c.id));
 pile.discard=[];
 assert.equal(pile.hand.length+pile.deck.length,24);
 assert.equal(new Set([...pile.hand,...pile.deck].map(c=>c.id)).size,24);
}
const act=(b,action,nowMs)=>{
 const out=applyOfficialLiveAction(b,'B',action,nowMs);
 assert.equal(out.ok,true,JSON.stringify({action,reason:out.reason}));
 return out.battle;
};
test('Boss Tharsis: la speciale Cinetica autentica viene giocata PRIMA del colpo immediato',()=>{
 let b=ready();equipSpecial(b,'tactic-kinetic');
 const first=chooseOfficialLiveAiAction(b);
 assert.equal(first.type,'special');
 assert.equal(b.sides.B.special.hand[first.index].type,'tactic-kinetic');
 assert.equal(first.slot,'open-0');
 const before=b.sides.A.defense.shield.hp;
 b=act(b,first,1);
 assert.equal(b.actionUsed.special,1);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.pendingShot.B.power,6);
 const next=chooseOfficialLiveAiAction(b);
 assert.equal(next.type,'numeric','non spende altre speciali prima di scaricare il bonus');
 assert.equal(next.target,'ship');
 const card=b.sides.B.numeric.hand[next.index];
 assert.equal(card.suit,'♥','C01 usa soltanto H');
 b=act(b,next,2);
 assert.equal(b.actionUsed.numeric,1);
 assert.equal(b.history.filter(e=>e.kind==='shot'&&e.by==='B').length,1);
 assert.ok(b.sides.A.defense.shield.hp<before);
 assert.equal(b.pendingShot.B,null,'il bonus si consuma dopo il proiettile');
 const without=ready(),i=without.sides.B.numeric.hand.findIndex(c=>c.id===card.id);
 assert.ok(i>=0);
 const plain=act(without,{type:'numeric',index:i,target:'ship',shipId:'mother'},2);
 assert.equal(plain.sides.A.defense.shield.hp-b.sides.A.defense.shield.hp,6,
  'il +6 segue solo il colpo reale e non regala attacchi');
});
test('Boss con arma Accumulo non carica una speciale quando ancora non può sparare',()=>{
 let b=ready({ship:'C02'});equipSpecial(b,'tactic-kinetic');
 const choice=chooseOfficialLiveAiAction(b);
 assert.equal(choice.type,'numeric');
 assert.equal(choice.target,'ship');
 b=act(b,choice,1);
 assert.equal(b.history.some(e=>e.kind==='shot'),false);
 assert.equal(b.history.some(e=>e.kind==='weapon_charge'),true);
 assert.equal(b.actionUsed.special,0);
});
test('Speciali Perforante e Soppressione non vengono anticipate senza scudiere nemiche',()=>{
 for(const type of ['shot-piercing','tactic-suppress']){
  const b=ready({levelA:1});equipSpecial(b,type);
  const choice=chooseOfficialLiveAiAction(b);
  assert.notEqual(choice.type,'special',type+' non ha un bersaglio utile in apertura');
 }
});
test('Quando uno scudo è già alla soglia, il boss mantiene il piano sui vitali',()=>{
 let b=ready();equipSpecial(b,'tactic-kinetic');
 b.sides.A.defense.shield.hp=45;
 const choice=chooseOfficialLiveAiAction(b);
 assert.deepEqual(choice,{type:'expose',vitalId:'weapons'},
  'Tharsis segue la dottrina esistente e non forza un potenziamento');
});
test('PvP finto non riceve il comportamento esclusivo dei boss nemici',()=>{
 const b=ready({boss:null,mode:'pvp'});equipSpecial(b,'tactic-kinetic');
 const choice=chooseOfficialLiveAiAction(b);
 assert.equal(choice.type,'numeric');
 assert.equal(choice.target,'ship');
 assert.equal(b.sides.B.bossPlanetId,null);
});
