import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORT_MAX_LEVEL} from './fleetNext/supportProgression.js';
import {supportModelIdFor} from './fleetNext/supportCatalog.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {card} from './fleetNext/rules.js';
import {arkPrecondition} from './fleetNext/arkEngine.js';
import {obsidianFusedEscort,obsidianPrecondition} from './fleetNext/obsidianEngine.js';
import {createFleetNextBattle,resolveFleetNextTurn,
 fuseIndependentSupportWithShip} from './fleetNext/combat.js';

const roster=()=>[
 {id:supportModelIdFor('N00'),instanceId:'guard:one',slot:0,level:SUPPORT_MAX_LEVEL},
 {id:supportModelIdFor('C03'),instanceId:'guard:two',slot:1,level:SUPPORT_MAX_LEVEL}
];
const game=(mother='L04')=>createFleetNextBattle({
 shipA:mother,levelA:5,shipB:'C03',levelB:5,deckA:[],deckB:[],
 ruleset:HP_SYNC_RULESET,mode:'pvp',supportRosterA:roster(),
 supportRosterB:roster(),seed:442,nowMs:0
});
const take=(b,side,hand,order,ms)=>{
 b.sides[side].hand=hand;
 const result=resolveFleetNextTurn(b,side,{cards:hand.map((_,i)=>i),pass:true,...order},ms);
 assert.equal(result.ok,true,result.reason);
 return result.battle;
};

test('La Custodia Arca non si trasferisce al supporto fuso tramite il nuovo ID',()=>{
 const b=game(),s=b.sides.A,initial=s.escorts[0];
 s.defenses.push({id:'nx-l04-03',source:'custody-test',hidden:false,
  arkCustodyEscortId:initial.id,untilPly:10});
 s.protections.push({id:'nx-l04-03',source:'custody-test',target:'escort',
  escortSlot:0,remaining:1,untilPly:10});
 const result=fuseIndependentSupportWithShip(s,'R01',0,b.ply);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.fused.fused,true);
 assert.equal(s.escorts.length,2);
 assert.equal(s.defenses.some(x=>x.id==='nx-l04-03'),false);
 assert.equal(s.protections.some(x=>x.id==='nx-l04-03'),false);
 assert.equal(s.discard.includes('nx-l04-03'),true);
});

test('Ingresso protetto Arca si arma per la fusione reale e blocca un solo colpo',()=>{
 let b=game();
 assert.equal(arkPrecondition(card('nx-l04-08'),b.sides.A,b),'');
 b=take(b,'A',['nx-l04-08'],{},1000);
 assert.equal(b.sides.A.defenses.some(d=>d.id==='nx-l04-08'&&d.hidden),true);
 b=take(b,'B',[],{},2000);
 b=take(b,'A',['fusion-ship-r01'],{fusionSlot:0},3000);
 const fused=b.sides.A.escorts[0];
 assert.equal(fused.fused,true);
 assert.equal(b.sides.A.escorts.length,2);
 const hp=fused.hp;
 assert.equal(b.sides.A.defenses.find(d=>d.id==='nx-l04-08').arkReserveId,fused.id);
 b=take(b,'B',[],{pass:false,targetKind:'escort',
  targetId:fused.id,escortSlot:0,partId:'weapons'},4000);
 assert.equal(b.sides.A.escorts[0].hp,hp);
 assert.equal(b.sides.A.defenses.some(d=>d.id==='nx-l04-08'),false);
 assert.equal(b.sides.A.discard.includes('nx-l04-08'),true);
});

test('Titano Ossidiana usa la Sentenza con qualsiasi supporto fuso L5',()=>{
 const b=game('L03'),side=b.sides.A;
 assert.equal(obsidianFusedEscort(side,b.ply),null);
 const result=fuseIndependentSupportWithShip(side,'R01',0,b.ply);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.fused.obsidianBastion,true);
 assert.equal(obsidianFusedEscort(side,b.ply)?.id,result.fused.id);
 assert.equal(obsidianPrecondition(card('nx-l03-10'),side,b),'');
 assert.equal(side.escorts.length,2);
 assert.equal(side.fusionsUsed,1);
});
