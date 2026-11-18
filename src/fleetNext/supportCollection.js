// Inventario e schieramento dei supporti, INDIPENDENTI dai livelli delle madri.
// Non modifica e non migra il salvataggio delle 17 madri o quello delle carte.
// Gli slot si sbloccano con traguardi di campagna permanenti, mai con i livelli.
// Le soglie di settore, i prezzi e i potenziamenti verranno collegati nei prossimi passi.
import {SUPPORT_ACTIVE_SLOTS,supportDefinition} from './supportCatalog.js';

export const SUPPORT_COLLECTION_KEY='eclissi_support_collection_v1';
export const SUPPORT_COLLECTION_SCHEMA=1;
const MAX_OWNED_SUPPORT_INSTANCES=500;
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=120;

export function createSupportCollection(){
 return {schemaVersion:SUPPORT_COLLECTION_SCHEMA,serial:0,owned:[],
  unlockedSlots:0,claimedMilestones:[],equipped:[null,null]};
}
export function normalizeSupportCollection(input){
 if(input==null)return createSupportCollection();
 if(typeof input!=='object'||Array.isArray(input)||
  input.schemaVersion!==SUPPORT_COLLECTION_SCHEMA)
  throw Error('Versione inventario supporti non compatibile');
 const owned=[],used=new Set();
 for(const unit of Array.isArray(input.owned)?input.owned:[]){
  if(owned.length===MAX_OWNED_SUPPORT_INSTANCES)break;
  if(!validId(unit?.instanceId)||!supportDefinition(unit?.supportId)||
   used.has(unit.instanceId))continue;
  used.add(unit.instanceId);
  owned.push({instanceId:unit.instanceId,supportId:unit.supportId,
   level:Number.isInteger(unit.level)?Math.max(1,Math.min(99,unit.level)):1});
 }
 const slots=Number.isInteger(input.unlockedSlots)?
  Math.max(0,Math.min(SUPPORT_ACTIVE_SLOTS,input.unlockedSlots)):0;
 const claimedMilestones=[...new Set((Array.isArray(input.claimedMilestones)?
  input.claimedMilestones:[]).filter(validId))].slice(0,100);
 const selected=new Set();
 const equipped=Array.from({length:SUPPORT_ACTIVE_SLOTS},(_,slot)=>{
  const candidate=Array.isArray(input.equipped)?input.equipped[slot]:null;
  if(slot>=slots||!used.has(candidate)||selected.has(candidate))return null;
  selected.add(candidate);return candidate;
 });
 return {schemaVersion:SUPPORT_COLLECTION_SCHEMA,
  serial:Math.max(Number.isSafeInteger(input.serial)&&input.serial>=0?input.serial:0,
   owned.length),owned,unlockedSlots:slots,claimedMilestones,equipped};
}
export function readSupportCollection(storage=globalThis.localStorage){
 const raw=storage?.getItem(SUPPORT_COLLECTION_KEY);
 return normalizeSupportCollection(raw?JSON.parse(raw):null);
}
export function writeSupportCollection(collection,storage=globalThis.localStorage){
 const value=normalizeSupportCollection(collection);
 storage.setItem(SUPPORT_COLLECTION_KEY,JSON.stringify(value));
 return value;
}
export function grantSupportInstance(collection,supportId){
 if(!supportDefinition(supportId))throw Error('Modello supporto inesistente');
 const current=normalizeSupportCollection(collection);
 if(current.owned.length>=MAX_OWNED_SUPPORT_INSTANCES)
  throw Error('Inventario supporti pieno');
 let serial=current.serial;
 do{serial++;}while(current.owned.some(e=>e.instanceId==='escort:'+serial));
 const entry={instanceId:'escort:'+serial,supportId,level:1};
 return {...current,serial,owned:[...current.owned,entry]};
}
export function claimSupportSlotMilestone(collection,campaignMilestone){
 const current=normalizeSupportCollection(collection);
 if(!validId(campaignMilestone)||!campaignMilestone.startsWith('campaign:'))
  throw Error('Sblocco supporto: serve un traguardo della campagna');
 if(current.claimedMilestones.includes(campaignMilestone))return current;
 // Un traguardo non può creare due slot né essere ripetuto.
 const nextSlots=Math.min(SUPPORT_ACTIVE_SLOTS,current.unlockedSlots+1);
 return {...current,unlockedSlots:nextSlots,
  claimedMilestones:[...current.claimedMilestones,campaignMilestone].slice(-100)};
}
export function equipSupportInstance(collection,slot,instanceId){
 const current=normalizeSupportCollection(collection);
 if(!Number.isInteger(slot)||slot<0||slot>=SUPPORT_ACTIVE_SLOTS||
  slot>=current.unlockedSlots)
  throw Error('Slot supporto non ancora sbloccato dalla campagna');
 if(instanceId!==null&&!current.owned.some(e=>e.instanceId===instanceId))
  throw Error('Supporto non posseduto');
 if(instanceId!==null&&current.equipped.some((id,index)=>
  index!==slot&&id===instanceId))
  throw Error('La stessa copia non può occupare due slot');
 const equipped=[...current.equipped];equipped[slot]=instanceId;
 return {...current,equipped};
}
export function equippedSupportRoster(collection){
 const current=normalizeSupportCollection(collection);
 return current.equipped.flatMap((instanceId,slot)=>{
  const unit=current.owned.find(e=>e.instanceId===instanceId);
  const def=unit&&supportDefinition(unit.supportId);
  return def?[{...def,instanceId:unit.instanceId,level:unit.level,slot}]:[];
 });
}
