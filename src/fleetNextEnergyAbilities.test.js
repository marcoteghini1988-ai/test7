import test from 'node:test';
import assert from 'node:assert/strict';
import {ENERGY_CARDS,ENERGY_COUNT,ENERGY_CARD_BY_ID,TOTAL_CARD_COUNT,FUSION_SHIP_CARD_COUNT,
 card,cardRole,cardFacePath,cardCopyLimit,effectiveDeck} from './fleetNext/rules.js';
import {elementalAbility,ELEMENTAL_ABILITIES,totalElementalEnergy,
 chargedElementalEnergy} from './fleetNext/elementalAbilities.js';
import {activeFleetElements} from './fleetNext/elementalAffinities.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,
 effectUnavailableReason,autoFleetTurn} from './fleetNext/combat.js';
import {createFleetInventory} from './fleetNext/collection.js';
import {canSelectNewGeneric,buyNextCommonCard,buildNextBaseDeck,NEXT_CARD_COSTS} from './fleetNext/nextDeckLoadout.js';

const battle=(shipA='N00',shipB='C03',levelA=20,levelB=17)=>createFleetNextBattle({
 shipA,shipB,levelA,levelB,mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:1988
});

test('Dieci Carte Energia realmente registrate, vendibili e inseribili nel mazzo da 40',()=>{
 assert.equal(ENERGY_COUNT,10);
 assert.equal(TOTAL_CARD_COUNT,160+FUSION_SHIP_CARD_COUNT+120);
 assert.equal(new Set(ENERGY_CARDS.map(c=>c.id)).size,10);
 const inventory=createFleetInventory();
 assert.equal(inventory.owned['energy-ionic'],2);
 for(const c of ENERGY_CARDS){
  assert.equal(card(c.id),c);
  assert.equal(cardRole(c.id),'support');
  assert.equal(cardCopyLimit(c.id),4);
  assert.equal(cardFacePath(c.id),null);
  assert.equal(canSelectNewGeneric(c.id),true,c.id);
  assert.equal(c.effectSpec.type,'energy');
  assert.equal(ENERGY_CARD_BY_ID[c.id],c);
 }
 const offer=buyNextCommonCard({...inventory,credits:250},'energy-plasma');
 assert.equal(offer.ok,true);
 assert.equal(offer.cost,NEXT_CARD_COSTS.Comune);
 assert.equal(offer.inventory.owned['energy-plasma'],1);
 const base=buildNextBaseDeck(offer.inventory,'C01',19,['energy-plasma']);
 assert.deepEqual(base.baseDeck,['energy-plasma']);
 assert.ok(effectiveDeck(base.baseDeck,'C01',19).includes('energy-plasma'));
 assert.ok(base.total<=40);
});

test('12 abilità elementali delle madri: sei attacchi e sei effetti, costi da 1 a 4',()=>{
 assert.equal(Object.keys(ELEMENTAL_ABILITIES).length,12);
 const list=Object.values(ELEMENTAL_ABILITIES);
 assert.equal(list.filter(a=>a.kind==='attack').length,6);
 assert.equal(list.filter(a=>a.kind==='effect').length,6);
 assert.deepEqual(new Set(list.map(a=>a.cost)),new Set([1,2,3,4]));
 for(const a of list){
  assert.equal(elementalAbility(a.shipId),a);
  assert.ok(a.cost>=1&&a.cost<=4&&a.description.length>10,a.shipId);
  assert.ok(activeFleetElements(a.shipId,99).length>=1,a.shipId);
 }
});

test('Due Carte Energia caricano, attivano e consumano Blackout senza attacco normale',()=>{
 const b=battle(),escort=b.sides.B.escorts[0];
 b.sides.A.hand=['energy-ionic','energy-ionic'];
 const order={cards:[0,1],activateElemental:true,elementalElement:'ionic',
  elementalTargetId:escort.id,pass:true};
 assert.equal(validateFleetTurn(b,'A',order),null);
 const result=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(totalElementalEnergy(result.battle.sides.A),0);
 assert.equal(result.events.filter(e=>e.kind==='energy-charge').length,2);
 const specials=result.events.filter(e=>e.kind==='elemental-special');
 assert.equal(specials.length,1);
 assert.equal(specials[0].abilityKind,'effect');
 assert.equal(specials[0].cost,2);
 assert.equal(result.battle.sides.B.escorts[0].disabledUntilPly,2);
 assert.equal(result.shot.damage||0,0);
 assert.equal(result.shot.escortDamage||0,0);
 assert.deepEqual([...b.sides.A.hand],['energy-ionic','energy-ionic'],'l’input non viene mutato');
});

