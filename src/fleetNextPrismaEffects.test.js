import test from 'node:test';
import assert from 'node:assert/strict';
import {card,exclusiveUnlocked,eligibleExclusives,effectiveDeck,cardFacePath} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,effectUnavailableReason,
 protectingFleetUnits} from './fleetNext/combat.js';
import {mountModule} from './fleetNext/auroraEngine.js';
import {isTrapCard} from './fleetNext/simpleEffects.js';
import {projectFleetSlots} from './fleetNext/battlePresentation.js';

const IDS=['nx-c02-01','nx-c02-02','nx-c02-03','nx-c02-04','ex-c02-01',
 'nx-c02-06','nx-c02-07','nx-c02-08','nx-c02-09','nx-c02-10'];
function battle({shipA='C02',shipB='C03',levelA=5,levelB=5}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:[],deckB:[],mode:'pvp',seed:1414});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=[];side.discard=[];
 }
 return b;
}
function turn(b,who='A',hand=[],order={},indices=null){
 b.turn=who;b.sides[who].hand=[...hand];
 const enemy=b.sides[who==='A'?'B':'A'];
 const first=enemy.ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const result=resolveFleetNextTurn(b,who,{
  cards:indices??hand.map((_,i)=>i),
  targetKind:'part',targetId:first?.id,partId:first?.id,pass:true,...order
 },1000+b.ply*30000);
 assert.equal(result.ok,true,result.reason);
 return result;
}
const vital=(s,id='weapons')=>s.ships[0].parts.find(p=>p.id===id);
function mount(s,id){
 const result=mountModule(s,card(id));
 assert.equal(result.ok,true,result.reason);return result.entry;
}
function machine(side,id,slot,hp=3){
 const m={id,slot,name:id,hp,maxHp:hp,power:0,
  sourceCardId:'prog-machine-striker',destroyed:false,disabledUntilPly:0};
 side.machines.push(m);return m;
}
function shield(side,kind,unit,count=2,source='fixture-shield'){
 side.defenses.push({id:'fixture-shield',source,hidden:false,untilPly:20});
 const target=kind==='part'?{target:'part',partId:unit.id}:
  kind==='escort'?{target:'escort',escortSlot:unit.slot}:
  {target:'machine',machineSlot:unit.slot};
 side.protections.push({id:'fixture-shield',source,kind:'protect',
  remaining:count,untilPly:20,...target});
}

test('Dieci esclusive Vespa per nave e sei sbloccate al primo livello',()=>{
 assert.equal(new Set(IDS).size,10);
 for(const id of IDS){
  assert.equal(card(id).shipId,'C02',id);
  assert.notEqual(card(id).playable,false,id);
  assert.ok(exclusiveUnlocked(id,'C02',5),id);
  assert.equal(exclusiveUnlocked(id,'N00',5),false,id);
  assert.equal(cardFacePath(id),null,'Mai usare illustrazioni legacy '+id);
 }
 for(let level=1;level<=5;level++){
  assert.equal(IDS.filter(id=>exclusiveUnlocked(id,'C02',level)).length,5+level);
  assert.equal(eligibleExclusives('C02',level).filter(c=>c.shipId==='C02').length,5+level);
 }
 assert.equal(IDS.filter(id=>effectiveDeck([],'C02',5).includes(id)).length,10);
});

test('Lente e Specchio sono due moduli separati, da due integrità ciascuno',()=>{
 let b=battle();
 b=turn(b,'A',['nx-c02-01']).battle;
 b=turn(b,'B',[]).battle;
 b=turn(b,'A',['nx-c02-09']).battle;
 assert.equal(b.sides.A.modules.weapon.cardId,'nx-c02-01');
 assert.equal(b.sides.A.modules.utility.cardId,'nx-c02-09');
 assert.equal(b.sides.A.modules.weapon.hp,2);
 assert.equal(b.sides.A.modules.utility.hp,2);
 assert.ok(!b.sides.A.discard.includes('nx-c02-01'));
 assert.ok(!b.sides.A.discard.includes('nx-c02-09'));
});

test('Lente: colpo bloccato marca la stessa unità, il successivo ignora una Difesa',()=>{
 const b=battle(),first=b.sides.B.escorts[0],other=b.sides.B.escorts[1];
 mount(b.sides.A,'nx-c02-01');
 shield(b.sides.B,'escort',first,2);
 const before=first.hp;
 const r=turn(b,'A',['nx-c02-07'],{pass:false,
  targetKind:'escort',targetId:first.id,escortSlot:first.slot,
  prismaSecondTargetKind:'escort',prismaSecondTargetId:other.id});
 assert.equal(r.shot.escortDamage,2);
 assert.equal(r.battle.sides.B.escorts[0].hp,before-1);
 assert.equal(r.battle.sides.B.protections.length,0);
 assert.ok(r.events.some(e=>e.cardId==='nx-c02-01'));
});

