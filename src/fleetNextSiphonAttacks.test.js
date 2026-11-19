// Regressione: due Carte Attacco a sacrificio, non Armi temporanee.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SIPHON_ATTACKS,SIPHON_ATTACK_IDS,card,cardRole,cardFacePath,cardCopyLimit,
 EXCLUSIVE_DESIGNS_120} from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {siphonSacrificePlan,siphonTargetPlan} from './fleetNext/siphonAttacks.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetInventory} from './fleetNext/collection.js';
import {canSelectNewGeneric,buildNextBaseDeck,buyNextCommonCard,
 NEXT_COMMON_AVAILABLE} from './fleetNext/nextDeckLoadout.js';

const E=SIPHON_ATTACK_IDS.epic,L=SIPHON_ATTACK_IDS.legendary;
const roster=n=>SUPPORT_CATALOG.slice(0,n).map((definition,slot)=>({
 supportId:definition.id,instanceId:'siphon-test-'+slot,slot,rarita:'Leggendaria'
}));
function battle(a=2,z=2){
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:roster(a),supportRosterB:roster(z),
  ruleset:HP_SYNC_RULESET,mode:'pvp',deckA:[],deckB:[],seed:4911,nowMs:0});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(12).fill('gen-216');side.discard=[];
  for(const escort of side.escorts){
   escort.hp=150;escort.maxHp=Math.max(150,escort.maxHp);
   escort.supportObservedHp=escort.hp;
  }
 }
 return b;
}
function play(b,ids=[E]){
 b.sides[b.turn].hand=[...ids];
 return resolveFleetNextTurn(b,b.turn,{cards:ids.map((_,i)=>i),pass:true},b.turnStartedAtMs);
}
const strike=r=>r.events.find(e=>e.kind==='siphon-strike');

