// Point 29: fair deadlock recovery for the new continuous mother battle.
// No invented cards, no free damage, no forced clock for the human player.
import {chooseCombatMove} from './aiBattleTactics.js';

export const RECOVERY_COOLDOWN_MS=15000;
const bounded=(v)=>Number.isFinite(v)?Math.max(0,Math.min(.999999999,v)):0;
function shuffled(array,rng){
 const next=[...array];
 for(let i=next.length-1;i>0;i--){
  const j=Math.floor(bounded(Number(rng()))*(i+1));
  [next[i],next[j]]=[next[j],next[i]];
 }
 return next;
}
export function findDeadlock(side,defender,targets){
 if(!side?.recycleNumericDeck)return {stalled:false,reason:'legacy_mode'};
 if(!Array.isArray(side.hand)||side.hand.length<2)return {stalled:true,reason:'insufficient_hand'};
 return chooseCombatMove(side,defender,targets)?{stalled:false,reason:'legal_move_available'}:
  {stalled:true,reason:'no_legal_attack'};
}
// The recovery costs ONE numeric redraw and a 15s cooldown, only when truly
// impossible to fire. Cards stay within the original 52-card numeric set.
export function recoverStalledHand(side,defender,targets,nowMs=Date.now(),rng=Math.random){
 const check=findDeadlock(side,defender,targets);
 if(!check.stalled||check.reason!=='no_legal_attack')
  return {recovered:false,reason:check.reason,side};
 if(nowMs<(side.recoveryReadyAt||0))
  return {recovered:false,reason:'cooldown',side,
   remainingMs:side.recoveryReadyAt-nowMs};
 let deck=[...(side.deck||[])],discard=[...(side.discard||[])];
 if(!deck.length&&discard.length){deck=shuffled(discard,rng);discard=[];}
 if(!deck.length)return {recovered:false,reason:'no_draw_pile',side};
 const hand=[...side.hand];
 const index=Math.floor(bounded(Number(rng()))*hand.length);
 const replaced=hand[index];
 hand[index]=deck.pop();
 discard.push(replaced);
 const next={...side,hand,deck,discard,
  recoveryCount:(side.recoveryCount||0)+1,
  recoveryReadyAt:nowMs+RECOVERY_COOLDOWN_MS};
 return {recovered:true,reason:'ok',side:next,replaced:replaced.id,drawn:hand[index].id};
}
