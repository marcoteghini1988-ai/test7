// Regressioni sulle tre fasi dell'Cannone Acceleratore Trifase e sulle armi confermate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardRole,cardCopyLimit,cardFacePath,TEMP_SUPPORT_WEAPONS,SEQUENCE_WEAPON_IDS} from './fleetNext/rules.js';
import {validateEffectSpec,describeEffect} from './fleetNext/simpleEffects.js';
import {sequenceUpgradeTarget,arsenalBonus} from './fleetNext/newCardEffects.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {canSelectNewGeneric,buildNextBaseDeck,buyNextCommonCard,NEXT_COMMON_AVAILABLE} from './fleetNext/nextDeckLoadout.js';
import {projectMachineBerths} from './fleetNext/battlePresentation.js';

const [ONE,TWO,THREE]=SEQUENCE_WEAPON_IDS,MEMORY='weapon-memory-plasma';
const roster=n=>SUPPORT_CATALOG.slice(0,n).map((s,slot)=>({
 supportId:s.id,instanceId:'test-'+slot,slot,rarita:'Leggendaria'
}));
function battle(n=0){
 const b=createFleetNextBattle({shipA:'C01',shipB:'C01',raritaA:'Leggendaria',
  raritaB:'Leggendaria',supportRosterA:roster(n),supportRosterB:[],
  mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:9601,nowMs:0});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
 }
 b.sides.B.ships[0].hp=5000;b.sides.B.ships[0].maxHp=5000;
 return b;
}
function turn(b,who,cards=[],pass=false){
 b.sides[who].hand=[...cards];
 const r=resolveFleetNextTurn(b,who,{
  cards:cards.map((_,i)=>i),pass,
  targetKind:'part',targetId:'weapons',partId:'weapons'
 },1000+b.ply*30000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
const between=b=>turn(b,'B',[],true).battle;
const event=(result,kind)=>result.events.find(x=>x.kind===kind);

test('Tre carte Acceleratore registrate, testo valido, non distribuite e non acquistabili',()=>{
 const inv=createFleetInventory();
 for(const def of TEMP_SUPPORT_WEAPONS){
  assert.equal(card(def.id),def);
  assert.equal(cardRole(def.id),'support');
  assert.equal(cardFacePath(def.id),null);
  assert.equal(cardCopyLimit(def.id),1);
  assert.equal(def.rarita,{
   'weapon-sequence-1':'Comune','weapon-sequence-2':'Rara',
   'weapon-sequence-3':'Epica'
  }[def.id]);
  assert.equal(def.rarityPending,false);
  assert.equal(def.copyLimitPending,false);
  assert.equal(def.acquisitionPending,true);
  assert.equal(def.elementId,'ionic','Trifase usa l’elemento Fulmine');
  assert.equal(def.effectSpec.elementId,'ionic');
  assert.equal(def.elementPending,false,'l’elemento è definitivo');
  assert.equal(validateEffectSpec(def.effectSpec),null);
  assert.equal(describeEffect(def),def.effectProposed);
  assert.equal(canSelectNewGeneric(def.id),true);
  assert.equal(NEXT_COMMON_AVAILABLE.includes(def),true);
  assert.equal(inv.owned[def.id]||0,0);
  assert.equal(buyNextCommonCard(inv,def.id).ok,false);
  inv.owned[def.id]=1;
 }
 const saved=normalizeFleetInventory(inv);
 assert.deepEqual(buildNextBaseDeck(saved,'C01',20,[ONE,TWO,THREE]).baseDeck,
  [ONE,TWO,THREE]);
});


test('Tre prototipi esclusi dal catalogo e dal mazzo, anche con un vecchio salvataggio',()=>{
 const removed=['prog-machine-striker','prog-machine-guard','weapon-escort-charge'];
 const inv=createFleetInventory();
 for(const id of removed){
  assert.equal(card(id),null);
  assert.equal(canSelectNewGeneric(id),false);
  assert.equal(inv.owned[id]||0,0);
  assert.equal(NEXT_COMMON_AVAILABLE.some(def=>def.id===id),false);
  inv.owned[id]=1;
 }
 const normalized=normalizeFleetInventory(inv);
 for(const id of removed){
  assert.equal(normalized.owned[id],undefined);
  assert.equal(normalized.retiredOwned[id],1);
 }
 assert.deepEqual(buildNextBaseDeck(normalized,'C01',20,removed).baseDeck,[]);
});

test('Sequenza completa: I 10, II 30, III 70, stesso slot e scarti corretti',()=>{
 let b=battle(),r=turn(b,'A',[ONE]);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,10);
 assert.equal(r.battle.sides.A.machines[0].untilPly,4);
 const slot=r.battle.sides.A.machines[0].slot;
 b=between(r.battle);
 assert.ok(sequenceUpgradeTarget(b.sides.A,card(TWO),b.ply));
 r=turn(b,'A',[TWO]);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,30);
 assert.equal(event(r,'weapon-sequence')?.chained,true);
 assert.equal(event(r,'weapon-sequence-upgrade')?.previousCardId,ONE);
 assert.ok(r.battle.sides.A.discard.includes(ONE));
 assert.equal(r.battle.sides.A.machines.length,1);
 assert.equal(r.battle.sides.A.machines[0].slot,slot);
 b=between(r.battle);
 r=turn(b,'A',[THREE]);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,70);
 assert.equal(event(r,'weapon-sequence')?.chained,true);
 assert.equal(r.battle.sides.A.machines.some(m=>m.sourceCardId===TWO),false);
 assert.ok([...r.battle.sides.A.discard,...r.battle.sides.A.deck,...r.battle.sides.A.hand].includes(TWO),
  'la carta sostituita puo essere rimescolata fra mazzo e mano');
 b=between(r.battle);
 assert.equal(b.sides.A.machines.length,0);
 assert.ok([...b.sides.A.discard,...b.sides.A.deck,...b.sides.A.hand].includes(THREE),
  'anche la carta finale puo essere rimescolata');
});

