// Conversione progressiva delle passive dei mazzi numerici boss ufficiali.
// Non concede mazzi o livelli: il possesso si verifica solo in officialBattleSetup.
// Le percentuali e il numero dei gradi vengono dal catalogo esistente.
import {numericBossDeck,activeNumericBossAbilities} from './bossNumericDecks.js';

export const TACTICAL_READY_BOSS_DECKS=Object.freeze(['planet_char_1','planet_char_2','planet_char_6']);
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
  lastVital:null,vitalBonusRemainder:0};
 if(selection.id==='planet_char_6'||selection.id==='planet_char_2')
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
