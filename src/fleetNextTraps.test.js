import test from 'node:test';
import assert from 'node:assert/strict';
import {card,STARTER_DECK,deckFromCounts} from './fleetNext/rules.js';
import {
 createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,autoFleetTurn,
 defenseSlotsAvailable,defenseCapacityReason,effectUnavailableReason
} from './fleetNext/combat.js';
import {TERRAIN_CATALOG,newTerrain,neutralTerrain} from './fleetNext/terrains.js';

const TRAP='gen-077',PLASMA='gen-238',REPAIR='gen-171',DODGE='gen-072';
const base=deckFromCounts(STARTER_DECK.carteGenerali);
const copy=value=>JSON.parse(JSON.stringify(value));
function make(options={}){
 return createFleetNextBattle({shipA:'C01',shipB:'C01',levelA:1,levelB:1,
  deckA:base,deckB:base,mode:'pvp',seed:77,...options});
}
function hand(b,ids,who=b.turn){
 b.sides[who].hand=[...ids,...Array(Math.max(0,7-ids.length)).fill('gen-002')];
 return b;
}
function play(b,ids=[],order={}){
 if(ids.length)hand(b,ids);
 const result=resolveFleetNextTurn(b,b.turn,{cards:ids.map((_,i)=>i),pass:true,partId:'engine',...order},b.ply*1000+1);
 assert.equal(result.ok,true,result.reason);
 return result;
}
const pass=b=>play(b).battle;
const setTrap=(b=make())=>play(b,[TRAP]).battle;
const engine=(b,who)=>b.sides[who].ships[0].parts.find(p=>p.id==='engine');
const countCard=(side,id)=>[...side.hand,...side.deck,...side.discard,
 ...side.defenses.map(d=>d.id),...(side.commander?[side.commander.id]:[])].filter(x=>x===id).length;
const cardTotal=side=>side.hand.length+side.deck.length+side.discard.length+
 side.defenses.length+(side.commander?1:0);

test('La trappola si prepara coperta, resta sul campo e non produce effetti immediati',()=>{
 const initial=hand(make(),[TRAP]);
 const before=copy(initial);
 const result=resolveFleetNextTurn(initial,'A',{cards:[0],pass:true});
 assert.equal(result.ok,true);assert.deepEqual(initial,before,'Il turno non muta la partita ricevuta');
 let b=result.battle;
 assert.equal(b.sides.A.defenses.length,1);
 assert.equal(b.sides.A.defenses[0].hidden,true);
 assert.equal(b.sides.A.defenses[0].untilPly,null);
 assert.equal(b.sides.A.protections.length,0);
 assert.equal(b.sides.A.reactions.length,0);
 assert.equal(b.terrain.id,null);
 for(let i=0;i<8;i++)b=pass(b);
 assert.equal(b.sides.A.defenses.length,1);
 assert.equal(b.sides.A.defenses[0].id,TRAP);
 assert.equal(b.sides.A.discard.filter(id=>id===TRAP).length,0);
});

test('Il Terreno avversario è annullato prima di aggiungere potenza alla salva',()=>{
 const b=setTrap();
 const normalPower=1+b.sides.B.ships[0].weaponRating;
 const result=play(b,[PLASMA],{pass:false});
 assert.equal(result.battle.terrain.id,null);
 assert.equal(result.shot.power,normalPower);
 assert.equal(result.battle.sides.A.defenses.length,0);
 assert.equal(result.battle.sides.A.discard.filter(id=>id===TRAP).length,1);
 assert.equal(result.battle.sides.B.discard.filter(id=>id===PLASMA).length,1);
 const reveal=result.events.findIndex(e=>e.kind==='trap-reveal');
 const cancelled=result.events.findIndex(e=>e.kind==='terrain-cancelled');
 const impact=result.events.findIndex(e=>e.kind==='impact');
 assert.ok(reveal>=0&&cancelled>reveal&&impact>cancelled);
 assert.equal(result.events[reveal].cardId,TRAP);
 assert.equal(result.events[reveal].blockedCardId,PLASMA);
 assert.equal(result.events[reveal].who,'A');
 assert.ok(!result.events.some(e=>e.kind==='card'&&e.cardId===PLASMA));
});

