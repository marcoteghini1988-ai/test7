// Sblocco rarità persistente solo tramite vittorie nella campagna.
// Non modifica né azzera gli inventari preesistenti.
import {rarityUnlockedAtSector} from './shipRarity.js';
export const RARITY_CAMPAIGN_KEY='eclissi_rarity_campaign_v1';
export function readRarityCampaign(storage=globalThis.localStorage){
 const raw=storage?.getItem(RARITY_CAMPAIGN_KEY);
 if(!raw)return {highestSector:1,rarity:'Comune'};
 const data=JSON.parse(raw);
 if(!data||data.schemaVersion!==1||!Number.isInteger(data.highestSector)||
  data.highestSector<1||data.highestSector>120)
  throw Error('Progresso rarità non leggibile: dati conservati');
 return {highestSector:data.highestSector,rarity:rarityUnlockedAtSector(data.highestSector)};
}
export function claimRarityCampaignVictory(mode,sector,storage=globalThis.localStorage){
 if(!['campaign','adventure'].includes(mode)||!Number.isInteger(sector)||
  sector<1||sector>120)
  return {granted:false,reason:'invalid_campaign'};
 const saved=readRarityCampaign(storage);
 if(sector<=saved.highestSector)
  return {granted:false,rarity:saved.rarity,highestSector:saved.highestSector,reason:'already_reached'};
 const next={schemaVersion:1,highestSector:sector};
 storage.setItem(RARITY_CAMPAIGN_KEY,JSON.stringify(next));
 return {granted:true,highestSector:sector,rarity:rarityUnlockedAtSector(sector)};
}
