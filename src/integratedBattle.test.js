// Punto 46 — collaudo d'integrazione del vero duello continuo.
// Le prove passano per gli stessi motori e per lo stesso risolutore della UI,
// non producono direttamente danni arbitrari o carte inventate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 initialBattle,inspectCalculationCards,dealHit,consumeAttack,previewVolley,healthScore
} from './mathDuelEngine.js';
import {chooseCombatMove} from './aiBattleTactics.js';
import {resolveCombatImpact} from './resolveCombatImpact.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {BOSS_NUMERIC_DECKS} from './bossNumericDecks.js';
import {arenaEnvironment,arenaForBattle} from './battleArenas.js';
import {playSpecialCard,findFusionCardIndex,SPECIAL_HAND_SIZE} from './specialCards.js';
import {armedShotEffects} from './strategicShots.js';
import {recordManeuverEvent,MANEUVER_RULES} from './fleetManeuvers.js';
import {battlePacingReport} from './battlePacing.js';

const seeded=seed=>{
 let s=seed>>>0;
 return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};
};
const numericIds=side=>[...side.hand,...side.deck,...side.discard].map(c=>c.id);
const specialIds=side=>[...side.specialHand,...side.specialDeck,...side.specialDiscard].map(c=>c.id);
const verifyDecks=(side)=>{
 assert.equal(side.hand.length,7);
 assert.equal(numericIds(side).length,52);
 assert.equal(new Set(numericIds(side)).size,52);
 assert.equal(side.specialHand.length,SPECIAL_HAND_SIZE);
 assert.equal(specialIds(side).length,24);
 assert.equal(new Set(specialIds(side)).size,24);
};
const make=(planet,local,seed=3)=>{
 const index=PHASE16A_CAMPAIGN_PLANETS.findIndex(p=>p.id===planet.id);
 const global=index*10+local;
 const options={
  vitalPrototype:true,fleetIds:['N00'],shipLevel:5,
  arenaPlanetId:planet.id,arenaSectorLevel:local,
  playerCommanderId:'pilot_com_1',playerCommanderLevel:5,
  enemyCommanderId:'pilot_boss_1',enemyCommanderLevel:5,
  ...(local===10?{enemyBossDeckId:planet.deck,
   enemyBossDeckLevel:BOSS_NUMERIC_DECKS[planet.deck].maxLevel}:{})
 };
 return initialBattle(global,options,seeded(seed),'campaign');
};
const moveCards=(side,move)=>{
 const indices=Array.isArray(move.indices)?move.indices:[move.i,move.j];
 return {indices,cards:indices.map(i=>side.hand[i])};
};
const selectRealMove=(side,defender,targets)=>{
 const move=chooseCombatMove(side,defender,targets,()=>.5);
 if(!move)return null;
 const {indices,cards}=moveCards(side,move);
 if(!inspectCalculationCards(move.op,cards,targets[move.op]).valid)return null;
 const volley=previewVolley(side,cards,'auto',{targetKind:'motherShield'});
 return volley.totalDamage>0?{move,indices,cards}:null;
};
function playableBoss(planet,needs=[]){
 for(let seed=1;seed<=96;seed++){
  const game=make(planet,10,seed);
  const move=selectRealMove(game.player,game.enemy,game.targets);
  if(!move)continue;
  if(needs.some(type=>!game.player.specialHand.some(c=>c.type===type)))continue;
  return {game,...move,seed};
 }
 throw new Error('Nessun assetto giocabile con carte reali per '+planet.name);
}
function fireRealShieldImpact(game,side,round=game.round){
 const attacker=game[side],defender=game[side==='player'?'enemy':'player'];
 const legal=selectRealMove(attacker,defender,game.targets);
 assert.ok(legal,'Nessun attacco matematico disponibile per '+side);
 const {move,indices,cards}=legal;
 const stage=arenaEnvironment(game.arena.id,round).stage;
 const strategic=armedShotEffects(attacker);
 const strike=dealHit(defender,attacker,move.op,game.targets[move.op],cards,move.targetShip,{},'auto');
 assert.ok(strike.rawDamage>0,'La vera munizione deve colpire');
 assert.ok(strike.volley.length>0);
 const launched=consumeAttack(strike.attacker,indices);
 if(strategic.length)launched.armedVolleyEffects=[];
 const effect={
  targetShip:move.targetShip,op:move.op,rawDamage:strike.rawDamage,
  unmodifiedVolleyDamage:strike.volley.reduce((sum,shot)=>
   sum+Math.max(0,(shot.damage||0)-(shot.maneuverBonus||0)),0)
 };
 const context={
  legalAttack:true,cards,op:move.op,escortIndex:null,vitalId:null,
  nowMs:1000,environmentStage:stage,
  strikeEffects:strategic,
  motherShot:true,escortShot:strike.volley.some(s=>s.escortSlot!=null),
  weaponKey:strike.volley[0]?.weaponId,reshufflesAtLaunch:attacker.reshuffles||0
 };
 const impact=resolveCombatImpact({
  attacker:launched,defender,arenaId:game.arena.id,effect,context,
  options:{nowMs:1000,strikeEffects:strategic,hitId:'integrated-'+side+'-'+round}
 });
 assert.equal(impact.reason,'ok');
 assert.ok(impact.result.damage>=0);
 assert.ok(impact.balance.damage>=0);
 assert.ok(impact.balance.passiveFactor<=1.35);
 assert.ok(impact.balance.defenseFactor>=.65);
 assert.ok(impact.balance.damage<=Math.floor(effect.unmodifiedVolleyDamage*1.45+1e-9));
 verifyDecks(impact.attacker);
 verifyDecks(impact.defender);
 return {impact,stage,strike,cards,move};
}

