import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS} from './vitalDefense.js';
import {systemState} from './fleetSystems.js';
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';
import {TACTICAL_PRECISION_BASE,tacticalPrecisionBaseDamage} from './tacticalPrecisionBalance.js';
import {createTacticalDuel,nativeBarrierPacket,sealTacticalOrder,advanceTacticalDuel,
 TACTICAL_TIMING} from './simultaneousDuelEngine.js';

const empty={numericIndices:[],specialIndices:[]};
// Prepara l'ordine di pesca all'interno del mazzo NUMERICO reale: usa soltanto
// carte già nella mano/deck, senza creare istanze, carte speciali o munizioni.
function stageLegitimateCards(battle,vitalId,number=2){
 const player=battle.sides.A.numeric;
 const available=[...player.hand,...player.deck];
 const signature=battle.sides.B.defense.parts[vitalId].signature;
 let selected=null;
 outer:for(let a=0;a<available.length;a++)for(let j=a+1;j<available.length;j++){
  if(number===2){
   const op=tacticalSignatureOperation(signature,[available[a],available[j]]);
   if(op){selected={chosen:[available[a],available[j]],op};break outer;}
  }else for(let k=j+1;k<available.length;k++){
   const op=tacticalSignatureOperation(signature,[available[a],available[j],available[k]]);
   if(op){selected={chosen:[available[a],available[j],available[k]],op};break outer;}
  }
 }
 assert.ok(selected,'Non esiste combinazione vera per '+battle.sides.B.shipId+' '+vitalId);
 const ids=new Set(selected.chosen.map(c=>c.id));
 const rest=available.filter(c=>!ids.has(c.id));
 player.hand=[...selected.chosen,...rest.slice(0,7-number)];
 player.deck=rest.slice(7-number);
 const num=[...player.hand,...player.deck,...player.discard];
 assert.equal(num.length,52,'Carte numeriche conservate');
 assert.equal(new Set(num.map(c=>c.id)).size,52,'Nessuna duplicazione');
 return {specialIndices:[],numericIndices:selected.chosen.map((_,i)=>i),
  vitalId,op:selected.op};
}
function fire(b,orderA,orderB=empty){
 const at=b.deadlineMs-TACTICAL_TIMING.prepareMs+1;
 const a=sealTacticalOrder(b,'A',orderA,at);
 assert.equal(a.ok,true,'ordine A '+a.reason);
 const z=sealTacticalOrder(a.battle,'B',orderB,at+1);
 assert.equal(z.ok,true,'ordine B '+z.reason);
 const result=advanceTacticalDuel(z.battle,at+1);
 assert.equal(result.phase,'resolving');
 return result;
}
test('Precisione standard: 2 numeriche = 6 HP, 3 numeriche = 8 HP; mai danno automatico',()=>{
 assert.deepEqual(TACTICAL_PRECISION_BASE,{twoCards:6,threeCards:8});
 assert.equal(tacticalPrecisionBaseDamage(2),6);
 assert.equal(tacticalPrecisionBaseDamage([1,2]),6);
 assert.equal(tacticalPrecisionBaseDamage(3),8);
 assert.equal(tacticalPrecisionBaseDamage([1,2,3]),8);
 for(const invalid of [0,1,4,5,null,undefined])assert.equal(tacticalPrecisionBaseDamage(invalid),0);
 assert.equal(TACTICAL_TIMING.maxRounds,20);
});

test('I 68 vitali di tutte le 17 madri, a L1 e L5, diventano danneggiati al primo colpo normale',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 let validated=0;
 for(const ship of PHASE1_CATALOG.ships)for(const level of [1,5])for(const vitalId of VITAL_IDS){
  const b=createTacticalDuel({shipA:'C01',shipB:ship.id,levelA:1,levelB:level,seed:18});
  b.sides.B.defense.shield.hp=0; // Quattro soglie aperte, ma i pezzi restano integri.
  const baseline=nativeBarrierPacket(b.sides.B);
  const order=stageLegitimateCards(b,vitalId);
  const out=fire(b,order);
  const part=out.sides.B.defense.parts[vitalId];
  const impact=out.history.at(-1).impacts.find(x=>x.kind==='precision'&&x.by==='A');
  assert.equal(impact?.damage,6,ship.id+' '+vitalId+' L'+level);
  assert.equal(part.hp,4,ship.id+' '+vitalId+' L'+level);
  assert.equal(systemState(out.sides.B.defense,vitalId),'damaged');
  assert.equal(out.winner,null,'Primo colpo non vince automaticamente');
  assert.ok(out.lastEvents.some(x=>x.includes('DANNEGGIATO')),
   'La conseguenza strategica entra nel registro');
  if(vitalId==='engine'||vitalId==='weapons')
   assert.ok(nativeBarrierPacket(out.sides.B)<baseline,
    'Il sistema danneggiato riduce il vero fuoco nativo');
  validated++;
 }
 assert.equal(validated,136);
});

test('Tre carte: colpo da 8 HP lascia un vitale 2/10 in avaria senza cancellarlo',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'C01',levelA:1,levelB:1});
 b.sides.B.defense.shield.hp=0;
 const order=stageLegitimateCards(b,'engine',3);
 const result=fire(b,order);
 assert.equal(result.sides.B.defense.parts.engine.hp,2);
 assert.equal(result.history[0].hitsA,8);
 assert.equal(systemState(result.sides.B.defense,'engine'),'damaged');
});

test('Secondo colpo valido abbatte un sistema in avaria e applica il KO reale nel ciclo successivo',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:1,levelB:1});
 b.sides.B.defense.shield.hp=0;
 const first=fire(b,stageLegitimateCards(b,'weapons'));
 assert.equal(first.sides.B.defense.parts.weapons.hp,4);
 assert.equal(systemState(first.sides.B.defense,'weapons'),'damaged');
 const secondRound=advanceTacticalDuel(first,first.resolveUntilMs);
 assert.equal(secondRound.round,2);
 const next=fire(secondRound,stageLegitimateCards(secondRound,'weapons'));
 assert.equal(next.sides.B.defense.parts.weapons.hp,0);
 assert.equal(systemState(next.sides.B.defense,'weapons'),'destroyed');
 assert.ok(next.lastEvents.some(x=>x.includes('DISTRUTTO')));
 assert.equal(next.history.at(-1).hitsA,4,'Non colpire HP sotto zero');
 assert.equal(next.sides.B.numeric.hand.length,7);
 assert.equal(next.sides.A.special.hand.length,5);
});