test('Scheggia riflessa rimbalza una volta solo se il colpo principale è bloccato',()=>{
 const b=battle(),first=b.sides.B.escorts[0],second=b.sides.B.escorts[1];
 shield(b.sides.B,'escort',first,1);
 const hp1=first.hp,hp2=second.hp;
 const r=turn(b,'A',['nx-c02-02'],{pass:false,
  targetKind:'escort',targetId:first.id,escortSlot:first.slot,
  prismaSecondTargetKind:'escort',prismaSecondTargetId:second.id});
 assert.equal(r.battle.sides.B.escorts[0].hp,hp1);
 assert.equal(r.battle.sides.B.escorts[1].hp,hp2-1);
 assert.equal(r.shot.escortDamage,1);
 assert.equal(r.shot.targets.length,1);
});

test('Scheggia riflessa senza blocco non genera un secondo colpo',()=>{
 const b=battle(),first=b.sides.B.escorts[0],second=b.sides.B.escorts[1];
 const before=second.hp;
 const r=turn(b,'A',['nx-c02-02'],{pass:false,
  targetKind:'escort',targetId:first.id,prismaSecondTargetKind:'escort',
  prismaSecondTargetId:second.id});
 assert.equal(r.shot.targets.length,1);
 assert.equal(r.battle.sides.B.escorts[1].hp,before);
});

test('Prisma di deviazione sposta un unico attacco dalla prima alla seconda macchina',()=>{
 let b=battle({shipA:'C02',shipB:'N00',levelA:1,levelB:1});
 machine(b.sides.A,'macchina-A',0);machine(b.sides.A,'macchina-B',1);
 b=turn(b,'A',['nx-c02-03'],{prismaRedirectMachineId:'macchina-B'}).battle;
 const hpA=b.sides.A.machines[0].hp,hpB=b.sides.A.machines[1].hp;
 const r=turn(b,'B',[],{pass:false,targetKind:'machine',targetId:'macchina-A'});
 assert.equal(r.battle.sides.A.machines[0].hp,hpA);
 assert.ok(r.battle.sides.A.machines[1].hp<hpB);
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id==='nx-c02-03'));
});

test('Riflesso falso annulla solo il colpo secondario di Geometria',()=>{
 let b=battle({shipA:'C02',shipB:'C02'}),unit=b.sides.B.escorts[1];
 b=turn(b,'B',['nx-c02-04'],{prismaTrapKind:'escort',prismaTrapTargetId:unit.id}).battle;
 const a=b.sides.B.escorts[0],second=b.sides.B.escorts[1];
 const hpA=a.hp,hpB=second.hp;
 const r=turn(b,'A',['nx-c02-07'],{pass:false,
  targetKind:'escort',targetId:a.id,escortSlot:a.slot,
  prismaSecondTargetKind:'escort',prismaSecondTargetId:second.id});
 assert.equal(r.battle.sides.B.escorts[0].hp,hpA-2);
 assert.equal(r.battle.sides.B.escorts[1].hp,hpB);
 assert.ok(r.events.some(e=>e.secondaryCancelled&&e.cardId==='nx-c02-04'));
 assert.ok(!r.battle.sides.B.defenses.some(d=>d.id==='nx-c02-04'));
});

test('Riflesso falso non annulla una raffica ripetuta sullo stesso bersaglio',()=>{
 let b=battle({shipA:'N00',shipB:'C02'}),unit=b.sides.B.escorts[0];
 b=turn(b,'B',['nx-c02-04'],{prismaTrapKind:'escort',prismaTrapTargetId:unit.id}).battle;
 const r=turn(b,'A',['nx-n00-02'],{pass:false,targetKind:'escort',
  targetId:unit.id,escortSlot:unit.slot});
 assert.equal(r.shot.escortDamage,2);
 assert.ok(r.battle.sides.B.defenses.some(d=>d.id==='nx-c02-04'));
});

test('Artigiana Prisma trasferisce solo la carica residua dopo un colpo bloccato',()=>{
 let b=battle({shipA:'C02',shipB:'N00'});
 const a=b.sides.A.escorts[0],z=b.sides.A.escorts[1];
 shield(b.sides.A,'escort',a,2);
 b=turn(b,'A',['ex-c02-01'],{
  prismaArtisanTargetKind:'escort',prismaArtisanTargetId:z.id
 }).battle;
 const hp=a.hp,expiry=b.sides.A.protections[0].untilPly;
 const r=turn(b,'B',[],{pass:false,targetKind:'escort',targetId:a.id});
 const p=r.battle.sides.A.protections[0];
 assert.ok(p);
 assert.equal(p.remaining,1);assert.equal(p.escortSlot,z.slot);
 assert.equal(p.untilPly,expiry);
 assert.equal(r.battle.sides.A.escorts[0].hp,hp);
});

