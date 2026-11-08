import test from 'node:test';
import assert from 'node:assert/strict';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,tacticalBossMotherFactor,tacticalBossConditionSnapshot,
 tacticalSovereignSupremacyBonus,rememberTacticalSovereignHit} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const EMPTY={specialIndices:[],numericIndices:[]};
const fixture=(lv=9)=>createTacticalDuel({shipA:'C01',levelA:1,
 shipB:'C02',levelB:1,bossNumericDeckA:lv?{id:'planet_char_20',level:lv}:null});
function play(b,orderA=EMPTY,at=100){
 const a=sealTacticalOrder(b,'A',orderA,at);
 assert.equal(a.ok,true,a.reason);
 const c=sealTacticalOrder(a.battle,'B',EMPTY,at+1);
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,at+1);
}
const next=x=>advanceTacticalDuel(x,x.resolveUntilMs);
const precision=b=>b.history.at(-1).impacts.find(i=>i.kind==='precision'&&i.by==='A');
function realHandCards(side,values){
 const pile=side.numeric;
 const all=[...pile.hand,...pile.deck,...pile.discard];
 const wanted=values.map(([value,suit])=>all.find(c=>c.value===value&&c.suit===suit));
 assert.ok(wanted.every(Boolean));
 const ids=new Set(wanted.map(c=>c.id));
 const rest=all.filter(c=>!ids.has(c.id));
 pile.hand=[...wanted,...rest.slice(0,5)];
 pile.deck=rest.slice(5);
 pile.discard=[];
 assert.equal(pile.hand.length,7);
 assert.equal(new Set([...pile.hand,...pile.deck].map(c=>c.id)).size,52);
}

test('Sovrano L1-L9: tutte tre le passive e livelli reali sbloccati; nessun mazzo regalato',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_20'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_20',bossDeckInventory:{}}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_20',
  bossDeckInventory:{planet_char_20:{unlocked:true,level:9}}}).enabled,true);
 const expected=[[8,null,null],[12,null,null],[16,null,null],
  [16,4,null],[16,6,null],[16,8,null],
  [16,8,4],[16,8,6],[16,8,8]];
 for(let level=1;level<=9;level++){
  const side=fixture(level).sides.A;
  assert.equal(side.bossNumericDeck.level,level);
  assert.equal(side.bossNumericDeck.supremacyArmedAfterRound,0);
  assert.deepEqual(activeNumericBossAbilities('planet_char_20',level).map(a=>a.value),expected[level-1]);
 }
});

test('Ultimo presidio: la riduzione scatta SOLO con tre vitali propri a KO',()=>{
 const side=fixture(9).sides.A;
 assert.equal(tacticalBossMotherFactor(side),1);
 const parts=side.defense.parts;
 parts.engine.hp=0;parts.weapons.hp=0;
 assert.equal(tacticalBossMotherFactor(side),1);
 parts.command.hp=0;
 assert.equal(tacticalBossConditionSnapshot(side).destroyedVitals,3);
 assert.equal(tacticalBossMotherFactor(side),.84);
 parts.shieldGenerator.hp=0;
 assert.equal(tacticalBossMotherFactor(side),1,'Con tutti e quattro i vitali distrutti la madre ha già perso');
});

test('Vuoto difensivo: a barriera 25% o meno, due passive sommate con limite 35%',()=>{
 const side=fixture(9).sides.A;
 const shield=side.defense.shield;
 shield.hp=16;
 assert.equal(tacticalBossConditionSnapshot(side).criticalShield,false);
 assert.equal(tacticalBossMotherFactor(side),1);
 shield.hp=15;
 assert.equal(tacticalBossMotherFactor(side),.92);
 side.defense.parts.engine.hp=0;
 side.defense.parts.weapons.hp=0;
 side.defense.parts.command.hp=0;
 assert.equal(tacticalBossMotherFactor(side),.76);
 // A future repair in this same cycle cannot remove the start snapshot.
 const snapshot=tacticalBossConditionSnapshot(side);
 shield.hp=60;
 assert.equal(tacticalBossMotherFactor(side,snapshot),.76);
 assert.equal(tacticalBossMotherFactor(side),.84);
});

