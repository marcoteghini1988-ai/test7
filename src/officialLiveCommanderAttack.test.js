import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,applyOfficialLiveAction} from './officialLiveDuelEngine.js';
import {COMMANDER_ABILITIES} from './commanderAbilities.js';
import {LIVE_FORMULA_PILOT_TRIGGERS,LIVE_NATIVE_PILOT_TRIGGERS,
 liveCommanderArmFormula,liveCommanderNativeBonus,
 liveCommanderAfterNativeShot} from './officialLiveCommanderAttack.js';
const scenario=id=>createTacticalDuel({shipA:'C01',shipB:'N00',
 levelA:1,levelB:1,nowMs:0,commanderA:{id,level:5}});
const cards=[{value:4,suit:'♥'},{value:5,suit:'♣'}];
const play=(b,action,t)=>{
 const r=applyOfficialLiveAction(b,'A',action,t);
 assert.equal(r.ok,true,JSON.stringify({action,reason:r.reason}));
 return r.battle;
};
test('23 condizioni offensive supportate, sette difese distinte, tre offensive ancora da adattare',()=>{
 const all=Object.values(COMMANDER_ABILITIES);
 const triggers=[...LIVE_FORMULA_PILOT_TRIGGERS,...LIVE_NATIVE_PILOT_TRIGGERS];
 assert.equal(all.length,33);
 assert.equal(all.filter(p=>p.role==='Difesa').length,7);
 assert.equal(triggers.length,23);
 assert.equal(new Set(triggers).size,23);
 assert.equal(all.filter(p=>p.role==='Attacco'&&triggers.includes(p.trigger)).length,23);
 assert.deepEqual(all.filter(p=>p.role==='Attacco'&&!triggers.includes(p.trigger)).map(p=>p.trigger),
 ['repeat_vital','alternate_escort','third_vital']);
});
test('Una formula matematica vera attiva un bonus su successivo proiettile, non sul vitale',()=>{
 const b=scenario('pilot_com_1'),a=b.sides.A,z=b.sides.B;
 const signature={kind:'mathGate',op:'plus',target:9,allowedCardCounts:[2,3]};
 z.defense.parts.engine.signature=signature;
 assert.equal(liveCommanderArmFormula(a,z,{vitalId:'engine',op:'plus',cards,damage:0}),false);
 assert.equal(liveCommanderArmFormula(a,z,{vitalId:'engine',op:'plus',
  cards:[{value:1,suit:'♥'},cards[1]],damage:10}),false);
 assert.equal(a.commander.liveFormulaBonus,undefined);
 assert.equal(liveCommanderArmFormula(a,z,{vitalId:'engine',op:'plus',cards,damage:10}),true);
 const bonus=liveCommanderNativeBonus(a,z,60);
 assert.equal(bonus.active,true);
 assert.equal(bonus.percentage,6);
 assert.equal(bonus.damage,63);
 assert.equal(liveCommanderAfterNativeShot(a,0,bonus),false);
 assert.equal(a.commander.liveFormulaBonus.trigger,'plus');
 assert.equal(liveCommanderAfterNativeShot(a,10,bonus),true);
 assert.equal(a.commander.liveFormulaBonus,null);
 assert.equal(a.commander.bonusRemainder,60);
 assert.equal(liveCommanderNativeBonus(a,z,60).damage,60);
});
test('Bonus sul proiettile solo in seguito a reali condizioni critiche o speciali',()=>{
 const b=scenario('pilot_rare_2'),a=b.sides.A,z=b.sides.B;
 assert.equal(liveCommanderNativeBonus(a,z,50).active,false);
 a.defense.shield.hp=30;
 const active=liveCommanderNativeBonus(a,z,50);
 assert.equal(active.active,true);
 assert.equal(active.percentage,7);
 assert.equal(active.damage,53);
 const other=scenario('pilot_epic_2');
 const p=other.sides.A,q=other.sides.B;
 assert.equal(liveCommanderNativeBonus(p,q,100,{queued:{ion:true,corrosion:true}}).active,false,
  'due flag senza carte autentiche non bastano');
 assert.equal(liveCommanderNativeBonus(p,q,100,{queued:{
  offensiveTypes:['shot-ion','shot-ion'],ion:true}}).active,false);
 assert.equal(liveCommanderNativeBonus(p,q,100,{queued:{
  offensiveTypes:['shot-ion','shot-corrosion'],ion:true,corrosion:true}}).active,true);
});
test('Terzo impatto pilota Nucleo: solo 2 precedenti HP realmente inflitti',()=>{
 const a=scenario('pilot_boss_19').sides.A,z=scenario('pilot_boss_19').sides.B;
 assert.equal(liveCommanderNativeBonus(a,z,60).active,false);
 a.commander.successfulMotherHits=2;
 const bonus=liveCommanderNativeBonus(a,z,60);
 assert.equal(bonus.active,true);
 assert.equal(bonus.percentage,12);
 a.commander.successfulMotherHits=3;
 assert.equal(liveCommanderNativeBonus(a,z,60).active,false);
});
test('Duello reale: combinazione autentica dà +6% alla successiva arma C01',()=>{
 let b=createOfficialLiveDuel(scenario('pilot_com_1'),0);
 const pile=b.sides.A.numeric,all=[...pile.hand,...pile.deck,...pile.discard];
 const desired=[{value:4,suit:'♥'},{value:5,suit:'♣'},{value:13,suit:'♥'}].map(w=>
  all.find(c=>c.value===w.value&&c.suit===w.suit));
 assert.ok(desired.every(Boolean));
 const ids=new Set(desired.map(c=>c.id));
 pile.hand=[...desired,...all.filter(c=>!ids.has(c.id)).slice(0,4)];
 const inHand=new Set(pile.hand.map(c=>c.id));
 pile.deck=all.filter(c=>!inHand.has(c.id));pile.discard=[];
 b.sides.B.defense.shield.hp=45;
 b=play(b,{type:'expose',vitalId:'engine'},1);
 b=play(b,{type:'numeric',index:0,target:'vital',vitalId:'engine'},2);
 b=play(b,{type:'numeric',index:0,target:'vital',vitalId:'engine'},3);
 assert.equal(b.sides.B.defense.parts.engine.hp,0);
 assert.equal(b.sides.A.commander.liveFormulaBonus?.percentage,6);
 const shield=b.sides.B.defense.shield.hp;
 b=play(b,{type:'numeric',index:0,target:'ship',shipId:'mother'},4);
 assert.equal(b.actionUsed.numeric,3);
 const shot=b.history.findLast(e=>e.kind==='shot');
 assert.equal(shot.weaponId,'W02');
 assert.equal(shot.damage,27);
 assert.equal(shield-b.sides.B.defense.shield.hp,27);
 assert.equal(b.sides.A.commander.liveFormulaBonus,null);
 assert.equal(b.history.some(e=>e.kind==='pilot_bonus'),true);
});

