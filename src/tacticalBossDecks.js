// Conversione progressiva delle passive dei mazzi numerici boss ufficiali.
// Non concede mazzi o livelli: il possesso si verifica solo in officialBattleSetup.
// Le percentuali e il numero dei gradi vengono dal catalogo esistente.
import {numericBossDeck,activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalSignatureMatches} from './tacticalShipSignatures.js';

export const TACTICAL_READY_BOSS_DECKS=Object.freeze(['planet_char_1','planet_char_2','planet_char_3','planet_char_6','planet_char_7','planet_char_8','planet_char_9','planet_char_11','planet_char_14','planet_char_17','planet_char_19','planet_char_20']);
export const tacticalBossDeckReady=id=>TACTICAL_READY_BOSS_DECKS.includes(id);

export function equipTacticalBossDeck(side,selection=null){
 if(!selection)return side;
 if(!tacticalBossDeckReady(selection.id))
  throw new Error('Passiva boss non ancora convertita al duello simultaneo');
 const deck=numericBossDeck(selection.id);
 const lv=Math.max(1,Math.min(deck.maxLevel,Math.floor(Number(selection.level)||1)));
 const ability=activeNumericBossAbilities(selection.id,lv)[0];
 if(!ability?.unlocked)throw new Error('Abilita boss non sbloccata');
 const state={id:deck.id,level:lv,ability:ability.name,firstHitUsed:false,shieldBonus:0,
  lastVital:null,vitalBonusRemainder:0,outgoingBonusRemainder:0,
  idraBarrierRemainder:0,idraVitalRemainder:0,
  recyclePending:false,leviatanoRemainder:0,
  magmaShieldHits:0,magmaNativeRemainder:0,magmaVitalRemainder:0,
  supremacyArmedAfterRound:0,resonanceEscortRemainder:0,
  lastFocusedWeaponId:null,resonanceNativeRemainder:0,resonanceVitalRemainder:0};
 if(['planet_char_3','planet_char_6','planet_char_2','planet_char_7','planet_char_8','planet_char_9','planet_char_11','planet_char_14','planet_char_17','planet_char_19','planet_char_20'].includes(selection.id))
  return {...side,bossNumericDeck:state};
 // Gaia: stessa regola del combattimento precedente, floor sullo scudo massimo.
 // Solo HP della barriera; non modifica vitali, scudiere o mazzi.
 const shield=side.defense.shield;
 const bonus=Math.floor(shield.max*ability.value/100);
 const defense={...side.defense,shield:{hp:shield.hp+bonus,max:shield.max+bonus}};
 return {...side,defense,bossNumericDeck:{...state,shieldBonus:bonus}};
}

// Anelli di Crono: primo danno vero alla madre -8/-12/-16%.
// Scudiere e danni nulli non consumano la protezione.
export function tacticalBossMotherFactor(side,snapshot=null){
 const state=side?.bossNumericDeck;
 if(state?.id==='planet_char_20'){
  const conditions=snapshot||tacticalBossConditionSnapshot(side);
  const abilities=activeNumericBossAbilities(state.id,state.level);
  const first=conditions.destroyedVitals===3?abilities[0]?.value||0:0;
  const second=conditions.criticalShield?abilities[1]?.value||0:0;
  return 1-Math.min(35,first+second)/100;
 }
 if(state?.id!=='planet_char_6'||state.firstHitUsed)return 1;
 const value=activeNumericBossAbilities(state.id,state.level)[0]?.value||0;
 return 1-value/100;
}
export function rememberTacticalBossMotherHit(side,damage){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_6'||state.firstHitUsed||!(damage>0))return side;
 side.bossNumericDeck={...state,firstHitUsed:true};
 return side;
}


// Tharsis — Pressione marziana: il bonus sui vitali richiede un colpo
// precedente EFFETTIVO sullo stesso sistema. La percentuale 3/5/7
// conserva il resto centesimale tra colpi, senza arrotondamenti gratuiti.
// Il cambio bersaglio resetta il resto e avvia una nuova sequenza.
export function tacticalBossVitalBonus(side,target,damage){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_2'||!target||state.lastVital!==target||
    !Number.isSafeInteger(damage)||damage<=0)
  return {active:false,extra:0,remainder:0,percentage:0};
 const percentage=activeNumericBossAbilities(state.id,state.level)[0]?.value||0;
 const remainder=Number.isInteger(state.vitalBonusRemainder)&&state.vitalBonusRemainder>=0&&
  state.vitalBonusRemainder<100?state.vitalBonusRemainder:0;
 const points=damage*percentage+remainder;
 return {active:true,extra:Math.floor(points/100),remainder:points%100,percentage};
}
export function rememberTacticalBossVitalHit(side,target,damage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_2'||!target||!(damage>0))return side;
 side.bossNumericDeck={...state,lastVital:target,
  vitalBonusRemainder:bonus?.active?bonus.remainder:0};
 return side;
}


