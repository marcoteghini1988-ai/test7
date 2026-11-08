// Carte Terreno utilizzabili solo in PvP. In altre modalita il mazzo vero
// resta invariato; per una singola battaglia si usano solo copie GIA' possedute.
import {SPECIAL_TYPES,SPECIAL_DECK_SIZE} from './specialDeckBuilder.js';
import {SPECIAL_CARD_CATALOG,specialCardMaxCopies} from './specialCards.js';
import {isPvpTerrain} from './pvpTerrainCards.js';

// Soltanto queste quattro famiglie sono effettivamente eseguibili dal
// fallback BossBattle3D. I futuri tipi speciali non diventano carte morte.
// I poteri delle carte escluse restano disponibili nel duello simultaneo.
const LEGACY_CARD_FAMILIES=Object.freeze(['fusion','defense','volley','support']);
export const legacySupportedSpecialType=type=>
 LEGACY_CARD_FAMILIES.includes(SPECIAL_CARD_CATALOG[type]?.family);

export function combatSpecialLoadout(collection,mode='campaign'){
 const original=collection?.loadout;
 if(!Array.isArray(original)||original.length!==SPECIAL_DECK_SIZE)
  throw new Error('Mazzo speciale non valido');
 if(mode==='pvp')return [...original];
 const excluded=type=>isPvpTerrain(type)||(mode==='legacy'&&!legacySupportedSpecialType(type));
 const safe=original.filter(type=>!excluded(type));
 if(safe.length===SPECIAL_DECK_SIZE)return safe;
 const counts={};
 for(const type of safe)counts[type]=(counts[type]||0)+1;
 for(const type of SPECIAL_TYPES){
  if(excluded(type))continue;
  const allowed=Math.min(Number(collection.owned?.[type]||0),specialCardMaxCopies(type));
  while(safe.length<SPECIAL_DECK_SIZE&&(counts[type]||0)<allowed){
   safe.push(type);counts[type]=(counts[type]||0)+1;
  }
 }
 if(safe.length!==SPECIAL_DECK_SIZE)
  throw new Error('Per affrontare la campagna serve un mazzo con 24 speciali possedute giocabili senza Terreno');
 return safe;
}
