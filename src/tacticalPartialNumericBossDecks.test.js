import test from 'node:test';
import assert from 'node:assert/strict';
import {
 tacticalBossDeckReady,tacticalGeneratorSyncBonus,
 tacticalResonanceNativeBonus,rememberTacticalResonanceNativeHit,
 tacticalResonanceVitalBonus,rememberTacticalResonanceVitalHit
} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket}
 from './simultaneousDuelEngine.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const EMPTY={numericIndices:[],specialIndices:[]};
function make({numericBoss=null,level=5}={}){
 const b=createTacticalDuel({shipA:'C01',levelA:level,shipB:'C02',levelB:1});
 if(numericBoss)b.sides.A.bossNumericDeck={id:numericBoss,level,
  lastFocusedWeaponId:null,resonanceNativeRemainder:0,resonanceVitalRemainder:0};
 b.sides.B.defense.shield.hp=40;
 return b;
}
function turn(b,a=EMPTY,at=100){
 const s=sealTacticalOrder(b,'A',a,at);assert.equal(s.ok,true,s.reason);
 const t=sealTacticalOrder(s.battle,'B',EMPTY,at+1);assert.equal(t.ok,true,t.reason);
 return advanceTacticalDuel(t.battle,at+1);
}
const gun=b=>b.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='A');

test('Mazzi parziali Generatore e Risonanza NON sono equipaggiabili fino alla conversione completa',()=>{
 for(const id of ['planet_char_14','planet_char_17']){
  assert.equal(tacticalBossDeckReady(id),false);
  assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
   selectedBossDeck:id,bossDeckInventory:{[id]:{unlocked:true,level:9}}}).enabled,false);
 }
});

test('Generatore: Accumulo energetico +10/20/30% solo su Sincronia effettivamente guadagnata',()=>{
 const b=make({numericBoss:'planet_char_14',level:1});
 assert.equal(tacticalGeneratorSyncBonus(b.sides.A,25),0);
 for(const [level,bonus] of [[4,2],[5,5],[6,7]]){
  b.sides.A.bossNumericDeck.level=level;
  assert.equal(tacticalGeneratorSyncBonus(b.sides.A,25),bonus);
 }
 assert.equal(tacticalGeneratorSyncBonus(b.sides.A,0),0);
 assert.equal(tacticalGeneratorSyncBonus(b.sides.A,-3),0);
 const enabled=make({numericBoss:'planet_char_14',level:6});
 const control=make();
 const x=turn(enabled),y=turn(control);
 assert.equal(x.sides.A.sync-y.sides.A.sync,7);
 assert.ok(x.lastEvents.some(e=>e.includes('Accumulo energetico +7 Sincronia')));
 assert.deepEqual(x.sides.A.numeric,y.sides.A.numeric);
 assert.deepEqual(x.sides.A.special,y.sides.A.special);
 const capped=make({numericBoss:'planet_char_14',level:6});
 capped.sides.A.sync=99;
 const z=turn(capped);
 assert.equal(z.sides.A.sync,100);
 assert.equal(z.lastEvents.some(e=>e.includes('Accumulo energetico +')),false);
});

test('Risonanza: Armi armoniche richiede due FOCUS diversi realmente usati su veri impatti',()=>{
 const b=make({numericBoss:'planet_char_17',level:3});
 const side=b.sides.A,base=nativeBarrierPacket(side);
 assert.ok(side.weapons.length>=2,'Test usa due armi native reali');
 const first=side.weapons[0].id,second=side.weapons[1].id;
 assert.equal(tacticalResonanceNativeBonus(side,first,base).active,false);
 rememberTacticalResonanceNativeHit(side,first,0,null);
 assert.equal(side.bossNumericDeck.lastFocusedWeaponId,null);
 rememberTacticalResonanceNativeHit(side,first,4,null);
 assert.equal(side.bossNumericDeck.lastFocusedWeaponId,first);
 assert.equal(tacticalResonanceNativeBonus(side,first,base).active,false);
 const bonus=tacticalResonanceNativeBonus(side,second,base);
 assert.equal(bonus.active,true);
 assert.equal(bonus.percentage,8);
 rememberTacticalResonanceNativeHit(side,second,0,bonus);
 assert.equal(side.bossNumericDeck.lastFocusedWeaponId,first);
 rememberTacticalResonanceNativeHit(side,second,4,bonus);
 assert.equal(side.bossNumericDeck.lastFocusedWeaponId,second);
 assert.equal(side.bossNumericDeck.resonanceNativeRemainder,bonus.remainder);
 assert.equal(tacticalResonanceNativeBonus(side,'NOT_OWNED',base).active,false);
});

test('Risonanza: focus alternato nel vero pacchetto nativo cambia il danno, non le carte',()=>{
 const b=make({numericBoss:'planet_char_17',level:3});
 const weapons=b.sides.A.weapons;
 assert.ok(weapons.length>=2);
 b.sides.A.bossNumericDeck.lastFocusedWeaponId=weapons[0].id;
 const compare=make();
 compare.sides.A.bossNumericDeck=null;
 const a=turn(b,{weaponFocusId:weapons[1].id});
 const normal=turn(compare,{weaponFocusId:compare.sides.A.weapons[1].id});
 assert.ok(gun(a).damage>=gun(normal).damage);
 assert.ok(a.lastEvents.some(e=>e.includes('Armi armoniche')));
 assert.deepEqual(a.sides.A.numeric,normal.sides.A.numeric);
});

test('Risonanza: Frequenza multipla solo con formula VALIDA e due semi reali, dal livello 4',()=>{
 const d=make({numericBoss:'planet_char_17',level:6});
 const a=d.sides.A;
 d.sides.B.defense.parts.engine.exposed=true;
 const valid={numericIndices:[1,5],vitalId:'engine',op:'plus'}; // 4♣ + 7♥ = 11
 const invalid={numericIndices:[1,5],vitalId:'engine',op:'times'};
 const sameSuit={numericIndices:[0,1],vitalId:'engine',op:'plus'};
 assert.equal(tacticalResonanceVitalBonus(a,d.sides.B,invalid,10).active,false);
 assert.equal(tacticalResonanceVitalBonus(a,d.sides.B,sameSuit,10).active,false);
 for(const [level,pct] of [[3,0],[4,3],[5,5],[6,7]]){
  a.bossNumericDeck.level=level;
  const bonus=tacticalResonanceVitalBonus(a,d.sides.B,valid,10);
  assert.equal(bonus.active,level>=4);
  if(level>=4)assert.equal(bonus.percentage,pct);
 }
 a.bossNumericDeck.level=6;
 const trueBonus=tacticalResonanceVitalBonus(a,d.sides.B,valid,10);
 rememberTacticalResonanceVitalHit(a,0,trueBonus);
 assert.equal(a.bossNumericDeck.resonanceVitalRemainder,0);
 rememberTacticalResonanceVitalHit(a,10,trueBonus);
 assert.equal(a.bossNumericDeck.resonanceVitalRemainder,70);
 assert.equal(tacticalResonanceVitalBonus(a,d.sides.B,valid,10).extra,1);
 const played=turn(make({numericBoss:'planet_char_17',level:6}),valid);
 assert.ok(played.lastEvents.some(e=>e.includes('Frequenza multipla')));
 assert.ok(played.history[0].impacts.some(i=>i.kind==='precision'&&i.by==='A'&&i.damage>0));
});
