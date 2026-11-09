import test from 'node:test';
import assert from 'node:assert/strict';
import {officialBattleSetup} from './officialBattleSetup.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {officialBossThreatReadout,officialIoAvailableDefenses}
 from './officialBossThreatReadout.js';

function caseForBoss(index){
 const planet=PHASE16A_CAMPAIGN_PLANETS[index];
 return officialBattleSetup({mode:'adventure',sectorNumber:(index+1)*10,
  bossPlanetId:planet.id,bossSectorLevel:10,
  shipCollection:{cards:[{instanceId:'owned',shipId:'L03',level:5}],
   loadout:['owned']},
  specialCollection:createSpecialCollection(),selectedPilot:'pilot_com_1',
  pilotInventory:{pilot_com_1:{unlocked:true,level:1}},
  seed:171,nowMs:100}).battle;
}
function ownCards(battle,types){
 const hand=battle.sides.A.special.hand;
 hand.splice(0,hand.length,...types.map((type,i)=>({id:'real:'+i,type})));
}
test('Lettura pubblica disponibile sui 12 boss canonici, nessuno sulla partita senza boss',()=>{
 assert.equal(officialBossThreatReadout({round:1,sides:{B:{bossExclusive:null}}}),null);
 for(let i=0;i<12;i++){
  const b=caseForBoss(i);
  const read=officialBossThreatReadout(b);
  assert.ok(read?.label&&read.detail,b.sides.B.bossPlanetId);
  assert.equal(read.urgent,b.sides.B.bossPlanetId===19?false:false);
  assert.ok(!read.detail.includes('undefined'));
 }
});
test('Io: la fase visibile precede il turno e ruota Carica Eruzione Raffreddamento',()=>{
 const b=caseForBoss(10);
 const expected=['carica','eruzione','raffreddamento','carica','eruzione','raffreddamento'];
 for(let i=0;i<expected.length;i++){
  b.round=i+1;
  const threat=officialBossThreatReadout(b);
  assert.equal(threat.phase,expected[i]);
  assert.equal(threat.urgent,expected[i]==='eruzione');
  assert.ok(threat.label.includes(expected[i].toUpperCase()));
 }
});
test('Difese suggerite solo da carte realmente in mano e sistemi funzionanti',()=>{
 const b=caseForBoss(10),own=b.sides.A;
 ownCards(b,['support-shield-repair','tactic-reactive','tactic-impact','tactical-cover','tactic-counter']);
 own.defense.shield.hp=30;
 assert.deepEqual(officialIoAvailableDefenses(own),[
  'Riparazione','Paratia','Schermo','Copertura']);
 b.round=2;
 const info=officialBossThreatReadout(b);
 assert.ok(info.detail.includes('Riparazione'));
 assert.ok(info.detail.includes('Paratia'));
 assert.ok(!info.detail.includes('Contromisura'),'Una Contromisura non para la raffica nativa');
 own.defense.parts.shieldGenerator.hp=0;
 assert.deepEqual(officialIoAvailableDefenses(own),['Paratia','Schermo','Copertura']);
 own.defense.parts.command.hp=0;
 own.escorts.forEach(e=>{e.hp=0;});
 assert.deepEqual(officialIoAvailableDefenses(own),['Paratia','Schermo']);
 own.defense.shield.hp=0;
 assert.deepEqual(officialIoAvailableDefenses(own),[]);
 assert.ok(officialBossThreatReadout(b).detail.includes('nessuna difesa'));
});
test('Lettura boss non cambia carte, segreti, ordini, inventari o valori di battaglia',()=>{
 const b=caseForBoss(10);
 b.round=2;
 const before=structuredClone(b);
 const info=officialBossThreatReadout(b);
 assert.equal(info.urgent,true);
 assert.deepEqual(b,before);
 const reversed=structuredClone(b);
 reversed.sides.B.numeric.hand.reverse();
 reversed.sides.B.special.hand.reverse();
 reversed.orders.A={secret:'qualunque'};
 reversed.orders.B={secret:'altro'};
 assert.deepEqual(officialBossThreatReadout(reversed),info,
  'Nessun accesso a carte od ordini nascosti del boss');
});
test('Gaia e Encelado: condizione iniziale e seme dominante derivati da stato pubblico',()=>{
 const gaia=caseForBoss(0),voidBoss=caseForBoss(11);
 assert.ok(officialBossThreatReadout(gaia).detail.includes('primo danno'));
 gaia.sides.B.bossExclusive.armorUsed=true;
 assert.ok(officialBossThreatReadout(gaia).detail.includes('consumata'));
 voidBoss.round=1;
 const first=officialBossThreatReadout(voidBoss);
 voidBoss.round=4;
 const second=officialBossThreatReadout(voidBoss);
 assert.ok(first.label.includes('♠'));
 assert.ok(second.label.includes('♥'));
});