test('Un Terreno annullato conserva il Terreno precedente e la sua scadenza',()=>{
 const initial=make();initial.terrain=newTerrain('gen-231',0,'A');
 const b=setTrap(initial),previous=copy(b.terrain);
 const result=play(b,[PLASMA],{pass:false});
 assert.deepEqual(result.battle.terrain,previous);
 assert.equal(result.shot.power,b.sides.B.ships[0].weaponRating);
 assert.equal(result.battle.terrain.expiresPly,6);
 let next=result.battle;
 while(next.ply<6)next=pass(next);
 assert.deepEqual(next.terrain,neutralTerrain());
});

test('La trappola annulla ciascuno dei dieci Terreni senza applicarne la regola',()=>{
 for(const terrain of Object.values(TERRAIN_CATALOG)){
  const b=setTrap();
  const result=play(b,[terrain.cardId]);
  assert.equal(result.battle.terrain.id,null,terrain.code);
  assert.equal(result.events.filter(e=>e.kind==='trap-reveal').length,1,terrain.code);
  assert.equal(result.events.filter(e=>e.kind==='terrain-cancelled').length,1,terrain.code);
 }
});

test('Due trappole identiche consumano soltanto quella necessaria',()=>{
 let b=play(make(),[TRAP,TRAP]).battle;
 const sources=b.sides.A.defenses.map(d=>d.source);
 let result=play(b,[PLASMA]);b=result.battle;
 assert.equal(result.events.filter(e=>e.kind==='trap-reveal').length,1);
 assert.equal(b.sides.A.defenses.length,1);
 assert.equal(b.sides.A.defenses[0].source,sources[1]);
 assert.equal(b.sides.A.defenses[0].hidden,true);
 assert.equal(b.sides.A.discard.filter(id=>id===TRAP).length,1);
 b=pass(b);result=play(b,['gen-245']);b=result.battle;
 assert.equal(b.sides.A.defenses.length,0);
 assert.equal(b.sides.A.discard.filter(id=>id===TRAP).length,2);
 assert.equal(b.terrain.id,null);
});

test('Terreni propri, attacchi, carte diverse e scadenze non consumano la trappola',()=>{
 let b=setTrap();
 b=play(b,['gen-002'],{pass:false}).battle;
 assert.equal(b.sides.A.defenses.length,1);
 b=play(b,[PLASMA]).battle;
 assert.equal(b.terrain.id,'T02');
 assert.equal(b.sides.A.defenses.length,1);
 for(let i=0;i<6;i++)b=pass(b);
 assert.equal(b.terrain.id,null);
 assert.equal(b.sides.A.defenses.length,1);
 assert.ok(!b.log.some(e=>e.kind==='trap-reveal'));
});

test('La trappola funziona anche dalla parte B e sui Terreni giocati dai boss',()=>{
 let b=pass(make());b=setTrap(b);
 let result=play(b,[PLASMA]);
 assert.equal(result.battle.terrain.id,null);
 assert.equal(result.events.find(e=>e.kind==='trap-reveal').who,'B');
 b=setTrap(make({bossId:6}));const original=copy(b.terrain);
 result=play(b,['gen-245']);
 assert.deepEqual(result.battle.terrain,original);
 assert.equal(result.battle.terrain.source,'boss');
});

test('Due Difese occupate impediscono una terza senza scartare carte nascoste',()=>{
 let b=play(make(),[TRAP,TRAP]).battle;b=pass(b);hand(b,['gen-071']);
 const before=copy(b);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply),0);
 assert.match(defenseCapacityReason(b.sides.A,1,b.ply),/occupati/);
 assert.match(effectUnavailableReason(card('gen-071'),b.sides.A,b),/occupati/);
 const result=resolveFleetNextTurn(b,'A',{cards:[0],pass:true});
 assert.equal(result.ok,false);assert.match(result.reason,/occupati/);
 assert.deepEqual(result.battle,before);
 assert.deepEqual(b,before);
});

