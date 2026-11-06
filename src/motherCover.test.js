import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {activateTacticalCover,advanceManeuvers,maneuverStatus,
 interceptManeuverVolley,startFusion,MANEUVER_RULES} from './fleetManeuvers.js';
import {initializeSpecialDeck,playSpecialCard,findCoverCardIndex,
 specialCardReadiness,findFusionCardIndex} from './specialCards.js';
const rnd=()=>0;
function side(){
 const battle=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rnd);
 return battle.player;
}
function coverCard(side,nowMs=1000){
 const index=findCoverCardIndex(side);
 assert.ok(index>=0,'cover card available');
 return playSpecialCard(side,index,{escortSlot:0},nowMs,rnd);
}
test('cover is a new card, never an automatic defensive boost',()=>{
 const s=side();
 assert.equal(s.maneuvers.cover,null);
 assert.equal(s.specialHand.length,5);
 const plain=interceptManeuverVolley(s,100,1100,()=>.20);
 assert.equal(plain.details.some(d=>d.mode==='tactical-cover'),false);
});
test('a cover card consumes one special, refills to five and does not require sync',()=>{
 const s=side();s.maneuvers.sync=0;
 const h=s.hand.map(c=>c.id);
 const r=coverCard(s);
 assert.equal(r.played,true);
 assert.equal(r.definition.type,'tactical-cover');
 assert.equal(r.side.specialHand.length,5);
 assert.equal(r.side.specialDiscard.length,1);
 assert.equal(r.side.specialUses,1);
 assert.equal(r.side.maneuvers.sync,0);
 assert.deepEqual(r.side.hand.map(c=>c.id),h);
});
test('only slot 0 defensive escort may protect mother, no card consumed on failed use',()=>{
 const s=side(),i=findCoverCardIndex(s);
 const wrong=playSpecialCard(s,i,{escortSlot:1},1200,rnd);
 assert.equal(wrong.played,false);
 assert.equal(wrong.reason,'defensive_escort_required');
 assert.equal(s.specialDiscard.length,0);
 const offline={...s,escorts:s.escorts.map((e,j)=>j?e:{...e,defense:{...e.defense,shield:{...e.defense.shield,hp:0}}})};
 assert.equal(playSpecialCard(offline,i,{escortSlot:0},1200,rnd).reason,'escort_unavailable');
});
test('a destroyed command center cannot activate tactical cover',()=>{
 const s=side(),m=s.fleet[0];
 s.fleet=[{...m,defense:{...m.defense,parts:{...m.defense.parts,command:{...m.defense.parts.command,hp:0}}}}];
 const r=coverCard(s);
 assert.equal(r.played,false);
 assert.equal(r.reason,'command_offline');
});
test('cover is single use, consuming escort HP at projectile impact, not mother HP regeneration',()=>{
 const s=side();
 s.escorts[0].defense.shield.hp=100;
 s.escorts[0].defense.shield.max=100;
 s.escorts[1].defense.shield.hp=0;
 const active=coverCard(s,1000).side;
 const before=active.fleet[0].defense.shield.hp;
 const hit=applyPendingHit(active,0,'plus',80,{nowMs:1200,hitId:'p25-a'});
 assert.equal(hit.intercepted,60);
 assert.equal(hit.defender.escorts[0].defense.shield.hp,40);
 assert.equal(hit.defender.fleet[0].defense.shield.hp,before-20);
 assert.equal(hit.defender.maneuvers.cover,null);
 const second=applyPendingHit(hit.defender,0,'plus',80,{nowMs:1500,hitId:'p25-b'});
 assert.equal(second.intercepted,16);
 assert.equal(second.defender.escorts[0].defense.shield.hp,24);
 assert.equal(second.defender.maneuvers.cover,null);
});
test('cover never creates free HP, residual damage goes to mother',()=>{
 const s=side();s.escorts[0].defense.shield.hp=12;s.escorts[1].defense.shield.hp=0;
 const active=coverCard(s,1000).side;
 const hit=applyPendingHit(active,0,'plus',100,{nowMs:1001,hitId:'p25-c'});
 assert.equal(hit.intercepted,12);
 assert.equal(hit.motherDamage,88);
 assert.equal(hit.defender.escorts[0].defense.shield.hp,0);
 assert.equal(hit.defender.maneuvers.cover,null);
});
test('cover expires after 15 seconds and does not spend escort HP without an attack',()=>{
 const s=side(),active=coverCard(s,1000).side;
 const original=active.escorts[0].defense.shield.hp;
 assert.equal(maneuverStatus(active.maneuvers,active,15999).coverRemainingMs,1);
 assert.equal(advanceManeuvers(active.maneuvers,active,16000).cover,null);
 assert.equal(active.escorts[0].defense.shield.hp,original);
 const after=applyPendingHit(active,0,'plus',100,{nowMs:16001});
 assert.equal(after.defender.maneuvers.cover,null);
 assert.equal(after.intercepted<=100*.45*2,true);
});
test('cover does not block or consume a direct shot targeting escort itself',()=>{
 const s=side(),active=coverCard(s,1000).side;
 const hit=applyPendingHit(active,0,'plus',10,{nowMs:1100,escortIndex:1,cards:[]});
 assert.equal(hit.defender.maneuvers.cover?.escortSlot,0);
});
test('cover does not activate if fusion is active and vice versa',()=>{
 const s=side(),coverIndex=findCoverCardIndex(s),fusionIndex=findFusionCardIndex(s,'barrier');
 const active=coverCard(s,1000).side;
 const fusion=playSpecialCard(active,findFusionCardIndex(active,'barrier'),{escortSlot:0},1010,rnd);
 assert.equal(fusion.played,false);assert.equal(fusion.reason,'cover_active');
 assert.equal(fusion.side.specialUses,1);
 const unfunded=playSpecialCard(s,fusionIndex,{escortSlot:0},1000,rnd);
 assert.equal(unfunded.played,false); // requires 100 sync
 assert.equal(playSpecialCard({...s,maneuvers:{...s.maneuvers,sync:100}},fusionIndex,{escortSlot:0},1000,rnd).played,true);
 const enabled=playSpecialCard({...s,maneuvers:{...s.maneuvers,sync:100}},fusionIndex,{escortSlot:0},1000,rnd);
 assert.equal(playSpecialCard(enabled.side,findCoverCardIndex(enabled.side),{escortSlot:0},1001,rnd).reason,'fusion_active');
});
test('cover cannot stack without another card, no accidental consumption',()=>{
 const s=side(),active=coverCard(s,1000).side;
 const extraCover=active.specialDeck.find(card=>card.type==='tactical-cover');
 assert.ok(extraCover,'a second card exists elsewhere in the deck');
 const withSecond={...active,specialHand:[extraCover,...active.specialHand.slice(1)]};
 const second=playSpecialCard(withSecond,0,{escortSlot:0},1001,rnd);
 assert.equal(second.played,false);
 assert.equal(second.reason,'cover_active');
 assert.equal(second.side.specialUses,1);
});
test('positive hit of one point keeps cover until there is actual absorption',()=>{
 const s=side(),active=coverCard(s,1000).side;
 const testHit=interceptManeuverVolley(active,0,1100,()=>.2);
 assert.equal(testHit.maneuvers.cover.escortSlot,0);
});
test('cover invalidates on command loss and on the escort shield draining',()=>{
 const s=side(),active=coverCard(s,1000).side;
 const noShield={...active,escorts:active.escorts.map((e,i)=>i===0?{
  ...e,defense:{...e.defense,shield:{...e.defense.shield,hp:0}}
 }:e)};
 assert.equal(advanceManeuvers(active.maneuvers,noShield,1100).cover,null);
 const m=active.fleet[0];
 const noCommand={...active,fleet:[{...m,defense:{...m.defense,parts:{
 ...m.defense.parts,command:{...m.defense.parts.command,hp:0}
 }}}]};
 assert.equal(advanceManeuvers(active.maneuvers,noCommand,1100).cover,null);
});
test('card eligibility differs by family, not all specials require 100 sync',()=>{
 const s=side(),card=findCoverCardIndex(s);
 assert.equal(specialCardReadiness(s,card,0,1000).ready,true);
 const fusionIndex=findFusionCardIndex(s,'barrier');
 assert.equal(specialCardReadiness(s,fusionIndex,0,1000).ready,false);
 assert.equal(specialCardReadiness(s,fusionIndex,0,1000).reason,'not_enough_sync');
 assert.equal(MANEUVER_RULES.tacticalCoverInterceptShare,.75);
});
