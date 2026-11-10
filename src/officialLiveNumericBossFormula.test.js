import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction} from './officialLiveDuelEngine.js';
import {liveNumericBossArmFormula,liveNumericBossNativeBonus,
 liveNumericBossAfterShot,liveNumericBossAfterVital} from './officialLiveNumericBossPassives.js';
const game=(id,level=9,shipB='N00')=>createTacticalDuel({
 shipA:'C01',shipB,levelA:1,levelB:1,nowMs:0,bossNumericDeckA:{id,level}});
const P=(value,suit)=>({value,suit});
const plus=[P(4,'♥'),P(5,'♣')];
function arm(b,vitalId,op,cards,damage=10){
 return liveNumericBossArmFormula(b.sides.A,b.sides.B,{vitalId,op,cards,damage});
}
test('Frequenza multipla Risonanza: due semi reali L4+, bonus solo su successivo sparo',()=>{
 const b=game('planet_char_17',9),a=b.sides.A,z=b.sides.B;
 assert.equal(arm(b,'engine','plus',plus)?.percentage,7);
 const bonus=liveNumericBossNativeBonus(a,50,'W02',null,1);
 assert.equal(bonus.formulaBonus.extra,3);
 assert.equal(bonus.damage,53);
 liveNumericBossAfterShot(a,0,'W02',bonus.bonus,1,bonus.formulaBonus);
 assert.ok(a.bossNumericDeck.liveFormulaBoost,'non consumare su colpo nullo');
 liveNumericBossAfterShot(a,10,'W02',bonus.bonus,1,bonus.formulaBonus);
 assert.equal(a.bossNumericDeck.liveFormulaBoost,null);
 assert.equal(a.bossNumericDeck.liveFormulaRemainder,50);
 assert.equal(liveNumericBossNativeBonus(a,50,'W02',null,1).formulaBonus,null);
 const low=game('planet_char_17',3);
 assert.equal(arm(low,'engine','plus',plus),null,'prima di L4 non sbloccare Frequenza');
 assert.equal(arm(b,'engine','plus',[P(3,'♥'),P(3,'♣')]),null,
  'nessuna formula inventata');
});
test('Leviatano Profondita: solo 3 numeriche e abilita sbloccata dal livello 4',()=>{
 const three=[P(1,'♣'),P(3,'♥'),P(5,'♦')];
 const low=game('planet_char_8',3);
 assert.equal(arm(low,'engine','plus',three),null);
 const good=game('planet_char_8',6);
 assert.equal(arm(good,'engine','plus',plus),null);
 assert.equal(arm(good,'engine','plus',three)?.percentage,7);
});
test('Nucleo Magmatico Forgia: soltanto moltiplicazione autentica e livello 7+',()=>{
 const cards=[P(3,'♣'),P(4,'♦')];
 const low=game('planet_char_19',6);
 assert.equal(arm(low,'shieldGenerator','times',cards),null);
 const high=game('planet_char_19',9);
 assert.equal(arm(high,'shieldGenerator','times',cards)?.percentage,8);
 assert.equal(arm(high,'shieldGenerator','minus',cards),null);
});
test('Idra: precisione per divisione, Teste alternate soltanto su bersaglio diverso',()=>{
 const b=game('planet_char_11',6,'C02'),a=b.sides.A;
 assert.equal(arm(b,'weapons','divide',[P(8,'♥'),P(4,'♦')])?.percentage,7);
 liveNumericBossAfterVital(a,10,true,1,'weapons');
 assert.equal(a.bossNumericDeck.lastVital,'weapons');
 assert.equal(arm(b,'engine','plus',[P(5,'♥'),P(6,'♦')])?.percentage,8);
 liveNumericBossAfterVital(a,0,false,1,'engine');
 assert.equal(a.bossNumericDeck.lastVital,'weapons','colpo nullo non cambia bersaglio');
 const low=game('planet_char_11',3,'C02');
 assert.equal(arm(low,'engine','plus',[P(5,'♥'),P(6,'♦')]),null);
});
test('Ombre Oscurita terminale: due propri vitali KO e livello 4+',()=>{
 const b=game('planet_char_9',6),a=b.sides.A;
 assert.equal(arm(b,'engine','plus',plus),null);
 a.defense.parts.engine.hp=0;
 a.defense.parts.weapons.hp=0;
 assert.equal(arm(b,'engine','plus',plus)?.percentage,8);
 const low=game('planet_char_9',3);
 low.sides.A.defense.parts.engine.hp=0;
 low.sides.A.defense.parts.weapons.hp=0;
 assert.equal(arm(low,'engine','plus',plus),null);
});
test('Risonanza LIVE: formula valida arma bonus sul colpo W02, mai sulla distruzione vitale',()=>{
 let b=createOfficialLiveDuel(game('planet_char_17',9),0);
 const pile=b.sides.A.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const wanted=[P(4,'♥'),P(5,'♣'),P(13,'♥')].map(q=>
  all.find(c=>c.value===q.value&&c.suit===q.suit));
 assert.ok(wanted.every(Boolean));
 const pick=new Set(wanted.map(x=>x.id));
 pile.hand=[...wanted,...all.filter(c=>!pick.has(c.id)).slice(0,4)];
 const inHand=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!inHand.has(c.id));pile.discard=[];
 b.sides.B.defense.shield.hp=45;
 const move=(act,at)=>{
  const res=applyOfficialLiveAction(b,'A',act,at);
  assert.equal(res.ok,true,JSON.stringify({act,reason:res.reason}));
  b=res.battle;
 };
 move({type:'expose',vitalId:'engine'},1);
 move({type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 move({type:'numeric',index:0,target:'vital',vitalId:'engine'},3);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.B.defense.shield.hp,45);
 assert.equal(b.sides.A.bossNumericDeck.liveFormulaBoost?.percentage,7);
 move({type:'numeric',index:0,target:'ship',shipId:'mother'},4);
 assert.equal(b.history.findLast(e=>e.kind==='shot')?.damage,27);
 assert.equal(b.sides.A.bossNumericDeck.liveFormulaBoost,null);
 assert.equal(b.actionUsed.numeric,3);
});
