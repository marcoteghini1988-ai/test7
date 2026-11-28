// Regressioni: una sola pila Energia, senza capienza massima, con scarti solo al consumo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {ENERGY_CAPACITY,ENERGY_SPECIAL_MAX_COST} from './fleetNext/energyCards.js';
import {chargedElementalEnergy,totalElementalEnergy,chargeElementalEnergy,
 spendElementalEnergy} from './fleetNext/elementalAbilities.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

function make(ship='C01',level=19){
 const b=createFleetNextBattle({shipA:ship,shipB:'C02',levelA:level,levelB:18,
  mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:1988,nowMs:0});
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(30).fill('gen-216');s.discard=[];
 }
 return b;
}
function turn(b,who,ids=[],options={}){
 b.sides[who].hand=[...ids];
 const r=resolveFleetNextTurn(b,who,{cards:ids.map((_,i)=>i),pass:true,...options},
  b.turnStartedAtMs);
 assert.equal(r.ok,true,r.reason);
 return r;
}

test('La pila Energia non ha un tetto, mentre i costi delle Speciali restano fino a 4',()=>{
 assert.equal(ENERGY_CAPACITY,Number.POSITIVE_INFINITY);
 assert.equal(ENERGY_SPECIAL_MAX_COST,4);
});

test('Sei carte di Fuoco in un unico slot logico, persistenti in due turni e non negli scarti',()=>{
 let b=make();
 let r=turn(b,'A',['energy-plasma','energy-plasma','energy-plasma']);
 b=r.battle;
 assert.deepEqual(b.sides.A.energyPile,Array(3).fill('energy-plasma'));
 assert.equal(totalElementalEnergy(b.sides.A),3);
 assert.equal(b.sides.A.discard.filter(x=>x==='energy-plasma').length,0);
 b=turn(b,'B').battle;
 b.sides.A.hand=['energy-plasma','energy-plasma','energy-plasma'];
 assert.equal(validateFleetTurn(b,'A',{cards:[0,1,2],pass:true}),null);
 b=turn(b,'A',['energy-plasma','energy-plasma','energy-plasma']).battle;
 assert.equal(chargedElementalEnergy(b.sides.A,'plasma'),6);
 assert.equal(b.sides.A.energyPile.length,6);
 assert.ok(b.sides.A.energyPile.every(x=>x==='energy-plasma'));
 assert.equal(b.sides.A.discard.filter(x=>x==='energy-plasma').length,0);
 assert.equal(b.sides.A.energyPile.length+ b.sides.A.discard.filter(x=>x==='energy-plasma').length,6);
});

test('La Speciale usa solo le Energie necessarie e scarta le carte fisiche al consumo',()=>{
 let b=make('C02',18);
 b=turn(b,'A',['energy-refrigerant','energy-refrigerant','energy-refrigerant']).battle;
 b=turn(b,'B').battle;
 b=turn(b,'A',['energy-refrigerant','energy-refrigerant','energy-refrigerant']).battle;
 assert.equal(b.sides.A.energyPile.length,6);
 b=turn(b,'B').battle;
 const before=b.sides.A.discard.filter(x=>x==='energy-refrigerant').length;
 const r=turn(b,'A',[],{activateElemental:true,elementalElement:'refrigerant'});
 assert.ok(r.events.some(e=>e.kind==='elemental-special'));
 const side=r.battle.sides.A;
 assert.equal(chargedElementalEnergy(side,'refrigerant'),5);
 assert.equal(side.energyPile.length,5);
 assert.equal(side.discard.filter(x=>x==='energy-refrigerant').length,before+1);
});

test('L Energia caricata e consumata nello stesso turno entra una sola volta negli scarti',()=>{
 const b=make('C02',18);
 const r=turn(b,'A',['energy-refrigerant'],{
  activateElemental:true,elementalElement:'refrigerant'
 });
 assert.ok(r.events.some(e=>e.kind==='elemental-special'));
 const side=r.battle.sides.A;
 assert.equal(totalElementalEnergy(side),0);
 assert.deepEqual(side.energyPile,[]);
 assert.equal(side.discard.filter(x=>x==='energy-refrigerant').length,1);
});

test('Si possono spendere anche sette Energie, senza limite; una pila sola per più elementi',()=>{
 const b=make('C03',17),side=b.sides.A;
 for(let i=0;i<5;i++)assert.equal(chargeElementalEnergy(side,'void'),true);
 for(let i=0;i<4;i++)assert.equal(chargeElementalEnergy(side,'ionic'),true);
 assert.equal(totalElementalEnergy(side),9);
 assert.equal(side.energyPile.length,9);
 assert.equal(spendElementalEnergy(side,'void',5),true);
 assert.equal(side.discard.filter(x=>x==='energy-void').length,5);
 assert.deepEqual(side.energyPile,Array(4).fill('energy-ionic'));
 assert.equal(totalElementalEnergy(side),4);
 assert.equal(spendElementalEnergy(side,'ionic',4),true);
 assert.deepEqual(side.energyPile,[]);
 assert.equal(side.discard.filter(x=>x.startsWith('energy-')).length,9);
});
