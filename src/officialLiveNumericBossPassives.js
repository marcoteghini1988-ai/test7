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
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';
// Il bonus si arma solo quando il mazzo reale non ha abbastanza carte
// da ripescare ed e' necessario recuperare lo scarto autentico.
export function liveNumericBossBeforeDraw(side){
 const pile=side?.numeric;
 if(pile?.discard?.length>0)
  rememberTacticalLeviatanoRecycle(side,pile,Math.max(0,7-pile.hand.length));
}
export function liveNumericBossShieldFactor(defender){
 return tacticalBossMotherFactor(defender);
}
export function liveNumericBossRememberShield(defender,damage){
 rememberTacticalBossMotherHit(defender,damage);
}
// I bonus percentuali che prima accrescevano un colpo di precisione
// NON possono aumentare il danno di un vitale distrutto per firma. Dopo
// una combinazione autentica si applicano al successivo proiettile nativo
// realmente sparato contro la barriera. Livelli e sblocchi 1–9 invariati.
export function liveNumericBossArmFormula(side,defender,{vitalId,op,cards,damage}={}){
 const state=side.bossNumericDeck;
 if(!state||!(damage>0)||!vitalId||!Array.isArray(cards)||
   tacticalSignatureOperation(defender?.defense?.parts?.[vitalId]?.signature,cards)!==op)
  return null;
 const abilities=activeNumericBossAbilities(state.id,state.level);
 const chosen=[];
 const add=index=>{if(abilities[index]?.unlocked)chosen.push(abilities[index]);};
 if(state.id==='planet_char_8'&&cards.length===3)add(1); // Profondità
 if(state.id==='planet_char_17'&&new Set(cards.map(c=>c.suit)).size>=2)add(1); // Frequenza
 if(state.id==='planet_char_19'&&op==='times')add(2); // Forgia
 if(state.id==='planet_char_11'){
  if(op==='divide')add(0); // Precisione criogenica
  if(state.lastVital&&state.lastVital!==vitalId)add(1); // Teste alternate
 }
 if(state.id==='planet_char_9'&&
   Object.values(side.defense.parts).filter(p=>p.hp<=0).length>=2)
  add(1); // Oscurità terminale
 if(!chosen.length)return null;
 const percentage=Math.min(30,chosen.reduce((n,a)=>n+a.value,0));
 if(!state.liveFormulaBoost||percentage>state.liveFormulaBoost.percentage)
  state.liveFormulaBoost={percentage,abilities:chosen.map(x=>x.name),vitalId};
 return state.liveFormulaBoost;
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
 const state=side.bossNumericDeck;
 const formula=state?.liveFormulaBoost;
 let formulaBonus=null;
 if(formula?.percentage>0){
  const remainder=Number.isInteger(state.liveFormulaRemainder)&&
    state.liveFormulaRemainder>=0&&state.liveFormulaRemainder<100
    ?state.liveFormulaRemainder:0;
  const points=base*formula.percentage+remainder;
  formulaBonus={active:true,percentage:formula.percentage,
   extra:Math.floor(points/100),remainder:points%100,abilities:formula.abilities};
 }
 const total=Math.min((bonus?.extra||0)+(formulaBonus?.extra||0),Math.ceil(base*.30));
 return {damage:base+total,bonus,formulaBonus};
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
export function liveNumericBossAfterShot(side,damage,weaponId,bonus,round,formulaBonus=null){
 const type=side.bossNumericDeck?.id;
 if(type==='planet_char_8')rememberTacticalLeviatanoHit(side,damage,bonus);
 if(type==='planet_char_9')rememberTacticalBossOutgoingHit(side,damage,bonus);
 if(type==='planet_char_19')rememberTacticalMagmaBarrierHit(side,damage,bonus);
 if(type==='planet_char_17')rememberTacticalResonanceNativeHit(side,weaponId,damage,bonus);
 if(type==='planet_char_20')rememberTacticalSovereignHit(side,round,damage,bonus);
 if(damage>0&&formulaBonus?.active&&side.bossNumericDeck?.liveFormulaBoost){
  side.bossNumericDeck.liveFormulaRemainder=formulaBonus.remainder;
  side.bossNumericDeck.liveFormulaBoost=null;
 }
}
export function liveNumericBossAfterVital(side,damage,destroyed,round,vitalId=null){
 if(damage>0&&vitalId&&side.bossNumericDeck?.id==='planet_char_11')
  side.bossNumericDeck.lastVital=vitalId;
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
