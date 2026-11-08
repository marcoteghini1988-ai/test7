// Identita visiva e tattica della MADRE di ciascuno dei dodici boss UFFICIALI.
// Il modello non deve cambiare con la carta nave scelta dal giocatore:
// altrimenti cambiano firme dei vitali e armamenti del boss durante un replay.
// NON riguarda il motore legacy, il PvP o la plancia. Nessuna nave e donata.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {getShipDefinition} from './mathDuelEngine.js';

// Ogni boss presidia il modello dell'ultima soglia nave conquistabile PRIMA
// del proprio settore. La nave data in premio proprio alla vittoria del boss
// non e disponibile in anticipo. Dodici madri reali distinte, nessun asset nuovo.
export const OFFICIAL_BOSS_MOTHER_SHIPS=Object.freeze(Object.fromEntries(
 PHASE16A_CAMPAIGN_PLANETS.map((planet,index)=>{
  const sector=(index+1)*10;
  const latest=SHIP_CAMPAIGN_UNLOCKS.filter(item=>item.sector<sector).at(-1);
  const shipId=latest?.shipId??'N00';
  if(!getShipDefinition(shipId))throw new Error('Nave boss mancante nel catalogo: '+shipId);
  return [planet.id,shipId];
 })
));
if(new Set(Object.values(OFFICIAL_BOSS_MOTHER_SHIPS)).size!==PHASE16A_CAMPAIGN_PLANETS.length)
 throw new Error('Le dodici madri boss devono conservare identita di modello distinte');

export function officialBossMotherShip(planetId){
 const id=Number(planetId);
 return Number.isInteger(id)&&Object.hasOwn(OFFICIAL_BOSS_MOTHER_SHIPS,id)
  ?OFFICIAL_BOSS_MOTHER_SHIPS[id]:null;
}
