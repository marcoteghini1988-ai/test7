import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {
 TACTICAL_TIMING,TACTICAL_SPECIALS,TACTICAL_STARTER_TYPES,
 createTacticalDuel,nativeBarrierPacket,validateTacticalOrder,
 sealTacticalOrder,advanceTacticalDuel
} from './simultaneousDuelEngine.js';

const order=(p={})=>({specialIndices:[],numericIndices:[],...p});
function commit(b,a=order(),bb=order()){
 const one=sealTacticalOrder(b,'A',a,100);
 assert.equal(one.ok,true,one.reason);
 const two=sealTacticalOrder(one.battle,'B',bb,101);
 assert.equal(two.ok,true,two.reason);
 return advanceTacticalDuel(two.battle,101);
}
function shield(b,hp=40){
 const n=structuredClone(b);
 n.sides.A.defense.shield.hp=hp;
 n.sides.B.defense.shield.hp=hp;
 return n;
}
const count=p=>p.hand.length+p.deck.length+p.discard.length;
test('Ciclo 30s/8s: il motore resta separato, niente vincitore automatico',()=>{
 const b=createTacticalDuel();
 assert.equal(b.phase,'planning');
 assert.equal(b.deadlineMs,30000);
 assert.equal(TACTICAL_TIMING.resolveMs,8000);
 assert.equal(b.sides.A.numeric.hand.length,7);
 assert.equal(b.sides.A.special.hand.length,5);
 assert.equal(count(b.sides.A.numeric),52);
 assert.equal(count(b.sides.A.special),24);
 assert.equal(TACTICAL_STARTER_TYPES.length,24);
 assert.equal(Object.keys(TACTICAL_SPECIALS).length,37); // 25 precedenti + 12 Personaggi Boss
 assert.equal(b.winner,null);
});
test('Tutte le 17 navi hanno fuoco nativo dai veri armamenti del catalogo, anche senza calcolo',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 assert.equal(PHASE1_CATALOG.weapons.length,42);
 for(const ship of PHASE1_CATALOG.ships){
  const b=createTacticalDuel({shipA:ship.id});
  assert.ok(b.sides.A.weapons.length>=1,ship.id);
  assert.deepEqual(b.sides.A.weapons.map(x=>x.id),
   PHASE1_CATALOG.weapons.filter(x=>x.nave_id===ship.id).map(x=>x.id));
  assert.ok(nativeBarrierPacket(b.sides.A)>0,ship.id);
 }
 const b=commit(createTacticalDuel());
 assert.equal(b.phase,'resolving');
 assert.ok(b.sides.A.defense.shield.hp<60);
 assert.ok(b.sides.B.defense.shield.hp<60);
 assert.ok(b.history[0].events.some(x=>x.includes('armi native')));
});
test('Ordini simultanei segreti, irrevocabili e nessun vantaggio per chi conferma prima',()=>{
 const b=shield(createTacticalDuel());
 const a=order({numericIndices:[3,2],vitalId:'weapons',op:'minus'});
 const bb=order({numericIndices:[2,3],vitalId:'engine',op:'times'});
 const first=sealTacticalOrder(b,'A',a,50);
 assert.equal(first.ok,true);
 a.numericIndices.push(0); // non deve cambiare l'ordine sigillato
 assert.deepEqual(first.battle.orders.A.numericIndices,[3,2]);
 assert.equal(sealTacticalOrder(first.battle,'A',order(),51).reason,'already_committed');
 assert.equal(advanceTacticalDuel(first.battle,100).phase,'planning');
 const x=commit(b,order({numericIndices:[3,2],vitalId:'weapons',op:'minus'}),bb);
 const one=sealTacticalOrder(b,'B',bb,100).battle;
 const two=sealTacticalOrder(one,'A',order({numericIndices:[3,2],vitalId:'weapons',op:'minus'}),101).battle;
 const y=advanceTacticalDuel(two,101);
 assert.deepEqual(x.sides,y.sides);
 assert.deepEqual(x.lastEvents,y.lastEvents);
 assert.equal(x.sides.B.defense.parts.weapons.hp,0);
 assert.equal(x.sides.A.defense.parts.engine.hp,0);
 assert.equal(advanceTacticalDuel(x,8100).phase,'resolving');
 assert.equal(advanceTacticalDuel(x,8101).phase,'planning');
});
test('Timeout: ordini mancanti diventano passivi, un ordine tardivo non è ammesso',()=>{
 const b=createTacticalDuel();
 const x=advanceTacticalDuel(b,30000);
 assert.equal(x.phase,'resolving');
 assert.equal(x.history.length,1);
 assert.deepEqual(x.history[0].orders.A.specialIndices,[]);
 assert.equal(sealTacticalOrder(b,'A',order(),30000).reason,'preparation_expired');
 const next=advanceTacticalDuel(x,38000);
 assert.equal(next.round,2);
 assert.equal(next.deadlineMs,68000);
});
test('Combinazione valida colpisce esclusivamente vitale esposto dopo barriera; combo errata non ferisce',()=>{
 const base=createTacticalDuel();
 const miss=commit(base,order({numericIndices:[3,2],vitalId:'weapons',op:'minus'}));
 assert.equal(miss.sides.B.defense.parts.weapons.hp,10);
 assert.ok(miss.lastEvents.some(x=>x.includes('ancora protetto')));
 const exposed=commit(shield(base),order({numericIndices:[3,2],vitalId:'weapons',op:'minus'}));
 assert.equal(exposed.sides.B.defense.parts.weapons.hp,0);
 const invalid=commit(shield(base),order({numericIndices:[0,1],vitalId:'weapons',op:'minus'}));
 assert.equal(invalid.sides.B.defense.parts.weapons.hp,10);
 assert.ok(invalid.lastEvents.some(x=>x.includes('combinazione non valida')));
});
test('La barriera dipende da armi native, non dalla presenza di numeriche impegnate',()=>{
 const b=shield(createTacticalDuel());
 const empty=commit(b);
 const active=commit(b,order({numericIndices:[3,2],vitalId:'weapons',op:'minus'}));
 assert.equal(empty.sides.B.defense.shield.hp,active.sides.B.defense.shield.hp);
});
test('Contromisura preparata protegge un vitale specifico e si consuma',()=>{
 const b=shield(createTacticalDuel());
 const before=b.sides.B.special.hand.map(c=>c.type);
 assert.equal(before[3],'tactic-counter');
 const r=commit(b,order({numericIndices:[3,2],vitalId:'weapons',op:'minus'}),
  order({specialIndices:[3],counterVitalId:'weapons'}));
 assert.equal(r.sides.B.defense.parts.weapons.hp,10);
 assert.equal(r.sides.B.special.discard.some(c=>c.type==='tactic-counter'),true);
 assert.ok(r.lastEvents.some(x=>x.includes('Contromisura programmata')));
});
test('Fusione difensiva paga 100 Sincronia e consuma HP veri della scudiera',()=>{
 const b=shield(createTacticalDuel());
 b.sides.A.sync=100;
 assert.equal(b.sides.A.special.hand[3].type,'fusion-barrier');
 const r=commit(b,order({specialIndices:[3]}),
  order({numericIndices:[2,3],vitalId:'engine',op:'times'}));
 assert.ok(r.sides.A.defense.parts.engine.hp>0&&r.sides.A.defense.parts.engine.hp<10);
 assert.ok(r.sides.A.escorts[0].hp<20);
 assert.equal(r.sides.A.sync,25);
 assert.ok(r.lastEvents.some(x=>x.includes('HP reali')));
});
test('Le carte non vengono generate dal nulla, riciclo e vincoli degli ordini',()=>{
 const b=createTacticalDuel();
 assert.equal(validateTacticalOrder(b,'A',order({specialIndices:[1,1]})).reason,'special_selection');
 assert.equal(validateTacticalOrder(b,'A',order({numericIndices:[1]})).reason,'numeric_count');
 assert.equal(validateTacticalOrder(b,'A',order({numericIndices:[0,1],vitalId:'engine',op:'nonsense'})).reason,'invalid_precision');
 assert.equal(validateTacticalOrder(b,'A',order({exchangeIndices:[1]})).ok,true);
 assert.equal(validateTacticalOrder(b,'A',order({exchangeIndices:[1,2]})).reason,'recycle_requires_card');
 assert.equal(validateTacticalOrder(b,'A',order({exchangeIndices:[1],numericIndices:[3,2],vitalId:'weapons',op:'minus'})).reason,'recycle_requires_card');
 assert.equal(validateTacticalOrder(b,'A',order({specialIndices:[3]})).reason,'fusion_unavailable');
 assert.equal(validateTacticalOrder(b,'A',order({specialIndices:[4]})).reason,'counter_target');
 const r=commit(b,order({specialIndices:[0,1]}));
 for(const key of ['A','B']){
  assert.equal(count(r.sides[key].numeric),52);
  assert.equal(count(r.sides[key].special),24);
  assert.equal(r.sides[key].special.hand.length,5);
  assert.equal(r.sides[key].numeric.hand.length,7);
 }
});
test('Doppio KO nello stesso scontro dà pareggio e non vittoria al primo che spara',()=>{
 const b=createTacticalDuel();
 for(const key of ['A','B']){
  const d=b.sides[key].defense;
  d.shield.hp=0;
  for(const id of ['engine','weapons','shieldGenerator'])d.parts[id].hp=0;
  d.parts.command.hp=10;
 }
 const x=commit(b,order({numericIndices:[4,5],vitalId:'command',op:'pair'}),
  order({numericIndices:[5,6],vitalId:'command',op:'pair'}));
 assert.equal(x.sides.A.defense.parts.command.hp,0);
 assert.equal(x.sides.B.defense.parts.command.hp,0);
 assert.equal(x.winner,'draw');
 assert.equal(advanceTacticalDuel(x,8101).phase,'finished');
});
test('Generatore distrutto collassa barriera e impedisce riciclo salute; penalità arma nativa',()=>{
 const b=shield(createTacticalDuel());
 const original=nativeBarrierPacket(b.sides.A);
 b.sides.A.defense.parts.weapons.hp=0;
 assert.ok(nativeBarrierPacket(b.sides.A)<original);
 const x=commit(b,order({numericIndices:[1,2],vitalId:'shieldGenerator',op:'plus'}));
 assert.equal(x.sides.B.defense.parts.shieldGenerator.hp,0);
 assert.equal(x.sides.B.defense.shield.hp,0);
});

