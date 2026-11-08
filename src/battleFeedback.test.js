// Punto 47: il feedback NON influenza il combattimento.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 spentCardTrail,launchBattleCue,impactBattleCue,specialBattleCue
} from './battleFeedback.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {initialBattle,dealHit,inspectCalculationCards,consumeAttack} from './mathDuelEngine.js';
import {chooseCombatMove} from './aiBattleTactics.js';
import {resolveCombatImpact} from './resolveCombatImpact.js';

const cards=[
 {id:'h2',suit:'♥',value:2},{id:'d3',suit:'♦',value:3},
 {id:'c4',suit:'♣',value:4}
];
const rng=()=>.5;

test('47: il flusso di caricamento usa SOLO le carte numeriche effettivamente selezionate',()=>{
 const original=structuredClone(cards);
 const spent=spentCardTrail(cards,[0,3,6],'player');
 assert.deepEqual(spent.map(c=>c.id),['h2','d3','c4']);
 assert.deepEqual(spent.map(c=>c.index),[0,3,6]);
 assert.deepEqual(spent.map(c=>c.suit),['♥','♦','♣']);
 assert.equal(Object.isFrozen(spent),true);
 assert.deepEqual(cards,original);
 assert.deepEqual(spentCardTrail(cards,[0,3,6],'enemy'),[]);
 assert.deepEqual(spentCardTrail(cards,[0,0,1]),[]);
 assert.deepEqual(spentCardTrail(cards,[0,3]),[]);
 assert.deepEqual(spentCardTrail([{id:'a',value:99,suit:'♥'},cards[1]],[0,1]),[]);
 assert.deepEqual(spentCardTrail([cards[0],{id:'b',value:4,suit:'★'}],[0,1]),[]);
});

test('47: il feedback non annuncia spari se le armi stanno ancora caricando',()=>{
 const charging=launchBattleCue({id:1,side:'player',cards:cards.slice(0,2),
  rawDamage:0,shots:[{damage:0,charging:true}]});
 assert.equal(charging.kind,'charge');
 assert.match(charging.label,/CARICA/);
 const launch=launchBattleCue({id:2,side:'player',cards,rawDamage:24,
  shots:[{damage:18},{damage:6},{damage:0}],effects:['shot-ion','shot-piercing']});
 assert.equal(launch.kind,'launch');
 assert.match(launch.label,/TRIPLA/);
 assert.match(launch.detail,/2 armi attive/);
 assert.match(launch.detail,/BRECCIA IONICA/);
 assert.equal(launch.side,'player');
 assert.equal(launchBattleCue({id:0,cards,shots:[]}),null);
 assert.equal(launchBattleCue({id:1,cards:[],shots:[]}),null);
 assert.equal(launchBattleCue({id:1,cards,shots:null}),null);
});

test('47: danni, assorbimenti, speciali e distruzione derivano solo dal risultato reale',()=>{
 const blocked=impactBattleCue({id:1,side:'enemy',result:{damage:0}});
 assert.equal(blocked.kind,'blocked');
 assert.equal(blocked.side,'enemy');
 const shield=impactBattleCue({id:2,side:'player',result:{damage:14},
  effect:{escortIndex:null,vitalId:null}});
 assert.equal(shield.kind,'impact');
 assert.match(shield.detail,/14 HP/);
 assert.match(shield.detail,/SCUDO/);
 const ion=impactBattleCue({id:3,side:'player',result:{
  damage:9,strategicApplied:['shot-ion','shot-corrosion']
 }});
 assert.equal(ion.kind,'special');
 assert.match(ion.label,/DISGREGAZIONE IONICA/);
 const disabled=impactBattleCue({id:4,side:'player',result:{
  damage:12,systemDisabled:'engine',strategicApplied:['shot-ion']
 },effect:{vitalId:'engine'}});
 assert.equal(disabled.kind,'critical');
 assert.match(disabled.label,/DISTRUTTO/);
 assert.match(disabled.detail,/12 HP/);
 assert.match(disabled.detail,/IONIZZAZIONE|IMPULSO IONICO/);
 assert.equal(impactBattleCue({id:5,side:'player',result:null}),null);
 assert.equal(impactBattleCue({id:0,result:{damage:20}}),null);
});

