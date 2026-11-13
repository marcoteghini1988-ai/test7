import test from 'node:test';
import assert from 'node:assert/strict';
import {TACTICAL_MODULE_CARDS} from './tacticalEquipmentCards.js';
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';
import {BOSS_CHARACTER_CATALOG} from './bossCharacterCards.js';
import {fleetAdvancedCardProfile,FLEET_CHARACTER_ACTIONS,FLEET_EPIC_ACTIONS,
 FLEET_MODULE_ACTIONS} from './fleetSpecialProfiles.js';
import {createFleetCardBattle,resolveFleetCardRound,fleetCardEffect,selectFleetAiOrder} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
const deck=()=>[...createSpecialCollection().loadout];
function match(shipA='C01',shipB='C01',levelA=1,levelB=1){
 return createFleetCardBattle({shipsA:[{shipId:shipA,level:levelA}],
  shipsB:[{shipId:shipB,level:levelB}],deckA:deck(),deckB:deck(),seed:129,nowMs:10});
}
function insert(side,type,index=0){
 const idx=side.hand.indexOf(type);
 if(idx>=0){[side.hand[idx],side.hand[index]]=[side.hand[index],side.hand[idx]];return;}
 const i=side.deck.indexOf(type);
 assert.ok(i>=0,type+' deve esistere nel mazzo');
 [side.hand[index],side.deck[i]]=[side.deck[i],side.hand[index]];
}
const order=(side,cards=[])=>({shipIndex:0,
 partId:side.ships[0].parts.find(p=>!p.destroyed)?.id||'command',cards});
