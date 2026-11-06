// Punto 42: ambienti progressivi per pianeta e 12 boss con arene uniche.
// Tutti gli effetti si applicano soltanto a impatti/calcoli già autorizzati.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {
 BATTLE_ARENAS,BATTLE_ARENA_IDS,battleArena,arenaForBattle,
 arenaAttackFactor,arenaMotherDefenseFactor,
 applyArenaIonResistance,applyArenaCalculationSync
} from './battleArenas.js';

const rng=()=>.5;
const up={vitalPrototype:true,fleetIds:['N00'],shipLevel:1};
const triple=[{id:'A',suit:'♥',value:2},{id:'B',suit:'♦',value:3},{id:'C',suit:'♣',value:4}];

test('42: arena base senza effetti e quattro varianti ordinarie',()=>{
 assert.equal(BATTLE_ARENAS.titanium.effectCount,0);
 assert.deepEqual(BATTLE_ARENAS.titanium.effects,{});
 assert.equal(BATTLE_ARENAS.titanium.kind,'neutral');
 assert.deepEqual(['debris','plasma','ionic','resonance'].map(id=>BATTLE_ARENAS[id].effectCount),[1,1,1,1]);
 assert.equal(new Set(BATTLE_ARENA_IDS).size,29);
 assert.equal(arenaForBattle(2,'pvp').id,'titanium');
 assert.equal(arenaForBattle(4,'training').id,'titanium');
 assert.equal(arenaForBattle(0,'campaign').id,'titanium');
 assert.equal(arenaForBattle(NaN,'campaign').id,'titanium');
 assert.equal(arenaForBattle(999,'campaign').id,'titanium');
 assert.strictEqual(battleArena('not-an-arena'),BATTLE_ARENAS.titanium);
});

test('42: progressione di ogni pianeta: L1-2 neutra, L3-6 uno, L7-9 due, L10 boss',()=>{
 assert.equal(PHASE16A_CAMPAIGN_PLANETS.length,12);
 const families=['debris','plasma','ionic','resonance'];
 PHASE16A_CAMPAIGN_PLANETS.forEach((planet,i)=>{
  for(let local=1;local<=10;local++){
   const historicLevel=(planet.id-1)*10+local;
   const campaignLevel=i*10+local;
   const adv=arenaForBattle(historicLevel,'adventure');
   const campaign=arenaForBattle(campaignLevel,'campaign');
   assert.equal(adv.id,campaign.id,planet.name+' settore '+local);
   assert.equal(adv.effectCount,local<=2?0:local<=6?1:2);
   if(local<=2)assert.equal(adv.id,'titanium');
   else if(local<=6)assert.equal(adv.id,families[i%4]);
   else if(local<=9)assert.equal(adv.id,'planet_'+planet.id+'_advanced');
   else {
    assert.equal(adv.id,'boss_'+planet.id);
    assert.equal(adv.kind,'boss');
    assert.ok(adv.description&&adv.name);
   }
  }
 });
 const bosses=PHASE16A_CAMPAIGN_PLANETS.map(planet=>BATTLE_ARENAS['boss_'+planet.id]);
 assert.equal(new Set(bosses.map(a=>a.id)).size,12);
 assert.equal(new Set(bosses.map(a=>a.name)).size,12);
 assert.equal(new Set(bosses.map(a=>JSON.stringify(a.effects))).size,12);
});

test('42: parametri espliciti del pianeta usati anche con numerazione legacy',()=>{
 assert.equal(arenaForBattle(1,'adventure',null,{planetId:20,sectorLevel:10}).id,'boss_20');
 assert.equal(arenaForBattle(1,'campaign',null,{planetId:20,sectorLevel:8}).id,'planet_20_advanced');
 assert.equal(arenaForBattle(1,'adventure',null,{planetId:20,sectorLevel:1}).id,'titanium');
 assert.equal(arenaForBattle(2,'campaign','resonance').id,'resonance');
 assert.equal(arenaForBattle(3,'campaign','invalid').id,'debris');
 assert.equal(arenaForBattle(101,'adventure').id,'titanium'); // Europa L1, non pianeta numero 11 della sequenza
 assert.equal(arenaForBattle(110,'adventure').id,'boss_11');
});

test('42: le arene non modificano inventari, mani, bersagli o valori iniziali',()=>{
 const normal=initialBattle(3,up,rng,'adventure');
 const neutral=initialBattle(3,{...up,arenaId:'titanium'},rng,'adventure');
 assert.equal(normal.arena.id,'debris');
 assert.equal(neutral.arena.id,'titanium');
 assert.deepEqual(normal.player,neutral.player);
 assert.deepEqual(normal.enemy,neutral.enemy);
 assert.deepEqual(normal.targets,neutral.targets);
 assert.equal(normal.player.hand.length,7);
 assert.equal(normal.player.specialHand.length,5);
 assert.equal(initialBattle(10,up,rng,'arena').arena.id,'titanium');
 assert.equal(initialBattle(1,{...up,arenaPlanetId:20,arenaSectorLevel:10},rng,'adventure').arena.id,'boss_20');
});

