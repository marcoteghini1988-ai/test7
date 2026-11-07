// Conversione progressiva delle passive dei mazzi numerici boss ufficiali.
// Non concede mazzi o livelli: il possesso si verifica solo in officialBattleSetup.
// Le percentuali e il numero dei gradi vengono dal catalogo esistente.
import {numericBossDeck,activeNumericBossAbilities} from './bossNumericDecks.js';
import {tacticalSignatureMatches} from './tacticalShipSignatures.js';

export const TACTICAL_READY_BOSS_DECKS=Object.freeze(['planet_char_1','planet_char_2','planet_char_6','planet_char_9','planet_char_11']);
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
  idraBarrierRemainder:0,idraVitalRemainder:0};
 if(['planet_char_6','planet_char_2','planet_char_9','planet_char_11'].includes(selection.id))
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
export function tacticalBossMotherFactor(side){
 const state=side?.bossNumericDeck;
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