test('46: tutti i 120 settori si inizializzano con mani reali 7+5 e arene corrette',()=>{
 let sectors=0;
 for(const planet of PHASE16A_CAMPAIGN_PLANETS)for(let local=1;local<=10;local++){
  const g=make(planet,local,local+planet.id*17);
  assert.equal(g.vitalPrototype,true,planet.name+' livello '+local);
  assert.equal(g.arena.id,arenaForBattle(g.level,'campaign',null,{
   planetId:planet.id,sectorLevel:local}).id);
  assert.equal(g.arena.kind==='boss',local===10);
  assert.equal(g.player.escorts.length,2);
  assert.equal(g.enemy.escorts.length,2);
  verifyDecks(g.player);
  verifyDecks(g.enemy);
  assert.ok(Number.isFinite(healthScore(g.player)));
  assert.ok(Number.isFinite(healthScore(g.enemy)));
  if(local===10)assert.equal(g.enemy.bossNumericDeck?.id,planet.deck);
  else assert.equal(g.enemy.bossNumericDeck??null,null);
  sectors++;
 }
 assert.equal(sectors,120);
});

test('46: 12 boss vengono colpiti attraverso formula, munizioni vere e risolutore condiviso',()=>{
 let checked=0;
 for(const planet of PHASE16A_CAMPAIGN_PLANETS){
  const {game}=playableBoss(planet);
  const before=structuredClone(game);
  const {impact,strike,cards}=fireRealShieldImpact(game,'player',7);
  assert.ok(strike.rawDamage>0);
  assert.ok(impact.defender.fleet[0].defense.shield.hp<=before.enemy.fleet[0].defense.shield.hp);
  assert.deepEqual(game,before,'Il risolutore non deve mutare lo stato iniziale');
  assert.equal(impact.attacker.numericCardsSpent,cards.length+(game.player.numericCardsSpent||0));
  checked++;
 }
 assert.equal(checked,12);
});

test('46: IA e giocatore usano le stesse regole di impatto anche in PICCO',()=>{
 const planet=PHASE16A_CAMPAIGN_PLANETS[1];
 let match;
 for(let seed=1;seed<96;seed++){
  const candidate=make(planet,10,seed);
  if(selectRealMove(candidate.player,candidate.enemy,candidate.targets)&&
     selectRealMove(candidate.enemy,candidate.player,candidate.targets)){match=candidate;break;}
 }
 assert.ok(match);
 const player=fireRealShieldImpact(match,'player',7);
 const enemy=fireRealShieldImpact(match,'enemy',7);
 assert.equal(player.stage,'surge');
 assert.equal(enemy.stage,'surge');
 assert.ok(player.impact.result.damage>=0&&enemy.impact.result.damage>=0);
 assert.equal(player.impact.balance.damage>=0,true);
 assert.equal(enemy.impact.balance.damage>=0,true);
});

