import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIAL_CARD_CATALOG,TACTICAL_ONLY_SPECIAL_TYPES} from './specialCards.js';
import {TACTICAL_SPECIALS,createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {SPECIAL_TYPES,SPECIAL_PACK_TYPES,createSpecialCollection,normalizeSpecialCollection,
 specialPackReward,openSpecialPack,equipSpecialDeck,validateSpecialDeck}
 from './specialDeckBuilder.js';
import {officialBattleSetup} from './officialBattleSetup.js';
import {VITAL_IDS} from './vitalDefense.js';
const ship={cards:[{instanceId:'ship:N00',shipId:'N00',level:1}],loadout:['ship:N00']};
test('Tutte le carte del motore simultaneo sono tracciabili da collezione e inventario',()=>{
 const missing=Object.keys(TACTICAL_SPECIALS).filter(id=>!SPECIAL_TYPES.includes(id));
 assert.deepEqual(missing,[],'Nessuna carta boss/modulo/terreno o tattica senza inventario');
 assert.ok(TACTICAL_ONLY_SPECIAL_TYPES.length===8);
 for(const type of TACTICAL_ONLY_SPECIAL_TYPES){
  assert.equal(SPECIAL_CARD_CATALOG[type]?.type,type);
  assert.ok(SPECIAL_PACK_TYPES.includes(type),'La tattica deve essere ottenibile dai pacchetti: '+type);
  assert.equal(createSpecialCollection().owned[type],0,'Non regalare '+type);
 }
});
test('Un salvataggio v1 antecedente alle 8 tattiche migra con zero copie, senza perdita dei vecchi premi',()=>{
 const original=createSpecialCollection();
 const old={...original,owned:{...original.owned},claimedRewards:['adventure:sector:10'],
  packCredits:3,openedPacks:2};
 for(const type of TACTICAL_ONLY_SPECIAL_TYPES)delete old.owned[type];
 const before=JSON.stringify(old);
 const restored=normalizeSpecialCollection(old);
 for(const type of TACTICAL_ONLY_SPECIAL_TYPES){
  assert.equal(restored.owned[type],0,type);
  assert.ok(!restored.loadout.includes(type));
 }
 assert.deepEqual(restored.claimedRewards,old.claimedRewards);
 assert.equal(restored.packCredits,3);
 assert.equal(restored.openedPacks,2);
 assert.equal(JSON.stringify(old),before,'Nessuna mutazione dei vecchi salvataggi');
});
test('Scansione tattica nasce da pacchetto vero e il gioco la consuma per rivelare due firme',()=>{
 const base=createSpecialCollection();
 const packIndex=SPECIAL_PACK_TYPES.indexOf('tactic-scan');
 assert.ok(packIndex>=0);
 const credit=specialPackReward(base,'campaign:sector:1');
 assert.equal(credit.granted,true);
 const opened=openSpecialPack(credit.collection,()=>(packIndex+.1)/SPECIAL_PACK_TYPES.length);
 assert.equal(opened.opened,true);
 assert.deepEqual(opened.drawn,['tactic-scan','tactic-scan','tactic-scan']);
 const loadout=base.loadout.map((type,i)=>type==='shot-ion'&&i<24?'tactic-scan':type);
 assert.equal(loadout.filter(x=>x==='tactic-scan').length,4,'Non usare quattro copie da tre possedute');
 const legal=[...base.loadout];
 const ionIndices=legal.map((t,i)=>t==='shot-ion'?i:-1).filter(i=>i>=0);
 for(const i of ionIndices.slice(0,3))legal[i]='tactic-scan';
 const owned=equipSpecialDeck(opened.collection,legal);
 assert.equal(validateSpecialDeck(owned,owned.loadout).valid,true);
 const setup=officialBattleSetup({mode:'campaign',sectorNumber:9,bossPlanetId:1,
  bossSectorLevel:9,shipCollection:ship,specialCollection:owned,seed:18,nowMs:0});
 const battle=setup.battle;
 const pile=battle.sides.A.special;
 const idx=pile.hand.findIndex(c=>c.type==='tactic-scan');
 if(idx<0){
  const from=pile.deck.findIndex(c=>c.type==='tactic-scan');
  assert.ok(from>=0);
  [pile.hand[0],pile.deck[from]]=[pile.deck[from],pile.hand[0]];
 }
 const slot=pile.hand.findIndex(c=>c.type==='tactic-scan');
 assert.equal(battle.sides.A.seen.length,0);
 const a=sealTacticalOrder(battle,'A',{numericIndices:[],specialIndices:[slot]},100);
 assert.equal(a.ok,true,a.reason);
 const b=sealTacticalOrder(a.battle,'B',{numericIndices:[],specialIndices:[]},101);
 assert.equal(b.ok,true,b.reason);
 const r=advanceTacticalDuel(b.battle,101);
 assert.equal(r.sides.A.seen.length,2);
 assert.deepEqual(r.sides.A.seen,VITAL_IDS.slice(0,2));
 assert.equal(r.sides.A.special.discard.filter(c=>c.type==='tactic-scan').length,1);
 assert.equal(r.sides.A.special.hand.length,5);
 assert.equal(r.sides.A.numeric.hand.length,7);
 const specials=r.sides.A.special;
 assert.equal(specials.hand.length+specials.deck.length+specials.discard.length,24);
});
