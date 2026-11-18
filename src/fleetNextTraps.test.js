import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardRole} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,autoFleetTurn,
 defenseSlotsAvailable,defenseCapacityReason,effectUnavailableReason,protectingFleetUnits
} from './fleetNext/combat.js';
import {isTrapCard} from './fleetNext/simpleEffects.js';
import {projectFleetSlots,fleetEventText} from './fleetNext/battlePresentation.js';
import {bossTerrain,TERRAIN_CATALOG} from './fleetNext/terrains.js';

// Verifiche del sistema di trappole ATTIVO, dopo il ritiro del vecchio mazzo
// (gen-077, gen-238, gen-171, gen-072 non sono più carte giocabili).
const ECHO='nx-c03-04',CHANNEL='nx-c03-03',DART='nx-c03-02';
const FALSE_TRAIL='nx-c01-04',FALSE_REFLECTION='nx-c02-04';
function battle({shipA='C03',shipB='C03',levelA=shipMaxLevel(shipA),levelB=shipMaxLevel(shipB),bossId=null}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,mode:'pvp',
  deckA:[],deckB:[],seed:77,bossId});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=[];side.discard=[];}
 return b;
}
function turn(b,who='A',cards=[],order={},indices=null){
 b.turn=who;b.sides[who].hand=[...cards];
 const first=b.sides[who==='A'?'B':'A'].ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const result=resolveFleetNextTurn(b,who,{cards:indices??cards.map((_,i)=>i),
  pass:true,partId:first?.id,targetKind:'part',targetId:first?.id,...order},1000+b.ply*30000);
 assert.equal(result.ok,true,result.reason);return result;
}

