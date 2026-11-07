import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket
} from './simultaneousDuelEngine.js';
import {
 createExclusiveBossState,prepareExclusiveBloodPact,exclusiveBloodPactNativeBonus,
 BLOOD_PACT_COST,BLOOD_PACT_COOLDOWN_ROUNDS
} from './tacticalExclusiveBosses.js';

const EMPTY={specialIndices:[],numericIndices:[]};
function make({boss=9,bossShield=60,bossMax=60,enemyShield=60,numericDeckA=null}={}){
 const d=createTacticalDuel({shipA:'C01',shipB:'C02',levelA:1,levelB:1,
  bossPlanetB:boss,...(numericDeckA?{bossNumericDeckA:numericDeckA}:{})});
 d.sides.B.defense.shield.max=bossMax;
 d.sides.B.defense.shield.hp=bossShield;
 d.sides.A.defense.shield.hp=enemyShield;
 return d;
}
function play(duel,orderA=EMPTY,orderB=EMPTY,at=100){
 const a=sealTacticalOrder(duel,'A',orderA,at);
 assert.equal(a.ok,true,a.reason);
 const b=sealTacticalOrder(a.battle,'B',orderB,at+1);
 assert.equal(b.ok,true,b.reason);
 return advanceTacticalDuel(b.battle,at+1);
}
function next(duel){return advanceTacticalDuel(duel,duel.resolveUntilMs);}
function bGun(b){return b.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='B');}
function putRealSpecialInHand(side,type,slot=0){
 const {hand,deck}=side.special;
 if(hand[slot].type===type)return slot;
 const old=hand.findIndex(c=>c.type===type);
 if(old>=0){[hand[old],hand[slot]]=[hand[slot],hand[old]];return slot;}
 const pos=deck.findIndex(c=>c.type===type);
 assert.ok(pos>=0,'Carta richiesta non esistente nel mazzo autentico: '+type);
 [hand[slot],deck[pos]]=[deck[pos],hand[slot]];
 return slot;
}
function costInSnapshot(b){
 const {before,prepared}=b.history.at(-1).snapshots;
 return before.B.defense.shield.hp-prepared.B.defense.shield.hp;
}

test('Patto di sangue: al primo ciclo si pagano 4 HP REALI e +8% al fuoco nativo',()=>{
 const original=make(),plain=make({boss:null});
 const base=nativeBarrierPacket(original.sides.B);
 assert.ok(base>0);
 const withPact=play(original),normal=play(plain);
 assert.equal(costInSnapshot(withPact),BLOOD_PACT_COST);
 assert.equal(costInSnapshot(normal),0);
 assert.equal(withPact.history[0].snapshots.prepared.B.defense.shield.hp,56);
 assert.equal(withPact.sides.B.defense.shield.hp,normal.sides.B.defense.shield.hp-4);
 assert.equal(withPact.sides.B.bossExclusive.bloodPactLastRound,1);
 assert.equal(withPact.sides.B.bossExclusive.bloodPactArmedRound,1);
 assert.equal(bGun(withPact).packet-bGun(normal).packet,
  Math.min(Math.floor(base*.45),Math.ceil(base*.08-1e-9)));
 assert.ok(withPact.lastEvents.some(s=>s.includes('Patto di sangue: -4 HP reali')));
 assert.ok(withPact.lastEvents.some(s=>s.includes('Patto di sangue +8%')));
 assert.deepEqual(withPact.sides.B.defense.parts,normal.sides.B.defense.parts);
 assert.deepEqual(withPact.sides.B.numeric,normal.sides.B.numeric);
 assert.deepEqual(withPact.sides.B.special,normal.sides.B.special);
 assert.equal(withPact.sides.B.sync,normal.sides.B.sync);
});

test('Patto: il prezzo resta pagato se il bersaglio non ha scudo, senza danno gratuito',()=>{
 const duel=make({enemyShield:0});
 const result=play(duel);
 assert.equal(bGun(result).damage,0);
 assert.equal(costInSnapshot(result),4);
 assert.ok(result.lastEvents.some(x=>x.includes('costo 4 HP già pagato anche se il colpo fallisce')));
 assert.equal(result.sides.B.bossExclusive.bloodPactLastRound,1);
 assert.equal(result.sides.A.defense.shield.hp,0);
});

test('Patto: 12 HP esatti non bastano; da 13 HP paga 4 e il generatore deve essere vivo',()=>{
 const atTwelve=play(make({bossShield:12}));
 assert.equal(costInSnapshot(atTwelve),0);
 assert.equal(atTwelve.sides.B.bossExclusive.bloodPactLastRound,undefined);
 const thirteen=play(make({bossShield:13}));
 assert.equal(costInSnapshot(thirteen),4);
 assert.equal(thirteen.history[0].snapshots.prepared.B.defense.shield.hp,9);
 const disabled=make();
 disabled.sides.B.defense.parts.shieldGenerator.hp=0;
 const offline=play(disabled);
 assert.equal(costInSnapshot(offline),0);
 assert.equal(offline.sides.B.bossExclusive.bloodPactLastRound,undefined);
 assert.equal(offline.lastEvents.some(x=>x.includes('Patto di sangue')),false);
});