test('Senza catena: I ripete 10 e scade; II e III isolate valgono 10 e 20',()=>{
 let b=battle(),r=turn(b,'A',[ONE]);
 b=between(r.battle);
 r=turn(b,'A',[]);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,10);
 b=between(r.battle);
 assert.equal(b.sides.A.machines.length,0);
 r=turn(b,'A',[TWO]);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,10);
 assert.equal(event(r,'weapon-sequence')?.chained,false);
 b=between(r.battle);
 assert.equal(b.sides.A.machines.length,0);
 assert.equal(sequenceUpgradeTarget(b.sides.A,card(THREE),b.ply),null);
 r=turn(b,'A',[THREE]);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,20);
 b=between(r.battle);
 assert.equal(b.sides.A.machines.length,0);
});

test('Vietate due carte sequenziali nello stesso turno senza perdere la mano',()=>{
 const b=battle();b.sides.A.hand=[ONE,TWO];
 const saved=JSON.stringify(b);
 const order={cards:[0,1],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
 assert.match(validateFleetTurn(b,'A',order),/Sequenza/i);
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,false);
 assert.equal(JSON.stringify(b),saved);
});

test('La II migliora la I anche con due alloggiamenti occupati',()=>{
 let b=battle(),r=turn(b,'A',[ONE,MEMORY]);
 assert.equal(r.battle.sides.A.machines.length,2);
 // Il Cannone dei Frammenti dura normalmente un turno: esteso qui per coprire lo slot occupato.
 r.battle.sides.A.machines.find(m=>m.sourceCardId===MEMORY).untilPly=100;
 b=between(r.battle);b.sides.A.hand=[TWO];
 const order={cards:[0],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
 assert.ok(!validateFleetTurn(b,'A',order));
 r=turn(b,'A',[TWO]);
 assert.equal(r.battle.sides.A.machines.length,2);
 assert.equal(event(r,'weapon-sequence')?.nominalDamage,30);
 assert.equal(event(r,'weapon-discard')?.nominalDamage,10);
});

test('La III senza II concatenata richiede slot libero',()=>{
 let b=battle(),r=turn(b,'A',[ONE,MEMORY]);
 r.battle.sides.A.machines.find(m=>m.sourceCardId===MEMORY).untilPly=100;
 b=between(r.battle);
 b.sides.A.hand=[THREE];
 const order={cards:[0],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
 assert.match(validateFleetTurn(b,'A',order),/alloggiamenti/i);
});

test('Le armi sono negli alloggiamenti, non negli slot delle carte Attacco',()=>{
 const r=turn(battle(2),'A',[ONE,MEMORY]);
 const berths=projectMachineBerths(r.battle.sides.A);
 assert.equal(berths[0].nominalDamage,10);
 assert.equal(berths[1].nominalDamage,10);
 assert.ok(!r.battle.sides.A.attackSlots.includes(ONE));
 assert.ok(!r.battle.sides.A.attackSlots.includes(MEMORY));
});

test('Collasso dei Due Campi rimuove le armi e le manda negli scarti',()=>{
 let b=turn(battle(),'A',[ONE,MEMORY]).battle;
 const r=turn(b,'B',['sys-black-hole'],true);
 assert.equal(r.battle.sides.A.machines.length,0);
 assert.ok(r.battle.sides.A.discard.includes(ONE));
 assert.ok(r.battle.sides.A.discard.includes(MEMORY));
});

test('Sabotaggio Arsenale annulla il contributo se il sistema e disabilitato',()=>{
 const m={id:'t',slot:0,hp:1,destroyed:false,power:1,damageMode:'discard-attacks',baseDamage:10,perDiscardAttack:10,weaponElementId:'plasma'};
 const side={ruleset:HP_SYNC_RULESET,machines:[m],discard:[],escorts:[{slot:0,hp:100}],
  systemCardEffects:[{system:'weapons',operation:'disable',tier:4,amount:2,appliedPly:0,untilPly:4}]};
 assert.equal(arsenalBonus(side,m,0,20),0);
});
