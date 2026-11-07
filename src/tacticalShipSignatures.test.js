import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS,matchesVitalSignature} from './vitalDefense.js';
import {TACTICAL_SHIP_SIGNATURES,tacticalShipSignatures,tacticalSignatureMatches,
 tacticalSignatureOperation} from './tacticalShipSignatures.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';

const cards=(a,b,c=null)=>[a,b,...(c==null?[]:[c])].map((value,i)=>({id:'c'+i,value,suit:['♣','♦','♥'][i]}));
const all2=Array.from({length:13*13},(_,n)=>cards(Math.floor(n/13)+1,n%13+1));
function mathSigOptions(sig){return sig.kind==='any'?sig.options:[sig];}
const sample=(op,target)=>{
 for(const vals of all2)if(tacticalSignatureMatches({kind:'mathGate',op,target,allowedCardCounts:[2,3]},op,vals))return vals;
 return null;
};
test('I 17 modelli hanno esattamente quattro firme stabili e senza duplicati di profilo',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 assert.equal(Object.keys(TACTICAL_SHIP_SIGNATURES).length,17);
 const printed=new Set();
 for(const ship of PHASE1_CATALOG.ships){
  const sig=tacticalShipSignatures(ship.id);
  assert.deepEqual(Object.keys(sig),VITAL_IDS,ship.id);
  assert.equal(tacticalShipSignatures(ship.id),sig,'stable canonical reference');
  const profile=JSON.stringify(sig);
  assert.equal(printed.has(profile),false,'profilo duplicato: '+ship.id);
  printed.add(profile);
  for(const id of VITAL_IDS){
   const sign=sig[id],options=mathSigOptions(sign);
   assert.ok(options.length>=1,ship.id+'/'+id);
   assert.ok(options.every(o=>['mathGate','poker'].includes(o.kind)));
   assert.ok(options.every(o=>o.kind==='mathGate'||['pair','trips'].includes(o.pattern)));
   const found=options.some(o=>o.kind==='mathGate'?!!sample(o.op,o.target):
    o.pattern==='pair'?matchesVitalSignature(o,cards(7,7)):
    matchesVitalSignature(o,cards(7,7,7)));
   assert.equal(found,true,'firma senza soluzione con 2/3 numeriche '+ship.id+'/'+id);
  }
 }
});
test('I target non sono una chiave nascosta: il modello nemico determina sempre le firme',()=>{
 const a=createTacticalDuel({shipA:'C01',shipB:'L04'});
 const b=createTacticalDuel({shipA:'L04',shipB:'C01'});
 assert.deepEqual(a.sides.A.defense.parts.engine.signature,tacticalShipSignatures('C01').engine);
 assert.deepEqual(a.sides.B.defense.parts.engine.signature,tacticalShipSignatures('L04').engine);
 assert.deepEqual(b.sides.A.defense.parts.engine.signature,tacticalShipSignatures('L04').engine);
 assert.deepEqual(b.sides.B.defense.parts.engine.signature,tacticalShipSignatures('C01').engine);
 assert.notDeepEqual(a.sides.A.defense.parts.engine.signature,a.sides.B.defense.parts.engine.signature);
});
test('La coppia e il tris Poker sono davvero alternative alla firma matematica senza aggirarla',()=>{
 const s=tacticalShipSignatures('L01').command;
 assert.equal(s.kind,'any');
 assert.equal(tacticalSignatureMatches(s,'trips',cards(8,8,8)),true);
 assert.equal(tacticalSignatureOperation(s,cards(8,8,8)),'trips');
 assert.equal(tacticalSignatureMatches(s,'pair',cards(8,8)),false);
 assert.equal(tacticalSignatureMatches(s,'plus',cards(8,8)),false);
 const math=s.options.find(o=>o.kind==='mathGate');
 const valid=sample(math.op,math.target);
 assert.ok(valid);
 assert.equal(tacticalSignatureMatches(s,math.op,valid),true);
 assert.equal(tacticalSignatureOperation(s,valid),math.op);
 assert.equal(tacticalSignatureMatches(s,'trips',valid),false);
});
test('C01 e R04 mantengono le combinazioni della simulazione iniziale',()=>{
 const c=tacticalShipSignatures('C01'),r=tacticalShipSignatures('R04');
 assert.equal(tacticalSignatureMatches(c.engine,'times',cards(3,4)),true);
 assert.equal(tacticalSignatureMatches(c.weapons,'minus',cards(8,5)),true);
 assert.equal(tacticalSignatureMatches(c.shieldGenerator,'plus',cards(4,5)),true);
 assert.equal(tacticalSignatureMatches(c.command,'pair',cards(7,7)),true);
 assert.equal(tacticalSignatureMatches(r.weapons,'minus',cards(8,5)),true);
 assert.equal(tacticalSignatureMatches(r.shieldGenerator,'plus',cards(4,5)),true);
 assert.equal(tacticalSignatureMatches(r.command,'pair',cards(7,7)),true);
});
test('La firma appartenente a un modello diverso non viene accettata dal motore',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'L04',nowMs:0});
 b.sides.B.defense.shield.hp=0;
 const a=sealTacticalOrder(b,'A',{specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'},100);
 assert.equal(a.ok,true);
 const c=sealTacticalOrder(a.battle,'B',{specialIndices:[],numericIndices:[]},101);
 assert.equal(c.ok,true);
 const result=advanceTacticalDuel(c.battle,101);
 // 8 minus 5 = 3 works for R04/C01, not the L04 heavy-gun signature (times 42).
 assert.equal(result.sides.B.defense.parts.weapons.hp,10);
 assert.ok(result.lastEvents.some(m=>m.includes('combinazione non valida')));
});
