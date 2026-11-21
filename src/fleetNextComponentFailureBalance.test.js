// Verifica reale delle tre penalita' gia' decise per gli slot con timer a zero.
// I valori in secondi dei timer non sono ancora scelti: non simuliamo qui
// una perdita di HP per quattro componenti che non puo' scattare con Generatore caldo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn}
 from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {arsenalBonus,commandPenalty} from './fleetNext/newCardEffects.js';
import {componentTimerExpired,attackCardCapacity,arsenalEffectiveDamage,
 centralinaMinimumLeak,characterSlotEnabled,planciaRestrictedTargetOrder}
 from './fleetNext/componentFailureBalance.js';
const make=()=>createFleetNextBattle({shipA:'C03',shipB:'C03',
 raritaA:'Comune',raritaB:'Comune',ruleset:HP_SYNC_RULESET,mode:'pvp',
 supportRosterA:[],supportRosterB:[{id:SUPPORT_CATALOG[0].id,
  instanceId:'component-test-escort',slot:0,rarita:'Comune'}],
 deckA:[],deckB:[],nowMs:0,seed:4321});
test('Centralina: a timer scaduto il 25% del colpo a un supporto filtra alla madre',()=>{
 const healthy=make(),broken=make();
 const escort=healthy.sides.B.escorts[0];
 broken.sides.B.componentTimers={command:{expired:true}};
 assert.equal(commandPenalty(healthy.sides.B),0);
 assert.equal(commandPenalty(broken.sides.B),25);
 const order={cards:[],pass:false,targetKind:'escort',
  targetId:escort.id,escortSlot:escort.slot,partId:'weapons'};
 const a=resolveFleetNextTurn(healthy,'A',order,1000);
 const b=resolveFleetNextTurn(broken,'A',order,1000);
 assert.equal(a.ok,true,a.reason);
 assert.equal(b.ok,true,b.reason);
 assert.equal(a.battle.sides.B.ships[0].hp,healthy.sides.B.ships[0].hp);
 assert.ok(b.battle.sides.B.ships[0].hp<broken.sides.B.ships[0].hp);
 assert.ok(b.battle.sides.B.escorts[0].hp>a.battle.sides.B.escorts[0].hp);
});
test('Arsenale: -30% a tutte le Armi, ma NON chiude i due slot Arma',()=>{
 const s=make().sides.A;
 const machine={power:0,damageMode:'base-shot',untilPly:10};
 assert.equal(arsenalBonus(s,machine,0,100),100);
 s.componentTimers={weapons:{expired:true}};
 assert.equal(arsenalBonus(s,machine,0,100),70);
 assert.equal(arsenalEffectiveDamage(s,30),21);
 assert.equal(attackCardCapacity(s),2);
 assert.equal((s.machines||[]).length,0);
 assert.equal(componentTimerExpired(s,'weapons'),true);
});
test('Arsenale: -1 slot Attacco ma sempre massimo tre carte complessive',()=>{
 const b=make();
 b.sides.A.hand=['sys-weapons-plus-c','sys-generator-plus-c','sys-command-plus-c'];
 const order={cards:[0,1,2],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
 assert.equal(validateFleetTurn(b,'A',order),null);
 b.sides.A.componentTimers={weapons:{expired:true}};
 assert.match(validateFleetTurn(b,'A',order),/Arsenale esaurito/);
 const two={...order,cards:[0,1]};
 assert.equal(validateFleetTurn(b,'A',two),null);
});
test('Plancia: primo supporto automatico e slot Personaggio disattivato',()=>{
 const side={componentTimers:{bridge:{expired:true}}};
 const enemy={escorts:[{id:'escort-2',slot:1,hp:40},
  {id:'escort-1',slot:0,hp:90}]};
 const chosen={targetKind:'escort',targetId:'escort-2',escortSlot:1};
 const limited=planciaRestrictedTargetOrder(side,enemy,chosen);
 assert.equal(limited.targetId,'escort-1');
 assert.equal(limited.escortSlot,0);
 assert.equal(characterSlotEnabled(side),false);
 assert.equal(centralinaMinimumLeak(side),0);
 assert.equal(characterSlotEnabled({}),true);
 assert.equal(planciaRestrictedTargetOrder({},enemy,chosen),chosen);
});
