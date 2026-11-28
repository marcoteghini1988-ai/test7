// Identita visiva e tattica della MADRE di ciascuno dei dodici boss UFFICIALI.
// Il modello non deve cambiare con la carta nave scelta dal giocatore:
// altrimenti cambiano firme dei vitali e armamenti del boss durante un replay.
// NON riguarda il motore legacy, il PvP o la plancia. Nessuna nave e donata.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {CAMPAIGN_SHIP_ORDER} from './fleetNext/progression.js';
import {getShipDefinition} from './fleetNext/shipCore.js';

// Ogni boss ha una madre diversa fra le dodici approvate.
// Le soglie provvisorie delle ricompense non modificano la sua identità.
export const OFFICIAL_BOSS_MOTHER_SHIPS=Object.freeze(Object.fromEntries(
 PHASE16A_CAMPAIGN_PLANETS.map((planet,index)=>{
  const shipId=CAMPAIGN_SHIP_ORDER[index];
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
