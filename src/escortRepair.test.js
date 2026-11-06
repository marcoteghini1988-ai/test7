// Punto 39: an owned SPECIAL card repairs a selected escort, not the mother.
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {playSpecialCard,specialCardReadiness} from './specialCards.js';
import {SUPPORT_RULES} from './specialSupport.js';
const rng=()=>.5;
const types=['support-escort-repair','shot-piercing','shot-ion','fusion-barrier']
 .flatMap(type=>Array(6).fill(type));
const cardsOf=side=>[...side.specialHand,...side.specialDeck,...side.specialDiscard];
function battleSide(){
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  specialDeckTypes:types},rng);
 const all=cardsOf(b.player),card=all.find(x=>x.type==='support-escort-repair');
 assert.ok(card);
 const rest=all.filter(x=>x.id!==card.id);
 return {...b.player,specialHand:[card,...rest.slice(0,4)],
  specialDeck:rest.slice(4),specialDiscard:[]};
}
function damageEscort(side,slot,hp,{destroyed=false}={}){
 const escorts=side.escorts.map((e,i)=>i!==slot?e:{...e,defense:{...e.defense,
  destroyed,shield:{...e.defense.shield,hp}}});
 return {...side,escorts};
}
test('39: repair targets selected escort, costs one real card and preserves mother/numerics',()=>{
 const initial=battleSide();
 assert.equal(initial.escorts.length,2);
 const max=initial.escorts[1].defense.shield.max;
 const side=damageEscort(initial,1,max-30);
 const beforeIds=cardsOf(side).map(c=>c.id).sort();
 const numeric=side.hand.map(c=>c.id);
 const motherShield=side.fleet[0].defense.shield.hp;
 const firstEscort=side.escorts[0].defense.shield.hp;
 const r=playSpecialCard(side,0,{escortSlot:1},1000,rng);
 assert.equal(r.played,true);
 assert.equal(r.amount,SUPPORT_RULES.escortShieldRepair);
 assert.equal(r.side.escorts[1].defense.shield.hp,max-15);
 assert.equal(r.side.escorts[0].defense.shield.hp,firstEscort);
 assert.equal(r.side.fleet[0].defense.shield.hp,motherShield);
 assert.deepEqual(r.side.hand.map(c=>c.id),numeric);
 assert.equal(r.side.specialHand.length,5);
 assert.equal(r.side.specialUses,1);
 assert.deepEqual(cardsOf(r.side).map(c=>c.id).sort(),beforeIds);
});
test('39: partial repair is capped at original shield max, never creates extra HP',()=>{
 const before=battleSide(),max=before.escorts[0].defense.shield.max;
 const side=damageEscort(before,0,max-4);
 const r=playSpecialCard(side,0,{escortSlot:0},1000,rng);
 assert.equal(r.played,true);
 assert.equal(r.amount,4);
 assert.equal(r.side.escorts[0].defense.shield.hp,max);
 assert.equal(r.side.escorts[0].defense.shield.max,max);
});
test('39: zero escort shield can be restored, but destroyed escort cannot be revived',()=>{
 const b=battleSide();
 const zero=damageEscort(b,0,0);
 const valid=playSpecialCard(zero,0,{escortSlot:0},1000,rng);
 assert.equal(valid.played,true);
 assert.equal(valid.side.escorts[0].defense.shield.hp,
  Math.min(SUPPORT_RULES.escortShieldRepair,b.escorts[0].defense.shield.max));
 assert.equal(valid.side.escorts[0].defense.destroyed,false);
 const destroyed=damageEscort(b,0,0,{destroyed:true});
 const denied=playSpecialCard(destroyed,0,{escortSlot:0},1000,rng);
 assert.equal(denied.played,false);
 assert.equal(denied.reason,'escort_destroyed');
 assert.strictEqual(denied.side,destroyed);
});
test('39: full shield, bad slot and absent escort reject the card without consuming it',()=>{
 const original=battleSide();
 for(const [side,slot,reason] of [
  [original,0,'escort_shield_full'],
  [original,99,'escort_missing'],
  [{...original,escorts:[]},0,'escort_missing']]){
  const denied=playSpecialCard(side,0,{escortSlot:slot},1000,rng);
  assert.equal(denied.played,false);
  assert.equal(denied.reason,reason);
  assert.strictEqual(denied.side,side);
 }
});
test('39: lost command or a currently docked escort blocks support, not the deck',()=>{
 const initial=battleSide(),max=initial.escorts[0].defense.shield.max;
 const damaged=damageEscort(initial,0,max-20);
 const mother=damaged.fleet[0],defense=mother.defense;
 const offline={...damaged,fleet:[{...mother,defense:{...defense,parts:{...defense.parts,
  command:{...defense.parts.command,hp:0}}}}]};
 const noCommand=playSpecialCard(offline,0,{escortSlot:0},1000,rng);
 assert.equal(noCommand.played,false);
 assert.equal(noCommand.reason,'command_offline');
 const docked={...damaged,maneuvers:{...damaged.maneuvers,
  fusion:{escortSlot:0,endsAt:9000}}};
 assert.equal(specialCardReadiness(docked,0,0,1000).reason,'escort_docked');
 const refused=playSpecialCard(docked,0,{escortSlot:0},1000,rng);
 assert.equal(refused.played,false);
 assert.strictEqual(refused.side,docked);
 const afterDock=playSpecialCard(docked,0,{escortSlot:0},9000,rng);
 assert.equal(afterDock.played,true);
});

// Integration: the damage comes from the real combat impact resolver.
test('39: an actual attack on an escort shield can be repaired without changing either numeric hand',()=>{
 const initial=battleSide();
 const beforeEnemy=initial.escorts[1].defense.shield.hp;
 const attack=applyPendingHit(initial,0,'plus',11,{escortIndex:1,nowMs:1000,hitId:'escort-real-impact'});
 assert.equal(attack.reason,'shield');
 assert.equal(attack.damage,Math.min(11,beforeEnemy));
 assert.equal(attack.defender.escorts[1].defense.shield.hp,beforeEnemy-attack.damage);
 const hand=attack.defender.hand.map(c=>c.id);
 const specialIds=cardsOf(attack.defender).map(c=>c.id).sort();
 const healed=playSpecialCard(attack.defender,0,{escortSlot:1},1001,rng);
 assert.equal(healed.played,true);
 assert.equal(healed.amount,attack.damage);
 assert.equal(healed.side.escorts[1].defense.shield.hp,beforeEnemy);
 assert.deepEqual(healed.side.hand.map(c=>c.id),hand);
 assert.deepEqual(cardsOf(healed.side).map(c=>c.id).sort(),specialIds);
});
