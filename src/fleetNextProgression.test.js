import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_SHIP_ORDER,SHIP_PROGRESSION_IDS,getShipProgression,
 getShipProgressionLevels,shipProgressionProfile,shipMaxLevel,shipEscortUnlockLevels} from './fleetNext/progression.js';
import {SHIP_CONFIGS,EXCLUSIVE_CARDS,FLEET_SLOTS,
 BASE_CATALOG_COUNT,TOTAL_CARD_COUNT,PROGRESSION_CARD_COUNT,FUSION_SHIP_CARD_COUNT,
 unlockedParts,requiredEscortCount,requiredReserveCount,supportGrade,
 eligibleExclusives,exclusiveUnlocked,exclusiveOperational,effectiveDeck,
 deckFromCounts,card,cardRole,cardCopyLimit,cardFacePath,
 generalCard,exclusiveCard} from './fleetNext/rules.js';
import {TEST_DECK} from './fleetNext/testDeckFixtures.js';

test('Le dodici madri ufficiali hanno progressioni complete con tetti distinti',()=>{
 assert.equal(CAMPAIGN_SHIP_ORDER.length,12);
 assert.equal(new Set(CAMPAIGN_SHIP_ORDER).size,12);
 assert.equal(CAMPAIGN_SHIP_ORDER[0],'N00');
 assert.equal(CAMPAIGN_SHIP_ORDER.at(-1),'L04');
 assert.equal(SHIP_PROGRESSION_IDS.length,12);
 assert.deepEqual([...SHIP_PROGRESSION_IDS].sort(),Object.keys(SHIP_CONFIGS).sort());
 for(const id of SHIP_PROGRESSION_IDS){
  const rows=getShipProgressionLevels(id);
  assert.equal(rows.length,shipMaxLevel(id),id);
  assert.deepEqual(rows.map(row=>row.level),Array.from({length:shipMaxLevel(id)},(_,i)=>i+1),id);
  assert.equal(rows.at(-1).potential,100,'tutte le flotte raggiungono lo stesso indice-obiettivo');
  assert.ok(shipProgressionProfile(id).description,id);
  if(!CAMPAIGN_SHIP_ORDER.includes(id))assert.ok(shipProgressionProfile(id).variantOf,id);
 }
});

test('Aurora mantiene la progressione iniziale L1–L5 senza supporti e completa la coppia ai livelli 10/18',()=>{
 for(let level=1;level<=5;level++){
  const row=getShipProgression('N00',level);
  assert.deepEqual(unlockedParts('N00',level),['weapons','generator']);
  assert.deepEqual(row.escortGrades,[]);
  assert.equal(requiredEscortCount('N00',level),0);
  assert.equal(requiredReserveCount('N00',level),0);
  assert.equal(row.fusionLimit,0);
 }
 assert.deepEqual(shipEscortUnlockLevels('N00'),[10,18]);
 assert.equal(requiredEscortCount('N00',9),0);
 assert.equal(requiredEscortCount('N00',10),1);
 assert.equal(requiredEscortCount('N00',17),1);
 assert.equal(requiredEscortCount('N00',18),2);
 assert.deepEqual(getShipProgression('N00',20).escortGrades,[2,2]);
 assert.deepEqual(getShipProgression('N00',20).vitalIds,['weapons','generator','command']);
 assert.equal(getShipProgression('N00',20).fusionLimit,0);
 assert.equal(eligibleExclusives('N00',1).filter(c=>c.shipId==='N00').length,4);
 assert.equal(eligibleExclusives('N00',5).filter(c=>c.shipId==='N00').length,5);
 assert.equal(eligibleExclusives('N00',20).filter(c=>c.shipId==='N00'&&c.playable!==false).length,10);
 assert.ok(exclusiveUnlocked('ex-n00-01','N00',1));
 assert.equal(exclusiveUnlocked('ex-n00-04','N00',3),false);
});

