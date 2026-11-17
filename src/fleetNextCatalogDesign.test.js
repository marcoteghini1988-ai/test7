import test from 'node:test';
import assert from 'node:assert/strict';
import design from '../docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json' with {type:'json'};
import {EXCLUSIVE_CARDS} from './fleetNext/rules.js';

const ships=['N00','C01','C02','C03','R01','R02','R04','E01','E02','L01','L03','L04'];
const types=['Modulo utilità','Modulo d’arma','Attacco','Difesa','Trappola','Tattica','Personaggio','Fusione'];

test('Catalogo di sostituzione: 120 carte ragionate, dieci per madre',()=>{
 assert.equal(design.cards.length,120);
 assert.equal(new Set(design.cards.map(c=>c.id)).size,120);
 for(const shipId of ships){
  const cards=design.cards.filter(c=>c.shipId===shipId);
  assert.equal(cards.length,10,shipId);
  assert.equal(cards.filter(c=>c.minShipLevel===1).length,6,shipId);
  for(let level=2;level<=5;level++)
   assert.equal(cards.filter(c=>c.minShipLevel===level).length,1,shipId+' L'+level);
 }
 for(const c of design.cards){
  assert.ok(types.includes(c.type),c.id+' categoria non riconosciuta');
  assert.ok(c.name?.length>2,c.id+' senza nome');
  assert.ok(c.effectText?.length>15,c.id+' senza effetto');
  assert.ok(c.rules?.length>10,c.id+' senza chiarimento di utilizzo');
  assert.ok(c.counterplay?.length>10,c.id+' senza contromossa');
  assert.ok(c.visualBrief?.length>10,c.id+' senza direzione grafica');
  assert.match(c.state,/executable-in-combat-v1/,'Tutte le 120 carte devono essere state implementate');
 }
 assert.equal(design.cards.filter(c=>c.type==='Personaggio').length,12);
 assert.equal(design.cards.filter(c=>c.type==='Fusione').length,3);
});

test('I 12 Personaggi delle nuove esclusive riutilizzano le identità già esistenti',()=>{
 const existing=Object.values(EXCLUSIVE_CARDS).filter(c=>/Personaggio/i.test(c.category));
 const next=design.cards.filter(c=>c.type==='Personaggio');
 for(const character of next){
  const match=existing.find(c=>c.shipId===character.shipId&&c.name.toLocaleLowerCase('it')===character.name.toLocaleLowerCase('it'));
  assert.ok(match,character.id+' deve rimanere lo stesso Personaggio del catalogo esistente');
 }
});

test('Il catalogo in codice associa esattamente 10 esclusive a ciascuna delle 12 navicelle principali',()=>{
 const group=Object.groupBy(Object.values(EXCLUSIVE_CARDS),c=>c.shipId);
 for(const shipId of ships){
  const set=group[shipId]||[];
  assert.equal(set.length,10,shipId);
  assert.equal(set.filter(c=>c.kind==='character').length,1,shipId);
  assert.equal(set.filter(c=>c.playable===false).length,0,shipId);
  assert.equal(set.filter(c=>c.playable!==false).length,10,shipId);
  const levels=set.map(c=>c.minShipLevelDraft);
  assert.equal(levels.filter(n=>n===1).length,6,shipId+' sei definizioni L1');
  for(const level of [2,3,4,5])assert.equal(levels.filter(n=>n===level).length,1,shipId+' L'+level);
 }
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>!ships.includes(c.shipId)).length,5);
});

test('Tutte le carte esclusive sono eseguibili solo con la madre corretta e vengono pescate',async()=>{
 const {exclusiveUnlocked,effectiveDeck,cardFacePath,card,eligibleExclusives,STARTER_DECK,deckFromCounts}=await import('./fleetNext/rules.js');
 const {effectUnavailableReason,createFleetNextBattle}=await import('./fleetNext/combat.js');
 const sample=design.cards.find(c=>c.shipId==='L04'&&c.type==='Attacco');
 assert.ok(sample);
 const def=card(sample.id);
 assert.ok(def&&def.shipId===sample.shipId);
 assert.equal(def.effectProposed,sample.effectText);
 assert.notEqual(def.playable,false);
 assert.equal(cardFacePath(sample.id),null);
 assert.equal(exclusiveUnlocked(sample.id,'L03',5),false);
 const correct=eligibleExclusives(sample.shipId,5).some(c=>c.id===sample.id);
 assert.equal(correct,true);
 const deck=deckFromCounts(STARTER_DECK.carteGenerali);
 const ids=effectiveDeck(deck,sample.shipId,5);
 assert.equal(ids.includes(sample.id),true,'Ogni carta ora dispone di un effetto giocabile');
 const battle=createFleetNextBattle({shipA:sample.shipId,shipB:'C03',levelA:5,levelB:5,deckA:deck,deckB:deck});
 assert.equal(effectUnavailableReason(def,battle.sides.A,battle),'');
});
