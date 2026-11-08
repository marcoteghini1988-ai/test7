import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMANDER_ABILITY_IDS} from './commanderAbilities.js';
import {TACTICAL_BOSS_COMMANDERS,TACTICAL_NEW_COMMANDERS,TACTICAL_ADVANCED_COMMANDERS,
 tacticalBossCommanderAttackBonus,tacticalBossCommanderDefenseBonus,
 rememberTacticalCommanderEscortHit} from './tacticalBossCommanderBridge.js';
import {TACTICAL_READY_COMMANDERS,tacticalCommanderReady} from './tacticalCommanders.js';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {createTacticalDuel,nativeBarrierPacket} from './simultaneousDuelEngine.js';
const ORDER={numericIndices:[1,2],specialIndices:[],op:'plus',vitalId:'shieldGenerator'};
function create(id,side='A'){
 return createTacticalDuel({shipA:'R04',shipB:'R04',levelA:5,levelB:5,
  ['commander'+side]:{id,level:5}});
}
const attack=(b,types=[],options={})=>tacticalBossCommanderAttackBonus(
 b.sides.A,b.sides.B,ORDER,types,nativeBarrierPacket(b.sides.A),1,options);
const defense=b=>tacticalBossCommanderDefenseBonus(b.sides.B,b.sides.A,1);

test('17 nuovi piloti, 12 gia migrati, 4 comuni: il catalogo ufficiale e completo',()=>{
 assert.equal(TACTICAL_BOSS_COMMANDERS.length,12);
 assert.equal(TACTICAL_NEW_COMMANDERS.length,17);
 assert.equal(TACTICAL_ADVANCED_COMMANDERS.length,29);
 assert.equal(TACTICAL_READY_COMMANDERS.length,33);
 assert.deepEqual(new Set(TACTICAL_READY_COMMANDERS),new Set(COMMANDER_ABILITY_IDS));
 for(const id of TACTICAL_NEW_COMMANDERS){
  assert.equal(tacticalCommanderReady(id),true,id);
  assert.equal(officialSimultaneousEligibility({gameMode:'classic',selectedPilot:id}).enabled,true,id);
  assert.equal(create(id).sides.A.commander.id,id);
 }
 assert.equal(tacticalCommanderReady('pilot_inventato'),false);
 assert.equal(officialSimultaneousEligibility({gameMode:'classic',selectedPilot:'pilot_inventato'}).enabled,false);
});
test('attacco condizionato: avaria, Perforante, Ionico e formule vere',()=>{
 let b=create('pilot_rare_1');
 assert.equal(attack(b).active,false);
 b.sides.A.defense.parts.weapons.hp=5;
 assert.equal(attack(b).percentage,7);
 assert.equal(tacticalBossCommanderAttackBonus(b.sides.A,b.sides.B,
  {...ORDER,op:'times'},[],nativeBarrierPacket(b.sides.A),1).active,false);
 b=create('pilot_epic_1');
 assert.equal(attack(b).active,false);
 assert.equal(attack(b,['shot-piercing']).percentage,8);
 b=create('pilot_boss_5');
 assert.equal(attack(b).active,false);
 assert.equal(attack(b,['shot-ion']).percentage,7);
});
test('difese condizionate senza HP fittizi: scudo, scudiera e vitali',()=>{
 let b=create('pilot_rare_4','B');
 assert.equal(defense(b).active,false);
 b.sides.B.defense.parts.weapons.hp=5;
 b.sides.B.defense.parts.engine.hp=5;
 assert.equal(defense(b).percentage,7);
 b=create('pilot_epic_4','B');
 assert.equal(defense(b).active,false);
 b.sides.B.defense.shield.hp=0;
 assert.equal(defense(b).percentage,8);
 b=create('pilot_boss_10','B');
 assert.equal(defense(b).active,false);
 b.sides.B.escorts[0].hp=0;
 assert.equal(defense(b).percentage,7);
 b=create('pilot_boss_12','B');
 for(const id of ['weapons','engine','command'])b.sides.B.defense.parts[id].hp=0;
 assert.equal(defense(b).percentage,7);
});
test('Veggente Supremo: memorizza scudiera soltanto dopo intercettazione reale',()=>{
 const b=create('pilot_leg_2'),a=b.sides.A,enemy=b.sides.B;
 assert.equal(attack(b).active,false);
 rememberTacticalCommanderEscortHit(a,0,0);
 assert.equal(a.commander.lastEscortIndex,undefined);
 rememberTacticalCommanderEscortHit(a,0,3);
 assert.equal(attack(b).active,false);
 enemy.escorts[0].hp=0;
 assert.equal(attack(b).percentage,8);
 assert.equal(attack(b,[],{suppressFirstEscort:true}).active,false);
 rememberTacticalCommanderEscortHit(a,1,2);
 assert.equal(attack(b).active,false);
 enemy.defense.parts.command.hp=0;
 assert.equal(attack(b).active,false);
});
test('Discordia: niente bonus per stati non simultanei o scaduti',()=>{
 const b=create('pilot_boss_18');
 assert.equal(attack(b).active,false);
 b.sides.B.statusUntil={ionized:16000,corroded:16000};
 assert.equal(attack(b).percentage,12);
 b.sides.B.statusUntil.corroded=0;
 assert.equal(attack(b).active,false);
});
