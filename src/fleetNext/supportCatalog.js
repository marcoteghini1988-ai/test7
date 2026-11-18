// Catalogo delle carte-navicella schierabili come supporto, senza legami
// obbligatori con la nave madre. Gli ID vecchi (due per famiglia) sono alias
// di sola compatibilita' per non invalidare i salvataggi e i test storici.
// Il catalogo ufficiale comprende 13 supporti con 13 passive distinte.
// Le 17 madri storiche e tutti i loro ID legacy restano conservati.
import {ESCORT_ARMORY} from '../escortArmory.js';
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {fleetElements} from './elementalAffinities.js';
import {supportSkillFor,SUPPORT_SKILL_LABELS} from './supportAbilities.js';
import {SUPPORT_MODEL_DESIGNS,officialSupportShipFor} from './supportModelRegistry.js';

export const SUPPORT_ACTIVE_SLOTS=2;
// Riferimento alle sole tre famiglie fusione del sistema storico.
export const SUPPORT_FUSION_FAMILIES=Object.freeze(['L01','L03','L04']);
export const supportIdFor=(originShipId,originSlot)=>
 typeof originShipId==='string'&&Number.isInteger(originSlot)&&originSlot>=0&&originSlot<2?
 'support-'+originShipId.toLowerCase()+'-'+String(originSlot+1).padStart(2,'0'):null;
export const supportModelIdFor=shipId=>
 PHASE1_CATALOG.ships.some(s=>s.id===shipId)?'support-model-'+shipId.toLowerCase():null;

// I nomi e ruoli derivano dall'effetto; i disegni provvisori vengono
// recuperati dalle scocche originali, senza richiedere nuovi asset ora.
const HISTORICAL_SHIPS=new Map(PHASE1_CATALOG.ships.map(ship=>[ship.id,ship]));
export const officialSupportModelIdFor=shipId=>
 supportModelIdFor(officialSupportShipFor(shipId));
export const SUPPORT_CATALOG=Object.freeze(SUPPORT_MODEL_DESIGNS.map(design=>{
 const ship=HISTORICAL_SHIPS.get(design.shipId);
 if(!ship)throw Error('Modello origine supporto inesistente: '+design.shipId);
 const arm=ESCORT_ARMORY[ship.id][design.originSlot];
 return Object.freeze({
  id:supportModelIdFor(ship.id),name:design.name,role:design.role,
  originShipId:ship.id,originShipName:ship.nome,originSlot:design.originSlot,
  shipModelId:ship.id,nativeShipModel:true,rarita:ship.rarita,
  category:'Carta navicella',visual:'/assets/escorts/'+ship.id+'_escort_'+(design.originSlot+1)+'.svg',
  visualBrief:design.visualBrief,visualPlaceholder:true,
  elementId:fleetElements(ship.id)[0],inheritedElement:false,
  independentNormalAttack:false,skillId:design.skillId,
  skillName:SUPPORT_SKILL_LABELS[design.skillId],
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
// Quattro alias in più per i modelli storici non esposti nel catalogo a 13.
const LEGACY_MODEL_ALIASES=Object.freeze(PHASE1_CATALOG.ships
 .filter(ship=>!SUPPORT_CATALOG.some(def=>def.shipModelId===ship.id))
 .map(ship=>{
  const originSlot=0,model=ESCORT_ARMORY[ship.id][originSlot];
  const skillId=supportSkillFor(ship.id,originSlot);
  return Object.freeze({id:supportModelIdFor(ship.id),name:ship.nome,
   role:model.role,originShipId:ship.id,originShipName:ship.nome,
   originSlot,shipModelId:ship.id,nativeShipModel:false,legacySupport:true,
   category:'Navicella storica (non nel catalogo ufficiale)',
   visual:'/assets/escorts/'+ship.id+'_escort_1.svg',
   elementId:fleetElements(ship.id)[0],inheritedElement:false,
   independentNormalAttack:false,skillId,skillName:SUPPORT_SKILL_LABELS[skillId],
   freelyCombinable:true,duplicatesAllowed:true,fusionFamily:null});
 }));
export const SUPPORT_CATALOG_BY_ID=Object.freeze(Object.fromEntries(
 [...LEGACY_SUPPORT_CATALOG,...LEGACY_MODEL_ALIASES,...SUPPORT_CATALOG]
  .map(entry=>[entry.id,entry])
));
export const supportDefinition=id=>SUPPORT_CATALOG_BY_ID[id]||null;
if(SUPPORT_CATALOG.length!==13||
 new Set(SUPPORT_CATALOG.map(s=>s.skillId)).size!==13||
 new Set(SUPPORT_CATALOG.map(s=>s.shipModelId)).size!==SUPPORT_CATALOG.length||
 !SUPPORT_CATALOG.every(s=>s.elementId&&s.skillId))
 throw Error('Il catalogo delle carte-navicella non e completo');