test('Anti-stallo: lo scarto gratuito sostituisce una sola numerica e conserva 52 carte reali',()=>{
 const base=createTacticalDuel();
 const spent=base.sides.A.numeric.hand[0].id;
 const result=commit(base,order({exchangeIndices:[0]}));
 assert.equal(result.sides.A.numeric.hand.length,7);
 assert.equal(result.sides.A.numeric.discard.some(c=>c.id===spent),true);
 assert.equal(result.sides.A.numeric.hand.some(c=>c.id===spent),false);
 assert.equal(count(result.sides.A.numeric),52);
 assert.equal(result.history[0].orders.A.exchangeIndices.length,1);
 assert.equal(result.history[0].hitsA,0);
});
test('Ricambio specializzato: due numeriche richiedono la carta fisica e non creano doppioni',()=>{
 const base=createTacticalDuel();
 const side=base.sides.A;
 const ix=side.special.deck.findIndex(c=>c.type==='tactic-numeric-recycle');
 assert.ok(ix>=0);
 [side.special.deck[ix],side.special.hand[0]]=[side.special.hand[0],side.special.deck[ix]];
 const ids=side.numeric.hand.slice(0,2).map(c=>c.id);
 const result=commit(base,order({specialIndices:[0],exchangeIndices:[0,1]}));
 assert.deepEqual(ids.every(id=>result.sides.A.numeric.discard.some(c=>c.id===id)),true);
 assert.equal(count(result.sides.A.numeric),52);
 assert.equal(count(result.sides.A.special),24);
 assert.equal(result.sides.A.special.discard.some(c=>c.type==='tactic-numeric-recycle'),true);
});
