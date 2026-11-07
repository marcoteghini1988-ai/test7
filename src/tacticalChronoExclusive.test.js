import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket}
 from './simultaneousDuelEngine.js';
import {exclusiveChronoNativeBonus,rememberExclusiveChronoCounter,
 rememberExclusiveChronoNativeHit} from './tacticalExclusiveBosses.js';

const empty=()=>({specialIndices:[],numericIndices:[]});
const offensive=()=>({specialIndices:[],numericIndices:[3,2],vitalId:'weapons',op:'minus'});
const block=()=>({specialIndices:[3],counterVitalId:'weapons'});
function battle(planet=6){
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:1,levelB:1,bossPlanetB:planet});
 b.sides.A.defense.shield.max=250;
 b.sides.A.defense.shield.hp=250;
 b.sides.B.defense.shield.hp=40;
 return b;
}
function turn(b,aa=empty(),bb=empty(),now=100){
 const a=sealTacticalOrder(b,'A',aa,now);
 assert.equal(a.ok,true,a.reason);
 const c=sealTacticalOrder(a.battle,'B',bb,now+1);
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,now+1);
}
const barrierB=r=>r.history.at(-1).impacts.find(p=>p.kind==='barrier'&&p.by==='B');

test('Crono: la Contromisura reale contro una firma valida prepara il bonus, senza contrattacco immediato',()=>{
 const b=battle();
 const base=nativeBarrierPacket(b.sides.B);
 const r=turn(b,offensive(),block());
 assert.equal(r.sides.B.defense.parts.weapons.hp,10);
 assert.equal(r.history[0].impacts.find(i=>i.kind==='precision').reason,'countered');
 assert.equal(r.sides.B.bossExclusive.counterArmedAfterRound,1);
 assert.equal(r.sides.B.bossExclusive.counterExpiresRound,3);
 assert.ok(r.lastEvents.some(t=>t.includes('Controtempo caricato')));
 assert.equal(barrierB(r).damage,base,'Nessun bonus prima della contromisura: fuoco iniziale normale');
});
test('Crono: entro due cicli +5% solo sul colpo nativo reale e carica consumata',()=>{
 const ordinary=turn(battle(null),offensive(),block());
 const chrono=turn(battle(6),offensive(),block());
 const normalRound2=turn(advanceTacticalDuel(ordinary,8102),empty(),empty(),8200);
 const chronoRound2=turn(advanceTacticalDuel(chrono,8102),empty(),empty(),8200);
 assert.equal(barrierB(chronoRound2).damage,barrierB(normalRound2).damage+
  Math.ceil(nativeBarrierPacket(chrono.sides.B)*.05-1e-9));
 assert.ok(chronoRound2.lastEvents.some(t=>t.includes('Controtempo +5%')));
 assert.equal(chronoRound2.sides.B.bossExclusive.counterArmedAfterRound,0);
 assert.equal(chronoRound2.sides.B.bossExclusive.counterExpiresRound,0);
});
test('Crono: firma falsa, carta non giocata o colpo protetto non concedono carica',()=>{
 const noCard=turn(battle(),offensive(),empty());
 assert.equal(noCard.sides.B.bossExclusive.counterArmedAfterRound??0,0);
 const invalid=turn(battle(),{...offensive(),op:'plus'},block());
 assert.equal(invalid.sides.B.bossExclusive.counterArmedAfterRound??0,0);
 const protectedBattle=battle();
 protectedBattle.sides.B.defense.shield.hp=60;
 const shielded=turn(protectedBattle,offensive(),block());
 assert.equal(shielded.sides.B.bossExclusive.counterArmedAfterRound??0,0);
});
test('Crono: carica scade dopo due cicli senza danno vero, nessuna energia gratis',()=>{
 const first=turn(battle(),offensive(),block());
 const secondReady=advanceTacticalDuel(first,8102);
 secondReady.sides.A.defense.shield.hp=0;
 const second=turn(secondReady,empty(),empty(),8200);
 assert.equal(barrierB(second).damage,0);
 assert.equal(second.sides.B.bossExclusive.counterArmedAfterRound,1);
 const thirdReady=advanceTacticalDuel(second,16201);
 const third=turn(thirdReady,empty(),empty(),16300);
 assert.equal(barrierB(third).damage,0);
 assert.equal(third.sides.B.bossExclusive.counterArmedAfterRound,0);
});
test('Crono: lo stato del potere non si attiva se il duello non e contro il boss vero',()=>{
 const normal={bossExclusive:null},proto={bossExclusive:{id:6}},splash={};
 assert.equal(rememberExclusiveChronoCounter(normal,1),false);
 assert.equal(exclusiveChronoNativeBonus(normal,30,2).active,false);
 assert.equal(rememberExclusiveChronoCounter(proto,1),true);
 assert.equal(exclusiveChronoNativeBonus(proto,30,1).active,false);
 assert.equal(exclusiveChronoNativeBonus(proto,30,2).extra,2);
 rememberExclusiveChronoNativeHit(proto,2,0,exclusiveChronoNativeBonus(proto,30,2));
 assert.equal(proto.bossExclusive.counterArmedAfterRound,1);
 assert.deepEqual(splash,{});
});