// Ombre — Potenza disperata / Oscurità terminale. I requisiti vengono
// fotografati all'inizio di ENTRAMBE le preparazioni: il fuoco simultaneo non
// può attribuire bonus in base all'ordine interno dei colpi nello stesso ciclo.
export function tacticalBossConditionSnapshot(side){
 const shield=side?.defense?.shield;
 const parts=side?.defense?.parts;
 return {
  lowShield:!!shield&&shield.max>0&&shield.hp/shield.max<=.35,
  criticalShield:!!shield&&shield.max>0&&shield.hp/shield.max<=.25,
  destroyedVitals:parts?Object.values(parts).filter(part=>part.hp<=0).length:0
 };
}
export function tacticalBossOutgoingBonus(side,baseDamage,{vitalId=null,snapshot=null}={}){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0,abilities:[]};
 if(state?.id!=='planet_char_9'||!Number.isSafeInteger(baseDamage)||baseDamage<=0)return inactive;
 const conditions=snapshot||tacticalBossConditionSnapshot(side);
 const abilities=activeNumericBossAbilities(state.id,state.level);
 const triggered=[];
 if(conditions.lowShield&&abilities[0]?.unlocked)triggered.push(abilities[0]);
 if(vitalId&&conditions.destroyedVitals>=2&&abilities[1]?.unlocked)
  triggered.push(abilities[1]);
 if(!triggered.length)return inactive;
 const percentage=Math.min(30,triggered.reduce((sum,a)=>sum+a.value,0));
 const saved=state.outgoingBonusRemainder;
 const remainder=Number.isInteger(saved)&&saved>=0&&saved<100?saved:0;
 const points=baseDamage*percentage+remainder;
 return {active:true,percentage,extra:Math.floor(points/100),
  remainder:points%100,abilities:triggered.map(a=>a.name)};
}
export function rememberTacticalBossOutgoingHit(side,damage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_9'||!(damage>0))return side;
 side.bossNumericDeck={...state,
  outgoingBonusRemainder:bonus?.active?bonus.remainder:0};
 return side;
}


// Idra — Precisione criogenica (divisione valida) / Teste alternate
// (vitali consecutivi differenti, colpi DAVVERO efficaci).
// Usa la stessa firma pubblica che il motore applica al colpo e non legge
// mani segrete avversarie. Due accumulatori tengono distinti i danni alla
// barriera dalle formule dirette ai vitali.
export function tacticalIdraBonus(side,enemy,order,baseDamage,{vitalId=null}={}){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0,abilities:[]};
 if(state?.id!=='planet_char_11'||!Number.isSafeInteger(baseDamage)||baseDamage<=0)return inactive;
 const abilities=activeNumericBossAbilities(state.id,state.level);
 const indices=order?.numericIndices;
 const part=enemy?.defense?.parts?.[order?.vitalId];
 const selected=Array.isArray(indices)&&[2,3].includes(indices.length)&&
   new Set(indices).size===indices.length
   ?indices.map(i=>side?.numeric?.hand?.[i]):[];
 const validFormula=!!part&&part.hp>0&&selected.length>=2&&
  selected.every(Boolean)&&tacticalSignatureMatches(part.signature,order.op,selected);
 const triggered=[];
 if(validFormula&&order.op==='divide'&&abilities[0]?.unlocked)
  triggered.push(abilities[0]);
 if(vitalId&&validFormula&&state.lastVital&&state.lastVital!==vitalId&&
    abilities[1]?.unlocked)triggered.push(abilities[1]);
 if(!triggered.length)return inactive;
 const percentage=Math.min(30,triggered.reduce((sum,a)=>sum+a.value,0));
 const key=vitalId?'idraVitalRemainder':'idraBarrierRemainder';
 const prior=state[key];
 const remainder=Number.isInteger(prior)&&prior>=0&&prior<100?prior:0;
 const points=baseDamage*percentage+remainder;
 return {active:true,percentage,extra:Math.floor(points/100),remainder:points%100,
  abilities:triggered.map(a=>a.name)};
}
export function rememberTacticalIdraHit(side,damage,bonus,{vitalId=null}={}){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_11'||!(damage>0))return side;
 const key=vitalId?'idraVitalRemainder':'idraBarrierRemainder';
 // La raffica nativa continua anche senza una divisione valida; in quel
 // caso non consuma il resto accumulato da un precedente bonus di Idra.
 const update=bonus?.active?{[key]:bonus.remainder}:{};
 side.bossNumericDeck={...state,...update,lastVital:vitalId||state.lastVital};
 return side;
}


