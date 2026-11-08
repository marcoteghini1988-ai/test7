import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIAL_CARD_CATALOG,initializeSpecialDeck,refillSpecialHand,makeSpecialInstances} from './specialCards.js';
import {initialBattle} from './mathDuelEngine.js';
import {
 SPECIAL_COLLECTION_KEY,SPECIAL_TYPES,SPECIAL_DECK_SIZE,SPECIAL_DECK_COPY_LIMIT,
 SPECIAL_PACK_SIZE,SPECIAL_PACK_TYPES,STARTER_SPECIAL_COUNTS,createSpecialCollection,
 normalizeSpecialCollection,specialDeckCounts,validateSpecialDeck,equipSpecialDeck,
 specialPackReward,openSpecialPack,readSpecialCollection,updateSpecialCollection,
 claimFirstWinSpecialPack
} from './specialDeckBuilder.js';
const rng=()=>0;
function storage(){
 const values=new Map();return {getItem:key=>values.get(key)??null,
  setItem:(key,value)=>values.set(key,value)};
}
const cardsOf=side=>[...side.specialHand,...side.specialDeck,...side.specialDiscard];
test('30: starter collection has eleven types, six initially equipped and equips exactly 24 unique card slots',()=>{
 const coll=createSpecialCollection(),counts=specialDeckCounts(coll.loadout);
 assert.equal(coll.schemaVersion,1);
 assert.equal(coll.loadout.length,SPECIAL_DECK_SIZE);
 assert.deepEqual(SPECIAL_TYPES,Object.keys(SPECIAL_CARD_CATALOG));
 assert.equal(SPECIAL_TYPES.length,74); // 73 precedenti + Carta Faglia di Vulnerabilità
 for(const type of SPECIAL_TYPES){
  assert.equal(coll.owned[type],STARTER_SPECIAL_COUNTS[type]);
  assert.equal(counts[type],STARTER_SPECIAL_COUNTS[type]);
 }
 assert.equal(validateSpecialDeck(coll,coll.loadout).valid,true);
 assert.equal(coll.packCredits,0);
});
test('30: custom deck can rebalance only genuinely owned copies, to copy limit six',()=>{
 let collection=createSpecialCollection();
 const base=[...collection.loadout];
 const invalid=base.filter(type=>type!=='fusion-barrier').concat(Array(8).fill('fusion-barrier'));
 assert.equal(invalid.length,28);
 assert.equal(validateSpecialDeck(collection,invalid).reason,'deck_size');
 const balanced=[...base];balanced[0]='shot-ion';
 assert.equal(validateSpecialDeck(collection,balanced).reason,'not_owned');
 collection={...collection,owned:{...collection.owned,'shot-ion':5}};
 const next=equipSpecialDeck(collection,balanced);
 assert.equal(next.loadout.filter(x=>x==='shot-ion').length,5);
 assert.equal(next.loadout.filter(x=>x==='fusion-barrier').length,3);
 assert.equal(collection.loadout.filter(x=>x==='fusion-barrier').length,4);
 assert.equal(next.owned['shot-ion'],5);
 const many=base.map((t,i)=>i<7?'shot-ion':t);
 assert.equal(validateSpecialDeck({...next,owned:{...next.owned,'shot-ion':20}},many).reason,'copy_limit');
});
test('33/35: exactly 24 cards and at most 6 real copies per type in builder AND battle engine',()=>{
 assert.equal(SPECIAL_DECK_SIZE,24);
 assert.equal(SPECIAL_DECK_COPY_LIMIT,6);
 const starter=createSpecialCollection();
 const collection={...starter,owned:{...starter.owned,'shot-ion':20}};
 const legal=[...Array(6).fill('shot-ion'),
  ...starter.loadout.filter(type=>type!=='shot-ion').slice(0,18)];
 assert.equal(legal.length,24);
 assert.equal(validateSpecialDeck(collection,legal).valid,true);
 assert.equal(equipSpecialDeck(collection,legal).loadout.length,24);
 assert.equal(makeSpecialInstances(legal).length,24);
 const illegal=[...legal];illegal[6]='shot-ion';
 assert.equal(validateSpecialDeck(collection,illegal).reason,'copy_limit');
 assert.throws(()=>makeSpecialInstances(illegal),/Troppe copie/);
 for(const short of [legal.slice(1),legal.slice(0,23)]){
  assert.equal(validateSpecialDeck(collection,short).reason,'deck_size');
  assert.throws(()=>makeSpecialInstances(short),/Mazzo speciale non valido/);
 }
 assert.equal(validateSpecialDeck(collection,[...legal,legal[0]]).reason,'deck_size');
 assert.throws(()=>makeSpecialInstances([...legal,legal[0]]),/Mazzo speciale non valido/);
});
test('30: invalid/unknown/unowned special cards never enter an equipped deck',()=>{
 const coll=createSpecialCollection();
 for(const [candidate,reason] of [
  [coll.loadout.slice(1),'deck_size'],
  [[...coll.loadout.slice(0,-1),'bogus'],'unknown_card'],
  [[...coll.loadout.slice(0,-1),'shot-ion'],'not_owned']
 ]){
  assert.equal(validateSpecialDeck(coll,candidate).reason,reason);
  assert.throws(()=>equipSpecialDeck(coll,candidate));
 }
 assert.throws(()=>initializeSpecialDeck({},rng,['bogus']));
});
test('30: opening a pack requires an earned credit; three genuine cards are added',()=>{
 const c=createSpecialCollection();
 const denied=openSpecialPack(c,rng);
 assert.equal(denied.opened,false);assert.strictEqual(denied.collection,c);
 const granted=specialPackReward(c,'campaign:sector:1');
 assert.equal(granted.granted,true);
 const pack=openSpecialPack(granted.collection,rng);
 assert.equal(pack.opened,true);
 assert.equal(pack.drawn.length,SPECIAL_PACK_SIZE);
 assert.deepEqual(pack.drawn,['fusion-barrier','fusion-barrier','fusion-barrier']);
 assert.equal(pack.collection.owned['fusion-barrier'],7);
 assert.equal(pack.collection.packCredits,0);
 assert.equal(pack.collection.openedPacks,1);
 assert.deepEqual(pack.collection.loadout,c.loadout);
});
test('30: packs only increase ownership; deck must be edited and saved manually',()=>{
 const coll=createSpecialCollection();
 const index=SPECIAL_PACK_TYPES.indexOf('support-status-purge');
 assert.ok(index>=0);
 const pack=openSpecialPack(specialPackReward(coll,'campaign:sector:2').collection,
  ()=>(index+.25)/SPECIAL_PACK_TYPES.length);
 const before=pack.collection.loadout;
 const equipped=equipSpecialDeck(pack.collection,
   before.map((t,i)=>i===0?'support-status-purge':t));
 assert.equal(equipped.loadout.length,24);
 assert.equal(before[0],'fusion-barrier');
 assert.notDeepEqual(equipped.loadout,before);
});
test('39: pre-existing v1 collection accepts missing newly introduced escort-repair card without losing progress',()=>{
 const s=storage();
 const original=createSpecialCollection();
 const old={...original,owned:{...original.owned},packCredits:7,openedPacks:12,
  claimedRewards:['campaign:sector:5','campaign:sector:6']};
 delete old.owned['support-escort-repair'];
 s.setItem(SPECIAL_COLLECTION_KEY,JSON.stringify(old));
 const loaded=readSpecialCollection(s);
 assert.equal(loaded.owned['support-escort-repair'],0);
 assert.equal(loaded.packCredits,7);
 assert.equal(loaded.openedPacks,12);
 assert.deepEqual(loaded.claimedRewards,old.claimedRewards);
 assert.deepEqual(loaded.loadout,old.loadout);
 assert.equal(JSON.parse(s.getItem(SPECIAL_COLLECTION_KEY)).owned['support-escort-repair'],undefined);
 updateSpecialCollection(c=>c,s);
 assert.equal(readSpecialCollection(s).owned['support-escort-repair'],0);
 assert.equal(readSpecialCollection(s).packCredits,7);
 const damaged={...old,owned:{...old.owned}};
 delete damaged.owned['shot-ion'];
 assert.throws(()=>normalizeSpecialCollection(damaged),/Numero di carte/);
});
test('39: only packs can grant escort repair and a real owned copy can be equipped',()=>{
 const base=createSpecialCollection();
 assert.equal(base.owned['support-escort-repair'],0);
 const denied=base.loadout.map((type,i)=>i===0?'support-escort-repair':type);
 assert.equal(validateSpecialDeck(base,denied).reason,'not_owned');
 const earned=specialPackReward(base,'campaign:sector:17').collection;
 const index=SPECIAL_PACK_TYPES.indexOf('support-escort-repair');
 assert.ok(index>=0);
 const opened=openSpecialPack(earned,()=>(index+.25)/SPECIAL_PACK_TYPES.length);
 assert.equal(opened.opened,true);
 assert.deepEqual(opened.drawn,['support-escort-repair','support-escort-repair','support-escort-repair']);
 const equipped=equipSpecialDeck(opened.collection,denied);
 assert.equal(equipped.loadout.filter(type=>type==='support-escort-repair').length,1);
 assert.equal(opened.collection.owned['support-escort-repair'],3);
 const battle=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  specialDeckTypes:equipped.loadout},rng);
 assert.equal(cardsOf(battle.player).filter(card=>card.type==='support-escort-repair').length,1);
});
test('30: first-win reward cannot be farmed by replaying the same sector',()=>{
 const s=storage();
 const first=claimFirstWinSpecialPack('campaign',3,s);
 const second=claimFirstWinSpecialPack('campaign',3,s);
 const other=claimFirstWinSpecialPack('campaign',4,s);
 assert.equal(first.granted,true);
 assert.equal(second.granted,false);
 assert.equal(other.granted,true);
 assert.equal(readSpecialCollection(s).packCredits,2);
 assert.equal(readSpecialCollection(s).claimedRewards.length,2);
});
test('30: trials and invalid modes cannot generate pack rewards',()=>{
 const s=storage();
 for(const [mode,id] of [['practice',1],['pvp',1],['campaign',-1],['adventure',0]]){
  const r=claimFirstWinSpecialPack(mode,id,s);
  assert.equal(r.granted,false);
 }
 assert.equal(readSpecialCollection(s).packCredits,0);
});
test('30: separate storage never overwrites or reinitializes ship collection',()=>{
 const s=storage();
 s.setItem('eclissi_ship_collection','KEEP_THIS_SAVE');
 updateSpecialCollection(c=>specialPackReward(c,'adventure:sector:1').collection,s);
 const first=readSpecialCollection(s);
 assert.equal(first.packCredits,1);
 assert.equal(s.getItem('eclissi_ship_collection'),'KEEP_THIS_SAVE');
 assert.equal(JSON.parse(s.getItem(SPECIAL_COLLECTION_KEY)).schemaVersion,1);
});
test('30: writing invalid collection must preserve previous serialized data',()=>{
 const s=storage();
 updateSpecialCollection(c=>c,s);
 const before=s.getItem(SPECIAL_COLLECTION_KEY);
 assert.throws(()=>updateSpecialCollection(c=>({...c,owned:{...c.owned,'shot-ion':-5}}),s));
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),before);
 s.setItem(SPECIAL_COLLECTION_KEY,'{');
 assert.throws(()=>updateSpecialCollection(c=>c,s));
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),'{');
});
test('30: custom equipped special deck actually changes both sides in a live battle',()=>{
 const c=createSpecialCollection();
 const granted={...c,owned:{...c.owned,'shot-piercing':5}};
 const deck=equipSpecialDeck(granted,c.loadout.map((t,i)=>i===0?'shot-piercing':t)).loadout;
 const b=initialBattle(1,{vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
   specialDeckTypes:deck},rng);
 for(const side of [b.player,b.enemy]){
  const all=cardsOf(side);
  assert.equal(all.length,24);
  assert.equal(all.filter(x=>x.type==='shot-piercing').length,5);
  assert.equal(all.filter(x=>x.type==='fusion-barrier').length,3);
  assert.equal(new Set(all.map(x=>x.id)).size,24);
  assert.equal(side.specialHand.length,5);
  assert.equal(side.hand.length,7);
 }
});
test('30: repeated special-card cycles never duplicate or create owned instances',()=>{
 const types=createSpecialCollection().loadout;
 let side=initializeSpecialDeck({fleet:[{defense:{kind:'mother',parts:{command:{hp:10},
   engine:{hp:10}},shield:{hp:100}}}],escorts:[],maneuvers:{},hand:[]},rng,types);
 const ids=cardsOf(side).map(x=>x.id).sort();
 for(let i=0;i<70;i++){
  // Replace a card with ordinary discard+refill; ability semantics tested separately.
  const [used,...rest]=side.specialHand;
  side=refillSpecialHand({...side,specialHand:rest,
   specialDiscard:[...side.specialDiscard,used]},rng);
  assert.deepEqual(cardsOf(side).map(x=>x.id).sort(),ids);
 }
});
test('30: storage migration can initialize on first access without affecting old modes',()=>{
 const s=storage(),first=readSpecialCollection(s);
 assert.equal(first.loadout.length,24);
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),null);
 const same=normalizeSpecialCollection(first);
 assert.deepEqual(same,first);
 assert.equal(openSpecialPack(first,rng).reason,'no_pack');
});

