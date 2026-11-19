// Audit dinamico della fase carte confermate: niente Personaggi o Terreni.
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardRole,EXCLUSIVE_CARDS,NEXT_COMMON_CARDS,DISMANTLE_CARDS,
 ENERGY_CARDS,FUSION_SHIP_CARDS,FUSION_DENIAL_TRAP,
 DISCARD_WEAPON,TEMP_SUPPORT_WEAPONS} from './fleetNext/rules.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {activeFleetElements} from './fleetNext/elementalAffinities.js';
import {elementalDamagePercent,applyElementalDamage,
 BALANCED_ELEMENTAL_DISADVANTAGE} from './fleetNext/elementalDamage.js';
import {exclusiveAttackCardDamage} from './fleetNext/confirmedCardBalance.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,
 validateFleetTurn,protectingFleetUnits} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {FLEET_PACING_WINDOWS} from './fleetNext/battlePacing.js';

const sampleRoster=(first=0)=>[0,1].map((step,slot)=>{
 const ship=SUPPORT_CATALOG[(first+step)%SUPPORT_CATALOG.length];
 return {id:ship.id,instanceId:'balance:'+first+':'+slot,slot,rarita:'Leggendaria'};
});
const genericDeck=shipId=>{
 const elements=activeFleetElements(shipId,99);
 const energy=elements.flatMap((element,i)=>Array(i===0?4:2).fill('energy-'+element));
 return [...energy,
  FUSION_SHIP_CARDS[0].id,FUSION_SHIP_CARDS[1].id,
  FUSION_DENIAL_TRAP.id,DISCARD_WEAPON.id,
  ...TEMP_SUPPORT_WEAPONS.map(c=>c.id),
  ...NEXT_COMMON_CARDS.filter(c=>c.id!=='sys-black-hole'&&c.id!=='sys-command-minus-l').map(c=>c.id),
  'sys-black-hole',...DISMANTLE_CARDS.map(c=>c.id)
 ].slice(0,30);
};
function readyBattle(shipA,shipB,{bossId=null,supports=true,seed=1977}={}){
 const b=createFleetNextBattle({shipA,shipB,
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:supports?sampleRoster(0):[],
  supportRosterB:supports?sampleRoster(3):[],
  ruleset:HP_SYNC_RULESET,mode:bossId==null?'pvp':'campaign',bossId,
  deckA:genericDeck(shipA),deckB:genericDeck(shipB),seed,nowMs:0});
 for(const side of Object.values(b.sides)){
  const pool=[...side.hand,...side.deck].filter(id=>
   !['character','terrain'].includes(cardRole(id)));
  while(pool.length<40){
   const extra=NEXT_COMMON_CARDS.find(c=>!pool.includes(c.id));
   assert.ok(extra);
   pool.push(extra.id);
  }
  assert.equal(pool.length,40);
  assert.ok(pool.every(id=>card(id)&&!['character','terrain'].includes(cardRole(id))));
  side.hand=pool.slice(0,7);side.deck=pool.slice(7);side.discard=[];
 }
 return b;
}
function fallback(b){
 const enemy=b.sides[b.turn==='A'?'B':'A'];
 const guard=protectingFleetUnits(enemy,b.ply)[0];
 return guard?{cards:[],pass:false,targetKind:guard.kind,targetId:guard.id,
   ...(guard.kind==='escort'?{escortSlot:guard.slot}:{})}:
  {cards:[],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
}
function simulate(shipA,shipB,options={}){
 let b=readyBattle(shipA,shipB,options),turns=0,playedCards=0,
  invalidAiPlans=0,specials=0,traps=0,fusions=0;
 while(b.phase==='playing'&&turns<90){
  let order=autoFleetTurn(b,b.turn);
  if(validateFleetTurn(b,b.turn,order)){
   invalidAiPlans++;
   order=fallback(b);
  }
  const r=resolveFleetNextTurn(b,b.turn,order,b.turnStartedAtMs+15000);
  assert.equal(r.ok,true,shipA+'/'+shipB+' '+b.turn+': '+r.reason);
  playedCards+=(order.cards||[]).length;
  specials+=r.events.filter(e=>e.kind==='elemental-special').length;
  traps+=r.events.filter(e=>e.kind==='trap-reveal').length;
  fusions+=r.events.filter(e=>e.kind==='fusion').length;
  b=r.battle;turns++;
  assert.ok(b.sides.A.ships[0].hp>=0&&b.sides.B.ships[0].hp>=0);
 }
 assert.equal(b.phase,'finished','Duello non concluso in 90 turni: '+shipA+'/'+shipB);
 return {a:shipA,b:shipB,boss:options.bossId||null,turns,seconds:
  Math.round((b.finishedAtMs??b.turnStartedAtMs)/1000),
  cards:playedCards,specials,traps,fusions,invalidAiPlans,winner:b.winner};
}

test('Le 34 Carte Attacco esclusive hanno danno tecnico scalabile, senza intaccare gli effetti storici',()=>{
 const attacks=Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='attack');
 assert.equal(attacks.length,34);
 for(const c of attacks){
  assert.equal(cardRole(c.id),'attack');
  assert.ok(c.shipId);
 }
 const mother={attackPower:120,defensePercent:10,maxHp:1000};
 const values=[1,2,3,4].map(i=>exclusiveAttackCardDamage(i,mother,true));
 assert.deepEqual(values,[66,102,142,180]);
 assert.equal(exclusiveAttackCardDamage(3,mother,false),3);
 assert.equal(exclusiveAttackCardDamage(120,mother,true),120);
 assert.equal(exclusiveAttackCardDamage(3,{attackPower:120},true),3);
});

