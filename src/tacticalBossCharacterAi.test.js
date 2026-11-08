// La Carta Personaggio Boss resta una Carta SPECIALE: deve essere vinta,
// posseduta, equipaggiata e pescata. L'IA non riceve poteri automatici.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpecialCollection,equipSpecialDeck,validateSpecialDeck,readSpecialCollection}
 from './specialDeckBuilder.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';
import {bossCharacterActive,bossCharacterTypeForPlanet}
 from './bossCharacterCards.js';
import {createTacticalDuel,validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {planTacticalAi} from './tacticalDuelAi.js';

function storage(){
 const m=new Map();
 return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
}
function prepareDrawn(collection,type){
 const equipped=equipSpecialDeck(collection,[type,...collection.loadout.slice(1)]);
 const battle=createTacticalDuel({shipA:'C03',shipB:'R03',levelA:3,levelB:3,
  specialDeckA:equipped.loadout,nowMs:100,seed:171});
 const pile=battle.sides.A.special;
 let index=pile.hand.findIndex(c=>c.type===type);
 if(index<0){
  const k=pile.deck.findIndex(c=>c.type===type);
  assert.ok(k>=0,'la carta e davvero nel mazzo posseduto');
  [pile.hand[0],pile.deck[k]]=[pile.deck[k],pile.hand[0]];
  index=0;
 }
 assert.equal([...pile.hand,...pile.deck].filter(c=>c.type===type).length,1);
 return {battle,index};
}
test('IA: personaggio Gaia non si materializza in starter, viene riscattato e poi giocato come speciale vera',()=>{
 const store=storage();
 const type=bossCharacterTypeForPlanet(1);
 const starter=createSpecialCollection();
 assert.equal(starter.owned[type],0);
 assert.equal(validateSpecialDeck(starter,[type,...starter.loadout.slice(1)]).valid,false);
 const result=claimBossCharacterFromVictory({winner:'player',mode:'adventure',
  sectorNumber:10,bossPlanetId:1,bossSectorLevel:10},store);
 assert.equal(result.granted,true);
 assert.equal(readSpecialCollection(store).owned[type],1);
 assert.equal(readSpecialCollection(store).loadout.includes(type),false);
 const {battle,index}=prepareDrawn(readSpecialCollection(store),type);
 const ai=planTacticalAi(battle,'A');
 assert.ok(ai.specialIndices.includes(index),'IA usa un personaggio realmente pescato');
 assert.equal(validateTacticalOrder(battle,'A',ai).ok,true);
 const at=battle.deadlineMs-1000;
 const a=sealTacticalOrder(battle,'A',ai,at);
 assert.equal(a.ok,true,a.reason);
 const b=sealTacticalOrder(a.battle,'B',{specialIndices:[],numericIndices:[]},at+1);
 assert.equal(b.ok,true,b.reason);
 const resolved=advanceTacticalDuel(b.battle,at+1);
 assert.equal(bossCharacterActive(resolved.sides.A,1)?.id,type);
 assert.equal([...resolved.sides.A.special.hand,
  ...resolved.sides.A.special.deck,...resolved.sides.A.special.discard]
  .filter(c=>c.type===type).length,1,'nessuna copia inventata al momento di giocarla');
});
test('IA non spreca un personaggio difensivo se non puo proteggere barriera e non ignora durata',()=>{
 const store=storage();
 claimBossCharacterFromVictory({winner:'player',mode:'campaign',
  sectorNumber:10,bossPlanetId:1,bossSectorLevel:10},store);
 const type=bossCharacterTypeForPlanet(1);
 const {battle,index}=prepareDrawn(readSpecialCollection(store),type);
 battle.sides.A.defense.shield.hp=0;
 const useless=planTacticalAi(battle,'A');
 assert.equal(useless.specialIndices.includes(index),false);
 battle.sides.A.defense.shield.hp=30;
 battle.sides.A.bossCharacter={id:type,startedRound:1,untilRound:2,
  regenDue:0,regenerated:false};
 const stillActive=planTacticalAi(battle,'A');
 assert.equal(stillActive.specialIndices.includes(index),false,
  'un Personaggio ancora attivo non viene giocato due volte');
});