test('Energia da un turno precedente resta accumulata: il turno seguente può attivare la Speciale',()=>{
 let b=battle();
 b.sides.A.hand=['energy-ionic','energy-ionic'];
 const first=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:true},1000);
 assert.equal(first.ok,true,first.reason);
 assert.equal(chargedElementalEnergy(first.battle.sides.A,'ionic'),2);
 const other=resolveFleetNextTurn(first.battle,'B',{cards:[],pass:true},2000);
 assert.equal(other.ok,true,other.reason);
 const last=resolveFleetNextTurn(other.battle,'A',{cards:[],pass:true,
  activateElemental:true,elementalElement:'ionic'},3000);
 assert.equal(last.ok,true,last.reason);
 assert.equal(totalElementalEnergy(last.battle.sides.A),0);
 assert.equal(last.events.filter(e=>e.kind==='elemental-special').length,1);
});

test('Lancia Solare attiva una sola salva con tre Energie, senza un secondo colpo gratuito',()=>{
 const b=battle('C01','C02',19,18),target=b.sides.B.escorts[0];
 b.sides.A.hand=['energy-plasma','energy-plasma','energy-plasma'];
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1,2],targetKind:'escort',targetId:target.id,
  escortSlot:target.slot,partId:'weapons',pass:false,
  activateElemental:true,elementalElement:'plasma'},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.events.filter(e=>e.kind==='elemental-special').length,1);
 assert.equal(r.events.filter(e=>e.kind==='impact').length,1);
 assert.equal(r.battle.sides.A.elementalLastActivationPly,0);
 assert.equal(totalElementalEnergy(r.battle.sides.A),0);
 assert.ok((r.shot.escortDamage||0)>=0);
});

test('Effetto da una sola Energia: Scudo Prismatico riduce il prossimo attacco',()=>{
 const b=battle('C02','C01',18,19);
 b.sides.A.hand=['energy-refrigerant'];
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true,activateElemental:true,
  elementalElement:'refrigerant'},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.sides.A.buffs.some(x=>x.kind==='guard'&&x.power>=1),true);
 assert.equal(r.shot.damage||0,0);
});

test('Energia sbagliata, massimo quattro cariche e attivazione insufficiente non consumano la mano',()=>{
 const b=battle('N00','C03',1,17);
 b.sides.A.hand=['energy-plasma','energy-ionic','energy-ionic'];
 const before=JSON.stringify(b);
 assert.match(effectUnavailableReason(card('energy-plasma'),b.sides.A,b),/Elemento/);
 assert.match(validateFleetTurn(b,'A',{cards:[0],pass:true}),/navicella/);
 assert.match(validateFleetTurn(b,'A',{cards:[1],activateElemental:true,
  elementalElement:'ionic',pass:true}),/servono 2/);
 assert.equal(JSON.stringify(b),before);
 b.sides.A.elementalCharges={ionic:4};
 assert.match(validateFleetTurn(b,'A',{cards:[1],pass:true}),/massimo quattro/);
 assert.equal(JSON.stringify(b.sides.A.elementalCharges),JSON.stringify({ionic:4}));
 const duplicate=battle('N00','C03',20,17);
 duplicate.sides.A.hand=['energy-ionic','energy-ionic','nx-n00-02'];
 assert.match(validateFleetTurn(duplicate,'A',{cards:[0,1,2],activateElemental:true,
  elementalElement:'ionic',pass:true}),/Attacco Speciale|altre carte Attacco/);
});

test('Secondo elemento utilizzabile solo dal livello di sblocco, IA può attivare',()=>{
 const low=battle('C03','C01',1,19);
 low.sides.A.hand=['energy-ionic'];
 assert.match(validateFleetTurn(low,'A',{cards:[0],pass:true}),/non possiede/);
 const high=battle('C03','C01',17,19);
 high.sides.A.hand=['energy-ionic'];
 assert.equal(validateFleetTurn(high,'A',{cards:[0],pass:true}),null);
 const ai=battle('C02','C01',18,19);
 ai.sides.A.hand=['energy-refrigerant'];
 const plan=autoFleetTurn(ai,'A');
 assert.equal(plan.activateElemental,true);
 assert.equal(plan.pass,true);
 assert.equal(plan.elementalElement,'refrigerant');
 const used=resolveFleetNextTurn(ai,'A',plan,1000);
 assert.equal(used.ok,true,used.reason);
 assert.equal(used.events.some(e=>e.kind==='elemental-special'),true);
});

test('Le nuove Carte Energia non entrano nel motore legacy',()=>{
 const b=createFleetNextBattle({shipA:'N00',shipB:'C03',levelA:1,levelB:1,
  deckA:[],deckB:[],ruleset:'legacy'});
 b.sides.A.hand=['energy-ionic'];
 assert.match(validateFleetTurn(b,'A',{cards:[0],pass:true}),/modalità HP/);
});
