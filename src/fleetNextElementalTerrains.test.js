import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTAL_TERRAIN_CARDS,ELEMENTAL_TERRAIN_BY_ID,card,cardRole,cardFacePath,cardCopyLimit}
 from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {canSelectNewGeneric,buildNextBaseDeck,buyNextCommonCard,evolveNextTerrainWithDuplicates} from './fleetNext/nextDeckLoadout.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {TERRAIN_CATALOG,activeTerrain} from './fleetNext/terrains.js';
import {applyElementalDamage} from './fleetNext/elementalDamage.js';

const water='ET-REFRIGERANT-ATT-C';
const shield='ET-REFRIGERANT-DEF-L';
const plasma='ET-PLASMA-DEF-R';
const build=()=>createFleetNextBattle({
 shipA:'C02',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
 mode:'pvp',ruleset:HP_SYNC_RULESET,seed:1988,deckA:[],deckB:[],
 supportRosterA:[],supportRosterB:[]
});
const pass=(b,who,cards=[])=>{
 b.sides[who].hand=[...cards];
 return resolveFleetNextTurn(b,who,{cards:cards.map((_,i)=>i),pass:true},1000+b.ply*30000);
};
test('Terreni: 10 elementi, 3 modelli e 4 rarità = 120 carte vere',()=>{
 assert.equal(ELEMENTAL_TERRAIN_CARDS.length,120);
 assert.equal(new Set(ELEMENTAL_TERRAIN_CARDS.map(c=>c.id)).size,120);
 assert.equal(new Set(ELEMENTAL_TERRAIN_CARDS.map(c=>c.elementId)).size,10);
 for(const c of ELEMENTAL_TERRAIN_CARDS){
  assert.equal(ELEMENTAL_TERRAIN_BY_ID[c.id],c);
  assert.equal(card(c.id),c);
  assert.equal(cardRole(c.id),'terrain');
  assert.equal(cardFacePath(c.id),null);
  assert.equal(canSelectNewGeneric(c.id),true,c.id);
  assert.ok(cardCopyLimit(c.id)>0);
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(describeEffect(c),c.description,c.id);
  assert.equal(TERRAIN_CATALOG[c.id].elementId,c.elementId);
  assert.equal(TERRAIN_CATALOG[c.id].durationTurns,null);
 }
});
test('Le quattro rarità cambiano soltanto la percentuale, mai la funzione',()=>{
 const values={Comune:[10,5],Rara:[12,6],Epica:[14,7],Leggendaria:[16,8]};
 for(const id of new Set(ELEMENTAL_TERRAIN_CARDS.map(c=>c.elementId)))
  for(const [kind,suffix] of [['offensivo','ATT'],['difensivo','DEF'],['equilibrato','EQ']]){
   const cards=ELEMENTAL_TERRAIN_CARDS.filter(c=>c.elementId===id&&c.variant===kind);
   assert.equal(cards.length,4);
   assert.equal(new Set(cards.map(c=>c.name)).size,1);
   for(const c of cards){
    const amount=kind==='equilibrato'?values[c.rarita][1]:values[c.rarita][0];
    assert.equal(c.attackPercent,kind==='difensivo'?0:amount);
    assert.equal(c.defensePercent,kind==='offensivo'?0:amount);
    assert.ok(c.id.includes('-'+suffix+'-'));
   }
  }
});
test('Non si comprano Terreni senza Shop, ma sono equipaggiabili se posseduti',()=>{
 const inv=createFleetInventory();
 assert.equal(buyNextCommonCard({...inv,credits:100000},water).ok,false);
 assert.equal(buildNextBaseDeck(inv,'C02',18,[water]).baseDeck.length,0);
 inv.owned[water]=1;
 const deck=buildNextBaseDeck(normalizeFleetInventory(inv),'C02',18,[water]);
 assert.deepEqual(deck.baseDeck,[water]);
 assert.equal(deck.discarded.length,0);
});
test('Il Terreno si gioca, è permanente, e non consuma attivazioni ogni turno',()=>{
 let b=build();
 const first=pass(b,'A',[water]);
 assert.equal(first.ok,true,first.reason);
 assert.equal(first.battle.terrain.id,water);
 assert.equal(first.battle.terrain.expiresPly,null);
 assert.ok(first.events.some(e=>e.kind==='terrain-activate'));
 b=first.battle;
 for(let i=0;i<12;i++){
  const r=pass(b,b.turn);assert.equal(r.ok,true,r.reason);b=r.battle;
  assert.equal(activeTerrain(b.terrain,b.ply).id,water);
 }
});
test('Un Terreno nuovo sostituisce il vecchio e resta unico',()=>{
 let b=pass(build(),'A',[water]).battle;
 const r=pass(b,'B',[plasma]);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.terrain.id,plasma);
 assert.equal(r.battle.terrain.expiresPly,null);
 assert.ok(r.battle.sides.A.discard.includes(water));
});
test('Una Trappola annulla il Terreno prima di attivarlo',()=>{
 const b=build();
 b.sides.B.defenses=[{id:'test-cancel',source:'cancel@0',hidden:true,untilPly:null,
  armedAtPly:-1,trigger:'terrain',action:'cancel'}];
 const r=pass(b,'A',[water]);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.terrain.id,null);
 assert.ok(r.events.some(e=>e.kind==='terrain-cancelled'));
 assert.ok(r.battle.sides.A.discard.includes(water));
});
test('Il terreno aumenta il danno di una percentuale costante e non elimina gli svantaggi',()=>{
 const normal=applyElementalDamage(null,'refrigerant','ionic',100);
 const boost=applyElementalDamage(null,'refrigerant','ionic',100,
  {terrainAttackPercent:10,terrainKey:water});
 assert.equal(normal.damage,50);
 assert.equal(boost.damage,55);
 const balanced={ships:[{defensePercent:8}],elementalDamageRemainders:{}};
 const disadvantaged=applyElementalDamage(balanced,'refrigerant','ionic',100);
 const better=applyElementalDamage(balanced,'refrigerant','ionic',100,
  {terrainAttackPercent:10,terrainKey:water});
 assert.equal(disadvantaged.damage,75);
 assert.equal(better.damage,82);
 assert.ok(better.damage<100);
});
test('Bonus solo sulla quota dell\u2019elemento attivo in un colpo misto con Armi',()=>{
 const result=applyElementalDamage(null,'plasma','ionic',100,
  {terrainAttackPercent:10,terrainAttackBase:20,terrainKey:'mixed'});
 assert.equal(result.damage,102);
 const full=applyElementalDamage(null,'plasma','ionic',100,
  {terrainAttackPercent:10,terrainKey:'mixed'});
 assert.equal(full.damage,110);
});
test('Difesa elemento attivo e colpi leggeri conservano la frazione',()=>{
 const target={ships:[{defensePercent:8}],elementalDamageRemainders:{}};
 assert.equal(applyElementalDamage(target,'plasma','ionic',100,
  {terrainDefensePercent:16,terrainKey:shield}).damage,84);
 const side={ships:[{defensePercent:8}],elementalDamageRemainders:{}};
 let damage=0;
 for(let i=0;i<10;i++)damage+=applyElementalDamage(side,'plasma','ionic',1,
  {terrainDefensePercent:10,terrainKey:'test-defense'}).damage;
 assert.equal(damage,9);
});
test('Bonus applicato in un combattimento HP reale fin dalla posa',()=>{
 const b=build(),part=b.sides.B.ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 b.sides.A.hand=[water];
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:false,targetKind:'part',
  targetId:part.id,partId:part.id},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.terrain.id,water);
 assert.ok(r.events.some(e=>e.kind==='terrain-elemental'||e.terrainAttackPercent===10),
  'L’attacco dello stesso turno deve già leggere il terreno');
});


