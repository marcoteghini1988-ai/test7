import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_PROGRESSION_IDS,shipMaxLevel} from './fleetNext/progression.js';
import {FLEET_ELEMENTS,activeFleetElements} from './fleetNext/elementalAffinities.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetSide,createFleetNextBattle,resolveFleetNextTurn,
 fuseFleetSupports,refreshEscortLinks,inheritFleetEscortElements} from './fleetNext/combat.js';

test('Le scudiere delle 12 madri ereditano elemento principale, elementi attivi e ID madre',()=>{
 for(const shipId of SHIP_PROGRESSION_IDS){
  const level=shipMaxLevel(shipId);
  const side=createFleetSide(shipId,level,[],11);
  const mother=side.ships[0];
  const supported=[...side.escorts,...side.reserveEscorts];
  assert.equal(side.escorts.length,2,shipId);
  assert.ok(supported.length>=2,shipId);
  for(const escort of supported){
   assert.equal(escort.element,mother.element,shipId+' '+escort.id);
   assert.equal(escort.elementInheritedFrom,shipId);
   assert.deepEqual(escort.elements,[...activeFleetElements(shipId,level)]);
   assert.deepEqual(FLEET_ELEMENTS[escort.element].weakTo,FLEET_ELEMENTS[mother.element].weakTo);
  }
 }
});

test('Scudiere sbloccate a L10/L18, riserve e secondo elemento sono sempre sincronizzati',()=>{
 const early=createFleetSide('N00',5,[],21);
 assert.equal(early.escorts.length,0);
 const first=createFleetSide('N00',10,[],22);
 assert.equal(first.escorts.length,1);
 assert.equal(first.escorts[0].element,'ionic');
 const full=createFleetSide('N00',18,[],23);
 assert.equal(full.escorts.length,2);
 assert.ok(full.escorts.every(e=>e.element==='ionic'));
 const dual=createFleetSide('E02',10,[],24);
 assert.equal(dual.ships[0].element,'aerial');
 assert.deepEqual(dual.escorts[0].elements,['aerial','ionic']);
 assert.equal(dual.escorts[0].element,'aerial',
  'Il secondo elemento non aggiunge una resistenza difensiva gratuita');
 dual.escorts[0].element='ionic';
 dual.escorts[0].elements=[];
 dual.escorts[0].elementInheritedFrom=null;
 refreshEscortLinks(dual,0);
 assert.equal(dual.escorts[0].element,'aerial');
 assert.deepEqual(dual.escorts[0].elements,['aerial','ionic']);
 assert.equal(dual.escorts[0].elementInheritedFrom,'E02');
 assert.equal(inheritFleetEscortElements(dual),dual);
});

test('Le fusioni di Eclisse Reale, Titano e Arca conservano la vulnerabilità materna',()=>{
 for(const id of ['L01','L03','L04']){
  const side=createFleetSide(id,shipMaxLevel(id),[],51);
  const first=fuseFleetSupports(side,0);
  assert.equal(first.ok,true,id+' '+first.reason);
  assert.equal(first.fused.element,side.ships[0].element,id);
  assert.deepEqual(first.fused.elements,[...activeFleetElements(id,shipMaxLevel(id))]);
  assert.equal(first.fused.elementInheritedFrom,id);
  for(const e of [...side.escorts,...side.reserveEscorts]){
   assert.equal(e.element,side.ships[0].element,id);
   assert.equal(e.elementInheritedFrom,id);
  }
  if(id==='L04'){
   const second=fuseFleetSupports(side,0);
   assert.equal(second.ok,true,id+' '+second.reason);
   assert.equal(second.fused.element,side.ships[0].element);
   assert.equal(second.fused.elementInheritedFrom,id);
   assert.equal(side.escorts.filter(e=>e.hp>0&&!e.destroyed).length,2,
    'Due supporti fusi, non quattro contemporaneamente');
  }
 }
});

