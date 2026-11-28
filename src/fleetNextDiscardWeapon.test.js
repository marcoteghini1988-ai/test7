// Collaudo dell'Arma di Supporto confermata: scarti personali + elemento Fuoco.
// I numeri sono quelli approvati, non un bilanciamento economico.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DISCARD_WEAPON,DISCARD_WEAPON_ID,card,cardRole,cardFacePath,cardCopyLimit}
 from './fleetNext/rules.js';
import {describeEffect,validateEffectSpec} from './fleetNext/simpleEffects.js';
import {discardWeaponCharge,arsenalBonus,TEMP_WEAPON_DURATION}
 from './fleetNext/newCardEffects.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn}
 from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetInventory,normalizeFleetInventory}
 from './fleetNext/collection.js';
import {canSelectNewGeneric,buildNextBaseDeck,buyNextCommonCard,NEXT_COMMON_AVAILABLE}
 from './fleetNext/nextDeckLoadout.js';
import {projectMachineBerths} from './fleetNext/battlePresentation.js';

const W=DISCARD_WEAPON_ID;
const ATTACKS=['sys-command-minus-c','sys-weapons-minus-c',
 'sys-generator-minus-c','sys-bridge-minus-c','atk-dismantle-c'];
const machine=()=>({
 id:'test-weapon',slot:0,sourceCardId:W,hp:1,maxHp:1,power:1,
 damageMode:DISCARD_WEAPON.effectSpec.damageMode,
 weaponElementId:DISCARD_WEAPON.effectSpec.elementId,
 baseDamage:DISCARD_WEAPON.effectSpec.baseDamage,
 perDiscardAttack:DISCARD_WEAPON.effectSpec.perDiscardAttack,
 energyMultiplier:DISCARD_WEAPON.effectSpec.energyMultiplier,
 maxNominalDamage:DISCARD_WEAPON.effectSpec.maxNominalDamage,
 untilPly:2,destroyed:false
});
const charge=(own=[],enemy=[])=>{
 const side={discard:[...own]},rival={discard:[...enemy]};
 const before=JSON.stringify({side,rival});
 const result=discardWeaponCharge(side,machine(),cardRole);
 assert.equal(JSON.stringify({side,rival}),before,'il conteggio non altera gli scarti');
 return result;
};
function battle(){
 const b=createFleetNextBattle({
  shipA:'C01',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,
  deckA:[],deckB:[],seed:9301,nowMs:0
 });
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(15).fill('gen-216');side.discard=[];
 }
 b.sides.B.ships[0].hp=500;
 b.sides.B.ships[0].maxHp=500;
 return b;
}
function fire(b,who='A',cards=[W],order={}){
 const side=b.sides[who];
 side.hand=[...cards];
 const result=resolveFleetNextTurn(b,who,{
  cards:cards.map((_,i)=>i),pass:false,
  targetKind:'part',targetId:'weapons',partId:'weapons',...order
 },1000+b.ply*30000);
 assert.equal(result.ok,true,result.reason);
 return result;
}
const event=(result)=>result.events.find(e=>e.kind==='weapon-discard'&&e.cardId===W);

test('Registro ufficiale: arma Fuoco, un turno, rarità e acquisto ancora in sospeso',()=>{
 assert.equal(card(W),DISCARD_WEAPON);
 assert.equal(cardRole(W),'support');
 assert.equal(cardFacePath(W),null);
 assert.equal(cardCopyLimit(W),1);
 assert.equal(DISCARD_WEAPON.rarita,'Epica');
 assert.equal(DISCARD_WEAPON.rarityPending,false);
 assert.equal(DISCARD_WEAPON.copyLimitPending,false);
 assert.equal(DISCARD_WEAPON.acquisitionPending,true);
 assert.equal(DISCARD_WEAPON.elementId,'plasma');
 assert.equal(DISCARD_WEAPON.effectSpec.baseDamage,10);
 assert.equal(DISCARD_WEAPON.effectSpec.perDiscardAttack,10);
 assert.equal(DISCARD_WEAPON.effectSpec.energyMultiplier,2);
 assert.equal(DISCARD_WEAPON.effectSpec.maxNominalDamage,120);
 assert.equal(TEMP_WEAPON_DURATION[W],1);
 assert.equal(validateEffectSpec(DISCARD_WEAPON.effectSpec),null);
 assert.equal(describeEffect(DISCARD_WEAPON),DISCARD_WEAPON.effectProposed);
 assert.equal(canSelectNewGeneric(W),true);
 assert.equal(NEXT_COMMON_AVAILABLE.some(c=>c.id===W),true);
 const inv=createFleetInventory();
 assert.equal(inv.owned[W]||0,0,'non assegnare carte gratuitamente');
 assert.equal(buyNextCommonCard(inv,W).ok,false,'prezzi ancora da definire');
 inv.owned[W]=1;
 const saved=normalizeFleetInventory(inv);
 assert.equal(saved.owned[W],1);
 const loadout=buildNextBaseDeck(saved,'C01',20,[W]);
 assert.deepEqual(loadout.baseDeck,[W]);
});

