import test from 'node:test';
import assert from 'node:assert/strict';
import {findOfficialLiveMathProgress,findOfficialLiveVitalCompletion,
 officialLiveMathDeadEnd}
 from './officialLiveAiPlanning.js';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,chooseOfficialLiveAiAction,
 applyOfficialLiveAction,finishOfficialLiveTurn} from './officialLiveDuelEngine.js';
import {exposeMotherPart} from './vitalDefense.js';
import {tacticalShipSignatures} from './tacticalShipSignatures.js';

const c=(value,suit)=>({value,suit});
const TIMES={kind:'mathGate',op:'times',target:12,allowedCardCounts:[2,3]};
const seven=[c(3,'♣'),c(5,'♥'),c(7,'♠'),c(8,'♣'),c(9,'♦'),c(11,'♥'),c(13,'♣')];
test('IA matematica: partner fisico nel proprio mazzo permette un deposito valido',()=>{
 assert.equal(findOfficialLiveVitalCompletion(TIMES,[],seven),null);
 assert.equal(findOfficialLiveMathProgress(TIMES,[],seven,[c(4,'♦')]),0);
 assert.equal(findOfficialLiveMathProgress(TIMES,[],seven,[]),null,
  'non crea la carta partner quando non la possiede');
 assert.equal(findOfficialLiveMathProgress(TIMES,[seven[0]],seven.slice(1),[c(4,'♦')]),null,
  'dopo la prima carta aspetta quella giusta anziché sprecare slot');
});
test('IA matematica: tratta formule alternative e non altera Poker o firme 3-only',()=>{
 const any=tacticalShipSignatures('E01').command;
 const gate=any.options.find(o=>o.kind==='mathGate');
 const hand=[c(1,'♠'),c(11,'♥'),c(13,'♣')],deck=[c(4,'♦')];
 assert.equal(findOfficialLiveMathProgress(any,[],hand,deck),null,
  'la differenza 5 di E01 non ha partner nel pool');
 assert.equal(findOfficialLiveMathProgress(TIMES,[],[c(3,'♣')],[c(4,'♦')]),0);
 assert.equal(findOfficialLiveMathProgress({...TIMES,allowedCardCounts:[3]},
  [],[c(3,'♣')],[c(4,'♦')]),null);
 assert.equal(findOfficialLiveMathProgress({kind:'poker',pattern:'fourKind'},
  [],[c(4,'♥')],[c(4,'♣')]),null);
 assert.equal(gate.op,'minus');
});
test('IA LIVE: da 3♣ in mano e 4♦ realmente pescata completa il motore in due turni',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'C01',shipB:'N00',levelA:1,levelB:1,nowMs:0
 }),0);
 b.turn=2;b.round=1;b.activeSide='B';
 b.sides.A.defense.shield.hp=45;
 const exposed=exposeMotherPart(b.sides.A.defense,'engine');
 assert.equal(exposed.exposed,true);b.sides.A.defense=exposed.defense;
 const pile=b.sides.B.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const picked=seven.map(x=>{
  const found=all.find(y=>x.value===y.value&&x.suit===y.suit);
  assert.ok(found,'carta realmente presente nel mazzo '+x.value+x.suit);
  return found;
 });
 const ids=new Set(picked.map(x=>x.id));pile.hand=picked;
 const next=all.find(x=>x.value===4&&x.suit==='♦');
 assert.ok(next);
 pile.deck=[next,...all.filter(x=>!ids.has(x.id)&&x.id!==next.id)];
 pile.discard=[];
 const first=chooseOfficialLiveAiAction(b);
 assert.deepEqual({type:first.type,target:first.target,vitalId:first.vitalId,index:first.index},
  {type:'numeric',target:'vital',vitalId:'engine',index:0});
 const a=applyOfficialLiveAction(b,'B',first,1);
 assert.equal(a.ok,true,a.reason);b=a.battle;
 assert.equal(b.vitalBuilds.B.engine.length,1);
 assert.equal(b.sides.A.defense.parts.engine.hp,10);
 assert.equal(b.sides.B.numeric.hand.length,6);
 b=finishOfficialLiveTurn(b,2);b=finishOfficialLiveTurn(b,3);
 assert.equal(b.activeSide,'B');
 assert.equal(b.sides.B.numeric.hand.length,7);
 const second=chooseOfficialLiveAiAction(b);
 assert.equal(second.type,'numeric');assert.equal(second.target,'vital');
 assert.equal(b.sides.B.numeric.hand[second.index].id,next.id);
 const fin=applyOfficialLiveAction(b,'B',second,4);
 assert.equal(fin.ok,true,fin.reason);
 assert.equal(fin.battle.sides.A.defense.parts.engine.hp,0);
 assert.equal(fin.battle.vitalBuilds.B.engine.length,0);
 const cards=[...fin.battle.sides.B.numeric.hand,...fin.battle.sides.B.numeric.deck,
  ...fin.battle.sides.B.numeric.discard];
 assert.equal(cards.length,52);
 assert.equal(new Set(cards.map(x=>x.id)).size,52);
});

