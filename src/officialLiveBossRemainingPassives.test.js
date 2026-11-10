import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction,chooseOfficialLiveAiAction} from './officialLiveDuelEngine.js';
import {liveNumericBossStatusDuration,liveNumericBossExpireStatus,
 liveNumericBossRecycleCooldown,liveNumericBossRememberDeposit,
 liveNumericBossArmFormula} from './officialLiveNumericBossPassives.js';
const card=(value,suit)=>({value,suit});
const setup=(deckA=null,deckB=null)=>
 createOfficialLiveDuel(createTacticalDuel({shipA:'C01',shipB:'N00',
  levelA:1,levelB:1,nowMs:0,bossNumericDeckA:deckA,bossNumericDeckB:deckB}),0);
function hand(b,wanted){
 const pile=b.sides.A.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const cards=wanted.map(p=>{
  const found=all.find(c=>c.value===p.value&&c.suit===p.suit);
  assert.ok(found,'carta autentica '+p.value+p.suit);
  return found;
 });
 const selected=new Set(cards.map(c=>c.id));
 assert.equal(selected.size,wanted.length);
 pile.hand=[...cards,...all.filter(c=>!selected.has(c.id)).slice(0,7-cards.length)];
 const ids=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!ids.has(c.id));pile.discard=[];
 assert.equal(pile.hand.length+pile.deck.length,52);
}
function move(b,key,action,ms){
 const result=applyOfficialLiveAction(b,key,action,ms);
 assert.equal(result.ok,true,JSON.stringify({key,action,reason:result.reason}));
 return result.battle;
}
test('Pressione marziana L3: solo vero deposito sullo stesso vitale in due turni propri',()=>{
 let b=setup({id:'planet_char_2',level:3});
 hand(b,[card(4,'♥'),card(5,'♣'),card(13,'♥')]);
 b.sides.B.defense.shield.hp=45;
 b=move(b,'A',{type:'expose',vitalId:'engine'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 assert.equal(b.sides.A.bossNumericDeck.liveVitalDeposit.consecutiveTurns,1);
 b=move(b,'A',{type:'end'},3);
 b=move(b,'B',{type:'end'},4);
 const five=b.sides.A.numeric.hand.findIndex(c=>c.value===5&&c.suit==='♣');
 b=move(b,'A',{type:'numeric',index:five,target:'vital',vitalId:'engine'},5);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.A.bossNumericDeck.liveFormulaBoost?.percentage,7);
 assert.equal(b.sides.A.bossNumericDeck.liveVitalDeposit,null);
 assert.ok(b.history.some(e=>e.kind==='boss_numeric_formula'));
 const thirteen=b.sides.A.numeric.hand.findIndex(c=>c.value===13&&c.suit==='♥');
 b=move(b,'A',{type:'numeric',index:thirteen,target:'ship',shipId:'mother'},6);
 assert.equal(b.history.findLast(e=>e.kind==='shot')?.damage,27);
 assert.equal(b.sides.A.bossNumericDeck.liveFormulaBoost,null);
});
test('Pressione marziana: due numeriche nello stesso turno non danno bonus, e bersaglio differente azzera la sequenza',()=>{
 const b=setup({id:'planet_char_2',level:3}),a=b.sides.A,z=b.sides.B;
 liveNumericBossRememberDeposit(a,{vitalId:'engine',turn:1});
 liveNumericBossRememberDeposit(a,{vitalId:'engine',turn:1});
 const x=liveNumericBossArmFormula(a,z,{
  vitalId:'engine',op:'plus',cards:[card(4,'♥'),card(5,'♣')],damage:10});
 assert.equal(x,null);
 assert.equal(liveNumericBossRememberDeposit(a,{vitalId:'weapons',turn:3}).consecutiveTurns,1);
 assert.equal(liveNumericBossRememberDeposit(a,{vitalId:'engine',turn:5}).consecutiveTurns,1);
});
test('Isolamento ionico: 15/25/35% riduce solo durata degli stati reali, non corazza o vitali',()=>{
 const a=setup(null,{id:'planet_char_7',level:1}).sides.B;
 const b=setup(null,{id:'planet_char_7',level:2}).sides.B;
 const c=setup(null,{id:'planet_char_7',level:3}).sides.B;
 assert.equal(liveNumericBossStatusDuration(a,'ion'),1.7);
 assert.equal(liveNumericBossStatusDuration(b,'ion'),1.5);
 assert.equal(liveNumericBossStatusDuration(c,'ion'),1.3);
 assert.equal(liveNumericBossStatusDuration(c,'corrosion'),2);
 assert.equal(liveNumericBossStatusDuration(setup().sides.B,'ion'),2);
 c.ionized=true;c.ionizedUntilTurn=2.3;
 liveNumericBossExpireStatus(c,2);
 assert.equal(c.ionized,true);
 liveNumericBossExpireStatus(c,3);
 assert.equal(c.ionized,false);
});
test('Sentinella LIVE: il colpo Ionico autentico rispetta la durata ridotta',()=>{
 let b=setup(null,{id:'planet_char_7',level:3});
 hand(b,[card(5,'♥')]);
 b.sides.A.special.hand[0].type='shot-ion';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},2);
 assert.equal(b.sides.B.ionized,true);
 assert.ok(Math.abs(b.sides.B.ionizedUntilTurn-2.3)<1e-9);
 b=move(b,'A',{type:'end'},3);
 b=move(b,'B',{type:'end'},4);
 const i=b.sides.A.numeric.hand.findIndex(c=>c.suit==='♥');
 b=move(b,'A',{type:'numeric',index:i,target:'ship',shipId:'mother'},5);
 assert.equal(b.sides.B.ionized,false,'status scaduto prima del terzo turno');
});
test('Generatore: Schermatura instabile riduce sia Ionico sia Corrosione 15/25/35%',()=>{
 for(const [level,percent] of [[1,15],[2,25],[3,35]]){
  const defender=setup(null,{id:'planet_char_14',level}).sides.B;
  const reduced=2*(1-percent/100);
  assert.ok(Math.abs(liveNumericBossStatusDuration(defender,'ion')-reduced)<1e-9);
  assert.ok(Math.abs(liveNumericBossStatusDuration(defender,'corrosion')-reduced)<1e-9);
 }
 let b=setup(null,{id:'planet_char_14',level:3});
 hand(b,[card(5,'♥')]);
 b.sides.A.special.hand[0].type='shot-corrosion';
 b=move(b,'A',{type:'special',index:0,slot:'open-0'},1);
 b=move(b,'A',{type:'numeric',index:0,target:'ship',shipId:'mother'},2);
 assert.equal(b.sides.B.corroded,true);
 assert.ok(Math.abs(b.sides.B.corrodedUntilTurn-2.3)<1e-9);
 b=move(b,'A',{type:'end'},3);
 b=move(b,'B',{type:'end'},4);
 const i=b.sides.A.numeric.hand.findIndex(c=>c.suit==='♥');
 b=move(b,'A',{type:'numeric',index:i,target:'ship',shipId:'mother'},5);
 assert.equal(b.sides.B.corroded,false);
});
test('Afrodite: sblocca Ricambio armonico in 13/11/9 secondi, solo con vero mazzo boss',()=>{
 for(const [level,cooldown] of [[1,13000],[2,11000],[3,9000],
  [4,9000],[6,9000]]){
  const a=setup({id:'planet_char_3',level}).sides.A;
  assert.equal(liveNumericBossRecycleCooldown(a),cooldown);
 }
 assert.equal(liveNumericBossRecycleCooldown(setup().sides.A),null);
 assert.equal(applyOfficialLiveAction(setup(),'A',
  {type:'boss-recycle',recycleIndices:[0]},1).reason,'boss_recycle_unavailable');
});
test('Afrodite LIVE: 2 carte REALI sostituite, cooldown vincolante, azioni 3+2 invariate',()=>{
 let b=setup({id:'planet_char_3',level:3});
 const old=new Set(b.sides.A.numeric.hand.slice(0,2).map(c=>c.id));
 const all=[...b.sides.A.numeric.hand,...b.sides.A.numeric.deck,...b.sides.A.numeric.discard].map(c=>c.id);
 assert.equal(applyOfficialLiveAction(b,'A',{type:'boss-recycle',recycleIndices:[0,0]},100).reason,
  'recycle_selection_required');
 assert.equal(b.sides.A.numeric.recycleEvents||0,0);
 b=move(b,'A',{type:'boss-recycle',recycleIndices:[0,1]},1000);
 assert.equal(b.sides.A.numeric.hand.length,7);
 assert.equal(b.sides.A.numeric.discard.length,2);
 assert.equal(b.sides.A.numeric.hand.some(c=>old.has(c.id)),false);
 assert.equal(b.sides.A.numeric.recycleEvents,1);
 assert.equal(b.sides.A.bossNumericDeck.liveNextRecycleAtMs,10000);
 assert.deepEqual(b.actionUsed,{numeric:0,special:0});
 assert.equal(applyOfficialLiveAction(b,'A',{type:'boss-recycle',recycleIndices:[0]},9999).reason,
  'boss_recycle_cooldown');
 b=move(b,'A',{type:'boss-recycle',recycleIndices:[0]},10000);
 assert.equal(b.sides.A.numeric.recycleEvents,2);
 assert.deepEqual(b.actionUsed,{numeric:0,special:0});
 const after=[...b.sides.A.numeric.hand,...b.sides.A.numeric.deck,...b.sides.A.numeric.discard].map(c=>c.id);
 assert.equal(new Set(after).size,52);
 assert.deepEqual(after.slice().sort(),all.slice().sort());
});