test('Taglio della lente rimuove una sola carica senza infliggere danni',()=>{
 const b=battle(),unit=b.sides.B.escorts[0];
 shield(b.sides.B,'escort',unit,2);
 const hp=unit.hp;
 const r=turn(b,'A',['nx-c02-06'],{pass:true,prismaEnemyKind:'escort',
  prismaEnemyId:unit.id});
 assert.equal(r.battle.sides.B.protections[0].remaining,1);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp);
 assert.equal(r.shot.damage,0);
});

test('Geometria spezzata dà due colpi a una unità e uno a un’altra',()=>{
 const b=battle(),first=b.sides.B.escorts[0],second=b.sides.B.escorts[1];
 const hpFirst=first.hp,hpSecond=second.hp;
 const r=turn(b,'A',['nx-c02-07'],{pass:false,targetKind:'escort',
  targetId:first.id,escortSlot:first.slot,prismaSecondTargetKind:'escort',
  prismaSecondTargetId:second.id});
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.B.escorts[0].hp,hpFirst-2);
 assert.equal(r.battle.sides.B.escorts[1].hp,hpSecond-1);
});

test('Custodia del Prisma conserva scadenza e cariche spostandole al primo supporto',()=>{
 const b=battle({shipA:'C02',shipB:'N00',levelA:3});
 const generator=vital(b.sides.A,'generator');
 shield(b.sides.A,'part',generator,2);
 const expiry=b.sides.A.protections[0].untilPly;
 const r=turn(b,'A',['nx-c02-08']);
 const p=r.battle.sides.A.protections[0];
 assert.equal(p.target,'escort');assert.equal(p.escortSlot,0);
 assert.equal(p.remaining,2);assert.equal(p.untilPly,expiry);
 assert.equal(p.partId,null);
});

test('Custodia del Prisma è impossibile se manca la Centralina',()=>{
 const b=battle({shipA:'C02',levelA:3});
 const generator=vital(b.sides.A,'generator');shield(b.sides.A,'part',generator);
 const command=vital(b.sides.A,'command');command.hp=0;command.destroyed=true;
 assert.match(effectUnavailableReason(card('nx-c02-08'),b.sides.A,b),/Centralina/);
});

test('Specchio segmentato perde massimo un punto al primo attacco di due danni',()=>{
 const b=battle({shipA:'N00',shipB:'C02',levelA:5,levelB:4});
 b.sides.B.escorts=[];
 const mirror=mount(b.sides.B,'nx-c02-09');
 const r=turn(b,'A',['nx-n00-03'],{pass:false,targetKind:'module',
  targetId:mirror.id,moduleSlot:mirror.slot});
 assert.equal(r.shot.moduleDamage,1);
 assert.equal(r.battle.sides.B.modules.utility.hp,1);
});

test('Rosa di cristallo produce tre colpi distinti, senza Aggiramento',()=>{
 const b=battle(),first=b.sides.B.escorts[0],second=b.sides.B.escorts[1];
 const third=machine(b.sides.B,'macchina-terza',0,3);
 const r=turn(b,'A',['nx-c02-10'],{pass:false,targetKind:'escort',
  targetId:first.id,prismaSecondTargetKind:'escort',
  prismaSecondTargetId:second.id,prismaThirdTargetKind:'machine',
  prismaThirdTargetId:third.id});
 assert.equal(r.shot.targets.length,3);
 assert.equal(r.shot.escortDamage,2);assert.equal(r.shot.machineDamage,1);
 assert.ok(!r.shot.targets.some(t=>t.kind==='part'));
});

test('Rosa di cristallo non si usa senza entrambi i supporti operativi',()=>{
 const b=battle({shipA:'C02',levelA:5});
 b.sides.A.escorts[1].hp=0;b.sides.A.escorts[1].destroyed=true;
 assert.match(effectUnavailableReason(card('nx-c02-10'),b.sides.A,b),/entrambi i supporti/);
});

test('Riflesso falso resta coperto alla vista dell’avversario',()=>{
 assert.equal(isTrapCard(card('nx-c02-04')),true);
 const own=projectFleetSlots({defenses:[],attackSlots:[],defenseSlots:[]},['nx-c02-04'],'A','A');
 const enemy=projectFleetSlots({defenses:[],attackSlots:[],defenseSlots:[]},['nx-c02-04'],'B','A');
 assert.equal(own[2].id,'nx-c02-04');assert.equal(own[2].hidden,true);
 assert.deepEqual(enemy[2],{hidden:true,pending:false});
 assert.equal(own[1],null);
});

test('Le carte Vespa non cambiano i vitali né producono vittorie automatiche',()=>{
 const b=battle({shipA:'C02',shipB:'C03',levelA:1});
 assert.deepEqual(b.sides.A.ships[0].parts.map(p=>p.id),['weapons','generator','bridge']);
 assert.equal(b.phase,'playing');
 assert.ok(IDS.every(id=>card(id).effectSpec.type==='prisma'));
});
