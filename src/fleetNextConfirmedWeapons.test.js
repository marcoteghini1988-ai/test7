import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIRMED_WEAPON_CARDS,card,cardRole} from './fleetNext/rules.js';
import {describeEffect,validateEffectSpec} from './fleetNext/simpleEffects.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {canSelectNewGeneric,NEXT_COMMON_AVAILABLE} from './fleetNext/nextDeckLoadout.js';
const [BALESTRA,DARDIERA,NUCLEO,MAGLIO,SLITTA]=CONFIRMED_WEAPON_CARDS;
function make(){
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:23919,nowMs:0});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
  side.ships[0].hp=5000;side.ships[0].maxHp=5000;}
 return b;
}
function play(b,who,cards=[]){
 b.sides[who].hand=[...cards];
 const r=resolveFleetNextTurn(b,who,{pass:true,cards:cards.map((_,i)=>i)},b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);return r;
}
const shots=r=>r.events.filter(e=>e.kind==='weapon-cryo-shot');
test('Cinque Armi approvate, con ID, effetti, rarità e danni documentati',()=>{
 assert.equal(CONFIRMED_WEAPON_CARDS.length,5);
 assert.deepEqual(CONFIRMED_WEAPON_CARDS.map(c=>c.effectSpec.baseDamage),[15,12,28,30,24]);
 for(const c of CONFIRMED_WEAPON_CARDS){
  assert.equal(card(c.id),c);assert.equal(cardRole(c.id),'support');
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(describeEffect(c),c.effectProposed);
  assert.ok(canSelectNewGeneric(c.id));assert.ok(NEXT_COMMON_AVAILABLE.includes(c));
  assert.equal(c.acquisitionPending,false);assert.equal(c.balancePending,true);
 }
});
test('Dardi Ghiaccio: entrambi gli ordini innescano un solo cristallo, 39 HP nominali',()=>{
 for(const pair of [[BALESTRA,DARDIERA],[DARDIERA,BALESTRA]]){
  const r=play(make(),'A',pair.map(c=>c.id)),e=shots(r);
  assert.equal(e.length,2);
  assert.equal(e.filter(x=>x.comboTriggered).length,1);
  assert.equal(e.reduce((n,x)=>n+x.nominalDamage+x.comboNominalDamage,0),39);
  assert.equal(r.battle.sides.B.cryoCrystal,null);
  assert.equal(r.battle.sides.A.machines.length,0);
  assert.ok(r.battle.sides.A.discard.includes(BALESTRA.id));
  assert.ok(r.battle.sides.A.discard.includes(DARDIERA.id));
  assert.ok(r.battle.sides.B.ships[0].hp<5000);
 }
});
test('Cristallo attivo al turno successivo del proprietario, poi scade',()=>{
 let b=play(make(),'A',[BALESTRA.id]).battle;
 assert.equal(b.sides.B.cryoCrystal?.polarity,'positive');
 b=play(b,'B').battle;
 const r=play(b,'A',[DARDIERA.id]);
 assert.equal(shots(r)[0].comboTriggered,true);
 assert.equal(r.battle.sides.B.cryoCrystal,null);
 b=play(make(),'A',[BALESTRA.id]).battle;
 b=play(b,'B').battle;
 b=play(b,'A').battle;
 assert.equal(b.sides.B.cryoCrystal,null);
 b=play(b,'B').battle;
 assert.equal(shots(play(b,'A',[DARDIERA.id]))[0].comboTriggered,false);
});
test('La Difesa blocca un dardo e impedisce la reazione gratis',()=>{
 const b=make();b.sides.B.protections=[{source:'test',id:'gen-217',kind:'protect',
  target:'part',partId:'weapons',remaining:1,untilPly:100,placedPly:-2}];
 const r=play(b,'A',[BALESTRA.id,DARDIERA.id]);
 assert.equal(shots(r).filter(x=>x.comboTriggered).length,0);
});
test('Armi base Fuoco e Metallo infliggono HP reali',()=>{
 for(const c of [NUCLEO,MAGLIO,SLITTA]){
  const r=play(make(),'A',[c.id]);
  const e=r.events.find(x=>x.kind==='weapon-base-shot'&&x.cardId===c.id);
  assert.ok(e,c.id);assert.equal(e.nominalDamage,c.effectSpec.baseDamage);
  assert.ok(e.actualDamage>0,c.id);
 }
});
