// I premi dei primi settori NON si assegnano al click sul settore.
// La licenza pilota iniziale si decide soltanto nella registrazione:
// una selezione salvata senza inventario NON prova il possesso.
export const TERRA_STARTER_MODULE_BY_PILOT=Object.freeze({
 pilot_com_1:'aries',pilot_com_2:'taurus',
 pilot_com_3:'gemini',pilot_com_4:'cancer'
});
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function missingPilotInventory(){
 return {pilot_com_1:{level:1,unlocked:true}};
}
export function initialSelectedPilot(savedSelection,rawInventory){
 const desired=savedSelection==='pilot_starter_1'?'pilot_com_1':savedSelection;
 let inventory=rawInventory;
 try{
  if(typeof inventory==='string')inventory=JSON.parse(inventory);
 }catch{return 'pilot_com_1';}
 if(!isObject(inventory))return 'pilot_com_1';
 // La vecchia licenza pilot_starter_1 viene migrata senza inventare
 // altri personaggi. La scelta salvata, da sola, NON da possesso.
 if(inventory.pilot_starter_1?.unlocked===true&&!inventory.pilot_com_1)
  inventory={...inventory,pilot_com_1:inventory.pilot_starter_1};
 if(typeof desired==='string'&&inventory[desired]?.unlocked===true)return desired;
 const first=Object.entries(inventory).find(([id,v])=>
  id!=='pilot_starter_1'&&v?.unlocked===true);
 return first?.[0]??'pilot_com_1';
}
export function terraNineModuleVictory({winner,mode,planetId,sectorLevel,
 selectedPilot,abilities}={}){
 if(winner!=='player'||mode!=='adventure'||Number(planetId)!==1||
    Number(sectorLevel)!==9)return null;
 if(isObject(abilities)&&Object.values(abilities).some(value=>value?.unlocked===true))
  return null;
 // Le rare e i boss pilot possono entrare nel settore 9 su replay;
 // in assenza di corrispondenza conserva l'Ariete del catalogo storico.
 return TERRA_STARTER_MODULE_BY_PILOT[selectedPilot]??'aries';
}
