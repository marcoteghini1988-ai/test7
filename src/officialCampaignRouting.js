// Normalizza il numero di settore del nuovo percorso a dodici pianeti.
// Gli ID storici dei pianeti (1,2,3,6,...,20) NON sono indici 1..12.
// Non muta props o salvataggi e non modifica le altre modalita'.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';

export function officialCampaignSectorNumber({
 gameMode,sectorNumber,bossPlanetId=null,bossSectorLevel=null
}={}){
 if(!['adventure','campaign'].includes(gameMode))return sectorNumber;
 if(!Number.isInteger(bossPlanetId)||!Number.isInteger(bossSectorLevel)||
    bossSectorLevel<1||bossSectorLevel>10)return sectorNumber;
 const planet=PHASE16A_CAMPAIGN_PLANETS.find(entry=>entry.id===bossPlanetId);
 if(!planet)return sectorNumber;
 return (planet.order-1)*10+bossSectorLevel;
}

export function officialCampaignBattleProps(props={}){
 const sectorNumber=officialCampaignSectorNumber(props);
 return sectorNumber===props.sectorNumber?props:{...props,sectorNumber};
}
