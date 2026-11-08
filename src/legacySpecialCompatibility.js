// Ponte a lettura per il fallback 3D storico. Quando una carta nuova non e'
// supportata, usa SOLO copie gia' possedute. Non coniare un mazzo starter
// alternativo al posto di un inventario errato o non utilizzabile.
import {readSpecialCollection,validateSpecialDeck} from './specialDeckBuilder.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {SPECIAL_DECK_SIZE,specialCardMaxCopies} from './specialCards.js';
import {isPvpTerrain} from './pvpTerrainCards.js';
import {isTacticalEpic} from './tacticalEpicCards.js';
import {isModuleCard} from './tacticalEquipmentCards.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {VULNERABILITY_RIFT_CARD_ID} from './tacticalVulnerabilityRift.js';
import {LEGACY_SPECIAL_TYPES} from './tacticalLegacyEvents.js';

export const legacyUnsupportedSpecial=type=>
 isPvpTerrain(type)||isTacticalEpic(type)||isModuleCard(type)||
 type===SIGNATURE_MUTATION_CARD_ID||type===VULNERABILITY_RIFT_CARD_ID||
 LEGACY_SPECIAL_TYPES.includes(type);

export function legacyBattleDeckFromCollection(collection){
 const check=validateSpecialDeck(collection,collection?.loadout);
 if(!check.valid)throw Error('Mazzo speciale non valido: '+check.reason+
  '. Correggilo nell’Hangar senza cancellare il salvataggio.');
 const deck=combatSpecialLoadout(collection,'legacy');
 if(deck.length!==SPECIAL_DECK_SIZE||deck.some(legacyUnsupportedSpecial))
  throw Error('Il motore compatibile non supporta alcune Carte Speciali.');
 const counts={};
 for(const type of deck){
  counts[type]=(counts[type]??0)+1;
  if(counts[type]>(collection.owned?.[type]??0)||counts[type]>specialCardMaxCopies(type))
   throw Error('Il mazzo compatibile richiede copie non possedute: '+type);
 }
 return deck;
}

export function legacyBattleDeckFromStorage(storage=globalThis.localStorage){
 return legacyBattleDeckFromCollection(readSpecialCollection(storage));
}
