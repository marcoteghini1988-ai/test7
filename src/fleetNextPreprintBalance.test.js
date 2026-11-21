import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_WEAPON_CARDS,WEAPON_BASE_CARDS,WEAPON_EVOLUTION_FAMILIES,
 WEAPON_PRINT_CANDIDATES,WEAPON_PRINT_CANDIDATE_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {PACING_BALANCE_CANDIDATE} from './fleetNext/pacingBalanceCandidate.js';
import {WEAPON_RARITY_POWER} from './fleetNext/weaponBalanceCalibration.js';
import {card} from './fleetNext/rules.js';
import {describeEffect} from './fleetNext/simpleEffects.js';
const damageFields=['baseDamage','secondDamage','extraDamage','supportDamage','motherDamage',
 'terrainSupportDamage','bonusDamage','comboBonus','comboBonusDamage',
 'characterBonusDamage','perSupportDamage','maxExtraDamage','damagePerDiscard',
 'perDiscardAttack','soloDamage','chainDamage','maxNominalDamage','maxDamage',
 'burnMinimum','burnMaxDamage','burnPerDiscard'];
const damagingValues=spec=>{
 const found=[];
 for(const key of damageFields)if(Number.isFinite(spec?.[key])&&spec[key]>0)
  found.push([key,spec[key]]);
 if(spec?.weaponProfile)found.push(...damagingValues(spec.weaponProfile).map(([k,v])=>['profile.'+k,v]));
 return found;
};
test('Catalogo stampa candidato per 235 Armi, senza modificare alcuna carta attiva',()=>{
 assert.equal(WEAPON_BASE_CARDS.length,73);
 assert.equal(WEAPON_PRINT_CANDIDATES.length,235);
 assert.equal(new Set(WEAPON_PRINT_CANDIDATES.map(c=>c.id)).size,235);
 assert.equal(PACING_BALANCE_CANDIDATE.status,'SIMULATED_NOT_LIVE');
 assert.deepEqual(WEAPON_RARITY_POWER,PACING_BALANCE_CANDIDATE.weaponNominalMultiplier);
 let commonCount=0,diffCount=0;
 for(const source of ALL_WEAPON_CARDS){
  const proposal=WEAPON_PRINT_CANDIDATE_BY_ID[source.id];
  assert.ok(proposal&&proposal!==source);
  assert.equal(proposal.rarita,source.rarita);
  assert.equal(proposal.name,source.name);
  assert.equal(proposal.effectSpec.durationTurns,source.effectSpec.durationTurns);
  assert.equal(proposal.effectSpec.damageMode,source.effectSpec.damageMode);
  assert.equal(proposal.elementId,source.elementId);
  assert.equal(proposal.balanceStatus,'PRINT_PREVIEW_ONLY_NOT_LIVE');
  assert.equal(card(source.id),source,'La carta in partita deve restare quella esistente');
  if(source.rarita==='Comune'){
   commonCount++;
   const before=damagingValues(source.effectSpec),after=damagingValues(proposal.effectSpec);
   assert.equal(before.length,after.length,source.id);
   if(before.some(([k,v],i)=>after[i][1]<v))diffCount++;
   assert.ok(before.every(([k,v],i)=>k===after[i][0]&&after[i][1]<=v),source.id);
   assert.equal(describeEffect(proposal),proposal.effectProposed,source.id);
  }else{
   assert.equal(proposal.effectSpec,source.effectSpec,source.id);
   assert.equal(proposal.effectProposed,source.effectProposed,source.id);
  }
 }
 assert.equal(commonCount,32);
 assert.equal(diffCount,32);
});
test('Stesse funzioni e durata per evoluzioni, proposte da Comune inferiori a Rara',()=>{
 for(const source of WEAPON_BASE_CARDS){
  const family=WEAPON_EVOLUTION_FAMILIES[source.id];
  if(family.length<2)continue;
  const first=WEAPON_PRINT_CANDIDATE_BY_ID[family[0].id],
   next=WEAPON_PRINT_CANDIDATE_BY_ID[family[1].id];
  const valuesA=damagingValues(first.effectSpec),valuesB=damagingValues(next.effectSpec);
  assert.equal(valuesA.length,valuesB.length,source.id);
  assert.ok(valuesA.every(([k,v],i)=>k===valuesB[i][0]&&v<valuesB[i][1]),source.id);
 }
});
test('Timer: il Generatore non si rompe e il deterioramento segue la rarita',()=>{
 const c=PACING_BALANCE_CANDIDATE;
 assert.deepEqual(c.timedComponentIds,['weapons','command','bridge']);
 assert.equal(c.generatorCannotPermanentlyBreak,true);
 assert.ok(c.deteriorationFractionPerSecond.Leggendaria>
  c.deteriorationFractionPerSecond.Epica);
 assert.ok(c.deteriorationFractionPerSecond.Epica>
  c.deteriorationFractionPerSecond.Rara);
 assert.equal(c.motherHpMultiplier.Comune,1.15);
 assert.equal(c.weaponNominalMultiplier.Comune,.6);
 assert.equal(c.targetSeconds.min,300);
 assert.equal(c.targetSeconds.max,360);
});
