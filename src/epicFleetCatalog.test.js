import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {newVessel,createShip,previewVolley,dealHit,validFleet,fleetCompatibility,findMoves} from './mathDuelEngine.js';
import {planWeaponSalvos} from './mathWeaponEffects.js';

const rng=()=>.5;
const side=(ids,level=1)=>createShip(1,false,{fleetIds:ids,shipLevel:level},rng);
const cards=(a,sa,b,sb)=>[{id:'a',value:a,suit:sa},{id:'b',value:b,suit:sb}];

test('13 navi e 29 armi, con tre motori per epica e Divisione dal livello 4',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,13);
 assert.equal(PHASE1_CATALOG.weapons.length,29);
 assert.equal(PHASE1_CATALOG.shipLevels.length,65);
 assert.equal(PHASE1_CATALOG.weaponLevels.length,145);
 assert.equal(validFleet(['L01']),false);
 const hp={E01:[104,120,137,153,169],E02:[99,116,133,149,166],E03:[112,129,146,162,179],E04:[106,123,140,157,174]};
 for(const [id,levels] of Object.entries(hp))for(let l=1;l<=5;l++){
  const v=newVessel(id,l);
  assert.deepEqual(Object.keys(v.engines),['plus','minus','times','divide'].slice(0,l>=4?4:3));
  assert.equal(v.weapons.length,id==='E04'?4:3);
  for(const e of Object.values(v.engines))assert.deepEqual(e,{hp:levels[l-1],max:levels[l-1]});
 }
});

test('le tredici armi epiche usano i danni del catalogo a ogni livello',()=>{
 const expected={
  W17:[4,5,5,6,6], W18:[4,5,6,6,7], W19:[5,6,6,7,7],
  W20:[4,5,5,6,6], W21:[4,5,5,6,6], W22:[5,6,6,7,7],
  W23:[3,4,4,5,5], W24:[5,6,7,7,8], W25:[4,5,6,6,7],
  W26:[4,5,5,6,6], W27:[4,5,6,6,7], W28:[3,4,4,5,5], W29:[4,5,5,6,6]
 };
 for(const id of ['E01','E02','E03','E04'])for(let l=1;l<=5;l++){
  for(const w of newVessel(id,l).weapons)assert.equal(w.damage,expected[w.id][l-1],w.id);
 }
});

test('le quattro combo richiedono due semi insieme e consumano solo il seme primario',()=>{
 for(const [id,weapon,primary,secondary,damage] of [
  ['E01','W19','♣','♦',5], ['E02','W22','♥','♠',5], ['E03','W25','♠','♥',4], ['E04','W29','♥','♠',4],
 ]){
  const ship=side([id]),pair=cards(9,primary,4,secondary);
  const find=hand=>previewVolley(ship,hand).shots.find(s=>s.weaponId===weapon);
  assert.equal(find(cards(9,primary,4,primary)),undefined);
  assert.equal(find(cards(9,secondary,4,secondary)),undefined);
  const shot=find(pair);
  assert.equal(shot.bullets,9);
  assert.equal(shot.damage,9*damage);
  assert.deepEqual(find([...pair].reverse()),shot);
 }
});

test('le soglie epiche 16, 18 e 16 conservano il resto dopo una sola scarica',()=>{
 for(const [id,weapon,threshold] of [['E01','W18',16],['E03','W24',18],['E04','W27',16]]){
  const ship=side([id],5),first=previewVolley(ship,cards(12,'♦',1,'♦'));
  assert.deepEqual(planWeaponSalvos(first.shots),[]);
  assert.equal(first.shots.find(s=>s.weaponId===weapon).charge,13);
  const second=previewVolley({...ship,fleet:first.fleet},cards(13,'♦',13,'♦'));
  const shot=second.shots.find(s=>s.weaponId===weapon);
  assert.equal(shot.bullets,threshold);
  assert.equal(shot.charge,39-threshold);
  assert.equal(second.totalDamage,shot.damagePerBullet*threshold);
 }
});

test('flotte miste: il limite per seme e la compatibilità ÷ valgono anche per le epiche',()=>{
 assert.ok(validFleet(['N00','R02','E04']));
 assert.equal(validFleet(['R02','E02','E04']),false);
 assert.equal(fleetCompatibility(['R04'],['E01'],3).compatible,true);
 assert.deepEqual(fleetCompatibility(['R04'],['E01'],4),{compatible:false,playerMissing:['divide'],enemyMissing:[]});
 assert.equal(fleetCompatibility(['N00','R02','E04'],['E03','R04','C01'],5).compatible,true);
});

test('Divisione invertita in una flotta mista: colpisce soltanto il motore scelto',()=>{
 const attacker=side(['N00','R02','E01'],4),defender=side(['N00','R04','E03'],4);
 const hand=cards(2,'♦',8,'♣');
 attacker.hand=hand;
 const moves=findMoves(attacker,defender,{divide:4});
 assert.deepEqual(moves.map(m=>[m.op,m.targetShip,m.a,m.b]),[['divide',2,8,2]]);
 const hit=dealHit(defender,attacker,'divide',4,hand,2);
 assert.deepEqual(hit.volley.map(s=>[s.weaponId,s.bullets]),[['W01',10],['W10',8],['W18',0],['W19',8]]);
 assert.equal(hit.damage,116);
 assert.equal(hit.defender.fleet[2].engines.divide.hp,46);
 assert.equal(hit.defender.fleet[2].engines.plus.hp,162);
 assert.deepEqual(hit.defender.fleet.slice(0,2),defender.fleet.slice(0,2));
});
