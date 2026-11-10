import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {COMMANDER_ABILITIES} from './commanderAbilities.js';
import {liveCommanderDefensePacket,liveCommanderRememberShot,
 LIVE_DEFENSIVE_PILOT_TRIGGERS} from './officialLiveCommanderDefense.js';
const game=id=>createTacticalDuel({shipA:'N00',shipB:'N00',levelA:1,levelB:1,
 commanderB:{id,level:5}});
test('33 piloti nel catalogo, sette con mitigazioni difensive LIVE verificabili',()=>{
 assert.equal(Object.keys(COMMANDER_ABILITIES).length,33);
 const defensive=Object.values(COMMANDER_ABILITIES).filter(p=>p.role==='Difesa');
 assert.equal(defensive.length,7);
 assert.ok(defensive.every(p=>LIVE_DEFENSIVE_PILOT_TRIGGERS.includes(p.trigger)));
});
test('Guardiano di Gaia pilota: riduce solo primo colpo vero alla barriera madre',()=>{
 const b=game('pilot_boss_1'),a=b.sides.A,z=b.sides.B;
 let result=liveCommanderDefensePacket(a,z,30);
 assert.equal(result.active,true);
 assert.equal(result.prevented,2);
 liveCommanderRememberShot(a,z,0);
 assert.equal(z.commander.receivedMotherHits,undefined);
 liveCommanderRememberShot(a,z,28);
 assert.equal(z.commander.receivedMotherHits,1);
 result=liveCommanderDefensePacket(a,z,30);
 assert.equal(result.prevented,0);
 assert.equal(result.active,false);
});
test('Leviatano pilota: difende madre sopra metà scudo con resto frazionato',()=>{
 const b=game('pilot_boss_8'),a=b.sides.A,z=b.sides.B;
 let first=liveCommanderDefensePacket(a,z,8);
 assert.equal(first.damage,8);
 assert.equal(z.commander.defenseRemainder,56);
 let second=liveCommanderDefensePacket(a,z,8);
 assert.equal(second.damage,7);
 assert.equal(z.commander.defenseRemainder,12);
 z.defense.shield.hp=30;
 const third=liveCommanderDefensePacket(a,z,8);
 assert.equal(third.active,false);
 assert.equal(z.commander.defenseRemainder,0);
});
test('Sentinella Ionica pilota mitiga soltanto mentre il proprio scudo è ionizzato',()=>{
 const b=game('pilot_boss_7'),a=b.sides.A,z=b.sides.B;
 assert.equal(liveCommanderDefensePacket(a,z,40).active,false);
 z.ionized=true;
 const res=liveCommanderDefensePacket(a,z,40);
 assert.equal(res.active,true);
 assert.equal(res.damage,38);
 z.ionized=false;
 assert.equal(liveCommanderDefensePacket(a,z,40).damage,40);
});
test('Il Collezionista di Specchi si attiva su due vitali davvero in avaria',()=>{
 const b=game('pilot_rare_4'),a=b.sides.A,z=b.sides.B;
 assert.equal(liveCommanderDefensePacket(a,z,40).active,false);
 z.defense.parts.engine.hp=0;z.defense.parts.weapons.hp=5;
 assert.equal(liveCommanderDefensePacket(a,z,40).active,true);
});
