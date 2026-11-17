import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardFacePath,eligibleExclusives,effectiveDeck,exclusiveUnlocked,
 GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,
 effectUnavailableReason} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {stormModuleActive,stormUnits} from './fleetNext/stormEngine.js';

const IDS=['nx-e02-01','nx-e02-02','nx-e02-03','nx-e02-04','ex-e02-01',
 'nx-e02-06','nx-e02-07','nx-e02-08','nx-e02-09','nx-e02-10'];
const baseDeck=[];
function make({shipA='E02',shipB='C03',levelA=5,levelB=5}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:baseDeck,deckB:baseDeck,mode:'pvp',seed:312});
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(20).fill('gen-216');s.discard=[];
 }
 return b;
}
const other=(b,who)=>b.sides[who==='A'?'B':'A'];
function target(kind,unit){
 return {pass:false,targetKind:kind,targetId:unit.id,
  ...(kind==='escort'?{escortSlot:unit.slot}:kind==='machine'?{machineSlot:unit.slot}:
   kind==='part'?{partId:unit.id}:{})};
}
function play(b,who='A',hand=[],options={pass:true},indices=null){
 b.turn=who;
 b.sides[who].hand=[...hand];
 const part=other(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const chosen=indices??hand.map((_,i)=>i);
 const r=resolveFleetNextTurn(b,who,{cards:chosen,partId:part?.id,...options},
  b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function mount(side,id){
 const result=mountModule(side,card(id));
 assert.equal(result.ok,true,result.reason);
 return result.entry;
}
function machine(id,slot=0,hp=8,maxHp=hp){
 return {id,slot,name:id,sourceCardId:'prog-machine-striker',
  hp,maxHp,destroyed:false,power:0,disabledUntilPly:0,jammedUntilPly:0};
}
function shield(side,unit,source='shield-1'){
 side.defenses.push({id:'gen-227',source,hidden:false,untilPly:20});
 side.protections.push({id:'gen-227',source,kind:'protect',remaining:1,
  target:'escort',escortSlot:unit.slot,untilPly:20});
}

test('Tempesta ha esattamente dieci esclusive native e sblocchi 6+1+1+1+1',()=>{
 assert.equal(IDS.length,10);
 assert.equal(new Set(IDS).size,10);
 for(let level=1;level<=5;level++){
  assert.equal(eligibleExclusives('E02',level).filter(x=>IDS.includes(x.id)).length,5+level);
 }
 for(const id of IDS){
  const c=card(id);assert.ok(c,id);assert.equal(c.shipId,'E02');
  assert.equal(c.effectSpec.type,'storm');
  assert.equal(c.playable===false,false);
  assert.equal(cardFacePath(id),null);
  assert.equal(exclusiveUnlocked(id,'E02',5),true);
  assert.equal(exclusiveUnlocked(id,'E01',5),false);
 }
 assert.equal(effectiveDeck([],'E02',5).filter(id=>IDS.includes(id)).length,10);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.values(GENERAL_CARDS).filter(c=>c.kind==='character').length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='character').length,17);
});
test('Bobina a catena: un attacco reale ferisce due unità, ma non crea catene ricorsive',()=>{
 let b=make();mount(b.sides.A,'nx-e02-01');
 const [first,second]=b.sides.B.escorts;
 first.hp=12;first.maxHp=12;second.hp=12;second.maxHp=12;
 const x=play(b,'A',[],{...target('escort',first),
  stormChainTargetKind:'escort',stormChainTargetId:second.id});
 assert.ok(x.battle.sides.B.escorts[0].hp<12);
 assert.equal(x.battle.sides.B.escorts[1].hp,11);
 assert.equal(x.events.filter(e=>e.kind==='storm-chain').length,1);
 assert.equal(x.events.filter(e=>e.cardId==='nx-e02-01'&&e.kind==='impact').length,1);
 assert.equal(x.battle.sides.A.storm.chainFiredPly,0);
});
test('Bobina: il secondo bersaglio già distrutto non viene sostituito gratuitamente',()=>{
 const b=make();mount(b.sides.A,'nx-e02-01');
 const [first,second]=b.sides.B.escorts;second.hp=0;second.destroyed=true;
 const x=play(b,'A',[],target('escort',first));
 assert.ok(x.shot.escortDamage>0);
 assert.equal(x.events.filter(e=>e.kind==='storm-chain').length,0);
});
test('Onda a pettine distribuisce un colpo per ognuna di quattro unità, senza vitali',()=>{
 const b=make();b.sides.B.machines.push(machine('m1',0),machine('m2',1));
 const initial=b.sides.B.escorts.map(x=>x.hp),parts=b.sides.B.ships[0].parts.map(x=>x.hp);
 const x=play(b,'A',['nx-e02-02'],target('escort',b.sides.B.escorts[0]));
 assert.equal(x.shot.targets.length,4);
 assert.deepEqual(x.battle.sides.B.escorts.map(x=>x.hp),initial.map(h=>h-1));
 assert.deepEqual(x.battle.sides.B.machines.map(x=>x.hp),[7,7]);
 assert.deepEqual(x.battle.sides.B.ships[0].parts.map(x=>x.hp),parts);
});
test('Onda a pettine lascia a ogni unità la propria Difesa',()=>{
 const b=make();const [a,z]=b.sides.B.escorts;shield(b.sides.B,a);
 const x=play(b,'A',['nx-e02-02'],target('escort',a));
 assert.equal(x.battle.sides.B.escorts[0].hp,a.hp);
 assert.equal(x.battle.sides.B.escorts[1].hp,z.hp-1);
 assert.equal(x.shot.targets.length,1);
});
test('Fulmine di rimbalzo colpisce la seconda unità solo se il primo bersaglio è distrutto',()=>{
 const b=make();const [a,z]=b.sides.B.escorts;
 a.hp=1;
 const hp=z.hp;
 const x=play(b,'A',['nx-e02-03'],{...target('escort',a),
  stormSecondKind:'escort',stormSecondId:z.id});
 assert.equal(x.battle.sides.B.escorts[0].destroyed,true);
 assert.ok(x.battle.sides.B.escorts[1].hp<hp);
 assert.equal(x.shot.targets.length,2);
});
test('Fulmine senza eliminazione del primo bersaglio non genera secondo colpo',()=>{
 const b=make();const [a,z]=b.sides.B.escorts;
 const hp=z.hp;
 const x=play(b,'A',['nx-e02-03'],{...target('escort',a),
  stormSecondKind:'escort',stormSecondId:z.id});
 assert.equal(x.battle.sides.B.escorts[1].hp,hp);
 assert.equal(x.shot.targets.length,1);
});
test('Fronte di Tempesta intercetta una macchina una volta e trasferisce il danno esatto',()=>{
 let b=make();b.sides.B.machines.push(machine('storm-machine',0));
 const escort=b.sides.B.escorts[0];
 b=play(b,'B',['nx-e02-04'],{pass:true,stormFrontEscortId:escort.id}).battle;
 const hp=b.sides.B.escorts[0].hp;
 const x=play(b,'A',[],target('machine',b.sides.B.machines[0]));
 assert.equal(x.battle.sides.B.machines[0].hp,8);
 assert.ok(x.battle.sides.B.escorts[0].hp<hp);
 assert.equal(x.battle.sides.B.defenses.some(d=>d.id==='nx-e02-04'),false);
 assert.equal(x.events.filter(e=>e.kind==='storm-front').length,1);
});
test('Fronte di Tempesta non può essere giocato senza macchina alleata',()=>{
 const b=make();
 const r=effectUnavailableReason(card('nx-e02-04'),b.sides.A,b);
 assert.match(r,/macchina/);
});
test('Ripresa del tuono infligge tre danni allo stesso bersaglio ferito nel precedente turno proprio',()=>{
 let b=make(),e=b.sides.B.escorts[0];e.hp=12;e.maxHp=12;
 b=play(b,'A',[],target('escort',e)).battle;
 b=play(b,'B',[],{pass:true}).battle;
 const hp=b.sides.B.escorts[0].hp;
 const x=play(b,'A',['nx-e02-06'],target('escort',b.sides.B.escorts[0]));
 assert.equal(x.battle.sides.B.escorts[0].hp,hp-3);
 assert.ok(x.events.some(e=>e.kind==='storm-reprise'&&e.repeat));
});
test('Ripresa del tuono senza segno del turno precedente rimane un solo danno',()=>{
 const b=make();const e=b.sides.B.escorts[0],hp=e.hp;
 const x=play(b,'A',['nx-e02-06'],target('escort',e));
 assert.equal(x.battle.sides.B.escorts[0].hp,hp-1);
 assert.ok(x.events.some(e=>e.kind==='storm-reprise'&&!e.repeat));
});
test('Scarica selettiva: due colpi sul primo, uno perfora una Difesa sul secondo',()=>{
 const b=make();const [first,second]=b.sides.B.escorts;
 shield(b.sides.B,second);
 const h1=first.hp,h2=second.hp;
 const x=play(b,'A',['nx-e02-07'],{...target('escort',first),
  stormSecondKind:'escort',stormSecondId:second.id});
 assert.equal(x.battle.sides.B.escorts[0].hp,h1-2);
 assert.equal(x.battle.sides.B.escorts[1].hp,h2-1);
 assert.ok(x.events.some(e=>e.kind==='pierce'));
 assert.equal(x.battle.sides.B.protections.length,0);
});
test('Scarica selettiva ignora una sola protezione, non due',()=>{
 const b=make();const [first,second]=b.sides.B.escorts;
 shield(b.sides.B,second,'s1');shield(b.sides.B,second,'s2');
 const hp=second.hp;
 const x=play(b,'A',['nx-e02-07'],{...target('escort',first),
  stormSecondKind:'escort',stormSecondId:second.id});
 assert.equal(x.battle.sides.B.escorts[1].hp,hp);
 assert.equal(x.events.filter(e=>e.kind==='pierce').length,1);
});
test('Rete parafulmine blocca il colpo sul secondo supporto dopo il primo danno reale',()=>{
 let b=make({shipA:'C02',shipB:'E02'});
 b=play(b,'B',['nx-e02-08'],{pass:true}).battle;
 const hp=b.sides.B.escorts.map(e=>e.hp);
 const x=play(b,'A',['nx-c02-10'],{...target('escort',b.sides.B.escorts[0]),
  prismaSecondTargetKind:'escort',prismaSecondTargetId:b.sides.B.escorts[1].id});
 assert.equal(x.battle.sides.B.escorts[0].hp,hp[0]-1);
 assert.equal(x.battle.sides.B.escorts[1].hp,hp[1]);
 assert.equal(x.battle.sides.B.defenses.some(d=>d.id==='nx-e02-08'),false);
 assert.ok(x.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-e02-08'));
});
test('Rete parafulmine non scatta se una Difesa blocca il colpo sul secondo supporto',()=>{
 let b=make({shipA:'C02',shipB:'E02'});
 b=play(b,'B',['nx-e02-08'],{pass:true}).battle;
 shield(b.sides.B,b.sides.B.escorts[1]);
 const x=play(b,'A',['nx-c02-10'],{...target('escort',b.sides.B.escorts[0]),
  prismaSecondTargetKind:'escort',prismaSecondTargetId:b.sides.B.escorts[1].id});
 assert.equal(x.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-e02-08'),false);
 assert.equal(x.battle.sides.B.defenses.some(d=>d.id==='nx-e02-08'),true);
});
test('Condensatore: dopo tre bersagli feriti carica solo per il turno successivo',()=>{
 let b=make();b.sides.B.machines.push(machine('m1',0));
 b=play(b,'A',['nx-e02-09','nx-e02-02'],target('escort',b.sides.B.escorts[0])).battle;
 assert.equal(b.sides.A.storm.charge,true);
 assert.equal(b.sides.A.storm.chargeStoredPly,0);
 assert.ok(b.lastEvents.some(e=>e.kind==='storm-charge'));
 b=play(b,'B',[],{pass:true}).battle;
 const e=b.sides.B.escorts[0],hp=e.hp;
 const x=play(b,'A',[],target('escort',e));
 assert.equal(x.battle.sides.B.escorts[0].hp,hp-3);
 assert.equal(x.battle.sides.A.storm.charge,false);
 assert.equal(x.events.filter(e=>e.kind==='storm-heavy').length,1);
});
test('Condensatore non crea carica da colpi bloccati o dallo stesso bersaglio ripetuto',()=>{
 const b=make();mount(b.sides.A,'nx-e02-09');
 const e=b.sides.B.escorts[0];shield(b.sides.B,e);
 const x=play(b,'A',['nx-e02-07'],{...target('escort',e),
  stormSecondKind:'escort',stormSecondId:b.sides.B.escorts[1].id});
 assert.equal(x.battle.sides.A.storm.charge,false);
 assert.ok(x.battle.sides.A.storm.lastHits.length<3);
});
test('Distruggere il Condensatore azzera carica e non genera un attacco gratuito',()=>{
 const b=make();mount(b.sides.A,'nx-e02-09');
 b.sides.A.storm={charge:true,chargeStoredPly:0,lastChargePly:0};
 removeModule(b.sides.A,'utility');
 assert.equal(b.sides.A.storm.charge,false);
 assert.equal(b.sides.A.modules.utility,null);
});
test('Quadrante: due colpi su ciascuna di due unità, non quattro bersagli',()=>{
 const b=make();b.sides.B.machines.push(machine('m1',0));
 const [first,second]=b.sides.B.escorts;const hp1=first.hp,hp2=second.hp,hm=b.sides.B.machines[0].hp;
 const x=play(b,'A',['nx-e02-10'],{...target('escort',first),
  stormSecondKind:'escort',stormSecondId:second.id});
 assert.equal(x.shot.targets.length,4);
 assert.equal(x.battle.sides.B.escorts[0].hp,hp1-2);
 assert.equal(x.battle.sides.B.escorts[1].hp,hp2-2);
 assert.equal(x.battle.sides.B.machines[0].hp,hm);
});
test('Quadrante rifiutato se la Centralina è distrutta, senza mutare la partita',()=>{
 const b=make();const p=b.sides.A.ships[0].parts.find(p=>p.id==='command');p.hp=0;p.destroyed=true;
 b.sides.A.hand=['nx-e02-10'];const snapshot=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:false,
  ...target('escort',b.sides.B.escorts[0])},1000);
 assert.equal(r.ok,false);assert.equal(JSON.stringify(b),snapshot);
 assert.match(r.reason,/Centralina|Arsenale|supporti/);
});
test('Capitano ricambia una sola carta autentica se almeno due unità ricevono danni',()=>{
 const b=make();b.sides.B.machines.push(machine('m1',0));
 b.sides.A.deck=['gen-218','gen-235'];
 const h=b.sides.B.escorts[0];
 const x=play(b,'A',['ex-e02-01','nx-e02-02','gen-227'],{...target('escort',h),
  stormCaptainSwap:true,stormCaptainTradeId:'gen-227'},[0,1]);
 assert.equal(x.events.filter(e=>e.kind==='storm-captain').length,1);
 assert.equal(x.battle.sides.A.discard.includes('gen-227'),true);
 assert.ok(x.battle.sides.A.hand.includes('gen-218'));
 assert.equal(x.battle.sides.A.storm.captainUsedPly,0);
});
test('Capitano facoltativo: con due colpi ma senza scelta non scarta nulla',()=>{
 const b=make();
 const x=play(b,'A',['ex-e02-01','nx-e02-02','gen-227'],{
  ...target('escort',b.sides.B.escorts[0]),stormCaptainSwap:false},[0,1]);
 assert.ok(!x.events.some(e=>e.kind==='storm-captain'));
 assert.ok(x.battle.sides.A.hand.includes('gen-227'));
});
test('Bersaglio secondario dichiarato uguale al primo: turno rifiutato immutabilmente',()=>{
 const b=make(),e=b.sides.B.escorts[0];b.sides.A.hand=['nx-e02-07'];
 const snapshot=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],...target('escort',e),
  stormSecondKind:'escort',stormSecondId:e.id},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/Secondo bersaglio/);
 assert.equal(JSON.stringify(b),snapshot);
});
test('IA Tempesta non pesca carte inesistenti e produce un ordine eseguibile',()=>{
 const b=make();b.sides.B.machines.push(machine('m1',0));
 b.sides.A.hand=['nx-e02-02','nx-e02-03','nx-e02-09'];
 const order=autoFleetTurn(b,'A');
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
});