test('Tre copie identiche evolvono il Terreno senza perdere la copia originale',()=>{
 const inventory={...createFleetInventory(),owned:{[water]:3},credits:3000};
 const result=evolveNextTerrainWithDuplicates(inventory,water);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.cost,null,'Costo in Crediti ancora da definire');
 assert.equal(result.inventory.owned[water],1);
 assert.equal(result.inventory.owned['ET-REFRIGERANT-ATT-R'],1);
 assert.equal(result.inventory.credits,3000,'I Crediti restano invariati');
 assert.equal(inventory.owned[water],3,'L’evoluzione non modifica l’inventario in ingresso');
 assert.equal(evolveNextTerrainWithDuplicates(
  {...inventory,owned:{[water]:2}},water).ok,false);
 assert.equal(evolveNextTerrainWithDuplicates(
  {...inventory,credits:0},water).ok,true,'L’evoluzione non richiede ancora un costo in Crediti');
 assert.equal(evolveNextTerrainWithDuplicates(
  {...inventory,owned:{[water]:2,'ET-REFRIGERANT-DEF-C':1}},water).ok,false,
  'Non contano doppioni di un Terreno differente');
 assert.equal(evolveNextTerrainWithDuplicates(
  {...inventory,owned:{[water]:3}},'ET-REFRIGERANT-ATT-L').ok,false);
});
