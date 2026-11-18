// Costruisce esclusivamente i supporti equipaggiati per le partite ufficiali.
// Il profilo storico resta usato dalle sole chiamate legacy senza formazione.
// Gradi ed effetti delle 15 passive saranno ribilanciati in un passaggio dedicato.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {ESCORT_ARMORY} from '../escortArmory.js';
import {FLEET_ESCORT_TRAITS} from '../fleetEscortSupports.js';
import {SUPPORT_ACTIVE_SLOTS,supportDefinition} from './supportCatalog.js';
import {fleetElements} from './elementalAffinities.js';
import {SUPPORT_MAX_LEVEL,boundedSupportLevel,supportHpAtLevel} from './supportProgression.js';

const motherModels=new Map(PHASE1_CATALOG.ships.map(m=>[m.id,m]));
const toughActions=new Set(['cover','bulwark','partCover','phase']);
export function createIndependentFleetEscorts(mother,roster=[]){
 if(!Array.isArray(roster)||roster.length>SUPPORT_ACTIVE_SLOTS)
  throw Error('La formazione deve contenere al massimo due supporti');
 const usedSlots=new Set(),usedInstances=new Set();
 return roster.map((unit,index)=>{
  const definition=supportDefinition(unit?.supportId||unit?.id);
  const slot=unit?.slot??index;
  const instanceId=unit?.instanceId;
  if(!definition||!Number.isInteger(slot)||slot<0||slot>=SUPPORT_ACTIVE_SLOTS||
   typeof instanceId!=='string'||!instanceId||
   usedSlots.has(slot)||usedInstances.has(instanceId))
   throw Error('Supporto non valido, duplicato o nello slot sbagliato');
  usedSlots.add(slot);usedInstances.add(instanceId);
  // Per i supporti senza omonima madre usiamo solo la scocca tecnica
  // di una delle 12 madri, non ripristiniamo il vecchio modello escluso.
  const templateId=definition.templateMotherId||definition.originShipId;
  const origin=motherModels.get(templateId);
  const arm=ESCORT_ARMORY[templateId][definition.originSlot];
  const oldSkill=FLEET_ESCORT_TRAITS[templateId][definition.originSlot];
  const tough=toughActions.has(oldSkill.action);
  const baseHp=definition.skillId==='last-shield'?50:
   Math.max(2,Math.min(12,Math.round(2+origin.hp_motore_L1/65+
   (oldSkill.action==='bulwark'?4:tough?2:0)+arm.shield*3)));
  const supportMaxLevel=SUPPORT_MAX_LEVEL;
  const supportLevel=boundedSupportLevel(unit.level);
  const levelHp=supportHpAtLevel(baseHp,supportLevel);
  // La progressione del supporto è indipendente da quella della madre.
  // La scala delle passive sarà calibrata dopo la progettazione delle carte.
  const grade=supportLevel,skill={
   ...oldSkill,requires:[],
   targetPart:oldSkill.targetPart==='engine'&&!mother.parts.some(p=>p.id==='engine')?
    'generator':oldSkill.targetPart
  };
  return {id:'escort:'+instanceId,instanceId,
   catalogSupportId:definition.id,originShipId:definition.originShipId,
   originSlot:definition.originSlot,parentShipId:null,
   fusionFamily:definition.fusionFamily,slot,sourceIndices:[slot],
   supportSkillId:definition.skillId,supportSkillName:definition.skillName,
   name:definition.name,role:definition.role,supportLevel,supportMaxLevel,grade,skill,
   hp:levelHp,maxHp:levelHp,supportObservedHp:levelHp,
   supportDeathResolved:false,destroyed:false,reserve:false,linked:true,fused:false,
   element:definition.elementId||fleetElements(templateId)[0],
   elements:[definition.elementId||fleetElements(templateId)[0]],
   elementInheritedFrom:null,shipModelId:definition.originShipId,
   visual:definition.visual};
 }).sort((a,b)=>a.slot-b.slot);
}
// Finché le Carte Fusione restano nel registro storico della madre,
// una fusione può essere utilizzata soltanto con la coppia di materiali giusta.
// La seconda fusione Arca e il trasferimento delle carte arriveranno dopo.
export function compatibleLegacyFusionCount(motherId,escorts){
 if(!['L01','L03','L04'].includes(motherId)||escorts.length!==2)return 0;
 if(!escorts.every(e=>e.fusionFamily===motherId))return 0;
 return new Set(escorts.map(e=>e.originSlot)).size===2?1:0;
}
