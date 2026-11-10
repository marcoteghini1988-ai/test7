// Ponte delle passive dei MAZZI NUMERICI boss al duello LIVE.
// Distinte dai 12 poteri esclusivi dei boss nemici e dalle Carte Speciali.
// Tutti i bonus richiedono vera carta, vera raffica o firma completata.
import {tacticalBossMotherFactor,rememberTacticalBossMotherHit,
 tacticalBossOutgoingBonus,rememberTacticalBossOutgoingHit,
 tacticalMagmaNativeBonus,rememberTacticalMagmaBarrierHit,
 tacticalResonanceNativeBonus,rememberTacticalResonanceNativeHit,
 tacticalSovereignSupremacyBonus,rememberTacticalSovereignHit,
 tacticalGeneratorSyncBonus,tacticalAfroditeRepairAmount,
 tacticalResonanceCooperationBonus,rememberTacticalResonanceCooperationHit,
 rememberTacticalLeviatanoRecycle,rememberTacticalLeviatanoHit
} from './tacticalBossDecks.js';
import {activeNumericBossAbilities} from './bossNumericDecks.js';
// Il bonus si arma solo quando il mazzo reale non ha abbastanza carte
// da ripescare ed e' necessario recuperare lo scarto autentico.
export function liveNumericBossBeforeDraw(side){
 const pile=side.numeric;
 rememberTacticalLeviatanoRecycle(side,pile,Math.max(0,7-pile.hand.length));
}
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
 if(id==='planet_char_8'&&side.bossNumericDeck?.recyclePending){
  const state=side.bossNumericDeck;
  const ability=activeNumericBossAbilities(state.id,state.level)[0];
  if(ability?.unlocked){
   const remainder=Number.isInteger(state.leviatanoRemainder)?state.leviatanoRemainder:0;
   const points=base*ability.value+remainder;
   bonus={active:true,extra:Math.floor(points/100),remainder:points%100,
    percentage:ability.value,spendsRecycle:true};
  }
 }
 else if(id==='planet_char_9')bonus=tacticalBossOutgoingBonus(side,base);
 else if(id==='planet_char_19')bonus=tacticalMagmaNativeBonus(side,
  queued?.corrosion?['shot-corrosion']:[],base);
 else if(id==='planet_char_17')bonus=tacticalResonanceNativeBonus(side,weaponId,base);
 else if(id==='planet_char_20')bonus=tacticalSovereignSupremacyBonus(side,base,round);
 return {damage:base+Math.min(bonus?.extra||0,Math.ceil(base*.30)),bonus};
}
// Sinfonia di flotta L7–L9: il secondo colpo deve essere una VERA salva
// della scudiera nello stesso ciclo di un impatto efficace della madre.
export function liveNumericBossEscortCooperation(side,packet,round){
 const bonus=tacticalResonanceCooperationBonus(side,packet,
  side.liveMotherHitRound===round?1:0);
 return {damage:packet+Math.min(bonus.extra||0,Math.ceil(packet*.30)),bonus};
}
export function liveNumericBossRememberEscortCooperation(side,damage,bonus){
 rememberTacticalResonanceCooperationHit(side,damage,bonus);
}
export function liveNumericBossAfterShot(side,damage,weaponId,bonus,round){
 const type=side.bossNumericDeck?.id;
 if(type==='planet_char_8')rememberTacticalLeviatanoHit(side,damage,bonus);
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
