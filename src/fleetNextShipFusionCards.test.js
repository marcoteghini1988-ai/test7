import test from 'node:test';
import assert from 'node:assert/strict';
import {FUSION_SHIP_CARDS,FUSION_SHIP_CARD_BY_ID,card,cardCopyLimit} from './fleetNext/rules.js';
import {canSelectNewGeneric} from './fleetNext/nextDeckLoadout.js';
import {SUPPORT_CATALOG,supportModelIdFor} from './fleetNext/supportCatalog.js';
import {SUPPORT_SKILL_LABELS,skillCount} from './fleetNext/supportAbilities.js';
import {createFleetNextBattle,resolveFleetNextTurn,
 fuseIndependentSupportWithShip,fusionShipUnavailableReason} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

const roster=()=>[
 {id:supportModelIdFor('N00'),instanceId:'official:n00',slot:0,level:1},
 {id:supportModelIdFor('L02'),instanceId:'official:l02',slot:1,level:1}
];
function fresh(){
 return createFleetNextBattle({
  shipA:'N00',levelA:1,shipB:'C01',levelB:1,
  deckA:[],deckB:[],supportRosterA:roster(),supportRosterB:[],
  ruleset:HP_SYNC_RULESET,mode:'pvp',seed:2026,nowMs:0
 });
}

test('Carta Navicella Fusione per ogni modello storico con dati e limite mazzo',()=>{
 assert.equal(FUSION_SHIP_CARDS.length,SUPPORT_CATALOG.length);
 assert.equal(new Set(FUSION_SHIP_CARDS.map(c=>c.fusionShipId)).size,SUPPORT_CATALOG.length);
 assert.equal(Object.keys(SUPPORT_SKILL_LABELS).length,15);
 for(const c of FUSION_SHIP_CARDS){
  assert.equal(FUSION_SHIP_CARD_BY_ID[c.id],c);
  assert.equal(card(c.id),c);
  assert.equal(c.effectSpec.type,'shipFusion');
  assert.ok(c.fusionElementId&&c.fusionSkillId);
  assert.equal(cardCopyLimit(c.id),2);
  assert.equal(canSelectNewGeneric(c.id),true);
  assert.equal(c.nativeFace,true);
  assert.equal(c.acquisitionPending,true);
 }
});

test('Due carte fonde due supporti di madre qualsiasi, stessi HP e due abilità',()=>{
 const b=fresh(),side=b.sides.A;
 assert.equal(side.fusionLimit,2);
 assert.equal(side.escorts.length,2);
 const a=side.escorts[0],c=side.escorts[1];
 a.hp=Math.max(1,a.maxHp-2);
 c.hp=Math.max(1,c.maxHp-2);
 const firstStats=[a.hp,a.maxHp],secondStats=[c.hp,c.maxHp];
 const first=fuseIndependentSupportWithShip(side,'R01',0);
 assert.equal(first.ok,true,first.reason);
 assert.equal(first.fused.hp,firstStats[0]);
 assert.equal(first.fused.maxHp,firstStats[1]);
 assert.ok(first.fused.supportSkillIds.includes('regeneration'));
 assert.ok(first.fused.supportSkillIds.includes('normal-boost'));
 assert.deepEqual(first.fused.elements,['ionic','metallic']);
 const second=fuseIndependentSupportWithShip(side,'E02',1);
 assert.equal(second.ok,true,second.reason);
 assert.equal(second.fused.hp,secondStats[0]);
 assert.equal(second.fused.maxHp,secondStats[1]);
 assert.ok(second.fused.supportSkillIds.includes('reactive-poison'));
 assert.ok(second.fused.supportSkillIds.includes('capacitor'));
 assert.deepEqual(second.fused.elements,['gravity','aerial']);
 assert.equal(side.escorts.length,2);
 assert.equal(side.fusionsUsed,2);
 assert.ok(fusionShipUnavailableReason(side,'C02',null));
 assert.equal(skillCount(side,'reactive-poison'),1);
 assert.equal(skillCount(side,'capacitor'),1);
});

test('La carta Fusione funziona davvero nella mano senza Centralina materna',()=>{
 const b=fresh();
 const a=b.sides.A;
 assert.equal(a.ships[0].parts.some(p=>p.id==='command'),false);
 a.hand=['fusion-ship-r01'];
 a.deck=[];
 const initial=a.escorts[0];
 const hp=initial.hp,maxHp=initial.maxHp;
 const result=resolveFleetNextTurn(b,'A',{cards:[0],fusionSlot:0,pass:true},100);
 assert.equal(result.ok,true,result.reason);
 const after=result.battle.sides.A;
 assert.equal(after.fusionsUsed,1);
 assert.equal(after.escorts.length,2);
 assert.equal(after.escorts[0].hp,hp);
 assert.equal(after.escorts[0].maxHp,maxHp);
 assert.ok(after.escorts[0].supportSkillIds.includes('normal-boost'));
 assert.ok(result.events.some(e=>e.kind==='fusion'&&e.cardId==='fusion-ship-r01'));
 const bpass=resolveFleetNextTurn(result.battle,'B',{cards:[],pass:true},200);
 assert.equal(bpass.ok,true,bpass.reason);
 bpass.battle.sides.A.hand=['fusion-ship-e02'];
 bpass.battle.sides.A.deck=[];
 const second=resolveFleetNextTurn(bpass.battle,'A',{cards:[0],fusionSlot:1,pass:true},300);
 assert.equal(second.ok,true,second.reason);
 assert.equal(second.battle.sides.A.escorts.length,2);
 assert.equal(second.battle.sides.A.fusionsUsed,2);
});
