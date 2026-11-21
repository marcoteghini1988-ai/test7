import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createFleetMother} from './fleetNext/combat.js';
import {createIndependentFleetEscorts} from './fleetNext/supportDeployment.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {escortArtwork,fusedEscortArtwork} from './fleetBattleModels.js';

test('every selected support resolves to its own hull facing the right way',()=>{
 const mother=createFleetMother('N00',1);
 for(const model of SUPPORT_CATALOG){
  const [escort]=createIndependentFleetEscorts(mother,[{supportId:model.id,
   instanceId:'test:'+model.id,slot:0,rarita:model.rarita}]);
  for(const side of ['enemy','player']){
   const art=escortArtwork(escort,side);
   assert.match(art,new RegExp(`/${model.shipModelId}_complete\\.(png|webp)$`));
   assert.ok(existsSync('public'+art),`${model.id}: ${art}`);
  }
 }
 const [escort]=createIndependentFleetEscorts(mother,[{supportId:SUPPORT_CATALOG[0].id,
  instanceId:'fusion:test',slot:0}]);
 escort.fused=true;escort.fusionModelIds=[escort.shipModelId,'C01'];
 assert.match(fusedEscortArtwork(escort,'player'),/C01_complete\.png$/);
});