test('Entrambe sono Attacchi generici registrati, non Armi e non esclusive',()=>{
 assert.equal(SIPHON_ATTACKS.length,2);
 assert.equal(EXCLUSIVE_DESIGNS_120.length,120);
 const inventory=createFleetInventory();
 for(const c of SIPHON_ATTACKS){
  assert.equal(card(c.id),c);
  assert.equal(cardRole(c.id),'attack');
  assert.equal(cardFacePath(c.id),null);
  assert.equal(validateEffectSpec(c.effectSpec),null);
  assert.equal(describeEffect(c),c.effectProposed);
  assert.equal(c.playable,true);
  assert.equal(c.acquisitionPending,true);
  assert.ok(cardCopyLimit(c.id)>0);
  assert.equal(canSelectNewGeneric(c.id),true);
  assert.ok(NEXT_COMMON_AVAILABLE.some(def=>def.id===c.id));
  assert.equal(inventory.owned[c.id]||0,0);
  assert.equal(buyNextCommonCard(inventory,c.id).ok,false);
 }
 inventory.owned[E]=1;inventory.owned[L]=1;
 assert.deepEqual(buildNextBaseDeck(inventory,'C01',20,[E,L]).baseDeck,[E,L]);
 assert.equal(card(E).rarita,'Epica');assert.equal(card(L).rarita,'Leggendaria');
});
test('Piani di sacrificio: 20% degli HP attuali e arrotondamento sempre per eccesso',()=>{
 const side={escorts:[{id:'a',slot:0,hp:150},{id:'b',slot:1,hp:50}]};
 assert.deepEqual(siphonSacrificePlan(side).sacrifices.map(x=>x.cost),[30,10]);
 assert.equal(siphonSacrificePlan({escorts:[{id:'a',slot:0,hp:7}]}).total,2);
 assert.equal(siphonSacrificePlan({escorts:[{id:'a',slot:0,hp:2}]}).total,1);
 assert.equal(siphonSacrificePlan({escorts:[{id:'a',slot:0,hp:1}]}).ok,false);
 assert.equal(siphonSacrificePlan({escorts:[]}).ok,false);
});
test('Danno nominale: Epica ripartita, Leggendaria per ogni bersaglio',()=>{
 const enemy=battle(0,2).sides.B;
 assert.deepEqual(siphonTargetPlan(enemy,60,'split').map(x=>x.nominalDamage),[20,20,20]);
 assert.deepEqual(siphonTargetPlan(enemy,60,'each').map(x=>x.nominalDamage),[60,60,60]);
 assert.deepEqual(siphonTargetPlan(enemy,40,'split').map(x=>x.nominalDamage),[14,13,13]);
 assert.deepEqual(siphonTargetPlan(battle(0,1).sides.B,60,'split')
  .map(x=>x.nominalDamage),[30,30]);
 assert.deepEqual(siphonTargetPlan(battle(0,0).sides.B,60,'split')
  .map(x=>x.nominalDamage),[60]);
});
test('Epica: 30+30 HP sacrificati, 20/20/20 su due supporti e madre',()=>{
 const b=battle(2,2),before=b.sides.B.ships[0].hp;
 const r=play(b);assert.equal(r.ok,true,r.reason);
 const e=strike(r);assert.ok(e);
 assert.equal(e.cardId,E);assert.equal(e.totalSacrificed,60);
 assert.equal(e.nominalDamage,60);
 assert.deepEqual(e.targets.map(x=>x.nominalDamage),[20,20,20]);
 assert.deepEqual(r.battle.sides.A.escorts.map(x=>x.hp),[120,120]);
 assert.equal(r.battle.sides.A.machines.length,0);
 assert.ok(r.battle.sides.A.attackSlots.includes(E));
 assert.ok(r.battle.sides.A.discard.includes(E)||r.battle.sides.A.deck.includes(E)||
  r.battle.sides.A.hand.includes(E));
 assert.ok(r.battle.sides.B.ships[0].hp<before);
});
test('Leggendaria: 30+30 HP sacrificati, 60/60/60 su tutti',()=>{
 const b=battle(2,2);
 const r=play(b,[L]);assert.equal(r.ok,true,r.reason);
 const e=strike(r);assert.ok(e);assert.equal(e.totalSacrificed,60);
 assert.deepEqual(e.targets.map(x=>x.nominalDamage),[60,60,60]);
 assert.equal(e.nominalDamage,180);
 assert.deepEqual(r.battle.sides.A.escorts.map(x=>x.hp),[120,120]);
 assert.equal(r.battle.sides.A.machines.length,0);
 assert.equal(r.battle.sides.B.escorts[0].hp,90);
 assert.equal(r.battle.sides.B.escorts[1].hp,90);
});
test('Un supporto: sacrifica solo da quello; la versione Epica colpisce tutti i bersagli presenti',()=>{
 const b=battle(1,2),r=play(b,[E]);assert.equal(r.ok,true,r.reason);
 assert.equal(strike(r).totalSacrificed,30);
 assert.deepEqual(strike(r).targets.map(x=>x.nominalDamage),[10,10,10]);
 assert.equal(r.battle.sides.A.escorts[0].hp,120);
});
test('Nessun supporto o un supporto a 1 HP: la giocata è invalida e non cambia il campo',()=>{
 const empty=battle(0,2),id=E;
 empty.sides.A.hand=[id];
 assert.match(validateFleetTurn(empty,'A',{cards:[0],pass:true}),/supporto/i);
 const failed=resolveFleetNextTurn(empty,'A',{cards:[0],pass:true},1000);
 assert.equal(failed.ok,false);
 assert.deepEqual(failed.battle.sides.A.hand,[id]);
 const low=battle(2,2);low.sides.A.escorts[1].hp=1;low.sides.A.hand=[L];
 assert.match(validateFleetTurn(low,'A',{cards:[0],pass:true}),/insufficienti/i);
});
test('Due copie nel turno: il sacrificio viene ricalcolato sugli HP correnti',()=>{
 const b=battle(1,2),r=play(b,[E,E]);
 assert.equal(r.ok,true,r.reason);
 const events=r.events.filter(x=>x.kind==='siphon-strike');
 assert.deepEqual(events.map(x=>x.totalSacrificed),[30,24]);
 assert.equal(r.battle.sides.A.escorts[0].hp,96);
 assert.equal(r.battle.sides.A.machines.length,0);
});
