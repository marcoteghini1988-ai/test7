import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit,previewVolley} from './mathDuelEngine.js';
import {damageMotherShield,exposeMotherPart,restoreMotherShield,VITAL_IDS} from './vitalDefense.js';
import {gunEfficiency,effectiveGunDamage,systemState,systemCondition,
 shieldRepairEfficiency,escortsCoordinated,SYSTEM_DAMAGE_THRESHOLD,
 SYSTEM_DAMAGE_MESSAGES,SYSTEM_CONSEQUENCES} from './fleetSystems.js';
const rng=()=>.5,proof={kind:'math',op:'plus',target:10};
const cards=[{value:4,suit:'♥'},{value:6,suit:'♠'}];
function targetVital(id){
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rng);
 const v=b.enemy.fleet[0];
 const weakened=damageMotherShield(v.defense,Math.ceil(v.defense.shield.max*.25)).defense;
 const exposed=exposeMotherPart(weakened,id).defense;
 assert.equal(exposed.parts[id].exposed,true);
 return {...b.enemy,escorts:[],fleet:[{...v,defense:exposed}]};
}
function strike(side,id,raw=1000){
 return applyPendingHit(side,0,'plus',raw,{vitalId:id,cards,signatureOverride:proof,nowMs:1000});
}
test('point 26: all four localized systems start healthy, with no free damage',()=>{
 const d=targetVital('engine').fleet[0].defense;
 assert.equal(SYSTEM_DAMAGE_THRESHOLD,.5);
 for(const id of VITAL_IDS){
  assert.equal(systemState(d,id),'healthy');
  assert.equal(systemCondition(d,id).ratio,1);
  assert.ok(SYSTEM_DAMAGE_MESSAGES[id]);
  assert.ok(SYSTEM_CONSEQUENCES[id]);
 }
 assert.equal(systemState(null,'engine'),'unknown');
});
test('point 26: a valid localized hit crossing 50% changes engine to damaged',()=>{
 const s=targetVital('engine'),part=s.fleet[0].defense.parts.engine;
 const r=strike(s,'engine',Math.ceil(part.max/2));
 assert.equal(r.systemDisabled,null);
 assert.equal(r.systemDamaged,'engine');
 assert.equal(r.systemCondition,'damaged');
 assert.equal(r.systemMessage,SYSTEM_DAMAGE_MESSAGES.engine);
 assert.equal(r.defender.fleet[0].defense.parts.engine.hp,part.max-Math.ceil(part.max/2));
 assert.equal(gunEfficiency(r.defender.fleet[0].defense,'mother'),.90);
 assert.equal(gunEfficiency(r.defender.fleet[0].defense,'escort'),.90);
});
test('point 26: repeated damaged hits cannot duplicate a transition notice',()=>{
 const s=targetVital('weapons'),part=s.fleet[0].defense.parts.weapons;
 const first=strike(s,'weapons',Math.ceil(part.max/2));
 assert.equal(first.systemDamaged,'weapons');
 const second=strike(first.defender,'weapons',1);
 assert.equal(second.systemDamaged,null);
 assert.equal(second.systemDisabled,null);
 assert.equal(second.systemMessage,null);
 assert.equal(second.defender.fleet[0].defense.parts.weapons.hp,
  first.defender.fleet[0].defense.parts.weapons.hp-1);
});
test('point 26: engine impairments affect real volley, not ammunition',()=>{
 const s=targetVital('engine'),p=s.fleet[0].defense.parts.engine;
 const partial=strike(s,'engine',Math.ceil(p.max/2)).defender;
 const full=strike(partial,'engine',10000).defender;
 const ammo=[{value:10,suit:'♠'}];
 const normal=previewVolley(s,ammo),weak=previewVolley(partial,ammo),dead=previewVolley(full,ammo);
 assert.ok(normal.totalDamage>weak.totalDamage);
 assert.ok(weak.totalDamage>dead.totalDamage);
 assert.deepEqual(normal.routing,weak.routing);
 assert.deepEqual(weak.routing,dead.routing);
 assert.equal(full.fleet[0].defense.parts.engine.hp,0);
});
test('point 26: a partial weapons system reduction affects only mother guns',()=>{
 const s=targetVital('weapons'),p=s.fleet[0].defense.parts.weapons;
 const d=strike(s,'weapons',Math.ceil(p.max/2)).defender.fleet[0].defense;
 assert.equal(effectiveGunDamage(d,'mother',100),80);
 assert.equal(effectiveGunDamage(d,'escort',100),100);
 const full=strike(targetVital('weapons'),'weapons',9999).defender.fleet[0].defense;
 assert.equal(effectiveGunDamage(full,'mother',100),50);
 assert.equal(effectiveGunDamage(full,'escort',100),100);
});
test('point 26: a damaged command retains escort coordination but weakens their weapons',()=>{
 const s=targetVital('command'),p=s.fleet[0].defense.parts.command;
 const d=strike(s,'command',Math.ceil(p.max/2)).defender.fleet[0].defense;
 assert.equal(escortsCoordinated(d),true);
 assert.equal(effectiveGunDamage(d,'escort',100),85);
 assert.equal(effectiveGunDamage(d,'mother',100),100);
 const down=strike(s,'command',9999).defender.fleet[0].defense;
 assert.equal(escortsCoordinated(down),false);
 assert.equal(effectiveGunDamage(down,'escort',100),60);
});
test('point 26: generator impairment halves repair; KO collapses remaining shield',()=>{
 const s=targetVital('shieldGenerator'),p=s.fleet[0].defense.parts.shieldGenerator;
 const middle=strike(s,'shieldGenerator',Math.ceil(p.max/2));
 assert.equal(middle.systemDamaged,'shieldGenerator');
 assert.equal(middle.systemDisabled,null);
 assert.equal(shieldRepairEfficiency(middle.defender.fleet[0].defense),.5);
 const repair=restoreMotherShield(middle.defender.fleet[0].defense,10);
 assert.equal(repair.repaired,5);
 const ko=strike(middle.defender,'shieldGenerator',9999);
 assert.equal(ko.systemDisabled,'shieldGenerator');
 assert.equal(ko.defender.fleet[0].defense.shield.hp,0);
 assert.equal(ko.systemMessage,SYSTEM_CONSEQUENCES.shieldGenerator);
 assert.equal(shieldRepairEfficiency(ko.defender.fleet[0].defense),0);
 assert.equal(restoreMotherShield(ko.defender.fleet[0].defense,100).repaired,0);
});
test('point 26: destroying a part directly from healthy skips damaged notice',()=>{
 const s=targetVital('engine');
 const r=strike(s,'engine',9999);
 assert.equal(r.systemDamaged,null);
 assert.equal(r.systemDisabled,'engine');
 assert.equal(r.systemCondition,'destroyed');
 assert.equal(r.systemMessage,SYSTEM_CONSEQUENCES.engine);
});
test('point 26: protected vital cannot be damaged even with a valid math result',()=>{
 const s=targetVital('engine'),d=s.fleet[0].defense;
 const r=strike(s,'command',9999);
 assert.equal(r.systemDamaged,null);
 assert.equal(r.systemDisabled,null);
 assert.equal(r.systemMessage,null);
 assert.equal(r.defender.fleet[0].defense.parts.command.hp,d.parts.command.hp);
});
test('point 26: wrong mathematical signature never changes functional status',()=>{
 const s=targetVital('engine'),d=s.fleet[0].defense;
 const result=applyPendingHit(s,0,'plus',9999,{
  vitalId:'engine',cards:[{value:3,suit:'♥'},{value:5,suit:'♠'}],
  signatureOverride:proof,nowMs:1000
 });
 assert.equal(result.systemMessage,null);
 assert.equal(result.systemCondition,'healthy');
 assert.equal(result.defender.fleet[0].defense.parts.engine.hp,d.parts.engine.hp);
});
test('point 26: partial engine + weapons + command penalties combine correctly',()=>{
 const s=targetVital('engine').fleet[0].defense;
 const partial=Object.fromEntries(Object.entries(s.parts).map(([id,p])=>[id,{...p,
  hp:id==='shieldGenerator'?p.hp:Math.floor(p.max/2)}]));
 const d={...s,parts:partial};
 assert.equal(effectiveGunDamage(d,'mother',100),72);
 assert.equal(effectiveGunDamage(d,'escort',100),76);
 assert.equal(effectiveGunDamage(d,'mother',0),0);
});
test('point 26: KO transitions cannot restore mother vitals or exceed shield cap',()=>{
 const s=targetVital('shieldGenerator'),down=strike(s,'shieldGenerator',9999).defender;
 const def=down.fleet[0].defense;
 assert.equal(def.parts.shieldGenerator.hp,0);
 assert.equal(restoreMotherShield(def,999).repaired,0);
 assert.equal(def.shield.hp,0);
 const repeat=strike(down,'shieldGenerator',9999);
 assert.equal(repeat.systemDisabled,null);
 assert.equal(repeat.systemDamaged,null);
});
