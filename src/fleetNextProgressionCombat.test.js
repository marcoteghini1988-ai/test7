import test from 'node:test';
import assert from 'node:assert/strict';
import {card,GENERAL_CARDS,eligibleExclusives} from './fleetNext/rules.js';
import {getShipProgression,CAMPAIGN_SHIP_ORDER} from './fleetNext/progression.js';
import {
 createFleetNextBattle,createFleetSide,resolveFleetNextTurn,validateFleetTurn,
 protectingFleetUnits,availableFleetTargets,refreshEscortLinks,fuseFleetSupports,
 fusionUnavailableReason,effectUnavailableReason,defenseSlotsAvailable,autoFleetTurn
} from './fleetNext/combat.js';

const ids={bypass:'prog-bypass',machine:'prog-machine-striker',guard:'prog-machine-guard',fusion:'prog-fusion-l04'};
const general=type=>Object.values(GENERAL_CARDS).find(c=>c.effectSpec.type===type&&c.kind!=='character'&&
 (type!=='protect'||c.effectSpec.target==='selected'));
function battle(options={}){
 const b=createFleetNextBattle({shipA:'N00',levelA:1,shipB:'C03',levelB:1,mode:'pvp',deckA:[],deckB:[],...options});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=[];side.discard=[];}
 return b;
}
const hp=side=>side.ships[0].parts.map(p=>[p.id,p.hp]);
function kill(side,id){const p=side.ships[0].parts.find(p=>p.id===id);p.hp=0;p.destroyed=true;p.damage=2;}
function ownTurn(b,who='A',order={}){
 b.turn=who;b.deadlineMs=1000000;
 const result=resolveFleetNextTurn(b,who,{partId:'weapons',cards:[],...order},b.ply*30000);
 assert.equal(result.ok,true,result.reason);return result;
}

test('Aurora levels 1–5 always have two real vital components and no supports or reserves',()=>{
 for(let level=1;level<=5;level++){
  const side=createFleetSide('N00',level,[],1988);
  assert.deepEqual(side.ships[0].parts.map(p=>p.id),['weapons','generator']);
  assert.equal(side.escorts.length,0);assert.equal(side.reserveEscorts.length,0);
  assert.equal(side.fusionLimit,0);assert.equal(defenseSlotsAvailable(side),2);
  assert.equal(side.attackSlots.length,3);assert.equal(side.defenseSlots.length,2);
 }
});

test('All 60 campaign configurations initialize the actual progressions, never more than two active supports',()=>{
 for(const id of CAMPAIGN_SHIP_ORDER)for(let level=1;level<=5;level++){
  const side=createFleetSide(id,level,[],100),p=getShipProgression(id,level);
  assert.deepEqual(side.ships[0].parts.map(v=>v.id),p.vitalIds,id+' L'+level);
  assert.deepEqual(side.ships[0].parts.map(v=>v.maxHp),p.vitalIds.map(k=>p.integrityByPart[k]));
  assert.equal(side.ships[0].attackPower,p.attackPower);assert.equal(side.ships[0].defensePower,p.defensePower);
  assert.equal(side.escorts.length,p.escortCount);assert.ok(side.escorts.length<=2);
  assert.deepEqual(side.escorts.map(e=>e.grade),p.escortGrades);
  assert.equal(side.reserveEscorts.length,p.reserveCount);
  if(side.escorts.length)assert.ok(side.ships[0].parts.some(v=>v.id==='command'));
 }
});

test('All support roles protect the mother, including jam and attack roles',()=>{
 const b=battle(),side=b.sides.B;
 assert.equal(protectingFleetUnits(side).length,2);
 const before=hp(side),target=side.escorts[1];
 const r=ownTurn(b,'A',{targetKind:'escort',targetId:target.id});
 assert.deepEqual(hp(r.battle.sides.B),before);
 assert.equal(r.shot.targetId,target.id);assert.ok(r.shot.escortDamage>0);
 assert.equal(r.battle.sides.B.escorts[0].hp,side.escorts[0].hp);
});

