import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_BASE_WEAPONS,card,cardRole,cardCopyLimit,cardFacePath} from './fleetNext/rules.js';
import {describeEffect,validateEffectSpec} from './fleetNext/simpleEffects.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {NEXT_COMMON_AVAILABLE,canSelectNewGeneric,buildNextBaseDeck,buyNextCommonCard} from './fleetNext/nextDeckLoadout.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {projectMachineBerths} from './fleetNext/battlePresentation.js';
const [ONE,TWO,THREE]=APPROVED_BASE_WEAPONS;
const game=()=>{
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:20261120,nowMs:0});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
 }
 b.sides.B.ships[0].hp=5000;b.sides.B.ships[0].maxHp=5000;
 return b;
};
const turn=(b,who,cards=[],pass=false,extra={})=>{
 b.sides[who].hand=[...cards];
 const r=resolveFleetNextTurn(b,who,{cards:cards.map((_,i)=>i),pass,
  targetKind:'part',targetId:'weapons',partId:'weapons',...extra},1000+b.ply*30000);
 assert.equal(r.ok,true,r.reason);return r;
};
const fired=r=>r.events.filter(e=>e.kind==='weapon-base-shot');
test('22 Carte Arma base registrate in sei elementi, con scheda e copia valide',()=>{
 assert.equal(APPROVED_BASE_WEAPONS.length,22);
 assert.equal(new Set(APPROVED_BASE_WEAPONS.map(c=>c.id)).size,22);
 assert.deepEqual(Object.fromEntries([...new Set(APPROVED_BASE_WEAPONS.map(c=>c.elementId))]
  .map(id=>[id,APPROVED_BASE_WEAPONS.filter(c=>c.elementId===id).length])),
  {ionic:4,mineral:3,aerial:3,radiant:4,void:4,gravity:4});
 for(const def of APPROVED_BASE_WEAPONS){
  assert.equal(card(def.id),def);assert.equal(cardRole(def.id),'support');
  assert.equal(cardFacePath(def.id),null);assert.equal(def.playable,true);
  assert.equal(def.effectSpec.damageMode,'base-shot');
  assert.equal(def.effectSpec.durationTurns,1);
  assert.equal(validateEffectSpec(def.effectSpec),null,def.id);
  assert.equal(describeEffect(def),def.effectProposed);
  assert.ok(cardCopyLimit(def.id)>=1);
  assert.ok(canSelectNewGeneric(def.id));assert.ok(NEXT_COMMON_AVAILABLE.includes(def));
 }
});
test('Armi base acquistabili con prezzi provvisori, mai regalate automaticamente',()=>{
 const inv=createFleetInventory();
 for(const d of APPROVED_BASE_WEAPONS){
  assert.equal(inv.owned[d.id]||0,0);
  const result=buyNextCommonCard({...inv,credits:10000},d.id);
  assert.equal(result.ok,true,d.id);
  assert.equal(result.inventory.owned[d.id],1);
 }
 inv.owned[ONE.id]=1;
 assert.deepEqual(buildNextBaseDeck(normalizeFleetInventory(inv),'C01',20,[ONE.id]).baseDeck,[ONE.id]);
});
test('Tutte le 22 Armi sparano autonomamente una volta sottraendo HP',()=>{
 for(const d of APPROVED_BASE_WEAPONS){
  const r=turn(game(),'A',[d.id],true),e=fired(r);
  assert.equal(e.length,1,d.id);
  assert.equal(e[0].cardId,d.id);
  assert.equal(e[0].nominalDamage,d.effectSpec.baseDamage,d.id);
  assert.equal(e[0].appliedPower,d.effectSpec.baseDamage,d.id);
  assert.ok(e[0].actualDamage>0,d.id+' non infligge HP');
  assert.ok(r.battle.sides.B.ships[0].hp<5000,d.id);
  assert.ok(r.shot.damage>0,d.id);
  assert.equal(r.battle.sides.A.machines.length,1,d.id);
  assert.equal(r.battle.sides.A.machines[0].deployedPly,0,d.id);
  assert.equal(r.battle.sides.A.discard.includes(d.id),false,d.id);
 }
});
test('PASSA risolve le armi ma non spara automaticamente con la madre',()=>{
 const no=turn(game(),'A',[],true),yes=turn(game(),'A',[ONE.id],true);
 assert.equal(no.shot.damage,0);assert.ok(yes.shot.damage>0);
 assert.equal(fired(yes)[0].nominalDamage,ONE.effectSpec.baseDamage);
});
test('Due slot Arma e limite: la terza carta è respinta senza effetti collaterali',()=>{
 const r=turn(game(),'A',[ONE.id,TWO.id],true);
 assert.equal(fired(r).length,2);assert.equal(r.battle.sides.A.machines.length,2);
 const b=structuredClone(r.battle);b.turn='A';b.sides.A.hand=[THREE.id];
 const order={cards:[0],pass:true},before=JSON.stringify(b);
 assert.match(validateFleetTurn(b,'A',order),/alloggiamenti|macchine/i);
 assert.equal(resolveFleetNextTurn(b,'A',order,30000).ok,false);
 assert.equal(JSON.stringify(b),before);
});
test('Una sola attivazione, poi l Arma si scarta al turno proprio successivo',()=>{
 let b=turn(game(),'A',[ONE.id],true).battle;
 const enemy=turn(b,'B',[],true);b=enemy.battle;
 assert.equal(fired(enemy).length,0);
 assert.equal(b.sides.A.machines.some(m=>m.sourceCardId===ONE.id),false);
 assert.ok(b.sides.A.discard.includes(ONE.id));
 assert.equal(fired(turn(b,'A',[],true)).length,0);
});
test('Le Difese ordinarie intercettano i proiettili',()=>{
 const b=game();
 b.sides.B.protections=[{source:'test',id:'gen-217',kind:'protect',target:'part',
  partId:'weapons',remaining:1,untilPly:100,placedPly:-2}];
 const r=turn(b,'A',[ONE.id],true);
 assert.equal(fired(r)[0].actualDamage,0);assert.equal(r.battle.sides.B.ships[0].hp,5000);
});
test('Terreno dell elemento Arma modifica il colpo autonomo, non la madre',()=>{
 const plain=game(),terrain=game();
 terrain.terrain={id:'ET-IONIC-ATT-C',cardId:'ET-IONIC-ATT-C',owner:'A',
  startedPly:0,expiresPly:null,source:'player'};
 const a=fired(turn(plain,'A',[ONE.id],true))[0];
 const r=turn(terrain,'A',[ONE.id],true),b=fired(r)[0];
 assert.equal(a.nominalDamage,b.nominalDamage);
 assert.ok(b.actualDamage>=a.actualDamage);
 assert.ok(r.events.some(x=>x.terrainAttackPercent===10));
});
test('Arma fisica compare negli alloggiamenti e non negli slot Attacco',()=>{
 const b=turn(game(),'A',[ONE.id],true).battle;
 const berths=projectMachineBerths(b.sides.A,[],0);
 assert.equal(berths[0].sourceCardId,ONE.id);
 assert.equal(berths[0].nominalDamage,ONE.effectSpec.baseDamage);
 assert.equal(berths[1],null);
 assert.ok(!b.sides.A.attackSlots.includes(ONE.id));
});
