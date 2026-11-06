import test from 'node:test';
import assert from 'node:assert/strict';
import {ESCORT_ARMORY} from './escortArmory.js';
import {initialBattle,previewVolley,dealHit} from './mathDuelEngine.js';
import {ESCORT_ROLE_HELP,attackTargetKind,tacticalEscortDamage,defensiveEscortShare} from './escortTactics.js';
import {interceptMotherVolley} from './linkedEscorts.js';
const card=(value,suit)=>({value,suit,id:suit+value});
const battle=(id,level=5)=>initialBattle(1,{vitalPrototype:true,fleetIds:[id],shipLevel:level},()=>.5);
const escort=(b,slot)=>b.player.escorts[slot];
test('34 armi / 17 flotte: tutti e sette i ruoli sono riconosciuti',()=>{
 assert.equal(Object.keys(ESCORT_ARMORY).length,17);assert.equal(Object.keys(ESCORT_ROLE_HELP).length,7);
 for(const [id,list] of Object.entries(ESCORT_ARMORY)){
  assert.equal(list.length,2,id);
  for(const gun of list)assert.ok(ESCORT_ROLE_HELP[gun.role],id+' '+gun.role);
 }
});
test('nessun buff senza munizioni o senza bersaglio pertinente',()=>{
 assert.equal(tacticalEscortDamage('Assedio',0,{targetKind:'motherShield'}).damage,0);
 assert.equal(tacticalEscortDamage('Assedio',20,null).damage,20);
});
test('colpo finale della scudiera non riceve buff sui danni',()=>{
 const b=battle('C01');
 assert.equal(attackTargetKind(b.enemy,{escortIndex:0}),'escortShield');
 assert.equal(tacticalEscortDamage('Assalto',20,{targetKind:'escortFinisher'}).damage,20);
});
test('Assalto funziona solo contro scudi delle scudiere',()=>{
 assert.equal(tacticalEscortDamage('Assalto',20,{targetKind:'escortShield'}).damage,25);
 assert.equal(tacticalEscortDamage('Assalto',20,{targetKind:'motherShield'}).damage,20);
});
test('Incursore funziona solo contro vitali',()=>{
 assert.equal(tacticalEscortDamage('Incursore',20,{targetKind:'motherVital'}).damage,25);
 assert.equal(tacticalEscortDamage('Incursore',20,{targetKind:'motherShield'}).damage,20);
});
test('Assedio e Artiglieria: moltiplicatori distinti',()=>{
 assert.equal(tacticalEscortDamage('Assedio',20,{targetKind:'motherShield'}).damage,27);
 assert.equal(tacticalEscortDamage('Artiglieria',20,{targetKind:'motherShield'}).damage,24);
 assert.equal(tacticalEscortDamage('Artiglieria',20,{targetKind:'escortShield'}).damage,24);
});
test('Guardia rafforza intercettazione soltanto con scudo madre <= 50%',()=>{
 const b=battle('C01'),e=escort(b,0),d=b.player.fleet[0].defense;
 assert.equal(defensiveEscortShare(e,d),e.weapon.interceptShare);
 const low={...d,shield:{...d.shield,hp:Math.floor(d.shield.max/2)}};
 assert.ok(defensiveEscortShare(e,low)>defensiveEscortShare(e,d));
});
test('Baluardo rafforza intercettazione sotto 25%',()=>{
 const b=battle('E01'),e=escort(b,0),d=b.player.fleet[0].defense;
 const low={...d,shield:{...d.shield,hp:Math.floor(d.shield.max/4)}};
 assert.ok(defensiveEscortShare(e,low)>defensiveEscortShare(e,d));
});
test('Intercettore difende i vitali esposti più dello scudo generale',()=>{
 const b=battle('R02'),e=escort(b,0),d=b.player.fleet[0].defense;
 assert.ok(defensiveEscortShare(e,d,{vitalId:'engine'})>defensiveEscortShare(e,d));
});
test('intercettazione aumentata spende veri HP scudiera',()=>{
 const b=battle('R02'),e=escort(b,0),d=b.player.fleet[0].defense;
 const normal=interceptMotherVolley([e],100,d),vital=interceptMotherVolley([e],100,d,{vitalId:'engine'});
 assert.ok(vital.intercepted>normal.intercepted);
 assert.equal(vital.escorts[0].defense.shield.hp,e.defense.shield.hp-vital.intercepted);
});
test('preview Assalto: una carta, un cannone, bonus contro scudiera',()=>{
 const b=battle('C01'),g=escort(b,1).weapon,cards=[card(10,'♦')];
 const normal=previewVolley(b.player,cards,g.id),bonus=previewVolley(b.player,cards,g.id,{targetKind:'escortShield'});
 assert.equal(bonus.routing[0].weaponId,g.id);
 assert.equal(bonus.shots[0].bullets,10);
 assert.ok(bonus.shots[0].damage>normal.shots[0].damage);
 assert.ok(bonus.shots[0].bonusDamage>0);
});
test('dealHit include il bonus in rawDamage già al lancio',()=>{
 const b=battle('C01'),g=escort(b,1).weapon,cards=[card(10,'♦')];
 const attack=dealHit(b.enemy,b.player,'plus',b.targets.plus,cards,0,{escortIndex:0,cards},g.id);
 const expected=previewVolley(b.player,cards,g.id,{targetKind:'escortShield'});
 assert.equal(attack.rawDamage,expected.totalDamage);
 assert.equal(b.player.escorts[1].weapon.charge,0);
});
test('Incursore su vitale aumenta danno ma non duplica munizioni',()=>{
 const b=battle('N00'),g=escort(b,1).weapon,cards=[card(8,'♠')];
 const vital=previewVolley(b.player,cards,g.id,{targetKind:'motherVital'});
 const shield=previewVolley(b.player,cards,g.id,{targetKind:'motherShield'});
 assert.ok(vital.totalDamage>shield.totalDamage);
 assert.deepEqual(vital.routing,shield.routing);
});
