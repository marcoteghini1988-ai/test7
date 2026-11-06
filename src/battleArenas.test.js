// Punto 42: verifica arene tattiche, separazione cosmetica e simmetria.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {
 BATTLE_ARENAS,BATTLE_ARENA_IDS,battleArena,arenaForBattle,
 arenaAttackFactor,arenaMotherDefenseFactor,
 applyArenaIonResistance,applyArenaCalculationSync
} from './battleArenas.js';

const rng=()=>.5;
const up={vitalPrototype:true,fleetIds:['N00'],shipLevel:1};
const triple=[{id:'A',suit:'♥',value:2},{id:'B',suit:'♦',value:3},{id:'C',suit:'♣',value:4}];
test('42: cinque arene registrate con mappa deterministica per settore',()=>{
 assert.deepEqual(BATTLE_ARENA_IDS,['titanium','debris','plasma','ionic','resonance']);
 assert.equal(new Set(BATTLE_ARENA_IDS).size,5);
 for(let i=0;i<20;i++){
  const arena=arenaForBattle(i+1,'adventure');
  assert.equal(arena.id,BATTLE_ARENA_IDS[i%5]);
  assert.equal(arenaForBattle(i+1,'campaign').id,arena.id);
  assert.ok(arena.name&&arena.description&&arena.shortLabel);
 }
 assert.equal(arenaForBattle(2,'pvp').id,'titanium');
 assert.equal(arenaForBattle(4,'training').id,'titanium');
 assert.equal(arenaForBattle(0,'campaign').id,'titanium');
 assert.equal(arenaForBattle(NaN,'campaign').id,'titanium');
 assert.equal(arenaForBattle(1,'campaign','resonance').id,'resonance');
 assert.equal(arenaForBattle(2,'campaign','invalid').id,'debris');
 assert.strictEqual(battleArena('not-an-arena'),BATTLE_ARENAS.titanium);
});
test('42: il campo tattico non cambia la distribuzione delle carte e non crea risorse',()=>{
 const debris=initialBattle(2,up,rng,'adventure');
 const neutral=initialBattle(2,{...up,arenaId:'titanium'},rng,'adventure');
 assert.equal(debris.arena.id,'debris');
 assert.equal(neutral.arena.id,'titanium');
 assert.deepEqual(debris.player,neutral.player);
 assert.deepEqual(debris.enemy,neutral.enemy);
 assert.deepEqual(debris.targets,neutral.targets);
 assert.equal(debris.player.hand.length,7);
 assert.equal(debris.player.specialHand.length,5);
 assert.equal(initialBattle(4,up,rng,'arena').arena.id,'titanium');
});
test('42: detriti attenuano solo impatto reale allo scudo madre, senza toccare i vitali',()=>{
 const b=initialBattle(2,up,rng,'adventure');
 const defender=b.player;
 assert.equal(arenaMotherDefenseFactor('debris',defender,{vitalId:null,escortIndex:null}),.92);
 assert.equal(arenaMotherDefenseFactor('debris',defender,{vitalId:'engine'}),1);
 assert.equal(arenaMotherDefenseFactor('debris',defender,{escortIndex:0}),1);
 assert.equal(arenaMotherDefenseFactor('plasma',defender,{}),1);
 const shieldHit=applyPendingHit(defender,0,'plus',20,{nowMs:1000});
 const reduced=applyPendingHit(defender,0,'plus',20,{nowMs:1000,
  motherDefenseFactor:arenaMotherDefenseFactor('debris',defender,{})});
 assert.equal(shieldHit.motherDamage,20);
 assert.equal(reduced.motherDamage,18);
 assert.equal(shieldHit.defender.fleet[0].defense.shield.hp-reduced.defender.fleet[0].defense.shield.hp,-2);
 assert.deepEqual(shieldHit.defender.fleet[0].defense.parts, reduced.defender.fleet[0].defense.parts);
});
test('42: plasma richiede tre carte autentiche in un attacco già autorizzato',()=>{
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple}),1.06);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:false,cards:triple}),1);
 assert.equal(arenaAttackFactor('plasma',{cards:triple}),1);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple.slice(0,2)}),1);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:[...triple.slice(0,2),{value:Infinity}]}),1);
 assert.equal(arenaAttackFactor('titanium',{legalAttack:true,cards:triple}),1);
});
test('42: nebulosa non inventa ionizzazione, riduce solo quella attivata da una vera speciale',()=>{
 const b=initialBattle(4,up,rng,'adventure');
 const original=b.player;
 const hit=applyPendingHit(original,0,'plus',10,{nowMs:1000,
  strikeEffects:['shot-ion'],hitId:'arena-ion'});
 assert.ok(hit.strategicApplied.includes('shot-ion'));
 const until=hit.defender.strategicStatuses.ionizedUntil;
 assert.ok(until>1000);
 const shortened=applyArenaIonResistance(hit.defender,'ionic',hit.strategicApplied,1000);
 assert.equal(shortened.strategicStatuses.ionizedUntil,1000+Math.ceil((until-1000)*.75));
 assert.equal(applyArenaIonResistance(hit.defender,'ionic',[],1000),hit.defender);
 assert.equal(applyArenaIonResistance(hit.defender,'debris',hit.strategicApplied,1000),hit.defender);
 assert.equal(applyArenaIonResistance(original,'ionic',['shot-ion'],1000),original);
 assert.equal(original.strategicStatuses?.ionizedUntil,undefined);
});
test('42: risonanza premia solo un calcolo realmente registrato, mai oltre 100',()=>{
 const b=initialBattle(5,up,rng,'adventure');
 const player={...b.player,maneuvers:{...b.player.maneuvers,sync:60}};
 const boosted=applyArenaCalculationSync(player,'resonance',4);
 assert.equal(boosted.maneuvers.sync,61);
 assert.equal(player.maneuvers.sync,60);
 assert.strictEqual(applyArenaCalculationSync(player,'resonance',0),player);
 assert.strictEqual(applyArenaCalculationSync(player,'debris',4),player);
 assert.equal(applyArenaCalculationSync({...player,maneuvers:{...player.maneuvers,sync:99}},'resonance',12).maneuvers.sync,100);
 assert.strictEqual(applyArenaCalculationSync({...player,maneuvers:null},'resonance',12).maneuvers,null);
});
test('42: ogni arena applica le stesse regole ad ambo i lati, non dipende dall’inventario',()=>{
 const b=initialBattle(4,up,rng,'campaign');
 assert.deepEqual(b.player.fleet,b.enemy.fleet);
 assert.equal(arenaMotherDefenseFactor('debris',b.player,{}),arenaMotherDefenseFactor('debris',b.enemy,{}));
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple}),1.06);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple}),1.06);
});
