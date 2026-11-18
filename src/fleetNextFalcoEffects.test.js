import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardFacePath,exclusiveUnlocked,eligibleExclusives,effectiveDeck} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,
 effectUnavailableReason,autoFleetTurn,protectingFleetUnits} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {falcoCapacitorActive} from './fleetNext/falcoEngine.js';

const IDS=['nx-r01-01','nx-r01-02','nx-r01-03','nx-r01-04','ex-r01-01',
 'nx-r01-06','nx-r01-07','nx-r01-08','nx-r01-09','nx-r01-10'];
function battle({shipA='R01',shipB='C03',levelA=shipMaxLevel(shipA),levelB=shipMaxLevel(shipB)}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:[],deckB:[],mode:'pvp',seed:501});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
 }
 return b;
}
const opponent=(b,who)=>b.sides[who==='A'?'B':'A'];
function firstUnit(b,who='A'){
 const side=opponent(b,who);
 return [...side.escorts,...side.machines].find(u=>u.hp>0&&!u.destroyed);
}
function otherUnit(b,who='A',exclude=''){
 const side=opponent(b,who);
 return [...side.escorts,...side.machines].find(u=>u.hp>0&&!u.destroyed&&u.id!==exclude);
}
function orderAt(unit,extra={}){
 return {targetKind:'escort',targetId:unit.id,escortSlot:unit.slot,pass:false,...extra};
}
function turn(b,who='A',hand=[],order={},indices=null){
 const side=b.sides[who];b.turn=who;side.hand=[...hand];
 const vital=opponent(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{
  cards:indices??hand.map((_,i)=>i),pass:true,partId:vital?.id,...order
 },b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function nextFalcoTurn(b){
 return turn(b,b.turn,[],{pass:true}).battle;
}
function mount(side,id='nx-r01-01'){
 const r=mountModule(side,card(id));assert.equal(r.ok,true,r.reason);return r.entry;
}
function shieldUnit(side,unit,charges=1){
 const source='test:visible-shield';
 side.defenses.push({source,id:source,hidden:false,untilPly:20});
 side.protections.push({id:source,source,kind:'protect',remaining:charges,
  target:'escort',escortSlot:unit.slot,untilPly:20});
}
function defendOnMother(b){b.sides.A.escorts=[];}

test('Falco Binario: dieci esclusive, quattro iniziali e sei sbloccate nella progressione',()=>{
 assert.equal(new Set(IDS).size,10);
 for(const id of IDS){
  assert.equal(card(id).shipId,'R01');
  assert.notEqual(card(id).playable,false,id);
  assert.equal(exclusiveUnlocked(id,'R01',shipMaxLevel('R01')),true,id);
  assert.equal(exclusiveUnlocked(id,'C03',5),false,id);
  assert.equal(cardFacePath(id),null,id);
  assert.equal(card(id).effectSpec.type,'falco',id);
 }
 for(let level=1;level<=shipMaxLevel('R01');level++){
  assert.equal(IDS.filter(id=>exclusiveUnlocked(id,'R01',level)).length,4+EXCLUSIVE_UNLOCK_MILESTONES['R01'].filter(n=>n<=level).length);
  assert.equal(eligibleExclusives('R01',level).filter(x=>IDS.includes(x.id)).length,4+EXCLUSIVE_UNLOCK_MILESTONES['R01'].filter(n=>n<=level).length);
 }
 assert.equal(IDS.filter(id=>effectiveDeck([],'R01',shipMaxLevel('R01')).includes(id)).length,10);
});
test('Tiro d’assedio: prepara un colpo senza danni immediati né salva gratis',()=>{
 const b=battle(),target=firstUnit(b),before=target.hp;
 const r=turn(b,'A',['nx-r01-02'],orderAt(target));
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.B.escorts[0].hp,before);
 assert.equal(r.battle.sides.A.falco.pending.cardId,'nx-r01-02');
 assert.equal(r.battle.sides.A.falco.pending.releasePly,2);
 assert.ok(!r.battle.sides.A.discard.includes('nx-r01-02'));
 assert.ok(r.events.some(e=>e.kind==='falco-prepared'));
});
test('Tiro d’assedio: rilascio automatico al prossimo turno, tre danni e carta scartata una volta',()=>{
 const b=battle(),target=firstUnit(b),before=target.hp;
 let r=turn(b,'A',['nx-r01-02'],orderAt(target));
 let next=nextFalcoTurn(r.battle);
 r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.B.escorts[0].hp,before-3);
 assert.equal(r.battle.sides.A.falco.pending,null);
 assert.equal(r.battle.sides.A.discard.filter(id=>id==='nx-r01-02').length,1);
 assert.equal(r.events.filter(e=>e.kind==='falco-release').length,1);
});
test('La carta in carica occupa una delle tre giocate del turno di rilascio',()=>{
 const b=battle(),target=firstUnit(b);
 let next=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 next=nextFalcoTurn(next);next.sides.A.hand=['ex-r01-01','nx-r01-01','nx-r01-07'];
 const before=JSON.stringify(next);
 const fail=resolveFleetNextTurn(next,'A',
  {cards:[0,1,2],pass:true},next.ply*30000+1);
 assert.equal(fail.ok,false);
 assert.match(fail.reason,/occupa una delle tre giocate/);
 assert.equal(JSON.stringify(next),before);
});
test('Se il bersaglio viene distrutto prima del rilascio, il colpo si perde senza riassegnazioni',()=>{
 const b=battle(),target=firstUnit(b);
 let next=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 next.sides.B.escorts[0].hp=0;next.sides.B.escorts[0].destroyed=true;
 next=nextFalcoTurn(next);
 const r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,0);
 assert.ok(r.events.some(e=>e.kind==='falco-lost'&&e.text?.includes('distrutto')));
 assert.ok(r.battle.sides.A.discard.includes('nx-r01-02'));
});
test('Arsenale distrutto: la carica non spara e la carta non resta bloccata',()=>{
 let b=battle(),target=firstUnit(b);
 b=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 const weapons=b.sides.A.ships[0].parts.find(p=>p.id==='weapons');
 weapons.hp=0;weapons.destroyed=true;
 b=nextFalcoTurn(b);
 const r=turn(b,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.A.falco.pending,null);
 assert.ok(r.events.some(e=>e.kind==='falco-lost'&&e.text?.includes('Arsenale')));
});
test('Capacitore binario: modulo fisico da due integrità, non scartato al montaggio',()=>{
 const b=battle();
 const r=turn(b,'A',['nx-r01-01'],{pass:true});
 assert.equal(r.battle.sides.A.modules.weapon.cardId,'nx-r01-01');
 assert.equal(r.battle.sides.A.modules.weapon.hp,2);
 assert.ok(!r.battle.sides.A.discard.includes('nx-r01-01'));
 assert.equal(falcoCapacitorActive(r.battle.sides.A,r.battle.ply),true);
});
test('Capacitore conserva una sola carica per un turno aggiuntivo, poi la rilascia',()=>{
 const b=battle(),target=firstUnit(b);
 mount(b.sides.A);
 let next=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 next=nextFalcoTurn(next);
 let r=turn(next,'A',[],{pass:true,falcoHold:true});
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.A.falco.pending.held,true);
 assert.equal(r.battle.sides.A.falco.pending.releasePly,4);
 next=nextFalcoTurn(r.battle);
 r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.A.falco.pending,null);
});
test('Non puoi rinviare la stessa carica due volte',()=>{
 const b=battle(),target=firstUnit(b);mount(b.sides.A);
 let next=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 next=nextFalcoTurn(next);
 next=turn(next,'A',[],{falcoHold:true}).battle;
 next=nextFalcoTurn(next);
 const before=JSON.stringify(next);
 const fail=resolveFleetNextTurn(next,'A',{cards:[],pass:true,falcoHold:true},1000);
 assert.equal(fail.ok,false);
 assert.match(fail.reason,/non può ripetersi/);
 assert.equal(JSON.stringify(next),before);
});
test('Distruggere il Capacitore cancella il colpo trattenuto e lo mette negli scarti',()=>{
 const b=battle(),target=firstUnit(b);mount(b.sides.A);
 let next=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 next=nextFalcoTurn(next);
 next=turn(next,'A',[],{falcoHold:true}).battle;
 const old=next.sides.A.falco.pending.cardId;
 removeModule(next.sides.A,'weapon');
 assert.equal(next.sides.A.falco.pending,null);
 assert.ok(next.sides.A.discard.includes(old));
});
test('Salva di taratura: un danno leggero marca +2 su un colpo già in preparazione',()=>{
 const b=battle(),target=firstUnit(b),before=target.hp;
 let next=turn(b,'A',['nx-r01-02','nx-r01-03'],
  orderAt(target)).battle;
 assert.equal(next.sides.B.escorts[0].hp,before-1);
 assert.equal(next.sides.A.falco.pending.calibrationBonus,2);
 next=nextFalcoTurn(next);
 const r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,5);
 assert.equal(r.battle.sides.B.escorts[0].hp,before-6);
});
test('Taratura bloccata non aggiunge danni al colpo preparato',()=>{
 const b=battle(),target=firstUnit(b);shieldUnit(b.sides.B,target,1);
 const r=turn(b,'A',['nx-r01-02','nx-r01-03'],orderAt(target));
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.A.falco.pending.calibrationBonus,0);
});
test('Doppia camera: i due colpi leggeri incontrano separatamente la protezione',()=>{
 const b=battle(),target=firstUnit(b);shieldUnit(b.sides.B,target,1);
 let next=turn(b,'A',['nx-r01-07'],orderAt(target)).battle;
 next=nextFalcoTurn(next);
 const r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,1);
 assert.equal(r.events.filter(e=>e.kind==='impact'&&e.cardId==='nx-r01-07').length,1);
 assert.equal(r.battle.sides.A.discard.filter(id=>id==='nx-r01-07').length,1);
});
test('Camera blindata richiede Capacitore carico: senza carica viene respinta',()=>{
 const b=battle();mount(b.sides.A);
 assert.match(effectUnavailableReason(card('nx-r01-04'),b.sides.A,b),/colpo preparato/);
 const before=JSON.stringify(b);
 b.sides.A.hand=['nx-r01-04'];
 const fail=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(fail.ok,false);
 assert.deepEqual(b.sides.A.defenses,[]);
});
test('Camera blindata: colpo al Capacitore carico annullato senza danni',()=>{
 const b=battle({shipB:'N00'});defendOnMother(b);mount(b.sides.A);
 b.sides.B.machines.push({id:'machine:test',slot:0,name:'Macchina esca',
  hp:5,maxHp:5,power:0,destroyed:false});
 const target=b.sides.B.machines[0];
 const next=turn(b,'A',['nx-r01-02','nx-r01-04'],{
  pass:false,targetKind:'machine',targetId:target.id
 }).battle;
 assert.ok(next.sides.A.defenses.some(d=>d.id==='nx-r01-04'));
 const after=turn(next,'B',['nx-n00-03'],{
  targetKind:'module',targetId:next.sides.A.modules.weapon.id,pass:false});
 assert.equal(after.shot.moduleDamage,0);
 assert.equal(after.battle.sides.A.modules.weapon.hp,2);
 assert.ok(!after.battle.sides.A.defenses.some(d=>d.id==='nx-r01-04'));
});
test('Artigliere Binario: recupera una sola Difesa scoperta tra tre carte senza pescata netta',()=>{
 const b=battle(),target=firstUnit(b);
 b.sides.A.deck=['nx-c03-04','nx-r01-04','nx-r01-08','nx-r01-03'];
 const r=turn(b,'A',['ex-r01-01','nx-r01-02'],
  orderAt(target,{falcoGunnerPickId:'nx-r01-08'}));
 const side=r.battle.sides.A;
 assert.ok(side.hand.includes('nx-r01-08'));
 assert.equal(side.commander.id,'ex-r01-01');
 assert.equal(side.commander.repeatsRemaining,0);
 assert.equal(r.events.filter(e=>e.kind==='private-scan'&&e.cardId==='ex-r01-01').length,1);
});
test('Correzione balistica cambia bersaglio, ma non giorno di rilascio',()=>{
 const b=battle(),first=firstUnit(b),second=otherUnit(b,'A',first.id);
 let next=turn(b,'A',['nx-r01-02','nx-r01-06'],orderAt(first,{
  falcoCorrectionKind:'escort',falcoCorrectionTargetId:second.id
 })).battle;
 assert.equal(next.sides.A.falco.pending.shots[0].id,second.id);
 assert.equal(next.sides.A.falco.pending.releasePly,2);
 const firstHp=next.sides.B.escorts[0].hp,secondHp=next.sides.B.escorts[1].hp;
 next=nextFalcoTurn(next);
 const r=turn(next,'A',[],{pass:true});
 assert.equal(r.battle.sides.B.escorts[0].hp,firstHp);
 assert.equal(r.battle.sides.B.escorts[1].hp,secondHp-3);
});
test('Correzione da sola è illegale senza carica e non consuma carte',()=>{
 const b=battle();b.sides.A.hand=['nx-r01-06'];
 const before=JSON.stringify(b);
 const fail=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(fail.ok,false);assert.match(fail.reason,/nessun colpo/);
 assert.equal(JSON.stringify(b),before);
});
test('Caricatore: annulla la carica, mette la carta sotto il mazzo e pesca una sola carta',()=>{
 const b=battle(),target=firstUnit(b);
 let next=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 next.sides.A.deck=['ex-r01-01','nx-r01-06',...Array(8).fill('nx-r01-04')];
 next=nextFalcoTurn(next);
 const r=turn(next,'A',['nx-r01-09'],{pass:true});
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.A.falco.pending,null);
 assert.ok(r.battle.sides.A.hand.includes('ex-r01-01'));
 assert.ok(r.battle.sides.A.deck.includes('nx-r01-02'));
 assert.ok(r.events.some(e=>e.kind==='falco-cancel'&&e.cancelledCardId==='nx-r01-02'));
 assert.equal(r.battle.sides.A.discard.filter(id=>id==='nx-r01-02').length,0);
});
test('Falco guardiano intercetta il prossimo colpo al Generatore anche con Aggiramento',()=>{
 let b=battle({shipA:'R01',shipB:'N00',levelA:3,levelB:2});
 const first=b.sides.A.escorts[0],before=first.hp,g=b.sides.A.ships[0].parts.find(p=>p.id==='generator').hp;
 b=turn(b,'A',['nx-r01-08']).battle;
 const r=turn(b,'B',['prog-bypass'],{
  pass:false,targetKind:'part',targetId:'generator',partId:'generator'});
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').hp,g);
 assert.ok(r.battle.sides.A.escorts[0].hp<before);
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id==='nx-r01-08'));
 assert.ok(r.events.some(e=>e.kind==='falco-intercept'));
});
test('Falco guardiano non intercetta se il primo supporto è disattivato',()=>{
 let b=battle({shipA:'R01',shipB:'N00',levelA:3});
 b=turn(b,'A',['nx-r01-08']).battle;
 const generator=b.sides.A.ships[0].parts.find(p=>p.id==='generator'),before=generator.hp;
 b.sides.A.escorts[0].disabledUntilPly=4;
 const r=turn(b,'B',['prog-bypass'],{
  pass:false,targetKind:'part',targetId:'generator',partId:'generator'});
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').hp,before-1);
});
test('Triangolazione richiede Centralina e due supporti di grado 2 operativi',()=>{
 const b=battle({levelA:4});
 assert.match(effectUnavailableReason(card('nx-r01-10'),b.sides.A,b),/Livello Falco|due supporti/);
 const c=battle();c.sides.A.escorts[1].disabledUntilPly=2;
 assert.match(effectUnavailableReason(card('nx-r01-10'),c.sides.A,c),/supporti/);
});
test('Triangolazione: pesante a una unità e leggero alla seconda, una sola carta consumata',()=>{
 const b=battle(),primary=firstUnit(b),secondary=otherUnit(b,'A',primary.id);
 const before=b.sides.B.escorts.map(e=>e.hp);
 let next=turn(b,'A',['nx-r01-10'],orderAt(primary,{
  falcoSecondTargetKind:'escort',falcoSecondTargetId:secondary.id
 })).battle;
 next=nextFalcoTurn(next);
 const r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,4);
 assert.equal(r.battle.sides.B.escorts[0].hp,before[0]-3);
 assert.equal(r.battle.sides.B.escorts[1].hp,before[1]-1);
 assert.equal(r.battle.sides.A.discard.filter(id=>id==='nx-r01-10').length,1);
});
test('Triangolazione perde il colpo leggero se uno dei due supporti si disattiva',()=>{
 const b=battle(),primary=firstUnit(b),secondary=otherUnit(b,'A',primary.id);
 let next=turn(b,'A',['nx-r01-10'],orderAt(primary,{
  falcoSecondTargetKind:'escort',falcoSecondTargetId:secondary.id
 })).battle;
 next.sides.A.escorts[1].disabledUntilPly=5;
 next=nextFalcoTurn(next);
 const r=turn(next,'A',[],{pass:true});
 assert.equal(r.shot.escortDamage,3);
 assert.ok(r.events.some(e=>e.kind==='falco-lost'&&e.text?.includes('supporto')));
});
test('Falco non può accumulare due carte preparate simultaneamente',()=>{
 const b=battle(),target=firstUnit(b);
 b.sides.A.hand=['nx-r01-02','nx-r01-07'];
 const error=validateFleetTurn(b,'A',{cards:[0,1],...orderAt(target)});
 assert.match(error,/un solo attacco/);
});
test('IA Falco: rilascio avviene senza duplicare attacchi e senza errori di convalida',()=>{
 let b=battle(),target=firstUnit(b);
 b=turn(b,'A',['nx-r01-02'],orderAt(target)).battle;
 b=nextFalcoTurn(b);
 const order=autoFleetTurn(b,'A');
 const result=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(result.ok,true,result.reason);
 assert.ok(result.events.some(e=>e.kind==='falco-release'));
 assert.equal(result.battle.sides.A.discard.filter(id=>id==='nx-r01-02').length,1);
});
test('Boss e personaggi restano nel catalogo durante il Falco',async()=>{
 const {BOSS_CARDS,GENERAL_CARDS,EXCLUSIVE_CARDS}=await import('./fleetNext/rules.js');
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.values(GENERAL_CARDS).filter(c=>c.kind==='character').length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='character').length,12);
});
