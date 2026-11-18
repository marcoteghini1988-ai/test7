import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_PROGRESSION_IDS,shipMaxLevel} from './fleetNext/progression.js';
import {FLEET_ELEMENT_IDENTITIES,FLEET_ELEMENTS,fleetElements,activeFleetElements,
 fleetElementNames,fleetElementStrengths,fleetElementWeaknesses,secondaryElementUnlockLevel,
 projectedElementalMatchup,elementalRelation,elementalAttackProfile
} from './fleetNext/elementalAffinities.js';
import {createFleetMother} from './fleetNext/combat.js';

test('Tutti e dieci gli elementi hanno due vantaggi e due debolezze, nessun doppio vantaggio reciproco',()=>{
 assert.equal(Object.keys(FLEET_ELEMENTS).length,10);
 const set=new Set(Object.keys(FLEET_ELEMENTS));
 for(const [id,entry] of Object.entries(FLEET_ELEMENTS)){
  assert.equal(entry.beats.length,2,id);
  assert.equal(entry.weakTo.length,2,id);
  assert.ok(entry.shot&&entry.vfx&&entry.symbol,id);
  assert.equal(new Set(entry.beats).size,2,id);
  for(const enemy of entry.beats){
   assert.ok(set.has(enemy),id);
   assert.ok(!FLEET_ELEMENTS[enemy].beats.includes(id),id+' vs '+enemy);
   assert.equal(elementalRelation(id,enemy),1);
   assert.equal(elementalRelation(enemy,id),-1);
  }
  for(const enemy of entry.weakTo)assert.equal(elementalRelation(id,enemy),-1,id);
  for(const enemy of set){
   const x=elementalRelation(id,enemy);
   const y=elementalRelation(enemy,id);
   assert.equal(x,-y,id+' vs '+enemy);
  }
 }
});

test('Le diciassette navicelle possono avere uno o due elementi, il secondo si acquisisce salendo di livello',()=>{
 assert.deepEqual(Object.keys(FLEET_ELEMENT_IDENTITIES).sort(),[...SHIP_PROGRESSION_IDS].sort());
 assert.equal(fleetElements('N00')[0],'ionic');
 assert.equal(fleetElements('C01')[0],'plasma');
 assert.equal(fleetElements('C02')[0],'refrigerant');
 const allPrimaries=new Set();
 for(const id of SHIP_PROGRESSION_IDS){
  const ids=fleetElements(id),max=shipMaxLevel(id);
  assert.ok(ids.length===1||ids.length===2,id);
  assert.equal(new Set(ids).size,ids.length,id);
  allPrimaries.add(ids[0]);
  assert.equal(activeFleetElements(id,1).length,1,id);
  assert.equal(activeFleetElements(id,max).length,ids.length,id);
  assert.equal(fleetElementStrengths(id).length,2,id);
  assert.equal(fleetElementWeaknesses(id).length,2,id);
  assert.equal(fleetElementNames(id,max).length,ids.length,id);
  const live=createFleetMother(id,max);
  assert.equal(live.element,ids[0],id);
  assert.deepEqual([...live.elements],[...ids],id);
  const at=secondaryElementUnlockLevel(id);
  if(ids.length===2){
   assert.ok(Number.isInteger(at)&&at>=2&&at<=max,id);
   assert.equal(activeFleetElements(id,at-1).length,1,id);
   assert.equal(activeFleetElements(id,at).length,2,id);
  }else assert.equal(at,null,id);
  const shot=elementalAttackProfile(id,max);
  assert.equal(shot.primary,FLEET_ELEMENTS[ids[0]],id);
  assert.equal(shot.energyCardRequired,true,id);
  assert.equal(shot.normalShotUnchanged,true,id);
  assert.equal(shot.combatBonusEnabled,false,id);
 }
 assert.equal(allPrimaries.size,10,'tutti gli elementi sono primari di almeno una nave');
});

test('289 confronti fra 17 navi: forza e debolezza non dipendono dal verso e non danno bonus PvP gratuiti',()=>{
 for(const a of SHIP_PROGRESSION_IDS)for(const b of SHIP_PROGRESSION_IDS){
  const ab=projectedElementalMatchup(a,b);
  const ba=projectedElementalMatchup(b,a);
  assert.equal(ab.score,-ba.score,a+' vs '+b);
  assert.ok([-1,0,1].includes(ab.score),a);
  if(a===b)assert.equal(ab.score,0,a);
  const first=projectedElementalMatchup(a,b,1,1);
  const reverse=projectedElementalMatchup(b,a,1,1);
  assert.equal(first.score,-reverse.score,a+' vs '+b+' L1');
 }
 assert.equal(projectedElementalMatchup('C02','C01',1,1).status,'favorevole');
 assert.equal(projectedElementalMatchup('C01','C02',1,1).status,'sfavorevole');
});
