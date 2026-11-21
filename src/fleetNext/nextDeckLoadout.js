// Eclissi Stellare — selezione delle nuove carte generiche del mazzo da 40.
// Non riattiva mai le vecchie carte ritirate o il mazzo storico archiviato.
// La selezione è conservata separatamente dall'inventario schema 4.
import {card,cardCopyLimit,eligibleExclusives} from './rules.js';
import {NEXT_COMMON_CARD_BY_ID,NEXT_COMMON_CARDS} from './newCardRegistry.js';
import {DISMANTLE_BY_ID,DISMANTLE_CARDS} from './dismantleCards.js';
import {ENERGY_CARDS,ENERGY_CARD_BY_ID,energyIdForRarity} from './energyCards.js';
import {evolveCardByRarityWithDuplicates} from './rarityDuplicateEvolution.js';
import {FUSION_SHIP_CARDS,FUSION_SHIP_CARD_BY_ID} from './fusionShipCards.js';
import {FUSION_DENIAL_TRAPS,FUSION_DENIAL_TRAP_BY_ID} from './fusionDenialTrap.js';
import {DISCARD_WEAPONS,DISCARD_WEAPON_BY_ID} from './discardWeapon.js';
import {TEMP_SUPPORT_WEAPONS,TEMP_SUPPORT_WEAPON_BY_ID} from './temporarySupportWeapons.js';
import {APPROVED_BASE_WEAPONS,APPROVED_BASE_WEAPON_BY_ID} from './approvedBaseWeapons.js';
import {CONFIRMED_WEAPON_CARDS,CONFIRMED_WEAPON_BY_ID} from './confirmedWeaponCards.js';
import {MULTI_WEAPON_CARDS,MULTI_WEAPON_BY_ID} from './multiWeaponCards.js';
import {DESIGNED_WEAPON_CARDS,DESIGNED_WEAPON_BY_ID} from './designedWeaponCards.js';
import {CONFIRMED_TRANSFER_WEAPONS,CONFIRMED_TRANSFER_WEAPON_BY_ID} from './confirmedTransferredWeapons.js';
import {ALL_WEAPON_CARDS,ALL_WEAPON_BY_ID,WEAPON_BASE_CARDS,EVOLVED_WEAPON_CARDS,
 weaponNextEvolution} from './weaponRarityEvolutions.js';
import {SIPHON_ATTACKS,SIPHON_ATTACK_BY_ID} from './siphonAttacks.js';
import {ELEMENTAL_TERRAIN_CARDS,ELEMENTAL_TERRAIN_BY_ID,terrainNextRarity} from './elementalTerrainCards.js';

export const NEXT_DECK_LIMIT=40;
// Nessuna arma di prova equipaggiabile.
export const NEXT_TEMP_WEAPON_IDS=Object.freeze([]);
export const NEXT_NEW_WEAPON_CARDS=Object.freeze([...APPROVED_BASE_WEAPONS,
 ...CONFIRMED_WEAPON_CARDS,...MULTI_WEAPON_CARDS,...DESIGNED_WEAPON_CARDS,
 ...CONFIRMED_TRANSFER_WEAPONS]);
export const NEXT_WEAPON_COLLECTION_CARDS=ALL_WEAPON_CARDS;
// L'array storico resta di 69 carte per compatibilita' con i salvataggi.
// Il registro acquistabile comprende 73 originali e 162 evoluzioni.
export const NEXT_NEW_WEAPON_BY_ID=ALL_WEAPON_BY_ID;
export const MAX_WEAPON_INVENTORY_COPIES=12; // distinti dal limite di copie nel mazzo
if(NEXT_NEW_WEAPON_CARDS.length!==69||WEAPON_BASE_CARDS.length!==73||
 EVOLVED_WEAPON_CARDS.length!==162||Object.keys(NEXT_NEW_WEAPON_BY_ID).length!==235)
 throw Error('Progressione delle Carte Arma non disponibile');