test('I vitali passano da due a tre e a quattro solo insieme alle funzioni necessarie',()=>{
 assert.deepEqual(unlockedParts('C01',2),['weapons','generator']);
 assert.deepEqual(unlockedParts('C01',3),['weapons','generator','bridge']);
 assert.equal(requiredEscortCount('C01',5),0);
 assert.deepEqual(shipEscortUnlockLevels('C01'),[9,17]);
 assert.equal(requiredEscortCount('C01',8),0);
 assert.equal(requiredEscortCount('C01',9),1);
 assert.equal(requiredEscortCount('C01',17),2);
 assert.equal(requiredEscortCount('C01',19),2);
 assert.deepEqual(unlockedParts('C02',1),['weapons','generator','bridge']);
 assert.equal(requiredEscortCount('C02',2),0);
 assert.equal(requiredEscortCount('C02',3),1);
 assert.deepEqual(unlockedParts('C02',3),['weapons','generator','bridge','command']);
 assert.deepEqual(getShipProgression('C02',5).escortGrades,[1,1]);
 for(const id of SHIP_PROGRESSION_IDS)for(const row of getShipProgressionLevels(id)){
  assert.equal(row.vitalIds.includes('command'),row.escortCount>0,id+' L'+row.level);
  assert.equal(row.vitalIds.includes('engine'),false,id);
  assert.ok(row.vitalIds.length>=2&&row.vitalIds.length<=4,id);
 }
});

test('La quarta nave migliora i due supporti ai livelli tre e cinque',()=>{
 assert.deepEqual(getShipProgression('C03',1).escortGrades,[1,1]);
 assert.deepEqual(getShipProgression('C03',2).escortGrades,[1,1]);
 assert.deepEqual(getShipProgression('C03',3).escortGrades,[2,1]);
 assert.deepEqual(getShipProgression('C03',4).escortGrades,[2,1]);
 assert.deepEqual(getShipProgression('C03',5).escortGrades,[2,2]);
 assert.equal(supportGrade('C03',3,0),2);
 assert.equal(supportGrade('C03',3,1),1);
});

test('Arca distingue sempre due supporti schierati dalle riserve per le fusioni',()=>{
 for(let level=1;level<=5;level++){
  const row=getShipProgression('L04',level);
  assert.equal(row.escortCount,2);
  assert.equal(row.fusionLimit,2);
  assert.equal(row.vitalIds.length,4);
  assert.equal(row.reserveCount,level>=5?2:level>=3?1:0);
  const deck=effectiveDeck([],'L04',level);
  assert.equal(deck.filter(id=>id==='nx-l04-05').length,2);
 }
 assert.deepEqual(getShipProgression('L04',3).reserveGrades,[1]);
 assert.deepEqual(getShipProgression('L04',5).reserveGrades,[2,2]);
 assert.equal(supportGrade('L04',5,3),2);
 assert.equal(requiredReserveCount('L04',5),2);
});

test('Le fusioni precedenti hanno una sola carta e si sbloccano al livello previsto',()=>{
 for(const [shipId,id,at] of [['L01','prog-fusion-l01',5],['L03','prog-fusion-l03',3]]){
  for(let level=1;level<=5;level++){
   assert.equal(exclusiveUnlocked(id,shipId,level),level>=at);
   assert.equal(effectiveDeck([],shipId,level).filter(x=>x===id).length,0,'La fusione storica non duplica la Fusione nativa');
   assert.equal(requiredReserveCount(shipId,level),0);
  }
 }
 assert.equal(exclusiveUnlocked('prog-fusion-l04','L01',5),false);
 const mother={id:'L04',level:1,parts:unlockedParts('L04',1).map(id=>({id,destroyed:false}))};
 assert.equal(exclusiveOperational('prog-fusion-l04',mother),true);
 mother.parts.find(p=>p.id==='command').destroyed=true;
 assert.equal(exclusiveOperational('prog-fusion-l04',mother),false);
});