function round(b,cardsA=[],cardsB=[]){
 const r=resolveFleetCardRound(b,order(b.sides.B,cardsA),order(b.sides.A,cardsB),b.round*100);
 assert.equal(r.ok,true,r.reason);return r;
}
test('53 carte reali mantengono le loro identita: 35 moduli, 12 comandanti, 6 epici',()=>{
 assert.equal(Object.keys(TACTICAL_MODULE_CARDS).length,35);
 assert.equal(Object.keys(BOSS_CHARACTER_CATALOG).length,12);
 assert.equal(Object.keys(TACTICAL_EPIC_CARDS).length,6);
 for(const type of [...Object.keys(TACTICAL_MODULE_CARDS),
  ...Object.keys(BOSS_CHARACTER_CATALOG),...Object.keys(TACTICAL_EPIC_CARDS)]){
  const p=fleetAdvancedCardProfile(type);
  assert.ok(p.action&&p.description.length>30,type);
  assert.equal(fleetCardEffect(type).description,p.description);
 }
 assert.equal(Object.keys(FLEET_MODULE_ACTIONS).length,19);
 assert.equal(Object.keys(FLEET_CHARACTER_ACTIONS).length,12);
 assert.equal(Object.keys(FLEET_EPIC_ACTIONS).length,6);
});
test('Un solo comandante attivo; durata e consumi reali',()=>{
 const b=match();
 insert(b.sides.A,'boss-character-1');insert(b.sides.A,'boss-character-2',1);
 assert.equal(resolveFleetCardRound(b,order(b.sides.B,[0,1]),order(b.sides.A)).ok,false);
 const first=round(b,[0]).battle;
 assert.equal(first.sides.A.commander.type,'boss-character-1');
 const idx=first.sides.A.hand.indexOf('boss-character-2');
 assert.ok(idx>=0);
 const blocked=resolveFleetCardRound(first,order(first.sides.B,[idx]),order(first.sides.A));
 assert.equal(blocked.ok,false);
 assert.match(blocked.reason,/personaggio attivo/i);
 const second=round(first).battle;
 const third=round(second).battle;
 assert.equal(third.sides.A.commander,null);
});
test('Carta Gaia protegge la madre con una manovra, non uno scudo generale',()=>{
 const normal=match(),gaia=match();
 insert(gaia.sides.A,'boss-character-1');
 const baseline=round(normal).events[1].damage;
 const protectedHit=round(gaia,[0]).events[1].damage;
 assert.ok(protectedHit<=baseline);
 assert.equal(gaia.sides.A.ships[0].maxShield,0);
});
test('Comandante offensivo e personaggio precisione danno effetti diversi',()=>{
 const baseline=match(),assault=match(),precision=match();
 insert(assault.sides.A,'boss-character-2');
 insert(precision.sides.A,'boss-character-20');
 const normal=round(baseline).events[0];
 const boost=round(assault,[0]).events[0];
 const aimed=round(precision,[0]).events[0];
 assert.ok(boost.strength>normal.strength);
 assert.ok(aimed.strength>normal.strength);
 assert.ok(aimed.damage>=normal.damage);
});
test('Moduli: attacco, interferenza e riparazione agiscono su sistemi autentici',()=>{
 const baseline=match(),blaze=match(),jam=match(),repair=match();
 insert(blaze.sides.A,'module-card-aries');
 insert(jam.sides.A,'module-card-virgo');
 insert(repair.sides.A,'module-card-taurus');
 repair.sides.A.ships[0].parts.find(p=>p.id==='engine').damage=1;
 const normal=round(baseline);
 const strong=round(blaze,[0]);
 const jammed=round(jam,[0]);
 const fixed=round(repair,[0]);
 assert.ok(strong.events[0].strength>normal.events[0].strength);
 assert.ok(jammed.events[1].strength<=normal.events[1].strength);
 assert.equal(fixed.battle.sides.A.ships[0].parts.find(p=>p.id==='engine').damage,0);
});
test('Modulo Ricambio e Interferenza non creano nuove carte',()=>{
 const b=match();insert(b.sides.A,'module-card-cancer');
 const n=round(b,[0]).battle.sides.A;
 assert.equal(n.hand.length+n.deck.length+n.discard.length,24);
 assert.equal(n.discard.length,3);
 const jam=match();insert(jam.sides.A,'module-card-scorpio');
 const after=round(jam,[0],[0]).battle;
 assert.equal(after.sides.B.hand.length,4);
 assert.equal(after.sides.A.hand.length,5);
});
test('Epici conservano durata e attivano condizioni sui vitali, non sugli scudi',()=>{
 const b=match();insert(b.sides.A,'epic_item_8');
 const first=round(b,[0]).battle;
 assert.equal(first.sides.A.buffs[0].until,2);
 const second=round(first).battle;
 assert.equal(second.sides.A.buffs.length,1);
 const third=round(second).battle;
 assert.equal(third.sides.A.buffs.length,0);
 const ordinary=match(),critical=match();
 insert(critical.sides.A,'epic_item_9');
 critical.sides.A.ships[0].parts.find(p=>p.id==='engine').damage=1;
 const normal=round(ordinary).events[0];
 const boosted=round(critical,[0]).events[0];
 assert.ok(boosted.strength>normal.strength);
});
test('L Astrolabio ricambia 2 carte, mantenendo 24 totali',()=>{
 const b=match();insert(b.sides.A,'epic_item_3');
 const after=round(b,[0]).battle.sides.A;
 assert.equal(after.discard.length,3);
 assert.equal(after.hand.length+after.deck.length+after.discard.length,24);
});
test('Il modulo Ariete al livello 9 supera quello di livello 1',()=>{
 const setup=level=>{
  const b=match();
  b.sides.A.equipmentLevels['module-card-aries']=level;
  insert(b.sides.A,'module-card-aries');return b;
 };
 const novice=round(setup(1),[0]).events[0];
 const expert=round(setup(9),[0]).events[0];
 assert.ok(expert.strength>novice.strength);
});
test('L IA non usa due comandanti nel medesimo round',()=>{
 const b=match();b.round=3;
 b.sides.B.hand[0]='boss-character-1';b.sides.B.hand[1]='boss-character-2';
 const ai=selectFleetAiOrder(b);
 assert.ok(ai.cards.filter(i=>b.sides.B.hand[i].startsWith('boss-character-')).length<=1);
 assert.equal(resolveFleetCardRound(b,order(b.sides.B),ai).ok,true);
});
