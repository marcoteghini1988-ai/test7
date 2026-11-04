import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {aiChoose,createShip,dealHit,fleetCompatibility,memoryComboStatus,newVessel,previewVolley,resetComboMemory,validFleet} from './mathDuelEngine.js';
import {planWeaponSalvos,volleyTimeline} from './mathWeaponEffects.js';

const rng=()=>.5;
const side=(ids,level=1)=>createShip(1,false,{fleetIds:ids,shipLevel:level},rng);
const cards=(a,sa,b,sb)=>[{id:'a',value:a,suit:sa},{id:'b',value:b,suit:sb}];
const shot=(volley,id)=>volley.shots.find(s=>s.weaponId===id);
const weapon=(fleet,id)=>fleet.flatMap(v=>v.weapons).find(w=>w.id===id);
const advance=(ship,hand)=>({...ship,fleet:previewVolley(ship,hand).fleet});

test('catalogo v0.1 completo e quattro motori leggendari dal livello 1',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 assert.equal(PHASE1_CATALOG.weapons.length,42);
 assert.equal(PHASE1_CATALOG.shipLevels.length,85);
 assert.equal(PHASE1_CATALOG.weaponLevels.length,210);
 const hp={L01:[134,155,176,197,218],L02:[130,149,169,188,207],L03:[147,169,191,213,235],L04:[138,159,181,202,223]};
 const armaments={L01:['W30','W31','W32','W33'],L02:['W34','W35','W36'],L03:['W37','W38'],L04:['W39','W40','W41','W42']};
 for(const [id,levels] of Object.entries(hp))for(let l=1;l<=5;l++){
  const v=newVessel(id,l);
  assert.deepEqual(Object.keys(v.engines),['plus','minus','times','divide']);
  assert.deepEqual(v.weapons.map(w=>w.id),armaments[id]);
  for(const e of Object.values(v.engines))assert.deepEqual(e,{hp:levels[l-1],max:levels[l-1]});
 }
});

test('le tredici armi leggendarie usano i danni del catalogo a ogni livello',()=>{
 const expected={
  W30:[5,6,7,7,8], W31:[6,7,8,8,9], W32:[5,6,7,7,8], W33:[6,7,8,9,10],
  W34:[6,7,7,8,8], W35:[6,7,8,9,10], W36:[6,7,8,8,9], W37:[7,8,9,9,10],
  W38:[7,8,9,10,11], W39:[5,6,7,7,8], W40:[5,6,7,7,8], W41:[6,7,8,8,9], W42:[7,8,9,10,11]
 };
 for(const id of ['L01','L02','L03','L04'])for(let l=1;l<=5;l++){
  for(const w of newVessel(id,l).weapons)assert.equal(w.damage,expected[w.id][l-1],w.id);
 }
});

test('Giudizio Eclissi spara le picche in memoria anche senza picche nel calcolo finale',()=>{
 const first=cards(1,'♥',7,'♠'),second=cards(3,'♦',2,'♣'),ship=side(['L01']);
 assert.equal(shot(previewVolley(ship,first),'W33'),undefined);
 const primed=advance(ship,first),before=structuredClone(primed);
 const volley=previewVolley(primed,second);
 assert.deepEqual([shot(volley,'W33').bullets,shot(volley,'W33').damage],[7,42]);
 assert.equal(shot(volley,'W31').charge,3);
 assert.equal(volley.totalDamage,52);
 assert.deepEqual(primed,before);
 assert.deepEqual(weapon(volley.fleet,'W33').memory,[]);
 assert.equal(shot(previewVolley({...primed,fleet:volley.fleet},second),'W33'),undefined);
});

test('Arca del Vuoto raccoglie quattro semi su quattro calcoli e può sparare 55 proiettili',()=>{
 let ship=side(['L04']);
 for(const hand of [cards(1,'♥',13,'♠'),cards(12,'♠',11,'♠'),cards(1,'♦',10,'♠')]){
  assert.equal(shot(previewVolley(ship,hand),'W42'),undefined);
  ship=advance(ship,hand);
 }
 const volley=previewVolley(ship,cards(1,'♣',9,'♠')),ark=shot(volley,'W42');
 assert.deepEqual([ark.bullets,ark.damage],[55,385]);
 assert.equal(volley.totalDamage,385);
 assert.deepEqual(weapon(volley.fleet,'W42').memory,[]);
 const [salvo]=planWeaponSalvos(volley.shots);
 assert.equal(salvo.rounds.length,55);
 assert.ok(salvo.rounds.every((r,i)=>i===0||r.launchMs>salvo.rounds[i-1].launchMs));
 assert.equal(volleyTimeline(volley.shots).settleMs,salvo.arrivalMs+650);
});

