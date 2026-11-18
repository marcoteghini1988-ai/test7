import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {SUPPORT_MAX_LEVEL,supportHpAtLevel,supportLevelProfile} from './fleetNext/supportProgression.js';
import {createFleetSide,fuseIndependentSupportWithShip,
 fusionShipUnavailableReason} from './fleetNext/combat.js';
import {skillCount} from './fleetNext/supportAbilities.js';

test('Tutte le 169 combinazioni ordinate fra i 13 modelli sono realmente fuse',()=>{
 assert.equal(SUPPORT_CATALOG.length,13);
 let combinations=0;
 for(const original of SUPPORT_CATALOG){
  for(const incoming of SUPPORT_CATALOG){
   const side=createFleetSide('N00',1,[],17,{},[{
    id:original.id,instanceId:'combination:'+original.shipModelId,
    slot:0,level:SUPPORT_MAX_LEVEL
   }]);
   assert.equal(side.ships[0].level,1,'Il livello madre non impone il supporto');
   assert.equal(side.escorts[0].supportLevel,5);
   const baseline=side.escorts[0];
   baseline.hp=Math.max(1,baseline.maxHp-2);
   const before={hp:baseline.hp,maxHp:baseline.maxHp,element:baseline.element};
   const allowed=fusionShipUnavailableReason(side,incoming.shipModelId,0);
   assert.equal(allowed,'',original.name+' + '+incoming.name+': '+allowed);
   const result=fuseIndependentSupportWithShip(side,incoming.shipModelId,0);
   assert.equal(result.ok,true,result.reason);
   assert.equal(result.fused.hp,before.hp,'La fusione non deve riparare');
   assert.equal(result.fused.maxHp,before.maxHp,'La fusione non somma HP');
   assert.equal(result.fused.element,before.element);
   assert.equal(result.fused.elements.includes(incoming.elementId),true);
   assert.equal(result.fused.supportSkillIds.length,2,
    'Entrambe le passive devono sopravvivere, anche se duplicate');
   assert.equal(result.fused.supportSkillIds[0],original.skillId);
   assert.equal(result.fused.supportSkillIds[1],incoming.skillId);
   assert.equal(side.fusionsUsed,1);
   assert.equal(side.escorts.length,1);
   assert.equal(fusionShipUnavailableReason(side,incoming.shipModelId,0).length>0,true,
    'Un supporto non puo fondersi due volte');
   if(original.shipModelId===incoming.shipModelId){
    assert.equal(skillCount(side,original.skillId),2,
     'La fusione di due copie uguali preserva entrambe le fonti');
    assert.deepEqual(result.fused.elements,[original.elementId]);
   }
   combinations++;
  }
 }
 assert.equal(combinations,169);
});

test('Tutte le copie migliorano separatamente da L1 a L5 e crescono di HP',()=>{
 const baseHp=10;
 let previous=0;
 for(let level=1;level<=SUPPORT_MAX_LEVEL;level++){
  const state=supportLevelProfile(level),hp=supportHpAtLevel(baseHp,level);
  assert.equal(state.level,level);
  assert.equal(state.passiveGrade,level);
  assert.ok(hp>previous);
  previous=hp;
 }
 assert.equal(supportLevelProfile(5).fullyEvolved,true);
});
