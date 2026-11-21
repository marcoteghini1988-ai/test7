// Eclissi Stellare — audit riproducibile Difese, Trappole, Terreni e
// Carte Arma con danni percentuali, senza Personaggi o immagini.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EXCLUSIVE_DESIGNS_120} from './fleetNext/exclusive120.js';
import {EXCLUSIVE_CARDS,card,cardRole} from './fleetNext/rules.js';
import {isTrapCard} from './fleetNext/simpleEffects.js';
import {FUSION_DENIAL_TRAP} from './fleetNext/fusionDenialTrap.js';
import {ELEMENTAL_TERRAIN_CARDS,ELEMENTAL_TERRAIN_GLOBAL_RULE}
 from './fleetNext/elementalTerrainCards.js';
import {applyElementalDamage} from './fleetNext/elementalDamage.js';
import {DESIGNED_WEAPON_CARDS} from './fleetNext/designedWeaponCards.js';
import {arsenalBonus} from './fleetNext/newCardEffects.js';
import {NEXT_COMMON_CARDS} from './fleetNext/newCardRegistry.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {STRATEGIC_NO_DRAIN_BALANCE} from './fleetNext/strategicNoDrainBalance.js';

test('Catalogo Difese e Trappole: 21+10 esclusive autentiche, slot separati, nessun Personaggio',()=>{
 const defense=EXCLUSIVE_DESIGNS_120.filter(x=>x.type==='Difesa');
 const traps=EXCLUSIVE_DESIGNS_120.filter(x=>x.type==='Trappola');
 assert.equal(defense.length,21);
 assert.equal(traps.length,10);
 for(const c of [...defense,...traps]){
  const actual=EXCLUSIVE_CARDS[c.id];
  assert.ok(actual,'Carta inesistente '+c.id);
  assert.equal(actual.playable,true,c.id);
  assert.equal(card(c.id).id,c.id);
  assert.equal(cardRole(c.id),'defense','Non si deve usare uno slot Attacco: '+c.id);
  assert.equal(isTrapCard(actual),c.type==='Trappola','Trappola visibile o Difesa coperta '+c.id);
  assert.notEqual(cardRole(c.id),'character');
 }
 assert.equal(cardRole(FUSION_DENIAL_TRAP.id),'defense');
 assert.equal(isTrapCard(FUSION_DENIAL_TRAP),true);
 const perMother=Object.fromEntries([...new Set(EXCLUSIVE_DESIGNS_120.map(x=>x.shipId))]
  .map(id=>[id,{defense:defense.filter(x=>x.shipId===id).length,
   traps:traps.filter(x=>x.shipId===id).length}]));
 console.log('CARD_FAMILY_DEFENSE_TRAP_AUDIT='+JSON.stringify({count:32,perMother}));
});

