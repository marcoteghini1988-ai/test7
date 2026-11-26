import test from 'node:test';import assert from 'node:assert/strict';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {ALL_WEAPON_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {GRAPPLE_ID,COLLISION_ID,INDUCTION_ID,activeGrappleLinks,collisionGroups} from './chainWeaponBattleVisuals.js';
import {fleetWeaponShots,weaponEffectProfile} from './maglioBattleVisuals.js';
import {weaponLaunchOrigin} from './weaponKinematics.js';
const pass={cards:[],pass:true},enemy=who=>who==='A'?'B':'A';
const shots=r=>r.events.filter(e=>e.kind==='weapon-provisional-shot');
for(const id of [GRAPPLE_ID,GRAPPLE_ID+'-rarity-e',GRAPPLE_ID+'-rarity-l',COLLISION_ID,COLLISION_ID+'-rarity-l'])for(const who of ['A','B'])
test(id+' '+who+' is autonomous for three own turns, with one real jaw and a final release',()=>{
 let b=createMaglioReviewBattle({cardId:id,supports:false,nowMs:0});
 b.sides.A.hand=[];b.sides.B.hand=[];b.sides[who].hand=[id];
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',pass,0).battle;
 const p=ALL_WEAPON_BY_ID[id].effectSpec.weaponProfile,origins=[];
 for(let turn=1;turn<=3;turn++){
  const r=resolvePreparedFleetTurn(b,who,{...pass,cards:turn===1?[0]:[],targetKind:'part',targetId:'weapons'},turn*1000);
  assert.ok(r.ok,r.reason);assert.ok(!r.invalidPrepared,r.invalidPrepared);
  const e=shots(r).find(e=>e.cardId===id);assert.ok(e);assert.equal(e.hitCount,1);assert.ok(!e.jawCombo);
  assert.equal(e.impacts[0].nominalDamage,Math.round(p.baseDamage*(turn===3&&p.finalTearBonusPercent?1.5:1)));
  assert.equal(e.stage,turn);assert.ok(e.actualDamage>0);
  const s=fleetWeaponShots(r.events).find(s=>s.cardId===id);origins.push(weaponLaunchOrigin(s));
  if(turn<3)assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who===who).length,1);
  else assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who===who).length,0);
  b=r.battle;if(turn<3)b=resolvePreparedFleetTurn(b,enemy(who),pass,turn*1000+1).battle;
 }
 assert.deepEqual(origins[0],origins[1]);assert.deepEqual(origins[0],origins[2]);
 b=resolvePreparedFleetTurn(b,enemy(who),pass,4000).battle;
 const fourth=resolvePreparedFleetTurn(b,who,pass,5000);assert.ok(fourth.ok);assert.ok(!shots(fourth).some(e=>e.cardId===id));b=fourth.battle;
 assert.ok(!b.sides[who].machines.some(m=>m.sourceCardId===id));
});
for(const supportCount of [0,1,2])for(const who of ['A','B'])for(const reversed of [false,true])
test(`A+B ${who}, ${supportCount} supports, ${reversed?'B then A':'A then B'}: one valid collision and no repeat`,()=>{
 const a=GRAPPLE_ID+'-rarity-e',z=COLLISION_ID;
 let b=createMaglioReviewBattle({cardId:z,supports:supportCount>0,supportCount,nowMs:0});
 b.sides.A.hand=[];b.sides.B.hand=[];b.sides[who].hand=reversed?[z,a]:[a,z];
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',pass,0).battle;
 const r=resolvePreparedFleetTurn(b,who,{cards:[0,1],targetKind:supportCount?'escort':'part',targetId:supportCount?b.sides[enemy(who)].escorts[0].id:'weapons'},1000);
 assert.ok(r.ok,r.reason);assert.ok(!r.invalidPrepared,r.invalidPrepared);
 const collisions=shots(r).filter(e=>e.jawCombo);assert.equal(collisions.length,1);
 const c=collisions[0];assert.equal(c.impacts.length,supportCount?2:1);assert.equal(c.contactMode,supportCount?'pair':'floor');
 assert.equal(c.jawOrigins.length,2);assert.equal(collisionGroups(fleetWeaponShots(r.events)).length,1);
 for(const hit of c.impacts)assert.equal(hit.nominalDamage,ALL_WEAPON_BY_ID[z].effectSpec.weaponProfile.comboBonusDamage);
 assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who===who).length,0);
 const ordered=fleetWeaponShots(r.events),boom=ordered.find(s=>s.jawCombo);
 assert.ok(boom.delayMs>=Math.max(...ordered.filter(s=>!s.jawCombo).map(s=>s.delayMs+weaponEffectProfile(s.cardId,s).flightMs))+630);
 b=resolvePreparedFleetTurn(r.battle,enemy(who),pass,2000).battle;
 const again=resolvePreparedFleetTurn(b,who,pass,3000);assert.ok(again.ok);assert.ok(!shots(again).some(e=>e.jawCombo));
});
test('A blocked first hook never turns into a floor collision while other enemy ships are alive',()=>{
 const a=GRAPPLE_ID+'-rarity-e',z=COLLISION_ID;
 const b=createMaglioReviewBattle({cardId:z,supports:true,withDefense:true,nowMs:0});b.sides.A.hand=[a,z];
 const r=resolvePreparedFleetTurn(b,'A',{cards:[0,1],targetKind:'escort',targetId:b.sides.B.escorts[0].id},1000);
 assert.ok(r.ok);assert.equal(shots(r).filter(e=>e.jawCombo).length,0);
 assert.equal(shots(r).find(e=>e.cardId===a).actualDamage,0);
});
for(const count of [0,1,2,5])for(const defense of [false,true])
test(`Induction ${count} physical Energy, defense ${defense}: capped exclusive mode and no resource consumption`,()=>{
 const b=createMaglioReviewBattle({cardId:INDUCTION_ID,supports:true,energyCards:count,withDefense:defense,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',{cards:[0],targetKind:'escort',targetId:b.sides.B.escorts[0].id},1000);assert.ok(r.ok);
 const e=r.events.find(e=>e.kind==='weapon-designed-shot'),base=ALL_WEAPON_BY_ID[INDUCTION_ID].effectSpec.weaponProfile.baseDamage;
 const bonus=defense?0:count>=2?40:count?20:0;
 assert.equal(e.inductionBonusPercent,bonus);assert.equal(e.impacts[0].nominalDamage,Math.round(base*(1+bonus/100)));
 assert.equal(e.inductionMode,defense?'defense':count?'boost':'base');
 assert.deepEqual(r.battle.sides.A.energyPile,b.sides.A.energyPile);assert.equal(e.energyConsumed,0);
});
