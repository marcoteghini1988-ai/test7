import test from 'node:test';
import assert from 'node:assert/strict';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalBossDeckReady,tacticalMagmaNativeBonus,rememberTacticalMagmaBarrierHit,
 tacticalMagmaVitalBonus,rememberTacticalMagmaVitalHit} from './tacticalBossDecks.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket}
 from './simultaneousDuelEngine.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const EMPTY={specialIndices:[],numericIndices:[]};
const fresh=(level=9)=>createTacticalDuel({shipA:'C01',levelA:5,shipB:'C02',levelB:1,
 bossNumericDeckA:level?{id:'planet_char_19',level}:null});
function combat(d,orderA=EMPTY,at=100){
 const a=sealTacticalOrder(d,'A',orderA,at);
 assert.equal(a.ok,true,a.reason);
 const b=sealTacticalOrder(a.battle,'B',EMPTY,at+1);
 assert.equal(b.ok,true,b.reason);
 return advanceTacticalDuel(b.battle,at+1);
}
const next=d=>advanceTacticalDuel(d,d.resolveUntilMs);
function realSpecial(side,type,slot=0){
 const pile=side.special;
 if(pile.hand[slot].type===type)return;
 const i=pile.hand.findIndex(c=>c.type===type);
 if(i>=0){[pile.hand[i],pile.hand[slot]]=[pile.hand[slot],pile.hand[i]];return;}
 const j=pile.deck.findIndex(c=>c.type===type);
 assert.ok(j>=0,'Carta inesistente nel mazzo: '+type);
 [pile.hand[slot],pile.deck[j]]=[pile.deck[j],pile.hand[slot]];
}
const corrosionDeck=[...Array(6).fill('shot-corrosion'),...Array(6).fill('tactic-scan'),
 ...Array(6).fill('tactic-reactive'),...Array(6).fill('tactic-impact')];

test('Mazzo Magmatico: disponibile SOLO se veramente sbloccato; tutti i 9 livelli mantengono tre gradi',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_19'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_19',bossDeckInventory:{}}).enabled,false);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_19',
  bossDeckInventory:{planet_char_19:{unlocked:true,level:9}}}).enabled,true);
 for(let level=1;level<=9;level++){
  const s=fresh(level).sides.A.bossNumericDeck;
  assert.equal(s.id,'planet_char_19');
  assert.equal(s.level,level);
  assert.equal(s.magmaShieldHits,0);
  const abilities=activeNumericBossAbilities(s.id,s.level);
  assert.deepEqual(abilities.map(a=>a.value),[
   [6,null,null],[9,null,null],[12,null,null],
   [12,3,null],[12,5,null],[12,7,null],
   [12,7,4],[12,7,6],[12,7,8]
  ][level-1]);
 }
});

test('Risonanza termica: terzo danno reale alla barriera, non terza carta o terzo tentativo',()=>{
 const one=fresh(9).sides.A;
 const base=nativeBarrierPacket(one);
 assert.ok(base>0);
 let a=tacticalMagmaNativeBonus(one,[],base);
 assert.equal(a.active,false);
 rememberTacticalMagmaBarrierHit(one,0,a);
 assert.equal(one.bossNumericDeck.magmaShieldHits,0);
 rememberTacticalMagmaBarrierHit(one,7,a);
 rememberTacticalMagmaBarrierHit(one,7,a);
 assert.equal(one.bossNumericDeck.magmaShieldHits,2);
 a=tacticalMagmaNativeBonus(one,[],base);
 assert.equal(a.active,true);
 assert.equal(a.percentage,12);
 assert.equal(a.abilities[0],'Risonanza termica');
 rememberTacticalMagmaBarrierHit(one,0,a);
 assert.equal(one.bossNumericDeck.magmaShieldHits,2);
 rememberTacticalMagmaBarrierHit(one,7,a);
 assert.equal(one.bossNumericDeck.magmaShieldHits,3);
 assert.equal(tacticalMagmaNativeBonus(one,[],base).active,false);
});