test('Le Trappole di Corvo, Lince e Vespa hanno identità e slot coperti',()=>{
 for(const id of [ECHO,FALSE_TRAIL,FALSE_REFLECTION]){
  assert.equal(isTrapCard(card(id)),true,id);
  assert.equal(cardRole(id),'defense',id);
 }
 assert.equal(isTrapCard(card(CHANNEL)),false);
});
test('Eco di ritorno si posa coperta, senza disturbare subito né generare una carta aggiuntiva',()=>{
 const original=battle();original.sides.A.hand=[ECHO];
 const before=JSON.stringify(original);
 const r=resolveFleetNextTurn(original,'A',{cards:[0],pass:true},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(JSON.stringify(original),before,'La risoluzione non deve mutare la partita originale');
 assert.equal(r.battle.sides.A.defenses.length,1);
 assert.equal(r.battle.sides.A.defenses[0].hidden,true);
 assert.equal(r.battle.sides.A.defenses[0].untilPly,null);
 assert.equal(r.battle.sides.A.buffs.length,0);
 assert.equal(r.events.filter(e=>e.kind==='trap-set').length,1);
 assert.equal(r.battle.sides.A.lastPlayed.includes(ECHO),false);
});
test('Eco resta attivo dopo un normale attacco che non applica un disturbo',()=>{
 let b=battle({shipB:'N00'});
 b=turn(b,'A',[ECHO]).battle;
 const guard=b.sides.A.escorts[0];
 const r=turn(b,'B',[],{pass:false,targetKind:'escort',targetId:guard.id});
 assert.ok(r.battle.sides.A.defenses.some(d=>d.id===ECHO));
 assert.ok(!r.events.some(e=>e.kind==='trap-reveal'));
});
test('Eco annulla il silenzio ma non il danno del Dardo',()=>{
 let b=battle();b=turn(b,'A',[ECHO]).battle;
 const unit=b.sides.A.escorts[0],hp=unit.hp;
 const r=turn(b,'B',[DART],{pass:false,targetKind:'escort',targetId:unit.id});
 assert.equal(r.battle.sides.A.escorts[0].hp,hp-1);
 assert.ok(!r.battle.sides.A.escorts[0].silencedUntilPly);
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id===ECHO));
 assert.equal(r.events.filter(e=>e.kind==='trap-reveal'&&e.cardId===ECHO).length,1);
});
test('Il primo disturbo consuma Eco una volta soltanto',()=>{
 let b=battle();b=turn(b,'A',[ECHO]).battle;
 let r=turn(b,'B',[DART],{pass:false,targetKind:'escort',targetId:b.sides.A.escorts[0].id});
 assert.equal(r.battle.sides.A.discard.filter(id=>id===ECHO).length,1);
 assert.ok(!r.battle.sides.A.defenses.some(d=>d.id===ECHO));
});
test('L’avversario vede solo il dorso; il proprietario può ispezionare la Trappola',()=>{
 const b=battle();const r=turn(b,'A',[ECHO]);
 const mine=projectFleetSlots(r.battle.sides.A,[],'A','A');
 const theirs=projectFleetSlots(r.battle.sides.A,[],'A','B');
 assert.equal(mine[2].id,ECHO);
 assert.deepEqual(theirs[2],{hidden:true,pending:false});
 const notice=r.events.find(e=>e.kind==='trap-set');
 assert.ok(!fleetEventText(notice,'B').includes(ECHO));
 assert.ok(!r.events.some(e=>e.kind==='trap-reveal'));
});
test('Due Trappole nello stesso turno sono respinte prima di consumare la mano',()=>{
 const b=battle();b.sides.A.hand=[ECHO,ECHO];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:true},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/Trappola/);
 assert.equal(JSON.stringify(b),before);
});
test('Lo slot Trappola già occupato non può ricevere un’altra Eco',()=>{
 let b=battle();b=turn(b,'A',[ECHO]).battle;
 b=turn(b,'B',[]).battle;b.sides.A.hand=[ECHO];
 const before=JSON.stringify(b);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply,'trap'),0);
 assert.match(validateFleetTurn(b,'A',{cards:[0],pass:true}),/Trappola/);
 assert.match(effectUnavailableReason(card(ECHO),b.sides.A,b),/Trappola/);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},3000);
 assert.equal(r.ok,false);assert.equal(JSON.stringify(b),before);
});
test('Canale visibile ed Eco coperta occupano posti diversi nel medesimo turno',()=>{
 let b=battle();b=turn(b,'A',[CHANNEL,ECHO]).battle;
 assert.equal(b.sides.A.defenses.length,2);
 assert.equal(b.sides.A.defenses.filter(d=>d.hidden).length,1);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply),0);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply,'defense'),0);
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply,'trap'),0);
});
test('Una terza Difesa non entra quando entrambi gli spazi sono occupati',()=>{
 let b=battle();b=turn(b,'A',[CHANNEL,ECHO]).battle;
 b=turn(b,'B',[]).battle;b.sides.A.hand=[CHANNEL];
 const previous=JSON.stringify(b);
 assert.match(defenseCapacityReason(b.sides.A,1,b.ply,'defense'),/Difesa/);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},3000);
 assert.equal(r.ok,false);assert.equal(JSON.stringify(b),previous);
});
test('La Difesa temporanea scade, la Trappola rimane coperta senza disturbi nemici',()=>{
 let b=battle({shipA:'C03',shipB:'N00'});b=turn(b,'A',[CHANNEL,ECHO]).battle;
 for(let i=0;i<3;i++)b=turn(b,b.turn,[]).battle;
 assert.equal(b.ply,4);
 assert.ok(!b.sides.A.defenses.some(d=>d.id===CHANNEL));
 assert.ok(b.sides.A.defenses.some(d=>d.id===ECHO));
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply,'defense'),1);
});
test('Il Generatore distrutto rende indisponibili entrambi gli slot difensivi',()=>{
 let b=battle();b=turn(b,'A',[ECHO]).battle;
 const generator=b.sides.A.ships[0].parts.find(p=>p.id==='generator');
 generator.hp=0;generator.destroyed=true;
 b=turn(b,'B',[]).battle;
 assert.equal(defenseSlotsAvailable(b.sides.A,b.ply),0);
 assert.ok(!b.sides.A.defenses.some(d=>d.id===ECHO));
});
test('La trappola può essere preparata anche dal giocatore B',()=>{
 let b=battle();b=turn(b,'A',[]).battle;
 b=turn(b,'B',[ECHO]).battle;
 assert.ok(b.sides.B.defenses.find(d=>d.id===ECHO&&d.hidden));
 const unit=b.sides.B.escorts[0];
 const r=turn(b,'A',[DART],{pass:false,targetKind:'escort',targetId:unit.id});
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.who==='B'));
});
test('La trappola Eco non annulla i terreni ambientali dei Boss',()=>{
 const b=battle({bossId:6});
 const terrain=b.terrain?.id;
 assert.equal(terrain,bossTerrain(6).id);
 const r=turn(b,'A',[ECHO]);
 assert.equal(r.battle.terrain?.id,terrain);
 assert.equal(r.battle.sides.A.defenses[0].id,ECHO);
 assert.equal(Object.values(TERRAIN_CATALOG).every(t=>t.cardId===null),true);
});
test('L’IA può preparare Eco e non la duplica in uno slot occupato',()=>{
 let b=battle();b.sides.A.hand=[ECHO];
 const order=autoFleetTurn(b,'A');
 assert.ok(order.cards.includes(0));
 let r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 b=turn(r.battle,'B',[]).battle;b.sides.A.hand=[ECHO];
 const next=autoFleetTurn(b,'A');
 assert.ok(!next.cards.includes(0));
});
test('Falsa scia resta una Trappola distinta dal silenziamento di Corvo',()=>{
 let b=battle({shipA:'C01',shipB:'N00',levelA:1});
 b=turn(b,'A',[FALSE_TRAIL],{ownPartId:'generator'}).battle;
 assert.ok(b.sides.A.defenses.some(d=>d.hidden&&d.trigger==='mother-part-hit'));
 const weapon=b.sides.A.ships[0].parts.find(p=>p.id==='weapons');
 const generator=b.sides.A.ships[0].parts.find(p=>p.id==='generator');
 const hp=weapon.hp,g=generator.hp;
 const r=turn(b,'B',[],{pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'});
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='weapons').hp,hp);
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').hp,g-1);
});
test('La selezione e la scansione del mazzo non possono rivelare identità coperte a terzi',()=>{
 const b=battle(),own=projectFleetSlots(b.sides.A,[ECHO],'A','A'),
  enemy=projectFleetSlots(b.sides.A,[ECHO],'A','B');
 assert.equal(own[2].hidden,true);
 assert.deepEqual(enemy[2],{hidden:true,pending:false});
 const event={kind:'private-scan',who:'A',privateTo:'A',text:'Identità segreta'};
 assert.ok(!fleetEventText(event,'B').includes('Identità segreta'));
});
