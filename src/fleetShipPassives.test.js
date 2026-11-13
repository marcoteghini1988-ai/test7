import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createFleetCardBattle,resolveFleetCardRound} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {fleetShipPassive,activeFleetSynergies,FLEET_SHIP_PASSIVES,FLEET_SHIP_SYNERGIES}
 from './fleetShipPassives.js';

const deck=()=>[...createSpecialCollection().loadout];
const make=(idsA,idsB)=>createFleetCardBattle({
 shipsA:idsA.map(shipId=>({shipId,level:1})),
 shipsB:idsB.map(shipId=>({shipId,level:1})),deckA:deck(),deckB:deck(),seed:48
});
const order=(shipIndex=0,partId='command')=>({shipIndex,partId,cards:[]});
test('Tutte le 17 navicelle del catalogo ufficiale hanno una passiva propria',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 assert.equal(Object.keys(FLEET_SHIP_PASSIVES).length,17);
 for(const ship of PHASE1_CATALOG.ships){
  assert.ok(fleetShipPassive(ship.id)?.name,ship.id);
  assert.ok(fleetShipPassive(ship.id)?.description,ship.id);
 }
 assert.ok(FLEET_SHIP_SYNERGIES.length>=6);
});
test('Sinergia: usa due navi vive con componenti richiesti, non la sola centralina',()=>{
 const b=make(['C02','C01'],['R04']);
 assert.ok(activeFleetSynergies(b.sides.A).some(x=>x.name==='Shock termico'));
 b.sides.A.ships[0].parts.find(p=>p.id==='generator').damage=2;
 b.sides.A.ships[0].parts.find(p=>p.id==='generator').destroyed=true;
 assert.equal(activeFleetSynergies(b.sides.A).some(x=>x.name==='Shock termico'),false,
  'Generatore criogenico distrutto interrompe la combinazione');
});
test('Supporto difensivo: protegge solo il danno EXTRA, rinunciando al proprio attacco',()=>{
 const b=make(['R04','C04'],['C01']);
 b.sides.A.ships[0].shield=0;
 const defended=resolveFleetCardRound(b,order(0,'command'),order(0,'command'));
 assert.equal(defended.ok,true);
 assert.equal(defended.events[1].damage,1,'la madre subisce comunque una frattura');
 assert.equal(defended.events[0].fireCount,1,'la scorta rinuncia alla propria salva');
 const unguarded=make(['R04','C04'],['C01']);
 unguarded.sides.A.ships[0].shield=0;
 unguarded.sides.A.ships[1].parts.find(p=>p.id==='generator').damage=2;
 unguarded.sides.A.ships[1].parts.find(p=>p.id==='generator').destroyed=true;
 const open=resolveFleetCardRound(unguarded,order(0,'command'),order(0,'command'));
 assert.equal(open.ok,true);
 assert.equal(open.events[1].damage,2,'senza scorta il Plasma prevale sul Minerale');
 assert.equal(open.events[0].fireCount,2,'la nave non impegnata in difesa torna a sparare');
});
test('Passiva riparazione: ripara una sola frattura, mai una parte distrutta',()=>{
 const b=make(['C01','R03'],['R04']);
 b.round=2;
 const p=b.sides.A.ships[0].parts.find(p=>p.id==='generator');
 p.damage=1;
 const healed=resolveFleetCardRound(b,order(0,'command'),order(0,'command'));
 assert.equal(healed.ok,true);
 assert.equal(healed.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').damage,0);
 assert.ok(healed.battle.log.some(x=>x.text.includes('Riparazione orbitale')));
});
test('Shock termico scatta quando entrambe le navi sono disponibili e componenti intatti',()=>{
 const b=make(['C02','C01'],['C01']);
 b.round=3;
 const r=resolveFleetCardRound(b,order(0,'command'),order(0,'command'));
 assert.equal(r.ok,true);
 assert.ok(r.battle.log.some(x=>x.text.includes('Shock termico')));
});
