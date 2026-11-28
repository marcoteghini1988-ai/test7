// Verifica autonoma del risultato giornaliero: nessuna carta Pilota del vecchio motore.
import {auditPhase10Duel,createPhase10Handoff} from './phase10Audit.js';

const MODIFIERS=new Set(['standard','fast_timer','no_pass','boss_combined']);
const pad=(number,min,max)=>Math.min(max,Math.max(min,Math.floor(Number(number)||min)));
function isPhase13CampaignEligible({gameMode,activeAdventure,sectorMode='classic',hasNetworkOpponent=false}={}){
 const p=activeAdventure?.planet,s=activeAdventure?.level;
 return gameMode==='adventure'&&!hasNetworkOpponent&&sectorMode==='classic'&&
  Number.isInteger(p)&&p>=1&&p<=20&&Number.isInteger(s)&&s>=1&&s<=10&&
  MODIFIERS.has(activeAdventure?.modifier?.id||'standard');
}
const getPhase13BossPhases=()=>1;

export function validatePhase13Settlement(state,context={},telemetry={},challenge=null) {
  if(!isPhase13CampaignEligible(context)) return {ok:false,reason:'Settore non migrato o contesto non autorizzato'};
  const sector=context.activeAdventure.level,planet=context.activeAdventure.planet;
  if(state?.campaignSession?.planet!==planet || state?.campaignSession?.sector!==sector)
    return {ok:false,reason:'La sessione non corrisponde al settore richiesto'};
  const audit=auditPhase10Duel(state);
  if(!audit.ok) return {ok:false,reason:'Stato del duello non valido',errors:audit.errors};
  const handoff=createPhase10Handoff(state,context);
  if(!handoff.ok) return {ok:false,reason:handoff.reason};
  const r=handoff.report, boss=sector===10, track=state.campaignBossTrack;
  if(r.planet!==planet||r.sector!==sector||r.isBoss!==boss)
    return {ok:false,reason:'Identità del duello differente dal settore'};
  if(!track || track.planet!==planet || track.sector!==sector || track.max!==getPhase13BossPhases(planet,sector) ||
     track.current<1 || track.current>track.max || track.cleared!==track.current-1)
    return {ok:false,reason:'Stato del boss non coerente'};
  const win=r.outcome==='player';
  const hpRatio=pad(Math.round(100*r.playerHp/r.playerMaxHp),0,100)/100;
  const stats={totalTimeElapsed:Math.max(1,Math.floor((Number(telemetry.elapsedMs)||1000)/1000)),
    finalHp:r.playerHp,maxHp:r.playerMaxHp,
    exchangesUsed:Math.max(0,Number(telemetry.swaps)||0),opCounts:telemetry.opCounts||{},
    maxSingleHitDmg:Math.max(0,Number(telemetry.maxSingleHitDmg)||0),
    goldenOrComboCount:Math.max(0,Number(telemetry.goldenOrComboCount)||0),
    moduleActivations:Math.max(0,Number(telemetry.moduleActivations)||0),
    heartsPlayed:Math.max(0,Number(telemetry.heartsPlayed)||0),
    fastStrikesCount:Math.max(0,Number(telemetry.fastStrikesCount)||0),
    validPokerCombos:Math.max(0,Number(telemetry.validPokerCombos)||0),
    winningResponses:Math.max(0,Number(telemetry.winningResponses)||0),
    multiSuitShots:Math.max(0,Number(telemetry.multiSuitShots)||0),
    boostActivations:Math.max(0,Number(telemetry.boostActivations)||0),
    weaponDamage:Math.max(0,Number(telemetry.weaponDamage)||0)};
  const stars=[win,win&&hpRatio>=.5,win&&typeof challenge?.check==='function'&&Boolean(challenge.check(stats))];
  const meta={isDraw:r.outcome==='draw',isPvP:false,usedRevive:false,turnsElapsed:Math.max(1,r.exchanges),
    activeTimeElapsedMs:Math.max(1000,Number(telemetry.elapsedMs)||1000),
    remainingHpPct:hpRatio,matchStats:stats,starsEarned:stars,
    adventureChallenge:challenge?{challenge,stats,starsEarned:stars}:null,ruleset:r.ruleset};
  return {ok:true,report:r,meta};
}
export function createPhase13OnceGuard() {
  const claimed=new Set();
  return {claim(key){if(typeof key!=='string'||!key||claimed.has(key))return false;claimed.add(key);return true;},
    has:key=>claimed.has(key)};
}