// Leviatano — Marea del riciclo / Profondità tattica.
// Il riciclo esiste solo quando le carte numeriche esauriscono il
// mazzo fisico e lo scarto è DAVVERO rimescolato. Un semplice scarto
// o una carta speciale non attivano la passiva.
export function rememberTacticalLeviatanoRecycle(side,pile,spentCount=0){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_8')return side;
 const count=Number(spentCount)||0;
 if(count>0&&pile?.deck?.length<count&&
  (pile?.discard?.length||0)+count>0)
  side.bossNumericDeck={...state,recyclePending:true};
 return side;
}
export function tacticalLeviatanoBonus(side,enemy,order,baseDamage){
 const state=side?.bossNumericDeck;
 const inactive={active:false,extra:0,remainder:0,percentage:0,abilities:[]};
 if(state?.id!=='planet_char_8'||!Number.isSafeInteger(baseDamage)||baseDamage<=0)return inactive;
 const indices=order?.numericIndices;
 const target=enemy?.defense?.parts?.[order?.vitalId];
 if(!Array.isArray(indices)||![2,3].includes(indices.length)||
    new Set(indices).size!==indices.length||!target||target.hp<=0)return inactive;
 const cards=indices.map(i=>side?.numeric?.hand?.[i]);
 if(cards.some(card=>!card)||
    !tacticalSignatureMatches(target.signature,order.op,cards))return inactive;
 const abilities=activeNumericBossAbilities(state.id,state.level);
 const selected=[];
 if(state.recyclePending&&abilities[0]?.unlocked)selected.push(abilities[0]);
 if(cards.length===3&&abilities[1]?.unlocked)selected.push(abilities[1]);
 if(!selected.length)return inactive;
 const percentage=Math.min(30,selected.reduce((sum,a)=>sum+a.value,0));
 const prev=state.leviatanoRemainder;
 const remainder=Number.isInteger(prev)&&prev>=0&&prev<100?prev:0;
 const points=baseDamage*percentage+remainder;
 return {active:true,percentage,extra:Math.floor(points/100),
  remainder:points%100,abilities:selected.map(a=>a.name),
  spendsRecycle:!!state.recyclePending};
}
export function rememberTacticalLeviatanoHit(side,damage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_8'||!(damage>0)||!bonus?.active)return side;
 side.bossNumericDeck={...state,leviatanoRemainder:bonus.remainder,
  recyclePending:bonus.spendsRecycle?false:state.recyclePending};
 return side;
}


// Nucleo Magmatico numeric deck — three independently graded passive
// abilities. This is NOT the planet-19 enemy's Magma cycle.
// Risonanza termica: bonus only on the 3rd REAL shield hit (counts 1,2,3).
// Corrosione ardente: real Corrosione card actually committed this round.
// Forgia moltiplicatrice: VALID times signature on an exposed enemy vital.
// Neither fake native guns nor mathematical hits outside real signatures.
export function tacticalMagmaNativeBonus(side,playedTypes,base){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0,abilities:[]};
 if(state?.id!=='planet_char_19'||!Number.isSafeInteger(base)||base<=0)
  return inactive;
 const abilities=activeNumericBossAbilities(state.id,state.level);
 const triggered=[];
 if(state.magmaShieldHits%3===2&&abilities[0]?.unlocked)triggered.push(abilities[0]);
 if(Array.isArray(playedTypes)&&playedTypes.includes('shot-corrosion')&&abilities[1]?.unlocked)
  triggered.push(abilities[1]);
 if(!triggered.length)return inactive;
 const percentage=Math.min(30,triggered.reduce((n,a)=>n+a.value,0));
 const prior=Number.isSafeInteger(state.magmaNativeRemainder)?state.magmaNativeRemainder:0;
 const points=base*percentage+prior;
 return {active:true,percentage,extra:Math.floor(points/100),remainder:points%100,
  abilities:triggered.map(a=>a.name)};
}
export function rememberTacticalMagmaBarrierHit(side,barrierDamage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_19'||!(barrierDamage>0))return side;
 side.bossNumericDeck={...state,magmaShieldHits:(state.magmaShieldHits||0)+1,
  magmaNativeRemainder:bonus?.active?bonus.remainder:state.magmaNativeRemainder};
 return side;
}
export function tacticalMagmaVitalBonus(side,order,defender,base){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0,abilities:[]};
 if(state?.id!=='planet_char_19'||order?.op!=='times'||
    !Number.isSafeInteger(base)||base<=0)return inactive;
 const ability=activeNumericBossAbilities(state.id,state.level)[2];
 if(!ability?.unlocked)return inactive;
 const part=defender?.defense?.parts?.[order.vitalId];
 const indices=order.numericIndices||[];
 if(!part||part.hp<=0||!part.exposed||
    ![2,3].includes(indices.length)||new Set(indices).size!==indices.length)return inactive;
 const cards=indices.map(i=>side.numeric?.hand?.[i]);
 if(cards.some(c=>!c)||!tacticalSignatureMatches(part.signature,order.op,cards))
  return inactive;
 const remainder=Number.isSafeInteger(state.magmaVitalRemainder)?state.magmaVitalRemainder:0;
 const points=base*ability.value+remainder;
 return {active:true,percentage:ability.value,extra:Math.floor(points/100),
  remainder:points%100,abilities:[ability.name]};
}
export function rememberTacticalMagmaVitalHit(side,damage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_19'||!(damage>0)||!bonus?.active)return side;
 side.bossNumericDeck={...state,magmaVitalRemainder:bonus.remainder};
 return side;
}