test('Corrosione ardente: vera carta giocata, solo dal livello 4, nessun doppio attacco',()=>{
 const base=nativeBarrierPacket(fresh().sides.A);
 for(const level of [3,4,5,6,9]){
  const s=fresh(level).sides.A;
  const a=tacticalMagmaNativeBonus(s,['shot-corrosion'],base);
  assert.equal(a.active,level>=4);
  if(level>=4)assert.equal(a.percentage,[0,3,5,7,7][[3,4,5,6,9].indexOf(level)]);
 }
 const d=fresh(6);
 d.sides.B.defense.shield.hp=50;
 d.sides.B.defense.shield.max=150;
 const source=createTacticalDuel({shipA:'C01',levelA:5,shipB:'C02',
  specialDeckA:corrosionDeck,bossNumericDeckA:{id:'planet_char_19',level:6}});
 source.sides.B.defense.shield.max=300;source.sides.B.defense.shield.hp=300;
 realSpecial(source.sides.A,'shot-corrosion',0);
 const result=combat(source,{specialIndices:[0]});
 assert.ok(result.lastEvents.some(e=>e.includes('Corrosione ardente')));
 assert.ok(result.sides.A.special.discard.some(c=>c.type==='shot-corrosion'));
 assert.equal(result.history[0].impacts.filter(i=>i.kind==='barrier'&&i.by==='A').length,1);
 const normal=combat(fresh(6));
 assert.ok(!normal.lastEvents.some(e=>e.includes('Corrosione ardente')));
});

test('Forgia moltiplicatrice: richiede firma times valida su vitale realmente esposto, L7–L9',()=>{
 const d=fresh(9);
 d.sides.B.defense.shield.hp=40;
 const hit={numericIndices:[0,1],vitalId:'shieldGenerator',op:'times'};
 const miss={numericIndices:[0,1],vitalId:'shieldGenerator',op:'minus'};
 const defender=d.sides.B;
 defender.defense.parts.shieldGenerator.exposed=true;
 assert.equal(tacticalMagmaVitalBonus(d.sides.A,miss,defender,10).active,false);
 const bonus=tacticalMagmaVitalBonus(d.sides.A,hit,defender,10);
 assert.equal(bonus.active,true);
 assert.equal(bonus.percentage,8);
 assert.equal(bonus.extra,0);
 assert.equal(bonus.remainder,80);
 rememberTacticalMagmaVitalHit(d.sides.A,0,bonus);
 assert.equal(d.sides.A.bossNumericDeck.magmaVitalRemainder,0);
 rememberTacticalMagmaVitalHit(d.sides.A,7,bonus);
 assert.equal(d.sides.A.bossNumericDeck.magmaVitalRemainder,80);
 const carry=tacticalMagmaVitalBonus(d.sides.A,hit,defender,10);
 assert.equal(carry.extra,1);
 assert.equal(carry.remainder,60);
 // No damage if the signature is wrong, even if the passive is enabled.
 const real=fresh(9);
 real.sides.B.defense.shield.hp=40;
 const attacked=combat(real,hit);
 assert.ok(attacked.history[0].impacts.some(i=>i.kind==='precision'&&i.by==='A'&&i.damage>0));
 assert.ok(attacked.lastEvents.some(e=>e.includes('Forgia moltiplicatrice')));
});

test('Magma numeric L9: three distinct passives cannot accidentally grant the exclusive enemy magma cycle',()=>{
 const b=fresh(9);
 assert.equal(b.sides.A.bossExclusive,null);
 assert.equal(b.sides.A.bossNumericDeck.id,'planet_char_19');
 assert.equal(b.sides.B.bossExclusive,null);
 const r=combat(b);
 assert.equal(r.lastEvents.some(e=>e.includes('fase ERUZIONE')),false);
 assert.equal(r.lastEvents.some(e=>e.includes('Rigenerazione +4 HP')),false);
});