test('IA Afrodite: scambia solo vere carte quando non può caricare madre né scudiere',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({shipA:'N00',shipB:'C01',
  levelA:1,levelB:1,nowMs:0,bossNumericDeckB:{id:'planet_char_3',level:3}}),0);
 b=move(b,'A',{type:'end'},1);
 const pile=b.sides.B.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const chosen=all.filter(c=>c.suit!=='♥').slice(0,7);
 assert.equal(chosen.length,7);
 const ids=new Set(chosen.map(c=>c.id));
 pile.hand=chosen;pile.deck=all.filter(c=>!ids.has(c.id));pile.discard=[];
 const intent=chooseOfficialLiveAiAction(b);
 assert.equal(intent.type,'boss-recycle');
 assert.deepEqual(intent.recycleIndices,[0,1]);
 const after=applyOfficialLiveAction(b,'B',intent,b.aiReadyAtMs);
 assert.equal(after.ok,true);
 assert.equal(after.battle.sides.B.numeric.recycleEvents,1);
 assert.equal(after.battle.sides.B.numeric.hand.length,7);
 assert.equal(after.battle.actionUsed.numeric,0);
 assert.equal(after.battle.actionUsed.special,0);
 assert.equal(after.battle.sides.B.bossNumericDeck.liveNextRecycleAtMs,
  b.aiReadyAtMs+9000);
});
