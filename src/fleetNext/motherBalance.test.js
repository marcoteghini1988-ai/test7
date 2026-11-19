import test from 'node:test';
import assert from 'node:assert/strict';
import {MOTHER_BALANCE_LIMITS,LEGENDARY_MOTHER_PROFILES,
 motherBaselinePotential,limitedMotherDamage,scaledMotherStats} from './motherBalance.js';
import {motherCombatStatsForRarity,SHIP_RARITIES} from './shipRarity.js';
import {CAMPAIGN_SHIP_ORDER} from './progression.js';
import {supportHpAtLevel} from './supportProgression.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './combat.js';
import {HP_SYNC_RULESET} from './hpSynchronization.js';
import {SUPPORT_CATALOG} from './supportCatalog.js';

test('L Arca Astrale stabilisce 1.000 HP e tutte le 12 leggendarie hanno ruoli distinti entro i limiti',()=>{
 assert.equal(Object.keys(LEGENDARY_MOTHER_PROFILES).length,12);
 assert.equal(scaledMotherStats('L04',3).maxHp,1000);
 const profiles=CAMPAIGN_SHIP_ORDER.map(id=>LEGENDARY_MOTHER_PROFILES[id]);
 assert.equal(new Set(profiles.map(p=>p.maxHp)).size,12);
 for(const p of profiles){
  assert.ok(p.maxHp>=MOTHER_BALANCE_LIMITS.minLegendaryHp);
  assert.ok(p.maxHp<=MOTHER_BALANCE_LIMITS.maxLegendaryHp);
  assert.ok(p.attackPower>=MOTHER_BALANCE_LIMITS.minLegendaryAttack);
  assert.ok(p.attackPower<=MOTHER_BALANCE_LIMITS.maxLegendaryAttack);
  assert.ok(p.defensePercent>=0&&p.defensePercent<=MOTHER_BALANCE_LIMITS.maxDefensePercent);
 }
 const potential=profiles.map(motherBaselinePotential);
 assert.ok(Math.max(...potential)/Math.min(...potential)<=1.03);
});

test('Le quattro rarita scalano HP e attacco, senza livellare le specializzazioni',()=>{
 for(const id of CAMPAIGN_SHIP_ORDER){
  const range=SHIP_RARITIES.map(r=>motherCombatStatsForRarity(r,id));
  assert.ok(range.every((v,i)=>i===0||v.maxHp>range[i-1].maxHp));
  assert.ok(range.every((v,i)=>i===0||v.attackPower>range[i-1].attackPower));
  assert.ok(range.every(v=>v.defensePercent<=MOTHER_BALANCE_LIMITS.maxDefensePercent));
 }
 assert.ok(motherCombatStatsForRarity('Leggendaria','L03').defensePercent>
  motherCombatStatsForRarity('Leggendaria','C01').defensePercent);
});

test('Il danno su madre non supera il 40% a colpo e il 55% nello stesso turno',()=>{
 const mother={hp:1000,maxHp:1000,defensePercent:10};
 const first=limitedMotherDamage(mother,9999,10);
 assert.equal(first,360);
 mother.hp-=first;
 const second=limitedMotherDamage(mother,9999,10);
 mother.hp-=second;
 assert.ok(second<first);
 for(let i=0;i<10;i++){
  const more=limitedMotherDamage(mother,9999,10);
  mother.hp-=more;
 }
 assert.ok(mother.damageReceivedOnPly<=550);
 assert.ok(mother.hp>=450);
 const next=limitedMotherDamage(mother,120,12);
 assert.ok(next>0);
 const old={hp:42,maxHp:42};
 assert.equal(limitedMotherDamage(old,150,0),42,
  'nessuna regressione delle partite tecniche senza rarita');
});

test('In partita un normale attacco leggendario sottrae centinaia o decine di HP, non 1',()=>{
 const b=createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',supportRosterA:[],supportRosterB:[],
  mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:1901,nowMs:0});
 b.sides.A.hand=[];
 const old=b.sides.B.ships[0].hp;
 assert.equal(old,1000);
 const r=resolveFleetNextTurn(b,'A',{
  cards:[],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'
 },1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.shot.damage>=90&&r.shot.damage<=200,r.shot.damage);
 assert.equal(r.battle.sides.B.ships[0].hp,old-r.shot.damage);
 assert.ok(r.battle.sides.B.ships[0].hp>0,'nessun KO a vita piena');
});

test('I supporti reali crescono con la rarita e possono resistere a colpi leggendari',()=>{
 const hp=[1,2,3,4,5].map(level=>supportHpAtLevel(10,level));
 assert.ok(hp.every((n,i)=>i===0||n>hp[i-1]));
 assert.ok(hp[0]>=55&&hp[4]<=300);
 const roster=SUPPORT_CATALOG.slice(0,2).map((s,slot)=>({
  id:s.id,instanceId:'balance:'+slot,slot,rarita:'Leggendaria'
 }));
 const b=createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',supportRosterA:roster,supportRosterB:[],
  mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:1902,nowMs:0});
 for(const e of b.sides.A.escorts){
  assert.ok(e.maxHp>=160&&e.maxHp<=300,e.maxHp);
  assert.equal(e.hp,e.maxHp);
 }
});
