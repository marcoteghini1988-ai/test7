// Eclissi Stellare — collezione generalista e mazzi personalizzati.
// Salvataggio indipendente dai vecchi 24 speciali: mai eliminare o sovrascrivere
// la collezione legacy, prima di una migrazione verificata.
import {
 GENERAL_CARDS,EXCLUSIVE_CARDS,STARTER_DECK,PREMADE_DECKS,CARD_PRICES,
 RARITY_COPY_LIMIT,PACK_PRICE,PACK_SIZE,FLEET_BASE_DECK_SIZE,
 MAX_EXCLUSIVE_UPGRADE,deckFromCounts,countDeck,validateBaseDeck,
 eligibleExclusives,exclusiveCard,shipConfig,generalCard
} from './rules.js';

export const FLEET_INVENTORY_KEY='eclissi_fleet_collection_v2';
export const FLEET_INVENTORY_SCHEMA=2;
const copy=value=>JSON.parse(JSON.stringify(value));
const starterCards=()=>deckFromCounts(STARTER_DECK.carteGenerali);
const clampInt=(n,min,max)=>Math.max(min,Math.min(max,Math.floor(Number(n)||0)));
export function createFleetInventory(){
 const deck=starterCards();
 if(deck.length!==FLEET_BASE_DECK_SIZE)throw Error('Mazzo iniziale incompleto');
 return {schema:FLEET_INVENTORY_SCHEMA,owned:countDeck(deck),deck,
  credits:0,packsOpened:0,equippedMother:'N00',
  exclusiveUpgrades:{},claimedRewards:[],collectionHistory:[]};
}
export function normalizeFleetInventory(value){
 const starter=createFleetInventory();
 if(!value||value.schema!==FLEET_INVENTORY_SCHEMA)return starter;
 const owned={...starter.owned};
 for(const [id,n] of Object.entries(value.owned||{})){
  if(generalCard(id)&&Number.isInteger(n)&&n>=0&&n<=999)owned[id]=Math.max(owned[id]||0,n);
 }
 const candidate={...starter,owned};
 const raw=Array.isArray(value.deck)?value.deck:starter.deck;
 candidate.deck=validateBaseDeck(raw,{owned}).valid?[...raw]:starter.deck;
 candidate.credits=clampInt(value.credits,0,1e9);
 candidate.packsOpened=clampInt(value.packsOpened,0,1e7);
 candidate.equippedMother=shipConfig(value.equippedMother)?value.equippedMother:'N00';
 candidate.exclusiveUpgrades=Object.fromEntries(Object.entries(value.exclusiveUpgrades||{})
  .filter(([id,n])=>exclusiveCard(id)&&Number.isInteger(n)&&n>=1&&n<=MAX_EXCLUSIVE_UPGRADE));
 candidate.claimedRewards=Array.isArray(value.claimedRewards)?
  [...new Set(value.claimedRewards.filter(x=>typeof x==='string'&&x.length<120))].slice(-4000):[];
 candidate.collectionHistory=Array.isArray(value.collectionHistory)?
  value.collectionHistory.filter(x=>x&&typeof x.action==='string').slice(-40):[];
 return candidate;
}
export function readFleetInventory(storage=globalThis.localStorage){
 try{return normalizeFleetInventory(JSON.parse(storage.getItem(FLEET_INVENTORY_KEY)||'null'));}
 catch{return createFleetInventory();}
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
export function equipFleetBaseDeck(inventory,deck){
 const valid=validateBaseDeck(deck,inventory);
 if(!valid.valid)return {ok:false,reason:valid.reason,inventory};
 const next=record(inventory,'equip','Mazzo personalizzato');
 next.deck=[...deck];
 return {ok:true,inventory:next};
}
export function selectFleetMother(inventory,shipId,ownedShips=[]){
 if(!shipConfig(shipId))return {ok:false,reason:'Navicella inesistente',inventory};
 if(ownedShips.length&&!ownedShips.includes(shipId))
  return {ok:false,reason:'Navicella non posseduta',inventory};
 const next=record(inventory,'ship','Madre '+shipId);
 next.equippedMother=shipId;
 return {ok:true,inventory:next};
}
export function buyGeneralCard(inventory,id,amount=1){
 const c=generalCard(id);
 if(!c||!Number.isInteger(amount)||amount<1||amount>50)
  return {ok:false,reason:'Carta o quantità non valida',inventory};
 const price=CARD_PRICES[c.rarita]*amount;
 if(inventory.credits<price)return {ok:false,reason:'Crediti insufficienti',inventory};
 if((inventory.owned[id]||0)+amount>999)
  return {ok:false,reason:'Limite inventario raggiunto',inventory};
 const next=record(inventory,'buy',c.nome+' x'+amount);
 next.credits-=price;
 next.owned[id]=(next.owned[id]||0)+amount;
 return {ok:true,inventory:next,spent:price,received:{[id]:amount}};
}
export function buyPrebuiltDeck(inventory,premadeId){
 const preset=PREMADE_DECKS.find(x=>x.id===premadeId);
 if(!preset)return {ok:false,reason:'Mazzo preconfigurato inesistente',inventory};
 const delta={};let cost=0;
 for(const [id,count] of Object.entries(preset.carteGenerali)){
  const card=generalCard(id);
  if(!card)return {ok:false,reason:'Carta inesistente in '+preset.nome,inventory};
  const missing=Math.max(0,count-(inventory.owned[id]||0));
  if(missing){delta[id]=missing;cost+=CARD_PRICES[card.rarita]*missing;}
 }
 if(inventory.credits<cost)return {ok:false,reason:'Crediti insufficienti: servono '+cost,inventory};
 const next=record(inventory,'premade',preset.nome);
 next.credits-=cost;
 for(const [id,n] of Object.entries(delta))next.owned[id]=(next.owned[id]||0)+n;
 next.deck=deckFromCounts(preset.carteGenerali);
 const valid=validateBaseDeck(next.deck,next);
 if(!valid.valid)return {ok:false,reason:valid.reason,inventory};
 return {ok:true,inventory:next,spent:cost,received:delta};
}
function secureRandom(rng){return Math.max(0,Math.min(0.999999999,Number(rng())||0));}
function drawRarity(rng){
 const n=secureRandom(rng);
 return n<.65?'Comune':n<.90?'Rara':n<.98?'Epica':'Leggendaria';
}
const PACK_POOL=Object.freeze(Object.groupBy(Object.values(GENERAL_CARDS),c=>c.rarita));
export function buyFleetPack(inventory,rng=Math.random){
 if(inventory.credits<PACK_PRICE)return {ok:false,reason:'Crediti insufficienti',inventory};
 const cards=Array.from({length:PACK_SIZE},()=>{
  const rarity=drawRarity(rng),pool=PACK_POOL[rarity];
  return pool[Math.floor(secureRandom(rng)*pool.length)].id;
 });
 const next=record(inventory,'pack','Busta da '+PACK_SIZE+' carte');
 next.credits-=PACK_PRICE;next.packsOpened++;
 for(const id of cards)next.owned[id]=(next.owned[id]||0)+1;
 return {ok:true,inventory:next,spent:PACK_PRICE,cards};
}
export function exclusiveUpgradeCost(nextGrade){
 return [0,0,160,420][nextGrade]||Infinity;
}
export function upgradeFleetExclusive(inventory,cardId,shipId,shipLevel){
 const c=EXCLUSIVE_CARDS[cardId];
 if(!c||c.shipId!==shipId)return {ok:false,reason:'Carta esclusiva non compatibile',inventory};
 const current=inventory.exclusiveUpgrades[cardId]||1;
 if(current>=MAX_EXCLUSIVE_UPGRADE)return {ok:false,reason:'Già al grado massimo',inventory};
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
 return eligibleExclusives(shipId,level).map(def=>({...def,grade:inventory.exclusiveUpgrades[def.id]||1}));
}
export function inventorySummary(inv){
 return {cards:Object.keys(inv.owned).length,copies:Object.values(inv.owned).reduce((s,x)=>s+x,0),
  credits:inv.credits,deckSize:inv.deck.length,upgradedExclusives:Object.keys(inv.exclusiveUpgrades).length};
}
