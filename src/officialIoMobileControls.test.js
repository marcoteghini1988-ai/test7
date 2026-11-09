// Collaudo dei comandi veri raggiunti dalla plancia 9:16.
// Non finge tocchi o screenshot Android: controlla che i suggerimenti
// siano compatibili con ordini reali, scadenza, mazzo autentico e motore.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createTacticalDuel,TACTICAL_STARTER_TYPES,TACTICAL_TIMING,
 validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel
} from './simultaneousDuelEngine.js';
import {officialBossThreatReadout,officialIoAvailableDefenses}
 from './officialBossThreatReadout.js';

function fixture(){
 const specialDeckA=[...TACTICAL_STARTER_TYPES];
 specialDeckA[0]='tactical-cover'; // 24 copie reali, nessuna copia oltre limite
 const battle=createTacticalDuel({shipA:'C03',levelA:5,
  shipB:'L03',levelB:5,bossPlanetB:19,specialDeckA,
  nowMs:100,seed:171});
 battle.round=2; // il ciclo pubblico della Eruzione; la preparazione non e' stata alterata
 battle.sides.A.defense.shield.hp=30;
 return battle;
}
function handIncludesActualCard(side,type,slot=0){
 const pile=side.special, hand=pile.hand,deck=pile.deck;
 const inHand=hand.findIndex((c,i)=>i>=slot&&c.type===type);
 if(inHand>=0){
  [hand[slot],hand[inHand]]=[hand[inHand],hand[slot]];
 }else{
  const inDeck=deck.findIndex(c=>c.type===type);
  assert.ok(inDeck>=0,'Tipo '+type+' deve gia esistere nel mazzo autentico');
  [hand[slot],deck[inDeck]]=[deck[inDeck],hand[slot]];
 }
 assert.equal(hand[slot].type,type);
 const all=[...pile.hand,...pile.deck,...pile.discard].map(c=>c.id);
 assert.equal(all.length,24);
 assert.equal(new Set(all).size,24);
}
const orderFor=slot=>({
 specialIndices:slot==null?[]:[slot],numericIndices:[],
 exchangeIndices:[],counterVitalId:'engine'
});
function resolve(battle,aOrder,bOrder=orderFor(null)){
 const time=101;
 const aa=sealTacticalOrder(battle,'A',aOrder,time);
 assert.equal(aa.ok,true,aa.reason);
 const bb=sealTacticalOrder(aa.battle,'B',bOrder,time+1);
 assert.equal(bb.ok,true,bb.reason);
 return advanceTacticalDuel(bb.battle,time+1);
}
const enemyGun=resolved=>resolved.history.at(-1).impacts.find(i=>i.kind==='barrier'&&i.by==='B');

test('Carta difensiva letta nel HUD = carta reale giocabile nel countdown 30+8',()=>{
 for(const [type,label] of [
  ['tactic-reactive','Paratia'],['tactic-impact','Schermo'],
  ['support-shield-repair','Riparazione'],['tactical-cover','Copertura']
 ]){
  const battle=fixture();
  handIncludesActualCard(battle.sides.A,type);
  const read=officialBossThreatReadout(battle);
  assert.equal(read.phase,'eruzione');
  assert.ok(read.detail.includes(label),label);
  const order=orderFor(0);
  assert.equal(validateTacticalOrder(battle,'A',order).ok,true,type);
  const beforeShield=battle.sides.A.defense.shield.hp;
  const result=resolve(battle,order);
  assert.equal(result.phase,'resolving');
  assert.ok(result.sides.A.special.discard.some(c=>c.type===type),
   'La carta '+type+' viene consumata dal mazzo vero');
  const all=result.sides.A.special;
  assert.equal(all.hand.length+all.deck.length+all.discard.length,24);
  assert.equal(new Set([...all.hand,...all.deck,...all.discard].map(c=>c.id)).size,24);
  if(type==='support-shield-repair'){
   assert.ok(result.lastEvents.some(e=>e.includes('barriera riparata +20')));
   assert.ok(beforeShield<result.sides.A.defense.shield.max);
  }
  if(type==='tactic-reactive'||type==='tactic-impact')
   assert.ok(enemyGun(result).guardAbsorbed>0,'Carta difensiva assorbe davvero HP');
  if(type==='tactical-cover')
   assert.ok(result.sides.A.escorts[0].hp<result.sides.A.escorts[0].max,
    'La scudiera fisica assorbe il danno durante la copertura');
 }
});
test('Nessun suggerimento Riparazione con scudo pieno o generatore KO',()=>{
 for(const fail of ['full','generator']){
  const battle=fixture();
  handIncludesActualCard(battle.sides.A,'support-shield-repair');
  if(fail==='full')battle.sides.A.defense.shield.hp=battle.sides.A.defense.shield.max;
  else battle.sides.A.defense.parts.shieldGenerator.hp=0;
  assert.ok(!officialIoAvailableDefenses(battle.sides.A).includes('Riparazione'));
  assert.equal(validateTacticalOrder(battle,'A',orderFor(0)).reason,'repair_unavailable');
 }
});
test('Nessuna Copertura consigliata se la flotta non ha scudiere operative',()=>{
 const battle=fixture();
 handIncludesActualCard(battle.sides.A,'tactical-cover');
 for(const escort of battle.sides.A.escorts)escort.hp=0;
 assert.ok(!officialIoAvailableDefenses(battle.sides.A).includes('Copertura'));
 assert.equal(validateTacticalOrder(battle,'A',orderFor(0)).reason,'cover_unavailable');
});
test('Contromisura reale non promette di ridurre le armi native di Io',()=>{
 const game=fixture();
 handIncludesActualCard(game.sides.A,'tactic-counter');
 const withCounter=resolve(structuredClone(game),orderFor(0));
 const withoutCounter=resolve(structuredClone(game),orderFor(null));
 assert.equal(enemyGun(withCounter).damage,enemyGun(withoutCounter).damage);
 assert.equal(enemyGun(withCounter).packet,enemyGun(withoutCounter).packet);
 assert.ok(!officialBossThreatReadout(game).detail.includes('Contromisura'));
 assert.ok(withCounter.sides.A.special.discard.some(c=>c.type==='tactic-counter'));
});
test('Carta speciale dopo PRONTO oppure oltre 30 secondi: nessun ordine duplicato',()=>{
 const battle=fixture();
 handIncludesActualCard(battle.sides.A,'tactic-reactive');
 const order=orderFor(0);
 assert.equal(validateTacticalOrder(battle,'A',order).ok,true);
 assert.equal(sealTacticalOrder(battle,'A',order,100+TACTICAL_TIMING.prepareMs).reason,
  'preparation_expired');
 const ready=sealTacticalOrder(battle,'A',order,101);
 assert.equal(ready.ok,true);
 assert.equal(validateTacticalOrder(ready.battle,'A',order).reason,'already_committed');
 assert.equal(ready.battle.sides.A.special.hand.length+ready.battle.sides.A.special.deck.length,24);
});
