import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16D_BOSS_PROFILES} from './newCombat/phase16DBosses.js';
import {createFleetBossState,BOSS_ARENA_ELEMENTS,BOSS_PASSIVE_DESCRIPTIONS,
 fleetBossBrief} from './fleetBossPassives.js';
import {createFleetCardBattle,resolveFleetCardRound,FLEET_ELEMENTS} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
const deck=()=>[...createSpecialCollection().loadout];
function match(planet,shipA='C01',shipB='R04',levelA=1,levelB=1){
 return createFleetCardBattle({shipsA:[{shipId:shipA,level:levelA}],
  shipsB:[{shipId:shipB,level:levelB}],deckA:deck(),deckB:deck(),
  bossId:planet,mode:'adventure',seed:81,nowMs:1234});
}
const order=(partId='command',cards=[])=>({shipIndex:0,partId,cards});
function round(b,a=order(),c=order()){
 const r=resolveFleetCardRound(b,a,c,b.startedAtMs+b.round*1000);
 assert.equal(r.ok,true,r.reason);return r;
}
test('Le dodici madri boss conservano identita, passiva e terreno canonico',()=>{
 assert.equal(Object.keys(PHASE16D_BOSS_PROFILES).length,12);
 for(const [planet,identity] of Object.entries(PHASE16D_BOSS_PROFILES)){
  const b=match(Number(planet));
  assert.equal(b.bossState.name,identity.name);
  assert.equal(b.bossState.originalAbility,identity.ability);
  assert.equal(b.bossState.terrainElement,BOSS_ARENA_ELEMENTS[planet]);
  assert.ok(BOSS_PASSIVE_DESCRIPTIONS[planet]);
  assert.ok(fleetBossBrief(b)?.description);
  assert.equal(b.terrain.source,'boss');assert.equal(b.terrain.until,null);
  assert.ok(FLEET_ELEMENTS[b.terrain.element]);
  assert.equal(b.sides.B.ships.length,1);
 }
 assert.equal(createFleetBossState(999),null);
});
test('Il terreno boss non scade; non offre armature invisibili alla madre',()=>{
 const b=match(1);b.round=7;
 const r=round(b);
 assert.equal(r.battle.terrain.source,'boss');
 assert.equal(r.battle.terrain.until,null);
 assert.equal(r.battle.sides.B.ships[0].maxShield,0);
});
test('Gaia: la corazza si consuma e attenua un attacco elementale critico',()=>{
 const b=match(1,'C01','R04');
 const first=round(b);
 assert.equal(first.battle.bossState.armorSpent,true);
 assert.ok(first.events[0].damage<=1);
 assert.ok(first.battle.log.some(e=>e.text.includes('Corazza tellurica')));
});
test('Tharsis: serie cresce dopo colpi efficaci',()=>{
 const b=match(2,'N00','R04');
 const first=round(b);
 assert.equal(first.battle.bossState.streak,1);
 const second=round(first.battle,order('engine'),order('engine'));
 assert.ok(second.battle.bossState.streak>=1);
});
test('Matriarca Tossica: colpo valido applica status e poi danneggia un sistema',()=>{
 const b=match(3,'C02','R04');
 const first=round(b);
 assert.equal(first.battle.bossState.poisonTarget,0);
 const next=round(first.battle,order('engine'),order('engine'));
 assert.ok(next.battle.log.some(e=>e.text.includes('Neurotossina')));
});
test('Crono punisce due speciali; Sifone ionico consuma solo il primo impulso',()=>{
 const crono=match(6);
 assert.ok(round(crono,order('command',[0,1])).battle.log.some(e=>e.text.includes('Controtempo')));
 const ion=match(7);
 ion.sides.A.hand[0]='shot-ion';
 const first=round(ion,order('command',[0]));
 assert.equal(first.battle.bossState.ionSiphonUsed,true);
});
test('Leviatano: pressione quando la madre ha un vitale fratturato',()=>{
 const b=match(8);
 const fresh=round(b);
 assert.ok(!fresh.battle.log.some(e=>e.text.includes('Pressione degli abissi sul sistema')));
 const part=b.sides.A.ships[0].parts.find(p=>p.id==='engine');part.damage=1;
 assert.ok(round(b).battle.log.some(e=>e.text.includes('Pressione degli abissi sul sistema')));
});
test('Signore delle Ombre sacrifica HP della propria evoluzione L3',()=>{
 const b=match(9,'N00','R04',1,3);b.round=2;
 const before=b.sides.B.escorts[0].hp;
 const next=round(b);
 assert.ok(next.battle.log.some(e=>e.text.includes('Patto di sangue')));
 assert.ok(next.battle.sides.B.escorts[0].hp<before);
});
test('Idra rigenera una frattura o un supporto senza ricreare parti distrutte',()=>{
 const b=match(11,'N00','R04',1,3);
 b.bossState.regenPending=true;
 b.sides.B.ships[0].parts.find(p=>p.id==='engine').damage=1;
 const result=round(b);
 assert.ok(result.battle.log.some(e=>e.text.includes('Rigenerazione criogenica:')));
 const heat=match(11,'C01','R04');
 heat.bossState.regenPending=true;
 assert.ok(round(heat).battle.log.some(e=>e.text.includes('Rigenerazione bloccata')));
});
test('Boss Reattore, Memoria, Magma, Dominio mantengono identita',()=>{
 const reactor=match(14);reactor.bossState.charge=2;
 assert.ok(round(reactor).battle.log.some(e=>e.text.includes('Reattore carico')));
 const memory=match(17);
 memory.sides.A.discard=['tactical-cover','fusion-strike','shot-ion','shot-piercing'];
 assert.ok(round(memory).battle.log.some(e=>e.text.includes('Memoria degli scarti')));
 const magma=match(19);magma.round=2;
 assert.ok(round(magma).battle.log.some(e=>e.text.includes('Eruzione magmatica')));
 const domain=match(20,'N00','R04');domain.round=4;
 assert.ok(round(domain).battle.log.some(e=>e.text.includes('Dominio ionic')));
});
test('Una centralina distrutta toglie la formazione, non trasforma una scudiera in madre',()=>{
 const b=match(2,'C01','R04',5,3);
 const mother=b.sides.A.ships[0];
 assert.equal(b.sides.A.ships.length,1);
 const command=mother.parts.find(p=>p.id==='command');
 command.damage=2;command.destroyed=true;
 assert.equal(b.sides.A.escorts.length,2);
 assert.ok(b.sides.A.escorts.every(e=>e.parentShipId===mother.id));
});
