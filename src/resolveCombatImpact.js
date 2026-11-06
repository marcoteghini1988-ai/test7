// Punto 46 — unica risoluzione del colpo, usata dal gioco e dai test.
// Le carte, il bersaglio, la formula e la vera salva vengono autorizzati
// dal motore di lancio; qui si risolve soltanto l'impatto già in volo.
// Nessuna mutazione dei parametri; i danni e gli status restano a evento reale.
import {applyPendingHit} from './mathDuelEngine.js';
import {bossNumericDamageFactor,bossNumericDefenseFactor,rememberBossNumericImpact,applyBossNumericSync} from './bossNumericDecks.js';
import {commanderAttackFactor,commanderDefenseFactor,rememberCommanderImpact} from './commanderAbilities.js';
import {arenaAttackFactor,arenaMotherDefenseFactor,applyArenaIonResistance} from './battleArenas.js';
import {balancedCombatImpact} from './combatBalance.js';

export function resolveCombatImpact({attacker,defender,arenaId,effect,context={},options={}}){
 if(!attacker||!defender||!effect||context.legalAttack!==true){
  return {attacker,defender,result:null,balance:null,reason:'unauthorized'};
 }
 const factors={
  bossAttack:bossNumericDamageFactor(attacker,defender,context),
  bossDefense:bossNumericDefenseFactor(defender,context),
  commanderAttack:commanderAttackFactor(attacker,defender,context),
  commanderDefense:commanderDefenseFactor(defender,attacker,context),
  arenaAttack:arenaAttackFactor(arenaId,context),
  arenaDefense:arenaMotherDefenseFactor(arenaId,defender,context),
  unmodifiedVolleyDamage:effect.unmodifiedVolleyDamage
 };
 const balance=balancedCombatImpact(effect.rawDamage,factors);
 const hitOptions={...options,motherDefenseFactor:balance.defenseFactor};
 const result=applyPendingHit(defender,effect.targetShip,effect.op,balance.damage,hitOptions);
 const afterArena=applyArenaIonResistance(result.defender,arenaId,result.strategicApplied,
  hitOptions.nowMs??context.nowMs??0,context.environmentStage);
 const remembered=rememberBossNumericImpact(attacker,afterArena,context,result);
 const commander=rememberCommanderImpact(remembered.attacker,remembered.defender,context,result);
 const previousSync=Number(defender.maneuvers?.sync)||0;
 const credited=(Number(commander.defender.maneuvers?.sync)||0)-previousSync;
 return {attacker:commander.attacker,
  defender:applyBossNumericSync(commander.defender,credited),
  result,balance,reason:'ok'};
}