test('Zero Attacchi scartati = 10 HP nominali',()=>{
 assert.deepEqual(charge([]),{attackCards:0,energyMatched:false,multiplier:1,
  rawDamage:10,damage:10,elementId:'plasma'});
});

test('Tre Attacchi scartati = 40 HP; cinque = 60 HP',()=>{
 assert.equal(charge(ATTACKS.slice(0,3)).damage,40);
 assert.equal(charge(ATTACKS).damage,60);
});

test('Cinque Attacchi personali e almeno una Riserva Braciotramata negli scarti = 120 HP',()=>{
 const r=charge([...ATTACKS,'energy-plasma']);
 assert.equal(r.attackCards,5);
 assert.equal(r.energyMatched,true);
 assert.equal(r.multiplier,2);
 assert.equal(r.damage,120);
});

test('Finisher bilanciato: gli scarti continuano a contare ma la scarica non supera 120 HP',()=>{
 const many=Array(25).fill(ATTACKS[0]);
 const plain=charge(many),boosted=charge([...many,'energy-plasma']);
 assert.equal(plain.attackCards,25);
 assert.equal(plain.rawDamage,260);
 assert.equal(plain.damage,120);
 assert.equal(boosted.rawDamage,260);
 assert.equal(boosted.multiplier,2);
 assert.equal(boosted.damage,120);
 const b=battle();b.sides.A.discard=[...many,'energy-plasma'];
 const r=fire(b);
 assert.equal(event(r).nominalDamage,120);
});

test('Tre cariche di Fuoco non producono triplo o quadruplo bonus',()=>{
 const r=charge([...ATTACKS,'energy-plasma','energy-plasma','energy-plasma']);
 assert.equal(r.damage,120);
 assert.equal(r.multiplier,2);
});

test('Una Riserva Braciotramata di qualsiasi rarità negli scarti attiva il bonus una sola volta',()=>{
 for(const id of ['energy-plasma','energy-plasma-r','energy-plasma-e','energy-plasma-l']){
  const r=charge([...ATTACKS,id]);
  assert.equal(r.energyMatched,true,id);
  assert.equal(r.damage,120,id);
 }
});

test('Energia di altro elemento non raddoppia',()=>{
 const r=charge([...ATTACKS,'energy-ionic','energy-refrigerant']);
 assert.equal(r.damage,60);
 assert.equal(r.energyMatched,false);
});

test('Gli Attacchi e le Energie nello scarto avversario non danno bonus',()=>{
 const r=charge([], [...ATTACKS,'energy-plasma','energy-plasma']);
 assert.equal(r.attackCards,0);
 assert.equal(r.energyMatched,false);
 assert.equal(r.damage,10);
});

test('Non contare Personaggi, Trappole, supporti, Fusioni, Energie come Attacchi',()=>{
 const own=['gen-216','trap-fusion-denial','energy-plasma',
  'fusion-ship-r01','prog-machine-striker',...ATTACKS];
 const r=charge(own);
 assert.equal(r.attackCards,5);
 assert.equal(r.damage,120);
});

test('Il bersaglio non può iniettare conteggi usando ID ritirati o ignoti',()=>{
 const r=charge(['gen-001','fake-attack',...ATTACKS.slice(0,2)]);
 assert.equal(r.attackCards,2);
 assert.equal(r.damage,30);
});

test('La formula funziona davvero nella risoluzione di battaglia a 0, 5 e 5+Energia',()=>{
 for(const [cards,expected,hasEnergy] of [
  [[],10,false],[ATTACKS,60,false],[ATTACKS,120,true]
 ]){
  const b=battle();
  b.sides.A.discard=[...cards,...(hasEnergy?['energy-plasma']:[])];
  const oldEnemy=structuredClone(b.sides.B.ships[0]);
  const result=fire(b);
  const fx=event(result);
  assert.ok(fx,'evento Arma mancante');
  assert.equal(fx.nominalDamage,expected);
  assert.equal(fx.appliedPower,expected);
  assert.equal(fx.attackCards,cards.length);
  assert.equal(fx.energyMatched,hasEnergy);
  assert.equal(result.battle.sides.A.machines.length,1);
  assert.equal(result.battle.sides.A.machines[0].weaponElementId,'plasma');
  assert.equal(result.battle.sides.A.machines[0].untilPly,2);
  assert.equal(result.battle.sides.B.ships[0].hp<oldEnemy.hp,true,
   'il colpo deve raggiungere gli HP reali del nemico');
  assert.ok(result.shot.power>=expected);
  assert.equal(result.battle.sides.A.discard.includes(W),false,
   'l’Arma rimane nello slot durante il turno di utilizzo');
 }
});

test('Stessa partita e stessi attributi: 5 Attacchi aumentano la potenza di 60 esatti',()=>{
 const baseline=battle(),modified=battle();
 modified.sides.A.discard=[...ATTACKS];
 const noWeapon=fire(baseline,'A',[]);
 const withWeapon=fire(modified,'A',[W]);
 assert.equal(withWeapon.shot.power-noWeapon.shot.power,60);
 assert.equal(event(withWeapon).nominalDamage,60);
});

