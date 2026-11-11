// Requisiti per equipaggiare speciali nel duello ufficiale.
// La proprieta' della carta e il limite delle 24 copie sono controllati
// separatamente da validateSpecialDeck. Qui convalidiamo slot Epici reali
// e acquisto/livello Moduli, con la STESSA regola per Hangar e battaglia.
import {isTacticalEpic} from './tacticalEpicCards.js';
import {isModuleCard} from './tacticalEquipmentCards.js';

export function officialSpecialLoadoutAccess(loadout,{
 epicSlotLimit=0,moduleLevels={}
}={}){
 if(!Array.isArray(loadout))return {valid:false,reason:'deck_format'};
 const epics=loadout.filter(isTacticalEpic);
 if(epics.length>epicSlotLimit)
  return {valid:false,reason:'epic_slots'};
 const invalidModule=loadout.find(type=>isModuleCard(type)&&
  (!Number.isInteger(moduleLevels?.[type])||
   moduleLevels[type]<1||moduleLevels[type]>9));
 if(invalidModule)
  return {valid:false,reason:'module_not_unlocked',type:invalidModule};
 return {valid:true,reason:'ok'};
}
