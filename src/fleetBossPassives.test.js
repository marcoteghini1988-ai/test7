import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16D_BOSS_PROFILES} from './newCombat/phase16DBosses.js';
import {createFleetBossState,BOSS_ARENA_ELEMENTS,BOSS_PASSIVE_DESCRIPTIONS,fleetBossBrief} from './fleetBossPassives.js';
import {createFleetCardBattle,resolveFleetCardRound,FLEET_ELEMENTS} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';

const deck=()=>[...createSpecialCollection().loadout];
function match(planet,shipA='C01',shipB='R04'){
 return createFleetCardBattle({shipsA:[{shipId:shipA,level:1}],
  shipsB:[{shipId:shipB,level:1}],deckA:deck(),deckB:deck(),
  bossId:planet,mode:'adventure',seed:81,nowMs:1234});
}
const target=(partId='command',cards=[])=>({shipIndex:0,partId,cards});
function round(b,orderA=target(),orderB=target()){
 const result=resolveFleetCardRound(b,orderA,orderB,b.startedAtMs+b.round*1000);
 assert.equal(result.ok,true,result.reason);
 return result;
}
function putCardInHand(side,type){
 const index=side.hand.indexOf(type);
 if(index>=0){[side.hand[0],side.hand[index]]=[side.hand[index],side.hand[0]];return;}
 const i=side.deck.indexOf(type);
 assert.ok(i>=0,'La carta '+type+' deve essere nel mazzo autentico');
 [side.hand[0],side.deck[i]]=[side.deck[i],side.hand[0]];
}
test('Tutti i dodici boss mantengono identita e ricevono una passiva e un terreno distinti',()=>{
 assert.equal(Object.keys(PHASE16D_BOSS_PROFILES).length,12);
 for(const [planet,identity] of Object.entries(PHASE16D_BOSS_PROFILES)){
  const b=match(Number(planet));
  assert.equal(b.bossState.name,identity.name);
  assert.equal(b.bossState.originalAbility,identity.ability);
  assert.equal(b.bossState.terrainElement,BOSS_ARENA_ELEMENTS[planet]);
  assert.ok(BOSS_PASSIVE_DESCRIPTIONS[planet]);
  assert.ok(fleetBossBrief(b)?.description);
  assert.equal(b.terrain.source,'boss');
  assert.equal(b.terrain.until,null);
  assert.equal(b.bossLockedTerrain,true);
  assert.ok(FLEET_ELEMENTS[b.terrain.element]);
 }
 assert.equal(createFleetBossState(999),null);
});
test('Un terreno del boss non scade anche quando il round aumenta',()=>{
 const b=match(1);
 b.round=7;
 const next=round(b).battle;
 assert.equal(next.terrain.source,'boss');
 assert.equal(next.terrain.element,'mineral');
 assert.equal(next.terrain.until,null);
 assert.equal(next.round,8);
});
test('Gaia: Corazza tellurica si consuma solo una volta',()=>{
 const b=match(1,'C01','R04');
 const first=round(b);
 assert.equal(first.battle.bossState.armorSpent,true);
 assert.equal(first.battle.sides.B.ships[0].shield,1,
  'Il primo attacco Plasma avrebbe portato 2 danni allo scudo');
 const second=round(first.battle);
 assert.equal(second.battle.sides.B.ships[0].shield,0);
});
test('Tharsis: la pressione cresce solo dopo un colpo efficace',()=>{
 const b=match(2,'N00','R04');
 const first=round(b);
 assert.equal(first.battle.bossState.streak,1);
 const second=round(first.battle);
 assert.equal(second.battle.bossState.streak,2);
 assert.ok(second.events[1].strength>=first.events[1].strength);
});
test('Matriarca Tossica: la neurotossina consuma uno scudo al round successivo',()=>{
 const b=match(3,'C02','R04');
 const first=round(b);
 assert.equal(first.battle.bossState.poisonTarget,0);
 const before=first.battle.sides.A.ships[0].shield;
 const second=round(first.battle);
 assert.ok(second.battle.log.some(x=>x.text.includes('Neurotossina: -1 scudo')));
 assert.ok(second.battle.sides.A.ships[0].shield<before);
});
test('Crono: punisce due speciali avversarie nello stesso round',()=>{
 const b=match(6);
 const result=round(b,target('command',[0,1]));
 assert.ok(result.battle.log.some(x=>x.text.includes('Controtempo')));
});
test('Sentinella Ionica: sifone una sola volta su una vera carta Ionica',()=>{
 const b=match(7);
 putCardInHand(b.sides.A,'shot-ion');
 const first=round(b,target('command',[0]));
 assert.equal(first.battle.bossState.ionSiphonUsed,true);
 assert.ok(first.battle.log.some(x=>x.text.includes('Sifone quantico')));
});
test('Leviatano: pressione degli abissi solo quando il bersaglio ha pochi scudi',()=>{
 const b=match(8);
 const n=round(b);
 assert.ok(!n.battle.log.some(x=>x.text.includes('Pressione degli abissi sul bersaglio')));
 b.sides.A.ships[0].shield=1;
 const exposed=round(b);
 assert.ok(exposed.battle.log.some(x=>x.text.includes('Pressione degli abissi sul bersaglio')));
});
test('Signore delle Ombre: sacrifica un proprio scudo, non crea salute',()=>{
 const b=match(9,'N00','R04');b.round=2;
 const result=round(b);
 assert.ok(result.battle.log.some(x=>x.text.includes('Patto di sangue')));
 assert.ok(result.battle.sides.B.ships[0].shield<=1);
});
test('Idra Criogenica: una rigenerazione in sospeso si attiva solo senza Plasma',()=>{
 const b=match(11,'N00','R04');
 b.bossState.regenPending=true;b.sides.B.ships[0].shield=1;
 const result=round(b);
 assert.ok(result.battle.log.some(x=>x.text.includes('Rigenerazione criogenica: +1')));
 assert.equal(result.battle.bossState.regenPending,false);
 const heat=match(11,'C01','R04');
 heat.bossState.regenPending=true;
 const second=round(heat);
 assert.ok(second.battle.log.some(x=>x.text.includes('Rigenerazione bloccata')));
});
test('Generatore del Caos: reattore rilascia una scarica dopo tre cariche',()=>{
 const b=match(14,'N00','R04');
 b.bossState.charge=2;
 const result=round(b);
 assert.ok(result.battle.log.some(x=>x.text.includes('Reattore carico')));
 assert.equal(result.battle.bossState.charge,0);
});
test('Cristallo di Risonanza: memoria usa gli scarti realmente presenti',()=>{
 const b=match(17,'N00','R04');
 b.sides.A.discard=['tactical-cover','fusion-strike','shot-ion','shot-piercing'];
 const result=round(b);
 assert.ok(result.battle.log.some(x=>x.text.includes('Memoria degli scarti')));
});
test('Nucleo Magmatico: alterna carica, eruzione e raffreddamento',()=>{
 const b=match(19,'N00','R04');
 const first=round(b);assert.equal(first.battle.bossState.cycle,'carica');
 const second=round(first.battle);assert.equal(second.battle.bossState.cycle,'eruzione');
 assert.ok(second.battle.log.some(x=>x.text.includes('Eruzione magmatica')));
 const third=round(second.battle,target(),target('generator'));
 assert.equal(third.battle.bossState.cycle,'raffreddamento');
});
test('Sovrano del Vuoto: il dominante cambia e la nave corretta puo neutralizzarlo',()=>{
 const b=match(20,'N00','R04');
 const first=round(b);
 assert.ok(first.battle.log.some(x=>x.text.includes('Dominio mineral')));
 const next=match(20,'N00','R04');next.round=4;
 const fourth=round(next);
 assert.equal(fourth.battle.bossState.dominantElement,'ionic');
 assert.ok(fourth.battle.log.some(x=>x.text.includes('neutralizzato')));
});
test('Centralina della nave madre distrutta: le due laterali non sincronizzano piu',()=>{
 const setup=(broken)=>{
  const b=createFleetCardBattle({shipsA:[{shipId:'C01',level:1},{shipId:'C04',level:1}],
   shipsB:[{shipId:'C01',level:1}],deckA:deck(),deckB:deck(),seed:91});
  if(broken){
   b.sides.A.ships[0].parts.find(p=>p.id==='command').damage=2;
   b.sides.A.ships[0].parts.find(p=>p.id==='command').destroyed=true;
  }
  return b;
 };
 const intact=round(setup(false)).events[0].strength;
 const broken=round(setup(true)).events[0].strength;
 assert.ok(intact>broken,'Distruggendo la centralina si perde il bonus di formazione');
});
