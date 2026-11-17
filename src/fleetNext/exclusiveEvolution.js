// Rarità della carta esclusiva determinata dal livello reale della sua madre.
// La rarità è un attributo visivo/progressivo, distinto dall'upgrade manuale
// dell'effetto: non modifica HP, costo, danno o regole delle 120 carte storiche.
import {shipMaxLevel} from './progression.js';

export const EXCLUSIVE_RARITIES=Object.freeze(['Comune','Rara','Epica','Leggendaria']);
export function exclusiveRarityStage(shipId,level=1){
 const max=shipMaxLevel(shipId);
 if(!max)return null;
 const numeric=Number(level);
 const bounded=Number.isFinite(numeric)?Math.max(1,Math.min(max,Math.floor(numeric))):1;
 return Math.min(3,Math.floor(4*(bounded-1)/max));
}
export function exclusiveRarityAtLevel(card,shipLevel=1){
 if(!card?.shipId)return card?.rarita||card?.rarityDraft||'Comune';
 const stage=exclusiveRarityStage(card.shipId,shipLevel);
 return stage==null?(card.rarityDraft||'Comune'):EXCLUSIVE_RARITIES[stage];
}
export function exclusiveRarityMilestones(shipId){
 const max=shipMaxLevel(shipId);
 if(!max)return [];
 return Object.freeze(EXCLUSIVE_RARITIES.map((rarity,stage)=>Object.freeze({
  rarity,minLevel:stage?Math.ceil(stage*max/4+1):1
 })));
}
