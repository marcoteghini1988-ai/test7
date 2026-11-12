// Dorsi ufficiali e render delle pile numeriche per la plancia LIVE.
import {BOSS_NUMERIC_DECK_IDS,numericBossDeck} from './bossNumericDecks.js';

export const OFFICIAL_NUMERIC_BACK_IDS=Object.freeze(['neutral_starter',...BOSS_NUMERIC_DECK_IDS]);
const BACK_IDS=new Set(OFFICIAL_NUMERIC_BACK_IDS);
export const OFFICIAL_SPECIAL_FIXED_BACK='/assets/deck-backs/special_fixed.png';

function numericBackId(id){
 return BACK_IDS.has(id)?id:'neutral_starter';
}
export function officialNumericDeckBackPath(id){
 return '/assets/deck-backs/'+numericBackId(id)+'.png';
}
export function officialNumericDeckStackPath(id,assetRoot='/assets'){
 return assetRoot+'/deck-stacks/numeric/'+numericBackId(id)+'.png';
}
export function officialNumericDeckBackName(id='neutral_starter'){
 if(id==='neutral_starter'||!BACK_IDS.has(id))return 'Mazzo neutro';
 return numericBossDeck(id)?.name||'Mazzo neutro';
}