test('47: ogni speciale ottiene un segnale SOLO quando la carta è stata giocata',()=>{
 let id=0;
 for(const definition of Object.values(SPECIAL_CARD_CATALOG)){
  const cue=specialBattleCue({id:++id,side:'player',played:true,definition});
  assert.equal(cue.label,definition.name);
  assert.ok(cue.detail.length>0);
  assert.equal(cue.id,'special:'+id);
  assert.ok(['fusion','volley','support','defense','offense','intel','reaction','boss-character','terrain','mutation','epic','sabotage','transmute','quantum','equipment','rift'].includes(cue.kind));
  assert.equal(specialBattleCue({id,played:false,definition}),null);
 }
 const repaired=specialBattleCue({id:10,played:true,
  definition:SPECIAL_CARD_CATALOG['support-shield-repair'],amount:15});
 assert.match(repaired.detail,/15 HP/);
 assert.equal(specialBattleCue({id:0,played:true,
  definition:SPECIAL_CARD_CATALOG['fusion-barrier']}),null);
});

test('47: lancio e impatto veri mantengono identico il risultato con o senza cue',()=>{
 const battle=initialBattle(3,{
  vitalPrototype:true,fleetIds:['N00'],shipLevel:5
 },rng,'campaign');
 const move=chooseCombatMove(battle.player,battle.enemy,battle.targets,rng);
 assert.ok(move);
 const indices=Array.isArray(move.indices)?move.indices:[move.i,move.j];
 const used=indices.map(i=>battle.player.hand[i]);
 assert.ok(inspectCalculationCards(move.op,used,battle.targets[move.op]).valid);
 const original=structuredClone(battle);
 const strike=dealHit(battle.enemy,battle.player,move.op,battle.targets[move.op],
  used,move.targetShip,{},'auto');
 const consumed=consumeAttack(strike.attacker,indices);
 const effect={targetShip:move.targetShip,op:move.op,rawDamage:strike.rawDamage,
  unmodifiedVolleyDamage:strike.volley.reduce((n,s)=>n+Math.max(0,
   (s.damage||0)-(s.maneuverBonus||0)),0)};
 const context={legalAttack:true,cards:used,op:move.op,escortIndex:null,
  vitalId:null,environmentStage:'quiet',nowMs:1000,strikeEffects:[]};
 const first=resolveCombatImpact({
  attacker:consumed,defender:battle.enemy,arenaId:battle.arena.id,
  effect,context,options:{nowMs:1000,hitId:'feedback-47'}
 });
 const spent=spentCardTrail(used,indices,'player');
 const launch=launchBattleCue({id:1,cards:used,rawDamage:strike.rawDamage,
  shots:strike.volley});
 const impact=impactBattleCue({id:1,result:first.result,effect});
 assert.equal(spent.length,indices.length);
 assert.equal(launch.id,'launch:1');
 assert.equal(impact.id,'impact:1');
 const second=resolveCombatImpact({
  attacker:consumed,defender:battle.enemy,arenaId:battle.arena.id,
  effect,context,options:{nowMs:1000,hitId:'feedback-47'}
 });
 assert.deepEqual(first,second);
 assert.deepEqual(battle,original);
});

test('47: livelli grafici non intercettano input; il duello definitivo mostra solo eventi risolti',()=>{
 const oldUi=readFileSync(new URL('./BattleCombatFeedback.jsx',import.meta.url),'utf8');
 const oldCss=readFileSync(new URL('./BattleCombatFeedback.css',import.meta.url),'utf8');
 const official=readFileSync(new URL('./OfficialBattle3D.jsx',import.meta.url),'utf8');
 const playback=readFileSync(new URL('./TacticalCombatPlayback.jsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('./OfficialBattle3D.css',import.meta.url),'utf8');
 const timeline=readFileSync(new URL('./tacticalCombatTimeline.js',import.meta.url),'utf8');
 const entry=readFileSync(new URL('./MathDuelBattle.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(oldUi,/\bonClick\s*=/);
 assert.match(oldCss,/pointer-events:none/);
 assert.match(oldCss,/prefers-reduced-motion:reduce/);
 assert.match(oldUi,/aria-live="polite"/);
 assert.match(entry,/OfficialBattle3D\.jsx/);
 assert.match(official,/<TacticalCombatPlayback/);
 assert.match(playback,/currentTacticalPlayback\(battle,nowMs\)/);
 assert.match(timeline,/cycle\.impacts/);
 assert.match(css,/\.tdp-playback[^{]*\{[^}]*pointer-events:none/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
 assert.doesNotMatch(playback,/\bdealHit\s*\(|\bdamageMotherShield\s*\(/);
});
