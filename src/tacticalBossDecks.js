// Conversione progressiva delle passive dei 12 mazzi numerici boss ufficiali.
// Non concede mazzi o livelli: l'inventario viene verificato da officialBattleSetup.
// Solo gli effetti identici alle regole precedenti vengono qui abilitati.
import {numericBossDeck,activeNumericBossAbilities} from './bossNumericDecks.js';

export const TACTICAL_READY_BOSS_DECKS=Object.freeze(['planet_char_1']);

export const tacticalBossDeckReady=id=>TACTICAL_READY_BOSS_DECKS.includes(id);

export function equipTacticalBossDeck(side,selection=null){
 if(!selection)return side;
 if(!tacticalBossDeckReady(selection.id))
  throw new Error('Passiva boss non ancora convertita al duello simultaneo');
 const deck=numericBossDeck(selection.id);
 const lv=Math.max(1,Math.min(deck.maxLevel,Math.floor(Number(selection.level)||1)));
 const ability=activeNumericBossAbilities(selection.id,lv)[0];
 if(!ability?.unlocked)throw new Error('Abilita boss non sbloccata');
 // Gaia: medesima regola del precedente motore (floor sullo scudo massimo).
 // Solo HP della barriera madre; non ritoccare vitali o scudiere.
 const shield=side.defense.shield;
 const bonus=Math.floor(shield.max*ability.value/100);
 const defense={...side.defense,shield:{hp:shield.hp+bonus,max:shield.max+bonus}};
 return {...side,defense,bossNumericDeck:{id:deck.id,level:lv,ability:ability.name,
  shieldBonus:bonus}};
}