test('vecchio salvataggio con nove speciali: le due fusioni nuove entrano con zero copie',()=>{
 const original=createSpecialCollection();
 const old={...original,owned:{...original.owned},packCredits:5,openedPacks:11,
  claimedRewards:['adventure:sector:42']};
 delete old.owned['fusion-twin'];
 delete old.owned['fusion-triad'];
 const migrated=normalizeSpecialCollection(old);
 assert.equal(migrated.owned['fusion-twin'],0);
 assert.equal(migrated.owned['fusion-triad'],0);
 assert.equal(migrated.loadout.length,24);
 assert.equal(migrated.packCredits,5);
 assert.equal(migrated.openedPacks,11);
 assert.deepEqual(migrated.claimedRewards,old.claimedRewards);
 assert.deepEqual(migrated.loadout,original.loadout);
 assert.equal(validateSpecialDeck(migrated,original.loadout).valid,true);
});

test('nuove fusioni si trovano nei pacchetti e non sono regalate agli inventari esistenti',()=>{
 const base=createSpecialCollection();
 assert.equal(base.owned['fusion-twin'],0);
 assert.equal(base.owned['fusion-triad'],0);
 for(const type of ['fusion-twin','fusion-triad']){
  const unit=(SPECIAL_PACK_TYPES.indexOf(type)+.25)/SPECIAL_PACK_TYPES.length;
  assert.ok(SPECIAL_PACK_TYPES.includes(type));
  const withCredit=specialPackReward(base,'adventure:sector:51').collection;
  const opened=openSpecialPack(withCredit,()=>unit);
  assert.equal(opened.opened,true);
  assert.deepEqual(opened.drawn,[type,type,type]);
  const loadout=[type,...base.loadout.slice(1)];
  assert.equal(validateSpecialDeck(base,loadout).reason,'not_owned');
  assert.equal(validateSpecialDeck(opened.collection,loadout).valid,true);
  const player=initialBattle(1,{vitalPrototype:true,shipLevel:5,fleetIds:['N00'],
   specialDeckTypes:equipSpecialDeck(opened.collection,loadout).loadout},rng).player;
  assert.equal(cardsOf(player).filter(c=>c.type===type).length,1);
 }
});