test('Il danno applicato rispetta il target e non può diventare HP negativi',()=>{
 const b=battle();
 b.sides.B.ships[0].maxHp=42;b.sides.B.ships[0].hp=42;
 b.sides.A.discard=[...ATTACKS,'energy-plasma'];
 const result=fire(b);
 assert.equal(event(result).nominalDamage,120);
 assert.ok(result.battle.sides.B.ships[0].hp>=0);
 assert.ok(result.battle.sides.B.ships[0].hp<=42);
});

test('Arma attiva solo il turno di giocata: poi è scartata e non torna a sparare',()=>{
 let b=battle();
 b.sides.A.discard=[...ATTACKS];
 const first=fire(b);
 b=first.battle;
 assert.equal(b.sides.A.machines.some(m=>m.sourceCardId===W),true);
 b.sides.B.hand=[];
 const enemyTurn=fire(b,'B',[],{pass:true});
 b=enemyTurn.battle;
 assert.equal(b.sides.A.machines.some(m=>m.sourceCardId===W),false,
  'all’inizio del turno successivo la carta deve essere scartata');
 assert.equal(b.sides.A.discard.includes(W),true);
 const next=fire(b,'A',[]);
 assert.equal(next.events.some(e=>e.kind==='weapon-discard'),false);
});

test('Se il giocatore passa, nessun danno automatico viene inflitto',()=>{
 const b=battle();b.sides.A.discard=[...ATTACKS];
 const before=b.sides.B.ships[0].hp;
 const result=fire(b,'A',[W],{pass:true});
 assert.equal(result.battle.sides.B.ships[0].hp,before);
 assert.ok(!event(result),'nessun evento di sparo quando si passa');
});

test('La Riserva Braciotramata giocata resta nella pila e NON negli scarti, quindi non amplifica subito l Arma',()=>{
 const b=battle();
 const result=fire(b,'A',[W,'energy-plasma']);
 assert.equal(event(result).nominalDamage,10);
 assert.equal(result.battle.sides.A.discard.includes('energy-plasma'),false);
 assert.deepEqual(result.battle.sides.A.energyPile,['energy-plasma']);
});

test('Il bonus non bypassa il sabotaggio dell’Arsenale',()=>{
 const side={ruleset:HP_SYNC_RULESET,discard:[...ATTACKS],
  machines:[machine()],
  systemCardEffects:[{id:'sys-weapons-minus-l',system:'weapons',
   operation:'disable',tier:4,amount:2,appliedPly:0,untilPly:4}]};
 const q=discardWeaponCharge(side,machine(),cardRole);
 assert.equal(q.damage,60);
 assert.equal(arsenalBonus(side,machine(),0,q.damage),0);
});

test('Collasso dei Due Campi rimuove un’Arma già montata e la manda negli scarti',()=>{
 let b=battle();
 b=fire(b).battle;
 assert.equal(b.sides.A.machines.length,1);
 b.sides.B.hand=['sys-black-hole'];
 const result=fire(b,'B',['sys-black-hole'],{pass:true});
 assert.ok(result.events.some(e=>e.kind==='field-reset'));
 assert.equal(result.battle.sides.A.machines.length,0);
 assert.equal(result.battle.sides.A.discard.includes(W),true);
});

test('Due slot occupati: nuova Arma respinta senza consumare la mano',()=>{
 const b=battle();
 b.sides.A.machines=[{...machine(),id:'first',slot:0},
  {...machine(),id:'second',slot:1}];
 b.sides.A.hand=[W];
 const before=JSON.stringify(b);
 const reason=validateFleetTurn(b,'A',{cards:[0],pass:true});
 assert.match(reason,/alloggiamenti|macchine/i);
 const result=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(result.ok,false);
 assert.equal(JSON.stringify(b),before);
});

test('L’Arma è visibile negli alloggiamenti ufficiali e non nella corsia Attacco',()=>{
 let b=battle();
 const played=fire(b);
 b=played.battle;
 const berths=projectMachineBerths(b.sides.A);
 assert.equal(berths.length,2);
 assert.equal(berths[0].sourceCardId,W);
 assert.equal(berths[1],null);
 assert.ok(!b.sides.A.attackSlots.includes(W));
});

test('La stessa meccanica funziona per il secondo giocatore, usando i suoi scarti',()=>{
 const b=battle();
 b.sides.A.discard=[...ATTACKS,'energy-plasma'];
 b.sides.A.hand=[];
 const passed=fire(b,'A',[],{pass:true});
 const two=passed.battle;
 two.sides.B.discard=[...ATTACKS];
 const result=fire(two,'B');
 assert.equal(event(result).nominalDamage,60);
 assert.equal(event(result).energyMatched,false);
 assert.equal(result.battle.sides.B.machines[0].sourceCardId,W);
});
