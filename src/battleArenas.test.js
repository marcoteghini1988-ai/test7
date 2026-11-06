// Punto 42: ambienti progressivi per pianeta e 12 boss con arene uniche.
// Tutti gli effetti si applicano soltanto a impatti/calcoli già autorizzati.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {
 BATTLE_ARENAS,BATTLE_ARENA_IDS,battleArena,arenaForBattle,
 arenaAttackFactor,arenaMotherDefenseFactor,
 applyArenaIonResistance,applyArenaCalculationSync,arenaTacticalBriefing,arenaEnvironment
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
 assert.equal(new Set(bosses.map(a=>JSON.stringify(Object.entries(a.effects).sort(([x],[y])=>x.localeCompare(y))))).size,12);
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


test('43: briefing dell’arena neutra non inventa alcun modificatore',()=>{
 const base=arenaTacticalBriefing('titanium');
 assert.equal(base.id,'titanium');
 assert.equal(base.neutral,true);
 assert.equal(base.effectCount,0);
 assert.deepEqual(base.conditions,[]);
 assert.match(base.introduction,/nessun bonus/i);
 assert.equal(arenaTacticalBriefing('invalid').id,'titanium');
});

test('43: ogni effetto descrive solo la propria condizione reale',()=>{
 const player=initialBattle(3,up,rng,'adventure').player;
 const enemy=initialBattle(3,up,rng,'adventure').enemy;
 const debris=arenaTacticalBriefing('debris',{player,enemy});
 assert.deepEqual(debris.conditions.map(c=>c.id),['debris']);
 assert.match(debris.conditions[0].activation,/8%/);
 assert.match(debris.conditions[0].status,/attivo/);
 const withoutShield=structuredClone(enemy);
 withoutShield.fleet[0].defense.shield.hp=0;
 assert.match(arenaTacticalBriefing('debris',{enemy:withoutShield}).conditions[0].status,/esaurito/);
 const plasma=arenaTacticalBriefing('plasma',{selectedCount:3});
 assert.equal(plasma.conditions.length,1);
 assert.match(plasma.conditions[0].activation,/6%/);
 assert.match(plasma.conditions[0].status,/calcolo valido/);
 assert.match(arenaTacticalBriefing('plasma',{selectedCount:2}).conditions[0].status,/2 su 3/);
 assert.match(arenaTacticalBriefing('ionic').conditions[0].activation,/25%/);
 assert.match(arenaTacticalBriefing('resonance',{player}).conditions[0].activation,/massimo di 100/);
 assert.equal(arenaTacticalBriefing('resonance',{player}).conditions[0].id,'resonance');
});

test('43: tutte le 12 arene boss sono distinguibili, senza cambiare bilanciamento',()=>{
 const b=initialBattle(3,up,rng,'adventure');
 const seen=new Set();
 for(const planet of PHASE16A_CAMPAIGN_PLANETS){
  const id='boss_'+planet.id;
  const preview=arenaTacticalBriefing(id,{player:b.player,enemy:b.enemy});
  assert.equal(preview.id,id);
  assert.equal(preview.kind,'boss');
  assert.equal(preview.neutral,false);
  assert.equal(preview.effectCount,2);
  assert.equal(preview.conditions.length,2);
  assert.ok(preview.conditions.every(c=>c.activation&&c.strategy));
  assert.match(preview.introduction,/entrambe le flotte/);
  const fingerprint=preview.conditions.map(c=>c.activation).join(';');
  assert.equal(seen.has(fingerprint),false,id+' deve distinguersi per effetti o intensità');
  seen.add(fingerprint);
 }
 assert.equal(seen.size,12);
 // La sola lettura delle condizioni è pura: nessun HP, carta o effetto viene toccato.
 const snapshot=structuredClone(b);
 arenaTacticalBriefing('boss_1',{player:b.player,enemy:b.enemy,selectedCount:3});
 assert.deepEqual(b,snapshot);
});


test('44: il ciclo atmosferico cambia ogni tre calcoli validi senza usare timer',()=>{
 const expected=[
  [1,'quiet',3,1],[2,'quiet',2,1],[3,'quiet',1,1],
  [4,'charged',3,1],[6,'charged',1,1],
  [7,'surge',3,1],[9,'surge',1,1],[10,'quiet',3,2],
  [13,'charged',3,2],[16,'surge',3,2]
 ];
 for(const [round,stage,left,cycle] of expected){
  const e=arenaEnvironment('plasma',round);
  assert.equal(e.stage,stage);
  assert.equal(e.calculationsUntilChange,left);
  assert.equal(e.cycle,cycle);
 }
 const neutral=arenaEnvironment('titanium',300);
 assert.equal(neutral.stage,'quiet');
 assert.equal(neutral.calculationsUntilChange,null);
 assert.deepEqual(neutral.families,[]);
 assert.equal(arenaEnvironment('invalid',4).neutral,true);
 assert.equal(arenaEnvironment('plasma',NaN).stage,'quiet');
 assert.deepEqual(arenaEnvironment('planet_1_advanced',7).families,['debris','plasma']);
});

