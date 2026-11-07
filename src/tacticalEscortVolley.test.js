import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {ESCORT_ARMORY} from './escortArmory.js';
import {selectTacticalEscortForAmmo,prepareTacticalEscortVolley,TACTICAL_ESCORT_PACKET_CAP}
 from './tacticalEscortVolley.js';
import {tacticalResonanceCooperationBonus,rememberTacticalResonanceCooperationHit,
 tacticalBossDeckReady} from './tacticalBossDecks.js';
import {createTacticalDuel,validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel}
 from './simultaneousDuelEngine.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

const EMPTY={numericIndices:[],specialIndices:[]};
function create(level=5,bossDeck=null){
 const b=createTacticalDuel({shipA:'R04',levelA:level,shipB:'C01',levelB:1,
  bossNumericDeckA:bossDeck?{id:'planet_char_17',level:bossDeck}:null});
 b.sides.B.defense.shield.hp=300;
 b.sides.B.defense.shield.max=300;
 return b;
}
function turn(b,ammo=null,at=100,extra={}){
 const a=sealTacticalOrder(b,'A',{...EMPTY,escortAmmoIndex:ammo,...extra},at);
 assert.equal(a.ok,true,a.reason);
 const c=sealTacticalOrder(a.battle,'B',EMPTY,at+1);
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,at+1);
}
const next=b=>advanceTacticalDuel(b,b.resolveUntilMs);
const impact=b=>b.history.at(-1).impacts.find(p=>p.kind==='escort_barrier'&&p.by==='A');
const ids=p=>[...p.hand,...p.deck,...p.discard].map(c=>c.id);

test('Tutti i 17 scafi usano i due profili di armi scudiera GIA ESISTENTI',()=>{
 assert.equal(Object.keys(ESCORT_ARMORY).length,17);
 for(const ship of PHASE1_CATALOG.ships){
  const side=createTacticalDuel({shipA:ship.id,levelA:5}).sides.A;
  assert.equal(side.escorts.length,2,ship.id);
  assert.equal(side.escorts[0].weapon.name,ESCORT_ARMORY[ship.id][0].name);
  assert.equal(side.escorts[1].weapon.name,ESCORT_ARMORY[ship.id][1].name);
  assert.ok(side.escorts.every(e=>e.weapon.sourceWeaponId&&e.weapon.damage>0&&e.hp===20));
 }
});

test('Munizione autentica: una delle 7 numeriche alimenta UNA scudiera e viene scartata davvero',()=>{
 const b=create();
 const before=structuredClone(b.sides.A.numeric);
 assert.equal(b.sides.A.escorts[0].weapon.name,'Scudo del Vuoto');
 const r=turn(b,3);
 const shot=impact(r);
 assert.ok(shot);
 assert.ok(shot.damage>0);
 assert.ok(shot.packet<=TACTICAL_ESCORT_PACKET_CAP);
 assert.equal(shot.escortSlot,0);
 assert.equal(shot.cardId,b.sides.A.numeric.hand[3].id);
 assert.equal(shot.escortWeaponId,b.sides.A.escorts[0].weapon.id);
 assert.equal(r.sides.A.numeric.hand.length,7);
 assert.equal(r.sides.A.numeric.discard.some(c=>c.id===before.hand[3].id),true);
 assert.equal(new Set(ids(r.sides.A.numeric)).size,52);
 assert.deepEqual(new Set(ids(r.sides.A.numeric)),new Set(ids(before)));
 assert.equal(b.history.length,0,'Il motore iniziale rimane immutato');
 assert.ok(r.lastEvents.some(e=>e.includes('Scudo del Vuoto')&&e.includes('numerica')));
});

test('Senza selezione, scudiere difendono soltanto, nessun colpo o cartuccia gratuita',()=>{
 const r=turn(create());
 assert.equal(impact(r),undefined);
 assert.equal(r.sides.A.numeric.discard.length,0);
});

