import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIRMED_TRANSFER_WEAPONS,card,cardRole} from './fleetNext/rules.js';
import {validateEffectSpec} from './fleetNext/simpleEffects.js';
import {NEXT_COMMON_AVAILABLE,canSelectNewGeneric,buyNextCommonCard,buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

const [SIRIO,WIND]=CONFIRMED_TRANSFER_WEAPONS;
function make(){
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,
  deckA:[],deckB:[],seed:20261121,nowMs:0});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
 }
 return b;
}
function play(b,who,ids=[],more={}){
 assert.equal(b.turn,who);
 b.sides[who].hand=[...ids];
 const r=resolveFleetNextTurn(b,who,{pass:true,cards:ids.map((_,i)=>i),...more},
  b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
test('Trasferimenti Ghiaccio -> Terra e Vento registrati senza doppioni',()=>{
 assert.equal(CONFIRMED_TRANSFER_WEAPONS.length,2);
 assert.equal(SIRIO.elementId,'mineral');assert.equal(WIND.elementId,'aerial');
 assert.equal(SIRIO.rarita,'Comune');assert.equal(SIRIO.effectSpec.weaponProfile.baseDamage,10);
 assert.equal(WIND.playable,true);assert.equal(WIND.designOnly,false);assert.equal(WIND.provisionalBalance,true);
 for(const c of CONFIRMED_TRANSFER_WEAPONS){
  assert.equal(card(c.id),c);assert.equal(cardRole(c.id),'support');
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.ok(NEXT_COMMON_AVAILABLE.includes(c));
 }
 assert.equal(canSelectNewGeneric(SIRIO.id),true);
 assert.equal(canSelectNewGeneric(WIND.id),true);
 const inv=createFleetInventory();
 assert.equal(buyNextCommonCard({...inv,credits:10000},SIRIO.id).ok,true);
 assert.equal(buyNextCommonCard({...inv,credits:10000},WIND.id).ok,true);
 inv.owned[SIRIO.id]=1;inv.owned[WIND.id]=1;
 const deck=buildNextBaseDeck(normalizeFleetInventory(inv),'C01',20,[SIRIO.id,WIND.id]);
 assert.deepEqual(deck.baseDeck,[SIRIO.id,WIND.id]);
});
test('Sputacristalli: 10 HP e blocco dello slot con Torretta montata',()=>{
 let b=play(make(),'A').battle;
 b=play(b,'B',['weapon-confirmed-cryogenic-pistoni']).battle;
 const slot=b.sides.B.machines[0].slot;
 const ice=play(b,'A',[SIRIO.id]);
 const impact=ice.events.find(e=>e.kind==='weapon-designed-shot'&&e.cardId===SIRIO.id);
 assert.ok(impact);assert.equal(impact.impacts[0].nominalDamage,10);
 assert.ok(impact.actualDamage>0);
 const freeze=ice.events.find(e=>e.kind==='weapon-slot-frozen'&&e.cardId===SIRIO.id);
 assert.ok(freeze);assert.equal(freeze.machineSlot,slot);
 assert.equal(ice.battle.sides.B.weaponSlotLocks[slot],ice.battle.ply+1);
 const blocked=play(ice.battle,'B');
 assert.equal(blocked.events.some(e=>e.kind==='weapon-multi-shot'&&
  e.cardId==='weapon-confirmed-cryogenic-pistoni'),false);
});
test('Slot Arma vuoto congelato: un altro slot rimane usabile, ma non due',()=>{
 const b=play(make(),'A',[SIRIO.id]).battle;
 b.sides.B.hand=['weapon-base-ionic-01','weapon-base-ionic-02'];
 const invalid=validateFleetTurn(b,'B',{pass:true,cards:[0,1]});
 assert.match(invalid,/alloggiamenti|congelat/i);
 const deployed=play(b,'B',['weapon-base-ionic-01']);
 assert.equal(deployed.battle.sides.B.machines[0].slot,1);
});
test('Se il proiettile è annullato dalla Difesa, lo slot non congela',()=>{
 const b=make();
 b.sides.B.protections=[{source:'guard',id:'gen-217',kind:'protect',
  target:'part',partId:'weapons',remaining:1,untilPly:100,placedPly:-2}];
 const r=play(b,'A',[SIRIO.id]);
 assert.equal(r.events.some(e=>e.kind==='weapon-slot-frozen'),false);
 assert.equal(r.battle.sides.B.weaponSlotLocks?.[0]||0,0);
});
test('Perforatore Metallo mantiene la durata approvata di tre turni',()=>{
 const p=card('weapon-designed-metallic-perforatore-cascata');
 assert.equal(p.designOnly,false);
 assert.equal(p.playable,true);
 assert.equal(p.provisionalBalance,true);
 assert.equal(p.designNotes.durationTurns,3);
 assert.equal(p.designNotes.durationConflict,null);
});
