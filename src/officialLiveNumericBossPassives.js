// Ponte delle passive dei MAZZI NUMERICI boss al duello LIVE.
// Distinte dai 12 poteri esclusivi dei boss nemici e dalle Carte Speciali.
// Tutti i bonus richiedono vera carta, vera raffica o firma completata.
import {tacticalBossMotherFactor,rememberTacticalBossMotherHit,
 tacticalBossOutgoingBonus,rememberTacticalBossOutgoingHit,
 tacticalMagmaNativeBonus,rememberTacticalMagmaBarrierHit,
 tacticalResonanceNativeBonus,rememberTacticalResonanceNativeHit,
 tacticalSovereignSupremacyBonus,rememberTacticalSovereignHit,
 tacticalGeneratorSyncBonus,tacticalAfroditeRepairAmount
} from './tacticalBossDecks.js';
export function liveNumericBossShieldFactor(defender){
 return tacticalBossMotherFactor(defender);
}
export function liveNumericBossRememberShield(defender,damage){
 rememberTacticalBossMotherHit(defender,damage);
}
export function liveNumericBossNativeBonus(side,base,weaponId,queued,round){
 const id=side.bossNumericDeck?.id;
 if(!(base>0))return {damage:base,bonus:null};
 let bonus=null;
 if(id==='planet_char_9')bonus=tacticalBossOutgoingBonus(side,base);
 else if(id==='planet_char_19')bonus=tacticalMagmaNativeBonus(side,
  queued?.corrosion?['shot-corrosion']:[],base);
 else if(id==='planet_char_17')bonus=tacticalResonanceNativeBonus(side,weaponId,base);
 else if(id==='planet_char_20')bonus=tacticalSovereignSupremacyBonus(side,base,round);
 return {damage:base+Math.min(bonus?.extra||0,Math.ceil(base*.30)),bonus};
}
export function liveNumericBossAfterShot(side,damage,weaponId,bonus,round){
 const type=side.bossNumericDeck?.id;
 if(type==='planet_char_9')rememberTacticalBossOutgoingHit(side,damage,bonus);
 if(type==='planet_char_19')rememberTacticalMagmaBarrierHit(side,damage,bonus);
 if(type==='planet_char_17')rememberTacticalResonanceNativeHit(side,weaponId,damage,bonus);
 if(type==='planet_char_20')rememberTacticalSovereignHit(side,round,damage,bonus);
}
export function liveNumericBossAfterVital(side,damage,destroyed,round){
 if(side.bossNumericDeck?.id==='planet_char_20'&&destroyed)
  rememberTacticalSovereignHit(side,round,damage,{active:false},
   {destroyedEnemyVital:true});
}
export function liveNumericBossSyncBonus(side,earned){
 return tacticalGeneratorSyncBonus(side,earned);
}
export function liveNumericBossRepairAmount(side,base){
 return tacticalAfroditeRepairAmount(side,base);
}
