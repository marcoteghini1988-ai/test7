import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle,applyPendingHit} from './mathDuelEngine.js';
import {damageMotherShield,exposeMotherPart} from './vitalDefense.js';
import {SPECIAL_CARD_CATALOG,playSpecialCard,specialCardReadiness} from './specialCards.js';
import {SHOT_RULES,armedShotEffects,armShotEffect,consumeArmedShotEffects,
 previewStrategicImpact,strategicStatus,STRATEGIC_EFFECT_LABELS} from './strategicShots.js';
import {interceptManeuverVolley} from './fleetManeuvers.js';
const rnd=()=>0;
function makeSide(level=5){
 return initialBattle(1,{vitalPrototype:true,shipLevel:level,fleetIds:['N00']},rnd).player;
}
const withoutEscorts=side=>({...side,escorts:[]});
const time=1000;
const special=(side,types)=>({...side,
 specialHand:types.map((type,i)=>({id:'prepared-'+i,type})),
 specialDeck:[...side.specialDeck],specialDiscard:[]});
test('27: three named shot cards are separate from four numeric suits',()=>{
 for(const id of ['shot-piercing','shot-ion','shot-corrosion']){
  assert.equal(SPECIAL_CARD_CATALOG[id].family,'volley');
  assert.ok(STRATEGIC_EFFECT_LABELS[id]);
 }
 assert.equal(SHOT_RULES.maxArmed,2);
 assert.equal(armedShotEffects(makeSide()).length,0);
});
test('27: arming consumes one special and replenishes to five, not numeric cards',()=>{
 const s=special(makeSide(),['shot-piercing','shot-ion','shot-corrosion','fusion-barrier','tactical-cover']);
 const numeric=s.hand.map(c=>c.id),i=0;
 const r=playSpecialCard(s,i,{escortSlot:0},time,rnd);
 assert.equal(r.played,true);
 assert.deepEqual(r.side.armedVolleyEffects,['shot-piercing']);
 assert.equal(r.side.specialHand.length,5);
 assert.equal(r.side.specialDiscard.length,1);
 assert.equal(r.side.specialUses,1);
 assert.deepEqual(r.side.hand.map(c=>c.id),numeric);
});
test('27: two distinct effects can be armed for one volley, no third and no duplication',()=>{
 const initial=special(makeSide(),['shot-piercing','shot-ion','shot-corrosion','fusion-barrier','tactical-cover']);
 const a=playSpecialCard(initial,0,{escortSlot:0},time,rnd);
 const ionIndex=a.side.specialHand.findIndex(c=>c.type==='shot-ion');
 assert.ok(ionIndex>=0);
 const b=playSpecialCard(a.side,ionIndex,{escortSlot:0},time,rnd);
 assert.equal(b.played,true);
 assert.deepEqual(b.side.armedVolleyEffects,['shot-piercing','shot-ion']);
 const third=b.side.specialHand.findIndex(c=>c.type==='shot-corrosion');
 assert.equal(playSpecialCard(b.side,third,{escortSlot:0},time,rnd).reason,'volley_slots_full');
 assert.equal(b.side.specialUses,2);
 assert.equal(armShotEffect(b.side,'shot-ion').reason,'already_armed');
});
test('27: offensive cards remain armed through empty volley and consume on real firing',()=>{
 const s=armShotEffect(makeSide(),'shot-piercing').side;
 const idle=consumeArmedShotEffects(s,false);
 assert.strictEqual(idle.side,s);
 assert.deepEqual(idle.effects,[]);
 const fired=consumeArmedShotEffects(s,true);
 assert.deepEqual(fired.effects,['shot-piercing']);
 assert.deepEqual(fired.side.armedVolleyEffects,[]);
 assert.deepEqual(armedShotEffects(s),['shot-piercing']);
});
test('27: piercing reduces interception but never creates raw energy or penetrates vital signatures',()=>{
 const s=makeSide(),baseline=applyPendingHit(s,0,'plus',100,{nowMs:time,hitId:'baseline'}),
  piercing=applyPendingHit(s,0,'plus',100,{nowMs:time,hitId:'pierce',strikeEffects:['shot-piercing']});
 assert.equal(piercing.strategicPiercingBypass,20);
 assert.ok(piercing.intercepted<baseline.intercepted);
 assert.ok(piercing.motherDamage>baseline.motherDamage);
 assert.ok(piercing.intercepted+piercing.motherDamage<=100);
 assert.deepEqual(piercing.strategicApplied,['shot-piercing']);
 for(const id of ['engine','weapons','shieldGenerator','command']){
  assert.equal(piercing.defender.fleet[0].defense.parts[id].hp,
   baseline.defender.fleet[0].defense.parts[id].hp);
 }
});
test('27: a depleted mother shield prevents special shots from bypassing other protection',()=>{
 const s=withoutEscorts(makeSide());
 const depleted={...s,fleet:[{...s.fleet[0],defense:damageMotherShield(s.fleet[0].defense,9999).defense}]};
 const r=applyPendingHit(depleted,0,'plus',100,{nowMs:time,strikeEffects:['shot-ion','shot-piercing']});
 assert.equal(r.strategicPiercingBypass,0);
 assert.deepEqual(r.strategicApplied,[]);
 assert.equal(r.motherDamage,0);
 assert.equal(r.defender.strategicStatuses.ionizedUntil,0);
});
test('27: ion charge is applied at successful hit, reduces only subsequent automatic interceptions',()=>{
 const s=makeSide();
 const first=applyPendingHit(s,0,'plus',20,{nowMs:time,strikeEffects:['shot-ion']});
 assert.deepEqual(first.strategicApplied,['shot-ion']);
 assert.equal(first.defender.strategicStatuses.ionizedUntil,time+SHOT_RULES.ionizedDurationMs);
 const active=applyPendingHit(first.defender,0,'plus',100,{nowMs:time+1000});
 const neutral=applyPendingHit({...first.defender,strategicStatuses:{}},0,'plus',100,{nowMs:time+1000});
 assert.ok(active.intercepted<neutral.intercepted);
 assert.ok(active.motherDamage>neutral.motherDamage);
 const expired=applyPendingHit(first.defender,0,'plus',100,{nowMs:time+SHOT_RULES.ionizedDurationMs});
 assert.equal(expired.intercepted,neutral.intercepted);
});
test('27: ion never reduces card-paid tactical cover interception',()=>{
 const s=makeSide();
 const cover={escortSlot:0,escortId:s.escorts[0].id,startedAt:time,expiresAt:time+10000};
 const prepared={...s,maneuvers:{...s.maneuvers,cover}};
 const normal=interceptManeuverVolley(prepared,80,time+100,()=>.20);
 const affected=interceptManeuverVolley({...prepared,strategicStatuses:{ionizedUntil:time+2000}},
  80,time+100,()=>.20);
 assert.equal(normal.details.find(d=>d.mode==='tactical-cover').damage,
  affected.details.find(d=>d.mode==='tactical-cover').damage);
});
test('27: corrosion causes a one-shot shield vulnerability and then clears',()=>{
 const s=withoutEscorts(makeSide());
 const first=applyPendingHit(s,0,'plus',10,{nowMs:time,strikeEffects:['shot-corrosion']});
 assert.deepEqual(first.strategicApplied,['shot-corrosion']);
 const second=applyPendingHit(first.defender,0,'plus',20,{nowMs:time+100});
 assert.equal(second.motherDamage,25);
 assert.equal(second.strategicCorrosionBonus,5);
 assert.equal(second.defender.strategicStatuses.corrodedUntil,0);
 const third=applyPendingHit(second.defender,0,'plus',20,{nowMs:time+200});
 assert.equal(third.motherDamage,20);
 assert.equal(third.strategicCorrosionBonus,0);
});
test('27: expired corrosion cannot damage a future shield hit',()=>{
 const s=withoutEscorts(makeSide());
 const armed=applyPendingHit(s,0,'plus',10,{nowMs:time,strikeEffects:['shot-corrosion']});
 const future=applyPendingHit(armed.defender,0,'plus',20,{
  nowMs:time+SHOT_RULES.corrosionDurationMs+1});
 assert.equal(future.motherDamage,20);
 assert.equal(future.strategicCorrosionBonus,0);
});
test('27: a new corrosion strike on an already corroded shield refreshes one use',()=>{
 const s=withoutEscorts(makeSide());
 const first=applyPendingHit(s,0,'plus',10,{nowMs:time,strikeEffects:['shot-corrosion']});
 const second=applyPendingHit(first.defender,0,'plus',20,{nowMs:time+100,
  strikeEffects:['shot-corrosion']});
 assert.equal(second.strategicCorrosionBonus,5);
 assert.equal(second.defender.strategicStatuses.corrodedUntil,time+100+SHOT_RULES.corrosionDurationMs);
});
test('27: cards cannot bypass mathematical signatures when targeting a vital',()=>{
 const s=withoutEscorts(makeSide()),mother=s.fleet[0];
 const d=exposeMotherPart(damageMotherShield(mother.defense,Math.ceil(mother.defense.shield.max*.25)).defense,'engine').defense;
 assert.equal(d.parts.engine.exposed,true);
 const target={...s,fleet:[{...mother,defense:d}]};
 const shot=['shot-piercing','shot-ion'];
 const fail=applyPendingHit(target,0,'plus',90,{nowMs:time,vitalId:'engine',
  cards:[{value:2,suit:'♠'},{value:3,suit:'♥'}],
  signatureOverride:{kind:'math',op:'plus',target:10},strikeEffects:shot});
 assert.equal(fail.motherDamage,0);
 assert.equal(fail.strategicPiercingBypass,0);
 assert.deepEqual(fail.strategicApplied,[]);
 assert.equal(fail.defender.fleet[0].defense.parts.engine.hp,d.parts.engine.hp);
});
test('27: a direct escort attack never creates a status on its mother',()=>{
 const s=makeSide();
 const r=applyPendingHit(s,0,'plus',20,{nowMs:time,escortIndex:0,strikeEffects:['shot-ion','shot-corrosion']});
 assert.equal(r.defender.strategicStatuses,undefined);
 assert.equal(r.defender.fleet[0].defense.shield.hp,s.fleet[0].defense.shield.hp);
});
test('27: no tactical cards means normal damage, interception and numeric suits unchanged',()=>{
 const s=makeSide();
 const plain=applyPendingHit(s,0,'plus',100,{nowMs:time});
 const other=applyPendingHit(s,0,'plus',100,{nowMs:time,strikeEffects:[]});
 assert.equal(plain.motherDamage,other.motherDamage);
 assert.equal(plain.intercepted,other.intercepted);
 assert.deepEqual(s.hand,plain.defender.hand);
 assert.equal(armedShotEffects(plain.defender).length,0);
});
test('27: cards that are unavailable do not consume themselves',()=>{
 const s=special(makeSide(),['shot-piercing','shot-ion','shot-corrosion','fusion-barrier','tactical-cover']);
 const a=armShotEffect(s,'shot-piercing').side;
 assert.equal(specialCardReadiness(a,0,0,time).reason,'already_armed');
 const used=playSpecialCard(a,0,{escortSlot:0},time,rnd);
 assert.equal(used.played,false);assert.equal(used.reason,'already_armed');
 assert.equal(used.side.specialUses,0);
});
