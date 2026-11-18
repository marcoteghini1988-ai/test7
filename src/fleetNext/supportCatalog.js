// Catalogo delle carte-navicella schierabili come supporto, senza legami
// obbligatori con la nave madre. Gli ID vecchi (due per famiglia) sono alias
// di sola compatibilita' per non invalidare i salvataggi e i test storici.
// Il progetto ha 13 modelli approvati; i 4 ID da togliere dal vecchio
// catalogo di 17 non sono ancora identificati, dunque non eliminiamo dati.
import {ESCORT_ARMORY} from '../escortArmory.js';
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {fleetElements} from './elementalAffinities.js';
import {supportSkillFor,SUPPORT_SKILL_LABELS} from './supportAbilities.js';

export const SUPPORT_ACTIVE_SLOTS=2;
// Riferimento alle sole tre famiglie fusione del sistema storico.
export const SUPPORT_FUSION_FAMILIES=Object.freeze(['L01','L03','L04']);
export const supportIdFor=(originShipId,originSlot)=>
 typeof originShipId==='string'&&Number.isInteger(originSlot)&&originSlot>=0&&originSlot<2?
 'support-'+originShipId.toLowerCase()+'-'+String(originSlot+1).padStart(2,'0'):null;
export const supportModelIdFor=shipId=>
 PHASE1_CATALOG.ships.some(s=>s.id===shipId)?'support-model-'+shipId.toLowerCase():null;

export const SUPPORT_CATALOG=Object.freeze(PHASE1_CATALOG.ships.map(ship=>{
 const arm=ESCORT_ARMORY[ship.id][0],skillId=supportSkillFor(ship.id,0);
 return Object.freeze({
  id:supportModelIdFor(ship.id),name:ship.nome,role:arm.role,
  originShipId:ship.id,originShipName:ship.nome,originSlot:0,
  shipModelId:ship.id,nativeShipModel:true,
  category:'Carta navicella',visual:'/assets/escorts/'+ship.id+'_escort_1.svg',
  elementId:fleetElements(ship.id)[0],inheritedElement:false,
  independentNormalAttack:false,skillId,skillName:SUPPORT_SKILL_LABELS[skillId],
  freelyCombinable:true,duplicatesAllowed:true,fusionFamily:null
 });
}));
// Conserviamo le vecchie identita' nei dati caricabili, ma non appaiono
// come ulteriori modelli acquistabili o selezionabili nel catalogo nuovo.
export const LEGACY_SUPPORT_CATALOG=Object.freeze(PHASE1_CATALOG.ships.flatMap(ship=>
 ESCORT_ARMORY[ship.id].map((model,index)=>{
  const skillId=supportSkillFor(ship.id,index);
  return Object.freeze({
   id:supportIdFor(ship.id,index),name:model.name,role:model.role,
   originShipId:ship.id,originShipName:ship.nome,originSlot:index,
   shipModelId:ship.id,nativeShipModel:false,legacySupport:true,
   category:'Navicella di supporto (storica)',
   visual:'/assets/escorts/'+ship.id+'_escort_'+(index+1)+'.svg',
   elementId:fleetElements(ship.id)[0],inheritedElement:false,
   independentNormalAttack:false,skillId,skillName:SUPPORT_SKILL_LABELS[skillId],
   freelyCombinable:true,duplicatesAllowed:true,
   fusionFamily:SUPPORT_FUSION_FAMILIES.includes(ship.id)?ship.id:null
  });
 })));
export const SUPPORT_CATALOG_BY_ID=Object.freeze(Object.fromEntries(
 [...SUPPORT_CATALOG,...LEGACY_SUPPORT_CATALOG].map(entry=>[entry.id,entry])
));
export const supportDefinition=id=>SUPPORT_CATALOG_BY_ID[id]||null;
if(SUPPORT_CATALOG.length!==PHASE1_CATALOG.ships.length||
 new Set(SUPPORT_CATALOG.map(s=>s.shipModelId)).size!==SUPPORT_CATALOG.length||
 !SUPPORT_CATALOG.every(s=>s.elementId&&s.skillId))
 throw Error('Il catalogo delle carte-navicella non e completo');
