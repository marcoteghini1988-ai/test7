import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,exclusiveUnlocked,eligibleExclusives,effectiveDeck,cardFacePath} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,
 availableFleetTargets,effectUnavailableReason,protectingFleetUnits} from './fleetNext/combat.js';
import {mountModule} from './fleetNext/auroraEngine.js';
import {isTrapCard} from './fleetNext/simpleEffects.js';
import {projectFleetSlots} from './fleetNext/battlePresentation.js';

const IDS=['nx-c01-01','nx-c01-02','nx-c01-03','nx-c01-04','ex-c01-01',
 'nx-c01-06','nx-c01-07','nx-c01-08','nx-c01-09','nx-c01-10'];
function battle({shipA='C01',shipB='N00',levelA=5,levelB=5}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:[],deckB:[],mode:'pvp',seed:4242});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=[];side.discard=[];}
 return b;
}
function turn(b,who='A',hand=[],order={},indices=null){
 b.turn=who;
 b.sides[who].hand=[...hand];
 const part=b.sides[who==='A'?'B':'A'].ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const cards=indices??hand.map((_,i)=>i);
 const result=resolveFleetNextTurn(b,who,
  {cards,partId:part?.id,targetKind:'part',targetId:part?.id,pass:true,...order},
  b.ply*30000+1000);
 assert.equal(result.ok,true,result.reason);
 return result;
}
const part=(side,id='weapons')=>side.ships[0].parts.find(p=>p.id===id);
function mount(side,id,ownPartId=null){
 const result=mountModule(side,card(id),ownPartId);
 assert.equal(result.ok,true,result.reason);
 return result.entry;
}

test('Dieci carte univoche di Lince, quattro iniziali e sei sbloccate nella progressione e mai da un’altra madre',()=>{
 assert.equal(new Set(IDS).size,10);
 for(const id of IDS){
  assert.equal(card(id).shipId,'C01',id);
  assert.notEqual(card(id).playable,false,id);
  assert.ok(exclusiveUnlocked(id,'C01',shipMaxLevel('C01')),id);
  assert.equal(exclusiveUnlocked(id,'N00',5),false,id);
 }
 for(let level=1;level<=shipMaxLevel('C01');level++){
  assert.equal(IDS.filter(id=>exclusiveUnlocked(id,'C01',level)).length,4+EXCLUSIVE_UNLOCK_MILESTONES['C01'].filter(n=>n<=level).length);
  assert.equal(eligibleExclusives('C01',level).filter(c=>c.shipId==='C01').length,4+EXCLUSIVE_UNLOCK_MILESTONES['C01'].filter(n=>n<=level).length);
 }
 assert.equal(IDS.filter(id=>effectiveDeck([],'C01',shipMaxLevel('C01')).includes(id)).length,10);
 for(const id of IDS)assert.equal(cardFacePath(id),null,'Non usare un vecchio fronte '+id);
});

test('Propulsori radenti restano montati, hanno integrità reale e non vanno negli scarti',()=>{
 const r=turn(battle(),'A',['nx-c01-01']),side=r.battle.sides.A;
 assert.equal(side.modules.utility.cardId,'nx-c01-01');
 assert.equal(side.modules.utility.hp,2);
 assert.ok(!side.discard.includes('nx-c01-01'));
});

test('Sorpasso solare aggira i guardiani e colpisce un solo vitale',()=>{
 const b=battle({shipB:'C03'}),hp=part(b.sides.B).hp;
 assert.ok(protectingFleetUnits(b.sides.B).length>0);
 const r=turn(b,'A',['nx-c01-02'],
  {targetKind:'part',targetId:'weapons',partId:'weapons',pass:false});
 assert.equal(r.shot.damage,1);
 assert.equal(part(r.battle.sides.B).hp,hp-1);
 assert.equal(r.shot.escortDamage,0);
});

test('Artiglio di coda infligge 3 a un supporto già ferito, 1 a uno integro',()=>{
 for(const wounded of [false,true]){
  const b=battle({shipB:'C03'}),unit=b.sides.B.escorts[0];
  if(wounded)unit.hp=Math.max(1,unit.hp-1);
  const r=turn(b,'A',['nx-c01-03'],
   {targetKind:'escort',targetId:unit.id,escortSlot:unit.slot,pass:false});
  assert.equal(r.shot.escortDamage,wounded?Math.min(3,unit.hp):1);
 }
});

test('Falsa scia viene preparata coperta e devia un solo colpo verso il vitale scelto',()=>{
 let b=battle({shipA:'N00',shipB:'C01'});
 const first=turn(b,'B',['nx-c01-04'],{ownPartId:'generator'});
 assert.ok(first.battle.sides.B.defenses[0].hidden);
 assert.equal(isTrapCard(card('nx-c01-04')),true);
 b=first.battle;
 const a=part(b.sides.B,'weapons').hp,g=part(b.sides.B,'generator').hp;
 const r=turn(b,'A',[],{targetKind:'part',targetId:'weapons',partId:'weapons',pass:false});
 assert.equal(part(r.battle.sides.B,'weapons').hp,a);
 assert.equal(part(r.battle.sides.B,'generator').hp,g-1);
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.redirected));
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-c01-04'),false);
});

