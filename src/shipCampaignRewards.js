// Navicelle ottenibili nella nuova campagna matematica.
// Progressione esplicita, una carta PERMANENTE per soglia. Le vittorie ripetute
// non duplicano il modello né generano crediti per altre navicelle.
// Non introduce monete, transazioni o prezzi senza un'economia approvata.
import {readShipCollection,updateShipCollection,grantShipCard} from './shipCollection.js';

export const SHIP_CAMPAIGN_UNLOCKS=Object.freeze([
 {sector:3,shipId:'C01'},{sector:6,shipId:'C02'},
 {sector:9,shipId:'C03'},{sector:12,shipId:'C04'},
 {sector:15,shipId:'R01'},{sector:20,shipId:'R02'},
 {sector:25,shipId:'R03'},{sector:30,shipId:'R04'},
 {sector:40,shipId:'E01'},{sector:50,shipId:'E02'},
 {sector:60,shipId:'E03'},{sector:70,shipId:'E04'},
 {sector:80,shipId:'L01'},{sector:90,shipId:'L02'},
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
