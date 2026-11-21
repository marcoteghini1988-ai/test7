// Regressione: 73 famiglie Arma, progressioni di rarita' e ritmo a pari livelli.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIP_RARITIES,MOTHER_RARITY_SCALING} from './fleetNext/shipRarity.js';
import {ALL_WEAPON_CARDS,WEAPON_BASE_CARDS,EVOLVED_WEAPON_CARDS,
 WEAPON_EVOLUTION_FAMILIES,weaponAtRarity,weaponNextEvolution}
 from './fleetNext/weaponRarityEvolutions.js';
import {card,cardCopyLimit,cardRole} from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {NEXT_WEAPON_COLLECTION_CARDS,MAX_WEAPON_INVENTORY_COPIES,
 evolveNextWeaponWithDuplicates,canSelectNewGeneric,
 buyNextCommonCard,buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {motherCombatStatsForRarity} from './fleetNext/shipRarity.js';

const damageFields=['baseDamage','secondDamage','extraDamage','supportDamage','motherDamage',
 'terrainSupportDamage','bonusDamage','comboBonus','comboBonusDamage',
 'characterBonusDamage','perSupportDamage','maxExtraDamage','damagePerDiscard',
 'perDiscardAttack','soloDamage','chainDamage','maxNominalDamage',
 'maxDamage','burnMinimum','burnMaxDamage','burnPerDiscard'];
function values(spec){
 const out=[];
 for(const key of damageFields)if(typeof spec[key]==='number'&&spec[key]>0)out.push(spec[key]);
 for(const key of ['damages','damageStages'])if(Array.isArray(spec[key]))
  out.push(...spec[key].filter(n=>typeof n==='number'&&n>0));
 if(spec.weaponProfile)out.push(...values(spec.weaponProfile));
 return out;
}

test('Tutte le 73 famiglie hanno ogni stadio superiore fino a Leggendaria (235 carte)',()=>{
 assert.equal(WEAPON_BASE_CARDS.length,73);
 assert.equal(EVOLVED_WEAPON_CARDS.length,162);
 assert.equal(ALL_WEAPON_CARDS.length,235);
 assert.equal(NEXT_WEAPON_COLLECTION_CARDS.length,235);
 assert.equal(new Set(ALL_WEAPON_CARDS.map(c=>c.id)).size,235);
 assert.equal(Object.keys(WEAPON_EVOLUTION_FAMILIES).length,73);
 for(const base of WEAPON_BASE_CARDS){
  const i=SHIP_RARITIES.indexOf(base.rarita);
  const required=SHIP_RARITIES.slice(i),family=WEAPON_EVOLUTION_FAMILIES[base.id];
  assert.deepEqual(family.map(c=>c.rarita),required,base.id);
  assert.equal(family[0],base);
  for(const c of family){
   assert.equal(card(c.id),c,c.id);
   assert.equal(cardRole(c.id),'support',c.id);
   assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
   assert.equal(describeEffect(c),c.effectProposed,c.id);
   assert.equal(canSelectNewGeneric(c.id),true,c.id);
   assert.ok(cardCopyLimit(c.id)>0,c.id);
   assert.equal(c.effectSpec.durationTurns,base.effectSpec.durationTurns,c.id);
   assert.equal(c.effectSpec.damageMode,base.effectSpec.damageMode,c.id);
   assert.equal(c.elementId,base.elementId,c.id);
   assert.equal(c.name,base.name,c.id);
   assert.equal(c.playable,true,c.id);
   assert.equal(weaponAtRarity(c.id,c.rarita),c);
   assert.equal(weaponNextEvolution(c.id),family[family.indexOf(c)+1]||null);
  }
  for(let k=1;k<family.length;k++){
   const prev=family[k-1],next=family[k],before=values(prev.effectSpec),
    after=values(next.effectSpec);
   assert.ok(before.length&&before.length===after.length,base.id);
   assert.ok(after.every((n,j)=>n>before[j]),next.id);
  }
 }
});

test('Durate, colpi, consumi Energia e costi HP non vengono aumentati per rarita',()=>{
 for(const base of WEAPON_BASE_CARDS){
  const spec=base.effectSpec;
  for(const c of WEAPON_EVOLUTION_FAMILIES[base.id].slice(1)){
   const s=c.effectSpec;
   assert.equal(s.durationTurns,spec.durationTurns,c.id);
   assert.equal(s.sequenceStage,spec.sequenceStage,c.id);
   assert.equal(s.shotCount,spec.shotCount,c.id);
   assert.equal(s.maxExtraShots,spec.maxExtraShots,c.id);
   assert.equal(s.crystalPolarity,spec.crystalPolarity,c.id);
   if(spec.weaponProfile){
    for(const key of ['durationTurns','shots','maxExtraShots','maxBonus','maxEnergy',
     'energyCost','energyTransferCost','freshEnergyCost','motherCostPercent',
     'allyCostPercent','healOnHitPercent','damageConversionPercent','damagePercent',
     'bonusPercent','freezeSeconds','freezeTurns','burnTurns','thresholds']){
     assert.deepEqual(s.weaponProfile[key],spec.weaponProfile[key],c.id+': '+key);
    }
   }
  }
 }
});

test('Progressione dei danni analoga alla crescita HP, non a un tempo fisso',()=>{
 const a=WEAPON_EVOLUTION_FAMILIES['weapon-base-ionic-01'];
 const hpFactor=rarita=>MOTHER_RARITY_SCALING[SHIP_RARITIES.indexOf(rarita)].hp;
 for(const rarity of SHIP_RARITIES){
  const evolved=a.find(c=>c.rarita===rarity);
  const hp=motherCombatStatsForRarity(rarity,'C01').maxHp;
  const baseHp=motherCombatStatsForRarity('Comune','C01').maxHp;
  assert.ok(evolved.effectSpec.baseDamage>0);
  const damageRatio=evolved.effectSpec.baseDamage/a[0].effectSpec.baseDamage;
  const hpRatio=hp/baseHp;
  assert.ok(Math.abs(damageRatio-hpRatio)<.1,rarity+' '+damageRatio+'/'+hpRatio);
  assert.ok(Math.abs(hpFactor(rarity)/hpFactor('Comune')-hpRatio)<.02);
 }
});

test('Fusione di tre copie: due materiali consumati e una conservata ad ogni rarita',()=>{
 const id='weapon-confirmed-metallic-maglio';
 let inv={...createFleetInventory(),credits:100,owned:{[id]:3}};
 for(const expected of ['Rara','Epica','Leggendaria']){
  const current=Object.entries(inv.owned).find(([key,value])=>value>=3&&
   key.startsWith(id))[0];
  const result=evolveNextWeaponWithDuplicates(inv,current);
  assert.equal(result.ok,true,result.reason);
  assert.equal(card(result.destinationId).rarita,expected);
  assert.equal(result.inventory.owned[current],1);
  assert.equal(result.inventory.owned[result.destinationId],1);
  assert.equal(result.inventory.credits,100);
  assert.equal(inv.owned[current],3,'nessuna mutazione dell inventario');
  inv={...result.inventory,owned:{...result.inventory.owned,
   [result.destinationId]:3}};
 }
 assert.equal(evolveNextWeaponWithDuplicates(inv,id+'-rarity-l').ok,false);
 assert.equal(evolveNextWeaponWithDuplicates(inv,'missing-weapon').ok,false);
});

test('La singola copia nel mazzo non blocca la raccolta delle tre copie per evolvere',()=>{
 const rare='weapon-sequence-1',legend='weapon-sequence-1-rarity-l';
 const original=card(rare),advanced=card(legend);
 assert.equal(original.maxCopiesPerDeck,1);
 assert.equal(advanced.maxCopiesPerDeck,1);
 let inv={...createFleetInventory(),credits:50000};
 for(let i=0;i<3;i++){
  const bought=buyNextCommonCard(inv,rare);
  assert.equal(bought.ok,true,bought.reason);
  inv=bought.inventory;
 }
 assert.equal(inv.owned[rare],3);
 const evolved=evolveNextWeaponWithDuplicates(inv,rare);
 assert.equal(evolved.ok,true,evolved.reason);
 assert.equal(evolved.inventory.owned[rare],1);
 assert.equal(evolved.inventory.owned['weapon-sequence-1-rarity-r'],1);
 assert.equal(MAX_WEAPON_INVENTORY_COPIES,12);
 const deck=buildNextBaseDeck(normalizeFleetInventory(evolved.inventory),'C01',5,[rare,rare]);
 assert.equal(deck.baseDeck.filter(id=>id===rare).length,1);
});

test('La Carta Arma evoluta infligge piu danno senza cambiare gli slot',()=>{
 const source='weapon-base-ionic-01';
 for(const rarity of SHIP_RARITIES){
  const c=weaponAtRarity(source,rarity);
  const b=createFleetNextBattle({shipA:'C01',shipB:'C01',
   raritaA:rarity,raritaB:rarity,supportRosterA:[],supportRosterB:[],
   mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:301,nowMs:0});
  b.sides.A.hand=[c.id];
  const result=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
  assert.equal(result.ok,true,rarity+' '+result.reason);
  const fx=result.events.find(e=>e.kind==='weapon-base-shot');
  assert.equal(fx.cardId,c.id);
  assert.equal(fx.nominalDamage,c.effectSpec.baseDamage);
  assert.ok(fx.actualDamage>0,rarity);
  assert.equal(result.battle.sides.A.machines.length,1);
  assert.equal(result.battle.sides.A.machines[0].sourceCardId,c.id);
 }
});
