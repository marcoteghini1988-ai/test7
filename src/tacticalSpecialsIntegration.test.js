import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {TACTICAL_SPECIALS,TACTICAL_STARTER_TYPES,createTacticalDuel,validateTacticalOrder,
 sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const idle={specialIndices:[],numericIndices:[]};
function deck(types=[]){
 const d=[...TACTICAL_STARTER_TYPES];
 types.forEach((t,i)=>{d[i]=t;});
 return d;
}
function setup({a=[],b=[],levelA=5,levelB=5,shipA='C01',shipB='C01'}={}){
 return createTacticalDuel({shipA,shipB,levelA,levelB,specialDeckA:deck(a),specialDeckB:deck(b)});
}
function offer(game,side,type,index=0){
 const p=game.sides[side].special;
 const handAt=p.hand.findIndex(c=>c.type===type);
 if(handAt>=0){[p.hand[handAt],p.hand[index]]=[p.hand[index],p.hand[handAt]];return game;}
 const deckAt=p.deck.findIndex(c=>c.type===type);
 assert.ok(deckAt>=0,'Carta presente in mazzo: '+type);
 [p.hand[index],p.deck[deckAt]]=[p.deck[deckAt],p.hand[index]];
 return game;
}
function resolve(game,a=idle,b=idle,now=100){
 const sa=sealTacticalOrder(game,'A',a,now);
 assert.equal(sa.ok,true,sa.reason);
 const sb=sealTacticalOrder(sa.battle,'B',b,now+1);
 assert.equal(sb.ok,true,sb.reason);
 return advanceTacticalDuel(sb.battle,now+1);
}
function played(type){return {specialIndices:[0],numericIndices:[],counterVitalId:'engine'};}
const count=p=>p.hand.length+p.deck.length+p.discard.length;

test('Le undici speciali ufficiali hanno un vero tipo consumabile nel sandbox',()=>{
 const official=Object.keys(SPECIAL_CARD_CATALOG);
 assert.equal(official.length,27); // 11 ufficiali + 12 Personaggi Boss + 4 Terreni PvP
 for(const id of official){
  assert.ok(Object.hasOwn(TACTICAL_SPECIALS,id),id);
  const game=setup({a:[id]});
  offer(game,'A',id);
  assert.equal(game.sides.A.special.hand[0].type,id);
  assert.equal(count(game.sides.A.special),24);
 }
});
test('Tutte e quattro le fusioni costano 100 Sync reali e non partono senza scudiere',()=>{
 for(const type of ['fusion-barrier','fusion-strike','fusion-twin','fusion-triad']){
  const game=offer(setup({a:[type]}),'A',type);
  assert.equal(validateTacticalOrder(game,'A',played(type)).reason,'fusion_unavailable',type);
  game.sides.A.sync=100;
  const battle=resolve(game,played(type));
  assert.equal(battle.sides.A.sync,25,type);
  assert.equal(battle.sides.A.special.discard.some(c=>c.type===type),true,type);
  assert.equal(count(battle.sides.A.special),24);
  assert.ok(battle.lastEvents.some(e=>e.includes(TACTICAL_SPECIALS[type].name)),type);
 }
 for(const type of ['fusion-twin','fusion-triad']){
  const game=offer(setup({a:[type],levelA:3}),'A',type);
  game.sides.A.sync=100;
  assert.equal(validateTacticalOrder(game,'A',played(type)).reason,'fusion_unavailable');
 }
});
test('Le fusioni di Assalto e Trina potenziano solo la barriera mentre Gemellare usa le scudiere reali',()=>{
 const base=setup({a:['fusion-strike'],levelB:1});
 base.sides.A.sync=100;offer(base,'A','fusion-strike');
 const ordinary=resolve(structuredClone(base));
 const strike=resolve(base,played('fusion-strike'));
 assert.ok(strike.history[0].shieldA>ordinary.history[0].shieldA);
 const trio=setup({a:['fusion-triad'],levelB:1});
 trio.sides.A.sync=100;offer(trio,'A','fusion-triad');
 const trina=resolve(trio,played('fusion-triad'));
 const clean=resolve(setup({a:['fusion-triad'],levelB:1}));
 assert.ok(trina.history[0].shieldA>clean.history[0].shieldA);
 const defenders=setup({b:['fusion-twin'],shipA:'L03',levelB:5});
 defenders.sides.B.sync=100;offer(defenders,'B','fusion-twin');
 const normal=resolve(structuredClone(defenders));
 const merged=resolve(defenders,idle,played('fusion-twin'));
 assert.ok(merged.history[0].shieldA<=normal.history[0].shieldA);
 assert.ok(merged.sides.B.escorts.every(e=>e.hp<20),'entrambe le scudiere spendono HP');
});
test('Copertura e riparazione scudiera consumano HP reali e non rianimano scudiere',()=>{
 const cover=setup({b:['tactical-cover'],levelB:3,shipA:'L03'});
 offer(cover,'B','tactical-cover');
 const without=resolve(structuredClone(cover));
 const withCover=resolve(cover,idle,played('tactical-cover'));
 assert.ok(withCover.sides.B.escorts[0].hp<without.sides.B.escorts[0].hp);
 assert.ok(withCover.history[0].shieldA<=without.history[0].shieldA);
 const repair=setup({b:['support-escort-repair'],levelB:3});
 offer(repair,'B','support-escort-repair');
 repair.sides.B.escorts[0].hp=5;
 const healed=resolve(repair,idle,played('support-escort-repair'));
 assert.equal(healed.history[0].snapshots.prepared.B.escorts[0].hp,20);
 const ko=setup({b:['support-escort-repair'],levelB:3});
 offer(ko,'B','support-escort-repair');
 ko.sides.B.escorts[0].hp=0;
 assert.equal(validateTacticalOrder(ko,'B',played('support-escort-repair')).reason,'escort_repair_unavailable');
});
test('Pulizia rimuove status attivi, riparazione scudo non funziona col generatore KO',()=>{
 const purge=setup({b:['support-status-purge']});
 offer(purge,'B','support-status-purge');
 assert.equal(validateTacticalOrder(purge,'B',played('support-status-purge')).reason,'purge_unavailable');
 purge.sides.B.ionized=true;purge.sides.B.corroded=true;purge.sides.B.heated=true;
 const result=resolve(purge,idle,played('support-status-purge'));
 assert.equal(result.sides.B.ionized,false);
 assert.equal(result.sides.B.corroded,false);
 assert.equal(result.sides.B.heated,false);
 const heal=setup({b:['support-shield-repair']});
 offer(heal,'B','support-shield-repair');
 heal.sides.B.defense.parts.shieldGenerator.hp=0;
 heal.sides.B.defense.shield.hp=15;
 assert.equal(validateTacticalOrder(heal,'B',played('support-shield-repair')).reason,'repair_unavailable');
});
test('Corrosione richiede un colpo alla barriera e agisce solo sullo scontro seguente',()=>{
 const game=setup({a:['shot-corrosion'],levelB:1,shipA:'C01',shipB:'C01'});
 offer(game,'A','shot-corrosion');
 const first=resolve(game,played('shot-corrosion'));
 assert.equal(first.sides.B.corroded,true);
 const next=advanceTacticalDuel(first,8101);
 assert.equal(next.phase,'planning');
 const regular=structuredClone(next);
 regular.sides.B.corroded=false;
 // The timed engine stores a public combat-clock expiry as well as the flag.
 regular.sides.B.statusUntil.corroded=0;
 const corroded=resolve(next,idle,idle,8200);
 const uncorroded=resolve(regular,idle,idle,8200);
 assert.ok(corroded.history[1].shieldA>uncorroded.history[1].shieldA);
 assert.equal(corroded.sides.B.corroded,false);
});
test('Una scudiera L1 assente rende impossibili Copertura e tutte le fusioni',()=>{
 for(const type of ['tactical-cover','fusion-barrier','fusion-strike','fusion-twin','fusion-triad']){
  const game=setup({a:[type],levelA:1});
  offer(game,'A',type);
  game.sides.A.sync=100;
  const reason=validateTacticalOrder(game,'A',played(type)).reason;
  assert.equal(reason,type==='tactical-cover'?'cover_unavailable':'fusion_unavailable',type);
 }
});
