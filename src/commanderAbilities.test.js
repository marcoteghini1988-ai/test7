// Punto 41 — regressioni delle 33 passive comandante nel combattimento continuo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 COMMANDER_ABILITIES,COMMANDER_ABILITY_IDS,commanderAbility,
 commanderAbilityStatus,commanderAttackFactor,commanderDefenseFactor,
 rememberCommanderImpact
} from './commanderAbilities.js';

const cards=[{id:'h1',value:8,suit:'♥'},{id:'h2',value:3,suit:'♦'}];
const mixed=[cards[0],{id:'s1',value:3,suit:'♠'}];
const triple=[...mixed,{id:'d1',value:2,suit:'♦'}];
const defense=(shield=100,parts={})=>({
 kind:'mother',shield:{hp:shield,max:100},parts:Object.fromEntries(
 ['engine','weapons','shieldGenerator','command'].map(id=>[id,{hp:parts[id]??25,max:25}])
)});
const side=(id='pilot_com_1',opts={})=>({
 fleet:[{id:'N00',defense:defense(opts.shield??100,opts.parts)}],
 escorts:opts.escorts||[],strategicStatuses:opts.statuses||{},
 commander:id?{id,level:opts.level||1,...(opts.commander||{})}:null
});
const hit={damage:12,motherDamage:12};
const context=(op='plus',extra={})=>({op,cards,nowMs:1000,reshufflesAtLaunch:0,
 escortIndex:null,vitalId:null,strikeEffects:[],...extra});
