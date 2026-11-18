import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,deckFromCounts,eligibleExclusives,effectiveDeck} from './fleetNext/rules.js';
import {TEST_DECK} from './fleetNext/testDeckFixtures.js';
import {createFleetNextBattle,resolveFleetNextTurn,effectUnavailableReason} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {ensureMantaState,mantaEnergy,mantaCapacitorActive,mantaForkActive,
 mantaPrecondition} from './fleetNext/mantaEngine.js';

const deck=deckFromCounts(TEST_DECK.carteGenerali);
const make=(opts={})=>createFleetNextBattle({shipA:'R02',shipB:'C03',
 levelA:shipMaxLevel(opts.shipA||'R02'),levelB:shipMaxLevel(opts.shipB||'C03'),
 mode:'pvp',seed:811,deckA:deck,deckB:deck,...opts});
function equip(side,id){
 const r=mountModule(side,card(id));
 assert.equal(r.ok,true,r.reason);
 return r.entry;
}
function energy(side,amount){
 ensureMantaState(side).energy=amount;
}
function play(b,who,hand=[],order={pass:true}){
 b.turn=who;
 b.sides[who].hand=[...hand];
 const opponent=b.sides[who==='A'?'B':'A'];
 const part=opponent.ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{cards:hand.map((_,i)=>i),partId:part?.id,
  ...order},b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function target(kind,unit){return {pass:false,targetKind:kind,targetId:unit.id,
 ...(kind==='escort'?{escortSlot:unit.slot}:kind==='machine'?{machineSlot:unit.slot}:{})};}

test('Manta: dieci carte esclusive eseguibili e limitate alla madre R02',()=>{
 const own=eligibleExclusives('R02',shipMaxLevel('R02'));
 assert.equal(own.length,10);
 for(const c of own){
  assert.equal(c.playable===false,false,c.id);
  assert.equal(c.effectSpec.type,'manta',c.id);
  assert.equal(mantaPrecondition(c,{ships:[{id:'C03',level:5,parts:[]}]}),
   'Carta esclusiva della Manta Ionica');
 }
 assert.equal(own.filter(c=>c.kind==='character').length,1);
 assert.equal(effectiveDeck(deck,'R02',shipMaxLevel('R02')).filter(id=>own.some(c=>c.id===id)).length,10);
 assert.equal(effectiveDeck(deck,'C03',5).some(id=>id==='nx-r02-01'),false);
});

test('Capacitore: nasce vuoto, accetta massimo due cariche e le perde quando viene rimosso',()=>{
 const b=make(),side=b.sides.A;
 equip(side,'nx-r02-01');ensureMantaState(side);
 assert.equal(mantaCapacitorActive(side,b.ply),true);
 assert.equal(mantaEnergy(side),0);
 energy(side,2);
 assert.match(effectUnavailableReason(card('nx-r02-09'),side,b),/macchina avversaria/);
 assert.equal(mantaEnergy(side),2);
 removeModule(side,'utility');
 assert.equal(mantaEnergy(side),0);
 assert.equal(mantaCapacitorActive(side,b.ply),false);
});

test('Capacitore: soltanto il primo danno diretto nel turno nemico genera energia',()=>{
 let b=make({shipA:'N00',shipB:'R02'});
 equip(b.sides.B,'nx-r02-01');
 const first=b.sides.B.escorts[0],before=first.hp;
 const r=play(b,'A',[],target('escort',first));
 assert.ok(r.battle.sides.B.escorts[0].hp<before,'Il danno deve essere reale');
 assert.equal(mantaEnergy(r.battle.sides.B),1);
 assert.equal(r.events.filter(e=>e.kind==='manta-energy').length,1);
});

test('Schermo di assorbimento: blocca un colpo al supporto e carica il Capacitore',()=>{
 let b=make({shipA:'N00',shipB:'R02'});
 equip(b.sides.B,'nx-r02-01');
 const escort=b.sides.B.escorts[0];
 b=play(b,'B',['nx-r02-03'],{pass:true,mantaScreenEscortId:escort.id}).battle;
 assert.equal(b.sides.B.protections.length,1);
 const hp=b.sides.B.escorts[0].hp;
 const r=play(b,'A',[],target('escort',b.sides.B.escorts[0]));
 assert.equal(r.battle.sides.B.escorts[0].hp,hp);
 assert.equal(mantaEnergy(r.battle.sides.B),1);
 assert.equal(r.battle.sides.B.protections.length,0);
});

test('Arco ionico: il silenzio opzionale spende una energia solo se il colpo riesce',()=>{
 let b=make();equip(b.sides.A,'nx-r02-01');energy(b.sides.A,1);
 const escort=b.sides.B.escorts[0],hp=escort.hp;
 const r=play(b,'A',['nx-r02-02'],{...target('escort',escort),mantaSilence:true});
 assert.ok(r.battle.sides.B.escorts[0].hp<hp);
 assert.equal(mantaEnergy(r.battle.sides.A),0);
 assert.ok(r.battle.sides.B.escorts[0].silencedUntilPly>r.battle.ply-1);
});

test('Messa a terra: consuma energia e annulla i colpi secondari su unità diverse',()=>{
 let b=make({shipA:'C02',shipB:'R02'});
 equip(b.sides.B,'nx-r02-01');energy(b.sides.B,1);
 const first=b.sides.B.escorts[0],second=b.sides.B.escorts[1],hp=second.hp;
 b.sides.B.defenses.push({id:'nx-r02-04',source:'nx-r02-04@test',
  hidden:true,armedAtPly:-1,untilPly:null,trigger:'manta-secondary'});
 const r=play(b,'A',['nx-c02-10'],{...target('escort',first),
  prismaSecondTargetKind:'escort',prismaSecondTargetId:second.id});
 assert.equal(r.battle.sides.B.escorts[1].hp,hp);
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-r02-04'));
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-r02-04'),false);
});

test('Polarità inversa: la protezione conserva le cariche e rimuove un disturbo del supporto ferito',()=>{
 let b=make(),side=b.sides.A,first=side.escorts[0],second=side.escorts[1];
 second.hp-=1;second.silencedUntilPly=2;
 side.defenses.push({id:'nx-r02-03',source:'test-visible',untilPly:8});
 side.protections.push({source:'test-visible',id:'nx-r02-03',kind:'protect',
  target:'escort',escortSlot:first.slot,remaining:2,untilPly:8});
 const r=play(b,'A',['nx-r02-06'],{pass:true,mantaFromEscortId:first.id,mantaToEscortId:second.id});
 assert.equal(r.battle.sides.A.protections[0].escortSlot,second.slot);
 assert.equal(r.battle.sides.A.protections[0].remaining,2);
 assert.equal(r.battle.sides.A.escorts[1].silencedUntilPly,0);
});

test('Forcella ionica: due colpi su bersagli diversi, una energia, niente vitali',()=>{
 let b=make(),side=b.sides.A;
 equip(side,'nx-r02-01');equip(side,'nx-r02-07');energy(side,1);
 assert.equal(mantaForkActive(side,b.ply),true);
 const [one,two]=b.sides.B.escorts;
 const hp1=one.hp,hp2=two.hp;
 const r=play(b,'A',[],{...target('escort',one),mantaFork:true,
  mantaSecondTargetKind:'escort',mantaSecondTargetId:two.id});
 assert.equal(r.battle.sides.B.escorts[0].hp,hp1-1);
 assert.equal(r.battle.sides.B.escorts[1].hp,hp2-1);
 assert.equal(mantaEnergy(r.battle.sides.A),0);
 assert.equal(r.shot.targets.length,2);
});

test('Campo Manta: protegge il primo supporto di grado 2 per un solo colpo',()=>{
 let b=make({shipA:'N00',shipB:'R02'});
 equip(b.sides.B,'nx-r02-01');energy(b.sides.B,1);
 const escort=b.sides.B.escorts[0];
 assert.ok(escort.grade>=2);
 b=play(b,'B',['nx-r02-08'],{pass:true}).battle;
 assert.equal(mantaEnergy(b.sides.B),0);
 const hp=b.sides.B.escorts[0].hp;
 const r=play(b,'A',[],target('escort',b.sides.B.escorts[0]));
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-1);
 assert.equal(r.events.some(e=>e.cardId==='nx-r02-08'&&e.kind==='block'),true);
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-r02-08'),false);
});

