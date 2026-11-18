// Inventario e schieramento dei supporti, INDIPENDENTI dai livelli delle madri.
// Non modifica e non migra il salvataggio delle 12 madri o delle loro 120 carte.
// Gli slot si sbloccano con traguardi di campagna permanenti, mai con i livelli.
// Le soglie di settore, i prezzi e i potenziamenti verranno collegati nei prossimi passi.
import {SUPPORT_ACTIVE_SLOTS,supportDefinition} from './supportCatalog.js';
import {SUPPORT_MAX_LEVEL,boundedSupportLevel} from './supportProgression.js';
import {isShipRarity,rarityIndex,nextShipRarity,RARITY_DUPLICATE_COPIES,nativeMotherRarity} from './shipRarity.js';

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
  const source=supportDefinition(unit.supportId);
  const minimum=source.rarita||nativeMotherRarity(source.originShipId)||'Comune';
  // Il vecchio L5 è preservato come Leggendaria soltanto per i salvataggi
  // privi della rarità. Non si reintroducono i livelli nell'Hangar.
  const historical=unit.level>=5?'Leggendaria':unit.level>=3?'Epica':
   unit.level>=2?'Rara':minimum;
  const proposed=isShipRarity(unit.rarita)?unit.rarita:historical;
  const rarita=rarityIndex(proposed)>=rarityIndex(minimum)?proposed:minimum;
  owned.push({instanceId:unit.instanceId,supportId:unit.supportId,
   level:boundedSupportLevel(unit.level),rarita});
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
// La funzione aggiorna il solo livello: prezzo/XP saranno verificati dal
// futuro servizio di miglioramento. Non assegna monete o livelli gratuiti.
export function advanceSupportLevel(collection,instanceId){
 const current=normalizeSupportCollection(collection);
 const at=current.owned.findIndex(unit=>unit.instanceId===instanceId);
 if(at<0)throw Error('Navicella di supporto non posseduta');
 if(current.owned[at].level>=SUPPORT_MAX_LEVEL)throw Error('Supporto già al livello MAX');
 const owned=current.owned.map((unit,index)=>index===at?
  {...unit,level:unit.level+1}:unit);
 return {...current,owned};
}
export function grantSupportInstance(collection,supportId,
 rarita=supportDefinition(supportId)?.rarita||nativeMotherRarity(supportDefinition(supportId)?.originShipId)){
 const definition=supportDefinition(supportId);
 if(!definition||!isShipRarity(rarita)||
  rarityIndex(rarita)<rarityIndex(definition.rarita||nativeMotherRarity(definition.originShipId)))
  throw Error('Modello o rarità supporto inesistente');
 const current=normalizeSupportCollection(collection);
 if(current.owned.length>=MAX_OWNED_SUPPORT_INSTANCES)
  throw Error('Inventario supporti pieno');
 let serial=current.serial;
 do{serial++;}while(current.owned.some(e=>e.instanceId==='escort:'+serial));
 const entry={instanceId:'escort:'+serial,supportId,level:1,rarita};
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
// Tre copie della stessa rarità: due spese, una conservata.
export function evolveSupportWithDuplicates(collection,instanceId){
 const current=normalizeSupportCollection(collection);
 const chosen=current.owned.find(x=>x.instanceId===instanceId);
 if(!chosen)throw Error('Navicella di supporto non posseduta');
 const next=nextShipRarity(chosen.rarita);
 if(!next)throw Error('Navicella già Leggendaria');
 const matching=current.owned.filter(x=>x.supportId===chosen.supportId&&
  x.rarita===chosen.rarita);
 if(matching.length<RARITY_DUPLICATE_COPIES)
  throw Error('Servono tre copie della stessa navicella e rarità');
 const spent=new Set(matching.filter(x=>x.instanceId!==instanceId)
  .slice(0,RARITY_DUPLICATE_COPIES-1).map(x=>x.instanceId));
 const survivors={...current,
  owned:current.owned.filter(x=>!spent.has(x.instanceId)),
  equipped:current.equipped.map(id=>spent.has(id)?instanceId:id)};
 return grantSupportInstance(survivors,chosen.supportId,next);
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
  return def?[{...def,instanceId:unit.instanceId,level:unit.level,rarita:unit.rarita,slot}]:[];
 });
}
