import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createFleetCardBattle,resolveFleetCardRound,selectFleetAiOrder,fleetSlotCount,
 FLEET_PARTS,FLEET_ELEMENTS,fleetCardEffect,fleetShipDestroyed,fleetSurvivors
} from './fleetCardEngine.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {FLEET_ESCORT_TRAITS} from './fleetEscortSupports.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';

const deck=()=>[...createSpecialCollection().loadout];
function fleet(idA='C01',idB='R04',levelA=1,levelB=1,extra={}){
 return createFleetCardBattle({shipsA:[{shipId:idA,level:levelA}],
  shipsB:[{shipId:idB,level:levelB}],deckA:deck(),deckB:deck(),
  seed:44,nowMs:1000,...extra});
}
const order=(partId='command',cards=[])=>({shipIndex:0,partId,cards});
const hit=(b,a=order(),c=order())=>{
 const r=resolveFleetCardRound(b,a,c,1000+b.round*1000);
 assert.equal(r.ok,true,r.reason);return r;
};
test('La progressione invariata dipende dal livello della MADRE, non dal settore',()=>{
 for(let level=1;level<=5;level++){
  assert.equal(fleetSlotCount(level),level>=5?3:level>=3?2:1);
 }
 assert.equal(fleetSlotCount(1,'pvp'),1);
 assert.equal(fleetSlotCount(3,'pvp'),2);
});
test('Un solo modello madre; le scudiere NON sono altre carte madre',()=>{
 const b=fleet('C01','R04',5,5);
 assert.equal(b.sides.A.ships.length,1);
 assert.equal(b.sides.B.ships.length,1);
 assert.equal(b.sides.A.escorts.length,2);
 assert.ok(b.sides.A.escorts.every(e=>e.parentShipId==='C01'));
 assert.equal(b.sides.A.ships[0].weapons[0],'Laser Rosso');
 assert.equal(b.sides.A.hand.length,5);
 assert.equal(b.sides.A.deck.length,19);
 assert.throws(()=>createFleetCardBattle({shipsA:[{shipId:'C01',level:5},{shipId:'R02',level:5}],
  shipsB:[{shipId:'R04',level:5}],deckA:deck(),deckB:deck()}),/sola carta madre/);
 assert.throws(()=>fleet('NON_ESISTE'),/catalogo ufficiale/);
});
test('Tutte le 17 madri generano gli stessi slot di evoluzione L3/L5 già esistenti',()=>{
 const models=new Set();
 for(const ship of PHASE1_CATALOG.ships)for(let level=1;level<=5;level++){
  const side=fleet(ship.id,'N00',level,1).sides.A;
  const expected=level<3?0:level<5?1:2;
  assert.equal(side.escorts.length,expected,ship.id+' L'+level);
  assert.equal(side.ships.length,1);
  for(const e of side.escorts){
   assert.equal(e.id,ship.id+':escort:'+(e.slot+1));
   assert.equal(e.visual,'/assets/escorts/'+ship.id+'_escort_'+(e.slot+1)+'.svg');
   assert.ok(e.hp>0&&e.maxHp>0);
   assert.equal(e.unlockLevel,e.slot===0?3:5);
   models.add(e.id);
  }
 }
 assert.equal(models.size,34);
 assert.equal(Object.keys(FLEET_ESCORT_TRAITS).length,17);
});
test('Quattro vitali senza vecchia barriera; due distrutti eliminano la madre',()=>{
 const b=fleet();
 const m=b.sides.A.ships[0];
 assert.deepEqual(m.parts.map(p=>p.id),FLEET_PARTS.map(x=>x.id));
 assert.equal(m.shield,0);assert.equal(m.maxShield,0);
 assert.ok(m.parts.every(x=>x.damage===0&&!x.destroyed));
 const r=hit(b);assert.ok(r.events[0].damage>0||r.events[0].strength===0);
 assert.equal(r.events[0].shieldsHit,0);
});
test('Solo la madre spara: una salva anche con due evoluzioni operative',()=>{
 const b=fleet('C01','C01',5,5);
 const r=hit(b);
 assert.equal(r.events[0].fireCount,1);
 assert.equal(r.events[1].fireCount,1);
 assert.equal(r.battle.sides.A.ships.length,1);
 assert.equal(r.battle.sides.B.ships.length,1);
});
test('Lince L3: scudiera difensiva assorbe tutta la salva',()=>{
 const b=fleet('C01','C01',1,3);
 const before=b.sides.B.ships[0].parts.find(p=>p.id==='command').damage;
 const r=hit(b);
 assert.ok(r.events[0].escortDamage>0);
 assert.equal(r.events[0].escortSlot,0);
 assert.equal(r.events[0].damage,0);
 assert.equal(r.battle.sides.B.ships[0].parts.find(p=>p.id==='command').damage,before);
 assert.ok(r.battle.sides.B.escorts[0].hp<b.sides.B.escorts[0].hp);
});
test('Danno residuo NON trapassa la scudiera distrutta nello stesso colpo',()=>{
 const b=fleet('C01','C01',1,3);
 b.sides.B.escorts[0].hp=1;
 const first=hit(b);
 assert.equal(first.events[0].escortDestroyed,true);
 assert.equal(first.events[0].damage,0);
 assert.equal(first.battle.sides.B.ships[0].parts.find(p=>p.id==='command').damage,0);
 const second=hit(first.battle);
 assert.equal(second.events[0].escortDamage,0);
 assert.ok(second.events[0].damage>0);
});
test('Distruggendo il Generatore della madre si interrompe il supporto collegato',()=>{
 const b=fleet('C01','C01',1,3);
 const generator=b.sides.B.ships[0].parts.find(p=>p.id==='generator');
 generator.damage=2;generator.destroyed=true;
 const r=hit(b);
 assert.equal(r.events[0].escortDamage,0);
 assert.ok(r.events[0].damage>0);
 assert.ok(r.battle.sides.B.escorts[0].hp>0);
});
test('La madre sconfitta termina la partita anche con scudiere ancora vive',()=>{
 const b=fleet('C01','R03',1,5);
 const mother=b.sides.B.ships[0];
 mother.parts.find(p=>p.id==='engine').damage=2;
 mother.parts.find(p=>p.id==='engine').destroyed=true;
 mother.parts.find(p=>p.id==='command').damage=1;
 const r=hit(b);
 assert.equal(r.battle.phase,'finished');
 assert.equal(r.battle.winner,'A');
 assert.ok(r.battle.sides.B.escorts.some(e=>e.hp>0));
});
test('Le speciali reali si consumano senza duplicare le 24 carte',()=>{
 const b=fleet();
 const played=[b.sides.A.hand[0],b.sides.A.hand[1]];
 const n=hit(b,order('command',[0,1])).battle;
 assert.equal(n.sides.A.discard.length,2);
 assert.deepEqual(n.sides.A.discard,[played[1],played[0]]);
 assert.equal(n.sides.A.hand.length,4);
 assert.equal(n.sides.A.hand.length+n.sides.A.deck.length+n.sides.A.discard.length,24);
 const bad=resolveFleetCardRound(b,order('command',[0,0]),order());
 assert.equal(bad.ok,false);
 assert.equal(b.sides.A.discard.length,0);
});
test('La scelta di un altra nave bersaglio è illegale; si può mirare ogni vitale',()=>{
 const b=fleet();
 assert.equal(resolveFleetCardRound(b,{shipIndex:1,partId:'command',cards:[]},order()).ok,false);
 for(const vital of FLEET_PARTS)assert.equal(hit(b,order(vital.id)).ok,true);
});
test('Elementi ufficiali sempre applicati al colpo della sola madre',()=>{
 assert.equal(FLEET_ELEMENTS.refrigerant.beats,'plasma');
 assert.equal(FLEET_ELEMENTS.plasma.beats,'mineral');
 assert.equal(FLEET_ELEMENTS.mineral.beats,'ionic');
 assert.equal(FLEET_ELEMENTS.ionic.beats,'refrigerant');
 const a=hit(fleet('C01','R04')).events[0];
 const b=hit(fleet('C01','C01')).events[0];
 assert.equal(a.advantage,true);assert.equal(b.advantage,false);
});
test('Due terreni opposti si annullano, terreni boss sono bloccati',()=>{
 const b=fleet();b.sides.A.hand[0]='terrain-plasma';b.sides.B.hand[0]='terrain-ionic';
 assert.equal(hit(b,order('command',[0]),order('command',[0])).battle.terrain,null);
 const boss=fleet('C01','R04',1,1,{bossLockedTerrain:true});
 boss.sides.A.hand[0]='terrain-plasma';
 assert.equal(resolveFleetCardRound(boss,order('command',[0]),order()).ok,false);
});
test('Ricambio tattico: nessuna carta inventata',()=>{
 const b=fleet();b.sides.A.hand[0]='tactic-numeric-recycle';
 const r=hit(b,order('command',[0])).battle;
 assert.equal(r.sides.A.discard.length,2);
 assert.equal(r.sides.A.hand.length+r.sides.A.deck.length+r.sides.A.discard.length,24);
});
test('IA seleziona solo madre, vitale valido e carte possedute',()=>{
 const b=fleet('C01','R02',5,5);
 const o=selectFleetAiOrder(b);
 assert.equal(o.shipIndex,0);
 assert.ok(FLEET_PARTS.some(p=>p.id===o.partId));
 assert.ok(o.cards.every(i=>i>=0&&i<b.sides.B.hand.length));
 assert.equal(resolveFleetCardRound(b,order(),o).ok,true);
});
test('Tutte le carte ufficiali hanno un effetto giocabile',()=>{
 for(const type of Object.keys(SPECIAL_CARD_CATALOG)){
  const p=fleetCardEffect(type);assert.ok(p.kind&&p.description,type);
 }
});
test('Upgrade L1-L5: armi e modelli autentici, non scudi di barriera',()=>{
 const low=fleet('L02','N00',1,1).sides.A;
 const high=fleet('L02','N00',5,1).sides.A;
 assert.equal(low.ships[0].maxShield,0);
 assert.equal(high.ships[0].maxShield,0);
 assert.ok(high.ships[0].weaponRating>=low.ships[0].weaponRating);
 assert.equal(low.ships[0].weapons.length,3);
 assert.equal(high.escorts.length,2);
 assert.ok(hit(fleet('L02','N00')).events[0].strength>
  hit(fleet('C01','N00')).events[0].strength);
});
test('Confronto dei vitali e stato partita senza duplicare i supporti',()=>{
 const b=fleet('C01','R03',5,1);
 assert.equal(fleetSurvivors(b.sides.A),1);
 assert.equal(fleetShipDestroyed(b.sides.A.ships[0]),false);
 assert.equal(b.sides.A.escorts.length,2);
});
