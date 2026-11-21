import test from 'node:test';
import assert from 'node:assert/strict';
import {MULTI_WEAPON_CARDS,card,cardRole} from './fleetNext/rules.js';
import {describeEffect,validateEffectSpec} from './fleetNext/simpleEffects.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {NEXT_COMMON_AVAILABLE} from './fleetNext/nextDeckLoadout.js';
const [CANNON,TWINS,TURRET,OBICE,BRINA]=MULTI_WEAPON_CARDS;
function game(two=false){
 const roster=two?SUPPORT_CATALOG.slice(0,2).map((s,i)=>({supportId:s.id,instanceId:'multi-'+i,slot:i,rarita:'Leggendaria'})):[];
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:roster,mode:'pvp',ruleset:HP_SYNC_RULESET,
  deckA:[],deckB:[],seed:12912,nowMs:0});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
 }
 b.sides.B.ships[0].hp=5000;b.sides.B.ships[0].maxHp=5000;
 return b;
}
function turn(b,who,ids=[]){
 b.sides[who].hand=[...ids];
 const r=resolveFleetNextTurn(b,who,{cards:ids.map((_,i)=>i),pass:true},b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);return r;
}
const multi=r=>r.events.filter(x=>x.kind==='weapon-multi-shot');
test('Le cinque schede sono registrate e valide, senza nuove rarità o shop',()=>{
 assert.equal(MULTI_WEAPON_CARDS.length,5);
 for(const c of MULTI_WEAPON_CARDS){
  assert.equal(card(c.id),c);assert.equal(cardRole(c.id),'support');
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(describeEffect(c),c.effectProposed);
  assert.ok(NEXT_COMMON_AVAILABLE.includes(c));assert.equal(c.acquisitionPending,false);
 }
});
test('Cannone Acqua: un colpo indipendente da 26 HP nominali',()=>{
 const r=turn(game(),'A',[CANNON.id]);
 const e=r.events.find(x=>x.kind==='weapon-base-shot'&&x.cardId===CANNON.id);
 assert.ok(e);assert.equal(e.nominalDamage,26);assert.ok(e.actualDamage>0);
});
test('Batteria gemellata: esattamente due colpi da 16 HP ciascuno',()=>{
 const r=turn(game(),'A',[TWINS.id]),e=multi(r)[0];
 assert.equal(e.hitCount,2);assert.deepEqual(e.impacts.map(x=>x.nominalDamage),[16,16]);
 assert.ok(e.actualDamage>0);assert.equal(r.battle.sides.B.ships[0].hp<5000,true);
});
test('Torretta a Pistoni: 16 HP in due turni, senza terzo sparo',()=>{
 let b=game(),r=turn(b,'A',[TURRET.id]);
 assert.equal(multi(r)[0].impacts[0].nominalDamage,16);
 b=turn(r.battle,'B').battle;
 r=turn(b,'A');
 assert.equal(multi(r)[0].repeatTurn,true);
 assert.equal(multi(r)[0].impacts[0].nominalDamage,16);
 b=turn(r.battle,'B').battle;
 assert.equal(b.sides.A.machines.some(m=>m.sourceCardId===TURRET.id),false);
 assert.equal(multi(turn(b,'A')).length,0);
});
test('Obice polare: tre navicelle nemiche ricevono tre colpi da 12 HP',()=>{
 const b=game(true),old=b.sides.B.ships[0].hp;
 assert.equal(b.sides.B.escorts.filter(e=>e.hp>0).length,2);
 const r=turn(b,'A',[OBICE.id]),e=multi(r)[0];
 assert.equal(e.hitCount,3);
 assert.deepEqual(e.impacts.map(i=>i.nominalDamage),[12,12,12]);
 assert.ok(r.battle.sides.B.ships[0].hp<old);
});
test('Batteria Brina: 0/1/2 Energie Ghiaccio creano 1/2/3 colpi, senza consumarle',()=>{
 for(const ids of [[],['energy-cryogenic'],['energy-cryogenic','energy-cryogenic-r']]){
  const b=game();b.sides.A.energyPile=[...ids];
  const r=turn(b,'A',[BRINA.id]),e=multi(r)[0];
  assert.equal(e.hitCount,1+ids.length);
  assert.deepEqual(e.impacts.map(i=>i.nominalDamage),[20,...ids.map(()=>10)]);
  assert.deepEqual(r.battle.sides.A.energyPile,ids);
  assert.equal(e.energyCardsConsumed,0);
 }
});
