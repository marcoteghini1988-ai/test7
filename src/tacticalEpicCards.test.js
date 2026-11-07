import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE16A_RIFTS} from './newCombat/phase16ACatalog.js';
import {PHASE16C_EPICS} from './newCombat/phase16CEpics.js';
import {TACTICAL_EPIC_CARDS,isTacticalEpic,tacticalEpicForgeReady,unlockedTacticalEpics,
 tacticalEpicCritical} from './tacticalEpicCards.js';
import {TACTICAL_STARTER_TYPES,TACTICAL_SPECIALS,validateTacticalLoadout,createTacticalDuel,
 sealTacticalOrder,advanceTacticalDuel,validateTacticalOrder} from './simultaneousDuelEngine.js';

const idle={specialIndices:[],numericIndices:[]};
function custom(id){const types=[...TACTICAL_STARTER_TYPES];types[0]=id;return types;}
function duel(id,opts={}){
 const b=createTacticalDuel({specialDeckA:custom(id),epicEntitlementsA:[id],...opts});
 const p=b.sides.A.special;
 let i=p.hand.findIndex(c=>c.type===id);
 if(i<0){const j=p.deck.findIndex(c=>c.type===id);assert.ok(j>=0);[p.hand[0],p.deck[j]]=[p.deck[j],p.hand[0]];i=0;}
 if(i!==0)[p.hand[0],p.hand[i]]=[p.hand[i],p.hand[0]];
 return b;
}
function play(b,options={},bb=idle,at=101){
 const a=sealTacticalOrder(b,'A',{...idle,...options},at);
 assert.equal(a.ok,true,a.reason);
 const c=sealTacticalOrder(a.battle,'B',bb,at+1);
 assert.equal(c.ok,true,c.reason);
 return advanceTacticalDuel(c.battle,at+1);
}
function criticallyDamaged(side){
 side.defense.parts.engine.hp=0;
 side.defense.parts.weapons.hp=0;
 side.defense.parts.shieldGenerator.hp=0;
}
test('6 oggetti epici e 12 reliquie: ID e abbinamenti originali immutati',()=>{
 assert.equal(PHASE16A_RIFTS.length,6);
 assert.equal(Object.keys(TACTICAL_EPIC_CARDS).length,6);
 const rifts=PHASE16A_RIFTS.map(r=>[r.bossPlanets,r.itemId]);
 assert.deepEqual(rifts,[
  [[1,2],'epic_item_8'],[[3,6],'epic_item_6'],[[7,8],'epic_item_7'],
  [[9,11],'epic_item_9'],[[14,17],'epic_item_1'],[[19,20],'epic_item_3']
 ]);
 const unique=new Set();
 for(const r of PHASE16A_RIFTS){
  unique.add(...r.relicsRequired);
  const epic=TACTICAL_EPIC_CARDS[r.itemId];
  assert.equal(epic.name,PHASE16C_EPICS[r.itemId]);
  assert.deepEqual(epic.relicsRequired,r.relicsRequired);
  assert.equal(TACTICAL_SPECIALS[r.itemId].kind,'epic');
  assert.ok([1,2].includes(epic.cycles));
 }
 assert.equal(PHASE16A_RIFTS.flatMap(r=>r.relicsRequired).length,12);
});
test('Sblocco: due reliquie rendono possibile forgiare, ma non regalano subito la carta',()=>{
 const r=PHASE16A_RIFTS[0];
 const ownedRelics={};
 assert.equal(tacticalEpicForgeReady(ownedRelics,r.itemId),false);
 ownedRelics[r.relicsRequired[0]]=true;
 assert.equal(tacticalEpicForgeReady(ownedRelics,r.itemId),false);
 ownedRelics[r.relicsRequired[1]]=true;
 assert.equal(tacticalEpicForgeReady(ownedRelics,r.itemId),true);
 assert.deepEqual(unlockedTacticalEpics({relics:ownedRelics}),[]);
 assert.deepEqual(unlockedTacticalEpics({relics:ownedRelics,fused:{[r.id]:true}}),[r.itemId]);
 assert.deepEqual(unlockedTacticalEpics({ownedEpics:{epic_item_9:true}}),['epic_item_9']);
});
test('Mazzo 24: massimo un esemplare per Epico, massimo due Epici, no equipaggiamento non sbloccato',()=>{
 assert.equal(validateTacticalLoadout(custom('epic_item_7')),true);
 const duplicate=custom('epic_item_7');duplicate[1]='epic_item_7';
 assert.equal(validateTacticalLoadout(duplicate),false);
 const triple=custom('epic_item_7');triple[1]='epic_item_3';triple[2]='epic_item_8';
 assert.equal(validateTacticalLoadout(triple),false);
 assert.throws(()=>createTacticalDuel({specialDeckA:custom('epic_item_7')}),/non ancora ottenuto/);
 const b=duel('epic_item_7');
 assert.equal(b.sides.A.special.hand.length,5);
 assert.equal(b.sides.A.special.deck.length,19);
 assert.equal(b.sides.A.epic.used.length,0);
});
test('Monolite: attivo 2 cicli blocca calore reale, poi scade; una volta per battaglia',()=>{
 const b=duel('epic_item_7',{shipB:'C04'});
 b.sides.A.heated=true;
 const r=play(b,{specialIndices:[0]},{...idle,weaponFocusId:'W07'});
 assert.equal(r.sides.A.heated,false);
 assert.equal(r.sides.A.epic.active.untilRound,2);
 assert.deepEqual(r.sides.A.epic.used,['epic_item_7']);
 const b2=advanceTacticalDuel(r,8102);
 assert.equal(b2.phase,'planning');
 assert.equal(validateTacticalOrder(b2,'A',{...idle,specialIndices:[0]}).reason=== 'epic_already_active',false);
 const next=play(b2,{}, {...idle,weaponFocusId:'W07'},8200);
 assert.equal(next.sides.A.heated,false);
 const third=advanceTacticalDuel(next,16201);
 const old=third.sides.A.special.hand.findIndex(c=>c.type==='epic_item_7');
 if(old>=0)assert.equal(validateTacticalOrder(third,'A',{...idle,specialIndices:[old]}).reason,'epic_already_used');
});
test('Pendolo: solo se arriva un danno vero, rivela 6 carte e permette ricambio ulteriore',()=>{
 const b=duel('epic_item_6');
 const r=play(b,{specialIndices:[0]});
 assert.equal(r.sides.A.epic.peek.length,6);
 assert.equal(r.sides.A.epic.exchangeUntilRound,2);
 const planning=advanceTacticalDuel(r,8102);
 assert.equal(validateTacticalOrder(planning,'A',{...idle,exchangeIndices:[0,1]}).ok,true);
 const used=play(planning,{exchangeIndices:[0,1]},idle,8200);
 assert.equal(used.sides.A.epic.exchangeCredits,0);
 assert.equal(used.sides.A.numeric.hand.length,7);
 assert.equal(used.sides.A.numeric.hand.length+used.sides.A.numeric.deck.length+used.sides.A.numeric.discard.length,52);
});
test('Calice: il ledger è solo simulato, mai accredito a portafogli o ricompense reali',()=>{
 const b=duel('epic_item_8');
 const r=play(b,{specialIndices:[0]});
 assert.ok(r.sides.A.epic.dustPreview>0);
 assert.ok(r.sides.A.sync>=25);
 assert.equal(Object.hasOwn(r,'wallet'),false);
 assert.ok(r.lastEvents.some(m=>m.includes('NESSUNA ricompensa reale')));
});
test('Astrolabio: scegli tra due pescate già presenti nel mazzo di 52 carte',()=>{
 const b=duel('epic_item_3');
 const first=play(b,{specialIndices:[0]});
 assert.equal(first.sides.A.epic.peek.length,2);
 assert.equal(validateTacticalOrder(b,'A',{...idle,specialIndices:[0],epicChoice:1}).reason,'epic_choice_not_ready');
 const next=advanceTacticalDuel(first,8102);
 const before=next.sides.A.numeric.deck.slice(0,2).map(c=>c.id);
 const r=play(next,{exchangeIndices:[0],epicChoice:1},idle,8200);
 assert.equal(r.sides.A.numeric.hand.some(c=>c.id===before[1]),true);
 assert.equal(r.sides.A.numeric.deck.some(c=>c.id===before[0]),true);
 assert.equal(r.sides.A.numeric.hand.length+r.sides.A.numeric.deck.length+r.sides.A.numeric.discard.length,52);
});
test('Möbius: soltanto sotto il 30% dei vitali; anticipa una carta reale tra le prossime dieci',()=>{
 const b=duel('epic_item_1');
 assert.equal(tacticalEpicCritical(b.sides.A),false);
 assert.equal(validateTacticalOrder(b,'A',{...idle,specialIndices:[0]}).reason,'epic_not_critical');
 criticallyDamaged(b.sides.A);
 assert.equal(tacticalEpicCritical(b.sides.A),true);
 const r=play(b,{specialIndices:[0]});
 assert.equal(r.sides.A.epic.peek.length,10);
 assert.equal(r.sides.A.epic.active.untilRound,2);
 const next=advanceTacticalDuel(r,8102);
 const selected=next.sides.A.numeric.deck[5].id;
 const chosen=play(next,{epicChoice:5},idle,8200);
 assert.equal(chosen.sides.A.numeric.deck[0].id,selected);
});
test('Matrice: soltanto al 30% dei vitali e con vera arma pesante; non elude firma',()=>{
 const b=duel('epic_item_9',{shipA:'R04'});
 assert.equal(validateTacticalOrder(b,'A',{...idle,specialIndices:[0]}).reason,'epic_not_critical');
 criticallyDamaged(b.sides.A);
 assert.equal(validateTacticalOrder(b,'A',{...idle,specialIndices:[0]}).ok,true);
 const result=play(b,{specialIndices:[0],numericIndices:[0,1],vitalId:'engine',op:'pair'});
 assert.equal(result.sides.B.defense.parts.engine.hp,10);
 assert.ok(result.lastEvents.some(e=>e.includes('combinazione non valida')));
});
