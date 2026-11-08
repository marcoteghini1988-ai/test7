// Read-only milestones for authentic boss progression. This is NOT the player's
// inventory: a ship is theoretically unlockable only after its victory sector.
// Never grant a ship, dust, pilot, special card or reward in this module.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';

export function shipsUnlockableBeforeSector(globalSector){
 if(!Number.isInteger(globalSector)||globalSector<1||globalSector>120)
  throw new Error('Settore campagna non valido');
 return Object.freeze(['N00',...SHIP_CAMPAIGN_UNLOCKS
  .filter(reward=>reward.sector<globalSector)
  .map(reward=>reward.shipId)]);
}

// Uses canonical 10,20,...120, never historical planet ID multiplied by 10.
// The ship awarded ON a boss sector is not usable BEFORE defeating that boss.
export function bossPreparationMilestone(globalSector){
 if(!Number.isInteger(globalSector)||globalSector<10||globalSector>120||
    globalSector%10!==0)throw new Error('Settore boss non valido');
 const planet=PHASE16A_CAMPAIGN_PLANETS[(globalSector/10)-1];
 const unlockableShips=shipsUnlockableBeforeSector(globalSector);
 const reward=SHIP_CAMPAIGN_UNLOCKS.find(entry=>entry.sector===globalSector);
 return Object.freeze({
  globalSector,planetId:planet.id,planetName:planet.name,
  enemyLevel:officialCampaignRivalLevel({mode:'adventure',sectorNumber:globalSector}),
  unlockableShips,latestShip:unlockableShips.at(-1),
  shipRewardOnlyAfterVictory:reward?.shipId??null
 });
}