test('Crono pilota: un vero ricambio arma solo il primo colpo efficace',()=>{
 const b=scenario('pilot_boss_6'),a=b.sides.A,z=b.sides.B;
 assert.equal(liveCommanderNativeBonus(a,z,50).active,false);
 a.numeric.recycleEvents=1;
 const active=liveCommanderNativeBonus(a,z,50);
 assert.equal(active.active,true);
 assert.equal(active.percentage,7);
 assert.equal(active.damage,53);
 assert.equal(liveCommanderAfterNativeShot(a,0,active),false);
 assert.equal(liveCommanderNativeBonus(a,z,50).active,true);
 assert.equal(liveCommanderAfterNativeShot(a,12,active),true);
 assert.equal(a.commander.seenRecycle,1);
 assert.equal(liveCommanderNativeBonus(a,z,50).active,false);
 a.numeric.recycleEvents=2;
 assert.equal(liveCommanderNativeBonus(a,z,50).active,true);
});
test('LIVE: la vera carta speciale Ricambio concede Crono solo dopo sostituzione autentica',()=>{
 let b=createOfficialLiveDuel(scenario('pilot_boss_6'),0);
 b.sides.A.special.hand[0].type='tactic-numeric-recycle';
 assert.equal(b.sides.A.numeric.recycleEvents||0,0);
 b=play(b,{type:'special',index:0,slot:'open-0',recycleIndices:[0]},1);
 assert.equal(b.sides.A.numeric.recycleEvents,1);
 const i=b.sides.A.numeric.hand.findIndex(c=>c.suit==='♥');
 assert.ok(i>=0,'La C01 deve avere una vera numerica compatibile in mano');
 b=play(b,{type:'numeric',index:i,target:'ship',shipId:'mother'},2);
 assert.equal(b.sides.A.commander.seenRecycle,1);
 assert.equal(b.history.filter(e=>e.kind==='pilot_bonus').length,1);
});
