import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {newVessel,createShip,previewVolley,dealHit,validFleet,fleetCompatibility,initialBattle,supportedOperators,vesselDestroyed} from './mathDuelEngine.js';
import {weaponMount,weaponMuzzleCount} from './mathFleetGeometry.js';
import {planWeaponSalvos,projectileFrame} from './mathWeaponEffects.js';
const rng=()=>.5;
const side=(ids,level=1)=>createShip(1,false,{fleetIds:ids,shipLevel:level},rng);
const cards=(a,sa,b,sb)=>[{id:'a',value:a,suit:sa},{id:'b',value:b,suit:sb}];

test('il blocco 6A espone nove navi e sedici armi, senza anticipare epiche e leggendarie',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,9);assert.equal(PHASE1_CATALOG.weapons.length,16);
 assert.deepEqual(PHASE1_CATALOG.ships.filter(s=>s.rarita==='Rara').map(s=>s.id),['R01','R02','R03','R04']);
 assert.equal(PHASE1_CATALOG.shipLevels.length,45);assert.equal(PHASE1_CATALOG.weaponLevels.length,80);
 assert.equal(validFleet(['E01']),false);assert.equal(validFleet(['L01']),false);
});

test('HP e sblocco × delle quattro rare seguono la progressione v0.1',()=>{
 const hp={R01:[78,91,103,116,128],R02:[76,88,101,113,125],R03:[80,93,105,118,130],R04:[87,102,116,131,145]};
 for(const [id,levels] of Object.entries(hp))for(let level=1;level<=5;level++){
  const vessel=newVessel(id,level),motors=id==='R04'||level>=3?3:2;
  assert.deepEqual(Object.keys(vessel.engines),['plus','minus','times'].slice(0,motors));
  for(const e of Object.values(vessel.engines))assert.deepEqual(e,{hp:levels[level-1],max:levels[level-1]});
 }
 for(let level=1;level<=5;level++)assert.deepEqual(Object.keys(newVessel('N00',level).engines),['plus','minus']);
});

test('le nove nuove armi usano i danni per livello previsti dal catalogo',()=>{
 const damage={W08:[3,4,4,5,5],W09:[3,4,5,5,6],W10:[3,4,4,5,5],W11:[4,5,5,6,6],W12:[3,3,4,4,4],W13:[2,3,3,4,4],W14:[3,4,4,5,5],W15:[4,4,5,5,5],W16:[3,4,5,5,6]};
 for(const id of ['R01','R02','R03','R04'])for(let l=1;l<=5;l++)for(const w of newVessel(id,l).weapons)assert.equal(w.damage,damage[w.id][l-1]);
 assert.equal(newVessel('R03',1).weapons.length,3);
});

test('Fulmine Incrociato richiede ♠ e ♣ simultanei e usa soltanto le munizioni ♠',()=>{
 const ship=side(['R02']);
 for(const hand of [cards(8,'♠',3,'♥'),cards(8,'♠',3,'♠'),cards(8,'♣',3,'♦')])assert.ok(!previewVolley(ship,hand).shots.some(s=>s.weaponId==='W11'));
 const hand=cards(8,'♠',3,'♣'),before=structuredClone(ship),volley=previewVolley(ship,hand);
 assert.deepEqual(volley.shots.map(s=>[s.weaponId,s.bullets,s.damage]),[['W10',3,9],['W11',8,32]]);
 assert.equal(volley.totalDamage,41);assert.deepEqual(ship,before);
 assert.deepEqual(previewVolley(ship,[...hand].reverse()).shots,volley.shots);
});

test('i serbatoi rari rispettano 14, 13 e 15: una sola scarica per calcolo e resto conservato',()=>{
 for(const [id,weaponId,suit,other,threshold] of [['R01','W09','♦','♣',14],['R03','W14','♠','♣',13],['R04','W16','♣','♥',15]]){
  const ship=side([id],5),first=previewVolley(ship,cards(threshold-2,suit,1,other));
  const charging=first.shots.find(s=>s.weaponId===weaponId);
  assert.equal(charging.bullets,0);assert.equal(charging.charge,threshold-2);assert.deepEqual(planWeaponSalvos(first.shots),[]);
  ship.fleet=first.fleet;
  const second=previewVolley(ship,cards(13,suit,13,suit)),shot=second.shots.find(s=>s.weaponId===weaponId);
  assert.equal(shot.bullets,threshold);assert.equal(shot.charge,24);assert.equal(second.totalDamage,threshold*shot.damagePerBullet);
  ship.fleet=second.fleet;
  const third=previewVolley(ship,cards(1,suit,1,other)).shots.find(s=>s.weaponId===weaponId);
  assert.equal(third.bullets,threshold);assert.equal(third.charge,25-threshold);
 }
});