test('Falsa scia non devia se il Generatore è distrutto: la Trappola viene disattivata',()=>{
 let b=battle({shipA:'N00',shipB:'C01'});
 b=turn(b,'B',['nx-c01-04'],{ownPartId:'generator'}).battle;
 const alternate=part(b.sides.B,'generator');alternate.hp=0;alternate.destroyed=true;
 const before=part(b.sides.B,'weapons').hp;
 const r=turn(b,'A',[],{targetKind:'part',targetId:'weapons',partId:'weapons',pass:false});
 assert.equal(part(r.battle.sides.B,'weapons').hp,before-1);
 assert.equal(r.battle.sides.B.defenses.filter(d=>d.id==='nx-c01-04').length,0);
});

test('Pilota Helios scarta e pesca una volta dopo Aggiramento, senza pescata netta',()=>{
 const b=battle(),side=b.sides.A;
 side.deck=['gen-217',...Array(8).fill('gen-218')];side.hand=['ex-c01-01','nx-c01-02','gen-216'];
 const r=resolveFleetNextTurn(b,'A',
  {cards:[0,1],targetKind:'part',targetId:'weapons',partId:'weapons',
   heliosTrade:true,heliosDiscardId:'gen-216'},1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.battle.sides.A.hand.includes('gen-217'));
 assert.ok(r.battle.sides.A.discard.includes('gen-216'));
 assert.equal(r.battle.sides.A.commander.id,'ex-c01-01');
 assert.equal(r.battle.sides.A.commander.repeatsRemaining,0);
 assert.equal(r.events.filter(e=>e.text?.includes('Pilota Helios: scartata')).length,1);
});

test('Rotta marcata vale solo nel turno proprio successivo e raggiunge il vitale segnato',()=>{
 let b=battle({shipB:'C03'});
 b=turn(b,'A',['nx-c01-06'],{routePartId:'weapons'}).battle;
 assert.equal(b.sides.A.lince.route.usePly,2);
 b=turn(b,'B',[]).battle;
 const hp=part(b.sides.B).hp;
 const r=turn(b,'A',[],{targetKind:'part',targetId:'weapons',partId:'weapons',pass:false});
 assert.equal(part(r.battle.sides.B).hp,hp-1);
 assert.equal(r.shot.damage,1);
 assert.equal(r.battle.sides.A.lince.route,null,'La marca scade dopo il proprio turno');
});

test('Lama di prua rimuove una protezione residua dopo un colpo riuscito',()=>{
 const b=battle({shipB:'C03'}),unit=b.sides.B.escorts[0];
 mount(b.sides.A,'nx-c01-07');
 b.terrain={id:'T01'};
 b.sides.B.defenses=[{id:'gen-227',source:'prova',untilPly:10}];
 b.sides.B.protections=[{id:'gen-227',source:'prova',kind:'dodge',
  target:'escort',escortSlot:unit.slot,remaining:1,untilPly:10}];
 const r=turn(b,'A',[],{targetKind:'escort',targetId:unit.id,escortSlot:unit.slot,pass:false});
 assert.ok(r.shot.escortDamage>0);
 assert.equal(r.battle.sides.B.protections.length,0);
 assert.equal(r.battle.sides.A.lince.bladeUsedPly,0);
});

test('Passaggio scoperto non è giocabile senza un Aggiramento riuscito nel turno precedente',()=>{
 const b=battle();
 assert.match(effectUnavailableReason(card('nx-c01-08'),b.sides.A,b),/Aggiramento/);
 const original=JSON.stringify(b);b.sides.A.hand=['nx-c01-08'];
 const result=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(result.ok,false);
 assert.equal(b.sides.A.defenses.length,0);
 assert.equal(JSON.stringify(b).includes('counterBypass'),false);
 assert.notEqual(JSON.stringify(b),original,'Il test ha aggiunto soltanto la carta alla mano');
});

test('Passaggio scoperto annulla Aggiramento e lascia operativi i guardiani',()=>{
 let b=battle({shipB:'C03'});
 b=turn(b,'A',['nx-c01-02'],
  {targetKind:'part',targetId:'weapons',partId:'weapons',pass:false}).battle;
 b=turn(b,'B',[]).battle;
 b=turn(b,'A',['nx-c01-08']).battle;
 b.sides.A.machines=[{id:'dummy',slot:0,name:'Bastione',sourceCardId:'prog-machine-guard',
  hp:5,maxHp:5,power:0,destroyed:false}];
 const hp=part(b.sides.A).hp;
 const r=turn(b,'B',['prog-bypass'],
  {targetKind:'part',targetId:'weapons',partId:'weapons',pass:false});
 assert.equal(part(r.battle.sides.A).hp,hp);
 assert.ok(r.events.some(e=>e.text?.includes('Passaggio scoperto')));
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id==='nx-c01-08'));
});

