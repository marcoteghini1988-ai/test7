// Negozio tecnico navicelle di supporto (13 modelli), SENZA nuove valute.
// Prezzi esclusivamente provvisori: il bilanciamento sara' fissato a fine design.
// La fonte unica dei Crediti Stellari e' l'inventario della flotta.
import {SUPPORT_CATALOG} from './supportCatalog.js';
import {SUPPORT_MAX_LEVEL} from './supportProgression.js';
import {SUPPORT_COLLECTION_KEY,readSupportCollection,writeSupportCollection,
 grantSupportInstance,advanceSupportLevel,evolveSupportWithDuplicates} from './supportCollection.js';
import {FLEET_INVENTORY_KEY,readFleetInventory,writeFleetInventory} from './collection.js';
import {readRarityCampaign} from './rarityCampaign.js';
import {rarityMayBeAcquired,rarityPurchaseCost,rarityEvolutionCost,nextShipRarity} from './shipRarity.js';

const MODEL_BY_ID=new Map(SUPPORT_CATALOG.map(model=>[model.id,model]));
export const SUPPORT_PRICES_DRAFT=Object.freeze({
 Comune:240,Rara:420,Epica:700,Leggendaria:1100
});
export const SUPPORT_UPGRADE_BASE_DRAFT=Object.freeze({
 Comune:60,Rara:95,Epica:150,Leggendaria:230
});
export const supportPurchaseCost=id=>SUPPORT_PRICES_DRAFT[MODEL_BY_ID.get(id)?.rarita]??null;
export function supportUpgradeCost(id,nextLevel){
 const model=MODEL_BY_ID.get(id);
 if(!model||!Number.isInteger(nextLevel)||nextLevel<2||nextLevel>SUPPORT_MAX_LEVEL)return null;
 return (SUPPORT_UPGRADE_BASE_DRAFT[model.rarita]||0)*(nextLevel-1);
}
const failure=(reason)=>({ok:false,reason});
function readBoth(storage){
 return {support:readSupportCollection(storage),fleet:readFleetInventory(storage)};
}
function commitBoth(storage,oldValue,newSupport,newFleet){
 // Browser localStorage non ha transazioni fra chiavi: si usa il rollback
 // sincrono in caso di errore di scrittura, senza consumi prima di validare.
 try{
  writeSupportCollection(newSupport,storage);
  writeFleetInventory(newFleet,storage);
  return {ok:true};
 }catch(error){
  let rollbackError=null;
  try{
   if(oldValue.support===null)storage.removeItem(SUPPORT_COLLECTION_KEY);
   else storage.setItem(SUPPORT_COLLECTION_KEY,oldValue.support);
   if(oldValue.fleet===null)storage.removeItem(FLEET_INVENTORY_KEY);
   else storage.setItem(FLEET_INVENTORY_KEY,oldValue.fleet);
  }catch(e){rollbackError=e;}
  return failure('Salvataggio non completato'+(rollbackError?'; ripristino da controllare':'')+
   ': '+(error?.message||'errore'));
 }
}
export function purchaseSupportModel(modelId,storage=globalThis.localStorage){
 const price=supportPurchaseCost(modelId);
 if(price===null)return failure('Modello di supporto non acquistabile');
 try{
  const old={support:storage.getItem(SUPPORT_COLLECTION_KEY),
   fleet:storage.getItem(FLEET_INVENTORY_KEY)};
  const {support,fleet}=readBoth(storage);
  if(fleet.credits<price)return failure('Crediti insufficienti');
  const updated=grantSupportInstance(support,modelId);
  const acquired=updated.owned.at(-1);
  const nextFleet={...fleet,credits:fleet.credits-price};
  const saved=commitBoth(storage,old,updated,nextFleet);
  return saved.ok?{ok:true,price,instanceId:acquired.instanceId,
   collection:updated,inventory:nextFleet}:saved;
 }catch(error){return failure(error?.message||'Acquisto non riuscito');}
}
export function purchaseSupportUpgrade(instanceId,storage=globalThis.localStorage){
 try{
  const old={support:storage.getItem(SUPPORT_COLLECTION_KEY),
   fleet:storage.getItem(FLEET_INVENTORY_KEY)};
  const {support,fleet}=readBoth(storage);
  const unit=support.owned.find(x=>x.instanceId===instanceId);
  if(!unit)return failure('Supporto non posseduto');
  if(unit.level>=SUPPORT_MAX_LEVEL)return failure('Supporto gia al livello MAX');
  const price=supportUpgradeCost(unit.supportId,unit.level+1);
  if(price===null)return failure('Potenziamento di un vecchio modello non disponibile');
  if(fleet.credits<price)return failure('Crediti insufficienti');
  const updated=advanceSupportLevel(support,instanceId);
  const nextFleet={...fleet,credits:fleet.credits-price};
  const saved=commitBoth(storage,old,updated,nextFleet);
  return saved.ok?{ok:true,price,instanceId,level:unit.level+1,
   collection:updated,inventory:nextFleet}:saved;
 }catch(error){return failure(error?.message||'Potenziamento non riuscito');}
}

