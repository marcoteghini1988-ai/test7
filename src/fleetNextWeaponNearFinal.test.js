// Eclissi Stellare — il catalogo numerico quasi definitivo di tutte le 235 Armi.
// Non crea Armi nuove, non cambia arte, costo Energia, durata, numero di colpi,
// personaggi, terreni o timer. Il motore in partita usa i fattori attivi.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_WEAPON_CARDS,WEAPON_BASE_CARDS,EVOLVED_WEAPON_CARDS,
 WEAPON_NEAR_FINAL_VALUES,WEAPON_NEAR_FINAL_BY_ID}
 from './fleetNext/weaponRarityEvolutions.js';
import {STRATEGIC_NO_DRAIN_BALANCE}
 from './fleetNext/strategicNoDrainBalance.js';
import {arsenalBonus} from './fleetNext/newCardEffects.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

const RARITIES=['Comune','Rara','Epica','Leggendaria'];
const DAMAGE_FIELDS=['baseDamage','secondDamage','extraDamage','supportDamage',
 'motherDamage','terrainSupportDamage','bonusDamage','comboBonus','comboBonusDamage',
 'characterBonusDamage','perSupportDamage','maxExtraDamage','damagePerDiscard',
 'perDiscardAttack','soloDamage','chainDamage','maxNominalDamage','maxDamage',
 'burnMinimum','burnMaxDamage','burnPerDiscard'];
const SUMMARIZE=['baseDamage','secondDamage','extraDamage','supportDamage',
 'motherDamage','terrainSupportDamage','bonusDamage','comboBonus','comboBonusDamage',
 'characterBonusDamage','perSupportDamage','maxExtraDamage','damagePerDiscard',
 'perDiscardAttack','soloDamage','chainDamage','maxNominalDamage','maxDamage',
 'burnMinimum','burnMaxDamage','burnPerDiscard','damagePercent','damages',
 'damageStages','shotCount','shots','durationTurns','maxExtraShots','burnTurns',
 'comboMultiplier','bonusPercent','motherCostPercent','allyCostPercent',
 'binarioBonusDamage','couplerBonusDamage','freezeSeconds','healingPercent',
 'energyCost','energyTransferCost'];

function assertValues(raw,shown,pattern,factor){
 for(const name of DAMAGE_FIELDS)if(typeof raw[name]==='number'&&raw[name]>0)
  assert.equal(shown[name],Math.round(raw[name]*factor),raw.id+'/'+name);
 for(const name of ['damages','damageStages']){
  if(!Array.isArray(raw[name]))continue;
  const percentStages=pattern==='binary-overload'&&name==='damageStages';
  const result=raw[name].map(n=>percentStages||!(n>0)?n:Math.round(n*factor));
  assert.deepEqual(shown[name],result,raw.id+'/'+name);
 }
 for(const [key,value] of Object.entries(raw))
  if(!DAMAGE_FIELDS.includes(key)&&!['damages','damageStages','weaponProfile'].includes(key))
   assert.deepEqual(shown[key],value,raw.id+' conserva '+key);
 if(raw.weaponProfile)assertValues(raw.weaponProfile,shown.weaponProfile,pattern,factor);
}

function damageSummary(spec){
 const profile=spec.weaponProfile||spec;
 return Object.fromEntries(SUMMARIZE
  .filter(k=>profile[k]!==undefined&&profile[k]!==null)
  .map(k=>[k,profile[k]]));
}

test('LOCK_235_WEAPON_VALUES: ogni Arma ha numeri quasi definitivi senza doppio moltiplicatore',()=>{
 assert.equal(WEAPON_BASE_CARDS.length,73);
 assert.equal(EVOLVED_WEAPON_CARDS.length,162);
 assert.equal(ALL_WEAPON_CARDS.length,235);
 assert.equal(WEAPON_NEAR_FINAL_VALUES.length,235);
 assert.equal(Object.keys(WEAPON_NEAR_FINAL_BY_ID).length,235);
 assert.equal(STRATEGIC_NO_DRAIN_BALANCE.weaponValuesNearFinal,true);
 assert.equal(STRATEGIC_NO_DRAIN_BALANCE.printValuesStillProvisional,false);
 assert.deepEqual(Object.keys(STRATEGIC_NO_DRAIN_BALANCE.weaponNominalMultiplier).sort(),[...RARITIES].sort());
 const rows=[];
 for(const raw of ALL_WEAPON_CARDS){
  const shown=WEAPON_NEAR_FINAL_BY_ID[raw.id],factor=STRATEGIC_NO_DRAIN_BALANCE.weaponNominalMultiplier[raw.rarita];
  assert.ok(shown,'Manca carta '+raw.id);
  assert.equal(raw.balancePending,false,raw.id);
  assert.equal(shown.balancePending,false,raw.id);
  assert.equal(shown.weaponValuesNearFinal,true,raw.id);
  assert.equal(shown.balanceRevision,STRATEGIC_NO_DRAIN_BALANCE.id,raw.id);
  assert.equal(shown.elementId,raw.elementId,raw.id);
  assert.equal(shown.effectSpec.damageMode,raw.effectSpec.damageMode,raw.id);
  assert.equal(shown.effectSpec.durationTurns,raw.effectSpec.durationTurns,raw.id);
  const pattern=raw.effectSpec.weaponProfile?.pattern||raw.effectSpec.damageMode;
  assertValues(raw.effectSpec,shown.effectSpec,pattern,factor);
  // La scheda mostra il nominale senza difesa, elemento o passive.
  // Il danno reale del motore ha questi modificatori, non un nuovo fattore.
  const base=raw.effectSpec.weaponProfile?.baseDamage??raw.effectSpec.baseDamage;
  const shownBase=shown.effectSpec.weaponProfile?.baseDamage??shown.effectSpec.baseDamage;
  if(base>0&&!['percent','binary-overload'].includes(pattern)){
   const machine={...raw.effectSpec,id:raw.id,slot:0};
   const side={ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,
    weaponBalanceFactor:factor,ships:[{maxHp:1000,defensePercent:10}],
    machines:[machine],escorts:[],systemCardEffects:[],
    componentTimers:{weapons:{expired:false}}};
   assert.equal(arsenalBonus(side,machine,0,base),shownBase,
    'Numero mostrato e colpo nominale senza bonus devono coincidere: '+raw.id);
  }
  if(pattern==='percent')
   assert.equal(shown.effectSpec.weaponProfile.damagePercent,
    raw.effectSpec.weaponProfile.damagePercent,raw.id+' danno % invariato');
  rows.push({
   id:raw.id,name:raw.name,element:raw.elementId,
   rarity:raw.rarita,family:raw.weaponFamilyId||raw.id,
   pattern,initialRarity:raw.originRarity||raw.rarita,
   factor,damage:damageSummary(shown.effectSpec),
   description:shown.effectProposed
  });
 }
 assert.equal(new Set(rows.map(r=>r.id)).size,235);
 const perRarity=Object.fromEntries(RARITIES.map(r=>[r,rows.filter(x=>x.rarity===r).length]));
 console.log('LOCK_235_WEAPON_SUMMARY='+JSON.stringify({count:rows.length,perRarity,
  first:rows.find(x=>x.id==='weapon-confirmed-metallic-maglio')}));
 for(let offset=0;offset<rows.length;offset+=8)
  console.log('LOCK_235_WEAPON_BATCH_'+offset+'='+JSON.stringify(rows.slice(offset,offset+8)));
});
