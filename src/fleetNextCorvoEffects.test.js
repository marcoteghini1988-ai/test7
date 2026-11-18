import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,exclusiveUnlocked,eligibleExclusives,effectiveDeck,cardFacePath} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,effectUnavailableReason,
 protectingFleetUnits} from './fleetNext/combat.js';
import {mountModule} from './fleetNext/auroraEngine.js';
import {corvoModuleActive} from './fleetNext/corvoEngine.js';
import {isTrapCard} from './fleetNext/simpleEffects.js';
import {projectFleetSlots,fleetEventText} from './fleetNext/battlePresentation.js';

const IDS=['nx-c03-01','nx-c03-02','nx-c03-03','nx-c03-04','ex-c03-01',
 'nx-c03-06','nx-c03-07','nx-c03-08','nx-c03-09','nx-c03-10'];
function battle({shipA='C03',shipB='C03',levelA=shipMaxLevel(shipA),levelB=shipMaxLevel(shipB)}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,deckA:[],deckB:[],
  mode:'pvp',seed:3030});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=[];side.discard=[];}
 return b;
}
function turn(b,who='A',hand=[],order={},indices=null){
 b.turn=who;b.sides[who].hand=[...hand];
 const enemy=b.sides[who==='A'?'B':'A'];
 const part=enemy.ships[0].parts.find(x=>x.hp>0&&!x.destroyed);
 const result=resolveFleetNextTurn(b,who,{
  cards:indices??hand.map((_,i)=>i),partId:part?.id,targetKind:'part',
  targetId:part?.id,pass:true,...order
 },1000+b.ply*30000);
 assert.equal(result.ok,true,result.reason);return result;
}
function escort(side,index=0){return side.escorts[index];}
function machine(side,id='target-machine',hp=3){
 const unit={id,slot:0,name:id,hp,maxHp:hp,power:1,destroyed:false,
  disabledUntilPly:0,jammedUntilPly:0,sourceCardId:'prog-machine-striker'};
 side.machines.push(unit);return unit;
}
function protect(side,kind,unit,charges=1){
 const source='test-protection-'+kind+'-'+unit.id;
 side.defenses.push({id:source,source,hidden:false,untilPly:20});
 side.protections.push({id:source,source,kind:'protect',remaining:charges,untilPly:20,
  ...(kind==='escort'?{target:'escort',escortSlot:unit.slot}:
   kind==='machine'?{target:'machine',machineSlot:unit.slot}:
   {target:'part',partId:unit.id})});
}

