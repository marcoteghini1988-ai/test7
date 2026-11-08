// Solo i nove settori introduttivi di Terra nell'arena simultanea ufficiale.
// Il nemico non deve anticipare navi Rare o armi gia dal primo turno.
// Le 17 navi, il motore legacy e il PvP rimangono invariati.
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {getShipDefinition} from './mathDuelEngine.js';
export const FIRST_PLANET_RIVAL_SHIPS=Object.freeze(Array.from({length:9},(_,i)=>{
 const sector=i+1;
 const latest=SHIP_CAMPAIGN_UNLOCKS.filter(item=>item.sector<sector).at(-1);
 const id=latest?.shipId??'N00';
 if(!getShipDefinition(id))throw new Error('Rivale iniziale senza modello reale');
 return id;
}));
export function officialEarlyCampaignRivalShip({mode,sectorNumber,planetId}={}){
 if(!['campaign','adventure'].includes(mode)||!Number.isInteger(sectorNumber)||
  sectorNumber<1||sectorNumber>9||
  (planetId!=null&&Number(planetId)!==1))return null;
 return FIRST_PLANET_RIVAL_SHIPS[sectorNumber-1];
}
