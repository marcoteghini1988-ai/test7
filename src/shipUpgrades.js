// Costi di potenziamento in polvere stellare già esistente.
// Nessuna valuta reale, nessun pacchetto acquistato, nessun livello saltato.
import {getShipDefinition} from './mathDuelEngine.js';

export const SHIP_UPGRADE_DUST=Object.freeze({
 Comune:Object.freeze({2:100,3:180,4:300,5:500}),
 Rara:Object.freeze({2:160,3:280,4:450,5:700}),
 Epica:Object.freeze({2:240,3:420,4:700,5:1100}),
 Leggendaria:Object.freeze({2:350,3:600,4:1000,5:1600})
});

export function shipUpgradeDustCost(shipId,targetLevel){
 const definition=getShipDefinition(shipId);
 if(!definition||!Number.isInteger(targetLevel)||targetLevel<2||targetLevel>5)return null;
 return SHIP_UPGRADE_DUST[definition.rarita]?.[targetLevel]??null;
}
export function validateShipUpgradePurchase(collection,instanceId,targetLevel,balance){
 const card=collection?.cards?.find(c=>c.instanceId===instanceId);
 if(!card)return {allowed:false,reason:'not_owned'};
 if(targetLevel!==card.level+1||targetLevel>5)return {allowed:false,reason:'invalid_upgrade'};
 const cost=shipUpgradeDustCost(card.shipId,targetLevel);
 if(cost===null)return {allowed:false,reason:'invalid_upgrade'};
 if(!Number.isFinite(balance)||balance<cost)return {allowed:false,reason:'insufficient_dust',cost};
 return {allowed:true,reason:'ok',cost};
}
