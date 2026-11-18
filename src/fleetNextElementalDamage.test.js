import test from 'node:test';
import assert from 'node:assert/strict';
import {FLEET_ELEMENTS,elementalRelation,activeFleetElements} from './fleetNext/elementalAffinities.js';
import {ELEMENTAL_DAMAGE_PERCENT,elementalDamagePercent,
 applyElementalDamage} from './fleetNext/elementalDamage.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';

const target=(b)=>b.sides.B.ships[0].parts[0].id;
function duel(shipA,shipB,levelA,levelB){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,mode:'pvp',
  ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:602,nowMs:0});
 b.sides.B.escorts=[]; // isola il danno alla madre: niente intercettazioni
 b.sides.A.ships[0].attackPower=2;
 b.sides.B.ships[0].defensePower=1;
 return b;
}
function hit(b){
 const partId=target(b),before=b.sides.B.ships[0].hp;
 const result=resolveFleetNextTurn(b,'A',{
  cards:[],targetKind:'part',targetId:partId,partId,pass:false
 },1000);
 assert.equal(result.ok,true,result.reason);
 return {result,damage:before-result.battle.sides.B.ships[0].hp};
}
function nextRound(b){
 const opponent=resolveFleetNextTurn(b,'B',{cards:[],pass:true},2000);
 assert.equal(opponent.ok,true,opponent.reason);
 return opponent.battle;
}

test('Ogni elemento ha due vantaggi, due debolezze, 5 match neutrali',()=>{
 const ids=Object.keys(FLEET_ELEMENTS);
 assert.equal(ids.length,10);
 for(const a of ids){
  const variants=ids.filter(b=>b!==a).map(b=>elementalRelation(a,b));
  assert.equal(variants.filter(x=>x===1).length,2,a);
  assert.equal(variants.filter(x=>x===-1).length,2,a);
  assert.equal(variants.filter(x=>x===0).length,5,a);
 }
 assert.equal(elementalRelation('refrigerant','plasma'),1);
 assert.equal(elementalRelation('plasma','refrigerant'),-1);
 assert.equal(elementalDamagePercent('plasma','refrigerant'),50);
 assert.equal(elementalDamagePercent('refrigerant','plasma'),125);
});

test('Le regole sono speculari: vantaggio +25%, svantaggio -50%, neutralità 100%',()=>{
 assert.deepEqual(ELEMENTAL_DAMAGE_PERCENT,
  {advantage:125,neutral:100,disadvantage:50});
 for(const a of Object.keys(FLEET_ELEMENTS)){
  for(const b of Object.keys(FLEET_ELEMENTS)){
   const relation=elementalRelation(a,b);
   const percent=elementalDamagePercent(a,b);
   assert.equal(percent,relation>0?125:relation<0?50:100,a+' contro '+b);
   assert.equal(percent,elementalRelation(b,a)<0?125:elementalRelation(b,a)>0?50:100);
  }
 }
});

test('Quattro colpi da 1 HP: Fuoco contro Acqua = 2, Acqua contro Fuoco = 5',()=>{
 for(const [attack,defense,expected] of [
  ['plasma','refrigerant',2],['refrigerant','plasma',5],
  ['plasma','ionic',4]
 ]){
  const defender={elementalDamageRemainders:{}},results=[];
  for(let i=0;i<4;i++)results.push(applyElementalDamage(defender,attack,defense,1).damage);
  assert.equal(results.reduce((s,x)=>s+x,0),expected,attack+' vs '+defense);
  if(expected===2)assert.deepEqual(results,[0,1,0,1]);
  assert.deepEqual(defender.elementalDamageRemainders,{},'nessun resto dopo 4 colpi');
 }
});

test('Acqua e Fuoco al massimo livello: le armi normali non sono più equivalenti',()=>{
 let fire=duel('C01','C02',19,18);
 const first=hit(fire);
 assert.equal(first.damage,0,'il primo colpo leggero di Fuoco viene assorbito');
 const info=first.result.events.find(e=>e.kind==='elemental-matchup');
 assert.equal(info?.percent,50);
 assert.equal(info?.baseDamage,1);
 assert.equal(info?.modifiedDamage,0);
 fire=nextRound(first.result.battle);
 const second=hit(fire);
 assert.equal(second.damage,1,'due colpi da uno fanno un HP complessivo');
 let water=duel('C02','C01',18,19);
 let sum=0;
 for(let i=0;i<4;i++){
  const result=hit(water);
  sum+=result.damage;
  if(i!==3)water=nextRound(result.result.battle);
 }
 assert.equal(sum,5,'Acqua infligge il 125% anche con colpi singoli');
});

test('Il bonus si applica anche ai comandi di attacco con carte, senza alterare gli HP massimi',()=>{
 const b=duel('C01','C02',19,18);
 b.sides.B.escorts=[{
  id:'target-escort',name:'Scudiera',hp:12,maxHp:12,slot:0,linked:true,
  skill:{requires:[]},destroyed:false
 }];
 b.sides.A.hand=['nx-c01-03']; // Artiglio di coda usa il motore dei colpi esclusivi
 const original=b.sides.B.escorts[0].hp;
 const r=resolveFleetNextTurn(b,'A',{cards:[0],targetKind:'escort',
  targetId:'target-escort',escortSlot:0,partId:'weapons',pass:false},1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.events.some(e=>e.kind==='elemental-matchup'&&e.percent===50));
 assert.equal(original-r.battle.sides.B.escorts[0].hp,0);
 assert.equal(r.battle.sides.B.escorts[0].maxHp,12);
});

test('Tempesta usa Fulmine come secondo elemento senza modificare il colpo normale',()=>{
 const b=duel('E02','C02',10,18); // Tempesta: Vento primario, Fulmine secondario
 assert.deepEqual([...activeFleetElements('E02',10)],['aerial','ionic']);
 const normal=hit(b);
 assert.equal(normal.result.events.some(e=>e.kind==='elemental-matchup'),false,
  'Vento contro Acqua è neutrale');
 assert.equal(normal.damage,1);
 const special=duel('E02','C02',10,18);
 special.sides.A.hand=['energy-ionic','energy-ionic','energy-ionic'];
 const partId=target(special);
 const r=resolveFleetNextTurn(special,'A',{cards:[0,1,2],
  targetKind:'part',targetId:partId,partId,pass:false,
  activateElemental:true,elementalElement:'ionic'},1000);
 assert.equal(r.ok,true,r.reason);
 const factor=r.events.find(e=>e.kind==='elemental-matchup');
 assert.equal(factor?.percent,125);
 assert.equal(factor?.attackerElement,'ionic');
 assert.ok(r.events.some(e=>e.kind==='elemental-special'));
});

test('La modalità legacy non riceve vantaggi o resistenze nascoste',()=>{
 const b=createFleetNextBattle({shipA:'C01',levelA:5,shipB:'C02',levelB:5,
  deckA:[],deckB:[],ruleset:'legacy',seed:222});
 assert.equal(b.sides.B.elementalDamageRemainders!==undefined,true);
 const r=resolveFleetNextTurn(b,'A',{cards:[],pass:false,
  targetKind:'escort',targetId:b.sides.B.escorts[0].id,escortSlot:0},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.events.some(e=>e.kind==='elemental-matchup'),false);
});
