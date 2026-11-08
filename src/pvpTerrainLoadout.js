// Carte Terreno utilizzabili solo in PvP. In altre modalita il mazzo vero
// resta invariato; per una singola battaglia si usano solo copie GIA' possedute.
import {SPECIAL_TYPES,SPECIAL_DECK_SIZE} from './specialDeckBuilder.js';
import {specialCardMaxCopies} from './specialCards.js';
import {isPvpTerrain} from './pvpTerrainCards.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {isTacticalEpic} from './tacticalEpicCards.js';
import {LEGACY_SPECIAL_TYPES} from './tacticalLegacyEvents.js';

export function combatSpecialLoadout(collection,mode='campaign'){
 const original=collection?.loadout;
 if(!Array.isArray(original)||original.length!==SPECIAL_DECK_SIZE)
  throw new Error('Mazzo speciale non valido');
 if(mode==='pvp')return [...original];
 const excluded=type=>isPvpTerrain(type)||(mode==='legacy'&&
  (type===SIGNATURE_MUTATION_CARD_ID||isTacticalEpic(type)||LEGACY_SPECIAL_TYPES.includes(type)));
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