// Sovrano NUMERIC deck, not the Encelado exclusive dominant-suit ability.
// Ultimo presidio: 3 OWN destroyed vitals, exactly one remaining;
// Vuoto difensivo: <=25% mother barrier at cycle start (when available).
// Both share a bounded defensive factor, already in tacticalBossMotherFactor.
// Supremazia: after a REAL KO of an enemy vital, the NEXT effective attack
// (native barrier or valid precision) gains +4/+6/+8% and consumes the
// charge only if it deals actual damage. It does NOT activate in the same cycle.
export function tacticalSovereignSupremacyBonus(side,base,round){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0};
 if(state?.id!=='planet_char_20'||!Number.isSafeInteger(round)||
   !Number.isSafeInteger(base)||base<=0)return inactive;
 const a=activeNumericBossAbilities(state.id,state.level)[2];
 if(!a?.unlocked||!(state.supremacyArmedAfterRound>0)||
   round<=state.supremacyArmedAfterRound)return inactive;
 return {active:true,percentage:a.value,extra:Math.ceil(base*a.value/100-1e-9)};
}
export function rememberTacticalSovereignHit(side,round,damage,bonus,{destroyedEnemyVital=false}={}){
 const state=side?.bossNumericDeck;
 const inactive={consumed:false,armed:false};
 if(state?.id!=='planet_char_20'||!(damage>0)||!Number.isSafeInteger(round))
  return inactive;
 const consumed=!!bonus?.active;
 let armedAt=consumed?0:state.supremacyArmedAfterRound||0;
 if(destroyedEnemyVital)armedAt=round;
 side.bossNumericDeck={...state,supremacyArmedAfterRound:armedAt};
 return {consumed,armed:!!destroyedEnemyVital};
}


// Generatore (14) has timed resistance plus energy accumulation; Risonanza
// (17) uses real escort ammunition and three graded passive abilities.
//
// Generatore / Accumulo energetico: extra sync can only follow a true
// positive end-of-cycle earned amount; cap of the authentic 100 sync.
export function tacticalGeneratorSyncBonus(side,earned){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_14'||!Number.isSafeInteger(earned)||earned<=0)
  return 0;
 const ability=activeNumericBossAbilities(state.id,state.level)[1];
 if(!ability?.unlocked)return 0;
 return Math.floor(earned*ability.value/100+1e-9);
}

