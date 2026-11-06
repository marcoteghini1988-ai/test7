import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotherDefense} from './vitalDefense.js';
import {useSupportCard} from './specialSupport.js';
import {
 BOSS_NUMERIC_DECK_IDS,BOSS_NUMERIC_DECKS,activeNumericBossAbilities,
 numericBossAbilityGrade,equipBossNumericDeck,bossNumericDamageFactor,
 bossNumericDefenseFactor,rememberBossNumericImpact,bossNumericRecoveryMs,
 bossNumericRepairAmount,bossNumericSyncBonus,applyBossNumericSync,
 reduceBossNumericStatuses
} from './bossNumericDecks.js';
const make=(id='planet_char_1',level=1)=>equipBossNumericDeck({
 fleet:[{defense:createMotherDefense({shipId:'N00',shieldMax:100,partHp:25})}],
 hand:[],deck:[],discard:[],reshuffles:0,maneuvers:{sync:0}
},id,level);
test('31: 12 mazzi originali, 4 singoli, 5 doppi, 3 tripli, 23 abilità',()=>{
 assert.equal(BOSS_NUMERIC_DECK_IDS.length,12);
 const total=BOSS_NUMERIC_DECK_IDS.reduce((n,id)=>n+BOSS_NUMERIC_DECKS[id].abilities.length,0);
 assert.equal(total,23);
 assert.deepEqual(BOSS_NUMERIC_DECK_IDS.map(id=>BOSS_NUMERIC_DECKS[id].maxLevel).sort((a,b)=>a-b),
  [3,3,3,3,6,6,6,6,6,9,9,9]);
});
test('31: prima abilità ai livelli 1-3, seconda 4-6, terza 7-9',()=>{
 assert.deepEqual([1,2,3,4,5,6,7,8,9].map(l=>[numericBossAbilityGrade(l,0),numericBossAbilityGrade(l,1),numericBossAbilityGrade(l,2)]),
 [[1,0,0],[2,0,0],[3,0,0],[3,1,0],[3,2,0],[3,3,0],[3,3,1],[3,3,2],[3,3,3]]);
 for(const id of BOSS_NUMERIC_DECK_IDS){
  const d=BOSS_NUMERIC_DECKS[id];
  for(let level=1;level<=d.maxLevel;level++){
   const abilities=activeNumericBossAbilities(id,level);
   assert.equal(abilities.filter(a=>a.unlocked).length,Math.ceil(level/3));
   assert.equal(abilities[0].grade,Math.min(3,level));
  }
 }
});
test('31: starter non riceve passivi; Gaia aggiunge HP reali e massimi',()=>{
 assert.equal(equipBossNumericDeck(make('neutral_starter'),'neutral_starter',9).bossNumericDeck,undefined);
 const basic={fleet:[{defense:createMotherDefense({shipId:'N00',shieldMax:100,partHp:25})}]};
 assert.equal(equipBossNumericDeck(basic,'neutral_starter',9),basic);
 for(const [level,max] of [[1,104],[2,106],[3,108],[9,108]]){
  const s=make('planet_char_1',level);
  assert.equal(s.fleet[0].defense.shield.hp,max);
  assert.equal(s.fleet[0].defense.shield.max,max);
 }
});
test('31: livelli sconosciuti e falsi non generano risorse né abilità',()=>{
 assert.deepEqual(activeNumericBossAbilities('inesistente',9),[]);
 const side=make('planet_char_3',6);
 assert.equal(side.hand.length,0);
 assert.equal(side.deck.length,0);
 assert.equal(side.discard.length,0);
 assert.equal(side.bossNumericDeck.level,6);
 assert.equal(equipBossNumericDeck(make('planet_char_6'), 'planet_char_6',9).bossNumericDeck.level,3);
});
test('31: Afrodite riduce il ricambio e aumenta SOLO la riparazione pagata',()=>{
 const s=make('planet_char_3',6);
 assert.equal(bossNumericRecoveryMs(s),9000);
 assert.equal(bossNumericRepairAmount(s,20),22);
 assert.equal(bossNumericRepairAmount(make('planet_char_3',3),20),20);
 const damaged={...s,fleet:[{...s.fleet[0],defense:{...s.fleet[0].defense,shield:{hp:50,max:100}}}]};
 const restored=useSupportCard(damaged,'support-shield-repair',1000);
 assert.equal(restored.activated,true);
 assert.equal(restored.amount,22);
 assert.equal(restored.side.fleet[0].defense.shield.hp,72);
});
test('31: Crono riduce solo il primo impatto riuscito alla madre',()=>{
 const attacker=make('planet_char_1'),defender=make('planet_char_6',3);
 assert.equal(bossNumericDefenseFactor(defender,{}),.84);
 const none=rememberBossNumericImpact(attacker,defender,{}, {motherDamage:0,damage:0});
 assert.equal(bossNumericDefenseFactor(none.defender,{}),.84);
 const yes=rememberBossNumericImpact(attacker,defender,{}, {motherDamage:7,damage:7});
 assert.equal(bossNumericDefenseFactor(yes.defender,{}),1);
 assert.equal(bossNumericDefenseFactor(defender,{escortIndex:0}),1);
});
test('31: Generatore guadagna Sincronia solo su eventi reali e rispetta 100',()=>{
 let s=make('planet_char_14',6);
 assert.equal(bossNumericSyncBonus(s,0),0);
 assert.equal(bossNumericSyncBonus(s,15),4);
 s=applyBossNumericSync({...s,maneuvers:{sync:95}},15);
 assert.equal(s.maneuvers.sync,99);
 s=applyBossNumericSync({...s,maneuvers:{sync:99}},15);
 assert.equal(s.maneuvers.sync,100);
});
test('31: Sentinella e Generatore accorciano soltanto status realmente applicati',()=>{
 const s=make('planet_char_7',2);
 const withStatus={...s,strategicStatuses:{ionizedUntil:13000,corrodedUntil:16000}};
 const reduced=reduceBossNumericStatuses(withStatus,['shot-ion'],1000);
 assert.equal(reduced.strategicStatuses.ionizedUntil,10000);
 assert.equal(reduced.strategicStatuses.corrodedUntil,16000);
 const unchanged=reduceBossNumericStatuses(withStatus,[],1000);
 assert.equal(unchanged,withStatus);
 const generator={...make('planet_char_14',6),strategicStatuses:{ionizedUntil:13000,corrodedUntil:16000}};
 const g=reduceBossNumericStatuses(generator,['shot-ion','shot-corrosion'],1000);
 assert.equal(g.strategicStatuses.ionizedUntil,8800);
 assert.equal(g.strategicStatuses.corrodedUntil,10750);
});
test('31: Tharsis premiato solo per due veri impatti sul medesimo vitale',()=>{
 const s=make('planet_char_2',3),enemy=make('planet_char_6');
 assert.equal(bossNumericDamageFactor(s,enemy,{vitalId:'engine'}),1);
 const miss=rememberBossNumericImpact(s,enemy,{vitalId:'engine'}, {damage:0,motherDamage:0});
 assert.equal(bossNumericDamageFactor(miss.attacker,enemy,{vitalId:'engine'}),1);
 const hit=rememberBossNumericImpact(s,enemy,{vitalId:'engine'}, {damage:10,motherDamage:10});
 assert.equal(bossNumericDamageFactor(hit.attacker,enemy,{vitalId:'engine'}),1.07);
 assert.equal(bossNumericDamageFactor(hit.attacker,enemy,{vitalId:'weapons'}),1);
});
test('31: Leviatano non accredita il riciclo avvenuto dopo il lancio',()=>{
 const s=make('planet_char_8',6),enemy=make('planet_char_6');
 const future={...s,reshuffles:1};
 assert.equal(bossNumericDamageFactor(future,enemy,{reshufflesAtLaunch:0,cards:[{suit:'♥'},{suit:'♠'}]}),1);
 assert.equal(bossNumericDamageFactor(future,enemy,{reshufflesAtLaunch:1,cards:[{suit:'♥'},{suit:'♠'}]}),1.08);
 assert.equal(bossNumericDamageFactor(future,enemy,{reshufflesAtLaunch:1,cards:[{suit:'♥'},{suit:'♠'},{suit:'♣'}]}),1.15);
});
test('31: Risonanza richiede armi e semi reali, non inventati',()=>{
 const enemy=make('planet_char_6'),s=make('planet_char_17',9);
 assert.equal(bossNumericDamageFactor(s,enemy,{weaponKey:'W01',cards:[{suit:'♥'},{suit:'♠'}],escortShot:true}),1.14);
 const shot=rememberBossNumericImpact(s,enemy,{weaponKey:'W01'},{damage:7,motherDamage:7});
 assert.equal(bossNumericDamageFactor(shot.attacker,enemy,{weaponKey:'W02'}),1.08);
 assert.equal(bossNumericDamageFactor(shot.attacker,enemy,{weaponKey:'W01'}),1);
});
test('31: Sovrano non ripara un sistema KO, attenua l ultimo vitale vivo',()=>{
 const s=make('planet_char_20',9);
 const original=s.fleet[0].defense;
 const parts={...original.parts};
 for(const id of ['engine','weapons','shieldGenerator'])parts[id]={...parts[id],hp:0};
 const last={...s,fleet:[{...s.fleet[0],defense:{...original,parts,shield:{...original.shield,hp:0}}}]};
 assert.equal(bossNumericDefenseFactor(last,{}),.76);
 assert.equal(last.fleet[0].defense.parts.engine.hp,0);
});
