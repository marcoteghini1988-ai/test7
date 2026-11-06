// Eclissi Stellare — punti 40/41, fondazione comandante di FLOTTA.
// L'identità appartiene allo schieramento, NON a una singola nave o scudiera.
// Le abilità pilota del vecchio motore Poker non vengono attivate qui.
export const FLEET_COMMANDER_MAX_LEVEL=5;
export const FLEET_COMMANDER_DEFAULT_ID='pilot_com_1';

export function commanderFromInventory(id,inventory={}){
 if(typeof id!=='string'||!/^pilot_[a-z0-9_]+$/.test(id))return null;
 if(!inventory||typeof inventory!=='object'||Array.isArray(inventory))return null;
 const owned=inventory[id];
 if(!owned||owned.unlocked!==true)return null;
 return normalizeFleetCommander(id,owned.level);
}

export function normalizeFleetCommander(id,level=1){
 if(typeof id!=='string'||!/^pilot_[a-z0-9_]+$/.test(id))return null;
 const number=Number(level);
 const clamped=Number.isFinite(number)?Math.max(1,Math.min(FLEET_COMMANDER_MAX_LEVEL,Math.floor(number))):1;
 return Object.freeze({id,level:clamped,scope:'fleet'});
}

export function equipFleetCommander(side,id=null,level=1){
 const commander=normalizeFleetCommander(id,level);
 if(!commander||!Array.isArray(side?.fleet)||side.fleet.length<1)return side;
 // Never mutate a vessel, life system, card deck, attack or HP value.
 return {...side,commander};
}
