// Integrazione dei poteri esclusivi boss nel duello LIVE, senza spari gratuiti.
// Riutilizza i calcoli ufficiali 16A/16B su colpi e combinazioni REALI.
import {
 exclusiveBossShieldFactor,rememberExclusiveBossDefenseHit,
 exclusiveBossNativeBonus,rememberExclusiveBossNativeHit,
 rememberExclusiveVenusPrecisionHit,exclusiveNeurotoxinRepairAmount,
 exclusiveNeurotoxinActive,clearExclusiveNeurotoxin,expireExclusiveNeurotoxin,
 rememberExclusiveChronoCounter,exclusiveChronoNativeBonus,rememberExclusiveChronoNativeHit,
 transferExclusiveIonicSync,exclusiveLeviatanoNativeBonus,rememberExclusiveLeviatanoNativeHit,
 prepareExclusiveBloodPact,exclusiveBloodPactNativeBonus,
 prepareExclusiveIdraRegen,rememberExclusiveIdraBarrierHit,cancelExclusiveIdraByHeart,
 exclusiveChaosNativeBonus,rememberExclusiveChaosNativeHit,
 rememberExclusiveResonanceDiscards,collectExclusiveResonanceSync,
 exclusiveMagmaNativeAdjustment,exclusiveVoidDominantSuit,
 exclusiveVoidPrecisionBonus,rememberExclusiveVoidCounter
} from './tacticalExclusiveBosses.js';
const inactive={extra:0,active:false};
export function liveBossStartTurn(side,round){
 expireExclusiveNeurotoxin(side,round-1);
 return prepareExclusiveIdraRegen(side,round);
}
export function liveBossIncomingShieldFactor(defender){
 return exclusiveBossShieldFactor(defender);
}
export function liveBossOnShieldHit(defender,damage,round){
 rememberExclusiveBossDefenseHit(defender,damage);
 rememberExclusiveIdraBarrierHit(defender,damage,round);
}
export function liveBossNativeModifiers(attacker,defender,base,round){
 if(!(base>0))return {damage:base,bonuses:[]};
 const kind=attacker.bossExclusive?.id;
 let extra=0,penalty=0;
 const bonuses=[];
 const add=(id,value)=>{if(value>0){extra+=value;bonuses.push(id);}};
 let tharsis=inactive,crono=inactive,levi=inactive,pact=inactive,chaos=inactive,
  magma=null,voidBonus=inactive;
 if(kind===2){
  tharsis=exclusiveBossNativeBonus(attacker,base);add('tharsis',tharsis.extra);
 }else if(kind===6){
  crono=exclusiveChronoNativeBonus(attacker,base,round);add('crono',crono.extra);
 }else if(kind===8){
  levi=exclusiveLeviatanoNativeBonus(attacker,base,defender.defense.shield);
  add('leviatano',levi.extra);
 }else if(kind===9){
  // Il boss AI paga sempre il costo reale soltanto se un attacco nativo
  // legittimo è pronto e rispetta cooldown, generatore e soglia HP.
  const ready=prepareExclusiveBloodPact(attacker,round,base);
  if(ready.armed){
   pact=exclusiveBloodPactNativeBonus(attacker,base,round);add('patto',pact.extra);
  }
 }else if(kind===14){
  chaos=exclusiveChaosNativeBonus(attacker,base);add('caos',chaos.extra);
 }else if(kind===19){
  magma=exclusiveMagmaNativeAdjustment(attacker,base,round);
  add('magma',magma.extra);penalty+=magma.penalty||0;
 }else if(kind===20){
  const state=attacker.bossExclusive;
  // La vecchia precisione del Sovrano non fa danni aggiuntivi al
  // vitale, che esplode alla firma corretta: prepara invece una
  // sola salva nativa reale nel ciclo dell'attacco o nel seguente.
  if(state.voidLiveArmedUntilRound>=round&&
     state.voidBlockedRound!==round){
   voidBonus={active:true,extra:Math.ceil(base*.07-1e-9),
    suit:exclusiveVoidDominantSuit(round)};
   add('vuoto',voidBonus.extra);
  }
 }
 return {damage:Math.max(1,base+Math.min(extra,Math.ceil(base*.45))-penalty),
  bonuses,tharsis,crono,levi,pact,chaos,magma,voidBonus};
}
export function liveBossAfterNativeShot(attacker,defender,round,shieldDamage,profile){
 const type=attacker.bossExclusive?.id;
 if(type===2)rememberExclusiveBossNativeHit(attacker,shieldDamage,profile.tharsis);
 if(type===6)rememberExclusiveChronoNativeHit(attacker,round,shieldDamage,profile.crono);
 if(type===7)transferExclusiveIonicSync(attacker,defender,shieldDamage);
 if(type===8)rememberExclusiveLeviatanoNativeHit(attacker,shieldDamage,profile.levi);
 if(type===14)rememberExclusiveChaosNativeHit(attacker,shieldDamage,profile.chaos);
 if(type===17)collectExclusiveResonanceSync(attacker,shieldDamage,round);
 if(type===20&&shieldDamage>0&&profile.voidBonus?.active){
  attacker.bossExclusive.voidLiveArmedUntilRound=0;
  attacker.bossExclusive.voidLiveArmedRound=0;
 }
}
export function liveBossOnCounter(defender,round){
 return rememberExclusiveChronoCounter(defender,round);
}
export function liveBossOnVitalImpact(attacker,defender,damage,cards,round){
 if(!(damage>0))return;
 rememberExclusiveVenusPrecisionHit(attacker,defender,damage,round);
 cancelExclusiveIdraByHeart(defender,damage,cards,round);
 // Dominante pubblico del Sovrano: una firma vitale riuscita con
 // il seme del ciclo arma il prossimo proiettile. Una firma del
 // giocatore sul boss con quel seme contrasta il ciclo seguente.
 const voidBonus=exclusiveVoidPrecisionBonus(attacker,cards,damage,round);
 if(voidBonus.active){
  attacker.bossExclusive.voidLiveArmedRound=round;
  attacker.bossExclusive.voidLiveArmedUntilRound=round+1;
 }
 rememberExclusiveVoidCounter(defender,damage,cards,round);
}
export function liveBossDominantSuit(side,round){
 return side?.bossExclusive?.id===20?exclusiveVoidDominantSuit(round):null;
}
export function liveBossOnNumericCardsSpent(b,key,spent,round){
 const defender=b.sides[key==='A'?'B':'A'];
 if(defender?.bossExclusive?.id===17)
  rememberExclusiveResonanceDiscards(defender,spent,round);
}
export function liveBossRepairValue(side,round,base){
 return exclusiveNeurotoxinRepairAmount(side,round,base);
}
export function liveBossClearPoisonOnHeal(side,round,healed){
 if(healed>0&&exclusiveNeurotoxinActive(side,round))clearExclusiveNeurotoxin(side,round);
}