test('Tutti i 120 Terreni: 10 elementi x 3 funzioni x 4 rarita, una sola istanza attiva',()=>{
 assert.equal(ELEMENTAL_TERRAIN_CARDS.length,120);
 assert.equal(ELEMENTAL_TERRAIN_GLOBAL_RULE.onlyOneActive,true);
 assert.equal(ELEMENTAL_TERRAIN_GLOBAL_RULE.stacksWithItself,false);
 assert.equal(ELEMENTAL_TERRAIN_GLOBAL_RULE.affectsBothPlayers,true);
 assert.equal(ELEMENTAL_TERRAIN_GLOBAL_RULE.permanentUntilReplacedOrCountered,true);
 const expected={Comune:{single:10,dual:5},Rara:{single:12,dual:6},
  Epica:{single:14,dual:7},Leggendaria:{single:16,dual:8}};
 const perRarity={};
 for(const [rarity,pct] of Object.entries(expected)){
  const list=ELEMENTAL_TERRAIN_CARDS.filter(c=>c.rarita===rarity);
  assert.equal(list.length,30);
  const report={ATT:[],DEF:[],EQ:[]};
  for(const x of list){
   const mode=x.id.split('-').at(-2);
   const obj=x.effectSpec;
   assert.equal(obj.elementId,x.elementId);
   assert.equal(obj.attackPercent,x.attackPercent);
   assert.equal(obj.defensePercent,x.defensePercent);
   assert.equal(card(x.id).id,x.id);
   assert.equal(cardRole(x.id),'terrain');
   if(mode==='ATT')assert.deepEqual([x.attackPercent,x.defensePercent],[pct.single,0]);
   else if(mode==='DEF')assert.deepEqual([x.attackPercent,x.defensePercent],[0,pct.single]);
   else if(mode==='EQ')assert.deepEqual([x.attackPercent,x.defensePercent],[pct.dual,pct.dual]);
   else assert.fail('Modalita terreno sconosciuta '+mode);
   report[mode].push(x.id);
  }
  assert.ok(Object.values(report).every(ids=>ids.length===10));
  perRarity[rarity]=Object.fromEntries(Object.entries(report).map(([m,ids])=>[m,ids.length]));
 }
 console.log('CARD_FAMILY_TERRAIN_AUDIT='+JSON.stringify(perRarity));
});
test('Terreno Leggendario: attacco +16% o difesa 16%, doppia funzione +8/+8 non moltiplica due volte',()=>{
 const defender=()=>({ships:[{defensePercent:10}],elementalDamageRemainders:{}});
 const source=ELEMENTAL_TERRAIN_CARDS.filter(c=>c.rarita==='Leggendaria'&&
  c.elementId==='plasma');
 const byMode=Object.fromEntries(source.map(x=>[x.id.split('-').at(-2),x]));
 const calc=mode=>{
  const t=byMode[mode],o=applyElementalDamage(defender(),'plasma','plasma',1000,{
   terrainAttackPercent:t.attackPercent,terrainDefensePercent:t.defensePercent,terrainKey:t.id
  });
  return o.damage;
 };
 assert.equal(calc('ATT'),1160);
 assert.equal(calc('DEF'),840);
 assert.equal(calc('EQ'),993);
 assert.equal(applyElementalDamage(defender(),'plasma','plasma',1000).damage,1000);
});
test('Giudizio Temporale e sovraccarichi percentuali: mai un secondo fattore di rarita nascosto',()=>{
 const patterns=['percent','binary-overload','single'];
 const results={};
 for(const pattern of patterns){
  const mother={maxHp:1000,defensePercent:10};
  const machine={id:'probe',damageMode:'designed-shot',weaponProfile:{pattern},
   power:0,untilPly:20};
  const side={ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,
   ships:[mother],escorts:[],machines:[machine],systemCardEffects:[],
   weaponBalanceFactor:STRATEGIC_NO_DRAIN_BALANCE.weaponNominalMultiplier.Leggendaria,
   componentTimers:{weapons:{expired:false}}};
  const rawHp=Math.round(1000*.20);
  const effective=arsenalBonus(side,machine,0,rawHp);
  results[pattern]=effective;
 }
 assert.equal(results.percent,200);
 assert.equal(results['binary-overload'],200);
 assert.equal(results.single,370,'Solo i colpi numerici scalano con ×1,85');
 const judgement=DESIGNED_WEAPON_CARDS.find(x=>x.id==='weapon-designed-ionic-giudizio-temporale');
 assert.ok(judgement);
 assert.equal(judgement.rarita,'Leggendaria');
 assert.equal(judgement.effectSpec.weaponProfile.damagePercent,20);
 console.log('CARD_FAMILY_PERCENT_DAMAGE_AUDIT='+JSON.stringify(results));
});
test('Le 32 Carte Sistema non cambiano i valori di danno stampati sulle 235 Carte Arma',()=>{
 const systems=NEXT_COMMON_CARDS.filter(c=>c.effectSpec.type==='systemModifier');
 assert.equal(systems.length,32);
 for(const rarity of ['Comune','Rara','Epica','Leggendaria']){
  assert.equal(systems.filter(c=>c.rarita===rarity).length,8);
  for(const system of ['weapons','command','bridge','generator'])
   for(const operation of ['disable','amplify'])
    assert.equal(systems.filter(c=>c.rarita===rarity&&
     c.effectSpec.system===system&&c.effectSpec.operation===operation).length,1);
 }
 const resets=NEXT_COMMON_CARDS.filter(c=>c.effectSpec.type==='fieldReset');
 assert.equal(resets.length,1);
 assert.equal(resets[0].id,'sys-black-hole');
});