test('Damage keeps a guard active; destroyed, disabled, and disconnected guards stop protecting',()=>{
 const side=battle().sides.B;
 side.escorts[0].hp=1;assert.equal(protectingFleetUnits(side).length,2);
 side.escorts[0].disabledUntilPly=3;assert.equal(protectingFleetUnits(side,2).length,1);
 assert.equal(protectingFleetUnits(side,3).length,2);
 side.escorts[0].hp=0;side.escorts[0].destroyed=true;assert.equal(protectingFleetUnits(side,3).length,1);
 kill(side,'command');refreshEscortLinks(side,3);assert.equal(protectingFleetUnits(side,3).length,0);
});

test('Explicit ordinary mother targeting is rejected without consuming cards; legacy orders route to a protector',()=>{
 const b=battle(),before=JSON.stringify(b);
 assert.match(validateFleetTurn(b,'A',{targetKind:'part',targetId:'weapons',cards:[]}),/supporti/);
 assert.equal(JSON.stringify(b),before);
 const r=ownTurn(b);
 assert.equal(r.shot.targetKind,'escort');assert.equal(r.shot.damage,0);
 assert.deepEqual(hp(r.battle.sides.B),hp(b.sides.B));
});

test('Piercing does not bypass support ships',()=>{
 const b=battle();b.sides.A.hand=[general('pierce').id];
 assert.match(validateFleetTurn(b,'A',{targetKind:'part',targetId:'weapons',cards:[0]}),/supporti/);
 const r=ownTurn(b,'A',{cards:[0]});assert.equal(r.shot.targetKind,'escort');
 assert.deepEqual(hp(r.battle.sides.B),hp(b.sides.B));
});

test('Bypass reaches one vital but ordinary defenses still stop its hit',()=>{
 const b=battle(),def=general('protect'),enemy=b.sides.B,part=enemy.ships[0].parts.find(p=>p.id==='weapons');
 b.sides.A.hand=[ids.bypass];
 enemy.defenses=[{id:def.id,source:'test-defense',untilPly:4}];
 enemy.protections=[{id:def.id,source:'test-defense',target:'part',partId:'weapons',remaining:1,untilPly:4}];
 const r=ownTurn(b,'A',{targetKind:'part',targetId:'weapons',cards:[0]});
 assert.equal(r.shot.damage,0);assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.B.ships[0].parts.find(p=>p.id==='weapons').hp,part.hp);
 assert.ok(r.events.some(e=>e.kind==='block'));
});

test('Bypass and multishot never multiply access through guarding units',()=>{
 const b=battle();b.sides.A.hand=[ids.bypass,general('multishot').id];
 const r=ownTurn(b,'A',{targetKind:'part',targetId:'weapons',cards:[0,1]});
 assert.equal(r.shot.damage,1);assert.equal(r.shot.targets.length,1);
 assert.equal(r.shot.escortDamage,0);
});

test('Ordinary multishot can hit the protecting units but does not spill into the mother',()=>{
 const b=battle();b.sides.A.hand=[general('multishot').id];
 for(const escort of b.sides.B.escorts)escort.hp=1;
 const r=ownTurn(b,'A',{cards:[0]});
 assert.ok(r.shot.escortDamage>0);assert.equal(r.shot.damage,0);
 assert.deepEqual(hp(r.battle.sides.B),hp(b.sides.B));
});

test('Machine deployment is available on Aurora level one and the deployed card stays on the field',()=>{
 const b=battle({shipB:'N00'});b.sides.A.hand=[ids.machine];
 const r=ownTurn(b,'A',{cards:[0],pass:true}),side=r.battle.sides.A;
 assert.equal(side.machines.length,1);assert.equal(side.machines[0].sourceCardId,ids.machine);
 assert.equal(side.machines[0].slot,0);assert.equal(side.machines[0].hp,3);
 assert.equal(protectingFleetUnits(side).length,1);
 assert.ok(!side.hand.includes(ids.machine)&&!side.deck.includes(ids.machine)&&!side.discard.includes(ids.machine));
});

test('Two machines have independent berths and a third deployment is rejected atomically',()=>{
 const b=battle({shipB:'N00'});b.sides.A.hand=[ids.machine,ids.guard];
 let r=ownTurn(b,'A',{cards:[0,1],pass:true});
 assert.deepEqual(r.battle.sides.A.machines.map(m=>m.slot),[0,1]);
 r.battle.turn='A';r.battle.sides.A.hand=[ids.machine];
 const before=JSON.stringify(r.battle);
 const rejected=resolveFleetNextTurn(r.battle,'A',{cards:[0],pass:true},1000);
 assert.equal(rejected.ok,false);assert.match(rejected.reason,/alloggiamenti/);
 assert.equal(JSON.stringify(r.battle),before);
});