const commit=(a,b,ctx,h=hit)=>rememberCommanderImpact(a,b,ctx,h);
test('41: catalogo 33 piloti esatti; nessuna sentinella NPC e livelli L1-L5',()=>{
 assert.equal(COMMANDER_ABILITY_IDS.length,33);
 assert.equal(new Set(COMMANDER_ABILITY_IDS).size,33);
 for(const id of COMMANDER_ABILITY_IDS){
  const ability=commanderAbility(id);
  assert.equal(ability.id,id);
  assert.equal(ability.levels.length,5,id);
  assert.ok(ability.levels.every((n,i)=>Number.isInteger(n)&&n>0&&(i===0||n>=ability.levels[i-1])),id);
  assert.ok(ability.description,id);
  assert.ok(['Attacco','Difesa'].includes(ability.role),id);
  const status=commanderAbilityStatus(side(id,{level:5}));
  assert.equal(status.value,ability.levels[4],id);
 }
 assert.equal(commanderAbility('pilot_sentinel_1'),null);
 assert.equal(commanderAbilityStatus(side('pilot_missing')),null);
 assert.equal(commanderAttackFactor(side(null),side(),context()),1);
 assert.equal(commanderDefenseFactor(side(null),side(),context()),1);
 assert.equal(commanderAbilityStatus(side('pilot_com_1',{level:999})).level,5);
});
test('41: operatori base non cambiano i semi, i mazzi e non premiano altre operazioni',()=>{
 for(const [id,op] of [['pilot_com_1','plus'],['pilot_com_2','minus'],
  ['pilot_com_3','times'],['pilot_com_4','divide']]){
  const attacker=side(id,{level:5}),enemy=side();
  const before=structuredClone(attacker);
  const applied=commanderAttackFactor(attacker,enemy,context(op));
  assert.equal(applied,1.06,id);
  assert.equal(commanderAttackFactor(attacker,enemy,context(op==='plus'?'minus':'plus')),1,id);
  assert.equal(commanderAttackFactor(attacker,enemy,{...context(op),cards:[cards[0]]}),1,id);
  assert.deepEqual(attacker,before,'No mutations from preview');
 }
});
test('41: Gaia difende solo la madre al primo impatto reale, mai le scudiere',()=>{
 let defender=side('pilot_boss_1',{level:5}),attacker=side();
 assert.equal(commanderDefenseFactor(defender,attacker,context()),.93);
 assert.equal(commanderDefenseFactor(defender,attacker,context('plus',{escortIndex:0})),1);
 let after=commit(attacker,defender,context(),{damage:0,motherDamage:0});
 assert.deepEqual(after.defender,defender);
 after=commit(attacker,defender,context());
 defender=after.defender;
 assert.equal(defender.commander.receivedMotherHits,1);
 assert.equal(commanderDefenseFactor(defender,attacker,context()),1);
});
test('41: memoria solo dopo un impatto efficace; ripetizione, alternanza e terzo colpo',()=>{
 const enemy=side();
 for(const [id,expected] of [['pilot_boss_2',1.07],['pilot_boss_11',1.07],
  ['pilot_leg_3',1.08]]){
  let a=side(id,{level:5});
  const first=context('plus',{vitalId:'engine'});
  assert.equal(commanderAttackFactor(a,enemy,first),1);
  a=commit(a,enemy,first).attacker;
  assert.equal(commanderAttackFactor(a,enemy,first),id==='pilot_boss_2'?expected:1);
  const changed=context('minus',{vitalId:'weapons'});
  assert.equal(commanderAttackFactor(a,enemy,changed),id==='pilot_boss_11'?expected:1);
  a=commit(a,enemy,first).attacker;
  assert.equal(commanderAttackFactor(a,enemy,first),id==='pilot_leg_3'?expected:id==='pilot_boss_2'?expected:1);
  const noHit=commit(a,enemy,changed,{damage:0,motherDamage:0});
  assert.deepEqual(noHit.attacker,a);
 }
});
test('41: le speciali bonus richiedono carta realmente consumata sul colpo',()=>{
 const e=side();
 assert.equal(commanderAttackFactor(side('pilot_boss_5',{level:5}),e,context('plus',{strikeEffects:['shot-ion']})),1.07);
 assert.equal(commanderAttackFactor(side('pilot_boss_5',{level:5}),e,context()),1);
 assert.equal(commanderAttackFactor(side('pilot_epic_1',{level:5}),e,context('plus',{strikeEffects:['shot-piercing']})),1.08);
 assert.equal(commanderAttackFactor(side('pilot_epic_1',{level:5}),e,context()),1);
 assert.equal(commanderAttackFactor(side('pilot_epic_2',{level:5}),e,context('plus',{strikeEffects:['shot-ion','shot-corrosion']})),1.08);
 assert.equal(commanderAttackFactor(side('pilot_epic_2',{level:5}),e,context('plus',{strikeEffects:['shot-ion']})),1);
});
test('41: status temporanei e scudi danno protezione solo se attivi',()=>{
 const enemy=side();
 assert.equal(commanderAttackFactor(side('pilot_boss_3',{level:5}),side('pilot_com_1',{statuses:{corrodedUntil:3000}}),context()),1.07);
 assert.equal(commanderAttackFactor(side('pilot_boss_3',{level:5}),side('pilot_com_1',{statuses:{corrodedUntil:900}}),context()),1);
 assert.equal(commanderDefenseFactor(side('pilot_boss_7',{level:5,statuses:{ionizedUntil:3000}}),enemy,context()),.93);
 assert.equal(commanderDefenseFactor(side('pilot_boss_7',{level:5,statuses:{ionizedUntil:900}}),enemy,context()),1);
 assert.equal(commanderDefenseFactor(side('pilot_epic_4',{shield:0,level:5}),enemy,context()),.92);
 assert.equal(commanderDefenseFactor(side('pilot_epic_4',{shield:1,level:5}),enemy,context()),1);
});
test('41: danni ai vitali, equipaggiamento e condizioni difensive sono circoscritti',()=>{
 const e=side();
 assert.equal(commanderAttackFactor(side('pilot_boss_4',{level:5}),e,context('plus',{vitalId:'engine',cards:triple})),1.07);
 assert.equal(commanderAttackFactor(side('pilot_boss_4',{level:5}),e,context('plus',{cards:triple})),1);
 assert.equal(commanderAttackFactor(side('pilot_rare_3',{level:5}),e,context('plus',{cards:triple})),1.07);
 assert.equal(commanderAttackFactor(side('pilot_rare_3',{level:5}),e,context()),1);
 assert.equal(commanderAttackFactor(side('pilot_leg_4',{level:5}),e,context('times',{cards:triple})),1.08);
 assert.equal(commanderAttackFactor(side('pilot_leg_4',{level:5}),e,context('plus',{cards:triple})),1);
 assert.equal(commanderAttackFactor(side('pilot_leg_5',{level:5}),e,context('plus',{cards})),1.08);
 assert.equal(commanderAttackFactor(side('pilot_leg_6',{level:5}),e,context('plus',{cards:mixed})),1);
 const black=[{id:'b1',suit:'♠',value:9},{id:'b2',suit:'♣',value:2}];
 assert.equal(commanderAttackFactor(side('pilot_leg_6',{level:5}),e,context('plus',{cards:black})),1.08);
 assert.equal(commanderDefenseFactor(side('pilot_boss_10',{level:5,
   escorts:[{defense:{destroyed:true}}]}),e,context()),.93);
 assert.equal(commanderDefenseFactor(side('pilot_boss_10',{level:5}),e,context()),1);
 assert.equal(commanderDefenseFactor(side('pilot_boss_12',{level:5,
   parts:{engine:0,weapons:0,command:0}}),e,context()),.93);
 assert.equal(commanderDefenseFactor(side('pilot_boss_12',{level:5}),e,context()),1);
});
test('41: la nuova abilità sui ricicli si esaurisce al primo impatto efficace',()=>{
 let a=side('pilot_boss_6',{level:5}),e=side();
 const ctx=context('plus',{reshufflesAtLaunch:1});
 assert.equal(commanderAttackFactor(a,e,ctx),1.07);
 a=commit(a,e,ctx,{damage:0,motherDamage:0}).attacker;
 assert.equal(commanderAttackFactor(a,e,ctx),1.07);
 a=commit(a,e,ctx).attacker;
 assert.equal(a.commander.seenRecycle,1);
 assert.equal(commanderAttackFactor(a,e,ctx),1);
});
test('41: effetti di fine battaglia e terzo impatto senza generare risorse',()=>{
 const enemy=side('pilot_com_1',{parts:{engine:0,weapons:0,command:0}});
 assert.equal(commanderAttackFactor(side('pilot_boss_20',{level:5}),enemy,context()),1.12);
 assert.equal(commanderAttackFactor(side('pilot_boss_20',{level:5}),side(),context()),1);
 let a=side('pilot_boss_19',{level:5});
 assert.equal(commanderAttackFactor(a,enemy,context()),1);
 a=commit(a,enemy,context()).attacker;
 a=commit(a,enemy,context()).attacker;
 assert.equal(commanderAttackFactor(a,enemy,context()),1.12);
 a=commit(a,enemy,context()).attacker;
 assert.equal(commanderAttackFactor(a,enemy,context()),1);
 assert.equal(a.hand,undefined);
 assert.equal(a.specialHand,undefined);
});
