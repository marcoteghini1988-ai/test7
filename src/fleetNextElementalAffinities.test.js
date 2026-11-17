import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_PROGRESSION_IDS} from './fleetNext/progression.js';
import {FLEET_ELEMENT_IDENTITIES,FLEET_ELEMENTS,fleetElements,
 fleetElementNames,projectedElementalMatchup} from './fleetNext/elementalAffinities.js';
import {createFleetMother} from './fleetNext/combat.js';

test('Tutte le 17 madri hanno uno o due elementi, mantenendo il primario storico',()=>{
 const old={N00:'ionic',C01:'plasma',C02:'refrigerant',C03:'ionic',C04:'plasma',
 R01:'plasma',R02:'ionic',R03:'refrigerant',R04:'mineral',E01:'refrigerant',
 E02:'ionic',E03:'plasma',E04:'mineral',L01:'plasma',L02:'ionic',
 L03:'mineral',L04:'refrigerant'};
 assert.deepEqual(Object.keys(FLEET_ELEMENT_IDENTITIES).sort(),[...SHIP_PROGRESSION_IDS].sort());
 assert.equal(Object.keys(FLEET_ELEMENTS).length,4);
 for(const id of SHIP_PROGRESSION_IDS){
  const tags=fleetElements(id),mother=createFleetMother(id,1);
  assert.equal(tags[0],old[id],id);
  assert.ok(tags.length===1||tags.length===2,id);
  assert.equal(new Set(tags).size,tags.length,id);
  assert.deepEqual(mother.elements,tags,id);
  assert.equal(mother.element,tags[0],id);
  assert.equal(fleetElementNames(id).length,tags.length,id);
 }
});

test('Il vecchio ciclo di forza elementale resta coerente e non ha favorito universale',()=>{
 assert.equal(projectedElementalMatchup('C02','C01').status,'favorevole');
 assert.equal(projectedElementalMatchup('C01','R04').status,'favorevole');
 assert.equal(projectedElementalMatchup('R04','N00').status,'favorevole');
 assert.equal(projectedElementalMatchup('N00','C02').status,'favorevole');
 for(const a of SHIP_PROGRESSION_IDS)for(const b of SHIP_PROGRESSION_IDS){
  const ab=projectedElementalMatchup(a,b),ba=projectedElementalMatchup(b,a);
  assert.equal(ab.score,-ba.score,a+' vs '+b);
  assert.ok([-1,0,1].includes(ab.score));
  if(a===b)assert.equal(ab.score,0);
 }
});
