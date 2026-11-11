// Dorsi PNG canonici: non aggiunge mazzi, carte, abilita' o sblocchi.
// Il motore LIVE conserva 52 numeriche e 24 speciali autentiche.
import {BOSS_NUMERIC_DECK_IDS,numericBossDeck} from './bossNumericDecks.js';

export const OFFICIAL_NUMERIC_BACK_IDS=Object.freeze(['neutral_starter',...BOSS_NUMERIC_DECK_IDS]);
const BACK_IDS=new Set(OFFICIAL_NUMERIC_BACK_IDS);
export const OFFICIAL_SPECIAL_FIXED_BACK='/assets/deck-backs/special_fixed.png';

export function officialNumericDeckBackPath(id='neutral_starter'){
 return '/assets/deck-backs/'+(BACK_IDS.has(id)?id:'neutral_starter')+'.png';
}
export function officialNumericDeckBackName(id='neutral_starter'){
 if(id==='neutral_starter'||!BACK_IDS.has(id))return 'Mazzo neutro';
 return numericBossDeck(id)?.name||'Mazzo neutro';
}