test('Prima vittoria per settore: campagna e avventura condividono la stessa ricompensa',()=>{
 const s=storage();
 assert.equal(claimFirstWinSpecialPack('adventure',40,s).granted,true);
 assert.equal(claimFirstWinSpecialPack('campaign',40,s).granted,false);
 assert.equal(claimFirstWinSpecialPack('campaign',120,s).granted,true);
 assert.equal(claimFirstWinSpecialPack('adventure',120,s).granted,false);
 assert.equal(readSpecialCollection(s).packCredits,2);
 assert.deepEqual(readSpecialCollection(s).claimedRewards,
  ['adventure:sector:40','campaign:sector:120']);
 for(const sector of [121,200,0,-1,1.5]){
  assert.equal(claimFirstWinSpecialPack('adventure',sector,s).granted,false);
 }
 assert.equal(readSpecialCollection(s).packCredits,2);
});
test('Pacchetto gia ottenuto in un salvataggio v1 resta riconosciuto nel modo opposto',()=>{
 const s=storage(),old=createSpecialCollection();
 old.packCredits=5;
 old.claimedRewards=['campaign:sector:40','adventure:sector:60'];
 s.setItem(SPECIAL_COLLECTION_KEY,JSON.stringify(old));
 const raw=s.getItem(SPECIAL_COLLECTION_KEY);
 assert.equal(claimFirstWinSpecialPack('adventure',40,s).granted,false);
 assert.equal(claimFirstWinSpecialPack('campaign',60,s).granted,false);
 assert.equal(s.getItem(SPECIAL_COLLECTION_KEY),raw,'Nessuna migrazione distruttiva');
 assert.equal(readSpecialCollection(s).packCredits,5);
});