test('Svantaggio elementale bilanciato conserva il sistema storico e il vantaggio +25%',()=>{
 assert.equal(BALANCED_ELEMENTAL_DISADVANTAGE,75);
 assert.equal(elementalDamagePercent('plasma','refrigerant'),50);
 assert.equal(elementalDamagePercent('plasma','refrigerant',true),75);
 assert.equal(elementalDamagePercent('refrigerant','plasma',true),125);
 const modern={ships:[{maxHp:1000,defensePercent:10}],elementalDamageRemainders:{}};
 const legacy={elementalDamageRemainders:{}};
 assert.equal(applyElementalDamage(modern,'plasma','refrigerant',100).damage,75);
 assert.equal(applyElementalDamage(legacy,'plasma','refrigerant',100).damage,50);
});

test('Registro completo per il primo bilanciamento: esclusi Personaggi e Terreni',()=>{
 const exclusive=Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind!=='character');
 assert.equal(exclusive.length,108);
 const groups={};for(const c of exclusive)groups[c.kind]=(groups[c.kind]||0)+1;
 assert.ok(groups.attack>=34&&groups.defense>=21);
 assert.equal(FUSION_SHIP_CARDS.length,13);
 assert.equal(FUSION_DENIAL_TRAP.rarita,'Epica');
 assert.equal(FUSION_DENIAL_TRAP.maxCopiesPerDeck,1);
 assert.equal(ENERGY_CARDS.length,10);
 assert.equal(TEMP_SUPPORT_WEAPONS.length,4);
 assert.equal(NEXT_COMMON_CARDS.length,33);
 assert.equal(DISMANTLE_CARDS.length,4);
 const list=[...exclusive,...NEXT_COMMON_CARDS,...DISMANTLE_CARDS,
  ...FUSION_SHIP_CARDS,...ENERGY_CARDS,...TEMP_SUPPORT_WEAPONS,
  FUSION_DENIAL_TRAP,DISCARD_WEAPON];
 assert.ok(list.every(c=>card(c.id)?.playable!==false));
 assert.equal(new Set(list.map(c=>c.id)).size,list.length);
});

test('Impatto reale di un Attacco esclusivo contro supporto Leggendario',()=>{
 const b=createFleetNextBattle({shipA:'C01',shipB:'C02',raritaA:'Leggendaria',
  raritaB:'Leggendaria',supportRosterA:[],supportRosterB:sampleRoster(0).slice(0,1),
  deckA:[],deckB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,seed:1000});
 b.sides.A.hand=['nx-c01-03'];
 const target=b.sides.B.escorts[0];
 const old=target.hp;
 const r=resolveFleetNextTurn(b,'A',{
  cards:[0],pass:false,targetKind:'escort',targetId:target.id,
  escortSlot:target.slot,partId:'weapons'
 },1000);
 assert.equal(r.ok,true,r.reason);
 const after=r.battle.sides.B.escorts[0].hp;
 assert.ok(old-after>=20,'l Attacco non deve rimanere ad un danno irrilevante');
});

test('Matrice esplorativa PvP con mazzi da 40, 2 supporti e carte approvate, senza Personaggi/Terreni',()=>{
 const cases=[['L04','L03'],['N00','R02'],['C01','L04'],['R04','E01'],['E02','C02']];
 const reports=cases.map(([a,b],i)=>simulate(a,b,{seed:1760+i}));
 assert.equal(reports.length,5);
 assert.ok(reports.every(r=>r.seconds>0&&r.turns<90));
 assert.equal(FLEET_PACING_WINDOWS.pvp.targetSeconds,300);
 console.log('BALANCE_APPROVED_CARDS_PVP='+JSON.stringify(reports));
});

test('Diagnosi boss con carte approvate e flotta, senza modificare Terreni/Personaggi',()=>{
 const reports=[simulate('L04','L03',{bossId:8,seed:3391}),
  simulate('R02','L01',{bossId:17,seed:3392})];
 assert.equal(reports.length,2);
 assert.ok(reports.every(r=>r.turns>0));
 assert.equal(FLEET_PACING_WINDOWS.boss.targetSeconds,540);
 console.log('BALANCE_APPROVED_CARDS_BOSS='+JSON.stringify(reports));
});