test('Chosen machines can be attacked before supports and discard their card once when destroyed',()=>{
 const b=battle();b.sides.B.machines=[{id:'machine-B',slot:0,name:'Robot',hp:1,maxHp:3,power:1,sourceCardId:ids.machine}];
 const before=hp(b.sides.B),r=ownTurn(b,'A',{targetKind:'machine',targetId:'machine-B'}),side=r.battle.sides.B;
 assert.equal(r.shot.machineDamage,1);assert.equal(r.shot.escortDamage,0);assert.deepEqual(hp(side),before);
 assert.equal(side.discard.filter(id=>id===ids.machine).length,1);
 assert.equal(protectingFleetUnits(side).length,2);
});

test('A disabled machine stops protecting until its disable expires',()=>{
 const b=battle({shipB:'N00'}),side=b.sides.B;
 side.machines=[{id:'disabled',slot:0,name:'Robot',hp:3,maxHp:3,disabledUntilPly:2}];
 assert.equal(protectingFleetUnits(side,1).length,0);assert.equal(protectingFleetUnits(side,2).length,1);
 const r=ownTurn(b,'A',{targetKind:'part',targetId:'weapons'});assert.equal(r.shot.damage,1);
});

test('The Defense and Trap slots each hold one card and are both usable at level one',()=>{
 const b=battle({shipB:'N00'}),def=general('protect'),trap=general('trap');
 b.sides.A.hand=[def.id,trap.id];
 const r=ownTurn(b,'A',{cards:[0,1],pass:true});
 assert.equal(r.battle.sides.A.defenses.length,2);
 assert.equal(r.battle.sides.A.defenses.filter(d=>d.hidden).length,1);
 const duplicate=battle({shipB:'N00'});duplicate.sides.A.hand=[def.id,def.id];
 assert.match(validateFleetTurn(duplicate,'A',{cards:[0,1],pass:true}),/Difesa scoperta/);
 const doubleTrap=battle({shipB:'N00'});doubleTrap.sides.A.hand=[trap.id,trap.id];
 assert.match(validateFleetTurn(doubleTrap,'A',{cards:[0,1],pass:true}),/Trappola coperta/);
});

test('Destroying Aurora generator powers off defenses and Character while separate Bridge keeps Character active',()=>{
 for(const shipId of ['N00','C02']){
  const b=battle({shipB:shipId,levelB:1}),enemy=b.sides.B,trap=general('trap');
  enemy.ships[0].parts.find(p=>p.id==='generator').hp=1;
  enemy.defenses=[{id:trap.id,source:'trap',hidden:true,untilPly:null,trigger:'terrain',action:'cancel'}];
  enemy.commander={id:eligibleExclusives(shipId,1).find(c=>c.kind==='character').id,source:'character',untilPly:20};
  const r=ownTurn(b,'A',{targetKind:'part',targetId:'generator'}),updated=r.battle.sides.B;
  assert.equal(updated.defenses.length,0);
  assert.equal(!!updated.commander,shipId==='C02');
  assert.equal(defenseSlotsAvailable(updated),0);
 }
});

test('Destroyed Centralina disconnects evolutionary supports but independent machines still protect',()=>{
 const b=battle();kill(b.sides.B,'command');
 b.sides.B.machines=[{id:'machine',slot:0,name:'Robot',hp:3,maxHp:3,power:0}];
 assert.deepEqual(protectingFleetUnits(b.sides.B).map(g=>g.kind),['machine']);
 assert.ok(availableFleetTargets(b.sides.B).filter(t=>t.kind==='part').every(t=>t.blocked));
 const r=ownTurn(b);assert.equal(r.shot.targetKind,'machine');
});

test('Final ship level one first fusion creates one fused support and no invented reserve',()=>{
 const side=createFleetSide('L04',1,[],99),result=fuseFleetSupports(side);
 assert.equal(result.ok,true);assert.equal(side.escorts.length,1);assert.equal(side.reserveEscorts.length,0);
 assert.deepEqual(side.escorts[0].sourceIndices,[0,1]);assert.ok(side.escorts[0].fused);
 assert.equal(fuseFleetSupports(side).ok,false);assert.equal(side.fusionsUsed,1);
});