test('IA: quando il mazzo non contiene più i partner, scarta la vecchia firma; con partner accessibili la conserva',()=>{
 const stored=[c(3,'♣')],hand=[c(5,'♥'),c(7,'♠'),c(9,'♦')];
 assert.equal(officialLiveMathDeadEnd(TIMES,stored,hand,[]),true);
 assert.equal(officialLiveMathDeadEnd(TIMES,stored,hand,[c(4,'♦')]),false);
 assert.equal(officialLiveMathDeadEnd(TIMES,stored,hand,[],[c(4,'♦')]),false,
  'partner già scartato resta ottenibile dopo rimescolamento autentico');
 assert.equal(officialLiveMathDeadEnd(TIMES,stored,hand,[],[c(8,'♦')]),true,
  'senza alcun partner nemmeno negli scarti il progetto è irrealizzabile');
 assert.equal(officialLiveMathDeadEnd(TIMES,stored,hand,[c(2,'♦'),c(2,'♠')]),false,
  'tre carte 3x2x2 sono una soluzione reale valida');
 assert.equal(officialLiveMathDeadEnd(TIMES,[],hand,[]),false);
 const any={kind:'any',options:[TIMES,{kind:'poker',pattern:'royalFlush'}]};
 assert.equal(officialLiveMathDeadEnd(any,stored,hand,[]),false,
  'non si elimina una costruzione Poker opzionale come fosse un calcolo');
});
test('IA LIVE: conserva una firma quando il partner resta recuperabile dagli scarti',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'C01',shipB:'N00',levelA:1,levelB:1,nowMs:0
 }),0);
 b.turn=2;b.activeSide='B';b.round=1;
 b.sides.A.defense.shield.hp=45;
 const exposure=exposeMotherPart(b.sides.A.defense,'engine');
 b.sides.A.defense=exposure.defense;
 const pile=b.sides.B.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const one=all.find(x=>x.value===3&&x.suit==='♣');
 assert.ok(one);
 const hand=all.filter(x=>x.id!==one.id&&![2,4].includes(x.value)).slice(0,6);
 const chosen=[one,...hand],chosenIds=new Set(chosen.map(x=>x.id));
 pile.hand=chosen;
 pile.deck=all.filter(x=>!chosenIds.has(x.id)&&![2,4].includes(x.value));
 pile.discard=all.filter(x=>!chosenIds.has(x.id)&&[2,4].includes(x.value));
 const placed=applyOfficialLiveAction(b,'B',
  {type:'numeric',target:'vital',vitalId:'engine',index:0},1);
 assert.equal(placed.ok,true);b=placed.battle;
 assert.equal(b.vitalBuilds.B.engine.length,1);
 const intent=chooseOfficialLiveAiAction(b);
 assert.notEqual(intent.type,'clearVital',
  'le numeriche partner nei veri scarti possono essere ripescate');
 const next=applyOfficialLiveAction(b,'B',intent,2);
 assert.equal(next.ok,true,next.reason);b=next.battle;
 assert.equal(b.vitalBuilds.B.engine.length,1,
  'il deposito rimane in attesa di pesca fisica futura');
 const allNow=[...b.sides.B.numeric.hand,...b.sides.B.numeric.deck,
  ...b.sides.B.numeric.discard,...b.vitalBuilds.B.engine];
 assert.equal(allNow.length,52);
 assert.equal(new Set(allNow.map(x=>x.id)).size,52);
});


test('IA: la numerica negli scarti torna davvero nel mazzo e completa il vitale',()=>{
 let b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'C01',shipB:'N00',levelA:1,levelB:1,nowMs:0
 }),0);
 b.turn=2;b.round=1;b.activeSide='B';
 b.sides.A.defense.shield.hp=45;
 const exposed=exposeMotherPart(b.sides.A.defense,'engine');
 assert.equal(exposed.exposed,true);b.sides.A.defense=exposed.defense;
 const pile=b.sides.B.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const desired=[c(3,'♣'),c(5,'♥'),c(7,'♠'),c(8,'♣'),
  c(9,'♦'),c(11,'♥'),c(13,'♣')];
 const hand=desired.map(v=>{
  const found=all.find(x=>x.value===v.value&&x.suit===v.suit);
  assert.ok(found);return found;
 });
 const partner=all.find(x=>x.value===4&&x.suit==='♦');
 assert.ok(partner);
 const handIds=new Set(hand.map(x=>x.id));
 pile.hand=hand;pile.deck=[];
 pile.discard=[partner,...all.filter(x=>!handIds.has(x.id)&&x.id!==partner.id)];
 assert.equal(pile.discard.length,45);
 const first=chooseOfficialLiveAiAction(b);
 assert.equal(first.type,'numeric');
 assert.equal(first.target,'vital');
 assert.equal(b.sides.B.numeric.hand[first.index].value,3);
 const deposited=applyOfficialLiveAction(b,'B',first,1);
 assert.equal(deposited.ok,true,deposited.reason);b=deposited.battle;
 assert.equal(b.vitalBuilds.B.engine.length,1);
 assert.notEqual(chooseOfficialLiveAiAction(b).type,'clearVital');
 b=finishOfficialLiveTurn(b,2);
 b=finishOfficialLiveTurn(b,3);
 assert.equal(b.activeSide,'B');
 assert.ok((b.sides.B.numeric.recycleEvents||0)>0,'rimescolamento reale, nessuna carta nuova');
 assert.equal(b.sides.B.numeric.hand.some(x=>x.id===partner.id),true);
 const last=chooseOfficialLiveAiAction(b);
 assert.equal(last.target,'vital');
 assert.equal(last.vitalId,'engine');
 assert.equal(b.sides.B.numeric.hand[last.index].id,partner.id);
 const final=applyOfficialLiveAction(b,'B',last,4);
 assert.equal(final.ok,true,final.reason);
 assert.equal(final.battle.sides.A.defense.parts.engine.hp,0);
 const cards=[...final.battle.sides.B.numeric.hand,...final.battle.sides.B.numeric.deck,
  ...final.battle.sides.B.numeric.discard,...['engine','weapons','shieldGenerator','command'].flatMap(id=>final.battle.vitalBuilds.B[id])];
 assert.equal(cards.length,52);
 assert.equal(new Set(cards.map(x=>x.id)).size,52);
});
