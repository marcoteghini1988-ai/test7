// Navicelle ottenibili nella nuova campagna matematica.
// Progressione esplicita, una carta PERMANENTE per soglia. Le vittorie ripetute
// non duplicano il modello né generano crediti per altre navicelle.
// Non introduce monete, transazioni o prezzi senza un'economia approvata.
import {readShipCollection,updateShipCollection,grantShipCard} from './shipCollection.js';
import {SUPPORT_SLOT_CAMPAIGN_UNLOCKS,supportMilestoneForSector} from './fleetNext/supportCampaign.js';
import {readSupportCollection,writeSupportCollection,claimSupportSlotMilestone,
 grantSupportInstance,equipSupportInstance} from './fleetNext/supportCollection.js';
export {SUPPORT_SLOT_CAMPAIGN_UNLOCKS} from './fleetNext/supportCampaign.js';

export const SHIP_CAMPAIGN_UNLOCKS=Object.freeze([
 {sector:3,shipId:'C01'},{sector:6,shipId:'C02'},
 {sector:9,shipId:'C03'},
 {sector:15,shipId:'R01'},{sector:20,shipId:'R02'},
 {sector:30,shipId:'R04'},
 {sector:40,shipId:'E01'},{sector:50,shipId:'E02'},
 
 {sector:80,shipId:'L01'},,
 {sector:100,shipId:'L03'},{sector:110,shipId:'L04'}
].map(row=>Object.freeze({...row})));

export function shipUnlockForSector(mode,globalSector){
 if(!['adventure','campaign'].includes(mode)||!Number.isInteger(globalSector))return null;
 return SHIP_CAMPAIGN_UNLOCKS.find(item=>item.sector===globalSector)??null;
}

export async function claimCampaignShipUnlock(mode,globalSector,storage=globalThis.localStorage){
 const reward=shipUnlockForSector(mode,globalSector);
 if(!reward)return {granted:false,shipId:null,reason:'no_ship_milestone'};
 // In caso di salvataggio illegibile la scrittura fallisce senza cancellare
 // nulla; l'uscita dalla battaglia continua a gestire il suo risultato.
 let earned=false;
 const collection=await updateShipCollection(current=>{
  if(current.cards.some(card=>card.shipId===reward.shipId))return current;
  earned=true;
  return grantShipCard(current,reward.shipId);
 },storage);
 return {granted:earned,shipId:reward.shipId,collection,
  reason:earned?'unlocked':'already_owned'};
}


// Sblocco permanente della FORMAZIONE: un settore vinto una sola volta.
// Salvataggio atomico in un'unica chiave: lo slot e la copia-premio non
// si separano anche se localStorage non completa la scrittura.
export function claimCampaignSupportUnlock(mode,globalSector,storage=globalThis.localStorage){
 const milestone=supportMilestoneForSector(mode,globalSector);
 if(!milestone)return {granted:false,slot:null,reason:'no_support_milestone'};
 const current=readSupportCollection(storage);
 if(current.claimedMilestones.includes(milestone.milestone))
  return {granted:false,slot:milestone.slot,reason:'already_claimed'};
 let next=claimSupportSlotMilestone(current,milestone.milestone);
 next=grantSupportInstance(next,milestone.supportId);
 const instanceId=next.owned.at(-1).instanceId;
 const freeSlot=milestone.slot<next.unlockedSlots&&next.equipped[milestone.slot]===null?
  milestone.slot:next.equipped.findIndex((id,index)=>index<next.unlockedSlots&&id===null);
 if(freeSlot>=0)next=equipSupportInstance(next,freeSlot,instanceId);
 const collection=writeSupportCollection(next,storage);
 return {granted:true,slot:milestone.slot,instanceId,supportId:milestone.supportId,collection};
}
