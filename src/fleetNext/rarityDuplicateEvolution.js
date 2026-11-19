// Regola riutilizzabile per tutte le carte con un percorso di rarità.
// Non applicarla a carte con rarità fissa e nessuna evoluzione approvata.
// Tre copie fisiche identiche dello STESSO modello e rarità:
// due consumate, una copia originale conservata, una nuova della rarità superiore.
import {RARITY_DUPLICATE_COPIES,nextShipRarity} from './shipRarity.js';

export const CARD_RARITY_EVOLUTION_RULE=Object.freeze({
 requiredCopies:RARITY_DUPLICATE_COPIES,
 consumedCopies:RARITY_DUPLICATE_COPIES-1,
 keepsOneOriginal:true,
 grantsNextRarityCopy:true,
 creditsCost:null,
 directAcquisitionOfHigherRarityPossible:true
});
export function evolveCardByRarityWithDuplicates(inventory,source,findDestination){
 if(!source||typeof findDestination!=='function')
  return {ok:false,reason:'Carta non evolvibile'};
 const rarity=source.rarita||source.rarity;
 const next=nextShipRarity(rarity);
 if(!next)return {ok:false,reason:'Carta già Leggendaria o rarità non valida'};
 const copies=inventory?.owned?.[source.id]||0;
 if(!Number.isInteger(copies)||copies<CARD_RARITY_EVOLUTION_RULE.requiredCopies)
  return {ok:false,reason:'Servono tre copie identiche della stessa carta e rarità'};
 const destination=findDestination(next);
 if(!destination||destination.id===source.id)
  return {ok:false,reason:'Evoluzione di rarità non prevista per questa carta'};
 return {ok:true,cost:null,sourceId:source.id,destinationId:destination.id,
  inventory:{...inventory,
   owned:{...inventory.owned,[source.id]:copies-CARD_RARITY_EVOLUTION_RULE.consumedCopies,
    [destination.id]:(inventory.owned[destination.id]||0)+1}}};
}
