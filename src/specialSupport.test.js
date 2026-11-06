import test from 'node:test';
import assert from 'node:assert/strict';
import {initialBattle} from './mathDuelEngine.js';
import {damageMotherShield} from './vitalDefense.js';
import {useSupportCard,SUPPORT_RULES} from './specialSupport.js';
import {playSpecialCard,specialCardReadiness,initializeSpecialDeck} from './specialCards.js';
const rng=()=>.5;
function side(){return initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5},rng).player;}
function withCard(side,type){
 return {...side,specialHand:[{id:'test-support',type},...side.specialHand.slice(1)]};
}
function hurt(side,amount=30){
 const mother=side.fleet[0];
 return {...side,fleet:[{...mother,defense:damageMotherShield(mother.defense,amount).defense}]};
}
test('30: shield repair requires consuming an actual support card',()=>{
 const b=withCard(hurt(side()),'support-shield-repair');
 const before=b.fleet[0].defense.shield.hp,hand=b.hand;
 const r=playSpecialCard(b,0,{escortSlot:0},1000,rng);
 assert.equal(r.played,true);
 assert.equal(r.amount,SUPPORT_RULES.shieldRepair);
 assert.equal(r.side.fleet[0].defense.shield.hp,before+20);
 assert.equal(r.side.specialUses,b.specialUses+1);
 assert.equal(r.side.specialHand.length,5);
 assert.deepEqual(r.side.hand,hand);
 assert.equal(r.side.specialDiscard.some(c=>c.id==='test-support'),true);
});
test('30: partial generator reduces real repair amount, cannot bypass cap',()=>{
 const s=hurt(side(),8);
 const def=s.fleet[0].defense,part=def.parts.shieldGenerator;
 const damaged={...s,fleet:[{...s.fleet[0],defense:{...def,parts:{
  ...def.parts,shieldGenerator:{...part,hp:Math.floor(part.max/2)}
 }}}]};
 const r=playSpecialCard(withCard(damaged,'support-shield-repair'),0,{},1000,rng);
 assert.equal(r.played,true);
 assert.equal(r.amount,8);
 assert.equal(r.side.fleet[0].defense.shield.hp,def.shield.max);
});
test('30: generator KO makes repair card unavailable and leaves deck untouched',()=>{
 const s=hurt(side()),def=s.fleet[0].defense;
 const disabled=withCard({...s,fleet:[{...s.fleet[0],defense:{...def,parts:{
  ...def.parts,shieldGenerator:{...def.parts.shieldGenerator,hp:0}
 }}}]},'support-shield-repair');
 const r=playSpecialCard(disabled,0,{},1000,rng);
 assert.equal(r.played,false);
 assert.equal(r.reason,'generator_destroyed');
 assert.strictEqual(r.side,disabled);
});
test('30: full shield cannot waste repair card or change HP',()=>{
 const s=withCard(side(),'support-shield-repair');
 const r=playSpecialCard(s,0,{},1000,rng);
 assert.equal(r.played,false);
 assert.equal(r.reason,'shield_full');
 assert.equal(r.side.specialUses,0);
});
test('30: purge costs a card and removes both current negative statuses',()=>{
 const s=withCard({...side(),strategicStatuses:{ionizedUntil:8000,corrodedUntil:9000}},'support-status-purge');
 const r=playSpecialCard(s,0,{},1000,rng);
 assert.equal(r.played,true);
 assert.equal(r.side.strategicStatuses.ionizedUntil,0);
 assert.equal(r.side.strategicStatuses.corrodedUntil,0);
 assert.equal(r.side.specialUses,1);
 assert.equal(r.side.specialHand.length,5);
});
test('30: purge cannot be used if status has expired or never existed',()=>{
 const s=withCard({...side(),strategicStatuses:{ionizedUntil:900,corrodedUntil:0}},'support-status-purge');
 const r=playSpecialCard(s,0,{},1000,rng);
 assert.equal(r.played,false);
 assert.equal(r.reason,'no_negative_status');
 assert.equal(s.specialHand.length,5);
});
test('30: support cards cannot be used by a non-mother legacy ship',()=>{
 const s={fleet:[{id:'N00'}],specialHand:[{id:'x',type:'support-shield-repair'}],
  specialDeck:[],specialDiscard:[],maneuvers:{}};
 const r=playSpecialCard(s,0,{},1000,rng);
 assert.equal(r.played,false);
 assert.equal(r.reason,'ability_unavailable');
});
test('30: support actions never alter numeric suits, values or engine loadout',()=>{
 const s=withCard(hurt(side()),'support-shield-repair');
 const oldHand=s.hand,oldWeapons=s.fleet[0].weapons;
 const r=playSpecialCard(s,0,{},1000,rng);
 assert.deepEqual(r.side.hand,oldHand);
 assert.deepEqual(r.side.fleet[0].weapons,oldWeapons);
 assert.equal(r.side.fleet[0].defense.shield.max,s.fleet[0].defense.shield.max);
});