test('Le Difese normali occupano gli stessi due spazi e la scadenza li libera',()=>{
 let b=play(make(),['gen-092',TRAP]).battle;b=pass(b);hand(b,['gen-071']);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply),0);
 assert.match(validateFleetTurn(b,'A',{cards:[0],pass:true}),/occupati/);
 b=pass(b);b=pass(b);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply),1);
 b=play(b,['gen-071']).battle;
 assert.equal(b.sides.A.defenses.length,2);
 assert.equal(b.sides.A.defenses.filter(d=>d.hidden).length,1);
});

test('Preparare trappole rispetta i limiti del turno e gli spazi già occupati',()=>{
 const initial=hand(make(),[TRAP,TRAP,TRAP]);
 assert.match(validateFleetTurn(initial,'A',{cards:[0,1,2],pass:true}),/due carte Difesa/);
 assert.match(validateFleetTurn(initial,'A',{cards:[0,1,2,3],pass:true}),/tre carte/);
 let b=setTrap();b=pass(b);hand(b,[TRAP,'gen-071']);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply),1);
 assert.match(validateFleetTurn(b,'A',{cards:[0,1],pass:true}),/una sola/);
 assert.equal(validateFleetTurn(b,'A',{cards:[0],pass:true}),null);
});

test('Preparazione e annullamento conservano il numero reale delle carte',()=>{
 const initial=hand(make(),[TRAP]);hand(initial,[PLASMA],'B');
 const totals={A:cardTotal(initial.sides.A),B:cardTotal(initial.sides.B)};
 const trapCopies=countCard(initial.sides.A,TRAP),terrainCopies=countCard(initial.sides.B,PLASMA);
 const prepared=resolveFleetNextTurn(initial,'A',{cards:[0],pass:true});
 const result=resolveFleetNextTurn(prepared.battle,'B',{cards:[0],pass:true});
 assert.equal(result.ok,true,result.reason);
 for(const who of ['A','B'])assert.equal(cardTotal(result.battle.sides[who]),totals[who]);
 assert.equal(countCard(result.battle.sides.A,TRAP),trapCopies);
 assert.equal(countCard(result.battle.sides.B,PLASMA),terrainCopies);
});

test('Identità e rarità della trappola non compaiono nei dati pubblici prima dello scatto',()=>{
 const result=play(make(),[TRAP,'gen-002'],{pass:false});
 const published=JSON.stringify({events:result.events,log:result.battle.log,
  lastEvents:result.battle.lastEvents,shot:result.shot,lastPlayed:result.battle.sides.A.lastPlayed});
 assert.ok(!published.includes(TRAP));
 assert.ok(!published.includes('Ancora di Campo'));
 assert.ok(!published.includes('rarita'));
 assert.equal(result.events.filter(e=>e.kind==='trap-set').length,1);
 assert.ok(result.events.some(e=>e.cardId==='gen-002'));
 const triggered=play(result.battle,[PLASMA]);
 assert.ok(triggered.events.some(e=>e.cardId===TRAP&&e.kind==='trap-reveal'));
});

test('L’IA prepara le proprie trappole e rispetta gli spazi occupati',()=>{
 const b=make();b.sides.A.hand=[TRAP];
 const order=autoFleetTurn(b,'A');assert.deepEqual(order.cards,[0]);
 const result=resolveFleetNextTurn(b,'A',order);assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.sides.A.defenses[0].hidden,true);
 let full=play(make(),[TRAP,TRAP]).battle;full=pass(full);full.sides.A.hand=[TRAP];
 assert.deepEqual(autoFleetTurn(full,'A').cards,[]);
});