test('44: le fasi modulano soltanto bonus condizionali già esistenti',()=>{
 const player=initialBattle(3,up,rng,'adventure').player;
 const leg={legalAttack:true,cards:triple};
 const q=arenaEnvironment('plasma',1).stage;
 const c=arenaEnvironment('plasma',4).stage;
 const p=arenaEnvironment('plasma',7).stage;
 assert.equal(arenaAttackFactor('plasma',{...leg,environmentStage:q}),1.06);
 assert.ok(Math.abs(arenaAttackFactor('plasma',{...leg,environmentStage:c})-1.075)<1e-10);
 assert.ok(Math.abs(arenaAttackFactor('plasma',{...leg,environmentStage:p})-1.09)<1e-10);
 assert.equal(arenaAttackFactor('plasma',{...leg,environmentStage:p,legalAttack:false}),1);
 assert.equal(arenaAttackFactor('plasma',{...leg,environmentStage:p,cards:triple.slice(0,2)}),1);
 assert.equal(arenaMotherDefenseFactor('debris',player,{environmentStage:q}),.92);
 assert.ok(Math.abs(arenaMotherDefenseFactor('debris',player,{environmentStage:p})-.904)<1e-10);
 assert.equal(arenaMotherDefenseFactor('debris',player,{environmentStage:p,vitalId:'engine'}),1);
 assert.equal(arenaMotherDefenseFactor('debris',player,{environmentStage:p,escortIndex:0}),1);
 assert.equal(arenaMotherDefenseFactor('titanium',player,{environmentStage:p}),1);
 assert.equal(arenaAttackFactor('titanium',{...leg,environmentStage:p}),1);
});

test('44: ionizzazione e Sincronia non si creano durante Turbolenza o Picco',()=>{
 const b=initialBattle(4,up,rng,'adventure');
 const hit=applyPendingHit(b.player,0,'plus',10,{
  nowMs:1000,strikeEffects:['shot-ion'],hitId:'ambient-44'});
 assert.ok(hit.strategicApplied.includes('shot-ion'));
 const remaining=hit.defender.strategicStatuses.ionizedUntil-1000;
 const calm=applyArenaIonResistance(hit.defender,'ionic',hit.strategicApplied,1000,'quiet');
 const peak=applyArenaIonResistance(hit.defender,'ionic',hit.strategicApplied,1000,'surge');
 assert.equal(calm.strategicStatuses.ionizedUntil,1000+Math.ceil(remaining*.75));
 assert.equal(peak.strategicStatuses.ionizedUntil,1000+Math.ceil(remaining*.68));
 assert.strictEqual(applyArenaIonResistance(hit.defender,'ionic',[],1000,'surge'),hit.defender);
 assert.strictEqual(applyArenaIonResistance(hit.defender,'titanium',hit.strategicApplied,1000,'surge'),hit.defender);
 const side={...hit.defender,maneuvers:{...hit.defender.maneuvers,sync:50}};
 assert.equal(applyArenaCalculationSync(side,'resonance',1,'quiet').maneuvers.sync,51);
 assert.equal(applyArenaCalculationSync(side,'resonance',1,'charged').maneuvers.sync,52);
 assert.equal(applyArenaCalculationSync(side,'resonance',1,'surge').maneuvers.sync,53);
 assert.equal(applyArenaCalculationSync(side,'resonance',0,'surge'),side);
 assert.equal(applyArenaCalculationSync({...side,maneuvers:{...side.maneuvers,sync:99}},'resonance',1,'surge').maneuvers.sync,100);
 assert.strictEqual(applyArenaCalculationSync(side,'titanium',1,'surge'),side);
});

test('44: 12 boss con identità cromatiche e combinazioni ambientali coerenti',()=>{
 const colors=new Set();
 for(const planet of PHASE16A_CAMPAIGN_PLANETS){
  const arena='boss_'+planet.id;
  const e=arenaEnvironment(arena,7);
  assert.equal(e.boss,true);
  assert.equal(e.stage,'surge');
  assert.equal(e.families.length,2);
  assert.match(e.accent,/^#[0-9a-f]{6}$/i);
  colors.add(e.accent);
  assert.deepEqual(e.families,
   arenaEnvironment(arena,1).families);
 }
 assert.equal(colors.size,12);
 for(const id of BATTLE_ARENA_IDS){
  const e=arenaEnvironment(id,4);
  assert.equal(e.neutral,battleArena(id).effectCount===0);
  assert.equal(e.families.length,battleArena(id).effectCount);
 }
 const briefing=arenaTacticalBriefing('boss_1',{round:7});
 assert.equal(briefing.environment.stage,'surge');
 assert.match(briefing.introduction,/PICCO/);
});