test('Corvo: catalogo di 10 esclusive senza doppioni, livelli e immagini legacy',()=>{
 assert.equal(new Set(IDS).size,10);
 for(const id of IDS){
  assert.equal(card(id).shipId,'C03');
  assert.notEqual(card(id).playable,false,id);
  assert.equal(exclusiveUnlocked(id,'C03',shipMaxLevel('C03')),true,id);
  assert.equal(exclusiveUnlocked(id,'C02',5),false,id);
  assert.equal(cardFacePath(id),null,id);
 }
 for(let level=1;level<=shipMaxLevel('C03');level++){
  assert.equal(IDS.filter(id=>exclusiveUnlocked(id,'C03',level)).length,4+EXCLUSIVE_UNLOCK_MILESTONES['C03'].filter(n=>n<=level).length);
  assert.equal(eligibleExclusives('C03',level).filter(c=>c.shipId==='C03').length,4+EXCLUSIVE_UNLOCK_MILESTONES['C03'].filter(n=>n<=level).length);
 }
 assert.equal(IDS.filter(id=>effectiveDeck([],'C03',shipMaxLevel('C03')).includes(id)).length,10);
});
test('Antenna montata silenzia il primo bersaglio danneggiato senza toglierne copertura',()=>{
 const b=battle();const unit=escort(b.sides.B);
 const mounted=mountModule(b.sides.A,card('nx-c03-01'));
 assert.equal(mounted.ok,true,mounted.reason);
 const result=turn(b,'A',[],{pass:false,targetKind:'escort',targetId:unit.id,escortSlot:unit.slot});
 const enemy=result.battle.sides.B,after=escort(enemy);
 assert.ok(after.hp<unit.hp);
 assert.equal(after.silencedUntilPly,2);
 assert.ok(protectingFleetUnits(enemy,result.battle.ply).some(x=>x.id===after.id));
 assert.ok(result.events.some(e=>e.cardId==='nx-c03-01'&&e.text?.includes('silenziata')));
});
test('Dardo silenzia solo dopo un colpo che infligge danno',()=>{
 const b=battle();const unit=escort(b.sides.B);
 const r=turn(b,'A',['nx-c03-02'],{pass:false,targetKind:'escort',targetId:unit.id});
 assert.equal(r.shot.escortDamage,1);
 assert.equal(escort(r.battle.sides.B).silencedUntilPly,2);
});
test('Dardo bloccato da una Difesa non applica il silenzio',()=>{
 const b=battle();const unit=escort(b.sides.B);protect(b.sides.B,'escort',unit);
 const r=turn(b,'A',['nx-c03-02'],{pass:false,targetKind:'escort',targetId:unit.id});
 assert.equal(r.shot.escortDamage,0);
 assert.ok(!escort(r.battle.sides.B).silencedUntilPly);
});
test('Canale di riserva richiede supporto e Centralina e annulla un silenzio',()=>{
 const b=battle({levelA:1,levelB:1});
 assert.equal(effectUnavailableReason(card('nx-c03-03'),b.sides.A,b),'');
 const first=escort(b.sides.A);
 let next=turn(b,'A',['nx-c03-03']).battle;
 assert.ok(next.sides.A.defenses.some(d=>d.id==='nx-c03-03'&&!d.hidden));
 const r=turn(next,'B',['nx-c03-02'],{pass:false,targetKind:'escort',targetId:first.id});
 assert.equal(r.shot.escortDamage,1);
 assert.ok(!escort(r.battle.sides.A).silencedUntilPly);
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id==='nx-c03-03'));
 assert.ok(r.events.some(e=>e.cardId==='nx-c03-03'&&e.kind==='block'));
 const without=battle();without.sides.A.ships[0].parts.find(p=>p.id==='command').destroyed=true;
 assert.match(effectUnavailableReason(card('nx-c03-03'),without.sides.A,without),/Centralina/);
});
test('Eco di ritorno resta coperta e annulla solo il disturbo, non il danno',()=>{
 const b=battle({levelA:1,levelB:1});
 let next=turn(b,'A',['nx-c03-04']).battle;
 const own=escort(next.sides.A);
 assert.equal(isTrapCard(card('nx-c03-04')),true);
 assert.ok(next.sides.A.defenses.some(d=>d.id==='nx-c03-04'&&d.hidden));
 const r=turn(next,'B',['nx-c03-02'],{pass:false,targetKind:'escort',targetId:own.id});
 assert.equal(r.shot.escortDamage,1);
 assert.ok(!escort(r.battle.sides.A).silencedUntilPly);
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id==='nx-c03-04'));
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-c03-04'));
});
test('Il Comandante sposta la prima carta solo dopo un silenzio realmente applicato',()=>{
 const b=battle();let next=turn(b,'A',['ex-c03-01']).battle;
 next=turn(next,'B',[]).battle;
 next.sides.A.deck=['nx-c03-07','nx-c03-08',...Array(8).fill('nx-c03-03')];
 const target=escort(next.sides.B);
 const r=turn(next,'A',['nx-c03-02'],{pass:false,targetKind:'escort',targetId:target.id,corvoBottomTop:true});
 assert.equal(r.battle.sides.A.corvo.commanderPeekPly,2);
 assert.ok(r.events.some(e=>e.kind==='private-scan'&&e.cardId==='ex-c03-01'&&e.peekCardId==='nx-c03-07'));
 assert.ok(r.battle.sides.A.hand.includes('nx-c03-08'));
 assert.ok(r.battle.sides.A.deck.includes('nx-c03-07'));
 assert.ok(!r.battle.sides.A.hand.includes('nx-c03-07'));
 assert.ok(r.events.some(e=>e.kind==='private-scan'&&e.text?.includes('sotto')));
});
test('Analisi di frequenza rivela una trappola solo al giocatore, la lascia in campo e ricambia',()=>{
 const b=battle();b.turn='B';
 let next=turn(b,'B',['nx-c03-04']).battle;
 next.sides.A.deck=['nx-c03-07','nx-c03-08',...Array(10).fill('nx-c03-03')];
 const r=turn(next,'A',['nx-c03-06','nx-c03-02'],{
  corvoExchangeCardId:'nx-c03-02'
 },[0]);
 const scan=r.events.find(e=>e.kind==='private-scan'&&e.cardId==='nx-c03-06');
 assert.equal(scan.peekCardId,'nx-c03-04');
 assert.equal(scan.privateTo,'A');
 assert.ok(!fleetEventText(scan,'B').includes('Eco di ritorno'));
 assert.ok(r.battle.sides.B.defenses.some(d=>d.id==='nx-c03-04'));
 assert.ok(r.battle.sides.A.hand.includes('nx-c03-07'));
 assert.ok(!r.battle.sides.A.hand.includes('nx-c03-02'));
});
test('Cortocircuito colpisce una sola macchina e ne sospende la protezione',()=>{
 const b=battle({levelA:2}),unit=machine(b.sides.B);
 const r=turn(b,'A',['nx-c03-07'],{pass:false,targetKind:'machine',targetId:unit.id});
 assert.equal(r.shot.machineDamage,1);
 const after=r.battle.sides.B.machines[0];
 assert.equal(after.disabledUntilPly,2);
 assert.ok(!protectingFleetUnits(r.battle.sides.B,r.battle.ply).some(x=>x.id===unit.id));
});
test('Cortocircuito bloccato non disattiva la macchina',()=>{
 const b=battle({levelA:2}),unit=machine(b.sides.B);
 protect(b.sides.B,'machine',unit);
 const r=turn(b,'A',['nx-c03-07'],{pass:false,targetKind:'machine',targetId:unit.id});
 assert.equal(r.shot.machineDamage,0);
 assert.ok(!r.battle.sides.B.machines[0].disabledUntilPly);
});
test('Richiamo inverso anticipa il primo supporto di grado due, senza duplicarne il turno',()=>{
 const b=battle({levelA:3});
 const first=escort(b.sides.A);
 assert.equal(first.grade,2);
 let r=turn(b,'A',['nx-c03-08']);
 assert.equal(r.battle.sides.A.corvo.skippedPassives[first.id],true);
 assert.ok(r.battle.sides.B.buffs.some(x=>x.kind==='jam'));
 let next=turn(r.battle,'B',[]).battle;
 r=turn(next,'A',[]);
 assert.ok(r.events.some(e=>e.text?.includes('attivazione già anticipata')));
 assert.equal(r.battle.sides.A.corvo.skippedPassives[first.id],undefined);
});
test('Interruttore si sacrifica contro un blocco temporaneo del Generatore senza curare HP',()=>{
 const b=battle();const mounted=mountModule(b.sides.A,card('nx-c03-09'));
 assert.equal(mounted.ok,true,mounted.reason);
 const generator=b.sides.A.ships[0].parts.find(p=>p.id==='generator');
 generator.hp=Math.max(1,generator.hp-1);
 const hp=generator.hp;generator.disabledUntilPly=3;
 const r=turn(b,'A',[]);
 assert.equal(r.battle.sides.A.modules.utility,null);
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').hp,hp);
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').disabledUntilPly,0);
 assert.ok(r.events.some(e=>e.cardId==='nx-c03-09'));
});
test('Blackout blocca solo un modulo d’arma raggiungibile e conserva la sua integrità',()=>{
 const b=battle();b.sides.B.escorts=[];b.sides.B.machines=[];
 const m=mountModule(b.sides.B,card('nx-c03-01'));
 assert.equal(m.ok,true,m.reason);
 const r=turn(b,'A',['nx-c03-10']);
 const after=r.battle.sides.B.modules.weapon;
 assert.equal(after.hp,2);
 assert.equal(after.disabledUntilPly,2);
 assert.equal(corvoModuleActive(after,r.battle.ply),false);
 assert.ok(r.battle.sides.B.ships[0].parts.some(p=>p.id==='weapons'&&p.hp>0));
});
test('Blackout non raggiunge moduli dietro i supporti vivi',()=>{
 const b=battle();assert.equal(mountModule(b.sides.B,card('nx-c03-01')).ok,true);
 assert.match(effectUnavailableReason(card('nx-c03-10'),b.sides.A,b),/protetto/);
});
test('Non si può disattivare lo stesso modulo in due propri turni consecutivi',()=>{
 const b=battle();b.sides.B.escorts=[];
 assert.equal(mountModule(b.sides.B,card('nx-c03-01')).ok,true);
 let next=turn(b,'A',['nx-c03-10']).battle;
 next=turn(next,'B',[]).battle;
 assert.match(effectUnavailableReason(card('nx-c03-10'),next.sides.A,next),/immune/);
});
test('Attacchi Corvo: un solo comando e divieto di attacco passato',()=>{
 const b=battle();const target=escort(b.sides.B);
 b.sides.A.hand=['nx-c03-02','nx-c03-07'];
 const error=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:false,
  targetKind:'escort',targetId:target.id},1000);
 assert.equal(error.ok,false);
 assert.match(error.reason,/solo comando offensivo Corvo/);
 const passed=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(passed.ok,false);
 assert.match(passed.reason,/comando offensivo/);
});
test('Nessuna modifica ai vitali e alle condizioni di vittoria con carte Corvo',()=>{
 const b=battle({levelA:1,levelB:1});
 assert.deepEqual(b.sides.A.ships[0].parts.map(x=>x.id),
  ['weapons','generator','bridge','command']);
 assert.equal(b.phase,'playing');assert.equal(b.winner,null);
 assert.ok(IDS.every(id=>card(id)?.effectSpec?.type==='corvo'));
 const own=projectFleetSlots({defenses:[],attackSlots:[],defenseSlots:[]},['nx-c03-04'],'A','A');
 const other=projectFleetSlots({defenses:[],attackSlots:[],defenseSlots:[]},['nx-c03-04'],'B','A');
 assert.equal(own[2].hidden,true);assert.deepEqual(other[2],{hidden:true,pending:false});
});
