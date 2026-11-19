// Ogni Carta Arma eredita la regola Terreno del proprio elemento.
// Terreni Difesa NON aggiungono danno; terreni Offensivi ed Equilibrati sì.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {ELEMENTAL_TERRAIN_CARDS} from './fleetNext/elementalTerrainCards.js';
import {terrainWeaponAttackBonus,applyElementalDamage} from './fleetNext/elementalDamage.js';
import {TEMP_SUPPORT_WEAPONS} from './fleetNext/temporarySupportWeapons.js';
import {DISCARD_WEAPON} from './fleetNext/discardWeapon.js';
import {TERRAIN_CATALOG} from './fleetNext/terrains.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import originalWeaponProposals from '../docs/CATALOGO_100_ARMI_PROPOSTA_2026-11-19.json' with {type:'json'};
import weaponReplacementProposals from '../docs/BOZZA_67_NUOVE_ARMI_OFFENSIVE_2026-11-19.json' with {type:'json'};
import weaponAttackAudit from '../docs/AUDIT_ARMI_VS_ATTACCHI_100_PROPOSTE_2026-11-19.json' with {type:'json'};

test('Terreni potenziano TUTTI gli elementi delle Armi, rarità e famiglie compatibili',()=>{
 assert.equal(Object.keys(FLEET_ELEMENTS).length,10);
 const tiers={Comune:10,Rara:12,Epica:14,Leggendaria:16};
 for(const elementId of Object.keys(FLEET_ELEMENTS)){
  const terrains=ELEMENTAL_TERRAIN_CARDS.filter(c=>c.elementId===elementId);
  assert.equal(terrains.length,12);
  for(const c of terrains){
   const bonus=terrainWeaponAttackBonus(c,elementId,100);
   const expected=c.variant==='equilibrato'?tiers[c.rarita]/2:
    c.variant==='offensivo'?tiers[c.rarita]:0;
   assert.equal(bonus.bonus,expected,c.id);
   assert.equal(bonus.percent,c.attackPercent,c.id);
   assert.equal(bonus.remainder,0,c.id);
   for(const other of Object.keys(FLEET_ELEMENTS).filter(id=>id!==elementId))
    assert.equal(terrainWeaponAttackBonus(c,other,100).bonus,0,c.id+' -> '+other);
  }
 }
});

test('Un proiettile Arma da 1 HP riceve correttamente il bonus anche su molte raffiche',()=>{
 const terrain=ELEMENTAL_TERRAIN_CARDS.find(c=>c.id==='ET-IONIC-ATT-C');
 let carry=0,total=0;
 for(let i=0;i<10;i++){
  const result=terrainWeaponAttackBonus(terrain,'ionic',1,carry);
  carry=result.remainder;
  total+=result.bonus;
 }
 assert.equal(total,1);
 assert.equal(carry,0);
 assert.equal(terrainWeaponAttackBonus(terrain,'plasma',100).bonus,0);
});

test('Le Armi già giocabili hanno elemento definito per il bonus del Terreno',()=>{
 const weapons=[DISCARD_WEAPON,...TEMP_SUPPORT_WEAPONS];
 assert.equal(weapons.length,4);
 for(const weapon of weapons){
  const element=weapon.elementId||weapon.effectSpec?.elementId;
  assert.ok(FLEET_ELEMENTS[element],weapon.id);
  assert.equal(weapon.effectSpec.elementId,element);
  const terrain=ELEMENTAL_TERRAIN_CARDS.find(c=>c.elementId===element&&
   c.variant==='offensivo'&&c.rarita==='Comune');
  assert.ok(terrain);
  assert.equal(terrainWeaponAttackBonus(terrain,element,100).bonus,10);
  assert.equal(TERRAIN_CATALOG[terrain.id].elementId,element);
 }
});

test('Colpo autonomo futuro: stesso bonus del Terreno e della relazione elementale',()=>{
 const g=ELEMENTAL_TERRAIN_CARDS.find(c=>c.id==='ET-CRYOGENIC-ATT-C');
 const baseline=applyElementalDamage(null,'cryogenic','metallic',100);
 const boosted=applyElementalDamage(null,'cryogenic','metallic',100,{
  terrainAttackPercent:g.attackPercent,terrainKey:g.id
 });
 assert.equal(baseline.damage,100);
 assert.equal(boosted.damage,110);
});

test('Nella battaglia vera un Terreno Fuoco offensivo aumenta lo sparo Arma Fuoco',()=>{
 function run(withTerrain){
  const b=createFleetNextBattle({shipA:'C01',shipB:'C01',
   raritaA:'Leggendaria',raritaB:'Leggendaria',
   supportRosterA:[],supportRosterB:[],mode:'pvp',
   ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:901,nowMs:0});
  for(const side of Object.values(b.sides)){
   side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
  }
  b.sides.B.ships[0].hp=1000;
  b.sides.B.ships[0].maxHp=1000;
  if(withTerrain)b.terrain={id:'ET-PLASMA-ATT-C',cardId:'ET-PLASMA-ATT-C',
   owner:'A',startedPly:0,expiresPly:null,source:'player'};
  b.sides.A.hand=['weapon-memory-plasma'];
  const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:false,
   targetKind:'part',targetId:'weapons',partId:'weapons'},b.turnStartedAtMs);
  assert.equal(r.ok,true,r.reason);
  assert.ok(r.events.find(e=>e.kind==='weapon-discard'),'Arma installata');
  return r;
 }
 const base=run(false),boost=run(true);
 const normal=base.events.filter(e=>e.kind==='impact').reduce((sum,e)=>sum+(e.damage||0),0);
 const increased=boost.events.filter(e=>e.kind==='impact').reduce((sum,e)=>sum+(e.damage||0),0);
 assert.ok(increased>=normal,'un terreno offensivo non può ridurre il danno');
 assert.ok(boost.events.some(e=>e.terrainAttackPercent===10),
  'la partita ha davvero applicato il bonus terreno in attacco');
});

test('100 progetti Arma hanno la stessa regola Terreno, 67 bozze Attacco ne restano fuori',()=>{
 const approvedDraftIds=new Set(weaponAttackAudit.items.filter(c=>c.proposedType==='Arma').map(c=>c.id));
 const first=originalWeaponProposals.items.filter(c=>approvedDraftIds.has(c.id));
 const second=weaponReplacementProposals.items;
 assert.equal(first.length,33);
 assert.equal(second.length,67);
 for(const entry of [...first,...second]){
  assert.ok(FLEET_ELEMENTS[entry.elementId],entry.name);
  assert.equal(entry.terrainWeaponBonusRule?.matchingElementOnly,true,entry.name);
  assert.equal(entry.terrainWeaponBonusRule?.offenseOnly,true,entry.name);
  const terrain=ELEMENTAL_TERRAIN_CARDS.find(c=>c.elementId===entry.elementId&&
   c.variant==='offensivo'&&c.rarita==='Comune');
  assert.equal(terrainWeaponAttackBonus(terrain,entry.elementId,100).bonus,10,entry.name);
 }
 const postponed=originalWeaponProposals.items.filter(c=>!approvedDraftIds.has(c.id));
 assert.equal(postponed.length,67);
 assert.ok(postponed.every(c=>!c.terrainWeaponBonusRule));
});
