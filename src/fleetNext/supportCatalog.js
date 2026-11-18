// Catalogo autonomo delle 34 navicelle di supporto.
// "originShipId" indica il modello storico, NON limita l'equipaggiamento:
// due copie della stessa scudiera possono essere schierate, se possedute.
// Le scudiere non eseguono attacchi ordinari; l'elemento è ereditato dalla madre.
// Le 15 abilità comuni e le Carte Fusione saranno collegate in un passo separato.
import {ESCORT_ARMORY} from '../escortArmory.js';
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {supportSkillFor,SUPPORT_SKILL_LABELS} from './supportAbilities.js';

export const SUPPORT_ACTIVE_SLOTS=2;
export const SUPPORT_FUSION_FAMILIES=Object.freeze(['L01','L03','L04']);
export const supportIdFor=(originShipId,originSlot)=>
 typeof originShipId==='string'&&Number.isInteger(originSlot)&&originSlot>=0&&originSlot<2?
 'support-'+originShipId.toLowerCase()+'-'+String(originSlot+1).padStart(2,'0'):null;

export const SUPPORT_CATALOG=Object.freeze(PHASE1_CATALOG.ships.flatMap(mother=>{
 const pair=ESCORT_ARMORY[mother.id];
 if(!Array.isArray(pair)||pair.length!==2)
  throw Error('Due supporti obbligatori per '+mother.id);
 return pair.map((model,index)=>Object.freeze({
  id:supportIdFor(mother.id,index),
  name:model.name,role:model.role,
  originShipId:mother.id,originShipName:mother.nome,originSlot:index,
  category:'Navicella di supporto',
  visual:'/assets/escorts/'+mother.id+'_escort_'+(index+1)+'.svg',
  inheritedElement:true,independentNormalAttack:false,
  skillId:supportSkillFor(mother.id,index),
  skillName:SUPPORT_SKILL_LABELS[supportSkillFor(mother.id,index)],
  freelyCombinable:true,duplicatesAllowed:true,
  // Predisposizione per le future Carte Fusione legate ai supporti.
  fusionFamily:SUPPORT_FUSION_FAMILIES.includes(mother.id)?mother.id:null
 }));
}));
export const SUPPORT_CATALOG_BY_ID=Object.freeze(Object.fromEntries(
 SUPPORT_CATALOG.map(support=>[support.id,support])
));
export const supportDefinition=id=>SUPPORT_CATALOG_BY_ID[id]||null;

if(PHASE1_CATALOG.ships.length!==17||SUPPORT_CATALOG.length!==34||
 Object.keys(SUPPORT_CATALOG_BY_ID).length!==34||
 SUPPORT_CATALOG.some(s=>!s.id||!s.name||!s.visual))
 throw Error('Il catalogo autonomo deve contenere 34 supporti distinti');