test('la memoria scorre e lascia cadere i semi oltre la finestra',()=>{
 for(const [id,w,limit] of [['L01','W33',3],['L04','W42',4]]){
  let ship=advance(side([id]),cards(3,'♥',4,'♠'));
  for(let i=1;i<limit;i++)ship=advance(ship,cards(2,'♣',1,'♠'));
  const volley=previewVolley(ship,cards(3,'♦',2,'♣'));
  assert.equal(shot(volley,w),undefined);
  const state=memoryComboStatus(weapon(volley.fleet,w));
  assert.equal(state.history.length,limit);
  assert.equal(state.totals.H,0);
  assert.equal(state.totals.S,limit-1);
 }
});

test('azzerare la serie conserva gli accumulatori e la memoria avversaria',()=>{
 const hand=cards(7,'♥',6,'♦'),ship=advance(side(['L01','L04']),hand);
 const enemy=advance(side(['L01']),hand),before=structuredClone(enemy);
 const reset=resetComboMemory(ship);
 assert.equal(weapon(reset.fleet,'W31').charge,6);
 assert.deepEqual(weapon(reset.fleet,'W33').memory,[]);
 assert.deepEqual(weapon(reset.fleet,'W42').memory,[]);
 assert.equal(weapon(ship.fleet,'W33').memory.length,1);
 assert.deepEqual(enemy,before);
 assert.equal(resetComboMemory(reset),reset);
 assert.equal(shot(previewVolley(reset,cards(5,'♠',2,'♦')),'W33'),undefined);
});

test('le due combo si scaricano indipendentemente nella stessa flotta',()=>{
 const initial=advance(side(['L01','L04']),cards(2,'♥',5,'♠'));
 const volley=previewVolley(initial,cards(4,'♦',2,'♠'));
 assert.equal(shot(volley,'W33').bullets,7);
 assert.equal(shot(volley,'W42'),undefined);
 assert.equal(weapon(volley.fleet,'W42').memory.length,2);
 const next=previewVolley({...initial,fleet:volley.fleet},cards(6,'♣',2,'♥'));
 assert.equal(shot(next,'W33'),undefined);
 assert.equal(shot(next,'W42').bullets,7);
});

test('Esplosione Gemina e le quattro soglie leggendarie mantengono le regole base',()=>{
 const gemini=side(['L02']);
 assert.equal(shot(previewVolley(gemini,cards(8,'♦',3,'♣')),'W36'),undefined);
 assert.equal(shot(previewVolley(gemini,cards(8,'♦',3,'♠')),'W36').bullets,8);
 for(const [id,w,suit,threshold] of [['L01','W31','♦',18],['L02','W35','♣',20],['L03','W38','♠',20],['L04','W41','♣',20]]){
  const ship=side([id]),first=previewVolley(ship,cards(12,suit,1,suit));
  assert.equal(shot(first,w).bullets,0);
  assert.equal(shot(first,w).charge,13);
  const second=previewVolley({...ship,fleet:first.fleet},cards(13,suit,12,suit));
  assert.equal(shot(second,w).bullets,threshold);
  assert.equal(shot(second,w).charge,38-threshold);
 }
});

test('la IA valuta la combo senza consumarla durante l’anteprima',()=>{
 const attacker=advance(side(['L01']),cards(1,'♥',10,'♠')),defender=side(['L03']);
 attacker.hand=[...cards(5,'♦',4,'♣'),{id:'c',value:8,suit:'♣'},{id:'d',value:1,suit:'♥'}];
 const before=structuredClone(attacker);
 const best=aiChoose(attacker,defender,{plus:9},rng);
 assert.deepEqual([best.i,best.j],[0,1]);
 assert.deepEqual(attacker,before);
 const hit=dealHit(defender,attacker,'plus',9,[attacker.hand[best.i],attacker.hand[best.j]]);
 assert.equal(hit.damage,80);
 assert.equal(hit.defender.fleet[0].engines.plus.hp,67);
 assert.equal(hit.defender.fleet[0].engines.divide.hp,147);
 assert.deepEqual(weapon(hit.attacker.fleet,'W33').memory,[]);
});

test('compatibilità delle flotte miste al livello 1 e memoria ferma a nave distrutta',()=>{
 assert.ok(validFleet(['N00','R02','L01']));
 assert.equal(validFleet(['R02','L01','L04']),false);
 assert.deepEqual(fleetCompatibility(['E01'],['L03'],1),{compatible:false,playerMissing:['divide'],enemyMissing:[]});
 assert.equal(fleetCompatibility(['N00','R02','L01'],['N00','E03','L03'],1).compatible,true);
 const ship=advance(side(['L04']),cards(2,'♥',3,'♠'));
 for(const e of Object.values(ship.fleet[0].engines))e.hp=0;
 const volley=previewVolley(ship,cards(4,'♦',2,'♣'));
 assert.deepEqual(volley.shots,[]);
 assert.equal(volley.memoryPending,false);
 assert.deepEqual(volley.fleet,ship.fleet);
});
