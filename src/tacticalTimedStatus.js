// Effective combat-clock durations: the 30-second planning period does NOT
// consume Ionization/Corrosion. Combat lasts 8s per cycle; both original
// weapon durations (12s ion / 15s corrosion) remain untouched.
import {SHOT_RULES} from './strategicShots.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';

export const COMBAT_CYCLE_MS=8000;
export const tacticalCombatClock=round=>Math.max(0,(Math.max(1,Math.floor(round||1))-1)*COMBAT_CYCLE_MS);
export function tacticalStatusDuration(side,type,{ionDurationFactor=null,characterIonFactor=1}={}){
 if(!['ionized','corroded'].includes(type))return 0;
 const base=type==='ionized'?SHOT_RULES.ionizedDurationMs:SHOT_RULES.corrosionDurationMs;
 const state=side?.bossNumericDeck;
 let resistance=0;
 if(type==='ionized'&&state?.id==='planet_char_7')
  resistance=activeNumericBossAbilities(state.id,state.level)[0]?.value||0;
 if(['ionized','corroded'].includes(type)&&state?.id==='planet_char_14')
  resistance=activeNumericBossAbilities(state.id,state.level)[0]?.value||0;
 const arena=type==='ionized'&&Number.isFinite(ionDurationFactor)&&ionDurationFactor>0?
  ionDurationFactor:1;
 const character=type==='ionized'&&Number.isFinite(characterIonFactor)&&characterIonFactor>0?characterIonFactor:1;
 return Math.max(0,Math.floor(base*(100-resistance)/100*arena*character+1e-9));
}
export function tacticalStatusActive(side,type,round){
 const until=side?.statusUntil?.[type];
 // Manual legacy status snapshots without an expiry retain their old meaning.
 if(!Number.isFinite(until))return !!side?.[type];
 return until>tacticalCombatClock(round);
}
export function applyTacticalTimedStatus(side,type,round,modifiers){
 const duration=tacticalStatusDuration(side,type,modifiers);
 if(duration<=0)return {applied:false,durationMs:0,untilMs:0};
 if(!side.statusUntil)side.statusUntil={ionized:0,corroded:0};
 const until=tacticalCombatClock(round)+duration;
 side.statusUntil[type]=until;
 side[type]=until>tacticalCombatClock(round+1);
 return {applied:true,durationMs:duration,untilMs:until};
}
export function clearTacticalTimedStatuses(side){
 side.statusUntil={ionized:0,corroded:0};
 side.ionized=false;side.corroded=false;
}