// Nuove operazioni ufficiali. Le funzioni L1–L5 sopra sono soltanto API legacy
// per i dati e le suite precedenti; l'Hangar nuovo usa le rarità.
export function purchaseSupportCopy(modelId,rarita,storage=globalThis.localStorage){
 const model=MODEL_BY_ID.get(modelId);
 const cost=rarityPurchaseCost('support',rarita);
 if(!model||cost===null)return failure('Carta supporto o rarità non esistente');
 try{
  const progress=readRarityCampaign(storage);
  if(!rarityMayBeAcquired(rarita,model.rarita,progress.highestSector))
   return failure('Rarità non ancora sbloccata nella campagna');
  const old={support:storage.getItem(SUPPORT_COLLECTION_KEY),
   fleet:storage.getItem(FLEET_INVENTORY_KEY)};
  const {support,fleet}=readBoth(storage);
  if(fleet.credits<cost)return failure('Crediti Stellari insufficienti');
  const updated=grantSupportInstance(support,modelId,rarita);
  const nextFleet={...fleet,credits:fleet.credits-cost};
  const saved=commitBoth(storage,old,updated,nextFleet);
  return saved.ok?{ok:true,price:cost,rarita,instanceId:updated.owned.at(-1).instanceId,
   collection:updated,inventory:nextFleet}:saved;
 }catch(e){return failure(e.message||'Acquisto non eseguito');}
}
export function evolveSupportCopy(instanceId,storage=globalThis.localStorage){
 try{
  const progress=readRarityCampaign(storage);
  const old={support:storage.getItem(SUPPORT_COLLECTION_KEY),
   fleet:storage.getItem(FLEET_INVENTORY_KEY)};
  const {support,fleet}=readBoth(storage);
  const unit=support.owned.find(c=>c.instanceId===instanceId);
  if(!unit)return failure('Carta supporto non posseduta');
  const next=nextShipRarity(unit.rarita);
  if(!next)return failure('La carta è già Leggendaria');
  const model=MODEL_BY_ID.get(unit.supportId);
  if(!model||!rarityMayBeAcquired(next,model.rarita,progress.highestSector))
   return failure('Rarità non ancora sbloccata nella campagna');
  const price=rarityEvolutionCost('support',next);
  if(fleet.credits<price)return failure('Crediti Stellari insufficienti');
  const updated=evolveSupportWithDuplicates(support,instanceId);
  const nextFleet={...fleet,credits:fleet.credits-price};
  const saved=commitBoth(storage,old,updated,nextFleet);
  return saved.ok?{ok:true,price,rarita:next,
   instanceId:updated.owned.at(-1).instanceId,collection:updated,inventory:nextFleet}:saved;
 }catch(e){return failure(e.message||'Evoluzione non eseguita');}
}
