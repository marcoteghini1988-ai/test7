import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {ESCORT_ARMORY} from './escortArmory.js';
import {createFleetCardBattle,resolveFleetCardRound} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {fleetShipPassive,activeFleetSynergies,FLEET_SHIP_PASSIVES} from './fleetShipPassives.js';
import {FLEET_ESCORT_TRAITS,readyFleetEscorts} from './fleetEscortSupports.js';

const deck=()=>[...createSpecialCollection().loadout];
const make=(motherA='C01',motherB='R04',levelA=5,levelB=1)=>
 createFleetCardBattle({shipsA:[{shipId:motherA,level:levelA}],
  shipsB:[{shipId:motherB,level:levelB}],deckA:deck(),deckB:deck(),seed:48});
const order=(partId='command')=>({shipIndex:0,partId,cards:[]});
test('17 madri e 34 evoluzioni: identita, nomi e abilita propri',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 assert.equal(Object.keys(FLEET_SHIP_PASSIVES).length,17);
 const all=[];
 for(const model of PHASE1_CATALOG.ships){
  assert.ok(fleetShipPassive(model.id)?.name);
  const pair=FLEET_ESCORT_TRAITS[model.id];
  assert.equal(pair.length,2);
  for(const [i,skill] of pair.entries()){
   assert.equal(skill.model,ESCORT_ARMORY[model.id][i].name);
   assert.equal(skill.role,ESCORT_ARMORY[model.id][i].role);
   assert.ok(skill.requires.length>=2);
   all.push(skill.name);
  }
 }
 assert.equal(new Set(all).size,34,'Ogni evoluzione ha un nome passiva distinto');
});
test('Gli HP scudiere variano per nave e ruolo; un baluardo puo resistere piu della madre',()=>{
 const tank=make('L03','C01').sides.A.escorts[0];
 const scout=make('N00','C01').sides.A.escorts[0];
 assert.ok(tank.maxHp>scout.maxHp);
 assert.ok(tank.maxHp>4,'Una madre cade dopo due vitali da due punti');
 assert.equal(tank.skill.action,'bulwark');
});
test('Le sinergie non richiedono sempre la centralina: dipendono dalla parte specifica',()=>{
 const b=make('C01');
 assert.equal(activeFleetSynergies(b.sides.A).length,3);
 const command=b.sides.A.ships[0].parts.find(p=>p.id==='command');
 command.damage=2;command.destroyed=true;
 assert.equal(activeFleetSynergies(b.sides.A).length,2,
  'Si interrompe la formazione triplice, non tutti i supporti');
 command.damage=0;command.destroyed=false; // test indipendente: madre ancora viva
 const gen=b.sides.A.ships[0].parts.find(p=>p.id==='generator');
 gen.damage=2;gen.destroyed=true;
 assert.equal(readyFleetEscorts(b.sides.A).length,1,
  'Un altra scudiera resta collegata attraverso Armi e Motori');
});
test('R03 L3 ripara una frattura della madre senza mai resuscitare componenti',()=>{
 const b=make('R03','C01',3,1);
 b.round=2;
 b.sides.A.ships[0].parts.find(p=>p.id==='engine').damage=1;
 const r=resolveFleetCardRound(b,order('command'),order('command'));
 assert.equal(r.ok,true);
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='engine').damage,0);
 assert.ok(r.battle.log.some(x=>x.text.includes('Luce di recupero')));
});
test('R04 L3 difende la madre assorbendo interamente una salva diretta',()=>{
 const b=make('C01','R04',1,3);
 const r=resolveFleetCardRound(b,order(),order());
 assert.equal(r.ok,true);
 assert.ok(r.events[0].escortDamage>=1);
 assert.equal(r.events[0].damage,0);
 assert.equal(r.events[0].escortName,'Scudo del Vuoto');
});
test('C03 L5 supporta con risonanza, ma non diventa un cannone indipendente',()=>{
 const b=make('C03','N00',5,1);b.round=3;
 const r=resolveFleetCardRound(b,order(),order());
 assert.equal(r.ok,true);
 assert.equal(r.events[0].fireCount,1);
 assert.ok(r.battle.log.some(x=>x.text.includes('Scarica coordinata')));
});
test('Supporto di fase N00 intercetta solo nei round previsti',()=>{
 const b=make('C01','N00',1,3);
 const first=resolveFleetCardRound(b,order(),order());
 assert.equal(first.ok,true);
 assert.equal(first.events[0].escortDamage,0);
 b.round=2;
 const second=resolveFleetCardRound(b,order(),order());
 assert.equal(second.ok,true);
 assert.ok(second.events[0].escortDamage>0);
});
