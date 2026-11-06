import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit,previewVolley} from './mathDuelEngine.js';
import {createMotherDefense,damageMotherShield,exposeMotherPart,restoreMotherShield} from './vitalDefense.js';
import {effectiveGunDamage,gunEfficiency,escortsCoordinated,SYSTEM_CONSEQUENCES} from './fleetSystems.js';
import {interceptMotherVolley} from './linkedEscorts.js';
const cards=[{value:4,suit:'♥'},{value:6,suit:'♠'}];
const battle=(id='L04')=>initialBattle(1,{vitalPrototype:true,fleetIds:[id],shipLevel:5},()=>.5);
const off=(defense,id)=>({...defense,parts:{...defense.parts,[id]:{...defense.parts[id],hp:0}}});
test('all four systems have consequences',()=>{
 for(const id of ['engine','weapons','shieldGenerator','command'])assert.ok(SYSTEM_CONSEQUENCES[id]);
});
test('engine KO reduces mother and escort damage by 25%',()=>{
 const d=off(battle().player.fleet[0].defense,'engine');
 assert.equal(gunEfficiency(d,'mother'),.75);assert.equal(gunEfficiency(d,'escort'),.75);
 assert.equal(effectiveGunDamage(d,'mother',100),75);
});
test('weapon system KO halves mother firepower but not escort guns',()=>{
 const d=off(battle().player.fleet[0].defense,'weapons');
 assert.equal(effectiveGunDamage(d,'mother',100),50);
 assert.equal(effectiveGunDamage(d,'escort',100),100);
});
test('command KO ends interception and reduces escort firepower',()=>{
 const b=battle(),d=off(b.player.fleet[0].defense,'command');
 assert.equal(effectiveGunDamage(d,'escort',100),60);
 assert.equal(escortsCoordinated(d),false);
 const hit=interceptMotherVolley(b.player.escorts,90,d);
 assert.equal(hit.intercepted,0);assert.equal(hit.remaining,90);
 assert.strictEqual(hit.escorts,b.player.escorts);
});
test('combined system penalties are numerically stable',()=>{
 let d=battle().player.fleet[0].defense;
 d=off(off(off(d,'engine'),'command'),'weapons');
 assert.equal(effectiveGunDamage(d,'mother',100),37);
 assert.equal(effectiveGunDamage(d,'escort',100),45);
 assert.equal(effectiveGunDamage(d,'escort',0),0);
});
test('destroying the generator collapses remaining shield on impact',()=>{
 const b=battle(),d=b.enemy.fleet[0].defense;
 let defense=damageMotherShield(d,Math.ceil(d.shield.max*.25)).defense;
 defense=exposeMotherPart(defense,'shieldGenerator').defense;
 assert.equal(defense.parts.shieldGenerator.exposed,true);
 const opponent={...b.enemy,fleet:[{...b.enemy.fleet[0],defense}]};
 const impact=applyPendingHit(opponent,0,'plus',10000,{
   vitalId:'shieldGenerator',cards,signatureOverride:{kind:'math',op:'plus',target:10}
 });
 assert.equal(impact.systemDisabled,'shieldGenerator');
 assert.ok(impact.shieldCollapsed>0);
 assert.equal(impact.defender.fleet[0].defense.shield.hp,0);
 assert.equal(impact.defender.fleet[0].defense.parts.shieldGenerator.hp,0);
 assert.equal(restoreMotherShield(impact.defender.fleet[0].defense,100).repaired,0);
});
test('shield cannot be restored if its generator is destroyed',()=>{
 const d=off(createMotherDefense({shipId:'N00'}),'shieldGenerator');
 const r=restoreMotherShield(d,100);
 assert.strictEqual(r.defense,d);assert.equal(r.blocked,'generator_destroyed');
});
test('suit routing and hands never change from system damage',()=>{
 const b=battle(),side=b.player;
 const mother={...side.fleet[0],defense:off(side.fleet[0].defense,'engine')};
 const damaged={...side,fleet:[mother]};
 const healthyVolley=previewVolley(side,cards),weak=previewVolley(damaged,cards);
 assert.deepEqual(healthyVolley.routing,weak.routing);
 assert.deepEqual(side.hand,damaged.hand);
 assert.ok(weak.totalDamage<=healthyVolley.totalDamage);
});
test('mother gun loses damage in real volley after weapon system KO',()=>{
 const b=battle(),gun=b.player.fleet[0].weapons[0];
 const suit=gun.seme_trigger==='*'?'♠':({H:'♥',D:'♦',C:'♣',S:'♠'}[gun.seme_trigger]);
 const ammo=[{value:10,suit}];
 const healthy=previewVolley(b.player,ammo,gun.id);
 const broken={...b.player,fleet:[{...b.player.fleet[0],defense:off(b.player.fleet[0].defense,'weapons')}]};
 const weak=previewVolley(broken,ammo,gun.id);
 assert.ok(healthy.totalDamage>0);assert.ok(weak.totalDamage<healthy.totalDamage);
});
test('live command allows normal escort interception',()=>{
 const b=battle();
 assert.ok(interceptMotherVolley(b.player.escorts,100,b.player.fleet[0].defense).intercepted>0);
});
