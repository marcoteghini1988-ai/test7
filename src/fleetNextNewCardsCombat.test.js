import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolveFleetNextTurn,effectUnavailableReason} from './fleetNext/combat.js';
import {card,cardRole,cardCopyLimit,NEXT_COMMON_CARDS} from './fleetNext/rules.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {activeSystemCard,applySystemCard,commandPenalty} from './fleetNext/newCardEffects.js';

function setup(){
 return createFleetNextBattle({
  shipA:'L01',levelA:5,shipB:'L01',levelB:5,
  deckA:['sys-command-minus-c','sys-black-hole'],
  deckB:['sys-weapons-plus-c'],mode:'pvp',seed:52,ruleset:HP_SYNC_RULESET
 });
}
function play(b,who,id,extra={}){
 if(id!=null)b.sides[who].hand=[id,...b.sides[who].hand.filter(x=>x!==id)];
 const result=resolveFleetNextTurn(b,who,{pass:true,cards:id==null?[]:[0],...extra},1000+b.ply*30000);
 assert.equal(result.ok,true,JSON.stringify({id,reason:result.reason}));
 return result.battle;
}
test('Le 33 nuove carte sono riconosciute e Collasso dei Due Campi può avere tre copie',()=>{
 assert.equal(NEXT_COMMON_CARDS.length,33);
 assert.equal(cardCopyLimit('sys-black-hole'),3);
 assert.equal(cardCopyLimit('sys-bridge-plus-l'),2);
 for(const def of NEXT_COMMON_CARDS){
  assert.equal(card(def.id)?.id,def.id);
  assert.equal(def.playable,true,def.id);
  assert.equal(cardRole(def.id),'attack',def.id+' usa lo slot Attacco');
  assert.equal(def.kind,'attack',def.id+' classificata Attacco');
 }
});
test('Le carte Sistema usano lo slot Attacco senza perdere la durata pluriturno',()=>{
 let b=setup();
 b=play(b,'A','sys-command-minus-r');
 assert.ok(b.sides.A.attackSlots.includes('sys-command-minus-r'));
 assert.equal(activeSystemCard(b.sides.B,'command','disable',b.ply)?.id,'sys-command-minus-r');
 b=play(b,'B',null);
 assert.equal(activeSystemCard(b.sides.B,'command','disable',b.ply)?.id,'sys-command-minus-r');
 b=play(b,'A',null);
 assert.equal(activeSystemCard(b.sides.B,'command','disable',b.ply)?.id,'sys-command-minus-r');
});