test('Protezione anti-doppio-spend: calcolo, ricambio, fusioni e scudiere senza munizioni',()=>{
 const b=create();
 assert.equal(validateTacticalOrder(b,'A',{
  numericIndices:[0,1],vitalId:'weapons',op:'minus',escortAmmoIndex:0
 }).reason,'card_double_spend');
 assert.equal(validateTacticalOrder(b,'A',{
  numericIndices:[],exchangeIndices:[3],escortAmmoIndex:3
 }).reason,'card_double_spend');
 assert.equal(validateTacticalOrder(b,'A',{
  numericIndices:[],specialIndices:[3],escortAmmoIndex:3
 }).reason,'escort_tactical_conflict');
 assert.equal(validateTacticalOrder(create(1),'A',{
  numericIndices:[],escortAmmoIndex:3
 }).reason,'escort_ammo_unavailable');
 assert.equal(validateTacticalOrder(b,'A',{
  numericIndices:[],escortAmmoIndex:8
 }).reason,'escort_selection');
 assert.equal(selectTacticalEscortForAmmo(b.sides.A,{suit:'?',value:9}),null);
});

test('Scudiera ad Accumulo conserva munizioni vere fino alla soglia, senza proiettili prematuri',()=>{
 let b=create();
 b=turn(b,4); // 7 Picche -> Squalo Siluro, soglia 13
 assert.equal(impact(b),undefined);
 assert.equal(b.sides.A.escorts[1].weapon.charge,7);
 assert.ok(b.lastEvents.some(e=>e.includes('ricarica 7/13')));
 b=turn(next(b),2,8200); // 5 Cuori -> totale12, ancora non spara
 assert.equal(impact(b),undefined);
 assert.equal(b.sides.A.escorts[1].weapon.charge,12);
 b=turn(next(b),3,16400); // 7 Cuori -> spara con 13, residuo6
 assert.ok(impact(b).packet>0);
 assert.equal(impact(b).escortSlot,1);
 assert.equal(b.sides.A.escorts[1].weapon.charge,6);
 assert.equal(b.sides.A.numeric.discard.length,3);
 assert.equal(new Set(ids(b.sides.A.numeric)).size,52);
});

test('Risonanza L7-L9: Sinfonia solo quando madre E scudiera danneggiano la barriera',()=>{
 assert.equal(tacticalBossDeckReady('planet_char_17'),true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_17',
  bossDeckInventory:{planet_char_17:{unlocked:true,level:9}}}).enabled,true);
 assert.equal(officialSimultaneousEligibility({gameMode:'campaign',sectorNumber:1,
  selectedBossDeck:'planet_char_17',bossDeckInventory:{}}).enabled,false);
 for(const [level,pct]of [[6,0],[7,3],[8,5],[9,7]]){
  const r=turn(create(5,level),3);
  assert.ok(r.history[0].impacts.some(x=>x.kind==='barrier'&&x.by==='A'&&x.damage>0));
  assert.ok(impact(r).damage>0);
  assert.equal(r.lastEvents.some(s=>s.includes('Sinfonia di flotta')),level>=7);
  if(level>=7)assert.equal(r.sides.A.bossNumericDeck.resonanceEscortRemainder,
   (impact(r).packet*pct)%100);
 }
 const blocked=create(5,9);
 blocked.sides.B.defense.shield.hp=0;
 const r=turn(blocked,3);
 assert.equal(r.lastEvents.some(s=>s.includes('Sinfonia di flotta')),false);
 const s=create(5,9).sides.A;
 assert.equal(tacticalResonanceCooperationBonus(s,8,0).active,false);
 const bonus=tacticalResonanceCooperationBonus(s,8,10);
 assert.equal(bonus.percentage,7);
 rememberTacticalResonanceCooperationHit(s,0,bonus);
 assert.equal(s.bossNumericDeck.resonanceEscortRemainder,0);
 rememberTacticalResonanceCooperationHit(s,2,bonus);
 assert.equal(s.bossNumericDeck.resonanceEscortRemainder,56);
});

test('Una centralina compromessa riduce il colpo di scudiera senza disattivare il suo HP',()=>{
 const full=create(),damaged=create(),dead=create();
 damaged.sides.A.defense.parts.command.hp=5;
 dead.sides.A.defense.parts.command.hp=0;
 const a=turn(full,3),b=turn(damaged,3),c=turn(dead,3);
 assert.ok(impact(a).packet>=impact(b).packet);
 assert.ok(impact(b).packet>=impact(c).packet);
 assert.deepEqual(a.sides.A.escorts.map(e=>e.max),[20,20]);
 assert.deepEqual(c.sides.A.escorts.map(e=>e.max),[20,20]);
});