const duel=(attacker,defender,attackerLevel,defenderLevel)=>{
 const b=createFleetNextBattle({shipA:attacker,shipB:defender,
  levelA:attackerLevel,levelB:defenderLevel,
  deckA:[],deckB:[],ruleset:HP_SYNC_RULESET,mode:'pvp',seed:773});
 b.sides.A.ships[0].attackPower=2;
 b.sides.B.ships[0].defensePower=1;
 const escort=b.sides.B.escorts[0];
 assert.ok(escort);
 escort.hp=20;escort.maxHp=20;
 b.sides.B.buffs=[];b.sides.B.defenses=[];b.sides.B.protections=[];
 b.sides.A.hand=[];
 return b;
};
const shot=b=>{
 const escort=b.sides.B.escorts[0],before=escort.hp;
 const r=resolveFleetNextTurn(b,'A',{cards:[],targetKind:'escort',
  targetId:escort.id,escortSlot:escort.slot,partId:'weapons',pass:false},1000);
 assert.equal(r.ok,true,r.reason);
 return {r,damage:before-r.battle.sides.B.escorts[0].hp};
};
test('Vera intercettazione: Fuoco colpisce la scudiera Acqua al 50%',()=>{
 const b=duel('C01','C02',19,18);
 assert.equal(b.sides.B.escorts[0].element,'refrigerant');
 const first=shot(b);
 const advantage=first.r.events.find(e=>e.kind==='elemental-matchup');
 assert.ok(advantage);
 assert.equal(advantage.percent,50);
 assert.equal(advantage.inheritedFromMother,'C02');
 assert.equal(advantage.defenderElement,'refrigerant');
 assert.equal(advantage.targetKind,'escort');
 assert.equal(first.damage,0,'Il primo colpo da 1 HP è dimezzato con resto');
 const pass=resolveFleetNextTurn(first.r.battle,'B',{cards:[],pass:true},2000);
 assert.equal(pass.ok,true);
 const again=shot(pass.battle);
 assert.equal(again.damage,1,'Il secondo colpo recupera il resto, per 1 HP su 2');
});

test('La scudiera Fuoco subisce il vantaggio Acqua e non riceve doppie penalità',()=>{
 const b=duel('C02','C01',18,19);
 const e=b.sides.B.escorts[0];
 assert.equal(e.element,'plasma');
 const result=shot(b);
 const ratio=result.r.events.find(x=>x.kind==='elemental-matchup');
 assert.equal(ratio?.percent,125);
 assert.equal(ratio?.defenderElement,'plasma');
 assert.equal(ratio?.inheritedFromMother,'C01');
 assert.equal(result.damage,ratio.modifiedDamage,
  'Il vantaggio è applicato esattamente una volta');
 assert.ok(result.damage>0);
});

test('Controflotta neutrale e legacy restano inalterati',()=>{
 const neutral=duel('N00','C01',20,19); // Ionico contro Fuoco = neutro
 assert.equal(shot(neutral).r.events.some(e=>e.kind==='elemental-matchup'),false);
 const legacy=createFleetNextBattle({shipA:'C01',shipB:'C02',
  levelA:5,levelB:5,deckA:[],deckB:[],ruleset:'legacy',seed:333});
 const e=legacy.sides.B.escorts[0];
 assert.equal(e.element,legacy.sides.B.ships[0].element);
 assert.equal(legacy.ruleset,'legacy');
});

test('Una fusione Titano eredita Terra e subisce il vantaggio di Fuoco',()=>{
 const b=duel('C01','L03',19,5);
 const fused=fuseFleetSupports(b.sides.B,0);
 assert.equal(fused.ok,true,fused.reason);
 assert.equal(fused.fused.element,'mineral');
 b.sides.B.escorts[0].hp=20;b.sides.B.escorts[0].maxHp=20;
 const hit=shot(b);
 const event=hit.r.events.find(e=>e.kind==='elemental-matchup');
 assert.equal(event?.percent,125);
 assert.equal(event?.targetKind,'escort');
 assert.equal(event?.inheritedFromMother,'L03');
 assert.equal(event?.defenderElement,'mineral');
});

test('La seconda affinità Ionica di Vortiluce non rimuove la debolezza Vento contro Ghiaccio',()=>{
 const b=duel('E01','E02',11,10); // Ghiaccio prevale su Vento
 const escort=b.sides.B.escorts[0];
 assert.deepEqual(escort.elements,['aerial','ionic']);
 assert.equal(escort.element,'aerial');
 const hit=shot(b),event=hit.r.events.find(e=>e.kind==='elemental-matchup');
 assert.equal(event?.percent,125);
 assert.equal(event?.defenderElement,'aerial');
 assert.equal(event?.inheritedFromMother,'E02');
});
