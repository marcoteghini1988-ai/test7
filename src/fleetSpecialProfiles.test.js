import test from 'node:test';
import assert from 'node:assert/strict';
import {TACTICAL_MODULE_CARDS} from './tacticalEquipmentCards.js';
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';
import {BOSS_CHARACTER_CATALOG} from './bossCharacterCards.js';
import {fleetAdvancedCardProfile,FLEET_CHARACTER_ACTIONS,FLEET_EPIC_ACTIONS,FLEET_MODULE_ACTIONS}
 from './fleetSpecialProfiles.js';
import {createFleetCardBattle,resolveFleetCardRound,fleetCardEffect} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';

const deck=()=>[...createSpecialCollection().loadout];
const order=(cards=[],partId='command')=>({shipIndex:0,partId,cards});
function match(shipA='C01',shipB='C01'){
 return createFleetCardBattle({
  shipsA:[{shipId:shipA,level:1}],shipsB:[{shipId:shipB,level:1}],
  deckA:deck(),deckB:deck(),seed:129,nowMs:10
 });
}
// Nei test si sposta la carta speciale da un mazzo di prova nella mano iniziale:
// lo spostamento non genera copie ne' assegna ricompense a un salvataggio.
function insert(side,type,index=0){
 const prev=side.hand[index];
 const inDeck=side.deck.indexOf(type);
 if(inDeck>=0){side.hand[index]=type;side.deck[inDeck]=prev;return;}
 side.hand[index]=type;
 side.deck.push(prev);side.deck.shift();
}
function play(b,cardsA=[0],cardsB=[]){
 const r=resolveFleetCardRound(b,order(cardsA),order(cardsB),b.round*100);
 assert.equal(r.ok,true,r.reason);
 return r.battle;
}
test('53 carte reali: ogni modulo, personaggio ed epico ha un effetto riconoscibile',()=>{
 assert.equal(Object.keys(TACTICAL_MODULE_CARDS).length,35);
 assert.equal(Object.keys(BOSS_CHARACTER_CATALOG).length,12);
 assert.equal(Object.keys(TACTICAL_EPIC_CARDS).length,6);
 for(const type of [...Object.keys(TACTICAL_MODULE_CARDS),
  ...Object.keys(BOSS_CHARACTER_CATALOG),...Object.keys(TACTICAL_EPIC_CARDS)]){
  const p=fleetAdvancedCardProfile(type),f=fleetCardEffect(type);
  assert.ok(p?.action&&p.description.length>30,type);
  assert.equal(f.description,p.description);
  assert.equal(f.kind,p.kind);
 }
 assert.equal(Object.keys(FLEET_CHARACTER_ACTIONS).length,12);
 assert.equal(Object.keys(FLEET_EPIC_ACTIONS).length,6);
 assert.equal(Object.keys(FLEET_MODULE_ACTIONS).length,19);
});
test('Comandante: massimo uno per 2 round, rifiuto senza consumare carte',()=>{
 const b=match();
 insert(b.sides.A,'boss-character-1');
 insert(b.sides.A,'boss-character-2',1);
 const two=resolveFleetCardRound(b,order([0,1]),order());
 assert.equal(two.ok,false);
 assert.equal(b.sides.A.hand.length,5);
 const first=play(b);
 assert.equal(first.sides.A.commander.type,'boss-character-1');
 assert.equal(first.sides.A.commander.until,2);
 const other=first.sides.A.hand.indexOf('boss-character-2');
 assert.ok(other>=0);
 const blocked=resolveFleetCardRound(first,order([other]),order());
 assert.equal(blocked.ok,false);
 assert.match(blocked.reason,/personaggio attivo/i);
 const second=play(first,[],[]);
 const third=play(second,[],[]);
 assert.equal(third.sides.A.commander,null);
});
test('Gaia e Colosso: scudo difensivo e attacco aumentato sono due effetti diversi',()=>{
 const ordinary=match();
 const gaia=match(),tharsis=match();
 insert(gaia.sides.A,'boss-character-1');
 insert(tharsis.sides.A,'boss-character-2');
 const normal=play(ordinary,[],[]);
 const safe=play(gaia);
 const strong=play(tharsis);
 assert.ok(safe.sides.A.ships[0].shield>normal.sides.A.ships[0].shield);
 assert.ok(strong.sides.B.ships[0].shield<normal.sides.B.ships[0].shield);
});
test('Sovrano del Vuoto: card personaggio perfora uno scudo integro',()=>{
 const b=match();insert(b.sides.A,'boss-character-20');
 const result=play(b);
 const opponent=result.sides.B.ships[0];
 assert.equal(opponent.parts.find(x=>x.id==='command').damage,1);
 assert.equal(opponent.shield,1);
});
test('Modulo di fuoco, interferenza e riparazione non producono tutti lo stesso bonus',()=>{
 const blaze=match(),jam=match(),repair=match();
 insert(blaze.sides.A,'module-card-aries');
 insert(jam.sides.A,'module-card-virgo');
 insert(repair.sides.A,'module-card-taurus');
 repair.sides.A.ships[0].shield=1;
 const a=play(blaze),b=play(jam),c=play(repair);
 assert.equal(a.sides.B.ships[0].shield,0,'Ariete aumenta il fuoco');
 assert.equal(b.sides.A.ships[0].shield,2,'Vergine disturba il nemico');
 const without=match();
 without.sides.A.ships[0].shield=1;
 const noRepair=play(without,[],[]);
 assert.equal(c.sides.A.ships[0].shield,noRepair.sides.A.ships[0].shield+1,
  'Toro recupera un punto scudo prima del colpo nemico simultaneo');
});
test('Modulo Ricambio: usa solo carte reali, non aumenta il totale 24',()=>{
 const b=match();insert(b.sides.A,'module-card-cancer');
 const n=play(b);
 const side=n.sides.A;
 assert.equal(side.hand.length+side.deck.length+side.discard.length,24);
 assert.equal(side.discard.length,3);
});
test('Modulo Interferenza: salta una pesca, non distrugge la mano',()=>{
 const b=match();
 insert(b.sides.A,'module-card-scorpio');
 const after=play(b,[0],[0]);
 assert.equal(after.sides.B.hand.length,4);
 assert.equal(after.sides.A.hand.length,5);
});
test('Il Calice epico resta attivo 2 round e la Matrice ha un requisito diverso',()=>{
 const b=match();
 insert(b.sides.A,'epic_item_8');
 const first=play(b);
 assert.equal(first.sides.A.buffs[0].until,2);
 const second=play(first,[],[]);
 assert.equal(second.sides.A.buffs.length,1);
 const third=play(second,[],[]);
 assert.equal(third.sides.A.buffs.length,0);
 const crit=match();insert(crit.sides.A,'epic_item_9');
 const baseline=match();
 const ordinary=play(baseline,[],[]);
 const healthy=play(crit);
 assert.equal(healthy.sides.B.ships[0].shield,ordinary.sides.B.ships[0].shield,
  'La Matrice non si attiva senza sistemi fratturati e scudi abbattuti');
});
test('L Astrolabio ricambia due carte, durata unica',()=>{
 const b=match();insert(b.sides.A,'epic_item_3');
 const result=play(b);
 assert.equal(result.sides.A.discard.length,3);
 assert.equal(result.sides.A.hand.length+result.sides.A.deck.length+
  result.sides.A.discard.length,24);
});

test('I moduli potenziati al livello 9 hanno effetto maggiore del livello 1',()=>{
 function setup(lvl){
  const b=createFleetCardBattle({
   shipsA:[{shipId:'C01',level:1}],shipsB:[{shipId:'C01',level:1}],
   deckA:deck(),deckB:deck(),moduleLevelsA:{'module-card-aries':lvl},seed:129
  });
  insert(b.sides.A,'module-card-aries');
  return b;
 }
 const novice=resolveFleetCardRound(setup(1),order([0]),order(),100);
 const veteran=resolveFleetCardRound(setup(9),order([0]),order(),100);
 assert.equal(novice.ok,true);assert.equal(veteran.ok,true);
 assert.ok(veteran.events[0].strength>novice.events[0].strength);
 assert.equal(veteran.battle.sides.A.equipmentLevels['module-card-aries'],9);
});