test('Disimpegno armato richiama l’arma con la stessa integrità e identità',()=>{
 let b=battle({shipB:'C03'}),unit=b.sides.B.escorts[0];
 const module=mount(b.sides.A,'nx-c01-07');module.hp=1;
 const id=module.id;
 const r=turn(b,'A',['nx-c01-09'],
  {pass:false,targetKind:'escort',targetId:unit.id,escortSlot:unit.slot,linceRecallWeapon:true});
 assert.equal(r.battle.sides.A.modules.weapon,null);
 assert.ok(r.battle.sides.A.hand.includes('nx-c01-07'));
 assert.equal(r.battle.sides.A.recalledModules[0].hp,1);
 b=turn(r.battle,'B',[]).battle;
 const next=turn(b,'A',['nx-c01-07']);
 assert.equal(next.battle.sides.A.modules.weapon.id,id);
 assert.equal(next.battle.sides.A.modules.weapon.hp,1);
});

test('Incursione cremisi scarta il modulo prima delle reazioni e perfora una protezione',()=>{
 const b=battle({shipB:'C03'}),hp=part(b.sides.B).hp;
 const module=mount(b.sides.A,'nx-c01-07');
 b.sides.A.deck=Array(8).fill('gen-218');
 b.sides.B.defenses=[{id:'gen-227',source:'shield',untilPly:10}];
 b.sides.B.protections=[{id:'gen-227',source:'shield',kind:'protect',
  target:'part',partId:'weapons',remaining:1,untilPly:10}];
 const r=turn(b,'A',['nx-c01-10'],
  {targetKind:'part',targetId:'weapons',partId:'weapons',pass:false,sacrificeSlot:'weapon'});
 assert.equal(r.shot.damage,1);
 assert.equal(part(r.battle.sides.B).hp,hp-1);
 assert.equal(r.battle.sides.A.modules.weapon,null);
 assert.ok(r.battle.sides.A.discard.includes(module.cardId));
});

test('Incursione cremisi senza modulo viene respinta senza consumare la carta',()=>{
 const b=battle();b.sides.A.hand=['nx-c01-10'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',
  {cards:[0],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'},1000);
 assert.equal(r.ok,false);
 assert.match(r.reason,/modulo/i);
 assert.equal(JSON.stringify(b),before);
});

test('Propulsori radenti richiamano una macchina senza curarla e il replay conserva i danni',()=>{
 let b=battle({shipB:'C03'});mount(b.sides.A,'nx-c01-01');
 b.sides.A.machines=[{id:'macchina-1',slot:0,name:'Striker',
  sourceCardId:'prog-machine-striker',hp:1,maxHp:3,power:1,destroyed:false}];
 const r=turn(b,'A',['nx-c01-02'],
  {pass:false,targetKind:'part',targetId:'weapons',partId:'weapons',
   radentRecall:true,radentMachineId:'macchina-1'});
 assert.equal(r.shot.damage,1);
 assert.equal(r.battle.sides.A.machines.length,0);
 assert.ok(r.battle.sides.A.hand.includes('prog-machine-striker'));
 assert.equal(r.battle.sides.A.recalledMachines[0].hp,1);
 b=turn(r.battle,'B',[]).battle;
 const replay=turn(b,'A',['prog-machine-striker']);
 assert.equal(replay.battle.sides.A.machines[0].hp,1);
 assert.equal(replay.battle.sides.A.machines[0].id,'macchina-1');
});

test('La Trappola di Lince è coperta e non mostra identità nel modello avversario',()=>{
 const chosen=['nx-c01-04'];
 const own=projectFleetSlots({defenses:[],attackSlots:[],defenseSlots:[]},chosen,'A','A');
 const enemy=projectFleetSlots({defenses:[],attackSlots:[],defenseSlots:[]},chosen,'B','A');
 assert.deepEqual(enemy[2],{hidden:true,pending:false});
 assert.equal(own[2].hidden,true);assert.equal(own[2].id,'nx-c01-04');
 assert.equal(own[1],null);
});

test('Lince non concede vittoria automatica o componenti vitali nuovi',()=>{
 const b=battle(),mother=b.sides.A.ships[0];
 assert.deepEqual(mother.parts.map(p=>p.id),['weapons','generator','bridge']);
 assert.ok(!IDS.some(id=>card(id).effectSpec.type==='blueprint'));
 assert.equal(b.phase,'playing');
});