test('Patto: cooldown esattamente tre cicli, con spesa nei cicli 1 e 4',()=>{
 assert.equal(BLOOD_PACT_COOLDOWN_ROUNDS,3);
 let b=make({bossShield:300,bossMax:300});
 for(let round=1;round<=5;round++){
  const result=play(b,EMPTY,EMPTY,100+(round-1)*8300);
  const expected=[4,0,0,4,0][round-1];
  assert.equal(costInSnapshot(result),expected,'Costo ciclo '+round);
  assert.equal(result.sides.B.bossExclusive.bloodPactLastRound,
   round>=4?4:1,'Ultima attivazione ciclo '+round);
  const armed=exclusiveBloodPactNativeBonus(result.sides.B,
   nativeBarrierPacket(result.sides.B),round);
  assert.equal(armed.active,expected>0);
  if(round<5)b=next(result);
 }
});

test('Patto: la riparazione contemporanea non evita il costo né sblocca un Patto non disponibile',()=>{
 const yes=make({bossShield:13});
 putRealSpecialInHand(yes.sides.B,'support-shield-repair');
 const a=play(yes,EMPTY,{specialIndices:[0],numericIndices:[]});
 assert.equal(a.history[0].snapshots.before.B.defense.shield.hp,13);
 assert.equal(a.history[0].snapshots.prepared.B.defense.shield.hp,29);
 assert.ok(a.lastEvents.some(x=>x.includes('barriera riparata +20')));
 assert.ok(a.lastEvents.findIndex(x=>x.includes('Patto di sangue:'))<
  a.lastEvents.findIndex(x=>x.includes('barriera riparata +20')));
 assert.equal(a.sides.B.special.discard.some(c=>c.type==='support-shield-repair'),true);
 const no=make({bossShield:12});
 putRealSpecialInHand(no.sides.B,'support-shield-repair');
 const b=play(no,EMPTY,{specialIndices:[0],numericIndices:[]});
 assert.equal(b.history[0].snapshots.before.B.defense.shield.hp,12);
 assert.equal(b.history[0].snapshots.prepared.B.defense.shield.hp,32);
 assert.equal(b.sides.B.bossExclusive.bloodPactLastRound,undefined);
});

test('Patto: potenza subordinata al cap totale +45% anche quando due speciali consumate lo saturano',()=>{
 const boss=make(),normal=make({boss:null});
 for(const d of [boss,normal]){
  putRealSpecialInHand(d.sides.B,'tactic-power-shift',0);
  putRealSpecialInHand(d.sides.B,'tactic-kinetic',1);
 }
 const base=nativeBarrierPacket(boss.sides.B);
 const order={numericIndices:[],specialIndices:[0,1]};
 const a=play(boss,EMPTY,order),b=play(normal,EMPTY,order);
 assert.equal(bGun(a).packet,bGun(b).packet);
 assert.ok(bGun(a).packet<=base+Math.floor(base*.45));
 assert.equal(costInSnapshot(a),4);
 assert.ok(a.lastEvents.some(x=>x.includes('bonus applicato 0 HP')));
 assert.equal(a.sides.B.special.discard.filter(c=>['tactic-kinetic','tactic-power-shift'].includes(c.type)).length,2);
});

test('Patto: le passive numeriche Ombre sono distinte e restano equipaggiate al giocatore',()=>{
 const deck={id:'planet_char_9',level:6};
 const boss=make({numericDeckA:deck}),normal=make({boss:null,numericDeckA:deck});
 assert.equal(boss.sides.B.bossExclusive.id,9);
 assert.equal(boss.sides.A.bossNumericDeck.id,'planet_char_9');
 assert.equal(boss.sides.B.bossNumericDeck??null,null);
 const a=play(boss),b=play(normal);
 assert.deepEqual(a.sides.A.bossNumericDeck,b.sides.A.bossNumericDeck);
 assert.deepEqual(a.sides.A.numeric,b.sides.A.numeric);
 assert.equal(a.history[0].snapshots.prepared.B.defense.parts.command.hp,10);
 assert.equal(bGun(a).packet>bGun(b).packet,true);
});

test('Patto: helper rifiuta armi assenti, nemici comuni, round non validi e non genera vita',()=>{
 const ordinary=make({boss:null}).sides.B;
 assert.equal(prepareExclusiveBloodPact(ordinary,1,15).armed,false);
 const side=make().sides.B;
 const before=structuredClone(side);
 assert.equal(prepareExclusiveBloodPact(side,1,0).reason,'no_native_guns');
 assert.equal(prepareExclusiveBloodPact(side,-1,15).reason,'invalid_round');
 assert.deepEqual(side,before);
 assert.equal(exclusiveBloodPactNativeBonus(side,15,1).active,false);
 const paid=prepareExclusiveBloodPact(side,1,15);
 assert.equal(paid.paid,4);
 assert.equal(side.defense.shield.hp,56);
 assert.equal(prepareExclusiveBloodPact(side,1,15).reason,'cooldown');
 assert.equal(side.defense.shield.hp,56);
 assert.equal(exclusiveBloodPactNativeBonus(side,15,1).extra,2);
 assert.equal(exclusiveBloodPactNativeBonus(side,15,2).active,false);
 assert.deepEqual(side.defense.parts,before.defense.parts);
 assert.equal(createExclusiveBossState(11)?.id,11);
});