test('Ogni aumento di livello migliora una capacità reale, con ruoli diversi fra le madri',()=>{
 for(const id of SHIP_PROGRESSION_IDS){
  const rows=getShipProgressionLevels(id);
  for(const row of rows){
   assert.ok(row.attackPower>=2&&row.attackPower<=5,id);
   assert.ok(row.defensePower>=0&&row.defensePower<=2,id);
   assert.ok(row.escortCount<=2&&row.reserveCount<=2,id);
   assert.ok([...row.escortGrades,...row.reserveGrades].every(grade=>grade===1||grade===2),id);
   assert.ok(row.vitalIds.every(part=>Number.isInteger(row.integrityByPart[part])&&row.integrityByPart[part]>0),id);
   assert.ok(row.unlocks.length>0,id);
  }
  for(let i=1;i<rows.length;i++){
   const before=rows[i-1],after=rows[i];
   const capacity=row=>Object.values(row.integrityByPart).reduce((n,hp)=>n+hp,0);
   const gradeSum=row=>[...row.escortGrades,...row.reserveGrades].reduce((n,grade)=>n+grade,0);
   assert.ok(after.masteryPoints>before.masteryPoints||
    after.attackPower>before.attackPower||after.defensePower>before.defensePower||
    capacity(after)>capacity(before)||gradeSum(after)>gradeSum(before)||after.fusionLimit>before.fusionLimit,
   id+' L'+after.level+' privo di un miglioramento reale');
  }
 }
 assert.ok(getShipProgression('R01',5).attackPower>getShipProgression('R04',5).attackPower);
 assert.ok(getShipProgression('R01',5).defensePower<getShipProgression('R04',5).defensePower);
});

test('Configurazioni storiche e prerequisiti esclusivi seguono la stessa progressione',()=>{
 for(const [id,config] of Object.entries(SHIP_CONFIGS))for(const row of getShipProgressionLevels(id).slice(0,5)){
  const expected=Object.entries(config.partUnlockLevels).filter(([,min])=>min<=row.level).map(([part])=>part);
  assert.deepEqual([...expected].sort(),[...row.vitalIds].sort(),id+' L'+row.level);
  assert.equal(Number(row.level>=config.escort1UnlockLevel)+Number(row.level>=config.escort2UnlockLevel),row.escortCount,id);
 }
 for(const def of Object.values(EXCLUSIVE_CARDS)){
  assert.equal(exclusiveUnlocked(def.id,def.shipId,shipMaxLevel(def.shipId)),true,def.id+' deve essere disponibile a livello massimo');
  assert.equal(def.requiredOwnParts.includes('engine'),false,def.id);
 }
});

test('Tutti gli slot esistono da subito; le carte tecniche restano coperte dai test, non equipaggiate in un mazzo manuale',()=>{
 assert.deepEqual(FLEET_SLOTS,{attack:3,defense:2,defenseVisible:1,trap:1,character:1,machine:2});
 const deck=deckFromCounts(TEST_DECK.carteGenerali);
 assert.equal(deck.length,40);

 for(const id of ['prog-machine-striker','prog-machine-guard','prog-bypass']){
  assert.equal(deck.filter(x=>x===id).length,5);
  assert.equal(generalCard(id),card(id));
  assert.equal(exclusiveCard(id),null);
  assert.equal(cardCopyLimit(id),5);
  assert.equal(cardFacePath(id),null,'Le nuove carte non devono riutilizzare un’illustrazione non pertinente');
 }
 assert.equal(cardRole('prog-bypass'),'attack');
 assert.equal(cardRole('prog-machine-guard'),'support');
 assert.equal(cardCopyLimit('prog-fusion-l04'),2);
 assert.equal(BASE_CATALOG_COUNT,144);
 assert.equal(PROGRESSION_CARD_COUNT,6);
 assert.equal(TOTAL_CARD_COUNT,160+FUSION_SHIP_CARD_COUNT);
});

test('Le letture sono immutabili e i livelli fuori intervallo non sbloccano supporti extra',()=>{
 assert.equal(getShipProgression('C02',-3).level,1);
 assert.equal(getShipProgression('C02',99).level,18);
 assert.equal(getShipProgression('C02',3.8).level,3);
 assert.equal(getShipProgression('C02',NaN).level,1);
 assert.equal(getShipProgression('missing',5),null);
 assert.deepEqual(unlockedParts('missing',5),[]);
 assert.equal(requiredEscortCount('missing',5),0);
 assert.throws(()=>{getShipProgression('L04',5).escortGrades.push(2);},TypeError);
 const parts=unlockedParts('N00',5);parts.push('command');
 assert.deepEqual(unlockedParts('N00',5),['weapons','generator']);
});
