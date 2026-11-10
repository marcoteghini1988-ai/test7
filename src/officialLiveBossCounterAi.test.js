import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,TACTICAL_STARTER_TYPES} from './simultaneousDuelEngine.js';
import {createOfficialLiveDuel,chooseOfficialLiveAiAction,
 applyOfficialLiveAction,finishOfficialLiveTurn} from './officialLiveDuelEngine.js';
import {exposeMotherPart} from './vitalDefense.js';

function setup(bossId=1){
 const b=createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'C01',levelA:1,levelB:1,
  bossPlanetB:bossId,nowMs:0,mode:bossId?'campaign':'pvp',
  specialDeckB:[...TACTICAL_STARTER_TYPES]
 }),0);
 b.turn=2;b.round=1;b.activeSide='B';
 b.sides.B.defense.shield.hp=30;
 let result=exposeMotherPart(b.sides.B.defense,'engine');
 assert.equal(result.exposed,true);b.sides.B.defense=result.defense;
 result=exposeMotherPart(b.sides.B.defense,'weapons');
 assert.equal(result.exposed,true);b.sides.B.defense=result.defense;
 b.sides.B.defense.parts.weapons.signature={
  kind:'mathGate',op:'plus',target:8,allowedCardCounts:[2]};
 const pile=b.sides.A.numeric;
 const index=pile.hand.findIndex(c=>c.value===3&&c.suit==='♣');
 assert.ok(index>=0);
 const [stored]=pile.hand.splice(index,1);
 b.vitalBuilds.A.weapons=[stored];
 return b;
}
function handCounter(b,withCounter=true){
 const pile=b.sides.B.special,all=[...pile.hand,...pile.deck,...pile.discard];
 const counter=all.find(c=>c.type==='tactic-counter');
 assert.ok(counter);
 const chosen=withCounter?
  [counter,...all.filter(c=>c.id!==counter.id&&c.type!=='tactic-counter').slice(0,4)]:
  all.filter(c=>c.type!=='tactic-counter').slice(0,5);
 const ids=new Set(chosen.map(c=>c.id));
 pile.hand=chosen;pile.deck=all.filter(c=>!ids.has(c.id));pile.discard=[];
 assert.equal(pile.hand.length+pile.deck.length,24);
 assert.equal(new Set([...pile.hand,...pile.deck].map(c=>c.id)).size,24);
}
test('Gaia boss: vera Contromisura difende il vitale con numeriche già depositate, non il primo esposto',()=>{
 let b=setup(1);handCounter(b);
 const planned=chooseOfficialLiveAiAction(b);
 assert.equal(planned.type,'special');
 assert.equal(b.sides.B.special.hand[planned.index].type,'tactic-counter');
 assert.equal(planned.slot,'trap-0');
 assert.equal(planned.vitalId,'weapons','l attacco esistente è sul sistema armi, non sul motore');
 const placed=applyOfficialLiveAction(b,'B',planned,1);
 assert.equal(placed.ok,true,placed.reason);b=placed.battle;
 assert.equal(b.actionUsed.special,1);
 assert.equal(b.actionUsed.numeric,0);
 assert.equal(b.zones.B.traps[0].type,'tactic-counter');
 assert.equal(b.zones.B.traps[0].target,'weapons');
 b=finishOfficialLiveTurn(b,2);
 assert.equal(b.activeSide,'A');
 const partner=b.sides.A.numeric.hand.findIndex(c=>c.value===5&&c.suit==='♥');
 assert.ok(partner>=0);
 const attack=applyOfficialLiveAction(b,'A',
  {type:'numeric',index:partner,target:'vital',vitalId:'weapons'},3);
 assert.equal(attack.ok,true,attack.reason);b=attack.battle;
 assert.equal(b.sides.B.defense.parts.weapons.hp,10);
 assert.equal(b.sides.B.defense.shield.hp,30);
 assert.equal(b.vitalBuilds.A.weapons.length,0);
 assert.equal(b.zones.B.traps[0],null);
 assert.ok(b.history.some(e=>e.kind==='counter'));
 assert.equal(b.sides.A.numeric.hand.length,6,'la carta numerica reale è stata consumata');
});
test('La Contromisura non nasce dal nulla: se non è nel mazzo in mano, nessuna risposta gratuita',()=>{
 const b=setup(1);handCounter(b,false);
 const planned=chooseOfficialLiveAiAction(b);
 if(planned.type==='special')
  assert.notEqual(b.sides.B.special.hand[planned.index].type,'tactic-counter',
   'un altro speciale non equivale a una Contromisura gratuita');
 assert.equal(b.zones.B.traps.every(x=>x===null),true);
});
test('L IA del PvP locale senza identità boss non riceve la difesa esclusiva',()=>{
 const b=setup(null);handCounter(b);
 const planned=chooseOfficialLiveAiAction(b);
 assert.notDeepEqual({type:planned.type,vitalId:planned.vitalId},
  {type:'special',vitalId:'weapons'});
 assert.equal(b.sides.B.bossPlanetId,null);
});
