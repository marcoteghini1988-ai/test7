// Permanent boss-character trophy on a REAL boss victory only.
// Works for both engines; the card stays in special collection until equipped.
// A win in campaign AND adventure does not duplicate the character.
import {bossCharacterTypeForPlanet} from './bossCharacterCards.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {readSpecialCollection,updateSpecialCollection} from './specialDeckBuilder.js';

export function claimBossCharacterFromVictory({
 winner=null,mode='campaign',sectorNumber=1,bossPlanetId=null,bossSectorLevel=null
}={},storage=globalThis.localStorage){
 const read=()=>readSpecialCollection(storage);
 if(winner!=='player')return {granted:false,reason:'not_victory',collection:read()};
 const encounter=officialBossEncounter({mode,sectorNumber,planetId:bossPlanetId,
  sectorLevel:bossSectorLevel});
 if(!encounter)return {granted:false,reason:'not_boss',collection:read()};
 const type=bossCharacterTypeForPlanet(encounter.planetId);
 if(!type)return {granted:false,reason:'unknown_character',collection:read()};
 const key='boss:character:'+encounter.planetId;
 let granted=false;
 const collection=updateSpecialCollection(current=>{
  if(current.claimedRewards.includes(key)||current.owned[type]>=1)return current;
  granted=true;
  return {...current,claimedRewards:[...current.claimedRewards,key],
   owned:{...current.owned,[type]:1}};
 },storage);
 return {granted,reason:granted?'unlocked':'already_owned',type,
  planetId:encounter.planetId,collection};
}