test('Le nuove carte sono giocabili solo nella nuova modalità HP',()=>{
 const v2=setup(),legacy=createFleetNextBattle({shipA:'L01',levelA:5,shipB:'L01',levelB:5,
  deckA:['sys-command-minus-c'],deckB:[],mode:'pvp',seed:52});
 assert.equal(effectUnavailableReason(card('sys-command-minus-c'),v2.sides.A,v2),'');
 assert.match(effectUnavailableReason(card('sys-command-minus-c'),legacy.sides.A,legacy),/modalità HP/);
});
test('Le 32 carte possono essere eseguite su una nave con quattro sistemi',()=>{
 for(const def of NEXT_COMMON_CARDS.filter(c=>c.effectSpec.type==='systemModifier')){
  let b=setup();
  if(def.effectSpec.operation==='amplify'&&def.systemId==='bridge'){
   assert.ok(b.sides.B.escorts.length>=2);
  }
  b=play(b,'A',def.id);
  const target=def.effectSpec.operation==='disable'?b.sides.B:b.sides.A;
  const applied=activeSystemCard(target,def.systemId,def.effectSpec.operation,b.ply);
  assert.equal(applied?.id,def.id,def.id);
  assert.equal(applied.untilPly,2*def.effectSpec.turns,def.id);
 }
});
test('La durata di sabotaggio si esaurisce dopo i turni avversari indicati',()=>{
 let b=setup();
 b=play(b,'A','sys-command-minus-c');
 assert.equal(activeSystemCard(b.sides.B,'command','disable',b.ply)?.amount,15);
 b=play(b,'B',null);
 assert.equal(activeSystemCard(b.sides.B,'command','disable',b.ply),null);
});
test('Centralina riduce il collegamento e amplificazione compensa il sabotaggio',()=>{
 const b=setup();
 applySystemCard(b.sides.B,card('sys-command-minus-l'),b.ply,'A');
 assert.equal(commandPenalty(b.sides.B,b.ply),40);
 applySystemCard(b.sides.B,card('sys-command-plus-r'),b.ply,'B');
 assert.equal(commandPenalty(b.sides.B,b.ply),20);
});
test('Plancia: sabotaggio limita l’attacco multibersaglio, amplificazione divide i danni',()=>{
 const v2=setup();
 v2.terrain={id:'T10',cardId:null,source:'campaign',expiresPly:null};
 assert.ok(v2.sides.B.escorts.length>=2);
 const targetId=v2.sides.B.escorts[0].id;
 const before=resolveFleetNextTurn(structuredClone(v2),'A',{targetKind:'escort',targetId,cards:[]},1000);
 assert.equal(before.ok,true,before.reason);
 assert.ok(before.shot.targets.length>=2,'la salva iniziale ha due bersagli');
 const sabotaged=structuredClone(v2);
 applySystemCard(sabotaged.sides.B,card('sys-bridge-minus-c'),0,'B');
 const reduced=resolveFleetNextTurn(sabotaged,'A',{targetKind:'escort',targetId,cards:[]},1000);
 assert.equal(reduced.ok,true,reduced.reason);
 assert.equal(reduced.shot.targets.length,1);
 const boosted=structuredClone(v2);
 boosted.terrain={id:null,cardId:null,source:'neutral',expiresPly:null};
 applySystemCard(boosted.sides.A,card('sys-bridge-plus-c'),0,'A');
 const split=resolveFleetNextTurn(boosted,'A',{
  targetKind:'escort',targetId,cards:[],planciaSplitAmount:1
 },1000);
 assert.equal(split.ok,true,split.reason);
 assert.equal(split.shot.targets.length,2);
 assert.notEqual(split.shot.targets[0].id,split.shot.targets[1].id);
});
test('Collasso dei Due Campi scarta tutte le carte attive, inclusi i due alloggiamenti, e non danneggia navi',()=>{
 let b=setup();
 b.terrain={id:'T02',cardId:'gen-test',owner:'A',source:'player',expiresPly:99};
 for(const who of ['A','B']){
  const s=b.sides[who];
  s.defenses=[{id:'gen-216',source:'test:'+who,hidden:true,untilPly:99}];
  s.commander={id:'ex-n00-01',source:'command:'+who,untilPly:99};
  s.modules={weapon:{cardId:'nx-n00-07',hp:2},utility:null};
  s.machines=[{id:'weapon:'+who,slot:0,name:'Arma',hp:3,maxHp:3,
   sourceCardId:'prog-machine-striker',power:1,untilPly:99}];
  applySystemCard(s,card('sys-weapons-plus-r'),0,who);
 }
 const snapshots=Object.fromEntries(['A','B'].map(w=>[w,{
  mother:b.sides[w].ships[0].hp,escorts:b.sides[w].escorts.map(e=>e.hp)
 }]));
 b=play(b,'A','sys-black-hole');
 assert.equal(b.terrain.id,null);
 for(const who of ['A','B']){
  const s=b.sides[who];
  assert.deepEqual(s.machines,[]);
  assert.deepEqual(s.defenses,[]);
  assert.equal(s.commander,null);
  assert.equal(s.modules.weapon,null);
  assert.deepEqual(s.systemCardEffects,[]);
  assert.equal(s.ships[0].hp,snapshots[who].mother);
  assert.deepEqual(s.escorts.map(e=>e.hp),snapshots[who].escorts);
  assert.ok(s.discard.includes('nx-n00-07'));
  assert.ok(s.discard.includes('prog-machine-striker'));
 }
 assert.ok(b.sides.A.discard.includes('gen-test'));
});