test('Scarica totale: due energie, tre danni a una macchina e disattivazione',()=>{
 let b=make(),side=b.sides.A;
 equip(side,'nx-r02-01');energy(side,2);
 const machine={id:'machine:B:dummy',slot:0,name:'Torretta prova',
  hp:7,maxHp:7,power:0,disabledUntilPly:0,jammedUntilPly:0,destroyed:false};
 b.sides.B.machines.push(machine);
 const r=play(b,'A',['nx-r02-09'],target('machine',machine));
 assert.equal(r.battle.sides.B.machines[0].hp,4);
 assert.ok(r.battle.sides.B.machines[0].disabledUntilPly>r.battle.ply-1);
 assert.equal(mantaEnergy(r.battle.sides.A),0);
});

test('Riserva dielettrica: scarta protezione visibile e converte solo cariche effettive',()=>{
 let b=make(),side=b.sides.A;
 equip(side,'nx-r02-01');energy(side,0);
 side.defenses.push({id:'nx-r02-03',source:'test-dielectric',untilPly:8});
 side.protections.push({source:'test-dielectric',id:'nx-r02-03',kind:'protect',
  target:'escort',escortSlot:side.escorts[0].slot,remaining:2,untilPly:8});
 const r=play(b,'A',['nx-r02-10'],{pass:true,mantaRecycleSource:'test-dielectric'});
 assert.equal(mantaEnergy(r.battle.sides.A),2);
 assert.equal(r.battle.sides.A.protections.length,0);
 assert.equal(r.battle.sides.A.defenses.length,0);
});

test('Navigatrice Manta: massimo due riparazioni, una per turno e senza energia sprecata',()=>{
 let b=make(),side=b.sides.A;
 equip(side,'nx-r02-01');energy(side,2);
 side.escorts[0].hp-=2;
 const start=side.escorts[0].hp;
 b=play(b,'A',['ex-r02-01'],{pass:true,mantaRepairTargetId:side.escorts[0].id}).battle;
 assert.equal(b.sides.A.escorts[0].hp,start+1);
 assert.equal(mantaEnergy(b.sides.A),1);
 b=play(b,'B',[],{pass:true}).battle;
 b=play(b,'A',[],{pass:true}).battle;
 assert.equal(b.sides.A.escorts[0].hp,start+2);
 assert.equal(mantaEnergy(b.sides.A),0);
 assert.equal(b.sides.A.manta.navigatorUses,2);
});

test('Le azioni Manta senza requisiti non mutano la partita quando vengono rifiutate',()=>{
 const b=make();
 b.sides.A.hand=['nx-r02-09'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:false,targetKind:'escort',
  targetId:b.sides.B.escorts[0].id},1000);
 assert.equal(r.ok,false);
 assert.equal(JSON.stringify(b),before);
 assert.match(r.reason,/Capacitore|energie/);
});