test('universale e rare ricevono tutte le munizioni compatibili senza divisioni o doppi danni',()=>{
 const volley=previewVolley(side(['N00','R01','R03']),cards(8,'♥',3,'♦'));
 assert.deepEqual(volley.shots.map(s=>[s.weaponId,s.bullets,s.damage]),[['W01',11,11],['W08',8,24],['W09',0,0],['W12',8,24],['W13',3,6]]);
 assert.equal(volley.totalDamage,65);assert.equal(volley.shots.find(s=>s.weaponId==='W09').charge,3);
 assert.equal(planWeaponSalvos(volley.shots).reduce((sum,s)=>sum+s.rounds.length,0),30);
});

test('il limite di due specializzate include i semi secondari delle rare',()=>{
 assert.ok(validFleet(['R01','R02','R03']));assert.ok(validFleet(['N00','R01','R03']));
 assert.equal(validFleet(['R01','R03','C01']),false);
 assert.equal(validFleet(['R01','R04','C02']),false);
 assert.equal(validFleet(['R02','C03','C04']),false);
 assert.equal(validFleet(['N00','N00']),false);
});

test('i duelli iniziano solo con operazioni bersagliabili da entrambe le flotte',()=>{
 assert.deepEqual(fleetCompatibility(['N00'],['R04'],1),{compatible:false,playerMissing:['times'],enemyMissing:[]});
 assert.deepEqual(fleetCompatibility(['R04'],['C01'],1),{compatible:false,playerMissing:[],enemyMissing:['times']});
 assert.equal(fleetCompatibility(['R01'],['R04'],2).compatible,false);
 assert.equal(fleetCompatibility(['R01'],['R04'],3).compatible,true);
 const battle=initialBattle(1,{fleetIds:['N00'],enemyFleetIds:['R04'],shipLevel:1},rng);
 assert.deepEqual(battle.enemy.fleet.map(v=>v.id),['N00']);
 assert.deepEqual(supportedOperators(battle.player),supportedOperators(battle.enemy));
 const mixed=initialBattle(1,{fleetIds:['R04'],enemyFleetIds:['C03','C01'],shipLevel:5},rng);
 assert.deepEqual(mixed.enemy.fleet.map(v=>v.id),['C03','C01']);
});

test('Batteria Gemella alterna due bocche ma ogni munizione produce un solo colpo',()=>{
 const [salvo]=planWeaponSalvos([{weaponId:'W08',bullets:13}]);
 assert.equal(weaponMuzzleCount('W08'),2);assert.equal(salvo.rounds.length,13);
 assert.deepEqual(salvo.rounds.map(r=>r.muzzleIndex),[0,1,0,1,0,1,0,1,0,1,0,1,0]);
 for(const view of ['enemy','player']){
  const a=weaponMount(view,'R01','W08',0),b=weaponMount(view,'R01','W08',1);
  assert.ok(a.point[0]<b.point[0]);assert.equal(weaponMount(view,'R01','W08',2),null);
  for(const r of salvo.rounds){const [x,y]=weaponMount(view,'R01','W08',r.muzzleIndex).point;const end=projectileFrame(225-x*218,180-y*218,r.bend,1);assert.equal(x*218+end.x,225);assert.equal(y*218+end.y,180);}
 }
});

test('una rara distrutta non spara e non accumula carica',()=>{
 const ship=side(['R03']);for(const e of Object.values(ship.fleet[0].engines))e.hp=0;
 const before=structuredClone(ship),volley=previewVolley(ship,cards(13,'♠',13,'♥'));
 assert.ok(vesselDestroyed(ship.fleet[0]));assert.deepEqual(volley.shots,[]);assert.equal(volley.totalDamage,0);assert.deepEqual(ship,before);
});

test('200 colpi di flotte miste preservano accumulo, bersaglio esatto e HP non negativi',()=>{
 let seed=731,attacker=side(['R01','R02','R03'],5);
 const next=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const suits=['♥','♦','♣','♠'];
 for(let i=0;i<200;i++){
  const hand=cards(1+Math.floor(next()*13),suits[Math.floor(next()*4)],1+Math.floor(next()*13),suits[Math.floor(next()*4)]);
  const defender=side(['R04','N00','C03'],5),before=structuredClone(defender),target=i%3,volley=previewVolley(attacker,hand);
  const hit=dealHit(defender,attacker,'plus',hand[0].value+hand[1].value,hand,target);
  assert.equal(hit.damage,Math.min(before.fleet[target].engines.plus.hp,volley.totalDamage));
  for(let j=0;j<defender.fleet.length;j++)for(const op of Object.keys(defender.fleet[j].engines))assert.equal(hit.defender.fleet[j].engines[op].hp,before.fleet[j].engines[op].hp-(j===target&&op==='plus'?hit.damage:0));
  for(const v of hit.attacker.fleet)for(const w of v.weapons)assert.ok(w.charge>=0);
  attacker=hit.attacker;
 }
});
