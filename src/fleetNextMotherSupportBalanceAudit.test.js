// Audit HP reali di TUTTI i modelli madre e di tutti i supporti ufficiali.
// Esclude deliberatamente Personaggi. Le caratteristiche non vengono cambiate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_RARITIES,motherCombatStatsForRarity,combatLevelForRarity} from './fleetNext/shipRarity.js';
import {MOTHER_GENERATOR_PROFILES} from './fleetNext/motherGeneratorBalance.js';
import {createFleetMother} from './fleetNext/combat.js';
import {createIndependentFleetEscorts} from './fleetNext/supportDeployment.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {FLEET_PACING_WINDOWS} from './fleetNext/battlePacing.js';
import {supportWeaponCardBoost,supportNormalBoost,supportSpecialBoost}
 from './fleetNext/supportAbilities.js';

const average=values=>Math.round(values.reduce((s,n)=>s+n,0)/values.length);
test('48 profili madre: HP, difesa e potenza attacchi 2/4 a rarita pari',()=>{
 const matrix={};
 for(const rarity of SHIP_RARITIES){
  const rows=Object.keys(MOTHER_GENERATOR_PROFILES).map(id=>{
   const stats=motherCombatStatsForRarity(rarity,id),p=MOTHER_GENERATOR_PROFILES[id];
   assert.ok(stats&&p);
   const rapid=Math.round(stats.maxHp*p.quick.maxHpPercent/100);
   const heavy=Math.round(stats.maxHp*p.heavy.maxHpPercent/100);
   assert.ok(stats.maxHp>0&&stats.defensePercent>=0&&stats.defensePercent<=18);
   assert.ok(rapid>0&&heavy>rapid&&heavy<stats.maxHp);
   return {id,hp:stats.maxHp,def:stats.defensePercent,quick:rapid,heavy};
  });
  matrix[rarity]={hpMin:Math.min(...rows.map(r=>r.hp)),
   hpMean:average(rows.map(r=>r.hp)),
   hpMax:Math.max(...rows.map(r=>r.hp)),
   defenseMean:average(rows.map(r=>r.def)),
   quickMean:average(rows.map(r=>r.quick)),
   heavyMean:average(rows.map(r=>r.heavy)),
   rows};
 }
 assert.equal(Object.keys(matrix).length,4);
 console.log('MOTHER_SUPPORT_MOTHER_MATRIX='+JSON.stringify(matrix));
});
test('52 profili supporto: HP proporzionali alla madre e modello differenziato',()=>{
 assert.equal(SUPPORT_CATALOG.length,13);
 const rows={};
 for(const rarity of SHIP_RARITIES){
  const mother=createFleetMother('N00',combatLevelForRarity('N00',rarity));
  const refMother=motherCombatStatsForRarity(rarity,'N00');
  rows[rarity]=SUPPORT_CATALOG.map((definition,index)=>{
   const support=createIndependentFleetEscorts(mother,
    [{id:definition.id,instanceId:'audit-'+index,slot:0,rarita:rarity}])[0];
   assert.equal(support.supportSkillId,definition.skillId);
   assert.ok(support.maxHp>0&&support.maxHp===support.hp);
   return {id:definition.shipModelId,
    skill:definition.skillId,rarita:definition.rarita,
    hp:support.maxHp,pctMother:Math.round(100*support.maxHp/refMother.maxHp)};
  });
 }
 const report=Object.fromEntries(SHIP_RARITIES.map(r=>{
  const values=rows[r].map(s=>s.hp);
  return [r,{meanHp:average(values),minHp:Math.min(...values),
   maxHp:Math.max(...values),
   meanPctMother:average(rows[r].map(s=>s.pctMother)),
   details:rows[r]}];
 }));
 console.log('MOTHER_SUPPORT_ESCORT_MATRIX='+JSON.stringify(report));
});
test('Le passive supporto modificano intensita offensive: controllo rischio moltiplicazione',()=>{
 const side=n=>({independentSupportRoster:true,escorts:Array.from({length:n},(_,i)=>({
  hp:100,destroyed:false,linked:true,slot:i,
  supportSkillId:'weapon-double'}))});
 const boosts=[0,1,2].map(n=>supportWeaponCardBoost(side(n),100));
 assert.deepEqual(boosts,[100,200,400]);
 console.log('MOTHER_SUPPORT_WEAPON_BOOST='+JSON.stringify({without:100,one:200,two:400}));
 assert.ok(FLEET_PACING_WINDOWS.pvp.targetSeconds>=300);
});

test('Nuova modalita: bonus Arma dei supporti limitato, doppio x2.5 invece di x4',()=>{
 const sideWith=n=>({independentSupportRoster:true,newGeneratorCombat:true,
  escorts:Array.from({length:n},(_,i)=>({
   hp:100,destroyed:false,linked:true,slot:i,supportSkillId:'weapon-double'
  }))});
 assert.deepEqual([0,1,2].map(n=>supportWeaponCardBoost(sideWith(n),100)),[100,200,250]);
 const helper={independentSupportRoster:true,newGeneratorCombat:true,
  escorts:[{hp:100,destroyed:false,linked:true,slot:0,supportSkillId:'normal-boost'}]};
 assert.equal(supportWeaponCardBoost(helper,100),125);
});
