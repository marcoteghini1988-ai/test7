import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_RARITIES,motherCombatStatsForRarity} from './fleetNext/shipRarity.js';
import {ELEMENTAL_ABILITIES} from './fleetNext/elementalAbilities.js';
import {chargeElementalEnergy,spendElementalEnergy} from './fleetNext/elementalAbilities.js';
import {GENERATOR_ATTACK_THRESHOLDS,MOTHER_GENERATOR_PROFILES,
 generatorCardCount,generatorAttackPreview,generatorCoolingOwnTurns,
 spendGeneratorPhysicalCards,commitGeneratorFiring} from './fleetNext/motherGeneratorBalance.js';

const side=(shipId='N00',rarita='Comune')=>{
 const stats=motherCombatStatsForRarity(rarita,shipId);
 return {ships:[{id:shipId,level:1,...stats}],turnCount:0,
  energyPile:[],elementalCharges:{},discard:[]};
};
const setCharge=(s,ids)=>{
 for(const id of ids){
  const element=id.match(/^energy-(.+?)(?:-[rel])?$/)?.[1];
  assert.ok(chargeElementalEnergy(s,element,id),id);
 }
 return s;
};
test('12 madri x 4 rarita: due colpi 2/4 carte, durata maggiore per potenza maggiore',()=>{
 assert.equal(Object.keys(MOTHER_GENERATOR_PROFILES).length,12);
 assert.deepEqual(GENERATOR_ATTACK_THRESHOLDS,{quick:2,heavy:4});
 assert.deepEqual(Object.keys(ELEMENTAL_ABILITIES).sort(),
  Object.keys(MOTHER_GENERATOR_PROFILES).sort());
 for(const id of Object.keys(MOTHER_GENERATOR_PROFILES)){
  const p=MOTHER_GENERATOR_PROFILES[id];
  assert.ok(p.heavy.maxHpPercent>p.quick.maxHpPercent,id);
  assert.ok(p.heavy.coolingOwnTurns>p.quick.coolingOwnTurns,id);
  for(const rarity of SHIP_RARITIES){
   const s=side(id,rarity);
   setCharge(s,['energy-ionic','energy-ionic','energy-ionic','energy-ionic']);
   const preview=generatorAttackPreview(s,true);
   assert.equal(preview.ready,true,id+' '+rarity);
   assert.equal(preview.tier,'heavy',id+' '+rarity);
   assert.equal(preview.physicalCardsCost,4);
   assert.ok(preview.nominalDamage>0&&preview.nominalDamage<s.ships[0].maxHp);
  }
 }
});
test('Una carta Leggendaria da 4 cariche conta come UNA carta fisica',()=>{
 const s=side();
 setCharge(s,['energy-ionic-l']);
 assert.equal(s.elementalCharges.ionic,4);
 assert.equal(generatorCardCount(s),1);
 assert.equal(generatorAttackPreview(s,true).ready,false);
 setCharge(s,['energy-ionic']);
 assert.equal(generatorCardCount(s),2);
 assert.equal(generatorAttackPreview(s,false).reason,'not-reserved');
 assert.equal(generatorAttackPreview(s,true).tier,'quick');
});
test('Prenotazione unica: due carte pronte, aggiunte altre due -> attacco forte',()=>{
 const s=side();
 setCharge(s,['energy-ionic','energy-ionic']);
 assert.equal(generatorAttackPreview(s,true).tier,'quick');
 setCharge(s,['energy-ionic','energy-ionic']);
 assert.equal(generatorAttackPreview(s,true).tier,'heavy');
 const shot=commitGeneratorFiring(s,generatorAttackPreview(s,true));
 assert.equal(shot.tier,'heavy');
 assert.equal(shot.spent.count,4);
 assert.equal(generatorCardCount(s),0);
 assert.equal(s.discard.length,4);
 assert.equal(generatorCoolingOwnTurns(s),shot.coolingOwnTurns+1);
 s.turnCount++;
 assert.equal(generatorCoolingOwnTurns(s),shot.coolingOwnTurns);
 for(let i=0;i<shot.coolingOwnTurns;i++)s.turnCount++;
 assert.equal(generatorCoolingOwnTurns(s),0);
});
test('Il surriscaldamento non cancella le carte rimaste o quelle destinate alle armi',()=>{
 const s=side();
 setCharge(s,['energy-ionic-l','energy-ionic','energy-ionic']);
 const p=generatorAttackPreview(s,true);
 assert.equal(p.tier,'quick');
 const result=commitGeneratorFiring(s,p);
 assert.equal(result.spent.count,2);
 assert.equal(generatorCardCount(s),1);
 assert.equal(s.elementalCharges.ionic,4);
 assert.equal(s.discard.filter(x=>x==='energy-ionic').length,2);
 assert.equal(generatorAttackPreview(s,true).reason,'cooling');
 assert.equal(spendElementalEnergy(s,'ionic',2),true);
 assert.equal(generatorCardCount(s),1,'La Carta Energia non scompare con consumi parziali');
 assert.equal(s.elementalCharges.ionic,2);
});
test('Carte Arma consumano prima: con una sola Carta Energia rimasta non parte il colpo',()=>{
 const s=side();
 setCharge(s,['energy-ionic-r','energy-ionic']);
 assert.equal(generatorAttackPreview(s,true).ready,true);
 assert.equal(spendElementalEnergy(s,'ionic',1),true);
 assert.equal(generatorCardCount(s),1);
 assert.equal(generatorAttackPreview(s,true).ready,false);
 assert.equal(commitGeneratorFiring(s,generatorAttackPreview(s,true)),null);
 assert.equal(generatorCardCount(s),1);
 assert.equal(s.discard.length,1);
});