test('46: Fusione Assalto usa carta vera, 100 Sincronia e non crea munizioni',()=>{
 const planet=PHASE16A_CAMPAIGN_PLANETS[0];
 const {game}=playableBoss(planet,['fusion-strike']);
 const side={...game.player,maneuvers:{...game.player.maneuvers,sync:100}};
 const idx=findFusionCardIndex(side,'strike');
 assert.ok(idx>=0);
 const before=structuredClone(side);
 const played=playSpecialCard(side,idx,{escortSlot:0},1000,seeded(20));
 assert.equal(played.played,true);
 assert.equal(played.side.maneuvers.fusion.mode,'strike');
 assert.equal(played.side.maneuvers.sync,0);
 assert.equal(played.side.specialUses,(before.specialUses||0)+1);
 assert.deepEqual(numericIds(played.side),numericIds(side));
 verifyDecks(played.side);
 const state={...game,player:played.side};
 const {impact,strike}=fireRealShieldImpact(state,'player',7);
 assert.ok(strike.rawDamage>0);
 assert.ok(impact.balance.damage<=Math.floor(impact.balance.unmodifiedVolleyDamage*1.45+1e-9));
 assert.equal(impact.attacker.specialUses,played.side.specialUses);
 assert.deepEqual(side,before);
});

test('46: Sincronia cambia solo dopo evento reale; le speciali armate richiedono carta',()=>{
 const planet=PHASE16A_CAMPAIGN_PLANETS[1];
 const {game}=playableBoss(planet,['shot-ion']);
 const idx=game.player.specialHand.findIndex(card=>card.type==='shot-ion');
 const before=structuredClone(game.player);
 const used=playSpecialCard(game.player,idx,{escortSlot:0},1000,seeded(10));
 assert.equal(used.played,true);
 assert.ok(used.side.armedVolleyEffects.includes('shot-ion'));
 assert.equal(used.side.specialUses,(before.specialUses||0)+1);
 const blocked=playSpecialCard(used.side,999,{escortSlot:0},1000,seeded(10));
 assert.equal(blocked.played,false);
 const event=recordManeuverEvent(used.side.maneuvers,{
  id:'point46-valid-calculation',type:'valid_calculation'});
 assert.equal(event.credited,MANEUVER_RULES.syncPerCalculation);
 const repeat=recordManeuverEvent(event.state,{
  id:'point46-valid-calculation',type:'valid_calculation'});
 assert.equal(repeat.credited,0);
 const {impact}=fireRealShieldImpact({...game,player:{...used.side,maneuvers:event.state}},
  'player',7);
 assert.equal(impact.attacker.specialUses,used.side.specialUses);
 assert.ok(!impact.attacker.armedVolleyEffects?.includes('shot-ion'));
 assert.deepEqual(game.player,before,'La carta iniziale rimane intatta');
});

test('46: statistiche di fine incontro mantengono esiti, colpi e carte speciali',()=>{
 const g=make(PHASE16A_CAMPAIGN_PLANETS[0],10,44);
 const safe=structuredClone(g);
 const report=battlePacingReport({
  ...g,combatStartedAt:1000,round:8,
  balanceMetrics:{resolvedImpacts:6,playerImpacts:3,enemyImpacts:3,
   passiveCaps:2,fusionStackCaps:1,defenseCaps:1,
   peakImpacts:1,specialImpacts:2}
 },61000);
 assert.equal(report.elapsedSeconds,60);
 assert.equal(report.balanceResolvedImpacts,6);
 assert.equal(report.balancePeakImpacts,1);
 assert.equal(report.balanceSpecialImpacts,2);
 assert.equal(report.balanceFusionStackCaps,1);
 assert.deepEqual(g,safe);
});
