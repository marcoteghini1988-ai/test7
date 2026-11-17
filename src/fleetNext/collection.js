// Eclissi Stellare — inventario ufficiale: esclusive automatiche e Personaggi.
// I mazzi manuali sono dismessi; i vecchi dati restano nell'archivio di migrazione.
import {EXCLUSIVE_CARDS,BOSS_CARDS,bossCard,MAX_EXCLUSIVE_UPGRADE,
 eligibleExclusives,exclusiveCard,exclusiveUnlocked,shipConfig,generalCard} from './rules.js';
import {canUpgradeEffect} from './simpleEffects.js';

export const FLEET_INVENTORY_KEY='eclissi_fleet_collection_v2'; // NON azzerare i salvataggi
export const FLEET_INVENTORY_SCHEMA=4;
const copy=value=>JSON.parse(JSON.stringify(value));
const clampInt=(n,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(n)||0)));
export function createFleetInventory(){
 // Personaggio di base: settima carta per Aurora al livello 1 (sei esclusive).
 return {schema:FLEET_INVENTORY_SCHEMA,owned:{'gen-216':1},deck:[],credits:0,packsOpened:0,
  equippedMother:'N00',exclusiveUpgrades:{},claimedRewards:[],collectionHistory:[],
  retiredOwned:{},retiredDeck:null,retiredExclusiveUpgrades:{}};
}
export function normalizeFleetInventory(value){
 const starter=createFleetInventory();
 if(!value||![2,3,4].includes(value.schema))return starter;
 const owned={...starter.owned},retiredOwned={};
 const store=(id,n)=>{if(typeof id==='string'&&id.length<120&&Number.isInteger(n)&&n>=0&&n<=999)
  retiredOwned[id]=Math.max(retiredOwned[id]||0,n);};
 for(const [id,n] of Object.entries(value.retiredOwned||{}))store(id,n);
 for(const [id,n] of Object.entries(value.owned||{})){
  if((generalCard(id)||bossCard(id))&&Number.isInteger(n)&&n>=0&&n<=999)
   owned[id]=bossCard(id)?Math.min(1,n):Math.max(owned[id]||0,n);
  else store(id,n);
 }
 const candidate={...starter,owned,retiredOwned};
 const oldDeck=Array.isArray(value.deck)?value.deck:[];
 candidate.deck=[]; // il mazzo manuale non è usato dalle partite nuove
 candidate.retiredDeck=Array.isArray(value.retiredDeck)?[...value.retiredDeck]:
  oldDeck.length?[...oldDeck]:null;
 candidate.credits=clampInt(value.credits,0,1e9);
 candidate.packsOpened=clampInt(value.packsOpened,0,1e7);
 candidate.equippedMother=shipConfig(value.equippedMother)?value.equippedMother:'N00';
 const oldUpgrades={},upgrades={};
 const keep=(id,n)=>{if(typeof id==='string'&&id.length<120&&Number.isInteger(n)&&n>=1&&n<=MAX_EXCLUSIVE_UPGRADE)oldUpgrades[id]=n;};
 for(const [id,n] of Object.entries(value.retiredExclusiveUpgrades||{}))keep(id,n);
 for(const [id,n] of Object.entries(value.exclusiveUpgrades||{})){
  if(!Number.isInteger(n)||n<1||n>MAX_EXCLUSIVE_UPGRADE)continue;
  if(exclusiveCard(id))upgrades[id]=n;else keep(id,n);
 }
 candidate.exclusiveUpgrades=upgrades;
 candidate.retiredExclusiveUpgrades=oldUpgrades;
 candidate.claimedRewards=Array.isArray(value.claimedRewards)?
  [...new Set(value.claimedRewards.filter(x=>typeof x==='string'&&x.length<120))].slice(-4000):[];
 candidate.collectionHistory=Array.isArray(value.collectionHistory)?
  value.collectionHistory.filter(x=>x&&typeof x.action==='string').slice(-40):[];
 return candidate;
}
export function readFleetInventory(storage=globalThis.localStorage){
 let inventory;
 try{inventory=normalizeFleetInventory(JSON.parse(storage.getItem(FLEET_INVENTORY_KEY)||'null'));}
 catch{inventory=createFleetInventory();}
 // Importazione in sola lettura dei trofei ottenuti con vittorie precedenti.
 // Non modifica la collezione storica e non sblocca carte non possedute.
 try{
  const legacy=JSON.parse(storage.getItem('eclissi_special_collection_v1')||'null');
  if(legacy?.schemaVersion===1)for(const id of Object.keys(BOSS_CARDS))
   if(Number.isInteger(legacy.owned?.[id])&&legacy.owned[id]>0)inventory.owned[id]=1;
 }catch{/* Un archivio non leggibile non cancella i trofei già migrati. */}
 return inventory;
}
export function writeFleetInventory(inventory,storage=globalThis.localStorage){
 const safe=normalizeFleetInventory(inventory);
 storage.setItem(FLEET_INVENTORY_KEY,JSON.stringify(safe));
 return safe;
}
const record=(inventory,action,note)=>{
 const result=copy(inventory);
 result.collectionHistory=[...(result.collectionHistory||[]),{action,note}].slice(-40);
 return result;
};
export function selectFleetMother(inventory,shipId,ownedShips=[]){
 if(!shipConfig(shipId))return {ok:false,reason:'Navicella inesistente',inventory};
 if(ownedShips.length&&!ownedShips.includes(shipId))
  return {ok:false,reason:'Navicella non posseduta',inventory};
 const next=record(inventory,'ship','Madre '+shipId);
 next.equippedMother=shipId;
 return {ok:true,inventory:next};
}
export function exclusiveUpgradeCost(nextGrade){
 return [0,0,160,420][nextGrade]||Infinity;
}
export function upgradeFleetExclusive(inventory,cardId,shipId,shipLevel){
 const c=EXCLUSIVE_CARDS[cardId];
 if(!c||c.shipId!==shipId||c.playable===false)return {ok:false,reason:'Carta esclusiva non ancora utilizzabile',inventory};
 const current=inventory.exclusiveUpgrades[cardId]||1;
 if(current>=MAX_EXCLUSIVE_UPGRADE)return {ok:false,reason:'Già al grado massimo',inventory};
 if(!exclusiveUnlocked(cardId,shipId,shipLevel))
  return {ok:false,reason:'Carta non ancora sbloccata dalla navicella',inventory};
 if(!canUpgradeEffect(c,current))
  return {ok:false,reason:'Questo effetto è già al massimo: nessun costo applicato',inventory};
 const nextGrade=current+1;
 if(shipLevel<(nextGrade===2?3:5))
  return {ok:false,reason:'Livello navicella insufficiente',inventory};
 const cost=exclusiveUpgradeCost(nextGrade);
 if(inventory.credits<cost)return {ok:false,reason:'Crediti insufficienti',inventory};
 const next=record(inventory,'upgrade',c.name+' grado '+nextGrade);
 next.credits-=cost;next.exclusiveUpgrades[cardId]=nextGrade;
 return {ok:true,inventory:next,spent:cost,grade:nextGrade};
}
export function claimFleetReward(inventory,uniqueKey,amount){
 if(typeof uniqueKey!=='string'||!uniqueKey||uniqueKey.length>120)return {ok:false,reason:'Ricompensa non valida',inventory};
 if(inventory.claimedRewards.includes(uniqueKey))
  return {ok:false,reason:'Ricompensa già riscattata',inventory};
 if(!Number.isInteger(amount)||amount<0||amount>10000)
  return {ok:false,reason:'Crediti ricompensa non validi',inventory};
 const next=record(inventory,'reward',uniqueKey);
 next.credits=Math.min(1e9,next.credits+amount);
 next.claimedRewards.push(uniqueKey);
 return {ok:true,inventory:next,credits:amount};
}
export function fleetRewardForBattle({winner,mode='campaign',sector=1,boss=false}){
 if(winner!=='A')return 15;
 const tier=clampInt(sector,1,120);
 return 45+Math.min(75,Math.floor(tier/4))+(boss?60:0)+(mode==='pvp'?20:0);
}
export function usableFleetExclusives(inventory,shipId,level){
 return eligibleExclusives(shipId,level).filter(def=>def.playable!==false)
  .map(def=>({...def,grade:inventory.exclusiveUpgrades[def.id]||1}));
}
export function inventorySummary(inv){
 return {cards:Object.keys(inv.owned).length,copies:Object.values(inv.owned).reduce((s,x)=>s+x,0),
  credits:inv.credits,deckSize:inv.deck.length,upgradedExclusives:Object.keys(inv.exclusiveUpgrades).length};
}
