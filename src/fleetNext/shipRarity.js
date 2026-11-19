// Progressione ufficiale: nessun livello numerico per le carte navicella.
// I vecchi livelli restano SOLO una proiezione tecnica per il motore legacy.
import {shipMaxLevel} from './progression.js';
import {scaledMotherStats} from './motherBalance.js';
export {LEGENDARY_MOTHER_PROFILES,MOTHER_BALANCE_LIMITS,motherBaselinePotential} from './motherBalance.js';
export const SHIP_RARITIES=Object.freeze(['Comune','Rara','Epica','Leggendaria']);
export const RARITY_SECTOR_UNLOCKS=Object.freeze({Comune:1,Rara:25,Epica:55,Leggendaria:85});
export const RARITY_SHOP_PRICES=Object.freeze({
 mother:Object.freeze({Comune:240,Rara:560,Epica:1140,Leggendaria:2350}),
 support:Object.freeze({Comune:240,Rara:460,Epica:900,Leggendaria:1800})
});
export const RARITY_EVOLUTION_COSTS=Object.freeze({
 mother:Object.freeze({Rara:210,Epica:490,Leggendaria:990}),
 support:Object.freeze({Rara:150,Epica:350,Leggendaria:750})
});
export const RARITY_DUPLICATE_COPIES=3; // una copia rimane, due sono materiali
export const isShipRarity=rarity=>SHIP_RARITIES.includes(rarity);
export const rarityIndex=rarity=>SHIP_RARITIES.indexOf(rarity);
export const nextShipRarity=rarity=>SHIP_RARITIES[rarityIndex(rarity)+1]||null;
export function nativeMotherRarity(shipId){
 if(typeof shipId!=='string')return null;
 return ({N:'Comune',C:'Comune',R:'Rara',E:'Epica',L:'Leggendaria'})[shipId[0]]||null;
}
export const nativeSupportRarity=definition=>definition?.rarita||null;
export function rarityUnlockedAtSector(sector){
 const n=Number.isInteger(sector)?Math.max(1,Math.min(120,sector)):1;
 return [...SHIP_RARITIES].reverse().find(r=>n>=RARITY_SECTOR_UNLOCKS[r])||'Comune';
}
export function rarityMayBeAcquired(rarity,nativeRarity,sector){
 return isShipRarity(rarity)&&isShipRarity(nativeRarity)&&
  rarityIndex(rarity)>=rarityIndex(nativeRarity)&&
  rarityIndex(rarity)<=rarityIndex(rarityUnlockedAtSector(sector));
}
export function rarityPurchaseCost(kind,rarity){
 return RARITY_SHOP_PRICES[kind]?.[rarity]??null;
}
export function rarityEvolutionCost(kind,rarity){
 return RARITY_EVOLUTION_COSTS[kind]?.[rarity]??null;
}
// Quattro fasce strategiche, non venti livelli visibili. Massima rarità
// significa tutta la potenzialità del modello, anche per Aurora-0.
export function combatLevelForRarity(shipId,rarity){
 const max=shipMaxLevel(shipId);
 if(!max||!isShipRarity(rarity))return null;
 const index=rarityIndex(rarity);
 return [1,Math.max(2,Math.round(max*.4)),
  Math.max(3,Math.round(max*.7)),max][index];
}
export function rarityFromLegacyLevel(shipId,level){
 const natural=nativeMotherRarity(shipId),max=shipMaxLevel(shipId);
 if(!natural||!max)return null;
 const n=Number.isInteger(level)?Math.max(1,Math.min(max,level)):1;
 const ratio=(n-1)/Math.max(1,max-1);
 const index=ratio>=.99?3:ratio>=.67?2:ratio>=.34?1:0;
 return SHIP_RARITIES[Math.max(index,rarityIndex(natural))];
}
export function legendaryMotherCombatStats(shipId='L04'){
 return scaledMotherStats(shipId,3);
}
// Il modello determina il ruolo, la rarita' ne determina la scala.
// Per vecchie chiamate senza ID si usa solo l'Arca Astrale di riferimento.
export function motherCombatStatsForRarity(rarity,shipId='L04'){
 const idx=rarityIndex(rarity);
 return idx<0?null:scaledMotherStats(shipId,idx);
}
