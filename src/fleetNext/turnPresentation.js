// La plancia attende la fine degli effetti visivi prima di mostrare il turno seguente.
import {FLEET_TURN_SECONDS} from './rules.js';
import {maglioResolutionMs} from '../maglioBattleVisuals.js';

export function fleetResolutionFxMs(events=[]){
 const shown=Array.isArray(events)?events:[];
 // La scoperta di una Trappola usa un'animazione di 4,2 secondi.
 const weaponMs=maglioResolutionMs(shown);
 if(shown.some(e=>e?.kind==='trap-reveal'))return Math.max(4200,weaponMs);
 // Il punto d'impatto attuale resta visibile per 1,5 secondi.
 if(shown.some(e=>e?.kind==='impact'))return Math.max(1600,weaponMs);
 // Gli effetti passivi e le carte non offensive hanno una breve risoluzione.
 return Math.max(650,weaponMs);
}

export function releaseFleetTurnAfterEffects(battle,nowMs){
 if(!battle||battle.phase!=='playing')return battle;
 // Il limite di 30s parte dopo le animazioni, non alla conferma delle carte.
 // Anche il tempo delle passive a intervalli riparte solo dal turno visibile.
 return {...battle,turnStartedAtMs:nowMs,supportSecondsProcessed:0,
  deadlineMs:nowMs+FLEET_TURN_SECONDS*1000};
}
