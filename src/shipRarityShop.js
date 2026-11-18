// Economia delle carte madri: copie fisiche e costo in Crediti Stellari.
// La modifica è atomica con rollback se la scrittura di un inventario fallisce.
import {CAMPAIGN_SHIP_ORDER} from './fleetNext/progression.js';
import {readShipCollection,writeShipCollection,SHIP_COLLECTION_KEY,
 grantShipCopy,evolveMotherWithDuplicates} from './shipCollection.js';
import {readFleetInventory,writeFleetInventory,FLEET_INVENTORY_KEY}
 from './fleetNext/collection.js';
import {readRarityCampaign} from './fleetNext/rarityCampaign.js';
import {nativeMotherRarity,rarityMayBeAcquired,rarityPurchaseCost,
 rarityEvolutionCost,nextShipRarity} from './fleetNext/shipRarity.js';
const fail=reason=>({ok:false,reason});
function commit(storage,old,ships,fleet){
 try{
  writeShipCollection(ships,storage);
  writeFleetInventory(fleet,storage);
  return {ok:true};
 }catch(error){
  try{
   for(const [key,value] of [
    [SHIP_COLLECTION_KEY,old.ships],[FLEET_INVENTORY_KEY,old.fleet]]){
    if(value===null)storage.removeItem?.(key);
    else storage.setItem(key,value);
   }
  }catch{return fail('Salvataggio incompleto, ripristino non riuscito');}
  return fail('Salvataggio annullato: '+(error.message||'errore'));
 }
}
function open(storage){
 return {old:{ships:storage.getItem(SHIP_COLLECTION_KEY),
   fleet:storage.getItem(FLEET_INVENTORY_KEY)},
  ships:readShipCollection(storage),fleet:readFleetInventory(storage),
  sector:readRarityCampaign(storage).highestSector};
}
export function purchaseMotherCopy(shipId,rarita,storage=globalThis.localStorage){
 if(!CAMPAIGN_SHIP_ORDER.includes(shipId))return fail('Madre non ufficiale');
 const price=rarityPurchaseCost('mother',rarita);
 if(price===null)return fail('Rarità non valida');
 try{
  const {old,ships,fleet,sector}=open(storage);
  if(!ships.cards.some(x=>x.shipId===shipId))
   return fail('Sblocca prima il modello nella campagna');
  if(!rarityMayBeAcquired(rarita,nativeMotherRarity(shipId),sector))
   return fail('Rarità non ancora sbloccata');
  if(fleet.credits<price)return fail('Crediti Stellari insufficienti');
  const updated=grantShipCopy(ships,shipId,rarita);
  const wallet={...fleet,credits:fleet.credits-price};
  const saved=commit(storage,old,updated,wallet);
  return saved.ok?{ok:true,price,rarita,instanceId:updated.cards.at(-1).instanceId,
   collection:updated,inventory:wallet}:saved;
 }catch(e){return fail(e.message||'Acquisto madre non riuscito');}
}
export function evolveMotherCopy(instanceId,storage=globalThis.localStorage){
 try{
  const {old,ships,fleet,sector}=open(storage);
  const owned=ships.cards.find(x=>x.instanceId===instanceId);
  if(!owned)return fail('Carta madre non posseduta');
  const next=nextShipRarity(owned.rarita);
  if(!next)return fail('La madre è già Leggendaria');
  if(!rarityMayBeAcquired(next,nativeMotherRarity(owned.shipId),sector))
   return fail('Rarità non ancora sbloccata nella campagna');
  const price=rarityEvolutionCost('mother',next);
  if(fleet.credits<price)return fail('Crediti Stellari insufficienti');
  const updated=evolveMotherWithDuplicates(ships,instanceId);
  const wallet={...fleet,credits:fleet.credits-price};
  const saved=commit(storage,old,updated,wallet);
  return saved.ok?{ok:true,price,rarita:next,instanceId:updated.cards.at(-1).instanceId,
   collection:updated,inventory:wallet}:saved;
 }catch(e){return fail(e.message||'Evoluzione madre non riuscita');}
}
