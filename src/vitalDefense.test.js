import test from 'node:test';
import assert from 'node:assert/strict';
import {
 VITAL_IDS,SHIELD_GATE_PCT,createMotherDefense,shieldGateCount,remainingExposureSlots,
 damageMotherShield,restoreMotherShield,exposeMotherPart,hitMotherPart,motherDestroyed,
 matchesVitalSignature,createEscortDefense,damageEscortShield,destroyExposedEscort
} from './vitalDefense.js';

const sig={kind:'math',op:'plus',target:10};
const cc=(values,suits=values.map(()=> '♠'))=>values.map((value,i)=>({value,suit:suits[i]}));
const mk=()=>createMotherDefense({shipId:'N00',signatures:Object.fromEntries(VITAL_IDS.map(id=>[id,sig]))});
test('quattro componenti vitali con HP e scudo indipendente',()=>{
 const d=mk();assert.deepEqual(Object.keys(d.parts),VITAL_IDS);
 assert.equal(d.shield.hp,100);
 assert.ok(VITAL_IDS.every(id=>d.parts[id].hp===25&&!d.parts[id].exposed));
});
test('soglie 75 50 25 0 aprono 1 2 3 4 possibilità',()=>{
 let d=mk();
 for(const [hp,gates] of [[100,0],[76,0],[75,1],[51,1],[50,2],[26,2],[25,3],[1,3],[0,4]]){
  d=damageMotherShield(d,d.shield.hp-hp).defense;
  assert.equal(shieldGateCount(d),gates,String(hp));
 }
});
test('attaccante sceglie una delle quattro parti, non un ordine prestabilito',()=>{
 let d=damageMotherShield(mk(),25).defense;
 d=exposeMotherPart(d,'command').defense;
 assert.equal(d.parts.command.exposed,true);
 assert.equal(remainingExposureSlots(d),0);
 assert.equal(exposeMotherPart(d,'engine').exposed,false);
});
test('l attacco allo scudo non attraversa direttamente la parte vitale',()=>{
 const d=mk(),result=damageMotherShield(d,1000);
 assert.equal(result.defense.shield.hp,0);
 assert.ok(VITAL_IDS.every(id=>result.defense.parts[id].hp===25));
});
test('una parte protetta non prende danni',()=>{
 const d=mk(),r=hitMotherPart(d,'engine',100,cc([4,6]));
 assert.equal(r.damage,0);assert.equal(r.reason,'protected');
});
test('un requisito matematico fisso deve essere soddisfatto',()=>{
 let d=damageMotherShield(mk(),25).defense;
 d=exposeMotherPart(d,'weapons').defense;
 assert.equal(hitMotherPart(d,'weapons',9,cc([3,3])).reason,'wrong_combination');
 const r=hitMotherPart(d,'weapons',9,cc([4,6]));
 assert.equal(r.damage,9);assert.equal(r.defense.parts.weapons.hp,16);
});
test('le parti vitali hanno HP: un colpo non distrugge automaticamente',()=>{
 let d=damageMotherShield(mk(),25).defense;
 d=exposeMotherPart(d,'engine').defense;
 const a=hitMotherPart(d,'engine',10,cc([4,6]));
 assert.equal(a.defense.parts.engine.hp,15);assert.equal(a.destroyed,false);
 const b=hitMotherPart(a.defense,'engine',40,cc([4,6]));
 assert.equal(b.defense.parts.engine.hp,0);assert.equal(b.destroyed,true);
});
test('dopo un KO la nuova soglia apre una nuova scelta',()=>{
 let d=damageMotherShield(mk(),25).defense;
 d=exposeMotherPart(d,'engine').defense;
 d=hitMotherPart(d,'engine',25,cc([4,6])).defense;
 assert.equal(remainingExposureSlots(d),0);
 d=damageMotherShield(d,25).defense;
 assert.equal(remainingExposureSlots(d),1);
 assert.equal(exposeMotherPart(d,'command').exposed,true);
});
test('scudo riparato riprotegge le parti vive e non rianima quelle distrutte',()=>{
 let d=damageMotherShield(mk(),75).defense;
 d=exposeMotherPart(d,'engine').defense;
 d=exposeMotherPart(d,'weapons').defense;
 d=exposeMotherPart(d,'command').defense;
 d=hitMotherPart(d,'engine',25,cc([4,6])).defense;
 d=restoreMotherShield(d,70).defense;
 assert.equal(d.shield.hp,95);assert.equal(d.parts.engine.hp,0);
 assert.equal(d.parts.weapons.exposed,false);
 assert.equal(d.parts.command.exposed,false);
});
test('scudo al 100 non supera mai il massimo e non si ripara da solo',()=>{
 const d=mk();assert.equal(restoreMotherShield(d,400).repaired,0);
 assert.equal(damageMotherShield(d,4).defense.shield.hp,96);
});
test('quattro vitali distrutti chiudono la battaglia della madre',()=>{
 let d=damageMotherShield(mk(),100).defense;
 for(const id of VITAL_IDS){
  d=exposeMotherPart(d,id).defense;
  d=hitMotherPart(d,id,99,cc([4,6])).defense;
 }
 assert.equal(motherDestroyed(d),true);
});
test('la firma mancante blocca distruzione accidentale della parte',()=>{
 let d=damageMotherShield(createMotherDefense({shipId:'L04'}),25).defense;
 d=exposeMotherPart(d,'engine').defense;
 assert.equal(hitMotherPart(d,'engine',99,cc([4,6])).reason,'signature_undecided');
});
test('firme math con 2 carte e sequenze di 3',()=>{
 assert.equal(matchesVitalSignature(sig,cc([4,6])),true);
 assert.equal(matchesVitalSignature({kind:'math',ops:['plus','times'],target:20},cc([3,2,4])),true);
 assert.equal(matchesVitalSignature({kind:'math',op:'divide',target:3},cc([3,9])),true);
 assert.equal(matchesVitalSignature({kind:'math',op:'divide',target:4},cc([3,9])),false);
});
test('riconoscimento delle principali combinazioni poker',()=>{
 const cases=[
  ['pair',[4,4]],['twoPair',[4,4,9,9]],['trips',[6,6,6]],
  ['straight',[1,2,3,4,5]],['flush',[1,3,6,8,11]],
  ['fullHouse',[4,4,4,9,9]],['fourKind',[7,7,7,7]],
  ['straightFlush',[3,4,5,6,7]],['royalFlush',[1,10,11,12,13]]
 ];
 for(const [pattern,values] of cases)
  assert.equal(matchesVitalSignature({kind:'poker',pattern},cc(values)),true,pattern);
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'fullHouse'},cc([4,4,9,9,9])),true);
 assert.equal(matchesVitalSignature({kind:'poker',pattern:'royalFlush'},cc([1,10,11,12,13],['♠','♠','♠','♠','♥'])),false);
});
test('scudiera: scudo azzerato, poi distruzione completa con firma',()=>{
 let e=createEscortDefense({shieldMax:20,signature:{kind:'poker',pattern:'pair'}});
 e=damageEscortShield(e,200).defense;assert.equal(e.shield.hp,0);
 assert.equal(destroyExposedEscort(e,cc([2,5])).destroyed,false);
 assert.equal(destroyExposedEscort(e,cc([7,7])).destroyed,true);
});
test('nessuna parte si espone se lo scudo non ha raggiunto una soglia',()=>{
 const d=mk();assert.equal(remainingExposureSlots(d),0);
 assert.equal(exposeMotherPart(d,'command').exposed,false);
});
test('firme e HP differenziabili per modello senza mutare altri dati',()=>{
 const d=createMotherDefense({shipId:'E03',shieldMax:300,partHp:{engine:20,weapons:30,shieldGenerator:40,command:50},
  signatures:{command:{kind:'poker',pattern:'fullHouse'}}});
 assert.equal(d.parts.command.max,50);assert.equal(d.parts.engine.max,20);
 assert.equal(d.parts.command.signature.pattern,'fullHouse');
 assert.equal(d.parts.weapons.signature,null);
});
