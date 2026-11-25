import test from 'node:test';
import assert from 'node:assert/strict';
import {DESIGNED_WEAPON_CARDS,DESIGNED_WEAPONS_PLAYABLE,DESIGNED_WEAPONS_PENDING,
 card,cardRole,cardFacePath,cardCopyLimit} from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {NEXT_COMMON_AVAILABLE,canSelectNewGeneric,buildNextBaseDeck,buyNextCommonCard}
 from './fleetNext/nextDeckLoadout.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,effectUnavailableReason}
 from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {projectMachineBerths} from './fleetNext/battlePresentation.js';
function battle(guards=false){
 const supports=guards?SUPPORT_CATALOG.slice(0,2).map((s,i)=>({supportId:s.id,instanceId:'designed-'+i,slot:i,rarita:'Leggendaria'})):[];
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:supports,mode:'pvp',ruleset:HP_SYNC_RULESET,
  deckA:[],deckB:[],seed:28290,nowMs:0});
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(25).fill('gen-216');s.discard=[];
 }
 b.sides.B.ships[0].hp=5000;b.sides.B.ships[0].maxHp=5000;
 return b;
}
function play(b,who,ids=[],pass=true){
 b.sides[who].hand=[...ids];
 const r=resolveFleetNextTurn(b,who,{pass,cards:ids.map((_,i)=>i),
  ...(pass?{}:{targetKind:'part',targetId:'weapons',partId:'weapons'})},b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);return r;
}
const named=name=>{
 const c=DESIGNED_WEAPON_CARDS.find(c=>c.name===name);
 assert.ok(c,'Arma non registrata: '+name);return c;
};
const shots=r=>r.events.filter(e=>e.kind==='weapon-designed-shot');
test('Catalogo: 35 carte attive, 20 con bilanciamento provvisorio',()=>{
 assert.equal(DESIGNED_WEAPON_CARDS.length,35);
 assert.equal(DESIGNED_WEAPONS_PLAYABLE.length,35);
 assert.equal(DESIGNED_WEAPONS_PENDING.length,0);
 assert.equal(DESIGNED_WEAPONS_PLAYABLE.filter(c=>c.provisionalBalance).length,20);
 const all=DESIGNED_WEAPON_CARDS.map(c=>c.id);
 assert.equal(new Set(all).size,35);
 const distribution={plasma:9,cryogenic:5,refrigerant:6,metallic:9,ionic:6};
 assert.deepEqual(Object.fromEntries(Object.keys(distribution).map(e=>[e,
  DESIGNED_WEAPON_CARDS.filter(c=>c.elementId===e).length])),distribution);
 for(const c of DESIGNED_WEAPON_CARDS){
  assert.equal(card(c.id),c,c.id);assert.equal(cardRole(c.id),'support');
  // Il Recuperatore ha ora il fronte completo approvato; le altre Armi
  // progettate attendono ancora la propria illustrazione.
  const approvedFront=['weapon-designed-metallic-recuperatore-termobalistico',
   'weapon-designed-metallic-ganasce-magnetiche','weapon-designed-metallic-collassatore-lega',
   'weapon-designed-metallic-frantumatore-induzione','weapon-designed-metallic-perforatore-cascata',
   'weapon-designed-metallic-artiglieria-schegge'].includes(c.id)?
   '/assets/fleet-weapon-fronts/'+c.id+'.png':null;
  assert.equal(cardFacePath(c.id),approvedFront);assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(describeEffect(c),c.effectProposed,c.id);
  assert.ok(NEXT_COMMON_AVAILABLE.includes(c));assert.equal(c.acquisitionPending,false);
  assert.equal(canSelectNewGeneric(c.id),c.playable);
  assert.ok(cardCopyLimit(c.id)>=1);
 }
});
test('Le 20 Armi progettate sono ora acquistabili e inseribili nel mazzo',()=>{
 const inv=createFleetInventory();
 for(const c of DESIGNED_WEAPONS_PLAYABLE.filter(c=>c.provisionalBalance)){
  assert.equal(c.playable,true);assert.equal(c.designOnly,false);
  assert.equal(inv.owned[c.id]||0,0);
  assert.equal(canSelectNewGeneric(c.id),true);
  const buy=buyNextCommonCard({...inv,credits:10000},c.id);
  assert.equal(buy.ok,true,c.id);
  assert.equal(buy.inventory.owned[c.id],1);
 }
 const first=DESIGNED_WEAPONS_PLAYABLE.find(c=>c.provisionalBalance);
 const owned={...inv,owned:{...inv.owned,[first.id]:1}};
 assert.deepEqual(buildNextBaseDeck(normalizeFleetInventory(owned),'C01',20,[first.id]).baseDeck,[first.id]);
});
test('Tutte le 15 Carte Arma parametrizzate infliggono HP reali in battaglia',()=>{
 for(const c of DESIGNED_WEAPONS_PLAYABLE.filter(c=>!c.provisionalBalance)){
  const r=play(battle(),'A',[c.id],true),e=shots(r);
  assert.equal(e.length,1,c.name);
  assert.equal(e[0].cardId,c.id);
  assert.ok(e[0].hitCount>=1,c.name);
  assert.ok(e[0].actualDamage>0,c.name+' deve produrre danni HP reali');
  assert.ok(r.battle.sides.B.ships[0].hp<5000,c.name);
  assert.ok(r.battle.sides.A.machines.some(m=>m.sourceCardId===c.id));
 }
});
test('Batteria tre ugelli: tre colpi distinti da 14 HP',()=>{
 const c=named('Batteria Termica a Tre Ugelli'),e=shots(play(battle(),'A',[c.id]))[0];
 assert.equal(e.hitCount,3);assert.deepEqual(e.impacts.map(h=>h.nominalDamage),[14,14,14]);
});
test('Lanciafiamme: supporti + nave madre, 11 HP nominali ognuna',()=>{
 const c=named('Lanciafiamme a Ventaglio'),r=play(battle(true),'A',[c.id]),e=shots(r)[0];
 assert.equal(e.hitCount,3);assert.deepEqual(e.impacts.map(h=>h.nominalDamage),[11,11,11]);
 assert.ok(e.impacts.some(h=>h.targetKind==='part'));
});
test('Condensatore: livelli nominali 18, 30, 42 con zero, una o due Energie Fuoco',()=>{
 const c=named('Cannone Condensatore Pirobalistico');
 for(const [pile,expected] of [[[],18],[['energy-plasma'],30],[['energy-plasma','energy-plasma-r'],42]]){
  const b=battle();b.sides.A.energyPile=[...pile];
  const r=play(b,'A',[c.id]),e=shots(r)[0];
  assert.equal(e.impacts[0].nominalDamage,expected);
  assert.deepEqual(r.battle.sides.A.energyPile,pile,'consumo Energia non approvato');
 }
});
test('Ariete Acqua: 22/36/48 HP nominali in base alla pila, senza alterare l Energia',()=>{
 const c=named('Ariete delle Fosse Abissali');
 for(const [pile,expected] of [[[],22],[['energy-refrigerant'],36],[['energy-refrigerant','energy-refrigerant'],48]]){
  const b=battle();b.sides.A.energyPile=pile;
  const r=play(b,'A',[c.id]);assert.equal(shots(r)[0].impacts[0].nominalDamage,expected);
  assert.deepEqual(r.battle.sides.A.energyPile,pile);
 }
});
test('Compressore Ghiaccio: 18+10 per carica fino a due; Energia multi-carica inclusa',()=>{
 const c=named('Cannone a Compressione Criogenica d’Impulso');
 const b=battle();b.sides.A.energyPile=[{id:'energy-cryogenic-r',elementId:'cryogenic',remaining:2}];
 const r=play(b,'A',[c.id]),e=shots(r)[0];
 assert.deepEqual(e.impacts.map(h=>h.nominalDamage),[18,10,10]);
 assert.deepEqual(r.battle.sides.A.energyPile,b.sides.A.energyPile);
});
test('Diffusore: tre bersagli Acqua con due Carte Energia, 16 HP ciascuno',()=>{
 const c=named('Diffusore di Marea a Ventaglio'),b=battle(true);
 b.sides.A.energyPile=['energy-refrigerant','energy-refrigerant'];
 const r=play(b,'A',[c.id]),e=shots(r)[0];
 assert.deepEqual(e.impacts.map(h=>h.nominalDamage),[16,16,16]);
 assert.equal(e.hitCount,3);
});
test('Idrocannone a Doppia Mandata: un colpo per turno proprio, totale due',()=>{
 const c=named('Idrocannone a Doppia Mandata');
 let b=play(battle(),'A',[c.id]).battle;
 b=play(b,'B').battle;
 const r=play(b,'A');
 assert.equal(shots(r).length,1);assert.equal(shots(r)[0].repeatTurn,true);
 b=play(r.battle,'B').battle;
 assert.equal(b.sides.A.machines.some(m=>m.sourceCardId===c.id),false);
 assert.equal(shots(play(b,'A')).length,0);
});
test('Cannone del Giudizio Temporale legge la barra HP massima della nave madre, non gli HP del vitale',()=>{
 const c=named('Cannone del Giudizio Temporale'),r=play(battle(),'A',[c.id]),e=shots(r)[0];
 assert.equal(e.impacts[0].nominalDamage,1000);
 assert.ok(e.actualDamage>0);
});
test('Le quattro vecchie Carte Arma rimangono nel catalogo separato',()=>{
 for(const id of ['weapon-memory-plasma','weapon-sequence-1','weapon-sequence-2','weapon-sequence-3']){
  assert.ok(card(id));assert.equal(card(id).playable,true);
 }
});

test('La plancia mostra il danno nominale delle Armi progettate, non zero',()=>{
 for(const [name,expected] of [
  ['Batteria Termica a Tre Ugelli',14],
  ['Cannone Condensatore Pirobalistico',18],
  ['Ariete delle Fosse Abissali',22],
  ['Idrocannone a Doppia Mandata',21]
 ]){
  const c=named(name),b=play(battle(),'A',[c.id]).battle;
  const berth=projectMachineBerths(b.sides.A,[],0).find(x=>x?.sourceCardId===c.id);
  assert.ok(berth,name);
  assert.equal(berth.nominalDamage,expected,name);
 }
 const giu=named('Cannone del Giudizio Temporale');
 const gameState=play(battle(),'A',[giu.id]).battle;
 const berth=projectMachineBerths(gameState.sides.A,[],0).find(x=>x?.sourceCardId===giu.id);
 assert.equal(berth.damagePercent,20);
 assert.equal(berth.nominalDamage,undefined,'il 20% non è un danno fisso');
});
