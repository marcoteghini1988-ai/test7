import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_CHARACTER_CATALOG,BOSS_CHARACTER_TYPES,BOSS_CHARACTER_DURATION_CYCLES,
 activateBossCharacter,bossCharacterActive,bossCharacterNativeBonus,bossCharacterShieldFactor,
 bossCharacterIonFactor,bossCharacterPrecisionExtra,bossCharacterEscortExtra,
 bossCharacterSyncExtra,bossCharacterCounterSync,bossCharacterRememberHit,
 bossCharacterApplyRegen,expireBossCharacter} from './bossCharacterCards.js';
import {TACTICAL_STARTER_TYPES,TACTICAL_SPECIALS,validateTacticalLoadout,
 createTacticalDuel,validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {tacticalStatusDuration} from './tacticalTimedStatus.js';

const EMPTY={numericIndices:[],specialIndices:[]};
const deck=(ids=[])=>TACTICAL_STARTER_TYPES.map((type,i)=>ids[i]??type);
function withCharacter(id,levelA=5,levelB=5){
 const b=createTacticalDuel({shipA:'R04',shipB:'C01',levelA,levelB,
  specialDeckA:deck([id]),nowMs:0});
 const pile=b.sides.A.special;
 const inHand=pile.hand.findIndex(c=>c.type===id);
 if(inHand>=0)[pile.hand[0],pile.hand[inHand]]=[pile.hand[inHand],pile.hand[0]];
 else{
  const j=pile.deck.findIndex(c=>c.type===id);
  assert.ok(j>=0,'Character is in authentic 24-card deck: '+id);
  [pile.hand[0],pile.deck[j]]=[pile.deck[j],pile.hand[0]];
 }
 return b;
}
function fire(b,cardIndex=0,at=100,other=EMPTY){
 const first=sealTacticalOrder(b,'A',{...EMPTY,
  specialIndices:cardIndex==null?[]:[cardIndex]},at);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',other,at+1);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,at+1);
}
const next=b=>advanceTacticalDuel(b,b.resolveUntilMs);
const gun=(b,by='A')=>b.history.at(-1).impacts.find(e=>e.kind==='barrier'&&e.by===by);

test('12 Carte Personaggio identità/distinzioni e 24+5 carte originali, durata due cicli',()=>{
 assert.equal(BOSS_CHARACTER_TYPES.length,12);
 assert.equal(new Set(BOSS_CHARACTER_TYPES.map(id=>BOSS_CHARACTER_CATALOG[id].effect)).size,12);
 assert.equal(BOSS_CHARACTER_DURATION_CYCLES,2);
 for(const id of BOSS_CHARACTER_TYPES){
  const b=withCharacter(id);
  assert.ok(TACTICAL_SPECIALS[id],id);
  assert.equal(b.sides.A.special.hand.length,5);
  assert.equal(b.sides.A.special.deck.length,19);
  const before=[...b.sides.A.special.hand,...b.sides.A.special.deck];
  assert.equal(new Set(before.map(c=>c.id)).size,24,id);
  assert.equal(validateTacticalLoadout(deck([id])),true,id);
  const fight=fire(b);
  assert.equal(fight.sides.A.bossCharacter.id,id);
  assert.equal(fight.sides.A.bossCharacter.startedRound,1);
  assert.equal(fight.sides.A.bossCharacter.untilRound,2);
  assert.equal(fight.sides.A.special.discard.some(c=>c.type===id),true);
  assert.equal([...fight.sides.A.special.hand,...fight.sides.A.special.deck,
   ...fight.sides.A.special.discard].length,24);
 }
});

test('Un solo personaggio attivo: niente doppie attivazioni o bonus permanente',()=>{
 const ids=['boss-character-1','boss-character-2'];
 const b=createTacticalDuel({shipA:'R04',levelA:5,
  specialDeckA:deck(ids)});
 const pile=b.sides.A.special;
 ids.forEach((type,index)=>{
  const hi=pile.hand.findIndex(c=>c.type===type);
  if(hi>=0)[pile.hand[index],pile.hand[hi]]=[pile.hand[hi],pile.hand[index]];
  else{
   const j=pile.deck.findIndex(c=>c.type===type);
   assert.ok(j>=0);
   [pile.hand[index],pile.deck[j]]=[pile.deck[j],pile.hand[index]];
  }
 });
 assert.equal(validateTacticalOrder(b,'A',{specialIndices:[0,1],numericIndices:[]}).reason,'character_conflict');
 const one=fire(b,0);
 assert.equal(one.sides.A.bossCharacter.id,ids[0]);
 let two=next(one);
 assert.equal(two.round,2);
 assert.equal(bossCharacterActive(two.sides.A,2).id,ids[0]);
 const secondIndex=two.sides.A.special.hand.findIndex(c=>c.type===ids[1]);
 if(secondIndex>=0)assert.equal(validateTacticalOrder(two,'A',{
  specialIndices:[secondIndex],numericIndices:[]}).reason,'character_already_active');
 two=fire(two,null,two.deadlineMs-30000+1);
 let three=next(two);
 assert.equal(three.round,3);
 assert.equal(bossCharacterActive(three.sides.A,3),null);
 three=fire(three,null,three.deadlineMs-30000+1);
 assert.equal(three.sides.A.bossCharacter,null,'Scadenza effettiva al terzo ciclo');
});
test('Gaia e Nettuno: riducono soltanto barriera, mai regalano HP o cambiano firme matematiche',()=>{
 const a=withCharacter('boss-character-1');
 const untouched=withCharacter('boss-character-8');
 assert.equal(bossCharacterShieldFactor(a.sides.A,1),1);
 activateBossCharacter(a.sides.A,'boss-character-1',1);
 activateBossCharacter(untouched.sides.A,'boss-character-8',1);
 assert.equal(bossCharacterShieldFactor(a.sides.A,1),.85);
 assert.equal(bossCharacterShieldFactor(untouched.sides.A,1),.88);
 untouched.sides.A.escorts.forEach(e=>e.hp=0);
 assert.equal(bossCharacterShieldFactor(untouched.sides.A,1),1);
 assert.equal(bossCharacterShieldFactor(a.sides.A,3),1);
 const normal=createTacticalDuel({shipA:'R04',shipB:'C01',levelA:5});
 const guarded=withCharacter('boss-character-1');
 const x=fire(guarded),y=fire(normal,null);
 assert.ok(gun(x,'B').damage<=gun(y,'B').damage);
 assert.deepEqual(x.sides.A.defense.parts.engine.signature,
  y.sides.A.defense.parts.engine.signature);
});
test('Tharsis, Ombre e Magma: bonus alle armi native solo nelle condizioni effettive',()=>{
 const b=withCharacter('boss-character-2');
 const a=b.sides.A,enemy=b.sides.B;
 assert.equal(bossCharacterNativeBonus(a,enemy,1,40).active,false);
 activateBossCharacter(a,'boss-character-2',1);
 assert.equal(bossCharacterNativeBonus(a,enemy,1,40).extra,3);
 assert.equal(bossCharacterNativeBonus(a,enemy,3,40).extra,0);
 const shadow=withCharacter('boss-character-9').sides.A;
 activateBossCharacter(shadow,'boss-character-9',1);
 assert.equal(bossCharacterNativeBonus(shadow,enemy,1,40).active,false);
 shadow.defense.shield.hp=18;
 assert.equal(bossCharacterNativeBonus(shadow,enemy,1,40).extra,3);
 shadow.defense.shield.hp=40; // a genuine preparation repair may restore it
 assert.equal(bossCharacterNativeBonus(shadow,enemy,1,40,18).extra,3,
  'The real shield at cycle start is authoritative, not the later repaired value');
 const magma=withCharacter('boss-character-19').sides.A;
 activateBossCharacter(magma,'boss-character-19',1);
 assert.equal(bossCharacterNativeBonus(magma,enemy,1,40).active,false);
 enemy.corroded=true;
 assert.equal(bossCharacterNativeBonus(magma,enemy,1,40).extra,3);
});
test('Venere: Corrosione nasce solo dal vero colpo nativo, non da una carta rivelata senza successo',()=>{
 const venus=withCharacter('boss-character-3');
 const fired=fire(venus);
 assert.ok(gun(fired).damage>0);
 assert.ok(fired.sides.B.statusUntil.corroded>0);
 assert.equal(fired.sides.B.corroded,true);
 const blocked=withCharacter('boss-character-3');
 blocked.sides.B.defense.shield.hp=0;
 const withoutDamage=fire(blocked);
 assert.equal(gun(withoutDamage).damage,0);
 assert.equal(withoutDamage.sides.B.statusUntil?.corroded??0,0);
});
test('Urano, Crono, Generatore e Sovrano: nessun beneficio senza stato/contromisura/calcolo',()=>{
 const ion=withCharacter('boss-character-7').sides.A;
 activateBossCharacter(ion,'boss-character-7',1);
 assert.equal(bossCharacterIonFactor(ion,1),.70);
 assert.equal(tacticalStatusDuration(ion,'ionized',{characterIonFactor:bossCharacterIonFactor(ion,1)}),8400);
 assert.equal(bossCharacterIonFactor(ion,3),1);
 const chrono=withCharacter('boss-character-6').sides.A;
 activateBossCharacter(chrono,'boss-character-6',1);
 assert.equal(bossCharacterCounterSync(chrono,1,false),0);
 assert.equal(bossCharacterCounterSync(chrono,1,true),8);
 const generator=withCharacter('boss-character-14').sides.A;
 activateBossCharacter(generator,'boss-character-14',1);
 assert.equal(bossCharacterSyncExtra(generator,1,false),0);
 assert.equal(bossCharacterSyncExtra(generator,1,true),5);
 assert.equal(bossCharacterSyncExtra(generator,3,true),0);
 const voidCard=withCharacter('boss-character-20').sides.A;
 activateBossCharacter(voidCard,'boss-character-20',1);
 assert.equal(bossCharacterPrecisionExtra(voidCard,1,[{suit:'♠'},{suit:'♠'}],20),0);
 assert.equal(bossCharacterPrecisionExtra(voidCard,1,[{suit:'♠'},{suit:'♥'}],20),1);
 assert.equal(bossCharacterPrecisionExtra(voidCard,3,[{suit:'♠'},{suit:'♥'}],20),0);
});
test('Idra si rigenera solo dopo colpo REALE e nel ciclo seguente, una sola volta, generatore non KO',()=>{
 const b=withCharacter('boss-character-11');
 const side=b.sides.A;
 activateBossCharacter(side,'boss-character-11',1);
 side.defense.shield.hp=20;
 assert.equal(bossCharacterRememberHit(side,1,0),false);
 assert.equal(bossCharacterApplyRegen(side,2),0);
 assert.equal(bossCharacterRememberHit(side,1,4),true);
 assert.equal(bossCharacterApplyRegen(side,1),0);
 assert.equal(bossCharacterApplyRegen(side,2),4);
 assert.equal(side.defense.shield.hp,24);
 assert.equal(bossCharacterApplyRegen(side,2),0);
 assert.equal(bossCharacterRememberHit(side,2,6),false);
 const ko=withCharacter('boss-character-11').sides.A;
 activateBossCharacter(ko,'boss-character-11',1);
 ko.defense.parts.shieldGenerator.hp=0;
 bossCharacterRememberHit(ko,1,7);
 assert.equal(bossCharacterApplyRegen(ko,2),0);
});
test('Cristallo: solo scudiera vera, madre deve avere già danneggiato la barriera',()=>{
 const side=withCharacter('boss-character-17').sides.A;
 activateBossCharacter(side,'boss-character-17',1);
 assert.equal(bossCharacterEscortExtra(side,1,20,0),0);
 assert.equal(bossCharacterEscortExtra(side,1,20,5),2);
 assert.equal(bossCharacterEscortExtra(side,3,20,5),0);
});