test('42: i detriti intervengono solo sullo scudo madre all’impatto',()=>{
 const b=initialBattle(3,up,rng,'adventure'),defender=b.player;
 assert.equal(arenaMotherDefenseFactor('debris',defender,{vitalId:null,escortIndex:null}),.92);
 assert.equal(arenaMotherDefenseFactor('debris',defender,{vitalId:'engine'}),1);
 assert.equal(arenaMotherDefenseFactor('debris',defender,{escortIndex:0}),1);
 assert.equal(arenaMotherDefenseFactor('plasma',defender,{}),1);
 assert.equal(arenaMotherDefenseFactor('titanium',defender,{}),1);
 assert.equal(arenaMotherDefenseFactor('planet_1_advanced',defender,{}),.92);
 assert.equal(arenaMotherDefenseFactor('boss_1',defender,{}),.91);
 const hit=applyPendingHit(defender,0,'plus',20,{nowMs:1000});
 const reduced=applyPendingHit(defender,0,'plus',20,{nowMs:1000,
  motherDefenseFactor:arenaMotherDefenseFactor('debris',defender,{})});
 assert.equal(hit.motherDamage,20);
 assert.equal(reduced.motherDamage,18);
 assert.deepEqual(hit.defender.fleet[0].defense.parts,reduced.defender.fleet[0].defense.parts);
});

test('42: plasma richiede tre numeriche autentiche e attacco consentito',()=>{
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple}),1.06);
 assert.equal(arenaAttackFactor('planet_1_advanced',{legalAttack:true,cards:triple}),1.06);
 assert.equal(arenaAttackFactor('boss_2',{legalAttack:true,cards:triple}),1.07);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:false,cards:triple}),1);
 assert.equal(arenaAttackFactor('plasma',{cards:triple}),1);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple.slice(0,2)}),1);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:[...triple.slice(0,2),{value:Infinity}]}),1);
 assert.equal(arenaAttackFactor('titanium',{legalAttack:true,cards:triple}),1);
});

test('42: ionizzazione limitata soltanto se prodotta da speciale reale',()=>{
 const b=initialBattle(4,up,rng,'adventure');
 const original=b.player;
 const hit=applyPendingHit(original,0,'plus',10,{nowMs:1000,
  strikeEffects:['shot-ion'],hitId:'arena-ion'});
 assert.ok(hit.strategicApplied.includes('shot-ion'));
 const until=hit.defender.strategicStatuses.ionizedUntil;
 assert.ok(until>1000);
 const shortened=applyArenaIonResistance(hit.defender,'ionic',hit.strategicApplied,1000);
 assert.equal(shortened.strategicStatuses.ionizedUntil,1000+Math.ceil((until-1000)*.75));
 const boss=applyArenaIonResistance(hit.defender,'boss_1',hit.strategicApplied,1000);
 assert.equal(boss.strategicStatuses.ionizedUntil,1000+Math.ceil((until-1000)*.74));
 assert.equal(applyArenaIonResistance(hit.defender,'ionic',[],1000),hit.defender);
 assert.equal(applyArenaIonResistance(hit.defender,'titanium',hit.strategicApplied,1000),hit.defender);
 assert.equal(applyArenaIonResistance(original,'ionic',['shot-ion'],1000),original);
});

test('42: risonanza soltanto dopo calcoli reali e massimo Sincronia 100',()=>{
 const b=initialBattle(5,up,rng,'adventure');
 const player={...b.player,maneuvers:{...b.player.maneuvers,sync:60}};
 assert.equal(applyArenaCalculationSync(player,'resonance',4).maneuvers.sync,61);
 assert.equal(applyArenaCalculationSync(player,'boss_2',1).maneuvers.sync,61);
 assert.strictEqual(applyArenaCalculationSync(player,'titanium',1),player);
 assert.strictEqual(applyArenaCalculationSync(player,'resonance',0),player);
 assert.equal(applyArenaCalculationSync({...player,maneuvers:{...player.maneuvers,sync:99}},'resonance',12).maneuvers.sync,100);
 assert.strictEqual(applyArenaCalculationSync({...player,maneuvers:null},'resonance',12).maneuvers,null);
});

test('42: le arene non favoriscono il giocatore o IA e non dipendono dallo shop',()=>{
 const b=initialBattle(3,up,rng,'campaign');
 assert.deepEqual(b.player.fleet,b.enemy.fleet);
 assert.equal(arenaMotherDefenseFactor('debris',b.player,{}),arenaMotherDefenseFactor('debris',b.enemy,{}));
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple}),1.06);
 assert.equal(arenaAttackFactor('plasma',{legalAttack:true,cards:triple}),1.06);
});