test('Difesa Sovrano protegge HP veri nel combattimento, non genera nuovi scudi',()=>{
 const boss=fixture(9),plain=fixture(null);
 for(const b of [boss,plain]){
  b.sides.A.defense.shield.hp=15;
  b.sides.A.defense.parts.engine.hp=0;
  b.sides.A.defense.parts.weapons.hp=0;
  b.sides.A.defense.parts.command.hp=0;
 }
 const a=play(boss),b=play(plain);
 const hitA=a.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='B');
 const hitB=b.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='B');
 assert.ok(hitA.damage<hitB.damage);
 assert.equal(a.sides.A.defense.shield.hp,15-hitA.damage);
 assert.ok(a.lastEvents.some(x=>x.includes('Ultimo presidio / Vuoto difensivo')));
 assert.deepEqual(a.sides.A.defense.parts,b.sides.A.defense.parts);
});

test('Supremazia: vera vittima KO prepara il PROSSIMO impatto, senza bonus gratis nello stesso ciclo',()=>{
 const deck=fixture(9),normal=fixture(null);
 for(const b of [deck,normal]){
  b.sides.B.defense.shield.hp=40;
  b.sides.B.defense.parts.shieldGenerator.hp=6; // KO autentico da avaria
  b.sides.B.defense.parts.engine.hp=30;
  b.sides.B.defense.parts.engine.max=30;
 }
 const attack={numericIndices:[0,1],vitalId:'shieldGenerator',op:'times'};
 const hitA=play(deck,attack),hitB=play(normal,attack);
 assert.equal(precision(hitA).damage,6);
 assert.equal(precision(hitB).damage,6);
 assert.equal(hitA.sides.A.bossNumericDeck.supremacyArmedAfterRound,1);
 assert.ok(hitA.lastEvents.some(x=>x.includes('Supremazia armata')));
 const a=next(hitA),b=next(hitB);
 realHandCards(a.sides.A,[[4,'♣'],[7,'♠']]);
 realHandCards(b.sides.A,[[4,'♣'],[7,'♠']]);
 const nextAttack={numericIndices:[0,1],vitalId:'engine',op:'plus'};
 const a2=play(a,nextAttack,8200),b2=play(b,nextAttack,8200);
 assert.ok(precision(a2).damage>precision(b2).damage);
 assert.equal(precision(a2).damage,7);
 assert.equal(precision(b2).damage,6);
 assert.equal(a2.sides.A.bossNumericDeck.supremacyArmedAfterRound,0);
 assert.ok(a2.lastEvents.some(x=>x.includes('Supremazia +8%')));
 assert.ok(a2.sides.A.numeric.discard.some(c=>c.value===4&&c.suit==='♣'));
});

test('Supremazia: il bonus non viene consumato su danno nullo o firma errata',()=>{
 const side=fixture(9).sides.A;
 assert.equal(tacticalSovereignSupremacyBonus(side,10,2).active,false);
 const unarmed=rememberTacticalSovereignHit(side,1,0,null,{destroyedEnemyVital:true});
 assert.equal(unarmed.armed,false);
 const trigger=rememberTacticalSovereignHit(side,1,10,null,{destroyedEnemyVital:true});
 assert.equal(trigger.armed,true);
 assert.equal(side.bossNumericDeck.supremacyArmedAfterRound,1);
 assert.equal(tacticalSovereignSupremacyBonus(side,10,1).active,false);
 const bonus=tacticalSovereignSupremacyBonus(side,10,2);
 assert.equal(bonus.active,true);assert.equal(bonus.extra,1);
 assert.equal(rememberTacticalSovereignHit(side,2,0,bonus).consumed,false);
 assert.equal(side.bossNumericDeck.supremacyArmedAfterRound,1);
 assert.equal(rememberTacticalSovereignHit(side,2,5,bonus).consumed,true);
 assert.equal(side.bossNumericDeck.supremacyArmedAfterRound,0);
 assert.equal(tacticalSovereignSupremacyBonus(side,10,3).active,false);
});

test('Sovrano numerico non attiva il seme dominante esclusivo del boss di Encelado',()=>{
 const b=fixture(9);
 assert.equal(b.sides.A.bossExclusive,null);
 assert.equal(b.sides.B.bossExclusive,null);
 assert.equal(b.lastEvents.some(x=>x.includes('seme dominante')),false);
});