test('Final ship level three deploys reserve three once; second fusion requires reserve four',()=>{
 const side=createFleetSide('L04',3,[],99);
 assert.equal(fuseFleetSupports(side).ok,true);
 assert.deepEqual(side.escorts.map(e=>e.sourceIndices),[[0,1],[2]]);
 assert.equal(side.reserveEscorts.length,0);assert.match(fusionUnavailableReason(side),/quarto/);
 assert.equal(fuseFleetSupports(side).ok,false);
});

test('Both Fusion cards resolve in a real turn at final level five without creating a third active unit',()=>{
 const b=battle({shipA:'L04',levelA:5});b.sides.A.hand=[ids.fusion,ids.fusion];
 const r=ownTurn(b,'A',{cards:[0,1],pass:true}),side=r.battle.sides.A;
 assert.deepEqual(side.escorts.map(e=>e.sourceIndices),[[0,1],[2,3]]);
 assert.ok(side.escorts.every(e=>e.fused));assert.equal(side.escorts.length,2);
 assert.equal(side.reserveEscorts.length,0);assert.equal(side.fusionsUsed,2);
 assert.match(effectUnavailableReason(card(ids.fusion),side,r.battle),/già state usate/);
});

test('Fusion carries the damage ratio and never repairs a destroyed vital',()=>{
 const side=createFleetSide('L04',5,[],11);
 for(const e of side.escorts)e.hp=Math.max(1,Math.floor(e.maxHp/2));
 const oldHp=side.escorts.reduce((n,e)=>n+e.hp,0),oldMax=side.escorts.reduce((n,e)=>n+e.maxHp,0);
 kill(side,'bridge');const result=fuseFleetSupports(side);
 assert.equal(result.ok,true);assert.equal(result.fused.hp,Math.floor(result.fused.maxHp*oldHp/oldMax));
 assert.equal(side.ships[0].parts.find(p=>p.id==='bridge').hp,0);
 assert.ok(result.fused.hp<result.fused.maxHp);assert.ok(result.fused.maxHp>oldMax);
});

test('Fusion refuses destroyed or disabled materials and a destroyed Centralina without consuming anything',()=>{
 for(const sabotage of ['destroyed','disabled','command']){
  const side=createFleetSide('L04',5,[],11);
  if(sabotage==='destroyed'){side.escorts[0].hp=0;side.escorts[0].destroyed=true;}
  if(sabotage==='disabled')side.escorts[0].disabledUntilPly=2;
  if(sabotage==='command')kill(side,'command');
  const before=JSON.stringify(side);assert.equal(fuseFleetSupports(side).ok,false);assert.equal(JSON.stringify(side),before);
 }
});

test('Destroying both Arsenals does not end the game; the emergency shot remains effective through armor',()=>{
 const b=battle({shipB:'N00',levelB:5});kill(b.sides.A,'weapons');kill(b.sides.B,'weapons');
 const r=ownTurn(b,'A',{targetKind:'part',targetId:'generator',partId:'generator'});
 assert.equal(r.shot.damage,1);assert.equal(r.shot.emergency,true);assert.equal(r.battle.phase,'playing');
 assert.ok(r.events.some(e=>e.kind==='emergency-shot'));
});

test('AI explicitly targets guards, uses Bypass for mother and can play fusion',()=>{
 const b=battle();const ordinary=autoFleetTurn(b,'A');
 assert.equal(ordinary.targetKind,'escort');assert.equal(validateFleetTurn(b,'A',ordinary),null);
 b.sides.A.hand=[ids.bypass];const direct=autoFleetTurn(b,'A');assert.equal(direct.targetKind,'part');
 assert.deepEqual(direct.cards,[0]);assert.equal(validateFleetTurn(b,'A',direct),null);
 const fused=battle({shipA:'L04',levelA:5});fused.sides.A.hand=[ids.fusion];
 const ai=autoFleetTurn(fused,'A');assert.deepEqual(ai.cards,[0]);
 const r=ownTurn(fused,'A',ai);assert.equal(r.battle.sides.A.fusionsUsed,1);
});