export const NEXT_DECK_STORAGE_KEY='eclissi_next_cards_40_v1';
export const NEXT_CARD_COSTS=Object.freeze({
 Comune:50,Rara:110,Epica:220,Leggendaria:440
}); // Prezzi provvisori: bilanciamento finale dopo le meccaniche.

export function nextExclusiveCount(shipId,level){
 return eligibleExclusives(shipId,level).filter(c=>c.playable!==false&&
  !c.id.startsWith('prog-fusion-'))
  .reduce((n,c)=>n+(c.maxCopiesInAutoPackageDraft||1),0);
}
export function nextGenericCapacity(shipId,level){
 return Math.max(0,NEXT_DECK_LIMIT-nextExclusiveCount(shipId,level));
}
export function readNextDeckSelection(storage=globalThis.localStorage){
 try {
  const raw=storage?.getItem(NEXT_DECK_STORAGE_KEY);
  if(raw==null)return null; // non ancora configurato: usa le carte possedute
  const value=JSON.parse(raw);
  if(!Array.isArray(value)||value.length>NEXT_DECK_LIMIT||
   value.some(id=>typeof id!=='string'||id.length>120))return null;
  return value;
 } catch{return null;}
}
export function canSelectNewGeneric(id){
 const def=card(id);
 return !!def&&!def.shipId&&def.playable!==false&&
  ((Object.hasOwn(NEXT_COMMON_CARD_BY_ID,id)||Object.hasOwn(DISMANTLE_BY_ID,id)||
  Object.hasOwn(ENERGY_CARD_BY_ID,id)||Object.hasOwn(FUSION_SHIP_CARD_BY_ID,id)||
   Object.hasOwn(FUSION_DENIAL_TRAP_BY_ID,id)||Object.hasOwn(DISCARD_WEAPON_BY_ID,id)||
   Object.hasOwn(TEMP_SUPPORT_WEAPON_BY_ID,id)||Object.hasOwn(NEXT_NEW_WEAPON_BY_ID,id)||Object.hasOwn(APPROVED_BASE_WEAPON_BY_ID,id)||Object.hasOwn(CONFIRMED_WEAPON_BY_ID,id)||Object.hasOwn(MULTI_WEAPON_BY_ID,id)||Object.hasOwn(DESIGNED_WEAPON_BY_ID,id)||Object.hasOwn(CONFIRMED_TRANSFER_WEAPON_BY_ID,id)||Object.hasOwn(SIPHON_ATTACK_BY_ID,id)||
   Object.hasOwn(ELEMENTAL_TERRAIN_BY_ID,id))||
  NEXT_TEMP_WEAPON_IDS.includes(id)||def.kind==='character');
}
export function buildNextBaseDeck(inventory,shipId,level,selection=null){
 const owned=inventory?.owned||{},capacity=nextGenericCapacity(shipId,level);
 const raw=Array.isArray(selection)?selection:
  Object.entries(owned).flatMap(([id,n])=>Array(Math.min(Math.max(0,n|0),cardCopyLimit(id))).fill(id));
 const baseDeck=[],used={},discarded=[];
 for(const id of raw){
  const limit=cardCopyLimit(id);
  if(!canSelectNewGeneric(id)||!(owned[id]>0)||baseDeck.length>=capacity||
   (used[id]||0)>=Math.min(limit,owned[id])){
   discarded.push(id);continue;
  }
  used[id]=(used[id]||0)+1;
  baseDeck.push(id);
 }
 return {baseDeck,capacity,exclusiveCount:nextExclusiveCount(shipId,level),
  total:baseDeck.length+nextExclusiveCount(shipId,level),
  complete:baseDeck.length===capacity,discarded};
}
export function validateNextDeckSelection(inventory,shipId,level,ids){
 if(!Array.isArray(ids)||ids.length>NEXT_DECK_LIMIT)return 'Mazzo non valido';
 const result=buildNextBaseDeck(inventory,shipId,level,ids);
 if(result.discarded.length)return 'Carta non posseduta, oltre il limite di copie o di posti disponibili';
 return '';
}
export function saveNextDeckSelection(inventory,shipId,level,ids,storage=globalThis.localStorage){
 const error=validateNextDeckSelection(inventory,shipId,level,ids);
 if(error)return {ok:false,reason:error};
 try {
  storage.setItem(NEXT_DECK_STORAGE_KEY,JSON.stringify(ids));
  return {ok:true,deck:[...ids]};
 }catch(e){return {ok:false,reason:e?.message||'Impossibile salvare il mazzo'};}
}
export function buyNextCommonCard(inventory,id){
 const def=NEXT_COMMON_CARD_BY_ID[id]||DISMANTLE_BY_ID[id]||ENERGY_CARD_BY_ID[id]||FUSION_SHIP_CARD_BY_ID[id]||NEXT_NEW_WEAPON_BY_ID[id];
 if(!def)return {ok:false,reason:'Carta non acquistabile'};
 // La disponibilità nello Shop delle Energie superiori è ancora da decidere.
 if(ENERGY_CARD_BY_ID[id]&&def.rarita!=='Comune')
  return {ok:false,reason:'Acquisizione della rarità Energia da definire nello Shop'};
 const cost=NEXT_CARD_COSTS[def.rarita];
 if(!Number.isInteger(cost))return {ok:false,reason:'Prezzo non valido'};
 const owned=Math.max(0,Math.floor(inventory?.owned?.[id]||0));
 if(owned>=(ALL_WEAPON_BY_ID[id]?MAX_WEAPON_INVENTORY_COPIES:cardCopyLimit(id)))
  return {ok:false,reason:'Limite massimo di copie già possedute'};
 if((inventory?.credits||0)<cost)return {ok:false,reason:'Crediti insufficienti'};
 const next={...inventory,owned:{...inventory.owned,[id]:owned+1},
  credits:inventory.credits-cost};
 return {ok:true,inventory:next,cost,copies:owned+1};
}
// Prezzi rimandati alla progettazione dello Shop: nessun costo inventato.
export const TERRAIN_EVOLUTION_COSTS=Object.freeze({Rara:null,Epica:null,Leggendaria:null});
// Stesso sistema delle navicelle: 3 copie identiche alla stessa rarità,
// 2 consumate, la copia originale preservata e 1 nuova copia superiore.
export function evolveNextTerrainWithDuplicates(inventory,id){
 const terrain=ELEMENTAL_TERRAIN_BY_ID[id];
 if(!terrain)return {ok:false,reason:'Terreno inesistente'};
 return evolveCardByRarityWithDuplicates(inventory,terrain,next=>
  ELEMENTAL_TERRAIN_CARDS.find(c=>c.elementId===terrain.elementId&&
   c.variant===terrain.variant&&c.rarita===next));
}
// Una Energia può nascere Comune oppure essere ottenuta direttamente di
// rarità superiore in futuro. L'evoluzione conserva una copia del grado base.
// Nessun costo in Crediti finché non viene definita l'economia dello Shop.
export function evolveNextEnergyWithDuplicates(inventory,id){
 const energy=ENERGY_CARD_BY_ID[id];
 if(!energy)return {ok:false,reason:'Carta Energia inesistente'};
 return evolveCardByRarityWithDuplicates(inventory,energy,next=>
  ENERGY_CARD_BY_ID[energyIdForRarity(energy.elementId,next)]);
}
export function evolveNextWeaponWithDuplicates(inventory,id){
 const source=ALL_WEAPON_BY_ID[id];
 if(!source)return {ok:false,reason:'Carta Arma inesistente'};
 return evolveCardByRarityWithDuplicates(inventory,source,next=>{
  const destination=weaponNextEvolution(source.id);
  return destination?.rarita===next?destination:null;
 });
}

export const NEXT_COMMON_AVAILABLE=Object.freeze([...NEXT_COMMON_CARDS,...DISMANTLE_CARDS,
 ...ENERGY_CARDS,...FUSION_SHIP_CARDS,...FUSION_DENIAL_TRAPS,
 ...ALL_WEAPON_CARDS,...SIPHON_ATTACKS,...ELEMENTAL_TERRAIN_CARDS]);