test('La scelta dell’IA e la validazione non interrogano l’identità delle trappole avversarie',()=>{
 const withTrap=setTrap();withTrap.sides.B.hand=[PLASMA];
 const withoutTrap=copy(withTrap);withoutTrap.sides.A.defenses=[];withoutTrap.sides.A.defenseSlots=[];
 const fakeTrap=copy(withTrap);fakeTrap.sides.A.defenses[0].id='identita-segreta';
 const order={cards:[0],pass:false,partId:'engine'};
 assert.equal(validateFleetTurn(withTrap,'B',order),validateFleetTurn(withoutTrap,'B',order));
 assert.deepEqual(autoFleetTurn(withTrap,'B'),autoFleetTurn(withoutTrap,'B'));
 assert.deepEqual(autoFleetTurn(withTrap,'B'),autoFleetTurn(fakeTrap,'B'));
});

test('La riparazione resa impossibile dal Terreno annullato resta in mano, in qualsiasi ordine',()=>{
 for(const ids of [[REPAIR,PLASMA],[PLASMA,REPAIR]]){
  const initial=make();initial.terrain={id:'T08',source:'campaign',expiresPly:null};
  const b=setTrap(initial);engine(b,'B').hp-=2;engine(b,'B').damage=1;
  const hp=engine(b,'B').hp;hand(b,ids);
  const beforeTotal=cardTotal(b.sides.B),copies=countCard(b.sides.B,REPAIR);
  const order={cards:[0,1],pass:true,ownPartId:'engine'};
  const noTrap=copy(b);noTrap.sides.A.defenses=[];noTrap.sides.A.defenseSlots=[];
  assert.equal(validateFleetTurn(b,'B',order),null);
  assert.equal(validateFleetTurn(noTrap,'B',order),null);
  const result=resolveFleetNextTurn(b,'B',order);assert.equal(result.ok,true,result.reason);
  assert.equal(result.battle.terrain.id,'T08');assert.equal(engine(result.battle,'B').hp,hp);
  assert.equal(result.battle.sides.B.hand.filter(id=>id===REPAIR).length,1);
  assert.ok(!result.battle.sides.B.discard.includes(REPAIR));
  assert.ok(!result.battle.sides.B.lastPlayed.includes(REPAIR));
  assert.ok(!result.shot.played.includes(REPAIR));
  assert.equal(cardTotal(result.battle.sides.B),beforeTotal);
  assert.equal(countCard(result.battle.sides.B,REPAIR),copies);
  assert.equal(result.events.filter(e=>e.kind==='card-returned'&&e.cardId===REPAIR).length,1);
 }
});

test('La schivata non viene consumata quando la trappola lascia attiva Distesa Gelida',()=>{
 const initial=make();initial.terrain={id:'T01',source:'campaign',expiresPly:null};
 const result=play(setTrap(initial),[DODGE,PLASMA],{ownPartId:'engine'});
 assert.equal(result.battle.terrain.id,'T01');
 assert.ok(result.battle.sides.B.hand.includes(DODGE));
 assert.equal(result.battle.sides.B.defenses.length,0);
 assert.equal(result.battle.sides.B.protections.length,0);
 assert.ok(!result.battle.sides.B.discard.includes(DODGE));
 assert.ok(!result.battle.sides.B.lastPlayed.includes(DODGE));
 assert.equal(result.events.filter(e=>e.kind==='card-returned').length,1);
});

test('Una carta che rimane utilizzabile dopo l’annullamento risolve normalmente',()=>{
 const b=setTrap();engine(b,'B').hp-=2;engine(b,'B').damage=1;
 const hp=engine(b,'B').hp;
 const result=play(b,[PLASMA,REPAIR],{ownPartId:'engine'});
 assert.equal(engine(result.battle,'B').hp,hp+1);
 assert.ok(result.battle.sides.B.discard.includes(REPAIR));
 assert.ok(!result.events.some(e=>e.kind==='card-returned'));
});
