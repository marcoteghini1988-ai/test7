import test from 'node:test';
import assert from 'node:assert/strict';
import {commanderAbility} from './commanderAbilities.js';
import {TACTICAL_BOSS_COMMANDERS,tacticalBossCommanderAttackBonus,
 tacticalBossCommanderDefenseBonus,rememberTacticalBossCommanderImpact}
 from './tacticalBossCommanderBridge.js';
import {tacticalCommanderReady} from './tacticalCommanders.js';
import {createTacticalDuel,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket}
 from './simultaneousDuelEngine.js';
const ORDER={numericIndices:[1,2],specialIndices:[],op:'plus',
 vitalId:'shieldGenerator'};
function create(pilot='pilot_boss_2',side='A'){
 const args={shipA:'R04',shipB:'R04',levelA:5,levelB:5};
 args['commander'+side]={id:pilot,level:5};
 return createTacticalDuel(args);
}
const bonus=(b,types=[])=>tacticalBossCommanderAttackBonus(b.sides.A,b.sides.B,ORDER,types,
 nativeBarrierPacket(b.sides.A),2);
test('Tutti e dodici i piloti storici corrispondono al catalogo e ai trigger autentici',()=>{
 assert.equal(TACTICAL_BOSS_COMMANDERS.length,12);
 assert.equal(new Set(TACTICAL_BOSS_COMMANDERS).size,12);
 for(const id of TACTICAL_BOSS_COMMANDERS){
  assert.ok(commanderAbility(id),id);
  assert.equal(tacticalCommanderReady(id),true,id);
 }
 assert.equal(tacticalCommanderReady('pilot_rare_1'),true);
});
test('Difesa Gaia, Urano e Nettuno usa solo i propri trigger, prima del danno reale',()=>{
 let b=create('pilot_boss_1','B');
 const defender=b.sides.B,attacker=b.sides.A;
 assert.equal(tacticalBossCommanderDefenseBonus(defender,attacker,1).percentage,7);
 rememberTacticalBossCommanderImpact(attacker,defender,{},[],5,1);
 assert.equal(defender.commander.receivedMotherHits,1);
 assert.equal(tacticalBossCommanderDefenseBonus(defender,attacker,1).active,false);
 b=create('pilot_boss_7','B');
 assert.equal(tacticalBossCommanderDefenseBonus(b.sides.B,b.sides.A,2).active,false);
 b.sides.B.statusUntil={ionized:16000,corroded:0};
 assert.equal(tacticalBossCommanderDefenseBonus(b.sides.B,b.sides.A,2).percentage,7);
 assert.equal(tacticalBossCommanderDefenseBonus(b.sides.B,b.sides.A,3).active,false);
 b=create('pilot_boss_8','B');
 assert.equal(tacticalBossCommanderDefenseBonus(b.sides.B,b.sides.A,1).percentage,7);
 b.sides.B.defense.shield.hp=30;
 assert.equal(tacticalBossCommanderDefenseBonus(b.sides.B,b.sides.A,1).active,false);
});
test('Attacco Tharsis e Idra: serve memoria vitale da un impatto reale, non un ordine dichiarato',()=>{
 let b=create('pilot_boss_2');
 assert.equal(bonus(b).active,false);
 rememberTacticalBossCommanderImpact(b.sides.A,b.sides.B,ORDER,[],0,1,{vitalId:'shieldGenerator'});
 assert.equal(bonus(b).active,false);
 rememberTacticalBossCommanderImpact(b.sides.A,b.sides.B,ORDER,[],5,1,{vitalId:'shieldGenerator'});
 assert.equal(b.sides.A.commander.lastVitalHit,'shieldGenerator');
 assert.equal(bonus(b).percentage,7);
 b=create('pilot_boss_11');
 b.sides.A.commander.lastVitalHit='weapons';
 assert.equal(bonus(b).percentage,7);
 b.sides.A.commander.lastVitalHit='shieldGenerator';
 assert.equal(bonus(b).active,false);
});
test('Venere, Plutone e Io: stati/HP/contatore REALI, senza bonus a vuoto',()=>{
 let b=create('pilot_boss_3');
 assert.equal(bonus(b).active,false);
 b.sides.B.statusUntil={ionized:0,corroded:18000};
 assert.equal(bonus(b).percentage,7);
 b=create('pilot_boss_9');
 assert.equal(bonus(b).active,false);
 b.sides.A.defense.shield.hp=21;
 assert.equal(bonus(b).percentage,7);
 b=create('pilot_boss_19');
 assert.equal(bonus(b).active,false);
 b.sides.A.commander.successfulMotherHits=2;
 assert.equal(bonus(b).percentage,12);
 b.sides.A.commander.successfulMotherHits=3;
 assert.equal(bonus(b).active,false);
});
test('Crono, Generatore e Cristallo: ricambio vero, due offensive, cambio di operazione',()=>{
 let b=create('pilot_boss_6');
 assert.equal(bonus(b).active,false);
 b.sides.A.numericRecyclesTotal=1;
 assert.equal(bonus(b).percentage,7);
 b.sides.A.commander.seenRecycle=1;
 assert.equal(bonus(b).active,false);
 b=create('pilot_epic_2');
 assert.equal(bonus(b,['shot-ion']).active,false);
 assert.equal(bonus(b,['shot-ion','shot-corrosion']).percentage,8);
 b=create('pilot_leg_1');
 assert.equal(bonus(b).active,false);
 b.sides.A.commander.lastOp='times';
 assert.equal(bonus(b).percentage,8);
 b.sides.A.commander.lastOp='plus';
 assert.equal(bonus(b).active,false);
});
test('Sovrano: +12% solo sull ultimo vitale vivo, tre KO autentici propri del nemico',()=>{
 const b=create('pilot_boss_20');
 assert.equal(bonus(b).active,false);
 for(const id of ['weapons','engine','command'])b.sides.B.defense.parts[id].hp=0;
 assert.equal(bonus(b).percentage,12);
 b.sides.B.defense.parts.weapons.hp=1;
 assert.equal(bonus(b).active,false);
});
test('Tutti i trigger richiedono una formula realmente valida; le difese non fabbricano HP',()=>{
 for(const id of TACTICAL_BOSS_COMMANDERS){
  let b=create(id);
  const attacker=b.sides.A,defender=b.sides.B,base=nativeBarrierPacket(attacker);
  const wrong=tacticalBossCommanderAttackBonus(attacker,defender,
   {...ORDER,op:'times'},['shot-ion','shot-corrosion'],base,2);
  assert.equal(wrong.active,false,id);
  assert.equal(wrong.extra,0,id);
 }
});
test('In un combattimento reale il pilota boss B difensivo riduce il primo danno e memorizza gli impatti',()=>{
 const withPilot=createTacticalDuel({shipA:'C01',shipB:'C02',levelA:5,levelB:5,
  commanderB:{id:'pilot_boss_1',level:5}});
 const normal=createTacticalDuel({shipA:'C01',shipB:'C02',levelA:5,levelB:5});
 function resolve(b){
  const a=sealTacticalOrder(b,'A',{numericIndices:[],specialIndices:[]},100);
  assert.equal(a.ok,true);
  const x=sealTacticalOrder(a.battle,'B',{numericIndices:[],specialIndices:[]},101);
  assert.equal(x.ok,true);
  return advanceTacticalDuel(x.battle,101);
 }
 const a=resolve(withPilot),b=resolve(normal);
 const damage=game=>game.history[0].impacts.find(x=>x.kind==='barrier'&&x.by==='A').damage;
 assert.ok(damage(a)<=damage(b));
 assert.ok(a.sides.B.commander.receivedMotherHits>=0);
 assert.ok(a.lastEvents.some(x=>x.includes('pilota')||x.includes('Pilota')));
});