// Risonanza / Armi armoniche: the REAL selected weapon focus must change
// from a previous focus that actually damaged the enemy barrier.
// This does NOT fabricate offensive shots from the defensive escorts.
export function tacticalResonanceNativeBonus(side,focusedWeaponId,base){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0};
 if(state?.id!=='planet_char_17'||!Number.isSafeInteger(base)||base<=0||
   !focusedWeaponId||!side.weapons?.some(w=>w.id===focusedWeaponId)||
   !state.lastFocusedWeaponId||state.lastFocusedWeaponId===focusedWeaponId)
  return inactive;
 const ability=activeNumericBossAbilities(state.id,state.level)[0];
 if(!ability?.unlocked)return inactive;
 const old=Number.isSafeInteger(state.resonanceNativeRemainder)?
  state.resonanceNativeRemainder:0;
 const points=base*ability.value+old;
 return {active:true,percentage:ability.value,extra:Math.floor(points/100),
  remainder:points%100};
}
export function rememberTacticalResonanceNativeHit(side,focus,damage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_17'||!(damage>0)||
   !side.weapons?.some(w=>w.id===focus))return side;
 side.bossNumericDeck={...state,lastFocusedWeaponId:focus,
  resonanceNativeRemainder:bonus?.active?bonus.remainder:state.resonanceNativeRemainder};
 return side;
}
// Risonanza / Frequenza multipla: a VALID precision signature including
// at least two different real suits (not merely an arbitrary hand display).
export function tacticalResonanceVitalBonus(side,defender,order,base){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0};
 if(state?.id!=='planet_char_17'||!Number.isSafeInteger(base)||base<=0)
  return inactive;
 const ability=activeNumericBossAbilities(state.id,state.level)[1];
 if(!ability?.unlocked)return inactive;
 const part=defender?.defense?.parts?.[order?.vitalId],indices=order?.numericIndices;
 if(!part||part.hp<=0||!part.exposed||!Array.isArray(indices)||
   ![2,3].includes(indices.length)||new Set(indices).size!==indices.length)
  return inactive;
 const cards=indices.map(i=>side.numeric?.hand?.[i]);
 if(cards.some(c=>!c)||new Set(cards.map(c=>c.suit)).size<2||
   !tacticalSignatureMatches(part.signature,order.op,cards))return inactive;
 const old=Number.isSafeInteger(state.resonanceVitalRemainder)?state.resonanceVitalRemainder:0;
 const points=base*ability.value+old;
 return {active:true,percentage:ability.value,extra:Math.floor(points/100),
  remainder:points%100};
}
export function rememberTacticalResonanceVitalHit(side,damage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_17'||!(damage>0)||!bonus?.active)return side;
 side.bossNumericDeck={...state,resonanceVitalRemainder:bonus.remainder};
 return side;
}


// Afrodite / Sintesi curativa (PARTIAL conversion): enhances ONLY an
// authentic support-shield-repair card. The other passive Ricambio armonico
// requires real-time numeric-recycle cooldown and is NOT converted: the deck
// remains gated until both abilities exist in the 30+8 official system.
export function tacticalAfroditeRepairAmount(side,base){
 const amount=Number.isSafeInteger(base)&&base>0?base:0;
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_3'||amount<=0)return amount;
 const ability=activeNumericBossAbilities(state.id,state.level)[1];
 if(!ability?.unlocked)return amount;
 return Math.floor(amount*(100+ability.value)/100+1e-9);
}


// Afrodite — Ricambio armonico: authentic numeric cards may be replaced
// DURING the 30-second planning phase. Cooldown is wall-clock seconds and is
// enforced by the deterministic duel engine, never by the UI alone.
// L1-3: 13s; L4-5: 11s; L6: 9s. No cards are created.
export function tacticalAfroditeRecycleCooldownMs(side){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_3')return null;
 const ability=activeNumericBossAbilities(state.id,state.level)[0];
 return ability?.unlocked?ability.value*1000:null;
}


// Risonanza / Sinfonia di flotta (third ability, L7-L9): the mother
// MUST actually damage the enemy barrier and a separate, ammo-loaded
// escort MUST fire an effective shot during the SAME cycle.
// Bonus applies only to that escort's real packet, not to invented extra
// bullets or the unaltered mother shot. Percent fractional carry persists.
export function tacticalResonanceCooperationBonus(side,escortPacket,motherDamage){
 const state=side?.bossNumericDeck;
 const inactive={active:false,percentage:0,extra:0,remainder:0};
 if(state?.id!=='planet_char_17'||!(motherDamage>0)||
    !Number.isSafeInteger(escortPacket)||escortPacket<=0)return inactive;
 const ability=activeNumericBossAbilities(state.id,state.level)[2];
 if(!ability?.unlocked)return inactive;
 const old=Number.isSafeInteger(state.resonanceEscortRemainder)?
  state.resonanceEscortRemainder:0;
 const points=escortPacket*ability.value+old;
 return {active:true,percentage:ability.value,
  extra:Math.floor(points/100),remainder:points%100};
}
export function rememberTacticalResonanceCooperationHit(side,actualDamage,bonus){
 const state=side?.bossNumericDeck;
 if(state?.id!=='planet_char_17'||!(actualDamage>0)||!bonus?.active)return side;
 side.bossNumericDeck={...state,resonanceEscortRemainder:bonus.remainder};
 return side;
}
